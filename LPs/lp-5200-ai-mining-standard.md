---
lp: 5200
title: AI Mining Standard
description: Quantum-safe AI mining protocol with cross-chain Teleport integration for Lux ecosystem
author: Hanzo AI (@hanzoai), Lux Network (@luxfi), Zoo Labs (@zoolabs)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2024-11-30
requires: 0004, 0005
tags: [ai, consensus]
activation:
  flag: lp-2000-ai-mining
  hfName: "ai-mining"
  activationHeight: "0"
---

## Abstract

This LP defines the **Lux AI Mining Standard**, a quantum-safe protocol for mining AI compute rewards on the Lux L1 network using ML-DSA (FIPS 204) wallets. The protocol integrates with the Teleport bridge to enable seamless transfer of AI mining rewards to supported EVM L2 chains including Hanzo EVM (Chain ID: 36963), Zoo EVM (Chain ID: 200200), and Lux C-Chain (Chain ID: 96369).

## Activation

| Parameter          | Value                           |
|--------------------|--------------------------------|
| Flag string        | `lp2000-ai-mining`             |
| Default in code    | **false** until block TBD      |
| Deployment branch  | `v0.0.0-lp2000`                |
| Roll‑out criteria  | Testnet validation complete    |
| Back‑off plan      | Disable via flag               |

## Motivation

The convergence of AI and blockchain requires a native protocol for mining AI compute rewards. Current solutions lack:

1. **Quantum Safety**: No protection against quantum computer attacks on mining signatures
2. **Native L1 Support**: AI rewards exist only as ERC-20 tokens without native L1 integration
3. **Cross-Chain Interoperability**: Fragmented reward distribution across chains
4. **Consensus Integration**: No direct integration with BFT consensus for reward finality

This LP addresses these gaps by establishing a quantum-safe mining protocol at the L1 layer with native Teleport bridge integration.

## Specification

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hanzo Networks (L1)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐    │
│  │ AI Mining   │  │ Lux        │  │ Global Reward        │    │
│  │ Nodes       │──│ Consensus  │──│ Ledger               │    │
│  │ (ML-DSA)    │  │ (BFT)      │  │ (Quantum-Safe)       │    │
│  └─────────────┘  └─────────────┘  └──────────────────────┘    │
│                          │                                      │
│                   ┌──────┴──────┐                               │
│                   │  Teleport   │                               │
│                   │  Bridge     │                               │
│                   └──────┬──────┘                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
   │ Hanzo   │       │ Zoo     │       │ Lux     │
   │ EVM L2  │       │ EVM L2  │       │ C-Chain │
   │ (36963) │       │(200200) │       │ (43114) │
   └─────────┘       └─────────┘       └─────────┘
```

### 2. ML-DSA Mining Wallet

Mining wallets MUST use ML-DSA (Module-Lattice Digital Signature Algorithm) per FIPS 204:

| Security Level | Algorithm   | Public Key Size | Signature Size |
|---------------|-------------|-----------------|----------------|
| Level 2       | ML-DSA-44   | 1,312 bytes     | 2,420 bytes    |
| Level 3       | ML-DSA-65   | 1,952 bytes     | 3,309 bytes    |
| Level 5       | ML-DSA-87   | 2,592 bytes     | 4,627 bytes    |

**Address Derivation:**
```
address = "0x" + hex(BLAKE3(public_key)[0:20])
```

**Reference Implementation:**
- [`hanzo-mining/src/wallet.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/wallet.rs)

### 3. Global Reward Ledger

The ledger tracks all mining rewards across the network with Lux BFT consensus:

```rust
pub struct LedgerEntry {
    pub block_height: u64,      // Lux block when mined
    pub miner: Vec<u8>,         // ML-DSA public key
    pub reward: u64,            // AI tokens (atomic units)
    pub ai_hash: [u8; 32],      // BLAKE3 hash of AI work
    pub timestamp: u64,         // Unix timestamp
    pub signature: Vec<u8>,     // ML-DSA signature
}
```

