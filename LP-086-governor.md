---
lp: 086
title: Governor Contract with Gauge Weights
tags: [governor, governance, gauge, voting, timelock, execution]
description: Governor contract with gauge-weighted voting for resource allocation
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2023-09-01
references:
  - lps-085 (DAO Governance)
  - lps-081 (Fee Splitter)
---

# LP-086: Governor Contract with Gauge Weights

## Abstract

Defines the Governor contract that executes DAO proposals (LP-085) and manages gauge-weighted resource allocation. Gauges allow vLUX holders to direct protocol incentives (liquidity mining, ecosystem grants) to specific pools, chains, or programs. Gauge weights are recalculated weekly based on voting.

## Specification

### Governor

The Governor contract implements OpenZeppelin Governor with extensions:

| Extension | Purpose |
|-----------|---------|
| GovernorVotes | vLUX token as voting power source |
| GovernorTimelockControl | 7-day timelock on all executions |
| GovernorCountingSimple | For/Against/Abstain vote counting |
| GovernorSettings | Configurable voting delay, period, quorum |

### Gauge System

```solidity
function vote(uint256 gaugeId, uint256 weight) external;
function gaugeWeight(uint256 gaugeId) external view returns (uint256);
function resetEpoch() external;  // weekly recalculation
```

vLUX holders allocate their voting weight across gauges. Total allocation per user cannot exceed their vLUX balance.

### Gauge Types

| Gauge | Controls |
|-------|----------|
| Liquidity gauge | DEX pool incentive allocation |
| Chain gauge | Subnet chain ecosystem fund distribution |
| Grant gauge | Developer grant program funding |
| Burn gauge | Additional burn allocation (above base 50%) |

### Epoch Cycle

```
Monday 00:00 UTC: Epoch starts
  - Previous epoch gauge weights finalized
  - Incentive distribution for new epoch calculated
  - Users can update gauge votes throughout the week
Sunday 23:59 UTC: Epoch ends
  - Snapshot gauge weights for distribution
```

### Execution

Passed proposals are queued in the timelock and executed after the delay:

```solidity
function queue(uint256 proposalId) external;
function execute(uint256 proposalId) external;  // after timelock expires
function cancel(uint256 proposalId) external;   // guardian only, during timelock
```

The guardian (multisig) can cancel queued proposals during the timelock window as a safety valve.

## Security Considerations

1. Gauge voting is per-epoch. Vote manipulation requires sustained capital commitment, not flash loans.
2. The guardian cancel power is a safety net, not a veto. Guardian address is updateable via governance.
3. Proposal execution is atomic. If any sub-call reverts, the entire proposal reverts.
4. The Governor contract is non-upgradeable. New versions require migration via governance proposal.

## Reference

| Resource | Location |
|----------|----------|
| Governor contract | `github.com/luxfi/standard/contracts/governance/LuxGovernor.sol` |
| Gauge controller | `github.com/luxfi/standard/contracts/governance/GaugeController.sol` |
| Timelock | `github.com/luxfi/standard/contracts/governance/Timelock.sol` |

## Copyright

Copyright (C) 2023-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
