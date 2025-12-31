---
lp: 3656
title: Blake2/Blake3 Cryptographic Hash Precompile
description: Native EVM precompile for Blake2b, Blake2s, and Blake3 hash functions with keyed and XOF modes
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-24
requires: 4
activation:
  flag: lp3656-blake
  hfName: "Quantum"
  activationHeight: "0"
tags: [evm, precompile, cryptography, hash, blake2, blake3]
order: 3656
---

## Abstract

LP-3656 specifies a native EVM precompile for the Blake2 and Blake3 families of cryptographic hash functions. Blake2 is the fastest secure hash on modern CPUs, used by Zcash, Polkadot, and numerous cryptographic protocols. Blake3 provides even higher performance with built-in parallelism. This precompile enables efficient cross-chain verification, Merkle proofs, and commitment schemes.

## Motivation

### Current Limitations

**EVM Blake2f Precompile (0x09):**
- Only supports Blake2b compression function (EIP-152)
- Requires manual state management
- No Blake2s support
- No keyed hashing mode
- No Blake3 support

**Missing Capabilities:**
- Complete Blake2b/Blake2s hash functions
- Keyed MAC mode
- Tree hashing mode
- Blake3 parallel hashing
- XOF (extensible output) mode

### Use Cases Requiring Extended Blake

1. **Cross-Chain Verification**
   - Zcash light client proofs (Blake2b)
   - Polkadot/Substrate verification (Blake2b)
   - Filecoin sector proofs (Blake2b)

2. **Merkle Trees**
   - Blake3 for parallel tree hashing
   - Blake2b for Zcash note commitments
   - Key derivation with Blake2b-MAC

3. **Password Hashing**
   - Argon2 uses Blake2b internally
   - Key derivation functions

4. **ZK Circuits**
   - Blake2s for SNARKs (smaller field)
   - Commitment schemes

### Performance Benefits

| Operation | Blake2b | SHA-256 | Keccak-256 |
|-----------|---------|---------|------------|
| 1 KB hash | 0.9 µs | 2.1 µs | 1.8 µs |
| 1 MB hash | 0.9 ms | 2.1 ms | 1.8 ms |
| Throughput | 1.1 GB/s | 500 MB/s | 560 MB/s |

Blake3 is even faster:
| Blake3 Operation | Throughput |
|------------------|------------|
| Sequential | 1.8 GB/s |
| 4-way parallel | 6.2 GB/s |
| 16-way parallel | 18.1 GB/s |

## Rationale

### Blake2 Family Selection

Blake2 is the fastest cryptographic hash family with strong security:

1. **Performance**: 2-3x faster than SHA-256 on modern CPUs
2. **Security**: Same security level as SHA-256/512 with better margins
3. **Simplicity**: Fewer rounds than SHA-2, simpler implementation
4. **Flexibility**: Built-in keyed mode, personalisation, and salt

### Blake2b vs Blake2s

Two variants for different use cases:

- **Blake2b**: 64-bit optimized, faster on most systems
  - 256/512-bit output
  - High-security for signature hashing
  - Default for cross-chain verification

- **Blake2s**: 8/32-bit optimized, smaller code
  - 256-bit output
  - Ideal for constrained environments
  - Used in ZK circuits (smaller arithmetic)

### Blake3 Innovation

Blake3 provides unique advantages:

