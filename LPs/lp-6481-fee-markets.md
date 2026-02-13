---
lp: 6481
title: LuxDA Fee Markets
description: LuxDA Fee Markets specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the fee markets for LuxDA Bus services: header inclusion, blob dispersal, storage, and retrieval.

## Motivation

This specification formalizes the component design, ensuring consistent implementation across the LuxDA ecosystem.

## Specification

### 1. Fee Components

| Service | Unit | Base Fee |
|---------|------|----------|
| Header Inclusion | per header | 0.001 LUX |
| Blob Dispersal | per KB | 0.0001 LUX |
| Blob Retrieval | per KB | 0.00005 LUX |
| Long-term Storage | per KB/day | 0.00001 LUX |
| Query | per query | 0.0001 LUX |

### 2. Fee Proof Types

```go
type FeeProof struct {
    Type      FeeProofType
    Data      []byte
}

type FeeProofType uint8
const (
    FeeProofPrepaid     FeeProofType = 1  // Pre-purchased quota
    FeeProofOnChain     FeeProofType = 2  // On-chain payment
    FeeProofChannel     FeeProofType = 3  // Payment channel voucher
    FeeProofStake       FeeProofType = 4  // Stake-proportional free tier
)
```

### 3. Dynamic Pricing

EIP-1559-style mechanism:

```go
type FeeMarket struct {
    BaseFee       *big.Int
    TargetUsage   float64  // 50% utilization target
    MaxChange     float64  // 12.5% max change per block
}

func (fm *FeeMarket) UpdateBaseFee(actualUsage float64) {
    if actualUsage > fm.TargetUsage {
        delta := min((actualUsage - fm.TargetUsage) / fm.TargetUsage, fm.MaxChange)
        fm.BaseFee = fm.BaseFee * (1 + delta)
    } else {
        delta := min((fm.TargetUsage - actualUsage) / fm.TargetUsage, fm.MaxChange)
        fm.BaseFee = fm.BaseFee * (1 - delta)
    }
}
```

### 4. Fee Distribution

```
Header Fee:    70% Validator, 20% Treasury, 10% Burn
DA Fee:        80% DA Operators, 10% Treasury, 10% Burn
Retrieval:     90% Provider, 10% Treasury
Storage:       90% Provider, 10% Treasury
```

---

*LP-6481 v1.0.0 - 2026-01-02*

## Rationale

The design follows established patterns in the LuxDA architecture, prioritizing simplicity, security, and interoperability.

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

## Security Considerations

Implementations must validate all inputs, enforce access controls, and follow the security guidelines established in the LuxDA Bus specification.
