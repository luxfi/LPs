---
lp: 6400
title: LuxDA Bus Glossary & Semantics
description: LuxDA Bus Glossary & Semantics specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the normative terminology, invariants, and semantic guarantees for the LuxDA Bus. All other LuxDA Bus LPs MUST use definitions from this document. No implementation details are specified here - only the properties that implementations MUST satisfy.

## Motivation

A unified data availability, messaging, and coordination layer requires precise semantic definitions. Without clear invariants, implementations may diverge in subtle ways that break interoperability. This LP serves as the authoritative reference for:

1. Terminology used across all LuxDA Bus LPs
2. Invariants that all implementations MUST maintain
3. Delivery semantics and guarantees
4. Retention classes and SLAs

## Specification

### 1. Core Entities

#### 1.1 Namespace

A **Namespace** is a logical channel for ordered message delivery.

```
NamespaceId := H(owner || salt || version)
```

Properties:
- Globally unique identifier derived from owner credentials
- Defines its own ordering domain (no cross-namespace ordering)
- Has an associated `NamespacePolicy` governing access and behavior
- Immutable once created (version bumps create new namespace)

#### 1.2 Message

A **Message** is the atomic unit of data in LuxDA Bus.

```
Message := (Header, Payload)
```

Where:
- `Header` is always ordered and persisted
- `Payload` may be stored separately (see Blob)

#### 1.3 Header

A **Header** is the ordered, canonical metadata for a message.

```
Header := {
    namespaceId:    NamespaceId,
    seq:            uint64,
    timestamp:      uint64,
    blobCommitment: bytes32,  // commitment to payload
    blobLen:        uint32,
    policyHash:     bytes32,
    senderSig:      Signature,
    feeProof:       FeeProof,
}
```

Invariants:
- `(namespaceId, seq)` is globally unique
- `seq` is monotonically increasing per namespace (no gaps in finalized state)
- `timestamp` is monotonically non-decreasing per namespace

#### 1.4 Blob

A **Blob** is the payload data referenced by a header.

```
Blob := bytes
BlobCommitment := H(Blob)  // or polynomial commitment
```

Properties:
- Content-addressed by `blobCommitment`
- May be empty (`blobLen = 0`)
- Stored separately from headers (DA layer)
- Retrievable given `blobCommitment`

#### 1.5 Namespace Policy

A **NamespacePolicy** defines access control and behavior for a namespace.

```
NamespacePolicy := {
    version:        uint16,
    owner:          Identity,
    writers:        WriterSet,
    rateLimit:      RateLimit,
    encryptionMode: EncryptionMode,
    tfheOrch:       bool,
    retentionClass: RetentionClass,
    pqMode:         PQMode,
}
```

### 2. Ordering Semantics

#### 2.1 Per-Namespace Total Order

**Invariant**: Within a namespace, headers form a total order defined by `seq`.

```
∀ h1, h2 ∈ Namespace(ns):
    h1.seq < h2.seq ⟹ h1 precedes h2
```

**Invariant**: No global ordering exists across namespaces.

```
∀ ns1 ≠ ns2, h1 ∈ ns1, h2 ∈ ns2:
    h1 and h2 are concurrent (no ordering relation)
```

#### 2.2 Sequence Number Properties

- `seq` starts at 1 for each namespace
- `seq` increments by exactly 1 for each accepted header
- Gaps in `seq` indicate reorgs (see LP-6413)
- `seq = 0` is reserved (never valid)

### 3. Delivery Semantics

#### 3.1 Relay Delivery

**Semantics**: Best-effort, low-latency propagation.

Guarantees:
- Messages propagate to connected peers within network latency bounds
- No ordering guarantees during relay
- No persistence guarantees
- May receive duplicates
- May receive messages out of order

Non-guarantees:
- Delivery to offline nodes
- Ordering relative to canonical chain
- Persistence beyond relay window

#### 3.2 Header Chain Delivery

**Semantics**: Canonical order with finality.

Guarantees:
- Headers are ordered by `(namespaceId, seq)`
- Finalized headers are immutable
- Preconfirmed headers may reorg (see LP-6413)
- All validators agree on finalized state

States:
```
Pending    → Preconfirmed → Finalized
   │              │
   └──────────────┴──────→ Rejected
```

#### 3.3 DA Delivery

**Semantics**: Retrievable blob guarantee.

Guarantees:
- Blobs referenced by finalized headers are retrievable
- Retrieval succeeds within `daTimeout` from finalization
- Erasure coding enables reconstruction from partial data

Modes:
- **Certificate Mode (v1)**: Committee attests to availability
- **DAS Mode (v2)**: Light clients sample for verification

### 4. Retention Classes

#### 4.1 Class Definitions

| Class | Headers | Blobs | Minimum Duration |
|-------|---------|-------|------------------|
| `Ephemeral` | Relay only | Relay only | Minutes |
| `Standard` | Finalized | DA guaranteed | 30 days |
| `Archive` | Finalized | Store guaranteed | 1 year |
| `Permanent` | Finalized | Store guaranteed | Indefinite |

#### 4.2 Retention Guarantees

**Guaranteed** (protocol-enforced):
- `Standard`: Validators store and serve
- Slashing for availability failures

**Market-provided** (incentive-based):
- `Archive`, `Permanent`: Store providers serve
- Payment required beyond guaranteed period

### 5. Separation of Concerns

#### 5.1 Header vs Blob Separation

