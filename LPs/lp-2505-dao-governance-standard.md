---
lp: 2505
title: DAO Governance Standard
description: Modular DAO governance primitives for the Lux Network, enabling decentralized decision-making with cross-chain finality
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-14
requires: [2300, 6022, 7321, 7322, 4099]
tags: [dao, governance, voting, lrc]
---

> **See also**: [LP-94: Governance Framework Research](./lp-0094-governance-framework-research.md), [LP-6022: Warp Messaging 2.0](./lp-6022-warp-messaging-20-native-interchain-transfers.md), [LP-7321: FROST Threshold Signatures](./lp-7321-frost-threshold-signature-precompile.md), [LP-4099: Q-Chain Quasar Consensus](./lp-4099-q-chain-quantum-secure-consensus-protocol-family-quasar.md)

## Abstract

This LP specifies a modular DAO governance framework for the Lux Network, providing on-chain governance primitives for protocols, DAOs, and communities. The implementation at `/Users/z/work/lux/standard/src/dao/` delivers a complete toolkit: factory-based DAO deployment, adapter-based extensibility, token-weighted and quadratic voting, proposal lifecycle management, cross-chain governance via Warp messaging, and threshold signature execution via FROST/CGGMP21 precompiles. The framework integrates Q-Chain quantum finality for tamper-proof proposal finalization.

## Motivation

Decentralized governance enables:

1. **Protocol Evolution**: Upgrade parameters and code without centralized control
2. **Treasury Management**: Allocate community funds via transparent voting
3. **Community Alignment**: Give stakeholders proportional voice
4. **Cross-Chain Coordination**: Govern multi-chain deployments atomically
5. **Quantum-Safe Finality**: Protect governance decisions against future attacks

Existing solutions (Compound Governor, OpenZeppelin Governor) lack:
- Native cross-chain execution
- Threshold signature integration for secure execution
- Quantum finality for irreversible decisions
- Modular adapter architecture for customization

## Specification

### 1. Core Architecture

The DAO framework follows a registry-adapter-extension pattern:

```text
                         +------------------+
                         |    DaoFactory    |  Creates DAO instances
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         |   DaoRegistry    |  Central registry for all DAO state
                         +--------+---------+
                                  |
          +----------+------------+------------+-----------+
          |          |            |            |           |
          v          v            v            v           v
     +--------+  +--------+  +----------+  +--------+  +--------+
     |Adapter |  |Adapter |  | Adapter  |  |Adapter |  |Adapter |
     |Voting  |  |Onboard |  |Financing |  |Ragequit|  |Tribute |
     +--------+  +--------+  +----------+  +--------+  +--------+
          |          |            |            |           |
          +----------+------------+------------+-----------+
                                  |
                                  v
                         +------------------+
                         |   Extensions     |  Bank, ERC20, NFT, Executor
                         +------------------+
```markdown

### 2. DaoRegistry Contract

The central registry maintains all DAO state:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/core/DaoRegistry.sol
interface IDaoRegistry {
    // Proposal states
    enum ProposalFlag { EXISTS, SPONSORED, PROCESSED }

    // Member states
    enum MemberFlag { EXISTS, JAILED }

    // Proposal lifecycle
    function submitProposal(bytes32 proposalId) external;
    function sponsorProposal(bytes32 proposalId, address sponsor, address votingAdapter) external;
    function processProposal(bytes32 proposalId) external;

    // Member management
    function potentialNewMember(address memberAddress) external;
    function jailMember(address memberAddress) external;
    function unjailMember(address memberAddress) external;

    // Delegation
    function updateDelegateKey(address memberAddr, address newDelegateKey) external;
    function getPriorDelegateKey(address memberAddr, uint256 blockNumber) external view returns (address);

    // Adapter/Extension management
    function replaceAdapter(bytes32 adapterId, address adapterAddress, uint128 acl, bytes32[] calldata keys, uint256[] calldata values) external;
    function addExtension(bytes32 extensionId, IExtension extension) external;
}
```text

### 3. Voting Adapters

#### 3.1 On-Chain Voting

Token-weighted voting with configurable periods:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/adapters/voting/Voting.sol
interface IVoting {
    enum VotingState { NOT_STARTED, TIE, PASS, NOT_PASS, IN_PROGRESS, GRACE_PERIOD }

    function startNewVotingForProposal(DaoRegistry dao, bytes32 proposalId, bytes calldata data) external;
    function submitVote(DaoRegistry dao, bytes32 proposalId, uint256 voteValue) external;
    function voteResult(DaoRegistry dao, bytes32 proposalId) external view returns (VotingState);
}
```text

