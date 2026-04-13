---
lp: 128
title: On-Chain GraphQL Query
tags: [evm, precompile, graphql, query, g-chain, indexing]
description: On-chain GraphQL query interface to the G-Chain unified query layer
author: Lux Core Team
status: Final
type: Standards Track
category: Infrastructure
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-036 (Graph VM)
---

# LP-128: On-Chain GraphQL Query

## Abstract

Implements an on-chain GraphQL query precompile that enables any EVM contract to execute GraphQL queries against the G-Chain unified query layer. Contracts can read indexed blockchain state, cross-chain data, and oracle feeds without off-chain infrastructure. Includes a result cache, subscription registration, cache management, and index hinting.

## Specification

### Addresses

| Address | Function |
|---------|----------|
| `0x0500000000000000000000000000000000000010` | GraphQL query execution |
| `0x0500000000000000000000000000000000000011` | Subscription registration |
| `0x0500000000000000000000000000000000000012` | Cache management |
| `0x0500000000000000000000000000000000000013` | Index hints |

### Interface

**Query (0x...0010):**
```
Input:  query_len(2) + query(UTF-8) + variables_len(2) + variables(JSON)
Output: result(JSON bytes)
```

**Subscribe (0x...0011):**
```
Input:  subscription query + callback address + callback selector
Output: subscription_id(32)
```

**Cache (0x...0012):**
```
Input:  op(1) + cache_key(32)
  0x01: Get cached result
  0x02: Invalidate cache entry
  0x03: Set TTL
```

### Gas Schedule

Gas costs scale with query complexity (estimated from the query AST):

| Component | Gas |
|-----------|-----|
| Base query | 5,000 |
| Per field | 100 |
| Per filter/where clause | 500 |
| Per join/relation | 1,000 |
| Cache hit | 500 |
| Subscription registration | 10,000 |

### Security Considerations

1. Query complexity is bounded: maximum depth, field count, and result size are enforced to prevent denial-of-service.
2. Cross-chain queries return data at the latest finalized block height -- no unconfirmed data.
3. Cache entries have TTLs and can be invalidated. Stale data risk is managed by the contract.
4. The G-Chain client connection is local to the node. No external network calls during EVM execution.

## References

- GraphQL Foundation, [GraphQL Specification](https://spec.graphql.org/)
- Source: `github.com/luxfi/precompile/graph/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
