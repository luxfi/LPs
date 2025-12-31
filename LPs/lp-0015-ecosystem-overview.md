---
lp: 15
title: Lux Network Ecosystem Overview
description: The fastest, most secure, and private quantum-safe network of blockchains
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Living
type: Informational
created: 2025-12-30
tags: [core, ecosystem, overview]
order: 15
tier: core
---

# LP-0015: Lux Network Ecosystem Overview

## Abstract

Lux is a **multi-chain, multi-consensus blockchain network** designed for the next generation of Web3 applications. Unlike single-chain platforms that force all applications to compete for the same resources, Lux provides **purpose-built chains** that are optimized for specific workloads while maintaining seamless interoperability. This LP provides a comprehensive overview of the Lux ecosystem, its architecture, chains, and unique capabilities.

## Motivation

Current blockchain platforms face fundamental challenges: quantum computing threatens existing cryptography, privacy is bolted on as an afterthought, single chains cannot scale, bridges are security liabilities, and key management remains centralized. Lux addresses these challenges with a purpose-built multi-chain architecture featuring native post-quantum cryptography, FHE-based privacy, protocol-native cross-chain messaging, and decentralized threshold signatures.

**Why Lux?**

| Challenge | Lux Solution |
|-----------|--------------|
| Quantum computing threatens cryptography | Native post-quantum cryptography (NIST FIPS 203/204/205) |
| Privacy is an afterthought | Native FHE (encrypted computation) and ZK proofs |
| Single chains don't scale | 11 purpose-built chains with horizontal scaling |
| Bridges get hacked | Protocol-native cross-chain messaging (Warp) |
| Centralized key management | Decentralized threshold signatures (MPC/TSS) |
| Slow finality | Sub-second finality via Snow consensus family |
| DEXs suffer from MEV | Native order book DEX with quantum-safe signatures |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LUX NETWORK                                        │
│                   "The Internet of Secure Blockchains"                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      CORE CHAINS (BSD-3-Clause)                         │ │
│  │  ┌───────────┐    ┌───────────┐    ┌───────────┐                       │ │
│  │  │  P-Chain  │    │  X-Chain  │    │  C-Chain  │                       │ │
│  │  │ Platform  │◄──►│ Exchange  │◄──►│  Contract │                       │ │
│  │  │ Staking   │    │ Order Book│    │    EVM    │                       │ │
│  │  │ Validators│    │ 100k+ TPS │    │ Full EVM  │                       │ │
│  │  └───────────┘    └───────────┘    └───────────┘                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                          │
│                              Warp Protocol                                    │
│                         (Native Cross-Chain)                                  │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                   SPECIALIZED CHAINS (Ecosystem License)                 │ │
│  │                                                                          │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │
│  │  │Q-Chain  │ │Z-Chain  │ │T-Chain  │ │B-Chain  │ │A-Chain  │           │ │
│  │  │Quantum  │ │Privacy  │ │Threshold│ │Bridge   │ │   AI    │           │ │
│  │  │  PQC    │ │FHE + ZK │ │MPC/TSS  │ │Cross-Net│ │Mining   │           │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │ │
│  │                                                                          │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                       │ │
│  │  │K-Chain  │ │G-Chain  │ │D-Chain  │ │I-Chain  │                       │ │
│  │  │KMS/HSM  │ │GraphQL  │ │  DEX    │ │Identity │                       │ │
│  │  │+Secrets │ │Indexing │ │Advanced │ │(proposed)                       │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      APPLICATION CHAINS (L1/L2/L3)                       │ │
│  │         Custom chains deployed by developers and enterprises             │ │
│  │              Inherit security from Primary Network                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Chains (11 Active + 1 Proposed)

### Core Infrastructure Chains

These chains are fully open source under BSD-3-Clause and form the foundation of the network.

#### P-Chain (Platform Chain)
**Purpose**: Network coordination, validator management, staking

