---
lps: 072
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

# LPS-072: FIPS 203 ML-KEM Key Encapsulation

## Abstract

Defines the integration of FIPS 203 ML-KEM (formerly CRYSTALS-Kyber) into Lux Network. ML-KEM is a post-quantum key encapsulation mechanism for establishing shared secrets. It is used in TEE mesh communication (LPS-065), MPC key transport, and encrypted P2P channels between validators. An EVM precompile at `0x0072` performs on-chain KEM decapsulation for smart contract use cases.

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
