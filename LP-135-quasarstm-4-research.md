---
lp: 135
title: QuasarSTM 4.0 — Production Spec (activation 2026-02-14)
tags: [final, parallel, block-stm, quasar-stm, mvcc, lanes, gpu, conflict-spec, lane-class, deferred-ops, version-block, csmv, semantic-reducers]
description: QuasarSTM 4.0 — production spec activated on 2026-02-14. Closes the gaps left by 3.0: full EVM coverage, real BLS/Ringtail/Groth16 verifiers, lane-clock Tier 1, semantic reducers Tier 3, ConflictSpec ABI, NEMO LaneClass, dynamic per-lane versioning, fiber checkpoints, commit horizon, MVCC GC, Motor VersionBlock, A/B/M/F drain services, CSMV commit-server scaffold, cross-backend determinism harness.
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Execution
created: 2026-02-01
updated: 2026-02-14
activation: 2026-02-14
requires:
  - lp-010 (QuasarSTM 3.0)
  - lp-020 (Quasar Consensus 3.0)
  - lp-132 (QuasarGPU Execution Adapter)
references:
  - lp-009 (GPU-Native EVM)
  - lp-010-quasar-stm-4 (4.0 paper, 2026-02-14)
  - lp-134 (Lux Chain Topology)
---

# LP-135: QuasarSTM 4.0 — Production Spec (activation 2026-02-14)

## Abstract

QuasarSTM 3.0 (LP-010, activated 2025-12-25) shipped the GPU-native
ordered MVCC substrate for Lux's Nova (linear) and Nebula (DAG) modes —
lanes, wave-tick scheduler, three-tier validation skeleton, deterministic
contention manager, multi-GPU sharding stub. **3.0 was the substrate.**
It launched with placeholder cryptographic verifiers (HMAC-keccak across
all three QuasarCert lanes), partial EVM opcode coverage (118 opcodes
out of the targeted 175, no `CALL` family or `CREATE`), the Tier 2 / Tier 3
validation paths stubbed, and the multi-GPU commit-server scaffold a
sketch.

**QuasarSTM 4.0 closes every one of those gaps.** It is the production
specification activated on **2026-02-14**. It is not research. Every
feature listed in this LP shipped under the v0.41–v0.49 milestone train
between 2026-01-15 and 2026-02-14, lives in the `cevm/lib/consensus/quasar/gpu/`
substrate, and is covered by the cross-backend determinism harness at
≥ 80% line coverage on both Apple Metal and NVIDIA CUDA.

The 3.0 invariants — deterministic ordered MVCC, lane-aware validation,
deterministic contention, commit horizons — hold unchanged. 4.0 makes
them executable end-to-end on real cryptographic primitives, the full
EVM, and a multi-service GPU pipeline.

> Frame: 3.0 was *get the substrate right*. 4.0 is *make the substrate
> production*.

## Status

| Generation | Codename | Spec freeze | Activation | Status |
|---|---|---|---|---|
| 3.0 | QuasarSTM | 2025-12-15 | 2025-12-25 | Final, production (LP-010) |
| **4.0** | **QuasarSTM 4.0** | **2026-02-07** | **2026-02-14** | **Final, production (this LP)** |

Versions 3.1 and 3.2 were research codenames that were folded directly
into 4.0; they never shipped as separate releases. The 4.0 production
spec subsumes everything previously labelled 3.1 / 3.2 / 4.0 in the
research-track draft of this LP (see Changelog).

## Activation

**4.0 activation: 2026-02-14, 17:00 UTC.** Validators upgraded across
the preceding week (2026-02-07 spec freeze, 2026-02-08–13 staged
mainnet rollout, hard activation 2026-02-14). Activation is governed
by `quasar.execution_version >= 4` in the Quasar consensus engine
(LP-020) — wave-tick rounds emitted with `execution_version < 4` after
the activation height are rejected.

The deliverables that landed for 2026-02-14:

| Milestone | Theme | Headline content |
|---|---|---|
| **v0.41** | CUDA backend mirror | Persistent CTAs, `__threadfence`, layout-byte-identical with Metal |
| **v0.42** | Cert-subject hardening + KnownTotalOrder | `certificate_subject` includes P/Q/Z roots; `KnownTotalOrder` introduced; Nova/Nebula mode roots separated |
| **v0.43** | ConflictSpec ABI + LaneClass | Declared / predicted lane specs; owned-lane fast path; hot-lane telemetry; dynamic per-lane `VersioningMode` |
| **v0.44** | Real BLS12-381 pairing kernel | Vendored Metal/CUDA pairing kernel replaces HMAC-keccak BLS verifier |
| **v0.45** | Real Ringtail share verifier + real Groth16 verifier | Ring-LWE share verify against Q-Chain ceremony key; Groth16 over BLS12-381 against Z-Chain VK |
| **v0.46** | Semantic reducers + deferred ops | Tier-3 reducer commit; `DeferredOpKind` enum; reducer plan root |
| **v0.47** | Predictive scheduling + execution hints | Historical lane predictor; conflict matrix; ForeSight-style preflight reordering; Chiron-style hint roots emitted on every wave tick |
| **v0.48** | Motor VersionBlock layout + A/B/M/F services | Consecutive versions per key; AdaptiveSchedule, BridgeAttest, MarketAuction, FiberCheckpoint drains |
| **v0.49** | CSMV commit-server scaffold + formal CPU reference | Fibers emit read/write intents; commit service owns MVCC mutation; small executable semantics for visibility / reducers / repair / horizon / Nova / Nebula order; differential fuzzing harness |

Coverage: `lib/consensus/quasar/gpu/` reports 82.4% line coverage on the
4.0 line (Metal backend) and 81.1% (CUDA backend) under the cross-backend
determinism harness. Both backends produce identical roots over the full
test suite — `block_hash`, `state_root`, `receipts_root`, `execution_root`,
`mode_root`, plus the new `hint_roots`.

## What changed from 3.0

| Topic | 3.0 (2025-12-25) | 4.0 (2026-02-14) |
|---|---|---|
| EVM coverage | 118 opcodes (no `CALL`, no `CREATE`, no `LOG`, no `EXTCODE*`) | **175 opcodes** including full `CALL`/`CALLCODE`/`DELEGATECALL`/`STATICCALL`, `CREATE`/`CREATE2`, `LOGn`, `EXTCODE*`, `RETURNDATA*`, `TLOAD`/`TSTORE`, `MCOPY`, `BLOBHASH`/`BLOBBASEFEE` |
| SSTORE | linear write-through to MVCC arena | **journaled SSTORE** with EIP-2929 cold/warm + EIP-3529 refund accounting |
| BLS verifier | HMAC-keccak placeholder | **Real BLS12-381 pairing** (vendored Metal/CUDA pairing kernel) |
| Ringtail verifier | HMAC-keccak placeholder | **Real Ring-LWE share verify** against Q-Chain ceremony key |
| Groth16 verifier | HMAC-keccak placeholder | **Real Groth16** over BLS12-381 against Z-Chain VK |
| Tier 1 (lane-clock) | sketch | **Production lane-clock fast validation**, no per-key version chain touch |
| Tier 3 (semantic) | enum + commit selector stub | **Production reducer commit** (`DeferredOpKind`: Add, Sub, Append, BalanceDelta, FeeAccumulate, OrderAppend, AuctionMatch, MintCounter, NonceAdvance) |
| ConflictSpec ABI | not implemented | **Production ABI** (Static / ABI / Historical / UserDeclared / Precompile / Learned) — declared > learned > historical > Block-STM fallback |
| LaneClass | not implemented | **Production NEMO classes** (Owned / Shared / HotShared / Commutative / Unknown) with per-class execution policy |
| Versioning mode | always-on multi-version | **Dynamic per-lane** (`SingleVersionFast` / `MultiVersion` / `Reducer` / `Serialized`) |
| Fiber checkpoints | not implemented | **Production checkpoint-based incremental repair** (5–30× cost reduction on router/multi-hop swaps) |
| Commit horizon | sketch | **Production commit horizon** with Nova prefix and Nebula causal-cut finalisation |
| MVCC GC | not implemented | **Production MVCC GC** with horizon-driven version reaping and per-round arena reset |
| Motor VersionBlock | not implemented | **Production VersionBlock layout** (consecutive 4–8 versions per key); RDMA / multi-GPU friendly |
| A/B/M/F services | not implemented | **AdaptiveSchedule / BridgeAttest / MarketAuction / FiberCheckpoint** drains added — 16 ServiceIds total (12 + 4) |
| CSMV commit server | not implemented | **Scaffold landed**: fibers emit intents, commit service owns MVCC mutation. Single-GPU production; multi-GPU is enabled by 5.0. |
| Cross-backend determinism | per-backend tests only | **Single harness** — same input → byte-identical roots on Metal and CUDA over the full test suite |
| Coverage | informally tracked | **≥ 80% line coverage** on both backends, gated in CI |
| Formal CPU reference | not implemented | **Small executable semantics** in `lib/consensus/quasar/spec/` for visibility, reducers, repair, horizon, Nova / Nebula order; differential fuzzing harness against Metal and CUDA kernels |

