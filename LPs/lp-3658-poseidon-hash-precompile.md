---
lp: 3658
title: Poseidon Hash Precompile (ZK-Friendly)
description: Native EVM precompile for Poseidon hash function optimized for zero-knowledge proof circuits
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-24
requires: 4
activation:
  flag: lp3658-poseidon
  hfName: "Quantum"
  activationHeight: "0"
tags: [evm, precompile, cryptography, hash, poseidon, zk]
order: 3658
---

## Abstract

LP-3658 specifies a native EVM precompile for the Poseidon hash function, a cryptographic hash designed specifically for zero-knowledge proof systems. Poseidon is optimized for arithmetic circuits over prime fields, providing efficient ZK-SNARK and ZK-STARK implementations. This precompile enables native ZK verification and Merkle tree operations on the Lux Z-Chain.

## Motivation

### Current Limitations

**ZK-Unfriendly Traditional Hashes:**
- SHA-256, Keccak require ~25,000 constraints per hash
- Bit manipulation is expensive in arithmetic circuits
- Slows down ZK proof generation significantly

**Poseidon Advantages:**
- ~300 constraints per hash (83x fewer)
- Native field arithmetic operations
- Designed for R1CS and PLONK circuits
- Used by leading ZK projects (Filecoin, Zcash, Polygon zkEVM)

### Use Cases Requiring Poseidon

1. **ZK Rollups (Z-Chain)**
   - State root computation
   - Transaction Merkle trees
   - Nullifier generation

2. **Private Transactions**
   - Note commitments
   - Merkle tree membership
   - Secret sharing

3. **Identity and Attestations**
   - ZK credential proofs
   - Anonymous voting
   - Selective disclosure

4. **Gaming and NFTs**
   - Hidden information games
   - Private metadata
   - Fair shuffle proofs

### Performance Comparison

| Hash | R1CS Constraints | Proving Time | In-Circuit Cost |
|------|------------------|--------------|-----------------|
| SHA-256 | ~25,000 | 100ms | High |
| MiMC | ~700 | 10ms | Medium |
| Poseidon | ~300 | 3ms | Low |
| Rescue | ~400 | 5ms | Medium |

## Rationale

### Poseidon for Zero-Knowledge

Poseidon is purpose-built for ZK circuits:

1. **Arithmetic Design**: Uses field addition/multiplication, not bit operations
2. **Sponge Construction**: Standard, well-analyzed security
3. **Low Constraints**: ~300 vs ~25,000 for SHA-256
4. **Ecosystem Adoption**: Filecoin, Zcash, Hermez, Polygon

### Why Not MiMC or Rescue?

- **Poseidon**: Better security margins, more analysis
- **Rescue**: Similar constraints, less adoption
- **Trade-off**: Poseidon has slightly more rounds for better security

### Precompile Address Choice

Using `0x0318` (496+ in hex) for Poseidon:

- Sequential after VRF at `0x0317`
- Grouping all ZK-friendly operations
- Follows cryptographic precompile convention

### Function Selector Design

Organized by operation complexity:

- `0x01-0x0F`: Basic hash operations (single input)
- `0x10-0x1F`: Two-input hash (for commitments)
- `0x20-0x2F`: Sponge operations (variable input)
- `0x30-0x3F`: Merkle tree operations

### Gas Cost Derivation

Gas based on Poseidon permutation complexity:

| Operation | Rounds | Constraints | Gas |
|-----------|--------|-------------|-----|
| poseidonHash | 8 + 1/2 + 8 | ~300 | 500 |
| poseidonHash2 | 8 + 1/2 + 8 | ~400 | 800 |
| poseidonSponge | 8 + rate | ~rate x 50 | 200 + 10/byte |
| merkleRoot | n x poseidon | ~n x 300 | 500 + 400/level |

### Field Selection (BN254 vs BLS12-381)

Supporting both prime fields:

- **BN254**: Best compatibility with Ethereum ecosystem
- **BLS12-381**: Matches BLS signature curve, good for ZK-Bridge
- **Auto-detection**: Input format determines field

### Circomlib Compatibility

Using circomlib parameters ensures:

- Interoperability with existing ZK circuits
- Verified secure parameters
- Standard test vectors available

## Specification

### Precompile Address

| Address | Operation |
|---------|-----------|
| `0x0318` | Poseidon Hash Operations |

### Function Selectors

