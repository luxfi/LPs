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

```text
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
```markdown

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
```markdown

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
```text

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
```text

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
```text

**Reference Implementation:**
- [`lux/precompiles/AIMining.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/AIMining.sol)

### 6. NVTrust Chain-Binding Double-Spend Prevention

The core mechanism preventing AI work from being claimed on multiple chains.

#### 6.1 Design Principle

We avoid double-spend by **binding each unit of AI work to a specific chain before the compute runs**, and then having the GPU's confidential-compute environment sign an attested receipt that includes that chain ID.

That receipt is:
- **Unique** (per device + nonce)
- **Bound to one chain** (via chain_id in the attested context)
- **Signed by NVIDIA's NVTrust root**

So you cannot take one chunk of work and mint it on multiple chains without re-doing the compute.

#### 6.2 Work Context (Pre-Compute Commitment)

When a miner wants to do AI work, their node commits to a target chain:

```rust
pub struct WorkContext {
    pub chain_id: ChainId,         // HANZO / LUX / ZOO
    pub job_id: [u8; 32],          // Specific workload or block height
    pub model_hash: [u8; 32],      // Which model
    pub input_hash: [u8; 32],      // Which data / prompt
    pub device_id: [u8; 32],       // GPU identity
    pub nonce: [u8; 32],           // Unique per job
    pub timestamp: u64,            // Unix timestamp
}
```text

This context is passed into the GPU's NVTrust enclave as job metadata. The miner has effectively said: *"This work is for this chain, this job, with this model + input."*

**Reference Implementation:**
- [`lux/ai/pkg/attestation/nvtrust.go`](https://github.com/luxfi/ai/blob/main/pkg/attestation/nvtrust.go)

#### 6.3 GPU TEE Execution (NVTrust)

Inside the TEE, the GPU:
1. Verifies the code + model hashes (no tampering)
2. Runs the AI workload (inference / training)
3. Creates a work receipt:

```rust
pub struct WorkReceipt {
    pub context: WorkContext,      // Includes chain_id, job_id, etc.
    pub result_hash: [u8; 32],     // Hash of the output
    pub work_metrics: WorkMetrics, // FLOPs, steps, tokens, etc.
    pub device_id: [u8; 32],       // GPU identity
}

pub struct WorkMetrics {
    pub flops: u64,                // Floating point operations
    pub tokens_processed: u64,     // For LLM inference
    pub compute_time_ms: u64,      // Execution time
    pub memory_used_mb: u64,       // Peak VRAM usage
}
```text

The NVTrust enclave signs `WorkReceipt` with its attested key:

```rust
pub struct AttestedReceipt {
    pub receipt: WorkReceipt,
    pub nvtrust_signature: Vec<u8>,  // Rooted in NVIDIA hardware attestation
    pub spdm_evidence: SPDMEvidence, // SPDM measurement response
}
```text

This is cryptographic proof that: *"This exact device ran this exact workload with this exact context."*

**Reference Implementation:**
- [`lux/ai/pkg/attestation/attestation.go`](https://github.com/luxfi/ai/blob/main/pkg/attestation/attestation.go)
- [`shinkai/hanzo-node/hanzo-bin/hanzo-node/src/security/tee_attestation.rs`](https://github.com/hanzoai/node/blob/main/hanzo-bin/hanzo-node/src/security/tee_attestation.rs)

#### 6.4 Chain Verification and Minting

When the miner submits the receipt to a chain:

```rust
pub fn verify_and_mint(
    receipt: &AttestedReceipt,
    spent_set: &mut HashSet<[u8; 32]>,
    expected_chain_id: ChainId,
) -> Result<u64, MiningError> {
    // Step 1: Verify NVTrust signature is valid
    verify_nvtrust_signature(&receipt)?;

    // Step 2: Verify chain_id matches this chain
    if receipt.receipt.context.chain_id != expected_chain_id {
        return Err(MiningError::WrongChain);
    }

    // Step 3: Compute unique key
    let key = blake3::hash(&[
        &receipt.receipt.context.device_id[..],
        &receipt.receipt.context.nonce[..],
        &(receipt.receipt.context.chain_id as u32).to_le_bytes()[..],
    ]);

    // Step 4: Check spent set (double-spend prevention)
    if spent_set.contains(&key.into()) {
        return Err(MiningError::AlreadyMinted);
    }

    // Step 5: Mark as spent and mint
    spent_set.insert(key.into());
    let reward = calculate_reward(&receipt.receipt.work_metrics);
    Ok(reward)
}
```solidity

**Reference Implementation:**
- [`lux/ai/pkg/rewards/rewards.go`](https://github.com/luxfi/ai/blob/main/pkg/rewards/rewards.go)
- [`shinkai/hanzo-node/hanzo-libs/hanzo-mining/src/ledger.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/ledger.rs)

#### 6.5 Multi-Chain Mining (Same GPU, No Double-Spend)

The same GPU can mine for Hanzo, Lux, Zoo, etc., but:
- Each chain requires a **separate job** with a **different chain_id** in the NVTrust context
- Each job produces a **different attested receipt** with a different `(chain_id, job_id, nonce)` triple

| GPU | Job 1 | Job 2 | Job 3 |
|-----|-------|-------|-------|
| H100-001 | Hanzo (36963) | Zoo (200200) | Lux (96369) |
| H100-001 | nonce: 0x1a... | nonce: 0x2b... | nonce: 0x3c... |
| H100-001 | Receipt A | Receipt B | Receipt C |

