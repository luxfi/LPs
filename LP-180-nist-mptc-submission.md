---
lp: 180
title: Pulsar-M — NIST MPTC submission package
tags: [pq, pulsar, ml-dsa, threshold, nist, mptc, fips-204, jasmin, easycrypt, submission]
description: Tracks the Pulsar-M NIST MPTC submission package at luxfi/pulsar-mptc. Pins the deliverables (spec, reference impl, KAT vectors, Class N1 interop, Lean mechanization, Jasmin/EasyCrypt high-assurance scaffold) and the schedule (preview 2026-Jul-20, first call 2026-Nov-16).
author: Lux Core Team (@luxfi)
status: Proposed
type: Standards Track
category: Cryptography
network: Lux primary network
mirrors: HIP-0084
created: 2026-05-12
requires:
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar — Module-LWE production library)
  - LP-076 (Universal threshold framework)
  - LP-171 (Pulsar threshold DKG + signing — protocol)
---

# LP-180: Pulsar-M — NIST MPTC submission package

## Abstract

LP-180 tracks the **NIST Multi-Party Threshold Cryptography (MPTC)
submission package** for Pulsar-M, the Module-LWE threshold ML-DSA
construction Lux runs on the primary network's Q-Chain finality.
It is the document/code/proof artifact NIST receives at the
2026-Nov-16 first-call deadline.

LP-171 is the protocol-side LP (how Lux consumes Pulsar). LP-073
is the production-library LP (how Lux ships it). LP-180 is the
NIST-submission LP (what we hand NIST).

## NIST MPTC categories targeted

| Class | Property | Pulsar-M evidence |
|---|---|---|
| **N1** | Single-party-compatible threshold signing — output verifies under unmodified single-party verifier | Spec §6 Theorem 6.1; Lean `Crypto/Pulsar_M/OutputInterchange.lean` (zero `sorry`); E2E test `test/interoperability/n1_class_test.go` verifies every KAT through cloudflare/circl FIPS 204 (19/19 subtests) |
| **N4** | Multi-party key generation with public-key preservation across resharing | Spec §4.5 (Reshare protocol); Lean `Crypto/Pulsar_M/Shamir.lean` (zero `sorry`); transcript KATs `vectors/transcripts/n*-t*-reshare.jsonl` |

## Submission package contents

Repository: <https://github.com/luxfi/pulsar-mptc>. Module path
inside: `github.com/luxfi/pulsar-m` (preserved for NIST review
identity).

| Artifact | Location | Status |
|---|---|---|
| Cover sheet | `SUBMISSION.md` | drafted |
| Technical Specification | `spec/pulsar-m.tex` → `spec/pulsar-m.pdf` (28 pages, 491 KB, MacTeX 2025) | drafted; encoding freeze 2026-Aug |
| Reference Implementation | `ref/go/pkg/pulsarm/` (Go, no asm) | shipped; **89.7% coverage** |
| KAT vectors | `vectors/{dkg,keygen,sign,threshold-sign,verify}.json` + `vectors/transcripts/` | deterministic from 32-byte seed |
| Class N1 cross-validation | `test/interoperability/n1_class_test.go` (3rd-party FIPS 204 verifier: cloudflare/circl) | **19/19 subtests pass** |
| Symbolic / Lean proofs | `~/work/lux/proofs/lean/Crypto/Pulsar_M/{OutputInterchange,Unforgeability,Shamir}.lean` | **zero `sorry`** across all 3 files |
| Constant-time analysis | `ct/dudect/` harness | scaffolded; final results pinned at submission tag |
| Jasmin high-assurance (initial) | `jasmin/{ml-dsa-65,threshold}/` | libjade fetch script + threshold stubs |
| EasyCrypt theories (initial) | `proofs/easycrypt/{PulsarM_N1,PulsarM_N4}.ec` + `lemmas/PulsarM_CT.ec` | theory shells; `admit` markers pending discharge |
| Experimental evaluation report | `bench/results/REPORT.md` | populated on Apple M1 Max; reproducible via `scripts/bench.sh` |
| Patent / IP notes | `docs/patent-notes-draft.md` | drafted |
| License | `LICENSE` (Apache-2.0) | ✓ |
| Build/test/bench/vector-gen/SBOM scripts | `scripts/` | shipped; reproducibility CI gate |

## Cross-LP relationships

- **LP-070** ML-DSA — establishes the FIPS 204 primitive Pulsar-M's
  output is byte-equal to.
- **LP-073** Pulsar — the production Module-LWE library
  (`github.com/luxfi/pulsar`) consuming the algorithm Pulsar-M
  specifies. Live at `v1.0.1`.
- **LP-076** Universal threshold framework — Lux's chain-agnostic
  threshold-orchestration layer that consumes Pulsar-M as a kernel
  (alongside Corona R-LWE per LP-073-corona, FROST per LP-098,
  CGGMP21 per LP-099).
- **LP-105** Quasar Consensus — composes Pulsar-M with BLS aggregate
  + Z-Chain Groth16 in the QuasarCert structure. Production
  consumer.
- **LP-171** Pulsar threshold DKG + signing protocol — the
  Lux-protocol-side specification. LP-180 (this) is the
  NIST-submission-side specification.
