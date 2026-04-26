---
lp: 136
title: Lux Cloud — Decentralized Appchain Cloud Substrate
tags: [cloud, appchain, decentralized, gpu, paas, faas, tee, fhe, dex, attestation, quasar]
description: Permissionless decentralized cloud where every customer runs in their own Quasar-native appchain — GPU compute, storage, AI inference, DEX engines, and FHE compute priced per-appchain via on-chain markets
author: Lux Core Team (@luxfi), Hanzo AI (@hanzoai)
status: Final
type: Standards Track
category: Architecture
created: 2025-12-15
updated: 2025-12-15
requires:
  - lp-132 (QuasarGPU Execution Adapter)
  - lp-133 (Quasar-Native App Stack)
  - lp-134 (Lux Chain Topology)
references:
  - lp-009 (GPU-Native EVM)
  - lp-013 (FHE on GPU / F-Chain)
  - lp-019 (Threshold MPC)
  - lp-020 (Quasar Consensus 3.0)
  - lp-062 (KMS)
  - lp-063 (Z-Chain)
  - lp-065 (TEE Mesh)
  - lp-066 (TFHE)
  - lp-076 (Universal Threshold)
  - lp-127 (Attestation)
  - lp-130 (AI)
  - lp-9010 (DEX engine precompile)
---

# LP-136: Lux Cloud — Decentralized Appchain Cloud Substrate

## Abstract

Lux Cloud is the **decentralized cloud substrate** of the Lux Network.
Every customer runs inside their **own Quasar-native appchain** (or
shares one with similar-tenancy customers), executed by the QuasarGPU
adapter (LP-132) and finalized by the Quasar 3.0 cert pipeline
(LP-020). Anyone can run a node by staking on P-Chain. Anyone can
deploy a Lux Cloud appchain. Resource consumption — GPU compute,
storage, bandwidth, FHE bootstraps, AI inference tokens — is priced
per-appchain via on-chain markets and paid in native LUX or
appchain-native tokens.

The unifying observation: **every cloud workload is a Quasar appchain
preset**. There is no separate cloud stack; the same nine chains
(LP-134) and the same wave-tick GPU kernel (LP-132) run consensus,
DEX, EVM, FHE, AI inference, and customer workloads in lockstep.

## 1. Decentralization

### Bitcoin-class permissionlessness

| Property | Mechanism |
|---|---|
| **Anyone can run a node** | stake LUX on P-Chain, register validator key (LP-015), be eligible for any appchain's validator subset |
| **Anyone can deploy an appchain** | submit `DeployAppchainTx` on P-Chain with a `BaseAppchainConfig` (LP-133); validator subset auto-selects from staked pool |
| **No gatekeeper for tenancy** | appchain ID space is permissionless; collisions resolved by stake-weighted priority |
| **No central operator** | every workload runs across N>2/3 of its appchain's validator subset; loss of any 1/3 is tolerated |
| **Open source** | node, adapter, EVM, FHE, AI inference are MIT/Apache; reproducible builds via `~/work/lux/node` |

### Validator selection per appchain

Each appchain's validator subset is committed in the `BaseAppchainConfig`
(LP-133):

```cpp
struct BaseAppchainConfig {
    uint64_t  chain_id;
    Hash      validator_subset_root;   // P-Chain commitment
    Hash      qchain_ceremony_root;
    Hash      zchain_vk_root;
    QuasarMode mode;                   // Nova or Nebula
    uint64_t  block_time_ms;
    uint64_t  gas_limit;
};
```

Subset selection is deterministic from `(P-Chain validator set,
chain_id, epoch)`. Subset size is policy: a tenant may pay for a
larger subset (more decentralization) or a smaller one (cheaper).

### Failure domain isolation

Cross-tenant isolation runs at the appchain boundary:

| Failure mode | Blast radius |
|---|---|
| Validator equivocation | one appchain (signed by validator's stake share) |
| GPU node crash | one appchain's lane subset on that node |
| Network partition | partitioned appchains; others unaffected |
| Smart-contract bug | one appchain's contract space |
| FHE key compromise | one F-Chain key arena; rotated per LP-013 |

There is no shared mutable cloud-control-plane state across tenants
that could fan a single failure across the customer base.

## 2. Workload classes

Every Lux Cloud workload maps to one or more chains in LP-134's
nine-chain topology:

### 2.1 Stateful services (database, KV, queues)

Native pattern: **Hanzo Base appchains on Quasar** (LP-133 §2).

| Concept | Mapping |
|---|---|
| Database table / collection | `domain` component of lane key |
| Row / record | `H("base", chain_id, collection, record_id)` lane |
| Read query | local read from owned lane (gateway routes to owner) |
| Write / mutation | Quasar tx in QuasarGPU adapter |
| Transaction | distributed-tx via per-lane cert artifacts |
| Realtime subscription | tail `CertOut` for subscribed lanes |

Throughput: LP-132 §Tier 2 (~100 M ops/s on a single GPU node).
Finality: < 1.1 s strong; commit < 50 ms.

### 2.2 Stateless compute (workers, FaaS)

Stateless workloads are **C-Chain contracts** (LP-009 GPU-native EVM)
deployed inside the customer's appchain. Cold-start is zero (no
container boot); the EVM fiber executes inside the wave-tick kernel.
Function inputs and outputs are tx calldata and emitted events.

