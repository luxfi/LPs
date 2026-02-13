---
lp: 6431
title: LuxDA Availability Certificates
description: LuxDA Availability Certificates specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the availability certificate system for LuxDA v1. In certificate mode, a committee of DA operators attests to blob availability, providing a trust-based but efficient availability guarantee with a clear upgrade path to DAS (LP-6433).

## Motivation

Certificate-based DA provides:

1. **Simplicity**: Single attestation round, no sampling protocol
2. **Speed**: Fast availability confirmation (~500ms)
3. **Compatibility**: Works with existing validator infrastructure
4. **Upgrade Path**: Same API, swap to DAS later

The trade-off is trust in the operator committee rather than cryptoeconomic guarantees.

## Specification

### 1. Operator Committee

#### 1.1 Operator Registration

```go
type DAOperator struct {
    // Operator identity
    OperatorID   [32]byte
    PublicKey    []byte
    SignatureKey []byte  // For attestations

    // Endpoints
    RPCEndpoint  string
    P2PEndpoint  string

    // Stake
    StakeAmount  *big.Int
    StakeExpiry  uint64

    // Capacity
    StorageBytes uint64
    BandwidthBps uint64

    // Status
    Active       bool
    RegisteredAt uint64
}
```

#### 1.2 Committee Selection

```go
type Committee struct {
    Epoch       uint64
    Members     []DAOperator
    Threshold   uint32  // Signatures needed for cert
    TotalWeight uint64
}

func SelectCommittee(epoch uint64, operators []DAOperator) *Committee {
    // Filter active operators
    active := filter(operators, func(op DAOperator) bool {
        return op.Active && op.StakeExpiry > epoch
    })

    // Sort by stake-weighted random selection
    seed := sha3.Sum256(epoch || "committee")
    sorted := stakeSortWithSeed(active, seed)

    // Select top N
    members := sorted[:min(len(sorted), TargetCommitteeSize)]

    // Calculate threshold (2/3 by stake)
    totalStake := sumStake(members)
    threshold := calculateThreshold(members, totalStake * 2 / 3)

    return &Committee{
        Epoch:       epoch,
        Members:     members,
        Threshold:   threshold,
        TotalWeight: totalStake,
    }
}
```

### 2. Certificate Structure

#### 2.1 Availability Certificate

```go
type AvailabilityCert struct {
    // Blob identification
    BlobCommitment [32]byte
    BlobLen        uint32

    // Timing
    Epoch          uint64
    Timestamp      uint64

    // Attestations
    Signers        []uint32           // Committee member indices
    AggSignature   []byte             // Aggregated signature
    SignerBitfield []byte             // Bitfield of signers

    // Erasure coding info
    NumChunks      uint32
    ParityChunks   uint32
    ChunkSize      uint32

    // Committee reference
    CommitteeRoot  [32]byte           // Merkle root of committee
}
```

#### 2.2 Wire Format

```
AvailabilityCertV1 := {
    version:        uint8    [1 byte]
    blobCommitment: bytes32  [32 bytes]
    blobLen:        uint32   [4 bytes]
    epoch:          uint64   [8 bytes]
    timestamp:      uint64   [8 bytes]
    numSigners:     uint16   [2 bytes]
    signerBitfield: bytes    [ceil(committeeSize/8) bytes]
    aggSignatureLen: uint16  [2 bytes]
    aggSignature:   bytes    [aggSignatureLen bytes]
    numChunks:      uint32   [4 bytes]
    parityChunks:   uint32   [4 bytes]
    chunkSize:      uint32   [4 bytes]
    committeeRoot:  bytes32  [32 bytes]
}
```

### 3. Dispersal Protocol

#### 3.1 Dispersal Request

```go
type DispersalRequest struct {
    // Blob data
    BlobCommitment [32]byte
    Chunks         [][]byte  // Erasure-coded chunks
    Proofs         [][]byte  // Chunk validity proofs (optional)

    // Metadata
    NamespaceId    [20]byte
    Epoch          uint64
    Timestamp      uint64

    // Authentication
    DisperserSig   []byte
}
```

#### 3.2 Dispersal Flow

```
                  Disperser
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
       Operator1  Operator2  Operator3
          │          │          │
          └──────────┼──────────┘
                     │
              Attestations
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
       Sign(chunk)  Sign(chunk)  Sign(chunk)
          │          │          │
          └──────────┼──────────┘
                     │
               Aggregation
                     │
                     ▼
            AvailabilityCert
```

#### 3.3 Operator Storage

