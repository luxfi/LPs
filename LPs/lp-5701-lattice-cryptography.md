---
lp: 5701
title: Lattice Cryptography Library (lux/lattice)
description: GPU-accelerated lattice-based cryptography for RLWE, NTT, and homomorphic encryption
author: Lux Core Team
discussions-to: https://github.com/luxfi/LPs/discussions/5701
status: Final
type: Standards Track
category: Core
created: 2025-12-30
requires: [5700]
---

# LP-5701: Lattice Cryptography Library

## Abstract

This LP specifies the lattice cryptography library (`lux/lattice`) that provides Ring-Learning-With-Errors (RLWE) based primitives, Number Theoretic Transform (NTT) operations, and homomorphic encryption schemes. The library features a pure Go implementation with optional GPU acceleration via CGO bindings to the C++ layer (`luxcpp/lattice`).

## Motivation

Lattice-based cryptography is the foundation for:

- **Fully Homomorphic Encryption (FHE)**: Compute on encrypted data
- **Post-Quantum Signatures**: ML-DSA (Dilithium), SLH-DSA
- **Threshold Cryptography**: Distributed key generation and signing
- **Zero-Knowledge Proofs**: Lattice-based SNARKs

Key challenges addressed:

1. **Performance**: NTT is the bottleneck - GPU acceleration provides 50-100x speedup
2. **Portability**: Pure Go enables WASM compilation for browsers
3. **Security**: Constant-time operations resist side-channel attacks
4. **Composability**: Common ring layer shared across all schemes

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         lux/lattice (Go Library)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │                        Schemes Layer                               │     │
│   │                                                                    │     │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐                   │     │
│   │   │   BFV    │    │   BGV    │    │   CKKS   │                   │     │
│   │   │ Integer  │    │ Integer  │    │ Approx.  │                   │     │
│   │   │ Arith.   │    │ Arith.   │    │ Numbers  │                   │     │
│   │   └────┬─────┘    └────┬─────┘    └────┬─────┘                   │     │
│   │        └───────────────┴───────────────┘                          │     │
│   └────────────────────────────┬──────────────────────────────────────┘     │
│                                │                                             │
│   ┌────────────────────────────▼──────────────────────────────────────┐     │
│   │                       Multiparty Layer                             │     │
│   │                                                                    │     │
│   │   • Distributed key generation (DKG)                               │     │
│   │   • Threshold decryption                                           │     │
│   │   • Collective bootstrapping                                       │     │
│   │   • Linear secret sharing (LSS)                                    │     │
│   └────────────────────────────┬──────────────────────────────────────┘     │
│                                │                                             │
│   ┌────────────────────────────▼──────────────────────────────────────┐     │
│   │                         Core/RLWE Layer                            │     │
│   │                                                                    │     │
│   │   • Key generation (sk, pk, evk, gal, relin)                      │     │
│   │   • Encryption/Decryption                                          │     │
│   │   • Key switching                                                  │     │
│   │   • RGSW external product                                          │     │
│   └────────────────────────────┬──────────────────────────────────────┘     │
│                                │                                             │
│   ┌────────────────────────────▼──────────────────────────────────────┐     │
│   │                          Ring Layer                                │     │
│   │                                                                    │     │
│   │   • NTT/INTT (Number Theoretic Transform)                         │     │
│   │   • Polynomial arithmetic (add, sub, mul, mod)                    │     │
│   │   • RNS basis operations (extension, scaling)                     │     │
│   │   • Sampling (Gaussian, uniform, ternary)                         │     │
│   └────────────────────────────┬──────────────────────────────────────┘     │
│                                │                                             │
│   ┌────────────────────────────▼──────────────────────────────────────┐     │
│   │                      GPU Acceleration                              │     │
│   │                                                                    │     │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │     │
│   │   │ Pure Go     │ OR │ CGO + Metal │ OR │ CGO + CUDA  │          │     │
│   │   │ (Portable)  │    │ (Apple GPU) │    │ (NVIDIA)    │          │     │
│   │   └─────────────┘    └─────────────┘    └─────────────┘          │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ links to (CGO)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      luxcpp/lattice (C++ Library)                           │
│                                                                              │
│   • GPU kernels for NTT/INTT                                                │
│   • Metal backend (Apple Silicon)                                           │
│   • MLX integration for ML workloads                                        │
│   • Optimized CPU fallback                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ring Operations Interface

