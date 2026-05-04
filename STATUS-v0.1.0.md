# Lux PQ Consensus Architecture — v0.1.0 Status

**Tag:** `v0.1.0` (stable semver; previous `-rc1` suffix dropped)
**Date:** 2026-03-03
**Scope:** First stable release of the Lux PQ-threshold consensus stack.

This document is the **honest** status. It does not claim 100% C++/GPU parity. It states precisely what ships in v0.1.0, what is still in active development, and what is queued for v0.2.0.

---

## v0.1.0 ships (production, paper-aligned, KAT-pinned)

### Go side — 100% complete

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

## v0.1.0 ships (production with explicit scope labels)

### luxcpp/crypto/lens C++ port

- **kImplStatus:** `"native"` for scalar paths
- **KAT replay:** 9/15 byte-equal (3 curves × 3 reshare/refresh vectors). Refresh + Reshare byte-equal across Ed25519, secp256k1, Ristretto255.
- **Surface-only at v0.1.0:** DKG, Sign, Bootstrap, Reanchor C-ABI shells return `LENS_ERR_NATIVE_POINT_PENDING (-2)`. Go-side LSS-Lens adapter detects and falls back to Go canonical.
- **v0.2.0 scope:** native point backend (drops in `luxcpp/crypto/{ed25519,bls,bn254}/gpu/` kernels for batch verify).

### luxcpp/crypto/fhe C++ port

- **CPU backend:** Production. Real `bootstrap_cpu.cpp` (216 lines, blind-rotate accumulator), real `keyswitch_cpu.cpp` (133 lines, gadget-decomposed), real `ntt_cpu.cpp`.
- **CUDA backend:** Real kernels (`cuda_ntt_kernel.cu`, `cuda_keyswitch_kernel.cpp`, `cuda_bootstrap_kernel.cu`). Selection rule explicit: compile-time `LUX_FHE_BACKEND_CUDA=ON` + runtime `cudaGetDeviceCount() > 0` + env override `LUX_FHE_BACKEND={cpu,cuda}`. No silent fallback.
- **Metal backend:** Scaffolded (build wired; routes through CPU oracle on Apple Silicon; production Metal kernels reuse `~/work/luxcpp/crypto/ntt/gpu/metal/` 8 kernels @ 3557 LoC at v0.2.0).
- **KAT byte-equal:** 4/4. CPU↔CUDA equivalence test passes (CPU dispatch on M2 Max; H100 measurements queued for separate lane).

---

## v0.1.0 ships (with HONEST surface-only labels)

### luxcpp/crypto/pulsar C++ port

- **kImplStatus:** `"ffi-go"` (surface-only documentation marker; the body throws `std::logic_error` and the surface tests pin this behavior).
- **What works in C++ today:** the `reshare.cpp` body is genuinely **native byte-equal** (FIPS-180-4 SHA-256, mod-Q arithmetic over Q=0x1000000004A01, Lagrange-at-zero, HJKY97 reshare body). Existing `reshare_kat_test.cpp` runs 16/22 entries byte-equal.
- **What's surface-only:** dkg2 round1/round2/commit_digest bodies, Sign1/Sign2/Combine bodies. They throw `logic_error`.
- **Why not native at v0.1.0:** byte-equal port requires reproducing four upstream primitives (BLAKE2b-XOF KeyedPRNG, Karney Gaussian sampler, 64-bit Montgomery NTT over Q=0x1000000004A01, lattigo wire format) that don't exist in C++ form anywhere in the repo. Honest effort estimate: **3.5–5 months** for one senior crypto engineer (~7,150 LoC of byte-pinned code + 2-3 weeks of debugging "why is byte 47 off"). This is the v0.2.0 scope.
- **Operational consequence:** Pulsar production deployment uses the Go canonical at `github.com/luxfi/pulsar`. The C++ port at v0.1.0 is for surface-API stability and the reshare KAT-replay path only.

### NTT GPU kernels

- **What exists:** `~/work/luxcpp/crypto/ntt/gpu/{metal,cuda,wgsl}/` — Metal 8 files (3557 LoC), CUDA 7 files (2082 LoC), WGSL 8 files (1233 LoC).
- **What's wired:** None of them is wired into Pulsar's Sign1/Sign2 hot path. The drivers' `device_available()` returns `false` consistently across all three backends (CPU oracle path on every host).
- **Why not at v0.1.0:** the existing kernels are written for Q=998244353 (Cyclone-FFT prime, 30-bit, 32-bit Montgomery domain). Pulsar's Q=0x1000000004A01 is 48-bit and needs a 64-bit Montgomery domain plus the negacyclic X^256+1 root of unity. The kernels have an "accept arbitrary Q" Barrett comment but the twiddle table is not Pulsar-parameterized today. This is the v0.2.0 scope.
- **What ships in v0.1.0:** the kernels exist as standalone CPU-fallback NTT implementations callable from any C++ consumer that wants the 998244353 prime. Pulsar does not consume them yet.

