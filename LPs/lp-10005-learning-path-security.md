---
lp: 10005
title: Learning Path - Security & Auditor
description: System-level threat modeling and security analysis for Lux Network
author: Lux Core Team
status: Final
type: Meta
created: 2025-12-21
tags: [learning-path, security, audit, cryptography]
order: 25
tier: core
---

# LP-10005: Learning Path - Security & Auditor

## Abstract

**"How does this break?"**

This path provides system-level threat modeling capabilities.

## Motivation

Security auditing requires systematic understanding of attack vectors, vulnerability patterns, and defensive practices. This path trains auditors to protect the ecosystem.

## Audience

Security auditors, red teams, cryptographers, protocol researchers.

## Prerequisites

Complete [LP-0011: Core Protocol Path](/docs/lp-0011-learning-path-core/) first.

## Outcome

After completing this path, you will understand:
- Cryptographic assumptions and attack surfaces
- Post-quantum security model
- MPC trust boundaries
- ZK verification requirements
- MEV and ordering attacks

---

## Curriculum

### Stage 1: Cryptographic Foundations

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 1 | [LP-2000](/docs/lp-2000/) | Crypto Primitives Overview | 30 min | Deep |
| 2 | [LP-2100](/docs/lp-2100/) | Classical Signatures | 25 min | Deep |
| 3 | [LP-2200](/docs/lp-2200/) | Post-Quantum Algorithms | 35 min | Deep |

### Stage 2: PQ Security (Q-Chain)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 4 | [LP-0200](/docs/lp-0200-post-quantum-cryptography-suite-for-lux-network/) | PQC Suite | 30 min | Deep |
| 5 | [LP-0316](/docs/lp-0316-ml-dsa-post-quantum-digital-signatures/) | ML-DSA | 25 min | Deep |
| 6 | [LP-0317](/docs/lp-0317-slh-dsa-stateless-hash-based-digital-signatures/) | SLH-DSA | 20 min | Medium |
| 7 | [LP-0318](/docs/lp-0318-ml-kem-post-quantum-key-encapsulation/) | ML-KEM | 25 min | Deep |

### Stage 3: MPC Attack Surfaces (T-Chain)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 8 | [LP-7000](/docs/lp-7000-t-chain-threshold-specification/) | T-Chain Architecture | 30 min | Deep |
| 9 | [LP-0104](/docs/lp-0104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa/) | FROST Security Model | 25 min | Deep |
| 10 | [LP-0014](/docs/lp-0014-t-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa/) | CGGMP21 Analysis | 25 min | Deep |
| 11 | [LP-0324](/docs/lp-0324-ringtail-threshold-signature-precompile/) | Ringtail (PQ Threshold) | 25 min | Deep |

### Stage 4: ZK Trust Boundaries (Z-Chain)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 12 | [LP-8000](/docs/lp-8000/) | Z-Chain ZKVM | 30 min | Deep |
| 13 | [LP-8100](/docs/lp-8100/) | Validity Proofs | 25 min | Deep |
| 14 | [LP-8200](/docs/lp-8200/) | Fraud Proofs | 20 min | Medium |

### Stage 5: Bridge Security (B-Chain)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 15 | [LP-6000](/docs/lp-6000/) | B-Chain Architecture | 25 min | Deep |
| 16 | [LP-0339](/docs/lp-0339-bridge-security-emergency-procedures/) | Emergency Procedures | 20 min | Deep |
| 17 | [LP-0019](/docs/lp-0019-bridge-security-framework/) | Bridge Security Framework | 30 min | Deep |

### Stage 6: Trading Security

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 18 | [LP-9024](/docs/lp-9024-security-audit-requirements/) | Audit Requirements | 25 min | Deep |
| 19 | [LP-9025](/docs/lp-9025-mev-protection/) | MEV & Ordering Attacks | 30 min | Deep |
| 20 | [LP-9017](/docs/lp-9017-risk-management/) | Risk Management | 20 min | Medium |

---

## Total Time

**~9 hours** for complete coverage.

---

## Threat Model Summary

| Domain | Primary Threats | Key LPs |
|--------|-----------------|---------|
| Crypto | Quantum attacks, side channels | LP-2xxx, LP-4xxx |
| MPC | Malicious signers, collusion | LP-7xxx |
| ZK | Proof manipulation, soundness | LP-8xxx |
| Bridge | Relay attacks, oracle manipulation | LP-6xxx |
| Trading | MEV, front-running, sandwich | LP-9xxx |

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