Auto-scaling: validator subset size determines compute-side capacity;
the customer can scale by paying for a larger subset. Read-side scaling
is automatic via the gateway's lane-affinity routing (LP-133 §1).

### 2.3 AI inference (HMMs and LLMs)

Per LP-130, AI inference runs through the Hanzo AI Chain
(`drain_ai` service, forthcoming) that consumes model weights from
content-addressed storage and runs inference inside the QuasarGPU
wave-tick kernel.

| Pattern | Authority |
|---|---|
| Model loading (weight hash) | content-addressed; pinned by P-Chain stake |
| Inference dispatch | C-Chain precompile call → AI-chain lane |
| Result attestation (proof of correct inference) | A-Chain (LP-134) attestation |
| Token-billed metering | per-inference fee charged to caller's appchain account |

The inference cert lane is registered alongside the LP-134 lanes
(reserved enum slot ≥ 10). Confidential inference (encrypted weights
or encrypted inputs) routes through F-Chain (`FheCompute` service).

### 2.4 DEX engines (precompile-native)

The DEX matching engine is a **C-Chain precompile** (LP-9010), not a
contract. Order books live in lanes (LP-010 lane affinity), match in
the wave-tick kernel, and settle on X-Chain. Lux Cloud DEX customers
get sub-100µs match latency on the same GPU process that serves their
other workloads.

### 2.5 FHE compute (encrypted services)

Encrypted workloads run on **F-Chain** (LP-013, LP-066) via the
`drain_fhe` service. Customers pay per TFHE gate evaluation +
bootstrap. Use cases:

| Use case | LP |
|---|---|
| Confidential ERC-20 (token balances hidden) | LP-067 |
| Private teleport (cross-chain confidential transfer) | LP-068 |
| Encrypted database queries | this LP §2.1 + F-Chain |
| Encrypted ML inference | this LP §2.3 + F-Chain |

Bootstrap-key material lives in **M-Chain ceremony output → F-Chain
key arena** (LP-013 §key-share ceremonies, LP-076 universal threshold).

## 3. Resource economics

### Per-appchain markets

Each appchain has its own gas / fee curve. The customer chooses:

| Knob | Effect |
|---|---|
| `gas_limit` | per-block compute budget |
| `block_time_ms` | latency vs. cost trade-off |
| `validator_subset_size` | redundancy / decentralization budget |
| `mode` (Nova / Nebula) | linear order vs. DAG fanout |
| `fee_token` | LUX or appchain-native (must be exchangeable for LUX at the validator level for stake-aligned settlement) |

Settlement: per-block fees are split between the appchain's validator
subset (compute reward) and the P-Chain global treasury (stake reward
+ slashing pool). Split ratio is policy per LP-080 / LP-083.

### Per-resource pricing

Resource consumption is metered at the substrate level — there is no
host-side metering. Every priced operation is a counter inside the
wave-tick kernel:

| Resource | Counter | Settlement |
|---|---|---|
| EVM gas | per-tx gas used | per-block, in fee token |
| GPU compute (kernel-time) | service-tick count per service | per-block, in fee token |
| Storage (state-trie bytes) | trie-node deltas per block | per-block, in fee token |
| Bandwidth | bytes egressed via gateway | per-billing-window |
| TFHE gates | per-gate counter in `drain_fhe` | per-block |
| Bootstrap | per-bootstrap counter | per-block |
| AI inference tokens | per-token counter in AI lane | per-inference |
| DEX matches | per-match in DEX precompile | per-match |

All counters live in the same per-tx receipt. No external billing
service is involved on the hot path.

### Marketplace mechanics

Validator nodes advertise their resource availability (GPU model,
memory, bandwidth, TEE support) in a P-Chain registry (per LP-129).
When a `DeployAppchainTx` arrives, the subset selector matches the
appchain's resource requirements against advertised capacity.
Oversubscription resolves via stake-weighted bidding within the
selection epoch.

## 4. TEE integration

Confidential workloads run inside SGX / SEV-SNP / TDX with quotes
attested to **A-Chain** (LP-134). The pattern:

1. Tenant deploys a confidential appchain with `tee_required: true`
   in `BaseAppchainConfig`.
2. Validator subset selector restricts to TEE-capable nodes.
3. Each node submits a TEE quote (per LP-127, LP-065) on join.
4. Quotes verify via `drain_attest` (LP-134 §A-Chain), commit to
   `achain_attestation_root[32]` in `QuasarRoundDescriptor`.
5. Customer contracts can read the attestation root via precompile
   and gate sensitive operations on it.

TEE + FHE together (encrypted execution inside attested enclaves)
provides defense in depth: a TEE compromise alone reveals only
ciphertexts; an FHE compromise alone is irrelevant to data inside
TEEs.

## 5. Migration / portability

Appchain state is portable. The mechanism:

