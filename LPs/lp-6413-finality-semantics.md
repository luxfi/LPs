---
lp: 6413
title: LuxDA Bus Finality Semantics
description: LuxDA Bus Finality Semantics specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the finality model for LuxDA Bus, including preconfirmation, finalization, and reorg handling. Clients must understand which messages are final and how to handle reorgs.

## Motivation

Applications built on LuxDA Bus need clear finality guarantees:

1. **DeFi**: Need to know when transactions are irreversible
2. **Messaging**: Need to handle message reordering gracefully
3. **State Machines**: Need deterministic state transitions
4. **Light Clients**: Need efficient finality proofs

## Specification

### 1. Finality Model

#### 1.1 States

```
┌─────────┐    ┌──────────────┐    ┌───────────┐
│ Pending │───>│ Preconfirmed │───>│ Finalized │
└─────────┘    └──────────────┘    └───────────┘
     │               │
     │               │
     └───────────────┴─────────> Rejected
```

| State | Description | Guarantee |
|-------|-------------|-----------|
| Pending | In mempool | May never be included |
| Preconfirmed | In proposed block | May reorg |
| Finalized | Consensus finality | Irreversible |
| Rejected | Explicitly rejected | Never finalized |

#### 1.2 Finality Timing

| Network | Preconfirm Latency | Finality Latency |
|---------|-------------------|------------------|
| Mainnet | ~500ms | ~2s |
| Testnet | ~500ms | ~2s |
| Devnet | ~100ms | ~500ms |

#### 1.3 Finality Depth

For probabilistic finality chains, finality depth is configurable:

```go
type FinalityConfig struct {
    // Minimum blocks before considering finalized
    FinalityDepth uint64

    // Maximum reorg depth to track
    MaxReorgDepth uint64

    // Use deterministic finality (BFT-based)
    DeterministicFinality bool
}
```

Default (Lux Snowman):
- `DeterministicFinality: true`
- Single-slot finality after consensus

### 2. Preconfirmation

#### 2.1 Preconfirmation Sources

1. **Proposer Preconfirmation**: Proposer signs intent to include
2. **Inclusion Preconfirmation**: Header appears in proposed block
3. **Quorum Preconfirmation**: Threshold of validators attest

```go
type Preconfirmation struct {
    Type        PreconfirmationType
    HeaderHash  [32]byte
    BlockHeight uint64
    Attestation []byte
}

type PreconfirmationType uint8
const (
    ProposerPreconfirm PreconfirmationType = 1
    InclusionPreconfirm PreconfirmationType = 2
    QuorumPreconfirm PreconfirmationType = 3
)
```

#### 2.2 Preconfirmation Latency

```
t=0ms:    Header submitted to mempool
t=50ms:   Proposer receives header
t=100ms:  Proposer preconfirmation (signed promise)
t=500ms:  Inclusion preconfirmation (in proposed block)
t=2000ms: Finalization (consensus complete)
```

#### 2.3 Preconfirmation Trust Model

| Type | Trust Assumption | Slashing |
|------|------------------|----------|
| Proposer | Single validator honest | Yes |
| Inclusion | Block proposal valid | N/A |
| Quorum | 2/3 validators honest | Yes |

### 3. Finalization

#### 3.1 Finalization Condition

For Snowman consensus (Lux):

```python
def is_finalized(block):
    return block.accepted and block.confidence >= beta
```

Where:
- `accepted`: Block accepted by local validator
- `confidence`: Number of consecutive query rounds with supermajority
- `beta`: Safety threshold (typically 20)

#### 3.2 Finalization Proof

```go
type FinalizationProof struct {
    BlockHash      [32]byte
    BlockHeight    uint64
    ValidatorSet   [][32]byte     // Public keys
    Signatures     [][]byte       // Threshold signatures
    QuorumBitfield []byte         // Which validators signed
}
```

Light clients verify:
1. Validator set matches known set for epoch
2. Quorum threshold met (≥2/3)
3. Aggregate signature valid

#### 3.3 Finality Notification

Clients receive finality events:

```go
type FinalityEvent struct {
    Type        FinalityEventType
    BlockHash   [32]byte
    BlockHeight uint64
    Headers     []HeaderFinalized
}

type HeaderFinalized struct {
    NamespaceId [20]byte
    StartSeq    uint64
    EndSeq      uint64
}
```

### 4. Reorg Handling

#### 4.1 Reorg Detection

```go
type ReorgEvent struct {
    // Common ancestor
    ForkPoint uint64

    // Blocks being reverted
    RevertedBlocks []BlockHash

    // New canonical blocks
    NewBlocks []Block
}
```

#### 4.2 Client Reorg Protocol

```python
def handle_reorg(event):
    # 1. Identify affected namespaces
    affected = set()
    for block in event.reverted_blocks:
        for batch in block.lane_batches:
            affected.add(batch.namespace_id)

    # 2. Revert local state to fork point
    for ns_id in affected:
        revert_namespace_to_block(ns_id, event.fork_point)

    # 3. Apply new blocks
    for block in event.new_blocks:
        apply_block(block)

    # 4. Notify application
    emit_reorg_event(affected, event)
```

#### 4.3 Namespace-Level Reorg

Per-namespace reorg information:

```go
type NamespaceReorg struct {
    NamespaceId    [20]byte
    RevertedSeqs   []uint64    // Sequence numbers being reverted
    NewSeqs        []uint64    // New sequence numbers
    NewHeadSeq     uint64      // New last finalized seq
}
```

#### 4.4 Sequence Gap Handling

After reorg, sequences may gap:

