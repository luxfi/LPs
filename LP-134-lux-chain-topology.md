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
  - lp-019 (Threshold MPC — defines M-Chain split)
  - lp-063 (Z-Chain — Groth16 over BLS12-381)
  - lp-066 (TFHE)
  - lp-073 (Pulsar / Pulsar threshold)
  - lp-076 (Universal threshold)
  - lp-110 (Quasar Unified Consensus)
  - lp-167 (Lux FHE Runtime — defines F-Chain)
  - lp-6332 (Teleport Bridge Architecture — T-Chain teleportvm)
  - lp-9110 (Teleport Protocol Standard)
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

**Headline change**: T-Chain (which previously hosted *all* MPC, FHE, and
cross-chain message routing) is **split** into:

- **M-Chain** — MPC ceremonies (CGGMP21, FROST, Pulsar-general) for
  bridge custody of external wallets
- **F-Chain** — FHE compute (TFHE bootstrap-key generation, encrypted EVM)
- **Z-Chain** — Groth16 over BLS12-381 rollups (rolls N×ML-DSA-65 sigs
  into one 192-byte proof per epoch)
- **Q-Chain** — Pulsar 2-round threshold ceremony for **consensus** signing
- **T-Chain** (legacy name retained for `teleportvm` only) — unified
  bridge + relay + oracle execution surface (LP-6332, LP-9110)

Two new chains are added:

- **A-Chain** — unified Attestation chain (every Lux chain emits and
  consumes attestations through it)
- **B-Chain** — native Bridge chain (omnichain routing,
  cross-ecosystem messages)

## The Nine Chains

| Chain | VM | Role | Mode | GPU service path | LP |
|---|---|---|---|---|---|
| **P-Chain** | **PVM** | Platform — staking, validators, epoch, slashing | Nova (linear) | precompile (read-only roots in `pchain_validator_root`) | LP-1100, LP-015 |
| **C-Chain** | **EVM** (cevm) | Contract — general smart contracts | Nova (linear) | `drain_exec` (EVM fiber VM, LP-009) | LP-009, LP-014 |
| **X-Chain** | **XVM** | UTXO — assets, swaps, native txs | Nova (linear) | precompile | LP-014 |
| **Q-Chain** | **QVM** | Quasar — **Pulsar** 2-round threshold ceremony for PQ consensus signing | Nova or Nebula | `drain_cert_lane` (Pulsar verifier) | LP-073, LP-076 |
| **Z-Chain** | **ZVM** | Zero-knowledge — **Groth16 over BLS12-381** rolling N×ML-DSA-65 sigs → one 192-byte proof | Nova | `drain_cert_lane` (Groth16 verifier) | LP-063 |
| **A-Chain** | **AIVM** (AI / Attestation VM) | Attestation — unified attestation chain (TEE, audit, identity, AI provenance) | Nova or Nebula | `drain_attest` | LP-065, Hanzo AI Chain |
| **B-Chain** | **BVM** | Bridge — native cross-ecosystem messaging | Nova (mostly) / Nebula (high-fanout) | `drain_bridge` | LP-016, LP-017 |
| **M-Chain** | **MVM** (ThresholdVM-MPC) | MPC ceremonies — bridge custody for external wallets (CGGMP21, FROST, Pulsar-general) | Nebula (DAG of partials) | `drain_cert_lane` (M-Chain verifier) | LP-019, LP-076 |
| **F-Chain** | **FVM** (ThresholdVM-FHE) | FHE — TFHE bootstrap-key generation, encrypted EVM, key-share ceremonies | Nebula (computation graph) | `drain_fhe` | LP-013, LP-066, LP-167 |

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
    BLS              = 0,   // classical fast path (network-wide, BLS12-381)
    Pulsar         = 1,   // Q-Chain Pulsar (Ring-LWE) 2-round PQ consensus threshold
    MLDSAGroth16     = 2,   // Z-Chain Groth16-over-BLS12-381 rollup of N×ML-DSA-65 sigs
    // LP-134 §A/B/M/F integration
    AChainAttest     = 3,   // A-Chain TEE / audit attestation
    BChainBridge     = 4,   // B-Chain bridge message commitment
    MChainCGGMP21    = 5,   // M-Chain CGGMP21 ECDSA-threshold share (bridge custody)
    MChainFROST      = 6,   // M-Chain FROST Schnorr-threshold share (bridge custody)
    MChainPulsarGen  = 7,   // M-Chain Pulsar-general PQ-threshold share (bridge custody)
    FChainTFHE       = 8,   // F-Chain TFHE compute attestation (encrypted EVM op)
    FChainBootstrap  = 9,   // F-Chain TFHE blind-rotate / bootstrap-key proof
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
    CertLane     = 10,    // BLS / Pulsar / MLDSAGroth16 / AChain / BChain / MChain / FChain
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