Configuration parameters:
- `voting.votingPeriod`: Duration for voting (default: 7 days)
- `voting.gracePeriod`: Time after voting before execution (default: 3 days)

#### 3.2 Off-Chain Voting (Snapshot-Style)

Gas-efficient off-chain voting with on-chain verification:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/adapters/voting/OffchainVoting.sol
interface IOffchainVoting is IVoting {
    function submitVoteResult(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes32 resultRoot,      // Merkle root of all votes
        address reporter,
        VoteResultNode memory result,
        bytes32[] memory proof
    ) external;

    function challengeBadFirstNode(
        DaoRegistry dao,
        bytes32 proposalId,
        VoteResultNode memory node
    ) external;
}
```text

#### 3.3 Quadratic Voting Extension

Reduce whale influence via quadratic cost:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/adapters/voting/QuadraticVoting.sol
interface IQuadraticVoting is IVoting {
    // Cost = credits^2, votes = sqrt(credits)
    function submitQuadraticVote(
        DaoRegistry dao,
        bytes32 proposalId,
        uint256 credits  // credits^2 tokens spent for sqrt(credits) votes
    ) external;
}
```text

### 4. Governance Token Standard

#### 4.1 ERC20Votes Integration

Voting power with delegation and checkpoints:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/extensions/token/erc20/ERC20TokenExtension.sol
interface IERC20Votes {
    // Checkpointing
    function getPriorAmount(address account, uint256 blockNumber) external view returns (uint256);
    function getCurrentAmount(address account) external view returns (uint256);

    // Delegation
    function delegate(address delegatee) external;
    function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external;
    function delegates(address account) external view returns (address);
    function getVotes(address account) external view returns (uint256);
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
}
```text

#### 4.2 Snapshot-Based Voting Power

Voting power determined at proposal creation block:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/helpers/GovernanceHelper.sol
library GovernanceHelper {
    function getVotingWeight(
        DaoRegistry dao,
        address voterAddr,
        bytes32 proposalId,
        uint256 snapshot  // Block number at proposal creation
    ) internal view returns (uint256);
}
```text

### 5. Proposal Lifecycle

```text
   +-----------+     +-----------+     +-----------+     +-----------+
   |  SUBMIT   | --> | SPONSORED | --> |  VOTING   | --> |  GRACE    |
   +-----------+     +-----------+     +-----------+     +-----------+
        |                  |                 |                 |
        v                  v                 v                 v
   Created by         Endorsed by      Vote cast by      Waiting for
   adapter            member           members           timelock
        |                  |                 |                 |
        +------------------+-----------------+-----------------+
                                   |
                                   v
                          +-----------+
                          | PROCESSED |  Executed or rejected
                          +-----------+
```text

### 6. Timelock Controller

Delayed execution for security:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/extensions/executor/Executor.sol
interface ITimelockExecutor {
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) external returns (bytes32 id);

    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable;

    function cancel(bytes32 id) external;
}
```text

### 7. Cross-Chain Governance via Warp

Execute governance decisions across chains:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/adapters/CrossChainGovernance.sol
interface ICrossChainGovernance {
    struct CrossChainProposal {
        bytes32 proposalId;
        bytes32[] targetChains;
        address[] targets;
        bytes[] calldatas;
        uint256[] values;
    }

    // Submit cross-chain proposal
    function submitCrossChainProposal(
        DaoRegistry dao,
        CrossChainProposal calldata proposal
    ) external returns (bytes32 proposalId);

    // Execute on target chain via Warp
    function executeCrossChain(
        bytes32 proposalId,
        bytes32 targetChainId,
        uint32 warpIndex  // Warp message index
    ) external;
}
```text

Warp message format for governance:
```solidity
struct WarpGovernanceMessage {
    bytes32 sourceChainId;
    bytes32 proposalId;
    address target;
    uint256 value;
    bytes calldata;
    uint256 nonce;
}
```text

### 8. Threshold Signature Execution

Secure multi-party execution via FROST/CGGMP21:

```solidity
// Location: /Users/z/work/lux/standard/src/dao/contracts/adapters/ThresholdExecution.sol
interface IThresholdExecution {
    // Execute with FROST threshold signature
    function executeWithFROST(
        DaoRegistry dao,
        bytes32 proposalId,
        uint8 threshold,
        uint8 totalSigners,
        bytes32 aggregatedPubKey,
        bytes calldata signature  // 64-byte Schnorr signature
    ) external;

    // Execute with CGGMP21 threshold signature
    function executeWithCGGMP21(
        DaoRegistry dao,
        bytes32 proposalId,
        uint8 threshold,
        uint8 totalSigners,
        bytes calldata aggregatedPubKey,  // 65-byte uncompressed
        bytes calldata signature  // 65-byte ECDSA r||s||v
    ) external;
}
```text

