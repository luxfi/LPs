---
lp: 0
title: Lux Network Architecture & Standards Framework
tags: [network, architecture, meta, governance, standards]
description: Foundational document establishing Lux Network's mission, the LP standards process, multi-chain architecture, and research domains.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Meta
created: 2025-01-23
updated: 2025-12-19
order: 0
tier: core
---

## Abstract

LP-0000 is the genesis document for Lux Network — establishing our mission, the standards process, and the technical architecture that makes it possible.

Lux is a multi-chain blockchain platform designed for institutional-grade applications requiring quantum-resistant security, sub-second finality, and seamless cross-chain interoperability. The network achieves this through a modular architecture where specialized chains handle distinct workloads (execution, bridging, AI, threshold cryptography) while sharing security through unified consensus.

This document defines:
1. **Mission & Ethos**: Why Lux exists and our core principles
2. **Standards Process**: How LPs (Lux Proposals) govern the network's evolution
3. **Architecture Overview**: The multi-chain topology and consensus model
4. **Research Domains**: The technical subjects that LPs address

## Motivation

Every blockchain ecosystem requires a canonical reference document that establishes foundational principles, governance processes, and architectural decisions. Without such a document:

- New contributors lack context for design decisions
- Standards become inconsistent across proposals
- Architectural evolution lacks coordination
- Mission alignment drifts over time

LP-0000 addresses this by serving as the **genesis specification** — the document from which all other LPs derive authority and context. It establishes:

1. **Why we build**: Mission, principles, and impact commitments
2. **How we coordinate**: The LP standards process and governance
3. **What we build**: Multi-chain architecture and chain responsibilities
4. **Where knowledge lives**: Research domain organization

This document is intentionally comprehensive. Other LPs can be terse, referencing LP-0000 for shared context.

## Part 1: Mission & Ethos

### Why Lux Exists

Blockchain infrastructure today faces four fundamental challenges:

1. **Quantum Vulnerability**: Existing networks rely on cryptography that quantum computers will break
2. **Fragmentation**: Different chains for different use cases with no secure interoperability
3. **Institutional Gaps**: Missing infrastructure for compliance, custody, and enterprise integration
4. **Impact Blindness**: Networks that ignore environmental sustainability and social responsibility

Lux addresses these by building **infrastructure-first** — treating consensus, cryptography, bridging, custody, and **impact** as foundational systems rather than afterthoughts.

### Impact-First Development

Lux integrates environmental and social impact into its core architecture, not as an afterthought but as a design principle:

- **Sustainable Consensus**: Quasar achieves finality without energy-intensive proof-of-work
- **Carbon Transparency**: On-chain accounting for network energy consumption (see LP-801)
- **Green Compute**: Validator incentives aligned with renewable energy usage (see LP-810)
- **Public Goods**: Treasury allocation for ecosystem grants and community development (see LP-920)
- **Financial Inclusion**: Infrastructure designed for global accessibility (see LP-930)

The complete Impact Framework is defined in the ESG LP series (LP-750 to LP-930), including:
- **LP-760**: Lux Network Impact Thesis
- **LP-800**: ESG Principles & Commitments
- **LP-900**: Impact Framework & Theory of Change

### Financial Inclusion Mission

Nearly **800 million Muslims** worldwide remain unbanked — excluded from traditional financial systems that conflict with Islamic finance principles (prohibition of interest/riba). Billions more across marginalized communities lack access to banking infrastructure entirely: the rural poor, refugees, the undocumented, and those in economies with unstable currencies.

Lux addresses this through:

- **Sharia-Compliant DeFi**: Native support for profit-sharing (Mudarabah), cost-plus financing (Murabaha), and Islamic lending patterns without interest
- **Low-Barrier Access**: Sub-cent transaction fees and mobile-first wallets enabling participation without bank accounts
- **Stablecoin Infrastructure**: Censorship-resistant value storage for populations facing currency collapse or capital controls
- **Remittance Corridors**: Near-instant, low-cost cross-border transfers for migrant worker communities
- **Identity Primitives**: Self-sovereign identity enabling the undocumented to build financial history

