---
lp: 4101
title: Fully Homomorphic Encryption Patent Strategy
description: Patent strategy for Lux's FHE stack including patentable innovations and prosecution strategy
author: Lux Industries Inc (@luxfi)
status: Draft
type: Meta
created: 2025-12-27
---

# LP-8101: Lux FHE Patent Strategy

## Abstract

This LP documents the comprehensive patent strategy for Lux's Fully Homomorphic Encryption (FHE) stack, identifying patentable innovations unique to blockchain-integrated FHE, analyzing the existing patent landscape, and recommending a prosecution strategy.

## Motivation

Lux has developed a novel FHE stack comprising three libraries:
- **luxfi/fhe**: OpenFHE C++ fork with blockchain-specific optimizations (BSD-3-Clause)
- **luxfi/tfhe**: Pure Go TFHE implementation (BSD-3-Clause)
- **luxfi/lattice**: Go lattice cryptography primitives with multiparty protocols (Apache-2.0)

These libraries contain multiple innovations unique to blockchain-integrated FHE that warrant patent protection to:
1. Protect Lux's competitive advantage
2. Create licensing opportunities
3. Establish defensive patent portfolio
4. Prevent competitors from patenting blockchain-FHE combinations

---

## Part I: Patent Landscape Analysis

### Known Patents to Avoid

| Patent | Holder | Description | Filing Date | Our Mitigation |
|--------|--------|-------------|-------------|----------------|
| EP4195578 | Zama | Seed + Fourier ciphertext storage for PBS | 2021-12 | Use standard RLWE representation |
| EP4488821 | Zama | Shift-left PBS shift-right error reduction | 2022-03 | Use classical bootstrapping refresh |
| WO2023067928 | - | Integer-wise TFHE arithmetic circuits | 2022-10 | Novel limb composition approach |
| WO2023074133 | - | TFHE integer operations | 2022-11 | Alternative carry propagation |
| Intel FHE Accel | Intel | Hardware FHE acceleration | Various | Software-only implementations |

### Safe Prior Art We Build On

All our implementations build on these pre-2020 academic foundations:

1. **Chillotti et al. ASIACRYPT 2017**: Original TFHE programmable bootstrapping
2. **Ducas-Micciancio 2015**: FHEW binary gate bootstrapping  
3. **Mouchet et al. 2020**: Multiparty RLWE-based MHE (ePrint 2020/304)
4. **Mouchet et al. 2022**: Efficient t-out-of-N threshold RLWE (ePrint 2022/780)
5. **Generic LWE/RLWE**: Standard lattice cryptography (Regev 2005, RLWE 2010)

### Freedom to Operate Analysis

| Component | Risk Level | Notes |
|-----------|------------|-------|
| Core TFHE/FHEW | ✅ Low | Academic prior art, no patents |
| Blind Rotation | ✅ Low | Chillotti 2017 paper |
| Threshold FHE | ✅ Low | Mouchet papers, no patents |
| Radix Integers | ⚠️ Medium | Avoid Zama's specific techniques |
| GPU Acceleration | ⚠️ Medium | Verify against Intel/AMD patents |
| fhEVM Integration | ✅ Low | Novel to Lux |

---

## Part II: Patentable Innovations

### Category A: Consensus-FHE Integration (High Priority)

#### A1. Consensus-Integrated Threshold FHE

**Problem**: Existing threshold FHE requires separate communication rounds for distributed decryption, adding latency to blockchain finality.

**Innovation**: Integrate threshold FHE decryption into Lux Snow++ consensus protocol:

```
┌─────────────────────────────────────────────────────────────┐
│                    Lux Consensus Round                       │
├─────────────────────────────────────────────────────────────┤
│  1. Transaction includes FHE ciphertext requiring decrypt   │
│  2. During consensus sampling, validators:                   │
│     a. Vote on block validity                               │
│     b. Include partial decryption share in vote             │
│  3. Block proposer aggregates:                              │
│     a. Consensus votes → finality                           │
│     b. Decryption shares → plaintext                        │
│  4. Single-round threshold decrypt + finality               │
└─────────────────────────────────────────────────────────────┘
```

**Independent Claims**:
1. Method for combining threshold FHE partial decryption with blockchain consensus voting in a single protocol round
2. System for achieving both block finality and ciphertext decryption through stake-weighted validator sampling
3. Apparatus for piggy-backing cryptographic secret shares on consensus messages

