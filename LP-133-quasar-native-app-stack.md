---
lp: 133
title: Quasar-Native App Stack — Gateway Pinning, Base Appchains, MPC/KMS Cert Lanes
tags: [quasar, gateway, base, appchain, mpc, kms, lane-affinity, sticky-routing, hanzo, m-chain, f-chain]
description: Hanzo Gateway lane-affinity routing; native Base appchains on Quasar consensus; MPC and KMS as Quasar cert lanes
author: Lux Core Team (@luxfi), Hanzo AI (@hanzoai)
status: Final
type: Standards Track
category: Architecture
created: 2025-12-15
updated: 2025-12-15
requires:
  - lp-010 (QuasarSTM)
  - lp-020 (Quasar Consensus 3.0)
  - lp-132 (QuasarGPU Execution Adapter)
references:
  - lp-019 (Threshold MPC)
  - lp-076 (Universal Threshold)
---

# LP-133: Quasar-Native App Stack

## Abstract

This LP extends the Quasar architecture across three Hanzo
production surfaces:

1. **Hanzo Gateway** — lane-affinity sticky routing pins users to the
   validator subset that owns their lanes, eliminating cross-node
   round trips on the read hot path.
2. **Hanzo Base** — PocketBase-derived application backends become
   native Quasar appchains: each Base instance is a Quasar round
   preset with its own `chain_id`, validator subset, and per-tenant
   lanes; realtime subscriptions tail Quasar's `CertOut` ring.
3. **MPC + KMS** — the Hanzo MPC engine (CGGMP21, FROST, Ringtail
   general) and Hanzo KMS plug in as additional `QuasarCertLane`
   variants, sharing the same wave-tick scheduler, GPU verifier, and
   replay-proof subject binding (LP-020 §3.0).

The unifying observation: **every cryptographic primitive gets a
`cert_lane` slot**. Adding a new primitive (Falcon, SLH-DSA, novel
threshold scheme) requires one enum value plus one verifier function.
The wire ABI never breaks (LP-020 §QuasarCertIngress (offset, len)
indirection).

## 1. Gateway lane-affinity pinning

### Routing function

Hanzo Gateway's existing sticky-session routing extends naturally:

```
gpu_id        = H(user_lane_id) mod num_gpus
gateway_route = gpu_owner_of(gpu_id)
```

`user_lane_id` is the dominant lane key for that user — typically:

```
user_lane_id = H("acct", user_id)              // balance + nonce dominates
user_lane_id = H("trader", user_id)            // for DEX users
user_lane_id = H("collection", coll_id, owner) // for Base apps
```

The gateway maintains a route table keyed by `lane_id` and consults it
on every request. Reads from owned lanes are local; writes that span
lanes degrade to distributed-tx (LP-010 §4.0 fragment roots).

### Properties

- **Consistency**: same `user_lane_id` always maps to the same node
  within an epoch.
- **Smooth rotation**: epoch boundary reshuffles ownership per
  `pchain_validator_root`; gateway picks up the new map atomically.
- **Bounded reshuffle**: adding/removing a node only relocates `1/n`
  of users (consistent-hash property).
- **Cross-lane writes**: gateway issues distributed-tx via the
  CertLane mechanism — fragment roots aggregate into one cert.

### Where lane-affinity belongs

In the **gateway**, not in Quasar core. Quasar exposes
`lane_id → gpu_id` as a deterministic function; gateway / Base / MPC /
KMS all consume it. Mock layout:

```
~/work/hanzo/gateway/
  src/lane_affinity.rs       // route table + epoch-rotation hook
  src/quasar_client.rs       // calls into LP-132 QuasarGPUEngine
```

## 2. Native Base appchains on Quasar

Hanzo Base (`~/work/hanzo/base`) is already lane-shaped (per collection,
per record). Wiring it onto Quasar:

