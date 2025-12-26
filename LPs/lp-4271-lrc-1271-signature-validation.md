---
lp: 4271
title: LRC-1271 Signature Validation
description: LRC-1271 Signature Validation for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, smart-wallet]
order: 620
---

## Abstract
LRC-1271 (mirrors ERC-1271) standardizes signature validation for smart contracts.

## Specification
Implements `isValidSignature(hash, signature)` for contract-based accounts.

## Motivation

This standard ensures compatibility with the broader EVM ecosystem while enabling Lux-specific optimizations.

## Rationale

Mirrors the corresponding Ethereum standard for maximum compatibility.

## Backwards Compatibility

Fully compatible with existing ERC implementations.

## Reference Implementation

**Repository**: [https://github.com/luxfi/standard](https://github.com/luxfi/standard)
**Local Path**: `/Users/z/work/lux/standard/`

### Interfaces

- [`lib/openzeppelin-contracts/contracts/interfaces/IERC1271.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/interfaces/IERC1271.sol)

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
