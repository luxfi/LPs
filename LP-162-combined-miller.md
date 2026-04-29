---
lp: 162
title: Combined-Pair Miller Loop
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Fused k-pair Miller loop for BLS12-381 batch pairing verification. Replaces `k` independent Miller-loop dispatches plus a separate Fp12 product reduction with a single kernel that interleaves all `k` pairs through one shared 64-step ate loop and accumulates `f_k = ∏ f_i` line-by-line. Eliminates `k − 1` Fp12 multiplications per batch and reduces dispatch overhead from `k + 1` round-trips to `1`. Measured uplift on Apple M1 Max for `k = 1024` (BridgeVM batched real pairing): **9.5×** mean (LP-137 §2.3). Pre-existing `bls_combined_miller.metal` is the Metal reference; LP-162 ports to CUDA + WGSL and parameterizes by pair count.

## Specification

### Algorithm

The BLS12-381 ate Miller loop runs over the binary expansion of `|x| = 0xD201000000010000` (NAF length 64). For a single pair `(P, Q)`:

```
f = 1
T = Q
for i in 62..0:
    f = f^2 * line(T, T, P)
    T = 2T
    if x_i == 1:
        f = f * line(T, Q, P)
        T = T + Q
```

For `k` pairs `(P_i, Q_i)`, the combined loop interleaves `k` line evaluations per Miller bit and folds them into one accumulator:

```
f = 1
T_0..T_{k-1} = Q_0..Q_{k-1}
for i in 62..0:
    f = f^2
    for j in 0..k-1:
        f = f * line(T_j, T_j, P_j)
        T_j = 2 * T_j
    if x_i == 1:
        for j in 0..k-1:
            f = f * line(T_j, Q_j, P_j)
            T_j = T_j + Q_j
```

The `k` line evaluations per bit are independent (no cross-pair dependency) and parallelize cleanly. The `f` updates are serial within a bit (one Fp12 chain) but the **same** Fp12 chain that the unfused version would do at the very end — net savings: `k − 1` extra Fp12-mul-by-Fp12 operations are eliminated, replaced by `k` Fp12-mul-by-sparse-line operations (~6× cheaper each).

### Determinism

Line accumulation order is fixed: `j = 0` first, ascending. Squaring is the same per-bit canonical squaring as single-pair Miller. Final exponentiation runs once on the combined `f`. CPU/Metal/CUDA/WGSL produce byte-equal Fp12 output; the byte-equality test runs with `k ∈ {1, 2, 4, 8, 16, 64, 256, 1024}` × `100` random `(P, Q)` batches.

### Performance

| `k` | Prior (per-pair Miller + product) | LP-162 fused | Source |
|---:|---|---|---|
| 1024 | 99 040 ms | 10 425 ms (9.50×) | BridgeVM v0.60 measured, n=1024 mean (LP-137 §2.3) |

The `k = 1024` row is the only row backed by a number on this host. Smaller `k` rows are intentionally omitted: the per-pair Miller-bit cost reduction is the same algorithmic transform but the wall-clock ratio is dispatch-overhead-bounded at small `k` and depends on the device. CUDA / WGSL real-device numbers land in `BENCHMARKS.md` from the `hanzo-build-linux-amd64` CI lane with `CRYPTO_HAS_CUDA=1` / `CRYPTO_HAS_DAWN=1`. The full bench ladder (`k ∈ {1, 2, 4, 8, 16, 64, 256, 1024}` per backend) lives in CI; this LP records only what is measured today.

## Implementation

### CPU canonical

- `luxcpp/crypto/bls/cpp/bls_combined_miller.{hpp,cpp}` — templated over `pair_count` (compile-time) and dynamic `n_pairs` (runtime fallback for k > template ceiling).
- Calls into existing `luxcpp/crypto/bls/cpp/bls_pairing.cpp` Fp12 ops; only the loop-and-accumulate skeleton is new.
- `bls_fused.cpp` (already shipped, LP-137 §2.3 reference) becomes a thin wrapper around `bls_combined_miller`.

### GPU kernels

- Metal: `luxcpp/crypto/bls/gpu/metal/bls_combined_miller.metal` (already exists, canonical Metal reference).
- CUDA: `luxcpp/crypto/bls/gpu/cuda/bls_combined_miller.cu` (NEW, port of Metal).
- WGSL: `luxcpp/crypto/bls/gpu/wgsl/bls_combined_miller.wgsl` (NEW, port of Metal).
- Driver host code at `luxcpp/crypto/bls/gpu/{metal,cuda,wgsl}/bls_combined_miller_driver.*`.

### C-ABI surface

```c
// k-pair fused Miller + final exponentiation
int bls12_381_pairing_check_batch(const uint8_t *P_pairs,   // k * 96 bytes G1 affine
                                  const uint8_t *Q_pairs,   // k * 192 bytes G2 affine
                                  uint32_t       k,
                                  uint8_t       *verdict);  // 0/1 byte

// k-pair fused Miller WITHOUT final exp (caller wants raw Fp12 product)
int bls12_381_combined_miller(const uint8_t *P_pairs,
                              const uint8_t *Q_pairs,
                              uint32_t       k,
                              uint8_t       *fp12_out);     // 576 bytes
```

### Determinism harness

- `luxcpp/crypto/bls/test/bls_combined_miller_test.{cpp,mm,cu}` — `k ∈ {1, 2, 4, 8, 16, 64, 256, 1024}`, 100 random pair batches per `k`, byte-equal CPU vs Metal vs CUDA vs WGSL.
- Cross-oracle: `blst v0.3.11` `blst_miller_loop_n` (test-only, vendored under `bls/test/cmake/blst.cmake`); arkworks `Bls12_381::multi_pairing` (second oracle).

## Cryptographic safety

- Pairs are public-input on the verification path — variable-time line evaluation is acceptable. The combined loop is **not** a constant-time primitive and MUST NOT be used to compute pairings on secret-key inputs.
- `T_j = 2 T_j` and `T_j = T_j + Q_j` updates are independent across `j`, so a malformed `Q_j` cannot influence the line evaluation for a different pair `j' != j`. Subgroup checks on every `Q_i` are still required up-front (LP-137 §8).
- Final exponentiation runs **once** on the combined `f`; this preserves the security argument from Vercauteren's optimal-ate paper because `e(P, Q) = f^{(p^12 - 1)/r}` is multiplicative — `final_exp(∏ f_i) = ∏ final_exp(f_i)` modulo the easy/hard split.

## Crossover

`k* = 2`. Below k=2 there's nothing to fuse; the dispatcher routes to single-pair Miller. Recorded in `luxcpp/crypto/CROSSOVER.md` per backend; the CTO impl commit will tune `pair_count` template specializations for `k ∈ {2, 4, 8, 16}` and fall back to dynamic for larger `k`.

## References

- Vercauteren, "Optimal Pairings" (IEEE Trans. Inf. Theory 2010)
- Costello, Lange, Naehrig, "Faster Pairing Computations on Curves with High-Degree Twists" (2010)
- Beuchat et al., "High-Speed Software Implementation of the Optimal Ate Pairing over Barreto-Naehrig Curves" (2010) — combined-pair fusion source pattern
- LP-137 (umbrella, §2.3 BLS fused 144.22× reproduction)
- LP-075 (BLS aggregate signatures — primary consumer)
- LP-110 (BLS12-381 EVM precompile)
- LP-161 (Multi-curve MSM — sibling kernel)
- Forward-references: `luxcpp/crypto@<sha>` impl commit (CTO agent #3, in flight)
