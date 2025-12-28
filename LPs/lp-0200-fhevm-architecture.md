---
lp: 200
title: fhEVM - Fully Homomorphic Encryption Virtual Machine
description: Native FHE operations in the Lux EVM with GPU acceleration
author: Lux Network (@luxfi)
status: Draft
type: Standards Track
category: Core
created: 2025-12-28
requires: 11, 300
---

# LP-0200: fhEVM - Fully Homomorphic Encryption Virtual Machine

## Abstract

This LP specifies the fhEVM (Fully Homomorphic Encryption Virtual Machine), a set of native precompiles enabling FHE operations directly within the Lux EVM. The fhEVM provides encrypted computation without decryption, supporting privacy-preserving smart contracts, confidential DeFi, and private AI inference.

## Motivation

Traditional blockchain transparency prevents adoption for privacy-sensitive applications:
- Financial applications require confidential balances and transfers
- Healthcare data must remain encrypted yet computable
- Enterprise contracts need private business logic
- AI models require protection during inference

FHE enables computation on encrypted data, but pure software implementations are prohibitively slow (100-1000x overhead). The fhEVM addresses this through:
1. Native precompiles for FHE operations
2. GPU acceleration via MLX/CUDA backends
3. Integration with threshold decryption for secure key management
4. Optimized parameter sets for blockchain use cases

## Specification

### Precompile Addresses

| Address | Precompile | Description |
|---------|-----------|-------------|
| 0x0500 | FHE_ENCRYPT | Encrypt plaintext to ciphertext |
| 0x0501 | FHE_ADD | Homomorphic addition |
| 0x0502 | FHE_SUB | Homomorphic subtraction |
| 0x0503 | FHE_MUL | Homomorphic multiplication |
| 0x0504 | FHE_DIV | Homomorphic division |
| 0x0505 | FHE_LT | Less than comparison |
| 0x0506 | FHE_LE | Less than or equal |
| 0x0507 | FHE_EQ | Equality comparison |
| 0x0508 | FHE_AND | Bitwise AND |
| 0x0509 | FHE_OR | Bitwise OR |
| 0x050A | FHE_XOR | Bitwise XOR |
| 0x050B | FHE_NOT | Bitwise NOT |
| 0x050C | FHE_SHL | Shift left |
| 0x050D | FHE_SHR | Shift right |
| 0x050E | FHE_MIN | Minimum of two values |
| 0x050F | FHE_MAX | Maximum of two values |
| 0x0510 | FHE_NEG | Negation |
| 0x0511 | FHE_CAST | Type casting |
| 0x0512 | FHE_VERIFY | Verify ciphertext validity |
| 0x0513 | FHE_REENCRYPT | Re-encrypt for new key |
| 0x0514 | FHE_RANDOM | Generate encrypted random |
| 0x0520 | FHE_THRESHOLD_DECRYPT | Threshold decryption request |

### Encrypted Types

| Type | Bits | Use Case |
|------|------|----------|
| euint4 | 4 | Small enums |
| euint8 | 8 | Bytes, flags |
| euint16 | 16 | Short integers |
| euint32 | 32 | Standard integers |
| euint64 | 64 | Timestamps, amounts |
| euint128 | 128 | Large values |
| euint160 | 160 | Ethereum addresses |
| euint256 | 256 | EVM words, hashes |
| ebool | 1 | Boolean values |

### Solidity Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.20;

type euint8 is uint256;
type euint16 is uint256;
type euint32 is uint256;
type euint64 is uint256;
type euint128 is uint256;
type euint160 is uint256;
type euint256 is uint256;
type ebool is uint256;
type einput is bytes32;

