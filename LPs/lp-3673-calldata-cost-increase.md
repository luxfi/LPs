---
lp: 3673
title: Calldata Cost Increase (EIP-7623)
description: Increase calldata gas cost to incentivize blob usage
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Informational
category: Core
created: 2025-01-23
tags: [core, gas, research]
order: 1015
---

# LP-3673: Calldata Cost Increase

## Abstract

This LP documents EIP-7623 which increases calldata gas costs to incentivize rollups to use blob transactions (EIP-4844) instead of calldata for data availability.

## Motivation

Post-EIP-4844, rollups should use blobs:
- Blobs are cheaper for DA
- Calldata competes with execution
- Current costs don't incentivize migration

Increasing calldata cost:
- Makes blobs economically preferred
- Frees execution gas for transactions
- Improves L1 scalability

## Specification

```python
# Current
CALLDATA_ZERO_BYTE_GAS = 4
CALLDATA_NONZERO_BYTE_GAS = 16

# Proposed (EIP-7623)
CALLDATA_ZERO_BYTE_GAS = 12      # 3x increase
CALLDATA_NONZERO_BYTE_GAS = 48   # 3x increase
```

## Lux Considerations

For Lux Network:
- C-Chain rollup ecosystem impact
- Bridge calldata costs
- Warp message encoding

## Research Status

This LP documents EIP-7623 for evaluation. Implementation priority: **Research**

Evaluate post-blob adoption on Lux.

## References

- [EIP-7623: Increase Calldata Cost](https://eips.ethereum.org/EIPS/eip-7623)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
