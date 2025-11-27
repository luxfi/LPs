---
lp: 0226
title: Dynamic Minimum Block Times (Granite Upgrade)
description: Dynamic minimum block delay system enabling sub-second blocks and adaptive performance tuning
author: Lux Protocol Team (@luxdefi), Stephen Buttolph, Michael Kaplan
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-11-22
requires: 12, 176
---

# LP-226: Dynamic Minimum Block Times (Granite Upgrade)

| LP | 226 |
| :- | :- |
| **Title** | Dynamic Minimum Block Times for Lux Network |
| **Author(s)** | Lux Protocol Team (Based on ACP-226 by Stephen Buttolph, Michael Kaplan) |
| **Status** | Adopted (Granite Upgrade) |
| **Track** | Standards |
| **Based On** | [ACP-226](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/226-dynamic-minimum-block-times) |

## Abstract

LP-226 replaces the static block gas cost mechanism with a dynamic minimum block delay system that validators collectively control. This enables sub-second block times, improves network stability, and allows for adaptive performance tuning without network upgrades.

## Lux Network Context

The Lux Network's multi-chain architecture and focus on high-performance applications require flexible block timing:

1. **C-Chain (EVM)**: High-throughput DeFi and dApp execution
2. **A-Chain (AI VM)**: Rapid AI inference and model updates
3. **B-Chain (Bridge VM)**: Fast cross-chain message processing
4. **Z-Chain (ZK VM)**: Optimized proof verification timing

Dynamic block timing allows each chain to optimize for its specific workload without requiring network-wide upgrades.

## Motivation

### Current Limitations

**Static Block Gas Cost**:
- No explicit minimum block delay time
- Validators can produce blocks arbitrarily fast by paying fees
- Rapid block production can cause network instability
- Target block rate only changeable via network upgrade
- 1-second granularity insufficient for performance improvements

**Lux Network Requirements**:
- **Sub-second blocks**: Needed for competitive UX in DeFi and gaming
- **Per-chain optimization**: Different chains have different performance profiles
- **Dynamic adaptation**: Network conditions change, block timing should too
- **Validator consensus**: Block timing should reflect collective validator capability

### Benefits of Dynamic Block Timing

**Network Stability**:
- Explicit minimum ensures blocks never produced faster than network can handle
- Validators collectively determine safe block frequency
- Protects against consensus failures from excessive block production

**Performance Scaling**:
- Sub-second block times without network upgrade
- Gradual performance improvements as infrastructure improves
- Millisecond-granularity timestamps for precise timing

**Adaptive Optimization**:
- Validators adjust block timing based on observed network performance
- Automatic response to changing network conditions
- No coordination needed for minor adjustments

## Specification

### Block Header Changes

Upon activation, block headers add two new fields and deprecate `blockGasCost`:

#### `blockGasCost` (Deprecated)
- **Requirement**: Must be set to 0
- **No validation**: Priority fee requirements removed
- **Backward compat**: Field remains but is no longer enforced

#### `timestampMilliseconds` (New)
- **Type**: `uint64`
- **Purpose**: Unix timestamp in milliseconds  
- **Validation**: `timestampMilliseconds / 1000 == timestamp`
- **Rationale**: Preserves existing second-based timestamp for tooling compatibility

#### `minimumBlockDelay` (New)
- **Type**: `uint64`
- **Purpose**: Minimum milliseconds before next block
- **Validation**: Next block's effective timestamp ≥ current block timestamp + `minimumBlockDelay`

### Dynamic Block Delay Mechanism

The `minimumBlockDelay` is calculated using an exponential formula similar to ACP-176's dynamic gas target:

$$m = M \cdot e^{\frac{q}{D}}$$

Where:
- $M$ = Global minimum block delay (milliseconds) - configured at upgrade
- $q$ = Non-negative integer representing excess delay above minimum
- $D$ = Update rate constant (controls speed of change)

**Validator Preferences**:
Each validator can configure their desired $M_{desired}$, which is converted to a target $q$:

$$q_{desired} = D \cdot \ln\left(\frac{M_{desired}}{M}\right)$$

**Block-by-Block Updates**:
When building block $b$, the validator can change $q$ by at most $Q$:

