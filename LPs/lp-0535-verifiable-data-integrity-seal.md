---
lp: 535
title: Verifiable Data Integrity Seal Protocol
description: Unified protocol for tamper-proof data sealing, verification, and provenance across the Lux FHE+ZK stack
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-02-13
requires: 510, 530, 3658
tags: [zchain, data-integrity, seal, verification, provenance, fhe, zk]
order: 535
tier: product
activation:
  flag: lp0535-data-seal
  hfName: "Fortuna"
  activationHeight: "TBD"
---

## Abstract

LP-0535 specifies the **Verifiable Data Integrity Seal Protocol** (VDIS), a unified framework for creating tamper-proof, independently verifiable cryptographic seals over arbitrary data using the Lux FHE+ZK stack. A DataSeal binds a cryptographic fingerprint of any digital asset -- documents, AI models, media files, financial records, sensor readings -- to the Z-Chain Receipt Registry (LP-0530) via Poseidon2 hashing (LP-3658) and STARK/SNARK verification (LP-0510). Seals are independently verifiable without reliance on any central authority, exportable cross-chain via Groth16 wrappers, and optionally privacy-preserving through FHE encryption (LP-200) or ZK selective disclosure. The protocol provides a scalable, blockchain-anchored alternative to centralized verification services, enabling court-admissible proof of data authenticity, AI model provenance, media integrity, and regulatory compliance at enterprise scale.

## Motivation

### The Trust Crisis

Digital data integrity faces unprecedented challenges:

1. **AI-Generated Content**: Deepfakes, synthetic media, and LLM-generated text are indistinguishable from authentic content, eroding trust in journalism, legal evidence, and business records.
2. **Data Manipulation**: Cybercriminals alter financial records, audit logs, and compliance documents at scale. By 2030, fraud costs are projected to exceed $10 trillion annually.
3. **Model Tampering**: AI/ML models can be poisoned, backdoored, or altered post-training without detection, creating liability for enterprises deploying AI systems.
4. **Regulatory Pressure**: The EU AI Act, US Executive Order on AI Safety, and emerging global frameworks demand auditable, verifiable AI governance and data provenance.

### Why Existing Solutions Fail

| Approach | Limitation |
|----------|-----------|
| Manual review | Does not scale; subjective |
| Centralized signatories | Single point of failure; trust bottleneck |
| Private hashing | No independent verification; non-repudiation gap |
| Timestamping services | Centralized; no proof of content integrity |
| Traditional blockchain | Expensive at scale; no privacy; no ZK proofs |

### The Lux Advantage

The Lux FHE+ZK stack provides a unique combination of capabilities:

- **ZK Proof Verification** (LP-0510): Verify computational integrity without revealing inputs
- **Receipt Registry** (LP-0530): Canonical on-chain proof storage with Merkle accumulator
- **Poseidon2 Hashing** (LP-3658): ZK-friendly, post-quantum-safe cryptographic fingerprints at 2M hashes/sec
- **FHE Encryption** (LP-200): Compute over encrypted data without decryption
- **fheCRDT** (LP-6500): Privacy-preserving document management with DA integration
- **Cross-Chain Export** (LP-0530): Groth16 wrapper proofs for external verification

VDIS unifies these primitives into a single, product-level protocol.

## Specification

### Core Concepts

#### DataSeal

A **DataSeal** is an immutable cryptographic binding between:

1. A **data fingerprint** (Poseidon2 hash of the sealed content)
2. A **seal metadata** envelope (creator, timestamp, schema, classifications)
3. A **Z-Chain receipt** (on-chain proof of existence and integrity)
4. An optional **Merkle inclusion proof** (for independent offline verification)

```solidity
struct DataSeal {
    bytes32 sealId;              // Unique seal identifier
    bytes32 contentHash;         // Poseidon2(content)
    bytes32 metadataHash;        // Poseidon2(metadata)
    uint32  sealType;            // Type of sealed content
    uint64  timestamp;           // Block timestamp at seal creation
    address creator;             // Seal creator address
    bytes32 receiptId;           // LP-0530 receipt reference
    uint32  proofSystemId;       // Proof system used (1=STARK, 2=Groth16, etc.)
    bytes32 merkleRoot;          // Root at time of sealing
    bytes   inclusionProof;      // Merkle path for offline verification
}
```

