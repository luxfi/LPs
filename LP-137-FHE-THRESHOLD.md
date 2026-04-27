---
lp: 137-FHE-THRESHOLD
title: Threshold FHE Service Layer + Quasar Precompile Integration
tags: [fhe, threshold, mpcvm, four-kernel, quasar, precompile, m-chain, f-chain, lp-137]
description: t-of-n threshold FHE services (PartialDecrypt, ShareVerify, ShareAggregate) built on the MPCVM v0.62 four-kernel template, with the wire-up plan for Quasar precompile integration.
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Privacy
created: 2026-04-27
updated: 2026-04-27
requires:
  - lp-013 (FHE on GPU)
  - lp-019 (Threshold MPC)
  - lp-020 (Quasar consensus)
  - lp-022 (ZAP wire protocol)
  - lp-132 (QuasarGPU execution adapter)
  - lp-134 (Lux chain topology)
  - lp-137 (FHE-GPU performance + parallelization)
references:
  - LP-137-PARALLELIZATION (four-kernel template)
  - lp-137 sibling FHE-TYPING (FHEPrecompileArtifact shape)
---

# LP-137-FHE-THRESHOLD: Threshold FHE Service Layer

## Abstract

LP-137-FHE-THRESHOLD specifies the t-of-n **threshold FHE service
layer** that sits on top of the FHE primitives (NTT, blind rotation,
key switching) implemented by `luxfi/fhe`. The service layer takes a
ciphertext, fans partial-decrypt requests across an M-Chain MPC
committee, and aggregates ≥t shares into a recovered plaintext —
binding every share, transcript, and aggregate to a canonical sha256
root so the result can be anchored either on M-Chain (primary mode) or
in local WORM (private mode).

The service layer is **independent of the FHE-GPU primitive
correctness work**: NTT-correctness, bootstrap noise budgets, and the
wave-tick scheduler integration are upstream of every interface
defined here. This layer only composes the primitive surface with
party-aware logic.

The package targets the **MPCVM v0.62 four-kernel template** described
in `LP-137-PARALLELIZATION.md` §4: every service decomposes its work
into `apply` / `sweep` / `compute_leaves` / `compose_root`, with the
canonical-fold step (`compose_root`) producing the deterministic root
that flows into `FHEPrecompileArtifact.ThresholdTranscriptRoot`.

## Motivation

The encrypted-policy gate in `luxfi/mpc/pkg/policy/fhe_verifier.go`
(LP-019) was wired against a `ThresholdDecryptor` interface stub. To
make the gate production-ready, three things have to hold:

1. **A real protocol** — the partial-decrypt math has to be correct
   even if the noise proof is initially a placeholder. A wrong
   protocol cannot be patched by adding ZK proofs later.

2. **Canonical roots** — every share, transcript, and aggregate has
   to bind to a root that the cevm Quasar precompile can verify.

3. **Mode-aware anchoring** — the same service must support both the
   primary deployment (M-Chain anchor via `pkg/audit/mchain`) and the
   private deployment (local WORM via `pkg/audit/worm`) without
   forking.

This LP delivers all three.

## Architecture

### Service interfaces

Three roles, one wire shape:

```
PartialDecryptService.PartialDecrypt   — party-side: produce a share.
ShareVerifyService.VerifyShare         — peer-side or aggregator-side.
ShareAggregateService.Aggregate        — aggregator-side: combine ≥t.
```

All three are stateless w.r.t. the network. Network plumbing (RPC
fan-out, TLS 1.3 / PQ-TLS, ZAP wire types 60-79) lives in
`luxfi/mpc/pkg/policy/fhe_threshold_decryptor.go` via the
`PartyClient` interface.

### Wire types

| Type | Purpose | Root |
|---|---|---|
| `FHEThresholdShare` | one party's contribution | `ShareRoot = sha256(canonical(ShareData ‖ PartyID ‖ CiphertextID ‖ SessionID))` |
| `FHEThresholdResult` | aggregate verdict + roots | `AggregateRoot = sha256(canonical(plaintext ‖ partyCount ‖ threshold))` |
| transcript root | committee-wide commitment | `keccak256(canonical(sessionID ‖ ctRoot ‖ partyCount ‖ threshold ‖ shareCount ‖ sortedShareRoots ‖ aggregateRoot ‖ status))` |

The keccak256 hash family on the transcript root matches the
EVM/Quasar keccak shape so the cevm precompile dispatcher can verify
without converting hash families.

### Four-kernel template (per §6 of FHE-GPU spec, MPCVM v0.62)

