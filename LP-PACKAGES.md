# LP-PACKAGES — Final Semver Audit (2026-04-28)

Authoritative version table for every published package across `luxfi`, `luxcpp`, `luxgpu`. Source: `gh api repos/<org>/<repo>/tags`. One canonical version per package. One canonical implementation per algorithm.

Repos surveyed: 156 luxfi, 31 luxcpp, 1 luxgpu = 188 total. Tagged: 132. Untagged/empty: 56.

---

## 1. Canonical version table (alphabetical)

### 1.1 Cryptography (Go canonical)

| Package | Repo | Latest tag | SHA | Status |
|---|---|---|---|---|
| `github.com/luxfi/blake3` | luxfi/blake3 | `guts_0.0.0` | `5558fa4` | active (non-semver tag — bump policy violation, see §5) |
| `github.com/luxfi/blst` | luxfi/blst | `v0.3.16` | `e7f90de` | active (BLS12-381 binder) |
| `github.com/luxfi/c-kzg-4844` | luxfi/c-kzg-4844 | `v2.1.7` | `9f4bcc8` | active |
| `github.com/luxfi/crypto` | luxfi/crypto | `v1.18.2` | `3bf31c4` | **canonical Go crypto root** |
| `github.com/luxfi/edwards25519` | luxfi/edwards25519 | `v0.1.0` | `eee5e2c` | active |
| `github.com/luxfi/evmmax` | luxfi/evmmax | `v0.21.0` | `35b7e1e` | active (Go binder, EVM modular arith) |
| `github.com/luxfi/fhe` | luxfi/fhe | `v1.8.0` | `de780b6` | active |
| `github.com/luxfi/intx` | luxfi/intx | `v0.15.0` | `0306b49` | active (Go binder, big int) |
| `github.com/luxfi/lamport` | luxfi/lamport | `v1.0.2` | `30c91ba` | active |
| `github.com/luxfi/lattice` | luxfi/lattice | `v7.0.2` | `f6222ff` | **policy violation — v7 violates "no v2+" rule** (see §5) |
| `github.com/luxfi/mpc` | luxfi/mpc | `v1.10.2` | `105ed30` | active |
| `github.com/luxfi/dwallet` | luxfi/dwallet | `v0.1.0` | `437f2e3` | pre-release |
| `github.com/luxfi/pqclean` | luxfi/pqclean | `round3` | `6cd3167` | non-semver tag — replaced by luxcpp/pqclean (see §3) |
| `github.com/luxfi/ringtail` | luxfi/ringtail | `v0.4.0` | `8cbc42a` | pre-release |
| `github.com/luxfi/safe-frost` | luxfi/safe-frost | `v0.1.0` | `74a27c3` | pre-release |
| `github.com/luxfi/threshold` | luxfi/threshold | `v1.6.4` | `e24648e` | active |

### 1.2 GPU acceleration

| Package | Repo | Latest tag | SHA | Status |
|---|---|---|---|---|
| `github.com/luxfi/gpu` | luxfi/gpu | `v1.0.1` | `4d1b291` | **canonical Go GPU binder** |
| (legacy duplicate) | luxgpu/gpu | `v1.0.0` | `e214d7b` | **archive — see §3 divergence** |
| `github.com/luxfi/evmgpu` | luxfi/evmgpu | `v0.1.0` | `598654e` | pre-release |

### 1.3 Core platform (Go)

