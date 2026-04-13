---
lp: 119
title: Pedersen Hash Commitment
tags: [evm, precompile, pedersen, commitment, homomorphic, bn254]
description: Pedersen hash commitment scheme over BN254 for hiding and binding commitments
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-064 (Privacy Pool)
  - lps-037 (ZK VM)
---

# LP-119: Pedersen Hash Commitment

## Abstract

Implements Pedersen commitments over BN254 as an EVM precompile. Pedersen commitments are homomorphic (C(v1) + C(v2) = C(v1+v2)), hiding, and binding under the discrete logarithm assumption. Used in Zcash, Aztec, privacy pools, and range proof constructions (Bulletproofs).

## Specification

### Address

`0x0500000000000000000000000000000000000006` -- Hashing range.

### Interface

Operation selector is the first byte of input. Values and blindings are 32-byte BN254 scalar field elements. Commitments are 32-byte compressed BN254 G1 points.

```
0x01 Commit:       value(32) + blinding(32) -> commitment(32)
0x02 Verify:       commitment(32) + value(32) + blinding(32) -> bool(32)
0x03 Add:          c1(32) + c2(32) -> c1+c2(32)
0x04 VectorCommit: n(1) + values(n*32) + blinding(32) -> commitment(32)
```

Commit computes C = v*G + r*H where G and H are independent generators derived deterministically ("Lux_Pedersen_H_Generator"). VectorCommit supports up to 32 values.

### Gas Schedule

| Operation | Gas |
|-----------|-----|
| Commit | 6,000 |
| Verify | 7,000 |
| Add | 500 |
| VectorCommit (base) | 6,000 |
| VectorCommit (per value) | 3,000 |

### Security Considerations

1. Hiding and binding properties require that no one knows the discrete log relationship between G and H. Generators are derived via hash-to-curve.
2. Security is based on BN254 DLOG hardness (~100 bits). Not post-quantum.
3. Maximum vector commitment size is 32 elements. Each generator G_i is derived deterministically.
4. Homomorphic addition (OpAdd) enables efficient range proof verification without opening commitments.

## References

- T.P. Pedersen, [Non-Interactive and Information-Theoretic Secure Verifiable Secret Sharing](https://link.springer.com/chapter/10.1007/3-540-46766-1_9) (CRYPTO 1991)
- Source: `github.com/luxfi/precompile/pedersen/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
