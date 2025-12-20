---
lp: 1
title: Primary Chain, Native Tokens, and Tokenomics
tags: [core, tokenomics, token]
description: Defines Lux native currency (LUX), tokenomics, and core chain identifiers for the network.
author: Lux Network Team (@luxfi)
status: Final
type: Standards Track
category: Core
created: 2025-07-24
discussions-to: https://github.com/luxfi/lps/discussions
---

## Abstract

This LP defines the native tokens of the Lux Network, including the LUX currency, and outlines the tokenomics of the network. It also establishes a standardized identification system for the various chains within the Lux ecosystem.

## Motivation

Lux requires a canonical definition of its native currency and a consistent scheme for identifying core chains to ensure interoperability, tooling compatibility, and clear economics. A formal specification prevents ambiguity across wallets, explorers, SDKs, and token‑related protocols.

## Specification

- Native token ticker: `LUX`.
- Total supply: 2,000,000,000,000 LUX (2T) at genesis; distribution as defined below.
- Decimals: 18 on C-Chain (EVM-compatible), 6 on P/X-Chains (native UTXO).
- Chain identifiers: single‑character codes reserved network‑wide — `P`, `C`, `X`, `A`, `B`, `T`, `Q`, `Z`.
- Fees: All on‑chain transaction fees are denominated in LUX.
- Governance: LUX may be used in protocol governance per future LPs.

## Native Token

The native token of the Lux Network is **LUX**.

### LUX Currency

LUX is the primary currency of the Lux Network and is used for:

*   **Staking**: Users can stake LUX to secure the network and earn rewards.
*   **Transaction Fees**: All transaction fees on the network are paid in LUX.
*   **Governance**: LUX holders can participate in the governance of the network.

### Tokenomics

*   **Total Supply**: 2,000,000,000,000 LUX (2 Trillion)
*   **Chain Allocations**:
    *   **C-Chain**: 2T — Primary chain for smart contracts, DeFi, and accounts
    *   **P-Chain**: 100B — Staking and validator coordination
    *   **X-Chain**: 100B — Settlement layer and asset exchange
    *   **Other Chains** (A, B, T, Q, Z): Specialized execution chains without native balances

### Staking Requirements

*   **Minimum Validator Stake**: 1,000,000 LUX (1M)
*   **Minimum Delegator Stake**: 25,000 LUX (25K)
*   **Max Delegation Ratio**: 10x validator stake
*   **NFT Staking Tiers**:
    *   Genesis NFT: 500K LUX minimum, 2x rewards (limited to 100 validators)
    *   Pioneer NFT: 750K LUX minimum, 1.5x rewards (limited to 500 validators)
    *   Standard: 1M LUX minimum, 1x rewards (unlimited)
*   **Bridge Validators (B-Chain)**: 100M LUX minimum + KYC verification

## Chain Identification

The following single-character identifiers are assigned to the core chains of the Lux Network:

*   **P**: Platform Chain — Validator management, staking, subnet coordination
*   **C**: Contract Chain — EVM execution, smart contracts, DeFi
*   **X**: Exchange Chain — UTXO-based asset exchange, high-throughput transfers
*   **A**: Attestation Chain — AI workloads, model verification, training ledgers
*   **B**: Bridge Chain — Cross-chain asset movement, bridging infrastructure
*   **T**: Threshold Chain — MPC custody, threshold signatures, distributed signing
*   **Q**: Quantum Chain — Post-quantum cryptography, quantum-safe operations
*   **Z**: Zero-Knowledge Chain — ZK proofs, privacy, confidential compute

## Reserved LP Ranges for Chains

Per LP-99, LP numbers are organized by chain:

*   **0000-0999**: Core/Meta — Network-wide specs, governance, tooling
*   **1000-1999**: P-Chain — Platform, validators, staking
*   **2000-2999**: C-Chain — EVM, smart contracts, DeFi
*   **3000-3999**: X-Chain — Exchange, UTXO, trading
*   **4000-4999**: Q-Chain — Quantum-resistant cryptography
*   **5000-5999**: A-Chain — AI, attestation, compute
*   **6000-6999**: B-Chain — Bridge, cross-chain
*   **7000-7999**: T-Chain — Threshold, MPC, custody
*   **8000-8999**: Z-Chain — ZK proofs, privacy, FHE
*   **9000-9999**: DEX/Finance — Trading protocols, DeFi standards

## Rationale

- Short, human‑readable chain codes simplify UX and reduce error rates in cross‑chain references.
- A fixed ticker and total supply at genesis creates a stable foundation for economic modeling and tooling.

## Backwards Compatibility

This is a foundational specification. No prior on‑chain deployments are changed. Tooling and docs that used ad‑hoc names SHOULD migrate to the identifiers and ticker defined here.

## Security Considerations

- Clear chain identifiers reduce misrouting risk in cross‑chain operations.
- Centralizing fee denomination in LUX simplifies economic and security analysis of incentives.

## Test Cases

- Parsers must map `P/C/X/M/Z/G` to the intended chains.
- Wallets and explorers display balances and fees in `LUX`.
- Link and config schemas accept only the specified chain codes.

## Implementation

### Tokenomics Configuration

**Location**: `~/work/lux/node/config/`
**GitHub**: [`github.com/luxfi/node/tree/main/config`](https://github.com/luxfi/node/tree/main/config)

**Key Files**:
- [`tokenomics.go`](https://github.com/luxfi/node/blob/main/config/tokenomics.go) - Complete tokenomics configuration
- [`flags.go`](https://github.com/luxfi/node/blob/main/config/flags.go) - Network configuration flags

**Testing**:
```bash
cd ~/work/lux/node/config
go test -v ./...
```

### LUX Token Implementation

**Native Asset**: `~/work/lux/node/vms/components/lux/`
**GitHub**: [`github.com/luxfi/node/tree/main/vms/components/lux`](https://github.com/luxfi/node/tree/main/vms/components/lux)

**Key Files**:
- [`asset.go`](https://github.com/luxfi/node/blob/main/vms/components/lux/asset.go) - LUX asset definitions
- [`transferables.go`](https://github.com/luxfi/node/blob/main/vms/components/lux/transferables.go) - Transfer logic
- [`utxo.go`](https://github.com/luxfi/node/blob/main/vms/components/lux/utxo.go) - UTXO handling

### Staking and Rewards

**Location**: `~/work/lux/node/vms/platformvm/`
**GitHub**: [`github.com/luxfi/node/tree/main/vms/platformvm`](https://github.com/luxfi/node/tree/main/vms/platformvm)

**Files**:
- [`validator/validator.go`](https://github.com/luxfi/node/blob/main/vms/platformvm/validator/validator.go) - Validator management
- [`reward/calculator.go`](https://github.com/luxfi/node/blob/main/vms/platformvm/reward/calculator.go) - Staking rewards
- [`state/state.go`](https://github.com/luxfi/node/blob/main/vms/platformvm/state/state.go) - Staking state

### Gas Configuration

**Location**: `~/work/lux/node/gas/`
**GitHub**: [`github.com/luxfi/node/tree/main/gas`](https://github.com/luxfi/node/tree/main/gas)

**Files**:
- [`gas.go`](https://github.com/luxfi/node/blob/main/gas/gas.go) - Gas pricing and limits

### API Endpoints

**Balance Queries**:
- P-Chain: `platform.getBalance(address)`
- X-Chain: `avm.getBalance(address, assetID)`
- C-Chain: `eth_getBalance(address)`

**Staking Queries**:
- `platform.getCurrentValidators()` - Active validators
- `platform.getTotalStake()` - Total staked LUX
- `platform.getCurrentSupply()` - Total LUX supply

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
