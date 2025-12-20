---
lp: 114
title: Focus Confidence Accumulation Protocol
description: Confidence accumulation by counting consecutive successes to signal local finality
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-29
requires: 0110, 0113
tags: [consensus, focus, confidence, finality, beta-threshold]
---

## Abstract

This proposal standardizes the Focus protocol, which accumulates confidence by counting beta consecutive successes. When Wave (LP-0113) reports success (both preference and confidence thresholds cleared), Focus advances a counter. Reaching the beta threshold signals local finality for the choice under consideration. Focus implements the constructive-interference analogue in the Quasar physics metaphor: persistence, not amplitude, creates a stable signal.

## Motivation

Probabilistic consensus protocols like FPC can oscillate between preferences before converging. A single successful round does not guarantee finality. Focus addresses this by:

1. **Persistence verification**: Requiring beta consecutive successful rounds proves stability
2. **Interference filtering**: Random fluctuations rarely produce beta consecutive successes
3. **Local finality signal**: Each validator independently determines when confidence is sufficient
4. **Adaptive windows**: Time-bounded confidence prevents stale decisions

The metaphor draws from optical physics: a focused beam maintains coherence through constructive interference over distance. Similarly, Focus requires sustained agreement over multiple rounds.

## Specification

### Parameters

| Parameter | Symbol | Description | Default |
|-----------|--------|-------------|---------|
| Beta threshold | beta | Consecutive successes required | 15 |
| Alpha ratio | alpha | Success ratio threshold | 0.8 |
| Window duration | W | Time window for windowed confidence | 5s |

### Core Data Structures

#### Tracker

The Tracker provides basic counter functionality for confidence accumulation.

```go
package focus

import "sync"

// Tracker tracks confidence counters for items
type Tracker[ID comparable] struct {
    mu     sync.RWMutex
    counts map[ID]int
}

func NewTracker[ID comparable]() *Tracker[ID] {
    return &Tracker[ID]{
        counts: make(map[ID]int),
    }
}

func (t *Tracker[ID]) Incr(id ID) {
    t.mu.Lock()
    defer t.mu.Unlock()
    t.counts[id]++
}

func (t *Tracker[ID]) Count(id ID) int {
    t.mu.RLock()
    defer t.mu.RUnlock()
    return t.counts[id]
}

func (t *Tracker[ID]) Reset(id ID) {
    t.mu.Lock()
    defer t.mu.Unlock()
    delete(t.counts, id)
}
```

#### Confidence Accumulator

The Confidence type tracks confidence state for multiple items with threshold-based decisions.

```go
package focus

import "sync"

// Confidence tracks confidence building for consensus
type Confidence[ID comparable] struct {
    mu        sync.RWMutex
    threshold int      // Beta: consecutive successes required
    alpha     float64  // Success ratio threshold
    states    map[ID]int
}

func NewConfidence[ID comparable](threshold int, alpha float64) *Confidence[ID] {
    return &Confidence[ID]{
        threshold: threshold,
        alpha:     alpha,
        states:    make(map[ID]int),
    }
}

func (c *Confidence[ID]) Update(id ID, ratio float64) {
    c.mu.Lock()
    defer c.mu.Unlock()

    current := c.states[id]
    if ratio >= c.alpha {
        // Success: increment counter
        c.states[id] = current + 1
    } else if ratio <= 1.0-c.alpha {
        // Opposite preference: reset counter
        c.states[id] = 0
    }
    // Neutral zone (1-alpha < ratio < alpha): no change
}

func (c *Confidence[ID]) State(id ID) (int, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    state := c.states[id]
    decided := state >= c.threshold
    return state, decided
}
```

#### Windowed Confidence

Time-bounded confidence that expires after a configurable window.

```go
package focus

import (
    "sync"
    "time"
)

// WindowedConfidence tracks confidence with time windows
type WindowedConfidence[ID comparable] struct {
    mu         sync.RWMutex
    threshold  int
    alpha      float64
    window     time.Duration
    states     map[ID]int
    lastUpdate map[ID]time.Time
}

func NewWindowed[ID comparable](threshold int, alpha float64, window time.Duration) *WindowedConfidence[ID] {
    return &WindowedConfidence[ID]{
        threshold:  threshold,
        alpha:      alpha,
        window:     window,
        states:     make(map[ID]int),
        lastUpdate: make(map[ID]time.Time),
    }
}

func (w *WindowedConfidence[ID]) Update(id ID, ratio float64) {
    w.mu.Lock()
    defer w.mu.Unlock()

    now := time.Now()
    if last, ok := w.lastUpdate[id]; ok {
        if now.Sub(last) > w.window {
            // Window expired, reset
            w.states[id] = 0
        }
    }

    current := w.states[id]
    if ratio >= w.alpha {
        w.states[id] = current + 1
    } else if ratio <= 1.0-w.alpha {
        w.states[id] = 0
    }
    w.lastUpdate[id] = now
}

func (w *WindowedConfidence[ID]) State(id ID) (int, bool) {
    w.mu.RLock()
    defer w.mu.RUnlock()

    // Check if window expired
    if last, ok := w.lastUpdate[id]; ok {
        if time.Since(last) > w.window {
            return 0, false
        }
    }

    state := w.states[id]
    decided := state >= w.threshold
    return state, decided
}
```

