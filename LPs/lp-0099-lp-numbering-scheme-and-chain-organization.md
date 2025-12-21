---
lp: 99
title: LP Numbering Scheme and Chain Organization
description: Defines the official LP numbering scheme with chain separation, cryptographic primitives, and research categories
author: Lux Core Team
status: Final
type: Meta
created: 2025-01-15
updated: 2025-12-21
---

# LP-0099: LP Numbering Scheme and Chain Organization (v3.3)

## Abstract

This LP defines the official numbering scheme for all Lux Proposals (LPs), establishing a cognitively linear, academically correct, implementation-aligned taxonomy.

## Motivation

A consistent numbering scheme enables:
- **Logical Learning Path**: From fundamentals to applications
- **Clean Separation**: Math vs networks, primitives vs services
- **No Leakage**: ZK/FHE isolated, MPC consolidated
- **Research Separation**: Draft/experimental at +10000 offset
- **Future-Proof**: Room for growth in each tier

## Specification

### Master Overview

| Tier | Range | Domain | Purpose |
|------|-------|--------|---------|
| 0 | **0xxx** | Meta | What Lux is |
| 1 | **1xxx** | PXQ Platform | How Lux exists |
| 2 | **2xxx** | Cryptography | The math everything depends on |
| 3 | **3xxx** | Web3/DeFi | Where developers live |
| 4 | **4xxx-5xxx** | AI/Attestation | A-Chain compute |
| 5 | **6xxx-8xxx** | Security Chains | B/T/Z specialized chains |
| 6 | **9xxx** | Trading | Market infrastructure ⚡ |
| 7 | **10xxx-19xxx** | Research | Base + 10000 |
| 8 | **70xxx-72xxx** | Institutional | Funds, DAOs, ESG |

---

## TIER 0 — META (0xxx)

### 0xxx - Core / Meta

**What Lux is** — Network architecture, LP process, governance.

| Range | Purpose | Examples |
|-------|---------|----------|
| 0000-0009 | Core Architecture | Network, tokenomics, VM, subnets |
| 0010-0049 | Developer Tools | CLI, SDK, testing, plugins |
| 0050-0089 | Wallet & Security | Wallet standards, key management |
| 0090-0099 | Meta/Governance | This document, numbering scheme |
| 0100-0199 | Consensus | Quasar, Photon, Flare, Wave |
| 0900-0999 | Indexes | Category overviews |

---

## TIER 1 — PLATFORM SUBSTRATE (1xxx)

### 1xxx - PXQ (Fundamental Platform Chains)

**How Lux exists** — Pre-smart contract foundations.

| Range | Chain | Purpose |
|-------|-------|---------|
| 1000-1099 | P-Chain Core | Validators, staking, registry |
| 1100-1199 | P-Chain Staking | Validator requirements, rewards |
| 1200-1299 | P-Chain Subnets | Subnet creation, management |
| 1300-1399 | X-Chain Core | Native assets, settlement, transfers |
| 1400-1499 | X-Chain Assets | Asset standards (non-DeFi) |
| 1500-1599 | Q-Chain Core | Root security, PQ finality |
| 1600-1699 | Q-Chain Checkpoints | Quantum checkpointing |
| 1700-1899 | (Reserved) | Platform extensions |
| 1900-1999 | Meta | Platform indexes |

**Rule**: If it's validator/staking/native-asset infrastructure → 1xxx

---

## TIER 2 — CRYPTOGRAPHIC PRIMITIVES (2xxx)

### 2xxx - Cryptography & Security (Chain-Agnostic)

**The math everything else depends on** — Algorithms, not implementations.

| Range | Purpose | Examples |
|-------|---------|----------|
| 2000-2099 | Core Crypto | Curves, hashing, VRFs, RNG |
| 2100-2199 | Classical Signatures | ECDSA, Schnorr, BLS |
| 2200-2299 | Post-Quantum Algorithms | ML-KEM, ML-DSA, SLH-DSA |
| 2300-2399 | Threshold Schemes | FROST, CGGMP21 as primitives |
| 2400-2499 | Hybrid Crypto | Classical-quantum transitions |
| 2500-2599 | Crypto Precompiles | Verification precompile specs |
| 2600-2699 | Key Derivation | HD wallets, BIP standards |
| 2700-2899 | (Reserved) | Crypto extensions |
| 2900-2999 | Meta | Crypto indexes |

**Rule**: If it's math, keys, proofs, or verification schemes → 2xxx

---

## TIER 3 — WEB3 / SMART CONTRACTS (3xxx)

### 3xxx - C-Chain / Web3 / DeFi

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

## TIER 4 — AI / ATTESTATION (4xxx-5xxx)

