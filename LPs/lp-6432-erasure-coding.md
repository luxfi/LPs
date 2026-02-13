---
lp: 6432
title: LuxDA Erasure Coding
description: LuxDA Erasure Coding specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP specifies the erasure coding parameters for LuxDA, including Reed-Solomon encoding configuration, chunk sizes, redundancy targets, and repair/reconstruction requirements.

## Motivation

Erasure coding is fundamental to DA systems:

1. **Redundancy**: Survive operator failures
2. **Efficiency**: Less storage than full replication
3. **Verifiability**: Enable sampling (future DAS)
4. **Flexibility**: Trade-offs between redundancy and efficiency

## Specification

### 1. Coding Scheme Selection

#### 1.1 Reed-Solomon (RS) Coding

LuxDA uses Reed-Solomon coding over GF(2^8):

```go
type RSParams struct {
    // Data shards (k)
    DataShards int

    // Parity shards (n-k)
    ParityShards int

    // Total shards (n)
    TotalShards int

    // Shard size in bytes
    ShardSize int
}
```

Properties:
- Any k-of-n shards can reconstruct original data
- Maximum redundancy: (n-k)/k
- Efficient encoding/decoding with FFT

#### 1.2 Parameter Selection

Standard parameters:

| Blob Size | Data Shards (k) | Parity Shards | Total (n) | Redundancy |
|-----------|-----------------|---------------|-----------|------------|
| ≤64 KiB | 16 | 16 | 32 | 2x |
| ≤256 KiB | 32 | 32 | 64 | 2x |
| ≤1 MiB | 64 | 64 | 128 | 2x |
| ≤2 MiB | 128 | 128 | 256 | 2x |

```go
func SelectParams(blobSize int) RSParams {
    switch {
    case blobSize <= 64*1024:
        return RSParams{DataShards: 16, ParityShards: 16, TotalShards: 32}
    case blobSize <= 256*1024:
        return RSParams{DataShards: 32, ParityShards: 32, TotalShards: 64}
    case blobSize <= 1024*1024:
        return RSParams{DataShards: 64, ParityShards: 64, TotalShards: 128}
    default:
        return RSParams{DataShards: 128, ParityShards: 128, TotalShards: 256}
    }
}
```

### 2. Chunk Structure

#### 2.1 Chunk Format

```go
type Chunk struct {
    // Chunk index in the encoding
    Index uint32

    // Raw chunk data
    Data []byte

    // Proof of chunk validity (for KZG)
    Proof []byte
}

type ChunkSet struct {
    // Blob identification
    BlobCommitment [32]byte

    // Encoding parameters
    Params RSParams

    // All chunks (data + parity)
    Chunks []Chunk

    // Root of chunk Merkle tree
    ChunksRoot [32]byte
}
```

#### 2.2 Chunk Size Calculation

```go
const (
    MinChunkSize = 512     // Minimum chunk size
    MaxChunkSize = 16384   // Maximum chunk size (16 KiB)
)

func CalculateChunkSize(blobSize int, params RSParams) int {
    // Base chunk size
    baseSize := (blobSize + params.DataShards - 1) / params.DataShards

    // Align to power of 2
    aligned := nextPowerOf2(baseSize)

    // Clamp to bounds
    return max(MinChunkSize, min(MaxChunkSize, aligned))
}
```

### 3. Encoding Process

#### 3.1 Blob Encoding

```go
func EncodeBlob(blob []byte) (*ChunkSet, error) {
    // Select parameters
    params := SelectParams(len(blob))

    // Calculate chunk size
    chunkSize := CalculateChunkSize(len(blob), params)

    // Pad blob to multiple of chunk size * data shards
    paddedSize := chunkSize * params.DataShards
    padded := make([]byte, paddedSize)
    copy(padded, blob)

    // Split into data shards
    dataShards := make([][]byte, params.DataShards)
    for i := 0; i < params.DataShards; i++ {
        start := i * chunkSize
        dataShards[i] = padded[start : start+chunkSize]
    }

    // Create encoder
    encoder, _ := reedsolomon.New(params.DataShards, params.ParityShards)

    // Allocate parity shards
    allShards := make([][]byte, params.TotalShards)
    copy(allShards, dataShards)
    for i := params.DataShards; i < params.TotalShards; i++ {
        allShards[i] = make([]byte, chunkSize)
    }

    // Encode
    if err := encoder.Encode(allShards); err != nil {
        return nil, err
    }

    // Build chunks
    chunks := make([]Chunk, params.TotalShards)
    for i, shard := range allShards {
        chunks[i] = Chunk{
            Index: uint32(i),
            Data:  shard,
        }
    }

    // Compute commitment and root
    commitment := ComputeBlobCommitment(blob)
    chunksRoot := ComputeChunksRoot(chunks)

    return &ChunkSet{
        BlobCommitment: commitment,
        Params:         params,
        Chunks:         chunks,
        ChunksRoot:     chunksRoot,
    }, nil
}
```