**Files**: `fhe/threshold/` (planned), `lattice/multiparty/threshold.go`

---

#### A2. Deterministic FHE Random Number Generation

**Problem**: FHE operations require random sampling (noise, blinding), but blockchain requires deterministic execution across all nodes.

**Innovation**: SHA256-based deterministic PRNG seeded from blockchain state:

```go
type FheRNG struct {
    state   [32]byte  // SHA256 state
    counter uint64    // Monotonic counter
}

func (rng *FheRNG) advance() [32]byte {
    data := append(rng.state[:], counter...)
    rng.state = sha256.Sum256(data)
    rng.counter++
    return rng.state
}
```

**Independent Claims**:
1. Method for generating deterministic encrypted random values in FHE operations using cryptographic hash-based state machine
2. System for blockchain-compatible FHE randomness where all validators produce identical ciphertext outputs
3. Computer-implemented method for seeding FHE operations from blockchain state (block hash, transaction hash)

**Files**: `tfhe/random.go:1-181`

---

#### A3. Validator Keyshare Rotation Without Downtime

**Problem**: Threshold FHE requires key resharing when validator set changes. Naive approach requires downtime.

**Innovation**: Proactive secret sharing with encrypted keyshare migration:

```
Epoch N validators: {V1, V2, V3}  holding shares {s1, s2, s3}
Epoch N+1 validators: {V2, V3, V4}

1. V1 (leaving) encrypts share to V4 (joining) using V4's public key
2. V2, V3 participate in MPC to re-randomize shares
3. V4 decrypts their new share
4. New threshold set {V2, V3, V4} can decrypt
5. Old share s1 is information-theoretically destroyed

No downtime: decryption works throughout transition
```

**Independent Claims**:
1. Method for zero-downtime threshold cryptographic keyshare rotation during validator set changes
2. System for encrypted keyshare migration between leaving and joining blockchain validators
3. Protocol for maintaining threshold FHE decryption capability during validator epoch transitions

**Files**: `fhe/threshold/rotation.cpp` (planned), `lattice/multiparty/`

---

### Category B: Performance Optimizations (High Priority)

#### B1. Transaction-Batch Amortized Bootstrapping

**Problem**: Each FHE operation requires expensive bootstrapping (~13ms). Blockchain transactions arrive in batches but are processed independently.

**Innovation**: Batch bootstrap keys across transactions in a block:

```
Traditional:
  Tx1: [op1 → bootstrap → op2 → bootstrap]  Total: N×bootstrap
  Tx2: [op1 → bootstrap → op2 → bootstrap]
  Tx3: [op1 → bootstrap → op2 → bootstrap]

Lux Batched:
  Block: [Tx1.op1, Tx2.op1, Tx3.op1] → BATCH_BOOTSTRAP → [Tx1.op2, Tx2.op2, Tx3.op2]
  Total: ceil(N/batch_size)×bootstrap
```

**Key Insight**: EVM execution is deterministic - we can analyze the FHE operation DAG across all transactions before execution and schedule bootstraps optimally.

**Independent Claims**:
1. Method for analyzing FHE operation dependencies across multiple blockchain transactions to identify batching opportunities
2. System for cross-transaction bootstrap batching achieving GPU throughput saturation
3. DAG-based scheduler minimizing total bootstrap operations per blockchain block

**Files**: `fhe/src/binfhe/include/batch/binfhe-batch.h:1-278`

---

#### B2. Lazy Carry Propagation with Deterministic Noise Tracking

**Problem**: Radix integer arithmetic requires carry propagation via bootstrapping. Existing implementations bootstrap after every operation.

**Innovation**: Track noise accumulation deterministically and defer carries:

```cpp
// Traditional: bootstrap after each add
result = add(a, b);  // bootstrap
result = add(result, c);  // bootstrap
result = add(result, d);  // bootstrap
// 3 bootstraps

// Lux Lazy Carry:
result = add_lazy(a, b);  // accumulate noise
result = add_lazy(result, c);  // accumulate noise  
result = add_lazy(result, d);  // accumulate noise
result = propagate_if_needed(result);  // 1 bootstrap (if noise exceeds threshold)
// 0-1 bootstraps depending on noise budget
```

**Key Insight**: 2-bit carry buffer in limb representation allows 2-3 additions before overflow. Track noise deterministically based on operation count.

