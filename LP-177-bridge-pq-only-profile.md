---
lp: 177
title: Bridge PQ-Only Profile (Lux mirror of HIP-0103)
tags: [pq, bridge, profile, strict-pq, mirror, hip-0103]
description: Lux-side mirror of Hanzo HIP-0103. Bridge contracts under LUX_STRICT_PQ refuse all inbound state that is not finalised under a strict-PQ profile, with field-byte equality on the counterparty profile and Pulsar-M-65 verification. Heavy spec lives in HIP-0103.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Infrastructure
network: Lux primary network
mirrors: HIP-0103
created: 2026-05-11
requires:
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar)
  - LP-170 (Q-Chain mirror)
  - LP-171 (Pulsar-M DKG)
  - LP-178 (Governance / Upgrade Keys)
references:
  - LP-017 (Native bridge programs — classical, refused under strict-PQ)
---

# LP-177: Bridge PQ-Only Profile

## Abstract

LP-177 mirrors HIP-0103 into Lux. Lux bridge contracts running under
`LUX_STRICT_PQ` refuse any inbound state root that does not carry a
strict-PQ profile byte (`0x01`, `0x04`, `0x05`) and pass a
field-byte-equality check on the counterparty's canonical profile
fields. Counterparty finality is verified by checking a Pulsar-M-65
threshold ML-DSA-65 signature (FIPS 204) over a remote Q-Chain block
transcript (LP-170 / HIP-0079). High-value transfers above the
per-asset cap require a HIP-0098 / LP-178 governance authorisation
signed by Pulsar-M-87.

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

- `luxfi/consensus/protocol/auth/bridge_profile.go` is the canonical
  reference. Existing bridge programs under LP-017 are extended with
  the strict-PQ profile-equality precondition.
- High-value cap default: 100,000 LUX. Above-cap inbound transfers
  REQUIRE the LP-178 governance-auth path.
- Counterparty `group_public_key_hash` is pinned at first bridge sync;
  committee substitution requires explicit governance rotation.
- KAT vectors: `luxfi/consensus/protocol/auth/testdata/bridge_profile_v1.json`.

## Compliance

A Lux bridge instance on `LUX_STRICT_PQ` MUST refuse any inbound
state whose `counterparty_profile` is not in `{0x01, 0x04, 0x05}` or
whose canonical fields disagree byte-for-byte with the strict-PQ
template. Operators that need to bridge to a permissive-profile chain
MUST run a separate bridge instance under profile `0x02`, isolated
from the strict-PQ side.

## References

- HIP-0103 — canonical source of truth.
- LP-017 — classical bridge programs (refused under strict-PQ).
- LP-170, LP-171 — Q-Chain, Pulsar-M.
- LP-178 — governance-auth for high-value transfers.
- NIST FIPS 204, FIPS 202, SP 800-185.
- `luxfi/consensus/protocol/auth/bridge_profile.go`.
