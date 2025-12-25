---
lp: 3702
title: Verkle State Transition (EIP-6800)
description: Ethereum state transition to Verkle trees enabling stateless clients
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-23
requires: 3701
tags: [core, evm, verkle, stateless]
order: 820
---

# LP-3702: Verkle State Transition

## Abstract

This LP specifies the transition from Merkle Patricia Tries (MPT) to Verkle trees for Lux C-Chain state storage, compatible with EIP-6800. Verkle trees enable constant-size (~1KB) state proofs regardless of state size, enabling truly stateless clients.

## Motivation

Stateless Ethereum/Lux requires:
- Validators don't need full state to verify blocks
- Light clients can verify state without syncing
- Cross-chain bridges can verify state cheaply
- State witnesses included in blocks

## Specification

### State Tree Structure

```go
// Verkle tree replaces MPT for account state
type VerkleStateTree struct {
    Root      *verkle.InternalNode
    Database  ethdb.KeyValueStore
}

// Account storage layout in Verkle
// Key = hash(address || storage_slot)
// Value = 32-byte state value
```go

### Witness Format

```go
type ExecutionWitness struct {
    // State reads required for block execution
    StateDiff    []StateDiffItem
    
    // Verkle proof for all accessed state
    VerkleProof  *VerkleProof
    
    // Parent state root
    ParentRoot   [32]byte
}

type StateDiffItem struct {
    Key      []byte  // Verkle key (32 bytes)
    OldValue []byte  // Pre-state value (or nil)
    NewValue []byte  // Post-state value (or nil)
}
```

### Block Format Extension

```go
type BlockBody struct {
    Transactions []*Transaction
    Uncles       []*Header
    Withdrawals  []*Withdrawal
    
    // NEW: Execution witness for stateless validation
    ExecutionWitness *ExecutionWitness
}
```solidity

### Transition Mechanism

**Phase 1: Overlay Tree**
- MPT remains canonical
- Verkle tree maintained in parallel
- Witness generation for testing

**Phase 2: Dual State**
- Both trees updated
- Witness verification enabled
- Nodes can choose either

**Phase 3: Verkle Canonical**
- Verkle tree is canonical
- MPT deprecated
- Full stateless support

### Gas Costs (EIP-4762 Compatible)

| Operation | MPT Gas | Verkle Gas |
|-----------|---------|------------|
| SLOAD (cold) | 2100 | 2100 |
| SLOAD (warm) | 100 | 100 |
| SSTORE (cold) | 22100 | 22100 |
| WITNESS_ADD | N/A | 200 |
| WITNESS_VERIFY | N/A | 3000 |

## Rationale

Verkle trees chosen over:
- Binary trees: Larger proofs (O(log n))
- STARKed MPT: Higher compute cost
- Verkle width 256: Optimal for EVM storage patterns

## Backwards Compatibility

- State root format changes (incompatible)
- Block format extended (backwards compatible with witness optional)
- All historical state accessible via archive nodes

## Security Considerations

- Commitment scheme security (IPA or KZG)
- Proof size limits to prevent DoS
- State witness verification gas costs

## References

- [EIP-6800: Ethereum State Verkle Transition](https://eips.ethereum.org/EIPS/eip-6800)
- [LP-3701: Verkle Trees for State Management](./lp-3701-verkle-trees-for-state-management.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
