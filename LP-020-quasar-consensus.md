---
lp: 020
title: Quasar Consensus
tags: [consensus, bls, ringtail, hybrid, finality, liveness]
description: Hybrid BLS+Ringtail consensus combining deterministic finality with probabilistic liveness
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2022-06-01
requires:
  - lps-015 (Validator Key Management)
references:
  - lp-1000 (Lux Consensus)
  - lp-1100 (Quasar Upgrade)
---

# LP-020: Quasar Consensus

## Abstract

Quasar is Lux Network's hybrid consensus protocol that combines BLS aggregate signatures for deterministic finality with the Ringtail sub-protocol for probabilistic liveness. Validators produce BLS-signed votes on proposed blocks. When a 2/3+ weighted quorum is reached, the block achieves deterministic finality in a single round. If quorum stalls, Ringtail leader rotation ensures liveness by switching to a probabilistic Snow-family protocol that converges in O(log n) rounds.

## Specification

### BLS Finality Layer

Validators sign block proposals using BLS12-381 keys registered at stake time (LP-015). The proposer aggregates signatures into a single 48-byte aggregate:

- **Quorum threshold**: 2/3 + 1 of total stake weight
- **Signature scheme**: BLS12-381 with proof-of-possession (PoP) to prevent rogue key attacks
- **Aggregation**: proposer collects individual signatures, produces `AggregateSignature(sigs...)` and `AggregatePublicKey(pks...)`
- **Verification**: single pairing check `e(aggSig, G2) == e(H(msg), aggPK)`

A block with a valid quorum certificate (QC) is final. No rollbacks, no reorgs.

### Ringtail Liveness Layer

When BLS quorum cannot be reached within `QUORUM_TIMEOUT` (default 2 seconds):

1. Ringtail activates with a rotating leader schedule derived from `VRF(epoch, round)`
2. The leader proposes a block; validators sample `k` peers (default k=20) and query their preference
3. Each validator flips its preference toward the sampled majority with confidence threshold `alpha` (default 0.8)
4. Convergence occurs in O(log n) rounds with probabilistic finality `1 - 2^(-confidence)`
5. Once Ringtail converges, the agreed block is re-submitted for BLS aggregation to produce a deterministic QC

### Epoch and Rotation

- **Epoch length**: 1000 blocks (configurable via governance)
- **Leader selection**: weighted VRF proportional to stake
- **View change**: if leader fails to propose within `PROPOSE_TIMEOUT` (500ms), the next leader in VRF order takes over
- **Penalty**: validators missing >10% of epochs in a window lose 0.1% of stake (slashing)

### Performance

| Metric | Value |
|---|---|
| Finality (happy path) | <500ms (single BLS round) |
| Finality (Ringtail fallback) | 1-3 seconds |
| Throughput | 10,000+ TPS per chain |
| Validator set | up to 10,000 validators |

## Security Considerations

1. **BLS rogue key attack**: mitigated by requiring proof-of-possession at validator registration (LP-015)
2. **33% Byzantine threshold**: standard BFT assumption; Ringtail provides graceful degradation under network partitions
3. **Long-range attacks**: prevented by finalized QCs -- checkpoints are embedded in block headers

## Reference

| Resource | Location |
|---|---|
| Consensus implementation | `github.com/luxfi/node/snow/consensus/quasar/` |
| BLS key management | LP-015 |
| Validator staking | `github.com/luxfi/node/vms/platformvm/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
