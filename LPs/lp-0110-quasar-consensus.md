---
lp: 0110
title: Quasar Unified Consensus Protocol
description: Physics-inspired consensus engine unifying Photon selection, Wave voting, Focus convergence, Prism geometry, Horizon predicates, and Flare finalization
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-29
tags: [consensus, quasar, finality, bft, snowman, photon, wave, focus, prism, horizon, flare]
---

## Abstract

Quasar is the unified consensus protocol for Lux Network, achieving sub-second finality through a physics-inspired multi-phase architecture. The protocol combines six specialized components: **Photon** (VRF-based proposer selection), **Wave** (FPC threshold voting), **Focus** (confidence accumulation), **Prism** (DAG geometry), **Horizon** (finality predicates), and **Flare** (cascading finalization). Quasar operates across all chain types (linear, DAG, EVM) with optional post-quantum security through BLS + Lattice dual signatures.

## Motivation

Current blockchain consensus mechanisms face critical limitations:

1. **Fragmentation**: Different engines for different chain types
2. **Latency**: Multi-second finality unsuitable for real-time applications
3. **Complexity**: Monolithic designs that are hard to reason about
4. **Adaptability**: Difficult to upgrade individual components

Quasar addresses these through a modular, physics-inspired architecture where each component has a single responsibility:

| Component | Physics Metaphor | Responsibility |
|-----------|------------------|----------------|
| Photon | Light particle emission | Proposer selection |
| Wave | Wave propagation | Opinion polling |
| Focus | Constructive interference | Confidence building |
| Prism | Light refraction | DAG geometry |
| Horizon | Event horizon | Finality boundary |
| Flare | Stellar detonation | Final commitment |

## Specification

### 1. Protocol Overview

Quasar processes blocks through six phases:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        QUASAR CONSENSUS FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                            │
│   │ PHOTON  │───▶│  WAVE   │───▶│  FOCUS  │                            │
│   │ Select  │    │  Vote   │    │ Converge│                            │
│   └─────────┘    └─────────┘    └────┬────┘                            │
│                                      │                                  │
│                                      ▼                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                            │
│   │  FLARE  │◀───│ HORIZON │◀───│  PRISM  │                            │
│   │ Commit  │    │ Finality│    │   DAG   │                            │
│   └─────────┘    └─────────┘    └─────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Component Specifications

#### 2.1 Photon: Proposer Selection (LP-111)

VRF-based selection weighted by stake and luminance (performance metric):

```go
// Package photon provides performance-weighted proposer selection
type PhotonEngine struct {
    luminance  map[ids.NodeID]uint32  // Performance: 10-1000 lux
    vrfKeys    map[ids.NodeID][]byte
}

func (p *PhotonEngine) SelectProposer(height uint64, validators []Validator) ids.NodeID {
    // VRF(sk, height) weighted by stake * luminance
    bestPriority := uint256.Zero
    var bestProposer ids.NodeID

    for _, v := range validators {
        output := vrf.Prove(v.SecretKey, height)
        priority := uint256.FromBytes(output)
        priority.Mul(priority, uint256.FromUint64(v.Stake))
        priority.Mul(priority, uint256.FromUint64(uint64(p.luminance[v.NodeID])))

        if priority.Cmp(bestPriority) > 0 {
            bestPriority = priority
            bestProposer = v.NodeID
        }
    }
    return bestProposer
}
```

#### 2.2 Wave: Threshold Voting (LP-113)

FPC (Fast Probabilistic Consensus) with phase-dependent thresholds:

```go
// Package wave computes per-round thresholds and drives polling
type WaveEngine struct {
    k         int     // Sample size (20)
    thetaMin  float64 // Initial threshold (0.5)
    thetaMax  float64 // Final threshold (0.8)
}

// SelectThreshold picks θ ∈ [θ_min, θ_max] using PRF for phase
func (w *WaveEngine) SelectThreshold(phase uint64) float64 {
    // Sigmoid cooling: θ(r) = θ_min + (θ_max - θ_min) / (1 + e^(-r/τ))
    tau := 10.0
    sigmoid := 1.0 / (1.0 + math.Exp(-float64(phase)/tau))
    return w.thetaMin + (w.thetaMax-w.thetaMin)*sigmoid
}

// Poll executes one voting round
func (w *WaveEngine) Poll(sample []NodeID, item Decidable) (preferOK, confOK bool) {
    votes := collectVotes(sample, item)
    ratio := float64(countPositive(votes)) / float64(len(votes))
    theta := w.SelectThreshold(item.Phase())

    preferOK = ratio > theta
    confOK = ratio > theta + 0.1  // Higher bar for confidence
    return
}
```

