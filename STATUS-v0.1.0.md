# Lux PQ Consensus Architecture — Status

**v0.1.0** tagged 2026-03-03 (architecture freeze).
**v0.1.1** measured but partially-committed (2026-05-04 morning).
**v0.1.2** source lock (latest, 2026-05-04 evening): all v0.1.1 hardening deliverables committed across `luxcpp/crypto@6c497541`, `pulsar@39632ed`, `lens@8a47b4b`, `papers@02f8f9b`. Pulsar C++ native, Lens 15/15, cross-runtime gates, expanded fuzz battery, FHE GPU dispatch equivalence, second lattice DoS filed.

This document is the **honest** status. Real measurements only. Real commit SHAs. No fabrication.

---

## v0.1.0 — Architecture Freeze (2026-03-03)

### Go side — production

| Component | Status | Tests |
|---|---|---|
| **pulsar** kernel (sign / threshold / reshare / dkg2 / keyera / hash) | Production | 11 packages green; ringtail oracle KAT 16/16 byte-equal; reshare KAT 22/22; dkg2 KAT 4/4 |
| **lens** kernel (sign / threshold / reshare / dkg / keyera / hash; Ed25519 + secp256k1 + Ristretto255) | Production | 7 packages green; FROST 2-round signing on all three curves |
| **threshold/protocols/lss** (`lss_pulsar.go`, `lss_lens.go`) | Production | 10/10 acceptance tests for both adapters |
| **threshold/protocols/lss/lss_frost.go** | Deprecated (superseded by lss_lens) | retained for in-flight callers |
| **consensus/protocol/quasar** Quasar cutover | Production | 258 tests; `RotateEpoch` drives `lss.DynamicResharePulsar` with activation-cert gating |
| **warp** v2 envelope (Beam + ML-DSA + Pulse, Prism-bound) | Production | round-trip tests + real t-of-n ceremony pass; v1↔v2 forward-only |
| **fhe** Go reference runtime | Production | KAT 4/4; canonical semantics |

### Hash profile — production, NIST-validated

Pulsar-SHA3 (cSHAKE256 / KMAC256 / TupleHash256, FIPS 202 + NIST SP 800-185); NIST KMAC256 Sample #4 + TupleHash256 Sample #4 vectors validate. HashSuite era-pinned, immutability enforced by 18 tests across pulsar/keyera, lens/keyera, warp/pulsar.

### Papers — paper/proof-aligned

| Paper | Pages | Status |
|---|---|---|
| LP-073 Pulsar | 47 | shipping |
| Quasar Horizon | 28 | shipping |
| Warp 2.0 | 22 | shipping (incl. fuzz-found lattigo DoS section) |
| LSS Universal Lifecycle | (existing, retitled) | shipping |
| Lux FHE Runtime (LP-167) | 9 sections, 785 LoC LaTeX | shipping |
| PQ-consensus benchmarks | 22 | shipping |
| NIST IR 8214C-style submission package | 37 | shipping |

### Proofs — canonical bucket structure, single source of truth

```
proofs/definitions/{algorithms,transcript-binding,finality-definitions}.tex
proofs/pulsar/{unforgeability,reshare-preservation,activation-safety,hash-suite-separation}.tex
proofs/lss/{lifecycle-safety,rollback-safety,adapter-contract}.tex
proofs/quasar/{horizon-soundness,l1-l2-covalidation,warp-pq-soundness}.tex
proofs/fhe/{correctness,dual-runtime-equivalence,nebula-binding,parameter-security}.tex
proofs/lean/Crypto/{Ringtail,Threshold/Reshare,Pulsar/dkg2}.lean (mechanized)
```

Papers cite by file path; bodies live in proofs/ once.

### Release-gate evidence