```python
def calc_next_q(q_current: int, q_desired: int, max_change: int) -> int:
    if q_desired > q_current:
        return q_current + min(q_desired - q_current, max_change)
    else:
        return q_current - min(q_current - q_desired, max_change)
```

The change $|\Delta q| \leq Q$ or the block is invalid.

After executing transactions, $q$ is updated and thus $m = M \cdot e^{\frac{q}{D}}$ changes. This new $m$ applies to the **next** block, not the current one.

### Lux C-Chain Activation Parameters

| Parameter | Description | C-Chain Value |
| - | - | - |
| $M$ | Minimum `minimumBlockDelay` | 100 milliseconds |
| $q$ | Initial excess delay | 3,141,253 |
| $D$ | Update constant | $2^{20}$ (1,048,576) |
| $Q$ | Max change per block | 200 |

**Rationale**:
- $M = 100ms$: Allows 10x faster than current 2-second target, balances performance with stability
- $q = 3,141,253$: Results in initial ~2-second block time (matches current C-Chain target)
- $D, Q$: Chosen so ~3,600 consecutive blocks of max change doubles or halves block time

**Calculated Initial Block Time**:
$$m_0 = 100 \cdot e^{\frac{3,141,253}{1,048,576}} \approx 100 \cdot e^{2.996} \approx 100 \cdot 20 = 2000ms = 2s$$

### Example: Gradual Speed-Up

Suppose validators want 1-second blocks. They configure $M_{desired} = 1000ms$:

$$q_{desired} = 1,048,576 \cdot \ln\left(\frac{1000}{100}\right) = 1,048,576 \cdot \ln(10) \approx 2,414,216$$

Current $q = 3,141,253$, so $q_{desired} < q_{current}$.  

Each block reduces $q$ by $\min(Q, q_{current} - q_{desired}) = 200$.

**Blocks to reach 1s**:
$$\frac{3,141,253 - 2,414,216}{200} = \frac{727,037}{200} \approx 3,635 \text{ blocks}$$

At 2s/block initially, this takes ~2 hours of convergence.

### ProposerVM Integration

The ProposerVM currently has a static `MinBlkDelay` (seconds). For EVM chains adopting LP-226:

**Requirement**: Set ProposerVM `MinBlkDelay = 0`

**Rationale**: LP-226 provides dynamic minimum delay, making ProposerVM's static delay redundant and potentially conflicting.

## Rationale

### Design Decisions

**1. Exponential Formula**: Using $m = M \cdot e^{q/D}$ provides smooth, continuous adjustment of block timing. Linear formulas were rejected as they don't provide the fine-grained control needed at both high and low delay values.

**2. Millisecond Timestamps**: Adding `timestampMilliseconds` while keeping `timestamp` (seconds) ensures backward compatibility with existing tooling while enabling sub-second precision.

**3. Validator-Controlled Rate**: Allowing validators to gradually adjust timing through the $Q$ parameter ensures network stability. Instant changes were rejected as they could cause consensus issues.

**4. Initial 2-Second Target**: Starting with current C-Chain timing ensures smooth activation, then allowing gradual optimization as validators gain confidence.

### Alternatives Considered

- **Per-Block Configurable Delay**: Rejected due to potential for abuse and consensus complexity
- **Time-Weighted Average**: Rejected as it adds latency to adjustments
- **Fixed Sub-Second Timing**: Rejected as different network conditions require different optima
- **Block-Height-Based Timing**: Rejected as it doesn't adapt to network conditions

### Parameter Selection

The choice of $M=100ms$, $D=2^{20}$, and $Q=200$ provides:
- Minimum possible block time: 100ms (10 blocks/second max)
- Current target: ~2 seconds
- Full range traversal: ~3,600 blocks per doubling/halving
- Stability: No sudden jumps in block timing

## Test Cases

### Unit Tests

