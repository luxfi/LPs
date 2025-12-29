---
lps: 055
title: LUX Tokenomics
tags: [tokenomics, emission, vesting, supply, burn, economics]
description: LUX token economics including emission schedule, vesting, and fee burns
author: Lux Industries
status: Final
type: Standards Track
category: Economics
created: 2023-06-01
requires:
  - lps-030 (Platform VM)
  - lps-045 (Liquid Staking)
references:
  - lp-10700 (Tokenomics Specification)
---

# LPS-055: LUX Tokenomics

## Abstract

LUX is the native token of the Lux Network. It is used for staking, gas fees, governance, and as collateral across DeFi protocols. The total supply is capped at 1 billion LUX. Emission follows a decreasing schedule over 10 years, with 50% allocated to staking rewards. Transaction fees are partially burned, creating deflationary pressure as network usage grows.

## Specification

### Supply

| Allocation | Amount | Vesting |
|---|---|---|
| Staking rewards | 500M (50%) | 10-year emission schedule |
| Team + advisors | 150M (15%) | 4-year vest, 1-year cliff |
| Ecosystem fund | 150M (15%) | 5-year linear unlock |
| Foundation | 100M (10%) | 3-year linear unlock |
| Public sale | 50M (5%) | Immediate |
| Seed / private | 50M (5%) | 2-year vest, 6-month cliff |

**Max supply**: 1,000,000,000 LUX (1 billion). No minting beyond this cap.

### Emission Schedule

Staking rewards follow a half-life emission:

```
annualEmission(year) = 500M * 0.5^(year / 4)
```

| Year | Annual Emission | Cumulative |
|---|---|---|
| 1 | ~84M | 84M |
| 2 | ~71M | 155M |
| 3 | ~59M | 214M |
| 4 | ~50M | 264M |
| 5-10 | decreasing | 500M total by year ~15 |

Rewards are distributed per-epoch to validators and delegators proportional to stake weight and uptime.

### Fee Model

Transaction fees on all Lux chains are paid in LUX:

- **Base fee**: EIP-1559 style with target block utilization of 50%
- **Priority fee**: optional tip to validators
- **Burn**: 50% of base fee is burned (permanently removed from supply)
- **Validator share**: 50% of base fee + 100% of priority fee goes to block proposer

### Burn Mechanics

The burn address `0x000000000000000000000000000000000000dEaD` accumulates burned LUX. Burned tokens are subtracted from circulating supply. At high network utilization, daily burn can exceed daily emission, making LUX net deflationary.

### Staking Economics

- **Current APR**: variable, approximately 8-12% for validators (decreasing as total stake increases)
- **Delegation APR**: validator APR minus delegation fee (minimum 2%)
- **Slashing**: equivocation results in 1% stake slash; extended downtime results in reward withholding (no slash)
- **Compounding**: rewards can be restaked automatically via liquid staking (LPS-045)

### Governance Weight

LUX staked (directly or via sLUX/xLUX) counts toward governance voting power:

- 1 staked LUX = 1 vote
- Delegation preserves voting rights (delegator votes, not validator)
- Vote-escrowed LUX (veLUX via LPS-058) has boosted weight

### Cross-Chain Gas

LUX is the gas token on all Lux chains (C-chain and all subnets). Subnet chains can optionally use a subnet-specific gas token, but LUX is accepted universally via automatic swap at the protocol level.

## Security Considerations

1. **Inflation attack**: max supply cap prevents unlimited inflation. Emission schedule is immutable in genesis.
2. **Concentration risk**: team and investor allocations are vested to prevent early dumping. Vesting contracts are non-upgradeable.
3. **Fee burn manipulation**: burning 50% of base fees creates a floor on deflationary pressure. The other 50% incentivizes validators.

## Reference

| Resource | Location |
|---|---|
| Token contract | `github.com/luxfi/standard/contracts/token/LUX.sol` |
| Vesting contracts | `github.com/luxfi/standard/contracts/vesting/` |
| Fee burn implementation | `github.com/luxfi/evm/core/state_transition.go` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
