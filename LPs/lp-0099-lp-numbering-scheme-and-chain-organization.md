---
lp: 99
title: LP Numbering Scheme and Chain Organization
description: Defines the official LP numbering scheme with chain separation, cryptographic primitives, and research categories
author: Lux Core Team
status: Final
tags: [network, core]
type: Meta
created: 2025-01-15
updated: 2025-12-21
order: 99
---

# LP-0099: LP Numbering Scheme and Chain Organization (v4.0)

## Abstract

This LP defines the official numbering scheme for all Lux Proposals (LPs), establishing a cognitively linear, academically correct, implementation-aligned taxonomy. Version 4.0 introduces subject-first categorization with clear chain boundaries.

## Motivation

A consistent numbering scheme enables:
- **Subject-First Design**: Subjects describe knowledge domains, chains describe deployment
- **Logical Learning Path**: From fundamentals to applications
- **Clean Chain Separation**: Each chain has dedicated range
- **No Leakage**: ZK/FHE isolated, MPC consolidated
- **Research Separation**: Draft/experimental at +10000 offset
- **Future-Proof**: Room for growth in each tier

## Specification

### Master Overview

| Tier | Range | Domain | Purpose |
|------|-------|--------|---------|
| 0 | **0000-0099** | Core/Meta | What Lux is |
| 1 | **0100-0999** | Governance, DAO & ESG | Community, impact, sustainability |
| 2 | **1000-1999** | P-Chain | Platform validators, staking |
| 3 | **2000-2999** | X-Chain | Cryptography & exchange |
| 4 | **3000-3999** | C-Chain | Smart contracts, EVM |
| 5 | **4000-4999** | Q-Chain | Quantum-safe infrastructure |
| 6 | **5000-5999** | A-Chain | AI & attestation |
| 7 | **6000-6999** | B-Chain | Bridges & messaging |
| 8 | **7000-7999** | T-Chain | Threshold/MPC networks |
| 9 | **8000-8999** | Z-Chain | ZK/Privacy |
| 10 | **9000-9999** | Markets/DEX | Trading infrastructure |
| 11 | **10000+** | Research | Learning & experimental |

### Core Principle

> **Subjects describe knowledge. Chains describe deployment.**

---

## TIER 0 — CORE/META (0000-0099)

### 0000-0099 - Foundation

**What Lux is** — Network architecture, LP process, governance.

| Range | Purpose | Examples |
|-------|---------|----------|
| 0000-0009 | Core Architecture | Network, tokenomics, VM, chains |
| 0010-0049 | Developer Tools | CLI, SDK, testing, plugins |
| 0050-0089 | Wallet & Security | Wallet standards, key management |
| 0090-0099 | Meta/Governance | This document, numbering scheme |

---

## TIER 1 — GOVERNANCE, DAO & ESG (0100-0999)

### 0100-0999 - Community & Impact

**How Lux governs and impacts** — DAOs, ESG, community frameworks.

| Range | Purpose | Examples |
|-------|---------|----------|
| 0100-0199 | Consensus Protocols | Quasar, Photon, Flare, Wave |
| 0150-0169 | Investment & Vision | Lux Vision Fund, ESG framework |
| 0200-0269 | ESG Principles | Commitments, carbon, green compute |
| 0300-0349 | Impact Framework | Theory of change, measurement, engagement |
| 0400-0499 | DAO Framework | Azorius, voting, proposals |
| 0500-0599 | Treasury | Management, grants |
| 0600-0699 | Validator Governance | Requirements, incentives |
| 0700-0899 | (Reserved) | Governance extensions |
| 0900-0999 | Indexes | Category overviews |

---

## TIER 2 — P-CHAIN (1000-1999)

### 1000-1999 - Platform Chain

**How Lux exists** — Validators, staking, subnet management.

| Range | Purpose | Examples |
|-------|---------|----------|
| 1000-1099 | P-Chain Core | Validators, registry |
| 1100-1199 | Staking | Requirements, rewards, delegators |
| 1200-1299 | Subnet Management | Creation, configuration |
| 1300-1399 | Epochs & Views | Epoched views, validator sets |
| 1400-1599 | (Reserved) | Platform extensions |
| 1600-1699 | Migration | Upgrades, state transitions |
| 1700-1899 | (Reserved) | Future platform features |
| 1900-1999 | Meta | Platform indexes |

**Rule**: If it's validator/staking/subnet infrastructure → 1xxx

---

## TIER 3 — X-CHAIN (2000-2999)

### 2000-2999 - Exchange Chain

**Cryptography & native assets** — The math and exchange infrastructure.

