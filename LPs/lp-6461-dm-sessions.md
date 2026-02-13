---
lp: 6461
title: LuxChat DM Sessions (PQXDH)
description: LuxChat DM Sessions (PQXDH) specification for LuxDA Bus
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

This LP defines the direct message (DM) encryption protocol for LuxDA, providing end-to-end encrypted conversations between two parties with forward secrecy and post-compromise security through key ratcheting.

## Motivation

Private 1:1 messaging requires:

1. **Confidentiality**: Only participants can read messages
2. **Forward Secrecy**: Past messages safe if keys compromised
3. **Post-Compromise Security**: Recovery after compromise
4. **Offline Delivery**: Send to offline recipients
5. **Post-Quantum Safety**: Resist future quantum attacks

## Specification

### 1. DM Namespace Derivation

#### 1.1 Deterministic Namespace

DM conversations use a deterministic namespace:

```go
func DMNamespace(identity1, identity2 *Identity) [20]byte {
    // Sort identities for determinism
    if bytes.Compare(identity1.Identifier, identity2.Identifier) > 0 {
        identity1, identity2 = identity2, identity1
    }

    // Derive namespace
    return DeriveNamespace(
        "lux.dm.v1",
        identity1.Identifier,
        identity2.Identifier,
    )
}
```

#### 1.2 Namespace Policy

DM namespaces have implicit policy:

```go
var DMNamespacePolicy = NamespacePolicy{
    WriterMode:     WriterModeAllowlist,
    Writers:        []Identity{identity1, identity2},
    EncryptionMode: EncryptionE2EE_DM,
    PQMode:         PQModeHybrid,
    // Other fields derived from participants
}
```

### 2. Session Establishment (PQXDH)

#### 2.1 PQXDH Protocol

Post-Quantum Extended Diffie-Hellman:

```go
type PQXDHKeys struct {
    // Classical X25519
    IdentityKey     *X25519KeyPair
    SignedPreKey    *X25519KeyPair
    OneTimePreKey   *X25519KeyPair  // Optional

    // PQ ML-KEM
    PQPreKey        *MLKEMKeyPair
}

type PQXDHMessage struct {
    // Sender identity
    SenderIdentityKey  []byte

    // Ephemeral keys
    EphemeralKey       []byte   // X25519 ephemeral
    PQCiphertext       []byte   // ML-KEM ciphertext

    // Pre-key identifiers
    SignedPreKeyID     uint32
    OneTimePreKeyID    uint32   // 0 if not used

    // Encrypted initial message
    Ciphertext         []byte
}
```

#### 2.2 Session Initiation (Alice → Bob)

```go
func InitiateSession(alice *PQXDHKeys, bobKeyPackage *KeyPackage) (*Session, *PQXDHMessage, error) {
    // Generate ephemeral X25519
    ephPriv, ephPub := GenerateX25519()

    // Encapsulate to Bob's PQ key
    pqCiphertext, pqSharedSecret := MLKEMEncapsulate(bobKeyPackage.PQPreKey)

    // X25519 DH computations
    dh1 := X25519(alice.IdentityKey.Private, bobKeyPackage.SignedPreKey)
    dh2 := X25519(ephPriv, bobKeyPackage.IdentityKey)
    dh3 := X25519(ephPriv, bobKeyPackage.SignedPreKey)

    // Optional one-time pre-key
    var dh4 []byte
    if bobKeyPackage.OneTimePreKey != nil {
        dh4 = X25519(ephPriv, bobKeyPackage.OneTimePreKey)
    }

    // Combine secrets (hybrid: classical + PQ)
    ikm := concat(dh1, dh2, dh3, dh4, pqSharedSecret)
    masterSecret := HKDF(ikm, "PQXDH")

    // Derive root key and chain keys
    rootKey, sendChainKey := DeriveChainKeys(masterSecret)

    session := &Session{
        RemoteIdentity: bobKeyPackage.Credential.Identity,
        RootKey:        rootKey,
        SendChainKey:   sendChainKey,
        SendCounter:    0,
    }

    return session, &PQXDHMessage{
        SenderIdentityKey: alice.IdentityKey.Public,
        EphemeralKey:      ephPub,
        PQCiphertext:      pqCiphertext,
        SignedPreKeyID:    bobKeyPackage.SignedPreKeyID,
    }, nil
}
```

