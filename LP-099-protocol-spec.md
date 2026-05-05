---
lp: 099
title: Auditor-Ready Protocol Specification
tags: [protocol, specification, audit, formal, documentation]
description: Complete auditor-ready protocol specification document for Lux Network
author: Lux Core Team (@luxfi)
status: Final
type: Informational
category: Infrastructure
created: 2026-01-01
updated: 2026-05-05
references:
  - lp-004 (Formal Verification)
  - lp-019 (Threshold MPC — M-Chain)
  - lp-020 (Quasar Triple Consensus)
  - lp-063 (Z-Chain — Groth16 over BLS12-381)
  - lp-073 (Pulsar / Ringtail PQ threshold)
  - lp-076 (Universal threshold — M-Chain ceremonies)
  - lp-083 (Token Economics)
  - lp-110 (Quasar Unified Consensus)
  - lp-134 (Chain Topology)
  - lp-167 (Lux FHE Runtime — F-Chain)
  - lp-6332 (Teleport Bridge Architecture — T-Chain teleportvm)
---

# LP-099: Auditor-Ready Protocol Specification

## Abstract

Defines the auditor-ready protocol specification for Lux Network. This
document serves as the index and requirements for a complete,
auditable protocol description suitable for security auditors, formal
verification teams, and regulatory review. Each protocol component
has a corresponding LP with formal specification.

## Specification

### Document Structure

The protocol specification consists of the following sections, each
referencing the canonical LP. The Lux consensus family is **Quasar**
(unified) with sub-protocols **Photon / Wave / Focus / Prism /
Horizon / Flare / Ray / Field** and modes **Nova** (linear) /
**Nebula** (DAG). Linear-chain consensus prior art (the metastable
Snow* family, Team Rocket et al. 2018) is acknowledged in academic
citations in LP-110 §References; the operational identifiers in Lux
are the Quasar names below.

| Section | LP | Status |
|---------|-----|--------|
| Consensus: Quasar unified family (Photon/Wave/Focus/Prism/Horizon/Flare; Nova/Nebula) | LP-020, LP-110, LP-134 | Final |
| Consensus: Block-STM parallel execution (QuasarSTM) | LP-010 | Final |
| Networking: ZAP wire protocol, Warp messaging | LP-022, LP-118, LP-6022 | Final |
| Execution: EVM, cevm GPU acceleration | LP-009, LP-098 | Final |
| Cryptography: PQ signatures, threshold MPC | LP-070-078 | Final |
| Privacy: Z-Chain (Groth16), shielded pools, FHE (F-Chain) | LP-063-068, LP-167 | Final |
| Identity: DID, IAM, KMS | LP-060-062 | Final |
| Economics: tokenomics, fees, governance | LP-080-089 | Final |
| Tokens: WLUX, bridge, staking, AI | LP-090-094 | Final |
| Infrastructure: safe, AA, multicall | LP-095-097 | Final |
| Securities: digital securities, compliance | LP-001-003, LP-088 | Final |
| Bridge: omnichain router, native programs, T-Chain teleportvm | LP-016-018, LP-6332, LP-9110 | Final |
| Validator: key management, rewards | LP-015, LP-082-084 | Final |

### Canonical Chain Topology (LP-134)

The Lux network operates **nine** chains, each with one and only one
role. The full taxonomy is normative in LP-134; this LP-099 mirrors
the row-set so auditors can trace each cryptographic primitive to its
chain and certificate lane.

| Chain | VM | Role | Cert lane(s) | LP |
|---|---|---|---|---|
| **P-Chain** | PVM | Platform — staking, validators, epoch, slashing | (read-only roots) | LP-015 |
| **C-Chain** | EVM | Contract — general smart contracts | — | LP-009 |
| **X-Chain** | XVM | UTXO — assets, swaps, native txs | — | — |
| **Q-Chain** | QVM | **Pulsar 2-round threshold for PQ consensus signing** | `Ringtail` | LP-073 |
| **Z-Chain** | ZVM | **Groth16 over BLS12-381 — rolls N×ML-DSA-65 sigs into one 192-byte proof** | `MLDSAGroth16` | LP-063 |
| **A-Chain** | AIVM | Attestation — TEE, audit, identity, AI provenance | `AChainAttest` | LP-065 |
| **B-Chain** | BVM | Bridge — native cross-ecosystem messaging | `BChainBridge` | LP-016 |
| **M-Chain** | MVM | **MPC ceremonies — bridge custody for external wallets (CGGMP21, FROST, Pulsar-general)** | `MChainCGGMP21`, `MChainFROST`, `MChainPulsarGen` | LP-019, LP-076 |
| **F-Chain** | FVM | **TFHE bootstrap-key generation, encrypted EVM** | `FChainTFHE`, `FChainBootstrap` | LP-167 |

