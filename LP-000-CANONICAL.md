# LP-000: Canonical Definitions - EXACTLY ONE Way

## Overview

This document ensures exactly ONE canonical definition for every standard across Lux, Zoo, and Hanzo blockchains. Any deviation from these definitions is a bug that must be fixed.

## Chain Identifiers - IMMUTABLE

```
Chain ID | Network | Role                    | Token
---------|---------|-------------------------|--------
120      | Lux     | Settlement & Finality   | LX
121      | Hanzo   | Compute (LP-C)          | HANZO
122      | Zoo     | Registry (LP-R)         | KEEPER
```

**CRITICAL**: These chain IDs are hardcoded and MUST NOT change.

## Identity Format - EXACTLY ONE

### Lux ID (DID)
```
Format: did:lux:<chainId>:<address>
Examples:
- did:lux:120:0x1234...  (Lux)
- did:lux:121:0x5678...  (Hanzo)
- did:lux:122:0x9abc...  (Zoo)
```

**NO OTHER IDENTITY FORMAT IS VALID**

## Consensus Parameters - CANONICAL

### Snowman++ (LP-608)
```go
var CanonicalConsensusParams = Parameters{
    K:                20,    // Sample size
    Alpha:            15,    // Quorum size
    BetaVirtuous:     15,    // Virtuous confidence
    BetaRogue:        20,    // Rogue confidence
    Parents:          2,     // Number of parents
    MinBlockDelay:    2,     // Seconds between blocks
}
```

### FPC/Photon (LP-601)
```go
var CanonicalFPCConfig = FPCConfig{
    K1:               100,   // Initial sample
    K2:               200,   // Final sample
    M:                10,    // Rounds
    Threshold:        0.67,  // Decision threshold
    CoolingOffPeriod: 30,    // Seconds
}
```

## Gas Schedule - SINGLE SOURCE OF TRUTH (LP-604)

```go
var CanonicalGasSchedule = GasSchedule{
    // EVM Operations
    EVMBase:         21000,
    EVMSload:        2100,
    EVMSstore:       20000,
    
    // Consensus Operations
    SignatureVerify: 3000,
    VerkleProof:     5000,
    FPCRound:        1000,
    
    // AI Operations
    InferenceBase:   100000,
    InferencePerTok: 10,
    TrainingEpoch:   1000000,
    
    // Cross-chain
    BridgeMessage:   50000,
    StateProof:      10000,
}
```

## Fee Distribution - EXACTLY ONE (LP-604)

```go
var CanonicalDistribution = FeeDistribution{
    BurnPercentage:       50,  // 50% burned (EIP-1559 style)
    ValidatorPercentage:  30,  // 30% to validators
    TreasuryPercentage:   10,  // 10% to treasury
    DevelopmentPercentage: 10,  // 10% to development
}
```

## Staking Parameters - UNIFIED (LP-607)

```go
var CanonicalStakingParams = StakingParams{
    MinStake:         2000 * 1e18,      // 2000 tokens
    MaxStake:         3000000 * 1e18,   // 3M tokens
    MinDelegation:    25 * 1e18,        // 25 tokens
    MinStakeDuration: 14 * 24 * hour,   // 2 weeks
    MaxStakeDuration: 365 * 24 * hour,  // 1 year
    BaseAPR:          8,                 // 8% annual
}
```

## Storage Modes - CANONICAL (LP-605)

```go
var CanonicalStorageModes = map[string]StorageMode{
    "archive": {
        Pruning:  PruningArchive,  // No pruning
        Freezing: true,             // Use ancient store
        FreezeAt: 90000,           // After 90K blocks
    },
    "full": {
        Pruning:  PruningFull,
        Freezing: true,
        FreezeAt: 90000,
    },
    "fast": {
        Pruning:  PruningFast,
        Freezing: false,
        KeepLast: 128,
    },
}
```

## Cross-Chain Message Types (LP-606)

```go
const (
    TypeTransfer    MessageType = 0   // Asset transfer
    TypeCall        MessageType = 1   // Contract call
    TypeState       MessageType = 2   // State sync
    TypeValidator   MessageType = 3   // Validator updates
    TypeJob         MessageType = 10  // AI job submission
    TypeReceipt     MessageType = 11  // Compute receipt
    TypeRoyalty     MessageType = 12  // Royalty payment
)
```

## Verkle Tree Parameters (LP-600)

```go
const (
    VerkleWidth      = 256        // Tree width
    VerkleKeyLength  = 32         // Key size in bytes
    VerkleStemLength = 31         // Stem length
    VerkleProofSize  = 1024       // ~1KB proof size
)
```

