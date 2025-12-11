---
lp: 0099
title: LP Numbering Scheme and Chain Organization
tags: [meta, governance, organization]
description: Defines the LP numbering scheme organizing proposals by chain and category
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Meta
created: 2025-12-11
---

## Abstract

LP-0099 establishes a standardized LP numbering scheme that organizes Lux Proposals by chain and category. This enables clear categorization, easier navigation, and logical grouping of related specifications.

## Motivation

With 145+ LPs and growing, a structured numbering scheme is essential for:

1. **Discoverability**: Find chain-specific proposals quickly
2. **Organization**: Group related proposals logically
3. **Scalability**: Reserve space for future growth
4. **Clarity**: Clear ownership and scope of each proposal

## Specification

### LP Number Ranges

| Range | Category | Description |
|-------|----------|-------------|
| **0000-0999** | **Core/Meta** | Network-wide specs, governance, tooling |
| **1000-1999** | **P-Chain** | Platform, validators, staking |
| **2000-2999** | **C-Chain** | EVM, smart contracts, DeFi |
| **3000-3999** | **X-Chain** | Exchange, UTXO, trading |
| **4000-4999** | **Q-Chain** | Quantum-resistant cryptography |
| **5000-5999** | **A-Chain** | AI, attestation, compute |
| **6000-6999** | **B-Chain** | Bridge, cross-chain |
| **7000-7999** | **T-Chain** | Threshold, MPC, custody |
| **8000-8999** | **Z-Chain** | ZK proofs, privacy, FHE |
| **9000-9999** | **DEX/Finance** | Trading protocols, DeFi standards |

### Core/Meta (0000-0999)

| Sub-Range | Category |
|-----------|----------|
| 0000-0099 | Network architecture, governance |
| 0100-0199 | Cryptography standards |
| 0200-0299 | Consensus protocols |
| 0300-0399 | Networking, P2P |
| 0400-0499 | SDK, tools, CLI |
| 0500-0599 | Token standards (LRC-20, etc.) |
| 0600-0699 | Reserved |
| 0700-0799 | Reserved |
| 0800-0899 | Research papers |
| 0900-0999 | Experimental, RFCs |

### P-Chain (1000-1999)

| Sub-Range | Category |
|-----------|----------|
| 1000-1099 | Core platform VM |
| 1100-1199 | Validator management |
| 1200-1299 | Staking mechanics |
| 1300-1399 | Subnet management |
| 1400-1499 | Delegator features |
| 1500-1599 | Upgrades, forks |
| 1600-1699 | Reserved |
| 1700-1799 | Reserved |
| 1800-1899 | Reserved |
| 1900-1999 | P-Chain research |

### C-Chain (2000-2999)

| Sub-Range | Category |
|-----------|----------|
| 2000-2099 | Core EVM specification |
| 2100-2199 | Precompiles |
| 2200-2299 | Gas mechanics |
| 2300-2399 | Smart contract standards |
| 2400-2499 | DeFi protocols |
| 2500-2599 | NFT standards |
| 2600-2699 | Rollups, L2 |
| 2700-2799 | Account abstraction |
| 2800-2899 | Reserved |
| 2900-2999 | C-Chain research |

### X-Chain (3000-3999)

| Sub-Range | Category |
|-----------|----------|
| 3000-3099 | Core exchange VM |
| 3100-3199 | Order book |
| 3200-3299 | UTXO management |
| 3300-3399 | Asset creation |
| 3400-3499 | Trading mechanics |
| 3500-3599 | Market making |
| 3600-3699 | FIX protocol integration |
| 3700-3799 | Reserved |
| 3800-3899 | Reserved |
| 3900-3999 | X-Chain research |

### Q-Chain (4000-4999)

| Sub-Range | Category |
|-----------|----------|
| 4000-4099 | Core quantum VM |
| 4100-4199 | ML-KEM (key encapsulation) |
| 4200-4299 | ML-DSA (signatures) |
| 4300-4399 | SLH-DSA (hash-based) |
| 4400-4499 | Quantum stamping |
| 4500-4599 | Key management |
| 4600-4699 | Migration protocols |
| 4700-4799 | Reserved |
| 4800-4899 | Reserved |
| 4900-4999 | Quantum research |

### A-Chain (5000-5999)

| Sub-Range | Category |
|-----------|----------|
| 5000-5099 | Core AI VM |
| 5100-5199 | TEE attestation |
| 5200-5299 | GPU provider registry |
| 5300-5399 | Task scheduling |
| 5400-5499 | Reward distribution |
| 5500-5599 | Model registry |
| 5600-5699 | Inference protocols |
| 5700-5799 | Training protocols |
| 5800-5899 | Reserved |
| 5900-5999 | AI research |

### B-Chain (6000-6999)

| Sub-Range | Category |
|-----------|----------|
| 6000-6099 | Core bridge VM |
| 6100-6199 | Warp messaging |
| 6200-6299 | Asset wrapping |
| 6300-6399 | Cross-chain transfers |
| 6400-6499 | External chain support |
| 6500-6599 | Security framework |
| 6600-6699 | Teleport protocol |
| 6700-6799 | Reserved |
| 6800-6899 | Reserved |
| 6900-6999 | Bridge research |

### T-Chain (7000-7999)

