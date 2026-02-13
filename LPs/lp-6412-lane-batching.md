---
lp: 6412
title: LuxDA Bus Lane Batching
description: LuxDA Bus Lane Batching specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines how multiple namespace lanes are batched into blocks for consensus. The design enables parallel processing of independent namespaces without head-of-line blocking while maintaining verifiable inclusion proofs.

## Motivation

Efficient block construction must:

1. Batch headers from multiple namespaces into single blocks
2. Avoid head-of-line blocking between unrelated namespaces
3. Enable compact inclusion proofs for light clients
4. Support parallel validation of independent lanes
5. Scale horizontally as namespace count grows

## Specification

### 1. Block Structure

#### 1.1 Logical Structure

```go
type LuxDABlock struct {
    Header     BlockHeader
    LaneBatches []LaneBatch
}

type BlockHeader struct {
    Version        uint8
    Height         uint64
    Timestamp      uint64
    ParentHash     [32]byte
    StateRoot      [32]byte
    LaneBatchRoot  [32]byte  // Merkle root of all lane batches
    ProposerSig    []byte
}

type LaneBatch struct {
    NamespaceId    [20]byte
    Headers        []MsgHeader
    BatchRoot      [32]byte  // Merkle root of headers in this batch
    StartSeq       uint64
    EndSeq         uint64
}
```

#### 1.2 Wire Format

```
LuxDABlockV1 := {
    // Block Header (fixed size)
    version:       uint8     [1 byte]
    height:        uint64    [8 bytes]
    timestamp:     uint64    [8 bytes]
    parentHash:    bytes32   [32 bytes]
    stateRoot:     bytes32   [32 bytes]
    laneBatchRoot: bytes32   [32 bytes]
    proposerSigLen: uint16   [2 bytes]
    proposerSig:   bytes     [proposerSigLen bytes]

    // Lane Batches
    numBatches:    uint32    [4 bytes]
    batches:       []LaneBatchV1  [variable]
}

LaneBatchV1 := {
    namespaceId:   bytes20   [20 bytes]
    startSeq:      uint64    [8 bytes]
    endSeq:        uint64    [8 bytes]
    batchRoot:     bytes32   [32 bytes]
    numHeaders:    uint32    [4 bytes]
    headers:       []MsgHeaderV1  [variable]
}
```

### 2. Lane Merkle Tree

#### 2.1 Per-Lane Batch Root

Headers within a lane batch form a Merkle tree:

```
              BatchRoot
              /       \
        H(h1,h2)    H(h3,h4)
        /    \      /    \
      h1     h2    h3    h4
```

Where `h_i = SHA3-256(CanonicalEncode(header_i))`.

#### 2.2 Cross-Lane Batch Root

Lane batches form a Merkle tree:

```
              LaneBatchRoot
              /           \
       H(lb1,lb2)      H(lb3,lb4)
       /      \        /      \
     lb1     lb2     lb3     lb4
```

Where `lb_i = SHA3-256(namespaceId || batchRoot || startSeq || endSeq)`.

#### 2.3 Empty Lane Handling

- Lanes with no messages in this block are omitted
- Lane ordering is lexicographic by `namespaceId`
- Padding for power-of-2 tree uses zero-hashes

### 3. Inclusion Proofs

#### 3.1 Header Inclusion Proof

To prove header `h` is in block `B`:

```go
type HeaderInclusionProof struct {
    Header       MsgHeader
    LaneIndex    uint32
    HeaderIndex  uint32
    LanePath     [][]byte  // Merkle path within lane
    CrossPath    [][]byte  // Merkle path to LaneBatchRoot
    BlockHeight  uint64
    BlockHash    [32]byte
}
```

Verification:

```python
def verify_header_inclusion(proof, block_hash):
    # Verify header -> batch root
    header_hash = sha3_256(canonical_encode(proof.header))
    batch_root = compute_merkle_root(
        header_hash,
        proof.header_index,
        proof.lane_path
    )

    # Verify batch -> lane batch root
    lane_leaf = sha3_256(
        proof.header.namespace_id ||
        batch_root ||
        proof.start_seq || proof.end_seq
    )
    lane_batch_root = compute_merkle_root(
        lane_leaf,
        proof.lane_index,
        proof.cross_path
    )

    # Verify lane batch root matches block
    return block_hash == compute_block_hash(
        ..., lane_batch_root, ...
    )
```