| Base concept | Quasar mapping |
|---|---|
| Collection | `domain` component of lane key |
| Record id | `H("base", chain_id, collection, record_id)` lane |
| Read query | local read from owned lane (gateway routes to owner) |
| Write / mutation | Quasar tx executed in the QuasarGPU adapter |
| Schema migration | admin-precompile tx (writes a `schema` lane) |
| Realtime subscription | gateway tails `CertOut` for the lane keys the user is subscribed to |
| Auth (Hanzo IAM) | precompile reads tenant identity root from `QuasarRoundDescriptor.pchain_validator_root` |

### App chain as a Quasar round preset

Each Base instance is a Quasar **chain preset**:

```cpp
struct BaseAppchainConfig {
    uint64_t chain_id;                // unique per-tenant
    Hash     validator_subset_root;   // P-Chain commitment to its validators
    Hash     qchain_ceremony_root;    // Q-Chain Ringtail DKG root
    Hash     zchain_vk_root;          // Z-Chain Groth16 VK root
    QuasarMode mode;                  // Nova=0 (typical) / Nebula=1 (high-fanout)
    uint64_t  block_time_ms;
    uint64_t  gas_limit;
};
```

Cross-chain messages go through the same per-lane cert infrastructure
already in LP-020 §3.0. The appchain inherits Quasar finality + GPU
execution for free.

### Three-layer Hanzo Base stack

```
┌──────────────────────────────────────────────────┐
│  Hanzo Base                                      │
│   collections, queries, realtime subscriptions   │
│   (PocketBase-derived ergonomics, IAM-native)    │
├──────────────────────────────────────────────────┤
│  QuasarGPU adapter (LP-132)                      │
│   exec + Block-STM + roots                       │
├──────────────────────────────────────────────────┤
│  Quasar consensus 3.0 (LP-020)                   │
│   ordering + cert lanes (BLS / RT / MLDSA-G16)   │
└──────────────────────────────────────────────────┘
```

### Realtime subscriptions

Base's existing realtime subscription system maps to: tail `CertOut`
for lanes the user is subscribed to, push to the user's WebSocket /
SSE connection. The gateway already owns the lane → user mapping (sticky
routing), so the fanout is local.

```
client.subscribe("collection/users", filter)
  ↓ gateway pins user
gateway.subscribe(lane = H("collection", chain, "users"))
  ↓ tails QuasarRoundResult / CertOut for that lane
client receives lane events as they finalize
```

The user gets sub-100 ms latency on local reads and **strong Quasar
finality** on writes — the regulated-DEX-tier audit guarantees Base
already needed for compliance use cases.

## 3. MPC + KMS as Quasar cert lanes

### MPC (Hanzo MPC engine, M-Chain in Lux taxonomy — LP-134)

The Hanzo MPC engine runs CGGMP21, FROST, Ringtail-general, TFHE
ceremonies. Each ceremony round naturally maps to a Quasar round:

| MPC concept | Quasar mapping |
|---|---|
| Ceremony participants | validator subset (per `pchain_validator_root`) |
| Ceremony round | Quasar wave tick |
| Partial signature share | `QuasarCertIngress` artifact, `cert_lane = MPCShare` (new lane variant) |
| Aggregate output | `QuasarCert` emitted on `CertOut` |
| Round graph (interactive ceremonies) | Nebula DAG mode |

Each ceremony type registers its verifier as a new `QuasarCertLane`
variant (the enum is open-ended: BLS=0, Ringtail=1, MLDSAGroth16=2,
MPCShare=3, FROSTShare=4, …). The verifier reads the artifact via
`(artifact_offset, artifact_len)` and runs the ceremony-specific check.

Pattern:

```cpp
enum class QuasarCertLane : uint8_t {
    BLS              = 0,
    Ringtail         = 1,
    MLDSAGroth16     = 2,
    CGGMP21Share     = 3,    // (added by LP-133)
    FROSTShare       = 4,    // (added by LP-133)
    RingtailGeneral  = 5,    // (added by LP-133)
    TFHEKeyShare     = 6,    // (added by LP-133)
};
```

