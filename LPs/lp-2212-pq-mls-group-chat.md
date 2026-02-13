---
lp: 2212
title: PQ MLS Group Chat Profile
description: PQ MLS Group Chat Profile for LuxDA Bus and Lux Network
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 6462]
tags: [pqc, luxda-bus, q-chain]
---

## Abstract

This LP defines the post-quantum MLS (Messaging Layer Security) profile for LuxDA Bus group chat, specifying algorithm selection and extensions for PQ security.

## Motivation

MLS (RFC 9420) provides scalable group encryption but its default cipher suites use classical cryptography. This LP:
1. Defines PQ-safe cipher suites for MLS
2. Specifies hybrid KEM construction for TreeKEM
3. Ensures backward compatibility during migration

## Specification

### 1. PQ Cipher Suites

```go
type MLSCipherSuite uint16

const (
    // Classical (for compatibility)
    MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519        MLSCipherSuite = 0x0001
    MLS_128_DHKEMP256_AES128GCM_SHA256_P256             MLSCipherSuite = 0x0002

    // Hybrid PQ (recommended)
    MLS_128_XWING_AES128GCM_SHA256_MLDSA65              MLSCipherSuite = 0x0100
    MLS_256_XWING_AES256GCM_SHA512_MLDSA87              MLSCipherSuite = 0x0101

    // Pure PQ (future)
    MLS_128_MLKEM768_AES128GCM_SHA256_MLDSA65           MLSCipherSuite = 0x0200
    MLS_256_MLKEM1024_AES256GCM_SHA512_MLDSA87          MLSCipherSuite = 0x0201
)
```

### 2. Default Suite

```go
// LuxDA Bus default cipher suite
var DefaultMLSCipherSuite = MLS_128_XWING_AES128GCM_SHA256_MLDSA65
```

### 3. Hybrid HPKE Construction

MLS uses HPKE for encryption. We define hybrid HPKE:

```go
type HybridHPKE struct {
    ClassicalKEM  *X25519KEM
    PQKEM         *MLKEM768
}

// Encapsulate produces hybrid ciphertext
func (h *HybridHPKE) Encapsulate(pk *HybridPublicKey) (
    ct []byte,      // X25519 ct || ML-KEM ct
    ss []byte,      // Combined shared secret
    err error,
) {
    // X25519 encapsulation
    ctClassical, ssClassical, _ := h.ClassicalKEM.Encapsulate(pk.Classical)

    // ML-KEM encapsulation
    ctPQ, ssPQ, _ := h.PQKEM.Encapsulate(pk.PQ)

    // Combine ciphertexts
    ct = append(ctClassical, ctPQ...)

    // Combine secrets with domain separation
    ss = hkdf.Extract(sha256.New,
        append(ssClassical, ssPQ...),
        []byte("HybridHPKE"))

    return ct, ss, nil
}
```

### 4. TreeKEM with Hybrid Keys

```go
type TreeKEMNode struct {
    PublicKey    *HybridPublicKey
    PrivateKey   *HybridPrivateKey  // Only for path nodes
    ParentHash   [32]byte
    UnmergedLeaves []LeafIndex
}

type HybridPublicKey struct {
    Classical  *X25519PublicKey
    PQ         *MLKEMPublicKey
}

type HybridPrivateKey struct {
    Classical  *X25519PrivateKey
    PQ         *MLKEMPrivateKey
}
```

### 5. Key Package Extension

```go
type PQKeyPackage struct {
    // Standard MLS fields
    ProtocolVersion  ProtocolVersion
    CipherSuite      MLSCipherSuite
    InitKey          *HybridPublicKey
    LeafNode         LeafNode

    // PQ extensions
    Extensions       []Extension
    Signature        []byte  // ML-DSA signature
}

// PQ Extension types
const (
    ExtPQCapabilities  ExtensionType = 0xFF01
    ExtPQPreferences   ExtensionType = 0xFF02
)

type PQCapabilities struct {
    SupportedSuites    []MLSCipherSuite
    PreferredSuite     MLSCipherSuite
    ClassicalFallback  bool
}
```

### 6. Commit Message Signing

