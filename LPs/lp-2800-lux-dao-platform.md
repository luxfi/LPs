---
lp: 2800
title: Lux DAO Platform (lux.vote)
description: Decentralized governance platform for creating and managing DAOs on Lux Network
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-17
requires: 2504
tags: [dao, governance, platform]
order: 2800
---

## Abstract

This LP specifies the Lux DAO Platform, a comprehensive decentralized governance solution deployed at lux.vote. The platform enables creation, management, and participation in DAOs on Lux Network, featuring modular governance modules (Azorius, Fractal), multiple voting strategies, freeze protection, account abstraction, and cross-chain governance capabilities.

## Motivation

A unified DAO platform provides:

1. **Accessible Governance**: User-friendly interface for DAO participation
2. **Modular Architecture**: Plug-and-play governance modules
3. **Security**: Built-in freeze guards and emergency controls
4. **Flexibility**: Multiple voting strategies (ERC20, ERC721, staked)
5. **Interoperability**: Cross-chain governance via Warp messaging

## Specification

### Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        lux.vote Frontend                         │
│                    (React + Vite + Chakra UI)                    │
├─────────────────────────────────────────────────────────────────┤
│                         API Backend                              │
│                    (Node.js + Express)                           │
├─────────────────────────────────────────────────────────────────┤
│                        @luxdao/sdk                               │
│                    (TypeScript SDK)                              │
├─────────────────────────────────────────────────────────────────┤
│                      Smart Contracts                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Azorius  │  │ Fractal  │  │ Freeze   │  │ Voting   │        │
│  │ Module   │  │ Module   │  │ Guard    │  │Strategy  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                      Infrastructure                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Subgraph │  │PostgreSQL│  │  Redis   │  │   IPFS   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Repository Structure

```
github.com/luxfi/dao/
├── app/                    # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Route pages
│   │   ├── providers/      # Context providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # State management (Zustand)
│   │   └── graphql/        # GraphQL queries
│   └── public/             # Static assets
│
├── api/                    # Backend API server
│   └── src/
│
├── sdk/                    # @luxdao/sdk TypeScript SDK
│   └── src/
│
├── contracts/              # Smart contracts (Hardhat)
│   └── contracts/
│       ├── deployables/    # Deployable contracts
│       ├── singletons/     # Singleton contracts
│       ├── services/       # Service contracts
│       └── interfaces/     # Contract interfaces
│
├── subgraph/               # Graph Protocol indexing
│   ├── schema.graphql
│   └── src/
│
└── e2e/                    # Playwright E2E tests
```

### Core Components

#### 1. Smart Contracts

| Contract | Path | Purpose |
|----------|------|---------|
| **ModuleAzoriusV1** | `deployables/modules/` | Primary governance module |
| **ModuleFractalV1** | `deployables/modules/` | Hierarchical governance |
| **VotesERC20V1** | `deployables/erc20/` | Voting token |
| **VotesERC20StakedV1** | `deployables/erc20/` | Staked voting token |
| **FreezeGuardAzoriusV1** | `deployables/freeze-guard/` | Emergency freeze |
| **FreezeVotingAzoriusV1** | `deployables/freeze-voting/` | Freeze proposal voting |
| **StrategyV1** | `deployables/strategies/` | Base voting strategy |
| **PaymasterV1** | `deployables/account-abstraction/` | Gas sponsorship |
| **SystemDeployerV1** | `singletons/` | DAO factory |
| **KeyValuePairsV1** | `singletons/` | On-chain metadata |

#### 2. Frontend Features

- **DAO Creation Wizard**: Step-by-step DAO deployment
- **Proposal Management**: Create, vote, execute proposals
- **Treasury View**: Multi-sig treasury management
- **Member Management**: Role-based access control
- **Delegation**: Vote delegation interface
- **Analytics**: Governance metrics and insights

#### 3. SDK (@luxdao/sdk)

See LP-2525 for full SDK specification.

```typescript
import { LuxDAO } from '@luxdao/sdk'

const dao = new LuxDAO({
  provider,
  daoAddress: '0x...'
})

// Create proposal
await dao.createProposal({
  title: 'Treasury Allocation',
  description: '...',
  actions: [...]
})

// Vote
await dao.vote(proposalId, VoteType.For)
```

### Network Configuration

| Network | Chain ID | Status |
|---------|----------|--------|
| Lux Mainnet | 7777 | Production |
| Lux Testnet | 8888 | Staging |
| Ethereum | 1 | Supported |
| Polygon | 137 | Supported |
| Base | 8453 | Supported |
| Localhost | 1337 | Development |

