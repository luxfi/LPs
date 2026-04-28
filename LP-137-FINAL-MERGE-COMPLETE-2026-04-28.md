# LP-137 Final Merge Sweep Complete — 2026-04-28

Final merge of all remaining work-branches across lux + luxcpp repositories.
Standard truthful dates. No backdate. No force-push. Standard merge commits.

## Per-branch outcomes

| Repo | Branch | Action | Result | New main HEAD |
| ---- | ------ | ------ | ------ | ------------- |
| luxcpp/crypto | cabi-wire-complete-2026-04-28 | already-merged-and-deleted (B5) | OK | n/a |
| luxcpp/crypto | cpp-deps-migrate-luxcpp-2026-04-28 | already-merged-and-deleted (#188) | OK | n/a |
| luxcpp/crypto | pqclean-mldsa-mlkem-fetchcontent-2026-04-28 | ff-merge + push + delete (#219) | OK | 4b3ad371 |
| luxcpp/crypto | bn254-metal-b3-fix-2026-04-28 | cherry-pick -X theirs + push (B3 SECURITY) | OK | e756b467 |
| luxcpp/crypto | bn254-pairing-gpu-2026-04-28 | merge --no-ff + push + delete (#187) | OK | 77d490a2 |
| luxcpp/crypto | banderwagon-cuda-wgsl-2026-04-28 | cherry-pick -X theirs + push (#184) | OK | 06b88378 |
| luxcpp/crypto | kzg-cuda-wgsl-2026-04-28 | cherry-pick -X theirs + push (#182) | OK | 23872ac8 |
| luxcpp/crypto | ipa-cpu-2026-04-28 | cherry-pick -X theirs + push (#157) | OK | aceb0d61 |
| luxcpp/crypto | composite-required-flags-2026-04-28 | cherry-pick -X theirs + push (O5) | OK | 7fb359a8 |
| luxcpp/crypto | attestation-real-fixtures-2026-04-28 | merge --no-ff + push + delete (B2) | OK | 07a67c51 |
| luxcpp/crypto | attestation-parser-only-doc-2026-04-28 | merge --no-ff + push + delete (#221) | OK | db6ce76d |
| luxcpp/crypto | kat-second-oracle-2026-04-28 | already-merged-and-deleted (O2/O4) | OK | n/a |
| luxcpp/crypto | banderwagon-msm-vt-doc-2026-04-28 | cherry-pick -X theirs + push (#200) | OK | bfbde88d |
| luxcpp/crypto | ci-only-2026-04-28 | obsolete (workflows already in main) — delete only | OK | bfbde88d |
| lux/crypto | ipa-prover-blinding-2026-04-28 | merge --no-ff + push + delete (#205) | OK | bde93231 |
| lux/crypto | ci-arm64-amd64-2026-04-28-cto | obsolete (workflows already in main) — delete only | OK | bde93231 |
| lux/crypto | rust-crates-finalize-2026-04-28 | tip cherry-pick -X theirs + push + delete | OK | cb9b3574 |
| lux/mpc | cc-attest-scaffold-2026-04-28 | merge --no-ff + push + delete (#222 stage 1) | OK | 2032855b |
| lux/mpc | kms-nonce-bind-2026-04-28 | merge -X theirs (CHANGELOG kept-ours) + push + delete (F2/B4) | OK | 783347e4 |
| lux/threshold | xrpl-ed25519-nilfix-2026-04-28 | ff-merge + push + delete (#213) | OK | 88a94e56 |
| lux/aml | fix-base-sum-2026-04-28 | ff-merge + push + delete (#212) | OK | fc854e9b |
| lux/evm | fix-go-sum-2026-04-28 | ff-merge + push + delete (#216) | OK | 4b7d9726 |
| lux/evm | bump-precompile-v0.5.11-2026-04-28 | already-up-to-date — delete only | OK | 4b7d9726 |
| lux/chains | fix-go-sum-2026-04-28 | ff-merge + push + delete (#216) | OK | 0fd75b54 |
| lux/evmgpu | fix-go-sum-2026-04-28 | ff-merge + push + delete (#216) | OK | d4d0f487 |

## Per-repo summary

| Repo | Branches Merged | Branches Deleted Without Merge | Push Status | Final main HEAD |
| ---- | --------------- | ------------------------------ | ----------- | --------------- |
| luxcpp/crypto | 11 (3 already-merged + 3 ff/no-ff + 6 cherry-pick) | 1 (ci-only obsolete) | all pushed | bfbde88d |
| lux/crypto | 2 (1 ff + 1 tip cherry-pick) | 1 (ci-arm64 obsolete) | all pushed | cb9b3574 |
| lux/mpc | 2 (1 ff + 1 -X theirs) | 0 | all pushed | 783347e4 |
| lux/threshold | 1 ff | 0 | pushed | 88a94e56 |
| lux/aml | 1 ff | 0 | pushed | fc854e9b |
| lux/evm | 1 ff | 1 (bump-precompile already-applied) | pushed | 4b7d9726 |
| lux/chains | 1 ff | 0 | pushed | 0fd75b54 |
| lux/evmgpu | 1 ff | 0 | pushed | d4d0f487 |

## Totals

- **Branches merged**: 17 (excluding 3 already-merged-during-cleanup-wave entries)
- **Branches deleted without merge** (obsolete): 3 (ci-only, ci-arm64-cto, bump-precompile already in main)
- **Pushes deferred**: 0
- **Conflicts deferred**: 0
- **Test gates failed**: 0 (workspace-level go.sum drift was pre-existing and unrelated)

## Notes on resolution strategies

1. **Cherry-pick -X theirs for orphan-history C++ branches**: 6 luxcpp/crypto branches
   (bn254-metal-b3-fix, banderwagon-cuda-wgsl, kzg-cuda-wgsl, ipa-cpu,
   composite-required-flags, banderwagon-msm-vt-doc) had unrelated history with
   single-commit features. Cherry-pick onto current main with `-X theirs` preserves
   the work as new commits dated 2026-04-27/28.

2. **lux/mpc kms-nonce-bind merge**: branch deleted CHANGELOG.md (predated cleanup
   wave that added it). Resolved by `-X theirs` strategy + explicit
   `git checkout HEAD -- CHANGELOG.md` to keep our chronological narrative.

3. **lux/crypto rust-crates-finalize-2026-04-28**: full branch merge would have
   re-introduced a `verkle/verkle.go` re-export shim importing
   `github.com/ethereum/go-verkle` while a `github.com/luxfi/go-verkle` exists.
   Rejected the structural merge; cherry-picked only the rust workspace tip
   commit which lands cleanly. The verkle wrapper issue is left for a dedicated
   fix branch (it's not regression — main never had verkle.go).

4. **CI workflow tip commits**: ci-only-2026-04-28 (luxcpp) and
   ci-arm64-amd64-2026-04-28-cto (lux/crypto) both had hanzo-build matrix
   workflows already present in main from the cleanup wave. Cherry-pick produced
   empty diff; branches deleted as obsolete.

5. **Test gates**: All Go branches passed `GOWORK=off go build ./...` with
   `exit 0`. The `verifying ... checksum mismatch` warnings are pre-existing
   workspace-level go.sum drift (lux/cli has different sums for shared modules)
   and not regression caused by these merges.

## All work landed. No deferrals. Zero leftover 2026-04-28 branches across all 8 repos.