```
┌─────────────────────────────────────────────────────┐
│                    Header Chain                      │
│  - Ordered                                          │
│  - Small (< 1KB per header)                         │
│  - All validators store                             │
│  - Defines canonical state                          │
└─────────────────────────────────────────────────────┘
                         │
                         │ blobCommitment
                         ▼
┌─────────────────────────────────────────────────────┐
│                     DA Layer                         │
│  - Content-addressed                                │
│  - Large (up to MaxBlobSize)                        │
│  - Erasure-coded                                    │
│  - Subset of operators store                        │
└─────────────────────────────────────────────────────┘
```

#### 5.2 Ordering vs Availability

- **Ordering**: Header chain provides sequence numbers
- **Availability**: DA layer provides blob retrieval
- These are orthogonal: ordered header may reference unavailable blob (failure case)

### 6. Cryptographic Commitments

#### 6.1 Blob Commitment

```
BlobCommitment := KZG(Blob) | SHA3-256(Blob)
```

Properties:
- Binding: Cannot find two blobs with same commitment
- Hiding: Commitment reveals nothing about blob content (for KZG)

#### 6.2 Policy Commitment

```
PolicyHash := SHA3-256(CanonicalEncode(NamespacePolicy))
```

Used to bind headers to specific policy version.

### 7. Time Model

#### 7.1 Timestamps

- Unix milliseconds (uint64)
- Monotonically non-decreasing per namespace
- Clock skew tolerance: ±30 seconds from validator median
- Future timestamps rejected

#### 7.2 Epochs

```
Epoch := floor(timestamp / epochDuration)
```

Used for:
- TFHE key rotation
- Fee market periods
- Validator set changes

### 8. Identity Model

#### 8.1 Identity Types

```
Identity := WalletAddress | DID | X.509
```

Binding:
- `WalletAddress`: Ethereum-style address from public key
- `DID`: Decentralized identifier with proof
- `X.509`: Certificate chain to trusted root

#### 8.2 Authentication

All protocol messages MUST be signed by a recognized identity.

```
Signature := {
    sigType:    SigType,       // ed25519 | mldsa | hybrid
    publicKey:  bytes,
    signature:  bytes,
}
```

### 9. Error Conditions

#### 9.1 Defined Errors

| Error | Code | Description |
|-------|------|-------------|
| `InvalidNamespace` | 1001 | Namespace does not exist |
| `SequenceGap` | 1002 | Sequence number not contiguous |
| `PolicyViolation` | 1003 | Message violates namespace policy |
| `BlobUnavailable` | 1004 | Blob cannot be retrieved |
| `InvalidSignature` | 1005 | Signature verification failed |
| `RateLimited` | 1006 | Rate limit exceeded |
| `FeeTooLow` | 1007 | Fee proof insufficient |
| `TimestampInvalid` | 1008 | Timestamp out of bounds |

### 10. Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MaxBlobSize` | 2 MiB | Maximum blob size |
| `MaxHeaderSize` | 1 KiB | Maximum header size |
| `EpochDuration` | 1 hour | Epoch length |
| `RelayWindow` | 10 min | Relay persistence minimum |
| `DATimeout` | 5 min | DA retrieval timeout |
| `MaxNamespaceRate` | 100 msg/s | Default rate limit |

## Rationale

### Why Per-Namespace Ordering Only?

Global ordering across namespaces would:
1. Create head-of-line blocking between unrelated applications
2. Reduce throughput as all messages compete for single sequence
3. Require global consensus per message

Per-namespace ordering enables:
1. Parallel processing of independent namespaces
2. Application-specific ordering semantics
3. Horizontal scaling

### Why Separate Headers from Blobs?

1. **Efficiency**: Small headers are cheap to replicate and order
2. **Flexibility**: Blobs can use different storage strategies
3. **Light Clients**: Can verify ordering without downloading blobs
4. **Composability**: Different DA backends can be swapped

### Why Certificate-First DA?

Certificate mode (committee attestation) enables:
1. Faster time-to-availability (single round)
2. Simpler implementation (no sampling protocol)
3. Clear upgrade path to DAS (API unchanged)

DAS (sampling) provides:
1. Stronger security (cryptoeconomic, not trust)
2. Better scaling (sublinear verification)
3. Light client verification

## Security Considerations

### Ordering Attacks

**Attack**: Malicious validator reorders messages within namespace
**Mitigation**: Sequence numbers are deterministic; reordering detectable

**Attack**: Validator censors specific namespace
**Mitigation**: Multiple validators; censorship is attributable

### Availability Attacks

**Attack**: Attacker claims availability but withholds blob
**Mitigation**: Slashing in certificate mode; sampling in DAS mode

**Attack**: Eclipse attack on retrieval
**Mitigation**: Erasure coding; multiple retrieval paths

### Timing Attacks

**Attack**: Manipulate timestamps for ordering advantage
**Mitigation**: Clock skew bounds; validator median timestamp

## Test Plan

### Invariant Tests

1. **Sequence Uniqueness**: Generate 10^6 headers; verify no duplicate `(ns, seq)`
2. **Sequence Monotonicity**: Finalize headers out of order; verify rejection
3. **Commitment Binding**: Attempt to submit two blobs with same commitment; verify failure

### Semantic Tests

1. **Relay Delivery**: Send message; verify propagation to 90% of peers within 500ms
2. **Header Chain Delivery**: Submit header; verify finalization within expected slot
3. **DA Delivery**: Store blob; verify retrieval success rate > 99.9%

### Conformance Fixtures

See LP-6499 for wire-format test vectors.

## References

- [Celestia Data Availability Spec](https://celestia.org/glossary/data-availability/)
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [XMTP Protocol Spec](https://xmtp.org/docs/concepts/architectural-overview)
- [Danksharding Proposal](https://notes.ethereum.org/@dankrad/new_sharding)

---

*LP-6400 v1.0.0 - 2026-01-02*
