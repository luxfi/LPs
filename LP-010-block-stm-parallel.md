---
lp: 010
title: Block-STM 3.0 — QuasarSTM
tags: [parallel, block-stm, quasar-stm, mvcc, lanes, prism, gpu, ordered-execution, semantic-reducers]
description: GPU-native, lane-aware ordered MVCC execution fabric for QuasarGPU
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Execution
created: 2025-03-01
updated: 2025-12-15
requires:
  - lps-009 (GPU-Native EVM)
  - lps-020 (Quasar Consensus)
  - lp-132 (QuasarGPU Execution Adapter)
references:
  - lp-135 (QuasarSTM 4.0 — Production Spec, activation 2026-02-14)
  - lp-010-quasar-stm-4 (4.0 paper, 2026-02-14)
supersedes:
  - lp-010-v2 (Block-STM Parallel Transaction Execution, 2025-03-01..2025-11-30)
---

# LP-010: Block-STM 3.0 — QuasarSTM

## Abstract

Block-STM 3.0, codenamed **QuasarSTM**, is the GPU-native ordered MVCC
execution fabric underneath Lux's Nova (linear) and Nebula (DAG) modes.
Block-STM 1.0 was CPU-only ordered speculative execution. 2.0 was the
GPU wave-drain port with repair telemetry. **3.0 is a re-architecture**:
Block-STM is no longer "parallel executor with repairs". It is the
serializability fabric beneath Prism frontiers, EVM fibers, DEX
precompiles, and Quasar-certified roots.

The headline change: Block-STM stops being a *retroactive* conflict
detector and becomes a *scheduler-aware* fabric that continuously feeds
contention telemetry back into Prism partitioning. When Block-STM is
constantly repairing, the design has failed; QuasarSTM keeps repair
amplification below 1% under realistic regulated-DEX workloads.

## Versioning

| Version | What it was | Status |
|---|---|---|
| **1.0** | CPU ordered speculative execution (Diem/Aptos style) | Superseded |
| **2.0** | GPU wave-drain executor, single MVCC arena, repair telemetry | Superseded by this LP |
| **3.0 (QuasarSTM)** | Lane-aware ordered MVCC; three-tier validation; semantic reducers; checkpoint repair; commit horizons; multi-GPU sharding | **This LP** |

## Module Layout

```
lib/consensus/quasar/gpu/stm/
  quasar_stm_layout.hpp
  quasar_stm_engine.hpp
  quasar_stm_validate.metal     // tier 1+2+3 validation
  quasar_stm_repair.metal        // checkpoint rollback + full re-exec
  quasar_stm_commit.metal        // horizon detection + root material
  quasar_stm_gc.metal            // version arena reclamation
```

Public symbols:

```
QuasarSTM, QuasarSTMWorkspace
StmTxn, StmKeyHeader, StmVersion
StmLane, StmLaneClock, StmLaneHint
StmFrontier, StmConflict, StmRepair, StmCommitHorizon
StmTelemetry
```

## Pipeline

```
Quasar round
  ↓
Nova order  /  Nebula DAG
  ↓
Prism frontier
  ↓
lane refraction         ← prevents conflicts before STM sees them
  ↓
EVM fiber execution
  ↓
ordered MVCC writes
  ↓
lane-clock fast validation        ← Tier 1
  ↓
key-level visible-version validation  ← Tier 2
  ↓
semantic commutativity validation     ← Tier 3
  ↓
checkpoint rollback / repair          ← incremental
  ↓
commit horizon                        ← prefix/cut, not per-tx
  ↓
root material
  ↓
QuasarRoundResult
```

## Scientific Foundations

QuasarSTM borrows from three concurrency-control families and discards
their failure modes for GPU + ordered-output settings.

### From Block-STM (Aptos/Diem)
**Keep**: deterministic ordered execution model. Transactions execute
in parallel; validation guarantees the final result matches the
canonical order; conflicts trigger re-execution. Block-STM's central
contribution is treating a known transaction order as useful validation
structure rather than a serialization bottleneck.

### From TicToc (SIGMOD 2016, Yu et al.)
**Borrow**: per-data-item read/write timestamps avoid a centralized
timestamp counter. **Adapt**: timestamps are used to *reduce false
aborts*, not to alter canonical consensus order. TicToc cannot reorder
Nova/Nebula commit order — it only proves that an observed version is
still serializable under the canonical order.

