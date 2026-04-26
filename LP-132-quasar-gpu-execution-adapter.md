---
lp: 132
title: QuasarGPU Execution Adapter
tags: [gpu, quasar, execution, evm, block-stm, metal, cuda, wave-tick, cert-lanes, page-faults]
description: GPU-native execution adapter for Quasar-certified rounds — wave-tick scheduler, device-resident rings, EVM fibers, MVCC Block-STM, async cold-state, per-lane cert verification
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Execution
created: 2025-12-15
updated: 2026-02-14
requires:
  - lp-009 (GPU-Native EVM)
  - lp-010 (QuasarSTM)
  - lp-020 (Quasar Consensus 3.0)
references:
  - lp-022 (ZAP wire protocol)
  - lp-070 (ML-DSA)
  - lp-073 (Ringtail)
  - lp-075 (BLS)
  - lp-135 (QuasarSTM 4.0 — Production Spec, activation 2026-02-14)
  - lp-010-quasar-stm-4 (4.0 paper, 2026-02-14)
---

# LP-132: QuasarGPU Execution Adapter

## Abstract

QuasarGPU is **CEVM's GPU-side execution adapter for Quasar-certified
rounds**. It executes the round on GPU — Block-STM, EVM fibers, batched
crypto, root construction — and produces the artifacts the Quasar
consensus engine certifies: `block_hash`, `state_root`, `receipts_root`,
`execution_root`, `mode_root`. It optionally aggregates per-lane
certificates from inbound vote/share/proof artifacts.

Critically, this is an **execution adapter**, not a replacement for
`luxfi/consensus`. The boundary is:

```
lux/consensus    orders, votes, certifies, finalizes
cevm             executes, validates, roots, receipts
quasar/gpu/      GPU-side execution adapter for Quasar rounds
```

> One sentence: **consensus decides what must be executed; cevm proves
> what execution produced; Quasar certifies the resulting commitment.**

## Architecture

### Wave-tick scheduler (no host phase orchestration)

Classical GPU EVM models dispatch a separate kernel per phase
(`exec → wait → validate → wait → commit → wait`). QuasarGPU replaces
all of that with **one bounded kernel re-launched once per wave tick**:

```
host:                                  GPU wave-tick kernel:
─────                                  ──────────────────────
begin_round(QuasarRoundDescriptor) → │ 12 service drains run in parallel:
push_txs(...)                       │
push_certs(...) (P/Q/Z lanes)       │   gid 0: Ingress    → Decode
poll_state_requests() → host LSM    │   gid 1: Decode     → Crypto/StateRequest
push_state_pages(...)               │   gid 2: Crypto     → Commit/DagReady/Exec
poll_quasar_certs() ← from CertOut  │   gid 3: DagReady   → Exec
                                    │   gid 4: Exec       → Validate (EVM fibers)
run_wave_tick() — re-dispatch ──────┤   gid 5: Validate   → Commit/Repair (Block-STM)
                                    │   gid 6: Repair     → Exec (incarnation++)
poll_round_result() ← QuasarRoundResult │   gid 7: Commit  → root material
                                    │   gid 8: StateRequest (host poll)
                                    │   gid 9: StateResp  → resume Crypto
                                    │   gid 10: CertLane  → batch verify + aggregate
                                    │   gid 11: CertOut   (host poll)
```

**No persistent hot-spinning kernel.** Each wave tick is a bounded
dispatch; workgroups exit when their service ring is empty or their
budget is exhausted. The GPU scheduler is free to interleave other
kernels between ticks.

### Service map (3.0: 12 services; 4.0: 16 services)

```cpp
enum class ServiceId : uint32_t {
    // 3.0 services (12) — substrate, shipped 2025-12-25
    Ingress           = 0,   // host tx blobs
    Decode            = 1,   // sender recovery / admission gate
    Crypto            = 2,   // sig verify, route to Commit / DagReady / Exec
    DagReady          = 3,   // MVCC ready set (Nebula mode)
    Exec              = 4,   // EVM fiber VM
    Validate          = 5,   // Block-STM read-set check
    Repair            = 6,   // re-execute conflicting txs
    Commit            = 7,   // commit + per-tx receipt keccak
    StateRequest      = 8,   // GPU → host page faults (out)
    StateResp         = 9,   // host → GPU page replies (in)
    CertLane          = 10,  // BLS / Ringtail / MLDSAGroth16 lane artifacts
    CertOut           = 11,  // GPU-emitted per-lane QuasarCert commitments

    // 4.0 services (4 new) — production, shipped 2026-02-14 (v0.43, v0.47, v0.48)
    AdaptiveSchedule  = 12,  // ConflictSpec admission, predictor consult (A)
    BridgeAttest      = 13,  // cross-chain attestation drain (B)
    MarketAuction     = 14,  // auction-rule batched matching for hot DEX lanes (M)
    FiberCheckpoint   = 15,  // per CALL-frame checkpoint emit / GC (F)

    Count             = 16
};
```

