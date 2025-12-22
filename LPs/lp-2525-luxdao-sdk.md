---
lp: 2525
title: "@luxdao/sdk TypeScript SDK"
description: TypeScript SDK for interacting with Lux DAO contracts and governance
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-12-17
requires: 2506, 2507
tags: [dao, sdk, typescript]
order: 525
---

## Abstract

This LP specifies `@luxdao/sdk`, the TypeScript SDK for interacting with Lux DAO contracts. The SDK provides type-safe interfaces for DAO creation, proposal management, voting, and governance operations.

## Motivation

A TypeScript SDK enables:

1. **Developer Experience**: Type-safe API with IntelliSense
2. **Integration**: Easy integration with web applications
3. **Abstraction**: Hide complexity of contract interactions
4. **Consistency**: Unified interface across all DAO operations
5. **Testing**: Simplified testing of DAO integrations

## Specification

### Package Location

```
@luxdao/sdk (dao/sdk/)
├── src/
│   ├── index.ts           # Package exports
│   ├── LuxDAO.ts          # Main DAO class
│   ├── Azorius.ts         # Azorius module wrapper
│   ├── Strategy.ts        # Voting strategy wrapper
│   ├── FreezeGuard.ts     # Freeze system wrapper
│   ├── Paymaster.ts       # Account abstraction
│   └── types/
│       └── index.ts       # TypeScript types
├── test/
│   └── sdk.test.ts
├── package.json
└── tsconfig.json
```

### Installation

```bash
npm install @luxdao/sdk
# or
pnpm add @luxdao/sdk
```

### Core Classes

#### LuxDAO

Main entry point for DAO interactions:

```typescript
import { LuxDAO } from '@luxdao/sdk'

interface LuxDAOConfig {
  provider: Provider
  signer?: Signer
  daoAddress: string
}

class LuxDAO {
  constructor(config: LuxDAOConfig)

  // Properties
  readonly address: string
  readonly safe: Safe
  readonly azorius: Azorius
  readonly freezeGuard?: FreezeGuard

  // DAO Info
  async getName(): Promise<string>
  async getOwners(): Promise<string[]>
  async getThreshold(): Promise<number>
  async getModules(): Promise<string[]>

  // Proposals
  async createProposal(params: CreateProposalParams): Promise<TransactionResponse>
  async getProposal(proposalId: number): Promise<Proposal>
  async getProposals(options?: ProposalQueryOptions): Promise<Proposal[]>

  // Voting
  async vote(proposalId: number, support: VoteType): Promise<TransactionResponse>
  async delegate(delegatee: string): Promise<TransactionResponse>
  async getVotingPower(address: string): Promise<BigNumber>

  // Execution
  async executeProposal(proposalId: number): Promise<TransactionResponse>
  async queueProposal(proposalId: number): Promise<TransactionResponse>

  // Treasury
  async getTreasury(): Promise<TreasuryInfo>
  async getTokenBalances(): Promise<TokenBalance[]>

  // Static factory
  static async create(params: CreateDAOParams): Promise<LuxDAO>
}
```

#### Azorius

Governance module wrapper:

```typescript
class Azorius {
  constructor(address: string, provider: Provider)

  // Proposals
  async submitProposal(
    strategy: string,
    data: string,
    transactions: Transaction[],
    metadata: string
  ): Promise<TransactionResponse>

  async getProposalState(proposalId: number): Promise<ProposalState>
  async getProposal(proposalId: number): Promise<AzoriusProposal>

  // Voting
  async vote(proposalId: number, voteType: VoteType): Promise<TransactionResponse>
  async hasVoted(proposalId: number, voter: string): Promise<boolean>
  async getProposalVotes(proposalId: number): Promise<VoteCounts>

  // Execution
  async executeProposal(
    proposalId: number,
    targets: string[],
    values: BigNumber[],
    data: string[],
    operations: Operation[]
  ): Promise<TransactionResponse>

  // Strategy management
  async enableStrategy(strategy: string): Promise<TransactionResponse>
  async disableStrategy(strategy: string): Promise<TransactionResponse>
  async isStrategyEnabled(strategy: string): Promise<boolean>
  async getStrategies(): Promise<string[]>
}
```

#### VotingStrategy

Voting strategy wrapper:

