---
lp: 049
title: Prediction Markets
tags: [prediction, oracle, markets, binary, resolution, defi]
description: Optimistic oracle prediction markets for binary and scalar outcomes
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2025-12-01
requires:
  - lps-038 (Oracle VM)
references:
  - lp-10100 (Prediction Markets Specification)
---

# LP-049: Prediction Markets

## Abstract

Lux Prediction Markets enable trading on the outcome of real-world events. Markets are binary (yes/no) or scalar (numeric range). Market creation is permissionless. Resolution uses an optimistic oracle: a proposer asserts the outcome, and it is accepted after a challenge period unless disputed. Disputed outcomes are resolved by K-chain oracle data (LP-038) or governance vote.

## Specification

### Market Types

**Binary market**: trades outcome tokens YES and NO, each redeemable for 1 USDC if the outcome matches.

**Scalar market**: trades LONG and SHORT tokens over a numeric range `[low, high]`. Payout is linear interpolation based on the resolved value.

### Market Creation

```solidity
struct MarketParams {
    string  question;        // human-readable question
    uint256 resolutionTime;  // Unix timestamp when market resolves
    address collateral;      // settlement token (USDC)
    uint8   marketType;      // 0=binary, 1=scalar
    uint256 scalarLow;       // scalar lower bound (0 for binary)
    uint256 scalarHigh;      // scalar upper bound (0 for binary)
    bytes32 oracleFeed;      // K-chain feed for auto-resolution (optional)
}
```

Creator deposits 100 USDC as a market creation bond (returned after resolution).

### Trading

Outcome tokens are minted/burned via a CPMM (constant product):

- Mint: deposit 1 USDC, receive 1 YES + 1 NO
- Burn: return 1 YES + 1 NO, receive 1 USDC
- Trade: swap YES for NO (or vice versa) on the AMM, price reflects probability

### Resolution

**Auto-resolution**: if `oracleFeed` is set, the market auto-resolves using K-chain price at `resolutionTime`.

**Optimistic resolution**:

1. After `resolutionTime`, anyone can propose an outcome with a 500 USDC bond
2. 48-hour challenge period
3. If unchallenged, outcome is finalized; proposer bond returned
4. If challenged, dispute goes to governance vote (LP-058)

### Redemption

After resolution:

- **Binary**: winning token redeems 1:1 for USDC; losing token is worthless
- **Scalar**: LONG redeems `(resolvedValue - low) / (high - low)` USDC per token; SHORT redeems the remainder

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Trading fee | 0.20% of trade value | LPs |
| Creation bond | 100 USDC (refundable) | Creator |
| Resolution bond | 500 USDC (refundable) | Proposer |

## Security Considerations

1. **Oracle manipulation**: auto-resolution uses K-chain TWAP over 1 hour before `resolutionTime` to resist manipulation.
2. **Ambiguous questions**: poorly worded questions can lead to disputes. Market creators are incentivized to write clear questions to recover their bond.
3. **Low-liquidity manipulation**: thin AMMs can be manipulated to show misleading probabilities. UI should display liquidity depth alongside prices.

## Reference

| Resource | Location |
|---|---|
| Prediction contracts | `github.com/luxfi/standard/contracts/prediction/` |
| Market factory | `PredictionFactory.sol` |
| Optimistic oracle | `OptimisticOracle.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
