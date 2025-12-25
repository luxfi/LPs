---
lp: 6156
title: LRC-3156 Flash Loans
description: LRC-3156 Flash Loans for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, defi]
order: 420
---

## Abstract
LRC-3156 (mirrors ERC-3156) standardizes flash loan interfaces.

## Specification
Defines `flashLoan()` and `FlashBorrower` interface for atomic borrowing.


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
| [`lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20FlashMint.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20FlashMint.sol) | Flash mint extension |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/interfaces/IERC3156FlashLender.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/interfaces/IERC3156FlashLender.sol)
- [`lib/openzeppelin-contracts/contracts/interfaces/IERC3156FlashBorrower.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/interfaces/IERC3156FlashBorrower.sol)

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
