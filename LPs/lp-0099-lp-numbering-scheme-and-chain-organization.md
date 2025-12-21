---
lp: 99
title: LP Numbering Scheme and Chain Organization
description: Defines the official LP numbering scheme with chain separation, application tiers, and research categories
author: Lux Core Team
status: Final
type: Meta
created: 2025-01-15
updated: 2025-12-21
---

# LP-0099: LP Numbering Scheme and Chain Organization

## Abstract

This LP defines the official numbering scheme for all Lux Proposals (LPs), establishing a logical progression from foundational protocols through specialized chains, applications, institutional tools, and research.

## Motivation

A consistent numbering scheme enables:
- **Logical Learning Path**: From beginner to expert
- **Clear Categorization**: By chain, domain, and complexity
- **Easy Discovery**: Find related proposals quickly
- **Scalability**: Room for growth in each category

## Specification

### Tier Overview

| Tier | Range | Domain | Purpose |
|------|-------|--------|---------|
| 1 | 0xxx-2xxx | Foundation | Core protocol, chains, smart contracts |
| 2 | 3xxx | Web3/DeFi | Decentralized finance applications |
| 3 | 4xxx-8xxx | Security Chains | Quantum, AI, Bridge, MPC, Privacy |
| 4 | 9xxx | Trading | CEX/DEX/HFT, order books, oracles |
| 5 | 10xxx-12xxx | Institutional | Funds, DAOs, ESG |
| 6 | 50xxx+ | Research | Academic, experimental, frontier |

---

### TIER 1: FOUNDATION (0xxx - 2xxx)

Core infrastructure that everything else builds upon.

#### 0xxx - Core/Meta
Network architecture, governance, and developer tools.

| Range | Purpose | Examples |
|-------|---------|----------|
| 0000-0009 | Core Architecture | Network, tokenomics, VM, subnets |
| 0010-0049 | Developer Tools | CLI, SDK, testing, plugins |
| 0050-0089 | Wallet & Security | Wallet standards, key management |
| 0090-0099 | Meta/Governance | This document, research index |
| 0100-0199 | Consensus | Quasar, Photon, Flare, Wave |
| 0700-0799 | (Reserved) | Future core extensions |
| 0800-0899 | (Reserved) | Future core extensions |
| 0900-0999 | Meta/Index | Category overviews |

#### 1xxx - P-Chain (Platform)
Validator management, staking, and subnet coordination.

| Range | Purpose | Examples |
|-------|---------|----------|
| 1000-1099 | Core Platform | P-Chain specification |
| 1100-1199 | Staking | Validator requirements, rewards |
| 1200-1299 | Subnets | Subnet creation, management |
| 1300-1399 | Precompiles | P-Chain native features |
| 1400-1499 | Operations | Upgrades, monitoring |
| 1500-1699 | Research | Platform research |
| 1700-1899 | Experimental | Draft proposals |
| 1900-1999 | Meta | P-Chain index |

#### 2xxx - C-Chain (Smart Contracts)
EVM execution, precompiles, and token standards.

| Range | Purpose | Examples |
|-------|---------|----------|
| 2000-2099 | Core EVM | C-Chain specification, EVM equivalence |
| 2100-2199 | Precompiles | Fee manager, signatures, RNG |
| 2200-2299 | Gas & Fees | Dynamic pricing, limits |
| 2300-2399 | LRC-20 | Fungible tokens, extensions |
| 2400-2499 | State & Sync | State management, pruning |
| 2500-2599 | DeFi Standards | Account abstraction, Safe |
| 2600-2699 | Database | Verkle, BadgerDB |
| 2700-2799 | LRC-721/1155 | NFTs, multi-tokens |
| 2800-2899 | Experimental | Draft proposals |
| 2900-2999 | Meta | C-Chain index |

---

### TIER 2: WEB3 APPLICATIONS (3xxx)

Decentralized finance and Web3 application standards.

#### 3xxx - DeFi/Web3 (Replaces X-Chain)
AMM, lending, yield, and wallet integration.

| Range | Purpose | Examples |
|-------|---------|----------|
| 3000-3099 | Core DeFi | DeFi overview, core protocols |
| 3100-3199 | AMM | Automated market makers, liquidity |
| 3200-3299 | Lending | Borrowing, collateral, liquidation |
| 3300-3399 | Yield | Vaults, farming, strategies |
| 3400-3499 | Stablecoins | Algorithmic, collateralized |
| 3500-3599 | Wallet Standards | Wallet connection, signing |
| 3600-3699 | Cross-DeFi | Aggregators, routers |
| 3700-3799 | NFT DeFi | NFT staking, lending |
| 3800-3899 | Experimental | Draft proposals |
| 3900-3999 | Meta | DeFi index |