#### Seal Types

| Type ID | Name | Description | Use Case |
|---------|------|-------------|----------|
| 1 | `DOCUMENT` | Text documents, PDFs, legal filings | Legal, compliance |
| 2 | `MEDIA` | Images, audio, video files | Journalism, content auth |
| 3 | `AI_MODEL` | ML model weights, architectures | AI governance |
| 4 | `AI_OUTPUT` | LLM/model inference outputs | AI content provenance |
| 5 | `DATASET` | Training data, datasets | Data provenance |
| 6 | `TRANSACTION` | Financial records, trades | Finance, audit |
| 7 | `IOT_READING` | Sensor data, telemetry | Supply chain, IoT |
| 8 | `SOFTWARE` | Code, binaries, configurations | Software supply chain |
| 9 | `IDENTITY` | Credentials, attestations | KYC, identity |
| 10 | `EVIDENCE` | Court evidence, whistleblower data | Legal proceedings |
| 11-99 | Reserved | Future standard types | - |
| 100+ | Custom | Application-defined types | - |

#### Seal Metadata

```solidity
struct SealMetadata {
    string  contentType;         // MIME type (e.g., "application/pdf")
    string  schema;              // Metadata schema version
    bytes32 previousSealId;      // Chain of seals (for versioned documents)
    bytes32 parentSealId;        // Hierarchical sealing (model → output)
    string  description;         // Human-readable description
    bytes   extensions;          // Application-specific metadata (ABI-encoded)
}
```

### Precompile Interface

#### Address Map

| Address | Name | Description |
|---------|------|-------------|
| `0x0535` | `SEAL_REGISTRY` | Main seal creation and query interface |
| `0x0536` | `SEAL_VERIFY` | Seal verification and validation |
| `0x0537` | `SEAL_BATCH` | Batch sealing for high-volume scenarios |
| `0x0538` | `SEAL_PRIVACY` | Privacy-preserving seal operations |

#### Seal Creation

```solidity
interface IDataSealRegistry {
    /// @notice Create a seal for data content
    /// @param contentHash Poseidon2 hash of the content being sealed
    /// @param sealType Type classification (see Seal Types)
    /// @param metadata Encoded SealMetadata
    /// @return sealId Unique seal identifier
    /// @return receiptId LP-0530 receipt reference
    function createSeal(
        bytes32 contentHash,
        uint32 sealType,
        bytes calldata metadata
    ) external returns (bytes32 sealId, bytes32 receiptId);

    /// @notice Create a seal with ZK proof of content properties
    /// @param contentHash Poseidon2 hash of the content
    /// @param sealType Type classification
    /// @param metadata Encoded SealMetadata
    /// @param proof ZK proof of content properties (e.g., "content is unaltered")
    /// @param publicInputs Public inputs to the proof
    /// @return sealId Unique seal identifier
    function createVerifiedSeal(
        bytes32 contentHash,
        uint32 sealType,
        bytes calldata metadata,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external returns (bytes32 sealId);

    /// @notice Create a privacy-preserving seal (content hash encrypted)
    /// @param encryptedContentHash FHE-encrypted content hash
    /// @param sealType Type classification
    /// @param metadata Encoded SealMetadata (may be partially encrypted)
    /// @return sealId Unique seal identifier
    function createPrivateSeal(
        bytes calldata encryptedContentHash,
        uint32 sealType,
        bytes calldata metadata
    ) external returns (bytes32 sealId);
}
```

#### Seal Verification

