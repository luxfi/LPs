---
lp: 0050
title: Developer Tools Overview
description: Index of standards and protocols that support developer workflows and tooling in the Lux ecosystem.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
category: 
created: 2025-01-23
updated: 2025-07-25
---

## Abstract

This LP serves as an index and overview of all developer-focused tools, frameworks, and infrastructure specifications in the Lux Network ecosystem. It provides developers with a comprehensive guide to available tooling and their respective specifications.

## Motivation

As the Lux ecosystem grows, developers need a centralized reference point to discover and understand the various tools available for building on Lux. This LP consolidates all developer-related specifications into a single, easily navigable document.

## Developer Tool Categories

### 1. Testing and Development Infrastructure

#### [LP-6: Network Runner & Testing Framework](./lp-6-network-runner-and-testing-framework.md)
- **Status**: Draft
- **Purpose**: Provides a standardized framework for running local Lux networks for development and testing
- **Key Features**:
  - Local network simulation
  - Automated testing infrastructure
  - Multi-chain testing support
  - Performance benchmarking tools

### 2. Virtual Machine Development

#### [LP-7: VM SDK Specification](./lp-7-vm-sdk-specification.md)
- **Status**: Draft
- **Purpose**: Software Development Kit for creating custom Virtual Machines on Lux
- **Key Features**:
  - VM interface standardization
  - Language-agnostic VM development
  - State management abstractions
  - Consensus integration helpers

### 3. Plugin Architecture

#### [LP-8: Plugin Architecture](./lp-8-plugin-architecture.md)
- **Status**: Draft
- **Purpose**: Extensible plugin system for Lux nodes
- **Key Features**:
  - Dynamic plugin loading
  - API standardization
  - Security sandboxing
  - Resource management

### 4. Command Line Interface

#### [LP-9: CLI Tool Specification](./lp-9-cli-tool-specification.md)
- **Status**: Draft
- **Purpose**: Comprehensive command-line interface for Lux operations
- **Key Features**:
  - Node management commands
  - Wallet operations
  - Network diagnostics
  - Development utilities

## Getting Started

### For New Developers

1. **Set Up Development Environment**
   - Install the CLI tool ([LP-9](./lp-9-cli-tool-specification.md))
   - Set up Network Runner ([LP-6](./lp-6-network-runner-and-testing-framework.md))
   - Configure your development environment

2. **Choose Your Development Path**
   - **Building dApps**: Focus on existing chains (C-Chain, X-Chain)
   - **Creating Custom VMs**: Study the VM SDK ([LP-7](./lp-7-vm-sdk-specification.md))
   - **Extending Node Functionality**: Review Plugin Architecture ([LP-8](./lp-8-plugin-architecture.md))

3. **Testing Your Application**
   - Use Network Runner for local testing
   - Leverage the testing framework for automated tests
   - Deploy to testnet before mainnet

### For Tool Developers

If you're building developer tools for the Lux ecosystem:

1. Review existing tool specifications to avoid duplication
2. Ensure compatibility with established interfaces
3. Consider proposing new LPs for significant new tools
4. Integrate with existing infrastructure where possible

## Best Practices

### Tool Selection
- Use official Lux tools when available
- Prefer tools with "Final" status for production
- Check tool compatibility with your target Lux version

### Development Workflow
1. Local development with Network Runner
2. Unit testing with the testing framework
3. Integration testing on testnet
4. Performance testing before mainnet deployment

### Security Considerations
- Always use the latest tool versions
- Follow security guidelines in each tool's documentation
- Audit custom plugins and VMs before deployment
- Use secure key management practices

## Future Roadmap

### Planned Enhancements
- IDE integrations (VS Code, IntelliJ)
- Enhanced debugging tools
- Performance profiling suite
- Automated deployment pipelines

### Community Contributions
- Tool developers are encouraged to propose new LPs
- Improvements to existing tools should be discussed in respective LP discussions
- Security vulnerabilities should be reported through proper channels

## Related Specifications

### Core Infrastructure
- [LP-0: Lux Network Architecture](./lp-0-network-architecture-and-community-framework.md)
- [LP-1: Lux Consensus](./lp-1-primary-chain-native-tokens-and-tokenomics.md)
- [LP-2: Lux Virtual Machine](./lp-2-virtual-machine-and-execution-environment.md)

