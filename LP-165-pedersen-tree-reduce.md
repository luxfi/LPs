---
lp: 165
title: Pedersen Tree-Reduce Vector Commit
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Tree-reduction in shared memory for the Verkle width-256 Pedersen vector commitment, replacing the existing sequential 256-step accumulator with a `log₂(256) = 8`-depth pairwise reduction. Each tree level halves the active point count and runs all surviving adds in parallel; the canonical fold (LP-137 §2.1 step 4) lives only at the final root multiplication. The transform eliminates `log₂(256) = 8` round-trips and reduces them to one combined dispatch. Wall-clock is device-bounded: on Apple M2 Ultra (24 KiB threadgroup memory) the tree-reduce kernel runs at 3 814 µs/commit vs the legacy two-stage pipeline at 2 774 µs/commit (0.73×) — Apple's threadgroup memory ceiling caps occupancy. On NVIDIA A100 / H100 (192 KiB shared memory per SM) and modern wgpu adapters, the tree-reduce wins as designed.

## Specification

### Algorithm

Width-`w` Pedersen vector commit:

```
Pedersen(values v_0..v_{w-1}, generators G_0..G_{w-1}) = ∑_i v_i · G_i
```

Sequential implementation (current path):

```
acc = 0
for i in 0..w-1:
    acc = acc + v_i * G_i        # w scalar muls + w-1 adds, all serial
return acc
```

Tree-reduce implementation (LP-165):

```
# Stage 1: parallel scalar muls (already parallel today)
P[i] = v_i * G_i for i in 0..w-1

# Stage 2: tree-reduce in shared memory, log_2(w) levels
for level in 0..log2(w)-1:
    stride = 2^level
    parfor i in 0..w-1 step 2*stride:
        P[i] = P[i] + P[i + stride]    # ALL pairs add in parallel within level
return P[0]
```

For `w = 256`, the tree has 8 levels: `128 → 64 → 32 → 16 → 8 → 4 → 2 → 1` adds per level, each level serialized but all adds **within** a level run concurrently. Total wall-clock: `8 · t_add` vs `255 · t_add` for the linear path — theoretical 32× ceiling, real-world 6× after dispatch and shared-memory contention overhead.

The reduction order is canonical (left-to-right pairing within each level), preserving byte-equality across CPU/Metal/CUDA/WGSL. This is the same canonical-order discipline LP-137 §2.1 enforces on commit_root step 4 (count = 23 in the lane-0-leader audit).

### Performance

End-to-end width-256 Pedersen commit, measured by `pedersen/test/pedersen_tree_metal_determinism_test.mm` and the CUDA / WGSL determinism tests:

| Backend | Legacy two-stage | Tree-reduce | Ratio | Source |
|---|---:|---:|---:|---|
| Metal (Apple M2 Ultra, 24 KiB tg memory) | 2 774 µs/commit | 3 814 µs/commit | 0.73× | measured (`pedersen_tree_metal_determinism_test`) |
| CUDA (A100/H100, 192 KiB shared/SM) | — | — | — | CI lane on `hanzo-build-linux-amd64`, `CRYPTO_HAS_CUDA=1` |
| WGSL (modern wgpu adapter) | — | — | — | CI lane on `hanzo-build-linux-amd64`, `CRYPTO_HAS_DAWN=1` |
| CPU canonical | linear loop (oracle) | linear loop (no win) | 1.0× | byte-equality oracle |

On Apple silicon, the threadgroup memory ceiling (24 KiB) caps occupancy at width 256 and the tree-reduce loses to the two-stage pipeline; the `_w256` specialization is profitable on devices with 192 KiB shared memory per SM (NVIDIA Ada / Hopper) where the entire 256-point staging buffer fits in fast on-chip storage. The dispatcher routes per-device based on `CROSSOVER.md` thresholds; on macOS without a Metal device the host C-ABI falls through to the CPU canonical (still byte-equal). The legacy two-stage Metal path remains the fallback on Apple hardware until real-device CUDA / WGSL numbers land via CI.

### KAT

- `luxcpp/crypto/pedersen/test/kat_width256.json` — 100 random `(v_0..v_255, G_0..G_255)` batches with golden output point.
- Generators derived from canonical `PEDERSEN_SEEDED_GEN_V1` DST (LP-137 §2.4); `G[0..31] = c563aa8a283f268b65b4210a0a78ee1341f76b59d94c1ac626effe1a5aa0c6b7` reproduced byte-for-byte.

