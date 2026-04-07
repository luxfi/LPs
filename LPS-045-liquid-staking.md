---
lps: 045
title: Liquid Staking
tags: [staking, slux, xlux, liquid, derivative, defi]
description: Liquid staking protocol producing sLUX (rebasing) and xLUX (non-rebasing) derivatives
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2024-06-01
requires:
  - lps-030 (Platform VM)
  - lps-038 (Oracle VM)
references:
  - lp-9700 (Liquid Staking Specification)
---

# LPS-045: Liquid Staking

## Abstract

Lux Liquid Staking allows LUX holders to stake while retaining liquidity. Deposited LUX is delegated to validators on the P-chain. Users receive either sLUX (rebasing, balance increases daily) or xLUX (non-rebasing, value accrual through exchange rate). Both derivatives are fully backed by staked LUX and can be used as collateral, traded, or composed in DeFi.

## Specification

### sLUX (Rebasing)

sLUX uses a rebasing mechanism where all holders' balances increase proportionally:

```
totalShares: total internal shares
totalPooledLUX: total staked LUX + accrued rewards

balanceOf(account) = shares[account] * totalPooledLUX / totalShares
```

When staking rewards arrive, `totalPooledLUX` increases, automatically increasing all sLUX balances.

### xLUX (Non-Rebasing)

xLUX wraps sLUX with a fixed-supply token whose exchange rate appreciates:

```
xLUX.exchangeRate = sLUX.balanceOf(xLUXVault) / xLUX.totalSupply()
```

xLUX is compatible with protocols that do not support rebasing tokens (vaults, lending markets).

### Staking Flow

1. User deposits LUX to the StakingPool contract on C-chain
2. StakingPool transfers LUX to the P-chain via cross-chain export (LPS-030)
3. LUX is delegated to validators selected by the node operator set
4. User receives sLUX or xLUX on C-chain

### Validator Selection

The protocol selects validators based on:

- **Uptime**: >95% uptime required
- **Commission**: lower commission preferred
- **Stake distribution**: spread across validators to avoid concentration
- **Maximum per validator**: 10% of total protocol stake

### Withdrawal

Withdrawals are subject to the P-chain unbonding period (2 weeks minimum):

1. User requests withdrawal by burning sLUX/xLUX
2. Request enters a withdrawal queue
3. When the delegated LUX is unstaked, it is returned to the user
4. A withdrawal buffer (5% of total deposits) enables instant withdrawals for small amounts

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Staking reward commission | 10% of rewards | 5% treasury, 5% node operators |
| Instant withdrawal fee | 0.1% | Withdrawal buffer (LPs) |

### Oracle

The sLUX/LUX exchange rate is published to the K-chain (LPS-038) for use in lending liquidations and other price-sensitive DeFi operations.

## Security Considerations

1. **Validator slashing**: if a validator is slashed, the loss is socialized across all sLUX holders. The protocol maintains a slashing insurance fund (2% of total stake).
2. **De-peg risk**: sLUX may trade below par during high withdrawal demand. The withdrawal buffer and DEX liquidity pools mitigate this.
3. **Oracle manipulation**: the sLUX/LUX rate is derived from on-chain state, not market price. It cannot be flash-loan manipulated.

## Reference

| Resource | Location |
|---|---|
| Liquid staking contracts | `github.com/luxfi/standard/contracts/staking/` |
| StakingPool | `StakingPool.sol` |
| xLUX vault | `XLUX.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