| Feature | Specification |
|---------|---------------|
| Consensus | Snowman (linear chain) |
| Staking | Minimum 2,000 LUX |
| Delegation | Up to 3M LUX per validator |
| Finality | Sub-second |
| Role | Manages all other chains |

**Key Capabilities**:
- Validator set management and staking rewards
- Chain creation and configuration
- Cross-chain messaging registry
- Network-wide governance

#### X-Chain (Exchange Chain)
**Purpose**: High-performance asset exchange with native order book

| Feature | Specification |
|---------|---------------|
| Consensus | Lux DAG (parallel processing) |
| Throughput | 100,000+ orders/second |
| Matching | Price-time priority (CLOB) |
| Settlement | Atomic, deterministic |
| Quantum Safety | Lamport One-Time Signatures |

**Key Capabilities**:
- Sub-millisecond order matching
- Native multi-asset support
- Zero MEV by design
- Cross-chain settlement via Warp

#### C-Chain (Contract Chain)
**Purpose**: Full EVM compatibility for smart contracts

| Feature | Specification |
|---------|---------------|
| Consensus | Snowman |
| EVM Version | Cancun (latest) |
| Chain ID | 96369 |
| Gas Model | EIP-1559 compatible |
| Finality | Sub-second |

**Key Capabilities**:
- Full Ethereum tooling compatibility
- Native precompiles for crypto operations
- Seamless DeFi deployment
- 60+ standard EIPs implemented

---

### Specialized Chains (Ecosystem License)

These chains provide advanced cryptographic and specialized capabilities.

#### Q-Chain (Quantum Chain)
**Purpose**: Post-quantum cryptography operations

| Feature | Specification |
|---------|---------------|
| Algorithms | NIST FIPS 203/204/205 |
| Key Types | ML-KEM, ML-DSA, SLH-DSA |
| Hybrid Mode | Classical + PQC |
| Migration | Graceful key rotation |

**Key Capabilities**:
- Quantum-safe key generation and management
- Lattice-based signature verification
- Hybrid classical/PQC modes for transition
- Future-proof cryptographic infrastructure

**Why It Matters**: Quantum computers will eventually break current cryptography. Q-Chain ensures your assets and data remain secure decades from now.

#### Z-Chain (Zero-Knowledge/Privacy Chain)
**Purpose**: Privacy-preserving computation

| Feature | Specification |
|---------|---------------|
| FHE | Native TFHE operations |
| ZK Proofs | Groth16, PLONK, STARK |
| GPU Accel | MLX/Metal optimized |
| Precompiles | 21+ FHE/ZK precompiles |

**Key Capabilities**:
- Encrypted smart contract execution (fhEVM)
- Private state with public verifiability
- Confidential DeFi (dark pools, private AMMs)
- Homomorphic operations on encrypted data

**Why It Matters**: True privacy without sacrificing compliance. Compute on encrypted data without ever decrypting it.

#### T-Chain (Threshold Chain)
**Purpose**: Distributed key management and threshold signatures

| Feature | Specification |
|---------|---------------|
| Protocols | GG18, GG20, CGGMP21 |
| Threshold | Configurable t-of-n |
| Key Rotation | Non-disruptive refresh |
| Recovery | Social recovery support |

**Key Capabilities**:
- Institutional-grade custody without single points of failure
- Cross-chain signing for bridges
- Distributed key generation (DKG)
- Byzantine-fault-tolerant coordination

**Why It Matters**: No single party ever holds complete keys. Perfect for DAOs, treasuries, and enterprise custody.

#### B-Chain (Bridge Chain)
**Purpose**: Cross-network asset and message transfer

| Feature | Specification |
|---------|---------------|
| Networks | Ethereum, Bitcoin, Cosmos, Solana |
| Verification | Light client proofs |
| Security | Threshold-signed attestations |
| Finality | Source chain finality |

**Key Capabilities**:
- Trustless bridging via light client verification
- Replay-resistant message passing
- Native liquidity pools
- Multi-network asset custody

**Why It Matters**: Connect to any blockchain without trusted intermediaries.

