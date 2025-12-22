---
lp: 3271
title: LRC-1271 Signature Validation
description: LRC-1271 Signature Validation for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, smart-wallet]
order: 3271
---

## Abstract
LRC-1271 (mirrors ERC-1271) standardizes signature validation for smart contracts.

## Specification
Implements `isValidSignature(hash, signature)` for contract-based accounts.


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
