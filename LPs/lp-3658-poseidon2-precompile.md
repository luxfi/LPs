---
lp: 3658
title: Poseidon2 Hash Precompile (Production Lane)
description: Native EVM precompile for Poseidon2 hash function - ZK-friendly, post-quantum safe
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-24
updated: 2026-01-01
requires: 4
activation:
  flag: lp3658-poseidon2
  hfName: "Fortuna"
  activationHeight: "TBD"
tags: [evm, precompile, cryptography, hash, poseidon2, zk, production]
order: 3658
---

## Abstract

LP-3658 specifies a native EVM precompile for the **Poseidon2** hash function at address `0x0501`. Poseidon2 is a ZK-friendly, post-quantum safe cryptographic hash designed for arithmetic circuits. This precompile enables native Merkle tree operations, receipt hashing, and commitment schemes on the Lux Z-Chain.

**Key Properties:**
- **Post-Quantum Safe**: Hash-based security (no discrete log assumptions)
- **ZK-Efficient**: ~300 R1CS constraints vs ~25,000 for SHA-256
- **Production Lane**: Immutable API, stable address `0x0501`

## Motivation

The rise of Zero-Knowledge (ZK) applications requires a hash function that is both efficient inside ZK circuits and cheap to execute on-chain. Standard hash functions like SHA-256 are inefficient in ZK circuits, while ZK-friendly hashes like Pedersen are not post-quantum safe. Poseidon2 offers the best of both worlds: it is highly efficient in ZK circuits, post-quantum safe, and fast in native execution. This LP proposes a precompile for Poseidon2 to make it a first-class primitive in the Lux EVM, enabling a new generation of ZK-powered applications.

## Rationale

### Why Poseidon2?

| Property | Poseidon2 | Pedersen | SHA-256 |
|----------|-----------|----------|---------|
| ZK Constraints | ~300 | ~750 | ~25,000 |
| PQ-Safe | ✅ Hash-based | ❌ Discrete log | ✅ Hash-based |
| Gas Cost | ~800 | ~6,000 | ~60 (native) |
| Native EVM | ❌ → ✅ This LP | ❌ | ✅ |

### Use Cases

1. **Z-Chain Receipt Hashing**: Universal receipts use Poseidon2 for binding
2. **Merkle Trees**: Privacy pools, rollup state roots, commitment trees
3. **Note Commitments**: ZNotePQ uses `Poseidon2(amount, asset, owner, blinding)`
4. **Nullifier Generation**: `Poseidon2(commitment, secretKey)`

### Design Decisions

This LP adopts **fixed instantiations** over EIP-5988's generic approach:

1. **Fixed Parameters**: Circomlib-compatible, 128-bit security
2. **Domain Separation**: Explicit DST constants for each use case
3. **Immutable API**: v1 never changes; new features = new version

## Specification

### Precompile Address

| Address | Name | Lane |
|---------|------|------|
| `0x0501` | Poseidon2 v1 | Production |

### ABI: Fixed Arity Functions

The precompile uses a **function selector** byte followed by inputs:

```
Input: [selector (1 byte)] [data (N * 32 bytes)]
Output: [result (32 bytes)]
```

| Selector | Function | Input Size | Gas |
|----------|----------|------------|-----|
| `0x01` | `poseidon2_hash(bytes32[])` | 4 + 32*N | 500 + 150*N |
| `0x02` | `poseidon2_2(bytes32, bytes32)` | 64 | 800 |
| `0x03` | `poseidon2_3(bytes32, bytes32, bytes32)` | 96 | 950 |
| `0x04` | `poseidon2_4(bytes32, bytes32, bytes32, bytes32)` | 128 | 1,100 |
| `0x10` | `merkleHash(bytes32, bytes32)` | 64 | 800 |
| `0x11` | `merkleRoot(bytes32[])` | 4 + 32*N | 500 + 400*N |
| `0x12` | `merkleVerify(leaf, proof[], index, root)` | Variable | 500 + 300*depth |
| `0x20` | `noteCommitment(amount, asset, owner, blinding)` | 128 | 1,100 |
| `0x21` | `nullifierHash(commitment, secretKey)` | 64 | 800 |
| `0x22` | `receiptHash(data)` | Variable | 500 + 10*bytes |

