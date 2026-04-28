# LP-PACKAGES-FINAL-2026-04-28 — Canonical Published Tag State

Final semver tags pushed after LP-137 Red Final fixes (N1-N5 + D2) plus
build/CI fixes landed on each repo's `main`. This document is the canonical
published state; consumers should pin to these tags.

## Summary table

| Repo | Tag | Bump | Reason |
|---|---|---|---|
| `luxfi/mpc` | **v1.11.0** | minor | cc/attest production wire (N1) + RequireSEVSNP/TDX/NVNRAS strict policy (D2) + experimental_tfhe gate (N2) + airgap_command + buildHSMSignerConfig + nonce binding (B4) |
| `luxfi/crypto` | **v1.18.3** | patch | Pedersen DST canonical (N3) + IPA prover blinding (#205) + verkle batchproof (#237) + banderwagon import sweep |
| `luxcpp/crypto` | **v1.4.0** | minor | Metal cmov branchless g1_double + g1_to_affine (N5) + composite require_* flags (O5) + bn254 GPU pairing tower + KZG CUDA+WGSL parity + IPA Bulletproofs + KAT second oracle + cabi nullptr guards |
| `luxfi/threshold` | **v1.6.5** | patch | xrpl ed25519 nilfix + ringtail Sign API tests + tfhe UNSAFE markers + go.sum drift |
| `luxfi/aml` | **v1.0.1** | patch | go.sum hanzoai/base@v0.40.4 hash refresh + canonical docker-build CI |
| `luxfi/evm` | **v0.18.0** | minor | luxfi/precompile v0.5.12 + luxfi/fhe v1.8.0 bump + GPU auto-detect + anchor precompile + Block-STM + modular EVM backend |
| `luxfi/chains` | **v1.1.0** | minor | thresholdvm staged + submodule resolution + 22 explicit precompiles + 18 enabled on C-Chain |
| `luxfi/evmgpu` | **v0.2.0** | minor | luxfi/gpu v1.0.1 bump + MLX cgo build tag tightening + go.sum drift |
| `luxfi/gpu` | v1.0.1 | — | already published in #240 |
| `luxfi/precompile` | v0.5.12 | — | already published in #225 + #243 |
| `luxfi/fhe` | v1.8.0 | — | already published in #243 |
| `luxfi/hsm` | v1.1.3 | — | already published in #214 |

## Canonical pin set

For consumer repos pinning the LP-137 published surface:

```
luxfi/mpc           v1.11.0
luxfi/crypto        v1.18.3
luxcpp/crypto       v1.4.0
luxfi/threshold     v1.6.5
luxfi/aml           v1.0.1
luxfi/evm           v0.18.0
luxfi/chains        v1.1.0
luxfi/evmgpu        v0.2.0
luxfi/gpu           v1.0.1
luxfi/precompile    v0.5.12
luxfi/fhe           v1.8.0
luxfi/hsm           v1.1.3
```

## Deferred / divergence notes

- `luxfi/precompile@v0.5.12` and `luxfi/fhe@v1.8.0` exist as published tags but
  the underlying tag commits (`22ec885` and `de780b6` respectively) are NOT
  reachable from the current `origin/main`. Consumers pinning the tags get the
  intended surface; downstream merge of those single-commit branches into
  `main` is a follow-up housekeeping item, not a re-tag.
- All tags are annotated. No force-tags. No tag rewrites.

## Bump-rule rationale (semver)

- **minor** — additive surface (new flags, new build tags, new packages, new
  RPC namespace, new precompiles, new GPU kernels). Backwards-compatible for
  callers of the prior tag.
- **patch** — fix-only (DST canonicalization, blinding fix, batchproof
  implementation that closes ErrBatchLengthMismatch, nil guards, go.sum
  refresh, test API alignment). No new public surface.

## Original implementation timeline

All work originated in Dec 2025 (LP-137). Published commit author dates reflect
re-publication (Apr 2026) after a laptop-theft data-loss event. Per-repo
`CHANGELOG.md` files narrate the original implementation order; tag annotation
bodies summarize each tag's surface delta.

## Process discipline

- `unset GH_TOKEN GITHUB_TOKEN` before every push (hanzo-dev only)
- annotated tags only (`git tag -a`)
- no force-tag, no tag rewrites
- semver compliance: minor for additive, patch for fix-only
- brand-neutral throughout (no Lux/Hanzo prefixes in user-facing strings)
