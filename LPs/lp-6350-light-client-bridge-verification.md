---
lp: 6350
title: Light Client Bridge Verification
description: Trustless cross-chain verification using on-chain light clients to verify source chain consensus without MPC oracles.
author: Claude (@anthropic)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
tags: [teleport, bridge, light-client, trustless]
requires: [3001]
order: 350
---

## Abstract

This LP specifies a trustless bridge verification mechanism using on-chain light clients. Instead of relying on MPC oracle signatures, users submit cryptographic proofs that source chain blocks are finalized. Each chain deploys a light client contract that tracks the other chain's consensus, enabling fully trustless cross-chain asset transfers without any honest-majority assumptions.

## Motivation

The current Teleport Protocol (LP-3001) relies on MPC oracles with 2-of-3 threshold signatures. While this provides strong security through economic incentives, it still requires trusting that a majority of MPC nodes are honest. For maximum security and true decentralization, we can eliminate oracle trust entirely by verifying source chain consensus directly on the destination chain.

Light client verification provides:

* **Cryptographic Security**: Trust based on cryptographic proofs, not economic incentives
* **Trustless Operation**: No reliance on external oracle nodes
* **Censorship Resistance**: Any user can submit proofs, no permissioned set
* **Reduced Operating Costs**: No need to run and maintain MPC infrastructure

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

```solidity
interface ILuxLightClient {
    /// @notice Verify a Lux block header
    /// @param header The Lux block header
    /// @param signature Aggregated BLS signature from validators
    /// @param validatorBits Bitmap of which validators signed
    function verifyHeader(
        LuxBlockHeader calldata header,
        bytes calldata signature,
        bytes32 validatorBits
    ) external;
    
    /// @notice Check if a block is finalized
    function isFinalized(bytes32 blockHash) external view returns (bool);
    
    /// @notice Get state root for a finalized block
    function getStateRoot(bytes32 blockHash) external view returns (bytes32);
}
```

The Lux light client tracks:
- P-Chain validator set changes
- C-Chain block finality (Snow consensus)
- Aggregated BLS signatures from validators

### 2. Header Sync Process

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

1. **Validator Set Updates**: Track P-Chain validator set changes
2. **Header Submission**: Submit C-Chain block headers with aggregated BLS signatures
3. **Finality Confirmation**: Verify 2/3+ stake has attested to finality

### 3. Bridge Integration

The light client enables trustless claim verification:

```solidity
interface ILightClientBridge {
    /// @notice Claim bridged assets with light client proof
    /// @param sourceBlockHash Block hash containing the burn event
    /// @param receiptProof Merkle proof of receipt inclusion
    /// @param claim The claim data
    function claimWithLightClient(
        bytes32 sourceBlockHash,
        bytes calldata receiptProof,
        ClaimData calldata claim
    ) external;
}
```

### 4. Security Considerations

#### Finality Guarantees

| Chain | Finality Type | Time to Finality |
|-------|---------------|------------------|
| Ethereum | Casper FFG | ~15 minutes |
| Lux C-Chain | Snow Consensus | ~2 seconds |

#### Attack Vectors

1. **Long-range attacks**: Mitigated by sync committee checkpoints
2. **Eclipse attacks**: Mitigated by multiple header submitters
3. **Reorg attacks**: Wait for sufficient finality depth

### 5. Gas Costs

| Operation | Estimated Gas |
|-----------|---------------|
| Sync committee update | ~500,000 |
| Header verification | ~200,000 |
| Claim with proof | ~300,000 |

## Rationale

Light client verification is the gold standard for trustless bridging. While more complex than oracle-based approaches, it provides:

1. **Mathematical Security**: Security relies on cryptographic hardness, not economic assumptions
2. **Permissionless Operation**: Anyone can run a header submitter
3. **Composability**: Other protocols can build on top of verified headers

The trade-off is increased gas costs and finality latency compared to MPC oracles.

## Backwards Compatibility

This LP extends LP-3001 (Teleport Protocol) with an additional verification path. The existing MPC oracle path remains available for users who prefer faster finality. Smart contracts support both verification methods:

```solidity
function claim(ClaimData calldata claim, bytes calldata proof, ProofType proofType) external {
    if (proofType == ProofType.MPC_ORACLE) {
        _verifyOracleSignature(claim, proof);
    } else if (proofType == ProofType.LIGHT_CLIENT) {
        _verifyLightClientProof(claim, proof);
    }
    _processClaim(claim);
}
```

## Test Cases

1. Verify Ethereum sync committee signature aggregation
2. Verify Lux validator BLS signature aggregation
3. Submit and verify finalized headers
4. Reject invalid headers with insufficient signatures
5. Process claims with valid light client proofs
6. Reject claims with invalid receipt proofs

## Reference Implementation

- Light Client: `/bridge/contracts/contracts/lightclient/`
- Ethereum LC: `EthereumLightClient.sol`
- Lux LC: `LuxLightClient.sol`
- Integration: `LightClientBridge.sol`

## Security Considerations

1. **Sync Committee Compromise**: If 2/3 of Ethereum sync committee is malicious, false headers could be accepted. Mitigated by the ~$10B economic security of Ethereum validators.

2. **Lux Validator Compromise**: If 2/3 of Lux stake is malicious, false headers could be accepted. Mitigated by slashing conditions.

3. **Header Submission Liveness**: Requires at least one honest header submitter. Can be incentivized through fees.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
