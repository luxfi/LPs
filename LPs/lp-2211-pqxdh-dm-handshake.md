---
lp: 2211
title: PQXDH DM Handshake Protocol
description: PQXDH DM Handshake Protocol for LuxDA Bus and Lux Network
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 6460]
tags: [pqc, luxda-bus, q-chain]
---

## Abstract

This LP defines the Post-Quantum Extended Diffie-Hellman (PQXDH) protocol for establishing secure direct message sessions in LuxDA Bus chat.

## Motivation

Signal's X3DH protocol provides excellent security properties but relies on classical Diffie-Hellman. PQXDH extends X3DH with:
1. Post-quantum KEM for long-term security
2. Hybrid approach preserving classical security guarantees
3. Compatibility with existing Double Ratchet algorithm

## Specification

### 1. Key Types

```go
// Identity key (long-term)
type IdentityKey struct {
    Classical *Ed25519KeyPair
    PQ        *MLDSAKeyPair
}

// Signed prekey (medium-term, rotated weekly)
type SignedPreKey struct {
    Classical *X25519KeyPair
    PQ        *MLKEMKeyPair
    Signature []byte  // ML-DSA over both public keys
    Timestamp uint64
}

// One-time prekey (single use)
type OneTimePreKey struct {
    Classical *X25519KeyPair
    PQ        *MLKEMKeyPair
    ID        uint32
}
```

### 2. Key Bundle

```go
type PQXDHKeyBundle struct {
    IdentityKey     *IdentityKey
    SignedPreKey    *SignedPreKey
    OneTimePreKeys  []*OneTimePreKey
}

// Published to key directory
type PublicKeyBundle struct {
    IdentityPubKey     IdentityPublicKey
    SignedPrePubKey    SignedPrePublicKey
    SignedPreKeyID     uint32
    SignedPreKeySig    []byte
    OneTimePrePubKeys  []OneTimePrePublicKey
}
```

### 3. PQXDH Protocol

```
Alice (initiator) → Bob (responder)

Alice has: IK_A (identity), EK_A (ephemeral)
Bob has: IK_B (identity), SPK_B (signed prekey), OPK_B (one-time prekey)

Step 1: Alice fetches Bob's key bundle from directory

Step 2: Alice computes shared secrets:
  DH1 = X25519(IK_A, SPK_B)           // Identity to signed prekey
  DH2 = X25519(EK_A, IK_B)            // Ephemeral to identity
  DH3 = X25519(EK_A, SPK_B)           // Ephemeral to signed prekey
  DH4 = X25519(EK_A, OPK_B)           // Ephemeral to one-time (if available)

  KEM1 = MLKEM.Encap(SPK_B.PQ)        // KEM to signed prekey
  KEM2 = MLKEM.Encap(OPK_B.PQ)        // KEM to one-time (if available)

Step 3: Alice derives shared secret:
  SK = KDF(DH1 || DH2 || DH3 || DH4 || KEM1.ss || KEM2.ss)

Step 4: Alice sends initial message:
  - IK_A public key
  - EK_A public key
  - SPK_B key ID
  - OPK_B key ID (if used)
  - KEM1 ciphertext
  - KEM2 ciphertext (if used)
  - Encrypted initial message
```

### 4. Implementation

```go
type PQXDHSession struct {
    LocalIdentity    *IdentityKey
    RemoteIdentity   *IdentityPublicKey
    SharedSecret     [32]byte
    AssociatedData   []byte
}

func InitiateSession(
    localIdentity *IdentityKey,
    remoteBundle *PublicKeyBundle,
) (*PQXDHSession, *InitialMessage, error)

func RespondToSession(
    localBundle *PQXDHKeyBundle,
    initialMsg *InitialMessage,
) (*PQXDHSession, error)

type InitialMessage struct {
    IdentityKey       []byte     // Sender's identity public key
    EphemeralKey      []byte     // Sender's ephemeral public key
    SignedPreKeyID    uint32
    OneTimePreKeyID   uint32     // 0 if not used
    KEMCiphertext1    []byte     // To signed prekey
    KEMCiphertext2    []byte     // To one-time prekey (optional)
    Ciphertext        []byte     // AEAD encrypted payload
}
```

