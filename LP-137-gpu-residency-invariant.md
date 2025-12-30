---
lp: 137
title: GPU-Residency Invariant — Full GPU-Native QuasarGPU Stack
tags: [gpu, residency, optimization, hot-path, precompile, dex, compliance, rdma, gpudirect, quasar-gpu, ai-chain, confidential-compute]
description: The "no chain-local hot path leaves GPU memory" invariant — full optimization checklist for QuasarGPU 4.0+ activation
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Architecture
created: 2025-12-15
updated: 2025-12-20
requires:
  - lp-010 (QuasarSTM)
  - lp-020 (Quasar Consensus 3.0)
  - lp-132 (QuasarGPU Execution Adapter)
  - lp-134 (Lux Chain Topology)
  - lp-135 (QuasarSTM 4.0 — production spec, activation 2026-02-14)
references:
  - lp-009 (GPU-Native EVM)
  - lp-013 (FHE on GPU / F-Chain)
  - lp-067 (Confidential ERC-20)
  - lp-9010 (DEX Precompile)
---

# LP-137: GPU-Residency Invariant

## Status (v0.56 — 2026-04-26)

**All 9 LP-134 chains GPU-native** — strict definition satisfied (state +
canonical transition logic both on GPU). CPU only supplies packets, cold
pages, time, attestation, watchdog. No caveats.

### Coverage status (2026-04-26 roll-up)

LLVM source-based coverage on all five new VMs + cevm/quasar substrate.
Full roll-up with reproduction commands and per-VM analysis lives in
[`LP-137-COVERAGE.md`](LP-137-COVERAGE.md).

| Chain | VM | Tag | Line % | Branch % (oracle) | Tests |
|---|---|---|---:|---:|---:|
| P-Chain | PlatformVM | v0.55 | 98.10% | 99.25% (oracle) | 53/53 |
| C-Chain | EVM (cevm) | v0.44 | 96.51% | (host-side) | 59/59 |
| X-Chain | XVM | v0.55 | 95.15% | 90.08% | 43+/43+ |
| A-Chain | AIVM | v0.58.2 | 95.58% | 94.71% (oracle) | 45/45 |
| B-Chain | BridgeVM | v0.59.1 | 98.17% | 90.53% | 42/42 |
| M-Chain | MPCVM | v0.61.0 | 97.90% (oracle) | 90.32% (oracle) | 41/41 |

Aggregate: line ≥95% across the five new VMs (avg 96.98%); CPU reference
oracle — the security-critical byte-equivalence target — clears 90%
branch on every VM where it is the dominant translation unit. Branch
coverage gaps below 90% on whole-VM totals are itemized in each VM's
`COVERAGE.md` as physically-unreachable defenses (hash-table
linear-probe fallthrough behind arena-cap invariants, GPU driver
allocation-failure paths, switch-default arms over enum types). Bugs
caught and fixed during this push (rotl64 UB at n=0, keccak_f1600
clang -O3 miscompile, WGSL pointer/reserved-keyword issues, MPCVM
WGSL struct stride drift) are listed in the roll-up.

The Quasar substrate (`luxcpp/cevm` v0.44+) wires every chain's
transition root into `QuasarRoundDescriptor`; a single `QuasarCert`
binds the canonical state of all 9 chains via `certificate_subject =
keccak(... || P || C || X || Q || Z || A || B || M || F || ...)` in
fixed canonical order. The five new wave-tick services
(`PlatformVMTransition`, `XVMTransition`, `AIVMTransition`,
`BridgeVMTransition`, `MPCVMTransition`) reserve work-queue addresses
for per-VM ingress; the substrate already passes through them with
descriptor-direct writes.

### Coverage table

| Chain | VM | Repo | CUDA | Metal | WGSL | CPU↔GPU determinism |
|---|---|---|---|---|---|---|
| P-Chain | PlatformVM | luxcpp/platformvm v0.53.x | ✓ | ✓ | ✓ | byte-equal |
| C-Chain | EVM (cevm) | luxcpp/cevm v0.44 | ✓ | ✓ | — | byte-equal |
| X-Chain | XVM | luxfi/xvm v0.55.x | ✓ | ✓ | ✓ | byte-equal |
| Q-Chain | QuantumVM | luxcpp/lattice + cevm/quasar v0.43 | ✓ | ✓ | ✓ | byte-equal |
| Z-Chain | ZKVM | cevm/quasar Groth16 v0.43 | ✓ | ✓ | partial | byte-equal |
| A-Chain | AIVM | luxfi/aivm v0.58.x | ✓ | ✓ | ✓ | byte-equal |
| B-Chain | BridgeVM | luxfi/bridgevm v0.59.x | ✓ | ✓ | ✓ | byte-equal |
| M-Chain | MPCVM | luxfi/mpcvm v0.60.x | ✓ | ✓ | ✓ | byte-equal |
| F-Chain | FHEVM | luxcpp/fhe + luxfi/fhevm | ✓ | ✓ | ✓ | byte-equal |

