---
lp: 053
title: Restaking
tags: [restaking, avs, slashing, delegation, security, defi]
description: EigenLayer/Symbiotic-style restaking for shared security
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2024-06-01
requires:
  - lps-045 (Liquid Staking)
  - lps-030 (Platform VM)
references:
  - lp-10500 (Restaking Specification)
---

# LP-053: Restaking

## Abstract

Lux Restaking allows staked LUX (or sLUX/xLUX from LP-045) to secure additional services (AVSes -- Actively Validated Services) beyond the base Lux consensus. Restakers opt into AVSes, granting them slashing rights over the restaked capital. In return, restakers earn additional yield from AVS fees. This creates a marketplace for cryptoeconomic security where new protocols can bootstrap security without their own validator set.

## Specification

### Restaking Manager

The central contract manages restaking positions:

```solidity
struct Restaker {
    address owner;
    uint256 stakedAmount;        // native LUX or LST (sLUX/xLUX)
    address[] optedAVSes;        // AVSes this restaker has opted into
    mapping(address => uint256) avsBond;  // per-AVS slashable bond
}
```

### AVS Registration

An Actively Validated Service registers with the restaking protocol:

```
AVS {
    address     avsContract;     // AVS logic contract
    uint256     minBond;         // minimum restaked amount per operator
    uint256     maxSlashPct;     // maximum slashable percentage (e.g., 50%)
    address     slashOracle;     // contract that can trigger slashing
    uint256     rewardRate;      // LUX/second distributed to restakers
}
```

### Opt-In Flow

1. Restaker deposits LUX or LST into RestakingManager
2. Restaker calls `optInToAVS(avsAddress, bondAmount)`
3. Bond is locked and slashable by the AVS
4. Restaker begins earning AVS rewards

### Slashing

When an AVS detects misbehavior:

1. `slashOracle` submits a slashing proof to RestakingManager
2. RestakingManager verifies the proof against AVS-specific validation logic
3. Slashed amount (up to `maxSlashPct` of bond) is burned or sent to the AVS insurance fund
4. Restaker's position is reduced

### Withdrawal

Restakers can withdraw unstaked capital after an unbonding period:

- **Unstake request**: initiates unbonding (7-day delay)
- **Unbonding**: during this period, the AVS can still slash (for past misbehavior)
- **Withdraw**: after unbonding, capital is returned

### Delegation

Restakers can delegate to operators who run AVS infrastructure:

- Delegators share rewards and slashing proportionally
- Operators take a commission (configurable, default 10%)
- Delegators can re-delegate at any time (after unbonding from previous operator)

### Example AVSes

| AVS | Service | Slash Condition |
|---|---|---|
| Bridge relayer | Cross-chain message relay | Failed to relay valid message |
| Oracle provider | Price feed submission | Submitted price >2 sigma from median |
| DA committee | Data availability sampling | Failed to respond to DA queries |
| Sequencer | L2 transaction ordering | Equivocation (signed conflicting batches) |

## Security Considerations

1. **Cascading slashing**: a restaker opted into multiple AVSes can be slashed by all simultaneously. Maximum total slashing is the full bond.
2. **AVS risk assessment**: restakers must evaluate AVS slashing conditions. Malicious AVSes could slash unjustly. The `maxSlashPct` cap limits damage.
3. **Economic security**: an AVS's security is bounded by the total restaked capital opted in. New AVSes may have low initial security.

## Reference

| Resource | Location |
|---|---|
| Restaking contracts | `github.com/luxfi/standard/contracts/restaking/` |
| RestakingManager | `RestakingManager.sol` |
| AVS registry | `AVSRegistry.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