```go
// Test: Minimum block delay calculation
func TestCalculateMinimumBlockDelay(t *testing.T) {
    cases := []struct {
        name     string
        excess   uint64
        expected uint64
    }{
        {"at minimum", 0, 100},                     // m = 100 * e^0 = 100ms
        {"initial C-Chain", 3141253, 2000},         // ~2 seconds
        {"half initial", 2414216, 1000},            // ~1 second
        {"near max", 6282506, 4000},                // ~4 seconds
    }

    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            delay := CalculateMinimumBlockDelay(tc.excess)
            require.InDelta(t, tc.expected, delay, 50) // Allow 50ms tolerance
        })
    }
}

// Test: Excess update with max change limit
func TestUpdateExcess(t *testing.T) {
    maxChange := uint64(200)

    // Test increase toward target
    current := uint64(1000)
    desired := uint64(1500)
    result := UpdateExcess(current, desired, maxChange)
    require.Equal(t, uint64(1200), result) // +200

    // Test decrease toward target
    current = uint64(1500)
    desired = uint64(1000)
    result = UpdateExcess(current, desired, maxChange)
    require.Equal(t, uint64(1300), result) // -200

    // Test small change (less than max)
    current = uint64(1000)
    desired = uint64(1050)
    result = UpdateExcess(current, desired, maxChange)
    require.Equal(t, uint64(1050), result) // +50
}

// Test: Block timing validation
func TestBlockTimingValidation(t *testing.T) {
    parent := &Block{
        TimestampMilliseconds: 1000000,
        MinimumBlockDelay:     500,
    }

    // Valid: respects minimum delay
    validBlock := &Block{
        TimestampMilliseconds: 1000500, // exactly at minimum
    }
    err := VerifyBlockTiming(validBlock, parent)
    require.NoError(t, err)

    // Invalid: too early
    earlyBlock := &Block{
        TimestampMilliseconds: 1000400, // 100ms too early
    }
    err = VerifyBlockTiming(earlyBlock, parent)
    require.Error(t, err)
}

// Test: Timestamp alignment
func TestTimestampAlignment(t *testing.T) {
    // Valid alignment
    block := &Block{
        Timestamp:             1234567890,
        TimestampMilliseconds: 1234567890500, // .500 seconds
    }
    require.True(t, ValidateTimestampAlignment(block))

    // Invalid alignment
    block = &Block{
        Timestamp:             1234567890,
        TimestampMilliseconds: 1234567891500, // Wrong second
    }
    require.False(t, ValidateTimestampAlignment(block))
}

// Test: Convergence rate
func TestConvergenceRate(t *testing.T) {
    // Starting from 2s target, converging to 1s target
    initialExcess := uint64(3141253)
    targetExcess := uint64(2414216)
    maxChange := uint64(200)

    blocks := 0
    excess := initialExcess
    for excess > targetExcess {
        excess = UpdateExcess(excess, targetExcess, maxChange)
        blocks++
    }

    // Should take ~3,635 blocks
    require.InDelta(t, 3635, blocks, 10)
}
```

### Integration Tests

**Location**: `tests/e2e/block_timing/lp226_test.go`

Scenarios:
1. **Activation Transition**: Verify smooth transition from static to dynamic timing
2. **Validator Coordination**: Multiple validators converging on new target
3. **Min/Max Bounds**: Block timing at extreme values
4. **ProposerVM Integration**: Verify compatibility with ProposerVM changes
5. **Cross-Chain Consistency**: Same timing behavior across EVM chains

## Implementation

### Header Verification

```go
func VerifyHeader(block *Block, parent *Block) error {
    // Verify millisecond timestamp alignment
    if block.TimestampMilliseconds / 1000 != block.Timestamp {
        return errTimestampMismatch
    }
    
    // Verify minimum block delay
    minNextTime := parent.TimestampMilliseconds + parent.MinimumBlockDelay
    if block.TimestampMilliseconds < minNextTime {
        return errBlockTooEarly
    }
    
    // Verify blockGasCost is zero
    if block.BlockGasCost != 0 {
        return errBlockGasCostNonZero
    }
    
    // Verify minimumBlockDelay update
    deltaQ := calculateDeltaQ(parent, block)
    if abs(deltaQ) > MaxChangePerBlock {
        return errExcessiveDelayChange
    }
    
    return nil
}
```

### Dynamic Delay Calculation

