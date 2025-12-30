---
lp: 121
title: ECIES Encrypt/Decrypt
tags: [evm, precompile, ecies, encryption, secp256k1, p256, hybrid-encryption]
description: Elliptic Curve Integrated Encryption Scheme for on-chain public key encryption
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-116 (AES-256-GCM)
---

# LP-121: ECIES Encrypt/Decrypt

## Abstract

Implements ECIES (Elliptic Curve Integrated Encryption Scheme) as an EVM precompile. ECIES combines ECDH key agreement, KDF, symmetric encryption (AES-128-CTR), and HMAC authentication into a single hybrid encryption scheme. Compatible with go-ethereum's devp2p ECIES implementation. Supports secp256k1, P-256, and P-384 curves.

## Specification

### Address

`0x9201` -- Privacy range.

### Interface

```
0x01 Encrypt:  curve_id(1) + pubkey(33/65) + plaintext -> ciphertext
0x02 Decrypt:  curve_id(1) + privkey(32) + ciphertext -> plaintext
0x10 ECDH:     curve_id(1) + scalar(32) + point(33/65) -> shared_secret(32)
0x11 DeriveKey: shared_secret(32) + info -> derived_key(32)
```

Curve IDs: 0x01 = secp256k1, 0x02 = P-256, 0x03 = P-384.

Ciphertext format: ephemeral_pubkey(33/65) + ciphertext + hmac(32).

### Gas Schedule

| Operation | secp256k1 | P-256 | P-384 |
|-----------|-----------|-------|-------|
| Encrypt (base) | 6,000 | 5,000 | 8,000 |
| Decrypt (base) | 6,500 | 5,500 | 8,500 |
| ECDH | 3,000 | 2,500 | 4,000 |

Plus per-byte cost for plaintext/ciphertext data.

### Security Considerations

1. ECIES is IND-CCA2 secure under the Gap-DH assumption on the chosen curve.
2. Private keys passed to decrypt are visible to all validators. Only use for contract-held keys where the contract controls access.
3. The ephemeral key is generated fresh for each encryption, ensuring forward secrecy per message.
4. Not post-quantum. For PQ-safe encryption use HPKE with X-Wing KEM (LP-122 + LP-115).

## References

- V. Shoup, [A Proposal for an ISO Standard for Public Key Encryption](https://www.shoup.net/papers/iso-2_1.pdf) (2001)
- Source: `github.com/luxfi/precompile/ecies/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
