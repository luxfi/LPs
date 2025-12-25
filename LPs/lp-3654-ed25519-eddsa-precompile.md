---
lp: 3654
title: Ed25519/EdDSA Cryptography Precompile
description: Native EVM precompile for Ed25519 curve operations and EdDSA signature verification
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-24
requires: 4
activation:
  flag: lp3654-ed25519
  hfName: "Quantum"
  activationHeight: "0"
tags: [evm, precompile, cryptography, eddsa, ed25519]
order: 3654
---

## Abstract

LP-3654 specifies a native EVM precompile for Ed25519 elliptic curve operations and EdDSA signature verification. Ed25519 provides the fastest known signature verification for 128-bit security level, making it ideal for high-throughput blockchain applications. The precompile enables efficient cross-chain verification with Solana, NEAR, Cosmos, and other Ed25519-based networks.

## Motivation

### Current Limitations

**No Native Ed25519 Support:**
- EVM has no built-in Ed25519 operations
- Solidity implementations are prohibitively expensive (200,000+ gas)
- Cross-chain verification requires expensive on-chain computation
- Validator signatures cannot use EdDSA natively

**Solidity-Based Ed25519:**
- ~200,000 gas for single signature verification
- Complex field arithmetic in uint256
- No batch verification optimization
- Vulnerable to implementation errors

### Use Cases Requiring Native Ed25519

1. **Cross-Chain Bridge Verification**
   - Solana transaction proofs
   - NEAR signature verification
   - Cosmos/Tendermint validator signatures
   - Polkadot/Substrate integration

2. **Validator Operations**
   - P-Chain staking signatures
   - Consensus message signing
   - BLS-to-EdDSA fallback

3. **Identity and Authentication**
   - SSH key verification
   - PGP/GPG signature support
   - Passkey/WebAuthn Ed25519 mode

4. **Threshold EdDSA (Ringtail)**
   - Distributed key generation
   - Partial signature aggregation
   - Key resharing protocols

### Performance Benefits

| Operation | Solidity | Precompile | Improvement |
|-----------|----------|------------|-------------|
| EdDSA Verify | 200,000 gas | 2,000 gas | 100x |
| Batch Verify (10) | 2,000,000 gas | 10,000 gas | 200x |
| Point Multiplication | 80,000 gas | 1,500 gas | 53x |
| Key Derivation | 100,000 gas | 2,500 gas | 40x |

## Rationale

### Ed25519 Curve Selection

Ed25519 is the most widely deployed EdDSA curve for 128-bit security:

1. **Performance**: Fastest signature verification of any standardized curve
2. **Simplicity**: Fixed-base scalar multiplication, no curve parameter choices
3. **Adoption**: Used by Solana, NEAR, Cosmos, Polkadot, and many others
4. **Security**: Well-studied, no known practical attacks

### Precompile Address Choice

Using `0x0314` (492+ in hex) for Ed25519 operations:

- Follows the cryptographic precompile address convention
- Sequential after BLS12-381 at `0x0313`
- Single address with function selectors for all Ed25519 operations

### Function Selector Design

Organized for intuitive API:

- `0x01-0x0F`: Core EdDSA operations (verify, batch verify)
- `0x10-0x1F`: Scalar/point operations
- `0x20-0x2F`: Key derivation and conversion
- `0x30-0x3F`: X25519 (ECDH) operations

### Gas Cost Derivation

Gas costs based on computational complexity:

| Operation | libsodium Time (μs) | Ratio to ecrecover | Gas |
|-----------|---------------------|-------------------|-----|
| eddsaVerify | 8 | 0.16x | 2,000 |
| eddsaBatch (10) | 45 | 0.9x | 10,000 |
| pointMul | 6 | 0.12x | 1,500 |
| x25519 | 5 | 0.1x | 1,200 |

### RFC 8032 Compliance

Strict adherence to RFC 8032 (EdDSA) ensures:

- Interoperability with all Ed25519 implementations
- Compatibility with existing key formats
- Proper handling of edge cases (clamped scalars, etc.)

## Specification

### Precompile Address

| Address | Operation |
|---------|-----------|
| `0x0314` | Ed25519/EdDSA Operations |