| Step | Partial decrypt | Aggregate |
|---|---|---|
| `apply` | decompose ciphertext into per-party operands (`applyDecompose`) | order-and-dedupe shares (`orderShares`) |
| `sweep` | sample noise + Fiat-Shamir (`sweepNoise`) | re-verify every share (`verifyOne`) |
| `compute_leaves` | per-party share + noise proof (`computeLeaf` + `buildNoiseProof`) | per-share contribution to plaintext (`combineShares`) |
| `compose_root` | `ShareRoot = sha256(canonical(...))` | `AggregateRoot + Merkle(ShareRoots) + transcript root` |

Determinism is guaranteed by every encoder being length-prefixed,
big-endian, fixed-domain. Two backends (CPU, Metal, CUDA) MUST
produce byte-equal roots for byte-equal inputs.

## Protocol detail

### Partial decryption

For party i with KeyShare sk_i, ciphertext c = (a, b), and session
nonce sid, the share is:

```
TFHE  (Z_2):   share_i = b ⊕ sk_i ⊕ e_i_bit
BFV   (Z_q):   share_i = b · sk_i + e_i  (mod q)
CKKS  (Z_q):   same as BFV with the slot-pack invariant
```

The wire-shape is identical across schemes: a length-prefixed
canonical encoding of `(partyID, operands, noise, mixedSecret)`. The
scheme-aware aggregator demuxes at combine time.

The noise term `e_i` is sampled from a deterministic-given-transcript
stream (sha256-tree over partyKey ‖ ctID ‖ sessionID ‖ operands), so
two independent runs of `PartialDecrypt` for the same inputs MUST
produce byte-equal shares. This is what makes the share-replay audit
possible: any peer can re-run a party's `PartialDecrypt` and check
the bit-for-bit output.

### Noise proof — placeholder vs production

Production deployments require a zero-knowledge proof that `e_i` was
drawn from the prescribed distribution within the bound. Without this
proof a malicious party can inject out-of-bound noise to bias the
aggregate ("noise flooding" attack).

The standard construction is **CDS** (Cramer-Damgard-Schoenmakers
1994) — a non-interactive disjunctive sigma protocol, made
non-interactive by Fiat-Shamir over the same transcript that produced
`ShareRoot`. References: Boudgoust/Scholl 2023 §3.2; VeloFHE 2025.

This LP ships a **transcript-bound HMAC commitment** as a placeholder.
It is byte-equal across producer and verifier (deterministic given
the share material and transcript) and lets the rest of the threshold
pipeline run end-to-end. The `noise_proof.go` body is exactly the
shape the production CDS proof plugs into; only the inner body
changes.

**PRODUCTION REQUIRES** replacing `buildNoiseProof` /
`verifyNoiseProof` / `verifyNoiseProofPublic` with a real CDS sigma
protocol over Z_q (BFV/CKKS) or Z_2 (TFHE). The interface and the
verification gate in the aggregator are already in place. The version
tag on the wire format (`NoiseProofVersion = 1`) bumps to 2 when the
real proof ships, and old shares are rejected at aggregation time.

### Aggregation

Aggregation re-verifies every share before combining. The
verification path depends on what keys the aggregator holds:

| Configuration | Verification path |
|---|---|
| `PartyKeys` populated | `VerifyShareWithKey` (symmetric — works against placeholder noise proof) |
| `PartyPubKeys` populated | `VerifyShare` (public — fails until CDS proof ships) |
| neither | structural-only (root + ciphertext id) — tests / debug |

In committee self-check mode (every M-Chain MPC node holds its own
KeyShare and verifies its own outbound shares plus the peer shares
it has the keys for), `PartyKeys` is the production path. Cross-
committee verification awaits the CDS proof.

### Mode-aware anchoring

The threshold service emits `ThresholdTranscriptRoot` regardless of
deployment mode. The caller chooses where it lands:

- **Primary mode** — `pkg/audit/mchain` POSTs the transcript root in
  a batch anchor to M-Chain.
- **Private mode** — `pkg/audit/worm` writes the transcript root to
  the local append-only WORM store with cross-replica head verify.