Beyond access, Lux invests in **human capital development**:

- **Web3 Training Programs**: Partnership-funded bootcamps for blockchain development, smart contract auditing, and DeFi operations
- **Protocol Scholarships**: Grants for underrepresented developers to contribute to core protocol development
- **Regional Developer Hubs**: Infrastructure support for tech communities in underserved regions
- **Open Educational Resources**: Free, multilingual documentation and tutorials

Our thesis: financial infrastructure and technical education together create compounding opportunity — access to capital enables entrepreneurship, technical skills enable economic mobility, and both together transform communities.

See **LP-760 (Network Impact Thesis)** and **LP-930 (Financial Inclusion Metrics)** for detailed frameworks.

### Ecosystem Partners

Lux operates alongside two aligned organizations that extend the network's capabilities:

**Zoo Labs Foundation** (zoo.ngo)
A non-profit open research network advancing decentralized AI and decentralized science (DeSci). Zoo operates a flagship Layer 2 on Lux Network, providing:

- **ZIPs** (Zoo Improvement Proposals): Governance at zips.zoo.ngo
- **Zen LLM Family**: Open-source large language models (built on Qwen3+)
- **Frontier AI Research**: Cutting-edge experiments in DeAI
- **DeSci Infrastructure**: Tools for reproducible, transparent scientific research
- **Impact Research**: ESG methodologies and measurement frameworks

Zoo Labs' L2 demonstrates Lux's multi-chain architecture while advancing mission-aligned AI research.

**Hanzo AI** (hanzo.ai | hanzo.network)
A Techstars '17 backed AI company building frontier AI infrastructure, including:

- **Hanzo Network**: AI-native blockchain for model verification and inference consensus
- **LLM Gateway (HIP-4)**: Access to 100+ LLM providers via unified API
- **MCP Infrastructure**: Model Context Protocol for AI agent coordination
- **Jin Architecture**: Unified multimodal AI framework
- **Agent Frameworks**: Enterprise-grade AI agent orchestration

Hanzo provides the AI infrastructure that powers LP-5106 (LLM Gateway Integration), enabling smart contracts to access AI inference, validators to leverage AI monitoring, and developers to use AI-assisted tooling.

Together, Lux (blockchain infrastructure), Zoo Labs (open research), and Hanzo (AI infrastructure) form a vertically-integrated stack for building the decentralized intelligent economy.

### Core Principles

**1. Security by Default**
- Post-quantum cryptography (ML-KEM, ML-DSA, SLH-DSA) as first-class primitives
- Threshold signatures for distributed custody without single points of failure
- Formal verification where possible, extensive testing always

**2. Modularity**
- Chains are specialized, not monolithic
- Consensus, execution, and cryptography are cleanly separated
- Components can be upgraded independently

**3. Interoperability**
- Native cross-chain messaging via Warp protocol
- Asset movement through dedicated bridging infrastructure
- No "walled garden" — chains communicate trustlessly

**4. Open Development**
- All specifications are public LPs
- Reference implementations are open source
- Community governance through structured proposal process

**5. Institutional Grade**
- Sub-second finality for real-world applications
- Compliance primitives (attestations, identity, audit trails)
- Enterprise-ready custody and key management

**6. Impact & Sustainability**
- ESG-compliant by design, not by accident
- Carbon-aware consensus and compute allocation
- Public goods funding through protocol-level mechanisms
- Measurable impact metrics aligned with UN SDGs

## Part 2: The LP Standards Process

### What is an LP?

An LP (Lux Proposal) is a design document describing a feature, standard, or process for Lux Network. LPs are the primary mechanism for:

- Proposing new technical standards
- Documenting design decisions
- Collecting community input
- Coordinating network upgrades

