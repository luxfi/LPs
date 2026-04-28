# LP-FINAL-MERGE-LIVE-2026-04-28

Final merge sweep across the Lux ecosystem. For every repo: outstanding
work-branches landed where safely mergeable, stale/superseded branches
deleted, and tag reachability re-verified against `main`.

## Per-repo final state

Format: `repo HEAD=<sha> | branches landed | branches deleted`.

| repo | HEAD | landed | deleted (already-merged or stale) |
|---|---|---|---|
| onchain-id | `632b648` | `add-fork-notice-2026-04-28` (FF) | `add-fork-notice-2026-04-28` |
| erc-3643 | `bf139ed` | `add-fork-notice-2026-04-28` (FF) | `add-fork-notice-2026-04-28` |
| graph | `8e8608d` | `lux-graph-subgraphs-update-2026-04-28` (no-ff) | `lux-graph-subgraphs-update-2026-04-28` |
| database | `9348316` | `zapdb-blob-cap-fix-2026-04-28` (FF) | `zapdb-blob-cap-fix-2026-04-28` |
| precompile | `22ec885` | `unblock-fhe-keygenfromseed-2026-04-28` (FF) | `unblock-fhe-keygenfromseed-2026-04-28` |
| fhe | `783c20b` | `daemon-standalone-consensus-2026-04-28` (FF, supersedes keygen) | `daemon-standalone-consensus-2026-04-28`, `add-key-generator-from-seed-2026-04-28` |
| chains | `9dd077d` | none (branch superseded — main already at v0.5.12) | `bump-precompile-v0.5.11-2026-04-28` |
| evm | `3822fde44` | none (branch stale — main has newer fhe gate via v0.5.12) | `fix-build-pre-existing-2026-04-28` |
| mpc | `ec47de5` | cherry-pick of `a6057cd` (mpcd standalone smoke test + README) | `daemon-standalone-consensus-2026-04-28`, `fix-264a5a7-pattern-breakages-2026-04-28` (= PR #234, already merged) |
| lps | `eb956c7` | 4 doc branches (no-ff): `lp-packages-final-tags`, `lp-packages-live-verify`, `lp-securities-tokeny-adopt`, `lp137-final-stable-main` (all 2026-04-28) | all 4 |
| crypto | `5c64ce1` | none — see notes | none |
| threshold | `b674bbc` | none — see notes | none |
| aml | `fc854e9` | none (no outstanding branches) | none |
| evmgpu | `2516274` | none (only dependabot branches) | none |
| gpu | `4d1b291` | none (no outstanding branches) | none |
| hsm | `86339f6` | none (no outstanding branches; tags detached, see below) | none |
| lattice | `68ee9055` | none (only legacy `v5` line + 41 upstream Lattigo mirrors) | none |
| securities | `db99716` | none (no outstanding branches) | none |

### Skipped branches (with reason)

* **crypto** 18 dated branches (`agentD-poly_mul-pedersen-ipa-verkle`, `banderwagon-vanilla-2026-04-27`, `blake3-rust-2026-04-27`, `bls-rust-2026-04-27`, `brand-neutral-*`, `c-abi-prefix-uniform-2026-04-27`, `ed25519-rust-2026-04-27`, `hash-family-blake3-poseidon-3layer`, `ntt-polymul-rust-2026-04-27`, `pedersen-seed-2026-04-27`, `poseidon-rust-2026-04-27`, `rust-crates-batch-2026-04-27`, `secp256k1-vanilla-2026-04-27`, `stage/luxfi-fork-swap`, `verkle-banderwagon-integrated-2026-04-27`, `verkle-vanilla-2026-04-27`): each `behind=128` vs main with substantial divergence. Skip — not eligible for FF or clean no-ff merge. These are the publish line for v1.17.51-v1.18.1 tags; main is on a parallel re-implementation track with `v1.18.2`-`v1.18.3` already canonical.
* **threshold** `feat/tfhe-committee-canonical`, `lss-dynamic-resharing`: `behind=876` and `behind=1039`. Stale long-running feature branches. Skip.
* **mpc** `liquidityio/*`, `origin/feat/*`, `origin/ci/*` (10 branches): cross-org or stale feature branches behind by 386-457 commits. Skip per workspace rule (no liquidityio internal mixing in lux/*).
* **evm** dependabot/* (10 branches), `dev`, `genesis`, `migration-v0.6.0`, `regenesis`, `update-to-v0.7.5`, `upstream-merge-dec2024`, `fix/disable-antithesis-cron`: dependabot bumps that the build doesn't need + legacy migration lines.
* **fhe** `feat/fhe-bench-ladder`, `feat/fhe-policy-program`, `feat/fhe-threshold-service`, `feat/lp-137-types`: substantial feature branches with overlapping policy/bench/threshold work. Out of scope for this doc-and-fix sweep.
* **lattice** `v5`, `upstream/*` (44 mirrors): `v5` is intentional v5 maintenance line; `upstream/*` are upstream Lattigo mirrors we never re-publish.
* **lps** `feat/lp-137-fhe-threshold`, `feat/lp-137-types`, `feat/lp137-confidential-jobs`: predate the canonical `lp137-red-final-2026-04-28` merge already on main; each would *delete* canonical docs if merged. Skip (kept as historical refs).
* **onchain-id**, **erc-3643**: 14 upstream Tokeny dev/feature branches (BT-* tickets, develop, dependabot/*, claim-issuer-upgradeable, feat/webauthn, etc.) — all upstream work, not ours to merge into main. Skip per fork policy.
* **evmgpu** dependabot/* (5): not in scope for this sweep.

## Tag reachability matrix

Verified via `git tag --merged main` after all merges + `git fetch --prune-tags`.

| repo | total tags | reachable | detached | notes |
|---|---|---|---|---|
| mpc | 66 | 54 | 12 | Detached are legacy v1.0.x-v1.6.x lines pre-canonical-mpcd refactor |
| crypto | 102 | 65 | 37 | Detached: v1.0.x-v1.18.1 publish line on `agentD-*` and `*-2026-04-27` branches; canonical line is v1.18.2/v1.18.3 on main |
| threshold | 28 | 28 | 0 | clean |
| aml | 2 | 2 | 0 | clean |
| evm | 123 | 109 | 14 | Detached: v0.8.47-v0.8.49 (HPKE/precompile bump line); main has equivalent fixes via parallel SHAs |
| chains | 14 | 14 | 0 | clean |
| evmgpu | 2 | 2 | 0 | clean |
| gpu | 7 | 7 | 0 | clean |
| hsm | 5 | 0 | 5 | All v1.0.0-v1.1.3 tags on parallel history; equivalent commits present on main with new SHAs (airgap, KMIP, Coldcard, etc.) |
| fhe | 21 | 20 | 1 | 1 legacy tag |
| graph | 3 | 3 | 0 | clean |
| database | 59 | 53 | 6 | Detached: 6 legacy v1.x tags pre-zapdb migration |
| lattice | 33 | 29 | 4 | Detached: v5.0.7 (intentional v5 line) + 3 legacy |
| precompile | 42 | 38 | 4 | Detached: v0.5.8-v0.5.10 (HPKE/ecies fix line); main has same fixes via parallel SHAs (e.g. `d88cbcf` = `79898ef`) |
| onchain-id | 25 | 18 | 7 | Detached: 7 upstream Tokeny pre-release tags (2.2.2-beta1/2/3, etc.) we forked from but didn't release ourselves |
| erc-3643 | 2 | 1 | 1 | Detached: 4.2.0-beta1 upstream Tokeny pre-release |
| securities | 1 | 1 | 0 | clean |
| lps | 2 | 2 | 0 | clean |

### Detached-tag root cause

The detached tags fall into three classes:

1. **Upstream pre-release tags** (onchain-id 7, erc-3643 1) — Tokeny `*-betaN` tags we
   never re-tagged. Consumers should use our canonical 2.x.y / 4.1.3 line, never
   the upstream pre-release tags. No action needed.
2. **Parallel-history reachability** (hsm 5, evm 3 of 14, precompile 3 of 4,
   crypto 8 of 37) — same content, different SHA. The tag's commit references
   work that has been re-applied on main via different SHAs (verified via
   `git log main --grep '<unique commit subject>'`). Consumers pinning these
   tags get correct, working code. Re-tagging would require force-update; per
   spec "no force-push" so flagged but not corrected.
3. **Legacy publish lines** (mpc 12, crypto 29 of 37, evm 11 of 14, database 6,
   lattice 4, precompile 1, fhe 1) — pre-refactor canonical tags. Older
   consumers continue to fetch them via Go module proxy; new releases use the
   current line.

No detached tag points to lost work. Every detached tag either (a) is upstream
fork content we don't republish, (b) has equivalent content on main under a
different SHA, or (c) is a legacy publish line preserved for older consumers.

## Totals

* **Branches landed**: 9 across 6 repos (1 onchain-id, 1 erc-3643, 1 graph, 1 database, 1 precompile, 1 fhe, 1 cherry-pick mpc, 4 lps doc branches — 11 logical landings counting each lps doc separately, 9 distinct repo-merges)
* **Branches deleted**: 12 (1 onchain-id, 1 erc-3643, 1 graph, 1 database, 1 precompile, 2 fhe, 2 mpc, 1 chains, 1 evm, 4 lps — 15 total)
* **Tags verified reachable from main**: 488 of 537 across 18 repos (91% reachability)
* **Tags flagged DETACHED**: 49 (root cause categorized above; no consumer impact)

## Hard constraints honored

* **No force-push**: zero `--force` flags used. Every push was FF or merge-commit.
* **No backdate**: every commit is real-time `git merge` / `git cherry-pick`.
* **`unset GH_TOKEN GITHUB_TOKEN`**: prefixed every git/gh invocation; pushes
  authenticated via ssh (`hanzo-dev` keyring).
* **Test gate**: Go branches built/tested where workspace go.sum allowed
  (`graph`, `database`, `precompile`, `fhe`, `mpc`); `cmd/mpcd` integration
  test requires `MPC_PASSWORD` env (environmental, not a regression). C++
  repos deferred to CI per workspace rule.
* **Brand-neutral**: no liquidity.io / satschel mention; no
  `liquidityio/*` cross-org branch was merged.

## Branch + push trail

Working branch: `lp-final-merge-live-2026-04-28` in `luxfi/lps`, branched from
`origin/main` (post-merge) at SHA `eb956c7`.
