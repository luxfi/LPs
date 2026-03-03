---
lp: 122
title: Hybrid Public Key Encryption (RFC 9180)
tags: [evm, precompile, hpke, hybrid-encryption, rfc-9180, post-quantum]
description: RFC 9180 HPKE with classical and post-quantum KEM support
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-115 (X-Wing Hybrid KEM)
  - lps-121 (ECIES)
---

# LP-122: Hybrid Public Key Encryption (RFC 9180)

## Abstract

Implements RFC 9180 HPKE (Hybrid Public Key Encryption) as an EVM precompile. HPKE is a modern replacement for ECIES that supports multiple KEMs (P-256, P-384, X25519, X25519+Kyber768, X-Wing), KDFs, and AEADs in a composable cipher suite framework. Provides four modes: Base, PSK, Auth, and AuthPSK.

## Specification

### Address

`0x9200` -- Privacy range.

### Interface

Operations cover all four HPKE modes and single-shot convenience functions.

```
0x01-0x08: Setup operations (SetupBaseS/R, SetupPSKS/R, SetupAuthS/R, SetupAuthPSKS/R)
0x10 Seal:           context_handle + aad + plaintext -> ciphertext
0x11 Open:           context_handle + aad + ciphertext -> plaintext
0x12 Export:         context_handle + exporter_context + length -> key_material
0x20 SingleShotSeal: cipher_suite + pk + info + aad + plaintext -> enc + ciphertext
0x21 SingleShotOpen: cipher_suite + sk + enc + info + aad + ciphertext -> plaintext
```

Cipher suite is encoded as: KEM_ID(2) + KDF_ID(2) + AEAD_ID(2).

### KEM Support

| KEM ID | Algorithm | PQ Safe |
|--------|-----------|---------|
| 0x0010 | DHKEM(P-256) | No |
| 0x0011 | DHKEM(P-384) | No |
| 0x0020 | DHKEM(X25519) | No |
| 0x0030 | X25519+Kyber768 | Yes (hybrid) |
| 0x647a | X-Wing | Yes (hybrid) |

### Gas Schedule

| KEM | Encaps Gas |
|-----|-----------|
| P-256 | 6,000 |
| P-384 | 9,000 |
| X25519 | 3,000 |
| X25519+Kyber768 | 50,000 |
| X-Wing | 50,000 |

Seal/Open adds per-byte cost based on the AEAD (AES-128-GCM: 5/byte, ChaCha20-Poly1305: 4/byte).

### Security Considerations

1. HPKE is IND-CCA2 secure in the standard model under appropriate KEM assumptions.
2. Post-quantum hybrid KEMs (X25519+Kyber768, X-Wing) ensure security if either classical or lattice assumption holds.
3. PSK mode provides additional key confirmation but requires pre-shared secret distribution.
4. Auth mode provides sender authentication via the sender's static keypair.
5. GPU acceleration for lattice KEM operations (Kyber encaps/decaps) via `luxfi/accel`.

## References

- [RFC 9180](https://www.rfc-editor.org/rfc/rfc9180) -- Hybrid Public Key Encryption
- Source: `github.com/luxfi/precompile/hpke/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
