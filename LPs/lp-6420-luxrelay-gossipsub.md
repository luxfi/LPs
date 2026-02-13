---
lp: 6420
title: LuxRelay Gossipsub Protocol
description: LuxRelay Gossipsub Protocol specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the LuxRelay gossip protocol for fast message propagation across the LuxDA Bus network. LuxRelay provides best-effort, low-latency delivery of headers and blobs before consensus finalization.

## Motivation

Fast message propagation is essential for:

1. Low-latency messaging applications (chat, notifications)
2. Efficient consensus (validators receive headers quickly)
3. Blob dispersal (DA operators receive data promptly)
4. User experience (preconfirmations depend on fast propagation)

## Specification

### 1. Network Topology

#### 1.1 Node Types

| Type | Role | Requirements |
|------|------|--------------|
| Validator | Consensus participation | Full relay + header chain |
| Relay | Gossip propagation | Full relay, no consensus |
| Light | Subscribe only | Selective relay |
| DA Operator | Blob storage | Full relay + DA |

#### 1.2 Peer Discovery

Nodes discover peers via:
1. Bootstrap nodes (hardcoded list)
2. DHT (Kademlia-based)
3. PEX (Peer Exchange)

```go
type PeerDiscovery struct {
    BootstrapNodes []string
    DHTEnabled     bool
    PEXEnabled     bool
    MaxPeers       int
    MinPeers       int
}
```

Default configuration:
- `MaxPeers: 50`
- `MinPeers: 10`
- `BootstrapNodes`: Network-specific list

#### 1.3 Connection Management

```go
type ConnectionManager struct {
    // Target number of outbound connections
    OutboundTarget int

    // Maximum inbound connections
    MaxInbound int

    // Connection rotation interval
    RotationInterval time.Duration

    // Peer scoring threshold
    ScoreThreshold float64
}
```

### 2. Topic Structure

#### 2.1 Topic Naming

Topics follow a hierarchical naming scheme:

```
/lux/<network>/relay/<topic_type>/<identifier>
```

Examples:
- `/lux/mainnet/relay/headers/global`
- `/lux/mainnet/relay/namespace/0x1234...`
- `/lux/mainnet/relay/blobs/available`

#### 2.2 Global Topics

| Topic | Content | Subscribers |
|-------|---------|-------------|
| `headers/global` | All headers | Validators, indexers |
| `blocks/proposed` | Proposed blocks | Validators |
| `blocks/finalized` | Finalized blocks | All nodes |
| `blobs/available` | Blob availability hints | DA operators |

#### 2.3 Namespace Topics

Each namespace has a dedicated topic:

```
/lux/<network>/relay/namespace/<namespaceId>
```

Nodes subscribe to namespaces they're interested in:
- Application nodes: Subscribe to app namespaces
- Validators: Subscribe to all active namespaces
- Light clients: Subscribe selectively

### 3. Message Types

#### 3.1 Header Announcement

```go
type HeaderAnnouncement struct {
    Header    MsgHeader
    Source    PeerID
    Timestamp uint64
    Signature []byte  // Sender's relay signature
}
```

#### 3.2 Blob Availability Hint

```go
type BlobAvailabilityHint struct {
    BlobCommitment [32]byte
    BlobLen        uint32
    Providers      []PeerID
    ExpiresAt      uint64
}
```

#### 3.3 Block Announcement

```go
type BlockAnnouncement struct {
    BlockHash   [32]byte
    BlockHeight uint64
    Proposer    PeerID
    Timestamp   uint64
    // Headers not included - fetch separately
}
```

### 4. Gossip Protocol

#### 4.1 Message Propagation

Gossipsub with modifications for LuxDA:

```go
type GossipConfig struct {
    // Gossipsub parameters
    D        int     // Target outbound degree (6)
    DLo      int     // Low watermark (4)
    DHi      int     // High watermark (12)
    DScore   int     // Peers to emit to based on score (4)
    DOut     int     // Outbound quota (2)
    DLazy    int     // Lazy gossip peers (6)

    // Timing
    HeartbeatInterval  time.Duration  // 700ms
    FanoutTTL          time.Duration  // 60s

    // History
    HistoryLength  int  // 5
    HistoryGossip  int  // 3
}
```

#### 4.2 Message Flow

