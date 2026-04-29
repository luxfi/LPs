---
lp: 159
title: poly_mul — Lattice Polynomial Multiplication
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Polynomial multiplication in `R_q = Z_q[X] / (X^N + 1)` for cyclotomic ring lattices. Building block for ML-KEM (LP-072), ML-DSA (LP-070), TFHE (LP-013/066) and Ringtail (LP-073). Implements both schoolbook (small N) and NTT-based fast multiplication (LP-029) with batched GPU kernels.

## Specification

### Parameters
- Negacyclic ring `R_q = Z_q / (X^N + 1)` for power-of-2 `N`
- Modulus `q` per upstream scheme:
  - ML-KEM: `q = 3329`
  - ML-DSA: `q = 8380417`
  - TFHE: `q = 2^64`
  - Ringtail: scheme-specific
- Multiplication via NTT when `N | (q - 1)/2` (negacyclic root of unity exists)

### Algorithm
- Forward NTT(a), NTT(b)  → pointwise multiply  → inverse NTT
- Schoolbook fallback for small `N` (≤ 64)
- Karatsuba intermediate for `N` not amenable to NTT modulus

### KAT
- Per-scheme KAT vectors derived from upstream PQClean (`mldsa`, `mlkem`)
- TFHE: cross-checked against lattigo `ring.NTT`
- `lux/crypto/poly_mul/test/kat_*.json`

## Implementation

### Go canonical
- `lux/crypto/poly_mul/{schoolbook,ntt}.go`
- Module: `github.com/luxfi/crypto/poly_mul` @ `v1.18.3`

### C++ CPU canonical
- `luxcpp/crypto/poly_mul/cpp/poly_mul.{hpp,cpp}` (depends on `luxcpp/crypto/ntt`)
- C-ABI: `luxcpp/crypto/poly_mul/c-abi/poly_mul_capi.h`
- Library: `libpoly_mul.a`

### GPU kernels
- Metal:  `luxcpp/crypto/poly_mul/gpu/metal/poly_mul.metal` — fused NTT + pointwise + INTT (lifts Lattigo MLX path into the canonical lattice dispatcher; see #131)
- CUDA:   `luxcpp/crypto/poly_mul/gpu/cuda/poly_mul.cu`
- WGSL:   `luxcpp/crypto/poly_mul/gpu/wgsl/poly_mul.wgsl`

### Determinism
- CPU↔GPU byte-equality on N=100 random multiplications across all per-scheme `(N, q)` configurations; PASS.

## Test oracle
- PQClean reference (`pqcrystals-{mldsa,mlkem}/poly`) — vendored test-only
- lattigo `ring.NTT` (Go, FetchContent test-only)

## Security
- Modular reduction via Barrett/Montgomery — constant-time on the NTT path
- TFHE `q = 2^64` reduction trivial (machine-word truncation)
- Side-channel posture is the same as the consuming scheme (PQClean upstream is constant-time-by-design)

## References
- Longa, Naehrig, "Speeding up the Number-Theoretic Transform for Faster Ideal Lattice-Based Cryptography" (2016)
- FIPS 203 (ML-KEM) §4.3 — NTT-friendly poly mul
- FIPS 204 (ML-DSA) §7 — NTT
- LP-029 (NTT — primitive operation)
- LP-070 / LP-072 / LP-073 (consumers)
- LP-137 (umbrella)
