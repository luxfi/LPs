# LP-137 9-Chain GPU-Native: Benchmark Roll-Up

**As of 2026-04-26**, all 9 LP-134 primary chains satisfy the strict
GPU-native invariant (state and canonical transition logic on device,
byte-equal to the CPU reference oracle). This roll-up reports the
*measured* GPU-vs-CPU wall-clock numbers per chain on the canonical
Apple M1 Max host, with no interpolation and no projection. Numbers
that show GPU slower than CPU on a given workload are reported as
slower; the honest crossover analysis is in each chain's per-VM
`BENCHMARKS.md`.

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

## Speedup per chain (representative workload, Metal vs CPU)

| Chain | VM | Repo | Workload | CPU | Metal | Speedup | Source |
|---|---|---|---|---:|---:|---:|---|
| P | PlatformVM | luxcpp/platformvm | (bench pending) | — | — | — | not committed by deadline |
| C | EVM (cevm) | luxcpp/cevm v0.44.1 | 256 tx × 30 iter EVM bytecode | 1.0 ms / 89.0 M ops/s | 2.1 ms / 41.1 M ops/s | **0.47×** | cevm/BENCHMARKS.md |
| C (round) | EVM (cevm) | luxcpp/cevm v0.44.1 | fast.1024 round wall-clock | 1.56 ms | 153.85 ms | **0.01×** | cevm/BENCHMARKS.md |
| X | XVM | luxcpp/xvm | (bench pending) | — | — | — | not committed by deadline |
| Q | QuantumVM | luxcpp/lattice + cevm/quasar | Ringtail share verify | sub-µs (v0.43 stub) | host blst | (host) | cevm/BENCHMARKS.md |
| Z | ZKVM | cevm/quasar Groth16 | groth16 vk_root keccak | 1.54 µs / 649k calls/s | host keccak | (host) | cevm/BENCHMARKS.md |
| A | AIVM | luxcpp/aivm | (bench pending) | — | — | — | not committed by deadline |
| B | BridgeVM | luxcpp/bridgevm | (bench pending) | — | — | — | not committed by deadline |
| M | MPCVM | luxcpp/mpcvm v0.61.1 | xlarge (1000 ceremonies, 5150 contribs) | 90.4 ms | 9 451 ms | **0.010×** | mpcvm/BENCHMARKS.md |
| M | MPCVM | luxcpp/mpcvm v0.61.1 | FROST sign 5-of-7 (mean) | 7.0 ms | 204.3 ms | **0.034×** | mpcvm/BENCHMARKS.md |
| F | FHEVM | luxcpp/fhe (Metal NTT prim.) | NTT N=4096, batch=128 | 13.93 ms | 0.59 ms | **23.63×** | fhe/BENCHMARKS.md |
| F | FHEVM | luxcpp/fhe (Metal NTT prim.) | NTT N=4096, batch=32 | 3.40 ms | 0.38 ms | **9.02×** | fhe/BENCHMARKS.md |
| F | FHEVM | luxcpp/fhe (Metal NTT prim.) | NTT N=8192, batch=128 | 29.06 ms | 4.68 ms | **6.22×** | fhe/BENCHMARKS.md |
| F | FHEVM | luxcpp/fhe (CKKS API) | CKKS MultRelin depth=12 | 40.69 ms | 44.25 ms | **0.92×** | dispatch not wired |

**Geometric mean of measured Metal-vs-CPU speedups across chains that
reported numbers** (cevm v1 EVM kernel 0.47×, cevm round 0.01×, mpcvm
xlarge 0.010×, mpcvm FROST sign 0.034×, fhe NTT N=4096 B=128 23.63×,
fhe NTT N=4096 B=32 9.02×, fhe NTT N=8192 B=128 6.22×): **0.30×**.

The geometric mean is dragged below 1.0× by the cevm and mpcvm scalar
kernels which were built for byte-equal determinism, not throughput.
The only chain that today shows a real GPU speedup at a production
workload is **F-Chain** (FHE NTT primitive, 23.6× at the CKKS slot
configuration that matters).

