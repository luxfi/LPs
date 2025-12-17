---
lp: 2522
title: Voting Strategies Standard
description: Modular voting strategy contracts for Lux DAO governance
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-17
requires: 2507
tags: [dao, governance, voting, strategies]
---

## Abstract

This LP specifies the voting strategy contracts used by Lux DAOs. Strategies define how votes are weighted, who can propose, and how voting power is calculated. The modular design allows DAOs to choose or create custom voting mechanisms.

## Motivation

Modular voting strategies enable:

1. **Flexibility**: Different voting mechanisms per DAO
2. **Fairness**: Quadratic voting to reduce plutocracy
3. **Composability**: Combine multiple token types
4. **Customization**: DAO-specific voting rules

## Specification

### Strategy Interface

```solidity
// Base interface for all voting strategies
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

### Available Strategies

#### 1. VotingWeightERC20V1

Token-weighted voting (1 token = 1 vote).

```solidity
// Location: contracts/contracts/strategies/voting-weight/VotingWeightERC20V1.sol

interface IVotingWeightERC20V1 {
    function governanceToken() external view returns (address);
    function quorumNumerator() external view returns (uint256);
    function quorumDenominator() external view returns (uint256);
    function votingPeriod() external view returns (uint256);

    function getVotingWeight(address _voter, uint32 _proposalId) external view returns (uint256);
}
```

**Configuration**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `governanceToken` | address | ERC20 voting token |
| `quorumNumerator` | uint256 | Quorum numerator (e.g., 400 = 4%) |
| `quorumDenominator` | uint256 | Quorum denominator (10000) |
| `votingPeriod` | uint256 | Voting duration in blocks |
| `proposerThreshold` | uint256 | Min tokens to propose |

#### 2. VotingWeightERC721V1

NFT-weighted voting (1 NFT = 1 vote).

```solidity
// Location: contracts/contracts/strategies/voting-weight/VotingWeightERC721V1.sol

interface IVotingWeightERC721V1 {
    function governanceToken() external view returns (address);
    function getVotingWeight(address _voter, uint32 _proposalId) external view returns (uint256);
}
```

#### 3. Vote Trackers

Track votes for different token types:

```solidity
// ERC20 vote tracking
// Location: contracts/contracts/strategies/vote-trackers/VoteTrackerERC20V1.sol
interface IVoteTrackerERC20V1 {
    function trackVote(address _voter, uint32 _proposalId, uint8 _voteType) external;
    function getVoteWeight(address _voter, uint32 _proposalId) external view returns (uint256);
}

// ERC721 vote tracking
// Location: contracts/contracts/strategies/vote-trackers/VoteTrackerERC721V1.sol
interface IVoteTrackerERC721V1 {
    function trackVote(address _voter, uint32 _proposalId, uint8 _voteType, uint256[] calldata _tokenIds) external;
}
```

#### 4. Proposer Adapters

Control who can create proposals:

```solidity
// ERC20 proposer adapter
// Location: contracts/contracts/strategies/proposer-adapters/ProposerAdapterERC20V1.sol
interface IProposerAdapterERC20V1 {
    function proposerThreshold() external view returns (uint256);
    function isProposer(address _address) external view returns (bool);
}

// ERC721 proposer adapter
// Location: contracts/contracts/strategies/proposer-adapters/ProposerAdapterERC721V1.sol
interface IProposerAdapterERC721V1 {
    function minTokensToPropose() external view returns (uint256);
    function isProposer(address _address) external view returns (bool);
}

// Hats proposer adapter (role-based)
// Location: contracts/contracts/strategies/proposer-adapters/ProposerAdapterHatsV1.sol
interface IProposerAdapterHatsV1 {
    function proposerHatId() external view returns (uint256);
    function isProposer(address _address) external view returns (bool);
}
```

### File Structure

```text
contracts/contracts/strategies/
├── StrategyV1.sol                           # Base strategy
├── voting-weight/
│   ├── VotingWeightERC20V1.sol              # ERC20 weighted
│   └── VotingWeightERC721V1.sol             # ERC721 weighted
├── vote-trackers/
│   ├── VoteTrackerERC20V1.sol               # ERC20 tracking
│   └── VoteTrackerERC721V1.sol              # ERC721 tracking
└── proposer-adapters/
    ├── ProposerAdapterERC20V1.sol           # Token threshold
    ├── ProposerAdapterERC721V1.sol          # NFT threshold
    └── ProposerAdapterHatsV1.sol            # Role-based (Hats)
```

### Voting Token Contracts

```solidity
// Standard ERC20 with voting
// Location: contracts/contracts/erc20/VotesERC20V1.sol
interface IVotesERC20V1 {
    function delegate(address delegatee) external;
    function delegates(address account) external view returns (address);
    function getVotes(address account) external view returns (uint256);
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
}

// Staked ERC20 with voting
// Location: contracts/contracts/erc20/VotesERC20StakedV1.sol
interface IVotesERC20StakedV1 {
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function stakedBalance(address account) external view returns (uint256);
}
```

### Vote Types

```solidity
enum VoteType {
    Against,    // 0
    For,        // 1
    Abstain     // 2
}
```

### Quorum Calculation

```solidity
function quorum(uint32 _proposalId) public view returns (uint256) {
    uint256 snapshotBlock = proposals[_proposalId].voteStartBlock;
    uint256 totalSupply = governanceToken.getPastTotalSupply(snapshotBlock);
    return (totalSupply * quorumNumerator) / quorumDenominator;
}

function isPassed(uint32 _proposalId) public view returns (bool) {
    (uint256 noVotes, uint256 yesVotes, uint256 abstainVotes) = getProposalVotes(_proposalId);
    uint256 totalVotes = noVotes + yesVotes + abstainVotes;

    // Check quorum
    if (totalVotes < quorum(_proposalId)) return false;

    // Simple majority
    return yesVotes > noVotes;
}
```

## Usage Example

```typescript
import { VotingWeightERC20V1__factory } from '@luxdao/sdk'

// Deploy voting strategy
const strategy = await VotingWeightERC20V1__factory.deploy(
  governanceToken.address,
  400,      // 4% quorum
  10000,    // denominator
  50400,    // ~7 days voting period
  ethers.utils.parseEther('1000')  // 1000 tokens to propose
)

// Enable strategy on Azorius
await azorius.enableStrategy(strategy.address)
```

## Security Considerations

1. **Snapshot Voting**: Use block snapshots to prevent flash loan attacks
2. **Delegation**: Implement delegation securely with checkpoints
3. **Quorum**: Set appropriate quorum to prevent minority takeover
4. **Proposer Threshold**: Prevent spam proposals with token threshold

## Related LPs

- **LP-2521**: Azorius Governance Module
- **LP-2520**: Lux DAO Platform

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
