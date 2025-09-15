# LP-607: Validator Management and Staking Protocol

## Overview

LP-607 standardizes validator management, staking, and delegation across Lux, Zoo, and Hanzo chains. This ensures exactly one way to become a validator, stake tokens, delegate stake, and receive rewards across all chains.

## Motivation

Current validator management challenges:
- **Inconsistent Requirements**: Different staking minimums per chain
- **Complex Delegation**: No unified delegation mechanism
- **Reward Calculation**: Different reward formulas
- **Validator Rotation**: No standard rotation mechanism

Our solution provides:
- **Unified Staking**: Same staking mechanism across chains
- **Liquid Staking**: Stake while maintaining liquidity
- **Dynamic Rewards**: Performance-based rewards
- **Elastic Validation**: Adaptive validator sets

## Technical Specification

### Unified Validator Structure

```go
package validator

import (
    "github.com/luxfi/lux/crypto/bls"
    "github.com/luxfi/lux/ids"
)

// Validator - EXACTLY ONE validator structure for all chains
type Validator struct {
    // Identity
    NodeID       ids.NodeID     // Unique node identifier
    LuxID        string         // did:lux:chainId:address
    
    // Staking
    StakeAmount  uint64         // Amount staked
    StakeToken   TokenType      // LX, KEEPER, or HANZO
    StartTime    uint64         // When validation started
    EndTime      uint64         // When validation ends
    
    // Keys
    BLSPublicKey []byte         // For signature aggregation
    ProofOfPossession []byte    // BLS proof
    
    // Performance
    Uptime       float64        // Uptime percentage
    Performance  Performance    // Performance metrics
    
    // Delegation
    Delegators   []Delegator    // Who delegates to this validator
    Commission   uint32         // Commission rate (0-10000 = 0-100%)
}

// TokenType for staking
type TokenType uint8

const (
    TokenLX     TokenType = 0  // Lux native token
    TokenKEEPER TokenType = 1  // Zoo governance token
    TokenHANZO  TokenType = 2  // Hanzo compute token
)

// Performance metrics
type Performance struct {
    BlocksProduced    uint64
    BlocksMissed      uint64
    MessagesRelayed   uint64
    ComputeJobs       uint64
    ResponseTime      time.Duration
}

// ValidatorSet manages all validators
type ValidatorSet struct {
    validators    map[ids.NodeID]*Validator
    totalStake    uint64
    minStake      uint64
    maxValidators uint32
}

// Staking parameters - CANONICAL across all chains
var CanonicalStakingParams = StakingParams{
    MinStake:           2000 * 1e18,    // 2000 tokens minimum
    MaxStake:           3000000 * 1e18, // 3M tokens maximum
    MinDelegation:      25 * 1e18,      // 25 tokens minimum
    MinStakeDuration:   14 * 24 * time.Hour,  // 2 weeks minimum
    MaxStakeDuration:   365 * 24 * time.Hour, // 1 year maximum
    DelegationFee:      200,            // 2% base fee
    RewardRate:         8,              // 8% APR base
}
```

### Staking Contract

```solidity
// SINGLE staking contract deployed at SAME address on ALL chains
contract UnifiedStaking {
    using SafeMath for uint256;
    
    // Staking parameters (must match Go implementation)
    uint256 public constant MIN_STAKE = 2000 * 1e18;
    uint256 public constant MAX_STAKE = 3000000 * 1e18;
    uint256 public constant MIN_DELEGATION = 25 * 1e18;
    uint256 public constant MIN_STAKE_DURATION = 14 days;
    uint256 public constant MAX_STAKE_DURATION = 365 days;
    
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardDebt;
        bool isValidator;
    }
    
    struct ValidatorInfo {
        bytes blsPublicKey;
        bytes proofOfPossession;
        uint256 commission;  // 0-10000 (0-100%)
        uint256 totalDelegated;
        bool active;
    }
    
    // Staking state
    mapping(address => StakeInfo) public stakes;
    mapping(address => ValidatorInfo) public validators;
    mapping(address => address) public delegations;  // delegator => validator
    
    // Events
    event ValidatorAdded(
        address indexed validator,
        bytes blsPublicKey,
        uint256 amount,
        uint256 endTime
    );
    
    event Delegated(
        address indexed delegator,
        address indexed validator,
        uint256 amount
    );
    
    event RewardsClaimed(
        address indexed staker,
        uint256 amount
    );
    
    // Add validator with BLS key
    function addValidator(
        bytes calldata blsPublicKey,
        bytes calldata proofOfPossession,
        uint256 commission,
        uint256 duration
    ) external payable {
        require(msg.value >= MIN_STAKE, "Below minimum stake");
        require(msg.value <= MAX_STAKE, "Above maximum stake");
        require(duration >= MIN_STAKE_DURATION, "Duration too short");
        require(duration <= MAX_STAKE_DURATION, "Duration too long");
        require(commission <= 10000, "Commission too high");
        
        // Verify BLS proof of possession
        require(
            verifyProofOfPossession(blsPublicKey, proofOfPossession),
            "Invalid PoP"
        );
        
        validators[msg.sender] = ValidatorInfo({
            blsPublicKey: blsPublicKey,
            proofOfPossession: proofOfPossession,
            commission: commission,
            totalDelegated: 0,
            active: true
        });
        
        stakes[msg.sender] = StakeInfo({
            amount: msg.value,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            rewardDebt: 0,
            isValidator: true
        });
        
        emit ValidatorAdded(
            msg.sender,
            blsPublicKey,
            msg.value,
            block.timestamp + duration
        );
    }
    
    // Delegate stake to validator
    function delegate(address validator) external payable {
        require(msg.value >= MIN_DELEGATION, "Below minimum");
        require(validators[validator].active, "Invalid validator");
        
        // Update delegation
        if (delegations[msg.sender] != address(0)) {
            _undelegate(msg.sender);
        }
        
        delegations[msg.sender] = validator;
        validators[validator].totalDelegated += msg.value;
        
        stakes[msg.sender] = StakeInfo({
            amount: msg.value,
            startTime: block.timestamp,
            endTime: validators[validator].endTime,
            rewardDebt: 0,
            isValidator: false
        });
        
        emit Delegated(msg.sender, validator, msg.value);
    }
}
```

