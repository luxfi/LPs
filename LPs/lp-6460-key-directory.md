---
lp: 6460
title: LuxChat Key Directory
description: LuxChat Key Directory specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 2211]
tags: [luxda-bus, e2ee, chat, pqc]
---

## Abstract

This LP defines the key directory and identity binding system for LuxDA encrypted messaging. Users publish cryptographic key packages that enable others to initiate encrypted communication, with support for multiple devices and key rotation.

## Motivation

End-to-end encrypted messaging requires:

1. **Key Discovery**: Find recipient's encryption keys
2. **Identity Binding**: Link keys to verified identities
3. **Device Management**: Support multiple devices per user
4. **Key Rotation**: Update keys without breaking contacts
5. **Post-Quantum**: Future-proof key establishment

## Specification

### 1. Identity Model

#### 1.1 Identity Types

```go
type Identity struct {
    Type       IdentityType
    Identifier []byte
    Proof      []byte  // Proof of ownership
}

type IdentityType uint8
const (
    IdentityWallet  IdentityType = 1  // Ethereum-style address
    IdentityENS     IdentityType = 2  // ENS name
    IdentityDID     IdentityType = 3  // W3C DID
    IdentityEmail   IdentityType = 4  // Verified email
    IdentityPhone   IdentityType = 5  // Verified phone
)
```

#### 1.2 Wallet Identity

Primary identity type - derived from signature key:

```go
type WalletIdentity struct {
    Address   [20]byte  // Ethereum-style address
    ChainID   uint64    // Optional chain binding
}

func DeriveWalletIdentity(pubKey []byte) *WalletIdentity {
    hash := keccak256(pubKey)
    var addr [20]byte
    copy(addr[:], hash[12:])
    return &WalletIdentity{Address: addr}
}
```

#### 1.3 Identity Verification

```go
type IdentityProof struct {
    Identity   Identity
    Timestamp  uint64
    Signature  []byte  // Sign(identity || timestamp)
}

func VerifyIdentityProof(proof *IdentityProof, pubKey []byte) bool {
    message := append(proof.Identity.Identifier, uint64ToBytes(proof.Timestamp)...)
    return Verify(pubKey, message, proof.Signature)
}
```

### 2. Key Packages

#### 2.1 Key Package Structure

Based on MLS KeyPackage (RFC 9420):

```go
type KeyPackage struct {
    Version         uint16
    CipherSuite     CipherSuite
    InitKey         []byte          // HPKE public key for initial contact
    Credential      Credential      // Identity credential
    Extensions      []Extension
    Signature       []byte          // Self-signature
}

type Credential struct {
    CredentialType  CredentialType
    Identity        Identity
    SignatureKey    []byte          // Signing public key
}

type CipherSuite uint16
const (
    // Classical suites
    SuiteX25519_AES128GCM_SHA256 CipherSuite = 0x0001
    SuiteP256_AES128GCM_SHA256   CipherSuite = 0x0002

    // PQ/Hybrid suites
    SuiteXWing_AES256GCM_SHA384  CipherSuite = 0x0101
    SuiteMLKEM768_AES256GCM_SHA384 CipherSuite = 0x0102
)
```

#### 2.2 Key Package Extensions

```go
type Extension struct {
    Type ExtensionType
    Data []byte
}

type ExtensionType uint16
const (
    ExtCapabilities   ExtensionType = 1
    ExtLifetime       ExtensionType = 2
    ExtPreferredDM    ExtensionType = 3  // Preferred DM namespace
    ExtDeviceInfo     ExtensionType = 4
    ExtPQSupport      ExtensionType = 5  // PQ capabilities
)

type LifetimeExtension struct {
    NotBefore uint64
    NotAfter  uint64
}

type PQSupportExtension struct {
    SupportedKEMs       []uint16
    SupportedSignatures []uint16
    PreferHybrid        bool
}
```

#### 2.3 Device Key Packages

Users have multiple devices, each with own keys:

```go
type DeviceKeyPackage struct {
    KeyPackage   KeyPackage
    DeviceID     [16]byte
    DeviceName   string
    DeviceType   DeviceType
    Priority     uint8  // For notification routing
}

type DeviceType uint8
const (
    DeviceMobile  DeviceType = 1
    DeviceDesktop DeviceType = 2
    DeviceWeb     DeviceType = 3
    DeviceServer  DeviceType = 4  // Bot/service
)
```

### 3. Key Directory