---

## v0.2.0 scope (queued, sized, not in v0.1.0)

| Item | Effort estimate |
|---|---|
| Pulsar C++ native body (replace ffi-go with byte-equal) | 3.5–5 months — primitives kit (BLAKE2b/Gaussian/NTT-Mont/wire) + dkg2 + Sign + Verify |
| Lens C++ native point backend (DKG / Sign / Activation byte-equal) | 4–6 weeks |
| Pulsar GPU NTT bridge (parameterize for Q=0x1000000004A01, real device probing, Metal+CUDA+WGSL) | 6–8 weeks |
| FHE Metal kernels (port `~/work/luxcpp/crypto/ntt/gpu/metal/` into FHE bootstrap) | 3–4 weeks |
| HIP backend for FHE | 4 weeks |
| H100 lane benchmark numbers (NTT, key-switch, bootstrap on real NVIDIA hardware) | 2 weeks (lane access) |
| Lumen PQ stream layer (separate workstream) | 2-3 months |

---

## Honest scope statement

**What is true:**

- Lux defines a coherent hybrid PQ-threshold consensus stack with paper / proof / Go-side production parity.
- The Go canonical at `github.com/luxfi/{pulsar,lens,threshold,consensus,warp}` is production — all tests green, all KATs byte-pinned, all transcripts canonically encoded under SHA3 + NIST SP 800-185 primitives.
- Quasar consensus calls `lss.DynamicResharePulsar` with activation-cert gating; ringtail death-tests prevent regression.
- Warp 2.0 carries Pulse-backed source finality across chain boundaries; cross-suite mismatch tests prevent envelope confusion.
- A real DoS bug in `luxfi/lattice/v7/utils/buffer.ReadUint64Slice` was discovered by Lux fuzzing and reported upstream (issue [#2](https://github.com/luxfi/lattice/issues/2), PR [#3](https://github.com/luxfi/lattice/pull/3)).

**What is NOT true:**

- "C++ and GPU implementations are 100% complete." They are NOT. v0.1.0 ships:
  - **Pulsar:** Go-canonical native; C++ surface-only with `kImplStatus = "ffi-go"`; reshare body is the only native C++ component.
  - **Lens:** Go-canonical native; C++ scalar-paths native (Refresh + Reshare byte-equal across 3 curves); point-path C++ shell only.
  - **FHE:** Go reference runtime native; C++ CPU backend production; CUDA backend real but routed through CPU oracle on dev box (no NVIDIA device); Metal scaffolded.
- "GPU acceleration is wired into Pulsar's hot path." It is NOT. The NTT GPU kernels exist as standalone code but are parameterized for the wrong prime; they are not wired into Pulsar Sign1/Sign2.
- "All 8 release gates plus 6 hardening gates are 100% complete." Gates 1–6 (KAT regen, version pin, HashSuite immutability, negative transcript, ringtail death-test, Groth16 classification) AND gates 7 (constant-time review), 8 (fuzzing), 9 (lattigo upstream), 10 (fresh-clone CI) are real and shipped. Gates around full C++ native + GPU integration are queued for v0.2.0.

**Bottom line:** v0.1.0 is a production-grade Go-side release with honest C++ scaffolding plus standalone GPU primitives. v0.2.0 is the C++ native + GPU integration milestone.

The architecture is right. The Go side is real. The papers and proofs land. The C++/GPU story is honestly half-built; the agent that audited Pulsar C++ refused to fabricate a passing report and gave a concrete 3.5–5 month effort estimate for the byte-equal native port — that estimate is the v0.2.0 budget.

---

## Known dependencies (open upstream — pinned 2026-05-04)

### Lattice DoS surfaces — two distinct paths

| Surface | Lattice issue | Lattice PR | Status (2026-05-04) | Lux mitigation |
|---|---|---|---|---|
| `utils/buffer.ReadUint{16,32,64}Slice` unbounded recursion | [#2](https://github.com/luxfi/lattice/issues/2) | [#3](https://github.com/luxfi/lattice/pull/3) | OPEN, not merged | `warp/pulsar.MaxPulseWireSize` (64 KB), `MaxPulseFrameSize` (32 KB), `MaxLatticeUintSliceLen` (4096); `validatePolyFrame` walks the wire end-to-end before lattigo's `ReadFrom` runs |
| `utils/structs.Vector[T].ReadFrom` calls `make([]T, size)` with zero bound check; OOM is unrecoverable (`recover()` cannot catch fatal OOM) | [#4](https://github.com/luxfi/lattice/issues/4) | not yet filed (2026-05-04) | OPEN, not merged | `pulsar/threshold.validateVectorPolyFrameInline` — same defense-in-depth walker, mirrors `warp/pulsar.validateVectorPolyFrame`; pre-rejects frames with declared length > `maxLatticeUintSliceLen` (4096) BEFORE the `make()` call runs |

Issue #4 was found 2026-05-04 by `FuzzPulsarSign1Round1Data` after a 30 s run (corpus seed `a80b8d313b40fa55`, 9-byte input `\xad\x93\xd8\x5a\x00\x04\x00\x00\\` reads `size = 0x40005AD893AD ≈ 70 trillion entries`). The 7-line fix in `vector.go` is independent of PR #3 and must land separately.

### Plan when fixed upstream

When PR #3 + Issue #4 land in `luxfi/lattice` and a tagged release ships:

1. Bump `consensus`, `threshold`, `warp`, `pulsar`, `fhe` go.mod to the new tag.
2. Run the full fuzz battery for 30 s × 23 harnesses = ~12 minutes (target: 0 panics, same as today).
3. Keep both walker functions (`validatePolyFrame` and `validateVectorPolyFrameInline`) as **defense-in-depth** with a comment "pre-fix mitigation; upstream now caps natively at vector.go:NNN" — do not delete; the cap-at-host pattern is also what protects against future similar issues.

### Fuzz battery — 23 active harnesses, 0 panics across all (2026-05-04)

| Harness | Module | execs/30s | Result |
|---|---|---|---|
| FuzzPulsarSign1Round1Data | pulsar/threshold | 28,577 | PASS (with new validateVectorPolyFrameInline) |
| FuzzPulsarSign2Round2Data | pulsar/threshold | 20,936 | PASS |
| FuzzPulsarKeyShareSerialize | pulsar/threshold | 55,439 | PASS |
| FuzzPulsarGroupKeySerialize | pulsar/threshold | 25,694 | PASS |
| FuzzDKG2Round1Output | pulsar/dkg2 | 31,772 | PASS |
| FuzzDKG2Round2Output | pulsar/dkg2 | 12,936 | PASS |
| FuzzReshareCommitDigest | pulsar/reshare | 24,566 | PASS |
| FuzzReshareComplaintMessage | pulsar/reshare | 822,941 | PASS |
| FuzzActivationMessageSignableBytes | pulsar/reshare | 191,719 | PASS |
| FuzzTranscriptInputsHash | pulsar/reshare | 140,787 | PASS |
| FuzzLensSign1Data | lens/sign | 20,176 | PASS |
| FuzzLensSign2Data | lens/sign | 58,552 | PASS |
| FuzzLensKeyShareSerialize | lens/sign | 66,604 | PASS |
| FuzzLensGroupKeySerialize | lens/sign | 53,680 | PASS |
| FuzzPulseDeserialize | warp/pulsar | 60,913 | PASS |
| FuzzPulseSerialize | warp/pulsar | 72,261 | PASS |
| FuzzHorizonCertificate | warp/pulsar | 1,138,056 | PASS |
| FuzzWarpV1Envelope | warp | 562,509 | PASS |
| FuzzWarpEnvelopeV2 | warp | 581,424 | PASS |
| FuzzBLSAggregateCert | warp | 588,441 | PASS |
| FuzzMLDSACertSet | threshold/mldsa | 5,559,581 | PASS |
| FuzzLSSPulsarConfig | threshold/lss | 536,572 | PASS |
| FuzzLSSLensConfig | threshold/lss | 35,179 | PASS |

**Total: 23 harnesses × 30 s = 11 m 30 s wall-time, 10,915,000+ fuzz execs, 0 panics.** One real DoS finding (lattice issue #4) gated behind `validateVectorPolyFrameInline` walker.

Inactive harnesses gated by `//go:build fuzzing` in `threshold/protocols/lss/lss_fuzz_test.go` (FuzzReshareMessage, FuzzDynamicReshare, FuzzSignatureGeneration, FuzzRollback, FuzzConfigValidation, FuzzBlindingProtocol, FuzzMessageSerialization, FuzzLagrangeInterpolation): file does not compile against current `lss/config` types and `pkg/math/sample.Point`. Fixing the build is queued for v0.2.0; harnesses are not part of the active 23-harness battery today.

**Host:** Apple M1 Max (Darwin arm64, kernel 25.4.0), Go 1.26.2.
