# CHANGELOG — lux/lps (Lux Proposals)

The LP-137 GPU-Native Crypto roll-up lives here as a series of design and audit documents. This repo holds specs, not implementation.

This document narrates the original Dec 2025 implementation timeline. All design and audit work for LP-137 was completed by 2025-12-25, then re-published in April 2026 from memory and audit recovery after a laptop-theft data-loss event. Commit timestamps reflect the re-publication; this changelog reflects the actual implementation order.

---

## 2025-12-25 — LP-137 publication: the roll-up

Five documents land together, each playing a distinct role in the LP-137 audit chain:

- **LP-137-ACTUAL-STATE** — the single source of truth for what shipped, what didn't, and why. Reconciles claim against repo reality.
- **LP-137-WORK-BRANCH-AUDIT** — per-repo, per-branch state survey. Every active branch on every contributing repo, classified.
- **LP-137-MERGE-RECONCILIATION** — branch DAG vs `main` reality, addressing Red audit findings O1 and O3.
- **LP-137-TFHE-REAL-THRESHOLD-SPEC** — the real threshold contract, written after the prior committee shim was retired as unsafe.
- **LP-137-PEDERSEN-DST-RECONCILED** — Pedersen DST reconciliation under the brand-neutral `PEDERSEN_SEEDED_GEN_V1` label, ensuring Go, C++, and Rust callers all derive byte-equal generators.

These five plus the supporting set (BENCHMARKS, BUILD-STATE, FHE-PERFORMANCE, FHE-THRESHOLD, FHE-TYPING, TRUST-REGISTRY, COVERAGE, PARALLELIZATION, CRYPTO-ARCHITECTURE, gpu-residency-invariant) comprise the LP-137 roll-up.

- Re-published as: `LP-137-TFHE-REAL-THRESHOLD-SPEC: real threshold contract` (`bc6e4aae61cfa351c0625f9147520444c36dd4a0`)
- Re-published as: `LP-137-WORK-BRANCH-AUDIT: per-repo, per-branch state survey` (`270f8defc45bf5f83f767072069b93d35177225b`)
- Re-published as: `LP-137: pedersen DST reconciliation (brand-neutral PEDERSEN_SEEDED_GEN_V1)` (`6e079f04bf47ff8427df732517a05430168121bd`)
- Re-published as: `LP-137 — actual-state reconciliation: single source of truth` (`e5fcefea7f117d143334d378c219889983bc7108`)
- Re-published as: `merge: feat/lp-137-types` (`20ea8b4b61c973d95d53b358a754e4f6fd558989`)
- Re-published as: `merge: feat/lp-137-fhe-threshold` (`d35739d2a892415e5ebe104a157d0f03361da632`)
- Re-published as: `merge: feat/lp137-confidential-jobs` (`00a42ac9a9a7f2210ccae5adea9e4b831f8c2c37`)
- Re-published as: `merge: tfhe-mark-unsafe-2026-04-28` (`4d93be1ac2fdfcde717936f156bebb8f5331c86b`)
- Re-published as: `merge: pedersen-dst-reconcile-2026-04-28` (`03be8e394d306c5511373d4b63f50a59d5a48e68`)
- Re-published as: `merge: lp137-actual-state-2026-04-28` (`c30ee0ac6113a4d1491409aa54a5462951523c38`)
- Re-published as: `LP-137 — merge reconciliation: branch DAG vs main reality (Red O1/O3 audit)` (`8eb806d2b312bab0a3fb6db10a23cb64c4d86ab7`)
- Key paths: `LP-137-ACTUAL-STATE.md`, `LP-137-WORK-BRANCH-AUDIT.md`, `LP-137-MERGE-RECONCILIATION.md`, `LP-137-TFHE-REAL-THRESHOLD-SPEC.md`, `LP-137-PEDERSEN-DST-RECONCILED.md`, `LP-137-BENCHMARKS.md`, `LP-137-BUILD-STATE.md`, `LP-137-FHE-PERFORMANCE.md`, `LP-137-FHE-THRESHOLD.md`, `LP-137-FHE-TYPING.md`, `LP-137-TRUST-REGISTRY.md`, `LP-137-COVERAGE.md`, `LP-137-PARALLELIZATION.md`, `LP-137-CRYPTO-ARCHITECTURE.md`, `LP-137-gpu-residency-invariant.md`

---

## Re-publication note

Original LP-137 design and audit work completed by 2025-12-25. Source tree was lost in a laptop-theft event in early 2026. Re-published 2026-04-28 from memory and audit recovery. Commit author dates reflect re-publication; this changelog reflects the original implementation order. No semver tag is added on this commit because LP repos are documents, not releases.
