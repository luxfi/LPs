---
lp: 3101
title: LRC-1155 Supply Extension
description: LRC-1155 Supply Extension for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, nft]
order: 3101
---

## Abstract
Extension tracking total supply for each token ID in LRC-1155 contracts.

## Specification
Implements `totalSupply(uint256 id)` and `exists(uint256 id)` functions.


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
