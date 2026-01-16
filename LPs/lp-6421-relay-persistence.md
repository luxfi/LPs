---
lp: 6421
title: LuxRelay Persistence Layer
description: LuxRelay Persistence Layer specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the persistence layer for LuxRelay, enabling store-and-forward delivery for offline nodes and message retrieval within the relay window. This provides ephemeral storage between real-time gossip and long-term DA/storage layers.

## Motivation

Pure gossip provides no delivery guarantees for:

1. Nodes that are temporarily offline
2. Nodes that join after message publication
3. Slow nodes that miss real-time propagation
4. Applications needing recent history without full archive

Store-and-forward bridges these gaps with bounded-time persistence.

## Specification

### 1. Relay Store

#### 1.1 Store Architecture

```go
type RelayStore struct {
    // In-memory hot cache
    HotCache *LRUCache

    // Persistent store (disk-backed)
    ColdStore *LevelDB

    // Configuration
    Config RelayStoreConfig
}

type RelayStoreConfig struct {
    // Maximum messages to keep in hot cache
    HotCacheSize int

    // Maximum age for hot cache entries
    HotCacheTTL time.Duration

    // Maximum age for cold store entries
    ColdStoreTTL time.Duration

    // Maximum total storage size
    MaxStorageBytes uint64

    // Per-namespace quotas
    NamespaceQuotas map[[20]byte]uint64
}
```

Default configuration:
- `HotCacheSize: 100,000`
- `HotCacheTTL: 1 minute`
- `ColdStoreTTL: 10 minutes`
- `MaxStorageBytes: 1 GiB`

#### 1.2 Storage Schema

```
Key format:
    /relay/headers/<namespaceId>/<seq>     -> MsgHeader
    /relay/blobs/<blobCommitment>          -> BlobData
    /relay/index/time/<timestamp>/<msgId>  -> empty
    /relay/index/sender/<sender>/<msgId>   -> empty

Value format:
    StoredMessage := {
        receivedAt:  uint64
        expiresAt:   uint64
        header:      MsgHeader
        blobData:    []byte (optional)
        source:      PeerID
    }
```

#### 1.3 Eviction Policy

```go
func (rs *RelayStore) Evict() {
    now := time.Now()

    // Evict by TTL
    for _, msg := range rs.ColdStore.Scan("/relay/") {
        if msg.ExpiresAt < now.Unix() {
            rs.ColdStore.Delete(msg.Key)
        }
    }

    // Evict by size (LRU)
    if rs.ColdStore.Size() > rs.Config.MaxStorageBytes {
        oldest := rs.ColdStore.OldestEntries(evictionBatch)
        for _, key := range oldest {
            rs.ColdStore.Delete(key)
        }
    }
}
```

### 2. Store-and-Forward Protocol

#### 2.1 Message Flow

```
Sender publishes message
         ↓
Relay nodes receive via gossip
         ↓
Store in HotCache (immediate)
         ↓
Migrate to ColdStore (after 1 min)
         ↓
Offline node connects
         ↓
Request missed messages
         ↓
Relay provides from store
         ↓
Evict after TTL (10 min)
```

#### 2.2 Sync Protocol

```protobuf
service RelaySync {
    // Request messages after a given point
    rpc SyncNamespace(SyncRequest) returns (stream StoredMessage);

    // Request specific messages by ID
    rpc GetMessages(GetMessagesRequest) returns (GetMessagesResponse);

    // Get current namespace head
    rpc GetNamespaceHead(NamespaceHeadRequest) returns (NamespaceHeadResponse);
}

message SyncRequest {
    bytes namespace_id = 1;
    uint64 from_seq = 2;        // Start sequence (exclusive)
    uint64 to_seq = 3;          // End sequence (inclusive), 0 = latest
    uint64 from_timestamp = 4;  // Alternative: start time
    uint32 max_messages = 5;    // Limit
}

message StoredMessage {
    bytes header = 1;
    bytes blob_data = 2;    // If available
    uint64 received_at = 3;
    bytes source_peer = 4;
}
```

#### 2.3 Offline Delivery

