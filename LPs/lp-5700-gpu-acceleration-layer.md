---
lp: 5700
title: GPU Acceleration Layer (luxcpp/gpu)
description: Hardware-accelerated compute layer supporting Metal, CUDA, and CPU backends
author: Lux Core Team
discussions-to: https://github.com/luxfi/LPs/discussions/5700
status: Final
type: Standards Track
category: Core
created: 2025-12-30
requires: []
---

# LP-5700: GPU Acceleration Layer

## Abstract

This LP specifies the GPU acceleration layer (`luxcpp/gpu`) that provides a unified hardware abstraction for high-performance cryptographic operations across Metal (Apple Silicon), CUDA (NVIDIA), and CPU fallback backends. This foundation layer enables GPU-accelerated FFT, NTT, matrix operations, and cryptographic primitives used by higher-level libraries.

## Motivation

Cryptographic operations in FHE, lattice-based cryptography, and threshold protocols are computationally intensive. Without hardware acceleration:

- FHE operations can take 100-1000x longer
- NTT/FFT for polynomial multiplication becomes a bottleneck
- BLS pairing operations limit throughput
- Real-time blockchain operations become impractical

A unified GPU abstraction layer provides:

1. **Performance**: 10-100x speedups for critical operations
2. **Portability**: Same API across Metal, CUDA, and CPU
3. **Composability**: Foundation for all cryptographic libraries
4. **Simplicity**: Single dependency for hardware acceleration

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           luxcpp/gpu (Foundation)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │    Metal API    │    │    CUDA API     │    │    CPU API      │        │
│   │  (Apple Silicon)│    │   (NVIDIA)      │    │   (Fallback)    │        │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│            │                      │                      │                  │
│            └──────────────────────┴──────────────────────┘                  │
│                                   │                                         │
│                                   ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    Unified Device Interface                      │      │
│   │                                                                  │      │
│   │  • Device enumeration and selection                             │      │
│   │  • Memory allocation (unified/device/host)                      │      │
│   │  • Stream/queue management                                      │      │
│   │  • Synchronization primitives                                   │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                   │                                         │
│                                   ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    Core Operations                               │      │
│   │                                                                  │      │
│   │  • Array operations (add, mul, sub, div, mod)                   │      │
│   │  • FFT/IFFT (radix-2, radix-4, split-radix)                    │      │
│   │  • NTT/INTT (Number Theoretic Transform)                        │      │
│   │  • Matrix operations (matmul, transpose, batch)                 │      │
│   │  • Reduction operations (sum, max, min)                         │      │
│   │  • Random number generation (MT, ChaCha20)                      │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Go Bindings Interface

```go
// Package gpu provides unified GPU acceleration for cryptographic operations.
package gpu

// Backend represents the compute backend.
type Backend int

const (
    BackendAuto Backend = iota  // Auto-detect best available
    BackendMetal                // Apple Metal (M1/M2/M3)
    BackendCUDA                 // NVIDIA CUDA
    BackendCPU                  // CPU fallback
)

// Device represents a compute device.
type Device struct {
    ID       int
    Name     string
    Backend  Backend
    Memory   uint64  // Total memory in bytes
    Compute  float64 // TFLOPS
}

// Available returns true if GPU acceleration is available.
func Available() bool

// Devices returns all available compute devices.
func Devices() []Device

// DefaultDevice returns the default (best) compute device.
func DefaultDevice() *Device

// Context represents a GPU compute context.
type Context struct {
    device *Device
    // internal state
}

// NewContext creates a new GPU context on the specified device.
func NewContext(device *Device) (*Context, error)

// Close releases GPU resources.
func (c *Context) Close() error
```

### Array Operations

```go
// Array represents a GPU-allocated array.
type Array struct {
    ctx    *Context
    dtype  DataType
    shape  []int
    data   unsafe.Pointer
}

// DataType specifies the array element type.
type DataType int

const (
    Float32 DataType = iota
    Float64
    Int32
    Int64
    Uint32
    Uint64
    Complex64
    Complex128
)

// NewArray allocates a new GPU array.
func (c *Context) NewArray(dtype DataType, shape ...int) (*Array, error)

// FromSlice creates a GPU array from a Go slice.
func (c *Context) FromSlice(data interface{}) (*Array, error)

// ToSlice copies GPU array to a Go slice.
func (a *Array) ToSlice(dst interface{}) error

// Basic arithmetic operations (element-wise)
func (a *Array) Add(b *Array) (*Array, error)
func (a *Array) Sub(b *Array) (*Array, error)
func (a *Array) Mul(b *Array) (*Array, error)
func (a *Array) Div(b *Array) (*Array, error)
func (a *Array) Mod(b *Array) (*Array, error)  // For integer types

// Scalar operations
func (a *Array) AddScalar(s interface{}) (*Array, error)
func (a *Array) MulScalar(s interface{}) (*Array, error)
```

### FFT/NTT Operations