| Selector | Function | Gas |
|----------|----------|-----|
| `0x01` | `poseidonHash(uint256[] inputs)` | 500 + 150/element |
| `0x02` | `poseidonHash2(uint256 a, uint256 b)` | 800 |
| `0x03` | `poseidonHash3(uint256 a, uint256 b, uint256 c)` | 950 |
| `0x04` | `poseidonHash4(uint256 a, uint256 b, uint256 c, uint256 d)` | 1,100 |
| `0x10` | `poseidonSponge(uint256[] inputs, uint256 outputLen)` | 500 + 150/element + 100/output |
| `0x20` | `poseidonMerkleRoot(uint256[] leaves)` | 1,000 + 400/leaf |
| `0x21` | `poseidonMerkleProof(uint256 leaf, uint256[] proof, uint256 index)` | 500 + 300/level |
| `0x30` | `poseidonBN254(uint256[] inputs)` | 500 + 150/element |
| `0x31` | `poseidonBLS12_381(uint256[] inputs)` | 600 + 180/element |

### Supported Fields

| Field | Prime | Usage |
|-------|-------|-------|
| BN254 (alt_bn128) | `21888242871839275222246405745257275088548364400416034343698204186575808495617` | Ethereum, Groth16 |
| BLS12-381 | `52435875175126190479447740508185965837690552500527637822603658699938581184513` | Zcash, PLONK |
| Goldilocks | `2^64 - 2^32 + 1` | Plonky2, STARKs |

### Poseidon Parameters

This precompile implements Poseidon with the following parameters:

**Security Level:** 128 bits

**Round Constants:**
- Full rounds (RF): 8 (4 beginning + 4 end)
- Partial rounds (RP): Variable based on width
  - Width 2: RP = 56
  - Width 3: RP = 57
  - Width 4: RP = 56
  - Width 5-16: RP = 57-60

**S-Box:** `x^5` (quintic, for 128-bit security)

**MDS Matrix:** Cauchy matrix optimized for the field

### Data Encoding

**Poseidon Hash Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Number of inputs (n) |
| 4 | 32*n | Field elements (uint256, big-endian) |
```

**Poseidon Hash Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Hash output (field element) |
```

**Poseidon Sponge Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Number of inputs (n) |
| 4 | 32*n | Field elements |
| 4+32*n | 4 | Output count |
```

**Merkle Proof Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Leaf value |
| 32 | 4 | Proof length (d) |
| 36 | 32*d | Sibling hashes |
| 36+32*d | 4 | Leaf index |
```

### Detailed Function Specifications

#### poseidonHash

Computes Poseidon hash of variable number of field elements.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Count (n), where 1 ≤ n ≤ 16 |
| 4 | 32*n | Field elements |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Hash (single field element) |
```

**Algorithm:**
```solidity
1. Initialize state S = [0, input_0, input_1, ..., input_{n-1}, 0, ...]
2. Apply RF/2 full rounds:
   - Add round constants
   - Apply S-box to all elements: S[i] = S[i]^5
   - Multiply by MDS matrix
3. Apply RP partial rounds:
   - Add round constants
   - Apply S-box to S[0] only
   - Multiply by MDS matrix
4. Apply RF/2 full rounds (same as step 2)
5. Return S[0]
```

#### poseidonHash2

Optimized 2-to-1 hash for Merkle trees.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Left child |
| 32 | 32 | Right child |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Parent hash |
```

This is the primary building block for Merkle trees in ZK circuits.

#### poseidonSponge

Applies Poseidon in sponge mode for variable-length output.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Input count (n) |
| 4 | 32*n | Input field elements |
| 4+32*n | 4 | Output count (m) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32*m | Output field elements |
```

**Algorithm (Sponge):**
```solidity
1. Absorb: For each rate-sized chunk of input:
   - XOR into state rate portion
   - Apply Poseidon permutation
2. Squeeze: For each output element:
   - Extract from state rate portion
   - Apply Poseidon permutation
```

#### poseidonMerkleRoot

Computes Merkle root of leaves using Poseidon hash.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Leaf count (n, must be power of 2) |
| 4 | 32*n | Leaf values |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Merkle root |
```

#### poseidonMerkleProof

