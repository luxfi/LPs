---
lps: 031
title: Exchange VM
tags: [exchange, x-chain, dag, avm, assets, utxo]
description: X-chain DAG-based asset exchange VM for high-throughput UTXO operations
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2019-06-01
requires:
  - lps-028 (Fast Probabilistic Consensus)
references:
  - lp-5200 (AVM Specification)
---

# LPS-031: Exchange VM

## Abstract

The Exchange VM (AVM) runs the X-chain, Lux's asset creation and exchange chain. Unlike the linear P-chain and C-chain, the X-chain uses a DAG (Directed Acyclic Graph) structure where transactions are vertices that reference parent vertices. Conflicting transactions are resolved via FPC (LPS-028). The DAG structure enables higher throughput by allowing non-conflicting transactions to be processed in parallel without block ordering.

## Specification

### DAG Structure

Each vertex contains:

```
Vertex {
    parentIDs   [][32]byte  // references to parent vertices (1-N)
    txs         []Tx        // transactions in this vertex
    height      uint64      // vertex height (max parent height + 1)
    epoch       uint64      // consensus epoch
}
```

Vertices form a DAG. A vertex is accepted when all its transactions are accepted and all parent vertices are accepted.

### Transaction Types

| Tx Type | Description |
|---|---|
| `CreateAssetTx` | Create a new asset with name, symbol, denomination, and initial UTXOs |
| `OperationTx` | Operate on NFTs and custom assets (mint, burn, transfer) |
| `BaseTx` | Transfer fungible assets between addresses |
| `ImportTx` | Import UTXOs from P-chain or C-chain |
| `ExportTx` | Export UTXOs to P-chain or C-chain |

### Asset Model

Assets on the X-chain are UTXO-based with flexible output types:

- **SECP256K1 Transfer Output**: standard fungible transfer (threshold-of-N)
- **SECP256K1 Mint Output**: minting authority for fungible assets
- **NFT Transfer Output**: non-fungible token transfer
- **NFT Mint Output**: minting authority for NFTs

Each asset has a unique 32-byte `assetID` (the hash of the `CreateAssetTx`).

### Conflict Resolution

When two transactions spend the same UTXO:

1. Both transactions enter the DAG as competing vertices
2. FPC (LPS-028) runs to decide which transaction is preferred
3. The losing transaction is rejected; its vertex is marked as abandoned
4. Dependent vertices of the abandoned vertex are also rejected

### Throughput

The DAG structure enables parallelism:

- Non-conflicting transactions are processed simultaneously
- No block time bottleneck -- vertices are issued as soon as transactions arrive
- Theoretical throughput: limited only by network bandwidth and UTXO set lookup speed
- Practical throughput: >4,500 TPS on the X-chain

## Security Considerations

1. **Double-spend prevention**: FPC guarantees that exactly one of two conflicting transactions is accepted, with finality in 300-800ms.
2. **DAG consistency**: a vertex is only accepted when all parents are accepted. This prevents orphan chains.
3. **Asset creation spam**: `CreateAssetTx` requires a transaction fee, preventing unbounded asset creation.

## Reference

| Resource | Location |
|---|---|
| AVM implementation | `github.com/luxfi/node/vms/avm/` |
| DAG consensus | `github.com/luxfi/node/snow/consensus/snowstorm/` |
| FPC protocol | LPS-028 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