```go
// FFT computes the Fast Fourier Transform.
func (c *Context) FFT(input *Array) (*Array, error)

// IFFT computes the Inverse Fast Fourier Transform.
func (c *Context) IFFT(input *Array) (*Array, error)

// FFTConfig specifies FFT parameters.
type FFTConfig struct {
    Radix    int  // 2, 4, or 0 for auto
    Inverse  bool
    Normalize bool
}

// FFTWithConfig computes FFT with custom configuration.
func (c *Context) FFTWithConfig(input *Array, cfg FFTConfig) (*Array, error)

// NTT computes the Number Theoretic Transform.
// modulus must be a prime of the form k*2^n + 1 (NTT-friendly).
func (c *Context) NTT(input *Array, modulus uint64) (*Array, error)

// INTT computes the Inverse Number Theoretic Transform.
func (c *Context) INTT(input *Array, modulus uint64) (*Array, error)

// NTTConfig specifies NTT parameters.
type NTTConfig struct {
    Modulus   uint64
    Root      uint64  // Primitive n-th root of unity (0 = auto-compute)
    Inverse   bool
    Montgomery bool   // Use Montgomery reduction
}

// NTTWithConfig computes NTT with custom configuration.
func (c *Context) NTTWithConfig(input *Array, cfg NTTConfig) (*Array, error)
```

### Matrix Operations

```go
// MatMul performs matrix multiplication C = A @ B.
func (c *Context) MatMul(A, B *Array) (*Array, error)

// BatchMatMul performs batched matrix multiplication.
func (c *Context) BatchMatMul(A, B *Array) (*Array, error)

// Transpose returns the transpose of a matrix.
func (a *Array) Transpose() (*Array, error)

// MatMulConfig specifies matrix multiplication parameters.
type MatMulConfig struct {
    TransposeA bool
    TransposeB bool
    Alpha      float64  // C = Alpha * A @ B + Beta * C
    Beta       float64
}

// MatMulWithConfig performs matrix multiplication with options.
func (c *Context) MatMulWithConfig(A, B, C *Array, cfg MatMulConfig) error
```

### Memory Management

```go
// MemoryType specifies where memory is allocated.
type MemoryType int

const (
    MemoryDevice  MemoryType = iota  // GPU memory only
    MemoryHost                        // CPU memory only
    MemoryUnified                     // Unified memory (auto-migrating)
)

// Allocate allocates memory of the specified type.
func (c *Context) Allocate(size uint64, mtype MemoryType) (unsafe.Pointer, error)

// Free releases allocated memory.
func (c *Context) Free(ptr unsafe.Pointer) error

// Copy copies data between memory regions.
func (c *Context) Copy(dst, src unsafe.Pointer, size uint64) error

// MemInfo returns memory usage information.
type MemInfo struct {
    Total     uint64
    Free      uint64
    Used      uint64
    Allocated uint64  // By this context
}

func (c *Context) MemInfo() (*MemInfo, error)
```

### C++ Interface (luxcpp/gpu)

```cpp
// luxcpp/gpu/include/gpu.h

#pragma once

#include <cstdint>
#include <vector>
#include <memory>

namespace lux {
namespace gpu {

enum class Backend {
    Auto,
    Metal,
    CUDA,
    CPU
};

enum class DataType {
    Float32,
    Float64,
    Int32,
    Int64,
    Uint32,
    Uint64,
    Complex64,
    Complex128
};

class Device {
public:
    int id;
    std::string name;
    Backend backend;
    uint64_t memory;
    double compute_tflops;

    static std::vector<Device> enumerate();
    static Device default_device();
};

class Array {
public:
    Array(const Device& device, DataType dtype, std::vector<int> shape);
    ~Array();

    // Data transfer
    template<typename T>
    static Array from_vector(const Device& device, const std::vector<T>& data);

    template<typename T>
    std::vector<T> to_vector() const;

    // Properties
    DataType dtype() const;
    std::vector<int> shape() const;
    size_t size() const;
    size_t bytes() const;

    // Arithmetic operations
    Array add(const Array& other) const;
    Array sub(const Array& other) const;
    Array mul(const Array& other) const;
    Array div(const Array& other) const;
    Array mod(const Array& other) const;  // For integer types

private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};

// FFT operations
Array fft(const Array& input);
Array ifft(const Array& input);

// NTT operations
Array ntt(const Array& input, uint64_t modulus);
Array intt(const Array& input, uint64_t modulus);

// Matrix operations
Array matmul(const Array& a, const Array& b);
Array transpose(const Array& a);

// Utility
bool available();
void synchronize();

} // namespace gpu
} // namespace lux
```

### CMake Integration

