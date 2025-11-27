---
lp: 0024
title: 'Parallel Validation and Shared Mempool'
description: An enhancement to the Lux node software to allow a single validator to concurrently validate multiple Lux-family chains and participate in a shared mempool.
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-07-22
requires: 22
---

## Abstract

This LP proposes an upgrade to the Lux node software to enable a single validator to validate multiple networks in parallel (e.g., the Lux Primary Network and one or more L2s or sovereign L1s). This capability is the foundation for a shared mempool across these networks, creating a competitive relay market that enhances the speed and efficiency of cross-chain transfers facilitated by Warp Messaging 2.0 (LP-22).

## Motivation

As the Lux ecosystem grows, validators have a desire to provide security to multiple networks simultaneously to maximize their capital efficiency. Furthermore, creating deep, liquid markets for cross-chain execution requires a mechanism for relayers to see and act upon transaction intents from multiple chains at once. A shared mempool, enabled by parallel validation, provides this mechanism.

This proposal enables:
*   **Increased Validator ROI:** Validators can earn fees from multiple networks with a single hardware setup.
*   **Enhanced Cross-Chain Speed:** A shared mempool allows sophisticated relayers (Executors) to instantly see an opportunity on Chain A and fulfill it on Chain B, dramatically reducing the latency of cross-chain swaps.
*   **Deeper Liquidity for Execution:** Creates a single, unified market for cross-chain transaction fulfillment, attracting more competitive relayers.

## Specification

**1. Parallel Validation Module:**

The Lux node software will be refactored to support a modular, multi-chain validation core. Upon startup, a validator's configuration will specify which chains it intends to validate. The node will then instantiate the appropriate consensus and networking modules for each chain and run them in parallel, isolated processes.

**2. Shared Mempool Protocol:**

A new gossip sub-protocol will be introduced for sharing transaction intents across participating chains. When a user initiates a cross-chain transaction via Warp 2.0, the signed "Intent Message" is broadcast to this shared mempool. Validators running in parallel mode will have access to this mempool.

**3. Executor/Relayer Market:**

Specialized actors, called Executors, can monitor this shared mempool. An Executor can be a validator or a separate entity. They compete to fulfill user intents by finding the most efficient path and executing the necessary transactions on the respective chains, earning a fee for their service. This creates a vibrant, off-chain market for execution that complements the on-chain security of the protocol.

## Rationale

This design separates the roles of validation and execution. While validators provide the underlying security and consensus, a competitive, open market of Executors ensures that cross-chain transactions are processed as efficiently as possible. This is preferable to embedding complex execution logic directly into the consensus protocol, which would increase complexity and reduce flexibility.

## Security Considerations

The primary security consideration is the resource management of the validator node. Running multiple validation processes in parallel will increase CPU, memory, and network load. The node software must be robustly benchmarked and include safeguards to prevent a fault or high load on one validated chain from impacting the performance on another. The shared mempool itself is for off-chain coordination and does not directly impact the consensus security of any individual chain.
## Implementation

### Node Architecture
**Repository**: `/Users/z/work/lux/node/`

### Parallel Validation Module
- **Location**: `/Users/z/work/lux/node/app/`
  - Multi-chain initialization logic
  - Consensus engine per-chain isolation
  - Network module per-chain instantiation

- **Configuration**:
  - Node config file specifies chains to validate
  - Independent data directories per chain
  - Isolated networking ports

### Shared Mempool Protocol
- **Implementation**: P2P gossip sub-protocol
  - Cross-chain transaction intent broadcasting
  - Located in `/Users/z/work/lux/node/network/`
  - Intent message serialization and validation

- **Message Format**:
  - Source chain, destination chain, intent hash
  - User signature and optional relayer requirements
  - Fee parameters and deadline

### Executor/Relayer Market
- **Off-chain Coordination**:
  - Validators and third-party executors monitor shared mempool
  - Competitive fulfillment auction
  - Fee-based execution marketplace

- **Smart Contracts**: Available in `/Users/z/work/lux/standard/src/`
  - Intent settlement contracts
  - Refund/failure handling
  - Multi-chain atomic execution

### Testing and Performance
```bash
cd /Users/z/work/lux/node
# Test parallel validation
make test

# Benchmark multi-chain performance
./build/node --validate-chains=X,C,Q
```

### Resource Management
- **CPU Isolation**: Per-chain consensus threads
- **Memory Management**: Separate mempool pools per chain
- **Network Bandwidth**: Per-chain gossip throttling
- **Monitoring**: Metrics for each chain's resources

### GitHub References
- **Node Implementation**: https://github.com/luxfi/node/tree/main/app
- **Network Layer**: https://github.com/luxfi/node/tree/main/network
- **Test Harness**: https://github.com/luxfi/netrunner

## Backwards Compatibility

Additive: existing chains and clients continue to operate. Adoption can occur incrementally with no breaking changes.
