# LP-6500: fheCRDT Architecture - Privacy-Preserving App-Chains

| LP | Title | Status | Type | Created |
|-----|-------|--------|------|---------|
| 6500 | fheCRDT Architecture | Draft | Standards Track | 2026-01-17 |

## Abstract

fheCRDT is a new architecture in the Lux ecosystem that combines the strengths of public blockchain consensus with local-first data replication and encryption. It marries public chain ordering, durable data availability (DA) storage, CRDT-based state synchronization, local SQLite materialization, and optional encrypted compute (via TEE or FHE). The result is a privacy-preserving, scalable "app-chain" model where applications (like ecommerce marketplaces) can operate with high throughput and offline capability, without sacrificing security or decentralization.

This design eliminates the need for leader-based consensus protocols (no Raft/Paxos clusters) by leveraging CRDTs for conflict-free replication and Lux's chain for finality, all while keeping user data end-to-end encrypted.

## Motivation

Traditional blockchain applications face several challenges:
- **Latency**: Users must wait for block confirmation
- **Online requirement**: Apps stop working without network connectivity
- **Privacy**: All data is public on-chain
- **Scalability**: Every operation must pass through consensus

fheCRDT addresses all of these by enabling:
- Offline-first operation with instant local updates
- End-to-end encryption for all application data
- CRDT-based conflict resolution without central coordination
- Blockchain finality only for ordering, not data storage

## Architecture Components

### 1. Public Chain Ordering & Finality

A Lux L1 chain (or subnet) provides global ordering of events and fast finality for transactions. This ensures that all replicas eventually see a consistent sequence of operations, anchored by the chain's consensus.

The chain records lightweight receipts (e.g. `DocReceipt` transactions) that reference off-chain data updates, serving as an immutable log of state changes. By using Lux's high-performance consensus, operations confirm quickly and are finalized without forks, establishing a ground truth timeline for state updates.

### 2. Durable Data Availability (DA) Layer

Large application data (blobs of encrypted state or CRDT logs) is stored off-chain in the Lux DA layer (LuxDA). When an app needs to persist or share state, it disperses an encrypted blob to DA operators.

These operators attest that the data is stored and available by signing a **DA Receipt** (an availability certificate). This certificate (or a hash of it) is then posted on-chain in the `DocReceipt` transaction.

The DA layer guarantees that even if users go offline, their data remains retrievable by others, with fast availability confirmation (~0.5s by committee attestations). LuxDA operates in a trust-minimized mode (upgradable to full Data Availability Sampling in the future), ensuring data is reliably stored without burdening the L1 chain with large files.

See [LP-6431: Availability Certificates](lp-6431-availability-certificates.md) for detailed DA specification.

### 3. CRDT-Based State Model

State is modeled as **CRDTs (Conflict-Free Replicated Data Types)**, which allow concurrent updates and merges without conflicts. Each participant (user, merchant, etc.) keeps a local copy of the state and can update it independently – even offline – and the CRDT guarantees that when all updates propagate, every copy will converge to the same state.

This removes the need for a single leader or strict global locking on writes. Instead of forcing all transactions through a single sequencer in real-time, operations can be applied in any order and still resolve consistently.

**Supported CRDT Types:**
- **LWW Register**: Last-Writer-Wins register for simple values
- **MV Register**: Multi-Value register preserving concurrent writes
- **G-Counter**: Grow-only counter
- **PN-Counter**: Positive-negative counter
- **G-Set**: Grow-only set
- **2P-Set**: Two-phase set (add/remove)
- **OR-Set**: Observed-Remove set
- **LWW-Map**: Last-Writer-Wins map
- **RGA List**: Replicated Growable Array for ordered lists

### 4. Local SQLite Materialization

Each node or user runs a lightweight SQLite database that materializes the CRDT state into a familiar relational form. The CRDT acts as the convergence engine beneath the hood, while SQLite provides a convenient query layer on top of the replicated state.

Developers can build on a normal SQL schema and use local queries for app logic, with the assurance that the SQLite DB will stay in sync across devices (thanks to CRDT sync).

The "source of truth" is collectively maintained by all replicas and notarized by the chain, rather than a central cloud DB. Materializing state locally means reads and writes are low-latency (no network call needed) and apps continue operating smoothly offline.

### 5. Encrypted Compute (TEE/FHE)

To preserve privacy, all application data in this model is kept encrypted—both at rest in the DA layer and in motion between clients. Lux's architecture optionally leverages **Trusted Execution Environments (TEE)** and **Fully Homomorphic Encryption (FHE)** to enable computations on encrypted data without revealing it.

**TEE Options:**
- Intel SGX
- AMD SEV
- NVIDIA Confidential Computing
- ARM TrustZone
- AWS Nitro Enclaves

**FHE Schemes:**
- BFV (integer arithmetic)
- CKKS (approximate arithmetic)
- TFHE (boolean circuits)

See [LP-7302: Z-Chain Privacy & Attestation](lp-7302-lux-z-a-chain-privacy-ai-attestation-layer.md) for FHE/TEE integration details.

## How fheCRDT Works (Step-by-Step)

### Example: E-commerce Use Case

#### Step 1: Per-User Encrypted State

Each user in the marketplace has an encrypted data blob representing their profile, preferences, order history, etc., structured as a CRDT (e.g. a JSON document CRDT). The merchant maintains CRDT documents for product listings, inventory, and so on.

All data is sharded per user or per logical document – rather than one giant global state – improving privacy and scalability. Encryption keys are held by the data owners (user holds their profile key; merchant holds product data keys).

