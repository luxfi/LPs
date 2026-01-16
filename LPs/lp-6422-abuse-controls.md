---
lp: 6422
title: LuxRelay Abuse Controls
description: LuxRelay Abuse Controls specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines abuse prevention mechanisms for LuxRelay, including rate limiting, fee requirements, and spam detection. These controls protect the network from denial-of-service attacks while enabling legitimate high-throughput use cases.

## Motivation

An open relay network is vulnerable to:

1. Message flooding (DOS)
2. Namespace squatting
3. Resource exhaustion
4. Spam in public namespaces
5. Freeloading (using without contributing)

Abuse controls must balance protection with permissionless access.

## Specification

### 1. Rate Limiting Architecture

#### 1.1 Multi-Layer Rate Limiting

```
┌─────────────────────────────────────────────────────────────┐
│                      Global Network Limit                    │
│                      (consensus-enforced)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Per-Namespace Limit                       │
│                    (policy-defined)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Per-Sender Limit                         │
│                     (identity-based)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Per-Peer Limit                          │
│                      (relay-local)                           │
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 Rate Limit Configuration

```go
type RateLimitConfig struct {
    // Global limits
    GlobalMPS     uint32  // Messages per second
    GlobalBPS     uint64  // Bytes per second

    // Namespace defaults
    DefaultNamespaceMPS uint32
    DefaultNamespaceBPS uint64

    // Sender defaults
    DefaultSenderMPS    uint32
    DefaultSenderBPS    uint64

    // Peer relay limits
    PeerMPS      uint32
    PeerBPS      uint64

    // Burst allowances
    BurstMultiplier float64
}
```

Default values:
- `GlobalMPS: 100,000`
- `DefaultNamespaceMPS: 100`
- `DefaultSenderMPS: 10`
- `PeerMPS: 1,000`
- `BurstMultiplier: 3.0`

### 2. Namespace Rate Limiting

#### 2.1 Policy-Based Limits

From LP-6410, each namespace policy includes:

```go
type RateLimitPolicy struct {
    MessagesPerSecond uint32
    BytesPerSecond    uint64
    BurstMessages     uint32
    BurstBytes        uint64
}
```

#### 2.2 Enforcement

```go
type NamespaceRateLimiter struct {
    buckets map[[20]byte]*TokenBucket
    mu      sync.RWMutex
}

func (nrl *NamespaceRateLimiter) Allow(nsId [20]byte, msgSize uint32) bool {
    nrl.mu.RLock()
    bucket, ok := nrl.buckets[nsId]
    nrl.mu.RUnlock()

    if !ok {
        bucket = nrl.createBucket(nsId)
    }

    // Check both message count and byte limits
    if !bucket.AllowN(1) {
        return false
    }
    if !bucket.AllowBytes(msgSize) {
        return false
    }

    return true
}
```

#### 2.3 Token Bucket Algorithm

```go
type TokenBucket struct {
    rate       float64
    burst      float64
    tokens     float64
    lastUpdate time.Time
    mu         sync.Mutex
}

func (tb *TokenBucket) Allow() bool {
    tb.mu.Lock()
    defer tb.mu.Unlock()

    now := time.Now()
    elapsed := now.Sub(tb.lastUpdate).Seconds()

    // Refill tokens
    tb.tokens = min(tb.burst, tb.tokens + elapsed * tb.rate)
    tb.lastUpdate = now

    // Check availability
    if tb.tokens >= 1 {
        tb.tokens -= 1
        return true
    }

    return false
}
```

### 3. Sender Rate Limiting

#### 3.1 Per-Sender Tracking

```go
type SenderRateLimiter struct {
    // Rate limits by sender identity
    limiters map[Identity]*TokenBucket

    // Default config
    defaultMPS uint32
    defaultBPS uint64

    // Reputation-based adjustments
    reputation *ReputationManager
}

