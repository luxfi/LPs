---
lps: 074
title: FALCON Signature EVM Precompile
tags: [post-quantum, falcon, ntru, lattice, precompile, signature]
description: FALCON-512/1024 signature verification precompile for EVM
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2024-06-01
references:
  - lps-070 (ML-DSA)
  - lps-078 (EVM Precompiles)
  - lps-012 (Post-Quantum Cryptography)
---

# LPS-074: FALCON Signature EVM Precompile

## Abstract

Defines an EVM precompile at `0x0074` for FALCON signature verification. FALCON (Fast-Fourier Lattice-based Compact Signatures over NTRU) produces the smallest post-quantum signatures among lattice schemes (666 bytes at NIST Level 1). It is selected for use cases where signature size is critical: on-chain attestations, certificate chains, and compact proofs.

## Specification

### Parameter Sets

| Parameter Set | NIST Level | Public Key | Signature | Security |
|--------------|------------|------------|-----------|----------|
| FALCON-512 | 1 | 897 B | 666 B | 128-bit |
| FALCON-1024 | 5 | 1,793 B | 1,280 B | 256-bit |

### Precompile

Address: `0x0074`

```
Input:  (bytes32 messageHash, bytes signature, bytes publicKey, uint8 paramSet)
Output: bytes32 (0x01 valid, 0x00 invalid)
Gas:    65,000 (FALCON-512), 130,000 (FALCON-1024)
```

### Comparison with ML-DSA

| Property | FALCON-512 | ML-DSA-44 |
|----------|-----------|-----------|
| Signature size | 666 B | 2,420 B |
| Public key size | 897 B | 1,312 B |
| Sign time | 8.2ms | 0.3ms |
| Verify time | 0.1ms | 0.2ms |
| Gas cost | 65,000 | 80,000 |

FALCON wins on size; ML-DSA wins on signing speed. FALCON signing requires floating-point discrete Gaussian sampling, making constant-time implementation harder.

### Use Cases

| Application | Rationale |
|-------------|-----------|
| Certificate chains | Compact signatures reduce chain size |
| On-chain attestations | Lower calldata cost (EIP-4844 blob pricing) |
| Compressed proofs | Aggregate attestation with minimal on-chain footprint |

## Security Considerations

1. FALCON security relies on the NTRU lattice assumption and Short Integer Solution (SIS).
2. Signing requires careful floating-point sampling. Side-channel hardened implementation is mandatory.
3. FALCON is a NIST PQC finalist (Round 4 alternate) but not yet a FIPS standard. Use ML-DSA (FIPS 204) for FIPS-mandated contexts.
4. Key generation is slower than ML-DSA (~100ms vs ~1ms). Pregenerate keys in KMS.

## Reference

| Resource | Location |
|----------|----------|
| FALCON precompile | `github.com/luxfi/evm/precompile/contracts/falcon.go` |
| FALCON library | `github.com/luxfi/crypto/falcon/` |
| FALCON specification | https://falcon-sign.info |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
