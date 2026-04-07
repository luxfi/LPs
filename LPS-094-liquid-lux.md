---
lps: 094
title: xLUX Master Yield Vault
tags: [xlux, vault, yield, liquid, staking, erc4626]
description: xLUX master yield vault aggregating staking rewards and protocol fees
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Token
created: 2025-12-01
references:
  - lps-093 (Staked LUX)
  - lps-081 (Fee Splitter)
  - lps-082 (Validator Vault)
---

# LPS-094: xLUX Master Yield Vault

## Abstract

Defines xLUX, the master yield vault token for Lux Network. xLUX aggregates multiple yield sources: sLUX staking rewards (LPS-093), protocol fee revenue (LPS-081), and DEX trading fees. Users deposit LUX and receive xLUX shares. The vault auto-compounds all yield sources, maximizing returns without manual intervention. xLUX is the canonical yield-bearing LUX representation.

## Specification

### Contract

```solidity
contract LiquidLUX is ERC4626 {
    function deposit(uint256 assets, address receiver) external payable returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
}
```

### Yield Sources

| Source | Mechanism | Estimated APY |
|--------|-----------|---------------|
| Staking rewards | Vault deposits into StakingPool (sLUX) | 6-10% |
| Protocol fees | FeeSplitter routes 30% of fees to vault (LPS-081) | 2-5% |
| DEX fees | Vault-owned liquidity in WLUX pairs | 1-3% |
| Total | Auto-compounded | 9-18% |

### Strategy Allocation

The vault allocates deposited LUX across strategies:

| Strategy | Allocation | Risk |
|----------|-----------|------|
| sLUX staking | 70% | Low (validator slashing) |
| Protocol fee capture | 20% | None (passive income) |
| DEX liquidity provision | 10% | Medium (impermanent loss) |

Allocations are rebalanced weekly by the strategy manager (governance-appointed, no withdrawal access).

### Exchange Rate

```
xLUX_rate = totalAssets() / totalSupply()
```

xLUX exchange rate only increases (barring slashing events). All yield is auto-compounded into the vault, increasing totalAssets.

### Properties

| Property | Value |
|----------|-------|
| Name | Liquid LUX |
| Symbol | xLUX |
| Decimals | 18 |
| Standard | ERC-4626 |
| Management fee | 2% annual (deducted from yield, not principal) |
| Withdrawal delay | 14 days (inherited from sLUX unbonding) |

## Security Considerations

1. The strategy manager can reallocate but cannot withdraw. Withdrawal requires the ERC-4626 redeem flow.
2. The 2% management fee is capped. Governance cannot increase it above 5%.
3. Slashing in the underlying sLUX reduces xLUX exchange rate. Users bear this risk.
4. DEX liquidity provision carries impermanent loss risk, mitigated by the 10% allocation cap.

## Reference

| Resource | Location |
|----------|----------|
| LiquidLUX vault | `github.com/luxfi/standard/contracts/staking/LiquidLUX.sol` |
| Strategy manager | `github.com/luxfi/standard/contracts/staking/StrategyManager.sol` |
| sLUX pool | LPS-093 |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
