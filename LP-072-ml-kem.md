---
lp: 072
title: FIPS 203 ML-KEM Key Encapsulation
tags: [post-quantum, ml-kem, kyber, fips-203, lattice, encryption]
description: FIPS 203 ML-KEM (Module-Lattice Key Encapsulation Mechanism) for encrypted communication
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2024-01-01
references:
  - FIPS 203
  - lps-070 (ML-DSA)
  - lps-065 (TEE Mesh)
---

# LP-072: FIPS 203 ML-KEM Key Encapsulation

## Abstract

Defines the integration of FIPS 203 ML-KEM (FIPS 203, formerly CRYSTALS-Kyber) into Lux Network. ML-KEM is a post-quantum key encapsulation mechanism for establishing shared secrets. It is used in TEE mesh communication (LP-065), MPC key transport, and encrypted P2P channels between validators. An EVM precompile at `0x0072` performs on-chain KEM decapsulation for smart contract use cases.

## Specification

### Parameter Sets

| Parameter Set | NIST Level | Public Key | Ciphertext | Shared Secret |
|--------------|------------|------------|------------|---------------|
| ML-KEM-512 | 1 | 800 B | 768 B | 32 B |
| ML-KEM-768 | 3 | 1,184 B | 1,088 B | 32 B |
| ML-KEM-1024 | 5 | 1,568 B | 1,568 B | 32 B |

Default for Lux: ML-KEM-768 (Level 3).

### Operations

| Operation | Description |
|-----------|-------------|
| KeyGen | Generate (encapsulation key, decapsulation key) pair |
| Encapsulate | Input: encapsulation key. Output: (ciphertext, shared secret) |
| Decapsulate | Input: decapsulation key, ciphertext. Output: shared secret |

### Precompile

Address: `0x0072`

```
Input:  (bytes ciphertext, bytes decapsulationKey, uint8 paramSet)
Output: bytes32 (shared secret)
Gas:    60,000 (512), 80,000 (768), 100,000 (1024)
```

### Use Cases

| Application | Protocol |
|-------------|----------|
| TEE mesh channels | ML-KEM + AES-256-GCM for RA-TLS key exchange |
| MPC key transport | Encrypt DKG shares for transport between signers |
| Validator P2P | PQ-safe Noise protocol handshake |
| On-chain encryption | Smart contract receives encrypted data, decapsulates key |

### Hybrid Key Exchange

For backward compatibility, ML-KEM is combined with X25519 in a hybrid key exchange:

```
shared_secret = HKDF(X25519_secret || ML-KEM_secret)
```

This ensures security if either X25519 or ML-KEM remains unbroken.

### F103 — Hybrid vs Pure at the TLS Layer (Decision Record)

The chain-wide `ChainSecurityProfile.KeyExchangeID` reads as **"the
ML-KEM-768 component MUST be present on the wire"**, NOT "X25519 is
forbidden in this layer". The IANA-registered hybrid `X25519MLKEM768`
(curve ID `0x11ec`) — what real-world TLS 1.3 stacks implement today
— satisfies `KeyExchangeMLKEM768` because the hybrid **contains** the
ML-KEM-768 component.

Two reasons to keep the hybrid as the canonical TLS-layer KEM:

1. **Strictly stronger posture.** An attacker must break both X25519
   AND ML-KEM-768 to derive the session key. Pure ML-KEM-768 collapses
   to a single-assumption defence.
2. **Deployable today.** No production TLS 1.3 stack ships pure
   ML-KEM-768 standalone; every shipping implementation uses the
   hybrid curve ID. Forcing pure would prevent strict-PQ chains from
   peering with the rest of the ecosystem.

The profile **deliberately does NOT** carry a separate "pure vs
hybrid" enum byte: every additional axis is an additional downstream
verifier obligation, and the audit signed off on the single-byte
`KeyExchangeID` surface. `ForbidClassicalKEM` continues to refuse a
pure-classical curve (e.g. X25519 alone) at the application layer; it
does NOT refuse a hybrid that includes ML-KEM-768.

Forks that wish to pin strictly-pure ML-KEM-768 at the TLS layer do
so by overriding the chain's `KeyExchangeID` value, NOT by adding a
new enum byte to the canonical profile.

Implementation references:

- `consensus/config/pq_mode.go` — `KeyExchangeID` enum + documentation
- `node/network/peer/tls_config.go` — `CurvePreferences = [tls.X25519MLKEM768]`

## Security Considerations

1. ML-KEM security relies on Module-LWE hardness (same assumption family as ML-DSA).
2. The decapsulation key must never leave KMS/HSM. On-chain decapsulation is for specific contract patterns only.
3. Ciphertexts are not reusable. Each encapsulation produces a fresh shared secret.
4. IND-CCA2 security: chosen-ciphertext attacks are mitigated by the Fujisaki-Okamoto transform.

## Reference

| Resource | Location |
|----------|----------|
| ML-KEM precompile | `github.com/luxfi/evm/precompile/contracts/mlkem.go` |
| ML-KEM library | `github.com/luxfi/crypto/mlkem/` |
| FIPS 203 | https://csrc.nist.gov/pubs/fips/203/final |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