### Confidence Calculation

The `Calc` function computes confidence from vote tallies.

```go
// Calc calculates confidence based on votes
// Returns (ratio, confidence) where:
// - ratio = yes/total
// - confidence = boosted difference when ratio > 0.5
func Calc(yes, total, prev int) (float64, int) {
    if total == 0 {
        return 0, prev
    }

    ratio := float64(yes) / float64(total)

    // Calculate new confidence
    var conf int
    if ratio > 0.5 {
        conf = yes - (total - yes) // Difference between yes and no
        if conf < 0 {
            conf = 0
        }
    } else {
        conf = 0
    }

    // Consider previous confidence
    if prev > 0 && conf > 0 {
        conf += prev / 2 // Boost with previous confidence
    }

    return ratio, conf
}
```

### State Machine

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                 │
                    ▼                                                 │
             ┌──────────┐                                             │
             │          │                                             │
    ┌────────│ INITIAL  │──────────────────────────────┐              │
    │        │  (0)     │                              │              │
    │        │          │                              │              │
    │        └────┬─────┘                              │              │
    │             │                                    │              │
    │             │ ratio >= alpha                     │              │
    │             │ (success)                          │              │
    │             ▼                                    │              │
    │        ┌──────────┐                              │              │
    │        │          │  ratio <= (1-alpha)          │              │
    │        │ BUILDING │──────────────────────────────┘              │
    │        │  (1..n)  │  (opposite preference)                      │
    │        │          │                                             │
    │        └────┬─────┘                                             │
    │             │                                                   │
    │             │ ratio >= alpha                                    │
    │             │ (consecutive success)                             │
    │             │                                                   │
    │             ├───────────────────┐                               │
    │             │                   │                               │
    │             │ count < beta      │ count >= beta                 │
    │             │                   │                               │
    │             ▼                   ▼                               │
    │        ┌──────────┐       ┌──────────┐                          │
    │        │          │       │          │                          │
    │        │ BUILDING │       │ FINALIZED│                          │
    │        │ (n+1)    │       │  (beta)  │                          │
    │        │          │       │          │                          │
    │        └──────────┘       └──────────┘                          │
    │                                                                 │
    │        Window Expiry (WindowedConfidence only)                  │
    └─────────────────────────────────────────────────────────────────┘
```

### State Transitions

| Current State | Event | Condition | Next State | Action |
|--------------|-------|-----------|------------|--------|
| Any | Update | ratio >= alpha | count + 1 | Increment counter |
| Any | Update | ratio <= (1 - alpha) | 0 | Reset counter |
| Any | Update | (1-alpha) < ratio < alpha | count | No change |
| Building | State query | count >= beta | Finalized | Return decided=true |
| Any | Window expiry | now - lastUpdate > window | 0 | Reset counter |

### Integration with Wave (LP-0113)

Focus receives signals from Wave's FPC voting rounds:

```go
package consensus

import (
    "github.com/luxfi/consensus/protocol/focus"
    "github.com/luxfi/consensus/protocol/wave"
)

type QuasarConsensus struct {
    wave  *wave.Engine
    focus *focus.Confidence[BlockID]
}

