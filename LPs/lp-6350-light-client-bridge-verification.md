---
lp: 6350
title: Light Client Bridge Verification
description: Trustless cross-chain verification using on-chain light clients to verify source chain consensus without MPC oracles.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
tags: [teleport, bridge, light-client, trustless, quasar]
requires: [3001]
order: 350
---

## Abstract

This LP specifies a trustless bridge verification mechanism using on-chain light clients. Instead of relying on MPC oracle signatures, users submit cryptographic proofs that source chain blocks are finalized. Each chain deploys a light client contract that tracks the other chain's consensus, enabling fully trustless cross-chain asset transfers without any honest-majority assumptions.

## Motivation

The current Teleport Protocol (LP-3001) relies on MPC oracles with threshold signatures. While this provides strong security through economic incentives, it still requires trusting that a majority of MPC nodes are honest. For maximum security and true decentralization, we can eliminate oracle trust entirely by verifying source chain consensus directly on the destination chain.

Light client verification provides:

* **Cryptographic Security**: Trust based on cryptographic proofs, not economic incentives
* **Trustless Operation**: No reliance on external oracle nodes
* **Censorship Resistance**: Any user can submit proofs, no permissioned set
* **Post-Quantum Security**: Lux Quasar provides PQ-safe finality anchors

## Specification

### 1. Light Client Contracts

#### Ethereum Light Client (deployed on Lux)

```solidity
interface IEthereumLightClient {
    /// @notice Verify an Ethereum beacon chain block header
    /// @param header The beacon block header
    /// @param syncCommitteeSignature BLS signature from sync committee
    /// @param syncCommitteeBits Bitmap of which validators signed
    function verifyHeader(
        BeaconBlockHeader calldata header,
        bytes calldata syncCommitteeSignature,
        bytes32 syncCommitteeBits
    ) external;
    
    /// @notice Check if a block is finalized
    function isFinalized(bytes32 blockHash) external view returns (bool);
    
    /// @notice Get execution layer state root for a finalized block
    function getStateRoot(bytes32 blockHash) external view returns (bytes32);
    
    /// @notice Get receipts root for a finalized block
    function getReceiptsRoot(bytes32 blockHash) external view returns (bytes32);
}
```

The Ethereum light client tracks:
- Sync committee rotations (every ~27 hours)
- Finalized block headers (requires 2/3 sync committee signatures)
- Execution layer state roots (for storage proofs)

#### Lux Light Client (deployed on Ethereum)

Lux uses **Quasar consensus** with dual-certificate finality: both a BLS aggregate signature AND a post-quantum Ringtail threshold signature are required for block finality.

```solidity
interface ILuxLightClient {
    /// @notice Quasar dual-certificate block finality proof
    struct QuasarCert {
        bytes blsSignature;      // BLS aggregate signature
        bytes ringtailSignature; // Post-quantum Ringtail threshold sig
        bytes32 validatorBits;   // Bitmap of signing validators
    }
    
    /// @notice Finality anchor types (choose based on gas/latency tradeoff)
    enum AnchorType {
        BLOCK_CERT,       // Per-block: immediate, higher gas
        QUANTUM_BUNDLE,   // ~3s batches: balanced
        EPOCH_CHECKPOINT  // ~10min epochs: lowest gas, higher latency
    }
    
    /// @notice QuantumBundle anchor (~3 second batches)
    struct QuantumBundle {
        bytes32 merkleRoot;       // Root of block hashes in bundle
        bytes ringtailSignature;  // Ringtail threshold sig over root
        uint64 startBlock;
        uint64 endBlock;
    }
    
    /// @notice EpochCheckpoint anchor (~10 minute epochs)
    struct EpochCheckpoint {
        bytes32 merkleRoot;       // Root of block range
        bytes ringtailSignature;  // Grouped Ringtail threshold sig
        uint64 epochNumber;
        uint64 startBlock;
        uint64 endBlock;
    }
    
    /// @notice Verify block with per-block Quasar certificate
    function verifyBlockCert(
        LuxBlockHeader calldata header,
        QuasarCert calldata cert
    ) external returns (bool);
    
    /// @notice Verify block inclusion in QuantumBundle
    function verifyQuantumBundle(
        bytes32 blockHash,
        bytes32[] calldata merkleProof,
        QuantumBundle calldata bundle
    ) external returns (bool);
    
    /// @notice Verify block inclusion in EpochCheckpoint
    function verifyEpochCheckpoint(
        bytes32 blockHash,
        bytes32[] calldata merkleProof,
        EpochCheckpoint calldata checkpoint
    ) external returns (bool);
    
    /// @notice Check if a block is finalized (any anchor type)
    function isFinalized(bytes32 blockHash) external view returns (bool);
    
    /// @notice Get state root for a finalized block
    function getStateRoot(bytes32 blockHash) external view returns (bytes32);
}
```

