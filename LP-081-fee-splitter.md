---
lp: 081
title: Fee Routing to LiquidLUX
tags: [fee, splitter, routing, xlux, staking, yield]
description: Fee routing contract distributing protocol revenue to LiquidLUX vault
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2025-12-01
references:
  - lps-080 (Treasury V2)
  - lps-094 (Liquid LUX)
  - lps-079 (Burn Addresses)
---

# LP-081: Fee Routing to LiquidLUX

## Abstract

Defines the FeeSplitter contract that routes protocol revenue from the TreasuryV2 (LP-080) to downstream recipients. The primary split: 50% burn (deflationary, LP-079), 30% to the xLUX LiquidLUX vault (LP-094) as yield for stakers, and 20% to the DAO treasury for operational funding.

## Specification

### Split Ratios

| Recipient | Share | Address |
|-----------|-------|---------|
| DeadBurn | 50% | `0x...dEa1` (LP-079) |
| xLUX Vault | 30% | LiquidLUX yield vault (LP-094) |
| DAO Treasury | 20% | DAO governance multisig (LP-085) |

### Contract Interface

```solidity
function distribute() external;
function setRatios(uint256 burnBps, uint256 vaultBps, uint256 daoBps) external onlyGovernance;
function recipients() external view returns (address burn, address vault, address dao);
```

- `distribute()` is permissionless. Splits the contract's LUX balance and forwards to each recipient.
- `setRatios()` requires governance timelock. Sum must equal 10,000 bps (100%).

### Flow

```
TreasuryV2 -> FeeSplitter.distribute()
  |-- 50% -> DeadBurn (permanent destruction)
  |-- 30% -> xLUX Vault (increases xLUX exchange rate)
  |-- 20% -> DAO Treasury (operational fund)
```

### Yield Mechanism

The 30% routed to the xLUX vault increases the LUX backing per xLUX token. xLUX holders receive yield without claiming -- the exchange rate appreciates over time.

### Governance Bounds

The governance can adjust ratios within bounds:
- Burn: minimum 30%, maximum 70%
- Vault: minimum 10%, maximum 50%
- DAO: minimum 5%, maximum 30%
- Sum must always equal 100%

## Security Considerations

1. `distribute()` is idempotent and permissionless. MEV extractors calling it early is harmless.
2. Ratio changes are subject to 7-day governance timelock.
3. Zero-balance distribution is a no-op (no revert, no gas waste).
4. The contract holds no persistent state beyond the ratio configuration.

## Reference

| Resource | Location |
|----------|----------|
| FeeSplitter contract | `github.com/luxfi/standard/contracts/treasury/FeeSplitter.sol` |
| xLUX vault | `github.com/luxfi/standard/contracts/staking/LiquidLUX.sol` |
| DeadBurn | LP-079 |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