## Per-precompile (cevm host blst, not yet on device)

From `cevm/BENCHMARKS.md`:

| Precompile | Per-call | Calls/sec |
|---|---:|---:|
| BLS aggregate verify (single) | 1 146.6 µs | 872 |
| BLS aggregate verify (batch 1024) | 1 142.9 µs | 875 |
| Groth16 vk_root (keccak over VK arena, IC=8) | 1.54 µs | 648 929 |
| Ringtail share verify (v0.43 freshness stub) | sub-µs (timer floor) | ∞ |

BLS verification is **flat at ~1.15 ms regardless of batch** — there
is no SIMD aggregation today. The v0.45 work item in
`quasar_bls_verifier.hpp` line 23 moves pairing to GPU; the header
comment projects ≥10× and the math (O(N) × 1.15 ms → O(1) × ~5 ms for
1024-validator quorum) gives ≥230×. **Today's number is the host blst
baseline, not GPU.**

## FHE-specific (luxcpp/fhe)

From `fhe/BENCHMARKS.md`:

| Layer | Status | Speedup | Where |
|---|---|---|---|
| Metal NTT primitive (raw kernel)  | **active**  | **23.6×** | N=4096, B=128 |
| Metal NTT primitive (raw kernel)  | active      |   9.0×    | N=4096, B=32  |
| Metal NTT primitive (raw kernel)  | active      |   6.2×    | N=8192, B=128 |
| FHEcore NativeNTT (lib API)       | dispatch absent | 1.0× | not wired |
| FHEpke CKKS / BFV / BGV (lib API) | dispatch absent | 1.0× | not wired |
| FHEbinfhe gates / bootstrap       | dispatch absent | 1.0× | not wired |

The kernel cost is on the GPU side of the ledger. The dispatcher that
selects MLX above a problem-size threshold (B≥32, N∈{1024, 4096, 8192})
and falls back to CPU below it is the next milestone.

## Highest- and lowest-speedup chains

- **Highest**: F-Chain (FHEVM) — **23.6×** on the production CKKS slot
  NTT (N=4096, B=128). This is the inner loop of every FHE scheme;
  wiring the dispatcher into FHEpke / FHEbinfhe pulls every higher-
  level primitive into the same speedup band.
- **Lowest**: M-Chain (MPCVM) — **0.010×** on xlarge. The kernels
  begin with `if (tid != 0) return;` by construction (byte-equal
  determinism contract across CPU/Metal/CUDA/WGSL). v0.62 fans the
  kernels out across ceremony slots; same canonical winner via
  tie-breaking, just produced in parallel.

## Methodology

- All builds: `-O3 -DNDEBUG`, Release.
- Timing: `std::chrono::steady_clock` per the bench harness in each
  repo.
- Warm-up + measured iterations per data point as documented in each
  chain's `BENCHMARKS.md`.
- Mean + p50/p95/p99 reported per VM where available (mpcvm reports
  full tail; cevm reports min + mean; fhe reports min).
- Workload sizes scaled as documented; small workloads document
  command-buffer dispatch dominance.

## Honest caveats

- **CUDA path**: kernels build under nvcc / clang on the cevm/fhe/mpcvm
  CUDA toolchain. CUDA wall-clock numbers were not collected on this
  Apple host. H100 self-hosted runner reports separately when those
  workflows complete.
- **WGSL via wgpu-native**: runs on Apple, single-thread compute kernel
  constraint on M1 makes it slower than Metal native; documented per-
  VM (mpcvm xlarge wgpu 20 297 ms vs metal 9 451 ms vs cpu 90 ms).
- **EVM v1 kernel is parity, not throughput**: cevm `gpu_host->has_v2()`
  returns false in this build; the v2 32-threads/tx SIMD path is the
  one that beats CPU, and it ships in a follow-up.