### LP Types

| Type | Purpose | Examples |
|------|---------|----------|
| **Standards Track** | Technical specifications requiring implementation | Consensus protocols, token standards, precompiles |
| **Meta** | Process and governance | This document, contribution guidelines |
| **Informational** | Guidelines and best practices | Security recommendations, design patterns |

### Standards Track Categories

LP numbers follow **dependency order** — lower numbers are foundations that higher numbers build upon.

#### 0xxx: Meta / Governance / Index
Core process documents, taxonomy, governance rules. Start here.

#### 1xxx: Foundations (Cross-Chain Primitives)
Cryptographic primitives, formal security models, execution invariants, economic/game-theoretic primitives. Things every chain depends on but no single chain owns.

**Contents**: Hash/sig/commitment basics, MPC math (not custody ops), ZK arithmetization theory, PQ definitions (not deployment).

| Category | Description | LP Range |
|----------|-------------|----------|
| **Meta/Process** | Taxonomy, governance, review rules | 0000-0099 |
| **Consensus** | Agreement, finality, validators | 0100-0199 |
| **Network** | P2P, messaging, topology | 0200-0499 |
| **Foundations** | Cryptographic primitives, proofs, math | 1000-1999 |

#### Chain Standards (Dependency Order)

| Chain | Description | LP Range | Depends On |
|-------|-------------|----------|------------|
| **Q-Chain** | Post-quantum keys, signatures, addresses, hybrid modes, migration | 2000-2999 | 1xxx |
| **C-Chain** | EVM execution, LRC standards, accounts, gas, Web3, wallets | 3000-3999 | 1xxx, 2xxx |
| **Z-Chain** | ZK proofs, FHE, privacy protocols, zkVM, verifier costs | 4000-4999 | 1xxx, 2xxx, 3xxx |
| **T-Chain** | Threshold signing, DKG ceremonies, custody, recovery, rotation | 5000-5999 | 1xxx, 2xxx, 4xxx |
| **B-Chain** | Cross-chain messaging, finality proofs, relayers, fraud proofs | 6000-6999 | 2xxx, 4xxx, 5xxx |
| **A-Chain** | AI agents, policy engines, verifiable AI, automated governance | 7000-7999 | All above |
| **Governance** | DAO, voting, ESG, ops, monitoring, upgrades, kill switches | 8000-8999 | All above |
| **DEX/Markets** | AMMs, orderbooks, MEV mitigation, oracles, liquidation | 9000-9999 | 3xxx, 6xxx |

#### Learning Order

```
1xxx Foundations
    ↓
2xxx Q-Chain (PQ Identity)
    ↓
3xxx C-Chain (EVM / LRC)
    ↓
4xxx Z-Chain (Privacy)
    ↓
5xxx T-Chain (Threshold)
    ↓
6xxx B-Chain (Bridges)
    ↓
7xxx A-Chain (AI)
    ↓
8xxx Governance
    ↓
9xxx Markets
```

### Meta & Educational Categories

| Category | Description | LP Range |
|----------|-------------|----------|
| **Learning Paths** | Educational resources, tutorials | 10000-10099 |
| **Research** | Experimental proposals, papers | 10100-10999 |

### Dependency Rules

**Rule 1 — Ownership**: A doc lives in the lowest layer that owns the invariant it defines.

**Rule 2 — Declared Dependencies**: Every LP must declare its chain dependencies:
```yaml
requires:
  - chain: Q
  - chain: Z
```

### LP Lifecycle

```markdown
 Draft ----> Review ----> Last Call ----> Final
   |           |             |
   v           v             v
Withdrawn   Stagnant     Superseded
```

**Draft**: Initial submission, open for revision
**Review**: Formal technical and community review
**Last Call**: 14-day final comment period before finalization
**Final**: Ratified and ready for implementation

### Creating an LP

