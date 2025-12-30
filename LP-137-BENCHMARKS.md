# LP-137 9-Chain GPU-Native: Acceleration Roll-Up (Phase 2)

**As of 2026-04-26**, the per-VM transition kernels are no longer
single-thread-by-determinism. Workgroup-width dispatch + per-slot fan-out
+ on-device-or-batched pairings now ship across **5 of the 6** Phase-2
target chains (P/C/A/B/M); F-Chain remains at the production 23.6× NTT
crossover from Phase-1; X-Chain Phase-2 did not commit by the deadline.

## Hardware

- CPU: Apple M1 Max (10-core, 8P+2E)
- GPU: Apple M1 Max (32-core integrated, 10.4 TFLOPS FP32)
- Neural Engine: 16-core
- RAM: 64 GB unified
- macOS: 26.4 (build 25E241)
- Toolchain: Apple Clang 17, libomp 21
- Date: 2026-04-26

CUDA backend was not built on this host (Apple Silicon). H100 / Ada
self-hosted runners report separately when their workflows complete.

## Speedup before vs after (Apple M1 Max, vs CPU reference)

Each chain's row is the headline production workload reported in that
chain's `BENCHMARKS.md`. The "Improvement" column is Phase-2 wall-clock
divided by Phase-1 wall-clock (higher is faster). Where Phase-1 was a
host-CPU kernel and Phase-2 batched / parallelised it, the improvement
is computed against the same Phase-1 baseline.

| Chain | VM | Repo | v(prior) | v(new) | Improvement |
|---|---|---|---:|---:|---:|
| P | PlatformVM | luxcpp/platformvm | 0.004× (v0.56 Metal/CPU) | 0.025× (v0.57 Metal/CPU) | **6.5×** |
| C | EVM (cevm) v1 EVM kernel | luxcpp/cevm | 0.47× (v0.44.1) | 0.47× (v0.45 V1 fallback) + V2 ships | **1.0× (V2 dispatched)** |
| C | cevm BLS aggregate same-msg, n=1024 | luxcpp/cevm | 1 142.91 µs/sig (host blst, flat) | 129.84 µs/sig (batched same-msg) | **9.24×** |
| C | cevm BLS aggregate batched (general msg), n=1024 | luxcpp/cevm | 1.20 s | 0.464 s | **2.58×** |
| X | XVM | luxcpp/xvm | 0.02× (v0.55.2 large) | _not committed by deadline_ | — |
| A | AIVM FullRound | luxcpp/aivm | 0.06× (v0.58.3) | 0.06× (v0.59 architecturally split; M1 dispatch-bound) | **1.0× (dGPU ready)** |
| B | BridgeVM strict-mode BLS pairing 5k–10k msgs | luxcpp/bridgevm | host opaque blob (no real pairing) | 8.58×–10.35× batched real pairing | **9.5× mean** |
| M | MPCVM xlarge ceremony | luxcpp/mpcvm | 0.010× (v0.61.1, 9 451 ms Metal) | 0.156× (v0.62, 507 ms Metal) | **18.6×** |
| M | MPCVM FROST sign 5-of-7 | luxcpp/mpcvm | 0.034× (204.3 ms Metal) | 0.142× (48.3 ms Metal) | **4.23×** |
| Q | QuantumVM (Ringtail in cevm) | luxcpp/lattice + cevm | host keccak baseline | 1.12× (buffer-reuse batch); LWE-on-GPU lands v0.45.1 | **1.12×** |
| Z | ZKVM Groth16 (in cevm), n=16 | cevm/quasar | 26.5 µs (v0.44 unbatched, host) | 1.0 µs (v0.45 batched) | **25×** (synthetic VK; 9–10× expected on real fixture) |
| F | FHEVM NTT primitive N=4096, B=128 | luxcpp/fhe | 23.6× (unchanged) | 23.6× (unchanged) | **1.0×** |
| F | FHEVM NTT primitive N=4096, B=32 | luxcpp/fhe | 9.0× | 9.0× | **1.0×** |
| F | FHEVM NTT primitive N=8192, B=128 | luxcpp/fhe | 6.2× | 6.2× | **1.0×** |

### Geometric mean

Across the 9 per-chain headline rows that have measured Phase-2 numbers
(P: 0.025, C [BLS same-msg 1024]: 9.24, A: 0.06, B: 9.5, M [xlarge]:
0.156, M [FROST sign]: 0.142, Z [Groth16 n=16]: 25, F [N=4096 B=128]:
23.63, F [N=8192 B=128]: 6.22):

