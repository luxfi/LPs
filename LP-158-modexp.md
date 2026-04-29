---
lp: 158
title: modexp — Big-Integer Modular Exponentiation
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

EIP-198 EVM precompile (`0x05`) — arbitrary-precision modular exponentiation `b^e mod m`. Used by RSA verifiers, BLS12-381 (LP-075) cofactor clearing, and proof-of-work alternative chains. First-party Go + C++ CPU body using intx (luxcpp fork); Metal kernel for batched verifier MSM; CUDA/WGSL deferred (low hot-path priority).

## Specification

### Parameters
- Precompile address: `0x05`
- Input: `(B_len, E_len, M_len, B, E, M)` — 32-byte length prefixes followed by big-endian byte strings
- Output: `B^E mod M`, encoded as big-endian byte string of length `M_len`
- Gas: per EIP-2565 (Berlin) `gas = max(200, mult_complexity * iter_count / G_QUADDIVISOR)` where `G_QUADDIVISOR = 3`

### Algorithm
- Sliding-window exponentiation with Montgomery REDC for odd modulus
- For even modulus, fall back to schoolbook exp + barrett reduction
- Branchless conditional swap to mitigate side-channel on secret-key paths (RSA)

### KAT
- EIP-198 / EIP-2565 reference vectors PASS
- Wycheproof RSA-OAEP, RSA-PKCS1 vectors PASS (transitive correctness)
- `lux/crypto/modexp/test/kat.json`

## Implementation

### Go canonical
- `lux/crypto/modexp/` (uses `math/big` + Montgomery wrapper)
- Module: `github.com/luxfi/crypto/modexp` @ `v1.18.3`

### C++ CPU canonical
- `luxcpp/crypto/modexp/cpp/modexp.{hpp,cpp}` (uses `intx` fork at `luxcpp/intx@v0.15.1`)
- C-ABI: `luxcpp/crypto/modexp/c-abi/modexp_capi.h`
- Library: `libmodexp.a`

### GPU kernels
- Metal:  `luxcpp/crypto/modexp/gpu/metal/modexp.metal` — batched modexp for BLS12-381 cofactor clearing (LP-075 hot path)
- CUDA:   *(scaffold pending — low priority, verifier batches dominated by pairing not modexp)*
- WGSL:   *(scaffold pending)*

### Determinism
- CPU↔GPU byte-equality on N=1000 random `(B, E, M)` tuples with `M_len` ∈ {32, 96, 256, 512, 1024}; PASS.

## Test oracle
- Ethereum execution-spec-tests EIP-198/2565 vectors
- libgmp `mpz_powm` (test-only, FetchContent)

## Security
- Constant-time only on the secret-key-exponent path — public exponent path can use windowed sliding (faster) since `E` is public
- Gas-metered to prevent DOS on large `M_len`
- Big-integer arithmetic from `intx` is audited (Ethereum Foundation upstream)

## References
- EIP-198 (Byzantium modexp precompile)
- EIP-2565 (Berlin gas-cost re-pricing)
- Hankerson, Menezes, Vanstone, "Guide to Elliptic Curve Cryptography" §2.1 (modular exponentiation)
- LP-075 (BLS12-381 — uses modexp for cofactor clearing)
- LP-137 (umbrella)
