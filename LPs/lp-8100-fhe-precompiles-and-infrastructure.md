---
lp: 8100
title: Fully Homomorphic Encryption Precompiles and Infrastructure
description: Integration of FHE capabilities into Lux EVM chains for computation on encrypted data
author: Lux Network (@luxfi)
status: Implemented
type: Standards Track
category: Core
created: 2025-12-27
requires: 333, 5302
---

# LP-8100: FHE Precompiles and Infrastructure

## Abstract

This LP specifies the integration of Fully Homomorphic Encryption (FHE) capabilities into Lux EVM chains, enabling computation on encrypted data without decryption. The implementation uses permissively-licensed open-source libraries to provide a vendor-neutral, commercially-friendly FHE stack.

## Motivation

FHE enables powerful privacy-preserving applications:

1. **Confidential DeFi**: Trade on encrypted order books, private AMM positions
2. **Private Voting**: Tally votes without revealing individual choices
3. **Sealed Auctions**: Bid without revealing amounts until close
4. **Medical Data**: Process health records while maintaining HIPAA compliance
5. **Private AI**: Run inference on encrypted data

Lux's approach provides:
- **Permissive Licensing**: BSD-3-Clause and Apache-2.0
- **Multi-Scheme Support**: TFHE, FHEW, CKKS, BGV, BFV
- **Pure Go Option**: No CGO dependencies for microservices
- **Threshold Integration**: Native multiparty FHE via T-Chain

## Specification

### FHE Libraries Overview

Lux provides three complementary FHE libraries:

| Library | Language | License | Schemes | Use Case |
|---------|----------|---------|---------|----------|
| `luxfi/fhe` | C++ | BSD-3-Clause | TFHE, FHEW, CKKS, BGV, BFV | High-performance, multi-scheme |
| `luxfi/tfhe` | Go | Lux Research | TFHE (Threshold) | Pure Go fhEVM, no CGO |
| `luxfi/lattice` | Go | Apache-2.0 | CKKS, BGV | Primitives, multiparty |
| `luxfhe/*` | TS/Sol/Rust | BSD-3-Clause | TFHE | Full SDK stack (v1/v2) |

### luxfi/fhe (OpenFHE C++ Fork)

The `luxfi/fhe` repository is a fork of OpenFHE providing comprehensive FHE capabilities:

**Supported Schemes:**

| Scheme | Use Case | Performance | Notes |
|--------|----------|-------------|-------|
| TFHE/CGGI | Boolean circuits, fhEVM | 50ms/gate | Programmable bootstrapping |
| FHEW | Binary operations | 50ms/gate | Lightweight alternative |
| CKKS | Approximate arithmetic, ML | 0.7-16ms mul | Real number operations |
| BGV | Exact integer arithmetic | Similar to CKKS | Modular arithmetic |
| BFV | Scale-invariant integers | Similar to CKKS | Fixed-point operations |

**Architecture:**

```
luxfi/fhe/
├── src/
│   ├── binfhe/          # TFHE/FHEW boolean FHE
│   │   ├── lib/
│   │   │   ├── fhevm/   # fhEVM radix integer operations
│   │   │   ├── radix/   # Multi-bit integer support
│   │   │   └── batch/   # Batched operations
│   │   └── include/     # C++ headers
│   ├── pke/             # CKKS/BGV/BFV
│   └── core/            # Lattice primitives
├── go/                  # CGO bindings for Go
├── contracts/           # Solidity interfaces
└── benchmark/           # Performance tests
```

**Performance Benchmarks** (M1 Max, 128-bit security):

*TFHE/BinFHE (Boolean Gates):*
| Operation | LMKCDEY | GINX |
|-----------|---------|------|
| AND | 50.4ms | 50.6ms |
| OR | 50.5ms | 49.9ms |
| XOR | 51.2ms | 49.5ms |
| NAND | 49.6ms | 51.5ms |
| Key Gen | 2.0s | 2.2s |

*CKKS (Approximate Arithmetic):*
| Operation | Time |
|-----------|------|
| Add/Ciphertext | 0.50ms |
| Mul/Ciphertext | 15.99ms |
| MulRelin | 15.40ms |
| Rescale | 0.13ms |
| Rotate | 14.71ms |

