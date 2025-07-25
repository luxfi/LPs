---
lp: 0
title: Lux Network Architecture & Community Framework
description: Defines the overall architecture of the Lux multi-chain network and the governance/process framework for the community.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Meta
created: 2025-01-23
updated: 2025-07-25
activation:
  flag: lp0-architecture-framework
  hfName: ""
  activationHeight: "N/A"
---

## Abstract

## Activation

| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Flag string        | `lp0-architecture-framework`                    |
| Default in code    | N/A                                             |
| Deployment branch  | N/A                                             |
| Roll-out criteria  | N/A                                             |
| Back-off plan      | N/A                                             |

A short (~200 word) description of the technical issue being addressed. This should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.

LP‑0 establishes the foundational blueprint for Lux, defining both its heterogeneous multi‑chain architecture and the community‑driven improvement process.

Lux cleanly decouples execution semantics from consensus and security, enabling each blockchain “subnet” to run its own virtual machine (e.g., EVM or alternative VMs) while leveraging a shared security and transport layer for cross‑chain communication[1][2]. This architectural separation addresses scalability through workload partitioning (“divide‑and‑conquer”) and modular isolation, optimizing performance for specialized applications[3].

Interoperability is protocol‑native: subnets exchange messages trustlessly via secure primitives inspired by Polkadot’s Cross‑Chain Message Passing and Cosmos IBC[4][5]. Each subnet benefits from shared security guarantees and can interoperate regardless of its underlying consensus or VM.

Governance and evolution follow a meta‑proposal model modeled after Ethereum’s EIP process. Any community member may draft, review, and ratify LPs through open discussion and structured stages, ensuring transparency, inclusivity, and rigorous technical scrutiny[6][7].

In summary, Lux’s architecture combines a modular, scalable multi‑chain framework with a formalized, community‑centric governance process, providing a coherent foundation for all subsequent LPs.

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

- **P-Chain (Platform Chain):** Coordinates validators, staking, and subnets. See [LP-10](./lp-10.md).
- **X-Chain (Exchange Chain):** Optimized for asset creation and transfers. See [LP-11](./lp-11.md).
- **C-Chain (Contract Chain):** EVM-compatible smart contract chain. See [LP-12](./lp-12.md).
- **M-Chain (MPC Bridge Chain):** Bridges assets using Multi-Party Computation. See [LP-13](./lp-13.md).
- **Z-Chain (Zero-Knowledge Chain):** Enables privacy using zero-knowledge proofs. See [LP-14](./lp-14.md).
- **G-Chain (Graph Chain):** Universal omnichain oracle. See [LP-98](./lp-98.md).

### Part 2: Community Contribution Framework

See the [LP Index](./LP-INDEX.md) for a complete list of LPs.

#### LP Process

1. **Idea Discussion**: Post on forum.lux.network
2. **Draft LP**: Use `./scripts/new-lp.sh` or `make new`
3. **Submit PR**: PR number becomes LP number
4. **Review Process**: Technical and community review
5. **Implementation**: Build reference implementation
6. **Finalization**: Move to Final status

#### Governance

- **LP Governance**: Proposals require 10M LUX, 7-day voting, 75% approval.
- **Network Governance**: Parameter changes via governance proposals.

## Rationale

This LP serves as the pedagogical introduction to Lux, referencing fundamental distributed systems concepts (nodes, consensus, finality) and how they come together in the Lux Network. It provides a single, high-level document to understand the entire ecosystem and how to contribute to it.

## Backwards Compatibility

As the foundational LP, this document establishes the initial standards. Future changes to this meta-LP will:
- Maintain compatibility with existing LP processes
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

## References

- [1] G. Wood, “Polkadot: Vision for a Heterogeneous Multi‑chain Framework,” Whitepaper, 2016.
- [2] J. Kwon & E. Buchman, “Cosmos: A Network of Distributed Ledgers,” Whitepaper, 2016.
- [3] Ethereum Foundation, “EIP‑1: EIP Purpose and Guidelines,” GitHub, 2015.
- [4] G. Wood et al., “Polkadot White Paper,” Polkadot Wiki, 2020.
- [5] Cosmos Network, “Inter‑Blockchain Communication (IBC) Protocol,” Cosmos SDK Docs.
- [6] Ethereum Foundation, “Ethereum Improvement Proposal Process,” eips.ethereum.org.
- [7] Polkadot Wiki, “Polkadot Governance Overview.”

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
