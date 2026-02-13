---
lp: 2213
title: PQ DA Certificates
description: PQ DA Certificates for LuxDA Bus and Lux Network
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 6431]
tags: [pqc, luxda-bus, q-chain]
---

## Abstract

This LP defines post-quantum secure data availability certificates for LuxDA Bus, ensuring quantum-resistant attestation of blob storage.

## Motivation

DA certificates attest that blobs are available from the DA committee. This LP:
1. Defines PQ signature aggregation for DA certificates
2. Specifies hybrid BLS + PQ construction during transition
3. Addresses aggregation efficiency with PQ signatures

## Specification

### 1. Certificate Signature Schemes

```go
type DACertSignatureScheme uint8

const (
    // Classical (current)
    DACertBLS12381     DACertSignatureScheme = 0x01

    // Hybrid (transition)
    DACertHybridBLSPQ  DACertSignatureScheme = 0x10

    // Pure PQ (target)
    DACertMLDSA65      DACertSignatureScheme = 0x20
    DACertMLDSA87      DACertSignatureScheme = 0x21
)
```

### 2. PQ DA Certificate

```go
type PQAvailabilityCert struct {
    // Certificate metadata
    Version        uint16
    SignatureScheme DACertSignatureScheme

    // Blob identification
    BlobCommitment [32]byte
    ErasureRoot    [32]byte

    // Attestations
    CommitteeRoot  [32]byte
    Threshold      uint32
    Attestations   []PQAttestation

    // Aggregated signature (if supported)
    AggregatedSig  []byte
}

type PQAttestation struct {
    OperatorID    uint32
    PublicKey     []byte  // ML-DSA public key
    Signature     []byte  // ML-DSA signature
}
```

### 3. Hybrid Certificate (Transition)

```go
type HybridDACert struct {
    // BLS aggregated signature (efficient aggregation)
    BLSAggSig      []byte
    BLSSignerMask  []byte  // Bitmap of signers

    // PQ signatures (subset for quantum resistance)
    PQAttestations []PQAttestation
    PQThreshold    uint32  // Required PQ attestations
}

func VerifyHybridCert(cert *HybridDACert, committee *DACommittee) bool {
    // Verify BLS aggregate (standard threshold)
    blsValid := bls.VerifyAggregate(
        committee.BLSPubKeys,
        cert.BLSSignerMask,
        cert.BLSAggSig,
    )

    // Verify PQ attestations (PQ threshold)
    pqCount := 0
    for _, att := range cert.PQAttestations {
        if mldsa.Verify(att.PublicKey, cert.Message(), att.Signature) {
            pqCount++
        }
    }
    pqValid := pqCount >= int(cert.PQThreshold)

    // Both must pass
    return blsValid && pqValid
}
```

### 4. Committee Registration

```go
type DAOperatorRegistration struct {
    OperatorID    uint32

    // Classical keys
    BLSPublicKey  []byte

    // PQ keys
    MLDSAPublicKey []byte

    // Registration proof
    Stake         uint64
    RegistrationSig []byte
}

type DACommittee struct {
    Epoch         uint64
    Operators     []DAOperatorRegistration
    Threshold     uint32
    PQThreshold   uint32  // May be lower during transition
}
```

### 5. Signature Aggregation Strategy

ML-DSA does not support native aggregation like BLS. Strategies:

```go
type AggregationStrategy int

const (
    // Include all individual signatures (largest)
    AggStrategyFull AggregationStrategy = iota

    // Include threshold + 1 signatures
    AggStrategyThreshold

    // Merkle tree of signatures
    AggStrategyMerkle

    // Bulletproofs aggregation (experimental)
    AggStrategyZK
)
```

### 6. Merkle Signature Tree

```go
type SignatureMerkleTree struct {
    Root        [32]byte
    Signatures  [][]byte
    Indices     []uint32
    Proofs      []MerkleProof
}

// Verify signature exists in tree
func (t *SignatureMerkleTree) VerifyInclusion(
    index uint32,
    sig []byte,
) bool {
    leaf := sha256.Sum256(sig)
    return merkle.VerifyProof(t.Root, leaf[:], t.Proofs[index])
}
```

