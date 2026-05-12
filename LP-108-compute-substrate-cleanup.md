---
lp: 108
title: Compute Substrate Cleanup — One Implementation Per Operation Per Backend
description: Promote `lux/math` to the single canonical compute substrate. Rip out duplicate kernels, vapor stubs, and half-baked GPU paths. Define the production gate every implementation must pass.
author: Zach Kelling (z@zoo.ngo)
status: Draft
type: Standards Track
category: Core
created: 2026-05-04
---

## Abstract

LP-107 promised "one and only one way to do everything" for the math
substrate. The reality after agent-swarm audit (this session): the
codebase carries multiple parallel implementations of the same
primitives, multiple GPU kernels claiming to do the same thing with
varying degrees of realness, and several "GPU paths" that are
production stubs (`return nil, nil`) or fabricated benchmarks
(`time.Sleep` reporting hardcoded numbers).

LP-108 is the cleanup. It takes the "compute substrate" framing the
user laid out, audits what actually ships, and rips out everything
that fails the production gate.

## The Production Gate

An implementation may live in a production path **only if** it has
all four:

1. **Canonical-vector correctness test** — passing today.
2. **Backend parity test** — CPU == Metal == CUDA == WGSL byte-equal
   on the same vector corpus, passing today.
3. **Reproducible bench** — measured numbers, real hardware, in tree.
4. **Single canonical owner** — exactly one file, exactly one home,
   imported by every consumer.

Anything failing any of these moves to one of:
- `MOVE` — useful, wrong location → migrate
- `WRAP` — domain-specific wrapper → rewrite to call the canonical
- `ARCHIVE` — interesting but not production-ready → `archive/` dir
- `DELETE` — broken / stale / fake / redundant → gone

No production code may import from `archive/`, `experimental/`, or
duplicate paths.

## Canonical Layout

```
lux/math/                          # ONE primitive substrate, Go + bindings
  go/                              # luxfi/math (existing, v1.4.0)
    params/ backend/ codec/ modarith/ ntt/ poly/ rns/ sample/

luxcpp/math/                       # ONE primitive substrate, C++/CPU + GPU
  include/lux/math/
    ntt.hpp                        # public API — backend-agnostic
    montgomery.hpp
    keccak.hpp
    poseidon.hpp
    blake3.hpp
    field.hpp                      # generic field arithmetic
    msm.hpp                        # multi-scalar multiplication
    sample.hpp
    arena.hpp                      # shared GPU memory arena
    dispatch.hpp                   # backend selector
  src/cpu/
    ntt.cpp keccak.cpp ...         # ONE C++ CPU body per primitive
  src/gpu/
    metal/{ntt,keccak,...}.metal   # ONE Metal kernel per primitive
    cuda/{ntt,keccak,...}.cu       # ONE CUDA kernel per primitive
    wgsl/{ntt,keccak,...}.wgsl     # ONE WGSL kernel per primitive
  bindings/
    go/                            # cgo bridge to luxfi/math
    c-abi/                         # stable C surface for non-Go callers
  test/
    vectors/                       # canonical KAT corpora
    parity/                        # CPU == Metal == CUDA == WGSL gates
    bench/                         # reproducible benchmarks

# Domain packages — ONLY higher-level, all primitives via lux/math:
luxcpp/cevm/                       # EVM execution kernels (Block-STM, opcodes)
luxcpp/dex/                        # DEX matching kernels (CPU today; GPU=research)
luxcpp/crypto/fhe/                 # FHE bootstrap + keyswitch (composes math/ntt)
luxcpp/crypto/corona/            # Pulsar threshold (composes math/ntt + math/sample)
luxcpp/crypto/lens/                # Lens curve threshold (composes math/curve)
luxfi/consensus/                   # consensus engine (composes everything)
```

**Domain code may NOT carry private copies of**: NTT, Montgomery,
Keccak, Poseidon, BLAKE3, field arithmetic, GPU dispatch, GPU
memory allocation. Those live in `lux/math` only.

## Audit Manifest

Honest classification of every GPU/math implementation found in the
audit. Status determined by running the test executables on M1 Max
2026-05-04 evening.

### NTT / Montgomery / lattice ring (the LP-073 Pulsar parameter set)

