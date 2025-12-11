---
lp: 8046
title: Z-Chain ZKVM Architecture
description: RISC-V based zero-knowledge virtual machine with GPU/FPGA acceleration for private computation rollups
author: Zach Kelling (@zeekay) and Lux Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-11
requires: 0045, 0302, 0503
tags: [privacy, zk, zkvm, core]
---

> **See also**: [LP-45](./lp-0045-z-chain-encrypted-execution-layer-interface.md), [LP-302](./lp-0302-lux-z-a-chain-privacy-ai-attestation-layer.md), [LP-503](./lp-0503-validity-proof-system.md)

## Abstract

This LP specifies the Z-Chain Zero-Knowledge Virtual Machine (ZKVM) - a RISC-V based proving system for private computation rollups on Lux Network. The ZKVM enables arbitrary program execution with validity proofs, supporting GPU acceleration (Phase 1) and FPGA acceleration (Phase 2). It integrates with Lux's FHE layer for encrypted computation and provides cross-chain interoperability with all primary chains (A, B, C, P, Q, T, X, Z).

The design draws inspiration from Succinct SP1's RISC-V approach while implementing a custom FHE library to avoid restrictive licensing (Zama) and enabling hardware acceleration paths not available in existing zkVM implementations.

## Motivation

### Current Limitations

1. **Existing zkEVMs are slow**: Type-1/2/3 zkEVMs have high proving overhead due to EVM complexity
2. **General computation needs zkVM**: AI inference, ML training, and complex algorithms need RISC-V flexibility
3. **FHE licensing issues**: Zama's fhEVM has restrictive commercial licensing
4. **No hardware acceleration path**: Current zkVMs lack GPU/FPGA optimization roadmaps
5. **Privacy rollups are fragmented**: Need unified architecture across all Lux chains

### Goals

1. **RISC-V Universality**: Prove any Rust/C/Go program compiled to RISC-V
2. **Hardware Acceleration**: GPU (100-1000 proofs/sec) → FPGA (10,000+ proofs/sec)
3. **Open Licensing**: MIT/Apache-2.0 licensed FHE and proving system
4. **Cross-Chain Privacy**: Unified privacy layer across all 8 Lux chains
5. **AI/ML Optimization**: Specialized circuits for neural network operations

## Specification

### 1. ZKVM Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Z-Chain ZKVM Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐ │
│  │  RISC-V Program │───▶│  ZKVM Executor   │───▶│   Execution Trace       │ │
│  │  (ELF Binary)   │    │  (rv32im + ext)  │    │   (Witness Generation)  │ │
│  └─────────────────┘    └──────────────────┘    └───────────┬─────────────┘ │
│                                                             │               │
│                         ┌───────────────────────────────────▼─────────────┐ │
│                         │              Proof Generator                    │ │
│                         │  ┌─────────┬─────────┬─────────┬─────────────┐  │ │
│                         │  │  CPU    │   GPU   │  FPGA   │  Recursive  │  │ │
│                         │  │ Prover  │ Prover  │ Prover  │  Aggregator │  │ │
│                         │  │ (Rust)  │ (CUDA)  │ (Verilog)│  (Halo2)   │  │ │
│                         │  └─────────┴─────────┴─────────┴─────────────┘  │ │
│                         └───────────────────────────────────┬─────────────┘ │
│                                                             │               │
│  ┌──────────────────────────────────────────────────────────▼─────────────┐ │
│  │                        Proof Output                                    │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │ │
│  │  │ STARK Proof     │  │ Wrapped SNARK   │  │ Aggregated Batch Proof  │ │ │
│  │  │ (45 KB)         │  │ (128 bytes)     │  │ (Single proof for N tx) │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. RISC-V Instruction Set

#### 2.1 Base ISA: RV32IM

The ZKVM supports RV32IM (32-bit base integer + multiplication/division):

| Extension | Instructions | Purpose |
|-----------|--------------|---------|
| **RV32I** | 47 base | Integer computation |
| **M** | 8 mul/div | Multiplication, division |
| **Zicsr** | 6 CSR | System registers |
| **Custom** | 32 ZK | ZK-specific operations |

