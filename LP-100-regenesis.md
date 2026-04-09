---
lp: 100
title: Chain Migration and Regenesis Framework
tags: [regenesis, migration, chain, state, upgrade, genesis]
description: Framework for chain state migration and regenesis operations
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Infrastructure
created: 2025-11-01
references:
  - lps-099 (Protocol Specification)
  - lps-083 (Token Economics)
---

# LP-100: Chain Migration and Regenesis Framework

## Abstract

Defines the framework for chain migration and regenesis operations on Lux Network. Regenesis creates a new genesis block from the state of an existing chain at a specified block height, producing a clean chain with full state continuity but no historical block data. This is used for chain upgrades that require breaking changes, state tree compaction, and disaster recovery.

## Specification

### Regenesis Process

```
1. Announce regenesis at block height H (governance proposal, 30-day notice)
2. At height H, all validators halt block production
3. Export state trie at height H: accounts, balances, code, storage
4. Generate new genesis.json from exported state
5. Validators initialize new chain from new genesis
6. New chain starts at block 0 with state identical to old chain at height H
7. Old chain is archived (read-only) for historical queries
```

### State Export

The state export tool extracts:

| Component | Format |
|-----------|--------|
| Account balances | address -> balance mapping |
| Contract code | address -> bytecode mapping |
| Contract storage | address -> (slot -> value) mapping |
| Validator set | P-Chain validator snapshot |
| Subnet configurations | Subnet -> VM mapping |

### Genesis Generation

```go
type RegenesisConfig struct {
    SourceChainRPC  string    // RPC endpoint of source chain
    ExportHeight    uint64    // Block height to export
    NetworkID       uint32    // Target network ID
    ChainID         uint64    // Target chain ID
    Timestamp       uint64    // New genesis timestamp
    GasLimit        uint64    // Initial gas limit
}
```

The tool reads state at ExportHeight and produces a genesis.json compatible with Lux node initialization.

### Migration Types

| Type | Description | State Preserved |
|------|-------------|----------------|
| Full regenesis | New chain from state snapshot | Balances, code, storage |
| Partial regenesis | Migrate specific contracts only | Selected state |
| Cross-chain migration | Move state from one chain to another | Balances + selected contracts |
| Compaction | Same chain, pruned state trie | Active accounts only (remove dust) |

### Dust Threshold

During compaction regenesis, accounts below the dust threshold are excluded:

| Asset | Dust Threshold |
|-------|---------------|
| LUX | 0.001 LUX |
| ERC-20 tokens | $0.01 equivalent |
| Empty contracts (no code, no balance) | Removed |

### Archive Node

The old chain state is preserved on archive nodes for historical queries. Archive nodes serve read-only RPC for block heights 0 through H.

## Security Considerations

1. Regenesis requires 100% validator coordination. A single validator running the old chain creates a fork.
2. The 30-day notice period allows users and services to prepare for the migration.
3. State export must be verified independently by multiple validators. Hash of exported state must match.
4. Contract addresses are preserved. No user action required -- wallets, contracts, and integrations continue working at the same addresses.
5. Historical transaction proofs (Merkle proofs against old blocks) become invalid after regenesis. Archive nodes maintain the old proof chain.

## Reference

| Resource | Location |
|----------|----------|
| Regenesis tool | `github.com/luxfi/node/tools/regenesis/` |
| State exporter | `github.com/luxfi/node/tools/stateexport/` |
| Genesis generator | `github.com/luxfi/genesis/` |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
