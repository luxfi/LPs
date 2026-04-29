---
lp: 160
title: Batched Montgomery Inversion (3-Backend Uniform)
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Montgomery's batched modular inversion replaces `N` independent field inversions with `1` inversion + `3·(N-1)` multiplications. The kernel was previously authored only on Metal (`secp256k1_batch_inv.metal`); LP-160 ports the algorithm to CUDA + WGSL under the canonical three-backend layout, and lifts the canonical body into `gpukit/` so every curve (secp256k1, BN254 Fp/Fr, BLS12-381 Fp/Fr, Banderwagon Fp) shares one kernel. Projected speedup vs `N` independent Fermat exponentiations: 38–55× at `N = 1024` on dGPU, 12–18× on Apple M1 (M1 dispatch overhead floor).

## Specification

### Algorithm

Given inputs `a_0, …, a_{N-1}` in a field `F_q` (Montgomery form):

```
# Forward prefix product
p_0 = a_0
for i in 1..N-1:
    p_i = p_{i-1} * a_i

# Single inversion
inv = p_{N-1}^{-1}        # one Fermat exponentiation: a^(q-2) mod q

# Backward sweep
for i in N-1 .. 1:
    out_i  = inv * p_{i-1}
    inv    = inv * a_i
out_0 = inv
```

Cost: `1 inv + 3·(N-1) muls`. For `q ≈ 2^256`, one inversion ≈ 256 squarings + ~128 multiplications under windowed Fermat; one mul ≈ 1 Montgomery REDC. Crossover happens at `N ≥ 8` on every backend; below `N = 8` the per-call dispatch overhead beats the savings.

### Determinism

The forward prefix product and backward sweep are serial chains by construction — `p_i` depends on `p_{i-1}`, and the running `inv` depends on the previous `inv`. The kernel runs as a single workgroup of one thread (lane-0-leader pattern, classified as "Batch-inversion serial chain" in LP-137 §2.1 lane-0 audit). Byte-equality across CPU/Metal/CUDA/WGSL is unconditional.

### Performance target

Projected speedup vs `N`-many independent Fermat inversions, identical curve, identical hardware:

| Backend | N=64 | N=256 | N=1024 |
|---|---:|---:|---:|
| Metal (M1 Max) | 6× | 11× | 14× (measured baseline, `secp256k1_batch_inv` 2026-02) |
| CUDA (Ada/Hopper) | 18× (proj) | 32× (proj) | 48× (proj) |
| WGSL (wgpu, RTX 4090) | 14× (proj) | 24× (proj) | 38× (proj) |

CUDA + WGSL numbers are projected from arithmetic operation count + measured per-mul throughput on each backend; final numbers go in the impl commit's BENCHMARKS.md.

## Implementation

### CPU canonical

- `luxcpp/crypto/gpukit/cpp/cpu_reference/batch_inversion.{hpp,cpp}` — parameterized over field-arithmetic primitives passed via `curve_traits<C>` (mul, sqr, inv).
- Specializations consumed by `luxcpp/crypto/secp256k1/cpp/batch_inv.hpp`, `luxcpp/crypto/bn254/cpp/batch_inv.hpp`, `luxcpp/crypto/bls/cpp/batch_inv.hpp`, `luxcpp/crypto/banderwagon/cpp/batch_inv.hpp`.

### GPU kernels

- Metal: `luxcpp/crypto/gpukit/gpu/metal/batch_inversion.metal` (canonical) + per-curve thin wrappers in `luxcpp/crypto/<curve>/gpu/metal/<curve>_batch_inv.metal`.
- CUDA: `luxcpp/crypto/gpukit/gpu/cuda/batch_inversion.cu` (canonical, exists) + per-curve `luxcpp/crypto/<curve>/gpu/cuda/<curve>_batch_inv.cu`.
- WGSL: `luxcpp/crypto/gpukit/gpu/wgsl/batch_inversion.wgsl` (canonical) + per-curve `luxcpp/crypto/<curve>/gpu/wgsl/<curve>_batch_inv.wgsl`.
- Driver host code: same dirs (`*_driver.{mm,cpp}`).

### C-ABI surface

```c
// gpukit C-ABI shim (one entry, curve_id selects parameter set)
int gpukit_batch_inv(uint8_t curve_id,
                     const uint8_t *in,    // N * field_bytes Montgomery form
                     uint8_t       *out,   // N * field_bytes Montgomery form
                     uint32_t       n);

// Per-curve thin wrappers re-exported under each curve's c-abi:
int secp256k1_batch_inv_fp(const uint8_t *in, uint8_t *out, uint32_t n);
int bn254_batch_inv_fr    (const uint8_t *in, uint8_t *out, uint32_t n);
int bls12_381_batch_inv_fp(const uint8_t *in, uint8_t *out, uint32_t n);
int banderwagon_batch_inv (const uint8_t *in, uint8_t *out, uint32_t n);
```

### Determinism harness

- `luxcpp/crypto/gpukit/test/batch_inversion_test.{cpp,mm,cu}` — N ∈ {1, 2, 8, 64, 256, 1024, 4096}, 100 random inputs each, asserted byte-equal CPU vs Metal vs CUDA vs WGSL.
- Cross-oracle: gnark-crypto `BatchInvert` (test-only) for BN254/BLS, bitcoin-core/secp256k1 `secp256k1_fe_inv_var` for secp256k1.

## Cryptographic safety

- Caller MUST ensure no input is zero — kernel does NOT check (a zero would zero the prefix product and corrupt all outputs). Callers operating on potentially-zero inputs (e.g. coordinate batches that may include the point at infinity) MUST filter beforehand.
- The single Fermat inversion is variable-time (constant-time only on `gpukit_batch_inv_ct` opt-in path); callers handling secret scalars (signing nonces, key shares) MUST use the constant-time variant or blind their inputs.
- Inputs and outputs are public for the verifier-side path (batch ECDSA verify, batch ecrecover, MSM bucket inversion); secrecy is the consumer's responsibility.

## Crossover

Below `N* = 8` the per-dispatch overhead exceeds the algorithmic savings; the dispatcher routes to the per-element CPU path. Above `N* = 8` GPU on Metal, `N* = 16` on CUDA, `N* = 32` on WGSL. The threshold is profiled per device and recorded in `luxcpp/crypto/CROSSOVER.md`.

## References

- Knuth, "TAOCP" Vol 2 §4.6.1 — modular batch inversion
- Montgomery, "Modular Multiplication Without Trial Division" (1985)
- LP-137 (umbrella, §2.1 four-kernel template + lane-0-leader audit)
- LP-146 / LP-147 / LP-152 (consumer curves)
- Forward-references: `luxcpp/crypto@<sha>` impl commit (CTO agent #1, in flight)
