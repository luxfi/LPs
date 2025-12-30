---
lp: 137-CRYPTO-ARCHITECTURE
title: Crypto Architecture — CPU-vendored / GPU-first-party
date: 2026-04-27
status: Architecture (aspirational target). For audited current state see [LP-137-ACTUAL-STATE.md](./LP-137-ACTUAL-STATE.md).
---

> **READ FIRST**: this document describes the **target** architecture.
> The audited per-algo state on `main` (8 of 29 wired, 21 NOTIMPL),
> the 58 unmerged work branches, the verified perf claims (4 of 10),
> and the inflated breadth claims (5 of 10) are reconciled in
> [LP-137-ACTUAL-STATE.md](./LP-137-ACTUAL-STATE.md). Treat any
> unqualified "PASS" or "every algo" statement here as aspirational
> until that doc says otherwise.

# Architecture (settled, 2026-04-27)

> **CPU = first-party canonical, byte-equal Go reference. GPU = first-party
> Metal/CUDA/WGSL, byte-equal CPU. Audited upstreams (mcl/blst/BoringSSL/PQClean/ckzg)
> are vendored as TEST ORACLES ONLY — never linked into shipped libraries.**

CPU first-party is the canonical because it is the oracle's only twin. If CPU
came from the same algorithm family as the test oracle (e.g., both vendored
from gnark-crypto or both from blst), the oracle would lose its
adversarial-distance property — a bug in upstream would pass through both
sides of the byte-equality check. First-party CPU + vendored test-oracle is
the correct adversarial structure: bug in either side fails the test.

GPU is first-party. Every primitive runs on Metal, CUDA, and WGSL, with
byte-equality to the first-party CPU canonical on every backend that runs.

## Per-algo strategy

### CPU canonical (first-party, in `luxcpp/crypto/<alg>/cpp/`)

Target structure: every algorithm has a first-party C++ CPU body
byte-equal to a Go reference, with vendored audited libraries used as
test oracles only (never linked into shipped libs).

