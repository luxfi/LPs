---
lp: 5704
title: Composable Cryptographic Architecture
description: Unified architecture for GPU-accelerated lattice, FHE, and threshold cryptography
author: Lux Core Team
discussions-to: https://github.com/luxfi/LPs/discussions/5704
status: Final
type: Standards Track
category: Core
created: 2025-12-30
requires: [5700, 5701, 5702, 5703]
---

# LP-5704: Composable Cryptographic Architecture

## Abstract

This LP specifies the composable cryptographic architecture that unifies GPU acceleration (LP-5700), lattice cryptography (LP-5701), fully homomorphic encryption (LP-5702), and threshold cryptography (LP-5703) into a cohesive system. The architecture follows a strict one-way dependency hierarchy with C++ foundations and Go application interfaces.

## Motivation

Modern cryptographic applications require:

- **Performance**: GPU-accelerated primitives for production throughput
- **Composability**: Libraries that build on each other without circular dependencies
- **Portability**: Same APIs across Metal (Apple), CUDA (NVIDIA), and CPU
- **Security**: Post-quantum readiness and threshold key management
- **Integration**: Seamless blockchain and smart contract integration

This architecture provides:

1. **Single Source of Truth**: One NTT implementation used by all higher-level libraries
2. **Layered Design**: Clear separation between C++ performance layer and Go application layer
3. **Flexible Deployment**: GPU when available, CPU fallback everywhere
4. **Future-Proof**: Post-quantum primitives integrated at the foundation

## Specification

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │   lux/node   │  │ thresholdvm  │  │    fhEVM     │  │Smart Contracts│  │
│   │  Blockchain  │  │  Threshold   │  │   FHE on     │  │  Solidity +   │  │
│   │    Node      │  │  Signing VM  │  │    EVM       │  │   Libraries   │  │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│          │                 │                 │                 │            │
└──────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
           │                 │                 │                 │
           ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GO LIBRARY LAYER                                │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    lux/threshold (LP-5703)                            │  │
│   │            *** HIGH-LEVEL ORCHESTRATION LAYER ***                     │  │
│   │                                                                       │  │
│   │   The meeting point for ALL threshold protocols:                      │  │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │  │
│   │   │ Threshold   │ │ Threshold   │ │ Threshold   │ │ Threshold   │    │  │
│   │   │ Signatures  │ │    FHE      │ │  Resharing  │ │ Post-Quantum│    │  │
│   │   │ CMP/FROST   │ │ Decryption  │ │    LSS      │ │  Ringtail   │    │  │
│   │   │ Doerner/BLS │ │ Collective  │ │  Dynamic    │ │  Lattice    │    │  │
│   │   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘    │  │
│   │          │               │               │               │           │  │
│   └──────────┼───────────────┼───────────────┼───────────────┼───────────┘  │
│              │               │               │               │               │
│              ▼               ▼               ▼               ▼               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       PRIMITIVE LAYER                                │   │
│   │                                                                      │   │
│   │   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │   │
│   │   │   lux/fhe        │  │   lux/crypto     │  │  lux/lattice    │   │   │
│   │   │   (LP-5702)      │  │   (LP-5705)      │  │  (LP-5701)      │   │   │
│   │   │                  │  │                  │  │                 │   │   │
│   │   │ • Boolean gates  │  │ • ECDSA/EdDSA    │  │ • Ring/NTT ops  │   │   │
│   │   │ • Integer ops    │  │ • BLS signatures │  │ • BGV/BFV/CKKS  │   │   │
│   │   │ • GPU engine     │  │ • Pairings       │  │ • Multiparty    │   │   │
│   │   │ • Encrypt/Decrypt│  │ • Post-quantum   │  │ • Sampling      │   │   │
│   │   └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘   │   │
│   │            └─────────────────────┴─────────────────────┘             │   │
│   │                                  │                                   │   │
│   └──────────────────────────────────┼───────────────────────────────────┘   │
│                                      │ all use lux/lattice as foundation     │
└──────────────────────────────────────┼───────────────────────────────────────┘
                                       │ CGO bindings (optional)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              C++ LIBRARY LAYER                               │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        luxcpp/fhe (OpenFHE fork)                      │  │
