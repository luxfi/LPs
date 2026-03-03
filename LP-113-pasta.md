---
lp: 113
title: Pasta Curves (Pallas + Vesta)
tags: [evm, precompile, pasta, pallas, vesta, halo2, recursive-proofs]
description: Pallas and Vesta curve operations for recursive proof composition
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-037 (ZK VM)
---

# LP-113: Pasta Curves (Pallas + Vesta)

## Abstract

Implements the Pasta curve pair (Pallas and Vesta) as an EVM precompile. These curves form a 2-cycle: the base field of Pallas is the scalar field of Vesta and vice versa. This property enables efficient recursive proof composition (IVC) as used in Halo2, Zcash Orchard, and Nova/SuperNova proof systems.

## Specification

### Address

`0x0500000000000000000000000000000000000008` -- Hashing/Curves range.

### Interface

Input format: first byte selects the curve (0x01 = Pallas, 0x02 = Vesta), second byte selects the operation. Points are 64 bytes (x(32) + y(32)), scalars are 32 bytes.

```
0x01 PointAdd:  P1(64) + P2(64) -> P3(64)
0x02 ScalarMul: P(64) + scalar(32) -> P*s(64)
0x03 MSM:       n*(point(64) + scalar(32)) -> sum(64)
```

Both curves are short Weierstrass: y^2 = x^3 + 5 over their respective prime fields.

| Curve | Field Modulus |
|-------|--------------|
| Pallas | 2^254 + 0x224698fc094cf91b992d30ed00000001 |
| Vesta | 2^254 + 0x224698fc0994a8dd8c46eb2100000001 |

### Gas Schedule

| Operation | Gas |
|-----------|-----|
| PointAdd | 2,500 |
| ScalarMul | 8,000 |
| MSM (base) | 8,000 |
| MSM (per additional point) | 6,000 |

### Security Considerations

1. Both curves provide ~127-bit security. Not post-quantum.
2. The 2-cycle property means a proof verified on Pallas can be recursively proven on Vesta and vice versa, enabling incrementally verifiable computation.
3. Points are validated on-curve; the point at infinity is (0, 0).

## References

- S. Bowe, J. Grigg, D. Hopwood, [The Pasta Curves for Halo 2](https://electriccoin.co/blog/the-pasta-curves-for-halo-2-and-beyond/) (2020)
- Source: `github.com/luxfi/precompile/pasta/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
