---
lp: 1181
title: Epoching and Validator Rotation
description: P-Chain epoched views for optimized validator set retrieval and ICM performance based on ACP-181
author: Lux Protocol Team (@luxfi), Cam Schultz
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Core
created: 2025-11-22
requires: 0
tags: [consensus, core]
order: 181
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

The Lux Network's multi-chain architecture (including the 6-chain network upgrade: A-Chain, B-Chain, C-Chain, P-Chain, X-Chain, Z-Chain) benefits from epoched P-Chain views through:

1. **Optimized Cross-Chain Operations**: Improved communication between chains in the Lux ecosystem
2. **Reduced Gas Costs**: Significant reduction in ICM verification costs across all chains
3. **Enhanced Validator Coordination**: Better synchronization across the expanded chain set
4. **Quantum-Safe Preparation**: Foundation for  quantum state management integration

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
- **Epoch P-Chain Height**: Fixed P-Chain (Platform Chain) height for the epoch
- **Epoch Start Time**: Timestamp marking epoch beginning

Let $E_N$ denote epoch $N$ with:
- Start time: $T_{start}^N$
- P-Chain height: $P_N$ (Platform Chain)
- Duration constant: $D$ (configured at network upgrade activation)

### Epoch Lifecycle

**Epoch Sealing**: An epoch $E_N$ is sealed by the first block with timestamp $t \geq T_{start}^N + D$.

**Epoch Advancement**: When block $B_{S_N}$ seals epoch $E_N$, the next block begins $E_{N+1}$ with:
- $P_{N+1}$ = P-Chain height of $B_{S_N}$
- $T_{start}^{N+1}$ = timestamp of $B_{S_N}$
- Epoch number increments by 1

### Reference Implementation

```go
// Lux Network Epoch Configuration
const D time.Duration // Configured at upgrade activation

type Epoch struct {
    PChainHeight uint64    // Platform Chain
    Number       uint64
    StartTime    time.Time
}

type Block interface {
    Timestamp() time.Time
    PChainHeight() uint64  // Renamed from PChainHeight
    Epoch() Epoch
}

func GetDChainEpoch(parent Block) Epoch {
    if parent.Timestamp().After(parent.Epoch().StartTime.Add(D)) {
        // Parent sealed its epoch - advance to next epoch
        return Epoch{
            PChainHeight: parent.PChainHeight(),
            Number:       parent.Epoch().Number + 1,
            StartTime:    parent.Timestamp(),
        }
    }
    
    // Continue current epoch
    return Epoch{
        PChainHeight: parent.Epoch().PChainHeight,
        Number:       parent.Epoch().Number,
        StartTime:    parent.Epoch().StartTime,
    }
}
```

## Lux-Specific Enhancements

### Multi-Chain Integration

**P-Chain (Platform Chain)**:
- Primary source of validator registry
- Epoch sealing happens at P-Chain level
- All chains reference P-Chain epoch heights

**C-Chain (EVM)**:
- Uses epoched views for ICM verification
- Reduced gas costs for cross-chain operations
- Compatible with ACP-226 dynamic block timing

** (Quantum State)**:
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

**3. P-Chain Height Locking**: Locking the P-Chain height at epoch start eliminates expensive traversal during block execution. The trade-off of slightly stale validator data is acceptable given typical epoch durations.

**4. Multi-Chain Coordination**: All Lux chains reference the same P-Chain epoch, ensuring consistent validator views across A, B, C, D, Y, Z chains.

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
        PChainHeight: 1000,
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
    require.Equal(t, epoch.PChainHeight, nextEpoch.PChainHeight)

    // Past epoch duration - should advance
    parentPastEpoch := &mockBlock{
        timestamp:     epoch.StartTime.Add(3 * time.Minute),
        dChainHeight:  1100,
        epoch:         epoch,
    }
    nextEpoch = GetDChainEpoch(parentPastEpoch)
    require.Equal(t, epoch.Number+1, nextEpoch.Number)
    require.Equal(t, uint64(1100), nextEpoch.PChainHeight)
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
    // All chains should derive same epoch from P-Chain state
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
        require.Equal(t, epochs[0].PChainHeight, epochs[i].PChainHeight)
    }
}

