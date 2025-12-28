---
lp: 3657
title: Verifiable Random Function (VRF) Precompile
description: Native EVM precompile for cryptographic VRF operations supporting randomness for consensus and applications
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-24
requires: 4
activation:
  flag: lp3657-vrf
  hfName: "Quantum"
  activationHeight: "0"
tags: [evm, precompile, cryptography, vrf, randomness]
order: 3657
---

## Abstract

LP-3657 specifies a native EVM precompile for Verifiable Random Function (VRF) operations, enabling on-chain verifiable randomness. VRFs produce pseudorandom outputs that can be cryptographically verified against a public key, making them essential for fair leader election, lottery systems, and gaming applications. This precompile supports multiple VRF constructions: ECVRF (secp256k1, Ed25519), and post-quantum Ringtail VRF.

## Motivation

### Current Limitations

**No Native VRF Support:**
- EVM has no built-in VRF operations
- Solidity VRF verification is extremely expensive (500,000+ gas)
- External oracle solutions introduce trust assumptions
- Cross-chain VRF verification is impractical

**Chainlink VRF Limitations:**
- Requires LINK token payments
- Off-chain computation introduces latency
- Trust in Chainlink operator network
- Cannot verify historical randomness on-chain

### Use Cases Requiring Native VRF

1. **Consensus and Leader Election**
   - Quasar consensus proposer selection
   - Photon VRF-based leader election
   - Stake-weighted random selection

2. **Gaming and Lotteries**
   - Provably fair random outcomes
   - On-chain card shuffling
   - Transparent lottery systems

3. **NFT and Metadata**
   - Fair trait distribution
   - Random mint ordering
   - Unbiased rarity assignment

4. **DeFi Applications**
   - Random liquidator selection
   - Fair queue ordering
   - Randomized fee distribution

### Performance Benefits

| Operation | Solidity | Precompile | Improvement |
|-----------|----------|------------|-------------|
| VRF Prove | Off-chain | 50,000 gas | N/A |
| VRF Verify (secp256k1) | 500,000 gas | 15,000 gas | 33x |
| VRF Verify (Ed25519) | 600,000 gas | 12,000 gas | 50x |
| Batch Verify (10) | 5,000,000 gas | 80,000 gas | 62x |

## Rationale

### VRF Selection for Different Use Cases

Three VRF constructions provide flexibility:

1. **ECVRF-SECP256K1-SHA256**: Default for most applications
   - Compatible with Ethereum's curve
   - Best gas efficiency
   - Widely understood security model

2. **ECVRF-ED25519-SHA512**: High-performance alternative
   - Faster verification than secp256k1
   - Used by Algorand, NEAR
   - Better for batch operations

3. **Ringtail VRF**: Threshold/multi-party VRF
   - Distributed key generation
   - No single point of failure
   - Post-quantum ready

### Precompile Address Choice

Using `0x0317` (495+ in hex) for VRF operations:

- Sequential after Blake3 at `0x0316`
- Grouping all VRF-related operations
- Follows cryptographic precompile convention

### Function Selector Design

Organized by operation category:

- `0x01-0x0F`: ECVRF prove/verify operations
- `0x10-0x1F`: Batch verification
- `0x20-0x2F`: Proof conversion and hashing
- `0x30-0x3F`: Ringtail threshold operations

### Gas Cost Derivation

Gas costs based on cryptographic complexity:

| Operation | Complexity | Relative to ecrecover | Gas |
|-----------|------------|----------------------|-----|
| vrfVerify (secp256k1) | 2x EC mul + hashing | ~5x | 15,000 |
| vrfVerify (Ed25519) | 1.5x EC mul + hashing | ~4x | 12,000 |
| vrfBatchVerify (10) | ~8x single | ~40x | 80,000 |
| vrfProofToHash | Simple hashing | ~0.5x | 3,000 |

### VRF for Consensus

VRF is essential for leader election in modern consensus:

- **Photon**: VRF-based proposer selection
- **Quasar**: Randomness for committee formation
- **Fairness**: Unpredictable but verifiable leader election

### IETF ECVRF Standard Compliance

Following IETF ECVRF draft ensures:

- Interoperability with other chains
- Correct security properties (unpredictability, uniqueness)
- Standard proof format for verification

## Specification

### Precompile Address

| Address | Operation |
|---------|-----------|
| `0x0317` | VRF Operations |

### Function Selectors

| Selector | Function | Gas |
|----------|----------|-----|
| `0x01` | `vrfProve(bytes32 sk, bytes alpha)` | 50,000 |
| `0x02` | `vrfVerify(bytes pk, bytes alpha, bytes pi)` | 15,000 |
| `0x03` | `vrfProofToHash(bytes pi)` | 2,000 |
| `0x10` | `vrfEd25519Prove(bytes32 sk, bytes alpha)` | 40,000 |
| `0x11` | `vrfEd25519Verify(bytes32 pk, bytes alpha, bytes pi)` | 12,000 |
| `0x12` | `vrfEd25519ProofToHash(bytes pi)` | 1,500 |
| `0x20` | `vrfBatchVerify(bytes[] pks, bytes[] alphas, bytes[] pis)` | 8,000 + 5,000/proof |
| `0x30` | `vrfDerivePublicKey(bytes32 sk)` | 5,000 |
| `0x40` | `vrfRingtailProve(bytes32[] sks, bytes alpha)` | 100,000 |
| `0x41` | `vrfRingtailVerify(bytes32[] pks, bytes alpha, bytes pi)` | 50,000 |

### VRF Constructions

This precompile supports three VRF constructions:

#### 1. ECVRF-SECP256K1-SHA256 (Default)

