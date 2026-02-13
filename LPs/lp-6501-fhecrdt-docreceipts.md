# LP-6501: fheCRDT DocReceipts - Document Update Receipts

| LP | Title | Status | Type | Created |
|-----|-------|--------|------|---------|
| 6501 | fheCRDT DocReceipts | Draft | Standards Track | 2026-01-17 |

## Abstract

This LP specifies the `DocReceipt` transaction type for the fheCRDT architecture. DocReceipts are on-chain records that anchor off-chain document updates, providing global ordering and auditability without storing the actual data on-chain.

## Motivation

fheCRDT applications need a way to:
1. Establish global ordering for document updates
2. Reference off-chain encrypted data
3. Provide audit trails for state changes
4. Enable new nodes to catch up on state history
5. Trigger downstream actions (e.g., smart contract callbacks)

DocReceipts serve as the bridge between on-chain consensus and off-chain data storage, keeping the blockchain lightweight while maintaining full auditability.

## Specification

### DocReceipt Structure

```go
// DocReceipt represents an on-chain record of a document update
type DocReceipt struct {
    // Version of the DocReceipt format
    Version uint16 `json:"version"`

    // Unique identifier for the document
    DocumentID DocumentID `json:"documentId"`

    // Application namespace (e.g., "ecommerce.user.profile")
    Namespace string `json:"namespace"`

    // Sequential version number for this document
    DocumentVersion uint64 `json:"documentVersion"`

    // Hash of the encrypted content stored in DA layer
    ContentHash [32]byte `json:"contentHash"`

    // Size of the content blob in bytes
    ContentSize uint64 `json:"contentSize"`

    // CRDT type used for this document
    CRDTType CRDTType `json:"crdtType"`

    // Reference to the DA Receipt (availability certificate)
    DAReference DAReference `json:"daReference"`

    // Operation metadata
    Operation OperationMeta `json:"operation"`

    // Encryption domain for access control
    EncryptionDomain EncryptionDomain `json:"encryptionDomain"`

    // List of authorized recipient public keys (encrypted access)
    Recipients [][]byte `json:"recipients,omitempty"`

    // Unix timestamp of document update (client time)
    ClientTimestamp int64 `json:"clientTimestamp"`

    // Creator's public key
    Creator []byte `json:"creator"`

    // Signature over the receipt (excluding this field)
    Signature []byte `json:"signature"`
}

// DocumentID uniquely identifies a document
type DocumentID struct {
    // Chain ID where this document lives
    ChainID uint64 `json:"chainId"`

    // Owner's address or public key hash
    Owner [20]byte `json:"owner"`

    // Application-specific document identifier
    LocalID string `json:"localId"`
}

// DAReference points to data in the DA layer
type DAReference struct {
    // DA layer type (e.g., LuxDA, Celestia, EigenDA)
    DALayer string `json:"daLayer"`

    // Blob identifier in the DA layer
    BlobID string `json:"blobId"`

    // Hash of the availability certificate
    CertificateHash [32]byte `json:"certificateHash"`

    // Commitment for data retrieval
    Commitment []byte `json:"commitment"`
}

// OperationMeta describes the operation that produced this update
type OperationMeta struct {
    // Type of operation (create, update, delete, merge)
    Type OperationType `json:"type"`

    // Number of CRDT operations in this batch
    OpCount uint32 `json:"opCount"`

    // Previous document version (for chaining)
    PreviousVersion uint64 `json:"previousVersion,omitempty"`

    // Hash of previous DocReceipt (for chaining)
    PreviousHash [32]byte `json:"previousHash,omitempty"`

    // Merge sources if this is a merge operation
    MergeSources []MergeSource `json:"mergeSources,omitempty"`
}

// OperationType defines document operation types
type OperationType uint8

const (
    OpCreate OperationType = iota
    OpUpdate
    OpDelete
    OpMerge
    OpSnapshot
)

// MergeSource identifies a source in a merge operation
type MergeSource struct {
    ReplicaID string   `json:"replicaId"`
    Version   uint64   `json:"version"`
    Hash      [32]byte `json:"hash"`
}
```

### Transaction Format

DocReceipts are submitted as transactions on the Lux chain:

```
Transaction Type: 0x80 (DocReceipt)
Payload: RLP-encoded DocReceipt struct
Gas Cost: Base cost + (ContentSize / 1024) * DataFactor
```

### Validation Rules

