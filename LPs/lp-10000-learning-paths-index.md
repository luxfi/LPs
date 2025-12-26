---
lp: 10000
title: Learning Paths Index
description: Canonical learning paths for developers, validators, traders, investors, and researchers
author: Lux Core Team
status: Living
type: Meta
created: 2025-12-21
tags: [learning-path, index]
order: 20
tier: core
---

# LP-0010: Learning Paths Index

## Abstract

This LP defines canonical learning paths for different roles interacting with the Lux Network. Each path answers: What do I read first? What can I safely skip? Where do I go deep vs broad?

## Motivation

The Lux LP system contains 200+ proposals. Without guided paths, newcomers get lost. These paths serve as:
- Onboarding curricula
- Documentation navigation roots
- Partner and investor entry points

## Specification

### Available Learning Paths

| LP | Path | Audience |
|----|------|----------|
| [LP-0011](/docs/lp-0011-learning-path-core/) | Core Protocol | Everyone (start here) |
| [LP-0012](/docs/lp-0012-learning-path-developer/) | Smart Contract Developer | Solidity devs, Web3 teams |
| [LP-0013](/docs/lp-0013-learning-path-validator/) | Platform Engineer / Validator | Infra engineers, node operators |
| [LP-0014](/docs/lp-0014-learning-path-trading/) | Trading / Market Infrastructure | Quants, exchanges, prop desks |
| [LP-0015](/docs/lp-0015-learning-path-security/) | Security / Auditor | Auditors, red teams |
| [LP-0016](/docs/lp-0016-learning-path-mpc/) | MPC / Threshold / Custody | Security engineers, custodians |
| [LP-0017](/docs/lp-0017-learning-path-privacy/) | Privacy / ZK / FHE | Cryptographers, privacy teams |
| [LP-0018](/docs/lp-0018-learning-path-investor/) | Investor / Institutional | Funds, allocators, boards |
| [LP-0019](/docs/lp-0019-learning-path-researcher/) | Researcher | Academics, frontier teams |

---

## Path Overview

### Everyone Starts Here: Core Protocol Path

```solidity
LP-0000 → LP-0001 → LP-0099 → LP-0100 → LP-1000
Network   Tokens   Taxonomy  Consensus  P-Chain
```

**Stop here if non-technical. Branch after.**

---

### Quick Reference: Role → Path

| I want to... | Start with | Then go to |
|--------------|------------|------------|
| Build dApps | LP-0011 (Core) | LP-0012 (Developer) |
| Run nodes | LP-0011 (Core) | LP-0013 (Validator) |
| Trade/MM | LP-0011 (Core) | LP-0014 (Trading) |
| Audit code | LP-0011 (Core) | LP-0015 (Security) |
| Build custody | LP-0011 (Core) | LP-0016 (MPC) |
| Build privacy | LP-0011 (Core) | LP-0017 (Privacy) |
| Invest | LP-0011 (Core) | LP-0018 (Investor) |
| Research | Any path | +10000 offset |

---

## Visual Map

```solidity
                    ┌─────────────┐
                    │  LP-0011    │
                    │  Core Path  │
                    │  (Everyone) │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  LP-0012    │     │  LP-0013    │     │  LP-0018    │
│  Developer  │     │  Validator  │     │  Investor   │
│  (Web3)     │     │  (Infra)    │     │  (Capital)  │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  LP-0014    │     │  LP-0016    │
│  Trading    │     │  MPC        │
│  (Markets)  │     │  (Custody)  │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
             ┌─────────────┐ ┌─────────────┐
             │  LP-0015    │ │  LP-0017    │
             │  Security   │ │  Privacy    │
             │  (Audit)    │ │  (ZK/FHE)   │
             └─────────────┘ └─────────────┘
                    │
                    ▼
             ┌─────────────┐
             │  LP-0019    │
             │  Research   │
             │  (+10000)   │
             └─────────────┘
```

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