#### A-Chain (AI/Attestation Chain)
**Purpose**: AI compute verification and proof-of-inference

| Feature | Specification |
|---------|---------------|
| TEE Support | Intel SGX, AMD SEV, ARM CCA |
| Verification | Proof of inference |
| Models | On-chain model registry |
| Privacy | Confidential compute |

**Key Capabilities**:
- Verifiable AI inference
- Decentralized model training
- Privacy-preserving ML
- AI agent coordination

**Why It Matters**: AI you can verify. Ensure AI outputs are authentic and untampered.

#### K-Chain (Key Management Chain)
**Purpose**: Enterprise key management and secrets infrastructure

| Feature | Specification |
|---------|---------------|
| HSM | Hardware security module integration |
| Ceremonies | Multi-party key generation |
| Secrets | Threshold-encrypted storage |
| Audit | Full key lifecycle logging |
| Compliance | SOC2, FIPS 140-3 ready |

**Key Capabilities**:
- Hardware-backed key storage
- Multi-party computation for key ceremonies
- Distributed secret storage with access policies
- Time-locked encryption and automatic rotation
- Air-gap compatible operations
- Full audit trail

#### G-Chain (GraphQL/Indexing Chain)
**Purpose**: High-performance blockchain indexing

| Feature | Specification |
|---------|---------------|
| Query | GraphQL native |
| Indexing | Real-time block processing |
| Storage | Distributed index nodes |
| API | Subgraph compatible |

**Key Capabilities**:
- Real-time blockchain data queries
- Custom indexing pipelines
- Cross-chain data aggregation
- DApp data layer

#### D-Chain (DEX Chain)
**Purpose**: Advanced decentralized exchange features

| Feature | Specification |
|---------|---------------|
| Margin | Cross-margin trading |
| Derivatives | Perpetuals, options |
| Collateral | Multi-asset |
| Liquidation | Graceful, MEV-resistant |

**Key Capabilities**:
- Advanced order types
- Cross-margin portfolios
- Perpetual contracts
- Options and structured products

#### I-Chain (Identity Chain) — *Proposed*
**Purpose**: Decentralized identity and credentials

| Feature | Specification |
|---------|---------------|
| Standard | W3C DID, Verifiable Credentials |
| Privacy | Selective disclosure |
| Recovery | Social recovery |
| Compliance | KYC/AML compatible |

**Key Capabilities** (planned):
- Self-sovereign identity
- Privacy-preserving KYC
- Credential issuance and verification
- Cross-chain identity

*Note: I-Chain is under consideration. Identity features may be integrated into existing chains.*

---

## Core Protocols

### Quasar Consensus Family

Lux implements the Snow consensus family with novel extensions:

| Protocol | Use Case |
|----------|----------|
| **Photon** | Ultra-fast finality for payments |
| **Wave** | High-throughput for exchanges |
| **Focus** | Deterministic for governance |
| **Prism** | Privacy-enhanced consensus |
| **Horizon** | Long-range planning |
| **Flare** | Emergency response |

**Properties**:
- Sub-second finality
- Probabilistic safety (configurable)
- Leaderless (no single point of failure)
- Scalable to 10,000+ validators

### Warp Protocol (Cross-Chain Messaging)

Native, trustless cross-chain communication:

```
Chain A                    P-Chain                    Chain B
   │                          │                          │
   │  1. Create message       │                          │
   │──────────────────────────>                          │
   │                          │                          │
   │  2. Validators sign      │                          │
   │  (BLS aggregation)       │                          │
   │                          │                          │
   │                          │  3. Message relayed      │
   │                          │─────────────────────────>│
   │                          │                          │
   │                          │  4. Verify signature     │
   │                          │  against validator set   │
```

**No bridges. No relayers. Protocol-native.**

### Teleport Protocol (Asset Bridging)

Cross-network asset transfer with cryptographic proofs:

- Light client verification (no trusted third parties)
- Threshold-signed attestations
- Replay protection
- Configurable security levels

---

## Tokenomics & Fees

