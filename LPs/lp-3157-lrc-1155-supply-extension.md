---
lp: 3157
title: LRC-1155 Supply Extension
description: LRC-1155 Supply Extension for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, nft]
order: 310
---

## Abstract
Extension tracking total supply for each token ID in LRC-1155 contracts.

## Specification
Implements `totalSupply(uint256 id)` and `exists(uint256 id)` functions.


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
| [`lib/openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155Supply.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155Supply.sol) | ERC1155 with totalSupply tracking |


### Upgradeable Variants

For proxy-based upgradeable contracts:

| Contract | Description |
|----------|-------------|
| [`ERC1155SupplyUpgradeable.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts-upgradeable/contracts/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol) | Upgradeable supply tracking |

**Usage**: Initialize in `initialize()` instead of constructor. See [OpenZeppelin Upgrades](https://docs.openzeppelin.com/upgrades).

### Build and Test

```bash
cd /Users/z/work/lux/standard/

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
