---
lp: 7
title: Supply Chain Control
description: How Lux maintains complete control over its software dependencies through strategic forking and internal management
author: Lux Core Team
status: Implemented
type: Meta
created: 2025-12-21
tags: [network, core, security, supply-chain, dependencies, implementation]
order: 7
tier: core
requires: [5, 6]
---

# LP-0007: Supply Chain Control

## Abstract

This LP documents the implementation of Lux Network's supply chain control strategy as outlined in LP-4. It provides concrete metrics, package inventories, and verification procedures for maintaining dependency sovereignty.

## Motivation

LP-4 establishes *why* we fork dependencies. This document specifies *how* we implement and verify that control:
- Quantified metrics for binary size and module counts
- Complete inventory of internal packages
- Dependency hierarchy documentation
- Verification test cases

---

## Specification

### Dependency Hierarchy

```solidity
+---------------------------------------------------------------+
|                    LUX NODE BINARY (41 MB)                    |
+---------------------------------------------------------------+
|  LUXFI INTERNAL (30 packages)              [Full control]     |
|    - luxfi/node        Core validator                         |
|    - luxfi/geth        Streamlined EVM                        |
|    - luxfi/coreth      C-Chain integration                    |
|    - luxfi/consensus   BFT engine (no snow deps)              |
|    - luxfi/crypto      PQ-ready cryptography                  |
|    - luxfi/threshold   TSS/MPC protocols                      |
|    - luxfi/database    Pluggable backends                     |
|    - ... (22 more)                                            |
+---------------------------------------------------------------+
|  GOLANG STDLIB (curated)                   [Minimal surface]  |
|    - golang.org/x/sys                                         |
|    - golang.org/x/net                                         |
|    - golang.org/x/crypto                                      |
|    - google.golang.org/grpc                                   |
+---------------------------------------------------------------+
|  EXTERNAL (50 packages)                    [Audited, pinned]  |
|    - Zero database deps in default build                      |
+---------------------------------------------------------------+
```

---

## Binary & Build Metrics

### Size Comparison

| Metric | Lux | Avalanchego | Delta |
|--------|-----|-------------|-------|
| **Binary Size** | 41 MB | 88 MB | **-53%** |
| **Compiled Modules** | 147 | ~300 | **-51%** |
| **Module Graph Edges** | 23,653 | ~40,000+ | **-40%** |
| **Unique Modules** | 620 | ~1,000+ | **-38%** |
| **Build Time (cached)** | ~15s | ~45s | **-67%** |

### Dependency Counts

| Category | Count | Notes |
|----------|-------|-------|
| Direct Dependencies | 80 | Curated |
| Luxfi Internal | 30 | Fully controlled |
| Compiled into Binary | 147 | Minimal |
| Workspace Packages | 80 | Monorepo |

### Top External Dependencies

| Package | Import Count | Purpose |
|---------|--------------|---------|
| golang.org/x/sys | 887 | System calls |
| golang.org/x/net | 601 | Networking |
| golang.org/x/crypto | 419 | Cryptography |
| google.golang.org/protobuf | 394 | Serialization |
| google.golang.org/grpc | 259 | RPC |

**Zero external database dependencies in default build.**

---

## Codebase Scale

| Component | Files | Purpose |
|-----------|-------|---------|
| node | 1,686 .go | Core validator node |
| geth | 1,246 .go | EVM execution layer |
| coreth | 563 .go | C-Chain integration |
| consensus | 264 .go | BFT consensus engine |
| crypto | 44,218 LOC | Post-quantum + classic |
| threshold | 57,028 LOC | TSS/MPC protocols |
| precompiles | 19,852 LOC | Native L1 features |

### Test Coverage

| Component | Test Files |
|-----------|------------|
| node | 525 |
| geth | 388 |
| coreth | 169 |
| crypto | 54 |
| threshold | 107 |
| **Total** | **1,243+** |

Smart Contracts: 5,714 .sol files (DeFi, governance, bridges)

---

## Luxfi Internal Packages

22 packages compiled into every node binary:

```go
luxfi/ai          // AI inference & mining
luxfi/cache       // High-performance caching
luxfi/consensus   // Custom BFT (no snow deps)
luxfi/constants   // Network constants
luxfi/coreth      // C-Chain with precompiles
luxfi/crypto      // PQ-ready cryptography
luxfi/database    // Pluggable (badger/leveldb/pebble)
luxfi/genesis     // Network initialization
luxfi/geth        // Streamlined EVM
luxfi/go-bip32    // HD wallets
luxfi/go-bip39    // Mnemonic support
luxfi/ids         // Identifiers
luxfi/log         // Structured logging
luxfi/math        // Safe arithmetic
luxfi/metric      // Prometheus metrics
luxfi/mock        // Testing utilities
luxfi/p2p         // libp2p networking
luxfi/threshold   // TSS protocols
luxfi/trace       // Distributed tracing
luxfi/utils       // Common utilities
luxfi/vm          // VM interfaces
luxfi/warp        // Cross-chain messaging
```

