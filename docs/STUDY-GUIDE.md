# How to Study the Lux Network

> **Welcome!** This guide helps you navigate Lux Proposals (LPs) and understand the Lux Network. Whether you're a developer, validator, trader, or researcher, there's a clear curriculum designed for you.

---

## Quick Start: Who Are You?

| Role | Goal | Start Here |
|------|------|------------|
| **Everyone** | Core understanding | [Core Protocol Path](#path-0-core-protocol-everyone-starts-here) |
| 🔧 **Platform Engineer** | Run the network | [Node Operator Path](#path-1-platform-engineer--node-operator) |
| 🧑‍💻 **Developer** | Build dApps | [Web3 Developer Path](#path-2-smart-contract--web3-developer) |
| 🔐 **MPC/Custody** | Keys and signing | [T-Chain Path](#path-3-mpc--threshold--custody-t-chain) |
| 🔒 **Privacy** | ZK and encryption | [Z-Chain Path](#path-4-privacy--zk--fhe-z-chain) |
| 📈 **Trader** | Trade efficiently | [Trading Path](#path-5-trading--market-infrastructure) |
| 🛡️ **Auditor** | Find vulnerabilities | [Security Path](#path-6-security-engineer--auditor) |
| 💼 **Investor** | Allocate capital | [Institutional Path](#path-7-investor--fund--institutional) |
| 📚 **Researcher** | Advance knowledge | [Researcher Path](#path-8-researcher) |

---

## The Big Picture (v3.3)

Lux Network is organized into **eight tiers**, each serving a distinct purpose:

```
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 0: META (0xxx)                                               │
│  What Lux IS — architecture, governance, indexes                   │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 1: PXQ PLATFORM (1xxx)                                       │
│  How Lux EXISTS — P-Chain, X-Chain, Q-Chain substrate              │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 2: CRYPTOGRAPHY (2xxx)                                       │
│  The MATH — algorithms, schemes, primitives (chain-agnostic)       │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 3: WEB3 / DEFI (3xxx)                                        │
│  Where DEVELOPERS live — EVM, tokens, AMM, lending                 │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 4: AI / ATTESTATION (4xxx-5xxx)                              │
│  Verified COMPUTE — A-Chain, TEE, AI workloads                     │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 5: SECURITY CHAINS (6xxx-8xxx)                               │
│  CAPABILITIES:                                                      │
│  ├── 6xxx: B-Chain (bridges, Warp, Teleport)                       │
│  ├── 7xxx: T-Chain (MPC networks, threshold signing)               │
│  └── 8xxx: Z-Chain (ZK, FHE, private compute — ISOLATED)           │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 6: TRADING (9xxx)                                            │
│  Market INFRASTRUCTURE — DEX, CEX, HFT, orderbooks ⚡               │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 7: RESEARCH (10xxx-19xxx)                                    │
│  STAGING ground — base + 10000 offset                               │
├─────────────────────────────────────────────────────────────────────┤
│  TIER 8: INSTITUTIONAL (70xxx-72xxx)                               │
│  COORDINATION — funds, DAOs, ESG                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Path 0: Core Protocol (Everyone Starts Here)

**"What is Lux, structurally and philosophically?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | [LP-0000](/docs/lp-0000-network-architecture-and-community-framework/) | Network Architecture & LP Process |
| 2 | [LP-0001](/docs/lp-0001-primary-chain-native-tokens-and-tokenomics/) | Native Tokens & Tokenomics |
| 3 | [LP-0099](/docs/lp-0099-lp-numbering-scheme-and-chain-organization/) | LP Numbering & System Map (v3.3) |
| 4 | LP-0100–0199 | Consensus overview (Photon / Flare / Quasar) |
| 5 | [LP-1000](/docs/lp-1000-p-chain-core-platform-specification/) | P-Chain Core |
| 6 | LP-1xxx | PXQ overview — P / X / Q responsibilities |

✅ **Stop here if you're non-technical**
➡️ **Branch to your specialty after this**

---

## Path 1: Platform Engineer / Node Operator

**"How does Lux actually run?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-1000–1199 | P-Chain (validators, staking, epochs) |
| 3 | LP-1300–1399 | X-Chain — asset transport & settlement |
| 4 | LP-1500–1599 | Q-Chain — root finality & PQ security |
| 5 | LP-2xxx | Crypto primitives — signatures, hashing, VRFs |

**Optional specialization**:
- MPC ops → [T-Chain Path](#path-3-mpc--threshold--custody-t-chain)
- ZK ops → [Z-Chain Path](#path-4-privacy--zk--fhe-z-chain)

---

## Path 2: Smart Contract / Web3 Developer

**"I want to build apps, protocols, and money."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-3000–3099 | EVM execution & gas model |
| 3 | LP-3155–3199 | Token standards (LRC-20/721/1155) |
| 4 | LP-3337–3399 | DeFi: AMMs & liquidity |
| 5 | LP-3626–3499 | DeFi: Lending, vaults, yield |
| 6 | LP-3700–3799 | Wallets & identity |

**Acceleration**: LP-9300+ — precompiles (DEX, Oracle, Crypto)
**Research extensions**: LP-13xxx — DeFi/Web3 research

---

## Path 3: MPC / Threshold / Custody (T-Chain)

**"Keys, custody, signing, institutions."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-2300–2399 | Threshold crypto primitives (math only) |
| 3 | [LP-7000](/docs/lp-7000-t-chain-threshold-specification/) | T-Chain architecture |
| 4 | LP-7100–7199 | CGGMP21, FROST, Pulsar |
| 5 | LP-7200–7299 | DKG & resharing |
| 6 | LP-7300–7399 | Key rotation & custody |
| 7 | LP-7400–7499 | KMS & HSM integration |

**Bridges via MPC** → LP-6xxx
**Research** → LP-17xxx

---

## Path 4: Privacy / ZK / FHE (Z-Chain)

**"Encrypted execution and private state."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | LP-2400–2499 | ZK & FHE primitives (theory) |
| 3 | [LP-8000](/docs/lp-8000-z-chain-zkvm-specification/) | Z-Chain VM architecture |
| 4 | LP-8100–8199 | ZK execution layers |
| 5 | LP-8300–8399 | Private swaps / lending |
| 6 | LP-8500–8599 | Proof systems & rollups |
| 7 | LP-8600–8699 | Accelerators & hardware |

**Hard Rule**: ZK/FHE stays isolated in 8xxx. Never leaks into other tiers.
**Research** → LP-18xxx

---

## Path 5: Trading / Market Infrastructure

**"Latency, liquidity, price discovery."**

| Step | LP | Topic |
|------|-----|-------|
| 1 | Core Path | (Complete steps above) |
| 2 | [LP-9000](/docs/lp-9000-dex-core-specification/) | DEX / CEX architecture |
| 3 | LP-9001–9003 | Matching engines |
| 4 | LP-9300–9399 | DEX & Oracle precompiles |
| 5 | LP-9400–9499 | Perps & derivatives |
| 6 | LP-9500–9599 | HFT venues |

**MEV** → LP-9800+
**Research** → LP-19xxx

---

## Path 6: Security Engineer / Auditor

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

## Path 7: Investor / Fund / Institutional

**"Where does value accrue and why?"**

| Step | LP | Topic |
|------|-----|-------|
| 1 | [LP-0001](/docs/lp-0001-primary-chain-native-tokens-and-tokenomics/) | Tokenomics |
| 2 | [LP-0000](/docs/lp-0000-network-architecture-and-community-framework/) | Network architecture (skim) |
| 3 | [LP-1000](/docs/lp-1000-p-chain-core-platform-specification/) | Platform economics |
| 4 | LP-3000 | DeFi surface area |
| 5 | [LP-9000](/docs/lp-9000-dex-core-specification/) | Trading liquidity |
| 6 | [LP-2860](/docs/lp-2860-fund-management-index/) | Fund management |
| 7 | [LP-2850](/docs/lp-2850-dao-governance-index/) | DAO governance |
| 8 | [LP-2995](/docs/lp-2995-esg-impact-index/) | ESG & impact |

---

## Path 8: Researcher

**"What's next?"**

Start from any base path, then jump to +10000 offset:

| Research Range | Mirrors | Domain |
|----------------|---------|--------|
| 10xxx | 0xxx | Core/Meta research |
| 11xxx | 1xxx | Platform research |
| 12xxx | 2xxx | Cryptography research |
| 13xxx | 3xxx | Web3/DeFi research |
| 17xxx | 7xxx | MPC research |
| 18xxx | 8xxx | ZK/FHE research |
| 19xxx | 9xxx | Trading research |

---

## Quick Decision Rules

| If your spec is about... | Range |
|--------------------------|-------|
| Math / schemes / primitives | **2xxx** |
| EVM / Solidity / DeFi apps | **3xxx** |
| MPC as a running network | **7xxx** |
| ZK / FHE / private compute | **8xxx** |
| Trading latency / orderbooks | **9xxx** |
| Unfinished / experimental | **+10000** |
| Funds / DAOs / ESG | **70xxx+** |

---

## Quick Reference Paths

```
Developer:   0000 → 3000 → 3100 → 3300 → 9000
Validator:   0000 → 1000 → 1100 → 0110 → 1500
Trader:      0000 → 3300 → 9000 → 9400 → 9500
Security:    2000 → 2200 → 7000 → 8000 → 6000
Researcher:  10090 → 12xxx → 17xxx → 18xxx → 19xxx
Investor:    0000 → 70000 → 71000 → 72000
```

---

## Key Documents

| Document | Purpose |
|----------|---------|
| **[LP-0099](/docs/lp-0099-lp-numbering-scheme-and-chain-organization/)** | Master numbering scheme v3.3 |
| **[LP-INDEX](./LP-INDEX.md)** | Complete index of all LPs |
| **[LP-50000](/docs/lp-50000-research-index/)** | Research papers index |
| **[LP-2860](/docs/lp-2860-fund-management-index/)** | Fund management |
| **[LP-2850](/docs/lp-2850-dao-governance-index/)** | DAO governance |
| **[LP-2995](/docs/lp-2995-esg-impact-index/)** | ESG & impact |

---

## Getting Help

- **Forum**: [forum.lux.network](https://forum.lux.network) - Discuss proposals
- **Discord**: Community chat and support
- **GitHub**: [github.com/luxfi/lps](https://github.com/luxfi/lps) - Contribute

---

## Contributing Your Own LP

Ready to propose? See:
- **[TEMPLATE.md](./TEMPLATE.md)** - LP template
- **[CONTRIBUTING.md](/docs/CONTRIBUTING.md)** - Contribution guidelines
- **[LP-0099](/docs/lp-0099-lp-numbering-scheme-and-chain-organization/)** - Where your LP should go

---

*Welcome to Lux. Start with Path 0, branch to your specialty, and build the future of finance.*