| Range | Purpose | Examples |
|-------|---------|----------|
| 2000-2099 | X-Chain Core | Exchange specification |
| 2100-2199 | Core Cryptography | Curves, hashing, VRFs, RNG |
| 2200-2299 | Classical Signatures | ECDSA, Schnorr, BLS, secp256r1 |
| 2300-2399 | Native Assets | Asset standards (non-DeFi) |
| 2400-2499 | Transfers & UTXOs | Transfer protocols |
| 2500-2599 | Key Derivation | HD wallets, BIP standards |
| 2600-2899 | (Reserved) | Exchange extensions |
| 2900-2999 | Meta | X-Chain indexes |

**Rule**: If it's native asset exchange or core crypto → 2xxx

---

## TIER 4 — C-CHAIN (3000-3999)

### 3000-3999 - Contract Chain

**Where developers live** — EVM and everything Solidity devs consume.

| Range | Purpose | Examples |
|-------|---------|----------|
| 3000-3099 | Core EVM | C-Chain spec, EVM equivalence |
| 3100-3199 | Token Standards | LRC-20, LRC-721, LRC-1155 |
| 3200-3299 | Account Abstraction | Safe, smart accounts, ERC-4337 |
| 3300-3399 | AMM Protocols | Liquidity pools, swaps, routing |
| 3400-3499 | Lending Protocols | Borrowing, collateral, liquidation |
| 3500-3599 | Yield & Vaults | Farming, strategies, aggregators |
| 3600-3699 | Stablecoins | Algorithmic, collateralized |
| 3700-3799 | Wallets & Identity | Wallet standards, DIDs |
| 3800-3899 | Gas & Fees | Dynamic pricing, limits |
| 3900-3999 | Meta | Web3 indexes |

**Rule**: If a Solidity dev consumes it directly → 3xxx

---

## TIER 5 — Q-CHAIN (4000-4999)

### 4000-4999 - Quantum-Safe Chain

**Post-quantum security** — Future-proof cryptographic infrastructure.

| Range | Purpose | Examples |
|-------|---------|----------|
| 4000-4099 | Q-Chain Core | Quantum-safe specification |
| 4100-4199 | ML-KEM | Key encapsulation (FIPS 203) |
| 4200-4299 | ML-DSA | Digital signatures (FIPS 204) |
| 4300-4399 | SLH-DSA | Hash-based signatures (FIPS 205) |
| 4400-4499 | Hybrid Crypto | Classical-quantum transitions |
| 4500-4599 | PQ Checkpoints | Quantum finality anchors |
| 4600-4699 | Lattice Primitives | NTRU, Kyber, Dilithium |
| 4700-4899 | (Reserved) | PQ extensions |
| 4900-4999 | Meta | Q-Chain indexes |

**Rule**: If it's post-quantum cryptography → 4xxx

---

## TIER 6 — A-CHAIN (5000-5999)

### 5000-5999 - AI & Attestation Chain

**Verified compute** — AI workloads, TEE attestation.

| Range | Purpose | Examples |
|-------|---------|----------|
| 5000-5099 | A-Chain Core | Attestation specification |
| 5100-5199 | AI Integration | LLM gateway, model verification |
| 5200-5299 | AI Mining | Compute incentives |
| 5300-5399 | TEE | Trusted execution environments |
| 5400-5499 | Confidential Compute | Secure execution tiers |
| 5500-5599 | GPU Acceleration | Hardware optimization |
| 5600-5699 | Training Ledger | Model provenance |
| 5700-5899 | (Reserved) | AI extensions |
| 5900-5999 | Meta | A-Chain indexes |

---

## TIER 7 — B-CHAIN (6000-6999)

### 6000-6999 - Bridge Chain

**Cross-chain infrastructure** — Warp, Teleport, relayers.

| Range | Purpose | Examples |
|-------|---------|----------|
| 6000-6099 | B-Chain Core | Bridge specification |
| 6100-6199 | Teleport | Teleport protocol, relayers |
| 6200-6299 | Warp | Warp messaging 1.0, 1.5, 2.0 |
| 6300-6399 | Bridge Assets | Asset registry, standards |
| 6400-6499 | Bridge Security | Emergency procedures, audits |
| 6500-6699 | Cross-Chain Routing | Aggregators, routers |
| 6700-6899 | (Reserved) | Bridge extensions |
| 6900-6999 | Meta | B-Chain indexes |

---

## TIER 8 — T-CHAIN (7000-7999)

### 7000-7999 - Threshold Chain

**MPC is not separate — it IS T-Chain** — Threshold signing as a service.