### LUX Token

| Parameter | Value |
|-----------|-------|
| **Ticker** | LUX |
| **Total Supply** | 2,000,000,000,000 (2T) |
| **Decimals** | 18 (C-Chain), 6 (P/X-Chain) |

**Allocations**:
- **C-Chain**: 1.8T — Smart contracts, DeFi, accounts
- **P-Chain**: 100B — Staking and validator coordination
- **X-Chain**: 100B — Settlement layer and asset exchange

### Staking Requirements

| Tier | Minimum Stake | Rewards |
|------|---------------|---------|
| **Genesis NFT** | 500K LUX | 2x (limited to 100) |
| **Pioneer NFT** | 750K LUX | 1.5x (limited to 500) |
| **Standard** | 1M LUX | 1x (unlimited) |
| **Delegator** | 25K LUX | Variable |
| **Bridge Validator** | 100M LUX + KYC | Bridge fees |

### Fee Model (EIP-1559 Adapted)

Lux uses a multi-resource fee model with per-chain tuning:

```
Fee = w(tx) × (baseFee + priorityFee)

where:
  w(tx) = pByte × bytes + pExec × exec + pState × state
```

**Key Properties**:
- **Per-Chain Independence**: Each chain has its own fee parameters
- **DAO Governance**: Fee parameters controlled via C-Chain governance
- **Anti-Spam**: Congestion multipliers prevent spam attacks
- **Predictable**: Users know max fees upfront (EIP-1559 style)

### Fee Distribution (DAO Configurable)

**Base Fee** (default split):
| Recipient | Share | Purpose |
|-----------|-------|---------|
| **Burn** | 50% | Deflationary pressure |
| **DAO Treasury** | 50% | Distributed via governance gauges |

**Priority Fee**: 100% to validators/sequencers

**Treasury Distribution**: The DAO's 50% share is distributed according to **governance gauges** — stakeholders vote on allocation weights between protocols, validators, liquidity providers, grants, and other ecosystem participants. This creates a programmable incentive layer where the community directs protocol revenue.

All fee parameters are **governance-controlled** via C-Chain DAO with 24-hour timelock.

**Related LPs**: LP-0016 (Fee Pricing Protocol), LP-9019 (Fee Distribution)

---

## Technology Innovations

Lux has developed **150+ innovations** across key areas:

| Category | Innovations | Highlights |
|----------|-------------|------------|
| **FHE/Privacy** | 40+ | Blockchain-optimized TFHE, GPU acceleration |
| **Post-Quantum** | 15 | Lattice signatures, hybrid modes, migration |
| **Consensus** | 12 | Multi-consensus, validator sharding |
| **Threshold Crypto** | 12 | Dynamic resharing, Byzantine coordination |
| **DEX** | 11 | FPGA matching, quantum-safe orders |
| **Bridge** | 13 | Light client proofs, threshold attestations |
| **Wallet/KMS** | 13 | Air-gap protocols, social recovery |
| **EVM Precompiles** | 21+ | FHE, ZK, ring signatures, DEX |
| **MPC** | 9 | Multi-protocol framework, key rotation |
| **AI Mining** | 6 | Proof of inference, confidential compute |

---

## Why Build on Lux?

### For DeFi Developers

- **Native DEX infrastructure**: Order book with 100k+ TPS, zero MEV
- **Private DeFi**: Build dark pools, private AMMs with FHE
- **Cross-chain**: Native bridging to all major networks
- **Advanced derivatives**: Perpetuals, options on D-Chain

### For Enterprise

- **Compliance ready**: Privacy-preserving KYC (I-Chain proposed)
- **Institutional custody**: Threshold signatures, no single points of failure
- **Quantum safe**: Future-proof cryptography on Q-Chain
- **Audit trails**: Full transaction and key lifecycle logging

### For Privacy Applications

- **Encrypted computation**: Run smart contracts on encrypted data
- **Zero-knowledge proofs**: Prove statements without revealing data
- **Confidential AI**: Train and run models on private data
- **Selective disclosure**: Share only what's needed

