---
lip: 0
title: Lux Network Architecture & Community Framework
description: Defines the overall architecture of the Lux multi-chain network and the governance/process framework for the community.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Final
type: Meta
created: 2025-01-23
---

## Abstract

LIP-0 outlines the overall architecture of the Lux Network as a heterogeneous, multi-blockchain platform, and establishes the community-driven improvement process for evolving it. Lux’s design adopts a heterogeneous multi-chain framework similar in spirit to Polkadot’s vision, decoupling the concerns of transaction validity and chain consensus to allow diverse specialized blockchains to interoperate in a shared network. Each blockchain (“subnet”) in Lux can run its own execution logic (e.g. EVM-based or others) while relying on a common security and transport layer for cross-chain communication and shared security guarantees. This architecture addresses scalability by dividing workload among subnets (“divide-and-conquer”) and isolating different applications to optimize for their specific needs. It also enables interoperability: disparate consensus systems and virtual machines can interoperate trustlessly through Lux’s interoperability protocols, akin to how Polkadot parachains or Cosmos zones communicate in a decentralized federation. Governance and evolution of the protocol are handled via a community framework modeled after the Ethereum Improvement Proposal (EIP) process. Just as in Ethereum’s open development, anyone can propose a Lux Improvement Proposal (LIP) with technical specifications for a change. LIP-0 itself serves as the “meta” proposal defining this process and the high-level network structure. It emphasizes transparency and inclusivity in decision-making, echoing known best practices for decentralized governance (e.g. EIPs in Ethereum and Polkadot’s on-chain governance). In summary, Lux’s architecture is a modular multi-chain network with strong emphasis on scalability, interoperability, and community-led evolution, providing a foundational blueprint for subsequent LIPs.

## Motivation

As the Lux Network evolves to support advanced cross-chain operations, privacy features, and a growing ecosystem of applications, we need:

1. **Clear Architecture Documentation**: A comprehensive reference for developers, validators, and users to understand how all components work together
2. **Community Contribution Framework**: Structured processes to leverage open-source collaboration for accelerating growth and innovation
3. **Unified Vision**: A single source of truth for the network's design principles and future direction

## Specification

### Part 1: Network Architecture

#### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Lux Network Architecture                      │
├─────────────────────────────────────────────────────────────────────┤
│                          Primary Network                              │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│      P-Chain       │      X-Chain         │       C-Chain           │
│    (Platform)      │    (Exchange)        │     (Contract)          │
├─────────────────────┼─────────────────────┼─────────────────────────┤
│ • Validators       │ • UTXO Model         │ • EVM Compatible        │
│ • Subnets          │ • Asset Transfers    │ • Smart Contracts       │
│ • Staking          │ • Settlement Layer   │ • DeFi Ecosystem        │
│ • Governance       │ • High-Perf Exchange │ • OP-Stack Ready        │
└─────────────────────┴─────────────────────┴─────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │   Specialized Chains   │
        ┌───────────┴────────┐      ┌────────┴───────────┐
        │     M-Chain         │      │     Z-Chain        │
        │  (Money/MPC Chain)  │      │  (Zero-Knowledge)  │
        ├─────────────────────┤      ├────────────────────┤
        │ • CGG21 MPC         │      │ • zkEVM/zkVM       │
        │ • Asset Bridges     │      │ • FHE Operations   │
        │ • Teleport Protocol │      │ • Privacy Proofs   │
        │ • X-Chain Settlement│      │ • Omnichain Root   │
        │                     │      │ • AI Attestations  │
        └─────────────────────┘      └────────────────────┘
```

#### Chain Specifications

- **P-Chain (Platform Chain):** Coordinates validators, staking, and subnets. See LIP-10.
- **X-Chain (Exchange Chain):** Optimized for asset creation and transfers. See LIP-11.
- **C-Chain (Contract Chain):** EVM-compatible smart contract chain. See LIP-12.
- **M-Chain (MPC Bridge Chain):** Bridges assets using Multi-Party Computation. See LIP-13.
- **Z-Chain (Zero-Knowledge Chain):** Enables privacy using zero-knowledge proofs. See LIP-14.

### Part 2: Community Contribution Framework

#### LIP Process

1. **Idea Discussion**: Post on forum.lux.network
2. **Draft LIP**: Use `./scripts/new-lip.sh` or `make new`
3. **Submit PR**: PR number becomes LIP number
4. **Review Process**: Technical and community review
5. **Implementation**: Build reference implementation
6. **Finalization**: Move to Final status

#### Governance

- **LIP Governance**: Proposals require 10M LUX, 7-day voting, 75% approval.
- **Network Governance**: Parameter changes via governance proposals.

## Rationale

This LIP serves as the pedagogical introduction to Lux, referencing fundamental distributed systems concepts (nodes, consensus, finality) and how they come together in the Lux Network. It provides a single, high-level document to understand the entire ecosystem and how to contribute to it.

## Backwards Compatibility

As the foundational LIP, this document establishes the initial standards. Future changes to this meta-LIP will:
- Maintain compatibility with existing LIP processes
- Provide migration paths for any structural changes
- Announce deprecations with sufficient notice

## Security Considerations

### Network Security
- Multi-chain architecture isolates risks between chains
- Specialized validators for high-security operations (M-Chain, Z-Chain)
- Economic incentives align validator behavior with network security

### Contribution Security
- All code contributions undergo security review
- Responsible disclosure process for vulnerabilities
- External audits required for consensus-critical changes

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).