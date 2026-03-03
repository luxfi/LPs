---
lp: 167
title: Lux FHE Runtime — Dual-Runtime FHE Stack (Go reference + C++/GPU production)
tags: [fhe, tfhe, gpu, cuda, hip, sycl, dual-runtime, kat, lattice, encrypted-execution, nebula-binding, quasar-binding]
description: Authoritative umbrella LP for the Lux FHE stack. Defines a dual-runtime split — Go for canonical semantics + chain integration; C++/GPU for production throughput — with cross-runtime KATs ensuring semantic equivalence and FHE result roots binding into Nebula/Quasar transcripts.
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2026-03-03
references:
  - LP-013 (FHE on GPU — F-Chain compute fabric, narrowly focused on TFHE GPU kernels and the drain_fhe service)
  - LP-066 (TFHE base library)
  - LP-105 (Lux Stack Lexicon — vocabulary)
  - LP-020 (Quasar Consensus)
  - LP-073 (Pulsar)
  - LP-103 (Lens)
  - LP-076 (Universal threshold framework)
  - LP-137 (FHE typing + threshold + performance LPs)
  - NIST IR 8214C (NIST Threshold Cryptography Project)
---

# LP-167: Lux FHE Runtime — Dual-Runtime FHE Stack

## Abstract

Lux FHE is a **dual-runtime fully homomorphic encryption stack**: a Go
reference runtime defines canonical semantics, KATs, and chain
integration, while a C++/GPU-native production runtime executes
high-throughput encrypted computation. The Go runtime defines the
semantics; the C++/GPU runtime realizes the throughput. Cross-runtime
KATs ensure semantic equivalence.

This LP is the **single source of truth for the FHE stack vocabulary**
and the **public package layout**. Where LP-013 ships the F-Chain
`drain_fhe` service and the 21 GPU TFHE kernels that run inside
QuasarGPU, this LP frames the broader **Lux FHE-Go ↔ Lux FHE-C++**
split and binds the result roots into Nebula/Quasar transcripts via
Horizon finality.

## Position relative to LP-013

LP-013 is a focused F-Chain GPU compute LP — kernel inventory, the
`drain_fhe` service inside QuasarGPU, and `fchain_fhe_root` cert lane
plumbing. LP-167 is the **dual-runtime umbrella**: it names the Go
reference runtime, the C++ production runtime, the cross-runtime KAT
contract, the parameter sets, and the binding into Quasar finality.
LP-013 remains authoritative for the F-Chain in-process kernel split;
LP-167 supersedes only the *naming* of "Lux FHE on GPU" so the dual-
runtime story is the canonical entry point.

If a developer reads exactly one FHE LP, they should read this one,
then jump to LP-013 for kernel-level F-Chain detail.

## Public stack — canonical names

| Lux name           | Role                                                                 |
|--------------------|----------------------------------------------------------------------|
| **Lux FHE-Go**     | Reference + integration runtime (correctness, readability, protocol parity, tests, wallet/daemon integration). |
| **Lux FHE-C++**    | Production acceleration runtime (GPU-native FHE execution, batching, bootstrapping). |
| **Lux FHE-CUDA**   | NVIDIA backend of Lux FHE-C++.                                       |
| **Lux FHE-HIP**    | AMD backend of Lux FHE-C++.                                          |
| **Lux FHE-SYCL**   | Portable accelerator backend (planned; ships when at least one backend other than CUDA/HIP needs it). |
| **Lux FHE-Core**   | Shared algorithm/spec layer — parameter sets, ciphertext format, key-format, transcript binding. |
| **Lux FHE-KAT**    | Cross-runtime test corpus regenerated from Go and replayed in C++ (and vice-versa). |
| **Lux FHEVM**      | Contract/runtime layer that exposes FHE primitives to EVM/WASM execution (LP-067 Confidential ERC-20 et al.). |
| **Nebula-FHE**     | DAG/GPU-native scheduler for encrypted computation. The `drain_fhe` service in QuasarGPU is the Nebula-FHE realisation of the F-Chain runtime; LP-013 §3 specifies the wave-tick co-residency. |

