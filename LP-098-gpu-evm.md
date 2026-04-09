---
lp: 098
title: GPU-Accelerated EVM Execution (cevm)
tags: [gpu, evm, cevm, cuda, metal, webgpu, execution]
description: cevm GPU-accelerated EVM interpreter for parallel transaction execution
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Infrastructure
created: 2025-01-01
references:
  - lps-009 (GPU-Native EVM)
  - lps-010 (Block-STM Parallel Execution)
  - lps-011 (GPU Crypto Acceleration)
---

# LP-098: GPU-Accelerated EVM Execution (cevm)

## Abstract

Defines the cevm (C++ EVM) GPU-accelerated execution engine. cevm is a high-performance EVM interpreter that offloads opcode execution to GPU compute shaders via Metal (Apple), CUDA (NVIDIA), and WebGPU (cross-platform). Combined with Block-STM parallel transaction scheduling (LP-010), cevm achieves 2.3 billion opcodes/second on a single GPU, enabling Lux to process 100,000+ TPS on subnet chains.

## Specification

### Architecture

```
Block -> Block-STM Scheduler -> cevm GPU Executor
           |                       |-- Metal compute shaders
           |                       |-- CUDA kernels
           |                       |-- WebGPU dispatch
           |-- MvMemory (multi-version memory for conflict detection)
           |-- Validation (re-execute conflicting txs)
```

### GPU Execution Model

Each transaction is a GPU thread group:
- Thread group size: 256 threads (one per opcode in pipeline).
- Each thread executes one opcode, passing stack state to the next.
- GPU shared memory holds the EVM stack (256 entries, 32 bytes each).
- State trie access uses GPU-mapped shared memory (MTLResourceStorageModeShared on Metal).

### Supported Opcodes (GPU Path)

60+ opcodes execute on GPU. Remaining opcodes (CALL, CREATE, SSTORE) fall back to CPU for state access:

| Category | GPU Opcodes |
|----------|-------------|
| Arithmetic | ADD, SUB, MUL, DIV, MOD, EXP, ADDMOD, MULMOD |
| Comparison | LT, GT, SLT, SGT, EQ, ISZERO |
| Bitwise | AND, OR, XOR, NOT, SHL, SHR, SAR, BYTE |
| Stack | POP, PUSH1-32, DUP1-16, SWAP1-16 |
| Memory | MLOAD, MSTORE, MSTORE8, MSIZE |
| Flow | JUMP, JUMPI, PC, JUMPDEST |
| Hash | SHA3 (GPU-accelerated Keccak) |

### Benchmarks

10,000 transactions, 5,000 loop iterations each (550M total opcodes):

| Backend | Throughput | Speedup |
|---------|-----------|---------|
| geth interpreter | 45 M ops/sec | 1.0x |
| cevm CPU (C++) | 193 M ops/sec | 4.3x |
| cevm Metal (M1 Max) | 2,303 M ops/sec | 51.2x |
| cevm CUDA (A100) | 3,100 M ops/sec | 68.9x |

### Gas Compatibility

Gas accounting is identical between CPU and GPU paths. The GPU execution is an optimization -- it does not change the EVM semantics. A transaction that costs X gas on CPU costs X gas on GPU.

## Security Considerations

1. GPU execution results must match CPU execution bit-for-bit. The test suite validates gas and state root equivalence.
2. GPU memory isolation: each transaction's stack and memory are isolated. No cross-transaction data leakage.
3. Floating-point is not used. All EVM operations are integer arithmetic, avoiding GPU floating-point precision issues.
4. Fallback to CPU is transparent. If the GPU is unavailable, cevm runs entirely on CPU with no behavioral change.

## Reference

| Resource | Location |
|----------|----------|
| cevm source | `github.com/luxfi/cevm/` |
| Metal shaders | `github.com/luxfi/cevm/gpu/metal/` |
| CUDA kernels | `github.com/luxfi/cevm/gpu/cuda/` |
| Block-STM | LP-010 |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
