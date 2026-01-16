---
lp: 6475
title: LuxDA Sealed Messages
description: LuxDA Sealed Messages specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [5702, 5340]
tags: [luxda-bus, tfhe, threshold-crypto, fhe]
---

## Abstract

This LP defines sealed message mode for LuxDA, where message content is encrypted under threshold TFHE and only revealed when specified conditions are met. This enables time-lock encryption, commit-reveal schemes, and other sealed-bid patterns.

## Motivation

Sealed messages enable:

1. **Time-Lock**: Content revealed after time
2. **Commit-Reveal**: Commit now, reveal later
3. **Sealed Bids**: Bid without revealing amount
4. **Dead Man's Switch**: Reveal if no heartbeat

## Specification

### 1. Sealed Message Structure

#### 1.1 Sealed Envelope

```go
type SealedMessage struct {
    // Envelope metadata (public)
    Version       uint8
    NamespaceId   [20]byte
    Epoch         uint64
    SenderPubKey  []byte

    // Encrypted payload key
    EncryptedKey []byte  // TFHE encrypted AES key

    // AES-encrypted content
    EncryptedContent []byte
    ContentMAC       []byte

    // Reveal conditions
    RevealConditions *RevealConditions

    // Signature
    Signature []byte
}
```

#### 1.2 Two-Layer Encryption

```
Original Content
       ↓
  AES-256-GCM (with random key K)
       ↓
  Encrypted Content
       +
  Key K encrypted under TFHE (to committee)
       ↓
  Sealed Message
```

### 2. Reveal Conditions

#### 2.1 Condition Types

```go
type RevealConditions struct {
    // Primary condition
    Primary RevealCondition

    // Alternative conditions (OR)
    Alternatives []RevealCondition

    // Required signatures for override
    OverrideThreshold uint32
    OverrideSigners   []Identity
}

type RevealCondition struct {
    Type      ConditionType
    Params    []byte
    Deadline  uint64  // Must be met by this time, or message expires
}

type ConditionType uint8
const (
    // Time-based
    ConditionAfterTimestamp  ConditionType = 1
    ConditionAfterBlock      ConditionType = 2
    ConditionAfterDuration   ConditionType = 3

    // Event-based
    ConditionOnEvent         ConditionType = 4
    ConditionOnInclusion     ConditionType = 5

    // Approval-based
    ConditionNofMApproval    ConditionType = 6
    ConditionSenderApproval  ConditionType = 7

    // Absence-based (dead man's switch)
    ConditionNoHeartbeat     ConditionType = 8
)
```

#### 2.2 Time-Lock Condition

```go
type TimeLockParams struct {
    ReleaseTime uint64
}

func CheckTimeLock(params []byte) bool {
    var tlp TimeLockParams
    cbor.Unmarshal(params, &tlp)
    return uint64(time.Now().Unix()) >= tlp.ReleaseTime
}
```

#### 2.3 Dead Man's Switch

```go
type DeadManSwitchParams struct {
    HeartbeatInterval uint64
    LastHeartbeat     uint64
}

func CheckDeadManSwitch(params []byte, state *SealedMessageState) bool {
    var dms DeadManSwitchParams
    cbor.Unmarshal(params, &dms)

    lastHB := state.LastHeartbeat
    return uint64(time.Now().Unix()) > lastHB + dms.HeartbeatInterval
}

func SendHeartbeat(sealedMsgID [32]byte, senderSig []byte) error {
    // Update last heartbeat
    state := getSealedMessageState(sealedMsgID)
    state.LastHeartbeat = uint64(time.Now().Unix())
    return nil
}
```

### 3. Sealing Process

#### 3.1 Seal Message