---

### TIER 3: SECURITY CHAINS (4xxx - 8xxx)

Specialized chains for security, privacy, and verification.

#### 4xxx - Q-Chain (Quantum Security)
Post-quantum cryptography and quantum-safe operations.

| Range | Purpose | Examples |
|-------|---------|----------|
| 4000-4099 | Core Q-Chain | Quantum chain specification |
| 4100-4199 | PQC Algorithms | ML-DSA, SLH-DSA, ML-KEM |
| 4200-4299 | Hybrid Crypto | Classical-quantum transitions |
| 4300-4399 | PQC Precompiles | Signature verification |
| 4400-4499 | Operations | Key rotation, upgrades |
| 4500-4699 | Research | PQC research |
| 4700-4899 | Experimental | Draft proposals |
| 4900-4999 | Meta | Q-Chain index |

#### 5xxx - A-Chain (AI/Attestation)
AI workloads, TEE attestation, and compute verification.

| Range | Purpose | Examples |
|-------|---------|----------|
| 5000-5099 | Core A-Chain | Attestation specification |
| 5100-5199 | AI Integration | LLM gateway, model verification |
| 5200-5299 | Mining | AI mining standards |
| 5300-5399 | Privacy AI | Confidential compute |
| 5400-5499 | TEE | Trusted execution environments |
| 5500-5699 | Research | AI research |
| 5700-5899 | Experimental | Draft proposals |
| 5900-5999 | Meta | A-Chain index |

#### 6xxx - B-Chain (Bridge/Cross-chain)
Cross-chain communication, Warp messaging, and Teleport.

| Range | Purpose | Examples |
|-------|---------|----------|
| 6000-6099 | Core B-Chain | Bridge specification |
| 6100-6199 | Teleport | Teleport protocol, relayers |
| 6200-6299 | Warp | Warp messaging 1.0, 1.5, 2.0 |
| 6300-6399 | Bridge Assets | Asset registry, standards |
| 6400-6499 | Security | Emergency procedures, audits |
| 6500-6699 | Research | Cross-chain research |
| 6700-6899 | Experimental | Draft proposals |
| 6900-6999 | Meta | B-Chain index |

#### 7xxx - T-Chain (Threshold/MPC)
Multi-party computation, threshold signatures, and custody.

| Range | Purpose | Examples |
|-------|---------|----------|
| 7000-7099 | Core T-Chain | Threshold specification |
| 7100-7199 | MPC Protocols | FROST, CGGMP21, LSS |
| 7200-7299 | Custody | Decentralized custody |
| 7300-7399 | Precompiles | Threshold signature verification |
| 7400-7499 | Key Management | K-Chain, HSM integration |
| 7500-7699 | Research | MPC research |
| 7700-7899 | Experimental | Draft proposals |
| 7900-7999 | Meta | T-Chain index |

#### 8xxx - Z-Chain (Privacy/ZK)
Zero-knowledge proofs, encrypted execution, and private DeFi.

| Range | Purpose | Examples |
|-------|---------|----------|
| 8000-8099 | Core Z-Chain | ZK-VM specification |
| 8100-8199 | ZK Proofs | Validity proofs, fraud proofs |
| 8200-8299 | Encrypted Exec | FHE, encrypted computation |
| 8300-8399 | Private DeFi | Private AMM, lending |
| 8400-8499 | L2/Rollups | ZK rollups, data availability |
| 8500-8699 | Research | Privacy research |
| 8700-8899 | Experimental | Draft proposals |
| 8900-8999 | Meta | Z-Chain index |

---

### TIER 4: TRADING & MARKETS (9xxx)

Exchange infrastructure for CEX, DEX, and HFT.

#### 9xxx - CEX/DEX/HFT ⚡
Order books, matching engines, oracles, and high-frequency trading.

| Range | Purpose | Examples |
|-------|---------|----------|
| 9000-9049 | Core DEX | DEX specification, trading engine |
| 9050-9099 | Oracles | Native oracle, price feeds, TWAP |
| 9100-9199 | Order Books | Matching, order types |
| 9200-9299 | Operations | Emergency, risk, monitoring |
| 9300-9399 | Precompiles | DEX precompile, oracle precompile |
| 9400-9499 | Perpetuals | Derivatives, margin, futures |
| 9500-9599 | HFT | High-frequency trading venues |
| 9600-9699 | Market Making | Liquidity provision, incentives |
| 9700-9799 | CEX Integration | Centralized exchange bridges |
| 9800-9899 | Experimental | Draft proposals |
| 9900-9999 | Meta | DEX overview index |

