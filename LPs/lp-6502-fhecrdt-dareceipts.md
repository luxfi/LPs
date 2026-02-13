---
lp: 6502
title: "fheCRDT DAReceipts - Data Availability Certificates"
description: Data availability certificate structure for fheCRDT erasure-coded encrypted blob storage
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-17
requires: 6500
---

# LP-6502: fheCRDT DAReceipts - Data Availability Certificates

## Abstract

This LP specifies the `DAReceipt` (Data Availability Receipt) structure for the fheCRDT architecture. DAReceipts are availability certificates issued by the Lux DA layer, proving that encrypted data blobs are stored and retrievable.

## Motivation

fheCRDT applications store encrypted data off-chain in the DA layer. Clients need:
1. Proof that their data was accepted by the DA network
2. Assurance that data will remain available for retrieval
3. Verification that data integrity is maintained
4. Information for efficient data retrieval

DAReceipts provide these guarantees through threshold signatures from DA committee members.

## Specification

### DAReceipt Structure

```go
// DAReceipt is an availability certificate from the DA layer
type DAReceipt struct {
    // Version of the DAReceipt format
    Version uint16 `json:"version"`

    // Unique identifier for the blob
    BlobID string `json:"blobId"`

    // Namespace for blob organization
    Namespace string `json:"namespace"`

    // Hash of the original unencoded blob content
    ContentHash [32]byte `json:"contentHash"`

    // Size of the original blob in bytes
    OriginalSize uint64 `json:"originalSize"`

    // Erasure coding parameters
    ErasureCoding ErasureParams `json:"erasureCoding"`

    // Merkle root of erasure-coded chunks
    ChunkRoot [32]byte `json:"chunkRoot"`

    // Committee information
    Committee CommitteeInfo `json:"committee"`

    // Threshold signature from committee
    ThresholdSignature ThresholdSig `json:"thresholdSignature"`

    // Timestamp when certificate was issued
    IssuedAt int64 `json:"issuedAt"`

    // When the data retention period expires
    ExpiresAt int64 `json:"expiresAt"`

    // Fee paid for storage (in smallest unit)
    StorageFee uint64 `json:"storageFee"`

    // Geographic distribution hints
    GeoHints []GeoLocation `json:"geoHints,omitempty"`
}

// ErasureParams defines erasure coding configuration
type ErasureParams struct {
    // Coding scheme (e.g., "reed-solomon")
    Scheme string `json:"scheme"`

    // Number of data chunks
    DataChunks uint32 `json:"dataChunks"`

    // Number of parity chunks
    ParityChunks uint32 `json:"parityChunks"`

    // Size of each chunk in bytes
    ChunkSize uint32 `json:"chunkSize"`

    // Total number of chunks
    TotalChunks uint32 `json:"totalChunks"`
}

// CommitteeInfo describes the DA committee
type CommitteeInfo struct {
    // Committee epoch/rotation number
    Epoch uint64 `json:"epoch"`

    // Committee identifier hash
    CommitteeHash [32]byte `json:"committeeHash"`

    // Total committee members
    TotalMembers uint32 `json:"totalMembers"`

    // Threshold required for valid certificate
    Threshold uint32 `json:"threshold"`

    // Public keys of signing members
    Signers [][]byte `json:"signers"`
}

// ThresholdSig is the aggregated signature
type ThresholdSig struct {
    // Signature scheme (e.g., "bls12-381")
    Scheme string `json:"scheme"`

    // Aggregated signature bytes
    Signature []byte `json:"signature"`

    // Bitmap of which members signed
    SignerBitmap []byte `json:"signerBitmap"`

    // Number of signers
    SignerCount uint32 `json:"signerCount"`
}

// GeoLocation provides geographic hints
type GeoLocation struct {
    // Region code (e.g., "us-east", "eu-west")
    Region string `json:"region"`

    // Number of replicas in this region
    ReplicaCount uint32 `json:"replicaCount"`
}
```