### Q-Chain (Quasar threshold — PQ consensus signing)

Q-Chain runs the **Pulsar 2-round threshold ceremony** for **PQ
consensus signing**. Pulsar is Lux's Ring-LWE / Module-LWE threshold
construction (Pulsar = Lux variant of the original Pulsar with DKG2
and the Pulsar-SHA3 hash suite — KMAC over cSHAKE256, see
`pulsar/hash/sp800_185.go`). Production parameters: M=8, N=7,
LogN=8 (ring degree 256), Q=0x1000000004A01 (48-bit NTT-friendly
prime), Dbar=48, Kappa=23 → classical 2^142 / quantum 2^130 security.

Q-Chain emits `qchain_ceremony_root` per epoch, consumed by Quasar
3.0's Pulsar/Ringtail cert lane (LP-020 §Pulsar, LP-073).

Note: Q-Chain runs *only* the **consensus-threshold** Pulsar ceremony.
General-purpose Pulsar (for app threshold signing on bridge custody)
lives on M-Chain (`MChainPulsarGen` lane).

### Z-Chain (zero-knowledge — Groth16 over BLS12-381)

Z-Chain rolls **N validator ML-DSA-65** signatures into **one 192-byte
Groth16 proof** per certificate (LP-020 §MLDSAGroth16, LP-063). The
proof system is **Groth16 over BLS12-381**; the R1CS encodes the
ML-DSA-65 verification circuit (~2^22.5 constraints per verification,
amortized to ~2^20 per validator at n=21 via shared-matrix
optimization — see `~/work/lux/proofs/quasar-cert-soundness.tex`
App. B). Other ZKP rollups (Halo2, Plonky2, etc.) plug in here as
additional verifying-key commitments under `zchain_vk_root`.

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

### M-Chain (MPC ceremonies — bridge custody for external wallets)

M-Chain hosts **all MPC ceremonies** used for bridge custody of keys
that hold funds on **external** chains (Bitcoin, Ethereum, Solana,
non-Lux EVMs). The validator quorum runs the protocol; the resulting
threshold signature authorizes the external-chain transaction.

| Ceremony | Curve / scheme | External wallet target | Cert lane | LP |
|---|---|---|---|---|
| **CGGMP21** | ECDSA threshold (secp256k1, secp256r1) | Bitcoin, Ethereum, EVMs, Cosmos | `MChainCGGMP21` | LP-019, LP-076 |
| **FROST** | Schnorr threshold (Ed25519, Ristretto255) | Solana, Polkadot, Cosmos (Schnorr variants), Bitcoin Taproot | `MChainFROST` | LP-019, LP-076 |
| **Pulsar-general** | Ring-LWE threshold (PQ-safe) | Future PQ-curve external chains, Lux-internal PQ custody | `MChainPulsarGen` | LP-019, LP-073, LP-076 |

Each ceremony runs as a **Nebula round** (DAG of partial signatures
→ frontier → committed cert). The lane verifier in `drain_cert_lane`
dispatches by `cert_lane` to the protocol-specific check.

