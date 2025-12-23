---
lp: 3173
title: LRC-173 Contract Ownership
description: LRC-173 Contract Ownership for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, evm]
order: 610
---

## Abstract
LRC-173 (mirrors ERC-173) provides standard contract ownership interface.

## Specification
Implements `owner()`, `transferOwnership(address)`, and `OwnershipTransferred` event.


## Motivation

This standard ensures compatibility with the broader EVM ecosystem while enabling Lux-specific optimizations.

## Rationale

Mirrors the corresponding Ethereum standard for maximum compatibility.

## Backwards Compatibility

Fully compatible with existing ERC implementations.


## Reference Implementation

**Repository**: [https://github.com/luxfi/standard](https://github.com/luxfi/standard)
**Local Path**: `/Users/z/work/lux/standard/`

### Contracts

| Contract | Description |
|----------|-------------|
| [`lib/openzeppelin-contracts/contracts/access/Ownable.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/access/Ownable.sol) | OpenZeppelin Ownable |
| [`lib/openzeppelin-contracts/contracts/access/Ownable2Step.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/access/Ownable2Step.sol) | Two-step ownership transfer |


### Upgradeable Variants

For proxy-based upgradeable contracts:

| Contract | Description |
|----------|-------------|
| [`OwnableUpgradeable.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol) | Upgradeable ownable |
| [`Ownable2StepUpgradeable.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts-upgradeable/contracts/access/Ownable2StepUpgradeable.sol) | Upgradeable 2-step |

**Usage**: Initialize in `initialize()` instead of constructor. See [OpenZeppelin Upgrades](https://docs.openzeppelin.com/upgrades).

### Build and Test

```bash
cd /Users/z/work/lux/standard

# Build all contracts
forge build

# Run tests
forge test -vvv

# Gas report
forge test --gas-report
```

## Security Considerations

Implementations should follow established security best practices for the corresponding ERC.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