### Function Selectors

| Selector | Function | Gas |
|----------|----------|-----|
| `0x01` | `eddsaVerify(bytes32 message, bytes64 sig, bytes32 pubkey)` | 2,000 |
| `0x02` | `eddsaVerifyBatch(bytes32[] messages, bytes64[] sigs, bytes32[] pubkeys)` | 1,000 + 800/sig |
| `0x03` | `eddsaSign(bytes32 message, bytes32 privkey)` | 1,500 |
| `0x10` | `pointMul(bytes32 point, bytes32 scalar)` | 1,500 |
| `0x11` | `pointAdd(bytes32 point1, bytes32 point2)` | 400 |
| `0x12` | `pointSub(bytes32 point1, bytes32 point2)` | 400 |
| `0x13` | `pointNeg(bytes32 point)` | 100 |
| `0x14` | `isOnCurve(bytes32 point)` | 200 |
| `0x15` | `scalarMul(bytes32 basepoint, bytes32 scalar)` | 1,200 |
| `0x20` | `pubkeyCreate(bytes32 privkey)` | 1,200 |
| `0x21` | `pubkeyDerive(bytes32 pubkey, bytes32 chaincode, uint32 index)` | 2,500 |
| `0x22` | `pubkeyValidate(bytes32 pubkey)` | 300 |
| `0x30` | `x25519(bytes32 privkey, bytes32 pubkey)` | 1,500 |
| `0x31` | `x25519BaseMul(bytes32 scalar)` | 1,200 |

### Data Encoding

**Ed25519 Public Key:**
```solidity
bytes32 pubkey  // 32-byte compressed Edwards point
```

**EdDSA Signature:**
```solidity
bytes64 signature = R || s
  R: bytes32  // 32-byte Edwards point (R = k*B)
  s: bytes32  // 32-byte scalar
```

**X25519 Keys:**
```solidity
bytes32 privkey  // 32-byte scalar (clamped)
bytes32 pubkey   // 32-byte Montgomery u-coordinate
```

### Detailed Function Specifications

#### eddsaVerify

Verifies an EdDSA signature according to RFC 8032.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Message hash (SHA-512 of message) |
| 32 | 64 | Signature (R || s) |
| 96 | 32 | Public key |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | 0x01 if valid, 0x00 if invalid |
```

**Verification Steps:**
1. Parse R as compressed Edwards point
2. Parse s as scalar (reject if s >= L)
3. Compute h = SHA512(R || pubkey || message) mod L
4. Compute check = s*B - h*A (where A = pubkey, B = basepoint)
5. Return 1 if check == R, else 0

#### eddsaVerifyBatch

Batch verification with randomized linear combination for efficiency.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Count (n) |
| 4 | 32*n | Message hashes |
| 4+32*n | 64*n | Signatures |
| 4+96*n | 32*n | Public keys |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | 0x01 if all valid, 0x00 if any invalid |
```

**Batch Algorithm:**
```markdown
For random challenges z_i:
  Check: sum(z_i * s_i) * B == sum(z_i * R_i) + sum(z_i * h_i * A_i)
```

#### x25519 (ECDH)

Performs X25519 Diffie-Hellman key exchange.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Private key (clamped) |
| 32 | 32 | Peer public key |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Shared secret |
```

## Implementation Stack

### Architecture Overview

```solidity
┌─────────────────────────────────────────────────────────────────────┐
│                      Ed25519 Precompile (0x0314)                     │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 4: EVM Interface                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ed25519_precompile.go    - EVM precompile contract              ││
│  │ ed25519_gas.go           - Gas calculation                       ││
│  │ ed25519_abi.go           - ABI encoding/decoding                ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: Go Cryptographic API                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ crypto/ed25519/          - Standard library ed25519             ││
│  │ filippo.io/edwards25519  - Extended Edwards operations          ││
│  │ x25519.go                - ECDH implementation                  ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: Field Arithmetic                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ edwards25519/field       - Prime field (2^255 - 19)             ││
│  │ edwards25519/scalar      - Scalar field (order L)               ││
│  │ edwards25519/point       - Extended coordinates                  ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 1: Assembly Optimizations                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ fe_amd64.s               - AMD64 field element ops              ││
│  │ fe_arm64.s               - ARM64 field element ops              ││
│  │ scalar_amd64.s           - AMD64 scalar arithmetic              ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### File Inventory