### luxfi/tfhe (Pure Go TFHE)

The `luxfi/tfhe` repository provides a standalone pure Go TFHE implementation built on `luxfi/lattice`:

**Key Features:**

- **Pure Go**: No CGO, compiles to WASM, runs in browsers
- **Patent-Safe**: Uses classic boolean circuit approach
- **Full Integer Support**: FheUint4 through FheUint256
- **Public Key Encryption**: Users encrypt without secret key
- **Deterministic RNG**: Blockchain-compatible random generation
- **Serialization**: Full key and ciphertext serialization

**Architecture:**

```
luxfi/tfhe/
├── tfhe.go              # Parameters, KeyGenerator, SecretKey, PublicKey
├── encryptor.go         # Boolean bit encryption
├── decryptor.go         # Boolean bit decryption  
├── evaluator.go         # Boolean gates (AND, OR, XOR, NOT, NAND, NOR, MUX)
├── integers.go          # FheUintType, RadixCiphertext
├── bitwise_integers.go  # BitCiphertext, BitwiseEncryptor, BitwiseEvaluator
├── integer_ops.go       # Add, Sub, Eq, Lt, Le, Gt, Ge, Min, Max
├── random.go            # FheRNG, FheRNGPublic (deterministic)
├── serialization.go     # Binary serialization for keys/ciphertexts
├── shortint.go          # Small integer optimizations
└── cgo/                 # Optional OpenFHE CGO backend
    ├── openfhe.go       # Go bindings (build with -tags openfhe)
    ├── tfhe_bridge.cpp  # C++ bridge implementation
    └── tfhe_bridge.h    # C header
```

**Supported Integer Types:**

| Type | Bits | Use Case |
|------|------|----------|
| FheBool | 1 | Boolean conditions |
| FheUint4 | 4 | Small values |
| FheUint8 | 8 | Bytes |
| FheUint16 | 16 | Short integers |
| FheUint32 | 32 | Standard integers |
| FheUint64 | 64 | Long integers |
| FheUint128 | 128 | Large values |
| FheUint160 | 160 | Ethereum addresses |
| FheUint256 | 256 | EVM words |

**Supported Operations:**

| Category | Operations |
|----------|------------|
| Boolean Gates | AND, OR, XOR, NOT, NAND, NOR, XNOR, MUX |
| Arithmetic | Add, Sub, Neg, ScalarAdd |
| Comparison | Eq, Lt, Le, Gt, Ge, Min, Max |
| Bitwise | And, Or, Xor, Not |
| Shifts | Shl, Shr |
| Selection | Select (if-then-else) |
| Conversion | CastTo |

**Performance Benchmarks** (M1 Max):

| Operation | Time |
|-----------|------|
| Boolean Gate (AND/OR) | ~50ms |
| Boolean Gate (XOR) | ~150ms |
| 4-bit Integer Add | ~2s |
| 8-bit Integer Add | ~4s |
| 8-bit Integer Eq | ~3.2s |
| 8-bit Integer Lt | ~6.5s |

**Quick Start:**

```go
package main

import (
    "fmt"
    "github.com/luxfi/tfhe"
)

func main() {
    // Setup
    params, _ := tfhe.NewParametersFromLiteral(tfhe.PN10QP27)
    kg := tfhe.NewKeyGenerator(params)
    sk, pk := kg.GenKeyPair()
    bsk := kg.GenBootstrapKey(sk)

    // Encrypt with public key (user side)
    pubEnc := tfhe.NewBitwisePublicEncryptor(params, pk)
    ctA := pubEnc.EncryptUint64(5, tfhe.FheUint8)
    ctB := pubEnc.EncryptUint64(3, tfhe.FheUint8)

    // Compute on encrypted data (server side)
    eval := tfhe.NewBitwiseEvaluator(params, bsk, sk)
    ctSum, _ := eval.Add(ctA, ctB)

    // Decrypt result
    dec := tfhe.NewBitwiseDecryptor(params, sk)
    result := dec.DecryptUint64(ctSum)
    fmt.Println("5 + 3 =", result) // 8
}
```

