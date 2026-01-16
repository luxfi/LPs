---
lp: 510
title: STARK Verification Precompiles (Production Lane)
description: Native EVM precompiles for STARK proof verification and canonical receipt generation
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-01
requires: 3658
activation:
  flag: lp0510-stark
  hfName: "Fortuna"
  activationHeight: "TBD"
tags: [evm, precompile, stark, zk, proof, production]
order: 510
---

## Abstract

LP-0510 specifies native EVM precompiles for **STARK proof verification** in the address range `0x0510-0x051F`. These precompiles enable the Z-Chain to verify transparent, post-quantum safe proofs and emit canonical receipts.

**Key Properties:**
- **Post-Quantum Safe**: Hash-based security (no pairings)
- **Transparent**: No trusted setup required
- **Production Lane**: Proof System ID = 1, immutable verifier at `0x051F`

## Motivation

### Why STARKs?

| Property | STARK | Groth16 | PLONK |
|----------|-------|---------|-------|
| Trusted Setup | ❌ None | ✅ Required | ✅ Universal |
| PQ-Safe | ✅ Hash-based | ❌ Pairing-based | ❌ Pairing-based |
| Proof Size | ~50-100 KB | ~200 bytes | ~500 bytes |
| Verification | O(log n) | O(1) | O(1) |
| Prover Time | Fast | Slow | Medium |

### Use Cases

1. **Universal Computation**: Verify any program via STARK
2. **Receipt Generation**: Canonical receipts for cross-chain interop
3. **Rollup Proofs**: L2 state transitions
4. **zkVM Programs**: RISC Zero, SP1, Cairo

## Specification

### Precompile Address Map

| Address | Name | Description |
|---------|------|-------------|
| `0x0510` | STARK_FIELD_ARITH | Field arithmetic (add, mul, inv) |
| `0x0511` | STARK_POLY_EVAL | Polynomial evaluation |
| `0x0512` | STARK_MERKLE_PATH | Merkle path verification |
| `0x0513` | STARK_FRI_FOLD | FRI folding step |
| `0x0514` | STARK_CONSTRAINT | Constraint evaluation |
| `0x0515-0x051E` | Reserved | Future STARK operations |
| `0x051F` | STARK_VERIFY | Full proof verification |

### Proof System ID and Versioning

| Field | Value | Description |
|-------|-------|-------------|
| `proofSystemId` | 1 | STARK (Production Lane) |
| `version` | 1 | Protocol version |

**Versioning Rule**: Format changes require version bump. Old versions remain forever.

### STARK_VERIFY (0x051F) - Primary Verifier

The main entry point for STARK verification.

#### Input Format

```
Input Layout:
┌─────────────────────────────────────────────────────────────────┐
│ Offset │ Size    │ Field                                       │
├────────┼─────────┼─────────────────────────────────────────────┤
│ 0      │ 32      │ programId: bytes32                          │
│ 32     │ 4       │ proofLength: uint32                         │
│ 36     │ var     │ proof: bytes[proofLength]                   │
│ 36+L   │ 4       │ publicInputsCount: uint32                   │
│ 40+L   │ 32*N    │ publicInputs: bytes32[N]                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Output Format

```
Output Layout (success):
┌─────────────────────────────────────────────────────────────────┐
│ Offset │ Size    │ Field                                       │
├────────┼─────────┼─────────────────────────────────────────────┤
│ 0      │ 1       │ valid: bool (0x01 = valid)                  │
│ 1      │ 32      │ receiptHash: bytes32                        │
│ 33     │ 32      │ claimHash: bytes32                          │
└─────────────────────────────────────────────────────────────────┘

Output Layout (failure):
┌─────────────────────────────────────────────────────────────────┐
│ Offset │ Size    │ Field                                       │
├────────┼─────────┼─────────────────────────────────────────────┤
│ 0      │ 1       │ valid: bool (0x00 = invalid)                │
│ 1      │ 32      │ errorCode: bytes32                          │
└─────────────────────────────────────────────────────────────────┘
```

### Receipt Hash Definition

The receipt hash binds the proof to its verification context:

```solidity
// Hash function: Poseidon2 (from LP-3658)

