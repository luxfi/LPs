---
lp: 009
title: GPU-Native EVM Execution
tags: [evm, gpu, metal, cuda, webgpu, parallel, block-stm, fibers, page-faults, cevm]
description: GPU-accelerated EVM with bytecode fiber VM, Block-STM parallel execution, and async cold-state page faults
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Execution
created: 2025-01-15
updated: 2025-12-15
requires:
  - chain: C
references:
  - lp-010 (QuasarSTM / Block-STM 3.0)
  - lp-012 (Post-Quantum Crypto Acceleration)
  - lp-132 (QuasarGPU Execution Adapter)
  - lp-9010 (DEX Precompile)
supersedes:
  - lp-009-v1 (GPU-Native EVM Execution, 2025-01-15..2025-11-30)
---

# LP-009: GPU-Native EVM Execution

## Abstract

This LP defines the **GPU-native EVM** (`cevm`) for Lux Network: a
C++ EVM, forked from evmone, that executes the full bytecode interpreter
on GPU as a per-tx **fiber VM**, with Block-STM parallel scheduling
(LP-010) and async cold-state page faults. Production backends ship for
Apple Metal (M1/M2/M3 silicon), NVIDIA CUDA, and Dawn/WebGPU.

The previous v1 LP described a 60-opcode switch-dispatch path with
12× CPU speedup on a synthetic loop benchmark. This v2 update
documents the **fiber VM** that landed in the QuasarGPU substrate
(LP-132): 118 opcodes, suspend-on-cold-state, MVCC integration with
Block-STM, and the wave-tick scheduler that lets every consensus mode
(Nova linear / Nebula DAG) share one execution adapter.

## Architecture

### Two execution surfaces

CEVM ships **two** GPU-native execution surfaces today:

1. **Wave-dispatch one-shot** (LP-009 § One-Shot Wave) — one Metal/CUDA
   dispatch per wave, one workgroup per tx, simple opcode coverage.
   Used by the standalone `evm-bench-kernel` and `evm-test-pipeline`
   binaries. Proven model: 32K-tx waves complete in 1 ms on M1 Max.

2. **QuasarGPU wave-tick scheduler** (LP-132) — bounded scheduler
   kernel with 12 service rings. Includes the EVM fiber VM in
   `drain_exec`, Block-STM in `drain_validate` / `drain_repair`, async
   page faults via `StateRequest`/`StateResp`, and per-lane Quasar
   cert verification. **This is the production execution path for
   Quasar-certified rounds.**

The fiber VM is the headline new piece. It runs the full per-tx
interpreter on GPU with proper suspend/resume semantics so EVM
contracts can issue cold SLOAD/SSTORE without stalling the wave.

### Fiber VM model

```cpp
struct FiberSlot {
    uint32_t tx_index, pc, sp, status;
    uint64_t gas;
    uint32_t rw_count, incarnation;
    uint32_t pending_key_lo_lo, pending_key_lo_hi;   // SLOAD suspend slot
    uint32_t pending_key_hi_lo, pending_key_hi_hi;
    uint32_t msize;                                  // memory size
    RWSetEntry rw[8];
    uint64_t  stack[64 * 4];          // 64 entries × 4 limbs (256-bit)
    uint8_t   memory[1024];           // per-fiber scratch
    uint32_t  blob_offset, blob_size; // bytecode pointer (host-shared MTLBuffer)
};
```

Fiber state machine:

| State | Meaning |
|---|---|
| `0` (Ready) | not yet executing |
| `1` (Running) | currently in `drain_exec` |
| `2` (WaitingState) | suspended on cold-state SLOAD |
| `3` (Committable) | exec done, awaiting Block-STM validate |
| `4` (Reverted) | EVM REVERT or runtime fault |

A single fiber occupies ~3.4 KB; 4096 fibers fit in ~13.9 MB device
memory.

### 256-bit arithmetic in MSL/CUDA

```cpp
struct U256 { ulong v[4]; };  // little-endian limbs
```

Implemented:

- `add`/`sub` with carry propagation across limbs
- `mul` — 4×4 schoolbook multiply (16 partial products)
- `div`/`mod`/`sdiv`/`smod` — bit-at-a-time (256 iterations) for
  correctness; specialized fast paths for divisor < 2^64
- `shl`/`shr`/`sar` — limb-level shift + bit shift, sign-extending SAR
- `eq`/`lt`/`gt`/`slt`/`sgt`/`iszero` — straight comparisons
- bitwise AND/OR/XOR/NOT/BYTE — per-limb

Tests confirm exact match against the CPU reference on EIP-150 vectors.

### Opcode coverage (118 ops, current as of Quasar 3.0 launch / 2025-12-15)