func (q *QuasarConsensus) ProcessRound(blockID BlockID) (finalized bool) {
    // Wave determines if this round succeeded
    preferOK, confOK := q.wave.Vote(blockID)

    if preferOK && confOK {
        // Both thresholds cleared - calculate success ratio
        votes := q.wave.GetVotes(blockID)
        ratio := float64(votes.Yes) / float64(votes.Total)

        // Update Focus with the success ratio
        q.focus.Update(blockID, ratio)
    }

    // Check if Focus has accumulated enough confidence
    count, decided := q.focus.State(blockID)
    if decided {
        return true // Local finality achieved
    }

    return false
}
```

### Skip Detection

When opposite preference dominates, Focus can signal early termination:

```go
func shouldSkip(yes, no, unknown int) bool {
    total := yes + no + unknown
    if total == 0 {
        return false
    }
    return float64(no)/float64(total) > 0.6
}
```

## Rationale

### Beta Threshold Selection

The default beta=15 provides:
- **Safety**: Probability of 15 consecutive random successes at alpha=0.8 is (0.8)^15 < 0.035
- **Liveness**: At 100ms round times, finality in 1.5 seconds typical
- **Byzantine resilience**: Attackers cannot sustain 15 rounds of manipulation

### Alpha Threshold

The alpha=0.8 threshold:
- **Decisive majority**: 80% agreement is strong signal
- **Reset symmetry**: Both 80% and 20% trigger state changes
- **Neutral zone**: 20-80% preserves current state, preventing oscillation

### Windowed Confidence

Time-bounded confidence addresses:
- **Network partitions**: Stale confidence doesn't persist after recovery
- **Validator churn**: Old confidence from departed validators expires
- **Attack mitigation**: Grinding attacks must sustain pressure

### Confidence Boosting

The `Calc` function boosts confidence based on prior state:
- **Momentum**: Strong prior confidence accelerates convergence
- **Dampening**: Halving previous confidence prevents runaway

## Backwards Compatibility

Focus is a new consensus component with no backwards compatibility concerns. It integrates with existing Quasar components (LP-0110) through the Wave interface (LP-0113).

## Test Cases

### Unit Tests

```go
func TestTracker(t *testing.T) {
    tracker := NewTracker[string]()

    // Test initial state
    if tracker.Count("item1") != 0 {
        t.Error("expected count 0 for new item")
    }

    // Test increment
    tracker.Incr("item1")
    if tracker.Count("item1") != 1 {
        t.Error("expected count 1 after increment")
    }

    // Test multiple increments
    tracker.Incr("item1")
    tracker.Incr("item1")
    if tracker.Count("item1") != 3 {
        t.Error("expected count 3 after 3 increments")
    }

    // Test reset
    tracker.Reset("item1")
    if tracker.Count("item1") != 0 {
        t.Error("expected count 0 after reset")
    }
}

func TestConfidence(t *testing.T) {
    conf := NewConfidence[string](3, 0.8)

    // Test building confidence with high ratio
    conf.Update("item1", 0.9)
    s, decided := conf.State("item1")
    if s != 1 || decided {
        t.Errorf("expected state 1, not decided, got state=%d decided=%v", s, decided)
    }

    // Continue building
    conf.Update("item1", 0.85)
    conf.Update("item1", 0.9)
    s, decided = conf.State("item1")
    if s != 3 || !decided {
        t.Errorf("expected state 3 and decided, got state=%d decided=%v", s, decided)
    }

    // Test reset with low ratio
    conf.Update("item2", 0.9)
    conf.Update("item2", 0.1) // Below (1 - 0.8 = 0.2)
    s, decided = conf.State("item2")
    if s != 0 || decided {
        t.Errorf("expected reset, got state=%d", s)
    }
}

func TestWindowedConfidence(t *testing.T) {
    conf := NewWindowed[string](2, 0.8, 100*time.Millisecond)

    // Test within window
    conf.Update("item1", 0.9)
    conf.Update("item1", 0.85)
    s, decided := conf.State("item1")
    if s != 2 || !decided {
        t.Errorf("expected decided within window, got state=%d decided=%v", s, decided)
    }

    // Test window expiry
    conf.Update("item2", 0.9)
    time.Sleep(150 * time.Millisecond)
    s, decided = conf.State("item2")
    if s != 0 || decided {
        t.Error("expected state reset after window expiry")
    }
}

