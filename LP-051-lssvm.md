---
lp: 051
title: LSSVM
tags: [lssvm, nft, amm, sudoswap, bonding-curve, defi]
description: Sudoswap-style NFT AMM with bonding curve pricing
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2024-09-01
references:
  - lp-10300 (LSSVM Specification)
---

# LP-051: LSSVM

## Abstract

LSSVM (Lux Sudoswap-Style Virtual Market) implements an NFT AMM where liquidity pools hold NFTs and tokens. Pool creators define a bonding curve that determines buy/sell prices. Users can instantly buy or sell NFTs into a pool without needing a counterparty. The protocol supports linear, exponential, and concentrated bonding curves.

## Specification

### Pool Types

| Type | Description |
|---|---|
| Buy pool | Holds tokens, buys NFTs (offers bids) |
| Sell pool | Holds NFTs, sells NFTs (offers asks) |
| Trade pool | Holds both, buys and sells (market maker) |

### Bonding Curves

**Linear**: `price(i) = spotPrice + i * delta`

**Exponential**: `price(i) = spotPrice * (1 + delta)^i`

**Concentrated**: flat price within a range, similar to V3 concentrated liquidity applied to NFTs.

Where `i` is the number of NFTs bought (positive) or sold (negative) from the initial spot price.

### Pool Creation

```solidity
struct PoolParams {
    address collection;     // NFT collection address
    address token;          // payment token (ETH or ERC-20)
    uint8   curveType;      // 0=linear, 1=exponential, 2=concentrated
    uint256 spotPrice;      // initial price
    uint256 delta;          // price increment/multiplier
    uint256 fee;            // pool owner fee (bps)
    uint256[] nftIds;       // initial NFTs (for sell/trade pools)
}
```

### Buy/Sell

**Buying NFTs from a pool**:
1. User specifies which NFT IDs to buy (or "any N")
2. Pool computes total cost using bonding curve
3. User pays tokens, receives NFTs
4. Spot price increases per the curve

**Selling NFTs to a pool**:
1. User sends NFTs to the pool
2. Pool computes payout using bonding curve
3. User receives tokens
4. Spot price decreases per the curve

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Pool owner fee | 0-90% (set by creator) | Pool owner |
| Protocol fee | 0.5% | Treasury |
| Royalty | ERC-2981 (if set) | Creator |

### Router

The LSSVM Router aggregates across multiple pools for best execution:

```solidity
function swapNFTsForToken(
    PairSwapSpecific[] calldata swapList,
    uint256 minOutput,
    address tokenRecipient
) external returns (uint256 outputAmount);
```

The router finds the optimal set of pools to maximize output for the user.

## Security Considerations

1. **Price manipulation**: bonding curve prices are deterministic based on pool state. No oracle dependency.
2. **Rug pull**: trade pool owners cannot withdraw all tokens while NFTs are in the pool (pool invariant enforced).
3. **Wash trading**: pool owner fees create a cost for wash trading, making it unprofitable.

## Reference

| Resource | Location |
|---|---|
| LSSVM contracts | `github.com/luxfi/standard/contracts/lssvm/` |
| Pool factory | `LSSVMPairFactory.sol` |
| Bonding curves | `LinearCurve.sol`, `ExponentialCurve.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