WGSL "—" on C-Chain reflects EVM bytecode interpreter targeting
CUDA/Metal first; WGSL "partial" on Z-Chain reflects Groth16 pairing
arithmetic shipped on CUDA/Metal with WebGPU port pending.

### What v0.44 ships

- `QuasarRoundDescriptor` extended with five 32-byte chain transition
  roots (`xchain_execution_root`, `achain_state_root`,
  `bchain_state_root`, `mchain_state_root`, `fchain_state_root`); P/Q/Z
  remain from v0.42; C reuses `parent_block_hash` (cevm round IS C).
- `compute_certificate_subject` recipe extended to 11×32 byte hash
  input in canonical P, C, X, Q, Z, A, B, M, F + parent_state +
  parent_execution order. Both host (`quasar_sig.hpp`) and device
  (`quasar_wave.metal`) layouts updated; descriptor sizeof = 480 bytes.
- `QuasarRoundResult` echoes all 9 roots + `certificate_subject_echo`
  so downstream consumers reconstruct the cert subject from the result
  alone; sizeof = 672 bytes.
- `ServiceId::Count` bumped to 17 with five new transition services
  reserved at indices 12–16.
- 9-chain integration test (`quasar_9chain_integration_test.mm`)
  proves: subject keccak input matches the canonical 11-segment
  reference byte-for-byte; flipping any single bit in any of the 9
  chain roots produces a different subject (cert-binding holds);
  swapping two roots also produces a different subject (canonical
  order matters); engine echoes all 9 roots back into the result;
  tampered descriptor's recompute diverges from the engine's echo.

## Abstract

The QuasarGPU substrate (LP-132) ships with a clear architectural
contract that a future audit must enforce as an *invariant*, not a
goal. This LP names that invariant, classifies every chain-state
object by where it must live, and documents the full optimization
stack required to make it real.

> **The invariant**: *No chain-local hot path leaves GPU memory.*
>
> CPU/host is allowed only for asynchronous external I/O — network
> ingress, cold-state page service, attestation handshake, watchdog,
> crash recovery, operator control plane. Everything else lives in
> GPU memory: mempool, access prediction, DAG/frontier scheduling,
> EVM fibers, Block-STM, precompiles, receipts, roots, cert lanes,
> DEX matching, compliance gates, audit commitments.
>
> **The CPU touches reality. The GPU runs the chain.**

This is the v0.42–v0.50 production roadmap on top of Quasar 3.0
(LP-135). Implementation milestones are bounded; the residency
invariant is hard-enforceable via residency-class tagging,
ForbiddenHot CPU-handler counters, and CI assertions.

## 1. Residency Classes — every object must carry a tag

```cpp
enum class ResidencyClass : uint8_t {
    DeviceHot,      // must stay in GPU memory on the fast path
    DeviceWarm,     // GPU-resident cache, refillable from canonical source
    HostCold,       // cold canonical source-of-truth; async page-in only
    HostControl,    // host metadata / control plane only
    ForbiddenHot,   // SHOULD NEVER appear on the fast-path flamegraph
};
```

### DeviceHot — must never leave GPU memory during a round

| Object | Owner LP |
|---|---|
| QuasarRoundDescriptor working copy | LP-132 |
| QuasarRoundResult working copy | LP-132 |
| Device rings (12+ services) | LP-132 |
| Tx blobs after ingress | LP-132 |
| Decoded txs / VerifiedTx | LP-132 |
| Sender recovery outputs | LP-132 |
| Fee / nonce admission state | LP-132 |
| Lane hints (StmLaneHint) | LP-010 |
| DAG nodes / unresolved-parent counters | LP-132 |
| EVM fiber frames + stacks + memory arenas | LP-009 |
| Block-STM read/write sets | LP-010 |
| MVCC version arena | LP-010 |
| Hot account / storage cache | LP-010 |
| Precompile inputs / outputs | this LP §12 |
| Receipt / log material | LP-132 |
| Root construction material | this LP §22 |
| Cert lane artifacts | LP-020 |
| Quorum stake accumulators | LP-020 |
| DEX order / match / settlement buffers | LP-9010 |
| Compliance precompile state snapshots | this LP §15 |

### DeviceWarm — GPU-resident cache, refillable

```
code cache / ABI selector profiles
historical access profiles
hot state windows
validator-set cache
stake table cache
ZK verifying keys
Ringtail public parameters
market metadata
risk / compliance rule tables
```

### HostCold — cold canonical state

```
archival state (SSD / LSM)
cold trie nodes
full receipt archive
historical logs
full audit export
operator snapshots
```

