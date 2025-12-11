---
lp: 8000
title: Z-Chain - Core ZKVM Specification
tags: [core, zk, privacy, fhe, z-chain]
description: Core specification for the Z-Chain (ZKVM), Lux Network's zero-knowledge proof and privacy chain
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: [0, 99]
supersedes: 46
---

## Abstract

LP-8000 specifies the Z-Chain (Zero-Knowledge Virtual Machine), Lux Network's specialized blockchain for zero-knowledge proofs, privacy-preserving transactions, and fully homomorphic encryption (FHE). The Z-Chain implements hardware-accelerated proof systems with cross-platform support.

## Motivation

A dedicated ZK chain provides:

1. **Privacy**: Enable private transactions and data
2. **Scalability**: ZK rollups for scaling
3. **Verifiable Computation**: Trustless off-chain compute
4. **FHE Operations**: Encrypted data processing

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `Z` |
| VM ID | `zkvm` |
| VM Name | `zkvm` |
| Block Time | 2 seconds |
| Consensus | Quasar |

### Implementation

**Go Package**: `github.com/luxfi/node/vms/zkvm`

```go
import (
    zvm "github.com/luxfi/node/vms/zkvm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var ZKVMID = constants.ZKVMID // ids.ID{'z', 'k', 'v', 'm'}

// Create Z-Chain VM
factory := &zvm.Factory{}
vm, err := factory.New(logger)
```

### Directory Structure

```
node/vms/zkvm/
├── accel/            # Hardware acceleration
│   ├── accel.go      # Acceleration interface
│   ├── accel_mlx.go  # Apple MLX backend
│   ├── accel_cgo.go  # CGO/CUDA backend
│   ├── accel_fpga.go # FPGA backend
│   └── accel_go.go   # Pure Go fallback
├── circuits/         # ZK circuit definitions
├── fhe/              # FHE operations
├── provers/          # Proof systems
├── verifiers/        # Proof verification
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
└── *_test.go         # Tests
```

### Proof Systems

| System | Type | Use Case |
|--------|------|----------|
| Groth16 | SNARK | Production proofs |
| PLONK | SNARK | Universal setup |
| STARK | STARK | Quantum-resistant |
| Halo2 | SNARK | Recursive proofs |

### Hardware Acceleration

#### Acceleration Interface

```go
type Accelerator interface {
    Name() string
    IsAvailable() bool
    MSM(points []Point, scalars []FieldElement, config MSMConfig) (Point, error)
    NTT(values []FieldElement, config NTTConfig) ([]FieldElement, error)
    Poseidon(inputs []FieldElement) (FieldElement, error)
    Benchmark() (*BenchmarkResult, error)
}
```

#### Platform Support

| Platform | Backend | Performance |
|----------|---------|-------------|
| Apple Silicon | MLX | 10x speedup |
| NVIDIA GPU | CUDA (CGO) | 50x speedup |
| FPGA | Custom IP | 100x speedup |
| CPU | Pure Go | Baseline |

#### Acceleration Selection

```go
func GetAccelerator() Accelerator {
    // Priority: FPGA > CUDA > MLX > Go
    if fpga := NewFPGAAccelerator(); fpga.IsAvailable() {
        return fpga
    }
    if cuda := NewCGOAccelerator(); cuda.IsAvailable() {
        return cuda
    }
    if mlx := NewMLXAccelerator(); mlx.IsAvailable() {
        return mlx
    }
    return NewGoAccelerator()
}
```

### Transaction Types

| Type | Description |
|------|-------------|
| `SubmitProof` | Submit ZK proof |
| `VerifyProof` | Verify ZK proof |
| `PrivateTransfer` | Privacy-preserving transfer |
| `FHECompute` | FHE computation |
| `RegisterCircuit` | Register new circuit |
| `BatchVerify` | Batch proof verification |

### ZK Operations

#### Proof Submission

```go
type ZKProof struct {
    CircuitID   ids.ID
    ProofType   ProofSystem
    PublicInput []FieldElement
    Proof       []byte
    Metadata    []byte
}

// Submit proof for verification
func (z *ZKVM) SubmitProof(proof *ZKProof) (ids.ID, error) {
    // Verify proof
    valid, err := z.verifier.Verify(proof)
    if err != nil || !valid {
        return ids.Empty, ErrInvalidProof
    }

    // Store on chain
    return z.state.StoreProof(proof)
}
```

#### Circuit Registration

```go
type Circuit struct {
    ID          ids.ID
    Name        string
    System      ProofSystem
    VerifyKey   []byte
    ProvingKey  []byte    // Optional for public circuits
    Constraints uint64
    Public      uint32
    Private     uint32
}
```

### Privacy Features

#### Private Transfers

