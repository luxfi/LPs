---
lp: 12
title: Lux Ecosystem Licensing Model
description: Defines licensing tiers for Lux Network components - BSD-3-Clause for core chains, Ecosystem License for advanced technology
author: Lux Industries Inc (@luxfi)
status: Final
type: Meta
created: 2025-12-30
tags: [meta, licensing, legal]
order: 12
tier: core
---

# LP-0012: Lux Ecosystem Licensing Model

## Abstract

This LP defines the canonical licensing model for all Lux Network software. Components are divided into two tiers:

1. **BSD-3-Clause** - Core infrastructure (C-Chain, P-Chain, X-Chain)
2. **Lux Ecosystem License** - Advanced technology (Z/T/B/A chains, cryptographic packages)

## Motivation

Lux Network has invested significant R&D into advanced cryptographic systems (FHE, threshold signatures, post-quantum crypto, GPU acceleration) that provide competitive differentiation. While we want the core blockchain to remain fully open, these advanced technologies require protection against commercial exploitation outside the Lux ecosystem.

## License Tiers

### Tier 1: BSD-3-Clause (Fully Open)

Standard BSD-3-Clause license for maximum compatibility and adoption.

**Applies to (3 chains):**
- **C-Chain** - EVM execution (CoreVM)
- **P-Chain** - Platform/validators (PlatformVM)
- **X-Chain** - Asset transfer (AVM)

Plus:
- Core consensus base (Snowman/Avalanche primitives)
- Basic networking and P2P
- Standard wallet operations
- Public SDKs for chain interaction

**Repositories:**
```
lux/node (core node only)
lux/coreth (EVM)
lux/sdk (basic SDK)
lux/wallet (standard wallet)
```

### Tier 2: Lux Ecosystem License v1.2

Permissive for the Lux ecosystem, restrictive for external commercial use.

**Applies to (8 specialized chains + 1 proposed):**
- **Q-Chain** - Post-quantum identity and signatures
- **Z-Chain** - Privacy, FHE, zero-knowledge proofs
- **T-Chain** - Threshold signatures, MPC custody
- **B-Chain** - Cross-chain bridges and messaging
- **A-Chain** - AI attestation and compute
- **K-Chain** - Key management and secrets (KeyManagementVM)
- **G-Chain** - GraphQL indexing (GraphVM)
- **D-Chain** - Decentralized exchange (DexVM)
- **I-Chain** - Decentralized identity (DID) — *proposed*

Plus all underlying technology:
- All cryptographic packages (lattice, FHE, PQC, threshold)
- GPU/hardware acceleration (MLX, Metal, CUDA)
- Advanced precompiles
- Consensus innovations (Quasar family)

**Permitted Use (No License Required):**
- Research and academic use
- Lux Primary Network (Network ID=1, EVM Chain ID=96369)
- Official testnets/devnets
- L1/L2/L3 chains descending from Lux Primary Network
- L1/L2/L3 chains descending from authorized testnets

**Prohibited (Commercial License Required):**
- Forks of Lux Network
- Commercial products outside Lux ecosystem
- Competing networks not descending from Lux Primary Network

**Contact:** licensing@lux.network

## Repository Classification

### BSD-3-Clause Repositories (Core Infrastructure)

| Repository | Chain | Description |
|------------|-------|-------------|
| `lux/node` | All | Core node (base only) |
| `lux/coreth` | C | EVM implementation |
| `lux/sdk` | All | Basic SDK |
| `lux/wallet` | All | Standard wallet |
| `lux/cli` | All | Command-line interface |
| `lux/netrunner` | All | Network testing |

### Ecosystem License Repositories (Proprietary Technology)

#### Cryptographic Foundations
| Repository | Category | Description |
|------------|----------|-------------|
| `lux/crypto` | PQC | Post-quantum cryptography (ML-DSA, SLH-DSA, ML-KEM) |
| `lux/lattice` | PQC | Lattice-based primitives |
| `lux/ringtail` | PQC | Ringtail threshold lattice signatures |
| `lux/fhe` | FHE | Pure Go TFHE implementation |
| `lux/threshold` | TSS | Threshold signature schemes (LSS, CGGMP21+FROST) |
| `lux/mpc` | MPC | Multi-party computation |
| `lux/lamport` | Sigs | Lamport one-time signatures |
| `lux/lattigo` | Lattice | Lattigo fork with optimizations |

#### Hardware Acceleration (C++)
| Repository | Category | Description |
|------------|----------|-------------|
| `luxcpp/fhe` | FHE | C++ OpenFHE fork with MLX |
| `luxcpp/gpu` | GPU | Go MLX/Metal/CUDA bindings |
| `luxcpp/lattice` | PQC | C++ lattice crypto |
| `luxcpp/crypto` | Crypto | C++ crypto primitives |