#### 2.3 Focus: Confidence Accumulation (LP-114)

Accumulates confidence through consecutive successful rounds:

```go
// Package focus accumulates confidence by counting β consecutive successes
type FocusEngine struct {
    beta       int  // Required consecutive successes (3)
    confidence map[ids.ID]int
}

func (f *FocusEngine) RecordSuccess(itemID ids.ID, confOK bool) bool {
    if confOK {
        f.confidence[itemID]++
        if f.confidence[itemID] >= f.beta {
            return true  // Locally finalized
        }
    } else {
        f.confidence[itemID] = 0  // Reset on failure
    }
    return false
}
```

#### 2.4 Prism: DAG Geometry (LP-116)

Projects the DAG into votable slices:

```go
// Package prism provides DAG geometry: frontiers, cuts, and refractions
type PrismEngine struct {
    dag     *DAG
    cuts    map[uint64][]ids.ID  // Height -> vertex IDs
}

// Frontier returns maximal antichain (tips of the DAG)
func (p *PrismEngine) Frontier() []ids.ID {
    return p.dag.Tips()
}

// Cut selects a thin slice across causal layers
func (p *PrismEngine) Cut(height uint64) []ids.ID {
    return p.dag.VerticesAtHeight(height)
}

// Refract projects vertices into votable sub-slices
func (p *PrismEngine) Refract(vertices []ids.ID, k int) [][]ids.ID {
    // Deterministically partition into k groups
    groups := make([][]ids.ID, k)
    for i, v := range vertices {
        groups[i%k] = append(groups[i%k], v)
    }
    return groups
}
```

#### 2.5 Horizon: Finality Predicates (LP-115)

Determines when vertices cross the finality boundary:

```go
// Package horizon houses DAG order-theory predicates
type HorizonEngine struct {
    dag       *DAG
    threshold int  // 2f+1 for Byzantine tolerance
}

// Certificate detects when vertex has ≥2f+1 support
func (h *HorizonEngine) Certificate(vertexID ids.ID) bool {
    support := h.dag.SupportCount(vertexID)
    return support >= h.threshold
}

// Skip detects when vertex has ≥2f+1 opposition (will be skipped)
func (h *HorizonEngine) Skip(vertexID ids.ID) bool {
    opposition := h.dag.OppositionCount(vertexID)
    return opposition >= h.threshold
}

// Reachable checks if ancestor is reachable from descendant
func (h *HorizonEngine) Reachable(ancestor, descendant ids.ID) bool {
    return h.dag.IsAncestor(ancestor, descendant)
}
```

#### 2.6 Flare: Cascading Finalization (LP-112)

Commits vertices in causal order:

```go
// Package flare finalizes DAG cuts via cascading accept
type FlareEngine struct {
    dag      *DAG
    horizon  *HorizonEngine
    accepted map[ids.ID]bool
}

func (f *FlareEngine) Finalize(cut []ids.ID) []ids.ID {
    finalized := []ids.ID{}

    // Walk dependencies in causal order
    for _, vertexID := range topologicalSort(cut) {
        // Check all dependencies are finalized
        deps := f.dag.Dependencies(vertexID)
        allDepsFinalized := true
        for _, dep := range deps {
            if !f.accepted[dep] {
                allDepsFinalized = false
                break
            }
        }

        // Finalize if dependencies met and certificate detected
        if allDepsFinalized && f.horizon.Certificate(vertexID) {
            f.accepted[vertexID] = true
            finalized = append(finalized, vertexID)
        }
    }

    return finalized
}
```

### 3. Unified Consensus Loop

The Quasar engine orchestrates all components:

```go
type QuasarEngine struct {
    photon  *PhotonEngine
    wave    *WaveEngine
    focus   *FocusEngine
    prism   *PrismEngine
    horizon *HorizonEngine
    flare   *FlareEngine
}

func (q *QuasarEngine) ProcessRound(height uint64) {
    // 1. PHOTON: Select proposer
    proposer := q.photon.SelectProposer(height, q.validators)

    // 2. Receive proposed block/vertices
    items := receiveProposals(proposer)

    // 3. PRISM: Structure DAG
    cut := q.prism.Cut(height)
    slices := q.prism.Refract(cut, q.wave.k)

    // 4. WAVE: Poll each slice
    for _, slice := range slices {
        sample := q.photon.Sample(q.wave.k)
        for _, item := range slice {
            preferOK, confOK := q.wave.Poll(sample, item)

            // 5. FOCUS: Accumulate confidence
            if q.focus.RecordSuccess(item.ID(), confOK) {
                // 6. HORIZON: Check finality predicates
                if q.horizon.Certificate(item.ID()) {
                    // 7. FLARE: Commit
                    q.flare.Finalize([]ids.ID{item.ID()})
                }
            }
        }
    }
}
```

### 4. Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Time to Finality | 400-800ms | Sub-second in normal conditions |
| Message Complexity | O(kn) | k=20 samples, n validators |
| Byzantine Tolerance | f < n/3 | Standard BFT guarantee |
| Rounds to Finality | 3-5 | Based on β=3 confidence |

### 5. Post-Quantum Extension

Quasar supports optional quantum-safe signatures:

```go
type QuasarPQ struct {
    *QuasarEngine

    // Round 1: BLS aggregate (fast, classical)
    blsSignatures map[ids.ID][]byte

    // Round 2: Lattice (quantum-safe, larger)
    latticeSignatures map[ids.ID][]byte
}

func (q *QuasarPQ) FinalizeWithPQ(itemID ids.ID) {
    // Require both signature types
    if len(q.blsSignatures[itemID]) > 0 &&
       len(q.latticeSignatures[itemID]) > 0 {
        q.flare.Finalize([]ids.ID{itemID})
    }
}
```

## Rationale

### Modular Design

Each component handles one concern:
- Easier to reason about correctness
- Components can be upgraded independently
- Clear interfaces enable testing

### Physics Metaphors

The naming provides intuition:
- Light (photon) → who speaks
- Wave → how opinions propagate
- Focus → convergence point
- Prism → structure/refraction
- Horizon → boundary of finality
- Flare → explosive commitment

### Sub-Second Finality

Achieved through:
1. Parallel polling (Wave)
2. Adaptive thresholds (FPC)
3. Confidence shortcuts (Focus)
4. Certificate detection (Horizon)

## Backwards Compatibility

Quasar maintains compatibility with existing Snowman consensus through interface adapters:

```go
type SnowmanAdapter struct {
    quasar *QuasarEngine
}

func (s *SnowmanAdapter) RecordPoll(votes ids.Bag) {
    // Convert Snowman votes to Quasar polling
    s.quasar.wave.ProcessVotes(votes)
}
```

## Test Cases

See component-specific LPs for detailed test cases:
- LP-111: Photon selection tests
- LP-112: Flare finalization tests
- LP-113: Wave/FPC voting tests
- LP-114: Focus convergence tests
- LP-115: Horizon predicate tests
- LP-116: Prism geometry tests

## Reference Implementation

**Primary Location**: `~/work/lux/consensus/`

**Component Directories**:
- `protocol/photon/` - VRF-based proposer selection
- `protocol/wave/` - FPC threshold voting
- `protocol/wave/fpc/` - FPC selector implementation
- `protocol/focus/` - Confidence accumulation
- `protocol/prism/` - DAG geometry
- `protocol/horizon/` - Finality predicates
- `protocol/quasar/` - Unified engine

**Repository**: https://github.com/luxfi/consensus

## Security Considerations

1. **VRF Security**: Photon selection requires secure VRF keys
2. **Sample Bias**: Wave requires cryptographic random sampling
3. **Confidence Gaming**: Focus resets prevent manipulation
4. **DAG Attacks**: Prism/Horizon detect conflicting vertices
5. **Finality Safety**: Flare only commits certified vertices

## References

[1] Quasar Consensus Protocol Specification. 2024.
[2] Micali, S., et al. "Verifiable Random Functions". FOCS 1999.
[3] Popov, S., et al. "FPC-BI: Fast Probabilistic Consensus". 2021.
[4] Team Rocket. "Snowflake to Avalanche". 2018.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