The 4.0 service set is referred to as **A/B/M/F** for the four new
drains. Each new service uses a dedicated ring with the same `RingHeader`
+ `items_arena` layout as the 3.0 services and the same wave-tick budget
contract. The 4.0 activation height (2026-02-14) is when `Count` flips
from 12 to 16 in the layout type.

Every ring is a fixed-capacity device buffer with a `RingHeader` at the
front (head/tail/capacity/mask/items_ofs/pushed/consumed) and items
laid out back-to-back in a per-round `items_arena`. Cross-workgroup
visibility uses the relaxed-atomic + `threadgroup_barrier(mem_device)`
pattern proven in v0.30 (V3 wave-dispatch).

### Layout types (host/device shared)

| Type | Purpose | Size |
|---|---|---|
| `RingHeader` | per-ring metadata + pushed/consumed counters | 48 B |
| `IngressTx` | raw tx envelope | 32 B |
| `DecodedTx` | post-recovery tx | 48 B |
| `VerifiedTx` | post-admission tx (carries blob_offset/blob_size for v0.39 EVM) | 32 B |
| `RWSetEntry` | one read or write per Block-STM tx | 24 B |
| `ExecResult` | tx execution output + RW set | 216 B (8 RW slots) |
| `CommitItem` | committable tx + per-tx receipt hash | 64 B |
| `MvccSlot` | open-addressing MVCC arena slot | 32 B |
| `DagNode` | Nebula DAG node + parents + children + pending envelope | 128 B |
| `DagWriterSlot` | most-recent-writer-per-key for v0.40 DAG construction | 32 B |
| `StateRequest` | GPU → host page-fault descriptor | 32 B |
| `StatePage` | host → GPU page-fault reply (≤64 B inline payload) | 96 B |
| `QuasarCertIngress` | per-lane cert artifact ingress | 96 B |
| `QuasarCert` | per-lane cert emission | 432 B |
| `QuasarRoundDescriptor` | host writes once per round | 304 B |
| `QuasarRoundResult` | GPU writes; host reads | 272 B |

### Inline keccak-f[1600]

The kernel ships an **inline FIPS-202 keccak permutation** (24 rounds,
RC table, rotation table). Used for:

- `block_hash` — finalization digest
- `state_root` — accumulated commit chain
- `receipts_root` — per-tx receipt hash chain
- `execution_root` — Block-STM trace commitment
- per-cert `subject` re-derivation (replay protection)

Zero CPU keccak fallback on the round path. The `metal::keccak256_cpu`
helper in `lib/evm/gpu/metal/keccak_host.mm` is reserved for legacy
non-Quasar consumers.

### EVM fiber VM (LP-009 § Fiber model)

`drain_exec` runs the in-kernel EVM interpreter — a **per-tx fiber**
with:

- `pc`, `sp`, `gas`, `status`
- `stack[64]` of 256-bit values (4 × 64-bit limbs each = 13.6 MB for 4096 fibers)
- `memory[1024]` per-fiber scratch
- `pending_key_*[4]` cold-state suspend slot
- `rw[8]` Block-STM read/write set

Currently: **118 opcodes** (full arithmetic incl. `ADDMOD` / `MULMOD` /
`EXP`, all signed/unsigned compares, bitwise incl. `SAR`/`BYTE`,
`KECCAK256`, env opcodes, `PUSH0..PUSH32`, `DUP1..16`, `SWAP1..16`,
`MLOAD` / `MSTORE` / `MSTORE8` / `MSIZE`, `SLOAD` / `SSTORE` with cold-
miss suspend, `JUMP` / `JUMPI` / `PC` / `JUMPDEST` / `GAS`, `STOP` /
`RETURN` / `REVERT` / `INVALID`).

