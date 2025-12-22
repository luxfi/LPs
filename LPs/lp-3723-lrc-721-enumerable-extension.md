---
lp: 3723
title: LRC-721 Enumerable Extension
description: LRC-721 Enumerable Extension for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, nft]
order: 320
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

## Security Considerations

Implementations should follow established security best practices for the corresponding ERC.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
