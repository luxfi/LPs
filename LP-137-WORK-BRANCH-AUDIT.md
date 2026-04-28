# LP-137 Work Branch Audit — 2026-04-28

Read-only state-of-work survey across `lux/mpc`, `luxcpp/crypto`, `lux/crypto`,
`luxcpp/lattice`, `lux/lattice`, `lux/threshold`. No merges, no commits.

## Scope summary

| Repo | Audited branches | Unique commits ahead of `main` | Leaf tips |
|------|------------------|-------------------------------|-----------|
| `lux/mpc` | 6 | 31 (linear stack) | `policy-canonical-tfhe-import` (apex), `ci/arc-hanzo-consolidation` (parallel) |
| `luxcpp/crypto` | 33 | 143 commits across 17 leaves | 17 (see §2) |
| `lux/crypto` | 15 | 90 commits across 4 leaves | 4 (see §3) |
| `luxcpp/lattice` | 1 | 4 | `feat/lp-137-types` |
| `lux/lattice` | 1 | 4 | `feat/lp-137-types` |
| `lux/threshold` | 2 | 2 (canonical) + 0 (LSS dead) | `feat/tfhe-committee-canonical` |
| **TOTAL** | **58 branches** | **~274 commits unmerged** | |

All branches **conflict-free** against their respective `main` (`git merge-tree`
produced clean trees in every case). The blockage is not conflict — it is order
and one build defect on the lux/mpc apex.

## 1. lux/mpc

`main` tip: `1.10.0` ops/brand-cleanup line. Branches stack linearly:
`canonical-intent` → `canonical-intent-cto` → `fhe-verifier` →
`fhe-threshold-decryptor` → `policy-canonical-tfhe-import`.
`ci/arc-hanzo-consolidation` is parallel (CI runner migration only).

| Branch | Ahead | Last | Conflict | Tests | Recommendation |
|--------|------:|------|----------|-------|----------------|
| `feat/canonical-intent` | 1 | 2026-04-27 c83ca8e | clean | not run | **READY** — wallet 9-tier base; merge first |
| `feat/canonical-intent-cto` | 3 | 2026-04-27 35d3b37 | clean | **BUILD-FAIL** | **BLOCKED** — see defect below |
| `feat/fhe-verifier` | 7 | 2026-04-27 c714a90 | clean | inherits build-fail | **BLOCKED** on cto |
| `feat/fhe-threshold-decryptor` | 8 | 2026-04-27 9c15529 | clean | inherits build-fail | **BLOCKED** on cto |
| `feat/policy-canonical-tfhe-import` | 11 | 2026-04-27 3ebdd5a | clean | **FAIL** (build + 2 pkgs) | **BLOCKED** on cto + policy-test fix |
| `ci/arc-hanzo-consolidation` | 1 (8 behind) | 2026-04-23 682f4fb | clean | n/a | **REBASE-NEEDED** then merge — runner migration only |

### Build defect (apex of stack)

Commit `9244ac4` (Fireblocks-parity gas station) on `feat/canonical-intent-cto`
adds `airgapCommand(...)` and `buildHSMSignerConfig(...)` calls in
`cmd/mpcd/main.go` (lines 244, 871) **without committing the supporting
`airgap_*.go` and `hsm_signer_config.go` files**. Result:

```
cmd/mpcd/main.go:244:4: undefined: airgapCommand
cmd/mpcd/main.go:871:21: undefined: buildHSMSignerConfig
```

Every descendant branch (`fhe-verifier`, `fhe-threshold-decryptor`,
`policy-canonical-tfhe-import`) inherits this. `cmd/mpcd` does not build on
any of them. `pkg/policy`, `pkg/api`, `pkg/custody` also fail (treasury R6
regulator gate, pending-trades, expired-cleanup tests).

### Spot-test result on `feat/policy-canonical-tfhe-import`

