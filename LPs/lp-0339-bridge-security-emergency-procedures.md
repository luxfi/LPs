---
lp: 0339
title: Bridge Security and Emergency Procedures
description: Security measures and emergency response procedures for the Lux Bridge cross-chain infrastructure
author: Lux Protocol Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Bridge
created: 2025-12-11
requires: 330, 331, 333, 335
activation:
  flag: lp339-bridge-security
  hfName: "Sentinel"
  activationHeight: "0"
---

> **See also**: [LP-330](./lp-0330-t-chain-thresholdvm-specification.md), [LP-331](./lp-0331-b-chain-bridgevm-specification.md), [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md), [LP-335](./lp-0335-bridge-smart-contract-integration.md), [LP-INDEX](./LP-INDEX.md)

## Abstract

This LP specifies security measures and emergency response procedures for the Lux Bridge cross-chain infrastructure. The specification defines a comprehensive threat model, defense-in-depth layers including rate limiting, withdrawal delays, circuit breakers, and insurance mechanisms. Emergency procedures cover pause mechanisms, key rotation, fund recovery, and communication protocols. Monitoring and alerting systems track on-chain metrics, off-chain infrastructure, and anomaly detection. Governance thresholds define authorization levels for emergency actions. The document integrates with T-Chain (LP-330), B-Chain (LP-331), dynamic signer rotation (LP-333), and bridge smart contracts (LP-335) to provide a unified security framework.

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

**Conformance Requirements:**

1. Implementations MUST support all pause levels defined in Section 3.1
2. Implementations MUST implement rate limiting as specified in Section 2.1
3. Implementations MUST support circuit breakers for automatic threat response
4. Implementations SHOULD implement withdrawal delays for amounts exceeding $10,000 USD equivalent
5. Implementations MUST support emergency key rotation procedures
6. Implementations MUST maintain audit logs for all security-relevant operations
7. Implementations SHOULD implement anomaly detection for transaction patterns
8. Implementations MUST support multi-guardian authorization for fund recovery
9. Implementations MUST NOT allow single-guardian fund recovery operations
10. Implementations MUST emit events for all pause and unpause operations

## Motivation

### Problem Statement

Cross-chain bridges represent significant security risk vectors. Historical bridge exploits have resulted in billions of dollars in losses:

1. **Ronin Bridge (2022)**: $625M lost via compromised validator keys
2. **Wormhole (2022)**: $320M lost via smart contract vulnerability
3. **Nomad (2022)**: $190M lost via initialization bug
4. **Harmony Horizon (2022)**: $100M lost via compromised multisig

These incidents share common failure modes:

- **Key Compromise**: Insufficient threshold or weak key management
- **Smart Contract Bugs**: Unaudited or poorly tested code
- **Oracle Manipulation**: External data feed attacks
- **Insufficient Monitoring**: Delayed incident detection
- **No Emergency Response**: Inability to pause during active exploit

### Solution

This LP establishes a security framework addressing each failure mode:

1. **Defense-in-Depth**: Multiple independent security layers
2. **Proactive Security**: Continuous monitoring and automatic responses
3. **Rapid Response**: Sub-minute pause capability with clear escalation
4. **Recovery Procedures**: Documented processes for fund recovery
5. **Governance Integration**: On-chain authorization for sensitive operations

## Specification

### 1. Threat Model

#### 1.1 Adversary Capabilities

| Adversary Type | Capabilities | Assets at Risk |
|----------------|--------------|----------------|
| **External Attacker** | Network observation, phishing, malware | Signer keys, infrastructure |
| **Nation State** | Advanced persistent threats, supply chain | All infrastructure |
| **Insider Threat** | Direct system access, key knowledge | Keys, operational secrets |
| **Colluding Signers** | Up to t-1 malicious signers | Bridge funds if threshold exceeded |
| **Smart Contract Exploiter** | Transaction crafting, MEV | Contract-held assets |

#### 1.2 Signer Compromise Scenarios

```go
// SignerCompromiseScenario defines potential signer compromise vectors
type SignerCompromiseScenario struct {
    ID              string
    Description     string
    CompromiseVector CompromiseVector
    AffectedSigners int
    Mitigation      string
    ResponseTime    time.Duration
}

type CompromiseVector uint8

const (
    VectorKeyExtraction    CompromiseVector = 0  // Private key directly stolen
    VectorMalware          CompromiseVector = 1  // Signing malware
    VectorSocialEngineering CompromiseVector = 2  // Phishing/coercion
    VectorSupplyChain      CompromiseVector = 3  // Compromised dependencies
    VectorInsider          CompromiseVector = 4  // Malicious operator
    VectorSideChannel      CompromiseVector = 5  // Timing/power analysis
)

var KnownScenarios = []SignerCompromiseScenario{
    {
        ID:              "SC-001",
        Description:     "Single signer key extraction via server compromise",
        CompromiseVector: VectorKeyExtraction,
        AffectedSigners: 1,
        Mitigation:      "HSM storage, encrypted shares at rest",
        ResponseTime:    15 * time.Minute,
    },
    {
        ID:              "SC-002",
        Description:     "Multiple signers compromised via shared vulnerability",
        CompromiseVector: VectorSupplyChain,
        AffectedSigners: 3, // Up to t-1
        Mitigation:      "Diverse infrastructure, software diversity",
        ResponseTime:    5 * time.Minute,
    },
    {
        ID:              "SC-003",
        Description:     "Coordinated insider attack with external actor",
        CompromiseVector: VectorInsider,
        AffectedSigners: 2,
        Mitigation:      "Background checks, separation of duties, audit logging",
        ResponseTime:    10 * time.Minute,
    },
    {
        ID:              "SC-004",
        Description:     "Side-channel attack against HSM",
        CompromiseVector: VectorSideChannel,
        AffectedSigners: 1,
        Mitigation:      "FIPS 140-3 certified HSMs, regular firmware updates",
        ResponseTime:    1 * time.Hour,
    },
}
```

**Signer Compromise Response Matrix:**

| Signers Compromised | Threshold Status | Response | Recovery Time |
|---------------------|------------------|----------|---------------|
| 1 | Below threshold | Rotate affected signer via LP-333 resharing | 1 hour |
| 2-3 (< t) | Below threshold | Emergency reshare to new signer set | 4 hours |
| t (threshold) | AT THRESHOLD | Emergency pause, full key rotation | 24 hours |
| > t | EXCEEDED | Pause, fund recovery, full rotation | 48+ hours |

#### 1.3 Smart Contract Vulnerabilities

```go
// ContractVulnerabilityClass categorizes smart contract risks
type ContractVulnerabilityClass struct {
    Class       string
    Severity    Severity
    Examples    []string
    Mitigations []string
}

type Severity uint8

const (
    SeverityCritical Severity = 4  // Immediate fund loss
    SeverityHigh     Severity = 3  // Delayed fund loss or DoS
    SeverityMedium   Severity = 2  // Limited impact
    SeverityLow      Severity = 1  // Informational
)

var ContractVulnerabilities = []ContractVulnerabilityClass{
    {
        Class:    "Signature Verification",
        Severity: SeverityCritical,
        Examples: []string{
            "Missing ecrecover return check",
            "Signature malleability",
            "Replay attack via missing nonce",
        },
        Mitigations: []string{
            "OpenZeppelin ECDSA library",
            "EIP-712 structured signatures",
            "Nonce tracking per operation",
        },
    },
    {
        Class:    "Access Control",
        Severity: SeverityCritical,
        Examples: []string{
            "Missing onlyRole modifiers",
            "Incorrect role hierarchy",
            "Initialization bugs",
        },
        Mitigations: []string{
            "OpenZeppelin AccessControl",
            "Initializable pattern",
            "Comprehensive role tests",
        },
    },
    {
        Class:    "Reentrancy",
        Severity: SeverityHigh,
        Examples: []string{
            "Cross-function reentrancy",
            "Read-only reentrancy",
            "State update after external call",
        },
        Mitigations: []string{
            "ReentrancyGuard on all entry points",
            "Checks-Effects-Interactions pattern",
            "State locking",
        },
    },
    {
        Class:    "Integer Overflow",
        Severity: SeverityHigh,
        Examples: []string{
            "Unchecked arithmetic",
            "Truncation errors",
            "Fee calculation overflow",
        },
        Mitigations: []string{
            "Solidity 0.8+ default checks",
            "SafeMath for legacy code",
            "Explicit overflow tests",
        },
    },
    {
        Class:    "Oracle Manipulation",
        Severity: SeverityHigh,
        Examples: []string{
            "Price manipulation",
            "Stale data usage",
            "Flash loan attacks",
        },
        Mitigations: []string{
            "TWAP for price feeds",
            "Staleness checks",
            "Flash loan protection",
        },
    },
}
```

#### 1.4 Oracle Manipulation Vectors

The bridge relies on external chain observations. Attack vectors include:

```go
// OracleAttackVector defines oracle manipulation scenarios
type OracleAttackVector struct {
    Vector      string
    Description string
    Impact      string
    Mitigation  string
}

var OracleAttacks = []OracleAttackVector{
    {
        Vector:      "Fake Deposit",
        Description: "Relayer submits false deposit observation",
        Impact:      "Unauthorized minting on destination chain",
        Mitigation:  "Multi-relayer quorum (3+), Merkle proof verification",
    },
    {
        Vector:      "Chain Reorganization",
        Description: "Source chain reorg invalidates deposit after mint",
        Impact:      "Double spend",
        Mitigation:  "Chain-specific confirmation requirements (6-32 blocks)",
    },
    {
        Vector:      "Eclipse Attack",
        Description: "Isolate relayer from honest network",
        Impact:      "Feed false blockchain state",
        Mitigation:  "Multiple RPC endpoints, diverse node providers",
    },
    {
        Vector:      "Timestamp Manipulation",
        Description: "Manipulate block timestamps for deadline bypass",
        Impact:      "Bypass time-based security checks",
        Mitigation:  "Block height checks, reasonable timestamp bounds",
    },
    {
        Vector:      "Price Oracle Manipulation",
        Description: "Manipulate exchange rate for swap operations",
        Impact:      "Unfavorable exchange rates for users",
        Mitigation:  "TWAP oracles, price deviation circuit breakers",
    },
}
```

#### 1.5 Network-Level Attacks

```go
// NetworkAttack defines network-level attack scenarios
type NetworkAttack struct {
    Attack          string
    Layer           NetworkLayer
    Description     string
    Impact          string
    Detection       string
    Mitigation      string
}

type NetworkLayer uint8

const (
    LayerNetwork    NetworkLayer = 0  // TCP/IP, DNS
    LayerTransport  NetworkLayer = 1  // TLS, P2P
    LayerConsensus  NetworkLayer = 2  // Blockchain consensus
    LayerApplication NetworkLayer = 3  // Bridge logic
)

var NetworkAttacks = []NetworkAttack{
    {
        Attack:      "DNS Hijacking",
        Layer:       LayerNetwork,
        Description: "Redirect RPC endpoints to malicious servers",
        Impact:      "Feed false blockchain data to relayers",
        Detection:   "DNSSEC validation, certificate pinning",
        Mitigation:  "Multiple DNS resolvers, IP allowlisting",
    },
    {
        Attack:      "BGP Hijacking",
        Layer:       LayerNetwork,
        Description: "Route traffic through attacker-controlled nodes",
        Impact:      "Man-in-the-middle on relayer traffic",
        Detection:   "BGP monitoring services",
        Mitigation:  "RPKI validation, diverse ISP paths",
    },
    {
        Attack:      "Sybil Attack",
        Layer:       LayerTransport,
        Description: "Flood network with malicious peer nodes",
        Impact:      "Eclipse honest nodes",
        Detection:   "Peer scoring, connection limits",
        Mitigation:  "Stake-weighted peer selection",
    },
    {
        Attack:      "Consensus Delay",
        Layer:       LayerConsensus,
        Description: "Delay message propagation to specific validators",
        Impact:      "Prevent signature aggregation",
        Detection:   "Latency monitoring, timeout tracking",
        Mitigation:  "Redundant message paths, timeout escalation",
    },
    {
        Attack:      "DoS on Signers",
        Layer:       LayerApplication,
        Description: "Overwhelm signer nodes with requests",
        Impact:      "Prevent legitimate signature generation",
        Detection:   "Request rate monitoring",
        Mitigation:  "Rate limiting, request prioritization",
    },
}
```

### 2. Defense Layers

#### 2.1 Rate Limiting