```typescript
class VotingStrategy {
  constructor(address: string, provider: Provider)

  // Info
  async getGovernanceToken(): Promise<string>
  async getQuorum(): Promise<BigNumber>
  async getVotingPeriod(): Promise<number>
  async getProposerThreshold(): Promise<BigNumber>

  // Voting
  async getVotingWeight(voter: string, proposalId: number): Promise<BigNumber>
  async isPassed(proposalId: number): Promise<boolean>
  async isProposer(address: string): Promise<boolean>
  async votingEndBlock(proposalId: number): Promise<number>
}
```

#### FreezeGuard

Freeze system wrapper:

```typescript
class FreezeGuard {
  constructor(address: string, provider: Provider)

  // State
  async isFrozen(): Promise<boolean>
  async getFrozenBlock(): Promise<number>
  async getFreezeProposalVoteCount(): Promise<BigNumber>

  // Actions
  async castFreezeVote(): Promise<TransactionResponse>
  async unfreeze(): Promise<TransactionResponse>

  // Config
  async getFreezeVotesThreshold(): Promise<BigNumber>
  async getFreezePeriod(): Promise<number>
  async getFreezeProposalPeriod(): Promise<number>
}
```

### Types

```typescript
// Proposal types
interface Proposal {
  id: number
  proposer: string
  state: ProposalState
  startBlock: number
  endBlock: number
  forVotes: BigNumber
  againstVotes: BigNumber
  abstainVotes: BigNumber
  transactions: Transaction[]
  metadata: ProposalMetadata
  createdAt: Date
  executedAt?: Date
}

enum ProposalState {
  Active = 'ACTIVE',
  Canceled = 'CANCELED',
  Timelocked = 'TIMELOCKED',
  Executable = 'EXECUTABLE',
  Executed = 'EXECUTED',
  Expired = 'EXPIRED',
  Failed = 'FAILED'
}

enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2
}

interface Transaction {
  to: string
  value: BigNumber
  data: string
  operation: Operation
}

enum Operation {
  Call = 0,
  DelegateCall = 1
}

// DAO creation
interface CreateDAOParams {
  name: string
  owners: string[]
  threshold: number
  governanceToken: string
  votingStrategy: VotingStrategyType
  timelockPeriod: number
  quorum: number
}

enum VotingStrategyType {
  LinearERC20 = 'linear-erc20',
  LinearERC721 = 'linear-erc721',
  Quadratic = 'quadratic'
}

// Treasury
interface TreasuryInfo {
  address: string
  nativeBalance: BigNumber
  tokens: TokenBalance[]
}

interface TokenBalance {
  token: string
  symbol: string
  decimals: number
  balance: BigNumber
}

// Query options
interface ProposalQueryOptions {
  state?: ProposalState
  proposer?: string
  limit?: number
  offset?: number
}
```

### Contract Factories

The SDK exports contract factories for direct contract interaction:

```typescript
export {
  ModuleAzoriusV1__factory,
  ModuleFractalV1__factory,
  VotesERC20V1__factory,
  VotesERC20StakedV1__factory,
  VotingWeightERC20V1__factory,
  VotingWeightERC721V1__factory,
  FreezeGuardAzoriusV1__factory,
  FreezeGuardMultisigV1__factory,
  FreezeVotingAzoriusV1__factory,
  PaymasterV1__factory,
  SystemDeployerV1__factory,
  KeyValuePairsV1__factory
} from './typechain-types'
```

### Usage Examples

#### Create a DAO

```typescript
import { LuxDAO, VotingStrategyType } from '@luxdao/sdk'

const dao = await LuxDAO.create({
  name: 'My DAO',
  owners: ['0x...', '0x...', '0x...'],
  threshold: 2,
  governanceToken: tokenAddress,
  votingStrategy: VotingStrategyType.LinearERC20,
  timelockPeriod: 86400, // 1 day
  quorum: 400 // 4%
})

console.log('DAO created:', dao.address)
```

#### Create and Vote on Proposal

```typescript
import { LuxDAO, VoteType } from '@luxdao/sdk'

const dao = new LuxDAO({
  provider,
  signer,
  daoAddress: '0x...'
})

// Create proposal
const tx = await dao.createProposal({
  title: 'Fund Development',
  description: 'Allocate 100 ETH for Q1 development',
  transactions: [
    {
      to: devMultisig,
      value: ethers.utils.parseEther('100'),
      data: '0x',
      operation: 0
    }
  ]
})

const receipt = await tx.wait()
const proposalId = getProposalIdFromReceipt(receipt)

// Vote
await dao.vote(proposalId, VoteType.For)

// Check status
const proposal = await dao.getProposal(proposalId)
console.log('State:', proposal.state)
console.log('For votes:', proposal.forVotes.toString())
```