- **HIP-0084** Hanzo mirror of LP-171. Pulsar-M is the algorithm
  both Lux and Hanzo deploy.

## Schedule

| Date | Milestone |
|---|---|
| 2026-Mar-03 | PQ Consensus Architecture Freeze (consensus / quasar APIs locked) |
| 2026-May-12 | LP-180 drafted; reference impl + KATs + Class N1 interop green |
| 2026-Jul-20 | NIST MPTC third preview deadline — submit a writeup-only preview |
| 2026-Aug-31 | Encoding section freeze (DD-008): wire formats pinned in `spec/pulsar-m.tex` |
| 2026-Sep-30 | EasyCrypt theory shells discharged (admit markers replaced with mechanized proofs); Jasmin threshold-layer round-1/round-2/combine implementations land |
| 2026-Oct-31 | dudect constant-time results pinned; final cross-validation against BoringSSL FIPS / AWS-LC / OpenSSL 3.0 PQ provider |
| 2026-Nov-16 | NIST MPTC first-call submission: cut `submission-2026-11-16` tag from `main`, produce reviewer tarball, file with NIST |

## Open submission risks

1. **Encoding section** (`spec/pulsar-m.tex`) explicitly declared
   "intentionally structural only — byte-level wire formats freeze
   at DD-008 (end of August 2026)". A reviewer who clones today
   sees that flag. Must close before submission.

2. **EasyCrypt `admit` markers** in `proofs/easycrypt/`. Three
   theory shells with `admit` standing in for the proof body.
   Without discharge, the high-assurance track is a roadmap. NIST
   accepts this for the first submission; reviewers will note it.

3. **Threshold-layer Jasmin** (`jasmin/threshold/{round1,round2,combine}.jazz`)
   are stubs with function signatures + TODO markers. The
   single-party ML-DSA-65 baseline is covered by libjade (fetched
   via `jasmin/ml-dsa-65/fetch.sh`); the threshold-specific work
   is months of formal-methods engineering.

4. **Red-team audit findings (2026-05)** — a 4-red-agent +
   1-scientist swarm against the nation-state threat model found
   13 production go-live blockers. The submission paper track is
   unaffected (algorithmic claims Class N1 + Class N4 + quantum
   resistance remain VALIDATED with documented caveats), but Lux
   mainnet deployment as a strict-PQ chain is blocked until the
   findings close. See `BLOCKERS.md` at the repository root for
   the canonical bug list. Per the scientist audit, the following
   five algorithmic claims need spec caveats added before submission:
   adaptive corruption (UNSUPPORTED → spec must say static-only);
   cross-domain isolation Pulsar/Corona (WEAK → both M-LWE and
   R-LWE share algebraic-lattice hardness, not defense-in-depth);
   constant-time Verify (WEAK → assertion not measurement; add
   dudect); Z-Chain Groth16 / P3Q migration (WEAK → implementation
   does not match doc claim of "192-byte Groth16 rollup"); 2-round
   optimality (WEAK → clarify v0.1 reconstruction-aggregator trust
   model vs Raccoon's 3-round true-threshold combine).

5. **No 1-round signing variant**. ML-DSA rejection sampling
   precludes 1-round threshold without a non-NIST-standard
   preprocessing oracle. NIST is aware; this is shared with
   Raccoon and Ringtail submissions.

## Acceptance criteria for "ready to submit"

The submission tarball at `submission-2026-11-16` must pass:

- [x] `scripts/build.sh` exits 0 on fresh clone (Go ref + spec PDF)
- [x] `scripts/test.sh` exits 0 (unit + no-secret-logs + KAT replay + Class N1 interop)
- [x] `scripts/gen_vectors.sh` produces byte-identical KAT output across runs
- [x] Three Lean `Crypto/Pulsar_M` files compile with zero `sorry`
- [x] `bench/results/REPORT.md` populated with reproducible numbers
- [x] `SUBMISSION.md` cover sheet present
- [ ] Encoding section finalized in `spec/pulsar-m.tex`
- [ ] EasyCrypt admits discharged OR explicitly marked as roadmap with deferred-evidence note
- [ ] Jasmin threshold-layer either implemented OR explicitly marked as roadmap
- [ ] dudect timing-channel results pinned in `ct/dudect/results/`
- [ ] Cross-validation against ≥2 of {BoringSSL FIPS, AWS-LC, OpenSSL 3.0 PQ provider, pq-crystals Dilithium reference} in `test/interoperability/`

## References

- NIST IR 8214C: *First Call for Multi-Party Threshold Schemes*
  (January 2026)
- FIPS 204: *Module-Lattice-Based Digital Signature Standard*
  (August 2024)
- Boschini, Kaviani, Lai, Malavolta, Takahashi, Tibouchi.
  *Ringtail: Practical two-round threshold signatures from learning
  with errors*. IACR ePrint 2024/1113.
- del Pino, Prest, Rossi, Saarinen. *Raccoon*: NIST PQC additional
  digital signatures submission, 2024.
- libjade: <https://github.com/formosa-crypto/libjade> —
  Jasmin/EasyCrypt verified ML-DSA / Kyber.
- Pulsar-M repository: <https://github.com/luxfi/pulsar-mptc>