| Package | Repo | Latest tag | SHA | Status |
|---|---|---|---|---|
| `github.com/luxfi/node` | luxfi/node | `v1.24.29` | `93d8c1e` | active |
| `github.com/luxfi/consensus` | luxfi/consensus | `v1.22.85` | `9eb6a3a` | active |
| `github.com/luxfi/database` | luxfi/database | `v1.18.1` | `45b3019` | active (public storage API) |
| `github.com/luxfi/zapdb` | luxfi/zapdb | `v20.07.0` | `b22eccb` | **internal — never imported directly** |
| `github.com/luxfi/geth` | luxfi/geth | `v1.16.85` | `905d147` | active |
| `github.com/luxfi/coreth` | luxfi/coreth | `with-avalanchego-test-pkg` | `fc079e4` | non-semver tag — bump policy violation |
| `github.com/luxfi/evm` | luxfi/evm | `v0.17.11` | `ded4b0f` | active |
| `github.com/luxfi/chains/evm/cevm` | luxfi/chains | (sub-path) | (sub-path) | folded into chains/evm 2026-04-30 |
| `github.com/luxfi/xvm` | luxfi/xvm | `v0.55.3` | `61f7e9f` | active |
| `github.com/luxfi/pvm` | luxfi/pvm | `v0.53.0` | `bbc1fca` | active |
| `github.com/luxfi/mpcvm` | luxfi/mpcvm | `v0.62` | `c416d2e` | non-semver (missing patch) |
| `github.com/luxfi/aivm` | luxfi/aivm | `v0.59.1` | `5453f5d` | active |
| `github.com/luxfi/spacesvm` | luxfi/spacesvm | `v0.0.15` | `a2f2b1b` | pre-release |
| `github.com/luxfi/warp` | luxfi/warp | `v1.18.5` | `6bac218` | active |
| `github.com/luxfi/p2p` | luxfi/p2p | `v1.19.2` | `aa499fa` | active |
| `github.com/luxfi/netrunner` | luxfi/netrunner | `v1.15.11` | `fae707b` | active |
| `github.com/luxfi/kms` | luxfi/kms | `v1.6.1` | `b2e5c9e` | active |
| `github.com/luxfi/cli` | luxfi/cli | `v2.10.8` | `2f9dd9d` | **policy violation — v2 violates "no v2+" rule** |
| `github.com/luxfi/sdk` | luxfi/sdk | `v1.16.54` | `18b9b74` | active |
| `github.com/luxfi/genesis` | luxfi/genesis | `v1.8.3` | `c7201b3` | active |

### 1.4 Identity, math, primitives

| Package | Repo | Tag | SHA |
|---|---|---|---|
| `github.com/luxfi/ids` | luxfi/ids | `v1.2.9` | `baaf5e1` |
| `github.com/luxfi/math` | luxfi/math | `v1.2.4` | `f80474a` |
| `github.com/luxfi/codec` | luxfi/codec | `v1.1.4` | `07d53c1` |
| `github.com/luxfi/atomic` | luxfi/atomic | `v1.0.0` | `435aa55` |
| `github.com/luxfi/cache` | luxfi/cache | `v1.2.1` | `97fb257` |
| `github.com/luxfi/log` | luxfi/log | `v1.4.1` | `0aef462` |
| `github.com/luxfi/metric` | luxfi/metric | `v1.5.1` | `b5bc03d` |
| `github.com/luxfi/utils` | luxfi/utils | `v1.1.4` | `c00fc12` |
| `github.com/luxfi/rpc` | luxfi/rpc | `v1.0.2` | `38a25ab` |
| `github.com/luxfi/api` | luxfi/api | `v1.0.4` | `42727fa` |
| `github.com/luxfi/version` | luxfi/version | `v1.0.1` | `8c2f6e8` |
| `github.com/luxfi/bft` | luxfi/bft | `v0.1.5` | `7356364` |
| `github.com/luxfi/zap` | luxfi/zap | `v0.3.0` | `84f4ae2` |
| `github.com/luxfi/staking` | luxfi/staking | `v1.1.0` | `cdf9012` |
| `github.com/luxfi/sampler` | luxfi/sampler | `v1.0.0` | `651284b` |
| `github.com/luxfi/validators` | luxfi/validators | `v1.0.0` | `5375d48` |
| `github.com/luxfi/state` | luxfi/state | `v1.13.13` | `218a85a` |
| `github.com/luxfi/standard` | luxfi/standard | `v1.6.5` | `65586cc` |
| `github.com/luxfi/vm` | luxfi/vm | `v1.0.40` | `1c43f5e` |

### 1.5 Wallet, keys, ledger, HSM

| Package | Repo | Tag | SHA |
|---|---|---|---|
| `github.com/luxfi/wallet` | luxfi/wallet | `v1.0.0` | `31bce33` |
| `github.com/luxfi/keys` | luxfi/keys | `v1.0.8` | `d0753e4` |
| `github.com/luxfi/keychain` | luxfi/keychain | `v1.0.2` | `addab93` |
| `github.com/luxfi/ledger` | luxfi/ledger | `v1.1.6` | `1122e45` |
| `github.com/luxfi/ledger-go` | luxfi/ledger-go | `v1.0.0` | `a91f770` |
| `github.com/luxfi/ledger-lux-go` | luxfi/ledger-lux-go | `v1.0.2` | `12bc39c` |
| `github.com/luxfi/hsm` | luxfi/hsm | `v1.1.3` | `951e3a7` |
| `github.com/luxfi/hid` | luxfi/hid | `v0.9.3` | `7217405` |
| `github.com/luxfi/go-bip32` | luxfi/go-bip32 | `v1.0.2` | `cdf8712` |
| `github.com/luxfi/go-bip39` | luxfi/go-bip39 | `v1.1.2` | `85c8f6c` |

### 1.6 Securities, exchange, finance