// Test: ICM verification with epoched views
func TestICMVerificationWithEpoch(t *testing.T) {
    epoch := Epoch{PChainHeight: 2000, Number: 15}

    // Create ICM message signed by validators at epoch height
    validators := getValidatorsAtHeight(epoch.PChainHeight)
    message := createICMMessage("C", "Y", []byte("test"))
    signature := signWithValidators(message, validators)

    // Verification should use epoch height, not current height
    verified := verifyICMWithEpoch(message, signature, epoch)
    require.True(t, verified)

    // Verification with wrong epoch should fail
    wrongEpoch := Epoch{PChainHeight: 1500, Number: 10}
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

Unbounded epoch duration may cause P-Chain height lag. Mitigations:
1. Monitor epoch advancement for consistent block production
2. Shorter epoch durations for high-throughput chains
3. Validator weight change limits at epoch boundaries

### Quantum-Safe Considerations ( Integration)

When  quantum state checkpoints align with epoch boundaries:
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
- **Current**: 200k-330k gas for variable-depth P-Chain traversal
- **With Epoching**: Pre-fetched validator sets, significant gas reduction
- **Benefit**: More economical cross-chain communication across all Lux chains

### 2. Improved Relayer Reliability
- **Problem**: Validator set changes between signature collection and submission
- **Solution**: Fixed P-Chain height during epoch duration
- **Benefit**: More reliable message delivery across chains

### 3.  Quantum Checkpoint Coordination
- **Integration**: Align quantum state snapshots with epoch boundaries
- **Benefit**: Predictable quantum verification windows
- **Security**: Enhanced quantum-safe cross-chain operations

### 4. Multi-Chain State Sync
- **Use**: A, B, C, D, Y, Z chain state synchronization
- **Benefit**: Coordinated snapshots at epoch boundaries
- **Performance**: Parallel state sync across chain set

## Backwards Compatibility

Requires network upgrade. Not backwards compatible. Downstream systems must account for epoched P-Chain views:

- **ICM Message Constructors**: Use epoch P-Chain height, not tip
- **Block Explorers**: Display both current and epoch P-Chain heights
- **Relayers**: Implement epoch-aware validator set queries
- **Indexers**: Track epoch boundaries and validator set changes

## Ringtail Key Epoch Management (LP-7324 Integration)

### Overview

The EpochManager provides epoch-based Ringtail key management for the Quasar consensus validator set. Fresh lattice-based threshold keys are generated when validators change, with rate limiting to prevent excessive key churn while still rotating frequently enough to frustrate quantum attacks.

### Ringtail Epoch Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `MinEpochDuration` | 1 hour | Minimum time between key rotations (rate limiting) |
| `MaxEpochDuration` | 24 hours | Maximum time keys can be used (forced rotation) |
| `HistoryLimit` | 3 epochs | Number of historical epochs preserved for verification |

### Epoch Counter Limits

The epoch uses `uint64` which supports values up to 18,446,744,073,709,551,615. At 1 epoch per hour:
- **2.1 trillion years** of epochs before overflow
- Effectively unlimited for all practical purposes

### Key Rotation Behavior

```go
// EpochManager manages Ringtail key epochs for the validator set.
type EpochManager struct {
    currentEpoch      uint64
    currentKeys       *EpochKeys
    lastKeygenTime    time.Time
    epochHistory      map[uint64]*EpochKeys  // For cross-epoch verification
    historyLimit      int                     // How many old epochs to keep
    currentValidators []string
    threshold         int
}

// EpochKeys holds the Ringtail keys for a specific epoch.
type EpochKeys struct {
    Epoch           uint64
    CreatedAt       time.Time
    ExpiresAt       time.Time
    ValidatorSet    []string
    Threshold       int
    TotalParties    int
    GroupKey        *ringtailThreshold.GroupKey
    Shares          map[string]*ringtailThreshold.KeyShare
    Signers         map[string]*ringtailThreshold.Signer
}
```

### Rate Limiting

Key rotations are rate-limited to at most once per hour:

```go
// RotateEpoch returns ErrEpochRateLimited if called within MinEpochDuration
if elapsed := now.Sub(em.lastKeygenTime); elapsed < MinEpochDuration {
    return nil, fmt.Errorf("%w: %v remaining", ErrEpochRateLimited, remaining)
}

// Returns ErrNoValidatorChange if validator set hasn't changed (unless force=true)
if !force && em.validatorSetUnchanged(validators) {
    return nil, ErrNoValidatorChange
}
```

### Epoch History Preservation

Historical epochs are preserved for signature verification during transitions:
- Signatures from old epochs remain verifiable until history is pruned
- Default keeps last 3 epochs
- Pruning removes epochs older than `currentEpoch - historyLimit + 1`

### Cross-Epoch Signature Verification

```go
// VerifySignatureForEpoch verifies a Ringtail signature using the epoch's keys.
func (em *EpochManager) VerifySignatureForEpoch(message string, sig *Signature, epoch uint64) bool {
    keys, exists := em.epochHistory[epoch]
    if !exists || keys.GroupKey == nil || sig == nil {
        return false
    }
    return ringtailThreshold.Verify(keys.GroupKey, message, sig)
}
```

### Integration with Quasar Consensus

The EpochManager integrates with Quasar's validator management:

```go
// AddValidator rotates Ringtail keys when validator set changes
func (q *Quasar) AddValidator(validatorID string, share *ringtailThreshold.KeyShare) error {
    keys, err := q.epochManager.RotateEpoch(validators, false)
    if errors.Is(err, ErrEpochRateLimited) || errors.Is(err, ErrNoValidatorChange) {
        // Not an error - just rate limited or no change
        rotated = false
        err = nil
    }
    // Update BLS and Ringtail validator sets in sync
    return q.syncValidatorSets()
}
```

### Security Benefits

1. **Key Freshness**: Regular rotation invalidates any quantum attack progress
2. **Rate Limiting**: Prevents DoS via excessive key generation
3. **History Preservation**: Cross-epoch verification during transitions
4. **Synchronized Sets**: BLS and Ringtail validator sets stay aligned

### Implementation Files

| File | Purpose |
|------|---------|
| `consensus/protocol/quasar/epoch.go` | EpochManager implementation |
| `consensus/protocol/quasar/epoch_test.go` | Epoch tests (8 tests) |
| `consensus/protocol/quasar/core.go` | Quasar integration |
| `ringtail/sign/sign.go` | Non-destructive Verify function |

## Future Enhancements

### Post-Quantum Validator Sets
- Integrate with LP-4316 (ML-DSA), LP-4317 (SLH-DSA), LP-4318 (ML-KEM)
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

Thanks to Lux Protocol Team for integration testing and  quantum coordination design.

## References

- [ACP-181 Original Specification](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/181-p-chain-epoched-views)
- [LP-605](./lp-1605-elastic-validator-chains.md
- [LP-318](./lp-4318-ml-kem-post-quantum-key-encapsulation.md
- [LP-316](./lp-4316-ml-dsa-post-quantum-digital-signatures.md

Copyright © 2025 Lux Industries Inc. All rights reserved.  
Based on ACP-181. Licensed under BSD-3-Clause-Network (see LICENSE).