### HostControl — allowed on host

```
watchdog status
kernel launch counters
device health
configuration load
attestation handshake (initial)
network socket ownership when no GPUDirect RDMA
```

### ForbiddenHot — must NOT appear on fast path

If any of these run on host on the round path, the design has failed:

```
host-side tx sorting
host-side DAG construction
host-side Block-STM validate / repair
host-side precompile execution
host-side keccak root construction
host-side quorum accumulation
host-side DEX matching
host-side compliance decision
host-side receipt construction
host-side gas accounting
```

CI gate: a counter `forbidden_hot_invocations` increments on every
ForbiddenHot call site; CI fails if the counter advances during a
fast-path test.

## 2. Memory Layout — offset arenas, no pointer soup

```cpp
using DevOffset = uint32_t;

template <typename T>
struct DevSlice {
    DevOffset offset;
    uint32_t  count;
};

struct ArenaHeader {
    uint32_t capacity;
    uint32_t bump;
    uint32_t high_watermark;
    uint32_t gc_epoch;
};
```

**18 canonical arenas**:

```
TxBlobArena        DecodedTxArena    CalldataArena   CodeArena
FiberFrameArena    FiberStackArena   FiberMemoryArena JournalArena
ReadSetArena       WriteSetArena     VersionArena    ReceiptArena
LogArena           RootArena         PrecompileArena CertArena
DexArena           AuditArena
```

Rules:
- No dynamic allocation on hot path. Bump allocation + epoch GC only.
- Offsets are device-portable across Metal and CUDA.
- Arenas are RDMA-friendly (consecutive layout; no linked-list walks).
- High-watermark telemetry per arena gates the round.

## 3. Rings Carry Descriptors, Not Payloads

```cpp
struct WorkItem {
    ServiceId service;
    DevOffset object_offset;
    uint32_t  object_count;
    uint32_t  priority;
    uint32_t  flags;
};
```

Payloads live in arenas. Rings carry only `(offset, length, type)`.
Cache-friendly; small ring traffic; trivially RDMA-able.

Optimization checklist:
- Power-of-two capacity (mask trick).
- Head/tail on cache-line-separate slots.
- SPSC where possible; MPSC only with priority buckets.
- Overflow + backpressure counters in `RingHeader`.
- Device-side priority buckets per service.
- No host polling of service internals.

## 4. Wave Scheduler — adaptive service pressure

```cpp
struct ServicePressure {
    uint32_t queue_depth;
    uint32_t deadline_weight;
    uint32_t dependency_weight;
    uint32_t stall_count;
    uint32_t hotness;
};
```

Per-tick budget:
```
budget(service) = base
                + queue_depth_weight
                + deadline_weight
                + unblock_weight
                - stall_penalty
```

Near deadline:
- Increase `Commit`, `Root`, `QuasarCert`, `QuorumOut`.
- Decrease `Decode`, `MempoolAdmission`.
- Freeze candidate frontier (no new admissions).
- Continue only repairs that block the commit horizon.

3.0 substrate uses fixed `gid → service`. v0.42 lands adaptive
budgets; v0.43 adds work-stealing across services.

## 5. CUDA — persistent + graphs + cooperative groups

| Feature | Use |
|---|---|
| Persistent kernel | Quasar wave scheduler runs as a persistent CTA grid |
| CUDA Graphs | Stable-topology wave batches captured once, replayed many times |
| Cooperative Groups | Intra-kernel service-barrier synchronization |
| Stream priorities | Cert / Commit / Root urgency bumps |
| Pinned / registered host memory | Cold fallback only |
| GPUDirect RDMA | NIC → GPU rings on InfiniBand-equipped clusters |
| GPUDirect Storage | Cold-state page-in where available |

Graph rule: capture for stable topology (same services, same memory
pools, same stream graph). Don't graph fully dynamic topology.

## 6. Metal — bounded waves + indirect commands

| Feature | Use |
|---|---|
| Bounded wave ticks | Host re-launches `quasar_wave` kernel; relaunch is fairness |
| MTLSharedEvent | Host/device sync for round boundaries |
| MTLIndirectCommandBuffer | GPU-authored work where useful |
| Argument buffers | Service descriptor tables |
| MTLBuffer offset arenas | All 18 arenas are offset views |
| **No** persistent hot-spinning kernel | Verified empirically broken on Apple Silicon (v0.29 starvation) |
| **No** CPU semantic phase decisions | Host writes `closing_flag` + reads result; nothing else |

## 7. Networking — direct GPU ingress

**Target**: NIC → GPU `event_ingress_ring` (GPUDirect RDMA).

**Fallback**: NIC → host pinned batch → GPU ring.

