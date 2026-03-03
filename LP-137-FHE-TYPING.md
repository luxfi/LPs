---
lp: 137
title: FHE-GPU Domain Typing System
tags: [fhe, gpu, ntt, montgomery, type-system, ckks, tfhe, lp-013]
description: Type-system foundation that prevents silent FHE correctness failures across Go and C++ kernel boundaries.
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Privacy
created: 2026-04-27
requires:
  - lp-013 (FHE-GPU)
  - lp-029 (NTT Transform)
  - lp-066 (TFHE)
  - lp-132 (QuasarGPU Execution Adapter)
references:
  - lp-067 (Confidential ERC-20)
  - lp-127 (Attestation)
---

# LP-137: FHE-GPU Domain Typing System

## Abstract

LP-137 specifies the **domain typing system** that wraps every polynomial
buffer, NTT context, FHE ciphertext, and precompile artifact in the
luxfi/lattice and luxfi/fhe stacks with a tag the kernel boundary refuses to
violate. This is the type-system foundation for LP-013 (FHE-GPU) and the
QuasarGPU execution adapter (LP-132): every subsequent FHE-GPU kernel —
ring-NTT, blind rotate, programmable bootstrap, threshold decryption,
encrypted-EVM precompile — depends on the types defined here existing.

Without this layer, a buffer in standard form can be silently fed to a
Montgomery-domain kernel and produce undecryptable ciphertexts, key reuse
across circuits, or — worst case — a privacy break. With it, every
violation is rejected at dispatch.

## Motivation

PR #121 found that the Go `Ring.NTT` in luxfi/lattice operates in
**Montgomery form** while the Metal `metal_ntt.mm` kernel in
luxcpp/lattice operates in **Barrett standard form**. The two functions
have identical signatures (`fn(ctx, in, out)`), so they dispatch
indistinguishably from the caller's view. Direct dispatch — calling the
GPU kernel with a Montgomery-encoded operand — produces silently wrong
output. The math layer cannot detect the error; only the decryptor at the
end of the pipeline observes the corruption, often too late to attribute.

The architectural fix is not "port one kernel." It is to make domain
mismatch **impossible to express**. Per the FHE-GPU architecture spec §18:
"domain tag must match kernel expectation"; per §20: "no untyped buffers."

This LP defines the canonical types every FHE-GPU kernel and every caller
must use, and the byte-stable Go ↔ C++ layout that lets these types cross
the cgo boundary unmodified.

## Specification

### 1. Polynomial domains

A polynomial buffer in luxfi/lattice lives in exactly one of four
**arithmetic domains**:

| Variant            | Coefficients in        | NTT? | Montgomery? |
|--------------------|------------------------|------|-------------|
| `Standard`         | `[0, q)`               | no   | no          |
| `Montgomery`       | `a*R mod q`, `R=2^64`  | no   | yes         |
| `NTTStandard`      | `[0, q)` (eval form)   | yes  | no          |
| `NTTMontgomery`    | `a*R mod q` (eval)     | yes  | yes         |

These four states form a 2x2 grid. Each kernel declares the (Input, Root,
Output) tuple it accepts; dispatch with any other tuple is rejected at the
boundary.

The Go NTT path in luxfi/lattice (`ring.Ring.NTT`) consumes
`Montgomery` and produces `NTTMontgomery`. Any kernel intending to share
that pipeline must declare the same tuple. Any kernel that expects
`Standard` and `NTTStandard` is the Barrett path; its caller must convert
explicitly via `MForm` / `IMForm`.

### 2. Type definitions

Two repos own the canonical definitions:

#### Go (consumed by luxfi/fhe, luxfi/chains/evm/cevm, luxfi/chains/*):

`github.com/luxfi/lattice/v7/types`
- `PolyDomain` — `uint8` enum (`Standard=0, Montgomery=1, NTTStandard=2, NTTMontgomery=3`).
- `NTTContext` — 48-byte struct: `{Modulus, MontR, MontR2, QInv, N, ModulusID, TwiddleOffset, InputDomain, RootDomain, OutputDomain, _pad}`.
- `ReductionMode` — `uint8` enum (`Strict=0, Lazy2=1, Lazy4=2, Lazy8=3`).
- `ReductionBudget` — 24-byte struct: `{Modulus, OpsSinceReduce, MaxOpsBeforeOverflow, Mode, _pad}`.

`github.com/luxfi/fhe/types`
- `FHEScheme` — `uint32` enum (`TFHE=0, FHEW=1, CKKS=2, BFV=3, BGV=4`).
- `FHECiphertextHeader` — 144-byte struct: `{ParamsHash, KeyID, CircuitID, Scheme, Level, N, ModulusCount, Domain, _pad, Reserved}`.
- `FHEPrecompileArtifact` — 232-byte struct: seven 32-byte digest fields + `OpCount` + `FailedCount`.

#### C++ (consumed by luxcpp/lattice, luxcpp/fhe, MLX/Metal kernels):

