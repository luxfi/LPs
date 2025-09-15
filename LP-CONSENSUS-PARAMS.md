# LP-CONSENSUS-PARAMS: Complete Consensus Parameters Documentation

## Executive Summary

This document provides the complete, canonical consensus parameters for all Lux Network deployments. These parameters are **IMMUTABLE** and apply uniformly across Mainnet, Testnet, and Local development environments. Any deviation from these parameters is considered a critical bug.

## Network Configurations

### Network Identifiers

| Network | Chain ID | Network ID | P2P Port | RPC Port | WS Port | Metrics Port |
|---------|----------|------------|----------|----------|---------|--------------|
| **Mainnet** | 120 | 1 | 9651 | 9650 | 9650/ws | 9956 |
| **Testnet** | 120 | 5 | 9651 | 9650 | 9650/ws | 9956 |
| **Local** | 120 | 12345 | 9651-9655 | 9650-9654 | 9650-9654/ws | 9956-9960 |

### Validator Sets

| Network | Validator Count | Min Stake | Max Stake | Delegation Min | Epoch Duration |
|---------|----------------|-----------|-----------|----------------|----------------|
| **Mainnet** | 21 | 2,000 LUX | 3,000,000 LUX | 25 LUX | 6 hours |
| **Testnet** | 11 | 1 LUX | 3,000,000 LUX | 1 LUX | 1 hour |
| **Local** | 5 | 1 LUX | 3,000,000 LUX | 1 LUX | 30 seconds |

## Quasar Consensus Parameters (Primary - LP-700)

### Core Parameters

```go
type QuasarParams struct {
    // Committee Selection (Photon Phase)
    K                    uint32  // 20 - Sample size for committee
    CommitteeSize        uint32  // 21 (mainnet), 11 (testnet), 5 (local)
    SelectionThreshold   float64 // 0.67 - 2/3 + 1 for Byzantine tolerance
    
    // Voting (Wave Phase)
    VotingRounds         uint32  // 2 - Number of voting rounds
    Round1Timeout        time.Duration // 150ms - BLS aggregation
    Round2Timeout        time.Duration // 350ms - Lattice signatures
    TotalTimeout         time.Duration // 500ms - Total consensus time
    
    // Confidence (Focus Phase)
    Beta                 uint32  // 4 - Consecutive rounds for confidence
    ConfidenceThreshold  float64 // 0.75 - Required confidence level
    
    // DAG Management (Prism Phase)
    DAGWidth            uint32  // 256 - Maximum DAG width
    DAGDepth            uint32  // 1000 - Maximum DAG depth
    PruneThreshold      uint32  // 10000 - Blocks before pruning
    
    // Finality (Horizon Phase)
    FinalityDepth       uint32  // 1 - Blocks for finality
    QuantumSecurity     uint32  // 256 - Bit security level
    CheckpointInterval  uint32  // 10000 - Blocks between checkpoints
}

// Network-Specific Configurations
var MainnetQuasar = QuasarParams{
    K:                   20,
    CommitteeSize:       21,
    SelectionThreshold:  0.67,
    VotingRounds:        2,
    Round1Timeout:       150 * time.Millisecond,
    Round2Timeout:       350 * time.Millisecond,
    TotalTimeout:        500 * time.Millisecond,
    Beta:                4,
    ConfidenceThreshold: 0.75,
    DAGWidth:            256,
    DAGDepth:            1000,
    PruneThreshold:      10000,
    FinalityDepth:       1,
    QuantumSecurity:     256,
    CheckpointInterval:  10000,
}

var TestnetQuasar = QuasarParams{
    K:                   15,
    CommitteeSize:       11,
    SelectionThreshold:  0.67,
    VotingRounds:        2,
    Round1Timeout:       100 * time.Millisecond,
    Round2Timeout:       200 * time.Millisecond,
    TotalTimeout:        300 * time.Millisecond,
    Beta:                3,
    ConfidenceThreshold: 0.70,
    DAGWidth:            128,
    DAGDepth:            500,
    PruneThreshold:      5000,
    FinalityDepth:       1,
    QuantumSecurity:     128,
    CheckpointInterval:  5000,
}

var LocalQuasar = QuasarParams{
    K:                   5,
    CommitteeSize:       5,
    SelectionThreshold:  0.60,
    VotingRounds:        2,
    Round1Timeout:       50 * time.Millisecond,
    Round2Timeout:       100 * time.Millisecond,
    TotalTimeout:        150 * time.Millisecond,
    Beta:                2,
    ConfidenceThreshold: 0.60,
    DAGWidth:            64,
    DAGDepth:            100,
    PruneThreshold:      1000,
    FinalityDepth:       1,
    QuantumSecurity:     128,
    CheckpointInterval:  1000,
}
```

