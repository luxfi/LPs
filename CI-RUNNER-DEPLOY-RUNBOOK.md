# CI Runner Deployment Runbook (2026-04-28)

Step-by-step for the platform team to unblock CI in `luxcpp/*`, `luxfi/*`, `luxgpu/*`. Audit context: [CI-RUNNERS.md](./CI-RUNNERS.md).

## Goal

Stand up org-scoped GitHub Actions self-hosted runners for each org, registered with the labels existing workflows already target. No workflow edits required.

## Prerequisites

1. `kubectl` context for `do-sfo3-hanzo-k8s` (`24.199.76.255`).
2. `helm` ≥ 3.14.
3. `gh` authenticated as `hanzo-dev` (admin:org scope on luxcpp / luxfi / luxgpu / hanzoai). Always `unset GH_TOKEN GITHUB_TOKEN` before invoking `gh`.
4. Read-only access to `~/work/hanzo/universe/infra/k8s/arc/` to copy reference values files.
5. ARC controller already installed in `arc-system` namespace on hanzo-k8s. Verify:
   ```bash
   kubectl get pods -n arc-system
   ```
   If absent:
   ```bash
   helm install arc oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller \
     --namespace arc-system --create-namespace
   ```

## Step 1 — Create GitHub App or PAT secrets per org

GitHub recommends a dedicated GitHub App per org for ARC. Either approach is acceptable; pick one and use it everywhere.

### Option A: PAT (faster, less secure, rotates manually)
Create a fine-grained PAT for the `hanzo-dev` user with scope `admin:org` on each target org. Store in KMS at `kms.hanzo.ai/projects/hanzo/secrets/arc-github-pat-<org>`. Sync to K8s as a secret named `arc-<org>-github-secret` with key `github_token`.

### Option B: GitHub App (preferred)
Create a GitHub App per org with permissions: Administration: Read & Write, Self-hosted runners: Read & Write. Install on the org. Store the App ID, Installation ID, and private key in KMS. Sync as `arc-<org>-github-secret` with keys `github_app_id`, `github_app_installation_id`, `github_app_private_key`.

Use Option B in production. Reuse the existing KMSSecret CRD pattern from `~/work/hanzo/universe/infra/k8s/`.

## Step 2 — Author per-org values files

For each org `<org>` in {luxcpp, luxfi, luxgpu}, create two values files in `~/work/hanzo/universe/infra/k8s/arc/`:

### `values-<org>-build-amd64.yaml`
```yaml
githubConfigUrl: https://github.com/<org>
githubConfigSecret: arc-<org>-github-secret
runnerScaleSetName: <org>-build-linux-amd64
minRunners: 0
maxRunners: 30
runnerGroup: Default
containerMode:
  type: dind
template:
  spec:
    nodeSelector:
      role: runner
    tolerations:
      - key: role
        operator: Equal
        value: runner
        effect: NoSchedule
      - key: dedicated
        operator: Equal
        value: ci-runner
        effect: NoSchedule
    containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        command: ["/home/runner/run.sh"]
        env:
          - name: ACTIONS_RUNNER_LABELS
            value: "hanzo-build-linux-amd64,<org>-build-linux-amd64,self-hosted,Linux,X64"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false
```

### `values-<org>-build-arm64.yaml`
```yaml
githubConfigUrl: https://github.com/<org>
githubConfigSecret: arc-<org>-github-secret
runnerScaleSetName: <org>-build-linux-arm64
minRunners: 0
maxRunners: 10
runnerGroup: Default
containerMode:
  type: dind
template:
  spec:
    nodeSelector:
      arch: arm64
    tolerations:
      - key: role
        operator: Equal
        value: runner
        effect: NoSchedule
      - key: kubernetes.io/arch
        operator: Equal
        value: arm64
        effect: NoSchedule
      - key: workload
        operator: Exists
        effect: NoSchedule
    containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        command: ["/home/runner/run.sh"]
        env:
          - name: ACTIONS_RUNNER_LABELS
            value: "hanzo-build-linux-arm64,<org>-build-linux-arm64,self-hosted,Linux,ARM64"
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false
```

The `hanzo-build-linux-{amd64,arm64}` labels MUST appear so existing workflows match without edits. The `<org>-build-linux-{amd64,arm64}` labels enable per-org observability and future fine-grained routing.