### For AI/ML

- **Verifiable inference**: Prove AI outputs are authentic
- **Decentralized training**: Coordinate GPU resources
- **Privacy-preserving ML**: Train on encrypted data
- **Agent coordination**: Multi-agent orchestration on A-Chain

---

## Getting Started

### Quick Start

```bash
# Install Lux CLI
curl -sSL https://get.lux.network | sh

# Start a local network
lux network start local

# Deploy to testnet
lux network start testnet
```

### Deploy a Smart Contract

```bash
# Standard Ethereum tooling works
forge create --rpc-url https://api.lux.network/ext/bc/C/rpc \
  --private-key $PRIVATE_KEY \
  src/MyContract.sol:MyContract
```

### Create a Custom Chain

```bash
# Define your chain
lux chain create my-chain \
  --vm subnet-evm \
  --consensus snowman

# Deploy to network
lux chain deploy my-chain
```

---

## Network Parameters

| Parameter | Mainnet | Testnet |
|-----------|---------|---------|
| Network ID | 1 | 96368 |
| C-Chain ID | 96369 | 96370 |
| Native Token | LUX | LUX |
| Block Time | ~2 seconds | ~2 seconds |
| Finality | Sub-second | Sub-second |

### RPC Endpoints

| Chain | Mainnet | Testnet |
|-------|---------|---------|
| C-Chain | `https://api.lux.network/ext/bc/C/rpc` | `https://api.testnet.lux.network/ext/bc/C/rpc` |
| X-Chain | `https://api.lux.network/ext/bc/X` | `https://api.testnet.lux.network/ext/bc/X` |
| P-Chain | `https://api.lux.network/ext/bc/P` | `https://api.testnet.lux.network/ext/bc/P` |

---

## Licensing

### Two-Tier Model

| Tier | License | Scope |
|------|---------|-------|
| **Core** | BSD-3-Clause | P-Chain, X-Chain, C-Chain |
| **Ecosystem** | Lux Ecosystem v1.2 | All specialized chains + crypto packages |

### Ecosystem License Terms

- ✅ Research and academic use
- ✅ Lux Primary Network (mainnet/testnet)
- ✅ L1/L2/L3 chains descending from Lux Primary
- ❌ Forks (absolutely not)
- 📧 Commercial outside ecosystem → licensing@lux.network

---

## Resources

### Documentation
- **LPs (Lux Proposals)**: Technical specifications
- **Developer Docs**: https://docs.lux.network
- **API Reference**: https://api.lux.network

### Community
- **GitHub**: https://github.com/luxfi
- **Discord**: https://discord.gg/lux
- **Twitter**: https://twitter.com/luxfi

### Enterprise
- **Licensing**: licensing@lux.network
- **Partnerships**: partners@lux.network

---

## Summary

Lux is not just another blockchain—it's a **network of purpose-built blockchains** designed for the demands of next-generation Web3:

1. **Quantum-Safe**: Native post-quantum cryptography ensures long-term security
2. **Privacy-First**: FHE and ZK enable computation on encrypted data
3. **Horizontally Scalable**: 11 specialized chains, each optimized for its workload
4. **Trustless Interoperability**: Protocol-native cross-chain messaging
5. **Institutional Grade**: Threshold signatures, compliance-ready identity
6. **Developer Friendly**: Full EVM compatibility, familiar tooling

**Build the future. Build on Lux.**

---

## Related LPs

- **LP-0002**: Recursive Network Architecture
- **LP-0010**: Technology Portfolio
- **LP-0012**: Ecosystem Licensing
- **LP-0099**: LP Numbering Scheme
- **LP-1000**: P-Chain Specification
- **LP-1100**: X-Chain Specification
- **LP-1200**: C-Chain Specification
- **LP-2000**: Q-Chain Specification
- **LP-4000**: Z-Chain Specification
- **LP-5000**: T-Chain Specification

---

*Last updated: 2025-12-30*
