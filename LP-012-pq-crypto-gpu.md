---
lp: 012
title: Post-Quantum Cryptography GPU Acceleration
tags: [pq, mldsa, mlkem, slhdsa, ringtail, fips-203, fips-204, fips-205, ntt]
description: NIST FIPS post-quantum algorithms accelerated on GPU via NTT
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2025-08-01
updated: 2026-04-06
requires:
  - lps-011 (GPU Crypto Acceleration)
---

# LP-012: Post-Quantum Cryptography GPU Acceleration

## Abstract

All NIST FIPS post-quantum algorithms run natively on GPU. The Number Theoretic Transform (NTT) is the shared primitive — 6 GPU NTT variants accelerate ML-DSA, ML-KEM, SLH-DSA, and Ringtail simultaneously.

## Algorithms

| Algorithm | Standard | Operation | GPU Kernel |
|-----------|----------|-----------|------------|
| ML-DSA-65 | FIPS 204 | Signature verify | mldsa.metal |
| ML-KEM-768 | FIPS 203 | Key decapsulate | mlkem.metal |
| SLH-DSA | FIPS 205 | Signature verify | slhdsa.metal |
| Ringtail | Lux-specific | Threshold sign | ringtail.metal |

## Shared NTT

6 NTT variants optimized for different use cases:
- `ntt.metal`: General-purpose butterfly
- `four_step_ntt.metal`: Large-degree polynomials
- `ntt_unified_memory.metal`: Apple Silicon zero-copy
- `ntt_kernels.metal`: Fused NTT + pointwise multiply
- `poly_mul.metal`: Polynomial multiplication via NTT
- `twiddle_cache.metal`: Pre-computed twiddle factors