```go
// RateLimitConfig defines per-asset and per-user rate limits
type RateLimitConfig struct {
    // Per-asset limits
    AssetLimits map[AssetID]*AssetRateLimit

    // Per-user limits
    UserLimits  *UserRateLimit

    // Global limits
    GlobalLimits *GlobalRateLimit
}

type AssetRateLimit struct {
    AssetID          AssetID
    MaxPerTransaction *big.Int        // Maximum single transaction
    MaxPerHour       *big.Int          // Hourly limit
    MaxPerDay        *big.Int          // Daily limit
    MaxPerWeek       *big.Int          // Weekly limit
    CooldownPeriod   time.Duration     // Minimum time between large transactions
    LargeThreshold   *big.Int          // Threshold for "large" transaction
}

type UserRateLimit struct {
    MaxTransactionsPerHour  uint32
    MaxTransactionsPerDay   uint32
    MaxVolumePerDay         *big.Int    // Total value across all assets
    NewUserRestriction      time.Duration // Cool-off period for new addresses
    NewUserMaxAmount        *big.Int      // Lower limit for new addresses
}

type GlobalRateLimit struct {
    MaxTotalVolumePerHour *big.Int
    MaxTotalVolumePerDay  *big.Int
    MaxConcurrentRequests uint32
    RequestQueueDepth     uint32
}

// DefaultRateLimits provides recommended defaults
var DefaultRateLimits = RateLimitConfig{
    AssetLimits: map[AssetID]*AssetRateLimit{
        AssetUSDC: {
            MaxPerTransaction: big.NewInt(1_000_000 * 1e6),   // $1M per tx
            MaxPerHour:        big.NewInt(10_000_000 * 1e6),  // $10M per hour
            MaxPerDay:         big.NewInt(50_000_000 * 1e6),  // $50M per day
            CooldownPeriod:    10 * time.Minute,
            LargeThreshold:    big.NewInt(100_000 * 1e6),     // $100k
        },
        AssetWETH: {
            MaxPerTransaction: big.NewInt(500 * 1e18),        // 500 ETH
            MaxPerHour:        big.NewInt(5000 * 1e18),       // 5000 ETH
            MaxPerDay:         big.NewInt(25000 * 1e18),      // 25000 ETH
            CooldownPeriod:    15 * time.Minute,
            LargeThreshold:    big.NewInt(50 * 1e18),         // 50 ETH
        },
        AssetWBTC: {
            MaxPerTransaction: big.NewInt(10 * 1e8),          // 10 BTC
            MaxPerHour:        big.NewInt(100 * 1e8),         // 100 BTC
            MaxPerDay:         big.NewInt(500 * 1e8),         // 500 BTC
            CooldownPeriod:    30 * time.Minute,
            LargeThreshold:    big.NewInt(1 * 1e8),           // 1 BTC
        },
    },
    UserLimits: &UserRateLimit{
        MaxTransactionsPerHour:  10,
        MaxTransactionsPerDay:   50,
        MaxVolumePerDay:        big.NewInt(5_000_000), // $5M USD equivalent
        NewUserRestriction:     24 * time.Hour,
        NewUserMaxAmount:       big.NewInt(10_000),    // $10k for new users
    },
    GlobalLimits: &GlobalRateLimit{
        MaxTotalVolumePerHour: big.NewInt(100_000_000), // $100M
        MaxTotalVolumePerDay:  big.NewInt(500_000_000), // $500M
        MaxConcurrentRequests: 1000,
        RequestQueueDepth:     10000,
    },
}

// RateLimiter enforces rate limits
type RateLimiter struct {
    config   *RateLimitConfig
    state    *RateLimitState
    mu       sync.RWMutex
}

type RateLimitState struct {
    AssetVolumes   map[AssetID]*VolumeTracker
    UserVolumes    map[common.Address]*UserVolumeTracker
    GlobalVolume   *VolumeTracker
    PendingRequests int32
}

type VolumeTracker struct {
    HourlyBuckets [24]*big.Int  // Rolling 24 hours
    DailyTotal    *big.Int
    WeeklyTotal   *big.Int
    LastLargeTx   time.Time
    CurrentHour   int
}

func (rl *RateLimiter) CheckLimit(
    asset AssetID,
    user common.Address,
    amount *big.Int,
) error {
    rl.mu.RLock()
    defer rl.mu.RUnlock()

    // Check asset limits
    if err := rl.checkAssetLimit(asset, amount); err != nil {
        return fmt.Errorf("asset limit exceeded: %w", err)
    }

    // Check user limits
    if err := rl.checkUserLimit(user, amount); err != nil {
        return fmt.Errorf("user limit exceeded: %w", err)
    }

    // Check global limits
    if err := rl.checkGlobalLimit(amount); err != nil {
        return fmt.Errorf("global limit exceeded: %w", err)
    }

    return nil
}

func (rl *RateLimiter) checkAssetLimit(asset AssetID, amount *big.Int) error {
    limits := rl.config.AssetLimits[asset]
    if limits == nil {
        return ErrAssetNotConfigured
    }

    tracker := rl.state.AssetVolumes[asset]

    // Check per-transaction limit
    if amount.Cmp(limits.MaxPerTransaction) > 0 {
        return ErrExceedsTransactionLimit
    }

    // Check hourly limit
    hourlyTotal := new(big.Int).Add(tracker.HourlyBuckets[tracker.CurrentHour], amount)
    if hourlyTotal.Cmp(limits.MaxPerHour) > 0 {
        return ErrExceedsHourlyLimit
    }

    // Check daily limit
    dailyTotal := new(big.Int).Add(tracker.DailyTotal, amount)
    if dailyTotal.Cmp(limits.MaxPerDay) > 0 {
        return ErrExceedsDailyLimit
    }

    // Check cooldown for large transactions
    if amount.Cmp(limits.LargeThreshold) >= 0 {
        if time.Since(tracker.LastLargeTx) < limits.CooldownPeriod {
            return ErrCooldownNotElapsed
        }
    }

    return nil
}
```

#### 2.2 Withdrawal Delays (Time-locks)

```go
// WithdrawalDelayConfig defines time-lock parameters
type WithdrawalDelayConfig struct {
    // Tier-based delays
    Tiers []DelayTier

    // Fast-exit option (reduced delay with fee)
    FastExitEnabled   bool
    FastExitFeeRate   uint16  // Basis points
    FastExitMaxAmount *big.Int

    // Challenge period for large withdrawals
    ChallengeEnabled  bool
    ChallengeThreshold *big.Int
    ChallengePeriod   time.Duration
}

type DelayTier struct {
    MinAmount    *big.Int
    MaxAmount    *big.Int
    DelayPeriod  time.Duration
    Description  string
}

var DefaultWithdrawalDelays = WithdrawalDelayConfig{
    Tiers: []DelayTier{
        {
            MinAmount:   big.NewInt(0),
            MaxAmount:   big.NewInt(10_000),       // $10k
            DelayPeriod: 0,                         // Instant
            Description: "Small withdrawal",
        },
        {
            MinAmount:   big.NewInt(10_000),
            MaxAmount:   big.NewInt(100_000),      // $100k
            DelayPeriod: 15 * time.Minute,
            Description: "Medium withdrawal",
        },
        {
            MinAmount:   big.NewInt(100_000),
            MaxAmount:   big.NewInt(1_000_000),    // $1M
            DelayPeriod: 1 * time.Hour,
            Description: "Large withdrawal",
        },
        {
            MinAmount:   big.NewInt(1_000_000),
            MaxAmount:   big.NewInt(10_000_000),   // $10M
            DelayPeriod: 6 * time.Hour,
            Description: "Very large withdrawal",
        },
        {
            MinAmount:   big.NewInt(10_000_000),
            MaxAmount:   nil,                       // Unlimited
            DelayPeriod: 24 * time.Hour,
            Description: "Institutional withdrawal",
        },
    },
    FastExitEnabled:    true,
    FastExitFeeRate:    50,                        // 0.5%
    FastExitMaxAmount:  big.NewInt(100_000),       // Max $100k fast exit
    ChallengeEnabled:   true,
    ChallengeThreshold: big.NewInt(5_000_000),     // $5M
    ChallengePeriod:    4 * time.Hour,
}

// PendingWithdrawal tracks a timelocked withdrawal
type PendingWithdrawal struct {
    ID              WithdrawID
    User            common.Address
    Asset           AssetID
    Amount          *big.Int
    Destination     []byte
    DestChain       uint64
    RequestedAt     time.Time
    UnlocksAt       time.Time
    Status          WithdrawalStatus
    ChallengeStatus *ChallengeStatus
}

type WithdrawalStatus uint8

const (
    WithdrawalPending   WithdrawalStatus = 0
    WithdrawalUnlocked  WithdrawalStatus = 1
    WithdrawalExecuted  WithdrawalStatus = 2
    WithdrawalCancelled WithdrawalStatus = 3
    WithdrawalChallenged WithdrawalStatus = 4
)

type ChallengeStatus struct {
    Challenger   common.Address
    Reason       string
    ChallengedAt time.Time
    Resolution   ChallengeResolution
    ResolvedAt   time.Time
}

type ChallengeResolution uint8

const (
    ChallengeUnresolved ChallengeResolution = 0
    ChallengeRejected   ChallengeResolution = 1
    ChallengeAccepted   ChallengeResolution = 2
)

// WithdrawalManager handles delayed withdrawals
type WithdrawalManager struct {
    config    *WithdrawalDelayConfig
    pending   map[WithdrawID]*PendingWithdrawal
    mu        sync.RWMutex
}

func (wm *WithdrawalManager) CreateWithdrawal(
    user common.Address,
    asset AssetID,
    amount *big.Int,
    destination []byte,
    destChain uint64,
) (*PendingWithdrawal, error) {
    delay := wm.getDelayForAmount(amount)

    withdrawal := &PendingWithdrawal{
        ID:          NewWithdrawID(),
        User:        user,
        Asset:       asset,
        Amount:      amount,
        Destination: destination,
        DestChain:   destChain,
        RequestedAt: time.Now(),
        UnlocksAt:   time.Now().Add(delay),
        Status:      WithdrawalPending,
    }

    // Enable challenge period for large withdrawals
    if wm.config.ChallengeEnabled && amount.Cmp(wm.config.ChallengeThreshold) >= 0 {
        withdrawal.ChallengeStatus = &ChallengeStatus{
            Resolution: ChallengeUnresolved,
        }
    }

    wm.mu.Lock()
    wm.pending[withdrawal.ID] = withdrawal
    wm.mu.Unlock()

    return withdrawal, nil
}

func (wm *WithdrawalManager) ChallengeWithdrawal(
    withdrawalID WithdrawID,
    challenger common.Address,
    reason string,
) error {
    wm.mu.Lock()
    defer wm.mu.Unlock()

    withdrawal, ok := wm.pending[withdrawalID]
    if !ok {
        return ErrWithdrawalNotFound
    }

    if withdrawal.ChallengeStatus == nil {
        return ErrNotChallengeable
    }

    if withdrawal.Status != WithdrawalPending {
        return ErrWithdrawalNotPending
    }

    withdrawal.ChallengeStatus.Challenger = challenger
    withdrawal.ChallengeStatus.Reason = reason
    withdrawal.ChallengeStatus.ChallengedAt = time.Now()
    withdrawal.Status = WithdrawalChallenged

    // Extend unlock time by challenge period
    withdrawal.UnlocksAt = withdrawal.UnlocksAt.Add(wm.config.ChallengePeriod)

    return nil
}
```

#### 2.3 Circuit Breakers

