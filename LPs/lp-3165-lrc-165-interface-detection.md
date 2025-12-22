---
lp: 3165
title: LRC-165 Interface Detection
description: LRC-165 Interface Detection for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, evm]
order: 600
---

## Abstract
LRC-165 (mirrors ERC-165) provides standard interface detection for smart contracts.

## Specification
Implements `supportsInterface(bytes4 interfaceId)` returning true for supported interfaces.


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