**Independent Claims**:
1. Method for deterministic noise budget tracking for FHE radix integers using operation counting
2. Lazy carry propagation system with configurable bootstrap threshold
3. Computer-implemented method for deferring FHE bootstrapping based on accumulated operation history

**Files**: `fhe/src/binfhe/include/radix/radix.h`, `fhe/docs/novel-optimizations.md:80-107`

---

#### B3. Batch DAG Execution for FHE Operations

**Problem**: Individual FHE operations have high overhead. GPU utilization is low with sequential execution.

**Innovation**: DAG-based scheduling with async futures:

```cpp
class BatchDAG {
    size_t AddBootstrap(size_t input_id);
    size_t AddEvalFunc(size_t input_id, const std::vector<NativeInteger>& lut);
    size_t AddBinGate(BINGATE gate, size_t input1_id, size_t input2_id);
    BatchResult Execute(uint32_t flags = BATCH_DEFAULT);
};

// Multi-output function evaluation for (sum, carry) pairs
BatchResult EvalFuncMultiOutputBatch(
    BinFHEContext& cc,
    const std::vector<LWECiphertext>& ct_in,
    const std::vector<std::vector<NativeInteger>>& luts,
    std::vector<LWECiphertext>& ct_out
);
```

**Independent Claims**:
1. DAG-based scheduler for FHE operations enabling optimal GPU batching
2. Multi-output batch function evaluation for FHE radix arithmetic (producing sum and carry simultaneously)
3. Async batch processing system for FHE with future-based result retrieval

**Files**: `fhe/src/binfhe/include/batch/binfhe-batch.h:225-275`

---

### Category C: Blockchain Infrastructure (Medium Priority)

#### C1. Consensus-Specific FHE Parameters

**Problem**: Different blockchain applications have different security/performance tradeoffs. Single parameter set is suboptimal.

**Innovation**: Per-chain configurable FHE parameters:

```
Chain A (High-frequency DeFi):
  - Security: 128-bit
  - Message bits: 4 per limb
  - Bootstrap: ~8ms (faster, lower precision)

Chain B (Confidential Voting):
  - Security: 256-bit
  - Message bits: 2 per limb
  - Bootstrap: ~20ms (slower, higher security)

Chain C (Privacy-Preserving ML):
  - Security: 128-bit
  - CKKS mode for approximate arithmetic
  - No bootstrapping (leveled)
```

**Independent Claims**:
1. Blockchain chain architecture with per-chain FHE parameter selection based on application requirements
2. Cross-chain encrypted data migration with automatic parameter conversion
3. Dynamic FHE security level adjustment based on chain policy configuration

**Files**: `fhe/src/binfhe/include/fhevm/fhevm.h`

---

#### C2. Precompile Gas Metering for FHE Operations

**Problem**: FHE operations have highly variable cost. Flat gas pricing leads to DoS vectors or underpriced operations.

**Innovation**: Dynamic gas pricing based on operation complexity:

```solidity
function estimateGas(FheOp op, FheType type) returns (uint256) {
    uint256 base = 10000;
    uint256 bits = typeBits(type);
    
    if (op == FheOp.ADD || op == FheOp.SUB) {
        return base + bits * 500;  // Linear in bits
    } else if (op == FheOp.MUL) {
        return base + bits * bits * 50;  // Quadratic
    } else if (op == FheOp.DIV) {
        return base + bits * bits * bits * 5;  // Cubic
    }
}
```

**Independent Claims**:
1. Method for computing EVM gas costs for FHE operations based on encrypted data type width
2. Operation-specific gas formulae reflecting cryptographic complexity for blockchain FHE
3. Dynamic gas adjustment based on current FHE coprocessor load

**Files**: `fhe/src/binfhe/include/fhevm/fhevm.cpp`

---

#### C3. Encrypted Index Private Information Retrieval

**Problem**: Smart contracts accessing encrypted arrays leak access patterns.

**Innovation**: FHE-native PIR using programmable bootstrapping:

```cpp
// Traditional: access pattern leaked
encrypted_value = array[encrypted_index];  // Server sees which index

// Lux PIR:
// 1. Client encrypts index
// 2. For each position, compute: select(eq(i, encrypted_index), array[i], zero)
// 3. Sum all positions → encrypted result at encrypted index
encrypted_value = fhe_pir(array, encrypted_index);
```

**Independent Claims**:
1. Method for private information retrieval using FHE select operations with no access pattern leakage
2. Batched CMUX evaluation for oblivious encrypted array access
3. Smart contract pattern for private array indexing without revealing access position

