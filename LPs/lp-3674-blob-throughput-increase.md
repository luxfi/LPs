---
lp: 3674
title: Blob Throughput Increase (EIP-7691)
description: Increase target and max blobs per block for higher DA throughput
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Informational
category: Core
created: 2025-01-23
tags: [core, scaling, research]
order: 1020
---

# LP-3674: Blob Throughput Increase

## Abstract

This LP documents EIP-7691 which increases blob limits per block, enabling higher data availability throughput for rollups.

## Motivation

Current blob limits (EIP-4844):
- Target: 3 blobs/block
- Max: 6 blobs/block
- ~375 KB/block average

Increased limits needed for:
- Growing rollup DA demand
- Lower rollup transaction costs
- Scalability headroom

## Specification

```python
# EIP-4844 (current)
TARGET_BLOB_GAS_PER_BLOCK = 393216   # 3 blobs
MAX_BLOB_GAS_PER_BLOCK = 786432      # 6 blobs

# EIP-7691 (proposed)
TARGET_BLOB_GAS_PER_BLOCK = 786432   # 6 blobs (2x)
MAX_BLOB_GAS_PER_BLOCK = 1572864     # 12 blobs (2x)
```

## Lux Considerations

For Lux Network:
- L2 framework blob support
- Cross-chain DA requirements
- Network bandwidth impact

## Research Status

This LP documents EIP-7691 for evaluation. Implementation priority: **Research**

Evaluate after blob adoption on Lux.

## References

- [EIP-7691: Blob Throughput Increase](https://eips.ethereum.org/EIPS/eip-7691)
- [LP-8500: Layer 2 Rollup Framework](./lp-4500-layer-2-rollup-framework.md)

```
