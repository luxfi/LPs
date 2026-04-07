---
lps: 052
title: Price Oracle Aggregation
tags: [oracle, price, aggregation, twap, multi-source, defi]
description: Multi-source price oracle aggregation for on-chain consumption
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2024-01-01
requires:
  - lps-038 (Oracle VM)
  - lps-041 (AMM V3)
references:
  - lp-10400 (Oracle Aggregation Specification)
---

# LPS-052: Price Oracle Aggregation

## Abstract

The Lux Price Oracle aggregates prices from multiple on-chain and off-chain sources into a single canonical price per asset pair. Sources include AMM V3 TWAP (LPS-041), K-chain oracle feeds (LPS-038), and StableSwap virtual prices (LPS-042). The aggregator uses a weighted median with freshness scoring to produce manipulation-resistant prices for use by lending protocols, perpetuals, and other DeFi primitives.

## Specification

### Source Registry

Each price feed aggregates from registered sources:

```
Source {
    sourceType  uint8       // 0=AMM_TWAP, 1=KCHAIN, 2=STABLESWAP, 3=CUSTOM
    sourceAddr  address     // contract address or feed ID
    weight      uint256     // aggregation weight
    maxStaleness uint256    // max seconds before source is considered stale
}
```

### Aggregation Algorithm

For each price update:

1. Query all registered sources for the current price
2. Discard stale sources (older than `maxStaleness`)
3. Discard outliers (>3 standard deviations from the unweighted median)
4. Compute weighted median of remaining sources
5. Emit `PriceUpdated(feedId, price, timestamp, sourceCount)`

### Source Types

**AMM V3 TWAP**: reads the cumulative tick accumulator from V3 pools. Default window: 30 minutes. Resistant to single-block manipulation.

**K-chain feed**: reads the latest aggregated price from the Oracle VM (LPS-038). Sub-second freshness.

**StableSwap virtual price**: for LP token pricing, reads `get_virtual_price()` from StableSwap pools (LPS-042). Monotonically increasing.

**Custom**: any contract implementing `IOracle.getPrice() returns (uint256 price, uint256 timestamp)`.

### Consumer Interface

```solidity
interface IPriceOracle {
    function getPrice(bytes32 feedId) external view returns (uint256 price, uint256 timestamp);
    function getPriceTWAP(bytes32 feedId, uint256 window) external view returns (uint256 price);
}
```

### Fallback Chain

If the primary source is stale, the oracle falls through a priority chain:

1. K-chain feed (highest priority, freshest)
2. AMM V3 30-minute TWAP
3. AMM V3 2-hour TWAP (wider window, more resistant)
4. Last known price with staleness flag

Consumers can check `timestamp` to determine freshness.

### Circuit Breaker

If the price changes >20% in a single update, the oracle pauses for 5 minutes and re-queries. This prevents flash crash propagation to dependent protocols.

## Security Considerations

1. **Multi-source resilience**: compromising a single source is insufficient to manipulate the aggregated price (requires >50% of weighted sources).
2. **TWAP window**: 30-minute TWAP requires sustained manipulation over 30 minutes of on-chain trading, making attacks expensive.
3. **Circular dependency**: oracle prices must not depend on protocols that themselves depend on the oracle (e.g., oracle using lending pool prices that use the same oracle for liquidations).

## Reference

| Resource | Location |
|---|---|
| Oracle aggregator | `github.com/luxfi/standard/contracts/oracle/` |
| Aggregator | `PriceAggregator.sol` |
| K-chain integration | LPS-038 |
| AMM V3 oracle | LPS-041 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
