---
lps: 077
title: Linear Shamir's Secret Sharing
tags: [secret-sharing, shamir, lss, resharing, threshold, polynomial]
description: Linear secret sharing scheme with proactive resharing for key rotation
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2024-01-01
references:
  - lps-076 (Universal Threshold Framework)
  - lps-019 (Threshold MPC)
---

# LPS-077: Linear Shamir's Secret Sharing

## Abstract

Defines the Linear Shamir's Secret Sharing (LSS) scheme used across all threshold cryptographic operations on Lux Network. LSS is the foundation for proactive resharing: rotating key shares without reconstructing or changing the secret. A t-of-n sharing can be reshared to a t'-of-n' group in O(n * n') time with 0.14ms per party.

## Specification

### Shamir's Secret Sharing

A secret `s` is encoded as the constant term of a random degree-(t-1) polynomial:

```
f(x) = s + a_1*x + a_2*x^2 + ... + a_{t-1}*x^{t-1}  (mod p)
```

Each party P_i receives share `f(i)`. Any t shares reconstruct `s` via Lagrange interpolation. Fewer than t shares reveal no information about `s`.

### LSS Resharing Protocol

```
Old group: (t, n) with shares {s_i = f(i)}
New group: (t', n') to receive shares {s'_j}

Phase 1 (Old parties, need t):
  Each P_i picks random degree-(t'-1) polynomial g_i with g_i(0) = s_i.
  Sends g_i(j) to each new party P'_j.

Phase 2 (New parties):
  Each P'_j computes: s'_j = sum(lambda_i * g_i(j)) for i in old_group
  where lambda_i are Lagrange coefficients for the old evaluation points.

Result:
  New shares {s'_j} form a (t', n') sharing of the SAME secret s.
  Old shares are invalidated (new polynomial).
```

### Verification (Feldman VSS)

Each polynomial coefficient `a_k` has a public commitment `A_k = a_k * G`. Receivers verify shares:

```
s_i * G == sum(A_k * i^k for k in 0..t-1)
```

### Performance

| Operation | Time |
|-----------|------|
| Share generation (per party) | 0.02ms |
| Share verification | 0.05ms |
| Reshare (per party) | 0.14ms |
| Lagrange interpolation (t parties) | 0.01ms * t |

### Field

LSS operates over the scalar field of the target curve:
- secp256k1: p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
- Ed25519: p = 2^252 + 27742317777372353535851937790883648493
- BLS12-381: r = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001

## Security Considerations

1. Information-theoretic security: t-1 shares reveal zero bits of the secret, regardless of computational power.
2. Proactive resharing must complete atomically. If fewer than t old parties participate, resharing fails (liveness, not safety).
3. After resharing, old shares MUST be securely deleted. Possession of both old and new shares does not increase advantage but violates the proactive security model.
4. Feldman VSS commitments are computationally binding. A dishonest dealer cannot create inconsistent shares that pass verification.

## Reference

| Resource | Location |
|----------|----------|
| LSS implementation | `github.com/luxfi/mpc/lss/` |
| Feldman VSS | `github.com/luxfi/mpc/lss/feldman.go` |
| Shamir reference | Shamir, "How to Share a Secret" (1979) |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