### Luminance Tracking

```go
type LuminanceParams struct {
    MinLuminance        uint32  // 10 lux - Minimum performance score
    MaxLuminance        uint32  // 1000 lux - Maximum performance score
    DecayRate           float64 // 0.95 - Performance decay per epoch
    UpdateInterval      time.Duration // 1 minute - Luminance update frequency
    
    // Scoring Weights
    BlockProposalWeight float64 // 0.30 - Weight for block proposals
    VoteWeight          float64 // 0.25 - Weight for voting participation
    UptimeWeight        float64 // 0.25 - Weight for uptime
    LatencyWeight       float64 // 0.20 - Weight for network latency
}
```

## Snowman++ Parameters (Fallback - LP-600)

### Core Snowball/Snowman Parameters

```go
type SnowmanPlusParams struct {
    // Snowball Parameters
    K                    uint32  // 20 - Sample size
    Alpha                uint32  // 15 - Quorum size
    BetaVirtuous         uint32  // 15 - Virtuous confidence threshold
    BetaRogue            uint32  // 20 - Rogue confidence threshold
    
    // Snowman Parameters
    Parents              uint32  // 2 - Number of parent blocks
    BatchSize            uint32  // 30 - Batch size for voting
    ConcurrentRepolls    uint32  // 4 - Parallel queries allowed
    OptimalProcessing    uint32  // 10 - Target processing blocks
    
    // Snowman++ Enhancements
    ProposerWindow       time.Duration // 5s - Time window for proposer
    MinBlockDelay        time.Duration // 2s - Minimum time between blocks
    MaxBlockDelay        time.Duration // 10s - Maximum time between blocks
    
    // VRF Parameters
    VRFProofSize         uint32  // 80 bytes - Size of VRF proof
    VRFOutputSize        uint32  // 32 bytes - Size of VRF output
}

var CanonicalSnowmanPlus = SnowmanPlusParams{
    K:                   20,
    Alpha:               15,
    BetaVirtuous:        15,
    BetaRogue:           20,
    Parents:             2,
    BatchSize:           30,
    ConcurrentRepolls:   4,
    OptimalProcessing:   10,
    ProposerWindow:      5 * time.Second,
    MinBlockDelay:       2 * time.Second,
    MaxBlockDelay:       10 * time.Second,
    VRFProofSize:        80,
    VRFOutputSize:       32,
}
```

## Network Performance Targets

### Consensus Performance

| Metric | Mainnet Target | Testnet Target | Local Target | Achieved |
|--------|---------------|----------------|--------------|----------|
| **Block Time** | 2s | 2s | 1s | ✅ 1.8s |
| **Finality Time** | <1s | <1s | <500ms | ✅ 500-800ms |
| **Transaction Throughput** | 10,000 TPS | 10,000 TPS | 5,000 TPS | ✅ 15,000 TPS |
| **Committee Size** | 21 | 11 | 5 | ✅ Dynamic |
| **Message Complexity** | O(n) | O(n) | O(n) | ✅ O(n) |
| **Network Bandwidth** | 100 Mbps | 50 Mbps | 10 Mbps | ✅ Optimized |