```go
// CircuitBreakerConfig defines automatic pause triggers
type CircuitBreakerConfig struct {
    // Volume-based triggers
    VolumeBreakers []VolumeBreaker

    // Anomaly-based triggers
    AnomalyBreakers []AnomalyBreaker

    // Price-based triggers
    PriceBreakers []PriceBreaker

    // Global settings
    AutoRecoveryEnabled bool
    AutoRecoveryDelay   time.Duration
    ManualOverride      bool
}

type VolumeBreaker struct {
    Name            string
    Asset           AssetID         // Empty for global
    Threshold       *big.Int
    TimeWindow      time.Duration
    Action          BreakerAction
    AutoResetAfter  time.Duration   // 0 = manual reset required
}

type AnomalyBreaker struct {
    Name            string
    Metric          AnomalyMetric
    Threshold       float64
    TimeWindow      time.Duration
    Action          BreakerAction
    Sensitivity     float64         // Standard deviations
}

type PriceBreaker struct {
    Name            string
    Asset           AssetID
    MaxDeviation    uint16          // Basis points from reference
    ReferenceSource string          // Oracle identifier
    Action          BreakerAction
}

type BreakerAction uint8

const (
    ActionPauseAsset    BreakerAction = 0
    ActionPauseChain    BreakerAction = 1
    ActionPauseGlobal   BreakerAction = 2
    ActionReduceLimits  BreakerAction = 3
    ActionIncreaseDelay BreakerAction = 4
    ActionAlert         BreakerAction = 5
)

type AnomalyMetric uint8

const (
    MetricTransactionCount    AnomalyMetric = 0
    MetricUniqueAddresses     AnomalyMetric = 1
    MetricAverageAmount       AnomalyMetric = 2
    MetricFailureRate         AnomalyMetric = 3
    MetricSignatureLatency    AnomalyMetric = 4
    MetricGasPrice            AnomalyMetric = 5
)

var DefaultCircuitBreakers = CircuitBreakerConfig{
    VolumeBreakers: []VolumeBreaker{
        {
            Name:           "hourly_volume_spike",
            Threshold:      big.NewInt(50_000_000), // $50M
            TimeWindow:     1 * time.Hour,
            Action:         ActionReduceLimits,
            AutoResetAfter: 1 * time.Hour,
        },
        {
            Name:           "daily_volume_critical",
            Threshold:      big.NewInt(200_000_000), // $200M
            TimeWindow:     24 * time.Hour,
            Action:         ActionPauseGlobal,
            AutoResetAfter: 0, // Manual reset
        },
        {
            Name:           "single_asset_drain",
            Asset:          AssetUSDC,
            Threshold:      big.NewInt(20_000_000), // $20M single asset
            TimeWindow:     1 * time.Hour,
            Action:         ActionPauseAsset,
            AutoResetAfter: 2 * time.Hour,
        },
    },
    AnomalyBreakers: []AnomalyBreaker{
        {
            Name:        "tx_count_anomaly",
            Metric:      MetricTransactionCount,
            Threshold:   3.0, // 3x normal
            TimeWindow:  15 * time.Minute,
            Action:      ActionAlert,
            Sensitivity: 2.5, // 2.5 standard deviations
        },
        {
            Name:        "failure_rate_spike",
            Metric:      MetricFailureRate,
            Threshold:   0.1, // 10% failure rate
            TimeWindow:  5 * time.Minute,
            Action:      ActionPauseGlobal,
            Sensitivity: 3.0,
        },
        {
            Name:        "signature_latency",
            Metric:      MetricSignatureLatency,
            Threshold:   30.0, // 30 seconds
            TimeWindow:  5 * time.Minute,
            Action:      ActionAlert,
            Sensitivity: 2.0,
        },
    },
    PriceBreakers: []PriceBreaker{
        {
            Name:           "usdc_depeg",
            Asset:          AssetUSDC,
            MaxDeviation:   200, // 2% from $1
            ReferenceSource: "chainlink_usdc_usd",
            Action:         ActionPauseAsset,
        },
        {
            Name:           "eth_flash_crash",
            Asset:          AssetWETH,
            MaxDeviation:   1000, // 10% deviation
            ReferenceSource: "chainlink_eth_usd",
            Action:         ActionIncreaseDelay,
        },
    },
    AutoRecoveryEnabled: true,
    AutoRecoveryDelay:   30 * time.Minute,
    ManualOverride:      true,
}

// CircuitBreaker manages automatic pause triggers
type CircuitBreaker struct {
    config  *CircuitBreakerConfig
    state   *CircuitBreakerState
    metrics *MetricsCollector
    mu      sync.RWMutex
}

type CircuitBreakerState struct {
    TrippedBreakers  map[string]*TrippedBreaker
    AssetsPaused     map[AssetID]bool
    ChainsPaused     map[uint64]bool
    GlobalPaused     bool
    LimitsReduced    bool
    DelaysIncreased  bool
}

type TrippedBreaker struct {
    Name        string
    TrippedAt   time.Time
    Reason      string
    Action      BreakerAction
    AutoResetAt *time.Time
}

func (cb *CircuitBreaker) Check() error {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    // Check volume breakers
    for _, breaker := range cb.config.VolumeBreakers {
        if cb.isVolumeBreached(breaker) {
            cb.tripBreaker(breaker.Name, breaker.Action, "Volume threshold exceeded")
        }
    }

    // Check anomaly breakers
    for _, breaker := range cb.config.AnomalyBreakers {
        if cb.isAnomalyDetected(breaker) {
            cb.tripBreaker(breaker.Name, breaker.Action, "Anomaly detected")
        }
    }

    // Check price breakers
    for _, breaker := range cb.config.PriceBreakers {
        if cb.isPriceDeviated(breaker) {
            cb.tripBreaker(breaker.Name, breaker.Action, "Price deviation exceeded")
        }
    }

    // Check for auto-recovery
    cb.checkAutoRecovery()

    return nil
}

func (cb *CircuitBreaker) tripBreaker(name string, action BreakerAction, reason string) {
    tripped := &TrippedBreaker{
        Name:      name,
        TrippedAt: time.Now(),
        Reason:    reason,
        Action:    action,
    }

    cb.state.TrippedBreakers[name] = tripped

    // Execute action
    switch action {
    case ActionPauseAsset:
        // Asset-specific pause handled by caller
    case ActionPauseChain:
        // Chain-specific pause handled by caller
    case ActionPauseGlobal:
        cb.state.GlobalPaused = true
    case ActionReduceLimits:
        cb.state.LimitsReduced = true
    case ActionIncreaseDelay:
        cb.state.DelaysIncreased = true
    case ActionAlert:
        cb.sendAlert(tripped)
    }

    log.Warn("Circuit breaker tripped",
        "name", name,
        "action", action,
        "reason", reason)
}
```

#### 2.4 Insurance Fund

```go
// InsuranceFundConfig defines the insurance mechanism
type InsuranceFundConfig struct {
    // Fund parameters
    TargetSize         *big.Int        // Target fund size (e.g., $50M)
    MinimumSize        *big.Int        // Minimum before deposits paused
    MaxClaimPerEvent   *big.Int        // Maximum single claim
    TotalCoverage      *big.Int        // Total coverage limit

    // Funding sources
    FeeContribution    uint16          // Basis points from bridge fees
    StakingContribution uint16         // From staking rewards

    // Governance
    ClaimThreshold     uint32          // Votes required for claim approval
    VotingPeriod       time.Duration
    ExecutionDelay     time.Duration

    // Coverage tiers
    CoverageTiers []CoverageTier
}

type CoverageTier struct {
    Name        string
    CoverageType CoverageType
    MaxAmount   *big.Int
    Deductible  *big.Int
    WaitingPeriod time.Duration
}

type CoverageType uint8

const (
    CoverageSmartContractBug CoverageType = 0
    CoverageKeyCompromise    CoverageType = 1
    CoverageOracleFailure    CoverageType = 2
    CoverageOperationalError CoverageType = 3
    CoverageCensorship       CoverageType = 4
)

var DefaultInsuranceConfig = InsuranceFundConfig{
    TargetSize:        big.NewInt(50_000_000),  // $50M
    MinimumSize:       big.NewInt(10_000_000),  // $10M
    MaxClaimPerEvent:  big.NewInt(25_000_000),  // $25M
    TotalCoverage:     big.NewInt(100_000_000), // $100M
    FeeContribution:   2000,                     // 20% of fees
    StakingContribution: 500,                   // 5% of staking
    ClaimThreshold:    67,                      // 67% vote
    VotingPeriod:      7 * 24 * time.Hour,      // 7 days
    ExecutionDelay:    2 * 24 * time.Hour,      // 2 days

    CoverageTiers: []CoverageTier{
        {
            Name:         "Smart Contract Bug",
            CoverageType: CoverageSmartContractBug,
            MaxAmount:    big.NewInt(50_000_000),
            Deductible:   big.NewInt(100_000),
            WaitingPeriod: 0,
        },
        {
            Name:         "Key Compromise",
            CoverageType: CoverageKeyCompromise,
            MaxAmount:    big.NewInt(25_000_000),
            Deductible:   big.NewInt(500_000),
            WaitingPeriod: 24 * time.Hour,
        },
        {
            Name:         "Oracle Failure",
            CoverageType: CoverageOracleFailure,
            MaxAmount:    big.NewInt(10_000_000),
            Deductible:   big.NewInt(50_000),
            WaitingPeriod: 0,
        },
    },
}

// InsuranceFund manages the coverage pool
type InsuranceFund struct {
    config        *InsuranceFundConfig
    balance       *big.Int
    claimsHistory []*InsuranceClaim
    pendingClaims map[ClaimID]*InsuranceClaim
    mu            sync.RWMutex
}

type InsuranceClaim struct {
    ID            ClaimID
    Claimant      common.Address
    CoverageType  CoverageType
    Amount        *big.Int
    Evidence      string
    SubmittedAt   time.Time
    Status        ClaimStatus
    VotesFor      uint64
    VotesAgainst  uint64
    VotingEnds    time.Time
    ExecutableAt  time.Time
}

type ClaimStatus uint8

const (
    ClaimPending  ClaimStatus = 0
    ClaimVoting   ClaimStatus = 1
    ClaimApproved ClaimStatus = 2
    ClaimRejected ClaimStatus = 3
    ClaimPaid     ClaimStatus = 4
)

func (f *InsuranceFund) SubmitClaim(
    claimant common.Address,
    coverageType CoverageType,
    amount *big.Int,
    evidence string,
) (*InsuranceClaim, error) {
    f.mu.Lock()
    defer f.mu.Unlock()

    // Validate coverage tier
    tier := f.getCoverageTier(coverageType)
    if tier == nil {
        return nil, ErrCoverageTypeNotSupported
    }

    // Check amount within limits
    netAmount := new(big.Int).Sub(amount, tier.Deductible)
    if netAmount.Cmp(tier.MaxAmount) > 0 {
        netAmount = tier.MaxAmount
    }

    if netAmount.Cmp(f.config.MaxClaimPerEvent) > 0 {
        netAmount = f.config.MaxClaimPerEvent
    }

    // Check fund has sufficient balance
    if f.balance.Cmp(netAmount) < 0 {
        return nil, ErrInsufficientFundBalance
    }

    claim := &InsuranceClaim{
        ID:           NewClaimID(),
        Claimant:     claimant,
        CoverageType: coverageType,
        Amount:       netAmount,
        Evidence:     evidence,
        SubmittedAt:  time.Now(),
        Status:       ClaimPending,
        VotingEnds:   time.Now().Add(f.config.VotingPeriod),
    }

    f.pendingClaims[claim.ID] = claim

    return claim, nil
}
```

### 3. Emergency Procedures

#### 3.1 Pause Mechanisms

```go
// PauseLevel defines granular pause capabilities
type PauseLevel uint8

const (
    PauseNone         PauseLevel = 0
    PauseDeposits     PauseLevel = 1  // Block new deposits
    PauseWithdrawals  PauseLevel = 2  // Block withdrawals
    PauseNewRequests  PauseLevel = 3  // Block new signature requests
    PauseAsset        PauseLevel = 4  // Pause specific asset
    PauseChain        PauseLevel = 5  // Pause specific chain
    PauseGlobal       PauseLevel = 6  // Pause all operations
)

// PauseManager handles emergency pause operations
type PauseManager struct {
    state       *PauseState
    authorizers []common.Address  // Guardians
    mu          sync.RWMutex
}

type PauseState struct {
    GlobalPaused     bool
    DepositsEnabled  bool
    WithdrawalsEnabled bool
    SigningEnabled   bool
    PausedAssets     map[AssetID]bool
    PausedChains     map[uint64]bool
    PauseHistory     []*PauseEvent
    LastPauseAt      time.Time
    PausedBy         common.Address
    PauseReason      string
}

type PauseEvent struct {
    Timestamp   time.Time
    Level       PauseLevel
    Target      string      // Asset ID, chain ID, or "global"
    Reason      string
    PausedBy    common.Address
    Duration    time.Duration
    AutoUnpause bool
}

// EmergencyPause immediately halts operations
func (pm *PauseManager) EmergencyPause(
    level PauseLevel,
    target string,
    reason string,
    guardian common.Address,
) error {
    pm.mu.Lock()
    defer pm.mu.Unlock()

    // Verify guardian authorization
    if !pm.isAuthorized(guardian) {
        return ErrUnauthorizedGuardian
    }

    event := &PauseEvent{
        Timestamp: time.Now(),
        Level:     level,
        Target:    target,
        Reason:    reason,
        PausedBy:  guardian,
    }

    switch level {
    case PauseGlobal:
        pm.state.GlobalPaused = true
        pm.state.DepositsEnabled = false
        pm.state.WithdrawalsEnabled = false
        pm.state.SigningEnabled = false

    case PauseDeposits:
        pm.state.DepositsEnabled = false

    case PauseWithdrawals:
        pm.state.WithdrawalsEnabled = false

    case PauseNewRequests:
        pm.state.SigningEnabled = false

    case PauseAsset:
        assetID, err := parseAssetID(target)
        if err != nil {
            return err
        }
        pm.state.PausedAssets[assetID] = true

    case PauseChain:
        chainID, err := parseChainID(target)
        if err != nil {
            return err
        }
        pm.state.PausedChains[chainID] = true
    }

    pm.state.PauseHistory = append(pm.state.PauseHistory, event)
    pm.state.LastPauseAt = time.Now()
    pm.state.PausedBy = guardian
    pm.state.PauseReason = reason

    // Emit pause notification
    pm.notifyPause(event)

    log.Error("Emergency pause activated",
        "level", level,
        "target", target,
        "reason", reason,
        "guardian", guardian)

    return nil
}

// IsOperationAllowed checks if an operation is permitted
func (pm *PauseManager) IsOperationAllowed(
    operation OperationType,
    asset AssetID,
    chain uint64,
) bool {
    pm.mu.RLock()
    defer pm.mu.RUnlock()

    // Check global pause
    if pm.state.GlobalPaused {
        return false
    }

    // Check operation-specific pause
    switch operation {
    case OpDeposit:
        if !pm.state.DepositsEnabled {
            return false
        }
    case OpWithdraw:
        if !pm.state.WithdrawalsEnabled {
            return false
        }
    case OpSign:
        if !pm.state.SigningEnabled {
            return false
        }
    }

    // Check asset pause
    if pm.state.PausedAssets[asset] {
        return false
    }

    // Check chain pause
    if pm.state.PausedChains[chain] {
        return false
    }

    return true
}
```

#### 3.2 Emergency Key Rotation

