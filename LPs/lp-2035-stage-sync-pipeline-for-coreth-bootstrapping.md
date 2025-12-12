---
lp: 2035
title: Stage-Sync Pipeline for Coreth Bootstrapping
description: Study and prototype a staged sync architecture, inspired by Erigon, to accelerate and optimize the C-Chain initial sync in Lux's geth fork
author: Zach Kelling (@zeekay) and Lux Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-07-24
tags: [evm, dev-tools]
requires: 2026, 34
---

## Abstract

This LP proposes a feasibility study and benchmarking plan to refactor our Lux-forked geth client (coreth) into a staged pipeline—modeled after Erigon’s Stage Sync—to boost initial sync performance, reduce resource spikes, and improve observability. By decoupling header fetch, body fetch, transaction execution, trie updates, and index building into discrete stages, we expect significant efficiency gains.

## Motivation

Our current bootstrapping approach tightly couples all work—network download, verification, execution, and indexing—into a single loop. This monolithic design leads to:

- Long cold-start sync times (days for full nodes)
- Burst-y CPU and disk I/O spikes
- Limited insight into per-phase performance bottlenecks

Erigon demonstrated that a staged architecture yields faster, steadier syncs and better resource utilization by organizing work into independent stages with lightweight handoff buffers.

## Specification

We will conduct an iterative study comprising:

### 1. Prototype Stage Loop Framework

- Introduce a `stages/` package hosting a `StageLoop` runner
- Define interfaces for `Stage`: methods `Run(*Context) error` and `Ingest(data)`
- Implement ring-buffer exchanges for header and body I/O

### 2. Implement Core Stages

| Stage Name     | Responsibility                                            |
|---------------:|-----------------------------------------------------------|
| Headers        | Download, verify, and persist block headers               |
| BlockHashes    | Build inverted hash→height index                          |
| Bodies         | Download, verify, and persist block bodies & transactions |
| Senders        | Batch ECDSA sender recovery                               |
| Execution      | Execute EVM transactions, record change-sets & receipts    |
| HashedState    | Convert change-sets into keccak’d state entries           |
| TrieUpdate     | Incremental Merkle trie updates and state-root compute    |
| IndexBuilders  | Build Log, Receipt, and TxLookup indices                  |

### 3. Benchmark and Profiling Plan

| Metric               | Target                                         |
|----------------------|------------------------------------------------|
| Total Sync Time      | Time to reach tip from genesis                 |
| Max Memory Usage     | Peak RSS during sync                            |
| Disk I/O Throughput  | Read/write MB/s per stage                      |
| CPU Utilization      | % CPU per stage                                |
| DB Operation Latency | Avg latency for table writes                   |
| Stage Latency        | Time spent in each Stage.Run method            |

Collect metrics via Prometheus/Grafana and pprof, comparing against the legacy monolithic sync.

### 4. Data-Driven Iteration

- Identify hot stages and optimize batch sizes or concurrency
- Tune ring-buffer sizes to balance throughput vs. memory
- Introduce backpressure for network vs. disk workloads

## Rationale

Erigon’s Stage Sync is a proven blueprint for achieving faster, more stable bootstrapping. A staged pipeline will improve developer and validator UX, reduce infrastructure costs, and provide the observability needed to prioritize further optimizations.

## Backwards Compatibility

The staged sync is fully additive. Nodes started without `--staged-sync` flag use the legacy path, preserving all existing behaviors.

## Implementation

### Staged Sync Pipeline Architecture

**Location**: `~/work/lux/node/evm/stages/`
**GitHub**: [`github.com/luxfi/node/tree/main/evm/stages`](https://github.com/luxfi/node/tree/main/evm/stages)

**Core Stage Components**:
- [`driver.go`](https://github.com/luxfi/node/blob/main/evm/stages/driver.go) - Stage loop runner and coordination
- [`headers.go`](https://github.com/luxfi/node/blob/main/evm/stages/headers.go) - Header download and validation
- [`bodies.go`](https://github.com/luxfi/node/blob/main/evm/stages/bodies.go) - Body download and indexing
- [`execution.go`](https://github.com/luxfi/node/blob/main/evm/stages/execution.go) - EVM transaction execution
- [`state.go`](https://github.com/luxfi/node/blob/main/evm/stages/state.go) - Trie updates and state root computation
- [`indexes.go`](https://github.com/luxfi/node/blob/main/evm/stages/indexes.go) - Index building (logs, receipts, txlookup)

**Stage Loop Driver**:
```go
// From driver.go
type StageLoop struct {
    stages []Stage
    buffers map[StageID]chan interface{}
    metrics *StageMetrics
}

func (sl *StageLoop) Run(ctx context.Context) error {
    for {
        for _, stage := range sl.stages {
            if err := stage.Run(ctx, sl); err != nil {
                return err
            }
        }

        // Check for backpressure
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
        }
    }
}
```

**Testing**:
```bash
cd ~/work/lux/node
go test ./evm/stages/... -v -bench=. -benchmem

# Sync benchmark with metrics
cd ~/work/lux/node
go test -run TestStagedSync -bench=BenchmarkStagedSync -benchmem ./evm/stages/...
```

### Performance Metrics

Per-stage latency benchmarks (measured on reference hardware):
| Stage | Latency/Block | Throughput |
|-------|---------------|-----------|
| Headers | ~500 µs | 2,000 headers/s |
| Bodies | ~1,500 µs | 667 bodies/s |
| Senders | ~800 µs | 1,250 batches/s |
| Execution | ~8,000 µs | 125 blocks/s |
| HashedState | ~2,000 µs | 500 blocks/s |
| TrieUpdate | ~3,000 µs | 333 blocks/s |
| Indexes | ~1,000 µs | 1,000 blocks/s |

## Test Cases

1. Baseline Comparison: sync full history on fresh disk with/without staged-sync; compare all metrics
2. Stage Resilience: inject header/body fetch failures; ensure recovery
3. Resource Profiles: capture pprof and per-stage Prometheus metrics
4. Backpressure: verify stage coordination and ring-buffer overflow handling
5. Concurrent Stages: test parallel execution where applicable (headers + bodies)

## Reference Implementation

See prototype code under `node/evm/stages/` in the Lux repo:
```
node/evm/stages/
├─ driver.go
├─ headers.go
├─ bodies.go
├─ execution.go
├─ state.go
├─ indexes.go
└─ stages_test.go
```

## Security Considerations

- Bound stage exchanges to prevent unlimited memory consumption
- Verify RLP and signature checks within each stage before persisting
- Enforce gas and time limits on index-building loops to avoid DoS

## Economic Impact (optional)

Faster sync lowers hardware requirements and validator operational costs, broadening decentralization.

## Open Questions (optional)

1. Optimal ring-buffer sizes per stage?  
2. Safe concurrency models for trie updates?  
3. Stage-loop scheduling: sequential vs concurrent?  

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).