│   │   Advanced FHE operations, MLX GPU backend                           │  │
│   └───────────────────────────────┬──────────────────────────────────────┘  │
│                                   │ links                                    │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        luxcpp/lattice (LP-5701)                       │  │
│   │   GPU-accelerated NTT, polynomial ops, sampling                      │  │
│   └───────────────────────────────┬──────────────────────────────────────┘  │
│                                   │ links                                    │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        luxcpp/crypto (LP-5705)                        │  │
│   │   GPU-accelerated BLS pairings, curve operations                     │  │
│   └───────────────────────────────┬──────────────────────────────────────┘  │
│                                   │ links                                    │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        luxcpp/gpu (LP-5700)                           │  │
│   │   Metal/CUDA/CPU backends, NTT, FFT, array ops                       │  │
│   │   FOUNDATION LAYER - NO DEPENDENCIES                                 │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Composition Rules

**CRITICAL**: `lux/threshold` is the HIGH-LEVEL meeting point that orchestrates ALL threshold protocols.

Dependencies flow ONE WAY only (upward in the diagram):

```
luxcpp/gpu          ← Foundation (NO DEPENDENCIES)
     ▲
     │ links to
     │
luxcpp/lattice      ← Uses gpu for NTT acceleration
luxcpp/crypto       ← Uses gpu for BLS pairings
luxcpp/fhe          ← Uses lattice for polynomial ops
     ▲
     │ CGO bindings
     │
lux/lattice         ← Pure Go + optional GPU via CGO (PRIMITIVE FOUNDATION)
     ▲
     │ uses
     │
lux/crypto          ← Uses lattice for post-quantum primitives
lux/fhe             ← Uses lattice for FHE primitives (NO threshold logic)
     ▲
     │ uses primitives from below
     │
lux/threshold       ← HIGH-LEVEL: orchestrates ALL threshold protocols
     │                 • Threshold ECDSA (CMP) - uses lux/crypto
     │                 • Threshold Schnorr (FROST) - uses lux/crypto
     │                 • Threshold FHE - uses lux/fhe primitives
     │                 • Threshold BLS - uses lux/crypto
     │                 • Dynamic Resharing (LSS)
     │                 • Post-Quantum (Ringtail) - uses lux/lattice
     ▲
     │ imports
     │
Applications        ← lux/node, thresholdvm, fhEVM, smart contracts
```

**KEY INSIGHT**: Applications consume `lux/threshold` for ALL threshold operations:
- Want threshold ECDSA? → `lux/threshold/protocols/cmp`
- Want threshold FHE decryption? → `lux/threshold/protocols/tfhe`
- Want dynamic key resharing? → `lux/threshold/protocols/lss`
- Want threshold BLS aggregation? → `lux/threshold/protocols/bls`

**FORBIDDEN**:
- ❌ lux/fhe depending on lux/threshold (FHE provides primitives, not threshold logic)
- ❌ lux/lattice depending on lux/fhe or lux/threshold
- ❌ Any circular dependencies

### Layer Specifications

#### Foundation Layer: luxcpp/gpu (LP-5700)

The GPU layer is the foundation with NO external dependencies (except Metal/CUDA SDKs):

```cpp
// Core primitives provided by luxcpp/gpu
namespace lux::gpu {
    // Device management
    bool available();
    const char* get_backend();  // "Metal", "CUDA", "CPU"
    std::vector<Device> enumerate_devices();

    // Array operations (generic GPU compute)
    Array fft(const Array& input);
    Array ifft(const Array& input);
    Array ntt(const Array& input, uint64_t modulus);
    Array intt(const Array& input, uint64_t modulus);
    Array matmul(const Array& a, const Array& b);

    // Memory management
    void* allocate(size_t size, MemoryType type);
    void free(void* ptr);
    void copy(void* dst, const void* src, size_t size);
}
```

