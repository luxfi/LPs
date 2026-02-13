---
lp: 6411
title: LuxDA Bus Header Format
description: LuxDA Bus Header Format specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the wire format for message headers in LuxDA Bus v1. Headers are the ordered, canonical metadata that reference blob payloads and establish per-namespace sequencing.

## Motivation

A well-defined header format is critical for:

1. Interoperability between implementations
2. Efficient serialization and parsing
3. Compact representation for network transmission
4. Extensibility for future versions
5. Cryptographic binding to blob content

## Specification

### 1. Header Structure

#### 1.1 Logical Structure

```go
type MsgHeader struct {
    // Ordering
    NamespaceId    [20]byte  // Target namespace
    Seq            uint64    // Sequence number within namespace

    // Timing
    Timestamp      uint64    // Unix milliseconds

    // Blob Reference
    BlobCommitment [32]byte  // KZG or SHA3-256 commitment
    BlobLen        uint32    // Payload length in bytes

    // Policy Binding
    PolicyHash     [32]byte  // Hash of current namespace policy

    // Authentication
    SenderPubKey   []byte    // Sender's public key (var length)
    Signature      []byte    // Signature over header (var length)

    // Fee
    FeeProof       []byte    // Proof of fee payment (var length)

    // Optional: TFHE Sidecar Reference
    TFHESidecar    *TFHESidecarRef  // If policy.tfheOrch = true
}

type TFHESidecarRef struct {
    SidecarCommitment [32]byte
    Epoch             uint64
}
```

#### 1.2 Wire Format

```
MsgHeaderV1 := {
    version:          uint8     [1 byte]
    flags:            uint8     [1 byte]
    namespaceId:      bytes20   [20 bytes]
    seq:              uint64    [8 bytes, big-endian]
    timestamp:        uint64    [8 bytes, big-endian]
    blobCommitment:   bytes32   [32 bytes]
    blobLen:          uint32    [4 bytes, big-endian]
    policyHash:       bytes32   [32 bytes]
    senderPubKeyLen:  uint16    [2 bytes, big-endian]
    senderPubKey:     bytes     [senderPubKeyLen bytes]
    signatureLen:     uint16    [2 bytes, big-endian]
    signature:        bytes     [signatureLen bytes]
    feeProofLen:      uint16    [2 bytes, big-endian]
    feeProof:         bytes     [feeProofLen bytes]
    // If FLAG_TFHE_SIDECAR set:
    sidecarCommitment: bytes32  [32 bytes]
    sidecarEpoch:      uint64   [8 bytes, big-endian]
}
```

Total fixed size: 140 bytes (without variable fields and optional sidecar)

#### 1.3 Version Field

```
version = 0x01  // MsgHeaderV1
```

Future versions will increment this field.

#### 1.4 Flags Field

```
bit 0: FLAG_TFHE_SIDECAR     // TFHE sidecar reference present
bit 1: FLAG_KZG_COMMITMENT   // Blob uses KZG commitment (else SHA3)
bit 2: FLAG_PQ_SIGNATURE     // Signature includes PQ component
bit 3: FLAG_HYBRID_SIG       // Signature is hybrid (classical + PQ)
bit 4-7: reserved
```

### 2. Field Specifications

#### 2.1 Namespace ID

- 20 bytes derived per LP-6410
- Must reference an existing namespace
- Validators reject headers for unknown namespaces

#### 2.2 Sequence Number

- 64-bit unsigned integer, big-endian
- Starts at 1 for first message in namespace
- MUST be exactly `prev_seq + 1` for acceptance
- `seq = 0` is invalid (reserved)

#### 2.3 Timestamp

- 64-bit Unix milliseconds, big-endian
- MUST be >= previous header's timestamp in same namespace
- MUST be within ±30 seconds of validator median time
- Used for epoch derivation: `epoch = timestamp / epochDuration`

#### 2.4 Blob Commitment