```solidity
interface IDataSealVerify {
    /// @notice Verify a seal against content
    /// @param sealId The seal to verify
    /// @param contentHash Poseidon2 hash of the content to check
    /// @return valid True if content matches the sealed hash
    /// @return seal The full DataSeal record
    function verifySeal(
        bytes32 sealId,
        bytes32 contentHash
    ) external view returns (bool valid, DataSeal memory seal);

    /// @notice Verify a seal using only the inclusion proof (offline-capable)
    /// @param seal The DataSeal with inclusion proof
    /// @param merkleRoot The trusted Merkle root
    /// @return valid True if the seal is authentic
    function verifyOffline(
        DataSeal calldata seal,
        bytes32 merkleRoot
    ) external pure returns (bool valid);

    /// @notice Verify a chain of seals (document version history)
    /// @param sealIds Ordered list of seal IDs in the chain
    /// @return valid True if the chain is unbroken and authentic
    /// @return chainLength Number of valid seals in chain
    function verifySealChain(
        bytes32[] calldata sealIds
    ) external view returns (bool valid, uint256 chainLength);

    /// @notice Verify a parent-child seal relationship (model → output)
    /// @param parentSealId The parent seal (e.g., AI model)
    /// @param childSealId The child seal (e.g., model output)
    /// @return valid True if the relationship is authentic
    function verifyLineage(
        bytes32 parentSealId,
        bytes32 childSealId
    ) external view returns (bool valid);
}
```

#### Batch Sealing

```solidity
interface IDataSealBatch {
    /// @notice Seal multiple items in a single transaction
    /// @param contentHashes Array of Poseidon2 content hashes
    /// @param sealTypes Array of seal type classifications
    /// @param metadataArray Array of encoded metadata
    /// @return sealIds Array of created seal identifiers
    function batchSeal(
        bytes32[] calldata contentHashes,
        uint32[] calldata sealTypes,
        bytes[] calldata metadataArray
    ) external returns (bytes32[] memory sealIds);

    /// @notice Create a Merkle tree seal over a batch of items
    /// @param contentHashes Array of content hashes (tree leaves)
    /// @param sealType Common seal type for all items
    /// @param batchMetadata Metadata for the batch as a whole
    /// @return batchSealId Seal for the batch root
    /// @return itemSealIds Individual seals for each item
    function batchTreeSeal(
        bytes32[] calldata contentHashes,
        uint32 sealType,
        bytes calldata batchMetadata
    ) external returns (bytes32 batchSealId, bytes32[] memory itemSealIds);
}
```

#### Privacy Operations

```solidity
interface IDataSealPrivacy {
    /// @notice Prove a sealed document has a property without revealing content
    /// @param sealId The seal to prove against
    /// @param propertyProof ZK proof of the property
    /// @param propertyId Identifier for the property being proven
    /// @return valid True if the property holds
    function proveProperty(
        bytes32 sealId,
        bytes calldata propertyProof,
        bytes32 propertyId
    ) external view returns (bool valid);

    /// @notice Reveal a seal's content hash to a specific party (FHE re-encryption)
    /// @param sealId The private seal
    /// @param recipientPubKey Recipient's public key for re-encryption
    /// @return reEncryptedHash Content hash re-encrypted for recipient
    function selectiveDisclose(
        bytes32 sealId,
        bytes calldata recipientPubKey
    ) external returns (bytes memory reEncryptedHash);

    /// @notice Prove two private seals reference the same content (without revealing it)
    /// @param sealId1 First seal
    /// @param sealId2 Second seal
    /// @param equalityProof ZK proof of equality
    /// @return equal True if seals reference identical content
    function proveEquality(
        bytes32 sealId1,
        bytes32 sealId2,
        bytes calldata equalityProof
    ) external view returns (bool equal);
}
```

### Gas Schedule

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| `createSeal` | 50,000 | Includes Poseidon2 hash + receipt creation |
| `createVerifiedSeal` | 50,000 + proof_gas | Additional cost for ZK proof verification |
| `createPrivateSeal` | 75,000 | FHE encryption overhead |
| `verifySeal` | 5,000 | Read-only verification |
| `verifyOffline` | 3,000 | Pure computation, no storage reads |
| `verifySealChain` | 5,000 × N | N = chain length |
| `verifyLineage` | 10,000 | Two seal reads + relationship check |
| `batchSeal` | 30,000 + 20,000 × N | Amortized batch overhead |
| `batchTreeSeal` | 50,000 + 15,000 × N | Merkle tree construction |
| `proveProperty` | 10,000 + proof_gas | ZK proof verification |
| `selectiveDisclose` | 100,000 | FHE re-encryption |
| `proveEquality` | 20,000 + proof_gas | ZK equality proof |

### Seal Lifecycle

