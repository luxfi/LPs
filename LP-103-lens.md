---
lp: 103
title: Lens — Curve-Based Threshold Signatures with Dynamic Resharing
tags: [threshold, schnorr, frost, ed25519, secp256k1, resharing, vsr, key-era, lens]
description: Classical curve threshold signature kernel — sister to Pulsar. FROST-derived 2-round Schnorr/EdDSA threshold signing with key-era lifecycle, verifiable secret resharing, persistent group public key. Replaces the stub LSS-FROST integration.
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Cryptography
created: 2026-03-03
references:
  - LP-019 (Threshold MPC)
  - LP-020 (Quasar Consensus)
  - LP-073 (Pulsar — lattice threshold sister kernel)
  - LP-076 (Universal Threshold Framework)
  - LP-077 (Linear Shamir / LSS)
  - RFC 9591 (FROST: Flexible Round-Optimized Schnorr Threshold)
canonical: github.com/luxfi/lens
upstream: RFC 9591, Komlo-Goldberg 2020 (FROST)
status-impl: Architecture locked; kernel + LSS-Lens adapter shipping alongside Pulsar's Quasar cutover.
---

# LP-103: Lens — Curve-Based Threshold Signatures with Dynamic Resharing

> See [LP-105 §Architectural thesis](LP-105-lux-stack-lexicon.md#architectural-thesis) for the canonical Lux PQ-consensus thesis. The claims/evidence table and ten architectural commitments are also in LP-105 — single source of truth.

> **Status.** Architecture locked; the Lens kernel and LSS-Lens adapter ship alongside Pulsar's Quasar consensus cutover so both kernels share one proven lifecycle shape.
>
> **Naming hygiene.** "Lux Lens" or "Lens threshold kernel". Never the bare phrase "Lens Protocol" — that's a Web3/SocialFi project unrelated to this work.

## Abstract

> **Lux contributes the missing systems layer between modern PQ threshold signatures and real permissionless blockchain consensus**: dynamic validator rotation, share lifecycle, activation-gated resharing, grouped threshold finality, and hybrid classical/PQ certificate composition. Lens is the curve-side instantiation of that systems layer. Pulsar (LP-073) is the lattice-side sister.

Lens is the **classical curve-based** threshold signature kernel — the sister to Pulsar (LP-073, lattice). Lens consumes upstream FROST (RFC 9591, Komlo-Goldberg 2020) Round 1 / Round 2 / Aggregate primitives byte-equal, and packages them with the same **key-era lifecycle** Pulsar uses:

| Component | Pulsar | Lens |
|---|---|---|
| **Math fields** | Module-LWE / R_q | Discrete log / prime-order group |
| **Sign math inherited (byte-equal)** | Pulsar Sign1/Sign2/Combine | FROST Round 1/Round 2/Aggregate |
| **Commits** | A·NTT(s) + B·NTT(r) lattice Pedersen | g^s · h^r curve Pedersen |
| **Genesis** | Trusted-dealer Bootstrap, OR Pedersen DKG over R_q (`pulsar/dkg2/`) | FROST DKG (proper distributed, no trusted dealer needed at all), OR trusted-dealer Bootstrap |
| **Per-epoch DKG** | **Never** — VSR via `pulsar/reshare` | **Never** — VSR via `lens/reshare` |
| **Lifecycle** | LSS-managed (Generation, Rollback, KeyEraID, Reanchor) | LSS-managed (same) |
| **LSS adapter** | `threshold/protocols/lss/lss_pulsar.go` | `threshold/protocols/lss/lss_lens.go` (replaces stub `lss_frost.go`) |

Both kernels share the lifecycle invariant: **no trusted dealer after the one-time genesis ceremony**. Per-epoch transitions go through LSS-managed VSR. Reanchor is the only escape hatch back to genesis-style trust, and requires governance.

Lens is **not** a replacement for BLS aggregation. BLS Beams (LP-075) aggregate signatures from independent validator keypairs; Lens is threshold under one shared curve group key. Quasar uses both: BLS Beams for fast classical aggregate finality across all validators, Lens (when adopted) for classical threshold control-plane / committee certs / custody.

## Motivation

The current LSS-FROST integration (`threshold/protocols/lss/lss_frost.go`) is a centralized simulation with five production-blocking gaps:

| Gap | LSS-FROST today | Lens fix |
|---|---|---|
| `Sign()` placeholder | returns `"sign execution not implemented"` | wires actual FROST 2-round signing protocol |
| `Refresh()` placeholder | bumps generation counter only | calls `lens/reshare.Refresh` (real HJKY97 zero-poly) |
| `wPoly`, `qPoly` single-process | one Go process generates both polynomials | distributed JVSS with per-party polynomial broadcast (round-based protocol) |
| Hardcoded `ChainKey: []byte("frost-chainkey")`, `RID: []byte("frost-rid")` | placeholder strings shipped to prod | proper RID from genesis ceremony randomness; ChainKey from bonded transcript |
| `verifyResharingFROST` only checks public-key consistency | doesn't verify protocol correctness | full Pedersen-commit-verify per share (analogous to `pulsar/reshare/commit.go`) |

Lens closes all five by mirroring Pulsar's architecture: a curve-math kernel at `github.com/luxfi/lens` plus an LSS adapter at `threshold/protocols/lss/lss_lens.go`.

## Specification

### 1. Layer separation

```
github.com/luxfi/lens                     ← curve threshold math kernel
  ├── primitives/    (curve Pedersen, polynomial, sample)
  ├── sign/          (FROST 2-round signing math, byte-equal vs upstream)
  ├── threshold/     (GroupKey, KeyShare, Signer types)
  ├── reshare/       (Refresh, ReshareToNewSet over G; commit, complaint, transcript, activation)
  ├── keyera/        (in-process lifecycle reference; analogous to pulsar/keyera/)
  └── dkg/           (FROST DKG path — distributed, no trusted dealer needed)

github.com/luxfi/threshold/
  ├── protocols/lens/         (round-based wrapper using internal/round/Session)
  └── protocols/lss/lss_lens.go  (LSS-Lens adapter; supersedes lss_frost.go)
```

### 2. Key-era lifecycle (identical to Pulsar's)

```
Genesis:  FROST DKG (proper distributed)  OR  Trusted-dealer Bootstrap.
          Either path establishes (g, h, GroupKey) for one key era.

Every epoch under same GroupKey:
          NEVER trusted dealer. Refresh or ReshareToNewSet via lens/reshare.
          GroupKey persists; share distribution rotates.

Reanchor: rare governance event. Fresh DKG / ceremony; new KeyEraID.
```

### 3. Domain-separated message prefixes

```
QUASAR-LENS-BUNDLE-v1     ← Lens threshold cert over a bundle (when used in Quasar)
QUASAR-LENS-SIGN1-v1      ← FROST Round 1
QUASAR-LENS-SIGN2-v1      ← FROST Round 2
QUASAR-LENS-AGGREGATE-v1  ← FROST aggregate
QUASAR-LENS-REFRESH-v1    ← Refresh activation cert
QUASAR-LENS-RESHARE-v1    ← Reshare activation cert
QUASAR-LENS-ACTIVATE-v1   ← generic activation alias
QUASAR-LENS-REANCHOR-v1   ← Reanchor authorization
```

### 4. EpochShareState shape (mirrors Pulsar's)

```go
type EpochShareState struct {
    // Lineage (changes only at Reanchor — fresh GroupKey).
    KeyEraID uint64

    // LSS lifecycle.
    Generation   uint64
    RollbackFrom uint64

    // Per-epoch state.
    Epoch       uint64
    Validators  []ValidatorID
    Threshold   int
    Shares      map[ValidatorID]*lens.KeyShare
    GroupKey    *lens.GroupKey  // (g, h, X) — pointer-shared within era
    PairwiseSeeds  map[ValidatorID]map[ValidatorID][]byte
    PairwiseMACKeys map[ValidatorID]map[ValidatorID][]byte
}
```

### 5. Acceptance criteria

Mirror Pulsar's adapter tests (see `threshold/protocols/lss/lss_pulsar_test.go`):

1. Group public key preserved across resharing.
2. KeyEraID preserved across resharing.
3. Generation increments by one.
4. RollbackFrom = 0 on forward transition.
5. t_old != t_new works.
6. old set != new set works.
7. New shares produce a valid FROST signature under unchanged group key.
8. Pairwise material regenerated for new party set.
9. Rollback restores previous generation snapshot.
10. Malformed Pedersen commit / share fails verification.

Plus Lens-specific:

11. RFC 9591-compatible FROST signing path.
12. Ed25519 / Ed448 / secp256k1 ciphersuite compatibility.
13. Pedersen commitment verification over the selected curve group.
14. Nonce / binding-factor handling matches FROST requirements.
15. No hardcoded ChainKey / RID (LSS-FROST stub gap closed).

## Vocabulary stack

```
Photon   — individual validator vote / attestation
Lumen    — PQ E2E encrypted+authenticated stream (planned, separate)
Beam     — BLS aggregate certificate (LP-075)
Lens     — classical curve threshold kernel (THIS LP)
Pulsar   — PQ lattice threshold kernel (LP-073)
Pulse    — one Pulsar threshold certificate
LSS      — dynamic threshold lifecycle framework (LP-077)
ML-DSA   — PQ accountability cert set (LP-070)
Horizon  — Quasar finality boundary
Quasar   — full leaderless consensus protocol (LP-020)
```

> *Photons travel through Lumen streams. BLS forms Beams. LSS moves threshold shares across generations. Lens emits classical threshold certificates. Pulsar emits post-quantum threshold certificates. Quasar reaches the Horizon when finality is sealed.*

## Cited works

- Komlo, C., Goldberg, I. *FROST: Flexible Round-Optimized Schnorr Threshold Signatures.* SAC 2020.
- RFC 9591. *The Flexible Round-Optimized Schnorr Threshold (FROST) Protocol for Two-Round Schnorr Signatures.* 2024.
- Herzberg, A., Jakobsson, M., Jarecki, S., Krawczyk, H., Yung, M. *Proactive Secret Sharing or: How to Cope With Perpetual Leakage.* CRYPTO 1995/1997.
- Desmedt, Y., Jajodia, S. *Redistributing Secret Shares to New Access Structures.* 1997.
- Wong, T.M., Wang, C., Wing, J.M. *Verifiable Secret Redistribution for Archive Systems.* SISW 2002.
- Seesahai, V.J. *LSS MPC ECDSA: A Pragmatic Framework for Dynamic and Resilient Threshold Signatures.* 2025. (LSS framework)

## Roadmap

| Phase | Status |
|---|---|
| 1. LP architecture (this document) | Shipping |
| 2. `~/work/lux/threshold/protocols/lens/doc.go` package landing | Shipping |
| 3. `lss_frost.go` deprecation marker | Shipping |
| 4. Pulsar → Quasar consensus integration | Shipping (LP-073) |
| 5. `~/work/lux/lens/` curve threshold kernel | Shipping alongside LP-073 cutover |
| 6. Lens kernel: primitives, sign, threshold, reshare, keyera | Shipping |
| 7. `threshold/protocols/lens/` round-based wrapper | Shipping |
| 8. `threshold/protocols/lss/lss_lens.go` adapter + 15 acceptance tests | Shipping |
| 9. Quasar adoption: Lens lane in HorizonCertificate (optional, classical) | Open: orthogonal to PQ-finality cutover; lands when a deployment requests classical-threshold control-plane certs |
| 10. Remove `lss_frost.go` | Open: deferred until callers migrate to `lss_lens` |

## Status

Architecture locked and shipping. The acceptance criteria above are normative.
