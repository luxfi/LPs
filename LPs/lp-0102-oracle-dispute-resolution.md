---
lp: 102
title: Oracle Dispute Resolution for Perpetuals
description: "Introduces UMA-based price dispute resolution for Lux's GMX-style perpetuals."
author: Lux Core Team
status: Draft
type: Standards Track
category: Interface
created: 2025-12-31
requires:
  - 100
---

# LP-0102: Oracle Dispute Resolution for Perpetuals

## Abstract

This proposal introduces UMA-based price dispute resolution for Lux's GMX-style perpetuals. The system allows users to challenge FastPriceFeed prices with bonded assertions, providing economic security against oracle manipulation while maintaining low-latency trading.

## Motivation

GMX-style perpetuals rely on keeper-updated FastPriceFeed for low-latency execution. While this provides excellent UX, it creates potential attack vectors:

1.  **Keeper Collusion** - Malicious keepers reporting incorrect prices
2.  **Price Manipulation** - Coordinated attacks during low liquidity
3.  **Liquidation Hunting** - Artificial price spikes to liquidate positions
4.  **MEV Extraction** - Front-running price updates

UMA's dispute mechanism provides an economic backstop without sacrificing latency for normal operations.

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERPS DISPUTE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Normal Flow (No Dispute):                                               │
│  FastPriceFeed → VaultPriceFeed → Vault → Execution                     │
│                                                                          │
│  Dispute Flow:                                                           │
│  1. User notices incorrect price                                         │
│  2. Calls PerpsDisputeAdapter.disputePrice(token, claimedPrice, bond)   │
│  3. UMA assertion created with ancillary data                            │
│  4. If undisputed → price was correct, disputer loses bond              │
│  5. If disputed → escalates to DVM                                       │
│  6. If DVM rules price was wrong → circuit breaker triggered            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### PerpsDisputeAdapter Contract

```solidity
contract PerpsDisputeAdapter is IOptimisticRequester {
    // Core functions
    function disputePrice(
        address token,
        uint256 claimedPrice,
        uint256 bond
    ) external returns (bytes32 disputeId);

    function settleDispute(bytes32 disputeId) external;

    // UMA callbacks
    function priceProposed(...) external;
    function priceDisputed(...) external;
    function priceSettled(...) external;

    // Circuit breaker
    function triggerCircuitBreaker(address token) internal;
    function resetCircuitBreaker(address token) external;
}
```

### Configurable Bonds

Per-token bond configuration:

```solidity
struct TokenBondConfig {
    uint256 minBond;
    uint256 maxBond;
    bool isConfigured;
}

mapping(address => TokenBondConfig) public tokenBondConfigs;
```

### Circuit Breaker Integration

When a dispute resolves in favor of the disputer (price was incorrect):

1.  **Trading Pause** - New positions blocked for affected token
2.  **Liquidation Pause** - Liquidations frozen during investigation
3.  **Position Review** - Affected positions flagged for manual review
4.  **Auto-Reset** - Circuit breaker lifts after configured duration

### UMA Integration

The dispute creates a UMA price request with ancillary data:

```
Token: 0x...
Disputed Price: $3,400.00
Claimed Correct Price: $3,500.00
Timestamp: 1704067200
FastPriceFeed Address: 0x...
```

DVM voters verify the claimed price against external sources (Chainlink, exchange APIs, etc.).

## Rationale

| Parameter | Value | Notes |
|-----------|-------|-------|
| Default Bond | 1,000 LUSD | Configurable per token |
| Liveness | 2 hours | Time to dispute |
| Circuit Breaker Threshold | 500 bps (5%) | Price deviation to pause |
| Circuit Breaker Duration | 1 hour | Auto-reset after |

## Backwards Compatibility

This LP is backwards compatible. It introduces an optional dispute mechanism that does not alter the core functionality of the perpetuals protocol for users who do not engage with it.

## Test Cases

- **Successful Dispute**: A user successfully disputes a price, triggers the circuit breaker, and receives the bond.
- **Failed Dispute**: A user's dispute is successfully challenged, and the user loses their bond.
- **Circuit Breaker**: Test that the circuit breaker correctly pauses and resumes trading and liquidations.
- **Gas and Performance**: Benchmark the gas costs for dispute and settlement operations.

## Security Considerations

1.  **Bond Requirements** - Deters frivolous disputes
2.  **Liveness Period** - Gives time for legitimate challenges
3.  **DVM Backstop** - Human judgment for ambiguous cases
4.  **Circuit Breaker** - Limits damage from confirmed manipulation

### Attack Mitigation

| Attack | Mitigation |
|--------|------------|
| Spam Disputes | Bond forfeited if dispute fails |
| Keeper Collusion | Economic incentive to dispute |
| Flash Loan Manipulation | Time-locked resolution |
| DVM Vote Buying | DLUX staking + slashing |

## Implementation

Contracts in `~/work/lux/standard/contracts/perps/oracle/`:
- `PerpsDisputeAdapter.sol` - Main dispute contract
- `interfaces/IPerpsDisputeAdapter.sol` - Interface

Integration points:
- `FastPriceFeed.sol` - Add dispute hook
- `Vault.sol` - Circuit breaker integration
- `VaultPriceFeed.sol` - Fallback price source

## NOT Suitable For

UMA disputes are **NOT** intended for:
- Real-time price feeds (too slow)
- High-frequency liquidations
- Normal trading operations

Use cases are limited to:
- Post-hoc price verification
- Manipulation detection
- Economic security backstop

## References

- [LP-0100: Optimistic Oracle Integration](./lp-0100-optimistic-oracle-integration.md)
- [GMX Perps Architecture](../../standard/contracts/perps/)
- [UMA DVM Whitepaper](../research/uma/UMA-DVM-oracle-whitepaper.pdf)
