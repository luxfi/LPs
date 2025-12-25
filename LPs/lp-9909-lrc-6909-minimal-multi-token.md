---
lp: 9909
title: LRC-6909 Minimal Multi-Token
description: LRC-6909 Minimal Multi-Token for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard]
order: 330
---

## Abstract
LRC-6909 (mirrors ERC-6909) provides a gas-efficient minimal multi-token interface.

## Specification
Simplified multi-token standard with reduced gas costs compared to LRC-1155.

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
| [`lib/solmate/src/tokens/ERC6909.sol`](https://github.com/luxfi/standard/blob/main/lib/solmate/src/tokens/ERC6909.sol) | Solmate minimal multi-token (if available) |

**Note**: ERC-6909 is a gas-optimized alternative to ERC-1155.

### Build and Test

```bash
cd /Users/z/work/lux/standard/

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