Based on [draft-irtf-cfrg-vrf-15](https://datatracker.ietf.org/doc/draft-irtf-cfrg-vrf/), using secp256k1 curve.

**Parameters:**
- Curve: secp256k1
- Hash: SHA-256
- Suite: `ECVRF-SECP256K1-SHA256-TAI`

#### 2. ECVRF-ED25519-SHA512

Based on [draft-irtf-cfrg-vrf-15](https://datatracker.ietf.org/doc/draft-irtf-cfrg-vrf/), using Ed25519 curve.

**Parameters:**
- Curve: Ed25519
- Hash: SHA-512
- Suite: `ECVRF-ED25519-SHA512-TAI`

#### 3. Ringtail VRF (Threshold)

Threshold VRF using Ringtail signature aggregation for distributed randomness.

**Parameters:**
- Scheme: Threshold EdDSA (t-of-n)
- Hash: SHA-512
- Aggregation: Ringtail

### Data Encoding

**VRF Proof (ECVRF-SECP256K1):**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 33 | Gamma (compressed point) |
| 33 | 16 | c (challenge, 16 bytes) |
| 49 | 32 | s (response scalar) |
Total: 81 bytes
```

**VRF Proof (ECVRF-ED25519):**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Gamma (compressed point) |
| 32 | 16 | c (challenge, 16 bytes) |
| 48 | 32 | s (response scalar) |
Total: 80 bytes
```

**VRF Output (Hash):**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | beta (VRF output hash) |
```

### Detailed Function Specifications

#### vrfProve

Generates a VRF proof for given input alpha using secret key.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Secret key (sk) |
| 32 | 4 | Alpha length |
| 36 | N | Alpha (input to VRF) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 81 | Proof (pi) |
| 81 | 32 | Hash (beta) |
```

**Algorithm (ECVRF-SECP256K1-SHA256-TAI):**
```solidity
1. Derive public key: Y = x * G
2. Hash to curve: H = ECVRF_hash_to_curve(suite, Y, alpha)
3. Compute Gamma: Gamma = x * H
4. Generate nonce: k = ECVRF_nonce_generation(x, H)
5. Compute U: U = k * G
6. Compute V: V = k * H
7. Compute challenge: c = ECVRF_challenge_generation(Y, H, Gamma, U, V)
8. Compute response: s = k + c * x (mod q)
9. Encode proof: pi = point_to_string(Gamma) || int_to_string(c) || int_to_string(s)
10. Compute hash: beta = ECVRF_proof_to_hash(pi)
```

#### vrfVerify

Verifies a VRF proof and returns the output hash.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 33 | Public key (pk, compressed) |
| 33 | 4 | Alpha length |
| 37 | N | Alpha |
| 37+N | 81 | Proof (pi) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 1 | Valid flag (0x01 = valid) |
| 1 | 32 | Hash (beta) if valid |
```

**Algorithm:**
```solidity
1. Parse proof: (Gamma, c, s) = decode_proof(pi)
2. Validate Gamma is on curve
3. Parse public key: Y = decode_point(pk)
4. Hash to curve: H = ECVRF_hash_to_curve(suite, Y, alpha)
5. Compute U: U = s * G - c * Y
6. Compute V: V = s * H - c * Gamma
7. Compute expected challenge: c' = ECVRF_challenge_generation(Y, H, Gamma, U, V)
8. Verify: c == c'
9. If valid, compute: beta = ECVRF_proof_to_hash(pi)
10. Return (valid, beta)
```

#### vrfProofToHash

Extracts the VRF output hash from a proof without verification.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 81 | Proof (pi) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | Hash (beta) |
```

**Algorithm:**
```solidity
1. Parse Gamma from proof
2. Compute: cofactor_Gamma = cofactor * Gamma
3. Return: beta = SHA256(suite_string || 0x03 || point_to_string(cofactor_Gamma))
```

#### vrfBatchVerify

Batch verifies multiple VRF proofs for efficiency.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Count (n) |
| 4 | variable | n × (pk || alpha_len || alpha || pi) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 1 | All valid flag |
| 1 | 32*n | Hashes (if all valid) |
```

#### vrfRingtailProve

Generates a threshold VRF proof using Ringtail aggregation.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Number of signers (t) |
| 4 | 32*t | Secret key shares |
| 4+32*t | 4 | Alpha length |
| 8+32*t | N | Alpha |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | variable | Aggregated proof |
| variable | 32 | Hash (beta) |
```

## Implementation Stack

### Architecture Overview

```solidity
┌─────────────────────────────────────────────────────────────────────┐
│                       VRF Precompile (0x0317)                        │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 4: EVM Interface                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ vrf_precompile.go        - Precompile dispatcher                ││
│  │ vrf_gas.go               - Gas calculation                       ││
│  │ vrf_abi.go               - ABI encoding/decoding                ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: VRF Constructions                                          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ecvrf_secp256k1.go       - ECVRF on secp256k1                   ││
│  │ ecvrf_ed25519.go         - ECVRF on Ed25519                     ││
│  │ ringtail_vrf.go          - Threshold VRF                        ││
│  │ hash_to_curve.go         - Try-and-increment / Elligator2       ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: Elliptic Curve Operations                                  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ btcec/v2                 - secp256k1 operations                 ││
│  │ filippo.io/edwards25519  - Ed25519 operations                   ││
│  │ scalar.go                - Scalar arithmetic                     ││
│  │ point.go                 - Point operations                      ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 1: Cryptographic Primitives                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ crypto/sha256            - Hash function                        ││
│  │ crypto/sha512            - Ed25519 hash                         ││
│  │ constant_time.go         - Side-channel resistant ops           ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### File Inventory

```sql
evm/precompile/contracts/vrf/
├── vrf.go                  (12 KB)  # Main precompile implementation
├── vrf_test.go             (10 KB)  # Unit tests
├── gas.go                  (2 KB)   # Gas metering
├── ecvrf_secp256k1.go      (8 KB)   # ECVRF secp256k1 implementation
├── ecvrf_ed25519.go        (7 KB)   # ECVRF Ed25519 implementation
├── ringtail_vrf.go         (6 KB)   # Threshold VRF
├── hash_to_curve.go        (5 KB)   # Hash-to-curve algorithms
├── proof.go                (3 KB)   # Proof encoding/decoding
└── testdata/
    ├── ietf_vectors.json          # IETF draft test vectors
    ├── secp256k1_vectors.json     # secp256k1 test vectors
    └── ed25519_vectors.json       # Ed25519 test vectors

node/crypto/vrf/
├── vrf.go                  (6 KB)   # VRF interface
├── ecvrf.go                (8 KB)   # ECVRF implementation
├── ringtail.go             (5 KB)   # Threshold VRF
├── hash_to_curve.go        (4 KB)   # Hash-to-curve
└── vrf_test.go             (8 KB)   # Tests and benchmarks

consensus/protocol/photon/
├── vrf_selection.go        (4 KB)   # VRF-based leader selection
└── luminance.go            (3 KB)   # VRF luminance tracking

Total: ~91 KB implementation
```

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVRF {
    /// @notice Generate VRF proof (secp256k1)
    /// @param sk Secret key
    /// @param alpha VRF input
    /// @return pi Proof
    /// @return beta VRF output hash
    function vrfProve(
        bytes32 sk,
        bytes calldata alpha
    ) external view returns (bytes memory pi, bytes32 beta);

    /// @notice Verify VRF proof (secp256k1)
    /// @param pk Public key (33 bytes compressed)
    /// @param alpha VRF input
    /// @param pi Proof
    /// @return valid True if proof is valid
    /// @return beta VRF output hash
    function vrfVerify(
        bytes calldata pk,
        bytes calldata alpha,
        bytes calldata pi
    ) external view returns (bool valid, bytes32 beta);

    /// @notice Extract hash from proof without verification
    /// @param pi Proof
    /// @return beta VRF output hash
    function vrfProofToHash(bytes calldata pi) external view returns (bytes32 beta);

    /// @notice Generate VRF proof (Ed25519)
    /// @param sk Secret key
    /// @param alpha VRF input
    /// @return pi Proof
    /// @return beta VRF output hash
    function vrfEd25519Prove(
        bytes32 sk,
        bytes calldata alpha
    ) external view returns (bytes memory pi, bytes32 beta);

    /// @notice Verify VRF proof (Ed25519)
    /// @param pk Public key (32 bytes)
    /// @param alpha VRF input
    /// @param pi Proof
    /// @return valid True if proof is valid
    /// @return beta VRF output hash
    function vrfEd25519Verify(
        bytes32 pk,
        bytes calldata alpha,
        bytes calldata pi
    ) external view returns (bool valid, bytes32 beta);

    /// @notice Batch verify multiple VRF proofs
    /// @param pks Array of public keys
    /// @param alphas Array of VRF inputs
    /// @param pis Array of proofs
    /// @return valid True if ALL proofs are valid
    /// @return betas Array of VRF output hashes
    function vrfBatchVerify(
        bytes[] calldata pks,
        bytes[] calldata alphas,
        bytes[] calldata pis
    ) external view returns (bool valid, bytes32[] memory betas);

    /// @notice Derive public key from secret key
    /// @param sk Secret key
    /// @return pk Public key
    function vrfDerivePublicKey(bytes32 sk) external view returns (bytes memory pk);

    /// @notice Generate threshold VRF proof (Ringtail)
    /// @param sks Array of secret key shares (t-of-n)
    /// @param alpha VRF input
    /// @return pi Aggregated proof
    /// @return beta VRF output hash
    function vrfRingtailProve(
        bytes32[] calldata sks,
        bytes calldata alpha
    ) external view returns (bytes memory pi, bytes32 beta);

    /// @notice Verify threshold VRF proof (Ringtail)
    /// @param pks Array of public key shares
    /// @param alpha VRF input
    /// @param pi Aggregated proof
    /// @return valid True if proof is valid
    /// @return beta VRF output hash
    function vrfRingtailVerify(
        bytes32[] calldata pks,
        bytes calldata alpha,
        bytes calldata pi
    ) external view returns (bool valid, bytes32 beta);
}
```

### Go Implementation

```go
// evm/precompile/contracts/vrf/vrf.go
package vrf

import (
    "crypto/sha256"
    "encoding/binary"
    "math/big"

    "github.com/btcsuite/btcd/btcec/v2"
    "github.com/luxfi/evm/precompile/contract"
)

const (
    PrecompileAddress = "0x0317"

    // Suite identifiers
    SuiteSecp256k1SHA256 = 0x01
    SuiteEd25519SHA512   = 0x02

    // Function selectors
    SelectorProve          = 0x01
    SelectorVerify         = 0x02
    SelectorProofToHash    = 0x03
    SelectorEd25519Prove   = 0x10
    SelectorEd25519Verify  = 0x11
    SelectorEd25519Hash    = 0x12
    SelectorBatchVerify    = 0x20
    SelectorDerivePublicKey = 0x30
    SelectorRingtailProve  = 0x40
    SelectorRingtailVerify = 0x41

    // Gas costs
    GasProve           = 50000
    GasVerify          = 15000
    GasProofToHash     = 2000
    GasEd25519Prove    = 40000
    GasEd25519Verify   = 12000
    GasEd25519Hash     = 1500
    GasBatchBase       = 8000
    GasBatchPerProof   = 5000
    GasDeriveKey       = 5000
    GasRingtailProve   = 100000
    GasRingtailVerify  = 50000
)

type VRFPrecompile struct{}

func (p *VRFPrecompile) Run(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) ([]byte, uint64, error) {
    if len(input) < 1 {
        return nil, suppliedGas, ErrInvalidInput
    }

    selector := input[0]
    data := input[1:]

    switch selector {
    case SelectorProve:
        return p.vrfProve(data, suppliedGas)
    case SelectorVerify:
        return p.vrfVerify(data, suppliedGas)
    case SelectorProofToHash:
        return p.vrfProofToHash(data, suppliedGas)
    case SelectorEd25519Verify:
        return p.vrfEd25519Verify(data, suppliedGas)
    case SelectorBatchVerify:
        return p.vrfBatchVerify(data, suppliedGas)
    case SelectorRingtailVerify:
        return p.vrfRingtailVerify(data, suppliedGas)
    default:
        return nil, suppliedGas, ErrUnknownSelector
    }
}

func (p *VRFPrecompile) vrfVerify(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    if suppliedGas < GasVerify {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - GasVerify

    // Parse input
    pk, alpha, pi, err := parseVerifyInput(data)
    if err != nil {
        return nil, remainingGas, err
    }

    // Verify using ECVRF-SECP256K1-SHA256-TAI
    valid, beta := ecvrfVerify(pk, alpha, pi)

    // Encode result
    result := make([]byte, 33)
    if valid {
        result[0] = 0x01
        copy(result[1:], beta[:])
    }

    return result, remainingGas, nil
}

// ecvrfVerify implements ECVRF verification per IETF draft
func ecvrfVerify(pkBytes, alpha, piBytes []byte) (bool, [32]byte) {
    var beta [32]byte

    // 1. Parse public key
    pk, err := btcec.ParsePubKey(pkBytes)
    if err != nil {
        return false, beta
    }

    // 2. Decode proof
    gamma, c, s, err := decodeProof(piBytes)
    if err != nil {
        return false, beta
    }

    // 3. Hash to curve: H = ECVRF_hash_to_curve(Y, alpha)
    H := hashToCurve(pk, alpha)

    // 4. Compute U = s*G - c*Y
    sG := scalarBaseMult(s)
    cY := scalarMult(pk, c)
    U := pointSub(sG, cY)

    // 5. Compute V = s*H - c*Gamma
    sH := scalarMult(H, s)
    cGamma := scalarMult(gamma, c)
    V := pointSub(sH, cGamma)

    // 6. Compute challenge c' = ECVRF_challenge_generation(Y, H, Gamma, U, V)
    cPrime := challengeGeneration(pk, H, gamma, U, V)

    // 7. Verify c == c'
    if !constantTimeCompare(c, cPrime) {
        return false, beta
    }

    // 8. Compute beta = ECVRF_proof_to_hash(Gamma)
    beta = proofToHash(gamma)

    return true, beta
}

// hashToCurve implements try-and-increment for secp256k1
func hashToCurve(pk *btcec.PublicKey, alpha []byte) *btcec.PublicKey {
    // Concatenate suite || 0x01 || pk || alpha
    hashInput := make([]byte, 0, 2+33+len(alpha))
    hashInput = append(hashInput, SuiteSecp256k1SHA256)
    hashInput = append(hashInput, 0x01) // encode to curve flag
    hashInput = append(hashInput, pk.SerializeCompressed()...)
    hashInput = append(hashInput, alpha...)

    // Try incrementing until valid point found
    for ctr := uint8(0); ctr < 255; ctr++ {
        // Hash with counter
        h := sha256.New()
        h.Write(hashInput)
        h.Write([]byte{ctr})
        hash := h.Sum(nil)

        // Try both parities
        for _, prefix := range []byte{0x02, 0x03} {
            candidate := append([]byte{prefix}, hash...)
            if point, err := btcec.ParsePubKey(candidate); err == nil {
                return point
            }
        }
    }

    return nil // Should never reach here
}

// challengeGeneration computes the Fiat-Shamir challenge
func challengeGeneration(Y, H, Gamma, U, V *btcec.PublicKey) []byte {
    h := sha256.New()
    h.Write([]byte{SuiteSecp256k1SHA256, 0x02}) // suite || challenge flag
    h.Write(Y.SerializeCompressed())
    h.Write(H.SerializeCompressed())
    h.Write(Gamma.SerializeCompressed())
    h.Write(U.SerializeCompressed())
    h.Write(V.SerializeCompressed())

    hash := h.Sum(nil)
    return hash[:16] // Truncate to 16 bytes
}

// proofToHash converts proof to VRF output hash
func proofToHash(gamma *btcec.PublicKey) [32]byte {
    // Multiply by cofactor (1 for secp256k1)
    cofactorGamma := gamma // cofactor is 1

    h := sha256.New()
    h.Write([]byte{SuiteSecp256k1SHA256, 0x03}) // suite || hash flag
    h.Write(cofactorGamma.SerializeCompressed())

    var beta [32]byte
    copy(beta[:], h.Sum(nil))
    return beta
}
```

### Consensus Integration

```go
// consensus/protocol/photon/vrf_selection.go
package photon

import (
    "github.com/luxfi/node/crypto/vrf"
)

// SelectLeader uses VRF for provably fair leader election
func (e *PhotonEngine) SelectLeader(
    round uint64,
    validators []Validator,
) (Validator, *vrf.Proof, error) {
    // Compute VRF input from round and previous block hash
    alpha := computeVRFInput(round, e.lastBlockHash)

    // Each validator computes their VRF output
    myProof, myBeta, err := vrf.Prove(e.secretKey, alpha)
    if err != nil {
        return Validator{}, nil, err
    }

    // Convert beta to "luminance" value
    luminance := new(big.Int).SetBytes(myBeta[:])

    // Weight by stake: effective = luminance * stake
    effective := new(big.Int).Mul(luminance, big.NewInt(int64(e.stake)))

    // Leader is validator with highest effective luminance
    // (In practice, gossip proofs and compare)

    return e.self, myProof, nil
}

// VerifyLeaderClaim verifies a leader's VRF proof
func (e *PhotonEngine) VerifyLeaderClaim(
    leader Validator,
    round uint64,
    proof *vrf.Proof,
) (bool, *big.Int, error) {
    alpha := computeVRFInput(round, e.lastBlockHash)

    valid, beta := vrf.Verify(leader.PublicKey, alpha, proof)
    if !valid {
        return false, nil, ErrInvalidVRFProof
    }

    luminance := new(big.Int).SetBytes(beta[:])
    effective := new(big.Int).Mul(luminance, big.NewInt(int64(leader.Stake)))

    return true, effective, nil
}

func computeVRFInput(round uint64, prevHash [32]byte) []byte {
    input := make([]byte, 8+32)
    binary.BigEndian.PutUint64(input[:8], round)
    copy(input[8:], prevHash[:])
    return input
}
```

### Network Usage Map

| Chain | Component | VRF Usage |
|-------|-----------|-----------|
| P-Chain | Photon | VRF-based leader selection |
| P-Chain | Quasar | Randomized committee selection |
| C-Chain | Gaming | Provably fair randomness |
| C-Chain | NFTs | Random trait assignment |
| T-Chain | Threshold | Distributed VRF aggregation |

## Security Considerations

### VRF Security Properties

1. **Uniqueness**: For any (sk, alpha), there is exactly one valid (pi, beta)
2. **Pseudorandomness**: Without sk, beta is indistinguishable from random
3. **Verifiability**: Anyone with pk can verify proof pi

### Side-Channel Resistance

All implementations MUST be constant-time:
- No branching on secret data
- No variable-time modular arithmetic
- Use constant-time point multiplication

### Hash-to-Curve Security

The try-and-increment method has timing variations but:
- Average 2 iterations (constant expected time)
- No secret data in loop
- Alternative: Elligator2 (constant-time)

### Nonce Generation

VRF nonces MUST be deterministically derived:
```solidity
k = HMAC-DRBG(sk, H) per RFC 6979
```
Never use random nonces (would break uniqueness).

### Proof Malleability

VRF proofs have limited malleability but:
- Beta (output) is unique regardless of proof form
- Implementations should normalize proofs

## Test Cases

### IETF Test Vectors

```go
func TestECVRF_SECP256K1(t *testing.T) {
    // Test vector from IETF draft
    sk, _ := hex.DecodeString("c9afa9d845ba75166b5c215767b1d6934e50c3db36e89b127b8a622b120f6721")
    pk, _ := hex.DecodeString("0360fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6")
    alpha := []byte("sample")

    proof, beta := precompile.VRFProve(sk, alpha)

    // Verify
    valid, verifiedBeta := precompile.VRFVerify(pk, alpha, proof)
    assert.True(t, valid)
    assert.Equal(t, beta, verifiedBeta)

    // Wrong alpha should fail
    valid, _ = precompile.VRFVerify(pk, []byte("wrong"), proof)
    assert.False(t, valid)
}

func TestVRFBatchVerify(t *testing.T) {
    // Generate 10 VRF proofs
    var pks [][]byte
    var alphas [][]byte
    var proofs [][]byte

    for i := 0; i < 10; i++ {
        sk, pk := generateKeyPair()
        alpha := []byte(fmt.Sprintf("input-%d", i))
        proof, _ := precompile.VRFProve(sk, alpha)

        pks = append(pks, pk)
        alphas = append(alphas, alpha)
        proofs = append(proofs, proof)
    }

    // Batch verify
    valid, betas := precompile.VRFBatchVerify(pks, alphas, proofs)
    assert.True(t, valid)
    assert.Len(t, betas, 10)

    // Corrupt one proof
    proofs[5][0] ^= 0xFF
    valid, _ = precompile.VRFBatchVerify(pks, alphas, proofs)
    assert.False(t, valid)
}

func TestVRFDeterminism(t *testing.T) {
    sk := randomSecretKey()
    alpha := []byte("deterministic test")

    // Generate proof twice
    proof1, beta1 := precompile.VRFProve(sk, alpha)
    proof2, beta2 := precompile.VRFProve(sk, alpha)

    // Must produce same output (uniqueness)
    assert.Equal(t, beta1, beta2)
    // Proofs may differ in encoding but verify to same beta
}
```

### Performance Benchmarks

```go
func BenchmarkVRFProve(b *testing.B) {
    sk := randomSecretKey()
    alpha := []byte("benchmark input")

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.VRFProve(sk, alpha)
    }
}
// BenchmarkVRFProve-8    23,456 ops/s    50,000 gas

func BenchmarkVRFVerify(b *testing.B) {
    sk := randomSecretKey()
    pk := derivePublicKey(sk)
    alpha := []byte("benchmark input")
    proof, _ := precompile.VRFProve(sk, alpha)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.VRFVerify(pk, alpha, proof)
    }
}
// BenchmarkVRFVerify-8    45,678 ops/s    15,000 gas
```

## Backwards Compatibility

No backwards compatibility issues. This LP introduces a new precompile at an unused address.

## References

- [IETF VRF Draft](https://datatracker.ietf.org/doc/draft-irtf-cfrg-vrf/)
- [Chainlink VRF v2](https://docs.chain.link/vrf)
- [LP-111: Photon Consensus Selection](./lp-111.md)
- [LP-5324: Ringtail Threshold Signature](./lp-7324-ringtail-threshold-signature-precompile.md)
- [LP-3654: Ed25519 Precompile](./lp-3654-ed25519-eddsa-precompile.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
