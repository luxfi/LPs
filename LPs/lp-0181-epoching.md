---
lp: 0181
title: Epoching and Validator Rotation
description: P-Chain epoched views for optimized validator set retrieval and ICM performance based on ACP-181
author: Lux Protocol Team (@luxfi), Cam Schultz
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-11-22
requires: 10
tags: [consensus, core]
---

# LP-181: P-Chain Epoched Views (Granite Upgrade)

| LP | 181 |
| :--- | :--- |
| **Title** | P-Chain Epoched Views for Lux Network |
| **Author(s)** | Lux Protocol Team (Based on ACP-181 by Cam Schultz) |
| **Status** | Adopted (Granite Upgrade) |
| **Track** | Standards |
| **Based On** | [ACP-181](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/181-p-chain-epoched-views) |

## Abstract

LP-181 adopts ACP-181's P-Chain epoching scheme for the Lux Network, enabling optimized validator set retrievals and improving Inter-Chain Messaging (ICM) verification performance. This specification allows VMs to use P-Chain block heights known prior to block generation, significantly reducing gas costs and improving cross-chain communication reliability.

## Lux Network Context

The Lux Network's multi-chain architecture (including the 6-chain regenesis: A-Chain, B-Chain, C-Chain, D-Chain, Y-Chain, Z-Chain) benefits from epoched P-Chain views through:

1. **Optimized Cross-Chain Operations**: Improved communication between chains in the Lux ecosystem
2. **Reduced Gas Costs**: Significant reduction in ICM verification costs across all chains
3. **Enhanced Validator Coordination**: Better synchronization across the expanded chain set
4. **Quantum-Safe Preparation**: Foundation for Y-Chain quantum state management integration

## Motivation

The Lux Network extends Avalanche's validator registry to support its enhanced multi-chain architecture. Validators across A, B, C, D, Y, and Z chains need efficient access to validator sets. Current implementations require expensive P-Chain traversal during block execution, charging high fixed gas costs to account for worst-case scenarios.

Epoching enables:
- **Pre-fetching Validator Sets**: Asynchronous retrieval at epoch boundaries
- **Reduced ICM Costs**: Lower gas for cross-chain message verification
- **Improved Relayer Reliability**: Predictable validator set windows for off-chain relayers
- **Multi-Chain Coordination**: Better synchronization across Lux's expanded chain architecture

## Specification

### Epoch Definition

An epoch is a contiguous range of blocks sharing:
- **Epoch Number**: Sequential integer identifier
- **Epoch P-Chain Height**: Fixed D-Chain (Platform Chain) height for the epoch
- **Epoch Start Time**: Timestamp marking epoch beginning

Let $E_N$ denote epoch $N$ with:
- Start time: $T_{start}^N$
- D-Chain height: $P_N$ (P-Chain is D-Chain in Lux regenesis)
- Duration constant: $D$ (configured at network upgrade activation)

### Epoch Lifecycle

**Epoch Sealing**: An epoch $E_N$ is sealed by the first block with timestamp $t \geq T_{start}^N + D$.

**Epoch Advancement**: When block $B_{S_N}$ seals epoch $E_N$, the next block begins $E_{N+1}$ with:
- $P_{N+1}$ = D-Chain height of $B_{S_N}$
- $T_{start}^{N+1}$ = timestamp of $B_{S_N}$
- Epoch number increments by 1

### Reference Implementation

```go
// Lux Network Epoch Configuration
const D time.Duration // Configured at upgrade activation

type Epoch struct {
    DChainHeight uint64    // P-Chain → D-Chain in Lux
    Number       uint64
    StartTime    time.Time
}

type Block interface {
    Timestamp() time.Time
    DChainHeight() uint64  // Renamed from PChainHeight
    Epoch() Epoch
}

func GetDChainEpoch(parent Block) Epoch {
    if parent.Timestamp().After(parent.Epoch().StartTime.Add(D)) {
        // Parent sealed its epoch - advance to next epoch
        return Epoch{
            DChainHeight: parent.DChainHeight(),
            Number:       parent.Epoch().Number + 1,
            StartTime:    parent.Timestamp(),
        }
    }
    
    // Continue current epoch
    return Epoch{
        DChainHeight: parent.Epoch().DChainHeight,
        Number:       parent.Epoch().Number,
        StartTime:    parent.Epoch().StartTime,
    }
}
```

## Lux-Specific Enhancements

### Multi-Chain Integration

**D-Chain (Platform Chain)**:
- Primary source of validator registry
- Epoch sealing happens at D-Chain level
- All chains reference D-Chain epoch heights

**C-Chain (EVM)**:
- Uses epoched views for ICM verification
- Reduced gas costs for cross-chain operations
- Compatible with ACP-226 dynamic block timing