```go
// Package ring provides modular arithmetic for polynomials in cyclotomic rings.
package ring

// Ring represents R_Q = Z_Q[X]/(X^N + 1) in RNS representation.
type Ring struct {
    N          int        // Ring dimension (power of 2)
    Moduli     []uint64   // RNS moduli {q_0, q_1, ..., q_L}
    NthRoot    []uint64   // Primitive 2N-th roots of unity
    // internal state
}

// NewRing creates a ring with the given dimension and moduli.
func NewRing(N int, moduli []uint64) (*Ring, error)

// Poly represents a polynomial in RNS form.
type Poly struct {
    Coeffs [][]uint64  // Coeffs[i] = polynomial mod moduli[i]
}

// NewPoly allocates a zero polynomial.
func (r *Ring) NewPoly() *Poly

// NTT transforms polynomial to NTT domain (in-place).
func (r *Ring) NTT(p *Poly, level int)

// INTT transforms polynomial from NTT domain (in-place).
func (r *Ring) INTT(p *Poly, level int)

// MulCoeffsMontgomery multiplies two polynomials in NTT domain.
// result = a * b (element-wise in NTT domain)
func (r *Ring) MulCoeffsMontgomery(a, b, result *Poly, level int)

// Add computes result = a + b (mod Q).
func (r *Ring) Add(a, b, result *Poly)

// Sub computes result = a - b (mod Q).
func (r *Ring) Sub(a, b, result *Poly)

// MulScalar computes result = a * scalar (mod Q).
func (r *Ring) MulScalar(a *Poly, scalar uint64, result *Poly)
```

### Sampling Interface

```go
// Sampler defines the interface for polynomial sampling.
type Sampler interface {
    // Read samples a polynomial into p.
    Read(p *Poly)
}

// UniformSampler samples uniformly random coefficients.
type UniformSampler struct {
    ring   *Ring
    source io.Reader  // Cryptographic randomness source
}

func NewUniformSampler(ring *Ring, source io.Reader) *UniformSampler

// GaussianSampler samples from discrete Gaussian distribution.
type GaussianSampler struct {
    ring   *Ring
    sigma  float64    // Standard deviation
    bound  int        // Tail bound
    source io.Reader
}

func NewGaussianSampler(ring *Ring, sigma float64, source io.Reader) *GaussianSampler

// TernarySampler samples from {-1, 0, 1} with given density.
type TernarySampler struct {
    ring    *Ring
    density float64   // Probability of non-zero (typically 1/3)
    source  io.Reader
}

func NewTernarySampler(ring *Ring, density float64, source io.Reader) *TernarySampler
```

### RLWE Core Interface