### From TL2 (DISC 2006, Dice/Shalev/Shavit)
**Borrow**: commit-time locking + version-clock validation. **Adapt**:
no single global TL2 clock. **Lane clocks** replace it. Fast path
validates by lane-clock invariance; fallback drops to exact key-version
check.

### From GPU-STM literature (Cederman et al., Holey et al.)
**Discard**: nondeterministic contention managers, unbounded retry
loops, SIMT livelock under hot-key contention. **Replace** with
deterministic conflict policies (§9) and **commit horizons** that
amortize finalization across whole prefixes/cuts (§14).

## Lanes — the Primary Abstraction

A **lane** is the smallest independently schedulable state domain.

```
lane_id = H(domain, contract, account, asset, market, nonce_lane,
            storage_prefix)
```

Examples:

| Lane | Definition |
|---|---|
| sender nonce lane | `H("nonce", account_id, nonce_idx)` |
| account balance lane | `H("acct", account_id)` |
| ERC-20 holder lane | `H("erc20", token, holder)` |
| order book price-level lane | `H("ob", market_id, price_level)` |
| margin account lane | `H("margin", account_id)` |
| pool reserve lane | `H("pool", pool_id)` |
| audit append lane | `H("audit", chain_id, epoch)` |
| fee accumulator lane | `H("fee", token)` |

Each transaction declares lane hints:

```cpp
struct StmLaneHint {
    Hash lane_id;
    uint8_t access_kind;   // Read, Write, Append, Reduce, Unknown
    uint8_t confidence;    // predictor confidence 0..255
};
```

Lanes are used for:
- **frontier partitioning** (Prism refraction)
- **fast validation** (lane-clock check)
- **hot-key detection** (hotness counter per lane)
- **semantic reduction** (per-lane reducer registration)
- **repair priority** (hot-lane repairs preempt cold ones)
- **multi-GPU sharding** (`gpu_id = H(lane_id) % num_gpus`)

**Without lanes, Block-STM discovers contention too late.** With lanes,
Block-STM becomes a *safety net* and Prism becomes the primary
scheduler.

## Ordered MVCC Layout

### Key header

```cpp
struct StmKeyHeader {
    Hash     key;
    uint32_t head_version;             // newest speculative or committed
    uint32_t latest_committed_version;
    uint32_t lane_id;
    uint32_t hotness_score;
    uint64_t read_ts;                  // TicToc max reader timestamp
    uint64_t write_ts;                 // latest writer timestamp
    uint32_t flags;
};
```

### Version record

```cpp
struct StmVersion {
    Hash     key;
    uint32_t tx_index;     // Nova linear or Nebula topo index
    uint16_t incarnation;
    uint16_t flags;
    uint64_t read_ts;
    uint64_t write_ts;
    uint32_t value_offset;
    uint32_t value_len;
    uint32_t prev_version;
    uint32_t next_version;
};
```

**Canonical version order**: `(key, tx_index, incarnation)`. Two GPU
threads writing speculative versions for the same key MUST produce a
deterministically sorted visible chain. No race-dependent visibility.

## Transaction State Machine

```cpp
enum class StmTxnState : uint8_t {
    New,
    Predicted,
    Refracted,
    Executing,
    SuspendedState,        // waiting on cold-state page
    Executed,
    LaneValidated,         // tier 1 OK
    KeyValidated,          // tier 2 OK
    SemanticallyValidated, // tier 3 OK
    RepairPending,
    Repairing,
    Committable,
    Committed,
    Aborted,
    Faulted,
};
```

Per-tx record:

```cpp
struct StmTxn {
    uint32_t  tx_id;
    uint32_t  tx_index;          // canonical position
    uint32_t  incarnation;
    uint32_t  lane_hint_offset;
    uint16_t  lane_hint_count;
    uint32_t  read_set_offset;
    uint32_t  read_set_count;
    uint32_t  write_set_offset;
    uint32_t  write_set_count;
    uint32_t  checkpoint_offset;
    uint16_t  checkpoint_count;
    uint16_t  conflict_score;
    uint16_t  hotness_score;
    StmTxnState state;
};
```

## Visibility Rule

**Nova (linear)**:

```
visible_version(tx_i, key) =
    newest valid version written by tx_j where j < i
```

**Nebula (DAG)**:

```
visible_version(v_i, key) =
    newest valid version written by a causally visible predecessor,
    using deterministic tie-breaks within the Prism cut
```

The STM engine takes a mode-specific ordering oracle:

```cpp
struct StmOrderOracle {
    QuasarMode mode;
    bool happens_before(VertexId a, VertexId b);   // Nebula
    bool ordered_before(TxId a, TxId b);            // Nova
    uint32_t canonical_index(TxId tx);
};
```

## Three-Tier Validation

### Tier 1 — Lane-Clock Fast Validation

Each lane has a clock:

```cpp
struct StmLaneClock {
    uint64_t version;
    uint64_t hotness;
    uint64_t conflict_count;
};
```

At execution start, the transaction snapshots touched lane clocks:

```cpp
struct LaneSnapshot {
    uint32_t lane_id;
    uint64_t observed_clock;
};
```

Fast validation:

```
if all touched lane clocks unchanged:
    transaction is lane-valid → Committable
else:
    fall back to Tier 2
```

This is the TL2 validation idea adapted to per-lane clocks instead of a
global version clock.

### Tier 2 — Key-Level MVCC Validation

For every read entry:

```cpp
struct StmRead {
    uint32_t tx_id;
    Hash     key;
    uint32_t version_id;
    uint64_t observed_write_ts;
    uint64_t observed_lane_clock;
};
```

Check: the read's `version_id` is still the visible version under the
canonical order. If not, it's a conflict and the transaction goes to
Tier 3 for semantic check or directly to Repair.

### Tier 3 — Semantic Validation (Commutative Reducers)

Many writes commute deterministically. Validate them semantically:

```cpp
enum class StmWriteOp : uint8_t {
    Set,
    Add,
    Sub,
    Min,
    Max,
    Append,
    BitOr,
    BalanceDelta,
    OrderAppend,
    FeeAccumulate,
};
```

| Op pair | Commutes? |
|---|---|
| `Append + Append` | Yes (deterministic ordering by `tx_index`) |
| `Add + Add` | Yes (reduce sum) |
| `FeeAccumulate` | Yes (reduce sum) |
| `BalanceDelta + BalanceDelta` | Yes if no overdraft and canonical netting passes |
| `OrderAppend` | Yes inside a batch-auction lane |
| `Set + anything` | No |

Semantic validation is the difference between "fast blockchain" and
"fast regulated DEX". It is mandatory for the order book / fee /
balance lanes that dominate exchange workloads.

## TicToc-Style Timestamps (Without Breaking Determinism)

Per key:
- `read_ts` = max timestamp of all readers
- `write_ts` = timestamp of latest writer

Per transaction:
- `tx.read_ts_min = max(write_ts of versions read)`
- `tx.write_ts = max(read_ts of keys written) + 1`

A transaction can validate if **there exists** a timestamp compatible
with all read versions, all write targets, and the canonical Nova/Nebula
ordering constraint. This admits more commits than strict "anything
changed means abort" while preserving deterministic output.

**Hard rule**: TicToc timestamps cannot reorder consensus. They only
prove that an observed version is still serializable under the
canonical order.

## Prism Refraction

For Nebula, the frontier is a ready antichain — but *ready ≠
conflict-free*. Refraction partitions the frontier so STM rarely sees
the same hot conflict twice:

```
1. Take ready frontier.
2. Hash lane hints.
3. Build lane conflict matrix.
4. Partition into slices:
     - disjoint write lanes together
     - read-only lanes together
     - hot write lanes isolated (one slice per hot lane)
5. Submit slices to EVM fibers.
```

Refraction is the most important performance feature. Block-STM should
*not* constantly repair the same hot conflicts. Prism refracts them
first.

## Incremental Repair (Fiber Checkpoints)

Full transaction re-execution is too expensive for complex EVM flows
(routers, multi-hop swaps, compliance precompiles).

Add checkpoints at:
- `CALL` boundaries
- `SLOAD` / `SSTORE` boundaries
- precompile boundaries
- basic-block budget boundaries
- DEX semantic-operation boundaries
- cold-state resume boundaries