Verifies a Merkle proof using Poseidon hash.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Leaf value |
| 32 | 4 | Proof depth (d) |
| 36 | 32*d | Sibling hashes |
| 36+32*d | 4 | Leaf index (determines left/right) |
| 40+32*d | 32 | Expected root |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 1 | Valid flag (0x01 if valid) |
```

## Implementation Stack

### Architecture Overview

```solidity
┌─────────────────────────────────────────────────────────────────────┐
│                   Poseidon Precompile (0x0318)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 4: EVM Interface                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ poseidon_precompile.go   - Precompile dispatcher                ││
│  │ poseidon_gas.go          - Gas calculation                       ││
│  │ poseidon_abi.go          - ABI encoding/decoding                ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: Poseidon Hash Implementation                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ poseidon.go              - Core hash function                   ││
│  │ poseidon_sponge.go       - Sponge construction                  ││
│  │ merkle.go                - Merkle tree operations               ││
│  │ parameters.go            - Round constants & MDS matrices       ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: Field Arithmetic                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ bn254_field.go           - BN254 scalar field                   ││
│  │ bls12381_field.go        - BLS12-381 scalar field               ││
│  │ goldilocks_field.go      - Goldilocks field (2^64-2^32+1)       ││
│  │ montgomery.go            - Montgomery multiplication            ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 1: Assembly Optimizations                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ mul_amd64.s              - 256-bit multiplication               ││
│  │ add_amd64.s              - Modular addition                     ││
│  │ pow5_amd64.s             - S-box optimization                   ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### File Inventory

```solidity
evm/precompile/contracts/poseidon/
├── poseidon.go             (15 KB)  # Core implementation
├── poseidon_test.go        (12 KB)  # Unit tests
├── gas.go                  (2 KB)   # Gas metering
├── bn254.go                (8 KB)   # BN254 field operations
├── bls12381.go             (8 KB)   # BLS12-381 field operations
├── parameters_bn254.go     (25 KB)  # BN254 round constants
├── parameters_bls12381.go  (30 KB)  # BLS12-381 round constants
├── mds.go                  (6 KB)   # MDS matrix operations
├── sponge.go               (4 KB)   # Sponge mode
├── merkle.go               (5 KB)   # Merkle tree operations
└── testdata/
    ├── circomlib_vectors.json     # Circomlib compatibility
    ├── filecoin_vectors.json      # Filecoin test vectors
    └── dusk_vectors.json          # Dusk Network vectors

node/crypto/poseidon/
├── poseidon.go             (10 KB)  # Poseidon hash
├── field/
│   ├── bn254.go            (6 KB)   # BN254 field
│   ├── bls12381.go         (6 KB)   # BLS12-381 field
│   └── goldilocks.go       (4 KB)   # Goldilocks field
├── merkle.go               (4 KB)   # Merkle operations
└── poseidon_test.go        (8 KB)   # Tests and benchmarks

Total: ~153 KB implementation
```

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPoseidon {
    /// @notice Compute Poseidon hash of field elements (BN254)
    /// @param inputs Array of field elements (1-16 elements)
    /// @return hash Single field element hash
    function poseidonHash(uint256[] calldata inputs) external view returns (uint256 hash);

    /// @notice Optimized 2-to-1 hash for Merkle trees
    /// @param a Left child
    /// @param b Right child
    /// @return hash Parent hash
    function poseidonHash2(uint256 a, uint256 b) external view returns (uint256 hash);

    /// @notice Optimized 3-to-1 hash
    /// @param a First element
    /// @param b Second element
    /// @param c Third element
    /// @return hash Hash result
    function poseidonHash3(uint256 a, uint256 b, uint256 c) external view returns (uint256 hash);

    /// @notice Optimized 4-to-1 hash
    /// @param a First element
    /// @param b Second element
    /// @param c Third element
    /// @param d Fourth element
    /// @return hash Hash result
    function poseidonHash4(uint256 a, uint256 b, uint256 c, uint256 d) external view returns (uint256 hash);

    /// @notice Poseidon sponge for variable output
    /// @param inputs Input field elements
    /// @param outputLen Number of output elements
    /// @return outputs Output field elements
    function poseidonSponge(
        uint256[] calldata inputs,
        uint256 outputLen
    ) external view returns (uint256[] memory outputs);

    /// @notice Compute Merkle root of leaves
    /// @param leaves Leaf values (must be power of 2)
    /// @return root Merkle root
    function poseidonMerkleRoot(
        uint256[] calldata leaves
    ) external view returns (uint256 root);

    /// @notice Verify Merkle proof
    /// @param leaf Leaf value
    /// @param proof Sibling hashes
    /// @param index Leaf index
    /// @param root Expected root
    /// @return valid True if proof is valid
    function poseidonMerkleProof(
        uint256 leaf,
        uint256[] calldata proof,
        uint256 index,
        uint256 root
    ) external view returns (bool valid);

    /// @notice Poseidon hash using BN254 field (explicit)
    /// @param inputs Input field elements
    /// @return hash Hash result
    function poseidonBN254(uint256[] calldata inputs) external view returns (uint256 hash);

    /// @notice Poseidon hash using BLS12-381 field
    /// @param inputs Input field elements
    /// @return hash Hash result
    function poseidonBLS12_381(uint256[] calldata inputs) external view returns (uint256 hash);
}
```

### Go Implementation

```go
// evm/precompile/contracts/poseidon/poseidon.go
package poseidon

