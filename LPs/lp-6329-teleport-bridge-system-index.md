---
lp: 6329
title: Teleport Bridge System Index
description: Master index and navigation guide for the Lux Network's Teleport cross-chain bridge system, unifying threshold cryptography, bridge operations, key management, and smart contract integration.
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Informational
category: Core
created: 2025-12-11
requires: 13, 14, 15, 17, 81, 103, 104
tags: [teleport, bridge, cross-chain]
---

## Abstract

This LP serves as the master index for the Teleport Bridge System, Lux Network's unified cross-chain protocol combining threshold cryptography, dedicated bridge chains, and smart contract custody. The Teleport system enables trustless, decentralized bridging between Lux Network and external blockchains including Ethereum, Bitcoin, Base, Arbitrum, Optimism, and Cosmos IBC chains. A single MPC-generated address works across all EVM-compatible chains, with threshold signatures (CGG21 for ECDSA, LSS for dynamic resharing, FROST for Schnorr, and Ringtail for quantum-safe extensions) ensuring no single party controls bridged funds. This index provides navigation to all related LPs, summarizes system architecture, and serves as the entry point for understanding the complete bridge infrastructure.

## Motivation

The Teleport Bridge System spans multiple LPs covering threshold cryptography, bridge operations, key management, and smart contract integration. Navigating this complex documentation requires a central index that provides a high-level overview of the system architecture, lists all component LPs, and explains how they relate to each other. This informational LP serves as the entry point for developers, auditors, and users seeking to understand or implement cross-chain bridging on Lux Network.

## System Overview

```
+-------------------------------------------------------------------------+
|                         Lux Network Chain Architecture                   |
+-------------------------------------------------------------------------+
|                                                                         |
|  MAINNET CHAINS (Live):                                                 |
|  +-----------------+  +-----------------+  +-----------------+          |
|  | P-Chain         |  | X-Chain         |  | C-Chain         |          |
|  | Platform        |  | Exchange        |  | Contracts       |          |
|  | Validators,     |  | UTXO Assets,    |  | EVM, Gnosis     |          |
|  | Native Multisig |  | Native Multisig |  | Safe (LP-0335)  |          |
|  +-----------------+  +-----------------+  +-----------------+          |
|  +-----------------+  +-----------------+  +-----------------+          |
|  | Q-Chain         |  | T-Chain         |  | B-Chain         |          |
|  | Query/Index     |  | ThresholdVM     |  | BridgeVM        |          |
|  |                 |  | MPC Signatures  |  | Cross-chain     |          |
|  |                 |  | (LP-0330)       |  | (LP-0331)       |          |
|  +-----------------+  +-----------------+  +-----------------+          |
|                              |                    |                     |
|                              +--------+-----------+                     |
|                                       |                                 |
|                              +--------v---------+                       |
|                              |  External Chains |                       |
|                              | ETH, BTC, Base,  |                       |
|                              | Arbitrum, Cosmos |                       |
|                              +------------------+                       |
|                                                                         |
|  EXPERIMENTAL:                            SPECIFICATION (RFC):          |
|  +-----------------+  +-----------------+  +-----------------+          |
|  | A-Chain (AIVM)  |  | Z-Chain (ZK)    |  | K-Chain (KMS)   |          |
|  | Mainnet: flag   |  | Devnet only     |  | LP-0336 RFC     |          |
|  | Devnet: default |  |                 |  +-----------------+          |
|  +-----------------+  +-----------------+  | I-Chain (DID)   |          |
|                                           | RFC pending     |          |
|                                           +-----------------+          |
+-------------------------------------------------------------------------+

Chain Legend:
- P,X,C,Q,T,B: Live at mainnet launch
- A,Z: Experimental (A behind flag on mainnet, Z devnet-only)
- K,I: Specification phase, seeking RFC approval
- No M-Chain: P-Chain/X-Chain provide native multisig
- No Relayers: B-Chain validators handle cross-chain observation
```

## Component LPs

### Mainnet Chains (Live at Launch)

| Chain | Description | Multisig Support | Status |
|-------|-------------|------------------|--------|
| **P-Chain** | Platform chain for validators, subnets, staking | Native N-of-M multisig for governance | **Live** |
| **X-Chain** | Exchange chain for UTXO-based transfers | Native UTXO multisig | **Live** |
| **C-Chain** | EVM-compatible contract chain | Smart contract multisig (Gnosis Safe) | **Live** |
| **Q-Chain** | Query/Index chain | Standard | **Live** |
| **T-Chain** | Threshold signatures (ThresholdVM) | MPC threshold signatures | **Live** |
| **B-Chain** | Bridge operations (BridgeVM) | Decentralized cross-chain | **Live** |

