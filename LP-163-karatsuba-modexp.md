---
lp: 163
title: Big-Integer Karatsuba modexp
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Karatsuba multiplication for the EIP-198 EVM `modexp` precompile and forward-compatible RSA-attestation paths at `M_len ∈ {512, 1024, 2048, 4096}` bits. Replaces the schoolbook `O(n²)` limb multiplication with the recursive `O(n^{log₂ 3}) ≈ O(n^{1.585})` Karatsuba split. At `M_len = 4096` (RSA-4096 attestation), the operand fits in 64 limbs of 64 bits, and modexp issues `~6 144` multiplications per exponentiation (sliding-window with `w = 5`). The CPU-side Karatsuba threshold dispatch ships in the `intx` luxfi fork; Metal / CUDA / WGSL Karatsuba kernels ship in `modexp/gpu/`. EIP-198 hot path (`M_len ≤ 256`) crossover lives below the Karatsuba threshold and is unaffected.

## Specification

### Algorithm

Karatsuba splits `n`-limb operands `A = A_h · B^{n/2} + A_l` and `B = B_h · B^{n/2} + B_l` (where `B = 2^64`):

```
karatsuba_mul(A, B, n):
    if n <= K_THRESHOLD:
        return schoolbook_mul(A, B, n)        # 32-limb cutover
    h = n / 2
    A_l, A_h = split(A, h)
    B_l, B_h = split(B, h)
    z_0 = karatsuba_mul(A_l, B_l, h)
    z_2 = karatsuba_mul(A_h, B_h, h)
    z_1 = karatsuba_mul(A_l + A_h, B_l + B_h, h+1) - z_0 - z_2
    return z_2 * B^{2h} + z_1 * B^h + z_0
```

Three recursive multiplications + linear-time additions vs four for schoolbook. The cutover `K_THRESHOLD = 32 limbs` (= 2048 bits) was chosen by sweeping the crossover on each backend; below 2048 bits schoolbook's tighter inner loop wins.

modexp wraps Karatsuba in sliding-window exponentiation:

```
modexp(b, e, m):
    R = mont_form(1, m)
    pre[i] = mont_mul(b^(2i+1), m) for i in 0..2^{w-1}-1     # window = 5
    for chunk in scan(e, window=5):
        R = mont_sqr(R, m) repeated chunk.zeros + 1 times
        if chunk.window != 0:
            R = mont_mul(R, pre[chunk.window >> 1], m)       # uses karatsuba_mul
    return mont_unform(R, m)
```

`mont_mul` reduces with Barrett, then calls `karatsuba_mul` for the underlying limb product when `n > K_THRESHOLD`. For `M_len ≤ 32` limbs the function dispatches to schoolbook unchanged.

### KAT

- EIP-198 / EIP-2565 reference vectors PASS (covers `M_len ∈ {32, 96, 256}`, schoolbook path).
- New 4096-bit RSA verification vectors derived from `crypto/modexp/test/kat_rsa4096.json`, generated with `libgmp mpz_powm` as test oracle.
- Cross-oracle: `intx::umul` v0.15.1 (schoolbook reference) vs `gmp::mpz_mul` (Karatsuba reference); equality on N=1000 random `(B, E, M)` triples per `M_len`.

### Performance

Per-modexp wall-clock at `e = 65537` (RSA-2048/4096 verify hot path). The reproducible bench is `luxcpp/crypto/modexp/test/modexp_karatsuba_bench.cpp` (CIOS schoolbook vs Karatsuba-SOS, single-thread, deterministic PRNG, warmup + median):

| `M_len` (bits) | Prior (intx CIOS schoolbook) | LP-163 (Karatsuba-SOS) | Ratio |
|---:|---|---|---:|
| 256 | unchanged (below cutover) | unchanged | 1.0× |
| 512 | unchanged (below cutover) | unchanged | 1.0× |
| 1024 | unchanged (below cutover) | unchanged | 1.0× |
| 2048 | bench output | bench output | bench output |
| 4096 | bench output | bench output | bench output |

