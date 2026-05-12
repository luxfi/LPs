---
lp: 137-ACTUAL-STATE
title: LP-137 Actual State — single source of truth
date: 2026-04-28
status: Active (supersedes optimistic per-algo claims in LP-137-CRYPTO-ARCHITECTURE.md)
sources:
  - LP-137-MERGE-RECONCILIATION.md @ 153d3908
  - LP-137-WORK-BRANCH-AUDIT.md    @ 2c8726e1
  - LP-137-EMPIRICAL-AUDIT.md      @ 2c8726e1
  - LP-137-FINAL-SURVEY.md         @ 2c8726e1
  - LP-137-RED-AUDIT.md            @ 2c8726e1
  - LP-137-CRYPTO-ARCHITECTURE.md  @ 2c8726e1 (partly aspirational; see deltas)
  - 2026-04-28 ship   @ luxcpp/crypto f35c6b22 (LP-160..LP-166 acceleration kernels, FROST aggregate+verify, CGGMP21 Paillier 2048-bit, corona Ring-LWE, multi-curve Pippenger MSM)
---

## 0. Ship update — 2026-04-28 (luxcpp/crypto HEAD `f35c6b22`)

The numbers below carry the snapshot frozen by the audits in §1–§9.
Today's ship lands the LP-160..LP-166 acceleration kernel stack, FROST
aggregate+verify, full CGGMP21 Paillier 2048-bit, and the first-party
corona Ring-LWE body. Concrete deltas vs the audit snapshot:

- **Algorithm dir count: 30 (consolidated)** — was 32 in earlier audit;
  gpukit is the shared-kernel library and is not counted as an
  algorithm directory. `ls -d */ | grep -v build|cmake|deps|docs|include|pqclean_kat|c-abi|gpukit` returns **30 algorithm dirs** on HEAD `f35c6b22`.
- **C-ABI NOTIMPL: 1 real stub remains.** Source-tree grep for
  `CRYPTO_ERR_NOTIMPL` in `**/c_*.cpp` returns:
  `poseidon/c-abi/c_poseidon.cpp::poseidon_goldilocks` (BN254 variant is
  wired). `sr25519/c-abi/c_sr25519.cpp` is **wired** as of 2026-04-29 via
  `luxfi/sr25519-crust` (pure-C donna; no Rust toolchain) — both
  `sr25519_sign` and `sr25519_verify` return CRYPTO_OK on valid input,
  and the v1.x C-ABI signature is preserved by per-call seed→keypair
  expansion. `crypto_status()` now sets `CRYPTO_ALG_SR25519`. KAT test
  `sr25519_test` (5 assertions including the canonical Substrate //Alice
  seed→public-key vector) passes 1/1 (was DISABLED).
  `cggmp21/c-abi/c_cggmp21.cpp::cggmp21_aggregate` and `cggmp21_verify`
  also return NOTIMPL — these are **network-bound** (aggregate runs across
  signers in the Go-side ceremony) and standard ECDSA verify is delegated
  to `secp256k1_verify`; not counted as missing bodies. `secp256r1`
  returns NOTIMPL only when its CPU/OpenSSL headers are absent at build
  time — wired when present.
- **Multi-curve Pippenger MSM (LP-161): 22/22 KAT pass on first commit.**
  `gpukit_multi_pippenger_test` covers 8 secp256k1 (incl. n=0), 7 BN254 G1,
  7 Banderwagon, 1 BLS12-381 NOTIMPL contract test, 3 GPU NOTIMPL
  contract tests. `gpukit/curve_traits/bls12_381_g1_traits.h` is the
  header-only adapter that activates under `GPUKIT_MP_HAS_BLS12_381_G1=1`
  once a first-party (no-blst) BLS G1 Jacobian + Pippenger body lands;
  at that point the count goes to **29/29**. Commit `741f7c3f` +
  `f35c6b22` (BLS adapter header).
