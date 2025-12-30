# LP-137 Merge Queue

State of feature branches that contain LP-137 work and the order in which
they need to land on `main` for the consolidation to compile end-to-end.

Updated 2026-04-27 by CTO after RED audit remediation.

---

## fhe — consolidation onto `feat/fhe-bench-ladder`

The luxfi/fhe repo's `main` exposes only the simple LSSS keygen package
at `pkg/threshold/`. The richer LP-137 pieces (PolicyProgram, rule_engine,
threshold service layer, types) have been consolidated onto
`feat/fhe-bench-ladder` (origin pushed). `main` lands when lattice/v7.1.0
is tagged.

| Branch | HEAD | Adds | Files | Status |
|---|---|---|---|---|
| feat/fhe-policy-program | 1143418 (after 038ee8d) | YAML rule_engine + PolicyProgram + 5 example YAMLs + bench harness + PERFORMANCE.md | 15 (2,496 LOC) | **MERGED into feat/fhe-bench-ladder** as 3b58218 + 70d5098 + 41fc049 (rebased SHAs, identical content) |
| feat/fhe-threshold-service | eb23194 | Threshold FHE service (FHECiphertext, FHEThresholdShare, ShareAggregator, NoiseProof, PartialDecrypt, transcript) | 9 (1,764 LOC) | Builds; **placement bug** — files at top-level `threshold/` instead of composing under existing `pkg/threshold/` |
| feat/lp-137-types | (HEAD) | FHECiphertextHeader + FHEPrecompileArtifact types | 3 | **MERGED into feat/fhe-bench-ladder** as 873ee56 |
| feat/fhe-bench-ladder | 01b98a8 | Canonical FHE benchmark ladder + types + policy program + rule_engine + plan_cache + 5 example YAMLs | 26 | **CONSOLIDATION HEAD** — pinned to lattice replace; pushed to origin |

### Blocking issue

`feat/fhe-threshold-service` puts its files at `threshold/` (module-root
relative). On `main` we already have `pkg/threshold/` with the simple LSSS
keygen. These need to be composed: the rich service layer should live
*alongside* the keygen at `pkg/threshold/`, not at a parallel top-level
`threshold/` directory. That is a placement-correction commit before the
service-layer branch can land cleanly.

### Order to merge

1. **luxfi/lattice** `feat/lp-137-types` → tag `v7.1.0`. Drops the local
   `replace github.com/luxfi/lattice/v7 => ../lattice` from every consumer.
2. **luxfi/fhe** `feat/fhe-threshold-service` → rebase onto
   `feat/fhe-bench-ladder` with files moved from `threshold/` to
   `pkg/threshold/` so LSSS keygen and threshold service compose.
3. **luxfi/fhe** `feat/fhe-bench-ladder` → main. Single consolidated
   merge: types + policy program + rule_engine + plan_cache + bench
   harness + PERFORMANCE.md + (after step 2) threshold service.

Until step 3 lands, **mpc/pkg/policy CANNOT COMPILE**: the
RealThresholdDecryptor at
`/Users/z/work/lux/mpc/pkg/policy/fhe_threshold_decryptor.go`
references types (FHECiphertext, FHEThresholdShare, ShareAggregator,
StatusOK, NewFHECiphertext, NewShareAggregator) that only exist on the
threshold-service feature branch.

### Workaround in place this session

`luxfi/threshold/protocols/tfhe` (a new package added by a sibling agent
in `/Users/z/work/lux/threshold/protocols/tfhe/`) re-exports the same
type/function shape. `mpc/pkg/policy/fhe_threshold_decryptor{.go,_test.go}`
now imports `github.com/luxfi/threshold/protocols/tfhe` instead of
`github.com/luxfi/fhe/threshold`. This compiles and pkg/policy 37/37
tests pass with `replace github.com/luxfi/threshold => ../threshold`
in `mpc/go.mod`.

The `luxfi/threshold/protocols/tfhe` directory is uncommitted at HEAD
of luxfi/threshold (`main` branch). It needs to be committed and tagged
before `mpc` can drop its replace directive.

---

## luxcpp/crypto — feature branches landed in this pass

The blake3 + lamport real C++ bodies were on side branches whose
artifacts existed in the build cache (build-cto) but whose sources were
never on `bls-signature-2026-04-27`. The cherry-picks landed in this
pass:

| Cherry-pick | From branch | Lands on | Status |
|---|---|---|---|
| c4a1d2e0 (blake3 vendored BLAKE3 v1.5.0 + 4-mode wrapper + 140-vec KAT) | blake3-impl-2026-04-27 | bls-signature-2026-04-27 | Landed (1553483d). KAT ctest passes 140/140. nm shows real symbols in libblake3.a |
| 76a3d821 (real C++ Lamport + Metal batched verify; honest NOTIMPL SLH-DSA) | (history) | bls-signature-2026-04-27 | Landed (8112e0fa). lamport_test PASS, lamport_cabi_test PASS, lamport_metal_test PASS 128/128 byte-equal |

Trim-down commit landed (dd6c63ad) to defer the ed25519/mldsa/mlkem
batched Metal tests until `c50bcde6` (v0.65 Metal kernels) is also
merged.

### Still on side branches (NOT cherry-picked this pass)

| Commit | Branch | Adds | Why deferred |
|---|---|---|---|
| 8ad76101 | deps-bootstrap-2026-04-27 | mldsa+mlkem+slhdsa: vendor PQClean ref impl + NIST KAT (~31k LOC, 318 files) | Large vendor drop; merge in its own pass |
| c50bcde6 | (similar) | v0.65 Metal kernels for ed25519/mldsa/mlkem | Pulls in mlkem_metal_test.cpp etc. — wire after CPU bodies land |
| 2ac2ae9c (lux/crypto rust) | blake3-rust-2026-04-27 | rust binding crate lux-crypto-blake3 | Cherry-picked partially (just lux-crypto-blake3 dir) onto ed25519-rust-2026-04-27 in this session — Cargo.toml entry added |

### slhdsa public C-ABI

`slhdsa/c-abi/c_slhdsa.cpp` returns CRYPTO_ERR_NOTIMPL by design on this
branch. Per the 76a3d821 commit message: SLH-DSA is 3000+ LOC of FIPS 205
hypertree and shipping a hand-port without the full algorithm suite risks
correctness bugs no skeleton catches. The Go layer at
`github.com/luxfi/crypto/slhdsa` (cloudflare/circl, FIPS-validated) is
the supported path; 120 NIST ACVP vectors KAT there.

To land real SLH-DSA C-ABI dispatch on this branch, cherry-pick 8ad76101
(PQClean vendor) — that is intentionally deferred to its own merge pass
because of the 31k-LOC vendor surface.

### lamport public C-ABI — REAL

`nm -gU /Users/z/work/luxcpp/crypto/build-cto/lamport/liblamport.a`
shows three real symbols at non-zero offsets (sign at +0x84, verify at
+0x108) — confirmed dispatch into `lux::crypto::lamport::*` at
`lamport/cpp/lamport.cpp`. NOTIMPL contract is dead.
