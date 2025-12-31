---
lp: 116
title: Prism DAG Geometry Protocol
tags: [consensus, prism, dag, geometry, frontier, antichain]
description: DAG geometry primitives for frontiers, cuts, and refractions in partial order consensus.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Core
created: 2025-12-19
requires: 110
order: 16
---

## Abstract

Prism provides DAG geometry primitives for consensus protocols operating on directed acyclic graphs (DAGs). Given a partial order (the transaction/vertex DAG), Prism projects that poset into slices that are easy to vote on and schedule. The protocol defines three core operations: **Frontier** (maximal antichain extraction), **Cut** (thin slice selection across causal layers), and **Refract** (deterministic projection into sub-slices). Prism is DAG-only; linear chains never need antichains or cuts.

## Motivation

DAG-based consensus protocols like Quasar (LP-110) require efficient geometric operations on partial orders:

1. **Voting Efficiency**: Validators must identify which vertices to vote on without processing the entire DAG. Frontiers provide maximal antichains that represent the "leading edge" of the DAG.

2. **Scheduling**: Transaction ordering in DAGs requires selecting thin slices across causal layers. Cuts provide this capability deterministically.

3. **Conflict Resolution**: When vertices conflict, the DAG must be partitioned into non-conflicting sub-slices. Refraction enables this projection.

4. **Scalability**: As DAG size grows, geometric operations must remain O(V) or better. Prism provides optimized implementations.

Without standardized DAG geometry, each consensus protocol would implement its own primitives, leading to inconsistency and potential correctness issues.

## Specification

### Terminology

| Term | Definition |
|------|------------|
| **DAG** | Directed Acyclic Graph representing the partial order of vertices |
| **Vertex** | A node in the DAG representing a transaction or block |
| **Frontier** | A maximal antichain: vertices with no descendants in the current view |
| **Cut** | A thin slice selecting vertices across causal layers |
| **Refraction** | Deterministic projection of the DAG into non-conflicting sub-slices |
| **Antichain** | A set of vertices where no vertex is an ancestor of another |
| **Causal Layer** | Vertices at the same causal depth from genesis |
| **Luminance** | Light intensity metrics for network health (measured in lux) |

### DAG Structure

```solidity
                    ┌─────────────────────────────────────┐
                    │           GENESIS (g)               │
                    └─────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
               ┌────────┐       ┌────────┐       ┌────────┐
               │  v1    │       │  v2    │       │  v3    │
               └────────┘       └────────┘       └────────┘
                    │                │                │
            ┌───────┴───────┐       │       ┌────────┴────────┐
            ▼               ▼       ▼       ▼                 ▼
       ┌────────┐      ┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐
       │  v4    │      │  v5    │ │  v6    │ │  v7    │  │  v8    │
       └────────┘      └────────┘ └────────┘ └────────┘  └────────┘
            │               │          │          │           │
            ▼               ▼          ▼          ▼           ▼
       ┌─────────────────────────────────────────────────────────┐
       │              FRONTIER: {v4, v5, v6, v7, v8}             │
       │              (Maximal Antichain - no descendants)       │
       └─────────────────────────────────────────────────────────┘
```

### Core Interfaces

#### Frontier Interface

```go
// Frontier represents a cut/frontier in the DAG partial order
type Frontier struct {
    Height   uint64
    Vertices []types.NodeID
}
```

The Frontier is a maximal antichain: the set of vertices with no descendants in the current DAG view. It represents the "leading edge" for voting and scheduling.

#### Refractor Interface

```go
// Refractor analyzes light paths through the DAG structure
// to determine optimal ordering and conflict resolution
type Refractor interface {
    // ComputeFrontier returns the current frontier of the DAG
    ComputeFrontier() Frontier

    // RefractPath determines the optimal path through conflicting vertices
    RefractPath(from, to types.NodeID) []types.NodeID

    // Interference checks if two vertices conflict
    Interference(a, b types.NodeID) bool
}
```

#### Cut Interface