```cpp
struct IngressEnvelope {
    uint16_t kind;       // tx, vote, cert, state page, order
    uint16_t flags;
    uint32_t len;
    uint64_t source_id;
    uint64_t seq;
    Hash     payload_hash;
    DevOffset payload_offset;     // into TxBlobArena
};
```

Rings carry envelopes; payloads land in the corresponding arena.

**Traffic classes** (one ring each):

```
TC0  cert / votes
TC1  orderflow
TC2  state pages
TC3  tx gossip
TC4  audit / archive
```

Optimizations: batch small txs into MTU/jumbo/RDMA writes; per-TC
quotas; device-side dedup; device-side replay window; device-side
source quotas.

## 8. Cold-state page faults — never stall the wave

```cpp
struct StateRequest {
    Hash      key;
    StateKind kind;          // Account, Storage, Code, TrieNode
    uint32_t  fiber_id;
    uint32_t  priority;
    uint64_t  deadline_ns;
};
```

Fault flow:
1. Fiber misses → emit `StateRequest`, mark `SuspendedState`,
   schedule other work.
2. Host services via LSM/cache/disk; posts `StatePage`.
3. `StateResp` service inserts into DeviceWarm cache; wakes fibers.

State cache:
- GPU cuckoo / hash table for hot key → value.
- Bloom or quotient filter for known-missing keys.
- Two-tier: hot exact keys + page/block cache.
- Admission policy by lane hotness.
- Prefetch predicted access sets before exec.
- Pin market / compliance / validator hot state per epoch.
- Evict by epoch + hotness + size.

**Page granularity** — page by *locality*, not individual trie nodes:

```
account page                 contract storage prefix page
market page                  validator / stake page
code page                    precompile state page
```

Multi-GPU / RDMA: store consecutive versions per key/page (Motor-style
VersionBlock per LP-135) so one fetch returns all likely-visible
versions.

## 9. EVM fibers — SoA, not AoS

Per-fiber struct-of-arrays:

```
pc[]              gas[]              status[]
contract[]        caller[]           value[]
stack_offset[]    memory_offset[]    journal_offset[]
read_set_offset[] write_set_offset[]
```

Large fields go in arenas. Per-fiber stack alone (256-bit × 64 entries
× 4096 fibers ≈ 13.6 MB) is acceptable; full receipt bodies are not.

**Opcode grouping** — group by execution behavior, not numeric order:

| Group | Opcodes |
|---|---|
| ALU (no state, no suspend) | ADD, SUB, MUL, DIV, …, AND/OR/XOR, etc. |
| Memory (local arena) | MLOAD, MSTORE, MSTORE8, MCOPY |
| Hash (Keccak service) | KECCAK256 |
| Env (round constants) | CHAINID, BASEFEE, COINBASE, … |
| State (may suspend) | SLOAD, BALANCE, EXTCODE* |
| Call/Create (frame push/suspend) | CALL, DELEGATECALL, STATICCALL, CREATE/CREATE2 |
| Log (receipt arena) | LOG0..LOG4 |
| Precompile | (forwarded to Precompile service §12) |

**Superinstructions** (fuse common patterns):
```
PUSH + PUSH + SLOAD             → fused storage load
CALLDATALOAD + AND/SHR selector → fused dispatch
MLOAD/MSTORE ABI copy            → memcpy_abi
ERC20 balance slot calculation   → erc20_slot
mapping slot keccak              → mapping_slot
LOG append                       → log_append
```

Must produce identical gas + exception behavior. Validate against
cevm CPU reference.

## 10. Gas — device-local, deterministic

```cpp
struct GasState {
    uint64_t remaining;
    uint64_t refund;
    uint64_t memory_words;
};
```

Optimizations:
- Precompute static gas per basic block (compile-time analysis).
- Separate dynamic gas hooks (memory expansion, SLOAD warm/cold).
- Batch memory expansion calculation.
- Fail fast on gas-impossible upper bound.
- Gas snapshots in fiber checkpoints.
- **Host never recomputes gas on the fast path.**

## 11. Keccak — one batched service

Keccak appears everywhere: tx hash, sender recovery, mapping slots,
code hash, receipt root, state root, certificate subject, audit
root. Optimization:

```cpp
struct HashJob {
    HashJobKind kind;
    DevOffset   input_offset;
    uint32_t    input_len;
    DevOffset   output_offset;
};
```

- Inline tiny fixed-size keccak paths in hot opcodes.
- Separate variable-length calldata hashing service.
- Reuse sponge state for trie / root chains where correct.
- Cache `code_hash` and selector profiles.
- Deduplicate repeated mapping slot hashes.

## 12. Precompiles — every precompile is a GPU service

