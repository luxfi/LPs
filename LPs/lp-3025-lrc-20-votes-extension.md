---
lp: 3025
title: LRC-20 Votes Extension
description: LRC-20 Votes Extension for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, governance]
order: 140
---

## Abstract
LRC-20 Votes extension for governance tokens with delegation and vote checkpointing.

## Specification
Implements delegation, vote checkpointing, and EIP-712 signatures for governance participation.

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
| [`lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol) | ERC20 with voting/delegation |
| [`lib/openzeppelin-contracts/contracts/governance/utils/IVotes.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/governance/utils/IVotes.sol) | Votes interface |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/governance/utils/IVotes.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/governance/utils/IVotes.sol)

### Upgradeable Variants

For proxy-based upgradeable contracts:

| Contract | Description |
|----------|-------------|
| [`ERC20VotesUpgradeable.sol`](~/work/lux/standard/lib/openzeppelin-contracts-upgradeable/contracts/token/ERC20/extensions/ERC20VotesUpgradeable.sol) | Upgradeable votes |

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

```
