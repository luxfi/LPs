---
lp: 020
title: Quasar Consensus 3.0 — Cert Lanes + P/Q/Z Chain Pipeline
tags: [consensus, bls, ringtail, ml-dsa, groth16, triple-consensus, cert-lanes, p-chain, q-chain, z-chain, post-quantum, gpu]
description: Quasar 3.0 — three certificate lanes supplied by independent upstream chains (P-Chain stake, Q-Chain Ringtail DKG, Z-Chain Groth16 rollup), with a GPU-native adapter for execution-side certification (LP-132)
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2022-06-01
updated: 2025-12-15
requires:
  - lp-015 (Validator Key Management)
  - lp-070 (ML-DSA)
  - lp-073 (Ringtail)
  - lp-075 (BLS)
  - lp-022 (ZAP wire protocol)
references:
  - lp-1000 (Lux Consensus)
  - lp-1100 (Quasar Upgrade)
  - lp-010 (QuasarSTM)
  - lp-132 (QuasarGPU Execution Adapter)
supersedes:
  - lp-020-v2 (Quasar Consensus, 2022-06-01..2025-11-30)
---

# LP-020: Quasar Consensus 3.0 — Cert Lanes + P/Q/Z Chain Pipeline

## Abstract

Quasar 3.0 is Lux Network's triple-consensus protocol restated as a
**three-lane certificate pipeline**, fed by three independent upstream
chains and verified on a GPU-native execution adapter:

| Cert lane | Authority | Upstream | Wire-side artifact |
|---|---|---|---|
| **BLS** (classical fast path) | LP-075 | network-wide aggregation | 96-byte BLS12-381 G1 aggregate |
| **Ringtail** (PQ threshold) | LP-073 | **Q-Chain** Ring-LWE 2-round DKG ceremony | variable share |
| **MLDSAGroth16** (PQ identity rollup) | LP-070 + Z-Chain | **Z-Chain** Groth16 rollup of N validator ML-DSA-65 sigs | 192-byte proof + 32-byte public-inputs hash |

Plus the **P-Chain** as the stake/validator-set authority. So Quasar
3.0 is a **P + Q + Z chain pipeline** producing a single canonical
QuasarCert that the consensus engine emits and downstream verifiers
check.

The 2.0 wire format ("BLS aggregate + ~200-byte PQ proof") is preserved
as a special case of this lane model. 3.0 makes the lane structure
explicit, fixes the ABI so future PQ schemes don't break it, and binds
the cert subject to upstream chain roots so cross-epoch and
cross-chain replay become structurally impossible.

## What changed from 2.0

| Topic | 2.0 | 3.0 |
|---|---|---|
| ML-DSA verification | per-validator ML-DSA in cert | **Z-Chain Groth16 rollup** verified once per cert |
| Vote ingress | "raw votes" | **certificate ingress** — three lane shapes |
| Wire size | fixed 96-byte sig slot | **`(artifact_offset, artifact_len)` indirection** |
| Subject | block hash + roots | adds `pchain_validator_root`, `qchain_ceremony_root`, `zchain_vk_root` (replay-proof) |
| Signing-kind enum | `QuasarSigKind { BLS, Ringtail, MLDSA }` | **`QuasarCertLane { BLS, Ringtail, MLDSAGroth16 }`** |
| GPU interface | aspirational | **LP-132 QuasarGPU adapter** (concrete) |
| Stake/validator authority | implicit | **explicit P-Chain commitment** in subject |

## The P/Q/Z Chain Pipeline

