---
lp: 10006
title: Learning Path - MPC & Threshold Custody
description: Keys, custody, signing networks, and institutional security
author: Lux Core Team
status: Draft
type: Meta
created: 2025-12-21
tags: [learning-path, mpc, threshold, custody, t-chain]
order: 26
tier: core
---

# LP-0016: Learning Path - MPC & Threshold Custody

## Abstract

**"Keys, custody, signing, institutions."**

This path covers MPC systems from primitives to production custody.

## Motivation

Threshold cryptography enables distributed custody without single points of failure. This path covers the mathematical and practical aspects of MPC systems.

## Audience

Security engineers, custodians, institutional developers.

## Prerequisites

Complete [LP-0011: Core Protocol Path](/docs/lp-0011-learning-path-core/) first.

## Outcome

After completing this path, you will understand:
- Threshold cryptography primitives
- T-Chain architecture and operations
- DKG and key resharing
- Signer rotation and asset binding
- HSM and KMS integration

---

## Curriculum

### Stage 1: Crypto Primitives (The Math)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 1 | [LP-2300](/docs/lp-2300/) | Threshold Schemes Overview | 30 min | Deep |
| 2 | [LP-0104](/docs/lp-0104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa/) | FROST (EdDSA) | 30 min | Deep |
| 3 | [LP-0014](/docs/lp-0014-t-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa/) | CGGMP21 (ECDSA) | 30 min | Deep |

### Stage 2: T-Chain Architecture

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 4 | [LP-7000](/docs/lp-7000-t-chain-threshold-specification/) | T-Chain Core | 30 min | Deep |
| 5 | [LP-7100](/docs/lp-7100/) | Signing Networks | 25 min | Deep |
| 6 | [LP-0330](/docs/lp-0330-t-chain-thresholdvm-specification/) | ThresholdVM Spec | 30 min | Deep |

### Stage 3: DKG & Resharing

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 7 | [LP-7200](/docs/lp-7200/) | DKG Protocols | 25 min | Deep |
| 8 | [LP-0103](/docs/lp-0103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing/) | LSS Dynamic Resharing | 30 min | Deep |
| 9 | [LP-0333](/docs/lp-0333-dynamic-signer-rotation-with-lss-protocol/) | Signer Rotation | 25 min | Deep |

### Stage 4: Asset & Key Management

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 10 | [LP-0334](/docs/lp-0334-per-asset-threshold-key-management/) | Per-Asset Key Management | 25 min | Deep |
| 11 | [LP-7400](/docs/lp-7400/) | K-Chain / KMS | 25 min | Deep |
| 12 | [LP-0325](/docs/lp-0325-kms-hardware-security-module-integration/) | HSM Integration | 25 min | Deep |

### Stage 5: Custody & Bridges

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 13 | [LP-7300](/docs/lp-7300/) | Decentralized Custody | 25 min | Deep |
| 14 | [LP-7500](/docs/lp-7500/) | MPC-Based Bridges | 25 min | Deep |
| 15 | [LP-0319](/docs/lp-0319-t-chain-decentralised-mpc-custody/) | MPC Custody v2 | 25 min | Deep |

### Stage 6: Post-Quantum MPC

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 16 | [LP-0324](/docs/lp-0324-ringtail-threshold-signature-precompile/) | Ringtail (PQ Threshold) | 30 min | Deep |
| 17 | [LP-7321](/docs/lp-7321-frost-threshold-signature-precompile/) | FROST Precompile | 20 min | Medium |
| 18 | [LP-7322](/docs/lp-7322-cggmp21-threshold-ecdsa-precompile/) | CGGMP21 Precompile | 20 min | Medium |

---

## Total Time

**~9 hours** for complete coverage.

---

## Key Distinction

| If it's... | Range |
|------------|-------|
| The math (schemes, proofs) | 2xxx |
| Running network/service | 7xxx |

**Rule**: MPC as math → 2xxx. MPC as network → 7xxx.

---

## Research Extensions

- [LP-17xxx](/docs/) — MPC/Threshold Research

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