claimHash = Poseidon2(DST_RECEIPT, publicInputs[0], publicInputs[1], ...)

receiptHash = Poseidon2(
    DST_RECEIPT,
    programId,
    claimHash,
    bytes32(proofSystemId),    // 1 for STARK
    bytes32(version),          // Protocol version
    bytes32(block.timestamp),  // verifiedAt
    parentReceipt,             // 0x0 if none
    aggregationRoot            // 0x0 if single proof
)
```

### Input Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max proof size | 1 MB | Practical STARK proof bound |
| Max public inputs | 256 | Gas predictability |
| Max queries (FRI) | 100 | Security parameter |

### Gas Schedule

| Operation | Base Gas | Per-Byte Gas | Notes |
|-----------|----------|--------------|-------|
| STARK_VERIFY | 500,000 | 10 | Full verification |
| STARK_FIELD_ARITH | 50 | - | Per operation |
| STARK_POLY_EVAL | 1,000 | 5 | Per coefficient |
| STARK_MERKLE_PATH | 500 | 300/level | Path verification |
| STARK_FRI_FOLD | 5,000 | 100/layer | FRI step |
| STARK_CONSTRAINT | 2,000 | - | Per constraint |

**Gas Formula for STARK_VERIFY:**
```
gas = 500,000 + 10 * proof_bytes + 1,000 * num_public_inputs
```

### Failure Modes

| Condition | Behavior | Error Code |
|-----------|----------|------------|
| Invalid proof | Return (false, error) | `0x01` |
| Malformed input | Revert | - |
| Out of gas | Revert | - |
| Unknown program | Return (false, error) | `0x02` |
| Size exceeded | Revert | - |

### Determinism Requirements

1. **Fixed Transcript**: Fiat-Shamir uses deterministic hash
2. **Canonical Encoding**: Big-endian, fixed sizes
3. **No Randomness**: All operations deterministic
4. **Cross-Client**: Same result across all implementations

## Solidity Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

/* STARK Verification Precompile - Production Lane */

interface ISTARKVerifier {
    /// @notice Verify a STARK proof and generate receipt
    /// @param programId The program/circuit identifier
    /// @param proof The STARK proof data
    /// @param publicInputs Public inputs to the computation
    /// @return valid Whether the proof is valid
    /// @return receiptHash The canonical receipt hash
    function verify(
        bytes32 programId,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view returns (bool valid, bytes32 receiptHash);
    
    /// @notice Get the claim hash from public inputs
    function computeClaimHash(bytes32[] calldata publicInputs)
        external pure returns (bytes32);
}

library STARKLib {
    address constant STARK_VERIFY = address(0x051F);
    address constant STARK_FIELD = address(0x0510);
    address constant STARK_FRI = address(0x0513);
    
    uint32 constant PROOF_SYSTEM_ID = 1;
    uint32 constant VERSION = 1;
    
    /// @notice Verify STARK proof
    function verify(
        bytes32 programId,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) internal view returns (bool valid, bytes32 receiptHash) {
        bytes memory input = abi.encodePacked(
            programId,
            uint32(proof.length),
            proof,
            uint32(publicInputs.length)
        );
        for (uint i = 0; i < publicInputs.length; i++) {
            input = abi.encodePacked(input, publicInputs[i]);
        }
        
        (bool success, bytes memory output) = STARK_VERIFY.staticcall(input);
        require(success, "STARK: call failed");
        
        valid = output[0] == 0x01;
        if (valid) {
            receiptHash = bytes32(output[1:33]);
        }
    }
    
    /// @notice Field addition
    function fieldAdd(uint256 a, uint256 b) internal view returns (uint256) {
        (bool success, bytes memory output) = STARK_FIELD.staticcall(
            abi.encodePacked(uint8(0x01), a, b)
        );
        require(success, "STARK: field add failed");
        return abi.decode(output, (uint256));
    }
    
    /// @notice Field multiplication
    function fieldMul(uint256 a, uint256 b) internal view returns (uint256) {
        (bool success, bytes memory output) = STARK_FIELD.staticcall(
            abi.encodePacked(uint8(0x02), a, b)
        );
        require(success, "STARK: field mul failed");
        return abi.decode(output, (uint256));
    }
}
```