### Liquid Staking

```solidity
contract LiquidStaking {
    IERC20 public stakeToken;    // LX, KEEPER, or HANZO
    IERC20 public liquidToken;   // sLX, sKEEPER, or sHANZO
    
    uint256 public totalStaked;
    uint256 public totalShares;
    
    // Stake and receive liquid tokens
    function stake(uint256 amount) external {
        stakeToken.transferFrom(msg.sender, address(this), amount);
        
        uint256 shares;
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalStaked;
        }
        
        totalStaked += amount;
        totalShares += shares;
        
        // Mint liquid staking tokens
        liquidToken.mint(msg.sender, shares);
        
        // Delegate to validators
        _delegateToValidators(amount);
    }
    
    // Unstake by burning liquid tokens
    function unstake(uint256 shares) external {
        uint256 amount = (shares * totalStaked) / totalShares;
        
        liquidToken.burn(msg.sender, shares);
        
        totalStaked -= amount;
        totalShares -= shares;
        
        // Queue unstaking
        _queueUnstaking(msg.sender, amount);
    }
    
    function _delegateToValidators(uint256 amount) internal {
        // Distribute across top validators
        address[] memory topValidators = getTopValidators(10);
        uint256 perValidator = amount / topValidators.length;
        
        for (uint i = 0; i < topValidators.length; i++) {
            IStaking(STAKING_CONTRACT).delegate{value: perValidator}(
                topValidators[i]
            );
        }
    }
}
```

### Reward Distribution

```go
// RewardCalculator computes validator rewards
type RewardCalculator struct {
    config      RewardConfig
    validators  *ValidatorSet
    metrics     *PerformanceMetrics
}

// RewardConfig - CANONICAL reward parameters
type RewardConfig struct {
    BaseAPR           float64  // 8% base annual rate
    UptimeBonus       float64  // +2% for 99.9% uptime
    PerformanceBonus  float64  // +1% for top performers
    
    // Penalty parameters
    DowntimePenalty   float64  // -0.1% per hour downtime
    SlashingThreshold float64  // Slash at <80% uptime
}

// CalculateRewards for a validator
func (r *RewardCalculator) CalculateRewards(
    validator *Validator,
    period time.Duration,
) uint64 {
    stake := validator.StakeAmount
    
    // Base reward
    baseReward := float64(stake) * r.config.BaseAPR * 
                  period.Hours() / (365 * 24)
    
    // Uptime bonus/penalty
    uptimeMultiplier := 1.0
    if validator.Uptime >= 0.999 {
        uptimeMultiplier += r.config.UptimeBonus
    } else if validator.Uptime < 0.8 {
        // Slashing
        uptimeMultiplier = 0
    } else {
        downtime := (1.0 - validator.Uptime) * period.Hours()
        uptimeMultiplier -= downtime * r.config.DowntimePenalty
    }
    
    // Performance bonus
    perfMultiplier := 1.0
    if r.isTopPerformer(validator) {
        perfMultiplier += r.config.PerformanceBonus
    }
    
    totalReward := baseReward * uptimeMultiplier * perfMultiplier
    
    // Distribute to delegators
    validatorReward := r.distributeRewards(
        validator,
        uint64(totalReward),
    )
    
    return validatorReward
}

// distributeRewards between validator and delegators
func (r *RewardCalculator) distributeRewards(
    validator *Validator,
    totalReward uint64,
) uint64 {
    // Calculate commission
    commission := totalReward * uint64(validator.Commission) / 10000
    
    // Remaining for delegators
    delegatorRewards := totalReward - commission
    
    // Distribute proportionally
    for _, delegator := range validator.Delegators {
        share := delegator.Amount * delegatorRewards / 
                 validator.TotalDelegated()
        delegator.PendingRewards += share
    }
    
    return commission
}
```

