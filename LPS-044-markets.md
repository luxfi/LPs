---
lps: 044
title: Isolated Lending Markets
tags: [lending, morpho, isolated, markets, collateral, liquidation]
description: Morpho-style isolated lending markets with per-pair risk isolation
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2024-03-01
requires:
  - lps-038 (Oracle VM)
references:
  - lp-9600 (Lending Markets Specification)
---

# LPS-044: Isolated Lending Markets

## Abstract

Lux Lending Markets implements isolated lending pairs where each market is an independent `(collateral, loan, oracle, LLTV, IRM)` tuple. Unlike pooled lending (Aave/Compound), risk is isolated per market -- a bad collateral asset in one market cannot cascade to others. Each market has its own Loan-to-Value ratio, interest rate model, and liquidation parameters.

## Specification

### Market Creation

Anyone can create a market by specifying:

```solidity
struct MarketParams {
    address loanToken;       // token being borrowed
    address collateralToken; // token used as collateral
    address oracle;          // price oracle (LPS-038)
    uint256 lltv;            // liquidation loan-to-value (e.g., 86% = 8600 bps)
    address irm;             // interest rate model contract
}
```

Markets are permissionless. The factory deploys a minimal proxy per market.

### Supply and Borrow

- **Supply**: lenders deposit `loanToken` and receive shares representing their claim
- **Borrow**: borrowers deposit `collateralToken` and borrow `loanToken` up to `lltv`
- **Interest**: accrues per second, computed by the IRM based on utilization

```
utilization = totalBorrowed / totalSupplied
borrowRate = IRM.rate(utilization)
supplyRate = borrowRate * utilization * (1 - reserveFactor)
```

### Interest Rate Model

The default IRM uses a kinked curve:

| Utilization | Rate |
|---|---|
| 0% - 80% (optimal) | Linear from 1% to 4% APR |
| 80% - 100% | Steep from 4% to 100% APR |

The kink at 80% incentivizes utilization to stay below optimal, ensuring withdrawal liquidity.

### Liquidation

When a borrower's LTV exceeds `lltv`:

1. Liquidator repays part or all of the loan
2. Liquidator receives collateral at a discount (liquidation incentive = 5%)
3. Bad debt (if collateral < loan) is socialized across lenders in that market only

```
maxLiquidatable = borrowedAmount * (currentLTV - lltv) / (1 - lltv * (1 + incentive))
```

### Risk Isolation

Each market is an independent contract with its own:

- Reserve of loan tokens
- Collateral custody
- Interest accrual state
- Bad debt accounting

A market with a worthless collateral token only affects lenders in that specific market.

### Reserve Factor

A percentage of interest (default 10%) accrues to the protocol reserve within each market. This reserve absorbs initial bad debt before socializing to lenders.

## Security Considerations

1. **Oracle dependency**: incorrect oracle prices lead to incorrect liquidation thresholds. Each market must use a reliable oracle feed.
2. **LLTV governance**: excessively high LLTV increases insolvency risk. Market creators set LLTV at creation; it cannot be changed after.
3. **Dust positions**: minimum borrow amounts prevent dust positions that are uneconomical to liquidate.

## Reference

| Resource | Location |
|---|---|
| Lending contracts | `github.com/luxfi/standard/contracts/lending/` |
| Market factory | `MarketFactory.sol` |
| IRM | `KinkedIRM.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
