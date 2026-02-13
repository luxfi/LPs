---
lp: 6480
title: LuxDA Operator Roles
description: LuxDA Operator Roles specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines the operator roles and commitment requirements for the LuxDA Bus ecosystem. Operators choose which services to provide and stake accordingly.

## Specification

### 1. Operator Roles

| Role | Responsibilities | Min Stake |
|------|-----------------|-----------|
| Header Validator | Consensus, header ordering | 100K LUX |
| DA Operator | Blob storage, availability | 50K LUX |
| Store Provider | Long-term storage, queries | 25K LUX |
| Index Provider | Query indexing, search | 10K LUX |
| Relay Node | Message propagation | 5K LUX |
| TFHE Committee | Threshold decryption | 50K LUX |

### 2. Role Registration

```go
type OperatorRegistration struct {
    OperatorID    Identity
    Roles         []RoleType
    Stake         *big.Int
    Endpoints     []string
    Capacity      RoleCapacity
    Commission    uint16  // Basis points
}

type RoleCapacity struct {
    StorageGB     uint64
    BandwidthMbps uint64
    ComputeUnits  uint64
}
```

### 3. Commitment Requirements

Each role has service level requirements:

```go
type ServiceCommitment struct {
    Role           RoleType
    Uptime         float64  // 99.9% typical
    Latency        uint32   // Max ms
    Availability   float64  // Data availability %
    ResponseRate   float64  // Request response %
}

var DefaultCommitments = map[RoleType]ServiceCommitment{
    RoleHeaderValidator: {Uptime: 0.999, Latency: 100},
    RoleDAOperator:      {Uptime: 0.999, Availability: 0.999},
    RoleStoreProvider:   {Uptime: 0.99, ResponseRate: 0.99},
}
```

### 4. Role Combinations

Operators can combine roles:

```
Full Node = Validator + DA + Store + Relay
DA Full   = DA + Store
Light     = Relay only
```

---

*LP-6480 v1.0.0 - 2026-01-02*

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

