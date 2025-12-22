---
lp: 2801
title: Azorius Governance Module
description: Modular on-chain governance module for Lux DAOs with proposal lifecycle management
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-17
requires: 2800, 2802
tags: [dao, governance, azorius, module]
order: 2801
---

## Abstract

This LP specifies the Azorius governance module (ModuleAzoriusV1), the primary governance engine for Lux DAOs. Azorius provides a modular, extensible framework for proposal creation, voting, and execution with support for multiple voting strategies, timelocks, and Safe multi-sig integration.

## Motivation

Azorius enables:

1. **Modular Voting**: Pluggable voting strategies (ERC20, ERC721, linear, quadratic)
2. **Safe Integration**: Native integration with Safe multi-sig wallets
3. **Flexible Proposals**: Multiple proposal types with custom execution
4. **Timelock Security**: Configurable delays between voting and execution
5. **Extensibility**: Strategy adapters for custom voting mechanisms

## Specification

### Contract Interface

```solidity
// Location: contracts/contracts/modules/ModuleAzoriusV1.sol

interface IModuleAzoriusV1 {
    enum ProposalState {
        ACTIVE,
        CANCELED,
        TIMELOCKED,
        EXECUTABLE,
        EXECUTED,
        EXPIRED,
        FAILED
    }

    struct Proposal {
        uint32 executionCounter;
        uint32 timelockPeriod;
        uint32 executionPeriod;
        uint32 proposer;
        uint32 voteStartBlock;
        bytes32 proposalId;
    }

    // Proposal lifecycle
    function submitProposal(
        address _strategy,
        bytes memory _data,
        Transaction[] calldata _transactions,
        string calldata _metadata
    ) external returns (uint32 proposalId);

    function executeProposal(
        uint32 _proposalId,
        address[] calldata _targets,
        uint256[] calldata _values,
        bytes[] calldata _data,
        Enum.Operation[] calldata _operations
    ) external;

    // Voting
    function vote(uint32 _proposalId, uint8 _voteType) external;
    function voteWithSignature(
        uint32 _proposalId,
        uint8 _voteType,
        bytes calldata _signature
    ) external;

    // State queries
    function proposalState(uint32 _proposalId) external view returns (ProposalState);
    function getProposal(uint32 _proposalId) external view returns (Proposal memory);

    // Strategy management
    function enableStrategy(address _strategy) external;
    function disableStrategy(address _strategy) external;
    function isStrategyEnabled(address _strategy) external view returns (bool);
}
```

### Proposal Lifecycle

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│ SUBMIT   │───▶│  ACTIVE  │───▶│ TIMELOCKED│───▶│EXECUTABLE │───▶│ EXECUTED │
│          │    │ (voting) │    │  (delay)  │    │           │    │          │
└──────────┘    └──────────┘    └───────────┘    └───────────┘    └──────────┘
                     │                                │
                     ▼                                ▼
               ┌──────────┐                     ┌──────────┐
               │  FAILED  │                     │ EXPIRED  │
               │(no quorum)│                     │(timeout) │
               └──────────┘                     └──────────┘
```

### Configuration Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `timelockPeriod` | uint32 | Blocks between vote end and execution |
| `executionPeriod` | uint32 | Blocks during which execution is valid |
| `quorumNumerator` | uint256 | Quorum percentage (basis points) |
| `votingDelay` | uint256 | Blocks before voting starts |
| `votingPeriod` | uint256 | Duration of voting in blocks |

### Voting Strategies

Azorius supports pluggable voting strategies:

```solidity
interface IBaseStrategy {
    function initializeProposal(bytes memory _data) external;
    function isPassed(uint32 _proposalId) external view returns (bool);
    function isProposer(address _address) external view returns (bool);
    function votingEndBlock(uint32 _proposalId) external view returns (uint256);
    function getProposalVotes(uint32 _proposalId) external view returns (
        uint256 noVotes,
        uint256 yesVotes,
        uint256 abstainVotes
    );
}
```

**Available Strategies**:
- `LinearERC20Voting` - Token-weighted (1 token = 1 vote)
- `LinearERC721Voting` - NFT-weighted (1 NFT = 1 vote)
- `QuadraticERC20Voting` - Quadratic voting
- `WhitelistVoting` - Address whitelist voting

### Transaction Structure

```solidity
struct Transaction {
    address to;           // Target contract
    uint256 value;        // ETH value
    bytes data;           // Calldata
    Enum.Operation op;    // Call or DelegateCall
}
```

### Events

```solidity
event ProposalCreated(
    address indexed strategy,
    uint32 indexed proposalId,
    address indexed proposer,
    Transaction[] transactions,
    string metadata
);

