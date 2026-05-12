---
lp: 107
title: Lux Math Substrate — High-Performance Cryptographic Math Layer
description: Shared `luxfi/math` substrate (modular arithmetic, Montgomery, NTT, RNS, polynomial ops, bounded codec, backend dispatch) that consensus protocols, lattice algebra, FHE schemes, and curve threshold protocols all consume.
author: Zach Kelling (z@zoo.ngo)
status: Draft
type: Informational
category: Core
created: 2026-05-04
---

## Abstract

Lux currently has Montgomery arithmetic, NTT, RNS, polynomial operations, GPU dispatch, parameter registries, and bounded serialization scattered across `lattice/`, `pulsar/`, `fhe/`, `crypto/ntt/`, `luxcpp/crypto/{pulsar,fhe,corona}/`, and others — with overlap, drift potential, and no single canonical owner. LP-107 promotes a shared `luxfi/math` Go module + `luxcpp/crypto/math` C++ mirror as the substrate that every protocol repo consumes. Protocols own protocol semantics; math owns the kernels; KATs bind both layers across runtimes.

## Motivation

The current layout has accumulated parallel implementations:

* `lattice/ring/SubRing.NTT` — canonical Lattigo-derived Montgomery NTT (Go).
* `lattice/gpu/gpu_montgomery_*.go` — dispatch wrappers (cgo+gpu vs pure-Go).
* `crypto/ntt/ntt.go` — a separate \"vector kernels and tests\" reference NTT.
* `pulsar/threshold/*` — Pulsar protocol-specific lattice ops, embedding NTT calls.
* `luxcpp/crypto/corona/cpp/lattice_ring*` — native C++ NTT used by both corona and pulsar.
* `luxcpp/crypto/fhe/cpp/backends/*` — FHE-side NTT/keyswitch/bootstrap.

Outcomes of the current shape:
* Drift risk (the same Q can be specified in three places).
* Wire-format hardening lives wherever the bug was first found (e.g. `validateVectorPolyFrame` in `warp/pulsar/pulsar.go`); identical decode bugs in adjacent codepaths are not centrally protected.
* GPU backend selection is ad-hoc; deciding \"is this transcript byte still byte-equal to the CPU oracle?\" requires reading every protocol repo separately.

LP-107 proposes a single owner for the math substrate so every layer above it consumes the same primitives by reference, and every layer below it (C++, GPU) is a backend that must prove byte-equality against the canonical Go reference via KATs.

## Layering

```
luxfi/math
    ↑
luxfi/lattice         (lattice algebra: rings, modules, trapdoors, commits)
    ↑
luxfi/pulsar          (PQ threshold protocol: sign, reshare, dkg2)
luxfi/lens            (curve threshold protocol)
luxfi/fhe             (FHE schemes/runtime)
    ↑
luxfi/consensus       (Quasar/Nebula — consume certificates, no math kernels)
luxfi/warp            (envelope codec — consume certificates only)

luxcpp/crypto/math    ↔ KAT parity ↔ luxfi/math
```

## Specification

### `luxfi/math` package layout

* `math/modarith` — Barrett, Montgomery, add/sub/mul mod q, lazy reduction, constant-time conditional subtract, modulus descriptors.
* `math/ntt` — forward/inverse NTT, root tables, bit-reversal, lazy butterflies, batched NTT, CPU reference + SIMD/CXX/CUDA/Metal/WGSL backends.
* `math/poly` — add/sub/mul polynomial, NTT-domain mul, automorphisms, basis conversion, decomposition.
* `math/rns` — RNS basis, modulus chains, basis extension, modulus switching, rescale.
* `math/sample` — uniform mod q, ternary, centered binomial, discrete Gaussian, rejection sampling. Protocol-specific samplers stay protocol-owned (their distribution is part of the security proof).
* `math/codec` — canonical polynomial / vector / matrix encoding, **bounded readers** (`BoundedReadUint64Slice` etc.), size caps, fuzz-safe decoding. Solves the `ReadUintNSlice` class of bug centrally.
* `math/backend` — CPU/GPU selection, backend registry, deterministic fallback, feature detection, explicit backend policy.
* `math/params` — parameter registry: `ModulusID`, `NTTParamID`, `FHEParamID`, `PulsarParamID`, `HashSuiteID`, `BackendID`. Every KAT carries `parameter_set_id` + `modulus_id` + `backend_id` + `implementation_version` + `hash_suite_id`.

### Backend dispatch

```go
type BackendPolicy string

const (
    BackendPureGo       BackendPolicy = \"pure-go\"
    BackendNativeCPU    BackendPolicy = \"native-cpu\"
    BackendGPUPreferred BackendPolicy = \"gpu-preferred\"
    BackendGPURequired  BackendPolicy = \"gpu-required\"
)

type NTTBackend interface {
    Name() string
    Supports(params NTTParams) bool
    Forward(dst, src []uint64, params NTTParams) error
    Inverse(dst, src []uint64, params NTTParams) error
}

type NTTService struct {
    Params  NTTParams
    Backend NTTBackend
    Policy  BackendPolicy
}
```

Backends: `PureGo`, `AVX2`, `NEON`, `CXX`, `CUDA`, `Metal`, `WGSL`. For consensus paths, default policy is `BackendPureGo` or `BackendNativeCPU` (deterministic). GPU is opt-in only when equivalence is KAT-proven.