## Receipt Structure

The canonical receipt format for STARK proofs:

```solidity
struct Receipt {
    bytes32 programId;       // Hash of verified program
    bytes32 claimHash;       // Poseidon2(publicInputs)
    bytes32 receiptHash;     // Unique receipt identifier
    uint32 proofSystemId;    // 1 = STARK
    uint32 version;          // Protocol version
    uint64 verifiedAt;       // Block timestamp
    bytes32 parentReceipt;   // For proof chains
    bytes32 aggregationRoot; // For batched proofs
}
```

## Go Implementation

```go
package stark

import (
    "errors"
    "math/big"
    
    "github.com/luxfi/coreth/precompile/contract"
    "github.com/luxfi/coreth/precompile/poseidon2"
)

const (
    // Precompile addresses
    AddrFieldArith  = 0x0510
    AddrPolyEval    = 0x0511
    AddrMerklePath  = 0x0512
    AddrFRIFold     = 0x0513
    AddrConstraint  = 0x0514
    AddrVerify      = 0x051F
    
    // Proof system
    ProofSystemID   = 1
    Version         = 1
    
    // Gas
    GasVerifyBase   = 500_000
    GasPerByte      = 10
    GasPerInput     = 1_000
    
    // Limits
    MaxProofSize    = 1 << 20  // 1 MB
    MaxPublicInputs = 256
)

var (
    ErrInvalidProof    = errors.New("invalid proof")
    ErrMalformedInput  = errors.New("malformed input")
    ErrSizeExceeded    = errors.New("size exceeded")
    ErrUnknownProgram  = errors.New("unknown program")
)

type STARKVerifyPrecompile struct {
    registry ProgramRegistry
}

func (p *STARKVerifyPrecompile) RequiredGas(input []byte) uint64 {
    if len(input) < 36 {
        return 0
    }
    
    proofLen := binary.BigEndian.Uint32(input[32:36])
    if 36+int(proofLen)+4 > len(input) {
        return 0
    }
    
    inputsOffset := 36 + int(proofLen)
    inputsCount := binary.BigEndian.Uint32(input[inputsOffset:inputsOffset+4])
    
    return uint64(GasVerifyBase + GasPerByte*int(proofLen) + GasPerInput*int(inputsCount))
}

func (p *STARKVerifyPrecompile) Run(input []byte) ([]byte, error) {
    // Parse input
    if len(input) < 36 {
        return nil, ErrMalformedInput
    }
    
    programId := [32]byte(input[0:32])
    proofLen := binary.BigEndian.Uint32(input[32:36])
    
    if proofLen > MaxProofSize {
        return nil, ErrSizeExceeded
    }
    
    proofEnd := 36 + int(proofLen)
    if len(input) < proofEnd+4 {
        return nil, ErrMalformedInput
    }
    
    proof := input[36:proofEnd]
    inputsCount := binary.BigEndian.Uint32(input[proofEnd:proofEnd+4])
    
    if inputsCount > MaxPublicInputs {
        return nil, ErrSizeExceeded
    }
    
    inputsStart := proofEnd + 4
    if len(input) < inputsStart+int(inputsCount)*32 {
        return nil, ErrMalformedInput
    }
    
    publicInputs := make([][32]byte, inputsCount)
    for i := uint32(0); i < inputsCount; i++ {
        copy(publicInputs[i][:], input[inputsStart+int(i)*32:inputsStart+int(i+1)*32])
    }
    
    // Get program verification key
    program, err := p.registry.GetProgram(programId)
    if err != nil {
        return invalidResult(0x02), nil // Unknown program
    }
    
    // Verify STARK proof
    valid := verifySTARKProof(program.VK, proof, publicInputs)
    if !valid {
        return invalidResult(0x01), nil // Invalid proof
    }
    
    // Compute receipt hash
    claimHash := computeClaimHash(publicInputs)
    receiptHash := computeReceiptHash(
        programId,
        claimHash,
        ProofSystemID,
        Version,
        uint64(time.Now().Unix()),
        [32]byte{}, // parentReceipt
        [32]byte{}, // aggregationRoot
    )
    
    // Return success
    result := make([]byte, 65)
    result[0] = 0x01 // valid
    copy(result[1:33], receiptHash[:])
    copy(result[33:65], claimHash[:])
    
    return result, nil
}

func computeClaimHash(publicInputs [][32]byte) [32]byte {
    // Use Poseidon2 with DST_RECEIPT
    inputs := make([][]byte, len(publicInputs)+1)
    inputs[0] = []byte{poseidon2.DSTReceipt}
    for i, pi := range publicInputs {
        inputs[i+1] = pi[:]
    }
    return poseidon2.Hash(inputs...)
}

func computeReceiptHash(
    programId [32]byte,
    claimHash [32]byte,
    proofSystemId uint32,
    version uint32,
    verifiedAt uint64,
    parentReceipt [32]byte,
    aggregationRoot [32]byte,
) [32]byte {
    return poseidon2.Hash(
        []byte{poseidon2.DSTReceipt},
        programId[:],
        claimHash[:],
        uint32ToBytes(proofSystemId),
        uint32ToBytes(version),
        uint64ToBytes(verifiedAt),
        parentReceipt[:],
        aggregationRoot[:],
    )
}

func invalidResult(errorCode byte) []byte {
    result := make([]byte, 33)
    result[0] = 0x00 // invalid
    result[1] = errorCode
    return result
}
```