These names are normative. Lux specs, contracts, and operator docs
**must** use exactly these names. Internal nicknames (e.g. "the GPU
runtime", "the Go core") are non-normative shorthand.

### Architecture — repository layout

| Repository                                  | Role                                                              |
|---------------------------------------------|-------------------------------------------------------------------|
| `github.com/luxfi/fhe`                      | Go reference implementation. Authoritative semantics + KAT generators + wallet/daemon integration. |
| `github.com/luxfi/luxcpp/crypto/fhe`        | C++ production runtime. CPU fallback + CUDA/HIP/(SYCL) backends.  |
| `github.com/luxfi/fhe-coprocessor`          | Worker scheduling, job queue, encrypted result receipts. (Planned; ships v0.1.0-rc2-fhe-gpu.) |
| `github.com/luxfi/fhe-compiler`             | Encrypted circuit compiler (frontend → DAG of FHE gates). (Planned.) |
| `github.com/luxfi/consensus`                | Quasar / Nebula integration. FHE result commitments enter Quasar transcripts via `nebula_fhe_root` (alias for `fchain_fhe_root` from LP-013 in non-F-Chain deployments). |

Inside `github.com/luxfi/fhe` the public Go entry point is the
`fhe` package (canonical types: `Parameters`, `SecretKey`, `PublicKey`,
`Ciphertext`, `EvaluationKey`, `Encryptor`, `Decryptor`, `Evaluator`).
KAT generators live under `github.com/luxfi/fhe/scripts/regen-kats.sh`
and emit JSON corpora to `luxcpp/crypto/fhe/test/kat/`.

Inside `luxcpp/crypto/fhe` the public C++ surface lives under
`include/lux_fhe/` (opaque handles, no template-heavy generic types in
the ABI). The C ABI shim lives at `c-abi/c_lux_fhe.cpp` and is the only
surface Go cgo and Rust bindgen consume; downstream Rust crates do not
include C++ headers.

## Required claims for "GPU-native" credibility

These are normative acceptance criteria for any release that calls
itself a Lux FHE-C++ production runtime. Each is a binary claim with a
verifiable artifact.

1. **Format parity.** Lux FHE-C++ ciphertext format matches Lux FHE-Go
   byte-for-byte, *or* a canonical conversion (`lux_fhe_ct_from_go`,
   `lux_fhe_ct_to_go`) is shipped and exercised in the cross-runtime
   KAT. The conversion contract is documented in
   `luxcpp/crypto/fhe/README.md` §"Ciphertext format contract."

2. **Go → C++ KAT replay.** Lux FHE-Go-generated KATs replay
   bit-identically in Lux FHE-C++. Verified by
   `regen-kats.sh --verify` (Go side) plus the
   `lux_fhe_kat_replay_test` ctest target (C++ side).

3. **C++ → Go KAT verification.** Lux FHE-C++-generated KATs verify
   in Lux FHE-Go. Verified by the `TestLuxFHECppKATReplay` Go test
   under `github.com/luxfi/fhe/test`.

4. **GPU NTT benchmarked.** NTT kernels benchmarked on GPU
   (CUDA + HIP at minimum, SYCL when shipped). Reported in the
   benchmarks paper (`papers/lux-fhe-runtime/07-benchmarks.tex`)
   with hardware, runtime, parameter set, and median + p99 latency.
   Results published as JSON under `bench/results/lux-fhe-cpp/`.

5. **Bootstrap kernels benchmarked.** Bootstrapping or key-switching
   kernels benchmarked on GPU. Same reporting standard as (4).

6. **Deterministic serialization.** Both runtimes emit byte-equal
   serialized public keys, secret keys, evaluation keys, and
   ciphertexts when seeded with identical CSPRNG state. Verified by
   the cross-runtime KAT.

7. **Same parameter sets and security identifiers.** Lux FHE-Go and
   Lux FHE-C++ accept the same `ParameterSetID` strings — `PN10QP27`,
   `PN11QP54`, `PN9QP28_STD128` — and produce identical λ-bit security
   reports under the Albrecht estimator (cited in
   `proofs/fhe/parameter-security.tex`).

8. **CPU fallback exists.** Every Lux FHE-C++ release builds and runs
   on CPU-only hosts. GPU absence does not prevent correctness; it
   only loses throughput.

9. **GPU backend selected explicitly.** No Lux FHE-C++ entry point
   silently dispatches to GPU. Backend selection is explicit at
   handle-creation time:
   `lux_fhe_create_evaluator(backend = LUX_FHE_CPU |
   LUX_FHE_CUDA | LUX_FHE_HIP)`. A `LUX_FHE_AUTO` constant is
   reserved for a future release; until then, `AUTO` is rejected.

10. **FHE result roots bind into Nebula/Quasar transcripts.** Every
    finalized FHE evaluation contributes a 32-byte commitment to the
    epoch's `nebula_fhe_root` (alias for the F-Chain
    `fchain_fhe_root` from LP-013), which is bound into the
    QuasarRoundDescriptor. Proven in
    `proofs/fhe/nebula-binding.tex`.