### API Endpoints

```
GET  /api/v1/daos                    # List DAOs
GET  /api/v1/daos/:address           # DAO details
GET  /api/v1/daos/:address/proposals # DAO proposals
POST /api/v1/daos/:address/proposals # Create proposal
GET  /api/v1/users/:address/daos     # User's DAOs
GET  /api/v1/search?q=               # Search DAOs
```

## Development

### Local Setup

```bash
cd ~/work/lux/dao

# Install dependencies
make install

# Start local development (Anvil + services)
make up

# Deploy contracts locally
make deploy-local

# Run frontend
cd app && pnpm dev

# Run tests
make test
```

### Docker Development

```bash
# Full stack with Docker Compose
make up-docker

# Services:
# - Anvil blockchain (port 8545)
# - Frontend app (port 3000)
# - API backend (port 4000)
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - IPFS (port 8080/5001)
```

### Testing

```bash
# Contract tests
cd contracts && npx hardhat test

# E2E tests
pnpm test:e2e

# SDK tests
cd sdk && pnpm test
```

## Rationale

### Modular Architecture

The platform uses a modular architecture to support diverse governance needs:
- **Azorius Module**: Standard proposal-based governance for most DAOs
- **Fractal Module**: Hierarchical governance for complex organizations with sub-DAOs
- **Pluggable Strategies**: Separate voting logic from governance logic

### Safe Integration

Building on Safe (Gnosis Safe) provides:
- Battle-tested multi-sig infrastructure
- Existing security audits and ecosystem
- Compatibility with existing Safe tools and extensions

### On-Chain Metadata

KeyValuePairs contract stores DAO metadata on-chain rather than relying solely on IPFS, ensuring:
- Permanent, verifiable metadata
- No dependency on centralized gateways
- Direct smart contract queries for configuration

## Backwards Compatibility

### LP-2504 Safe Standard

The DAO Platform is fully compatible with LP-2504:
- All treasuries deploy as Safe multi-sigs
- Module system uses Safe's `enableModule` pattern
- Guard system compatible with Safe's guard interface

### Existing DAOs

DAOs created before this specification can:
- Continue operating without modification
- Upgrade to new modules via Safe transaction
- Add freeze guards retroactively

### ERC Standards

Full compatibility with:
- ERC-20 for governance tokens
- ERC-721 for NFT-based voting
- ERC-4337 for account abstraction

## Test Cases

### Smart Contract Tests

```solidity
// Test proposal creation
function test_CreateProposal() public {
    vm.prank(proposer);
    uint256 proposalId = azorius.submitProposal(
        targets,
        values,
        calldatas,
        description
    );
    assertEq(azorius.state(proposalId), ProposalState.Active);
}

// Test voting
function test_CastVote() public {
    vm.prank(voter);
    azorius.castVote(proposalId, VoteType.For);
    (uint256 forVotes,,) = azorius.proposalVotes(proposalId);
    assertEq(forVotes, voterWeight);
}

// Test freeze guard
function test_FreezeExecution() public {
    freezeGuard.freeze();
    vm.expectRevert("Governance frozen");
    azorius.execute(proposalId);
}
```

### E2E Tests

```typescript
test('DAO creation flow', async ({ page }) => {
  await page.goto('/create');
  await page.fill('[name="daoName"]', 'Test DAO');
  await page.click('button:has-text("Deploy")');
  await expect(page.locator('.dao-address')).toBeVisible();
});
```

## Security Considerations

1. **Multi-sig Treasury**: All treasuries use Safe multi-sig
2. **Freeze Guards**: Emergency governance pause capability
3. **Timelock**: Configurable execution delay
4. **Access Control**: Role-based permissions via Hats Protocol
5. **Audit Status**: Contracts audited by [TBD]

## Related LPs

- **LP-2504**: Safe Multisig Standard
- **LP-2521**: Azorius Governance Module
- **LP-2522**: Voting Strategies Standard
- **LP-2523**: Freeze Voting & Guard System
- **LP-2524**: DAO Account Abstraction
- **LP-2525**: @luxdao/sdk TypeScript SDK

## References

1. Compound Governor: https://docs.compound.finance/v2/governance/
2. OpenZeppelin Governor: https://docs.openzeppelin.com/contracts/governance
3. Safe (Gnosis Safe): https://docs.safe.global/
4. Hats Protocol: https://docs.hatsprotocol.xyz/

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
