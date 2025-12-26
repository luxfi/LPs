---
lp: 3165
title: LRC-165 Interface Detection
description: LRC-165 Interface Detection for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, evm]
order: 600
---

## Abstract
LRC-165 (mirrors ERC-165) provides standard interface detection for smart contracts.

## Specification
Implements `supportsInterface(bytes4 interfaceId)` returning true for supported interfaces.

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
| [`lib/openzeppelin-contracts/contracts/utils/introspection/ERC165.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/utils/introspection/ERC165.sol) | OpenZeppelin ERC-165 |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/utils/introspection/IERC165.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/utils/introspection/IERC165.sol)

### Upgradeable Variants

For proxy-based upgradeable contracts:

| Contract | Description |
|----------|-------------|
| [`ERC165Upgradeable.sol`](~/work/lux/standard/lib/openzeppelin-contracts-upgradeable/contracts/utils/introspection/ERC165Upgradeable.sol) | Upgradeable ERC-165 |

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
```solidity

## Security Considerations

Implementations should follow established security best practices for the corresponding ERC.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