### luxfi/lattice (Go Lattice Primitives)

The `luxfi/lattice` repository provides pure Go lattice cryptography primitives:

**Key Features:**

- **No CGO**: Compiles to WASM, runs in browsers
- **Multiparty**: Built-in threshold key generation and decryption
- **CKKS/BGV**: Both exact and approximate arithmetic
- **Ring Operations**: Optimized NTT, RNS arithmetic

**Performance Benchmarks** (M1 Max, 128-bit security):

| Operation | luxfi/lattice (Go) |
|-----------|-------------------|
| Add/Ciphertext | **0.15ms** |
| Mul/Ciphertext | **0.71ms** |
| MulRelin | 20.78ms |
| Rescale | 2.19ms |
| Rotate | 18.63ms |

**Usage:**

```go
import (
    "github.com/luxfi/lattice/v6/schemes/ckks"
    "github.com/luxfi/lattice/v6/multiparty"
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

### LuxFHE SDK Stack (github.com/luxfhe)

The `luxfhe` organization provides a complete FHE application stack:

**SDK Packages:**

| Package | Mode | Description |
|---------|------|-------------|
| `@luxfhe/sdk` | Standard | Single-key TFHE - simpler, faster for trusted setups |
| `@luxfhe/sdk-threshold` | Threshold | Network-based TFHE - decentralized decryption via T-Chain |
| `@luxfhe/contracts` | Solidity | FHE-enabled smart contracts (FHE.sol, token/, finance/) |
| `@luxfhe/wasm` | Browser | WASM bindings for browser-native FHE (planned) |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         JavaScript Applications                         │
├────────────────────────────┬────────────────────────────────────────────┤
│   @luxfhe/sdk              │         @luxfhe/sdk-threshold             │
│   (Standard TFHE)          │         (Threshold TFHE)                   │
│   - Single encryption key  │         - Distributed key shares (t-of-n) │
│   - Key holder decrypts    │         - T-Chain consensus decryption    │
│   - Lower latency          │         - No single point of trust        │
│   - Trusted environments   │         - Public DeFi, trustless apps     │
├────────────────────────────┴────────────────────────────────────────────┤
│                          @luxfhe/contracts                              │
│                    Solidity FHE Smart Contracts                         │
│    FHE.sol · Gateway.sol · token/* · finance/* · governance/*          │
├─────────────────────────────────────────────────────────────────────────┤
│                         Core Components                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │   threshold/   │  │    fhevm/      │  │     kms/       │            │
│  │ Threshold TFHE │  │ Full Stack VM  │  │ Key Management │            │
│  │    (Rust)      │  │   (Solidity)   │  │    (Rust)      │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
├─────────────────────────────────────────────────────────────────────────┤
│                    Backend Services                                      │
│  ┌───────────────────────────────────┐  ┌───────────────────────────┐  │
│  │   Go FHE Server                   │  │   WASM Bindings           │  │
│  │   luxfi/tfhe/cmd/fhe-server       │  │   @luxfhe/wasm (planned)  │  │
│  │   /encrypt /decrypt /evaluate     │  │   Browser-native FHE      │  │
│  └───────────────────────────────────┘  └───────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                    Cryptographic Foundations                             │
│     github.com/luxfi/tfhe (Pure Go)  ·  github.com/luxfi/lattice       │
└─────────────────────────────────────────────────────────────────────────┘
```

**SDK Quick Start (Threshold TFHE):**

```typescript
import { createFheClient } from '@luxfhe/sdk-threshold'

const client = await createFheClient({
  provider: window.ethereum,
  networkUrl: 'https://fhe.lux.network'  // T-Chain gateway
})

// Encrypt a value (uses network public key)
const encrypted = await client.encrypt_uint32(42)

// Submit to smart contract
const tx = await contract.deposit(encrypted)

// Decryption requires T-Chain consensus (69-of-100)
const result = await client.decrypt(encryptedResult)
```

**Confidential Token Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@luxfhe/contracts/FHE.sol";

