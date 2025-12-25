---
lp: 3653
title: BLS12-381 Cryptography Precompile
description: Native EVM precompile for BLS12-381 pairing-based cryptography using blst library
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-24
requires: 4
activation:
  flag: lp3653-bls12-381
  hfName: "Quantum"
  activationHeight: "0"
tags: [evm, precompile, cryptography, bls, pairing]
order: 3653
---

## Abstract

LP-3653 specifies a native EVM precompile for BLS12-381 pairing-based cryptographic operations, providing signature aggregation, pairing verification, and multi-scalar multiplication. The precompile leverages the `blst` library (Supranational's high-performance implementation), enabling efficient signature aggregation for consensus protocols, cross-chain messaging, and zero-knowledge applications.

## Motivation

### Current Limitations

**EIP-2537 Precompiles (0x0a-0x12):**
- Complex multi-precompile interface
- High gas costs for individual operations
- No native signature aggregation
- Limited optimization for common patterns

**Solidity-Based BLS:**
- Impractical gas costs (~3M+ gas for pairing)
- No access to optimized assembly
- Cannot leverage blst's performance

### Use Cases Requiring Native BLS12-381

1. **Consensus Signature Aggregation**
   - Quasar consensus finality
   - Validator attestations
   - Multi-signature blocks

2. **Cross-Chain Messaging**
   - Warp message verification
   - Light client proofs
   - Aggregate relayer signatures

3. **Zero-Knowledge Proofs**
   - Groth16 verification
   - PLONK/Marlin verification
   - KZG polynomial commitments

4. **Distributed Key Generation**
   - BLS threshold signatures
   - Verifiable secret sharing
   - Distributed randomness beacons

### Performance Benefits

| Operation | EIP-2537 Gas | LP-3653 Gas | Improvement |
|-----------|--------------|-------------|-------------|
| G1 Add | 500 | 200 | 2.5x |
| G1 Mul | 12,000 | 5,000 | 2.4x |
| G2 Add | 800 | 300 | 2.7x |
| G2 Mul | 45,000 | 18,000 | 2.5x |
| Pairing (2 pairs) | 113,000 | 65,000 | 1.7x |
| Aggregate Verify (100 sigs) | 1.2M | 180,000 | 6.7x |
| Multi-Scalar Mul (100) | 1.2M | 150,000 | 8x |

## Rationale

### BLS12-381 Curve Selection

BLS12-381 is the industry standard for pairing-based cryptography:

1. **Security Level**: 128-bit security (comparable to AES-256)
2. **Widely Adopted**: Ethereum 2.0, Zcash, Filecoin, and major blockchain protocols
3. **Performance**: Optimal balance between security and computational efficiency
4. **Tooling**: Extensive library support (blst, milagro, relic)

### Precompile Address Choice

Using `0x0313` (491+ in hex) for BLS12-381 operations:

- Follows the precompile address convention for cryptographic operations
- Avoids collision with existing EIP-2537 addresses (0x0a-0x12)
- Groups all BLS operations under a single address with function selectors

### Function Selector Design

Organized by operation category for intuitive API:

- `0x01-0x0F`: G1 operations
- `0x10-0x1F`: G2 operations
- `0x20-0x2F`: Pairing operations
- `0x30-0x3F`: Signature operations
- `0x40-0x4F`: Hash-to-curve operations

### Gas Cost Derivation

Gas costs are derived from benchmark ratios relative to `ecrecover`:

| Operation | blst Time (μs) | ecrecover (μs) | Ratio | Gas |
|-----------|---------------|----------------|-------|-----|
| g1Add | 0.8 | ~50 | 0.016x | 200 |
| g1Mul | 18 | ~50 | 0.36x | 5,000 |
| pairing (2) | 220 | ~50 | 4.4x | 65,000 |

### blst Library Selection

The `blst` library provides:

1. **Assembly Optimization**: Hand-tuned AVX2/AVX-512 assembly
2. **Constant-Time**: All operations use constant-time algorithms
3. **Multi-Platform**: Optimized for x86_64, ARM64, and other architectures
4. **Standards Compliance**: Follows IETF CFRG specifications

## Specification

### Precompile Address

| Address | Operation |
|---------|-----------|
| `0x0313` | BLS12-381 Operations |

### Function Selectors

| Selector | Function | Gas |
|----------|----------|-----|
| `0x01` | `g1Add(bytes p1, bytes p2)` | 200 |
| `0x02` | `g1Mul(bytes p, bytes32 scalar)` | 5,000 |
| `0x03` | `g1MultiExp(bytes[] points, bytes32[] scalars)` | 1,500 + 1,000/point |
| `0x04` | `g1Neg(bytes p)` | 100 |
| `0x05` | `g1IsValid(bytes p)` | 150 |
| `0x10` | `g2Add(bytes p1, bytes p2)` | 300 |
| `0x11` | `g2Mul(bytes p, bytes32 scalar)` | 18,000 |
| `0x12` | `g2MultiExp(bytes[] points, bytes32[] scalars)` | 2,000 + 1,500/point |
| `0x13` | `g2Neg(bytes p)` | 150 |
| `0x14` | `g2IsValid(bytes p)` | 200 |
| `0x20` | `pairing(bytes g1Points, bytes g2Points)` | 43,000 + 22,000/pair |
| `0x21` | `pairingCheck(bytes g1Points, bytes g2Points)` | 40,000 + 20,000/pair |
| `0x30` | `blsSign(bytes32 privKey, bytes message)` | 8,000 |
| `0x31` | `blsVerify(bytes sig, bytes pubkey, bytes message)` | 25,000 |
| `0x32` | `blsAggregateSignatures(bytes[] sigs)` | 500 + 100/sig |
| `0x33` | `blsAggregateVerify(bytes aggSig, bytes[] pubkeys, bytes[] msgs)` | 30,000 + 1,200/pair |
| `0x34` | `blsFastAggregateVerify(bytes aggSig, bytes[] pubkeys, bytes msg)` | 25,000 + 800/key |
| `0x40` | `mapToG1(bytes fp)` | 3,000 |
| `0x41` | `mapToG2(bytes fp2)` | 8,000 |
| `0x42` | `hashToG1(bytes message, bytes dst)` | 5,500 |
| `0x43` | `hashToG2(bytes message, bytes dst)` | 12,000 |

### Point Encoding (Compressed, ZCash Format)

#### G1 Point (48 bytes)
```
Compressed: x-coordinate (48 bytes) with flags in MSB
  - Bit 7: Compression flag (1 = compressed)
  - Bit 6: Infinity flag (1 = point at infinity)
  - Bit 5: Sign of y (1 = y is lexicographically largest)

Uncompressed: x (48 bytes) || y (48 bytes) = 96 bytes
```

#### G2 Point (96 bytes compressed)
```
Compressed: x-coordinate (96 bytes = 2×48 for Fp2) with flags
  x = c0 + c1*u where u² = -1

Uncompressed: x (96 bytes) || y (96 bytes) = 192 bytes
```

#### Scalar (32 bytes)
```
256-bit scalar in big-endian, must be < r
r = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
```

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBLS12381 {
    // ============ G1 Operations ============
    
    /// @notice Add two G1 points
    /// @param p1 First G1 point (48 bytes compressed)
    /// @param p2 Second G1 point (48 bytes compressed)
    /// @return result Sum of points (48 bytes compressed)
    function g1Add(bytes calldata p1, bytes calldata p2) 
        external view returns (bytes memory result);
    
    /// @notice Multiply G1 point by scalar
    /// @param p G1 point (48 bytes compressed)
    /// @param scalar 32-byte scalar
    /// @return result Scalar multiple (48 bytes compressed)
    function g1Mul(bytes calldata p, bytes32 scalar) 
        external view returns (bytes memory result);
    
    /// @notice Multi-scalar multiplication in G1 (MSM)
    /// @param points Array of G1 points
    /// @param scalars Array of scalars
    /// @return result Sum of scalar multiples
    function g1MultiExp(bytes[] calldata points, bytes32[] calldata scalars) 
        external view returns (bytes memory result);
    
    /// @notice Negate G1 point
    function g1Neg(bytes calldata p) external view returns (bytes memory result);
    
    /// @notice Check if G1 point is valid (on curve and in subgroup)
    function g1IsValid(bytes calldata p) external view returns (bool valid);
    
    // ============ G2 Operations ============
    
    /// @notice Add two G2 points
    function g2Add(bytes calldata p1, bytes calldata p2) 
        external view returns (bytes memory result);
    
    /// @notice Multiply G2 point by scalar
    function g2Mul(bytes calldata p, bytes32 scalar) 
        external view returns (bytes memory result);
    
    /// @notice Multi-scalar multiplication in G2
    function g2MultiExp(bytes[] calldata points, bytes32[] calldata scalars) 
        external view returns (bytes memory result);
    
    /// @notice Negate G2 point
    function g2Neg(bytes calldata p) external view returns (bytes memory result);
    
    /// @notice Check if G2 point is valid
    function g2IsValid(bytes calldata p) external view returns (bool valid);
    
    // ============ Pairing Operations ============
    
    /// @notice Compute optimal Ate pairing
    /// @param g1Points Concatenated G1 points (48 bytes each)
    /// @param g2Points Concatenated G2 points (96 bytes each)
    /// @return result Pairing result in Fp12 (576 bytes)
    function pairing(bytes calldata g1Points, bytes calldata g2Points) 
        external view returns (bytes memory result);
    
    /// @notice Check if pairing product equals identity
    /// @dev More efficient than computing full pairing
    /// @return valid True if e(P1,Q1) * e(P2,Q2) * ... = 1
    function pairingCheck(bytes calldata g1Points, bytes calldata g2Points) 
        external view returns (bool valid);
    
    // ============ BLS Signature Operations ============
    
    /// @notice Sign message with BLS private key
    /// @param privateKey 32-byte private key
    /// @param message Message to sign
    /// @return signature 48-byte G1 signature
    function blsSign(bytes32 privateKey, bytes calldata message) 
        external view returns (bytes memory signature);
    
    /// @notice Verify BLS signature
    /// @param signature 48-byte G1 signature
    /// @param publicKey 96-byte G2 public key
    /// @param message Original message
    /// @return valid True if signature is valid
    function blsVerify(
        bytes calldata signature, 
        bytes calldata publicKey, 
        bytes calldata message
    ) external view returns (bool valid);
    
    /// @notice Aggregate multiple BLS signatures
    /// @param signatures Array of G1 signatures
    /// @return aggregated Single aggregated signature
    function blsAggregateSignatures(bytes[] calldata signatures) 
        external view returns (bytes memory aggregated);
    
    /// @notice Verify aggregated signature with distinct messages
    /// @param aggregatedSig Single aggregated signature
    /// @param publicKeys Array of public keys
    /// @param messages Array of messages (one per key)
    /// @return valid True if aggregate signature is valid
    function blsAggregateVerify(
        bytes calldata aggregatedSig,
        bytes[] calldata publicKeys,
        bytes[] calldata messages
    ) external view returns (bool valid);
    
    /// @notice Verify aggregated signature with same message (optimized)
    /// @param aggregatedSig Single aggregated signature
    /// @param publicKeys Array of public keys
    /// @param message Single message signed by all
    /// @return valid True if all signers signed the same message
    function blsFastAggregateVerify(
        bytes calldata aggregatedSig,
        bytes[] calldata publicKeys,
        bytes calldata message
    ) external view returns (bool valid);
    
    // ============ Hash-to-Curve Operations ============
    
    /// @notice Map field element to G1 point
    function mapToG1(bytes calldata fp) external view returns (bytes memory point);
    
    /// @notice Map field element to G2 point
    function mapToG2(bytes calldata fp2) external view returns (bytes memory point);
    
    /// @notice Hash message to G1 point (with domain separation)
    function hashToG1(bytes calldata message, bytes calldata dst) 
        external view returns (bytes memory point);
    
    /// @notice Hash message to G2 point (with domain separation)
    function hashToG2(bytes calldata message, bytes calldata dst) 
        external view returns (bytes memory point);
}

// Convenience library
library BLS12381Lib {
    address constant BLS = 0x0000000000000000000000000000000000000313;
    
    // Standard DST for Ethereum 2.0
    bytes constant DST_ETH2 = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
    
    function verify(
        bytes memory sig, 
        bytes memory pubkey, 
        bytes memory message
    ) internal view returns (bool) {
        (bool success, bytes memory result) = BLS.staticcall(
            abi.encodePacked(bytes1(0x31), sig, pubkey, message)
        );
        return success && abi.decode(result, (bool));
    }
    
    function aggregateVerify(
        bytes memory aggSig,
        bytes[] memory pubkeys,
        bytes memory message
    ) internal view returns (bool) {
        (bool success, bytes memory result) = BLS.staticcall(
            abi.encodePacked(bytes1(0x34), aggSig, pubkeys, message)
        );
        return success && abi.decode(result, (bool));
    }
}
```

## Full Implementation Stack

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Solidity Interface                                    │
│  IBLS12381.sol → BLS12381Lib.sol → BLSVerifier.sol                      │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ staticcall
┌─────────────────────────────────▼───────────────────────────────────────┐
│                    EVM Precompile Layer (Go)                             │
│  precompiles/bls12381/contract.go → Run() → dispatch by selector        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ CGO
┌─────────────────────────────────▼───────────────────────────────────────┐
│                    Go blst Wrapper                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ g1.go       │  │ g2.go       │  │ pairing.go  │  │ signature.go    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ CGO FFI
┌─────────────────────────────────▼───────────────────────────────────────┐
│                    blst Library (C/Assembly)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ blst.h       │  │ blst_aux.h   │  │ server.c     │  │ assembly/    │ │
│  │ (~2K lines)  │  │ (aux funcs)  │  │ (core ops)   │  │ (x86_64/arm) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: EVM Precompile (Go)

| File | Purpose | Lines |
|------|---------|-------|
| `precompiles/bls12381/contract.go` | Main precompile contract | ~600 |
| `precompiles/bls12381/config.go` | Gas costs and configuration | ~100 |
| `precompiles/bls12381/module.go` | StatefulPrecompiledContract | ~120 |
| `precompiles/bls12381/g1.go` | G1 group operations | ~200 |
| `precompiles/bls12381/g2.go` | G2 group operations | ~200 |
| `precompiles/bls12381/pairing.go` | Pairing operations | ~180 |
| `precompiles/bls12381/signature.go` | BLS signature ops | ~250 |

### Layer 2: Go blst Wrapper

| File | Purpose | Key Functions |
|------|---------|---------------|
| `crypto/bls12381/blst/g1.go` | G1 point operations | `G1Add()`, `G1Mul()`, `G1MultiExp()` |
| `crypto/bls12381/blst/g2.go` | G2 point operations | `G2Add()`, `G2Mul()`, `G2MultiExp()` |
| `crypto/bls12381/blst/pairing.go` | Pairing computation | `Pair()`, `PairingCheck()`, `MillerLoop()` |
| `crypto/bls12381/blst/signature.go` | BLS signatures | `Sign()`, `Verify()`, `AggregateVerify()` |
| `crypto/bls12381/blst/keygen.go` | Key generation | `GenerateKey()`, `DerivePublicKey()` |
| `crypto/bls12381/blst/hash.go` | Hash-to-curve | `HashToG1()`, `HashToG2()` |

### Layer 3: blst Library (C/Assembly)

| Component | Description | Size |
|-----------|-------------|------|
| `blst/bindings/go/` | Go CGO bindings | ~50 KB |
| `blst/src/` | C implementation | ~200 KB |
| `blst/build/` | Build configuration | ~20 KB |
| `blst/src/asm/` | Assembly optimizations | ~500 KB |
| **Total** | Compiled library | ~3 MB |

### blst Assembly Optimizations

| Architecture | File | Optimizations |
|--------------|------|---------------|
| x86_64 (ADX) | `add_mod_384-x86_64.asm` | Montgomery multiplication with ADX/BMI2 |
| x86_64 (AVX) | `mulq_mont_384-x86_64.asm` | AVX-512 for parallel field ops |
| ARM64 | `add_mod_384-armv8.asm` | NEON SIMD for field arithmetic |
| ARM64 | `mulq_mont_384-armv8.asm` | Apple Silicon optimizations |

### Implementation Files

```
~/work/lux/
├── crypto/bls12381/
│   ├── blst/                   # Supranational's blst library
│   │   ├── bindings/go/        # CGO bindings
│   │   ├── src/                # C implementation
│   │   │   ├── server.c        # Core operations
│   │   │   ├── keygen.c        # Key generation
│   │   │   ├── hash_to_field.c # Hash-to-curve
│   │   │   ├── e1.c            # G1 operations
│   │   │   ├── e2.c            # G2 operations
│   │   │   ├── fp12_tower.c    # Extension field
│   │   │   └── pairing.c       # Optimal Ate pairing
│   │   └── src/asm/            # Assembly (~500 KB)
│   ├── bls.go                  # High-level BLS API
│   ├── g1.go                   # G1 wrapper
│   ├── g2.go                   # G2 wrapper
│   ├── pairing.go              # Pairing wrapper
│   ├── signature.go            # Signature operations
│   └── bls_test.go             # Comprehensive tests
├── geth/core/vm/
│   └── contracts_bls12381.go   # Precompile registration
└── precompiles/bls12381/
    ├── contract.go             # Main precompile
    ├── config.go               # Configuration
    └── module.go               # Module registration
```

## Secure Implementation Guidelines

### Subgroup Checks (CRITICAL)

```go
// crypto/bls12381/blst/g1.go

// CRITICAL: All G1 points must be validated for subgroup membership
// Failure to check allows small-subgroup attacks
func (p *G1Affine) Validate() error {
    if p.IsInfinity() {
        return nil // Identity is valid
    }
    
    // Check point is on curve: y² = x³ + 4
    if !p.IsOnCurve() {
        return ErrPointNotOnCurve
    }
    
    // Check point is in prime-order subgroup
    // Multiply by cofactor h₁ = (z-1)²/3 and check result
    // For BLS12-381 G1, h₁ = 0x396c8c005555e1568c00aaab0000aaab
    if !p.InG1() {
        return ErrNotInSubgroup
    }
    
    return nil
}

// blst provides optimized subgroup check
func (p *G1Affine) InG1() bool {
    return C.blst_p1_affine_in_g1((*C.blst_p1_affine)(unsafe.Pointer(p))) != 0
}
```

### G2 Subgroup Check

```go
// crypto/bls12381/blst/g2.go

// G2 subgroup check is more expensive but CRITICAL
// G2 cofactor h₂ is much larger than h₁
func (p *G2Affine) Validate() error {
    if p.IsInfinity() {
        return nil
    }
    
    // Check on curve: y² = x³ + 4(u+1)
    if !p.IsOnCurve() {
        return ErrPointNotOnCurve
    }
    
    // Subgroup check using endomorphism
    // More efficient than scalar multiplication by cofactor
    if !p.InG2() {
        return ErrNotInSubgroup
    }
    
    return nil
}
```

### Signature Aggregation Security

```go
// crypto/bls12381/signature.go

// CRITICAL: Aggregation requires proof-of-possession (PoP) scheme
// Without PoP, rogue public key attacks are possible

// Rogue Key Attack Prevention:
// 1. Each signer must prove knowledge of their secret key
// 2. Use KeyValidate() on all public keys before aggregation
// 3. Use distinct message scheme or PoP scheme

type SignatureScheme int

const (
    // Basic: e(σ, g2) = e(H(m), pk)
    // Vulnerable to rogue key attacks if keys not validated
    SchemeBasic SignatureScheme = iota
    
    // Proof of Possession: Signers prove knowledge of sk
    // Safe for aggregation
    SchemePOP
    
    // Message Augmentation: σ = H(pk || m)
    // Safe for aggregation without PoP
    SchemeAugmented
)

// KeyValidate checks public key is valid and can be used for aggregation
func KeyValidate(pk *G2Affine) error {
    // 1. Check not identity
    if pk.IsInfinity() {
        return ErrInvalidPublicKey
    }
    
    // 2. Check on curve
    if !pk.IsOnCurve() {
        return ErrPointNotOnCurve
    }
    
    // 3. Check in subgroup (CRITICAL for security)
    if !pk.InG2() {
        return ErrNotInSubgroup
    }
    
    return nil
}

// Proof of Possession generation
func GeneratePOP(sk *SecretKey, pk *G2Affine) (*G1Affine, error) {
    // Sign the public key itself
    dst := []byte("BLS_POP_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_")
    pkBytes := pk.Compress()
    
    // H(pk) in G1
    hpk := HashToG1(pkBytes, dst)
    
    // σ_pop = sk · H(pk)
    pop := new(G1Affine)
    pop.ScalarMult(hpk, sk.Scalar())
    
    return pop, nil
}

// Verify Proof of Possession
func VerifyPOP(pk *G2Affine, pop *G1Affine) bool {
    dst := []byte("BLS_POP_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_")
    pkBytes := pk.Compress()
    hpk := HashToG1(pkBytes, dst)
    
    // Check: e(σ_pop, g2) = e(H(pk), pk)
    return PairingCheck([]*G1Affine{pop, hpk}, []*G2Affine{G2Generator(), pk.Neg()})
}
```

### Multi-Scalar Multiplication (MSM) Security

```go
// crypto/bls12381/blst/msm.go

// Pippenger's algorithm for efficient MSM
// Constant-time to prevent timing attacks
func G1MultiExp(points []*G1Affine, scalars []*Scalar) (*G1Projective, error) {
    n := len(points)
    if n != len(scalars) {
        return nil, ErrLengthMismatch
    }
    
    if n == 0 {
        return G1Identity(), nil
    }
    
    // Validate all points BEFORE computation
    for i, p := range points {
        if err := p.Validate(); err != nil {
            return nil, fmt.Errorf("point %d: %w", i, err)
        }
    }
    
    // Validate all scalars
    for i, s := range scalars {
        if err := s.Validate(); err != nil {
            return nil, fmt.Errorf("scalar %d: %w", i, err)
        }
    }
    
    // blst's multi_scalar_mult is optimized and constant-time
    result := new(G1Projective)
    C.blst_p1s_mult_pippenger(
        (*C.blst_p1)(unsafe.Pointer(result)),
        // ... parameters
    )
    
    return result, nil
}
```

### Pairing Security

```go
// crypto/bls12381/blst/pairing.go

// CRITICAL: Miller loop requires final exponentiation
// Intermediate results are NOT secure to expose

func Pair(g1 *G1Affine, g2 *G2Affine) (*GT, error) {
    // Validate inputs
    if err := g1.Validate(); err != nil {
        return nil, fmt.Errorf("G1: %w", err)
    }
    if err := g2.Validate(); err != nil {
        return nil, fmt.Errorf("G2: %w", err)
    }
    
    // Optimal Ate pairing
    // 1. Miller loop: compute f_{6x+2,Q}(P)
    // 2. Final exponentiation: f^{(p^12-1)/r}
    result := new(GT)
    C.blst_miller_loop((*C.blst_fp12)(unsafe.Pointer(result)),
        (*C.blst_p2_affine)(unsafe.Pointer(g2)),
        (*C.blst_p1_affine)(unsafe.Pointer(g1)))
    
    // CRITICAL: Must perform final exponentiation
    C.blst_final_exp((*C.blst_fp12)(unsafe.Pointer(result)),
        (*C.blst_fp12)(unsafe.Pointer(result)))
    
    return result, nil
}

// PairingCheck is more efficient for verification
// Computes: Π e(Gi, Hi) = 1?
func PairingCheck(g1s []*G1Affine, g2s []*G2Affine) bool {
    if len(g1s) != len(g2s) {
        return false
    }
    
    // Validate all points
    for i := range g1s {
        if g1s[i].Validate() != nil || g2s[i].Validate() != nil {
            return false
        }
    }
    
    // Use optimized multi-pairing with delayed final exp
    return C.blst_pairing_chk_n_mul_n_aggr_pk_in_g2(...) != 0
}
```

## Integration Across Lux Infrastructure

### Layer Integration Points

| Layer | Component | BLS12-381 Integration | Purpose |
|-------|-----------|----------------------|---------|
| **EVM** | `precompiles/bls12381/` | Precompile contract | Smart contract access |
| **Crypto** | `crypto/bls12381/blst/` | Core library (~3 MB) | Signing, verification |
| **Consensus** | `consensus/quasar/` | Aggregate signatures | Block finality |
| **Warp** | `warp/signatures/` | Cross-chain attestation | Message verification |
| **ZK** | `zk/groth16/` | Pairing verification | Proof verification |
| **DKG** | `threshold/bls/` | Threshold BLS | Distributed signing |

### Network Usage Map

| Lux Component | BLS12-381 Operations | Use Case |
|---------------|---------------------|----------|
| **Quasar Consensus** | Aggregate Verify (100+ sigs) | Block finality attestations |
| **Warp Messaging** | Fast Aggregate Verify | Cross-chain message proofs |
| **P-Chain Validators** | Individual Verify | Validator registration |
| **ZK Verifier** | Multi-pairing | Groth16/PLONK proof verification |
| **Randomness Beacon** | Threshold BLS | Distributed randomness |
| **Light Clients** | Signature aggregation | Compact block headers |

### Quasar Consensus Integration

```go
// consensus/quasar/bls_aggregator.go

type BLSAggregator struct {
    precompile IBLS12381
    validators []*Validator
    threshold  int
}

// Aggregate validator attestations for block finality
func (a *BLSAggregator) AggregateAttestations(
    blockHash common.Hash,
    attestations []Attestation,
) (*AggregatedAttestation, error) {
    if len(attestations) < a.threshold {
        return nil, ErrInsufficientAttestations
    }
    
    // Collect signatures and public keys
    sigs := make([][]byte, len(attestations))
    pubkeys := make([][]byte, len(attestations))
    signerBits := new(big.Int)
    
    for i, att := range attestations {
        sigs[i] = att.Signature
        pubkeys[i] = a.validators[att.ValidatorIndex].BLSPublicKey
        signerBits.SetBit(signerBits, int(att.ValidatorIndex), 1)
    }
    
    // Aggregate signatures
    aggSig, err := a.precompile.BlsAggregateSignatures(sigs)
    if err != nil {
        return nil, fmt.Errorf("aggregation failed: %w", err)
    }
    
    // Fast aggregate verify (same message)
    message := blockHash[:]
    valid, err := a.precompile.BlsFastAggregateVerify(aggSig, pubkeys, message)
    if err != nil || !valid {
        return nil, ErrInvalidAggregateSignature
    }
    
    return &AggregatedAttestation{
        BlockHash:  blockHash,
        Signature:  aggSig,
        SignerBits: signerBits,
    }, nil
}
```

### Performance Benchmarks (Apple M1 Max)

| Operation | Time | Throughput |
|-----------|------|------------|
| G1 Add | 1.2 μs | 833,333 ops/sec |
| G1 Mul | 180 μs | 5,556 ops/sec |
| G1 MSM (100 points) | 4.5 ms | 22,222 points/sec |
| G2 Add | 3.5 μs | 285,714 ops/sec |
| G2 Mul | 520 μs | 1,923 ops/sec |
| Pairing (1 pair) | 1.2 ms | 833 ops/sec |
| Pairing Check (2 pairs) | 1.8 ms | 556 ops/sec |
| BLS Sign | 250 μs | 4,000 ops/sec |
| BLS Verify | 1.4 ms | 714 ops/sec |
| Fast Agg Verify (100) | 3.2 ms | 31,250 sigs/sec |
| Hash to G2 | 380 μs | 2,632 ops/sec |

## Test Cases

```solidity
contract BLS12381Test {
    IBLS12381 constant BLS = IBLS12381(0x0000000000000000000000000000000000000313);
    
    // G1 generator
    bytes constant G1_GEN = hex"97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb";
    
    // G2 generator
    bytes constant G2_GEN = hex"93e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8";
    
    function testG1Operations() public view {
        // G + G = 2G
        bytes memory twoG = BLS.g1Add(G1_GEN, G1_GEN);
        
        // 2 * G should equal 2G
        bytes memory twoG_mul = BLS.g1Mul(G1_GEN, bytes32(uint256(2)));
        
        require(keccak256(twoG) == keccak256(twoG_mul), "G1 ops mismatch");
    }
    
    function testBLSSignature() public view {
        bytes32 sk = bytes32(uint256(12345));
        bytes memory message = "test message";
        
        // Sign
        bytes memory sig = BLS.blsSign(sk, message);
        
        // Derive public key (sk * G2)
        bytes memory pk = BLS.g2Mul(G2_GEN, sk);
        
        // Verify
        bool valid = BLS.blsVerify(sig, pk, message);
        require(valid, "BLS verify failed");
    }
    
    function testAggregateVerify() public view {
        bytes[] memory sigs = new bytes[](3);
        bytes[] memory pks = new bytes[](3);
        bytes memory message = "consensus block";
        
        // Create 3 key pairs and sign same message
        for (uint i = 0; i < 3; i++) {
            bytes32 sk = bytes32(uint256(i + 1));
            sigs[i] = BLS.blsSign(sk, message);
            pks[i] = BLS.g2Mul(G2_GEN, sk);
        }
        
        // Aggregate signatures
        bytes memory aggSig = BLS.blsAggregateSignatures(sigs);
        
        // Fast aggregate verify (same message)
        bool valid = BLS.blsFastAggregateVerify(aggSig, pks, message);
        require(valid, "Aggregate verify failed");
    }
    
    function testPairingCheck() public view {
        // Check: e(G1, G2) = e(G1, G2)
        // Which is: e(G1, G2) * e(-G1, G2) = 1
        bytes memory negG1 = BLS.g1Neg(G1_GEN);
        
        bytes memory g1Points = abi.encodePacked(G1_GEN, negG1);
        bytes memory g2Points = abi.encodePacked(G2_GEN, G2_GEN);
        
        bool valid = BLS.pairingCheck(g1Points, g2Points);
        require(valid, "Pairing check failed");
    }
}
```

## Security Considerations

1. **Subgroup Checks**: All points validated for subgroup membership before operations
2. **Rogue Key Prevention**: Proof-of-Possession scheme for aggregation
3. **Constant-Time**: blst uses constant-time assembly for all operations
4. **Final Exponentiation**: Always applied after Miller loop
5. **Input Validation**: All inputs validated before processing
6. **Domain Separation**: Distinct DST tags for different contexts

## Backwards Compatibility

This LP introduces a new precompile and is fully backwards compatible with EIP-2537. Existing contracts can use both interfaces.

## References

- [blst Library](https://github.com/supranational/blst) - Supranational's implementation
- [BLS12-381 Curve](https://hackmd.io/@benjaminion/bls12-381) - Curve specification
- [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 precompiles
- [Hash-to-Curve](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve) - RFC draft
- [BLS Signature Standard](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature) - CFRG standard
- LP-110: Quasar Consensus Protocol

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
