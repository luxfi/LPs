---
lp: 137-parallel-execution
title: Parallel Execution Decomposition — 9-Chain BlockSTM/GPU Audit
tags: [lux, parallel, block-stm, quasar-stm, gpu, mvcc, conflict-spec, decomposition, p-chain, c-chain, x-chain, q-chain, z-chain, a-chain, b-chain, m-chain, f-chain]
description: Per-chain audit of BlockSTM coverage, parallelism granularity, and GPU dispatch points across the 9-chain Lux topology
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Execution
created: 2026-04-28
updated: 2026-04-28
requires:
  - lp-010 (QuasarSTM 3.0 — execution fabric)
  - lp-132 (QuasarGPU Execution Adapter — wave-tick services)
  - lp-134 (Lux Chain Topology — 9-chain set)
  - lp-135 (QuasarSTM 4.0 — production spec)
  - lp-137 (GPU-Native Crypto Stack — 29 algorithms)
references:
  - lp-009 (GPU-Native EVM)
  - lp-013 (FHE on GPU / F-Chain)
  - lp-019 (Threshold MPC)
  - lp-063 (Z-Chain)
  - lp-076 (Universal Threshold Framework)
---

# LP-137-PARALLEL-EXECUTION

## Abstract

This LP audits the parallel-execution decomposition of every Lux chain.
For each of the nine chains in LP-134 we record (a) whether the
QuasarSTM (Block-STM 3.0) ordered MVCC fabric is in the hot path, (b)
the parallelism granularity, (c) the conflict-detection mechanism, and
(d) the GPU dispatch points wired through the QuasarGPU substrate
service ring (LP-132). The aim is to verify the substrate-residency
invariant from LP-137 — no chain-local hot path leaves attested GPU
memory in production — across all nine chains in one place.

This is a survey LP. It does not redesign anything. It reads the code
that already exists in `luxcpp/cevm` and the per-VM repos (`platformvm`,
`xvm`, `aivm`, `bridgevm`, `mpcvm`, `fhe`, plus the cert-lane verifiers
under `cevm/lib/consensus/quasar/gpu/`) and writes down what is wired,
what is partial, and what is CPU-only by design.

## 1. The substrate

QuasarGPU (LP-132) routes every chain through the same wave-tick service
ring. The ring header is one `enum class ServiceId : uint32_t` with 17
slots (file: `cevm/lib/consensus/quasar/gpu/quasar_gpu_layout.hpp:41`).
Slots 0..11 are the substrate proper:

| ID | Service | Function |
|---|---|---|
| 0  | Ingress      | host tx blobs → Decode |
| 1  | Decode       | sender recovery |
| 2  | Crypto       | sig admission |
| 3  | DagReady     | MVCC ready set (Nebula) |
| 4  | Exec         | EVM fiber VM |
| 5  | Validate     | **Block-STM read-set check** |
| 6  | Repair       | re-execute conflicting txs |
| 7  | Commit       | commit + receipt keccak |
| 8  | StateRequest | GPU → host page faults |
| 9  | StateResp    | host → GPU page replies |
| 10 | Vote         | BLS / ML-DSA / Pulsar batch verify |
| 11 | QuorumOut    | QC emission |

Slots 12..16 are per-chain transition fans:

| ID | Slot | Carries |
|---|---|---|
| 12 | PlatformVMTransition | `pchain_validator_root` |
| 13 | XVMTransition        | `xchain_execution_root` |
| 14 | AIVMTransition       | `achain_state_root` |
| 15 | BridgeVMTransition   | `bchain_state_root` |
| 16 | MPCVMTransition      | `mchain_state_root` |

C/Q/Z/F do not need transition slots because their roots already exist
in the round descriptor (`parent_block_hash`, `qchain_ceremony_root`,
`zchain_vk_root`, `fchain_state_root`).

The Block-STM scheduler proper is in
`cevm/lib/evm/gpu/scheduler.{hpp,cpp}` (115 LOC) plus
`cevm/lib/evm/gpu/parallel_engine.{hpp,cpp}` (204 LOC). The GPU port
lives at `cevm/lib/evm/gpu/cuda/block_stm.{cu,_host.{hpp,cpp}}` and
`cevm/lib/evm/gpu/metal/block_stm.metal`. ConflictSpec ABI lives in
`cevm/lib/evm/stm/conflict_spec.hpp` (LP-090 v0.50).

## 2. 9-chain matrix

