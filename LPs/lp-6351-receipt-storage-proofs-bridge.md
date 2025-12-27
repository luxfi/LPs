---
lp: 6351
title: Receipt and Storage Proofs for Trustless Bridge Claims
description: Merkle Patricia Trie proofs for verifying burn events without oracles, enabling fully trustless bridge claims.
author: Claude (@anthropic)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-27
tags: [teleport, bridge, merkle-proof, trustless, mpt]
requires: [3001, 6350]
order: 351
---

## Abstract

This LP specifies how to use Merkle Patricia Trie (MPT) proofs to verify bridge burn events without relying on oracle signatures. Combined with light client verification (LP-6350), users can cryptographically prove that a burn transaction was included in a finalized block, enabling fully trustless cross-chain claims.

## Motivation

Light client verification (LP-6350) establishes that a block is finalized, but doesn't prove what happened in that block. Receipt proofs bridge this gap by proving:

1. A specific transaction was included in a block
2. The transaction succeeded (receipt status)
3. Specific events were emitted (burn event logs)

This enables a fully trustless claim flow:
1. Light client confirms block finality
2. Receipt proof confirms burn event inclusion
3. Bridge mints without any oracle involvement

## Specification

### 1. Merkle Patricia Trie Structure

Ethereum and Lux C-Chain use MPT for three tries:
- **State Trie**: Account balances and storage
- **Transaction Trie**: Transactions in a block
- **Receipt Trie**: Transaction receipts and logs

Each block header contains:
```solidity
struct BlockHeader {
    bytes32 stateRoot;        // Root of state trie
    bytes32 transactionsRoot; // Root of tx trie
    bytes32 receiptsRoot;     // Root of receipt trie
    // ... other fields
}
```

### 2. Receipt Proof Structure

```solidity
struct ReceiptProof {
    bytes[] proof;           // MPT proof nodes
    bytes rlpEncodedReceipt; // RLP-encoded receipt
    uint256 txIndex;         // Transaction index in block
}

struct TransactionReceipt {
    uint8 status;            // 1 = success, 0 = failure
    uint256 cumulativeGasUsed;
    bytes logsBloom;
    Log[] logs;
}

struct Log {
    address contractAddress;
    bytes32[] topics;
    bytes data;
}
```

### 3. Proof Verification

```solidity
interface IReceiptProofVerifier {
    /// @notice Verify a receipt is included in the receipts trie
    /// @param receiptsRoot The receipts root from the block header
    /// @param proof The MPT proof
    /// @param txIndex The transaction index
    /// @param expectedReceipt The expected receipt data
    function verifyReceiptProof(
        bytes32 receiptsRoot,
        bytes[] calldata proof,
        uint256 txIndex,
        bytes calldata expectedReceipt
    ) external pure returns (bool);
    
    /// @notice Extract burn event from receipt logs
    /// @param receipt The transaction receipt
    /// @param bridgeAddress Expected bridge contract address
    function extractBurnEvent(
        TransactionReceipt calldata receipt,
        address bridgeAddress
    ) external pure returns (BurnEvent memory);
}
```

### 4. MPT Proof Verification Algorithm

```solidity
library MerklePatriciaProof {
    /// @notice Verify an MPT inclusion proof
    /// @param rootHash The trie root hash
    /// @param key The key (RLP-encoded tx index)
    /// @param proof The proof nodes
    /// @param expectedValue The expected value at key
    function verify(
        bytes32 rootHash,
        bytes memory key,
        bytes[] memory proof,
        bytes memory expectedValue
    ) internal pure returns (bool) {
        bytes32 currentHash = rootHash;
        uint256 keyIndex = 0;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes memory node = proof[i];
            require(keccak256(node) == currentHash, "Invalid proof node");
            
            // Decode RLP node (branch, extension, or leaf)
            (bytes[] memory decoded, NodeType nodeType) = decodeNode(node);
            
            if (nodeType == NodeType.Branch) {
                // Branch node: 17 elements
                uint8 nibble = getNibble(key, keyIndex);
                currentHash = bytes32(decoded[nibble]);
                keyIndex++;
            } else if (nodeType == NodeType.Extension) {
                // Extension node: [shared_nibbles, next_hash]
                bytes memory sharedNibbles = decoded[0];
                require(matchNibbles(key, keyIndex, sharedNibbles), "Path mismatch");
                keyIndex += nibbleLength(sharedNibbles);
                currentHash = bytes32(decoded[1]);
            } else {
                // Leaf node: [key_remainder, value]
                require(matchNibbles(key, keyIndex, decoded[0]), "Leaf key mismatch");
                return keccak256(decoded[1]) == keccak256(expectedValue);
            }
        }
        
        return false;
    }
}
```

### 5. Bridge Claim with Receipt Proof

