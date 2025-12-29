---
lps: 071
title: FIPS 205 SLH-DSA Hash-Based Signatures
tags: [post-quantum, slh-dsa, sphincs, fips-205, hash-based, signature]
description: FIPS 205 SLH-DSA (Stateless Hash-Based Digital Signature Algorithm) integration
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2024-01-01
references:
  - FIPS 205
  - lps-070 (ML-DSA)
  - lps-012 (Post-Quantum Cryptography)
---

# LPS-071: FIPS 205 SLH-DSA Hash-Based Signatures

## Abstract

Defines the integration of FIPS 205 SLH-DSA (formerly SPHINCS+) into Lux Network. SLH-DSA is a stateless hash-based signature scheme whose security relies solely on hash function properties -- no lattice assumptions. It serves as a conservative fallback if lattice-based schemes (ML-DSA) are broken. An EVM precompile at `0x0071` verifies SLH-DSA signatures.

## Specification

### Parameter Sets

| Parameter Set | NIST Level | Public Key | Signature | Security |
|--------------|------------|------------|-----------|----------|
| SLH-DSA-SHA2-128s | 1 | 32 B | 7,856 B | 128-bit |
| SLH-DSA-SHA2-192s | 3 | 48 B | 16,224 B | 192-bit |
| SLH-DSA-SHA2-256s | 5 | 64 B | 29,792 B | 256-bit |

The `s` variants (small signatures) are preferred over `f` (fast signing) for on-chain use due to smaller signature size. Default: SLH-DSA-SHA2-128s.

### Precompile

Address: `0x0071`

```
Input:  (bytes32 messageHash, bytes signature, bytes publicKey, uint8 paramSet)
Output: bytes32 (0x01 valid, 0x00 invalid)
Gas:    150,000 (128s), 300,000 (192s), 500,000 (256s)
```

### Use Cases

SLH-DSA is the "break glass" signature scheme:

| Scenario | Description |
|----------|-------------|
| Lattice break | If Module-LWE is broken, SLH-DSA remains secure |
| Long-term documents | Signatures that must be valid for 50+ years |
| Root of trust | Certificate authority keys where conservatism is paramount |
| Governance | DAO proposals requiring maximum assurance |

### Hybrid Signatures

For critical operations, dual signatures (ML-DSA + SLH-DSA) provide security if either assumption holds:

```solidity
require(mldsaVerify(msg, sig1, pk1) && slhdsaVerify(msg, sig2, pk2));
```

## Security Considerations

1. Security depends only on hash function collision/preimage resistance. No algebraic assumptions.
2. Stateless: no risk of key compromise from state reuse (unlike XMSS/LMS).
3. Large signatures (7.8-29.8 KB) increase on-chain storage costs. Use only where PQ conservatism is required.
4. Verification is slower than ML-DSA. Not suitable for high-throughput consensus signatures.

## Reference

| Resource | Location |
|----------|----------|
| SLH-DSA precompile | `github.com/luxfi/evm/precompile/contracts/slhdsa.go` |
| SLH-DSA library | `github.com/luxfi/crypto/slhdsa/` |
| FIPS 205 | https://csrc.nist.gov/pubs/fips/205/final |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