```
                    ┌──────────┐
                    │  Content  │
                    │  (file,   │
                    │  model,   │
                    │  media)   │
                    └─────┬────┘
                          │
                    ┌─────▼────┐
                    │ Poseidon2 │
                    │   Hash    │ ← LP-3658
                    └─────┬────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────▼────┐ ┌───▼───┐ ┌────▼─────┐
        │  Public   │ │  ZK   │ │ Private  │
        │   Seal    │ │ Seal  │ │  Seal    │
        │           │ │       │ │ (FHE)    │
        └─────┬────┘ └───┬───┘ └────┬─────┘
              │           │          │
              └───────────┼──────────┘
                          │
                    ┌─────▼────┐
                    │ Receipt  │
                    │ Registry │ ← LP-0530
                    └─────┬────┘
                          │
                    ┌─────▼────┐
                    │  Merkle  │
                    │   Root   │ ← Poseidon2 tree
                    └─────┬────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
        ┌─────▼────┐ ┌───▼────┐ ┌───▼──────┐
        │ On-Chain  │ │ Cross- │ │ Offline  │
        │  Query    │ │ Chain  │ │ Verify   │
        │           │ │ Export │ │ (proof)  │
        └──────────┘ └────────┘ └──────────┘
```

### Cross-Chain Export

Seals can be verified on external chains via two mechanisms:

1. **Groth16 Wrapper** (LP-0530 export): Wrap the Merkle inclusion proof in a Groth16 proof verifiable on Ethereum or any EVM chain
2. **Light Client Proof** (LP-6350): Use Lux light client to verify the Z-Chain block containing the seal

```solidity
/// Export a seal for cross-chain verification
function exportSeal(bytes32 sealId) external returns (
    bytes memory groth16Proof,    // Verifiable on external EVM chains
    bytes32 merkleRoot,           // Z-Chain Merkle root
    uint256 blockNumber,          // Block containing the root
    bytes memory blockProof       // Light client block proof
);
```

### REST API

For non-blockchain integrations, the Z-Chain exposes a REST API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/seal/create` | POST | Create a new data seal |
| `/seal/{sealId}` | GET | Retrieve seal details |
| `/seal/{sealId}/verify` | POST | Verify content against a seal |
| `/seal/{sealId}/proof` | GET | Get Merkle inclusion proof |
| `/seal/{sealId}/export` | GET | Export for cross-chain verification |
| `/seal/batch` | POST | Batch seal creation |
| `/seal/chain/{sealId}` | GET | Get seal chain (version history) |
| `/seal/lineage/{sealId}` | GET | Get parent/child seal relationships |

### RPC Methods

| Method | Description |
|--------|-------------|
| `seal_create` | Create a data seal |
| `seal_verify` | Verify seal against content hash |
| `seal_get` | Query seal by ID |
| `seal_getProof` | Get Merkle inclusion proof |
| `seal_export` | Export seal with Groth16 wrapper |
| `seal_batch` | Batch seal creation |
| `seal_verifyChain` | Verify seal version chain |
| `seal_verifyLineage` | Verify parent-child relationship |
| `seal_proveProperty` | ZK property proof on sealed content |

## Rationale

### Why Poseidon2 for Content Hashing

| Hash Function | PQ-Safe | ZK-Friendly | Speed | Choice |
|---------------|---------|-------------|-------|--------|
| SHA-256 | Yes | No (expensive in circuits) | Fast | - |
| Keccak-256 | Yes | No (expensive in circuits) | Fast | - |
| Poseidon2 | Yes | Yes (native in STARK/SNARK) | 2M/sec | **Selected** |
| Pedersen | No | Yes | 1K/sec | Legacy only |

Poseidon2 enables efficient ZK proofs *about* sealed content (e.g., "this document contains field X with value Y" without revealing the full document) because the hash can be verified inside a ZK circuit at ~300 constraints vs. ~25,000 for SHA-256.

### Why Three Seal Modes

1. **Public Seal**: Maximum transparency. Anyone can verify. Suitable for journalism, open-source software, public records.
2. **ZK Seal**: Content hidden, properties provable. Suitable for trade secrets, proprietary models, confidential transactions.
3. **Private Seal**: Content encrypted via FHE. Selective disclosure to authorized parties. Suitable for whistleblower evidence, medical records, classified information.

### Seal Chains vs. Seal Trees

**Seal Chains** (linear version history):
```
SealV1 → SealV2 → SealV3  (document revisions)
```

**Seal Trees** (hierarchical provenance):
```
ModelSeal ──→ OutputSeal1
           ├─→ OutputSeal2
           └─→ OutputSeal3