1. **Version Check**: `Version` must be supported (currently 1)
2. **Signature Verification**: `Signature` must be valid for `Creator`
3. **Namespace Format**: Must match `^[a-z][a-z0-9.]{0,63}$`
4. **Content Hash**: Must be 32 bytes (SHA-256)
5. **DA Reference**: Must reference valid DA layer and blob
6. **Timestamp**: Must be within ±5 minutes of block time
7. **Sequential Version**: For updates, `DocumentVersion` must be `PreviousVersion + 1`
8. **Chain Linking**: `PreviousHash` must match actual previous DocReceipt hash

### Indexing

Validators and indexers should maintain indices for:

```sql
-- Primary index by document
CREATE INDEX idx_docreceipt_document ON docreceipts(
    document_id,
    document_version DESC
);

-- Index by namespace for application queries
CREATE INDEX idx_docreceipt_namespace ON docreceipts(
    namespace,
    client_timestamp DESC
);

-- Index by creator for user queries
CREATE INDEX idx_docreceipt_creator ON docreceipts(
    creator,
    client_timestamp DESC
);

-- Index by block for sync
CREATE INDEX idx_docreceipt_block ON docreceipts(
    block_number,
    tx_index
);
```

### Querying

Clients can query DocReceipts via RPC:

```json
// Get latest version of a document
{
    "method": "fhecrdt_getDocReceipt",
    "params": {
        "documentId": "0x...",
        "version": "latest"
    }
}

// Get document history
{
    "method": "fhecrdt_getDocHistory",
    "params": {
        "documentId": "0x...",
        "fromVersion": 1,
        "toVersion": 100
    }
}

// List receipts by namespace
{
    "method": "fhecrdt_listReceipts",
    "params": {
        "namespace": "ecommerce.orders",
        "since": 1705500000,
        "limit": 100
    }
}
```

### Gas Costs

| Operation | Base Cost | Per-KB Factor |
|-----------|-----------|---------------|
| Create | 21,000 | 16 |
| Update | 15,000 | 16 |
| Delete | 10,000 | 0 |
| Merge | 25,000 | 16 |
| Snapshot | 30,000 | 32 |

### Events

DocReceipt transactions emit events for indexing:

```solidity
event DocumentCreated(
    bytes32 indexed documentId,
    string namespace,
    address indexed creator,
    bytes32 contentHash
);

event DocumentUpdated(
    bytes32 indexed documentId,
    uint64 version,
    bytes32 contentHash,
    bytes32 previousHash
);

event DocumentDeleted(
    bytes32 indexed documentId,
    uint64 finalVersion,
    address indexed deletedBy
);
```

## Rationale

### Why On-Chain Receipts?

1. **Global Ordering**: Chain consensus provides deterministic ordering
2. **Auditability**: Immutable log of all state changes
3. **Discoverability**: New nodes can find and sync data
4. **Triggers**: Smart contracts can react to document updates

### Why Not Store Data On-Chain?

1. **Cost**: Storing large blobs on-chain is prohibitively expensive
2. **Privacy**: On-chain data is public; we want encryption
3. **Scalability**: Block size limits would restrict throughput
4. **Flexibility**: DA layer can optimize storage/retrieval

### Chain Linking

Linking DocReceipts via `PreviousHash` creates a document-specific chain within the main blockchain. This enables:
- Efficient verification of document history
- Detection of missing updates
- Fork detection and resolution

## Security Considerations

1. **Replay Protection**: Each DocReceipt includes chain ID and nonce
2. **Front-Running**: Consider commit-reveal for sensitive operations
3. **Spam Prevention**: Gas costs deter excessive receipt submission
4. **Privacy Leakage**: Metadata (timestamps, sizes) may leak information

## Backwards Compatibility

This is a new transaction type. Existing chains must upgrade to support DocReceipts.

## Test Vectors

```json
{
    "testCase": "basic_docreceipt",
    "input": {
        "version": 1,
        "documentId": {
            "chainId": 1,
            "owner": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
            "localId": "profile-v1"
        },
        "namespace": "user.profile",
        "documentVersion": 1,
        "contentHash": "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89",
        "contentSize": 1024,
        "crdtType": 7,
        "daReference": {
            "daLayer": "luxda",
            "blobId": "blob_abc123",
            "certificateHash": "0x...",
            "commitment": "0x..."
        },
        "operation": {
            "type": 0,
            "opCount": 1
        },
        "encryptionDomain": 0,
        "clientTimestamp": 1705500000,
        "creator": "0x..."
    },
    "expectedHash": "0x..."
}
```

## Related LPs

- [LP-6500: fheCRDT Architecture](lp-6500-fhecrdt-architecture.md)
- [LP-6502: fheCRDT DAReceipts](lp-6502-fhecrdt-dareceipts.md)
- [LP-6431: Availability Certificates](lp-6431-availability-certificates.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