**Files**: `fhe/fhevm/pir.cpp` (planned)

---

### Category D: GPU Acceleration (High Priority)

#### D1. Backend Abstraction for FHE GPU Acceleration

**Problem**: FHE operations are computationally intensive. Existing implementations are tightly coupled to specific hardware backends.

**Innovation**: Pluggable backend abstraction enabling MLX/CUDA/CPU backends with identical outputs:

```cpp
class BinFHEBackend {
public:
    virtual void BlindRotate(
        RingGSWACCKey& bk,
        RLWE& acc,
        const std::vector<NativeInteger>& a,
        const NativeInteger& mod
    ) = 0;
    
    virtual void ExternalProduct(
        RingGSWCiphertext& ct,
        RLWE& acc,
        NativeInteger scale
    ) = 0;
    
    virtual LWECiphertext SampleExtract(
        const RLWE& acc,
        uint32_t index
    ) = 0;
};

class BackendCPU : public BinFHEBackend { ... };
class BackendMLX : public BinFHEBackend { ... };  // Apple Silicon
class BackendCUDA : public BinFHEBackend { ... }; // NVIDIA
```

**Key Insight**: Integer-only kernels (no floats) ensure bit-identical results across backends for blockchain consensus.

**Independent Claims**:
1. Pluggable backend architecture for FHE operations enabling transparent CPU/GPU execution
2. Integer-only GPU kernel implementations for FHE ensuring deterministic blockchain execution
3. Backend abstraction layer enabling FHE hardware acceleration without algorithm modification

**Files**: `fhe/docs/gpu-coprocessor-roadmap.md`, `fhe/src/binfhe/lib/backend/`

---

#### D2. Packed Device Formats for Zero-Copy GPU Transfer

**Problem**: Transferring FHE ciphertexts and keys between CPU and GPU incurs memory copy overhead.

**Innovation**: Canonical binary layouts for zero-copy GPU transfer:

```cpp
// Packed LWE ciphertext - ready for GPU memory mapping
struct PackedLWECt {
    uint32_t version;
    uint32_t n;          // LWE dimension
    uint32_t log_q;      // Modulus bits
    int64_t* data;       // [a_0, ..., a_{n-1}, b] contiguous
};

// Packed bootstrapping key - row-major for coalesced GPU access
struct PackedBTKey {
    uint32_t version;
    uint32_t n;          // Input LWE dimension
    uint32_t N;          // Ring dimension
    uint32_t k;          // RLWE dimension  
    uint32_t base_g;     // Gadget base
    uint32_t num_levels; // Decomposition levels
    int64_t* data;       // RGSW samples packed row-major
};
```

**Independent Claims**:
1. Binary format for FHE ciphertexts enabling zero-copy GPU memory mapping
2. Row-major packed representation for bootstrapping keys optimized for GPU coalesced access
3. Versioned serialization format for FHE cryptographic material with hardware-agnostic layout

**Files**: `fhe/docs/gpu-coprocessor-roadmap.md:69-99`

---

#### D3. Multi-GPU FHE Kernel Coordination

**Problem**: Single GPU throughput is insufficient for high-volume FHE operations. Multi-GPU coordination has synchronization overhead.

**Innovation**: Deterministic integer GPU kernels with batch-level parallelism:

```cpp
// Gadget decomposition kernel - distributable across GPUs
__global__ void gadget_decompose(
    const int64_t* input,    // [batch, n]
    int64_t* output,         // [batch, n, levels]
    uint32_t n,
    uint32_t base_g,
    uint32_t num_levels
);

// External product kernel (NTT-domain) - GPU-local NTT
__global__ void external_product_ntt(
    const int64_t* acc,      // [batch, N]
    const int64_t* bk,       // [n, k, levels, N]
    const int64_t* decomp,   // [batch, n, levels]
    int64_t* result,         // [batch, N]
    uint32_t N, uint32_t n, uint32_t k, uint32_t levels
);

// Blind rotation - batch-parallelizable across GPUs
__global__ void blind_rotate(
    const int64_t* acc_in,
    const int64_t* bk,
    const int32_t* lwe_a,    // [batch, n]
    int64_t* acc_out,
    uint32_t batch, uint32_t n, uint32_t N
);
```

**Key Insight**: Partition bootstrapping batch across GPUs, each GPU holds full bootstrapping key copy, combine results via simple reduction.

