---
lp: 6430
title: LuxDA Blob API
description: LuxDA Blob API specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the stable API interface for blob dispersal and retrieval in LuxDA. The API is designed to abstract the underlying DA implementation (certificate-based vs DAS) so applications can use a consistent interface across upgrades.

## Motivation

A stable blob API enables:

1. Application development against fixed interfaces
2. DA backend evolution without breaking changes
3. Clear separation between API and implementation
4. Consistent client SDKs across languages

## Specification

### 1. Core API

#### 1.1 Blob Dispersal

```protobuf
service BlobDispersalService {
    // Disperse a blob to the DA layer
    rpc PutBlob(PutBlobRequest) returns (PutBlobResponse);

    // Disperse multiple blobs atomically
    rpc PutBlobs(PutBlobsRequest) returns (PutBlobsResponse);

    // Get dispersal status
    rpc GetDispersal(GetDispersalRequest) returns (GetDispersalResponse);
}

message PutBlobRequest {
    // The blob data
    bytes data = 1;

    // Target namespace (for namespace-specific DA)
    bytes namespace_id = 2;

    // Priority level (affects ordering and fees)
    Priority priority = 3;

    // Authentication
    bytes sender_pub_key = 4;
    bytes signature = 5;
}

message PutBlobResponse {
    // Commitment to the blob
    bytes blob_commitment = 1;

    // Length of the blob
    uint32 blob_len = 2;

    // Reference to availability proof (cert or sampling proof)
    bytes avail_proof_ref = 3;

    // Estimated finalization time
    uint64 estimated_finalization = 4;

    // Dispersal request ID for status tracking
    bytes dispersal_id = 5;
}

enum Priority {
    PRIORITY_LOW = 0;
    PRIORITY_NORMAL = 1;
    PRIORITY_HIGH = 2;
    PRIORITY_URGENT = 3;
}
```

#### 1.2 Blob Retrieval

```protobuf
service BlobRetrievalService {
    // Retrieve a blob by commitment
    rpc GetBlob(GetBlobRequest) returns (GetBlobResponse);

    // Retrieve multiple blobs
    rpc GetBlobs(GetBlobsRequest) returns (stream GetBlobResponse);

    // Check blob availability
    rpc CheckAvailability(CheckAvailabilityRequest) returns (CheckAvailabilityResponse);
}

message GetBlobRequest {
    // The commitment to retrieve
    bytes blob_commitment = 1;

    // Optional: specific providers to query
    repeated bytes provider_ids = 2;

    // Timeout in milliseconds
    uint32 timeout_ms = 3;
}

message GetBlobResponse {
    // Status of retrieval
    RetrievalStatus status = 1;

    // The blob data (if successful)
    bytes data = 2;

    // Proof of correctness
    bytes proof = 3;

    // Provider that served the blob
    bytes provider_id = 4;
}

enum RetrievalStatus {
    RETRIEVAL_SUCCESS = 0;
    RETRIEVAL_NOT_FOUND = 1;
    RETRIEVAL_TIMEOUT = 2;
    RETRIEVAL_UNAVAILABLE = 3;
    RETRIEVAL_INVALID_PROOF = 4;
}
```

### 2. Commitment Schemes

#### 2.1 SHA3-256 Commitment

Default commitment for simplicity:

```go
func SHA3Commitment(blob []byte) [32]byte {
    return sha3.Sum256(blob)
}

func VerifySHA3Commitment(blob []byte, commitment [32]byte) bool {
    return sha3.Sum256(blob) == commitment
}
```

#### 2.2 KZG Commitment

For advanced features (inclusion proofs, DAS):

```go
type KZGCommitment struct {
    // G1 point
    Commitment [48]byte
}

func KZGCommit(blob []byte, setup *TrustedSetup) (*KZGCommitment, error) {
    // Convert blob to field elements
    elements := BlobToFieldElements(blob)

    // Compute polynomial commitment
    commitment := ComputeCommitment(elements, setup)

    return &KZGCommitment{Commitment: commitment}, nil
}

func KZGVerify(blob []byte, commitment *KZGCommitment, setup *TrustedSetup) bool {
    expected, _ := KZGCommit(blob, setup)
    return expected.Commitment == commitment.Commitment
}
```

#### 2.3 Commitment Format

Wire format for commitments:

```
BlobCommitmentV1 := {
    type:       uint8     [1 byte]  // 0=SHA3, 1=KZG
    commitment: bytes32   [32 bytes] (SHA3) or bytes48 [48 bytes] (KZG)
}
```

### 3. Chunking and Encoding

#### 3.1 Blob Chunking

Large blobs are chunked for efficient handling:

```go
const (
    ChunkSize = 512  // 512 bytes per chunk
    MaxBlobSize = 2 * 1024 * 1024  // 2 MiB
    MaxChunks = MaxBlobSize / ChunkSize  // 4096 chunks
)

type BlobChunks struct {
    Chunks      [][]byte
    OriginalLen uint32
    Commitment  [32]byte
}

func ChunkBlob(blob []byte) (*BlobChunks, error) {
    if len(blob) > MaxBlobSize {
        return nil, ErrBlobTooLarge
    }

    numChunks := (len(blob) + ChunkSize - 1) / ChunkSize
    chunks := make([][]byte, numChunks)

    for i := 0; i < numChunks; i++ {
        start := i * ChunkSize
        end := min(start + ChunkSize, len(blob))
        chunks[i] = blob[start:end]
    }

    return &BlobChunks{
        Chunks:      chunks,
        OriginalLen: uint32(len(blob)),
        Commitment:  sha3.Sum256(blob),
    }, nil
}
```

#### 3.2 Erasure Coding Interface

Abstraction for erasure coding (see LP-6432 for params):

```go
type ErasureEncoder interface {
    // Encode data into coded chunks
    Encode(data [][]byte) ([][]byte, error)

    // Decode coded chunks back to data
    Decode(coded [][]byte, indices []int) ([][]byte, error)

    // Get coding parameters
    Params() ErasureParams
}

type ErasureParams struct {
    DataChunks   int  // k
    ParityChunks int  // n-k
    TotalChunks  int  // n
}
```

### 4. Dispersal Flow

#### 4.1 Client Dispersal

```python
def disperse_blob(blob, namespace_id, priority=PRIORITY_NORMAL):
    # 1. Create commitment
    commitment = sha3_256(blob)

    # 2. Chunk and encode
    chunks = chunk_blob(blob)
    coded = erasure_encode(chunks)

    # 3. Build dispersal request
    request = PutBlobRequest(
        data=blob,
        namespace_id=namespace_id,
        priority=priority,
        sender_pub_key=my_pubkey,
        signature=sign(commitment || namespace_id || priority),
    )

    # 4. Submit to disperser
    response = disperser.PutBlob(request)

    # 5. Wait for availability proof
    await wait_for_availability(response.dispersal_id)

    return response.blob_commitment, response.avail_proof_ref
```

#### 4.2 Disperser Processing

```python
def process_dispersal(request):
    # 1. Validate request
    if not verify_signature(request):
        return error("invalid signature")

    if len(request.data) > MaxBlobSize:
        return error("blob too large")

    # 2. Compute commitment
    commitment = compute_commitment(request.data)

    # 3. Chunk and erasure encode
    chunks = chunk_blob(request.data)
    coded = erasure_encode(chunks)

    # 4. Disperse to operators
    dispersal_id = generate_id()
    for i, chunk in enumerate(coded):
        operator = select_operator(i)
        operator.store_chunk(commitment, i, chunk)

    # 5. Collect availability attestations
    attestations = collect_attestations(commitment, threshold)

    # 6. Create availability certificate
    cert = create_certificate(commitment, attestations)

    return PutBlobResponse(
        blob_commitment=commitment,
        blob_len=len(request.data),
        avail_proof_ref=cert.ref,
        dispersal_id=dispersal_id,
    )
```

### 5. Retrieval Flow

#### 5.1 Client Retrieval

```python
def retrieve_blob(commitment):
    # 1. Try local cache
    if cached := local_cache.get(commitment):
        return cached

    # 2. Query availability certificate
    cert = get_certificate(commitment)
    if not cert:
        return error("no availability proof")

    # 3. Request chunks from operators
    chunks = []
    for operator in cert.operators[:num_data_chunks]:
        chunk = operator.get_chunk(commitment, operator.chunk_index)
        if verify_chunk(chunk, commitment, operator.chunk_index):
            chunks.append((operator.chunk_index, chunk))

        if len(chunks) >= data_chunk_threshold:
            break

    # 4. Decode blob
    if len(chunks) < data_chunk_threshold:
        return error("insufficient chunks")

    blob = erasure_decode(chunks)

    # 5. Verify commitment
    if compute_commitment(blob) != commitment:
        return error("commitment mismatch")

    # 6. Cache and return
    local_cache.set(commitment, blob)
    return blob
```

### 6. Error Handling

#### 6.1 Error Types

```go
type DAError struct {
    Code    DAErrorCode
    Message string
    Details map[string]any
}

type DAErrorCode int

const (
    ErrNone               DAErrorCode = 0
    ErrBlobTooLarge       DAErrorCode = 1001
    ErrInvalidCommitment  DAErrorCode = 1002
    ErrDispersalFailed    DAErrorCode = 1003
    ErrRetrievalFailed    DAErrorCode = 1004
    ErrInsufficientChunks DAErrorCode = 1005
    ErrCommitmentMismatch DAErrorCode = 1006
    ErrTimeout            DAErrorCode = 1007
    ErrRateLimited        DAErrorCode = 1008
    ErrUnauthorized       DAErrorCode = 1009
)
```

