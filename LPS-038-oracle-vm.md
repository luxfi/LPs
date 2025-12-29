---
lps: 038
title: Oracle VM
tags: [oracle, k-chain, price-feed, aggregation, vm]
description: Oracle aggregation VM for decentralized price feeds and external data
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2024-01-01
requires:
  - lps-020 (Quasar Consensus)
  - lps-021 (Warp Messaging)
references:
  - lp-7400 (Oracle Chain Specification)
---

# LPS-038: Oracle VM

## Abstract

The Oracle VM runs the K-chain (Knowledge chain), a dedicated chain for decentralized oracle data aggregation. Registered data providers submit price feeds and external data as K-chain transactions. The VM aggregates reports using a median-of-medians algorithm, producing canonical price points that are disseminated to all Lux chains via Warp messages. The K-chain replaces external oracle dependencies (Chainlink, Pyth) with a native, validator-secured data layer.

## Specification

### Data Feeds

Each feed is identified by a `(baseAsset, quoteAsset)` pair:

```
Feed {
    feedID      [32]byte    // hash(baseAsset || quoteAsset)
    baseAsset   string      // e.g., "LUX"
    quoteAsset  string      // e.g., "USD"
    heartbeat   uint64      // max seconds between updates
    deviation   uint256     // min price change to trigger update (bps)
    decimals    uint8       // price precision (e.g., 8 = 1e8)
}
```

### Provider Registration

Data providers stake LUX and register the feeds they serve:

- **Minimum stake**: 500 LUX per provider
- **Feed registration**: providers declare which feeds they serve
- **Reputation score**: rolling accuracy metric based on deviation from consensus median

### Report Submission

Providers submit reports as K-chain transactions:

```
Report {
    feedID      [32]byte
    price       uint256     // price * 10^decimals
    timestamp   uint64      // observation timestamp
    sources     []string    // e.g., ["binance", "coinbase", "kraken"]
    signature   []byte      // provider's signature
}
```

### Aggregation

The VM aggregates reports per feed per round:

1. Collect all reports for `feedID` within the current block
2. Filter outliers: discard reports >3 standard deviations from the median
3. Compute weighted median, weighted by provider stake
4. Emit canonical `PriceUpdate` event with the aggregated price

### Dissemination

Aggregated prices are pushed to all subscribing chains via Warp:

```
PriceUpdate {
    feedID      [32]byte
    price       uint256
    timestamp   uint64
    roundID     uint64
    signatures  []byte      // K-chain validator aggregate BLS signature
}
```

Consuming chains verify the Warp signature and update their local price cache.

### Slashing

Providers are slashed for:

- **Stale data**: missing heartbeat window (lose 0.1% stake per miss)
- **Outlier manipulation**: consistently submitting prices >2 standard deviations from median (lose 1% stake per offense)
- **Downtime**: offline for >1 hour (lose 0.5% stake)

## Security Considerations

1. **Collusion resistance**: median aggregation requires >50% of staked providers to collude for price manipulation.
2. **Flash loan immunity**: K-chain prices are off-chain observations, not on-chain spot prices. Flash loans cannot manipulate them.
3. **Latency**: K-chain block time is 1 second. Warp propagation adds <500ms. Total oracle latency: <1.5 seconds.

## Reference

| Resource | Location |
|---|---|
| Oracle VM | `github.com/luxfi/node/vms/oraclevm/` |
| Aggregation engine | `github.com/luxfi/node/vms/oraclevm/aggregator/` |
| Warp dissemination | LPS-021 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