### Blob Submission Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │────▶│   DA Node   │────▶│  DA Network  │
└──────────┘     └─────────────┘     └──────────────┘
     │                  │                    │
     │  1. Submit Blob  │                    │
     │─────────────────▶│                    │
     │                  │  2. Erasure Code   │
     │                  │────────────────────│
     │                  │  3. Disperse       │
     │                  │────────────────────▶
     │                  │                    │
     │                  │  4. Collect Sigs   │
     │                  │◀────────────────────
     │                  │                    │
     │  5. DAReceipt    │                    │
     │◀─────────────────│                    │
```

### Submission API

```go
// SubmitBlob submits data to the DA layer
type SubmitBlobRequest struct {
    // Encrypted blob data
    Data []byte `json:"data"`

    // Namespace for organization
    Namespace string `json:"namespace"`

    // Requested retention period (seconds)
    RetentionPeriod uint64 `json:"retentionPeriod"`

    // Geographic preferences
    GeoPreferences []string `json:"geoPreferences,omitempty"`

    // Maximum fee willing to pay
    MaxFee uint64 `json:"maxFee"`
}

type SubmitBlobResponse struct {
    // The issued availability certificate
    Receipt DAReceipt `json:"receipt"`

    // Actual fee charged
    FeeCharged uint64 `json:"feeCharged"`

    // Estimated retrieval latency (ms)
    EstimatedLatency uint32 `json:"estimatedLatency"`
}
```

### Retrieval API

```go
// RetrieveBlob retrieves data from the DA layer
type RetrieveBlobRequest struct {
    // Blob identifier
    BlobID string `json:"blobId"`

    // Optional: specify chunks needed (for partial retrieval)
    ChunkIndices []uint32 `json:"chunkIndices,omitempty"`

    // Geographic preference for retrieval
    PreferredRegion string `json:"preferredRegion,omitempty"`
}

type RetrieveBlobResponse struct {
    // Retrieved data (reconstructed from erasure coding)
    Data []byte `json:"data"`

    // Proof of correct retrieval
    RetrievalProof RetrievalProof `json:"proof"`
}

// RetrievalProof proves correct data retrieval
type RetrievalProof struct {
    // Merkle proof for retrieved chunks
    MerkleProofs [][]byte `json:"merkleProofs"`

    // Which chunks were used for reconstruction
    UsedChunks []uint32 `json:"usedChunks"`

    // Hash of reconstructed data (should match ContentHash)
    ReconstructedHash [32]byte `json:"reconstructedHash"`
}
```

### Verification

Clients verify DAReceipts before trusting data availability:

```go
func VerifyDAReceipt(receipt DAReceipt, committeeRegistry CommitteeRegistry) error {
    // 1. Check version
    if receipt.Version > CURRENT_VERSION {
        return ErrUnsupportedVersion
    }

    // 2. Verify committee is valid for epoch
    committee, err := committeeRegistry.GetCommittee(receipt.Committee.Epoch)
    if err != nil {
        return err
    }
    if committee.Hash() != receipt.Committee.CommitteeHash {
        return ErrInvalidCommittee
    }

    // 3. Check threshold met
    if receipt.ThresholdSignature.SignerCount < receipt.Committee.Threshold {
        return ErrThresholdNotMet
    }

    // 4. Verify threshold signature
    message := receipt.SigningMessage()
    if !VerifyThresholdSignature(
        receipt.ThresholdSignature,
        message,
        receipt.Committee.Signers,
    ) {
        return ErrInvalidSignature
    }

    // 5. Check not expired
    if time.Now().Unix() > receipt.ExpiresAt {
        return ErrReceiptExpired
    }

    return nil
}
```

### Fee Market

DA storage fees are determined by market dynamics:

```go
// FeeCalculation determines storage cost
type FeeParams struct {
    // Base fee per byte per day
    BaseFeePerByteDay uint64

    // Congestion multiplier (1.0 = no congestion)
    CongestionMultiplier float64

    // Geographic premium factors
    GeoPremiums map[string]float64

    // Minimum retention period (days)
    MinRetention uint32

    // Maximum retention period (days)
    MaxRetention uint32
}