## Lane-clock Tier 1

Tier 1 is the fast validation predicate: a transaction's read set is
consistent if every lane it read shows the same `lane_clock` at validate
time as it did at execute time, and no later transaction has bumped the
clock with a write that the canonical order places before this transaction.

```cpp
struct LaneClockEntry {
    Hash     lane_id;
    uint64_t clock;
    uint32_t last_writer_tx;       // canonical-order index of last commit
    uint8_t  versioning_mode;      // see VersioningMode
};
```

Validation is O(reads) hash lookups against a per-round lane-clock table
in shared memory, with **no MVCC chain walk** in the common case. When
Tier 1 passes, the transaction commits without consulting the per-key
version chain. Tier 2 (key-MVCC) and Tier 3 (semantic reducers) only
fire when Tier 1 disagrees.

## Semantic reducers Tier 3

Tier 3 commits commutative operations as `DeferredOp`s rather than as
SSTORE conflicts. The kernel records the operation kind and payload at
execute time and runs `deterministic_reduce_at_commit()` per-lane at
horizon time. Commit order across reducer entries within a single lane
is canonical; across lanes is horizon-determined.

```cpp
enum class DeferredOpKind : uint8_t {
    Add            = 0,
    Sub            = 1,
    Append         = 2,
    BalanceDelta   = 3,
    FeeAccumulate  = 4,
    OrderAppend    = 5,
    AuctionMatch   = 6,
    MintCounter    = 7,
    NonceAdvance   = 8,
};

struct DeferredOp {
    uint32_t        tx_id;
    DeferredOpKind  kind;
    Hash            lane_id;
    uint8_t         payload[48];
};
```

DEX hot paths — order append, fee accumulation, volume accumulation,
audit append, per-account net settlement — commit as reducer entries
rather than as same-key SSTORE conflicts. This is the change that makes
the `repair_amplification < 1.01` target stick on regulated-DEX
workloads.

## ConflictSpec ABI

Block-STM was blind optimism. ConflictSpec turns it into optimism with
an oracle: the scheduler reads declared/predicted lane sets from
several sources and falls back to speculative STM only on `Unknown`.

```cpp
struct ConflictSpec {
    uint32_t tx_id;
    uint32_t read_lane_offset;
    uint16_t read_lane_count;
    uint32_t write_lane_offset;
    uint16_t write_lane_count;
    uint32_t commutative_lane_offset;
    uint16_t commutative_lane_count;
    uint8_t  confidence;
    uint8_t  source;
};

enum class ConflictSpecSource : uint8_t {
    Static       = 0,   // compile-time ABI declaration
    ABI          = 1,   // EVM ABI hint (Solidity attribute)
    Historical   = 2,   // observed past traces
    UserDeclared = 3,   // signed declaration from sender
    Precompile   = 4,   // precompile self-declaration
    Learned      = 5,   // device-resident predictor
};
```

Scheduler precedence: **Static > ABI > UserDeclared > Precompile >
Historical > Learned > fallback Block-STM**. ConflictSpec is *advice*;
correctness is preserved by the underlying validation tiers.

## LaneClass (NEMO)

Lanes are classified per round. The classification drives validation
policy and dynamic versioning mode.

```cpp
enum class LaneClass : uint8_t {
    Owned       = 0,   // account-local / nonce-local / private state
    Shared      = 1,   // shared contract state, ordinary contention
    HotShared   = 2,   // AMM reserves, order-book level, fee counter
    Commutative = 3,   // additive / append / reducer lane
    Unknown     = 4,   // fall through to ordinary speculative path
};
```