- **FROST aggregate + verify wired (was NOTIMPL).**
  `frost/cpp/aggregate.{hpp,cpp}` and `frost/cpp/verify.{hpp,cpp}` ship
  RFC 9591 §5.2 partial-share aggregation + BIP-340-style Schnorr verify
  for FROST(secp256k1, SHA-256). `frost_aggregate` and `frost_verify`
  C-ABI shims drop their NOTIMPL stubs. End-to-end pipeline now closes
  on first-party code: `presign + aggregate + verify`. 6/6
  `frost_presign_test` cases pass on commit `debeab78`.
- **CGGMP21 Paillier 2048-bit shipped (was deferred behind LP-163).**
  `cggmp21/cpp/paillier.{hpp,cpp}` lands the full Paillier path:
  `keygen_from_seed` (Miller-Rabin 40-round 1024-bit safe-prime search),
  `encrypt`, `decrypt`, `pi_enc_prove`, `pi_enc_verify`. All Z_{N²}
  arithmetic delegates to LP-163 Karatsuba 4096-bit modexp. `presign_one()`
  produces `status=0` records with real `K_i = enc_N(k_i, ρ_k_i)`,
  `G_cmt = enc_N(γ_i, ρ_g_i)`, and `pi_enc` binding `(K_i, k_i, ρ_k_i)`
  when the caller provisions a valid `PaillierKey`. Zero-pk emits
  `status=0xFF` (legitimate "this signer's pk not provisioned"). 4/4
  `cggmp21_presign_test` pass on commit `f35eedd2`.
- **Pulsar Ring-LWE first-party body wired.**
  `corona/cpp/corona.{hpp,cpp}` (691 LOC) lands setup / sign / verify
  for the Ring-LWE threshold signature scheme. C-ABI no longer returns
  NOTIMPL. `crypto_status()` bitmask now sets the `CRYPTO_ALG_RINGTAIL`
  bit. Commit `ecf21b73` + `f35c6b22` (bitmask). Pulsar full spec:
  LP-073 + papers/lp-073-corona.pdf.
- **Acceleration kernels (LP-160..LP-166) shipped.** Seven kernels,
  three-backend uniform layout, see `CROSSOVER.md` §"Acceleration kernels"
  for the per-kernel measured CPU vs GPU crossover table.

The audit snapshot below predates today's ship and remains the canonical
record of state up to commit `181d18c6`. The §0 update above is the
incremental delta.

---

# LP-137 Actual State

This document reconciles five separate audits into one honest picture.
No spin. No "PASS" without qualifier. Every claim cites its source
audit doc, line, and the underlying commit SHA.

## 1. One-page exec summary

`origin/main` of `luxcpp/crypto` (HEAD `6eb3791c`) ships **8 of 29
algorithm c-abi shims wired**, **21 still return `CRYPTO_ERR_NOTIMPL`**.
Source: LP-137-MERGE-RECONCILIATION.md §"Per-algo c-abi state on
origin/main", lines 31–62 (audit @ `153d3908`).

A cross-repo work-branch survey shows **58 unmerged branches across 6
repos, ~274 unique commits, all clean-merge against their respective
`main`** — the blockers are merge order and one build defect on the
`lux/mpc` apex, not conflict. Source: LP-137-WORK-BRANCH-AUDIT.md
§"Scope summary", lines 7–17 (audit @ `2c8726e1`).

The independently-reproducible perf claims hold up: **BLS fused
144.22× (claim 148.35×), FHE Metal NTT 16.92× (claim 16.71×), bn254
KAT 36/36 vs gnark v0.19.2, ScalarsMont:true verified**. Source:
LP-137-EMPIRICAL-AUDIT.md §"Per-claim verdict", #1, #2, #6, #7, lines
6–32.

The breadth claims are inflated 5–10×: claimed "every algo CPU↔GPU
determinism" is **3 of 32 algos with unconditional GPU tests (9.4%)**;
claimed "23 publish-ready Rust crates" is **3 workspace members**;
claimed "brand-neutral 24 residuals" is **380 hits across 78+ files
on `crypto` HEAD `181d18c6`**. Source: LP-137-EMPIRICAL-AUDIT.md
§4 #4, §"Aggregate" #5, #8, #9, lines 17–37.

