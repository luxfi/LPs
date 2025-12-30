---
lp: 134
title: Lux Chain Topology — P / C / X / Q / Z / A / B / M / F
tags: [lux, chains, p-chain, c-chain, x-chain, q-chain, z-chain, a-chain, b-chain, m-chain, f-chain, taxonomy, gpu]
description: Canonical taxonomy of the nine Lux chains and how each plugs into the QuasarGPU substrate
author: Lux Core Team (@luxfi)
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
  - lp-009 (GPU-Native EVM)
  - lp-013 (FHE on GPU)
  - lp-019 (Threshold MPC)
  - lp-063 (Z-Chain)
  - lp-066 (TFHE)
deprecates:
  - lp-5013 (T-Chain MPC Custody) — superseded by M-Chain + F-Chain split
---

# LP-134: Lux Chain Topology

## Abstract

This LP defines the **canonical set of Lux chains**. Earlier drafts
mixed application chains, ceremony chains, and aggregation chains under
informal labels; this LP fixes the taxonomy at **nine** chains and
specifies how each chain plugs into the QuasarGPU substrate (LP-132)
and the Quasar 3.0 cert pipeline (LP-020).

**Headline change**: T-Chain (which previously hosted *all* MPC and FHE
ceremonies) is **split** into:

- **M-Chain** — MPC ceremonies (CGGMP21, FROST, Ringtail-general)
- **F-Chain** — FHE compute (TFHE, key-share ceremonies, encrypted EVM)

Two new chains are added:

- **A-Chain** — unified Attestation chain (every Lux chain emits and
  consumes attestations through it)
- **B-Chain** — native Bridge chain (omnichain routing,
  cross-ecosystem messages)

## The Nine Chains

| Chain | Role | Maps to luxfi/consensus mode | GPU service path | LP |
|---|---|---|---|---|
| **P** | Platform — staking, validators, epoch, slashing | Nova (linear) | precompile (read-only roots in `pchain_validator_root`) | LP-1100, LP-015 |
| **C** | Contract / EVM — general smart contracts | Nova (linear) | `drain_exec` (EVM fiber VM, LP-009) | LP-009, LP-014 |
| **X** | UTXO — assets, swaps, native txs | Nova (linear) | precompile | classic Lux UTXO |
| **Q** | Quasar — Ringtail 2-round threshold ceremony for consensus | Nova or Nebula | `drain_cert_lane` (Ringtail verifier) | LP-073, LP-076 |
| **Z** | Zero-knowledge — Groth16 rollups (incl. ML-DSA-65 → 192-byte proof) | Nova | `drain_cert_lane` (Groth16 verifier) | LP-063 |
| **A** | Attestation — unified attestation chain (TEE, audit, identity) | Nova or Nebula | `drain_attest` (NEW service) | this LP + LP-065 |
| **B** | Bridge — native cross-ecosystem messaging | Nova (mostly) / Nebula (high-fanout) | `drain_bridge` (NEW service) | this LP + LP-016, LP-017 |
| **M** | MPC — CGGMP21, FROST, Ringtail-general ceremonies | Nebula (DAG of partials) | `drain_cert_lane` (M-Chain verifier) | LP-019, LP-076 |
| **F** | FHE — TFHE compute, key-share ceremonies, encrypted EVM | Nebula (computation graph) | `drain_fhe` (NEW service) | LP-013, LP-066 |

## Why nine?

Each chain fills exactly one of these roles:

| Role | Chain |
|---|---|
| validator/stake authority | **P** |
| general execution | **C** |
| native asset ledger | **X** |
| consensus-threshold-key authority | **Q** |
| proof-rollup authority | **Z** |
| attestation/audit authority | **A** |
| bridge/messaging authority | **B** |
| MPC ceremony authority | **M** |
| FHE compute authority | **F** |

No chain owns two of these roles. No role has two owning chains.
**Composability comes from the cert pipeline, not from chain merging.**

## Cert Pipeline (Quasar 3.0 §QuasarRoundDescriptor — extended)

Every QuasarRoundDescriptor binds the upstream-chain commitments at
round time:

```cpp
struct QuasarRoundDescriptor {
    // ... existing fields ...
    QuasarMode mode;
    uint8_t pchain_validator_root[32];       // P-Chain
    uint8_t qchain_ceremony_root[32];        // Q-Chain
    uint8_t zchain_vk_root[32];              // Z-Chain
    uint8_t achain_attestation_root[32];     // A-Chain (LP-134 v3.1)
    uint8_t bchain_bridge_root[32];          // B-Chain (LP-134 v3.1)
    uint8_t mchain_ceremony_root[32];        // M-Chain (LP-134 v3.1)
    uint8_t fchain_fhe_root[32];             // F-Chain (LP-134 v3.1)
    uint8_t certificate_subject[32];         // host-precomputed digest
    // ...
};
```

`certificate_subject` now binds **all seven** roots (P, Q, Z, A, B, M, F)
plus parent block / state / execution roots. Cross-chain replay across
**any** chain pair becomes structurally impossible — a cert artifact
for one round can't satisfy another even if they share a block hash,
because the upstream root sets differ by construction.

