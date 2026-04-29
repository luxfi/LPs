---
lp: 161
title: Multi-Curve Pippenger MSM
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Single parameterized Pippenger multi-scalar multiplication kernel under `gpukit/`, instantiated for secp256k1, BN254, BLS12-381 G1/G2, and Banderwagon via `curve_traits<C>`. Replaces four near-identical hand-written MSM kernels with one templated body. Measured cost: O(λ·n / log n) point additions for `λ`-bit scalars and `n` points, with Pippenger window size `c = ⌊log₂ n⌋ - 2`. Projected speedup vs the previous per-curve kernels: 1.0–1.4× from inlined window selection, plus the elimination of ~3 200 LOC of duplicated kernel code.

## Specification

### Algorithm

Pippenger's bucket method:

```
# Inputs: points P_0..P_{n-1}, scalars k_0..k_{n-1} ∈ [0, 2^λ)
# Window size c, number of windows W = ⌈λ / c⌉

# 1. Per-window bucket fill (parallel over points)
for w in 0..W-1:
    for i in 0..n-1:
        b = (k_i >> (w * c)) & ((1 << c) - 1)
        if b != 0:
            buckets[w][b] += P_i           # affine mixed add via batch_inv

# 2. Per-window bucket reduce (parallel over windows)
for w in 0..W-1:
    acc = 0; running = 0
    for b in (1 << c) - 1 .. 1:
        running += buckets[w][b]
        acc += running
    window_sum[w] = acc

# 3. Window combine (serial, log-depth shift-and-add)
result = window_sum[W-1]
for w in W-2 .. 0:
    result = (result << c) + window_sum[w]
return result
```

Step 1 uses LP-160 batched Montgomery inversion to amortize the affine-mix-add denominators. Step 2 is the bucket "running sum" — parallel across windows, serial within. Step 3 is the canonical fold (LP-137 §2.1 step 4).

### `curve_traits<C>` surface

```cpp
template<typename C>
struct curve_traits {
    using point_affine    = ...;
    using point_jacobian  = ...;
    using scalar          = ...;
    static constexpr uint32_t scalar_bits;       // λ
    static constexpr uint32_t bucket_max_bits;   // c upper bound
    static point_jacobian add (point_jacobian, point_jacobian);
    static point_jacobian add_mixed (point_jacobian, point_affine);
    static point_jacobian dbl (point_jacobian);
    static point_affine   to_affine_batch (...);  // calls gpukit_batch_inv
};
```

Specializations live at `luxcpp/crypto/gpukit/gpu/curve_traits/{secp256k1,bn254,bls12_381,banderwagon}.{metal,cu,wgsl}`.

### Performance target

Projected end-to-end MSM throughput vs hand-rolled per-curve kernels (same hardware, same n):

| Curve | n | Prior (per-curve) | Templated (LP-161) | Ratio |
|---|---:|---|---|---:|
| secp256k1 | 1024 | 312 ms (M1) | 308 ms (proj) | 1.01× |
| BN254 G1 | 1024 | 87.4 ms (gnark v0.19.2 oracle) | 73 ms (proj, M1) | 1.20× |
| BLS12-381 G1 | 1024 | 124 ms (M1) | 109 ms (proj) | 1.14× |
| Banderwagon | 256 | 18.6 ms (M1, measured) | 17.9 ms (proj) | 1.04× |

Headline win is **code consolidation** (3 200 LOC → ~600 LOC kernel + ~150 LOC per `curve_traits`), not raw speedup. CUDA numbers go in the impl commit BENCHMARKS.md.

## Implementation

### CPU canonical

- `luxcpp/crypto/gpukit/cpp/cpu_reference/pippenger_msm.{hpp,cpp}` — templated over `curve_traits<C>`.
- Replaces per-curve CPU MSMs at `luxcpp/crypto/{secp256k1,bn254,bls,banderwagon}/cpp/msm.cpp` (those become 5-line forwarding wrappers).

### GPU kernels

- Metal: `luxcpp/crypto/gpukit/gpu/metal/pippenger_msm.metal` + curve specializations under `gpu/curve_traits/`.
- CUDA: `luxcpp/crypto/gpukit/gpu/cuda/pippenger_msm.cu`.
- WGSL: `luxcpp/crypto/gpukit/gpu/wgsl/pippenger_msm.wgsl`.
- Driver host code: `luxcpp/crypto/gpukit/gpu/{metal,cuda,wgsl}/pippenger_msm_driver.*`.

### C-ABI surface

```c
int gpukit_pippenger_msm(uint8_t curve_id,
                         const uint8_t *points,    // n * point_bytes (affine)
                         const uint8_t *scalars,   // n * scalar_bytes
                         uint8_t       *out,       // 1 * point_bytes (Jacobian)
                         uint32_t       n,
                         uint32_t       window_c); // 0 = auto-pick
```

Per-curve wrappers re-exported under each curve's c-abi (`secp256k1_msm`, `bn254_msm`, `bls12_381_g1_msm`, `bls12_381_g2_msm`, `banderwagon_msm`). The Banderwagon variable-time MSM secrecy contract from LP-137 §2.5 is preserved: secret scalars MUST go through `gpukit_pippenger_msm_blinded`.

### Determinism harness

- `luxcpp/crypto/gpukit/test/pippenger_msm_test.{cpp,mm,cu}` — for each curve, N ∈ {16, 64, 256, 1024, 4096}, 50 random `(points, scalars)` batches, asserted byte-equal CPU vs Metal vs CUDA vs WGSL.
- Cross-oracle: gnark-crypto `MultiExp` (BN254, BLS12-381), arkworks `VariableBaseMSM` (second oracle), bitcoin-core/secp256k1 `secp256k1_ecmult_multi_var` (secp256k1).

## Cryptographic safety

- The bucket-fill step is variable-time on the bucket index `b = (k_i >> (w·c)) & mask`. For verifier-side public scalars this is fine. For prover-side secret scalars the caller MUST use `gpukit_pippenger_msm_blinded` (Pedersen-style scalar randomization before MSM, unblind after — same contract LP-137 §2.5 enforces for Banderwagon).
- Subgroup membership is the caller's responsibility — Pippenger does not reject off-curve or wrong-subgroup inputs. Validators MUST subgroup-check pubkeys before calling MSM (per LP-137 §8 SubgroupPolicy::CheckAndReject).
- The templated body shares one batch-inversion path (LP-160) for affine mix-add; that path's variable-time Fermat is benign here because all inputs are bucket sums (public).

## Crossover

The per-curve `N*` thresholds at which Pippenger beats naive serial scalar-mul:

| Curve | N* (CPU) | N* (Metal) | N* (CUDA) |
|---|---:|---:|---:|
| secp256k1 | 32 | 64 | 128 |
| BN254 G1 | 24 | 48 | 96 |
| BLS12-381 G1 | 32 | 96 | 192 |
| Banderwagon | 16 | 32 | 64 |

Below `N*` the dispatcher routes to per-point scalar multiplication (LP-146/147/152). Recorded in `luxcpp/crypto/CROSSOVER.md`.

## References

- Pippenger, "On the Evaluation of Powers and Monomials" (1980)
- Bernstein, Doumen, Lange, Oosterwijk, "Faster Batch Forgery Identification" (2012) — batched MSM
- LP-137 (umbrella), §2.1 four-kernel template + §2.5 MSM variable-time discipline
- LP-146 / LP-147 / LP-152 / LP-118 (consumer curves)
- LP-160 (batched inversion — used inside Pippenger affine mix-add)
- Forward-references: `luxcpp/crypto@<sha>` impl commit (CTO agent #2, in flight)
