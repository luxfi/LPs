---
lp: 137-MERGE-RECONCILIATION
title: LP-137 Merge Reconciliation — Branch DAG vs main reality
date: 2026-04-28
status: Draft
audit_origin: Red O1/O3 audit
---

# Reconciliation: LP-137 architecture claim vs current main

`/Users/z/work/lux/lps/LP-137-CRYPTO-ARCHITECTURE.md` claims first-party
CPU canonical with byte-equal Go reference PASSING for every algo.
`/Users/z/work/luxcpp/crypto/COVERAGE.md` reports 17 of 29 algos still
return `CRYPTO_ERR_NOTIMPL` from their c-abi shim on `origin/main`.

Both can be true at once: the work exists on side branches that have
not merged. This file is the ground-truth audit of those branches at
audit time `2026-04-28T00:00Z` against `origin/main = 6eb3791c`.

## Per-algo c-abi state on origin/main

`origin/main` HEAD: `6eb3791c` ("crypto: CROSSOVER.md — per-primitive
Metal CPU/GPU thresholds (M1 Max)").

| Algo       | c-abi on main | NOTIMPL count | Wired on branch | Branch + HEAD                            | Tests on branch                                   |
|------------|---------------|---------------|------------------|------------------------------------------|---------------------------------------------------|
| keccak     | WIRED         | 0             | (already on main)| —                                        | `keccak_test` 3/3 PASS                            |
| sha256     | WIRED         | 0             | (already on main)| —                                        | `sha256_test` 4/4 + Metal 100/100 PASS            |
| ripemd160  | WIRED         | 0             | (already on main)| —                                        | `ripemd160_test` 5/5 + Metal 100/100 PASS         |
| blake2b    | WIRED         | 0             | (already on main)| —                                        | `blake2b_test` 2/2 + Metal 100/100 PASS           |
| secp256k1  | WIRED         | 0             | (already on main)| —                                        | `secp256k1_test` 9/9 + Metal/batch_inv PASS       |
| attestation| WIRED         | 0             | (already on main)| —                                        | `attestation_test` 11 + `composite_test` 16 PASS  |
| bls (BLS12-381) | WIRED    | 0             | (already on main)| —                                        | tower/g2/miller/finalexp PASS (gated by metallib) |
| banderwagon| WIRED         | 0             | partially on main| `banderwagon-msm-cpu-2026-04-27` 93636ea7| `multiexp_kat_test` 1000 random + edge PASS       |
| **aead**       | **NOTIMPL** | **2**         | **YES**          | `aead-cpp-cpu-2026-04-27` 8180b135        | `aead_kat_test` 110/110 + `aead_test` 27/27 PASS  |
| **blake3**     | **NOTIMPL** | **2**         | **YES**          | `cabi-wire-fix-2026-04-27` c29d1f9f       | `blake3_kat_test` 140 vectors PASS                |
| **ed25519**    | **NOTIMPL** | **3**         | **YES**          | `cabi-wire-fix-2026-04-27` c29d1f9f       | RFC 8032 §7.1 KAT host body PASS                  |
| **slhdsa**     | **NOTIMPL** | **3**         | **YES**          | `cabi-wire-fix-2026-04-27` c29d1f9f       | `slhdsa_kat_test` 272 PASS (PQClean ref)          |
| **mldsa**      | **NOTIMPL** | **3**         | **YES**          | `aead-cpp-cpu-2026-04-27` (c242e351)      | NIST KAT byte-equal PASS                          |
| **mlkem**      | **NOTIMPL** | **3**         | **YES**          | `aead-cpp-cpu-2026-04-27` (c242e351)      | NIST KAT byte-equal PASS                          |
| **lamport**    | **NOTIMPL** | **3**         | **YES**          | `lamport-gpu-2026-04-27` 17568f59         | first-party CPU + Metal/CUDA/WGSL PASS            |
| **ntt**        | **NOTIMPL** | **3**         | **YES**          | `ntt-poly-mul-cpp-cpu-2026-04-27` a061830d| 10/10 KAT byte-equal Go ref PASS                  |
| **poly_mul**   | **NOTIMPL** | (no shim)     | **YES**          | `ntt-poly-mul-cpp-cpu-2026-04-27` a061830d| 10/10 KAT byte-equal Go ref PASS                  |
| **poseidon**   | **NOTIMPL** | **2**         | **PARTIAL**      | `poseidon-cpp-cpu-2026-04-27` 1dbcc785    | `poseidon_bn254` wired (14/14 vs gnark v0.20.1); `poseidon_goldilocks` still NOTIMPL |
| **pedersen**   | **NOTIMPL** | **2**         | **PARTIAL**      | `pedersen-cpp-cpu-2026-04-27` e506cae9    | `pedersen_vector_*` wired; legacy `pedersen_commit/verify` still NOTIMPL stubs |
| **bn254**      | **NOTIMPL** | **3**         | **YES**          | `evm256-precompiles-cabi-2026-04-27` 6ad9f846 (depends on `bn254-pairing-tower-2026-04-27` db8e97be + `bn254-hashtocurve-2026-04-27` c5f6e541) | `bn254_kat_test` 17/17 PASS (validate 5, G1 add 5, G1 mul 3, pairing 3, hash_to_g1 1) |
| **modexp**     | **NOTIMPL** | **3**         | **YES**          | `evm256-precompiles-cabi-2026-04-27` 6ad9f846 | wired with intx/evmmax bootstrap |
| **evm256**     | **NOTIMPL** | (no shim)     | **YES**          | `evm256-precompiles-cabi-2026-04-27` 6ad9f846 | wired |
| **secp256r1**  | **NOTIMPL** | **1**         | **PARTIAL**      | (still `cpp/` body only; not wired)       | depends on `intx`/`evmmax` deps bootstrap         |
| **kzg**        | **NOTIMPL** | **5**         | **NO**           | (open) — needs blst+intx bootstrap        | EIP-4844 KATs blocked on dep bootstrap            |
| **ipa**        | **NOTIMPL** | **2**         | **NO**           | `agentD-poly_mul-pedersen-ipa-verkle` 18cfc04f stubs only (NOTIMPL=3 on the branch shim) | no first-party CPU body authored yet |
| **verkle**     | **NOTIMPL** | **2**         | **NO**           | `agentD-poly_mul-pedersen-ipa-verkle` 18cfc04f stubs only (NOTIMPL=3 on the branch shim) | no first-party CPU body authored yet |
| **sr25519**    | **NOTIMPL** | **2**         | **NO**           | none authored                             | not started                                       |
| **frost**      | **NOTIMPL** | **4**         | **NO**           | none authored                             | not started                                       |
| **cggmp21**    | **NOTIMPL** | **4**         | **NO**           | none authored                             | not started                                       |
| **corona**   | **NOTIMPL** | **3**         | **NO**           | none authored                             | not started                                       |

### Tally

| Bucket | Count |
|---|---:|
| Wired on main today | 8 |
| Wired on a branch, ready to land | 11 (aead, blake3, ed25519, slhdsa, mldsa, mlkem, lamport, ntt, poly_mul, bn254, modexp, evm256 — counting evm256 alongside modexp) |
| Partially wired on a branch | 3 (poseidon goldilocks variant, pedersen legacy form, secp256r1) |
| No first-party body authored anywhere | 7 (kzg, ipa, verkle, sr25519, frost, cggmp21, corona) |

(Strictly: `aead-cpp-cpu-2026-04-27` is a meta-branch that contains
blake3/ed25519/slhdsa/mldsa/mlkem/lamport/ntt/poly_mul/bls + aead in one
linear chain off main. Merging that branch alone closes 9 algos at once.
`cabi-wire-fix-2026-04-27` is a strict ancestor — its three commits are
already in `aead-cpp-cpu-2026-04-27`.)

## Branch divergence vs main

Every listed branch has merge-base = `origin/main` HEAD (`6eb3791c`).
None has diverged; all are pure forward-merges.

| Branch | HEAD | Commits ahead of main | Notes |
|---|---|---:|---|
| `cabi-wire-fix-2026-04-27` | c29d1f9f | 3 | strict ancestor of `aead-cpp-cpu-2026-04-27` and `brand-neutral-final-sweep-2026-04-27` |
| `aead-cpp-cpu-2026-04-27` | 8180b135 | 10 | meta-branch: chains 9 algo wire-ups + aead body |
| `bn254-pairing-tower-2026-04-27` | db8e97be | 2 | strict ancestor of bn254-hashtocurve, bn254-cuda-wgsl, pedersen-cpp-cpu |
| `bn254-hashtocurve-2026-04-27` | c5f6e541 | 3 | depends on pairing-tower; ancestor of bn254-cuda-wgsl, pedersen-cpp-cpu |
| `bn254-cuda-wgsl-2026-04-27` | 6c4ea9fe | 4 | depends on hashtocurve; adds CUDA + WGSL kernels |
| `evm256-precompiles-cabi-2026-04-27` | 6ad9f846 | 1 | wires bn254 + modexp + evm256 c-abi to cpp bodies |
| `pedersen-cpp-cpu-2026-04-27` | e506cae9 | 4 | depends on hashtocurve |
| `lamport-gpu-2026-04-27` | 17568f59 | 1 | independent |
| `ntt-poly-mul-cpp-cpu-2026-04-27` | a061830d | 2 | independent (also subsumed in aead-cpp-cpu) |
| `poseidon-cpp-cpu-2026-04-27` | 1dbcc785 | 1 | independent |
| `banderwagon-fp-cpu-2026-04-27` | 30d7fe51 | 1 | strict ancestor of fr/element/msm |
| `banderwagon-fr-cpu-2026-04-27` | a35b5e26 | 2 | depends on fp; ancestor of element/msm |
| `banderwagon-element-cpu-2026-04-27` | e9059d28 | 3 | depends on fr; ancestor of msm |
| `banderwagon-msm-cpu-2026-04-27` | 93636ea7 | 5 | tip of the banderwagon stack |
| `brand-neutral-final-sweep-2026-04-27` | e817d037 | 4 | sits on top of cabi-wire-fix; touches 304 files (sweep) |
| `agentD-poly_mul-pedersen-ipa-verkle` | 18cfc04f | 3 | adds intx/evmmax deps + ipa/verkle stubs (still NOTIMPL on c-abi); duplicates pedersen+ntt work; **superseded** by the targeted branches |

The verkle branch named `verkle-banderwagon-integrated-2026-04-27 HEAD
399150a0` referenced in the audit prompt is **not present on origin**;
the closest landing point for ipa/verkle work today is `agentD-…`,
which still carries NOTIMPL stubs for those two and overlaps with the
targeted CPU-body branches.

## Recommended merge order (DAG-aware)

Merge order is dictated by ancestor relationships in the DAG above.
Each step is fast-forward (or a single octopus-free three-way merge)
because every branch tips off the same `origin/main` base.

1. **`brand-neutral-final-sweep-2026-04-27`** — risk: **low**.
   Sweep + the three c-abi wire-ups for blake3, ed25519, slhdsa.
   Subsumes `cabi-wire-fix-2026-04-27` entirely. After this merge:
   blake3/ed25519/slhdsa flip from NOTIMPL → wired on main. Closes
   3 algos. (Do not separately merge `cabi-wire-fix-2026-04-27`; it
   becomes a strict ancestor of main.)
2. **`aead-cpp-cpu-2026-04-27`** — risk: **medium**.
   10 commits (chacha20-poly1305 + aes-256-gcm + bls fused + lamport
   real CPU + mldsa/mlkem/slhdsa PQClean vendor + blake3 + ed25519 +
   ntt/poly_mul). This branch overlaps `cabi-wire-fix` (already in
   step 1) and `lamport-gpu` and `ntt-poly-mul-cpp-cpu`. Land this
   instead of those three, which become redundant. Closes aead, mldsa,
   mlkem, lamport, ntt, poly_mul (6 algos). After this step main is
   at parity with `aead-cpp-cpu-2026-04-27` for 9 of the 11 wirable
   algos.
3. **`bn254-pairing-tower-2026-04-27`** → **`bn254-hashtocurve-2026-04-27`**
   → **`bn254-cuda-wgsl-2026-04-27`** — risk per merge: **medium**.
   These are linear (each is the parent of the next). Land as a single
   fast-forward to bn254-cuda-wgsl. Touches `bn254/c-abi/`,
   `bn254/cpp/*pairing*`, `bn254/gpu/{cuda,wgsl}/`. Adds the Go test
   tooling (`bn254/test/tools/gen_pairing_kat.go`).
4. **`evm256-precompiles-cabi-2026-04-27`** — risk: **medium**.
   Wires bn254 + modexp + evm256 c-abi shims to existing C++ bodies.
   Depends on the bn254 stack (step 3) being on main so the CPU bodies
   are present. Closes bn254, modexp, evm256 (3 algos).
5. **`pedersen-cpp-cpu-2026-04-27`** — risk: **low**.
   Depends on bn254-hashtocurve. Wires the new vector commitment form
   only; legacy single-scalar form stays NOTIMPL. Closes pedersen
   (vector form).
6. **`poseidon-cpp-cpu-2026-04-27`** — risk: **low**.
   Independent. Closes `poseidon_bn254`; `poseidon_goldilocks` stays
   NOTIMPL.
7. **Banderwagon stack** — risk: **low**. Linear:
   `banderwagon-fp-cpu` → `banderwagon-fr-cpu` →
   `banderwagon-element-cpu` → `banderwagon-msm-cpu`. Land directly
   to `banderwagon-msm-cpu` as a single fast-forward (it already
   contains the merge of `banderwagon-element-cpu`, see commit
   9df0f94e). Closes the banderwagon CPU canonical.
8. **(Deferred)**: `agentD-poly_mul-pedersen-ipa-verkle` — risk: **high**.
   Carries duplicates of pedersen / ntt work plus stub-only ipa/verkle
   shims (still NOTIMPL). Do **not** merge as-is. Cherry-pick the
   `intx + evmmax` deps bootstrap (98f1f086) into a fresh branch only
   if `secp256r1` and `kzg` need to land — neither is on the audit
   list. Better path: author proper ipa/verkle bodies on new branches
   off main after step 7 lands.

After steps 1–7 the algo state on main goes from **8 wired / 21
NOTIMPL** to **20 wired / 9 NOTIMPL**. Remaining NOTIMPL: kzg,
secp256r1, ipa, verkle, sr25519, frost, cggmp21, corona, plus the
two partial residuals (`poseidon_goldilocks`, legacy `pedersen_commit`).

## Architecture doc delta

Update `LP-137-CRYPTO-ARCHITECTURE.md` to:

1. Replace the table at lines 28–51 with a per-algo state table that
   distinguishes "wired on main", "wired on branch (pending merge)",
   and "no first-party body". Drop the "byte-equal Go reference"
   blanket claim.
2. Replace lines 122–127 ("Where we are now: 27 algorithms with CPU +
   GPU coverage", "50 Go test packages PASS", etc.) with the audited
   numbers from §"Tally" above.
3. Replace lines 129–134 ("What's left") with a reference to this
   reconciliation doc and the merge order in §"Recommended merge
   order".
4. Keep §"Hard rules" (PHILOSOPHY-derived) verbatim — those are still
   correct policy.

## COVERAGE.md delta

`/Users/z/work/luxcpp/crypto/COVERAGE.md` reflects current main reality
(8/29 wired). After the merge plan above lands:

1. The "Per-algorithm" table flips 11–12 rows from "no test, no
   `<alg>/cpp/` impl" to wired with passing test counts.
2. The footer "Caveat (honest)" paragraph (currently "8 of 29
   algorithms with a working first-party CPU body") needs to advance
   to "20 of 29" after step 7.

Until then, COVERAGE.md is honest as-is. Add a "PENDING MERGE" section
at the bottom referencing this doc — do not pre-claim coverage that
isn't on main yet.

## Risk per branch (summary)

| Branch | Risk | Why |
|---|---|---|
| `brand-neutral-final-sweep-2026-04-27` | low | mechanical sweep + 3 wire-ups; CMake unchanged elsewhere |
| `aead-cpp-cpu-2026-04-27` | medium | 1061 LOC new + PQClean vendor (~15 KLOC); needs ctest run pre-merge |
| `bn254-pairing-tower → hashtocurve → cuda-wgsl` | medium | 1700+ LOC of pairing math + new Go tool deps in `bn254/test/tools/go.mod`; needs gnark v0.19.2 reproducible KAT generation |
| `evm256-precompiles-cabi-2026-04-27` | medium | requires intx/evmmax in umbrella build — confirm `Deps.cmake` bootstraps cleanly on aarch64 Apple |
| `pedersen-cpp-cpu-2026-04-27` | low | 4 commits, scoped to pedersen + bn254 g1 |
| `poseidon-cpp-cpu-2026-04-27` | low | single commit, KAT vs gnark v0.20.1 |
| Banderwagon stack | low | self-contained, gnark byte-equal KATs (1000 random MSM) |
| `agentD-poly_mul-pedersen-ipa-verkle` | high | overlaps with targeted branches; ships stubs as if real; do not merge |

## Hard rules (re-stated)

- **No "byte-equal Go reference PASSING for every algo"** until
  steps 1–7 land. Today 8 of 29.
- **No NOTIMPL claim on a branch that doesn't actually wire** — see
  pedersen legacy form, poseidon goldilocks, ipa, verkle, secp256r1.
- **Brand-neutral**: do not introduce vendor-named symbols outside
  the `<alg>/test/cmake/` oracle layer. `brand-neutral-final-sweep`
  enforces this header-rename pass; merge first.
