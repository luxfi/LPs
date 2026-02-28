---
lps: 008
title: Multi-Asset Trading Types
tags: [options, futures, fx, bonds, margin, multi-leg]
description: Unified type system for multi-asset class trading
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Markets
created: 2023-05-15
updated: 2025-12-25
requires:
  - LPS-005 (Regulated ATS Stack)
  - LPS-007 (CLOB Matching Engine)
---

# LPS-008: Multi-Asset Trading Types

## Abstract

This specification defines the unified type system used across all Lux trading modules. A single set of Go types in `broker/pkg/types` and TypeScript types in `exchange/pkgs/options/src/types.ts` ensures consistent representation of instruments across equities, options, futures, FX, and fixed income.

## Instrument Classes

| Class | Module | Provider(s) |
|-------|--------|-------------|
| Equity | broker | Alpaca, IBKR, Apex |
| Option | broker | Alpaca, IBKR, Apex (4-leg max) |
| Future | futures | Apex Futures, IBKR |
| FX Pair | forex | CurrencyCloud, LMAX, Circle, OpenPayd |
| Bond | broker | IBKR |
| Digital Asset | exchange | On-chain (AMM/CLOB) |

## Options

### Strategy Templates (13 built-in)

| Strategy | Legs | Description |
|----------|------|-------------|
| Long Call / Long Put | 1 | Directional |
| Covered Call / Protective Put | 2 | Hedged |
| Bull Call Spread / Bear Put Spread | 2 | Vertical |
| Straddle / Strangle | 2 | Volatility |
| Iron Condor | 4 | Range-bound |
| Iron Butterfly | 4 | Pinning |
| Calendar Spread | 2 | Time decay (per-leg expiration) |
| Diagonal Spread | 2 | Combined |
| Collar | 3 | Protection |

### Approval Levels

| Level | Allowed Strategies |
|-------|-------------------|
| 1 | Covered calls, cash-secured puts |
| 2 | Level 1 + long calls/puts, debit spreads |
| 3 | Level 2 + credit spreads, iron condors |
| 4 | Level 3 + naked options, ratio spreads |

### Margin

- **RegT** (Alpaca): 50% initial, 25% maintenance for equities
- **SPAN** (futures): risk-based margining per CME SPAN algorithm
- **Portfolio Margin**: cross-asset netting (IBKR)

## Type Alignment (Go ↔ TypeScript)

All Go types in `broker/pkg/types/types.go` have 1:1 TypeScript equivalents in `exchange/pkgs/options/src/types.ts`:

- `OptionContract` ↔ `OptionContract`
- `Greeks` (delta, gamma, theta, vega, rho, iv)
- `StrategyLeg` (with ratio field for ratio spreads)
- `FuturesContract`, `FXPair`, `Bond`
- `MarginRequirement`, `AccountMargin`
- `Instrument` (union type across all asset classes)

## References

### Lux Research Papers
- **lux-lightspeed-dex** — Multi-asset order matching
- **lux-perpetuals-derivatives** — Perpetual futures and options pricing
- **lux-credit-lending** — Margin lending protocol
- **lux-liquid-staking** — Liquid staking for collateral
- **lux-restaking** — Restaking for capital efficiency

### Hanzo Research Papers
- **hanzo-analytics-ml** — ML-based risk analytics
- **hanzo-ml-framework** — Candle ML framework for pricing models

### External Standards
- Black-Scholes-Merton: Options pricing model
- SPAN: CME Standard Portfolio Analysis of Risk
- Reg T: Federal Reserve Board margin requirements