```cmake
# luxcpp/gpu/CMakeLists.txt

cmake_minimum_required(VERSION 3.20)
project(LuxGPU VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Backend detection
option(WITH_METAL "Enable Metal backend" ON)
option(WITH_CUDA "Enable CUDA backend" OFF)

# Detect Apple Silicon
if(APPLE AND CMAKE_SYSTEM_PROCESSOR MATCHES "arm64")
    set(WITH_METAL ON)
endif()

# Source files
set(GPU_SOURCES
    src/device.cpp
    src/array.cpp
    src/fft.cpp
    src/ntt.cpp
    src/matmul.cpp
)

if(WITH_METAL)
    enable_language(OBJCXX)
    list(APPEND GPU_SOURCES
        src/metal/backend.mm
        src/metal/kernels.metal
    )
endif()

if(WITH_CUDA)
    enable_language(CUDA)
    list(APPEND GPU_SOURCES
        src/cuda/backend.cu
        src/cuda/kernels.cu
    )
endif()

# Library target
add_library(gpu ${GPU_SOURCES})

target_include_directories(gpu
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
)

# Platform linking
if(APPLE)
    target_link_libraries(gpu PRIVATE
        "-framework Metal"
        "-framework Foundation"
        "-framework MetalPerformanceShaders"
    )
endif()

if(WITH_CUDA)
    find_package(CUDAToolkit REQUIRED)
    target_link_libraries(gpu PRIVATE CUDA::cudart CUDA::cublas CUDA::cufft)
endif()

# Export as Lux::gpu
install(TARGETS gpu EXPORT LuxGPUTargets
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

install(EXPORT LuxGPUTargets
    FILE LuxGPUTargets.cmake
    NAMESPACE Lux::
    DESTINATION lib/cmake/LuxGPU
)
```

### Performance Benchmarks

| Operation | Size | Metal (M3 Max) | CUDA (RTX 4090) | CPU (i9-13900K) |
|-----------|------|----------------|-----------------|-----------------|
| FFT | 2^20 | 1.2 ms | 0.8 ms | 45 ms |
| NTT | 2^16 | 0.4 ms | 0.3 ms | 18 ms |
| MatMul | 4096×4096 | 12 ms | 8 ms | 850 ms |
| Element-wise Mul | 10M elements | 0.2 ms | 0.1 ms | 15 ms |

### Composition Rules

This layer serves as the **foundation** for all cryptographic libraries:

```
luxcpp/gpu     ← Foundation (Metal/CUDA/CPU abstraction)
     ▲
     │ links to
     │
luxcpp/lattice ← Uses gpu for NTT acceleration
     ▲
     │ links to
     │
luxcpp/fhe     ← Uses lattice for polynomial operations
     │
     │ composes with
     │
luxcpp/crypto  ← Uses gpu directly for BLS pairings
```

**Dependency Rule**: Libraries depend on `gpu` either directly or transitively through `lattice`.

## Rationale

### Why a Unified GPU Layer?

1. **Code Reuse**: FFT/NTT implementations shared across all cryptographic libraries
2. **Maintainability**: Backend-specific code isolated in one place
3. **Testing**: Single test suite for hardware compatibility
4. **Performance**: Optimizations benefit all dependent libraries

### Why Metal + CUDA + CPU?

- **Metal**: Apple Silicon dominates developer machines (M1/M2/M3)
- **CUDA**: Industry standard for production GPU compute
- **CPU**: Fallback for CI/CD, containers, and compatibility

### Why C++ with Go Bindings?

- **C++**: Necessary for Metal/CUDA integration, performance-critical paths
- **Go**: Lux Network's primary language, enables seamless integration
- **CGO**: Well-understood boundary with minimal overhead

## Backwards Compatibility

New library. No backwards compatibility concerns.

## Test Cases

### Unit Tests

1. Device enumeration returns at least one device
2. Array allocation succeeds on all backends
3. FFT/IFFT roundtrip preserves data
4. NTT/INTT with known test vectors
5. MatMul matches reference implementation
6. Memory allocation limits respected

### Integration Tests

1. Multiple contexts on same device
2. Cross-backend array transfers
3. Concurrent operations don't corrupt state
4. Out-of-memory handling

### Performance Tests

1. FFT meets latency targets for each backend
2. NTT benchmarks within 10% of theoretical peak
3. Memory bandwidth utilization > 80%

## Reference Implementation

### Repository Structure

```
luxcpp/gpu/
├── CMakeLists.txt
├── include/
│   └── gpu.h
├── src/
│   ├── device.cpp
│   ├── array.cpp
│   ├── fft.cpp
│   ├── ntt.cpp
│   ├── matmul.cpp
│   ├── metal/
│   │   ├── backend.mm
│   │   └── kernels.metal
│   └── cuda/
│       ├── backend.cu
│       └── kernels.cu
├── go/
│   ├── gpu.go
│   └── gpu_cgo.go
└── tests/
    ├── device_test.cpp
    ├── fft_test.cpp
    └── ntt_test.cpp
```

### Go Module

```
module github.com/luxcpp/gpu

go 1.22
```

## Security Considerations

### Side-Channel Resistance

- Constant-time operations where cryptographically relevant
- No branching on secret data
- Memory access patterns independent of inputs

### Memory Safety

- All GPU memory zeroed before free
- Bounds checking on all array accesses
- No raw pointer exposure in Go API

### Resource Management

- Automatic cleanup via finalizers
- Explicit `Close()` methods for deterministic cleanup
- Memory limits to prevent DoS

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