```go
func (op *Operator) HandleDispersalRequest(req *DispersalRequest) (*Attestation, error) {
    // Verify request
    if !op.VerifyDisperserSig(req) {
        return nil, ErrInvalidSignature
    }

    // Identify my chunks
    myChunks := op.SelectMyChunks(req.BlobCommitment, req.Chunks)

    // Verify chunk proofs (if KZG)
    for _, chunk := range myChunks {
        if !op.VerifyChunkProof(chunk) {
            return nil, ErrInvalidChunkProof
        }
    }

    // Store chunks
    for _, chunk := range myChunks {
        op.Store.Put(req.BlobCommitment, chunk.Index, chunk.Data)
    }

    // Create attestation
    attestation := &Attestation{
        BlobCommitment: req.BlobCommitment,
        OperatorID:     op.ID,
        ChunkIndices:   extractIndices(myChunks),
        Timestamp:      time.Now().Unix(),
    }

    // Sign attestation
    attestation.Signature = op.Sign(attestation.Hash())

    return attestation, nil
}
```

### 4. Attestation Protocol

#### 4.1 Attestation Structure

```go
type Attestation struct {
    BlobCommitment [32]byte
    OperatorID     [32]byte
    ChunkIndices   []uint32
    Timestamp      uint64
    Signature      []byte
}

func (a *Attestation) Hash() [32]byte {
    return sha3.Sum256(
        a.BlobCommitment[:],
        a.OperatorID[:],
        encodeUints(a.ChunkIndices),
        uint64ToBytes(a.Timestamp),
    )
}
```

#### 4.2 Attestation Aggregation

```go
func AggregateAttestations(attestations []*Attestation, committee *Committee) (*AvailabilityCert, error) {
    // Verify quorum
    totalWeight := uint64(0)
    for _, att := range attestations {
        member := committee.GetMember(att.OperatorID)
        if member == nil {
            continue
        }
        totalWeight += member.StakeAmount.Uint64()
    }

    if totalWeight < committee.TotalWeight * 2 / 3 {
        return nil, ErrInsufficientQuorum
    }

    // Aggregate signatures (BLS)
    sigs := make([][]byte, len(attestations))
    for i, att := range attestations {
        sigs[i] = att.Signature
    }
    aggSig := BLSAggregate(sigs)

    // Build signer bitfield
    bitfield := make([]byte, (len(committee.Members)+7)/8)
    for _, att := range attestations {
        idx := committee.GetMemberIndex(att.OperatorID)
        bitfield[idx/8] |= 1 << (idx % 8)
    }

    return &AvailabilityCert{
        BlobCommitment:  attestations[0].BlobCommitment,
        AggSignature:    aggSig,
        SignerBitfield:  bitfield,
        // ... other fields
    }, nil
}
```

### 5. Certificate Verification

#### 5.1 Verification Algorithm

```go
func VerifyCert(cert *AvailabilityCert, committee *Committee) error {
    // 1. Verify committee reference
    if MerkleRoot(committee.Members) != cert.CommitteeRoot {
        return ErrCommitteeMismatch
    }

    // 2. Extract signers from bitfield
    signers := extractSigners(cert.SignerBitfield, committee)

    // 3. Verify quorum
    signerWeight := sumStake(signers)
    if signerWeight < committee.TotalWeight * 2 / 3 {
        return ErrInsufficientQuorum
    }

    // 4. Verify aggregate signature
    message := CertMessage(cert.BlobCommitment, cert.Epoch, cert.Timestamp)
    pubkeys := extractPubkeys(signers)
    if !BLSVerify(pubkeys, message, cert.AggSignature) {
        return ErrInvalidSignature
    }

    return nil
}
```

#### 5.2 Light Client Verification

Light clients can verify with:
1. Current committee root (from header chain)
2. Certificate
3. No need for full blob

```go
func LightVerifyCert(cert *AvailabilityCert, committeeRoot [32]byte) bool {
    // Trust the committee root from header chain
    if cert.CommitteeRoot != committeeRoot {
        return false
    }

    // Verify signature and quorum
    // (requires committee member pubkeys - can be cached)
    return VerifySignatureAndQuorum(cert)
}
```

### 6. Challenge Protocol

#### 6.1 Availability Challenge

When a client cannot retrieve data:

```go
type AvailabilityChallenge struct {
    BlobCommitment  [32]byte
    CertRef         [32]byte  // Reference to certificate
    Challenger      Identity
    Bond            *big.Int
    Deadline        uint64
    Status          ChallengeStatus
}

type ChallengeStatus uint8
const (
    ChallengePending   ChallengeStatus = 0
    ChallengeResponded ChallengeStatus = 1
    ChallengeSuccess   ChallengeStatus = 2
    ChallengeFailed    ChallengeStatus = 3
)
```

#### 6.2 Challenge Response

Operators must respond with data or be slashed:

```go
func (op *Operator) RespondToChallenge(challenge *AvailabilityChallenge) (*ChallengeResponse, error) {
    // Retrieve chunks
    chunks := op.Store.GetChunks(challenge.BlobCommitment)

    // Create response with proofs
    response := &ChallengeResponse{
        ChallengeID:    challenge.ID,
        Chunks:         chunks,
        ChunkProofs:    generateProofs(chunks, challenge.BlobCommitment),
        OperatorID:     op.ID,
        Signature:      op.Sign(challengeMessage(challenge)),
    }

    return response, nil
}
```

#### 6.3 Slashing

```go
func ProcessChallenge(challenge *AvailabilityChallenge, responses []*ChallengeResponse) SlashingResult {
    // Check if enough responses to reconstruct
    validChunks := collectValidChunks(responses)

    if len(validChunks) >= DataChunkThreshold {
        // Data is available - slash challenger
        return SlashingResult{
            SlashChallenger: true,
            Amount:          challenge.Bond,
        }
    }

    // Identify non-responding operators
    nonResponders := findNonResponders(challenge, responses)

    return SlashingResult{
        SlashOperators: nonResponders,
        Amount:         OperatorSlashAmount,
    }
}
```

### 7. Committee Rotation

#### 7.1 Epoch Transition

```go
func RotateCommittee(currentEpoch uint64, operators []DAOperator) *Committee {
    newEpoch := currentEpoch + 1

    // Select new committee
    newCommittee := SelectCommittee(newEpoch, operators)

    // Handoff period: both committees active
    handoffDuration := EpochDuration / 4

    return newCommittee
}
```

#### 7.2 Data Migration

During rotation, data must be available from both committees:

```go
func MigrateData(oldCommittee, newCommittee *Committee, blobs []BlobCommitment) error {
    for _, blob := range blobs {
        // New operators fetch from old
        for _, newOp := range newCommittee.Members {
            if !oldCommittee.HasMember(newOp.OperatorID) {
                chunks := fetchFromOldCommittee(blob, oldCommittee)
                newOp.Store.Put(blob, chunks)
            }
        }
    }
    return nil
}
```

### 8. Metrics

| Metric | Description |
|--------|-------------|
| `da_cert_created_total` | Certificates created |
| `da_cert_verification_latency` | Certificate verification time |
| `da_attestation_latency` | Time to collect attestations |
| `da_quorum_ratio` | Ratio of responding operators |
| `da_challenge_total` | Challenges submitted |
| `da_challenge_success_rate` | Successful challenges |

## Rationale

### Why BLS Aggregation?

- Constant-size signatures regardless of signer count
- Efficient verification
- Standard in blockchain systems

### Why 2/3 Quorum?

- Matches BFT assumptions
- Tolerates 1/3 Byzantine operators
- Standard threshold for safety

### Why Challenge Protocol?

- Creates accountability
- Enables slashing for dishonest operators
- Provides recourse for unavailability

## Backwards Compatibility

This LP defines the V1 availability certificate for the LuxDA Bus. As a new component, it does not break any existing protocols. Future versions of the certificate format will be versioned, and nodes will be expected to support multiple versions during upgrade periods to ensure a smooth transition.

## Security Considerations

### Committee Collusion

Risk: 2/3 of committee colludes to attest unavailable data

Mitigations:
- Large, diverse committee
- Stake slashing
- Challenge mechanism
- Eventual DAS upgrade

### Attestation Replay

Risk: Replay old attestation for new blob

Mitigations:
- Blob commitment in attestation
- Epoch binding
- Timestamp freshness

### Eclipse Attack on Disperser

Risk: Prevent disperser from reaching operators

Mitigations:
- Multiple dispersers
- Diverse network paths
- Timeout and retry

## Test Plan

### Unit Tests

1. **Attestation Signing**: Correct signature generation
2. **Aggregation**: Correct BLS aggregation
3. **Verification**: Accept valid, reject invalid certs

### Integration Tests

1. **Full Dispersal**: End-to-end dispersal and retrieval
2. **Committee Rotation**: Smooth handoff between epochs
3. **Challenge Resolution**: Challenge and response flow

### Adversarial Tests

1. **Byzantine Operators**: 1/3 operators malicious
2. **Network Partition**: Committee partially reachable
3. **Data Withholding**: Operators attest but don't serve

## References

- [EigenDA Operator Design](https://docs.eigenda.xyz/)
- [BLS Signature Aggregation](https://crypto.stanford.edu/~dabo/pubs/papers/BLSmultisig.html)
- [Danksharding Research](https://notes.ethereum.org/@dankrad/new_sharding)

---

*LP-6431 v1.0.0 - 2026-01-02*
