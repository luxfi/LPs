---
lp: 6433
title: LuxDA DAS Upgrade Path
description: LuxDA DAS Upgrade Path specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP specifies the Data Availability Sampling (DAS) upgrade for LuxDA, providing cryptoeconomic availability guarantees through random sampling. DAS enables light clients to verify data availability without downloading full blobs.

## Motivation

Certificate-based DA (LP-6431) requires trusting the operator committee. DAS provides:

1. **Trustless Verification**: Sampling proves availability cryptographically
2. **Light Client Support**: Verify with O(log n) samples
3. **Scalable Security**: Security scales with number of samplers
4. **Decentralization**: No trusted committee required

## Specification

### 1. DAS Overview

#### 1.1 Security Model

DAS relies on the following principle:

> If a malicious actor withholds even a small portion of data, random sampling will detect the unavailability with high probability.

With 2D Reed-Solomon coding:
- Data arranged in k×k matrix
- Extended to 2k×2k with row and column parity
- Any row or column missing → unavailable
- `s` random samples detect missing data with probability `1 - (1/2)^s`

#### 1.2 System Requirements

| Component | Requirement |
|-----------|-------------|
| Commitment Scheme | KZG polynomial commitments |
| Erasure Coding | 2D Reed-Solomon |
| Sampling | Random cell selection |
| Proof | KZG evaluation proofs |
| Light Clients | Sample and verify |

### 2. 2D Reed-Solomon Extension

#### 2.1 Matrix Construction

```go
type DataMatrix struct {
    // Original data in k×k matrix
    Data [][]FieldElement

    // Extended matrix (2k×2k)
    Extended [][]FieldElement

    // Row commitments
    RowCommitments []*KZGCommitment

    // Column commitments
    ColCommitments []*KZGCommitment
}

func BuildDataMatrix(blob []byte, k int) (*DataMatrix, error) {
    // Convert blob to field elements
    elements := BlobToFieldElements(blob)

    // Pad to k×k
    if len(elements) > k*k {
        return nil, ErrBlobTooLarge
    }

    // Fill k×k data matrix
    data := make([][]FieldElement, k)
    for i := 0; i < k; i++ {
        data[i] = make([]FieldElement, k)
        for j := 0; j < k; j++ {
            idx := i*k + j
            if idx < len(elements) {
                data[i][j] = elements[idx]
            } else {
                data[i][j] = FieldElement{} // Zero padding
            }
        }
    }

    // Extend to 2k×2k
    extended := extendMatrix(data, k)

    // Compute commitments
    rowCommits := commitRows(extended)
    colCommits := commitColumns(extended)

    return &DataMatrix{
        Data:           data,
        Extended:       extended,
        RowCommitments: rowCommits,
        ColCommitments: colCommits,
    }, nil
}
```

#### 2.2 Matrix Extension

```go
func extendMatrix(data [][]FieldElement, k int) [][]FieldElement {
    extended := make([][]FieldElement, 2*k)

    // Copy original data to top-left quadrant
    for i := 0; i < k; i++ {
        extended[i] = make([]FieldElement, 2*k)
        copy(extended[i][:k], data[i])
    }

    // Extend rows (add parity to right side)
    for i := 0; i < k; i++ {
        rowPoly := interpolate(extended[i][:k])
        for j := k; j < 2*k; j++ {
            extended[i][j] = evaluate(rowPoly, j)
        }
    }

    // Extend columns (add parity to bottom)
    for j := 0; j < 2*k; j++ {
        col := make([]FieldElement, k)
        for i := 0; i < k; i++ {
            col[i] = extended[i][j]
        }
        colPoly := interpolate(col)
        for i := k; i < 2*k; i++ {
            if extended[i] == nil {
                extended[i] = make([]FieldElement, 2*k)
            }
            extended[i][j] = evaluate(colPoly, i)
        }
    }

    return extended
}
```

### 3. KZG Commitments

#### 3.1 Row/Column Commitments

```go
type DAHeader struct {
    // Blob metadata
    BlobCommitment [48]byte  // KZG commitment to blob polynomial
    BlobLen        uint32

    // 2D structure
    MatrixSize     uint32    // k (data is k×k)

    // Row commitments (2k commitments)
    RowCommitments [][48]byte

    // Column commitments (2k commitments)
    ColCommitments [][48]byte

    // Root of commitment tree
    CommitmentsRoot [32]byte
}

func ComputeDAHeader(matrix *DataMatrix) *DAHeader {
    k := len(matrix.Data)

    // Compute row commitments
    rowCommits := make([][48]byte, 2*k)
    for i := 0; i < 2*k; i++ {
        rowCommits[i] = KZGCommit(matrix.Extended[i])
    }

    // Compute column commitments
    colCommits := make([][48]byte, 2*k)
    for j := 0; j < 2*k; j++ {
        col := extractColumn(matrix.Extended, j)
        colCommits[j] = KZGCommit(col)
    }

    // Compute root
    root := MerkleRoot(append(rowCommits, colCommits...))

    return &DAHeader{
        MatrixSize:      uint32(k),
        RowCommitments:  rowCommits,
        ColCommitments:  colCommits,
        CommitmentsRoot: root,
    }
}
```

