---
lp: 3612
title: LRC-2612 Permit Extension
description: LRC-2612 Permit Extension for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, evm]
order: 3612
---

## Abstract
LRC-2612 (mirrors ERC-2612) extends LRC-20 with permit functionality, enabling gasless token approvals through signatures.

## Specification
Implements `permit(owner, spender, value, deadline, v, r, s)` allowing approvals via off-chain signatures.


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