```
FAIL    github.com/luxfi/mpc/cmd/mpcd       [build failed]
FAIL    github.com/luxfi/mpc/pkg/api        TestGetPendingTrades, TestGetPendingTrades_EmptyWallet, TestCleanupExpired
FAIL    github.com/luxfi/mpc/pkg/custody    TestR6_RequireRegulator_*, TestTreasury_CreateWallet_ValidatesShape, TestTreasury_Sign_NonSignerRejected
FAIL    github.com/luxfi/mpc/pkg/policy     (build/test fail)
ok      pkg/{hsm,infra,integrity,kms,kvstore,logger,settlement,smart,threshold,transport,txtracker,types,webauthn} (13 ok)
```

13 of 17 packages pass. Failures are the apex-stack work itself, not
infrastructure. Fix is local: commit the missing `airgap_*.go` and
`hsm_signer_config.go` files (they exist somewhere — likely uncommitted in a
worktree). Without them, the v0.60-v0.67 stack does not land.

## 2. luxcpp/crypto

`main` tip: ops/brand cleanup. Branches are **stacked**, not parallel:
all `*-2026-04-27` branches share base commits. `git rev-list … ^origin/main`
across the union shows only the date-2026-04-28 follow-up has unique-to-leaf
commits; the body of the work consolidates into 17 leaf tips.

### Leaf branches (commits ahead are cumulative through stack)

| Leaf | Ahead | Last | Conflict | Notes |
|------|------:|------|----------|-------|
| `aead-cuda-wgsl-2026-04-27` | 13 | 8091ca06 | clean | apex of AEAD stack (CUDA+WGSL+Metal+CPU) |
| `sha256-cuda-wgsl-2026-04-27` | 10 | 09dc1ab0 | clean | apex of bn254/bw/sha stack |
| `deps-bootstrap-2026-04-27` | 9 | 93524572 | clean | KZG + MLDSA/MLKEM/SLHDSA + Lamport + bw + aead + intx/evmmax |
| `pedersen-cuda-wgsl-2026-04-27` | 8 | 2674f9f0 | clean | full Pedersen CPU+Metal+CUDA |
| `fork-swap-luxfi-deps-2026-04-27` | 7 | cd11cf97 | clean | swap to luxfi-maintained intx/evmmax |
| `banderwagon-msm-vt-doc-2026-04-28` | 6 | (date) | clean | MSM caller doc (28 follow-up) |
| `brand-neutral-final-sweep-2026-04-27` | 4 | e817d037 | clean | header guards + macros + u256 + cabi rename |
| `bn254-cuda-wgsl-2026-04-27` | 4 | 6c4ea9fe | clean | CUDA/WGSL bn254 |
| `poseidon-cuda-wgsl-2026-04-27` | 4 | a75fd8de | clean | CUDA/WGSL poseidon |
| `ripemd160-cuda-wgsl-2026-04-27` | 4 | afd19ce6 | clean | |
| `ntt-poly-mul-cpp-cpu-2026-04-27` | 2 | a061830d | clean | NTT host body + KAT |
| `evm256-precompiles-cabi-2026-04-27` | 1 | 6ad9f846 | clean | bn254 + modexp + evm256 cabi (Phase 3) |
| `blake2b-cuda-wgsl-2026-04-27` | 1 | d0b4b74f | clean | |
| `blake3-impl-2026-04-27` | 1 | c4a1d2e0 | clean | |
| `brand-neutral-crypto-2026-04-27` | 1 | bc4edc2b | clean | feeds `brand-neutral-final-sweep` |
| `lamport-gpu-2026-04-27` | 1 | 17568f59 | clean | |
| `poseidon-bn254-2026-04-27` | 1 | 8fa5ad67 | clean | |

### Tests

Worktree was dirty (`banderwagon/gpu/cuda/banderwagon.cu` modified, on
`cabi-wire-complete-2026-04-28`). Did not run `ctest` to avoid contaminating
in-flight work. **Untested at audit time**, but commit messages claim
byte-equal-to-CPU-oracle KATs across most kernels. Verify post-merge in CI.