#### 3.2 Cell Proofs

```go
type CellProof struct {
    Row      uint32
    Col      uint32
    Value    FieldElement
    RowProof [48]byte  // KZG proof for row
    ColProof [48]byte  // KZG proof for column
}

func GenerateCellProof(matrix *DataMatrix, row, col int) *CellProof {
    // Row polynomial evaluation proof
    rowPoly := interpolate(matrix.Extended[row])
    rowProof := KZGProve(rowPoly, col)

    // Column polynomial evaluation proof
    colValues := extractColumn(matrix.Extended, col)
    colPoly := interpolate(colValues)
    colProof := KZGProve(colPoly, row)

    return &CellProof{
        Row:      uint32(row),
        Col:      uint32(col),
        Value:    matrix.Extended[row][col],
        RowProof: rowProof,
        ColProof: colProof,
    }
}
```

### 4. Sampling Protocol

#### 4.1 Sample Selection

```go
type SampleRequest struct {
    BlobCommitment [48]byte
    Cells          []CellCoord
    Nonce          [32]byte  // For randomness
}

type CellCoord struct {
    Row uint32
    Col uint32
}

func SelectRandomCells(commitment [48]byte, nonce [32]byte, numSamples int, matrixSize int) []CellCoord {
    seed := sha3.Sum256(commitment[:], nonce[:])
    rng := NewDeterministicRNG(seed)

    cells := make([]CellCoord, numSamples)
    seen := make(map[CellCoord]bool)

    for i := 0; i < numSamples; {
        row := rng.Intn(2 * matrixSize)
        col := rng.Intn(2 * matrixSize)
        cell := CellCoord{Row: uint32(row), Col: uint32(col)}

        if !seen[cell] {
            cells[i] = cell
            seen[cell] = true
            i++
        }
    }

    return cells
}
```

#### 4.2 Sample Verification

```go
func VerifySample(header *DAHeader, proof *CellProof) bool {
    // Verify row proof
    rowCommit := header.RowCommitments[proof.Row]
    if !KZGVerify(rowCommit, proof.Col, proof.Value, proof.RowProof) {
        return false
    }

    // Verify column proof
    colCommit := header.ColCommitments[proof.Col]
    if !KZGVerify(colCommit, proof.Row, proof.Value, proof.ColProof) {
        return false
    }

    return true
}
```

#### 4.3 Sampling Probability

```go
const (
    // Number of samples for 99.9% confidence
    DefaultSamples = 75

    // Target availability (fraction that must be available)
    AvailabilityTarget = 0.5
)

// Probability of detecting unavailability
func DetectionProbability(samples int, unavailFraction float64) float64 {
    // P(detect) = 1 - (1 - unavailFraction)^samples
    return 1 - math.Pow(1-unavailFraction, float64(samples))
}

// DetectionProbability(75, 0.5) ≈ 0.99999999997
```

### 5. Light Client Protocol

#### 5.1 Light Client Verification

```go
type LightClient struct {
    // Trusted header chain
    HeaderChain HeaderChainClient

    // P2P network for sampling
    Network P2PClient

    // Local sample cache
    SampleCache *LRUCache
}

func (lc *LightClient) VerifyAvailability(blobCommitment [48]byte) (bool, error) {
    // 1. Get DA header from header chain
    daHeader, err := lc.HeaderChain.GetDAHeader(blobCommitment)
    if err != nil {
        return false, err
    }

    // 2. Select random cells
    nonce := generateNonce()
    cells := SelectRandomCells(blobCommitment, nonce, DefaultSamples, int(daHeader.MatrixSize))

    // 3. Request samples from network
    proofs := make([]*CellProof, 0, len(cells))
    for _, cell := range cells {
        proof, err := lc.Network.RequestSample(blobCommitment, cell)
        if err != nil {
            // Mark as potentially unavailable
            continue
        }
        proofs = append(proofs, proof)
    }

    // 4. Verify all received samples
    verified := 0
    for _, proof := range proofs {
        if VerifySample(daHeader, proof) {
            verified++
        }
    }

    // 5. Require threshold of verified samples
    threshold := DefaultSamples * 3 / 4
    return verified >= threshold, nil
}
```

#### 5.2 Sample Serving

Full nodes serve samples to light clients:

```go
func (node *FullNode) HandleSampleRequest(req *SampleRequest) (*CellProof, error) {
    // Look up matrix data
    matrix, err := node.Store.GetMatrix(req.BlobCommitment)
    if err != nil {
        return nil, err
    }

    // Generate proof for requested cell
    proof := GenerateCellProof(matrix, int(req.Cell.Row), int(req.Cell.Col))

    return proof, nil
}
```