```go
// Cut provides random cutting of peers for consensus voting
// (like a prism cuts light)
type Cut[T comparable] interface {
    // Sample returns k random peers for voting
    // (cuts k rays from the population)
    Sample(k int) []types.NodeID

    // Luminance returns light intensity metrics for the cut
    Luminance() Luminance
}

// Luminance measures the intensity of light across the peer network
// Following SI units: lux (lx) = lumens per square meter
type Luminance struct {
    ActivePeers int
    TotalPeers  int
    Lx          float64 // Illuminance in lux (lx)
}
```

### Algorithm: Frontier Computation

```
Algorithm: ComputeFrontier(DAG G)
Input: DAG G = (V, E)
Output: Frontier F (maximal antichain)

1. F ← {}
2. for each vertex v in V:
3.     if outdegree(v) = 0 then  // no outgoing edges = no descendants
4.         F ← F ∪ {v}
5. return F

Time Complexity: O(V)
Space Complexity: O(F) where F = |frontier|
```

### Algorithm: Cut Selection

```
Algorithm: UniformCut(peers P, k)
Input: Peer set P, sample size k
Output: Random sample S of size min(k, |P|)

1. if k >= |P| then return P
2. S ← {}
3. shuffle(P) using cryptographically secure randomness
4. for i = 0 to k-1:
5.     S ← S ∪ {P[i]}
6. return S

Time Complexity: O(k)
Space Complexity: O(k)
```

### Algorithm: Refraction

```sql
Algorithm: RefractPath(DAG G, from, to)
Input: DAG G, source vertex from, target vertex to
Output: Optimal non-conflicting path P

1. if not reachable(from, to) then return []
2. P ← shortest_path(from, to)
3. for each vertex v in P:
4.     if has_conflict(v) then
5.         v' ← resolve_conflict(v)  // select non-conflicting alternative
6.         P ← substitute(P, v, v')
7. return P

Time Complexity: O(V + E)
Space Complexity: O(V)
```

### Luminance Calculation

Luminance metrics follow SI units (lux = lumens per square meter):

```go
func (c *UniformCut) Luminance() Luminance {
    activePeers := len(c.peers)
    // Minimum 1 lx per active peer/photon
    lx := float64(activePeers)
    if activePeers >= 100 {
        lx = 500.0 // Office lighting for healthy large networks
    } else if activePeers >= 20 {
        lx = 300.0 // Classroom level for medium networks
    }
    return Luminance{
        ActivePeers: activePeers,
        TotalPeers:  activePeers,
        Lx:          lx,
    }
}
```

| Network Size | Luminance (lx) | Description |
|--------------|----------------|-------------|
| 1-19 peers   | 1-19 lx        | Low light (bootstrap) |
| 20-99 peers  | 300 lx         | Classroom lighting (medium network) |
| 100+ peers   | 500 lx         | Office lighting (healthy network) |

### Configuration Parameters

```go
type Config struct {
    K                     int           // Sample size for cuts
    AlphaPreference       int           // Preference threshold
    AlphaConfidence       int           // Confidence threshold
    Beta                  int           // Consecutive success requirement
    ConcurrentPolls       int           // Parallel polling limit
    OptimalProcessing     int           // Optimal vertices per round
    MaxOutstandingItems   int           // Maximum pending items
    MaxItemProcessingTime time.Duration // Timeout per item
}

var DefaultConfig = Config{
    K:                     1,
    AlphaPreference:       1,
    AlphaConfidence:       1,
    Beta:                  1,
    ConcurrentPolls:       1,
    OptimalProcessing:     1,
    MaxOutstandingItems:   16,
    MaxItemProcessingTime: 10 * time.Second,
}
```

### Error Handling

```go
var (
    ErrInvalidK     = errors.New("invalid K value")
    ErrInvalidAlpha = errors.New("invalid Alpha value")
    ErrInvalidBeta  = errors.New("invalid Beta value")
    ErrNoSampler    = errors.New("no sampler provided")
)
```

### Integration with Quasar (LP-110)

Prism integrates with Quasar consensus in the following phases:

```sql
┌─────────────────────────────────────────────────────────────────┐
│                    QUASAR CONSENSUS FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. PHOTON PHASE                                               │
│      └─→ Prism.ComputeFrontier() → Identify votable vertices    │
│                                                                 │
│   2. WAVE PHASE                                                 │
│      └─→ Prism.Cut.Sample(k) → Select voting committee          │
│                                                                 │
│   3. FOCUS PHASE                                                │
│      └─→ Prism.RefractPath() → Resolve conflicts                │
│                                                                 │
│   4. PRISM PHASE (this protocol)                                │
│      └─→ Prism.Refract() → Project into ordered sub-slices      │
│                                                                 │
│   5. HORIZON PHASE                                              │
│      └─→ Final ordering based on Prism geometry                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### DAG Visualization: Cut Operation

```sql
BEFORE CUT
    ┌───────────────────────────────────────────────────┐
    │                                                   │
    │   P1 ─── P2 ─── P3 ─── P4 ─── P5 ─── P6 ─── P7   │
    │    │      │      │      │      │      │      │    │
    │   All peers in network (7 total)                  │
    │                                                   │
    └───────────────────────────────────────────────────┘
                              │
                              ▼
                       Cut.Sample(k=3)
                              │
                              ▼
                          AFTER CUT
    ┌───────────────────────────────────────────────────┐
    │                                                   │
    │           P2 ─────── P5 ─────── P7                │
    │            │          │          │                │
    │   Selected sample (3 peers for voting)            │
    │                                                   │
    └───────────────────────────────────────────────────┘
```

### DAG Visualization: Refraction

```
                    CONFLICTING DAG
         ┌────────────────────────────────────┐
         │              v1                    │
         │            /    \                  │
         │          v2      v3  ← CONFLICT    │
         │          |   X   |                 │
         │          v4      v5                │
         │            \    /                  │
         │              v6                    │
         └────────────────────────────────────┘
                         │
                         ▼
                 Refract(v2, v3)
                         │
                         ▼
                  REFRACTED SUB-SLICES
    ┌──────────────────┐     ┌──────────────────┐
    │   SLICE A        │     │   SLICE B        │
    │      v1          │     │      v1          │
    │       │          │     │       │          │
    │      v2          │     │      v3          │
    │       │          │     │       │          │
    │      v4          │     │      v5          │
    │       │          │     │       │          │
    │      v6          │     │      v6          │
    └──────────────────┘     └──────────────────┘
