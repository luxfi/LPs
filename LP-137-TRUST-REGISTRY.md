---
lp: 137
title: Lux GPU Runtime Trust + Capability Registry
tags: [gpu, attestation, tee, confidential-compute, mpc, registry, scheduler, hopper, blackwell]
description: Trust-mode + IO-level enums, worker / node capability records, lane + workload eligibility policy, and composite attestation envelope for the Lux GPU Runtime.
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Infrastructure
created: 2026-04-27
requires:
  - lp-013 (FHE-GPU)
  - lp-127 (Attestation)
  - lp-132 (QuasarGPU Execution Adapter)
  - lp-136 (Lux Cloud)
references:
  - lp-019 (Threshold MPC)
  - lp-025 (Fraud Proofs)
  - lp-067 (Confidential ERC-20)
  - lp-137-fhe-typing (FHE-GPU Domain Typing)
---

# LP-137: Lux GPU Runtime Trust + Capability Registry

## Abstract

LP-137-TRUST-REGISTRY specifies the **trust + capability registry** that
the Lux GPU Runtime scheduler uses to decide *which worker may run which
workload*. It defines:

1. Three single-byte enums that classify trust and privacy:
   `ComputeTrustMode`, `ConfidentialIOLevel`, `WorkloadPrivacyClass`.
2. `WorkerCapability` and `NodeCapability` records — the wire form by
   which a worker advertises what it can do.
3. `LanePolicy` (operator-controlled) and `WorkloadPolicy` (per-request),
   plus a single canonical `Eligible(lane, workload, worker)` check that
   gates every dispatch decision.
4. `CompositeAttestation` — a deterministically-encoded envelope over
   CPU TEE + GPU TEE + platform evidence, whose SHA-256 root is the
   value stored in `WorkerCapability.AttestationRoot`.

Every Go type has a byte-stable C++ mirror with `static_assert(sizeof)`
and `static_assert(offsetof)` invariants, so the same registry record
crosses the cgo / shared-memory boundary unchanged.

This LP is a sibling of LP-137-FHE-TYPING: that LP types the *math*
(polynomial domains, Montgomery encoding); this LP types the *trust*
(who can compute, under what guarantees).

## Motivation

The runtime cannot ship a confidential-compute lane until two questions
have one and only one answer each:

> Q1. *What does this worker actually guarantee?*
> Q2. *Is that enough for this workload?*

Without typed answers, every scheduler boundary is a rubber stamp. A
worker reporting "TEE: yes" tells the dispatcher nothing about whether
the GPU bounce buffer is encrypted, whether the NVSwitch fabric is
attested, or whether the operator could swap the firmware out from
under us. A workload tagged "private" tells the dispatcher nothing
about whether the user data is confidential, the model weights are
confidential, the order flow is regulated, or the validator-key
material is being touched.

The fix is to encode both sides of the question as small, totally-ordered
enums:

- `ComputeTrustMode` = a five-step ladder from
  `PublicDeterministic` to `ZKOrFraudProofed`.
- `ConfidentialIOLevel` = a five-step ladder from `None` to
  `FullDeviceIOAttested` (covering CPU TEE, GPU TEE, protected PCIe,
  and full attested device IO including NVSwitch + DPU NIC).
- `WorkloadPrivacyClass` = a six-tag classification from `Public` to
  `ResearchContribution`.

`Eligible()` becomes a conjunction of integer comparisons and set
memberships against these enums. The truth table is small enough to
audit by inspection and large enough to cover every gate the runtime
needs.

The composite attestation envelope is necessary because no single
attestation report covers the whole platform. NVIDIA NRAS attests the
GPU; Intel TDX / AMD SEV-SNP attests the CPU; UEFI / kernel
measurements attest the firmware path. The verifier must observe all of
them together to make a sound trust decision. Per the NVIDIA
Confidential Compute and Intel Trust Authority reference docs, the
right encoding is a deterministic, canonically-ordered envelope whose
digest is the durable identity of the platform state. That is what
`CompositeAttestation.Root()` computes.

## Specification

### 1. Trust enums (`luxfi/lattice/v7/types`)