`mchain_ceremony_root` commits the active ceremony state per epoch.

**Distinction from Q-Chain**: Q-Chain runs the *consensus* threshold
(Pulsar 2-round, signs Lux blocks). M-Chain runs *application*
threshold ceremonies (signs external-chain txs for bridge custody).
Same cryptographic family (Pulsar / CGGMP21 / FROST), different
purpose, different chain.

### F-Chain (FHE — TFHE bootstrap-key generation, encrypted EVM)

F-Chain hosts **TFHE compute** and the **TFHE bootstrap-key
generation** ceremony. This is the encrypted-EVM substrate.

| Use case | Cert lane / service |
|---|---|
| Encrypted EVM ops over TFHE ciphertexts | `FheCompute` service + `FChainTFHE` lane |
| TFHE programmable bootstrap (blind-rotate) | `FChainBootstrap` lane |
| TFHE bootstrap-key generation ceremony | M-Chain DKG produces shares → F-Chain assembles bootstrap key into key arena |
| Confidential ERC-20 (LP-067) | C-Chain calls F-Chain precompile |
| Private teleport (LP-068) | F-Chain → A-Chain attestation chain |

`fchain_fhe_root` commits TFHE evaluation-key state per epoch.

See LP-167 (Lux FHE Runtime) for the full F-Chain runtime
specification: ciphertext format, bootstrap-key lifecycle, encrypted
EVM opcode set, gas accounting under TFHE.

## Deprecation notice — T-Chain split (LP-5013, LP-7330 superseded)

LP-5013 ("T-Chain MPC Custody and Swap Signature Layer") and
LP-7330 ("T-Chain ThresholdVM Specification") are **superseded** as
unified MPC + FHE + relay chain. LP-134 splits T-Chain's prior
responsibilities across **four** chains:

- **M-Chain** — MPC ceremonies for bridge custody (LP-019, LP-076)
- **F-Chain** — FHE compute and TFHE bootstrap-key generation (LP-013, LP-066, LP-167)
- **Z-Chain** — Groth16 over BLS12-381 (LP-063)
- **Q-Chain** — Pulsar 2-round threshold for **consensus** signing (LP-073, LP-076)

The "T-Chain" name is **retained only for `teleportvm`** — the
unified bridge + relay + oracle execution surface (LP-6332 Teleport
Bridge Architecture, LP-9110 Teleport Protocol Standard, LP-138 Relay
VM). T-Chain in this narrower sense is a **C-Chain-style execution
chain** that provides cross-chain message dispatch on top of the
M-Chain custody primitive; it does **not** host MPC, FHE, or PQ
ceremonies.

Migration path:
- T-Chain's MPC ceremonies move to M-Chain unchanged (same
  protocol semantics; new chain ID).
- T-Chain's FHE pipeline moves to F-Chain.
- T-Chain's ML-DSA Groth16 rollup moves to Z-Chain.
- T-Chain's consensus-threshold Pulsar ceremony moves to Q-Chain.
- T-Chain's teleport / bridge-relay / oracle-aggregation surface
  remains as `teleportvm` and **keeps the T-Chain name** for that
  scope only.
- Cross-chain messages that named the legacy T-Chain ceremony layers
  are accepted by M-/F-/Z-/Q-Chain during a one-epoch grace window,
  then deprecated.

The QuasarGPU `cert_lane` dispatcher recognizes the legacy `TChain*`
enum values during the grace period and routes them to the
corresponding `MChain*` / `FChain*` / `Z-` / `Q-` verifier.

## VM identifiers (canonical)

