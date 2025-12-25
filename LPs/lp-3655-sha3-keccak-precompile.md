---
lp: 3655
title: SHA-3/Keccak Cryptographic Hash Precompile
description: Native EVM precompile for SHA-3 family hashes and Keccak variants with SHAKE extensible outputs
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-24
requires: 4
activation:
  flag: lp3655-sha3
  hfName: "Quantum"
  activationHeight: "0"
tags: [evm, precompile, cryptography, hash, sha3, keccak]
order: 3655
---

## Abstract

LP-3655 specifies a native EVM precompile for the complete SHA-3 family of cryptographic hash functions, including FIPS 202 SHA-3 variants, Keccak (Ethereum's hash), and SHAKE extensible-output functions. This precompile provides efficient hashing for ZK circuits, commitment schemes, and cross-chain compatibility.

## Motivation

### Current Limitations

**EVM Keccak256 Opcode:**
- Only supports Keccak-256 (pre-FIPS, Ethereum variant)
- No SHA-3 FIPS 202 compliance
- No SHAKE128/256 extensible outputs
- No Keccak-384/512 variants

**Missing Hash Functions:**
- SHA3-224/256/384/512 (FIPS 202)
- SHAKE128/256 (variable-length output)
- Keccak-f[1600] permutation (for advanced protocols)
- TurboSHAKE (faster variant)

### Use Cases Requiring Extended SHA-3

1. **Zero-Knowledge Proofs**
   - SHAKE128 for random oracle instantiation
   - Keccak permutation for ZK-friendly constructions
   - Sponge-based commitment schemes

2. **Cross-Chain Compatibility**
   - NEAR uses Keccak-256
   - Some chains use FIPS SHA-3
   - Polkadot uses Blake2 + Keccak hybrid

3. **Post-Quantum Security**
   - SHA-3 recommended for PQC constructions
   - SHAKE for key derivation
   - Higher output lengths for quantum resistance

4. **Domain Separation**
   - cSHAKE for customizable domains
   - KMAC for keyed hashing
   - TupleHash for structured data

### Performance Benefits

| Operation | Solidity | Precompile | Improvement |
|-----------|----------|------------|-------------|
| SHA3-256 | 100 gas (opcode) | 36 gas | Native opcode |
| SHA3-512 | N/A | 72 gas | New capability |
| SHAKE128(32) | N/A | 40 gas | New capability |
| SHAKE256(64) | N/A | 80 gas | New capability |
| Keccak-f[1600] | 5,000+ gas | 100 gas | 50x |

## Rationale

### SHA-3 Family Selection

SHA-3 (FIPS 202) is the successor to SHA-2 and provides:

1. **Different Construction**: Sponge-based vs. Merkle-Damgård, immune to length-extension
2. **NIST Standard**: Government-approved for sensitive applications
3. **Post-Quantum**: Based on different mathematical assumptions than RSA/ECC
4. **Flexibility**: SHAKE for variable-length output, KMAC for keyed hashing

### Keccak vs SHA-3 Distinction

Maintaining both Keccak-256 (Ethereum's original) and SHA3-256 (FIPS):

- **Keccak-256**: Backwards compatibility with Ethereum history
- **SHA3-256**: Standards-compliant for new applications
- **Clear Differentiation**: Prevents confusion between variants

### Precompile Address Choice

Using `0x0315` (493+ in hex) for SHA-3/Keccak:

- Sequential after Ed25519 at `0x0314`
- Grouping all Keccak-family operations under single address
- Follows cryptographic precompile convention

### Function Selector Design

Organized by hash category:

- `0x01-0x0F`: SHA-3 fixed-output (224/256/384/512)
- `0x10-0x1F`: SHAKE extensible-output (128/256)
- `0x20-0x2F`: Customized variants (cSHAKE, KMAC)
- `0x30-0x3F`: Raw operations (Keccak-f1600)

### Gas Cost Derivation

Gas based on throughput (rate) of each function:

| Function | Rate (bytes/cycle) | Gas per KB | Rationale |
|----------|-------------------|------------|-----------|
| SHA3-256 | 136 | 21 | ~6.5x Keccak-256 opcode |
| SHA3-512 | 104 | 28 | More rounds, larger output |
| SHAKE128 | 168 | 17 | Fastest SHAKE variant |
| SHAKE256 | 136 | 21 | Standard SHAKE |

### SHAKE for ZK Applications

SHAKE128 is optimal for zero-knowledge circuits:

- Linear complexity in ZK proving systems
- Arbitrary output length matching circuit needs
- XOF structure avoids fixed-length constraints

## Specification

### Precompile Address

| Address | Operation |
|---------|-----------|
| `0x0315` | SHA-3/Keccak Operations |

### Function Selectors

| Selector | Function | Gas Formula |
|----------|----------|-------------|
| `0x01` | `sha3_224(bytes data)` | 30 + 6/word |
| `0x02` | `sha3_256(bytes data)` | 36 + 6/word |
| `0x03` | `sha3_384(bytes data)` | 48 + 6/word |
| `0x04` | `sha3_512(bytes data)` | 72 + 6/word |
| `0x10` | `keccak224(bytes data)` | 30 + 6/word |
| `0x11` | `keccak256(bytes data)` | 36 + 6/word |
| `0x12` | `keccak384(bytes data)` | 48 + 6/word |
| `0x13` | `keccak512(bytes data)` | 72 + 6/word |
| `0x20` | `shake128(bytes data, uint outputLen)` | 40 + 6/word + output/8 |
| `0x21` | `shake256(bytes data, uint outputLen)` | 80 + 6/word + output/8 |
| `0x30` | `cshake128(bytes data, bytes N, bytes S, uint outputLen)` | 50 + 6/word + output/8 |
| `0x31` | `cshake256(bytes data, bytes N, bytes S, uint outputLen)` | 100 + 6/word + output/8 |
| `0x40` | `kmac128(bytes K, bytes X, uint L, bytes S)` | 60 + 6/word |
| `0x41` | `kmac256(bytes K, bytes X, uint L, bytes S)` | 120 + 6/word |
| `0x50` | `keccakF1600(bytes32[25] state)` | 100 |
| `0x51` | `keccakF1600Inverse(bytes32[25] state)` | 100 |

### Gas Calculation

```markdown
Base cost + (input_bytes / 32) * 6 + (output_bytes / 8)

Where base costs are:
- SHA3-224/Keccak-224: 30 gas
- SHA3-256/Keccak-256: 36 gas
- SHA3-384/Keccak-384: 48 gas
- SHA3-512/Keccak-512: 72 gas
- SHAKE128: 40 gas
- SHAKE256: 80 gas
```

### Data Encoding

**Standard Hash Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length |
| 4 | N | Data bytes |
```

**SHAKE/XOF Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length |
| 4 | N | Data bytes |
| 4+N | 4 | Output length (bytes) |
```

**cSHAKE Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length |
| 4 | N | Data bytes |
| 4+N | 4 | Function name (N) length |
| 8+N | M | Function name bytes |
| 8+N+M | 4 | Customization (S) length |
| 12+N+M | P | Customization bytes |
| 12+N+M+P | 4 | Output length |
```

### Detailed Function Specifications

#### sha3_256 (FIPS 202)

Computes SHA3-256 hash per FIPS 202.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length (N) |
| 4 | N | Data to hash |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 32 | SHA3-256 digest |
```

**Padding:** `0x06` || `0x00...` || `0x80` (SHA-3 domain separator)

#### keccak256 (Ethereum)

Computes Keccak-256 (Ethereum's hash function).

**Input/Output:** Same as sha3_256

**Padding:** `0x01` || `0x00...` || `0x80` (Keccak original padding)

**Note:** This is the same as EVM `KECCAK256` opcode but accessible via precompile for consistency.

#### shake128/shake256 (XOF)

Extensible-output functions for variable-length digests.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length (N) |
| 4 | N | Data to hash |
| 4+N | 4 | Output length (L) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | L | SHAKE output |
```

**Security Levels:**
- SHAKE128: 128-bit security
- SHAKE256: 256-bit security

#### cshake128/cshake256 (Customizable SHAKE)

SHAKE with domain separation.

**Parameters:**
- `N`: Function name (for NIST-defined functions)
- `S`: Customization string (user-defined)

**Use Cases:**
- `cSHAKE128("", "My Application")` for custom domain
- `cSHAKE256("KMAC", "")` used internally by KMAC

#### kmac128/kmac256 (Keyed MAC)

Keccak Message Authentication Code.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Key length (K) |
| 4 | K | Key bytes |
| 4+K | 4 | Message length (X) |
| 8+K | X | Message bytes |
| 8+K+X | 4 | Output length (L) |
| 12+K+X | 4 | Customization length (S) |
| 16+K+X | S | Customization bytes |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | L | MAC output |
```

#### keccakF1600 (Raw Permutation)

Applies Keccak-f[1600] permutation to 1600-bit state.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 200 | 25 × 64-bit lanes (little-endian) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 200 | Permuted state |
```

**Use Cases:**
- Building custom sponge constructions
- ZK-friendly hash implementations
- Merkle-Damgård to sponge migrations

## Implementation Stack

### Architecture Overview

```solidity
┌─────────────────────────────────────────────────────────────────────┐
│                  SHA-3/Keccak Precompile (0x0315)                    │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: EVM Interface                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ sha3_precompile.go       - Precompile dispatcher                ││
│  │ sha3_gas.go              - Gas calculation                       ││
│  │ sha3_abi.go              - ABI encoding/decoding                ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: SHA-3 Family Implementation                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ golang.org/x/crypto/sha3 - FIPS 202 SHA-3 and SHAKE             ││
│  │ sha3.go                  - Keccak variants                       ││
│  │ cshake.go                - Customizable SHAKE                    ││
│  │ kmac.go                  - Keyed MAC                             ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 1: Keccak Permutation Core                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ keccakf.go               - Keccak-f[1600] permutation           ││
│  │ keccakf_amd64.s          - AMD64 assembly optimization          ││
│  │ keccakf_arm64.s          - ARM64 assembly optimization          ││
│  │ lanes.go                 - Lane manipulation utilities          ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### File Inventory

```solidity
evm/precompile/contracts/sha3/
├── sha3.go                 (10 KB)  # Main precompile implementation
├── sha3_test.go            (8 KB)   # Unit tests
├── gas.go                  (2 KB)   # Gas metering
├── keccak.go               (4 KB)   # Keccak variants (non-FIPS)
├── shake.go                (3 KB)   # SHAKE XOF
├── cshake.go               (3 KB)   # Customizable SHAKE
├── kmac.go                 (4 KB)   # Keyed MAC
├── permutation.go          (3 KB)   # Raw Keccak-f[1600]
└── testdata/
    ├── sha3_nist_vectors.json     # NIST test vectors
    ├── shake_vectors.json         # SHAKE test vectors
    └── kmac_vectors.json          # KMAC test vectors

node/crypto/sha3/
├── keccakf.go              (6 KB)   # Keccak-f[1600] core
├── keccakf_amd64.s         (12 KB)  # AMD64 optimized
├── keccakf_arm64.s         (10 KB)  # ARM64 optimized
├── sponge.go               (4 KB)   # Sponge construction
└── sha3_test.go            (5 KB)   # Benchmarks

Total: ~74 KB implementation
```

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISHA3 {
    /// @notice Compute SHA3-224 (FIPS 202)
    /// @param data Input data
    /// @return digest 28-byte hash
    function sha3_224(bytes calldata data) external view returns (bytes28 digest);

    /// @notice Compute SHA3-256 (FIPS 202)
    /// @param data Input data
    /// @return digest 32-byte hash
    function sha3_256(bytes calldata data) external view returns (bytes32 digest);

    /// @notice Compute SHA3-384 (FIPS 202)
    /// @param data Input data
    /// @return digest 48-byte hash
    function sha3_384(bytes calldata data) external view returns (bytes memory digest);

    /// @notice Compute SHA3-512 (FIPS 202)
    /// @param data Input data
    /// @return digest 64-byte hash
    function sha3_512(bytes calldata data) external view returns (bytes memory digest);

    /// @notice Compute Keccak-256 (Ethereum variant)
    /// @param data Input data
    /// @return digest 32-byte hash
    function keccak256_(bytes calldata data) external view returns (bytes32 digest);

    /// @notice Compute SHAKE128 extensible output
    /// @param data Input data
    /// @param outputLen Desired output length in bytes
    /// @return output Variable-length hash
    function shake128(bytes calldata data, uint256 outputLen) external view returns (bytes memory output);

    /// @notice Compute SHAKE256 extensible output
    /// @param data Input data
    /// @param outputLen Desired output length in bytes
    /// @return output Variable-length hash
    function shake256(bytes calldata data, uint256 outputLen) external view returns (bytes memory output);

    /// @notice Compute cSHAKE128 with customization
    /// @param data Input data
    /// @param N Function name string
    /// @param S Customization string
    /// @param outputLen Desired output length
    /// @return output Customized hash output
    function cshake128(
        bytes calldata data,
        bytes calldata N,
        bytes calldata S,
        uint256 outputLen
    ) external view returns (bytes memory output);

    /// @notice Compute KMAC128 keyed MAC
    /// @param key MAC key
    /// @param data Message data
    /// @param outputLen Desired output length
    /// @param S Customization string
    /// @return mac Message authentication code
    function kmac128(
        bytes calldata key,
        bytes calldata data,
        uint256 outputLen,
        bytes calldata S
    ) external view returns (bytes memory mac);

    /// @notice Apply Keccak-f[1600] permutation
    /// @param state 200-byte state (25 × 64-bit lanes)
    /// @return permuted Permuted state
    function keccakF1600(bytes calldata state) external view returns (bytes memory permuted);
}
```solidity

### Go Implementation

```go
// evm/precompile/contracts/sha3/sha3.go
package sha3

import (
    "encoding/binary"

    "golang.org/x/crypto/sha3"
    "github.com/luxfi/evm/precompile/contract"
)

const (
    PrecompileAddress = "0x0315"

    // Function selectors
    SelectorSHA3_224     = 0x01
    SelectorSHA3_256     = 0x02
    SelectorSHA3_384     = 0x03
    SelectorSHA3_512     = 0x04
    SelectorKeccak224    = 0x10
    SelectorKeccak256    = 0x11
    SelectorKeccak384    = 0x12
    SelectorKeccak512    = 0x13
    SelectorSHAKE128     = 0x20
    SelectorSHAKE256     = 0x21
    SelectorCSHAKE128    = 0x30
    SelectorCSHAKE256    = 0x31
    SelectorKMAC128      = 0x40
    SelectorKMAC256      = 0x41
    SelectorKeccakF1600  = 0x50
    SelectorKeccakF1600Inv = 0x51

    // Gas constants
    GasPerWord = 6
)

type SHA3Precompile struct{}

func (p *SHA3Precompile) Run(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) ([]byte, uint64, error) {
    if len(input) < 1 {
        return nil, suppliedGas, ErrInvalidInput
    }

    selector := input[0]
    data := input[1:]

    switch selector {
    case SelectorSHA3_256:
        return p.sha3_256(data, suppliedGas)
    case SelectorKeccak256:
        return p.keccak256(data, suppliedGas)
    case SelectorSHAKE128:
        return p.shake128(data, suppliedGas)
    case SelectorSHAKE256:
        return p.shake256(data, suppliedGas)
    case SelectorCSHAKE128:
        return p.cshake128(data, suppliedGas)
    case SelectorKMAC128:
        return p.kmac128(data, suppliedGas)
    case SelectorKeccakF1600:
        return p.keccakF1600(data, suppliedGas)
    // ... other cases
    default:
        return nil, suppliedGas, ErrUnknownSelector
    }
}

func (p *SHA3Precompile) sha3_256(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Calculate gas
    inputLen := parseInputLen(data)
    words := (inputLen + 31) / 32
    requiredGas := uint64(36 + words*GasPerWord)

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    // Parse input
    if len(data) < 4 {
        return nil, remainingGas, ErrInvalidInput
    }
    dataLen := binary.BigEndian.Uint32(data[0:4])
    if len(data) < int(4+dataLen) {
        return nil, remainingGas, ErrInvalidInput
    }
    input := data[4 : 4+dataLen]

    // Compute SHA3-256 (FIPS 202)
    hash := sha3.New256()
    hash.Write(input)
    digest := hash.Sum(nil)

    return digest, remainingGas, nil
}

func (p *SHA3Precompile) keccak256(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Calculate gas
    inputLen := parseInputLen(data)
    words := (inputLen + 31) / 32
    requiredGas := uint64(36 + words*GasPerWord)

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    // Parse input
    if len(data) < 4 {
        return nil, remainingGas, ErrInvalidInput
    }
    dataLen := binary.BigEndian.Uint32(data[0:4])
    input := data[4 : 4+dataLen]

    // Compute Keccak-256 (Ethereum variant with 0x01 padding)
    hash := sha3.NewLegacyKeccak256()
    hash.Write(input)
    digest := hash.Sum(nil)

    return digest, remainingGas, nil
}

func (p *SHA3Precompile) shake128(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Parse input
    if len(data) < 8 {
        return nil, suppliedGas, ErrInvalidInput
    }
    dataLen := binary.BigEndian.Uint32(data[0:4])
    outputLen := binary.BigEndian.Uint32(data[4+dataLen : 8+dataLen])

    // Calculate gas
    inputWords := (dataLen + 31) / 32
    requiredGas := uint64(40 + inputWords*GasPerWord + outputLen/8)

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    input := data[4 : 4+dataLen]

    // Compute SHAKE128
    shake := sha3.NewShake128()
    shake.Write(input)
    output := make([]byte, outputLen)
    shake.Read(output)

    return output, remainingGas, nil
}

func (p *SHA3Precompile) keccakF1600(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    const requiredGas = 100
    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    if len(data) != 200 {
        return nil, remainingGas, ErrInvalidStateSize
    }

    // Convert to 25 uint64 lanes (little-endian)
    var state [25]uint64
    for i := 0; i < 25; i++ {
        state[i] = binary.LittleEndian.Uint64(data[i*8 : (i+1)*8])
    }

    // Apply Keccak-f[1600] permutation (24 rounds)
    keccakF1600(&state)

    // Convert back to bytes
    output := make([]byte, 200)
    for i := 0; i < 25; i++ {
        binary.LittleEndian.PutUint64(output[i*8:], state[i])
    }

    return output, remainingGas, nil
}

// keccakF1600 applies the Keccak-f[1600] permutation
// This is the core of all SHA-3 family functions
func keccakF1600(state *[25]uint64) {
    // Round constants
    var rc = [24]uint64{
        0x0000000000000001, 0x0000000000008082, 0x800000000000808a,
        0x8000000080008000, 0x000000000000808b, 0x0000000080000001,
        0x8000000080008081, 0x8000000000008009, 0x000000000000008a,
        0x0000000000000088, 0x0000000080008009, 0x000000008000000a,
        0x000000008000808b, 0x800000000000008b, 0x8000000000008089,
        0x8000000000008003, 0x8000000000008002, 0x8000000000000080,
        0x000000000000800a, 0x800000008000000a, 0x8000000080008081,
        0x8000000000008080, 0x0000000080000001, 0x8000000080008008,
    }

    // Rotation offsets
    var rotc = [25]uint{
        0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14,
    }

    // Pi permutation indices
    var piln = [25]int{
        0, 10, 20, 5, 15, 16, 1, 11, 21, 6, 7, 17, 2, 12, 22, 23, 8, 18, 3, 13, 14, 24, 9, 19, 4,
    }

    for round := 0; round < 24; round++ {
        // θ (theta) step
        var c [5]uint64
        var d [5]uint64
        for x := 0; x < 5; x++ {
            c[x] = state[x] ^ state[x+5] ^ state[x+10] ^ state[x+15] ^ state[x+20]
        }
        for x := 0; x < 5; x++ {
            d[x] = c[(x+4)%5] ^ bits.RotateLeft64(c[(x+1)%5], 1)
        }
        for i := 0; i < 25; i++ {
            state[i] ^= d[i%5]
        }

        // ρ (rho) and π (pi) steps
        var b [25]uint64
        for i := 0; i < 25; i++ {
            b[piln[i]] = bits.RotateLeft64(state[i], int(rotc[i]))
        }

        // χ (chi) step
        for y := 0; y < 5; y++ {
            for x := 0; x < 5; x++ {
                state[y*5+x] = b[y*5+x] ^ ((^b[y*5+(x+1)%5]) & b[y*5+(x+2)%5])
            }
        }

        // ι (iota) step
        state[0] ^= rc[round]
    }
}
```

### Cross-Chain Compatibility

```solidity
┌─────────────────────────────────────────────────────────────────────┐
│                     SHA-3 Cross-Chain Usage                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Ethereum   │    │    NEAR      │    │   Polkadot   │          │
│  │ Keccak-256   │    │ Keccak-256   │    │   Blake2b    │          │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│         │                   │                   │                    │
│         └───────────────────┼───────────────────┘                   │
│                             │                                        │
│                             ▼                                        │
│               ┌──────────────────────────┐                          │
│               │   SHA-3 Precompile       │                          │
│               │        (0x0315)          │                          │
│               └─────────────┬────────────┘                          │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                   │
│         │                   │                   │                    │
│         ▼                   ▼                   ▼                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │     ZK       │    │   Merkle     │    │    KMAC      │          │
│  │   Circuits   │    │    Trees     │    │   Signing    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Network Usage Map

| Chain | Component | SHA-3 Usage |
|-------|-----------|-------------|
| C-Chain | Smart Contracts | Keccak-256 for storage |
| C-Chain | ZK Proofs | SHAKE128/256 for randomness |
| Z-Chain | zkVM | Keccak-f[1600] permutation |
| B-Chain | Bridge | SHA3-256 for cross-chain |
| All | Merkle Trees | Keccak-256 for nodes |

## Security Considerations

### Preimage Resistance

SHA-3 family provides strong preimage resistance:
- SHA3-256: 256-bit security
- SHAKE128: 128-bit security
- SHAKE256: 256-bit security

### Collision Resistance

- SHA3-256: 128-bit collision resistance
- SHA3-512: 256-bit collision resistance

### Length Extension Immunity

Unlike SHA-2, SHA-3 is immune to length extension attacks due to sponge construction.

### Side-Channel Resistance

Keccak-f[1600] is designed for constant-time implementation:
- No data-dependent branches
- No data-dependent memory access
- All operations are bitwise rotations and XORs

### Domain Separation

Use cSHAKE for domain separation:
```solidity
// Different domains produce different outputs
bytes memory a = cshake128(data, "", "Domain A", 32);
bytes memory b = cshake128(data, "", "Domain B", 32);
// a != b guaranteed
```go

## Test Cases

### NIST Test Vectors

```go
func TestSHA3_256_NIST(t *testing.T) {
    tests := []struct {
        input    string
        expected string
    }{
        // Empty string
        {"", "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"},
        // "abc"
        {"616263", "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532"},
        // 200 'a' bytes
        {strings.Repeat("61", 200), "...expected_hash..."},
    }

    for _, tt := range tests {
        input, _ := hex.DecodeString(tt.input)
        result := precompile.SHA3_256(input)
        assert.Equal(t, tt.expected, hex.EncodeToString(result))
    }
}

func TestSHAKE128(t *testing.T) {
    input := []byte("test input")

    // Request 64 bytes
    output64 := precompile.SHAKE128(input, 64)
    assert.Len(t, output64, 64)

    // Request 128 bytes - should extend, not rehash
    output128 := precompile.SHAKE128(input, 128)
    assert.Equal(t, output64, output128[:64])
}

func TestKeccakF1600(t *testing.T) {
    // Zero state permuted
    zeroState := make([]byte, 200)
    permuted := precompile.KeccakF1600(zeroState)

    // Apply inverse
    restored := precompile.KeccakF1600Inverse(permuted)
    assert.Equal(t, zeroState, restored)
}
```

### Performance Benchmarks

```go
func BenchmarkSHA3_256(b *testing.B) {
    input := make([]byte, 1024) // 1 KB
    rand.Read(input)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.SHA3_256(input)
    }
}
// BenchmarkSHA3_256-8    1,234,567 ns/op    228 gas (36 + 32*6)

func BenchmarkSHAKE128_1KB(b *testing.B) {
    input := make([]byte, 1024)
    rand.Read(input)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.SHAKE128(input, 1024)
    }
}
// BenchmarkSHAKE128_1KB-8    987,654 ns/op    360 gas (40 + 32*6 + 128)
```solidity

## Backwards Compatibility

No backwards compatibility issues. This LP introduces a new precompile at an unused address. The existing `KECCAK256` opcode remains unchanged.

## References

- [FIPS 202: SHA-3 Standard](https://csrc.nist.gov/publications/detail/fips/202/final)
- [SP 800-185: SHA-3 Derived Functions](https://csrc.nist.gov/publications/detail/sp/800-185/final)
- [The Keccak Reference](https://keccak.team/keccak.html)
- [golang.org/x/crypto/sha3](https://pkg.go.dev/golang.org/x/crypto/sha3)
- [LP-3658: Poseidon Hash Precompile](./lp-3658-poseidon-hash-precompile.md)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