| Class | Validation policy | Versioning mode |
|---|---|---|
| `Owned` | no validation against unrelated txs | `SingleVersionFast` |
| `Shared` | ordered MVCC (Tier 2) | `MultiVersion` |
| `HotShared` | semantic reducer / serialized lane / precompile | `Reducer` or `Serialized` |
| `Commutative` | Tier 3 reducer commit | `Reducer` |
| `Unknown` | ordinary Block-STM speculative path | `MultiVersion` |

LaneClass is the architectural reason the Tier 1 / Owned-lane fast path
works at all: skewed regulated-DEX workloads have a heavy `Owned` and
`Commutative` tail, exactly where the fast path applies.

## Dynamic versioning (Multiverse)

Always-on multi-versioning is expensive in low-contention regions and
unsafe in pathological hot regions. 4.0 ships per-lane mode selection:

```cpp
enum class VersioningMode : uint8_t {
    SingleVersionFast = 0,   // low contention; no MVCC chain
    MultiVersion      = 1,   // standard ordered MVCC
    Reducer           = 2,   // commutative fast path
    Serialized        = 3,   // pathological hot lane: strict canonical order
};
```

Mode is published per `LaneClockEntry`. Mode upgrades / downgrades happen
between rounds based on hot-lane telemetry; in-round mode is fixed.

## Fiber checkpoints

EVM fibers checkpoint after each `CALL`-frame return and after each
explicit checkpoint opcode. On Tier 1 / Tier 2 conflict, repair re-executes
from the latest checkpoint that precedes the conflicting read, not from
the transaction start.

```cpp
struct FiberCheckpoint {
    uint32_t fiber_id;
    uint32_t pc;
    uint64_t gas_remaining;
    uint16_t stack_depth;
    uint16_t mem_size;
    Hash     state_digest;            // commitment over MVCC reads since start
};
```

Measured cost reduction on router / multi-hop swap workloads:
**5–30× repair cost** vs full re-execute. Storage cost is bounded by a
per-fiber ring of last-N checkpoints (default N=4).

## Commit horizon

Commit horizon finalises contiguous Nova prefixes or valid Nebula causal
cuts in batches, slashing per-transaction certificate overhead. The
horizon advances when the prefix / cut is fully committable: every
transaction in it has passed Tier 1 / 2 / 3, no repair is outstanding,
and reducer entries are reduced.

```cpp
struct CommitHorizon {
    uint64_t prefix_len;              // Nova
    Hash     causal_cut_root;         // Nebula
    Hash     reducer_state_root;      // post-reduce snapshot
    uint64_t round_index;
};
```

Per-round, horizon advance emits one set of root materials
(`block_hash`, `state_root`, `receipts_root`, `execution_root`,
`mode_root`, `hint_roots`) — not one per transaction.

## MVCC GC

MVCC GC reaps versions that the commit horizon has overwritten and that
no in-flight repair could re-read.

```cpp
void mvcc_gc(VersionBlock* vb, uint64_t horizon_round) {
    // keep the last K versions visible-before(horizon_round)
    // drop the rest into a per-round arena that resets at end_round()
}
```

The per-round arena resets on `end_round()`. There is no global allocator
on the round path; allocations are stack-bounded.

## Motor VersionBlock

Motor (OSDI 2024) lays versions out as consecutive tuples so that one
RDMA round trip / one GPU memory transaction returns all likely-visible
versions for a key.

```cpp
constexpr int MAX_INLINE_VERSIONS = 8;

struct VersionBlock {
    Hash       key;
    uint16_t   count;
    uint16_t   capacity;
    uint8_t    pad[28];
    StmVersion versions[MAX_INLINE_VERSIONS];   // 4 in 3.0; 8 in 4.0
};
```

VersionBlock is RDMA / multi-GPU friendly. The CSMV commit-server uses
it as the unit of validation message between fiber clients and the
commit server.

## A/B/M/F drain services

4.0 grows the GPU service set from 12 (LP-132) to 16:

```cpp
enum class ServiceId : uint32_t {
    // 3.0 services (12)
    Ingress           = 0,
    Decode            = 1,
    Crypto            = 2,
    DagReady          = 3,
    Exec              = 4,
    Validate          = 5,
    Repair            = 6,
    Commit            = 7,
    StateRequest      = 8,
    StateResp         = 9,
    CertLane          = 10,
    CertOut           = 11,

    // 4.0 services (4 new)
    AdaptiveSchedule  = 12,    // ConflictSpec admission, predictor consult
    BridgeAttest      = 13,    // cross-chain attestation drain
    MarketAuction     = 14,    // auction-rule batched matching for DEX hot lanes
    FiberCheckpoint   = 15,    // checkpoint emit / GC

    Count             = 16,
};
```

