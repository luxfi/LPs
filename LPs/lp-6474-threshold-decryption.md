---
lp: 6474
title: LuxDA TFHE Threshold Decryption
description: LuxDA TFHE Threshold Decryption specification for LuxDA Bus
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

This LP defines the threshold decryption protocol for TFHE ciphertexts. Committee members provide partial decryptions that combine to reveal plaintext, with various trigger conditions for authorization.

## Motivation

Threshold decryption enables:

1. **Conditional Reveal**: Decrypt when conditions met
2. **No Single Point of Failure**: Threshold required
3. **Verifiable Decryption**: Proofs of correct shares
4. **Partial Reveal**: Decision bit without full plaintext

## Specification

### 1. Decryption Request

#### 1.1 Request Structure

```go
type DecryptRequest struct {
    // Request identification
    RequestID [32]byte

    // Target ciphertext
    CiphertextRef CiphertextReference

    // Trigger condition
    Trigger DecryptTrigger

    // Requester
    Requester Identity
    Signature []byte

    // Options
    Options DecryptOptions
}

type CiphertextReference struct {
    // Location
    NamespaceId [20]byte
    Seq         uint64

    // Identification
    SidecarCommitment [32]byte
    Epoch             uint64
}

type DecryptOptions struct {
    // Partial reveal options
    PartialReveal bool
    RevealIndices []uint32  // Which values to reveal

    // Urgency
    Priority Priority

    // Callback
    CallbackNs [20]byte  // Namespace to receive result
}
```

#### 1.2 Trigger Types

```go
type DecryptTrigger struct {
    Type      TriggerType
    Condition []byte
    Proof     []byte
}

type TriggerType uint8
const (
    // Time-based
    TriggerAfterTime     TriggerType = 1  // After timestamp
    TriggerAfterBlock    TriggerType = 2  // After block height

    // Inclusion-based
    TriggerOnInclusion   TriggerType = 3  // After header finalized
    TriggerOnAvailability TriggerType = 4 // After DA confirmed

    // Quorum-based
    TriggerQuorumApproval TriggerType = 5  // N approvals
    TriggerVoteResult     TriggerType = 6  // Vote outcome

    // External
    TriggerOracleAttestation TriggerType = 7  // Oracle confirms
)
```

### 2. Partial Decryption

#### 2.1 Decryption Share

```go
type DecryptionShare struct {
    // Request reference
    RequestID [32]byte

    // Share provider
    MemberIndex uint32
    MemberID    Identity

    // Partial decryption
    Share []byte

    // Proof of correct decryption
    Proof []byte

    // Signature
    Signature []byte
}
```

#### 2.2 Generate Share

```go
func (m *CommitteeMember) GenerateDecryptShare(
    request *DecryptRequest,
    ciphertext []byte,
) (*DecryptionShare, error) {
    // Verify trigger is satisfied
    if err := m.verifyTrigger(request.Trigger); err != nil {
        return nil, err
    }

    // Generate partial decryption
    // For TFHE: apply secret share to ciphertext
    share := tfhe.PartialDecrypt(m.secretShare, ciphertext)

    // Generate proof of correct computation
    // DLEQ proof: (g, g^s, c, c^s) have same discrete log
    proof := generateDLEQProof(m.secretShare, ciphertext, share)

    return &DecryptionShare{
        RequestID:   request.RequestID,
        MemberIndex: m.index,
        MemberID:    m.identity,
        Share:       share,
        Proof:       proof,
        Signature:   m.sign(request.RequestID, share),
    }, nil
}
```

### 3. Share Combination

#### 3.1 Combine Shares