---

## Feature Comparison

### Precompiles (Native L1 Contracts)

| Category | Lux Precompiles | Avalanche |
|----------|-----------------|-----------|
| **DeFi** | Pool Manager, Lending, Synthetics, Transmuter, Alchemist, Liquidation, Interest Rates | ✗ None |
| **AI** | AI Mining, Inference | ✗ None |
| **PQ Crypto** | ML-DSA, SLH-DSA, FROST, Ringtail | ✗ None |
| **MPC** | CGGMP21, Quasar | ✗ None |
| **Governance** | Fee Manager, Reward Manager, Deployer Allowlist, TX Allowlist | ✓ Basic |
| **Interop** | Warp (8 files), Native Asset, Native Minter | ✓ Partial |

**Total: 24+ precompiles vs ~8**

### Cryptographic Capabilities

| Algorithm | Lux | Avalanche | Notes |
|-----------|-----|-----------|-------|
| BLS12-381 | ✓ | ✓ | Aggregate signatures |
| BN256 | ✓ | ✓ | Pairing-based |
| secp256k1 | ✓ | ✓ | ECDSA |
| **ML-DSA (Dilithium)** | ✓ | ✗ | NIST PQC |
| **SLH-DSA (SPHINCS+)** | ✓ | ✗ | Hash-based |
| **FROST (Threshold)** | ✓ | ✗ | Threshold Schnorr |
| **Lattice (Lattigo)** | ✓ | ✗ | FHE/lattice ops |
| **CGGMP21 (MPC)** | ✓ | ✗ | Threshold ECDSA |
| **HPKE** | ✓ | ✗ | Hybrid encryption |
| **IPA** | ✓ | ✗ | Inner product args |

---

## Database Backend

| Aspect | BadgerDB (Lux) | Pebble (Avalanche) |
|--------|----------------|---------------------|
| Design | SSD-optimized LSM | Generic LSM |
| Write Amplification | Low | High |
| Point Lookups | **3-10x faster** | Baseline |
| Memory Efficiency | Efficient | Heavy |
| CGO Dependency | None (pure Go) | Required |
| Binary Impact | +2MB | +8MB |

---

## Performance Implications

| Aspect | Impact |
|--------|--------|
| **Cold Start** | 2x faster (41MB vs 88MB load) |
| **Memory** | ~40% less resident memory |
| **Docker Pull** | ~50% faster image transfer |
| **CI/CD** | ~50% faster pipelines |
| **Attack Surface** | 51% fewer modules to audit |
| **CVE Exposure** | Dramatically reduced |

---

## Security Advantages

### Supply Chain Attack Resistance

1. **Fewer dependencies**: 147 vs 300 modules = 51% less attack surface
2. **Internal control**: 30 luxfi packages can be patched immediately
3. **Pinned versions**: No automatic upstream pulls
4. **Audit scope**: Clear, bounded codebase

### Immediate Response Capability

When a CVE is disclosed:
- **Avalanche**: Wait for upstream fix, hope it merges
- **Lux**: Patch immediately, deploy within hours

### Zero Trust Dependencies

| Dependency Type | Policy |
|-----------------|--------|
| Cryptographic | Fork and audit |
| Database | Fork and optimize |
| Networking | Fork and harden |
| Serialization | Stdlib only |
| External services | None in critical path |

---

## Test Cases

### Binary Size Verification
```bash
# Build and measure
go build -o luxd ./cmd/luxd
ls -lh luxd  # Should be ~41MB
```

### Module Count Verification
```bash
go mod graph | wc -l  # Should be ~23,653 edges
go list -m all | wc -l  # Should be ~620 unique
```

### Dependency Audit
```bash
# List all external (non-luxfi) dependencies
go list -m all | grep -v luxfi | wc -l
```

---

## Reference Implementation

The supply chain control is implemented across:

| Repository | Purpose |
|------------|---------|
| `luxfi/node` | Core validator with internal deps |
| `luxfi/geth` | Forked EVM with precompiles |
| `luxfi/coreth` | C-Chain integration |
| `luxfi/crypto` | PQ cryptography |
| `luxfi/threshold` | TSS/MPC protocols |
| `luxfi/consensus` | BFT engine |

---

## Backwards Compatibility

This LP documents existing implementation. No changes required.

## Security Considerations

This LP itself is a security measure. By documenting the supply chain:
1. Auditors understand the dependency model
2. Contributors follow the forking policy
3. Security researchers have clear scope
4. CVE response procedures are defined

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
