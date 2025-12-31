---
lp: 2
title: Recursive Network Architecture and Cross-Chain Interoperability
tags: [network, cross-chain, scaling, core, architecture]
description: Introduces Lux's recursive network architecture, wherein the network consists of multiple parallel chains that can each host specialized applications while remaining interconnected through native cross-chain messaging.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Core
created: 2025-01-26
order: 2
tier: core
---

# LP-0002: Recursive Network Architecture and Cross-Chain Interoperability

## Abstract

Lux Network employs a recursive network architecture where multiple specialized chains operate in parallel, each optimized for specific workloads while sharing common infrastructure for security and interoperability. This document specifies how chains are created, how they coordinate, and how cross-chain messaging enables seamless asset and data transfers.

## Motivation

Single-chain architectures face fundamental scalability limits. Rather than forcing all applications to compete for the same block space, Lux enables purpose-built chains that can:

- **Optimize for workload**: Different consensus parameters, VMs, and gas policies per chain
- **Isolate state**: Application-specific chains don't bloat shared state
- **Scale horizontally**: Add chains as demand grows
- **Customize rules**: Compliance, access control, and economic models per chain

---

## Specification

### Chain Hierarchy

Lux organizes chains into a recursive structure:

```solidity
┌─────────────────────────────────────────────────────────────────────┐
│                         LUX NETWORK                                 │
├─────────────────────────────────────────────────────────────────────┤
│  PRIMARY CHAINS (Core Infrastructure)                               │
│    P-Chain: Platform - Validator coordination, staking, chain mgmt  │
│    X-Chain: Exchange - High-throughput asset transfers (DAG)        │
│    C-Chain: Contract - EVM smart contracts                          │
├─────────────────────────────────────────────────────────────────────┤
│  SPECIALIZED CHAINS (Purpose-Built)                                 │
│    A-Chain: Attestation - AI verification, proof-of-inference       │
│    B-Chain: Bridge - Cross-network asset movement                   │
│    T-Chain: Threshold - MPC/TSS key management                      │
│    Q-Chain: Quantum - Post-quantum cryptography operations          │
│    Z-Chain: Zero-Knowledge - ZKP verification and privacy           │
├─────────────────────────────────────────────────────────────────────┤
│  APPLICATION CHAINS (User-Deployed)                                 │
│    Custom chains with own validators, consensus, and VMs            │
└─────────────────────────────────────────────────────────────────────┘
```

### Chain Registration

New chains register with the P-Chain, which maintains:
- Validator sets per chain
- Chain metadata and configuration
- Cross-chain messaging registry
- Staking requirements

### Recursive Properties

The architecture is recursive because:

1. **Chains can spawn chains**: Application chains can deploy their own sub-chains
2. **Validators can validate multiple chains**: Same validator set can secure multiple chains
3. **Messaging propagates recursively**: Cross-chain messages route through the hierarchy
4. **Security inherits**: Child chains inherit security guarantees from parent validators

---

## Cross-Chain Messaging

### Warp Protocol

Lux implements native cross-chain messaging via the Warp protocol:

```markdown
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
   │                          │                          │
```

**Key Properties**:
- No external bridges or relayers required
- BLS multi-signatures for efficient verification
- Validator set from source chain is trusted authority
- Supermajority (67%+) required for message validity

### Message Format

```go
type WarpMessage struct {
    SourceChainID  ids.ID
    Payload        []byte
    SourceAddress  common.Address
    Nonce          uint64
    Signature      []byte  // Aggregated BLS
}
```

---

## Rationale

### Why Recursive Architecture?

**vs. Single Chain**: Horizontal scaling without state bloat
**vs. Sharding**: Simpler coordination, chains are independent
**vs. L2 Rollups**: Native security, no data availability concerns
**vs. External Bridges**: Trustless, protocol-native messaging

### Why BLS Signatures?

BLS allows signature aggregation: n validators produce one constant-size signature. This enables efficient cross-chain verification without transmitting n individual signatures.

---

## Backwards Compatibility

This architecture is foundational. All Lux chains follow this model.

New chains must:
1. Register with P-Chain
2. Publish validator set
3. Implement Warp message handling

---

## Security Considerations

### Chain Isolation

Chains are isolated by default. A compromised chain cannot:
- Affect other chains' state
- Forge messages from other chains
- Access other chains' assets without proper messaging

### Validator Security

Cross-chain security depends on validator honesty:
- Source chain validators must not forge messages
- 33%+ Byzantine tolerance (67% supermajority required)
- Slashing for provably malicious behavior

### Message Verification

Receiving chains MUST:
- Verify signature against known validator set
- Check nonce for replay prevention
- Validate source chain ID

---

## Implementation

### Chain Manager

**Location**: `~/work/lux/node/chains/`

**Key Files**:
- `manager.go` - Chain lifecycle management
- `registrant.go` - Chain creation hooks
- `nets.go` - Network isolation and chain namespace

### Warp Messaging

**Location**: `~/work/lux/node/vms/platformvm/warp/`

**Features**:
- BLS signature aggregation across validators
- Message validation and verification
- Chain-to-chain trusted messaging

---

## Test Cases

```bash
cd ~/work/lux/node/chains && go test -v ./...
cd ~/work/lux/node/vms/platformvm/warp && go test -v ./...
```

---

## Related LPs

- **LP-0**: Network Architecture Overview
- **LP-2**: Virtual Machine and Execution Environment
- **LP-605**: Validator Management

---