```go
type ComputeTrustMode uint8
const (
    TrustPublicDeterministic   ComputeTrustMode = 0
    TrustAttestedGpuOnly       ComputeTrustMode = 1
    TrustCpuGpuCompositeTEE    ComputeTrustMode = 2
    TrustConfidentialIO        ComputeTrustMode = 3
    TrustZKOrFraudProofed      ComputeTrustMode = 4
)

type ConfidentialIOLevel uint8
const (
    IOLevelNone                    ConfidentialIOLevel = 0
    IOLevelCpuTeeOnly              ConfidentialIOLevel = 1
    IOLevelCpuGpuComposite         ConfidentialIOLevel = 2
    IOLevelProtectedCpuGpuTransfer ConfidentialIOLevel = 3
    IOLevelFullDeviceIOAttested    ConfidentialIOLevel = 4
)

type WorkloadPrivacyClass uint8
const (
    PrivacyPublic               WorkloadPrivacyClass = 0
    PrivacyPrivateUserData      WorkloadPrivacyClass = 1
    PrivacyPrivateModelWeights  WorkloadPrivacyClass = 2
    PrivacyValidatorKeyMaterial WorkloadPrivacyClass = 3
    PrivacyRegulatedOrderflow   WorkloadPrivacyClass = 4
    PrivacyResearchContribution WorkloadPrivacyClass = 5
)
```

The first two enums are **strict total orders** — `Eligible()` uses `>=`
on the underlying `uint8`. Adding a new variant in the middle of the
order is a breaking change because every gate that previously read `>=
TrustCpuGpuCompositeTEE` would silently flip. New variants MUST be
appended at the end.

The third enum (`WorkloadPrivacyClass`) is unordered: it is a tag, not a
ladder. The mapping from privacy class to trust + IO floors lives in
`WorkloadPolicy`, not on the enum itself.

### 2. Capability records (`luxfi/mpc/pkg/registry`)

```go
type WorkerCapability struct {
    WorkerID         string                   // "<NodeID>/<DeviceIndex>"
    NodeID           string
    Arch             GPUArch                  // Hopper, Blackwell, Ampere, ...
    Backend          GPUBackend               // CUDA, ROCm, Metal, ...
    VRAMBytes        uint64
    FP16TFlops       uint32
    FP8TFlops        uint32
    INT8TOps         uint32
    Interconnect     PeerInterconnect         // None, PCIe, NVLink, NVSwitch, ...
    TrustMode        lattice.ComputeTrustMode
    IOLevel          lattice.ConfidentialIOLevel
    AttestationRoot  [32]byte                 // SHA-256(CompositeAttestation)
}

type NodeCapability struct {
    NodeID          string
    Region          string
    OperatorID      string
    CPUTeeType      string                    // "amd-sev-snp" | "intel-tdx" | ...
    Workers         []WorkerCapability
    AttestationRoot [32]byte
}
```

`Validate()` enforces:

- `WorkerID` is prefixed with `NodeID/`.
- All enum-typed fields are `Valid()`.
- `TrustMode >= TrustCpuGpuCompositeTEE` requires
  `Arch.SupportsConfidentialCompute()` (Hopper or Blackwell today).
- `TrustMode >= TrustCpuGpuCompositeTEE` requires a non-zero
  `AttestationRoot`.
- `IOLevel >= IOLevelProtectedCpuGpuTransfer` requires
  `TrustMode >= TrustConfidentialIO`.
- Per-node uniqueness of `WorkerID`.

### 3. Policies + `Eligible()` (`luxfi/mpc/pkg/registry`)

```go
type LanePolicy struct {
    Name               string
    MinTrustMode       lattice.ComputeTrustMode
    MinIOLevel         lattice.ConfidentialIOLevel
    AllowedArches      []GPUArch    // empty = any
    AllowedBackends    []GPUBackend // empty = any
    RequireAttestation bool
}

type WorkloadPolicy struct {
    PrivacyClass         lattice.WorkloadPrivacyClass
    MinTrustMode         lattice.ComputeTrustMode
    MinIOLevel           lattice.ConfidentialIOLevel
    RequiredArches       []GPUArch    // empty = any
    RequiredBackends     []GPUBackend // empty = any
    MinVRAMBytes         uint64
    RequiredInterconnect PeerInterconnect
}

func Eligible(lp *LanePolicy, wp *WorkloadPolicy, w *WorkerCapability) error
```

