---
lp: 2803
title: Freeze Voting & Guard System
description: Emergency governance controls for Lux DAOs with freeze voting and guard mechanisms
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-17
requires: 2800, 2803
tags: [dao, governance, security, freeze]
order: 2803
---

## Abstract

This LP specifies the Freeze Voting and Freeze Guard system for Lux DAOs. These contracts provide emergency governance controls, allowing authorized parties to freeze DAO operations in case of security incidents, governance attacks, or malicious proposals.

## Motivation

Emergency controls are essential for:

1. **Security Response**: Halt operations during active exploits
2. **Governance Protection**: Prevent malicious proposal execution
3. **Dispute Resolution**: Pause while resolving conflicts
4. **Regulatory Compliance**: Emergency response capabilities
5. **Recovery**: Allow time to coordinate recovery actions

## Specification

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Safe Wallet                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │
│  │   Azorius   │────▶│ FreezeGuard │────▶│ Transaction │    │
│  │   Module    │     │  (checks)   │     │  Execution  │    │
│  └─────────────┘     └─────────────┘     └─────────────┘    │
│                            │                                  │
│                            ▼                                  │
│                     ┌─────────────┐                          │
│                     │FreezeVoting │                          │
│                     │ (proposals) │                          │
│                     └─────────────┘                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Freeze Guard Contracts

#### FreezeGuardAzoriusV1

Guards Azorius module execution:

```solidity
// Location: contracts/contracts/freeze-guard/FreezeGuardAzoriusV1.sol

interface IFreezeGuardAzoriusV1 {
    // Freeze state
    function isFrozen() external view returns (bool);
    function freezeProposalId() external view returns (uint256);
    function freezeProposalCreatedBlock() external view returns (uint256);

    // Freeze control
    function freeze() external;
    function unfreeze() external;

    // Guard interface (called by Safe)
    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures,
        address msgSender
    ) external view;

    function checkAfterExecution(bytes32 txHash, bool success) external view;
}
```

#### FreezeGuardMultisigV1

Guards multisig execution:

```solidity
// Location: contracts/contracts/freeze-guard/FreezeGuardMultisigV1.sol

interface IFreezeGuardMultisigV1 {
    function isFrozen() external view returns (bool);
    function freezeVoting() external view returns (address);

    function checkTransaction(...) external view;
}
```

### Freeze Voting Contracts

#### FreezeVotingBase

Base contract for freeze voting:

```solidity
// Location: contracts/contracts/freeze-voting/FreezeVotingBase.sol

interface IFreezeVotingBase {
    // Freeze proposal
    function castFreezeVote() external;
    function freezeProposalVoteCount() external view returns (uint256);
    function freezeProposalCreatedBlock() external view returns (uint256);

    // Configuration
    function freezeVotesThreshold() external view returns (uint256);
    function freezeProposalPeriod() external view returns (uint256);
    function freezePeriod() external view returns (uint256);

    // State
    function isFrozen() external view returns (bool);
    function frozenBlock() external view returns (uint256);

    // Events
    event FreezeVoteCast(address indexed voter);
    event FreezeProposalCreated(address indexed creator);
    event Frozen();
    event Unfrozen();
}
```

#### FreezeVotingAzoriusV1

Freeze voting for Azorius DAOs:

```solidity
// Location: contracts/contracts/freeze-voting/FreezeVotingAzoriusV1.sol

interface IFreezeVotingAzoriusV1 is IFreezeVotingBase {
    function owner() external view returns (address);
    function parentStrategy() external view returns (address);

    // Uses parent strategy to determine voting weight
    function getVotingWeight(address _voter) external view returns (uint256);
}
```

#### FreezeVotingMultisigV1

Freeze voting for multisig DAOs:

```solidity
// Location: contracts/contracts/freeze-voting/FreezeVotingMultisigV1.sol

interface IFreezeVotingMultisigV1 is IFreezeVotingBase {
    function parentGnosisSafe() external view returns (address);

    // Only Safe owners can vote
    function isOwner(address _address) external view returns (bool);
}
```

#### FreezeVotingStandaloneV1

Standalone freeze voting:

```solidity
// Location: contracts/contracts/freeze-voting/FreezeVotingStandaloneV1.sol

interface IFreezeVotingStandaloneV1 is IFreezeVotingBase {
    function votingToken() external view returns (address);
    function getVotingWeight(address _voter) external view returns (uint256);
}
```

### File Structure

```
contracts/contracts/
├── freeze-guard/
│   ├── FreezeGuardAzoriusV1.sol     # Guards Azorius execution
│   └── FreezeGuardMultisigV1.sol    # Guards multisig execution
└── freeze-voting/
    ├── FreezeVotingBase.sol         # Base freeze voting
    ├── FreezeVotingAzoriusV1.sol    # Azorius freeze voting
    ├── FreezeVotingMultisigV1.sol   # Multisig freeze voting
    └── FreezeVotingStandaloneV1.sol # Standalone freeze voting
```

### Freeze Lifecycle

