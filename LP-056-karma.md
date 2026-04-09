---
lp: 056
title: Karma Reputation
tags: [karma, reputation, soulbound, identity, decay, governance]
description: Soul-bound reputation system with activity-weighted scoring and time decay
author: Lux Industries
status: Final
type: Standards Track
category: Governance
created: 2025-12-01
requires:
  - lps-030 (Platform VM)
references:
  - lp-10800 (Karma Specification)
---

# LP-056: Karma Reputation

## Abstract

Karma is Lux's on-chain reputation system. Each address accumulates a Karma score based on verifiable on-chain activity: staking, governance participation, protocol usage, and community contributions. Karma is soul-bound (non-transferable) and decays over time, ensuring the score reflects recent behavior. Karma feeds into credit lending (LP-054), governance weight (LP-058), and protocol fee discounts.

## Specification

### Score Computation

```
karma(address) = sum(activityWeight_i * amount_i * decayFactor(time_i))
```

Where `decayFactor(t) = 0.5^(daysSinceActivity / HALF_LIFE)` with `HALF_LIFE = 180 days`.

### Activity Categories

| Activity | Weight | Measurement |
|---|---|---|
| Staking | 1.0 | LUX-days staked |
| Governance voting | 2.0 | Votes cast |
| Liquidity provision | 0.5 | LP-token-days |
| Bridge usage | 0.3 | Transactions |
| Protocol interaction | 0.2 | Unique protocol-days |
| Loan repayment | 1.5 | Loans repaid on time |
| Loan default | -5.0 | Each default event |

### Soul-Bound Properties

- **Non-transferable**: Karma is bound to an address, not an NFT. It cannot be sold or moved.
- **Non-mintable**: no entity can grant Karma directly. It is computed from on-chain activity only.
- **View-only**: Karma is a view function that computes the score on demand from historical activity records.

### Activity Recording

Activities are recorded by attester contracts deployed per protocol:

```solidity
interface IKarmaAttester {
    function attest(address account, uint8 activityType, uint256 amount) external;
}
```

Attesters are registered by governance. Only registered attesters can record activities.

### Decay

Karma decays continuously. An activity from 180 days ago contributes half its original weight. After 360 days, one quarter. This ensures inactive accounts lose reputation over time.

### Querying

```solidity
interface IKarma {
    function scoreOf(address account) external view returns (uint256);
    function activityCount(address account, uint8 activityType) external view returns (uint256);
    function lastActive(address account) external view returns (uint256 timestamp);
}
```

### Use Cases

| Consumer | Usage |
|---|---|
| Credit lending (LP-054) | Determines credit tier and collateral requirements |
| Governance (LP-058) | Karma multiplier on voting power |
| Fee discounts | Higher Karma = lower protocol fees (up to 50% discount) |
| Airdrop eligibility | Karma threshold for protocol airdrops |

## Security Considerations

1. **Sybil resistance**: Karma accumulation requires economic activity (staking, LPing) with real capital at risk. Sybil accounts must deploy capital per address.
2. **Attester compromise**: a compromised attester could inflate Karma. Governance can deregister attesters and invalidate their historical attestations.
3. **Privacy**: Karma scores are public. Users who desire privacy should use separate addresses for reputation-sensitive activities.

## Reference

| Resource | Location |
|---|---|
| Karma contracts | `github.com/luxfi/standard/contracts/karma/` |
| Karma registry | `KarmaRegistry.sol` |
| Attester interface | `IKarmaAttester.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