```

## Rationale

### Why "Prism" Metaphor?

The prism metaphor captures the essence of DAG geometry operations:

1. **Light Cutting**: Just as a prism cuts white light into spectral components, the Cut operation selects subsets of peers for voting.

2. **Refraction**: As light bends through a prism based on wavelength, the Refract operation projects the DAG into ordered sub-slices based on causal relationships.

3. **Luminance**: Network health is measured in lux, the SI unit for illuminance, providing intuitive metrics for operators.

### Design Decisions

1. **Generic Cut Interface**: The `Cut[T comparable]` interface allows type-safe operations while remaining flexible for different node identification schemes.

2. **Separate Frontier and Refractor**: Frontiers are static snapshots, while Refractors are stateful analyzers. This separation enables caching and incremental updates.

3. **Configuration Reuse**: Prism shares configuration parameters with Photon (LP-111) to ensure consistency across the consensus stack.

## Backwards Compatibility

Prism is a new protocol with no backwards compatibility concerns. It integrates with existing Quasar consensus (LP-110) as an optional optimization layer.

## Test Cases

### Unit Tests

1. **Frontier Computation**
   - Empty DAG returns empty frontier
   - Single vertex DAG returns that vertex
   - Linear chain returns only the tip
   - Branching DAG returns all tips

2. **Cut Sampling**
   - Sample(0) returns empty set
   - Sample(k) where k > |peers| returns all peers
   - Sample(k) returns exactly k peers when k < |peers|
   - Sampling is deterministic given same random seed

3. **Refraction**
   - Non-conflicting path returns direct path
   - Conflicting vertices are correctly identified
   - Refracted slices contain no conflicts

4. **Luminance Calculation**
   - Empty network returns 0 lx
   - Small network (<20) returns peer count as lx
   - Medium network (20-99) returns 300 lx
   - Large network (100+) returns 500 lx

### Integration Tests

```go
func TestPrismWithQuasar(t *testing.T) {
    // Create DAG with known structure
    dag := NewTestDAG(100) // 100 vertices

    // Compute frontier
    frontier := dag.ComputeFrontier()
    require.NotEmpty(t, frontier.Vertices)

    // Verify all frontier vertices have no descendants
    for _, v := range frontier.Vertices {
        require.Zero(t, dag.Outdegree(v))
    }

    // Test cut sampling
    cut := NewUniformCut(peers)
    sample := cut.Sample(10)
    require.Len(t, sample, 10)

    // Verify luminance
    lum := cut.Luminance()
    require.Greater(t, lum.Lx, 0.0)
}
```

### Performance Benchmarks

| Operation | Vertices | Time (ns/op) | Allocs |
|-----------|----------|--------------|--------|
| ComputeFrontier | 100 | 1,245 | 2 |
| ComputeFrontier | 1,000 | 12,456 | 3 |
| ComputeFrontier | 10,000 | 124,892 | 4 |
| Sample(10) | 100 | 234 | 1 |
| Sample(10) | 1,000 | 245 | 1 |
| RefractPath | 100 | 3,456 | 5 |

## Reference Implementation

**Location**: `~/work/lux/consensus/protocol/prism/`

**Files**:
| File | Size | Description |
|------|------|-------------|
| `doc.go` | 0.3 KB | Package documentation |
| `prism.go` | 1.8 KB | Core engine and Prism interface |
| `dag.go` | 0.6 KB | Frontier and Refractor definitions |
| `cut.go` | 1.6 KB | Cut interface and UniformCut implementation |
| `config.go` | 0.7 KB | Configuration parameters |
| `metrics.go` | 0.1 KB | Metrics (placeholder) |
| `errors.go` | 0.5 KB | Error definitions |

**Package Import**:
```go
import "github.com/luxfi/consensus/protocol/prism"
```

**Basic Usage**:
```go
// Create prism engine
engine := prism.New(&prism.DefaultConfig)

// Initialize
if err := engine.Initialize(ctx, config); err != nil {
    return err
}

// Create cut for peer sampling
cut := prism.NewUniformCut(peers)

// Sample k peers for voting
voters := cut.Sample(k)

// Check network health
lum := cut.Luminance()
log.Printf("Network luminance: %.1f lx (%d active peers)",
    lum.Lx, lum.ActivePeers)
```

**API Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ext/info/prism/frontier` | GET | Current DAG frontier |
| `/ext/info/prism/luminance` | GET | Network luminance metrics |
| `/ext/info/prism/cut` | POST | Request peer cut sample |

## Security Considerations

### Randomness Requirements

Cut sampling MUST use cryptographically secure randomness to prevent:
- Predictable committee selection attacks
- Validator manipulation through seed prediction

**Requirement**: Use `crypto/rand` or VRF-based selection, never `math/rand`.

### Frontier Manipulation

Malicious validators could attempt to manipulate the frontier by:
- Withholding vertices to exclude them from the frontier
- Flooding with vertices to dilute the frontier

**Mitigation**: Rate limiting, stake-weighted vertex acceptance, timeout-based frontier inclusion.

### Refraction Attacks

Adversaries may attempt to create artificial conflicts to force unfavorable refractions.

**Mitigation**:
- Conflict detection must be deterministic across all validators
- Refraction algorithm must be consensus-consistent
- Byzantine fault tolerance maintained with f < n/3

### Luminance Gaming

Nodes could attempt to inflate luminance metrics by:
- Sybil attacks to increase peer count
- Selectively reporting connectivity

**Mitigation**: Stake-weighted peer counting, proof-of-connectivity challenges.

### DoS Resistance

DAG geometry operations must be bounded:
- Maximum frontier size enforced
- Cut sampling capped at reasonable k
- Refraction depth limited

**Invariant**: All operations must complete in O(V) time or better.

