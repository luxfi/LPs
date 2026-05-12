# LP-137 FHE Performance — Cross-Cutting Analysis

**Date:** 2026-04-27 (revised after bench ladder Metal cells filled).
**Hardware:** Apple M1 Max, 64 GB unified, macOS 26.4.
**Companion doc:** `/Users/z/work/lux/fhe/bench/RESULTS.md` (canonical
ladder), `/Users/z/work/lux/fhe/bench/results/` (per-N JSON).

## Executive finding (revised 2026-04-27 with full Metal ladder)

**The full bench ladder Metal column is now populated.** What landed
in this iteration:

1. **Montgomery NTT port shipped.** Metal kernel at
   `luxcpp/lattice/src/metal/metal_ntt.mm` ports
   `luxfi/lattice/v7/ring/ntt.go::butterfly` to MSL using
   `metal::mulhi`. New C ABI `lattice_ntt_create_montgomery(...)`
   accepts Go-side Montgomery roots directly; output is byte-equal
   to `ring.NTTStandard` across 12 288 vectors (forward + inverse,
   N ∈ {1024, 2048, 4096, 8192}).
2. **BatchNTT SIGSEGV root-cause was a C ABI signature mismatch.** Go
   declared flat-buffer; C declared array-of-pointers. Fixed in
   `luxcpp/lattice/src/lattice.cpp::lattice_ntt_batch_forward`
   (commit 0507c925).
3. **Metal kernel staged-dispatch parameter bug fixed.** Was using
   shared `params_buf` for multiple encoders; Metal reads shared
   buffers at execute-time, not encode-time. Switched to
   `setBytes:length:atIndex:` to inline params per-dispatch.
4. **Bench harness rewired to true single-dispatch batch.** The
   harness was calling `NTTContext.NTT([][]uint64)` which iterates
   B sequential single-poly cgo dispatches. Updated to
   `MontgomeryNTTContext.Forward(data, batch)` which is a single-call
   batched dispatch. This is the change that exposed the actual
   speedup curve.
5. **lattice_gpu_available() patched.** Pre-fix the C ABI delegated
   to legacy `mlx_ntt_gpu_available()` (false unless WITH_GPU=ON).
   Patched to also check `metal_ntt_available()` when HAVE_METAL_NTT
   is defined. luxlattice rebuilt 2026-04-27 12:54.
6. **G3a (Bootstrap.BatchEvaluate) shipped 4.61x CPU-goroutine
   ceiling** in lattice commit `d11ec53c`. This is parallel-cores
   amortisation; orthogonal to the GPU table.
7. **G3b (Metal batch-bootstrap kernel) deferred.** With the
   byte-equal Montgomery kernel and 4.61x CPU goroutine batch
   landing, the next dominant work is refactoring blindrot to
   dispatch inner NTTs at B>=64. Lattigo-side rewrite, not a kernel
   port.

## Bench ladder NxB Metal vs Go (Montgomery kernel-only, 10 iter median)

Source: `/Users/z/work/lux/fhe/bench/RESULTS.md`. Speedup ratio
(Go/Metal); ratio > 1 means Metal faster.

| N | B=1 | B=8 | B=32 | B=128 | B=512 | B=2048 |
|---|---|---|---|---|---|---|
| 1024  | 0.28x | **3.09x** | **3.33x** | **9.43x** | **22.87x** | **32.12x** |
| 2048  | 0.16x | **1.13x** | **4.42x** | **3.85x** | **13.15x** | **23.35x** |
| 4096  | 0.06x | 0.40x | **2.30x** | **2.03x** | **8.27x** | **16.71x** |
| 8192  | 0.21x | **1.14x** | **3.12x** | **6.31x** | **8.24x** | **14.02x** |
| 16384 | 0.26x | **1.69x** | **3.74x** | **6.26x** | **10.59x** | **11.97x** |

### Crossover thresholds (smallest B where Metal beats Go, M1 Max)

| N | Crossover B | Speedup at crossover | Speedup at B=2048 |
|---|---|---|---|
| 1024  | 8  | 3.09x  | 32.12x |
| 2048  | 8  | 1.13x  | 23.35x |
| 4096  | 32 | 2.30x  | 16.71x |
| 8192  | 8  | 1.14x  | 14.02x |
| 16384 | 8  | 1.69x  | 11.97x |