```
   ┌───────────┐   stake / validator set commitment
   │  P-Chain  │ ───────────────────────────────────►
   └───────────┘                                      │
                                                      │
   ┌───────────┐   Ringtail DKG ceremony root         │
   │  Q-Chain  │ ───────────────────────────────────► ├──────► Quasar
   └───────────┘                                      │        Round
                                                      │        Descriptor
   ┌───────────┐   Groth16 verifying-key root         │
   │  Z-Chain  │ ───────────────────────────────────► │
   └───────────┘                                      │
                                                      │
                        ┌─────────────────────────────┴─────────────┐
                        │   QuasarRoundDescriptor                   │
                        │     pchain_validator_root[32]             │
                        │     qchain_ceremony_root[32]              │
                        │     zchain_vk_root[32]                    │
                        │     parent_block_hash[32]                 │
                        │     parent_state_root[32]                 │
                        │     parent_execution_root[32]             │
                        │     mode (Nova=0 / Nebula=1)              │
                        │     epoch, round, gas_limit, base_fee     │
                        │     certificate_subject[32] ← H(all above)│
                        └─────────────────────────────┬─────────────┘
                                                      │
                          executes / certifies         ▼
                        ┌────────────────────────────────────────┐
                        │   QuasarGPUEngine (LP-132)             │
                        │     EVM fibers + Block-STM (LP-010)    │
                        │     keccak roots                       │
                        │     CertLane drains:                   │
                        │       BLS    → CertOut                 │
                        │       Ringtail → CertOut               │
                        │       MLDSAGroth16 → CertOut           │
                        └─────────────────────────────┬──────────┘
                                                      │
                                                      ▼
                        ┌────────────────────────────────────────┐
                        │   QuasarCert                            │
                        │     subject[32]                         │
                        │     bls_aggregate[96]                   │
                        │     ringtail_artifact (offset/len)      │
                        │     mldsa_groth16_proof[192]            │
                        │     mldsa_groth16_pub_inputs_hash[32]   │
                        └─────────────────────────────────────────┘
```

## Cert Subject — The Replay-Proof Binding

```
certificate_subject = keccak(
    chain_id ||
    epoch || round || mode ||
    pchain_validator_root  ||      ← P-Chain
    qchain_ceremony_root   ||      ← Q-Chain
    zchain_vk_root         ||      ← Z-Chain
    parent_block_hash      ||
    parent_state_root      ||
    parent_execution_root  ||
    gas_limit || base_fee )
```

**Hard rule**: every cert-lane artifact MUST bind this same
`certificate_subject`:

| Lane | Subject binding |
|---|---|
| BLS | `subject` is the BLS message; verifier checks `e(sig, G2) == e(H(subject), pk_aggregate)` |
| Ringtail | `subject` is the Ring-LWE message; `qchain_ceremony_root` selects the DKG public key |
| MLDSAGroth16 | Groth16 public inputs include `subject`; `zchain_vk_root` selects the VK |

A cert artifact for one round/epoch cannot satisfy a different round/
epoch even if the block hashes happen to collide, because the upstream
roots differ. This is the core of cross-epoch replay protection.

## Cert Lane: BLS (classical fast path)

Unchanged from LP-075 except that the cert ingress carries the
artifact via offset/len:

```cpp
struct BLSAggregateArtifact {
    uint8_t signature[96];        // BLS12-381 G1 aggregate
    uint8_t bitmap_hash[32];      // commitment to the signer bitmap
};
```

| Property | Value |
|---|---|
| Quorum threshold | 2/3 + 1 of stake (per `pchain_validator_root`) |
| Aggregation | `AggregateSignature(sigs...)`, `AggregatePublicKey(pks...)` |
| Verification | single pairing `e(aggSig, G2) == e(H(subject), aggPK)` |
| Wire size | 96 + 32 = 128 bytes inline |
| Verifier | `verify_bls_aggregate` (LP-132 §drain_cert_lane) |

## Cert Lane: Ringtail (Q-Chain PQ threshold)

Q-Chain runs the Ringtail 2-round DKG ceremony for the active epoch
and commits the result to `qchain_ceremony_root` in the next
QuasarRoundDescriptor.

```cpp
struct RingtailShareArtifact {
    uint32_t participant_index;
    uint32_t round_index;             // 0 or 1 (2-round ceremony)
    uint8_t  share[RINGTAIL_SHARE_BYTES];  // variable; defined upstream
};
```

| Property | Value |
|---|---|
| Hardness | Module-LWE (Ring-LWE) |
| Threshold | t-of-n (defined per epoch) |
| Aggregation | accumulator state (post-DKG, O(1) per added share) |
| Verification | LP-073 §RingtailVerify with public key from `qchain_ceremony_root` |
| Wire size | variable (uses `(artifact_offset, artifact_len)`) |
| Verifier | `verify_ringtail_share` (LP-132) |