#### 2.2 Custom ZK Extensions

```rust
// Custom ZK opcodes (0x0B custom-0 space)
pub enum ZKOpcode {
    // FHE Operations (0x0B00-0x0B0F)
    FheAdd      = 0x0B00,  // fhe.add rd, rs1, rs2
    FheSub      = 0x0B01,  // fhe.sub rd, rs1, rs2
    FheMul      = 0x0B02,  // fhe.mul rd, rs1, rs2
    FheCmux     = 0x0B03,  // fhe.cmux rd, rs1, rs2, rs3
    FheBootstrap = 0x0B04, // fhe.bootstrap rd, rs1

    // Hash Operations (0x0B10-0x0B1F)
    Poseidon    = 0x0B10,  // poseidon rd, rs1, rs2
    Keccak256   = 0x0B11,  // keccak256 rd, rs1, imm
    Blake3      = 0x0B12,  // blake3 rd, rs1, imm

    // Elliptic Curve (0x0B20-0x0B2F)
    EcAdd       = 0x0B20,  // ec.add rd, rs1, rs2
    EcMul       = 0x0B21,  // ec.mul rd, rs1, rs2
    EcPairing   = 0x0B22,  // ec.pairing rd, rs1, rs2

    // Memory/Merkle (0x0B30-0x0B3F)
    MerkleProof = 0x0B30,  // merkle.proof rd, rs1, rs2
    MemCommit   = 0x0B31,  // mem.commit rd, rs1

    // Syscalls (0x0B40-0x0B4F)
    Hint        = 0x0B40,  // hint rd, imm (prover hint)
    Verify      = 0x0B41,  // verify rd, rs1 (recursive verify)
}
```

#### 2.3 Memory Model

```typescript
interface ZKVMMemoryLayout {
    // Program memory (read-only)
    programRom: {
        start: 0x00000000,
        size: 256 * 1024 * 1024,  // 256 MB
    };

    // Stack
    stack: {
        start: 0x10000000,
        size: 16 * 1024 * 1024,   // 16 MB
    };

    // Heap
    heap: {
        start: 0x20000000,
        size: 512 * 1024 * 1024,  // 512 MB
    };

    // Input/Output (prover-provided)
    io: {
        input: 0x30000000,        // Public + private inputs
        output: 0x31000000,       // Public outputs
        hint: 0x32000000,         // Prover hints (non-deterministic)
    };

    // FHE Ciphertext Memory
    fheMemory: {
        start: 0x40000000,
        size: 1024 * 1024 * 1024, // 1 GB for ciphertexts
    };
}
```

### 3. Proving System

#### 3.1 STARK Core

The ZKVM uses STARKs as the core proving system for post-quantum security:

```typescript
interface STARKConfig {
    // Field configuration
    field: "Goldilocks" | "BabyBear" | "Mersenne31";
    fieldModulus: bigint;

    // FRI parameters
    expansionFactor: 8;         // Blow-up factor
    numQueries: 40;             // Security parameter
    foldingFactor: 4;           // FRI folding

    // AIR configuration
    traceWidth: 256;            // Number of registers
    maxTraceLength: 2^24;       // 16M cycles max

    // Hash function
    hashFunction: "Poseidon" | "Poseidon2" | "Rescue";
}

interface AIRConstraints {
    // Instruction decoding
    instructionDecode: Constraint[];  // ~50 constraints

    // ALU operations
    aluOperations: Constraint[];      // ~200 constraints

    // Memory consistency
    memoryConsistency: Constraint[];  // ~100 constraints

    // Custom ZK opcodes
    zkOpcodes: Constraint[];          // ~500 constraints

    // Total: ~850 constraints per cycle
}
```

#### 3.2 Proof Compression (STARK → SNARK)

For on-chain verification, wrap STARK proofs in SNARKs:

```solidity
interface IZKVMVerifier {
    struct ZKVMProof {
        bytes starkProof;           // Raw STARK proof (45 KB)
        bytes snarkWrapper;         // Groth16 wrapper (128 bytes)
        bytes32 programHash;        // Hash of RISC-V program
        bytes32 publicInputHash;    // Hash of public inputs
        bytes32 publicOutputHash;   // Hash of public outputs
        uint64 cycleCount;          // Number of execution cycles
    }

    // Verify wrapped proof on-chain
    function verify(
        ZKVMProof calldata proof,
        bytes calldata publicInputs,
        bytes calldata publicOutputs
    ) external view returns (bool);

    // Gas cost: ~200k for Groth16 wrapper verification
}
```

### 4. GPU Acceleration (Phase 1)

#### 4.1 CUDA Prover Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GPU Prover (CUDA)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Host (CPU)                               ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │ Trace Gen   │  │ Constraint  │  │ FRI Coordinator     │ ││
│  │  │ (Rust)      │  │ Compiler    │  │ (Query scheduling)  │ ││
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ ││
│  └─────────┼────────────────┼────────────────────┼────────────┘│
│            │                │                    │              │
│            ▼                ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Device (GPU)                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │ NTT Kernel  │  │ Polynomial  │  │ Merkle Tree Builder │ ││
│  │  │ (Forward/   │  │ Evaluation  │  │ (Parallel hashing)  │ ││
│  │  │  Inverse)   │  │ (Batched)   │  │                     │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │ FRI Prover  │  │ Poseidon2   │  │ EC Operations       │ ││
│  │  │ (Folding)   │  │ Hash Kernel │  │ (MSM, Pairing)      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Performance (NVIDIA B200):                                     │
│  - NTT: 500M points/sec                                         │
│  - Poseidon2: 2B hashes/sec                                     │
│  - FRI folding: 100M/sec                                        │
│  - End-to-end: 100-1000 proofs/sec (depending on program size)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 CUDA Kernel Specifications

```cpp
// NTT (Number Theoretic Transform) Kernel
__global__ void ntt_radix4_kernel(
    uint64_t* data,          // Input/output polynomial
    uint64_t* twiddles,      // Precomputed twiddle factors
    uint32_t log_n,          // log2(polynomial degree)
    uint64_t modulus         // Field modulus
) {
    // 4-way butterfly with coalesced memory access
    // Achieves 500M points/sec on B200
}

// Poseidon2 Hash Kernel
__global__ void poseidon2_hash_kernel(
    uint64_t* inputs,        // Input data
    uint64_t* outputs,       // Hash outputs
    uint32_t batch_size,     // Number of hashes
    uint32_t input_size      // Elements per hash
) {
    // Parallelized Poseidon2 with shared memory optimization
    // Achieves 2B hashes/sec on B200
}

// Merkle Tree Builder
__global__ void merkle_build_kernel(
    uint64_t* leaves,        // Input leaves
    uint64_t* tree,          // Output tree (full tree in memory)
    uint32_t num_leaves      // Number of leaves (power of 2)
) {
    // Bottom-up parallel tree construction
    // O(log n) depth, O(n) work
}
```

#### 4.3 GPU Memory Management

```rust
pub struct GPUProverConfig {
    // Memory allocation
    pub max_trace_size: usize,      // 16M cycles default
    pub max_polynomial_degree: usize, // 2^24 default
    pub batch_size: usize,          // Proofs per batch

    // Device selection
    pub device_id: u32,             // CUDA device index
    pub stream_count: u32,          // Concurrent CUDA streams

    // Memory pools
    pub trace_pool_mb: usize,       // Trace memory pool
    pub poly_pool_mb: usize,        // Polynomial memory pool
    pub tree_pool_mb: usize,        // Merkle tree memory pool
}

impl Default for GPUProverConfig {
    fn default() -> Self {
        Self {
            max_trace_size: 16 * 1024 * 1024,
            max_polynomial_degree: 1 << 24,
            batch_size: 32,
            device_id: 0,
            stream_count: 4,
            trace_pool_mb: 8192,    // 8 GB
            poly_pool_mb: 16384,    // 16 GB
            tree_pool_mb: 8192,     // 8 GB
        }
    }
}
```

