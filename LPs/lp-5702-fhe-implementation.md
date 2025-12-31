---
lp: 5702
title: Fully Homomorphic Encryption (lux/fhe)
description: Boolean and integer FHE with GPU acceleration for blockchain/EVM integration
author: Lux Core Team
discussions-to: https://github.com/luxfi/LPs/discussions/5702
status: Final
type: Standards Track
category: Core
created: 2025-12-30
requires: [5700, 5701]
---

# LP-5702: Fully Homomorphic Encryption

## Abstract

This LP specifies the Fully Homomorphic Encryption library (`lux/fhe`) that provides **FHE primitives** for computation on encrypted data. Built on the lattice cryptography foundation (LP-5701), it provides boolean gates, integer arithmetic, and GPU-accelerated programmable bootstrapping for blockchain/EVM integration.

**Architecture Note**: This library provides single-party FHE primitives only. **Threshold FHE** operations (collective decryption, threshold key generation, key refresh) are implemented in `lux/threshold/protocols/tfhe` (LP-5703), which consumes these primitives. Applications requiring threshold decryption should use `lux/threshold`, not this library directly.

## Motivation

FHE enables confidential computation on encrypted data without decryption:

- **Confidential Smart Contracts**: Execute EVM bytecode on encrypted state
- **Private DeFi**: Trading, lending, auctions without revealing positions
- **Encrypted Databases**: Query encrypted on-chain data
- **Privacy-Preserving ML**: Inference on encrypted inputs

Key requirements for blockchain integration:

1. **EVM Types**: Native FheUint160 (addresses), FheUint256 (EVM words)
2. **GPU Acceleration**: 10,000+ concurrent users with batched operations
3. **Deterministic RNG**: Consensus-compatible randomness generation
4. **Primitive Foundation**: Clean APIs that `lux/threshold/protocols/tfhe` builds upon

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           lux/fhe (Go Library)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │                       Integer Operations                           │     │
│   │                                                                    │     │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │     │
│   │   │ FheUint4 │ │FheUint32 │ │FheUint64 │ │ FheUint160/256   │   │     │
│   │   │ FheUint8 │ │          │ │FheUint128│ │ (EVM Types)      │   │     │
│   │   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │     │
│   │        └────────────┴────────────┴────────────────┘              │     │
│   │                             │                                     │     │
│   │        BitwiseEncryptor / BitwiseEvaluator / BitwiseDecryptor    │     │
│   └─────────────────────────────┬─────────────────────────────────────┘     │
│                                 │                                            │
│   ┌─────────────────────────────▼─────────────────────────────────────┐     │
│   │                       Boolean Gates                                │     │
│   │                                                                    │     │
│   │   2-Input: AND, OR, XOR, NOT (free), NAND, NOR, XNOR, MUX         │     │
│   │   3-Input: AND3, OR3, NAND3, NOR3, MAJORITY                       │     │
│   │                                                                    │     │
│   │        Encryptor / Evaluator / Decryptor                          │     │
│   └─────────────────────────────┬─────────────────────────────────────┘     │
│                                 │                                            │
│   ┌─────────────────────────────▼─────────────────────────────────────┐     │
│   │                   Programmable Bootstrapping                       │     │
│   │                                                                    │     │
│   │   • LWE to RLWE via blind rotation                                │     │
│   │   • Test polynomials define gate function                          │     │
│   │   • Sample extraction + key switching                              │     │
│   │   • Noise refresh enables unlimited computation                    │     │
│   └─────────────────────────────┬─────────────────────────────────────┘     │
│                                 │                                            │
│   ┌─────────────────────────────▼─────────────────────────────────────┐     │
│   │                     Key Management                                 │     │
│   │                                                                    │     │
│   │   • SecretKey (SKLWE + SKBR)                                      │     │
│   │   • PublicKey (for user encryption)                                │     │
│   │   • BootstrapKey (BRK + KSK + TestPolys)                          │     │
│   │   • Serialization for network transport                            │     │
│   └─────────────────────────────┬─────────────────────────────────────┘     │
│                                 │                                            │
│                                 │ uses                                       │
│                                 ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │            github.com/luxfi/lattice/v7 Primitives                │       │
│   │                                                                  │       │
│   │   • core/rlwe - Ring-LWE encryption                             │       │
│   │   • core/rgsw - RGSW + blind rotation                           │       │
│   │   • ring - Polynomial operations + NTT                          │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                          GPU Acceleration                                    │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                      GPU FHE Engine                               │      │
│   │                                                                   │      │
│   │   ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐    │      │
│   │   │ UserSession │  │ BatchPBS    │  │  Metal/CUDA Kernels  │    │      │
│   │   │  (BK + KSK  │  │ Scheduler   │  │  - batchNTT          │    │      │
│   │   │   on GPU)   │  │             │  │  - batchExternalProd │    │      │
│   │   └─────────────┘  └─────────────┘  │  - batchBlindRotate  │    │      │
│   │                                      └──────────────────────┘    │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parameter Interface