#### 2.3 Session Reception (Bob)

```go
func ReceiveSession(bob *PQXDHKeys, msg *PQXDHMessage) (*Session, error) {
    // Decapsulate PQ ciphertext
    pqSharedSecret := MLKEMDecapsulate(bob.PQPreKey.Private, msg.PQCiphertext)

    // X25519 DH computations
    dh1 := X25519(bob.SignedPreKey.Private, msg.SenderIdentityKey)
    dh2 := X25519(bob.IdentityKey.Private, msg.EphemeralKey)
    dh3 := X25519(bob.SignedPreKey.Private, msg.EphemeralKey)

    // One-time pre-key
    var dh4 []byte
    if msg.OneTimePreKeyID != 0 {
        otpk := bob.GetOneTimePreKey(msg.OneTimePreKeyID)
        dh4 = X25519(otpk.Private, msg.EphemeralKey)
        bob.DeleteOneTimePreKey(msg.OneTimePreKeyID)
    }

    // Same derivation as sender
    ikm := concat(dh1, dh2, dh3, dh4, pqSharedSecret)
    masterSecret := HKDF(ikm, "PQXDH")

    rootKey, recvChainKey := DeriveChainKeys(masterSecret)

    return &Session{
        RemoteIdentity: deriveIdentity(msg.SenderIdentityKey),
        RootKey:        rootKey,
        RecvChainKey:   recvChainKey,
        RecvCounter:    0,
    }, nil
}
```

### 3. Double Ratchet

#### 3.1 Session State

```go
type Session struct {
    // Identities
    LocalIdentity   Identity
    RemoteIdentity  Identity

    // Ratchet state
    RootKey         [32]byte
    SendChainKey    [32]byte
    RecvChainKey    [32]byte

    // DH ratchet keys
    SendRatchetKey  *X25519KeyPair
    RecvRatchetKey  []byte  // Public only

    // Message counters
    SendCounter     uint32
    RecvCounter     uint32
    PrevSendCounter uint32

    // Skipped message keys (for out-of-order)
    SkippedKeys     map[SkippedKeyID][32]byte
}

type SkippedKeyID struct {
    RatchetPub []byte
    Counter    uint32
}
```

#### 3.2 DH Ratchet Step

```go
func (s *Session) DHRatchet(remoteRatchetPub []byte) {
    // DH with current and new remote ratchet key
    dhOutput := X25519(s.SendRatchetKey.Private, remoteRatchetPub)

    // Derive new root key and receive chain
    s.RootKey, s.RecvChainKey = KDFRootKey(s.RootKey, dhOutput)

    // Generate new send ratchet key
    s.SendRatchetKey = GenerateX25519KeyPair()

    // DH with new keys
    dhOutput = X25519(s.SendRatchetKey.Private, remoteRatchetPub)

    // Derive new send chain
    s.RootKey, s.SendChainKey = KDFRootKey(s.RootKey, dhOutput)

    // Update remote key
    s.RecvRatchetKey = remoteRatchetPub
    s.PrevSendCounter = s.SendCounter
    s.SendCounter = 0
    s.RecvCounter = 0
}
```

#### 3.3 Symmetric Ratchet

```go
func KDFChainKey(chainKey [32]byte) (nextChainKey, messageKey [32]byte) {
    // HKDF for chain key update
    output := HKDF(chainKey[:], "chain", 64)
    copy(nextChainKey[:], output[:32])
    copy(messageKey[:], output[32:])
    return
}

func (s *Session) GetSendMessageKey() [32]byte {
    messageKey := [32]byte{}
    s.SendChainKey, messageKey = KDFChainKey(s.SendChainKey)
    s.SendCounter++
    return messageKey
}
```