`Eligible()` is a conjunction of twelve gates evaluated in fixed order;
a failure returns the first sentinel error and stops. The order is
documented in `policy.go::Eligible` and is regression-pinned by
`TestEligible_GateOrdering`.

| # | Gate | Source |
|---|------|--------|
| 1 | `worker.TrustMode >= lane.MinTrustMode` | LanePolicy |
| 2 | `worker.IOLevel >= lane.MinIOLevel` | LanePolicy |
| 3 | `worker.Arch ∈ lane.AllowedArches` | LanePolicy |
| 4 | `worker.Backend ∈ lane.AllowedBackends` | LanePolicy |
| 5 | `lane.RequireAttestation → worker.AttestationRoot ≠ 0` | LanePolicy |
| 6 | `worker.TrustMode >= workload.MinTrustMode` | WorkloadPolicy |
| 7 | `worker.IOLevel >= workload.MinIOLevel` | WorkloadPolicy |
| 8 | `worker.Arch ∈ workload.RequiredArches` | WorkloadPolicy |
| 9 | `worker.Backend ∈ workload.RequiredBackends` | WorkloadPolicy |
| 10 | `worker.VRAMBytes >= workload.MinVRAMBytes` | WorkloadPolicy |
| 11 | `worker.Interconnect >= workload.RequiredInterconnect` | WorkloadPolicy |
| 12 | privacy class → `worker.Arch.SupportsConfidentialCompute()` | consistency |

`WorkloadPolicy.Validate()` further enforces that
`PrivacyValidatorKeyMaterial` and `PrivacyRegulatedOrderflow` workloads
require `MinTrustMode >= TrustCpuGpuCompositeTEE` at policy-construction
time, so a misconfigured workload cannot downgrade itself by accident.

### 4. Composite attestation envelope (`luxfi/mpc/pkg/attestation`)

```go
type CompositeAttestation struct {
    Version           string                       `cbor:"version"`
    NodeID            string                       `cbor:"node_id"`
    WorkerIDs         []string                     `cbor:"worker_ids"`        // sorted ascending
    AssertedTrustMode lattice.ComputeTrustMode     `cbor:"asserted_trust_mode"`
    AssertedIOLevel   lattice.ConfidentialIOLevel  `cbor:"asserted_io_level"`
    Evidence          []Evidence                   `cbor:"evidence"`
    IssuedAt          time.Time                    `cbor:"issued_at"`
}

type Evidence struct {
    Kind      EvidenceKind `cbor:"kind"`       // cpu_tee_quote | gpu_nras_report | ...
    Issuer    string       `cbor:"issuer"`     // "nvidia.nras.v1" | "amd.sev.snp" | ...
    SubjectID string       `cbor:"subject_id"` // WorkerID for GPU evidence, NodeID for CPU
    Blob      []byte       `cbor:"blob"`       // opaque vendor-specific report
    IssuedAt  time.Time    `cbor:"issued_at"`
}

func (c *CompositeAttestation) Root() ([32]byte, error)
```

`Root()` serializes the envelope using **RFC 8949 §4.2 Core Deterministic
CBOR** (`fxamacker/cbor.CoreDetEncOptions`) and hashes the bytes with
SHA-256. The same envelope produces the same root on every node, every
run. The root is what `WorkerCapability.AttestationRoot` stores and what
the verifier re-derives independently.

`Root()` does not verify the evidence. Verification — checking the
NVIDIA NRAS signature, the AMD SEV-SNP attestation report, the Intel
Trust Authority verdict — is the consumer's job and lives in a
verifier-specific package keyed on `Evidence.Issuer`.

`Validate()` enforces:

- envelope `Version` matches `EnvelopeVersion`
- `WorkerIDs` are non-empty, prefix-correct, sorted ascending,
  duplicate-free
- enums are `Valid()`
- at least one evidence entry exists
- every evidence entry has a non-empty Kind / Issuer / SubjectID / Blob
  and a non-zero `IssuedAt`
- composite trust mode (`>= TrustCpuGpuCompositeTEE`) requires at least
  one GPU evidence entry (`EvidenceGPUNRASReport` or
  `EvidenceGPUVendorReport`)
