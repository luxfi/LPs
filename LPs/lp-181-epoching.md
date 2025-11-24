---
lp: 181
title: Epoching and Validator Rotation
status: Final
type: Standards Track
category: Core
created: 2025-11-22
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
- [LP-600: Snowman Consensus](LP-600-snowman.md)
- [LP-605: Validators](LP-605-validators.md)
- [LP-001: ML-KEM (Post-Quantum)](LP-001-ML-KEM.md)
- [LP-002: ML-DSA (Post-Quantum)](LP-002-ML-DSA.md)

## Copyright

Copyright © 2025 Lux Industries Inc. All rights reserved.  
Based on ACP-181 - Copyright waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