```go
type MLSCommit struct {
    Proposals      []ProposalRef
    Path           *UpdatePath

    // Signed with ML-DSA
    Signature      []byte
}

func SignCommit(commit *MLSCommit, sigKey *MLDSAPrivateKey) error {
    // Compute commit content
    content := commit.Serialize()

    // Sign with ML-DSA-65
    sig, err := mldsa.Sign(sigKey, content)
    if err != nil {
        return err
    }

    commit.Signature = sig
    return nil
}
```

### 7. Welcome Message Encryption

```go
type PQWelcome struct {
    CipherSuite    MLSCipherSuite
    Secrets        []EncryptedGroupSecrets

    // Each secret encrypted with hybrid HPKE
    // to the recipient's KeyPackage init key
}

type EncryptedGroupSecrets struct {
    NewMember      KeyPackageRef
    EncryptedData  []byte  // Hybrid HPKE ciphertext
}
```

### 8. Group State

```go
type PQGroupState struct {
    GroupID        GroupID
    Epoch          uint64
    CipherSuite    MLSCipherSuite
    Tree           *TreeKEMTree

    // Derived secrets
    EpochSecret    [32]byte
    SenderDataSecret [32]byte
    EncryptionSecret [32]byte

    // Authentication keys
    ConfirmationKey [32]byte
    MembershipKey   [32]byte
}
```

### 9. Migration Support

```go
type MigrationProposal struct {
    Type           ProposalType  // ReInit
    GroupID        GroupID
    ProtocolVersion ProtocolVersion
    CipherSuite    MLSCipherSuite  // New PQ suite
    Extensions     []Extension
}

// Migrate group from classical to PQ suite
func ProposeMLSMigration(
    group *MLSGroup,
    targetSuite MLSCipherSuite,
) (*MigrationProposal, error)
```

### 10. Performance Considerations

| Operation | Classical | Hybrid PQ | Overhead |
|-----------|-----------|-----------|----------|
| KeyPackage size | 200 B | 2.5 KB | 12.5x |
| Welcome size | 500 B | 3 KB | 6x |
| Commit size | 1 KB | 4 KB | 4x |
| TreeKEM update | 2 ms | 15 ms | 7.5x |

## Rationale

Group communication is a fundamental part of the LuxDA Bus, and its security is paramount. The IETF's Messaging Layer Security (MLS) protocol provides a strong foundation for scalable, end-to-end encrypted group messaging. However, the standard MLS cipher suites rely on classical cryptography (elliptic curves), which will be vulnerable to attacks from future quantum computers.

To address this long-term threat and protect against "harvest now, decrypt later" attacks, this LP defines a post-quantum profile for MLS. By specifying hybrid cipher suites that combine classical and post-quantum algorithms, we ensure that group communications remain secure even if one of the cryptographic primitives is broken. This provides a robust and future-proof security model for group chats on the Lux network.

## Backwards Compatibility

This LP is designed to be backwards compatible with the existing MLS protocol and allows for a smooth migration from classical to post-quantum secure groups.

-   **Cipher Suite Negotiation**: New groups can be created with the post-quantum cipher suites from the outset.
-   **Migration of Existing Groups**: Existing groups using classical cipher suites can be upgraded to a post-quantum suite via a `ReInit` proposal. This allows all group members to agree on the new cryptographic parameters and re-establish a secure session without recreating the group.
-   **Interoperability**: The PQ capabilities extension allows clients to signal their support for post-quantum suites, ensuring that clients with different capabilities can still participate in groups, albeit with the security level of the least capable client.

This approach ensures a non-disruptive upgrade path for the entire network.
## Security Considerations


1. **Hybrid approach**: Both classical and PQ must be broken
2. **Forward secrecy**: TreeKEM ratcheting provides FS per epoch
3. **Post-compromise security**: Adding/removing members heals tree
4. **Signature security**: ML-DSA provides PQ authentication
5. **Large key sizes**: May impact mobile bandwidth; consider compression

## Test Plan

1. Interoperability with reference MLS implementations
2. Group operations (add, remove, update) with PQ suite
3. Migration from classical to PQ suite
4. Performance benchmarks on various group sizes
5. Memory usage profiling

## References

- RFC 9420: Messaging Layer Security (MLS)
- LP-6462: Group Chat
- LP-2200: PQ Crypto SDK

---

*LP-2212 v1.0.0 - 2026-01-02*
