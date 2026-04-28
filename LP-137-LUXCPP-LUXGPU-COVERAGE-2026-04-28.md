# LP-137 — luxcpp / luxgpu Org Coverage Audit (2026-04-28)

Status: complete
Scope: ensure no local-only commits dangling under `~/work/luxcpp/*` or `~/work/luxgpu/*`; verify each sub-repo is published to its canonical GitHub org.

This audit is **not** a backdate task. Commit timestamps stay truthful. The Dec 2025 narrative is preserved only in CHANGELOG.md and tag bodies.

## Summary

- **33 sub-directories surveyed** under `~/work/luxcpp/` (24 git repos + 9 non-git working dirs)
- **3 sub-repos migrated** luxfi → luxcpp (aivm, mpcvm, xvm) — main branch + all tags pushed
- **0 sub-repos with unpushed local commits** (every remoted repo at `ahead=0`)
- **0 sub-repos under `~/work/luxgpu/`** — directory does not exist; org reserved for future C++ GPU kernel repos
- **9 non-git working dirs** (build, cmake, install, profiles, scripts, third_party, mlx-c-api, zapdb, plus consensus untracked-only) — no version control needed; transient or vendored
- **1 uninitialized scaffold**: `~/work/luxcpp/consensus` — branch `main` with zero commits, only untracked CMakeLists.txt + include/. No work to preserve.

## Per-sub-repo audit

| Sub-repo | Local path | Remote (origin) | Branch | Ahead/Behind | Dirty | Action |
|---|---|---|---|---|---|---|
| aivm | `/Users/z/work/luxcpp/aivm` | `luxfi/aivm` (origin) + `luxcpp/aivm` (luxcpp) | main | 0/0 | clean | **MIGRATED**: pushed main + 4 tags (v0.58.1, v0.58.3, v0.59, v0.59.1) to luxcpp/aivm. luxfi origin retained. |
| bridgevm | `/Users/z/work/luxcpp/bridgevm` | `luxcpp/bridgevm` | main | 0/0 | clean | none — already at luxcpp |
| build | `/Users/z/work/luxcpp/build` | (no .git) | — | — | — | not a repo (build artifacts dir) |
| cevm | `/Users/z/work/luxcpp/cevm` | `luxcpp/cevm` | feat/v0.29-persistent-kernel | 0/0 | 1 untracked (`ai_precompile.metal`) | none — no committed work to push; uncommitted WIP not in scope |
| cmake | `/Users/z/work/luxcpp/cmake` | (no .git) | — | — | — | not a repo (vendored cmake helpers) |
| consensus | `/Users/z/work/luxcpp/consensus` | (no remote) | main | no commits | 3 untracked | uninitialized scaffold (CMakeLists.txt + include/ untracked, no commits). Skipped — no work to preserve. |
| crypto | `/Users/z/work/luxcpp/crypto` | `luxcpp/crypto` | main | 0/0 | clean | **handled by sibling agent** (final-merge dispatch) |
| cuda | `/Users/z/work/luxcpp/cuda` | `luxcpp/cuda` | main | 0/0 | 23 dirty | none — uncommitted WIP only |
| dex | `/Users/z/work/luxcpp/dex` | `luxcpp/dex` | main | 0/0 | 14 dirty | none — uncommitted WIP only |
| evmc | `/Users/z/work/luxcpp/evmc` | `luxcpp/evmc` | master | 0/0 | clean | none |
| fhe | `/Users/z/work/luxcpp/fhe` | `luxcpp/fhe` | feat/lp-137-types | 0/0 | 1 untracked (`PolicyVault.sol`) | none — uncommitted WIP only |
| gpu | `/Users/z/work/luxcpp/gpu` | `luxcpp/gpu` | fix/keccak-num-inputs-bind | 0/0 | clean | none |
| grpc | `/Users/z/work/luxcpp/grpc` | `luxcpp/grpc` | main | 0/0 | clean | none |
| http | `/Users/z/work/luxcpp/http` | `luxcpp/http` | main | 0/0 | 466 dirty | none — large WIP diff but no committed work pending; fork of upstream |
| install | `/Users/z/work/luxcpp/install` | (no .git) | — | — | — | not a repo (install prefix) |
| lattice | `/Users/z/work/luxcpp/lattice` | `luxcpp/lattice` | feat/lp-137-types | 0/0 | 2 dirty (`release.yml`, `build-fix/`) | none — uncommitted WIP only |
| lux-accel | `/Users/z/work/luxcpp/lux-accel` | `luxcpp/accel` | main | 0/0 | clean | none |
| lux-cuda | `/Users/z/work/luxcpp/lux-cuda` | `luxcpp/lux-cuda` | main | 0/0 | clean | none |
| lux-gpu | `/Users/z/work/luxcpp/lux-gpu` | `luxcpp/lux-gpu` | main | 0/0 | clean | none |
| lux-metal | `/Users/z/work/luxcpp/lux-metal` | `luxcpp/lux-metal` | main | 0/0 | clean | none |
| lux-webgpu | `/Users/z/work/luxcpp/lux-webgpu` | `luxcpp/lux-webgpu` | main | 0/0 | clean | none |
| luxcpp.github.io | `/Users/z/work/luxcpp/luxcpp.github.io` | `luxcpp/luxcpp.github.io` | main | 0/0 | clean | none |
| metal | `/Users/z/work/luxcpp/metal` | `luxcpp/metal` | main | 0/0 | clean | none |
| mlx-c-api | `/Users/z/work/luxcpp/mlx-c-api` | (no .git) | — | — | — | not a repo (vendored MLX C API headers) |
| mpcvm | `/Users/z/work/luxcpp/mpcvm` | `luxfi/mpcvm` (origin) + `luxcpp/mpcvm` (luxcpp) | main | 0/0 | clean | **MIGRATED**: pushed main + 3 tags (v0.61.0, v0.61.1, v0.62) to luxcpp/mpcvm. luxfi origin retained. |
| platformvm | `/Users/z/work/luxcpp/platformvm` | `luxcpp/platformvm` | main | 0/0 | clean | none |
| profiles | `/Users/z/work/luxcpp/profiles` | (no .git) | — | — | — | not a repo (Conan profiles) |
| scripts | `/Users/z/work/luxcpp/scripts` | (no .git) | — | — | — | not a repo (helper scripts) |
| session | `/Users/z/work/luxcpp/session` | `luxcpp/session` | main | 0/0 | clean | none |
| third_party | `/Users/z/work/luxcpp/third_party` | (no .git) | — | — | — | not a repo (vendored third-party sources) |
| webgpu | `/Users/z/work/luxcpp/webgpu` | `luxcpp/webgpu` | main | 0/0 | 13 dirty | none — uncommitted WIP only |
| xvm | `/Users/z/work/luxcpp/xvm` | `luxfi/xvm` (origin) + `luxcpp/xvm` (luxcpp) | main | 0/0 | clean | **MIGRATED**: pushed main + 3 tags (v0.55.1, v0.55.2, v0.55.3) to luxcpp/xvm. luxfi origin retained. |
| zapdb | `/Users/z/work/luxcpp/zapdb` | (no .git) | — | — | — | not a repo (vendored zapdb checkout via parent module) |