```go
func SealMessage(
    content []byte,
    conditions *RevealConditions,
    nsId [20]byte,
    epoch uint64,
) (*SealedMessage, error) {
    // Generate random AES key
    aesKey := make([]byte, 32)
    rand.Read(aesKey)

    // Encrypt content with AES
    nonce := make([]byte, 12)
    rand.Read(nonce)
    aead, _ := cipher.NewGCM(aes.NewCipher(aesKey))
    encryptedContent := aead.Seal(nonce, nonce, content, nil)

    // Encrypt AES key under TFHE
    pk, _ := keyRegistry.GetPublicKey(nsId, epoch)
    encryptedKey := tfhe.EncryptBytes(pk, aesKey)

    return &SealedMessage{
        Version:          1,
        NamespaceId:      nsId,
        Epoch:            epoch,
        EncryptedKey:     encryptedKey,
        EncryptedContent: encryptedContent,
        RevealConditions: conditions,
    }, nil
}
```

### 4. Unsealing Process

#### 4.1 Request Unseal

```go
type UnsealRequest struct {
    SealedMsgRef  [32]byte
    Requester     Identity
    ConditionMet  ConditionType
    ConditionProof []byte
    Signature     []byte
}

func RequestUnseal(sealed *SealedMessage, conditionProof []byte) (*UnsealRequest, error) {
    // Identify which condition is met
    metCondition := findMetCondition(sealed.RevealConditions, conditionProof)
    if metCondition == nil {
        return nil, ErrNoConditionMet
    }

    return &UnsealRequest{
        SealedMsgRef:   computeSealedMsgRef(sealed),
        ConditionMet:   metCondition.Type,
        ConditionProof: conditionProof,
    }, nil
}
```

#### 4.2 Unseal Execution

```go
func Unseal(sealed *SealedMessage, shares []*DecryptionShare) ([]byte, error) {
    // Combine shares to decrypt TFHE key
    decryptedKey, err := CombineDecryptShares(shares, threshold)
    if err != nil {
        return nil, err
    }

    // Extract AES key
    aesKey := tfhe.DecodeBytes(decryptedKey)

    // Decrypt content
    nonce := sealed.EncryptedContent[:12]
    ciphertext := sealed.EncryptedContent[12:]
    aead, _ := cipher.NewGCM(aes.NewCipher(aesKey))

    plaintext, err := aead.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return nil, ErrDecryptionFailed
    }

    return plaintext, nil
}
```

### 5. Sealed Message Lifecycle

#### 5.1 State Machine

```
Created → Pending → [Condition Met] → Unsealing → Revealed
                 → [Expired] → Expired
                 → [Cancelled] → Cancelled
```

#### 5.2 State Transitions

```go
type SealedMessageState struct {
    Status        SealedStatus
    CreatedAt     uint64
    LastHeartbeat uint64
    UnsealedAt    uint64
    ExpiredAt     uint64
}

type SealedStatus uint8
const (
    SealedPending   SealedStatus = 1
    SealedUnsealing SealedStatus = 2
    SealedRevealed  SealedStatus = 3
    SealedExpired   SealedStatus = 4
    SealedCancelled SealedStatus = 5
)
```

### 6. Sender Controls

#### 6.1 Cancel Sealed Message

```go
type CancelRequest struct {
    SealedMsgRef [32]byte
    Reason       string
    SenderSig    []byte
}

func CancelSealed(req *CancelRequest) error {
    state := getSealedMessageState(req.SealedMsgRef)

    // Only pending messages can be cancelled
    if state.Status != SealedPending {
        return ErrCannotCancel
    }

    // Verify sender signature
    if !verifySenderSignature(req) {
        return ErrInvalidSignature
    }

    // Check cancellation allowed by conditions
    if !canCancel(state) {
        return ErrCancellationNotAllowed
    }

    state.Status = SealedCancelled
    return nil
}
```

#### 6.2 Update Conditions

```go
func UpdateConditions(
    sealedMsgRef [32]byte,
    newConditions *RevealConditions,
    senderSig []byte,
) error {
    // Verify sender
    // Check update allowed
    // Apply new conditions
    // Note: Cannot make conditions less restrictive
}
```