```cpp
struct PrecompileCall {
    uint32_t  tx_id;
    uint32_t  fiber_id;
    uint16_t  precompile_id;
    uint16_t  flags;
    DevOffset input_offset;
    uint32_t  input_len;
    DevOffset output_offset;
    uint32_t  output_capacity;
    uint64_t  gas_budget;
};

struct PrecompileResult {
    uint32_t tx_id;
    uint32_t fiber_id;
    uint16_t status;
    uint16_t flags;
    uint32_t output_len;
    uint64_t gas_used;
};
```

Fiber suspends on `CALL precompile`, woken when result arrives.

**Per-precompile classes** (no mixed-precompile kernel — branch
divergence kills throughput):

| Class | Examples |
|---|---|
| Crypto | secp256k1/ecrecover, sha256, ripemd160 |
| Hash | keccak (separate service §11) |
| Elliptic curve | bn256 add/mul/pairing |
| BLS / PQ cert | BLS aggregate, Ringtail share, Groth16 |
| DEX / matching | OrderAppend, BatchAuction, ContinuousLimit, OMASettlement |
| Compliance / risk | ComplianceCheck, RiskLimits, KYCEligibility |
| Oracle / attestation | TEE quote, price feed, deadline |
| ZK verify | Halo2, Plonky2, Risc0 (per LP-063) |
| AI / model market | Inference attestation, HMM provenance (per Hanzo AI Chain) |

## 13. Crypto precompile optimizations