### State Management

| Parameter | Mainnet | Testnet | Local |
|-----------|---------|---------|-------|
| **State Sync Time** | <1 hour | <30 min | <5 min |
| **Checkpoint Interval** | 10,000 blocks | 5,000 blocks | 1,000 blocks |
| **Ancient Store Threshold** | 90,000 blocks | 30,000 blocks | 10,000 blocks |
| **Pruning Mode** | Full | Fast | Archive |
| **State Cache Size** | 4 GB | 2 GB | 512 MB |

## Gas and Fee Parameters

### Gas Schedule

```go
type GasSchedule struct {
    // Base Operations
    TxBase              uint64  // 21000 - Base transaction cost
    TxDataZero          uint64  // 4 - Per zero byte in data
    TxDataNonZero       uint64  // 16 - Per non-zero byte in data
    
    // Storage Operations
    SLoad               uint64  // 2100 - Storage load
    SStore              uint64  // 20000 - Storage store
    SStoreRefund        uint64  // 15000 - Storage refund
    
    // Compute Operations
    Call                uint64  // 700 - Call operation
    Create              uint64  // 32000 - Contract creation
    Create2             uint64  // 32000 - CREATE2 operation
    
    // Consensus Operations
    SignatureVerify     uint64  // 3000 - Signature verification
    VerkleProof         uint64  // 5000 - Verkle proof verification
    QuantumProof        uint64  // 10000 - Quantum proof verification
    
    // Cross-Chain Operations
    BridgeMessage       uint64  // 50000 - Cross-chain message
    StateProof          uint64  // 10000 - State proof verification
}

var MainnetGasSchedule = GasSchedule{
    TxBase:          21000,
    TxDataZero:      4,
    TxDataNonZero:   16,
    SLoad:           2100,
    SStore:          20000,
    SStoreRefund:    15000,
    Call:            700,
    Create:          32000,
    Create2:         32000,
    SignatureVerify: 3000,
    VerkleProof:     5000,
    QuantumProof:    10000,
    BridgeMessage:   50000,
    StateProof:      10000,
}
```

### Fee Distribution

```go
type FeeDistribution struct {
    BurnPercentage       uint8  // 50% - Burned (deflationary)
    ValidatorPercentage  uint8  // 30% - To block proposer
    TreasuryPercentage   uint8  // 10% - To treasury
    DevelopmentPercentage uint8  // 10% - To development fund
}

var CanonicalFeeDistribution = FeeDistribution{
    BurnPercentage:       50,
    ValidatorPercentage:  30,
    TreasuryPercentage:   10,
    DevelopmentPercentage: 10,
}
```

## Cryptographic Parameters

### Post-Quantum Security

```go
type QuantumParams struct {
    // ML-KEM (Kyber)
    KEMSecurityLevel    uint32  // 3 - Level 3 (AES-192 equivalent)
    KEMPublicKeySize    uint32  // 1184 bytes
    KEMPrivateKeySize   uint32  // 2400 bytes
    KEMCiphertextSize   uint32  // 1088 bytes
    
    // ML-DSA (Dilithium)
    DSASecurityLevel    uint32  // 3 - Level 3 (AES-192 equivalent)
    DSAPublicKeySize    uint32  // 1952 bytes
    DSAPrivateKeySize   uint32  // 4016 bytes
    DSASignatureSize    uint32  // 3293 bytes
    
    // SLH-DSA (SPHINCS+)
    SLHSecurityLevel    uint32  // 3 - Level 3
    SLHPublicKeySize    uint32  // 48 bytes
    SLHPrivateKeySize   uint32  // 96 bytes
    SLHSignatureSize    uint32  // 35664 bytes
}

var MainnetQuantum = QuantumParams{
    KEMSecurityLevel:   3,
    KEMPublicKeySize:   1184,
    KEMPrivateKeySize:  2400,
    KEMCiphertextSize:  1088,
    DSASecurityLevel:   3,
    DSAPublicKeySize:   1952,
    DSAPrivateKeySize:  4016,
    DSASignatureSize:   3293,
    SLHSecurityLevel:   3,
    SLHPublicKeySize:   48,
    SLHPrivateKeySize:  96,
    SLHSignatureSize:   35664,
}
```

