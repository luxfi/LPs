---
lps: 046
title: Options Protocol
tags: [options, european, black-scholes, settlement, defi]
description: European-style options protocol with on-chain settlement and Black-Scholes pricing
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2025-12-01
requires:
  - lps-038 (Oracle VM)
  - lps-041 (AMM V3)
references:
  - lp-9800 (Options Specification)
---

# LPS-046: Options Protocol

## Abstract

The Lux Options Protocol enables European-style options (exercisable only at expiry) for any oracle-priced asset. Option writers deposit collateral to mint option tokens (ERC-20) representing calls or puts at a specific strike and expiry. Option tokens are tradeable on AMM V3 (LPS-041). At expiry, options settle automatically against the K-chain oracle price (LPS-038).

## Specification

### Option Token

Each option series is a unique ERC-20:

```
OptionSeries {
    underlying  address     // e.g., LUX
    strike      uint256     // strike price in quote asset (e.g., 50 USDC)
    expiry      uint256     // Unix timestamp
    isCall      bool        // true = call, false = put
    collateral  address     // USDC for puts, underlying for calls
}
```

Option token name: `LUX-50C-20261231` (asset-strike-type-expiry).

### Writing

- **Call writer**: deposits 1 unit of underlying per option, receives 1 call token
- **Put writer**: deposits `strike` units of USDC per option, receives 1 put token
- Collateral is fully escrowed -- no margin, no liquidation risk for writers

### Settlement

At expiry, the oracle price `P` determines payoff:

- **Call payoff**: `max(P - strike, 0)` per option
- **Put payoff**: `max(strike - P, 0)` per option

Settlement is permissionless -- anyone can trigger settlement after expiry by calling `settle()` which reads the K-chain oracle price.

### Trading

Option tokens trade on AMM V3 pools. Market makers provide liquidity at prices reflecting implied volatility. The protocol does not enforce Black-Scholes pricing -- the market discovers the price through trading.

### Epoch System

Options are organized into weekly epochs (Friday 08:00 UTC expiry):

- New series are created by governance each epoch
- Standard strikes: ATM +/- 5%, 10%, 20%, 30%
- Standard expiries: 1 week, 2 weeks, 1 month, 3 months

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Minting fee | 0.05% of collateral | Treasury |
| Settlement fee | 0.02% of payoff | Settler (keeper) |
| Trading fee | AMM V3 pool fee | LPs |

## Security Considerations

1. **Full collateralization**: writers cannot be liquidated because options are fully collateralized. This eliminates systemic risk.
2. **Oracle at expiry**: settlement depends on a single oracle reading at expiry. The protocol uses a 30-minute TWAP to reduce manipulation risk.
3. **Expired unsettled options**: options not settled within 7 days after expiry can be reclaimed by writers.

## Reference

| Resource | Location |
|---|---|
| Options contracts | `github.com/luxfi/standard/contracts/options/` |
| Option factory | `OptionFactory.sol` |
| Settlement engine | `SettlementEngine.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
