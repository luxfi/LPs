---
lp: 530
title: Z-Chain Receipt Registry
description: Universal receipt registry for ZK proof verification with Merkle accumulator and cross-chain export
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-01
requires: 3658, 510
activation:
  flag: lp0530-receipts
  hfName: "Fortuna"
  activationHeight: "TBD"
tags: [zchain, receipts, registry, merkle, cross-chain]
order: 530
---

## Abstract

LP-0530 specifies the **Z-Chain Receipt Registry**, a core precompile that makes receipts and Merkle roots first-class chain objects. The registry provides:

1. **Program Registration**: Register verification programs/circuits
2. **Proof Submission**: Submit proofs and receive canonical receipts
3. **Receipt Storage**: Query receipts by hash
4. **Merkle Accumulator**: All receipts in a Poseidon2 Merkle tree
5. **Cross-Chain Export**: Generate Groth16 wrapper proofs for external chains

**Design Philosophy**: Receipts are the universal interoperability object.

## Motivation

To create a truly interoperable and universal ZK ecosystem, Lux needs a canonical on-chain mechanism for registering, verifying, and tracking zero-knowledge proofs. This LP proposes a universal "Receipt Registry" that serves as a single source of truth for all verified computation, enabling seamless cross-chain and cross-application communication of ZK-proven facts.

## Rationale

### The Receipt as Universal Object

A receipt encapsulates:
- **What was proven**: programId + claimHash
- **How it was proven**: proofSystemId + version
- **When it was proven**: verifiedAt + block
- **Where it fits**: Merkle inclusion proof

This enables:
- Cross-chain proof verification via `(root, inclusionProof, receipt)`
- Cheap external verification via Groth16 wrapper of inclusion
- Program-agnostic interoperability

### Use Cases

1. **Cross-Chain Bridges**: Verify computation on destination chain
2. **Rollup Settlement**: L2 state roots with proof of validity
3. **Privacy Pools**: Prove membership without revealing identity
4. **zkVM Programs**: Verify off-chain computation on-chain

## Specification

### Precompile Address Map

| Address | Name | Description |
|---------|------|-------------|
| `0x0530` | RECEIPT_REGISTRY | Main registry interface |
| `0x0531` | RECEIPT_ROOT | Get current/historical roots |
| `0x0532` | RECEIPT_PROOF | Generate inclusion proofs |
| `0x0533` | RECEIPT_EXPORT | Export with Groth16 wrapper |

### Objects

#### Program

```solidity
struct Program {
    bytes32 programId;           // Unique identifier (hash of code)
    bytes32 codeHash;            // Hash of program code/circuit
    uint32[] supportedSystems;   // Proof systems that can verify
    bytes32[] vkCommitments;     // VK hashes per system
    string name;                 // Human-readable name
    string version;              // Semantic version
    address author;              // Program author
    bytes32 auditHash;           // Optional audit report hash
    uint64 registeredAt;         // Registration timestamp
}
```

#### Receipt

```solidity
struct Receipt {
    bytes32 programId;           // Program that was verified
    bytes32 claimHash;           // Poseidon2(publicInputs)
    bytes32 receiptHash;         // Unique receipt identifier
    uint32 proofSystemId;        // 1=STARK, 2=Groth16, 3=PLONK
    uint32 version;              // Protocol version
    uint64 verifiedAt;           // Block timestamp
    uint64 verifiedBlock;        // Block number
    bytes32 parentReceipt;       // For proof chains (0x0 if none)
    bytes32 aggregationRoot;     // For batched proofs (0x0 if single)
}
```

### Core Functions

#### Program Registration

```solidity
/// @notice Register a new program
/// @param codeHash Hash of program code
/// @param supportedSystems Array of proof system IDs
/// @param vkCommitments Verification key commitments per system
/// @param metadata Program metadata (name, version, author)
/// @return programId The unique program identifier
function registerProgram(
    bytes32 codeHash,
    uint32[] calldata supportedSystems,
    bytes32[] calldata vkCommitments,
    ProgramMetadata calldata metadata
) external returns (bytes32 programId);
```

#### Proof Submission

```solidity
/// @notice Submit a proof for verification
/// @param programId Program to verify against
/// @param proofSystemId Which verifier to use
/// @param proof The proof data
/// @param publicInputs Public inputs to the computation
/// @return receipt The canonical receipt
function submitProof(
    bytes32 programId,
    uint32 proofSystemId,
    bytes calldata proof,
    bytes32[] calldata publicInputs
) external returns (Receipt memory receipt);

/// @notice Submit multiple proofs in batch
/// @param submissions Array of proof submissions
/// @return receipts Array of receipts
function submitProofBatch(
    ProofSubmission[] calldata submissions
) external returns (Receipt[] memory receipts);
```

