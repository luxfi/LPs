---
lps: 064
title: Shielded Pool with Nullifier Tracking
tags: [privacy, pool, shielded, nullifier, deposit, withdrawal, compliance]
description: Shielded deposit/withdrawal pool with nullifier-based double-spend prevention
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2024-06-01
references:
  - lps-063 (Z-Chain UTXO Privacy)
  - lps-069 (Poseidon2 Hash Precompile)
---

# LPS-064: Shielded Pool with Nullifier Tracking

## Abstract

Defines a shielded pool contract for EVM chains that enables private deposits and withdrawals. Users deposit LUX or ERC-20 tokens into the pool, receiving a commitment note. Withdrawal requires a zero-knowledge proof that the user knows the note preimage and a valid nullifier. The pool maintains a Poseidon2 Merkle tree of commitments and a nullifier set for double-spend prevention.

## Specification

### Deposit

```solidity
function deposit(bytes32 commitment) external payable;
```

The user computes `commitment = Poseidon2(value || nullifier_secret || blinding)` off-chain and submits it. The contract inserts the commitment into the Merkle tree and accepts the deposit.

### Withdrawal

```solidity
function withdraw(
    bytes calldata proof,
    bytes32 root,
    bytes32 nullifierHash,
    address recipient,
    uint256 amount,
    bytes32 relayerFee
) external;
```

The proof demonstrates: (1) the user knows a commitment in the tree at `root`, (2) the nullifier hash matches, (3) the amount matches the committed value. The contract verifies the proof, checks the nullifier has not been used, marks it as spent, and transfers funds.

### Fixed Denominations

The pool operates with fixed denomination sets to prevent amount-based correlation:

| Pool | Denomination |
|------|-------------|
| Pool A | 1 LUX |
| Pool B | 10 LUX |
| Pool C | 100 LUX |
| Pool D | 1,000 LUX |

### Compliance Association Sets

Unlike fully anonymous systems, the pool supports optional compliance association sets. A depositor may include a compliance proof binding their deposit to a DID (LPS-060) without revealing which specific deposit is theirs to external observers.

## Security Considerations

1. Nullifier hash is derived from a secret known only to the depositor. Brute-forcing is infeasible.
2. Fixed denominations prevent amount-based deanonymization.
3. The Merkle root must be a recent valid root (checked against stored history of 100 roots).
4. Relayer fees are deducted from the withdrawal amount to enable gas-less private withdrawals.

## Reference

| Resource | Location |
|----------|----------|
| Pool contract | `github.com/luxfi/standard/contracts/privacy/ShieldedPool.sol` |
| Proof verifier | `github.com/luxfi/standard/contracts/privacy/Verifier.sol` |
| CLI deposit tool | `github.com/luxfi/cli/cmd/privacy/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
