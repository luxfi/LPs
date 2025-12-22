---
lp: 10009
title: Learning Path - Researcher
description: Academic research, experimental protocols, and frontier exploration
author: Lux Core Team
status: Research
type: Meta
created: 2025-12-21
tags: [learning-path, research, academic, experimental]
order: 29
tier: core
---

# LP-0019: Learning Path - Researcher

## Abstract

**"What's next?"**

This path provides clean separation of theory vs production for academic exploration.

## Motivation

Advancing the field requires deep understanding of current limitations and open problems. This path prepares researchers to contribute novel solutions.

## Audience

Academics, PhD researchers, frontier protocol teams, R&D labs.

## Prerequisites

Complete any production path first, then jump to research (+10000 offset).

## Outcome

After completing this path, you will:
- Understand research vs production boundaries
- Navigate the +10000 research taxonomy
- Identify open problems
- Contribute to frontier research

---

## Research Taxonomy

### The +10000 Rule

Every research area mirrors its production counterpart:

| Production | Research | Domain |
|------------|----------|--------|
| 0xxx | **10xxx** | Core/Meta |
| 1xxx | **11xxx** | Platform/PXQ |
| 2xxx | **12xxx** | Cryptography |
| 3xxx | **13xxx** | Web3/DeFi |
| 4xxx | **14xxx** | AI/Compute |
| 5xxx | **15xxx** | (Reserved) |
| 6xxx | **16xxx** | Bridges |
| 7xxx | **17xxx** | MPC/Threshold |
| 8xxx | **18xxx** | ZK/FHE |
| 9xxx | **19xxx** | Trading/HFT |

---

## Research Entry Points

### From Developer Path → DeFi Research

| Order | LP | Title | Focus |
|-------|-----|-------|-------|
| 1 | [LP-10095](/docs/lp-10095-stablecoin-mechanisms-research/) | Stablecoin Mechanisms | Algorithmic stability |
| 2 | LP-13xxx | AMM Research | Optimal bonding curves |
| 3 | LP-13xxx | Lending Research | Risk models |

### From Security Path → Crypto Research

| Order | LP | Title | Focus |
|-------|-----|-------|-------|
| 1 | [LP-10097](/docs/lp-10097-data-availability-research/) | Data Availability | Sampling proofs |
| 2 | LP-12xxx | PQC Research | Lattice optimization |
| 3 | LP-12xxx | Signature Research | Aggregation schemes |

### From MPC Path → Threshold Research

| Order | LP | Title | Focus |
|-------|-----|-------|-------|
| 1 | LP-17xxx | DKG Research | Asynchronous protocols |
| 2 | LP-17xxx | Resharing Research | Dynamic thresholds |
| 3 | LP-17xxx | PQ-MPC Research | Lattice-based TSS |

### From Privacy Path → ZK Research

| Order | LP | Title | Focus |
|-------|-----|-------|-------|
| 1 | LP-18xxx | SNARK Research | Recursive proofs |
| 2 | LP-18xxx | STARK Research | Transparent setup |
| 3 | LP-18xxx | FHE Research | Bootstrapping efficiency |

### From Trading Path → Market Research

| Order | LP | Title | Focus |
|-------|-----|-------|-------|
| 1 | [LP-10096](/docs/lp-10096-mev-protection-research/) | MEV Research | Fair ordering |
| 2 | LP-19xxx | Microstructure Research | Optimal execution |
| 3 | LP-19xxx | Oracle Research | Price aggregation |

---

## Existing Research LPs

| LP | Title | Domain |
|----|-------|--------|
| [LP-10090](/docs/lp-10090-research-papers-index/) | Research Index | Meta |
| [LP-10091](/docs/lp-10091-payment-processing-research/) | Payment Processing | Core |
| [LP-10092](/docs/lp-10092-cross-chain-messaging-research/) | Cross-Chain Messaging | Bridges |
| [LP-10093](/docs/lp-10093-decentralized-identity-research/) | Decentralized Identity | Core |
| [LP-10094](/docs/lp-10094-governance-framework-research/) | Governance Framework | Core |
| [LP-10095](/docs/lp-10095-stablecoin-mechanisms-research/) | Stablecoin Mechanisms | DeFi |
| [LP-10096](/docs/lp-10096-mev-protection-research/) | MEV Protection | Trading |
| [LP-10097](/docs/lp-10097-data-availability-research/) | Data Availability | Core |

---

## Contributing Research

To add a research LP:

1. Identify production LP it relates to
2. Add 10000 to get research LP number
3. Use `status: Research` or `status: Draft`
4. Reference production LPs in motivation

---

## Open Problems

### Cryptography (12xxx)
- Efficient lattice-based threshold signatures
- Hybrid classical-quantum key exchange
- Post-quantum aggregatable signatures

### DeFi (13xxx)
- MEV-resistant AMM designs
- Capital-efficient lending protocols
- Cross-chain composability models

### MPC (17xxx)
- Asynchronous DKG with optimal rounds
- Proactive resharing under malicious adversaries
- MPC with post-quantum security

### ZK (18xxx)
- Practical FHE for smart contracts
- Recursive SNARK optimization
- Hardware-accelerated proof generation

### Trading (19xxx)
- Provably fair ordering protocols
- Optimal market making strategies
- Oracle manipulation resistance

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