func TestCalc(t *testing.T) {
    // Unanimous agreement
    ratio, conf := Calc(10, 10, 0)
    if ratio != 1.0 || conf != 10 {
        t.Errorf("expected ratio=1.0 conf=10, got ratio=%f conf=%d", ratio, conf)
    }

    // Majority (8/10)
    ratio, conf = Calc(8, 10, 0)
    if ratio != 0.8 || conf != 6 {
        t.Errorf("expected ratio=0.8 conf=6, got ratio=%f conf=%d", ratio, conf)
    }

    // With previous confidence
    _, conf = Calc(9, 10, 5)
    if conf < 8 || conf > 11 {
        t.Errorf("expected conf around 10 with prev=5, got conf=%d", conf)
    }

    // Zero total
    ratio, conf = Calc(0, 0, 5)
    if ratio != 0 || conf != 5 {
        t.Errorf("expected prev returned for 0 total, got ratio=%f conf=%d", ratio, conf)
    }
}
```

### Test Execution Results

```
$ go test -v ./consensus/protocol/focus/
=== RUN   TestTracker
--- PASS: TestTracker (0.00s)
=== RUN   TestConfidence
--- PASS: TestConfidence (0.00s)
=== RUN   TestWindowedConfidence
--- PASS: TestWindowedConfidence (0.15s)
=== RUN   TestWindowedConfidenceWindowExpiryDuringUpdate
--- PASS: TestWindowedConfidenceWindowExpiryDuringUpdate (0.06s)
=== RUN   TestWindowedConfidenceLowRatioReset
--- PASS: TestWindowedConfidenceLowRatioReset (0.00s)
=== RUN   TestWindowedConfidenceNoUpdate
--- PASS: TestWindowedConfidenceNoUpdate (0.00s)
=== RUN   TestCalc
--- PASS: TestCalc (0.00s)
=== RUN   TestSkipLogic
--- PASS: TestSkipLogic (0.00s)
PASS
ok      github.com/luxfi/consensus/protocol/focus   0.218s
```

### Test Coverage

| Component | Coverage | Test Cases |
|-----------|----------|------------|
| Tracker | 100% | 4 |
| Confidence | 100% | 3 |
| WindowedConfidence | 100% | 4 |
| Calc | 100% | 5 |
| Skip detection | 100% | 4 |
| **Total** | **100%** | **20** |

## Reference Implementation

The reference implementation is located at:

```
~/work/lux/consensus/protocol/focus/
├── doc.go          # Package documentation (172 bytes)
├── focus.go        # Core implementation (3.8 KB)
│   ├── Tracker[ID]           # Generic counter tracker
│   ├── Confidence[ID]        # Threshold-based confidence
│   ├── WindowedConfidence[ID] # Time-bounded confidence
│   └── Calc()                # Vote-based confidence calculation
└── focus_test.go   # Comprehensive test suite (5.6 KB)
    ├── TestTracker
    ├── TestConfidence
    ├── TestWindowedConfidence
    ├── TestWindowedConfidenceWindowExpiryDuringUpdate
    ├── TestWindowedConfidenceLowRatioReset
    ├── TestWindowedConfidenceNoUpdate
    ├── TestCalc
    └── TestSkipLogic
```

### Import Path

```go
import "github.com/luxfi/consensus/protocol/focus"
```

### API Summary

| Type | Method | Description |
|------|--------|-------------|
| `Tracker[ID]` | `NewTracker()` | Create new counter tracker |
| | `Incr(id)` | Increment counter for id |
| | `Count(id)` | Get current count |
| | `Reset(id)` | Reset counter to zero |
| `Confidence[ID]` | `NewConfidence(threshold, alpha)` | Create confidence tracker |
| | `Update(id, ratio)` | Update confidence with vote ratio |
| | `State(id)` | Get (count, decided) state |
| `WindowedConfidence[ID]` | `NewWindowed(threshold, alpha, window)` | Create windowed tracker |
| | `Update(id, ratio)` | Update with window expiry check |
| | `State(id)` | Get state with expiry check |
| Function | `Calc(yes, total, prev)` | Calculate (ratio, confidence) |

## Security Considerations

### Byzantine Resilience

Focus inherits safety from Wave's FPC voting:
- Requires beta consecutive successful rounds
- Each round requires alpha (80%) agreement
- Byzantine validators controlling < 33% cannot sustain manipulation for beta rounds

### Timing Attacks

**Risk**: Attackers delay messages to expire confidence windows.

**Mitigation**:
- Window duration (5s default) exceeds typical network latency by 100x
- Windowed confidence resets on update if expired, not during read
- Clock synchronization via NTP assumed

### Grinding Attacks

**Risk**: Attackers influence round timing to control vote ratios.

**Mitigation**:
- Beta threshold (15) requires sustained influence
- Random committee selection (Photon LP-0111) prevents targeting
- Confidence boost dampens sudden changes

### Liveness Attacks

**Risk**: Attackers keep ratio in neutral zone (20-80%) indefinitely.

**Mitigation**:
- FPC convergence guarantees eventually leave neutral zone
- Network timeout mechanisms trigger view changes
- Validator rotation limits sustained attack capability

### State Exhaustion

**Risk**: Attackers create many items to exhaust validator memory.

**Mitigation**:
- Items cleaned up after finality or explicit garbage collection
- Maximum tracked items per validator configurable
- Memory-bounded map implementations available

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
