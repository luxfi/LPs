# LP-8100: FHE Precompiles and Infrastructure

| Field | Value |
|-------|-------|
| LP | 8100 |
| Title | Fully Homomorphic Encryption Precompiles and Infrastructure |
| Author | Lux Network |
| Status | Draft |
| Type | Standards Track |
| Category | Core |
| Created | 2025-12-27 |

## Abstract

This LP specifies the integration of Fully Homomorphic Encryption (FHE) capabilities into Lux EVM chains, enabling computation on encrypted data without decryption. The implementation uses permissively-licensed open-source libraries (OpenFHE and Lattice) to provide a vendor-neutral, commercially-friendly FHE stack.

## Motivation

FHE enables powerful privacy-preserving applications:

1. **Confidential DeFi**: Trade on encrypted order books, private AMM positions
2. **Private Voting**: Tally votes without revealing individual choices
3. **Sealed Auctions**: Bid without revealing amounts until close
4. **Medical Data**: Process health records while maintaining HIPAA compliance
5. **Private AI**: Run inference on encrypted data

Current FHE blockchain implementations suffer from:
- **Restrictive Licensing**: BSD-3-Clause-Clear with commercial restrictions
- **Vendor Lock-in**: Proprietary coprocessors and key management
- **Single-Scheme Support**: Only TFHE, limiting use cases

Lux's approach provides:
- **Permissive Licensing**: BSD-2-Clause (OpenFHE) and Apache-2.0 (Lattice)
- **Multi-Scheme Support**: TFHE, FHEW, CKKS, BGV, BFV
- **Pure Go Option**: Lattice library for microservices without CGO
- **Threshold Integration**: Native multiparty FHE via T-Chain

## Specification

### FHE Libraries

#### OpenFHE (C++)

The `luxfi/fhe` repository provides OpenFHE-based FHE capabilities:

| Scheme | Use Case | Security Level |
|--------|----------|----------------|
| TFHE/CGGI | Boolean circuits, ~10ms bootstrap | 128-bit |
| FHEW | Binary operations, functional bootstrap | 128-bit |
| CKKS | Approximate real number arithmetic | 128-bit |
| BGV | Exact integer arithmetic | 128-bit |
| BFV | Scale-invariant integer arithmetic | 128-bit |

**Performance Benchmarks** (M1 Max):

| Operation | TFHE | CKKS |
|-----------|------|------|
| Add | 0.1ms | 0.2ms |
| Multiply | 1.5ms | 5ms |
| Bootstrap | 12ms | 200ms |
| Comparison | 15ms | 50ms |

#### Lattice (Go)

The `luxfi/lattice` repository provides pure Go homomorphic encryption:

- **No CGO**: Compiles to WASM, runs in browsers
- **Multiparty**: Built-in threshold key generation and decryption
- **CKKS/BGV**: Both exact and approximate arithmetic
- **Ring Operations**: Optimized NTT, RNS arithmetic

```go
import (
    "github.com/luxfi/lattice/schemes/ckks"
    "github.com/luxfi/lattice/multiparty"
)

// Create context with 128-bit security
params := ckks.NewParametersFromLiteral(ckks.PN14QP438)
kgen := ckks.NewKeyGenerator(params)

// Generate keys
sk, pk := kgen.GenKeyPair()

// Encrypt real numbers
encoder := ckks.NewEncoder(params)
encryptor := ckks.NewEncryptor(params, pk)

values := []complex128{3.14159, 2.71828, 1.41421}
plaintext := encoder.EncodeNew(values, params.MaxLevel(), params.DefaultScale())
ciphertext := encryptor.EncryptNew(plaintext)
```

### EVM Precompiles

#### Address Allocation

| Address | Name | Description |
|---------|------|-------------|
| 0x80 | FHE_CORE | Core FHE operations |
| 0x81 | FHE_VERIFY | Input verification |
| 0x82 | FHE_DECRYPT | Threshold decryption |
| 0x83 | FHE_REENCRYPT | Re-encryption for user |

#### FHE_CORE (0x80)

Main precompile for FHE operations:

```solidity
// Opcode format: [1 byte opcode][operands...]

// Arithmetic
OP_ADD      = 0x01  // (handle_a, handle_b) -> handle_result
OP_SUB      = 0x02
OP_MUL      = 0x03
OP_DIV      = 0x04  // Only for CKKS approximation
OP_REM      = 0x05

// Comparison (returns encrypted bool)
OP_LT       = 0x10
OP_LTE      = 0x11
OP_GT       = 0x12
OP_GTE      = 0x13
OP_EQ       = 0x14
OP_NE       = 0x15
OP_MIN      = 0x16
OP_MAX      = 0x17

// Bitwise
OP_AND      = 0x20
OP_OR       = 0x21
OP_XOR      = 0x22
OP_NOT      = 0x23
OP_SHL      = 0x24
OP_SHR      = 0x25

// Control
OP_SELECT   = 0x30  // (cond, if_true, if_false) -> result
OP_REQ      = 0x31  // Require encrypted bool is true

// Type conversion
OP_CAST     = 0x40  // Cast between encrypted types
OP_ENCRYPT  = 0x41  // Trivial encrypt (plaintext -> ciphertext)
```

#### Gas Costs

| Operation | euint8 | euint32 | euint64 | euint256 |
|-----------|--------|---------|---------|----------|
| add/sub   | 50,000 | 60,000 | 80,000 | 150,000 |
| mul       | 100,000 | 150,000 | 250,000 | 500,000 |
| div/rem   | 150,000 | 200,000 | 350,000 | 700,000 |
| lt/gt/eq  | 80,000 | 100,000 | 150,000 | 300,000 |
| and/or/xor| 30,000 | 40,000 | 50,000 | 100,000 |
| select    | 60,000 | 80,000 | 120,000 | 250,000 |
| encrypt   | 50,000 | 60,000 | 80,000 | 150,000 |
| decrypt   | 200,000 | 200,000 | 200,000 | 200,000 |

### Solidity Library

```solidity
// SPDX-License-Identifier: BSD-2-Clause
pragma solidity ^0.8.20;

/// @title Encrypted Types
type ebool is uint256;
type euint8 is uint256;
type euint16 is uint256;
type euint32 is uint256;
type euint64 is uint256;
type euint128 is uint256;
type euint256 is uint256;
type eaddress is uint256;

/// @title FHE Library
library FHE {
    address constant FHE_CORE = address(0x80);
    address constant FHE_VERIFY = address(0x81);
    address constant FHE_DECRYPT = address(0x82);
    address constant FHE_REENCRYPT = address(0x83);
    
    // Arithmetic
    function add(euint32 a, euint32 b) internal returns (euint32) {
        bytes memory input = abi.encodePacked(
            uint8(0x01), // OP_ADD
            uint8(2),    // euint32 type
            euint32.unwrap(a),
            euint32.unwrap(b)
        );
        (bool success, bytes memory result) = FHE_CORE.call(input);
        require(success, "FHE: add failed");
        return euint32.wrap(abi.decode(result, (uint256)));
    }
    
    // Comparison
    function lt(euint32 a, euint32 b) internal returns (ebool) {
        bytes memory input = abi.encodePacked(
            uint8(0x10), // OP_LT
            uint8(2),    // euint32 type
            euint32.unwrap(a),
            euint32.unwrap(b)
        );
        (bool success, bytes memory result) = FHE_CORE.call(input);
        require(success, "FHE: lt failed");
        return ebool.wrap(abi.decode(result, (uint256)));
    }
    
    // Conditional selection
    function select(ebool cond, euint32 a, euint32 b) internal returns (euint32) {
        bytes memory input = abi.encodePacked(
            uint8(0x30), // OP_SELECT
            uint8(2),    // euint32 type
            ebool.unwrap(cond),
            euint32.unwrap(a),
            euint32.unwrap(b)
        );
        (bool success, bytes memory result) = FHE_CORE.call(input);
        require(success, "FHE: select failed");
        return euint32.wrap(abi.decode(result, (uint256)));
    }
    
    // Decrypt (requires T-Chain authorization)
    function decrypt(euint32 value) internal returns (uint32) {
        bytes memory input = abi.encodePacked(
            uint8(2), // euint32 type
            euint32.unwrap(value)
        );
        (bool success, bytes memory result) = FHE_DECRYPT.call(input);
        require(success, "FHE: decrypt failed");
        return uint32(abi.decode(result, (uint256)));
    }
}
```

### T-Chain Integration

The T-Chain (Threshold Chain) provides:

1. **Distributed Key Generation**: Generate network FHE keys across validators
2. **Threshold Decryption**: Require t-of-n validators to decrypt
3. **Key Rotation**: Periodic resharing without revealing secret
4. **Access Control**: On-chain ACLs for decrypt permissions

