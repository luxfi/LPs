---
lp: 0007
title: VM SDK Specification
tags: [vm, dev-tools, sdk]
description: Defines the Virtual Machine SDK for Lux.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-23
---

## Abstract

This LP defines the Virtual Machine SDK for Lux (in the vmsdk repo), which allows developers to create new blockchain VMs that run on Lux subnets.

## Specification

*(This LP will specify the interface a VM must implement (for example, methods for block validation, state management, and consensus hooks), enabling it to integrate with the consensus layer.)*

## Rationale

By providing an SDK spec, Lux invites innovation: teams could develop specialized chains (subnets) for particular use cases, all while conforming to a common framework.

## Motivation

A standardized VM SDK removes ambiguity for VM authors, accelerates development of specialized subnets, and ensures consistent integration with Lux consensus and tooling.

## Implementation

### VM SDK Framework

**Location**: `~/work/lux/vmsdk/`
**GitHub**: [`github.com/luxfi/vmsdk/tree/main`](https://github.com/luxfi/vmsdk/tree/main)

**Core Modules**:
- [`chain/`](https://github.com/luxfi/vmsdk/tree/main/chain) - Chain state and block management (16 files)
  - State transitions, block validation, consensus integration
- [`builder/`](https://github.com/luxfi/vmsdk/tree/main/builder) - Block and transaction builders (6 files)
- [`codec/`](https://github.com/luxfi/vmsdk/tree/main/codec) - Serialization/deserialization (9 files)
  - Support for custom types and efficient encoding
- [`examples/`](https://github.com/luxfi/vmsdk/tree/main/examples) - Sample VM implementations
- [`config/`](https://github.com/luxfi/vmsdk/tree/main/config) - Configuration management (3 files)
- [`crypto/`](https://github.com/luxfi/vmsdk/tree/main/crypto) - Cryptographic utilities (5 files)

**VM Interface**:
- Block validation hooks
- State machine interface
- Consensus callbacks (block proposal, acceptance, rejection)
- Custom transaction types support

**Key Features**:
- Modular architecture for VM specialization
- Built-in support for UTXO and account models
- Async block processing
- Configurable consensus parameters

**Documentation**:
```bash
cd ~/work/lux/vmsdk
# View API documentation
go doc ./... | head -100
```

**Example VM**:
- Location: `~/work/lux/vmsdk/examples/`
- Demonstrates full VM lifecycle
- Shows custom transaction handling

### VM Registry

**Location**: `~/work/lux/node/vms/`
**GitHub**: [`github.com/luxfi/node/tree/main/vms`](https://github.com/luxfi/node/tree/main/vms)

**Registered VMs**:
- `platformvm/` - Platform VM (P-Chain)
- `avm/` - Asset VM (X-Chain, UTXO-based)
- `evm/` - EVM Compatible VM (C-Chain)
- `quantumvm/` - Quantum VM (Q-Chain)

**VM Manager**:
- Dynamically loads and instantiates VMs
- Manages VM lifecycle (start, stop, shutdown)
- Routes messages to correct VM handler

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Backwards Compatibility

Additive and non‑breaking; existing consumers continue to work. Adoption is opt‑in.

## Security Considerations

Apply appropriate validation, authentication, and resource‑limiting to prevent abuse; follow cryptographic best practices where applicable.