### 5. Associated Data

```go
// AD binds session to both parties' identities
func ComputeAD(
    initiatorIdentity, responderIdentity []byte,
) []byte {
    return append(
        append([]byte("PQXDH"), initiatorIdentity...),
        responderIdentity...,
    )
}
```

### 6. Key Derivation

```go
func DeriveSharedSecret(
    dh1, dh2, dh3, dh4 []byte,   // X25519 secrets
    kem1, kem2 []byte,           // ML-KEM secrets
) [32]byte {
    // Concatenate all secrets
    input := make([]byte, 0, 32*6)
    input = append(input, dh1...)
    input = append(input, dh2...)
    input = append(input, dh3...)
    if len(dh4) > 0 {
        input = append(input, dh4...)
    }
    input = append(input, kem1...)
    if len(kem2) > 0 {
        input = append(input, kem2...)
    }

    // KDF with domain separation
    return hkdf.Extract(sha256.New, input, []byte("PQXDH_SK"))
}
```

### 7. Transition to Double Ratchet

```go
// Initialize Double Ratchet from PQXDH session
func InitializeRatchet(session *PQXDHSession) *DoubleRatchet {
    return &DoubleRatchet{
        RootKey:        session.SharedSecret,
        LocalIdentity:  session.LocalIdentity,
        RemoteIdentity: session.RemoteIdentity,
    }
}
```

### 8. Key Rotation

```go
type KeyRotationPolicy struct {
    SignedPreKeyRotation  time.Duration  // Default: 7 days
    OneTimePreKeyRefill   int            // Refill when below threshold
    IdentityKeyRotation   time.Duration  // Default: never (manual)
}

// Check if rotation needed
func (p *KeyRotationPolicy) NeedsRotation(bundle *PQXDHKeyBundle) bool
```

## Rationale

The security of direct messaging on the LuxDA Bus relies on strong, forward-secret, and deniable encryption. While the X3DH protocol (used by Signal) provides these properties against classical adversaries, it is vulnerable to future quantum computers that can break the underlying elliptic curve cryptography.

PQXDH is a natural extension of X3DH that incorporates post-quantum cryptography (ML-KEM) to provide "hybrid" security. This means that a session is secure if *either* the classical *or* the post-quantum cryptography is unbroken. This approach provides a robust defense against future quantum threats while retaining the security guarantees of the well-analyzed classical X3DH protocol.

## Backwards Compatibility

This LP is fully backwards compatible. It defines a new handshake protocol for establishing secure sessions.

-   **New Sessions**: New direct message sessions will use the PQXDH handshake.
-   **Existing Sessions**: Existing sessions established with other protocols are unaffected.
-   **Double Ratchet Integration**: The session keys derived from PQXDH are designed to be seamlessly integrated with the existing Double Ratchet algorithm for ongoing message encryption, ensuring that the core messaging protocol does not need to change.

There are no breaking changes to the user experience or the core messaging functionality.
## Security Considerations


1. **Forward secrecy**: Ephemeral keys and one-time prekeys ensure forward secrecy
2. **Post-compromise security**: Double Ratchet provides healing after compromise
3. **Hybrid security**: Both classical and PQ must be broken to compromise session
4. **Deniability**: PQXDH provides offline deniability like X3DH
5. **One-time prekey exhaustion**: Falls back to signed prekey if OPKs exhausted

## Test Plan

1. Interoperability with reference PQXDH implementations
2. Session establishment under various key availability scenarios
3. Key rotation and bundle refresh testing
4. Performance benchmarks (latency, key bundle size)

## References

- Signal Protocol X3DH Specification
- PQXDH IETF Draft
- LP-6461: DM Sessions

---

*LP-2211 v1.0.0 - 2026-01-02*
