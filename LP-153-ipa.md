---
lp: 153
title: IPA Bulletproofs (Inner Product Argument)
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Inner Product Argument (Bulletproofs §3) over Banderwagon (LP-152). Logarithmic-size proof of `<a, b> = c` for committed vectors. Underlies Verkle Trees (LP-026) state proofs and Lux confidential range proofs. First-party Go + C++ CPU body + Metal GPU MSM acceleration.

## Specification

### Parameters
- Group: Banderwagon (LP-152), 47-byte Element encoding
- Vector length: power of 2, up to 2¹⁶
- Transcript: Merlin (STROBE-128 over Keccak-f[1600])
- Challenges via Fiat-Shamir from transcript

### Algorithm
- Prover folds `a, b` vectors into halves with random challenge `x`
- log₂(n) rounds, each emits `L_i, R_i` Element commitments
- Final scalar `a_final, b_final` proves `<a, b>`
- Verifier batches `L_i, R_i` into MSM check `[c]G + Σ x_i² L_i + Σ x_i⁻² R_i == ...`

### KAT
- 64-element IPA proof KAT vector (standard test pattern, byte-equal go-ipa)
- `lux/crypto/ipa/test/kat.json`

## Implementation

### Go canonical
- `lux/crypto/ipa/{prover,verifier,transcript,multiexp_blinded}.go` — first-party
- Module: `github.com/luxfi/crypto/ipa` @ `v1.18.3`
- Includes `MultiExpBlinded` (~70 LOC) for prover-side multiplicative scalar blinding (mitigates Banderwagon variable-time MSM timing leak — see Red F1).

### C++ CPU canonical
- `luxcpp/crypto/ipa/cpp/{prover,verifier,transcript}.{hpp,cpp}`
- C-ABI: `luxcpp/crypto/ipa/c-abi/ipa_capi.h`
- Library: `libipa.a`

### GPU kernels
- Metal:  `luxcpp/crypto/ipa/gpu/metal/ipa.metal` — verifier MSM batch (Pippenger)
- CUDA:   *(scaffold pending — verifier-side MSM is the hot path; deferred)*
- WGSL:   *(scaffold pending)*

### Determinism
- CPU↔GPU byte-equality on N=100 random IPA verify with vector lengths {2¹⁰, 2¹², 2¹⁴}; PASS.

## Test oracle
- `crate-crypto/go-ipa` (vendored test-only; never linked into `libipa.a`)
- arkworks-rs/ipa (independent oracle for KAT cross-verification)

## Security
- Soundness via Fiat-Shamir from Merlin transcript (random oracle model)
- Prover-side MSM must use `MultiExpBlinded` to suppress timing-channel on secret scalars — bare `MultiExp` is OK for verifier-side which operates on public challenges only
- Banderwagon prime-order quotient eliminates small-subgroup attacks

## References
- Bünz et al., "Bulletproofs: Short Proofs for Confidential Transactions and More" (2018) §3
- Boneh, Bünz, Fisch, "A Survey of Two Verifiable Delay Functions" (transcript hashing)
- Merlin Transcripts spec (Henry de Valence)
- LP-152 (Banderwagon — commitment group)
- LP-026 (Verkle Trees — primary IPA consumer)
- LP-137 (umbrella)
