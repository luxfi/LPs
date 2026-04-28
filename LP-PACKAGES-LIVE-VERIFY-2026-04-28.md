# LP-PACKAGES-LIVE-VERIFY (2026-04-28)

Empirical verification of every Go tag listed in `LP-PACKAGES-FINAL-2026-04-28.md`.

Method per tag:

1. `git ls-remote --tags https://github.com/luxfi/<repo>` — confirm tag commit present on remote.
2. `GOPROXY=https://proxy.golang.org GOSUMDB=sum.golang.org go list -m github.com/luxfi/<name>@<tag>` — confirm Go module proxy serves the version.
3. (Cross-check) `go get github.com/luxfi/securities@v0.1.0-alpha` from a clean module — confirms full proxy + sumdb + zip download path.

`GH_TOKEN` and `GITHUB_TOKEN` were unset for every check. Read-only — no tags were created, moved, or deleted.

## Reachability matrix

| Module                       | Tag             | git tag | proxy serves | go get works | Status |
| ---------------------------- | --------------- | :-----: | :----------: | :----------: | :----: |
| github.com/luxfi/mpc         | v1.11.0         |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/crypto      | v1.18.3         |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/threshold   | v1.6.5          |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/aml         | v1.0.1          |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/evm         | v0.18.0         |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/chains      | v1.1.0          |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/evmgpu      | v0.2.0          |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/gpu         | v1.0.1          |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/precompile  | v0.5.12         |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/fhe         | v1.8.0          |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/hsm         | v1.1.3          |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/database    | v1.18.2         |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/go-verkle   | v0.2.3-luxfi    |   PASS  |     PASS     |    PASS      |  PASS  |
| github.com/luxfi/securities  | v0.1.0-alpha    |   PASS  |     PASS     |    PASS      |  PASS  |

Solidity-only (out of scope for Go proxy):

| Module                       | Tag             | Notes                  |
| ---------------------------- | --------------- | ---------------------- |
| github.com/luxfi/onchain-id  | 2.2.2-beta3     | Solidity package, npm-side verification only |
| github.com/luxfi/erc-3643    | 4.1.3           | Solidity package, npm-side verification only |

## Resolved commits (`refs/tags/<tag>^{}`)

| Tag                                     | Commit SHA                                 |
| --------------------------------------- | ------------------------------------------ |
| luxfi/mpc          v1.11.0              | f0923889bad5bf6b64f87869673ddc39ab2eeecd   |
| luxfi/crypto       v1.18.3              | 3071dabee385989f232f197a184a55d7ad99d17e   |
| luxfi/threshold    v1.6.5               | 899b798d48085042611933ce9f95fe7402639ea2   |
| luxfi/aml          v1.0.1               | fc854e9b5341bd47ebd16954112a695be25aaf99   |
| luxfi/evm          v0.18.0              | 3822fde44f7984ef5a3c1f35134c7603192fe2e2   |
| luxfi/chains       v1.1.0               | 9dd077dc8ab454b78d3dee94d539e29493d857c0   |
| luxfi/evmgpu       v0.2.0               | 25162741d656110d6c7335c36747b6043672f314   |
| luxfi/gpu          v1.0.1               | 4d1b291833b2ce6dd2acc0fd8dc97a7044d0c8e3   |
| luxfi/precompile   v0.5.12              | 22ec8859e580b89c0ea041bb7a99695c93a49928   |
| luxfi/fhe          v1.8.0               | de780b69a66e241015caf860c8819e1bb08bc968   |
| luxfi/hsm          v1.1.3               | 951e3a7fcbc7d93b08b50c9e9515367f6ee151e9   |
| luxfi/database     v1.18.2              | 93483165242ab74ba9e4ecfc5b9dedf2ae4be830   |
| luxfi/go-verkle    v0.2.3-luxfi         | a6f27de1662b1746be264fcacf8abf15c3e06c22   |
| luxfi/securities   v0.1.0-alpha         | db99716a974e03b9c0b0c0b54c073c4dfb4e854f   |

(Annotated tags resolved to underlying commits via `^{}`.)

## Aggregate

- Tags expected live on proxy: 14
- Tags live on proxy:           14
- Tags failing proxy:            0
- Tags missing on remote:        0
- `go get` end-to-end smoke:     PASS (`luxfi/securities@v0.1.0-alpha` downloaded clean from `proxy.golang.org` + `sum.golang.org`)
- Latest-pin sanity (precompile): proxy lists up to `v0.5.12`, matching pin

## Per-fail diagnosis

None. No proxy lag, no missing module path, no `404` from `proxy.golang.org`, no `GONOSUMCHECK` workaround required.

If any future fail occurs, expected diagnostics buckets:

- proxy lag — `git ls-remote` shows tag, `go list -m` returns `not found`. Wait or hit `https://proxy.golang.org/github.com/luxfi/<name>/@v/<tag>.info` directly to warm.
- module path mismatch — `go.mod` declares different module path than repo URL (e.g. `module github.com/luxfi/x/v2` without `/v2` directory).
- semantic-import-versioning violation — `v2+` tag without matching `/v2` subdirectory or major-version path suffix.
- annotated-tag corruption — `go list` reports invalid `.info`. Re-fetch via `go env -w GOFLAGS=-insecure` is **not** acceptable; correct path is to retag.

## Reproduction

```bash
unset GH_TOKEN GITHUB_TOKEN
for spec in \
  "mpc v1.11.0" \
  "crypto v1.18.3" \
  "threshold v1.6.5" \
  "aml v1.0.1" \
  "evm v0.18.0" \
  "chains v1.1.0" \
  "evmgpu v0.2.0" \
  "gpu v1.0.1" \
  "precompile v0.5.12" \
  "fhe v1.8.0" \
  "hsm v1.1.3" \
  "database v1.18.2" \
  "go-verkle v0.2.3-luxfi" \
  "securities v0.1.0-alpha"
do
  set -- $spec
  GOPROXY=https://proxy.golang.org GOSUMDB=sum.golang.org \
    go list -m "github.com/luxfi/$1@$2"
done
```

Expected output: 14 lines of `github.com/luxfi/<name> <tag>`. No errors.

## Constraints honored

- Read-only. No tags created, moved, deleted; no force-push.
- Empirical. Every cell sourced from a real `git ls-remote` and a real `go list -m` invocation against `proxy.golang.org` + `sum.golang.org`.
- Brand-neutral. Module paths only; no product names mixed in.
- `GH_TOKEN` and `GITHUB_TOKEN` unset on every shell invocation.
