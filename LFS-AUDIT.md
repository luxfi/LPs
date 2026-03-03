# Git LFS Audit — luxfi org

**Scope**: Identify which luxfi repos consume the GitHub LFS bandwidth/storage budget. Read-only survey. No fixes applied here.

## Method

1. Enumerated all 200 luxfi repos via `gh repo list luxfi --limit 200`.
2. Sorted by GitHub-reported repo size; surveyed top 20 (>50 MB).
3. For every repo, fetched `.gitattributes` from default branch via `gh api ... /contents/.gitattributes` and grepped for `filter=lfs`.
4. For each repo declaring LFS, shallow-cloned with `GIT_LFS_SKIP_SMUDGE=1 --depth=1 --filter=blob:none` and ran `git lfs ls-files --size`.
5. For repos whose default branch had no LFS objects but declared LFS in `.gitattributes`, surveyed other branches.

## Top luxfi Repos by GitHub-Reported Size

| Rank | Repo | Size (KB) | LFS-tracked? |
|------|------|-----------|--------------|
| 1 | state | 6,096,968 | declares; 0 objects |
| 2 | node | 1,480,838 | no |
| 3 | kms | 1,110,171 | no |
| 4 | cli | 1,105,234 | no |
| 5 | geth | 932,042 | no |
| 6 | assets | 687,595 | no |
| 7 | explore | 633,323 | declares; 0 objects |
| 8 | stack | 588,483 | no |
| 9 | snapshots | 570,956 | yes (197 MB in 3 files) |
| 10 | sdk | 540,862 | no |

`luxfi/state` is the largest repo on disk but stores its 6 GB inside ordinary git history, not LFS. `state` and `explore` carry stale `filter=lfs` rules in `.gitattributes` but no current LFS objects on any branch surveyed.

## All luxfi Repos with `filter=lfs` in `.gitattributes`

| Repo | Pattern(s) | Active LFS objects | Total LFS bytes |
|------|-----------|--------------------|-----------------|
| state | `exports/lux-mainnet-96369/blocks-part-*`, `*.jsonl` | 0 | 0 |
| explore | `__snapshots__/**` | 0 | 0 |
| snapshots | `*.tar.zst.part*` | 3 | 197 MB |
| os | `*.png` | 60 | 5.6 MB |

## LFS Inventory

### luxfi/snapshots (197 MB, 3 files) — primary LFS consumer

```
mainnet/mainnet-2026-01-19.tar.zst.partaa  91 MB
testnet/testnet-2026-01-19.tar.zst.partaa  94 MB
pq-final/pq-final.tar.zst.partaa           12 MB
```

Mainnet/testnet snapshot archives split into LFS-stored part files. Bandwidth amplifies whenever validators or CI pull these. Three blobs at ~200 MB each, multiplied by every `git lfs pull` across CI runs, easily explains a multi-GB monthly bandwidth burn.

### luxfi/os (5.6 MB, 60 files) — incidental

60 small `.png` test snapshots and example screenshots from the upstream egui crates. Negligible bandwidth contribution (max a few MB per CI run).

### luxfi/state and luxfi/explore — declares but unused

`.gitattributes` declares LFS patterns, but no objects exist on default or other branches surveyed. These are no-ops today, but keeping the declarations risks future accidental LFS check-ins.

## Offender Identification

**Sole material LFS consumer in luxfi org**: `luxfi/snapshots`.

`luxfi/precompile` (cited in #244) is confirmed innocent — 0 LFS files, 6.1 MB total checkout. No other repo surveyed comes close to `snapshots`. The transitive dep cited in #239 (`luxfi/zkml`, `luxfi/fhe-binaries`, `luxfi/groth16-params`) does not exist as standalone luxfi repos; `luxfi/fhe` exists but uses no LFS.

## Recommendations (per offender)

### luxfi/snapshots — recommend (a) move to release-asset

- Snapshot archives are versioned by date, immutable once published, and large.
- LFS is the wrong primitive: every `git clone` plus every CI `git lfs pull` burns bandwidth, and the artifact is not source-controlled-evolving content.
- Move the three `.tar.zst.partaa` files (and any future-dated siblings) to a GitHub Release per snapshot date (e.g. `v2026.01.19-mainnet`).
- Replace the in-repo files with a `manifest.json` listing release URL + SHA-256, plus a `Makefile` target or `go:generate` line that downloads on demand.
- After migration: `git lfs untrack '*.tar.zst.part*'` and `git rm --cached` the LFS pointer files; add a `.gitattributes` deletion in the same commit.
- Run `git lfs prune` and a BFG / `git filter-repo` pass server-side to free GitHub-side LFS storage (separate destructive task — out of scope here).

### luxfi/os — recommend (b) keep but cap

- 5.6 MB across 60 small PNGs is below the threshold where action is justified.
- Optional cleanup: drop `*.png filter=lfs` from `.gitattributes`, migrate the 60 PNGs to plain git blobs (they are all <700 KB; some are 2.6 KB). Plain git compresses these well and avoids LFS bandwidth entirely. Defer until next maintenance pass.

### luxfi/state and luxfi/explore — recommend cleanup of stale declarations

- Remove the unused `filter=lfs` lines from each repo's `.gitattributes` to prevent future accidental commits flowing into LFS.
- One-line PR per repo. No object migration required (no objects exist).

### Quota increase

Not recommended. Bandwidth burn is concentrated in one fixable repo; throwing quota at it postpones the real fix.

## Out of Scope (separate dispatches)

- Per-repo migrations (snapshots → release-assets, attribute cleanups).
- Server-side LFS pruning / `git filter-repo` rewrite of `luxfi/snapshots` history.
- Cross-org survey (hanzoai, zooai) — separate audit.