```cpp
struct EvmFiberCheckpoint {
    uint32_t tx_id;
    uint32_t pc;
    uint32_t frame_offset;
    uint32_t stack_offset;
    uint32_t memory_offset;
    uint32_t journal_offset;
    uint32_t read_set_count;
    uint64_t gas_used;
};
```

Repair policy:

```
if invalid read occurred after checkpoint K:
    rollback to K
    keep decoded bytecode, calldata, warm state, earlier valid reads
    resume fiber with new visible version
else:
    full re-exec
```

Telemetry:
- `checkpoint_rollback_count`
- `full_reexec_count`
- `rollback_saved_gas`
- `rollback_saved_wave_ticks`

For routers, DEX settlement, and compliance precompiles, incremental
repair routinely cuts repair cost by 5–30×.

## Deterministic Contention Manager

GPU-STM literature flags scalability and SIMT livelock as the two
hardest issues. QuasarSTM's contention manager is **always
deterministic**:

```cpp
enum class StmConflictPolicy : uint8_t {
    EarlierWins,
    HotLaneSerialize,
    RefractionSplit,
    IncarnationBackoff,
    SemanticReducer,
    ColdQueueDemotion,
};
```

Policy order:
1. Earlier canonical tx wins.
2. Later tx repairs.
3. If same lane conflicts repeatedly → lane becomes hot.
4. Hot lane is serialized or replaced by semantic reducer.
5. If frontier conflict rate is high → split future Prism cuts.
6. If incarnation count exceeds threshold → demote to cold repair queue.

**No nondeterministic victim selection. No spinlocks. No retry-until-
success loops.**

## Hot-Lane Handling

Detect hot lanes:

```
hotness = reads + 4·writes + 8·conflicts + 16·repairs
```

When hotness exceeds threshold:

```cpp
enum class HotLaneMode : uint8_t {
    Serialize,    // process strictly in canonical order
    Reduce,       // collapse via semantic reducer
    Precompile,   // route to a custom precompile
    Defer,        // demote to next round if non-critical
};
```

| Hot lane | Mode |
|---|---|
| ERC-20 `totalSupply` | Reduce or Serialize |
| AMM reserves | Precompile / batch auction |
| order book price level | Append + deterministic match |
| fee counter | Add reducer |
| sender nonce | Serialize per sender |
| compliance identity | Serialize or snapshot |

Hot lanes are not bugs; they are where app-specific economics live.
3.0 makes them explicit primitives.

## Commit Horizon

Don't commit transaction-by-transaction if a whole prefix/cut is stable:

```cpp
struct StmCommitHorizon {
    uint32_t start_index;
    uint32_t end_index;
    Hash     horizon_root;
    uint32_t tx_count;
};
```

A commit horizon is valid when:
- all transactions in prefix/cut are valid
- no unresolved earlier dependency exists
- no suspended state request blocks visibility
- all hot-lane reducers finalized

| Mode | Horizon shape |
|---|---|
| Nova | contiguous valid prefix of linear order |
| Nebula | valid causal cut (Horizon + Flare) |

Root construction consumes horizon material in batches, slashing
per-tx cert overhead.

## MVCC Garbage Collection

Speculative versions destroy memory if not aggressively reclaimed.
Epoch/horizon GC:

```
safe_gc_point = min(
    lowest active tx index,
    lowest repair dependency,
    current commit horizon,
    lowest live checkpoint reference)
```

GC reclaims:
- invalid incarnations older than `safe_gc_point`
- superseded speculative versions
- checkpoint memory not referenced by any active repair
- read records for committed transactions

A dedicated `ServiceId::StmGC` workgroup runs the reclaimer concurrently
with execution.

Telemetry:
- `versions_allocated`
- `versions_reclaimed`
- `checkpoint_bytes_live`
- `mvcc_arena_pressure`

## Multi-GPU Sharding

QuasarSTM is designed multi-GPU-ready from the data model.

Shard by lane:

```
gpu_id = H(lane_id) % num_gpus
```

Cross-lane transactions:
- **local** if all touched lanes map to one GPU
- **distributed** if lanes span GPUs

Distributed-tx protocol:
1. execute local read/write fragments
2. produce per-GPU fragment roots
3. validate lane clocks on owning GPUs
4. aggregate validation result
5. commit only if all fragments valid

