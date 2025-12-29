---
lps: 009
title: GPU-Native EVM Execution
tags: [evm, gpu, metal, cuda, webgpu, parallel, block-stm, cevm]
description: GPU-accelerated EVM interpreter with Block-STM parallel execution
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Execution
created: 2025-01-15
updated: 2026-04-06
requires:
  - chain: C
references:
  - lp-9010 (DEX Precompile)
  - lps-010 (Block-STM Parallel Execution)
  - lps-012 (Post-Quantum Crypto Acceleration)
---

# LPS-009: GPU-Native EVM Execution

## Abstract

This specification defines the GPU-native EVM implementation (`cevm`) for Lux Network. The C++ EVM, forked from evmone, executes 60+ EVM opcodes on Metal/CUDA/WebGPU compute shaders. Measured throughput: 2.3 billion opcodes/second on Apple M1 Max (12x faster than CPU). Gas accounting verified identical between GPU and CPU paths.

## Specification

### Architecture

- `cevm` binary speaks ZAP VM protocol natively (Lux subnet plugin)
- Switch-based opcode dispatch (compiler jump table)
- Compact 256-entry stack (lower register pressure = higher GPU occupancy)
- Persistent GPU state hash table (MTLResourceStorageModeShared)
- Block-STM parallel execution with GPU-native MvMemory

### Backends

| Backend | Platform | Status |
|---------|----------|--------|
| Metal | macOS/iOS (Apple Silicon) | Production |
| CUDA | Linux/Windows (NVIDIA) | Ready |
| WebGPU/Dawn | Cross-platform | Ready |

### Benchmarks

10k transactions × 5k loop iterations (550M opcodes):
- C++ CPU: 193 M ops/sec
- Metal GPU: 2,303 M ops/sec (12.1x speedup)
- Gas match: PASS (byte-identical)

### Security

16 findings across 3 Red review rounds. All fixed.
