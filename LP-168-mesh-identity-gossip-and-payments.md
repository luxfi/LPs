---
lp: 168
title: Mesh Identity, Gossip & Payments (PQ) — Lux mirror of HIP-0077
tags: [pq, ml-dsa, mesh, identity, gossip, payments, mirror, hip-0077]
description: Lux-side mirror of Hanzo HIP-0077. Adopts ML-DSA-65 mesh identity, Lux-consensus-backed gossip, and on-chain receipt payments under the canonical LUX_STRICT_PQ profile. Heavy spec lives in HIP-0077; this LP pins the Lux genesis, ProfileID, and luxfi/* package surface.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Networking
network: Lux primary network
mirrors: HIP-0077
created: 2026-05-10
requires:
  - LP-020 (Quasar Consensus)
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar)
  - LP-127 (Remote Attestation)
references:
  - LP-022 (ZAP wire protocol)
  - LP-169 (Z-Chain PQ Identity Rollup)
  - LP-170 (Q-Chain Finality Blocks)
  - LP-171 (Pulsar-M DKG)
---

# LP-168: Mesh Identity, Gossip & Payments (PQ)

## Abstract

LP-168 mirrors Hanzo HIP-0077 into Lux. Every Lux-attached device, MCP
endpoint, container, validator, and light client derives its keypair
from one HD mnemonic; the signing key is **ML-DSA-65** (FIPS 204), the
same primitive Lux consensus already uses for per-validator identity
(`luxfi/crypto/mldsa`, `luxfi/pulsar/sign`). The mDNS TXT record
carries the 20-byte ML-DSA address; the ZAP handshake
(`luxfi/consensus` `protocol/zap`) carries the full pubkey plus a
fresh signature over the server-supplied nonce; cross-LAN propagation
rides on the Lux consensus mesh under the canonical
`LUX_STRICT_PQ` profile. Payments settle on Lux as ML-DSA-signed
promise/receipt pairs.

**This LP does not redefine the protocol.** The wire format, key
derivation paths, gossip namespace shape, and receipt schema live in
HIP-0077. LP-168 pins the Lux-side facts that HIP-0077 leaves to the
operator: the profile, the genesis allocation rule, the luxfi/*
package surface.

## Mirrored fields

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

Source of truth: `luxfi/consensus/config.LuxStrictPQProfile`; resolve
at runtime via `config.ProfileByID(config.ProfileLuxStrictPQ)`. The
profile hash is pinned at genesis and bound into every Q-Chain cert
(LP-170).

## Lux-specific bindings

- **Key derivation.** `m / 44' / 9000' / nid' / 0 / n` for ML-DSA
  identity, `m / 44' / 9000' / nid' / 1 / n` for the Lux account.
  SLIP-44 9000 is Lux. `nid' = 1' / 96369'` (mainnet) for the Lux
  primary network; tenant networks pin their own.
- **Auto-funding.** The first 200 device indices derived from
  `LIGHT_MNEMONIC` are pre-funded by `luxfi/genesis --hanzo-auto-fund`
  on dev networks (`nid >= 1337`) only; the Lux primary network MUST
  NOT pre-allocate from any public mnemonic.
- **Gossip namespace.** `lux/mesh/v1/<nid>/<org>` published over the
  Lux consensus subscription channel (`wave` deltas under the
  `field` driver). Records expire ≤ 5 min.
- **Packages.** Runtime bindings live at `luxfi/zap-identity`,
  `luxfi/zap-gossip`, `luxfi/zap-pay`. ML-DSA-65 primitive is reused
  from `luxfi/crypto/mldsa` — exactly one implementation in the tree.

## Compliance

A Lux node that consumes LP-168 MUST refuse ZAP handshakes from peers
whose advertised profile is not `ProfileLuxStrictPQ` or a strict
superset, and MUST refuse mesh gossip records whose `proof_system_id`
maps to a forbidden marker (`0x80 GROTH16_BN254_FORBIDDEN_IN_PQ`,
`0x81 KZG_FORBIDDEN_IN_PQ`).

## References

- HIP-0077 — canonical spec.
- LP-169 / LP-170 / LP-171 — Lux mirrors of HIP-0078 / 0079 / 0084.
- `luxfi/consensus/config/profiles.go` — `LuxStrictPQProfile` source.