```go
// Constants (C-Chain configuration)
const (
    MinDelay       = 100 // milliseconds
    InitialExcess  = 3141253
    UpdateConstant = 1048576
    MaxChange      = 200
)

func CalculateMinimumBlockDelay(excess uint64) uint64 {
    // m = M * e^(q/D)
    exponent := float64(excess) / float64(UpdateConstant)
    multiplier := math.Exp(exponent)
    delay := float64(MinDelay) * multiplier
    return uint64(delay)
}

func UpdateExcess(current, desired uint64, maxChange uint64) uint64 {
    if desired > current {
        delta := min(desired - current, maxChange)
        return current + delta
    } else {
        delta := min(current - desired, maxChange)
        return current - delta
    }
}

func DesiredExcess(desiredDelay uint64) uint64 {
    // q = D * ln(M_desired / M)
    ratio := float64(desiredDelay) / float64(MinDelay)
    ln := math.Log(ratio)
    return uint64(float64(UpdateConstant) * ln)
}
```

### Block Building

```go
type BlockBuilder struct {
    preferredDelay uint64 // Configured by validator
}

func (b *BlockBuilder) BuildBlock(parent *Block, txs []Tx) (*Block, error) {
    // Calculate validator's target excess
    desiredExcess := DesiredExcess(b.preferredDelay)
    
    // Calculate next excess based on current
    currentExcess := parent.Excess
    nextExcess := UpdateExcess(currentExcess, desiredExcess, MaxChange)
    
    // Calculate minimum delay for next block
    nextMinDelay := CalculateMinimumBlockDelay(nextExcess)
    
    // Build block
    block := &Block{
        Parent:               parent.Hash,
        Timestamp:            time.Now().Unix(),
        TimestampMilliseconds: time.Now().UnixMilli(),
        MinimumBlockDelay:    nextMinDelay,
        Excess:               nextExcess,
        BlockGasCost:         0, // Deprecated
        Transactions:         txs,
    }
    
    // Ensure we respect parent's minimum delay
    minNextTime := parent.TimestampMilliseconds + parent.MinimumBlockDelay
    if block.TimestampMilliseconds < minNextTime {
        return nil, errBlockTooEarly
    }
    
    return block, nil
}
```

## Use Cases

### 1. High-Frequency Trading on C-Chain

**Scenario**: Lux DEX wants sub-second block times for competitive trading experience

**Current State** (2s blocks):
- Trade execution: 2-4 seconds
- Front-running window: 2 seconds
- User experience: Slower than centralized exchanges

**With LP-226** (validators converge to 500ms):
- Trade execution: 0.5-1 second
- Front-running window: 500ms
- User experience: Comparable to CEX

**Validator Configuration**:
```toml
[c-chain]
minimum-block-delay = 500  # milliseconds
```

**Result**: Network gradually adjusts to 500ms blocks over ~2 hours

### 2. A-Chain AI Model Updates

**Scenario**: AI VM needs rapid model weight updates

**Requirements**:
- Fast consensus on model updates
- High-throughput for inference results
- Adaptive to network conditions

**Implementation**:
```go
// A-Chain specific configuration
const AIChainPreferredDelay = 200 // milliseconds for rapid AI operations

// Validators adjust based on observed latency
func adjustAIChainTiming(observedLatency time.Duration) {
    if observedLatency > 150*time.Millisecond {
        // Network is slow, increase delay
        preferredDelay = 300
    } else if observedLatency < 50*time.Millisecond {
        // Network is fast, decrease delay
        preferredDelay = 150
    }
}
```

**Benefit**: AI Chain adapts block timing to match network performance

### 3. B-Chain Cross-Chain Message Processing

**Scenario**: Bridge VM needs fast message verification

**Integration with LP-181 (Epoching)**:
```solidity
// Coordinate epoch boundaries with block timing
contract BridgeVM {
    uint256 constant EPOCH_DURATION = 120000; // 2 minutes in milliseconds
    
    function processMessage(bytes calldata message) external {
        uint256 currentTime = block.timestampMilliseconds; // LP-226
        uint256 epochBoundary = currentEpochStart + EPOCH_DURATION; // LP-181
        
        // Fast processing within epoch
        if (currentTime + block.minimumBlockDelay < epochBoundary) {
            // Can process quickly
            verifyAndExecute(message);
        } else {
            // Near epoch boundary, queue for next epoch
            queueForNextEpoch(message);
        }
    }
}
```

