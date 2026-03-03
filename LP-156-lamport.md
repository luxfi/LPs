---
lp: 156
title: Lamport One-Time Signatures
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Lamport one-time signatures (Lamport 1979) — hash-based signature secure against quantum adversaries. Building block for SLH-DSA (LP-071) Merkle tree leaves and for Lux's emergency post-quantum break-glass signing path. Per-bit hash preimage reveal.

## Specification

### Parameters
- Hash function: SHA-256 (LP-148) — digest length `n = 256`
- Message length: 256 bits (post-hash with SHA-256)
- Public key: `2 × n × n` bits = 2 × 256 × 32 = 16,384 bytes
- Private key: same size, sampled uniform random
- Signature: `n` × `n` bits = 256 × 32 = 8,192 bytes

### Algorithm
- KeyGen: sample `2n` random `n`-bit secrets `(s_{i,0}, s_{i,1})_{i=0..n-1}`; PK is `(H(s_{i,0}), H(s_{i,1}))`
- Sign(m): for each bit `b_i` of `H(m)`, reveal `s_{i, b_i}`
- Verify(m, σ): hash each revealed `s_{i, b_i}`; check equality with PK at position `(i, b_i)`

### KAT
- Self-consistent KeyGen → Sign → Verify roundtrip PASS for N=1000 random keys
- `lux/crypto/lamport/test/kat.json`

## Implementation

### Go canonical
- `lux/crypto/lamport/` (first-party port)
- Module: `github.com/luxfi/crypto/lamport` @ `v1.18.3`

### C++ CPU canonical
- `luxcpp/crypto/lamport/cpp/lamport.{hpp,cpp}`
- C-ABI: `luxcpp/crypto/lamport/c-abi/lamport_capi.h`
- Library: `liblamport.a`

### GPU kernels
- Metal:  `luxcpp/crypto/lamport/gpu/metal/lamport.metal` — batch verify (8192-byte signatures, parallel hash chains)
- CUDA:   `luxcpp/crypto/lamport/gpu/cuda/lamport.cu`
- WGSL:   `luxcpp/crypto/lamport/gpu/wgsl/lamport.wgsl`

### Determinism
- CPU↔GPU byte-equality on N=1000 random {sign, verify} pairs; PASS.

## Test oracle
- Lamport 1979 paper specification (no canonical reference impl)
- Cross-check via internal SHA-256 KAT (LP-148) — Lamport correctness reduces to hash correctness

## Security
- **One-time only**: reusing a key on different messages reveals enough secret to forge — protocol layer must enforce (Merkle tree of one-time keys → LP-071 SLH-DSA)
- Quantum-secure: relies only on hash preimage resistance; Grover halves effective security to 128-bit on `n = 256`
- Constant-time per-bit reveal on CPU; GPU kernels independent per bit

## References
- Lamport, "Constructing digital signatures from a one-way function" SRI Tech Report CSL-98 (1979)
- LP-071 (SLH-DSA — uses Lamport as Merkle leaf primitive)
- LP-148 (SHA-256 — underlying hash)
- LP-137 (umbrella)