func (srl *SenderRateLimiter) GetLimit(sender Identity) RateLimit {
    baseLimit := RateLimit{
        MPS: srl.defaultMPS,
        BPS: srl.defaultBPS,
    }

    // Adjust based on reputation
    rep := srl.reputation.GetScore(sender)
    if rep > 0.8 {
        // High reputation: 2x limit
        baseLimit.MPS *= 2
        baseLimit.BPS *= 2
    } else if rep < 0.3 {
        // Low reputation: 0.5x limit
        baseLimit.MPS /= 2
        baseLimit.BPS /= 2
    }

    return baseLimit
}
```

#### 3.2 Sender Reputation

```go
type ReputationManager struct {
    scores map[Identity]float64
    history map[Identity][]ReputationEvent
}

type ReputationEvent struct {
    Timestamp uint64
    Type      EventType  // Valid, Invalid, Spam, Slow
    Impact    float64
}

func (rm *ReputationManager) UpdateScore(sender Identity, event ReputationEvent) {
    current := rm.scores[sender]

    // Decay existing score
    decay := 0.99
    current *= decay

    // Apply event impact
    current += event.Impact

    // Clamp to [0, 1]
    rm.scores[sender] = max(0, min(1, current))
}
```

### 4. Fee Proof Requirements

#### 4.1 Fee Proof Types

```go
type FeeProofType uint8

const (
    FeeProofNone       FeeProofType = 0  // No fee (rate limited)
    FeeProofPrepaid    FeeProofType = 1  // Prepaid quota
    FeeProofOnChain    FeeProofType = 2  // On-chain payment
    FeeProofChannel    FeeProofType = 3  // Payment channel
    FeeProofStake      FeeProofType = 4  // Stake-based
)
```

#### 4.2 Prepaid Quota

```go
type PrepaidQuota struct {
    Owner       Identity
    NamespaceId [20]byte      // Or zero for any namespace
    Messages    uint64
    Bytes       uint64
    ExpiresAt   uint64
    Signature   []byte        // Issuer signature
}

func VerifyPrepaidQuota(quota *PrepaidQuota, header *MsgHeader) bool {
    // Verify signature
    if !VerifySignature(quota, quota.Signature) {
        return false
    }

    // Check expiry
    if quota.ExpiresAt < time.Now().Unix() {
        return false
    }

    // Check namespace match
    if quota.NamespaceId != [20]byte{} && quota.NamespaceId != header.NamespaceId {
        return false
    }

    // Check remaining quota
    if quota.Messages == 0 || quota.Bytes < uint64(header.BlobLen) {
        return false
    }

    return true
}
```

#### 4.3 Stake-Based Access

```go
type StakeProof struct {
    Staker     Identity
    Amount     *big.Int
    ValidUntil uint64
    Proof      []byte  // Merkle proof of stake
}

func CalculateStakeLimit(stake *big.Int) RateLimit {
    // 1 LUX staked = 1 MPS baseline
    mps := stake.Div(stake, big.NewInt(1e18)).Uint64()

    return RateLimit{
        MPS: uint32(min(mps, MaxStakeMPS)),
        BPS: uint64(min(mps * 1024, MaxStakeBPS)),
    }
}
```

### 5. Spam Detection

#### 5.1 Content-Based Detection

```go
type SpamDetector struct {
    // Pattern matching
    patterns []*regexp.Regexp

    // ML-based classifier (optional)
    classifier *SpamClassifier

    // Bloom filter for duplicate detection
    seenContent *BloomFilter
}

func (sd *SpamDetector) IsSpam(msg *MsgHeader, blob []byte) (bool, float64) {
    score := 0.0

    // Check for duplicate content
    if sd.seenContent.Contains(sha3.Sum256(blob)) {
        score += 0.3
    }

    // Check for pattern matches
    for _, pattern := range sd.patterns {
        if pattern.Match(blob) {
            score += 0.5
        }
    }

    // ML classification (if available)
    if sd.classifier != nil {
        mlScore := sd.classifier.Predict(blob)
        score += mlScore * 0.5
    }

    return score > 0.7, score
}
```

#### 5.2 Behavioral Detection

```go
type BehaviorDetector struct {
    // Per-sender behavior tracking
    senderBehavior map[Identity]*SenderBehavior
}

