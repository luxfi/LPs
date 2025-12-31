---
lp: 4192
title: LRC-5192 Soulbound Tokens
description: LRC-5192 Soulbound Tokens for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, nft, soulbound]
order: 240
---

## Abstract
LRC-5192 (mirrors ERC-5192) defines minimal soulbound (non-transferable) NFTs.

## Specification
Adds `locked(uint256 tokenId)` to indicate non-transferability.

## Motivation

This standard ensures compatibility with the broader EVM ecosystem while enabling Lux-specific optimizations.

## Rationale

Mirrors the corresponding Ethereum standard for maximum compatibility.

## Backwards Compatibility

Fully compatible with existing ERC implementations.

## Security Considerations

Implementations should follow established security best practices for the corresponding ERC.

