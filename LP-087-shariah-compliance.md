---
lp: 087
title: Islamic Finance Compliance Framework
tags: [shariah, islamic-finance, compliance, halal, murabaha, sukuk]
description: Shariah-compliant financial product framework for Lux Network
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2022-06-01
references:
  - lps-001 (Digital Securities)
  - lps-088 (Securities Compliance)
  - AAOIFI Shariah Standards
---

# LP-087: Islamic Finance Compliance Framework

## Abstract

Defines the Shariah-compliant financial product framework for Lux Network. All DeFi protocols on Lux offer Shariah-compliant modes that avoid riba (interest), gharar (excessive uncertainty), and maysir (gambling). The framework implements four core Islamic finance structures: Murabaha (cost-plus financing), Musharakah (partnership), Sukuk (asset-backed certificates), and Takaful (cooperative insurance).

## Specification

### Compliance Engine

The `ShariahRegistry` contract maintains a classification of on-chain assets and protocols:

| Classification | Meaning |
|---------------|---------|
| Halal | Fully Shariah-compliant |
| Doubtful | Requires individual scholar review |
| Haram | Non-compliant (interest-bearing, speculative) |

### Murabaha (Cost-Plus Financing)

```solidity
contract Murabaha {
    function createSale(address asset, uint256 costPrice, uint256 markup, uint256 installments) external;
    function payInstallment(uint256 saleId) external payable;
}
```

The seller discloses the cost price and markup. The buyer pays in installments. No interest -- the profit is a fixed markup agreed at contract creation.

### Musharakah (Partnership)

Partners contribute capital to a venture. Profits are shared by pre-agreed ratios; losses are shared proportionally to capital contribution. Implemented as an ERC-4626 vault with custom profit/loss distribution.

### Sukuk (Islamic Bonds)

Asset-backed certificates representing ownership in a tangible asset or project. Unlike conventional bonds, sukuk holders share in the asset's returns, not a fixed interest rate. Implemented as ERC-1155 tokens with an underlying asset reference.

### Takaful (Cooperative Insurance)

A cooperative pool where members contribute to a fund. Claims are paid from the pool. Surplus is distributed back to members. No underwriter profit -- the operator charges a management fee (Wakalah model).

### Shariah Board

An on-chain `ShariahBoard` multisig (3-of-5 scholars) must approve:
- New asset classifications in the ShariahRegistry.
- New financial product templates.
- Dispute resolutions on compliance status.

## Security Considerations

1. Shariah compliance is advisory, not enforced at the EVM level. Users can bypass by interacting directly with contracts.
2. The ShariahBoard multisig keys are held by independent Islamic finance scholars. No Lux team member is a signer.
3. Asset classifications can change (e.g., a company's business mix changes). The registry supports reclassification with an event trail.
4. The framework does not replace a formal Shariah audit. It provides the on-chain infrastructure for compliant products.

## Reference

| Resource | Location |
|----------|----------|
| ShariahRegistry | `github.com/luxfi/standard/contracts/compliance/ShariahRegistry.sol` |
| Murabaha contract | `github.com/luxfi/standard/contracts/islamic/Murabaha.sol` |
| AAOIFI Standards | https://aaoifi.com |

## Copyright

Copyright (C) 2022-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
