---
lp: 2000
title: C-Chain - Core EVM Specification
tags: [core, evm, smart-contracts, c-chain]
description: Core specification for the C-Chain (Contract Chain), Lux Network's EVM-compatible smart contract chain
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: [0, 99]
supersedes: 12
---

## Abstract

LP-2000 specifies the C-Chain (Contract Chain), Lux Network's EVM-compatible smart contract blockchain. The C-Chain runs a full Ethereum Virtual Machine, enabling deployment of Solidity and Vyper smart contracts with full tooling compatibility.

## Motivation

An EVM-compatible chain provides:

1. **Developer Experience**: Familiar tooling and languages
2. **Ecosystem Compatibility**: Direct deployment of existing contracts
3. **DeFi Foundation**: Native support for DeFi protocols
4. **Tooling Support**: Works with Foundry, Hardhat, Remix, etc.

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `C` |
| VM ID | `evm` |
| VM Name | `evm` |
| EVM Chain ID | 43114 (Mainnet), 43113 (Testnet) |
| Block Time | ~2 seconds |
| Consensus | Quasar |

### Implementation

**Go Packages**:
- `github.com/luxfi/node/vms/cchainvm` (VM wrapper)
- `github.com/luxfi/geth` (EVM implementation)

```go
import (
    cvm "github.com/luxfi/node/vms/cchainvm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var EVMID = constants.EVMID // ids.ID{'e', 'v', 'm'}

// Create C-Chain VM
factory := &cvm.Factory{}
vm, err := factory.New(logger)
```

### Directory Structure

```
node/vms/cchainvm/        # VM wrapper
├── factory.go            # VM factory
├── vm.go                 # Main VM implementation
└── *_test.go             # Tests

geth/                     # EVM implementation (luxfi/geth)
├── core/                 # Core EVM logic
│   ├── state/           # State management
│   ├── vm/              # Virtual machine
│   └── types/           # Transaction types
├── plugin/evm/          # Plugin interface
└── rpc/                 # JSON-RPC API
```

### EVM Compatibility

C-Chain maintains full EVM equivalence:

| Feature | Status |
|---------|--------|
| EVM Opcodes | Full support |
| Solidity | Full support |
| Vyper | Full support |
| Precompiles | Standard + Lux extensions |
| JSON-RPC | Full Ethereum compatibility |
| Web3.js/Ethers | Full compatibility |

### Lux-Specific Precompiles

| Address | Name | Gas | Description |
|---------|------|-----|-------------|
| `0x0100` | secp256r1 | 3,450 | P-256 signature verification |
| `0x0200` | ML-DSA | 50,000 | Post-quantum signatures |
| `0x0201` | ML-KEM | 30,000 | Post-quantum key encapsulation |
| `0x0300` | WarpVerify | 100,000 | Cross-chain message verification |

### Transaction Types

| Type | EIP | Description |
|------|-----|-------------|
| Legacy | - | Pre-EIP-2718 transactions |
| Access List | EIP-2930 | With access list |
| Dynamic Fee | EIP-1559 | Base fee + priority fee |
| Blob | EIP-4844 | For blob transactions |

### Gas Mechanics

```go
type GasConfig struct {
    MinBaseFee     uint64 // 25 gwei
    MaxBaseFee     uint64 // 1000 gwei
    BlockGasLimit  uint64 // 15,000,000
    TargetGasUsage uint64 // 50% of limit
}
```

**LP-176 Dynamic Gas**:
- Base fee adjusts based on block utilization
- Target: 50% block capacity
- Max change: 12.5% per block

### API Endpoints

#### JSON-RPC (eth namespace)

| Method | Description |
|--------|-------------|
| `eth_blockNumber` | Get latest block number |
| `eth_getBalance` | Get account balance |
| `eth_sendTransaction` | Send transaction |
| `eth_call` | Execute read-only call |
| `eth_estimateGas` | Estimate gas for transaction |
| `eth_getLogs` | Get event logs |

#### Lux Extensions (lux namespace)

| Method | Description |
|--------|-------------|
| `lux_getAtomicTx` | Get atomic transaction |
| `lux_issueTx` | Issue atomic transaction |
| `lux_getUTXOs` | Get atomic UTXOs |

#### REST Endpoints

```
POST /ext/bc/C/rpc              # JSON-RPC endpoint
GET  /ext/bc/C/lux/getUTXOs     # Get atomic UTXOs
POST /ext/bc/C/lux/issueTx      # Issue atomic tx
```

### Smart Contract Standards

C-Chain supports all standard ERC/LRC token standards:

| Standard | LP | Description |
|----------|-----|-------------|
| LRC-20 | LP-2300 | Fungible tokens |
| LRC-721 | LP-2500 | Non-fungible tokens |
| LRC-1155 | LP-2501 | Multi-tokens |
| LRC-4626 | LP-2400 | Tokenized vaults |

### Cross-Chain Operations

#### Atomic Transactions

```go
type AtomicTx struct {
    NetworkID    uint32
    BlockchainID ids.ID
    Ins          []*AtomicInput
    Outs         []*AtomicOutput
}
```

#### Warp Messaging

```solidity
interface IWarpMessenger {
    function sendWarpMessage(bytes calldata payload) external returns (bytes32);
    function getVerifiedWarpMessage(uint32 index) external view returns (WarpMessage memory);
}
```

### Configuration

```json
{
  "cchainvm": {
    "enabledEIPs": [1559, 2718, 2930, 4844],
    "gasLimit": 15000000,
    "minBaseFee": 25000000000,
    "targetBlockRate": 2,
    "allowUnprotectedTxs": false,
    "precompiles": {
      "secp256r1": true,
      "mldsa": true,
      "mlkem": true,
      "warp": true
    }
  }
}
```

### Performance

| Metric | Value |
|--------|-------|
| Block Time | ~2 seconds |
| Transaction Throughput | ~4,500 TPS |
| Finality | ~2 seconds |
| Gas Limit | 15,000,000 |

## Rationale

Design decisions for C-Chain:

1. **Full EVM Compatibility**: Maximize ecosystem compatibility
2. **Lux Precompiles**: Add network-specific functionality
3. **Atomic Transactions**: Enable cross-chain operations
4. **Dynamic Gas**: Prevent fee volatility

## Backwards Compatibility

LP-2000 supersedes LP-0012. Both old and new numbers resolve to this document.

## Test Cases

```bash
# Test C-Chain VM
cd node && go test ./vms/cchainvm/... -v

# Test EVM implementation
cd geth && go test ./core/vm/... -v

# Test precompiles
go test ./core/vm/contracts_test.go -v

# Smart contract tests
cd standard && forge test
```

## Reference Implementation

**Repositories**:
- `github.com/luxfi/node` (VM wrapper)
- `github.com/luxfi/geth` (EVM implementation)

**Packages**:
- `vms/cchainvm`
- `geth/core/vm`
- `geth/plugin/evm`

## Security Considerations

1. **Reentrancy**: Standard EVM reentrancy protections
2. **Gas Limits**: Prevent DoS via gas limits
3. **Precompile Security**: Audited implementations
4. **Atomic TX Security**: Cross-chain atomicity guarantees

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0012 | C-Chain Specification | Superseded by this LP |
| LP-2100 | Precompiles | Sub-specification |
| LP-2200 | Gas Mechanics | Sub-specification |
| LP-2300 | Smart Contract Standards | Sub-specification |
| LP-2400 | DeFi Protocols | Sub-specification |
| LP-2600 | Rollups/L2 | Sub-specification |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
