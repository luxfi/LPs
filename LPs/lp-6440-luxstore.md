---
lp: 6440
title: LuxStore Historical Storage
description: LuxStore Historical Storage specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines LuxStore, the historical blob storage and query layer for LuxDA. While DA operators provide short-term availability guarantees, LuxStore enables long-term archival and efficient querying of historical data.

## Motivation

Applications need historical data access beyond DA retention:

1. **Historical Queries**: Retrieve messages by time range, namespace, sender
2. **Archival**: Long-term preservation of important data
3. **Indexing**: Efficient search and filtering
4. **Proofs**: Bind query results to canonical headers

## Specification

### 1. Store Node Architecture

#### 1.1 Components

```go
type StoreNode struct {
    // Blob storage backend
    BlobStore BlobStorage

    // Index databases
    NamespaceIndex *NamespaceIndexDB
    TimeIndex      *TimeIndexDB
    SenderIndex    *SenderIndexDB

    // Header chain client
    HeaderChain HeaderChainClient

    // P2P network
    Network P2PClient

    // Configuration
    Config StoreConfig
}

type StoreConfig struct {
    // Storage limits
    MaxStorageBytes  uint64
    RetentionPeriod  time.Duration

    // Indexing options
    IndexNamespaces  []NamespaceId  // Empty = all
    IndexSenders     bool

    // Serving options
    MaxQueryResults  uint32
    RateLimits       RateLimitConfig
}
```

#### 1.2 Storage Backend

```go
type BlobStorage interface {
    // Store blob with metadata
    Put(commitment []byte, blob []byte, meta *BlobMeta) error

    // Retrieve blob by commitment
    Get(commitment []byte) ([]byte, *BlobMeta, error)

    // Check existence
    Has(commitment []byte) bool

    // Delete blob
    Delete(commitment []byte) error

    // Iterate blobs
    Iterate(fn func(commitment []byte, meta *BlobMeta) bool) error
}

type BlobMeta struct {
    NamespaceId  [20]byte
    Seq          uint64
    BlockHeight  uint64
    Timestamp    uint64
    BlobLen      uint32
    StoredAt     uint64
    ExpiresAt    uint64
}
```

### 2. Query API

#### 2.1 Query Service

```protobuf
service StoreQueryService {
    // Query by namespace and sequence range
    rpc QueryByNamespace(NamespaceQuery) returns (stream BlobResult);

    // Query by time range
    rpc QueryByTime(TimeQuery) returns (stream BlobResult);

    // Query by sender
    rpc QueryBySender(SenderQuery) returns (stream BlobResult);

    // Get specific blob
    rpc GetBlob(GetBlobRequest) returns (GetBlobResponse);

    // Get blob with proof
    rpc GetBlobWithProof(GetBlobWithProofRequest) returns (GetBlobWithProofResponse);
}

message NamespaceQuery {
    bytes namespace_id = 1;
    uint64 from_seq = 2;
    uint64 to_seq = 3;
    uint32 limit = 4;
    uint32 offset = 5;
    bool include_blobs = 6;
}

message TimeQuery {
    uint64 from_timestamp = 1;
    uint64 to_timestamp = 2;
    repeated bytes namespace_ids = 3;  // Filter by namespaces
    uint32 limit = 4;
    bool include_blobs = 5;
}

message BlobResult {
    bytes header = 1;
    bytes blob = 2;
    bytes proof = 3;
}
```

#### 2.2 Query Processing

```go
func (s *StoreNode) QueryByNamespace(q *NamespaceQuery) ([]*BlobResult, error) {
    // Query index
    entries, err := s.NamespaceIndex.Range(
        q.NamespaceId,
        q.FromSeq,
        q.ToSeq,
        q.Limit,
        q.Offset,
    )
    if err != nil {
        return nil, err
    }

    // Fetch results
    results := make([]*BlobResult, 0, len(entries))
    for _, entry := range entries {
        result := &BlobResult{
            Header: entry.Header,
        }

        if q.IncludeBlobs {
            blob, _, err := s.BlobStore.Get(entry.BlobCommitment)
            if err == nil {
                result.Blob = blob
            }
        }

        results = append(results, result)
    }

    return results, nil
}
```

### 3. Indexing

#### 3.1 Namespace Index