**Benefit**: Bridge operations coordinated with epoch timing

### 4. Gaming and NFT Marketplaces

**Scenario**: On-chain game needs fast turn resolution

**Problem with 2s blocks**:
- Game actions feel slow
- Users perceive lag
- Poor UX compared to Web2 games

**Solution with 200ms blocks**:
```javascript
// Game client
async function submitMove(move) {
    const tx = await game.playMove(move);
    // With 200ms blocks, confirmation in ~200-400ms
    // Much better UX than 2-4s
    await tx.wait(1);
    updateGameState();
}
```

**NFT Marketplace**:
- Faster bid confirmations
- Reduced sniping windows
- Better auction experiences

## Security Considerations

### Block Production Rate Limits

**Concern**: Too-rapid block production may cause validator availability issues

**Mitigation**:
1. **Global Minimum ($M$)**: Hard lower bound of 100ms prevents excessive speed
2. **Validator Consensus**: Collective preference prevents individual misconfiguration
3. **Gradual Changes**: $Q$ limits how fast block time can change
4. **Monitoring**: Validators observe network health and adjust accordingly

**Example Attack**:
- Malicious validator sets $M_{desired} = 100ms$ (minimum)
- Other validators set $M_{desired} = 2000ms$ (conservative)
- Network converges to middle ground based on validator stake weight
- Attack requires majority stake to significantly impact block timing

### Dynamic Feedback Loop

**Observation**: Lower block times → more blocks → faster convergence → potentially unstable

**Analysis**:
At $m = 100ms$, a block is produced every 100ms. With $Q = 200$ max change:
- Per block: $|\Delta q| \leq 200$
- Per second: $|\Delta q| \leq 2000$ (10 blocks)
- To halve/double: Still requires ~3,600 blocks = ~6 minutes

**Mitigation**: Even at minimum, convergence is bounded by $Q$

### Validator Misconfiguration

**Scenario**: Validator sets $M_{desired}$ too low for their hardware

**Consequences**:
- Validator misses blocks
- Reduced rewards
- Self-correcting: Validator adjusts configuration

**Network Impact**: Minimal - other validators continue operating

**Best Practice**: Monitor validator performance, adjust conservatively

### Coordination with LP-181 (Epoching)

**Concern**: Epoch duration and block timing interaction

**Consideration**: If block time is 100ms and epoch duration is 2 minutes:
- Epoch contains 1,200 blocks
- Validator set changes concentrated at epoch boundary
- Need to ensure validator set updates can process in <100ms

**Solution**: Epoch duration should be significantly longer than minimum block time

**Example**:
- $m_{min} = 100ms$
- Epoch duration = 5 minutes = 300,000ms
- Ratio: 3000:1 (safe margin)

## Integration with Other LPs

### LP-181 (Epoching)

**Synergy**: Epoch boundaries can align with block timing for coordinated validator updates

**Example**:
```python
# Epoch duration in milliseconds
EPOCH_DURATION_MS = 300000  # 5 minutes

# Ensure epoch duration >> minimum block delay
assert EPOCH_DURATION_MS > MIN_BLOCK_DELAY * 100
```

### LP-601 (Gas Fees)

**Interaction**: Dynamic block timing works alongside dynamic gas target (ACP-176)

**Coordination**:
- Gas target adjusts based on block utilization
- Block timing adjusts based on network capacity
- Both use similar exponential mechanisms

**Example**:
```go
// Block builder considers both
type DynamicConfig struct {
    targetGasExcess  uint64 // LP-601
    targetDelayExcess uint64 // LP-226
}

// Validators configure both independently
func configureChain() {
    config.targetGas = 15_000_000  // 15M gas target
    config.targetDelay = 500       // 500ms target
}
```

### LP-204 (secp256r1)

**Benefit**: Faster blocks → faster biometric transaction confirmations

**UX Improvement**:
- Current: Face ID → 2-4s confirmation
- With LP-226: Face ID → 200-400ms confirmation (200ms blocks)

## Implementation Status

