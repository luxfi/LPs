---
lp: 9701
title: "Reticulum Network Stack (RNS) Transport Support"
description: Integration of Reticulum Network Stack for resilient mesh networking transport
author: Lux Core Team (@luxfi)
status: Implemented
type: Standards Track
category: Networking
created: 2026-02-04
---

# LP-9701: Reticulum Network Stack (RNS) Transport Support

## Abstract

This proposal adds support for Reticulum Network Stack (RNS) as a transport layer in Lux nodes, enabling mesh networking, LoRa connectivity, and offline-first validator operation alongside traditional TCP/IP.

## Motivation

Lux validators currently require stable TCP/IP connectivity, limiting deployment to datacenters and well-connected locations. This excludes:

- Remote locations with intermittent connectivity
- Mobile validators (vehicles, maritime, aviation)
- Mesh network deployments (disaster recovery, rural areas)
- LoRa/radio-based validator networks
- Air-gapped or high-security environments

Reticulum provides medium-agnostic networking that works over any transport capable of carrying bytes: TCP, UDP, LoRa, packet radio, serial links, I2P, and more.

## Specification

### Endpoint Types

The `ips.Endpoint` type is extended to support three addressing modes:

```go
const (
    EndpointTypeIP       EndpointType = 0  // Traditional IP:port
    EndpointTypeHostname EndpointType = 1  // Hostname:port (DNS resolved)
    EndpointTypeRNS      EndpointType = 2  // RNS destination hash
)
```

### RNS Destination Format

RNS destinations are 128-bit (16-byte) truncated SHA-256 hashes of identity public keys:

```
rns://a5f72c3d4e5f60718293a4b5c6d7e8f9
```

### Identity System

Each node generates an RNS identity containing:
- Ed25519 keypair for signing (64-byte signatures)
- X25519 keypair for key exchange (derived from Ed25519 seed)
- 128-bit destination hash

Identity format (40 bytes):
```
[4 bytes magic "RNSI"][4 bytes version][32 bytes Ed25519 seed]
```

### Link Protocol

Encrypted links use a 4-step handshake:

1. **LinkRequest**: Initiator sends destination + Ed25519 pubkey + X25519 pubkey + signature
2. **LinkAccept**: Responder sends same structure
3. **Key Derivation**: Both compute shared secret via X25519 ECDH + HKDF-SHA256
4. **LinkProof/LinkComplete**: Encrypted HMAC verification

Post-handshake communication uses AES-256-GCM with counter-based nonces.

### Announce Protocol

Nodes advertise their destinations via signed announcements:

```
[16 bytes destination]
[32 bytes Ed25519 pubkey]
[32 bytes X25519 pubkey]
[2 bytes app data length]
[variable app data]
[64 bytes signature]
[1 byte hops]
[8 bytes timestamp (ms)]
```

Announcements propagate with hop counting (max 16 hops) and timestamp-based expiry.

### Configuration

```go
type RNSConfig struct {
    Enabled          bool          // Enable RNS transport
    ConfigPath       string        // Reticulum config directory
    IdentityPath     string        // Identity persistence path
    GatewayAddr      string        // Optional gateway for routing
    AnnounceInterval time.Duration // Re-announcement interval (default 5min)
    Interfaces       []string      // RNS interfaces to enable
    LinkTimeout      time.Duration // Link establishment timeout
}
```

### Dialer Integration

The `EndpointDialer` seamlessly handles all endpoint types:

```go
dialer.DialEndpoint(ctx, ips.NewIPEndpoint(ipAddr))           // TCP
dialer.DialEndpoint(ctx, ips.NewHostnameEndpoint("host", 9630)) // TCP via DNS
dialer.DialEndpoint(ctx, ips.NewRNSEndpoint(dest))             // RNS mesh
```

## Cryptographic Alignment

Lux already provides the required primitives:

| RNS Requirement | Lux Implementation |
|-----------------|-------------------|
| X25519 (ECDH) | `crypto/kem/x25519.go` |
| Ed25519 (signatures) | `precompile/ed25519/contract.go` |
| AES-256 encryption | `crypto/aead/aead.go` (GCM mode) |
| HKDF | Standard library `golang.org/x/crypto/hkdf` |

## Files

| File | Purpose |
|------|---------|
| `net/endpoints/endpoint.go` | Extended endpoint abstraction |
| `node/network/dialer/endpoint_dialer.go` | Unified dialer |
| `node/network/dialer/rns_transport.go` | RNS transport implementation |
| `node/network/dialer/rns_identity.go` | Identity management |
| `node/network/dialer/rns_link.go` | Encrypted link protocol |
| `node/network/dialer/rns_announce.go` | Destination discovery |

## Post-Quantum Security (Hybrid Mode)

RNS transport supports hybrid post-quantum cryptography for long-term security against quantum adversaries. This mode combines classical algorithms with NIST-standardized post-quantum primitives, providing defense-in-depth: the combined scheme remains secure as long as either component remains unbroken.

