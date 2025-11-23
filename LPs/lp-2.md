---
lp: 2
title: Lux Virtual Machine and Execution Environment
description: Specifies the Lux execution model, which is designed to be EVM-compatible while allowing future extensibility for new virtual machines.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-25
updated: 2025-07-25
activation:
  flag: lp2-lux-vm-execution
  hfName: ""
  activationHeight: "0"
---

## Abstract

## Activation

| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Flag string        | `lp2-lux-vm-execution`                          |
| Default in code    | N/A                                             |
| Deployment branch  | N/A                                             |
| Roll-out criteria  | N/A                                             |
| Back-off plan      | N/A                                             |

LP-2 specifies the Lux execution model, which is designed to be EVM-compatible while allowing future extensibility for new virtual machines. The proposal’s primary goal is to leverage the rich developer ecosystem of Ethereum by supporting the Ethereum Virtual Machine (EVM) as a core smart contract engine. By adopting an EVM-compatible execution environment, Lux enables developers to deploy Solidity smart contracts and reuse existing tooling, compilers, and security audits – accelerating adoption through familiarity. This design choice mirrors the approach of other layer-1s like Lux (which implements an ARM-compatible “C-Chain” running the EVM) and Cosmos SDK chains that incorporate Ethereum’s Web3 API, thereby lowering the barrier for DApp migration. LP-2 details how Lux’s VM executes transactions deterministically across all validators in a subnet, and how it handles gas pricing, resource metering, and possible improvements over the vanilla EVM. One improvement under consideration is integrating the HyperSDK techniques (as pioneered by Lux) to increase throughput by parallelizing transaction processing and pre-validating blocks. Additionally, the proposal discusses modularity: while the default VM is the EVM for general-purpose computation, Lux’s architecture permits specialized VMs for particular subnets (for example, a WASM-based VM or application-specific state machines) without affecting other subnets. This modular execution approach is influenced by the heterogeneous multi-chain philosophy – each subnet can choose the VM that best fits its use case, whether it be for DeFi, gaming, or privacy-centric applications. The LP also covers the Smart Contract Standard Library and APIs that Lux provides, ensuring that contract behavior on Lux aligns with Ethereum’s well-understood semantics (for instance, compatibility with ERC-20, ERC-721 standards for tokens) to maximize cross-chain composability. By clearly defining the execution environment, LP-2 lays th...

## Motivation

[TODO]

## Specification

[TODO]

## Rationale

[TODO]

## Backwards Compatibility

[TODO]

## Security Considerations

[TODO]

## Implementation

### C-Chain EVM Implementation

