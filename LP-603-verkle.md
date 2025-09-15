# LP-600: Verkle Trees for Stateless Clients

## Overview

LP-600 standardizes Verkle tree implementation across the Lux ecosystem, enabling constant-size proofs (~1KB) for state verification regardless of state size. This proposal enables stateless clients, light validators, and efficient cross-chain state proofs.

## Motivation

Current Merkle Patricia Tries require O(log n) proof sizes, making light clients impractical for large state. Verkle trees provide:
- **Constant proof size**: ~1KB regardless of state size
- **Efficient updates**: O(1) witness generation
- **Stateless validation**: Validators need no state storage
- **Cross-chain efficiency**: Compact proofs for bridge operations

## Technical Specification

### Verkle Tree Structure

```go
package verkle

import (
    "github.com/luxfi/go-verkle"
    "github.com/luxfi/lux/crypto/bls"
)

// VerkleConfig defines parameters for Verkle trees
type VerkleConfig struct {
    // Tree width (branching factor)
    Width uint8 // Default: 256
    
    // Commitment scheme
    Scheme CommitmentScheme // IPA or KZG
    
    // Field parameters
    Field FieldParams
}

// VerkleTree represents a Verkle tree
type VerkleTree struct {
    Root VerkleNode
    Config VerkleConfig
    
    // Cached commitments for efficiency
    commitmentCache map[Hash]Commitment
}

// VerkleNode represents a node in the tree
type VerkleNode interface {
    // Commitment returns the node's vector commitment
    Commitment() *bls.Commitment
    
    // Insert adds a key-value pair
    Insert(key []byte, value []byte) error
    
    // Delete removes a key
    Delete(key []byte) error
    
    // CreateWitness generates a proof for keys
    CreateWitness(keys [][]byte) (*VerkleProof, error)
}

// VerkleProof is a constant-size proof
type VerkleProof struct {
    // IPA or KZG proof (constant ~1KB)
    Proof []byte
    
    // Commitments along the path
    Commitments []Commitment
    
    // Values and their positions
    Values map[string][]byte
    
    // Depth information
    Depths []uint8
}
```

### Commitment Schemes

#### IPA (Inner Product Argument)
```go
type IPACommitment struct {
    // Pedersen commitment
    C *bls.G1Point
    
    // Blinding factor
    r *bls.Fr
}

func (c *IPACommitment) Prove(
    values [][]byte,
    indices []uint64,
) (*IPAProof, error) {
    // Generate constant-size IPA proof
    // Uses recursive halving to achieve O(log n) rounds
    // But constant proof size
}
```

#### KZG (Kate-Zaverucha-Goldberg)
```go
type KZGCommitment struct {
    // Polynomial commitment
    C *bls.G1Point
    
    // Trusted setup reference
    Setup *TrustedSetup
}

func (c *KZGCommitment) Prove(
    polynomial []bls.Fr,
    point bls.Fr,
) (*KZGProof, error) {
    // Single group element proof
    // Requires trusted setup but very efficient
}
```

### State Transition with Verkle

```go
// StateDB using Verkle trees
type VerkleStateDB struct {
    tree *VerkleTree
    
    // Witness accumulator for block
    witness *WitnessAccumulator
}

func (db *VerkleStateDB) ExecuteBlock(
    block *Block,
) (*VerkleWitness, error) {
    // Pre-state root
    preRoot := db.tree.Root.Commitment()
    
    // Collect all accessed keys
    accessList := ExtractAccessList(block)
    
    // Generate pre-state witness
    preWitness, _ := db.tree.CreateWitness(accessList)
    
    // Execute transactions
    for _, tx := range block.Transactions {
        db.ExecuteTx(tx)
    }
    
    // Post-state root
    postRoot := db.tree.Root.Commitment()
    
    // Create block witness
    return &VerkleWitness{
        PreStateRoot:  preRoot,
        PostStateRoot: postRoot,
        AccessedKeys:  accessList,
        Proof:         preWitness.Proof,
    }, nil
}
```

### Cross-Chain State Proofs

```solidity
contract VerkleVerifier {
    using BLS for bytes;
    
    struct StateProof {
        bytes32 stateRoot;
        bytes proof;  // ~1KB constant size
        bytes[] values;
        uint256[] indices;
    }
    
    function verifyStateProof(
        StateProof calldata proof
    ) external view returns (bool) {
        // Verify IPA/KZG proof
        return BLS.verifyVerkleProof(
            proof.stateRoot,
            proof.proof,
            proof.values,
            proof.indices
        );
    }
    
    function verifyAndExecute(
        StateProof calldata sourceProof,
        bytes calldata action
    ) external {
        require(verifyStateProof(sourceProof), "Invalid proof");
        
        // Execute cross-chain action with verified state
        _execute(action, sourceProof.values);
    }
}
```

### Light Client Protocol

```go
type VerkleLight Client struct {
    // Only stores block headers
    headers map[uint64]*Header
    
    // No state storage required
}

func (c *VerkleLight Client) VerifyTransaction(
    tx *Transaction,
    witness *VerkleWitness,
) error {
    // Verify witness against header root
    header := c.headers[tx.BlockNumber]
    
    if !VerifyVerkleProof(
        header.StateRoot,
        witness.Proof,
        witness.AccessedKeys,
    ) {
        return ErrInvalidWitness
    }
    
    // Verify transaction execution
    return c.verifyExecution(tx, witness)
}
```

## Implementation Phases

### Phase 1: Core Verkle Library
- Implement IPA commitments
- Basic tree operations
- Witness generation

### Phase 2: State Migration
- Shadow mode operation
- Parallel Merkle/Verkle trees
- Migration tooling

### Phase 3: Network Upgrade
- Activate Verkle state root
- Enable stateless clients
- Cross-chain Verkle proofs

### Phase 4: Optimizations
- GPU-accelerated commitments
- Batch witness generation
- Compressed proof formats

## Security Considerations

1. **Trusted Setup** (KZG only): Use Powers of Tau ceremony
2. **Quantum Resistance**: IPA is post-quantum secure
3. **Proof Malleability**: Use Fiat-Shamir for non-interactive proofs
4. **State Size Attacks**: Limit tree depth to prevent DoS

## Performance Targets

- **Proof Size**: <1.5KB constant
- **Proof Generation**: <10ms for 1000 keys
- **Proof Verification**: <5ms
- **State Updates**: <1ms per transaction
- **Migration Time**: <24 hours for full state

## Testing

```go
func TestVerkleProofSize(t *testing.T) {
    tree := NewVerkleTree(DefaultConfig())
    
    // Insert 1 million key-value pairs
    for i := 0; i < 1_000_000; i++ {
        key := Hash(i)
        value := RandomBytes(32)
        tree.Insert(key, value)
    }
    
    // Generate proof for 100 keys
    keys := RandomKeys(100)
    proof, _ := tree.CreateWitness(keys)
    
    // Proof should be constant size
    assert.Less(t, len(proof.Proof), 1500) // <1.5KB
}
```

## References

1. [Verkle Trees (Vitalik Buterin)](https://vitalik.ca/general/2021/06/18/verkle.html)
2. [go-verkle Implementation](https://github.com/ethereum/go-verkle)
3. [IPA Commitments](https://eprint.iacr.org/2019/1021)
4. [KZG Polynomial Commitments](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf)

---

**Status**: Draft  
**Category**: Core  
**Created**: 2025-01-09