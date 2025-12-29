---
lp: 036
title: Graph VM
tags: [graph, g-chain, graphql, indexing, subgraph, vm]
description: G-chain GraphQL indexing VM for on-chain data queries
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2021-03-01
requires:
  - lps-021 (Warp Messaging)
references:
  - lp-7200 (Graph Chain Specification)
---

# LP-036: Graph VM

## Abstract

The Graph VM runs the G-chain, a purpose-built chain for indexing and querying on-chain data across all Lux chains. Developers deploy subgraph manifests as G-chain transactions. The VM indexes events from source chains (received via Warp messages), builds queryable data stores, and exposes GraphQL endpoints. The G-chain is the native indexing layer -- no external indexing infrastructure required.

## Specification

### Subgraph Deployment

A subgraph manifest is deployed as a G-chain transaction:

```
SubgraphManifest {
    name            string
    version         string
    sourceChainIDs  [][32]byte   // chains to index
    dataSources     []DataSource
    schema          string       // GraphQL SDL schema
    mappings        []byte       // WASM mapping handlers (AssemblyScript compiled)
}

DataSource {
    chainID     [32]byte
    address     address         // contract address to watch
    startBlock  uint64
    eventABI    []byte          // ABI of events to index
}
```

### Indexing Pipeline

1. **Event ingestion**: Warp messages from source chains deliver event logs to the G-chain
2. **Mapping execution**: WASM handlers process events and produce entity updates
3. **Storage**: entities are stored in the G-chain's native key-value store
4. **Query**: GraphQL queries are resolved against the entity store

The VM executes WASM handlers in a sandboxed environment with metered gas. Handlers can read entity state but not make external calls.

### Query Interface

Each subgraph exposes a GraphQL endpoint:

```
POST /ext/bc/{gchain-blockchain-id}/subgraphs/name/{subgraph-name}/graphql
{
    "query": "{ tokens(first: 10, orderBy: totalSupply) { id name totalSupply } }"
}
```

Queries are read-only and do not consume gas. Query rate limiting is enforced per client IP.

### Cross-Chain Indexing

The G-chain indexes all Lux chains simultaneously:

- C-chain EVM events (Transfer, Swap, etc.)
- Subnet chain events (Zoo, Hanzo, SPC, Pars)
- P-chain staking events
- X-chain asset operations

Source chain events are delivered via Warp messages with guaranteed ordering per source chain.

### Subgraph Governance

- **Deployment fee**: 10 LUX per subgraph deployment (prevents spam)
- **Curation**: users can stake LUX on subgraphs they find useful, earning query fee share
- **Deprecation**: subgraph owners can deprecate, stopping indexing and freeing resources

## Security Considerations

1. **WASM sandboxing**: mapping handlers run in a metered WASM VM with no host access. Infinite loops are terminated by gas limits.
2. **Query DoS**: complex queries are bounded by a query complexity limit (max 1000 entity fetches per query).
3. **Data integrity**: indexed data is derived deterministically from source chain events. Any G-chain validator can verify by re-executing mappings.

## Reference

| Resource | Location |
|---|---|
| Graph VM | `github.com/luxfi/node/vms/graphvm/` |
| WASM runtime | `github.com/luxfi/node/vms/graphvm/wasm/` |
| Warp event delivery | LP-021 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
