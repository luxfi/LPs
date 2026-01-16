---
lp: 6473
title: LuxDA TFHE DKG Protocol
description: LuxDA TFHE DKG Protocol specification for LuxDA Bus
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

This LP defines the Distributed Key Generation (DKG) and resharing protocol for TFHE keys, running over LuxDA Bus namespaces. Committees generate threshold keys without any single party knowing the full secret.

## Motivation

Threshold TFHE requires:

1. **Distributed Generation**: No trusted dealer
2. **Verifiable**: All can verify correct generation
3. **Resharing**: Update committee without re-encrypting
4. **Bus-Native**: Protocol runs over LuxDA messages

## Specification

### 1. DKG Namespace

#### 1.1 Derived Namespace

```go
func DKGNamespace(parentNs [20]byte) [20]byte {
    return DeriveNamespace("lux.dkg.v1", parentNs[:])
}
```

#### 1.2 DKG Policy

DKG namespaces have special policy:

```go
var DKGNamespacePolicy = NamespacePolicy{
    WriterMode:     WriterModeAllowlist,
    Writers:        committee,  // Only committee members
    EncryptionMode: EncryptionPlaintext,  // DKG messages are public
    TFHEOrch:       false,  // Not orchestration lane
}
```

### 2. DKG Protocol

#### 2.1 Protocol Phases

```
Phase 1: Commitment (each participant broadcasts commitment)
Phase 2: Share Distribution (each sends encrypted shares)
Phase 3: Verification (verify received shares)
Phase 4: Finalization (aggregate public key, store in registry)
```

#### 2.2 Message Types

```go
type DKGMessageType uint8
const (
    DKGStart       DKGMessageType = 1
    DKGCommit      DKGMessageType = 2
    DKGShare       DKGMessageType = 3
    DKGComplaint   DKGMessageType = 4
    DKGResponse    DKGMessageType = 5
    DKGFinalize    DKGMessageType = 6
)

type DKGMessage struct {
    Type        DKGMessageType
    Round       uint32
    Sender      Identity
    Payload     []byte
    Signature   []byte
}
```

#### 2.3 Phase 1: Commitment

```go
type DKGCommitment struct {
    // Feldman commitment coefficients
    Coefficients [][]byte  // G1 points

    // Proof of knowledge
    ProofOfKnowledge []byte
}

func (p *DKGParticipant) GenerateCommitment() (*DKGCommitment, error) {
    // Generate random polynomial f(x) of degree t-1
    p.polynomial = generateRandomPolynomial(p.threshold - 1)

    // Compute Feldman commitments: C_i = g^{a_i}
    coefficients := make([][]byte, p.threshold)
    for i := uint32(0); i < p.threshold; i++ {
        coefficients[i] = scalarMult(p.polynomial[i], generatorG1)
    }

    // Generate proof of knowledge of a_0
    pok := generatePOK(p.polynomial[0])

    return &DKGCommitment{
        Coefficients:     coefficients,
        ProofOfKnowledge: pok,
    }, nil
}
```

#### 2.4 Phase 2: Share Distribution

```go
type DKGShare struct {
    // Recipient index
    RecipientIdx uint32

    // Encrypted share
    EncryptedShare []byte

    // Commitment to share
    ShareCommitment []byte
}

func (p *DKGParticipant) GenerateShares(recipients []CommitteeMember) ([]*DKGShare, error) {
    shares := make([]*DKGShare, len(recipients))

    for i, recipient := range recipients {
        // Evaluate polynomial at recipient's index
        shareValue := evaluatePolynomial(p.polynomial, uint64(i+1))

        // Encrypt share to recipient's public key
        encrypted := hpkeEncrypt(recipient.PublicKey, shareValue)

        // Compute commitment for verification
        commitment := scalarMult(shareValue, generatorG1)

        shares[i] = &DKGShare{
            RecipientIdx:    uint32(i),
            EncryptedShare:  encrypted,
            ShareCommitment: commitment,
        }
    }

    return shares, nil
}
```

#### 2.5 Phase 3: Verification