```go
// Package fhe implements Threshold Fully Homomorphic Encryption.
package fhe

// ParametersLiteral specifies FHE parameters.
type ParametersLiteral struct {
    LogNLWE              int    // log2 of LWE dimension (9-10)
    LogNBR               int    // log2 of blind rotation dimension (10-11)
    QLWE                 uint64 // LWE modulus
    QBR                  uint64 // Blind rotation modulus
    BaseTwoDecomposition int    // Key switching base (7-10)
}

// Standard parameter sets
var (
    // PN10QP27 - 128-bit security, balanced performance
    PN10QP27 = ParametersLiteral{
        LogNLWE:              10,
        LogNBR:               10,
        QLWE:                 0x7fff801,  // ~134M
        QBR:                  0x7fff801,
        BaseTwoDecomposition: 7,
    }

    // PN11QP54 - 128-bit security, higher precision
    PN11QP54 = ParametersLiteral{
        LogNLWE:              11,
        LogNBR:               11,
        QLWE:                 0x3FFFFFFFFFC0001,  // ~2^54
        QBR:                  0x3FFFFFFFFFC0001,
        BaseTwoDecomposition: 10,
    }

    // PN9QP28_STD128 - OpenFHE compatible (classical security)
    PN9QP28_STD128 = ParametersLiteral{
        LogNLWE:              9,   // N=512
        LogNBR:               10,  // N=1024
        QLWE:                 0x10001801,
        QBR:                  0x10001801,
        BaseTwoDecomposition: 5,
    }

    // PN9QP27_STD128Q - Post-quantum security
    PN9QP27_STD128Q = ParametersLiteral{
        LogNLWE:              9,
        LogNBR:               10,
        QLWE:                 0x8007001,
        QBR:                  0x8007001,
        BaseTwoDecomposition: 5,
    }
)

// Parameters is the concrete parameter set.
type Parameters struct {
    // internal fields
}

// NewParametersFromLiteral creates Parameters from a literal.
func NewParametersFromLiteral(lit ParametersLiteral) (Parameters, error)

// N returns the LWE dimension.
func (p Parameters) N() int

// NBR returns the blind rotation dimension.
func (p Parameters) NBR() int

// QLWE returns the LWE modulus.
func (p Parameters) QLWE() uint64

// QBR returns the blind rotation modulus.
func (p Parameters) QBR() uint64
```

### Key Management