| File | Backend | Tests | Bench | Status | Action |
|---|---|---|---|---|---|
| `luxfi/math/ntt/canonical/*` | Go-pure | ✅ ntt_test 3/3 | ✅ via Pulsar reshare | KEEP | canonical |
| `luxfi/lattice/v7/ring/modular_reduction.go` | Go-pure | ✅ ring tests | ✅ | WRAP | already a thin shim over math/ntt/canonical (Phase 3 done) |
| `luxcpp/crypto/corona/cpp/lattice_ring.cpp` | C++ CPU | ✅ corona_lattice_ring_kat | ✅ lattice_ring_bench | MOVE | → `luxcpp/math/src/cpu/ntt.cpp` (Pulsar parameter set) |
| `luxcpp/crypto/corona/gpu/metal/lattice_ring.metal` | Metal | ✅ metal_kat_test | ✅ sweep bench | MOVE | → `luxcpp/math/src/gpu/metal/ntt_pulsar.metal` |
| `luxcpp/crypto/corona/gpu/cuda/lattice_ring.cu` | CUDA | only via host polyfill | ⚠️ no live CUDA | MOVE | → `luxcpp/math/src/gpu/cuda/ntt_pulsar.cu` |
| `luxcpp/crypto/corona/gpu/wgsl/lattice_ring.wgsl` | WGSL | ✅ wgsl_kat_test | ✅ sweep bench (real wgpu-native) | MOVE | → `luxcpp/math/src/gpu/wgsl/ntt_pulsar.wgsl` |

### NTT / Montgomery (the FHE PN10QP27 / PN11QP54 parameter sets)

| File | Backend | Tests | Bench | Status | Action |
|---|---|---|---|---|---|
| `luxcpp/crypto/fhe/cpp/backends/cpu/*` | C++ CPU | ✅ fhe_smoke + kat | ✅ fhe_bench_ntt | MOVE | → `luxcpp/math/src/cpu/ntt_fhe.cpp` (param-pinned) OR collapse into the Pulsar body parametrized |
| **`luxcpp/crypto/fhe/cpp/backends/metal/metal_ntt_kernel.cpp`** | "Metal" | ❌ `has_device()` returns false | n/a | **DELETE** | scaffolded; routes to `lux_fhe::cpu::ntt_forward`. Not a Metal impl. |
| `luxcpp/crypto/fhe/cpp/backends/cuda/*` | CUDA | ⚠️ host polyfill on non-CUDA | ⚠️ no perf bench | WRAP | KAT-equivalent under cudaGetDeviceCount>0; needs CUDA host CI |
| **`luxcpp/gpu/kernels/{blind_rotate,external_product,fused_external_product,blind_rotate_fused,bsk_prefetch,fhe_kernels,reduce,tensor_ops,dag_executor}.{cu,metal,wgsl}`** (~7,500 LoC × 3 backends = 22,500 LoC) | all 3 | ❌ never invoked — `metal_backend.mm:1571-1581` registers `metal_not_supported_*` stubs | n/a | **ARCHIVE or DELETE** | Comment in `fhe_kernels.metal:582` explicitly notes "host-side scheduler handles this pipeline" — that scheduler does not exist. |
| **`luxcpp/metal/kernels/fhe/*.metal`** (21 files, 12,774 LoC) | "Metal" | ❌ not loaded by `metal_plugin.mm` | n/a | **ARCHIVE or DELETE** | `metal_plugin.mm:520` says "CPU fallback for now, Metal kernels can be added later" |
| **`luxcpp/metal/src/metal_plugin.mm:520-791`** | "Metal" registered ops | ❌ `metal_op_tfhe_bootstrap`, `metal_op_blind_rotate`, `metal_op_tfhe_keyswitch`, `metal_op_ntt_*` are CPU functions | n/a | **REWRITE** | Either wire to real Metal kernels OR remove the misleading registration so callers see "device unavailable" not silent CPU dispatch |
| `luxcpp/lattice/src/metal/metal_ntt.mm` | Metal | ✅ loads `lux_lattice.metallib` (real artifact) | ⚠️ no published bench | KEEP | **the only real Metal NTT outside Pulsar** |

### EVM execution kernels