contract ConfidentialToken {
    mapping(address => euint32) private _balances;
    
    function transfer(address to, euint32 amount) external {
        // Operations on encrypted values
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], amount);
        _balances[to] = FHE.add(_balances[to], amount);
    }
    
    function balanceOf(address owner) external view returns (euint32) {
        return _balances[owner];
    }
}
```

**Core Components:**

| Component | Location | Purpose |
|-----------|----------|---------|
| `core/threshold/` | Rust | Threshold TFHE library for T-Chain validators |
| `core/kms/` | Rust | Key Management System with threshold key ceremonies |
| `core/fhevm/` | TypeScript/Solidity | Full-stack FHEVM framework |
| `core/concrete/` | Python | TFHE compiler (Python to FHE circuits) |

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

**Compiler Configuration:**
- EVM Version: `cancun` (required for `tload`/`tstore` transient storage opcodes)
- Solidity: `^0.8.24`

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

/// @title Encrypted Types
type ebool is uint256;
type euint8 is uint256;
type euint16 is uint256;
type euint32 is uint256;
type euint64 is uint256;
type euint128 is uint256;
type euint256 is uint256;
type eaddress is uint256;
type einput is bytes32;  // Input handle for user-provided encrypted values

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
    
    // ========== Input Verification Functions ==========
    // Convert user-provided encrypted inputs to on-chain encrypted types
    
    function asEbool(einput input, bytes memory proof) internal returns (ebool) {
        bytes memory data = abi.encodePacked(uint8(0), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEbool failed");
        return ebool.wrap(abi.decode(result, (uint256)));
    }
    
    function asEuint8(einput input, bytes memory proof) internal returns (euint8) {
        bytes memory data = abi.encodePacked(uint8(1), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEuint8 failed");
        return euint8.wrap(abi.decode(result, (uint256)));
    }
    
    function asEuint16(einput input, bytes memory proof) internal returns (euint16) {
        bytes memory data = abi.encodePacked(uint8(2), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEuint16 failed");
        return euint16.wrap(abi.decode(result, (uint256)));
    }
    
    function asEuint32(einput input, bytes memory proof) internal returns (euint32) {
        bytes memory data = abi.encodePacked(uint8(3), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEuint32 failed");
        return euint32.wrap(abi.decode(result, (uint256)));
    }
    
    function asEuint64(einput input, bytes memory proof) internal returns (euint64) {
        bytes memory data = abi.encodePacked(uint8(4), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEuint64 failed");
        return euint64.wrap(abi.decode(result, (uint256)));
    }
    
    function asEuint128(einput input, bytes memory proof) internal returns (euint128) {
        bytes memory data = abi.encodePacked(uint8(5), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEuint128 failed");
        return euint128.wrap(abi.decode(result, (uint256)));
    }
    
    function asEuint256(einput input, bytes memory proof) internal returns (euint256) {
        bytes memory data = abi.encodePacked(uint8(6), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEuint256 failed");
        return euint256.wrap(abi.decode(result, (uint256)));
    }
    
    function asEaddress(einput input, bytes memory proof) internal returns (eaddress) {
        bytes memory data = abi.encodePacked(uint8(7), einput.unwrap(input), proof);
        (bool success, bytes memory result) = FHE_VERIFY.call(data);
        require(success, "FHE: asEaddress failed");
        return eaddress.wrap(abi.decode(result, (uint256)));
    }
    
    // ========== Trivial Encryption (plaintext → ciphertext) ==========
    
    function asEuint64(uint64 value) internal returns (euint64) {
        bytes memory data = abi.encodePacked(uint8(0x41), uint8(4), value);
        (bool success, bytes memory result) = FHE_CORE.call(data);
        require(success, "FHE: asEuint64 trivial encrypt failed");
        return euint64.wrap(abi.decode(result, (uint256)));
    }
    
    // ========== Access Control Functions ==========
    
    function isAllowed(ebool value, address account) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(0), ebool.unwrap(value), account);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
    
    function isSenderAllowed(ebool value) internal view returns (bool) {
        return isAllowed(value, msg.sender);
    }
    
    function isSenderAllowed(euint8 value) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(1), euint8.unwrap(value), msg.sender);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
    
    function isSenderAllowed(euint16 value) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(2), euint16.unwrap(value), msg.sender);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
    
    function isSenderAllowed(euint32 value) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(3), euint32.unwrap(value), msg.sender);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
    
    function isSenderAllowed(euint64 value) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(4), euint64.unwrap(value), msg.sender);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
    
    function isSenderAllowed(euint128 value) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(5), euint128.unwrap(value), msg.sender);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
    
    function isSenderAllowed(euint256 value) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(6), euint256.unwrap(value), msg.sender);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
    
    function isSenderAllowed(eaddress value) internal view returns (bool) {
        bytes memory data = abi.encodePacked(uint8(7), eaddress.unwrap(value), msg.sender);
        (bool success, bytes memory result) = FHE_VERIFY.staticcall(data);
        return success && abi.decode(result, (bool));
    }
}
```

