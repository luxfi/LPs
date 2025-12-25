---
lp: 5610
title: AI Confidential Compute Tier Specification
description: Defines hardware trust tiers for AI compute in the Lux Network's permissionless AI infrastructure
author: Hanzo AI (@hanzoai), Lux Network (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-14
requires: 3020, 5075, 5302
tags: [ai, confidential-compute, tee, gpu]
activation:
  flag: lp-5610-cc-tiers
  hfName: "cc-tiers"
  activationHeight: "0"
order: 610
---

## Abstract

This LP defines a three-tier Confidential Compute (CC) classification system for AI workloads on the Lux Network. The tier system provides clear hardware requirements, trust guarantees, and economic incentives for GPU compute providers running AI inference and training tasks.

**Tier 1 — "GPU-native CC"**: NVIDIA Blackwell, Hopper, RTX 6000-class with NVTrust/confidential GPU
**Tier 2 — "Confidential VM + GPU"**: AMD Instinct + SEV-SNP, Intel + TDX, Arm server + CCA
**Tier 3 — "Device TEE + AI engine"**: Qualcomm Snapdragon + TrustZone/SPU, Apple Silicon + Secure Enclave

## Motivation

The Lux Network operates a **public permissionless AI compute network** spanning enterprise data centers, cloud providers, and edge devices. Different hardware platforms provide varying levels of confidential computing guarantees:

1. **Hardware Diversity**: From NVIDIA data center GPUs to mobile NPUs, each has different CC capabilities
2. **Trust Requirements**: Some AI workloads require end-to-end GPU-level privacy; others tolerate CPU-level isolation
3. **Economic Optimization**: Higher CC tiers command premium fees; lower tiers offer cost efficiency
4. **Regulatory Compliance**: Certain jurisdictions mandate specific hardware attestation levels
5. **Quantum Resilience**: All tiers bind AI work to chain IDs with hardware-backed receipts

This LP establishes clear definitions, hardware requirements, and trust scores for each CC tier, enabling:
- Requesters to specify minimum CC requirements for tasks
- Providers to register their hardware capabilities
- The protocol to match tasks with appropriate providers
- Fair compensation based on actual security guarantees

## Specification

### 1. CC Tier Hierarchy

```solidity
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AI CONFIDENTIAL COMPUTE TIERS                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 1 - GPU-NATIVE CC                                                          │  │
│  │  "Full GPU-level hardware confidential compute"                                   │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ NVIDIA         │  │ NVIDIA         │  │ NVIDIA RTX     │  │ NVIDIA         │  │  │
│  │  │ Blackwell      │  │ Hopper (H100/  │  │ 6000 Ada       │  │ Grace Hopper   │  │  │
│  │  │ (B100/B200/    │  │ H200)          │  │ (Professional) │  │ Superchip      │  │  │
│  │  │ GB200)         │  │                │  │                │  │                │  │  │
│  │  │ NVTrust        │  │ NVTrust        │  │ NVTrust        │  │ NVTrust        │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │  Trust Score: 90-100 | Attestation: Hardware GPU Quote | End-to-End Encryption   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 2 - CONFIDENTIAL VM + GPU                                                   │  │
│  │  "CPU-level VM isolation with GPU passthrough"                                    │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                      │  │
│  │  │ AMD Instinct   │  │ Intel Xeon +   │  │ Arm Neoverse   │                      │  │
│  │  │ MI300X +       │  │ TDX            │  │ V2 + CCA       │                      │  │
│  │  │ SEV-SNP        │  │                │  │ (Arm CCA)      │                      │  │
│  │  │                │  │                │  │                │                      │  │
│  │  │ + Any GPU      │  │ + Any GPU      │  │ + Any GPU      │                      │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                      │  │
│  │  Trust Score: 70-89 | Attestation: CPU + GPU Hybrid | VM-Level Isolation         │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 3 - DEVICE TEE + AI ENGINE                                                  │  │
│  │  "Edge device TEE with integrated AI accelerator"                                 │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ Qualcomm       │  │ Apple Silicon  │  │ Samsung        │  │ MediaTek       │  │  │
│  │  │ Snapdragon     │  │ M1/M2/M3/M4    │  │ Exynos         │  │ Dimensity      │  │  │
│  │  │ (X Elite/8/7)  │  │ Pro/Max/Ultra  │  │ (2400/2200)    │  │ (9300/9200)    │  │  │
│  │  │ TrustZone/SPU  │  │ Secure Enclave │  │ Knox TEE       │  │ TEE            │  │  │
│  │  │ + Hexagon NPU  │  │ + Neural Eng.  │  │ + NPU          │  │ + APU          │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │  Trust Score: 50-69 | Attestation: Device TEE Quote | On-Device Processing       │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TIER 4 - STANDARD (NON-CC)                                                       │  │
│  │  "Software attestation only, no hardware CC"                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Consumer GPUs (RTX 4090/5090), Cloud VMs without CC, Docker containers     │  │  │
│  │  │ Trust Score: 10-49 | Attestation: Software/Stake-Based | No Hardware CC    │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```python

### 2. Tier Definitions

#### 2.1 Tier 1: GPU-Native Confidential Compute

**Definition**: Full end-to-end GPU-level hardware confidential computing with hardware root of trust in the GPU silicon itself.

**Hardware Requirements**:

| Platform | GPU Model | CC Technology | Attestation |
|----------|-----------|---------------|-------------|
| NVIDIA Blackwell | B100, B200, GB200 | NVTrust + HCC | NVIDIA GPU Quote |
| NVIDIA Hopper | H100, H200 | NVTrust + HCC | NVIDIA GPU Quote |
| NVIDIA Ada Pro | RTX 6000 Ada | NVTrust (Professional) | NVIDIA GPU Quote |
| NVIDIA Grace | Grace Hopper | NVTrust + ARM CC | NVIDIA GPU Quote |

**Security Properties**:
- **GPU Memory Encryption**: All GPU memory encrypted with AES-256
- **GPU Firmware Attestation**: Secure boot chain verified to GPU firmware
- **Compute Isolation**: Workloads isolated at GPU hardware level
- **Key Management**: Keys sealed to GPU TPM equivalent
- **Side-Channel Protection**: Hardware-level protection against timing attacks

**Trust Score Range**: 90-100

**Attestation Flow**:
```
GPU Boot → Secure Firmware Load → Generate GPU Quote →
  Submit to Attestation Verifier → Verify Certificate Chain →
    Bind to Chain ID → Register Provider with Tier 1
```solidity

**Use Cases**:
- Model weight protection (LLM inference with private weights)
- Confidential training (federated learning with encrypted gradients)
- Healthcare AI (HIPAA-compliant inference)
- Financial AI (regulatory-compliant risk models)

#### 2.2 Tier 2: Confidential VM + GPU

**Definition**: CPU-level confidential VM with hardware attestation, combined with standard GPU. CPU TEE provides memory encryption; GPU operations run on encrypted data transferred from CPU TEE.

**Hardware Requirements**:

| Platform | CPU + TEE | GPU | Attestation |
|----------|-----------|-----|-------------|
| AMD | EPYC + SEV-SNP | Any (MI300X preferred) | AMD SEV Report |
| Intel | Xeon + TDX | Any | Intel TDX Quote |
| Arm | Neoverse V2 + CCA | Any | Arm CCA Token |

**Security Properties**:
- **VM Memory Encryption**: All VM memory encrypted (SEV-SNP/TDX/CCA)
- **CPU Attestation**: CPU generates hardware attestation report
- **GPU Passthrough**: GPU attached to confidential VM (not encrypted GPU memory)
- **I/O Protection**: Encrypted channels between CPU TEE and GPU
- **Compromised Hypervisor Resistance**: VM protected from hypervisor attacks

**Trust Score Range**: 70-89

**Attestation Flow**:
```
CPU Boot → Load Confidential VM → Generate SEV/TDX/CCA Report →
  Attach GPU → Verify CPU Report → Bind to Chain ID →
    Register Provider with Tier 2
```solidity

**Limitations**:
- GPU memory not encrypted at rest
- Side-channel attacks on GPU possible
- Data in GPU memory visible to physical attacks

**Use Cases**:
- Standard AI inference with CPU-level privacy
- Multi-tenant cloud AI with VM isolation
- Enterprise AI with compliance requirements
- Batch processing with encrypted input/output

#### 2.3 Tier 3: Device TEE + AI Engine

**Definition**: Mobile/edge device TEE with integrated AI accelerator. On-device processing with TEE providing isolation for AI workloads.

**Hardware Requirements**:

| Platform | Device | TEE Technology | AI Engine |
|----------|--------|----------------|-----------|
| Qualcomm | Snapdragon X Elite, 8 Gen 3/2, 7+ Gen 3 | TrustZone + SPU | Hexagon NPU |
| Apple | M1/M2/M3/M4, A17/A16 | Secure Enclave | Neural Engine |
| Samsung | Exynos 2400, 2200 | Knox TEE | NPU |
| MediaTek | Dimensity 9300, 9200 | TEE | APU |

**Security Properties**:
- **TEE Isolation**: AI workloads run in isolated TEE world
- **Secure Boot**: Device boot chain verified
- **Key Storage**: Keys stored in hardware secure element
- **Anti-Rollback**: Protection against firmware downgrade
- **Remote Attestation**: Device can generate attestation token

**Trust Score Range**: 50-69

**Attestation Flow**:
```
Device Boot → Secure Enclave Init → Load AI Model in TEE →
  Generate Attestation Token → Submit to Attestation Verifier →
    Verify Device Certificate → Bind to Chain ID →
      Register Provider with Tier 3
```go

**Limitations**:
- Limited compute power vs data center
- Smaller model size constraints
- Battery/thermal constraints
- Heterogeneous hardware ecosystem

**Use Cases**:
- On-device inference (privacy-preserving mobile AI)
- Edge computing (low-latency local AI)
- IoT AI (sensor fusion, anomaly detection)
- Personal AI assistants (private user data)

#### 2.4 Tier 4: Standard (Non-CC)

**Definition**: Standard compute without hardware confidential computing. Trust based on stake and reputation.

**Hardware**:
- Consumer GPUs (RTX 4090, 5090, AMD RX 7900)
- Cloud VMs without CC features
- Docker containers on standard hosts

**Security Properties**:
- **Software Attestation**: Code measurement only
- **Stake-Based Trust**: Economic security via staked tokens
- **Reputation**: Historical performance and reliability
- **No Hardware CC**: No hardware-level memory encryption

**Trust Score Range**: 10-49

**Use Cases**:
- Non-sensitive inference workloads
- Development and testing
- Cost-optimized batch processing
- Public model inference

### 3. Trust Score Calculation

```go
type TrustScore struct {
    Hardware      uint8  // 0-40 points based on CC tier
    Attestation   uint8  // 0-30 points based on attestation freshness
    Reputation    uint8  // 0-20 points based on historical performance
    Uptime        uint8  // 0-10 points based on availability
}

func CalculateTrustScore(provider *Provider) uint8 {
    var score uint8

    // Hardware base score (40 points max)
    switch provider.CCTier {
    case Tier1_GPUNativeCC:
        score += 35 + (provider.GPUGen * 5 / 10) // 35-40 for latest gen
    case Tier2_ConfidentialVM:
        score += 25 + (provider.TEEVersion * 5 / 10) // 25-30
    case Tier3_DeviceTEE:
        score += 15 + (provider.TEEVersion * 5 / 10) // 15-20
    case Tier4_Standard:
        score += 5 // Base stake-only score
    }

    // Attestation freshness (30 points max)
    attestationAge := time.Since(provider.LastAttestation)
    if attestationAge < 1*time.Hour {
        score += 30
    } else if attestationAge < 24*time.Hour {
        score += 20
    } else if attestationAge < 7*24*time.Hour {
        score += 10
    }

    // Reputation (20 points max)
    score += uint8(provider.Reputation * 20 / 100)

    // Uptime (10 points max)
    score += uint8(provider.Uptime * 10 / 100)

    return min(score, 100)
}
```

### 4. Attestation Protocol

#### 4.1 Tier 1 Attestation (NVIDIA NVTrust)

```go
type NVTrustAttestation struct {
    GPUQuote        []byte   `json:"gpuQuote"`        // NVIDIA GPU attestation quote
    CertChain       [][]byte `json:"certChain"`       // Certificate chain to NVIDIA root
    Nonce           [32]byte `json:"nonce"`           // Challenge nonce
    GPUModel        string   `json:"gpuModel"`        // e.g., "H100-SXM5-80GB"
    FirmwareVersion string   `json:"firmwareVersion"` // GPU firmware version
    CCMode          bool     `json:"ccMode"`          // Confidential compute mode enabled
    Timestamp       int64    `json:"timestamp"`       // Attestation generation time
}

func VerifyTier1Attestation(att *NVTrustAttestation) (bool, error) {
    // 1. Verify certificate chain to NVIDIA root
    if !verifyCertChain(att.CertChain, NVIDIARootCert) {
        return false, ErrInvalidCertChain
    }

    // 2. Verify GPU quote signature
    if !verifyGPUQuote(att.GPUQuote, att.CertChain[0]) {
        return false, ErrInvalidGPUQuote
    }

    // 3. Check CC mode enabled
    if !att.CCMode {
        return false, ErrCCModeDisabled
    }

    // 4. Verify nonce freshness
    if !verifyNonce(att.Nonce) {
        return false, ErrStaleNonce
    }

    // 5. Check firmware version (allowlist)
    if !isAllowedFirmware(att.GPUModel, att.FirmwareVersion) {
        return false, ErrFirmwareNotAllowed
    }

    return true, nil
}
```go

#### 4.2 Tier 2 Attestation (SEV-SNP/TDX/CCA)

```go
type ConfidentialVMAttestation struct {
    // CPU TEE Attestation
    TEEType         string   `json:"teeType"`         // "SEV-SNP", "TDX", "CCA"
    TEEReport       []byte   `json:"teeReport"`       // SEV report / TDX quote / CCA token
    Measurement     [48]byte `json:"measurement"`     // VM measurement (SHA-384)

    // GPU Information (passthrough)
    GPUModel        string   `json:"gpuModel"`        // Attached GPU model
    GPUDriver       string   `json:"gpuDriver"`       // Driver version

    // Metadata
    Nonce           [32]byte `json:"nonce"`
    Timestamp       int64    `json:"timestamp"`
}

func VerifyTier2Attestation(att *ConfidentialVMAttestation) (bool, error) {
    switch att.TEEType {
    case "SEV-SNP":
        return verifySEVSNPReport(att.TEEReport, att.Measurement, att.Nonce)
    case "TDX":
        return verifyTDXQuote(att.TEEReport, att.Measurement, att.Nonce)
    case "CCA":
        return verifyCCAToken(att.TEEReport, att.Measurement, att.Nonce)
    default:
        return false, ErrUnknownTEEType
    }
}
```

#### 4.3 Tier 3 Attestation (Device TEE)

```go
type DeviceTEEAttestation struct {
    // Device Information
    Platform        string   `json:"platform"`        // "Apple", "Qualcomm", "Samsung"
    DeviceModel     string   `json:"deviceModel"`     // e.g., "iPhone 15 Pro"

    // TEE Attestation
    TEEToken        []byte   `json:"teeToken"`        // Platform-specific attestation
    DeviceCert      []byte   `json:"deviceCert"`      // Device certificate

    // AI Engine
    NPUModel        string   `json:"npuModel"`        // e.g., "A17 Neural Engine"
    NPUCapabilities []string `json:"npuCapabilities"` // Supported operations

    // Metadata
    Nonce           [32]byte `json:"nonce"`
    Timestamp       int64    `json:"timestamp"`
}

func VerifyTier3Attestation(att *DeviceTEEAttestation) (bool, error) {
    switch att.Platform {
    case "Apple":
        return verifyAppleDeviceAttestation(att.TEEToken, att.DeviceCert)
    case "Qualcomm":
        return verifyQualcommSPUAttestation(att.TEEToken, att.DeviceCert)
    case "Samsung":
        return verifySamsungKnoxAttestation(att.TEEToken, att.DeviceCert)
    default:
        return false, ErrUnknownPlatform
    }
}
```go

### 5. Task Matching

Tasks can specify minimum CC tier requirements:

```go
type AITask struct {
    ID              string          `json:"id"`
    MinCCTier       CCTier          `json:"minCCTier"`       // Minimum required CC tier
    MinTrustScore   uint8           `json:"minTrustScore"`   // Minimum trust score
    RequiredGPU     string          `json:"requiredGpu"`     // Specific GPU (optional)
    Model           string          `json:"model"`           // AI model to run
    Input           json.RawMessage `json:"input"`           // Encrypted input
    MaxFee          uint64          `json:"maxFee"`          // Maximum fee willing to pay
}

func MatchTaskToProvider(task *AITask, providers []*Provider) *Provider {
    var candidates []*Provider

    for _, p := range providers {
        // Filter by CC tier
        if p.CCTier < task.MinCCTier {
            continue
        }

        // Filter by trust score
        if p.TrustScore < task.MinTrustScore {
            continue
        }

        // Filter by GPU if specified
        if task.RequiredGPU != "" && p.GPUModel != task.RequiredGPU {
            continue
        }

        candidates = append(candidates, p)
    }

    // Select best candidate (highest trust score within budget)
    sort.Slice(candidates, func(i, j int) bool {
        return candidates[i].TrustScore > candidates[j].TrustScore
    })

    for _, c := range candidates {
        if c.FeePerTask <= task.MaxFee {
            return c
        }
    }

    return nil
}
```

### 6. Economic Model

#### 6.1 Fee Multipliers by Tier

| CC Tier | Base Multiplier | Premium Range | Use Case |
|---------|-----------------|---------------|----------|
| Tier 1 (GPU-native CC) | 2.0x | 1.8x - 3.0x | Enterprise, Healthcare, Finance |
| Tier 2 (Confidential VM) | 1.2x | 1.0x - 1.5x | Standard confidential workloads |
| Tier 3 (Device TEE) | 0.8x | 0.5x - 1.0x | Edge, Mobile, IoT |
| Tier 4 (Standard) | 1.0x | 0.3x - 1.2x | Non-sensitive, Development |

#### 6.2 Mining Rewards

```go
func CalculateMiningReward(task *AITask, provider *Provider) uint64 {
    baseReward := task.Fee * 95 / 100 // 95% to provider, 5% protocol fee

    // CC Tier bonus
    var tierMultiplier uint64
    switch provider.CCTier {
    case Tier1_GPUNativeCC:
        tierMultiplier = 150 // 1.5x
    case Tier2_ConfidentialVM:
        tierMultiplier = 100 // 1.0x
    case Tier3_DeviceTEE:
        tierMultiplier = 50  // 0.5x
    case Tier4_Standard:
        tierMultiplier = 25  // 0.25x
    }

    // Trust score bonus (up to 20% extra)
    trustBonus := uint64(provider.TrustScore) * 20 / 100

    return baseReward * tierMultiplier / 100 * (100 + trustBonus) / 100
}
```solidity

### 7. Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICCTierRegistry {
    // CC Tier enum
    enum CCTier {
        Standard,    // Tier 4
        DeviceTEE,   // Tier 3
        ConfidentialVM, // Tier 2
        GPUNativeCC  // Tier 1
    }

    // Provider registration
    struct Provider {
        address operator;
        CCTier tier;
        uint8 trustScore;
        bytes attestation;
        uint256 lastAttestationTime;
        bool active;
    }

    // Events
    event ProviderRegistered(
        address indexed operator,
        CCTier tier,
        uint8 trustScore
    );

    event AttestationUpdated(
        address indexed operator,
        CCTier tier,
        uint8 newTrustScore,
        bytes attestation
    );

    event TierUpgraded(
        address indexed operator,
        CCTier oldTier,
        CCTier newTier
    );

    // Registration
    function registerProvider(
        CCTier tier,
        bytes calldata attestation
    ) external payable returns (uint256 providerId);

    // Attestation update
    function updateAttestation(
        bytes calldata newAttestation
    ) external;

    // Queries
    function getProvider(address operator) external view returns (Provider memory);
    function getTrustScore(address operator) external view returns (uint8);
    function getCCTier(address operator) external view returns (CCTier);
    function getProvidersByTier(CCTier tier) external view returns (address[] memory);

    // Verification
    function verifyAttestation(
        CCTier tier,
        bytes calldata attestation
    ) external view returns (bool valid, uint8 trustScore);
}
```

### 8. Integration with AIVM (LP-2001)

The CC tier system integrates with the existing AIVM specification:

```go
// Updated AIVM Config
type Config struct {
    // ... existing config ...

    // CC Tier settings
    EnableCCTierEnforcement bool   `json:"enableCCTierEnforcement"` // Default: true
    DefaultMinCCTier        CCTier `json:"defaultMinCCTier"`        // Default: Tier4_Standard
    Tier1MinTrustScore      uint8  `json:"tier1MinTrustScore"`      // Default: 90
    Tier2MinTrustScore      uint8  `json:"tier2MinTrustScore"`      // Default: 70
    Tier3MinTrustScore      uint8  `json:"tier3MinTrustScore"`      // Default: 50
}