```
Sender → Local Validation → Mesh Peers → Lazy Peers
                ↓
          Cache message
                ↓
          IHAVE to gossip peers
```

#### 4.3 Deduplication

Messages are deduplicated by ID:

```go
func MessageID(msg *RelayMessage) []byte {
    switch msg.Type {
    case TypeHeaderAnnouncement:
        return sha3.Sum256(msg.Header.NamespaceId, msg.Header.Seq)
    case TypeBlobHint:
        return sha3.Sum256(msg.BlobCommitment)
    case TypeBlockAnnouncement:
        return sha3.Sum256(msg.BlockHash)
    }
}
```

### 5. Peer Scoring

#### 5.1 Score Components

```go
type PeerScore struct {
    // Topic-specific scores
    TopicScores map[string]float64

    // Application-specific score
    AppScore float64

    // IP colocation penalty
    IPColocationPenalty float64

    // Behavioral score
    BehaviorPenalty float64
}

func ComputeScore(peer *Peer) float64 {
    score := 0.0

    // Topic scores
    for topic, weight := range TopicWeights {
        score += peer.TopicScores[topic] * weight
    }

    // Application score
    score += peer.AppScore * AppScoreWeight

    // Penalties
    score -= peer.IPColocationPenalty
    score -= peer.BehaviorPenalty

    return score
}
```

#### 5.2 Topic Score Parameters

```go
type TopicScoreParams struct {
    // Time in topic mesh
    TimeInMeshWeight  float64
    TimeInMeshQuantum time.Duration
    TimeInMeshCap     float64

    // First message deliveries
    FirstMessageDeliveriesWeight float64
    FirstMessageDeliveriesDecay  float64
    FirstMessageDeliveriesCap    float64

    // Message delivery rate
    MeshMessageDeliveriesWeight    float64
    MeshMessageDeliveriesDecay     float64
    MeshMessageDeliveriesThreshold float64
    MeshMessageDeliveriesWindow    time.Duration
    MeshMessageDeliveriesActivation time.Duration

    // Invalid messages
    InvalidMessageDeliveriesWeight float64
    InvalidMessageDeliveriesDecay  float64
}
```

#### 5.3 Score Thresholds

| Threshold | Value | Action |
|-----------|-------|--------|
| Gossip | 0 | Include in gossip |
| Publish | 0 | Publish to peer |
| Graylist | -1000 | Remove from mesh |
| Accept | -2500 | Accept messages |
| Reject | -5000 | Reject connections |

### 6. Anti-Eclipse Measures

#### 6.1 Peer Diversity

Enforce diversity in peer selection:

```go
type DiversityConstraints struct {
    // Maximum peers from same /16 subnet
    MaxFromSubnet int

    // Maximum peers from same ASN
    MaxFromASN int

    // Minimum geographic diversity
    MinGeoRegions int

    // Outbound-only quotas
    OutboundMinFromDistinct int
}
```

#### 6.2 Connection Rotation

Periodically rotate peers to prevent stale connections:

```go
func RotatePeers(manager *ConnectionManager) {
    // Identify low-scoring peers
    for _, peer := range manager.Peers() {
        if peer.Score < RotationThreshold {
            manager.Disconnect(peer)
        }
    }

    // Connect to new random peers
    newPeers := manager.Discovery.RandomPeers(RotationCount)
    for _, peer := range newPeers {
        manager.Connect(peer)
    }
}
```

### 7. Wire Protocol

#### 7.1 Message Envelope

```
RelayMessageV1 := {
    version:     uint8    [1 byte]
    type:        uint8    [1 byte]
    topicLen:    uint16   [2 bytes]
    topic:       bytes    [topicLen bytes]
    payloadLen:  uint32   [4 bytes]
    payload:     bytes    [payloadLen bytes]
    signatureLen: uint16  [2 bytes]
    signature:   bytes    [signatureLen bytes]
}
```

#### 7.2 Control Messages

```go
const (
    CtrlIHave    = 1  // Have these messages
    CtrlIWant    = 2  // Want these messages
    CtrlGraft    = 3  // Add to mesh
    CtrlPrune    = 4  // Remove from mesh
    CtrlPing     = 5  // Keepalive
    CtrlPong     = 6  // Keepalive response
)
```