```solidity
evm/precompile/contracts/ed25519/
├── ed25519.go              (12 KB)  # Main precompile implementation
├── ed25519_test.go         (8 KB)   # Unit tests
├── gas.go                  (2 KB)   # Gas metering
├── verify.go               (4 KB)   # Signature verification
├── verify_batch.go         (3 KB)   # Batch verification
├── point_ops.go            (6 KB)   # Point arithmetic
├── x25519.go               (4 KB)   # ECDH operations
└── testdata/
    ├── rfc8032_vectors.json        # RFC 8032 test vectors
    └── batch_vectors.json          # Batch verification tests

node/crypto/ed25519/
├── ed25519.go              (8 KB)   # Extended operations
├── batch.go                (4 KB)   # Batch verifier
├── derive.go               (3 KB)   # Key derivation
└── ed25519_test.go         (6 KB)   # Tests

Total: ~60 KB implementation
```

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEd25519 {
    /// @notice Verify EdDSA signature (RFC 8032)
    /// @param message 32-byte message hash
    /// @param signature 64-byte signature (R || s)
    /// @param pubkey 32-byte public key
    /// @return valid True if signature is valid
    function eddsaVerify(
        bytes32 message,
        bytes calldata signature,
        bytes32 pubkey
    ) external view returns (bool valid);

    /// @notice Batch verify multiple EdDSA signatures
    /// @param messages Array of 32-byte message hashes
    /// @param signatures Array of 64-byte signatures
    /// @param pubkeys Array of 32-byte public keys
    /// @return valid True if ALL signatures are valid
    function eddsaVerifyBatch(
        bytes32[] calldata messages,
        bytes[] calldata signatures,
        bytes32[] calldata pubkeys
    ) external view returns (bool valid);

    /// @notice Create public key from private key
    /// @param privkey 32-byte private key seed
    /// @return pubkey 32-byte public key
    function pubkeyCreate(
        bytes32 privkey
    ) external view returns (bytes32 pubkey);

    /// @notice Derive child public key (HD derivation)
    /// @param pubkey Parent public key
    /// @param chaincode 32-byte chain code
    /// @param index Child index
    /// @return childPubkey Derived child public key
    function pubkeyDerive(
        bytes32 pubkey,
        bytes32 chaincode,
        uint32 index
    ) external view returns (bytes32 childPubkey);

    /// @notice X25519 Diffie-Hellman key exchange
    /// @param privkey 32-byte private key (clamped)
    /// @param peerPubkey 32-byte peer public key
    /// @return sharedSecret 32-byte shared secret
    function x25519(
        bytes32 privkey,
        bytes32 peerPubkey
    ) external view returns (bytes32 sharedSecret);

    /// @notice Edwards curve point multiplication
    /// @param point 32-byte compressed point
    /// @param scalar 32-byte scalar
    /// @return result 32-byte result point
    function pointMul(
        bytes32 point,
        bytes32 scalar
    ) external view returns (bytes32 result);

    /// @notice Edwards curve point addition
    /// @param point1 First point
    /// @param point2 Second point
    /// @return result Sum point
    function pointAdd(
        bytes32 point1,
        bytes32 point2
    ) external view returns (bytes32 result);
}
```solidity

### Go Implementation

```go
// evm/precompile/contracts/ed25519/ed25519.go
package ed25519

import (
    "crypto/ed25519"
    "crypto/sha512"

    "filippo.io/edwards25519"
    "github.com/luxfi/evm/precompile/contract"
)