**Reference Implementation:**
- [`hanzo-mining/src/ledger.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/ledger.rs)

### 4. Teleport Protocol

Cross-chain transfers use the Teleport bridge with quantum-safe signatures:

```rust
pub struct TeleportTransfer {
    pub teleport_id: String,        // Unique transfer ID
    pub source_chain: ChainId,      // Always Hanzo L1
    pub destination_chain: ChainId, // Target EVM chain
    pub sender: Vec<u8>,            // ML-DSA public key
    pub recipient: String,          // EVM address (0x...)
    pub amount: u64,                // AI tokens
    pub signature: Vec<u8>,         // ML-DSA signature
    pub status: TransferStatus,
}

pub enum ChainId {
    HanzoL1,           // Native L1 mining chain
    HanzoEVM = 36963,  // Hanzo EVM L2
    ZooEVM = 200200,   // Zoo EVM L2
    LuxCChain = 96369, // Lux C-Chain
}
```

**Reference Implementation:**
- [`hanzo-mining/src/evm.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/evm.rs)
- [`hanzo-mining/src/bridge.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/bridge.rs)

### 5. EVM Precompile Interface

A precompile at address `0x0300` enables EVM contracts to interact with AI mining:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAIMining {
    /// @notice Get mining balance for an address
    function miningBalance(address miner) external view returns (uint256);

    /// @notice Verify ML-DSA signature
    function verifyMLDSA(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool);

    /// @notice Claim teleported AI rewards
    function claimTeleport(bytes32 teleportId) external returns (uint256);

    /// @notice Get pending teleport transfers
    function pendingTeleports(address recipient) external view returns (bytes32[] memory);
}
```

**Reference Implementation:**
- [`lux/standard/src/precompiles/AIMining.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/AIMining.sol)

### 6. Consensus Integration

Mining rewards require BFT finality from Lux consensus:

1. Miner submits AI work proof with ML-DSA signature
2. Validators verify work and signature (69% quorum)
3. Reward entry added to global ledger
4. 2-round BFT finality confirms reward
5. Teleport bridge unlocks cross-chain transfers

## Rationale

### Why ML-DSA?
NIST selected ML-DSA (formerly CRYSTALS-Dilithium) as the primary post-quantum signature standard. Level 3 provides 128-bit quantum security matching current blockchain standards.

### Why Teleport over Traditional Bridges?
Teleport uses native L1 finality rather than relying on external validators, providing stronger security guarantees for AI reward transfers.

### Why Separate L1 Mining?
Native L1 mining enables direct consensus integration without smart contract overhead, providing faster finality and lower costs for high-frequency mining operations.

## Backwards Compatibility

This LP introduces new functionality without breaking existing features:

- Existing wallets continue to work on EVM chains
- Legacy transactions remain valid
- New ML-DSA addresses coexist with ECDSA addresses
- Teleport is opt-in for cross-chain transfers

## Test Cases

Test vectors are provided in the reference implementation:

```bash
cd hanzo-libs/hanzo-mining
cargo test
```

**Key Test Cases:**
1. `test_wallet_creation` - ML-DSA key generation
2. `test_wallet_signing` - Signature creation/verification
3. `test_ledger_operations` - Reward tracking
4. `test_teleport_transfer` - Cross-chain transfers
5. `test_bridge_creation` - Full bridge integration

## Reference Implementation

| Component | Location |
|-----------|----------|
| Mining Wallet | [`hanzo-mining/src/wallet.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/wallet.rs) |
| Global Ledger | [`hanzo-mining/src/ledger.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/ledger.rs) |
| EVM Integration | [`hanzo-mining/src/evm.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/evm.rs) |
| Bridge Protocol | [`hanzo-mining/src/bridge.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/bridge.rs) |
| Solidity Precompile | [`lux/standard/src/precompiles/AIMining.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/AIMining.sol) |

## Security Considerations

### Quantum Safety
ML-DSA provides NIST Level 3 (128-bit) quantum security. Key sizes are larger than ECDSA but provide long-term security against quantum attacks.

### Key Management
- Secret keys are zeroized on drop using the `zeroize` crate
- Wallet export uses ChaCha20Poly1305 AEAD encryption
- Passwords derive keys via Argon2 (not yet implemented, using BLAKE3)

### Teleport Security
- All transfers require valid ML-DSA signatures
- Destination chain verification prevents replay attacks
- Transfer IDs are unique (BLAKE3 hash of transfer data)

### Consensus Attacks
- 69% quorum threshold prevents minority attacks
- 2-round finality ensures reward immutability
- Invalid AI work rejected by validators

## Economic Impact

### Mining Rewards
- AI mining creates new AI tokens on L1
- Rewards distributed proportionally to AI compute contribution
- No additional gas costs for L1 mining operations

### Cross-Chain Fees
- Teleport transfers incur minimal bridge fees
- EVM operations use standard gas pricing
- Precompile calls reduce gas vs pure Solidity

## Related Proposals

- **LP-0004**: Quantum Resistant Cryptography Integration
- **LP-0005**: Quantum Safe Wallets and Multisig Standard
- **HIP-006**: Hanzo AI Mining Protocol
- **ZIP-005**: Zoo AI Mining Integration

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
