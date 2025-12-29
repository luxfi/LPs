---
lps: 083
title: Token Economics Model
tags: [economics, tokenomics, issuance, supply, inflation, deflation]
description: LUX token economics including issuance schedule, supply cap, and fee model
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2023-01-01
references:
  - lps-079 (Burn Addresses)
  - lps-081 (Fee Splitter)
  - lps-084 (Validator Economics)
---

# LPS-083: Token Economics Model

## Abstract

Defines the LUX token economics model. Total supply cap: 1,963,000,000 LUX. Initial circulating supply at genesis: 963,000,000 LUX. Remaining 1,000,000,000 LUX is emitted as validator rewards over a declining issuance schedule. Transaction fees are partially burned (LPS-079), creating deflationary pressure that offsets issuance as network usage grows.

## Specification

### Supply Schedule

| Year | Annual Issuance | Cumulative Supply |
|------|----------------|-------------------|
| 1 | 100,000,000 | 1,063,000,000 |
| 2 | 90,000,000 | 1,153,000,000 |
| 3 | 81,000,000 | 1,234,000,000 |
| 4 | 72,900,000 | 1,306,900,000 |
| 5 | 65,610,000 | 1,372,510,000 |
| 10 | 38,742,049 | 1,651,321,852 |
| 20 | 13,508,517 | 1,878,461,744 |
| inf | 0 | 1,963,000,000 |

Annual issuance declines by 10% per year (geometric decay). Issuance halts when total supply reaches the cap.

### Genesis Allocation

| Category | Amount | Vesting |
|----------|--------|---------|
| Foundation | 289,000,000 | 7 annual unlocks |
| Team | 192,000,000 | 4-year linear, 1-year cliff |
| Investors | 192,000,000 | 2-year linear, 6-month cliff |
| Ecosystem | 96,000,000 | Released to community programs |
| Validator bootstrap | 96,000,000 | Initial staking rewards |
| Treasury | 98,000,000 | DAO-governed |

### Fee Model

EIP-1559-style base fee with priority tip:
- Base fee: dynamically adjusted per block (target 50% block utilization).
- Base fee split: 50% burn, 50% treasury (via LPS-079, LPS-081).
- Priority fee: 100% to block producer.

### Equilibrium

At steady-state of ~1,000 TPS with 25 gwei average base fee:
- Annual burn: ~8.2M LUX
- Year 10 issuance: ~38.7M LUX
- Net inflation: ~30.5M LUX/year (~1.8%)

As usage grows beyond ~4,700 TPS at 25 gwei, burn exceeds issuance and the supply becomes net-deflationary.

## Security Considerations

1. Issuance is enforced at the P-Chain consensus level. No smart contract can mint LUX beyond the schedule.
2. The supply cap is a hard protocol constant. Changing it requires a network fork.
3. Vesting contracts are immutable after deployment. Accelerated vesting is not possible.
4. Fee spikes (base fee surge) temporarily increase burn rate but do not affect issuance.

## Reference

| Resource | Location |
|----------|----------|
| Issuance implementation | `github.com/luxfi/node/vms/platformvm/reward/calculator.go` |
| Genesis allocation | `github.com/luxfi/genesis/` |
| Fee handler | `github.com/luxfi/evm/core/fee_handler.go` |

## Copyright

Copyright (C) 2023-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
