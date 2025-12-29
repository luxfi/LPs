---
lp: 042
title: StableSwap
tags: [stableswap, curve, amm, stablecoin, low-slippage]
description: Curve-style StableSwap AMM optimized for pegged asset pairs
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2025-12-01
requires:
  - lps-040 (AMM V2)
references:
  - lp-9400 (StableSwap Specification)
---

# LP-042: StableSwap

## Abstract

StableSwap implements the Curve invariant for trading between assets that should maintain a 1:1 peg (stablecoins, wrapped assets, liquid staking derivatives). The invariant interpolates between constant-sum (`x + y = k`, zero slippage) and constant-product (`x * y = k`, full slippage) based on an amplification parameter `A`. At typical operating ranges, StableSwap achieves 100-1000x lower slippage than constant-product AMMs for pegged pairs.

## Specification

### Invariant

The StableSwap invariant for `n` tokens:

```
A * n^n * sum(x_i) + D = A * D * n^n + D^(n+1) / (n^n * prod(x_i))
```

Where:
- `A`: amplification coefficient (higher = closer to constant-sum)
- `D`: total deposit value at equilibrium
- `x_i`: reserve of token i
- `n`: number of tokens in the pool

### Pool Types

| Type | Tokens | Typical A | Use Case |
|---|---|---|---|
| 2-pool | USDC/USDT | 200 | USD stablecoins |
| 3-pool | USDC/USDT/DAI | 100 | Multi-stablecoin |
| Meta-pool | newStable/3pool-LP | 50 | New stablecoin bootstrapping |
| LST-pool | LUX/sLUX | 30 | Liquid staking derivatives |

### Amplification Ramping

The amplification parameter `A` can be adjusted by governance over a ramping period:

- **Ramp duration**: minimum 1 day
- **Max change**: 10x per ramp
- **Direction**: increase (tighter peg) or decrease (more like constant-product)

Ramping prevents sudden invariant changes that could be exploited.

### Fee Structure

- **Swap fee**: 0.04% (4 bps) -- lower than V2/V3 because stable pairs have lower IL risk
- **Admin fee**: 50% of swap fee goes to protocol treasury
- **LP fee**: 50% of swap fee accrues to LP tokens

### LP Tokens

StableSwap LP tokens are fungible ERC-20. Deposits and withdrawals can be single-sided (any one token) or balanced (all tokens proportionally). Single-sided operations incur a small fee to compensate for the imbalance.

### Virtual Price

The LP token's virtual price is `D / totalSupply`. It monotonically increases as fees accrue. This makes LP tokens suitable as collateral in lending protocols (LP-044).

## Security Considerations

1. **De-peg risk**: if an asset in the pool loses its peg, the pool concentrates into the depegged asset. The amplification parameter `A` determines how quickly this happens.
2. **Amplification attacks**: malicious governance could ramp `A` to extreme values. The ramp rate limit and timelock mitigate this.
3. **Read-only reentrancy**: the `get_virtual_price()` function must be called with a reentrancy guard when used as an oracle by external protocols.

## Reference

| Resource | Location |
|---|---|
| StableSwap contracts | `github.com/luxfi/standard/contracts/amm/stable/` |
| Pool factory | `StableSwapFactory.sol` |
| Math library | `StableSwapMath.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