#### Delegate Voting Power

```typescript
// Delegate to another address
await dao.delegate('0xDelegatee...')

// Check voting power
const power = await dao.getVotingPower(myAddress)
console.log('Voting power:', ethers.utils.formatEther(power))
```

#### Emergency Freeze

```typescript
const freezeGuard = dao.freezeGuard

// Check if frozen
const isFrozen = await freezeGuard.isFrozen()

// Cast freeze vote
await freezeGuard.castFreezeVote()

// Check vote count
const voteCount = await freezeGuard.getFreezeProposalVoteCount()
const threshold = await freezeGuard.getFreezeVotesThreshold()

console.log(`Freeze votes: ${voteCount}/${threshold}`)
```

### Testing

```bash
cd dao/sdk
pnpm test

# Output:
# ✓ LuxDAO initializes correctly
# ✓ createProposal submits proposal
# ✓ vote casts vote correctly
# ✓ getProposal returns proposal data
# ✓ delegate updates delegation
# ✓ executeProposal executes when ready
# ✓ FreezeGuard tracks freeze state
# ✓ Contract factories export correctly
```

## Rationale

### TypeScript-First Design

Choosing TypeScript provides:

1. **Type Safety**: Catch errors at compile time
2. **Developer Experience**: IntelliSense and autocomplete
3. **Documentation**: Types serve as inline documentation
4. **Ecosystem**: Wide adoption in web3 development

### Class-Based Architecture

Using classes for main components provides:

1. **Encapsulation**: Internal state management
2. **Composition**: Combine multiple contract interactions
3. **Extensibility**: Easy to subclass for custom behavior

### Factory Exports

Exporting contract factories enables:

1. **Direct Access**: Low-level contract interaction when needed
2. **Deployment**: Deploy new contract instances
3. **Custom Integration**: Build specialized tooling

## Backwards Compatibility

### ethers.js Compatibility

The SDK is built on ethers.js v6:

- Uses standard Provider and Signer interfaces
- Compatible with ethers.js utilities
- Works with any ethers.js-compatible wallet

### Web3 Provider Compatibility

Works with standard Web3 providers:

- MetaMask and injected providers
- WalletConnect
- Ledger and hardware wallets
- Any EIP-1193 provider

### Contract Version Support

Supports all Lux DAO contract versions:

- V1 contracts (current)
- Automatic version detection
- Graceful handling of missing features

## Test Cases

### SDK Tests

```typescript
describe('LuxDAO', () => {
  it('initializes with valid address', async () => {
    const dao = new LuxDAO({ provider, daoAddress });
    expect(dao.address).toBe(daoAddress);
  });

  it('fetches DAO name', async () => {
    const name = await dao.getName();
    expect(typeof name).toBe('string');
  });

  it('creates proposal', async () => {
    const tx = await dao.createProposal({
      title: 'Test',
      description: 'Test proposal',
      transactions: [{ to: target, value: 0n, data: '0x', operation: 0 }]
    });
    const receipt = await tx.wait();
    expect(receipt.status).toBe(1);
  });

  it('casts vote', async () => {
    const tx = await dao.vote(proposalId, VoteType.For);
    const receipt = await tx.wait();
    expect(receipt.status).toBe(1);
  });

  it('retrieves proposal', async () => {
    const proposal = await dao.getProposal(proposalId);
    expect(proposal.id).toBe(proposalId);
    expect(proposal.state).toBeDefined();
  });
});

describe('Azorius', () => {
  it('checks strategy enabled', async () => {
    const enabled = await azorius.isStrategyEnabled(strategyAddress);
    expect(typeof enabled).toBe('boolean');
  });

  it('gets proposal votes', async () => {
    const votes = await azorius.getProposalVotes(proposalId);
    expect(votes.forVotes).toBeInstanceOf(BigInt);
    expect(votes.againstVotes).toBeInstanceOf(BigInt);
  });
});
```

## Security Considerations

1. **Signer Security**: Never expose private keys in frontend
2. **Input Validation**: Validate all user inputs before transactions
3. **Gas Estimation**: Use proper gas estimation for transactions
4. **Error Handling**: Handle contract reverts gracefully
5. **Nonce Management**: Avoid nonce conflicts in batch operations

## Related LPs

- **LP-2520**: Lux DAO Platform
- **LP-2521**: Azorius Governance Module
- **LP-2522**: Voting Strategies Standard
- **LP-2523**: Freeze Voting & Guard System

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