## GPU Backend Types (LP-602)

```cpp
enum class Backend {
    CUDA,      // NVIDIA GPUs
    MLX,       // Apple Silicon
    ROCm,      // AMD GPUs
    oneAPI,    // Intel GPUs
    CPU        // Fallback
};
```

## Contract Addresses - SAME ON ALL CHAINS

```solidity
// Deployed via CREATE2 for deterministic addresses
address constant STAKING_CONTRACT    = 0x0000000000000000000000000000000000001000;
address constant FEE_SETTLEMENT      = 0x0000000000000000000000000000000000001001;
address constant WARP_ROUTER         = 0x0000000000000000000000000000000000001002;
address constant CHECKPOINT_ORACLE   = 0x0000000000000000000000000000000000001003;
address constant DEX_ROUTER          = 0x0000000000000000000000000000000000001004;
address constant ADX_ROUTER          = 0x0000000000000000000000000000000000001005;
```

## Bridge Channels - CANONICAL NAMES (LP-401)

```
Channel Name        | Purpose
--------------------|------------------
lp.jobs             | AI job submissions
lp.receipts         | Compute receipts
lp.settlement       | Fee settlement
lp.royalties        | Royalty payments
lp.state            | State sync
lp.validators       | Validator updates
```

## Cryptographic Standards

### Post-Quantum (LP-001, LP-003)
- **KEMs**: ML-KEM-768 (primary), ML-KEM-1024 (high security)
- **Signatures**: SLH-DSA-128f (fast), SLH-DSA-192f (balanced)
- **Hash**: SHA3-256 (standard), SHA3-512 (high security)

### Classical
- **ECDSA**: secp256k1 (Ethereum compatibility)
- **BLS**: BLS12-381 (aggregation)
- **VRF**: ECVRF-SECP256K1-SHA256

## Performance Requirements

### Consensus
- Block Time: 2 seconds average
- Finality: <3 seconds
- Throughput: 5000+ TPS

### State Sync
- Fast Sync: <1 hour
- Checkpoint Interval: 10,000 blocks
- Ancient Store Threshold: 90,000 blocks

### Cross-Chain
- Message Latency: <3 seconds
- Proof Size: ~1KB (Verkle + BLS)
- Throughput: 1000+ msg/sec

### GPU Compute
- Signature Verification: 1M/sec (GPU)
- Order Matching: 1M orders/sec
- AI Inference: 10ms for 1B params

## Validation Rules

1. **Chain ID Validation**
   - MUST be 120, 121, or 122
   - Any other value is INVALID

2. **Address Format**
   - MUST use Lux ID format
   - MUST include chain ID

3. **Gas Calculation**
   - MUST use CanonicalGasSchedule
   - NO chain-specific overrides

4. **Fee Distribution**
   - MUST follow CanonicalDistribution
   - Same percentages on ALL chains

5. **Consensus**
   - MUST use Snowman++ parameters
   - NO chain-specific modifications

## Conflict Resolution

If any conflict is found between standards:

1. This document (LP-000-CANONICAL) is the ultimate authority
2. Chain-specific implementations MUST conform to these definitions
3. Any deviation is a bug requiring immediate fix
4. No "local overrides" or "chain preferences" allowed

## Testing Compliance

```go
func TestCanonicalCompliance(t *testing.T) {
    // Test chain IDs
    assert.Equal(t, 120, LuxChainID)
    assert.Equal(t, 121, HanzoChainID)
    assert.Equal(t, 122, ZooChainID)
    
    // Test gas schedule matches
    luxGas := GetGasSchedule(120)
    hanzoGas := GetGasSchedule(121)
    zooGas := GetGasSchedule(122)
    
    assert.Equal(t, CanonicalGasSchedule, luxGas)
    assert.Equal(t, CanonicalGasSchedule, hanzoGas)
    assert.Equal(t, CanonicalGasSchedule, zooGas)
    
    // Test staking params
    for chainID := range []uint64{120, 121, 122} {
        params := GetStakingParams(chainID)
        assert.Equal(t, CanonicalStakingParams, params)
    }
}
```

## Enforcement

- Automated CI/CD checks for canonical compliance
- Reject any PR violating these definitions
- Regular audits of deployed contracts
- Monitoring for runtime deviations

---

**Status**: FINAL AND IMMUTABLE  
**Category**: Core  
**Created**: 2025-01-09  
**Authority**: ABSOLUTE

**WARNING**: This document defines the single source of truth. Any code not conforming to these definitions is broken and must be fixed.