---
lp: 115
title: X-Wing Hybrid KEM (X25519 + ML-KEM-768)
tags: [evm, precompile, xwing, hybrid-kem, post-quantum, x25519, ml-kem]
description: X-Wing hybrid key encapsulation combining X25519 with ML-KEM-768
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-072 (ML-KEM)
  - lps-114 (X25519)
---

# LP-115: X-Wing Hybrid KEM (X25519 + ML-KEM-768)

## Abstract

Implements the X-Wing hybrid key encapsulation mechanism as an EVM precompile. X-Wing combines classical X25519 with post-quantum ML-KEM-768 (FIPS 203, Level 3) as specified in IETF draft-connolly-cfrg-xwing-kem. Security holds if either X25519 or ML-KEM remains unbroken, providing a safe PQ upgrade path.

## Specification

### Address

`0x0000000000000000000000000000000000002221` -- PQ Hybrid range.

### Interface

Operation selector is the first byte of input.

```
0x01 KeyGen:      () -> (2-byte pk_len, pk, sk)
0x02 Encapsulate: pk -> (2-byte ct_len, ct, shared_secret(32))
0x03 Decapsulate: sk + ct -> shared_secret(32)
```

Key sizes (from circl/kem/xwing):
- Public key: 1,216 bytes (32 X25519 + 1,184 ML-KEM-768)
- Secret key: 2,464 bytes
- Ciphertext: 1,120 bytes (32 X25519 + 1,088 ML-KEM-768)
- Shared secret: 32 bytes

### Gas Schedule

| Operation | Gas |
|-----------|-----|
| KeyGen | 50,000 |
| Encapsulate | 40,000 |
| Decapsulate | 40,000 |

### Security Considerations

1. Hybrid security: the shared secret is secure if either X25519 (ECDH) or ML-KEM-768 (lattice) remains unbroken.
2. ML-KEM-768 provides NIST Level 3 (192-bit post-quantum security).
3. Ciphertexts are not reusable -- each encapsulation produces a fresh shared secret.
4. Uses Cloudflare's circl library for the X-Wing KEM implementation.
5. On-chain key generation should only be used for ephemeral keys. Long-lived keys must be generated off-chain in KMS/HSM.

## References

- IETF [draft-connolly-cfrg-xwing-kem](https://datatracker.ietf.org/doc/draft-connolly-cfrg-xwing-kem/)
- FIPS 203 -- ML-KEM (Module-Lattice Key Encapsulation Mechanism)
- Source: `github.com/luxfi/precompile/xwing/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