### Validator Rotation

```go
// ElasticValidation manages dynamic validator sets
type ElasticValidation struct {
    minValidators uint32
    maxValidators uint32
    targetLoad    float64
}

// RotateValidators based on performance
func (e *ElasticValidation) RotateValidators(
    current *ValidatorSet,
    candidates []*Validator,
) *ValidatorSet {
    // Score all validators
    scores := make(map[ids.NodeID]float64)
    
    for _, v := range current.validators {
        scores[v.NodeID] = e.scoreValidator(v)
    }
    
    for _, c := range candidates {
        scores[c.NodeID] = e.scoreCandidate(c)
    }
    
    // Sort by score
    sorted := sortByScore(scores)
    
    // Determine optimal set size
    optimalSize := e.calculateOptimalSize()
    
    // Select top validators
    newSet := &ValidatorSet{
        validators: make(map[ids.NodeID]*Validator),
    }
    
    for i := 0; i < optimalSize && i < len(sorted); i++ {
        newSet.Add(sorted[i])
    }
    
    return newSet
}

// scoreValidator based on multiple factors
func (e *ElasticValidation) scoreValidator(v *Validator) float64 {
    score := 0.0
    
    // Stake weight (40%)
    score += 0.4 * normalizeStake(v.StakeAmount)
    
    // Uptime (30%)
    score += 0.3 * v.Uptime
    
    // Performance (20%)
    score += 0.2 * normalizePerformance(v.Performance)
    
    // Delegation (10%)
    score += 0.1 * normalizeDelegation(len(v.Delegators))
    
    return score
}
```

### Cross-Chain Validator Sync

```go
// CrossChainValidatorSync keeps validator sets synchronized
type CrossChainValidatorSync struct {
    chains   map[uint64]*Chain
    interval time.Duration
}

// SyncValidators across chains
func (s *CrossChainValidatorSync) SyncValidators() error {
    // Get validator sets from each chain
    luxValidators := s.chains[120].GetValidators()
    hanzoValidators := s.chains[121].GetValidators()
    zooValidators := s.chains[122].GetValidators()
    
    // Create unified view
    unified := s.mergeValidatorSets(
        luxValidators,
        hanzoValidators,
        zooValidators,
    )
    
    // Broadcast updates via Warp
    update := &ValidatorUpdate{
        Validators: unified,
        Timestamp:  time.Now().Unix(),
    }
    
    for chainID, chain := range s.chains {
        msg := &WarpMessage{
            DestinationChainID: chainID,
            Payload: encodeValidatorUpdate(update),
        }
        
        if err := chain.SendWarpMessage(msg); err != nil {
            return err
        }
    }
    
    return nil
}
```

## Security Considerations

1. **BLS Key Security**: Proof of possession required
2. **Slashing Conditions**: <80% uptime = stake slash
3. **Sybil Resistance**: Minimum stake requirements
4. **Time-lock**: Unstaking requires waiting period

## Migration Path

### Phase 1: Deploy Staking Contract
- Deploy unified contract on all chains
- Initialize with existing validators

### Phase 2: Migrate Validators
- Convert existing validators to new format
- Preserve stake amounts and delegations

### Phase 3: Enable Liquid Staking
- Deploy liquid staking tokens
- Enable stake/unstake functionality

### Phase 4: Cross-Chain Sync
- Enable validator set synchronization
- Implement rotation mechanism

## Performance Targets

- **Validator Updates**: <1 second propagation
- **Reward Calculation**: O(n) complexity
- **Rotation Frequency**: Every 6 hours
- **Maximum Validators**: 1000 per chain

## Testing

```go
func TestValidatorLifecycle(t *testing.T) {
    // Create validator
    validator := &Validator{
        NodeID: ids.GenerateTestNodeID(),
        StakeAmount: 2000 * 1e18,
        Commission: 500, // 5%
    }
    
    // Add to set
    set := NewValidatorSet()
    err := set.Add(validator)
    assert.NoError(t, err)
    
    // Simulate performance
    validator.Uptime = 0.999
    validator.Performance.BlocksProduced = 1000
    
    // Calculate rewards
    calc := NewRewardCalculator()
    rewards := calc.CalculateRewards(validator, 24*time.Hour)
    
    // Should earn ~0.022% daily (8% APR)
    expectedDaily := validator.StakeAmount * 0.08 / 365
    assert.InDelta(t, expectedDaily, rewards, expectedDaily*0.1)
}
```

## References

1. [Avalanche Staking](https://docs.avax.network/nodes/validate/staking)
2. [Ethereum PoS](https://ethereum.org/en/staking/)
3. [BLS Signatures](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature)
4. [Liquid Staking](https://blog.lido.fi/how-liquid-staking-works/)

---

**Status**: Draft  
**Category**: Consensus  
**Created**: 2025-01-09