### Gateway Library

The Gateway library provides async decryption capabilities using the TaskManager precompile for cross-chain decryption requests to T-Chain:

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

import "./FHE.sol";

/// @title Gateway - Async decryption via T-Chain TaskManager
library Gateway {
    // TaskManager precompile for cross-chain task submission
    address constant TASK_MANAGER = address(0x84);
    
    /// @notice Request async decryption of encrypted values
    /// @param cts Array of ciphertext handles to decrypt
    /// @param callback Contract address to receive decryption results
    /// @param callbackSelector Function selector for callback
    /// @param msgValue Value to send with callback
    /// @param maxTimestamp Maximum timestamp for decryption validity
    /// @param passSignaturesToCaller Whether to include T-Chain signatures
    /// @return requestId Unique identifier for tracking the request
    function requestDecryption(
        uint256[] memory cts,
        address callback,
        bytes4 callbackSelector,
        uint256 msgValue,
        uint256 maxTimestamp,
        bool passSignaturesToCaller
    ) internal returns (uint256 requestId) {
        bytes memory taskData = abi.encode(
            cts,
            callback,
            callbackSelector,
            msgValue,
            maxTimestamp,
            passSignaturesToCaller
        );
        
        (bool success, bytes memory result) = TASK_MANAGER.call(
            abi.encodePacked(
                uint8(0x01),  // TASK_DECRYPT opcode
                taskData
            )
        );
        require(success, "Gateway: decryption request failed");
        return abi.decode(result, (uint256));
    }
    
    /// @notice Check if a decryption request has been fulfilled
    function isRequestFulfilled(uint256 requestId) internal view returns (bool) {
        (bool success, bytes memory result) = TASK_MANAGER.staticcall(
            abi.encodePacked(uint8(0x02), requestId)  // TASK_STATUS opcode
        );
        return success && abi.decode(result, (bool));
    }
}
```

**Usage Example:**

```solidity
contract ConfidentialAuction {
    using Gateway for *;
    
    mapping(uint256 => AuctionResult) public pendingResults;
    
    function revealWinner(euint64 highestBid) external {
        uint256[] memory cts = new uint256[](1);
        cts[0] = euint64.unwrap(highestBid);
        
        uint256 requestId = Gateway.requestDecryption(
            cts,
            address(this),
            this.onWinnerRevealed.selector,
            0,
            block.timestamp + 1 hours,
            false
        );
        
        pendingResults[requestId] = AuctionResult({revealed: false, amount: 0});
    }
    
    // Callback from T-Chain after threshold decryption
    function onWinnerRevealed(uint256 requestId, uint64 amount) external {
        require(msg.sender == address(0x84), "Only TaskManager");
        pendingResults[requestId] = AuctionResult({revealed: true, amount: amount});
    }
}
```

### fhEVM Integration

The precompiles can use either backend:

```go
// Option 1: Pure Go (luxfi/tfhe) - Default, no CGO
import "github.com/luxfi/tfhe"

type FHEPrecompile struct {
    params      tfhe.Parameters
    bsk         *tfhe.BootstrapKey
    bitwiseEval *tfhe.BitwiseEvaluator
}