### 5. FPGA Acceleration (Phase 2)

#### 5.1 FPGA Architecture Target

```
┌─────────────────────────────────────────────────────────────────┐
│               FPGA Prover (AMD Versal / Intel Agilex)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Programmable Logic (PL)                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│  │
│  │  │ NTT Engine  │  │ Hash Engine │  │ EC Arithmetic Unit  ││  │
│  │  │ (Pipelined) │  │ (Poseidon2) │  │ (Montgomery mul)    ││  │
│  │  │ 10 Gpts/sec │  │ 50 GH/sec   │  │ 1 Gops/sec          ││  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘│  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│  │
│  │  │ FRI Folder  │  │ Merkle      │  │ Memory Controller   ││  │
│  │  │ (Streaming) │  │ Accumulator │  │ (HBM3 Interface)    ││  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AI Engines (AIE) - Versal              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Vector Processing for Polynomial Arithmetic          │  │  │
│  │  │ - 400 AI Engines × 1 TOPS each = 400 TOPS           │  │  │
│  │  │ - Ideal for batched field operations                │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Performance Target:                                            │
│  - NTT: 10B points/sec (20x GPU)                                │
│  - Poseidon2: 50B hashes/sec (25x GPU)                          │
│  - End-to-end: 10,000+ proofs/sec (10-100x GPU)                 │
│  - Latency: <1ms per proof (deterministic)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2 Hardware Design Specifications

```verilog
// NTT Processing Element (Radix-4 Butterfly)
module ntt_butterfly_r4 #(
    parameter WIDTH = 64,
    parameter MODULUS = 64'hFFFFFFFF00000001  // Goldilocks
)(
    input  wire clk,
    input  wire rst_n,
    input  wire valid_in,
    input  wire [WIDTH-1:0] a, b, c, d,
    input  wire [WIDTH-1:0] w1, w2, w3,  // Twiddle factors
    output reg  valid_out,
    output reg  [WIDTH-1:0] a_out, b_out, c_out, d_out
);
    // Pipelined radix-4 butterfly
    // 6-stage pipeline for 64-bit modular arithmetic
    // Throughput: 1 butterfly per cycle
endmodule

// Poseidon2 Hash Core
module poseidon2_core #(
    parameter WIDTH = 64,
    parameter STATE_SIZE = 12,
    parameter ROUNDS_F = 8,
    parameter ROUNDS_P = 22
)(
    input  wire clk,
    input  wire rst_n,
    input  wire start,
    input  wire [WIDTH*STATE_SIZE-1:0] state_in,
    output wire done,
    output wire [WIDTH*STATE_SIZE-1:0] state_out
);
    // Full Poseidon2 permutation
    // Unrolled external rounds, iterative internal rounds
    // ~30 cycle latency, 1 hash per cycle throughput
endmodule
```

#### 5.3 FPGA Deployment Targets

| Platform | Provider | Resources | Target Performance |
|----------|----------|-----------|-------------------|
| AMD Versal VCK190 | On-prem | 1.9M LUTs, 400 AIE | 10,000 proofs/sec |
| Intel Agilex I-Series | On-prem | 2.8M ALMs, HBM2e | 15,000 proofs/sec |
| AWS F2 (Versal) | Cloud | VU47P equivalent | 8,000 proofs/sec |
| AMD Alveo V80 | Datacenter | 1.3M LUTs, HBM3 | 12,000 proofs/sec |

### 6. FHE Integration

#### 6.1 Custom FHE Library (OpenFHE-based)

To avoid Zama's restrictive licensing, implement custom TFHE using OpenFHE (BSD license):

```rust
// FHE Configuration
pub struct LuxFHEConfig {
    // TFHE Parameters (128-bit security)
    pub n: usize,           // LWE dimension (1024)
    pub k: usize,           // GLWE dimension (2)
    pub N: usize,           // Polynomial degree (2048)
    pub q: u64,             // Ciphertext modulus (2^64)
    pub t: u64,             // Plaintext modulus (configurable)
    pub sigma: f64,         // Noise standard deviation

