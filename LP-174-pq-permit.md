---
lp: 174
title: PQ Permit (Lux mirror of HIP-0087)
tags: [pq, ml-dsa, permit, eip-2612, mirror, hip-0087]
description: Lux-side mirror of Hanzo HIP-0087. ML-DSA-65 typed-data permit replacing EIP-2612 for ERC-20-style approvals under LUX_STRICT_PQ. TupleHash256 transcript bound by PERMIT-V1 cust string. Heavy spec lives in HIP-0087.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0087
created: 2026-05-11
requires:
  - LP-070 (ML-DSA)
  - LP-172 (Wallet PQ Account Type)
  - LP-173 (TxAuthEnvelope)
references:
  - LP-179 (Contract Auth via Z-Chain Proof)
---

# LP-174: PQ Permit

## Abstract

LP-174 mirrors HIP-0087 into Lux. The PQ Permit replaces EIP-2612 for
ERC-20-style off-chain approval flows on Lux under `LUX_STRICT_PQ`. A
permit is an ML-DSA-65 (FIPS 204) signature over a TupleHash256
(SP 800-185) transcript bound by the cust string `PERMIT-V1` and
committing to `(profile_id, chain_id, verifying_contract,
owner_account_id, spender_account_id, value, nonce, deadline)`.
Contracts verify via the precompile pair from LP-179.

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

- `luxfi/consensus/protocol/auth/permit.go` is the canonical
  reference. EVM-side precompile is wired in
  `luxfi/coreth/core/vm/contracts_pq.go`.
- Lux ERC-20 tokens migrating from EIP-2612 expose two methods during
  the permissive transition; on `LUX_STRICT_PQ` activation only the
  PQ Permit method is enabled.
- Per-owner nonce mirrors EIP-2612 to minimise contract migration
  surface.
- KAT vectors: `luxfi/consensus/protocol/auth/testdata/permit_v1.json`.

## Compliance

A Lux ERC-20 deployment on `LUX_STRICT_PQ` MUST refuse classical
EIP-2612 permits. The PQ Permit precompile path (LP-179) is the only
auth route.

## References

- EIP-2612 — superseded baseline.
- HIP-0087 — canonical source of truth.
- LP-172 — AccountID.
- LP-179 — contract-auth precompiles.
- NIST FIPS 204, FIPS 202, SP 800-185, SP 800-57.
- `luxfi/consensus/protocol/auth/permit.go`.