#### Lattice Layer: luxcpp/lattice + lux/lattice (LP-5701)

```cpp
// luxcpp/lattice uses luxcpp/gpu for NTT
#include <lux/gpu/ntt.h>  // From luxcpp/gpu

namespace lux::lattice {
    class NTTContext {
        lux::gpu::NTTContext* gpu_ctx;  // GPU acceleration
    public:
        void ntt_forward(uint64_t* data, uint32_t batch);
        void ntt_inverse(uint64_t* data, uint32_t batch);
    };
}
```

```go
// lux/lattice has optional CGO to luxcpp/lattice
// +build cgo

import "C"

// When CGO enabled, uses GPU acceleration
func (ctx *NTTContext) NTT(polys [][]uint64) ([][]uint64, error) {
    // Calls C.lattice_ntt_forward which uses luxcpp/gpu
}

// When CGO disabled, pure Go implementation
func (ctx *NTTContext) NTT(polys [][]uint64) ([][]uint64, error) {
    // Pure Go NTT using ring.NTT from lux/lattice/ring
}
```

#### Crypto Layer: luxcpp/crypto + lux/crypto

```cpp
// luxcpp/crypto uses luxcpp/gpu for pairing operations
#include <lux/gpu/array.h>  // From luxcpp/gpu

namespace lux::crypto {
    class BLS12381 {
    public:
        // GPU-accelerated pairing
        static Array pairing(const Array& g1, const Array& g2);

        // GPU-accelerated multi-scalar multiplication
        static Array msm(const Array& scalars, const Array& points);
    };
}
```

```go
// lux/crypto uses lux/lattice for post-quantum
import (
    "github.com/luxfi/lattice/v7/ring"
    "github.com/luxfi/lattice/v7/schemes/ckks"
)

// Post-quantum signature using lattice operations
type MLDSAKey struct {
    ring *ring.Ring
    // ...
}
```

#### FHE Layer: luxcpp/fhe + lux/fhe (LP-5702)

```cpp
// luxcpp/fhe (OpenFHE fork) uses luxcpp/lattice
#include <lux/lattice/ntt.h>  // From luxcpp/lattice

namespace lbcrypto {
    class CryptoContext {
        lux::lattice::NTTContext* ntt;  // NTT from lattice layer
    public:
        Ciphertext Encrypt(const Plaintext& pt);
        Plaintext Decrypt(const Ciphertext& ct);
    };
}
```

```go
// lux/fhe uses lux/lattice directly
import (
    "github.com/luxfi/lattice/v7/core/rlwe"
    "github.com/luxfi/lattice/v7/core/rgsw/blindrot"
    "github.com/luxfi/lattice/v7/ring"
)

type BootstrapKey struct {
    BRK blindrot.BlindRotationEvaluationKeySet  // From lattice
}
```

#### Threshold Layer: lux/threshold (LP-5703)

```go
// lux/threshold uses lux/crypto and lux/lattice
import (
    "github.com/luxfi/crypto/bls"        // BLS signatures
    "github.com/luxfi/crypto/ecdsa"      // ECDSA
    "github.com/luxfi/lattice/v7/ring"   // For Ringtail PQ signatures
)

// CMP uses ECDSA from crypto
type CMPConfig struct {
    PublicKey *ecdsa.PublicKey
}

// Ringtail uses lattice for PQ security
type RingtailConfig struct {
    ring *ring.Ring
}
```

### Build Configuration

#### CMake Dependency Graph

