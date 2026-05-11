---
lp: 176
title: DRBG / Randomness Beacon (Lux mirror of HIP-0089)
tags: [pq, drbg, randomness, beacon, sp-800-90a, mirror, hip-0089]
description: Lux-side mirror of Hanzo HIP-0089. Hash-DRBG over SHA3-384 per NIST SP 800-90A as the canonical randomness beacon under LUX_STRICT_PQ. QRNG entropy + Pulsar-M aggregation reseed each epoch. Heavy spec lives in HIP-0089.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0089
created: 2026-05-11
requires:
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar)
  - LP-149 (SHA-3)
references:
  - LP-131 (ECVRF — classical, refused under strict-PQ)
  - LP-170 (Q-Chain mirror)
  - LP-171 (Pulsar-M DKG)
---

# LP-176: DRBG / Randomness Beacon

## Abstract

LP-176 mirrors HIP-0089 into Lux. Under `LUX_STRICT_PQ` the randomness
beacon is a Hash-DRBG over SHA3-384 per NIST SP 800-90A Rev. 1
§10.1.1, reseeded each epoch from a HIP-0073 QRNG entropy source XORed
with a Pulsar-M (LP-171) aggregated contribution. The per-block beacon
output is bound into the Q-Block transcript (LP-170) and signed by the
Pulsar-M-65 finality cert.

## Mirrored profile

```
ProfileID:           0x01  (ProfileLuxStrictPQ)
ProfileName:         LUX_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
DRBGConstruction:    HASH_DRBG_SHA3_384       (0x90)
DRBGSecurityStrength: 256
ReseedCadence:       EPOCH_OR_2POW48
MinSoundnessBits:    128
MinHashOutputBits:   384
RequireTransparent:  true
ForbidPairings:      true
ForbidKZG:           true
ForbidClassicalSNARKs: true
ForbidFallbacks:     true
```

## Lux-specific bindings

- `luxfi/consensus/protocol/auth/beacon.go` is the canonical reference.
- QRNG source binding: `luxfi/qrng` adapter implementing the HIP-0073
  interface.
- Consumer cust strings:
    - `COMMITTEE-V1` — Pulsar-M committee selection (LP-171).
    - `LEADER-V1` — block-leader election.
    - `RNG-V1` — on-chain RNG opcode / contract-callable beacon.
- LP-131 ECVRF-Ed25519 is refused under `LUX_STRICT_PQ`. The classical
  VRF lives only on permissive profiles.
- KAT vectors: `luxfi/consensus/protocol/auth/testdata/hash_drbg_v1.json`.
  Generator passes NIST CAVP DRBGVS test vectors.

## Compliance

A Lux validator on `LUX_STRICT_PQ` MUST source on-chain randomness
from the Hash-DRBG beacon. Contracts calling `block.difficulty` /
RANDAO opcodes receive the PQ beacon output under the strict-PQ
profile.

## References

- HIP-0089 — canonical source of truth.
- NIST SP 800-90A Rev. 1, SP 800-90B.
- NIST FIPS 202 + SP 800-185.
- HIP-0073 — QRNG entropy source.
- LP-131 — ECVRF (refused under strict-PQ).
- LP-170, LP-171 — Q-Chain, Pulsar-M binding.
- `luxfi/consensus/protocol/auth/beacon.go`.