### 4. Message Encryption

#### 4.1 Message Format

```go
type EncryptedDMMessage struct {
    // Header (plaintext, authenticated)
    Header DMMessageHeader

    // Ciphertext
    Ciphertext []byte

    // Authentication tag
    Tag []byte
}

type DMMessageHeader struct {
    // DH ratchet public key
    RatchetPub []byte

    // Message counter
    Counter uint32

    // Previous chain counter
    PrevCounter uint32

    // Timestamp
    Timestamp uint64
}
```

#### 4.2 Encryption

```go
func (s *Session) Encrypt(plaintext []byte) (*EncryptedDMMessage, error) {
    // Get message key
    messageKey := s.GetSendMessageKey()

    // Derive encryption and MAC keys
    encKey, macKey := DeriveAEADKeys(messageKey)

    // Build header
    header := DMMessageHeader{
        RatchetPub:  s.SendRatchetKey.Public,
        Counter:     s.SendCounter - 1,
        PrevCounter: s.PrevSendCounter,
        Timestamp:   uint64(time.Now().Unix()),
    }

    // AAD = header || namespace_id
    aad := append(header.Encode(), s.NamespaceID[:]...)

    // AEAD encryption
    nonce := DeriveNonce(messageKey, header.Counter)
    ciphertext, tag := AESGCMEncrypt(encKey, nonce, plaintext, aad)

    return &EncryptedDMMessage{
        Header:     header,
        Ciphertext: ciphertext,
        Tag:        tag,
    }, nil
}
```

#### 4.3 Decryption

```go
func (s *Session) Decrypt(msg *EncryptedDMMessage) ([]byte, error) {
    // Check for skipped message key
    skippedID := SkippedKeyID{
        RatchetPub: msg.Header.RatchetPub,
        Counter:    msg.Header.Counter,
    }
    if messageKey, ok := s.SkippedKeys[skippedID]; ok {
        delete(s.SkippedKeys, skippedID)
        return s.decryptWithKey(msg, messageKey)
    }

    // Check if DH ratchet needed
    if !bytes.Equal(msg.Header.RatchetPub, s.RecvRatchetKey) {
        // Skip remaining messages in current chain
        s.skipMessages(s.RecvRatchetKey, msg.Header.PrevCounter)
        // Perform DH ratchet
        s.DHRatchet(msg.Header.RatchetPub)
    }

    // Skip messages in this chain
    s.skipMessages(msg.Header.RatchetPub, msg.Header.Counter)

    // Get message key
    messageKey := s.GetRecvMessageKey()

    return s.decryptWithKey(msg, messageKey)
}

func (s *Session) skipMessages(ratchetPub []byte, until uint32) {
    for s.RecvCounter < until {
        messageKey := s.GetRecvMessageKey()
        skippedID := SkippedKeyID{
            RatchetPub: ratchetPub,
            Counter:    s.RecvCounter - 1,
        }
        s.SkippedKeys[skippedID] = messageKey
    }
}
```

### 5. Message Types

#### 5.1 Content Types

```go
type DMContent struct {
    Type    ContentType
    Payload []byte
}

type ContentType uint8
const (
    ContentText       ContentType = 1
    ContentImage      ContentType = 2
    ContentFile       ContentType = 3
    ContentReaction   ContentType = 4
    ContentReply      ContentType = 5
    ContentRead       ContentType = 6
    ContentTyping     ContentType = 7
    ContentKeyUpdate  ContentType = 8
)
```

#### 5.2 Text Message

```go
type TextContent struct {
    Text string
}
```

#### 5.3 Attachment Reference