Q-Chain's role: run the threshold ceremony, NOT to verify execution.
Q-Chain commits the public key for round R via
`qchain_ceremony_root[R]`. Round-R cert artifacts on the Ringtail lane
must verify against that key.

## Cert Lane: MLDSAGroth16 (Z-Chain PQ identity rollup)

This is the key 3.0 architectural change. **ML-DSA is NOT verified
per-validator in the consensus path.** Instead:

1. Each validator individually signs the round's cert subject with
   their ML-DSA-65 identity key.
2. The proposer ships these N raw ML-DSA signatures off-chain to a
   Z-Chain prover.
3. Z-Chain produces a single Groth16 proof attesting "N valid ML-DSA-65
   signatures over `subject` from this validator set".
4. The cert ingress carries the **192-byte Groth16 proof + 32-byte
   public-inputs hash**, NOT the N raw ML-DSA shares.
5. The QuasarGPU verifier runs **one Groth16 pairing check** per cert,
   not N.

```cpp
struct MLDSAGroth16Artifact {
    uint8_t proof[192];                  // Groth16 proof over BLS12-381
    uint8_t public_inputs_hash[32];      // bound to subject + validator set root
};
```

### Why a proof, not a signature

Threshold ML-DSA has **no FIPS standard**: research constructions hit
a rejection-sampling circular dependency (see `lux/proofs/quasar-cert-soundness.tex`,
App. A). Quasar therefore takes the non-threshold path — every
validator signs individually, and Z-Chain compresses the N sigs via
Groth16 over BLS12-381.

### Costs (measured 2026-04-13)

| Operation | CPU | GPU (MLX/Metal/CUDA) |
|---|---|---|
| ML-DSA-65 sign (per validator) | 495 µs | — |
| ML-DSA-65 verify (per validator) | 181 µs | — |
| Z-Chain Groth16 prove (n=21 validators) | ~400 ms | ~5–15 ms |
| Groth16 verify (cert-side) | 1–3 ms | 200–500 µs (batched) |
| Per-cert amortized verify (n=21) | 2–5 ms | 200–500 µs |

Verifier:

```cpp
verify_mldsa_groth16(subject, proof, public_inputs_hash, zchain_vk_root)
```

Implemented in LP-132 §drain_cert_lane.

## QuasarCertIngress — fixed-size ring item

The substrate routes lane artifacts as fixed-size ring items with a
back-reference into a `cert_artifact_arena`:

```cpp
struct alignas(16) QuasarCertIngress {
    uint64_t epoch;
    uint64_t round;
    uint32_t mode;                ///< QuasarMode
    uint32_t cert_lane;           ///< QuasarCertLane
    uint32_t validator_index;     ///< primary contributor; 0xFFFFFFFF
                                  ///< for proof-only lanes (MLDSAGroth16)
    uint32_t artifact_kind;       ///< 0=signature, 1=share, 2=proof
    uint64_t stake_lo;            ///< 64-bit stake (P-Chain proven)
    uint64_t stake_hi;
    uint8_t  subject[32];         ///< must match descriptor.certificate_subject
    uint32_t artifact_offset;     ///< byte offset in cert_artifact_arena
    uint32_t artifact_len;
    uint64_t _pad0;
};
static_assert(sizeof(QuasarCertIngress) == 96, "");
```

Adding a new lane (e.g. SLH-DSA, Falcon, BLS-Ringtail-Composite)
requires only a new `QuasarCertLane` enum value plus a verifier — **no
wire-format break**.

## QuasarCert wire format (3.0)

```cpp
struct alignas(16) QuasarCert {
    uint64_t round;
    uint32_t cert_lane;            ///< QuasarCertLane this cert covers
    uint32_t reached;              ///< 0=incomplete, 1=lane quorum reached
    uint32_t signers_count;
    uint32_t _pad0;
    uint64_t total_stake_lo;
    uint64_t total_stake_hi;
    uint8_t  subject[32];
    uint8_t  bls_aggregate[96];                  ///< valid iff lane==BLS
    uint8_t  mldsa_groth16_proof[192];           ///< valid iff lane==MLDSAGroth16
    uint8_t  mldsa_groth16_pub_inputs_hash[32];
    uint32_t ringtail_artifact_offset;
    uint32_t ringtail_artifact_len;
    uint64_t _pad1;
};
static_assert(sizeof(QuasarCert) == 432, "");
```