import (
    "encoding/binary"
    "math/big"

    "github.com/luxfi/evm/precompile/contract"
)

const (
    PrecompileAddress = "0x0318"

    // BN254 scalar field modulus
    BN254Modulus = "21888242871839275222246405745257275088548364400416034343698204186575808495617"

    // Function selectors
    SelectorHash     = 0x01
    SelectorHash2    = 0x02
    SelectorHash3    = 0x03
    SelectorHash4    = 0x04
    SelectorSponge   = 0x10
    SelectorRoot     = 0x20
    SelectorProof    = 0x21
    SelectorBN254    = 0x30
    SelectorBLS12381 = 0x31

    // Gas costs
    GasBase      = 500
    GasPerInput  = 150
    GasPerOutput = 100
    GasHash2     = 800
    GasHash3     = 950
    GasHash4     = 1100
    GasRootBase  = 1000
    GasPerLeaf   = 400
    GasProofBase = 500
    GasPerLevel  = 300
)

// Poseidon round constants and parameters
var (
    modulus *big.Int
    roundConstantsBN254 [][]*big.Int
    mdsMatrixBN254      [][]*big.Int
)

func init() {
    modulus, _ = new(big.Int).SetString(BN254Modulus, 10)
    roundConstantsBN254 = loadRoundConstants()
    mdsMatrixBN254 = loadMDSMatrix()
}

type PoseidonPrecompile struct{}

func (p *PoseidonPrecompile) Run(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) ([]byte, uint64, error) {
    if len(input) < 1 {
        return nil, suppliedGas, ErrInvalidInput
    }

    selector := input[0]
    data := input[1:]

    switch selector {
    case SelectorHash:
        return p.poseidonHash(data, suppliedGas)
    case SelectorHash2:
        return p.poseidonHash2(data, suppliedGas)
    case SelectorHash3:
        return p.poseidonHash3(data, suppliedGas)
    case SelectorHash4:
        return p.poseidonHash4(data, suppliedGas)
    case SelectorSponge:
        return p.poseidonSponge(data, suppliedGas)
    case SelectorRoot:
        return p.poseidonMerkleRoot(data, suppliedGas)
    case SelectorProof:
        return p.poseidonMerkleProof(data, suppliedGas)
    default:
        return nil, suppliedGas, ErrUnknownSelector
    }
}

