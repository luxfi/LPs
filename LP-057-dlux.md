---
lp: 057
title: DLUX Governance Token
tags: [dlux, governance, rebasing, staking, token]
description: Rebasing governance token that accrues protocol revenue
author: Lux Industries
status: Final
type: Standards Track
category: Governance
created: 2025-12-01
requires:
  - lps-055 (LUX Tokenomics)
references:
  - lp-10900 (DLUX Specification)
---

# LP-057: DLUX Governance Token

## Abstract

DLUX (Decentralized LUX) is a rebasing governance token backed by protocol revenue. Users stake LUX to receive DLUX. Protocol fees from all Lux DeFi primitives (AMMs, lending, perpetuals, bridge) flow into the DLUX staking contract, increasing the LUX-per-DLUX exchange rate. DLUX holders participate in governance and earn a share of all protocol revenue.

## Specification

### Minting

Users deposit LUX to mint DLUX:

```
dluxMinted = luxDeposited * dluxTotalSupply / luxInContract
```

At genesis, the exchange rate is 1:1.

### Revenue Accrual

Protocol fees from across the Lux DeFi stack are periodically deposited into the DLUX contract:

| Source | Fee Share to DLUX |
|---|---|
| AMM V2/V3 protocol fee | 100% |
| StableSwap admin fee | 100% |
| Perpetuals protocol fee | 50% (other 50% to LPX vault) |
| Lending reserve fee | 100% |
| Bridge fee (treasury share) | 100% |
| Intent router protocol fee | 100% |

Revenue is converted to LUX (via DEX) and deposited, increasing `luxInContract`.

### Rebasing

The DLUX-to-LUX exchange rate increases as revenue accrues:

```
exchangeRate = luxInContract / dluxTotalSupply
```

This is a non-rebasing mechanism (like xSUSHI) -- the DLUX balance stays constant but each DLUX is redeemable for more LUX over time.

### Unstaking

Users burn DLUX to receive LUX:

```
luxReturned = dluxBurned * luxInContract / dluxTotalSupply
```

A 7-day cooldown period applies to prevent flash-loan governance attacks. During cooldown, DLUX is locked and does not earn additional revenue.

### Governance Power

1 DLUX = 1 governance vote (at current exchange rate in LUX terms). DLUX voting power is used in:

- Protocol parameter changes (fee rates, collateral factors)
- New market/pool creation approvals
- Attester registration (LP-056)
- Emergency actions (pause, parameter override)

### Revenue Distribution Epoch

Revenue is distributed weekly:

1. Fee collector aggregates fees from all sources
2. Fees are swapped to LUX via intent router (LP-050)
3. LUX is deposited into the DLUX contract
4. Exchange rate increases automatically

## Security Considerations

1. **Flash loan governance**: 7-day cooldown on unstaking prevents flash-minting DLUX for governance votes.
2. **Revenue dependency**: DLUX value depends on protocol fee generation. In low-activity periods, the yield may be minimal.
3. **Exchange rate manipulation**: the exchange rate is purely a function of contract LUX balance and DLUX supply. Direct LUX deposits to the contract increase the rate for existing holders.

## Reference

| Resource | Location |
|---|---|
| DLUX contracts | `github.com/luxfi/standard/contracts/governance/` |
| DLUX staking | `DLUX.sol` |
| Fee collector | `FeeCollector.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