### Experimental Chains

| Chain | Description | Availability | Status |
|-------|-------------|--------------|--------|
| **A-Chain** | Application chain (AIVM) | Devnet default, Mainnet behind experimental flag | Experimental |
| **Z-Chain** | Zero-Knowledge proofs chain | Devnet only | Experimental |

### Specification Phase (Seeking RFC)

| LP | Chain | Description | Status |
|----|-------|-------------|--------|
| [LP-0336](./lp-0336-k-chain-keymanagementvm-specification.md) | K-Chain | KeyManagementVM - ML-KEM post-quantum encryption, secrets management | RFC |
| TBD | I-Chain | Decentralized Identity chain (DID/Verifiable Credentials) | RFC |
| [LP-0325](./lp-0325-kms-hardware-security-module-integration.md) | - | HSM Integration (8 providers, PKCS#11) | Draft |

### Teleport Bridge Chain Specifications

| LP | Title | Description | Status |
|----|-------|-------------|--------|
| [LP-0330](./lp-0330-t-chain-thresholdvm-specification.md) | T-Chain ThresholdVM | All MPC/threshold operations: DKG, signing (CGG21, FROST), resharing (LSS) | Draft |
| [LP-0331](./lp-0331-b-chain-bridgevm-specification.md) | B-Chain BridgeVM | Bridge operations: deposits, withdrawals, cross-chain observation via validators | Draft |

### Protocols

| LP | Title | Description | Status |
|----|-------|-------------|--------|
| [LP-0332](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md) | Teleport Architecture | Complete cross-chain bridge protocol specification | Draft |
| [LP-0333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md) | LSS Dynamic Rotation | Validator-integrated signer rotation without key reconstruction | Draft |
| [LP-0334](./lp-0334-per-asset-threshold-key-management.md) | Per-Asset Keys | Independent threshold configurations per bridged asset | Draft |

### Integration

| LP | Title | Description | Status |
|----|-------|-------------|--------|
| [LP-0335](./lp-0335-bridge-smart-contract-integration.md) | Smart Contract Integration | Bridge contracts (Vault, Router, Registry) with MPC signatures | Draft |
| [LP-0339](./lp-0339-bridge-security-emergency-procedures.md) | Security Procedures | Operational security, incident response, key rotation | Draft |
| [LP-0340](./lp-0340-unified-bridge-sdk-specification.md) | Bridge SDK | Client libraries for TypeScript, Go, and Rust | Draft |
| [LP-0341](./lp-0341-decentralized-secrets-management-infisical-integration.md) | Secrets Management | Decentralized secrets management with HSM | Draft |

### Architecture Notes

**Multisig**: Traditional n-of-m multisig is handled natively by P-Chain and X-Chain. For C-Chain, Gnosis Safe is the recommended approach. Threshold cryptography (where no single party holds the complete key) is provided by T-Chain.

**Relayers**: Bridge relayer functionality (external chain observation, fee funding, transaction execution) is fully integrated into B-Chain's BridgeVM via the RelayerRegistry. Relayers register with B-Chain and earn fees for executing cross-chain transactions.

### Foundation LPs

| LP | Title | Description |
|----|-------|-------------|
| [LP-13](./lp-0013-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md) | M-Chain MPC Custody | Original MPC custody and swap signature layer |
| [LP-14](./lp-0014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md) | CGG21 Threshold ECDSA | UC non-interactive threshold ECDSA with identifiable aborts |
| [LP-103](./lp-0103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing.md) | LSS Protocol | Linear Secret Sharing with dynamic resharing |
| [LP-104](./lp-0104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa.md) | FROST | Flexible Round-Optimized Schnorr Threshold Signatures |

## Architecture Summary

### T-Chain (ThresholdVM) - LP-0330

The T-Chain provides threshold cryptography services:

- **Algorithms**: CGG21 (ECDSA), FROST (Schnorr/EdDSA), LSS (resharing), Ringtail (quantum-safe)
- **Key Management**: Per-key threshold configuration, dynamic signer sets
- **Operations**: DKG (KeyGenTx), signing (SignRequestTx/SignResponseTx), resharing (ReshareTx)
- **Security**: Identifiable aborts, proactive refresh, Byzantine fault tolerance

```go
// T-Chain managed key structure
type ManagedKey struct {
    KeyID        KeyID              // "eth-usdc", "btc-native"
    PublicKey    []byte             // Aggregated public key (constant across reshares)
    Algorithm    SignatureAlgorithm // CGG21, FROST_SCHNORR, FROST_EDDSA
    Threshold    uint32             // t: minimum signers required
    TotalParties uint32             // n: total parties holding shares
    PartyIDs     []party.ID         // Current signer set
    Generation   uint32             // Incremented on reshare
}
```

### B-Chain (BridgeVM) - LP-0331

The B-Chain orchestrates cross-chain operations:

- **Operations**: Deposits, withdrawals, cross-chain swaps
- **State Management**: Pending transactions, confirmations, execution tracking
- **Chain Support**: EVM (Ethereum, L2s), Bitcoin (Taproot), Cosmos (IBC)
- **Security**: Multi-relayer observation, fraud proofs, daily limits

```go
// B-Chain bridge state
type BridgeState struct {
    PendingDeposits    map[DepositID]*DepositRecord
    PendingWithdrawals map[WithdrawID]*WithdrawRecord
    PendingSwaps       map[SwapID]*SwapRecord
    AssetRegistry      map[AssetID]*AssetInfo
    ChainStates        map[uint64]*ChainState
}
```

### Teleport Architecture - LP-0332

The unified protocol specification covers:

- **Deposit Flow**: External chain deposit -> relayer observation -> B-Chain confirmation -> T-Chain signature -> C-Chain mint
- **Withdrawal Flow**: C-Chain burn -> B-Chain request -> T-Chain signature -> external chain release
- **Cross-Chain Swaps**: Atomic operations with signature coordination
- **Fee Distribution**: Validator (50%), relayer (20%), treasury (20%), burn (10%)

### Dynamic Signer Rotation - LP-0333

LSS-based rotation without key reconstruction:

- **Reshare Protocol**: Old signers generate subshares for new signers using Lagrange interpolation
- **Generation Tracking**: Monotonic generation numbers with atomic activation
- **Triggers**: Validator changes, proactive refresh, emergency rotation
- **Rollback**: Safe reversion to previous generation on failure

```
Generation 0: Parties A, B, C (2-of-3)
     |
     | ReshareTx(newParties=[A, B, D, E], threshold=3)
     v
Generation 1: Parties A, B, D, E (3-of-4)  <- Same public key!
```

### Per-Asset Key Management - LP-0334

Independent threshold configurations:

| Asset Tier | Threshold | Parties | Latency | Use Case |
|------------|-----------|---------|---------|----------|
| Micro (<$1K) | 2-of-3 | 3 | <150ms | Retail payments |
| Small ($1K-$10K) | 2-of-3 | 3 | <200ms | Standard transactions |
| Medium ($10K-$100K) | 3-of-5 | 5 | <400ms | Business transactions |
| Large ($100K-$1M) | 4-of-7 | 7 | <600ms | Institutional |
| Custody (Cold) | 7-of-11 | 11 | <2s | Treasury reserves |

### Smart Contract Integration - LP-0335

Five core contracts for on-chain bridge operations:

1. **BridgeVault**: Asset custody with MPC signature verification (EIP-712)
2. **BridgeRouter**: Transaction routing with fee calculation
3. **TokenRegistry**: Cross-chain asset mapping
4. **BridgeGovernor**: Timelocked parameter governance
5. **EmergencyBrake**: Circuit breaker for security incidents

## Network Configuration

### Mainnet Deployment

| Component | Endpoint/Address | Chain ID |
|-----------|------------------|----------|
| LUX C-Chain RPC | `https://api.lux.network/ext/bc/C/rpc` | 96369 |
| T-Chain RPC | `https://api.lux.network/ext/bc/T/rpc` | - |
| B-Chain RPC | `https://api.lux.network/ext/bc/B/rpc` | - |
| LUX Teleporter | 0x5B562e80A56b600d729371eB14fE3B83298D0642 | 96369 |
| ETH Teleporter | 0xebD1Ee9BCAaeE50085077651c1a2dD452fc6b72e | 1 |
| Base Teleporter | 0x37d9fB96722ebDDbC8000386564945864675099B | 8453 |
| Arbitrum Teleporter | 0xA60429080752484044e529012aA46e1D691f50Ab | 42161 |

### Testnet Deployment

| Component | Endpoint/Address | Chain ID |
|-----------|------------------|----------|
| LUX Testnet RPC | `https://api-test.lux.network/ext/bc/C/rpc` | 96368 |
| T-Chain Testnet | `https://api-test.lux.network/ext/bc/T/rpc` | - |
| B-Chain Testnet | `https://api-test.lux.network/ext/bc/B/rpc` | - |

### Node Requirements

| Component | CPU | RAM | Storage | Network |
|-----------|-----|-----|---------|---------|
| Full Node | 8 cores | 32 GB | 500 GB NVMe | 100 Mbps |
| Validator/Signer | 16+ cores | 64 GB | 1 TB NVMe | 1 Gbps |
| HSM (mainnet) | - | - | - | Required |

### Configuration

```json
{
  "network": {
    "chainId": "T",
    "rpcPort": 9630,
    "stakingPort": 9631
  },
  "mpc": {
    "threshold": 3,
    "totalParties": 5,
    "protocol": "cgg21",
    "refreshEpochBlocks": 43200
  },
  "keys": {
    "bridge-main": {
      "protocol": "lss",
      "threshold": 3,
      "parties": 5,
      "curve": "secp256k1"
    }
  }
}
```

## Quick Start Guide

### 1. Running a Teleport Node

```bash
# Build the node
cd ~/work/lux/node
./scripts/build.sh

# Start with Teleport chains enabled
./build/luxd \
  --network-id=96369 \
  --vm-aliases='{"B":"bridgevm","T":"thresholdvm"}' \
  --threshold-config='{"threshold":3,"totalParties":5}' \
  --http-port=9630 \
  --staking-port=9631
```

### 2. Joining the Signer Committee

```bash
# Register as threshold signer
curl -X POST http://localhost:9630/ext/bc/T/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "threshold_joinCommittee",
    "params": {
      "partyId": 1,
      "stakeProof": "0x...",
      "publicKey": "0x..."
    }
  }'
```

### 3. Initiating a Bridge Transfer

```typescript
import { BridgeRPCClient, ThresholdRPCClient } from '@luxfi/bridge-sdk';

const bridgeClient = new BridgeRPCClient({
  endpoint: 'http://localhost:9630/ext/bc/B/rpc',
});

// Deposit ETH to Lux
const { depositId } = await bridgeClient.initiateDeposit({
  token: '0x0000000000000000000000000000000000000000',
  amount: '1000000000000000000', // 1 ETH
  destChainId: '96369',
  recipient: '0x...',
});

// Monitor status
const status = await bridgeClient.getBridgeStatus(depositId);
```

### 4. Requesting a Threshold Signature

```bash
# Request signature from T-Chain
curl -X POST http://localhost:9630/ext/bc/T/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "threshold_sign",
    "params": {
      "keyId": "eth-usdc-bridge",
      "messageHash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      "messageType": "RAW_HASH",
      "deadline": 1000
    }
  }'
```

## Repository Map

| Repository | Description | Path |
|------------|-------------|------|
| [github.com/luxfi/node](https://github.com/luxfi/node) | T-Chain (ThresholdVM), B-Chain (BridgeVM) implementations | `~/work/lux/node` |
| [github.com/luxfi/bridge](https://github.com/luxfi/bridge) | Bridge monorepo (SDK, relayer, UI) | `~/work/lux/bridge` |
| [github.com/luxfi/threshold](https://github.com/luxfi/threshold) | Threshold cryptography (CGG21, LSS, FROST, Ringtail) | `~/work/lux/threshold` |
| [github.com/luxfi/crypto](https://github.com/luxfi/crypto) | Core cryptographic primitives | `~/work/lux/crypto` |
| [github.com/luxfi/mpc](https://github.com/luxfi/mpc) | MPC signer daemon and protocols | `~/work/lux/mpc` |
| [github.com/luxfi/sdk](https://github.com/luxfi/sdk) | Client SDKs (TypeScript, Go) | `~/work/lux/sdk` |

### Key Source Files

```
node/vms/thresholdvm/
├── vm.go                   # ThresholdVM implementation
├── state.go                # State management
├── tx/
│   ├── keygen.go           # KeyGenTx
│   ├── sign_request.go     # SignRequestTx
│   ├── reshare.go          # ReshareTx
│   └── ...
├── protocol/
│   ├── cggmp21/            # CGG21 implementation
│   ├── frost/              # FROST implementation
│   └── lss/                # LSS resharing

node/vms/bridgevm/
├── vm.go                   # BridgeVM implementation
├── state.go                # Bridge state
├── tx_deposit.go           # Deposit handling
├── tx_withdraw.go          # Withdrawal handling
└── watchers/
    ├── evm_watcher.go      # EVM chain observer
    └── btc_watcher.go      # Bitcoin observer

threshold/
├── protocols/cmp/          # CGG21 protocol
├── protocols/frost/        # FROST protocol
├── protocols/musig2/       # MuSig2 for Bitcoin
└── protocols/ringtail/     # Quantum-safe signatures
```

## Roadmap

### Phase 1: Specifications (Current)
- [x] T-Chain specification (LP-0330) - ThresholdVM
- [x] B-Chain specification (LP-0331) - BridgeVM
- [x] Teleport architecture (LP-0332)
- [x] LSS rotation protocol (LP-0333)
- [x] Per-asset key management (LP-0334)
- [x] Smart contract integration (LP-0335)
- [x] Security procedures (LP-0339)
- [x] Bridge SDK specification (LP-0340)
- [x] Secrets management (LP-0341)
- [ ] K-Chain KMS specification (LP-0336) - RFC review
- [ ] I-Chain DID specification - RFC pending

### Phase 2: Mainnet Launch
**Chains Live at Launch:** P-Chain, X-Chain, C-Chain, Q-Chain, T-Chain, B-Chain
- [ ] ThresholdVM implementation
- [ ] BridgeVM implementation
- [ ] CGG21 + LSS protocol integration
- [ ] Bridge smart contracts deployment
- [ ] SDK release (LP-0340)

### Phase 3: Experimental Features
- [ ] A-Chain (AIVM) - behind experimental flag on mainnet, default on devnet
- [ ] Z-Chain (ZK) - devnet only initially
- [ ] Ringtail quantum-safe signatures

### Phase 4: RFC Implementations
- [ ] K-Chain (KMS) - post RFC approval
- [ ] I-Chain (DID) - post RFC approval
- [ ] External security audits
- [ ] Bug bounty program

### Phase 5: Expansion
- [ ] Cosmos IBC integration
- [ ] Solana support
- [ ] Cross-chain DEX aggregation
- [ ] A-Chain graduation to mainnet default
- [ ] Z-Chain graduation to mainnet

## Glossary

| Term | Definition |
|------|------------|
| **CGG21** | Canetti-Gennaro-Goldfeder-Makriyannis threshold ECDSA protocol with UC security and identifiable aborts |
| **DKG** | Distributed Key Generation - protocol for creating shared keys without trusted dealer |
| **FROST** | Flexible Round-Optimized Schnorr Threshold signatures for EdDSA/Schnorr |
| **Generation** | Version number of a threshold key's share distribution (increments on reshare) |
| **LSS** | Linear Secret Sharing - resharing protocol enabling signer rotation without key reconstruction |
| **MPC** | Multi-Party Computation - cryptographic techniques for distributed computation |
| **Reshare** | Process of redistributing key shares to new signer set while preserving public key |
| **Ringtail** | Lattice-based post-quantum threshold signature scheme |
| **T-Chain** | Threshold Chain - dedicated chain for threshold cryptography operations |
| **B-Chain** | Bridge Chain - dedicated chain for bridge operation coordination |
| **Threshold (t)** | Minimum number of signers required to produce a valid signature |
| **Total Parties (n)** | Total number of signers holding key shares |
| **Warp Message** | Cross-chain message protocol within Lux Network |

## Security Model

### Threat Model

**Adversary Capabilities:**
- Can corrupt up to t-1 signer nodes
- Can observe all network traffic
- Can delay (but not drop) messages
- Has full control over corrupted nodes

**Security Goals:**
- **Unforgeability**: Cannot forge signatures without t shares
- **Key Secrecy**: Cannot learn private key from fewer than t shares
- **Liveness**: Protocol completes if t honest parties participate
- **Identifiable Abort**: Misbehaving parties can be identified and slashed

### Slashing Conditions

| Violation | Penalty | Evidence |
|-----------|---------|----------|
| Invalid share | 10% stake | VSS verification failure |
| Commitment mismatch | 20% stake | Commitment != H(response) |
| Double signing | 50% stake | Two valid shares for same session |
| Offline during session | 5% stake | No response before deadline |
| Key material exposure | 100% stake | Signature analysis proof |

## Related Documentation

- [API Access Guide](../docs/API_ACCESS_GUIDE.md)
- [Network Status](../docs/NETWORK_STATUS.md)
- [POA Implementation Summary](../docs/POA_IMPLEMENTATION_SUMMARY.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