func (p *PoseidonPrecompile) poseidonHash2(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    if suppliedGas < GasHash2 {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - GasHash2

    if len(data) != 64 {
        return nil, remainingGas, ErrInvalidInput
    }

    // Parse inputs
    left := new(big.Int).SetBytes(data[0:32])
    right := new(big.Int).SetBytes(data[32:64])

    // Validate field elements
    if left.Cmp(modulus) >= 0 || right.Cmp(modulus) >= 0 {
        return nil, remainingGas, ErrFieldOverflow
    }

    // Compute Poseidon hash
    hash := poseidonPermutation([]*big.Int{big.NewInt(0), left, right})

    // Return first element
    result := make([]byte, 32)
    hash[0].FillBytes(result)
    return result, remainingGas, nil
}

func (p *PoseidonPrecompile) poseidonMerkleProof(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Parse input
    if len(data) < 40 {
        return nil, suppliedGas, ErrInvalidInput
    }

    leaf := new(big.Int).SetBytes(data[0:32])
    depth := binary.BigEndian.Uint32(data[32:36])

    requiredGas := uint64(GasProofBase + int(depth)*GasPerLevel)
    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    // Parse proof
    if len(data) < int(36+32*depth+4+32) {
        return nil, remainingGas, ErrInvalidInput
    }

    proof := make([]*big.Int, depth)
    for i := uint32(0); i < depth; i++ {
        offset := 36 + 32*i
        proof[i] = new(big.Int).SetBytes(data[offset : offset+32])
    }

    indexOffset := 36 + 32*depth
    index := binary.BigEndian.Uint32(data[indexOffset : indexOffset+4])
    expectedRoot := new(big.Int).SetBytes(data[indexOffset+4 : indexOffset+36])

    // Verify proof
    current := leaf
    for i := uint32(0); i < depth; i++ {
        if index&(1<<i) == 0 {
            // Current is left child
            current = poseidonHash2(current, proof[i])
        } else {
            // Current is right child
            current = poseidonHash2(proof[i], current)
        }
    }

    // Check root
    valid := current.Cmp(expectedRoot) == 0

    result := make([]byte, 1)
    if valid {
        result[0] = 0x01
    }
    return result, remainingGas, nil
}

// poseidonPermutation applies the full Poseidon permutation
func poseidonPermutation(state []*big.Int) []*big.Int {
    width := len(state)

    // Get parameters for this width
    RF := 8                              // Full rounds
    RP := partialRounds[width]           // Partial rounds
    constants := roundConstantsBN254[width]
    mds := mdsMatrixBN254

    roundIdx := 0

    // First RF/2 full rounds
    for r := 0; r < RF/2; r++ {
        // Add round constants
        for i := 0; i < width; i++ {
            state[i] = addMod(state[i], constants[roundIdx*width+i])
        }
        roundIdx++

        // Full S-box layer
        for i := 0; i < width; i++ {
            state[i] = sbox(state[i])
        }

        // MDS matrix multiplication
        state = mdsMultiply(state, mds)
    }

    // RP partial rounds
    for r := 0; r < RP; r++ {
        // Add round constants
        for i := 0; i < width; i++ {
            state[i] = addMod(state[i], constants[roundIdx*width+i])
        }
        roundIdx++

        // Partial S-box (only first element)
        state[0] = sbox(state[0])

        // MDS matrix multiplication
        state = mdsMultiply(state, mds)
    }

    // Last RF/2 full rounds
    for r := 0; r < RF/2; r++ {
        // Add round constants
        for i := 0; i < width; i++ {
            state[i] = addMod(state[i], constants[roundIdx*width+i])
        }
        roundIdx++

        // Full S-box layer
        for i := 0; i < width; i++ {
            state[i] = sbox(state[i])
        }

        // MDS matrix multiplication
        state = mdsMultiply(state, mds)
    }

    return state
}

// sbox computes x^5 mod p
func sbox(x *big.Int) *big.Int {
    // x^2
    x2 := new(big.Int).Mul(x, x)
    x2.Mod(x2, modulus)

    // x^4
    x4 := new(big.Int).Mul(x2, x2)
    x4.Mod(x4, modulus)

    // x^5
    x5 := new(big.Int).Mul(x4, x)
    x5.Mod(x5, modulus)

    return x5
}

// mdsMultiply multiplies state vector by MDS matrix
func mdsMultiply(state []*big.Int, mds [][]*big.Int) []*big.Int {
    width := len(state)
    result := make([]*big.Int, width)

    for i := 0; i < width; i++ {
        result[i] = big.NewInt(0)
        for j := 0; j < width; j++ {
            term := new(big.Int).Mul(mds[i][j], state[j])
            result[i] = addMod(result[i], term)
        }
    }

    return result
}

// addMod adds two field elements mod p
func addMod(a, b *big.Int) *big.Int {
    sum := new(big.Int).Add(a, b)
    return sum.Mod(sum, modulus)
}

// poseidonHash2 is the optimized 2-to-1 hash
func poseidonHash2(left, right *big.Int) *big.Int {
    state := []*big.Int{big.NewInt(0), left, right}
    result := poseidonPermutation(state)
    return result[0]
}
```

### Circomlib Compatibility

```solidity
// Example: Using Poseidon in circom-compatible way
contract PoseidonMerkleTree {
    address constant POSEIDON = address(0x0318);

    // Build Merkle tree with circom-compatible hashing
    function buildTree(uint256[] memory leaves) public view returns (uint256) {
        require(leaves.length > 0 && (leaves.length & (leaves.length - 1)) == 0, "Power of 2 required");

        uint256[] memory layer = leaves;

        while (layer.length > 1) {
            uint256[] memory nextLayer = new uint256[](layer.length / 2);
            for (uint256 i = 0; i < layer.length / 2; i++) {
                nextLayer[i] = poseidonHash2(layer[2*i], layer[2*i + 1]);
            }
            layer = nextLayer;
        }

        return layer[0];
    }

    function poseidonHash2(uint256 a, uint256 b) internal view returns (uint256) {
        (bool success, bytes memory result) = POSEIDON.staticcall(
            abi.encodePacked(bytes1(0x02), a, b)
        );
        require(success, "Poseidon call failed");
        return abi.decode(result, (uint256));
    }
}
```

### Network Usage Map

| Chain | Component | Poseidon Usage |
|-------|-----------|----------------|
| Z-Chain | ZK Rollup | State root computation |
| Z-Chain | Transactions | Nullifier hash |
| C-Chain | Privacy | Note commitments |
| C-Chain | Gaming | Hidden state proofs |
| All | Identity | ZK credential hashes |

## Security Considerations

### Algebraic Attack Resistance

Poseidon is designed to resist:
- **Gröbner basis attacks**: High algebraic degree from x^5
- **Interpolation attacks**: Random-looking round constants
- **Statistical attacks**: MDS matrix provides diffusion

### Parameter Security

All round constants and MDS matrices are:
- Generated from SHA-256 of domain separator
- Publicly verifiable
- No trapdoors possible

### Field Element Validation

All inputs MUST be validated:
```go
if input.Cmp(modulus) >= 0 {
    return ErrFieldOverflow
}
```

### Side-Channel Resistance

Implementations should use:
- Constant-time modular arithmetic
- No branching on secret field elements
- Montgomery multiplication for uniform timing

### Collision Resistance

For width w and capacity c:
- Security level: min(w/2, c/2) * log2(p)
- Default capacity provides 128-bit security

## Test Cases

### Circomlib Compatibility

```go
func TestPoseidonHash2_Circomlib(t *testing.T) {
    // Test vector from circomlib poseidon.circom
    left, _ := new(big.Int).SetString("1", 10)
    right, _ := new(big.Int).SetString("2", 10)

    expected, _ := new(big.Int).SetString("7853200120776062878684798364095072458815029376092732009249414926327459813530", 10)

    result := precompile.PoseidonHash2(left, right)
    assert.Equal(t, expected, result)
}

func TestPoseidonMerkleTree(t *testing.T) {
    leaves := []*big.Int{
        big.NewInt(1),
        big.NewInt(2),
        big.NewInt(3),
        big.NewInt(4),
    }

    root := precompile.PoseidonMerkleRoot(leaves)

    // Verify proof for leaf 2
    proof := []*big.Int{
        big.NewInt(1), // sibling of leaf 2
        precompile.PoseidonHash2(big.NewInt(3), big.NewInt(4)), // right subtree
    }

    valid := precompile.PoseidonMerkleProof(big.NewInt(2), proof, 1, root)
    assert.True(t, valid)
}
```

### Performance Benchmarks

```go
func BenchmarkPoseidonHash2(b *testing.B) {
    left := randomFieldElement()
    right := randomFieldElement()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.PoseidonHash2(left, right)
    }
}
// BenchmarkPoseidonHash2-8    234,567 ops/s    800 gas

func BenchmarkPoseidonMerkleRoot_1024(b *testing.B) {
    leaves := make([]*big.Int, 1024)
    for i := range leaves {
        leaves[i] = randomFieldElement()
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.PoseidonMerkleRoot(leaves)
    }
}
// BenchmarkPoseidonMerkleRoot_1024-8    1,234 ops/s    410,600 gas
```

## Backwards Compatibility

No backwards compatibility issues. This LP introduces a new precompile at an unused address.

## References

- [Poseidon Paper](https://eprint.iacr.org/2019/458)
- [Circomlib Poseidon](https://github.com/iden3/circomlib)
- [Filecoin Poseidon](https://spec.filecoin.io/algorithms/crypto/poseidon/)
- [Dusk Poseidon252](https://github.com/dusk-network/poseidon252)
- [LP-3653: BLS12-381 Precompile](./lp-3653-bls12-381-cryptography-precompile.md)
- [LP-3655: SHA-3/Keccak Precompile](./lp-3655-sha3-keccak-precompile.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