```go
type NamespaceIndexDB struct {
    db *leveldb.DB
}

// Key: namespace_id || seq
// Value: IndexEntry

type IndexEntry struct {
    BlobCommitment [32]byte
    BlockHeight    uint64
    Timestamp      uint64
    Header         []byte
}

func (idx *NamespaceIndexDB) Put(nsId [20]byte, seq uint64, entry *IndexEntry) error {
    key := append(nsId[:], uint64ToBytes(seq)...)
    value := encodeEntry(entry)
    return idx.db.Put(key, value, nil)
}

func (idx *NamespaceIndexDB) Range(nsId [20]byte, fromSeq, toSeq uint64, limit, offset uint32) ([]*IndexEntry, error) {
    startKey := append(nsId[:], uint64ToBytes(fromSeq)...)
    endKey := append(nsId[:], uint64ToBytes(toSeq+1)...)

    iter := idx.db.NewIterator(&util.Range{Start: startKey, Limit: endKey}, nil)
    defer iter.Release()

    var entries []*IndexEntry
    skipped := uint32(0)

    for iter.Next() {
        if skipped < offset {
            skipped++
            continue
        }

        entry := decodeEntry(iter.Value())
        entries = append(entries, entry)

        if limit > 0 && uint32(len(entries)) >= limit {
            break
        }
    }

    return entries, iter.Error()
}
```

#### 3.2 Time Index

```go
type TimeIndexDB struct {
    db *leveldb.DB
}

// Key: timestamp || namespace_id || seq
// Value: BlobCommitment

func (idx *TimeIndexDB) Put(timestamp uint64, nsId [20]byte, seq uint64, commitment [32]byte) error {
    key := make([]byte, 8+20+8)
    binary.BigEndian.PutUint64(key[0:8], timestamp)
    copy(key[8:28], nsId[:])
    binary.BigEndian.PutUint64(key[28:36], seq)

    return idx.db.Put(key, commitment[:], nil)
}

func (idx *TimeIndexDB) Range(from, to uint64, nsIds []NamespaceId) ([]TimeIndexEntry, error) {
    startKey := uint64ToBytes(from)
    endKey := uint64ToBytes(to + 1)

    iter := idx.db.NewIterator(&util.Range{Start: startKey, Limit: endKey}, nil)
    defer iter.Release()

    var entries []TimeIndexEntry
    nsFilter := makeNsFilter(nsIds)

    for iter.Next() {
        timestamp := binary.BigEndian.Uint64(iter.Key()[0:8])
        var nsId [20]byte
        copy(nsId[:], iter.Key()[8:28])
        seq := binary.BigEndian.Uint64(iter.Key()[28:36])

        if len(nsFilter) > 0 && !nsFilter[nsId] {
            continue
        }

        var commitment [32]byte
        copy(commitment[:], iter.Value())

        entries = append(entries, TimeIndexEntry{
            Timestamp:      timestamp,
            NamespaceId:    nsId,
            Seq:            seq,
            BlobCommitment: commitment,
        })
    }

    return entries, iter.Error()
}
```

### 4. Proofs

#### 4.1 Inclusion Proof

```go
type BlobInclusionProof struct {
    // Header inclusion in block
    HeaderProof *HeaderInclusionProof

    // Blob commitment matches header
    BlobCommitment [32]byte

    // Optional: blob matches commitment
    BlobHash [32]byte
}

func (s *StoreNode) GenerateInclusionProof(commitment [32]byte) (*BlobInclusionProof, error) {
    // Find header containing this blob
    meta, err := s.BlobStore.GetMeta(commitment)
    if err != nil {
        return nil, err
    }

    // Get header inclusion proof from header chain
    headerProof, err := s.HeaderChain.GetInclusionProof(
        meta.NamespaceId,
        meta.Seq,
        meta.BlockHeight,
    )
    if err != nil {
        return nil, err
    }

    return &BlobInclusionProof{
        HeaderProof:    headerProof,
        BlobCommitment: commitment,
        BlobHash:       sha3.Sum256(blob),
    }, nil
}
```

#### 4.2 Proof Verification

```go
func VerifyBlobInclusionProof(proof *BlobInclusionProof, blob []byte, trustedRoot [32]byte) bool {
    // 1. Verify blob matches commitment
    if sha3.Sum256(blob) != proof.BlobHash {
        return false
    }

    // Verify commitment in header matches
    header := DecodeHeader(proof.HeaderProof.Header)
    if header.BlobCommitment != proof.BlobCommitment {
        return false
    }

    // 3. Verify header inclusion
    return VerifyHeaderInclusionProof(proof.HeaderProof, trustedRoot)
}
```