- envelope `IssuedAt` is non-zero

### 5. Cross-language byte stability

Every enum has a C++ mirror at
`luxcpp/lattice/include/lux/lattice/types/trust.hpp`:

```cpp
enum class ComputeTrustMode : std::uint8_t { ... };
enum class ConfidentialIOLevel : std::uint8_t { ... };
enum class WorkloadPrivacyClass : std::uint8_t { ... };

static_assert(sizeof(ComputeTrustMode)     == 1, "");
static_assert(sizeof(ConfidentialIOLevel)  == 1, "");
static_assert(sizeof(WorkloadPrivacyClass) == 1, "");
static_assert(static_cast<uint8_t>(ComputeTrustMode::ConfidentialIO) == 3, "");
// ... full integer-value pinning for all 14 variants
```

The matching C++ test
(`luxcpp/lattice/test/trust_test.cpp`) runs 41 `CHECK` assertions
covering size, ordering, validity predicates, and a 4-byte
`TrustTriple` byte-image round-trip. The Go-side test
(`luxfi/lattice/v7/types/trust_test.go::TestTrustEnum_CrossLangByteImage`)
asserts the same 4-byte image. If either side changes enum width or
integer encoding, both tests fail and the cgo boundary stops corrupting
silently.

`WorkerCapability`, `NodeCapability`, `LanePolicy`, `WorkloadPolicy`,
and `CompositeAttestation` are not byte-stable structs — they cross
language boundaries via deterministic CBOR (envelope) or JSON-over-RPC
(registry), so per-field offset stability is not required and not
asserted. The enums embedded in those structs *are* byte-stable, which
is what the cgo dispatch path actually consumes.

### 6. Determinism contract

`Root()` produces the same bytes for the same envelope on every machine
because:

- `fxamacker/cbor.CoreDetEncOptions()` enforces:
  - shortest-form integer encoding
  - CTAP2 canonical map key ordering (bytewise lexical of the encoded
    keys)
  - definite-length encoding only
  - no indefinite-length strings or arrays
  - finite-only floats
- `IssuedAt` is forced to UTC inside `Root()` so timezone-tagged inputs
  do not change the digest.
- `WorkerIDs` are caller-sorted and duplicate-free; out-of-order input
  is rejected at validate time, not silently re-sorted.
- `Evidence` order is preserved (not re-sorted) because measurement
  logs and verifier outputs may carry ordering semantics.

The combination is RFC 8949 §4.2 conformant. Any conforming CBOR decoder
on any platform reads the same envelope; any conforming encoder
re-encodes the same body to the same bytes.

## Rationale

### Why a separate trust ladder and IO ladder?

Trust mode answers "who can I run on?". IO level answers "how do bytes
move on that worker?". Hopper Confidential Compute pairs a GPU TEE
(trust) with a bounce-buffer-encrypted PCIe path (IO); Blackwell adds
TEE-IO (a strictly stronger IO posture without changing the trust
posture). Collapsing the two into one enum forces every downstream
consumer to re-derive whether their gate is about isolation or about
data movement. Two ladders, one comparison each, twelve gates total.

### Why CBOR for the attestation envelope?

LP-137-FHE-TYPING uses raw `encoding/binary` for fixed-shape structs
because the math kernels need byte-for-byte layout stability across
cgo. The attestation envelope is shaped differently: variable-length
evidence blobs, vendor-specific issuers, optional fields that some
verifiers populate and others skip. RFC 8949 §4.2 deterministic CBOR
gives a canonical wire form for variable-shape data with stable digests.

`fxamacker/cbor` is already a direct dependency in `luxfi/mpc` for
intent canonicalization, FROST/LSS/BLS config marshalers, and
SR25519 key shares (see `pkg/intent/canonical.go`,
`pkg/mpc/frost_config_marshal.go`, etc.). One library, one canonical
encoding, no new dependency. NVIDIA NRAS and Intel Trust Authority
both publish CBOR-shaped composite envelopes; matching their on-the-wire
format reduces verifier impedance to zero.

### Why does `Root()` reject invalid envelopes?

