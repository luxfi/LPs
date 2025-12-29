---
lp: 097
title: Batch Call Aggregation
tags: [multicall, batch, aggregation, gas, efficiency]
description: Multicall contract for batching multiple contract calls into a single transaction
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Infrastructure
created: 2023-06-01
references:
  - lps-096 (Account Abstraction)
  - lps-090 (WLUX)
---

# LP-097: Batch Call Aggregation

## Abstract

Defines the Multicall3 contract for Lux Network. Multicall3 aggregates multiple contract calls into a single transaction, reducing gas overhead and enabling atomic read/write batches. Deployed at a deterministic address on all EVM chains.

## Specification

### Contract

```solidity
contract Multicall3 {
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory);
    function aggregate3Value(Call3Value[] calldata calls) external payable returns (Result[] memory);
}
```

### Deployment

Deterministic address via CREATE2 on all chains:

```
Address: 0xcA11bde05977b3631167028862bE2a173976CA11
```

### Modes

| Function | Description |
|----------|-------------|
| `aggregate3` | Batch calls, configurable failure handling per call |
| `aggregate3Value` | Same as above, with per-call ETH/LUX value |
| `getBlockNumber` | Return current block number |
| `getBlockHash` | Return block hash for given block number |
| `getCurrentBlockTimestamp` | Return current block timestamp |
| `getEthBalance` | Return LUX balance of address |

### Gas Savings

| Scenario | Without Multicall | With Multicall | Savings |
|----------|------------------|----------------|---------|
| 10 ERC-20 balanceOf | 10 * 21,000 = 210,000 | 21,000 + 10 * 2,600 = 47,000 | 78% |
| 5 swap approvals | 5 * 46,000 = 230,000 | 21,000 + 5 * 25,000 = 146,000 | 37% |
| 20 price reads | 20 * 21,000 = 420,000 | 21,000 + 20 * 2,600 = 73,000 | 83% |

### Integration

Multicall3 is used by:
- Frontend dApps for batched state reads (portfolio balances, prices).
- DEX routers for multi-hop swaps.
- Account abstraction (LP-096) for batched UserOperations.
- Indexers for efficient block data extraction.

## Security Considerations

1. Multicall3 is stateless and non-upgradeable. No admin keys, no storage.
2. `allowFailure: true` enables partial success. Callers must check individual Result.success.
3. Multicall3 executes calls with `address(this)` as msg.sender. It cannot impersonate the caller. Use delegatecall patterns in smart accounts for caller preservation.
4. Reentrancy between batched calls is possible. Callers must consider cross-call state dependencies.

## Reference

| Resource | Location |
|----------|----------|
| Multicall3 contract | `github.com/luxfi/standard/contracts/util/Multicall3.sol` |
| Multicall3 reference | https://multicall3.com |

## Copyright

Copyright (C) 2023-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