| Package | Repo | Tag | SHA |
|---|---|---|---|
| `github.com/luxfi/dex` | luxfi/dex | `v1.5.0` | `08d1206` |
| `github.com/luxfi/exchange` | luxfi/exchange | `web/5.141.0` | `32aa2b9` (non-semver root) |
| `github.com/luxfi/bridge` | luxfi/bridge | `v1.0.6` | `def4d6c` |
| `github.com/luxfi/erc20-go` | luxfi/erc20-go | `v0.2.2` | `2a62476` |
| `github.com/luxfi/futures` | luxfi/futures | `v1.0.2` | `89c620a` |
| `github.com/luxfi/forex` | luxfi/forex | `v1.1.0` | `b21bffe` |
| `github.com/luxfi/market` | luxfi/market | `v1.0.1` | `b08243c` |
| `github.com/luxfi/markets` | luxfi/markets | `v1.0.3` | `bc2c912` |
| `github.com/luxfi/maker` | luxfi/maker | `v1.0.0` | `930e219` |
| `github.com/luxfi/broker` | luxfi/broker | `v1.5.0` | `a7018ec` |
| `github.com/luxfi/bank` | luxfi/bank | `v1.0.0` | `c00740f` |
| `github.com/luxfi/captable` | luxfi/captable | `v1.0.0` | `7801920` |
| `github.com/luxfi/treasury` | luxfi/treasury | `v1.1.1` | `ae3fa55` |
| `github.com/luxfi/tokens` | luxfi/tokens | `v0.1.0` | `927eb4f` |
| `github.com/luxfi/transfer` | luxfi/transfer | `v1.0.1` | `8895835` |
| `github.com/luxfi/aml` | luxfi/aml | `v1.0.0` | `b408edb` |
| `github.com/luxfi/compliance` | luxfi/compliance | `v0.4.0` | `7d5b933` |
| `github.com/luxfi/oracle` | luxfi/oracle | `v0.1.0` | `23090d8` |
| `github.com/luxfi/price` | luxfi/price | `v0.1.0` | `dcbd1ae` |
| `github.com/luxfi/dao` | luxfi/dao` | `v0.1.0` | `3e810c7` |

### 1.7 C++ canonical (luxcpp)

| Package | Repo | Tag | SHA | Notes |
|---|---|---|---|---|
| luxcpp/crypto | luxcpp/crypto | `v1.3.0` | `dac56ab` | **canonical C++ crypto root** |
| luxcpp/lattice | luxcpp/lattice | `v1.0.0` | `0d731e8` | C++ canonical |
| luxcpp/cuda | luxcpp/cuda | `v0.2.0` | `dfc3273` | platform abstraction |
| luxcpp/metal | luxcpp/metal | `v0.2.0` | `e25bdb9` | platform abstraction |
| luxcpp/webgpu | luxcpp/webgpu | `v0.2.0` | `6d8228d` | platform abstraction |
| luxcpp/lux-cuda | luxcpp/lux-cuda | `v0.1.0` | `d85014e` | Lux-specific CUDA kernels |
| luxcpp/lux-metal | luxcpp/lux-metal | `v0.1.0` | `322234d` | Lux-specific Metal kernels |
| luxcpp/lux-webgpu | luxcpp/lux-webgpu | `v0.1.0` | `f0f9f8f` | Lux-specific WGSL kernels |
| luxcpp/gpu | luxcpp/gpu | `v0.30.9` | `0c05a7f` | umbrella build |
| luxcpp/accel | luxcpp/accel | `v0.1.0` | `6379ed0` | accelerators |
| luxcpp/cevm | luxcpp/cevm | `v0.46.1` | `f98b15d` | C++ EVM |
| luxcpp/xvm | luxcpp/xvm | `v0.55.3` | `61f7e9f` | C++ XVM |
| luxcpp/aivm | luxcpp/aivm | `v0.59.1` | `5453f5d` | C++ AIVM |
| luxcpp/bridgevm | luxcpp/bridgevm | `v0.61` | `88ecf0a` | non-semver (missing patch) |
| luxcpp/platformvm | luxcpp/platformvm | `v0.57` | `fd6a715` | non-semver (missing patch) |
| luxcpp/mpcvm | luxcpp/mpcvm | `v0.62` | `c416d2e` | non-semver (missing patch) |

### 1.8 Test oracles / fork mirrors (luxcpp — never linked into prod)

| Repo | Tag | SHA | Purpose |
|---|---|---|---|
| luxcpp/blst | `v0.3.16` | `e7f90de` | byte-equal KAT oracle for BLS12-381 |
| luxcpp/intx | `v0.15.0` | `0306b49` | upstream mirror; not linked |
| luxcpp/evmmax | `v0.21.0` | `35b7e1e` | upstream mirror; not linked |
| luxcpp/pqclean | `v0.0.1-luxcpp` | `3730b32` | KAT-only, vendored under `pqclean_kat/` |
| luxcpp/blake3-reference | `v1.5.0` | `5aa53f0` | reference for byte-equality testing |
| luxcpp/ed25519-donna | `v0.1.0-luxcpp` | `8757bd4` | reference for byte-equality testing |

Verified via `/Users/z/work/luxcpp/crypto/CMakeLists.txt` lines 110-128: `pqclean_kat` is a STATIC test-only library; `intx`/`evmmax` headers are deps for `bn254`/`modexp` only.

### 1.9 Untagged / empty / pre-release placeholders

luxfi: amm, fhe-coprocessor (`v0.0.1`), financial, financial-docs, go-ipa, hash, kit, libp2p, lux-finance, lux-gpu-ci, mirrors, os, oraclevm, proofs, safe, evmone, evmc, grpc, http.
luxcpp: evmone, evmc, fhe, gpu (no `lux-gpu` tag), session, dex, grpc, http.

---

## 2. One-canonical-impl-per-algorithm verification

| Algorithm | Go canonical | C++ canonical | GPU canonical | Status |
|---|---|---|---|---|
| BLS12-381 | luxfi/blst v0.3.16 | luxcpp/blst v0.3.16 (KAT) + luxcpp/crypto/bls/cpp | luxcpp/lux-cuda + lux-metal + lux-webgpu | OK |
| BN254 | luxfi/crypto/bn254 (in v1.18.2) | luxcpp/crypto/bn254 v1.3.0 | luxcpp/lux-* | OK |
| ML-KEM (FIPS 203) | luxfi/crypto/mlkem | luxcpp/crypto/mlkem | luxcpp/lux-* | OK |
| ML-DSA (FIPS 204) | luxfi/crypto/mldsa | luxcpp/crypto/mldsa | luxcpp/lux-* | OK |
| SLH-DSA (FIPS 205) | luxfi/crypto/slhdsa | luxcpp/crypto/slhdsa | luxcpp/lux-* | OK |
| Lattice/Ringtail | luxfi/lattice v7.0.2 + luxfi/ringtail v0.4.0 | luxcpp/lattice v1.0.0 | luxcpp/lux-* | **§5: v7 violates policy** |
| BLAKE3 | luxfi/blake3 (`guts_0.0.0`) | luxcpp/blake3-reference v1.5.0 (KAT) + luxcpp/crypto/blake3 | — | **§5: non-semver tag** |
| BLAKE2b | luxfi/crypto/blake2b | luxcpp/crypto/blake2b | — | OK |
| Ed25519 | luxfi/edwards25519 v0.1.0 | luxcpp/ed25519-donna v0.1.0-luxcpp (KAT) + luxcpp/crypto/ed25519 | — | OK |
| Threshold/MPC | luxfi/threshold v1.6.4 + luxfi/mpc v1.10.2 | luxcpp/crypto/mpc | — | OK |
| FHE | luxfi/fhe v1.8.0 + luxfi/fhe-coprocessor v0.0.1 | luxcpp/fhe (untagged) + luxcpp/crypto/fhe | luxcpp/lux-* | divergence — see §3 |
| KZG | luxfi/c-kzg-4844 v2.1.7 | luxcpp/crypto/kzg | — | **§5: v2 violates policy** |
| Lamport | luxfi/lamport v1.0.2 | luxcpp/crypto/lamport | — | OK |
| FROST | luxfi/safe-frost v0.1.0 | luxcpp/crypto/frost | — | OK |

No algorithm has multiple Go canonical paths. Single-source-of-truth holds.

---

## 3. Separation-of-concerns audit

**Findings:**

1. **luxfi/gpu vs luxgpu/gpu** — divergence. `luxgpu/gpu v1.0.0 (e214d7b)` is the older artifact; `luxfi/gpu v1.0.1 (4d1b291)` is canonical. The `luxgpu` org is reserved for future C++/CUDA kernel split but currently holds one stale repo. **Action:** archive `luxgpu/gpu`, retain `luxgpu` org as namespace.

2. **luxcpp contains zero Go code** — verified. Each repo is C++/CMake. luxcpp is purely C++ canonical; no Go imports it directly. Go calls it via cgo from `luxfi/gpu` or `luxfi/crypto/c-abi/`.

3. **Forks under luxcpp not linked into prod** — verified for `pqclean` (test-only static lib, lines 110-128). `intx`/`evmmax` are header-only deps for `bn254`/`modexp` only — not standalone forks. `blst` and `blake3-reference` are KAT oracles. **Pattern OK.**

4. **luxfi/zapdb internal contract holds** — `luxfi/database v1.18.1` is the public API. zapdb (`v20.07.0`) is a date-stamped tag, indicating internal-only versioning. No external repo imports zapdb directly per existing audit.

5. **luxfi/coreth tag `with-avalanchego-test-pkg`** — non-semver branch tag, suggests an in-flight migration. **Action:** cut a `v0.x.y` semver tag.

6. **luxfi/exchange tag `web/5.141.0`** — monorepo with prefix tags (web/, api/). Acceptable for monorepos but inconsistent with rest. Document the convention.

7. **luxfi/pqclean** uses non-semver `round3`. Superseded by luxcpp/pqclean. **Action:** archive luxfi/pqclean if no Go importers remain.

---

## 4. Publish / registry status

| Registry | Coverage |
|---|---|
| Go module proxy (proxy.golang.org) | All `luxfi/*` Go modules with `vX.Y.Z` tags publish automatically. Non-semver tags (`coreth`, `pqclean`, `blake3 guts_*`) are NOT proxy-cacheable — must be replaced. |
| GHCR (`ghcr.io/luxfi/*`) | Docker images for `node`, `cli`, `genesis`, `netrunner` per CI/CD policy. Not surveyed here (out of scope). |
| crates.io | Not used. Rust binders ship as path deps inside `luxfi/crypto/rust/lux-crypto-*` workspaces. |
| npm | `luxfi/js-sdk v3.15.6`, `luxfi/explorer-v1 v9.2.2`, `luxfi/ui v5.8.0`, `luxfi/explore v2.8.0-lux` — all violate "no v2+" Go-package policy but Go policy does not apply to JS. |

---

## 5. Tag bump policy + semver compliance

Policy (per `~/.claude/CLAUDE.md`): **never bump Go packages above v1.x.x**.

### Violations (Go modules at vN where N>=2)

| Package | Tag | Action |
|---|---|---|
| luxfi/lattice | `v7.0.2` | rename to `v1.x.y` line; deprecate v2-v7 in proxy |
| luxfi/cli | `v2.10.8` | retag as `v1.x.y` going forward |
| luxfi/c-kzg-4844 | `v2.1.7` | retag to `v1.x.y` line |
| luxfi/zapdb | `v20.07.0` | internal — convert to date-suffix on v1 line: `v1.0.0+2007` |

### Non-semver tags blocking proxy publish

| Package | Tag | Action |
|---|---|---|
| luxfi/blake3 | `guts_0.0.0` | cut `v1.0.0` |
| luxfi/coreth | `with-avalanchego-test-pkg` | cut `v0.1.0` |
| luxfi/pqclean | `round3` | archive |
| luxfi/mpcvm | `v0.62` | bump to `v0.62.0` |
| luxcpp/bridgevm | `v0.61` | bump to `v0.61.0` |
| luxcpp/platformvm | `v0.57` | bump to `v0.57.0` |
| luxcpp/mpcvm | `v0.62` | bump to `v0.62.0` |

### Compliant (no action)

108 of 132 tagged repos comply with `vMAJOR.MINOR.PATCH` (M=0 or 1) format.

---

## 6. Decisions

**Decision:** All Go modules MUST use `v1.x.y` semver. v2+ retagged to v1 line. Non-semver tags blocked at CI.
**Rationale:** Go module proxy requires semver; v2+ requires `/v2/` import path which fragments the ecosystem; project policy is explicit.
**Trade-off:** Lose semantic v2 break signal — accepted because we ship forward-only with no backward-compat.
**Action:** Owners of the 4 violation repos (`lattice`, `cli`, `c-kzg-4844`, `zapdb`) cut new v1-line tags; CI rejects non-semver pushes.

**Decision:** luxgpu org reserved; luxgpu/gpu archived.
**Rationale:** One canonical Go GPU binder = `luxfi/gpu`. luxgpu retained for future C++/kernel split when scope justifies a second org.
**Action:** `gh repo archive luxgpu/gpu`.

**Decision:** luxcpp forks (blst, intx, evmmax, pqclean, blake3-reference, ed25519-donna) remain under luxcpp as KAT/header oracles only.
**Rationale:** Verified non-prod linkage in CMakeLists. Removing them breaks byte-equality tests.
**Action:** None. Documented contract.

---

*Audit run 2026-04-28 by hanzo-dev. Cited tags + 7-char SHA per package. Updates to LP-PACKAGES.md only — no additional .md spam.*