| File | Backend | Tests | Bench | Status | Action |
|---|---|---|---|---|---|
| `luxcpp/cevm/lib/evm/gpu/metal/keccak256.metal` | Metal | ✅ pipeline test 4 | ⚠️ no perf bench | KEEP | domain kernel; should call `luxcpp/math/src/gpu/metal/keccak.metal` once that exists |
| `luxcpp/cevm/lib/evm/gpu/metal/tx_validate.metal` | Metal | ✅ pipeline test 1 | ⚠️ no perf bench | KEEP | domain |
| `luxcpp/cevm/lib/evm/gpu/metal/state_table.metal` | Metal | ✅ pipeline test 3 | ⚠️ no perf bench | KEEP | domain |
| `luxcpp/cevm/lib/evm/gpu/metal/block_stm.metal` | Metal | ✅ pipeline test 2 (1000/1000) | ⚠️ no perf bench | KEEP | domain — Block-STM scheduler |
| `luxcpp/cevm/lib/evm/gpu/cuda/*.cu` (5 files) | CUDA | source-mirror only | ⚠️ no live CUDA | KEEP | domain — needs CUDA-host CI to validate |
| `luxcpp/cevm/lib/evm/gpu/kernel/evm_kernel.metal` | Metal | ✅ 147/147 opcode parity | ⚠️ no perf bench | KEEP | domain — Cancun interpreter (V1) |
| **`luxcpp/cevm/lib/evm/gpu/kernel/evm_kernel_v2.metal`** | Metal | ❌ always returns status=255, falls back to V1 | — | **DELETE** | "32 lanes/tx" is buffer-zero only; not real fan-out |
| **`luxcpp/cevm/lib/evm/gpu/kernel/v3_persistent.metal`** | Metal | ❌ produces synthetic results keyed by code_size | — | **DELETE** | not actually persistent; documented as such in the file's own header |
| **`luxcpp/cevm/lib/evm/gpu/host/frame_cuda.cu`** | CUDA | "no device code yet" comment in source | — | **DELETE** | 29 LoC of comments |
| **`luxcpp/cevm/lib/evm/gpu/host/frame_metal.mm`** | Metal | "leaf-pure frames only" | — | ARCHIVE | 43 LoC; CALL/CREATE not implemented; consensus blocker |
| `luxcpp/cevm/lib/consensus/quasar/gpu/quasar_wave.metal` | Metal | ✅ 33+6+7+8+8 cases | ⚠️ no perf bench | KEEP | domain — Quasar substrate |
| `luxcpp/cevm/lib/consensus/quasar/gpu/quasar_wave.cu` | CUDA | source-mirror only | — | KEEP | needs CUDA-host CI |

### EVM Go-side wiring

| File | Status | Action |
|---|---|---|
| `~/work/lux/evm/core/parallel/backend_cevm.go:50` `return nil, nil` | **STUB** | **DELETE the stub** — either wire the real cevm dispatch or remove the registration entirely. No `return nil, nil` in production paths. |
| `~/work/lux/evmgpu/` (Go-side EVM with "GPU" in the name) | NO `.metal`/`.cu`/`.wgsl` files exist | **RENAME** to `~/work/lux/evm-fork/` or merge with `~/work/lux/evm/`. The "gpu" name is misleading; cevm is the GPU EVM. |

### EVM parity status (the actual blocker for production GPU EVM)

`evm-parity-test` reports **0/133** vectors agree across CPU / parallel-CPU / GPU-Metal as of 2026-05-04. Failures cluster on:
- `oog_low_gas` (gas accounting)
- EIP-2929 warm/cold mismatches
- Full-1024 stack depth tests (3/3 failing)
- Storage overflow (4/4 failing — 65th SSTORE/TSTORE bounds)

**Until parity is 133/133, GPU EVM cannot be production-default.** This is the gate. Status today: **NOT MET**.

### DEX matching engine

| File | Backend | Status | Action |
|---|---|---|---|
| `~/work/lx/dex/pkg/lx/orderbook.go::MatchOrders` | Go CPU | ✅ tests + 524k orders/s/core | KEEP |
| `~/work/luxcpp/dex/src/orderbook.cpp::match_order` | C++ CPU | ✅ tests + 5M orders/s/core | KEEP |
| **`~/work/lx/dex/pkg/engine/mlx_engine.go::ProcessBatch`** | "MLX" | ❌ calls `time.Sleep`; returns hardcoded `597 ns/order` | **DELETE** — fabricated benchmark |
| **`~/work/lx/dex/pkg/lx/fpga_accelerator.go`** + `pkg/fpga/*` | "FPGA" | ❌ interface-only, no bitstream, no driver | **DELETE** — no real implementation |
| `~/work/lx/dex/pkg/lx/orderbook.go::detectBestBackend` | dispatcher | ⚠️ returns CUDA/MLX/CGO/Go enum but only Go path executes | **WRAP** — collapse to just CPU until real GPU path exists |