## Step 3 — Install scale sets

For each org, in order:

```bash
unset GH_TOKEN GITHUB_TOKEN
ORG=luxcpp   # repeat for luxfi, luxgpu

helm upgrade --install ${ORG}-build-linux-amd64 \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set \
  -n actions-runner-system --create-namespace \
  -f values-${ORG}-build-amd64.yaml

helm upgrade --install ${ORG}-build-linux-arm64 \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set \
  -n actions-runner-system \
  -f values-${ORG}-build-arm64.yaml
```

Wait for the listener pods:

```bash
kubectl get pods -n actions-runner-system -l "app.kubernetes.io/component=runner-scale-set-listener"
```

## Step 4 — Verify registration

```bash
unset GH_TOKEN GITHUB_TOKEN
for org in luxcpp luxfi luxgpu; do
  echo "=== $org ==="
  gh api orgs/$org/actions/runners --jq '.runners[] | {id, name, status, labels: [.labels[].name]}'
done
```

Expected: at least the listener registered per scale set, more pods spawn on demand up to `maxRunners`.

## Step 5 — Trigger a verifying run

Re-run the most recent workflow run for `luxcpp/crypto`:

```bash
unset GH_TOKEN GITHUB_TOKEN
gh run list --repo luxcpp/crypto --limit 1
gh run rerun --repo luxcpp/crypto <run-id>
gh run watch --repo luxcpp/crypto <run-id>
```

Confirm jobs no longer hang in "Waiting for a runner".

## Token Rotation

Registration tokens auto-rotate via the ARC controller (every ~30 days). Manual rotation is unnecessary if using GitHub App auth.

For PAT rotation:
1. Mint new PAT.
2. Update KMS: `kms.hanzo.ai/projects/hanzo/secrets/arc-github-pat-<org>`.
3. KMSSecret CRD reconciles within 60s.
4. Restart listener pod: `kubectl rollout restart -n actions-runner-system deployment/<scale-set>-listener`.

## Org-level vs Repo-level Scoping

Default: org-level. All repos in the org can schedule jobs.

If a repo must NOT have access (e.g. limit `luxgpu/<sensitive>` from heavy build runners), create a non-Default runner group:

```bash
unset GH_TOKEN GITHUB_TOKEN
gh api -X POST orgs/luxgpu/actions/runner-groups \
  -f name=restricted \
  -f visibility=selected \
  -F selected_repository_ids:='[<repo_id>,<repo_id>]'
```

Then update the corresponding `values-*.yaml`:
```yaml
runnerGroup: restricted
```
and `helm upgrade --install` again.

## macOS / `hanzo-build-darwin-arm64`

`luxcpp/crypto/.github/workflows/bn254-metal.yml` references `hanzo-build-darwin-arm64`. There is no implementation today.

**Recommendation:** Switch that job to `macos-14` (GitHub-hosted ARM macOS). It runs in seconds for crypto bench/CI. If we ever need a self-hosted Mac fleet, register Mac mini hosts manually — ARC does not deploy macOS runners.

Edit:
```yaml
# luxcpp/crypto/.github/workflows/bn254-metal.yml
- runs-on: hanzo-build-darwin-arm64
+ runs-on: macos-14
```

This is a separate small PR after runners are up.

## Rollback

```bash
helm uninstall <org>-build-linux-amd64 -n actions-runner-system
helm uninstall <org>-build-linux-arm64 -n actions-runner-system
```

ARC controller stays — only the scale sets are removed.

## Done When

- `gh api orgs/luxcpp/actions/runners --jq .total_count` ≥ 1
- `gh api orgs/luxfi/actions/runners --jq .total_count` ≥ 1
- `gh api orgs/luxgpu/actions/runners --jq .total_count` ≥ 1
- A `luxcpp/crypto` build job picks up a runner within 30s and completes.
- The same workflow re-run twice in a row succeeds (proves scale-up + re-use).

## Files

- This runbook: `/Users/z/work/lux/lps/CI-RUNNER-DEPLOY-RUNBOOK.md`
- Audit: `/Users/z/work/lux/lps/CI-RUNNERS.md`
- ARC reference: `/Users/z/work/hanzo/universe/infra/k8s/arc/`