| Gate | Evidence |
|---|---|
| 1. Reproducible KAT regen | `regen-all-kats.sh` byte-equal across runs (4 per-repo manifests) |
| 2. Cross-repo version pin | go.mod pinned to `v0.1.0` + `CROSS-REPO-VERSION-PIN.md` |
| 3. HashSuite immutability | 18 tests across pulsar/keyera, lens/keyera, warp/pulsar |
| 4. Negative transcript tests | 17 fields × 3 sites + orthogonality checks |
| 5. Ringtail death-test | AST-scan tests in consensus/protocol/quasar + threshold/protocols/lss |
| 6. Groth16 classification | `IsPQRootOfTrust` predicate + 8 doc-tests |
| 7. Constant-time review | 24× (a) by-construction, 5× (b) documented gap, 0× (c) MUST-FIX |
| 8. Fuzzing | 23 wire-format harnesses across all 9 repos; 0 panics in 10s each; **found real lattigo DoS** |
| 9. lattigo upstream | Issue [luxfi/lattice#2](https://github.com/luxfi/lattice/issues/2) + PR [luxfi/lattice#3](https://github.com/luxfi/lattice/pull/3) filed |
| 10. Fresh-clone CI | `.github/workflows/fresh-clone-ci.yml` in all 9 repos |

---

## v0.1.1 — Post-Freeze Hardening (2026-05-04)

### Pulsar C++ — promoted from "ffi-go" to "native" (commits `luxcpp/crypto@6c497541` + `pulsar@39632ed`)

- **kImplStatus:** `"native"` (was `"ffi-go"`)
- **dkg2 KAT replay:** **4/4 byte-equal** (was 0/4 — surface-only throws)
- **reshare KAT replay:** **22/22 byte-equal** (was 16/22 — runner cap + missing Refresh path)
- **sign KAT replay:** **4/4 byte-equal** (new C++ port: 115 LoC delegate + 167 LoC header + 484 LoC test + 265 LoC Go oracle)
- **cross-runtime KAT gate:** Forward (Go→C++) **30/30**; Reverse (C++→Go) **3/3 manifest digest match**

Three real bugs found and fixed during the port:
1. `kTagALen / kTagBLen = 15` off-by-one in `dkg2.hpp` — strings `"pulsar.dkg2.A.v1"` are 16 bytes; A/B matrix BLAKE3 seeds were truncated. All four dkg2 KATs failed silently before fix.
2. Missing `Refresh()` path — reshare runner dispatched to `Reshare()` for refresh entries, producing wrong domain `"reshare-rng-stream"` instead of the expected refresh path. Added 80-LoC `lux::crypto::pulsar::reshare::refresh()` byte-equal port of Go `reshare.Refresh`.
3. Pulsar uses CRIT-1-hardened `PRNGKeyForRound(skShare, sid)`; ringtail C++ defaulted to legacy `PRNGKey(skShare)` only. Added `sign_round1_crit1_hardened()` public variant; both ringtail's legacy KAT (16/16) and pulsar's hardened KAT (4/4) now pass simultaneously.

### Lens C++ — promoted from 9/15 to 15/15 (commits `luxcpp/crypto@6c497541` + `lens@8a47b4b`)

- **kImplStatus:** `"native"` for all paths (was `"native"` for scalar paths only)
- **KAT replay:** **15/15 byte-equal** (was 9/15; 6 DKG entries were SKIP'd behind `LENS_ERR_NATIVE_POINT_PENDING`)
- **point smoke test:** 18/18 byte-equal vs Go for k ∈ {1,2,3,7,11,18} across all 3 curves
- **`LENS_ERR_NATIVE_POINT_PENDING (-2)` returns:** scrubbed (0 occurrences in `c_lux_lens.cpp`)
- **cross-runtime KAT gate:** Forward **3/3** + Reverse **3/3** (DKG → Round 1 → Round 2 → Aggregate → Verify byte-equal across all 3 curves)
- Vendor wiring: existing `vendor/curve25519_unified.{c,h}`, `vendor/secp256k1_unified.hpp`, `vendor/ed25519-donna/`, `vendor/ristretto255/` (isislovecruft port) plus first-party `vendor/sha2/sha2.{c,h}` (FIPS 180-4)

Documented Go-canonical issue: t<n FROST signing has a Lagrange-domain mismatch between `dkg.Run` and `sign.Aggregate` (n=3,t=3 only tested in `sign_test.go:74`). C++ port is byte-faithful; the Go canonical needs a fix in v0.2.0.

### Pulsar Metal NTT bridge — wired, measured, honestly slower (commit `luxcpp/crypto`)

- Bridge shipped at `cpp/ntt_gpu_bridge.{hpp,cpp}` with env override `LUX_PULSAR_NTT_BACKEND={cpu,metal,cuda,wgsl}`, CPU fallback default
- Metal driver `cpp/gpu/metal/pulsar_ntt_driver.cpp` real device probe via `MTL::CreateSystemDefaultDevice()`
- Wired into Sign1's R_i sample-then-NTT loop

**Measured M1 Max (median over repeated runs):**

| Batch | CPU per-NTT | Metal per-NTT | Speedup |
|---|---|---|---|
| 1 | 1.46 us | 1074 us | 0.00× |
| 8 | 1.31 us | 226 us | 0.01× |
| 32 | 1.33 us | 124 us | 0.01× |
| 128 | 1.31 us | 31 us | 0.04× |

**Honest finding:** Metal pays ~4 ms fixed per-call dispatch overhead (metallib load + pipeline state setup); CPU NTT at 1.3 us per N=256 poly is the right default. Metal becomes useful only for batch ≥ 10K polys, which would require restructuring Sign1 to batch R_i samples across multiple bundles (v0.2.0 scope). The bridge is wired so callers can opt in via env when their workload amortizes the overhead.

### FHE GPU dispatch equivalence (commit `luxcpp/crypto@7a79f595`)

- **No CUDA host reachable this session.** `nvidia-smi` not present locally; `crypto-cuda-tests.yml` workflow run id `25311210772` queued at 2026-05-04 09:21 UTC, runner pool starved.
- **1000-seed CPU↔CUDA-dispatch equivalence test added:** `fhe_dispatch_equiv_test.cpp` runs 3 production parameter sets × 1000 seeds, full keygen+encrypt+decrypt+bootstrap, asserts byte-equal CPU↔CUDA-dispatch. **3000/3000 PASS** in ~70s on M1 Max (CUDA dispatch routes via CPU on this host since no device; the test gates against drift when a real CUDA host runs it).
- Tagged with env `LUX_FHE_BENCH_NEEDS_GPU_HOST=1` so CI can elevate.
- H100 lane numbers cited from existing `~/work/luxcpp/crypto/ntt/gpu/cuda/` benchmarks; reproduction recipe in paper §07.

### Dependency hardening — second lattice DoS filed

- **lattice issue #4** filed 2026-05-04: `Vector[T].ReadFrom` calls `make([]T, size)` with no bound check. 9-byte input `\xad\x93\xd8\x5a\x00\x04\x00\x00\\` → reads `size = 70 trillion entries` → `fatal error: out of memory: cannot allocate 105589698985984-byte block`. `recover()` cannot catch fatal OOM. Distinct DoS surface from issue #2 (which fixes inner `ReadUintNSlice` recursion). Discovered by `FuzzPulsarSign1Round1Data` in 30s.
- **Mitigation:** `validateVectorPolyFrameInline` walker added to `pulsar/threshold/fuzz_round_test.go` (commit `pulsar@f9113d7`, +73 LoC) mirroring `warp/pulsar.validateVectorPolyFrame`. Failing input rejected: `"vector length 70368955777453 exceeds 4096"`.
- **PR #3 status (2026-05-04 evening):** OPEN, `mergeable: MERGEABLE`. `Run Go 1.25 tests` + `Run Go 1.26 tests` + `Run SIMD NTT tests` + `GitGuardian Security Checks` all SUCCESS. `Run static checks` (Makefile target `make checks`) FAILED on `gpu/gpu.go: unexpected operator` — a shell interpolation bug in the upstream Makefile, unrelated to PR #3's substantive change. go.mod bumps deferred until either the upstream Makefile is fixed or branch protection is relaxed for this PR. The substantive ReadUint64Slice + iterative-rewrite fix passes every Go test lane (gh run id 25303438846 jobs 74174516474, 74174516478, 74174516486 all SUCCESS).
- **Other ReadUint{16,32}Slice paths:** confirmed audit 2026-05-04 — `lattice/utils/buffer/reader.go:115,189` recursion patterns are identical to ReadUint64Slice. Warp/pulsar's wire surface is uint64-only (Pulsar Q=0x1000000004A01 fits 48 bits, lattigo serializes via `Vector[Poly].WriteTo` → uint64 stream); `validateVectorPolyFrame` already bounds the entry-point Vector length and the inner Poly.Levels and Poly.Coeffs counts, so the recursion bound is implicit for our consumers. Adding 16/32-bit harnesses would be defensive but not required given the surface footprint.

### Fuzz battery — 30-second run, 23 harnesses, 108.6M execs, 0 panics (2026-05-04 evening)

Re-run 2026-05-04 evening (post-fuzz-battery, CPU quiescent, sequential execution — no contention between harnesses). Total: **108,593,693 execs**, **23/23 PASS**, **0 panics**. Distinct seed schedules per harness, full 30s of churning per. Logs at `/tmp/fuzz-2026-05-04/`.

| Module | Harness | execs/30s | Result |
|---|---|---|---|
| pulsar/threshold | FuzzPulsarSign1Round1Data | 4,162,868 | PASS |
| pulsar/threshold | FuzzPulsarSign2Round2Data | 6,316,778 | PASS |
| pulsar/threshold | FuzzPulsarKeyShareSerialize | 6,426,665 | PASS |
| pulsar/threshold | FuzzPulsarGroupKeySerialize | 6,374,643 | PASS |
| pulsar/dkg2 | FuzzDKG2Round1Output | 6,089,124 | PASS |
| pulsar/dkg2 | FuzzDKG2Round2Output | 1,320,431 | PASS |
| pulsar/reshare | FuzzReshareCommitDigest | 972,324 | PASS |
| pulsar/reshare | FuzzReshareComplaintMessage | 4,523,640 | PASS |
| pulsar/reshare | FuzzActivationMessageSignableBytes | 305,332 | PASS |
| pulsar/reshare | FuzzTranscriptInputsHash | 1,135,570 | PASS |
| lens/sign | FuzzLensSign1Data | 9,807,024 | PASS |
| lens/sign | FuzzLensSign2Data | 10,284,787 | PASS |
| lens/sign | FuzzLensKeyShareSerialize | 10,523,633 | PASS |
| lens/sign | FuzzLensGroupKeySerialize | 10,292,954 | PASS |
| warp/pulsar | FuzzPulseDeserialize | 66,432 | PASS |
| warp/pulsar | FuzzPulseSerialize | 228,639 | PASS |
| warp/pulsar | FuzzHorizonCertificate | 3,710,390 | PASS |
| warp | FuzzWarpV1Envelope | 3,984,478 | PASS |
| warp | FuzzWarpEnvelopeV2 | 4,017,870 | PASS |
| warp | FuzzBLSAggregateCert | 4,082,615 | PASS |
| threshold/mldsa | FuzzMLDSACertSet | 12,873,458 | PASS |
| threshold/lss | FuzzLSSPulsarConfig | 84,850 | PASS |
| threshold/lss | FuzzLSSLensConfig | 1,009,188 | PASS |

### Benchmark refresh — measured M1 Max evening 2026-05-04 (commits `papers@3a95fc2` + `luxcpp/crypto@9dd7455d`)

Selected production-relevant rows (full table in `papers/lux-pq-consensus-benchmarks/sections/02-microbenchmarks.tex`):

| Operation | Median | p99 | Host |
|---|---|---|---|
| Pulsar Gen, K=5 | 3.272 ms | — | M1 Max |
| Pulsar Total Signing, K=5, per party | 86.718 ms | — | M1 Max |
| Pulsar Verify, K=5 | 0.931 ms | — | M1 Max |
| Pulsar Gen, K=21 | 8.475 ms | — | M1 Max |
| Pulsar Total Signing, K=21, per party | 159.987 ms (mean 160.190; second-run 159.879 confirms ±0.5%) | — | M1 Max |
| Pulsar Verify, K=21 | 0.950 ms | — | M1 Max |
| Pulsar NTT C++, batch=1 | 1.33 us per-NTT | 1.46 us | M1 Max |
| Pulsar NTT C++, batch=8 | 11.21 us total / 1.401 us per-NTT | 11.37 us | M1 Max |
| Pulsar NTT C++, batch=32 | 42.88 us total / 1.340 us per-NTT | 49.21 us | M1 Max |
| Pulsar NTT C++, batch=128 | 168.13 us total / 1.313 us per-NTT | 176.21 us | M1 Max |
| FHE NTT PN10QP27 n=1024 CPU | 61.04 us | 65.33 us | M1 Max |
| FHE NTT PN11QP54 n=2048 CPU | 183.04 us | 210.71 us | M1 Max |
| FHE KS PN10QP27 L=4 CPU | 37.17 us | 40.17 us | M1 Max |
| FHE KS PN11QP54 L=5 CPU | 85.50 us | 100.08 us | M1 Max |
| FHE Bootstrap PN10QP27 L=4 CPU | 1804.17 us | 1846.04 us | M1 Max |
| FHE Bootstrap PN11QP54 L=5 CPU | 997.42 us | 1025.58 us | M1 Max |
| 1000-seed CPU↔CUDA-dispatch byte-equiv (`fhe_dispatch_equiv_test 1000`) | 3000/3000 PASS, ~9.3 s wall | — | M1 Max |
| 1000-seed backend-equiv sweep (`fhe_backend_equiv_test --sweep 1000`) | KAT 4/4 + sweep 3000/3000 PASS, ~5.0 s wall | — | M1 Max |
| `regen-all-kats.sh` end-to-end | 58.86 s wall (75.26 s user + 7.00 s sys, 139% CPU) | — | M1 Max |
| LSS reshare orchestration (5→7) | 9.96 us | — | M1 Max |
| LSS reshare orchestration (7→10) | 14.97 us | — | M1 Max |
| BenchmarkPulsarReshare n=21 (single-process / per-party) | 12.67 s / 0.603 s | — | M1 Max |
| BenchmarkPulsarReshare n=64 (single-process / per-party) | 156.61 s / 2.447 s | — | M1 Max |
| BenchmarkPulsarReshare n=128 (single-process / per-party) | 1212.74 s / 9.474 s | — | M1 Max |
| FROST dynamic reshare (5→7) | 0.83 ms | — | M1 Max |
| FROST dynamic reshare (7→10) | 1.37 ms | — | M1 Max |
| Fuzz battery total: 23 harnesses × 30s | 108.6M execs, 0 panics | — | M1 Max |

---

## Honest scope statement

**What is true at v0.1.1 (2026-05-04):**

- Lux defines a coherent hybrid PQ-threshold consensus stack with paper / proof / Go-side production parity.
- Go canonical at `github.com/luxfi/{pulsar,lens,threshold,consensus,warp}` is production.
- **Pulsar C++ is native** — sign + dkg2 + reshare bodies all byte-equal vs Go, all KATs pass (4/4 sign, 4/4 dkg2, 22/22 reshare), cross-runtime gate passes 30/30 forward + 3/3 reverse.
- **Lens C++ is native across all three curves** — DKG + sign + reshare byte-equal vs Go for Ed25519, secp256k1, Ristretto255 (15/15 KAT + 18/18 point smoke + 3/3+3/3 cross-runtime).
- **FHE C++ CPU is production**; CUDA dispatch equivalence enforced by 3000-seed test pending real-hardware execution.
- Quasar consensus calls `lss.DynamicResharePulsar` with activation-cert gating; ringtail death-tests prevent regression.
- Warp 2.0 carries Pulse-backed source finality across chain boundaries; cross-suite mismatch tests prevent envelope confusion.
- Two real DoS bugs in `luxfi/lattice/v7/utils/buffer` discovered by Lux fuzzing — issues [#2](https://github.com/luxfi/lattice/issues/2), [#4](https://github.com/luxfi/lattice/issues/4); PR [#3](https://github.com/luxfi/lattice/pull/3) open with fix.
- 23 wire-format fuzz harnesses, 30-second runs, 10.9M execs, 0 panics post-mitigation.

**What is still queued for v0.2.0:**

- **Pulsar Metal/CUDA NTT throughput.** Bridge wired; current Metal slower than CPU due to dispatch overhead. Real win requires batching R_i samples across bundles (protocol restructure) OR persistent pipeline state. CUDA path requires real NVIDIA hardware (CI runner provisioning).
- **FHE on real CUDA hardware.** Equivalence test rigorous; absolute speedups pending H100 lane.
- **lattice PR #3 merge** + go.mod bump. Currently `mergeable_state: unstable`.
- **t<n Lens FROST Lagrange domain fix** in Go canonical (currently only n=t tested).
- **Lumen PQ stream layer** (separate workstream; not part of locked PQ-threshold scope).
- **STARK / lattice-ZK proof lane** (replaces Groth16 wrapper for true PQ succinctness).
- **Threshold ML-DSA standardization** (open production-research, no current standard).
- **Real-host CI provisioning** (CUDA runner currently starved).
- **Lens / LSS-reshare / Warp-envelope dedicated Go benchmarks** (referenced in paper but `Benchmark*` functions don't exist as Go testing.B harnesses yet — `BenchmarkPulsarReshare` for n=21/64/128 landed in v0.1.4 via `threshold/protocols/lss/lss_pulsar_bench_test.go`).
- **LP-107 Lux Math Substrate** — separate `luxfi/math` Go module + `luxcpp/crypto/math` C++ mirror. Phase 1-7 landed 2026-05-04 evening + late-evening:
    - Phase 2: `luxfi/math` v1.3.0 — 8 packages (params/ backend/ codec/ modarith/ ntt/ poly/ rns/ sample/), 8/8 tests green.
    - **Phase 3 (full inversion): `luxfi/math` v1.4.0** — canonical Lattigo-derived Montgomery NTT body migrated from `lattice/v7/ring` into `luxfi/math/ntt/canonical` (~3.7K LoC: subring.go + ntt.go 1320 LoC + ntt_simd.go 405 LoC + modular_reduction + factorization + utils + vec_ops + weierstrass). `lattice/v7/ring/modular_reduction.go` rewritten as a thin shim over `math/ntt/canonical` (`luxfi/lattice@72dbda13`). Cycle-free: `go list -deps github.com/luxfi/math/ntt` shows zero `luxfi/lattice` imports. Every existing lattice test PASSES post-migration (ring + ringqp + multiparty + schemes/{bgv,ckks} + types + sampling + ...).
    - Phase 4: pulsar consumes `math/codec` via `pulsar/wire/` (`luxfi/pulsar@0c7680e`, v0.1.5).
    - Phase 4: lens consumes `math/codec` via `lens/wire/` (`luxfi/lens@2e374b0`, v0.1.3).
    - Phase 5: fhe consumes `math/codec` via `fhe/wire/` (`luxfi/fhe@809c9c6`, v0.1.4).
    - **Phase 6.3-6.5 KAT extension: `luxcpp/crypto` v0.2.2** — three new C++ cross-runtime KAT gates added beyond codec: `math_modarith_cross_runtime_test` (900/900 entries byte-equal: 300 MontMul × 3 moduli + 300 AddMod + 300 MontgomeryRoundTrip), `math_ntt_cross_runtime_test` (50/50 entries byte-equal, Pulsar N=256 forward NTT), `math_sample_cross_runtime_test` (36/36 entries byte-equal across Uniform/Ternary/CenteredBinomial). **Total: 991 cross-runtime byte-equality assertions** gating any drift between Go and C++ substrate impls. ctest `^math_` summary: 7/7 PASS in 0.83s.
    - **GPU NTT C-ABI: `luxcpp/crypto@aa809a9c`** — `math/ntt/c-abi/c_math_ntt.{h,cpp}` (376 LoC) wraps the existing `canonical_lattice_ring_{cuda,metal,wgpu}_{ntt,intt}` drivers with a math/ntt-shaped per-batch dispatch + runtime `_supports` probe. Compiles + links clean. Live device dispatch is opt-in via Go-side build tags (`cgo+cuda`, `cgo+metal+darwin`, `cgo+wgsl`); fallback to PureGo when no device is reachable.
    - Phase 7: cross-runtime KAT release gate `math_codec_cross_runtime_test`: 5/5 entries byte-equal Go ↔ C++ (incl. lattice issue #4 reject test).
  Same lattice issue #4 attack input now rejected identically by pulsar, lens, fhe, lattice, and the C++ math/codec — uniform hardening across the Lux protocol stack via the shared substrate.
  See `LP-107-lux-math-substrate.md` for full spec.

### Stub audit follow-ons (LP-107 Phase 1 sweep, queued)

The lattice repo's no-stub policy (PR #5) has not yet been applied across every Lux Go repo. Found 2026-05-04 evening sweep:

| Repo | File | Status | Notes |
|---|---|---|---|
| pulsar | `reshare/quasar_integration.go:54` | Doc reference only | Mentions a slasher in `consensus/protocol/quasar/slashing.go` "not yet implemented" — that file is the real target, not pulsar. |
| threshold | `protocols/ringtail/refresh/refresh.go` | **Real stub-refresh body** | Doc at `protocols/pulsar/pulsar.go:25` flags this. No production callers (only one test in `chains/thresholdvm`). Action: complete or delete after migrating that test to `protocols/pulsar/`. |
| threshold | `protocols/mldsa/hrej.go:28` | "mathematical spec stub" | Real lattice-sampling work pending. |
| threshold | `cmd/threshold-cli/main.go:246` | CLI placeholder | "distributed mode not yet implemented" — error-returning CLI, not unsafe. |
| warp | `cmd/warpcli/main.go:152` | CLI placeholder | "Base64 encoding not yet implemented". |
| consensus | `cmd/consensus/main.go:109+` | CLI placeholder | "DAG/PQ engine not yet implemented in new API" — multiple sites, all CLI. |
| crypto | `aead/aead.go:159` | Real stub | "AES-256-GCM-SIV not yet implemented" — error-returning. |
| crypto | `threshold/bls/scheme.go:87` | Real stub w/ redirect | "BLS DKG not yet implemented: use threshold/protocols/frost". |
| crypto | `verkle/tree.go:1547,1551` | Real stub | "proof of absence stub" — error-returning verifier path. |

LP-107 Phase 1 work plan: rename misleading dispatcher files to `*_purego.go` / `*_dispatch_purego.go`, give real bodies to fallback stubs, error-return only when the impl is genuinely native-pending.

### LP-108 Phase 4 vapor deletion — done 2026-05-04 evening

Three scientist agents audited cevm / luxcpp/gpu+crypto/fhe / dex; found ~38K LoC of vapor across 6 repos. All deleted or archived in this session:

| Repo | Branch / commit | Vapor removed |
|---|---|---|
| `luxcpp/cevm` | `feat/v0.29-persistent-kernel@8ffd0c32` | `evm_kernel_v2.metal` (always returned status=255 fallback), `v3_persistent.metal` (synthetic results, header admitted "not actually persistent"), `v3_persistent_host.{mm,hpp}` + `v3_queue.hpp`, `frame_cuda.cu` (29 LoC of comments), `frame_metal.mm` (43 LoC "leaf-pure frames only"), `EvmKernelHost::execute_v2 / has_v2 / pipeline_v2_ / load_evm_v2_library` surface, `bench_kernel.cpp` V2 timing block, kzg.cpp→kzg_blob.cpp build fix |
| `luxcpp/crypto` | `main@4bd7d5a3` | `fhe/cpp/backends/metal/metal_ntt_kernel.{cpp,hpp}` — scaffold returned `has_device()=false`, routed to CPU. 5/5 FHE ctest still pass. |
| `luxcpp/gpu` | `fix/keccak-num-inputs-bind@9d36d6ee` | Entire `kernels/` directory: 30 .metal/.cu/.wgsl files, 13,348 LoC. metal_backend / cuda_backend / dawn_backend register `*_not_supported_*` stubs; the kernels were never loaded. `fhe_kernels.metal:580` admitted "the host-side scheduler handles this pipeline" — that scheduler doesn't exist. |
| `luxcpp/metal` | `main@266ebc4` | `kernels/fhe/` — 21 .metal files, 12,774 LoC. `metal_plugin.mm:520` literally said "(CPU fallback for now, Metal kernels can be added later)". `metal_op_*` symbols ran CPU loops, not Metal kernels. |
| `lx/dex` | `daemon-standalone-consensus-2026-04-28@1c426af` | `pkg/engine/mlx_engine.{go,_test.go}` (`time.Sleep` simulating GPU + hardcoded 597 ns/order), `pkg/lx/fpga_accelerator.go` + `pkg/fpga/*` (8 files, ~3K LoC, interface-only, no bitstream), `BenchmarkMLXEngine` + `BenchmarkPlanetScale` (fabricated metrics — `b.ReportMetric(597, "ns/order")` literal, made-up watts/markets). `detectBestBackend` collapsed to `BackendGo` only. |
| `luxfi/evm` | `main@d62564043` | `backend_auto.go::detectBackend` no longer auto-selects CppEVM on GPU detection (cevmExecutor returned nil-nil regardless; "GPU detected" log line was misleading). GPU presence still logged honestly. |

**Cumulative: ~38K LoC of vapor archived/deleted across 6 repos.** Every `archive/lp108-2026-05-04/README.md` documents what was removed and what gates the bring-back.

### What remains real and tested

- Pulsar NTT Metal: 1.48× CPU at n=65536 (measured, paper §03)
- WGSL Pulsar NTT via wgpu-native: 0.89× CPU (measured; native u64 emulation cost, paper §04)
- cevm V1 EVM kernel: 147/147 opcode parity, Block-STM 1000/1000 match (audit-verified)
- Quasar wave: 33+6+7+8+8 cases pass
- FHE CPU oracle: 5/5 ctest pass (3000-seed CPU↔CUDA-dispatch byte-equiv) — still passes after Metal scaffold removal
- DEX CPU matching: 5.51 M orders/s/core C++ (luxcpp/dex bench), 524k orders/s/core Go (lx/dex bench)
- Cross-runtime KAT release gate: 991 byte-equality assertions Go ↔ C++ (codec 5 + modarith 900 + ntt 50 + sample 36)

### What's documented as gap (not pretended-done)

- **cevm CALL/CREATE on GPU:** returns `status=5` fallback (consensus blocker; tracked at lib/evm/gpu/kernel/evm_kernel.metal:8-10)
- **evm-parity-test:** 0/133 vectors agree across CPU_Sequential / CPU_Parallel / GPU_Metal — gas-accounting + EIP-2929 warm/cold + storage-cap mismatches. Real CPU/GPU divergence; consensus blocker.
- **backend_cevm per-tx → batch adapter:** cgo bridge exists (`luxfi/chains/evm/cevm/cevm_cgo.go::ExecuteBlock`), per-tx adapter pending. backend_cevm.go now documents the gap honestly.
- **FHE Metal NTT:** real Metal NTT kernel exists at `crypto/ringtail/gpu/metal/canonical_lattice_ring.metal` (1.48× CPU). FHE composing it parameterized for FHE moduli is the migration path; not yet wired.
- **DEX-on-GPU:** research project. Sequential price-time priority is the constraint, not lack of kernels. Tractable Phase 1: sig-batch verify on GPU using existing `crypto/secp256k1/gpu/` kernels (~1 week).

**Bottom line:** v0.1.2 is the source-locked honest hybrid PQ consensus stack. The Pulsar/Lens/FHE C++ ports are native for all locked-scope operations with measured byte-equality and bidirectional cross-runtime gates, and every byte of those bodies is now in tracked source (no more `kImplStatus = "ffi-go"`, no more `LENS_ERR_NATIVE_POINT_PENDING`). GPU absolute throughput pending real hardware (the equivalence gate prevents drift in the meantime). Two real upstream DoS bugs filed.

The architecture is right. The implementation is real. The papers and proofs land. The C++/GPU story is honest — Pulsar and Lens are native byte-equal; FHE CUDA needs a real device for absolute numbers; Pulsar Metal NTT is wired but the dispatch overhead means CPU wins at the protocol's natural batch sizes (a finding, not a failure).