**DEX-on-GPU verdict (per agent audit):**
- Phase 1 (sig batch verify on GPU): tractable in 1 week. Wire existing `secp256k1_batch_inv` from `luxcpp/crypto/secp256k1/gpu/`.
- Phase 2 (order-book lookup batch): marginal win, 3-4 weeks.
- Phase 3 (match resolution on GPU): research-grade, no precedent in production. Match is fundamentally sequential by price-time priority.
- Phase 4 (full pipeline GPU-resident): speculative, 2+ quarters.

### Pulsar threshold signing

| File | Status | Action |
|---|---|---|
| `luxcpp/crypto/corona/gpu/metal/lattice_ring.metal` | ✅ benched (sweep), ✅ KAT, real perf | KEEP — promote to canonical Metal NTT |
| `luxcpp/crypto/corona/gpu/wgsl/lattice_ring_wgpu.cpp` | ✅ real wgpu-native, ✅ KAT, ✅ benched | KEEP |
| Pulsar Round-1 mat-mul on GPU | ❌ no kernel — Round-1 is N serial CPU NTT calls | **WRITE** — domain-specific kernel that batches the 2688-NTT mat-mul through the canonical Metal NTT batch entry |

### Math substrate (LP-107 already shipped)

| Package | Status | Action |
|---|---|---|
| `luxfi/math/{params,backend,codec,modarith,ntt,poly,rns,sample}` | ✅ all tests pass | **KEEP — canonical Go**. v1.4.0. |
| `luxcpp/crypto/math/{params,codec,modarith,ntt,poly,sample}` | ✅ tests pass + 991 cross-runtime KATs | **MOVE** to `luxcpp/math/` (top level, drop `crypto/` prefix). Single canonical C++ math home. |
| `luxcpp/crypto/math/ntt/c-abi/c_math_ntt.{cpp,h}` | ✅ compiles, GPU dispatch surface | KEEP at the new location |
| `luxfi/lattice/v7/ring/` (lattice library) | ✅ thin shim over math/ntt/canonical | KEEP as-is; downstream consumers don't break |

## Migration Plan

### Phase 1: Promote `luxcpp/crypto/math` to `luxcpp/math` (top level)

Move `luxcpp/crypto/math/` → `luxcpp/math/` so the C++ math substrate has the same top-level prominence as `luxfi/math` does on the Go side. Update CMake includes everywhere that references it.

### Phase 2: Move generic kernels into `luxcpp/math/src/gpu/{metal,cuda,wgsl}/`

Currently the canonical Pulsar NTT kernels live under `luxcpp/crypto/corona/gpu/`. Move them:

```
luxcpp/crypto/corona/gpu/metal/lattice_ring.metal
  → luxcpp/math/src/gpu/metal/ntt.metal

luxcpp/crypto/corona/gpu/wgsl/lattice_ring.wgsl
  → luxcpp/math/src/gpu/wgsl/ntt.wgsl

luxcpp/crypto/corona/gpu/cuda/lattice_ring.cu
  → luxcpp/math/src/gpu/cuda/ntt.cu
```

The kernel is parameterized by `(N, Q, mrc, brc, roots)` — the same kernel handles Pulsar (N=256, Q=0x1000000004A01) and FHE (N=1024, Q≈2^27) parameter sets. The FHE-specific kernels in `luxcpp/crypto/fhe/cpp/backends/{cpu,metal,cuda}/` become **WRAP** stubs that call the canonical NTT with FHE parameters.

### Phase 3: Build the shared GPU arena

Currently every kernel allocates its own buffers per call (the bench measures the cost of that). Add `luxcpp/math/include/lux/math/arena.hpp`:

```cpp
class GpuArena {
public:
  Buffer alloc(size_t bytes, Alignment align);
  void   release(Buffer);
  void   reset();      // bulk-free; per-frame lifecycle
};

class GpuGraph {
public:
  void add_pass(Kernel kernel, Args args);
  void submit();
  void wait();
};
```

