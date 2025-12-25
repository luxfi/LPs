---
lp: 3550
title: Verkle Proof Verification Precompile
description: Precompiled contract for efficient Verkle proof verification
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-23
requires: 3701, 3702
tags: [core, precompile, verkle]
order: 745
---

# LP-3550: Verkle Proof Verification Precompile

## Abstract

This LP specifies a precompiled contract for verifying Verkle tree proofs on-chain, enabling smart contracts to verify state proofs from other chains or L2s.

## Motivation

Cross-chain bridges and L2 solutions need to verify state proofs:
- Bridge contracts verify source chain state
- Optimistic rollups verify fraud proofs
- ZK rollups verify state transitions

## Specification

### Precompile Address

```solidity
0x0000000000000000000000000000000000000014
```

### Input Format

```solidity
| Field          | Offset | Size   | Description                    |
|----------------|--------|--------|--------------------------------|
| commitment     | 0      | 32     | Tree root commitment           |
| proof_offset   | 32     | 32     | Offset to proof data           |
| proof_length   | 64     | 32     | Length of proof data           |
| keys_offset    | 96     | 32     | Offset to keys array           |
| keys_count     | 128    | 32     | Number of keys                 |
| values_offset  | 160    | 32     | Offset to values array         |
| proof_data     | var    | var    | IPA or KZG proof               |
| keys           | var    | var    | Array of 32-byte keys          |
| values         | var    | var    | Array of 32-byte values        |
```

### Output Format

```solidity
| Field    | Offset | Size | Description                         |
|----------|--------|------|-------------------------------------|
| valid    | 0      | 32   | 1 if proof valid, 0 otherwise      |
```

### Gas Cost

```go
func verkleProofGas(keyCount int) uint64 {
    return VERKLE_BASE_GAS + uint64(keyCount) * VERKLE_PER_KEY_GAS
}

const (
    VERKLE_BASE_GAS    = 3000    // Base verification cost
    VERKLE_PER_KEY_GAS = 200     // Per key in multiproof
)
```go

### Implementation

```go
type verkleProofPrecompile struct{}

func (p *verkleProofPrecompile) RequiredGas(input []byte) uint64 {
    keyCount := binary.BigEndian.Uint64(input[128:160])
    return VERKLE_BASE_GAS + keyCount * VERKLE_PER_KEY_GAS
}

func (p *verkleProofPrecompile) Run(input []byte) ([]byte, error) {
    // Parse input
    commitment := input[0:32]
    proofOffset := binary.BigEndian.Uint64(input[32:64])
    proofLength := binary.BigEndian.Uint64(input[64:96])
    keysOffset := binary.BigEndian.Uint64(input[96:128])
    keysCount := binary.BigEndian.Uint64(input[128:160])
    valuesOffset := binary.BigEndian.Uint64(input[160:192])
    
    proof := input[proofOffset:proofOffset+proofLength]
    keys := parseKeys(input[keysOffset:], keysCount)
    values := parseValues(input[valuesOffset:], keysCount)
    
    // Verify proof
    valid := verkle.VerifyMultiproof(commitment, proof, keys, values)
    
    if valid {
        return common.LeftPadBytes([]byte{1}, 32), nil
    }
    return make([]byte, 32), nil
}
```

### Use Cases

#### L2 State Verification
```solidity
function verifyL2State(
    bytes32 stateRoot,
    bytes calldata proof,
    bytes32[] calldata keys,
    bytes32[] calldata values
) external view returns (bool) {
    bytes memory input = abi.encodePacked(
        stateRoot,
        // ... encode proof, keys, values
    );
    
    (bool success, bytes memory result) = VERKLE_PRECOMPILE.staticcall(input);
    return success && abi.decode(result, (uint256)) == 1;
}
```solidity

## Rationale

Precompile chosen over library:
- Much lower gas cost (3000 + 200/key vs 100k+)
- Native curve operations
- Consistent implementation

## Backwards Compatibility

This standard is fully backwards compatible with existing contracts and infrastructure. The standard is additive and does not modify existing functionality.

## Security Considerations

- Input validation prevents malformed proofs
- Gas limits prevent DoS via large proofs
- Commitment binding prevents proof forgery

## References

- [EIP-7545: Verkle Proof Verification Precompile](https://github.com/ethereum/EIPs/issues/7545)
- [LP-3701: Verkle Trees](./lp-3701-verkle-trees-for-state-management.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
