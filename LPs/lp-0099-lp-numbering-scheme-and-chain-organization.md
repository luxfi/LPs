---
lp: 99
title: LP Numbering Scheme and Chain Organization
description: Canonical LP number taxonomy aligned with chain dependency order
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Living
type: Meta
created: 2025-12-28
tags: [meta, governance, taxonomy]
order: 1
tier: core
---

# LP-0099: LP Numbering Scheme and Chain Organization

## Abstract

This LP defines the canonical numbering scheme for Lux Proposals (LPs). Numbers follow **dependency order** — lower numbers are foundations that higher numbers build upon. This creates a natural learning path and enforces architectural discipline.

## Motivation

A consistent, dependency-ordered numbering scheme is essential for the Lux ecosystem:

1. **Architectural Clarity**: Lower numbers represent foundational components that higher numbers depend on, making dependency relationships explicit
2. **Learning Path**: Developers can follow numbers sequentially to understand the stack from primitives to applications
3. **Collision Prevention**: Reserved ranges prevent number conflicts as the ecosystem grows
4. **Chain Organization**: Each chain family (P, C, Z, T, B, A) has dedicated ranges reflecting their role in the architecture
5. **Review Efficiency**: Reviewers can quickly identify an LP's domain and dependencies from its number

Without a canonical taxonomy, LP numbers become arbitrary, making it difficult to understand relationships between proposals, locate relevant specifications, or ensure consistent organization across hundreds of documents.

## Canonical Taxonomy

### 0xxx: Meta / Governance / Process
Core process documents, taxonomy, governance rules. **Start here.**

| Range | Category | Contents |
|-------|----------|----------|
| 0000-0099 | Meta | Taxonomy, process, review rules, this document |
| 0100-0199 | Consensus | Quasar protocol (Photon, Wave, Focus, Prism, Horizon, Flare) |
| 0200-0499 | Network | P2P, messaging, topology, Warp |
| 0500-0999 | Reserved | Future cross-cutting standards |

### 1xxx: Foundations + P-Chain

| Range | Category | Contents |
|-------|----------|----------|
| 1000-1499 | P-Chain | Platform coordination, validators, staking, L1/L2/L3 |
| 1500-1999 | Foundations | Cryptographic primitives, formal models, math, proofs |

**Foundations** are things every chain depends on but no single chain owns:
- Hash/signature/commitment basics
- MPC math (not custody operations)
- ZK arithmetization theory
- PQ definitions (not deployment)

### Chain Standards (Dependency Order)

```
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

| Range | Chain | Description | Depends On |
|-------|-------|-------------|------------|
| 2000-2999 | **Q-Chain** | Post-quantum keys, signatures, addresses, hybrid modes, migration | 1xxx |
| 3000-3999 | **C-Chain** | EVM execution, LRC standards, accounts, gas, Web3, wallets | 1xxx, 2xxx |
| 4000-4999 | **Z-Chain** | ZK proofs, FHE, privacy protocols, zkVM, verifier costs | 1xxx, 2xxx, 3xxx |
| 5000-5999 | **T-Chain** | Threshold signing, DKG, custody, recovery, rotation | 1xxx, 2xxx, 4xxx |
| 6000-6999 | **B-Chain** | Cross-chain messaging, finality proofs, relayers | 2xxx, 4xxx, 5xxx |
| 7000-7999 | **A-Chain** | AI agents, policy engines, verifiable AI | All above |
| 8000-8999 | **Governance** | DAO, voting, ESG, ops, monitoring, upgrades, kill switches | All above |
| 9000-9999 | **DEX/Markets** | AMMs, orderbooks, MEV mitigation, oracles, liquidation | 3xxx, 6xxx |

### 10xxx: Learning & Research (Meta)

| Range | Category | Contents |
|-------|----------|----------|
| 10000-10099 | Learning Paths | Educational resources, tutorials, onboarding |
| 10100-10999 | Research | Experimental proposals, papers, explorations |

These are **views**, not canonical homes. Research graduates to a chain series when implemented.

## Dependency Rules

### Rule 1: Ownership
A doc lives in the **lowest layer** that owns the invariant it defines.

If ZK is used by bridges → ZK spec stays in 4xxx, bridge profile references it.

### Rule 2: Declared Dependencies
Every LP MUST declare its chain dependencies in frontmatter:

```yaml
requires:
  - chain: Q
  - chain: Z
```

No silent assumptions. CI will enforce this.

### Rule 3: No Upward References
Lower-numbered LPs MUST NOT reference higher-numbered LPs as requirements.

- ✅ LP-4xxx (Z-Chain) can require LP-2xxx (Q-Chain)
- ❌ LP-2xxx (Q-Chain) cannot require LP-4xxx (Z-Chain)

## Migration Status

**All migrations completed 2025-12-28.**

| Migration | Files | Status |
|-----------|-------|--------|
| DAO/ESG (2xxx → 8xxx) | 27 | ✅ Complete |
| Q-Chain (4xxx → 2xxx) | 18 | ✅ Complete |
| Z-Chain (8xxx → 4xxx) | 13 | ✅ Complete |
| T-Chain (7xxx → 5xxx) | 20 | ✅ Complete |
| A-Chain (5xxx → 7xxx) | 11 | ✅ Complete |

**Total: 89 files migrated**

## Why This Order?

### Pedagogical
You learn in dependency order:
1. **Foundations** — What primitives exist?
2. **Q-Chain** — How do we sign things safely?
3. **C-Chain** — How do we execute contracts?
4. **Z-Chain** — How do we add privacy?
5. **T-Chain** — How do we distribute trust?
6. **B-Chain** — How do we cross chains?
7. **A-Chain** — How do we add intelligence?
8. **Governance** — How do we govern and operate safely?
9. **Markets** — How do we trade?

### Architectural
Lower layers cannot break higher layers:
- PQ migration (2xxx) doesn't break AI (7xxx)
- Privacy changes (4xxx) don't break bridges (6xxx)
- Threshold updates (5xxx) don't break markets (9xxx)

### Enforceable
CI can validate:
- 7xxx docs must declare Q/Z/T dependencies
- 6xxx docs must declare Q or T dependencies
- No circular dependencies

## Related LPs

- [LP-0000: Network Architecture](./lp-0000-network-architecture-and-community-framework.md) — Full architecture
- [LP-10000: Learning Paths Index](./lp-10000-learning-paths-index.md) — Educational entry points

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