LP-019 (Threshold MPC) and LP-076 (Universal Threshold) define the
ceremony semantics; LP-133 adds the GPU lane verifier wiring.

### KMS (Hanzo KMS)

Hanzo KMS operations — key gen, rotate, derive, sign — become Quasar
transactions executed via the QuasarGPU adapter:

| KMS operation | Quasar transaction shape |
|---|---|
| `kms_keygen` | tx that mints a key into a tenant-scoped lane |
| `kms_rotate` | tx that bumps version on the key lane |
| `kms_derive` | read-only tx (no MVCC version bump) |
| `kms_sign` | tx that calls a precompile + emits a CertLane artifact |
| `kms_revoke` | tx that flips a status bit on the key lane |

Key material lives in lanes scoped by tenant:

```
key_lane = H("kms", tenant_id, key_id)
```

Access control runs as a precompile that reads the IAM identity root
from `QuasarRoundDescriptor.pchain_validator_root`. The KMS gets:

- **Quasar finality** on every key state change (no race conditions)
- **Audit root** binding key history to the chain (LP-132 §audit_root,
  forthcoming v0.42)
- **GPU-batched signature verification** through `drain_cert_lane`
- **PQ safety** via the Quasar triple-cert when KMS sign requests
  cross-validate against post-quantum lanes

## Unified API surface

All three layers (Gateway / Base / MPC+KMS) consume one Quasar API:

```cpp
namespace quasar::gpu {

// LP-132 — execution
class QuasarGPUEngine { ... };

// LP-133 — lane affinity (gateway)
struct LaneRoute {
    Hash     lane_id;
    uint32_t gpu_id;
    NodeId   owner_node;
};
LaneRoute lookup_lane_route(Hash lane_id, Hash pchain_validator_root);

// LP-133 — cert lane registration (MPC, KMS, custom primitives)
using LaneVerifier = bool (*)(const QuasarCertIngress&, const uint8_t* artifact);
void register_cert_lane(QuasarCertLane lane, LaneVerifier verifier);

}  // namespace quasar::gpu
```

## Performance characteristics

| Surface | Latency target | Throughput target |
|---|---|---|
| Gateway lane-affinity read | < 10 ms (local) | bounded by net I/O |
| Base mutation | < 50 ms commit, < 1.1 s strong finality | LP-132 §Tier 2 (100 M/s) |
| Base realtime subscription | < 100 ms fanout | LP-132 §Tier 1 (1 B events/s aggregate) |
| MPC ceremony round | < 500 ms (per round) | per-ceremony, per LP-019 |
| KMS sign | < 50 ms commit | LP-132 §Tier 3 (1–10 M/s) |

## Implementation plan

| Version | Scope |
|---|---|
| **v0.50** | Gateway lane-affinity routing (`~/work/hanzo/gateway`) |
| **v0.51** | Base → Quasar adapter (`~/work/hanzo/base/quasar/`) |
| **v0.52** | MPC cert-lane verifiers (CGGMP21, FROST, Ringtail-general) |
| **v0.53** | KMS as Quasar precompile + key-material lanes |
| **v0.54** | TFHE key-share lane (lattice ceremony output) |
| **v0.55** | Cross-chain message routing via per-lane cert artifacts |

## Reference

| Resource | Location |
|---|---|
| Hanzo Gateway | `github.com/hanzoai/gateway` |
| Hanzo Base | `github.com/hanzoai/base` |
| Hanzo MPC | `github.com/hanzoai/mpc` |
| Hanzo KMS | `github.com/hanzoai/kms` |
| Hanzo IAM | `github.com/hanzoai/iam` |
| QuasarGPU | LP-132, `cevm/lib/consensus/quasar/gpu/` |
| Quasar consensus | LP-020, `luxfi/consensus/protocol/quasar/` |
| QuasarSTM | LP-010 |
| Threshold MPC | LP-019, LP-076 |

## Copyright

Copyright (C) 2025, Lux Partners Limited and Hanzo AI Inc. All rights reserved.