A composed wire `QuasarCert` (per-lane → final 3-tuple) ends up at
~416–448 bytes depending on Ringtail share size. 2.0's "248-byte
QuasarCert" line in the old LP referred only to the BLS+rolled-PQ
combination; 3.0 makes the lane composition explicit.

## Round result: lane status + stake (per upstream authority)

```cpp
struct alignas(16) QuasarRoundResult {
    uint32_t status;
    uint32_t tx_count;
    uint32_t gas_used_lo, gas_used_hi;
    uint32_t wave_tick_count;
    uint32_t conflict_count, repair_count;
    uint32_t fibers_suspended, fibers_resumed;
    // per-lane cert status
    uint32_t cert_status_bls;          ///< 0=incomplete, 1=quorum reached
    uint32_t cert_status_ringtail;
    uint32_t mldsa_groth16_valid;      ///< 0/1 — Z-Chain proof verified
    // per-lane accumulated stake (lanes with per-validator stake)
    uint32_t cert_stake_bls_lo, cert_stake_bls_hi;
    uint32_t cert_stake_ringtail_lo, cert_stake_ringtail_hi;
    // proof-only lane carries no stake aggregate (proven inside the proof)
    uint32_t mode;
    uint8_t  block_hash[32];
    uint8_t  state_root[32];
    uint8_t  receipts_root[32];
    uint8_t  execution_root[32];
    uint8_t  mode_root[32];
    uint8_t  mldsa_groth16_pub_inputs_hash[32];
};
```

The MLDSAGroth16 lane has **no `cert_stake_mldsa`** because stake is
proven inside the Groth16 public inputs — exposing it separately would
duplicate (and risk diverging from) the proof's own stake commitment.

## Modes

| Mode | Driver | mode_root content |
|---|---|---|
| **Nova** (0) | LP-1000 ray | linear-chain commitment (= block_hash) |
| **Nebula** (1) | LP-1000 field | DAG cut commitment (Horizon prefix root) |

The mode is a uint8 in `QuasarRoundDescriptor`; `mode_root` is a
distinct 32-byte field in `QuasarRoundResult` carrying the
mode-specific commitment.

## Signing layers (toggleable; same as 2.0 with new names)

| Configuration | Lanes used | Use case |
|---|---|---|
| BLS-only | BLS | classical fast-path consensus |
| BLS + Ringtail | BLS, Ringtail | dual with PQ threshold |
| BLS + MLDSAGroth16 | BLS, MLDSAGroth16 | dual with PQ identity rollup |
| BLS + Ringtail + MLDSAGroth16 (full Quasar) | all three | triple mode (`TripleSignRound1`) |
| Production | all three + Z-Chain ZKP | succinct triple cert |

`IsTripleMode()` returns true when all three lanes are configured.

## Performance (2025-12-15 measurements)

| Metric | 2.0 | 3.0 |
|---|---|---|
| BLS quorum verify (n=100 signers) | 875 µs | 875 µs (unchanged) |
| ML-DSA-65 lane verify | n × 254 µs = ~5 ms (n=21) | **one Groth16: 200–500 µs (GPU)** |
| Ringtail share verify | unchanged | unchanged + GPU batch |
| QuasarCert verify (n=21, all lanes, GPU) | 2–5 ms | **0.5–1.5 ms (GPU)** |
| Subject replay protection | block_hash only | **chain-id + epoch + P/Q/Z roots** |
| Wire ABI for new PQ scheme | break | **add an enum value** |

## Storage / Encoding

QuasarCert is encoded in ZAP (LP-022) using the 3.0 schema. Backward
compatibility:

- 2.0 verifiers can decode 3.0 BLS-only certs (the BLS lane format is
  byte-identical).
- 2.0 verifiers reject 3.0 multi-lane certs (different cert_lane enum
  semantics + different artifact indirection). Coordinated upgrade
  required at the activation height per LP-1100.

## Security properties (unchanged in spirit, sharpened by 3.0)

An adversary must break ALL THREE assumptions simultaneously:

| Assumption | Lane | Hardness |
|---|---|---|
| Discrete log on BLS12-381 | BLS | classical |
| Module-LWE | MLDSAGroth16 | post-quantum identity proof |
| Module-SIS | Ringtail | post-quantum threshold proof |