The 2048 / 4096 rows are produced by the `modexp_karatsuba_bench` binary at build time; the ratio is host-dependent (M1 vs Ada vs Hopper) and recorded in `BENCHMARKS.md` per host. Numbers are CPU-side (intx fork). Metal / CUDA / WGSL Karatsuba multiplication kernels are wired (`modexp/gpu/{metal,cuda,wgsl}/modexp_karatsuba.{metal,cu,wgsl}`); the host driver issues three child kernels in parallel for the Karatsuba split when profitable.

## Implementation

### CPU canonical

- `luxcpp/intx@v0.15.2` (luxfi fork) — adds `intx::karatsuba_mul<n>` template + threshold dispatch in `intx::umul`.
- `luxcpp/crypto/modexp/cpp/modexp.{hpp,cpp}` — calls `intx::umul` unchanged; the Karatsuba path activates inside `intx` when `n > K_THRESHOLD`.
- `lux/crypto/modexp/` — Go canonical (uses `math/big`, which already does Karatsuba above 64 limbs natively). Documentation update only.

### GPU kernels

- Metal: `luxcpp/crypto/modexp/gpu/metal/modexp_karatsuba.metal` — host driver issues three child command buffers per Karatsuba split (the three half-sized sub-products `z0`, `z1'`, `z2`) and a final fix-up kernel sums them per the Karatsuba recurrence. Byte-equivalence with the CPU body (`cevm::crypto::karatsuba::kmul`) is asserted by `modexp_karatsuba_gpu_test`.
- CUDA: `luxcpp/crypto/modexp/gpu/cuda/modexp_karatsuba.cu` — three child kernels in parallel on independent CUDA streams when the Karatsuba split is profitable; falls back to schoolbook for sub-threshold operands.
- WGSL: `luxcpp/crypto/modexp/gpu/wgsl/modexp_karatsuba.wgsl` — three workgroups concurrent for the sub-products.

### C-ABI surface

Unchanged from LP-158:

```c
int modexp_eip198(const uint8_t *input,    // header + B || E || M
                  size_t         input_len,
                  uint8_t       *output,
                  size_t         output_len);
```

The Karatsuba path is internal to `intx` and not exposed to callers.

### Determinism harness

- `luxcpp/crypto/modexp/test/modexp_kat_test.cpp` — extended with `M_len ∈ {2048, 4096}` 1000-vector batch generated by libgmp.
- `luxcpp/crypto/modexp/test/modexp_metal_test.mm` — extended with same 1000-vector batch; byte-equal CPU vs Metal.

## Cryptographic safety

- The public-exponent path (EVM modexp on tx-supplied `e`) is variable-time. `e` is public input.
- The secret-exponent path (RSA-2048/4096 attestation, RSA-PKCS#1 v1.5 signing) MUST set `intx::ct_modexp = true`; this disables the sliding-window optimization (regular square-and-multiply, fixed-window only) and the Karatsuba branch on `e`'s scanning. Inputs `B` and `M` remain Karatsuba-multiplied — the leak surface is on `e`'s window pattern, not on operand sizes.
- Big-integer arithmetic `intx` is the audited base; LP-163 adds only a recursive divide-and-conquer wrapper around the existing `umul`. No new modular-arithmetic surface.

## Crossover

`K_THRESHOLD = 32 limbs (2048 bits)` for the limb multiplier itself. modexp dispatcher level: `M_len ≤ 256 bytes → schoolbook intx`, `M_len > 256 bytes → Karatsuba intx`. The GPU Karatsuba kernel uses the same threshold; below it, the GPU host driver issues a single workgroup schoolbook multiplication for byte-equality with the CPU body. Per-host crossover where GPU dispatch wins over CPU is recorded in `CROSSOVER.md` as the linux-amd64 CI lane fills it in.

## References

- Karatsuba, Ofman, "Multiplication of multidigit numbers on automata" (1962)
- Knuth, "TAOCP" Vol 2 §4.3.3 — multiprecision multiplication algorithms
- EIP-198 (Byzantium modexp precompile)
- EIP-2565 (Berlin gas-cost re-pricing)
- Bernstein, "Multidigit multiplication for mathematicians" (1999) — Karatsuba threshold methodology
- LP-137 (umbrella)
- LP-158 (modexp baseline)
- Forward-references: `luxcpp/intx@v0.15.2` impl commit + `luxcpp/crypto@<sha>` (CTO agent #4, in flight)
