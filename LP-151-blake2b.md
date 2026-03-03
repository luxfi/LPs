---
lp: 151
title: BLAKE2b
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

BLAKE2b — RFC 7693 keyed/unkeyed hash with variable output (1..64 bytes). Faster than SHA-2/3 in software; used by EIP-152 EVM precompile (`0x09`) for the Equihash F-compression and by Lux's checkpoint anchor. First-party C++ + GPU kernels.

## Specification

### Parameters
- State: 8 × 64-bit words
- Block size: 128 bytes
- Variable digest length: 1..64 bytes (this LP fixes 32 and 64 byte variants)
- 12 rounds (BLAKE2b; vs 10 for BLAKE2s)
- Initial vector IV from RFC 7693 §2.6 (SHA-512 IV)

### Algorithm
- Mix function `G` over 64-bit lanes
- Sigma permutation σ₀..σ₁₁ per RFC 7693 §2.7
- Final block flag `f` set on the last compression call

### KAT
- RFC 7693 Appendix E vectors (unkeyed) PASS
- EIP-152 F-compression vectors PASS
- `lux/crypto/blake2b/test/kat.json`

## Implementation

### Go canonical
- `lux/crypto/blake2b/` (wraps `golang.org/x/crypto/blake2b`)
- Module: `github.com/luxfi/crypto/blake2b` @ `v1.18.3`

### C++ CPU canonical
- `luxcpp/crypto/blake2b/cpp/blake2b.{hpp,cpp}` — first-party G mix + sigma table
- C-ABI: `luxcpp/crypto/blake2b/c-abi/blake2b_capi.h`
- Library: `libblake2b.a`

### GPU kernels
- Metal:  `luxcpp/crypto/blake2b/gpu/metal/blake2b.metal` — batch hash, EIP-152 F-compress kernel
- CUDA:   `luxcpp/crypto/blake2b/gpu/cuda/blake2b.cu`
- WGSL:   `luxcpp/crypto/blake2b/gpu/wgsl/blake2b.wgsl`

### Determinism
- CPU↔GPU byte-equality on N=1000 random inputs; PASS.

## Test oracle
- `BLAKE2/BLAKE2` reference repo (Aumasson, Saarinen, Neves, Wilcox-O'Hearn) — test-only
- RFC 7693 Appendix E

## Security
- Collision resistance 256-bit (BLAKE2b-512), 128-bit (BLAKE2b-256).
- Constant-time on CPU; GPU kernels independent per block.
- BLAKE2b-keyed mode supports MAC use; in Lux we currently use HMAC-SHA256 (LP-148) for that purpose.

## References
- RFC 7693 (BLAKE2 Hash and HMAC)
- EIP-152 (BLAKE2b F-compression precompile)
- Aumasson et al. "BLAKE2: simpler, smaller, fast as MD5" (2013)
- LP-126 (BLAKE3 — successor; preferred for new deployments)
- LP-137 (umbrella)
