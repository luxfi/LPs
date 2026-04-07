---
lps: 073
title: Ringtail Lattice-Based Threshold Signatures
tags: [post-quantum, ringtail, lattice, threshold, signature]
description: Lattice-based threshold signature scheme for post-quantum MPC signing
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2024-03-01
references:
  - lps-019 (Threshold MPC)
  - lps-070 (ML-DSA)
  - lps-076 (Universal Threshold Framework)
---

# LPS-073: Ringtail Lattice-Based Threshold Signatures

## Abstract

Defines Ringtail, a lattice-based threshold signature scheme for Lux Network. Ringtail enables t-of-n threshold signing where the aggregate signature is a single lattice-based signature verifiable at EVM precompile `0x000B`. Unlike classical threshold ECDSA (CGGMP21), Ringtail is post-quantum secure. Shares aggregate linearly (similar to BLS), avoiding the complex MtA protocols required by threshold ECDSA.

## Specification

### Parameters

| Parameter | Value |
|-----------|-------|
| Lattice dimension | 512 |
| Modulus q | 8380417 |
| Signature size | ~2,400 B |
| Public key size | ~1,500 B |
| Security level | NIST Level 2 (128-bit PQ) |

### Threshold DKG

```
Each P_i generates a secret polynomial f_i(x) over the lattice ring R_q.
Shares s_{i,j} = f_i(j) are distributed to each P_j.
Verification via lattice-based commitments (Module-LWE).
Group public key: sum of constant terms.
```

### Signing (2 rounds)

```
Round 1: Each signer commits to a nonce vector (mask).
Round 2: Each signer produces a partial signature using their share.
Aggregation: Partial signatures sum to a valid Ringtail signature.
```

The linear aggregation property means no MtA (Multiplicative-to-Additive) conversion is needed, unlike CGGMP21. This reduces signing complexity and eliminates Paillier encryption overhead.

### Precompile

Address: `0x000B` (as specified in LPS-019)

```
Input:  (bytes32 messageHash, bytes signature, bytes publicKey)
Output: bytes32 (0x01 valid, 0x00 invalid)
Gas:    120,000
```

### Performance

| Operation | 3-of-5 | 5-of-7 |
|-----------|--------|--------|
| DKG | 8.5ms | 15.2ms |
| Signing | 2.1ms | 3.4ms |
| Verification | 0.9ms | 0.9ms (constant) |

## Security Considerations

1. Security relies on Module-SIS hardness over polynomial rings.
2. Abort identification: malicious signers are detectable via commitment verification.
3. Signature size (~2.4 KB) is larger than ECDSA (65 B) but verification cost is O(1) regardless of group size.
4. Nonce reuse is safe (unlike Schnorr) due to the lattice rejection sampling step.

## Reference

| Resource | Location |
|----------|----------|
| Ringtail implementation | `github.com/luxfi/crypto/ringtail/` |
| Precompile | `github.com/luxfi/evm/precompile/contracts/ringtail.go` |
| LPS-019 MPC specification | `LPS-019-threshold-mpc.md` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
