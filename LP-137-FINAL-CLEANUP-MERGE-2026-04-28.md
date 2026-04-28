---
lp: 137
title: Final Cleanup + Merge Sweep
status: Operational
date: 2026-04-28
branch: lp137-final-cleanup-2026-04-28
---

# LP-137 — Final Cleanup + Merge Sweep (2026-04-28)

Direct-to-main merge sweep across six repos, followed by branch + worktree
pruning and AI-slop scrub. No force-push, no PRs. Per-branch FF-or-no-FF
with `--allow-unrelated-histories`. Conflict + abort + log + continue.
Go test gate where `go.mod` exists; C++ workspaces gated by CI only.

Active GitHub account: `hanzo-dev` (verified `gh auth status --active`).
Hard constraint `unset GH_TOKEN GITHUB_TOKEN` honoured throughout.

## 1. Per-repo merge counts

| Repo               | MERGED-FF | MERGED-NO-FF | SKIPPED-CONFLICT | MISSING | TOTAL |
|--------------------|-----------|--------------|------------------|---------|-------|
| `luxcpp/crypto`    |     1     |      3       |        33        |    1    |  38   |
| `lux/crypto`       |     1     |      0       |        11        |    0    |  12   |
| `lux/mpc`          |     1     |      0       |         5        |    0    |   6   |
| `lux/threshold`    |     0     |      3       |         0        |    0    |   3   |
| `lux/hsm`          |     1     |      1       |         0        |    0    |   2   |
| `lux/lps`          |     1     |      4       |         1        |    1    |   7   |
| **TOTAL**          |   **5**   |   **11**     |     **50**       |  **2**  | **68**|

Notes:
- `MISSING` for `lp137-history-reconstruction-2025-12-25` (lps) was
  expected — it never made it to origin from the refused agent.
- `MISSING` for `c-abi-prefix-uniform-2026-04-27` (luxcpp/crypto) means
  origin no longer has that ref; content is reachable via siblings.

## 2. Final main HEAD per repo

| Repo               | HEAD (short) |
|--------------------|--------------|
| `luxcpp/crypto`    | `b732dda3`   |
| `lux/crypto`       | `3bf31c42`   |
| `lux/mpc`          | `105ed305`   |
| `lux/threshold`    | `b489f98d`   |
| `lux/hsm`          | `86339f6c`   |
| `lux/lps`          | `06075cca`   |

All six repos: `main` clean, pushed to origin, working tree clean.

## 3. Skipped-conflict explanation

The 50 SKIPPED-CONFLICT branches are not silently lost: every one of
them is either

1. **Already content-equivalent in origin/main** (squash-style merges
   landed earlier with different SHAs — git sees overlapping additions
   as add/add conflicts even when content is the same), or
2. **Sibling work touching same file regions** that needs human
   resolution (e.g. `lux/mpc` B4/F3/F4 fix branches conflict with
   sibling registry/attestation refactor; `luxcpp/crypto` GPU kernel
   branches all touch the same `CMakeLists.txt`).

Per spec: "Skip on conflict + log." Logs at `/tmp/merge-*.log` for the
record. No work has been lost — branches are still on origin and can be
manually merged later by the relevant owner.

## 4. Cleanup actions

### 4.1 Worktrees pruned

`luxcpp/crypto` — 24 git worktrees removed (4 in `/private/tmp`, 20 in
`/Users/z/work/luxcpp/`). All `crypto-*-wt/` physical dirs removed, all
worktree refs pruned.

### 4.2 Stale build dirs removed

`luxcpp/crypto` — 40 `build-*/` directories removed (canonical
`./build/` retained). Examples: `build-aead`, `build-banderwagon`,
`build-bls-stage1..3`, `build-bn254-gpu`, `build-bw-cw`, `build-bw-gpu`,
`build-cc-v01`, `build-cov`, `build-h2c`, `build-kzg`, `build-lamport`,
`build-pq`, etc.

### 4.3 OS / agent artefacts removed

All six repos — `.DS_Store` and `nohup.out` files deleted (1 `.DS_Store`
in luxcpp/crypto; 0 elsewhere).

### 4.4 Remote branches deleted

