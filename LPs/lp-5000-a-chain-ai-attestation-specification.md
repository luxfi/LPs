---
lp: 5000
title: A-Chain - Core AI/Attestation Specification
tags: [core, ai, attestation, tee, a-chain]
description: Core specification for the A-Chain (AI Virtual Machine), Lux Network's attestation and AI compute chain
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-11
requires: 0000, 99, 70
order: 0
---

## Abstract

LP-5000 specifies the A-Chain (AI Virtual Machine), Lux Network's attestation layer providing network-wide verification of trusted execution environments (TEEs) across all compute classes (CPU, GPU, NPU, ASIC). The A-Chain serves as the single source of truth for device attestation.

## Motivation

A unified attestation layer provides:

1. **Security**: Single root of trust for all TEE devices
2. **Interoperability**: Any Lux chain can verify device trustworthiness
3. **AI Compute**: Native support for AI workloads verification
4. **Economics**: Clear separation between security (LUX) and application tokens

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `A` |
| VM ID | `aivm` |
| VM Name | `aivm` |
| Block Time | 2 seconds |
| Consensus | Quasar |

### Implementation

**Go Package**: `github.com/luxfi/node/vms/aivm`

```go
import (
    avm "github.com/luxfi/node/vms/aivm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var AIVMID = constants.AIVMID // ids.ID{'a', 'i', 'v', 'm'}

// Create A-Chain VM
factory := &avm.Factory{}
vm, err := factory.New(logger)
```solidity

### Directory Structure

```
node/vms/aivm/
├── attestation/      # TEE attestation logic
├── config/           # Chain configuration
├── nvtrust/          # NVIDIA Confidential Computing
├── registry/         # Device registry
├── scheduler/        # Task scheduling
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
└── *_test.go         # Tests
```go

### Core Components

#### 1. Attestation Registry

```go
type DeviceStatus struct {
    DeviceID    ids.ID
    Attested    bool
    TrustScore  uint8     // 0-100
    LastSeen    time.Time
    Operator    Address
    Vendor      TEEVendor
    ComputeType ComputeClass // CPU, GPU, NPU, ASIC
}

type AttestationRegistry struct {
    Devices     map[ids.ID]*DeviceStatus
    RootCAs     map[TEEVendor][]byte
    MerkleRoot  [32]byte
}
```

#### 2. Proof of Execution

```go
type ProofOfExecution struct {
    DeviceID    ids.ID
    CPUQuote    []byte    // TEE quote from CPU
    GPUQuote    []byte    // Optional: TEE quote from GPU
    Nonce       uint64
    JobHash     [32]byte
    OutputHash  [32]byte
    Timestamp   time.Time
}
```solidity

#### 3. NVTrust Chain-Binding (Double-Spend Prevention)

The core mechanism preventing AI work from being claimed on multiple chains:

```go
// WorkContext binds work to a specific chain BEFORE compute runs
type WorkContext struct {
    ChainID     ChainId   // HANZO (36963) / ZOO (200200) / LUX (96369)
    JobID       [32]byte  // Specific workload or block height
    ModelHash   [32]byte  // Which model
    InputHash   [32]byte  // Which data / prompt
    DeviceID    [32]byte  // GPU identity
    Nonce       [32]byte  // Unique per job
    Timestamp   uint64    // Unix timestamp
}

// AttestedReceipt is signed by NVTrust enclave
type AttestedReceipt struct {
    Context         WorkContext
    ResultHash      [32]byte      // Hash of output
    WorkMetrics     WorkMetrics   // FLOPs, tokens, compute time
    NVTrustSig      []byte        // Rooted in NVIDIA hardware attestation
    SPDMEvidence    []byte        // SPDM measurement response
}

// SpentKey uniquely identifies a minted work unit
// Key = BLAKE3(device_id || nonce || chain_id)
type SpentKey [32]byte

// SpentSet tracks all minted work to prevent double-spend
type SpentSet map[SpentKey]bool
```

**Verification Flow:**

