---
lps: 041
title: AMM V3
tags: [amm, concentrated-liquidity, uniswap-v3, tick, dex]
description: Concentrated liquidity AMM with capital-efficient position ranges
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2021-05-01
requires:
  - lps-040 (AMM V2)
references:
  - lp-9300 (AMM V3 Specification)
---

# LPS-041: AMM V3

## Abstract

AMM V3 introduces concentrated liquidity, allowing LPs to allocate capital to specific price ranges rather than the full (0, infinity) range. A position providing liquidity between prices $p_a$ and $p_b$ achieves up to 4000x capital efficiency compared to V2 for the same depth at the current price. The pool uses a tick-based price discretization where each tick represents a 0.01% price increment.

## Specification

### Tick System

Prices are discretized into ticks. Each tick `i` maps to price `p(i) = 1.0001^i`:

- **Tick spacing**: configurable per pool (1, 10, 60, or 200 ticks)
- **Tick range**: -887272 to +887272 (covers prices from ~1e-38 to ~1e38)
- **Current tick**: the tick corresponding to the current pool price

### Positions

An LP position specifies a range `[tickLower, tickUpper]`:

```solidity
struct Position {
    uint128 liquidity;     // concentrated liquidity units
    int24   tickLower;     // lower bound tick
    int24   tickUpper;     // upper bound tick
    uint256 feeGrowthInside0; // accumulated fees, token0
    uint256 feeGrowthInside1; // accumulated fees, token1
}
```

Liquidity is only active when the current tick is within the position's range.

### Swap Mechanics

A swap moves the price across ticks:

1. Compute how much of the input can be consumed at the current tick's liquidity
2. If the input is exhausted, return the output
3. If not, cross to the next initialized tick, update active liquidity, repeat

Each tick crossing adds/removes liquidity from positions whose boundaries align with that tick.

### Fee Tiers

| Tier | Fee | Tick Spacing | Use Case |
|---|---|---|---|
| Stable | 0.01% | 1 | Stablecoin pairs |
| Low | 0.05% | 10 | Correlated pairs |
| Medium | 0.30% | 60 | Standard pairs |
| High | 1.00% | 200 | Exotic/volatile pairs |

Fees accrue per-tick and are claimable by position owners proportional to their liquidity share within the tick range.

### Oracle

V3 pools store an array of `(blockTimestamp, tickCumulative, liquidityCumulative)` observations. Up to 65535 observations are stored, enabling TWAP queries over extended periods without external infrastructure.

### Non-Fungible Positions

Unlike V2 LP tokens (fungible ERC-20), V3 positions are non-fungible (ERC-721) because each position has unique tick bounds. The NonfungiblePositionManager wraps positions as NFTs.

## Security Considerations

1. **Just-in-time liquidity**: LPs can add liquidity for a single block to capture fees and withdraw. This is a feature, not a bug -- it increases competition among LPs.
2. **Tick crossing gas**: swaps crossing many ticks consume proportionally more gas. Pools with sparse liquidity may have expensive swaps.
3. **Oracle manipulation**: TWAP with sufficient observation window (30 minutes+) is resistant to single-block manipulation.

## Reference

| Resource | Location |
|---|---|
| AMM V3 contracts | `github.com/luxfi/standard/contracts/amm/v3/` |
| Pool | `LuxPool.sol` |
| Position manager | `NonfungiblePositionManager.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
