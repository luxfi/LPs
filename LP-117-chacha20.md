---
lp: 117
title: ChaCha20-Poly1305 AEAD
tags: [evm, precompile, chacha20, poly1305, aead, symmetric-encryption]
description: ChaCha20-Poly1305 authenticated encryption and decryption precompile
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-116 (AES-256-GCM)
---

# LP-117: ChaCha20-Poly1305 AEAD

## Abstract

Implements ChaCha20-Poly1305 authenticated encryption as an EVM precompile. Provides the same encrypt/decrypt interface as AES-GCM (LP-116) but uses the ChaCha20 stream cipher with Poly1305 MAC. Preferred on platforms without AES hardware acceleration (ARM without NEON-AES) and used by age encryption, WireGuard, and TLS 1.3 fallback cipher suites.

## Specification

### Address

`0x0000000000000000000000000000000000009211` -- Crypto Ops range.

### Interface

Operation selector is the first byte of input.

```
0x01 Encrypt: key(32) + nonce(12) + aad_len(2) + aad + plaintext -> ciphertext + tag(16)
0x02 Decrypt: key(32) + nonce(12) + aad_len(2) + aad + ciphertext+tag -> plaintext
```

Identical layout to AES-GCM (LP-116). The 16-byte Poly1305 tag is appended/verified automatically.

### Gas Schedule

| Operation | Base Gas | Per Byte |
|-----------|----------|----------|
| Encrypt | 2,500 | 4 |
| Decrypt | 2,500 | 4 |

Slightly cheaper than AES-GCM due to the simpler cipher construction (no block cipher key schedule).

### Security Considerations

1. ChaCha20-Poly1305 is IND-CCA2 secure per RFC 8439.
2. Same nonce-reuse catastrophe as AES-GCM -- never reuse a (key, nonce) pair.
3. ChaCha20 is a stream cipher; constant-time by construction (no table lookups vulnerable to cache-timing attacks).
4. Poly1305 MAC is information-theoretically secure for a single message per key.

## References

- RFC 8439 -- ChaCha20 and Poly1305 for IETF Protocols
- Source: `github.com/luxfi/precompile/chacha20/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