```bash
cd ~/work/lux/lps

# Create new LP via interactive wizard
make new

# Validate LP format
make validate FILE=LPs/lp-N.md

# Run all pre-PR checks
make pre-pr
```

### Required Sections

Every LP must include:

1. **Abstract**: ~200 word summary
2. **Motivation**: Why this LP is needed
3. **Specification**: Technical details
4. **Rationale**: Design decisions explained
5. **Backwards Compatibility**: Migration considerations
6. **Security Considerations**: Risk analysis
7. **Test Cases**: For Standards Track
8. **Reference Implementation**: Recommended

### Governance

- **Discussion**: Forum at forum.lux.network
- **Submission**: PR to github.com/luxfi/lps
- **Review**: Technical editors verify format, community evaluates merit
- **On-chain**: Critical changes require governance vote (10M LUX threshold, 75% approval)

## Part 3: Network Architecture

### Multi-Chain Topology

Lux implements a heterogeneous multi-chain architecture where each chain runs a specialized Virtual Machine (VM) optimized for its workload.

```
+=====================================================================+
|                         PRIMARY NETWORK                             |
+---------------------+---------------------+-------------------------+
|      P-Chain        |      C-Chain        |       X-Chain           |
|    (Platform)       |     (Contract)      |      (Exchange)         |
+---------------------+---------------------+-------------------------+
| - Validator mgmt    | - EVM execution     | - Asset transfers       |
| - Staking           | - Smart contracts   | - UTXO model            |
| - Chain creation    | - DeFi protocols    | - High throughput       |
| - Network config    | - Precompiles       | - Atomic swaps          |
+---------------------+---------------------+-------------------------+
                              |
            +-----------------+-----------------+
            |                 |                 |
            v                 v                 v
+---------------------+ +--------------+ +------------------+
|      T-Chain        | |   Q-Chain    | |     B-Chain      |
|    (Threshold)      | |  (Quantum)   | |    (Bridge)      |
+---------------------+ +--------------+ +------------------+
| - FROST/CGGMP       | | - ML-KEM     | | - Cross-chain    |
| - Ringtail          | | - ML-DSA     | | - Asset registry |
| - MPC custody       | | - SLH-DSA    | | - Teleport       |
| - Key management    | | - Quantum-safe| | - Message relay  |
+---------------------+ +--------------+ +------------------+
            |                 |                 |
            v                 v                 v
+---------------------+ +--------------+ +------------------+
|      A-Chain        | |   Z-Chain    | |     D-Chain      |
|  (AI/Attestation)   | |    (ZK)      | |     (DEX)        |
+---------------------+ +--------------+ +------------------+
| - Model verification| | - zkVM       | | - Order books    |
| - Training ledgers  | | - SNARKs     | | - Matching engine|
| - TEE attestation   | | - Validity   | | - Perpetuals     |
| - Confidential AI   | | - Private exec| | - HFT support    |
+---------------------+ +--------------+ +------------------+
```

### Virtual Machine Implementation

Each chain runs a dedicated VM from the node codebase:

| Chain | VM | Location | Purpose |
|-------|-----|----------|---------|
| P-Chain | platformvm | `vms/platformvm/` | Validator sets, staking, L1/L2/L3 chains |
| C-Chain | cchainvm | `vms/cchainvm/` | EVM-compatible smart contracts |
| X-Chain | exchangevm | `vms/exchangevm/` | UTXO-based asset exchange |
| T-Chain | thresholdvm | `vms/thresholdvm/` | Threshold signatures |
| Q-Chain | quantumvm | `vms/quantumvm/` | Post-quantum cryptography |
| B-Chain | bridgevm | `vms/bridgevm/` | Cross-chain bridging |
| A-Chain | aivm | `vms/aivm/` | AI attestation |
| Z-Chain | zkvm | `vms/zkvm/` | Zero-knowledge proofs |
| D-Chain | dexvm | `vms/dexvm/` | Decentralized exchange |
| K-Chain | kchainvm | `vms/kchainvm/` | Key management |
| G-Chain | graphvm | `vms/graphvm/` | GraphQL indexing |

