---
lp: 3981
title: LRC-2981 NFT Royalties
description: LRC-2981 NFT Royalties for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, nft]
order: 230
---

## Abstract
LRC-2981 (mirrors ERC-2981) standardizes NFT royalty information.

## Specification
Implements `royaltyInfo(tokenId, salePrice)` returning receiver and royalty amount.


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
| [`lib/openzeppelin-contracts/contracts/token/common/ERC2981.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/token/common/ERC2981.sol) | NFT royalty standard |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/interfaces/IERC2981.sol`](https://github.com/luxfi/standard/blob/main/lib/openzeppelin-contracts/contracts/interfaces/IERC2981.sol)

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

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