The Red audit identified **5 critical / 2 high / 3 medium** issues
including a one-line wrong-import that breaks `pkg/policy + pkg/mpc`
build, NOTIMPL public C-ABI shims for `blake3 / slhdsa / lamport`
shipped while wins were claimed, and a fabricated `lux/fhe/policy/`
directory referenced by 5 separate test-count claims. Source:
LP-137-RED-AUDIT.md §"BLOCKING", §"LIES / INFLATED CLAIMS", lines
12–197.

**Status**: LP-137 is real on the perf side and real on the work-branch
side; it is **not yet real on `main`**. Eight critical-path branches
must merge in DAG order before LP-137 v1.0 can be asserted.

## 2. Verified perf claims (independently reproduced)

Quoting LP-137-EMPIRICAL-AUDIT.md verbatim where possible. Auditor:
Scientist agent. Host: Apple M1 Max, macOS 26.4. Method: read source
+ run benches; do not trust task summaries (line 2 of audit).

| # | Claim | Reproduced value | Source line | Commit / artifact |
|---|---|---|---|---|
| 1 | BLS 148.35× fused (warm-affine, n=1024) | **144.22×** (linear-aff 386 285 µs / fused-aff 2 678.5 µs) — within run-to-run variance; fused critical-path = 4 dispatches confirmed | EMPIRICAL §1, line 8 | `crypto-aead-wt/bls/cpp/bls_fused.cpp` (356 LOC); `crypto/` HEAD `181d18c6` does NOT contain `bls_fused.{cpp,hpp}` — they live in worktree branches and the prebuilt `build-fused/` artifact |
| 2 | FHE Metal NTT 16.71× peak (N=4096, B=2048) | **16.92×** (Metal 9.71 ms / Go 164.27 ms); 10-iter median, kernel-only | EMPIRICAL §2, line 11 | `lattice` commit `d11ec53c`; bench JSON `lux/fhe/bench/results/ntt_ladder_{metal,go}_20260427T22*.json` |
| 6 | Banderwagon Pippenger KAT `MultiExpConfig{ScalarsMont:true}` | Verified by source inspection at `93636ea7:banderwagon/test/tools/gen_multiexp_kat.go:118-126` | EMPIRICAL §6, line 22 | `93636ea7` |
| 7 | bn254 KAT 36/36 vs gnark v0.19.2; `e(P,Q)·e(P,-Q)=1` | `bn254_kat_test` reports `=== bn254 KAT: 36 passed, 0 failed ===`; `go.mod` pins `gnark-crypto v0.19.2` | EMPIRICAL §7, line 31 | `crypto-pedersen-cuda-wgsl-wt/bn254/test/tools/{gen_pairing_kat.go,go.mod}`; binary `crypto/build-bn254-gpu/bn254_kat_test` |

All four perf/KAT claims survive empirical reproduction. The remaining
six claims either fail re-verification, are mis-attributed, or are
unverifiable on M1 Max within session bounds (race-instrumented G3
BatchEvaluate, see §5 below).

## 3. C-ABI state on `main` (8 wired, 21 NOTIMPL)

Quoting LP-137-MERGE-RECONCILIATION.md §"Tally" verbatim (lines 64–69,
audit @ `153d3908`):

| Bucket | Count |
|---|---:|
| Wired on main today | **8** |
| Wired on a branch, ready to land | **11** (aead, blake3, ed25519, slhdsa, mldsa, mlkem, lamport, ntt, poly_mul, bn254, modexp, evm256 — counting evm256 alongside modexp) |
| Partially wired on a branch | **3** (poseidon goldilocks variant, pedersen legacy form, secp256r1) |
| No first-party body authored anywhere | **7** (kzg, ipa, verkle, sr25519, frost, cggmp21, corona) |

