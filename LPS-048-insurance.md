---
lps: 048
title: Protocol Insurance
tags: [insurance, underwriting, staking, coverage, claims, defi]
description: Protocol insurance with underwriter staking and parametric claims
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2025-12-01
requires:
  - lps-038 (Oracle VM)
references:
  - lp-10000 (Insurance Specification)
---

# LPS-048: Protocol Insurance

## Abstract

Lux Protocol Insurance enables any DeFi protocol to purchase coverage against smart contract exploits, oracle failures, or economic attacks. Underwriters stake USDC into coverage pools, earning premiums. Claims are resolved parametrically (automatic triggers based on on-chain conditions) or through governance vote. The insurance protocol is itself minimal -- no admin keys, no upgradability.

## Specification

### Coverage Pool

Each insured protocol has a coverage pool:

```
CoveragePool {
    protocol        address     // insured protocol address
    maxCoverage     uint256     // maximum payout (USDC)
    premium         uint256     // annual premium rate (bps of coverage)
    totalStaked     uint256     // underwriter deposits
    totalCoverage   uint256     // active coverage purchased
    claimTrigger    address     // parametric claim trigger contract
}
```

### Underwriting

Underwriters deposit USDC and specify which pools they back:

- **Minimum stake**: 100 USDC
- **Lock period**: 30 days (capital cannot be withdrawn during active coverage)
- **Yield**: premiums are distributed pro-rata to underwriters
- **Risk**: underwriter capital is used to pay claims

### Policy Purchase

Protocol users purchase coverage:

```solidity
function buyCoverage(uint256 poolId, uint256 amount, uint256 duration) external;
```

Premium is paid upfront in USDC. Coverage amount cannot exceed `maxCoverage` or `totalStaked * 0.5` (50% utilization cap).

### Claim Resolution

**Parametric claims** (automatic):

The `claimTrigger` contract monitors on-chain conditions. If triggered (e.g., protocol TVL drops >50% in 1 block), claims are paid automatically.

**Governance claims** (manual):

For non-parametric events, claims go through a governance process:

1. Claimant submits evidence with a 100 USDC bond
2. 7-day voting period for LUX stakers
3. If approved (>66% vote), claim is paid from the coverage pool
4. If rejected, claimant loses bond

### Payout

Claims are paid in USDC from the coverage pool. If the pool is insufficient, underwriters lose their full stake and the remaining claim is unpaid (no over-collateralization guarantee).

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Premium | 2-10% annual (varies by risk) | Underwriters |
| Protocol fee | 10% of premiums | Treasury |
| Claim bond | 100 USDC | Returned if claim approved |

## Security Considerations

1. **Correlated risk**: a systemic exploit (e.g., EVM bug) could trigger multiple pools simultaneously. Underwriter capital is shared, so diversification is limited.
2. **Governance capture**: claim governance requires 66% supermajority and uses time-weighted voting to prevent flash-loan governance attacks.
3. **Underfunding**: coverage pools can be underfunded if underwriters withdraw during the lock-free period between coverage terms.

## Reference

| Resource | Location |
|---|---|
| Insurance contracts | `github.com/luxfi/standard/contracts/insurance/` |
| Coverage pool | `CoveragePool.sol` |
| Parametric trigger | `ClaimTrigger.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