    // Bootstrapping parameters
    pub bootstrap_levels: usize,  // Number of PBS levels
    pub ks_base_log: usize,       // Key-switching base log
    pub ks_levels: usize,         // Key-switching levels
}

impl Default for LuxFHEConfig {
    fn default() -> Self {
        Self {
            n: 1024,
            k: 2,
            N: 2048,
            q: 1 << 64,
            t: 16,          // 4-bit plaintext
            sigma: 3.19,
            bootstrap_levels: 3,
            ks_base_log: 4,
            ks_levels: 7,
        }
    }
}
```

#### 6.2 FHE Precompile Integration

```typescript
// FHE operations available in ZKVM
interface ZKVMFHEOps {
    // Arithmetic (on encrypted data)
    fhe_add(ct_a: Ciphertext, ct_b: Ciphertext): Ciphertext;
    fhe_sub(ct_a: Ciphertext, ct_b: Ciphertext): Ciphertext;
    fhe_mul(ct_a: Ciphertext, ct_b: Ciphertext): Ciphertext;
    fhe_neg(ct: Ciphertext): Ciphertext;

    // Comparison (returns encrypted boolean)
    fhe_lt(ct_a: Ciphertext, ct_b: Ciphertext): Ciphertext;
    fhe_eq(ct_a: Ciphertext, ct_b: Ciphertext): Ciphertext;

    // Control flow
    fhe_cmux(cond: Ciphertext, ct_true: Ciphertext, ct_false: Ciphertext): Ciphertext;

    // Bootstrapping (noise reduction)
    fhe_bootstrap(ct: Ciphertext): Ciphertext;

    // Encoding
    fhe_encrypt(plaintext: u64, pk: PublicKey): Ciphertext;
    fhe_decrypt(ct: Ciphertext, sk: SecretKey): u64;  // Only in decryption oracle
}
```

#### 6.3 FHE Circuit Compilation

The ZKVM compiles FHE operations into circuit constraints:

```rust
// FHE operation costs in ZKVM
pub struct FHECircuitCosts {
    // Constraint counts per operation
    pub add: usize,         // ~100 constraints
    pub sub: usize,         // ~100 constraints
    pub mul: usize,         // ~10,000 constraints
    pub cmux: usize,        // ~5,000 constraints
    pub bootstrap: usize,   // ~50,000 constraints
    pub comparison: usize,  // ~20,000 constraints
}

impl Default for FHECircuitCosts {
    fn default() -> Self {
        Self {
            add: 100,
            sub: 100,
            mul: 10_000,
            cmux: 5_000,
            bootstrap: 50_000,
            comparison: 20_000,
        }
    }
}
```

### 7. Privacy Rollup Architecture

#### 7.1 Rollup State Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    Z-Chain Privacy Rollup                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Rollup State                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │ Account     │  │ Shielded    │  │ FHE Ciphertext      │ ││
│  │  │ Merkle Tree │  │ Note Tree   │  │ Storage Tree        │ ││
│  │  │ (Public)    │  │ (Nullifiers)│  │ (Encrypted State)   │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Transaction Types:                                             │
│  1. Public Tx: Standard EVM-like execution                      │
│  2. Shielded Tx: ZK-SNARK with nullifier                        │
│  3. Private Tx: FHE computation with encrypted state            │
│  4. Cross-Chain: Bridge to other Lux chains                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Batch Processing                         ││
│  │                                                             ││
│  │  Tx1 ─┬─▶ ┌──────────┐    ┌──────────┐    ┌─────────────┐  ││
│  │  Tx2 ─┤   │ Sequencer│───▶│ ZKVM     │───▶│ Batch Proof │  ││
│  │  ...  ─┤   │ (Order)  │    │ Executor │    │ (Validity)  │  ││
│  │  TxN ─┴─▶ └──────────┘    └──────────┘    └──────┬──────┘  ││
│  │                                                   │         ││
│  │                    ┌──────────────────────────────▼───────┐ ││
│  │                    │          L1 Settlement               │ ││
│  │                    │  (C-Chain proof verification)        │ ││
│  │                    └──────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.2 Batch Proof Generation

```typescript
interface BatchProof {
    // Batch metadata
    batchNumber: uint64;
    prevStateRoot: bytes32;
    newStateRoot: bytes32;
    transactionRoot: bytes32;