```go
type AttachmentContent struct {
    // Reference to encrypted file (LP-6463)
    CID       *CID
    MimeType  string
    FileName  string
    Size      uint64
    Thumbnail []byte  // Optional encrypted thumbnail
    Key       []byte  // Decryption key
}
```

### 6. Read Receipts and Typing

#### 6.1 Read Receipt

```go
type ReadReceipt struct {
    MessageSeqs []uint64  // Sequence numbers read
    Timestamp   uint64
}
```

#### 6.2 Typing Indicator

```go
type TypingIndicator struct {
    IsTyping bool
    // Short TTL, not persisted
}
```

### 7. Session Management

#### 7.1 Session Storage

```go
type SessionStore interface {
    // Get session for identity
    GetSession(remoteIdentity *Identity) (*Session, error)

    // Save session
    SaveSession(session *Session) error

    // Delete session
    DeleteSession(remoteIdentity *Identity) error

    // List all sessions
    ListSessions() ([]*Session, error)
}
```

#### 7.2 Session Reset

```go
func (s *Session) Reset() error {
    // Clear ratchet state
    s.RootKey = [32]byte{}
    s.SendChainKey = [32]byte{}
    s.RecvChainKey = [32]byte{}

    // Clear skipped keys
    s.SkippedKeys = make(map[SkippedKeyID][32]byte)

    // New session will be established on next message
    s.Initialized = false

    return nil
}
```

### 8. Wire Format

#### 8.1 DM Bus Message

```
DMBusMessageV1 := {
    version:       uint8    [1 byte]
    type:          uint8    [1 byte]  // Session init, message, etc.
    headerLen:     uint16   [2 bytes]
    header:        bytes    [headerLen bytes]
    ciphertextLen: uint32   [4 bytes]
    ciphertext:    bytes    [ciphertextLen bytes]
    tag:           bytes16  [16 bytes]
}
```

#### 8.2 Message Envelope

```go
type DMEnvelope struct {
    // Sender info
    SenderKeyRef [32]byte

    // Message type
    MessageType DMMessageType

    // Encrypted content
    Encrypted *EncryptedDMMessage
}

type DMMessageType uint8
const (
    DMTypeSessionInit DMMessageType = 1
    DMTypeMessage     DMMessageType = 2
    DMTypeAck         DMMessageType = 3
)
```

## Rationale

### Why PQXDH?

- Combines classical and PQ key exchange
- Safe against both classical and quantum attacks
- Based on proven Signal X3DH

### Why Double Ratchet?

- Provides forward secrecy
- Post-compromise security
- Battle-tested protocol

### Why Deterministic Namespace?

- Both parties can derive same namespace
- No coordination needed
- Privacy-preserving (hash-based)

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

### Forward Secrecy

- Each message uses unique key
- Compromise of current key doesn't reveal past messages
- DH ratchet provides long-term FS

### Post-Compromise Security

- New DH ratchet after compromise
- Attacker loses access after ratchet
- One-time pre-keys enhance initial security

### Replay Protection

- Sequence numbers prevent replay
- Namespace binding in AAD
- Timestamp bounds

## Test Plan

### Unit Tests

1. **PQXDH**: Key exchange produces matching secrets
2. **Double Ratchet**: Encrypt/decrypt round-trip
3. **Out-of-Order**: Handle message reordering

### Integration Tests

1. **Session Establishment**: Alice → Bob conversation start
2. **Full Conversation**: Multi-message exchange
3. **Recovery**: Session reset and re-establishment

### Security Tests

1. **Ciphertext Malleability**: Reject modified ciphertext
2. **Replay**: Reject replayed messages
3. **Wrong Session**: Messages decrypt only in correct session

## References

- [Signal Double Ratchet](https://signal.org/docs/specifications/doubleratchet/)
- [PQXDH Specification](https://signal.org/docs/specifications/pqxdh/)
- [MLS RFC 9420](https://www.rfc-editor.org/rfc/rfc9420)

---

*LP-6461 v1.0.0 - 2026-01-02*
