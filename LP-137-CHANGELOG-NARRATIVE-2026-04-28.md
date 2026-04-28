# LP-137 — CHANGELOG Narrative Roll-up (2026-04-28)

## Why this exists

The LP-137 GPU-Native Crypto stack was implemented end-to-end by 2025-12-25. The source tree was lost in a laptop-theft data-loss event in early 2026 and re-published from memory and audit recovery on 2026-04-27 / 2026-04-28.

A consequence of that re-publication is that every commit in every contributing repo carries a 2026-04 author timestamp, which obscures the actual implementation order for anyone reading `git log`. Rewriting commit timestamps would be falsification. Refusing to clarify the chronology would leave readers with a misleading picture.

The legitimate fix is a per-repo `CHANGELOG.md` written as authored prose, narrating the Dec 2025 implementation timeline by phase, with full-SHA citations into the actual re-published commits, plus annotated semver tags whose tag-message bodies state the original-implementation date and the re-publication date.

This document is the meta roll-up: one paragraph per repo, pointing at the per-repo CHANGELOG and tag.

## Per-repo CHANGELOGs

### luxcpp/crypto

- Path: `/Users/z/work/luxcpp/crypto/CHANGELOG.md`
- Tag: `v1.3.0` (next semver after existing v1.0.0 / v1.1.0 / v1.2.0)
- Scope: 13 implementation phases from 2025-12-22 through 2025-12-25 — brand-neutral DST sweep and C-ABI rewrite, AEAD cipher family (ChaCha20-Poly1305 + AES-256-GCM), hash family (SHA-256 / RIPEMD-160 / BLAKE2b / BLAKE3), lattice primitives (NTT + poly_mul), Poseidon2 BN254, the full BN254 tower (Fp/Fr → G1 → Fp2/Fp6/Fp12 → G2 → optimal-ate pairing → SVDW), modular arithmetic (modexp + evm256), Pedersen vector commitment, Banderwagon (with Pippenger MSM and VT documentation), KZG (EIP-4844 KAT), IPA (Bulletproofs over Banderwagon), Lamport OTS, composite attestation `require_*` flags, the luxcpp deps migration with ~20290 LOC vendor removal, hanzo-build native CI matrix, and the BN254 Metal Pedersen B3 fix.

### lux/crypto

- Path: `/Users/z/work/lux/crypto/CHANGELOG.md`
- Tag: `v1.18.2` (next patch after existing v1.18.1)
- Scope: 6 implementation phases from 2025-12-23 through 2025-12-25 — brand-neutral sweep, vanilla Go canonicals (secp256k1 / blake3 / banderwagon / verkle), Verkle ↔ Banderwagon integration with 10 imports rewritten, Pedersen `NewGeneratorsFromSeed` with frozen golden vector, the 21-crate Rust workspace finalize (5 working + 15 honest NOTIMPL with ignored tests, all 6 standard checks green), and hanzo-build native CI.

### lux/mpc

- Path: `/Users/z/work/lux/mpc/CHANGELOG.md`
- Tag: `v1.10.2` (next patch after existing v1.10.1)
- Scope: 5 implementation phases from 2025-12-23 through 2025-12-25 — KMS release nonce binding via HMAC-SHA256 with durable NonceStore (7 regression tests), NRAS JWS hardening with strict alg×key-type binding, NRAS `SkipSignature` kill-switch deletion, `mpcd` air-gap recovery surface (~280 LOC across Coldcard / Foundation BBQr / Keystone+NGRAVE UR), and the `luxfi/hsm` v1.1.3 dependency bump.

### lux/threshold

- Path: `/Users/z/work/lux/threshold/CHANGELOG.md`
- Tag: `v1.6.4` (next patch after existing v1.6.3 — note: original spec called for `v1.0.1`, but that version is long-published, so forward-only semver is `v1.6.4`)
- Scope: TFHE marked UNSAFE — committee.go HMAC shim removal exposed that the master key was replicated to all parties, partial-decrypt was HMAC theatre, and combine ignored partials. Added panic guards on all 4 entry points so the package fails closed and cannot be wired into production. Real threshold spec lives at `~/work/lux/lps/LP-137-TFHE-REAL-THRESHOLD-SPEC.md`.

### lux/hsm

- Path: `/Users/z/work/lux/hsm/CHANGELOG.md`
- Tag: `v1.1.3` already exists at the corresponding HEAD — no new tag added per spec.
- Scope: v1.1.3 release narrative — universal factory dispatching all 7 hardware wallets (Coldcard, Foundation, Keystone, NGRAVE, GridPlus, Ledger, Trezor) plus cloud HSM (AWS / Azure / GCP / Zymbit) plus on-prem HSM plus ML-DSA, with KMIP 2.1 / TR-31 / X9.143 / FIPS provider gate compliance, chain-aware Ledger driver, and the air-gap export surface (Nitrokey / PKCS#11 / YubiHSM).

### lux/lps

- Path: `/Users/z/work/lux/lps/CHANGELOG.md`
- Tag: none (spec — LP repos are documents, not releases)
- Scope: LP-137 publication roll-up — ACTUAL-STATE, WORK-BRANCH-AUDIT, MERGE-RECONCILIATION, TFHE-REAL-THRESHOLD-SPEC, PEDERSEN-DST-RECONCILED, plus the supporting BENCHMARKS / BUILD-STATE / FHE-PERFORMANCE / FHE-THRESHOLD / FHE-TYPING / TRUST-REGISTRY / COVERAGE / PARALLELIZATION / CRYPTO-ARCHITECTURE / gpu-residency-invariant set.

## Branching strategy

Each per-repo CHANGELOG and meta doc was committed on a dedicated branch:

- `changelog-dec-2025-narrative-2026-04-28`

Branch is pushed to origin. Tags are pushed independently. `main` is never touched on diverged repos (`lux/lps` has 87 ahead / 468 behind origin/main, not pushed).

## Hard constraints honored

- No commit timestamp was rewritten.
- No force-push.
- `GH_TOKEN` / `GITHUB_TOKEN` unset before remote ops.
- Tag bodies state both the original-implementation date (2025-12-25, or 2025-12-22 for hsm) and the re-publication date (2026-04-28).
- CHANGELOGs are authored prose, not `git log` dumps.
- Every entry cites the actual re-published commit SHA.
- Brand-neutral.
