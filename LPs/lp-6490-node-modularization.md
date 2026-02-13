---
lp: 6490
title: LuxDA Node Modularization
description: LuxDA Node Modularization specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines how LuxDA Bus components are packaged into a single Lux node binary with configurable modules.

## Specification

### 1. Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Lux Node                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Header  │ │  Relay  │ │   DA    │ │  Store  │          │
│  │  Chain  │ │         │ │         │ │         │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Index  │ │  Chat   │ │  TFHE   │ │ Gateway │          │
│  │         │ │   SDK   │ │  Orch   │ │         │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    Core Runtime                             │
│  (P2P, Storage, Crypto, Config, Metrics)                   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Configuration Profiles

```yaml
# Full node profile
profile: full
modules:
  headerchain: true
  relay: true
  da: true
  store: true
  index: true
  chat: true
  tfhe: false
  gateway: true

# DA operator profile
profile: da-operator
modules:
  headerchain: false
  relay: true
  da: true
  store: true
  index: false
  chat: false
  tfhe: false
  gateway: true

# Messenger profile
profile: messenger
modules:
  headerchain: false
  relay: true
  da: false
  store: false
  index: false
  chat: true
  tfhe: false
  gateway: false
```

### 3. Module Interface

```go
type Module interface {
    Name() string
    Dependencies() []string
    Start(ctx context.Context, runtime *Runtime) error
    Stop() error
    Status() ModuleStatus
}

type Runtime struct {
    Config   *Config
    P2P      *P2PNetwork
    Storage  *StorageBackend
    Crypto   *CryptoProvider
    Metrics  *MetricsRegistry
}
```

### 4. Resource Requirements

| Profile | CPU | RAM | Storage | Bandwidth |
|---------|-----|-----|---------|-----------|
| Full | 4 cores | 16 GB | 500 GB | 100 Mbps |
| DA Operator | 2 cores | 8 GB | 2 TB | 1 Gbps |
| Messenger | 1 core | 2 GB | 10 GB | 10 Mbps |
| Validator | 8 cores | 32 GB | 1 TB | 1 Gbps |

---

*LP-6490 v1.0.0 - 2026-01-02*

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