Cold-miss SLOAD → suspend (`status=2`, key in `pending_key_*`, push
StateRequest, restore stack, return). `drain_state_resp` resumes by
re-injecting and stamping the MVCC slot's `last_writer_tx |=
0x80000000` as the "loaded" sentinel.

Deferred to v0.40+: `CALL` family, `CREATE`/`CREATE2`, `LOGn`,
`EXTCODE*`, `RETURNDATA*`, `TLOAD`/`TSTORE`, `MCOPY`, `BLOBHASH`/`BLOBBASEFEE`.

### Block-STM (LP-010 § QuasarSTM)

`drain_exec` records read+write entries into the tx's RW set.
`drain_validate` runs MVCC version-check (`mvcc_check_consistent`); on
mismatch → conflict → repair queue with bumped incarnation. On match →
`mvcc_apply_writes` (atomic version bump) → push `CommitItem`.

Telemetry on `QuasarRoundResult`: `conflict_count`, `repair_count`,
`fibers_suspended`, `fibers_resumed`. Real measured behavior: 16 same-
key contending txs produce **120 conflicts → 120 repairs → 16
commits**. That's textbook Block-STM running entirely on GPU.

### Async cold-state page faults

The host services GPU-emitted state requests via its LSM/cache/disk
path. The GPU **never blocks** on host I/O:

```
host loop:
    while round in progress:
        run_wave_tick()
        reqs = poll_state_requests()
        if reqs.empty(): continue
        pages = state_db.batch_get(reqs)
        push_state_pages(pages)
```

A faulted tx exits Decode into StateRequest and the workgroup moves on.
Other txs continue through the fast path while the slow tx awaits host
service. Finalization gate (`commit.consumed == ingress.pushed`) holds
across both fast and slow lanes.

### Per-lane cert verification (LP-020 § 3.0)

`drain_cert_lane` reads inbound `QuasarCertIngress` items, dispatches
to a per-lane verifier, and accumulates stake into per-lane counters.
At 2/3 quorum threshold, a `QuasarCert` is emitted onto `CertOut`.

Three verifiers (LP-132 §§drain_cert_lane), shipped state per lane:

| Lane | Verifier | Status (post 2026-02-14) | Substrate file |
|---|---|---|---|
| BLS | `verify_bls_aggregate` | **v0.44 real BLS pairing** (BLS12-381) — replaces 3.0 HMAC-keccak placeholder | `lib/consensus/quasar/gpu/crypto/bls12_381.metal` / `.cu` |
| Ringtail | `verify_ringtail_share` | **v0.45 real Ringtail Ring-LWE** share verifier against Q-Chain ceremony key — replaces 3.0 HMAC-keccak placeholder | `lib/consensus/quasar/gpu/crypto/ringtail.metal` / `.cu` |
| MLDSAGroth16 | `verify_mldsa_groth16` | **v0.45 real Groth16** over BLS12-381 against Z-Chain VK — replaces 3.0 HMAC-keccak placeholder | `lib/consensus/quasar/gpu/crypto/groth16.metal` / `.cu` |

The 3.0 launch (2025-12-25) shipped HMAC-keccak placeholders across all
three lanes — real cryptographic verification (one-way with a master
secret; cross-lane domain tags reject replay), structured so the swap
to real BLS / Ring-LWE / Groth16 was a single function-pointer change.
That swap landed under QuasarSTM 4.0 (LP-135) in v0.44 (BLS) and v0.45
(Ringtail + Groth16) and activated on **2026-02-14**. The HMAC-keccak
path is preserved as a development-only mode for deterministic test
vectors and is gated behind `EVM_DEV_HMAC_VERIFIER=1`. See
LP-010-quasar-stm-4 (4.0 paper, 2026-02-14) for the migration.

## Public API

```cpp
namespace quasar::gpu {

class QuasarGPUEngine {
public:
    static std::unique_ptr<QuasarGPUEngine> create();

    QuasarRoundHandle begin_round(const QuasarRoundDescriptor&);
    void              push_txs(QuasarRoundHandle, std::span<const HostTxBlob>);
    void              push_certs(QuasarRoundHandle, std::span<const HostCertIngress>);
    void              push_state_pages(QuasarRoundHandle, std::span<const HostStatePage>);

    std::vector<HostStateRequest> poll_state_requests(QuasarRoundHandle);
    std::vector<HostQuasarCert>   poll_quasar_certs(QuasarRoundHandle);