**No "copy-paste" mining** - you can't run one workload and cash it in on three chains.

#### 6.6 Supported GPUs for NVTrust

| GPU Model | CC Support | Trust Score |
|-----------|------------|-------------|
| H100 | Full NVTrust | 95 |
| H200 | Full NVTrust | 95 |
| B100 | Full NVTrust + TEE-I/O | 100 |
| B200 | Full NVTrust + TEE-I/O | 100 |
| GB200 | Full NVTrust + TEE-I/O | 100 |
| RTX PRO 6000 | NVTrust | 85 |
| RTX 5090 | No CC | Software only (60) |
| RTX 4090 | No CC | Software only (60) |

### 7. Consensus Integration

Mining rewards require BFT finality from Lux consensus:

1. Miner submits AI work proof with ML-DSA signature
2. Validators verify NVTrust attestation and chain binding
3. Spent set checked for `hash(device_id || nonce || chain_id)`
4. Reward entry added to global ledger
5. 2-round BFT finality confirms reward
6. Teleport bridge unlocks cross-chain transfers

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
```text

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
| Solidity Precompile | [`lux/precompiles/AIMining.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/AIMining.sol) |

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

### Tokenomics (Per Chain)

| Parameter | Value | Description |
|-----------|-------|-------------|
| Supply Cap | 1,000,000,000 AI | 1B per chain |
| LP Allocation | 100,000,000 AI | 10% for liquidity seeding |
| Mining Allocation | 900,000,000 AI | 90% via Bitcoin schedule |
| Initial Price | $0.10/AI | 96% discount from market rate |
| LP Depth | $10,000,000 | Per chain at launch |

### Bitcoin-Aligned Halving Schedule

| Parameter | Bitcoin | AI Token |
|-----------|---------|----------|
| Block Time | 10 minutes | 2 seconds |
| Halving Interval | 210,000 blocks | 6,300,000 blocks |
| Halving Period | ~4 years | ~4 years (aligned) |
| Initial Reward | 50 BTC | 79.4 AI |
| Supply Cap | 21M BTC | 1B AI (per chain) |

**Halving Formula:**
```text
R(epoch) = 79.4 × 2^(-epoch) AI per block
```

**Epoch Timeline:**
| Epoch | Blocks | Years | Reward/Block | Cumulative Supply |
|-------|--------|-------|--------------|-------------------|
| 0 | 0-6.3M | 0-4 | 79.4 AI | 500M AI |
| 1 | 6.3M-12.6M | 4-8 | 39.7 AI | 750M AI |
| 2 | 12.6M-18.9M | 8-12 | 19.85 AI | 875M AI |
| 3 | 18.9M-25.2M | 12-16 | 9.925 AI | 937.5M AI |

### Launch Chains (10 at Genesis)

| Chain | Chain ID | Type | DEX | LP Pair |
|-------|----------|------|-----|---------|
| Lux C-Chain | 96369 | Native (Warp) | LuxSwap | AI/LUX |
| Hanzo EVM | 36963 | Native (Warp) | HanzoSwap | AI/LUX |
| Zoo EVM | 200200 | Native (Warp) | ZooSwap | AI/LUX |
| Ethereum | 1 | External (Teleport) | Uniswap V3 | AI/ETH |
| Base | 8453 | External (Teleport) | Aerodrome | AI/ETH |
| BNB Chain | 56 | External (Teleport) | PancakeSwap | AI/BNB |
| Arbitrum | 42161 | External (Teleport) | Camelot | AI/ETH |
| Optimism | 10 | External (Teleport) | Velodrome | AI/ETH |
| Polygon | 137 | External (Teleport) | QuickSwap | AI/MATIC |
| Avalanche | 43114 | External (Teleport) | Trader Joe | AI/AVAX |

**Global Supply at Launch:** 10B AI (10 chains × 1B each)

### Future Expansion

| Chains | Total Supply | Governance |
|--------|--------------|------------|
| 10 (launch) | 10B AI | Safe multi-sig (MPC) |
| 100 chains | 100B AI | DAO governance |
| 1000 chains | 1T AI | Cross-chain DAO |

New chains added via governance vote. Each chain deploys independent AI token contract with same parameters.

### Mining Rewards

**Miner Economics (At Launch Price):**
| GPUs | Hash Rate | Revenue/Hour | Cost/Hour | Profit |
|------|-----------|--------------|-----------|--------|
| 1 H100 | ~1 AI/hr | $0.10 | ~$2.50 | -$2.40 |
| 100 H100s | ~100 AI/hr | $10.00 | ~$250 | -$240 |
| 1000 H100s | ~1000 AI/hr | $100.00 | ~$2,500 | -$2,400 |

*Note: At launch price, mining is subsidized. As AI price appreciates toward market rate (~$2.50), profitability reaches parity.*

**Break-Even Analysis:**
- At $2.50/AI: Mining reaches cost parity with cloud compute
- At $5.00/AI: 2x profitable vs cloud
- At $10.00/AI: 4x profitable vs cloud

### Cross-Chain Fees
- Teleport transfers incur minimal bridge fees (~$1-5)
- EVM operations use standard gas pricing
- Precompile calls reduce gas vs pure Solidity

## Related Proposals

- **LP-0004**: Quantum Resistant Cryptography Integration
- **LP-0005**: Quantum Safe Wallets and Multisig Standard
- **HIP-006**: Hanzo AI Mining Protocol
- **ZIP-005**: Zoo AI Mining Integration

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