##### SHA3-256 Mode (FLAG_KZG_COMMITMENT = 0)

```
blobCommitment = SHA3-256(blob)
```

##### KZG Mode (FLAG_KZG_COMMITMENT = 1)

```
blobCommitment = KZG_Commit(blob, trusted_setup)
```

KZG enables:
- Constant-size proofs of inclusion
- Data availability sampling
- Proof of equivalence

#### 2.5 Blob Length

- 32-bit unsigned integer
- Maximum: 2 MiB (2,097,152 bytes)
- May be 0 for header-only messages

#### 2.6 Policy Hash

```
policyHash = SHA3-256(CanonicalEncode(policy))
```

- Binds header to specific policy version
- Validators reject if policy hash doesn't match current namespace policy

#### 2.7 Sender Public Key

Variable-length public key based on signature scheme:

| Scheme | Key Length |
|--------|------------|
| Ed25519 | 32 bytes |
| secp256k1 | 33 bytes (compressed) |
| ML-DSA-65 | 1952 bytes |
| ML-DSA-87 | 2592 bytes |
| Hybrid (Ed25519 + ML-DSA-65) | 32 + 1952 = 1984 bytes |

Encoding:
```
senderPubKey = sigType (1 byte) || keyBytes
```

#### 2.8 Signature

Signature over header hash:

```
headerHash = SHA3-256(
    version || flags ||
    namespaceId || seq || timestamp ||
    blobCommitment || blobLen ||
    policyHash
)

signature = Sign(senderPrivKey, headerHash)
```

Signature format depends on `sigType`:

| Scheme | Signature Length |
|--------|-----------------|
| Ed25519 | 64 bytes |
| secp256k1 | 64 bytes (r, s) |
| ML-DSA-65 | 3309 bytes |
| ML-DSA-87 | 4627 bytes |
| Hybrid | 64 + 3309 = 3373 bytes |

#### 2.9 Fee Proof

Proof that sender has paid for this message:

```go
type FeeProof struct {
    ProofType uint8   // 0=None, 1=Prepaid, 2=OnChain, 3=StateChannel
    Data      []byte  // Proof-specific data
}
```

See LP-6481 for fee proof formats.

#### 2.10 TFHE Sidecar Reference (Optional)

When `FLAG_TFHE_SIDECAR` is set:

```
sidecarCommitment: SHA3-256(tfheSidecar)
sidecarEpoch:      epoch for TFHE keys
```

The sidecar blob contains encrypted data under threshold TFHE.

### 3. Validation Rules

#### 3.1 Structural Validation

```python
def validate_structure(header_bytes):
    if len(header_bytes) < MIN_HEADER_SIZE:
        return Error("header too short")

    version = header_bytes[0]
    if version != 0x01:
        return Error("unsupported version")

    flags = header_bytes[1]
    if flags & RESERVED_FLAGS:
        return Error("reserved flags set")

    # Parse variable length fields
    # Verify lengths don't exceed maximums
    # Verify total length matches

    return Ok()
```

#### 3.2 Semantic Validation

```python
def validate_semantics(header, state):
    ns = state.get_namespace(header.namespaceId)
    if ns is None:
        return Error("unknown namespace")

    if header.policyHash != ns.policy_hash:
        return Error("policy hash mismatch")

    expected_seq = ns.last_seq + 1
    if header.seq != expected_seq:
        return Error("sequence mismatch")

    if header.timestamp < ns.last_timestamp:
        return Error("timestamp regression")

    if not verify_signature(header):
        return Error("invalid signature")

    if not authorize_write(header, ns.policy):
        return Error("unauthorized writer")

    if not verify_fee_proof(header):
        return Error("invalid fee proof")

    return Ok()
```

### 4. Encoding Utilities

#### 4.1 Canonical Encoding

For hashing and commitment:

```go
func CanonicalEncode(header *MsgHeader) []byte {
    buf := new(bytes.Buffer)
    binary.Write(buf, binary.BigEndian, header.Version)
    binary.Write(buf, binary.BigEndian, header.Flags)
    buf.Write(header.NamespaceId[:])
    binary.Write(buf, binary.BigEndian, header.Seq)
    binary.Write(buf, binary.BigEndian, header.Timestamp)
    buf.Write(header.BlobCommitment[:])
    binary.Write(buf, binary.BigEndian, header.BlobLen)
    buf.Write(header.PolicyHash[:])
    // Variable fields NOT included in canonical form
    return buf.Bytes()
}
```

#### 4.2 JSON Encoding

For APIs and debugging:

```json
{
  "version": 1,
  "flags": 5,
  "namespaceId": "0x1234567890abcdef1234567890abcdef12345678",
  "seq": 42,
  "timestamp": 1704067200000,
  "blobCommitment": "0xabcd...",
  "blobLen": 1024,
  "policyHash": "0xef01...",
  "senderPubKey": "0x...",
  "signature": "0x...",
  "feeProof": "0x...",
  "tfheSidecar": {
    "commitment": "0x...",
    "epoch": 100
  }
}
```

### 5. Size Limits

| Field | Maximum |
|-------|---------|
| Total header | 8 KiB |
| Sender public key | 4 KiB |
| Signature | 8 KiB |
| Fee proof | 1 KiB |

These limits accommodate PQ signatures while remaining practical.

## Rationale

### Why Big-Endian?

- Network byte order (standard for protocols)
- Consistent with Ethereum conventions
- Enables lexicographic ordering of serialized data

### Why Variable-Length Keys/Signatures?

- PQ signatures are significantly larger than classical
- Hybrid mode doubles key/signature size
- Fixed fields would waste space for classical-only mode

### Why Separate Blob Commitment?

- Enables header validation without blob availability
- Supports both SHA3 and KZG commitments
- KZG commitment enables DAS (future LP-6433)

## Backwards Compatibility

This LP defines version 1 (`0x01`) of the LuxDA Bus message header. It is the foundational format and does not break any existing systems as the LuxDA Bus is a new component.

Future versions of the header format will use a different version number, and nodes will be expected to support multiple versions during upgrade periods to ensure a smooth transition.

## Security Considerations

### Malleability

Headers are non-malleable:
- All fields are covered by signature
- Canonical encoding is deterministic
- No optional fields that could be added/removed

### Replay Protection

- `namespaceId + seq` is unique
- Validators reject duplicate sequence numbers
- Timestamp must advance

### Signature Security

- Classical signatures remain secure today
- Hybrid mode protects against future quantum attacks
- PQ-only mode for maximum security

## Test Plan

### Encoding Tests

```json
{
  "encoding_vectors": [
    {
      "header": {
        "version": 1,
        "flags": 0,
        "namespaceId": "0x0000000000000000000000000000000000000001",
        "seq": 1,
        "timestamp": 1704067200000,
        "blobCommitment": "0x0000...0000",
        "blobLen": 0,
        "policyHash": "0xabcd...1234",
        "senderPubKey": "0x...",
        "signature": "0x...",
        "feeProof": "0x00"
      },
      "expectedBytes": "0x01000000....",
      "expectedHash": "0x...."
    }
  ]
}
```

### Validation Tests

1. **Valid Header**: All fields correct; should accept
2. **Wrong Version**: version=2; should reject
3. **Reserved Flags**: flag bit 7 set; should reject
4. **Sequence Gap**: seq jumps; should reject
5. **Timestamp Regression**: timestamp decreases; should reject
6. **Invalid Signature**: wrong key; should reject

## References

- [SSZ: Simple Serialize](https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md)
- [RLP: Recursive Length Prefix](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/)
- [CBOR: Concise Binary Object Representation](https://cbor.io/)

---

*LP-6411 v1.0.0 - 2026-01-02*