**Single-poly Metal NTT is slower than Go at every N** (~470 us
command-queue floor). `gpu.SetNTTThreshold(0)` is correct as default
-- auto-dispatch from SubRing.NTT would lose money. The speedup is
only realisable when the caller explicitly batches.

### Canonical N=4096 B=128 (the "14x" config from #88)

| Path | Time | Per-NTT | Vs Go |
|---|---|---|---|
| Go pure-Go | 10.29 ms | 80.39 us | 1.00x |
| Metal Montgomery batched | 5.07 ms | 39.65 us | **2.03x** |

**The 14x claim does not reproduce on this M1 Max via the lattice
Metal kernel.** Honest reading is 2x at B=128. The 14x reference was
against the F-Chain MLX path (not reachable from Go). Peak luxlattice
Metal speedup is 16.71x at B=2048 -- exceeding 14x but at a different
config than the original claim.

Per `LP-137-PARALLELIZATION.md` and `luxcpp/crypto/CROSSOVER.md`:

- BLS12-381 pairing tower: shipping Metal byte-equal blst across 2 746
  vectors. Crossover: n≥16 for aggregate verify.
- secp256k1 ecrecover: shipping Metal Stage A on-device (Montgomery batch
  inversion). Crossover: N≥168.
- Keccak: shipping `KeccakResidencySession` with 4-way set-associative
  round cache. Crossover: N≥6 144.
- NTT (Apple Silicon Metal/MLX): #88 published 14.02x at N=4096 fused
  B=128 against the MLX path in `luxcpp/fhe/src/core/lib/math/hal/mlx/`.
  After porting the parallel kernel in `luxcpp/lattice/src/metal/metal_ntt.mm`
  to Lattigo-bit-exact Montgomery form, fixing the BatchNTT ABI bug,
  and rewiring the bench harness to true single-dispatch batch, the
  **luxlattice path measures 2.03x at N=4096 B=128 and 16.71x at
  N=4096 B=2048** on this M1 Max (10-iter median, kernel-only). The
  N=4096 B=128 result is below the published 14x because the MLX path
  uses Apple's library which transparently routes through the AMX
  matrix coprocessor; the direct Metal compute path here exercises
  only the GPU's SIMD ALU. The peak 16.71x at B=2048 exceeds 14x
  through batch amortisation rather than kernel-level fusion.
- **FHE bootstrap (programmable PBS): partial.** The drop-in `Ring.NTT`
  dispatch is now byte-equal-safe but disabled by default
  (`gpu.SetNTTThreshold(0)`). Single-poly dispatch is strictly slower
  than Go on M1; the speedup requires batched dispatch which the
  current bootstrap chain does not exercise. G3a (CPU goroutine
  Bootstrap.BatchEvaluate, 4.61x) shipped in lattice `d11ec53c`. G3b
  (Metal batch-bootstrap kernel) is deferred -- with byte-equal
  Montgomery dispatch in place, the dominant work is refactoring
  blindrot to issue batched NTTs (B>=64 to cross over per the table
  above) instead of serial per-poly NTTs.

## Substrate-wide FHE position

The 9-chain LP-137 substrate has three families of crypto primitives:

1. **Hash / commit primitives** (Keccak, Poseidon, Merkle): commodity
   parallel, GPU-native, shipping. Geomean substrate speedup 4–6×.
2. **EC / pairing primitives** (BLS, secp, ed25519): per-element parallel,
   GPU-native via batched-N residency, shipping. Geomean 9–17× at large N.
3. **Lattice / FHE primitives** (Pulsar, ML-DSA, ML-KEM, FHE bootstrap):
   *partial*. Corona/MLDSA/MLKEM ship dispatch-shape Metal skeletons
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
2. **G2' done (BatchNTT SIGSEGV fix).** Root cause was a C ABI signature
   mismatch (Go declared flat-buffer, C declared array-of-pointers).
   Fixed in `luxcpp/lattice/src/lattice.cpp::lattice_ntt_batch_forward`.
   Now exercises the same code path as `lattice_ntt_forward(batch=N)`.