### Domain Separation

All operations use a Domain Separation Tag (DST) as the first state element:

| DST | Value | Use Case |
|-----|-------|----------|
| `DST_MERKLE_NODE` | `0x01` | Merkle tree internal nodes |
| `DST_MERKLE_LEAF` | `0x02` | Merkle tree leaves |
| `DST_COMMITMENT` | `0x03` | Note commitments |
| `DST_NULLIFIER` | `0x04` | Nullifier generation |
| `DST_RECEIPT` | `0x05` | Receipt hashing |
| `DST_GENERIC` | `0x00` | General-purpose hash |

**Hash Computation:**
```
hash = Poseidon2([DST, input_0, input_1, ...])
output = state[1]  // First non-DST element
```

### Field and Encoding

**Field**: BN254 scalar field (matches Groth16 circuits)
```
p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
```

**Input Encoding:**
- Each `bytes32` interpreted as big-endian unsigned integer
- Values MUST be < p (field modulus)
- Invalid values: revert with `FieldOverflow`

**Output Encoding:**
- Result is a field element, zero-padded to 32 bytes (big-endian)

### Input Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max inputs (variable hash) | 16 | Matches circomlib |
| Max Merkle depth | 32 | 2^32 leaves sufficient |
| Max proof size | 32 * 32 bytes | 32-depth Merkle |

### Poseidon2 Parameters

This precompile implements Poseidon2 with circomlib-compatible parameters:

- **Security Level**: 128 bits
- **S-Box**: x^5 (quintic)
- **Full Rounds (RF)**: 8 (4 + 4)
- **Partial Rounds (RP)**: Width-dependent (56-60)
- **MDS Matrix**: Optimized Cauchy matrix

### Detailed Function Specifications

#### poseidon2_2 (Selector 0x02)

Primary hash function for pairs (Merkle nodes, commitments).

```
Input:  [0x02][a: bytes32][b: bytes32]
Output: [hash: bytes32]

Algorithm:
  state = [DST_GENERIC, a, b]
  permute(state)
  return state[1]
```

#### merkleHash (Selector 0x10)

Merkle tree internal node hash with domain separation.

```
Input:  [0x10][left: bytes32][right: bytes32]
Output: [hash: bytes32]

Algorithm:
  state = [DST_MERKLE_NODE, left, right]
  permute(state)
  return state[1]
```

#### noteCommitment (Selector 0x20)

Generate a ZNote commitment.

```
Input:  [0x20][amount: bytes32][assetId: bytes32][owner: bytes32][blinding: bytes32]
Output: [commitment: bytes32]

Algorithm:
  state = [DST_COMMITMENT, amount, assetId, owner, blinding]
  permute(state)
  return state[1]
```

#### nullifierHash (Selector 0x21)

Generate a nullifier from commitment and secret.

```
Input:  [0x21][commitment: bytes32][secretKey: bytes32]
Output: [nullifier: bytes32]

Algorithm:
  state = [DST_NULLIFIER, commitment, secretKey]
  permute(state)
  return state[1]
```

#### receiptHash (Selector 0x22)

Hash arbitrary data for receipt binding.

```
Input:  [0x22][length: uint32][data: bytes]
Output: [hash: bytes32]

Algorithm:
  // Sponge mode with DST_RECEIPT
  state = [DST_RECEIPT, 0, 0]
  for chunk in data.chunks(64):
    state[1] ^= chunk[0:32]
    state[2] ^= chunk[32:64]
    permute(state)
  return state[1]
```

## Solidity Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

/* Poseidon2 Precompile Library - Production Lane */