A release that fails any of (1)–(10) is not a production runtime; it
is at most a CPU staging release.

## Cross-runtime KAT contract

The Lux FHE-KAT corpus pins the ciphertext format and the gate
semantics. Every entry has the following shape:

```
{
  "id":              "<test-name>",
  "param_set":       "PN10QP27",
  "seed":            "<32 hex bytes>",
  "operation":       "<gate or higher-level op>",
  "inputs":          [...plaintext bits...],
  "expected_ct":     "<base64 ciphertext>",
  "expected_decode": [...plaintext bits...]
}
```

The contract is:

- **Determinism.** With `seed` fixed, both runtimes emit
  `expected_ct` byte-equal.
- **Decryptability.** With `seed` and the corresponding secret key
  fixed, both runtimes decrypt `expected_ct` to `expected_decode`.
- **Evaluation parity.** Higher-level operations (encrypted ADD,
  encrypted MUL, encrypted comparison) produce byte-equal output
  ciphertexts under fixed seeds.

`scripts/regen-kats.sh` regenerates the corpus from Go; the C++
ctest target `lux_fhe_kat_replay_test` consumes it. The reverse
direction — C++ generates, Go verifies — is exercised by
`TestLuxFHECppKATReplay` under `github.com/luxfi/fhe/test`.

## Parameter sets

The dual runtime ships exactly three production parameter sets, named
identically in both runtimes:

| ParameterSetID | LWE dim N | Q                | Security target |
|----------------|-----------|------------------|-----------------|
| `PN10QP27`     | 1024      | 0x7fff801 (~2^27)| ~128-bit        |
| `PN11QP54`     | 2048      | 0x3FFFFFFFFED001 | ~128-bit, higher precision |
| `PN9QP28_STD128`| 512      | matches OpenFHE STD128_LMKCDEY | ~128-bit (apples-to-apples with OpenFHE) |

Concrete LWE security under the Albrecht estimator is reported in
`proofs/fhe/parameter-security.tex`. New parameter sets enter the
spec only after they appear in the corresponding Go source AND the
C++ source AND the KAT corpus.

## Binding into Quasar finality

Every Quasar round descriptor binds an FHE evaluation root:

```
nebula_fhe_root = H(
    bootstrap_key_root ||
    key_switch_key_root ||
    public_param_root ||
    active_circuit_dag_root ||
    finalized_evaluations_root
)
```

`bootstrap_key_root` and `key_switch_key_root` are produced by the
M-Chain MPC ceremony (LP-019, LP-076). `public_param_root` commits to
the ParameterSetID lineage. `active_circuit_dag_root` is the merkle
root of currently-installed FHE circuits. `finalized_evaluations_root`
accumulates the FHE evaluation receipts produced by Lux FHE-Go or Lux
FHE-C++ during the round.

A `HorizonCertificate` (LP-105) over a round whose descriptor cites
`nebula_fhe_root = R` certifies that all FHE results contributing to
`R` have been threshold-attested under the active KeyEra. This binding
is what gives Lux FHE its **post-quantum-rooted finality**: the
ciphertext computation is FHE; the finality of the result is Pulsar
+ ML-DSA + (optional) Beam.

In F-Chain deployments (LP-013), `nebula_fhe_root` and
`fchain_fhe_root` are the same field — LP-013 names it from inside
the F-Chain frame, LP-167 names it from outside.

## CPU fallback discipline

The CPU fallback is not a degraded mode — it is the **semantic
oracle**. Every C++ GPU kernel must produce byte-equal output to the
CPU implementation in this repository, which itself replays
byte-equal output of Lux FHE-Go. If a GPU backend deviates, the GPU
backend is wrong, not the CPU fallback.

## Status and roadmap

