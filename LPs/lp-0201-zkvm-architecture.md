---
lp: 201
title: zkVM - Zero Knowledge Virtual Machine
description: Native ZK proof verification and zkVM execution in Lux EVM
author: Lux Network (@luxfi)
status: Draft
type: Standards Track
category: Core
created: 2025-12-28
requires: 11
---

# LP-0201: zkVM - Zero Knowledge Virtual Machine

## Abstract

This LP specifies the zkVM (Zero Knowledge Virtual Machine), a set of native precompiles for ZK proof verification and zkVM program execution within the Lux EVM. The zkVM enables trustless verification of off-chain computation, private transactions, and cross-chain state proofs.

## Motivation

Zero-knowledge proofs enable:
1. **Privacy**: Prove statements without revealing underlying data
2. **Scalability**: Verify off-chain computation cheaply on-chain
3. **Interoperability**: Trustless cross-chain state verification
4. **Compliance**: Prove regulatory compliance without data exposure

Current EVM ZK support is limited to BN254 pairing (0x06-0x08). The zkVM extends this with:
- Multiple curve support (BN254, BLS12-381, Pasta, Grumpkin)
- Multiple proof system support (Groth16, Plonk, STARK, Bulletproofs)
- Native zkVM execution for complex proofs
- Range proofs for confidential transactions

## Specification

### Precompile Addresses

| Address | Precompile | Description |
|---------|-----------|-------------|
| 0x0600 | ZK_GROTH16_VERIFY | Groth16 SNARK verification (BN254) |
| 0x0601 | ZK_PLONK_VERIFY | PLONK verification |
| 0x0602 | ZK_STARK_VERIFY | STARK verification |
| 0x0603 | ZK_BULLETPROOF_VERIFY | Bulletproof range proof |
| 0x0604 | ZK_BULLETPROOF_COMMIT | Pedersen commitment |
| 0x0605 | ZK_BLS12_PAIRING | BLS12-381 pairing (EIP-2537) |
| 0x0606 | ZK_PASTA_PAIRING | Pasta curve operations |
| 0x0607 | ZK_POSEIDON_HASH | Poseidon hash (ZK-friendly) |
| 0x0608 | ZK_MERKLE_VERIFY | Merkle tree verification |
| 0x0609 | ZK_NULLIFIER_CHECK | Double-spend prevention |
| 0x060A | ZK_ZKVM_EXECUTE | Execute zkVM program |
| 0x060B | ZK_RECEIPT_VERIFY | Verify Ethereum receipt proof |
| 0x060C | ZK_HEADER_VERIFY | Verify block header |
| 0x060D | ZK_STATE_VERIFY | Verify state proof |

### Existing Precompiles (EIP-1108, EIP-2537)

| Address | Precompile | Gas | Status |
|---------|-----------|-----|--------|
| 0x06 | BN254_ADD | 150 | Active |
| 0x07 | BN254_MUL | 6,000 | Active |
| 0x08 | BN254_PAIRING | 45,000 + 34,000/pair | Active |
| 0x0b-0x11 | BLS12-381 | Various | Prague |

### Groth16 Verification

```solidity
interface IGroth16Verifier {
    struct Proof {
        uint256[2] a;      // G1 point
        uint256[2][2] b;   // G2 point
        uint256[2] c;      // G1 point
    }
    
    struct VerifyingKey {
        uint256[2] alpha;
        uint256[2][2] beta;
        uint256[2][2] gamma;
        uint256[2][2] delta;
        uint256[2][] ic;   // Input commitment points
    }
    
    function verify(
        Proof calldata proof,
        uint256[] calldata publicInputs,
        VerifyingKey calldata vk
    ) external view returns (bool);
}
```

### Bulletproof Range Proofs

```solidity
interface IBulletproofVerifier {
    struct BulletproofProof {
        uint256[2] A;           // Vector commitment
        uint256[2] S;           // Blinding commitment
        uint256[2] T1;          // Polynomial commitment
        uint256[2] T2;          // Polynomial commitment
        uint256 tauX;           // Blinding factor
        uint256 mu;             // Blinding factor
        uint256 t;              // Inner product result
        uint256[2][] L;         // Left vector (log2(n))
        uint256[2][] R;         // Right vector (log2(n))
        uint256 a;              // Final scalar
        uint256 b;              // Final scalar
    }
    
    // Verify value is in [0, 2^n)
    function verify(
        BulletproofProof calldata proof,
        uint256[2] calldata commitment, // Pedersen commitment V = vG + rH
        uint256 n                        // Bit range (e.g., 64)
    ) external view returns (bool);
    
    // Compute Pedersen commitment
    function commit(
        uint256 value,
        uint256 blinding
    ) external view returns (uint256[2] memory);
    
    // Aggregate multiple range proofs
    function verifyAggregate(
        BulletproofProof calldata proof,
        uint256[2][] calldata commitments,
        uint256 n
    ) external view returns (bool);
}
```

### zkVM Execution