#### 3.2 Chunk Merkle Tree

```go
func ComputeChunksRoot(chunks []Chunk) [32]byte {
    // Build leaf hashes
    leaves := make([][32]byte, len(chunks))
    for i, chunk := range chunks {
        leaves[i] = sha3.Sum256(
            uint32ToBytes(chunk.Index),
            chunk.Data,
        )
    }

    // Build Merkle tree
    return MerkleRoot(leaves)
}

func ComputeChunkProof(chunks []Chunk, index int) []byte {
    leaves := make([][32]byte, len(chunks))
    for i, chunk := range chunks {
        leaves[i] = sha3.Sum256(uint32ToBytes(chunk.Index), chunk.Data)
    }

    return MerkleProof(leaves, index)
}
```

### 4. Decoding Process

#### 4.1 Blob Reconstruction

```go
func DecodeBlob(chunks []Chunk, params RSParams) ([]byte, error) {
    // Create decoder
    decoder, _ := reedsolomon.New(params.DataShards, params.ParityShards)

    // Build shard array (nil for missing)
    shards := make([][]byte, params.TotalShards)
    for _, chunk := range chunks {
        if int(chunk.Index) < params.TotalShards {
            shards[chunk.Index] = chunk.Data
        }
    }

    // Check if we have enough shards
    available := 0
    for _, shard := range shards {
        if shard != nil {
            available++
        }
    }

    if available < params.DataShards {
        return nil, ErrInsufficientChunks
    }

    // Reconstruct if needed
    if available < params.TotalShards {
        if err := decoder.Reconstruct(shards); err != nil {
            return nil, err
        }
    }

    // Concatenate data shards
    var result []byte
    for i := 0; i < params.DataShards; i++ {
        result = append(result, shards[i]...)
    }

    return result, nil
}
```

#### 4.2 Partial Reconstruction

For repairing missing chunks:

```go
func RepairChunks(chunks []Chunk, params RSParams, missing []int) ([]Chunk, error) {
    // Full decode/encode
    blob, err := DecodeBlob(chunks, params)
    if err != nil {
        return nil, err
    }

    full, err := EncodeBlob(blob)
    if err != nil {
        return nil, err
    }

    // Extract repaired chunks
    repaired := make([]Chunk, len(missing))
    for i, idx := range missing {
        repaired[i] = full.Chunks[idx]
    }

    return repaired, nil
}
```

### 5. Chunk Distribution

#### 5.1 Operator Assignment

Each operator is assigned specific chunk indices:

```go
func AssignChunks(commitment [32]byte, operators []DAOperator, params RSParams) map[OperatorID][]uint32 {
    // Deterministic assignment based on commitment
    seed := sha3.Sum256(commitment[:], []byte("chunk_assignment"))
    rng := NewDeterministicRNG(seed)

    // Shuffle chunk indices
    indices := make([]uint32, params.TotalShards)
    for i := range indices {
        indices[i] = uint32(i)
    }
    rng.Shuffle(len(indices), func(i, j int) {
        indices[i], indices[j] = indices[j], indices[i]
    })

    // Assign to operators (round-robin with redundancy)
    assignment := make(map[OperatorID][]uint32)
    redundancyFactor := 2  // Each chunk stored by 2 operators

    for i, chunkIdx := range indices {
        for r := 0; r < redundancyFactor; r++ {
            opIdx := (i + r) % len(operators)
            op := operators[opIdx]
            assignment[op.OperatorID] = append(assignment[op.OperatorID], chunkIdx)
        }
    }

    return assignment
}
```

#### 5.2 Storage Requirements

Per operator storage calculation:

```go
func CalculateOperatorStorage(numBlobs int, avgBlobSize int, redundancy int) uint64 {
    avgChunksPerOp := avgBlobSize / MinChunkSize * redundancy / NumOperators
    return uint64(numBlobs * avgChunksPerOp * MinChunkSize)
}
```

### 6. Verification

#### 6.1 Chunk Verification

```go
func VerifyChunk(chunk Chunk, commitment [32]byte, chunksRoot [32]byte, proof []byte) bool {
    // Compute chunk leaf hash
    leaf := sha3.Sum256(uint32ToBytes(chunk.Index), chunk.Data)

    // Verify Merkle proof
    return VerifyMerkleProof(leaf, chunk.Index, chunksRoot, proof)
}
```

#### 6.2 KZG Chunk Proofs (Optional)

For advanced verification:

```go
func KZGVerifyChunk(chunk Chunk, commitment *KZGCommitment, proof *KZGProof, setup *TrustedSetup) bool {
    // Evaluate polynomial at chunk position
    position := ComputeChunkPosition(chunk.Index, setup)

    // Verify KZG evaluation proof
    return KZGVerifyEval(commitment, position, chunk.Data, proof, setup)
}
```