```go
// SecretKey contains LWE and RLWE secret keys.
type SecretKey struct {
    SKLWE *rlwe.SecretKey  // For encrypting bits
    SKBR  *rlwe.SecretKey  // For blind rotation results
}

// PublicKey allows encryption without secret key.
type PublicKey struct {
    PKLWE *rlwe.PublicKey
}

// BootstrapKey contains keys for programmable bootstrapping.
type BootstrapKey struct {
    BRK              BlindRotationEvaluationKeySet  // RGSW encryptions of SK bits
    KSK              *rlwe.EvaluationKey            // Key switching key
    TestPolyAND      *ring.Poly
    TestPolyOR       *ring.Poly
    TestPolyXOR      *ring.Poly
    TestPolyNAND     *ring.Poly
    TestPolyNOR      *ring.Poly
    TestPolyXNOR     *ring.Poly
    TestPolyID       *ring.Poly  // Identity/refresh
    TestPolyMAJORITY *ring.Poly  // 2-of-3 majority
    params           Parameters
}

// KeyGenerator generates FHE keys.
type KeyGenerator struct {
    params Parameters
}

// NewKeyGenerator creates a new key generator.
func NewKeyGenerator(params Parameters) *KeyGenerator

// GenSecretKey generates a new secret key.
func (kg *KeyGenerator) GenSecretKey() *SecretKey

// GenPublicKey generates a public key from a secret key.
func (kg *KeyGenerator) GenPublicKey(sk *SecretKey) *PublicKey

// GenKeyPair generates both secret and public keys.
func (kg *KeyGenerator) GenKeyPair() (*SecretKey, *PublicKey)

// GenBootstrapKey generates bootstrap key from secret key.
func (kg *KeyGenerator) GenBootstrapKey(sk *SecretKey) *BootstrapKey
```

### Boolean Operations

```go
// Ciphertext represents an encrypted bit.
type Ciphertext struct {
    *rlwe.Ciphertext
}

// Encryptor encrypts boolean values.
type Encryptor struct {
    params Parameters
    sk     *SecretKey
}

// NewEncryptor creates a new encryptor.
func NewEncryptor(params Parameters, sk *SecretKey) *Encryptor

// Encrypt encrypts a boolean value.
func (enc *Encryptor) Encrypt(value bool) *Ciphertext

// PublicEncryptor encrypts with public key only.
type PublicEncryptor struct {
    params Parameters
    pk     *PublicKey
}

// NewPublicEncryptor creates a public key encryptor.
func NewPublicEncryptor(params Parameters, pk *PublicKey) *PublicEncryptor

// Decryptor decrypts ciphertexts.
type Decryptor struct {
    params Parameters
    sk     *SecretKey
}

// NewDecryptor creates a new decryptor.
func NewDecryptor(params Parameters, sk *SecretKey) *Decryptor

// Decrypt decrypts a ciphertext to boolean.
func (dec *Decryptor) Decrypt(ct *Ciphertext) bool

// Evaluator performs homomorphic boolean operations.
type Evaluator struct {
    params Parameters
    bsk    *BootstrapKey
}

// NewEvaluator creates a new evaluator.
func NewEvaluator(params Parameters, bsk *BootstrapKey, sk *SecretKey) *Evaluator

// 2-Input Gates
func (eval *Evaluator) AND(ct1, ct2 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) OR(ct1, ct2 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) XOR(ct1, ct2 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) NOT(ct *Ciphertext) (*Ciphertext, error)  // Free (no bootstrap)
func (eval *Evaluator) NAND(ct1, ct2 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) NOR(ct1, ct2 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) XNOR(ct1, ct2 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) MUX(sel, ct1, ct2 *Ciphertext) (*Ciphertext, error)

// 3-Input Gates
func (eval *Evaluator) AND3(ct1, ct2, ct3 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) OR3(ct1, ct2, ct3 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) NAND3(ct1, ct2, ct3 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) NOR3(ct1, ct2, ct3 *Ciphertext) (*Ciphertext, error)
func (eval *Evaluator) MAJORITY(ct1, ct2, ct3 *Ciphertext) (*Ciphertext, error)

// Refresh refreshes ciphertext noise (identity bootstrap).
func (eval *Evaluator) Refresh(ct *Ciphertext) (*Ciphertext, error)
```

### Integer Operations