#### 3.2 Namespace Proof

To prove all headers for namespace `ns` in block `B`:

```go
type NamespaceProof struct {
    NamespaceId  [20]byte
    LaneBatch    LaneBatch      // All headers for this namespace
    CrossPath    [][]byte       // Merkle path to LaneBatchRoot
    BlockHeight  uint64
    BlockHash    [32]byte
}
```

#### 3.3 Absence Proof

To prove namespace `ns` has no headers in block `B`:

```go
type AbsenceProof struct {
    NamespaceId      [20]byte
    LeftNeighbor     [20]byte   // Largest ns_id < target (if exists)
    RightNeighbor    [20]byte   // Smallest ns_id > target (if exists)
    LeftPath         [][]byte
    RightPath        [][]byte
    BlockHeight      uint64
    BlockHash        [32]byte
}
```

### 4. Block Construction

#### 4.1 Proposer Algorithm

```python
def construct_block(pending_headers, prev_block):
    block = LuxDABlock()
    block.header.height = prev_block.header.height + 1
    block.header.parent_hash = hash(prev_block)
    block.header.timestamp = current_time()

    # Group headers by namespace
    lanes = defaultdict(list)
    for header in pending_headers:
        lanes[header.namespace_id].append(header)

    # Sort headers within each lane by seq
    for ns_id, headers in lanes.items():
        headers.sort(key=lambda h: h.seq)

        # Validate sequence continuity
        expected_seq = get_last_seq(ns_id) + 1
        for h in headers:
            if h.seq != expected_seq:
                # Gap or duplicate - skip
                continue
            expected_seq += 1

        # Create lane batch
        batch = LaneBatch(
            namespace_id=ns_id,
            headers=valid_headers,
            start_seq=valid_headers[0].seq,
            end_seq=valid_headers[-1].seq,
        )
        batch.batch_root = compute_merkle_root([hash(h) for h in headers])
        block.lane_batches.append(batch)

    # Sort batches by namespace ID
    block.lane_batches.sort(key=lambda b: b.namespace_id)

    # Compute lane batch root
    block.header.lane_batch_root = compute_lane_batch_root(block.lane_batches)

    return block
```

#### 4.2 Parallel Validation

Validators can validate lanes in parallel:

```python
def validate_block_parallel(block, prev_state):
    # Validate block header
    if not validate_block_header(block.header, prev_state):
        return False

    # Validate each lane in parallel
    with ThreadPool() as pool:
        results = pool.map(
            lambda batch: validate_lane_batch(batch, prev_state),
            block.lane_batches
        )

    if not all(results):
        return False

    # Verify lane batch root
    expected_root = compute_lane_batch_root(block.lane_batches)
    if block.header.lane_batch_root != expected_root:
        return False

    return True
```

### 5. Block Limits

| Limit | Value | Description |
|-------|-------|-------------|
| MaxLanesPerBlock | 1024 | Maximum namespaces per block |
| MaxHeadersPerLane | 256 | Maximum headers per namespace per block |
| MaxHeadersPerBlock | 4096 | Total headers per block |
| MaxBlockSize | 16 MiB | Total serialized block size |
| TargetBlockTime | 500ms | Target block interval |

### 6. State Transitions

#### 6.1 Per-Block State Update

```go
type NamespaceState struct {
    LastSeq       uint64
    LastTimestamp uint64
    LastBlockHeight uint64
}

func ApplyBlock(block *LuxDABlock, state *State) error {
    for _, batch := range block.LaneBatches {
        ns := state.GetNamespace(batch.NamespaceId)

        // Verify sequence continuity
        if batch.StartSeq != ns.LastSeq + 1 {
            return ErrSequenceGap
        }

        // Update state
        ns.LastSeq = batch.EndSeq
        ns.LastTimestamp = batch.Headers[len(batch.Headers)-1].Timestamp
        ns.LastBlockHeight = block.Header.Height

        state.SetNamespace(batch.NamespaceId, ns)
    }

    return nil
}
```

