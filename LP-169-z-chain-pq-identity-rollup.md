---
lp: 169
title: Z-Chain — Post-Quantum Identity & Attestation Rollup (Lux mirror of HIP-0078)
tags: [pq, z-chain, stark, fri, sha3, ml-dsa, identity-rollup, mirror, hip-0078]
description: Lux-side mirror of Hanzo HIP-0078. Pins Z-Chain as the Lux PQ identity / DKG-transcript / attestation rollup under the canonical LUX_STRICT_PQ profile. STARK / FRI / SHA-3 only; Groth16 / BN254 and KZG are explicit refusal markers on the Lux wire. Heavy spec lives in HIP-0078.
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0078
created: 2026-05-10
requires:
  - LP-020 (Quasar Consensus)
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar)
  - LP-168 (Mesh Identity / Gossip / Payments mirror)
  - LP-170 (Q-Chain Finality Blocks)
  - LP-171 (Pulsar-M DKG)
---

# LP-169: Z-Chain — Post-Quantum Identity & Attestation Rollup

## Abstract

LP-169 mirrors Hanzo HIP-0078 into Lux. Z-Chain is the **identity
rollup** for the Lux primary network: validator registry, ML-DSA-65
pubkey commitments, revocation set, stake weights, DKG transcripts,
and committee selection state, all proven by STARK / FRI over a
SHA-3 (cSHAKE256) Merkle commitment. Pairing-based proof systems
(Groth16 / BN254, KZG) are **forbidden** on the Lux wire — the
strict-PQ verifier refuses any cert whose `proof_system_id` maps to
`0x80` or `0x81`.

Z-Chain is the identity layer. Q-Chain (LP-170) is the finality
layer. Pulsar-M (LP-171) is the threshold-signing primitive Q-Chain
consumes. ML-DSA-65 identity material does **not** enter every
finality block; Z-Chain holds the bulky state and Q-Chain references
its roots by hash.

## Mirrored profile

This LP locks Z-Chain to the canonical `LUX_STRICT_PQ` profile:

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

Resolve at runtime via `config.ProfileByID(config.ProfileLuxStrictPQ)`;
the profile hash is pinned at Lux mainnet genesis. Z-Chain proofs that
do not match the configured `ProofPolicyID` are refused before
signature verification, not silently downgraded.

## Lux-specific bindings

- **EpochCommitment** records (per HIP-0078) post to Z-Chain via the
  `chains/zchain` VM in `luxfi/node`. Each commitment binds
  `hash_suite_id = 0x01`, `sig_scheme_id ∈ {0x52, 0x53}`, and
  `proof_system_id = 0x10`.
- **Reference prover** lives at `luxfi/plonky3-pq` — a Plonky3 fork
  with cSHAKE256 Merkle + Fiat-Shamir. Strict-PQ deployments MUST
  wrap the verifier with malformed-proof fuzzing before mainnet
  activation.
- **Anchor.** Q-Chain finality (LP-170) MUST anchor to the latest
  accepted Z-Chain `EpochCommitment` — every Q-Block's
  `zchain_state_root`, `validator_set_root`, `committee_root`,
  `dkg_transcript_root`, and `group_public_key_hash` equal the
  corresponding fields in the EpochCommitment for that epoch.
- **Out of v1.** Per-block threshold-signing transcripts. Pulsar-M
  threshold sigs verify directly at Q-Chain via unmodified FIPS 204
  ML-DSA.Verify; their soundness does not require a Z-Chain proof.

## Compliance

A Lux validator MUST refuse any `EpochCommitment` whose
`proof_system_id` is `0x80 GROTH16_BN254_CLASSICAL_FORBIDDEN_IN_PQ` or
`0x81 KZG_CLASSICAL_FORBIDDEN_IN_PQ`, and MUST refuse any non-strict
backend on the Lux primary network. The forbidden markers exist on
the wire so a misconfigured operator is named, not silently accepted.

End-to-end security level on the Lux primary network is bounded by
`min(Pulsar-M-65 parameters, Z-Chain proof configuration)`. Z-Chain
prover parameters MUST achieve ≥ 128-bit classical and ≥ NIST PQ
Cat 3 to match LP-171.

## References

- HIP-0078 — canonical spec.
- LP-168 / LP-170 / LP-171 — sibling mirrors.
- `luxfi/consensus/config/profiles.go` — locked profile.
- `luxfi/plonky3-pq` — strict-PQ prover (planned).