`origin/main` HEAD: `6eb3791c` ("crypto: CROSSOVER.md — per-primitive
Metal CPU/GPU thresholds (M1 Max)"). The 8 wired-on-main today are:
keccak, sha256, ripemd160, blake2b, secp256k1, attestation,
bls (BLS12-381), banderwagon (partially — multiexp KAT only).

Source: LP-137-MERGE-RECONCILIATION.md, full per-algo table at lines
31–62.

## 4. Branches + DAG (58 unmerged, ~274 commits)

Quoting LP-137-WORK-BRANCH-AUDIT.md §"Scope summary" (lines 7–17,
audit @ `2c8726e1`):

| Repo | Audited branches | Unique commits ahead of `main` | Leaf tips |
|------|------------------|-------------------------------|-----------|
| `lux/mpc` | 6 | 31 (linear stack) | `policy-canonical-tfhe-import` (apex), `ci/arc-hanzo-consolidation` (parallel) |
| `luxcpp/crypto` | 33 | 143 commits across 17 leaves | 17 |
| `lux/crypto` | 15 | 90 commits across 4 leaves | 4 |
| `luxcpp/lattice` | 1 | 4 | `feat/lp-137-types` |
| `lux/lattice` | 1 | 4 | `feat/lp-137-types` |
| `lux/threshold` | 2 | 2 (canonical) + 0 (LSS dead) | `feat/tfhe-committee-canonical` |
| **TOTAL** | **58 branches** | **~274 commits unmerged** | |

All 58 are **conflict-free against their respective `main`** (`git
merge-tree` produced clean trees in every case). The blockage is order
+ one build defect at the lux/mpc apex (BRANCH-AUDIT line 18–21).

### LP-137 critical path: 8 branches must land

LP-137 architecture claims (Metal NTT dispatch, threshold-FHE
committee, policy-canonical TFHE import, GPU-accelerated
Pedersen/poseidon/BLS, byte-equal CPU oracles) become true on `main`
only after:

1. `luxcpp/crypto` `deps-bootstrap-2026-04-27` (KZG + PQ vendoring)
2. `luxcpp/crypto` `fork-swap-luxfi-deps-2026-04-27` (intx+evmmax luxfi forks)
3. `luxcpp/crypto` `pedersen-cuda-wgsl-2026-04-27`
4. `luxcpp/crypto` `aead-cuda-wgsl-2026-04-27`
5. `luxcpp/lattice` `feat/lp-137-types`
6. `lux/lattice` `feat/lp-137-types`
7. `lux/threshold` `feat/tfhe-committee-canonical`
8. `lux/mpc` `feat/policy-canonical-tfhe-import` (apex)

Source: LP-137-WORK-BRANCH-AUDIT.md §"Critical-path branches", lines
198–209.

### Build defect blocking lux/mpc apex

Commit `9244ac4` on `feat/canonical-intent-cto` adds `airgapCommand(...)`
and `buildHSMSignerConfig(...)` calls in `cmd/mpcd/main.go` (lines 244,
871) **without committing the supporting `airgap_*.go` and
`hsm_signer_config.go` files**. Result:

```
cmd/mpcd/main.go:244:4: undefined: airgapCommand
cmd/mpcd/main.go:871:21: undefined: buildHSMSignerConfig
```

Every descendant branch (`fhe-verifier`, `fhe-threshold-decryptor`,
`policy-canonical-tfhe-import`) inherits this. Source:
LP-137-WORK-BRANCH-AUDIT.md §"Build defect (apex of stack)", lines
40–55.

## 5. Critical issues

### Red Blocking findings (LP-137-RED-AUDIT.md §"BLOCKING")

| # | Issue | Severity | Source line |
|---|---|---|---|
| B1 | `mpc/pkg/policy` and `mpc/pkg/mpc` do not compile — wrong import path `github.com/luxfi/fhe/threshold` (real path: `github.com/luxfi/fhe/pkg/threshold`); fix is one line | CRITICAL | RED §B1, lines 14–34 |
| B2 | CDS Noise Proof Gap — when `PartyKeys=nil`, switches to public-key path that "ships once CDS proofs ship" — i.e., does not exist yet; latent fail-open | HIGH (latent) → CRITICAL after B1 | RED §B2, lines 36–48 |
| B3 | blake3 spec_vector test fails to compile — references missing JSON file at `luxcpp/crypto/blake3/test/vectors/test_vectors.json`, directory does not exist | HIGH | RED §B3, lines 50–63 |
| B4 | `blake3 / slhdsa / lamport` public C-ABI return `CRYPTO_ERR_NOTIMPL` — six exported functions return `-5`; `slhdsa_kat_test` and `lamport_test` binaries print PASS only because they bypass public ABI and call internal symbols (`metal_slhdsa_keygen`); public ABI surface is a lie | CRITICAL | RED §B4, lines 65–93 |
| B5 | `lux/fhe/policy/` directory does not exist — claims "67/67 tests", "12 tests", "28 rule_engine subcases", "5.2s policy eval" reference nothing; `grep rule_engine` returns zero `.go` files | CRITICAL fabrication | RED §B5, lines 95–107 |

Recommendation from Red: **do-not-ship**. RED §"Recommendation",
line 271.

### Blue B1–B5 — see Red audit (Blue and Red are paired; Red findings ARE the Blue queue)

Blue receives Red's queue per the Blue-Red protocol. Top 3 priorities
for Blue (RED §"Top 3 for Blue to fix", lines 261–266):

1. Fix import path `luxfi/fhe/threshold` → `luxfi/fhe/pkg/threshold`
2. Restore deleted `lux/fhe/policy/` package or retract claims
3. Implement blake3 / slhdsa / lamport public C-ABI bodies, or remove
   from header

### Final-survey blockers (LP-137-FINAL-SURVEY.md §"Decision Block")

| # | Blocker | Source line |
|---|---|---|
| F1 | `luxgpu` GitHub org does NOT exist — required for `lux/gpu` migration | SURVEY line 17 |
| F2 | `lux/accel` is CPU+GPU dispatch, **not GPU-only**; should NOT move to luxgpu org | SURVEY line 18 |
| F3 | `lux/mpc` HEAD detached + dirty (`go.work.sum + pkg/kms/release_nonce_test.go`) | SURVEY line 19 |
| F4 | `luxcpp/consensus` has no remote configured + dirty | SURVEY line 20 |
| F5 | `luxcpp/cli` is not a git repo | SURVEY line 21 |

All five must be resolved before Phase 2 of the migration plan
executes. Source: SURVEY §"Decision Block", lines 12–22.

### Scientist breadth-claim corrections (LP-137-EMPIRICAL-AUDIT.md)

| Original claim | Reality | Off-by | Source line |
|---|---|---|---|
| "every algorithm CPU↔GPU determinism" | 3 of 32 algos with unconditional GPU tests; 6 of 8 GPU-tests gate on `LUX_CRYPTO_*_METALLIB` env, print "skip GPU equality" + "ALL TESTS PASSED (GPU skipped)" — stub-pass | Coverage 9.4% real (3/32), not "every algo" | EMPIRICAL §4, lines 16–18 |
| "Brand-neutral 240 → 24 residuals" | **380 hits across 78+ files** on `crypto` HEAD `181d18c6`; sample residuals: `aead/c-abi/c_aead.cpp:1:#include "lux_crypto.h"`, `bn254/c-abi/c_bn254.cpp:6`, `slhdsa/c-abi/c_slhdsa.cpp:1`, `bn254/gpu/metal/zk_metal.mm:61` | 16× higher than claim | EMPIRICAL §5, lines 19–21 |
| "27 algos + 50 Go pkgs + 27 Rust + 18 ctest" | **32 algo dirs** (not 27); **3 algos** with real GPU tests; **26 ctest registrations**, but **17 PASS / 9 Not Run** (ctest fails to find executables under registered build directory layout — registration bug); **3 Rust crates** in workspace (not 27); Go pkgs unverified (`consensus@v1.22.70 go.sum` checksum mismatch blocks workspace test sweep on this host) | Multiple categories off by 5–10× | EMPIRICAL §8, lines 33–34 |
| "23 Rust crates publish-ready" | Workspace declares **3 members**: `lux-crypto`, `lux-crypto-keccak`, `lux-crypto-secp256k1`. `cargo publish --dry-run -p lux-crypto-secp256k1 --no-verify` fails immediately: `error: readme README.md does not appear to exist`. Crates are not even single-crate publish-ready | Off by 7.7× and not actually publish-ready | EMPIRICAL §9, lines 36–37 |
| "AEAD AES-GCM Metal 26.7× at N=8192" | Mis-attributed cipher — commit `54dad849` is **ChaCha20-Poly1305**, not AES-GCM. AES-GCM was added later in `8180b135` and `dd1da557`. The 26.7× number lives only in commit message + docs/cpu.mdx (no bench JSON). NOT independently reproducible: `aead_metal_bench` outputs `SKIP aead_metal_bench (LUX_CRYPTO_AEAD_METALLIB not set)`. Commit-message-only evidence | Cipher mis-attributed; bench not currently reproducible | EMPIRICAL §3, lines 13–14 |

## 6. Test coverage reality

- **9.4% real GPU determinism** on `crypto`: 3 of 32 algos
  (`secp256k1_gpu_test`, `secp256k1_batch_inv_gpu_test`, `bn254_kat_test`)
  exercise actual byte-equal CPU↔GPU paths unconditionally on M1 Max
  test host. The other 6 of 8 `*_metal_test*` files (sha256, blake2b,
  ripemd160, aead, banderwagon, attestation/composite) gate on
  `LUX_CRYPTO_*_METALLIB` env var and print "skip GPU equality" then
  "ALL TESTS PASSED (GPU skipped)" — i.e., a stub-pass when env is
  unset. Source: EMPIRICAL §4, line 17.
- **17 PASS / 9 Not Run** out of 26 ctest registrations on `crypto`.
  bn254 + banderwagon + gpukit-* binaries exist but ctest fails to
  find them under the registered build directory layout — registration
  bug. Source: EMPIRICAL §8, line 34.
- **`crypto` worktree dirty** at audit time: `banderwagon/gpu/cuda/banderwagon.cu`
  modified on `cabi-wire-complete-2026-04-28`; ctest was deliberately
  not run to avoid contaminating in-flight work. Branch-claimed
  byte-equal-to-CPU-oracle KATs are **untested at audit time** and
  must be verified post-merge in CI. Source: BRANCH-AUDIT §2 "Tests",
  lines 99–104.
- **`lux/fhe/policy/` does not exist** — five separate test-count
  claims ("67/67", "12", "28 rule_engine subcases", "5.2s policy
  eval", "fhe/policy + 8 mpc/pkg/policy") reference a non-existent
  directory. Source: RED §B5, lines 95–107.
- **G3 BatchEvaluate 4.61× under -race** — UNVERIFIABLE on M1 Max
  within session bounds: bench process ran > 13 minutes wall-clock
  in state `R`, no output (PID 55208, 558 MB resident). In-tree
  harness is correct; the published number cannot be re-measured
  here. Commit-message evidence only. Source: EMPIRICAL §10, line 40.

## 7. Rust crates reality

`/Users/z/work/lux/crypto/rust/Cargo.toml` workspace declares **3
members**: `lux-crypto`, `lux-crypto-keccak`, `lux-crypto-secp256k1`.
No 23-crate listing exists anywhere in the workspace. Source: EMPIRICAL
§9, lines 36–37.

`cargo publish --dry-run -p lux-crypto-secp256k1 --no-verify` fails
immediately with `error: readme README.md does not appear to exist`.
The crates are not single-crate publish-ready, let alone 23.

The "23 publish-ready" claim is **pending finalize from #211**; until
then, treat as 3 (and not yet publish-ready).

## 8. Brand-neutral residuals

Re-running the residual sweep on `crypto` HEAD `181d18c6`:

```
grep -rn "LUX_" --include="*.{cpp,hpp,h,mm,go,metal,cmake}" \
     | grep -v build | grep -v _deps | grep -v docs/out
```

returns **380 hits across 78+ files**. Sample non-legitimate residuals
quoted from EMPIRICAL §5, line 20:

- `aead/c-abi/c_aead.cpp:1:#include "lux_crypto.h"`
- `bn254/c-abi/c_bn254.cpp:6:#include "lux_crypto.h"`
- `slhdsa/c-abi/c_slhdsa.cpp:1:#include "lux_crypto.h"`
- `bn254/gpu/metal/zk_metal.mm:61:@"/usr/local/share/lux/crypto/lux_crypto.metallib"`

These are real header / path identifiers, not just CMake function
names. The "240 → 24" claim does not match current state. The
`brand-neutral-final-sweep-2026-04-27` branch is the merge that pushes
this number toward zero (BRANCH-AUDIT §2 leaf table; MERGE §step 1).

## 9. Action plan — what blocks LP-137 v1.0 + ordered TODO

Until the eight critical-path branches land on their respective `main`s,
LP-137 docs assert behavior the main branches do not yet exhibit.
Eight merges, one build defect to fix in `lux/mpc`, one go.sum drift
to reconcile in workspace, and one stale branch to delete (BRANCH-AUDIT
§"Critical-path branches", lines 198–212).

### Ordered TODO (DAG-aware, do not reorder)

Source: LP-137-WORK-BRANCH-AUDIT.md §"Recommended merge order", lines
171–180; cross-checked against LP-137-MERGE-RECONCILIATION.md
§"Recommended merge order".

1. **`luxcpp/crypto` kernels — bottom-up.** Land in this order:
   `evm256-precompiles-cabi` → `deps-bootstrap` → `fork-swap-luxfi-deps`
   → `bn254-cuda-wgsl` / `sha256-cuda-wgsl` / `aead-cuda-wgsl` /
   `pedersen-cuda-wgsl` / `poseidon-cuda-wgsl` / `ripemd160-cuda-wgsl`
   / `blake2b-cuda-wgsl` / `lamport-gpu` / `poseidon-bn254` /
   `ntt-poly-mul-cpp-cpu` → `brand-neutral-crypto` →
   `brand-neutral-final-sweep` → `banderwagon-msm-vt-doc-2026-04-28`.
   17 leaves collapse into one octopus or into the leaf with the
   deepest stack (`aead-cuda-wgsl`, then re-evaluate).
2. **`lux/crypto` Rust mirror.** `c-abi-prefix-uniform` (absorbs
   verkle/banderwagon/rust-crates-batch) → `bls-rust` →
   `blake3-vanilla` → `brand-neutral-final-sweep`. Depends on
   luxcpp/crypto C-ABI prefix landing.
3. **`luxcpp/lattice`** `feat/lp-137-types`. Depends on luxcpp/crypto
   types being settled.
4. **`lux/lattice`** `feat/lp-137-types`. Depends on luxcpp/lattice +
   workspace `go.sum` reconciliation
   (`/Users/z/work/lux/evm/go.sum` checksum mismatch on
   `luxfi/consensus@v1.22.70`).
5. **`lux/threshold`** `feat/tfhe-committee-canonical`. Depends on
   `lux/lattice`; rebase 4 commits, retest.
6. **`lux/mpc` stack.** Only after threshold lands. Land in DAG
   order: `canonical-intent` → **fix gas-station defect** (commit
   missing `airgap_*.go` + `hsm_signer_config.go`) →
   `canonical-intent-cto` → `fhe-verifier` → `fhe-threshold-decryptor`
   → `policy-canonical-tfhe-import`. `ci/arc-hanzo-consolidation`
   rebases and lands at any time.

### Pre-merge required fixes (Red-blocking, do these first)

From LP-137-RED-AUDIT.md §"Fix priority for Blue", lines 234–252:

1. **(BLOCKING)** Fix import path in
   `mpc/pkg/policy/fhe_threshold_decryptor.go:32`:
   `github.com/luxfi/fhe/threshold` → `github.com/luxfi/fhe/pkg/threshold`.
   Re-run `go test -count=1 ./...` from `/Users/z/work/lux/mpc`.
2. **(BLOCKING)** Restore or delete `slhdsa/test/`, `blake3/test/`,
   `blake3/test/vectors/test_vectors.json`. If deleted intentionally,
   remove the corresponding CMake `add_executable` and the Rust
   `include_str!` reference.
3. **(BLOCKING)** Restore `lux/fhe/policy/` package, or retract
   claims #114 / #119 / #110-corrected, and remove the import in
   `mpc/pkg/policy/fhe_verifier.go` if it depends on a phantom.
4. **(HIGH)** Implement blake3 / slhdsa / lamport public C-ABI
   bodies, or remove them from the published header.
5. **(HIGH)** Ship CDS noise proof or document that `PartyKeys=nil`
   path is unreachable.
6. **(MEDIUM)** Add CTest registration for Montgomery byte-equal vs
   Lattigo at the claimed 12,288-vector scale, or retract the claim.
7. **(MEDIUM)** Commit `poly_mul/c-abi`, `poseidon/c-abi`, `ntt/cpp/`,
   `ntt/test/` working-tree changes or revert.

### Stale branch to abandon

`lux/threshold` `lss-dynamic-resharing`: 165 commits **behind** main,
last commit Aug 2025, parent commit message says "strip out broken
dynamic resharing (tbd)". **ABANDON** — superseded entirely by
mainline LSS implementation. Source: BRANCH-AUDIT §6, lines 156–159.

### Definition-of-done for LP-137 v1.0

LP-137 v1.0 ships when:

1. The 8 critical-path branches are all merged to their respective
   `main`s with CI green on amd64+arm64.
2. All 5 Red blocking findings are resolved.
3. C-ABI on `luxcpp/crypto` HEAD shows ≤ 9 NOTIMPL (not 21), per
   MERGE §"Recommended merge order" projection: "20 wired / 9 NOTIMPL".
4. Empirical breadth claims are restated to match audited reality:
   real algo dirs (32, not 27), real GPU-test coverage (3/32 = 9.4%
   today; target after merges is the actual count of
   `*_gpu_test|*_metal_test` files that don't gate on
   `LUX_CRYPTO_*_METALLIB`), real Rust crate count (3 today,
   updated number from #211 finalize), real `LUX_` residual count
   (target ≤ 24 only after `brand-neutral-final-sweep` lands).
5. `lux/fhe/policy/` either exists with its claimed test counts or
   the claims are retracted from every doc that references them.
6. The CDS noise proof ships, or `PartyKeys=nil` is documented as
   unreachable and enforced (panic / hard error) at the call site.

## Sources

All source files are in `/Users/z/work/lux/lps/`:

- `LP-137-MERGE-RECONCILIATION.md` (audit @ commit `153d3908`)
- `LP-137-WORK-BRANCH-AUDIT.md` (audit @ commit `2c8726e1`)
- `LP-137-EMPIRICAL-AUDIT.md` (audit @ commit `2c8726e1`)
- `LP-137-FINAL-SURVEY.md` (audit @ commit `2c8726e1`)
- `LP-137-RED-AUDIT.md` (audit @ commit `2c8726e1`)
- `LP-137-CRYPTO-ARCHITECTURE.md` (partly aspirational; see §3 of
  MERGE for the deltas needed to reconcile)

Underlying repo HEADs cited:

- `luxcpp/crypto` `origin/main` `6eb3791c`
- `luxcpp/crypto` `cabi-wire-complete-2026-04-28` `181d18c6` (audit-time worktree)
- `lux/lattice` `feat/lp-137-types` `d11ec53c`
- `lux/threshold` `feat/tfhe-committee-canonical` `727f8d75`
- `lux/mpc` `feat/policy-canonical-tfhe-import` `3ebdd5a` (build-broken at apex)
- `lux/crypto` `pedersen-seed-2026-04-27` `c673db6`