```solidity
contract ReceiptProofBridge {
    ILightClient public lightClient;
    IReceiptProofVerifier public verifier;
    
    event BridgeClaimed(
        bytes32 indexed claimId,
        bytes32 indexed sourceBlockHash,
        address indexed recipient,
        uint256 amount
    );
    
    /// @notice Claim bridged assets with receipt proof
    function claimWithReceiptProof(
        bytes32 sourceBlockHash,
        ReceiptProof calldata receiptProof,
        ClaimData calldata claim
    ) external returns (bytes32 claimId) {
        // 1. Verify block is finalized via light client
        require(lightClient.isFinalized(sourceBlockHash), "Block not finalized");
        
        // 2. Get receipts root from verified header
        bytes32 receiptsRoot = lightClient.getReceiptsRoot(sourceBlockHash);
        
        // 3. Verify receipt proof
        require(
            verifier.verifyReceiptProof(
                receiptsRoot,
                receiptProof.proof,
                receiptProof.txIndex,
                receiptProof.rlpEncodedReceipt
            ),
            "Invalid receipt proof"
        );
        
        // 4. Decode receipt and extract burn event
        TransactionReceipt memory receipt = decodeReceipt(receiptProof.rlpEncodedReceipt);
        require(receipt.status == 1, "Source tx failed");
        
        BurnEvent memory burn = verifier.extractBurnEvent(receipt, claim.sourceBridge);
        
        // 5. Validate claim matches burn event
        require(burn.token == claim.token, "Token mismatch");
        require(burn.amount == claim.amount, "Amount mismatch");
        require(burn.toChainId == block.chainid, "Chain mismatch");
        require(burn.recipient == claim.recipient, "Recipient mismatch");
        
        // 6. Compute claim ID and check replay
        claimId = keccak256(abi.encode(
            sourceBlockHash,
            receiptProof.txIndex,
            claim
        ));
        require(!claimed[claimId], "Already claimed");
        claimed[claimId] = true;
        
        // 7. Mint tokens
        IERC20B(claim.token).bridgeMint(claim.recipient, claim.amount);
        
        emit BridgeClaimed(claimId, sourceBlockHash, claim.recipient, claim.amount);
    }
}
```

### 6. Storage Proofs (Alternative)

For verifying contract state directly:

```solidity
interface IStorageProofVerifier {
    /// @notice Verify a storage slot value
    /// @param stateRoot The state root from block header
    /// @param account The contract address
    /// @param accountProof Proof of account in state trie
    /// @param slot The storage slot
    /// @param storageProof Proof of slot in storage trie
    function verifyStorageProof(
        bytes32 stateRoot,
        address account,
        bytes[] calldata accountProof,
        bytes32 slot,
        bytes[] calldata storageProof
    ) external pure returns (bytes32 value);
}
```

Storage proofs are useful for:
- Verifying nonce values
- Checking balance changes
- Confirming contract state transitions

### 7. Proof Generation (Off-Chain)

```typescript
// Generate receipt proof using eth_getProof
async function generateReceiptProof(
    provider: Provider,
    txHash: string
): Promise<ReceiptProof> {
    const receipt = await provider.getTransactionReceipt(txHash);
    const block = await provider.getBlock(receipt.blockNumber);
    
    // Get proof from node
    const proof = await provider.send('eth_getProof', [
        receipt.to,
        [],
        block.number
    ]);
    
    // Build receipt trie and generate proof
    const receiptTrie = await buildReceiptTrie(block);
    const mptProof = receiptTrie.prove(receipt.transactionIndex);
    
    return {
        proof: mptProof,
        rlpEncodedReceipt: encodeReceipt(receipt),
        txIndex: receipt.transactionIndex
    };
}
```

## Rationale

Receipt proofs provide the missing link between light client verification and trustless claims:

1. **Complete Trustlessness**: Combined with LP-6350, no oracle involvement whatsoever
2. **Efficient Verification**: MPT proofs are O(log n) in block size
3. **Standard Format**: Uses existing Ethereum/EVM proof formats
4. **Cross-Platform**: Works with any EVM-compatible chain

## Backwards Compatibility

This extends LP-3001 and LP-6350 without breaking changes. The bridge contract supports multiple proof types:

```solidity
enum ProofType {
    MPC_ORACLE,      // LP-3001: Oracle signature
    LIGHT_CLIENT,    // LP-6350: Light client + receipt proof
    ZK_PROOF         // LP-6352: ZK state proof (future)
}
```

## Test Cases

1. Generate and verify valid receipt proof
2. Reject proof with tampered receipt data
3. Reject proof against non-finalized block
4. Extract BridgeBurned event from receipt logs
5. Reject claim with mismatched event data
6. Verify storage proofs for balance checks

## Reference Implementation

- Verifier: `/bridge/contracts/contracts/proofs/ReceiptProofVerifier.sol`
- MPT Library: `/bridge/contracts/contracts/lib/MerklePatriciaProof.sol`
- RLP Library: `/bridge/contracts/contracts/lib/RLPReader.sol`
- Bridge: `/bridge/contracts/contracts/ReceiptProofBridge.sol`

## Security Considerations

1. **RLP Decoding**: Must handle malformed RLP data safely
2. **Proof Length**: Limit proof array length to prevent DoS
3. **Gas Limits**: MPT verification can be gas-intensive for deep tries
4. **Event Spoofing**: Verify event comes from expected bridge contract address

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