### Quasar Consensus

Lux uses **Quasar**, a unified consensus protocol achieving sub-second finality through a physics-inspired multi-phase architecture:

```sql
PHOTON ------> WAVE ------> FOCUS
(Select)      (Vote)      (Converge)
                              |
                              v
 FLARE <------ HORIZON <---- PRISM
(Commit)      (Finality)    (DAG)
```

| Component | Function | LP |
|-----------|----------|-----|
| **Photon** | VRF-based proposer selection weighted by stake and performance | LP-111 |
| **Wave** | FPC threshold voting with phase-dependent thresholds | LP-113 |
| **Focus** | Confidence accumulation through consecutive successes | LP-114 |
| **Prism** | DAG geometry: frontiers, cuts, and slicing | LP-116 |
| **Horizon** | Finality predicates: certificates and skip detection | LP-115 |
| **Flare** | Cascading finalization in causal order | LP-112 |

**Performance Characteristics**:
- Time to finality: 400-800ms
- Message complexity: O(kn) where k=20 samples
- Byzantine tolerance: f < n/3
- Rounds to finality: 3-5 typical

See LP-110 for the complete Quasar specification.

### Cross-Chain Communication

**Warp Messaging**: Native cross-chain message protocol
- BLS aggregate signatures for efficient verification
- Validator set attestation
- Low-latency message delivery

**Teleport Protocol**: Asset bridging via B-Chain
- MPC-secured custody
- Asset registry for canonical mappings
- Emergency recovery mechanisms

**ICM (Inter-Chain Messaging)**: Application-level messaging
- Standardized message formats
- Relayer infrastructure
- Fee abstraction

## Part 4: Research Domains

LPs are organized by research domain — distinct knowledge areas that may span multiple chains.

### Subjects (Research Domains)

| Subject | Description | Key LPs |
|---------|-------------|---------|
| **Consensus Systems** | Agreement, finality, validators | LP-110 to LP-116 |
| **Threshold Cryptography** | FROST, CGGMP, Ringtail, distributed signing | LP-7100+ |
| **Multi-Party Computation** | General secure computation | LP-7000+ |
| **Key Management** | K-Chain, HSM, policy engines | LP-7300+ |
| **Post-Quantum Cryptography** | ML-KEM, ML-DSA, SLH-DSA | LP-311, LP-312, LP-313 |
| **Zero-Knowledge Proofs** | SNARKs, STARKs, zkVM | LP-8000+ |
| **Cryptography** | Curves, hashes, signatures | LP-200+ |
| **AI & Attestation** | Model verification, training ledgers | LP-5000+ |
| **Bridging Systems** | Asset movement, Teleport | LP-6000+ |
| **Interoperability** | Warp, ICM, message formats | LP-600+ |

### Product Areas

| Area | Description | Key LPs |
|------|-------------|---------|
| **Markets & DeFi** | AMMs, lending, derivatives | LP-2500+ |
| **DEX & Trading** | Order books, matching, HFT | LP-9000+ |
| **Assets & Tokens** | LRC-20, LRC-721, LRC-1155 | LP-3020, LP-3721, LP-3675 |
| **Wallets & Identity** | Multisig, AA, DIDs | LP-2600+ |
| **Governance & Impact** | DAOs, voting, ESG, sustainability | LP-750 to LP-930 |
| **Privacy** | FHE, TEE, confidential compute | LP-8300+ |
| **Developer Platform** | SDKs, CLIs, testing | LP-5100+ |
| **Security** | Audits, bug bounties | LP-5400+ |

### Impact & ESG Framework

Lux maintains a comprehensive impact framework documented across dedicated LPs:

