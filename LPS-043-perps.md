---
lps: 043
title: Perpetual Futures
tags: [perps, futures, leverage, funding, liquidation, defi]
description: LPX-style perpetual futures protocol with up to 50x leverage
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2024-01-01
requires:
  - lps-038 (Oracle VM)
references:
  - lp-9500 (Perpetuals Specification)
---

# LPS-043: Perpetual Futures

## Abstract

The Lux perpetual futures protocol enables leveraged trading of any oracle-priced asset without expiry dates. Traders open long or short positions with up to 50x leverage, collateralized by USDC. A funding rate mechanism keeps the perpetual price aligned with the oracle spot price. Liquidity is provided by a shared vault (the LPX pool) that acts as counterparty to all trades.

## Specification

### Position Model

```
Position {
    owner           address
    market          bytes32     // e.g., keccak256("LUX/USD")
    isLong          bool
    size            uint256     // position size in USD
    collateral      uint256     // USDC collateral
    entryPrice      uint256     // oracle price at open
    entryFunding    int256      // cumulative funding at open
}
```

Leverage = `size / collateral`. Maximum 50x.

### LPX Vault

The LPX vault provides liquidity for all markets:

- LPs deposit USDC into the vault, receiving LPX tokens
- The vault is the counterparty to every trade: trader PnL = -vault PnL
- Vault value = deposited USDC + unrealized PnL from all open positions
- LPX token price = vault value / LPX total supply

### Funding Rate

Funding rate aligns perp price with oracle price:

```
fundingRate = (perpPrice - oraclePrice) / oraclePrice * fundingFactor
```

- **Payment frequency**: every 8 hours
- **Direction**: longs pay shorts when perp > oracle; shorts pay longs when perp < oracle
- **Factor**: `fundingFactor = 0.01` (1% per 8h at full divergence)

Funding is accrued continuously and settled on position modification.

### Liquidation

Positions are liquidated when margin ratio falls below maintenance margin:

```
marginRatio = (collateral + unrealizedPnL - pendingFunding) / size
maintenanceMargin = 0.5% (50x) to 1% (25x), scaled by leverage
```

Liquidators receive a 0.5% keeper fee. Remaining collateral (if any) returns to the trader.

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Open/close fee | 0.08% of size | 70% LPX vault, 30% treasury |
| Borrowing fee | variable (utilization-based) | LPX vault |
| Liquidation fee | 0.50% of size | Liquidator |

### Markets

Markets are added by governance. Each market specifies:

- Oracle feed ID (LPS-038 K-chain feed)
- Maximum leverage (up to 50x)
- Maximum open interest (per side)
- Funding factor

## Security Considerations

1. **Oracle dependency**: all PnL calculations use K-chain oracle prices (LPS-038). Oracle manipulation directly impacts positions.
2. **Vault risk**: in extreme one-directional markets, the LPX vault can lose capital. Maximum open interest limits bound this risk.
3. **Cascading liquidations**: rapid price moves can trigger liquidation cascades. A liquidation buffer (auto-deleverage) reduces systemic risk.

## Reference

| Resource | Location |
|---|---|
| Perpetuals contracts | `github.com/luxfi/standard/contracts/perps/` |
| LPX vault | `LPXVault.sol` |
| Oracle integration | LPS-038 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
