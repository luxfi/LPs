# LP-137 FHE Performance — Cross-Cutting Analysis

**Date:** 2026-04-27 (revised after Montgomery port + BatchNTT fix).
**Hardware:** Apple M1 Max, 64 GB unified, macOS 26.4.
**Companion doc:** `/Users/z/work/lux/fhe/bench/results/` (per-N JSON).

## Executive finding (revised after Montgomery port)

**The two architectural blockers identified in #121 are now resolved.**
What changed in this iteration:

1. **Montgomery NTT port shipped.** The Metal kernel at
   `/Users/z/work/luxcpp/lattice/src/metal/metal_ntt.mm` now implements
   Lattigo-style Montgomery butterflies (port of
   `luxfi/lattice/v7/ring/ntt.go::butterfly` to MSL using
   `metal::mulhi`). A new C ABI
   `lattice_ntt_create_montgomery(N, Q, MRedConstant, NInv, RootsForward, RootsBackward)`
   accepts the Go-side Montgomery roots directly; output is byte-equal
   to `ring.NTTStandard` for any SubRing. Verified across **3072
   forward + 3072 inverse vectors** spanning N ∈ {1024, 2048, 4096}, plus
   round-trip at N=8192. **Domain mismatch closed -- Ring.NTT dispatch
   is now safe.**
2. **BatchNTT SIGSEGV root-cause was a C ABI signature mismatch**, not a
   threadgroup-memory or alignment issue. The Go cgo bridge declared
   `int lattice_ntt_batch_forward(LatticeNTTContext*, uint64_t* data, uint32_t batch)`;
   the C side defined it as
   `int lattice_ntt_batch_forward(LatticeNTTContext*, uint64_t** polys, uint32_t count)`.
   Go passed a pointer to a flat `batch * N` buffer; C cast it to an
   array-of-pointers and dereferenced the first 8 bytes as a pointer to
   garbage memory. Fixed by aligning the C signature to the Go declaration
   (contiguous flat buffer). Verified at every previously-segfaulting
   config including `N=4096 B=128` (the published 14× datapoint).
3. **A second Metal kernel bug surfaced and was fixed.** The staged
   forward dispatch wrote stage parameters into a single shared
   `params_buf` then enqueued multiple compute encoders against it.
   Metal does not snapshot shared-storage buffer contents at encoder
   creation time; it reads them when the GPU executes the command. The
   net effect was every stage saw the *last* stage's parameters,
   corrupting all transitional stages. Fix: use `setBytes:length:atIndex:`
   to inline params per-dispatch, snapshotting at encode time.
4. **Single-poly Metal NTT remains slower than Go on M1 Max** -- but
   the new measurements differ from #121's. After the Montgomery port,
   Metal vs Go single-poly ratios are 0.010× (N=1024), 0.020× (N=2048),
   0.088× (N=4096), 0.075× (N=8192), 0.118× (N=16384). The crossover
   appears only in the **batched path**: Metal becomes faster than Go
   per-NTT at N=4096 B=64 (3.18×) and reaches **4.57× at N=4096 B=128**.

Per `LP-137-PARALLELIZATION.md` and `luxcpp/crypto/CROSSOVER.md`:

- BLS12-381 pairing tower: shipping Metal byte-equal blst across 2 746
  vectors. Crossover: n≥16 for aggregate verify.
- secp256k1 ecrecover: shipping Metal Stage A on-device (Montgomery batch
  inversion). Crossover: N≥168.
- Keccak: shipping `KeccakResidencySession` with 4-way set-associative
  round cache. Crossover: N≥6 144.
- NTT (Apple Silicon Metal/MLX): #88 published 14.02× at N=4096 fused
  B=128 against the MLX path in `luxcpp/fhe/src/core/lib/math/hal/mlx/`.
  After porting the parallel kernel in `luxcpp/lattice/src/metal/metal_ntt.mm`
  to Lattigo-bit-exact Montgomery form and fixing the BatchNTT ABI bug,
  the **luxlattice path measures 4.57× at N=4096 B=128** on this M1 Max.
  The discrepancy is a kernel design difference: the MLX path uses
  Apple's MLX library which transparently routes through the AMX matrix
  coprocessor for large multiply-heavy ops; the direct Metal compute
  path used here exercises only the GPU's SIMD ALU. The 4.57× is honest
  for the Lattigo-byte-equal contract.
- **FHE bootstrap (programmable PBS): partial.** The drop-in `Ring.NTT`
  dispatch is now byte-equal-safe but disabled by default
  (`gpu.SetNTTThreshold(0)`). Single-poly dispatch is strictly slower
  than Go on M1; the speedup requires batched dispatch which the
  current bootstrap chain does not exercise. G3 (batch-bootstrap
  Metal kernel) is still the dominant remaining work.

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