#### 6.2 State Root Computation

```
stateRoot = MerkleRoot([
    for ns in sorted(all_namespaces):
        SHA3-256(ns.id || ns.lastSeq || ns.lastTimestamp)
])
```

### 7. Compression

#### 7.1 Header Compression

For lanes with many headers, use delta encoding:

```
CompressedLaneBatch := {
    namespaceId: bytes20
    baseHeader:  MsgHeaderV1      // First header, full
    deltas:      []HeaderDelta    // Subsequent headers, delta-encoded
}

HeaderDelta := {
    seqDelta:       int8   // Usually +1
    timestampDelta: int32  // Milliseconds since prev
    blobCommitment: bytes32
    blobLen:        uint32
    signatureLen:   uint16
    signature:      bytes
}
```

#### 7.2 Decompression

```python
def decompress_lane(compressed):
    headers = [compressed.base_header]
    prev = compressed.base_header

    for delta in compressed.deltas:
        header = MsgHeader(
            namespace_id=prev.namespace_id,
            seq=prev.seq + delta.seq_delta,
            timestamp=prev.timestamp + delta.timestamp_delta,
            blob_commitment=delta.blob_commitment,
            blob_len=delta.blob_len,
            policy_hash=prev.policy_hash,  # Inherited
            sender_pub_key=prev.sender_pub_key,  # May differ
            signature=delta.signature,
        )
        headers.append(header)
        prev = header

    return headers
```

## Rationale

### Why Per-Lane Batching?

- Enables parallel validation without coordination
- Reduces proof sizes for namespace-specific queries
- Allows lane-specific rate limiting and prioritization
- Supports future lane-based sharding

### Why Lexicographic Ordering?

- Deterministic ordering for all validators
- Enables efficient absence proofs
- Supports binary search for namespace lookup

### Why Merkle Trees?

- Compact inclusion proofs (O(log n))
- Compatible with light clients
- Standard, well-understood construction

## Backwards Compatibility

This LP defines the V1 block structure for the LuxDA Bus. As this is a new component of the Lux ecosystem, it does not introduce any breaking changes to existing chains or protocols. Future upgrades to the block structure will be managed through a versioning system in the block header, ensuring that nodes can gracefully handle transitions.

## Security Considerations

### Fork Choice

Block validity requires:
- Valid proposer signature
- Valid lane batch root
- Valid parent hash
- Valid state root

Invalid blocks are rejected regardless of proposer stake.

### Censorship Resistance

- Proposers must include pending valid headers
- Lane-level rate limits prevent single namespace DOS
- Rotation of proposers ensures liveness

### Proof Validity

Inclusion proofs are cryptographically bound to:
- Specific block hash
- Specific block height
- Merkle root chain

Forged proofs require breaking SHA3-256.

## Test Plan

### Unit Tests

1. **Merkle Root**: Compute root; verify against known vectors
2. **Inclusion Proof**: Generate and verify proofs for random positions
3. **Absence Proof**: Verify proofs for non-existent namespaces

### Integration Tests

1. **Block Construction**: Build blocks with multiple lanes; verify structure
2. **Parallel Validation**: Validate blocks with parallel lane processing
3. **State Transitions**: Apply sequence of blocks; verify state

### Stress Tests

1. **Max Lanes**: Block with 1024 lanes
2. **Max Headers**: Block with 4096 headers
3. **Max Size**: Block at 16 MiB limit

## References

- [Celestia: Namespace Merkle Tree](https://celestia.org/glossary/namespace-merkle-tree/)
- [Ethereum: Block Structure](https://ethereum.org/en/developers/docs/blocks/)
- [Verkle Trees](https://vitalik.ca/general/2021/06/18/verkle.html)

---

*LP-6412 v1.0.0 - 2026-01-02*