library FHE {
    // Encryption
    function asEuint8(uint8 value) internal view returns (euint8);
    function asEuint64(uint64 value) internal view returns (euint64);
    function asEuint256(uint256 value) internal view returns (euint256);
    function asEbool(bool value) internal view returns (ebool);
    
    // Input verification (from user-provided encrypted input)
    function asEuint64(einput handle, bytes calldata proof) internal view returns (euint64);
    
    // Arithmetic
    function add(euint64 a, euint64 b) internal view returns (euint64);
    function sub(euint64 a, euint64 b) internal view returns (euint64);
    function mul(euint64 a, euint64 b) internal view returns (euint64);
    function div(euint64 a, euint64 b) internal view returns (euint64);
    
    // Comparisons (return encrypted boolean)
    function lt(euint64 a, euint64 b) internal view returns (ebool);
    function le(euint64 a, euint64 b) internal view returns (ebool);
    function eq(euint64 a, euint64 b) internal view returns (ebool);
    
    // Bitwise
    function and(euint64 a, euint64 b) internal view returns (euint64);
    function or(euint64 a, euint64 b) internal view returns (euint64);
    function xor(euint64 a, euint64 b) internal view returns (euint64);
    function not(euint64 a) internal view returns (euint64);
    
    // Control flow
    function select(ebool condition, euint64 a, euint64 b) internal view returns (euint64);
    
    // Decryption (via threshold network)
    function decrypt(euint64 ct) internal returns (uint64);
    
    // Access control
    function isAllowed(euint64 ct, address user) internal view returns (bool);
    function isSenderAllowed(euint64 ct) internal view returns (bool);
}
```

### Gateway for Threshold Decryption

```solidity
library Gateway {
    // Request decryption from threshold network
    function requestDecryption(
        uint256[] calldata ciphertexts,
        bytes4 callbackSelector,
        uint256 callbackMsgValue,
        uint256 maxTimestamp,
        bool passSignaturesToCaller
    ) internal returns (uint256 requestId);
    
    // Callback receives decrypted values
    // function myCallback(uint256 requestId, uint256[] memory values) external;
}
```

### Gas Costs

| Operation | Gas | Notes |
|-----------|-----|-------|
| FHE_ENCRYPT | 50,000 | Per encrypted type |
| FHE_ADD | 100,000 | Homomorphic addition |
| FHE_SUB | 100,000 | Homomorphic subtraction |
| FHE_MUL | 500,000 | Expensive, requires bootstrapping |
| FHE_DIV | 1,000,000 | Most expensive |
| FHE_LT/LE/EQ | 200,000 | Comparisons |
| FHE_AND/OR/XOR | 150,000 | Bitwise operations |
| FHE_THRESHOLD_DECRYPT | 200,000 | Plus oracle costs |

### GPU Acceleration

The fhEVM uses GPU backends for performance:

**Supported Backends:**
- **MLX** (Apple Silicon): M1/M2/M3/M4 unified memory
- **CUDA** (NVIDIA): H100/H200/A100 with NVLink
- **CPU** (fallback): Pure Go implementation

**Performance Targets:**

| Configuration | Throughput | Latency |
|--------------|------------|---------|
| M3 Max (Metal) | 60K gates/sec | <1ms |
| H200 (CUDA) | 250K gates/sec | <0.5ms |
| HGX H200 x8 | 1.5M gates/sec | <0.3ms |

### Parameter Sets

| Name | Security | LWE N | Ring N | Use Case |
|------|----------|-------|--------|----------|
| PN10QP27 | 128-bit | 1024 | 512 | Default, balanced |
| PN11QP54 | 128-bit | 2048 | 1024 | Higher precision |
| PN12QP109 | 256-bit | 4096 | 2048 | Post-quantum |

### Key Management

FHE keys are managed by the threshold network (LP-0203):
- **Public Key**: Available to all validators, used for encryption
- **Secret Key**: Distributed across threshold parties (5-of-9)
- **Bootstrap Key**: Generated during network genesis, ~170MB per key

## Rationale

### Why Native Precompiles?

1. **Performance**: Native code is 10-100x faster than EVM bytecode
2. **Gas Efficiency**: Single precompile call vs. many EVM opcodes
3. **Security**: Audited, constant-time implementations
4. **Upgradeability**: Backend can improve without contract changes

### Why GPU Acceleration?

FHE operations are embarrassingly parallel:
- NTT (Number Theoretic Transform) over polynomials
- Batch operations on multiple ciphertexts
- External product with decomposed digits

GPU backends achieve >100x speedup over CPU for batch operations.

### Why Threshold Decryption?

Single-party decryption would:
- Create a central point of failure
- Enable key compromise attacks
- Violate decentralization principles

Threshold decryption (5-of-9) ensures:
- No single party can decrypt
- Majority collusion required
- Publicly verifiable decryption proofs

## Backwards Compatibility

This LP adds new precompiles (0x0500-0x0520) that do not conflict with existing precompiles. Contracts not using FHE operations are unaffected.

## Security Considerations

### Ciphertext Malleability

All FHE operations preserve ciphertext validity. Invalid ciphertexts are rejected by FHE_VERIFY.

### Side-Channel Attacks

GPU kernels use constant-time implementations to prevent timing attacks.

### Key Compromise

If threshold parties are compromised:
- Historical data becomes decryptable
- Future data remains safe (re-keying possible)

## Reference Implementation

- Go Library: `github.com/luxfi/tfhe`
- Solidity Contracts: `github.com/luxfi/fhevm/contracts`
- GPU Backend: `github.com/luxfi/fhe` (OpenFHE fork with MLX)

## Test Vectors

```solidity
// Encrypt and add
euint64 a = FHE.asEuint64(42);
euint64 b = FHE.asEuint64(58);
euint64 sum = FHE.add(a, b);
uint64 result = Gateway.decrypt(sum); // 100

// Conditional select
ebool cond = FHE.asEbool(true);
euint64 selected = FHE.select(cond, a, b); // Returns encrypted 42
```

## Dependencies

- LP-0011: Chain Types (Z-Chain as L1)
- LP-0300: AI Mining Precompile (GPU infrastructure)
- LP-0203: Threshold FHE (key management)

---

*Copyright 2025 Lux Industries Inc. All rights reserved.*