### 7. Certificate Size Comparison

| Scheme | Committee=100, Threshold=67 | Size |
|--------|----------------------------|------|
| BLS Aggregated | 1 sig + bitmap | ~110 B |
| ML-DSA Full | 67 signatures | ~222 KB |
| ML-DSA Threshold | 68 signatures | ~225 KB |
| Hybrid | BLS + 34 PQ | ~113 KB |

### 8. Optimized Wire Format

```go
type CompactPQCert struct {
    // Shared fields (not repeated per sig)
    BlobCommitment [32]byte
    ErasureRoot    [32]byte
    SignerMask     []byte  // Bitmap

    // Compressed signatures
    SignatureBundle []byte  // zstd compressed concatenated sigs
}

func (c *CompactPQCert) Decompress() (*PQAvailabilityCert, error) {
    // Decompress signature bundle
    sigs := zstd.Decompress(c.SignatureBundle)
    // Parse individual signatures (3,309 bytes each for ML-DSA-65)
    // ...
}
```

### 9. Challenge Protocol

```go
type PQDACertChallenge struct {
    CertHash       [32]byte
    ChallengerID   Identity
    ChallengeType  ChallengeType
    Evidence       []byte
    ChallengeSig   []byte  // ML-DSA signature
}

type ChallengeType uint8

const (
    ChallengeInvalidSig ChallengeType = iota
    ChallengeWrongKey
    ChallengeThresholdNotMet
)
```

### 10. Migration Timeline

```yaml
phase_1:  # Current
  scheme: bls12-381
  threshold: 2/3 committee

phase_2:  # Hybrid transition
  scheme: hybrid-bls-pq
  bls_threshold: 2/3 committee
  pq_threshold: 1/3 committee  # Lower during adoption

phase_3:  # Full PQ
  scheme: ml-dsa-65
  threshold: 2/3 committee
  deprecated: bls12-381
```

## Rationale

Data Availability (DA) certificates are the cornerstone of the LuxDA Bus's security model. They provide a cryptographic guarantee that data has been made available to the network. The current DA certificates rely on BLS signatures, which are efficient to aggregate but are not secure against future quantum computers.

To ensure the long-term integrity and security of the LuxDA Bus, it is essential to transition to post-quantum secure signature schemes for DA certificates. This LP specifies a hybrid approach that combines the efficiency of BLS signatures with the quantum resistance of ML-DSA. This allows for a gradual and secure migration to full post-quantum security, protecting the network from the threat of "harvest now, decrypt later" attacks on the DA layer.

## Backwards Compatibility

This LP is designed with a phased migration strategy to ensure backwards compatibility and a smooth transition across the network.

-   **Phase 1 (Classical)**: Existing nodes continue to use the current BLS-based DA certificates.
-   **Phase 2 (Hybrid)**: Upgraded nodes will produce and verify hybrid certificates containing both BLS and ML-DSA signatures. These nodes can still verify classical certificates from non-upgraded nodes. A lower threshold for PQ signatures can be used during the transition to accommodate partial network upgrades.
-   **Phase 3 (Full PQ)**: Once the network has fully upgraded, the BLS signatures will be deprecated, and only ML-DSA signatures will be required.

This phased rollout ensures that the network remains operational and secure throughout the entire migration process, with no breaking changes for applications relying on the DA layer.
## Security Considerations


1. **Threshold security**: Both BLS and PQ thresholds must be met in hybrid mode
2. **Committee binding**: Public keys bound to registered stake
3. **Challenge mechanism**: Invalid certificates can be challenged
4. **Key compromise**: PQ keys protect against future quantum attacks on BLS
5. **Size vs security**: Larger certificates trade bandwidth for quantum resistance

## Test Plan

1. Certificate generation with various committee sizes
2. Hybrid verification (BLS + PQ)
3. Challenge protocol testing
4. Compression effectiveness benchmarks
5. Migration path validation

## References

- LP-6431: Availability Certificates
- LP-2200: PQ Crypto SDK
- BLS12-381 specification

---

*LP-2213 v1.0.0 - 2026-01-02*