| Chain | VM | Block-STM | Parallelism granularity | Conflict detection | Reducer / commit | GPU dispatch |
|---|---|---|---|---|---|---|
| **P-Chain** | PVM | No (linear, low-fanout) | per-tx, single producer | none — staking ops are serially ordered | drain_commit emits `pchain_validator_root` | `platformvm_*.{cu,metal,wgsl}` (staking, slashing, validator-set, transition). BLS sig batch via `quasar_bls_verifier.cpp`. |
| **C-Chain** | EVM (cevm) | **Yes** | per-tx with ConflictSpec pre-placement | EIP-2930 access list > ABI selector > historical > precompile > learned > declared (six-source priority, 32-byte POD spec) | three-tier validation (read-set / write-set / semantic reducer) → drain_commit | `drain_exec` (EVM fiber VM, LP-009). Precompiles: ecrecover (cuda+metal), bls12-381 (cuda+metal), point_eval (metal), dex_match (metal), keccak (cuda+metal). modexp/blake2f/sha256/ripemd160/bn256 currently CPU-only. |
| **X-Chain** | XVM | Partial — UTXO conflict graph, no MVCC re-exec | per-utxo (membership-proof level) | UTXO double-spend = static; no read-set tracking | `xchain_execution_root` via XVMTransition slot | `xvm_utxo.{cu,metal,wgsl}`, `xvm_membership.*`, `xvm_asset.*`, `xvm_roots.*`. |
| **Q-Chain** | QVM | No (cert lane is non-MVCC) | per-share batch verify | Pulsar signer-set sigma-protocol; conflict = invalid share | `drain_cert_lane` via `quasar_ringtail_verifier.cpp` | `crypto/ringtail/gpu/metal/ringtail_{verify,sign,ops}.metal`. Lattice ops in `crypto/lattice` (NTT, ring). |
| **Z-Chain** | ZVM | No (cert lane) | per-proof batch verify | Groth16 pairing equation | `drain_cert_lane` via `quasar_groth16_verifier.cpp` (uses `vk_root` from round descriptor) | `crypto/bn254/gpu/metal/bn254.metal` for pairings; `crypto/kzg`, `crypto/ipa`, `crypto/banderwagon` for adjacent rollup proofs. |
| **A-Chain** | AIVM | Partial — attestations are append-only with light dedup | per-attestation; one-pass verify | TEE-quote uniqueness + replay window | `drain_attest` → `achain_state_root` via AIVMTransition | `aivm_attestation.{cu,metal,wgsl}`, `aivm_anchor.*`, `ai_precompile_metal.mm`. Composite attestation parsers in `crypto/attestation`. |
| **B-Chain** | BVM | Partial — bridge messages are independent unless fanout-merged (Nebula) | per-message; Nebula DAG when high-fanout | inbox replay-protection; signatures verified in batch | `drain_bridge` → `bchain_state_root` via BridgeVMTransition | `bridgevm_bls.cpp`, `bridgevm_liquidity.cu`, `bridgevm_kernels_common.{cuh,metal,wgsl}`. |
| **M-Chain** | MVM (Threshold-MPC) | No (ceremony pipeline; rounds are causally ordered) | per-share within a round; rounds serial | round-ID + signer-set bitmap | `drain_cert_lane` then transition → `mchain_state_root` | `mpcvm_cggmp21.{cu,metal,wgsl}`, `mpcvm_frost.*`, `mpcvm_ceremony.*`. CGGMP21/FROST kernels in `crypto/{cggmp21,frost}/gpu`. |
| **F-Chain** | FVM (Threshold-FHE) | No (computation graph, deterministic) | per-ciphertext op; graph-parallel | DAG of FHE ops; no read-write conflict (RLWE is monotonic) | `drain_fhe` → `fchain_state_root` field | OpenFHE-derived `fhe/src/{binfhe,core,pke}/`, NTT in `crypto/ntt`, lattice in `luxcpp/lattice`. MLX/Metal poly-mul kernels per `BENCHMARKS_METAL_NTT.txt`. |

## 3. Decomposition graph (per-chain serial unit)

```
P-Chain:   tx        →  validator-set delta        →  pchain_validator_root
C-Chain:   tx        →  ConflictSpec lane          →  Block-STM (Exec → Validate → Repair → Commit)
                                                        │ inside Exec: per-fiber EVM
                                                        │ inside Validate: per-read-set check
X-Chain:   utxo      →  membership proof           →  xchain_execution_root
Q-Chain:   share     →  Pulsar aggregate         →  qchain_ceremony_root
Z-Chain:   proof     →  Groth16 pairing            →  zchain_vk_root
A-Chain:   quote     →  attestation parser         →  achain_state_root
B-Chain:   message   →  inbox replay + BLS verify  →  bchain_state_root
M-Chain:   share     →  round aggregate            →  mchain_state_root
F-Chain:   op-node   →  RLWE / NTT                 →  fchain_state_root
```

