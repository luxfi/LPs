---
lp: 010
title: Block-STM Parallel Transaction Execution
tags: [parallel, block-stm, mvmemory, scheduler, optimistic-concurrency]
description: Optimistic parallel execution of EVM transactions using Block-STM
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Execution
created: 2025-03-01
updated: 2026-04-06
requires:
  - lps-009 (GPU-Native EVM)
---

# LP-010: Block-STM Parallel Transaction Execution

## Abstract

Block-STM (Software Transactional Memory) enables parallel execution of EVM transactions within a block. Multiple worker threads execute transactions optimistically, detect read-write conflicts via multi-version memory, and re-execute only conflicting transactions. Implemented in both Go (evmgpu) and C++ (cevm) with GPU-native MvMemory using Metal atomics.

## Specification

### Components

- **MvMemory**: Multi-version data structure. Per-location version chains indexed by (tx_index, incarnation). GPU implementation uses atomic CAS for concurrent updates.
- **Scheduler**: Collaborative task assignment. Workers grab execute/validate tasks from atomic counters. Conflicts trigger cascading invalidation.
- **ParallelHost**: EVMC Host adapter that intercepts storage reads/writes through MvMemory.

### GPU Block-STM

The entire Block-STM loop runs on GPU without CPU intervention:
1. Workers grab tasks from atomic `execution_idx` / `validation_idx`
2. Execute via GPU EVM kernel with MvMemory for state access
3. Validate read-sets against current versions
4. Re-execute on conflict (increment incarnation)
5. Complete when all transactions validated

### Implementations

| Implementation | Language | GPU Support |
|---------------|----------|-------------|
| evmgpu | Go | Via CGo bridge to cevm |
| cevm | C++ | Native Metal/CUDA |
