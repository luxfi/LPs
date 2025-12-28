---
lp: 202
title: Z-Chain - GPU-Accelerated Privacy Subnet
description: Privacy-focused L1 subnet with FHE, ZK, and GPU acceleration
author: Lux Network (@luxfi)
status: Draft
type: Standards Track
category: Core
created: 2025-12-28
requires: 11, 200, 201
---

# LP-0202: Z-Chain - GPU-Accelerated Privacy Subnet

## Abstract

This LP specifies the Z-Chain, a sovereign L1 subnet optimized for privacy-preserving computation using FHE (Fully Homomorphic Encryption), ZK proofs, and GPU acceleration. Z-Chain provides the execution layer for confidential DeFi, private AI inference, and encrypted data processing at scale.

## Motivation

Privacy on public blockchains requires:
1. **Encrypted Computation**: Process data without decryption
2. **Performance**: FHE/ZK operations must be practical
3. **Decentralization**: No single party holds decryption keys
4. **Interoperability**: Seamless communication with C-Chain and other subnets

Z-Chain addresses these through:
- Native fhEVM precompiles (LP-0200)
- zkVM execution (LP-0201)
- Multi-GPU parallel processing (MLX/CUDA)
- Threshold key management via T-Chain

## Specification

### Chain Configuration

```yaml
chainId: 36900  # Z-Chain mainnet
networkId: 1     # Lux mainnet
vmId: "zg3GReYPNuSR17rUP8acMdZipQBikdXNRKDyFszAysmy3vDXE"
consensus: Snowman

validators:
  minStake: 100000 LUX
  minValidators: 9
  threshold: 5-of-9  # For threshold decryption

hardware:
  required:
    - GPU: "NVIDIA H100/H200 or Apple M3+"
    - VRAM: "80GB+ per GPU"
    - CPU: "32+ cores"
    - RAM: "256GB+"
  recommended:
    - GPU: "8x NVIDIA H200 (HGX)"
    - VRAM: "1.1TB total"
    - NVLink: "900 GB/s interconnect"
```

### Precompile Addresses

Z-Chain extends the fhEVM (LP-0200) and zkVM (LP-0201) with GPU-accelerated versions:

| Address Range | Category | Description |
|---------------|----------|-------------|
| 0x0500-0x052F | fhEVM | FHE operations (GPU accelerated) |
| 0x0600-0x061F | zkVM | ZK verification (GPU accelerated) |
| 0x0700-0x070F | Privacy | Privacy primitives |
| 0x0710-0x071F | Threshold | Threshold operations |

#### Privacy Precompiles

| Address | Precompile | Description |
|---------|-----------|-------------|
| 0x0700 | COMMIT | Pedersen commitment |
| 0x0701 | NULLIFIER | Compute nullifier hash |
| 0x0702 | MERKLE_INSERT | Insert into commitment tree |
| 0x0703 | MERKLE_PROVE | Generate Merkle proof |
| 0x0704 | SHIELDED_TRANSFER | Encrypted transfer |
| 0x0705 | NOTE_CREATE | Create encrypted note |
| 0x0706 | NOTE_SPEND | Spend note with ZK proof |
| 0x0710 | THRESHOLD_KEYGEN | Distributed key generation |
| 0x0711 | THRESHOLD_SIGN | Threshold signature |
| 0x0712 | THRESHOLD_DECRYPT | Threshold decryption |
| 0x0713 | THRESHOLD_REKEY | Key rotation |

### GPU Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Z-Chain Validator Node                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   EVM       │  │   fhEVM     │  │   zkVM      │         │
│  │   (CPU)     │  │   (GPU)     │  │   (GPU)     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │              GPU Execution Engine                      │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │            MLX/CUDA Backend Selection            │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │  GPU 0   │  │  GPU 1   │  │  GPU N   │           │ │
│  │  │ (H200)   │  │ (H200)   │  │ (H200)   │   ...     │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │ │
│  │       │             │             │                  │ │
│  │       └─────────────┼─────────────┘                  │ │
│  │                     │ NVLink (900 GB/s)              │ │
│  └─────────────────────┼─────────────────────────────────┘ │
│                        │                                   │
│  ┌─────────────────────▼─────────────────────────────────┐ │
│  │            Bootstrap Key Cache (GPU Memory)            │ │
│  │  Per-user BK: ~170MB │ 10,000 users: 1.7TB            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Performance Targets

| Configuration | FHE Gates/sec | ZK Proofs/sec | Users |
|--------------|---------------|---------------|-------|
| M3 Max (Metal) | 60,000 | 100 | 300 |
| H100 (CUDA) | 180,000 | 500 | 1,000 |
| H200 (CUDA) | 250,000 | 700 | 1,500 |
| HGX H200 x8 | 1,500,000 | 4,000 | 10,000 |

### Batch Processing

GPU execution is batched for efficiency:

```go
// BatchPBSScheduler groups operations by type
type BatchConfig struct {
    MaxBatchSize    int           // 256 default
    FlushInterval   time.Duration // 10ms
    GateTypes       []GateType    // AND, OR, XOR, etc.
}

// Automatic batching across users
func (e *Engine) QueueGate(userId uint64, gate GateType, inputs, output []uint64) {
    e.scheduler.Queue(userId, gate, inputs, output)
    
    if e.scheduler.BatchFull() || e.scheduler.TimeoutReached() {
        e.scheduler.Flush() // Execute batch on GPU
    }
}
```