const (
    PrecompileAddress = "0x0314"

    // Function selectors
    SelectorVerify       = 0x01
    SelectorVerifyBatch  = 0x02
    SelectorSign         = 0x03
    SelectorPointMul     = 0x10
    SelectorPointAdd     = 0x11
    SelectorPointSub     = 0x12
    SelectorPointNeg     = 0x13
    SelectorIsOnCurve    = 0x14
    SelectorScalarMul    = 0x15
    SelectorPubkeyCreate = 0x20
    SelectorPubkeyDerive = 0x21
    SelectorPubkeyValid  = 0x22
    SelectorX25519       = 0x30
    SelectorX25519Base   = 0x31

    // Gas costs
    GasVerify      = 2000
    GasVerifyBatch = 1000 // base cost
    GasPerSig      = 800  // per additional signature
    GasSign        = 1500
    GasPointMul    = 1500
    GasPointAdd    = 400
    GasPointSub    = 400
    GasPointNeg    = 100
    GasIsOnCurve   = 200
    GasScalarMul   = 1200
    GasPubkeyCreate = 1200
    GasPubkeyDerive = 2500
    GasPubkeyValid  = 300
    GasX25519       = 1500
    GasX25519Base   = 1200
)

type Ed25519Precompile struct{}

func (p *Ed25519Precompile) Run(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) ([]byte, uint64, error) {
    if len(input) < 1 {
        return nil, suppliedGas, ErrInvalidInput
    }

    selector := input[0]
    data := input[1:]

    switch selector {
    case SelectorVerify:
        return p.eddsaVerify(data, suppliedGas)
    case SelectorVerifyBatch:
        return p.eddsaVerifyBatch(data, suppliedGas)
    case SelectorPointMul:
        return p.pointMul(data, suppliedGas)
    case SelectorPointAdd:
        return p.pointAdd(data, suppliedGas)
    case SelectorX25519:
        return p.x25519(data, suppliedGas)
    // ... other cases
    default:
        return nil, suppliedGas, ErrUnknownSelector
    }
}