### 4xxx-5xxx - A-Chain (AI & Compute)

**Verified compute** — AI workloads, TEE attestation.

| Range | Purpose | Examples |
|-------|---------|----------|
| 4000-4099 | A-Chain Core | Attestation specification |
| 4100-4199 | AI Integration | LLM gateway, model verification |
| 4200-4299 | AI Mining | Compute incentives |
| 4300-4399 | TEE | Trusted execution environments |
| 4400-4499 | Confidential Compute | Secure execution tiers |
| 5000-5099 | GPU Acceleration | Hardware optimization |
| 5100-5199 | Training Ledger | Model provenance |
| 5200-5499 | (Reserved) | AI extensions |
| 5900-5999 | Meta | A-Chain indexes |

---

## TIER 5 — SECURITY CHAINS (6xxx-8xxx)

### 6xxx - B-Chain (Bridges & Messaging)

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

### 7xxx - T-Chain (MPC / Threshold Networks)

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

**Rule**: If MPC runs as a network or service → 7xxx. If it's just the math → 2xxx.

---

### 8xxx - Z-Chain (Privacy / ZK / FHE)

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

**Hard Rule**: ZK/FHE never leak into 2xxx or 3xxx except by reference.

---

## TIER 6 — TRADING (9xxx) ⚡

### 9xxx - CEX / DEX / HFT

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

## TIER 7 — RESEARCH (10xxx-19xxx)

**Research = Base + 10000** — Mirrors base categories for mental mapping.

| Range | Mirrors | Research Domain |
|-------|---------|-----------------|
| **10xxx** | 0xxx | Core/Meta Research |
| **11xxx** | 1xxx | Platform/PXQ Research |
| **12xxx** | 2xxx | Cryptography Research |
| **13xxx** | 3xxx | Web3/DeFi Research |
| **14xxx** | 4xxx | AI/Compute Research |
| **15xxx** | 5xxx | (Reserved) |
| **16xxx** | 6xxx | Bridge Research |
| **17xxx** | 7xxx | MPC/Threshold Research |
| **18xxx** | 8xxx | ZK/FHE Research |
| **19xxx** | 9xxx | Trading/HFT Research |

**Rule**: Draft, experimental, academic → +10000

---

## TIER 8 — INSTITUTIONAL (70xxx-72xxx)

### 70xxx - Fund Management

| Range | Purpose |
|-------|---------|
| 70000-70099 | Lux Vision Fund |
| 70100-70199 | Fund of Funds |
| 70200-70299 | Treasury Management |
| 70300-70399 | Investment DAOs |

### 71xxx - DAO / Governance

| Range | Purpose |
|-------|---------|
| 71000-71099 | DAO Framework |
| 71100-71199 | Voting Mechanisms |
| 71200-71299 | Proposal Lifecycle |
| 71300-71399 | Multi-sig |

### 72xxx - ESG / Impact

| Range | Purpose |
|-------|---------|
| 72000-72099 | ESG Framework |
| 72100-72199 | Carbon Accounting |
| 72200-72299 | Green Compute |
| 72300-72399 | Social Impact |

---

## Decision Rules (Print These)

| If your spec is about... | Range |
|--------------------------|-------|
| Math / schemes / primitives | **2xxx** |
| EVM / Solidity / DeFi apps | **3xxx** |
| MPC as a running network | **7xxx** |
| ZK / FHE / private compute | **8xxx** |
| Trading latency / orderbooks | **9xxx** |
| Unfinished / experimental | **+10000** |

---

## Canonical Learning Paths

These are curricula, not marketing. Each path answers:
- What do I read first?
- What can I safely skip?
- Where do I go deep vs broad?

### Path 0: Core Protocol (Everyone Starts Here)

**"What is Lux, structurally and philosophically?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | LP-0000 | Network Architecture & LP Process |
| 2 | LP-0001 | Native Tokens & Tokenomics |
| 3 | LP-0099 | LP Numbering & System Map (v3.3) |
| 4 | LP-0100–0199 | Consensus overview (Photon / Flare / Quasar) |
| 5 | LP-1000 | P-Chain Core |
| 6 | LP-1xxx | PXQ overview — P / X / Q responsibilities |

✅ **Stop here if you're non-technical**
➡️ **Branch after this**

---

### Path 1: Platform Engineer / Node Operator

**"How does Lux actually run?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-1000–1199 | P-Chain (validators, staking, epochs) |
| 3 | LP-1300–1399 | X-Chain — asset transport & settlement |
| 4 | LP-1500–1599 | Q-Chain — root finality & PQ security |
| 5 | LP-2xxx | Crypto primitives — signatures, hashing, VRFs |