#### 3.1 Directory Namespace

Reserved namespace for key publication:

```go
var KeyDirectoryNamespace = DeriveNamespace("lux.keydir.v1")

// Key package location
func KeyPackageNamespace(identity *Identity) [20]byte {
    return DeriveNamespace(
        "lux.keydir.v1",
        identity.Type,
        identity.Identifier,
    )
}
```

#### 3.2 Directory Operations

```go
type KeyDirectory interface {
    // Publish or update key packages
    PublishKeyPackage(pkg *KeyPackage) error

    // Fetch key packages for identity
    GetKeyPackages(identity *Identity) ([]*KeyPackage, error)

    // Watch for key updates
    WatchKeyPackages(identity *Identity) (<-chan *KeyPackage, error)

    // Revoke key package
    RevokeKeyPackage(keyPackageRef [32]byte, signature []byte) error
}
```

#### 3.3 Directory Message Format

```go
type KeyDirectoryMessage struct {
    Type      KeyDirMessageType
    Timestamp uint64
    Payload   []byte
    Signature []byte
}

type KeyDirMessageType uint8
const (
    KeyDirPublish  KeyDirMessageType = 1
    KeyDirRevoke   KeyDirMessageType = 2
    KeyDirRotate   KeyDirMessageType = 3
)
```

### 4. Key Rotation

#### 4.1 Rotation Protocol

```go
type KeyRotation struct {
    OldKeyRef   [32]byte    // Reference to old key package
    NewPackage  *KeyPackage // New key package
    Signature   []byte      // Signed by old key
    Timestamp   uint64
}

func RotateKey(old *KeyPackage, newPkg *KeyPackage, privKey []byte) (*KeyRotation, error) {
    rotation := &KeyRotation{
        OldKeyRef:  KeyPackageRef(old),
        NewPackage: newPkg,
        Timestamp:  uint64(time.Now().Unix()),
    }

    // Sign with old key to prove ownership
    msg := append(rotation.OldKeyRef[:], newPkg.Encode()...)
    rotation.Signature = Sign(privKey, msg)

    return rotation, nil
}
```

#### 4.2 Rotation Verification

```go
func VerifyRotation(rotation *KeyRotation, oldPkg *KeyPackage) bool {
    // Verify signature is from old key
    msg := append(rotation.OldKeyRef[:], rotation.NewPackage.Encode()...)
    if !Verify(oldPkg.Credential.SignatureKey, msg, rotation.Signature) {
        return false
    }

    // Verify identity matches
    if !oldPkg.Credential.Identity.Equal(rotation.NewPackage.Credential.Identity) {
        return false
    }

    return true
}
```

### 5. Revocation

#### 5.1 Revocation Message

```go
type KeyRevocation struct {
    KeyPackageRef [32]byte
    Reason        RevocationReason
    Timestamp     uint64
    Signature     []byte  // Signed by key being revoked
}

type RevocationReason uint8
const (
    ReasonUnspecified    RevocationReason = 0
    ReasonKeyCompromised RevocationReason = 1
    ReasonKeyRetired     RevocationReason = 2
    ReasonDeviceLost     RevocationReason = 3
)
```

#### 5.2 Revocation List

```go
type RevocationList struct {
    Identity     Identity
    RevokedKeys  []KeyRevocation
    LastUpdated  uint64
}

func (kd *KeyDirectory) IsRevoked(keyRef [32]byte) bool {
    // Check revocation list
    return kd.revocationIndex.Has(keyRef)
}
```

### 6. PQ Key Packages

#### 6.1 Hybrid Key Package

```go
type HybridKeyPackage struct {
    // Classical component
    ClassicalInitKey []byte  // X25519

    // PQ component
    PQInitKey []byte  // ML-KEM-768

    // Combined suite
    CipherSuite CipherSuite  // SuiteXWing_AES256GCM_SHA384
}

func GenerateHybridKeyPackage(identity Identity) (*KeyPackage, error) {
    // Generate X25519 key
    classicalPriv, classicalPub := GenerateX25519()

    // Generate ML-KEM-768 key
    pqPriv, pqPub := GenerateMLKEM768()

    // Combine into X-Wing style hybrid
    initKey := encodeHybridKey(classicalPub, pqPub)

    return &KeyPackage{
        Version:     1,
        CipherSuite: SuiteXWing_AES256GCM_SHA384,
        InitKey:     initKey,
        Credential:  makeCredential(identity),
    }, nil
}
```