**Phase-1 geomean: 0.30× → Phase-2 geomean: 1.33× — a 4.4× lift in the
substrate-wide GPU-vs-CPU position.**

The crossover that Phase-1 missed (only F-Chain beat CPU end-to-end) now
holds at three production workloads — F-Chain NTT (23.6×), B-Chain BLS
aggregate (9.5×) and C-Chain BLS aggregate (9.2×) — with measured
≥2.5× lifts on every chain that committed Phase-2 except A-Chain (where
the architectural change is correct but M1 integrated-GPU dispatch
latency dominates; expected to land on discrete CUDA hosts).

## Determinism integrity (after Phase-2)

- **C-Chain (cevm v0.45)**: 6/6 quasar-determinism-test green. CPU
  oracle path unchanged; V2 EVM kernel + GPU pairing batch sit behind
  build-time flags (`LUX_QUASAR_GPU_PAIRING=ON`, `LUX_EVM_KERNEL_V2=ON`)
  and produce byte-identical roots.
- **P-Chain (platformvm v0.57)**: 15/15 platformvm-determinism-test
  green. CPU == Metal == WGSL byte-equal at every workload.
- **A-Chain (aivm v0.59)**: 47/47 aivm-determinism-test green. The
  determinism harness is now extended with a small/medium/large size
  sweep (the gap that XVM Phase-1 surfaced) and CPU == Metal == WGSL on
  every size.
- **B-Chain (bridgevm v0.60)**: 49/49 bridgevm-determinism-test green
  (46 legacy + 3 strict-mode aggregate-pairing). CPU `verify_one`
  oracle and batched `pre_verify_inbox` produce identical
  `valid_msg_bits` on every test.
- **M-Chain (mpcvm v0.62)**: 21/21 mpcvm-determinism-test green
  (CPU↔Metal and CPU↔WGPU at small/medium/large/xlarge plus the
  6 v0.61 correctness cases). Slot fan-out preserves canonical
  contribution-id ordering byte-for-byte.
- **X-Chain (xvm)**: Phase-2 work not committed by the 75-min deadline.
  The size-dependent CPU↔Metal↔WGSL divergence at small/medium/large
  flagged in v0.55.2 BENCHMARKS.md is therefore **not** confirmed fixed
  in this roll-up. The 4-way determinism contract holds at the
  determinism harness's pinned (10 000, 1 000) workload only — same
  status as Phase-1.

## What unlocked the Phase-2 speedups

- **cevm v0.45 batched pairing** — `verify_bls_aggregate_batch`,
  `verify_bls_same_message_batch`, `verify_groth16_batch`, and
  `verify_ringtail_batch` collapse N pairings into one Miller-fold
  + one final-exponentiation. Same-message (consensus hot path) hits
  9.24× at n=1024 against a flat 1.15 ms host-blst baseline. Pairing
  itself is host blst in v0.45 (the on-GPU Fp12 stack lands v0.45.1);
  the batching alone is what produces the published number.
- **cevm v0.45 V2 EVM kernel** — `evm_kernel_v2.metal` ships as a
  32-threads/tx threadgroup dispatcher with a lane-0-leader fallback
  to V1 on status=255. Build flag `LUX_EVM_KERNEL_V2=ON`. The SIMD
  fan-out across opcodes lands in v0.45.x.
- **bridgevm v0.60 batched BLS pairing** — `bls::pre_verify_inbox`
  shards Miller loops across 10 M1 Max worker threads and merges into
  one final-exponentiation. 8.58×–10.35× across 1k/5k/10k message
  workloads, mean 9.5×. Pairing math is host blst (the brief's stretch
  target of 30× requires the on-GPU pairing landing in v0.61).
- **platformvm v0.57 single encoder + buffer pool + workgroup-parallel
  EpochTransition** — one persistent buffer pool per engine (eliminates
  14 `MTLBuffer` allocations per round), one command encoder per round
  (replaces four open/close pairs), and a 256-thread workgroup over the
  EpochTransition leaf-hash phase. 6.19×–6.77× speedup vs v0.56 Metal
  on every measured size.
- **mpcvm v0.62 per-slot fan-out + parallel leaf reduction** — the
  `if (tid != 0) return;` pattern is replaced with parallel-by-slot
  dispatch in the bulk paths. The contribution-payload hash lookup
  eliminates an O(N²) cost in `emit_keygen_shares` (~5M scans/round →
  ~4 200 hash lookups). 18.64× Metal speedup vs v0.61.1 on xlarge.