    // ZKVM proof
    zkvmProof: {
        starkProof: bytes;      // Core STARK proof
        snarkWrapper: bytes;    // Groth16 wrapper for L1
        programHash: bytes32;   // Hash of batch program
        publicIO: bytes;        // Public inputs/outputs
    };

    // Aggregation
    numTransactions: uint32;
    totalCycles: uint64;

    // Cross-chain messages (for interop)
    outgoingMessages: CrossChainMessage[];
}

// Batch processing configuration
interface BatchConfig {
    maxTransactions: 1000;      // Max tx per batch
    maxCycles: 100_000_000;     // Max ZKVM cycles
    targetProofTime: 10;        // Seconds
    compressionLevel: "snark";  // stark | snark | aggregated
}
```

### 8. Cross-Chain Interoperability

#### 8.1 Chain Integration Matrix

| From/To | A-Chain | B-Chain | C-Chain | P-Chain | Q-Chain | T-Chain | X-Chain | Z-Chain |
|---------|---------|---------|---------|---------|---------|---------|---------|---------|
| **Z-Chain** | AI Attest | Bridge | Settle | Anchor | Q-Secure | Thresh Dec | Assets | Local |
| **Proof Type** | Receipt | Warp | Validity | State | Dual-Sig | MPC | UTXO | Native |

#### 8.2 Cross-Chain Message Format

```solidity
interface IZChainBridge {
    struct CrossChainMessage {
        bytes32 messageId;       // Unique identifier
        uint8 sourceChain;       // Z = 7
        uint8 destChain;         // Target chain ID
        address sender;          // Sender on Z-Chain
        bytes recipient;         // Recipient (chain-specific format)
        bytes payload;           // Encoded message
        bytes proof;             // ZKVM validity proof
    }

    // Send message to another chain
    function sendCrossChain(
        uint8 destChain,
        bytes calldata recipient,
        bytes calldata payload
    ) external returns (bytes32 messageId);

    // Receive message from another chain
    function receiveCrossChain(
        CrossChainMessage calldata message
    ) external returns (bool);

    // Verify cross-chain proof
    function verifyCrossChainProof(
        CrossChainMessage calldata message
    ) external view returns (bool);
}
```

#### 8.3 Q-Chain Quantum Security Integration

Z-Chain proofs can be post-quantum secured via Q-Chain:

```typescript
interface QuantumSecureProof {
    // Standard ZKVM proof
    zkvmProof: bytes;

    // Q-Chain quantum signature
    quantumSig: {
        mldsaSignature: bytes;    // ML-DSA-65 signature
        ringtailAggSig: bytes;    // Aggregate lattice signature
        qChainCertificate: bytes; // Q-Chain finality certificate
    };

    // Combined verification
    // 1. Verify ZKVM proof (classical)
    // 2. Verify Q-Chain certificate (quantum-secure)
}
```

### 9. API Specifications

#### 9.1 ZKVM RPC Methods

```typescript
// zkvm_ namespace
interface ZKVMRPCMethods {
    // Program management
    zkvm_deployProgram(elf: bytes): ProgramId;
    zkvm_getProgram(programId: ProgramId): ProgramInfo;

    // Execution
    zkvm_execute(
        programId: ProgramId,
        publicInput: bytes,
        privateInput?: bytes
    ): ExecutionResult;

    // Proving
    zkvm_prove(executionId: ExecutionId): ProofResult;
    zkvm_proveAndVerify(executionId: ExecutionId): VerifiedProof;