```go
// Package rlwe provides Ring-Learning-With-Errors primitives.
package rlwe

// Parameters defines RLWE parameters.
type Parameters struct {
    ring       *ring.Ring
    N          int        // Ring dimension
    Q          []uint64   // Ciphertext moduli
    P          []uint64   // Key switching moduli
    Sigma      float64    // Error distribution parameter
    // derived parameters
}

// SecretKey is an RLWE secret key.
type SecretKey struct {
    Value *ring.Poly  // s ∈ R_Q with small coefficients
}

// PublicKey is an RLWE public key pk = (b, a) where b = -a*s + e.
type PublicKey struct {
    Value [2]*ring.Poly  // (b, a) ∈ R_Q^2
}

// Ciphertext is an RLWE ciphertext ct = (c_0, c_1) where m = c_0 + c_1*s.
type Ciphertext struct {
    Value []*ring.Poly
    Level int
    Scale float64  // For CKKS
}

// KeyGenerator generates RLWE keys.
type KeyGenerator struct {
    params *Parameters
}

// GenSecretKey generates a new secret key.
func (kg *KeyGenerator) GenSecretKey() *SecretKey

// GenPublicKey generates a public key for the given secret key.
func (kg *KeyGenerator) GenPublicKey(sk *SecretKey) *PublicKey

// GenRelinearizationKey generates relinearization key for degree reduction.
func (kg *KeyGenerator) GenRelinearizationKey(sk *SecretKey) *RelinearizationKey

// GenGaloisKeys generates Galois keys for slot rotations.
func (kg *KeyGenerator) GenGaloisKeys(sk *SecretKey, elts []uint64) *GaloisKeys

// Encryptor encrypts plaintexts.
type Encryptor struct {
    params *Parameters
    pk     *PublicKey
}

// Encrypt encrypts a plaintext.
func (enc *Encryptor) Encrypt(pt *Plaintext) *Ciphertext

// Decryptor decrypts ciphertexts.
type Decryptor struct {
    params *Parameters
    sk     *SecretKey
}

// Decrypt decrypts a ciphertext.
func (dec *Decryptor) Decrypt(ct *Ciphertext) *Plaintext
```

### Homomorphic Encryption Schemes

```go
// Package bgv implements the BGV homomorphic encryption scheme.
package bgv

// Evaluator performs homomorphic operations on BGV ciphertexts.
type Evaluator struct {
    params *Parameters
    rlk    *RelinearizationKey
    galks  *GaloisKeys
}

// Add computes result = ct0 + ct1.
func (eval *Evaluator) Add(ct0, ct1, result *Ciphertext)

// Mul computes result = ct0 * ct1.
// Requires relinearization afterward to reduce ciphertext degree.
func (eval *Evaluator) Mul(ct0, ct1, result *Ciphertext)

// Relinearize reduces ciphertext degree from 3 to 2.
func (eval *Evaluator) Relinearize(ct, result *Ciphertext)

// Rescale reduces ciphertext modulus (noise management).
func (eval *Evaluator) Rescale(ct, result *Ciphertext)

// RotateColumns rotates plaintext slots.
func (eval *Evaluator) RotateColumns(ct *Ciphertext, k int, result *Ciphertext)

// RotateRows rotates rows (conjugation).
func (eval *Evaluator) RotateRows(ct, result *Ciphertext)
```

```go
// Package ckks implements approximate arithmetic on encrypted data.
package ckks

// Encoder encodes/decodes complex vectors to/from plaintexts.
type Encoder struct {
    params *Parameters
}

// Encode encodes a complex vector into a plaintext.
func (enc *Encoder) Encode(values []complex128, scale float64) *Plaintext

// Decode decodes a plaintext into a complex vector.
func (enc *Encoder) Decode(pt *Plaintext) []complex128

// Evaluator performs approximate arithmetic on CKKS ciphertexts.
type Evaluator struct {
    params *Parameters
    rlk    *RelinearizationKey
    galks  *GaloisKeys
}

// Add, Mul, Rescale, Rotate same as BGV but with scale tracking.

// Bootstrap refreshes a ciphertext by homomorphically decrypting and re-encrypting.
// Requires bootstrapping keys (large evaluation keys).
func (eval *Evaluator) Bootstrap(ct *Ciphertext) *Ciphertext
```

### Multiparty Protocols