## 3. lux/crypto

`main` tip: brand-clean. 4 leaf branches, 90 commits cumulative:

| Leaf | Ahead | Last | Conflict | Notes |
|------|------:|------|----------|-------|
| `bls-rust-2026-04-27` | 11 | d693690 | clean | BLS-rust + poseidon-rust + ntt-polymul-rust stacked |
| `c-abi-prefix-uniform-2026-04-27` | 10 | 8c7d462 | clean | absorbs banderwagon-vanilla, verkle-vanilla, verkle-banderwagon-integrated, rust-crates-batch |
| `blake3-vanilla-2026-04-27` | 5 | 5efae54 | clean | absorbs secp256k1-vanilla |
| `brand-neutral-final-sweep-2026-04-27` | 3 | 36cba47 | clean | absorbs brand-neutral-crypto, pedersen-seed |

Tests: not run. lux/crypto is the Go rust-crates-mirror umbrella —
verification is via downstream consumer build, not local `go test`.

## 4. luxcpp/lattice — `feat/lp-137-types`

| Branch | Ahead | Last | Conflict | Tests |
|--------|------:|------|----------|-------|
| `feat/lp-137-types` | 4 | 7aba265 | clean | not run |

Top: `wire metal_ntt_available() into lattice_gpu_available()`,
`trust + privacy enum mirror`, `Lattigo-byte-equal Montgomery NTT + BatchNTT
ABI fix`, `PolyDomain + NTTContext + ReductionBudget headers`. C++ side of the
LP-137 GPU dispatch contract. **READY-TO-MERGE** pending CI validation.

## 5. lux/lattice — `feat/lp-137-types`

| Branch | Ahead | Last | Conflict | Tests |
|--------|------:|------|----------|-------|
| `feat/lp-137-types` | 4 | d11ec53c | clean | **BLOCKED** by go.sum env drift |

Top: `BatchEvaluate parallel API for N independent blind rotations`,
`trust + privacy enums for GPU runtime registry`, `Lattigo-byte-equal
Montgomery NTT dispatch path`, `PolyDomain + NTTContext + ReductionBudget`.
Go side of the same LP-137 contract. `go test` blocked locally by
`/Users/z/work/lux/evm/go.sum` checksum mismatch on `luxfi/consensus@v1.22.70`
(unrelated workspace problem, not branch-resident). **READY-TO-MERGE** pending
go.sum reconciliation in the workspace.

## 6. lux/threshold

| Branch | Ahead | Behind | Last | Conflict | Tests |
|--------|------:|-------:|------|----------|-------|
| `feat/tfhe-committee-canonical` | 2 | 4 | 2026-04-27 727f8d75 | clean | **BLOCKED** by same go.sum env drift |
| `lss-dynamic-resharing` | 0 | 165 | 2025-08-06 f28fc90f | clean | n/a |

`feat/tfhe-committee-canonical`: canonical committee surface for threshold-FHE
policy + direct `CombineShares` dispatch (kills HMAC mask shim).
**REBASE-NEEDED** (4 behind), then **READY**.

`lss-dynamic-resharing`: 165 commits **behind** main, last commit Aug 2025,
parent commit message says "strip out broken dynamic resharing (tbd)".
**ABANDON** — superseded entirely by mainline LSS implementation.

## 7. Aggregate findings

### Total work landed but unmerged

- 58 branches, ~274 commits ahead of their respective `main`
- All clean-merge against their respective `main` (no conflicts)
- 1 branch is fully stale (lss-dynamic-resharing — abandon)
- 1 branch family is build-broken at apex (lux/mpc cmd/mpcd)
- 2 branches blocked by workspace go.sum drift (lattice + threshold) — environment, not code

### Recommended merge order (DAG-aware)