### 7. Repair Protocol

#### 7.1 Repair Detection

```go
type RepairMonitor struct {
    // Track chunk availability
    available map[[32]byte][]bool  // commitment -> chunk availability

    // Repair threshold
    threshold float64  // Trigger repair if availability < threshold
}

func (rm *RepairMonitor) CheckRepairNeeded(commitment [32]byte, params RSParams) bool {
    avail := rm.available[commitment]
    count := countTrue(avail)

    // Need repair if below threshold
    return float64(count)/float64(params.TotalShards) < rm.threshold
}
```

#### 7.2 Repair Execution

```go
func ExecuteRepair(commitment [32]byte, params RSParams, operators []DAOperator) error {
    // Collect available chunks
    chunks := collectAvailableChunks(commitment, operators)

    if len(chunks) < params.DataShards {
        return ErrUnrecoverable
    }

    // Identify missing chunks
    missing := identifyMissing(chunks, params)

    // Repair
    repaired, err := RepairChunks(chunks, params, missing)
    if err != nil {
        return err
    }

    // Redistribute repaired chunks
    for _, chunk := range repaired {
        targetOp := selectOperatorForChunk(commitment, chunk.Index, operators)
        targetOp.Store(commitment, chunk)
    }

    return nil
}
```

### 8. Performance Considerations

#### 8.1 Encoding Benchmarks

| Blob Size | Encoding Time | Decoding Time | Memory |
|-----------|---------------|---------------|--------|
| 64 KiB | 0.5 ms | 0.3 ms | 128 KiB |
| 256 KiB | 1.5 ms | 1.0 ms | 512 KiB |
| 1 MiB | 5 ms | 3 ms | 2 MiB |
| 2 MiB | 10 ms | 6 ms | 4 MiB |

#### 8.2 Optimization: SIMD Encoding

```go
// Use SIMD-optimized Reed-Solomon library
import "github.com/klauspost/reedsolomon"

func NewOptimizedEncoder(data, parity int) reedsolomon.Encoder {
    enc, _ := reedsolomon.New(data, parity,
        reedsolomon.WithAutoGoroutines(4),
        reedsolomon.WithCauchyMatrix(),
    )
    return enc
}
```

### 9. Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MinDataShards` | 16 | Minimum data shards |
| `MaxDataShards` | 128 | Maximum data shards |
| `DefaultRedundancy` | 2.0 | Default redundancy factor |
| `MinChunkSize` | 512 | Minimum chunk size (bytes) |
| `MaxChunkSize` | 16384 | Maximum chunk size (bytes) |
| `RepairThreshold` | 0.8 | Trigger repair below this |
| `ChunkRedundancy` | 2 | Chunks per operator overlap |

## Rationale

### Why Reed-Solomon?

- Well-understood, battle-tested
- Optimal MDS (Maximum Distance Separable) code
- Efficient implementations available
- Compatible with KZG for future DAS

### Why 2x Redundancy?

- Balances storage cost and availability
- Survives 50% operator failure
- Standard in industry (Celestia, EigenDA)

### Why Variable Parameters?

- Small blobs don't need 256 shards
- Reduces overhead for small messages
- Optimizes encoding/decoding time

## Backwards Compatibility

This LP defines the erasure coding scheme used within the LuxDA Bus. It is an internal component of the DA layer and does not expose any new interfaces to applications. As such, it has no impact on existing protocols and introduces no breaking changes.

## Security Considerations

### Commitment Binding

Erasure coding preserves commitment:
- Original blob commitment is computed before encoding
- Decoded blob must match original commitment

### Chunk Validity

Each chunk must be verifiable:
- Merkle proof for basic verification
- KZG proof for advanced (DAS) verification

### Repair Attacks

Malicious operators could trigger unnecessary repairs:
- Rate-limit repair operations
- Require proof of unavailability

## Test Plan

### Unit Tests

1. **Encode/Decode Round Trip**: Various blob sizes
2. **Partial Decode**: Decode with minimum chunks
3. **Chunk Verification**: Valid/invalid proofs

### Integration Tests

1. **Distribution**: Chunks distributed correctly
2. **Repair Flow**: End-to-end repair
3. **Operator Failure**: Survive operator loss

### Stress Tests

1. **Large Blobs**: 2 MiB blobs
2. **Many Blobs**: 10,000 concurrent blobs
3. **High Churn**: Operators joining/leaving

## References

- [Reed-Solomon Coding](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction)
- [klauspost/reedsolomon](https://github.com/klauspost/reedsolomon)
- [Celestia Erasure Coding](https://celestia.org/glossary/erasure-coding/)
- [EIP-4844 Blob Structure](https://eips.ethereum.org/EIPS/eip-4844)

---

*LP-6432 v1.0.0 - 2026-01-02*