**Upstream Sources**:
- [AvalancheGo #4289](https://github.com/ava-labs/avalanchego/pull/4289) - Math implementation
- [AvalancheGo #4300](https://github.com/ava-labs/avalanchego/pull/4300) - Initial delay excess

**Lux Node**:
- Implementation in `vms/evm/acp226/`
- Cherry-pick commits:
  - `8aa4f1e25` - Implement ACP-226 Math
  - `24aa89019` - ACP-226: add initial delay excess

**Activation**: Granite network upgrade

### Key Files

```
vms/evm/acp226/
├── acp226.go       # Core math and delay calculation
└── acp226_test.go  # Unit tests
```

### Testing

```go
// Test delay calculation
func TestCalculateMinimumDelay(t *testing.T) {
    // Test initial conditions
    delay := CalculateMinimumBlockDelay(InitialExcess)
    assert.Equal(t, 2000, delay) // ~2 seconds
    
    // Test minimum
    delay = CalculateMinimumBlockDelay(0)
    assert.Equal(t, 100, delay) // 100ms floor
    
    // Test convergence
    current := InitialExcess
    desired := DesiredExcess(500) // 500ms target
    for i := 0; i < 10000; i++ {
        current = UpdateExcess(current, desired, MaxChange)
    }
    finalDelay := CalculateMinimumBlockDelay(current)
    assert.InDelta(t, 500, finalDelay, 10) // Within 10ms
}
```

## Backwards Compatibility

**Header Format Changes**:
- Existing `timestamp` field preserved (seconds)
- New `timestampMilliseconds` field added
- New `minimumBlockDelay` field added
- Deprecated `blockGasCost` field (set to 0)

**Tool Compatibility**:
- Block explorers can continue using second-based timestamps
- Applications requiring precision can use millisecond timestamps
- Gradual migration path

**Network Upgrade Required**: Yes - incompatible with pre-Granite nodes

## Future Enhancements

### Per-Chain Block Timing

**Vision**: Different Lux chains have different optimal block times

**Implementation**:
```toml
[chains]
  [chains.c-chain]
  target-block-delay = 500  # DeFi needs speed
  
  [chains.d-chain]
  target-block-delay = 2000  # Platform chain is more conservative
  
  [chains.z-chain]
  target-block-delay = 200  # ZK proofs benefit from fast blocks
```

### Adaptive Algorithms

**Machine Learning-Based Adjustment**:
```python
# Validator observes network and adjusts
class AdaptiveBlockTiming:
    def __init__(self):
        self.latency_history = []
        self.utilization_history = []
    
    def recommend_delay(self):
        avg_latency = np.mean(self.latency_history[-100:])
        avg_util = np.mean(self.utilization_history[-100:])
        
        if avg_latency > 100 and avg_util > 0.8:
            # Network is stressed, slow down
            return current_delay * 1.1
        elif avg_latency < 50 and avg_util < 0.5:
            # Network has capacity, speed up
            return current_delay * 0.9
        else:
            # Maintain current
            return current_delay
```

### Cross-Chain Coordination

**Synchronized Timing Across Lux Chains**:
```solidity
// B-Chain (Bridge) coordinates timing
contract TimingCoordinator {
    mapping(uint256 => uint256) public chainTargetDelays;
    
    function coordinateTiming() external {
        // Ensure all chains within reasonable bounds
        require(
            chainTargetDelays[CHAIN_C] >= 100 &&
            chainTargetDelays[CHAIN_C] <= chainTargetDelays[CHAIN_D],
            "C-Chain must be faster than D-Chain"
        );
    }
}
```

## Acknowledgements

Based on ACP-226 by Stephen Buttolph and Michael Kaplan. Thanks to Luigi D'Onorio DeMeo for advocacy of faster block times. Adapted for Lux Network's multi-chain architecture.

## References

- [ACP-226 Original Specification](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/226-dynamic-minimum-block-times)
- [LP-181: P-Chain Epoched Views](lp-181-epoching.md)
- [LP-601: Dynamic Gas Fee Mechanism with AI Compute Pricing](lp-601-dynamic-gas-fee-mechanism-with-ai-compute-pricing.md)
- [LP-204: secp256r1 Curve Integration](lp-204-secp256r1-curve-integration.md)
- [ACP-176: Dynamic Fees](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/176-dynamic-fees)

## Copyright

Copyright © 2025 Lux Industries Inc. All rights reserved.  
Based on ACP-226 - Copyright waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