## Migrations performed

### luxcpp/aivm — created public, pushed
- `gh repo create luxcpp/aivm --public --description "Lux AIVM (A-Chain) — attestation, AI provenance, audit anchors. GPU-native CUDA+Metal+WGSL."`
- `git remote add luxcpp git@github.com:luxcpp/aivm.git`
- `git push luxcpp main` — new branch
- `git push luxcpp --tags` — v0.58.1, v0.58.3, v0.59, v0.59.1

### luxcpp/mpcvm — created public, pushed
- `gh repo create luxcpp/mpcvm --public --description "Lux MPCVM (M-Chain) — FROST + CGGMP21 + Ringtail threshold ceremonies. GPU-native CUDA+Metal+WGSL."`
- `git remote add luxcpp git@github.com:luxcpp/mpcvm.git`
- `git push luxcpp main` — new branch
- `git push luxcpp --tags` — v0.61.0, v0.61.1, v0.62

### luxcpp/xvm — created public, pushed
- `gh repo create luxcpp/xvm --public --description "Lux XVM — GPU-native UTXO transitions"`
- `git remote add luxcpp git@github.com:luxcpp/xvm.git`
- `git push luxcpp main` — new branch
- `git push luxcpp --tags` — v0.55.1, v0.55.2, v0.55.3

Per audit policy step 5: luxfi/<name> remotes left as-is (still pointing at luxfi as `origin`); luxcpp/<name> added as second remote `luxcpp`. No old repo deletions. No force-pushes.

## luxgpu/ — not present locally

`~/work/luxgpu/` does not exist. The `luxgpu` GitHub org is reserved for future C++ GPU kernel source repositories (e.g. `luxgpu/lattice-kernels`, `luxgpu/crypto-kernels`). No current work warrants creation. The archived `luxgpu/gpu` repo on GitHub is unrelated.

## Out-of-scope

- `~/work/luxcpp/crypto` — handled by the parallel final-merge dispatch (agent a9c4dad5af850182f).
- `~/work/luxcpp/cli` — does not exist locally under luxcpp; the CLI lives at `~/work/lux/cli` and is governed by lux/* repo rules.
- Uncommitted WIP in cevm/cuda/dex/fhe/http/lattice/webgpu — out of scope per "no local-only **commits**" framing. WIP files are by definition not commits.
- consensus scaffold — no commits, no remote, no work-product. Not pushed; documented here for completeness.

## Hard constraints honored

- `unset GH_TOKEN GITHUB_TOKEN` prefixed on every gh/git operation
- hanzo-dev only
- No force-push
- No backdate (commit timestamps untouched; Dec 2025 narrative remains in CHANGELOG.md + tag bodies only)
- Brand-neutral