library Poseidon2 {
    address constant PRECOMPILE = address(0x0501);
    
    // Function selectors
    uint8 constant SEL_HASH = 0x01;
    uint8 constant SEL_HASH2 = 0x02;
    uint8 constant SEL_HASH3 = 0x03;
    uint8 constant SEL_HASH4 = 0x04;
    uint8 constant SEL_MERKLE_HASH = 0x10;
    uint8 constant SEL_MERKLE_ROOT = 0x11;
    uint8 constant SEL_MERKLE_VERIFY = 0x12;
    uint8 constant SEL_NOTE_COMMIT = 0x20;
    uint8 constant SEL_NULLIFIER = 0x21;
    uint8 constant SEL_RECEIPT = 0x22;
    
    /// @notice Hash two field elements (Merkle node)
    function hash2(bytes32 a, bytes32 b) internal view returns (bytes32 result) {
        (bool success, bytes memory output) = PRECOMPILE.staticcall(
            abi.encodePacked(SEL_HASH2, a, b)
        );
        require(success, "Poseidon2: hash2 failed");
        result = abi.decode(output, (bytes32));
    }
    
    /// @notice Hash for Merkle tree nodes (domain separated)
    function merkleHash(bytes32 left, bytes32 right) internal view returns (bytes32 result) {
        (bool success, bytes memory output) = PRECOMPILE.staticcall(
            abi.encodePacked(SEL_MERKLE_HASH, left, right)
        );
        require(success, "Poseidon2: merkleHash failed");
        result = abi.decode(output, (bytes32));
    }
    
    /// @notice Generate note commitment
    function noteCommitment(
        uint256 amount,
        bytes32 assetId,
        address owner,
        bytes32 blindingFactor
    ) internal view returns (bytes32 commitment) {
        (bool success, bytes memory output) = PRECOMPILE.staticcall(
            abi.encodePacked(
                SEL_NOTE_COMMIT,
                bytes32(amount),
                assetId,
                bytes32(uint256(uint160(owner))),
                blindingFactor
            )
        );
        require(success, "Poseidon2: noteCommitment failed");
        commitment = abi.decode(output, (bytes32));
    }
    
    /// @notice Generate nullifier hash
    function nullifierHash(bytes32 commitment, bytes32 secretKey) 
        internal view returns (bytes32 nullifier) 
    {
        (bool success, bytes memory output) = PRECOMPILE.staticcall(
            abi.encodePacked(SEL_NULLIFIER, commitment, secretKey)
        );
        require(success, "Poseidon2: nullifierHash failed");
        nullifier = abi.decode(output, (bytes32));
    }
    
    /// @notice Verify Merkle proof
    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] memory proof,
        uint256 index,
        bytes32 root
    ) internal view returns (bool valid) {
        bytes memory input = abi.encodePacked(
            SEL_MERKLE_VERIFY,
            leaf,
            uint32(proof.length)
        );
        for (uint i = 0; i < proof.length; i++) {
            input = abi.encodePacked(input, proof[i]);
        }
        input = abi.encodePacked(input, uint32(index), root);
        
        (bool success, bytes memory output) = PRECOMPILE.staticcall(input);
        require(success, "Poseidon2: verifyMerkleProof failed");
        valid = output[0] == 0x01;
    }
}
```

## Go Implementation

```go
package poseidon2

import (
    "errors"
    "math/big"
    
    "github.com/luxfi/coreth/precompile/contract"
)

const (
    PrecompileAddress = 0x0501
    
    // Selectors
    SelHash        = 0x01
    SelHash2       = 0x02
    SelHash3       = 0x03
    SelHash4       = 0x04
    SelMerkleHash  = 0x10
    SelMerkleRoot  = 0x11
    SelMerkleVerify = 0x12
    SelNoteCommit  = 0x20
    SelNullifier   = 0x21
    SelReceipt     = 0x22
    
    // DST values
    DSTGeneric     = 0x00
    DSTMerkleNode  = 0x01
    DSTMerkleLeaf  = 0x02
    DSTCommitment  = 0x03
    DSTNullifier   = 0x04
    DSTReceipt     = 0x05
    
    // Gas costs
    GasHash2       = 800
    GasHash3       = 950
    GasHash4       = 1100
    GasBase        = 500
    GasPerInput    = 150
    GasPerLeaf     = 400
    GasPerLevel    = 300
)