```go
func (vm *VM) VerifyAndMint(receipt *AttestedReceipt) error {
    // 1. Verify NVTrust signature is valid
    if !nvtrust.VerifySignature(receipt) {
        return ErrInvalidAttestation
    }

    // 2. Verify chain_id matches THIS chain
    if receipt.Context.ChainID != vm.chainID {
        return ErrWrongChain
    }

    // 3. Compute unique spent key
    key := blake3.Hash(concat(
        receipt.Context.DeviceID[:],
        receipt.Context.Nonce[:],
        uint32ToBytes(receipt.Context.ChainID),
    ))

    // 4. Check spent set (double-spend prevention)
    if vm.spentSet[key] {
        return ErrAlreadyMinted
    }

    // 5. Mark as spent and mint reward
    vm.spentSet[key] = true
    reward := calculateReward(receipt.WorkMetrics)
    return vm.mintReward(receipt.Context.DeviceID, reward)
}
```solidity

**Key Invariant:** The same AI work can't be minted on Hanzo, Lux, AND Zoo - only on the chain specified in the pre-committed `WorkContext.ChainID`.

#### Multi-Chain Mining (Same GPU)

The same GPU can mine for Hanzo, Lux, Zoo simultaneously, but each chain requires a separate job with a different `ChainID`:

| GPU | Hanzo Receipt | Zoo Receipt | Lux Receipt |
|-----|---------------|-------------|-------------|
| H100-001 | ChainID: 36963 | ChainID: 200200 | ChainID: 96369 |
| H100-001 | Valid on Hanzo | Invalid on Hanzo | Invalid on Hanzo |

#### Supported GPUs for NVTrust

| GPU Model | CC Support | Trust Score |
|-----------|------------|-------------|
| H100 | Full NVTrust | 95 |
| H200 | Full NVTrust | 95 |
| B100 | Full NVTrust + TEE-I/O | 100 |
| B200 | Full NVTrust + TEE-I/O | 100 |
| GB200 | Full NVTrust + TEE-I/O | 100 |
| RTX PRO 6000 | NVTrust | 85 |
| RTX 5090 | No CC | Software only (60) |
| RTX 4090 | No CC | Software only (60) |