```go
// Package multiparty implements threshold/distributed homomorphic encryption.
package multiparty

// CRS is a Common Reference String shared by all parties.
type CRS struct {
    Seed []byte
}

// DKGProtocol implements distributed key generation.
type DKGProtocol struct {
    params *rlwe.Parameters
    crs    *CRS
}

// Round1 generates party's share and public commitment.
func (dkg *DKGProtocol) Round1(partyID int) (*Share, *Commitment)

// Round2 aggregates commitments and generates final shares.
func (dkg *DKGProtocol) Round2(shares []*Share, commitments []*Commitment) (*SecretKeyShare, *PublicKey)

// ThresholdDecryptor performs t-of-n threshold decryption.
type ThresholdDecryptor struct {
    params    *rlwe.Parameters
    threshold int
    numParties int
}

// PartialDecrypt generates a partial decryption share.
func (td *ThresholdDecryptor) PartialDecrypt(ct *Ciphertext, skShare *SecretKeyShare) *DecryptionShare

// Combine combines t partial decryptions to recover plaintext.
func (td *ThresholdDecryptor) Combine(ct *Ciphertext, shares []*DecryptionShare) *Plaintext

// CollectiveBootstrap refreshes a ciphertext using secret-shared keys.
type CollectiveBootstrap struct {
    params    *rlwe.Parameters
    threshold int
}

// RefreshShare generates party's contribution to collective refresh.
func (cb *CollectiveBootstrap) RefreshShare(ct *Ciphertext, skShare *SecretKeyShare) *RefreshShare

// Aggregate combines refresh shares.
func (cb *CollectiveBootstrap) Aggregate(ct *Ciphertext, shares []*RefreshShare) *Ciphertext
```

### GPU Acceleration (CGO Bindings)

```go
// Package gpu provides GPU-accelerated lattice operations.
// Build with CGO enabled for hardware acceleration.
package gpu

// GPUAvailable returns true if GPU acceleration is available.
func GPUAvailable() bool

// GetBackend returns the active backend ("Metal", "CUDA", or "CPU").
func GetBackend() string

// NTTContext holds precomputed data for GPU-accelerated NTT.
type NTTContext struct {
    // internal
}

// NewNTTContext creates a context for ring dimension N and modulus Q.
// N must be power of 2, Q must be NTT-friendly (Q ≡ 1 mod 2N).
func NewNTTContext(N uint32, Q uint64) (*NTTContext, error)

// Close releases GPU resources.
func (ctx *NTTContext) Close()

// NTT performs forward NTT on polynomials.
func (ctx *NTTContext) NTT(polys [][]uint64) ([][]uint64, error)

// INTT performs inverse NTT on polynomials.
func (ctx *NTTContext) INTT(polys [][]uint64) ([][]uint64, error)

// PolyMul multiplies polynomials using GPU-accelerated NTT.
func (ctx *NTTContext) PolyMul(a, b [][]uint64) ([][]uint64, error)

// PolyMulNTT performs element-wise multiplication in NTT domain.
func (ctx *NTTContext) PolyMulNTT(a, b []uint64) ([]uint64, error)

// Sampling operations
func SampleGaussian(N uint32, Q uint64, sigma float64, seed []byte) ([]uint64, error)
func SampleUniform(N uint32, Q uint64, seed []byte) ([]uint64, error)
func SampleTernary(N uint32, Q uint64, density float64, seed []byte) ([]uint64, error)
```

### C++ Interface (luxcpp/lattice)

```cpp
// luxcpp/lattice/include/lattice.h

#pragma once

#include <cstdint>
#include <vector>

namespace lux {
namespace lattice {

// Check if GPU is available
bool gpu_available();

// Get active backend name
const char* get_backend();

// NTT context for a specific ring
class NTTContext {
public:
    NTTContext(uint32_t N, uint64_t Q);
    ~NTTContext();

    // Forward NTT
    void ntt_forward(uint64_t* data, uint32_t batch = 1);

    // Inverse NTT
    void ntt_inverse(uint64_t* data, uint32_t batch = 1);

    // Element-wise multiplication in NTT domain
    void mul_ntt(uint64_t* result, const uint64_t* a, const uint64_t* b);

    // Full polynomial multiplication (NTT + mul + INTT)
    void poly_mul(uint64_t* result, const uint64_t* a, const uint64_t* b);

    uint32_t N() const;
    uint64_t Q() const;

private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};

// Polynomial arithmetic
void poly_add(uint64_t* result, const uint64_t* a, const uint64_t* b,
              uint32_t N, uint64_t Q);
void poly_sub(uint64_t* result, const uint64_t* a, const uint64_t* b,
              uint32_t N, uint64_t Q);
void poly_scalar_mul(uint64_t* result, const uint64_t* a, uint64_t scalar,
                     uint32_t N, uint64_t Q);

// Sampling
void sample_gaussian(uint64_t* result, uint32_t N, uint64_t Q,
                     double sigma, const uint8_t* seed);
void sample_uniform(uint64_t* result, uint32_t N, uint64_t Q,
                    const uint8_t* seed);
void sample_ternary(uint64_t* result, uint32_t N, uint64_t Q,
                    double density, const uint8_t* seed);

// Utility
uint64_t find_primitive_root(uint32_t N, uint64_t Q);
uint64_t mod_inverse(uint64_t a, uint64_t Q);
bool is_ntt_prime(uint32_t N, uint64_t Q);

} // namespace lattice
} // namespace lux
```