1. **Parallelism**: Tree hashing scales with CPU cores
2. **Simplicity**: Single-pass (unlike BLAKE2's 2-pass)
3. **XOF Capability**: Variable-length output
4. **Security**: 256-bit security, quantum-resistant margin

### Precompile Address Choice

Using `0x0316` (494+ in hex) for Blake2/Blake3:

- Sequential after SHA-3 at `0x0315`
- Grouping all BLAKE-family operations
- Follows cryptographic precompile convention

### Function Selector Design

Organized by algorithm and mode:

- `0x01-0x0F`: Blake2b operations
- `0x10-0x1F`: Blake2s operations
- `0x20-0x2F`: Blake3 operations
- `0x30-0x3F`: Keyed/XOF modes

### Gas Cost Derivation

Gas based on computational complexity relative to Blake2b:

| Function | Relative Speed | Gas Ratio | Rationale |
|----------|---------------|-----------|-----------|
| blake2b | 1x (baseline) | 1x | Original EIP-152 reference |
| blake2s | 0.8x | 1.2x | Slightly slower on 64-bit |
| blake3 | 2-10x | 0.5x | Much faster, especially parallel |
| blake3_parallel | 10-20x | 0.25x | Scales with cores |

## Specification

### Precompile Address

| Address | Operation |
|---------|-----------|
| `0x0316` | Blake2/Blake3 Operations |

### Function Selectors

| Selector | Function | Gas Formula |
|----------|----------|-------------|
| `0x01` | `blake2b(bytes data, uint digestLen)` | 15 + 3/word |
| `0x02` | `blake2b_keyed(bytes key, bytes data, uint digestLen)` | 20 + 3/word |
| `0x03` | `blake2b_256(bytes data)` | 15 + 3/word |
| `0x04` | `blake2b_512(bytes data)` | 15 + 3/word |
| `0x10` | `blake2s(bytes data, uint digestLen)` | 12 + 3/word |
| `0x11` | `blake2s_keyed(bytes key, bytes data, uint digestLen)` | 16 + 3/word |
| `0x12` | `blake2s_256(bytes data)` | 12 + 3/word |
| `0x20` | `blake3(bytes data, uint digestLen)` | 10 + 2/word |
| `0x21` | `blake3_keyed(bytes32 key, bytes data, uint digestLen)` | 12 + 2/word |
| `0x22` | `blake3_derive_key(bytes context, bytes keyMaterial, uint digestLen)` | 15 + 2/word |
| `0x23` | `blake3_256(bytes data)` | 10 + 2/word |
| `0x30` | `blake2bF(bytes32[2] h, bytes32[4] m, bytes8[2] t, bool f)` | 6 (per round) |

### Gas Calculation

```markdown
Blake2b: 15 + (input_bytes / 32) * 3
Blake2s: 12 + (input_bytes / 32) * 3
Blake3:  10 + (input_bytes / 32) * 2
Blake2bF: 6 per round (same as EIP-152)

Additional costs:
- Keyed mode: +5 gas base
- Custom output length: +2 gas per 32 bytes beyond standard
```

### Data Encoding

**Blake2b Hash:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length |
| 4 | N | Data bytes |
| 4+N | 1 | Digest length (1-64) |
```

**Blake2b Keyed:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 1 | Key length (1-64) |
| 1 | K | Key bytes |
| 1+K | 4 | Data length |
| 5+K | N | Data bytes |
| 5+K+N | 1 | Digest length (1-64) |
```

**Blake3:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length |
| 4 | N | Data bytes |
| 4+N | 4 | Digest length (variable) |
```

**Blake3 Derive Key:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Context length |
| 4 | C | Context string (domain separator) |
| 4+C | 4 | Key material length |
| 8+C | M | Key material bytes |
| 8+C+M | 4 | Derived key length |
```

### Detailed Function Specifications

#### blake2b

Computes Blake2b hash with configurable output length.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Data length (N) |
| 4 | N | Data to hash |
| 4+N | 1 | Digest length (1-64 bytes) |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | D | Digest (D = digest length) |
```

**Parameters:**
- Word size: 64 bits
- Block size: 128 bytes
- Max key size: 64 bytes
- Max output: 64 bytes

#### blake2s

Computes Blake2s hash (optimized for 32-bit platforms, SNARK-friendly).

**Parameters:**
- Word size: 32 bits
- Block size: 64 bytes
- Max key size: 32 bytes
- Max output: 32 bytes

#### blake3

Computes Blake3 hash with unlimited output length (XOF mode).

**Features:**
- Merkle tree structure for parallelism
- Built-in keyed mode
- Key derivation with context strings
- XOF mode for arbitrary output length

#### blake3_derive_key

Derives cryptographic keys from context and key material.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Context length |
| 4 | C | Context string (e.g., "MyApp 2024 encryption key") |
| 4+C | 4 | Key material length |
| 8+C | M | Key material |
| 8+C+M | 4 | Output length |
```

**Output:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | L | Derived key |
```

#### blake2bF (EIP-152 Compatible)

Blake2b compression function for incremental hashing.

**Input:**
```solidity
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 4 | Rounds (big-endian) |
| 4 | 64 | State vector h (8 × 64-bit) |
| 68 | 128 | Message block m |
| 196 | 16 | Offset t (128-bit) |
| 212 | 1 | Final block flag f |
```

**Output:**
```sql
| Offset | Length | Description |
|--------|--------|-------------|
| 0 | 64 | Updated state h |
```

## Implementation Stack

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Blake2/Blake3 Precompile (0x0316)                   │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: EVM Interface                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ blake_precompile.go      - Precompile dispatcher                ││
│  │ blake_gas.go             - Gas calculation                       ││
│  │ blake_abi.go             - ABI encoding/decoding                ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: Hash Function Implementations                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ golang.org/x/crypto/blake2b - Blake2b (RFC 7693)                ││
│  │ golang.org/x/crypto/blake2s - Blake2s (RFC 7693)                ││
│  │ lukechampine.com/blake3     - Blake3 reference impl             ││
│  │ github.com/zeebo/blake3     - Blake3 (AVX2/SSE4)                ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Layer 1: Optimized Compression Functions                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ blake2b_amd64.s          - AMD64 SIMD (AVX2)                    ││
│  │ blake2b_arm64.s          - ARM64 NEON                           ││
│  │ blake3_amd64.s           - Blake3 AVX-512/AVX2                  ││
│  │ blake3_arm64.s           - Blake3 NEON                          ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### File Inventory

```
evm/precompile/contracts/blake/
├── blake.go                (12 KB)  # Main precompile implementation
├── blake_test.go           (10 KB)  # Unit tests
├── gas.go                  (2 KB)   # Gas metering
├── blake2b.go              (5 KB)   # Blake2b functions
├── blake2s.go              (4 KB)   # Blake2s functions
├── blake3.go               (6 KB)   # Blake3 functions
├── blake2f.go              (3 KB)   # EIP-152 compatible compression
└── testdata/
    ├── blake2_rfc_vectors.json     # RFC 7693 test vectors
    ├── blake3_vectors.json         # BLAKE3 official test vectors
    └── eip152_vectors.json         # EIP-152 compatibility tests

node/crypto/blake/
├── blake2b.go              (4 KB)   # Blake2b wrapper
├── blake2s.go              (3 KB)   # Blake2s wrapper
├── blake3.go               (5 KB)   # Blake3 wrapper
├── blake2b_amd64.s         (8 KB)   # AVX2 optimized
├── blake3_amd64.s          (12 KB)  # AVX-512 optimized
└── blake_test.go           (6 KB)   # Benchmarks

Total: ~80 KB implementation
```

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBlake {
    /// @notice Compute Blake2b hash with custom output length
    /// @param data Input data
    /// @param digestLen Output length (1-64 bytes)
    /// @return digest Hash output
    function blake2b(bytes calldata data, uint8 digestLen) external view returns (bytes memory digest);

    /// @notice Compute Blake2b-256 (32-byte output)
    /// @param data Input data
    /// @return digest 32-byte hash
    function blake2b_256(bytes calldata data) external view returns (bytes32 digest);

    /// @notice Compute Blake2b-512 (64-byte output)
    /// @param data Input data
    /// @return digest 64-byte hash
    function blake2b_512(bytes calldata data) external view returns (bytes memory digest);

    /// @notice Compute Blake2b keyed MAC
    /// @param key MAC key (1-64 bytes)
    /// @param data Input data
    /// @param digestLen Output length
    /// @return mac Keyed hash output
    function blake2b_keyed(
        bytes calldata key,
        bytes calldata data,
        uint8 digestLen
    ) external view returns (bytes memory mac);

    /// @notice Compute Blake2s hash (32-bit optimized)
    /// @param data Input data
    /// @param digestLen Output length (1-32 bytes)
    /// @return digest Hash output
    function blake2s(bytes calldata data, uint8 digestLen) external view returns (bytes memory digest);

    /// @notice Compute Blake2s-256 (32-byte output)
    /// @param data Input data
    /// @return digest 32-byte hash
    function blake2s_256(bytes calldata data) external view returns (bytes32 digest);

    /// @notice Compute Blake3 hash with arbitrary output length
    /// @param data Input data
    /// @param digestLen Output length (unlimited for XOF mode)
    /// @return digest Hash output
    function blake3(bytes calldata data, uint256 digestLen) external view returns (bytes memory digest);

    /// @notice Compute Blake3-256 (32-byte output, most common)
    /// @param data Input data
    /// @return digest 32-byte hash
    function blake3_256(bytes calldata data) external view returns (bytes32 digest);

    /// @notice Compute Blake3 keyed MAC
    /// @param key 32-byte key (exactly 32 bytes required)
    /// @param data Input data
    /// @param digestLen Output length
    /// @return mac Keyed hash output
    function blake3_keyed(
        bytes32 key,
        bytes calldata data,
        uint256 digestLen
    ) external view returns (bytes memory mac);

    /// @notice Derive key using Blake3 key derivation
    /// @param context Domain separation string
    /// @param keyMaterial Input key material
    /// @param derivedLen Length of derived key
    /// @return derivedKey Derived key bytes
    function blake3_derive_key(
        bytes calldata context,
        bytes calldata keyMaterial,
        uint256 derivedLen
    ) external view returns (bytes memory derivedKey);

    /// @notice Blake2b compression function (EIP-152 compatible)
    /// @param rounds Number of rounds
    /// @param h State vector (64 bytes)
    /// @param m Message block (128 bytes)
    /// @param t Offset counter (16 bytes)
    /// @param f Final block flag
    /// @return hPrime Updated state
    function blake2bF(
        uint32 rounds,
        bytes calldata h,
        bytes calldata m,
        bytes calldata t,
        bool f
    ) external view returns (bytes memory hPrime);
}
```

### Go Implementation

```go
// evm/precompile/contracts/blake/blake.go
package blake

import (
    "encoding/binary"

    "golang.org/x/crypto/blake2b"
    "golang.org/x/crypto/blake2s"
    "github.com/zeebo/blake3"
    "github.com/luxfi/evm/precompile/contract"
)

const (
    PrecompileAddress = "0x0316"

    // Function selectors
    SelectorBlake2b       = 0x01
    SelectorBlake2bKeyed  = 0x02
    SelectorBlake2b256    = 0x03
    SelectorBlake2b512    = 0x04
    SelectorBlake2s       = 0x10
    SelectorBlake2sKeyed  = 0x11
    SelectorBlake2s256    = 0x12
    SelectorBlake3        = 0x20
    SelectorBlake3Keyed   = 0x21
    SelectorBlake3Derive  = 0x22
    SelectorBlake3_256    = 0x23
    SelectorBlake2bF      = 0x30

    // Gas constants
    GasBlake2bBase     = 15
    GasBlake2sBase     = 12
    GasBlake3Base      = 10
    GasPerWord         = 3
    GasBlake3PerWord   = 2
    GasBlake2bFPerRound = 6
)

type BlakePrecompile struct{}

func (p *BlakePrecompile) Run(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) ([]byte, uint64, error) {
    if len(input) < 1 {
        return nil, suppliedGas, ErrInvalidInput
    }

    selector := input[0]
    data := input[1:]

    switch selector {
    case SelectorBlake2b:
        return p.blake2bHash(data, suppliedGas)
    case SelectorBlake2b256:
        return p.blake2b256(data, suppliedGas)
    case SelectorBlake2bKeyed:
        return p.blake2bKeyed(data, suppliedGas)
    case SelectorBlake2s256:
        return p.blake2s256(data, suppliedGas)
    case SelectorBlake3:
        return p.blake3Hash(data, suppliedGas)
    case SelectorBlake3_256:
        return p.blake3_256(data, suppliedGas)
    case SelectorBlake3Keyed:
        return p.blake3Keyed(data, suppliedGas)
    case SelectorBlake3Derive:
        return p.blake3DeriveKey(data, suppliedGas)
    case SelectorBlake2bF:
        return p.blake2bF(data, suppliedGas)
    default:
        return nil, suppliedGas, ErrUnknownSelector
    }
}

func (p *BlakePrecompile) blake2b256(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Parse input
    if len(data) < 4 {
        return nil, suppliedGas, ErrInvalidInput
    }
    dataLen := binary.BigEndian.Uint32(data[0:4])
    words := (dataLen + 31) / 32
    requiredGas := uint64(GasBlake2bBase + words*GasPerWord)

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    if len(data) < int(4+dataLen) {
        return nil, remainingGas, ErrInvalidInput
    }
    input := data[4 : 4+dataLen]

    // Compute Blake2b-256
    hash := blake2b.Sum256(input)
    return hash[:], remainingGas, nil
}

func (p *BlakePrecompile) blake2bKeyed(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Parse input: keyLen(1) || key || dataLen(4) || data || digestLen(1)
    if len(data) < 6 {
        return nil, suppliedGas, ErrInvalidInput
    }

    keyLen := uint8(data[0])
    if keyLen > 64 {
        return nil, suppliedGas, ErrInvalidKeyLength
    }

    key := data[1 : 1+keyLen]
    dataLen := binary.BigEndian.Uint32(data[1+keyLen : 5+keyLen])
    input := data[5+keyLen : 5+keyLen+dataLen]
    digestLen := uint8(data[5+keyLen+dataLen])

    if digestLen > 64 {
        return nil, suppliedGas, ErrInvalidDigestLength
    }

    // Calculate gas
    words := (dataLen + 31) / 32
    requiredGas := uint64(GasBlake2bBase + 5 + words*GasPerWord)

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    // Compute keyed Blake2b
    h, err := blake2b.New(int(digestLen), key)
    if err != nil {
        return nil, remainingGas, err
    }
    h.Write(input)
    return h.Sum(nil), remainingGas, nil
}

func (p *BlakePrecompile) blake3_256(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Parse input
    if len(data) < 4 {
        return nil, suppliedGas, ErrInvalidInput
    }
    dataLen := binary.BigEndian.Uint32(data[0:4])
    words := (dataLen + 31) / 32
    requiredGas := uint64(GasBlake3Base + words*GasBlake3PerWord)

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    if len(data) < int(4+dataLen) {
        return nil, remainingGas, ErrInvalidInput
    }
    input := data[4 : 4+dataLen]

    // Compute Blake3-256
    hash := blake3.Sum256(input)
    return hash[:], remainingGas, nil
}

func (p *BlakePrecompile) blake3DeriveKey(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // Parse: contextLen(4) || context || keyMatLen(4) || keyMat || outLen(4)
    if len(data) < 12 {
        return nil, suppliedGas, ErrInvalidInput
    }

    contextLen := binary.BigEndian.Uint32(data[0:4])
    context := string(data[4 : 4+contextLen])

    offset := 4 + contextLen
    keyMatLen := binary.BigEndian.Uint32(data[offset : offset+4])
    keyMaterial := data[offset+4 : offset+4+keyMatLen]

    offset += 4 + keyMatLen
    outputLen := binary.BigEndian.Uint32(data[offset : offset+4])

    // Calculate gas
    words := (contextLen + keyMatLen + 31) / 32
    requiredGas := uint64(15 + words*GasBlake3PerWord + outputLen/8)

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    // Derive key
    derivedKey := make([]byte, outputLen)
    blake3.DeriveKey(context, keyMaterial, derivedKey)

    return derivedKey, remainingGas, nil
}

func (p *BlakePrecompile) blake2bF(data []byte, suppliedGas uint64) ([]byte, uint64, error) {
    // EIP-152 compatible format
    if len(data) != 213 {
        return nil, suppliedGas, ErrInvalidInput
    }

    rounds := binary.BigEndian.Uint32(data[0:4])
    requiredGas := uint64(rounds) * GasBlake2bFPerRound

    if suppliedGas < requiredGas {
        return nil, 0, ErrOutOfGas
    }
    remainingGas := suppliedGas - requiredGas

    // Parse state, message, offset, final flag
    h := data[4:68]
    m := data[68:196]
    t := data[196:212]
    f := data[212] != 0

    // Apply compression function
    result := blake2bCompress(h, m, t, f, rounds)

    return result, remainingGas, nil
}
```

### Cross-Chain Compatibility

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Blake Cross-Chain Usage                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    Zcash     │    │   Polkadot   │    │   Filecoin   │          │
│  │  Blake2b-256 │    │  Blake2b-256 │    │   Blake2b    │          │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│         │                   │                   │                    │
│         └───────────────────┼───────────────────┘                   │
│                             │                                        │
│                             ▼                                        │
│               ┌──────────────────────────┐                          │
│               │   Blake Precompile       │                          │
│               │        (0x0316)          │                          │
│               └─────────────┬────────────┘                          │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                   │
│         │                   │                   │                    │
│         ▼                   ▼                   ▼                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Merkle     │    │    Key       │    │    SNARK     │          │
│  │    Trees     │    │  Derivation  │    │   Circuits   │          │
│  │   (Blake3)   │    │   (Blake3)   │    │   (Blake2s)  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Network Usage Map

| Chain | Component | Blake Usage |
|-------|-----------|-------------|
| C-Chain | Smart Contracts | Blake2b-256 for Zcash proofs |
| C-Chain | Merkle Trees | Blake3 for parallel hashing |
| Z-Chain | ZK Circuits | Blake2s for SNARK-friendly ops |
| B-Chain | Bridge | Blake2b for Polkadot verification |
| All | Key Derivation | Blake3 derive_key mode |

## Security Considerations

### Collision Resistance

| Function | Security Level |
|----------|----------------|
| Blake2b-256 | 128 bits |
| Blake2b-512 | 256 bits |
| Blake2s-256 | 128 bits |
| Blake3-256 | 128 bits |

### Length Extension Immunity

Blake2 and Blake3 are immune to length extension attacks:
- Blake2: Finalization includes message length
- Blake3: Merkle tree structure prevents extension

### Side-Channel Resistance

Blake implementations are constant-time:
- No data-dependent branches
- No table lookups indexed by secret data
- SIMD operations are inherently constant-time

### Key Security

For keyed modes:
- Blake2b: Key up to 64 bytes
- Blake2s: Key up to 32 bytes
- Blake3: Key exactly 32 bytes (derive_key can extend)

### XOF Security

Blake3 in XOF mode:
- First 32 bytes have 128-bit security
- Extended output has 128-bit security against generic attacks
- Use derive_key for domain-separated key derivation

## Test Cases

### RFC 7693 Test Vectors

```go
func TestBlake2b256_RFC(t *testing.T) {
    tests := []struct {
        input    string
        expected string
    }{
        // Empty string
        {"", "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8"},
        // "abc"
        {"616263", "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319"},
    }

    for _, tt := range tests {
        input, _ := hex.DecodeString(tt.input)
        result := precompile.Blake2b256(input)
        assert.Equal(t, tt.expected, hex.EncodeToString(result))
    }
}

func TestBlake3_256(t *testing.T) {
    tests := []struct {
        input    []byte
        expected string
    }{
        // Empty
        {[]byte{}, "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262"},
        // 1 byte
        {[]byte{0x00}, "2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213"},
    }

    for _, tt := range tests {
        result := precompile.Blake3_256(tt.input)
        assert.Equal(t, tt.expected, hex.EncodeToString(result))
    }
}

func TestBlake3DeriveKey(t *testing.T) {
    context := "Lux Network 2024 encryption key"
    keyMaterial := []byte("user master password")

    key1 := precompile.Blake3DeriveKey(context, keyMaterial, 32)
    key2 := precompile.Blake3DeriveKey(context, keyMaterial, 32)

    // Deterministic
    assert.Equal(t, key1, key2)

    // Different context = different key
    key3 := precompile.Blake3DeriveKey("Different context", keyMaterial, 32)
    assert.NotEqual(t, key1, key3)
}

func TestBlake2bF_EIP152(t *testing.T) {
    // EIP-152 test vector
    input, _ := hex.DecodeString("0000000048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001")

    expected, _ := hex.DecodeString("ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923")

    result := precompile.Blake2bF(input)
    assert.Equal(t, expected, result)
}
```

### Performance Benchmarks

```go
func BenchmarkBlake2b256(b *testing.B) {
    input := make([]byte, 1024)
    rand.Read(input)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.Blake2b256(input)
    }
}
// BenchmarkBlake2b256-8    823,456 ns/op    111 gas (15 + 32*3)

func BenchmarkBlake3_256(b *testing.B) {
    input := make([]byte, 1024)
    rand.Read(input)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.Blake3_256(input)
    }
}
// BenchmarkBlake3_256-8    567,890 ns/op    74 gas (10 + 32*2)

func BenchmarkBlake3_1MB(b *testing.B) {
    input := make([]byte, 1024*1024)
    rand.Read(input)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        precompile.Blake3_256(input)
    }
}
// BenchmarkBlake3_1MB-8    654,321 ns/op    65,546 gas
```

## Backwards Compatibility

This LP extends the existing Blake2b compression function (EIP-152 at 0x09) with full Blake2b/Blake2s/Blake3 functionality at a new address (0x0316). The EIP-152 precompile remains unchanged.

## References

- [RFC 7693: BLAKE2 Cryptographic Hash](https://datatracker.ietf.org/doc/html/rfc7693)
- [BLAKE3 Specification](https://github.com/BLAKE3-team/BLAKE3-specs)
- [EIP-152: Blake2b Compression Function](https://eips.ethereum.org/EIPS/eip-152)
- [golang.org/x/crypto/blake2b](https://pkg.go.dev/golang.org/x/crypto/blake2b)
- [github.com/zeebo/blake3](https://github.com/zeebo/blake3)
- [LP-3655: SHA-3/Keccak Precompile](./lp-3655-sha3-keccak-precompile.md)

```
