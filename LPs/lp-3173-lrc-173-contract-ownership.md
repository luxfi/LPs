---
lp: 3173
title: LRC-173 Contract Ownership
description: LRC-173 Contract Ownership for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, evm]
order: 3173
---

## Abstract
LRC-173 (mirrors ERC-173) provides standard contract ownership interface.

## Specification
Implements `owner()`, `transferOwnership(address)`, and `OwnershipTransferred` event.


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
