---
lp: 3723
title: LRC-721 Enumerable Extension
description: LRC-721 Enumerable Extension for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, nft]
order: 220
---

## Abstract
LRC-721 Enumerable extension for iterating over all tokens and owner tokens.

## Specification
Implements `totalSupply()`, `tokenByIndex()`, and `tokenOfOwnerByIndex()`.


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
| [`lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol) | OpenZeppelin Enumerable |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/token/ERC721/extensions/IERC721Enumerable.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/token/ERC721/extensions/IERC721Enumerable.sol)

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