event ProposalExecuted(uint32 indexed proposalId);
event ProposalCanceled(uint32 indexed proposalId);
event Voted(address indexed voter, uint32 indexed proposalId, uint8 voteType, uint256 weight);
event StrategyEnabled(address indexed strategy);
event StrategyDisabled(address indexed strategy);
```

### Safe Integration

Azorius executes transactions through a Safe multi-sig:

```solidity
// Azorius is a Safe module
function executeProposal(...) external {
    require(proposalState(_proposalId) == ProposalState.EXECUTABLE);

    // Execute via Safe
    for (uint i = 0; i < _targets.length; i++) {
        safe.execTransactionFromModule(
            _targets[i],
            _values[i],
            _data[i],
            _operations[i]
        );
    }

    emit ProposalExecuted(_proposalId);
}
```

### File Location

```
contracts/contracts/modules/
├── ModuleAzoriusV1.sol       # Main Azorius module
└── ModuleFractalV1.sol       # Fractal (hierarchical) variant
```

## Usage Example

```typescript
import { ModuleAzoriusV1__factory } from '@luxdao/sdk'

// Deploy Azorius module
const azorius = await ModuleAzoriusV1__factory.deploy(
  owner,
  safe.address,
  safe.address,
  [votingStrategy.address],
  timelockPeriod,
  executionPeriod
)

// Submit proposal
const tx = await azorius.submitProposal(
  votingStrategy.address,
  ethers.utils.defaultAbiCoder.encode(['uint256'], [votingPeriod]),
  [
    {
      to: treasury.address,
      value: ethers.utils.parseEther('10'),
      data: '0x',
      operation: 0
    }
  ],
  'ipfs://Qm...'  // Metadata URI
)

// Vote
await azorius.vote(proposalId, 1) // 1 = Yes

// Execute after timelock
await azorius.executeProposal(
  proposalId,
  [treasury.address],
  [ethers.utils.parseEther('10')],
  ['0x'],
  [0]
)
```

## Rationale

### Modular Strategy Pattern

Separating voting strategies from the core governance module provides:
- **Flexibility**: DAOs can choose voting mechanisms appropriate for their needs
- **Upgradeability**: New strategies can be added without modifying core logic
- **Composability**: Strategies can be combined or customized
- **Audit Efficiency**: Each strategy can be audited independently

### Safe Module Architecture

Building Azorius as a Safe module (rather than standalone contract):
- **Security**: Inherits Safe's battle-tested execution infrastructure
- **Interoperability**: Works with existing Safe tooling (UI, APIs, integrations)
- **Treasury Protection**: Execution goes through Safe's multi-sig controls
- **Upgradability**: Modules can be swapped without changing the Safe

### Timelock Design

The timelock-before-execution pattern:
- **Attack Prevention**: Gives community time to react to malicious proposals
- **Transparency**: All pending executions are publicly visible
- **Emergency Response**: Combined with FreezeGuard enables governance pause

## Backwards Compatibility

### LP-2504 Safe Standard

Azorius is fully compatible with LP-2504:
- Implements Safe's `IModule` interface
- Executes through `execTransactionFromModule`
- Respects Safe's guard system

### LP-2506 Module System

Follows the module patterns defined in LP-2506:
- Standard initialization interface
- Compatible with module registry
- Works with other Lux modules (Fractal, FreezeGuard)

### Compound Governor Compatibility

Maintains familiar patterns from Compound Governor:
- Similar proposal states
- Compatible voting types (Against, For, Abstain)
- Comparable event signatures

## Test Cases

### Proposal Lifecycle Tests

```solidity
function test_SubmitProposal() public {
    uint32 proposalId = azorius.submitProposal(
        strategy,
        strategyData,
        transactions,
        "ipfs://metadata"
    );

    assertEq(uint(azorius.proposalState(proposalId)), uint(ProposalState.ACTIVE));
}

function test_VoteAndPass() public {
    vm.prank(voter);
    azorius.vote(proposalId, 1); // Vote yes

    // Advance past voting period
    vm.roll(block.number + votingPeriod + 1);

    assertEq(uint(azorius.proposalState(proposalId)), uint(ProposalState.TIMELOCKED));
}

function test_ExecuteAfterTimelock() public {
    // Advance past timelock
    vm.roll(block.number + timelockPeriod + 1);

    azorius.executeProposal(proposalId, targets, values, data, ops);

    assertEq(uint(azorius.proposalState(proposalId)), uint(ProposalState.EXECUTED));
}

function test_FailWithoutQuorum() public {
    // Don't vote at all
    vm.roll(block.number + votingPeriod + 1);

    assertEq(uint(azorius.proposalState(proposalId)), uint(ProposalState.FAILED));
}
```

### Strategy Tests

```solidity
function test_LinearVotingWeight() public {
    // Voter with 100 tokens
    vm.prank(voter);
    strategy.vote(proposalId, 1);

    (,uint256 yesVotes,) = strategy.getProposalVotes(proposalId);
    assertEq(yesVotes, 100 ether);
}

function test_OnlyEnabledStrategies() public {
    vm.expectRevert("Strategy not enabled");
    azorius.submitProposal(
        disabledStrategy,
        data,
        transactions,
        ""
    );
}
```

## Security Considerations

1. **Timelock**: Always use non-zero timelock for production
2. **Quorum**: Set appropriate quorum to prevent governance attacks
3. **Strategy Validation**: Only enable audited voting strategies
4. **Execution Guard**: Consider FreezeGuard for emergency pause

## Related LPs

- **LP-2504**: Safe Multisig Standard
- **LP-2520**: Lux DAO Platform
- **LP-2522**: Voting Strategies Standard
- **LP-2523**: Freeze Voting & Guard System

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