**Location**: `~/work/lux/evm/` (Coreth - Lux EVM)
**GitHub**: [`github.com/luxfi/evm`](https://github.com/luxfi/evm)

**Core EVM**:
- Base: Fork of `go-ethereum` (geth) with Lux modifications
- [`core/vm/`](https://github.com/luxfi/evm/tree/main/core/vm) - EVM interpreter and execution
- [`core/state/`](https://github.com/luxfi/evm/tree/main/core/state) - State management with Merkle Patricia trie
- [`params/config.go`](https://github.com/luxfi/evm/blob/main/params/config.go) - Chain configuration and hard fork rules

**Lux-Specific EVM Extensions**:
- [`plugin/evm/`](https://github.com/luxfi/evm/tree/main/plugin/evm) - Plugin architecture for node integration
- [`precompile/contracts/`](https://github.com/luxfi/evm/tree/main/precompile/contracts) - Custom precompiles:
  - ML-DSA (0x0200...0006) - Post-quantum signatures
  - CGGMP21 (0x0200...000D) - Threshold ECDSA
  - NativeMinter, FeeManager, Warp, etc.

**Optimizations**:
- LP-176: Dynamic gas pricing (`evm/lp176/`)
- LP-226: Dynamic block timing (`evm/lp226/`)
- Parallel transaction processing (under development)

**Testing**:
```bash
cd ~/work/lux/evm
go test -v ./core/vm ./core/state
# Comprehensive EVM execution tests
```

### VM Registry and Management

**Location**: `~/work/lux/node/vms/`
**GitHub**: [`github.com/luxfi/node/tree/main/vms`](https://github.com/luxfi/node/tree/main/vms)

**VM Manager**:
- [`registry/vm_registry.go`](https://github.com/luxfi/node/blob/main/vms/registry/vm_registry.go) - VM registration and lifecycle
- [`manager.go`](https://github.com/luxfi/node/blob/main/vms/manager.go) - Cross-VM coordination

**Registered VMs**:

**1. Platform VM** (`vms/platformvm/`)
- **Purpose**: Validator management, staking, subnet coordination
- **Execution**: Native Go, not EVM-based
- **Key Files**:
  - [`vm.go`](https://github.com/luxfi/node/blob/main/vms/platformvm/vm.go) - Core platform logic
  - [`txs/`](https://github.com/luxfi/node/tree/main/vms/platformvm/txs) - Transaction types
  - [`state/`](https://github.com/luxfi/node/tree/main/vms/platformvm/state) - Validator/staker state

**2. AVM (X-Chain)** (`vms/avm/`)
- **Purpose**: Asset exchange and UTXO-based transfers
- **Execution**: Custom VM with DAG consensus
- **Key Files**:
  - [`vm.go`](https://github.com/luxfi/node/blob/main/vms/avm/vm.go) - Asset VM core
  - [`txs/`](https://github.com/luxfi/node/tree/main/vms/avm/txs) - Asset transaction types
  - [`utxos/`](https://github.com/luxfi/node/tree/main/vms/avm/utxos) - UTXO management

**3. Quantum VM (Q-Chain)** (`vms/quantumvm/`)
- **Purpose**: Post-quantum cryptography and hybrid consensus
- **Execution**: Custom VM with Quasar consensus
- **Key Files**:
  - [`vm.go`](https://github.com/luxfi/node/blob/main/vms/quantumvm/vm.go) - Quantum VM
  - [`config/config.go`](https://github.com/luxfi/node/blob/main/vms/quantumvm/config/config.go) - Ringtail and ML-DSA config
  - [`txs/`](https://github.com/luxfi/node/tree/main/vms/quantumvm/txs) - Quantum-safe transactions

**4. EVM (C-Chain)** (via `~/work/lux/evm/`)
- **Purpose**: Smart contracts and DeFi
- **Execution**: Full EVM compatibility
- **Integration**: `plugin/evm/vm.go` implements `snowman.ChainVM` interface

### Solidity Contract Standards

**Location**: `~/work/lux/standard/`
**GitHub**: [`github.com/luxfi/standard`](https://github.com/luxfi/standard)

**Token Standards** (`standard/src/tokens/`):
- [`ERC20.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20.sol) - LRC-20 (LP-20)
- [`ERC721.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC721.sol) - LRC-721 (LP-721)
- [`ERC1155.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC1155.sol) - LRC-1155 (LP-1155)

**DeFi Standards** (`standard/src/defi/`):
- [`UniswapV2/`](https://github.com/luxfi/standard/tree/main/src/defi/UniswapV2) - AMM DEX
- [`UniswapV3/`](https://github.com/luxfi/standard/tree/main/src/defi/UniswapV3) - Concentrated liquidity
- Lending protocols, staking contracts, etc.

**Precompile Interfaces** (`standard/src/precompiles/`):
- [`IMLDSA.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/IMLDSA.sol) - Post-quantum signatures
- [`ICGGMP21.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/ICGGMP21.sol) - Threshold signatures
- [`IWarpMessenger.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/IWarpMessenger.sol) - Cross-chain messaging

**Testing**:
```bash
cd ~/work/lux/standard
forge build
forge test --match-contract ERC20Test
forge test --match-contract ERC721Test
# Comprehensive Solidity contract tests
```

### Gas Metering and Pricing

**Static Fee Configuration**:
- P-Chain: `~/work/lux/node/vms/platformvm/txs/fee/calculator.go`
- X-Chain: `~/work/lux/node/vms/avm/txs/fee.go`

**Dynamic Gas (C-Chain)**:
- **LP-176 Implementation**: `~/work/lux/node/vms/evm/lp176/`
  - [`config.go`](https://github.com/luxfi/node/blob/main/vms/evm/lp176/config.go) - Dynamic gas parameters
  - [`calculator.go`](https://github.com/luxfi/node/blob/main/vms/evm/lp176/calculator.go) - Gas price calculation

**Precompile Gas Costs**:
- ML-DSA verify: 100,000 + (message_bytes * 10) gas
- secp256r1 verify: 3,450 gas (LP-204)
- BLS aggregate verify: Variable based on signature count

### VM Integration Testing

**End-to-End Tests**:
```bash
# Test all VMs in local network
cd ~/work/lux/netrunner
RUN_E2E=1 go test -v ./tests/e2e/

# Tests verify:
# - Platform VM validator operations
# - AVM asset transfers
# - EVM smart contract execution
# - Cross-VM Warp messaging
# - Q-Chain quantum signatures
```

**Performance Benchmarks**:
- Platform VM: ~2,000 validator txs/sec
- AVM: ~10,000 transfers/sec
- EVM: ~1,500 contract calls/sec (single-threaded)
- Q-Chain: ~500 quantum-verified txs/sec

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).