### 5. Synchronization

#### 5.1 Header Chain Sync

```go
func (s *StoreNode) SyncFromHeaderChain() error {
    // Get last synced height
    lastHeight := s.GetLastSyncedHeight()

    // Stream new blocks
    blocks := s.HeaderChain.StreamBlocks(lastHeight + 1)

    for block := range blocks {
        for _, batch := range block.LaneBatches {
            // Check if we're indexing this namespace
            if !s.ShouldIndex(batch.NamespaceId) {
                continue
            }

            for _, header := range batch.Headers {
                // Index header
                s.IndexHeader(&header, block.Height)

                // Fetch and store blob
                if header.BlobLen > 0 {
                    blob, err := s.FetchBlob(header.BlobCommitment)
                    if err == nil {
                        s.StoreBlob(header.BlobCommitment, blob, &header)
                    }
                }
            }
        }

        s.SetLastSyncedHeight(block.Height)
    }

    return nil
}
```

#### 5.2 Blob Fetching

```go
func (s *StoreNode) FetchBlob(commitment [32]byte) ([]byte, error) {
    // Try DA operators first
    blob, err := s.DAClient.GetBlob(commitment)
    if err == nil {
        return blob, nil
    }

    // Try peer store nodes
    for _, peer := range s.Network.StorePeers() {
        blob, err := peer.GetBlob(commitment)
        if err == nil && sha3.Sum256(blob) == commitment {
            return blob, nil
        }
    }

    return nil, ErrBlobNotFound
}
```

### 6. Retention Management

#### 6.1 Retention Policy

```go
type RetentionPolicy struct {
    // Default retention period
    DefaultRetention time.Duration

    // Per-namespace overrides
    NamespaceRetention map[NamespaceId]time.Duration

    // Retention by priority
    PriorityRetention map[Priority]time.Duration

    // Maximum storage size
    MaxStorage uint64
}

func (s *StoreNode) ApplyRetention() error {
    now := time.Now()

    // Iterate all blobs
    s.BlobStore.Iterate(func(commitment []byte, meta *BlobMeta) bool {
        // Check expiry
        retention := s.GetRetention(meta)
        expiresAt := time.Unix(int64(meta.StoredAt), 0).Add(retention)

        if now.After(expiresAt) {
            s.DeleteBlob(commitment, meta)
        }

        return true
    })

    // Check total size
    if s.BlobStore.Size() > s.Config.MaxStorageBytes {
        s.EvictLRU()
    }

    return nil
}
```

### 7. Metrics

| Metric | Description |
|--------|-------------|
| `store_blobs_total` | Total blobs stored |
| `store_size_bytes` | Total storage used |
| `store_queries_total` | Queries by type |
| `store_query_latency_ms` | Query latency |
| `store_sync_height` | Last synced block height |

## Rationale

### Why Separate from DA Layer?

- DA provides short-term guaranteed availability
- Store provides long-term archival with economics
- Different retention and query requirements

### Why Index by Multiple Keys?

- Namespace queries for application state
- Time queries for analytics and debugging
- Sender queries for user data access

### Why Proofs?

- Bind query results to trusted header chain
- Enable trustless verification
- Support light clients

## Backwards Compatibility

LuxStore is a new infrastructure component and does not affect existing DA layer or consensus protocols. Store nodes operate independently and can be deployed incrementally alongside existing DA operators.

## Security Considerations

### Query DOS

Mitigated by:
- Rate limiting
- Query result limits
- Pagination

### Data Integrity

Ensured by:
- Blob commitment verification
- Header chain proofs
- Merkle proofs for query results

### Storage Exhaustion

Managed by:
- Retention policies
- Storage quotas
- LRU eviction

## Test Plan

### Unit Tests

1. **Index Operations**: CRUD on all indexes
2. **Query Processing**: Various query types
3. **Proof Generation**: Valid proofs for stored data

### Integration Tests

1. **Sync Flow**: Sync from header chain
2. **Query Flow**: End-to-end queries
3. **Retention**: Correct data expiration

### Performance Tests

1. **Query Throughput**: Queries per second
2. **Index Performance**: Large dataset operations
3. **Sync Speed**: Blocks per second

## References

- [The Graph: Indexing Protocol](https://thegraph.com/docs/)
- [Celestia Blob Storage](https://docs.celestia.org/)
- [LevelDB Documentation](https://github.com/google/leveldb)

---

*LP-6440 v1.0.0 - 2026-01-02*