// Updated Provider struct
type Provider struct {
    // ... existing fields ...

    CCTier        CCTier             `json:"ccTier"`
    CCAttestation *CCAttestation     `json:"ccAttestation,omitempty"`
}

// CC Attestation (unified)
type CCAttestation struct {
    Tier       CCTier `json:"tier"`
    Attestation []byte `json:"attestation"` // Tier-specific attestation data
    TrustScore uint8  `json:"trustScore"`
    Timestamp  int64  `json:"timestamp"`
}
```go

## Rationale

### Why Three CC Tiers?

The three-tier system reflects the natural hardware landscape:

1. **Tier 1 (GPU-native)**: Only NVIDIA currently offers GPU-level CC. This tier provides maximum security for the most sensitive workloads.

2. **Tier 2 (Confidential VM)**: AMD, Intel, and Arm all offer CPU-level CC. Combined with GPU passthrough, this provides strong isolation without requiring specialized GPU hardware.

3. **Tier 3 (Device TEE)**: Mobile and edge devices have integrated TEEs with AI accelerators. This tier enables the vast ecosystem of edge AI devices.

### Why Not Include DGX Spark (GB10)?

NVIDIA DGX Spark (GB10) uses the Grace SoC without NVTrust support for the AI components. It's classified as Tier 4 (Standard) because:
- No hardware CC for GPU memory
- Software attestation only
- Suitable for non-sensitive workloads

### Trust Score Design

The trust score calculation balances:
- **Hardware (40%)**: Incentivizes CC hardware adoption
- **Attestation (30%)**: Rewards fresh attestations
- **Reputation (20%)**: Values historical reliability
- **Uptime (10%)**: Ensures availability

This weighting ensures that hardware CC tier is the primary differentiator while still rewarding good behavior.

## Backwards Compatibility

This LP extends LP-2001 (AIVM) with CC tier awareness:

- Existing providers default to Tier 4 (Standard)
- Tasks without `minCCTier` field are matched to any tier
- Trust scores are backwards compatible with existing `TrustScore` field
- No breaking changes to existing AIVM API

## Test Cases

### Unit Tests

```go
func TestCCTierClassification(t *testing.T) {
    tests := []struct {
        name     string
        hardware string
        expected CCTier
    }{
        {"NVIDIA H100", "H100-SXM5-80GB", Tier1_GPUNativeCC},
        {"NVIDIA B200", "B200-SXM", Tier1_GPUNativeCC},
        {"AMD SEV-SNP + MI300X", "EPYC-SEV-SNP+MI300X", Tier2_ConfidentialVM},
        {"Intel TDX + A100", "Xeon-TDX+A100", Tier2_ConfidentialVM},
        {"Apple M3 Max", "M3-Max", Tier3_DeviceTEE},
        {"Qualcomm 8 Gen 3", "Snapdragon-8G3", Tier3_DeviceTEE},
        {"RTX 4090", "RTX-4090", Tier4_Standard},
        {"Cloud VM", "Generic-Cloud-VM", Tier4_Standard},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            tier := ClassifyHardware(tt.hardware)
            require.Equal(t, tt.expected, tier)
        })
    }
}