### Token Standards
- [LP-20: LRC-20 Token Standard](./lp-20-lrc-20-fungible-token-standard.md)
- [LP-721: LRC-721 NFT Standard](./lp-721-lrc-721-non-fungible-token-standard.md)

## Implementation

### Current Status
All developer tools referenced in this LP are implemented and actively maintained in the Lux Network repository.

### Tool Locations

#### CLI Tool (LP-9)
**Repository**: `~/work/lux/cli/`
- **Binary**: `cli/cli` (Go executable)
- **Commands**: Network management, wallet operations, staking, debugging
- **Status**: Production ready
- **Package**: `github.com/luxfi/cli`

#### Network Runner & Testing Framework (LP-6)
**Repository**: `~/work/lux/netrunner/`
- **Package**: `github.com/luxfi/netrunner/local`
- **Key Component**: `NewDefaultNetwork()` - Multi-node test network creation
- **Features**: 5-node clusters, chainable assertions, cleanup utilities
- **Status**: Production tested

#### VM SDK (LP-7)
**Repository**: `~/work/lux/vmsdk/`
- **Package**: `github.com/luxfi/vmsdk`
- **Interfaces**: `VM`, `Factory`, `Manager`
- **Status**: SDK with multiple implementations available

#### Plugin Architecture (LP-8)
**Repository**: `~/work/lux/node/plugin/`
- **Path**: `~/work/lux/node/plugin/`
- **Interfaces**: Plugin registry, lifecycle management
- **Status**: Available for custom extensions

### SDK Implementations

#### TypeScript/JavaScript SDK
**Repository**: `~/work/lux/js-sdk/`
- **Path**: `js-sdk/sdk/`
- **Features**: RPC client, wallet integration, contract interaction
- **Status**: Production ready

#### Python SDK
**Repository**: `~/work/lux/python-sdk/`
- **Features**: Full REST API coverage
- **Status**: Production ready

#### Go SDK
**Repository**: `~/work/lux/universe/go-sdk/`
- **Features**: Low-level protocol access
- **Status**: Production ready

#### Exchange SDK
**Repository**: `~/work/lux/exchange-sdk/`
- **Features**: DEX and trading integration
- **Status**: Production ready

### Testing Infrastructure

#### Netrunner SDK
**Repository**: `~/work/lux/netrunner-sdk/`
- **Purpose**: Programmatic network testing and simulation
- **Usage**: Load testing, chaos testing, performance validation

#### Test Utilities
**Locations**:
- `~/work/lux/consensus/` - Consensus testing utilities
- `~/work/lux/database/` - Database integration tests
- `~/work/lux/crypto/` - Cryptographic test vectors

### API Documentation

#### RPC API Reference
**Location**: `~/work/lux/cli/docs/`
- JSON-RPC 2.0 specification
- 40+ endpoint documentation
- Example requests and responses

#### WebSocket API
**Location**: `~/work/lux/cli/docs/`
- Real-time subscription support
- Event streaming specifications

### Example Projects

#### Sample Applications
**Location**: `~/work/lux/examples/`
- Smart contract interaction examples
- Multi-chain dApp examples
- Custom VM examples

### Quality Assurance

All tools undergo:
- Unit testing (Go test framework)
- Integration testing (Netrunner)
- Performance testing (Benchmarking suites)
- Security audits (Regular code reviews)

### Deployment

Tools available via:
1. **Binary releases**: GitHub releases with checksums
2. **Docker images**: Container deployments
3. **Source compilation**: `make build` in each repository
4. **Package managers**: Homebrew, npm, pip (where applicable)

## Support and Resources

### Documentation
- Official Lux documentation: [docs.lux.network](https://docs.lux.network)
- Tool-specific guides in respective repositories

### Community
- Developer Discord: [discord.gg/lux](https://discord.gg/lux)
- GitHub Discussions: [github.com/luxfi/lps/discussions](https://github.com/luxfi/lps/discussions)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
## Specification

Normative definitions for data structures, processes, and parameters in this LP MUST be followed for compatibility across Lux components.

## Rationale

Chosen trade‑offs maximize maintainability and safety while delivering the intended functionality.

## Backwards Compatibility

Additive changes only; existing pathways continue to work. Migration is optional and incremental.

## Security Considerations

Apply common security controls, validate inputs, and ensure cryptographic operations are implemented with constant‑time and side‑channel‑safe practices where applicable.