```
Before reorg:  ... 5, 6, 7, 8
After reorg:   ... 5, 6, [gap], 9
```

Clients MUST:
- Track which sequences were finalized
- Identify sequences that were reverted
- Not assume consecutive sequence numbers

### 5. State Machine Semantics

#### 5.1 Deterministic State Transitions

For applications building state machines on namespaces:

```python
class NamespaceStateMachine:
    def __init__(self, namespace_id):
        self.ns_id = namespace_id
        self.state = initial_state()
        self.last_finalized_seq = 0
        self.pending_transitions = {}

    def on_preconfirmed(self, header):
        # Speculatively apply
        new_state = apply_transition(self.state, header)
        self.pending_transitions[header.seq] = (self.state, new_state)
        self.state = new_state

    def on_finalized(self, header):
        # Confirm transition
        if header.seq in self.pending_transitions:
            del self.pending_transitions[header.seq]
        self.last_finalized_seq = header.seq

    def on_reorg(self, reorg_event):
        # Find earliest affected sequence
        earliest = min(reorg_event.reverted_seqs)

        # Rollback to state before earliest
        for seq in sorted(self.pending_transitions.keys(), reverse=True):
            if seq >= earliest:
                old_state, _ = self.pending_transitions[seq]
                self.state = old_state
                del self.pending_transitions[seq]

        # Re-apply from new chain
        for header in reorg_event.new_headers:
            self.on_preconfirmed(header)
```

#### 5.2 Optimistic Execution

For low-latency applications:

```python
def optimistic_execute(header):
    # Execute immediately on preconfirmation
    result = execute(header)

    # Track for potential revert
    pending_results[header.seq] = result

    # Commit on finalization
    await wait_finalized(header.seq)
    commit(result)
```

### 6. Finality Gadget

#### 6.1 Finality Votes

Validators emit finality votes:

```go
type FinalityVote struct {
    Epoch        uint64
    Source       BlockHash    // Last finalized block
    Target       BlockHash    // Block being finalized
    ValidatorIdx uint32
    Signature    []byte
}
```

#### 6.2 Finality Rule

Block `B` is finalized when:
- `B.parent` is finalized, AND
- ≥2/3 validators have voted for `B` with matching source

#### 6.3 Slashing Conditions

Validators are slashed for:
- **Double Vote**: Voting for two different targets at same height
- **Surround Vote**: Vote that surrounds or is surrounded by previous vote

### 7. API

#### 7.1 Finality Status Query

```protobuf
service FinalityService {
    rpc GetFinalityStatus(FinalityStatusRequest) returns (FinalityStatusResponse);
    rpc SubscribeFinalityEvents(SubscribeRequest) returns (stream FinalityEvent);
    rpc GetReorgHistory(ReorgHistoryRequest) returns (ReorgHistoryResponse);
}

message FinalityStatusRequest {
    bytes namespace_id = 1;
    uint64 seq = 2;
}

message FinalityStatusResponse {
    enum Status {
        UNKNOWN = 0;
        PENDING = 1;
        PRECONFIRMED = 2;
        FINALIZED = 3;
        REJECTED = 4;
        REORGED = 5;
    }
    Status status = 1;
    uint64 block_height = 2;
    bytes block_hash = 3;
    optional Preconfirmation preconfirmation = 4;
    optional FinalizationProof finalization_proof = 5;
}
```

#### 7.2 Reorg Subscription

```protobuf
message ReorgEvent {
    uint64 fork_point = 1;
    repeated bytes reverted_block_hashes = 2;
    repeated Block new_blocks = 3;
    repeated NamespaceReorg namespace_reorgs = 4;
}
```

## Rationale

### Why Preconfirmation Levels?

Different applications have different latency/safety trade-offs:
- **Gaming**: Proposer preconfirm (100ms, lower safety)
- **Messaging**: Inclusion preconfirm (500ms, medium safety)
- **DeFi**: Full finality (2s, maximum safety)

### Why Per-Namespace Reorg Tracking?

- Applications only care about their namespace
- Reduces reorg event size
- Enables targeted recovery

### Why Deterministic Finality?

- Snowman provides deterministic finality
- No "confirmations" counting needed
- Simpler client logic

## Security Considerations

### Long-Range Attacks

Mitigated by:
- Validator set changes require unbonding period
- Checkpoints embedded in client
- Social consensus for deep reorgs

### Equivocation

Slashing conditions prevent:
- Voting for conflicting blocks
- Finalizing conflicting chains

### Reorg Depth Limits

Maximum reorg depth prevents:
- State explosion from tracking old forks
- Unbounded rollback attacks

## Test Plan

### Unit Tests

1. **Finality Tracking**: Track headers through pending → finalized
2. **Reorg Detection**: Detect and classify reorgs of various depths
3. **State Rollback**: Correctly rollback state machine on reorg

### Chaos Tests

1. **Network Partition**: Partition network; verify finality pauses
2. **Proposer Failure**: Kill proposers; verify liveness
3. **Deep Reorg**: Simulate deep reorg; verify recovery

### Conformance Tests

1. **Finality Proof Verification**: Verify proofs against test vectors
2. **Reorg Event Format**: Verify event serialization
3. **API Compatibility**: Test API against reference implementation

## References

- [Lux Snowman Consensus](https://docs.lux.network/learn/lux/lux-consensus)
- [Ethereum Gasper Finality](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/gasper/)
- [Tendermint BFT Finality](https://docs.tendermint.com/master/spec/consensus/consensus.html)

---

*LP-6413 v1.0.0 - 2026-01-02*