```go
// FheUintType defines encrypted integer bit widths.
type FheUintType uint8

const (
    FheUint4   FheUintType = 4
    FheUint8   FheUintType = 8
    FheUint16  FheUintType = 16
    FheUint32  FheUintType = 32
    FheUint64  FheUintType = 64
    FheUint128 FheUintType = 128
    FheUint160 FheUintType = 160  // Ethereum address
    FheUint256 FheUintType = 256  // EVM word
)

// BitCiphertext is an encrypted integer (array of encrypted bits).
type BitCiphertext struct {
    Bits     []*Ciphertext
    Type     FheUintType
    params   Parameters
}

// BitwiseEncryptor encrypts integers.
type BitwiseEncryptor struct {
    params Parameters
    enc    *Encryptor
}

// NewBitwiseEncryptor creates a new bitwise encryptor.
func NewBitwiseEncryptor(params Parameters, sk *SecretKey) *BitwiseEncryptor

// EncryptUint64 encrypts a uint64 to the specified type.
func (enc *BitwiseEncryptor) EncryptUint64(value uint64, typ FheUintType) *BitCiphertext

// EncryptBytes encrypts a byte slice (for FheUint160, FheUint256).
func (enc *BitwiseEncryptor) EncryptBytes(value []byte, typ FheUintType) *BitCiphertext

// BitwisePublicEncryptor encrypts with public key.
type BitwisePublicEncryptor struct {
    params Parameters
    pk     *PublicKey
}

// NewBitwisePublicEncryptor creates a public key encryptor.
func NewBitwisePublicEncryptor(params Parameters, pk *PublicKey) *BitwisePublicEncryptor

// BitwiseDecryptor decrypts integers.
type BitwiseDecryptor struct {
    params Parameters
    dec    *Decryptor
}

// NewBitwiseDecryptor creates a new bitwise decryptor.
func NewBitwiseDecryptor(params Parameters, sk *SecretKey) *BitwiseDecryptor

// DecryptUint64 decrypts to uint64.
func (dec *BitwiseDecryptor) DecryptUint64(ct *BitCiphertext) uint64

// DecryptBytes decrypts to byte slice.
func (dec *BitwiseDecryptor) DecryptBytes(ct *BitCiphertext) []byte

// BitwiseEvaluator performs homomorphic integer operations.
type BitwiseEvaluator struct {
    params Parameters
    eval   *Evaluator
}

// NewBitwiseEvaluator creates a new bitwise evaluator.
func NewBitwiseEvaluator(params Parameters, bsk *BootstrapKey, sk *SecretKey) *BitwiseEvaluator

// Arithmetic
func (eval *BitwiseEvaluator) Add(a, b *BitCiphertext) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) Sub(a, b *BitCiphertext) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) Neg(a *BitCiphertext) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) ScalarAdd(a *BitCiphertext, scalar uint64) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) ScalarMul(a *BitCiphertext, scalar uint64) (*BitCiphertext, error)

// Comparisons (return encrypted bit)
func (eval *BitwiseEvaluator) Eq(a, b *BitCiphertext) (*Ciphertext, error)
func (eval *BitwiseEvaluator) Lt(a, b *BitCiphertext) (*Ciphertext, error)
func (eval *BitwiseEvaluator) Le(a, b *BitCiphertext) (*Ciphertext, error)
func (eval *BitwiseEvaluator) Gt(a, b *BitCiphertext) (*Ciphertext, error)
func (eval *BitwiseEvaluator) Ge(a, b *BitCiphertext) (*Ciphertext, error)
func (eval *BitwiseEvaluator) Min(a, b *BitCiphertext) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) Max(a, b *BitCiphertext) (*BitCiphertext, error)

// Bitwise
func (eval *BitwiseEvaluator) And(a, b *BitCiphertext) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) Or(a, b *BitCiphertext) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) Xor(a, b *BitCiphertext) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) Not(a *BitCiphertext) (*BitCiphertext, error)

// Shifts
func (eval *BitwiseEvaluator) Shl(a *BitCiphertext, bits int) (*BitCiphertext, error)
func (eval *BitwiseEvaluator) Shr(a *BitCiphertext, bits int) (*BitCiphertext, error)

// Casting
func (eval *BitwiseEvaluator) CastTo(a *BitCiphertext, typ FheUintType) (*BitCiphertext, error)
```

### Deterministic RNG