A digest over an invalid envelope is a silent-corruption hazard: the
hash succeeds, but no two implementations would agree on what the
hashed bytes meant. Forcing `Root()` to validate makes "I have a root"
imply "I have a well-formed envelope". The verifier still re-validates
on its end; the producer-side check exists to catch the bug before it
ships.

### Why is `Eligible()` order-sensitive?

The returned sentinel error labels the metric exported by the scheduler
(`ineligible_reason{lane,workload,error_class}`). If the order of gates
shifted, an operator chasing "lane_trust_below_floor" alerts could
suddenly see them disappear because gate 4 (lane backend) now fires
first. The fixed order, regression-pinned by `TestEligible_GateOrdering`,
keeps the dashboard stable.

### Why does the privacy-class gate (#12) re-check what `WorkerCapability.Validate` already checks?

`Eligible()` is on the scheduler hot path; `Validate()` is on the API
edge. A worker record that bypassed the API edge (e.g. read directly
from a stale cache after a downgrade) would fail at gate 12 even though
its struct is still locally consistent. The redundancy is cheap (one
arch-enum compare) and closes the trust-on-trust hole.

## Backwards compatibility

This LP introduces three new packages (`luxfi/mpc/pkg/registry`,
`luxfi/mpc/pkg/attestation`) and a new C++ header
(`luxcpp/lattice/include/lux/lattice/types/trust.hpp`). Nothing imports
them yet. The trust enums in `luxfi/lattice/v7/types` already exist;
this LP documents and freezes their shape, adds the cross-language byte
image test, and ships the registry / attestation packages that depend
on them.

Per the project philosophy: forward-only, no compatibility shims.

## Reference implementation

- `lux/lattice/types/trust.go` — Go enums (`ComputeTrustMode`,
  `ConfidentialIOLevel`, `WorkloadPrivacyClass`) with `String()` +
  `Valid()`.
- `lux/lattice/types/trust_test.go` — Go tests pinning integer values,
  ordering, validity predicates, and the 4-byte `trustTriple`
  cross-language byte image.
- `luxcpp/lattice/include/lux/lattice/types/trust.hpp` — C++ mirror
  with `static_assert(sizeof(...) == 1)` and integer-value invariants
  for every variant.
- `luxcpp/lattice/test/trust_test.cpp` — 41 standalone-runnable C++
  assertions covering size, ordering, validity, and the matching
  `TrustTriple` memcmp test.
- `lux/mpc/pkg/registry/types.go` — `WorkerCapability` /
  `NodeCapability`, `GPUArch`, `GPUBackend`, `PeerInterconnect`,
  `Validate()`.
- `lux/mpc/pkg/registry/policy.go` — `LanePolicy`, `WorkloadPolicy`,
  `Eligible()`, sentinel error set.
- `lux/mpc/pkg/registry/{types,policy}_test.go` — eligibility
  truth-table tests, gate-ordering regression, validation matrices.
- `lux/mpc/pkg/attestation/composite.go` — `CompositeAttestation`,
  `Evidence`, `EvidenceKind`, deterministic `Root()`, `Marshal()`,
  `Unmarshal()`, `Validate()`.
- `lux/mpc/pkg/attestation/composite_test.go` — round-trip,
  determinism, sensitivity-to-every-field, validate-rejects-invalid,
  garbage-decode-fails.

## References

- LP-013 — FHE on GPU
- LP-019 — Threshold MPC for Bridge Signing
- LP-025 — Fraud Proofs
- LP-067 — Confidential ERC-20
- LP-127 — Attestation
- LP-132 — QuasarGPU Execution Adapter
- LP-136 — Lux Cloud
- LP-137-FHE-TYPING — FHE-GPU Domain Typing System (sibling LP)
- NVIDIA Confidential Compute Whitepaper, 2024 (Hopper / Blackwell)
- NVIDIA Remote Attestation Service (NRAS) reference, 2024
- NVIDIA `nvTrust` SDK, 2024
- Intel Trust Authority composite attestation specification, 2024
- AMD SEV-SNP attestation report v3, 2024
- Intel TDX Module 1.5 attestation specification, 2024
- RFC 8949 — Concise Binary Object Representation (CBOR)
- RFC 9090 — CBOR Tags

## Copyright

Copyright (c) 2026, Lux Industries Inc. SPDX-License-Identifier: BSD-3-Clause.