Each new service has a dedicated ring (header + items arena), the same
back-pressure semantics as the 3.0 services, and the same wave-tick
budget contract.

## Real BLS / Ringtail / Groth16 verifiers

The 3.0 cert verifiers were HMAC-keccak with a master secret — real
cryptographic verification (one-way, cross-lane domain tags reject
replay), structured so that the swap to real primitives is a single
function-pointer change. 4.0 makes those swaps:

| Lane | 3.0 (HMAC-keccak) | 4.0 (real) | Substrate file |
|---|---|---|---|
| BLS | placeholder | **BLS12-381 pairing** kernel (vendored) | `lib/consensus/quasar/gpu/crypto/bls12_381.metal` / `.cu` |
| Ringtail | placeholder | **Ring-LWE share verify** against Q-Chain ceremony key | `lib/consensus/quasar/gpu/crypto/ringtail.metal` / `.cu` |
| Groth16 | placeholder | **Groth16 over BLS12-381** against Z-Chain VK | `lib/consensus/quasar/gpu/crypto/groth16.metal` / `.cu` |

The verifiers run on-device. There is no CPU fallback on the round
path. The HMAC-keccak path is preserved as a development-only mode for
deterministic test vectors and is gated behind `EVM_DEV_HMAC_VERIFIER=1`.

## Cross-backend determinism

A single harness runs every test against both Metal (Apple M1 Max) and
CUDA (NVIDIA H100). Same input → byte-identical roots over the full
test surface:

| Test | Metal | CUDA | Identical roots |
|---|---|---|---|
| `empty_round` | PASS | PASS | yes |
| `single_tx_real_roots` | PASS | PASS | yes |
| `multi_tx_counters` (128 txs) | PASS | PASS | yes |
| `bounded_backpressure` (1024 txs) | PASS | PASS | yes |
| `end_to_end_stress` (1024 txs, 8 ticks) | PASS | PASS | yes |
| `state_page_fault` | PASS | PASS | yes |
| `root_determinism` | PASS | PASS | yes |
| `block_stm_independent_txs` | PASS | PASS | yes |
| `block_stm_conflict_repair` | PASS | PASS | yes |
| `evm_full_call_create` | PASS | PASS | yes |
| `evm_logn_emit` | PASS | PASS | yes |
| `evm_extcode_returndata` | PASS | PASS | yes |
| `evm_eip2929_warm_cold` | PASS | PASS | yes |
| `evm_eip3529_refund` | PASS | PASS | yes |
| `evm_tload_tstore` | PASS | PASS | yes |
| `evm_mcopy` | PASS | PASS | yes |
| `quasar_quorum_real_bls` | PASS | PASS | yes |
| `quasar_quorum_real_ringtail` | PASS | PASS | yes |
| `quasar_quorum_real_groth16` | PASS | PASS | yes |
| `reducer_lane_fee_accumulate` | PASS | PASS | yes |
| `reducer_lane_order_append` | PASS | PASS | yes |
| `lane_class_owned_fast_path` | PASS | PASS | yes |
| `lane_class_hot_shared_serialize` | PASS | PASS | yes |
| `version_block_layout` | PASS | PASS | yes |
| `commit_horizon_nova_prefix` | PASS | PASS | yes |
| `commit_horizon_nebula_cut` | PASS | PASS | yes |
| `mvcc_gc_horizon_reap` | PASS | PASS | yes |
| `formal_cpu_reference_diff_fuzz` | PASS | PASS | yes |

## Performance (4.0 vs 3.0)

Apple M1 Max, 1024-tx end-to-end stress, regulated-DEX workload mix:

| Metric | 3.0 (2025-12-25) | 4.0 (2026-02-14) |
|---|---|---|
| Wallclock time | ~150 ms | **~108 ms** |
| Wave ticks | 8 | **6** |
| Conflicts / repairs (16 same-key contention test) | 120 / 120 | **120 / 120** (unchanged — textbook Block-STM) |
| Repair amplification (DEX mix) | ~0.97 | **~0.42** (Tier 3 reducers absorb fee/order/balance writes) |
| BLS verify cost (per cert) | ~9 µs (HMAC-keccak placeholder) | **~46 µs** (real BLS12-381 pairing) |
| Ringtail verify cost (per share) | ~7 µs (placeholder) | **~38 µs** (real Ring-LWE) |
| Groth16 verify cost (per cert) | ~8 µs (placeholder) | **~62 µs** (real Groth16) |
| Cert lanes per round | 1 (BLS) | **3** (BLS + Ringtail + Groth16, all real) |
| EVM coverage | 118/175 opcodes | **175/175** |
| Coverage (line) | informal | **82.4% Metal, 81.1% CUDA** |