---

### TIER 5: INSTITUTIONAL (10xxx - 12xxx)

Fund management, DAOs, and ESG frameworks.

#### 10xxx - Fund Management
Lux Fund, fund of funds, and treasury management.

| Range | Purpose | Examples |
|-------|---------|----------|
| 10000-10099 | Lux Vision Fund | Core fund specification |
| 10100-10199 | Fund of Funds | Multi-fund structures |
| 10200-10299 | Treasury | Treasury management, diversification |
| 10300-10399 | Investment DAOs | DAO-managed funds |
| 10400-10499 | Yield Strategies | Institutional yield |
| 10500-10699 | Research | Fund research |
| 10700-10899 | Experimental | Draft proposals |
| 10900-10999 | Meta | Fund index |

#### 11xxx - DAO/Governance
Voting mechanisms, proposals, and decentralized governance.

| Range | Purpose | Examples |
|-------|---------|----------|
| 11000-11099 | DAO Framework | Core DAO specification |
| 11100-11199 | Voting | Voting strategies, quadratic |
| 11200-11299 | Proposals | Proposal lifecycle, execution |
| 11300-11399 | Multi-sig | Azorius, Safe integration |
| 11400-11499 | Delegation | Delegation mechanisms |
| 11500-11699 | Research | Governance research |
| 11700-11899 | Experimental | Draft proposals |
| 11900-11999 | Meta | DAO index |

#### 12xxx - ESG/Impact
Environmental, social, and governance metrics.

| Range | Purpose | Examples |
|-------|---------|----------|
| 12000-12099 | ESG Framework | Principles, commitments |
| 12100-12199 | Carbon | Carbon accounting, offsets |
| 12200-12299 | Green Compute | Energy procurement, efficiency |
| 12300-12399 | Social Impact | Financial inclusion, community |
| 12400-12499 | Reporting | Transparency, metrics |
| 12500-12699 | Research | Impact research |
| 12700-12899 | Experimental | Draft proposals |
| 12900-12999 | Meta | ESG index |

---

### TIER 6: RESEARCH (50xxx+)

Academic papers, experimental protocols, and frontier research.

#### 50xxx+ - Research & Frontier
Forward-looking research and experimental proposals.

| Range | Purpose | Examples |
|-------|---------|----------|
| 50000-50099 | Research Index | Research overview, directory |
| 50100-50199 | Consensus Research | Novel consensus mechanisms |
| 50200-50299 | Cryptography Research | Post-quantum, ZK advances |
| 50300-50399 | Scaling Research | L2, sharding, DAG |
| 50400-50499 | Privacy Research | FHE, MPC advances |
| 50500-50599 | AI Research | ML integration, verification |
| 50600-50699 | Economics Research | Tokenomics, MEV |
| 50700-50799 | Cross-chain Research | Interoperability |
| 50800-50899 | DeFi Research | Novel mechanisms |
| 50900-50999 | Frontier | Experimental concepts |

---

## User Journey: Learning Path

### Path 1: Developer (Build dApps)
```
LP-0000 → LP-0009 → LP-2000 → LP-2300 → LP-3000 → LP-9000
Network    CLI       EVM       LRC-20    DeFi      DEX
```

### Path 2: Validator (Run Nodes)
```
LP-0000 → LP-1000 → LP-1100 → LP-0110 → LP-4000
Network   P-Chain   Staking   Quasar    Quantum
```

### Path 3: Trader (Trade Assets)
```
LP-0001 → LP-3000 → LP-9000 → LP-9400 → LP-9500
Tokens    DeFi      DEX       Perps     HFT
```

### Path 4: Investor (Manage Assets)
```
LP-0001 → LP-10000 → LP-11000 → LP-12000
Tokens    Lux Fund   DAO        ESG
```

### Path 5: Security (Audit & Verify)
```
LP-4000 → LP-7000 → LP-8000 → LP-5000 → LP-6000
Quantum   MPC       Privacy   Attest    Bridge
```

---

## Migration from v1

### Relocated Series

| Old Range | New Range | Category |
|-----------|-----------|----------|
| 0750-0930 | 12xxx | ESG/Impact |
| 3xxx (X-Chain) | 9xxx | Trading (was exchange) |
| DeFi scattered | 3xxx | Consolidated DeFi |
| Research (0090s) | 50xxx | Research papers |

### Backwards Compatibility

Old LP numbers remain valid with redirects. All legacy LPs gain:
```yaml
superseded-by: LP-XXXXX
```

New LPs reference old numbers:
```yaml
replaces: LP-YYYY
```

---

## Security Considerations

None - this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