```go
// EmergencyKeyRotation handles urgent signer changes
type EmergencyKeyRotation struct {
    tchain        *TChainClient
    pauseManager  *PauseManager
    governance    *GovernanceClient
}

type KeyRotationRequest struct {
    KeyID              ids.ID
    Reason             RotationReason
    ExcludedSigners    []ids.NodeID    // Suspected compromised
    NewThreshold       uint32          // Optional new threshold
    EmergencyAuthorizer common.Address
    AuthorizerSig      []byte
    Priority           RotationPriority
}

type RotationReason uint8

const (
    ReasonCompromiseSuspected   RotationReason = 0
    ReasonCompromiseConfirmed   RotationReason = 1
    ReasonSignerUnresponsive    RotationReason = 2
    ReasonScheduledRotation     RotationReason = 3
    ReasonGovernanceDecision    RotationReason = 4
)

type RotationPriority uint8

const (
    PriorityNormal    RotationPriority = 0  // Standard reshare (hours)
    PriorityHigh      RotationPriority = 1  // Expedited (< 1 hour)
    PriorityEmergency RotationPriority = 2  // Immediate (< 15 min)
)

func (ekr *EmergencyKeyRotation) InitiateEmergencyRotation(
    req *KeyRotationRequest,
) (*RotationSession, error) {
    // Verify authorization
    if !ekr.verifyEmergencyAuthorization(req) {
        return nil, ErrUnauthorizedRotation
    }

    // Pause operations for this key
    if req.Priority == PriorityEmergency {
        if err := ekr.pauseManager.EmergencyPause(
            PauseGlobal,
            "",
            fmt.Sprintf("Emergency key rotation: %s", req.Reason),
            req.EmergencyAuthorizer,
        ); err != nil {
            return nil, fmt.Errorf("failed to pause: %w", err)
        }
    }

    // Get current key configuration
    currentGen, err := ekr.tchain.GetActiveGeneration(req.KeyID)
    if err != nil {
        return nil, fmt.Errorf("failed to get current generation: %w", err)
    }

    // Calculate new signer set
    newSigners := ekr.calculateNewSigners(
        currentGen.Config.Parties,
        req.ExcludedSigners,
    )

    // Determine new threshold
    newThreshold := req.NewThreshold
    if newThreshold == 0 {
        newThreshold = ekr.calculateThreshold(len(newSigners))
    }

    // Validate we have enough signers
    if len(newSigners) < int(newThreshold) {
        return nil, ErrInsufficientSignersForRotation
    }

    // Create reshare request via LP-333 protocol
    reshareReq := &ReshareRequest{
        KeyID:        req.KeyID,
        NewParties:   newSigners,
        NewThreshold: newThreshold,
        TriggerType:  TriggerEmergency,
    }

    // Submit to T-Chain
    session, err := ekr.tchain.InitiateReshare(reshareReq)
    if err != nil {
        return nil, fmt.Errorf("failed to initiate reshare: %w", err)
    }

    log.Warn("Emergency key rotation initiated",
        "keyID", req.KeyID,
        "reason", req.Reason,
        "excluded", req.ExcludedSigners,
        "newSignerCount", len(newSigners),
        "newThreshold", newThreshold)

    return session, nil
}

func (ekr *EmergencyKeyRotation) calculateNewSigners(
    current []ids.NodeID,
    excluded []ids.NodeID,
) []ids.NodeID {
    excludeSet := make(map[ids.NodeID]bool)
    for _, id := range excluded {
        excludeSet[id] = true
    }

    var newSigners []ids.NodeID
    for _, signer := range current {
        if !excludeSet[signer] {
            newSigners = append(newSigners, signer)
        }
    }

    return newSigners
}
```

#### 3.3 Fund Recovery Procedures

```go
// FundRecoveryProcedure defines steps for recovering funds
type FundRecoveryProcedure struct {
    ID               RecoveryID
    Reason           RecoveryReason
    AffectedAssets   []AssetRecovery
    InitiatedBy      common.Address
    InitiatedAt      time.Time
    Status           RecoveryStatus
    ApprovalRequired uint32          // Number of approvals needed
    Approvals        []RecoveryApproval
    ExecutionPlan    *ExecutionPlan
}

type RecoveryReason uint8

const (
    ReasonExploitMitigation RecoveryReason = 0
    ReasonStuckFunds        RecoveryReason = 1
    ReasonContractUpgrade   RecoveryReason = 2
    ReasonProtocolShutdown  RecoveryReason = 3
)

type AssetRecovery struct {
    Asset          AssetID
    SourceChain    uint64
    SourceAddress  common.Address
    Amount         *big.Int
    DestAddress    common.Address
    RecoveryMethod RecoveryMethod
}

type RecoveryMethod uint8

const (
    MethodNormalWithdraw RecoveryMethod = 0  // Standard withdrawal
    MethodEmergencyDrain RecoveryMethod = 1  // Admin drain function
    MethodUpgradeExtract RecoveryMethod = 2  // Via upgrade
    MethodMultisigRecover RecoveryMethod = 3  // Direct multisig
)

type RecoveryStatus uint8

const (
    RecoveryProposed   RecoveryStatus = 0
    RecoveryApproved   RecoveryStatus = 1
    RecoveryExecuting  RecoveryStatus = 2
    RecoveryCompleted  RecoveryStatus = 3
    RecoveryFailed     RecoveryStatus = 4
    RecoveryCancelled  RecoveryStatus = 5
)

type RecoveryApproval struct {
    Approver    common.Address
    ApprovedAt  time.Time
    Signature   []byte
}

type ExecutionPlan struct {
    Steps       []RecoveryStep
    CurrentStep int
    StartedAt   time.Time
    EstimatedCompletion time.Time
}

type RecoveryStep struct {
    Order       int
    Description string
    ChainID     uint64
    Action      RecoveryAction
    Target      common.Address
    Data        []byte
    Status      StepStatus
    TxHash      common.Hash
    ExecutedAt  time.Time
}

type RecoveryAction uint8

const (
    ActionPause       RecoveryAction = 0
    ActionDrain       RecoveryAction = 1
    ActionTransfer    RecoveryAction = 2
    ActionBurn        RecoveryAction = 3
    ActionUpgrade     RecoveryAction = 4
    ActionUnpause     RecoveryAction = 5
)

// FundRecoveryManager orchestrates fund recovery
type FundRecoveryManager struct {
    procedures     map[RecoveryID]*FundRecoveryProcedure
    vaultContracts map[uint64]*BridgeVault
    governance     *GovernanceClient
    mu             sync.RWMutex
}

func (frm *FundRecoveryManager) InitiateRecovery(
    reason RecoveryReason,
    assets []AssetRecovery,
    initiator common.Address,
) (*FundRecoveryProcedure, error) {
    // Verify initiator is authorized
    if !frm.isAuthorizedRecoveryInitiator(initiator) {
        return nil, ErrUnauthorizedRecoveryInitiator
    }

    // Calculate required approvals based on total value
    totalValue := frm.calculateTotalValue(assets)
    requiredApprovals := frm.getRequiredApprovals(totalValue)

    procedure := &FundRecoveryProcedure{
        ID:               NewRecoveryID(),
        Reason:           reason,
        AffectedAssets:   assets,
        InitiatedBy:      initiator,
        InitiatedAt:      time.Now(),
        Status:           RecoveryProposed,
        ApprovalRequired: requiredApprovals,
    }

    // Generate execution plan
    plan, err := frm.generateExecutionPlan(procedure)
    if err != nil {
        return nil, fmt.Errorf("failed to generate plan: %w", err)
    }
    procedure.ExecutionPlan = plan

    frm.mu.Lock()
    frm.procedures[procedure.ID] = procedure
    frm.mu.Unlock()

    // Notify governance for approval
    frm.notifyGovernance(procedure)

    return procedure, nil
}

func (frm *FundRecoveryManager) ApproveRecovery(
    recoveryID RecoveryID,
    approver common.Address,
    signature []byte,
) error {
    frm.mu.Lock()
    defer frm.mu.Unlock()

    procedure, ok := frm.procedures[recoveryID]
    if !ok {
        return ErrRecoveryNotFound
    }

    if procedure.Status != RecoveryProposed {
        return ErrRecoveryNotPending
    }

    // Verify approver authorization
    if !frm.isAuthorizedApprover(approver) {
        return ErrUnauthorizedApprover
    }

    // Verify signature
    if !frm.verifyApprovalSignature(procedure, approver, signature) {
        return ErrInvalidApprovalSignature
    }

    // Add approval
    procedure.Approvals = append(procedure.Approvals, RecoveryApproval{
        Approver:   approver,
        ApprovedAt: time.Now(),
        Signature:  signature,
    })

    // Check if threshold reached
    if uint32(len(procedure.Approvals)) >= procedure.ApprovalRequired {
        procedure.Status = RecoveryApproved
        log.Info("Recovery procedure approved",
            "id", recoveryID,
            "approvals", len(procedure.Approvals))
    }

    return nil
}

func (frm *FundRecoveryManager) ExecuteRecovery(recoveryID RecoveryID) error {
    frm.mu.Lock()
    procedure := frm.procedures[recoveryID]
    frm.mu.Unlock()

    if procedure == nil {
        return ErrRecoveryNotFound
    }

    if procedure.Status != RecoveryApproved {
        return ErrRecoveryNotApproved
    }

    procedure.Status = RecoveryExecuting
    procedure.ExecutionPlan.StartedAt = time.Now()

    // Execute each step
    for i := range procedure.ExecutionPlan.Steps {
        step := &procedure.ExecutionPlan.Steps[i]
        procedure.ExecutionPlan.CurrentStep = i

        if err := frm.executeStep(step); err != nil {
            procedure.Status = RecoveryFailed
            return fmt.Errorf("step %d failed: %w", i, err)
        }
    }

    procedure.Status = RecoveryCompleted
    return nil
}
```

#### 3.4 Communication Protocols

```go
// CommunicationProtocol defines incident communication procedures
type CommunicationProtocol struct {
    Channels        []CommunicationChannel
    EscalationPath  []EscalationLevel
    Templates       map[IncidentSeverity]*MessageTemplate
    ContactList     *EmergencyContacts
}

type CommunicationChannel struct {
    Type        ChannelType
    Priority    int
    Endpoint    string
    Enabled     bool
    RateLimit   time.Duration
}

type ChannelType uint8

const (
    ChannelEmail       ChannelType = 0
    ChannelSlack       ChannelType = 1
    ChannelDiscord     ChannelType = 2
    ChannelTelegram    ChannelType = 3
    ChannelPagerDuty   ChannelType = 4
    ChannelTwitter     ChannelType = 5
    ChannelOnChain     ChannelType = 6  // On-chain event
)

type EscalationLevel struct {
    Level           int
    Name            string
    TimeToEscalate  time.Duration
    Contacts        []string
    Channels        []ChannelType
    Authority       EscalationAuthority
}

type EscalationAuthority uint8

const (
    AuthorityMonitor     EscalationAuthority = 0  // Can monitor
    AuthorityAlert       EscalationAuthority = 1  // Can send alerts
    AuthorityPause       EscalationAuthority = 2  // Can pause
    AuthorityRotate      EscalationAuthority = 3  // Can rotate keys
    AuthorityRecover     EscalationAuthority = 4  // Can initiate recovery
)

type IncidentSeverity uint8

const (
    SeverityP4 IncidentSeverity = 0  // Low - Informational
    SeverityP3 IncidentSeverity = 1  // Medium - Degraded service
    SeverityP2 IncidentSeverity = 2  // High - Partial outage
    SeverityP1 IncidentSeverity = 3  // Critical - Full outage
    SeverityP0 IncidentSeverity = 4  // Emergency - Active exploit
)

type MessageTemplate struct {
    Subject   string
    Body      string
    Fields    []string  // Required fields
}

type EmergencyContacts struct {
    SecurityTeam    []Contact
    Engineering     []Contact
    Leadership      []Contact
    LegalCounsel    []Contact
    PRTeam          []Contact
    ExternalAuditors []Contact
}

type Contact struct {
    Name        string
    Role        string
    Email       string
    Phone       string
    Available24x7 bool
}

var DefaultCommunicationProtocol = CommunicationProtocol{
    Channels: []CommunicationChannel{
        {Type: ChannelPagerDuty, Priority: 1, Enabled: true},
        {Type: ChannelSlack, Priority: 2, Enabled: true},
        {Type: ChannelEmail, Priority: 3, Enabled: true},
        {Type: ChannelTwitter, Priority: 4, Enabled: true, RateLimit: 5 * time.Minute},
    },
    EscalationPath: []EscalationLevel{
        {
            Level:          1,
            Name:           "On-Call Engineer",
            TimeToEscalate: 5 * time.Minute,
            Channels:       []ChannelType{ChannelSlack, ChannelPagerDuty},
            Authority:      AuthorityPause,
        },
        {
            Level:          2,
            Name:           "Security Lead",
            TimeToEscalate: 15 * time.Minute,
            Channels:       []ChannelType{ChannelPagerDuty, ChannelEmail},
            Authority:      AuthorityRotate,
        },
        {
            Level:          3,
            Name:           "CTO",
            TimeToEscalate: 30 * time.Minute,
            Channels:       []ChannelType{ChannelPagerDuty, ChannelEmail},
            Authority:      AuthorityRecover,
        },
        {
            Level:          4,
            Name:           "CEO + Board",
            TimeToEscalate: 1 * time.Hour,
            Channels:       []ChannelType{ChannelEmail},
            Authority:      AuthorityRecover,
        },
    },
    Templates: map[IncidentSeverity]*MessageTemplate{
        SeverityP0: {
            Subject: "[P0 EMERGENCY] Active Bridge Exploit Detected",
            Body: `ACTIVE SECURITY INCIDENT

Severity: P0 - Emergency
Time: {{.Timestamp}}
Status: {{.Status}}

Summary: {{.Summary}}

Immediate Actions Required:
1. Bridge operations have been automatically paused
2. Security team to assess and confirm exploit
3. Prepare for potential key rotation

Affected Assets:
{{.AffectedAssets}}

Current Response:
{{.ResponseStatus}}

Next Update: Within 15 minutes
`,
        },
        SeverityP1: {
            Subject: "[P1 CRITICAL] Bridge Service Disruption",
            Body: `CRITICAL INCIDENT

