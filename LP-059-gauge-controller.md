---
lp: 059
title: Gauge Controller
tags: [gauge, voting, fees, distribution, incentives, governance]
description: Gauge weight voting for directing protocol fee distribution across pools
author: Lux Industries
status: Final
type: Standards Track
category: Governance
created: 2025-12-01
requires:
  - lps-057 (DLUX Governance Token)
  - lps-058 (vLUX Voting Power)
references:
  - lp-11100 (Gauge Controller Specification)
---

# LP-059: Gauge Controller

## Abstract

The Gauge Controller directs protocol incentive emissions across Lux DeFi pools. DLUX holders vote weekly to allocate emission weight to gauges (pools, markets, vaults). Pools with higher gauge weight receive more LUX emissions, attracting more liquidity. This creates a market for liquidity incentives where protocols can bribe DLUX holders to direct emissions to their pools.

## Specification

### Gauge Registration

Each incentivized pool/market has a gauge:

```
Gauge {
    gaugeID     uint256
    pool        address     // AMM pool, lending market, or vault
    gaugeType   uint8       // 0=AMM, 1=lending, 2=staking, 3=bridge
    weight      uint256     // current vote weight (bps of total)
    killed      bool        // governance can kill gauges
}
```

### Voting

DLUX holders allocate their voting power across gauges:

```solidity
function voteForGaugeWeights(uint256 gaugeID, uint256 weight) external;
```

- Each DLUX holder has 10,000 weight points to distribute (100%)
- Weights are applied at the next epoch (weekly, Thursday 00:00 UTC)
- Votes persist until changed (no need to re-vote weekly)

### Emission Allocation

Total weekly LUX emission is split across gauges proportionally:

```
gaugeEmission_i = totalWeeklyEmission * gaugeWeight_i / totalWeight
```

Emissions are distributed to LP token stakers in each gauge, proportional to their share of the gauge's staked LP tokens.

### Gauge Types

| Type | Emission Share | Description |
|---|---|---|
| AMM | 50% of total | AMM V2, V3, StableSwap pools |
| Lending | 20% of total | Lending markets (supply side) |
| Staking | 20% of total | Liquid staking and restaking |
| Bridge | 10% of total | Bridge liquidity |

Within each type, DLUX votes determine the allocation among individual gauges.

### Bribes

Third-party protocols can incentivize DLUX holders to vote for their gauge:

```solidity
function depositBribe(uint256 gaugeID, address token, uint256 amount) external;
```

Bribes are distributed pro-rata to voters who allocated weight to that gauge in the current epoch. This creates a secondary market for liquidity incentives.

### Gauge Lifecycle

1. **Proposal**: new gauge created via governance proposal (LP-058)
2. **Active**: gauge accepts votes and receives emissions
3. **Killed**: governance can kill a gauge (emissions stop, votes are released)

Killed gauges cannot be revived. A new gauge must be created for the same pool.

### Anti-Gaming

- **Minimum vote**: 1% of holder's DLUX to prevent dust vote attacks
- **Vote lock**: votes are locked for 10 days after allocation (prevents vote-bribe-withdraw cycles)
- **Maximum per gauge**: 30% cap per gauge per voter to encourage diversification

## Security Considerations

1. **Bribe market manipulation**: large DLUX holders can dominate gauge votes. The 30% cap per voter and bribe market provide counterbalancing incentives.
2. **Dead gauges**: pools that lose all liquidity but retain gauge weight waste emissions. Governance can kill such gauges.
3. **Vote buying**: bribes are an explicit feature, not a bug. Transparent on-chain bribes are preferred over opaque off-chain deals.

## Reference

| Resource | Location |
|---|---|
| Gauge controller | `github.com/luxfi/standard/contracts/governance/` |
| GaugeController | `GaugeController.sol` |
| Bribe vault | `BribeVault.sol` |
| DLUX voting | LP-057 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
