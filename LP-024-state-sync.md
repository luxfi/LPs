---
lp: 024
title: State Sync
tags: [state-sync, merkle, snapshot, sync, bootstrap]
description: Merkle-based state synchronization for fast node bootstrapping
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2020-06-01
requires:
  - lps-022 (ZAP Wire Protocol)
references:
  - lp-1300 (State Sync Protocol)
---

# LP-024: State Sync

## Abstract

State Sync allows new Lux nodes to bootstrap by downloading a recent state snapshot instead of replaying all historical blocks. The protocol transfers Merkle trie nodes in content-addressed chunks, verified against a state root committed in a finalized block. A syncing node reaches operational state in minutes rather than hours or days.

## Specification

### Snapshot Points

Validators produce state snapshots at regular intervals:

- **Snapshot frequency**: every `SNAPSHOT_INTERVAL` blocks (default 4096)
- **Snapshot content**: complete account trie, storage tries, code hashes
- **State root**: the Merkle Patricia Trie root at the snapshot block, included in the block header

### Sync Protocol

1. **Discovery**: syncing node requests the latest accepted block from peers via ZAP `Handshake`
2. **Target selection**: node selects the most recent snapshot-eligible block accepted by 2/3+ of sampled peers
3. **Chunk requests**: node traverses the trie top-down, requesting chunks by node hash

```
StateSyncRequest {
    stateRoot   [32]byte   // target state root
    startPath   []byte     // trie path prefix (empty for root)
    maxChunks   uint32     // max chunks per response (default 256)
}

StateSyncResponse {
    chunks      []TrieChunk
    proofs      [][]byte   // Merkle proofs for boundary nodes
}

TrieChunk {
    path        []byte     // trie path
    nodeHash    [32]byte   // hash of the trie node
    nodeData    []byte     // RLP-encoded trie node
}
```

4. **Verification**: each chunk is verified by hashing `nodeData` and comparing to `nodeHash`. Parent-child relationships are verified against the Merkle proof.
5. **Completion**: when all trie nodes are downloaded, the syncing node computes the state root and verifies it matches the target.

### Parallel Download

The trie is split into `P` parallel ranges (default P=16) by partitioning the key space. Each range is downloaded independently, allowing full bandwidth utilization.

### Pivot Point

After state sync completes, the node:

1. Begins processing blocks from the snapshot height forward
2. Backfills historical block headers (not full blocks) for chain verification
3. Historical block bodies are available on-demand from archive peers

### Pruning

Non-archive nodes prune state older than `STATE_RETENTION` blocks (default 65536). Only the current state and recent history are kept on disk.

## Security Considerations

1. **State root verification**: all chunks are verified against the Merkle root in a finalized block. A malicious peer cannot serve invalid state.
2. **Peer sampling**: target block selection uses 2/3+ peer agreement, preventing a minority of malicious peers from directing sync to a bad state.
3. **Incomplete sync**: if a peer disappears mid-sync, the node resumes from the last verified chunk with a different peer.

## Reference

| Resource | Location |
|---|---|
| State sync implementation | `github.com/luxfi/node/snow/engine/statesync/` |
| Merkle trie | `github.com/luxfi/evm/trie/` |
| ZAP state sync messages | LP-022 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