Severity: P1 - Critical
Time: {{.Timestamp}}
Impact: {{.Impact}}

Summary: {{.Summary}}

User Impact:
{{.UserImpact}}

Response Status:
{{.ResponseStatus}}

Next Update: Within 30 minutes
`,
        },
    },
}

// IncidentCommunicator handles incident notifications
type IncidentCommunicator struct {
    protocol    *CommunicationProtocol
    clients     map[ChannelType]ChannelClient
    mu          sync.Mutex
}

type Incident struct {
    ID            IncidentID
    Severity      IncidentSeverity
    Summary       string
    Details       string
    AffectedAssets []AssetID
    DetectedAt    time.Time
    Status        IncidentStatus
    EscalationLevel int
    Updates       []IncidentUpdate
}

type IncidentStatus uint8

const (
    IncidentDetected     IncidentStatus = 0
    IncidentAcknowledged IncidentStatus = 1
    IncidentInvestigating IncidentStatus = 2
    IncidentMitigating   IncidentStatus = 3
    IncidentResolved     IncidentStatus = 4
    IncidentPostMortem   IncidentStatus = 5
)

func (ic *IncidentCommunicator) NotifyIncident(incident *Incident) error {
    ic.mu.Lock()
    defer ic.mu.Unlock()

    // Determine channels based on severity
    channels := ic.getChannelsForSeverity(incident.Severity)

    // Get template
    template := ic.protocol.Templates[incident.Severity]

    // Build message
    message, err := ic.buildMessage(template, incident)
    if err != nil {
        return fmt.Errorf("failed to build message: %w", err)
    }

    // Send to all appropriate channels
    for _, channel := range channels {
        client := ic.clients[channel.Type]
        if client == nil || !channel.Enabled {
            continue
        }

        if err := client.Send(message); err != nil {
            log.Error("Failed to send notification",
                "channel", channel.Type,
                "error", err)
        }
    }

    return nil
}

func (ic *IncidentCommunicator) Escalate(incident *Incident) error {
    incident.EscalationLevel++

    if incident.EscalationLevel >= len(ic.protocol.EscalationPath) {
        return ErrMaxEscalationReached
    }

    level := ic.protocol.EscalationPath[incident.EscalationLevel]

    log.Warn("Escalating incident",
        "id", incident.ID,
        "level", level.Name,
        "authority", level.Authority)

    // Notify escalation contacts
    return ic.notifyEscalation(incident, level)
}
```

#### 3.5 Incident Response Playbook

The following playbook defines step-by-step procedures for security incidents:

**Playbook P0: Active Exploit Detected**

| Step | Action | Owner | Time Limit | Success Criteria |
|------|--------|-------|------------|------------------|
| 1 | Trigger global pause | On-Call Guardian | 0-2 min | All bridge operations halted |
| 2 | Page security team | Automated | 0-1 min | Security lead acknowledged |
| 3 | Confirm exploit activity | Security Lead | 5 min | Attack vector identified |
| 4 | Assess affected assets | Security Team | 10 min | Asset impact quantified |
| 5 | Initiate emergency key rotation if keys compromised | Security Lead | 15 min | Rotation request submitted |
| 6 | Block attacker addresses (if identified) | Engineering | 30 min | Addresses blacklisted |
| 7 | Notify stakeholders | Communications | 30 min | Initial advisory published |
| 8 | Begin forensic analysis | Security Team | 1 hour | Evidence preserved |
| 9 | Prepare recovery plan | CTO | 4 hours | Plan documented and approved |
| 10 | Execute recovery | Engineering | 24 hours | Funds secured |

**Playbook P1: Service Disruption**

| Step | Action | Owner | Time Limit | Success Criteria |
|------|--------|-------|------------|------------------|
| 1 | Acknowledge alert | On-Call Engineer | 5 min | Incident ticket created |
| 2 | Assess impact scope | On-Call Engineer | 15 min | Affected components identified |
| 3 | Implement mitigation | Engineering | 30 min | Service degradation contained |
| 4 | Escalate if unresolved | On-Call Engineer | 45 min | Next level engaged |
| 5 | User communication | Communications | 1 hour | Status page updated |
| 6 | Root cause analysis | Engineering | 4 hours | RCA documented |
| 7 | Permanent fix deployed | Engineering | 24 hours | Issue resolved |

**Playbook P2: Anomaly Detected**

| Step | Action | Owner | Time Limit | Success Criteria |
|------|--------|-------|------------|------------------|
| 1 | Review alert details | On-Call Engineer | 15 min | Alert triaged |
| 2 | Determine if genuine threat | Security Team | 30 min | Classification complete |
| 3 | If threat: escalate to P0/P1 | Security Lead | 35 min | Escalation initiated |
| 4 | If false positive: tune detector | Engineering | 4 hours | Detection rules updated |
| 5 | Document findings | Security Team | 8 hours | Knowledge base updated |

**Key Rotation Emergency Protocol**

When signer compromise is suspected or confirmed, execute this protocol:

```
Step 1: IMMEDIATE (0-5 minutes)
  - Guardian activates global pause via EmergencyPause(PauseGlobal, "", "Signer compromise suspected", guardian)
  - Log: "EMERGENCY: Key rotation initiated - [KeyID]"

Step 2: ASSESSMENT (5-15 minutes)
  - Identify compromised signer(s) by:
    a. Reviewing signing logs for unauthorized requests
    b. Checking signer node connectivity and health
    c. Analyzing recent transactions for anomalies
  - Document evidence for each suspected signer

Step 3: ROTATION INITIATION (15-30 minutes)
  - Call InitiateEmergencyRotation with:
    - KeyID: affected key identifier
    - Reason: ReasonCompromiseConfirmed or ReasonCompromiseSuspected
    - ExcludedSigners: list of compromised NodeIDs
    - Priority: PriorityEmergency
  - Verify reshare protocol begins on T-Chain

Step 4: RESHARE MONITORING (30-60 minutes)
  - Monitor T-Chain for ReshareRound events
  - Verify each non-excluded signer participates
  - Confirm new key generation completes

Step 5: KEY ACTIVATION (60-90 minutes)
  - Activate new generation via KeyRotateTx
  - Update all connected smart contracts with new MPC address
  - Verify signature generation with new key

Step 6: RECOVERY VERIFICATION (90-120 minutes)
  - Run full RecoveryVerification checklist
  - Confirm all nodes healthy with new key
  - Test signature generation end-to-end

Step 7: SERVICE RESTORATION (2-4 hours)
  - Gradually unpause operations:
    a. First: low-value deposits (<$1000)
    b. Second: all deposits
    c. Third: small withdrawals
    d. Finally: all operations
  - Monitor closely for 24 hours post-restoration
```

**Communication Protocol for Security Incidents**

```
PHASE 1: INTERNAL NOTIFICATION (0-5 minutes)
  Channel: PagerDuty + Slack #security-incidents
  Audience: Security Team, On-Call Engineers
  Content: Alert details, initial assessment, actions taken

PHASE 2: LEADERSHIP NOTIFICATION (5-15 minutes)
  Channel: Email + Phone (for P0/P1)
  Audience: CTO, CEO (P0 only)
  Content: Severity, impact assessment, response status

PHASE 3: STAKEHOLDER NOTIFICATION (15-60 minutes)
  Channel: Email
  Audience: Guardians, Major Integrators
  Content: Incident summary, service status, expected resolution

PHASE 4: PUBLIC COMMUNICATION (1-4 hours)
  Channel: Status Page, Twitter, Discord
  Audience: All users
  Content: Non-technical summary, user impact, timeline

PHASE 5: UPDATES (every 30-60 minutes during active incident)
  Channel: All active channels
  Content: Progress update, revised timeline, any new findings

PHASE 6: RESOLUTION (within 24 hours of resolution)
  Channel: Blog Post, Email
  Content: What happened, what we did, prevention measures

PHASE 7: POST-MORTEM (within 7 days)
  Channel: Public Blog, Internal Wiki
  Content: Full technical analysis, lessons learned, improvements
```

### 4. Monitoring and Alerting

#### 4.1 On-Chain Metrics

```go
// OnChainMetrics defines blockchain-level monitoring
type OnChainMetrics struct {
    // Volume metrics
    DepositVolume     map[AssetID]*big.Int
    WithdrawalVolume  map[AssetID]*big.Int
    SwapVolume        map[AssetID]*big.Int

    // Transaction metrics
    TransactionCount  map[AssetID]uint64
    FailureCount      map[AssetID]uint64
    AverageGasUsed    map[uint64]uint64    // Per chain

    // Vault metrics
    VaultBalances     map[AssetID]*big.Int
    PendingWithdrawals map[AssetID]uint64
    LockedValue       map[AssetID]*big.Int

    // Signature metrics
    SignatureRequests uint64
    SignatureSuccess  uint64
    SignatureFailure  uint64
    AverageLatency    time.Duration

    // Rate limit metrics
    RateLimitHits     map[string]uint64
    ThrottledRequests uint64
}

// OnChainMonitor tracks blockchain metrics
type OnChainMonitor struct {
    chains      map[uint64]*ChainClient
    metrics     *OnChainMetrics
    alerts      *AlertManager
    mu          sync.RWMutex
}

func (m *OnChainMonitor) CollectMetrics() error {
    m.mu.Lock()
    defer m.mu.Unlock()

    for chainID, client := range m.chains {
        // Collect vault balances
        vaults := m.getVaultsForChain(chainID)
        for _, vault := range vaults {
            balance, err := client.GetBalance(vault.Address)
            if err != nil {
                return fmt.Errorf("failed to get balance: %w", err)
            }
            m.metrics.VaultBalances[vault.AssetID] = balance
        }

        // Collect pending operations
        pending, err := client.GetPendingWithdrawals()
        if err != nil {
            return fmt.Errorf("failed to get pending: %w", err)
        }
        m.metrics.PendingWithdrawals[AssetID(chainID)] = pending

        // Collect recent transactions
        txs, err := client.GetRecentTransactions(100)
        if err != nil {
            return fmt.Errorf("failed to get transactions: %w", err)
        }
        m.processTransactions(chainID, txs)
    }

    return nil
}

// MetricThreshold defines alerting thresholds
type MetricThreshold struct {
    Metric     string
    Warning    float64
    Critical   float64
    Duration   time.Duration  // Sustained duration before alert
}

var DefaultMetricThresholds = []MetricThreshold{
    {"deposit_volume_1h", 10_000_000, 50_000_000, 5 * time.Minute},
    {"withdrawal_volume_1h", 10_000_000, 50_000_000, 5 * time.Minute},
    {"failure_rate", 0.05, 0.10, 1 * time.Minute},
    {"signature_latency_avg", 10.0, 30.0, 2 * time.Minute},
    {"vault_balance_change_1h", 0.10, 0.25, 0},  // 10%/25% change
    {"pending_withdrawal_count", 100, 500, 10 * time.Minute},
}
```

#### 4.2 Off-Chain Monitoring

```go
// OffChainMetrics defines infrastructure monitoring
type OffChainMetrics struct {
    // Node metrics
    NodeHealth        map[ids.NodeID]*NodeHealthMetrics
    NodeConnectivity  map[ids.NodeID]map[ids.NodeID]bool

    // Relayer metrics
    RelayerStatus     map[common.Address]*RelayerMetrics
    RelayerLatency    map[common.Address]time.Duration

    // RPC metrics
    RPCEndpoints      map[string]*RPCMetrics
    RPCLatency        map[string]time.Duration

    // Infrastructure metrics
    CPUUsage          map[string]float64
    MemoryUsage       map[string]float64
    DiskUsage         map[string]float64
    NetworkBandwidth  map[string]float64
}

type NodeHealthMetrics struct {
    NodeID          ids.NodeID
    IsHealthy       bool
    LastSeen        time.Time
    Version         string
    PeerCount       int
    SyncStatus      SyncStatus
    BlockHeight     uint64
    StakeWeight     uint64
}

type RelayerMetrics struct {
    Address         common.Address
    IsActive        bool
    LastSubmission  time.Time
    SuccessRate     float64
    TotalSubmissions uint64
    FailedSubmissions uint64
    AverageLatency  time.Duration
}

type RPCMetrics struct {
    Endpoint        string
    IsHealthy       bool
    LastCheck       time.Time
    SuccessRate     float64
    AverageLatency  time.Duration
    ErrorRate       float64
    RequestsPerMin  uint64
}

// OffChainMonitor tracks infrastructure health
type OffChainMonitor struct {
    nodes       map[ids.NodeID]*NodeConnection
    relayers    map[common.Address]*RelayerConnection
    rpcEndpoints map[string]*RPCClient
    metrics     *OffChainMetrics
    mu          sync.RWMutex
}

func (m *OffChainMonitor) HealthCheck() *HealthReport {
    m.mu.Lock()
    defer m.mu.Unlock()

    report := &HealthReport{
        Timestamp: time.Now(),
        Overall:   HealthHealthy,
    }

    // Check nodes
    healthyNodes := 0
    for nodeID, node := range m.nodes {
        metrics := m.checkNodeHealth(node)
        m.metrics.NodeHealth[nodeID] = metrics

        if metrics.IsHealthy {
            healthyNodes++
        }
    }

    // Require majority healthy
    if float64(healthyNodes)/float64(len(m.nodes)) < 0.67 {
        report.Overall = HealthDegraded
        report.Issues = append(report.Issues, "Node quorum below threshold")
    }

    // Check relayers
    activeRelayers := 0
    for addr, relayer := range m.relayers {
        metrics := m.checkRelayerHealth(relayer)
        m.metrics.RelayerStatus[addr] = metrics

        if metrics.IsActive {
            activeRelayers++
        }
    }

    if activeRelayers < 3 {
        report.Overall = HealthDegraded
        report.Issues = append(report.Issues, "Insufficient active relayers")
    }

    // Check RPC endpoints
    for endpoint, client := range m.rpcEndpoints {
        metrics := m.checkRPCHealth(client)
        m.metrics.RPCEndpoints[endpoint] = metrics

        if !metrics.IsHealthy {
            report.Issues = append(report.Issues,
                fmt.Sprintf("RPC endpoint unhealthy: %s", endpoint))
        }
    }

    return report
}
```

