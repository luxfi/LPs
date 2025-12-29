---
lps: 050
title: Intent Router
tags: [intent, router, rfq, solver, limit-order, defi]
description: Intent-based trading with limit orders, RFQ, and solver network
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2025-12-01
requires:
  - lps-040 (AMM V2)
  - lps-041 (AMM V3)
references:
  - lp-10200 (Intent Router Specification)
---

# LPS-050: Intent Router

## Abstract

The Intent Router enables intent-based trading on Lux. Users sign an off-chain intent specifying what they want to trade and their minimum acceptable output. Solvers compete to fill the intent, sourcing liquidity from AMMs, private market makers, or their own inventory. The protocol ensures users always receive at least their specified minimum through on-chain settlement verification.

## Specification

### Intent Format

```
Intent {
    maker       address     // user signing the intent
    inputToken  address
    outputToken address
    inputAmount uint256     // exact amount to sell
    minOutput   uint256     // minimum acceptable output
    deadline    uint256     // expiry timestamp
    nonce       uint256     // replay protection
    signature   bytes       // EIP-712 signature
}
```

Intents are broadcast off-chain to the solver network. They are not on-chain transactions until filled.

### Solver Network

Solvers are registered participants who fill intents:

- **Registration**: stake 100 LUX to become a solver
- **Discovery**: solvers subscribe to an intent mempool (off-chain P2P network)
- **Competition**: first solver to submit a valid fill transaction wins
- **Sources**: solvers can route through AMM V2/V3, StableSwap, private OTC, or own inventory

### Fill Execution

A solver submits a fill transaction:

```solidity
function fill(Intent calldata intent, bytes calldata solverData) external {
    // 1. Verify intent signature
    // 2. Transfer inputToken from maker to solver (via permit2)
    // 3. Execute solver's routing strategy (solverData)
    // 4. Verify outputToken received by maker >= minOutput
    // 5. Solver keeps any surplus (profit)
}
```

The contract guarantees `maker` receives at least `minOutput`. The solver captures the difference as profit.

### Limit Orders

A limit order is an intent with a specific price:

```
minOutput = inputAmount * limitPrice
deadline = goodTilCancelled ? type(uint256).max : specificTime
```

Solvers monitor limit orders and fill them when the market price crosses the limit.

### RFQ (Request for Quote)

For large trades, makers can request private quotes:

1. Maker broadcasts RFQ to selected market makers
2. Market makers respond with signed quotes (off-chain)
3. Maker selects best quote and submits settlement transaction
4. Settlement is atomic -- quote is either fully filled or reverted

### Fee Structure

| Fee | Rate | Recipient |
|---|---|---|
| Protocol fee | 0.01% of input | Treasury |
| Solver profit | variable (market-determined) | Solver |
| Gas | paid by solver | Network |

Solvers pay gas, incentivizing them to optimize routing for gas efficiency.

## Security Considerations

1. **MEV protection**: intents are signed off-chain and filled atomically. Solvers compete on output, not on transaction ordering.
2. **Solver collusion**: multiple solvers must be active to ensure competitive pricing. Monopoly risk exists if solver count is low.
3. **Permit2 approval**: users grant approval once to the Permit2 contract, reducing per-trade approval transactions.

## Reference

| Resource | Location |
|---|---|
| Intent router contracts | `github.com/luxfi/standard/contracts/intent/` |
| Router | `IntentRouter.sol` |
| Permit2 | `github.com/luxfi/standard/contracts/permit2/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
