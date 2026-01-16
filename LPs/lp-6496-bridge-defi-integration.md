---
lp: 6496
title: LuxDA Bridge/DeFi Integration
description: LuxDA Bridge/DeFi Integration specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines how bridges, teleport, and DeFi protocols integrate with LuxDA Bus.

## Specification

### 1. Intent Namespaces

DeFi intents are posted to dedicated namespaces:

```go
var IntentNamespaces = map[string][20]byte{
    "swap":    DeriveNamespace("lux.intent.swap.v1"),
    "bridge":  DeriveNamespace("lux.intent.bridge.v1"),
    "lend":    DeriveNamespace("lux.intent.lend.v1"),
}
```

### 2. Intent Format

```go
type DeFiIntent struct {
    Type        IntentType
    FromChain   ChainID
    ToChain     ChainID
    FromToken   TokenID
    ToToken     TokenID
    Amount      *big.Int
    MinReceive  *big.Int
    Deadline    uint64
    Recipient   Address
    Signature   []byte
}
```

### 3. Proof Posting

Bridges post proofs of execution:

```go
type ExecutionProof struct {
    IntentRef    [32]byte
    TxHash       [32]byte
    BlockHeight  uint64
    MerkleProof  []byte
}
```

### 4. Integration Adapters

```go
type BridgeAdapter interface {
    PostIntent(intent *DeFiIntent) error
    WatchIntents(filter IntentFilter) (<-chan *DeFiIntent, error)
    PostProof(proof *ExecutionProof) error
}
```

---

*LP-6496 v1.0.0 - 2026-01-02*