```go
func CombineDecryptShares(
    shares []*DecryptionShare,
    threshold uint32,
) ([]byte, error) {
    if uint32(len(shares)) < threshold {
        return nil, ErrInsufficientShares
    }

    // Verify all proofs
    for _, share := range shares {
        if err := verifyDLEQProof(share.Share, share.Proof); err != nil {
            return nil, fmt.Errorf("invalid share from %d: %w", share.MemberIndex, err)
        }
    }

    // Lagrange interpolation in the exponent
    // plaintext = ∏_i share_i^{λ_i}
    indices := extractIndices(shares)
    plaintext := make([]byte, len(shares[0].Share))

    for i, share := range shares {
        lambda := lagrangeCoefficient(indices, indices[i])
        contribution := scalarMult(lambda, share.Share)
        plaintext = pointAdd(plaintext, contribution)
    }

    return plaintext, nil
}
```

#### 3.2 Verify Combined Result

```go
func VerifyDecryption(
    ciphertext []byte,
    plaintext []byte,
    publicKey []byte,
) bool {
    // Re-encrypt and compare
    // Or use SNARK for efficient verification
    expectedCiphertext := tfhe.Encrypt(publicKey, plaintext)
    return tfhe.CiphertextEquals(ciphertext, expectedCiphertext)
}
```

### 4. Protocol Flow

#### 4.1 Bus-Native Flow

```
1. Requester → DecryptRequest to orchestration namespace
2. Coordinator verifies trigger conditions
3. Coordinator → DecryptShareRequest to committee members
4. Members verify trigger, generate shares
5. Members → DecryptionShare to orchestration namespace
6. Coordinator collects threshold shares
7. Coordinator combines → plaintext
8. Result → callback namespace (or original requester)
```

#### 4.2 Coordinator Logic

```go
func (c *DecryptCoordinator) ProcessRequest(request *DecryptRequest) error {
    // Verify requester authorization
    if err := c.verifyRequester(request); err != nil {
        return err
    }

    // Check trigger
    if !c.triggerSatisfied(request.Trigger) {
        // Store for later
        c.pendingRequests[request.RequestID] = request
        return nil
    }

    // Fetch ciphertext
    ciphertext, err := c.fetchCiphertext(request.CiphertextRef)
    if err != nil {
        return err
    }

    // Request shares from committee
    shareRequests := c.broadcastShareRequest(request, ciphertext)

    // Set timeout
    c.scheduleTimeout(request.RequestID, ShareCollectionTimeout)

    return nil
}

func (c *DecryptCoordinator) ProcessShare(share *DecryptionShare) error {
    request := c.activeRequests[share.RequestID]
    if request == nil {
        return ErrUnknownRequest
    }

    // Verify share
    if err := c.verifyShare(share, request); err != nil {
        return err
    }

    // Store share
    c.collectedShares[share.RequestID] = append(
        c.collectedShares[share.RequestID],
        share,
    )

    // Check threshold
    if len(c.collectedShares[share.RequestID]) >= int(c.threshold) {
        return c.finalize(request)
    }

    return nil
}
```

### 5. Trigger Verification

#### 5.1 Time Trigger

```go
func verifyTimeTrigger(trigger *DecryptTrigger) error {
    targetTime := binary.BigEndian.Uint64(trigger.Condition)
    currentTime := uint64(time.Now().Unix())

    if currentTime < targetTime {
        return ErrTriggerNotSatisfied
    }

    return nil
}
```

#### 5.2 Quorum Trigger

```go
func verifyQuorumTrigger(trigger *DecryptTrigger, approvals []Approval) error {
    var quorum QuorumConfig
    cbor.Unmarshal(trigger.Condition, &quorum)

    validApprovals := 0
    for _, approval := range approvals {
        if quorum.IsApprover(approval.Approver) {
            if verifyApprovalSignature(approval) {
                validApprovals++
            }
        }
    }

    if validApprovals < quorum.Required {
        return ErrInsufficientApprovals
    }

    return nil
}
```

#### 5.3 Oracle Trigger

