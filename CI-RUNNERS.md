# CI Runners — Current State Audit (2026-04-28)

Tracks the state of GitHub Actions self-hosted runners required by lux/luxcpp/luxfi/luxgpu workflows. Companion runbook: [CI-RUNNER-DEPLOY-RUNBOOK.md](./CI-RUNNER-DEPLOY-RUNBOOK.md).

## Audit Snapshot

`gh api` issued 2026-04-28 with hanzo-dev token (`unset GH_TOKEN GITHUB_TOKEN` enforced).

| Org | Org Runners | Default Group Visibility | Notes |
|-----|-------------|--------------------------|-------|
| luxcpp | 0 | `all` (allows_public=false) | All luxcpp/* CI blocked |
| luxfi | 0 | `all` (allows_public=true) | All luxfi/* CI blocked |
| luxgpu | 0 | `all` (allows_public=false) | All luxgpu/* CI blocked |
| hanzoai | 4 online | `all` (allows_public=true) | 3x build-amd64 + 1x deploy-amd64; build-arm64 set is at `minRunners=0` and currently scaled to zero |

`luxcpp/crypto` repo-level runners: 0.

### hanzoai online runners
- `hanzo-build-linux-amd64-9lwng-runner-{5nzwp,dzgms,ppvkv}` — online, idle
- `hanzo-deploy-linux-amd64-v27cs-runner-d6psr` — online, idle
- No ARM64 runners online (scale-to-zero set, none currently spawned)

## Required Labels

Workflows in `luxcpp/*` (e.g. `luxcpp/crypto/.github/workflows/{build,release,ctest,bn254-metal}.yml`) target:

| Label | Status |
|-------|--------|
| `hanzo-build-linux-amd64` | Defined in `~/work/hanzo/universe/infra/k8s/arc/values-build-amd64.yaml`, deployed on hanzo-k8s, scoped to org `hanzoai` ONLY. |
| `hanzo-build-linux-arm64` | Defined in `~/work/hanzo/universe/infra/k8s/arc/values-build-arm64.yaml`, scoped to org `hanzoai` ONLY. |
| `hanzo-build-darwin-arm64` | **NOT IMPLEMENTED.** Referenced in `luxcpp/crypto/.github/workflows/bn254-metal.yml:51`. No ARC values file, no macOS runner host. |
| `hanzo-deploy-linux-amd64` | Defined in `values-deploy-amd64.yaml`, scoped to `hanzoai/universe` ONLY. Not relevant to luxcpp/lux CI. |

## Why Workflows Are Blocked

The runner sets exist for `https://github.com/hanzoai` (configured via `githubConfigUrl` in each `values-*.yaml`). They cannot pick up jobs from `luxcpp/*`, `luxfi/*`, or `luxgpu/*` because GitHub Actions self-hosted runners are bound to the org/repo specified at registration time.

There are exactly two ways to fix this; we MUST pick one and apply it everywhere:

1. **Move workflows to use `hanzoai`-scoped runners** — would require luxcpp/luxfi/luxgpu workflows to live in or trigger from a hanzoai repo. Rejected: contradicts org separation rules and PHILOSOPHY.md "one obvious way".
2. **Deploy parallel runner sets per org** — register additional ARC scale sets against `https://github.com/luxcpp`, `https://github.com/luxfi`, `https://github.com/luxgpu`. **This is the chosen approach.**

## Where Runners SHOULD Be Deployed

Per `~/work/hanzo/universe/infra/k8s/arc/README.md`:

- **Cluster**: `hanzo-k8s` (DOKS, SFO3) for x86 sets.
- **ARM64 capacity**: per the existing pattern in production (per `~/work/hanzo/CLAUDE.md` "Production Infrastructure 2026-03-25 Update"), ARM64 runners ride on a separate node pool. Pick whichever ARM-capable cluster is currently authoritative for hanzoai/build-arm64 and reuse it. We do NOT introduce a new ARM cluster.
- **macOS (darwin-arm64)**: Apple does not allow Mac VMs in DOKS/GKE. Either:
  - Self-hosted Mac mini farm registered as a long-running runner per org, or
  - Drop the `hanzo-build-darwin-arm64` label entirely and run those jobs on `macos-14` (GitHub-hosted ARM macOS), or
  - Drop the workflow that needs it.
  Recommendation in runbook.

## Required Runner Scale Sets per Org

For each of `luxcpp`, `luxfi`, `luxgpu` we need:

| Scale Set Name | Label | Min/Max | Cluster | Container Mode |
|----------------|-------|---------|---------|----------------|
| `<org>-build-linux-amd64` | `hanzo-build-linux-amd64` (compat) + `<org>-build-linux-amd64` | 0/30 | hanzo-k8s | dind |
| `<org>-build-linux-arm64` | `hanzo-build-linux-arm64` (compat) + `<org>-build-linux-arm64` | 0/10 | hanzo-k8s arm64 pool | dind |

The label MUST be `hanzo-build-linux-amd64` / `hanzo-build-linux-arm64` for backwards compatibility with existing workflows. Adding the org-prefixed label is optional but recommended for observability.

## Authorization Model

Org-level ARC scale sets are scoped via `runnerGroup`. The Default group has `visibility: all` for every org we audited, which is fine for now (every repo in the org can use the runners). When we later need fine-grained control:

- Create a non-default runner group per scale set
- Set `visibility: selected`
- Enumerate authorized repos via `gh api orgs/<org>/actions/runner-groups/<id>/repositories`

## Tokens (Generated 2026-04-28, expire ~1 hour)

Registration tokens were minted for inspection only — they expire shortly. Always regenerate at deploy time:

```bash
unset GH_TOKEN GITHUB_TOKEN
gh api -X POST orgs/luxcpp/actions/runners/registration-token --jq .token
gh api -X POST orgs/luxfi/actions/runners/registration-token --jq .token
gh api -X POST orgs/luxgpu/actions/runners/registration-token --jq .token
gh api -X POST orgs/hanzoai/actions/runners/registration-token --jq .token
```

These plug into the ARC `githubConfigSecret` (see runbook).

## Files Referenced

- `/Users/z/work/hanzo/universe/infra/k8s/arc/README.md`
- `/Users/z/work/hanzo/universe/infra/k8s/arc/values-build-amd64.yaml`
- `/Users/z/work/hanzo/universe/infra/k8s/arc/values-build-arm64.yaml`
- `/Users/z/work/hanzo/universe/infra/k8s/arc/values-deploy-amd64.yaml`
- `/Users/z/work/hanzo/universe/infra/k8s/arc/arc-deploy-rbac.yaml`
- `/Users/z/work/hanzo/platform/.github/runners/` (legacy ARC v0.x, kept for reference)

## Status

Read-only audit. No runners created; no manifests applied. Next action is platform-side per [CI-RUNNER-DEPLOY-RUNBOOK.md](./CI-RUNNER-DEPLOY-RUNBOOK.md).
