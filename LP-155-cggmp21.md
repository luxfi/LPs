---
lp: 155
title: CGGMP21 Threshold ECDSA
status: Draft
category: Cryptography
created: 2026-04-28
---

## Abstract

CGGMP21 (Canetti-Gennaro-Goldfeder-Makriyannis-Peled 2021) — threshold ECDSA with non-interactive presigning + identifiable abort. Used by Lux M-Chain MPC custody (LP-019) over secp256k1 (LP-147) for institutional Bitcoin/EVM signing. Replaces older GG18/GG20 with stronger security model.

## Specification

### Parameters
- Curve: secp256k1 (LP-147), generator `G`, order `n`
- Threshold (t, n)
- Paillier modulus: 2048-bit per signer for sigma-protocols
- Range proofs: Π^enc, Π^aff-g, Π^log-star (per CGGMP21)

### Phases
1. **Key generation**: distributed Paillier keygen + ECDSA share VSS
2. **Auxiliary info**: per-signer Paillier auxiliary parameters (one-time)
3. **Pre-signing** (offline): produce randomized presignature `(R, k_i, χ_i)` non-interactively
4. **Online signing**: combine presignature + message hash to emit canonical `(r, s)`
5. **Identifiable abort**: any malicious behavior identified and excluded

### KAT
- CGGMP21 reference test vectors from the paper (online-only) PASS
- Live signing parity with reference impl `ZenGo-X/multi-party-ecdsa`-tr (test only) — *(integration pending)*

## Implementation

### Go canonical
- `lux/crypto/cggmp21/` *(prototype)*
- Module: `github.com/luxfi/crypto/cggmp21` *(pending publish)*

### C++ CPU canonical
- *(no cpp/ dir in luxcpp/crypto/cggmp21 — c-abi only; CPU body deferred)*
- C-ABI: `luxcpp/crypto/cggmp21/c-abi/cggmp21_capi.h` (NOTIMPL stubs)
- Library: `libcggmp21.a` *(NOTIMPL)*

### GPU kernels
- Metal:  `luxcpp/crypto/cggmp21/gpu/metal/cggmp21.metal` — batch range-proof kernel (Π^enc / Π^aff-g)
- CUDA:   `luxcpp/crypto/cggmp21/gpu/cuda/cggmp21.cu`
- WGSL:   `luxcpp/crypto/cggmp21/gpu/wgsl/cggmp21.wgsl`

Note: GPU helps presigning (range-proof MSM) but online signing is bandwidth/latency-bound.

### Determinism
- KAT cross-check (offline) primary gate. CPU↔GPU byte-equality once cpp/ body lands.

## Test oracle
- `ZenGo-X/multi-party-ecdsa` (Rust, GG20 baseline) — *(GG20, not CGGMP21; partial)*
- `webb-tools/dkg-substrate` CGGMP21 fork — *(monitor for upstream stable release)*

## Security
- **UC-secure** under Paillier + DDH assumptions (Canetti UC framework)
- Identifiable abort: deviations attributable to specific signer
- Prefer pre-signed nonces stored in HSM (LP-062) to mitigate online compromise

## References
- Canetti, Gennaro, Goldfeder, Makriyannis, Peled, "UC Non-Interactive, Proactive, Threshold ECDSA with Identifiable Aborts" CCS 2020
- LP-019 (Threshold MPC for bridge signing)
- LP-062 (HSM key management — presignature storage)
- LP-076 (Threshold framework)
- LP-137 (umbrella)