```cmake
# luxcpp/gpu/CMakeLists.txt
project(LuxGPU)
add_library(gpu ...)
# NO dependencies except Metal/CUDA

# luxcpp/lattice/CMakeLists.txt
project(LuxLattice)
find_package(LuxGPU REQUIRED)  # Depends on gpu
add_library(lattice ...)
target_link_libraries(lattice PUBLIC Lux::gpu)

# luxcpp/crypto/CMakeLists.txt
project(LuxCrypto)
find_package(LuxGPU REQUIRED)  # Depends on gpu
add_library(crypto ...)
target_link_libraries(crypto PUBLIC Lux::gpu)

# luxcpp/fhe/CMakeLists.txt
project(LuxFHE)
find_package(LuxLattice REQUIRED)  # Depends on lattice
add_library(fhe ...)
target_link_libraries(fhe PUBLIC Lux::lattice)
```

#### Go Module Dependencies

```
// lux/lattice/go.mod - FOUNDATION (no Lux deps)
module github.com/luxfi/lattice
go 1.22
// No luxfi dependencies - standalone foundation

// lux/crypto/go.mod - PRIMITIVE
module github.com/luxfi/crypto
go 1.22
require github.com/luxfi/lattice/v7 v6.0.0

// lux/fhe/go.mod - PRIMITIVE (no threshold logic here!)
module github.com/luxfi/fhe
go 1.22
require github.com/luxfi/lattice/v7 v6.0.0
// NOTE: lux/fhe does NOT import lux/threshold
// It provides FHE primitives that threshold consumes

// lux/threshold/go.mod - HIGH-LEVEL ORCHESTRATION
module github.com/luxfi/threshold
go 1.22
require (
    github.com/luxfi/crypto v1.0.0     // For ECDSA, BLS, EdDSA
    github.com/luxfi/fhe v1.0.0        // For threshold FHE decryption
    github.com/luxfi/lattice/v7 v6.0.0 // For Ringtail, multiparty
)
// lux/threshold is the HIGH-LEVEL package that:
// - Orchestrates all threshold protocols
// - Consumes primitives from crypto, fhe, lattice
// - Provides unified API for applications
```

### T-Chain Integration (thresholdvm)

The T-Chain (Threshold VM) uses `lux/threshold` as its unified interface for ALL threshold operations:

```go
// lux/node/vms/thresholdvm/vm.go
package thresholdvm

import (
    "github.com/luxfi/threshold/protocols/cmp"      // Threshold ECDSA
    "github.com/luxfi/threshold/protocols/frost"    // Threshold Schnorr
    "github.com/luxfi/threshold/protocols/lss"      // Dynamic resharing
    "github.com/luxfi/threshold/protocols/bls"      // Threshold BLS
    "github.com/luxfi/threshold/protocols/tfhe"     // Threshold FHE
    "github.com/luxfi/threshold/protocols/ringtail" // Post-quantum
    "github.com/luxfi/threshold/protocols/adapters" // Chain adapters
)

// ThresholdVM provides unified threshold operations for all schemes
type ThresholdVM struct {
    // Protocol handlers - all from lux/threshold
    cmp      *cmp.Protocol
    frost    *frost.Protocol
    lss      *lss.Protocol
    bls      *bls.Protocol
    tfhe     *tfhe.Protocol
    ringtail *ringtail.Protocol

    // Chain adapters for multi-chain signing
    adapters map[string]adapters.Adapter
}

// Sign dispatches to the appropriate threshold protocol
func (vm *ThresholdVM) Sign(req *SignRequest) (*Signature, error) {
    switch req.Scheme {
    case SchemeECDSA:
        return vm.cmp.Sign(req.Message, req.Signers)
    case SchemeSchnorr:
        return vm.frost.Sign(req.Message, req.Signers)
    case SchemeBLS:
        return vm.bls.Sign(req.Message, req.Signers)
    case SchemePostQuantum:
        return vm.ringtail.Sign(req.Message, req.Signers)
    }
}

// ThresholdDecrypt performs threshold FHE decryption
func (vm *ThresholdVM) ThresholdDecrypt(ct *fhe.Ciphertext, signers []party.ID) (*fhe.Plaintext, error) {
    return vm.tfhe.Decrypt(ct, signers)
}

// Reshare dynamically updates the threshold scheme
func (vm *ThresholdVM) Reshare(req *ReshareRequest) error {
    return vm.lss.Reshare(req.OldConfigs, req.NewParties, req.NewThreshold)
}
```

