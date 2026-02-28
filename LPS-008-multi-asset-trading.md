---
lps: 008
title: Multi-Asset Trading Types
tags: [options, futures, fx, bonds, margin, multi-leg]
description: Unified type system for multi-asset class trading
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Markets
created: 2024-03-10
updated: 2026-02-15
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