| Class | Opcodes |
|---|---|
| Arithmetic | ADD, SUB, MUL, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD, EXP, NOT, AND, OR, XOR, BYTE, SHL, SHR, SAR |
| Comparison | LT, GT, SLT, SGT, EQ, ISZERO |
| Stack | PUSH0..PUSH32, POP, DUP1..DUP16, SWAP1..SWAP16 |
| Memory | MLOAD, MSTORE, MSTORE8, MSIZE |
| Storage | **SLOAD** (cold-miss suspend), **SSTORE** (MVCC write) |
| Control | JUMP, JUMPI, JUMPDEST, PC, GAS |
| Env | ADDRESS, CALLER, ORIGIN, CALLVALUE, CALLDATALOAD, CALLDATASIZE, CALLDATACOPY, CHAINID, GASLIMIT, NUMBER, TIMESTAMP |
| Hash | KECCAK256 (inline keccak-f[1600]) |
| Halt | STOP, RETURN, REVERT, INVALID |

**Deferred to v0.40+** (with documented fallthrough returning Error):
CALL family, CREATE/CREATE2, LOGn, EXTCODE*, RETURNDATA*, TLOAD/TSTORE,
MCOPY, BLOBHASH/BLOBBASEFEE, SIGNEXTEND, BASEFEE, COINBASE, BLOCKHASH,
SELFBALANCE.

### Gas accounting

Per-opcode gas costs (Berlin-ish):

| Opcode | Gas |
|---|---|
| Default arithmetic / compare / stack / env | 3 |
| MLOAD / MSTORE / MSTORE8 | 3 |
| KECCAK256 | 30 + 6/word |
| SLOAD | 100 (warm), 2100 (cold — pre-suspend) |
| SSTORE | 5000 baseline |
| JUMPDEST | 1 |
| Floor (per-tx receipt) | 21000 |

Memory-expansion gas is tracked in v0.40 (currently a fixed budget at
`kFiberMemoryBytes`).

### SLOAD cold-miss suspend/resume protocol

```
on SLOAD slot=k:
    look up MvccSlot for k
    if slot empty (key_lo == 0 && key_hi == 0):
        // cold miss
        set fiber.status = WaitingState
        pack k into fiber.pending_key_*
        push StateRequest{tx_index, k} onto StateRequest ring
        leave fiber.pc at the SLOAD opcode (resume re-runs)
        return out of drain_exec for this fiber

on host StatePage arrival:
    drain_state_resp claims the MvccSlot for k, sets last_writer_tx |= 0x80000000
    re-injects the fiber into Crypto/Exec
    resume sees status==WaitingState; advances to next instr after SLOAD
    next SLOAD finds slot warm, proceeds normally
```

The high bit of `last_writer_tx` is the "loaded" sentinel —
distinguishes never-loaded from legitimately-loaded-zero. See LP-132 §
async page faults.

### Block-STM integration (LP-010)

`drain_exec` populates each fiber's `RWSetEntry rw[8]` with read+write
versions for every storage / memory / state access. `drain_validate`
walks the RW set and compares observed versions against current MVCC
versions; mismatch → conflict → repair queue with bumped incarnation.

Measured behavior on contention: **16 same-key txs → 120 conflicts →
120 repairs → 16 commits** (textbook Block-STM).

## Backends

| Backend | Platform | Status | File |
|---|---|---|---|
| Apple Metal | macOS/iOS (M1/M2/M3) | **Production** | `cevm/lib/consensus/quasar/gpu/quasar_wave.metal` |
| NVIDIA CUDA | Linux/Windows (CC ≥ 8.0) | **Production** | `cevm/lib/consensus/quasar/gpu/quasar_wave.cu` |
| WebGPU/Dawn | cross-platform | Ready (legacy one-shot path) | `cevm/lib/evm/gpu/kernel/evm_kernel.metal` (Dawn shim TODO) |

Runtime dispatcher: `QuasarGPUEngine::create()` selects Metal on
`__APPLE__`, CUDA on `EVM_CUDA`, else returns nullptr (LP-132).

## Benchmarks

### v1 baseline (synthetic loop)

10K transactions × 5K loop iterations (550M opcodes), retained as a
sanity benchmark:

| Backend | M ops / sec | Speedup vs CPU |
|---|---|---|
| C++ CPU | 193 | 1.0× |
| Metal GPU (one-shot) | 2,303 | 12.1× |

Gas match: byte-identical CPU vs GPU.

### v2 wave-tick scheduler (production path)

End-to-end stress on `quasar-gpu-engine-test` (Apple M1 Max):

| Workload | Throughput / latency |
|---|---|
| 1024 disjoint-key txs | 8 wave ticks, ~150 ms (~6,800 tx/s end-to-end including roots + cert checks) |
| 16 same-key contending txs | 120 conflicts + 120 repairs, all commit |
| 64 fast-path + 16 cold-state txs | host page-fault round trip works, slot finalizes |
| Determinism | byte-identical roots across two engine instances |

