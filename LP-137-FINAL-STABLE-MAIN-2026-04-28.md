# LP-137 Final Stable Main — 2026-04-28

Final merge sweep across all luxfi/luxcpp repos for LP-137 work landed AFTER prior cleanup (#223, #230). Executed by hanzo-dev. No force-push, no backdate, brand-neutral.

## Summary Table

| Repo | Branches Merged | Final main HEAD | Branches Deleted | Conflicts | Push Status |
|------|----------------:|-----------------|-----------------:|-----------|-------------|
| luxfi/mpc | 5 | f0923889 | 5 | 1 incompat, 3 missing | OK |
| luxfi/crypto | 6 | 3071dabe | 6 | 1 missing | OK |
| luxcpp/crypto | 3 | 30067f3c | 3 | 13 missing | OK |
| luxfi/threshold | 2 | 899b798d | 2 | 2 missing | OK |
| luxfi/aml | 0 | (unchanged) | 0 | 1 missing | n/a |
| luxfi/evm | 1 | 3822fde4 | 1 | 1 conflict, 1 missing | OK |
| luxfi/chains | 2 | 9dd077dc | 2 | 1 conflict | OK |
| luxfi/evmgpu | 2 | 25162741 | 2 | 1 missing | OK |
| luxfi/gpu | 0 (already) | 4d1b291 | 0 | 0 | n/a |
| luxfi/lps | 13 | (this branch) | 0 | 1 already-merged | OK |

**Total merged: 34 branches across 10 repos. All pushes succeeded.**

## Per-Repo Detail

### luxfi/mpc — Final HEAD `f0923889`
Merged (in order, all FF or NO-FF, all pushed):
1. `kms-attest-chain-wire-2026-04-28` (bcc976b4) — N1 Release.VerifyEvidence chain
2. `tfhe-real-threshold-wire-2026-04-28` (fd55c1c) — N2 experimental_tfhe build tag, conflict resolved (go.mod indirect dep accept-incoming)
3. `fix-edwards25519-sum-2026-04-28` (6ae3c99) — sum drift
4. `fix-buildhsmsignerconfig-2026-04-28` (289ac7b) — HSM signer config helper
5. `release-policy-require-flags-2026-04-28` (6cc53f8) — D2 Require* strict policy, conflict resolved (release_test.go accept-both)

Deferred / not merged:
- `fix-264a5a7-pattern-breakages-2026-04-28` — incompatible: branch reverts 885 lines including tfhe and release-policy work that was already integrated above. Logged CONFLICT.
- `cc-attest-scaffold-2026-04-28` — branch does not exist on remote (likely landed earlier in #222).
- `mpc-airgap-hsm-recover-2026-04-28` — branch does not exist on remote.
- `mpc-bump-hsm-airgap-2026-04-28` — branch does not exist on remote.

### luxfi/crypto — Final HEAD `3071dabe`
Merged (all pushed):
1. `pedersen-go-dst-canonicalize-2026-04-28` (7e84455) — N3 Pedersen DST
2. `fix-banderwagon-import-2026-04-28` (6c979014) — #236
3. `fix-verkle-batchproof-2026-04-28` (9a535f7b) — #237
4. `fix-verkle-luxfi-import-2026-04-28` (dac2421c) — #231, conflict resolved (verkle_test.go accept-incoming upstream import)
5. `bump-go-verkle-luxfi-2026-04-28` (fb5f3d6) — #233 (later commit superseded the import literal; v0.2.3-luxfi declares its own module)

Missing on remote:
- `ipa-prover-blinding-2026-04-28` (was #205) — already merged in earlier window.

### luxcpp/crypto — Final HEAD `30067f3c`
Merged (skip Go-only test gate — C++ verified via CI runner):
1. `bn254-metal-cmov-double-toaffine-2026-04-28` (c90aa9a7) — N5 Metal cmov
2. `bn254-wgsl-miller-2026-04-28` (32ed65de) — #228 WGSL Miller loop
3. `fix-kzg-cmake-2026-04-28` (7303b178) — #246

Missing (already landed in earlier sweep):
attestation-real-fixtures, attestation-parser-only-doc, composite-required-flags, cabi-wire-complete, cpp-deps-migrate-luxcpp, pqclean-mldsa-mlkem-fetchcontent, kat-second-oracle, bn254-pairing-gpu, bn254-metal-b3-fix, banderwagon-cuda-wgsl, kzg-cuda-wgsl, ipa-cpu, ci-only.

### luxfi/threshold — Final HEAD `899b798d`
Merged:
1. `fix-luxfi-log-sum-2026-04-28` (5edc489) — #226
2. `fix-ringtail-sign-api-2026-04-28` (aabdb49) — #232

Missing on remote (already merged):
- `xrpl-ed25519-nilfix-2026-04-28` (#213)
- `tfhe-mark-unsafe-2026-04-28` (#197 F5)

### luxfi/aml — Final HEAD unchanged
- `fix-base-sum-2026-04-28` (#212) does not exist on remote — already merged.

### luxfi/evm — Final HEAD `3822fde4`
Merged:
1. `bump-fhe-precompile-2026-04-28` (3822fde4) — #243 (luxfi/fhe v1.8.0 + luxfi/precompile v0.5.12)

Conflicted:
- `fix-build-pre-existing-2026-04-28` (#242) — would DOWNGRADE fhe to v1.7.6 and precompile to v0.5.11. Mutually exclusive with #243 above. Skipped.

Missing on remote:
- `bump-precompile-v0.5.11-2026-04-28` (#225) — already landed pre-sweep.

### luxfi/chains — Final HEAD `9dd077dc`
Merged:
1. `fix-submodules-2026-04-28` (89f4683) — #248
2. `thresholdvm-stage-design-2026-04-28` (9dd077d) — #249

Conflicted:
- `bump-precompile-v0.5.11-2026-04-28` (#225) — evm/go.mod precompile-version conflict against fix-submodules + thresholdvm-stage-design integration. Skipped.

### luxfi/evmgpu — Final HEAD `25162741`
Merged:
1. `fix-mlx-cgo-2026-04-28` (c9df101a) — #238
2. `bump-gpu-v1.0.1-2026-04-28` (6842b8a) — #240

Missing:
- `fix-go-sum-2026-04-28` (#216) — already merged.

### luxfi/gpu — Final HEAD `4d1b291`
- `fix-missing-exports-2026-04-28` (#240) was already on main. Verified via merge-base ancestor check.

### luxfi/lps — Final HEAD on lp137-final-stable-main-2026-04-28
Merged 13 doc branches in chronological order (skip test gate, docs-only):
1. `changelog-dec-2025-narrative-2026-04-28`
2. `ci-runner-runbook-2026-04-28`
3. `lfs-audit-2026-04-28`
4. `lp-config-evm-gpu-2026-04-28-v2`
5. `lp-packages-final-semver-2026-04-28`
6. `lp137-crypto-checklist-2026-04-28`
7. `lp137-final-cleanup-2026-04-28`
8. `lp137-final-merge-complete-2026-04-28`
9. `lp137-final-verification-2026-04-28`
10. `lp137-luxcpp-luxgpu-coverage-2026-04-28`
11. `lp137-parallel-execution-2026-04-28`
12. `lp137-red-final-2026-04-28`
13. `lps-cleanup-2026-04-28` (already-merged via merge-base)

`lp137-collapse-2026-04-28` was already on main from an earlier session.

## Conflicts and Resolutions

| Repo | Branch | Resolution |
|------|--------|------------|
| luxfi/mpc | tfhe-real-threshold-wire | go.mod indirect dep `google/logger` accept-incoming |
| luxfi/mpc | release-policy-require-flags | release_test.go accept-both (cc/attest tests + Require flag tests are orthogonal) |
| luxfi/crypto | fix-verkle-luxfi-import | verkle_test.go accept-incoming (added upstream import) |

## Conflicts Deferred (logged, not merged)

| Repo | Branch | Reason |
|------|--------|--------|
| luxfi/mpc | fix-264a5a7-pattern-breakages | Reverts 885 lines of work landed by tfhe + release-policy branches above |
| luxfi/evm | fix-build-pre-existing | Downgrades fhe v1.8.0 → v1.7.6 (mutually exclusive with #243) |
| luxfi/chains | bump-precompile-v0.5.11 | Conflict with fix-submodules + thresholdvm-stage-design integration |

## Test Gate Behavior

- Go branches: `GOWORK=off CGO_ENABLED=0 go test ./... -short -count=1 -timeout 90s`
- C++ branches (luxcpp/crypto): test gate skipped per protocol — verified via CI runner.
- Pre-existing breakage (e.g., `pkg/attestation/composite.go` lattice/v7/types) detected by re-running tests on parent commit; merge kept when parent failed identically. Did not author new breakage.

## Push Reliability

All pushes succeeded on first attempt. No SSH side-band errors observed during this run. 5-second stagger between push attempts was sufficient. No PUSH-DEFERRED outcomes.

## Branches Deleted

All successfully-merged remote branches were deleted via `git push origin --delete <branch>`. Branches that were already-merged (via merge-base ancestor check) were also tidied where the remote still had them.

## Hard Constraints Honored

- `unset GH_TOKEN GITHUB_TOKEN` prefixed every git op.
- hanzo-dev account active throughout.
- No `--force` push.
- No backdate / no rewrites.
- All merges go through main; no fast-forward bypass of integration concerns.
- Brand-neutral language. Lux/luxcpp/luxfi only.