**Unified API Pattern**:

```go
// Application code uses lux/threshold for everything
import "github.com/luxfi/threshold"

// Single entry point for all threshold operations
manager := threshold.NewManager(config)

// Threshold signing (any scheme)
sig, _ := manager.Sign(threshold.SignRequest{
    Scheme:  threshold.SchemeECDSA,
    Chain:   "ethereum",
    Message: txHash,
    Signers: validatorSet,
})

// Threshold FHE decryption
plaintext, _ := manager.ThresholdDecrypt(ciphertext, decryptors)

// Dynamic resharing
manager.Reshare(oldParties, newParties, newThreshold)
```

### GPU Backend Selection

Runtime backend selection based on availability:

```cpp
// luxcpp/gpu/src/backend.cpp
namespace lux::gpu {

Backend detect_backend() {
    #if defined(__APPLE__)
    if (metal_available()) return Backend::Metal;
    #endif

    #if defined(WITH_CUDA)
    if (cuda_available()) return Backend::CUDA;
    #endif

    return Backend::CPU;
}

} // namespace lux::gpu
```

```go
// lux/lattice/gpu/backend.go
func detectBackend() string {
    if GPUAvailable() {
        return GetBackend()  // "Metal" or "CUDA"
    }
    return "CPU"
}
```

### Integration Patterns

#### Pattern 1: Application using FHE with GPU

```go
import (
    "github.com/luxfi/fhe"
    "github.com/luxfi/fhe/gpu"
)

func main() {
    // GPU FHE engine auto-detects backend
    engine, _ := gpu.New(gpu.DefaultConfig())
    defer engine.Close()

    fmt.Printf("Backend: %s\n", engine.GetStats().Backend)
    // Output: Backend: Metal (on Apple Silicon)

    // FHE operations use GPU automatically
    params, _ := fhe.NewParametersFromLiteral(fhe.PN10QP27)
    // ... operations use GPU via lattice → gpu chain
}
```

#### Pattern 2: Threshold signing with post-quantum

```go
import (
    "github.com/luxfi/threshold/protocols/cmp"
    "github.com/luxfi/threshold/protocols/ringtail"
)

func main() {
    // Classical threshold signing
    configs := cmp.Keygen(curve.Secp256k1{}, selfID, parties, threshold, pool)
    sig := cmp.Sign(config, signers, message, pool)

    // Wrap with post-quantum protection
    pqAdapter := ringtail.NewAdapter(ringtail.Security256, "cmp")
    pqSig, _ := pqAdapter.WrapSignature(sig)
    // pqSig is quantum-resistant
}
```

#### Pattern 3: Pure Go deployment (WASM compatible)

```go
// +build !cgo

import "github.com/luxfi/lattice/v7/ring"

func main() {
    // Pure Go lattice operations (no GPU)
    r, _ := ring.NewRing(1<<12, []uint64{0x7fffffffe0001})
    p := r.NewPoly()

    // All operations use pure Go
    r.NTT(p, 0)   // Pure Go NTT
    r.INTT(p, 0)  // Pure Go INTT

    // Works in WASM, serverless, containers without GPU
}
```

### Performance Tiers

| Tier | Configuration | Throughput | Use Case |
|------|--------------|------------|----------|
| **GPU** | Metal/CUDA + CGO | 100K+ ops/sec | Production servers |
| **CPU (Go)** | Pure Go | 1K ops/sec | Containers, serverless |
| **WASM** | Pure Go → WASM | 100 ops/sec | Browser clients |

### Directory Structure