**Y-Chain (Quantum State)**:
- Integrates epoch boundaries with quantum checkpoints
- Synchronizes quantum state verification with validator set updates
- Enhanced security for quantum-resistant operations

**A-Chain, B-Chain, Z-Chain**:
- AI VM, Bridge VM, and ZK VM leverage epoching for cross-chain calls
- Optimized validator set queries for specialized operations

### Epoch Duration Configuration

**Lux Mainnet (Network ID: 96369)**:
- Initial epoch duration: $D$ = 2 minutes
- Configurable via future network upgrades
- Balances validator set stability with update responsiveness

## Rationale

### Design Decisions

**1. Fixed Epoch Duration**: Using a constant duration $D$ (2 minutes) provides predictable validator set windows. Variable durations were rejected as they complicate relayer implementations and make gas estimation difficult.

**2. Sealing Mechanism**: The first-block-past-deadline approach ensures deterministic epoch transitions. Alternative approaches like slot-based or block-count-based were rejected for their complexity and less predictable behavior.

**3. D-Chain Height Locking**: Locking the D-Chain height at epoch start eliminates expensive traversal during block execution. The trade-off of slightly stale validator data is acceptable given typical epoch durations.

**4. Multi-Chain Coordination**: All Lux chains reference the same D-Chain epoch, ensuring consistent validator views across A, B, C, D, Y, Z chains.

### Alternatives Considered

- **Per-Block Validator Queries**: Rejected due to high gas costs and unpredictable execution
- **Rolling Window**: Rejected for complexity in implementation and relayer logic
- **Variable Duration Based on Churn**: Rejected as it complicates prediction and tooling
- **Separate Epochs per Chain**: Rejected to maintain consistency across the ecosystem

## Test Cases

### Unit Tests

```go
// Test: Epoch advancement
func TestEpochAdvancement(t *testing.T) {
    duration := 2 * time.Minute
    epoch := Epoch{
        DChainHeight: 1000,
        Number:       5,
        StartTime:    time.Now(),
    }

    // Within epoch duration - should not advance
    parentWithinEpoch := &mockBlock{
        timestamp:     epoch.StartTime.Add(time.Minute),
        dChainHeight:  1050,
        epoch:         epoch,
    }
    nextEpoch := GetDChainEpoch(parentWithinEpoch)
    require.Equal(t, epoch.Number, nextEpoch.Number)
    require.Equal(t, epoch.DChainHeight, nextEpoch.DChainHeight)

    // Past epoch duration - should advance
    parentPastEpoch := &mockBlock{
        timestamp:     epoch.StartTime.Add(3 * time.Minute),
        dChainHeight:  1100,
        epoch:         epoch,
    }
    nextEpoch = GetDChainEpoch(parentPastEpoch)
    require.Equal(t, epoch.Number+1, nextEpoch.Number)
    require.Equal(t, uint64(1100), nextEpoch.DChainHeight)
}

// Test: Epoch sealing
func TestEpochSealing(t *testing.T) {
    epoch := Epoch{Number: 10, StartTime: time.Unix(1000, 0)}
    duration := 120 * time.Second // 2 minutes

    // Block exactly at boundary should seal
    blockAtBoundary := &mockBlock{
        timestamp: time.Unix(1120, 0),
        epoch:     epoch,
    }
    require.True(t, blockSealsEpoch(blockAtBoundary, duration))

    // Block before boundary should not seal
    blockBefore := &mockBlock{
        timestamp: time.Unix(1119, 0),
        epoch:     epoch,
    }
    require.False(t, blockSealsEpoch(blockBefore, duration))
}

// Test: Multi-chain epoch consistency
func TestMultiChainEpochConsistency(t *testing.T) {
    // All chains should derive same epoch from D-Chain state
    dChainState := &DChainState{Height: 5000, Timestamp: time.Now()}

    chains := []string{"A", "B", "C", "Y", "Z"}
    var epochs []Epoch

    for _, chain := range chains {
        epoch := deriveEpochForChain(chain, dChainState)
        epochs = append(epochs, epoch)
    }

    // All epochs should be identical
    for i := 1; i < len(epochs); i++ {
        require.Equal(t, epochs[0].Number, epochs[i].Number)
        require.Equal(t, epochs[0].DChainHeight, epochs[i].DChainHeight)
    }
}

// Test: ICM verification with epoched views
func TestICMVerificationWithEpoch(t *testing.T) {
    epoch := Epoch{DChainHeight: 2000, Number: 15}

    // Create ICM message signed by validators at epoch height
    validators := getValidatorsAtHeight(epoch.DChainHeight)
    message := createICMMessage("C", "Y", []byte("test"))
    signature := signWithValidators(message, validators)

    // Verification should use epoch height, not current height
    verified := verifyICMWithEpoch(message, signature, epoch)
    require.True(t, verified)

    // Verification with wrong epoch should fail
    wrongEpoch := Epoch{DChainHeight: 1500, Number: 10}
    verified = verifyICMWithEpoch(message, signature, wrongEpoch)
    require.False(t, verified)
}
```

