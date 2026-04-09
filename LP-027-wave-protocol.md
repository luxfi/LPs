---
lp: 027
title: Wave Protocol
tags: [wave, consensus, propagation, gossip, latency]
description: Wave propagation protocol for sub-100ms block dissemination
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2025-02-01
requires:
  - lps-020 (Quasar Consensus)
  - lps-022 (ZAP Wire Protocol)
references:
  - lp-2200 (Wave Dissemination)
---

# LP-027: Wave Protocol

## Abstract

Wave is a structured block dissemination protocol that propagates blocks to all validators in O(log n) hops with deterministic fanout. Unlike gossip protocols that rely on random peer selection, Wave constructs a dissemination tree rooted at the block proposer, ensuring every validator receives the block within a bounded latency. Combined with ZAP wire encoding (LP-022), Wave achieves sub-100ms propagation across a 10,000-node network.

## Specification

### Dissemination Tree

For each block proposal, the proposer constructs a dissemination tree:

1. **Root**: the block proposer
2. **Fanout**: each node forwards to `F` children (default F=8)
3. **Tree depth**: `ceil(log_F(N))` where N is validator count
4. **Assignment**: children are selected by `hash(blockID || parentNodeID || childIndex) mod validatorSet`

For N=10,000 and F=8, the tree has depth 5. Every validator receives the block in at most 5 hops.

### Chunk Streaming

Large blocks are streamed in chunks rather than waiting for complete download:

1. Proposer splits block into `C` chunks (target 64 KB each)
2. Each chunk is sent independently through the tree
3. Receivers begin forwarding chunks as soon as they arrive (cut-through forwarding)
4. Total latency: `depth * per_hop_latency + serialization_time` instead of `depth * (download_time + serialization_time)`

### Redundancy

To tolerate node failures in the tree:

- Each node has `R` backup parents (default R=2) that also forward to it
- If a node does not receive a chunk within `CHUNK_TIMEOUT` (50ms), it requests from backup parents
- Backup parents are selected from non-overlapping subtrees to maximize independence

### Integration with Consensus

Wave operates between block proposal and voting:

1. Proposer creates block and Wave dissemination tree
2. Wave propagates block to all validators (sub-100ms)
3. Validators verify block and submit BLS votes (LP-020)
4. Proposer aggregates votes into QC

Wave replaces the unstructured gossip layer for block propagation. Transaction gossip continues to use random gossip (best-effort, non-critical latency).

## Security Considerations

1. **Eclipse resistance**: tree assignment is deterministic per block, preventing an attacker from positioning themselves to intercept all paths to a victim.
2. **Censorship**: a malicious tree node that drops chunks is bypassed within 50ms via backup parents.
3. **Bandwidth**: each validator forwards to F peers. Total bandwidth per block: `F * block_size`. With F=8 and 1 MB blocks, this is 8 MB outbound per block per validator.

## Reference

| Resource | Location |
|---|---|
| Wave dissemination | `github.com/luxfi/node/network/wave/` |
| ZAP framing | LP-022 |
| Consensus integration | LP-020 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