### Memory Layout (Structure of Arrays)

```cpp
// SoA layout for coalesced GPU memory access
struct LWECiphertextBatch {
    uint64_t* a;     // [BatchSize, LweDimension]
    uint64_t* b;     // [BatchSize]
    size_t count;
};

struct BootstrapKeyGPU {
    uint64_t* data;  // [LweDimension, 2, DecompLevel, 2, RingDimension]
    // Stored in NTT domain for O(N) external product
};
```

### Threshold Integration

Z-Chain validators participate in threshold key management:

```solidity
interface IZChainThreshold {
    // Distributed key generation
    function initializeKeyGen(
        uint256 threshold,
        uint256 numParties
    ) external returns (bytes32 sessionId);
    
    // Threshold decryption request
    function requestDecryption(
        bytes calldata ciphertext,
        bytes4 callback
    ) external returns (uint256 requestId);
    
    // Submit decryption share
    function submitDecryptionShare(
        uint256 requestId,
        bytes calldata share,
        bytes calldata proof
    ) external;
    
    // Key rotation (requires threshold approval)
    function initiateKeyRotation() external returns (bytes32 rotationId);
}
```

### Warp Messaging

Z-Chain communicates with C-Chain via Warp messages:

```solidity
// Deposit from C-Chain to Z-Chain (shield)
function depositToZChain(
    bytes32 commitment,
    bytes calldata encryptedAmount
) external returns (bytes32 warpMessageId);

// Withdraw from Z-Chain to C-Chain (unshield)
function withdrawFromZChain(
    bytes32 nullifier,
    bytes calldata rangeProof,
    address recipient,
    uint256 amount
) external returns (bytes32 warpMessageId);
```

### Gas Pricing

Z-Chain uses compute-weighted gas:

```solidity
// Base gas + GPU compute units
uint256 gasUsed = baseGas + (gpuUnits * gpuGasMultiplier);

// GPU gas multiplier varies by operation complexity
mapping(bytes4 => uint256) public gpuGasMultiplier;
// FHE_ADD: 10
// FHE_MUL: 50 (requires bootstrapping)
// ZK_GROTH16_VERIFY: 200
// THRESHOLD_DECRYPT: 500
```

### State Model

Z-Chain uses a shielded state model:

```
┌─────────────────────────────────────────────┐
│              Z-Chain State                   │
├─────────────────────────────────────────────┤
│  Public State (EVM)                         │
│  ├── Contract bytecode                      │
│  ├── Public storage slots                   │
│  └── Account balances (public portion)      │
├─────────────────────────────────────────────┤
│  Shielded State (FHE)                       │
│  ├── Encrypted balances (ciphertexts)       │
│  ├── Encrypted storage slots                │
│  └── FHE key registry                       │
├─────────────────────────────────────────────┤
│  Commitment State (ZK)                      │
│  ├── Merkle tree of commitments             │
│  ├── Nullifier set                          │
│  └── Note registry                          │
└─────────────────────────────────────────────┘
```

## Rationale

### Why a Separate Subnet?

1. **Hardware Requirements**: GPU nodes are expensive; not all validators need them
2. **Specialized Validation**: FHE/ZK require specific verification logic
3. **Economic Model**: Separate fee market for compute-intensive operations
4. **Security Isolation**: Threshold keys isolated from general-purpose chains

### Why GPU Acceleration?

FHE operations are embarrassingly parallel:
- NTT (Number Theoretic Transform) over polynomials
- External product with decomposed digits
- Batch operations on multiple users

Single-threaded CPU: ~50ms per gate
8x H200 GPUs: ~0.7μs per gate (70,000x speedup)

### Why Threshold Keys?

FHE requires a global key for encrypted computation:
- Single key holder: Centralization risk
- Multi-party key: Threshold (5-of-9) prevents compromise
- Rotation: Regular key updates limit exposure window

## Security Considerations

### GPU Side Channels

GPU timing attacks are mitigated by:
- Constant-time NTT implementations
- Memory access pattern obfuscation
- Batch processing (all operations take same time)

### Threshold Compromise

If threshold parties collude:
- Historical ciphertexts become decryptable
- New keys can be generated (rotation)
- Proactive secret sharing limits window

### Validator Requirements

Hardware requirements create a barrier:
- Mitigated by delegation (stake without running node)
- GPU pools for smaller validators
- Cloud provider partnerships

## Backwards Compatibility

Z-Chain is a new L1 subnet. C-Chain contracts can interact via:
- Warp messages for cross-chain calls
- Teleport bridge for asset transfers
- Light client verification for state proofs

## Reference Implementation

- GPU TFHE Engine: `github.com/luxfi/tfhe/gpu`
- Z-Chain VM: `github.com/luxfi/z-chain`
- MLX Backend: `github.com/luxfi/fhe` (OpenFHE fork)
- Threshold Integration: `github.com/luxfi/threshold`

## Dependencies

- LP-0011: Chain Types (L1 specification)
- LP-0200: fhEVM Architecture
- LP-0201: zkVM Architecture
- LP-0203: Threshold FHE Integration
- LP-7000: T-Chain Specification

---

*Copyright 2025 Lux Industries Inc. All rights reserved.*