```go
func (p *DKGParticipant) VerifyShare(share *DKGShare, senderCommitment *DKGCommitment) error {
    // Decrypt share
    shareValue, err := hpkeDecrypt(p.privateKey, share.EncryptedShare)
    if err != nil {
        return err
    }

    // Verify against Feldman commitment
    // g^{s_i} should equal ∏_j C_j^{i^j}
    expected := computeFeldmanVerification(senderCommitment.Coefficients, p.myIndex)
    actual := scalarMult(shareValue, generatorG1)

    if !bytes.Equal(expected, actual) {
        return ErrInvalidShare
    }

    p.receivedShares[share.SenderIdx] = shareValue
    return nil
}
```

#### 2.6 Complaint Protocol

```go
type DKGComplaint struct {
    // Against whom
    AccusedIdx uint32

    // The invalid share
    Share *DKGShare

    // Decryption proof
    DecryptionProof []byte
}

func (p *DKGParticipant) FileComplaint(accusedIdx uint32, share *DKGShare) *DKGComplaint {
    // Generate proof that we decrypted correctly
    proof := generateDecryptionProof(p.privateKey, share.EncryptedShare)

    return &DKGComplaint{
        AccusedIdx:      accusedIdx,
        Share:           share,
        DecryptionProof: proof,
    }
}
```

#### 2.7 Phase 4: Finalization

```go
type DKGFinalization struct {
    // Aggregate public key
    PublicKey []byte

    // Transcript commitment
    TranscriptCommitment [32]byte

    // Signatures from participants
    Signatures [][]byte
}

func (p *DKGParticipant) Finalize() (*DKGFinalization, error) {
    // Sum all received shares to get own secret share
    p.secretShare = sumShares(p.receivedShares)

    // Compute aggregate public key
    // PK = ∏_i C_{i,0} (product of constant term commitments)
    publicKey := computeAggregatePublicKey(p.allCommitments)

    // Compute transcript commitment
    transcript := computeTranscriptHash(p.allMessages)

    // Sign finalization
    signature := p.sign(publicKey, transcript)

    return &DKGFinalization{
        PublicKey:            publicKey,
        TranscriptCommitment: transcript,
        Signatures:           [][]byte{signature},
    }, nil
}
```

### 3. Resharing Protocol

#### 3.1 Resharing Trigger

```go
type ReshareReason uint8
const (
    ReshareEpochRotation ReshareReason = 1
    ReshareCommitteeChange ReshareReason = 2
    ReshareThresholdChange ReshareReason = 3
    ReshareEmergency ReshareReason = 4
)

type ReshareRequest struct {
    Reason       ReshareReason
    NewCommittee []CommitteeMember
    NewThreshold uint32
}
```

#### 3.2 Proactive Resharing

```go
func (p *DKGParticipant) ReshareToNewCommittee(newCommittee []CommitteeMember) error {
    // Generate random polynomial with same constant term
    // f'(0) = f(0) = s (the original secret share contribution)
    resharePoly := generateResharingPolynomial(p.secretShare, len(newCommittee)-1)

    // Generate shares for new committee
    shares := make([]*DKGShare, len(newCommittee))
    for i, member := range newCommittee {
        shareValue := evaluatePolynomial(resharePoly, uint64(i+1))
        encrypted := hpkeEncrypt(member.PublicKey, shareValue)
        shares[i] = &DKGShare{
            RecipientIdx:   uint32(i),
            EncryptedShare: encrypted,
        }
    }

    // Broadcast shares
    return p.broadcastShares(shares)
}
```

#### 3.3 New Member Reception

```go
func (np *NewParticipant) ReceiveReshares(shares map[Identity]*DKGShare) error {
    // Collect and verify shares from old committee
    validShares := make([][]byte, 0)

    for senderID, share := range shares {
        // Decrypt share
        shareValue, err := hpkeDecrypt(np.privateKey, share.EncryptedShare)
        if err != nil {
            continue
        }

        // Verify against commitment (from old public key)
        if np.verifyReshareAgainstOldPK(senderID, shareValue) {
            validShares = append(validShares, shareValue)
        }
    }

    // Need threshold valid shares
    if len(validShares) < np.oldThreshold {
        return ErrInsufficientShares
    }

    // Compute new secret share using Lagrange interpolation
    np.secretShare = lagrangeInterpolate(validShares, np.myIndex)

    return nil
}
```

### 4. Transcript Management

#### 4.1 Transcript Structure

