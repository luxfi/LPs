---
lp: 178
title: Governance / Upgrade Keys (Lux mirror of HIP-0098)
tags: [pq, governance, upgrade, ml-dsa-87, slh-dsa, mirror, hip-0098]
description: Lux-side mirror of Hanzo HIP-0098. Routine governance uses Pulsar-M-87 (threshold ML-DSA-87, FIPS 204). Cold-root upgrade keys use SLH-DSA-256s (FIPS 205) under k-of-n with k >= ceil(2n/3)+1. Heavy spec lives in HIP-0098.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0098
created: 2026-05-11
requires:
  - LP-070 (ML-DSA)
  - LP-071 (SLH-DSA)
  - LP-073 (Pulsar)
  - LP-171 (Pulsar-M DKG)
references:
  - LP-085 (DAO governance — classical, refused under strict-PQ)
  - LP-086 (Governor — classical, refused under strict-PQ)
---

# LP-178: Governance / Upgrade Keys

## Abstract

LP-178 mirrors HIP-0098 into Lux. Routine governance authorisations
(DAO proposals, parameter votes) are issued via Pulsar-M-87 threshold
ML-DSA-87 (FIPS 204, NIST PQ Cat 5). Cold-root upgrade authorisations
(genesis params, network upgrades, slashing-pause, emergency-stop) are
issued via SLH-DSA-256s (FIPS 205) under a `k-of-n` multi-signature
scheme with `k ≥ ⌈2n/3⌉ + 1` and `n ≥ 5` on Lux mainnet.

## Mirrored profile

```
ProfileID:           0x01  (ProfileLuxStrictPQ)
ProfileName:         LUX_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
GovernanceSchemeID:  ML_DSA_87                (0x43)
ColdRootSchemeID:    SLH_DSA_256S             (0x70)
FinalitySchemeID:    PULSAR_M_65              (0x52)
HighValueSchemeID:   PULSAR_M_87              (0x53)
MinSoundnessBits:    128
MinHashOutputBits:   384
RequireTransparent:  true
ForbidPairings:      true
ForbidKZG:           true
ForbidTrustedSetup:  true
ForbidClassicalSNARKs: true
ForbidFallbacks:     true
```

## Lux-specific bindings

- `luxfi/consensus/protocol/auth/governance.go` is the canonical
  reference.
- Warm governance MUST use Pulsar-M-87 threshold ML-DSA-87 (via
  LP-171's high-value mode). Single-party ML-DSA-87 is permitted for
  testnet only.
- Cold-root upgrade cadence: rotate at least every 4 years (matches
  SLH-DSA-256s long-lived key profile).
- Lux mainnet activation REQUIRES cold roots already registered in
  genesis; LP-085 / LP-086 classical governance is refused under
  `LUX_STRICT_PQ`.
- KAT vectors: `luxfi/consensus/protocol/auth/testdata/governance_v1.json`.

## Compliance

A Lux validator on `LUX_STRICT_PQ` MUST refuse any governance action
not authorised under LP-178's warm-or-cold path. The LP-085 / LP-086
classical contracts are not deployed on `LUX_STRICT_PQ`.

## References

- HIP-0098 — canonical source of truth.
- LP-070, LP-071, LP-073, LP-171 — primitive specs.
- LP-085, LP-086 — classical baseline (refused under strict-PQ).
- NIST FIPS 204, FIPS 205, FIPS 202, SP 800-185, SP 800-57.
- `luxfi/consensus/protocol/auth/governance.go`.
