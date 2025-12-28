---
lp: 2967
title: LRC-1967 Proxy Storage Slots
description: LRC-1967 Proxy Storage Slots for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-01-23
tags: [lrc, token-standard, evm, proxy]
order: 630
---

## Abstract
LRC-1967 (mirrors ERC-1967) standardizes proxy storage slots for upgradeable contracts.

## Specification
Defines standard storage slots for implementation, admin, and beacon addresses.

## Motivation

This standard ensures compatibility with the broader EVM ecosystem while enabling Lux-specific optimizations.

## Rationale

Mirrors the corresponding Ethereum standard for maximum compatibility.

## Backwards Compatibility

Fully compatible with existing ERC implementations.

## Reference Implementation

**Repository**: [https://github.com/luxfi/standard](https://github.com/luxfi/standard)
**Local Path**: `/Users/z/work/lux/standard/`

### Contracts

| Contract | Description |
|----------|-------------|
| [`lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol) | OpenZeppelin ERC-1967 Proxy |
| [`lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Utils.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Utils.sol) | Proxy utilities |

### Build and Test

```bash
cd /Users/z/work/lux/standard

# Build all contracts
forge build

# Run tests
forge test -vvv

# Gas report
forge test --gas-report
```

## Security Considerations

Implementations should follow established security best practices for the corresponding ERC.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
