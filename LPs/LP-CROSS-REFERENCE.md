# Lux Proposal (LP) Cross-Reference Map

**Generated**: 2025-11-23
**Total LPs**: 120

This document provides a comprehensive cross-reference map showing dependencies and relationships between all Lux Proposals.

## Table of Contents

- [Core Protocol](#core-protocol)
- [Bridge](#bridge)
- [Token Standards](#token-standards)
- [Post-Quantum](#post-quantum)
- [Performance](#performance)
- [DeFi](#defi)
- [AI/ML](#ai-ml)
- [Privacy](#privacy)
- [Rollups](#rollups)
- [Research](#research)
- [Meta](#meta)
- [Other](#other)
- [Dependency Chains](#dependency-chains)
- [Implementation Paths](#implementation-paths)

## Core Protocol

### LP-0: Lux Network Architecture & Community Framework

**Status**: Final

**Depends on**: None
**Required by**: LP-92, LP-94, LP-96, LP-97
**Related**: LP-11, LP-12, LP-13, LP-14, LP-80, LP-81, LP-98, LP-99

### LP-1: Primary Chain, Native Tokens, and Tokenomics

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-13, LP-42, LP-74, LP-75, LP-76, LP-91, LP-94, LP-95, LP-319
**Related**: LP-2, LP-3, LP-4, LP-5, LP-6, LP-7

### LP-2: Lux Virtual Machine and Execution Environment

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: LP-13, LP-319, LP-400
**Related**: LP-20, LP-176, LP-204, LP-226, LP-721, LP-1155

### LP-3: Lux Subnet Architecture and Cross-Chain Interoperability

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: LP-13, LP-319

### LP-4: Quantum-Resistant Cryptography Integration in Lux

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: LP-5, LP-99, LP-105, LP-110, LP-311, LP-312, LP-320, LP-321, LP-322, LP-323

### LP-5: Lux Quantum-Safe Wallets and Multisig Standard

**Status**: Final
**Category**: Core

**Depends on**: LP-4
**Required by**: LP-13, LP-99, LP-105, LP-110, LP-319

### LP-6: Network Runner & Testing Framework

**Status**: Draft
**Category**: Interface

**Depends on**: None
**Required by**: LP-13, LP-36, LP-37, LP-319

### LP-7: VM SDK Specification

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: None

### LP-8: Plugin Architecture

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: None

### LP-9: CLI Tool Specification

**Status**: Draft
**Category**: Interface

**Depends on**: None
**Required by**: None
**Related**: LP-6, LP-7, LP-8, LP-10, LP-18

### LP-10: P-Chain (Platform Chain) Specification [DEPRECATED]

**Status**: Superseded
**Category**: Core

**Depends on**: None
**Required by**: LP-80, LP-94, LP-97, LP-99
**Related**: LP-0, LP-2, LP-11, LP-12, LP-13, LP-181, LP-605

### LP-11: X-Chain (Exchange Chain) Specification

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-80, LP-96
**Related**: LP-0, LP-4, LP-10, LP-12, LP-13, LP-20, LP-36, LP-105, LP-301, LP-600

### LP-12: C-Chain (Contract Chain) Specification

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-80, LP-96, LP-97, LP-101
**Related**: LP-0, LP-3, LP-3, LP-10, LP-11, LP-13, LP-20, LP-204, LP-226, LP-311

## Bridge

### LP-13: M-Chain – Decentralised MPC Custody & Swap-Signature Layer

**Status**: Draft
**Category**: Core

**Depends on**: LP-1, LP-2, LP-3, LP-5, LP-6
**Required by**: LP-15, LP-72, LP-81, LP-92
**Related**: LP-0, LP-10, LP-11, LP-12, LP-14, LP-16, LP-17, LP-18, LP-301, LP-322

### LP-14: M-Chain Threshold Signatures with CGG21 (UC Non-Interactive ECDSA)

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-81, LP-92, LP-93, LP-97, LP-103, LP-104
**Related**: LP-13, LP-15, LP-16, LP-17, LP-18, LP-322, LP-323

### LP-15: MPC Bridge Protocol

**Status**: Draft
**Category**: Bridge

**Depends on**: LP-13
**Required by**: LP-81
**Related**: LP-14, LP-16, LP-17, LP-18, LP-301, LP-322

### LP-16: Teleport Cross-Chain Protocol

**Status**: Draft
**Category**: Bridge

**Depends on**: None
**Required by**: None
**Related**: LP-15, LP-17, LP-18, LP-301

### LP-17: Bridge Asset Registry

**Status**: Draft
**Category**: Bridge

**Depends on**: None
**Required by**: None
**Related**: LP-15, LP-16, LP-18, LP-20, LP-301, LP-721

### LP-18: Cross-Chain Message Format

**Status**: Draft
**Category**: Bridge

**Depends on**: None
**Required by**: None
**Related**: LP-15, LP-16, LP-17, LP-300, LP-301

### LP-19: Bridge Security Framework

**Status**: Draft
**Category**: Bridge

**Depends on**: None
**Required by**: None
**Related**: LP-15, LP-16

## Token Standards

### LP-20: LRC-20 Fungible Token Standard

**Status**: Final
**Category**: LRC

**Depends on**: None
**Required by**: LP-28, LP-29, LP-30, LP-42, LP-70, LP-71, LP-72, LP-91, LP-95, LP-400, LP-401, LP-402, LP-403, LP-500
**Related**: LP-12, LP-21, LP-26, LP-721, LP-1155

### LP-23: 'NFT Staking and Native Interchain Transfer'

**Status**: Draft
**Category**: LRC

**Depends on**: LP-21
**Required by**: None
**Related**: LP-20, LP-22

### LP-27: 'LRC Token Standards Adoption'

**Status**: Draft
**Category**: LRC

**Depends on**: LP-26
**Required by**: None
**Related**: LP-20, LP-28, LP-29, LP-30, LP-31, LP-721, LP-1155

### LP-28: LRC-20 Burnable Token Extension

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20
**Required by**: LP-30
**Related**: LP-26, LP-27

### LP-29: LRC-20 Mintable Token Extension

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20
**Required by**: None

### LP-30: LRC-20 Bridgable Token Extension

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20, LP-28
**Required by**: None

### LP-31: LRC-721 Burnable Token Extension

**Status**: Draft
**Category**: LRC

**Depends on**: LP-721
**Required by**: None

### LP-721: LRC-721 Non-Fungible Token Standard

**Status**: Final
**Category**: LRC

**Depends on**: None
**Required by**: LP-31, LP-70, LP-71
**Related**: LP-12, LP-20, LP-1155

### LP-1155: LRC-1155 Multi-Token Standard

**Status**: Final
**Category**: LRC

**Depends on**: None
**Required by**: LP-70
**Related**: LP-12, LP-20, LP-721

## Post-Quantum

### LP-200: Post-Quantum Cryptography Suite for Lux Network

**Status**: Draft
**Category**: Core

**Depends on**: LP-700
**Required by**: LP-201, LP-202

### LP-201: Hybrid Classical-Quantum Cryptography Transitions

**Status**: Draft
**Category**: Core

**Depends on**: LP-200
**Required by**: LP-202

### LP-202: Cryptographic Agility Framework

**Status**: Draft
**Category**: Core

**Depends on**: LP-200, LP-201
**Required by**: None

### LP-311: ML-DSA Signature Verification Precompile

**Status**: Draft
**Category**: Core

**Depends on**: LP-4
**Required by**: LP-312, LP-320

### LP-312: SLH-DSA Signature Verification Precompile

**Status**: Draft
**Category**: Core

**Depends on**: LP-4, LP-311
**Required by**: None
**Related**: LP-320

### LP-313: Warp Messaging Precompile

**Status**: Draft
**Category**: Core

**Depends on**: LP-22
**Required by**: None
**Related**: LP-311, LP-312

### LP-314: Fee Manager Precompile

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-176

### LP-315: Enhanced Cross-Chain Communication Protocol

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-176, LP-226, LP-602, LP-700

### LP-316: ML-DSA Post-Quantum Digital Signatures

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-303, LP-312, LP-313

### LP-317: SLH-DSA Stateless Hash-Based Digital Signatures

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-303, LP-311, LP-313

### LP-318: ML-KEM Post-Quantum Key Encapsulation

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-303, LP-311, LP-312, LP-313

### LP-320: Dynamic EVM Gas Limit and Price Discovery Updates

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: LP-325
**Related**: LP-176

### LP-320: Ringtail Threshold Signature Precompile

**Status**: Draft
**Category**: Core

**Depends on**: LP-4, LP-311
**Required by**: LP-325
**Related**: LP-99, LP-321, LP-322

### LP-321: FROST Threshold Signature Precompile

**Status**: Draft
**Category**: Core

**Depends on**: LP-4
**Required by**: LP-325
**Related**: LP-320, LP-322, LP-323

### LP-322: CGGMP21 Threshold ECDSA Precompile

**Status**: Draft
**Category**: Core

**Depends on**: LP-4
**Required by**: LP-325
**Related**: LP-320, LP-321, LP-323

### LP-323: LSS-MPC Dynamic Resharing Extension

**Status**: Draft
**Category**: Core

**Depends on**: LP-4
**Required by**: LP-325
**Related**: LP-311, LP-320, LP-321, LP-322

## Performance

### LP-118: Subnet-EVM Compatibility Layer

**Status**: Implemented
**Category**: Interface

**Depends on**: None
**Required by**: None

### LP-176: Dynamic Gas Pricing Mechanism

**Status**: Implemented
**Category**: Core

**Depends on**: None
**Required by**: None

### LP-181: Epoching and Validator Rotation

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: LP-326
**Related**: LP-1, LP-2, LP-3, LP-600, LP-605

### LP-204: secp256r1 Curve Integration

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-1, LP-2, LP-3, LP-181

### LP-226: Dynamic Minimum Block Times (Granite Upgrade)

**Status**: Final
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-181, LP-204, LP-601

### LP-601: Dynamic Gas Fee Mechanism with AI Compute Pricing

**Status**: Draft
**Category**: Core

**Depends on**: LP-600
**Required by**: LP-605, LP-607

### LP-602: Warp Cross-Chain Messaging Protocol

**Status**: Draft
**Category**: Networking

**Depends on**: LP-603
**Required by**: LP-605

### LP-603: Verkle Trees for Efficient State Management

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-602, LP-604, LP-608

### LP-604: State Sync and Pruning Protocol

**Status**: Draft
**Category**: Core

**Depends on**: LP-603
**Required by**: None

### LP-605: Elastic Validator Subnets

**Status**: Draft
**Category**: Core

**Depends on**: LP-601, LP-602
**Required by**: None

### LP-607: GPU Acceleration Framework

**Status**: Draft
**Category**: Core

**Depends on**: LP-601
**Required by**: LP-608

### LP-608: High-Performance Decentralized Exchange Protocol

**Status**: Draft
**Category**: LRC

**Depends on**: LP-603, LP-607
**Required by**: None

## DeFi

### LP-60: DeFi Protocols Overview

**Status**: Draft

**Depends on**: None
**Required by**: LP-95
**Related**: LP-6, LP-13, LP-15, LP-20, LP-50, LP-61, LP-62, LP-63, LP-64, LP-65

### LP-70: NFT Staking Standard

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20, LP-721, LP-1155
**Required by**: None

### LP-71: Media Content NFT Standard

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20, LP-721
**Required by**: None

### LP-72: Bridged Asset Standard

**Status**: Draft
**Category**: LRC

**Depends on**: LP-13, LP-20
**Required by**: None

### LP-73: Batch Execution Standard (Multicall)

**Status**: Draft
**Category**: LRC

**Depends on**: None
**Required by**: None

### LP-74: CREATE2 Factory Standard

**Status**: Draft
**Category**: LRC

**Depends on**: LP-1
**Required by**: None

## AI/ML

### LP-100: NIST Post-Quantum Cryptography Integration for Lux Network

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-500
**Related**: LP-4, LP-5

### LP-101: Solidity GraphQL Extension for Native G-Chain Integration

**Status**: Draft
**Category**: Core

**Depends on**: LP-12, LP-26, LP-98
**Required by**: LP-500

### LP-102: Immutable Training Ledger for Privacy-Preserving AI

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-500
**Related**: LP-100

### LP-103: MPC-LSS - Multi-Party Computation Linear Secret Sharing with Dynamic Resharing

**Status**: Draft
**Category**: Core

**Depends on**: LP-14
**Required by**: LP-104
**Related**: LP-13

### LP-104: FROST - Flexible Round-Optimized Schnorr Threshold Signatures for EdDSA

**Status**: Draft
**Category**: Core

**Depends on**: LP-14, LP-103
**Required by**: None

### LP-105: Lamport One-Time Signatures (OTS) for Lux Safe

**Status**: Draft
**Category**: Core

**Depends on**: LP-4, LP-5
**Required by**: None
**Related**: LP-11

### LP-106: LLM Gateway Integration with Hanzo AI

**Status**: Draft
**Category**: Interface

**Depends on**: None
**Required by**: None
**Related**: LP-10, LP-103

### LP-110: Quasar Consensus Protocol

**Status**: Draft
**Category**: Core

**Depends on**: LP-4, LP-5
**Required by**: LP-111, LP-112

### LP-111: photon consensus selection

**Status**: Draft
**Category**: Core

**Depends on**: LP-110
**Required by**: LP-112

### LP-112: flare dag finalization protocol

**Status**: Draft
**Category**: Core

**Depends on**: LP-110, LP-111
**Required by**: None

## Privacy

### LP-400: Automated Market Maker Protocol with Privacy

**Status**: Draft
**Category**: LRC

**Depends on**: LP-2, LP-20
**Required by**: LP-402
**Related**: LP-311, LP-700

### LP-401: Confidential Lending Protocol

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20, LP-64, LP-67
**Required by**: None
**Related**: LP-200, LP-321, LP-322, LP-400

### LP-402: Zero-Knowledge Swap Protocol

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20, LP-400
**Required by**: None
**Related**: LP-320

### LP-403: Private Staking Mechanisms

**Status**: Draft
**Category**: LRC

**Depends on**: LP-20, LP-69
**Required by**: None
**Related**: LP-110, LP-310, LP-320, LP-322

## Rollups

### LP-500: Layer 2 Rollup Framework

**Status**: Draft
**Category**: Core

**Depends on**: LP-20, LP-100, LP-101, LP-102
**Required by**: LP-501, LP-502, LP-503, LP-504, LP-505

### LP-501: Data Availability Layer

**Status**: Draft
**Category**: Core

**Depends on**: LP-500
**Required by**: LP-502, LP-503, LP-504, LP-505

### LP-502: Fraud Proof System

**Status**: Draft
**Category**: Core

**Depends on**: LP-500, LP-501
**Required by**: LP-504, LP-505

### LP-503: Validity Proof System

**Status**: Draft
**Category**: Core

**Depends on**: LP-500, LP-501
**Required by**: LP-504, LP-505

### LP-504: Sequencer Registry Protocol

**Status**: Draft
**Category**: Core

**Depends on**: LP-500, LP-501, LP-502, LP-503
**Required by**: LP-505

### LP-505: L2 Block Format Specification

**Status**: Draft
**Category**: Core

**Depends on**: LP-500, LP-501, LP-502, LP-503, LP-504
**Required by**: None

## Research

### LP-90: Research Papers Index

**Status**: Draft

**Depends on**: None
**Required by**: None
**Related**: LP-4, LP-5, LP-50, LP-60, LP-91, LP-92, LP-93, LP-94, LP-95

### LP-91: Payment Processing Research

**Status**: Draft

**Depends on**: LP-1, LP-20, LP-40
**Required by**: None

### LP-92: Cross-Chain Messaging Research

**Status**: Draft

**Depends on**: LP-0, LP-13, LP-14
**Required by**: None

### LP-93: Decentralized Identity Research

**Status**: Draft

**Depends on**: LP-14, LP-40, LP-66
**Required by**: None

### LP-94: Governance Framework Research

**Status**: Draft

**Depends on**: LP-0, LP-1, LP-10
**Required by**: None

### LP-95: Stablecoin Mechanisms Research

**Status**: Draft

**Depends on**: LP-1, LP-20, LP-60
**Required by**: None

### LP-96: MEV Protection Research

**Status**: Draft

**Depends on**: LP-0, LP-11, LP-12
**Required by**: None

### LP-97: Data Availability Research

**Status**: Draft

**Depends on**: LP-0, LP-10, LP-12, LP-14
**Required by**: None

### LP-98: "Luxfi GraphDB & GraphQL Engine Integration"

**Status**: Draft
**Category**: Interface

**Depends on**: None
**Required by**: LP-101

### LP-99: Q-Chain – Quantum-Secure Consensus Protocol Family (Quasar)

**Status**: Draft
**Category**: Core

**Depends on**: LP-4, LP-5, LP-10, LP-75
**Required by**: None

## Meta

### LP-50: Developer Tools Overview

**Status**: Draft

**Depends on**: None
**Required by**: None
**Related**: LP-0, LP-1, LP-2, LP-6, LP-7, LP-8, LP-9, LP-20, LP-721

## Other

### LP-21: Lux Teleport Protocol

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-22, LP-23
**Related**: LP-19

### LP-22: 'Warp Messaging 2.0: Native Interchain Transfers'

**Status**: Draft
**Category**: Networking

**Depends on**: LP-21
**Required by**: LP-24, LP-313
**Related**: LP-26

### LP-24: 'Parallel Validation and Shared Mempool'

**Status**: Draft
**Category**: Core

**Depends on**: LP-22
**Required by**: None

### LP-25: 'L2 to Sovereign L1 Ascension and Fee Model'

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-21, LP-22, LP-24

### LP-26: 'C-Chain EVM Equivalence and Core EIPs Adoption'

**Status**: Draft
**Category**: Core

**Depends on**: None
**Required by**: LP-27, LP-32, LP-33, LP-35, LP-101
**Related**: LP-226

### LP-32: C-Chain Rollup Plugin Architecture

**Status**: Draft
**Category**: Core

**Depends on**: LP-26
**Required by**: LP-33, LP-34, LP-37

### LP-33: P-Chain State Rollup to C-Chain EVM

**Status**: Draft
**Category**: Core

**Depends on**: LP-26, LP-32
**Required by**: LP-34, LP-37

### LP-34: P-Chain as Superchain L2 – OP Stack Rollup Integration

**Status**: Draft
**Category**: Core

**Depends on**: LP-32, LP-33
**Required by**: LP-35, LP-37

### LP-35: Stage-Sync Pipeline for Coreth Bootstrapping

**Status**: Draft
**Category**: Core

**Depends on**: LP-26, LP-34
**Required by**: None

### LP-36: X-Chain Order-Book DEX API & RPC Addendum

**Status**: Draft
**Category**: Interface

**Depends on**: LP-6
**Required by**: LP-39

### LP-37: Native Swap Integration on M-Chain, X-Chain, and Z-Chain

**Status**: Draft
**Category**: Core

**Depends on**: LP-6, LP-32, LP-33, LP-34
**Required by**: None

### LP-39: LX Python SDK Corollary for On-Chain Actions

**Status**: Draft
**Category**: Interface

**Depends on**: LP-36, LP-38
**Required by**: None

### LP-40: Wallet Standards

**Status**: Draft
**Category**: Interface

**Depends on**: None
**Required by**: LP-42, LP-91, LP-93

### LP-42: Multi-Signature Wallet Standard

**Status**: Draft
**Category**: LRC

**Depends on**: LP-1, LP-20, LP-40
**Required by**: None

### LP-45: Z-Chain Encrypted Execution Layer Interface

**Status**: Draft
**Category**: Interface

**Depends on**: None
**Required by**: None

### LP-75: TEE Integration Standard

**Status**: Draft
**Category**: Core

**Depends on**: LP-1, LP-76
**Required by**: LP-76, LP-80, LP-81, LP-99

### LP-76: Random Number Generation Standard

**Status**: Draft
**Category**: Core

**Depends on**: LP-1, LP-75
**Required by**: LP-75

### LP-80: A-Chain (Attestation Chain) Specification

**Status**: Draft
**Category**: Core

**Depends on**: LP-10, LP-11, LP-12, LP-75
**Required by**: None

### LP-81: B-Chain (Bridge Chain) Specification

**Status**: Draft
**Category**: Core

**Depends on**: LP-13, LP-14, LP-15, LP-75
**Required by**: None

### LP-85: Security Audit Framework

**Status**: Draft
**Category**: Meta

**Depends on**: None
**Required by**: None

### LP-301: Lux B-Chain - Cross-Chain Bridge Protocol

**Status**: Active (
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-181, LP-302, LP-303

### LP-302: Lux Z/A-Chain - Privacy & AI Attestation Layer

**Status**: Active
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-301, LP-303

### LP-303: Lux Q-Security - Post-Quantum P-Chain Integration

**Status**: Active
**Category**: Core

**Depends on**: None
**Required by**: None
**Related**: LP-204, LP-301, LP-302

### LP-319: M-Chain – Decentralised MPC Custody & Swap-Signature Layer

**Status**: Superseded
**Category**: Core

**Depends on**: LP-1, LP-2, LP-3, LP-5, LP-6
**Required by**: None
**Related**: LP-13

### LP-325: Lux KMS Hardware Security Module Integration

**Status**: Active
**Category**: Infrastructure

**Depends on**: LP-320, LP-321, LP-322, LP-323
**Required by**: None

### LP-326: Blockchain Regenesis and State Migration

**Status**: Active
**Category**: Core

**Depends on**: LP-181
**Required by**: None

## Dependency Chains

Critical dependency paths showing how LPs build on each other.

### Post-Quantum Cryptography Chain

```
LP-4 (Quantum-Resistant Cryptography Integration)
  ↓
LP-200 (Post-Quantum Cryptography Suite)
  ├→ LP-311 (ML-DSA Signatures)
  ├→ LP-312 (SLH-DSA Signatures)
  ├→ LP-313 (ML-KEM Key Encapsulation)
  └→ LP-201 (Hybrid Classical-Quantum Transitions)
      └→ LP-202 (Cryptographic Agility Framework)

LP-320 (Ringtail Threshold Signatures)
LP-321 (FROST Threshold Signatures)
LP-322 (CGGMP21 Threshold ECDSA)
  └→ LP-323 (LSS-MPC Dynamic Resharing)
```

### Core Protocol Chain

```
LP-0 (Network Architecture)
  ├→ LP-1 (Native Tokens & Tokenomics)
  ├→ LP-2 (Virtual Machine)
  │    ├→ LP-20 (LRC-20 Token Standard)
  │    ├→ LP-721 (LRC-721 NFT Standard)
  │    └→ LP-1155 (LRC-1155 Multi-Token)
  └→ LP-3 (Subnet Architecture)
       ├→ LP-13 (M-Chain MPC)
       ├→ LP-15 (MPC Bridge)
       └→ LP-22 (Warp Messaging 2.0)
```

### Performance Optimization Chain

```
LP-118 (Subnet-EVM Compatibility)
  ├→ LP-176 (Dynamic Gas Pricing)
  ├→ LP-181 (P-Chain Epoching)
  ├→ LP-204 (secp256r1 Precompile)
  └→ LP-226 (Dynamic Block Timing)

LP-600 (Snowman Consensus)
  ├→ LP-601 (Dynamic Gas with AI Pricing)
  ├→ LP-602 (Warp Cross-Chain)
  ├→ LP-603 (Verkle Trees)
  └→ LP-607 (GPU Acceleration)
```

## Implementation Paths

### Core → Post-Quantum Path

Implementation locations for post-quantum cryptography:

```
~/work/lux/node/
  └─ crypto/
      ├─ mldsa/          # LP-311: ML-DSA signatures
      ├─ slhdsa/         # LP-312: SLH-DSA signatures
      ├─ mlkem/          # LP-313: ML-KEM encapsulation
      └─ ringtail/       # LP-320: Ringtail signatures

~/work/lux/evm/
  └─ precompile/contracts/
      ├─ mldsa/          # EVM precompiles for ML-DSA
      ├─ cggmp21/        # LP-322: Threshold ECDSA
      └─ frost/          # LP-321: FROST threshold
```

### Token Standards Path

```
~/work/lux/standard/src/
  └─ tokens/
      ├─ ERC20.sol       # LP-20: LRC-20 base
      ├─ ERC721.sol      # LP-721: LRC-721 NFT
      └─ ERC1155.sol     # LP-1155: Multi-token
```

### Performance Upgrades Path

```
~/work/lux/node/vms/
  ├─ evm/lp176/          # LP-176: Dynamic gas
  ├─ evm/lp226/          # LP-226: Block timing
  └─ proposervm/acp181/  # LP-181: Epoching

~/work/lux/evm/core/vm/
  └─ contracts.go        # LP-204: secp256r1 at 0x100
```

## Summary Statistics

- **Total LPs**: 120
- **Final**: 15
- **Draft**: 96
- **Review**: 0

### By Category

- **Core Protocol**: 13 LPs
- **Bridge**: 7 LPs
- **Token Standards**: 9 LPs
- **Post-Quantum**: 16 LPs
- **Performance**: 12 LPs
- **DeFi**: 6 LPs
- **AI/ML**: 10 LPs
- **Privacy**: 4 LPs
- **Rollups**: 6 LPs
- **Research**: 10 LPs
- **Meta**: 1 LPs
- **Other**: 26 LPs

### Key Dependency Counts

- **LP-20** (LRC-20 Fungible Token Standard): Required by 14 LPs
- **LP-4** (Quantum-Resistant Cryptography Integration in Lux): Required by 10 LPs
- **LP-1** (Primary Chain, Native Tokens, and Tokenomics): Required by 9 LPs
- **LP-14** (M-Chain Threshold Signatures with CGG21 (UC Non-Interactive ECDSA)): Required by 6 LPs
- **LP-5** (Lux Quantum-Safe Wallets and Multisig Standard): Required by 5 LPs
- **LP-26** ('C-Chain EVM Equivalence and Core EIPs Adoption'): Required by 5 LPs
- **LP-500** (Layer 2 Rollup Framework): Required by 5 LPs
- **LP-6** (Network Runner & Testing Framework): Required by 4 LPs
- **LP-13** (M-Chain – Decentralised MPC Custody & Swap-Signature Layer): Required by 4 LPs
- **LP-75** (TEE Integration Standard): Required by 4 LPs

---

*This cross-reference map is automatically generated from LP frontmatter and content.*
*Last updated: 2025-11-23*