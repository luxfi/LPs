# LP Renumbering Diff Table

## Target Scheme (Authoritative)

| Range | Purpose | Rule |
|-------|---------|------|
| 0–99 | Constitutional / Meta | Network identity, LP process |
| 100–999 | Core Protocols | Consensus, validators, epochs |
| 1000–1999 | Chain Specifications | P, X, C chain core specs |
| 2000–2999 | Assets & Tokens | LRC-20, LRC-721, LRC-1155 |
| 3000–3999 | Execution / VM | VM architecture, precompiles |
| 4000–4999 | Cryptography / PQC | Q-Chain, ML-DSA, ML-KEM |
| 5000–5999 | AI / Attestation | A-Chain, TEE |
| 6000–6999 | Bridges & Interop | B-Chain, Warp, Teleport |
| 7000–7999 | Threshold / MPC | T-Chain, FROST, CGGMP |
| 8000–8999 | ZK / Privacy | Z-Chain, ZKVM |
| 9000–9999 | DeFi / Markets | DEX, AMM, lending |
| 10000–19999 | Learning Paths | Non-normative guides |
| 50000+ | Research Indexes | Non-binding references |

---

## ❌ CRITICAL FIXES REQUIRED

### 1. Duplicate LP Number
| Current | Title | Action |
|---------|-------|--------|
| LP-40 | Network Runner & Testing Framework | KEEP as LP-40 |
| LP-40 | Wallet Standards | RENAME to LP-41 |

### 2. ESG in Wrong Range (150-330 → 72xxx or Research)
ESG is policy guidance, not protocol spec. Move to Research or dedicated index.

| Current | New | Title |
|---------|-----|-------|
| 150 | 72150 | Lux Vision Fund ESG Investment Framework |
| 151 | 72151 | Environmental Integrity Investment Policy |
| 152 | 72152 | Social Benefit Investment Policy |
| 153 | 72153 | Governance & Ecosystem Architecture |
| 160 | 72160 | Lux Network Impact Thesis |
| 200 | 72200 | ESG Principles and Commitments |
| 201 | 72201 | Carbon Accounting Methodology |
| 210 | 72210 | Green Compute & Energy Procurement |
| 220 | 72220 | Network Energy Transparency |
| 230 | 72230 | ESG Risk Management |
| 240 | 72240 | Impact Disclosure & Anti-Greenwashing |
| 250 | 72250 | ESG Standards Alignment Matrix |
| 260 | 72260 | Evidence Locker Index |
| 300 | 72300 | Impact Framework & Theory of Change |
| 301 | 72301 | Impact Measurement Methodology |
| 310 | 72310 | Stakeholder Engagement |
| 320 | 72320 | Community Development & Grants |
| 330 | 72330 | Financial Inclusion Metrics |

---

## 🔄 CHAIN SPECS → 1xxx

X-Chain specs should be in Chain Specifications (1xxx), not 2xxx.

| Current | New | Title |
|---------|-----|-------|
| 2011 | 1100 | X-Chain (Exchange Chain) Specification |
| 2036 | 1136 | X-Chain Order-Book DEX API |
| 2037 | 1137 | Native Swap Integration |
| 2100 | 1101 | X-Chain - Core Exchange Specification |

C-Chain core specs should be in Chain Specifications (1xxx).

| Current | New | Title |
|---------|-----|-------|
| 3200 | 1200 | C-Chain - Core EVM Specification |
| 3212 | 1212 | C-Chain (Contract Chain) Specification |
| 3226 | 1226 | C-Chain EVM Equivalence and Core EIPs |

---

## 🔄 TOKEN STANDARDS → 2xxx

All LRC token standards belong in Assets & Tokens (2xxx).

| Current | New | Title |
|---------|-----|-------|
| 3227 | 2027 | LRC Token Standards Adoption |
| 3228 | 2028 | LRC-20 Burnable Token Extension |
| 3229 | 2029 | LRC-20 Mintable Token Extension |
| 3230 | 2030 | LRC-20 Bridgable Token Extension |
| 3231 | 2031 | LRC-721 Burnable Token Extension |
| 3355 | 2155 | LRC-1155 Multi-Token Standard |
| 3500 | 2020 | LRC-20 Fungible Token Standard |
| 3718 | 2718 | Teleport Token Standard |
| 3921 | 2721 | LRC-721 Non-Fungible Token Standard |
| 9070 | 2070 | NFT Staking Standard |
| 9071 | 2071 | Media Content NFT Standard |
| 9072 | 2072 | Bridged Asset Standard |

---

## 🔄 DEFI PROTOCOLS → 9xxx