func TestTrustScoreCalculation(t *testing.T) {
    provider := &Provider{
        CCTier:          Tier1_GPUNativeCC,
        LastAttestation: time.Now(),
        Reputation:      95,
        Uptime:          99,
    }

    score := CalculateTrustScore(provider)
    require.GreaterOrEqual(t, score, uint8(90))
    require.LessOrEqual(t, score, uint8(100))
}
```

### Integration Tests

```go
func TestTaskMatchingByCCTier(t *testing.T) {
    // Create providers of each tier
    tier1 := createProvider(Tier1_GPUNativeCC, 95)
    tier2 := createProvider(Tier2_ConfidentialVM, 80)
    tier3 := createProvider(Tier3_DeviceTEE, 60)
    tier4 := createProvider(Tier4_Standard, 30)

    providers := []*Provider{tier1, tier2, tier3, tier4}

    // Task requiring Tier 1
    task1 := &AITask{MinCCTier: Tier1_GPUNativeCC}
    matched := MatchTaskToProvider(task1, providers)
    require.Equal(t, tier1, matched)

    // Task requiring Tier 2
    task2 := &AITask{MinCCTier: Tier2_ConfidentialVM}
    matched = MatchTaskToProvider(task2, providers)
    require.True(t, matched == tier1 || matched == tier2)
}
```solidity

## Reference Implementation

### Core Implementation

| Component | Location |
|-----------|----------|
| CC Tier Types | [`ai/pkg/cc/types.go`](https://github.com/luxfi/ai/blob/main/pkg/cc/types.go) |
| Trust Score | [`ai/pkg/cc/trust_score.go`](https://github.com/luxfi/ai/blob/main/pkg/cc/trust_score.go) |
| Attestation Verifier | [`ai/pkg/attestation/cc_verifier.go`](https://github.com/luxfi/ai/blob/main/pkg/attestation/cc_verifier.go) |
| AIVM Integration | [`node/vms/aivm/cc_tier.go`](https://github.com/luxfi/node/blob/main/vms/aivm/cc_tier.go) |

### Hanzo Node Integration

| Component | Location |
|-----------|----------|
| CC Registry | [`hanzo-node/pkg/cc/registry.go`](https://github.com/hanzoai/hanzo-node/blob/main/pkg/cc/registry.go) |
| Provider Manager | [`hanzo-node/pkg/provider/cc_provider.go`](https://github.com/hanzoai/hanzo-node/blob/main/pkg/provider/cc_provider.go) |

## Security Considerations

### Attestation Freshness

- Attestations must be refreshed regularly (recommended: every 1 hour for Tier 1, 24 hours for Tier 2/3)
- Stale attestations result in trust score degradation
- Providers with expired attestations are demoted to Tier 4

### Fake Attestation Prevention

- All attestation quotes verified against manufacturer root certificates
- Certificate chains validated to hardware manufacturer roots (NVIDIA, AMD, Intel, Arm, Apple, Qualcomm)
- Replay prevention via challenge-response nonces

### Side-Channel Attacks

- Tier 1 provides strongest protection (hardware-level)
- Tier 2 protects CPU operations but GPU may be vulnerable
- Tier 3 varies by device (Apple Secure Enclave is strong, others vary)
- Tier 4 provides no hardware protection

### Physical Attacks

- Tier 1 and 2 protect against software attacks on host
- Tier 3 provides tamper-evident storage
- Physical access to hardware may compromise all tiers
- Critical workloads should use multiple independent providers

## Economic Impact

### Provider Incentives

Higher CC tiers command premium fees:
- Tier 1 providers earn 1.5x base rewards
- Investment in CC-capable hardware justified by increased earnings
- Network effect: more Tier 1 providers attract more premium workloads

### Network Security

- Default tasks matched to appropriate tier based on sensitivity
- Premium fees fund CC hardware investment
- Slashing for attestation fraud deters cheating

## Related Proposals

- **LP-2001**: AIVM - AI Virtual Machine
- **LP-5075**: TEE Integration Standard
- **LP-5302**: Z/A-Chain Privacy & AI Attestation
- **LP-5601**: Dynamic Gas Fee with AI Compute Pricing
- **LP-5607**: GPU Acceleration Framework

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