| Range | Purpose | Examples |
|-------|---------|----------|
| 7000-7099 | T-Chain Core | Threshold network specification |
| 7100-7199 | Signing Networks | FROST, CGGMP21, Ringtail deployments |
| 7200-7299 | DKG & Resharing | Key generation, signer rotation |
| 7300-7399 | Custody | Decentralized custody, vaults |
| 7400-7499 | KMS | K-Chain, HSM integration |
| 7500-7599 | MPC Bridges | MPC-based cross-chain |
| 7600-7699 | MPC Swaps | Atomic swaps via threshold |
| 7700-7899 | (Reserved) | MPC extensions |
| 7900-7999 | Meta | T-Chain indexes |

**Rule**: If MPC runs as a network or service → 7xxx

---

## TIER 9 — Z-CHAIN (8000-8999)

### 8000-8999 - Zero-Knowledge Chain

**Fully isolated** — Zero-knowledge and encrypted execution.

| Range | Purpose | Examples |
|-------|---------|----------|
| 8000-8099 | Z-Chain Core | ZKVM specification |
| 8100-8199 | Validity Proofs | SNARKs, STARKs |
| 8200-8299 | Fraud Proofs | Optimistic verification |
| 8300-8399 | Private DeFi | Private AMM, lending |
| 8400-8499 | Encrypted Execution | FHE interfaces |
| 8500-8599 | L2/Rollups | ZK rollups, data availability |
| 8600-8699 | FHE Accelerators | Hardware acceleration |
| 8700-8899 | (Reserved) | Privacy extensions |
| 8900-8999 | Meta | Z-Chain indexes |

**Hard Rule**: ZK/FHE never leak into other ranges except by reference.

---

## TIER 10 — MARKETS/DEX (9000-9999) ⚡

### 9000-9999 - Trading Infrastructure

**Market infrastructure** — Where latency and throughput matter.

| Range | Purpose | Examples |
|-------|---------|----------|
| 9000-9049 | Core DEX | DEX specification, trading engine |
| 9050-9099 | Oracles | Native oracle, price feeds, TWAP |
| 9100-9199 | Order Books | Matching engines, order types |
| 9200-9299 | Operations | Emergency, risk, monitoring |
| 9300-9399 | Precompiles | DEX precompile, oracle precompile |
| 9400-9499 | Perpetuals | Derivatives, margin, futures |
| 9500-9599 | HFT | High-frequency venues, co-location |
| 9600-9699 | Market Making | Liquidity provision, incentives |
| 9700-9799 | CEX Integration | FIX protocol, exchange bridges |
| 9800-9899 | MEV | MEV-aware execution, fair ordering |
| 9900-9999 | Meta | Trading indexes |

**Rule**: If latency, throughput, or market microstructure matter → 9xxx

---

## TIER 11 — RESEARCH (10000+)

**Research = Base + 10000** — Mirrors base categories for mental mapping.

| Range | Mirrors | Research Domain |
|-------|---------|-----------------|
| **10xxx** | 0xxx | Core/Meta Research |
| **11xxx** | 1xxx | P-Chain Research |
| **12xxx** | 2xxx | X-Chain/Crypto Research |
| **13xxx** | 3xxx | C-Chain/Web3 Research |
| **14xxx** | 4xxx | Q-Chain/PQ Research |
| **15xxx** | 5xxx | A-Chain/AI Research |
| **16xxx** | 6xxx | B-Chain/Bridge Research |
| **17xxx** | 7xxx | T-Chain/MPC Research |
| **18xxx** | 8xxx | Z-Chain/ZK Research |
| **19xxx** | 9xxx | Trading/HFT Research |

**Rule**: Draft, experimental, academic → +10000

---

## Subject Categories

### Research Domains (Subjects)

Subjects describe knowledge independent of deployment chain:

| Subject | Description | Primary Range |
|---------|-------------|---------------|
| Consensus Systems | Agreement, finality, validator coordination | 0100-0199, 1xxx |
| Threshold Cryptography | FROST, CGGMP, Ringtail, distributed signing | 7xxx |
| Multi-Party Computation | General secure computation | 7xxx |
| Key Management Systems | K-Chain, HSM, policy engines | 7400-7499 |
| Post-Quantum Cryptography | ML-KEM, ML-DSA, SLH-DSA | 4xxx |
| Zero-Knowledge Proofs | SNARKs, STARKs, zkVM | 8xxx |
| Cryptography | Foundational primitives (curves, hashes, RNG) | 2100-2299 |
| AI & Attestation | Model verification, training ledgers | 5xxx |

### Key Distinctions

- **Threshold ≠ MPC**: Signing protocols vs general computation
- **MPC ≠ KMS**: Protocol math vs governance/operations
- **ZKP ≠ Privacy**: Proof systems vs confidential compute
- **Consensus ≠ Crypto**: Agreement protocols vs key mechanics
- **Subjects ≠ Chains**: Knowledge domains vs deployment targets