func CalculateFee(size uint64, retentionDays uint32, params FeeParams) uint64 {
    baseCost := size * uint64(retentionDays) * params.BaseFeePerByteDay
    return uint64(float64(baseCost) * params.CongestionMultiplier)
}
```

### Sampling (Future DAS Upgrade)

For future Data Availability Sampling support:

```go
// SamplingProof for DAS verification
type SamplingProof struct {
    // Sampled chunk index
    ChunkIndex uint32 `json:"chunkIndex"`

    // Chunk data
    ChunkData []byte `json:"chunkData"`

    // Merkle proof to ChunkRoot
    MerkleProof [][]byte `json:"merkleProof"`

    // KZG commitment proof (if applicable)
    KZGProof []byte `json:"kzgProof,omitempty"`
}

// VerifySample verifies a single chunk is available
func VerifySample(receipt DAReceipt, proof SamplingProof) bool {
    // Verify merkle proof
    return VerifyMerkleProof(
        proof.ChunkData,
        proof.ChunkIndex,
        proof.MerkleProof,
        receipt.ChunkRoot,
    )
}
```

### Committee Rotation

DA committees rotate periodically:

```go
type CommitteeRotation struct {
    // Previous epoch
    PreviousEpoch uint64

    // New epoch
    NewEpoch uint64

    // Members added
    AddedMembers [][]byte

    // Members removed
    RemovedMembers [][]byte

    // Effective timestamp
    EffectiveAt int64

    // Transition period (for data handoff)
    TransitionPeriod uint64
}
```

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `ErrBlobTooLarge` | Blob exceeds maximum size |
| 2 | `ErrInsufficientFee` | Fee too low for requested storage |
| 3 | `ErrNamespaceInvalid` | Invalid namespace format |
| 4 | `ErrRetentionInvalid` | Retention period out of range |
| 5 | `ErrCommitteeUnavailable` | DA committee not responding |
| 6 | `ErrThresholdNotMet` | Insufficient committee signatures |
| 7 | `ErrBlobNotFound` | Requested blob not available |
| 8 | `ErrReceiptExpired` | Certificate has expired |

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

1. **Committee Honesty**: Assumes honest threshold of committee members
2. **Erasure Coding**: Provides redundancy against node failures
3. **Signature Verification**: Always verify threshold signatures
4. **Expiration Handling**: Monitor expirations and refresh if needed
5. **Geographic Distribution**: Ensure data is distributed for resilience

## Rationale

### Why Threshold Signatures?

- Efficient verification (single signature check)
- Byzantine fault tolerance
- No single point of failure
- Compact on-chain footprint

### Why Erasure Coding?

- Data survives node failures
- Efficient storage (less than full replication)
- Enables sampling-based verification
- Industry-proven reliability

### Why Separate Epochs?

- Allows committee rotation
- Enables stake-based selection
- Supports slashing for misbehavior
- Clean transition periods

## Test Vectors

```json
{
    "testCase": "basic_dareceipt",
    "input": {
        "version": 1,
        "blobId": "blob_test_001",
        "namespace": "test.data",
        "contentHash": "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89",
        "originalSize": 4096,
        "erasureCoding": {
            "scheme": "reed-solomon",
            "dataChunks": 4,
            "parityChunks": 2,
            "chunkSize": 1024,
            "totalChunks": 6
        },
        "chunkRoot": "0x...",
        "committee": {
            "epoch": 100,
            "threshold": 5,
            "totalMembers": 7
        }
    },
    "expectedValid": true
}
```

## Related LPs

- [LP-6500: fheCRDT Architecture](lp-6500-fhecrdt-architecture.md)
- [LP-6501: fheCRDT DocReceipts](lp-6501-fhecrdt-docreceipts.md)
- [LP-6431: Availability Certificates](lp-6431-availability-certificates.md)
- [LP-6432: Erasure Coding](lp-6432-erasure-coding.md)
- [LP-6433: DAS Upgrade](lp-6433-das-upgrade.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
