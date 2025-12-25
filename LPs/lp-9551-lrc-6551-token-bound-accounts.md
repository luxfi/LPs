---
lp: 9551
title: LRC-6551 Token Bound Accounts
description: LRC-6551 Token Bound Accounts for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, nft, smart-wallet]
order: 250
---

## Abstract
LRC-6551 (mirrors ERC-6551) enables NFTs to own assets as smart contract wallets.

## Specification
Every NFT gets a deterministic smart contract account that can hold assets.

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
| [`src/tokens/ERC6551Registry.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC6551Registry.sol) | TBA registry (if exists) |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/interfaces/IERC6551Registry.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/interfaces/IERC6551Registry.sol)
- [`lib/openzeppelin-contracts/contracts/interfaces/IERC6551Account.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/interfaces/IERC6551Account.sol)

**Note**: ERC-6551 enables NFTs to own assets. Each NFT gets a deterministic smart contract account.

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