### 8. Subscription Management

#### 8.1 Namespace Subscription

```go
type SubscriptionManager struct {
    // Subscribed namespaces
    Namespaces map[[20]byte]SubscriptionOpts

    // Global subscriptions
    GlobalTopics []string

    // Callback handlers
    OnHeader func(*MsgHeader)
    OnBlob   func(*BlobHint)
}

type SubscriptionOpts struct {
    // Include blob hints
    WantBlobs bool

    // Filter by sender
    SenderFilter []Identity

    // Rate limit
    MaxRate int
}
```

#### 8.2 Dynamic Subscription

```go
func (sm *SubscriptionManager) Subscribe(nsId [20]byte, opts SubscriptionOpts) error {
    topic := fmt.Sprintf("/lux/%s/relay/namespace/%x", network, nsId)

    if err := sm.gossipsub.Join(topic); err != nil {
        return err
    }

    sm.Namespaces[nsId] = opts
    return nil
}

func (sm *SubscriptionManager) Unsubscribe(nsId [20]byte) error {
    topic := fmt.Sprintf("/lux/%s/relay/namespace/%x", network, nsId)

    if err := sm.gossipsub.Leave(topic); err != nil {
        return err
    }

    delete(sm.Namespaces, nsId)
    return nil
}
```

### 9. Metrics

#### 9.1 Propagation Metrics

| Metric | Description |
|--------|-------------|
| `relay_message_latency_ms` | Time from send to receive |
| `relay_messages_received` | Messages received per topic |
| `relay_messages_published` | Messages published per topic |
| `relay_duplicate_ratio` | Ratio of duplicate messages |
| `relay_invalid_ratio` | Ratio of invalid messages |

#### 9.2 Peer Metrics

| Metric | Description |
|--------|-------------|
| `relay_peer_count` | Active peer connections |
| `relay_peer_score_distribution` | Score distribution histogram |
| `relay_mesh_size` | Size of mesh per topic |
| `relay_connection_duration` | Duration of peer connections |

## Rationale

### Why Gossipsub?

- Battle-tested in Ethereum and Filecoin
- Efficient message propagation with bounded amplification
- Built-in peer scoring for Sybil resistance
- Supports topic-based routing

### Why Namespace Topics?

- Applications subscribe only to relevant traffic
- Reduces bandwidth for focused nodes
- Enables namespace-specific rate limiting

### Why Separate from Consensus?

- Relay is best-effort, fast
- Consensus is guaranteed, slower
- Separation allows optimization of each layer

## Backwards Compatibility

This LP defines the gossip protocol for the LuxDA Bus, a new component of the Lux ecosystem. It operates on a separate port and uses a distinct protocol identifier from the existing Lux p2p network. Therefore, it has no impact on the existing networking stack and introduces no breaking changes.

## Security Considerations

### Sybil Attacks

Mitigated by:
- Peer scoring penalizes bad behavior
- Connection diversity requirements
- Stake-weighted gossip for validators

### Message Flooding

Mitigated by:
- Per-namespace rate limits
- Topic-level bandwidth quotas
- Invalid message scoring

### Eclipse Attacks

Mitigated by:
- Outbound connection diversity
- Geographic/ASN diversity requirements
- Connection rotation

## Test Plan

### Unit Tests

1. **Topic Routing**: Messages route to correct subscribers
2. **Deduplication**: Duplicate messages filtered
3. **Scoring**: Peer scores update correctly

### Integration Tests

1. **Propagation Latency**: Measure message propagation across network
2. **Mesh Formation**: Verify mesh forms with correct degree
3. **Recovery**: Network recovers from node failures

### Chaos Tests

1. **Churn**: High peer churn rate
2. **Partition**: Network partition and recovery
3. **Flood**: Message flooding attack

## References

- [libp2p Gossipsub Specification](https://github.com/libp2p/specs/blob/master/pubsub/gossipsub/gossipsub-v1.1.md)
- [Ethereum Consensus P2P](https://github.com/ethereum/consensus-specs/blob/dev/specs/phase0/p2p-interface.md)
- [Eclipse Attacks on P2P Networks](https://www.usenix.org/system/files/conference/usenixsecurity15/sec15-paper-heilman.pdf)

---

*LP-6420 v1.0.0 - 2026-01-02*
