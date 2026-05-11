---
lp: 173
title: TxAuthEnvelope (Lux mirror of HIP-0086)
tags: [pq, ml-dsa, tx-auth, envelope, tuple-hash, mirror, hip-0086]
description: Lux-side mirror of Hanzo HIP-0086. Pins the typed PQ transaction-signing envelope under LUX_STRICT_PQ. ML-DSA-65 signature over a TupleHash256 transcript bound by cust string TX-AUTH-V1; verifier is unmodified FIPS 204. Heavy spec lives in HIP-0086.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0086
created: 2026-05-11
requires:
  - LP-070 (ML-DSA)
  - LP-149 (SHA-3 / Keccak primitive)
  - LP-172 (Wallet PQ Account Type)
references:
  - LP-168 (Mesh Identity)
  - LP-170 (Q-Chain mirror)
---

# LP-173: TxAuthEnvelope

## Abstract

LP-173 mirrors HIP-0086 into Lux. Every Lux strict-PQ transaction
is signed via a `TxAuthEnvelope` whose transcript is built using
TupleHash256 (SP 800-185) with cust string `TX-AUTH-V1` over
`(profile_id, chain_id, account_id, nonce, payload_hash,
identity_scheme_id, hash_suite_id)`. Signature is ML-DSA-65; the
verifier is unmodified FIPS 204 `ML-DSA.Verify`.

## Mirrored profile

```
ProfileID:           0x01  (ProfileLuxStrictPQ)
ProfileName:         LUX_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
FinalitySchemeID:    PULSAR_M_65              (0x52)
HighValueSchemeID:   PULSAR_M_87              (0x53)
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

- `luxfi/consensus/protocol/auth/tx_envelope.go` is the canonical
  encoder/decoder. `luxfi/wallet/pq/tx.go` provides the signing
  helpers.
- Lux mainnet acceptance rule: a transaction lacking a valid
  `TxAuthEnvelope` is rejected at mempool admission. There is no
  fallback to secp256k1 RLP on `LUX_STRICT_PQ`.
- Transcript cust string `TX-AUTH-V1` is domain-separated from
  HIP-0079 Q-Block (`PULSAR-M-Q-BLOCK-V1`) and HIP-0087 permit
  (`PERMIT-V1`).
- KAT vectors: `luxfi/consensus/protocol/auth/testdata/tx_envelope_v1.json`.

## Compliance

A Lux validator on `LUX_STRICT_PQ` MUST refuse transactions that do
not carry a valid `TxAuthEnvelope`. Permissive profiles (0x02) may
accept both during operator-controlled transitions.

## References

- HIP-0086 — canonical source of truth.
- LP-070 — ML-DSA primitive.
- LP-149 — SHA-3 / Keccak primitive.
- LP-172 — AccountID.
- `luxfi/consensus/protocol/auth/tx_envelope.go`.
- NIST FIPS 204, FIPS 202, SP 800-185.