### secp256k1 / ecrecover
- Batch normalize inputs.
- Reject invalid v/r/s early.
- Batch modular inversion (Montgomery's trick).
- Window tables in `__constant__` / threadgroup memory.
- Recovered addresses written to arena.

### BLS12-381
- Batch subgroup checks.
- Batch pairing verification (`blst_pairing_chk_n_aggr_pk_in_g2`).
- Aggregate public keys; cache pubkeys in DeviceWarm.
- Precompute committee pubkey tables per epoch.

### Ringtail
- Cache public params in DeviceWarm.
- Batch NTT / polynomial operations.
- Bind subject in GPU memory; no per-share host parse.

### MLDSAGroth16 (Z-Chain rollup)
- The GPU lane verifies the Groth16 proof, **not** raw per-validator
  ML-DSA sigs. (Cite LP-020 §3.0.)
- VK resident in DeviceWarm.
- Batch pairings.
- `public_input_hash = H(certificate_subject || pchain_root || zchain_root || validator_set_root)`.

## 14. ZK proof verification — DeviceWarm VK + batched pairings

- Fixed VK resident per epoch.
- Public input hashing on GPU.
- Batch pairing precomputation.
- Proof format canonicalized at ingress (reject malformed early).
- For fixed-size proof systems (Groth16 = 192 B), keep dedicated slot;
  general cert artifact ABI stays `(offset, len)` for forward
  compatibility.

## 15. Compliance — GPU-native, never CPU callback

For regulated DEX (Liquidity / Beluga), compliance cannot be a CPU
callback.

GPU-resident compliance state:
```
KYC identity commitment            jurisdiction flags
accreditation / investor status    sanctions snapshot commitment
venue permissions                  asset transfer restrictions
position / risk limits             disclosure / audit policy
```

Precompile:
```
ComplianceCheck(account, asset, venue, action, amount, jurisdiction)
  → { allowed | denied, reason_code, audit_commitment, gas_used }
```

Privacy: keep raw identity data committed/encrypted; GPU operates
over compact eligibility commitments.

## 16. DEX precompile optimization

Most orderflow on a co-located regulated DEX is **not** arbitrary
Solidity. Use GPU-native DEX precompiles:

```
OrderAppend         OrderCancel
BatchAuction        ContinuousLimitBook
RiskCheck           MarginUpdate
FeeAccumulate       OMASettlement
AuditCommit
```

**Batch auction as reducer**:
```
1. append order events during batch
2. at boundary: deterministic match
3. settle net account deltas
4. emit audit root
```

Avoids hot-key SSTORE contention on every order event.

**Order book layout (SoA)**:
```
market_id → price level pages → order queue offsets
account_id → balance / margin lane
price[]  qty[]  side[]  account[]  timestamp_seq[]  flags[]
```

No per-order pointer nodes.

## 17. Semantic reducers

Many "transactions" should be reducers, not writes.

```cpp
enum class ReducerKind : uint8_t {
    Add, Sub, Append,
    BalanceDelta, FeeAccumulate,
    OrderAppend, OrderCancel, AuctionMatch,
    AuditAppend,
};
```

Commit rule:
1. Collect reducer ops per lane.
2. Sort by canonical order.
3. Apply deterministic reduction.
4. Emit one final state write.

Avoids Block-STM conflict storms on fee counters, audit logs, order
books, batch settlement, liquidity accounting.

## 18. State lanes + hot-lane promotion

```cpp
lane_id = H(contract, storage_domain, account, market, asset, nonce_lane);

enum class LaneClass : uint8_t {
    Owned, Shared, HotShared, Reducer, Serialized, Unknown,
};
```

Policy:
- **Owned** → fast path, no cross-tx validation.
- **Reducer** → semantic reducer.
- **Shared** → MVCC.
- **HotShared** → split / reducer / serialized precompile.
- **Serialized** → one-at-a-time lane queue.
- **Unknown** → conservative Block-STM.

Scheduler updates lane class continuously from telemetry.

## 19. Block-STM tiered validation (LP-010 §three-tier extended)

```
Tier 0  no writes / read-only fast path
Tier 1  lane-clock validation
Tier 2  key-level MVCC visible-version
Tier 3  semantic validation
Tier 4  repair
```

Avoid running exact MVCC validation for txs that touched only
unchanged owned lanes. Batch validation jobs by read-set length to
reduce branch divergence.

## 20. Repair — bounded, prioritized, checkpointed

```
max_fast_repairs              = 3
max_total_repairs             = 8
hot-lane escalation threshold = 16
```

Priority:
1. Earlier canonical order first.
2. Unblocks many descendants first.
3. Near commit horizon first.
4. Higher fee only after safety priorities.

Checkpoint rollback (LP-010): rollback to before invalid read;
preserve decoded tx, calldata, code cache, unaffected reads.

Telemetry:
```
repair_amplification     p99_incarnation
full_reexec_count        checkpoint_rollback_count
hot_lane_escalations
```

Target `repair_amplification < 1.01` on normal DEX workload.

## 21. Commit server — fibers emit intents, server commits

Fibers emit:
```
read intent       write intent
reducer intent    receipt intent       log intent
```

Commit service owns mutation of:
```
MVCC version chains    lane clocks
receipt chains         root material      commit horizon
```

Avoids fiber CAS storms on global metadata.

Commit batching:
- Commit by canonical index range.
- Commit by lane shard.
- Commit by reducer lane.
- Commit by horizon cut.

## 22. Root construction — separate roots for separate purposes

```
state_root            commits to MVCC final state
receipts_root         commits to receipt arena
execution_root        commits to ordering / RW set / gas / status / logs
mode_root             Nova linear-prefix root or Nebula causal-cut root
audit_root            selective-disclosure commitment for regulated DEX
certificate_subject   binding for QuasarCert lanes (LP-020)
```

`execution_root` commits to:
```
tx order / DAG frontier      read/write commitments
gas used / status            logs hash
precompile outputs           conflict/repair metadata
```

Construction:
- Dirty key collection (incremental).
- Sort + dedup dirty keys on GPU.
- Batch leaf hashing.
- Batch internal node hashing.
- Incremental root update from prior round.

## 23. Receipts / logs — compact arena, async export

```
compact receipt format in GPU memory
logs stored as offset / len
bloom built on GPU
receipt root from compact material
archive export async (host pulls from GPU/SSD pipeline)
```

Fast path never copies full receipt bodies to host.

## 24. Data availability — sign roots, not raw events

For billion-event throughput, do NOT globally replicate every raw
event synchronously. Layered:

```
raw event blobs               (per-validator, ephemeral)
compressed event root         (signed)
execution root                (signed; LP-020 cert subject input)
settlement root               (signed)
audit root                    (signed; selective disclosure)
selective disclosure data     (privileged readers only)
```

Availability via erasure-coded blobs, co-located DA nodes, regulatory
archive lane, selective replay.

## 25. Confidential compute (TEE binding)

Per NVIDIA H100 confidential compute + Apple Secure Enclave / AMD
SEV-SNP:

- Attest **once per epoch / binary / policy**, not per tx.
- Bind measurement root into `certificate_subject`.
- Never bounce plaintext through host.
- Decrypt only inside the confidential boundary.

```
confidential_attestation_root = H(
    cpu_tee_measurement,
    gpu_measurement,
    quasar_gpu_binary_hash,
    precompile_binary_hash,
    market_policy_root)
```

Bind into `certificate_subject` (LP-020), `audit_root`, DEX batch
root.

## 26. Memory safety + privacy hygiene

GPU memory contains sensitive orderflow.

- Zero freed confidential arenas (epoch boundary).
- Per-lane encryption domains where feasible.
- No debug dumps of plaintext orderflow.
- No host-readable mapped buffers for private lanes.
- Explicit redaction path for telemetry.

Telemetry exposes counts, latencies, roots, reason codes — **never**
raw orders, identities, unmasked accounts, sensitive compliance
facts.

## 27. Cert lane optimization (LP-020 §3.0)

```cpp
struct CertArtifact {
    QuasarCertLane lane;
    Hash subject;
    DevOffset artifact_offset;
    uint32_t  artifact_len;
    Hash public_inputs_hash;
};
```

Per-lane optimization:
- **BLS**: cache pubkeys, batch verify, aggregate bitmaps.
- **Ringtail**: cache ceremony params, batch polynomial ops.
- **MLDSAGroth16**: cache VK, batch pairing verify.

Invariant: all lanes bind same `certificate_subject`.

## 28. Multi-GPU sharding

Shard by:
```
state lane          market
account range       precompile type
cert lane           root construction stage
```

Avoid sharding by random tx index (causes cross-GPU state chatter).

**Typical 8-GPU topology**:
```
GPU 0  ingress / decode / admission
GPU 1  DEX / private orderflow / compliance
GPU 2  EVM fibers shard A
GPU 3  EVM fibers shard B
GPU 4  STM commit / root
GPU 5  cert lanes
GPU 6  audit / DA compression
GPU 7  replay verifier / hot spare
```

Cross-GPU communication:
- NVLink / NVSwitch intra-node.
- GPUDirect RDMA over InfiniBand inter-node.
- NCCL only for true collectives (reductions, broadcasts).
- Custom RDMA rings for adversarial consensus messages.

## 29. Workload-class scheduling

```
simple transfer              ERC20 transfer
DEX order append             DEX match / settle
compliance check             AMM swap
contract deploy              router call
ZK verify                    cert vote
cold-state heavy             unknown arbitrary EVM
```

Policy:
```
simple/owned lane    → fast path
DEX append           → reducer
compliance           → precompile batch
ZK / cert            → crypto service
unknown EVM          → isolated fiber batch
cold-state heavy     → lower priority unless near deadline
```

## 30. Unknown-contract profiling

```cpp
struct ContractProfile {
    Hash     code_hash;
    uint32_t selector;
    Hash     predicted_lanes_root;
    uint16_t confidence;
    uint16_t observed_conflict_rate;
    uint32_t avg_gas;
    uint32_t cold_miss_rate;
};
```

First execution samples access set. Promote to known class when
stable; demote on access instability / high conflict / frequent
revert / cold-state-heavy.

## 31. Compiler / JIT tiers (long-term)

```
Tier 0  fiber VM interpreter
Tier 1  superinstructions
Tier 2  selector-specific traces
Tier 3  contract-specific GPU JIT / AOT
Tier 4  native precompile
```

Promote on hot selector + stable access set + low divergence + high
volume.

## 32. Revert / journal

```cpp
struct JournalSegment {
    uint32_t  tx_id;
    uint32_t  depth;
    DevOffset start_offset;
    DevOffset end_offset;
};
```

- Subcall: push journal checkpoint.
- Revert: discard segment.
- Success: merge segment upward.
- **Never** mutate MVCC canonical versions inside subcalls — emit
  speculative write intents only.

## 33. CREATE / CREATE2

```
compute address on GPU
hash initcode on GPU
code deposit into CodeArena
dedup identical code hashes
delay code availability until commit
track CREATE2 address conflicts as lane conflicts
```

Create lane:
```
lane = H(deployer, nonce_or_salt, initcode_hash)
```

## 34. SELFDESTRUCT / TLOAD / TSTORE

- `SELFDESTRUCT`: journal only; commit-order resolved; lane marked
  destructive.
- `TLOAD` / `TSTORE`: tx-local transient arena; no global MVCC unless
  cross-frame semantics require.

Never let destructive semantics bypass STM.

## 35. Access-list optimization (ConflictSpec)

Merge from all sources into ConflictSpec:
```
EIP-2930 access lists       historical profile
ABI selector                simulation cache
contract profile            DEX / precompile known lanes
user-declared spec          learned predictor
```

ConflictSpec drives Prism refraction (LP-010) and lane prefetch.

## 36. Bloom / filters

Device-side filters for fast negative checks:
```
hot state presence              code cache presence
known lane predictor            duplicate tx
duplicate vote / cert artifact  spent nonce
known-invalid signature
```

## 37. Deduplication

Dedup on GPU:
```
same tx hash / order id          same vote artifact
same cert lane artifact          same state request
same code hash                   same precompile input
same keccak job
```

DEX/orderflow: dedup cancels/replaces by `(account, order_id)`.

## 38. Deadline-aware execution

Services read:
```
deadline_ns        current_tick_budget
commit_pressure    cert_pressure
```

Policy:
```
early   admit / explore / execute broadly
mid     prioritize high-score frontiers
late    freeze admission; repair only commit-horizon blockers
        root / certify
imminent  emit best valid prefix/cut
```

GPU makes the decision. Host supplies clock / deadline only.

## 39. Proposal search (GPU-native blockbuilding)

Candidate score:
```
score = fees + app rewards + MEV/auction surplus
      - conflict_cost - cold_state_cost - repair_cost
      - deadline_risk - compliance_risk
```

Run multiple candidate frontiers in parallel:
```
high fee candidate         low conflict candidate
DEX-priority candidate     cert-fast candidate
```

Pick best certifiable result before deadline.

## 40. Security hardening

**Replay protection** — bind everything to:
```
chain_id      epoch        round       mode
validator root              P/Q/Z roots
attestation root            parent roots
```

**Determinism**: no nondeterministic atomic ordering affecting roots,
no floating-point consensus math, no hash-table iteration order, no
unordered reducer output, no race-dependent version chain insertion.

**Side channels** — for regulated/private lanes:
- Constant-ish proof-verification paths where feasible.
- Batch padding for private orderflow.
- Traffic shaping for sensitive lanes.
- Delayed reveal.
- No host-visible plaintext.

## 41. Observability without secrets

Metrics exposed:
```
wave_tick_count               service_queue_depths
service_budget_allocations    lane_fast_valid_rate
conflict_rate                 repair_amplification
cold_miss_rate                precompile_batch_sizes
root_latency                  cert_lane_latency
GPU memory pressure           arena high-watermarks
RDMA ingress latency
```

Never expose: private order contents, identities, unmasked accounts.

## 42. Test matrix (CI-enforced residency invariant)

### Residency tests
```
test_precompile_call_does_not_invoke_cpu_handler
test_keccak_roots_produced_on_gpu
test_receipt_root_produced_on_gpu
test_quorum_status_produced_on_gpu
test_block_stm_repair_scheduled_on_gpu
test_state_miss_suspends_fiber_no_host_fallback
```

Mechanism: `forbidden_hot_invocations` counter increments on every
ForbiddenHot call site; CI fails on any increment during fast-path
tests.

### Fault tests
```
cold page delayed              duplicate RDMA packet
invalid cert artifact          bad Groth16 public input
stale P-chain validator root   wrong Q-chain ceremony root
wrong Z-chain VK root          hot-lane conflict storm
out-of-memory arena pressure
```

### Equivalence tests (cross-backend determinism)
```
CPU reference == Metal == CUDA
  same state_root
  same receipts_root
  same execution_root
  same certificate_subject
```

## 43. PR roadmap

| Version | Theme |
|---|---|
| v0.42 | GPU-residency audit: ResidencyClass tags, ForbiddenHot counters, precompile fast-path assertions |
| v0.43 | Precompile service ABI: PrecompileCall/Result, fiber suspend/resume, batched precompile queues |
| v0.44 | Crypto precompiles: keccak, ecrecover, BLS, Ringtail, MLDSAGroth16, Groth16 VK cache |
| v0.45 | DEX / compliance precompiles: OrderAppend, BatchAuction, RiskCheck, ComplianceGate, OMASettlement, AuditCommit |
| v0.46 | Semantic reducers: FeeAccumulate, OrderAppend, BalanceDelta, AuditAppend |
| v0.47 | GPU root pipeline: dirty-key gather, receipt root, execution root, mode root, audit root, certificate_subject |
| v0.48 | GPUDirect ingress: NIC → GPU rings, fallback pinned path, RDMA sequence/replay checks |
| v0.49 | Confidential mode binding: attestation root, policy root, no plaintext host buffers, certificate_subject binding |
| v0.50 | Multi-GPU service sharding: lane ownership, cross-GPU rings, cert lane GPU, root GPU, EVM shard GPUs |

## 44. The thesis

> QuasarGPU reaches minimum latency when all chain-local state
> transitions, including EVM precompiles and consensus-adjacent
> certificate work, execute against device-resident arenas, with the
> host reduced to asynchronous ingress, cold-page service,
> attestation, and watchdog control.

The slogan stays right:

> **The CPU touches reality. The GPU runs the chain.**

## References

| Resource | Location |
|---|---|
| QuasarSTM 3.0 | LP-010 |
| Quasar Consensus 3.0 | LP-020 |
| QuasarGPU adapter | LP-132 |
| Quasar-Native App Stack | LP-133 |
| Lux Chain Topology | LP-134 |
| QuasarSTM 4.0 (production) | LP-135 |
| Lux Cloud | LP-136 |
| GPU-Native EVM | LP-009 |
| FHE on GPU / F-Chain | LP-013 |
| Confidential ERC-20 | LP-067 |
| DEX Precompile | LP-9010 |

External:
- NVIDIA GPUDirect RDMA developer documentation
- NVIDIA Confidential Compute (H100) developer documentation
- Apple Metal Shading Language Specification (atomic-order limits)
- CUDA Cooperative Groups + CUDA Graphs documentation

## Copyright

Copyright (C) 2025, Lux Partners Limited. All rights reserved.