### 6. Migration from Certificate Mode

#### 6.1 Migration Strategy

```
Phase 1: Parallel Operation
├── Certificate mode continues
├── DA headers include KZG commitments
└── Operators start building matrices

Phase 2: Sampling Enabled
├── Light clients begin sampling
├── Certificates still accepted
└── Sampling verification optional

Phase 3: Sampling Required
├── Sampling becomes mandatory
├── Certificate mode deprecated
└── Full transition complete
```

#### 6.2 Backward Compatibility

```go
type AvailabilityProof struct {
    // Version determines proof type
    Version uint8

    // Certificate mode (v1)
    Certificate *AvailabilityCert

    // DAS mode (v2)
    DAHeader *DAHeader
}

func VerifyAvailability(proof *AvailabilityProof) bool {
    switch proof.Version {
    case 1:
        return VerifyCertificate(proof.Certificate)
    case 2:
        return VerifyDAS(proof.DAHeader)
    default:
        return false
    }
}
```

### 7. Network Protocol

#### 7.1 Sample Request/Response

```protobuf
service DASSampleService {
    rpc GetSample(SampleRequest) returns (SampleResponse);
    rpc GetSamples(BatchSampleRequest) returns (stream SampleResponse);
}

message SampleRequest {
    bytes blob_commitment = 1;
    uint32 row = 2;
    uint32 col = 3;
}

message SampleResponse {
    bytes value = 1;
    bytes row_proof = 2;
    bytes col_proof = 3;
}
```

#### 7.2 Gossip-Based Sampling

Light clients can gossip sample results:

```go
type SampleGossip struct {
    BlobCommitment [48]byte
    Cell           CellCoord
    Available      bool
    Proof          *CellProof  // If available
    Timestamp      uint64
    Signature      []byte
}
```

### 8. Security Analysis

#### 8.1 Adversary Model

| Attack | Mitigation |
|--------|------------|
| Selective availability | 2D coding ensures any missing row/col is detectable |
| Proof forging | KZG security (discrete log assumption) |
| Sampling manipulation | Client generates own randomness |
| Network-level censorship | P2P redundancy, multiple sample sources |

#### 8.2 Security Bounds

With `s` samples from 2k×2k matrix:

```
P(accept unavailable) ≤ (1/2)^s

For s=75: P(accept unavailable) ≤ 2^(-75) ≈ 2.6 × 10^(-23)
```

### 9. Performance

#### 9.1 Computation

| Operation | Time (1 MiB blob) |
|-----------|-------------------|
| Matrix construction | ~50 ms |
| KZG commitments | ~100 ms |
| Per-cell proof | ~1 ms |
| Per-sample verify | ~2 ms |
| Full light client verify | ~150 ms (75 samples) |

#### 9.2 Bandwidth

| Component | Size |
|-----------|------|
| DA Header (k=128) | ~25 KiB |
| Cell proof | ~144 bytes |
| Light client samples | ~11 KiB (75 samples) |

## Rationale

### Why 2D Extension?

- 1D requires sampling O(n) for n unavailability
- 2D enables O(√n) sampling
- Any row/column unavailability propagates

### Why KZG?

- Constant-size proofs
- Efficient verification
- Enables polynomial commitment fraud proofs
- Standard in Ethereum danksharding

### Why 75 Samples?

- Provides 99.99999...% detection probability
- Reasonable bandwidth (~11 KiB)
- Balances security and efficiency

## Security Considerations

### Trusted Setup

KZG requires trusted setup (powers of tau):
- Use existing ceremony (Ethereum's)
- Or conduct Lux-specific ceremony
- Secure as long as one participant is honest

### Reconstruction Attacks

Malicious majority could:
- Reconstruct data from samples
- Not a confidentiality guarantee
- DA is for availability, not privacy

## Test Plan

### Unit Tests

1. **Matrix Construction**: Correct 2D extension
2. **KZG Proofs**: Valid proofs verify, invalid reject
3. **Sampling**: Correct probability analysis

### Integration Tests

1. **End-to-End**: Blob → Matrix → Sample → Verify
2. **Light Client**: Full verification flow
3. **Migration**: Certificate → DAS transition

### Security Tests

1. **Unavailability Detection**: Missing data detected
2. **Proof Forgery**: Invalid proofs rejected
3. **Sampling Attacks**: Adversarial sample selection

## References

- [Dankrad Feist: Data Availability Sampling](https://dankradfeist.de/ethereum/2019/12/20/data-availability-checks.html)
- [Celestia DAS](https://celestia.org/glossary/data-availability-sampling/)
- [KZG Polynomial Commitments](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html)
- [Ethereum Danksharding](https://ethereum.org/en/roadmap/danksharding/)

---

*LP-6433 v1.0.0 - 2026-01-02*
