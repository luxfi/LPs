---
lp: 10
title: P-Chain (Platform Chain) Specification [DEPRECATED]
description: Specifies the Platform Chain, which is the metadata and coordination chain of Lux.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Superseded
type: Standards Track
category: Core
created: 2025-01-23
deprecated: 2025-01-28
superseded-by: 99
---

> **See also**: [LP-0](./lp-0-network-architecture-and-community-framework.md), [LP-11](./lp-11-x-chain-exchange-chain-specification.md), [LP-12](./lp-12-c-chain-contract-chain-specification.md), [LP-13](./lp-13-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md), [LP-99](./lp-99-q-chain-quantum-secure-consensus-protocol-family-quasar.md), [LP-INDEX](./LP-INDEX.md)

> **⚠️ DEPRECATION NOTICE**: This LP has been deprecated in Lux 2.0. The P-Chain has been replaced by the Q-Chain (Quantum/Platform Chain) which provides all platform management functionality with quantum-secure consensus. See [LP-99](./lp-99-q-chain-quantum-secure-consensus-protocol-family-quasar.md) for the current specification.

## Abstract

This LP specifies the Platform Chain, which is the metadata and coordination chain of Lux (analogous to Lux’s P-Chain). The LP will detail the P-Chain’s responsibilities: coordinating validators and staking, tracking active subnets/chains, and allowing the creation of new blockchains.

## Motivation

A separate chain for platform metadata is beneficial to offload governance and coordination from the busy transaction chains.

## Specification

### Overview

The P-Chain serves as Lux Network's metadata blockchain, managing the validator set, tracking subnets, and coordinating the network's proof-of-stake consensus. It operates using a linear chain structure optimized for platform operations rather than high transaction throughput.

### Core Responsibilities

1. **Validator Management**: Track and coordinate all network validators
2. **Staking Operations**: Handle staking, delegation, and rewards
3. **Subnet Coordination**: Manage subnet creation and membership
4. **Chain Creation**: Enable permissionless blockchain deployment

### Transaction Types

#### 1. Add Validator Transaction
```typescript
interface AddValidatorTx {
    nodeID: NodeID;              // Validator's node identifier
    startTime: timestamp;        // When validation starts
    endTime: timestamp;         // When validation ends
    stakeAmount: uint64;        // Amount of LUX staked
    rewardAddress: Address;     // Where to send rewards
    delegationFeeRate: uint32;  // Fee rate for delegators (0-100%)
}
```

Constraints:
- Minimum stake: 2,000 LUX
- Maximum stake: 3,000,000 LUX  
- Minimum duration: 2 weeks
- Maximum duration: 1 year

#### 2. Add Delegator Transaction
```typescript
interface AddDelegatorTx {
    nodeID: NodeID;             // Validator to delegate to
    startTime: timestamp;       // When delegation starts
    endTime: timestamp;        // When delegation ends
    stakeAmount: uint64;       // Amount to delegate
    rewardAddress: Address;    // Where to send rewards
}
```

Constraints:
- Minimum delegation: 25 LUX
- Must end before or when validator ends
- Total delegated cannot exceed validator stake * 5

#### 3. Create Subnet Transaction
```typescript
interface CreateSubnetTx {
    controlKeys: Address[];     // Who can modify subnet
    threshold: uint32;         // Required signatures
    metadata: bytes;           // Optional subnet info
}
```

Returns: SubnetID (32 bytes)

#### 4. Create Blockchain Transaction
```typescript
interface CreateBlockchainTx {
    subnetID: SubnetID;        // Which subnet hosts chain
    vmID: VMID;               // Virtual machine type
    genesisData: bytes;       // Initial chain state
    name: string;             // Human-readable name
}
```

Supported VMs:
- LuxVM (EVM-compatible)
- LinearVM (Linear chain)
- Custom VMs (Via plugin system)

#### 5. Add Subnet Validator Transaction
```typescript
interface AddSubnetValidatorTx {
    nodeID: NodeID;           // Node to add
    subnetID: SubnetID;       // Target subnet
    startTime: timestamp;     // Validation start
    endTime: timestamp;       // Validation end
    weight: uint64;          // Validator weight
}
```

### Staking Mechanics

#### Staking Rewards
```text
Annual Percentage Yield (APY) = f(totalStaked, supplyRemaining)

Where:
- Maximum APY: 11% (at 50% network staked)
- Minimum APY: 7% (at 80% network staked)
- Rewards decrease as total stake increases
```

#### Delegation Rewards
```text
DelegatorReward = ValidatorReward * (1 - delegationFeeRate)
ValidatorCommission = ValidatorReward * delegationFeeRate
```

### Subnet Architecture

#### Subnet Properties
```typescript
interface Subnet {
    id: SubnetID;
    controlKeys: Address[];
    threshold: uint32;
    blockchains: BlockchainID[];
    validators: ValidatorSet;
}
```

#### Validator Sets
- **Primary Network**: All validators must validate
- **Subnet**: Subset of primary validators
- **Weight**: Determines influence in consensus

### State Management

#### UTXO Model
P-Chain uses a UTXO model for:
- Tracking staked funds
- Managing locked outputs
- Handling rewards distribution