**Reference Implementation:**
- [`lux/ai/pkg/attestation/nvtrust.go`](https://github.com/luxfi/ai/blob/main/pkg/attestation/nvtrust.go) - NVTrust local verification
- [`lux/ai/pkg/rewards/rewards.go`](https://github.com/luxfi/ai/blob/main/pkg/rewards/rewards.go) - Receipt/spent set handling
- [`shinkai/hanzo-node/hanzo-libs/hanzo-mining/src/ledger.rs`](https://github.com/hanzoai/node/blob/main/hanzo-libs/hanzo-mining/src/ledger.rs)

### Supported TEE Vendors

| Vendor | Technology | Compute Class |
|--------|------------|---------------|
| Intel | SGX, TDX | CPU |
| AMD | SEV-SNP | CPU |
| NVIDIA | Confidential Computing | GPU |
| ARM | CCA | CPU, NPU |
| Apple | Secure Enclave | CPU, NPU |

### Transaction Types

| Type | Description |
|------|-------------|
| `RegisterDevice` | Register new TEE device |
| `VerifyAttestation` | Verify device attestation |
| `SubmitProof` | Submit proof of execution |
| `UpdateRootCA` | Update vendor root CA |
| `ScheduleTask` | Schedule AI compute task |
| `ReportResult` | Report task result |

### Attestation Flow

```solidity
interface IAttestationChain {
    struct ProofOfExecution {
        bytes32 deviceId;
        bytes cpuQuote;
        bytes gpuQuote;
        uint256 nonce;
        bytes32 jobHash;
        bytes32 outputHash;
    }

    struct DeviceStatus {
        bool attested;
        uint8 trustScore;
        uint256 lastSeen;
        address operator;
        TEEVendor vendor;
    }

    function verifyAttestation(ProofOfExecution calldata proof) external returns (bool);
    function getDeviceStatus(bytes32 deviceId) external view returns (DeviceStatus memory);
    function updateRootCA(TEEVendor vendor, bytes calldata newRootCA) external onlyGovernance;
}
```

### Precompiled Contracts

| Address | Function | Gas Cost |
|---------|----------|----------|
| `0xAAA0` | TEE quote verification | 50,000 |
| `0xAAA1` | Merkle proof generation | 10,000 |
| `0xAAA2` | Cross-chain state sync | 30,000 |

### GPU Provider Registry

```go
type GPUProvider struct {
    ProviderID  ids.ID
    Devices     []DeviceID
    Reputation  uint32
    TotalTasks  uint64
    SuccessRate float64
    Pricing     PricingModel
}

type PricingModel struct {
    GPUClass    string    // "A100", "H100", "B200"
    PricePerSec uint64    // In USD cents
    MinDuration uint64
    MaxDuration uint64
}
```go

### Task Scheduling

```go
type AITask struct {
    TaskID      ids.ID
    ModelID     ids.ID
    Input       []byte
    Budget      uint64    // In AI Coin
    Requester   Address
    Priority    uint8
    Deadline    time.Time
    Status      TaskStatus
}

type TaskStatus uint8

const (
    TaskPending TaskStatus = iota
    TaskAssigned
    TaskRunning
    TaskCompleted
    TaskFailed
)
```

### API Endpoints

#### RPC Methods

| Method | Description |
|--------|-------------|
| `ai.registerDevice` | Register TEE device |
| `ai.verifyAttestation` | Verify device attestation |
| `ai.submitTask` | Submit AI task |
| `ai.getTaskStatus` | Get task status |
| `ai.getDeviceStatus` | Get device status |
| `ai.getProviders` | List GPU providers |

#### REST Endpoints

```solidity
POST /ext/bc/A/attestation/verify
GET  /ext/bc/A/devices/{deviceId}
POST /ext/bc/A/tasks/submit
GET  /ext/bc/A/tasks/{taskId}
GET  /ext/bc/A/providers
POST /ext/bc/A/providers/register
```

### Oracle-Based Pricing

```solidity
interface IComputePriceOracle {
    struct GPUPrice {
        string gpuClass;
        uint256 pricePerSec;
        uint256 lastUpdate;
    }

    function getGPUPrice(string calldata gpuClass) external view returns (GPUPrice memory);
    function updatePrices(GPUPrice[] calldata prices) external onlyOracle;
}
```solidity

### Configuration

```json
{
  "aivm": {
    "attestationEnabled": true,
    "supportedVendors": ["intel", "amd", "nvidia", "arm"],
    "minTrustScore": 50,
    "proofExpirySeconds": 3600,
    "maxTasksPerBlock": 100,
    "taskTimeout": "1h",
    "nvtrustEnabled": true
  }
}
```

### Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Attestation Verify | 50ms | Per device |
| Task Schedule | 10ms | Per task |
| Proof Verify | 20ms | Per proof |
| Registry Update | 5ms | Per device |

## Rationale

Design decisions for A-Chain:

1. **Unified Registry**: Single source of truth for all TEE devices
2. **Multi-Vendor**: Support all major TEE technologies
3. **AI-Native**: Built-in support for AI workloads
4. **Omnichain**: Any chain can verify device status

## Backwards Compatibility

LP-5000 supersedes LP-0080. Both old and new numbers resolve to this document.

## Test Cases

See `github.com/luxfi/node/vms/aivm/*_test.go`:

```go
func TestAttestationVerify(t *testing.T)
func TestDeviceRegistry(t *testing.T)
func TestTaskScheduling(t *testing.T)
func TestProofOfExecution(t *testing.T)
func TestNVTrustIntegration(t *testing.T)
```solidity

## Reference Implementation

**Repository**: `github.com/luxfi/node`
**Package**: `vms/aivm`
**Dependencies**:
- `vms/aivm/attestation`
- `vms/aivm/nvtrust`
- `vms/aivm/registry`
- `vms/aivm/scheduler`

## Security Considerations

1. **Root of Trust**: Careful vendor CA management
2. **Attestation Freshness**: Proofs expire after configurable period
3. **Device Revocation**: Mechanism for compromised device handling
4. **Task Isolation**: AI tasks run in isolated TEE environments

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0080 | A-Chain Specification | Superseded by this LP |
| LP-5100 | TEE Attestation | Sub-specification |
| LP-5200 | GPU Provider Registry | Sub-specification |
| LP-5300 | Task Scheduling | Sub-specification |
| LP-5400 | Reward Distribution | Sub-specification |
| LP-5500 | Model Registry | Sub-specification |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
