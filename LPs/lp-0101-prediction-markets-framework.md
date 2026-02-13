---
lp: 101
title: Prediction Markets Framework
description: "Introduces the Conditional Tokens Framework (CTF) to Lux, enabling prediction markets with UMA oracle resolution."
author: Lux Core Team
status: Draft
type: Standards Track
category: LRC
created: 2025-12-31
requires:
  - 100
  - 102
---

# LP-0101: Prediction Markets Framework

## Abstract

This proposal introduces the Conditional Tokens Framework (CTF) to Lux, enabling prediction markets with UMA oracle resolution. The system allows creation of binary and multi-outcome markets where users can split collateral into outcome tokens, trade positions, and redeem winnings after resolution.

## Motivation

Prediction markets provide:
1. **Price Discovery** - Aggregate information about future events
2. **Hedging** - Protect against uncertain outcomes
3. **Speculation** - Trade on beliefs about future events
4. **Governance** - Futarchy-style decision making

The CTF + UMA combination (used by Polymarket) is the most battle-tested prediction market infrastructure.

## Specification

### Core Contracts

| Contract | Location | Purpose |
|----------|----------|---------|
| `ConditionalTokens` | `contracts/prediction/ctf/` | ERC-1155 outcome tokens |
| `CTHelpers` | `contracts/prediction/ctf/` | ID generation helpers |
| `UmaCtfAdapter` | `contracts/prediction/adapters/` | UMA oracle bridge |
| `NegRiskAdapter` | `contracts/prediction/adapters/` | Multi-outcome markets |

### Market Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PREDICTION MARKET LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. CREATION                                                             │
│     Admin calls adapter.initialize(ancillaryData, reward, bond, liveness)│
│     → Creates questionID                                                 │
│     → Prepares CTF condition (2 outcomes: YES/NO)                       │
│     → Requests price from UMA OO                                         │
│                                                                          │
│  2. TRADING                                                              │
│     Users call ctf.splitPosition(collateral, amount)                    │
│     → Receives 1 YES + 1 NO token per collateral unit                   │
│     → Trade on DEX or via CLOB                                          │
│     Users call ctf.mergePositions()                                      │
│     → Return YES + NO tokens → receive collateral                        │
│                                                                          │
│  3. RESOLUTION                                                           │
│     UMA proposer submits outcome (0=NO, 0.5=UNKNOWN, 1=YES)             │
│     → If undisputed after liveness: settles                             │
│     → If disputed: escalates to DVM voting                              │
│     Admin calls adapter.resolve(questionID)                              │
│     → Fetches price from OO                                              │
│     → Calls ctf.reportPayouts()                                          │
│                                                                          │
│  4. REDEMPTION                                                           │
│     Winners call ctf.redeemPositions()                                   │
│     → Burn winning tokens → receive collateral                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Conditional Tokens (ERC-1155)

Position tokens are ERC-1155 with deterministic IDs:

```solidity
// Condition ID
conditionId = keccak256(oracle, questionId, outcomeSlotCount)

// Collection ID (uses BN254 curve math)
collectionId = ecAdd(point(keccak256(conditionId, indexSet)), parentCollectionId)

// Position ID (ERC-1155 token ID)
positionId = keccak256(collateralToken, collectionId)
```

### Configurable Bond Amounts

Per user requirement, bonds are configurable per market:

```solidity
struct BondConfig {
    uint256 minBond;
    uint256 maxBond;
    bool customBondEnabled;
}

// Global default
mapping(bytes32 => BondConfig) public marketBondConfigs;

// Market creators can set custom bonds
function setMarketBondConfig(bytes32 questionID, uint256 minBond, uint256 maxBond) external;
```

### Multi-Outcome Markets (NegRiskAdapter)

For markets with >2 outcomes (elections, sports):

```
Market: "Who will win the 2024 election?"
├── Question 1: "Will Candidate A win?" → YES/NO tokens
├── Question 2: "Will Candidate B win?" → YES/NO tokens
└── Question 3: "Will Candidate C win?" → YES/NO tokens

Invariant: Only ONE question can resolve to YES
Conversion: 1 NO(A) + 1 NO(B) ≡ 1 USDC + 1 YES(C)
```

## Rationale

| Parameter | Value | Notes |
|-----------|-------|-------|
| Outcome Slots | 2-256 | Binary markets use 2 |
| Default Liveness | 7200s | 2 hours |
| Bond Currency | LUSD | Stablecoin |
| Min Bond | 100 LUSD | Configurable |
| Max Bond | 100,000 LUSD | Configurable |

## Backwards Compatibility

This proposal is fully backwards compatible. It introduces a new set of contracts for prediction markets that do not interfere with any existing protocols.

## Test Cases

- **Market Creation**: Verify a new prediction market can be created with specified outcomes.
- **Position Splitting/Merging**: Test that users can correctly split collateral into outcome tokens and merge them back.
- **Trading**: Simulate trading of outcome tokens on a DEX.
- **Resolution and Redemption**: Test the full lifecycle from market resolution by the oracle to the redemption of winning tokens.
- **Multi-Outcome Market**: Test the creation and resolution of a market with more than two outcomes.

## Security Considerations

1. **Conditional Token Audit**: Based on Gnosis CTF (audited)
2. **Position ID Collision**: CTHelpers uses elliptic curve math to prevent
3. **Oracle Trust**: Only designated adapter can report payouts
4. **Reentrancy**: Split/merge use checks-effects-interactions pattern

## Cross-Chain Support

Markets can be created on Zoo/Hanzo chains via Warp messaging (see LP-0103):

```
C-Chain (Hub)              Zoo Chain (Spoke)
┌─────────────┐            ┌─────────────┐
│ WarpMarket  │◄──Warp────►│ WarpMarket  │
│ Hub         │  Messaging │ Spoke       │
└─────────────┘            └─────────────┘
```

## Implementation

Contracts in `~/work/lux/standard/contracts/prediction/`:
- `ctf/ConditionalTokens.sol` - ERC-1155 outcome tokens
- `ctf/CTHelpers.sol` - Helper library
- `adapters/UmaCtfAdapter.sol` - UMA bridge
- `libraries/AncillaryDataLib.sol` - Data encoding
- `libraries/PayoutHelperLib.sol` - Payout validation

## References

- [Polymarket Conditional Tokens Audit](../research/polymarket/AuditReport-ConditionalTokens.md)
- [LP-0100: Optimistic Oracle Integration](./lp-0100-optimistic-oracle-integration.md)
- [LP-0102: Oracle Dispute Resolution](./lp-0102-oracle-dispute-resolution.md)