| Repo               | Branches deleted on origin |
|--------------------|----------------------------|
| `luxcpp/crypto`    | 4 (cabi-wire-complete, cpp-deps-migrate-luxcpp, kat-second-oracle, changelog-dec-2025-narrative) |
| `lux/crypto`       | 1 (changelog-dec-2025-narrative) |
| `lux/mpc`          | 1 (changelog-dec-2025-narrative) |
| `lux/threshold`    | 2 (tfhe-mark-unsafe, changelog-dec-2025-narrative) |
| `lux/hsm`          | 2 (hsm-airgap-export, changelog-dec-2025-narrative) |
| `lux/lps`          | 5 (lp137-merge-reconciliation, lp137-work-branch-audit, lp137-actual-state, tfhe-mark-unsafe, pedersen-dst-reconcile) |
| **TOTAL**          | **15** |

Skipped-conflict branches retained on origin so owners can resolve and
re-merge.

### 4.5 Local branches pruned

| Repo               | Local merged-into-main branches deleted |
|--------------------|------------------------------------------|
| `luxcpp/crypto`    | 45 |
| `lux/crypto`       | 20 |
| `lux/mpc`          | 12 |
| `lux/threshold`    | 3 |
| `lux/hsm`          | 0 |
| `lux/lps`          | 1 |
| **TOTAL**          | **81** |

## 5. AI-slop summary

### 5.1 Removed

- **0 markdown files removed.** None of the slop targets named in the
  cleanup spec were present on `lux/lps@main`:
  - `LP-137-FINAL-SURVEY.md` — already absent
  - `LP-137-MEGA-SWEEP.md` — already absent
  - `LP-137-LUXGPU-MIGRATION-2026-04-28.md` — already absent
- **41 stale build directories removed** (40 in luxcpp/crypto + 1 root
  `.DS_Store`). LOC equivalent N/A — these are CMake artefacts.

### 5.2 Verified canonical (kept)

`lux/lps` retains the institutional record:

| File | Status | Reason kept |
|------|--------|-------------|
| LP-137-ACTUAL-STATE.md | canonical | empirical truth (379 LOC) |
| LP-137-CRYPTO-ARCHITECTURE.md | canonical | aspirational target — explicit deferral to ACTUAL-STATE on lines 5, 12, 40, 45, 118, 135, 139 (verified) |
| LP-137-MERGE-RECONCILIATION.md | canonical | merge audit trail |
| LP-137-WORK-BRANCH-AUDIT.md | canonical | branch DAG |
| LP-137-PEDERSEN-DST-RECONCILED.md | canonical | scope reconciliation |
| LP-137-TFHE-REAL-THRESHOLD-SPEC.md | canonical | F5 fail-closed spec |
| LP-137-FHE-PERFORMANCE.md | canonical | benchmark record |
| LP-137-BENCHMARKS.md | canonical | benchmark record |
| LP-137-COVERAGE.md | canonical | test/coverage record |
| LP-137-PARALLELIZATION.md | canonical | architecture record |
| LP-137-gpu-residency-invariant.md | canonical | invariant spec |

CHANGELOGs in all six repos are **canonical narrative** (committed
2026-04-28) and remain.

## 6. Honest deferrals

1. **luxcpp/crypto SKIPPED-CONFLICT (33 of 38).** The vast majority
   reflect squash-merge SHA divergence from earlier sibling sweeps.
   Content already in `main`. To avoid double-merging, owners should
   `git diff main..origin/<branch>` before retrying.
2. **lux/mpc SKIPPED-CONFLICT (5 of 6).** B4 / F3 / F4 fix branches
   genuinely conflict with sibling registry/attestation refactor on
   `pkg/api/server.go`, `pkg/mpc/sign_orchestrator.go`, `cmd/mpcd/*`.
   Needs hand-merge by red-team owner.
3. **lux/lps changelog SKIPPED-CONFLICT.** `LP-137-BENCHMARKS.md` and
   `LP-137-FHE-PERFORMANCE.md` were modified by both
   `lp137-actual-state-2026-04-28` and the changelog branch on the
   same lines. Needs reconciliation in a follow-up branch.

No PUSH-DEFERRED outcomes — every successful merge pushed cleanly first
attempt.

## 7. Summary

- 16 branches merged across six repos (5 FF + 11 no-FF).
- 50 conflicts skipped with abort + reset + log (no data loss).
- 15 origin branches deleted (only successfully merged ones).
- 81 local branches pruned.
- 24 worktrees removed in luxcpp/crypto.
- 40 stale build dirs cleaned in luxcpp/crypto.
- 0 slop docs needed deletion (target docs already absent from main).

All canonical audit-trail docs and CHANGELOG narratives retained.