| Chain | VM name | URI | Description |
|---|---|---|---|
| P-Chain | **PVM** | `lux:pvm`       | Platform VM (validator/stake state) |
| C-Chain | **EVM** | `lux:evm`       | Contract VM (cevm — fork of evmone, GPU fiber VM per LP-009) |
| X-Chain | **XVM** | `lux:xvm`       | UTXO VM (assets, swaps, native txs) |
| Q-Chain | **QVM** | `lux:qvm`       | Quasar threshold-key VM (Pulsar DKG ceremony) |
| Z-Chain | **ZVM** | `lux:zvm`       | Zero-knowledge VM (Groth16 rollups + ZKP registry) |
| A-Chain | **AIVM** | `lux:aivm`     | AI / Attestation VM (TEE quotes, audit, identity, AI provenance, model registry) |
| B-Chain | **BVM** | `lux:bvm`       | Bridge VM (cross-ecosystem messaging) |
| M-Chain | **MVM** | `lux:mvm`       | MPC VM (CGGMP21, FROST, Ringtail-general ceremonies) |
| F-Chain | **FVM** | `lux:fvm`       | FHE VM (TFHE compute, encrypted EVM, confidential ERC-20) |

**Naming notes (canonical, post-2025-12-15)**:

- `EVM` is the standard Ethereum Virtual Machine name; C-Chain hosts an
  EVM, no rename needed. Lux's GPU-native fork is `cevm` (LP-009), but
  the public VM identifier stays `EVM`.

- `XVM` (X-Chain VM) is the Lux UTXO VM. **Lux X-Chain runs XVM.**
  Historical UTXO-VM prior art is acknowledged in academic citations
  in LP-110 §References (Team Rocket et al. 2018 metastable consensus
  family) but the operational identifier in Lux is **XVM**. Any
  reference to a different name in pre-2025 Lux docs that meant the
  X-Chain UTXO VM has been renamed to **XVM**.

- `AIVM` (A-Chain VM) is the Lux Attestation VM. The "AI" prefix is
  intentional — A-Chain hosts AI provenance, model registries, agent
  identity, and TEE attestations. The Hanzo "AI Chain" brand surface
  is the same underlying AIVM with AI-native UX (see LP-130 / Hanzo
  AI Chain whitepaper).

- Threshold-VM family (M-Chain MVM, F-Chain FVM) shares the
  `~/work/lux/chains/thresholdvm` Go library substrate (LP-019,
  LP-076) but stays operationally distinct — orthogonal validators,
  ceremony cadence, gas economics. **No shared MPC + FHE + ZK + PQ
  T-Chain.** ("T-Chain" is retained narrowly for `teleportvm` only;
  see Deprecation notice above.)

**Forbidden operational names** (must NOT appear as live identifiers
in any current Lux LP, paper, or code):

- Legacy UTXO-VM short name (Lux uses **XVM** instead)
- `Snowball`, `Snowflake`, `Snowman` (linear-chain consensus family
  prior art) — replaced by **Quasar / Photon / Wave / Focus / Nova /
  Nebula / Prism / Horizon / Flare / Ray / Field** per LP-020 §2 and
  LP-110

These names appear **only** in academic-citation sections (e.g.
"Prior art", "References") qualified as historical prior art per
LP-110 §References [4]. Operational identifiers, code symbols, chain
aliases, and configuration keys MUST use the Lux taxonomy.

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
| Quasar consensus (unified) | LP-110, LP-020 |
| QuasarGPU adapter | LP-132 |
| QuasarSTM | LP-010 |
| Quasar app stack | LP-133 |
| GPU-native EVM | LP-009 |
| FHE on GPU | LP-013 |
| TFHE | LP-066 |
| Lux FHE Runtime (F-Chain) | LP-167 |
| Threshold MPC (M-Chain) | LP-019, LP-076 |
| Pulsar / Pulsar PQ threshold | LP-073 |
| Z-Chain (Groth16/BLS12-381) | LP-063 |
| Bridge LPs | LP-003, LP-016, LP-017, LP-018 |
| Teleport / T-Chain teleportvm | LP-6332, LP-9110, LP-138 |
| Consensus knowledge base | `~/work/lux/consensus/LLM.md` |
| Lux node | `~/work/lux/node` |

## Copyright

Copyright (C) 2025, Lux Partners Limited. All rights reserved.