3.0 adds one more invariant by construction:

> **Cross-epoch / cross-chain replay is structurally impossible** —
> every cert artifact binds `subject`, and `subject` binds
> `pchain_validator_root || qchain_ceremony_root || zchain_vk_root`,
> which differ across epochs by construction.

## Transport

ZAP (LP-022) for inter-node consensus. PQ-TLS 1.3 for confidentiality
(Go 1.26 ML-KEM-768 default). 3.0 uses the same ZAP wire as 2.0 with
the schema change documented above.

## GPU adapter

LP-132 (QuasarGPU Execution Adapter) implements the per-lane verifier
drains:

```
ServiceId::CertLane → drain_cert_lane → CertOut
```

with three verifiers:

- `verify_bls_aggregate` — pairing check via lux-accel BLS kernel
- `verify_ringtail_share` — Ring-LWE share verify against Q-Chain key
- `verify_mldsa_groth16` — Groth16 verify against Z-Chain VK

100% GPU-native: zero CPU compute on the round path.

> **Note (placeholder → real verifiers).** The cryptographic verifiers
> shipped as **HMAC-keccak placeholders** for the 2025-12-25 activation
> of Quasar 3.0 — real cryptographic verification (one-way with a
> master secret, cross-lane domain tags reject replay), structured so
> that the swap to the real primitives was a single function-pointer
> change. They were replaced with **real BLS12-381, real Ringtail
> Ring-LWE, and real Groth16 over BLS12-381** in **QuasarSTM 4.0** at
> the **2026-02-14** activation: BLS pairing kernel landed in v0.44,
> Ringtail share verifier and Groth16 verifier landed in v0.45. The
> HMAC-keccak path is preserved as a development-only mode for
> deterministic test vectors and is gated behind
> `EVM_DEV_HMAC_VERIFIER=1`. See **LP-010-quasar-stm-4** (4.0
> production paper, 2026-02-14) and **LP-135** (4.0 production spec)
> for the full migration.

## Implementation Plan (3.0 rollout)

| Version | Scope |
|---|---|
| **3.0.0** (this LP) | wire schema, three-lane ABI, P/Q/Z subject binding |
| **3.0.1** | LP-132 GPU adapter ships real BLS / Ringtail / Groth16 verifiers |
| **3.0.2** | Z-Chain prover ships Groth16 proof generation pipeline |
| **3.0.3** | Q-Chain ships Ringtail DKG ceremony commitments per epoch |
| **3.0.4** | P-Chain commits validator-set roots per epoch |

## Reference

| Resource | Location |
|---|---|
| Consensus implementation | `github.com/luxfi/consensus/protocol/quasar/` |
| GPU execution adapter | `cevm/lib/consensus/quasar/gpu/` (LP-132) |
| BLS | LP-015, LP-075 |
| Ringtail | LP-073, LP-076 |
| ML-DSA | LP-070 |
| ZAP wire | LP-022 |
| QuasarSTM | LP-010 |
| Soundness proof | `lux/proofs/quasar-cert-soundness.tex` |

## Changelog

- **2022-06-01** — initial Quasar (BLS-only)
- **2024** — added Ringtail PQ threshold lane
- **2025** — added ML-DSA per-validator lane
- **2025-11-30** — minor edits, validator key management notes
- **2025-12-15** — **Quasar 3.0 final spec for 2025-12-25 launch**:
  rename to cert lanes; introduce `QuasarCertLane`; bind subject to
  P-Chain / Q-Chain / Z-Chain roots; ML-DSA becomes Z-Chain Groth16
  rollup, not per-validator; LP-132 GPU adapter spec referenced.
- **2026-02-14** — **QuasarSTM 4.0 activation**: HMAC-keccak verifier
  placeholders replaced with real BLS12-381 (v0.44), real Ringtail
  Ring-LWE (v0.45), and real Groth16 over BLS12-381 (v0.45) under the
  4.0 milestone train. Wire format and `QuasarCertLane` enum
  unchanged. See LP-010-quasar-stm-4 and LP-135.

## Copyright

Copyright (C) 2022-2025, Lux Partners Limited. All rights reserved.