When a node reconnects:

```python
def sync_on_reconnect(peer):
    for namespace_id in my_subscriptions:
        # Get peer's last known seq
        my_head = get_local_head(namespace_id)

        # Request messages from peer
        response = peer.sync_namespace(
            namespace_id=namespace_id,
            from_seq=my_head.seq,
            max_messages=1000
        )

        for msg in response:
            if validate_message(msg):
                process_message(msg)
                update_local_head(namespace_id, msg.header.seq)
```

### 3. Message ID and Deduplication

#### 3.1 Message ID Computation

```go
func ComputeMessageID(header *MsgHeader) [32]byte {
    return sha3.Sum256(
        header.NamespaceId[:],
        BigEndianUint64(header.Seq),
    )
}
```

#### 3.2 Deduplication

```go
func (rs *RelayStore) ShouldStore(msg *StoredMessage) bool {
    msgId := ComputeMessageID(msg.Header)

    // Check if already stored
    if rs.HotCache.Has(msgId) || rs.ColdStore.Has(msgId) {
        return false
    }

    // Check namespace quota
    if rs.GetNamespaceSize(msg.Header.NamespaceId) >= rs.Config.NamespaceQuotas[msg.Header.NamespaceId] {
        return false
    }

    return true
}
```

### 4. Query API

#### 4.1 Namespace Query

```go
type NamespaceQuery struct {
    NamespaceId [20]byte
    FromSeq     uint64
    ToSeq       uint64
    FromTime    uint64
    ToTime      uint64
    Limit       uint32
    Offset      uint32
}

func (rs *RelayStore) QueryNamespace(q *NamespaceQuery) ([]*StoredMessage, error) {
    prefix := fmt.Sprintf("/relay/headers/%x/", q.NamespaceId)

    var results []*StoredMessage
    for _, kv := range rs.ColdStore.Scan(prefix) {
        msg := decode(kv.Value)

        // Apply filters
        if q.FromSeq > 0 && msg.Header.Seq <= q.FromSeq {
            continue
        }
        if q.ToSeq > 0 && msg.Header.Seq > q.ToSeq {
            continue
        }
        if q.FromTime > 0 && msg.Header.Timestamp < q.FromTime {
            continue
        }
        if q.ToTime > 0 && msg.Header.Timestamp > q.ToTime {
            continue
        }

        results = append(results, msg)

        if len(results) >= int(q.Limit) {
            break
        }
    }

    return results, nil
}
```

#### 4.2 Time-Range Query

```go
func (rs *RelayStore) QueryByTime(from, to uint64) ([]*StoredMessage, error) {
    prefix := fmt.Sprintf("/relay/index/time/%d/", from)
    endKey := fmt.Sprintf("/relay/index/time/%d/", to)

    var results []*StoredMessage
    for _, kv := range rs.ColdStore.Range(prefix, endKey) {
        msgId := extractMsgId(kv.Key)
        msg, err := rs.GetMessage(msgId)
        if err == nil {
            results = append(results, msg)
        }
    }

    return results, nil
}
```

### 5. Blob Caching

#### 5.1 Blob Store Configuration

```go
type BlobCacheConfig struct {
    // Enable blob caching
    Enabled bool

    // Maximum blob size to cache
    MaxBlobSize uint32

    // Maximum total cache size
    MaxCacheSize uint64

    // Blob TTL (same as message TTL)
    TTL time.Duration
}
```

#### 5.2 Blob Retrieval

```go
func (rs *RelayStore) GetBlob(commitment [32]byte) ([]byte, error) {
    key := fmt.Sprintf("/relay/blobs/%x", commitment)

    // Check local store
    if data, err := rs.ColdStore.Get(key); err == nil {
        return data, nil
    }

    // Request from peers
    for _, peer := range rs.Peers.ActivePeers() {
        data, err := peer.GetBlob(commitment)
        if err == nil && sha3.Sum256(data) == commitment {
            // Cache for future requests
            rs.ColdStore.Set(key, data, rs.Config.BlobTTL)
            return data, nil
        }
    }

    return nil, ErrBlobNotFound
}
```