type SenderBehavior struct {
    MessageTimes  []uint64  // Recent message timestamps
    ByteSizes     []uint32  // Recent message sizes
    Namespaces    [][20]byte // Namespaces used
    InvalidCount  uint32
    ValidCount    uint32
}

func (bd *BehaviorDetector) DetectAnomaly(sender Identity, msg *MsgHeader) bool {
    behavior := bd.senderBehavior[sender]

    // Check burst behavior
    if bd.isBursty(behavior.MessageTimes) {
        return true
    }

    // Check namespace spread (too many = suspicious)
    if len(uniqueNamespaces(behavior.Namespaces)) > 100 {
        return true
    }

    // Check invalid ratio
    totalMessages := behavior.InvalidCount + behavior.ValidCount
    if totalMessages > 100 && float64(behavior.InvalidCount)/float64(totalMessages) > 0.1 {
        return true
    }

    return false
}
```

### 6. Relay-Level Protection

#### 6.1 Connection Rate Limiting

```go
type ConnectionLimiter struct {
    // Per-IP connection limits
    ipLimits map[string]*rate.Limiter

    // Subnet-level limits
    subnetLimits map[string]*rate.Limiter

    // Config
    MaxConnectionsPerIP     int
    MaxConnectionsPerSubnet int
    ConnectionRatePerIP     rate.Limit
}

func (cl *ConnectionLimiter) AllowConnection(ip net.IP) bool {
    ipKey := ip.String()
    subnetKey := ip.Mask(net.CIDRMask(24, 32)).String()

    // Check IP limit
    if cl.ipLimits[ipKey].Tokens() <= 0 {
        return false
    }

    // Check subnet limit
    if cl.subnetLimits[subnetKey].Tokens() <= 0 {
        return false
    }

    cl.ipLimits[ipKey].Allow()
    cl.subnetLimits[subnetKey].Allow()

    return true
}
```

#### 6.2 Message Validation Pipeline

```go
func ValidateRelayMessage(msg *RelayMessage) error {
    // 1. Size check
    if len(msg.Payload) > MaxMessageSize {
        return ErrMessageTooLarge
    }

    // 2. Structural validation
    if err := msg.Validate(); err != nil {
        return err
    }

    // 3. Signature check
    if !VerifySignature(msg.Header, msg.Signature) {
        return ErrInvalidSignature
    }

    // 4. Rate limit check
    if !rateLimiter.Allow(msg.Header.NamespaceId, msg.Sender()) {
        return ErrRateLimited
    }

    // 5. Fee proof check
    if !ValidateFeeProof(msg.Header.FeeProof) {
        return ErrInvalidFeeProof
    }

    // 6. Spam check
    if isSpam, _ := spamDetector.IsSpam(msg.Header, msg.Blob); isSpam {
        return ErrSpamDetected
    }

    return nil
}
```

### 7. Abuse Response

#### 7.1 Automated Response

```go
type AbuseResponse struct {
    // Response actions
    Actions []ResponseAction
}

type ResponseAction struct {
    Type     ActionType
    Target   Identity
    Duration time.Duration
    Reason   string
}

type ActionType uint8
const (
    ActionWarn      ActionType = 1
    ActionThrottle  ActionType = 2
    ActionTemporaryBan ActionType = 3
    ActionPermanentBan ActionType = 4
    ActionReport    ActionType = 5
)

