---
lp: 0033
title: P-Chain State Rollup to C-Chain EVM
description: A standardized framework for rolling up P-Chain state commitments into the C-Chain for on-chain verification and cross-chain applications
author: Lux Network Team
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-07-24
requires: 26, 32
---

## Abstract

This LP specifies how to roll up validator-set and subnet-state roots from the P-Chain onto the C-Chain (EVM) via on-chain commitments and light-client-style proofs. By anchoring P-Chain state in EVM contracts, smart contracts on the C-Chain can verify proofs of P-Chain state (e.g., validator sets, staking balances, subnet activations) without running a full P-Chain node.

## Motivation

The P-Chain (Platform Chain) manages validator sets, subnets, and staking, while the C-Chain (Contract Chain) provides EVM execution. Many L2 rollups, DeFi protocols, and governance modules require trust-minimized access to P-Chain state (e.g., validator eligibility, slashing events). Embedding P-Chain state roots and proof verification on the C-Chain:

- Enables EVM contracts to enforce P-Chain-based access control and consensus logic
- Eliminates the need for centralized or off-chain oracles for validator/subnet data
- Simplifies integration of rollup sequencers that must respect P-Chain staking rules

## Specification

### 1. On-Chain Commitment Contract

Deploy a Solidity contract `PChainAnchor` on the C-Chain with functions:
```solidity
contract PChainAnchor {
    // Emitted when a new P-Chain state root is committed
    event StateRootCommitted(uint256 indexed height, bytes32 stateRoot, bytes validatorSetHash);

    // Commit a new P-Chain state root (only callable by authorized relayer)
    function commitStateRoot(uint256 height, bytes32 stateRoot, bytes calldata validatorSetHash) external;

    // Verify a Merkle proof against the committed root at 'height'
    function verifyProof(
        uint256 height,
        bytes32 leaf,
        bytes32[] calldata proof,
        bytes32[] calldata path
    ) external view returns (bool);
}
```

### 2. Off-Chain Relayer

A permissioned relayer service (e.g. sequencer or validator node) periodically:

1. Fetches the P-Chain state root and validator-set root at completed height H
2. Hashes the validator-set data into `validatorSetHash`
3. Submits a `commitStateRoot(H, stateRoot, validatorSetHash)` transaction

The relayer should only commit roots after finality (e.g., sufficiently many Lux consensus confirmations).

### 3. Proof Verification in EVM

Smart contracts import `PChainAnchor` and call `verifyProof` to:

- Check that a P-Chain staking balance or subnet activation is valid
- Ensure a validator’s signature or slashing event occurred

Proofs follow a standard Merkle Patricia inclusion proof format, using precompiled SHA3 and RLP decoding when needed.

## Rationale

Anchoring P-Chain state in EVM mirrors Ethereum’s [Beacon Chain state proofs EIP](https://eips.ethereum.org/EIPS/eip-?). By leveraging the P-Chain consensus security and the C-Chain execution environment, we avoid bridging wrapped tokens or trusting off-chain oracles, achieving full decentralization.

## Backwards Compatibility

This LP is additive; existing C-Chain and P-Chain operations remain unaffected. Contracts not using the anchor will function as before.

## Implementation

### P-Chain State Anchor Contracts

**Location**: `~/work/lux/standard/src/rollups/`
**GitHub**: [`github.com/luxfi/standard/tree/main/src/rollups`](https://github.com/luxfi/standard/tree/main/src/rollups)

**Core Contracts**:
- [`PChainAnchor.sol`](https://github.com/luxfi/standard/blob/main/src/rollups/PChainAnchor.sol) - State root commitment and proof verification
- [`PChainProofVerifier.sol`](https://github.com/luxfi/standard/blob/main/src/rollups/PChainProofVerifier.sol) - Merkle proof verification
- [`PChainRelayer.sol`](https://github.com/luxfi/standard/blob/main/src/rollups/PChainRelayer.sol) - Relayer interface

**Anchor Implementation**:
```solidity
// From PChainAnchor.sol
function commitStateRoot(
    uint256 height,
    bytes32 stateRoot,
    bytes calldata validatorSetHash
) external onlyRelayer {
    require(height > lastCommittedHeight, "Height must be increasing");

    stateRoots[height] = stateRoot;
    validatorHashes[height] = validatorSetHash;
    lastCommittedHeight = height;

    emit StateRootCommitted(height, stateRoot, validatorSetHash);
}

function verifyProof(
    uint256 height,
    bytes32 leaf,
    bytes32[] calldata proof,
    bytes32[] calldata path
) external view returns (bool) {
    bytes32 root = stateRoots[height];
    require(root != bytes32(0), "Height not committed");

    return _verifyMerkleProof(leaf, proof, path, root);
}
```

**Testing**:
```bash
cd ~/work/lux/standard
forge test --match-contract PChainAnchorTest
forge coverage --match-contract PChainAnchor
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| commitStateRoot | ~45,000 | State root storage + event |
| verifyProof | ~1,500 | Per hash in proof path |

## Test Cases

1. **Commit & Verify**: Commit a known P-Chain state root and verify true proof inclusion/exclusion.
2. **Invalid Proofs**: Ensure proofs against non-committed height or wrong leaf/path revert.
3. **Access Control**: Test that only authorized relayers can call `commitStateRoot`.
4. **Height Ordering**: Verify that heights must be monotonically increasing.

## Reference Implementation

See the `/standard/src/rollups/pchain-anchor` directory for a reference Solidity implementation and JavaScript test suite.

## Security Considerations

- **Relayer trust**: Use multisig or threshold signatures for relayer commits to avoid single-point-of-failure.
- **Proof validity**: Enforce strict gas limits to prevent DoS with excessively large proofs.
- **Fork handling**: Commit only after P-Chain fork finality to avoid reorg-induced double commits.

## Economic Impact (optional)

Relayer operators pay L1 gas to submit state anchors. At ~50 gwei and ~100 000 gas per commit, each anchor costs ~$9. Operators can recoup fees via a small on-chain fee charged to downstream users per proof verification.

## Open Questions (optional)

1. Should commits be batched over multiple heights to reduce per-anchor gas?  
2. How to integrate Z-Chain state proofs for privacy-preserving applications?  
3. What finality window on P-Chain ensures safety vs. liveness trade-offs?  

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).