1. **luxcpp/crypto** kernels — bottom-up: `evm256-precompiles-cabi` → `deps-bootstrap` → `fork-swap-luxfi-deps` → `bn254-cuda-wgsl` / `sha256-cuda-wgsl` / `aead-cuda-wgsl` / `pedersen-cuda-wgsl` / `poseidon-cuda-wgsl` / `ripemd160-cuda-wgsl` / `blake2b-cuda-wgsl` / `lamport-gpu` / `poseidon-bn254` / `ntt-poly-mul-cpp-cpu` → `brand-neutral-crypto` → `brand-neutral-final-sweep` → `banderwagon-msm-vt-doc-2026-04-28`. The 17 leaves collapse into one octopus or into the leaf with the deepest stack (`aead-cuda-wgsl`, then re-evaluate).
2. **lux/crypto** Rust mirror — `c-abi-prefix-uniform` (absorbs verkle/banderwagon/rust-crates-batch) → `bls-rust` → `blake3-vanilla` → `brand-neutral-final-sweep`. Depends on luxcpp/crypto C-ABI prefix landing.
3. **luxcpp/lattice** `feat/lp-137-types` — depends on luxcpp/crypto types being settled.
4. **lux/lattice** `feat/lp-137-types` — depends on luxcpp/lattice + go.sum reconciliation.
5. **lux/threshold** `feat/tfhe-committee-canonical` — depends on lux/lattice; rebase 4 commits, retest.
6. **lux/mpc** stack — only after threshold lands. Land in DAG order:
   `canonical-intent` → fix gas-station defect (commit missing airgap+hsm files) →
   `canonical-intent-cto` → `fhe-verifier` → `fhe-threshold-decryptor` →
   `policy-canonical-tfhe-import`. `ci/arc-hanzo-consolidation` rebases and lands at any time.

### Risk assessment

| Step | Risk | Justification |
|------|------|---------------|
| luxcpp/crypto kernel leaves | **LOW** | All clean-merge, claimed KATs, isolated kernels |
| luxcpp/crypto cabi rename / brand-neutral sweep | **MED** | wide surface (header guards, macros) — verify ABI equality post-merge |
| lux/crypto Rust mirrors | **LOW-MED** | Rust crate compile gates this naturally |
| luxcpp/lattice types | **LOW** | header-only + NTT dispatch wire |
| lux/lattice BatchEvaluate + NTT dispatch | **MED** | Go workspace go.sum must be reconciled first |
| lux/threshold canonical committee | **LOW** | small surface (2 commits), policy-only |
| lux/mpc canonical-intent | **LOW** | 1-commit wallet refactor |
| lux/mpc canonical-intent-cto | **HIGH** | requires recovering missing `airgap_*.go` and `hsm_signer_config.go` files first; gating the whole apex stack |
| lux/mpc fhe-verifier → policy-canonical-tfhe-import | **MED** | inherits cto risk + 4 failing tests in pkg/policy/api/custody to triage |

### Critical-path branches for LP-137 architecture claims

LP-137 claims (Metal NTT dispatch, threshold-FHE committee, policy-canonical
TFHE import, GPU-accelerated Pedersen/poseidon/BLS, byte-equal CPU oracles)
become true only when the following **8 branches** land:

1. `luxcpp/crypto` `deps-bootstrap-2026-04-27` (KZG + PQ vendoring)
2. `luxcpp/crypto` `fork-swap-luxfi-deps-2026-04-27` (intx+evmmax luxfi forks)
3. `luxcpp/crypto` `pedersen-cuda-wgsl-2026-04-27` (or `pedersen-cpp-cpu` minimum)
4. `luxcpp/crypto` `aead-cuda-wgsl-2026-04-27` (full AEAD set)
5. `luxcpp/lattice` `feat/lp-137-types`
6. `lux/lattice` `feat/lp-137-types`
7. `lux/threshold` `feat/tfhe-committee-canonical`
8. `lux/mpc` `feat/policy-canonical-tfhe-import` (apex)

Until all 8 land, LP-137 docs assert behavior the main branches do not yet
exhibit. Eight merges, one build defect to fix in `lux/mpc`, one go.sum drift
to reconcile in workspace, and one stale branch to delete.
