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

## Security Considerations

Implementations should follow established security best practices for the corresponding ERC.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