```go
type PrivateTransfer struct {
    Commitment  [32]byte  // Pedersen commitment
    Nullifier   [32]byte  // Nullifier to prevent double-spend
    Proof       []byte    // ZK proof of valid transfer
    EncOutput   []byte    // Encrypted output for recipient
}
```

#### Encrypted Data

```go
type EncryptedData struct {
    Ciphertext  []byte
    Nonce       [24]byte
    Tag         [16]byte
    PublicKey   [32]byte
}
```

### FHE Operations

```go
type FHEConfig struct {
    Scheme      FHEScheme  // CKKS, BFV, BGV
    SecurityBits uint32
    PolyDegree   uint32
    ScaleBits    uint32
}

type FHEOperation struct {
    OpType      FHEOpType  // Add, Mul, Rotate
    Inputs      [][]byte   // Encrypted inputs
    Output      []byte     // Encrypted output
    Proof       []byte     // Correctness proof
}
```

### API Endpoints

#### RPC Methods

| Method | Description |
|--------|-------------|
| `zk.submitProof` | Submit ZK proof |
| `zk.verifyProof` | Verify ZK proof |
| `zk.getCircuit` | Get circuit info |
| `zk.registerCircuit` | Register circuit |
| `zk.privateTransfer` | Private transfer |
| `zk.fheCompute` | FHE computation |

#### REST Endpoints

```
POST /ext/bc/Z/zk/proof/submit
POST /ext/bc/Z/zk/proof/verify
GET  /ext/bc/Z/zk/circuits/{circuitId}
POST /ext/bc/Z/zk/circuits/register
POST /ext/bc/Z/zk/private/transfer
POST /ext/bc/Z/zk/fhe/compute
```

### Precompiled Contracts

| Address | Function | Gas Cost |
|---------|----------|----------|
| `0x8000` | Groth16 Verify | 200,000 |
| `0x8001` | PLONK Verify | 250,000 |
| `0x8002` | STARK Verify | 500,000 |
| `0x8003` | Poseidon Hash | 10,000 |
| `0x8004` | Pedersen Commit | 20,000 |
| `0x8005` | FHE Add | 50,000 |
| `0x8006` | FHE Mul | 100,000 |

### Configuration

```json
{
  "zkvm": {
    "defaultProofSystem": "groth16",
    "maxCircuitSize": 1000000,
    "maxProofSize": 1048576,
    "parallelVerification": true,
    "maxVerifyWorkers": 8,
    "acceleratorPriority": ["fpga", "cuda", "mlx", "go"],
    "fheEnabled": true,
    "privacyEnabled": true
  }
}
```

### Performance

| Operation | Time | Accelerated |
|-----------|------|-------------|
| Groth16 Verify | 5ms | 0.5ms (FPGA) |
| PLONK Verify | 10ms | 1ms (FPGA) |
| MSM (64 points) | 50ms | 0.5ms (CUDA) |
| NTT (2^16) | 100ms | 1ms (CUDA) |
| Poseidon Hash | 0.1ms | 0.01ms |
| FHE Add | 10ms | 1ms |
| FHE Mul | 50ms | 5ms |

## Rationale

Design decisions for Z-Chain:

1. **Dedicated Chain**: ZK operations require specialized resources
2. **Multi-Backend**: Support various hardware accelerators
3. **Multiple Proof Systems**: Different tradeoffs for different use cases
4. **FHE Support**: Enable encrypted computation

## Backwards Compatibility

LP-8000 supersedes LP-0046. Both old and new numbers resolve to this document.

## Test Cases

See `github.com/luxfi/node/vms/zkvm/*_test.go`:

```go
func TestZKVMFactory(t *testing.T)
func TestGroth16Verification(t *testing.T)
func TestPLONKVerification(t *testing.T)
func TestMSMAcceleration(t *testing.T)
func TestNTTAcceleration(t *testing.T)
func TestPoseidonHash(t *testing.T)
func TestPrivateTransfer(t *testing.T)
func TestFHEOperations(t *testing.T)
func TestGoAccelerator_Benchmark(t *testing.T)
```

## Reference Implementation

**Repository**: `github.com/luxfi/node`
**Package**: `vms/zkvm`
**Dependencies**:
- `vms/zkvm/accel`
- `vms/zkvm/circuits`
- `vms/zkvm/provers`
- `vms/zkvm/fhe`

## Security Considerations

1. **Trusted Setup**: Groth16 requires trusted setup ceremony
2. **Side-Channel**: Constant-time implementations
3. **Nullifier Security**: Prevent double-spending attacks
4. **FHE Parameters**: Correct parameter selection for security level

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0046 | Z-Chain ZKVM | Superseded by this LP |
| LP-8100 | Proof Systems | Sub-specification |
| LP-8200 | Hardware Acceleration | Sub-specification |
| LP-8300 | Privacy Transactions | Sub-specification |
| LP-8400 | FHE Operations | Sub-specification |
| LP-8500 | ZK Rollups | Sub-specification |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
