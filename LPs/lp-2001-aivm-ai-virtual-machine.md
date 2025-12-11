---
lp: 2001
title: AIVM - AI Virtual Machine
description: Native VM for AI compute tasks with TEE attestation and local nvtrust verification
author: Hanzo AI (@hanzoai), Lux Network (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2024-12-11
requires: 2000
activation:
  flag: lp-2001-aivm
  hfName: "aivm"
  activationHeight: "0"
---

## Abstract

This LP defines the **AI Virtual Machine (AIVM)**, a native VM for the Lux network that handles AI compute tasks, provider attestation, and reward distribution. AIVM integrates with the `luxfi/ai` package to provide local GPU attestation via nvtrust (no cloud dependency), TEE attestation support (SGX, SEV-SNP, TDX, NVIDIA Confidential Computing), and merkle anchoring to Q-Chain for mining rewards.

## Activation

| Parameter          | Value                           |
|--------------------|--------------------------------|
| Flag string        | `lp2001-aivm`                  |
| Default in code    | **false** until block TBD      |
| Deployment branch  | `v1.10.0-aivm`                 |
| Roll‑out criteria  | Testnet validation complete    |
| Back‑off plan      | Disable via flag               |

## Motivation

The Lux network requires native support for decentralized AI compute with:

1. **Hardware Attestation**: Verify compute providers run on genuine TEE hardware
2. **Local Verification**: No dependency on cloud attestation services (NRAS)
3. **Task Management**: Native protocol for AI task submission and assignment
4. **Reward Distribution**: Transparent mining rewards with merkle anchoring
5. **Provider Registry**: Decentralized registry of verified AI compute providers

This LP establishes AIVM as a first-class VM in the Lux ecosystem, enabling trustless AI compute at the protocol level.

## Specification

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AIVM (AI Virtual Machine)               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Provider        │  │ Task            │  │ Reward         │  │
│  │ Registry        │──│ Manager         │──│ Distributor    │  │
│  │ (TEE Attested)  │  │ (Assignment)    │  │ (Merkle)       │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│           │                    │                    │           │
│  ┌────────┴────────────────────┴────────────────────┴────────┐ │
│  │                    Attestation Verifier                    │ │
│  │     ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │ │
│  │     │ nvtrust  │  │ SGX      │  │ SEV-SNP  │  │ TDX    │  │ │
│  │     │ (GPU CC) │  │ (Intel)  │  │ (AMD)    │  │(Intel) │  │ │
│  │     └──────────┘  └──────────┘  └──────────┘  └────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │   Q-Chain Anchor  │                        │
│                    │   (Merkle Root)   │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2. VM Registration

AIVM is registered in the Lux node as a native VM:

```go
// VM ID constant
AIVMID = ids.ID{'a', 'i', 'v', 'm'}
AIVMName = "aivm"

// Factory registration
n.VMManager.RegisterFactory(ctx, constants.AIVMID, &aivm.Factory{})
```

**Reference Implementation:**
- [`node/vms/aivm/factory.go`](https://github.com/luxfi/node/blob/main/vms/aivm/factory.go)
- [`node/utils/constants/vm_ids.go`](https://github.com/luxfi/node/blob/main/utils/constants/vm_ids.go)

### 3. Configuration

AIVM accepts the following configuration parameters:

```go
type Config struct {
    // Network settings
    MaxProvidersPerNode int  `json:"maxProvidersPerNode"`  // Default: 100
    MaxTasksPerProvider int  `json:"maxTasksPerProvider"`  // Default: 10

    // Attestation settings
    RequireTEEAttestation bool   `json:"requireTEEAttestation"` // Default: true
    MinTrustScore         uint8  `json:"minTrustScore"`         // Default: 50
    AttestationTimeout    string `json:"attestationTimeout"`    // Default: "30s"

    // Task settings
    MaxTaskQueueSize int    `json:"maxTaskQueueSize"` // Default: 1000
    TaskTimeout      string `json:"taskTimeout"`      // Default: "5m"

    // Reward settings
    BaseReward       uint64 `json:"baseReward"`       // Default: 1 LUX (wei)
    EpochDuration    string `json:"epochDuration"`    // Default: "1h"
    MerkleAnchorFreq int    `json:"merkleAnchorFreq"` // Default: 100 blocks
}
```

### 4. GPU Attestation (nvtrust)

Local GPU attestation uses nvtrust with no cloud dependency:

```go
type GPUAttestation struct {
    Nonce           []byte   `json:"nonce"`
    EvidenceList    [][]byte `json:"evidenceList"`
    CertChain       [][]byte `json:"certChain"`
    AttestationType string   `json:"attestationType"`
}

type DeviceStatus struct {
    DeviceID   string `json:"deviceId"`
    Attested   bool   `json:"attested"`
    TrustScore uint8  `json:"trustScore"`  // 0-100
    Mode       string `json:"mode"`        // "CC" or "Standard"
    HardwareCC bool   `json:"hardwareCC"`  // True for CC-capable GPUs
}
```

**Supported GPU Types:**

| GPU Model | CC Capable | Trust Score | Notes |
|-----------|------------|-------------|-------|
| H100      | Yes        | 90-100      | Full hardware CC |
| H200      | Yes        | 90-100      | Full hardware CC |
| B100      | Yes        | 90-100      | Full hardware CC |
| B200      | Yes        | 90-100      | Full hardware CC |
| GB200     | Yes        | 90-100      | Full hardware CC |
| RTX PRO 6000 | Yes     | 85-95       | Professional CC |
| DGX Spark (GB10) | No  | 60-75       | Software attestation |
| RTX 5090  | No         | 50-70       | Software attestation |
| RTX 4090  | No         | 50-70       | Software attestation |

**Reference Implementation:**
- [`ai/pkg/attestation/verifier.go`](https://github.com/luxfi/ai/blob/main/pkg/attestation/verifier.go)

### 5. Provider Registration

Providers register with attestation proof:

```go
type Provider struct {
    ID             string          `json:"id"`
    WalletAddress  string          `json:"walletAddress"`
    Endpoint       string          `json:"endpoint"`
    GPUs           []GPUInfo       `json:"gpus"`
    GPUAttestation *GPUAttestation `json:"gpuAttestation,omitempty"`
    TrustScore     uint8           `json:"trustScore"`
    Status         ProviderStatus  `json:"status"`
}

// Registration requires minimum trust score
if provider.GPUAttestation != nil {
    status, err := vm.verifier.VerifyGPUAttestation(provider.GPUAttestation)
    if status.TrustScore < vm.config.MinTrustScore {
        return fmt.Errorf("trust score %d below minimum %d",
            status.TrustScore, vm.config.MinTrustScore)
    }
}
```

### 6. Task Management

AI tasks are submitted and assigned to providers:

```go
type Task struct {
    ID         string          `json:"id"`
    Type       TaskType        `json:"type"`
    Model      string          `json:"model"`
    Input      json.RawMessage `json:"input"`
    Fee        uint64          `json:"fee"`
    Status     TaskStatus      `json:"status"`
    ProviderID string          `json:"providerId,omitempty"`
    CreatedAt  time.Time       `json:"createdAt"`
}

type TaskResult struct {
    TaskID      string          `json:"taskId"`
    ProviderID  string          `json:"providerId"`
    Output      json.RawMessage `json:"output"`
    ComputeTime uint64          `json:"computeTimeMs"`
    Proof       []byte          `json:"proof"`
    Error       string          `json:"error,omitempty"`
}
```

### 7. RPC API

AIVM exposes the following HTTP endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rpc/providers` | GET | List registered providers |
| `/rpc/providers/register` | POST | Register new provider |
| `/rpc/tasks` | GET | Get task by ID or stats |
| `/rpc/tasks/submit` | POST | Submit new task |
| `/rpc/tasks/result` | POST | Submit task result |
| `/rpc/models` | GET | List available models |
| `/rpc/attestation/verify` | POST | Verify GPU attestation |
| `/rpc/rewards/claim` | POST | Claim pending rewards |
| `/rpc/rewards/stats` | GET | Get reward statistics |
| `/rpc/stats` | GET | Get VM statistics |
| `/rpc/merkle` | GET | Get merkle root for Q-Chain |
| `/rpc/health` | GET | Health check |

**Reference Implementation:**
- [`node/vms/aivm/service.go`](https://github.com/luxfi/node/blob/main/vms/aivm/service.go)

### 8. Block Structure

AIVM blocks contain AI-specific data:

```go
type Block struct {
    ID        ids.ID    `json:"id"`
    ParentID  ids.ID    `json:"parentID"`
    Height    uint64    `json:"height"`
    Timestamp time.Time `json:"timestamp"`

    // AI-specific data
    Tasks        []Task        `json:"tasks,omitempty"`
    Results      []TaskResult  `json:"results,omitempty"`
    MerkleRoot   [32]byte      `json:"merkleRoot"`
    ProviderRegs []ProviderReg `json:"providerRegs,omitempty"`
}
```

### 9. Merkle Anchoring

Periodic merkle roots are anchored to Q-Chain:

```go
// Every MerkleAnchorFreq blocks (default: 100)
merkleRoot := vm.GetMerkleRoot()
// Anchor to Q-Chain for permanent record
```

## Rationale

### Why Local nvtrust?

NVIDIA's Remote Attestation Service (NRAS) creates cloud dependency and single point of failure. Local nvtrust verification:
- Eliminates network latency
- Removes cloud service dependency
- Enables offline operation
- Maintains security guarantees

### Why Trust Scores?

Not all attestation modes provide equal security. Trust scores enable:
- Graduated security levels
- Support for non-CC hardware
- Clear risk communication
- Flexible network policies

### Why Native VM?

A native VM (vs smart contract) provides:
- Direct consensus integration
- Lower overhead for high-frequency operations
- Protocol-level security guarantees
- Native merkle anchoring

## Backwards Compatibility

AIVM is a new VM and does not affect existing functionality:
- Existing chains continue unchanged
- New AI-Chain can be created with AIVM
- No modifications to consensus protocol

## Test Cases

```bash
# Build AIVM
cd /Users/z/work/lux/node
go build ./vms/aivm/...

# Run tests
go test -v ./vms/aivm/...
```

## Reference Implementation

| Component | Location |
|-----------|----------|
| VM Implementation | [`node/vms/aivm/vm.go`](https://github.com/luxfi/node/blob/main/vms/aivm/vm.go) |
| Factory | [`node/vms/aivm/factory.go`](https://github.com/luxfi/node/blob/main/vms/aivm/factory.go) |
| RPC Service | [`node/vms/aivm/service.go`](https://github.com/luxfi/node/blob/main/vms/aivm/service.go) |
| Core AI Package | [`ai/pkg/aivm`](https://github.com/luxfi/ai/tree/main/pkg/aivm) |
| Attestation | [`ai/pkg/attestation`](https://github.com/luxfi/ai/tree/main/pkg/attestation) |

**Release Tag:** `v1.10.0-aivm`

## Security Considerations

### TEE Attestation
- All CC-capable GPUs require valid hardware attestation
- Non-CC GPUs use software attestation with lower trust scores
- Attestation quotes verified against known certificate chains

### Trust Score Manipulation
- Trust scores computed locally from attestation evidence
- Minimum score threshold enforced at registration
- Providers with expired attestation lose trusted status

### Task Privacy
- Task inputs may contain sensitive data
- Providers with CC hardware can process in confidential mode
- Non-CC providers should not receive sensitive tasks

### Reward Gaming
- Merkle anchoring prevents reward manipulation
- Q-Chain provides permanent audit trail
- Invalid results rejected by consensus

## Economic Impact

### Provider Incentives
- Higher trust scores earn priority task assignment
- CC-capable hardware commands premium fees
- Base rewards distributed proportionally to compute

### Task Fees
- Submitters pay fees based on compute requirements
- Fees distributed to providers after verification
- Network takes minimal protocol fee

## Related Proposals

- **LP-2000**: AI Mining Standard
- **LP-0004**: Quantum Resistant Cryptography Integration
- **LP-0607**: GPU Acceleration Framework

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
