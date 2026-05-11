---
lp: 179
title: Contract Auth via Z-Chain Proof (Lux mirror of HIP-0104)
tags: [pq, contract-auth, precompile, z-chain, mirror, hip-0104]
description: Lux-side mirror of Hanzo HIP-0104. Four precompiles at 0x0301..0x0304 (ML-DSA-65 / ML-DSA-87 / SLH-DSA / Z-Chain auth proof) provide the contract-side strict-PQ auth surface. Heavy spec lives in HIP-0104.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Infrastructure
network: Lux primary network
mirrors: HIP-0104
created: 2026-05-11
requires:
  - LP-070 (ML-DSA)
  - LP-169 (Z-Chain mirror)
  - LP-172 (Wallet PQ Account Type)
  - LP-173 (TxAuthEnvelope)
references:
  - LP-174 (PQ Permit)
---

# LP-179: Contract Auth via Z-Chain Proof

## Abstract

LP-179 mirrors HIP-0104 into Lux. Four precompiles expose the
strict-PQ contract-auth surface to EVM-compatible contracts on Lux:

- `0x0301` — `pq_verify_mldsa65`, FIPS 204 ML-DSA-65 verify.
- `0x0302` — `pq_verify_mldsa87`, FIPS 204 ML-DSA-87 verify (high-value).
- `0x0303` — `pq_verify_slh_dsa`, FIPS 205 SLH-DSA verify (hash-based
  backstop).
- `0x0304` — `pq_verify_z_auth_proof`, STARK_FRI_SHA3_PQ proof verifier
  from LP-169 / HIP-0078; returns the authenticated 48-byte `AccountID`
  and `verified_at_height`.

Each precompile returns `(bool ok, bytes payload)`. Contracts call
these via standard EVM `staticcall`. `ecrecover` is refused under
`LUX_STRICT_PQ`.

## Mirrored profile

```
ProfileID:           0x01  (ProfileLuxStrictPQ)
ProfileName:         LUX_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
ProofPolicyID:       STARK_FRI_SHA3_PQ        (0x10)
MinSoundnessBits:    128
MinHashOutputBits:   384
RequireTransparent:  true
ForbidPairings:      true
ForbidKZG:           true
ForbidTrustedSetup:  true
ForbidClassicalSNARKs: true
ForbidDevProofs:     true
ForbidFallbacks:     true
```

## Lux-specific bindings

- `luxfi/consensus/protocol/auth/precompile.go` is the canonical
  reference; four `PrecompileAddrPQVerify*` constants pin the EVM
  precompile addresses at 0x0301..0x0304.
- EVM-side binding: `luxfi/coreth/core/vm/contracts_pq.go`. Gas
  schedule lives there, not in consensus.
- `ecrecover` (address `0x01`) is refused under `LUX_STRICT_PQ`. The
  permissive profile (`0x02`) keeps `ecrecover` available for
  transition.
- KAT vectors: `luxfi/coreth/core/vm/testdata/precompile_pq_v1.json`.

## Compliance

A Lux EVM contract calling `ecrecover` under `LUX_STRICT_PQ` reverts
with `ErrEcrecoverRefused`. Contracts MUST migrate to one of
`staticcall(0x0301)` (ML-DSA-65 verify), `staticcall(0x0302)`
(ML-DSA-87), `staticcall(0x0303)` (SLH-DSA), or `staticcall(0x0304)`
(Z-Chain proof) before profile activation.

## References

- HIP-0104 — canonical source of truth.
- LP-070 — ML-DSA primitive.
- LP-169 — Z-Chain proof system.
- LP-172, LP-173, LP-174 — AccountID, TxAuthEnvelope, PQ Permit.
- NIST FIPS 204, FIPS 202, SP 800-185.
- `luxfi/consensus/protocol/auth/precompile.go`.
- `luxfi/coreth/core/vm/contracts_pq.go`.
