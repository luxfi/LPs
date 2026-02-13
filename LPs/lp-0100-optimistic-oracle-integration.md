---
lp: 100
title: Optimistic Oracle Integration
description: "Introduces UMA's Optimistic Oracle (OO) system to the Lux blockchain, providing dispute-backed price assertions."
author: Lux Core Team
status: Draft
type: Standards Track
category: Interface
created: 2025-12-31
requires:
  - 101
---

# LP-0100: Optimistic Oracle Integration

## Abstract

This proposal introduces UMA's Optimistic Oracle (OO) system to the Lux blockchain, providing dispute-backed price assertions for prediction markets, governance, and oracle dispute resolution. The integration leverages Lux's native G-Chain GraphQL (no external subgraph needed) and uses DLUX as the voting token for DVM disputes.

## Motivation

Current oracle systems on Lux (Chainlink, Pyth, DEX TWAP) provide real-time price feeds but lack a mechanism for:

1.  **Human-readable data assertions** - Questions like "Did Team X win the championship?"
2.  **Economic dispute resolution** - Bond-backed assertions with escalation to token voting
3.  **Prediction market resolution** - Binary/multi-outcome market settlement

UMA's Optimistic Oracle fills these gaps with a battle-tested dispute mechanism used by Polymarket and other major protocols.

## Specification

### Core Contracts

| Contract | Location | Purpose |
|----------|----------|---------|
| `OptimisticOracleV3` | `contracts/uma/optimistic-oracle/` | Core assertion/dispute engine |
| `Finder` | `contracts/uma/registry/` | Service locator for DVM components |
| `Store` | `contracts/uma/registry/` | Oracle fee management |
| `Registry` | `contracts/uma/registry/` | Contract registration |
| `IdentifierWhitelist` | `contracts/uma/registry/` | Approved query types |

### Assertion Flow

```
1. Asserter calls assertTruth(claim, bond) → assertionId
2. Liveness period begins (default: 2 hours)
3. If no dispute → assertion settles as TRUE
4. If disputed → escalates to DVM voting (DLUX holders)
5. Result stored on-chain, callbacks triggered
```

### Integration with Existing Oracle

UMA becomes source #5 in `Oracle.sol` via `UMAOracleAdapter`:

```solidity
// Oracle source priority
1. DEX Precompile (0x0400) - Real-time pool prices
2. Chainlink - Established feeds
3. Pyth - Low-latency feeds
4. TWAP - AMM time-weighted
5. UMA Optimistic - Dispute-backed prices (NEW)
```

### DVM Voting

When assertions are disputed, DLUX holders vote to resolve:

- **Voting Token**: DLUX (existing governance token)
- **Voting Period**: 48-72 hours
- **Quorum**: 5% of staked DLUX
- **Slashing**: Incorrect voters lose portion of stake

### Native GraphQL (No Subgraph)

Lux's G-Chain precompile (0x0500) provides native indexing:

```graphql
type Query {
  assertion(id: ID!): Assertion
  assertions(status: AssertionStatus): [Assertion!]!
}

type Assertion {
  id: ID!
  asserter: String!
  claim: String!
  bond: BigInt!
  expirationTime: BigInt!
  settled: Boolean!
  truthValue: Boolean
}
```

## Rationale

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Default Liveness | 7200 seconds (2 hours) | Balance speed vs security |
| Burned Bond % | 50% | Incentivize correct assertions |
| Min Bond | Configurable per market | Flexibility for different use cases |
| DVM Voting Period | 48 hours | Allow global participation |

## Backwards Compatibility

This LP is fully backwards compatible. It introduces a new, optional oracle system and does not alter any existing oracle integrations or core protocol behavior. Existing applications that do not integrate with the Optimistic Oracle will be unaffected.

## Test Cases

- **Assertion and Settlement**: A test case where an assertion is made and settles correctly after the liveness period without a dispute.
- **Dispute and Voting**: A test case where an assertion is disputed, voting occurs, and the dispute is resolved correctly based on the vote outcome.
- **Slashing**: A test case to verify that incorrect voters are slashed as expected.
- **GraphQL Interface**: A test case to query assertions and their statuses via the G-Chain GraphQL interface.

## Security Considerations

1.  **Economic Security**: Bond requirements deter spam; slashing punishes incorrect votes
2.  **Time-locked Resolution**: 2-hour liveness prevents same-block manipulation
3.  **DVM Fallback**: Human judgment for ambiguous cases
4.  **Circuit Breakers**: Integration with existing Oracle.sol protections

## Implementation

Contracts deployed to `~/work/lux/standard/contracts/uma/`:
- `optimistic-oracle/OptimisticOracleV3.sol`
- `optimistic-oracle/interfaces/IOptimisticOracleV3.sol`
- `registry/Finder.sol`
- `registry/Store.sol`
- `registry/Registry.sol`
- `registry/IdentifierWhitelist.sol`

## References

- [UMA Whitepaper](../research/uma/UMA-whitepaper.pdf)
- [UMA DVM Oracle Whitepaper](../research/uma/UMA-DVM-oracle-whitepaper.pdf)
- [UMIPs](../research/uma/umips/)
- [LP-0101: Prediction Markets Framework](./lp-0101-prediction-markets-framework.md)