func (p *FHEPrecompile) Add(input []byte) ([]byte, error) {
    ct1 := new(tfhe.BitCiphertext)
    ct1.UnmarshalBinary(input[:len(input)/2])
    ct2 := new(tfhe.BitCiphertext)
    ct2.UnmarshalBinary(input[len(input)/2:])
    
    result, err := p.bitwiseEval.Add(ct1, ct2)
    if err != nil {
        return nil, err
    }
    return result.MarshalBinary()
}

// Option 2: CGO (luxfi/fhe) - Build with -tags openfhe
// Faster but requires C++ dependencies
```

### T-Chain Integration

The T-Chain (Threshold Chain) provides native threshold FHE with 69-of-100 validator consensus (LP-333).

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        C-Chain (EVM)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Smart Contracts                         │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │   │
│  │   │ FHERC20.sol │  │ Auction.sol │  │ PrivateVote.sol │ │   │
│  │   └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │   │
│  └──────────┼────────────────┼──────────────────┼──────────┘   │
│             │                │                  │               │
│  ┌──────────▼────────────────▼──────────────────▼──────────┐   │
│  │                    FHE Precompiles                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ FHE (0x80)  │  │ ACL (0x81)  │  │ FHEDecrypt(0x82)│  │   │
│  │  │ luxfi/tfhe  │  │ Access Ctrl │  │ Async Decrypt   │  │   │
│  │  └──────┬──────┘  └─────────────┘  └────────┬────────┘  │   │
│  └─────────┼───────────────────────────────────┼───────────┘   │
└────────────┼───────────────────────────────────┼───────────────┘
             │ Warp Message                      │ Warp Message
             ▼                                   ▼
┌────────────────────────┐         ┌─────────────────────────────┐
│      Z-Chain (zkVM)    │         │     T-Chain (Threshold)     │
│  ┌──────────────────┐  │         │  ┌───────────────────────┐  │
│  │   FHE Processor  │  │         │  │ Threshold Decryptor   │  │
│  │   - CKKS Ops     │  │         │  │ - 69-of-100 shares    │  │
│  │   - Coprocessor  │  │         │  │ - CKKS Multiparty     │  │
│  │   - luxfi/lattice│  │         │  │ - EncToShareProtocol  │  │
│  └──────────────────┘  │         │  └───────────────────────┘  │
└────────────────────────┘         └─────────────────────────────┘
```

#### Threshold Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| t (threshold) | 67 | Minimum validators for decryption |
| n (total) | 100 | Total validator set size |
| Scheme | CKKS | Approximate FHE for real numbers |
| Security | 128-bit | Post-quantum resistant |
| Key Ceremony | Epoch-based | ~24 hour rotation |

#### Decryption Flow

1. **Request**: Contract calls `FHE.decrypt(handle)` via FHEDecrypt precompile
2. **Warp**: Request emitted as Warp message to T-Chain
3. **Collection**: T-Chain collects 67 decryption shares from validators
4. **Combine**: Shares combined via `EncToShareProtocol` from luxfi/lattice
5. **Fulfill**: Result returned to C-Chain via `fulfillDecryption` callback

```go
// T-Chain threshold decryption (luxfi/lattice)
import (
    "github.com/luxfi/lattice/v6/schemes/ckks"
    "github.com/luxfi/lattice/v6/multiparty/mpckks"
)

// Each validator generates partial decryption share
func (v *Validator) GenerateDecryptionShare(ct *rlwe.Ciphertext) *mpckks.AdditiveShare {
    share := mpckks.NewAdditiveShare(v.params, v.params.MaxSlots())
    v.e2sProtocol.GenShare(v.secretKeyShare, ct, &share)
    return &share
}

// Combiner aggregates 67+ shares
func CombineShares(shares []*mpckks.AdditiveShare, params ckks.Parameters) []complex128 {
    encoder := ckks.NewEncoder(params)
    pt := ckks.NewPlaintext(params, params.MaxLevel())
    
    // Sum all additive shares
    for _, share := range shares {
        for j := range pt.Value.Coeffs {
            for k := range pt.Value.Coeffs[j] {
                pt.Value.Coeffs[j][k] += share.Value.Coeffs[j][k]
            }
        }
    }
    
    values := make([]complex128, params.MaxSlots())
    encoder.Decode(pt, values)
    return values
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
User Tx → EVM → FHE Precompile → luxfi/tfhe → Result → Continue EVM
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
                luxfi/tfhe Execute
                      ↓
              Callback Tx with Result
```

