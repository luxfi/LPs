---
lp: 99
title: LP Numbering Scheme and Chain Organization
description: Canonical governance anchor defining LP numbering, status semantics, and normative classification
author: Lux Core Team
status: Living
tags: [core, meta, governance]
type: Meta
created: 2025-01-15
updated: 2025-12-25
order: 99
---

# LP-0099: LP Numbering Scheme (Canonical)

## Abstract

This LP is the **canonical governance anchor** for all Lux Proposals. It defines:
1. Reserved number ranges (hard rules)
2. Status semantics (enforceable)
3. Normative vs non-normative classification
4. Decision rules for LP placement

**Anything outside its designated range is invalid and MUST be renumbered.**

## Motivation

### Problems Solved

| Problem | Solution |
|---------|----------|
| Numbering drift | Reserved ranges with hard boundaries |
| Category bleed | Domain-first, not chain-first organization |
| Lifecycle confusion | Strict status semantics |
| Mixed normative/research | Explicit classification |

### Design Principles

1. **Domain-first**: Group by semantic domain, not chain identity
2. **Normative separation**: Standards vs research vs guides
3. **Machine-navigable**: Predictable ranges for tooling
4. **Protocol-enforceable**: Clear rules, no ambiguity

---

## Specification

### 🔒 Reserved Ranges (Hard Rules)

| Range | Purpose | Status Allowed |
|-------|---------|----------------|
| **0–99** | Constitutional / Meta | Final, Implemented, Living |
| **100–999** | Core Protocols | Draft, Review, Last Call, Final, Implemented |
| **1000–1999** | Chain Specifications | Draft, Review, Last Call, Final, Implemented |
| **2000–2999** | DAO, Governance & ESG | Draft, Review, Last Call, Final, Implemented, Research |
| **3000–3999** | Solidity, Tokens & Web3 | Draft, Review, Last Call, Final, Implemented |
| **4000–4999** | Cryptography / PQC | Draft, Review, Last Call, Final, Implemented |
| **5000–5999** | AI / Attestation | Draft, Review, Last Call, Final, Implemented |
| **6000–6999** | Bridges & Interop | Draft, Review, Last Call, Final, Implemented |
| **7000–7999** | Threshold / MPC | Draft, Review, Last Call, Final, Implemented |
| **8000–8999** | ZK / Privacy | Draft, Review, Last Call, Final, Implemented |
| **9000–9999** | DeFi / Markets | Draft, Review, Last Call, Final, Implemented |
| **10000–19999** | Learning Paths | Draft, Review, Final, Living |
| **50000–59999** | Research Indexes | Research |

**Rule**: LPs outside their designated range are INVALID.

---

### Status Semantics (EIP-Aligned)