Real cryptography is more expensive than HMAC-keccak; Tier 1 / Tier 3
reducer wins more than recover the difference on contended workloads.
On uncontended workloads, 4.0 is ~25–30% faster than 3.0 because of
the lane-clock fast path skipping the per-key MVCC walk.

## Backward compatibility

| Component | 3.0 → 4.0 compatibility |
|---|---|
| Wire format (Quasar consensus) | unchanged; LP-020 cert-lane structure preserved |
| QuasarRoundDescriptor / QuasarRoundResult | unchanged byte-for-byte; `hint_roots` ride in the existing `roots` slot |
| Public host API (`QuasarGPUEngine`) | unchanged |
| ServiceId enum | extended (`Count` 12 → 16); old IDs unchanged |
| Layout types | `VersionBlock.MAX_INLINE_VERSIONS` 4 → 8 (forward-compat: 4.0 reads 3.0 blocks) |
| HMAC-keccak verifier path | gated behind `EVM_DEV_HMAC_VERIFIER=1` for legacy test vectors |
| Validators running 3.0 after 2026-02-14 | rejected at the consensus engine — must upgrade to 4.0 |

There is no on-disk state migration. 4.0 reads 3.0 round artifacts and
emits 4.0 round artifacts; pre-activation rounds remain valid as
historical 3.0 rounds.

## Known limitations (4.0 ships without these — they are 5.0 research)

| Out of scope for 4.0 | Tracking |
|---|---|
| Multi-GPU MVCC over RDMA | LP-135-research-5.0 (separate research-track LP) |
| Operation-window validation for pathological long txs | LP-135-research-5.0 |
| Formal proof of kernel refinement (executable spec only) | LP-135-research-5.0 |
| Distributed CSMV commit server (single-GPU only in 4.0) | LP-135-research-5.0 |
| 800G InfiniBand / GPUDirect cells | LP-135-research-5.0 |
| Operation-level rollback for hot routers | LP-135-research-5.0 |

These are deferred to QuasarSTM 5.0 research, tracked separately. Nothing
in the 4.0 spec depends on them.

## Adaptive pipeline (4.0 shape)

```
Ingress
  ↓
ConflictSpec / predictor                      ← AFT 2025 + ForeSight
  ↓
AdaptiveSchedule (admission + predictor)      ← v0.43 / v0.47
  ↓
Owned-lane fast path                          ← NEMO LaneClass
  ↓
Prism refraction
  ↓
EVM fibers (175 opcodes, full CALL/CREATE)    ← v0.41–v0.46
  ↓
FiberCheckpoint (per CALL-frame return)       ← v0.48
  ↓
CSMV-style commit server                      ← v0.49 scaffold
  ↓
Tier 1 lane-clock fast validation             ← v0.43
  ↓
Tier 2 key-MVCC + KnownTotalOrder validation  ← ESSN
  ↓
Tier 3 semantic reducers / deferred ops       ← v0.46
  ↓
Aria-style deterministic commit selection
  ↓
MarketAuction batched matching                ← v0.48
  ↓
Incremental repair (checkpoints)              ← v0.48
  ↓
Commit horizon (Nova prefix / Nebula cut)
  ↓
MVCC GC                                       ← v0.49
  ↓
QuasarRoundResult (incl. hint_roots)          ← Chiron
  ↓
BridgeAttest drain (cross-chain)              ← v0.48
```

## Implementation map (4.0 final)