```
Normal Operation
      │
      ▼
┌─────────────────┐
│ Freeze Proposal │  Someone initiates freeze
│    Created      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Voting Period  │  Token holders vote to freeze
│  (N blocks)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Passed │ │Failed │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│FROZEN │ │Normal │
└───┬───┘ └───────┘
    │
    ▼
┌─────────────────┐
│  Freeze Period  │  All transactions blocked
│   (M blocks)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    UNFROZEN     │  Operations resume
└─────────────────┘
```

### Configuration Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `freezeVotesThreshold` | uint256 | Votes needed to freeze | 10% of supply |
| `freezeProposalPeriod` | uint256 | Voting duration (blocks) | 50400 (~7 days) |
| `freezePeriod` | uint256 | Freeze duration (blocks) | 100800 (~14 days) |

### Events

```solidity
event FreezeVoteCast(address indexed voter);
event FreezeProposalCreated(address indexed creator);
event Frozen();
event Unfrozen();
```

## Usage Example

```typescript
import {
  FreezeGuardAzoriusV1__factory,
  FreezeVotingAzoriusV1__factory
} from '@luxdao/sdk'

// Deploy freeze voting
const freezeVoting = await FreezeVotingAzoriusV1__factory.deploy(
  owner.address,
  votingStrategy.address,
  ethers.utils.parseEther('100000'),  // 100k tokens to freeze
  50400,   // 7 days voting
  100800   // 14 days frozen
)

// Deploy freeze guard
const freezeGuard = await FreezeGuardAzoriusV1__factory.deploy(
  owner.address,
  freezeVoting.address
)

// Set guard on Safe
await safe.setGuard(freezeGuard.address)

// Cast freeze vote (during emergency)
await freezeVoting.castFreezeVote()
```

## Rationale

### Separate Freeze Voting Contracts

Separating freeze voting from the main governance module allows:

1. **Independent Security**: Freeze mechanism can be audited separately
2. **Flexibility**: Different freeze rules for different DAO types
3. **Composability**: Multiple voting mechanisms can trigger freeze

### Guard-Based Architecture

Using Safe's guard system provides:

1. **Non-Invasive**: No modifications to existing Safe or Azorius code
2. **Standardized**: Compatible with Safe ecosystem tooling
3. **Upgradable**: Guards can be replaced without changing Safe setup

### Time-Based Freeze Periods

Fixed freeze durations provide:

1. **Predictability**: Members know when operations will resume
2. **Anti-Abuse**: Prevents indefinite governance lockup
3. **Recovery Time**: Ensures adequate time for response

## Backwards Compatibility

### LP-2504 Safe Standard

Fully compatible with LP-2504:

- Implements Safe's `Guard` interface
- Uses `checkTransaction` and `checkAfterExecution` hooks
- Can be set via Safe's `setGuard` function

### LP-2521 Azorius Integration

Works seamlessly with Azorius governance:

- Blocks proposal execution when frozen
- Uses Azorius voting strategies for freeze weight calculation
- Compatible with all Azorius proposal types

### Existing DAO Migration

DAOs can add freeze protection without migration:

- Deploy freeze voting and guard contracts
- Set guard on existing Safe via governance proposal
- No changes to existing governance module required

## Test Cases

### Freeze Voting Tests

```solidity
function test_CastFreezeVote() public {
    vm.prank(voter);
    freezeVoting.castFreezeVote();

    assertEq(freezeVoting.freezeProposalVoteCount(), voterWeight);
}

function test_FreezeWhenThresholdReached() public {
    // Cast enough votes to reach threshold
    for (uint i = 0; i < voters.length; i++) {
        vm.prank(voters[i]);
        freezeVoting.castFreezeVote();
    }

    assertTrue(freezeVoting.isFrozen());
}

function test_UnfreezeAfterPeriod() public {
    // Freeze first
    freezeVoting.freeze();
    assertTrue(freezeVoting.isFrozen());

    // Advance past freeze period
    vm.roll(block.number + freezePeriod + 1);

    assertFalse(freezeVoting.isFrozen());
}
```

### Guard Tests

```solidity
function test_BlockTransactionWhenFrozen() public {
    freezeVoting.freeze();

    vm.expectRevert("Governance frozen");
    freezeGuard.checkTransaction(
        target, value, data, operation,
        safeTxGas, baseGas, gasPrice, gasToken,
        refundReceiver, signatures, msg.sender
    );
}

function test_AllowTransactionWhenNotFrozen() public {
    // Should not revert
    freezeGuard.checkTransaction(
        target, value, data, operation,
        safeTxGas, baseGas, gasPrice, gasToken,
        refundReceiver, signatures, msg.sender
    );
}
```

## Security Considerations

1. **Threshold Setting**: Set freeze threshold high enough to prevent griefing
2. **Freeze Period**: Long enough for recovery, short enough to limit disruption
3. **Guard Bypass**: Ensure guard cannot be removed while frozen
4. **Multi-sig Override**: Consider emergency multi-sig override capability

## Related LPs

- **LP-2504**: Safe Multisig Standard
- **LP-2521**: Azorius Governance Module
- **LP-2520**: Lux DAO Platform

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