#### 4.3 Anomaly Detection

```go
// AnomalyDetector uses statistical methods to detect unusual patterns
type AnomalyDetector struct {
    // Historical baselines
    baselines map[string]*Baseline

    // Detection models
    models map[string]AnomalyModel

    // Alert configuration
    alertConfig *AnomalyAlertConfig
}

type Baseline struct {
    Metric     string
    Mean       float64
    StdDev     float64
    Min        float64
    Max        float64
    Samples    int64
    LastUpdate time.Time
}

type AnomalyModel interface {
    Train(data []float64) error
    Predict(value float64) (isAnomaly bool, score float64)
    Update(value float64) error
}

// ZScoreModel detects anomalies based on standard deviations
type ZScoreModel struct {
    mean      float64
    stdDev    float64
    threshold float64  // Number of standard deviations
    samples   []float64
    maxSamples int
}

func (m *ZScoreModel) Predict(value float64) (bool, float64) {
    if m.stdDev == 0 {
        return false, 0
    }

    zScore := (value - m.mean) / m.stdDev
    isAnomaly := math.Abs(zScore) > m.threshold

    return isAnomaly, zScore
}

// IsolationForestModel for complex anomaly detection
type IsolationForestModel struct {
    trees       []*IsolationTree
    numTrees    int
    sampleSize  int
    anomalyScore float64
}

// AnomalyAlertConfig configures anomaly-based alerts
type AnomalyAlertConfig struct {
    Metrics []AnomalyMetricConfig
}

type AnomalyMetricConfig struct {
    Name           string
    Model          string          // "zscore", "iforest", "ewma"
    Threshold      float64
    MinSamples     int
    AlertSeverity  IncidentSeverity
    AutoPause      bool
}

var DefaultAnomalyConfig = &AnomalyAlertConfig{
    Metrics: []AnomalyMetricConfig{
        {
            Name:          "deposit_volume",
            Model:         "zscore",
            Threshold:     3.0,
            MinSamples:    100,
            AlertSeverity: SeverityP2,
            AutoPause:     false,
        },
        {
            Name:          "unique_addresses",
            Model:         "zscore",
            Threshold:     4.0,
            MinSamples:    50,
            AlertSeverity: SeverityP3,
            AutoPause:     false,
        },
        {
            Name:          "transaction_pattern",
            Model:         "iforest",
            Threshold:     0.7,
            MinSamples:    1000,
            AlertSeverity: SeverityP1,
            AutoPause:     true,
        },
        {
            Name:          "signature_latency",
            Model:         "ewma",
            Threshold:     2.5,
            MinSamples:    20,
            AlertSeverity: SeverityP2,
            AutoPause:     false,
        },
    },
}

func (ad *AnomalyDetector) Detect(metric string, value float64) (*AnomalyResult, error) {
    model, ok := ad.models[metric]
    if !ok {
        return nil, ErrMetricNotConfigured
    }

    isAnomaly, score := model.Predict(value)

    if isAnomaly {
        config := ad.getConfig(metric)

        result := &AnomalyResult{
            Metric:    metric,
            Value:     value,
            Score:     score,
            IsAnomaly: true,
            Severity:  config.AlertSeverity,
            Timestamp: time.Now(),
        }

        // Auto-pause if configured
        if config.AutoPause {
            result.ActionTaken = "auto_pause"
        }

        return result, nil
    }

    // Update model with normal value
    model.Update(value)

    return nil, nil
}
```

### 5. Governance for Emergency Actions

#### 5.1 Threshold Definitions

```go
// EmergencyGovernanceConfig defines voting thresholds
type EmergencyGovernanceConfig struct {
    // Pause thresholds
    PauseThresholds  map[PauseLevel]*GovernanceThreshold

    // Recovery thresholds
    RecoveryThresholds map[RecoveryReason]*GovernanceThreshold

    // Parameter change thresholds
    ParameterThresholds map[ParameterType]*GovernanceThreshold

    // Timelock delays
    TimelockDelays map[ActionType]time.Duration
}

type GovernanceThreshold struct {
    QuorumPercent   uint8   // Minimum participation
    ApprovalPercent uint8   // Required approval of participants
    MinVoters       uint32  // Minimum number of voters
    VotingPeriod    time.Duration
    ExecutionDelay  time.Duration
}

type ActionType uint8

const (
    ActionPauseAssetType     ActionType = 0
    ActionPauseGlobalType    ActionType = 1
    ActionUnpauseType        ActionType = 2
    ActionKeyRotationType    ActionType = 3
    ActionFundRecoveryType   ActionType = 4
    ActionParameterChangeType ActionType = 5
    ActionUpgradeType        ActionType = 6
)

type ParameterType uint8

const (
    ParamRateLimit     ParameterType = 0
    ParamWithdrawDelay ParameterType = 1
    ParamFeeRate       ParameterType = 2
    ParamThreshold     ParameterType = 3
    ParamGuardian      ParameterType = 4
)

var DefaultEmergencyGovernance = EmergencyGovernanceConfig{
    PauseThresholds: map[PauseLevel]*GovernanceThreshold{
        // Single guardian can pause asset (fast response)
        PauseAsset: {
            QuorumPercent:   0,     // No quorum needed
            ApprovalPercent: 0,     // Single guardian
            MinVoters:       1,
            VotingPeriod:    0,     // Instant
            ExecutionDelay:  0,
        },
        // Single guardian can pause globally (emergency)
        PauseGlobal: {
            QuorumPercent:   0,
            ApprovalPercent: 0,
            MinVoters:       1,
            VotingPeriod:    0,
            ExecutionDelay:  0,
        },
    },
    RecoveryThresholds: map[RecoveryReason]*GovernanceThreshold{
        // Fund recovery requires high threshold
        ReasonExploitMitigation: {
            QuorumPercent:   51,
            ApprovalPercent: 67,    // 2/3 approval
            MinVoters:       5,
            VotingPeriod:    24 * time.Hour,
            ExecutionDelay:  48 * time.Hour,
        },
        ReasonStuckFunds: {
            QuorumPercent:   33,
            ApprovalPercent: 51,
            MinVoters:       3,
            VotingPeriod:    72 * time.Hour,
            ExecutionDelay:  24 * time.Hour,
        },
    },
    ParameterThresholds: map[ParameterType]*GovernanceThreshold{
        ParamRateLimit: {
            QuorumPercent:   33,
            ApprovalPercent: 51,
            MinVoters:       3,
            VotingPeriod:    48 * time.Hour,
            ExecutionDelay:  24 * time.Hour,
        },
        ParamThreshold: {
            QuorumPercent:   51,
            ApprovalPercent: 67,
            MinVoters:       5,
            VotingPeriod:    7 * 24 * time.Hour,
            ExecutionDelay:  48 * time.Hour,
        },
    },
    TimelockDelays: map[ActionType]time.Duration{
        ActionPauseAssetType:      0,
        ActionPauseGlobalType:     0,
        ActionUnpauseType:         1 * time.Hour,       // Delay to verify safety
        ActionKeyRotationType:     6 * time.Hour,       // Standard rotation
        ActionFundRecoveryType:    48 * time.Hour,      // High-value action
        ActionParameterChangeType: 24 * time.Hour,
        ActionUpgradeType:         7 * 24 * time.Hour,  // Contract upgrades
    },
}
```

#### 5.2 Governance Contracts Integration

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BridgeEmergencyGovernor
 * @notice Governance for emergency bridge actions
 */