### Hybrid Key Exchange

Key exchange uses a TLS 1.3-inspired hybrid approach combining:

1. **X25519**: Classical ECDH (128-bit security)
2. **ML-KEM-768**: Post-quantum KEM (NIST Level 3, ~192-bit classical equivalent)

The shared secret is derived by concatenating both shared secrets before HKDF:

```
combined_secret = X25519_shared || ML_KEM_shared
session_key = HKDF-SHA256(combined_secret, context)
```

This ensures forward secrecy: even if long-term identity keys are compromised, past sessions remain confidential.

### Hybrid Signatures

Identity authentication uses hybrid signatures combining:

1. **Ed25519**: Classical signature (128-bit security)
2. **ML-DSA-65**: Post-quantum signature (NIST Level 3)

Both signatures must verify for authentication to succeed (AND composition). This prevents forgery even if one algorithm is broken.

### NIST Security Levels

| Algorithm | NIST Level | Classical Equivalent | Quantum Security |
|-----------|------------|---------------------|------------------|
| ML-KEM-768 | Level 3 | AES-192 | 143-bit |
| ML-DSA-65 | Level 3 | AES-192 | 128-bit |

Level 3 provides substantial security margin against both classical and quantum attacks.

### Cryptographic Algorithm Summary

| Purpose | Classical | Post-Quantum | Combined |
|---------|-----------|--------------|----------|
| Identity Signing | Ed25519 | ML-DSA-65 | Hybrid (AND) |
| Key Exchange | X25519 | ML-KEM-768 | Hybrid KEM |
| Session Encryption | AES-256-GCM | - | Same |
| Key Derivation | HKDF-SHA256 | - | Same |

### Wire Format Sizes

| Component | Classical | Hybrid | Delta |
|-----------|-----------|--------|-------|
| Public Identity | 64 bytes | ~3.2 KB | +3.1 KB |
| Signature | 64 bytes | ~2.5 KB | +2.4 KB |
| Key Exchange | 64 bytes | ~1.2 KB | +1.1 KB |
| Handshake Total | ~256 bytes | ~7.5 KB | +7.2 KB |

### Performance Characteristics

Benchmarks on Apple M1 Max:

| Operation | Classical | Hybrid | Overhead |
|-----------|-----------|--------|----------|
| Key Generation | 50 μs | 120 μs | 2.4x |
| Signature Sign | 60 μs | 180 μs | 3x |
| Signature Verify | 80 μs | 200 μs | 2.5x |
| Key Encapsulation | 40 μs | 90 μs | 2.25x |
| Key Decapsulation | 40 μs | 85 μs | 2.1x |

Hybrid mode adds ~100-150 μs to handshake latency, acceptable for most deployments.

### Backward Compatibility

Hybrid mode maintains interoperability with classical-only peers:

1. **Version Negotiation**: LinkRequest includes capability flags indicating PQ support
2. **Graceful Fallback**: If peer lacks PQ support, link uses classical-only cryptography
3. **Mixed Networks**: PQ-enabled and classical nodes interoperate seamlessly
4. **Upgrade Path**: Nodes can enable PQ without network coordination

Configuration:

```go
type RNSConfig struct {
    // ... existing fields ...
    PostQuantum      bool   // Enable hybrid PQ mode (default: true)
    RequirePostQuantum bool // Reject classical-only peers (default: false)
}
```

### References

- [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) - ML-KEM specification
- [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) - ML-DSA specification
- [LP-4316](../lp-4316-ml-dsa.md) - Lux ML-DSA implementation
- [LP-4318](../lp-4318-ml-kem.md) - Lux ML-KEM implementation

## Security Considerations

1. **Identity Protection**: Private keys zeroed on close, file permissions 0600
2. **Replay Prevention**: Timestamp validation with 1-minute clock skew tolerance
3. **Hop Limiting**: Max 16 hops prevents announcement storms
4. **App Data Limits**: 1024 bytes max prevents amplification attacks
5. **Forward Secrecy**: Ephemeral X25519 keys for each link establishment
6. **Quantum Resistance**: Hybrid PQ mode protects against harvest-now-decrypt-later attacks
7. **Algorithm Agility**: Modular design allows future algorithm upgrades

## Backwards Compatibility

Fully backwards compatible. RNS is opt-in via configuration. Nodes without RNS enabled continue using TCP/IP exclusively.

## Test Cases

Comprehensive test coverage in `*_test.go` files:
- Identity generation, persistence, sign/verify, encrypt/decrypt
- Link handshake and encrypted communication
- Announce creation, validation, propagation
- Destination table LRU eviction and expiry
- Dialer integration for all endpoint types

## Implementation

Implemented in Lux node v1.22.0.

## Copyright

Copyright 2026 Lux Industries, Inc. All rights reserved.