| Milestone        | Status     | Description                                                   |
|------------------|------------|---------------------------------------------------------------|
| Lux FHE-Go v1.7+ | Shipping   | Reference runtime, KAT generators, fhed daemon, contracts.   |
| Lux FHE-C++      | Shipping (v0.1.0)  | Production runtime — CPU oracle + CUDA backend (NTT + key-switch + bootstrap).  |
| Lux FHE-CUDA     | Shipping (v0.1.0)  | NTT, key-switch, and programmable-bootstrap kernels live in `luxcpp/crypto/fhe/cpp/backends/cuda/`. Backend selection: compile-time `LUX_FHE_BACKEND_CUDA=ON`, runtime `cudaGetDeviceCount() > 0`, env override `LUX_FHE_BACKEND={cpu,cuda}`. Byte-equal to the CPU oracle on every KAT entry. |
| Lux FHE-Metal    | Scaffolded (v0.1.0) | Build wired (`LUX_FHE_BACKEND_METAL`), API routed through CPU oracle on Apple Silicon today; production Metal kernels land in v0.2.0 reusing `luxcpp/crypto/ntt/gpu/metal/` (8 kernels). |
| Lux FHE-HIP      | Planned    | Mirror of CUDA, lands after CUDA bootstrap stabilises.        |
| Lux FHE-SYCL     | Reserved   | Names reserved; no shipping date — only ships when a backend other than CUDA/HIP needs it. |
| Nebula-FHE / `drain_fhe` | LP-013 v0.54 | F-Chain wave-tick integration.                          |
| `fhe-coprocessor` | Planned   | Worker scheduling + receipts (LP-167-supplement).             |
| `fhe-compiler`    | Planned   | Encrypted circuit compiler.                                   |

## Companion paper

`papers/lux-fhe-runtime/lux-fhe-runtime.tex` is the authoritative
dual-runtime positioning paper. Sections cover both runtimes,
cross-runtime katology, Nebula-FHE scheduling, Quasar finality
binding, GPU benchmarks, and security posture. Existing FHE papers
(`lux-fhe-api`, `lux-fhe-benchmarks`, `lux-fhe-mpc-hybrid`,
`lux-fhe-smart-contracts`, `lux-tfhe`, `threshold-fhe-compliance`)
remain authoritative for their respective topics; the runtime paper
cites them rather than duplicating their content.

## Companion proofs

| File                                              | Statement                                                                |
|---------------------------------------------------|--------------------------------------------------------------------------|
| `proofs/fhe/correctness.tex`                      | Encrypt → evaluate → decrypt correctness.                                 |
| `proofs/fhe/dual-runtime-equivalence.tex`         | Lux FHE-Go and Lux FHE-C++ produce byte-equal ciphertexts on identical inputs and parameters. |
| `proofs/fhe/nebula-binding.tex`                   | FHE result roots bind into Nebula/Quasar transcripts.                     |
| `proofs/fhe/parameter-security.tex`               | Concrete LWE parameter security under the Albrecht estimator.              |

## Security posture

- **No PQ rollback.** FHE security rests on LWE / RLWE; both are
  post-quantum-hard under current cryptanalysis. Lux does not weaken
  parameters for performance. The CPU fallback uses the same
  parameters as the GPU backends.
- **Key custody.** Decryption keys live behind threshold MPC (LP-019)
  in TEE-protected key holders (LP-065). The runtime does not
  decrypt; it only evaluates.
- **Side channels.** The C++ runtime runs FHE gates in constant time
  per bootstrap; SIMT divergence is bounded to ciphertext metadata,
  not plaintext bits.
- **Replay protection.** `nebula_fhe_root` binds every FHE result
  receipt to the exact circuit DAG and evaluation-key state of its
  epoch; cross-epoch replay is rejected by Prism (LP-105).

## Cross-references

| LP / paper                       | Owns                                                              |
|----------------------------------|-------------------------------------------------------------------|
| **LP-013**                       | F-Chain `drain_fhe` service, GPU TFHE kernel inventory.            |
| **LP-066**                       | TFHE base library (referenced by Lux FHE-Core).                   |
| **LP-105**                       | Lux stack lexicon — adopts the FHE names from this LP.            |
| **LP-137 (FHE perf/threshold/typing)** | FHE typing rules, threshold splits, performance contracts.   |
| **LP-067, LP-068**               | Confidential ERC-20 / Private Teleport — consumers of Lux FHE.    |
| **NIST IR 8214C**                | Threshold framing reference; Lux FHE keygen tracks NIST 8214C.    |

## Copyright

Copyright (C) 2026, Lux Industries Inc. All rights reserved.
SPDX-License-Identifier: BSD-3-Clause