| Step | Action |
|---|---|
| 1 | Customer issues `SnapshotAppchainTx` on their appchain |
| 2 | Validator subset produces a Quasar-cert-protected snapshot at the named round |
| 3 | Snapshot artifact = `(state_root, snapshot_blob_hash, quasar_cert)` committed under M-Chain ceremony root or B-Chain bridge root |
| 4 | New deployment (different chain ID, possibly different validator subset, possibly different cluster) imports the snapshot via `RestoreAppchainTx`, verifying the cert against the source epoch's `QuasarRoundDescriptor` |
| 5 | C-Chain contract addresses, Base records, FHE ciphertexts all preserve identity |

This is **lift-and-shift portability over a permissionless substrate**
— a stronger guarantee than typical cloud portability, because the
cert provides cryptographic continuity, not just data continuity.

## 6. Reference implementations

### Hanzo Cloud (`~/work/hanzo/cloud`)

The Casibase-derived AI cloud (RAG, embedding providers, vector
search) runs as a Lux Cloud appchain. Each tenant gets:
- A Base appchain for collections (knowledge bases, conversations).
- An AI lane for inference dispatch.
- An F-Chain key arena for confidential RAG queries.

### Lux Cloud (`~/work/lux/cloud`)

The reference cloud frontend / dashboard. Next.js + tRPC over
QuasarGPU engine RPCs. Drives appchain deployment, monitoring, and
billing through P-Chain transactions.

### Lux Cloud Operator

Cloud-infra orchestration (validator-node provisioning, GPU driver
setup, KMS sync) is performed by `~/work/lux/operator` (the
lux-cloud-operator). Per CLAUDE.md, all cloud infra deployment runs
through the operator + `platform.hanzo.ai` PaaS — devs do not touch
DOKS / GKE directly.

## 7. Implementation plan

| Version | Scope |
|---|---|
| **v0.50** | LP-134 chain topology lands (M, F, A, B chains) |
| **v0.51** | `DeployAppchainTx` on P-Chain; validator subset selector |
| **v0.52** | Per-appchain fee markets; receipt metering for GPU + storage |
| **v0.53** | Hanzo Base appchain template (LP-133 §2) ships in operator |
| **v0.54** | F-Chain confidential appchain template |
| **v0.55** | TEE-required appchain template (A-Chain attested) |
| **v0.56** | AI inference appchain template (LP-130) |
| **v0.57** | Snapshot/restore portability flow (this LP §5) |
| **v0.58** | Marketplace registry: GPU/TEE/bandwidth advertisement |

## 8. Security Considerations

1. **Stake-aligned validation**: every appchain's validator subset has
   stake at risk via slashing on P-Chain. There is no path where a
   compromised cloud node profits from misbehavior — slashing exceeds
   any rational reward (per LP-084 validator economics).
2. **Tenant isolation by construction**: cross-tenant leakage requires
   either equivocation by ≥1/3 of an appchain's validator subset
   (slashed) or a substrate bug (in-scope for audit).
3. **Resource accounting integrity**: counters are part of the receipt,
   covered by `execution_root`, certified by Quasar. A node cannot
   under-report or over-report consumption without producing an
   invalid execution root.
4. **Confidentiality**: F-Chain (FHE) and A-Chain (TEE) provide two
   independent confidentiality paths. Customers needing both can
   stack them.
5. **Snapshot replay**: a snapshot artifact is bound to its
   `QuasarRoundDescriptor`; replaying it into a chain with a different
   `pchain_validator_root` fails the cert verification at restore time.
6. **Bridge surface**: cross-cloud transfers (e.g., to centralized
   cloud) go through B-Chain (LP-134), which inherits all bridge
   security properties (LP-016, LP-017, LP-018). There is no privileged
   "cloud bridge" with elevated permissions.
7. **DoS resistance**: appchains are economically rate-limited by their
   own gas / fee curves; one appchain saturating its subset has zero
   effect on other appchains running on the same physical nodes
   (lane-level scheduling, LP-132 §wave-tick).
8. **Data sovereignty**: storage layer is the Quasar state trie itself
   (committed in `state_root`), not an external object store. No
   off-chain data plane, no external availability assumption.

## Reference

| Resource | Location |
|---|---|
| Quasar consensus | LP-020 |
| QuasarGPU adapter | LP-132 |
| Quasar app stack | LP-133 |
| Lux chain topology | LP-134 |
| GPU-native EVM | LP-009 |
| FHE / F-Chain | LP-013, LP-066 |
| Threshold MPC / M-Chain | LP-019, LP-076 |
| KMS | LP-062 |
| Z-Chain | LP-063 |
| TEE mesh / attestation | LP-065, LP-127 |
| AI chain | LP-130 |
| DEX engine precompile | LP-9010 |
| Hanzo Cloud (impl.) | `~/work/hanzo/cloud` |
| Lux Cloud (impl.) | `~/work/lux/cloud` |
| Cloud operator | `~/work/lux/operator` |
| Lux node | `~/work/lux/node` |

## Copyright

Copyright (C) 2025, Lux Partners Limited and Hanzo AI Inc. All rights reserved.

Licensed under the MIT License.