#### State Transitions
```text
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

### API Endpoints

#### Platform API
```typescript
platform.getValidators(subnetID?: SubnetID): Validator[]
platform.getCurrentValidators(subnetID?: SubnetID): Validator[]
platform.getPendingValidators(subnetID?: SubnetID): Validator[]
platform.getStake(addresses: Address[]): StakeInfo
platform.addValidator(tx: AddValidatorTx): TxID
platform.addDelegator(tx: AddDelegatorTx): TxID
platform.createSubnet(tx: CreateSubnetTx): SubnetID
platform.createBlockchain(tx: CreateBlockchainTx): BlockchainID
```

## Rationale

By reading this LP, one learns about proof-of-stake validator logic (quorums, staking periods) and subnet management in a multi-chain environment.

## Backwards Compatibility

This LP is foundational and does not introduce backwards compatibility issues.

## Security Considerations

### Validator Security
- **Sybil Resistance**: Minimum stake requirements prevent cheap validator spam
- **Stake Locking**: Validators cannot unstake during validation period
- **Key Management**: Validator keys must be kept secure; compromise leads to slashing

### Economic Security
- **Nothing at Stake**: Solved via stake locking during validation
- **Long Range Attacks**: Mitigated by finality and checkpointing
- **Delegation Limits**: 5x cap prevents excessive concentration

### Subnet Security
- **Validator Overlap**: Subnets must share validators with primary network
- **Control Key Management**: Multi-sig required for subnet modifications
- **Resource Isolation**: Subnet issues don't affect primary network

### Operational Security
- **Time Synchronization**: Critical for staking start/end times
- **UTXO Management**: Careful handling of locked vs available outputs
- **Upgrade Coordination**: P-Chain upgrades require validator coordination

## Test Cases

### Validator Operations
1. **Add Validator**
   - Valid stake amount and duration
   - Reject below minimum stake
   - Reject invalid time ranges

2. **Delegation**
   - Successful delegation within limits
   - Reject delegation exceeding 5x
   - Proper reward distribution

### Subnet Operations
1. **Create Subnet**
   - Valid control keys and threshold
   - Subnet ID generation
   - Blockchain addition

2. **Subnet Validation**
   - Add subnet validator
   - Verify primary network membership
   - Weight calculations

### Economic Tests
1. **Reward Calculation**
   - APY within expected range
   - Delegation fee splits
   - Compound staking effects

2. **UTXO State**
   - Lock/unlock transitions
   - Reward UTXO creation
   - Balance verification

## Reference Implementation

- P-Chain Core: [github.com/luxfi/node/vms/platformvm]
- Staking Calculator: [github.com/luxfi/staking-calculator]
- API Client: [github.com/luxfi/luxjs/platform]

## Implementation

### Platform VM (P-Chain)

**Status**: Active implementation in Lux Node (deprecated in favor of Q-Chain for new deployments)

- **GitHub**: https://github.com/luxfi/node/tree/main/vms/platformvm
- **Local**: `/Users/z/work/lux/node/vms/platformvm/`
- **Size**: ~45 MB, 44 directories
- **Languages**: Go

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **VM Core** | `vms/platformvm/vm.go` | Platform VM implementation |
| **State Management** | `vms/platformvm/state/` | Validator and staking state |
| **Transaction Types** | `vms/platformvm/txs/` | Validator, delegator, subnet transactions |
| **Rewards** | `vms/platformvm/reward/` | Reward calculation engine |
| **Warp** | `vms/platformvm/warp/` | Cross-chain messaging |
| **Block Executor** | `vms/platformvm/block/executor/` | Block validation and execution |
| **Signer** | `vms/platformvm/signer/` | Transaction signing and verification |

### Build Instructions

```bash
cd /Users/z/work/lux/node
go build -o build/luxd ./cmd/main.go

# Build with specific features
go build -ldflags "-X github.com/luxfi/node/version.Current=v1.20.1" -o build/luxd ./cmd/main.go
```

### Testing

```bash
# Test platform VM package
cd /Users/z/work/lux/node
go test ./vms/platformvm/... -v

# Test validator operations
go test ./vms/platformvm/state -v

# Test transaction processing
go test ./vms/platformvm/txs/executor -v

# Test reward calculations
go test ./vms/platformvm/reward -v

# Test with race detection
go test -race ./vms/platformvm/...

# Run specific test suite
go test ./vms/platformvm/block/executor -run TestBlockExecution -v
```

### API Testing

```bash
# After starting a Lux node
curl -X POST --data '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"platform.getCurrentValidators"
}' -H 'content-type:application/json;' http://localhost:9630/ext/bc/P
```

### File Size Verification

- **LP-10.md**: 8.0 KB (259 lines before enhancement)
- **After Enhancement**: ~11 KB with Implementation section
- **PlatformVM Package**: ~45 MB, 44 directories
- **Go Implementation Files**: ~65 files

### Related LPs

- **LP-2**: P-Chain Identifier (defines chain ID 'P')
- **LP-99**: Q-Chain (replaces P-Chain with quantum-secure consensus)
- **LP-11**: X-Chain (asset exchange)
- **LP-12**: C-Chain (smart contracts)
- **LP-605**: Validator Management (upgrades to P-Chain)
- **LP-181**: P-Chain Epoched Views (optimizes validator queries)

### Deprecation Notes

This implementation remains active but is superseded by the Q-Chain (LP-99) for new deployments. The P-Chain will continue to operate for backwards compatibility but all new developments should target the Q-Chain specification.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