## QuasarCertLane registry (extended)

LP-020 §3.0 defined three lanes. LP-134 opens the registry for the new
chains:

```cpp
enum class QuasarCertLane : uint8_t {
    // LP-020 §3.0
    BLS              = 0,   // classical fast path (network-wide)
    Ringtail         = 1,   // Q-Chain Ring-LWE 2-round threshold
    MLDSAGroth16     = 2,   // Z-Chain Groth16 rollup of N ML-DSA-65 sigs
    // LP-134 §A/B/M/F integration
    AChainAttest     = 3,   // A-Chain TEE / audit attestation
    BChainBridge     = 4,   // B-Chain bridge message commitment
    MChainCGGMP21    = 5,   // M-Chain CGGMP21 share
    MChainFROST      = 6,   // M-Chain FROST share
    MChainRingtailGen= 7,   // M-Chain Ringtail-general share
    FChainTFHE       = 8,   // F-Chain TFHE compute attestation
    FChainBootstrap  = 9,   // F-Chain blind-rotate / bootstrap proof
    // …open-ended; new primitives append at end
};
```

Adding a new lane requires:
1. Append the enum value (never reorder).
2. Implement a verifier in QuasarGPU (LP-132 §drain_cert_lane).
3. Register a chain root in `QuasarRoundDescriptor`.

The wire ABI stays stable forever (`(artifact_offset, artifact_len)`
indirection).

## QuasarGPU service map (LP-132 extended)

The wave-tick scheduler grows from 12 to **16 services** to host the
A/B/M/F integrations:

```cpp
enum class ServiceId : uint32_t {
    // LP-132 §1 — execution
    Ingress      = 0,
    Decode       = 1,
    Crypto       = 2,
    DagReady     = 3,
    Exec         = 4,
    Validate     = 5,
    Repair       = 6,
    Commit       = 7,
    StateRequest = 8,
    StateResp    = 9,
    CertLane     = 10,    // BLS / Ringtail / MLDSAGroth16 / AChain / BChain / MChain / FChain
    CertOut      = 11,
    // LP-134 §service additions
    FheCompute   = 12,    // F-Chain TFHE compute pipeline (drain_fhe)
    AttestEvent  = 13,    // A-Chain attestation ingress (drain_attest)
    BridgeMsg    = 14,    // B-Chain bridge message ingress (drain_bridge)
    MpcRound     = 15,    // M-Chain ceremony round ingress (drain_mpc)
    Count        = 16
};
```

Per-service summary:

| Service | Drain function | Backed by |
|---|---|---|
| `FheCompute` | `drain_fhe` | TFHE kernels (LP-013), runs encrypted EVM ops in lane-local arenas |
| `AttestEvent` | `drain_attest` | TEE quote + audit-event verifier; emits to A-Chain root |
| `BridgeMsg` | `drain_bridge` | bridge-payload validation + lane mapping for cross-chain settlement |
| `MpcRound` | `drain_mpc` | MPC ceremony round drain (per-protocol verifier dispatched by `cert_lane`) |

All four are executed in the same wave-tick kernel as EVM and STM —
**one GPU process, all primitives in lockstep**.

## Per-chain detail

### P-Chain (Platform)

Unchanged. Sources stake / validator-set roots consumed by every other
chain via `pchain_validator_root` in the descriptor. Read-only from the
cert pipeline's perspective.

### C-Chain (Contract / EVM)

Unchanged. Executes via `drain_exec` (LP-009 fiber VM). Consumes A-/B-/M-/
F-Chain roots through precompiles (e.g., a contract calling
`fhe_decrypt(...)` consults `fchain_fhe_root`).

### X-Chain (UTXO)

Unchanged. Native asset ledger; precompile-style settlement. Listed
here for completeness.

### Q-Chain (Quasar threshold)

Q-Chain runs the **Ringtail DKG ceremony** for consensus quorum. It
emits `qchain_ceremony_root` per epoch, consumed by Quasar 3.0's
Ringtail cert lane (LP-020 §Ringtail).

Note: Q-Chain only runs the *consensus-threshold* Ringtail ceremony.
General-purpose Ringtail (for app threshold signing) lives on M-Chain.

### Z-Chain (zero-knowledge)

Z-Chain rolls N validator ML-DSA-65 sigs into one 192-byte Groth16
proof per cert (LP-020 §MLDSAGroth16, LP-063). Other ZKP rollups
(Halo2, Plonky2, etc.) plug in here as additional verifying-key
commitments under `zchain_vk_root`.

### A-Chain (Attestation, NEW)

A-Chain is the **unified attestation chain**:

| Use case | Attestation type |
|---|---|
| TEE-protected workload | SGX/SEV-SNP/TDX quote |
| Compliance audit | LP-002 compliance hooks → `audit_event` records |
| Identity proof | DID resolution proof (LP-060) |
| Validator availability | per-epoch availability attestations |
| Hardware fingerprint | TPM EK/AIK quotes for validator keys |