### Performance Benchmarks

| Operation | Size | Pure Go | Metal (M3 Max) | CUDA (RTX 4090) | Speedup |
|-----------|------|---------|----------------|-----------------|---------|
| NTT Forward | N=2^16 | 8.2 ms | 0.18 ms | 0.12 ms | 45-68x |
| NTT Inverse | N=2^16 | 9.1 ms | 0.19 ms | 0.13 ms | 48-70x |
| Poly Mul | N=2^16 | 28 ms | 0.6 ms | 0.4 ms | 47-70x |
| NTT Forward | N=2^14 | 1.8 ms | 0.08 ms | 0.05 ms | 22-36x |
| BGV Encrypt | N=2^15 | 45 ms | 2.1 ms | 1.4 ms | 21-32x |
| BGV Mul+Relin | N=2^15 | 180 ms | 8.5 ms | 5.8 ms | 21-31x |
| CKKS Bootstrap | N=2^16 | 12.5 s | 450 ms | 310 ms | 28-40x |

### Parameter Sets

Standard parameter sets for different security levels:

```go
// 128-bit security parameters
var PN12QP109 = Parameters{
    N:      1 << 12,  // 4096
    Q:      []uint64{0x7fffffffe0001, 0x80000001c0001}, // ~109 bits
    P:      []uint64{0x8000016001},
    Sigma:  3.2,
}

// 128-bit security with larger ring (more slots)
var PN13QP218 = Parameters{
    N:      1 << 13,  // 8192
    Q:      []uint64{0x7fffffffe0001, 0x80000001c0001,
                     0x80000002c0001, 0x7ffffffef0001}, // ~218 bits
    P:      []uint64{0x8000016001, 0x80000140001},
    Sigma:  3.2,
}

// 128-bit security for bootstrapping
var PN14QP438 = Parameters{
    N:      1 << 14,  // 16384
    // Larger modulus chain for bootstrapping depth
    Sigma:  3.2,
}

// 256-bit post-quantum security
var PN15QP880PQ = Parameters{
    N:      1 << 15,  // 32768
    // Expanded parameters for post-quantum security
    Sigma:  3.2,
}
```

### Composition Rules

This library depends on `luxcpp/gpu` (LP-5700) for GPU acceleration:

```
luxcpp/gpu          ← Foundation (Metal/CUDA/CPU)
     ▲
     │ NTT, FFT, array ops
     │
luxcpp/lattice      ← Uses gpu for NTT acceleration
     ▲
     │ CGO bindings
     │
lux/lattice         ← Go library with optional GPU
     ▲
     │ provides ring operations
     │
lux/fhe             ← FHE-specific APIs (LP-5702)
```

**Dependency Rule**: `lux/lattice` can run standalone (pure Go) or with GPU acceleration (CGO + luxcpp/lattice).

## Rationale

### Why Pure Go with Optional CGO?

1. **Portability**: Pure Go compiles to WASM for browser-based FHE
2. **Performance**: CGO binding to C++ provides near-native GPU performance
3. **Flexibility**: Developers choose based on deployment environment
4. **Testing**: Pure Go ensures correctness; CGO provides speed

### Why Full-RNS?

