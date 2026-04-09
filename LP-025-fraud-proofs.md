---
lp: 025
title: Fraud Proofs
tags: [fraud-proofs, interactive, dispute, verification, optimistic]
description: Interactive fraud proof game for optimistic execution verification
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2020-07-01
requires:
  - lps-023 (Data Availability)
references:
  - lp-1400 (Fraud Proof Protocol)
---

# LP-025: Fraud Proofs

## Abstract

Lux fraud proofs enable optimistic execution verification through an interactive bisection game. An asserter posts a state commitment for a batch of transactions. If a challenger disagrees, they engage in a binary search over execution steps to isolate the single disputed instruction. An on-chain referee contract verifies that one instruction in a MIPS/RISC-V emulator, resolving the dispute with O(log n) on-chain interactions for n execution steps.

## Specification

### Assertion

An asserter posts a state commitment:

```
Assertion {
    batchIndex      uint64     // which transaction batch
    preStateRoot    [32]byte   // state root before batch execution
    postStateRoot   [32]byte   // claimed state root after execution
    numSteps        uint64     // total VM execution steps
    bond            uint256    // stake posted (forfeited if wrong)
}
```

The assertion enters a `CHALLENGE_WINDOW` (default 7 days) during which any party can challenge.

### Bisection Game

If challenged, the asserter and challenger engage in interactive bisection:

1. Challenger posts `ChallengeAssertion` referencing the disputed assertion
2. Both parties iteratively bisect the execution trace:
   - Asserter provides midpoint state hash at step `n/2`
   - Challenger indicates which half they dispute
   - Repeat until a single step is isolated
3. Total rounds: `ceil(log2(numSteps))` -- typically 40-50 rounds for 10^12 steps

### One-Step Proof

The isolated step is verified on-chain by executing a single instruction in a minimal VM emulator:

```
OneStepProof {
    preState    MemoryProof   // Merkle proof of memory/registers before step
    instruction []byte        // the single instruction to execute
    postState   [32]byte      // claimed state after instruction
}
```

The referee contract executes the instruction against `preState` and compares the result to `postState`. If they differ, the asserter is slashed. If they match, the challenger is slashed.

### Bonds and Incentives

- **Assertion bond**: 1000 LUX (returned if unchallenged or if asserter wins)
- **Challenge bond**: 1000 LUX (returned if challenger wins)
- **Timeout**: each bisection round has a `MOVE_TIMEOUT` (1 hour). If a party fails to respond, they forfeit.
- **Reward**: the winner receives the loser's bond minus gas costs

### Application

Fraud proofs apply to:

1. **Optimistic rollups**: L2 chains posting state roots to Lux L1
2. **DA fraud proofs**: proving incorrect erasure coding (LP-023)
3. **Cross-chain disputes**: verifying Warp message correctness (LP-021)

## Security Considerations

1. **Liveness assumption**: at least one honest party must monitor assertions and challenge fraud within the window.
2. **Delay attack**: a malicious asserter can delay finality by up to `CHALLENGE_WINDOW + (log2(steps) * MOVE_TIMEOUT)`. Bond requirements make this expensive.
3. **Referee correctness**: the on-chain instruction emulator must be equivalent to the off-chain VM. Formal verification of the emulator is recommended.

## Reference

| Resource | Location |
|---|---|
| Fraud proof contracts | `github.com/luxfi/standard/contracts/fraud/` |
| VM emulator | `github.com/luxfi/node/fraud/emulator/` |
| DA fraud proofs | LP-023 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