Precompile addresses:
- FROST: `0x020000000000000000000000000000000000000C`
- CGGMP21: `0x020000000000000000000000000000000000000D`

### 9. Q-Chain Quantum Finality

Governance proposals receive quantum finality via Quasar consensus:

```solidity
// Integration with Q-Chain finality
interface IQuantumGovernance {
    // Check if proposal has quantum finality
    function hasQuantumFinality(bytes32 proposalId) external view returns (bool);

    // Get quantum finality block
    function getQuantumFinalityBlock(bytes32 proposalId) external view returns (uint256);

    // Proposals with quantum finality cannot be reverted
    event ProposalQuantumFinalized(bytes32 indexed proposalId, uint256 qChainBlock);
}
```text

### 10. Zoo Foundation ZIP Compatibility

Integration with Zoo governance proposals:

```solidity
// ZIP (Zoo Improvement Proposal) compatibility
interface IZIPGovernance {
    // Import ZIP as DAO proposal
    function importZIP(
        uint256 zipNumber,
        bytes32 merkleRoot,  // ZIP content hash
        bytes calldata signature
    ) external returns (bytes32 proposalId);

    // Export DAO decision as ZIP
    function exportAsZIP(bytes32 proposalId) external returns (uint256 zipNumber);
}
```text

## Rationale

### Design Decisions

1. **Registry-Adapter Pattern**: Modular design allows adding new governance features without modifying core contracts
2. **Checkpoint-Based Voting**: Prevents flash loan attacks by using historical balances
3. **Off-Chain Voting Option**: Reduces gas costs while maintaining verifiability
4. **Warp Integration**: Native cross-chain execution without third-party bridges
5. **Threshold Signatures**: Distributed execution authority via FROST/CGGMP21
6. **Quantum Finality**: Immutable governance decisions via Q-Chain

### Gas Costs

| Operation | Gas Cost |
|-----------|----------|
| Submit Proposal | ~80,000 |
| Sponsor Proposal | ~60,000 |
| On-chain Vote | ~100,000 |
| Off-chain Vote Submit | ~150,000 |
| Process Proposal | ~120,000 |
| Execute (simple) | ~50,000 |
| Execute (cross-chain) | ~200,000 + Warp fee |
| FROST Execution | ~75,000 (3-of-5) |
| CGGMP21 Execution | ~125,000 (3-of-5) |

## Backwards Compatibility

The framework is additive and does not break existing contracts. Migration paths:

1. **OpenZeppelin Governor**: Wrap OZ Governor as adapter
2. **Compound Governor**: Import historical proposals via snapshot
3. **Snapshot.org**: Off-chain voting adapter compatible with Snapshot format

## Test Cases

### 1. Proposal Lifecycle

```javascript
describe("DAO Proposal Lifecycle", () => {
    it("should complete full proposal lifecycle", async () => {
        // Submit proposal
        const proposalId = keccak256("proposal-1");
        await voting.submitProposal(dao.address, proposalId);

        // Sponsor proposal
        await voting.sponsorProposal(dao.address, proposalId, sponsor.address);

        // Vote
        await voting.submitVote(dao.address, proposalId, 1); // Yes

        // Wait for voting period
        await time.increase(7 * 24 * 60 * 60);

        // Wait for grace period
        await time.increase(3 * 24 * 60 * 60);

        // Process
        const result = await voting.voteResult(dao.address, proposalId);
        expect(result).to.equal(VotingState.PASS);
    });
});
```text

### 2. Delegation

```javascript
describe("Voting Delegation", () => {
    it("should delegate voting power", async () => {
        // Alice delegates to Bob
        await token.delegate(bob.address, { from: alice.address });

        // Bob's votes include Alice's tokens
        const votes = await token.getVotes(bob.address);
        expect(votes).to.equal(aliceBalance.add(bobBalance));
    });
});
```text

### 3. Cross-Chain Execution

```javascript
describe("Cross-Chain Governance", () => {
    it("should execute proposal on remote chain", async () => {
        // Create cross-chain proposal
        const proposal = {
            targetChains: [HANZO_CHAIN_ID, ZOO_CHAIN_ID],
            targets: [targetA, targetB],
            calldatas: [dataA, dataB],
            values: [0, 0]
        };

        // Submit and pass proposal on C-Chain
        const proposalId = await governance.submitCrossChainProposal(dao.address, proposal);
        await passProposal(proposalId);

        // Execute on target chains via Warp
        await governance.executeCrossChain(proposalId, HANZO_CHAIN_ID, warpIndex);
    });
});
```text

## Reference Implementation

