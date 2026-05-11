---
lp: 170
title: Q-Chain — Quasar Finality Block Standard (Lux mirror of HIP-0079)
tags: [pq, q-chain, quasar, finality, pulsar-m, tuplehash256, mirror, hip-0079]
description: Lux-side mirror of Hanzo HIP-0079. Pins the compact finality-block wire format for the Quasar consensus engine on Lux. Single Pulsar-M-65 threshold sig per block; TupleHash256 transcript binding over 23 axes; Z-Chain roots anchored by hash. Heavy spec lives in HIP-0079.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Consensus
network: Lux primary network
mirrors: HIP-0079
created: 2026-05-10
requires:
  - LP-020 (Quasar Consensus)
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar)
  - LP-168 (Mesh Identity mirror)
  - LP-169 (Z-Chain PQ Identity Rollup mirror)
  - LP-171 (Pulsar-M DKG mirror)
---

# LP-170: Q-Chain — Quasar Finality Block Standard

## Abstract

LP-170 mirrors Hanzo HIP-0079 into Lux. Q-Chain is the **compact
finality-block log** for the Quasar consensus engine on the Lux
primary network. Each Q-Block carries a few hundred bytes of header +
roots (anchored to Z-Chain per LP-169) plus a single ~3.3 KB
Pulsar-M-65 threshold signature (LP-171). Per-block bandwidth is
O(1) in committee size; adding validators makes Z-Chain heavier,
not Q-Chain.

The full Q-Block wire schema, the canonical transcript-binding
function (TupleHash256 over 23 axes with customisation
`PULSAR-M-Q-BLOCK-V1`), and the 11-clause acceptance rule live in
HIP-0079. LP-170 pins the Lux-side facts: the production-default
parameters, the locked profile, and the luxfi/* implementation
surface.

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

Source: `luxfi/consensus/config.LuxStrictPQProfile`. The profile hash
is pinned at Lux mainnet genesis and bound into
`Certificate.TranscriptHash()` so a flipped byte breaks signature
verification, not just a string-equality check.

## Production defaults (Lux primary network)

| parameter            | value                          |
|----------------------|--------------------------------|
| `version`            | `0x0001`                       |
| `proof_system_id`    | `0x10` (STARK_FRI_SHA3_PQ)     |
| `hash_suite_id`      | `0x01` (SHA3_NIST)             |
| `sig_scheme_id`      | `0x52` (Pulsar-M-65)           |
| committee size `n`   | 64                             |
| BFT fault bound `f`  | 21                             |
| threshold `t`        | 43-of-64                       |
| epoch length         | network-configurable; start 1h |

High-value roots (governance, bridge, slashing checkpoints) MAY
upgrade `sig_scheme_id` to `0x53 Pulsar-M-87` for the duration of the
operation. Devnet / CI may use `0x51 Pulsar-M-44`; mainnet refuses
`0x51`.

## Lux-specific bindings

- **Wire encoder.** `luxfi/consensus/pkg/wire/qblock.go` implements
  the reference encoder/decoder and round-digest computation.
- **Driver.** `luxfi/consensus/protocol/quasar/` consumes Q-Blocks
  from `WitnessSet.Run` outputs.
- **VM.** Q-Chain VM lives at `luxfi/node/chains/quasarvm` (planned
  location); implements the 11-clause acceptance rule against the
  latest accepted Z-Chain `EpochCommitment` (LP-169).
- **Test vectors.** Acceptance, refusal-on-forbidden-proof-system,
  and transcript-binding KATs live at
  `luxfi/consensus/qblock-vectors/`.

## Compliance

A Lux node MUST reject any Q-Block whose `proof_system_id` is a
forbidden marker (`0x80` / `0x81`), whose `hash_suite_id` is not
`0x01 SHA3_NIST`, or whose `sig_scheme_id` is not in the configured
network allowlist. Rejection MUST happen before threshold-signature
verification.

A Q-Block carrying full validator ML-DSA-65 pubkeys, per-validator
ML-DSA signatures, full DKG ceremony messages, per-validator
attestation blobs, or non-epoch-boundary Z-Chain proof bytes
violates the spec and MUST be rejected — the wire format has no
field to hold them.

## References

- HIP-0079 — canonical spec.
- LP-168 / LP-169 / LP-171 — sibling mirrors.
- `luxfi/consensus/pkg/wire/qblock.go` — wire reference.
- `luxfi/consensus/protocol/quasar/round_digest.go` — transcript binding.
