---
lp: 172
title: Wallet PQ Account Type (Lux mirror of HIP-0085)
tags: [pq, ml-dsa, wallet, account, hd-derivation, mirror, hip-0085]
description: Lux-side mirror of Hanzo HIP-0085. Adopts the 48-byte ML-DSA-65-derived AccountID and BIP-32 path m/44'/9000'/nid'/0/n under the canonical LUX_STRICT_PQ profile. Heavy spec lives in HIP-0085; this LP pins the luxfi/* package surface.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0085
created: 2026-05-11
requires:
  - LP-070 (ML-DSA)
  - LP-168 (Mesh Identity mirror)
  - LP-169 (Z-Chain mirror)
references:
  - LP-170 (Q-Chain mirror)
  - LP-173 (TxAuthEnvelope mirror)
---

# LP-172: Wallet PQ Account Type

## Abstract

LP-172 mirrors Hanzo HIP-0085 into Lux. The native PQ wallet account
on Lux is identified by a 48-byte `AccountID` derived as
`SHA3-384("LUX-ACCOUNT-V1" || mldsa_pubkey)`. HD derivation follows
the canonical Lux path `m/44'/9000'/nid'/0/n`. A 20-byte EVM-compat
address is emitted by the EVM adapter only as a read-side projection;
settlement is keyed by AccountID.

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

Resolved via `config.ProfileByID(config.ProfileLuxStrictPQ)`.

## Lux-specific bindings

- `luxfi/wallet/pq/account.go` is the canonical wallet binding; reuses
  `luxfi/crypto/mldsa` for keygen and `luxfi/consensus/protocol/auth`
  for the AccountID derivation function.
- Slip-44 9000 retained; `nid'` is the Lux network id.
- KAT vectors: `luxfi/consensus/protocol/auth/testdata/account_v1.json`.

## Compliance

A Lux wallet on `LUX_STRICT_PQ` MUST NOT use the 20-byte EVM-form
address as the primary identifier; the 48-byte AccountID is primary.
The EVM-form projection is emitted for indexing and RPC read paths
only.

## References

- HIP-0085 — canonical source of truth.
- LP-070 — ML-DSA primitive.
- LP-168 / LP-169 — mesh identity and Z-Chain mirrors.
- `luxfi/consensus/protocol/auth/account.go`.
- NIST FIPS 204, FIPS 202, SP 800-185, SP 800-57.
