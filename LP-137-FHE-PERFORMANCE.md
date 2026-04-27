# LP-137 FHE Performance — Cross-Cutting Analysis

**Date:** 2026-04-27 (revised after #121 retry).
**Hardware:** Apple M1 Max, 64 GB unified, macOS 26.4.
**Companion doc:** `/Users/z/work/lux/fhe/policy/PERFORMANCE.md` (full
benchmark data + per-finding detail).

## Executive finding (revised)

**FHE policy evaluation remains the single largest "GPU-native" gap in
the LP-137 9-chain substrate.** What changed since the original analysis:

1. The Go bridge `luxfi/lattice/v7/gpu` is now linked, the GPU-enabled C
   library is installed, and `gpu.GPUAvailable() == true` on this M1 Max
   host. G1 is closed.
2. The drop-in `Ring.NTT` dispatch (G2 in PERFORMANCE.md) is **blocked
   by a Montgomery-vs-standard form domain mismatch**, not by engineering
   effort. The Go ring stores its NTT roots in Montgomery form; the C
   library computes its own standard-form Barrett-precomputed twiddles.
   A naive dispatch silently corrupts every operation that runs in the
   NTT domain between forward and inverse. Round-trip identity passes
   (the C library is internally consistent), but `MulCoeffsMontgomery`
   in the middle of bootstrap would produce wrong output.
3. The standalone GPU NTT path (`gpu.NTTContext.NTT([poly])`) is now
   benchable end-to-end on this host. Single-poly Metal NTT is **12×
   slower** than Go pure-Go at every N from 1024 to 16384. Only the
   batched path could win, and that path **SIGSEGVs** at every tested
   batch size. The 14× claim from `luxcpp/crypto/CROSSOVER.md` cannot be
   reproduced here until the BatchNTT bug is fixed in `luxcpp/lattice`.

Per `LP-137-PARALLELIZATION.md` and `luxcpp/crypto/CROSSOVER.md`:

- BLS12-381 pairing tower: shipping Metal byte-equal blst across 2 746
  vectors. Crossover: n≥16 for aggregate verify.
- secp256k1 ecrecover: shipping Metal Stage A on-device (Montgomery batch
  inversion). Crossover: N≥168.
- Keccak: shipping `KeccakResidencySession` with 4-way set-associative
  round cache. Crossover: N≥6 144.
- NTT (Apple Silicon Metal/MLX): published 14.02× at N=4096 fused, B=128
  (CROSSOVER.md row 4) — **unreproducible on this host as of 2026-04-27
  due to BatchNTT SIGSEGV**.
- **FHE bootstrap (programmable PBS): NOT shipping on Metal/CUDA.**
  Pure-Go implementation in `luxfi/lattice/v7/core/rgsw/blindrot` +
  `luxfi/lattice/v7/ring`. The `luxfi/lattice/v7/gpu` package now links
  but operates in a **different arithmetic domain** from `ring`, so it
  cannot be inserted into the bootstrap chain without either a C API
  change or per-call domain conversion that erases the speedup.

## Substrate-wide FHE position

The 9-chain LP-137 substrate has three families of crypto primitives:

1. **Hash / commit primitives** (Keccak, Poseidon, Merkle): commodity
   parallel, GPU-native, shipping. Geomean substrate speedup 4–6×.
2. **EC / pairing primitives** (BLS, secp, ed25519): per-element parallel,
   GPU-native via batched-N residency, shipping. Geomean 9–17× at large N.
3. **Lattice / FHE primitives** (Ringtail, ML-DSA, ML-KEM, FHE bootstrap):
   *partial*. Ringtail/MLDSA/MLKEM ship dispatch-shape Metal skeletons
   (#90, #102) but the FIPS-204/203 verify path is dGPU-deferred; **FHE
   bootstrap is fully CPU**.

The FHE policy gap is structurally different from BLS/secp:

- BLS/secp gain from "many independent operations on a regular core" —
  single-precision arithmetic, predictable memory pattern, embarrassingly
  parallel across N. Metal kernel cost ~150 lines per primitive.
- FHE bootstrap gains from "many small NTTs inside one operation" — each
  bootstrap is itself ~512 inner NTT calls in a serial gadget chain,
  with key-switch and modulus-switch glue. The C++ Metal NTT kernels at
  `luxcpp/lattice/src/ntt_kernels.air` already exist (per #88 they win
  14× at the N=4096 B=128 sweet spot), but the Go `lattice/v7/gpu` bridge
  does not link cleanly on this host (broken LDFLAGS path + library name
  mismatch — see PERFORMANCE.md G1) and the bridge is not connected to
  the `blindrot.Evaluator` that policy eval flows through.

## Geomean impact on LP-137 substrate parity

Today's LP-137 geomean (per `LP-137-BENCHMARKS.md` Phase-3 table) excludes
FHE from the "running" set because it has no GPU implementation:

| Subsystem | Phase-3 result | GPU substrate? |
|---|---|---|
| BLS Fp/Fp2/Fp6/Fp12 tower | Metal byte-equal blst + WGSL | YES |
| BLS aggregate verify | bridgevm pubkey-cache, n≥16 | YES |
| ecrecover (n=1024) | luxcpp Montgomery batch inv (1.80×) | YES (CPU-only path, gated) |
| Keccak per-round dedup | 4-way round cache | YES |
| AI/ML on consensus | byte-equal CPU↔Metal | YES (deterministic mode) |
| **FHE policy eval** | **5.4 s on M1 CPU, no GPU path** | **NO** |
| **FHE encrypted CRDT merge** | **CPU pure-Go (per `bench_crdt_test.go`)** | **NO** |

Adding FHE to the geomean drops LP-137 substrate-wide GPU coverage from
"comprehensive" to "comprehensive except FHE". Once G1+G2 land (linker
fix + ring NTT dispatch), FHE NTT inherits the existing 14× Metal NTT
crossover and FHE primitives become "GPU-eligible at NTT batch B≥8".
Once G3 lands (batch-bootstrap kernel), FHE crosses parity at N≥16
parallel policies on M1 Max — equivalent to ~5 P-core throughput
ceiling.

## Crossover prediction (assuming G1+G2+G3 land)

For a 4096-tx ingress block with FHE policy on hot path:

- **Metal on M1 Max:** estimated end-to-end ~80 ms per policy at B=128
  fused NTT, N=64 batch-bootstrap. **Crossover with CPU saturation at
  N≥16.** Below N=16 stays on CPU.
- **CUDA on H100:** estimated ~3 ms per policy. Crossover at N≥1.
  cuFHE/TFHE-rs published literature reports 0.5 ms/gate at λ=128 on
  H100 — translates to ~25 ms for the 53-gate policy bundle. Confidence:
  literature-based, **not independently verified on Lux hardware**.
- **CUDA on A100:** estimated ~50 ms. Crossover at N≥4.

## Recommended posture for LP-137 Phase-4 (revised)

1. **G1 done.** Linker + library install closed 2026-04-27.
2. **Replace G2 with G2'**: fix `gpu.BatchNTT` SIGSEGV in
   `luxcpp/lattice/src/metal/metal_ntt.mm`. Without batch mode the
   Metal NTT is strictly slower than CPU on this backend. **Effort: ~1
   week, requires Objective-C++ debugging cycles.** Risk: none until
   diagnosed.
3. **G2 (drop-in `Ring.NTT` dispatch) is dead** as a separate work item.
   The domain mismatch makes any safe wiring reduce to one of:
   - C API change in `luxcpp/lattice` to accept Montgomery roots, or
   - per-NTT `IMForm`/`MForm` conversion that costs 2N modular muls
     each direction (defeats speedup at all measured N), or
   - end-to-end blindrot rewrite on Metal in standard form (= G3).
   Track G3 instead.
4. **G3 (batch-bootstrap Metal kernel) is the only meaningful path.**
   This is the single largest FHE-on-M1 win and the prerequisite for
   any meaningful FHE-in-hot-path posture. Effort: ~6 weeks, requires
   Metal kernel author cycles + the gadget chain rewritten in standard
   form. Depends on G2' being fixed first so the inner NTT is competitive.
5. **Defer hot-path FHE on chain.** The threshold-decrypt MPC committee
   pattern (LP-073, LP-019) already structures FHE evaluation off-chain.
   Recommendation: keep FHE policy eval out of any block-time-bounded
   path until G3 lands. The chain validates threshold-decrypted verdicts
   only.
6. **Schedule Linux+H100 self-hosted runner allocation.** The dGPU
   crossover for FHE is the largest expected speedup (~1 800× over M1
   CPU per cuFHE literature) and **cannot be measured on Apple hardware**.
   Without H100 access, all CUDA numbers in PERFORMANCE.md remain
   literature-cited estimates.

## Honest gaps (revised 2026-04-27)

- The 14× single-claim from CROSSOVER.md row 4 is **currently
  unreproducible on this M1 Max** because `gpu.BatchNTT` SIGSEGVs at
  every (N, B) tested. The number is preserved in the substrate parity
  prediction below as a literature-style estimate (CROSSOVER.md was a
  C++-only test harness; the C library may behave differently when
  invoked directly versus through the cgo bridge), but it should be
  treated as unverified until G2' lands.
- **Single-poly Metal NTT is strictly worse than CPU** on this host,
  measured 12× slower at every N from 1024 to 16384. Any GPU posture
  for FHE depends on the batched path.
- All other numbers are M1 CPU + cited dGPU literature. **No Lux H100
  measurement exists.** Confidence interval on dGPU estimates is wide
  (~3× per direction).
- The bench harness uses PN10QP27 (test default). Production deployment
  needs PN11QP54 measurement.
- The lazy-carry path (`luxfi/fhe/lazy_carry.go`) is in-tree but not
  exercised by `policy.go`. A pure-Go optimisation pass through lazy-carry
  could deliver ~1.7× speedup with zero GPU dependency (PERFORMANCE.md
  G6) — and is now the best near-term target since G2 is dead.

## File domain

- `/Users/z/work/lux/fhe/policy/bench_gpu_test.go` — bench harness (~250 LOC)
- `/Users/z/work/lux/fhe/policy/PERFORMANCE.md` — full per-N tables + improvement list
- `/Users/z/work/lux/lps/LP-137-FHE-PERFORMANCE.md` — this cross-cutting summary