First user: the Pulsar Round-1 mat-mul (2688 NTTs as one persistent batch through `GpuGraph`). Wire next: cevm Block-STM (already works one-shot), FHE bootstrap chain.

### Phase 4: Delete the vapor

**EVM (cevm) vapor:**
- `luxcpp/cevm/lib/evm/gpu/kernel/evm_kernel_v2.metal` — DELETE (status=255 fallback, not real fan-out)
- `luxcpp/cevm/lib/evm/gpu/kernel/v3_persistent.metal` — DELETE (synthetic, not persistent — own header admits it)
- `luxcpp/cevm/lib/evm/gpu/host/frame_cuda.cu` — DELETE (29 LoC of comments, "no device code yet")
- `luxcpp/cevm/lib/evm/gpu/host/frame_metal.mm` — ARCHIVE (43 LoC, "leaf-pure frames only")

**FHE vapor (the big one — ~35K LoC across two locations):**
- `luxcpp/crypto/fhe/cpp/backends/metal/metal_ntt_kernel.{cpp,hpp}` — DELETE; `has_device()` returns false, just routes to CPU
- `luxcpp/gpu/kernels/{blind_rotate,external_product,fused_external_product,blind_rotate_fused,bsk_prefetch,fhe_kernels,reduce,tensor_ops,dag_executor}.{cu,metal,wgsl}` — ARCHIVE to `archive/gpu-kernels-no-host-scheduler-2026-05/` (preserve the work but get it out of production paths). Total: ~22,500 LoC across 3 backends.
- `luxcpp/metal/kernels/fhe/*.metal` (21 files, 12,774 LoC) — ARCHIVE to `archive/metal-kernels-no-host-2026-05/`. Not loaded by `metal_plugin.mm`.
- `luxcpp/metal/src/metal_plugin.mm:520-791` — REWRITE the `metal_op_tfhe_*` and `metal_op_ntt_*` registrations: either drop them entirely (so callers see "device unavailable") or wire them to real Metal kernels. The current "Metal symbol = CPU function" pattern misleads every caller.
- `luxcpp/gpu/src/metal_backend.mm:1571-1581` — same: stop registering `metal_not_supported_*` and let the dispatcher report no Metal FHE backend honestly.

**DEX vapor:**
- `~/work/lx/dex/pkg/engine/mlx_engine.go` — DELETE (time.Sleep stub returning hardcoded 597 ns/order)
- `~/work/lx/dex/pkg/lx/fpga_accelerator.go` + `pkg/fpga/*` — DELETE (interface only, no bitstream, no driver)
- `~/work/lx/dex/pkg/lx/orderbook.go::detectBestBackend` — collapse to CPU-only enum (the CUDA/MLX/CGO branches set the enum but only Go path executes)
- `~/work/lx/dex/test/benchmark/orderbook_bench_test.go:79` — DELETE the hardcoded `597 ns/order` literal pretending to be a measurement

**Production wiring stubs:**
- `~/work/lux/evm/core/parallel/backend_cevm.go:50 return nil, nil` — DELETE the stub. Either wire the real `cevm.ExecuteBlock` call (the cgo bridge exists at `~/work/lux/chains/evm/cevm/cevm_cgo.go` and works for benchmarks) or remove the entire `cevmExecutor` registration so the parallel backend doesn't carry a phantom path.

**Math substrate duplicates:**
- `luxcpp/crypto/fhe/cpp/backends/cpu/ntt_cpu.cpp` (FHE PN-prime NTT, separate body) — REWRITE as a thin wrapper over `luxcpp/math/src/cpu/ntt.cpp` parameterized for the FHE moduli. One canonical NTT body across PN10QP27 / PN11QP54 / Pulsar parameter sets.
- `luxcpp/crypto/ntt/cpp/ntt.cpp` (Cyclone-FFT prime 998244353, generic body) — same: collapse into the canonical NTT parameterized.
- Three NTT byte-equality targets currently exist (Lattigo Montgomery / Cyclone / FHE PN-prime). After this phase: ONE body that takes `(N, Q, mrc, brc, roots)` as inputs.

### Phase 5: Backend parity test gate

Add `luxcpp/math/test/parity/` with one parity test per primitive that runs:
- The CPU body
- The Metal kernel
- The CUDA kernel (skipped on non-CUDA hosts)
- The WGSL kernel via wgpu-native

on the SAME canonical vector, asserting byte-equal across all four. This is the gate that gets enforced in CI; any kernel that doesn't pass it gets ARCHIVE'd.

