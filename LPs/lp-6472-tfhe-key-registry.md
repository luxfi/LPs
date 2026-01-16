---
lp: 6472
title: LuxDA TFHE Key Registry
description: LuxDA TFHE Key Registry specification for LuxDA Bus
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

This LP defines the TFHE key registry for LuxDA, managing public keys and evaluation keys per namespace per epoch. The registry binds cryptographic keys to specific time periods and committees.

## Motivation

TFHE orchestration requires:

1. **Public Key Discovery**: Find encryption key for namespace
2. **Epoch Binding**: Keys change over time
3. **Committee Tracking**: Who holds decryption shares
4. **Evaluation Keys**: Keys for homomorphic operations

## Specification

### 1. Key Registry Structure

#### 1.1 Registry Entry

```go
type TFHEKeyEntry struct {
    // Identification
    NamespaceId [20]byte
    Epoch       uint64

    // Public key for encryption
    PublicKey []byte

    // Evaluation keys commitment (actual keys in DA)
    EvalKeysCommitment [32]byte

    // Committee
    Committee []Identity
    Threshold uint32

    // Validity
    ValidFrom uint64
    ValidTo   uint64

    // Registration
    RegisteredAt   uint64
    RegisteredInBlock uint64
    Signature      []byte
}
```

#### 1.2 Key Sizes

| Key Type | Size | Purpose |
|----------|------|---------|
| PublicKey | ~32 KiB | Encryption |
| EvalKeys (full) | ~100 MiB | All operations |
| EvalKeys (bootstrap) | ~10 MiB | Key switching |
| SecretKeyShare | ~16 KiB | Per committee member |

### 2. Registry Operations

#### 2.1 Register Keys

```go
func (kr *KeyRegistry) RegisterKeys(entry *TFHEKeyEntry) error {
    // Validate entry
    if err := kr.ValidateEntry(entry); err != nil {
        return err
    }

    // Check epoch doesn't overlap existing
    existing := kr.GetEntry(entry.NamespaceId, entry.Epoch)
    if existing != nil {
        return ErrEpochExists
    }

    // Verify committee signatures
    if err := kr.VerifyCommitteeSignatures(entry); err != nil {
        return err
    }

    // Store entry
    kr.entries[entryKey(entry.NamespaceId, entry.Epoch)] = entry

    return nil
}
```

#### 2.2 Get Public Key

```go
func (kr *KeyRegistry) GetPublicKey(nsId [20]byte, epoch uint64) ([]byte, error) {
    entry := kr.entries[entryKey(nsId, epoch)]
    if entry == nil {
        return nil, ErrKeyNotFound
    }

    // Check validity
    now := uint64(time.Now().Unix())
    if now < entry.ValidFrom || now > entry.ValidTo {
        return nil, ErrKeyExpired
    }

    return entry.PublicKey, nil
}
```

#### 2.3 Get Current Epoch

```go
func (kr *KeyRegistry) CurrentEpoch(nsId [20]byte) uint64 {
    now := uint64(time.Now().Unix())

    // Find entry valid at current time
    for _, entry := range kr.EntriesForNamespace(nsId) {
        if entry.ValidFrom <= now && now <= entry.ValidTo {
            return entry.Epoch
        }
    }

    return 0  // No valid epoch
}
```

### 3. Evaluation Keys

#### 3.1 Evaluation Key Types

```go
type EvalKeyType uint8
const (
    EvalBootstrapKey EvalKeyType = 1  // For key switching
    EvalMultKey      EvalKeyType = 2  // For multiplication
    EvalRotateKey    EvalKeyType = 3  // For rotation
    EvalAllKeys      EvalKeyType = 4  // Complete set
)
```

#### 3.2 Evaluation Key Retrieval

