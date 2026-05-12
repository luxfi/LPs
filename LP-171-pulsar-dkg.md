---
lp: 171
title: Pulsar — Threshold ML-DSA DKG & Signing (Lux mirror of HIP-0084)
tags: [pq, pulsar, ml-dsa, threshold, dkg, mirror, hip-0084, nist-mptc]
description: Lux-side mirror of Hanzo HIP-0084. Pins Pulsar-65 as the threshold ML-DSA primitive consumed by Q-Chain finality. Epoch-cadence DKG, identifiable abort, no BLS fallback. Threshold-aggregated signature verifies under unmodified FIPS 204 ML-DSA.Verify. Heavy spec lives in HIP-0084 and the NIST MPTC submission package.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0084
created: 2026-05-10
requires:
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar)
  - LP-076 (Universal threshold framework)
  - LP-168 (Mesh Identity mirror)
  - LP-169 (Z-Chain mirror)
  - LP-170 (Q-Chain mirror)
---

# LP-171: Pulsar — Threshold ML-DSA DKG & Signing

## Abstract

LP-171 mirrors Hanzo HIP-0084 into Lux. Pulsar is the **threshold
ML-DSA primitive** consumed by Q-Chain finality (LP-170) on the Lux
primary network. It produces signatures byte-equal to single-party
FIPS 204 ML-DSA — the threshold-aggregated output verifies under
the unmodified FIPS 204 ML-DSA.Verify routine, with no Lux-specific
verifier extension and no BLS fallback path.

Pulsar targets NIST MPTC Class N1 (signing) + N4 (ML keygen /
DKG) per NIST IR 8214C. LP-171 is the **deployment contract**
between Q-Chain (consumer) and Pulsar (producer); the
cryptographic spec (protocol description, security games,
parameter sets) is the NIST MPTC submission package at
`luxfi/pulsar/spec/pulsar.tex`.

## Mirrored profile

```
ProfileID:           0x01  (ProfileLuxStrictPQ)
ProfileName:         LUX_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
FinalitySchemeID:    PULSAR_M_65              (0x52)
HighValueSchemeID:   PULSAR_M_87              (0x53)
ProofPolicyID:       STARK_FRI_SHA3_PQ        (0x10)
AllowedBackends:     SP1_COMPRESSED_STARK, RISC0_SUCCINCT_STARK,
                     P3Q_PLONKY3_STARK_FRI, STONE_CAIRO_STARK_CPP,
                     STWO_CIRCLE_STARK
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

## Production defaults (Lux primary network)

| parameter             | value                                |
|-----------------------|--------------------------------------|
| sig scheme            | `0x52 Pulsar-65` (NIST PQ Cat 3)   |
| hash family           | `0x01 SHA3_NIST`                     |
| committee size `n`    | 64                                   |
| BFT fault bound `f`   | 21                                   |
| threshold `t`         | 43                                   |
| corruption model      | honest majority at threshold layer   |
| DKG cadence           | once per epoch                       |
| epoch length          | network-configurable; default 1h     |
| online signing        | preprocessing-enabled                |
| abort handling        | identifiable abort, signed evidence  |

High-value roots use `0x53 Pulsar-87` (NIST PQ Cat 5). The Lux
primary network refuses `0x51 Pulsar-44`.

## Lux-specific bindings

- **Reference implementation.** `luxfi/pulsar/ref/go/` ships through
  Sign + Verify with KAT cross-validation against the FIPS 204
  reference. KAT freeze: 2026-08-31 encoding gate.
- **DKG flow.** DKG transcripts post to Z-Chain (LP-169) via the
  identity-registry path; participants are bound to
  `committee_root` per LP-170 clause 4 of the acceptance rule.
- **Group public key.** Output of Pulsar DKG is a valid FIPS 204
  ML-DSA-65 public key, indistinguishable from a single-party
  `ML-DSA.KeyGen` output under M-LWE. Bound into Q-Chain by
  `group_public_key_hash`.
- **Identifiable abort.** Complaints post to Z-Chain with
  ML-DSA-signed evidence. A valid complaint with quorum attribution
  slashes the deviating party's stake per the Lux slashing
  protocol.
- **Constant-time reshare.** F9 fix
  (`luxfi/pulsar/dkg2.constTimePolyEqual`) ports forward into
  Pulsar's reshare path; no-secret-logs CI gate enforced in
  `luxfi/pulsar`.

## Compliance

A Lux validator MUST NOT silently substitute raw ML-DSA-65 or
Corona for the Pulsar-65 production profile on the primary
network. The fallback profiles are explicit operator opt-ins gated
through `PQMode` selection (`mldsa` / `corona`) and refused by the
Lux mainnet acceptance rule.

A Pulsar ceremony whose participants do not match the
Z-Chain-anchored `committee_root` is rejected by Q-Chain acceptance
(LP-170 clause 4). A signature against a group key not in
`group_public_key_hash` is refused (clause 6).

## References

- HIP-0084 — canonical deployment contract.
- HIP-0078 / LP-169 — Z-Chain identity-rollup that anchors DKG
  transcripts + group keys.
- HIP-0079 / LP-170 — Q-Chain consumer of Pulsar signatures.
- `luxfi/pulsar/spec/pulsar.tex` — NIST MPTC submission package.
- NIST IR 8214C — First Call for Multi-Party Threshold Schemes.
- FIPS 204 — verification target.