### 7. UX Constraints

#### 7.1 Explicit Opt-In

```go
// Sealed mode requires explicit namespace flag
type NamespacePolicy struct {
    SealedModeAllowed bool  // Must be true
}
```

#### 7.2 Visibility

```go
// Recipients see sealed envelope, not content
type SealedMessageView struct {
    From       Identity
    SentAt     uint64
    Status     SealedStatus
    Conditions *RevealConditions  // Public
    Preview    []byte            // Optional encrypted preview
}
```

#### 7.3 Expiration

All sealed messages MUST have expiration:

```go
const (
    MaxSealDuration = 365 * 24 * time.Hour  // 1 year max
    DefaultExpiry   = 30 * 24 * time.Hour   // 30 days default
)
```

### 8. Use Cases

#### 8.1 Time-Locked Will

```go
func CreateTimeLockWill(content []byte, releaseDate time.Time) (*SealedMessage, error) {
    conditions := &RevealConditions{
        Primary: RevealCondition{
            Type:   ConditionAfterTimestamp,
            Params: encodeTimestamp(releaseDate),
        },
        Alternatives: []RevealCondition{
            {
                Type:   ConditionNofMApproval,
                Params: encodeApprovers(executors, 2, 3),
            },
        },
    }

    return SealMessage(content, conditions, willNsId, currentEpoch)
}
```

#### 8.2 Sealed Bid

```go
func CreateSealedBid(amount uint64, auctionId [32]byte) (*SealedMessage, error) {
    conditions := &RevealConditions{
        Primary: RevealCondition{
            Type:   ConditionOnEvent,
            Params: encodeBidRevealEvent(auctionId),
        },
    }

    bidContent := encodeBid(amount, auctionId)
    return SealMessage(bidContent, conditions, auctionNsId, currentEpoch)
}
```

#### 8.3 Dead Man's Switch

```go
func CreateDeadManSwitch(content []byte, checkIn time.Duration) (*SealedMessage, error) {
    conditions := &RevealConditions{
        Primary: RevealCondition{
            Type: ConditionNoHeartbeat,
            Params: encodeHeartbeatParams(checkIn),
        },
        Alternatives: []RevealCondition{
            {
                Type:   ConditionSenderApproval,
                Params: nil,
            },
        },
    }

    return SealMessage(content, conditions, dmsNsId, currentEpoch)
}
```

## Rationale

### Why Two-Layer Encryption?

- TFHE ciphertext size independent of content
- Efficient for large content
- Standard pattern

### Why Explicit Conditions?

- Transparency about reveal rules
- Auditable
- Programmable

### Why Max Duration?

- Committee changes over time
- Key rotation
- Prevent stale sealed messages

## Security Considerations

### Key Escrow

Committee collectively holds unsealing power.
Choose appropriate committee for trust model.

### Premature Reveal

Mitigated by:
- Condition verification
- Multiple committee members
- Honest threshold assumption

### Denied Reveal

Mitigated by:
- Liveness assumptions
- Alternative conditions
- Override mechanisms

## Test Plan

### Unit Tests

1. **Seal/Unseal**: Round-trip encryption
2. **Conditions**: All condition types
3. **Lifecycle**: State transitions

### Integration Tests

1. **Time-Lock**: Wait and reveal
2. **Dead Man's Switch**: Heartbeat, timeout
3. **Multi-Condition**: Alternative triggers

### Security Tests

1. **Premature Unseal**: Reject before condition
2. **Expired Message**: Handle expiration
3. **Invalid Proofs**: Reject bad condition proofs

## References

- [Time-Lock Puzzles](https://people.csail.mit.edu/rivest/pubs/RSW96.pdf)
- [Witness Encryption](https://eprint.iacr.org/2013/258)
- [Threshold FHE](https://eprint.iacr.org/2022/164)

---

*LP-6475 v1.0.0 - 2026-01-02*