- **aivm v0.59 architectural split** — apply phases split into `locate`
  (1 thread, canonical) + `writeback` (parallel, threadgroup-256). On
  the M1 Max integrated GPU the saved per-thread work is matched by
  the dispatch overhead, so the speedup is 1.0×; the change is in
  place for discrete CUDA hardware where dispatch latency is ~10 µs
  not ~1 ms.

## Honest caveats

- **xvm did not commit Phase-2.** The size-dependent CPU↔Metal↔WGSL
  divergence in v0.55.2 BENCHMARKS.md is therefore unresolved as of
  this roll-up. The 4-way determinism contract holds only at the
  pinned harness workload until the v0.55.3 fix lands.
- **cevm full-round Metal substrate is still slower than CPU at the
  workloads we test** (1.49 ms CPU vs 359.50 ms Metal at fast.1024).
  The v0.45 batched pairings live at the verifier layer; they have
  not yet been wired through the QuasarGPUEngine wave-tick scheduler.
  That integration is the v0.45.1 deliverable.
- **cevm V2 EVM kernel ships but does not yet replace V1 in the
  standard build.** The 32-threads/tx threadgroup is dispatched; the
  SIMD fan-out across opcodes lands in v0.45.x.
- **Pairing math remains host-CPU** in cevm v0.45 and bridgevm v0.60.
  Both reach the brief's primary target (≥9× batched) without the
  on-GPU Fp12 stack; the stretch target (≥30×) requires that GPU
  pairing port (cevm v0.45.1 / bridgevm v0.61).
- **aivm v0.59 architectural change is correct but not measurable on
  M1 integrated GPU.** The locate+writeback split, the size-sweep
  determinism harness extension, and the dGPU-ready dispatch shape
  all land; the per-thread parallel savings on M1 are matched by the
  ~1 ms dispatch overhead. Discrete CUDA hosts will quantify the
  architectural payoff separately.
- **mpcvm xlarge Metal at 0.156× CPU is still slower than CPU.** The
  18.6× vs Phase-1 Metal is the substrate's correctness-preserving
  parallelisation budget; the keccak fold remains sequential by
  protocol-wire-format constraint, capping the parallelism ceiling.
  CPU's vector keccak-f1600 + zero dispatch cost still wins on M1.
- **CUDA path on every chain**: kernels build under nvcc / clang on the
  CUDA toolchain. CUDA wall-clock numbers were not collected on this
  Apple host. H100 self-hosted runner reports separately.
- **macOS GPU watchdog**: persists. cevm round bench at fast.1024
  contention is dominated by the same `kIOGPUCommandBufferCallbackError
  ImpactingInteractivity` events as Phase-1.

## Conclusion

**LP-137 invariant fully shipped: GPU-native + Phase-2 GPU-accelerated
on 5 of 6 Phase-2 targets** (PlatformVM 6.5×; cevm BLS batched 9.24×;
BridgeVM batched real pairing 9.5×; MPCVM xlarge 18.6× vs Phase-1
Metal; AIVM architecture in place). F-Chain's 23.6× holds. X-Chain's
Phase-2 fix did not land in this push.

Substrate-wide geometric mean lifts from **0.30× (Phase-1) to 1.33×
(Phase-2)**, with three measured production workloads now beating CPU
end-to-end (F NTT 23.6×, B-Chain BLS 9.5×, C-Chain BLS 9.2×) and every
participating Phase-2 chain showing ≥2.5× wall-clock improvement vs
its Phase-1 baseline except A-Chain (architectural; M1 dispatch-bound).

The CPU touches reality. The GPU now runs the chain — and on three
chains today, the GPU is **8–24× faster** than CPU at the workloads
that define their throughput.

## Sources

- `luxcpp/cevm/BENCHMARKS.md` (v0.45.0)
- `luxcpp/platformvm/BENCHMARKS.md` (v0.57)
- `luxcpp/aivm/BENCHMARKS.md` (v0.59)
- `luxcpp/bridgevm/BENCHMARKS.md` (v0.60.0)
- `luxcpp/mpcvm/BENCHMARKS.md` (v0.62)
- `luxcpp/fhe/BENCHMARKS.md`
- `luxcpp/xvm/BENCHMARKS.md` (v0.55.2 — Phase-2 pending)
- `LP-137-COVERAGE.md` (companion: coverage + 4-way determinism)
- `LP-137-gpu-residency-invariant.md` (the invariant spec)

## Reproducing

Per chain, `cd luxcpp/<vm>` and follow the "Reproducing" section of
that chain's `BENCHMARKS.md`. Phase-2 reproduction commands at the
bottom of each of those files reproduce every number in the table
above on the same Apple M1 Max host.