**Per-algo state today is in [LP-137-ACTUAL-STATE.md §3](./LP-137-ACTUAL-STATE.md#3-c-abi-state-on-main-8-wired-21-notimpl).**
The optimistic per-algo table previously in this section did not match
`luxcpp/crypto` `origin/main` HEAD `6eb3791c`: that branch ships **8
algos wired and 21 returning `CRYPTO_ERR_NOTIMPL`**, with the
remaining work distributed across 58 unmerged branches (see
ACTUAL-STATE §4).

The "luxfi/* fork" test-oracle convention still holds: pinned to a
luxfi-controlled tag, used in `<alg>/test/cmake/<oracle>.cmake`, NEVER
linked into production `lib<alg>.a`. This preserves the
adversarial-distance property of the byte-equality test: the test
catches bugs on either side, not just on one.

### GPU canonical (first-party kernels)

Every algorithm above ships a first-party kernel in each of:
- `luxcpp/crypto/<alg>/gpu/metal/<alg>.metal`
- `luxcpp/crypto/<alg>/gpu/cuda/<alg>.cu`
- `luxcpp/crypto/<alg>/gpu/wgsl/<alg>.wgsl`

GPU correctness is asserted via the determinism harness: every CPU↔GPU
test pair runs N=100..1000 random inputs through both backends and asserts
byte-equality.

### Test oracle structure

```
                 +---------------------+
                 |  Reference (Go)     |
                 |  gnark-crypto, etc. |
                 +----------+----------+
                            |
                       byte-equal
                            |
                 +----------v----------+
                 |  CPU canonical      |
                 |  vendored audited   |  <-- ground truth for all backends
                 |  (mcl, blst, ...)   |
                 +----------+----------+
                            |
                       byte-equal
                            |
        +-------------------+-------------------+
        |                   |                   |
+-------v------+    +-------v------+    +-------v------+
|  Metal       |    |  CUDA        |    |  WGSL        |
|  first-party |    |  first-party |    |  first-party |
+--------------+    +--------------+    +--------------+
```

The CPU canonical is byte-equal Go reference; GPU is byte-equal CPU canonical;
transitively byte-equal Go. One byte-equality contract, three hops, every
backend coupled to the same ground truth.

## What this means in practice

### CPU canonical: keep first-party
- bn254 first-party (2498 LOC) stays. KAT 36/36 byte-equal gnark v0.19.2.
- bls 903 LOC first-party stays. blst stays as test oracle only.
- Banderwagon Fp/Fr/Element first-party stays. MSM finishing.
- Pedersen first-party stays. CPU body in flight.
- Vendored test oracles: blst (BLS12-381), c-kzg-4844 (KZG), bitcoin-core/secp256k1 (test only), gnark via go-run for the rest.

### GPU canonical: continue first-party Metal/CUDA/WGSL
- 27 algorithms with GPU kernels shipped.
- Determinism harness: `<alg>_metal_test.cpp` / `<alg>_cuda_test.cu` / `<alg>_wgpu_test.cpp` runs CPU↔GPU byte-equality, all PASS where backends exist.

### To-port to GPU (CPU body exists, no GPU yet):
- **Pedersen** — Metal batch-commit kernel (in flight).
- **Banderwagon Element ops** — Metal add/double/scalar_mul + MSM (in flight).
- **AEAD AES-256-GCM** — Metal kernel (in flight; ChaCha20-Poly1305 batch already shipped in commit 54dad849, 26.7× at N=8192).
- **frost / cggmp21** — Metal threshold signing kernels (low priority; CPU-bound by network roundtrips, not compute).

### Rejected proposals
- **Replacing first-party CPU with mcl/blst/etc. as production canonical** — rejected 2026-04-27. Reason: dual-impl divergence (CPU wraps oracle vs GPU first-party), oracle adversarial-distance property lost, brand neutrality leaks vendor symbols, "5-10× faster" claim unverified for the cold path (GPU is the hot path), build fragility on aarch64 Apple. First-party CPU + audited test oracle is the correct adversarial structure.

## Where we are now

See [LP-137-ACTUAL-STATE.md](./LP-137-ACTUAL-STATE.md) — single source
of truth. Headline numbers from the audit:

- **32 algorithm dirs** in `luxcpp/crypto/` (not 27).
- **3 of 32 algos** have unconditional GPU determinism tests (9.4%);
  the other 6 of 8 `*_metal_test*` files gate on `LUX_CRYPTO_*_METALLIB`
  env and stub-pass when unset (ACTUAL-STATE §6).
- **17 PASS / 9 Not Run** out of 26 ctest registrations on `crypto`
  HEAD `181d18c6` (registration bug; bn254 + banderwagon + gpukit-*
  binaries exist but ctest cannot find them under the build directory
  layout).
- **3 Rust workspace members** in `lux/crypto/rust/` (not 27, not 23);
  not single-crate publish-ready (`cargo publish --dry-run` fails on
  missing README).
- **8 of 29 c-abi shims wired** on `luxcpp/crypto` `origin/main`; 21
  return `CRYPTO_ERR_NOTIMPL`.
- **VERIFIED perf**: BLS fused 144.22× (claim 148.35×), FHE Metal NTT
  16.92× (claim 16.71×), bn254 KAT 36/36 vs gnark v0.19.2 (ACTUAL-STATE §2).

## What's left

See [LP-137-ACTUAL-STATE.md §9](./LP-137-ACTUAL-STATE.md#9-action-plan--what-blocks-lp-137-v10--ordered-todo)
for the full DAG-aware merge order. Summary: **8 critical-path branches**
must land before LP-137 v1.0 can be asserted on `main`, plus the 5 Red
blocking findings must be resolved (notably the one-line wrong-import
that breaks `pkg/policy + pkg/mpc` build, the missing
`lux/fhe/policy/` package, and the NOTIMPL public C-ABI for blake3 /
slhdsa / lamport).

## Hard rules (PHILOSOPHY-derived)

- One CPU impl per algo.
- One GPU impl per backend per algo.
- Byte-equality oracle = vendored CPU canonical.
- No NOTIMPL stubs in production paths. NOTIMPL is acceptable in c-abi shims as a documented placeholder pending Phase-3 wiring.
- Brand-neutral throughout. Algorithm names ARE the namespace.