The Lux light client tracks:
- P-Chain validator set with **dual keys** (BLS + Ringtail pubkeys)
- C-Chain block finality via Quasar dual-certificate consensus
- Three finality anchor options for gas/latency optimization

### 2. Quasar Validator Set

Validators in Quasar carry both classical and post-quantum key material:

```solidity
struct QuasarValidator {
    bytes32 nodeId;
    bytes blsPubKey;      // BLS12-381 public key
    bytes ringtailPub;    // Ringtail (LWE-based) public material
    uint256 stake;
}

struct ValidatorSet {
    QuasarValidator[] validators;
    uint256 totalStake;
    uint64 epoch;
}
```

### 3. Header Sync Process

#### Ethereum → Lux

1. **Sync Committee Updates**: Every ~27 hours, update the sync committee on the Lux light client
2. **Header Submission**: Submit finalized beacon block headers with sync committee signatures
3. **Execution Payload**: Extract execution layer state/receipts roots

```solidity
struct BeaconBlockHeader {
    uint64 slot;
    uint64 proposerIndex;
    bytes32 parentRoot;
    bytes32 stateRoot;
    bytes32 bodyRoot;
}

struct ExecutionPayload {
    bytes32 parentHash;
    address feeRecipient;
    bytes32 stateRoot;
    bytes32 receiptsRoot;
    bytes logsBloom;
    bytes32 prevRandao;
    uint64 blockNumber;
    uint64 gasLimit;
    uint64 gasUsed;
    uint64 timestamp;
    bytes extraData;
    uint256 baseFeePerGas;
    bytes32 blockHash;
    bytes32 transactionsRoot;
    bytes32 withdrawalsRoot;
}
```

#### Lux → Ethereum

1. **Validator Set Updates**: Track P-Chain validator set changes (both BLS and Ringtail keys)
2. **Anchor Submission**: Choose anchor type based on use case:
   - **BlockCert**: Immediate finality, ~500k gas
   - **QuantumBundle**: ~3s batches, ~300k gas (recommended)
   - **EpochCheckpoint**: ~10min epochs, ~200k gas
3. **Dual Signature Verification**: Verify BOTH BLS and Ringtail signatures for Quasar finality

### 4. Bridge Integration

The light client enables trustless claim verification:

```solidity
interface ILightClientBridge {
    /// @notice Claim bridged assets with light client proof
    /// @param sourceBlockHash Block hash containing the burn event
    /// @param anchorProof Quasar finality proof (BlockCert, Bundle, or Checkpoint)
    /// @param receiptProof Merkle proof of receipt inclusion
    /// @param claim The claim data
    function claimWithLightClient(
        bytes32 sourceBlockHash,
        bytes calldata anchorProof,
        bytes calldata receiptProof,
        ClaimData calldata claim
    ) external;
}
```

### 5. Security Considerations

#### Finality Guarantees