#### Receipt Queries

```solidity
/// @notice Get receipt by hash
function getReceipt(bytes32 receiptHash) 
    external view returns (Receipt memory);

/// @notice Get receipts by program
function getReceiptsByProgram(
    bytes32 programId,
    uint64 fromBlock,
    uint64 toBlock,
    uint32 limit
) external view returns (Receipt[] memory);

/// @notice Check if receipt exists
function receiptExists(bytes32 receiptHash) 
    external view returns (bool);
```

#### Merkle Root Operations

```solidity
/// @notice Get current Merkle root
function getLatestRoot() external view returns (
    bytes32 root,
    uint64 blockNumber,
    uint64 receiptCount
);

/// @notice Check if root is known (in history)
function isKnownRoot(bytes32 root) external view returns (bool);

/// @notice Get historical root at block
function getRootAtBlock(uint64 blockNumber) 
    external view returns (bytes32 root);
```

#### Inclusion Proofs

```solidity
/// @notice Generate inclusion proof for receipt
function getInclusionProof(bytes32 receiptHash) 
    external view returns (
        bytes32[] memory siblings,
        uint256 index,
        bytes32 root
    );

/// @notice Verify inclusion proof
function verifyInclusion(
    bytes32 receiptHash,
    bytes32[] calldata siblings,
    uint256 index,
    bytes32 expectedRoot
) external pure returns (bool valid);
```

#### Cross-Chain Export

```solidity
/// @notice Export receipt with Groth16 wrapper for external chains
function exportReceipt(
    bytes32 receiptHash,
    uint256 targetChainId
) external view returns (
    bytes memory groth16Proof,
    bytes32[] memory publicInputs,
    address verifierAddress
);

/// @notice Get Groth16 proof of inclusion
function getGroth16Proof(bytes32 receiptHash) 
    external view returns (
        bytes memory proof,
        bytes32[3] memory inputs  // receiptHash, root, chainId
    );
```

### Receipt Tree Specification

#### Tree Structure

- **Hash Function**: Poseidon2 (LP-3658, address 0x0501)
- **Depth**: 32 levels (supports 2^32 receipts)
- **Leaf Encoding**: `leaf = Poseidon2(DST_MERKLE_LEAF, receiptHash)`
- **Node Encoding**: `node = Poseidon2(DST_MERKLE_NODE, left, right)`

#### Update Rules

1. **Append-Only**: Receipts only added, never removed
2. **Batch Updates**: Tree updated once per block
3. **Incremental**: Only recompute path from leaf to root

#### Root History Policy

```solidity
// Ring buffer of last N roots
uint256 constant ROOT_HISTORY_SIZE = 1000;
bytes32[ROOT_HISTORY_SIZE] public rootHistory;
uint256 public rootHistoryIndex;

// Block to root mapping for lookups
mapping(uint64 => bytes32) public blockToRoot;
```

### Inclusion Proof Format

```
Proof Structure:
┌─────────────────────────────────────────────────────────────────┐
│ siblings: bytes32[depth]    // Sibling hashes from leaf to root│
│ index: uint256              // Leaf index (bit flags for L/R)  │
│ root: bytes32               // Expected root                   │
└─────────────────────────────────────────────────────────────────┘

Verification:
  current = Poseidon2(DST_MERKLE_LEAF, receiptHash)
  for i in 0..depth:
    if (index >> i) & 1 == 0:
      current = Poseidon2(DST_MERKLE_NODE, current, siblings[i])
    else:
      current = Poseidon2(DST_MERKLE_NODE, siblings[i], current)
  return current == root
```

### Gas Schedule

| Operation | Base Gas | Variable Gas | Notes |
|-----------|----------|--------------|-------|
| registerProgram | 100,000 | +10,000/VK | One-time |
| submitProof | 600,000 | Verifier gas | Includes tree update |
| submitProofBatch | 500,000 | +500,000/proof | Batching discount |
| getReceipt | 5,000 | - | Read-only |
| getLatestRoot | 2,000 | - | Read-only |
| getInclusionProof | 10,000 | +100/level | Proof generation |
| verifyInclusion | 5,000 | +500/level | Pure verification |
| exportReceipt | 1,000,000 | - | Groth16 generation |

## Solidity Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

/* Receipt Registry Interface */