**Optional specialization**:
- MPC ops → jump to T-Chain path (7xxx)
- ZK ops → jump to Z-Chain path (8xxx)

---

### Path 2: Smart Contract / Web3 Developer

**"I want to build apps, protocols, and money."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-3000–3099 | EVM execution & gas model |
| 3 | LP-3100–3199 | Token standards (LRC-20/721/1155) |
| 4 | LP-3300–3399 | DeFi: AMMs & liquidity |
| 5 | LP-3400–3499 | DeFi: Lending, vaults, yield |
| 6 | LP-3700–3799 | Wallets & identity |

**Acceleration**: LP-9300+ — precompiles (DEX, Oracle, Crypto)
**Research extensions**: LP-13xxx — DeFi/Web3 research

---

### Path 3: MPC / Threshold / Custody (T-Chain)

**"Keys, custody, signing, institutions."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-2300–2399 | Threshold crypto primitives (math only) |
| 3 | LP-7000 | T-Chain architecture |
| 4 | LP-7100–7199 | CGGMP21, FROST, Ringtail |
| 5 | LP-7200–7299 | DKG & resharing |
| 6 | LP-7300–7399 | Key rotation & custody |
| 7 | LP-7400–7499 | KMS & HSM integration |

**Bridges via MPC** → LP-6xxx
**Research** → LP-17xxx

---

### Path 4: Privacy / ZK / FHE (Z-Chain)

**"Encrypted execution and private state."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-2400–2499 | ZK & FHE primitives (theory) |
| 3 | LP-8000 | Z-Chain VM architecture |
| 4 | LP-8100–8199 | ZK execution layers |
| 5 | LP-8300–8399 | Private swaps / lending |
| 6 | LP-8500–8599 | Proof systems & rollups |
| 7 | LP-8600–8699 | Accelerators & hardware |

**Research** → LP-18xxx

---

### Path 5: Trading / Market Infrastructure

**"Latency, liquidity, price discovery."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-9000 | DEX / CEX architecture |
| 3 | LP-9001–9003 | Matching engines |
| 4 | LP-9300–9399 | DEX & Oracle precompiles |
| 5 | LP-9400–9499 | Perps & derivatives |
| 6 | LP-9500–9599 | HFT venues |

**MEV** → LP-9800+
**Research** → LP-19xxx

---

### Path 6: Security Engineer / Auditor

**"How does this break?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-2xxx | Cryptographic assumptions |
| 3 | LP-2200–2299 | PQ security |
| 4 | LP-7xxx | MPC attack surfaces |
| 5 | LP-8xxx | ZK trust boundaries |
| 6 | LP-9024 | Audit requirements |
| 7 | LP-9025 | MEV & ordering attacks |

---

### Path 7: Investor / Fund / Institutional

**"Where does value accrue and why?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | LP-0001 | Tokenomics |
| 2 | LP-0000 | Network architecture (skim) |
| 3 | LP-1000 | Platform economics |
| 4 | LP-3000 | DeFi surface area |
| 5 | LP-9000 | Trading liquidity |
| 6 | LP-70000 | Fund management |
| 7 | LP-71000 | DAO governance |
| 8 | LP-72000 | ESG & impact |

---

### Path 8: Researcher

**"What's next?"**

Start from any base path, then jump to +10000 offset:

| Research Range | Base | Domain |
|----------------|------|--------|
| 10xxx | 0xxx | Core research |
| 12xxx | 2xxx | Cryptography research |
| 13xxx | 3xxx | Web3/DeFi research |
| 17xxx | 7xxx | MPC research |
| 18xxx | 8xxx | ZK/FHE research |
| 19xxx | 9xxx | Trading research |

---

### Quick Reference

```
Developer:   0000 → 3000 → 3100 → 3300 → 9000
Validator:   0000 → 1000 → 1100 → 0110 → 1500
Trader:      0000 → 3300 → 9000 → 9400 → 9500
Security:    2000 → 2200 → 7000 → 8000 → 6000
Researcher:  10090 → 12xxx → 17xxx → 18xxx → 19xxx
Investor:    0000 → 70000 → 71000 → 72000
```

---

## Migration from v3

| Old Range | New Range | Reason |
|-----------|-----------|--------|
| 0090-0097 | 10090-10097 | Research → +10000 |
| 10000-12999 | 70000-72999 | Institutional → 70xxx |
| 50xxx | 10xxx-19xxx | Research consolidated |
| 4xxx (Q-Chain) | 1500-1699 | Q merged into PXQ |
| 5xxx (A-Chain) | 4xxx-5xxx | AI moved down |

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
