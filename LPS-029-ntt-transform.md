---
lps: 029
title: NTT Transform
tags: [ntt, lattice, post-quantum, cryptography, polynomial]
description: Number Theoretic Transform for efficient lattice-based cryptographic operations
author: Lux Industries
status: Final
type: Standards Track
category: Cryptography
created: 2017-11-01
requires:
  - lps-012 (Post-Quantum Cryptography)
references:
  - lp-4000 (PQ Cryptography Suite)
---

# LPS-029: NTT Transform

## Abstract

The Number Theoretic Transform (NTT) is the core arithmetic primitive underlying Lux's post-quantum cryptographic operations. NTT enables O(n log n) polynomial multiplication in Z_q[X]/(X^n + 1), replacing the naive O(n^2) approach. All lattice-based schemes in the Lux PQ suite -- CRYSTALS-Dilithium (signatures), CRYSTALS-Kyber (key encapsulation), and NTRU (encryption) -- rely on NTT for performance-critical polynomial arithmetic.

## Specification

### Parameters

For Lux's PQ suite:

| Scheme | n | q | Primitive root |
|---|---|---|---|
| Kyber-768 | 256 | 3329 | 17 |
| Dilithium-3 | 256 | 8380417 | 1753 |

### Forward NTT

Transform a polynomial `a(X) = sum(a_i * X^i)` from coefficient form to NTT form:

```
a_hat[i] = sum(a[j] * omega^(j * bit_rev(i))) for j in 0..n-1
```

Where `omega` is a primitive 2n-th root of unity in Z_q. Implemented as an in-place butterfly network with `log2(n)` layers (8 layers for n=256).

### Inverse NTT

Recover coefficient form from NTT form:

```
a[i] = n^(-1) * sum(a_hat[j] * omega^(-j * bit_rev(i))) for j in 0..n-1
```

### Polynomial Multiplication via NTT

```
c = a * b mod (X^n + 1)
  = INTT(NTT(a) . NTT(b))
```

Where `.` denotes pointwise multiplication in NTT domain. Total cost: 2 forward NTTs + 1 pointwise multiply + 1 inverse NTT = O(n log n).

### GPU Acceleration

Lux nodes with GPU support use CUDA/Metal kernels for batch NTT:

- **Batch size**: 1024 NTTs per kernel launch
- **Throughput**: >1M NTTs/second on RTX 4090
- **Use case**: validator signature verification during high-throughput periods

CPU fallback uses AVX2/NEON vectorized butterfly operations. Performance: ~50K NTTs/second per core.

### EVM Precompile

NTT is exposed as an EVM precompile at address `0x0200000000000000000000000000000000000010`:

```
Input:  [4 bytes: n] [4 bytes: q] [n * 8 bytes: coefficients] [1 byte: direction (0=forward, 1=inverse)]
Output: [n * 8 bytes: transformed coefficients]
Gas:    100 + 2 * n
```

This allows smart contracts to perform lattice operations for on-chain PQ verification.

## Security Considerations

1. **Constant-time implementation**: NTT butterflies use constant-time modular arithmetic to prevent timing side channels.
2. **Parameter validation**: the precompile rejects non-power-of-2 `n` and non-prime `q` to prevent misuse.
3. **Overflow protection**: intermediate products are computed in 64-bit arithmetic to prevent overflow for any valid `q < 2^32`.

## Reference

| Resource | Location |
|---|---|
| NTT implementation | `github.com/luxfi/node/crypto/ntt/` |
| GPU kernels | `github.com/luxfi/node/crypto/ntt/gpu/` |
| PQ crypto suite | LPS-012 |
| EVM precompile | `github.com/luxfi/evm/precompile/contracts/ntt/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