### Integration Tests

**Location**: `tests/e2e/epoching/epoch_test.go`

Scenarios:
1. **Epoch Transition**: Verify smooth transition at epoch boundaries
2. **ICM Cost Reduction**: Measure gas savings for cross-chain calls
3. **Relayer Behavior**: Test message delivery across epoch boundaries
4. **Multi-Chain Sync**: Verify epoch consistency across all 6 chains
5. **Validator Set Changes**: Test handling of validator changes at boundaries

## Security Considerations

### Epoch P-Chain Height Skew

Unbounded epoch duration may cause D-Chain height lag. Mitigations:
1. Monitor epoch advancement for consistent block production
2. Shorter epoch durations for high-throughput chains
3. Validator weight change limits at epoch boundaries

### Quantum-Safe Considerations (Y-Chain Integration)

When Y-Chain quantum state checkpoints align with epoch boundaries:
- Validator set changes must account for quantum-resistant signature verification
- BLS keys may need upgrade to post-quantum alternatives
- Epoch duration should accommodate quantum checkpoint processing time

## Implementation Status

**Upstream Source**: [AvalancheGo PR #3746](https://github.com/ava-labs/avalanchego/pull/3746)  
**Lux Node**: Cherry-picked from upstream commit `7b75fa536`  
**Activation**: Granite network upgrade

### Key Files
- `vms/proposervm/acp181/epoch.go` - Epoch calculation logic
- `vms/proposervm/block.go` - Block integration
- `vms/proposervm/service.go` - RPC endpoints for epoch queries

## Use Cases

### 1. ICM (Inter-Chain Messaging) Optimization
- **Current**: 200k-330k gas for variable-depth D-Chain traversal
- **With Epoching**: Pre-fetched validator sets, significant gas reduction
- **Benefit**: More economical cross-chain communication across all Lux chains

### 2. Improved Relayer Reliability
- **Problem**: Validator set changes between signature collection and submission
- **Solution**: Fixed D-Chain height during epoch duration
- **Benefit**: More reliable message delivery across chains

### 3. Y-Chain Quantum Checkpoint Coordination
- **Integration**: Align quantum state snapshots with epoch boundaries
- **Benefit**: Predictable quantum verification windows
- **Security**: Enhanced quantum-safe cross-chain operations

### 4. Multi-Chain State Sync
- **Use**: A, B, C, D, Y, Z chain state synchronization
- **Benefit**: Coordinated snapshots at epoch boundaries
- **Performance**: Parallel state sync across chain set

## Backwards Compatibility

Requires network upgrade. Not backwards compatible. Downstream systems must account for epoched D-Chain views:

- **ICM Message Constructors**: Use epoch D-Chain height, not tip
- **Block Explorers**: Display both current and epoch D-Chain heights
- **Relayers**: Implement epoch-aware validator set queries
- **Indexers**: Track epoch boundaries and validator set changes

## Future Enhancements

### Post-Quantum Validator Sets (Y-Chain)
- Integrate with LP-001 (ML-KEM), LP-002 (ML-DSA), LP-003 (SLH-DSA)
- Support hybrid classical/quantum validator signatures
- Epoch-based migration to quantum-resistant schemes

### Dynamic Epoch Duration
- Adaptive $D$ based on network conditions
- Per-chain epoch configuration for specialized VMs
- Automatic adjustment based on validator churn

### Cross-Epoch Validator Transitions
- Smoother validator set changes across epochs
- Queuing mechanism to spread updates over multiple epochs
- Weighted transition windows for large validator changes

## Acknowledgements

Based on ACP-181 by Cam Schultz and contributors from Avalanche Labs. Adapted for Lux Network's multi-chain architecture with quantum-safe considerations.

Thanks to Lux Protocol Team for integration testing and Y-Chain quantum coordination design.

## References

- [ACP-181 Original Specification](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/181-p-chain-epoched-views)
- [LP-605: Elastic Validator Subnets](lp-605-elastic-validator-subnets.md)
- [LP-318: ML-KEM (Post-Quantum Key Encapsulation)](lp-318-ml-kem-post-quantum-key-encapsulation.md)
- [LP-316: ML-DSA (Post-Quantum Digital Signatures)](lp-316-ml-dsa-post-quantum-digital-signatures.md)

## Copyright

Copyright © 2025 Lux Industries Inc. All rights reserved.  
Based on ACP-181 - Copyright waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