A-Chain commits an `attestation_root` per round; QuasarGPU's
`drain_attest` service verifies inbound attestation events and updates
the chain's lane state.

Every Lux chain that needs attestation (TEE workloads on F-Chain,
validator hardware proofs on P-Chain, audit hooks in C-Chain
contracts) emits to A-Chain and consumes its root.

### B-Chain (Bridge, NEW)

B-Chain is the **native bridge chain**. Replaces ad-hoc per-chain
bridge logic with a single bridge authority.

Wire formats:

```cpp
struct BridgeMessage {
    uint64_t src_chain_id;      // any of: C, X, A, M, F, or external
    uint64_t dst_chain_id;
    uint8_t  payload_hash[32];
    uint8_t  proof[];           // chain-specific membership proof
};
```

`drain_bridge` validates the proof against the source chain's root
(read from `QuasarRoundDescriptor`), verifies destination eligibility,
and emits a CertLane artifact (`AChainAttest` lane confirms the
crossing).

Existing bridge LPs (LP-003, LP-016, LP-017, LP-018) remain;
LP-134 §B-Chain provides the unified routing surface.

### M-Chain (MPC, NEW — split from T-Chain)

M-Chain hosts **all MPC ceremonies**:

| Ceremony | Cert lane | LP |
|---|---|---|
| CGGMP21 (ECDSA threshold) | `MChainCGGMP21` | LP-076 |
| FROST (Schnorr threshold) | `MChainFROST` | LP-076 |
| Ringtail-general (PQ threshold) | `MChainRingtailGen` | LP-073, LP-076 |

Each ceremony runs as a Nebula round (DAG of partial signatures →
frontier → committed cert). The lane verifier in `drain_cert_lane`
dispatches by `cert_lane` to the protocol-specific check.

`mchain_ceremony_root` commits the active ceremony state per epoch.

### F-Chain (FHE, NEW — split from T-Chain)

F-Chain hosts **FHE compute**:

| Use case | Cert lane / service |
|---|---|
| Encrypted EVM ops over TFHE ciphertexts | `FheCompute` service + `FChainTFHE` lane |
| Blind-rotate / programmable bootstrap | `FChainBootstrap` lane |
| TFHE key-share ceremonies | M-Chain ceremony into F-Chain key arena |
| Confidential ERC-20 (LP-067) | C-Chain calls F-Chain precompile |
| Private teleport (LP-068) | F-Chain → A-Chain attestation chain |

`fchain_fhe_root` commits TFHE evaluation-key state per epoch.

## Deprecation notice — T-Chain

LP-5013 ("T-Chain MPC Custody and Swap Signature Layer") is
**deprecated**. T-Chain previously claimed authority over both MPC
ceremonies and FHE compute. LP-134 splits these into:

- **M-Chain** for ceremonies (LP-019, LP-076)
- **F-Chain** for FHE compute (LP-013, LP-066)

Migration path:
- T-Chain's MPC ceremonies move to M-Chain unchanged (same
  protocol semantics; new chain ID).
- T-Chain's FHE pipeline moves to F-Chain.
- Cross-chain messages that named T-Chain are accepted by both M-Chain
  and F-Chain during a one-epoch grace window, then deprecated.

The QuasarGPU `cert_lane` dispatcher recognizes the legacy `TChain*`
enum values during the grace period and routes them to the
corresponding `MChain*` / `FChain*` verifier.

## VM identifiers

```
P  = lux:platform
C  = lux:contract
X  = lux:utxo
Q  = lux:quasar
Z  = lux:zk
A  = lux:attestation
B  = lux:bridge
M  = lux:mpc
F  = lux:fhe
```

## Implementation plan

| Version | Scope |
|---|---|
| **v0.50** | LP-134 chain topology lands; descriptor extended with `achain_attestation_root`, `bchain_bridge_root`, `mchain_ceremony_root`, `fchain_fhe_root` |
| **v0.51** | `drain_attest` (A-Chain) service in QuasarGPU |
| **v0.52** | `drain_bridge` (B-Chain) service |
| **v0.53** | `drain_mpc` (M-Chain) service replacing T-Chain MPC paths |
| **v0.54** | `drain_fhe` (F-Chain) service — TFHE kernels integrated as lane-local FheCompute drains |
| **v0.55** | Encrypted EVM (LP-067) using F-Chain `drain_fhe` lane |

## Reference

| Resource | Location |
|---|---|
| Quasar consensus | LP-020 |
| QuasarGPU adapter | LP-132 |
| QuasarSTM | LP-010 |
| Quasar app stack | LP-133 |
| GPU-native EVM | LP-009 |
| FHE on GPU | LP-013 |
| TFHE | LP-066 |
| Threshold MPC | LP-019, LP-076 |
| Z-Chain | LP-063 |
| Bridge LPs | LP-003, LP-016, LP-017, LP-018 |
| Lux node | `~/work/lux/node` |

## Copyright

Copyright (C) 2025, Lux Partners Limited. All rights reserved.