#### Step 2: Local Updates, Offline-First

When a user updates their profile or adds an item to their cart, the update is applied immediately to the user's local SQLite store and CRDT state. The app remains responsive even offline.

The change is logged as a CRDT operation (e.g. "add this entry to Addresses set") that will later be synced. Multiple offline edits can happen in parallel; the CRDT will merge them without conflict.

#### Step 3: Data Dispersal to LuxDA

When the user's device is online (or when a batch of operations is ready), it disperses the encrypted CRDT delta to the Lux DA layer. The data blob is tagged with a namespace and version.

The LuxDA network stores the blob redundantly. DA operators perform a quick availability committee process: each stores their piece of the erasure-coded data and signs an attestation. The outcome is an **Availability Certificate** confirming the blob is stored.

#### Step 4: On-Chain Receipt (Ordering the Update)

The user's client submits a `DocReceipt` transaction to the Lux chain. This transaction includes:
- Reference to the data blob (content hash or DA commitment)
- Availability certificate or its aggregate signature
- Document identifier and version

When confirmed on-chain, this establishes global order for the update. Finality occurs within seconds.

#### Step 5: Replication and Merge

Other parties (merchant server, user's other devices) see the on-chain receipt and fetch the encrypted blob from the DA layer. The availability certificate ensures data integrity.

Upon retrieval, the recipient's node merges the new data into its local CRDT state. Because CRDT merges are mathematically guaranteed to converge, both parties end up with the same state. Their local SQLite views are updated automatically.

#### Step 6: Selective Decryption & Compute

For operations requiring access to encrypted data:
- **Selective sharing**: User encrypts specific fields to merchant's public key
- **TEE processing**: Enclave decrypts internally for processing (e.g., shipping label)
- **FHE computation**: Merchant sends encrypted computation, gets encrypted result

#### Step 7: Iteration and Continuity

The cycle repeats for each state update. CRDT logic handles concurrent edits. Blockchain receipts form an ordered log for auditors or new nodes. Periodic snapshots can be anchored on-chain for additional security.

## New Transaction Types

### DocReceipt

A transaction or log entry on a Lux chain that records a document update event.

```go
type DocReceipt struct {
    DocumentID    string    // Unique document identifier
    ContentHash   [32]byte  // Hash of the encrypted content
    Version       uint64    // Document version number
    Namespace     string    // Application namespace
    DACommitment  []byte    // DA layer commitment/certificate hash
    Timestamp     int64     // Unix timestamp
    Signature     []byte    // Creator's signature
}
```

### DAReceipt (Availability Certificate)

A signed certificate from the Data Availability layer confirming blob storage.

```go
type DAReceipt struct {
    BlobID        string    // Unique blob identifier
    ContentHash   [32]byte  // Hash of the stored content
    Size          uint64    // Blob size in bytes
    ErasureRoot   [32]byte  // Erasure coding merkle root
    Signers       [][]byte  // Committee member public keys
    Signatures    [][]byte  // Committee signatures
    Threshold     int       // Minimum signatures required
    Timestamp     int64     // Attestation timestamp
    ExpiresAt     int64     // Data retention expiry
}
```

## Encryption Domains

fheCRDT supports multiple encryption domains for fine-grained access control:

| Domain | Description | Access |
|--------|-------------|--------|
| `UserPrivate` | Only the user can decrypt | User's keys only |
| `MerchantPrivate` | Only merchant can decrypt | Merchant's keys only |
| `Shared` | Multi-party access | Threshold decryption |
| `Public` | Unencrypted | No encryption |

## Benefits Summary

### No Leaders, No Lag

- **No elected master node** ordering transactions in real-time
- **Resilient to faults** and network splits
- **Offline operation** with eventual sync
- **Local-first responsiveness** with global trust

### End-to-End Encryption

- DA nodes and validators cannot read user or business data
- Only ciphertexts and hashes are visible
- Compliance-sensitive information remains confidential
- Aligns with GDPR and data sovereignty requirements

### Scalability

- Heavy lifting happens off-chain
- Chain transactions are minimal (receipts only)
- No block gas limits on data operations
- Horizontal scaling through sharding

## Security Considerations

1. **Key Management**: Users must securely store encryption keys
2. **TEE Attestation**: Verify enclave integrity before trusting computations
3. **DA Committee**: Ensure sufficient threshold for availability guarantees
4. **CRDT Conflicts**: Some operations may require application-level conflict resolution
5. **Timing Attacks**: Consider timing side-channels in encrypted computations

## Related LPs

- [LP-6431: Availability Certificates](lp-6431-availability-certificates.md)
- [LP-6432: Erasure Coding](lp-6432-erasure-coding.md)
- [LP-6470: TFHE Sidecar](lp-6470-tfhe-sidecar.md)
- [LP-6474: Threshold Decryption](lp-6474-threshold-decryption.md)
- [LP-7075: TEE Integration Standard](lp-7075-tee-integration-standard.md)
- [LP-7302: Z-Chain Privacy & Attestation](lp-7302-lux-z-a-chain-privacy-ai-attestation-layer.md)

## Implementation

Reference implementation available in the Lux Node repository:
- `vms/chainadapter/fhecrdt.go` - Core CRDT types and engine
- `vms/chainadapter/fhecrdt_encryption.go` - Encryption and key management
- `vms/chainadapter/fhecrdt_compute.go` - Confidential compute (TEE/FHE)
- `vms/chainadapter/fhecrdt_da.go` - Data availability integration
- `vms/chainadapter/appchain.go` - AppChain implementation with SQLite

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