func (ar *AbuseResponse) HandleAbuse(abuse AbuseEvent) {
    severity := ar.CalculateSeverity(abuse)

    switch {
    case severity < 0.3:
        ar.Actions = append(ar.Actions, ResponseAction{
            Type:   ActionWarn,
            Target: abuse.Sender,
        })
    case severity < 0.6:
        ar.Actions = append(ar.Actions, ResponseAction{
            Type:     ActionThrottle,
            Target:   abuse.Sender,
            Duration: 1 * time.Hour,
        })
    case severity < 0.9:
        ar.Actions = append(ar.Actions, ResponseAction{
            Type:     ActionTemporaryBan,
            Target:   abuse.Sender,
            Duration: 24 * time.Hour,
        })
    default:
        ar.Actions = append(ar.Actions, ResponseAction{
            Type:   ActionPermanentBan,
            Target: abuse.Sender,
        })
    }
}
```

#### 7.2 Ban List Management

```go
type BanList struct {
    // Temporary bans
    tempBans map[Identity]time.Time

    // Permanent bans
    permBans map[Identity]bool

    // Shared ban list (from other relays)
    sharedBans *BloomFilter
}

func (bl *BanList) IsBanned(sender Identity) bool {
    // Check permanent bans
    if bl.permBans[sender] {
        return true
    }

    // Check temporary bans
    if expiry, ok := bl.tempBans[sender]; ok {
        if time.Now().Before(expiry) {
            return true
        }
        delete(bl.tempBans, sender)
    }

    // Check shared bans
    if bl.sharedBans.Contains(sender.Bytes()) {
        return true
    }

    return false
}
```

### 8. Metrics and Monitoring

#### 8.1 Abuse Metrics

| Metric | Description |
|--------|-------------|
| `abuse_rate_limited_total` | Rate-limited messages |
| `abuse_spam_detected_total` | Spam messages detected |
| `abuse_invalid_messages_total` | Invalid messages rejected |
| `abuse_bans_active` | Currently banned senders |
| `abuse_reputation_distribution` | Reputation score distribution |

#### 8.2 Alerting Rules

```yaml
alerts:
  - name: HighSpamRate
    condition: rate(abuse_spam_detected_total[5m]) > 100
    severity: warning

  - name: MassRateLimiting
    condition: rate(abuse_rate_limited_total[5m]) > 1000
    severity: critical

  - name: BanListGrowth
    condition: delta(abuse_bans_active[1h]) > 100
    severity: warning
```

## Rationale

### Why Multi-Layer Rate Limiting?

- Global limits protect network capacity
- Namespace limits ensure fair sharing
- Sender limits prevent individual abuse
- Peer limits protect individual nodes

### Why Fee Proofs?

- Enable high-throughput use cases
- Create economic cost for spam
- Allow permissionless access with limits

### Why Reputation?

- Rewards good behavior
- Gradually limits bad actors
- Avoids false positives on new users

## Security Considerations

### Rate Limit Bypass

Sybil attack with many identities:
- Stake requirements make Sybil expensive
- IP-level limits as backstop
- Reputation requires history

### Fee Proof Attacks

Forged or replayed proofs:
- Cryptographic signatures prevent forgery
- Nonces prevent replay
- On-chain verification as ground truth

### Spam Evolution

Spammers adapt to detection:
- ML models can be retrained
- Pattern lists are updatable
- Human review for edge cases

## Test Plan

### Unit Tests

1. **Token Bucket**: Correct refill and consumption
2. **Rate Limiting**: Limits enforced correctly
3. **Spam Detection**: Known spam rejected

### Integration Tests

1. **Multi-Layer Limits**: All layers work together
2. **Fee Proof Flow**: End-to-end proof verification
3. **Ban Propagation**: Bans shared between nodes

### Stress Tests

1. **Flood Test**: Network handles sustained flood
2. **Sybil Test**: Many identities from same source
3. **Mixed Load**: Legitimate + spam traffic

## References

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Google Cloud Armor](https://cloud.google.com/armor/docs/rate-limiting-overview)
- [Akismet Spam Detection](https://akismet.com/how/)

---

*LP-6422 v1.0.0 - 2026-01-02*