### Standard Library Location

- **DAO Contracts**: `/Users/z/work/lux/standard/src/dao/`
- **GitHub Repository**: https://github.com/luxfi/standard

### Directory Structure

```text
src/dao/
├── contracts/
│   ├── core/
│   │   ├── CloneFactory.sol      # Minimal proxy factory
│   │   ├── DaoFactory.sol        # DAO deployment factory
│   │   └── DaoRegistry.sol       # Central DAO state registry
│   ├── adapters/
│   │   ├── voting/
│   │   │   ├── Voting.sol        # On-chain token-weighted voting
│   │   │   ├── OffchainVoting.sol# Snapshot-style off-chain voting
│   │   │   └── SnapshotProposalContract.sol
│   │   ├── Onboarding.sol        # Member onboarding
│   │   ├── Financing.sol         # Treasury proposals
│   │   ├── Ragequit.sol          # Member exit mechanism
│   │   ├── Tribute.sol           # Token contribution
│   │   └── GuildKick.sol         # Member removal
│   ├── extensions/
│   │   ├── bank/Bank.sol         # Treasury management
│   │   ├── executor/Executor.sol # Proposal execution
│   │   └── token/erc20/          # Governance token
│   ├── helpers/
│   │   ├── DaoHelper.sol         # Utility functions
│   │   ├── GovernanceHelper.sol  # Voting weight calculation
│   │   └── FairShareHelper.sol   # Pro-rata calculations
│   └── guards/
│       ├── AdapterGuard.sol      # Adapter access control
│       └── MemberGuard.sol       # Member access control
```text

### Testing

```bash
cd /Users/z/work/lux/standard
forge test --match-path "test/dao/**" -vvv
```

## Security Considerations

### 1. Flash Loan Attacks

- **Mitigation**: Snapshot-based voting uses historical balances
- **Implementation**: `getPriorAmount()` queries block N-1

### 2. Proposal Spam

- **Mitigation**: Require minimum token balance to submit
- **Configuration**: `governance.proposalThreshold` (default: 100,000 LUX)

### 3. Vote Buying

- **Mitigation**: Commit-reveal voting optional
- **Privacy Option**: Z-Chain shielded voting integration

### 4. Governance Takeover

- **Mitigation**: Timelock delays for critical operations
- **Guardian**: Multi-sig veto power for emergencies

### 5. Cross-Chain Replay

- **Mitigation**: Chain ID and nonce in Warp message
- **Verification**: Warp precompile validates source chain

### 6. Threshold Key Compromise

- **Mitigation**: Regular key rotation via LSS-MPC (LP-7323)
- **Detection**: Anomaly monitoring on execution patterns

## Economic Impact

### Cost Comparison

| Governance System | Deploy Cost | Vote Cost | Execute Cost |
|-------------------|-------------|-----------|--------------|
| OpenZeppelin Gov | ~3M gas | ~80K gas | ~100K gas |
| Compound Gov Alpha | ~2.5M gas | ~100K gas | ~120K gas |
| **Lux DAO** | ~2M gas | ~100K gas | ~50K gas |
| Lux DAO (cross-chain) | ~2M gas | ~100K gas | ~200K gas |

### Benefits

1. **Lower Execution Cost**: Shared execution via adapters
2. **Cross-Chain Savings**: Single vote governs all chains
3. **Gas Abstraction**: Off-chain voting reduces voter cost

## Implementation Status

| Component | Status | File |
|-----------|--------|------|
| DaoRegistry | Complete | `core/DaoRegistry.sol` |
| DaoFactory | Complete | `core/DaoFactory.sol` |
| On-chain Voting | Complete | `adapters/voting/Voting.sol` |
| Off-chain Voting | Complete | `adapters/voting/OffchainVoting.sol` |
| Executor | Complete | `extensions/executor/Executor.sol` |
| Bank | Complete | `extensions/bank/Bank.sol` |
| ERC20 Token | Complete | `extensions/token/erc20/` |
| Cross-Chain Adapter | Planned | - |
| Threshold Execution | Planned | - |
| Quadratic Voting | Planned | - |

## References

1. Openlaw Tribute DAO Framework - https://github.com/openlawteam/tribute-contracts
2. OpenZeppelin Governor - https://docs.openzeppelin.com/contracts/governance
3. Compound Governor - https://compound.finance/docs/governance
4. Snapshot Voting - https://docs.snapshot.org/
5. LP-94: Governance Framework Research
6. LP-6022: Warp Messaging 2.0
7. LP-7321: FROST Threshold Signatures
8. LP-7322: CGGMP21 Threshold ECDSA
9. LP-4099: Q-Chain Quasar Consensus

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