```

Both are supported because real-world data relationships are both sequential (document versions) and hierarchical (model → outputs).

## Use Cases

### 1. AI Model Provenance

```
1. Train model → hash weights → createSeal(hash, AI_MODEL, metadata)
2. Run inference → hash output → createVerifiedSeal(hash, AI_OUTPUT, metadata, proof)
   where proof demonstrates output was produced by sealed model
3. verifyLineage(modelSealId, outputSealId) → confirms provenance chain
```

### 2. Investigative Journalism

```
1. Journalist obtains source document
2. createSeal(hash, DOCUMENT, metadata) → immutable timestamp
3. Edits published with verifySealChain() showing version history
4. Court subpoena → exportSeal() provides cross-chain verifiable proof
```

### 3. Whistleblower Protection

```
1. Whistleblower seals evidence: createPrivateSeal(encHash, EVIDENCE, metadata)
2. Existence proven without revealing content (seal is on-chain, content is encrypted)
3. Selective disclosure: selectiveDisclose(sealId, investigatorPubKey)
4. Investigator verifies: verifySeal(sealId, contentHash)
```

### 4. AI Regulatory Compliance (EU AI Act)

```
1. Seal training dataset: batchSeal(datasetHashes, DATASET, metadata)
2. Seal model: createSeal(modelHash, AI_MODEL, metadata)
3. Seal inference outputs: createVerifiedSeal(outputHash, AI_OUTPUT, ...)
4. Regulator audits: verifySealChain() + verifyLineage() → full provenance
```

### 5. Enterprise Document Integrity

```
1. Financial report created → createSeal(hash, DOCUMENT, metadata)
2. Quarterly review → verifySeal(sealId, hash) confirms no tampering
3. Cross-org verification → exportSeal() for partner chain verification
4. Audit trail → seal chain shows complete document history
```

### 6. Media Content Authentication

```
1. Photographer captures image → createSeal(hash, MEDIA, metadata)
   metadata includes: camera EXIF, GPS, timestamp