```solidity
interface IZkVM {
    struct Program {
        bytes32 programId;      // Hash of program code
        bytes32 imageId;        // Hash of initial state
        bytes input;            // Public input
        bytes proof;            // Execution proof
    }
    
    struct Receipt {
        bytes32 programId;
        bytes32 journalHash;    // Hash of program output
        bytes journal;          // Program output
        bool verified;
    }
    
    // Execute and verify zkVM program
    function execute(
        Program calldata program
    ) external view returns (Receipt memory);
    
    // Verify existing receipt
    function verifyReceipt(
        bytes32 imageId,
        bytes32 journalHash,
        bytes calldata proof
    ) external view returns (bool);
}
```

### Cross-Chain Verification

```solidity
interface ICrossChainVerifier {
    // Verify Ethereum block header
    function verifyEthereumHeader(
        bytes calldata header,
        bytes calldata proof
    ) external view returns (bool);
    
    // Verify transaction receipt
    function verifyReceipt(
        bytes32 txHash,
        bytes calldata receiptRLP,
        bytes calldata merkleProof,
        bytes32 receiptsRoot
    ) external view returns (bool);
    
    // Verify storage proof
    function verifyStorageProof(
        address account,
        bytes32 slot,
        bytes32 value,
        bytes calldata proof,
        bytes32 stateRoot
    ) external view returns (bool);
}
```

### Poseidon Hash

```solidity
interface IPoseidon {
    // Hash single field element
    function hash(uint256 input) external pure returns (uint256);
    
    // Hash array of field elements
    function hashMany(uint256[] calldata inputs) external pure returns (uint256);
    
    // Sponge construction for arbitrary length
    function sponge(
        bytes calldata data,
        uint256 outputLen
    ) external pure returns (bytes memory);
}
```

### Gas Costs

| Operation | Gas | Notes |
|-----------|-----|-------|
| ZK_GROTH16_VERIFY | 200,000 | ~45k base + inputs |
| ZK_PLONK_VERIFY | 300,000 | Variable on circuit size |
| ZK_STARK_VERIFY | 500,000 | Higher for security |
| ZK_BULLETPROOF_VERIFY | 150,000 | Per proof |
| ZK_BULLETPROOF_COMMIT | 10,000 | Pedersen commitment |
| ZK_POSEIDON_HASH | 5,000 | Per field element |
| ZK_MERKLE_VERIFY | 3,000 | Per level |
| ZK_ZKVM_EXECUTE | 1,000,000 | Complex programs |

### Curve Parameters

**BN254 (alt_bn128):**
```
p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
```

**BLS12-381:**
```
p = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab
r = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
```

**Bulletproof Generators (BN254):**
```
G = (1, 2)  // Standard generator
H = HashToCurve("Bulletproofs")  // Nothing-up-my-sleeve
```

## Rationale

### Multiple Proof Systems

Different use cases require different proof systems:
- **Groth16**: Smallest proofs (~200 bytes), trusted setup
- **PLONK**: Universal setup, efficient recursion
- **STARK**: No trusted setup, post-quantum
- **Bulletproofs**: No trusted setup, compact range proofs

### Native Poseidon Hash

Standard hash functions (SHA256, Keccak) are expensive in ZK circuits. Poseidon is designed for algebraic efficiency in SNARKs.

### zkVM for Complex Proofs

Some applications need arbitrary computation proofs:
- Prove correct EVM execution
- Verify complex business logic
- Cross-chain computation verification

## Backwards Compatibility

This LP adds new precompiles (0x0600-0x060D) that do not conflict with existing precompiles. The existing BN254 precompiles (0x06-0x08) remain unchanged.

## Security Considerations

### Trusted Setup (Groth16)

Groth16 requires a trusted setup. Lux uses:
- Powers of Tau ceremony (public contribution)
- Circuit-specific setup for each application

### Soundness

All proof systems target 128-bit security:
- Computational soundness for SNARKs
- Statistical soundness for STARKs
- Discrete log hardness for Bulletproofs

### Malleability

Proofs are not malleable - identical statements produce identical valid proofs.

## Reference Implementation

- Go Library: `github.com/luxfi/zk`
- Solidity Verifiers: `github.com/luxfi/zkvm/contracts`
- Bulletproofs: `github.com/luxfi/teleport/contracts/privacy/BulletproofVerifier.sol`

## Test Vectors

```solidity
// Bulletproof range proof
uint256[2] memory commitment = bulletproof.commit(100, 12345);
BulletproofProof memory proof = generateProof(100, 12345, 64);
bool valid = bulletproof.verify(proof, commitment, 64); // true

// Groth16 verification
uint256[] memory inputs = new uint256[](1);
inputs[0] = publicInput;
bool verified = groth16.verify(proof, inputs, vk); // true
```

## Dependencies

- LP-0011: Chain Types (Z-Chain execution)
- LP-0200: fhEVM (encrypted computation complement)

---

*Copyright 2025 Lux Industries Inc. All rights reserved.*