```go
// T-Chain key ceremony
import "github.com/luxfi/lattice/multiparty"

// Setup
params := ckks.NewParametersFromLiteral(ckks.PN14QP438)
crs := multiparty.NewCRS(params.Parameters)

// Each validator generates key share
type ValidatorNode struct {
    id     int
    share  *multiparty.SecretShare
    pubKey *rlwe.PublicKey
}

func (v *ValidatorNode) KeyGenRound1() *multiparty.Share1 {
    return multiparty.GenShare1(crs, v.id, v.share)
}

func (v *ValidatorNode) KeyGenRound2(shares1 []*multiparty.Share1) *multiparty.Share2 {
    return multiparty.GenShare2(crs, v.id, v.share, shares1)
}

// Combine for collective public key
func CombinePublicKey(shares2 []*multiparty.Share2) *rlwe.PublicKey {
    return multiparty.GenCollectivePublicKey(shares2)
}
```

### Ciphertext Storage

Handles are uint256 keys referencing stored ciphertexts:

```
Handle Format (256 bits):
┌────────────┬────────────┬────────────────────────────────────┐
│ Type (8)   │ Zone (8)   │ Ciphertext ID (240 bits)           │
└────────────┴────────────┴────────────────────────────────────┘

Type: 0=ebool, 1=euint8, 2=euint16, 3=euint32, ...
Zone: Security zone for access control
ID: Unique identifier for the ciphertext
```

Storage options:
1. **On-chain**: Store in state trie (expensive, ~100KB per ciphertext)
2. **Off-chain**: Store in coprocessor/IPFS (handles only on-chain)
3. **Hybrid**: Recent ciphertexts on-chain, archived off-chain

### Execution Models

#### Synchronous (Simple)

```
User Tx → EVM → FHE Precompile → OpenFHE → Result → Continue EVM
```

- Blocks until complete
- ~10-100ms per operation
- Suitable for low-volume chains

#### Asynchronous (Production)

```
User Tx → EVM → Emit FHE Event → Return Handle
                      ↓
              Coprocessor Queue
                      ↓
                OpenFHE Execute
                      ↓
              Callback Tx with Result
```

- Non-blocking execution
- Higher throughput
- Requires result polling or callbacks

## Security Considerations

### Key Management

- Network public key available to all for encryption
- Secret key NEVER exists in a single location
- Threshold t-of-n required for any decryption
- Key rotation every epoch (configurable)

### Access Control

Decrypt operations require:
1. Sender owns the ciphertext (created it or received via transfer)
2. T-Chain ACL approval for the decrypt
3. Threshold validators participate

### Timing Attacks

- Constant-time implementations required
- No early-exit on comparison operations
- Uniform gas costs regardless of plaintext values

## Implementation Roadmap

### Phase 1: Core Integration (Q1 2025)
- [ ] FHE precompile with synchronous execution
- [ ] OpenFHE Go bindings
- [ ] Handle storage in state trie
- [ ] Basic Solidity library

### Phase 2: Threshold Decryption (Q2 2025)
- [ ] Lattice multiparty integration
- [ ] T-Chain key ceremony protocol
- [ ] Validator key share management
- [ ] Decrypt authorization flow

### Phase 3: Async Coprocessor (Q3 2025)
- [ ] Event-based FHE execution
- [ ] Result callback mechanism
- [ ] Parallel operation batching
- [ ] Ciphertext garbage collection

### Phase 4: Production Hardening (Q4 2025)
- [ ] Comprehensive gas metering
- [ ] Key rotation protocol
- [ ] GPU acceleration (optional)
- [ ] Security audit

## Backwards Compatibility

FHE precompiles are additive and do not affect existing EVM behavior. Chains without FHE support will revert on precompile calls at 0x80-0x83.

## Test Cases

See `luxfi/fhe/contracts/test` for comprehensive test coverage including:
- Arithmetic operations on all encrypted types
- Comparison operators
- Conditional selection
- Input verification
- Threshold decryption

## References

- [OpenFHE Documentation](https://openfhe-development.readthedocs.io/)
- [Lux FHE Library](https://github.com/luxfi/fhe)
- [Lux Lattice Library](https://github.com/luxfi/lattice)
- [TFHE Original Paper](https://eprint.iacr.org/2018/421)
- [CKKS Paper](https://eprint.iacr.org/2016/421)
- [BGV Paper](https://eprint.iacr.org/2011/277)
- [Threshold FHE](https://eprint.iacr.org/2020/304)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