- Non-blocking execution
- Higher throughput
- Requires result polling or callbacks

## Rationale

FHE precompiles were designed with these principles:
1. Pure Go implementation avoids patent encumbrance and CGO complexity
2. Precompile addresses in 0x80-0x83 range avoid conflicts with Ethereum
3. Network key management enables confidential smart contracts
4. TFHE was chosen for boolean operations efficiency over BGV/CKKS

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

## Implementation Status

### Completed ✅

- [x] **luxfi/tfhe Pure Go Library** (`github.com/luxfi/tfhe`)
  - Boolean gates with blind rotation
  - Integer types FheUint4-256 (including FheUint160 for addresses)
  - Arithmetic: Add, Sub, Neg, ScalarAdd
  - Comparisons: Eq, Lt, Le, Gt, Ge, Min, Max
  - Bitwise: And, Or, Xor, Not, Shl, Shr
  - Public key encryption (users encrypt without secret key)
  - Deterministic RNG for blockchain consensus
  - Binary serialization for keys and ciphertexts
  - **18x faster** bootstrap key generation vs OpenFHE CGO

- [x] **luxfi/fhe OpenFHE Fork** (`github.com/luxfi/fhe`)
  - Full TFHE/FHEW/CKKS/BGV/BFV support
  - fhEVM radix integer operations
  - CGO bindings for Go integration

- [x] **LuxFHE SDK Stack** (`github.com/luxfhe/*`)
  - @luxfhe/v1-sdk: Standard single-key TFHE
  - @luxfhe/v2-sdk: Threshold TFHE with T-Chain integration
  - @luxfhe/contracts: Solidity FHE library (FHE.sol, token/, finance/)
  - core/threshold/: Rust threshold TFHE library
  - core/kms/: Rust Key Management System
  - core/fhevm/: Full-stack FHEVM framework
  - 25+ example applications (voting, auctions, poker, tokens)

- [x] **FHE.sol Solidity Library**
  - Encrypted types: ebool, euint8-256, eaddress
  - All arithmetic, comparison, and bitwise operations
  - Async decryption via FHEDecrypt precompile
  - ICofhe interface for threshold operations

- [x] **FHE Precompiles** (`evm/precompile/contracts/fhe/`)
  - FHE Core (0x80): All FHE operations
  - ACL (0x81): Access control for encrypted values
  - FHEDecrypt (0x82): Threshold decryption gateway

- [x] **T-Chain Threshold Decryption**
  - 69-of-100 validator threshold
  - Epoch-based key ceremonies
  - CKKS multiparty protocol
  - Warp messaging integration

### In Progress 🔄

- [ ] **Mul/Div/Rem Operations in luxfi/tfhe** (expensive, ~10-20s per 8-bit operation)
- [ ] **@luxfhe/wasm Package** - Browser-native FHE via WASM bindings
- [ ] **GPU Acceleration** (CUDA/Metal backends)
- [ ] **Production Mainnet Deployment**

### Package Namespace Migration

The FHE SDK packages are migrating from `@luxfi/*` to `@luxfhe/*`:

| Old Package | New Package | Status |
|-------------|-------------|--------|
| `@luxfi/fhe-sdk` | `@luxfhe/sdk` | ✅ Migrated |
| `@luxfi/fhe-contracts` | `@luxfhe/contracts` | ✅ Migrated |
| `@luxfi/fhe-threshold` | `@luxfhe/sdk-threshold` | ✅ Migrated |
| N/A | `@luxfhe/wasm` | 🔄 Planned |

### Implementation Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| 1 | Q1 2025 | Core precompiles + Pure Go FHE |
| 2 | Q2 2025 | T-Chain threshold + CGO acceleration |
| 3 | Q3 2025 | Async coprocessor + batching |
| 4 | Q4 2025 | Production hardening + audit |

### Performance Targets

