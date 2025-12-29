---
lps: 085
title: DAO Governance Structure
tags: [dao, governance, karma, dlux, vlux, voting, proposal]
description: DAO structure with Karma reputation, DLUX governance token, and vLUX voting power
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2023-09-01
references:
  - lps-086 (Governor Contract)
  - lps-083 (Token Economics)
  - lps-080 (Treasury V2)
---

# LPS-085: DAO Governance Structure

## Abstract

Defines the Lux DAO governance structure. Three tokens determine governance power: Karma (non-transferable reputation earned through participation), DLUX (governance token received for locking LUX), and vLUX (vote-escrowed LUX with time-weighted voting power). Proposals require quorum of 4% of total vLUX supply. Execution is delayed by a 7-day timelock.

## Specification

### Governance Tokens

| Token | Type | Transferable | Source |
|-------|------|-------------|--------|
| Karma | Soulbound ERC-20 | No | Earned: validator uptime, proposal participation, development |
| DLUX | ERC-20 | Yes | Minted 1:1 for LUX locked in governance contract |
| vLUX | Vote-escrowed | No | Lock DLUX for 1-4 years, power = DLUX * lock_years / 4 |

### Voting Power

```
voting_power(user) = vLUX_balance(user) * (1 + karma_multiplier(user))
karma_multiplier = min(karma / 1000, 0.5)  // max 50% boost
```

Karma provides up to a 50% boost to voting power, rewarding long-term contributors without giving them outright control.

### Proposal Lifecycle

```
1. Draft -> submit proposal (requires 100,000 vLUX or 10 Karma)
2. Review period (2 days) -> community discussion
3. Voting period (5 days) -> For/Against/Abstain
4. Quorum check: 4% of total vLUX supply must vote
5. Passed -> 7-day timelock
6. Execute -> on-chain execution via Governor contract (LPS-086)
```

### Proposal Types

| Type | Quorum | Threshold | Timelock |
|------|--------|-----------|----------|
| Parameter change | 4% | Simple majority (>50%) | 7 days |
| Treasury spend | 4% | 60% supermajority | 7 days |
| Emergency action | 10% | 75% supermajority | 2 days |
| Protocol upgrade | 10% | 67% supermajority | 14 days |

### Treasury Control

The DAO governs the treasury (LPS-080). Spending proposals specify recipient, amount, and justification. Approved proposals execute via the timelock.

## Security Considerations

1. vLUX lock periods prevent flash-loan governance attacks. Voting power requires committed capital.
2. Karma is non-transferable and non-purchasable, preventing plutocratic capture.
3. The emergency action path has higher quorum (10%) and shorter timelock (2 days) for critical fixes.
4. Timelock allows users to exit (unstake, sell) before contentious proposals execute.

## Reference

| Resource | Location |
|----------|----------|
| Governance contracts | `github.com/luxfi/standard/contracts/governance/` |
| vLUX token | `github.com/luxfi/standard/contracts/governance/VotingEscrow.sol` |
| Karma token | `github.com/luxfi/standard/contracts/governance/Karma.sol` |

## Copyright

Copyright (C) 2023-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