The smallest serial-execution unit is bolded above. Everything below it
is parallelizable. The C-Chain is the only chain with full Block-STM
read-set MVCC. The other eight chains have **trivial conflict
structures** (UTXO double-spend, ceremony-round ordering, FHE op-graph
DAG, attestation append) so the heavyweight 3-tier validation pipe is
not the right tool — a single conflict check per item is enough.

## 4. GPU dispatch points (the actual hot ops)

| Op | Used by | CPU canonical | GPU backends |
|---|---|---|---|
| secp256k1 ecrecover | C, B (sometimes) | `crypto/secp256k1/cpp` | `crypto/secp256k1/gpu/{cuda,metal,wgsl}` + `cevm/.../precompiles/ecrecover_{cuda,metal}` |
| keccak256 | every chain (txhash, state-root, receipt-root) | `crypto/keccak/cpp` | `crypto/keccak/gpu/{cuda,metal,wgsl}` + `cevm/.../cuda/keccak256.cu`, `cevm/.../metal/keccak256.metal` |
| blake2b | sub-protocols (Verkle, X-Chain, A-Chain) | `crypto/blake2b/cpp` | `crypto/blake2b/gpu/{cuda,metal,wgsl}` |
| bn254 pairing | Z-Chain Groth16 | `crypto/bn254/cpp` | `crypto/bn254/gpu/metal/bn254.metal` (cuda/wgsl present) |
| BLS12-381 | C-Chain precompile, P-Chain validator BLS, B-Chain | `crypto/bls/cpp` | `cevm/.../precompiles/bls12_381_{cuda,metal}` |
| KZG / point_eval | EIP-4844 blob, Verkle | `crypto/kzg/cpp` | `cevm/.../precompiles/point_eval_metal.mm` (cuda absent — TODO) |
| IPA / Banderwagon / Pedersen | Verkle, ZK | `crypto/{ipa,banderwagon,pedersen}/cpp` | per-alg `gpu/{cuda,metal,wgsl}` |
| Pulsar | Q-Chain consensus | `crypto/ringtail/cpu` | `crypto/ringtail/gpu/metal/ringtail_*.metal` |
| Groth16 | Z-Chain | `quasar_groth16_verifier.cpp` | dispatches into bn254 GPU |
| ML-DSA | Z-Chain (192-byte proof), A-Chain | `crypto/mldsa/cpp` | `crypto/mldsa/gpu/{cuda,metal,wgsl}` |
| FHE / NTT | F-Chain | `fhe/src` (OpenFHE-derived) + `crypto/ntt/cpp` | `fhe/build_mlx`, `crypto/ntt/gpu`, `luxcpp/lattice` |
| CGGMP21 / FROST | M-Chain | `crypto/{cggmp21,frost}/c-abi` | `crypto/{cggmp21,frost}/gpu` |

Threshold sigs on M-Chain are network-bound (round-trip share exchange);
the GPU role there is batch-verify, not serial wall-clock reduction.

## 5. Substrate-residency check

| Chain | Hot path on GPU? | Cold-state reach-back? | Verdict |
|---|---|---|---|
| P-Chain   | yes (transition kernel) | epoch boundary only | OK |
| C-Chain   | yes (Block-STM end-to-end) | StateRequest service ring (suspend/resume EVM fiber) | OK — fiber suspends, never CPU-side reads |
| X-Chain   | yes (utxo + membership kernels) | UTXO-set page service | OK |
| Q-Chain   | yes (Pulsar verifier) | none | OK |
| Z-Chain   | yes (Groth16 verifier) | VK arena host-resident, mapped once at genesis | OK — VK is read-only host-mapped, not a hot reach-back |
| A-Chain   | yes (attestation kernels) | quote replay window in DocDB | partial — replay-window store is host-side |
| B-Chain   | yes (BLS verify, inbox) | inbox state cold-paged | OK |
| M-Chain   | yes (CGGMP21/FROST kernels) | round transcript host-mapped | partial — transcript writes go through host journal |
| F-Chain   | yes (NTT/binfhe/poly-mul) | key-share material in HSM | OK — key shares never leave attested memory |

