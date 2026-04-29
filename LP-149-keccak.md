---
lp: 149
title: Keccak-256 (Ethereum Hash)
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Keccak-256 (the original Keccak[1600] padding, **not** FIPS 202 SHA3-256 — they differ by one byte in the suffix). Used for every Ethereum-compatible address derivation, transaction hash, event topic, Merkle Patricia Trie node hash. Same sponge primitive as SHA3 but with `0x01` domain suffix instead of `0x06`.

## Specification

### Parameters
- Sponge construction Keccak[1600] with rate `r = 1088`, capacity `c = 512`
- 24 rounds (full Keccak-f[1600])
- Output: 256 bits (32 bytes)
- Padding suffix: `0x01` (Keccak; Ethereum legacy) — NOT `0x06` (FIPS 202 SHA3)

### Algorithm
- Round = θ ∘ ρ ∘ π ∘ χ ∘ ι, applied 24 times
- Round constants from FIPS 202 §3.2.5

### KAT
- Ethereum yellow-paper test vectors PASS
- `lux/crypto/keccak/test/kat.json` — vectors derived from `golang-sha3` legacy Keccak path
- Address derivation: `address = keccak256(pubkey)[12..32]` for ECDSA secp256k1 keys

## Implementation

### Go canonical
- `lux/crypto/keccak/` (uses `golang.org/x/crypto/sha3` `NewLegacyKeccak256`)
- Module: `github.com/luxfi/crypto/keccak` @ `v1.18.3`

### C++ CPU canonical
- `luxcpp/crypto/keccak/cpp/keccak.{hpp,cpp}` — first-party Keccak-f[1600] permutation
- C-ABI: `luxcpp/crypto/keccak/c-abi/keccak_capi.h`
- Library: `libkeccak.a`

### GPU kernels
- Metal:  `luxcpp/crypto/keccak/gpu/metal/keccak.metal` — batch hash + addr derivation, parallel rounds
- CUDA:   `luxcpp/crypto/keccak/gpu/cuda/keccak.cu`
- WGSL:   `luxcpp/crypto/keccak/gpu/wgsl/keccak.wgsl`

### Determinism
- CPU↔GPU byte-equality on N=1000 random inputs; PASS.

## Test oracle
- Ethereum yellow-paper Appendix J vectors
- `XKCP/keccak` reference (test-only, FetchContent)

## Security
- Sponge security ≈ min(r/2, c/2) = 256-bit collision resistance
- Constant-time (data-independent) on CPU; GPU kernels process independent absorb blocks
- **Critical**: never substitute SHA3-256 for Keccak-256 — Ethereum addresses computed with SHA3 will diverge from canonical addresses

## References
- Bertoni et al., "The Keccak SHA-3 submission" v3 (2011)
- Ethereum Yellow Paper Appendix J
- FIPS 202 (different from this LP — distinct domain suffix)
- LP-137 (umbrella)