    // Batch operations
    zkvm_createBatch(transactions: Transaction[]): BatchId;
    zkvm_proveBatch(batchId: BatchId): BatchProof;
    zkvm_submitBatch(batchProof: BatchProof): TxHash;

    // Status
    zkvm_getProofStatus(proofId: ProofId): ProofStatus;
    zkvm_getHardwareStatus(): HardwareStatus;

    // FHE operations
    zkvm_encryptInput(plaintext: bytes, publicKey: bytes): Ciphertext;
    zkvm_requestDecrypt(ciphertext: bytes, callback: address): RequestId;
}
```

#### 9.2 SDK Interface

```rust
// Rust SDK for ZKVM development
pub trait ZKVMProgram {
    /// Entry point for ZKVM execution
    fn main(&self, input: &PublicInput, witness: &PrivateWitness) -> PublicOutput;

    /// FHE-enabled variant
    fn main_fhe(
        &self,
        input: &PublicInput,
        witness: &PrivateWitness,
        fhe_inputs: &[Ciphertext],
    ) -> (PublicOutput, Vec<Ciphertext>);
}

// Example: Private token transfer
#[zkvm::program]
pub fn private_transfer(
    input: &TransferInput,
    witness: &TransferWitness,
) -> TransferOutput {
    // Verify sender owns the note
    let nullifier = zkvm::poseidon(&[witness.note_secret, witness.note_id]);
    zkvm::assert_eq(nullifier, input.nullifier);

    // Verify balance
    let balance = witness.note_amount;
    zkvm::assert_gte(balance, input.amount);

    // Create new notes
    let recipient_note = zkvm::poseidon(&[
        input.recipient,
        input.amount,
        witness.recipient_salt,
    ]);
    let change_note = zkvm::poseidon(&[
        witness.sender,
        balance - input.amount,
        witness.change_salt,
    ]);

    TransferOutput {
        nullifier,
        recipient_commitment: recipient_note,
        change_commitment: change_note,
    }
}
```

## Rationale

### RISC-V vs Custom ISA

RISC-V chosen for:
1. **Ecosystem**: Mature compilers (LLVM, GCC), debuggers, and tooling
2. **Simplicity**: Clean ISA design maps well to circuits
3. **Extensibility**: Custom extensions for ZK/FHE operations
4. **Proven**: Succinct SP1, RISC Zero demonstrate viability

### STARK-first vs SNARK-first

STARKs as core prover because:
1. **Post-quantum**: No pairing-based assumptions
2. **Transparent**: No trusted setup required
3. **Scalability**: Prover scales better than SNARKs for large programs
4. **Wrap for efficiency**: SNARK wrapper gives small on-chain proofs

### GPU before FPGA

Phased hardware acceleration because:
1. **Development velocity**: CUDA mature, FPGA takes longer
2. **Availability**: GPUs widely available (cloud + on-prem)
3. **Performance**: GPU sufficient for initial use cases
4. **FPGA later**: Higher performance ceiling once algorithms stabilized

### Custom FHE over Zama

Own implementation because:
1. **Licensing**: Zama's restrictive commercial license
2. **OpenFHE base**: BSD-licensed, well-audited
3. **Hardware integration**: Custom GPU/FPGA kernels
4. **Circuit optimization**: Tailored for ZKVM proving

## Backwards Compatibility

- **LP-45 Compatible**: ZKVM integrates with existing Z-Chain precompiles (0xF000-0xF05F)
- **LP-302 Compatible**: Extends zkEVM with general RISC-V computation
- **LP-503 Compatible**: Uses same validity proof interfaces

## Security Considerations

### Cryptographic Security

1. **STARK Security**: 128-bit security from hash function assumptions
2. **FHE Security**: 128-bit security from LWE/GLWE hardness
3. **SNARK Wrapper**: Groth16 with Powers of Tau ceremony

### Implementation Security

1. **Memory Safety**: Rust implementation, no unsafe code in hot paths
2. **Side Channels**: Constant-time field arithmetic
3. **Input Validation**: Strict bounds checking on all inputs

### Economic Security

1. **Proof Verification**: On-chain verification before state transitions
2. **Sequencer Rotation**: Decentralized sequencing via P-Chain validators
3. **Challenge Period**: 7-day challenge window for suspicious batches

## Test Cases

### Unit Tests

```rust
#[test]
fn test_zkvm_basic_execution() {
    let program = compile_program("add_numbers.rs");
    let input = PublicInput { a: 5, b: 7 };
    let output = zkvm.execute(&program, &input, &[]).unwrap();
    assert_eq!(output.result, 12);
}

