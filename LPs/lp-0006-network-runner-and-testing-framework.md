---
lp: 0006
title: Network Runner & Testing Framework
tags: [dev-tools, testing]
description: Specifies the Lux Network Runner and testing frameworks.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-01-23
---

## Abstract

This LP specifies the Lux Network Runner and testing frameworks (for the netrunner repo). This LP defines how to instantiate and manage local networks for testing and development.

## Specification

*(This LP will outline a standard interface (CLI commands, config files, APIs) to spin up a multi-chain Lux network on a developer’s machine or CI environment.)*

## Rationale

By formalizing this in a LP, contributors will know how to test protocol changes and new applications in a controlled environment, which improves the overall quality and reliability of Lux’s ecosystem.

## Motivation

A standard network runner removes ad‑hoc scripts and inconsistencies, enabling reliable local/CI testing, reproducible environments, and faster iteration for protocol and dApp developers.

## Implementation

### Network Runner Framework

**Location**: `~/work/lux/netrunner/`
**GitHub**: [`github.com/luxfi/netrunner/tree/main`](https://github.com/luxfi/netrunner/tree/main)

**Core Components**:
- [`local/`](https://github.com/luxfi/netrunner/tree/main/local) - Local network management (19 files)
  - [`network.go`](https://github.com/luxfi/netrunner/blob/main/local/network.go) - Network orchestration (35.5 KB)
  - [`blockchain.go`](https://github.com/luxfi/netrunner/blob/main/local/blockchain.go) - Blockchain management (43.3 KB)
  - [`node_process.go`](https://github.com/luxfi/netrunner/blob/main/local/node_process.go) - Node process control (6.4 KB)
- [`api/`](https://github.com/luxfi/netrunner/tree/main/api) - RPC and HTTP APIs (6 files)
- [`network/`](https://github.com/luxfi/netrunner/tree/main/network) - Network configuration (default topology, genesis)

**Default Network**:
- 5 validators, local network ID (1337)
- Pre-generated staking keys and certificates
- Automatic port assignment (9650+ API, 9651+ P2P)
- Bootstrap node configuration

**Testing**:
```bash
cd ~/work/lux/netrunner
go test -v ./...
```

**Quick Start**:
```bash
network, _ := local.NewDefaultNetwork(logger, "/path/to/luxd", true)
defer network.Stop(context.Background())

ctx, _ := context.WithTimeout(context.Background(), 2*time.Minute)
network.Healthy(ctx)  # Bootstrap all 4 chains
```

### CLI Integration

**Location**: `~/work/lux/cli/cmd/network/`
**GitHub**: [`github.com/luxfi/cli/tree/main/cmd/network`](https://github.com/luxfi/cli/tree/main/cmd/network)

**Commands**:
- `lux network start` - Launch local network with specified node version
- `lux network status` - Check bootstrap status
- `lux network stop` - Gracefully shut down network

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Backwards Compatibility

Additive specification; no breaking changes to existing interfaces. Adoption is optional per component.

## Security Considerations

Follow threat models relevant to this LP (input validation, replay/DoS protections, key handling). Implement recommended mitigations.
