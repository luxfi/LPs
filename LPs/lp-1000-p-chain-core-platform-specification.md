---
lp: 1000
title: P-Chain - Core Platform Specification
tags: [core, consensus, staking, validators, p-chain]
description: Core specification for the P-Chain (Platform Chain), the metadata and coordination chain of Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: 0, 99
supersedes: 10
---

## Abstract

LP-1000 specifies the P-Chain (Platform Chain), Lux Network's metadata and coordination blockchain. The P-Chain manages validator sets, staking operations, subnet coordination, and chain creation. It operates using Lux consensus optimized for platform operations.

## Motivation

A dedicated platform chain provides:

1. **Validator Management**: Centralized tracking of all network validators
2. **Staking Operations**: Handle staking, delegation, and rewards
3. **Subnet Coordination**: Manage subnet creation and membership
4. **Chain Creation**: Enable permissionless blockchain deployment

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `P` |
| VM ID | `platformvm` |
| VM Name | `platformvm` |
| Block Time | 2 seconds |
| Consensus | Lux (Linear) |

### Implementation

**Go Package**: `github.com/luxfi/node/vms/platformvm`

```go
import (
    pvm "github.com/luxfi/node/vms/platformvm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var PlatformVMID = constants.PlatformVMID // ids.ID{'p', 'l', 'a', 't', 'f', 'o', 'r', 'm', 'v', 'm'}

// Create P-Chain VM
factory := &pvm.Factory{}
vm, err := factory.New(logger)
```

### Directory Structure

```
node/vms/platformvm/
├── block/            # Block definitions and execution
├── config/           # Chain configuration
├── reward/           # Reward calculation engine
├── signer/           # Transaction signing
├── state/            # Validator and staking state
├── txs/              # Transaction types
├── warp/             # Cross-chain messaging
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
└── *_test.go         # Tests
```

### Core Responsibilities

1. **Validator Management**: Track and coordinate all network validators
2. **Staking Operations**: Handle staking, delegation, and rewards
3. **Subnet Coordination**: Manage subnet creation and membership
4. **Chain Creation**: Enable permissionless blockchain deployment

### Transaction Types

| Type | Description |
|------|-------------|
| `AddValidatorTx` | Add a validator to the primary network |
| `AddDelegatorTx` | Delegate stake to a validator |
| `CreateSubnetTx` | Create a new subnet |
| `CreateBlockchainTx` | Create a new blockchain |
| `AddSubnetValidatorTx` | Add validator to subnet |
| `RemoveSubnetValidatorTx` | Remove validator from subnet |
| `TransformSubnetTx` | Transform subnet to elastic subnet |

### Staking Parameters

| Parameter | Value |
|-----------|-------|
| Minimum Validator Stake | 2,000 LUX |
| Maximum Validator Stake | 3,000,000 LUX |
| Minimum Delegation | 25 LUX |
| Minimum Duration | 2 weeks |
| Maximum Duration | 1 year |
| Maximum Delegation Ratio | 5x validator stake |

### Staking Rewards

```
Annual Percentage Yield (APY) = f(totalStaked, supplyRemaining)

Where:
- Maximum APY: 11% (at 50% network staked)
- Minimum APY: 7% (at 80% network staked)
- Rewards decrease as total stake increases
```

### API Endpoints

#### RPC Methods

| Method | Description |
|--------|-------------|
| `platform.getCurrentValidators` | Get current validator set |
| `platform.getPendingValidators` | Get pending validators |
| `platform.getStake` | Get stake information |
| `platform.addValidator` | Add validator transaction |
| `platform.addDelegator` | Add delegator transaction |
| `platform.createSubnet` | Create subnet transaction |
| `platform.createBlockchain` | Create blockchain transaction |

#### REST Endpoints

```
GET  /ext/bc/P/validators/current
GET  /ext/bc/P/validators/pending
GET  /ext/bc/P/stake/{address}
POST /ext/bc/P/validators/add
POST /ext/bc/P/delegators/add
POST /ext/bc/P/subnets/create
POST /ext/bc/P/blockchains/create
```

### Subnet Architecture

```go
type Subnet struct {
    ID           ids.ID
    ControlKeys  []Address
    Threshold    uint32
    Blockchains  []BlockchainID
    Validators   ValidatorSet
}
```

**Subnet Properties**:
- **Primary Network**: All validators must validate
- **Subnets**: Subset of primary validators
- **Weight**: Determines influence in consensus

### UTXO Model

P-Chain uses a UTXO model for:
- Tracking staked funds
- Managing locked outputs
- Handling rewards distribution

```
UTXO States:
1. Available → Staked (via AddValidator)
2. Staked → Locked (during validation)
3. Locked → Available + Rewards (after validation)
```

### Consensus Integration

P-Chain uses Lux consensus (linear chain):
- Finality: ~2 seconds
- Byzantine fault tolerance: 80% honest stake
- No forks or uncles

### Configuration

```json
{
  "platformvm": {
    "minValidatorStake": 2000000000000,
    "maxValidatorStake": 3000000000000000,
    "minDelegatorStake": 25000000000,
    "minStakeDuration": 1209600,
    "maxStakeDuration": 31536000,
    "rewardConfig": {
      "maxConsumptionRate": 120000,
      "minConsumptionRate": 100000,
      "mintingPeriod": 31536000,
      "supplyCap": 720000000000000000
    }
  }
}
```

## Rationale

Design decisions for P-Chain:

1. **Separate Chain**: Platform operations isolated from transaction chains
2. **UTXO Model**: Simple state tracking for staking operations
3. **Linear Chain**: No need for DAG structure for platform operations
4. **Quasar Integration**: Compatible with quantum-safe consensus

## Backwards Compatibility

LP-1000 supersedes LP-0010. Both old and new numbers resolve to this document.

## Test Cases

See `github.com/luxfi/node/vms/platformvm/*_test.go`:

```go
func TestAddValidatorTx(t *testing.T)
func TestAddDelegatorTx(t *testing.T)
func TestCreateSubnetTx(t *testing.T)
func TestCreateBlockchainTx(t *testing.T)
func TestRewardCalculation(t *testing.T)
func TestUTXOStateTransitions(t *testing.T)
```

## Reference Implementation

**Repository**: `github.com/luxfi/node`
**Package**: `vms/platformvm`
**Dependencies**:
- `github.com/luxfi/node/vms/platformvm/state`
- `github.com/luxfi/node/vms/platformvm/txs`
- `github.com/luxfi/node/vms/platformvm/reward`

## Security Considerations

1. **Sybil Resistance**: Minimum stake requirements prevent cheap validator spam
2. **Stake Locking**: Validators cannot unstake during validation period
3. **Delegation Limits**: 5x cap prevents excessive concentration
4. **Key Management**: Validator keys must be kept secure

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0010 | P-Chain Platform Specification | Superseded by this LP |
| LP-1100 | Validator Management | Sub-specification |
| LP-1200 | Staking Mechanics | Sub-specification |
| LP-1300 | Subnet Management | Sub-specification |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
