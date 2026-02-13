---
lp: 6495
title: LuxDA Cross-Chain Namespace Conventions
description: LuxDA Cross-Chain Namespace Conventions specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines namespace conventions for Lux ecosystem chains.

## Motivation

This specification formalizes the component design, ensuring consistent implementation across the LuxDA ecosystem.

## Specification

### 1. Reserved Namespace Prefixes

| Prefix | Chain | Purpose |
|--------|-------|---------|
| `0x00` | System | Protocol namespaces |
| `0x01` | C-Chain | EVM application namespaces |
| `0x02` | Zoo | Zoo chain namespaces |
| `0x03` | SPC | SPC chain namespaces |
| `0x04` | Hanzo | Hanzo chain namespaces |
| `0x05-0x0F` | Reserved | Future chains |

### 2. Application Namespace Format

```
namespace = chainPrefix || appId || salt
```

Example:
- C-Chain DEX: `0x01` || `dex.uniswap.v1` || random
- Zoo NFT: `0x02` || `nft.marketplace` || random

### 3. Cross-Chain References

```go
type CrossChainRef struct {
    SourceChain  ChainID
    SourceNs     [20]byte
    SourceSeq    uint64
    TargetChain  ChainID
}
```

---

*LP-6495 v1.0.0 - 2026-01-02*

## Rationale

The design follows established patterns in the LuxDA architecture, prioritizing simplicity, security, and interoperability.

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

Implementations must validate all inputs, enforce access controls, and follow the security guidelines established in the LuxDA Bus specification.