```go
// FheRNG provides deterministic random number generation for consensus.
type FheRNG struct {
    params Parameters
    enc    *Encryptor
    state  [32]byte  // SHA256 state
}

// NewFheRNG creates an RNG with secret key encryption.
func NewFheRNG(params Parameters, sk *SecretKey, seed []byte) *FheRNG

// RandomBit generates an encrypted random bit.
func (rng *FheRNG) RandomBit() *Ciphertext

// RandomUint generates an encrypted random integer.
func (rng *FheRNG) RandomUint(typ FheUintType) *BitCiphertext

// Reseed reseeds the RNG.
func (rng *FheRNG) Reseed(seed []byte)

// FheRNGPublic uses public key for encryption (verifiable).
type FheRNGPublic struct {
    params Parameters
    pk     *PublicKey
    state  [32]byte
}

// NewFheRNGPublic creates an RNG with public key encryption.
func NewFheRNGPublic(params Parameters, pk *PublicKey, seed []byte) *FheRNGPublic

// RandomBit generates an encrypted random bit.
func (rng *FheRNGPublic) RandomBit() *Ciphertext

// RandomUint generates an encrypted random integer.
func (rng *FheRNGPublic) RandomUint(typ FheUintType) *BitCiphertext
```

### GPU FHE Engine

```go
// Package gpu provides GPU-accelerated FHE operations.
package gpu

// FHEConfig configures the GPU FHE engine.
type FHEConfig struct {
    N                int     // Ring dimension (1024)
    n                int     // LWE dimension (512)
    L                int     // Decomposition digits (4)
    MaxUsers         int     // Max concurrent users (10,000)
    GPUMemoryBudget  uint64  // GPU memory budget (100GB)
    BatchSize        int     // Default batch size (256)
}

// DefaultConfig returns default configuration.
func DefaultConfig() FHEConfig

// FHEEngine manages GPU-accelerated FHE operations.
type FHEEngine struct {
    // internal
}

// New creates a new GPU FHE engine.
func New(config FHEConfig) (*FHEEngine, error)

// Initialize initializes the GPU engine.
func (e *FHEEngine) Initialize() error

// CreateUser creates a new user session.
func (e *FHEEngine) CreateUser() (userID uint64, err error)

// UploadBootstrapKey uploads a user's bootstrap key to GPU.
func (e *FHEEngine) UploadBootstrapKey(userID uint64, bsk *BootstrapKey) error

// AllocateCiphertexts allocates ciphertext pool on GPU.
func (e *FHEEngine) AllocateCiphertexts(userID uint64, count int) (poolIdx uint32, err error)

// UploadCiphertexts uploads ciphertexts to GPU pool.
func (e *FHEEngine) UploadCiphertexts(userID uint64, poolIdx uint32, cts []*Ciphertext) error

// DownloadCiphertexts downloads ciphertexts from GPU.
func (e *FHEEngine) DownloadCiphertexts(userID uint64, poolIdx uint32, count int) ([]*Ciphertext, error)

// GateType identifies the boolean gate.
type GateType uint8

const (
    GateAND GateType = iota
    GateOR
    GateXOR
    GateNAND
    GateNOR
    GateXNOR
)

// BatchedGateOp specifies a batch of gate operations.
type BatchedGateOp struct {
    Gate           GateType
    UserIDs        []uint64
    Input1Indices  []uint32
    Input2Indices  []uint32
    OutputIndices  []uint32
}

// ExecuteBatchGates executes multiple gates in parallel.
func (e *FHEEngine) ExecuteBatchGates(ops []BatchedGateOp) error

// Sync waits for all GPU operations to complete.
func (e *FHEEngine) Sync() error

// GetStats returns engine statistics.
func (e *FHEEngine) GetStats() *EngineStats

// EngineStats contains runtime statistics.
type EngineStats struct {
    Backend     string  // "Metal", "CUDA", "CPU"
    DeviceName  string
    MemoryUsed  uint64
    MemoryTotal uint64
    ActiveUsers int
}
```

### FHE Server

