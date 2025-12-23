---
lp: 3612
title: LRC-2612 Permit Extension
description: LRC-2612 Permit Extension for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, evm]
order: 150
---

## Abstract
LRC-2612 (mirrors ERC-2612) extends LRC-20 with permit functionality, enabling gasless token approvals through signatures.

## Specification
Implements `permit(owner, spender, value, deadline, v, r, s)` allowing approvals via off-chain signatures.


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
| [`lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol) | OpenZeppelin Permit extension |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Permit.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Permit.sol)


### Upgradeable Variants

For proxy-based upgradeable contracts:

| Contract | Description |
|----------|-------------|
| [`ERC20PermitUpgradeable.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts-upgradeable/contracts/token/ERC20/extensions/ERC20PermitUpgradeable.sol) | Upgradeable permit |

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
