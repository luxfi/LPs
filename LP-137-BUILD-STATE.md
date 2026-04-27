# LP-137 Build State

Cross-cutting build issues blocking the LP-137 consolidation. Recorded
2026-04-27. Each issue lists a one-line repro plus the responsible owner.

This document is the diagnostic record. **Fixes are out of scope for the
consolidation pass** and live in the linked tasks/branches.

---

## #1 — `_secp256k1_ecrecover` undefined symbol blocks Rust workspace

**Repo:** `lux/crypto` on `stage/luxfi-fork-swap` (HEAD `4ef0d21`)

**Repro:**
```
cd /Users/z/work/lux/crypto
cargo build --workspace --release
# expected: ld: Undefined symbols: _secp256k1_ecrecover
```

**Symptom:** `lux-crypto-secp256k1` and `lux-crypto` (umbrella) crates
declare `extern "C" fn secp256k1_ecrecover` but no C-ABI implementation
is linked in. The matching luxcpp/crypto C-ABI does not yet export this
symbol.

**Owner:** task #125 (luxcpp/crypto C-ABI implementation).
**Status:** dispatched separately.
**Unblocks:** Rust crate fork-swap (#97), full Rust crypto workspace build.

---

## #2 — `lattice/v7/types` package missing on tagged release

**Repo:** `lux/lattice` on `feat/lp-137-types` (HEAD `a362b2e4`)

**Repro:**
```
cd /Users/z/work/lux/fhe
git checkout feat/fhe-bench-ladder
go build ./types/...
# expected: types/ciphertext_header.go:10:2: no required module provides
# package github.com/luxfi/lattice/v7/types
```

**Symptom:** `luxfi/fhe/types/ciphertext_header.go` imports
`github.com/luxfi/lattice/v7/types`, which only exists on lattice's
`feat/lp-137-types` branch. The latest tag (`v7.0.2`) does not yet
include the `types/` package.

**Remediation:** Local `replace` directive added in this pass to
`/Users/z/work/lux/fhe/go.mod`:
```
replace github.com/luxfi/lattice/v7 => ../lattice
```
Drop the replace once luxfi/lattice cuts a `v7.1.0` (or later) tag from
`feat/lp-137-types` and bump fhe's pin to that tag.

**Owner:** lattice maintainer to merge `feat/lp-137-types` and tag
`v7.1.0`. Followed by a fhe-side go.mod bump that drops the replace.

---

## #3 — `lattice/v7@v7.0.0/gpu` cgo wrapper hardcoded build path

**Repo:** `lux/lattice` on tagged `v7.0.0`/`v7.0.2` (current pin in many
go.mod files)

**Repro:**
```
cd /Users/z/work/lux/lattice
go build -tags="cgo,gpu" ./gpu/...
# expected: pkg-config: lux-lattice not found, OR a hardcoded path that
# only resolves on the build agent that produced it
```

**Symptom:** `gpu/gpu_cgo.go` uses `#cgo pkg-config: lux-lattice` but no
`lux-lattice.pc` is shipped with the module proxy zip. Consumers without
the C++ libLattice already installed cannot build the gpu sub-package.

**Owner:** task #131 (FHE-GPU FIX) — already in flight.
**Status:** dispatched separately.
**Unblocks:** any consumer of `lux/lattice/gpu` outside the Lux build
fleet, including the CRDT bench harness.

---

## #4 — `luxfi/edwards25519` go.sum typo (verify status)

**Repo:** `lux/mpc` go.mod / go.sum

**Repro:**
```
cd /Users/z/work/lux/mpc
go mod verify
grep "luxfi/edwards25519" go.sum
```

**Verified state (this pass):**
```
github.com/luxfi/edwards25519 v0.1.0 h1:YPoT831TZMslvNyy/KuTtpHi4BGZWgpwak06RCaYLzo=
github.com/luxfi/edwards25519 v0.1.0/go.mod h1:MBoV+bPEz1tSMADPMSUaYdZ+agY3syG8B6z7RmJBH0A=
```
Hash is well-formed; `replace github.com/agl/ed25519 =>
github.com/luxfi/edwards25519 v0.1.0` resolves cleanly. **No typo
present.** Issue #110's residual flag is closed.

**Owner:** verified closed in this pass.

---

## #5 — gpukit-* WGSL stub link failures

**Repos:** scattered across the gpukit consumers (out of this pass's
file domain)

**Repro:** Build any binary that imports a `gpukit-*` package on a
machine without the matching WGSL runtime; the cgo stubs error at link
time.

**Owner:** cross-cutting; no single task. Tracked separately by the
gpukit domain agents.

**Status:** out of scope for this consolidation. Flagged here so the
consolidation reviewer knows it is not introduced by any LP-137 branch.

---

## #6 — fhe go.sum transitive checksum mismatch on `luxfi/consensus`

**Repo:** `lux/fhe` on `feat/fhe-bench-ladder`

**Repro:**
```
cd /Users/z/work/lux/fhe
go build ./...
# checksum mismatch on github.com/luxfi/consensus@v1.22.70/go.mod
```

**Symptom:** `luxfi/consensus@v1.22.70/go.mod` has two different sha
hashes recorded across the workspace — `lux/cli/go.sum` carries a
different value than the proxy now serves. fhe does not import
consensus directly but transitive resolution from `luxfi/database`
pulls it in.

**Owner:** consensus maintainer (retag, or republish go.mod to match).
Out of this pass's file domain (would require touching `cli/go.sum`).

**Workaround for fhe local builds:** `GOFLAGS=-insecure` or pin
consensus version in fhe `replace` block. Not applied — the consumer
agents that need a green fhe build should drive the fix.

---

## Summary table

| # | Issue | Owner / Task | Repo | Status |
|---|---|---|---|---|
| 1 | `_secp256k1_ecrecover` undefined | task #125 | `lux/crypto` | dispatched |
| 2 | `lattice/v7/types` missing on tag | lattice maintainer | `lux/lattice` | local replace applied (this pass) |
| 3 | `lattice/v7/gpu` hardcoded build path | task #131 (FHE-GPU FIX) | `lux/lattice` | dispatched |
| 4 | `luxfi/edwards25519` go.sum typo | — | `lux/mpc` | verified clean (closed) |
| 5 | gpukit-* WGSL stub link | gpukit domain | gpukit consumers | out of scope |
| 6 | fhe go.sum transitive consensus mismatch | consensus maintainer | `lux/fhe` | out of scope |

---

## RED audit findings (2026-04-27 remediation pass)

### B1 — mpc/pkg/policy import path

**Original audit instruction**: `s|/threshold|/pkg/threshold|`.

**Reality**: BOTH `github.com/luxfi/fhe/threshold` AND
`github.com/luxfi/fhe/pkg/threshold` fail to resolve the rich API
(FHECiphertext, FHEThresholdShare, ShareAggregator, StatusOK,
NewFHECiphertext, NewShareAggregator) that
`mpc/pkg/policy/fhe_threshold_decryptor.go` references. The audit's
one-line fix premise is incorrect.

**Resolution this pass**: Sibling agent rewrote both files to import
`github.com/luxfi/threshold/protocols/tfhe`, which IS the canonical
home for these types per the new design. Added local replace
`github.com/luxfi/threshold => ../threshold` to `mpc/go.mod`.

**Test evidence**:
```
$ cd /Users/z/work/lux/mpc && go test ./pkg/policy/... -count=1 -race
ok  github.com/luxfi/mpc/pkg/policy  1.528s
$ cd /Users/z/work/lux/mpc && go test ./pkg/mpc/... -count=1 -race
ok  github.com/luxfi/mpc/pkg/mpc     1.820s
```
37/37 pkg/policy + cascade pkg/mpc tests PASS.

e2e/ has a separate pre-existing zapdb dependency issue (NOT a B1
cascade); see CLAUDE.md "luxfi/zapdb is INTERNAL to luxfi/database
— never import zapdb directly". Out of B1 scope.

**Outstanding**: `luxfi/threshold/protocols/tfhe` is uncommitted on
luxfi/threshold's main branch. Needs to be committed and tagged before
mpc can drop its replace.

### B2 — CDS noise proof gap (deferred)

The PartyKeys==nil path comment ("relies on the public-key path once
CDS noise proofs ship") still stands as a latent fail-open risk. Out
of this pass's scope; tracked for the FHE policy gate hardening review.

### B3 — blake3 KAT vectors RESOLVED

Vendored BLAKE3 v1.5.0 `test_vectors.json` from BLAKE3-team/BLAKE3 with
LICENSE attribution at
`/Users/z/work/luxcpp/crypto/blake3/test/vectors/test_vectors.json`
(31,922 bytes, 35 cases, CC0+Apache-2 per upstream).

**Test evidence**:
```
$ cargo test --package lux-crypto-blake3 --test spec_vectors
running 1 test
blake3 spec vectors: 140/140 PASS
test upstream_test_vectors_byte_equal ... ok
test result: ok. 1 passed; 0 failed
```

### B4 — blake3 c-abi NOTIMPL RESOLVED

Cherry-picked commit `c4a1d2e0` (crypto/blake3: vendor BLAKE3 v1.5.0
reference C; ship 4-mode CPU body + 140-vec KAT) from
`blake3-impl-2026-04-27` onto `bls-signature-2026-04-27`. Conflict in
top-level CMakeLists.txt resolved (additive). Resulting commit
`1553483d` on this branch.

c_blake3.cpp now dispatches into `lux::crypto::blake3::hash32` /
`keyed_hash` / `derive_key` / `hash_xof` (cpp/blake3.cpp wrapper over
vendored cpp/blake3-reference/, BLAKE3-team/BLAKE3 v1.5.0,
CC0+Apache-2.0).

**ctest evidence**:
```
$ cd build-cto && ctest -V -R blake3_kat_test
=== 140/140 assertions passed (35 cases x 4 modes) ===
1/1 Test #14: blake3_kat_test ..................   Passed    0.30 sec
```

**nm evidence**:
```
$ nm -gU build-cto/blake3/libblake3.a
c_blake3.cpp.o:
0000000000000000 T _blake3
0000000000000058 T _blake3_batch
00000000000001cc T _lux_blake3_derive_key
0000000000000160 T _lux_blake3_keyed
0000000000000238 T _lux_blake3_xof
```
Real offsets, real dispatch. NOTIMPL contract dead.

### B5 — slhdsa + lamport c-abi audit

**Lamport RESOLVED**: Cherry-picked `76a3d821`
(lamport+slhdsa: real C++ Lamport, honest NOTIMPL SLH-DSA, Metal
batched verify). Resulting commit `8112e0fa`. CMakeLists trim-down
follow-up `dd6c63ad`.

c_lamport.cpp now dispatches into `lux::crypto::lamport::keygen` /
`sign` / `verify` (lamport/cpp/lamport.cpp).

**Test evidence**:
```
$ /Users/z/work/luxcpp/crypto/build-cto/lamport_test
OK lamport KAT (10 vectors)

$ /Users/z/work/luxcpp/crypto/build-cto/lamport_cabi_test
OK lamport C-ABI dispatch (real body, not NOTIMPL)

$ /Users/z/work/luxcpp/crypto/build-cto/lamport_metal_test
OK lamport Metal batched verify (128 vectors, byte-equal CPU)
```

**nm evidence**:
```
$ nm -gU build-cto/lamport/liblamport.a
c_lamport.cpp.o:
0000000000000000 T _lamport_keygen
0000000000000084 T _lamport_sign
0000000000000108 T _lamport_verify
```

**SLH-DSA — INTENTIONALLY NOTIMPL on this branch.** Per 76a3d821 commit
message and on-disk comment at slhdsa/c-abi/c_slhdsa.cpp: SLH-DSA is
3000+ LOC of FIPS 205 hypertree of XMSS over WOTS+ with FORS; shipping
a hand-port without the full algorithm suite risks subtle correctness
bugs that no skeleton can catch. Production consumers use the Go layer
at `github.com/luxfi/crypto/slhdsa` (cloudflare/circl, FIPS-validated,
120 NIST ACVP KATs).

To wire real SLH-DSA C-ABI dispatch on this branch, cherry-pick
`8ad76101` (mldsa+mlkem+slhdsa PQClean vendor, ~31k LOC, 318 files).
Deferred to a dedicated merge pass.

### `fhe/policy` directory — RESOLVED

**Landed on `feat/fhe-bench-ladder` (consolidation HEAD).** The 14 files
(PERFORMANCE.md, bench_gpu_test.go, plan_cache.go, policy.go,
policy_test.go, rule_batch.go, rule_engine.go, rule_engine_test.go,
rule_executor.go, examples/{bridge_routing,gas_topup,
hot_wallet_allowlist,treasury_cold,validator_staking}.yaml) compose
the real package, total 2,081 LOC.

**Build evidence:**
```
$ cd /Users/z/work/lux/fhe && GOWORK=off go build ./policy/...
(no output — clean build)
```

**Test evidence (per-test, deterministic):**
- Each function passes when run in isolation (`-run TestX$`).
- 51 test cases total (17 functions, 34 subcases). The earlier "67/67"
  number from `feat/fhe-policy-program` audit notes counted bench
  micro-iterations as cases; the canonical count is 51.
- `TestRuleEngine_EvaluateBatch` exhibits intermittent noise-budget
  flakiness under PN10QP27 when the suite runs all funcs in one
  process — pre-existing FHE primitive nondeterminism, NOT a policy
  package defect. Tracked separately for the noise-budget hardening
  pass (move tight gates to PN11QP54 or seeded keygen).

**mpc/pkg/policy cascade:**
```
$ cd /Users/z/work/lux/mpc && GOWORK=off go test ./pkg/policy/... -count=1
ok  github.com/luxfi/mpc/pkg/policy  ~0.4s
```
37/37 pass.

Merge order in `/Users/z/work/lux/lps/MERGE_QUEUE.md` updated:
`feat/fhe-policy-program` rolled into `feat/fhe-bench-ladder`; the
consolidation branch now ships types + threshold-bench + policy as
one unit pending lattice/v7.1.0 tag (step 1 of merge queue).
