---
lp: 2210
title: PQ/Hybrid Transport Protocol
description: PQ/Hybrid Transport Protocol for LuxDA Bus and Lux Network
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 6420]
tags: [pqc, luxda-bus, q-chain]
---

## Abstract

This LP defines post-quantum secure transport layer protocols for all LuxDA Bus network communications.

## Motivation

Transport layer security is the first line of defense against network attackers. This LP ensures:
1. Forward secrecy against future quantum adversaries
2. Authentication of all network peers
3. Seamless upgrade from classical to hybrid to PQ-only

## Specification

### 1. Protocol Stack

```
┌─────────────────────────────────────┐
│         Application Layer           │
├─────────────────────────────────────┤
│      LuxDA Bus Protocols            │
├─────────────────────────────────────┤
│      PQ-Noise Framework             │
├─────────────────────────────────────┤
│      QUIC / TCP                     │
└─────────────────────────────────────┘
```

### 2. PQ-Noise Handshake

Based on Noise NK pattern with X-Wing KEM:

```
→ e
← e, ee, ekem, s, es
→ s, se, skem
```

```go
type PQNoiseHandshake struct {
    // Initiator ephemeral
    EphemeralKEM    *XWingKeyPair
    EphemeralDH     *X25519KeyPair

    // Static keys
    LocalStatic     *XWingKeyPair
    RemoteStatic    *XWingPublicKey

    // Derived secrets
    ChainingKey     [32]byte
    HandshakeHash   [32]byte
}

func (h *PQNoiseHandshake) Initialize(prologue []byte)
func (h *PQNoiseHandshake) WriteMessage(payload []byte) []byte
func (h *PQNoiseHandshake) ReadMessage(message []byte) []byte
func (h *PQNoiseHandshake) Split() (CipherState, CipherState)
```

### 3. Key Derivation

```go
// Combined KDF using HKDF-SHA256
func CombineSecrets(
    dhSecret []byte,     // X25519 shared secret
    kemSecret []byte,    // ML-KEM shared secret
) []byte {
    return hkdf.Extract(sha256.New,
        append(dhSecret, kemSecret...),
        []byte("LuxPQNoise"))
}
```

### 4. Cipher Suite

```go
type CipherSuite struct {
    KEM       string  // "X-Wing"
    Cipher    string  // "ChaChaPoly"
    Hash      string  // "SHA256"
}

var DefaultSuite = CipherSuite{
    KEM:    "X-Wing",
    Cipher: "ChaChaPoly",
    Hash:   "SHA256",
}
```

### 5. Connection Establishment

```go
type SecureConn interface {
    // Handshake performs PQ-Noise handshake
    Handshake(ctx context.Context) error

    // RemotePeer returns authenticated peer identity
    RemotePeer() PeerID

    // Read/Write encrypted data
    Read(b []byte) (int, error)
    Write(b []byte) (int, error)

    // Close with graceful shutdown
    Close() error
}

// Upgrade raw connection to secure
func UpgradeOutbound(
    ctx context.Context,
    conn net.Conn,
    localKey *XWingKeyPair,
    remotePubKey *XWingPublicKey,
) (SecureConn, error)

func UpgradeInbound(
    ctx context.Context,
    conn net.Conn,
    localKey *XWingKeyPair,
) (SecureConn, error)
```

### 6. Session Resumption

```go
type SessionTicket struct {
    TicketID      [16]byte
    CreatedAt     uint64
    ExpiresAt     uint64
    ResumptionKey [32]byte  // Encrypted with server key
}

// 0-RTT resumption with forward secrecy
func ResumeSession(ticket SessionTicket) (SecureConn, error)
```

### 7. Peer Authentication

```go
type PeerIdentity struct {
    PublicKey     *XWingPublicKey
    Certificate   *PeerCertificate  // Optional
    AttestationChain []Attestation  // Optional (for validators)
}

type PeerCertificate struct {
    Subject       PeerID
    PublicKey     *XWingPublicKey
    ValidFrom     uint64
    ValidUntil    uint64
    Issuer        PeerID
    Signature     []byte  // ML-DSA signature
}
```

### 8. Wire Format

```
Handshake Message Format:
┌────────────────────────────────────────────┐
│ Version (1 byte)                           │
├────────────────────────────────────────────┤
│ Message Type (1 byte)                      │
├────────────────────────────────────────────┤
│ Length (2 bytes, big-endian)               │
├────────────────────────────────────────────┤
│ Payload (variable)                         │
│   - Ephemeral public key (1216 bytes)      │
│   - KEM ciphertext (1120 bytes)            │
│   - Encrypted payload                      │
└────────────────────────────────────────────┘
```

### 9. Migration Support

```go
type TransportVersion int

const (
    TransportClassical TransportVersion = 1  // X25519 only
    TransportHybrid    TransportVersion = 2  // X-Wing (X25519 + ML-KEM)
    TransportPQOnly    TransportVersion = 3  // ML-KEM-1024 only
)

// Version negotiation
func NegotiateVersion(local, remote []TransportVersion) TransportVersion
```

## Security Considerations

1. **Forward secrecy**: Ephemeral keys ensure past sessions remain secure
2. **Hybrid security**: X-Wing combines classical and PQ security
3. **Authentication**: Peer identity bound to handshake transcript
4. **Replay protection**: Nonces and session IDs prevent replay attacks

## Test Plan

1. Handshake interoperability with reference implementation
2. Performance benchmarks (latency, throughput)
3. Stress testing under high connection rates
4. Migration path testing (v1 → v2 → v3)

## References

- Noise Protocol Framework
- X-Wing IETF Draft
- LP-2200: PQ Crypto SDK

---

*LP-2210 v1.0.0 - 2026-01-02*