### Classical Cryptography

```go
type ClassicalCrypto struct {
    // ECDSA
    ECDSACurve          string  // "secp256k1" - Ethereum compatibility
    ECDSAKeySize        uint32  // 32 bytes
    ECDSASignatureSize  uint32  // 65 bytes
    
    // BLS
    BLSCurve            string  // "BLS12-381"
    BLSPublicKeySize    uint32  // 48 bytes
    BLSSignatureSize    uint32  // 96 bytes
    BLSAggregateSize    uint32  // 96 bytes (constant)
    
    // VRF
    VRFAlgorithm        string  // "ECVRF-SECP256K1-SHA256"
    VRFProofSize        uint32  // 80 bytes
    VRFOutputSize       uint32  // 32 bytes
}
```

## Networking Parameters

### P2P Configuration

```go
type P2PParams struct {
    // Connection Limits
    MaxInboundPeers     uint32  // 256 - Maximum inbound connections
    MaxOutboundPeers    uint32  // 48 - Maximum outbound connections
    MaxPendingPeers     uint32  // 64 - Maximum pending connections
    
    // Timeouts
    HandshakeTimeout    time.Duration // 15s - Handshake timeout
    DialTimeout         time.Duration // 10s - Connection dial timeout
    ReadTimeout         time.Duration // 30s - Read timeout
    WriteTimeout        time.Duration // 30s - Write timeout
    
    // Message Limits
    MaxMessageSize      uint32  // 10 MB - Maximum message size
    MaxBlockSize        uint32  // 2 MB - Maximum block size
    MaxTxPoolSize       uint32  // 5000 - Maximum transaction pool size
    
    // Gossip Parameters
    GossipMaxSize       uint32  // 1 MB - Maximum gossip message
    GossipFrequency     time.Duration // 100ms - Gossip frequency
    GossipAcceptedAge   time.Duration // 1 minute - Accepted message age
}

var MainnetP2P = P2PParams{
    MaxInboundPeers:   256,
    MaxOutboundPeers:  48,
    MaxPendingPeers:   64,
    HandshakeTimeout:  15 * time.Second,
    DialTimeout:       10 * time.Second,
    ReadTimeout:       30 * time.Second,
    WriteTimeout:      30 * time.Second,
    MaxMessageSize:    10 * 1024 * 1024,
    MaxBlockSize:      2 * 1024 * 1024,
    MaxTxPoolSize:     5000,
    GossipMaxSize:     1024 * 1024,
    GossipFrequency:   100 * time.Millisecond,
    GossipAcceptedAge: 1 * time.Minute,
}
```

## Staking Parameters

### Validator Requirements