struct Program {
    bytes32 programId;
    bytes32 codeHash;
    uint32[] supportedSystems;
    bytes32[] vkCommitments;
    string name;
    string version;
    address author;
    bytes32 auditHash;
    uint64 registeredAt;
}

struct ProgramMetadata {
    string name;
    string version;
    bytes32 auditHash;
}

struct Receipt {
    bytes32 programId;
    bytes32 claimHash;
    bytes32 receiptHash;
    uint32 proofSystemId;
    uint32 version;
    uint64 verifiedAt;
    uint64 verifiedBlock;
    bytes32 parentReceipt;
    bytes32 aggregationRoot;
}

struct ProofSubmission {
    bytes32 programId;
    uint32 proofSystemId;
    bytes proof;
    bytes32[] publicInputs;
}

interface IReceiptRegistry {
    // Events
    event ProgramRegistered(
        bytes32 indexed programId,
        address indexed author,
        string name
    );
    
    event ReceiptCreated(
        bytes32 indexed receiptHash,
        bytes32 indexed programId,
        uint32 proofSystemId
    );
    
    event RootUpdated(
        bytes32 indexed root,
        uint64 blockNumber,
        uint64 receiptCount
    );
    
    // Program management
    function registerProgram(
        bytes32 codeHash,
        uint32[] calldata supportedSystems,
        bytes32[] calldata vkCommitments,
        ProgramMetadata calldata metadata
    ) external returns (bytes32 programId);
    
    function getProgram(bytes32 programId) 
        external view returns (Program memory);
    