#### 6.2 Retry Policy

```go
type RetryPolicy struct {
    MaxRetries     int
    InitialDelay   time.Duration
    MaxDelay       time.Duration
    BackoffFactor  float64
    RetryableErrors []DAErrorCode
}

var DefaultRetryPolicy = RetryPolicy{
    MaxRetries:     3,
    InitialDelay:   100 * time.Millisecond,
    MaxDelay:       5 * time.Second,
    BackoffFactor:  2.0,
    RetryableErrors: []DAErrorCode{
        ErrTimeout,
        ErrInsufficientChunks,
    },
}
```

### 7. SDK Interface

#### 7.1 Go SDK

```go
type DAClient interface {
    // Disperse blob and wait for availability
    Put(ctx context.Context, blob []byte, opts ...PutOption) (*BlobRef, error)

    // Retrieve blob by commitment
    Get(ctx context.Context, commitment []byte) ([]byte, error)

    // Check availability status
    Available(ctx context.Context, commitment []byte) (bool, error)

    // Get availability certificate
    GetCert(ctx context.Context, commitment []byte) (*AvailabilityCert, error)
}

// Usage example
func example() {
    client := da.NewClient(endpoint, da.WithAuth(privKey))

    // Disperse
    ref, err := client.Put(ctx, myData, da.WithNamespace(nsId))
    if err != nil {
        return err
    }

    // Retrieve
    data, err := client.Get(ctx, ref.Commitment)
    if err != nil {
        return err
    }
}
```

#### 7.2 TypeScript SDK

```typescript
interface DAClient {
    put(blob: Uint8Array, opts?: PutOptions): Promise<BlobRef>;
    get(commitment: Uint8Array): Promise<Uint8Array>;
    available(commitment: Uint8Array): Promise<boolean>;
    getCert(commitment: Uint8Array): Promise<AvailabilityCert>;
}

// Usage example
async function example() {
    const client = new DAClient(endpoint, { auth: privKey });

    // Disperse
    const ref = await client.put(myData, { namespace: nsId });

    // Retrieve
    const data = await client.get(ref.commitment);
}
```

### 8. Versioning and Upgrades

#### 8.1 API Versioning

```
/v1/blob/put
/v1/blob/get
/v1/blob/available
```

New versions maintain backward compatibility:

```
/v2/blob/put    // New features, v1 still works
/v2/blob/get
```

#### 8.2 Commitment Scheme Migration

When upgrading commitment schemes:

```go
type BlobRef struct {
    // Support multiple commitment types
    SHA3Commitment [32]byte  // Always present
    KZGCommitment  []byte    // Present for KZG blobs
    Version        uint8
}
```

## Rationale

### Why Separate Dispersal and Retrieval?

- Different failure modes
- Different latency requirements
- Different caching strategies
- Independent scaling

### Why Abstract Commitment Scheme?

- SHA3 is simple and widely supported
- KZG enables advanced features (proofs, sampling)
- Migration path without breaking applications

### Why Chunking?

- Efficient storage and transmission
- Enables erasure coding
- Supports partial retrieval

## Security Considerations

### Commitment Binding

Both SHA3 and KZG are binding:
- Finding two inputs with same output is computationally infeasible

### Availability Guarantees

Depend on underlying implementation:
- Certificate mode: Trust committee attestations
- DAS mode: Cryptographic sampling guarantees

### Data Integrity

End-to-end verification:
- Commitment computed by client
- Verified on retrieval
- Cannot be tampered without detection

## Test Plan

### Unit Tests

1. **Chunking**: Round-trip chunking preserves data
2. **Commitment**: Both schemes produce correct commitments
3. **Error Handling**: All error cases covered

### Integration Tests

1. **Put/Get Round Trip**: Disperse and retrieve correctly
2. **Large Blobs**: Handle 2 MiB blobs
3. **Concurrent Access**: Multiple clients simultaneously

### Performance Tests

1. **Dispersal Throughput**: Blobs per second
2. **Retrieval Latency**: Time to first byte
3. **Scaling**: Performance vs blob count

## References

- [EIP-4844: Proto-Danksharding](https://eips.ethereum.org/EIPS/eip-4844)
- [Celestia Blob API](https://docs.celestia.org/developers/node-api)
- [EigenDA API](https://docs.eigenda.xyz/)

---

*LP-6430 v1.0.0 - 2026-01-02*
