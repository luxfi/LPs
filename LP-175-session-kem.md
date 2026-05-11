---
lp: 175
title: Session KEM (Lux mirror of HIP-0088)
tags: [pq, ml-kem, kem, session, handshake, zap, mirror, hip-0088]
description: Lux-side mirror of Hanzo HIP-0088. Locks ML-KEM-768 (default) and ML-KEM-1024 (high-value) as the PQ session KEM under LUX_STRICT_PQ. X-Wing refused. KMAC256 KDF over TupleHash256 transcript. Heavy spec lives in HIP-0088.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Networking
network: Lux primary network
mirrors: HIP-0088
created: 2026-05-11
requires:
  - LP-022 (ZAP wire protocol)
  - LP-070 (ML-DSA)
  - LP-072 (ML-KEM)
references:
  - LP-115 (X-Wing — refused under strict-PQ)
  - LP-168 (Mesh Identity mirror)
---

# LP-175: Session KEM

## Abstract

LP-175 mirrors HIP-0088 into Lux. The Lux ZAP handshake under
`LUX_STRICT_PQ` performs an `ML-KEM-768` (FIPS 203 NIST PQ Cat 3,
default) or `ML-KEM-1024` (Cat 5, high-value) encapsulation, with
mutual ML-DSA-65 signatures over the handshake transcript. The derived
shared secret is run through KMAC256 (SP 800-185) to produce a 256-bit
AEAD key.

## Mirrored profile

```
ProfileID:           0x01  (ProfileLuxStrictPQ)
ProfileName:         LUX_STRICT_PQ
HashSuiteID:         SHA3_NIST                (0x01)
IdentitySchemeID:    ML_DSA_65                (0x42)
KEMSchemeIDDefault:  ML_KEM_768               (0x60)
KEMSchemeIDHighValue: ML_KEM_1024             (0x61)
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

- `luxfi/consensus/protocol/auth/session_kem.go` is the canonical
  reference. `luxfi/zap/handshake.go` consumes it.
- ML-KEM primitive: `luxfi/crypto/mlkem`. ML-DSA primitive:
  `luxfi/crypto/mldsa`.
- Lux validator-to-validator gossip on `LUX_STRICT_PQ` MUST use
  ML-KEM-768 minimum; high-value mesh roles (bridge, governance MPC)
  use ML-KEM-1024.
- Session key rotation: 1 hour or 2^28 records.
- LP-115 X-Wing is refused under `LUX_STRICT_PQ`; it is available only
  on permissive profiles for legacy interop.
- KAT vectors: `luxfi/consensus/protocol/auth/testdata/session_kem_v1.json`.

## Compliance

A Lux node on `LUX_STRICT_PQ` MUST NOT negotiate X25519, ECDH, or
X-Wing. The KEM scheme byte is bound into the handshake transcript and
into the AEAD-key derivation; substitution is detected at the
TupleHash256 binding step.

## References

- HIP-0088 — canonical source of truth.
- LP-022 — ZAP wire baseline.
- LP-072 — ML-KEM primitive.
- LP-115 — X-Wing (refused under strict-PQ).
- NIST FIPS 203, FIPS 204, FIPS 202, SP 800-185, SP 800-57.
- `luxfi/consensus/protocol/auth/session_kem.go`.