    QuasarRoundResult run_wave_tick(QuasarRoundHandle);
    QuasarRoundResult run_until_done(QuasarRoundHandle, std::size_t max_ticks);
    QuasarRoundResult poll_round_result(QuasarRoundHandle);

    void request_close(QuasarRoundHandle);
    void end_round(QuasarRoundHandle);

    // ...
};

}  // namespace quasar::gpu
```

## Backends

| Backend | Status | File |
|---|---|---|
| Apple Metal | Complete (v0.31..v0.39) | `quasar_wave.metal`, `quasar_gpu_engine.mm` |
| NVIDIA CUDA | Complete (v0.41) — persistent CTAs, `__threadfence`, same API | `quasar_wave.cu`, `quasar_gpu_engine_cuda.cpp` |
| Runtime dispatcher | Selects Metal on Apple, CUDA on `EVM_CUDA`, else nullptr | `quasar_gpu_runtime.cpp` |

The Metal and CUDA kernels share the layout types (`quasar_gpu_layout.hpp`)
byte-for-byte; structural drift is caught by `static_assert` at compile
time on both sides.

## Scaling Formula

```
T ≈ min(
    E_gpu,                                    // GPU event execution capacity
    B_net / bytes_per_event,                  // network bandwidth
    B_state / bytes_per_state_access,         // hot-state memory bandwidth
    L_independent / conflict_amplification,   // lane independence
    C_cert / cert_cost_per_root,              // certificate throughput
    D_da / data_availability_bytes            // data availability
)
```

QuasarGPU's design thesis:

> **Increase T by maximizing `L_independent` and minimizing
> `cert_cost_per_root`.**

`L_independent` comes from lane partitioning (LP-010 § Lanes).
`cert_cost_per_root` is constant in TPS because validators sign roots,
not individual txs.

### Throughput claim ladder (honest)

| Tier | Workload | Plausible throughput |
|---|---|---|
| **Tier 1 — Events/sec** | order placements, cancels, intents, market data | 1 B aggregate, lane-isolated |
| **Tier 2 — State transitions/sec** | precompile/EVM lane-local effects | 100 M (cluster scale) |
| **Tier 3 — Finalized settlement/sec** | certified roots, receipts, audit commitments | 1–10 M |

The pitch:

> **Billion-event throughput, EVM-settled, Quasar-certified.**

Not "1 B EVM TPS on a single shared state machine" — that's bounded by
contention and data availability, not GPU compute.

## Test surface

The substrate ships with a comprehensive test surface
(`test/unittests/quasar_gpu_engine_test.mm`):

| Test | What it asserts |
|---|---|
| `empty_round` | begin/close/finalize with no txs |
| `single_tx_real_roots` | block_hash, receipts_root, execution_root all non-zero |
| `multi_tx_counters` | per-stage `pushed == consumed` for 128 txs |
| `bounded_backpressure` | 1024 txs across small per-tick budget; finalizes |
| `end_to_end_stress` | 1024 txs in 8 wave ticks, ~150 ms on M1 Max |
| `state_page_fault` | host-serviced cold misses round-trip |
| `root_determinism` | same input → same roots across runs |
| `block_stm_independent_txs` | 64 disjoint-key txs, conflict_count=0 |
| `block_stm_conflict_repair` | 16 same-key txs, conflict_count=120, repair_count=120 |
| `evm_fiber_arithmetic` | `PUSH1 1; PUSH1 2; ADD; STOP` commits with correct gas |
| `evm_fiber_storage` | SLOAD cold-miss → suspend → resume; fibers_suspended ≥ 1 |
| `evm_fiber_revert` | REVERT path drains cleanly |
| `quasar_quorum_round_trip` | 3 BLS + 1 ML-DSA + 2 Ringtail; tampered & cross-lane replay rejected |

Plus the broader 19-binary GPU test surface (parity, modes, host-bridge,
pipeline, unified, gpu-state, opcodes, dispatch, refund, access-list,
stack-depth, storage-overflow, etc.). All 19 PASS on Apple M1 Max.

## Forbidden patterns

QuasarGPU **must not** use:

- one global STM clock
- one global version map lock
- retry-until-success GPU loops
- nondeterministic conflict victim selection
- opcode-level STM (it's tx-level)
- CPU compute on the round path (host is doorbell + I/O only)
- per-version `malloc` (use the per-round arena)
- global hot-key spinlocks

## Implementation Plan (3.0 substrate + 4.0 production)

### 3.0 substrate (shipped 2025-12-25)

| Version | Theme |
|---|---|
| v0.31..v0.39 | substrate complete |
| **v0.40** | predicted-access-set DAG construction + Prism frontier (Nebula mode) |

### 4.0 production train (shipped 2026-02-14, activation height)

| Version | Theme |
|---|---|
| **v0.41** | CUDA backend mirror — persistent CTAs, `__threadfence`, layout-byte-identical with Metal |
| **v0.42** | cert-subject hardening (`certificate_subject` includes P/Q/Z roots), `KnownTotalOrder`, mode roots separated |
| **v0.43** | ConflictSpec ABI + LaneClass + dynamic per-lane VersioningMode + AdaptiveSchedule drain |
| **v0.44** | **real BLS12-381 pairing kernel** (replaces HMAC-keccak BLS placeholder) |
| **v0.45** | **real Ringtail Ring-LWE share verifier** + **real Groth16** verifier (replaces HMAC-keccak placeholders) |
| **v0.46** | full EVM coverage (175 opcodes, full CALL/CREATE family, LOGn, EXTCODE*, RETURNDATA*, TLOAD/TSTORE, MCOPY, BLOBHASH/BLOBBASEFEE) + journaled SSTORE + EIP-2929/3529 + Tier 3 semantic reducers |
| **v0.47** | predictive scheduling + Chiron-style execution-hint roots emitted per wave tick |
| **v0.48** | Motor VersionBlock layout (4 → 8 inline versions per key) + A/B/M/F drains: AdaptiveSchedule, BridgeAttest, MarketAuction, FiberCheckpoint |
| **v0.49** | CSMV commit-server scaffold + formal CPU reference + cross-backend determinism harness gated in CI at ≥ 80% line coverage |

The QuasarSTM 4.0 production spec is LP-135. The 4.0 production paper
(LP-010-quasar-stm-4, 2026-02-14) is the canonical reference.

## References

| Resource | Location |
|---|---|
| Substrate source | `cevm/lib/consensus/quasar/gpu/` |
| Tests | `cevm/test/unittests/quasar_gpu_engine_test.mm` |
| Layout types | `cevm/lib/consensus/quasar/gpu/quasar_gpu_layout.hpp` |
| Metal kernel | `cevm/lib/consensus/quasar/gpu/quasar_wave.metal` |
| CUDA kernel | `cevm/lib/consensus/quasar/gpu/quasar_wave.cu` |
| Host driver (Metal) | `cevm/lib/consensus/quasar/gpu/quasar_gpu_engine.mm` |
| Host driver (CUDA) | `cevm/lib/consensus/quasar/gpu/quasar_gpu_engine_cuda.cpp` |
| Runtime dispatcher | `cevm/lib/consensus/quasar/gpu/quasar_gpu_runtime.cpp` |
| LP-009 | GPU-Native EVM |
| LP-010 | QuasarSTM (Block-STM 3.0 substrate, 2025-12-25) |
| LP-020 | Quasar Consensus 3.0 (cert lanes + P/Q/Z, 2025-12-25) |
| LP-135 | QuasarSTM 4.0 — Production Spec (activation 2026-02-14) |
| LP-010-quasar-stm-4 | QuasarSTM 4.0 production paper (2026-02-14) |

## Changelog

- **2025-12-15** — 3.0 substrate spec, 12 service IDs, three HMAC-keccak
  cert verifiers, 118-opcode EVM fiber, single-GPU; activated 2025-12-25.
- **2026-02-14** — **QuasarSTM 4.0 activation**: 16 service IDs (12 + 4
  A/B/M/F), real BLS12-381 / Ringtail Ring-LWE / Groth16 verifiers
  (v0.44/v0.45), 175-opcode EVM with full CALL/CREATE/LOG/EXTCODE/
  RETURNDATA/TLOAD/TSTORE/MCOPY/BLOBHASH/BLOBBASEFEE coverage (v0.46),
  predictive scheduling + Chiron hint roots (v0.47), Motor VersionBlock
  (v0.48), CSMV scaffold + formal CPU reference + cross-backend
  determinism harness (v0.49). Wire schema unchanged. See LP-135 and
  LP-010-quasar-stm-4.

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.
