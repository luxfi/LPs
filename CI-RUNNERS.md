# CI Runners — Canonical (2026-04-29)

GitHub Actions self-hosted runners for `hanzoai/*`, `luxfi/*`, `luxcpp/*`, `luxgpu/*`, `zooai/*`. Companion runbook: [CI-RUNNER-DEPLOY-RUNBOOK.md](./CI-RUNNER-DEPLOY-RUNBOOK.md).

## Decision (closes platform task #256)

**Two scale sets total, shared across all orgs.** Not six. Not per-org-prefixed.

| Label | Cluster | Status |
|-------|---------|--------|
| `hanzo-build-linux-amd64` | hanzo-k8s (DOKS SFO3) | Live, 3 runners online (max 30) |
| `hanzo-build-linux-arm64` | hanzo-k8s (DOKS SFO3) | Paused — DOKS has no arm64 droplets (re-enable per `~/work/hanzo/CLAUDE.md` 2026-04-27 entry when DO ships them) |

GitHub Actions ARC binds a scale set to a single `githubConfigUrl` at registration (free-plan orgs, no Enterprise tier — confirmed 2026-04-29 via `gh api /orgs/{hanzoai,luxfi,zooai}` returning `plan: free`, `gh api /enterprises` returning 404). Cross-org access is therefore implemented as **one ARC listener per org, all listeners pointing at the same node pool, all listeners advertising the same two labels**. Workflows in any org reference `[self-hosted, hanzo-build-linux-amd64]` or `[self-hosted, hanzo-build-linux-arm64]` — no `luxfi-build-*`, no `luxcpp-build-*`, no `luxgpu-build-*`, no `<org>-build-*` exists or will exist.

This is the same pattern Hanzo already uses for `zoo-build-linux-amd64` (one zooai listener, hanzo-k8s). Scale-set names stay `hanzo-build-linux-{amd64,arm64}` everywhere — no rename, no namespacing.

## Live State (2026-04-29, `unset GH_TOKEN GITHUB_TOKEN`)

| Org | Org Runners | Notes |
|-----|-------------|-------|
| hanzoai | 4 online | 3× `hanzo-build-linux-amd64` + 1× `hanzo-deploy-linux-amd64`. arm64 set scaled to zero (paused). |
| luxfi | 0 | Listener not yet installed — Step 3 of runbook. |
| luxcpp | 0 | Listener not yet installed — Step 3 of runbook. |
| luxgpu | 0 | Listener not yet installed — Step 3 of runbook. |
| zooai | 1 online | `zoo-build-linux-amd64` (legacy name; functionally equivalent — see runbook). |

## Workflow Labels Already in Use

`luxcpp/crypto/.github/workflows/*` and any future `luxfi/*`/`luxgpu/*` workflow references one of these two labels exactly:

| Workflow | Reference |
|----------|-----------|
| `luxcpp/crypto/.github/workflows/build.yml` | `hanzo-build-linux-{amd64,arm64}` |
| `luxcpp/crypto/.github/workflows/release.yml` | `hanzo-build-linux-{amd64,arm64}` |
| `luxcpp/crypto/.github/workflows/ctest.yml` | `hanzo-build-linux-{amd64,arm64}` |
| `luxcpp/crypto/.github/workflows/bn254-metal.yml` (linux job) | `hanzo-build-linux-{amd64,arm64}` |
| `luxcpp/crypto/.github/workflows/crypto-cuda-tests.yml` | `[self-hosted, hanzo-build-linux-amd64]` |

`bn254-metal.yml`'s macOS leg targets `hanzo-build-darwin-arm64`. There is no Mac runner; per runbook §macOS, that leg switches to GitHub-hosted `macos-14` (separate small PR; not part of #256).

## Why Per-Org Listeners Exist At All

ARC's `gha-runner-scale-set-controller` binds each `gha-runner-scale-set` Helm release to one `githubConfigUrl`. The controller itself is org-agnostic and shared. Adding a new org = one Helm release pointing at `https://github.com/<org>` + the canonical labels — same node pool, same image, same KMS-sourced GitHub App secret pattern. Cost: a single listener pod per org (idle ~10 MB RAM). Scale-up runners come from the shared `role: runner` node pool, so per-org scaling does not multiply node cost.

## Rejected Alternatives

- **Six per-org-prefixed scale sets** (`luxcpp-build-*`, `luxfi-build-*`, `luxgpu-build-*`). Rejected — duplicates labels, breaks "one obvious way", and the existing workflows already reference `hanzo-build-*`.
- **Move workflows into hanzoai org** so they pick up the existing listener directly. Rejected — violates org separation per `~/.claude/CLAUDE.md` ("never mix … brand … org boundaries strict").
- **GitHub Enterprise Cloud runner groups** with cross-org visibility. Rejected — none of these orgs are on Enterprise plan (free tier confirmed 2026-04-29).

## Files

- ARC values: `~/work/hanzo/universe/infra/k8s/arc/values-build-amd64.yaml`, `values-build-arm64.yaml`
- Per-org override pattern: see [CI-RUNNER-DEPLOY-RUNBOOK.md](./CI-RUNNER-DEPLOY-RUNBOOK.md) §Step 2
- Hanzo platform note: `~/work/hanzo/CLAUDE.md` "Production Infrastructure (2026-04-27 Update)"
- Universe ARC README: `~/work/hanzo/universe/infra/k8s/arc/README.md`

## Status

#256 closed — superseded by 2-set canonical decision above. No new infrastructure to deploy; per-org listener Helm releases are the only action remaining (runbook Step 3) and run on existing hanzo-k8s capacity.
