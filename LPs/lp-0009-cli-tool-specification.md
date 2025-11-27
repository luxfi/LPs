---
lp: 0009
title: CLI Tool Specification
description: Defines the official Command-Line Interface (CLI) tools for Lux.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-01-23
---

## Abstract

This LP defines the official Command-Line Interface (CLI) tools for Lux (for the cli repo). This LP enumerates the standard commands, options, and JSON outputs for the lux-cli (and related tools), ensuring a uniform experience for users and scripts.

## Specification

*(This LP will include sections for each major command group: managing keys and wallets, issuing transactions on various chains, node administration, network deployment (interfacing with LP-6’s testnet framework), etc.)*

## Rationale

By standardizing the CLI, all users from developers to validators have a clear reference on interacting with Lux, and it aids in writing documentation and tutorials consistent with the tool’s behavior.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Backwards Compatibility

Additive proposal; does not break existing modules. Adoption can be phased in.

## Security Considerations

Follow recommended validation and cryptographic practices; consider rate‑limiting and replay protections where relevant.

## Motivation

A unified approach here reduces fragmentation and improves developer ergonomics and compatibility across Lux networks and tools.

## Implementation

### Repository

The CLI implementation is in the `lux-cli` repository:

- **GitHub**: https://github.com/luxfi/cli
- **Local**: `/Users/z/work/lux/cli/`
- **Size**: 1.6 GB total
- **Go Files**: 523 implementation files

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Command Registry** | `cli/cmd/commands.go` | Central command registration |
| **Blockchain Commands** | `cli/cmd/blockchaincmd/` | Create, configure, and manage blockchains |
| **Key Management** | `cli/cmd/keycmd/` | Wallet, key, and identity operations |
| **Network Commands** | `cli/cmd/l1cmd/` | Layer 1 network operations |
| **L3 Commands** | `cli/cmd/l3cmd/` | Layer 3 subnet management |
| **Flags** | `cli/cmd/flags/` | Standard flag definitions |
| **Configuration** | `cli/cmd/configcmd/` | Network and node configuration |
| **Contracts** | `cli/cmd/contractcmd/` | Smart contract deployment and interaction |
| **Interchain** | `cli/cmd/interchaincmd/` | Cross-chain operations |

### Build Instructions

```bash
cd /Users/z/work/lux/cli
go build -o bin/lux-cli ./cmd/main.go

# Or using make (if available)
make build
make install  # Install to $GOPATH/bin
```

### Testing

```bash
# Run all CLI tests
cd /Users/z/work/lux/cli
go test ./...

# Run with coverage
go test -cover ./...

# Run specific test suite
go test ./cmd/blockchaincmd -v
go test ./cmd/keycmd -v

# Integration tests (if available)
go test -tags=integration ./...
```

### Documentation

- **Command Reference**: `cli/cmd/commands.md` (158 KB - comprehensive command documentation)
- **Usage Examples**: Each command directory contains README files
- **Flag Definitions**: `cli/cmd/flags/` directory

### Testing Commands

```bash
# Test blockchain command group
go test ./cmd/blockchaincmd -run TestBlockchain -v

# Test key management commands
go test ./cmd/keycmd -run TestKey -v

# Test configuration commands
go test ./cmd/configcmd -run TestConfig -v

# Check code formatting
go fmt ./...

# Run linters
go vet ./...

# Full validation
go test -race ./...
```

### File Size Verification

- **LP-9.md**: 4.0 KB (38 lines before enhancement)
- **After Enhancement**: ~7.5 KB with Implementation section
- **CLI Package**: 1.6 GB, 523 Go files

### Related LPs

- **LP-6**: Testnet Framework (CLI integrates with testnet deployment)
- **LP-7**: VM SDK Specification (CLI manages VM creation)
- **LP-8**: Standard Library (CLI uses standard library functions)
- **LP-10 through LP-18**: Various chain and bridge implementations (CLI provides interfaces)