**Independent Claims**:
1. Multi-GPU coordination for FHE blind rotation with batch partitioning
2. Deterministic integer kernel design ensuring identical results across GPU architectures
3. Distributed NTT strategy for FHE external product across multiple GPUs

**Files**: `fhe/docs/gpu-coprocessor-roadmap.md:141-176`, `fhe/src/core/include/math/hal/mlx/`, `fhe/src/core/include/math/hal/cuda/`

---

### Category F: Pure Go Innovation (Medium Priority)

#### F1. Pure Go TFHE Without CGO

**Problem**: C/C++ FHE libraries require CGO for Go integration, limiting cloud deployment and increasing complexity.

**Innovation**: Complete TFHE implementation in pure Go:

```go
// Pure Go blind rotation without CGO
func (eval *Evaluator) bootstrap(ct *Ciphertext, testPoly *ring.Poly) (*Ciphertext, error) {
    testPolyMap := map[int]*ring.Poly{0: testPoly}
    results, err := eval.eval.Evaluate(ct.Ciphertext, testPolyMap, eval.bsk.BRK)
    // ... pure Go implementation
}
```

**Benefits**:
- No C compiler required for deployment
- Cross-platform binary compilation
- Easier cloud/serverless deployment
- Memory safety guarantees

**Independent Claims**:
1. Pure Go implementation of TFHE programmable bootstrapping without foreign function interfaces
2. Method for deploying FHE operations in cloud environments without native code dependencies
3. Cross-platform FHE execution system using managed runtime languages

**Files**: `tfhe/*.go`, `lattice/schemes/tfhe/*.go`

---

### Category E: Threshold Protocol Innovations (Medium Priority)

#### E1. Efficient t-out-of-N Threshold RLWE Extension

**Innovation**: Extension of N-out-of-N threshold to t-out-of-N using Lagrange interpolation at the polynomial level:

```go
// Combiner converts t-out-of-N Shamir shares to t-out-of-t additive shares
func (cmb Combiner) GenAdditiveShare(activesPoints []ShamirPublicPoint, 
    ownPoint ShamirPublicPoint, ownShare ShamirSecretShare, skOut *rlwe.SecretKey) error {
    
    // Compute Lagrange coefficient for this party
    prod := cmb.one
    for _, active := range activesPoints[:cmb.threshold] {
        if active != ownPoint {
            cmb.ringQP.MulRNSScalar(prod, cmb.lagrangeCoeffs[active], prod)
        }
    }
    // Multiply share by Lagrange coefficient
    cmb.ringQP.MulRNSScalarMontgomery(ownShare.Poly, prod, skOut.Value)
    return nil
}
```

**Key Insight**: Evaluate Lagrange coefficient multiplication on shares BEFORE function evaluation to avoid noise amplification.

**Note**: This builds on Mouchet et al. 2022 paper. Patent claims should focus on blockchain-specific applications.

**Files**: `lattice/multiparty/threshold.go:1-225`, `lattice/multiparty/README.md`

---

## Part III: Prosecution Strategy

### Priority Ranking

| Innovation | Priority | Estimated Value | Risk if Not Filed |
|------------|----------|-----------------|-------------------|
| A1. Consensus-Integrated Threshold FHE | 🔴 Critical | High | Competitors could claim |
| A2. Deterministic FHE RNG | 🔴 Critical | High | Essential for blockchain FHE |
| B1. Transaction-Batch Bootstrapping | 🔴 Critical | High | Performance differentiator |
| D1. Backend Abstraction GPU | 🔴 Critical | High | GPU vendors could claim |
| D2. Packed Device Formats | 🟡 High | High | Performance critical |
| D3. Multi-GPU Coordination | 🟡 High | High | Scaling differentiator |
| B2. Lazy Carry Propagation | 🟡 High | Medium | May overlap with prior art |
| B3. Batch DAG Execution | 🟡 High | Medium | GPU optimization essential |
| C2. Gas Metering | 🟡 High | Medium | fhEVM differentiator |
| A3. Keyshare Rotation | 🟢 Medium | Medium | Operational feature |
| C1. Chain Parameters | 🟢 Medium | Low | Configuration feature |
| C3. Encrypted PIR | 🟢 Medium | Medium | Privacy feature |
| E1. Pure Go TFHE | 🟢 Medium | Low | Implementation choice |

### Recommended Filing Order