```go
// Package server provides HTTP endpoints for FHE operations.
package server

// ServerConfig configures the FHE server.
// NOTE: This server provides single-party FHE operations only.
// For threshold decryption, use lux/threshold/protocols/tfhe server.
type ServerConfig struct {
    Addr       string  // Listen address (:8448)
    GPU        bool    // Enable GPU acceleration
    BatchSize  int     // GPU batch size
    DataDir    string  // Key storage directory
}

// Server is the FHE HTTP server.
type Server struct {
    config ServerConfig
    engine *gpu.FHEEngine
}

// New creates a new FHE server.
func New(config ServerConfig) (*Server, error)

// Start starts the HTTP server.
func (s *Server) Start() error

// Endpoints (single-party FHE only):
// GET  /health           - Health check
// GET  /publickey        - Get public key
// POST /encrypt          - Encrypt value
// POST /decrypt          - Decrypt (single-party)
// POST /evaluate         - Evaluate FHE operation
// GET  /gpu/status       - GPU engine status
// POST /gpu/batch        - Batch GPU operations
//
// NOTE: Threshold decryption endpoints are provided by
// lux/threshold/protocols/tfhe server, not this library.
```

### Serialization

```go
// MarshalBinary serializes a ciphertext.
func (ct *Ciphertext) MarshalBinary() ([]byte, error)

// UnmarshalBinary deserializes a ciphertext.
func (ct *Ciphertext) UnmarshalBinary(data []byte) error

// MarshalBinary serializes a BitCiphertext.
func (ct *BitCiphertext) MarshalBinary() ([]byte, error)

// UnmarshalBinary deserializes a BitCiphertext.
func (ct *BitCiphertext) UnmarshalBinary(data []byte) error

// MarshalBinary serializes a public key.
func (pk *PublicKey) MarshalBinary() ([]byte, error)

// UnmarshalBinary deserializes a public key.
func (pk *PublicKey) UnmarshalBinary(data []byte) error

// MarshalBinary serializes a bootstrap key.
func (bsk *BootstrapKey) MarshalBinary() ([]byte, error)

// UnmarshalBinary deserializes a bootstrap key.
func (bsk *BootstrapKey) UnmarshalBinary(data []byte) error
```

### Performance Benchmarks

| Operation | Pure Go | OpenFHE CGO | Notes |
|-----------|---------|-------------|-------|
| BootstrapKey Gen | 132 ms | 2413 ms | **Go 18x faster** |
| AND/OR/NAND/NOR | ~51 ms | ~56 ms | Go ~10% faster |
| XOR/XNOR | ~51 ms | ~56 ms | Go ~10% faster |
| NOT | 1.2 µs | 1.4 µs | Free (no bootstrap) |
| Decrypt | 4.5 µs | 1.4 µs | CGO 3x faster |
| Add 8-bit | 3.5 s | - | Via gate composition |
| Lt 8-bit | 2.9 s | - | Via gate composition |
| MAJORITY | ~59 ms | - | Single bootstrap |
| AND3/OR3 | ~117 ms | - | 2 bootstraps |

### GPU Performance

| Configuration | Throughput | Notes |
|--------------|------------|-------|
| Apple M3 Max | ~60K gates/sec | Metal backend |
| Single H100 | ~180K gates/sec | CUDA backend |
| Single H200 | ~250K gates/sec | CUDA backend |
| **HGX H200 x8** | **~1.5M gates/sec** | Multi-GPU NVLink |

### Memory Requirements

| Component | Size | Notes |
|-----------|------|-------|
| Bootstrap Key | ~170 MB | Per user |
| Public Key | ~2 MB | Per user |
| LWE Ciphertext | ~8 KB | Per encrypted bit |
| 8-bit Integer | ~64 KB | 8 × ciphertext |
| 256-bit Integer | ~2 MB | 256 × ciphertext |

## Rationale

### Why Boolean FHE?

1. **Universality**: Any function expressible as boolean circuit
2. **Bootstrapping**: Each gate refreshes noise automatically
3. **Parallelization**: Independent bits process in parallel
4. **EVM Compatibility**: EVM is fundamentally a state machine on bits