```go
type DKGTranscript struct {
    // Protocol identification
    NamespaceId [20]byte
    Epoch       uint64

    // Participants
    Participants []Identity
    Threshold    uint32

    // All messages (ordered)
    Messages []DKGMessage

    // Final output
    PublicKey []byte
    EvalKeys  []byte  // CID reference

    // Commitment
    TranscriptHash [32]byte
}

func (t *DKGTranscript) ComputeHash() [32]byte {
    // Hash all messages in order
    h := sha3.New256()
    h.Write(t.NamespaceId[:])
    h.Write(uint64ToBytes(t.Epoch))
    for _, msg := range t.Messages {
        h.Write(msg.Encode())
    }
    return h.Sum(nil)
}
```

#### 4.2 Dispute Handling

```go
func VerifyTranscript(transcript *DKGTranscript) ([]DisputeEvidence, error) {
    var disputes []DisputeEvidence

    // Verify all commitments
    for _, msg := range transcript.FilterByType(DKGCommit) {
        if err := verifyCommitmentPOK(msg); err != nil {
            disputes = append(disputes, DisputeEvidence{
                Type:    DisputeInvalidCommitment,
                Message: msg,
            })
        }
    }

    // Verify all shares
    for _, msg := range transcript.FilterByType(DKGShare) {
        if err := verifyShareConsistency(msg, transcript); err != nil {
            disputes = append(disputes, DisputeEvidence{
                Type:    DisputeInvalidShare,
                Message: msg,
            })
        }
    }

    return disputes, nil
}
```

### 5. Bus Integration

#### 5.1 DKG Coordinator

```go
type DKGCoordinator struct {
    namespace    [20]byte
    participants []CommitteeMember
    threshold    uint32

    // State
    phase        DKGPhase
    commitments  map[Identity]*DKGCommitment
    shares       map[Identity]map[Identity]*DKGShare
    complaints   []DKGComplaint
}

func (c *DKGCoordinator) ProcessMessage(header *MsgHeader, msg *DKGMessage) error {
    // Verify sender is participant
    if !c.isParticipant(msg.Sender) {
        return ErrNotParticipant
    }

    // Verify message for current phase
    if !c.validForPhase(msg.Type) {
        return ErrWrongPhase
    }

    // Process based on type
    switch msg.Type {
    case DKGCommit:
        return c.processCommitment(msg)
    case DKGShare:
        return c.processShare(msg)
    case DKGComplaint:
        return c.processComplaint(msg)
    case DKGFinalize:
        return c.processFinalization(msg)
    }

    return nil
}
```

### 6. Security Hooks

#### 6.1 Slashing Evidence

```go
type DKGSlashingEvidence struct {
    // Type of misbehavior
    Type SlashingType

    // Transcript reference
    TranscriptRef [32]byte

    // Specific evidence
    Evidence []byte
}

type SlashingType uint8
const (
    SlashInvalidCommitment SlashingType = 1
    SlashInvalidShare      SlashingType = 2
    SlashEquivocation      SlashingType = 3  // Different messages same round
    SlashAbsence           SlashingType = 4  // Failed to participate
)
```

## Rationale

### Why Feldman VSS?

- Information-theoretic security
- Verifiable without revealing secret
- Standard construction

### Why Bus-Native?

- Transparent audit trail
- No separate communication channel
- Integrated with namespace

### Why Proactive Resharing?

- Committee changes without downtime
- No re-encryption needed
- Forward secrecy via rotation

## Security Considerations

### Adversary Threshold

Protocol secure if < t malicious (t = threshold).
With t-of-n sharing, tolerate up to t-1 corrupt.

### Transcript Binding

All messages recorded on bus.
Equivocation detectable and slashable.

### Key Freshness

Resharing provides forward secrecy.
Old committees lose access.

## Test Plan

### Unit Tests

1. **Polynomial Operations**: Evaluation, interpolation
2. **Commitment**: Generation, verification
3. **Share Distribution**: Encrypt, verify, reconstruct

### Integration Tests

1. **Full DKG**: n participants, threshold t
2. **Resharing**: Old → new committee
3. **Disputes**: Invalid share handling

### Security Tests

1. **Adversarial Shares**: Corrupt participants
2. **Equivocation**: Detect double messages
3. **Reconstruction**: Verify threshold

## References

- [Feldman VSS](https://www.cs.cornell.edu/courses/cs754/2001fa/129.PDF)
- [DKG Survey](https://eprint.iacr.org/2021/005)
- [Proactive Secret Sharing](https://www.iacr.org/archive/crypto95/37300181/37300181.pdf)

---

*LP-6473 v1.0.0 - 2026-01-02*