```
luxcpp/
├── gpu/                    # LP-5700: Foundation
│   ├── CMakeLists.txt
│   ├── include/
│   │   └── gpu.h
│   ├── src/
│   │   ├── device.cpp
│   │   ├── array.cpp
│   │   ├── ntt.cpp
│   │   ├── fft.cpp
│   │   ├── metal/
│   │   │   ├── backend.mm
│   │   │   └── kernels.metal
│   │   └── cuda/
│   │       ├── backend.cu
│   │       └── kernels.cu
│   └── go/
│       ├── gpu.go
│       └── gpu_cgo.go
├── lattice/                # LP-5701 (C++ part)
│   ├── CMakeLists.txt
│   ├── include/
│   │   └── lattice.h
│   └── src/
│       └── lattice.cpp
├── crypto/                 # LP-5705 (C++ part)
│   ├── CMakeLists.txt
│   └── ...
└── fhe/                    # LP-5702 (C++ part)
    ├── CMakeLists.txt
    └── ...

lux/
├── lattice/               # LP-5701 (Go part)
│   ├── go.mod
│   ├── ring/
│   ├── schemes/
│   ├── multiparty/
│   └── gpu/               # CGO bindings
├── crypto/                # LP-5705 (Go part)
│   ├── go.mod
│   └── ...
├── threshold/             # LP-5703
│   ├── go.mod
│   └── protocols/
│       ├── cmp/
│       ├── frost/
│       ├── lss/
│       └── ringtail/
└── fhe/                   # LP-5702 (Go part)
    ├── go.mod
    └── ...
```

## Rationale

### Why Layered Architecture?

1. **Maintainability**: Each layer has clear responsibilities
2. **Testability**: Layers can be tested in isolation
3. **Performance**: GPU optimizations in one place benefit all
4. **Flexibility**: GPU/CPU choice at deployment time

### Why C++ Foundation?

1. **GPU Access**: Metal/CUDA require native code
2. **Performance**: Critical inner loops in optimized C++
3. **Maturity**: Battle-tested GPU libraries

### Why Go Application Layer?

1. **Lux Ecosystem**: Lux Network primarily uses Go
2. **Safety**: Memory-safe application code
3. **Portability**: Easy cross-compilation
4. **WASM**: Browser deployment possible

### Why One-Way Dependencies?

1. **Avoids Cycles**: Clear dependency order
2. **Incremental Builds**: Changes don't cascade unnecessarily
3. **Reasoning**: Easy to understand what depends on what

## Backwards Compatibility

New architecture. No backwards compatibility concerns.

## Test Cases

### Dependency Tests

1. luxcpp/gpu compiles with no external Lux dependencies
2. luxcpp/lattice links only to luxcpp/gpu
3. luxcpp/crypto links only to luxcpp/gpu
4. luxcpp/fhe links only to luxcpp/lattice
5. No circular dependencies in Go modules

### Integration Tests

1. GPU NTT produces same result as pure Go NTT
2. FHE operations work with GPU and CPU backends
3. Threshold signing works end-to-end
4. WASM build succeeds and runs correctly

### Performance Tests

1. GPU provides ≥10x speedup over CPU for NTT
2. FHE gate throughput meets targets on each backend
3. Threshold signing meets latency targets

## Reference Implementation

See individual LPs for detailed implementations:
- **LP-5700**: GPU Acceleration Layer (`luxcpp/gpu`)
- **LP-5701**: Lattice Cryptography (`luxcpp/lattice`, `lux/lattice`)
- **LP-5702**: FHE Implementation (`luxcpp/fhe`, `lux/fhe`)
- **LP-5703**: Threshold Cryptography (`lux/threshold`)

## Security Considerations

### Supply Chain

- Minimal dependencies at each layer
- All crypto primitives audited
- No dynamic library loading in production

### Side-Channel Resistance

- Constant-time operations in crypto layer
- GPU operations inherently parallel (less timing variance)
- Memory isolation between users in multi-tenant scenarios

### Key Material

- Secret keys never leave secure boundary
- GPU memory cleared after use
- Threshold keys distributed across parties

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
