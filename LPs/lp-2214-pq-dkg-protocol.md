---
lp: 2214
title: PQ DKG Protocol
description: PQ DKG Protocol for LuxDA Bus and Lux Network
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 5340]
tags: [pqc, luxda-bus, q-chain]
---

## Abstract

This LP defines post-quantum secure distributed key generation (DKG) for LuxDA Bus TFHE orchestration and other threshold cryptographic operations.

## Motivation

DKG protocols establish shared keys among a committee without any single party knowing the full key. This LP:
1. Defines PQ-secure DKG for lattice-based threshold schemes
2. Specifies secure broadcast over LuxDA Bus
3. Addresses verifiability without pairings

## Specification

### 1. PQ DKG Overview

```
Classical DKG (Feldman VSS):
  - Uses discrete log groups (DLP)
  - Pairing-based verification

PQ DKG (Lattice-based):
  - Uses Module-LWE assumption
  - Commitment-based verification
  - Compatible with threshold ML-KEM and TFHE
```

### 2. DKG Session

```go
type PQDKGSession struct {
    SessionID     [32]byte
    Epoch         uint64
    Participants  []DKGParticipant
    Threshold     uint32
    Status        DKGStatus

    // Lattice parameters
    Params        LatticeParams

    // Session keys
    CommitmentKey [32]byte
}

type DKGParticipant struct {
    Index       uint32
    Identity    Identity
    PublicKey   *MLKEMPublicKey
    ShareCommit []byte  // Commitment to share
}

type DKGStatus int
const (
    DKGStatusPending DKGStatus = iota
    DKGStatusDealing
    DKGStatusVerifying
    DKGStatusComplete
    DKGStatusFailed
)
```

### 3. Lattice Parameters

```go
type LatticeParams struct {
    N         int     // Ring dimension (power of 2)
    Q         int64   // Modulus
    Sigma     float64 // Gaussian parameter
    K         int     // Module rank
}

// Default parameters (aligned with ML-KEM-768)
var DefaultLatticeParams = LatticeParams{
    N:     256,
    Q:     3329,
    Sigma: 3.19,
    K:     3,
}
```

### 4. Protocol Phases

```go
// Phase 1: Commitment
type DKGCommitment struct {
    DealerIndex   uint32
    Commitment    []byte  // Hash commitment to polynomial
    ZKProof       []byte  // Proof of well-formedness
}

// Phase 2: Share Distribution
type DKGShare struct {
    DealerIndex   uint32
    ReceiverIndex uint32
    EncryptedShare []byte  // ML-KEM encrypted
    ShareProof    []byte   // Proof share matches commitment
}

// Phase 3: Verification & Complaint
type DKGComplaint struct {
    ComplainerIndex uint32
    DealerIndex     uint32
    Evidence        []byte  // Decrypted share + proof
    ComplaintSig    []byte
}

// Phase 4: Finalization
type DKGResult struct {
    PublicKey       []byte  // Combined public key
    PublicShares    [][]byte // Per-participant public shares
    Qualified       []uint32 // Qualified dealer indices
}
```

### 5. Share Encryption

```go
// Encrypt share to recipient using ML-KEM
func EncryptShare(
    share *LatticeShare,
    recipientPK *MLKEMPublicKey,
) ([]byte, error) {
    // Serialize share
    shareByes := share.Serialize()

    // Encapsulate
    ct, ss, _ := mlkem.Encapsulate(recipientPK)

    // Encrypt share with derived key
    key := hkdf.Expand(sha256.New, ss, []byte("DKGShare"), 32)
    nonce := make([]byte, 12)
    cipher, _ := chacha20poly1305.New(key)
    encrypted := cipher.Seal(nil, nonce, shareBytes, ct)

    return append(ct, encrypted...), nil
}
```

### 6. Commitment Scheme

```go
// Pedersen-like commitment for lattice setting
type LatticeCommitment struct {
    C [][]int64  // Commitment matrix
}

func CommitToPolynomial(
    poly *LatticePolynomial,
    r []int64,  // Randomness
    params *LatticeParams,
) *LatticeCommitment {
    // C = A*r + poly (mod q)
    // Where A is public matrix from CRS
    // ...
}

func OpenCommitment(
    commit *LatticeCommitment,
    poly *LatticePolynomial,
    r []int64,
) bool {
    // Verify C = A*r + poly
    // ...
}
```

### 7. Zero-Knowledge Proofs

```go
// Prove polynomial is well-formed (small coefficients)
type WellFormednessProof struct {
    Commitments [][]byte
    Responses   [][]int64
}

func ProveWellFormedness(
    poly *LatticePolynomial,
    commitment *LatticeCommitment,
    params *LatticeParams,
) (*WellFormednessProof, error)

func VerifyWellFormedness(
    commitment *LatticeCommitment,
    proof *WellFormednessProof,
    params *LatticeParams,
) bool
```

### 8. Bus Integration

```go
// DKG messages posted to dedicated namespace
var DKGNamespace = DeriveNamespace("lux.dkg.v1")

type DKGBusMessage struct {
    SessionID   [32]byte
    Phase       DKGPhase
    Sender      uint32
    Payload     []byte  // Phase-specific content
    Signature   []byte  // ML-DSA signature
}

type DKGPhase uint8
const (
    DKGPhaseCommit DKGPhase = iota
    DKGPhaseDeal
    DKGPhaseComplain
    DKGPhaseFinalize
)
```

### 9. Threshold Operations

```go
// Combined public key from DKG
type ThresholdPublicKey struct {
    Params      LatticeParams
    PublicKey   [][]int64  // Combined lattice public key
    Threshold   uint32
    Committee   []uint32   // Participant indices
}

// Participant's key share
type ThresholdKeyShare struct {
    Index       uint32
    Share       [][]int64  // Lattice secret share
    PublicShare [][]int64  // Corresponding public share
}

// Partial decryption for threshold operations
func PartialDecrypt(
    share *ThresholdKeyShare,
    ciphertext []byte,
) (*PartialDecryption, error)

func CombinePartials(
    partials []*PartialDecryption,
    threshold uint32,
) ([]byte, error)
```

### 10. Recovery Mechanism

```go
// Share recovery when participant fails
type ShareRecoveryRequest struct {
    SessionID     [32]byte
    FailedIndex   uint32
    Requestor     uint32
    RecoveryProof []byte  // Proof of authorization
}

// Reconstruct failed participant's share
func RecoverShare(
    session *PQDKGSession,
    failedIndex uint32,
    helpingShares []*ThresholdKeyShare,
) (*ThresholdKeyShare, error)
```

## Security Considerations

1. **Module-LWE assumption**: Security based on hardness of learning with errors
2. **Honest majority**: Requires > 2/3 honest participants
3. **Asynchronous safety**: Protocol tolerates network delays
4. **Verifiability**: All shares verified via ZK proofs
5. **Quantum resistance**: No discrete log or pairing assumptions

## Test Plan

1. Full DKG protocol execution with various committee sizes
2. Complaint handling and malicious dealer detection
3. Share recovery testing
4. Integration with TFHE threshold decryption
5. Performance benchmarks

## References

- LP-6473: TFHE DKG
- LP-2200: PQ Crypto SDK
- Lattice-based threshold cryptography literature

---

*LP-2214 v1.0.0 - 2026-01-02*