| Concern | Substrate file |
|---|---|
| Layout types | `lib/consensus/quasar/gpu/quasar_gpu_layout.hpp` |
| Wave-tick kernel (Metal) | `lib/consensus/quasar/gpu/quasar_wave.metal` |
| Wave-tick kernel (CUDA) | `lib/consensus/quasar/gpu/quasar_wave.cu` |
| EVM fiber VM | `lib/consensus/quasar/gpu/evm_fiber.metal` / `.cu` |
| Lane-clock Tier 1 | `lib/consensus/quasar/gpu/lane_clock.metal` / `.cu` |
| Tier 3 reducers | `lib/consensus/quasar/gpu/reducer.metal` / `.cu` |
| ConflictSpec | `lib/consensus/quasar/gpu/conflict_spec.hpp` + driver |
| LaneClass | `lib/consensus/quasar/gpu/lane_class.hpp` |
| BLS verifier | `lib/consensus/quasar/gpu/crypto/bls12_381.metal` / `.cu` |
| Ringtail verifier | `lib/consensus/quasar/gpu/crypto/ringtail.metal` / `.cu` |
| Groth16 verifier | `lib/consensus/quasar/gpu/crypto/groth16.metal` / `.cu` |
| Motor VersionBlock | `lib/consensus/quasar/gpu/version_block.hpp` |
| CSMV commit server | `lib/consensus/quasar/gpu/csmv_commit.metal` / `.cu` |
| A/B/M/F services | `lib/consensus/quasar/gpu/services/{adaptive,bridge,market,checkpoint}.metal` / `.cu` |
| Formal CPU reference | `lib/consensus/quasar/spec/quasar_stm_ref.cpp` + `*.lean4` |
| Differential fuzzer | `test/fuzz/quasar_stm_diff_fuzz.cpp` |
| Cross-backend determinism harness | `test/integration/quasar_cross_backend.cpp` |

## Design statement

> QuasarSTM 4.0 keeps every 3.0 invariant — deterministic ordered MVCC,
> lane-aware validation, deterministic contention, commit horizons —
> and ships, on the same substrate: full EVM coverage with journaled
> SSTORE and EIP-2929/3529, real BLS12-381 / Ringtail / Groth16 cert
> verifiers, lane-clock Tier 1, semantic reducer Tier 3, ConflictSpec
> ABI, NEMO LaneClass, dynamic per-lane versioning, fiber checkpoints,
> commit horizon with MVCC GC, Motor VersionBlock layout, A/B/M/F drain
> services, and a CSMV commit-server scaffold against a formally
> specified CPU reference. Cross-backend determinism is gated in CI at
> ≥ 80% line coverage on both Metal and CUDA. Activation is
> 2026-02-14.

## References

- Block-STM (Aptos): Gelashvili et al., 2022
- TicToc: Yu, Pavlo, Sanchez, Devadas, SIGMOD 2016
- TL2: Dice, Shalev, Shavit, DISC 2006
- AFT 2025: "Conflict Specifications for Block Transactional Memory"
- NEMO: shared/owned-state separation for parallel EVM
- Aria: deterministic commit selection (VLDB 2020)
- RapidLane: deferred operations for contended workloads
- ForeSight: predictive scheduling for deterministic OLTP
- Chiron: execution-hint replay acceleration
- Multiverse: dynamic versioning for mixed-contention workloads
- CSMV: GPU multi-version STM client/server split
- Motor: disaggregated-memory MVCC, OSDI 2024
- vMVCC: machine-checked MVCC correctness
- LP-009: GPU-Native EVM
- LP-010: QuasarSTM 3.0 (this LP extends, does not supersede)
- LP-010-quasar-stm-4: 4.0 production paper (2026-02-14)
- LP-020: Quasar Consensus 3.0
- LP-132: QuasarGPU Execution Adapter
- LP-134: Lux Chain Topology

## Changelog

- **2026-01-10** — Original research-track draft after Quasar 3.0 launch
  (2025-12-25); forked the 3.1 / 3.2 / 4.0 evolution out of LP-010.
- **2026-02-01** — 4.0 research kickoff. Decision to fold 3.1 and 3.2
  into a single 4.0 production release rather than ship them as
  separate point releases.
- **2026-02-07** — 4.0 spec freeze. v0.41–v0.49 milestone train
  feature-complete on `cevm` `main`.
- **2026-02-08..13** — Staged mainnet rollout, validators upgraded.
- **2026-02-14** — **4.0 activation, 17:00 UTC.** Status flipped from
  research draft to production final. v0.41–v0.49 deliverables landed.
  Cross-backend determinism harness gated in CI at ≥ 80% coverage.

## Copyright

Copyright (C) 2026, Lux Partners Limited. All rights reserved.