2. Published online → verifySeal() confirms original
3. Deepfake detected → compare against sealed original
4. Legal proceeding → exportSeal() for court-admissible proof
```

### 7. Cyber Insurance Claims

```
1. System logs sealed in real-time: batchSeal(logHashes, DOCUMENT, ...)
2. Incident occurs → sealed logs prove pre-incident state
3. Claim filed → verifySealChain() proves log integrity
4. Insurer verifies → exportSeal() for independent verification
```

## Backwards Compatibility

This LP introduces new precompile addresses (`0x0535`-`0x0538`) that do not conflict with existing allocations. The protocol builds on and is fully compatible with:

- LP-0530 Receipt Registry (receipts are stored there)
- LP-0510 STARK Verification (proofs use existing verification)
- LP-3658 Poseidon2 (hashing uses existing precompile)
- LP-200 fhEVM (privacy seals use existing FHE operations)

No changes to existing LP interfaces are required.

## Test Cases

### Unit Tests

| Test | Description | Expected |
|------|-------------|----------|
| `TestCreateSeal` | Create seal with valid content hash | Seal ID returned, receipt created |
| `TestVerifySeal` | Verify seal against correct content | `valid = true` |
| `TestVerifySealWrongContent` | Verify seal against wrong content | `valid = false` |
| `TestCreateVerifiedSeal` | Create seal with ZK proof | Seal created, proof verified |
| `TestCreatePrivateSeal` | Create FHE-encrypted seal | Seal created, hash encrypted |
| `TestVerifySealChain` | Verify document version chain | All links valid |
| `TestVerifyLineage` | Verify model→output relationship | Lineage confirmed |
| `TestBatchSeal` | Seal 100 items in one transaction | All seals created |
| `TestBatchTreeSeal` | Create Merkle tree over batch | Root seal + item seals |
| `TestExportSeal` | Export seal with Groth16 wrapper | Valid cross-chain proof |
| `TestOfflineVerify` | Verify seal without chain access | `valid = true` with proof |
| `TestSelectiveDisclose` | Re-encrypt hash for recipient | Recipient can decrypt |
| `TestProveProperty` | ZK proof of content property | Property verified |
| `TestProveEquality` | Prove two private seals match | Equality confirmed |
| `TestGasAccuracy` | Verify gas costs match schedule | Within 5% of spec |

### Integration Tests

| Test | Description |
|------|-------------|
| `TestSealToReceiptRegistry` | Verify seals appear in LP-0530 registry |
| `TestSealCrossChainExport` | Export seal, verify on mock external chain |
| `TestSealWithFheCRDT` | Seal fheCRDT document updates |
| `TestSealAIModelPipeline` | Full model→output provenance chain |
| `TestBatchScaling` | Seal 10,000 items, verify gas scaling |

### Performance Benchmarks (Target)

| Operation | Target Latency | Target Throughput |
|-----------|---------------|-------------------|
| `createSeal` | < 10ms | 10,000 seals/sec |
| `verifySeal` | < 1ms | 100,000 verifications/sec |
| `batchSeal(100)` | < 50ms | 200,000 items/sec (batched) |
| `exportSeal` | < 100ms | 1,000 exports/sec |

## Reference Implementation

Implementation location: `geth/precompile/contracts/dataseal/`

```
dataseal/
├── seal_registry.go          // Core seal creation and storage
├── seal_verify.go            // Verification logic
├── seal_batch.go             // Batch operations
├── seal_privacy.go           // FHE and ZK privacy operations
├── seal_export.go            // Cross-chain export with Groth16
├── seal_types.go             // Type definitions and constants
├── seal_registry_test.go     // Unit tests
├── seal_integration_test.go  // Integration tests
└── seal_bench_test.go        // Performance benchmarks
```

## Security Considerations

### Content Hash Collision Resistance

Poseidon2 provides 128-bit security against collision attacks. For applications requiring higher security, double-hashing (Poseidon2 + SHA-256) is supported via the metadata extensions field.

### Seal Immutability

Once a seal is created and its receipt is included in the Merkle tree, it cannot be modified or deleted. This is enforced by the LP-0530 Receipt Registry's append-only design.

### Privacy Seal Key Management

Private seals depend on FHE key management (LP-203, K-Chain). Key compromise would allow decryption of private seal content hashes. Mitigations:

1. Threshold FHE (LP-6474) distributes key custody
2. Key rotation creates new seals for ongoing data
3. Forward secrecy ensures past seals remain protected after rotation

### Denial of Service

Batch sealing could be used to spam the registry. Mitigations:

1. Gas costs scale linearly with batch size
2. Rate limiting at the RPC layer
3. Minimum stake requirement for high-volume sealers

### Cross-Chain Verification Trust

Exported seals are only as trustworthy as the Groth16 proof and the light client verification. Users should verify:

1. The Groth16 verification key matches the known Z-Chain circuit
2. The Merkle root is included in a finalized Z-Chain block
3. The light client proof is valid against the known validator set

### Quantum Resistance

All cryptographic operations in VDIS are post-quantum safe:

- Poseidon2: Algebraic hash, no discrete log dependency
- STARK proofs: Hash-based, quantum-resistant
- FHE: Lattice-based, quantum-resistant

Groth16 export proofs (pairing-based) are NOT post-quantum safe. A STARK-based export pathway is planned for LP-0510 v2.

## Economic Impact

### Fee Structure

Seal creation fees are set to be economically accessible while preventing spam:

- Single seal: ~$0.01 at typical gas prices
- Batch seal (100 items): ~$0.50 (5x amortization)
- Enterprise tiers possible via staking-based fee discounts

### Market Opportunity

The global data integrity verification market is projected at $8.4B by 2028. VDIS positions Lux Network as infrastructure for:

- AI governance and compliance
- Digital media authentication
- Enterprise document integrity
- Cyber insurance automation
- Supply chain verification

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
