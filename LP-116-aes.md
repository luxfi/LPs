---
lp: 116
title: AES-256-GCM Authenticated Encryption
tags: [evm, precompile, aes, gcm, aead, symmetric-encryption]
description: AES-256-GCM authenticated encryption and decryption precompile
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-066 (TFHE)
---

# LP-116: AES-256-GCM Authenticated Encryption

## Abstract

Implements AES-256-GCM authenticated encryption as an EVM precompile. Provides on-chain encrypt and decrypt operations with associated authenticated data (AAD). Used for encrypted storage, on-chain data rooms, and FHE key wrapping.

## Specification

### Address

`0x0000000000000000000000000000000000009210` -- Crypto Ops range.

### Interface

Operation selector is the first byte of input.

```
0x01 Encrypt: key(32) + nonce(12) + aad_len(2) + aad + plaintext -> ciphertext + tag(16)
0x02 Decrypt: key(32) + nonce(12) + aad_len(2) + aad + ciphertext+tag -> plaintext
```

The 16-byte GCM authentication tag is appended to the ciphertext on encrypt and verified on decrypt. AAD length is encoded as a 2-byte big-endian integer.

### Gas Schedule

| Operation | Base Gas | Per Byte |
|-----------|----------|----------|
| Encrypt | 3,000 | 5 |
| Decrypt | 3,000 | 5 |

### Security Considerations

1. AES-256-GCM is IND-CCA2 secure (chosen-ciphertext resistant) under the assumption that AES is a pseudorandom permutation.
2. Nonce reuse with the same key is catastrophic -- it leaks plaintext XOR and allows tag forgery. Contracts must guarantee unique nonces per key.
3. Key material on-chain is visible to all validators. Use ECIES (LP-121) or HPKE (LP-122) for key transport; only decrypt with derived keys.
4. Maximum plaintext size per call should be kept under 64 KB to avoid excessive gas costs.

## References

- NIST SP 800-38D -- Recommendation for Block Cipher Modes: GCM
- Source: `github.com/luxfi/precompile/aes/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
