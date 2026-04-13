---
lp: 111
title: Baby Jubjub Twisted Edwards Curve
tags: [evm, precompile, babyjubjub, curves, zk, snarks]
description: Baby Jubjub twisted Edwards curve operations for ZK circuit compatibility
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-037 (ZK VM)
---

# LP-111: Baby Jubjub Twisted Edwards Curve

## Abstract

Implements the Baby Jubjub twisted Edwards curve as an EVM precompile. Baby Jubjub is defined over the BN254 scalar field, making it efficient inside BN254-based SNARKs (Groth16, PLONK). Used by Polygon zkEVM, Hermez, circom circuits, and EdDSA-over-BN254 signature schemes.

## Specification

### Address

`0x0500000000000000000000000000000000000007` -- Hashing/Curves range.

### Interface

Operation selector is the first byte of input.

```
0x01 PointAdd:  P1(64) + P2(64) -> P3(64)
0x02 ScalarMul: P(64) + scalar(32) -> P*s(64)
0x03 InCurve:   P(64) -> bool(32)
```

Points are 64 bytes: x(32) + y(32), big-endian field elements over BN254 Fr.

### Gas Schedule

| Operation | Gas |
|-----------|-----|
| PointAdd | 2,000 |
| ScalarMul | 7,000 |
| InCurve | 500 |

### Security Considerations

1. Baby Jubjub security is bounded by BN254 (~100-bit discrete log). Sufficient for SNARK-internal use but not for standalone long-term signatures.
2. Points are validated on-curve before operations. Invalid points return an error.
3. Uses `gnark-crypto` twisted Edwards implementation from ConsenSys.

## References

- Barry WhiteHat et al., [Baby Jubjub Elliptic Curve](https://eips.ethereum.org/EIPS/eip-2494) (EIP-2494)
- Source: `github.com/luxfi/precompile/babyjubjub/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
