---
lp: 7626
title: LRC-4626 Tokenized Vault
description: LRC-4626 Tokenized Vault for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, defi, vault]
order: 400
---

## Abstract
LRC-4626 (mirrors ERC-4626) standardizes tokenized yield-bearing vaults.

## Specification
Defines deposit/withdraw/mint/redeem interface with share accounting for DeFi vaults.

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
| [`lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol) | OpenZeppelin ERC-4626 |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol)

### Upgradeable Variants

For proxy-based upgradeable contracts:

| Contract | Description |
|----------|-------------|
| [`ERC4626Upgradeable.sol`](~/work/lux/standard/lib/openzeppelin-contracts-upgradeable/contracts/token/ERC20/extensions/ERC4626Upgradeable.sol) | Upgradeable vault |

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
```
