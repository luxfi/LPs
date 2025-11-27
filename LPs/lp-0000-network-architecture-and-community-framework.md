---
lp: 0000
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
│                    Lux Network Architecture 2.0                       │
├─────────────────────────────────────────────────────────────────────┤
│                          Primary Network                              │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│      Q-Chain       │      X-Chain         │       C-Chain           │
│    (Quantum)       │    (Exchange)        │     (Contract)          │
├─────────────────────┼─────────────────────┼─────────────────────────┤
│ • Quasar Consensus │ • CEX (Hyperliquid)  │ • EVM Compatible        │
│ • Verkle + Witness │ • 1B+ trades/sec     │ • Uniswap AMM DEX       │
│ • BLS + Ringtail   │ • KCMO Datacenter    │ • DeFi Ecosystem        │
│ • Platform Mgmt    │ • FIX Protocol       │ • OP-Stack Ready        │
└─────────────────────┴─────────────────────┴─────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │   Specialized Chains   │
        ┌───────────┴────────┬──────┴────────┬────────────────┐
        │     A-Chain        │   B-Chain     │   M-Chain      │
        │ (AI/Attestation)   │ (Bridge Layer)│    (MPC)       │
        ├────────────────────┼───────────────┼────────────────┤
        │ • TEE Attestation  │ • Cross-Chain │ • CGG21 + Ring │
        │ • Proof-of-AI      │ • Overlay     │ • Threshold Sig│
        │ • LUX Gas Token    │ • MPC Sigs    │ • Key Manager  │
        │ • GRPO Learning    │ • Multi-Asset │ • Asset Swaps  │
        └────────────────────┴───────────────┴────────────────┘
                                │
        ┌───────────┴────────┬──────┴────────┬────────────────┐
        │     Reserved       │   Z-Chain     │   G-Chain      │
        │                    │ (ZK Co-Proc)  │   (Graph)      │  
        ├────────────────────┼───────────────┼────────────────┤
        │                    │ • ZK Processor│ • Oracle Data  │
        │                    │ • fheEVM      │ • Graph DB     │
        │                    │ • Lux FHE     │ • Analytics    │
        │                    │ • Homomorphic │ • Indexing     │
        └────────────────────┴───────────────┴────────────────┘
```

#### Chain Specifications

**Lux 2.0 (Current Architecture):**
- **Q-Chain (Quantum Chain):** Platform management with Quasar consensus (Photon, Wave, Nova, Nebula, Prism protocols), validator coordination, and staking. Uses verkle trees and witness support. Replaces P-Chain from Lux 1.0. See [LP-99](./lp-99-q-chain-quantum-secure-consensus-protocol-family-quasar.md).
- **X-Chain (Exchange Chain):** High-performance CEX with full Hyperliquid feature parity. Colocated infrastructure in KCMO datacenter achieving 1B+ trades/sec. Uses FIX protocol for institutional traders. High-performance C++ CEX available by request (pre-launch). See [LP-11](./lp-11-x-chain-exchange-chain-specification.md).
- **C-Chain (Contract Chain):** EVM-compatible smart contract chain hosting Uniswap-based AMM DEX and DeFi ecosystem. See [LP-12](./lp-12-c-chain-contract-chain-specification.md).
- **A-Chain (AI/Attestation Chain):** TEE attestation layer for AI compute verification. See [LP-80](./lp-80-a-chain-attestation-chain-specification.md).
- **B-Chain (Bridge Chain):** Cross-chain bridge layer built on top of the existing infrastructure with MPC dual signatures. See [LP-81](./lp-81-b-chain-bridge-chain-specification.md).
- **M-Chain (MPC Chain):** Threshold signature custody with CGG21 + Ringtail. See [LP-13](./lp-13-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md).
- **Z-Chain (Zero-Knowledge Chain):** ZK co-processor for Lux FHE implementation and fheEVM providing fully homomorphic encryption. See [LP-14](./lp-14-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md).
- **G-Chain (Graph Chain):** Universal omnichain oracle. See [LP-98](./lp-98-luxfi-graphdb-and-graphql-engine-integration.md).

**Note:** Lux 1.0 was based on Lux architecture with P-Chain (Platform), X-Chain (Exchange), and C-Chain (Contract). Lux 2.0 features a complete rewrite with our Quasar consensus protocol family, verkle trees, FPC, and witness support. P-Chain functionality has been absorbed into Q-Chain with quantum-secure consensus. The new X-Chain is a colocated high-performance DEX achieving 1B+ trades/sec.

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

## Implementation

### LP Repository and Governance Framework

**GitHub**: [`github.com/luxfi/lps`](https://github.com/luxfi/lps)
**Local Path**: `~/work/lux/lps/`

**Key Components**:
- [`LPs/`](https://github.com/luxfi/lps/tree/main/LPs/) - All LP specifications (119 total)
- [`TEMPLATE.md`](https://github.com/luxfi/lps/blob/main/LPs/TEMPLATE.md) - Template for new LPs
- [`Makefile`](https://github.com/luxfi/lps/blob/main/Makefile) - LP validation and management
- [`docs/`](https://github.com/luxfi/lps/tree/main/docs/) - Documentation site (Next.js)
- [`scripts/`](https://github.com/luxfi/lps/tree/main/scripts/) - Automation utilities

**Documentation Site**:
```bash
cd ~/work/lux/lps/docs
pnpm dev      # Development: http://localhost:3002
pnpm build    # Production build (124 static pages)
```

### Network Architecture Implementation

**Core Node**: [`github.com/luxfi/node`](https://github.com/luxfi/node)
**Local Path**: `~/work/lux/node/`

**Chain Implementations**:
- **Q-Chain** (Quasar): `~/work/lux/node/vms/quantumvm/`
  - Hybrid BFT + Post-Quantum consensus
  - Ringtail ring signatures
  - Verkle trie + witness support

- **X-Chain** (Exchange): `~/work/lux/node/vms/avm/`
  - DAG consensus
  - UTXO model
  - High-throughput asset exchange

- **C-Chain** (Contract): `~/work/lux/evm/`
  - EVM-compatible execution
  - UniswapV2/V3 DEX integration
  - OP-Stack compatibility

**Consensus Engines**: `~/work/lux/consensus/`
- `engine/bft/` - Byzantine Fault Tolerant (21 files)
- `engine/chain/` - Linear consensus (11 files)
- `engine/dag/` - Directed Acyclic Graph (8 files)
- `engine/pq/` - Post-Quantum consensus (6 files)
- `protocol/quasar/` - Hybrid consensus (8 files)

**Cross-Chain Messaging**:
- `~/work/lux/node/vms/platformvm/warp/` - Warp messaging protocol
- `~/work/lux/bridge/` - Cross-chain bridge implementations

### Community Contribution Tools

**LP Management**:
```bash
cd ~/work/lux/lps

# Create new LP
make new

# Validate LP format
make validate FILE=LPs/lp-N.md

# Pre-PR checks
make pre-pr
```

**Governance Process**:
1. Discussion Phase: [`forum.lux.network`](https://forum.lux.network)
2. Draft Submission: Create PR with `lp-draft.md`
3. Review: Community feedback and technical review
4. Last Call: 14-day final comment period
5. Final: Ratification and implementation

### Architecture Verification

**Network Structure**:
- Primary Network: Q, X, C chains (mandatory)
- Specialized Chains: A (AI), B (Bridge), M (MPC)
- All chains share security and cross-chain messaging

**Running Local Network**:
```bash
cd ~/work/lux/netrunner
RUN_E2E=1 go test -v ./tests/e2e/
# Bootstraps all chains in <60 seconds
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