contract BridgeEmergencyGovernor {
    // ============ State ============

    mapping(bytes32 => Proposal) public proposals;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;

    address[] public guardians;
    mapping(address => bool) public isGuardian;

    uint256 public constant GUARDIAN_THRESHOLD = 1;    // Single guardian for pause
    uint256 public constant RECOVERY_THRESHOLD = 67;   // 67% for recovery
    uint256 public constant UPGRADE_THRESHOLD = 80;    // 80% for upgrades

    // ============ Structs ============

    struct Proposal {
        bytes32 id;
        ProposalType proposalType;
        bytes data;
        uint256 createdAt;
        uint256 votingEnds;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool cancelled;
    }

    enum ProposalType {
        Pause,
        Unpause,
        KeyRotation,
        FundRecovery,
        ParameterChange,
        Upgrade
    }

    // ============ Events ============

    event ProposalCreated(bytes32 indexed id, ProposalType proposalType, address proposer);
    event VoteCast(bytes32 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(bytes32 indexed id);
    event EmergencyActionExecuted(ProposalType actionType, bytes data, address executor);

    // ============ Emergency Functions ============

    /**
     * @notice Emergency pause - single guardian can execute
     */
    function emergencyPause(address target, string calldata reason) external {
        require(isGuardian[msg.sender], "Not guardian");

        IBridgeVault(target).pause(reason);

        emit EmergencyActionExecuted(ProposalType.Pause, abi.encode(target, reason), msg.sender);
    }

    /**
     * @notice Emergency pause all connected vaults
     */
    function emergencyPauseAll(string calldata reason) external {
        require(isGuardian[msg.sender], "Not guardian");

        // Pause all registered vaults
        for (uint256 i = 0; i < registeredVaults.length; i++) {
            try IBridgeVault(registeredVaults[i]).pause(reason) {} catch {}
        }

        emit EmergencyActionExecuted(ProposalType.Pause, abi.encode(reason), msg.sender);
    }

    /**
     * @notice Propose fund recovery (requires voting)
     */
    function proposeFundRecovery(
        address vault,
        address token,
        uint256 amount,
        address recipient,
        string calldata evidence
    ) external returns (bytes32) {
        require(isGuardian[msg.sender], "Not guardian");

        bytes32 proposalId = keccak256(abi.encodePacked(
            block.timestamp,
            vault,
            token,
            amount,
            recipient
        ));

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposalType: ProposalType.FundRecovery,
            data: abi.encode(vault, token, amount, recipient, evidence),
            createdAt: block.timestamp,
            votingEnds: block.timestamp + 7 days,
            executionTime: block.timestamp + 9 days, // 2 day delay after voting
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(proposalId, ProposalType.FundRecovery, msg.sender);

        return proposalId;
    }

    /**
     * @notice Vote on proposal
     */
    function vote(bytes32 proposalId, bool support) external {
        require(isGuardian[msg.sender], "Not guardian");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.votingEnds, "Voting ended");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    /**
     * @notice Execute approved proposal
     */
    function execute(bytes32 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Cancelled");
        require(block.timestamp >= proposal.executionTime, "Timelock not expired");

        // Check threshold based on proposal type
        uint256 threshold = _getThreshold(proposal.proposalType);
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        require(totalVotes > 0, "No votes");

        uint256 approvalPercent = (proposal.forVotes * 100) / totalVotes;
        require(approvalPercent >= threshold, "Threshold not met");

        proposal.executed = true;

        // Execute based on type
        _executeProposal(proposal);

        emit ProposalExecuted(proposalId);
    }

    function _getThreshold(ProposalType pType) internal pure returns (uint256) {
        if (pType == ProposalType.Pause || pType == ProposalType.Unpause) {
            return GUARDIAN_THRESHOLD;
        } else if (pType == ProposalType.FundRecovery || pType == ProposalType.KeyRotation) {
            return RECOVERY_THRESHOLD;
        } else {
            return UPGRADE_THRESHOLD;
        }
    }

    function _executeProposal(Proposal storage proposal) internal {
        if (proposal.proposalType == ProposalType.FundRecovery) {
            (address vault, address token, uint256 amount, address recipient, ) =
                abi.decode(proposal.data, (address, address, uint256, address, string));

            IBridgeVault(vault).emergencyWithdraw(token, amount, recipient);
        }
        // Handle other proposal types...
    }
}
```

### 6. Post-Incident Procedures

#### 6.1 Post-Mortem Process

```go
// PostMortemProcess defines the incident review procedure
type PostMortemProcess struct {
    Incident       *Incident
    Timeline       []TimelineEvent
    RootCause      *RootCauseAnalysis
    Impact         *ImpactAssessment
    Remediation    *RemediationPlan
    LessonsLearned []string
    Status         PostMortemStatus
    Authors        []common.Address
    Reviewers      []common.Address
    PublishedAt    time.Time
}

type TimelineEvent struct {
    Timestamp   time.Time
    Event       string
    Actor       string
    Impact      string
    Evidence    []string
}

type RootCauseAnalysis struct {
    PrimaryCause    string
    ContributingFactors []string
    FailurePoints   []FailurePoint
    AttackVector    string          // If applicable
}

type FailurePoint struct {
    System      string
    Component   string
    Failure     string
    WhyItFailed string
}

type ImpactAssessment struct {
    FinancialLoss   *big.Int
    UsersAffected   uint64
    DowntimeMinutes uint64
    ReputationScore int  // -10 to 0
    DataExposed     bool
}

type RemediationPlan struct {
    ImmediateActions  []RemediationAction
    ShortTermActions  []RemediationAction  // < 1 week
    LongTermActions   []RemediationAction  // < 1 month
    PreventionMeasures []PreventionMeasure
}

type RemediationAction struct {
    Description string
    Owner       common.Address
    Deadline    time.Time
    Priority    ActionPriority
    Status      ActionStatus
    Completed   bool
}

type PreventionMeasure struct {
    Measure     string
    Effectiveness string
    Cost        string
    Timeline    string
}

type PostMortemStatus uint8

const (
    PMDraft      PostMortemStatus = 0
    PMInReview   PostMortemStatus = 1
    PMApproved   PostMortemStatus = 2
    PMPublished  PostMortemStatus = 3
)

// PostMortemTemplate provides structure for incident reports
var PostMortemTemplate = `
# Incident Post-Mortem: {{.Incident.Summary}}

**Incident ID:** {{.Incident.ID}}
**Severity:** {{.Incident.Severity}}
**Date:** {{.Incident.DetectedAt.Format "2006-01-02"}}
**Duration:** {{.Impact.DowntimeMinutes}} minutes
**Status:** {{.Status}}

## Executive Summary

{{.Incident.Summary}}

## Impact

- **Financial Loss:** ${{.Impact.FinancialLoss}}
- **Users Affected:** {{.Impact.UsersAffected}}
- **Downtime:** {{.Impact.DowntimeMinutes}} minutes

## Timeline

{{range .Timeline}}
- **{{.Timestamp.Format "15:04:05"}}** - {{.Event}}
  - Actor: {{.Actor}}
  - Impact: {{.Impact}}
{{end}}

## Root Cause Analysis

### Primary Cause
{{.RootCause.PrimaryCause}}

### Contributing Factors
{{range .RootCause.ContributingFactors}}
- {{.}}
{{end}}

### Failure Points
{{range .RootCause.FailurePoints}}
| System | Component | Failure | Why |
|--------|-----------|---------|-----|
| {{.System}} | {{.Component}} | {{.Failure}} | {{.WhyItFailed}} |
{{end}}

## Remediation

### Immediate Actions (Completed)
{{range .Remediation.ImmediateActions}}
- [{{if .Completed}}x{{else}} {{end}}] {{.Description}} - Owner: {{.Owner}}
{{end}}

### Short-Term Actions (< 1 Week)
{{range .Remediation.ShortTermActions}}
- [ ] {{.Description}} - Due: {{.Deadline.Format "2006-01-02"}}
{{end}}

### Long-Term Actions (< 1 Month)
{{range .Remediation.LongTermActions}}
- [ ] {{.Description}} - Due: {{.Deadline.Format "2006-01-02"}}
{{end}}

## Prevention Measures

{{range .Remediation.PreventionMeasures}}
### {{.Measure}}
- **Effectiveness:** {{.Effectiveness}}
- **Cost:** {{.Cost}}
- **Timeline:** {{.Timeline}}
{{end}}

## Lessons Learned

{{range .LessonsLearned}}
- {{.}}
{{end}}

---
*Document Version: 1.0*
*Last Updated: {{.PublishedAt.Format "2006-01-02 15:04"}}*
*Authors: {{range .Authors}}{{.}}, {{end}}*
`
```

#### 6.2 Recovery Verification

```go
// RecoveryVerification ensures system is safe to resume
type RecoveryVerification struct {
    Checks          []VerificationCheck
    AllPassed       bool
    LastVerified    time.Time
    VerifiedBy      common.Address
}

type VerificationCheck struct {
    Name        string
    Description string
    Category    CheckCategory
    Automated   bool
    Passed      bool
    Evidence    string
    VerifiedAt  time.Time
}

type CheckCategory uint8

const (
    CategorySecurity    CheckCategory = 0
    CategoryOperational CheckCategory = 1
    CategoryFinancial   CheckCategory = 2
    CategoryCompliance  CheckCategory = 3
)

var RecoveryChecklist = []VerificationCheck{
    // Security checks
    {
        Name:        "Key integrity verified",
        Description: "All signing keys confirmed secure or rotated",
        Category:    CategorySecurity,
        Automated:   false,
    },
    {
        Name:        "Vulnerability patched",
        Description: "Root cause vulnerability fixed and deployed",
        Category:    CategorySecurity,
        Automated:   false,
    },
    {
        Name:        "Audit complete",
        Description: "Emergency audit of fixes completed",
        Category:    CategorySecurity,
        Automated:   false,
    },
    {
        Name:        "No active threats",
        Description: "Monitoring confirms no ongoing attack",
        Category:    CategorySecurity,
        Automated:   true,
    },
    // Operational checks
    {
        Name:        "All nodes healthy",
        Description: "Signer nodes passing health checks",
        Category:    CategoryOperational,
        Automated:   true,
    },
    {
        Name:        "Relayers operational",
        Description: "All relayers synced and submitting",
        Category:    CategoryOperational,
        Automated:   true,
    },
    {
        Name:        "RPC endpoints healthy",
        Description: "External chain RPCs responding",
        Category:    CategoryOperational,
        Automated:   true,
    },
    {
        Name:        "Signature generation tested",
        Description: "Test signature successfully generated",
        Category:    CategoryOperational,
        Automated:   true,
    },
    // Financial checks
    {
        Name:        "Vault balances reconciled",
        Description: "All vault balances match expected",
        Category:    CategoryFinancial,
        Automated:   true,
    },
    {
        Name:        "Pending operations reviewed",
        Description: "All pending withdrawals verified",
        Category:    CategoryFinancial,
        Automated:   false,
    },
    {
        Name:        "Insurance fund adequate",
        Description: "Insurance fund above minimum",
        Category:    CategoryFinancial,
        Automated:   true,
    },
    // Compliance checks
    {
        Name:        "Incident reported",
        Description: "Regulatory notifications sent if required",
        Category:    CategoryCompliance,
        Automated:   false,
    },
    {
        Name:        "User communication sent",
        Description: "Users notified of incident and resolution",
        Category:    CategoryCompliance,
        Automated:   false,
    },
}

// RecoveryVerifier runs recovery verification
type RecoveryVerifier struct {
    checks      []VerificationCheck
    monitors    *MonitoringSystem
    governance  *GovernanceClient
}

func (rv *RecoveryVerifier) RunVerification() (*RecoveryVerification, error) {
    verification := &RecoveryVerification{
        Checks:       make([]VerificationCheck, len(rv.checks)),
        LastVerified: time.Now(),
    }

    allPassed := true

    for i, check := range rv.checks {
        result := check
        result.VerifiedAt = time.Now()

        if check.Automated {
            passed, evidence := rv.runAutomatedCheck(check.Name)
            result.Passed = passed
            result.Evidence = evidence
        }

        if !result.Passed {
            allPassed = false
        }

        verification.Checks[i] = result
    }

    verification.AllPassed = allPassed

    return verification, nil
}

func (rv *RecoveryVerifier) runAutomatedCheck(name string) (bool, string) {
    switch name {
    case "No active threats":
        // Check monitoring for anomalies
        anomalies := rv.monitors.GetActiveAnomalies()
        if len(anomalies) == 0 {
            return true, "No anomalies detected"
        }
        return false, fmt.Sprintf("%d active anomalies", len(anomalies))

    case "All nodes healthy":
        health := rv.monitors.GetNodeHealth()
        unhealthy := 0
        for _, h := range health {
            if !h.IsHealthy {
                unhealthy++
            }
        }
        if unhealthy == 0 {
            return true, "All nodes healthy"
        }
        return false, fmt.Sprintf("%d unhealthy nodes", unhealthy)

    case "Vault balances reconciled":
        discrepancies := rv.monitors.CheckVaultBalances()
        if len(discrepancies) == 0 {
            return true, "All balances match"
        }
        return false, fmt.Sprintf("%d balance discrepancies", len(discrepancies))

    default:
        return false, "Manual verification required"
    }
}
```

### 7. Integration with Related LPs

#### 7.1 T-Chain Integration (LP-330)

```go
// TChainSecurityIntegration coordinates with T-Chain security features
type TChainSecurityIntegration struct {
    tchain        *TChainClient
    securityMgr   *SecurityManager
}

// Emergency key rotation via T-Chain
func (ti *TChainSecurityIntegration) EmergencyKeyRotation(
    keyID ids.ID,
    excludedSigners []ids.NodeID,
    reason string,
) error {
    // Use LP-330 KeyRotateTx for emergency rotation
    rotateTx := &KeyRotateTx{
        OldKeyID:        keyID,
        NewKeyID:        NewKeyID(keyID, time.Now()),
        NewThreshold:    ti.calculateEmergencyThreshold(keyID, excludedSigners),
        NewTotalParties: ti.getAvailableSignerCount(keyID, excludedSigners),
        NewPartyIDs:     ti.getAvailableSigners(keyID, excludedSigners),
        Reason:          reason,
        EmergencyProof:  ti.generateEmergencyProof(),
    }

    return ti.tchain.SubmitKeyRotation(rotateTx)
}

// Request signature with security validation
func (ti *TChainSecurityIntegration) SecureSignatureRequest(
    keyID ids.ID,
    messageHash [32]byte,
    operation OperationType,
) (*SignatureResponse, error) {
    // Validate operation against security policies
    if err := ti.securityMgr.ValidateSignatureRequest(operation); err != nil {
        return nil, fmt.Errorf("security validation failed: %w", err)
    }

    // Use LP-330 SignRequestTx
    signReq := &SignRequestTx{
        RequestID:     NewRequestID(),
        KeyID:         keyID,
        MessageHash:   messageHash,
        MessageType:   RAW_HASH,
        Deadline:      ti.calculateDeadline(operation),
        CallbackChain: BChainID,
    }

    return ti.tchain.RequestSignature(signReq)
}
```

#### 7.2 B-Chain Integration (LP-331)

```go
// BChainSecurityIntegration coordinates with B-Chain security features
type BChainSecurityIntegration struct {
    bchain        *BChainClient
    securityMgr   *SecurityManager
    pauseMgr      *PauseManager
}

// Integrate with B-Chain fraud proof system
func (bi *BChainSecurityIntegration) SubmitSecurityFraudProof(
    operationID ids.ID,
    proofType FraudProofType,
    evidence []byte,
) error {
    // Use LP-331 FraudProof system
    proof := &FraudProof{
        ProofType:   proofType,
        OperationID: operationID,
        Evidence:    evidence,
        Submitter:   bi.securityMgr.GetAuthorizedSubmitter(),
    }

    // Submit and trigger appropriate response
    if err := bi.bchain.SubmitFraudProof(proof); err != nil {
        return err
    }

    // Auto-pause if critical
    if proofType == FraudInvalidSignature || proofType == FraudUnauthorizedMint {
        return bi.pauseMgr.EmergencyPause(
            PauseGlobal,
            "",
            fmt.Sprintf("Fraud detected: %s", proofType),
            bi.securityMgr.GetGuardianAddress(),
        )
    }

    return nil
}

// Integrate with B-Chain challenge period
func (bi *BChainSecurityIntegration) ChallengeWithdrawal(
    withdrawID WithdrawID,
    reason string,
) error {
    // Get withdrawal details
    withdrawal, err := bi.bchain.GetWithdrawal(withdrawID)
    if err != nil {
        return err
    }

    // Validate challenge is within window
    if time.Now().After(withdrawal.RequestedAt.Add(DefaultWithdrawalDelays.ChallengePeriod)) {
        return ErrChallengeWindowClosed
    }

    // Submit challenge via LP-331
    return bi.bchain.ChallengeWithdrawal(withdrawID, reason)
}
```

#### 7.3 Dynamic Signer Rotation Integration (LP-333)

```go
// SignerRotationSecurityIntegration coordinates with LP-333 resharing
type SignerRotationSecurityIntegration struct {
    rotationMgr   *EmergencyKeyRotation
    securityMgr   *SecurityManager
}

// Trigger emergency reshare when compromise detected
func (si *SignerRotationSecurityIntegration) HandleCompromiseDetection(
    compromisedSigners []ids.NodeID,
    keyID ids.ID,
) error {
    // Validate compromise evidence
    for _, signer := range compromisedSigners {
        if !si.securityMgr.ValidateCompromiseEvidence(signer) {
            return fmt.Errorf("insufficient evidence for signer %s", signer)
        }
    }

    // Use LP-333 ReshareInitTx with emergency trigger
    reshareReq := &ReshareInitTx{
        KeyID:          keyID,
        FromGeneration: si.getCurrentGeneration(keyID),
        ToGeneration:   si.getCurrentGeneration(keyID) + 1,
        NewParties:     si.calculateNewParties(keyID, compromisedSigners),
        NewThreshold:   si.calculateNewThreshold(keyID, compromisedSigners),
        TriggerType:    TriggerEmergency,
    }

    return si.rotationMgr.InitiateEmergencyRotation(&KeyRotationRequest{
        KeyID:           keyID,
        Reason:          ReasonCompromiseConfirmed,
        ExcludedSigners: compromisedSigners,
        Priority:        PriorityEmergency,
    })
}
```

#### 7.4 Smart Contract Integration (LP-335)

```go
// ContractSecurityIntegration coordinates with LP-335 contracts
type ContractSecurityIntegration struct {
    vaults        map[uint64]*BridgeVault
    governor      *BridgeEmergencyGovernor
    emergencyBrake *EmergencyBrake
}

// Execute multi-chain pause
func (ci *ContractSecurityIntegration) MultiChainPause(
    reason string,
    guardian common.Address,
) error {
    // Pause EmergencyBrake (affects all chains)
    if err := ci.emergencyBrake.ActivateGlobalPause(reason); err != nil {
        return fmt.Errorf("failed to activate global pause: %w", err)
    }

    // Pause each vault directly as backup
    for chainID, vault := range ci.vaults {
        if err := vault.Pause(reason); err != nil {
            log.Error("Failed to pause vault",
                "chain", chainID,
                "error", err)
            // Continue with other vaults
        }
    }

    return nil
}

// Coordinate signer update across all contracts
func (ci *ContractSecurityIntegration) UpdateMPCSignerAllChains(
    newSigner common.Address,
) error {
    // Initiate timelocked update on all vaults
    for chainID, vault := range ci.vaults {
        if err := vault.InitiateSignerUpdate(newSigner); err != nil {
            return fmt.Errorf("failed on chain %d: %w", chainID, err)
        }
    }

    return nil
}
```

## Rationale

### Design Decisions

1. **Defense-in-Depth**: Multiple independent security layers ensure no single point of failure. Rate limiting, delays, circuit breakers, and insurance each provide distinct protection.

2. **Tiered Response**: Different threat levels trigger proportional responses. Minor anomalies generate alerts; confirmed exploits trigger immediate pause.

3. **Guardian Model**: Single guardians can pause (fast response) but cannot unpause alone (prevents accidental/malicious restoration).

4. **Automatic Recovery**: Some circuit breakers auto-reset after timeouts to prevent indefinite service disruption from false positives.

5. **On-Chain Governance**: Critical actions like fund recovery require transparent on-chain voting with timelocks.

### Trade-off: Security vs Usability

**Chosen Trade-off**: Prioritize security over transaction speed.

Large withdrawals incur delays (up to 24 hours) to allow fraud detection. This reduces user experience for legitimate high-value transfers but significantly reduces exploit risk.

**Mitigation**: Fast-exit option available for smaller amounts with fee premium.

## Backwards Compatibility

This LP introduces new security infrastructure without breaking existing bridge operations:

1. **Existing Contracts**: LP-335 contracts already include pause functions; this LP defines when to use them
2. **Existing Keys**: Current T-Chain keys continue operating; emergency procedures only activate when needed
3. **Existing Operations**: In-flight transactions complete normally unless emergency pause activated

## Test Cases

### Unit Tests

```go
func TestRateLimiterEnforcement(t *testing.T) {
    limiter := NewRateLimiter(DefaultRateLimits)

    // Normal transaction should pass
    err := limiter.CheckLimit(AssetUSDC, user1, big.NewInt(1000*1e6))
    require.NoError(t, err)

    // Exceeding per-transaction limit should fail
    err = limiter.CheckLimit(AssetUSDC, user1, big.NewInt(2_000_000*1e6))
    require.ErrorIs(t, err, ErrExceedsTransactionLimit)
}

func TestCircuitBreakerTrip(t *testing.T) {
    breaker := NewCircuitBreaker(DefaultCircuitBreakers)

    // Simulate high volume
    for i := 0; i < 100; i++ {
        breaker.RecordVolume(AssetUSDC, big.NewInt(1_000_000*1e6))
    }

    // Should trip
    breaker.Check()
    assert.True(t, breaker.state.GlobalPaused)
}

func TestEmergencyPause(t *testing.T) {
    pauseMgr := NewPauseManager(guardians)

    // Guardian can pause
    err := pauseMgr.EmergencyPause(PauseGlobal, "", "Test", guardian1)
    require.NoError(t, err)

    // Operations should be blocked
    assert.False(t, pauseMgr.IsOperationAllowed(OpDeposit, AssetUSDC, 1))

    // Non-guardian cannot unpause
    err = pauseMgr.Unpause(PauseGlobal, "", nonGuardian)
    require.Error(t, err)
}

func TestWithdrawalDelay(t *testing.T) {
    wm := NewWithdrawalManager(DefaultWithdrawalDelays)

    // Small withdrawal - instant
    w1, _ := wm.CreateWithdrawal(user, AssetUSDC, big.NewInt(1000), dest, 1)
    assert.Equal(t, w1.UnlocksAt, w1.RequestedAt)

    // Large withdrawal - delayed
    w2, _ := wm.CreateWithdrawal(user, AssetUSDC, big.NewInt(5_000_000), dest, 1)
    assert.True(t, w2.UnlocksAt.After(w2.RequestedAt.Add(5*time.Hour)))
}

func TestInsuranceClaim(t *testing.T) {
    fund := NewInsuranceFund(DefaultInsuranceConfig)
    fund.balance = big.NewInt(50_000_000)

    // Submit claim
    claim, err := fund.SubmitClaim(
        claimant,
        CoverageSmartContractBug,
        big.NewInt(10_000_000),
        "Contract exploit evidence",
    )
    require.NoError(t, err)

    // Vote to approve
    fund.Vote(claim.ID, guardian1, true)
    fund.Vote(claim.ID, guardian2, true)
    fund.Vote(claim.ID, guardian3, true)

    // Execute claim
    err = fund.ExecuteClaim(claim.ID)
    require.NoError(t, err)

    // Balance should decrease
    expected := big.NewInt(40_000_000) // 50M - (10M - deductible)
    assert.True(t, fund.balance.Cmp(expected) < 0)
}
```

### Integration Tests

```go
func TestFullIncidentResponse(t *testing.T) {
    system := NewSecuritySystem(config)

    // 1. Anomaly detected
    anomaly := system.detector.Detect("deposit_volume", 100_000_000)
    require.NotNil(t, anomaly)

    // 2. Auto-pause triggered
    assert.True(t, system.pauseMgr.state.GlobalPaused)

    // 3. Incident created
    incident := system.incidentMgr.GetActiveIncident()
    require.NotNil(t, incident)

    // 4. Notifications sent
    assert.True(t, system.communicator.NotificationsSent(incident.ID))

    // 5. Investigation completes
    system.incidentMgr.UpdateStatus(incident.ID, IncidentMitigating)

    // 6. Recovery verification
    verification := system.verifier.RunVerification()
    assert.True(t, verification.AllPassed)

    // 7. Unpause
    err := system.pauseMgr.Unpause(PauseGlobal, "", admin)
    require.NoError(t, err)
}
```

## Reference Implementation

### Package Dependencies

All implementations MUST use luxfi packages exclusively:

```go
import (
    "github.com/luxfi/ids"
    "github.com/luxfi/geth/common"
    "github.com/luxfi/geth/crypto"
    "github.com/luxfi/node/vms/platformvm/txs"
    "github.com/luxfi/bridge/security/pause"
    "github.com/luxfi/bridge/security/ratelimit"
    "github.com/luxfi/bridge/security/circuitbreaker"
)

// Note: Do NOT use go-ethereum or ava-labs packages.
// The Lux ecosystem maintains its own forks with necessary modifications.
```

### RPC Configuration

All Lux RPC endpoints MUST use port 9630 (NOT 9650):

```go
const (
    // Lux RPC endpoints
    LuxRPCPort     = 9630
    LuxStakingPort = 9631

    // Example endpoint configuration
    LuxMainnetRPC = "http://localhost:9630/ext/bc/C/rpc"
    LuxTestnetRPC = "http://localhost:9630/ext/bc/C/rpc"
)
```

### Repository Structure

```
github.com/luxfi/bridge/security/
├── ratelimit/
│   ├── limiter.go           # Rate limiting implementation
│   └── config.go            # Rate limit configuration
├── circuitbreaker/
│   ├── breaker.go           # Circuit breaker logic
│   └── triggers.go          # Trigger definitions
├── insurance/
│   ├── fund.go              # Insurance fund management
│   └── claims.go            # Claims processing
├── pause/
│   ├── manager.go           # Pause manager
│   └── governance.go        # Pause governance
├── recovery/
│   ├── procedures.go        # Recovery procedures
│   └── verification.go      # Recovery verification
├── monitoring/
│   ├── onchain.go           # On-chain metrics
│   ├── offchain.go          # Off-chain monitoring
│   └── anomaly.go           # Anomaly detection
├── communication/
│   ├── protocol.go          # Communication protocol
│   └── channels.go          # Channel implementations
└── postmortem/
    ├── template.go          # Post-mortem templates
    └── process.go           # Post-mortem process
```

### Build and Test

```bash
# Build security module
cd bridge
go build ./security/...

# Run tests
go test ./security/... -v

# Run integration tests
go test -tags=integration ./security/... -v

# Benchmarks
go test ./security/ratelimit -bench=. -benchmem
```

## Security Considerations

### Audit Requirements

All code changes to security-critical components MUST undergo audit before deployment:

**Mandatory Audit Triggers:**

| Change Type | Audit Level | Minimum Duration | Required Auditors |
|-------------|-------------|------------------|-------------------|
| New smart contract | Full External | 4-8 weeks | 2 independent firms |
| Contract upgrade (proxy) | Full External | 2-4 weeks | 1 external firm |
| Threshold/key management changes | External Review | 2 weeks | 1 external firm |
| Rate limit parameter changes | Internal Review | 1 week | Security team |
| Circuit breaker adjustments | Internal Review | 3 days | Security team |
| UI/frontend changes | Internal Review | 1 week | Security team |
| New chain integration | Full External | 4-6 weeks | 1 external firm |

**Pre-Deployment Checklist:**

1. [ ] Code review by 2+ senior engineers completed
2. [ ] All unit tests passing (100% coverage for security paths)
3. [ ] Integration tests passing on testnet
4. [ ] External audit report received (if required)
5. [ ] All critical/high findings resolved
6. [ ] Medium findings have documented remediation plan
7. [ ] Formal verification of invariants (for smart contracts)
8. [ ] Penetration testing completed (for infrastructure changes)
9. [ ] Documentation updated
10. [ ] Runbook updated with new procedures

**Audit Scope Requirements:**

External audits MUST cover:
- All public and external functions
- Access control mechanisms
- Signature verification logic
- State transitions and invariants
- Economic attack vectors (MEV, flash loans)
- Integration points with other protocols
- Upgrade mechanisms and admin functions
- Emergency procedures and pause logic

**Approved Audit Firms:**

- Trail of Bits
- OpenZeppelin
- Consensys Diligence
- ChainSecurity
- Halborn
- Spearbit

### Bug Bounty Program

The Lux Bridge operates a bug bounty program to incentivize responsible disclosure:

**Scope:**

| Component | In Scope | Out of Scope |
|-----------|----------|--------------|
| Bridge smart contracts (all chains) | Yes | Third-party dependencies |
| T-Chain threshold VM | Yes | Lux consensus layer |
| B-Chain bridge VM | Yes | External chain bugs |
| Relayer network | Yes | Social engineering |
| Signer infrastructure | Yes (with restrictions) | Physical attacks |
| Frontend/API | Yes | DDoS attacks |
| Documentation | No | Typos/formatting |

**Severity and Rewards:**

| Severity | Description | Reward Range |
|----------|-------------|--------------|
| **Critical** | Direct fund loss, key compromise, bypass of all security controls | $100,000 - $500,000 |
| **High** | Significant fund risk, bypass of single security layer, DoS of signing | $25,000 - $100,000 |
| **Medium** | Limited fund risk, griefing attacks, information disclosure | $5,000 - $25,000 |
| **Low** | Minor issues, best practice violations, informational | $1,000 - $5,000 |

**Critical Severity Examples:**
- Unauthorized minting of wrapped assets
- Theft of funds from vault contracts
- Extraction of MPC key shares
- Bypass of signature verification

**High Severity Examples:**
- DoS of threshold signing (prevents all operations)
- Manipulation of withdrawal delays
- Unauthorized pause/unpause
- Oracle manipulation for incorrect pricing

**Medium Severity Examples:**
- Transaction ordering manipulation (front-running)
- Bypass of rate limits for single user
- Information leakage of pending operations
- Griefing attacks on challenge periods

**Submission Process:**

1. Report via security@lux.network or https://immunefi.com/bounty/luxbridge
2. Include:
   - Detailed description of vulnerability
   - Steps to reproduce
   - Proof of concept (non-destructive)
   - Suggested fix (optional)
3. Response within 24 hours for critical, 72 hours for others
4. Fix timeline: Critical (24-48h), High (1 week), Medium (2 weeks), Low (1 month)
5. Public disclosure after fix deployed + 30 days

**Safe Harbor:**

Researchers acting in good faith are protected:
- No legal action for authorized testing
- No account termination
- Credit in security advisory (optional)

**Exclusions:**
- Attacks requiring physical access
- Social engineering of team members
- DDoS or network flooding
- Spam or low-quality reports
- Issues already reported or known
- Theoretical issues without PoC

### Key Security Properties

1. **Single Guardian Pause**: Any guardian can halt operations immediately
2. **Multi-Party Recovery**: Fund recovery requires supermajority approval
3. **Timelock Protection**: All sensitive parameter changes delayed
4. **Automatic Response**: Circuit breakers activate without human intervention
5. **Fail-Safe Defaults**: System defaults to paused state on ambiguous conditions

### Known Limitations

1. **Coordination Risk**: Multi-chain pause requires independent transactions
2. **Oracle Dependency**: Anomaly detection relies on accurate external data
3. **Governance Delay**: Recovery voting takes 7+ days for full approval

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