### 6. Bandwidth Management

#### 6.1 Rate Limiting

```go
type BandwidthConfig struct {
    // Maximum inbound sync rate
    MaxInboundRate rate.Limit

    // Maximum outbound sync rate
    MaxOutboundRate rate.Limit

    // Per-peer rate limits
    PerPeerRate rate.Limit

    // Priority for validators
    ValidatorPriority float64
}
```

#### 6.2 Prioritization

```go
func (rs *RelayStore) PrioritizeRequest(req *SyncRequest, peer *Peer) int {
    priority := 0

    // Validators get priority
    if peer.IsValidator {
        priority += 1000
    }

    // Recent messages get priority
    age := time.Now().Unix() - req.FromTimestamp
    if age < 60 {
        priority += 100
    }

    // Subscribed namespaces get priority
    if rs.IsSubscribed(req.NamespaceId) {
        priority += 50
    }

    return priority
}
```

### 7. Compaction

#### 7.1 Message Compaction

For namespaces with high throughput, compact older messages:

```go
func (rs *RelayStore) CompactNamespace(nsId [20]byte) {
    // Keep only every Nth message for old data
    messages := rs.QueryNamespace(&NamespaceQuery{
        NamespaceId: nsId,
        ToTime:      time.Now().Add(-5 * time.Minute).Unix(),
    })

    for i, msg := range messages {
        if i % CompactionRatio != 0 {
            rs.Delete(msg)
        }
    }
}
```

#### 7.2 Index Cleanup

```go
func (rs *RelayStore) CleanupIndexes() {
    now := time.Now().Unix()

    // Clean time index
    for _, key := range rs.ColdStore.Scan("/relay/index/time/") {
        timestamp := extractTimestamp(key)
        if timestamp < now - int64(rs.Config.ColdStoreTTL.Seconds()) {
            rs.ColdStore.Delete(key)
        }
    }
}
```

### 8. Metrics

| Metric | Description |
|--------|-------------|
| `relay_store_messages` | Messages in store |
| `relay_store_size_bytes` | Total storage used |
| `relay_store_hit_rate` | Cache hit rate |
| `relay_sync_requests` | Sync requests received |
| `relay_sync_latency_ms` | Sync request latency |

## Rationale

### Why Short TTL (10 minutes)?

- Long-term storage handled by DA/Store layers
- Relay store is for missed real-time messages
- Limits storage requirements
- Encourages proper architecture

### Why Separate Hot/Cold Cache?

- Hot cache optimizes recent message access
- Cold cache provides persistence across restarts
- Different eviction policies for each

### Why Per-Namespace Quotas?

- Prevents one namespace from monopolizing storage
- Enables fair resource allocation
- Allows priority namespaces

## Security Considerations

### Storage Exhaustion

Mitigated by:
- Per-namespace quotas
- Total storage limits
- TTL-based eviction

### Stale Data Attacks

Mitigated by:
- TTL limits
- Sequence number validation
- Cross-reference with header chain

### Eclipse via Sync

Mitigated by:
- Validate messages against known state
- Request from multiple peers
- Compare responses

## Test Plan

### Unit Tests

1. **Storage Operations**: Store, retrieve, delete messages
2. **TTL Eviction**: Messages evict after TTL
3. **Quota Enforcement**: Namespace quotas respected

### Integration Tests

1. **Offline Sync**: Node syncs after disconnect
2. **Concurrent Sync**: Multiple peers sync simultaneously
3. **Recovery**: Store recovers after restart

### Performance Tests

1. **Write Throughput**: Measure message ingestion rate
2. **Query Latency**: Measure query response time
3. **Sync Speed**: Measure sync completion time

## References

- [IPFS Bitswap](https://github.com/ipfs/specs/blob/main/BITSWAP.md)
- [libp2p Store Protocol](https://github.com/waku-org/specs/blob/master/standards/core/store.md)
- [LevelDB Documentation](https://github.com/google/leveldb)

---

*LP-6421 v1.0.0 - 2026-01-02*