**Phase 1 (Q1 2025) - Core Blockchain-FHE**:
1. A1: Consensus-Integrated Threshold FHE
2. A2: Deterministic FHE RNG
3. B1: Transaction-Batch Bootstrapping
4. D1: Backend Abstraction for GPU Acceleration

**Phase 2 (Q2 2025) - GPU & Performance**:
5. D2: Packed Device Formats
6. D3: Multi-GPU Coordination
7. B2: Lazy Carry Propagation
8. B3: Batch DAG Execution

**Phase 3 (Q3 2025) - Infrastructure**:
9. C2: Gas Metering
10. A3: Keyshare Rotation
11. C3: Encrypted PIR
12. C1: Chain Parameters
13. F1: Pure Go TFHE

### Filing Jurisdictions

| Jurisdiction | Reason | Priority |
|--------------|--------|----------|
| USPTO (US) | Primary market, strong enforcement | Required |
| EPO (Europe) | Strong crypto industry | Required |
| WIPO (PCT) | International coverage | Required |
| Singapore | Crypto hub | Optional |
| Japan | Tech patents respected | Optional |

---

## Part IV: Defensive Considerations

### Potential Prior Art Searches Required

Before filing, conduct comprehensive prior art searches for:

- [ ] TFHE paper (Chillotti et al.) - ensure our claims don't overlap
- [ ] FHEW paper (Ducas-Micciancio) - binary gate bootstrapping
- [ ] Lattigo library (EPFL) - open source implementations
- [ ] HElib (IBM) - historical FHE work
- [ ] SEAL (Microsoft) - Microsoft's FHE library
- [ ] All Zama patents (EP4195578, WO2023067928, EP4488821)
- [ ] Intel/AMD FHE acceleration patents
- [ ] Inpher patents (threshold FHE)

### Defensive Publications

Consider defensive publications for innovations we don't patent:
- Pure Go implementation details (prevent others from patenting)
- Specific test polynomial formulations
- Integration patterns with existing frameworks

### Cross-License Considerations

Potential cross-licensing partners:
- EPFL (Lattigo authors)
- Microsoft (SEAL)
- OpenFHE consortium
- Duality Technologies

---

## Part V: Implementation Status

| Innovation | Code Status | Documentation | Patent Draft |
|------------|-------------|---------------|--------------|
| A1. Consensus-Integrated | Planned | ✅ Complete | Not started |
| A2. Deterministic RNG | ✅ Complete | ✅ Complete | Not started |
| A3. Keyshare Rotation | Planned | ✅ Complete | Not started |
| B1. Batch Bootstrapping | ✅ Complete | ✅ Complete | Not started |
| B2. Lazy Carry | ✅ Complete | ✅ Complete | Not started |
| B3. Batch DAG | ✅ Complete | ✅ Complete | Not started |
| C1. Chain Parameters | Partial | ✅ Complete | Not started |
| C2. Gas Metering | Partial | ✅ Complete | Not started |
| C3. Encrypted PIR | Planned | ✅ Complete | Not started |
| D1. Backend Abstraction GPU | ✅ Complete | ✅ Complete | Not started |
| D2. Packed Device Formats | ✅ Complete | ✅ Complete | Not started |
| D3. Multi-GPU Coordination | Partial | ✅ Complete | Not started |
| F1. Pure Go TFHE | ✅ Complete | ✅ Complete | Not started |

---

## References

1. Chillotti et al., "TFHE: Fast Fully Homomorphic Encryption over the Torus", ASIACRYPT 2017
2. Ducas-Micciancio, "FHEW: Bootstrapping Homomorphic Encryption in Less Than a Second", EUROCRYPT 2015
3. Mouchet et al., "Multiparty Homomorphic Encryption from Ring-Learning-With-Errors", ePrint 2020/304
4. Mouchet et al., "An Efficient Threshold Access-Structure for RLWE-Based Multiparty Homomorphic Encryption", ePrint 2022/780
5. Regev, "On Lattices, Learning with Errors, Random Linear Codes, and Cryptography", STOC 2005
6. Brakerski-Vaikuntanathan, "Efficient Fully Homomorphic Encryption from (Standard) LWE", FOCS 2011

---

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-27 | AI | Initial draft with 10 innovations identified |
| 2025-12-27 | AI | Added GPU acceleration category (D1-D3): Backend abstraction, packed formats, multi-GPU coordination |

---

*This document is prepared for Lux Industries Inc patent review. Not legal advice. All claims require review by patent counsel.*