(v0.49 implements this; the data structures already support it.)

## Service Layout

QuasarSTM splits monolithic Validate/Repair into purpose-built services:

```cpp
enum class ServiceId : uint16_t {
    StmPredict          = 0x0410,
    StmRefract          = 0x0411,
    EvmFiberExec        = 0x0420,
    StmLaneValidate     = 0x0430,
    StmKeyValidate      = 0x0431,
    StmSemanticValidate = 0x0432,
    StmRepairSelect     = 0x0440,
    StmRepairExec       = 0x0441,
    StmCommitHorizon    = 0x0450,
    StmGC               = 0x0451,
};
```

Each stage has different GPU behavior — separating them lets the
QuasarGPU wave-tick scheduler (LP-132) tune per-stage budget and lane
priority independently.

## Telemetry

```cpp
struct QuasarStmTelemetry {
    uint32_t tx_count;
    uint32_t committed_count;
    uint32_t conflict_count;
    uint32_t repair_count;
    uint32_t full_reexec_count;
    uint32_t checkpoint_rollback_count;
    uint32_t lane_fast_valid_count;       // tier 1 hits
    uint32_t key_valid_count;              // tier 2 hits
    uint32_t semantic_valid_count;         // tier 3 hits
    uint32_t hot_lane_count;
    uint32_t hot_lane_serialized_count;
    uint32_t semantic_reduce_count;
    uint32_t max_incarnation;
    uint32_t p99_incarnation;
    uint32_t fibers_suspended;
    uint32_t fibers_resumed;
    uint32_t mvcc_versions_allocated;
    uint32_t mvcc_versions_reclaimed;
    uint32_t commit_horizon_count;
};
```

The single most important metric:

```
repair_amplification = repair_count / committed_count
```

Targets:
- normal DEX workload: `< 1.01`
- heavy contention: controlled degradation, not repair explosion

If `repair_amplification > 1.05` for sustained periods, the design
intent is being violated and Prism refraction needs tuning.

## Correctness Invariants (test-enforced)

1. **Deterministic output** — same input + same parent state + same
   mode → same roots.
2. **Serializability** — committed result equals canonical Nova order
   or deterministic Nebula causal order.
3. **No host authority** — host cannot choose validate / repair /
   commit order. Host is doorbell + I/O only.
4. **MVCC visibility** — every read observes the correct visible
   version for its position in the canonical order.
5. **Repair monotonicity** — each repair increments incarnation;
   invalid incarnations cannot commit.
6. **Horizon safety** — no transaction beyond unresolved dependencies
   may enter a commit horizon.
7. **Cross-backend equivalence** — Metal == CUDA == CPU reference for
   `state_root`, `receipts_root`, `execution_root`, `mode_root`, and
   conflict/repair behavior wherever deterministic.

## Benchmark Ladder (LP-010 conformance suite)

| Bench | Workload | Target |
|---|---|---|
| A. Zero conflict | 1M / 10M / 100M disjoint lane transfers | lane-fast validation > 95% |
| B. Zipfian contention | Zipf-sampled keys | hot-lane detection + bounded repair amplification |
| C. AMM hotspot | many swaps against same pool | generic STM degrades; semantic / precompile path survives |
| D. Order-book append | many appends to same market | append reducer + deterministic batch matching |
| E. Router workload | long EVM fibers with late SLOAD conflict | checkpoint rollback beats full re-exec |
| F. Cold-state suspension | forced page misses | suspended fibers do not stall the wave scheduler |
| G. Nebula frontier | DAG antichains of varying conflict density | Prism refraction reduces `repair_count` |

## Forbidden Patterns

QuasarSTM **must not** use:

- one global STM clock
- one global version map lock
- retry-until-success GPU loops
- nondeterministic conflict victim choice
- opcode-level STM (it's tx-level)
- CPU conflict manager
- host-side repair scheduler
- per-version `malloc` (use the arena)
- global hot-key spinlocks

These either break determinism or kill GPU throughput.

## Implementation Plan (3.0 final, shipped for 2025-12-25 launch)

| Version | Theme | Concrete deliverables |
|---|---|---|
| **v0.42** | Layout types | `quasar_stm_layout.hpp`: `StmTxn`, `StmKeyHeader`, `StmVersion`, `StmLane`, `StmLaneClock`, `StmLaneHint`, `StmFrontier`, `StmConflict`, `StmRepair`, `StmCommitHorizon`, `StmTelemetry` |
| **v0.43** | Lane-clock fast validation | per-lane `StmLaneClock` snapshots, Tier-1 validate kernel, hotness counter, `StmLaneValidate` service |
| **v0.44** | Ordered MVCC chains | `StmKeyHeader` head + per-key version chains, Nova/Nebula visibility rules, `StmOrderOracle`, key-level Tier-2 validate |
| **v0.45** | Prism refraction | lane conflict matrix, frontier partitioning into disjoint/read-only/hot slices, hot-lane isolation |
| **v0.46** | Incremental repair | `EvmFiberCheckpoint` at CALL/SLOAD/SSTORE/precompile/cold-state boundaries, checkpoint rollback path, repair telemetry |
| **v0.47** | Semantic reducers | `StmWriteOp` enum (Set/Add/Sub/Min/Max/Append/BitOr/BalanceDelta/OrderAppend/FeeAccumulate), Tier-3 commutativity validate, deterministic reduce-at-commit |
| **v0.48** | Commit horizon + GC | `StmCommitHorizon` (Nova prefix / Nebula causal cut), epoch/horizon GC reclaimer, `StmCommitHorizon` + `StmGC` services |
| **v0.49** | Multi-GPU sharding stub | lane-keyed `gpu_id = H(lane_id) % num_gpus`, distributed-tx fragment protocol scaffolding (single-GPU path remains production default) |

All v0.42–v0.49 milestones are **3.0 final** and shipped through
December 2025, ahead of the 2025-12-25 production launch.

> Future evolution beyond 3.0 — ConflictSpec ABI, NEMO LaneClass,
> Aria-style commit selection, RapidLane deferred ops, ForeSight
> predictor, Chiron execution hints, Multiverse dynamic versioning,
> CSMV commit server, Motor VersionBlock, vMVCC formal spec — is a
> separate research track. See **LP-135 (QuasarSTM 4.0 Research)**.

## Design Statement

> **QuasarSTM** is a GPU-native ordered MVCC fabric for EVM execution.
> Prism exposes causal frontiers, lanes predict state independence, EVM
> fibers execute speculatively, lane clocks validate the fast path,
> ordered MVCC validates exact visibility, semantic reducers preserve
> commutative throughput, deterministic contention management prevents
> repair storms, checkpoints make repair incremental, and commit
> horizons feed Quasar-certified roots.

> One sentence: **QuasarSTM turns Block-STM from a repair loop into a
> GPU-native serializability fabric.**

## Implementations

| Implementation | Language | GPU Support | STM Version |
|---|---|---|---|
| evmgpu (Lux) | Go | via CGo bridge | 1.0 reference |
| cevm (Lux, this module) | C++ | native Metal + CUDA | 3.0 (this LP) |

The Go reference (`evmgpu`) tracks the 1.0 contract for cross-checking
determinism. The 3.0 fabric ships in `cevm/lib/consensus/quasar/gpu/stm/`.

## References

- Block-STM (Aptos): Gelashvili et al., 2022
- TicToc: Yu, Pavlo, Sanchez, Devadas, SIGMOD 2016
- TL2: Dice, Shalev, Shavit, DISC 2006
- GPU-STM scalability: Cederman, Gidenstam, Tsigas; Holey, Zhai
- LP-009: GPU-Native EVM
- LP-020: Quasar Consensus
- LP-132: QuasarGPU Execution Adapter (this LP requires)
- LP-135: QuasarSTM 4.0 Research (post-3.0 evolution: ConflictSpec,
  NEMO Lanes, deferred ops, predictive scheduling, CSMV commit server,
  disaggregated MVCC)

## Changelog

- **2025-03-01** — initial Block-STM 2.0 LP
- **2025-11-30** — minor edits, GPU notes
- **2025-12-15** — **complete rewrite to Block-STM 3.0 / QuasarSTM** —
  final 3.0 spec for the 2025-12-25 production launch (lane-aware
  ordered MVCC, three-tier validation, semantic reducers, deterministic
  contention manager, commit horizons, multi-GPU sharding stub).
  Adaptive 3.1 / 3.2 / 4.0 evolution split out into LP-135 research.