```go
type StakingParams struct {
    // Stake Amounts (in wei)
    MinValidatorStake   *big.Int // 2,000 LUX
    MaxValidatorStake   *big.Int // 3,000,000 LUX
    MinDelegatorStake   *big.Int // 25 LUX
    MaxDelegatorStake   *big.Int // 3,000,000 LUX
    
    // Time Constraints
    MinStakeDuration    time.Duration // 14 days
    MaxStakeDuration    time.Duration // 365 days
    CooldownPeriod      time.Duration // 7 days
    
    // Rewards
    BaseAPR             float64 // 8% - Base annual percentage rate
    MaxAPR              float64 // 15% - Maximum APR with delegation
    DelegationFeeMin    float64 // 2% - Minimum delegation fee
    DelegationFeeMax    float64 // 100% - Maximum delegation fee
    
    // Limits
    MaxValidators       uint32  // 1000 - Maximum validator count
    MaxDelegators       uint32  // 100 - Max delegators per validator
}

var MainnetStaking = StakingParams{
    MinValidatorStake: big.NewInt(2000).Mul(big.NewInt(2000), big.NewInt(1e18)),
    MaxValidatorStake: big.NewInt(3000000).Mul(big.NewInt(3000000), big.NewInt(1e18)),
    MinDelegatorStake: big.NewInt(25).Mul(big.NewInt(25), big.NewInt(1e18)),
    MaxDelegatorStake: big.NewInt(3000000).Mul(big.NewInt(3000000), big.NewInt(1e18)),
    MinStakeDuration:  14 * 24 * time.Hour,
    MaxStakeDuration:  365 * 24 * time.Hour,
    CooldownPeriod:    7 * 24 * time.Hour,
    BaseAPR:           0.08,
    MaxAPR:            0.15,
    DelegationFeeMin:  0.02,
    DelegationFeeMax:  1.00,
    MaxValidators:     1000,
    MaxDelegators:     100,
}
```

## Chain-Specific Parameters

### Q-Chain (Quasar Chain)

```go
type QChainParams struct {
    ConsensusEngine     string  // "quasar"
    BlockTime           time.Duration // 500ms
    MaxBlockSize        uint32  // 2 MB
    MaxTxPerBlock       uint32  // 5000
    StateModel          string  // "UTXO"
}
```

### C-Chain (Contract Chain)

```go
type CChainParams struct {
    ConsensusEngine     string  // "quasar"
    BlockTime           time.Duration // 2s
    MaxBlockSize        uint32  // 30 MB
    MaxGasPerBlock      uint64  // 30,000,000
    StateModel          string  // "Account"
    EVMVersion          string  // "Shanghai"
}
```

### X-Chain (Exchange Chain)

```go
type XChainParams struct {
    ConsensusEngine     string  // "quasar"
    BlockTime           time.Duration // 1s
    MaxBlockSize        uint32  // 5 MB
    MaxOrdersPerBlock   uint32  // 10000
    StateModel          string  // "UTXO+OrderBook"
}
```

## Validation Rules

### Block Validation

```go
type BlockValidation struct {
    MaxBlockTime        time.Duration // 10s - Maximum time for block
    MinBlockTime        time.Duration // 100ms - Minimum time for block
    MaxBlockSize        uint32  // 2 MB - Maximum block size
    MaxTransactions     uint32  // 5000 - Max transactions per block
    RequiredSignatures  uint32  // 15 - Required signatures (2/3+1)
}
```

### Transaction Validation

```go
type TxValidation struct {
    MaxTxSize           uint32  // 128 KB - Maximum transaction size
    MaxGasPrice         *big.Int // 1000 Gwei - Maximum gas price
    MinGasPrice         *big.Int // 1 Gwei - Minimum gas price
    MaxDataSize         uint32  // 100 KB - Maximum data field size
    SignatureTimeout    time.Duration // 1 hour - Signature validity
}
```

## Security Parameters

### Byzantine Fault Tolerance

```go
type BFTParams struct {
    MaxByzantineNodes   float64 // 0.33 - Maximum Byzantine nodes (1/3)
    SafetyThreshold     float64 // 0.67 - Safety threshold (2/3+1)
    LivenessThreshold   float64 // 0.51 - Liveness threshold (>1/2)
    TimeoutMultiplier   float64 // 1.5 - Timeout increase per round
}
```

### DDoS Protection

```go
type DDoSProtection struct {
    MaxConnectionsPerIP uint32  // 10 - Max connections per IP
    RateLimitPerSecond  uint32  // 100 - Requests per second
    BanDuration         time.Duration // 1 hour - Ban duration
    BlacklistSize       uint32  // 10000 - Max blacklisted IPs
}
```

## Monitoring and Metrics

### Performance Metrics