---

## Decision Rules

| If your spec is about... | Range |
|--------------------------|-------|
| Core architecture / meta | **0xxx** |
| Governance / DAO / ESG | **01xx-09xx** |
| Validators / staking / subnets | **1xxx** |
| Native assets / core crypto / exchange | **2xxx** |
| EVM / Solidity / DeFi apps | **3xxx** |
| Post-quantum cryptography | **4xxx** |
| AI / attestation / compute | **5xxx** |
| Bridges / cross-chain messaging | **6xxx** |
| MPC as a running network | **7xxx** |
| ZK / FHE / private compute | **8xxx** |
| Trading / orderbooks / DEX | **9xxx** |
| Unfinished / experimental | **+10000** |

---

## Canonical Learning Paths

### Path 0: Core Protocol (Everyone Starts Here)

**"What is Lux, structurally and philosophically?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | LP-0000 | Network Architecture & LP Process |
| 2 | LP-0001 | Native Tokens & Tokenomics |
| 3 | LP-0099 | LP Numbering & System Map (v4.0) |
| 4 | LP-0100–0199 | Consensus (Photon/Flare/Quasar) |
| 5 | LP-1000 | P-Chain Core |
| 6 | LP-2000 | X-Chain Core |
| 7 | LP-3000 | C-Chain Core |

✅ **Stop here if you're non-technical**
➡️ **Branch after this**

---

### Path 1: Platform Engineer / Node Operator

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-1000–1199 | P-Chain (validators, staking, epochs) |
| 3 | LP-2000–2099 | X-Chain — asset transport & settlement |
| 4 | LP-4000–4199 | Q-Chain — PQ security |
| 5 | LP-2100–2299 | Crypto primitives — signatures, hashing |

---

### Path 2: Smart Contract / Web3 Developer

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-3000–3099 | EVM execution & gas model |
| 3 | LP-3100–3199 | Token standards (LRC-20/721/1155) |
| 4 | LP-3300–3399 | DeFi: AMMs & liquidity |
| 5 | LP-3400–3499 | DeFi: Lending, vaults, yield |
| 6 | LP-3700–3799 | Wallets & identity |

---

### Path 3: MPC / Threshold / Custody (T-Chain)

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-7000 | T-Chain architecture |
| 3 | LP-7100–7199 | CGGMP21, FROST, Ringtail |
| 4 | LP-7200–7299 | DKG & resharing |
| 5 | LP-7300–7399 | Key rotation & custody |
| 6 | LP-7400–7499 | KMS & HSM integration |

---

### Path 4: Privacy / ZK / FHE (Z-Chain)

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-8000 | Z-Chain VM architecture |
| 3 | LP-8100–8199 | ZK execution layers |
| 4 | LP-8300–8399 | Private swaps / lending |
| 5 | LP-8500–8599 | Proof systems & rollups |
| 6 | LP-8600–8699 | Accelerators & hardware |

---

### Path 5: Trading / Market Infrastructure

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-9000 | DEX / CEX architecture |
| 3 | LP-9001–9003 | Matching engines |
| 4 | LP-9300–9399 | DEX & Oracle precompiles |
| 5 | LP-9400–9499 | Perps & derivatives |
| 6 | LP-9500–9599 | HFT venues |

---

### Quick Reference

```
Developer:   0000 → 3000 → 3100 → 3300 → 9000
Validator:   0000 → 1000 → 1100 → 0110 → 4000
Trader:      0000 → 3300 → 9000 → 9400 → 9500
Security:    2100 → 4000 → 7000 → 8000 → 6000
Researcher:  10090 → 12xxx → 17xxx → 18xxx → 19xxx
ESG/Impact:  0000 → 0150 → 0200 → 0300
```

---

## Migration from v3.3

| Old Range | New Range | Reason |
|-----------|-----------|--------|
| 0750-0930 | 0150-0330 | ESG consolidated in 01xx-03xx |
| 1300-1499 X-Chain | 2000-2999 | X-Chain gets dedicated range |
| 1500-1699 Q-Chain | 4000-4999 | Q-Chain gets dedicated range |
| 2xxx Crypto | 2100-2299 | Crypto under X-Chain |
| 3xxx C-Chain | 3000-3999 | Unchanged |
| 4xxx-5xxx AI | 5000-5999 | A-Chain dedicated at 5xxx |
| 70xxx-72xxx | 0100-0999 | Institutional → Governance tier |

### Legacy Range Preservation

Legacy LPs at 70xxx-72xxx remain valid but deprecated. New ESG/DAO proposals should use 0100-0999.

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