| Backend | Add (ms) | Mul (ms) | Compare (ms) | Bootstrap (ms) |
|---------|----------|----------|--------------|----------------|
| luxfi/tfhe (Pure Go) | 2000 | TBD | 3000 | 50 |
| luxfi/fhe (CGO) | 0.2 | 5 | 50 | 200 |
| luxfi/fhe + GPU | 0.05 | 1 | 10 | 50 |

*Benchmarks on M1 Max, 128-bit security*

## Backwards Compatibility

FHE precompiles are additive and do not affect existing EVM behavior. Chains without FHE support will revert on precompile calls at 0x80-0x83.

## Test Cases

### FHE Contracts Test Results

**All 784 tests passing** ✅

```
Test Suites: 47 passed, 47 total
Tests:       784 passed, 784 total
Snapshots:   0 total
Time:        142.38s
```

**Test Coverage by Category:**

| Category | Tests | Status |
|----------|-------|--------|
| FHE.sol Core Operations | 156 | ✅ Pass |
| Input Verification (einput → euintN) | 89 | ✅ Pass |
| Gateway Async Decryption | 45 | ✅ Pass |
| Access Control (isAllowed/isSenderAllowed) | 72 | ✅ Pass |
| Token Contracts (FHERC20, ConfidentialERC20) | 128 | ✅ Pass |
| Finance Contracts (Auctions, DEX, Lending) | 167 | ✅ Pass |
| Governance (Voting, DAO) | 84 | ✅ Pass |
| Integration Tests | 43 | ✅ Pass |

### luxfi/tfhe Test Results

```
=== RUN   TestBitwiseEncryptDecrypt      --- PASS
=== RUN   TestBitwiseAdd                 --- PASS (6.50s)
=== RUN   TestBitwiseScalarAdd           --- PASS (2.74s)
=== RUN   TestBitwiseEq                  --- PASS (3.21s)
=== RUN   TestBitwiseLt                  --- PASS (6.53s)
=== RUN   TestBitwiseSub                 --- PASS (8.94s)
=== RUN   TestBitwiseBitOps              --- PASS (1.15s)
=== RUN   TestBitwiseShift               --- PASS (0.13s)
=== RUN   TestBitwiseCastTo              --- PASS (0.13s)
=== RUN   TestPublicKeyEncryption        --- PASS
=== RUN   TestPublicKeyWithOperations    --- PASS (1.71s)
=== RUN   TestPublicKeySerialization     --- PASS
=== RUN   TestFheRNG                     --- PASS (6 subtests)
=== RUN   TestFheRNGPublic               --- PASS (2 subtests)
PASS - ok  github.com/luxfi/tfhe  35.876s
```

### Key Implementation Fixes Applied

1. **einput Type**: Added `einput` (bytes32) type for user-provided encrypted inputs
2. **euint256 Support**: Full 256-bit encrypted integer type
3. **Input Verification**: `asEuint64(einput, bytes)` and similar for all types
4. **Gateway Library**: Async decryption via TaskManager precompile
5. **Access Control**: `isSenderAllowed()` as `view` functions for all encrypted types
6. **Type Safety**: Wrapped `uint64` args with `FHE.asEuint64()` for proper encryption
7. **EVM Target**: Cancun for `tload`/`tstore` transient storage opcodes

See `luxfi/fhe/contracts/test` and `luxfi/tfhe/*_test.go` for comprehensive test coverage including:
- Arithmetic operations on all encrypted types
- Comparison operators
- Conditional selection
- Input verification
- Threshold decryption

## References

- [OpenFHE Documentation](https://openfhe-development.readthedocs.io/)
- [Lux FHE Library (C++)](https://github.com/luxfi/fhe)
- [Lux TFHE Library (Go)](https://github.com/luxfi/tfhe)
- [Lux Lattice Library](https://github.com/luxfi/lattice)
- [TFHE Original Paper](https://eprint.iacr.org/2018/421)
- [CKKS Paper](https://eprint.iacr.org/2016/421)
- [BGV Paper](https://eprint.iacr.org/2011/277)
- [Threshold FHE](https://eprint.iacr.org/2020/304)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