#[test]
fn test_zkvm_proof_generation() {
    let program = compile_program("fibonacci.rs");
    let input = PublicInput { n: 20 };
    let execution = zkvm.execute(&program, &input, &[]).unwrap();
    let proof = zkvm.prove(&execution).unwrap();
    assert!(zkvm.verify(&proof, &input, &execution.output));
}

#[test]
fn test_fhe_operations_in_zkvm() {
    let program = compile_program("private_compare.rs");
    let ct_a = fhe.encrypt(100);
    let ct_b = fhe.encrypt(50);
    let output = zkvm.execute_fhe(&program, &[ct_a, ct_b]).unwrap();
    let result = fhe.decrypt(&output.ciphertexts[0]);
    assert_eq!(result, 1); // a > b
}
```

### Integration Tests

```rust
#[test]
fn test_batch_proof_settlement() {
    // Create batch of transactions
    let txs = generate_test_transactions(100);
    let batch = sequencer.create_batch(&txs);

    // Generate batch proof
    let proof = zkvm.prove_batch(&batch).unwrap();

    // Submit to C-Chain
    let tx_hash = c_chain.submit_batch_proof(&proof).await.unwrap();
    let receipt = c_chain.wait_for_receipt(&tx_hash).await.unwrap();

    assert!(receipt.success);
    assert_eq!(c_chain.get_state_root(), proof.new_state_root);
}
```

## Reference Implementation

- **ZKVM Core**: `github.com/luxfi/zkvm`
- **GPU Prover**: `github.com/luxfi/zkvm/cuda`
- **FPGA Prover**: `github.com/luxfi/zkvm/fpga` (Phase 2)
- **FHE Library**: `github.com/luxfi/fhe`
- **SDK**: `github.com/luxfi/zkvm-sdk`

### Directory Structure

```
zkvm/
├── core/
│   ├── src/
│   │   ├── executor/       # RISC-V execution
│   │   ├── trace/          # Trace generation
│   │   ├── air/            # AIR constraints
│   │   └── verifier/       # Proof verification
│   └── tests/
├── cuda/
│   ├── src/
│   │   ├── ntt/            # NTT kernels
│   │   ├── hash/           # Hash kernels
│   │   └── fri/            # FRI kernels
│   └── benchmarks/
├── fpga/
│   ├── rtl/                # Verilog/VHDL
│   ├── constraints/        # Timing constraints
│   └── bitstreams/         # Pre-built bitstreams
├── fhe/
│   ├── src/
│   │   ├── tfhe/           # TFHE implementation
│   │   ├── circuit/        # Circuit integration
│   │   └── gpu/            # GPU acceleration
│   └── tests/
└── sdk/
    ├── rust/               # Rust SDK
    ├── go/                 # Go SDK
    └── examples/           # Example programs
```

## Implementation Timeline

### Phase 1: GPU Acceleration (Q1 2025)
- [ ] ZKVM core in Rust
- [ ] CUDA prover implementation
- [ ] Basic FHE integration
- [ ] SDK and tooling

### Phase 2: FPGA Acceleration (Q3 2025)
- [ ] FPGA architecture design
- [ ] NTT/Hash accelerators
- [ ] Cloud deployment (AWS F2)
- [ ] On-prem deployment guides

### Phase 3: Production (Q4 2025)
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Cross-chain integration
- [ ] Developer documentation

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
