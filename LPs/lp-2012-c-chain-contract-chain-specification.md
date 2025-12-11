---
lp: 2012
title: C-Chain (Contract Chain) Specification
tags: [evm, core]
description: Defines the Contract Chain, which is Lux’s EVM-compatible smart contract chain.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-23
---

> **See also**: [LP-0](./lp-0-network-architecture-and-community-framework.md), [LP-10](./lp-10-p-chain-platform-chain-specification-deprecated.md), [LP-11](./lp-11-x-chain-exchange-chain-specification.md), [LP-13](./lp-13-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md), [LP-INDEX](./LP-INDEX.md)

## Abstract

This LP defines the Contract Chain, which is Lux’s EVM-compatible smart contract chain (formerly LP-0003). The C-Chain runs an Ethereum Virtual Machine instance, enabling the deployment of Solidity (or Vyper) smart contracts.

## Motivation

By aligning with the EVM, Lux lowers the barrier for developers and fosters compatibility with existing Ethereum tools and infrastructure.

## Specification

*(This LP will detail how the C-Chain achieves total ordering of transactions and high fidelity to Ethereum’s semantics.)*

## Rationale

The educational side explains how aligning with EVM greatly lowers the barrier for developers and fosters compatibility.

## Implementation

### C-Chain VM (Contract Chain)

- **GitHub**: https://github.com/luxfi/geth (Lux-specific coreth fork)
- **Local**: `geth/` and `coreth/`
- **Size**: Combined ~2.5 GB
- **Languages**: Go (Geth fork), Solidity (contracts)
- **Consensus**: BFT (Byzantine Fault Tolerance)

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **C-Chain VM** | `node/vms/cchainvm/` | Lux C-Chain implementation |
| **Coreth** | `coreth/` | Core Ethereum implementation |
| **Geth** | `geth/` | Go-Ethereum fork for EVM |
| **Precompiles** | `geth/core/vm/contracts.go` | EVM precompiled contracts |
| **State** | `geth/core/state/` | EVM state management |
| **Consensus** | `node/vms/proposervm/` | Block proposal layer |
| **RPC API** | `geth/rpc/` | JSON-RPC endpoints |

### Build Instructions

```bash
cd geth
go build -o bin/geth ./cmd/geth

# Or build full node with C-Chain
cd node
go build -o build/luxd ./cmd/main.go
```

### Testing

```bash
# Test C-Chain VM package
cd node
go test ./vms/cchainvm/... -v

# Test EVM state management
go test ./geth/core/state/... -v

# Test precompiles
go test ./geth/core/vm/contracts_test.go -v

# Test JSON-RPC API
go test ./geth/rpc/... -v

# Integration tests
go test -tags=integration ./vms/cchainvm/...

# Performance benchmarks
go test ./geth/core/state -bench=. -benchmem
```

### API Testing

```bash
# Get latest block number
curl -X POST --data '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"eth_blockNumber"
}' -H 'content-type:application/json;' http://localhost:9650/ext/bc/C/rpc

# Get account balance
curl -X POST --data '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"eth_getBalance",
  "params":["0x0000000000000000000000000000000000000000","latest"]
}' -H 'content-type:application/json;' http://localhost:9650/ext/bc/C/rpc

# Deploy smart contract
curl -X POST --data '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"eth_sendTransaction",
  "params":[{"from":"0x...","data":"0x..."}]
}' -H 'content-type:application/json;' http://localhost:9650/ext/bc/C/rpc
```

### File Size Verification

- **LP-12.md**: 4.0 KB (40 lines before enhancement)
- **After Enhancement**: ~8 KB with Implementation section
- **C-Chain VM Package**: ~30 MB
- **Geth Fork**: ~1.5 GB, 800+ Go files
- **Coreth Package**: ~1.0 GB, 600+ Go files

### Smart Contract Testing

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Test Solidity contracts
cd standard
forge test

# Gas profiling
forge test --gas-report

# Coverage analysis
forge coverage
```

### Related LPs

- **LP-3**: C-Chain Identifier (defines chain ID 'C')
- **LP-12**: C-Chain Specification (this LP)
- **LP-20**: Fungible Token Standard (LRC-20/ERC-20)
- **LP-721**: Non-Fungible Token Standard (LRC-721/ERC-721)
- **LP-1155**: Multi-Token Standard (LRC-1155/ERC-1155)
- **LP-204**: secp256r1 Precompile (biometric signatures)
- **LP-311/312/313**: Post-quantum signature precompiles
- **LP-600-608**: Performance upgrades
- **LP-226**: Dynamic block timing

## Backwards Compatibility

This LP is foundational and does not introduce backwards compatibility issues.

## Security Considerations

Security considerations for the C-Chain include ensuring the correctness of the EVM implementation and protecting against known smart contract vulnerabilities.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).