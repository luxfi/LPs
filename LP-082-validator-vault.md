---
lp: 082
title: Validator Reward Distribution Vault
tags: [validator, reward, distribution, vault, staking]
description: Validator reward distribution vault with proportional stake-weighted payouts
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2025-12-01
references:
  - lps-084 (Validator Economics)
  - lps-093 (Staked LUX)
  - lps-015 (Validator Key Management)
---

# LP-082: Validator Reward Distribution Vault

## Abstract

Defines the ValidatorVault contract that distributes block rewards to validators proportional to their stake weight. Rewards accumulate in the vault per epoch (1 day). Validators claim their share via `claim()`. Delegation is supported: delegators receive their proportional share minus a commission fee set by the validator.

## Specification

### Epoch-Based Accumulation

```
Epoch length: 86,400 seconds (1 day)
Reward per epoch: determined by issuance schedule (LP-083)
Distribution: proportional to stake weight at epoch start
```

### Contract Interface

```solidity
function claim(uint256 epoch) external;
function claimBatch(uint256[] calldata epochs) external;
function pendingRewards(address validator) external view returns (uint256);
function setCommission(uint256 bps) external;  // validator sets delegator commission
```

### Delegation

| Parameter | Description |
|-----------|-------------|
| Commission | Validator-set percentage of delegator rewards (0-5000 bps, max 50%) |
| Minimum delegation | 25 LUX |
| Unbonding period | 14 days |

Delegators call `claim()` against the vault directly. The vault calculates their share as:

```
delegator_reward = (delegator_stake / total_validator_stake) * epoch_reward * (1 - commission_bps / 10000)
```

### Reward Source

The vault receives newly minted LUX from the P-Chain issuance mechanism at the end of each epoch. The P-Chain `RewardManager` calls `vault.deposit{value: epochReward}()`.

### Slashing Integration

If a validator is slashed (double-signing, prolonged downtime), their pending rewards are burned:

```solidity
function slash(address validator, uint256 penalty) external onlyPChain;
```

Slashed rewards are sent to DeadBurn (LP-079).

## Security Considerations

1. Claiming is pull-based. The vault never pushes funds, preventing reentrancy issues.
2. Epoch snapshots use P-Chain validator set state. EVM-side manipulation cannot alter stake weights.
3. Commission changes take effect next epoch, not retroactively.
4. Unclaimed rewards persist indefinitely. No expiration.

## Reference

| Resource | Location |
|----------|----------|
| ValidatorVault contract | `github.com/luxfi/standard/contracts/staking/ValidatorVault.sol` |
| P-Chain RewardManager | `github.com/luxfi/node/vms/platformvm/reward/` |
| Delegation spec | `github.com/luxfi/node/vms/platformvm/txs/add_delegator_tx.go` |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