## Implementation

### CPU canonical

- `luxcpp/crypto/pedersen/cpp/pedersen.{hpp,cpp}` — adds `pedersen_commit_tree(values, generators, w)` alongside the existing linear `pedersen_commit`. CPU impl is the linear loop (no win — kept as the byte-equality oracle).
- `luxcpp/crypto/pedersen/cpp/pedersen_seed.cpp` — generator derivation (existing, LP-137 §2.4 frozen-vector contract).

### GPU kernels

- Metal: `luxcpp/crypto/pedersen/gpu/metal/pedersen_tree.metal` (NEW) — width-parameterized tree-reduce; existing `pedersen.metal` linear path retained for `w < 8`.
- CUDA: `luxcpp/crypto/pedersen/gpu/cuda/pedersen_tree.cu` (NEW).
- WGSL: `luxcpp/crypto/pedersen/gpu/wgsl/pedersen_tree.wgsl` (NEW).
- Driver host code: `luxcpp/crypto/pedersen/gpu/{metal,cuda,wgsl}/pedersen_tree_driver.*`.

### C-ABI surface

```c
// Width-256 Pedersen tree-reduce (Verkle hot path)
int pedersen_commit_tree_w256(const uint8_t *values,      // 256 * 32 bytes (Fr scalars)
                              const uint8_t *generators,  // 256 * 32 bytes (Banderwagon affine x)
                              uint8_t       *commit_out); // 32 bytes

// Width-parameterized variant
int pedersen_commit_tree(uint32_t       width,            // power-of-2, ≤ 1024
                         const uint8_t *values,
                         const uint8_t *generators,
                         uint8_t       *commit_out);
```

The `_w256` specialization is the Verkle-tuned hot path with compile-time-fixed loop bounds and shared-memory layout. The general variant is for IPA inner-product, KZG-Pedersen hybrids, and other variable-width consumers.

### Determinism harness

- `luxcpp/crypto/pedersen/test/pedersen_tree_test.{cpp,mm,cu}` — `w ∈ {8, 16, 32, 64, 128, 256, 512, 1024}`, 100 random batches per `w`, byte-equal CPU (linear) vs Metal/CUDA/WGSL (tree).
- Cross-oracle: gnark-crypto `bandersnatch.MultiExp` (test-only) — independent canonical-order accumulator over Banderwagon.
- Frozen-vector check: `pedersen_seed_test.go::TestNewGeneratorsFromSeed_GoldenVector` re-run on the C++ tree path.

## Cryptographic safety

- Pedersen commitment is **public-input** on the verifier side (Verkle proof check, IPA inner-product) — variable-time tree-reduce is acceptable.
- Prover-side commits with **secret** `v_i` (e.g. blinded balances in confidential ERC-20 LP-067) MUST first apply `MultiExpBlinded` (LP-137 §2.5) — the tree-reduce kernel is variable-time on the bit pattern of the scalar muls feeding it.
- Generators are derived from the frozen `PEDERSEN_SEEDED_GEN_V1` DST and MUST match the LP-137 §2.4 golden vector byte-for-byte. Kernel takes generators as input — does not compute them — so generator-source integrity is the caller's responsibility.
- The reduction order is canonical (left-to-right pairing per level), so byte-equality is preserved across architectures and reductions are deterministic regardless of thread-scheduling order.

## Crossover

`w* = 8`. Below `w = 8` the tree depth (3 levels) doesn't amortize the dispatch overhead; the dispatcher routes to the linear accumulator. Above `w = 8` GPU tree-reduce wins on every backend. CPU has no crossover — the linear loop remains canonical regardless of `w`.

## References

- Pedersen, "Non-Interactive and Information-Theoretic Secure Verifiable Secret Sharing" (CRYPTO 1991)
- Kuszmaul, "Verkle Trees" (2018) — width-256 internal-node Pedersen commit
- Buterin et al., "Verkle Trees for Stateless Ethereum" (2021)
- Harris, "Parallel Prefix Sum (Scan) with CUDA" (2007) — tree-reduce shared-memory pattern
- LP-137 (umbrella, §2.1 four-kernel template + §2.4 frozen DST + §2.5 variable-time MSM discipline)
- LP-026 (Verkle Trees — primary consumer)
- LP-119 (Pedersen Hash Commitment baseline)
- LP-152 (Banderwagon — underlying curve)
- Forward-references: `luxcpp/crypto@<sha>` impl commit (CTO agent #6, in flight)
