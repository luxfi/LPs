---
lp: 058
title: vLUX Voting Power
tags: [vlux, voting, governance, xlux, dlux, aggregated]
description: Aggregated voting power from xLUX and DLUX for unified governance
author: Lux Industries
status: Final
type: Standards Track
category: Governance
created: 2025-12-01
requires:
  - lps-045 (Liquid Staking)
  - lps-057 (DLUX Governance Token)
references:
  - lp-11000 (vLUX Specification)
---

# LP-058: vLUX Voting Power

## Abstract

vLUX (virtual LUX) is the unified voting power metric for Lux governance. It aggregates voting power from multiple sources: xLUX (liquid staking, LP-045), DLUX (governance staking, LP-057), and direct LUX staking on the P-chain. vLUX is not a token -- it is a computed view of an address's total governance weight. All Lux governance proposals use vLUX as the voting unit.

## Specification

### Voting Power Computation

```
vLUX(address) = directStake(address) + xLUX_value(address) + DLUX_value(address) + karmaBoost(address)
```

Where:

- `directStake`: LUX staked directly on the P-chain (1:1)
- `xLUX_value`: xLUX balance * xLUX exchange rate (LUX-equivalent)
- `DLUX_value`: DLUX balance * DLUX exchange rate (LUX-equivalent)
- `karmaBoost`: `karma(address) * 0.001 * (directStake + xLUX_value + DLUX_value)` (up to 10% boost)

### Karma Boost

Addresses with high Karma (LP-056) receive a governance boost:

| Karma Score | Boost |
|---|---|
| 0-99 | 0% |
| 100-499 | 1% |
| 500-1999 | 5% |
| 2000+ | 10% |

The boost is multiplicative on the base voting power, rewarding active participants.

### Governance Process

1. **Proposal creation**: requires 100,000 vLUX minimum
2. **Voting period**: 7 days
3. **Quorum**: 10% of total vLUX supply must vote
4. **Approval threshold**: >50% of votes cast (simple majority)
5. **Timelock**: 48-hour delay before execution

### Proposal Types

| Type | Quorum | Threshold | Timelock |
|---|---|---|---|
| Parameter change | 10% | 50% | 48h |
| New market/pool | 10% | 50% | 48h |
| Emergency action | 5% | 66% | 0h (immediate) |
| Protocol upgrade | 20% | 66% | 7 days |
| Treasury spend | 15% | 50% | 48h |

### Delegation

vLUX can be delegated to another address for governance:

- Delegator retains staking rewards but gives up voting power
- Delegation is per-source (can delegate xLUX but keep DLUX voting power)
- Re-delegation is instant (no unbonding)

### Snapshot Mechanism

Voting power is snapshotted at the block when a proposal is created. Changes to staking or holdings after the snapshot do not affect the vote. This prevents flash-loan governance attacks.

## Security Considerations

1. **Cross-chain voting**: direct P-chain stake is read via Warp message. The voting contract verifies the Warp signature before counting P-chain stake.
2. **Double counting**: the aggregation ensures no LUX is counted twice. LUX staked on P-chain is not also counted if it backs sLUX/xLUX.
3. **Plutocracy mitigation**: Karma boost gives active small holders proportionally more weight than passive whales.

## Reference

| Resource | Location |
|---|---|
| vLUX governor | `github.com/luxfi/standard/contracts/governance/` |
| Governor | `LuxGovernor.sol` |
| vLUX aggregator | `VLUXAggregator.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
