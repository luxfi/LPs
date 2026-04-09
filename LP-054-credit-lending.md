---
lp: 054
title: Credit Lending
tags: [lending, credit, undercollateralized, reputation, defi]
description: Credit-based lending with reputation scoring for reduced collateral requirements
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2024-03-01
requires:
  - lps-044 (Isolated Lending Markets)
  - lps-056 (Karma Reputation)
references:
  - lp-10600 (Credit Lending Specification)
---

# LP-054: Credit Lending

## Abstract

Lux Credit Lending extends the isolated lending market framework (LP-044) with reputation-based credit scoring. Borrowers with established on-chain history (Karma score, LP-056) can access reduced collateral requirements -- down to 50% LTV compared to the standard 80-86%. Credit tiers are non-transferable and decay with inactivity. The protocol maintains a first-loss insurance tranche funded by the interest rate premium on credit loans.

## Specification

### Credit Tiers

| Tier | Min Karma | Max LTV | Rate Premium | Description |
|---|---|---|---|---|
| Standard | 0 | 86% | 0% | Same as LP-044 |
| Bronze | 100 | 80% | +50 bps | Light history |
| Silver | 500 | 65% | +100 bps | Established borrower |
| Gold | 2000 | 50% | +200 bps | Proven track record |

Higher LTV means lower collateral required (Gold tier borrowers post 50% collateral for 100% loan value).

### Karma Integration

The borrower's Karma score (LP-056) determines their tier:

```solidity
function getCreditTier(address borrower) public view returns (uint8) {
    uint256 karma = IKarma(karmaContract).scoreOf(borrower);
    if (karma >= 2000) return TIER_GOLD;
    if (karma >= 500)  return TIER_SILVER;
    if (karma >= 100)  return TIER_BRONZE;
    return TIER_STANDARD;
}
```

### First-Loss Tranche

The rate premium on credit loans funds a first-loss insurance pool:

- Premium accumulates in a per-market insurance reserve
- Bad debt from credit loans is absorbed by the insurance reserve first
- Only if the reserve is depleted does bad debt socialize to standard lenders
- Reserve target: 5% of total credit loan value

### Liquidation

Credit loans have the same liquidation mechanics as LP-044, but with tighter monitoring:

- **Warning threshold**: 5% above LLTV, borrower notified
- **Soft liquidation**: partial liquidation to bring LTV below warning threshold
- **Hard liquidation**: full liquidation when LTV exceeds LLTV

### Credit Default

If a credit loan becomes insolvent (bad debt):

1. Insurance reserve absorbs the loss (up to reserve balance)
2. Borrower's Karma score is reduced by 50%
3. Borrower is downgraded to Standard tier for 90 days
4. Default event is recorded on-chain (permanent)

### Borrower Requirements

To access credit tiers above Standard:

- On-chain identity verified via Karma (LP-056)
- No defaults in the last 365 days
- Continuous borrowing history of at least 30 days
- Karma score above tier minimum at time of each borrow

## Security Considerations

1. **Karma gaming**: artificial activity to inflate Karma is mitigated by the decay function and activity quality weighting in LP-056.
2. **Insurance underfunding**: if defaults exceed the insurance reserve, standard lenders bear the loss. The 5% target is calibrated to historical DeFi default rates.
3. **Tier manipulation**: tier is checked at borrow time. A borrower whose Karma drops cannot open new credit loans but existing loans remain at their original terms.

## Reference

| Resource | Location |
|---|---|
| Credit lending contracts | `github.com/luxfi/standard/contracts/lending/credit/` |
| Credit manager | `CreditManager.sol` |
| Karma integration | LP-056 |
| Base lending | LP-044 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