    // Proof submission
    function submitProof(
        bytes32 programId,
        uint32 proofSystemId,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external returns (Receipt memory);
    
    function submitProofBatch(
        ProofSubmission[] calldata submissions
    ) external returns (Receipt[] memory);
    
    // Receipt queries
    function getReceipt(bytes32 receiptHash) 
        external view returns (Receipt memory);
    
    function receiptExists(bytes32 receiptHash) 
        external view returns (bool);
    
    // Root operations
    function getLatestRoot() external view returns (
        bytes32 root,
        uint64 blockNumber,
        uint64 receiptCount
    );
    
    function isKnownRoot(bytes32 root) external view returns (bool);
    
    // Inclusion proofs
    function getInclusionProof(bytes32 receiptHash) 
        external view returns (
            bytes32[] memory siblings,
            uint256 index,
            bytes32 root
        );
    
    function verifyInclusion(
        bytes32 receiptHash,
        bytes32[] calldata siblings,
        uint256 index,
        bytes32 expectedRoot
    ) external pure returns (bool);
    
    // Cross-chain export
    function exportReceipt(
        bytes32 receiptHash,
        uint256 targetChainId
    ) external view returns (
        bytes memory groth16Proof,
        bytes32[] memory publicInputs,
        address verifierAddress
    );
}
```

## Solidity Library

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

library ReceiptLib {
    address constant REGISTRY = address(0x0530);
    address constant ROOT = address(0x0531);
    address constant PROOF = address(0x0532);
    address constant EXPORT = address(0x0533);
    
    /// @notice Submit proof and get receipt
    function submitProof(
        bytes32 programId,
        uint32 proofSystemId,
        bytes memory proof,
        bytes32[] memory publicInputs
    ) internal returns (Receipt memory) {
        (bool success, bytes memory result) = REGISTRY.call(
            abi.encodeWithSignature(
                "submitProof(bytes32,uint32,bytes,bytes32[])",
                programId,
                proofSystemId,
                proof,
                publicInputs
            )
        );
        require(success, "ReceiptLib: submitProof failed");
        return abi.decode(result, (Receipt));
    }
    
    /// @notice Get current root
    function getLatestRoot() internal view returns (bytes32 root) {
        (bool success, bytes memory result) = ROOT.staticcall("");
        require(success, "ReceiptLib: getLatestRoot failed");
        (root,,) = abi.decode(result, (bytes32, uint64, uint64));
    }
    
    /// @notice Verify receipt inclusion
    function verifyReceipt(
        bytes32 receiptHash,
        bytes32[] memory siblings,
        uint256 index,
        bytes32 expectedRoot
    ) internal pure returns (bool) {
        // Compute leaf
        bytes32 current = Poseidon2.hash(
            abi.encodePacked(uint8(0x02), receiptHash) // DST_MERKLE_LEAF
        );
        
        // Traverse path
        for (uint256 i = 0; i < siblings.length; i++) {
            if ((index >> i) & 1 == 0) {
                current = Poseidon2.merkleHash(current, siblings[i]);
            } else {
                current = Poseidon2.merkleHash(siblings[i], current);
            }
        }
        
        return current == expectedRoot;
    }
}
```

## Receipt Versioning

### Format Version Rules

1. **Version 1**: Initial format (this LP)
2. **New fields**: Increment minor version
3. **Breaking changes**: Increment major version, new precompile address
4. **Old versions**: Always supported

### Migration Policy

```solidity
// Version checking
require(
    receipt.version >= MIN_SUPPORTED_VERSION && 
    receipt.version <= CURRENT_VERSION,
    "Unsupported receipt version"
);
```

## Security Considerations

### Spam/DoS Protection

1. **Gas Costs**: Proof verification is expensive, prevents spam
2. **Rate Limits**: Optional per-address submission limits
3. **Proof Size Limits**: Maximum 1MB proof, 256 public inputs

### Program Registration

Options for permission model:
1. **Open**: Anyone can register (with stake deposit)
2. **Allowlist**: Only approved programs
3. **Governance**: DAO-controlled registration

**Recommended**: Open with stake deposit, refundable after sunset period.

### Receipt Uniqueness

```solidity
// Receipt hash includes all unique fields
receiptHash = Poseidon2(
    programId,
    claimHash,
    proofSystemId,
    version,
    verifiedAt,      // Timestamp ensures uniqueness
    block.number,    // Block adds additional uniqueness
    parentReceipt,
    aggregationRoot
)
```

### Collision Resistance

- Poseidon2 provides 128-bit collision resistance
- Receipt hash binding prevents forgery
- Merkle tree prevents double-inclusion

## Export Hooks

### On-Chain Export

```solidity
// Generate Groth16 proof of receipt inclusion
(bytes memory proof, bytes32[3] memory inputs) = 
    registry.getGroth16Proof(receiptHash);

// inputs = [receiptHash, root, targetChainId]
```

### RPC Export

```typescript
// Via RPC for off-chain verification
const { wrappedProof, publicInputs } = await zChain.call(
    'zkp_exportReceipt',
    receiptHash,
    'ethereum' // target chain
);
```

### Off-Chain Service

For heavy Groth16 generation:
1. Request export via RPC
2. Service generates Groth16 proof
3. Proof returned with inclusion data

## Test Cases

### Program Registration

```solidity
function testProgramRegistration() public {
    bytes32 codeHash = keccak256("fibonacci_circuit_v1");
    uint32[] memory systems = new uint32[](1);
    systems[0] = 1; // STARK
    bytes32[] memory vks = new bytes32[](1);
    vks[0] = bytes32(uint256(1)); // VK commitment
    
    ProgramMetadata memory meta = ProgramMetadata({
        name: "Fibonacci",
        version: "1.0.0",
        auditHash: bytes32(0)
    });
    
    bytes32 programId = registry.registerProgram(
        codeHash,
        systems,
        vks,
        meta
    );
    
    Program memory program = registry.getProgram(programId);
    assertEq(program.name, "Fibonacci");
}
```

### Receipt Verification

```solidity
function testReceiptInclusion() public {
    // Submit proof
    Receipt memory receipt = registry.submitProof(
        programId,
        1, // STARK
        proofData,
        publicInputs
    );
    
    // Get inclusion proof
    (bytes32[] memory siblings, uint256 index, bytes32 root) = 
        registry.getInclusionProof(receipt.receiptHash);
    
    // Verify
    assertTrue(registry.verifyInclusion(
        receipt.receiptHash,
        siblings,
        index,
        root
    ));
}
```

### Root History

```solidity
function testRootHistory() public {
    // Submit proofs
    registry.submitProof(...);
    registry.submitProof(...);
    
    // Get root
    (bytes32 root,,) = registry.getLatestRoot();
    
    // Mine block
    vm.roll(block.number + 1);
    
    // Root should be in history
    assertTrue(registry.isKnownRoot(root));
}
```

## Backwards Compatibility

This LP introduces new precompiles at unused addresses. No breaking changes.

## References

- [LP-3658: Poseidon2 Precompile](./lp-3658-poseidon2-precompile.md)
- [LP-0510: STARK Verifier](./lp-0510-stark-verifier-precompile.md)
- [LP-9015: Precompile Registry](./lp-9015-precompile-registry.md)
- [Z-Chain Design Document](../docs/Z-CHAIN_DESIGN.md)
- [Merkle Tree Accumulator](https://eprint.iacr.org/2021/453)

---

*LP-0530 Draft - 2026-01-01*