The legacy "T-Chain" (LP-5013, LP-7330) is **retained only** as the
`teleportvm` execution surface (LP-6332, LP-9110) for unified bridge
+ relay + oracle dispatch. Its prior MPC, FHE, Groth16, and
PQ-consensus duties are **separated** into M-/F-/Z-/Q-Chain
respectively, per LP-134.

### Quasar Certificate (canonical)

Defined in LP-020, implemented in `protocol/quasar/types.go`. A
`QuasarCert` is a 3-tuple binding three independent hardness
assumptions, each contributed by a separate chain:

| Layer | Scheme | Hardness | Source chain | In Cert |
|-------|--------|----------|--------------|---------|
| BLS | BLS12-381 aggregate | co-CDH (classical) | (network-wide) | 48 B |
| Pulsar (Ringtail) | Ring-LWE threshold | Module-LWE (PQ) | **Q-Chain** | variable, ~33 KB |
| MLDSAProof | ML-DSA-65 → Groth16 over BLS12-381 | Module-LWE + MSIS, then Groth16 SNARK | **Z-Chain** | 192 B |

PQ modes (`config/pq_mode.go`): `BLSOnly`, `BLSPlusMLDSA`,
`BLSPlusRingtail`, `BLSPlusGroth16`, `TripleQuantum`. Triple mode
runs all three layers in parallel via `TripleSignRound1`.

### Audit Requirements

Each LP must provide:
1. Formal specification of all state transitions.
2. Invariants that must hold across all states.
3. Security assumptions and threat model.
4. Test vectors for implementation verification.
5. Reference implementation location.

### Invariant Registry

Global protocol invariants:

| Invariant | Description |
|-----------|-------------|
| Total supply cap | LUX supply never exceeds 1,963,000,000 |
| Fee conservation | All fees are accounted (burn + treasury + validator) |
| Bridge backing | Bridged tokens are always 1:1 backed on origin chain |
| Consensus safety | No two conflicting blocks are finalized |
| Liveness | If 67% of stake is honest, new blocks are produced |
| Quasar triple soundness | Compromise of any one of {BLS, Pulsar, ML-DSA→Groth16} does not forge a finalized cert (proven in `proofs/lean/Consensus/Quasar.lean`) |
| Chain role uniqueness | Each chain in {P,C,X,Q,Z,A,B,M,F} owns exactly one role; no role has two owning chains (LP-134) |

### Verification Toolchain

| Tool | Purpose |
|------|---------|
| Lean4 | Consensus / crypto / BFT machine-checked proofs (`proofs/lean/`) |
| TLA+ | Consensus protocol model checking (`proofs/tla/`) |
| Tamarin | Protocol verification (`proofs/tamarin/`) |
| Halmos | Symbolic execution for Solidity (`proofs/halmos/`) |
| Certora | Smart contract formal verification |
| Echidna | Property-based fuzzing for Solidity |
| Foundry | Unit and integration testing |

## Security Considerations

1. The protocol spec is a living document. Each LP update triggers a
   spec revision.
2. Auditors receive the spec plus full source access. No
   security-through-obscurity.
3. Formal verification covers critical paths (consensus, bridge,
   token transfers). Non-critical paths use property-based fuzzing.
4. Audit reports are published publicly after remediation.
5. Quasar's triple-cert design composes **three independent hardness
   assumptions**: classical (BLS12-381 co-CDH), Ring-LWE PQ (Pulsar),
   and Module-LWE+MSIS PQ (ML-DSA-65, succinctly aggregated by
   Groth16 over BLS12-381 on Z-Chain). Each layer is independently
   toggleable; the production mode runs all three.

## Reference

| Resource | Location |
|----------|----------|
| Protocol specification | `github.com/luxfi/lps/docs/protocol-spec/` |
| Formal models | `github.com/luxfi/lps/docs/formal/` and `~/work/lux/proofs/` |
| Audit reports | `github.com/luxfi/lps/docs/audits/` |
| Consensus knowledge base | `~/work/lux/consensus/LLM.md` |
| Chain topology (canonical) | LP-134 |

## Copyright

Copyright (C) 2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