#### Specialized Chain VMs
| Repository | Chain | Description |
|------------|-------|-------------|
| `lux/vms/qvm` | Q | Post-quantum identity VM |
| `lux/vms/zvm` | Z | Privacy/FHE VM |
| `lux/vms/tvm` | T | Threshold VM |
| `lux/vms/bvm` | B | Bridge VM |
| `lux/vms/avm` | A | AI attestation VM |
| `lux/vms/kvm` | K | Key management VM |
| `lux/vms/gvm` | G | GraphQL VM |
| `lux/vms/dvm` | D | DEX VM |

#### FHE Ecosystem
| Repository | Category | Description |
|------------|----------|-------------|
| `luxfhe/contracts` | FHE | FHE Solidity contracts |
| `luxfhe/packages` | FHE | FHE SDKs and tools |
| `lux/fhe-coprocessor` | FHE | Z-Chain FHE coprocessor |

#### Advanced Infrastructure
| Repository | Category | Description |
|------------|----------|-------------|
| `lux/precompiles` | EVM | Advanced EVM precompiles |
| `lux/consensus` | Consensus | Quasar family (Photon, Wave, Focus, Prism, Horizon, Flare) |
| `lux/warp` | Bridge | Warp messaging protocol |
| `lux/kms` | KMS | Key management system |
| `lux/safe` | Wallet | Multi-sig Safe with Lamport OTS |
| `lux/exchange` | DEX | Exchange infrastructure |
| `lux/bridge` | Bridge | Cross-chain bridges |
| `lux/ai` | AI | AI mining and attestation |
| `lux/fpga` | Hardware | FPGA acceleration |

#### Next-Generation R&D
| Repository | Category | Description |
|------------|----------|-------------|
| `luxnext/*` | R&D | All next-gen technology |
| `luxnext/patents` | IP | Technology portfolio documentation |

## License Text

### Lux Ecosystem License v1.2

```
Lux Ecosystem License
Version 1.2, December 2025

Copyright (c) 2020-2025 Lux Industries Inc.
All rights reserved.

TECHNOLOGY PORTFOLIO - PATENT APPLICATIONS PLANNED
Contact: licensing@lux.network

1. DEFINITIONS

   "Lux Primary Network" means the official Lux blockchain with Network ID=1
   and EVM Chain ID=96369.
   
   "Authorized Network" means the Lux Primary Network, official testnets/devnets,
   and any L1/L2/L3 chain descending from the Lux Primary Network.
   
   "Descending Chain" means an L1/L2/L3 chain built on, anchored to, or deriving
   security from the Lux Primary Network or its authorized testnets.

2. GRANT OF LICENSE

   Subject to these terms, Lux Industries Inc grants you a non-exclusive,
   royalty-free license to:
   
   (a) Use for non-commercial academic research and education;
   (b) Operate on the Lux Primary Network;
   (c) Operate on official Lux testnets/devnets;
   (d) Operate L1/L2/L3 chains descending from the Lux Primary Network;
   (e) Build applications within the Lux ecosystem.

3. RESTRICTIONS

   Without a commercial license from Lux Industries Inc, you may NOT:
   
   (a) Fork the Lux Network or any Lux software;
   (b) Create competing networks not descending from Lux Primary Network;
   (c) Use for commercial products outside the Lux ecosystem;
   (d) Sublicense or transfer rights outside the Lux ecosystem.

4. NO FORKS POLICY

   Lux Industries Inc maintains ZERO TOLERANCE for unauthorized forks.
   Any fork constitutes breach of this license and grounds for legal action.

5. RIGHTS RESERVATION

   All rights not explicitly granted are reserved by Lux Industries Inc.

6. DISCLAIMER

   THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

7. TERMINATION

   This license terminates immediately upon any breach.

8. COMMERCIAL LICENSING

   For commercial use outside the Lux ecosystem:
   
   Lux Industries Inc.
   Email: licensing@lux.network
   Subject: Commercial License Request

TL;DR:
- Research/academic = OK
- Lux Primary Network = OK  
- L1/L2/L3 descending from Lux = OK
- Commercial outside ecosystem = Contact licensing@lux.network
- Forks = No
```

## Implementation

All affected repositories MUST include:

1. `LICENSE` file with appropriate license text
2. License header in source files (optional but recommended)
3. README section referencing this LP

## Related Documents

- [LP-0010: Technology Portfolio](./lp-0010-technology-portfolio.md) - Innovation catalog
- [LP-0005: Open Source](./lp-0005-open-source.md) - Open source philosophy

## Copyright

Copyright (c) 2020-2025 Lux Industries Inc. All rights reserved.