```go
func (kr *KeyRegistry) GetEvalKeys(nsId [20]byte, epoch uint64, keyType EvalKeyType) ([]byte, error) {
    entry := kr.entries[entryKey(nsId, epoch)]
    if entry == nil {
        return nil, ErrKeyNotFound
    }

    // Evaluation keys stored in DA
    cid := deriveCIDFromCommitment(entry.EvalKeysCommitment, keyType)

    // Fetch from content store
    return kr.contentStore.Get(cid)
}
```

#### 3.3 Evaluation Key Caching

```go
type EvalKeyCache struct {
    cache map[cacheKey]*CachedEvalKeys
    maxSize int
    lru *list.List
}

type CachedEvalKeys struct {
    Keys []byte
    LastUsed time.Time
}

func (ekc *EvalKeyCache) Get(nsId [20]byte, epoch uint64, keyType EvalKeyType) ([]byte, error) {
    key := cacheKey{nsId, epoch, keyType}

    if cached, ok := ekc.cache[key]; ok {
        cached.LastUsed = time.Now()
        return cached.Keys, nil
    }

    // Fetch and cache
    keys, err := ekc.registry.GetEvalKeys(nsId, epoch, keyType)
    if err != nil {
        return nil, err
    }

    ekc.cache[key] = &CachedEvalKeys{
        Keys:     keys,
        LastUsed: time.Now(),
    }

    ekc.evictIfNeeded()

    return keys, nil
}
```

### 4. Committee Management

#### 4.1 Committee Structure

```go
type TFHECommittee struct {
    // Members
    Members []CommitteeMember

    // Threshold for decryption
    Threshold uint32

    // Epoch this committee serves
    Epoch uint64
}

type CommitteeMember struct {
    Identity  Identity
    PublicKey []byte  // For share encryption
    Weight    uint32  // Voting weight
}
```

#### 4.2 Committee Selection

Default: validators subset

```go
func SelectCommittee(nsId [20]byte, epoch uint64, validators []Validator) *TFHECommittee {
    // Deterministic selection based on namespace and epoch
    seed := sha3.Sum256(nsId[:], uint64ToBytes(epoch), []byte("tfhe_committee"))
    rng := NewDeterministicRNG(seed)

    // Select subset of validators
    selected := selectByStake(validators, seed, TargetCommitteeSize)

    // Calculate threshold (2/3 by weight)
    totalWeight := sumWeight(selected)
    threshold := totalWeight * 2 / 3

    members := make([]CommitteeMember, len(selected))
    for i, v := range selected {
        members[i] = CommitteeMember{
            Identity:  v.Identity,
            PublicKey: v.TFHEPublicKey,
            Weight:    v.StakeWeight,
        }
    }

    return &TFHECommittee{
        Members:   members,
        Threshold: threshold,
        Epoch:     epoch,
    }
}
```

#### 4.3 Custom Committees

Groups can define custom committees:

```go
type CustomCommitteeConfig struct {
    // Explicit members
    Members []Identity

    // Threshold (absolute or percentage)
    Threshold uint32
    ThresholdPct uint8  // 0 = use absolute

    // Selection method
    SelectionMethod SelectionMethod
}

type SelectionMethod uint8
const (
    SelectExplicit    SelectionMethod = 1  // Explicit list
    SelectValidators  SelectionMethod = 2  // Subset of validators
    SelectGroupMembers SelectionMethod = 3 // Group members (for private groups)
)
```

### 5. Epoch Transitions

#### 5.1 Epoch Schedule

```go
type EpochSchedule struct {
    // Epoch duration
    Duration time.Duration

    // Overlap period (both epochs valid)
    OverlapDuration time.Duration

    // Key generation lead time
    KeyGenLeadTime time.Duration
}

var DefaultEpochSchedule = EpochSchedule{
    Duration:        1 * time.Hour,
    OverlapDuration: 5 * time.Minute,
    KeyGenLeadTime:  10 * time.Minute,
}
```

#### 5.2 Epoch Timeline

