---
lp: 093
title: sLUX Liquid Staking Token
tags: [staking, slux, liquid-staking, receipt, validator]
description: sLUX liquid staking receipt token representing staked LUX
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Token
created: 2024-06-01
references:
  - lps-082 (Validator Vault)
  - lps-094 (Liquid LUX)
  - lps-084 (Validator Economics)
---

# LP-093: sLUX Liquid Staking Token

## Abstract

Defines sLUX, the liquid staking receipt token for Lux Network. Users deposit LUX into the StakingPool contract, which delegates to validators. In return, users receive sLUX at an exchange rate that appreciates as staking rewards accrue. sLUX is freely transferable, usable as DeFi collateral, and redeemable for the underlying LUX plus accumulated rewards.

## Specification

### Contract

```solidity
contract StakingPool is ERC4626 {
    function deposit(uint256 assets, address receiver) external payable returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function totalAssets() external view returns (uint256);  // staked LUX + pending rewards
}
```

### Exchange Rate

```
exchangeRate = totalAssets() / totalSupply()
```

At genesis: 1 sLUX = 1 LUX. As validator rewards accumulate, totalAssets increases while totalSupply stays constant (no new sLUX minted for rewards). The exchange rate rises over time.

Example after 1 year at 8% APY: 1 sLUX = 1.08 LUX.

### Validator Selection

The StakingPool contract delegates to a curated set of validators selected by governance:

| Criteria | Threshold |
|----------|-----------|
| Minimum uptime | 95% over last 30 days |
| Maximum commission | 10% |
| Minimum self-stake | 10,000 LUX |
| No slashing history | Last 365 days |

Delegation is spread across all qualifying validators proportionally, preventing stake centralization.

### Redemption

Redemption has a withdrawal delay matching the P-Chain unbonding period:

| Step | Duration |
|------|----------|
| Request redemption | Immediate (burns sLUX) |
| Unbonding period | 14 days |
| Claim LUX | After unbonding completes |

### Properties

| Property | Value |
|----------|-------|
| Name | Staked LUX |
| Symbol | sLUX |
| Decimals | 18 |
| Standard | ERC-4626 |
| Fee | 0% protocol fee (validators charge their own commission) |

## Security Considerations

1. sLUX holders share slashing risk. If a delegated validator is slashed, totalAssets decreases and the exchange rate drops.
2. The validator selection set is updated by governance only. No single entity can redirect delegation.
3. The 14-day unbonding period prevents bank-run scenarios and matches the P-Chain security model.
4. The StakingPool contract is non-upgradeable. Migration requires deploying a new pool via governance.

## Reference

| Resource | Location |
|----------|----------|
| StakingPool contract | `github.com/luxfi/standard/contracts/staking/StakingPool.sol` |
| sLUX token | ERC-4626 shares of StakingPool |
| Validator vault | LP-082 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
