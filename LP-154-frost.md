---
lp: 154
title: FROST Threshold Schnorr Signatures
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

FROST (Flexible Round-Optimized Schnorr Threshold) — RFC 9591 — over Curve25519 / secp256k1 / Ed25519. Two-round threshold Schnorr with VSS-distributed shares. Used by Lux validator key management (LP-015) for non-interactive aggregate-signing of Quasar BLS rounds, and for signer pools in M-Chain MPC custody. GPU kernels for parallel commitment generation.

## Specification

### Parameters
- Threshold (t, n) with t ≤ n
- Curve: secp256k1 (LP-147), Ed25519 (LP-124), or Ristretto255
- Hash-to-scalar: per-curve (SHA-256 for secp256k1; SHA-512 for Ed25519)
- Two rounds: commitment + signature share

### Algorithm
- Round 1: each signer publishes nonce commitment `(D_i, E_i) = (d_i G, e_i G)` with d_i, e_i ← Fr
- Round 2: signer computes signature share `z_i = d_i + e_i · ρ_i + λ_i s_i c` where ρ_i = H(i, msg, B), λ_i is Lagrange coef, c = H(R, X, msg)
- Aggregator combines `(R, z) = (Σ R_i, Σ z_i)`

### KAT
- RFC 9591 Appendix F vectors (per-ciphersuite) PASS
- Cross-verified against `ZcashFoundation/frost` reference

## Implementation

### Go canonical
- `lux/crypto/frost/{vss,sign,aggregate}.go`
- Module: `github.com/luxfi/crypto/frost`

### C++ CPU canonical
- `luxcpp/crypto/frost/cpp/frost.{hpp,cpp}` — built atop the underlying curve LP (LP-124 Ed25519 / LP-147 secp256k1)
- C-ABI: `luxcpp/crypto/frost/c-abi/frost_capi.h`
- Library: `libfrost.a`

### GPU kernels
- Metal:  `luxcpp/crypto/frost/gpu/metal/frost.metal` — batch commitment generation kernel
- CUDA:   `luxcpp/crypto/frost/gpu/cuda/frost.cu` — same
- WGSL:   `luxcpp/crypto/frost/gpu/wgsl/frost.wgsl`

Note: CPU body is the canonical bottleneck (network roundtrips dominate signing); GPU helps batched commitment pre-computation but does not change protocol latency.

### Determinism
- CPU↔GPU byte-equality on N=100 random commitment+share pairs across batch sizes {16, 64, 256}; PASS.

## Test oracle
- `ZcashFoundation/frost` (Rust reference impl, vendored as test-only)
- RFC 9591 Appendix F

## Security
- VSS share-resharing protected by Feldman commitment binding
- Constant-time scalar arithmetic via underlying curve LP (LP-124 / LP-147)
- Threshold property: any `t-1` signers cannot forge; `t` signers can

## References
- Komlo, Goldberg, "FROST: Flexible Round-Optimized Schnorr Threshold Signatures" (2020)
- RFC 9591 (FROST)
- LP-019 (Threshold MPC for Bridge Signing — operational consumer)
- LP-076 (Universal threshold framework)
- LP-137 (umbrella)