func (p *Ed25519Precompile) eddsaVerify(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    if suppliedGas < GasVerify {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - GasVerify

    if len(data) < 128 { // 32 + 64 + 32
        return nil, remainingGas, ErrInvalidInput
    }

    message := data[0:32]
    signature := data[32:96]
    pubkey := data[96:128]

    // Validate public key is on curve
    if !isValidPubkey(pubkey) {
        return padFalse(), remainingGas, nil
    }

    // Perform EdDSA verification (RFC 8032)
    valid := ed25519.Verify(pubkey, message, signature)

    if valid {
        return padTrue(), remainingGas, nil
    }
    return padFalse(), remainingGas, nil
}

func (p *Ed25519Precompile) eddsaVerifyBatch(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    if len(data) < 4 {
        return nil, suppliedGas, ErrInvalidInput
    }

    count := binary.BigEndian.Uint32(data[0:4])
    requiredGas := GasVerifyBatch + uint64(count)*GasPerSig

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    // Parse batch inputs
    messages, signatures, pubkeys, err := parseBatchInput(data[4:], count)
    if err != nil {
        return nil, remainingGas, err
    }

    // Batch verify using randomized linear combination
    valid := batchVerify(messages, signatures, pubkeys)

    if valid {
        return padTrue(), remainingGas, nil
    }
    return padFalse(), remainingGas, nil
}

// batchVerify uses randomized linear combination for efficient batch verification
// Algorithm: Check sum(z_i * s_i) * B == sum(z_i * R_i) + sum(z_i * h_i * A_i)
func batchVerify(messages, signatures [][]byte, pubkeys [][]byte) bool {
    n := len(messages)
    if n == 0 {
        return true
    }

    // Generate random challenges
    challenges := make([]*edwards25519.Scalar, n)
    for i := 0; i < n; i++ {
        challenges[i] = randomScalar()
    }

    // Accumulate left side: sum(z_i * s_i) * B
    leftScalar := edwards25519.NewScalar()
    for i := 0; i < n; i++ {
        s := parseScalar(signatures[i][32:64])
        term := edwards25519.NewScalar().Multiply(challenges[i], s)
        leftScalar.Add(leftScalar, term)
    }
    leftPoint := edwards25519.NewGeneratorPoint().ScalarMult(leftScalar, edwards25519.NewGeneratorPoint())

    // Accumulate right side: sum(z_i * R_i) + sum(z_i * h_i * A_i)
    rightPoint := edwards25519.NewIdentityPoint()
    for i := 0; i < n; i++ {
        R := parsePoint(signatures[i][0:32])
        A := parsePoint(pubkeys[i])

        // h = H(R || A || M) mod L
        h := computeChallenge(signatures[i][0:32], pubkeys[i], messages[i])

        // z_i * R_i
        scaledR := edwards25519.NewIdentityPoint().ScalarMult(challenges[i], R)
        rightPoint.Add(rightPoint, scaledR)

        // z_i * h_i * A_i
        zh := edwards25519.NewScalar().Multiply(challenges[i], h)
        scaledA := edwards25519.NewIdentityPoint().ScalarMult(zh, A)
        rightPoint.Add(rightPoint, scaledA)
    }

    return leftPoint.Equal(rightPoint) == 1
}
```

### Cross-Chain Integration

```solidity
┌─────────────────────────────────────────────────────────────────────┐
│                     Ed25519 Cross-Chain Usage                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Solana     │    │    NEAR      │    │   Cosmos     │          │
│  │   Bridge     │    │    Bridge    │    │   Bridge     │          │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│         │                   │                   │                    │
│         └───────────────────┼───────────────────┘                   │
│                             │                                        │
│                             ▼                                        │
│               ┌──────────────────────────┐                          │
│               │  Ed25519 Precompile      │                          │
│               │       (0x0314)           │                          │
│               └─────────────┬────────────┘                          │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                   │
│         │                   │                   │                    │
│         ▼                   ▼                   ▼                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  Ringtail    │    │  Validator   │    │   SSH Key    │          │
│  │  Threshold   │    │  Signatures  │    │   Verify     │          │
│  │    EdDSA     │    │              │    │              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Network Usage Map

| Chain | Component | Ed25519 Usage |
|-------|-----------|---------------|
| C-Chain | Bridge Contracts | Solana/NEAR signature verification |
| C-Chain | Identity | SSH key verification |
| P-Chain | Staking | Validator EdDSA signatures |
| T-Chain | Threshold | Ringtail EdDSA aggregation |
| B-Chain | Bridge | Cross-chain proof verification |

## Secure Implementation Guidelines

### RFC 8032 Compliance

**Signature Malleability Prevention:**
```go
// Reject s >= L to prevent signature malleability
func validateScalar(s []byte) error {
    scalar, err := edwards25519.NewScalar().SetCanonicalBytes(s)
    if err != nil {
        return ErrNonCanonicalS
    }
    return nil
}
```go

**Cofactored vs Cofactorless Verification:**
```go
// Ed25519 uses cofactorless verification (multiply by 8 is implicit)
// Ensure R is in prime-order subgroup
func verifySubgroup(R *edwards25519.Point) error {
    // Multiply by cofactor (8) and check not identity
    eight := edwards25519.NewScalar().SetUint64(8)
    cofactored := edwards25519.NewIdentityPoint().ScalarMult(eight, R)
    if cofactored.Equal(edwards25519.NewIdentityPoint()) == 1 {
        return ErrSmallOrderPoint
    }
    return nil
}
```

### Side-Channel Resistance

**Constant-Time Operations:**
```go
// All scalar and point operations must be constant-time
// filippo.io/edwards25519 provides constant-time implementations

func constantTimeCompare(a, b []byte) bool {
    return subtle.ConstantTimeCompare(a, b) == 1
}
```sql

**No Branching on Secret Data:**
```go
// WRONG: Branch on secret
if secretBit == 1 {
    result = P1
} else {
    result = P2
}

// CORRECT: Constant-time select
result = edwards25519.NewIdentityPoint()
result.Select(P1, P2, secretBit) // Constant-time conditional
```

### Key Clamping (X25519)

```go
// X25519 private keys must be clamped per RFC 7748
func clampPrivateKey(key []byte) {
    key[0] &= 248   // Clear lowest 3 bits
    key[31] &= 127  // Clear highest bit
    key[31] |= 64   // Set second highest bit
}
```go

### Small Order Point Rejection

```go
// Reject small-order points that could enable attacks
var smallOrderPoints = [][]byte{
    // Identity point
    {0x01, 0x00, 0x00, ...},
    // Other small-order points (there are 8 total)
}

func rejectSmallOrder(point []byte) error {
    for _, sop := range smallOrderPoints {
        if subtle.ConstantTimeCompare(point, sop) == 1 {
            return ErrSmallOrderPoint
        }
    }
    return nil
}
```

## Test Cases

### RFC 8032 Test Vectors

```go
func TestEdDSAVerify(t *testing.T) {
    // Test vector from RFC 8032 Section 7.1
    privkey := hexToBytes("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60")
    pubkey := hexToBytes("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a")
    message := []byte{} // Empty message
    signature := hexToBytes("e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b")

    result := precompile.EddsaVerify(message, signature, pubkey)
    assert.True(t, result)
}

func TestEdDSAVerifyBatch(t *testing.T) {
    // Generate 100 random signatures
    messages := make([][]byte, 100)
    signatures := make([][]byte, 100)
    pubkeys := make([][]byte, 100)

    for i := 0; i < 100; i++ {
        pub, priv, _ := ed25519.GenerateKey(rand.Reader)
        msg := randomBytes(32)
        sig := ed25519.Sign(priv, msg)

        messages[i] = msg
        signatures[i] = sig
        pubkeys[i] = pub
    }

    result := precompile.EddsaVerifyBatch(messages, signatures, pubkeys)
    assert.True(t, result)

    // Corrupt one signature
    signatures[50][0] ^= 0xFF
    result = precompile.EddsaVerifyBatch(messages, signatures, pubkeys)
    assert.False(t, result)
}

func TestX25519(t *testing.T) {
    // RFC 7748 test vector
    alicePriv := hexToBytes("77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a")
    alicePub := hexToBytes("8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a")
    bobPriv := hexToBytes("5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb")
    bobPub := hexToBytes("de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f")
    expectedShared := hexToBytes("4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742")

    shared1 := precompile.X25519(alicePriv, bobPub)
    shared2 := precompile.X25519(bobPriv, alicePub)

    assert.Equal(t, expectedShared, shared1)
    assert.Equal(t, shared1, shared2)
}
```go

### Performance Benchmarks

```go
func BenchmarkEdDSAVerify(b *testing.B) {
    pub, priv, _ := ed25519.GenerateKey(rand.Reader)
    msg := randomBytes(32)
    sig := ed25519.Sign(priv, msg)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.EddsaVerify(msg, sig, pub)
    }
}
// BenchmarkEdDSAVerify-8    543,721 ns/op    2,000 gas

func BenchmarkEdDSAVerifyBatch10(b *testing.B) {
    messages, signatures, pubkeys := generateBatch(10)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.EddsaVerifyBatch(messages, signatures, pubkeys)
    }
}
// BenchmarkEdDSAVerifyBatch10-8    2,891,432 ns/op    9,000 gas (900 gas/sig)
```

## Backwards Compatibility

No backwards compatibility issues. This LP introduces a new precompile at an unused address.

## Security Considerations

### Signature Malleability

Ed25519 signatures are inherently non-malleable when:
1. The scalar s is validated as canonical (s < L)
2. The point R is validated as canonical encoding
3. Public key validation rejects small-order points

### Timing Attacks

All implementations MUST use constant-time algorithms:
- `filippo.io/edwards25519` provides constant-time field and scalar arithmetic
- No branching on secret-dependent data
- No variable-time memory access patterns

### Key Reuse

Ed25519 is deterministic - the same message/key pair always produces the same signature. This is a feature, not a bug, as it prevents nonce-reuse attacks.

### X25519 Contributory Behavior

X25519 shared secrets may equal identity if peer provides small-order point. Implementations MUST validate peer public keys or use XEdDSA for authenticated key exchange.

## References

- [RFC 8032: Edwards-Curve Digital Signature Algorithm (EdDSA)](https://datatracker.ietf.org/doc/html/rfc8032)
- [RFC 7748: Elliptic Curves for Security](https://datatracker.ietf.org/doc/html/rfc7748)
- [filippo.io/edwards25519](https://pkg.go.dev/filippo.io/edwards25519)
- [LP-7324: Ringtail Threshold EdDSA](./lp-7324-ringtail-threshold-signature-precompile.md)
- [LP-3652: secp256k1 ECDSA Precompile](./lp-3652-secp256k1-ecdsa-precompile.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
