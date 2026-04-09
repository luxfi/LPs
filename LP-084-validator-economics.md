---
lp: 084
title: Validator Reward Game Theory
tags: [validator, game-theory, staking, reward, slashing, incentive]
description: Game-theoretic analysis of validator incentives, rewards, and slashing
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2023-06-01
references:
  - lps-082 (Validator Vault)
  - lps-083 (Token Economics)
---

# LP-084: Validator Reward Game Theory

## Abstract

Defines the game-theoretic incentive structure for Lux Network validators. Validators are rewarded proportionally to stake weight and uptime. Misbehavior (double-signing, extended downtime) is penalized via slashing. The design ensures that honest participation is the dominant strategy for any rational validator.

## Specification

### Reward Function

```
reward(v, epoch) = base_reward * (stake_v / total_stake) * uptime_factor(v)
```

| Parameter | Value |
|-----------|-------|
| base_reward | Per-epoch issuance (LP-083) / number of active validators |
| uptime_factor | 1.0 if uptime >= 80%, linear decay below 80%, 0 below 60% |
| minimum stake | 2,000 LUX |
| maximum stake | 3,000,000 LUX (cap prevents centralization) |

### Uptime Measurement

Uptime is measured by the P-Chain via heartbeat messages:
- Validators broadcast a heartbeat every 30 seconds.
- Uptime = (received heartbeats / expected heartbeats) per epoch.
- Uptime below 60% for 3 consecutive epochs triggers ejection from the active set.

### Slashing Conditions

| Offense | Penalty | Evidence |
|---------|---------|----------|
| Double-signing | 5% of stake | Two conflicting signed blocks at same height |
| Prolonged downtime (>7 days) | 1% of stake | P-Chain uptime record |
| Invalid block proposal | 2% of stake | Block that fails consensus validation |

Slashed stake is burned via DeadBurn (LP-079). Slashing is adjudicated on-chain via the `SlashingManager` contract with a 48-hour dispute window.

### Nash Equilibrium

For a validator with stake S:
- Honest reward per epoch: R = base * (S / total_stake) * 1.0
- Attack payoff: at most R' (short-term double-spend gain) minus 5% * S (slash penalty)
- For the attack to be rational: R' > 0.05 * S

With minimum stake of 2,000 LUX, the attacker must gain >100 LUX per attack. With BFT consensus requiring 67% quorum, a solo attacker cannot succeed. The dominant strategy is honest participation.

### Delegation Incentives

Delegators increase a validator's stake weight, increasing its reward share. The validator sets a commission (0-50%). Higher commission attracts fewer delegators. Market equilibrium: validators compete on commission rates, converging to a sustainable rate.

## Security Considerations

1. Slashing evidence must be verifiable on-chain. False slashing claims are rejected by the SlashingManager.
2. The 48-hour dispute window allows validators to contest false accusations.
3. Stake cap prevents any single validator from exceeding ~3M LUX, limiting centralization risk.
4. Delegators share slashing risk proportionally. This incentivizes choosing reliable validators.

## Reference

| Resource | Location |
|----------|----------|
| RewardCalculator | `github.com/luxfi/node/vms/platformvm/reward/calculator.go` |
| SlashingManager | `github.com/luxfi/standard/contracts/staking/SlashingManager.sol` |
| Uptime tracking | `github.com/luxfi/node/snow/uptime/` |

## Copyright

Copyright (C) 2023-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