DeFi protocols currently in 3xxx should move to 9xxx.

| Current | New | Title |
|---------|-----|-------|
| 3700 | 9100 | QuantumSwap DEX Standard |
| 3701 | 9101 | DeFi Protocol Integration Standard |
| 3702 | 9102 | NFT Marketplace Standard |
| 3707 | 9107 | Cross-Chain Bridge Standard |
| 3708 | 9108 | Alchemix Self-Repaying Loans |
| 3709 | 9109 | Compound Lending Protocol |
| 3710 | 9110 | Teleport Protocol Standard |
| 8400 | 9400 | AMM Protocol with Privacy |
| 8401 | 9401 | Confidential Lending Protocol |
| 8402 | 9402 | Zero-Knowledge Swap Protocol |
| 8403 | 9403 | Private Staking Mechanisms |

---

## 🔄 DAO/GOVERNANCE → 71xxx

DAO governance modules are policy, not protocol.

| Current | New | Title |
|---------|-----|-------|
| 3720 | 71020 | Lux Vote Interface |
| 3721 | 71021 | Azorius Governance Module |
| 3722 | 71022 | Voting Strategies Standard |
| 3723 | 71023 | Freeze Voting & Guard System |
| 3724 | 71024 | DAO Account Abstraction |
| 3725 | 71025 | @luxdao/sdk TypeScript SDK |

---

## 🔄 ACCOUNT ABSTRACTION → 3xxx (Execution)

These are execution layer specs, stay in 3xxx.

| Current | New | Title |
|---------|-----|-------|
| 3703 | 3103 | Account Abstraction (ERC-4337) |
| 3704 | 3104 | Safe Multisig Standard |
| 3706 | 3106 | Lamport One-Time Signatures Library |

---

## ✅ ALREADY CORRECT

### Constitutional/Meta (0-99) ✅
- LP-0 to LP-9: Core architecture
- LP-39-50: Developer tools
- LP-70-99: Security, key management

### Core Protocols (100-999) ✅
- LP-110-116: Consensus protocols (Quasar, Photon, Flare, Wave, Focus, Horizon, Prism)

### P-Chain (1000-1099) ✅
- LP-1000, 1010, 1024, 1033, 1034, 1181, 1605

### Execution/VM (3000-3999) ✅
- LP-3000-3001: VM specs
- LP-3225, 3232, 3235: Rollup, sync
- LP-3276: RNG
- LP-3299, 3318: Upgrade mapping, compatibility
- LP-3376, 3404, 3426: Gas pricing, curves, block times
- LP-3511-3514: Precompiles
- LP-3520, 3526, 3527: Gas, migration, Verkle
- LP-3714-3717: More precompiles
- LP-3804, 3806: State sync, Verkle trees

### Q-Chain/PQC (4000-4999) ✅
- All LP-4xxx are correctly placed

### A-Chain/AI (5000-5999) ✅
- All LP-5xxx are correctly placed

### B-Chain/Bridge (6000-6999) ✅
- All LP-6xxx are correctly placed

### T-Chain/MPC (7000-7999) ✅
- All LP-7xxx are correctly placed

### Z-Chain/ZK (8000-8999) - PARTIAL
- LP-8000, 8045, 8046: ZKVM ✅
- LP-8400-8403: DeFi with privacy → MOVE to 9xxx
- LP-8500-8505: L2/Rollups ✅

### DEX/Markets (9000-9999) ✅
- LP-9000-9099: DEX core
- (Needs DeFi from 3xxx and 8xxx added)

### Learning Paths (10000-19999) ✅
- LP-10000-10009: Learning paths
- LP-10090-10097: Research papers

### Research Indexes (50000+) ✅
- LP-50000, 70000, 71000, 72000: Indexes

---

## Summary Statistics

| Category | Current Count | After Fix |
|----------|---------------|-----------|
| Wrong range (needs move) | 57 | 0 |
| Duplicates | 1 | 0 |
| Legacy indexes | 4 | 4 (marked Research) |
| Total LPs | 239 | 239 |

---

## Implementation Order

1. **Phase 1**: Fix duplicate LP-40
2. **Phase 2**: Move ESG (150-330) → 72xxx
3. **Phase 3**: Move X-Chain specs (2xxx) → 1xxx
4. **Phase 4**: Move C-Chain core specs → 1xxx
5. **Phase 5**: Move token standards → 2xxx
6. **Phase 6**: Move DeFi → 9xxx
7. **Phase 7**: Move DAO → 71xxx
8. **Phase 8**: Reorder within Execution (3xxx)
9. **Phase 9**: Update LP-99 as canonical anchor
10. **Phase 10**: Add LP-lint rules