3. **G2 done (Montgomery Ring.NTT dispatch).** Metal kernel ported to
   Lattigo-bit-exact Montgomery butterflies; new C ABI
   `lattice_ntt_create_montgomery` accepts Go-side Montgomery roots
   directly. Output byte-equal to `ring.NTTStandard` across 3072 random
   vectors. Dispatch is opt-in: callers register a SubRing via
   `gpu.RegisterSubRing(s)` and set a per-process threshold via
   `gpu.SetNTTThreshold(n)`. Default threshold is 0 (disabled) because
   single-poly Metal is still 8-100× slower than Go on M1 Max.
4. **G3 (batch-bootstrap Metal kernel) remains the dominant remaining
   work.** With the byte-equal Montgomery dispatch in place, the only
   path to FHE policy speedup on M1 is to refactor the bootstrap chain
   to issue batched NTT dispatches (B≥64 to cross over) instead of
   serial per-poly NTTs. This is a Lattigo-side rewrite, not a kernel
   port, since the byte-equal kernel is now available. Effort: ~4 weeks
   in `luxfi/lattice/v7/core/rgsw/blindrot` + a batched evaluator.
5. **Defer hot-path FHE on chain.** The threshold-decrypt MPC committee
   pattern (LP-073, LP-019) already structures FHE evaluation off-chain.
   Recommendation: keep FHE policy eval out of any block-time-bounded
   path until G3 lands. The chain validates threshold-decrypted verdicts
   only.
6. **Schedule Linux+H100 self-hosted runner allocation.** The dGPU
   crossover for FHE is the largest expected speedup (~1 800× over M1
   CPU per cuFHE literature) and **cannot be measured on Apple hardware**.
   The Montgomery kernel is portable to CUDA via PTX (`metal::mulhi`
   maps to PTX `mul.hi.u64`); the Go-side dispatcher is platform-neutral.

## Honest gaps (revised 2026-04-27 post bench ladder)

- The 14x single-claim from CROSSOVER.md row 4 is **kernel-design
  dependent**. The luxlattice Metal kernel reaches 2.03x at B=128
  (vs the 14x F-Chain MLX path with shared-memory butterflies) and
  16.71x peak at B=2048. Both numbers are reproducible. The original
  14x is from the F-Chain dispatcher which is not Go-reachable.
- **Single-poly Metal NTT is strictly worse than CPU** on this host,
  ~470 us command-queue floor at every N. Crossover ranges from B>=8
  (small N) to B>=32 (N=4096). Any GPU posture for FHE depends on
  batched dispatch.
- All other numbers are M1 CPU + cited dGPU literature. **No Lux H100
  measurement exists.** Confidence interval on dGPU estimates is wide
  (~3x per direction).
- The bench harness uses PN10QP27 (test default). Production deployment
  needs PN11QP54 measurement.
- The lazy-carry path (`luxfi/fhe/lazy_carry.go`) is in-tree but not
  exercised by `policy.go`. A pure-Go optimisation pass through
  lazy-carry could deliver ~1.7x speedup with zero GPU dependency
  (PERFORMANCE.md G6).
- **G3a shipped (4.61x CPU-goroutine Bootstrap.BatchEvaluate).**
  Wiring through policy hot-path callers is the immediate near-term
  speedup -- ships this week.
- **G3b (Metal batch-bootstrap kernel) deferred.** The byte-equal
  Montgomery kernel and the 16x peak NTT speedup are in place; what
  remains is the Lattigo-side rewrite to dispatch the inner NTTs at
  B>=64. Effort: ~4 weeks.
- **luxlattice probe required a patch.** Pre-fix
  `lattice_gpu_available()` delegated to `mlx_ntt_gpu_available()`
  (false unless WITH_GPU=ON). Patched to also check
  `metal_ntt_available()`. Library rebuilt 2026-04-27; the bench
  ladder Metal cells fill cleanly under `-tags=gpu`.

## File domain

- `/Users/z/work/lux/fhe/policy/bench_gpu_test.go` — bench harness (~250 LOC)
- `/Users/z/work/lux/fhe/policy/PERFORMANCE.md` — full per-N tables + improvement list
- `/Users/z/work/lux/lps/LP-137-FHE-PERFORMANCE.md` — this cross-cutting summary
