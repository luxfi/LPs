---
lp: 3338
title: Paymaster Standard
description: Paymaster Standard for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, account-abstraction, evm]
order: 510
---

## Abstract
Standard interface for paymasters that sponsor gas fees for users.

## Specification
Defines paymaster interface for ERC-4337 account abstraction infrastructure.

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
| [`lib/account-abstraction/contracts/core/BasePaymaster.sol`](https://github.com/luxfi/standard/blob/main/lib/account-abstraction/contracts/core/BasePaymaster.sol) | Base paymaster |

### Interfaces

- [`lib/account-abstraction/contracts/interfaces/IPaymaster.sol`](https://github.com/luxfi/standard/blob/main/lib/account-abstraction/contracts/interfaces/IPaymaster.sol)

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