### Dispatch contract

1. Inputs are canonical.
2. Outputs are canonical.
3. Backend selection MUST NOT alter transcript bytes.
4. Unsupported backend returns explicit error or falls back per policy.
5. KATs verify equivalence across all supported backends.

### `luxcpp/crypto/math` mirror

```
luxcpp/crypto/math/
    modarith/
    ntt/
    poly/
    rns/
    codec/
    backend/
luxcpp/crypto/fhe/      (consumes math)
luxcpp/crypto/pulsar/   (consumes math + lattice)
luxcpp/crypto/lens/     (consumes math curves)
```

Dependency direction:
```
pulsar C++ -> math C++
fhe C++    -> math C++
lens C++   -> math C++ curves
```
NEVER `math C++ -> pulsar` etc.

### Codec hardening (closes the `ReadUint64Slice` DoS class)

```go
type Limits struct {
    MaxFrameBytes     int
    MaxUint16SliceLen int
    MaxUint32SliceLen int
    MaxUint64SliceLen int
    MaxDepth          int
}

func (r *Reader) ReadUint64SliceBounded(maxLen int) ([]uint64, error)
```

No recursion. No hidden growth. No unbounded allocation. Every protocol consuming wire data goes through `math/codec` (no protocol-local decoders).

### Stub policy

Files that previously lived as `*_stub.go` returning errors are renamed and given real bodies:

| Old name | New name | Body |
|---|---|---|
| `*_stub.go` (pure-Go fallback) | `*_purego.go` | real Go body delegating to canonical reference |
| `*_stub.go` (CPU when GPU unavailable) | `*_cpu_fallback.go` | real CPU body, not accelerated |
| `*_stub.go` (intentionally not yet wired) | `*_native_pending.go` | error-return only when native impl is genuinely incomplete |
| `*_stub.go` (dispatcher hook) | `*_dispatch_purego.go` | returns false to signal canonical path |

A \"stub\" sounds fake. A \"purego fallback\" is production-valid.

## Migration plan

### Phase 1 — Stabilize current repos

1. Land lattice PR #3 (ReadUint64Slice DoS bound) + companion PR #5 (CI hygiene + no-stub policy).
2. Rename misleading stubs to purego fallback / dispatch.
3. Add comments explaining fallback semantics.
4. Keep APIs stable.

### Phase 2 — Introduce `luxfi/math`

Create `github.com/luxfi/math` with copied canonical implementations of `modarith`, `ntt`, `codec`, `params`, `backend`. Add KATs that lock the byte-stream behavior.

### Phase 3 — Make `lattice` consume `math`

`lattice/ring` internal NTT delegates to `math/ntt`. Keep wrapper compatibility. `ring.SubRing.NTT` becomes a thin shim over `math.NTTService.Forward` for the matched param set.

### Phase 4 — Make `pulsar` consume `lattice` + `math`

Pulsar stops reaching into ad-hoc GPU/NTT code; it imports `lattice` for ring algebra and `math` for primitives.

### Phase 5 — Make `fhe` consume `math`

FHE and Pulsar share NTT/RNS primitives where parameter-compatible.

### Phase 6 — Bind `luxcpp/crypto`

`luxcpp/crypto/math` becomes the native backend for `luxfi/math`. Each Go primitive has a C++ counterpart that the Go-side dispatcher can route to via cgo when `cgo+gpu` (or `cgo+cxx_cpu`) is built.

### Phase 7 — Cross-runtime KAT release gate

Before claiming v0.2.0:
* Go math KAT → C++ verifies.
* C++ math KAT → Go verifies.
* GPU math KAT → CPU verifies.

## What this is NOT

* NOT putting protocol semantics in `math`.
* NOT putting GPU dispatch in `pulsar`.
* NOT letting `fhe` and `pulsar` maintain separate NTT stacks forever.
* NOT calling pure-Go fallbacks \"stubs.\"
* NOT allowing unbounded codec readers anywhere near wire formats.
* NOT letting GPU backend selection affect transcript bytes.
* NOT having multiple parameter registries.

## Rationale

The user-facing thesis: **Lux separates cryptographic protocol semantics from high-performance arithmetic.** Go is the canonical semantic reference; C++/GPU is the performance backend; KATs prove they are the same; protocols never own the math kernels.

Every other architectural decision in the post-quantum stack is downstream of this separation. Without it, every \"is this still byte-equal\" question requires reading the whole protocol repo. With it, the question is local to `math` + a pinned KAT manifest.

## Backwards compatibility

Phase 1 is a no-op for callers (renames + comments only).

Phases 2–5 keep API stability for `lattice`, `pulsar`, `fhe`, `lens` consumers — internal delegation only.

Phase 6 is invisible to Go-only callers.

Phase 7 is a new release-gate, not a breaking change.

## Reference

* lattice PR #3 — ReadUint64Slice DoS bound (substantive change driving the codec hardening direction).
* lattice PR #5 — CI hygiene + no-stub policy (Phase 1 step in this repo).
* `proofs/definitions/algorithms.tex` — canonical algorithm definitions that math-substrate primitives must realize.
* `papers/lux-pq-consensus-benchmarks/sections/02-microbenchmarks.tex` — measured numbers that any new backend must match or beat.
* `papers/lux-fhe-runtime/sections/04-cross-runtime-katology.tex` — KAT contract pattern that LP-107's release gate generalizes.
