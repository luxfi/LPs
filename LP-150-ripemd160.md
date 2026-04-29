---
lp: 150
title: RIPEMD-160
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

RIPEMD-160 hash function. Used by Bitcoin (P2PKH `address = base58check(0x00 || ripemd160(sha256(pubkey)))`) and the EIP-2 EVM precompile at address `0x03`. Constant-time Go + C++ + GPU kernels.

## Specification

### Parameters
- Block size: 512 bits
- Output: 160 bits (20 bytes)
- 5 parallel lines × 16 rounds = 80 operations per block
- Round constants K and K' per Dobbertin-Bosselaers-Preneel 1996

### Algorithm
- Two parallel computation lines (`left`/`right`) with different round functions f₁..f₅ and f₅..f₁ respectively
- Final state combined via the documented chaining word permutation

### KAT
- RIPEMD-160 reference test vectors (empty, "abc", "abcdefghijklmnopqrstuvwxyz", million-`a`) PASS
- `lux/crypto/ripemd160/test/kat.json`

## Implementation

### Go canonical
- `lux/crypto/ripemd160/` (uses `golang.org/x/crypto/ripemd160`)
- Module: `github.com/luxfi/crypto/ripemd160` @ `v1.18.3`

### C++ CPU canonical
- `luxcpp/crypto/ripemd160/cpp/ripemd160.{hpp,cpp}`
- C-ABI: `luxcpp/crypto/ripemd160/c-abi/ripemd160_capi.h`
- Library: `libripemd160.a`

### GPU kernels
- Metal:  `luxcpp/crypto/ripemd160/gpu/metal/ripemd160.metal` — batch hash for Bitcoin address derivation
- CUDA:   `luxcpp/crypto/ripemd160/gpu/cuda/ripemd160.cu`
- WGSL:   `luxcpp/crypto/ripemd160/gpu/wgsl/ripemd160.wgsl`

### Determinism
- CPU↔GPU byte-equality on N=1000 random inputs; PASS.

## Test oracle
- RIPEMD-160 official reference (Dobbertin-Bosselaers-Preneel)
- OpenSSL `EVP_ripemd160` (test-only)

## Security
- Collision resistance is theoretically ≈ 80-bit; practical attacks beyond a 1996 paper analysis remain absent for the full hash.
- **Not recommended** for new applications — kept for Bitcoin compatibility (P2PKH) and EIP-2 precompile.
- New deployments should use BLAKE3 (LP-126) or SHA-256 (LP-148).

## References
- Dobbertin, Bosselaers, Preneel, "RIPEMD-160: A Strengthened Version of RIPEMD" (1996)
- EIP-2 precompile at `0x03`
- LP-137 (umbrella)