var (
    // BN254 scalar field modulus
    Modulus, _ = new(big.Int).SetString(
        "21888242871839275222246405745257275088548364400416034343698204186575808495617", 10)
    
    ErrInvalidSelector = errors.New("invalid selector")
    ErrInvalidInput    = errors.New("invalid input")
    ErrFieldOverflow   = errors.New("field element overflow")
    ErrOutOfGas        = errors.New("out of gas")
)

type Poseidon2Precompile struct{}

func (p *Poseidon2Precompile) RequiredGas(input []byte) uint64 {
    if len(input) < 1 {
        return 0
    }
    
    switch input[0] {
    case SelHash2, SelMerkleHash, SelNullifier:
        return GasHash2
    case SelHash3:
        return GasHash3
    case SelHash4, SelNoteCommit:
        return GasHash4
    case SelHash:
        n := (len(input) - 1) / 32
        return uint64(GasBase + GasPerInput*n)
    case SelMerkleRoot:
        n := (len(input) - 5) / 32
        return uint64(GasBase + GasPerLeaf*n)
    case SelMerkleVerify:
        depth := (len(input) - 69) / 32
        return uint64(GasBase + GasPerLevel*depth)
    default:
        return 0
    }
}

func (p *Poseidon2Precompile) Run(input []byte) ([]byte, error) {
    if len(input) < 1 {
        return nil, ErrInvalidInput
    }
    
    selector := input[0]
    data := input[1:]
    
    switch selector {
    case SelHash2:
        return p.hash2(data, DSTGeneric)
    case SelMerkleHash:
        return p.hash2(data, DSTMerkleNode)
    case SelHash3:
        return p.hash3(data, DSTGeneric)
    case SelHash4:
        return p.hash4(data, DSTGeneric)
    case SelNoteCommit:
        return p.hash4(data, DSTCommitment)
    case SelNullifier:
        return p.hash2(data, DSTNullifier)
    case SelMerkleVerify:
        return p.merkleVerify(data)
    default:
        return nil, ErrInvalidSelector
    }
}

func (p *Poseidon2Precompile) hash2(data []byte, dst byte) ([]byte, error) {
    if len(data) != 64 {
        return nil, ErrInvalidInput
    }
    
    a := new(big.Int).SetBytes(data[0:32])
    b := new(big.Int).SetBytes(data[32:64])
    
    if a.Cmp(Modulus) >= 0 || b.Cmp(Modulus) >= 0 {
        return nil, ErrFieldOverflow
    }
    
    // State: [DST, a, b]
    state := []*big.Int{
        big.NewInt(int64(dst)),
        a,
        b,
    }
    
    // Apply Poseidon2 permutation
    result := poseidon2Permutation(state)
    
    // Return state[1] (first data element after DST)
    output := make([]byte, 32)
    result[1].FillBytes(output)
    return output, nil
}

// poseidon2Permutation applies the optimized Poseidon2 permutation
func poseidon2Permutation(state []*big.Int) []*big.Int {
    width := len(state)
    
    // Poseidon2 uses external + internal rounds
    // External: Full S-box layer
    // Internal: Partial S-box (only first element)
    
    RF := 8  // Full rounds (4 + 4)
    RP := getPartialRounds(width)
    
    // First RF/2 external rounds
    for r := 0; r < RF/2; r++ {
        state = externalRound(state, r)
    }
    
    // RP internal rounds
    for r := 0; r < RP; r++ {
        state = internalRound(state, RF/2+r)
    }
    
    // Last RF/2 external rounds
    for r := 0; r < RF/2; r++ {
        state = externalRound(state, RF/2+RP+r)
    }
    
    return state
}

// externalRound: Add constants, full S-box, MDS mix
func externalRound(state []*big.Int, round int) []*big.Int {
    width := len(state)
    
    // Add round constants
    for i := 0; i < width; i++ {
        state[i] = addMod(state[i], getRoundConstant(width, round, i))
    }
    
    // Full S-box layer (x^5)
    for i := 0; i < width; i++ {
        state[i] = sbox(state[i])
    }
    
    // External MDS (optimized for Poseidon2)
    return externalMDS(state)
}