1. **Arbitrary Precision**: Handle large ciphertext moduli via Chinese Remainder Theorem
2. **Parallelization**: Each RNS component computes independently
3. **No Arbitrary Precision**: Avoids big integer arithmetic
4. **Proven**: Industry standard for modern FHE implementations

### Why BGV, BFV, and CKKS?

- **BGV/BFV**: Exact integer arithmetic for voting, PIR, private set intersection
- **CKKS**: Approximate arithmetic for ML inference, statistics, financial modeling
- All three share the RLWE foundation, minimizing code duplication

## Backwards Compatibility

New library. No backwards compatibility concerns.

## Test Cases

### Ring Tests

1. NTT forward/inverse roundtrip preserves polynomial
2. Polynomial multiplication matches schoolbook multiplication
3. RNS basis extension is exact
4. Scaling introduces expected precision loss

### RLWE Tests

1. Encryption/decryption roundtrip
2. Public key has correct noise distribution
3. Relinearization key enables degree reduction
4. Galois keys enable correct slot rotations

### Scheme Tests (BGV/CKKS)

1. Homomorphic addition is correct
2. Homomorphic multiplication is correct
3. Rescaling manages noise correctly
4. Bootstrap refreshes ciphertext

### Multiparty Tests

1. DKG produces correct collective public key
2. Threshold decryption with t parties succeeds
3. Threshold decryption with t-1 parties fails
4. Collective bootstrap maintains security

### GPU Tests

1. GPU NTT matches pure Go NTT
2. GPU polynomial multiplication is correct
3. Backend detection works on supported platforms
4. Graceful fallback to CPU when GPU unavailable

## Reference Implementation

### Repository Structure

```
lux/lattice/
├── go.mod
├── lattice.go           # Package entry point
├── ring/
│   ├── ring.go          # Ring definition
│   ├── ntt.go           # NTT operations (50KB)
│   ├── operations.go    # Polynomial arithmetic
│   ├── sampler.go       # Sampling interface
│   ├── sampler_gaussian.go
│   ├── sampler_uniform.go
│   ├── sampler_ternary.go
│   └── ringqp/          # Ring with auxiliary modulus
├── core/
│   └── rlwe/            # RLWE primitives
├── schemes/
│   ├── bfv/             # BFV scheme
│   ├── bgv/             # BGV scheme
│   └── ckks/            # CKKS scheme
├── multiparty/
│   ├── multiparty.go    # Common types
│   ├── keygen_*.go      # Distributed key generation
│   ├── threshold.go     # Threshold protocols
│   ├── mpbgv/           # Multiparty BGV
│   └── mpckks/          # Multiparty CKKS
├── circuits/            # Homomorphic circuits
│   ├── bgv/
│   └── ckks/
├── gpu/
│   ├── gpu.go           # CGO bindings (with build tag)
│   └── gpu_nocgo.go     # Pure Go fallback
├── utils/
│   ├── bignum/          # Arbitrary precision
│   ├── buffer/          # Serialization
│   └── sampling/        # Secure randomness
└── examples/
    └── ...

luxcpp/lattice/
├── CMakeLists.txt
├── include/
│   └── lattice.h
└── src/
    └── lattice.cpp      # GPU-accelerated implementations
```

### Go Module

```
module github.com/luxfi/lattice

go 1.22
```

## Security Considerations

### Side-Channel Resistance

- **Constant-time NTT**: Data-independent memory access patterns
- **Constant-time sampling**: Rejection sampling without timing leaks
- **Montgomery reduction**: Constant-time modular arithmetic

### Error Distribution

- Gaussian noise parameter σ chosen for statistical indistinguishability
- Tail bound enforced during sampling
- Noise flooding for multiparty protocols

### Key Management

- Secret keys are ternary polynomials (small coefficients)
- Public keys statistically hide secret keys
- Evaluation keys contain encrypted secret key powers

### Implementation Security

- No raw pointer exposure in Go API
- Memory zeroing for sensitive data
- Thread-safe context management

