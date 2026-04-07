---
lps: 032
title: DEX VM
tags: [dex, d-chain, clob, orderbook, gpu, matching-engine, vm]
description: Central Limit Order Book DEX VM with GPU-accelerated matching
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2023-05-01
requires:
  - lps-009 (GPU Native EVM)
  - lps-011 (GPU Crypto Acceleration)
references:
  - lp-9010 (DEX Precompile)
  - lp-9100 (D-Chain Specification)
---

# LPS-032: DEX VM

## Abstract

The DEX VM runs the D-chain, a purpose-built virtual machine for Central Limit Order Book (CLOB) exchange operations. It implements a GPU-accelerated matching engine as a VM-native operation, not a smart contract. Orders are submitted as transactions, matched by the VM's built-in engine, and settled atomically within block execution. The D-chain achieves sub-millisecond order matching with throughput exceeding 100,000 orders per second.

## Specification

### Order Types

| Type | Description |
|---|---|
| `LimitOrder` | Buy/sell at a specific price or better |
| `MarketOrder` | Buy/sell at best available price, immediate-or-cancel |
| `StopLimit` | Limit order activated when trigger price is reached |
| `PostOnly` | Limit order that is rejected if it would match immediately |
| `FillOrKill` | Must fill entirely or revert |
| `ImmediateOrCancel` | Fill what is available, cancel the rest |

### Matching Engine

The matching engine runs as a VM-level operation during block execution:

1. **Order book**: per-market price-time priority queue stored in VM state
2. **Matching**: GPU kernel iterates the order book and matches incoming orders against resting orders
3. **Settlement**: matched trades produce atomic balance updates (no intermediate state)
4. **Tick size**: configurable per market (e.g., 0.01 USDC for LUX/USDC)

GPU acceleration uses the CUDA/Metal kernels from LPS-011 for parallel order matching across multiple markets simultaneously.

### Market Registry

Markets are registered by governance:

```
Market {
    marketID    uint64
    baseAsset   address    // e.g., LUX
    quoteAsset  address    // e.g., USDC
    tickSize    uint256    // minimum price increment
    lotSize     uint256    // minimum quantity increment
    makerFee    int256     // negative = rebate
    takerFee    uint256    // fee in basis points
    status      uint8      // 0=inactive, 1=active, 2=halted
}
```

### Fee Model

- **Maker rebate**: -0.5 bps (makers are paid for providing liquidity)
- **Taker fee**: 3.0 bps
- **Net protocol revenue**: 2.5 bps per matched trade
- **Fee distribution**: 70% to staking vault, 30% to treasury

### Cross-Chain Integration

The D-chain accepts assets from other Lux chains via Warp (LPS-021):

1. User locks assets on C-chain
2. Warp message delivers deposit to D-chain
3. User trades on D-chain
4. User withdraws via Warp back to C-chain

Deposits and withdrawals are processed within the same block as the Warp message.

## Security Considerations

1. **Front-running**: all orders in a block are matched deterministically by price-time priority. The block proposer cannot reorder within a price level.
2. **Market manipulation**: wash trading detection runs off-chain; flagged accounts can be suspended by governance.
3. **Circuit breakers**: markets auto-halt if price moves >10% in a single block.

## Reference

| Resource | Location |
|---|---|
| DEX VM | `github.com/luxfi/node/vms/dexvm/` |
| GPU matching engine | `github.com/luxfi/node/vms/dexvm/engine/` |
| DEX precompile | LP-9010 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