### Why Programmable Bootstrapping?

1. **Gate Functions**: Test polynomial defines arbitrary lookup table
2. **Noise Refresh**: Every gate outputs fresh ciphertext
3. **No Depth Limit**: Circuits of arbitrary depth
4. **Efficiency**: One bootstrap per gate vs multiple for other approaches

### Why GPU Acceleration?

1. **Batch PBS**: 1000s of bootstraps run in parallel
2. **Multi-User**: 10,000+ concurrent users with isolated keys
3. **NVLink**: Multi-GPU scaling with minimal overhead
4. **Memory**: 100GB+ GPU memory for key-heavy workloads

## Backwards Compatibility

New library. No backwards compatibility concerns.

## Test Cases

### Boolean Gate Tests

1. AND truth table correct
2. OR truth table correct
3. XOR truth table correct
4. NOT is free (no bootstrap)
5. NAND/NOR/XNOR truth tables correct
6. MUX selects correctly
7. MAJORITY 2-of-3 correct

### Integer Tests

1. FheUint8 encrypt/decrypt roundtrip
2. FheUint256 encrypt/decrypt roundtrip
3. Add produces correct sum
4. Sub produces correct difference
5. Eq/Lt/Le/Gt/Ge comparisons correct
6. Bitwise AND/OR/XOR correct
7. Shl/Shr shifts correct
8. CastTo preserves value (truncates if narrowing)

### GPU Tests

1. GPU engine initializes on supported platforms
2. User creation and key upload succeeds
3. Batch gates produce correct results
4. Multi-user isolation maintained
5. Memory management handles allocation/free

### Serialization Tests

1. Ciphertext serialization roundtrip
2. BitCiphertext serialization roundtrip
3. PublicKey serialization roundtrip
4. BootstrapKey serialization roundtrip
5. Deserialized values decrypt correctly

## Reference Implementation

### Repository Structure

```
lux/fhe/
├── go.mod
├── fhe.go               # Parameters, KeyGenerator
├── encryptor.go         # Boolean encryption
├── decryptor.go         # Boolean decryption
├── evaluator.go         # Boolean gates
├── integers.go          # FheUintType definitions
├── bitwise_integers.go  # BitCiphertext operations
├── integer_ops.go       # Add, Sub, comparisons
├── shortint.go          # Small integer optimizations
├── random.go            # FheRNG, FheRNGPublic
├── serialization.go     # Binary serialization
├── security.go          # Security parameters
├── gpu/
│   ├── engine.go        # GPU FHE engine
│   └── multigpu.go      # Multi-GPU orchestration
├── server/
│   └── server.go        # HTTP FHE server
├── cmd/
│   ├── fhe-server/      # Server binary
│   ├── fhe-worker/      # Worker binary
│   └── fhe-gateway/     # Gateway binary
└── cgo/
    ├── openfhe.go       # OpenFHE CGO bindings
    └── stub.go          # Stubs when CGO disabled
```

### Go Module

```
module github.com/luxfi/fhe

go 1.22

require (
    github.com/luxfi/lattice/v7 v6.0.0  // Lattice primitives
)

// NOTE: This library does NOT import lux/threshold.
// The dependency goes the other way: lux/threshold imports lux/fhe
// to build threshold FHE operations on these primitives.
```

## Security Considerations

### Parameter Selection

- 128-bit classical security with PN10QP27/PN11QP54
- 128-bit post-quantum security with PN9QP27_STD128Q
- Conservative noise budgets for implementation margin

### Key Management

- Secret keys never leave secure environment
- Public keys distributed for user encryption
- Bootstrap keys are large (~170MB) - handle securely

### Side-Channel Resistance

- Constant-time gate evaluation
- No branching on encrypted values
- GPU operations don't leak timing

### Threshold Security

**NOTE**: Threshold FHE is implemented in `lux/threshold/protocols/tfhe` (LP-5703), not this library. This library provides primitives that the threshold layer builds upon. See LP-5703 for:
- t-of-n threshold decryption
- Collective key generation
- Threshold key refresh

