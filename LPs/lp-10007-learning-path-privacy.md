---
lp: 10007
title: Learning Path - Privacy & Zero-Knowledge
description: Encrypted execution, ZK proofs, and private compute on Z-Chain
author: Lux Core Team
status: Research
type: Meta
created: 2025-12-21
tags: [learning-path, privacy, zk, fhe, z-chain]
order: 27
tier: core
---

# LP-0017: Learning Path - Privacy & Zero-Knowledge

## Abstract

**"Encrypted execution and private state."**

This path covers ZK systems from theory to production.

## Motivation

Privacy-preserving computation requires understanding zero-knowledge proofs, confidential transactions, and secure execution. This path covers the theory and implementation.

## Audience

Cryptographers, privacy engineers, ZK protocol developers.

## Prerequisites

Complete [LP-0011: Core Protocol Path](/docs/lp-0011-learning-path-core/) first.

## Outcome

After completing this path, you will understand:
- ZK and FHE primitives
- Z-Chain VM architecture
- Validity and fraud proofs
- Private DeFi protocols
- Hardware acceleration

---

## Curriculum

### Stage 1: ZK Primitives (The Math)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 1 | LP-2xxx | ZK Fundamentals | 30 min | Deep |
| 2 | LP-2xxx | SNARK/STARK Theory | 30 min | Deep |
| 3 | LP-2xxx | FHE Fundamentals | 25 min | Medium |

### Stage 2: Z-Chain Architecture

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 4 | [LP-8000](/docs/lp-8000/) | Z-Chain ZKVM | 35 min | Deep |
| 5 | [LP-0045](/docs/lp-0045-z-chain-encrypted-execution-layer-interface/) | Encrypted Execution Layer | 30 min | Deep |

### Stage 3: Proof Systems

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 6 | [LP-8100](/docs/lp-8100/) | Validity Proofs | 30 min | Deep |
| 7 | [LP-8200](/docs/lp-8200/) | Fraud Proofs | 25 min | Deep |
| 8 | [LP-0503](/docs/lp-0503-validity-proof-system/) | Validity Proof System | 25 min | Deep |

### Stage 4: Private DeFi

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 9 | [LP-8300](/docs/lp-8300/) | Private Swaps | 25 min | Deep |
| 10 | [LP-0400](/docs/lp-0400-automated-market-maker-protocol-with-privacy/) | Private AMM | 25 min | Deep |
| 11 | [LP-0401](/docs/lp-0401-confidential-lending-protocol/) | Confidential Lending | 25 min | Deep |
| 12 | [LP-0402](/docs/lp-0402-zero-knowledge-swap-protocol/) | ZK Swap Protocol | 25 min | Deep |

### Stage 5: Encrypted Execution

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 13 | [LP-8400](/docs/lp-8400/) | FHE Interfaces | 25 min | Deep |
| 14 | [LP-0302](/docs/lp-0302-lux-z-a-chain-privacy-ai-attestation-layer/) | Privacy/AI Attestation | 25 min | Deep |

### Stage 6: L2 & Rollups

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 15 | [LP-8500](/docs/lp-8500/) | ZK Rollups | 25 min | Deep |
| 16 | [LP-0501](/docs/lp-0501-data-availability-layer/) | Data Availability | 20 min | Medium |

### Stage 7: Acceleration (Advanced)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 17 | [LP-8600](/docs/lp-8600/) | FHE Accelerators | 25 min | Deep |
| 18 | [LP-0607](/docs/lp-0607-gpu-acceleration-framework/) | GPU Acceleration | 20 min | Medium |

---

## Total Time

**~8 hours** for complete coverage.

---

## Hard Rule

**ZK/FHE never leak into 2xxx or 3xxx except by reference.**

All ZK and FHE implementations live in 8xxx (Z-Chain).

---

## Research Extensions

- [LP-18xxx](/docs/) — ZK/FHE Research

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