Both paths are already implemented in `luxfi/mpc/pkg/audit` (sibling
#115). This LP only requires that the threshold service produce the
root in a form both can consume.

## Quasar precompile integration plan

The cevm Quasar dispatcher (LP-009 + LP-132) holds a `PrecompileId`
enum that selects which native handler runs for a given precompile
call. To expose `FHEThresholdShare` + `FHEThresholdAggregate` as
EVM-callable precompiles, two enum values must be added:

```cpp
// cevm/lib/evm/gpu/precompile_service.hpp
enum class PrecompileId : uint32_t {
    // ... existing entries ...
    FHEThresholdShare     = 0x0200'0083,  // partial-decrypt request
    FHEThresholdAggregate = 0x0200'0084,  // aggregate ≥t shares
};
```

Each handler dispatches into the threshold service:

| Precompile | Inputs | Outputs |
|---|---|---|
| `FHEThresholdShare` | `(ciphertextRoot, sessionID, partyID)` (the PartyClient is selected by the consensus committee binding) | `(share, shareRoot)` ABI-packed |
| `FHEThresholdAggregate` | `(ciphertextRoot, sessionID, threshold, share[])` | `(plaintextHash, aggregateRoot, transcriptRoot, status)` |

The plaintext itself does not exit the precompile — only its hash.
Callers that need the plaintext invoke the M-Chain RPC path
(authenticated by IAM JWT) and the precompile only emits roots.

### Coordination with sibling #90

Sibling #90 owns the `PrecompileId` enum surface and is currently
in flight (ConflictSpec sibling). To avoid a merge conflict, this LP
**does not** modify cevm files. The integration plan above is
documented; the actual enum addition + handler wiring lands in a
follow-on PR after #90 returns.

The follow-on PR is small:

- `cevm/lib/evm/gpu/precompile_service.hpp` — append two enum entries
- `cevm/lib/evm/gpu/precompile_service.cpp` — dispatch table entries
  routing to two handler functions
- new file `cevm/lib/evm/gpu/precompile_fhe_threshold.{hpp,cpp,mm}` —
  thin handlers calling out via the C-ABI shim into the Go threshold
  service
- ABI tests under `cevm/test/precompile/fhe_threshold/` — KAT vectors
  for share/aggregate round-trips

The Go-side C-ABI shim is sketched at `luxfi/fhe/cmd/fhed/c_abi_shim/`
in a parallel sibling task; this LP does not own that wiring.

## Test plan

Implemented in `luxfi/fhe/threshold/threshold_test.go`:

- 2-of-3 partial decrypt + aggregate (toy BFV-style scheme)
- 3-of-5 same
- Insufficient shares → `StatusInsufficientShares`
- Bad noise proof → `StatusNoiseProofFailed`
- Tampered ShareData → `StatusShareRootMismatch`
- Replay protection: same sessionID twice for one party → error
- Wrong-ciphertext share rejected → `StatusInvalidCiphertext`
- Cross-party verification with `PartyKeys` (committee self-check)
- Transcript root order invariance (canonical sort by PartyID)
- Noise proof version tagging (forward-compat for CDS upgrade)

Implemented in `luxfi/mpc/pkg/policy/fhe_threshold_decryptor_test.go`:

- 2-of-3 RPC-stub end-to-end through `RealThresholdDecryptor`
- 3-of-5 same
- Insufficient peers (threshold > peer count) → `ErrCommitteeQuorum`
- Two-of-three peers err, threshold cannot be met
- One peer errs, sufficient quorum still satisfied
- Zero threshold → error
- `roundToBool` over byte vectors

## Honest residual

Three known gaps documented at the package level:

1. **Full CDS noise proof.** The placeholder is HMAC-SHA256 bound to
   the transcript. Production requires a CDS sigma protocol; the
   verification gate is already in place.

2. **PartyClient RPC implementation.** The interface is defined; the
   stub used in tests wraps the local PartialDecrypter directly.
   Production wiring goes over the existing M-Chain ZAP transport
   (LP-022 message types 60-79) and is parallel work.

3. **Quasar precompile enum wire-up.** Documented in this LP, deferred
   to a follow-on PR after sibling #90 returns to avoid conflict.

## Reference paths

| Path | Purpose |
|---|---|
| `lux/fhe/threshold/types.go` | wire types (`FHEThresholdShare`, `FHEThresholdResult`, `FHEStatus`) |
| `lux/fhe/threshold/service.go` | three service interfaces |
| `lux/fhe/threshold/partial_decrypt.go` | `PartialDecrypter` (apply / sweep / compute_leaves / compose_root) |
| `lux/fhe/threshold/share_verify.go` | `ShareVerifier` (public + symmetric paths) |
| `lux/fhe/threshold/aggregate.go` | `ShareAggregator` (per-share verify + threshold combine) |
| `lux/fhe/threshold/transcript.go` | canonical encoding + `ComputeTranscriptRoot` |
| `lux/fhe/threshold/noise_proof.go` | placeholder noise proof + production hooks |
| `lux/fhe/threshold/ciphertext.go` | `NewFHECiphertext` constructor |
| `lux/fhe/threshold/threshold_test.go` | unit tests |
| `lux/mpc/pkg/policy/fhe_threshold_decryptor.go` | `RealThresholdDecryptor` + `PartyClient` |
| `lux/mpc/pkg/policy/fhe_threshold_decryptor_test.go` | RPC-stub tests |
