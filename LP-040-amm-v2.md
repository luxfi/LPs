---
lp: 040
title: AMM V2
tags: [amm, uniswap-v2, constant-product, dex, liquidity]
description: Uniswap V2 style constant-product automated market maker
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2020-11-01
references:
  - lp-9200 (AMM V2 Specification)
---

# LP-040: AMM V2

## Abstract

AMM V2 implements a constant-product market maker (x * y = k) for permissionless token swaps on Lux. Any ERC-20 pair can be traded by depositing liquidity into a pool. Liquidity providers receive LP tokens representing their share of the pool. The protocol charges a 0.30% swap fee, distributed entirely to LPs. AMM V2 is the base-layer DEX primitive deployed on all Lux EVM chains.

## Specification

### Pool Creation

Anyone can create a pool by calling the factory:

```solidity
function createPair(address tokenA, address tokenB) external returns (address pair);
```

Each pair is a minimal proxy contract storing reserves and minting LP tokens. One pool per unique `(tokenA, tokenB)` pair (order-independent).

### Constant Product Invariant

```
reserveA * reserveB = k
```

A swap of `dx` of token A yields `dy` of token B:

```
dy = (reserveB * dx * 997) / (reserveA * 1000 + dx * 997)
```

The 0.3% fee is taken from the input amount before computing the output.

### Liquidity Provision

LPs deposit both tokens proportional to current reserves:

```
liquidityMinted = min(amountA * totalSupply / reserveA, amountB * totalSupply / reserveB)
```

LP tokens are burned on withdrawal, returning proportional reserves.

### Flash Swaps

Pools support flash swaps: borrow any amount of either token, execute arbitrary logic, and repay within the same transaction. The repayment must satisfy the invariant including the 0.30% fee.

### Oracle

Each pool accumulates `price0CumulativeLast` and `price1CumulativeLast` every block. External contracts compute TWAP (Time-Weighted Average Price) over any window by reading cumulative values at two timestamps.

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Swap fee | 0.30% | 100% to LP token holders |
| Protocol fee | 0.00% (governance-activatable up to 0.05%) | Treasury |

### Deployment

AMM V2 is deployed on all 15 Lux EVM chains (C-chain + 4 subnet chains * 3 networks). Factory address is deterministic via CREATE2.

## Security Considerations

1. **Price manipulation**: single-block price is manipulable. Use TWAP oracle for any price-sensitive logic.
2. **Reentrancy**: all state updates occur before external calls. The lock modifier prevents reentrancy.
3. **Token compatibility**: rebasing tokens and fee-on-transfer tokens require wrapper contracts.

## Reference

| Resource | Location |
|---|---|
| AMM V2 contracts | `github.com/luxfi/standard/contracts/amm/v2/` |
| Factory | `LuxFactory.sol` |
| Router | `LuxRouter02.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