| LP | Title | Purpose |
|----|-------|---------|
| **LP-750** | Vision Fund ESG Framework | Investment criteria and screening |
| **LP-760** | Network Impact Thesis | Why impact matters for Lux |
| **LP-800** | ESG Principles | Core sustainability commitments |
| **LP-801** | Carbon Accounting | Methodology for emissions tracking |
| **LP-810** | Green Compute | Energy-efficient infrastructure |
| **LP-820** | Energy Transparency | Public reporting standards |
| **LP-830** | ESG Risk Management | Risk assessment framework |
| **LP-840** | Anti-Greenwashing | Authenticity verification |
| **LP-900** | Impact Framework | Theory of change and measurement |
| **LP-920** | Grants Program | Community development funding |
| **LP-930** | Financial Inclusion | Accessibility metrics |

### Standards Progression

The LP system defines standards from low-level primitives to application protocols:

```solidity
+=================================================================+
|                    STANDARDS HIERARCHY                          |
+=================================================================+

  Layer 5: Applications
    - DeFi protocols (AMM, lending, derivatives)
    - DEX specifications (orderbook, matching)
    - Consumer apps (wallets, identity)

  Layer 4: Token Standards
    - LRC-20: Fungible tokens
    - LRC-721: Non-fungible tokens
    - LRC-1155: Multi-token standard

  Layer 3: Chain Standards
    - C-Chain precompiles (secp256r1, PQC, threshold)
    - Cross-chain messaging (Warp, ICM)
    - Bridge protocols (Teleport, asset registry)

  Layer 2: Consensus & Network
    - Quasar consensus (Photon, Wave, Focus, Prism, Horizon)
    - P2P networking (gossip, peer discovery)
    - Validator management (staking, delegation)

  Layer 1: Cryptographic Primitives
    - Post-quantum (ML-KEM, ML-DSA, SLH-DSA)
    - Threshold (FROST, CGGMP, Ringtail)
    - Classical (BLS, Ed25519, secp256k1)

+=================================================================+
```

## Implementation

### Repository Structure

**LPs Repository**: `github.com/luxfi/lps`
```solidity
lps/
├── LPs/                 # All LP specifications
│   ├── TEMPLATE.md     # Template for new LPs
│   └── lp-*.md         # Individual proposals
├── docs/               # Documentation site (Next.js)
├── scripts/            # Validation and management tools
└── Makefile            # Common operations
```

**Node Implementation**: `github.com/luxfi/node`
```solidity
node/
├── vms/                # Virtual machine implementations
│   ├── platformvm/    # P-Chain
│   ├── cchainvm/      # C-Chain (EVM)
│   ├── exchangevm/    # X-Chain
│   ├── thresholdvm/   # T-Chain
│   ├── quantumvm/     # Q-Chain
│   ├── bridgevm/      # B-Chain
│   ├── aivm/          # A-Chain
│   ├── zkvm/          # Z-Chain
│   ├── dexvm/         # DEX chain
│   └── ...
├── consensus/          # Quasar consensus engine
├── network/            # P2P networking
├── chains/             # Chain management
└── genesis/            # Network genesis
```

### Quick Start

```bash
# Clone and explore LPs
git clone https://github.com/luxfi/lps
cd lps
make help

# Run documentation site
cd docs && pnpm dev

# Create new LP
make new
```

## Security Considerations

1. **Multi-chain Isolation**: Chains are isolated; bugs in one VM don't affect others
2. **Consensus Security**: Quasar achieves BFT guarantees with f < n/3 Byzantine tolerance
3. **Cryptographic Agility**: PQC support enables transition before quantum threats materialize
4. **Review Process**: All consensus-critical LPs require external audit

## References

- [1] Lux Network Documentation: docs.lux.network
- [2] LP Repository: github.com/luxfi/lps
- [3] Node Implementation: github.com/luxfi/node
- [4] Consensus Library: github.com/luxfi/consensus
- [5] Ethereum EIP Process: eips.ethereum.org
- [6] NIST Post-Quantum Standards: FIPS 203, 204, 205

```