| Chain | Finality Type | Time to Finality | PQ-Safe |
|-------|---------------|------------------|---------|
| Ethereum | Casper FFG | ~15 minutes | No |
| Lux C-Chain | Quasar (BLS + Ringtail) | ~2 seconds | Yes |

#### Quasar Dual-Certificate Security

Quasar requires BOTH signatures for finality:
- **BLS**: Fast verification, classical security (~128-bit)
- **Ringtail**: LWE-based threshold signatures, post-quantum secure

An attacker must break BOTH cryptographic assumptions to forge finality proofs.

#### Attack Vectors

1. **Long-range attacks**: Mitigated by sync committee/validator set checkpoints
2. **Eclipse attacks**: Mitigated by multiple header submitters
3. **Quantum attacks**: Mitigated by Ringtail PQ signatures (Lux → external)
4. **Reorg attacks**: Wait for sufficient finality depth

### 6. Gas Costs

| Operation | Anchor Type | Estimated Gas |
|-----------|-------------|---------------|
| Validator set update | - | ~800,000 |
| Header verification | BlockCert | ~500,000 |
| Header verification | QuantumBundle | ~300,000 |
| Header verification | EpochCheckpoint | ~200,000 |
| Claim with proof | - | ~150,000 |

## Rationale

Light client verification is the gold standard for trustless bridging. Quasar's dual-certificate finality provides:

1. **Mathematical Security**: Security relies on cryptographic hardness, not economic assumptions
2. **Post-Quantum Safety**: Ringtail signatures protect against future quantum attacks
3. **Flexible Anchors**: Choose gas/latency tradeoff per use case
4. **Permissionless Operation**: Anyone can run a header submitter

The trade-off is increased gas costs and complexity compared to MPC oracles.

## Backwards Compatibility

This LP extends LP-3001 (Teleport Protocol) with an additional verification path. The existing MPC oracle path remains available for users who prefer faster finality:

```solidity
enum ProofType {
    MPC_ORACLE,       // LP-3001: Fast, trusted oracles
    LIGHT_CLIENT,     // LP-6350: Trustless, Quasar dual-cert
    ZK_PROOF,         // LP-6352: Constant-size ZK proofs
    ZK_PRIVATE        // LP-6353: Private bridging
}

function claim(ClaimData calldata claim, bytes calldata proof, ProofType proofType) external {
    if (proofType == ProofType.MPC_ORACLE) {
        _verifyOracleSignature(claim, proof);
    } else if (proofType == ProofType.LIGHT_CLIENT) {
        _verifyQuasarLightClientProof(claim, proof);
    }
    _processClaim(claim);
}
```

## Test Cases

1. Verify Ethereum sync committee signature aggregation
2. Verify Lux Quasar dual-certificate (BLS + Ringtail)
3. Verify QuantumBundle with Merkle inclusion proof
4. Verify EpochCheckpoint with Merkle inclusion proof
5. Reject headers with only BLS signature (missing Ringtail)
6. Reject headers with only Ringtail signature (missing BLS)
7. Process claims with valid light client proofs
8. Reject claims with invalid receipt proofs

## Reference Implementation

- Light Client: `/bridge/contracts/contracts/lightclient/`
- Ethereum LC: `EthereumLightClient.sol`
- Lux Quasar LC: `QuasarLightClient.sol`
- Integration: `LightClientBridge.sol`

## Security Considerations

1. **Sync Committee Compromise**: If 2/3 of Ethereum sync committee is malicious, false headers could be accepted. Mitigated by the ~$10B economic security of Ethereum validators.

2. **Quasar Validator Compromise**: Requires compromising BOTH BLS and Ringtail keys for 2/3+ stake. Dual-key requirement significantly increases attack difficulty.

3. **Quantum Threats**: Ethereum direction (ETH→Lux) uses BLS-only sync committee. For full PQ safety, wrap in ZK proof on Z-Chain (LP-6352).

4. **Header Submission Liveness**: Requires at least one honest header submitter. Can be incentivized through fees.