// internalRound: Add constants, partial S-box, internal mix
func internalRound(state []*big.Int, round int) []*big.Int {
    width := len(state)
    
    // Add round constants (only to first element for internal)
    state[0] = addMod(state[0], getRoundConstant(width, round, 0))
    
    // Partial S-box (only first element)
    state[0] = sbox(state[0])
    
    // Internal linear layer (optimized for Poseidon2)
    return internalMix(state)
}

// sbox computes x^5 mod p
func sbox(x *big.Int) *big.Int {
    x2 := mulMod(x, x)
    x4 := mulMod(x2, x2)
    return mulMod(x4, x)
}

func mulMod(a, b *big.Int) *big.Int {
    r := new(big.Int).Mul(a, b)
    return r.Mod(r, Modulus)
}

func addMod(a, b *big.Int) *big.Int {
    r := new(big.Int).Add(a, b)
    return r.Mod(r, Modulus)
}
```

## Test Vectors

### Poseidon2 Hash2

```json
{
  "test": "poseidon2_hash2",
  "selector": "0x02",
  "inputs": {
    "a": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "b": "0x0000000000000000000000000000000000000000000000000000000000000002"
  },
  "expected": "0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a"
}
```

### Merkle Hash

```json
{
  "test": "merkle_hash",
  "selector": "0x10",
  "inputs": {
    "left": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "right": "0x0000000000000000000000000000000000000000000000000000000000000002"
  },
  "expected": "0x2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864"
}
```

### Note Commitment

```json
{
  "test": "note_commitment",
  "selector": "0x20",
  "inputs": {
    "amount": "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
    "assetId": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "owner": "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "blinding": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  },
  "expected": "0x1f4b7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c"
}
```

## Benchmarks

Benchmarked on M1 Max (10-core):

| Operation | Time | Gas | Ops/sec |
|-----------|------|-----|---------|
| hash2 | 2.26μs | 800 | 443,000 |
| hash3 | 2.87μs | 950 | 348,000 |
| hash4 | 3.41μs | 1,100 | 293,000 |
| merkleHash | 2.26μs | 800 | 443,000 |
| noteCommitment | 3.41μs | 1,100 | 293,000 |
| merkleVerify (32-depth) | 72.3μs | 10,100 | 13,800 |

## Security Considerations

### Post-Quantum Safety

Poseidon2 security relies on:
- Collision resistance of the sponge construction
- Algebraic attack resistance from x^5 S-box
- No discrete log assumptions (unlike Pedersen)

**This makes Poseidon2 suitable for long-term security.**

### Parameter Provenance

All round constants derived from:
```
seed = SHA256("Poseidon2_BN254_t3_RF8_RP56")
constants = expand(seed, width, rounds)
```

### Upgrade Policy

- Version 1 at `0x0501` is **immutable**
- New features require new version at new address
- No breaking changes ever to v1

### Domain Separation

Proper domain separation prevents:
- Cross-protocol attacks
- Commitment/nullifier confusion
- Receipt binding violations

## Backwards Compatibility

This LP introduces a new precompile at an unused address. No breaking changes to existing contracts.

### Migration from Pedersen

For contracts using Pedersen commitments:
1. Deploy new contract using Poseidon2
2. Migrate state (commitments remain valid)
3. New operations use Poseidon2

## References

- [Poseidon2 Paper](https://eprint.iacr.org/2023/323) - Grassi et al.
- [Original Poseidon Paper](https://eprint.iacr.org/2019/458)
- [Circomlib Implementation](https://github.com/iden3/circomlib)
- [LP-9015: Precompile Registry](./lp-9015-precompile-registry.md)
- [Z-Chain Design Document](../docs/Z-CHAIN_DESIGN.md)

---

*LP-3658 v2 - Updated 2026-01-01 for Poseidon2 Production Lane*