### 7. Wire Formats

#### 7.1 Key Package Encoding

```
KeyPackageV1 := {
    version:         uint16   [2 bytes]
    cipherSuite:     uint16   [2 bytes]
    initKeyLen:      uint16   [2 bytes]
    initKey:         bytes    [initKeyLen bytes]
    credential:      Credential [variable]
    extensionsLen:   uint16   [2 bytes]
    extensions:      bytes    [extensionsLen bytes]
    signatureLen:    uint16   [2 bytes]
    signature:       bytes    [signatureLen bytes]
}

Credential := {
    credType:        uint8    [1 byte]
    identityType:    uint8    [1 byte]
    identityLen:     uint16   [2 bytes]
    identity:        bytes    [identityLen bytes]
    sigKeyLen:       uint16   [2 bytes]
    signatureKey:    bytes    [sigKeyLen bytes]
}
```

#### 7.2 Directory Query API

```protobuf
service KeyDirectoryService {
    rpc GetKeyPackages(GetKeyPackagesRequest) returns (GetKeyPackagesResponse);
    rpc PublishKeyPackage(PublishRequest) returns (PublishResponse);
    rpc RevokeKeyPackage(RevokeRequest) returns (RevokeResponse);
    rpc WatchKeyPackages(WatchRequest) returns (stream KeyPackageUpdate);
}

message GetKeyPackagesRequest {
    bytes identity_type = 1;
    bytes identity_value = 2;
    bool include_revoked = 3;
}

message GetKeyPackagesResponse {
    repeated KeyPackageEntry packages = 1;
}

message KeyPackageEntry {
    bytes key_package = 1;
    uint64 published_at = 2;
    bool revoked = 3;
}
```

### 8. Caching and Freshness

#### 8.1 Cache Policy

```go
type KeyCachePolicy struct {
    // Maximum age before refresh
    MaxAge time.Duration

    // Refresh on use
    RefreshOnUse bool

    // Background refresh interval
    BackgroundRefresh time.Duration
}

var DefaultCachePolicy = KeyCachePolicy{
    MaxAge:            24 * time.Hour,
    RefreshOnUse:      true,
    BackgroundRefresh: 1 * time.Hour,
}
```

#### 8.2 Freshness Verification

```go
func (kd *KeyDirectory) GetFreshKeyPackages(identity *Identity) ([]*KeyPackage, error) {
    // Check cache
    cached := kd.cache.Get(identity)
    if cached != nil && time.Since(cached.FetchedAt) < kd.policy.MaxAge {
        // Optionally verify not revoked
        if !kd.IsRevoked(KeyPackageRef(cached.Package)) {
            return cached.Packages, nil
        }
    }

    // Fetch fresh
    return kd.fetchAndCache(identity)
}
```

## Rationale

### Why MLS-Based Key Packages?

- Standard format (RFC 9420)
- Designed for messaging
- Supports PQ extension
- Interoperable

### Why Multiple Devices?

- Users have phone + desktop + web
- Each device needs own keys
- Unified identity across devices

### Why On-Chain Key Directory?

- Decentralized, censorship-resistant
- Verifiable history
- No central point of failure

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

### Key Compromise

- Rotation allows recovery
- Revocation prevents use of old keys
- Multiple devices means partial compromise

### Identity Spoofing

- Cryptographic binding to wallet
- Signature verification on all packages
- Chain of trust from identity proof

### Key Directory Spam

- Rate limiting on publications
- Stake requirement for publishing
- Namespace policy controls

## Test Plan

### Unit Tests

1. **Key Package**: Generate, encode, decode, verify
2. **Rotation**: Valid rotation, invalid rotation
3. **Revocation**: Revoke, check revocation

### Integration Tests

1. **Publish/Fetch**: Full directory flow
2. **Multi-Device**: Multiple packages per identity
3. **Cache Behavior**: Freshness and invalidation

### Security Tests

1. **Signature Verification**: Reject invalid signatures
2. **Identity Binding**: Cannot use others' identities
3. **Revocation Enforcement**: Revoked keys not usable

## References

- [MLS RFC 9420](https://www.rfc-editor.org/rfc/rfc9420)
- [XMTP Key Bundles](https://xmtp.org/docs/concepts/key-bundles)
- [Signal Key Management](https://signal.org/docs/specifications/x3dh/)

---

*LP-6460 v1.0.0 - 2026-01-02*
