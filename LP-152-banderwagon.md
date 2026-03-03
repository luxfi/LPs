---
lp: 152
title: Banderwagon (Bandersnatch Prime-Order Quotient)
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Banderwagon: prime-order quotient group over Bandersnatch curve. Used as the canonical group for Verkle Trees (LP-026) IPA Bulletproofs (LP-153) and Lux Pedersen vector commitments (LP-119). Provides `Element` type with 47-byte canonical serialization, full Fp/Fr Montgomery arithmetic, and Pippenger MSM. First-party Go + C++ CPU + Metal/CUDA/WGSL GPU.

## Specification

### Parameters
- Bandersnatch base curve: twisted Edwards over BLS12-381 scalar field Fr
- `a = -5`, `d = (138827208126141220649022263972958607803/171449701953573178309673572579671231137)` (per Hopwood spec)
- Subgroup order `r_bw = 13108968793781547619861935127046491459309155893440570251786403306729687672801`
- Cofactor 4; Banderwagon = curve / {±1, ±E}
- Encoded length: 47 bytes (compressed Element)

### Algorithm
- Element ops: add, double, scalar_mul, MSM (Pippenger windowed)
- Fr ops: Montgomery REDC, modular inverse via addition-chain `r_bw - 2`
- Fp = base curve Fr (= BLS12-381 scalar field)

### KAT
- 16 Element ops + 16 serde KAT vectors, byte-equal go-ipa
- `lux/crypto/banderwagon/test/kat_*.json`

## Implementation

### Go canonical
- `lux/crypto/banderwagon/{fp,fr,element,msm}.go` — first-party (vanilla, drops go-ipa re-export)
- Module: `github.com/luxfi/crypto/banderwagon` @ `v1.18.3`

### C++ CPU canonical
- `luxcpp/crypto/banderwagon/cpp/{fp,fr,element,msm}.{hpp,cpp}` — first-party Bandersnatch Fp/Fr Montgomery + Element
- C-ABI: `luxcpp/crypto/banderwagon/c-abi/banderwagon_capi.h`
- Library: `libbanderwagon.a`

### GPU kernels
- Metal:  `luxcpp/crypto/banderwagon/gpu/metal/banderwagon.metal` — Element add/double/scalar_mul + Pippenger MSM
- CUDA:   `luxcpp/crypto/banderwagon/gpu/cuda/banderwagon.cu`
- WGSL:   `luxcpp/crypto/banderwagon/gpu/wgsl/banderwagon.wgsl`

### Determinism
- CPU↔GPU byte-equality on N=1000 random Element ops + MSM(k=64..4096); PASS.

## Test oracle
- `crate-crypto/go-ipa` (vendored as test oracle; never linked into `libbanderwagon.a`)
- arkworks-rs/banderwagon (independent oracle; second KAT generator)

## Security
- Prime-order group (cofactor cleared by quotient construction) — no small-subgroup attack surface.
- MSM is variable-time (Pippenger); IPA prover-side callers must use `MultiExpBlinded` (multiplicative scalar blinding) to suppress timing leak — see LP-153.
- Constant-time Element add/double for verifier-side ops.

## References
- Hopwood, "Bandersnatch: a Twisted Edwards curve over the BLS12-381 scalar field" (2021)
- Sinha, Buterin, Hopwood, "Bandersnatch and Banderwagon: prime-order representation" (2022)
- LP-026 (Verkle Trees — primary consumer)
- LP-153 (IPA Bulletproofs — uses Banderwagon as commitment group)
- LP-119 (Pedersen Hash — uses Banderwagon Element)
- LP-137 (umbrella)