```go
type MetricsConfig struct {
    CollectionInterval  time.Duration // 10s - Metrics collection interval
    RetentionPeriod     time.Duration // 7 days - Metrics retention
    PrometheusPort      uint16  // 9956 - Prometheus metrics port
    EnableProfiling     bool    // false - CPU/Memory profiling
    EnableTracing       bool    // false - Distributed tracing
}
```

## Migration and Upgrades

### Protocol Upgrades

```go
type UpgradeParams struct {
    ActivationHeight    uint64  // Block height for activation
    GracePeriod         uint64  // 10000 blocks - Grace period
    MandatoryHeight     uint64  // ActivationHeight + GracePeriod
    BackwardCompatible  bool    // Must maintain compatibility
}
```

## Compliance Matrix

### Parameter Compliance

| Parameter Category | Mainnet | Testnet | Local | Status |
|-------------------|---------|---------|-------|--------|
| Consensus | ✅ Enforced | ✅ Enforced | ✅ Enforced | CANONICAL |
| Gas Schedule | ✅ Enforced | ✅ Enforced | ✅ Enforced | CANONICAL |
| Staking | ✅ Enforced | ⚠️ Relaxed | ⚠️ Relaxed | NETWORK-SPECIFIC |
| Cryptography | ✅ Enforced | ✅ Enforced | ⚠️ Relaxed | SECURITY-CRITICAL |
| Networking | ✅ Enforced | ⚠️ Relaxed | ⚠️ Relaxed | NETWORK-SPECIFIC |

### Validation

```go
// ValidateConsensusParams ensures parameters match canonical values
func ValidateConsensusParams(params interface{}) error {
    switch p := params.(type) {
    case QuasarParams:
        if !reflect.DeepEqual(p, MainnetQuasar) {
            return fmt.Errorf("invalid Quasar params: deviation from canonical")
        }
    case SnowmanPlusParams:
        if !reflect.DeepEqual(p, CanonicalSnowmanPlus) {
            return fmt.Errorf("invalid Snowman++ params: deviation from canonical")
        }
    default:
        return fmt.Errorf("unknown consensus type: %T", params)
    }
    return nil
}
```

## Testing Requirements

### Consensus Testing

```bash
# Test Quasar consensus with canonical parameters
go test -run TestQuasarConsensus -timeout 30s

# Test Snowman++ fallback
go test -run TestSnowmanPlusConsensus -timeout 30s

# Validate all parameters
go test -run TestCanonicalCompliance -v
```

### Performance Benchmarks

```bash
# Benchmark consensus performance
go test -bench BenchmarkConsensus -benchtime 10s

# Benchmark with different validator counts
go test -bench BenchmarkValidatorScaling -benchtime 30s
```

## References

- [LP-700: Quasar Consensus Protocol](./LP-700-quasar.md)
- [LP-600: Snowman++ Consensus](./LP-600-snowman.md)
- [LP-000: Canonical Definitions](./LP-000-CANONICAL.md)
- [LP-001: ML-KEM Post-Quantum](./LP-001-ML-KEM.md)
- [LP-002: ML-DSA Signatures](./LP-002-ML-DSA.md)
- [LP-003: SLH-DSA Hash Signatures](./LP-003-SLH-DSA.md)

## Enforcement

**CRITICAL**: These parameters are enforced at multiple levels:

1. **Compile-Time**: Build fails if parameters don't match
2. **Runtime**: Node refuses to start with invalid parameters
3. **Network**: Peers reject connections with mismatched parameters
4. **Consensus**: Blocks with invalid parameters are rejected

Any deviation from these canonical parameters will result in:
- Immediate node isolation from the network
- Consensus failure and chain halt
- Automatic alerting to operators
- Required hotfix deployment

---

**Status**: FINAL  
**Authority**: ABSOLUTE  
**Created**: 2025-01-14  
**Version**: 1.0.0

**WARNING**: This document defines the ONLY valid consensus parameters. Any code not conforming to these parameters is broken and must be fixed immediately.