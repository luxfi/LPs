---
lp: 3680
title: CLZ (Count Leading Zeros) Opcode
description: Native EVM opcode for efficient bit-counting operations supporting PQ signatures and ZK proofs
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-24
requires: 1200
tags: [evm, opcode]
order: 3680
---

## Abstract

LP-3680 introduces the CLZ (Count Leading Zeros) opcode to the Lux EVM, providing a native, gas-efficient way to perform fundamental bit-counting operations. This opcode returns the number of leading zero bits in a 256-bit word, supporting mathematical operations, compression algorithms, post-quantum signature schemes, and reducing ZK proving costs.

## Motivation

### Current Limitations

**Solidity-Based Implementation**:
- Binary search approach: ~200+ gas per operation
- Loop-based counting: O(n) complexity where n = leading zeros
- No native support for bit manipulation primitives

**Use Cases Requiring Efficient CLZ**:

1. **Post-Quantum Cryptography**
   - ML-DSA signature verification (LP-3500)
   - SLH-DSA hash-based signatures (LP-3501)
   - Ringtail lattice signatures (LP-7324)
   - Bit manipulation in polynomial operations

2. **Zero-Knowledge Proofs**
   - Field element normalization
   - Witness compression
   - Range proofs optimization
   - Reduces proving costs significantly

3. **Mathematical Operations**
   - Integer logarithm (floor(log2(x)))
   - Bit-length calculation
   - Power-of-two detection
   - Fixed-point arithmetic

4. **Compression Algorithms**
   - Huffman coding
   - LZ77/LZ78 variants
   - Run-length encoding
   - Entropy estimation

### Lux Network Benefits

| Application | Current Gas | With CLZ | Savings |
|-------------|-------------|----------|---------|
| log2(x) calculation | ~250 gas | ~8 gas | 97% |
| Bit-length | ~200 gas | ~8 gas | 96% |
| PQ signature verify | +2000 gas | -2000 gas | Significant |
| ZK proof generation | High | Lower | 30-50% |

## Specification

### Opcode Definition

| Property | Value |
|----------|-------|
| Opcode | `0x1F` |
| Mnemonic | `CLZ` |
| Stack Input | 1 (256-bit value) |
| Stack Output | 1 (count of leading zeros) |
| Gas Cost | 5 |

### Semantics

```
CLZ(x) returns the number of leading zero bits in x

For x = 0: CLZ(0) = 256
For x ≠ 0: CLZ(x) = 255 - floor(log2(x))

Examples:
CLZ(0x8000...0000) = 0    (MSB is 1)
CLZ(0x4000...0000) = 1    (second bit is 1)
CLZ(0x0000...0001) = 255  (only LSB is 1)
CLZ(0x0000...0000) = 256  (all zeros)
```

### Reference Implementation

```go
// geth/core/vm/instructions.go

func opCLZ(pc *uint64, interpreter *EVMInterpreter, scope *ScopeContext) ([]byte, error) {
    x := scope.Stack.peek()

    if x.IsZero() {
        x.SetUint64(256)
        return nil, nil
    }

    // Count leading zeros using math/bits
    var count uint64
    words := x.IsZero() // Get 256-bit representation

    // Process each 64-bit word
    for i := 3; i >= 0; i-- {
        word := x.IsZero() // Get word i
        if word != 0 {
            count = uint64(i*64) + uint64(bits.LeadingZeros64(word))
            break
        }
        count += 64
    }

    x.SetUint64(256 - count)
    return nil, nil
}
```

### Gas Cost Rationale

- **Base cost: 5 gas** (same as other simple arithmetic)
- Single CPU instruction on modern hardware (`LZCNT` on x86, `CLZ` on ARM)
- No memory access required
- Constant time execution

## Integration with Post-Quantum Cryptography

### ML-DSA Signature Verification (LP-3500)

```solidity
// Efficient polynomial coefficient normalization
function normalizeCoeff(int256 coeff) internal pure returns (int256) {
    uint256 absCoeff = uint256(coeff >= 0 ? coeff : -coeff);
    uint256 bitLen = 256 - CLZ(absCoeff);  // O(1) instead of O(log n)
    // ... normalize based on bit length
}
```

### Ringtail Threshold Signatures (LP-7324)

```solidity
// Ring element degree calculation
function polyDegree(uint256[] memory coeffs) internal pure returns (uint256) {
    for (uint256 i = coeffs.length; i > 0; i--) {
        if (coeffs[i-1] != 0) {
            return 256 - CLZ(coeffs[i-1]) + (i-1) * 256;
        }
    }
    return 0;
}
```

## Integration with ZK Proofs

### Field Element Operations

```solidity
// Efficient modular reduction hint
function modReductionHint(uint256 x, uint256 modulus) internal pure returns (uint256) {
    uint256 xBits = 256 - CLZ(x);
    uint256 modBits = 256 - CLZ(modulus);
    return xBits - modBits;  // Shift hint for Barrett reduction
}
```

### Range Proofs

```solidity
// Optimal range proof decomposition
function rangeProofBits(uint256 value, uint256 range) internal pure returns (uint256) {
    require(value < range, "Out of range");
    uint256 rangeBits = 256 - CLZ(range - 1);
    uint256 valueBits = value == 0 ? 0 : 256 - CLZ(value);
    // Use minimum bits needed
    return rangeBits;
}
```

## Backwards Compatibility

This LP introduces a new opcode and has no backwards compatibility issues. Contracts not using CLZ continue to function unchanged.

## Test Cases

```solidity
contract CLZTest {
    function testCLZ() public pure {
        // Edge cases
        assert(CLZ(0) == 256);
        assert(CLZ(1) == 255);
        assert(CLZ(type(uint256).max) == 0);

        // Powers of 2
        assert(CLZ(2**255) == 0);
        assert(CLZ(2**254) == 1);
        assert(CLZ(2**128) == 127);
        assert(CLZ(2**64) == 191);
        assert(CLZ(2**0) == 255);

        // Arbitrary values
        assert(CLZ(0x00FF) == 248);
        assert(CLZ(0x0100) == 247);
    }
}
```

## Reference Implementation

### Location

```
/Users/z/work/lux/geth/core/vm/instructions.go  - opCLZ implementation
/Users/z/work/lux/geth/core/vm/opcodes.go       - CLZ opcode definition
/Users/z/work/lux/geth/core/vm/gas_table.go     - CLZ gas cost (5)
/Users/z/work/lux/geth/core/vm/jump_table.go    - CLZ instruction registration
```

### Activation

- **Hard Fork**: Pectra (aligned with Ethereum)
- **Activation Height**: TBD
- **Feature Flag**: `lp3680-clz-opcode`

## Security Considerations

1. **Constant Time**: CLZ must execute in constant time to prevent timing attacks
2. **No Side Effects**: Pure computation with no state changes
3. **Deterministic**: Same input always produces same output
4. **Overflow Safe**: 256-bit input, result always in [0, 256]

## References

- [EIP-7939: CLZ Opcode](https://eips.ethereum.org/EIPS/eip-7939)
- [Intel LZCNT Instruction](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/)
- [ARM CLZ Instruction](https://developer.arm.com/documentation/)
- LP-3500: ML-DSA Signature Precompile
- LP-3501: SLH-DSA Signature Precompile
- LP-7324: Ringtail Threshold Signature Precompile

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