```go
func verifyOracleTrigger(trigger *DecryptTrigger) error {
    var oracleCondition OracleCondition
    cbor.Unmarshal(trigger.Condition, &oracleCondition)

    // Verify oracle attestation
    if !verifyOracleAttestation(oracleCondition.Oracle, trigger.Proof) {
        return ErrInvalidOracleAttestation
    }

    return nil
}
```

### 6. Partial Reveal

#### 6.1 Decision Bit Only

For voting results, reveal only win/lose:

```go
func RevealDecisionBit(
    ciphertext *TFHECiphertext,
    shares []*DecryptionShare,
    threshold uint32,
) (bool, error) {
    // For comparison results, extract single bit
    fullPlaintext, err := CombineDecryptShares(shares, threshold)
    if err != nil {
        return false, err
    }

    // Interpret as boolean
    return fullPlaintext[0] != 0, nil
}
```

#### 6.2 Selective Reveal

```go
func SelectiveReveal(
    ciphertexts []*TFHECiphertext,
    shares [][]*DecryptionShare,
    revealIndices []uint32,
) (map[uint32][]byte, error) {
    results := make(map[uint32][]byte)

    for _, idx := range revealIndices {
        if int(idx) >= len(ciphertexts) {
            continue
        }

        plaintext, err := CombineDecryptShares(shares[idx], threshold)
        if err != nil {
            return nil, err
        }

        results[idx] = plaintext
    }

    return results, nil
}
```

### 7. Result Publication

#### 7.1 Decryption Result

```go
type DecryptionResult struct {
    // Request reference
    RequestID [32]byte

    // Result
    Status ResultStatus
    Plaintext []byte  // If revealed

    // Proofs
    CombinedProof []byte
    ShareRefs     []ShareReference

    // Metadata
    CompletedAt uint64
    BlockHeight uint64
}

type ResultStatus uint8
const (
    ResultSuccess       ResultStatus = 1
    ResultPartial       ResultStatus = 2
    ResultFailed        ResultStatus = 3
    ResultTriggerNotMet ResultStatus = 4
)
```

#### 7.2 Publish Result

```go
func (c *DecryptCoordinator) PublishResult(result *DecryptionResult) error {
    // Encode result
    resultMsg := encodeResult(result)

    // Publish to callback namespace
    if result.Request.Options.CallbackNs != [20]byte{} {
        return c.publishToNamespace(result.Request.Options.CallbackNs, resultMsg)
    }

    // Or publish to orchestration namespace
    return c.publishToNamespace(c.namespace, resultMsg)
}
```

## Rationale

### Why Threshold?

- No single point of failure
- Collusion resistance
- Availability

### Why Trigger Conditions?

- Programmable reveal logic
- Separation of encryption and authorization
- Flexible use cases

### Why Proofs?

- Verify correct computation
- Detect misbehavior
- Enable slashing

## Security Considerations

### Premature Decryption

Mitigated by:
- Trigger verification
- Multiple committee members
- Honest threshold assumption

### Share Withholding

Mitigated by:
- Redundant committee
- Timeout and escalation
- Slashing for non-response

### Result Manipulation

Mitigated by:
- DLEQ proofs
- Combined proof verification
- Public verification

## Test Plan

### Unit Tests

1. **Share Generation**: Correct partial decrypt
2. **Share Combination**: Lagrange interpolation
3. **Trigger Verification**: All trigger types

### Integration Tests

1. **Full Decryption**: Request → shares → result
2. **Partial Reveal**: Decision bit extraction
3. **Timeout Handling**: Incomplete shares

### Security Tests

1. **Invalid Shares**: Detect and reject
2. **Premature Request**: Reject before trigger
3. **Threshold**: Exactly t shares needed

## References

- [Threshold Cryptography](https://dl.acm.org/doi/10.1145/3372297.3417231)
- [DLEQ Proofs](https://people.csail.mit.edu/rivest/pubs/CM99.pdf)
- [Threshold FHE](https://eprint.iacr.org/2022/164)

---

*LP-6474 v1.0.0 - 2026-01-02*