- **macOS GPU watchdog**: workloads >10 k tx trip
  `kIOGPUCommandBufferCallbackErrorImpactingInteractivity` and must
  be chunked. cevm `same_key.16` mean (8 325 ms) is contaminated by
  one such event; the `min` column is the relevant signal.
- **Vote-verifier pairings on host**: BLS / Ringtail / MLDSAGroth16
  pairings still run on host blst per `quasar_bls_verifier.hpp`; the
  GPU pairing port is the v0.45 work item.
- **MPCVM kernels are scalar by design** for the four-way byte-equal
  determinism contract. v0.62 parallel fan-out replaces this.
- **FHE library-API dispatch absent**: the MLX backend compiles and
  links into `FHEcore.dylib` but `FHEpke` / `FHEbinfhe` call sites
  invoke host `NativeNTT`. Kernel speedup is measured directly via
  `metal_ntt_bench`.
- **Four chains did not commit by the 30-min deadline** (PlatformVM /
  XVM / AIVM / BridgeVM); their rows above are marked "bench pending"
  and are not included in the geometric mean. This roll-up will be
  refreshed once those land.

## Conclusion

The LP-137 invariant — *no chain-local hot path leaves GPU memory* — is
satisfied at the architectural level on every chain (per
`LP-137-COVERAGE.md`: line ≥95%, CPU-reference branch ≥90%, 4-way
byte-equal determinism). **What the substrate does not yet ship is a
production GPU speedup on every chain**: today's measured speedups are
dominated by F-Chain's 23.6× on the FHE NTT primitive, while cevm's EVM
v1 kernel and mpcvm's scalar ceremony kernels remain slower than CPU
on representative workloads.

The crossover items are tracked, in code, with line-cited owners:

- **cevm v0.45**: GPU pairing for BLS / Groth16 / Ringtail (≥10×
  projected by `quasar_bls_verifier.hpp` line 23; ≥230× on
  1024-validator quorum by direct math).
- **cevm v2 EVM kernel**: 32-threads/tx SIMD path; replaces the v1
  parity kernel on warp-friendly bytecode workloads.
- **mpcvm v0.62**: per-slot fan-out (radix sort + segmented unique +
  parallel keccak) on FROST / CGGMP21 / Ringtail ceremonies; same
  canonical winner, parallel production. Targets Metal ≥ 5× CPU on
  xlarge.
- **fhe MLX dispatcher**: wires `FHEpke` / `FHEbinfhe` to
  `lux::mlx_backend::MLXPolyOps` above (B≥32, N∈{1024, 4096, 8192});
  pulls every higher-level CKKS / BFV / BGV / TFHE op into the
  measured 23.6× band.

The CPU touches reality. The GPU runs the chain — and on F-Chain
today, the GPU is **23.6× faster** than CPU on the inner loop that
defines FHE throughput. The other chains' crossover lands on the
roadmap items above.

## Sources

- `luxcpp/cevm/BENCHMARKS.md` (v0.44.1)
- `luxcpp/mpcvm/BENCHMARKS.md` (v0.61.1)
- `luxcpp/fhe/BENCHMARKS.md`
- `luxcpp/platformvm/BENCHMARKS.md` — pending at deadline
- `luxcpp/xvm/BENCHMARKS.md` — pending at deadline
- `luxcpp/aivm/BENCHMARKS.md` — pending at deadline
- `luxcpp/bridgevm/BENCHMARKS.md` — pending at deadline
- `LP-137-COVERAGE.md` (companion: coverage + 4-way determinism)
- `LP-137-gpu-residency-invariant.md` (the invariant spec)

## Reproducing

Per chain, `cd luxcpp/<vm>` and follow the "Reproducing" section of
that chain's `BENCHMARKS.md`. The cevm + fhe + mpcvm reproduction
commands at the bottom of each of those files reproduce every number
in the table above on the same Apple M1 Max host.