## Test Vectors

### Valid Proof Verification

```json
{
  "test": "stark_verify_valid",
  "input": {
    "programId": "0xabcd...1234",
    "proof": "0x...(valid STARK proof)...",
    "publicInputs": [
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000002"
    ]
  },
  "expected": {
    "valid": true,
    "receiptHash": "0x...",
    "claimHash": "0x..."
  }
}
```

### Invalid Proof

```json
{
  "test": "stark_verify_invalid",
  "input": {
    "programId": "0xabcd...1234",
    "proof": "0x...(corrupted proof)...",
    "publicInputs": ["0x01"]
  },
  "expected": {
    "valid": false,
    "errorCode": "0x01"
  }
}
```

## Security Considerations

### Hash Function Security

STARK security relies on:
- Collision resistance of Poseidon2
- Fiat-Shamir transcript security
- FRI soundness (128-bit security)

### Transcript Determinism

The Fiat-Shamir transcript must be:
- Deterministic across all clients
- Include all public data
- Use canonical encoding

### Program Registration

Programs should be:
- Audited before production use
- Registered with verification key commitment
- Version-controlled for updates

### Receipt Binding

Receipts are bound by:
- Poseidon2 hash (PQ-safe)
- Block timestamp (immutable)
- Chain ID (cross-chain safety)

## Backwards Compatibility

This LP introduces new precompiles at unused addresses. No breaking changes.

## References

- [STARK Paper](https://eprint.iacr.org/2018/046) - Ben-Sasson et al.
- [FRI Protocol](https://eccc.weizmann.ac.il/report/2017/134/)
- [LP-3658: Poseidon2 Precompile](./lp-3658-poseidon2-precompile.md)
- [LP-0530: Receipt Registry](./lp-0530-receipt-registry.md)
- [Z-Chain Design Document](../docs/Z-CHAIN_DESIGN.md)

---

*LP-0510 Draft - 2026-01-01*