`luxcpp/lattice/include/lux/lattice/types/{domain,reduction}.hpp`
- `lux::lattice::PolyDomain`, `NTTContext`, `ReductionMode`, `ReductionBudget`
- `static_assert` on `sizeof` and `offsetof` for every field.

`luxcpp/fhe/include/lux/fhe/types/{ciphertext_header,artifact}.hpp`
- `lux::fhe::FHEScheme`, `FHECiphertextHeader`, `FHEPrecompileArtifact`
- `static_assert` on layout, mirroring Go.

### 3. Validation contract

Every kernel boundary calls `Validate()` (Go) or `ntt_context_valid()` (C++)
on its `NTTContext` BEFORE dispatch. The validator rejects:

1. `Modulus == 0`
2. `N` not a power of two, or `N < 2`
3. `RootDomain != InputDomain` (twiddle/operand encoding mismatch — the #121 class)
4. `OutputDomain` inconsistent with the input/forward-NTT transition rule:
   - `Standard → NTTStandard` (forward, Barrett path)
   - `Montgomery → NTTMontgomery` (forward, Montgomery path)
   - `NTTStandard → Standard` (inverse, Barrett path)
   - `NTTMontgomery → Montgomery` (inverse, Montgomery path)

Any other tuple returns `ErrDomainMismatch` and the kernel MUST NOT
dispatch. The Go and C++ validators implement identical rules.

### 4. Kernel ↔ domain dispatch table

The accepted (Input, Root, Output) tuples for each kernel family in the
luxfi/lattice + luxfi/fhe stack:

| Kernel                        | Input            | Root             | Output           |
|-------------------------------|------------------|------------------|------------------|
| `Ring.NTT` forward (Go)       | Montgomery       | Montgomery       | NTTMontgomery    |
| `Ring.NTT` inverse (Go)       | NTTMontgomery    | NTTMontgomery    | Montgomery       |
| `metal_ntt.mm` forward (NEW)  | Montgomery       | Montgomery       | NTTMontgomery    |
| `metal_ntt.mm` inverse (NEW)  | NTTMontgomery    | NTTMontgomery    | Montgomery       |
| `ckks.MulNew` (eval-form mul) | NTTMontgomery    | NTTMontgomery    | NTTMontgomery    |
| `MForm` (Standard → Montgomery) | Standard       | n/a              | Montgomery       |
| `IMForm` (Montgomery → Standard) | Montgomery    | n/a              | Standard         |

The metal kernel MUST be ported to consume Montgomery operands. Until it
is, dispatching to it with `InputDomain == Montgomery` MUST return
`ErrDomainMismatch`; the caller must fall back to CPU.

### 5. Lazy reduction modes

`ReductionMode` and `ReductionBudget` track when a kernel chain may defer
modular normalisation. Reference: VeloFHE §3.2, CAT GPU FHE 2025 §4.

| Mode             | Result range      | Modulus cap | Ops before reduce |
|------------------|-------------------|-------------|-------------------|
| `Strict`         | `[0, q)`          | `q < 2^64`  | 1                 |
| `Lazy2`          | `[0, 2q)`         | `q < 2^63`  | 2                 |
| `Lazy4`          | `[0, 4q)`         | `q < 2^62`  | 4                 |
| `Lazy8`          | `[0, 8q)`         | `q < 2^61`  | 8                 |

`SafeBoundFor(mode, modulus)` returns `0` if the modulus exceeds the
mode's cap, forcing the caller down the strict path. `NewReductionBudget`
returns `ErrModulusTooLargeForLazy` for the same condition. Callers
`Charge(n)` after `n` deferred ops and `Reset()` after each
normalisation pass.

### 6. Ciphertext binding

Every FHE ciphertext on the wire and in memory carries an
`FHECiphertextHeader`. The header binds the buffer to:

- **Parameter set** (`ParamsHash`) — degree N, modulus chain, noise sigma.
- **Key material** (`KeyID`) — public key or evaluation key.
- **Circuit / policy** (`CircuitID`) — the program this ciphertext was
  produced under. Different circuits produce headers with different
  `CircuitID` values; reusing a ciphertext across circuits is detectable.
- **Domain** (`Domain`) — current `PolyDomain` of the buffer.
- **Level + ModulusCount** — multiplicative depth budget.

`Header.Digest()` returns SHA-256 of the canonical 144-byte encoding.
`Header.MatchesContext(ctx)` returns true iff `N` and `Domain` agree with
the kernel's `InputDomain`. Both are deterministic and tested against
re-runs.

### 7. Precompile artifact binding

Each FHE precompile invocation produces an `FHEPrecompileArtifact` with
seven 32-byte digest fields + an op-count pair. This artifact is the
contribution to `fchain_fhe_root` in the QuasarRoundDescriptor (LP-132,
LP-134) and to the FChainTFHE cert lane (LP-013, LP-020 §3.0).

The `ThresholdTranscriptRoot` is zero unless the precompile participated
in a threshold round; the `AttestationRoot` is zero unless the precompile
was confidential and attestation was requested. Both are detectable via
`IsThreshold()` / `IsAttested()`.

### 8. Threshold transcript binding into ciphertext lifecycle

A threshold-decrypted ciphertext is produced by combining partial
decryption shares from a quorum. The lifecycle:

1. **Encrypt**: caller produces `FHECiphertextHeader{KeyID=H(Pk), CircuitID=H(C)}`.
2. **Compute**: kernel chain operates on the buffer; intermediate headers
   carry the same `KeyID` + updated `Domain` + `Level` decremented by
   each rescale.
3. **Threshold decrypt**: each share contributes to a transcript;
   transcript hash binds into `FHEPrecompileArtifact.ThresholdTranscriptRoot`.
4. **Result**: the cleartext result is bound to the original `CircuitID`
   via the precompile artifact, so an off-circuit decryption is detectable
   by any verifier.

The transcript binding closes the loop: a ciphertext produced under
circuit C, decrypted under transcript T, and recorded under
`fchain_fhe_root` proves that exactly the authorised computation
ran on exactly the authorised inputs and was decrypted under the
authorised quorum.

### 9. Byte-stability invariant (cross-language)

Every struct defined in this LP MUST have identical byte layout between
Go and C++. Verified by:

- `unsafe.Sizeof` + offset checks on the Go side.
- `static_assert(sizeof(...) == ..., "...")` + `static_assert(offsetof(...) == ..., "...")` on the C++ side.
- A canonical byte image test: a struct populated with a known pattern is
  serialised by both Go and C++ and the byte arrays are compared.
  See `lattice/types/cross_lang_test.go::TestNTTContext_CrossLangByteImage`
  and `luxcpp/lattice/test/types_test.cpp::test_ntt_context_memcmp`.

If any layout test fails, it is a STOP-the-line bug. Mismatched layouts
are silently corrupting on the cgo / shared-memory boundary; do not paper
over.

## Rationale

### Why a separate `types` package and not types embedded in `ring`?

The ring package contains arithmetic; the types package contains only
declarations and validation. Separating them avoids a circular import
when `fhe/types` imports `lattice/types` (the ciphertext header references
`PolyDomain`). This is the only Hanzo-philosophy compatible layering: the
type-system layer does not depend on the math layer, the math layer
imports the type-system layer, and the FHE layer imports both.

### Why no CBOR / external serialisation library?

The struct layouts are fixed. Canonical encoding is a 144-byte (or 48-byte,
or 232-byte) little-endian dump using `encoding/binary` from the Go
standard library and direct byte manipulation in C++. Adding `fxamacker/cbor`
or any other library duplicates `encoding/binary` for no benefit and
introduces a non-stdlib dependency. Stdlib first.

### Why `_pad` as an explicit field instead of relying on compiler padding?

An explicit pad byte / array makes the byte image deterministic across
Go versions, C++ compilers, and platforms. Relying on implicit padding is
non-portable and silently breaks layout tests on architectures with
different alignment rules.

### Why include `Reserved [24]byte` in `FHECiphertextHeader`?

Forward-compatible extension. Future fields (e.g. attestation hashes,
transcript pointers) can be promoted from `Reserved` without changing the
byte size of the header. Today, `Reserved` is initialised to zero and
included in `Digest()` so any future repurposing is detectable as a
distinct digest.

## Backwards compatibility

This LP introduces a new `types` package; nothing existing imports it
yet. Adoption across luxfi/lattice, luxfi/fhe, luxfi/chains/evm/cevm, and the GPU
kernel paths is staged in subsequent PRs. The type-system PR ships the
types alone — no call-site rewrites are in scope here. Per the project
philosophy: forward-only, no compatibility shims.

## Reference implementation

- `lux/lattice/types/` — `domain.go`, `ntt_context.go`, `reduction.go`, `errors.go`.
- `lux/fhe/types/` — `scheme.go`, `ciphertext_header.go`, `artifact.go`.
- `luxcpp/lattice/include/lux/lattice/types/` — `domain.hpp`, `reduction.hpp`.
- `luxcpp/fhe/include/lux/fhe/types/` — `ciphertext_header.hpp`, `artifact.hpp`.
- Tests: `lux/lattice/types/*_test.go`, `lux/fhe/types/*_test.go`,
  `luxcpp/lattice/test/types_test.cpp`, `luxcpp/fhe/test/types/types_test.cpp`.

## References

- LP-013 — FHE on GPU (F-Chain compute fabric)
- LP-029 — NTT Transform
- LP-066 — TFHE
- LP-132 — QuasarGPU Execution Adapter
- LP-127 — Attestation
- VeloFHE: GPU-Accelerated Lazy-Reduction CKKS, 2024
- CAT: GPU FHE Compiler with Domain-Aware IR, 2025
- PR #121 — Metal NTT vs Go Ring.NTT domain mismatch (the bug this LP prevents)

## Copyright

Copyright (c) 2026, Lux Industries Inc. SPDX-License-Identifier: BSD-3-Clause.