Initial primitives: NTT (already done — 991 cross-runtime KATs), Keccak-256, Montgomery scalars. Then expand.

### Phase 6: One e2e harness

Single binary `luxbench-e2e` that runs:

```
component  | backend     | gpu_resident | cpu_roundtrips | throughput   | latency  | status
EVM        | Metal       | partial      | 1 (state)      | X tx/sec     | Y ms     | tested (no CALL/CREATE)
DEX        | CPU         | no           | n/a            | 5M orders/s  | 116 ns   | CPU-only (GPU=research)
FHE        | Metal       | yes          | 0              | X ops/sec    | Y ms     | tested
Consensus  | Metal       | yes (Round1) | 1 (combine)    | X sig/sec    | Y ms     | tested
```

No fake "all GPU" claim until every row says `gpu_resident: yes`. The honest table is the deliverable.

## Production Truth Table (today, 2026-05-04 evening)

| Component | Real GPU code? | Tests pass? | Production wired? |
|---|---|---|---|
| **Pulsar NTT (consensus)** | ✅ Metal + WGSL real, ✅ benched | ✅ 991 cross-runtime KATs | ✅ Pulsar uses CPU body via Go; GPU dispatch is opt-in via env |
| **Quasar wave (consensus)** | ✅ Metal 2718 LoC | ✅ 33+6+7+8+8 cases | ⚠️ standalone; not wired to luxd consensus path |
| **EVM Block-STM scheduler** | ✅ Metal 600 LoC | ✅ 1000/1000 match | ❌ `backend_cevm.go:50 return nil, nil` |
| **EVM Cancun opcode interpreter** | ✅ Metal V1 1231 LoC | ✅ 147/147 opcode parity, but ❌ 0/133 evm-parity-test | ❌ same stub above |
| **EVM CALL/CREATE family** | ❌ status=5 fallback | n/a | ❌ blocks any non-leaf tx |
| **DEX matching** | ❌ no kernel anywhere | n/a | ❌ CPU only — and that's fine; GPU=research |
| **FHE bootstrap** | ⚠️ kernels exist (luxcpp/gpu/kernels/) but coverage uncertain | pending FHE audit | ⚠️ partial |
| **Sig batch verify** | ✅ secp256k1_batch_inv Metal+CUDA | ✅ KAT | ❌ not wired into DEX or consensus |

**Net**: the ONE component that's genuinely production-ready GPU end-to-end on M1 Max is the **Pulsar NTT primitive**. Everything above that is either domain code with parity gaps (EVM), no GPU code at all (DEX), or partial wiring (FHE bootstrap on Metal).

## Decision

LP-108 makes three commitments:

1. **`luxcpp/crypto/math` becomes `luxcpp/math`** (Phase 1, this session).
2. **Vapor gets deleted** (Phase 4, this session): `evm_kernel_v2.metal`, `v3_persistent.metal`, `frame_cuda.cu`, `mlx_engine.go`, `fpga_accelerator.go`, `backend_cevm.go:50` stub.
3. **Production claims align with the production truth table.** No "EVM running natively on GPU" marketing until the table says so. Until then: "Pulsar NTT primitive runs on Metal; EVM has GPU code in development with 0/133 parity gaps; DEX is CPU; FHE has GPU kernels under audit."

Phases 2-3 (kernel relocation + shared arena) are queued for this session if time permits, separate PR otherwise. Phase 5-6 (parity test gate, e2e harness) are v0.3.0.

## What this LP is NOT

- NOT a deletion-blindly project. Every DELETE is justified above with a file-line reason.
- NOT a redo of LP-107. LP-107 (`luxfi/math` substrate) ships and works; this LP relocates it and rips out the duplicates that pre-existed.
- NOT a claim that DEX or EVM will be on GPU "soon." DEX matching on GPU is a research project; EVM CALL/CREATE on GPU is a quarter+ of work.

## References

- LP-107 (math substrate, prerequisite)
- DEX agent audit: `~/work/lx/dex` analysis (2026-05-04)
- EVM agent audit: `~/work/luxcpp/cevm` analysis (2026-05-04)
- FHE agent audit: pending receipt
- Production sweep: `~/work/lux/papers/lux-blockchain-scaling-laws/data/ntt-sweep-m1max-2026-05-04.tsv`
