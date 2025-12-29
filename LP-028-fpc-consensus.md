---
lp: 028
title: Fast Probabilistic Consensus
tags: [fpc, consensus, probabilistic, voting, byzantine]
description: Fast Probabilistic Consensus protocol for rapid binary agreement
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2025-01-01
requires:
  - lps-020 (Quasar Consensus)
references:
  - lp-1600 (FPC Protocol)
---

# LP-028: Fast Probabilistic Consensus

## Abstract

Fast Probabilistic Consensus (FPC) is a binary agreement protocol used by Lux for rapid conflict resolution. Given a binary decision (accept/reject a transaction, prefer block A or B), validators repeatedly sample random peers and adopt the majority opinion with a confidence threshold. FPC converges to agreement in O(log log n) rounds under Byzantine conditions, making it the fastest known probabilistic consensus protocol for binary decisions.

## Specification

### Protocol

Each validator maintains a local opinion `o_i` in {0, 1} and a confidence counter `c_i`:

```
Round r:
  1. Sample k random validators (default k=21)
  2. Query each for their current opinion
  3. Count majority: m = count of opinions matching the most common value
  4. If m/k >= alpha (default alpha=0.67):
     - Set o_i = majority value
     - Increment c_i
  5. Else:
     - Set o_i = random(0, 1)  // coin flip on ambiguity
     - Reset c_i = 0
  6. If c_i >= L (default L=10):
     - Finalize: opinion is decided
```

### Parameterization

| Parameter | Default | Description |
|---|---|---|
| k | 21 | Sample size per round |
| alpha | 0.67 | Confidence threshold |
| L | 10 | Consecutive rounds for finality |
| maxRounds | 100 | Abort threshold |

### Convergence

Under the assumption that Byzantine nodes control less than 1/3 of stake:

- **Expected rounds to convergence**: O(log log n) where n is the number of validators
- **Practical convergence**: 3-8 rounds for networks up to 10,000 validators
- **Time**: at 100ms per round, finality in 300-800ms

### Application in Lux

FPC is used as a sub-protocol within Quasar (LP-020):

1. **Transaction conflict resolution**: when two conflicting transactions are observed, FPC decides which is accepted
2. **Vertex preference**: in the X-chain DAG, FPC resolves conflicting vertices
3. **Ringtail fallback**: when BLS quorum stalls, Ringtail uses FPC-style sampling for leader election

FPC is NOT used for block finality (that is BLS quorum in Quasar). FPC handles binary decisions within the consensus pipeline.

### Random Beacon

The coin flip in step 5 uses a verifiable random beacon derived from the previous round's aggregate BLS signature. This prevents an adversary from biasing the coin:

```
coin = H(aggSig(round - 1) || validatorID || round) mod 2
```

## Security Considerations

1. **1/3 Byzantine threshold**: FPC provides safety and liveness with up to 1/3 Byzantine validators. Above 1/3, the protocol may not converge.
2. **Adaptive adversary**: the random beacon prevents an adaptive adversary from knowing the coin outcome before choosing their strategy.
3. **Network synchrony**: FPC assumes partial synchrony. Under full asynchrony, rounds may time out, extending convergence but not breaking safety.

## Reference

| Resource | Location |
|---|---|
| FPC implementation | `github.com/luxfi/node/snow/consensus/fpc/` |
| Quasar integration | LP-020 |
| Random beacon | `github.com/luxfi/node/snow/consensus/beacon/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