| Sub-Range | Category |
|-----------|----------|
| 7000-7099 | Core threshold VM |
| 7100-7199 | CGGMP21 ECDSA |
| 7200-7299 | FROST Schnorr/BLS |
| 7300-7399 | Ringtail PQ |
| 7400-7499 | DKG ceremonies |
| 7500-7599 | Key management |
| 7600-7699 | Custody solutions |
| 7700-7799 | Reserved |
| 7800-7899 | Reserved |
| 7900-7999 | MPC research |

### Z-Chain (8000-8999)

| Sub-Range | Category |
|-----------|----------|
| 8000-8099 | Core ZK VM |
| 8100-8199 | Proof systems (Groth16, PLONK) |
| 8200-8299 | Hardware acceleration |
| 8300-8399 | Privacy transactions |
| 8400-8499 | FHE operations |
| 8500-8599 | ZK rollups |
| 8600-8699 | Verifiable computation |
| 8700-8799 | Reserved |
| 8800-8899 | Reserved |
| 8900-8999 | ZK research |

### DEX/Finance (9000-9999)

| Sub-Range | Category |
|-----------|----------|
| 9000-9099 | DEX core |
| 9100-9199 | Order matching |
| 9200-9299 | Liquidity pools |
| 9300-9399 | Derivatives |
| 9400-9499 | Lending/borrowing |
| 9500-9599 | Yield protocols |
| 9600-9699 | Insurance |
| 9700-9799 | Governance tokens |
| 9800-9899 | Reserved |
| 9900-9999 | DeFi research |

### Migration Plan

Existing LPs will be migrated as follows:

| Old LP | New LP | Title |
|--------|--------|-------|
| LP-0010 | LP-1000 | P-Chain Platform Specification |
| LP-0011 | LP-3000 | X-Chain Exchange Specification |
| LP-0012 | LP-2000 | C-Chain Contract Specification |
| LP-0046 | LP-8000 | Z-Chain ZKVM Architecture |
| LP-0080 | LP-5000 | A-Chain AI/Attestation Specification |
| LP-0081 | LP-6000 | B-Chain Bridge Specification |
| LP-0082 | LP-4000 | Q-Chain Quantum Specification |
| LP-0083 | LP-7000 | T-Chain Threshold Specification |

### luxfi Go Package Mapping

| Chain | VM Package | Constants |
|-------|------------|-----------|
| P-Chain | `github.com/luxfi/node/vms/platformvm` | `constants.PlatformVMID` |
| C-Chain | `github.com/luxfi/node/vms/cchainvm` | `constants.EVMID` |
| X-Chain | `github.com/luxfi/node/vms/exchangevm` | `constants.XVMID` |
| Q-Chain | `github.com/luxfi/node/vms/quantumvm` | `constants.QVMID` |
| A-Chain | `github.com/luxfi/node/vms/aivm` | `constants.AIVMID` |
| B-Chain | `github.com/luxfi/node/vms/bridgevm` | `constants.BridgeVMID` |
| T-Chain | `github.com/luxfi/node/vms/thresholdvm` | `constants.ThresholdVMID` |
| Z-Chain | `github.com/luxfi/node/vms/zkvm` | `constants.ZKVMID` |

### Full Go Package Reference

```go
// Core node packages
"github.com/luxfi/node"              // Main node implementation
"github.com/luxfi/node/vms"          // Virtual machines
"github.com/luxfi/node/chains"       // Chain management
"github.com/luxfi/node/network"      // P2P networking
"github.com/luxfi/node/api"          // APIs

// Chain VMs
"github.com/luxfi/node/vms/platformvm"   // P-Chain
"github.com/luxfi/node/vms/cchainvm"     // C-Chain (EVM)
"github.com/luxfi/node/vms/exchangevm"   // X-Chain
"github.com/luxfi/node/vms/quantumvm"    // Q-Chain
"github.com/luxfi/node/vms/aivm"         // A-Chain
"github.com/luxfi/node/vms/bridgevm"     // B-Chain
"github.com/luxfi/node/vms/thresholdvm"  // T-Chain
"github.com/luxfi/node/vms/zkvm"         // Z-Chain

// Cryptography
"github.com/luxfi/node/crypto/mlkem"     // ML-KEM (FIPS 203)
"github.com/luxfi/node/crypto/mldsa"     // ML-DSA (FIPS 204)

// Consensus
"github.com/luxfi/consensus"             // Consensus engine

// Database
"github.com/luxfi/database"              // Storage layer

// Shared libraries
"github.com/luxfi/ids"                   // ID types
"github.com/luxfi/log"                   // Logging
"github.com/luxfi/math"                  // Math utilities

// Hardware acceleration (Z-Chain)
"github.com/luxfi/node/vms/zkvm/accel"   // ZK acceleration
"github.com/luxfi/fpga"                  // Shared FPGA package
"github.com/luxfi/mlx"                   // Apple Silicon MLX
```

## Rationale

The 1000-series ranges per chain provide:

1. **99 sub-categories** per chain for detailed organization
2. **Clear boundaries** between chain responsibilities
3. **Reserved space** for future expansion
4. **Logical grouping** of related proposals

## Backwards Compatibility

Existing LP numbers will be maintained as aliases. Both old and new numbers will resolve to the same document during migration.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
