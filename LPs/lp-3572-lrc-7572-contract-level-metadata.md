---
lp: 3572
title: LRC-7572 Contract-level Metadata
description: Standard for contract-level metadata separate from token metadata
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Informational
category: LRC
created: 2025-01-23
tags: [lrc, infrastructure, research]
order: 370
---

# LP-3572: LRC-7572 Contract-level Metadata

## Abstract

LRC-7572 defines a standard for contract-level metadata (name, description, images) separate from individual token metadata. Useful for NFT collections, DAOs, and protocol contracts.

## Motivation

Contracts currently lack standardized metadata:
- Collection info scattered or missing
- No standard for contract branding
- Marketplaces use heuristics

LRC-7572 provides:
- Standardized contract metadata
- Consistent display across platforms
- Clear ownership/branding info

## Specification

```solidity
interface ILRC7572 {
    function contractURI() external view returns (string memory);
}
```

### Metadata Schema

```json
{
  "name": "My NFT Collection",
  "description": "A collection of unique digital art",
  "image": "ipfs://...",
  "banner_image": "ipfs://...",
  "external_link": "https://mynft.com",
  "collaborators": ["0x..."],
  "fee_recipient": "0x...",
  "seller_fee_basis_points": 250
}
```

## Research Status

This LP documents ERC-7572 for potential adoption. Implementation priority: **Medium**

Widely used by OpenSea and other marketplaces.

## References

- [ERC-7572: Contract-level Metadata](https://eips.ethereum.org/EIPS/eip-7572)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
