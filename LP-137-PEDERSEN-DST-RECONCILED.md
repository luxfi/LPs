# LP-137 — Pedersen DST Reconciliation

Date: 2026-04-28
Repo: github.com/luxfi/crypto
Issue: #196

## Per-Branch State (audited)

| Branch | SHA | `pedersen.go` G/H DST | `pedersen_seed.go` SeededGenDST | Notes |
|---|---|---|---|---|
| `main` | bb09086 | `LUX_PEDERSEN_G`, `LUX_PEDERSEN_H` | (file absent) | seed feature not yet merged; still LUX_-prefixed |
| `origin/pedersen-seed-2026-04-27` | c673db6 | `LUX_PEDERSEN_G`, `LUX_PEDERSEN_H` | `LUX_PEDERSEN_SEEDED_GEN_V1` | original feature branch (pre brand-neutral) |
| `origin/brand-neutral-crypto-2026-04-27` | 198282e | `PEDERSEN_G_V1`, `PEDERSEN_H_V1` | `PEDERSEN_SEEDED_GEN_V1` | DST rename + golden regenerated |
| `origin/brand-neutral-final-sweep-2026-04-27` | 36cba47 | `PEDERSEN_G_V1`, `PEDERSEN_H_V1` | `PEDERSEN_SEEDED_GEN_V1` | superset of crypto-04-27; only adds rust c-abi header rename |

The "bn254-Metal fix agent" report citing on-disk `LUX_PEDERSEN_SEEDED_GEN_V1`
matches the working tree only when checked out at `origin/pedersen-seed-2026-04-27`
or `main`. On the brand-neutral branches the DST is bare. No `pedersen-cpp-cpu-2026-04-27`
branch exists on origin; no `pedersen/cpp/pedersen.cpp` exists in any branch — the
prompt's HEAD `e506cae9` and C++ source path are not reproducible. Treated as not yet pushed.

## Canonical Decision

DSTs (algorithm names ARE the namespace; product brand stripped):

- `NewGenerators` G  → `PEDERSEN_G_V1`
- `NewGenerators` H  → `PEDERSEN_H_V1`
- `NewGeneratorsFromSeed` → `PEDERSEN_SEEDED_GEN_V1`

Hash-to-curve: BN254 G1 via RFC 9380 SVDW; cofactor 1, no clearing.
Seed format for `FromSeed`: `msg_i = seed[32] || u64_le(i)`.

## Golden Vectors (canonical, brand-neutral DST, seed = `[0,1,…,31]`)

From `origin/brand-neutral-crypto-2026-04-27` `pedersen/pedersen_seed_test.go`:

```
G[0..31] = c563aa8a283f268b65b4210a0a78ee1341f76b59d94c1ac626effe1a5aa0c6b7
H[0..31] = e9ebf4392683dcb418584dd8ecd1e1dd16b486147e676dbf4b62779a340f3186
```

Pre-rename (LUX_-prefixed) values for archive only — do NOT match any new vector:

```
G_old = afba7c7a97100c5eb0ec96758698779b5d8d38d228bcdb7c85a4c1626ea5247a
H_old = abc19b5bad508d8e7b944a37812a342cdbaa5946f0b3fd854805820c006c6110
```

`NewGenerators` G/H golden bytes are not yet frozen as a hard-coded vector in
the repo; they are derived at init from the bare DSTs above. When a Rust/C++
KAT lands, freeze them in a `testdata/` JSON keyed by DST.

## Action Items

1. `main` — behind. Merge `origin/brand-neutral-final-sweep-2026-04-27`
   (superset, includes rust c-abi rename). After merge, residual
   `LUX_PEDERSEN_*` in production paths is gone.
2. `origin/pedersen-seed-2026-04-27` — superseded. Delete after step 1 lands.
3. `origin/brand-neutral-crypto-2026-04-27` — superseded by final-sweep
   (linear, +1 commit). Delete after step 1 lands.
4. `origin/brand-neutral-final-sweep-2026-04-27` — fast-forward into `main`.
   No conflicts (main is 0 commits ahead).
5. C++ port — when the missing `pedersen-cpp-cpu-2026-04-27` branch is
   pushed, its `pedersen.cpp` MUST hard-code DST string `PEDERSEN_SEEDED_GEN_V1`
   (no `LUX_` prefix) and reproduce the G/H bytes above byte-for-byte. KAT
   harness in Go: `pedersen/pedersen_seed_test.go::TestNewGeneratorsFromSeed_GoldenVector`.
6. Re-derivation — not required. The brand-neutral branch already regenerated
   the golden vector for the bare DST + `[0..31]` seed; locked.

## References

- Branches: `origin/brand-neutral-final-sweep-2026-04-27` (canonical), `origin/brand-neutral-crypto-2026-04-27`
- Files: `pedersen/pedersen.go`, `pedersen/pedersen_seed.go`, `pedersen/pedersen_seed_test.go`
- Test: `TestNewGeneratorsFromSeed_GoldenVector`
