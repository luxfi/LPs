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
| `luxfi/tfhe` | Go | BSD-3-Clause | TFHE (Boolean) | Pure Go fhEVM, no CGO |
| `luxfi/lattice` | Go | Apache-2.0 | CKKS, BGV | Primitives, multiparty |

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
// SPDX-License-Identifier: BSD-3-Clause
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

The T-Chain (Threshold Chain) provides native threshold FHE with 67-of-100 validator consensus (LP-333).

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
│  │   - CKKS Ops     │  │         │  │ - 67-of-100 shares    │  │
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

- [x] **luxfi/tfhe Pure Go Library**
  - Boolean gates with blind rotation
  - Integer types FheUint4-256
  - Arithmetic: Add, Sub, Neg, ScalarAdd
  - Comparisons: Eq, Lt, Le, Gt, Ge, Min, Max
  - Bitwise: And, Or, Xor, Not, Shl, Shr
  - Public key encryption
  - Deterministic RNG
  - Binary serialization
  - OpenFHE CGO backend (optional)

- [x] **luxfi/fhe OpenFHE Fork**
  - Full TFHE/FHEW/CKKS/BGV/BFV support
  - fhEVM radix integer operations
  - CGO bindings for Go

- [x] **FHE.sol Solidity Library**
  - Encrypted types: ebool, euint8-256, eaddress
  - All arithmetic, comparison, and bitwise operations
  - Async decryption via FHEDecrypt precompile

- [x] **FHE Precompiles** (`evm/precompile/contracts/fhe/`)
  - FHE Core (0x80): All FHE operations
  - ACL (0x81): Access control for encrypted values
  - FHEDecrypt (0x82): Threshold decryption gateway

### In Progress 🔄

- [ ] **Mul/Div Operations in luxfi/tfhe** (expensive)
- [ ] **Production Key Ceremony**
- [ ] **GPU Acceleration**

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