The Lux LP process follows the [EIP standard flow](https://eips.ethereum.org/EIPS/eip-1) for familiarity with the EVM community.

Each LP MUST declare exactly one status:

| Status | Meaning | Binding? | Next Status |
|--------|---------|----------|-------------|
| **Idea** | Pre-proposal discussion | No | Draft |
| **Draft** | Actively evolving | No | Review, Withdrawn |
| **Review** | Ready for peer review (pre-implementation) | No | Last Call, Draft, Withdrawn |
| **Last Call** | Final review window (14 days) | No | Final, Implemented, Review |
| **Final** | Normative standard (spec complete) | Yes | Implemented, Living |
| **Implemented** | Deployed to mainnet | Yes | Living |
| **Living** | Continually updated (process docs, curricula) | Yes | N/A |
| **Stagnant** | Inactive 6+ months | No | Draft, Withdrawn |
| **Withdrawn** | Author withdrew proposal | No | N/A |
| **Superseded** | Replaced by another LP | No | N/A |
| **Research** | Informational only | Never | Draft |

#### Status Progression

```
Idea → Draft → Review → Last Call → Final → Implemented
         ↓        ↓         ↓         ↓         ↓
     Withdrawn  Draft    Review    Living    Living
         ↑
      Stagnant (after 6 months inactivity)
```

#### Special Statuses

**Implemented**: The most common final state for technical LPs. Indicates the spec is deployed on mainnet with working code. Use this for all deployed features.

**Living Documents**: Designated for continuously updated content:
- Process documents (LP-0099, governance)
- Learning paths (curricula that evolve)
- Research indexes (maintained references)
- Must track changes via git history

**Research**: Informational content. Can transition to Draft when ready to become a normative standard.

**Review vs Draft**:
- **Draft**: Actively being written, not ready for feedback
- **Review**: Ready for peer review BEFORE implementation

**Hard Rules**:
- Research Indexes (50000+) are Research only (can transition to 0-9999 to become normative)
- Only ranges 0–9999 can reach Final/Implemented status
- Learning Paths (10000+) can be Draft, Review, Final, or Living

---

### Range Details

#### 0–99: Constitutional / Meta

**Purpose**: What Lux IS — network identity, LP process, governance.

| Sub-range | Purpose |
|-----------|---------|
| 0–9 | Core architecture, tokenomics |
| 10–49 | Developer tools, SDKs |
| 50–89 | Wallet, key management, security |
| 90–99 | Meta (this document), indexes |

**Status**: Final or Living. These are foundational. Living status for continuously updated documents (e.g., LP-0099).

---

#### 100–999: Core Protocols

**Purpose**: HOW Lux operates — consensus, validators, epochs.

| Sub-range | Purpose |
|-----------|---------|
| 100–199 | Consensus protocols (Quasar, Photon, Flare) |
| 200–299 | Validator coordination |
| 300–399 | Epoch management |
| 400–599 | (Reserved) |
| 600–799 | Protocol extensions |
| 800–999 | (Reserved) |

**Rule**: Core protocol changes require reference implementation.

---

#### 1000–1999: Chain Specifications

**Purpose**: Chain-specific core specs (P, X, C identity).

| Sub-range | Purpose |
|-----------|---------|
| 1000–1099 | P-Chain (Platform) |
| 1100–1199 | X-Chain (Exchange) |
| 1200–1299 | C-Chain (Contract) |
| 1300–1399 | (Reserved for future chains) |
| 1400–1999 | Chain extensions |

**Rule**: One chain = one sub-range. No mixing.

---

#### 2000–2999: DAO, Governance & ESG

**Purpose**: On-chain governance, DAOs, treasury, and sustainability (non-normative).

| Sub-range | Purpose |
|-----------|---------|
| 2000–2099 | DAO platforms |
| 2100–2199 | Voting systems |
| 2200–2299 | Treasury management |
| 2300–2799 | (Reserved) |
| 2800–2849 | DAO governance (Azorius, voting) |
| 2850–2899 | Fund management indexes |
| 2900–2989 | ESG framework (carbon, green compute) |
| 2990–2999 | ESG impact & measurement |

**Rule**: Governance and ESG are domain specs. Token standards go in 3xxx.

---

#### 3000–3999: Solidity, Tokens & Web3

**Purpose**: Token standards (LRC-20/721/1155), Solidity contracts, Web3 interfaces.

| Sub-range | Purpose |
|-----------|---------|
| 3000–3019 | Token index, standards overview |
| 3020–3069 | LRC-20 (fungible tokens) |
| 3070–3099 | Token extensions (staking, media) |
| 3100–3154 | Account abstraction, multisig |
| 3155–3199 | LRC-1155 (multi-token) |
| 3200–3399 | Contract patterns, security |
| 3400–3499 | Precompiles (curves, crypto) |
| 3500–3599 | Signature precompiles |
| 3600–3699 | Messaging precompiles |
| 3700–3720 | Teleport, bridged assets |
| 3721–3799 | LRC-721 (NFTs) |
| 3800–3999 | Web3 extensions |

**Rule**: All Solidity/token/Web3 standards go in 3xxx.

---

#### 4000–4999: Cryptography / PQC (Q-Chain)

**Purpose**: Post-quantum cryptography, Q-Chain specs.

| Sub-range | Purpose |
|-----------|---------|
| 4000–4099 | Q-Chain core |
| 4100–4199 | ML-KEM (key encapsulation) |
| 4200–4299 | ML-DSA (signatures) |
| 4300–4399 | SLH-DSA (hash-based) |
| 4400–4499 | Hybrid schemes |
| 4500–4999 | PQC extensions |

**Rule**: Post-quantum only. Classical crypto in 3xxx precompiles.

---

#### 5000–5999: AI / Attestation (A-Chain)

**Purpose**: AI compute, TEE, attestation.

| Sub-range | Purpose |
|-----------|---------|
| 5000–5099 | A-Chain core |
| 5100–5199 | AI integration (LLM gateway) |
| 5200–5299 | AI mining |
| 5300–5399 | TEE |
| 5400–5499 | Confidential compute |
| 5500–5599 | GPU acceleration |
| 5600–5699 | Training ledger |
| 5700–5999 | (Reserved) |

---

#### 6000–6999: Bridges & Interop (B-Chain)

**Purpose**: Cross-chain messaging, bridges.

| Sub-range | Purpose |
|-----------|---------|
| 6000–6099 | B-Chain core |
| 6100–6199 | Teleport protocol |
| 6200–6299 | Warp messaging |
| 6300–6399 | Asset registry |
| 6400–6499 | Security framework |
| 6500–6699 | Bridge SDK |
| 6700–6999 | (Reserved) |

---

#### 7000–7999: Threshold / MPC (T-Chain)

**Purpose**: Threshold signatures, MPC, custody.

| Sub-range | Purpose |
|-----------|---------|
| 7000–7099 | T-Chain core |
| 7100–7199 | Signing networks (FROST, CGGMP) |
| 7200–7299 | DKG & resharing |
| 7300–7399 | Custody, vaults |
| 7400–7499 | KMS integration |
| 7500–7599 | MPC bridges |
| 7600–7699 | MPC swaps |
| 7700–7999 | (Reserved) |

**Rule**: MPC as network/service = 7xxx. MPC math only = 4xxx.

---

#### 8000–8999: ZK / Privacy (Z-Chain)

**Purpose**: Zero-knowledge, encrypted execution.

| Sub-range | Purpose |
|-----------|---------|
| 8000–8099 | Z-Chain core |
| 8100–8199 | Validity proofs (SNARKs, STARKs) |
| 8200–8299 | Fraud proofs |
| 8300–8399 | (Reserved) |
| 8400–8499 | Encrypted execution (FHE) |
| 8500–8599 | L2/Rollups |
| 8600–8699 | FHE accelerators |
| 8700–8999 | (Reserved) |

**Hard Rule**: ZK/FHE never leak into other ranges except by reference.

---

#### 9000–9999: DeFi / Markets

**Purpose**: DEX, AMM, lending, trading infrastructure.

| Sub-range | Purpose |
|-----------|---------|
| 9000–9049 | DEX core |
| 9050–9099 | Oracles |
| 9100–9199 | DeFi protocols (AMM, lending) |
| 9200–9299 | Operations, risk |
| 9300–9399 | DeFi precompiles |
| 9400–9499 | Perpetuals, derivatives |
| 9500–9599 | HFT venues |
| 9600–9699 | Market making |
| 9700–9799 | CEX integration |
| 9800–9899 | MEV |
| 9900–9999 | (Reserved) |

**Rule**: Latency, throughput, market microstructure = 9xxx.

---

#### 10000–19999: Learning Paths

**Purpose**: Educational guides and technical tutorials.

| Sub-range | Purpose |
|-----------|---------|
| 10000–10099 | Indexes, paths |
| 10100–19999 | Topic-specific guides |

**Status**: Draft, Review, Final, or Living.
- **Final**: Complete, accurate tutorials that teach normative standards
- **Living**: Continuously updated curricula (recommended for active learning paths)

---

#### 50000+: Research Indexes

**Purpose**: Non-binding references and research papers.

| Range | Purpose |
|-------|---------|
| 50000–59999 | Research papers |

**Status**: Research only.
- Informational content, never normative
- Can transition to Draft → Final when ready to become normative

---

## Decision Rules

| If your spec is about... | Range | Can be Implemented? | Can be Living? |
|--------------------------|-------|---------------------|----------------|
| Network identity, LP process | 0–99 | Yes | Yes |
| Consensus, validators, epochs | 100–999 | Yes | No |
| P/X/C chain core identity | 1000–1999 | Yes | No |
| Tokens, DAO, ESG | 2000–2999 | Yes | No |
| VM, precompiles, execution | 3000–3999 | Yes | No |
| Post-quantum cryptography | 4000–4999 | Yes | No |
| AI, attestation, TEE | 5000–5999 | Yes | No |
| Bridges, cross-chain | 6000–6999 | Yes | No |
| MPC, threshold signing | 7000–7999 | Yes | No |
| ZK, privacy, FHE | 8000–8999 | Yes | No |
| DeFi, trading, markets | 9000–9999 | Yes | No |
| Learning guides | 10000–19999 | No | Yes |
| Research, indexes | 50000+ | **No** | **No** |

---

## Validation Rules (LP-lint)

```yaml
# LP-lint rules (machine-enforceable)
rules:
  range_check:
    - "LP 0-99 MUST have status: Living or Living"
    - "LP 50000+ MUST have status: Research"
    - "LP outside defined range is INVALID"

  status_check:
    - "status MUST be one of: Idea, Draft, Review, Last Call, Final, Implemented, Living, Stagnant, Withdrawn, Superseded, Research"
    - "Research LPs cannot reference normative behavior"
    - "Living LPs must be in range 0-99 or 10000-19999"
    - "Implemented status indicates deployed to mainnet"

  progression_check:
    - "Draft can move to: Review, Withdrawn, Stagnant"
    - "Review can move to: Last Call, Draft, Withdrawn"
    - "Last Call can move to: Final, Implemented, Review"
    - "Final can move to: Implemented, Living"
    - "Implemented can move to: Living"
    - "Stagnant can move to: Draft, Withdrawn"

  content_check:
    - "Final LPs MUST have reference implementation OR test vectors"
    - "Last Call LPs MUST specify review-period-end date"
    - "Superseded LPs MUST reference replacement LP"
    - "No duplicate LP numbers allowed"
```

---

## Migration History

### v6.0 (Current - 2025-12-25)
- **EIP-Aligned Status Semantics**: Full alignment with Ethereum EIP-1 process
- Added statuses: Review, Last Call, **Implemented**, Living, Stagnant, Withdrawn
- LP-0099 itself changed from Final → Living (continually updated)
- Learning Paths (10000+) can now be Draft, Review, Final, or Living
- Research stays in Research status (transitions to normative range when ready)
- Added status progression rules matching EIP-1 flow
- **Implemented** is the common final state for deployed specs (vs Final for spec-complete)

### v5.1
- DAO (71xxx) → 2800-2849
- ESG (72xxx) → 2900-2999
- Removed 70000-79999 range

### v5.0
- Applied canonical renumbering
- ESG, DeFi, tokens moved to proper ranges
- See `docs/LP-RENUMBERING-DIFF.md`

---

## Backwards Compatibility

- Legacy LP numbers remain valid references
- Superseded LPs redirect to new numbers
- Old URLs 301-redirect to canonical locations

---

## Security Considerations

This is a meta/organizational proposal. No direct security impact.

Indirect impact: Clear LP organization prevents:
- Normative confusion (implementing research as spec)
- Scope creep (mixing domains)
- Governance attacks (hiding changes in wrong categories)

---

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