No violations. Two **partial** entries (A-Chain replay-window, M-Chain
round-transcript) are by design — those stores are append-only and
larger than GPU residency budgets. Both go through the StateRequest
service so the GPU never blocks on them in the hot loop.

## 6. Smallest parallel streams

| Op | Batch granularity | Memory residency |
|---|---|---|
| ecrecover | per block (whole txbatch in one dispatch) | tx envelopes → GPU once per block |
| keccak256 (txhash) | per tx; merged into Decode service | inline in service ring |
| keccak256 (state-root, receipts-root) | per block; runs in drain_commit | inline |
| BLS verify (votes) | per quorum window; batched via Vote service | inline |
| Pulsar verify | per ceremony round; one dispatch per round | inline |
| Groth16 verify | per proof; small batch (≤16 typical) | VK host-mapped, proofs inline |
| FHE NTT | per polynomial; often 4096-wide vector | resident |
| CGGMP21 / FROST share verify | per signer-set; one dispatch per round | resident |

Block-STM execution itself is per-tx with `MAX_INCARNATIONS=16`,
`MAX_READS_PER_TX=64`, `MAX_WRITES_PER_TX=64`, hash-table size 65536
slots (`cevm/lib/evm/gpu/cuda/block_stm.cu:42-50`). One GPU thread per
worker, dispatch shape identical to Metal.

## 7. Findings

1. C-Chain is the only chain that needs and uses full Block-STM 3.0 with
   six-source ConflictSpec. The other chains have lower-arity conflict
   structures and use simpler pipelines (UTXO double-spend, ceremony
   round ordering, FHE op-graph DAG, append-only attestations).
2. Every chain has a CUDA + Metal + WGSL kernel triple for its hot ops.
   The triple is enforced by the byte-equality test in LP-137 (one CPU
   canonical, three byte-equal GPU backends).
3. Two non-hot reach-backs exist (A-Chain replay-window, M-Chain
   round-transcript). Both go through the StateRequest service so the
   GPU hot loop is non-blocking.
4. Two precompile gaps on C-Chain: `point_eval` lacks a CUDA backend
   (Metal only) and `modexp`/`blake2f`/`sha256`/`ripemd160`/`bn256` are
   currently CPU-only. None of these are common-path; bn256 is legacy
   (the production pairing is bn254). They are low-priority.
5. No substrate-residency invariant violations.

## 8. References (with file paths)

- BlockSTM scheduler: `luxcpp/cevm/lib/evm/gpu/scheduler.hpp:24`,
  `scheduler.cpp:1`
- Parallel engine: `luxcpp/cevm/lib/evm/gpu/parallel_engine.hpp:32`,
  `parallel_engine.cpp:1`
- MV memory: `luxcpp/cevm/lib/evm/gpu/mv_memory.hpp:1`
- ConflictSpec ABI: `luxcpp/cevm/lib/evm/stm/conflict_spec.hpp:1`
- CUDA BlockSTM kernel: `luxcpp/cevm/lib/evm/gpu/cuda/block_stm.cu:1`
- Metal BlockSTM kernel: `luxcpp/cevm/lib/evm/gpu/metal/block_stm.metal:1`
- Service ring (drain_*): `luxcpp/cevm/lib/consensus/quasar/gpu/quasar_wave.metal:642..2342`
- Service IDs: `luxcpp/cevm/lib/consensus/quasar/gpu/quasar_gpu_layout.hpp:41`
- Groth16 verifier (Z-Chain): `luxcpp/cevm/lib/consensus/quasar/gpu/quasar_groth16_verifier.{hpp,cpp}`
- Pulsar verifier (Q-Chain): `luxcpp/cevm/lib/consensus/quasar/gpu/quasar_ringtail_verifier.{hpp,cpp}`
- BLS verifier: `luxcpp/cevm/lib/consensus/quasar/gpu/quasar_bls_verifier.{hpp,cpp}`
- Per-chain VMs: `luxcpp/{platformvm,xvm,aivm,bridgevm,mpcvm,fhe}/src`
- C-Chain precompile dispatch: `luxcpp/cevm/lib/evm/gpu/precompiles/precompile_dispatch.hpp:1`
- Crypto primitives: `luxcpp/crypto/{secp256k1,keccak,blake2b,bn254,kzg,ipa,banderwagon,pedersen,ringtail,bls,mldsa,cggmp21,frost,ntt}/{cpp,gpu/{cuda,metal,wgsl}}`