(End-to-end TPS includes: ingress + decode + admission + EVM exec +
Block-STM validate + commit + receipt keccak chain + cert verify +
quorum aggregation. Pure-execution micro-benchmarks are higher; these
numbers are honest end-to-end.)

### Throughput claim ladder (LP-132 §Scaling)

| Tier | Workload | Plausible throughput |
|---|---|---|
| 1 — events/sec | order placements, cancels, intents | 1 B aggregate, lane-isolated |
| 2 — state transitions/sec | precompile/EVM lane-local effects | 100 M cluster scale |
| 3 — finalized settlement/sec | certified roots with full audit | 1–10 M |

Pitch: **billion-event throughput, EVM-settled, Quasar-certified**. Not
1 B EVM TPS on a single shared state machine — that's bounded by
contention and data availability, not GPU compute.

## Security

- **16 findings** across 3 Red review rounds (v1) — all fixed.
- **Fiber stack overflow**: bounded by `kFiberStackDepth=64` × 4 limbs
  in v0.39; reverts to status=Error if exceeded.
- **Memory expansion**: bounded by `kFiberMemoryBytes=1024` in v0.39;
  larger expansion deferred to v0.40 with proper gas accounting.
- **MVCC arena exhaustion**: open-addressing with `kDefaultMvccSlots=
  8192` slots; full arena returns `kMvccInvalidIdx` and the tx faults
  cleanly (no infinite probe loop).
- **No CPU compute on the round path** — the host is doorbell + I/O
  only (LP-132 §Forbidden Patterns).

## CEVM ↔ QuasarGPU relationship

```
┌───────────────────────────────────────────────────────┐
│  cevm: Ethereum-compatible EVM (forked from evmone)   │
│                                                       │
│   cevm/lib/evm/                  the EVM core         │
│     vm.cpp, baseline_*.cpp, advanced_*.cpp            │
│                                                       │
│   cevm/lib/evm/gpu/             one-shot wave path    │
│     evm_kernel.metal                                  │
│     evm_kernel.cu                                     │
│     kernel/                                           │
│                                                       │
│   cevm/lib/consensus/quasar/gpu/                      │
│     ┌───────────────────────────────────────────┐     │
│     │  QuasarGPU wave-tick scheduler (LP-132)   │     │
│     │    quasar_wave.metal / .cu                │     │
│     │    drain_exec  ← runs the fiber VM        │     │
│     │    drain_validate / drain_repair          │     │
│     │    drain_cert_lane / drain_state_resp     │     │
│     └───────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
```

LP-009 covers the EVM proper. LP-132 covers the wave-tick adapter that
embeds the EVM fiber VM into Quasar consensus rounds. LP-010 covers the
Block-STM scheduling fabric the EVM fibers run under.

## Implementation Plan

| Version | Theme |
|---|---|
| v1.0 (LP-009 v1) | one-shot wave dispatch, 60+ opcodes, 12× speedup |
| v0.36 (subsume) | fiber VM substrate (FiberSlot type, suspend/resume scaffolding) |
| **v0.39 (this LP)** | full EVM fiber VM in `drain_exec`, 118 opcodes, SLOAD cold-miss |
| **v0.40** | CALL family, CREATE/CREATE2, LOGn, memory-expansion gas, SSTORE journaling |
| v0.41 | CUDA backend mirror complete (LP-132) |
| v0.42 | TLOAD/TSTORE, MCOPY, RETURNDATA*, full Cancun coverage |
| v0.43 | EIP-2929 cold/warm gas accounting in fiber path |
| v0.44+ | precompile family (LP-9010 DEX precompile via Quasar substrate) |

## References

| Resource | Location |
|---|---|
| EVM core | `cevm/lib/evm/` |
| QuasarGPU substrate | `cevm/lib/consensus/quasar/gpu/` |
| Tests | `cevm/test/unittests/quasar_gpu_engine_test.mm` (13/13 PASS as of v0.39) |
| LP-010 | QuasarSTM — Block-STM 3.0 |
| LP-020 | Quasar Consensus 3.0 |
| LP-132 | QuasarGPU Execution Adapter |
| LP-9010 | DEX Precompile (consumes the fiber VM) |

## Changelog

- **2025-01-15** — v1.0 LP-009 (one-shot wave dispatch, 60+ opcodes)
- **2025-11-30** — minor edits
- **2025-12-15** — **v2 final spec for Quasar 3.0 launch**: fiber VM
  (118 opcodes), suspend/resume, Block-STM integration, QuasarGPU
  adapter cross-reference (Quasar 3.0 ships 2025-12-25)

## Copyright

Copyright (C) 2025, Lux Partners Limited. All rights reserved.