```
Epoch N-1     |=============================|
Epoch N           |=============================|
                  ^                             ^
                  |                             |
              Overlap start               Overlap end
              (both valid)               (N-1 invalid)
```

### 6. Wire Format

#### 6.1 Registry Entry Encoding

```
TFHEKeyEntryV1 := {
    version:           uint8    [1 byte]
    namespaceId:       bytes20  [20 bytes]
    epoch:             uint64   [8 bytes]
    publicKeyLen:      uint32   [4 bytes]
    publicKey:         bytes    [publicKeyLen bytes]
    evalKeysCommitment: bytes32 [32 bytes]
    numCommittee:      uint16   [2 bytes]
    committee:         []Identity [variable]
    threshold:         uint32   [4 bytes]
    validFrom:         uint64   [8 bytes]
    validTo:           uint64   [8 bytes]
    signatureLen:      uint16   [2 bytes]
    signature:         bytes    [signatureLen bytes]
}
```

### 7. On-Chain Registry

#### 7.1 Smart Contract Interface

```solidity
interface ITFHEKeyRegistry {
    struct KeyEntry {
        uint64 epoch;
        bytes publicKey;
        bytes32 evalKeysCommitment;
        address[] committee;
        uint32 threshold;
        uint64 validFrom;
        uint64 validTo;
    }

    function registerKey(
        bytes20 namespaceId,
        KeyEntry calldata entry,
        bytes[] calldata signatures
    ) external;

    function getPublicKey(bytes20 namespaceId, uint64 epoch)
        external view returns (bytes memory);

    function getCurrentEpoch(bytes20 namespaceId)
        external view returns (uint64);

    function getCommittee(bytes20 namespaceId, uint64 epoch)
        external view returns (address[] memory, uint32);

    event KeyRegistered(
        bytes20 indexed namespaceId,
        uint64 indexed epoch,
        bytes32 publicKeyHash
    );
}
```

### 8. Key Derivation

#### 8.1 From DKG Transcript

```go
func DeriveKeysFromTranscript(transcript *DKGTranscript) (*TFHEKeyEntry, error) {
    // Extract public key
    publicKey := transcript.AggregatePublicKey()

    // Generate evaluation keys
    evalKeys := GenerateEvalKeys(publicKey)

    // Store eval keys in DA
    cid, _ := contentStore.Put(evalKeys)

    return &TFHEKeyEntry{
        NamespaceId:        transcript.NamespaceId,
        Epoch:              transcript.Epoch,
        PublicKey:          publicKey,
        EvalKeysCommitment: cidToCommitment(cid),
        Committee:          transcript.Participants,
        Threshold:          transcript.Threshold,
    }, nil
}
```

## Rationale

### Why Per-Namespace?

- Different namespaces may need different committees
- Privacy boundaries
- Independent key management

### Why Epochs?

- Regular key rotation
- Limit exposure from compromise
- Support committee changes

### Why On-Chain Registry?

- Canonical source of truth
- Verifiable by all
- Integrated with staking/slashing

## Security Considerations

### Key Availability

- Evaluation keys stored in DA
- Redundant storage
- Cache at nodes

### Committee Liveness

- Threshold design tolerates failures
- Resharing for member changes
- Incentives for availability

### Key Compromise

- Epoch limits exposure
- Forward secrecy via rotation
- Detection via disputes

## Test Plan

### Unit Tests

1. **Registration**: Valid/invalid entries
2. **Lookup**: Current epoch, specific epoch
3. **Epoch Transition**: Overlap handling

### Integration Tests

1. **DKG → Registry**: Full key generation
2. **Multi-Namespace**: Multiple namespaces
3. **Committee Change**: Resharing

## References

- [Threshold FHE](https://eprint.iacr.org/2022/164)
- [DKG Protocols](https://eprint.iacr.org/2021/005)
- [Key Management for FHE](https://eprint.iacr.org/2023/481)

---

*LP-6472 v1.0.0 - 2026-01-02*
