# LP-608: Snowman++ Consensus Protocol

## Overview

LP-608 standardizes the Snowman++ consensus protocol across Lux, Zoo, and Hanzo chains. This ensures exactly one consensus mechanism with optimized block production, reduced latency, and enhanced finality guarantees.

## Motivation

Current consensus challenges:
- **Block Production Inequality**: Some validators produce more blocks
- **Time-to-Finality**: Variable finality times
- **MEV Opportunities**: Predictable block producers
- **Network Partitions**: Handling network splits

Our solution (Snowman++) provides:
- **Fair Block Production**: Weighted random selection
- **Fast Finality**: Sub-second finality
- **MEV Resistance**: Unpredictable proposers
- **Partition Tolerance**: Graceful degradation

## Technical Specification

### Core Snowman++ Structure

```go
package snowman

import (
    "github.com/luxfi/lux/snow/consensus/snowball"
    "github.com/luxfi/lux/crypto/bls"
)

// SnowmanPlusPlus - EXACTLY ONE consensus implementation
type SnowmanPlusPlus struct {
    // Core Snowman
    params           Parameters
    blocks           map[ids.ID]Block
    preferred        ids.ID
    lastAccepted     ids.ID
    
    // Snowman++ enhancements
    proposerWindow   ProposerWindow
    vrfProof         VRFProof
    dynamicTimeout   DynamicTimeout
    
    // Metrics
    metrics          ConsensusMetrics
}

// Parameters - CANONICAL consensus parameters
var CanonicalConsensusParams = Parameters{
    // Snowball parameters
    K:                20,    // Sample size
    Alpha:            15,    // Quorum size
    BetaVirtuous:     15,    // Virtuous confidence
    BetaRogue:        20,    // Rogue confidence
    
    // Snowman parameters
    Parents:          2,     // Number of parents
    BatchSize:        30,    // Batch size for voting
    
    // Snowman++ parameters
    ProposerWindow:   5,     // Seconds for block proposal
    MinBlockDelay:    2,     // Minimum seconds between blocks
    
    // Network parameters
    ConcurrentRepolls: 4,    // Parallel queries
    OptimalProcessing: 10,   // Target processing blocks
}

// Block with Snowman++ fields
type Block interface {
    // Standard block interface
    ID() ids.ID
    Parent() ids.ID
    Height() uint64
    Timestamp() time.Time
    
    // Snowman++ additions
    ProposerID() ids.NodeID
    VRFProof() []byte
    ProposerScore() uint64
}

// ProposerWindow for fair selection
type ProposerWindow struct {
    startTime    time.Time
    duration     time.Duration
    proposers    []WeightedProposer
}

// WeightedProposer with VRF selection
type WeightedProposer struct {
    NodeID       ids.NodeID
    Weight       uint64
    VRFPublicKey []byte
}
```

### VRF-Based Proposer Selection

```go
// VRFProof for verifiable random proposer selection
type VRFProof struct {
    PublicKey []byte
    Proof     []byte
    Output    []byte
}

// SelectProposer using VRF
func (s *SnowmanPlusPlus) SelectProposer(
    height uint64,
    previousBlock ids.ID,
) (ids.NodeID, *VRFProof, error) {
    // Get validator set
    validators := s.getValidators()
    
    // Calculate total weight
    totalWeight := uint64(0)
    for _, v := range validators {
        totalWeight += v.Weight
    }
    
    // Each validator computes VRF
    seed := append(previousBlock[:], big.NewInt(int64(height)).Bytes()...)
    
    bestScore := uint64(0)
    var bestProposer ids.NodeID
    var bestProof *VRFProof
    
    for _, v := range validators {
        // Compute VRF
        proof, output := vrf.Prove(v.VRFSecretKey, seed)
        
        // Calculate score (weighted)
        score := binary.BigEndian.Uint64(output[:8])
        weightedScore := score * v.Weight / totalWeight
        
        if weightedScore > bestScore {
            bestScore = weightedScore
            bestProposer = v.NodeID
            bestProof = &VRFProof{
                PublicKey: v.VRFPublicKey,
                Proof:     proof,
                Output:    output,
            }
        }
    }
    
    return bestProposer, bestProof, nil
}

// VerifyProposer checks VRF proof
func (s *SnowmanPlusPlus) VerifyProposer(
    block Block,
) error {
    // Reconstruct seed
    parent := s.blocks[block.Parent()]
    seed := append(parent.ID()[:], big.NewInt(int64(block.Height())).Bytes()...)
    
    // Verify VRF proof
    vrfProof := block.VRFProof()
    valid := vrf.Verify(
        vrfProof.PublicKey,
        seed,
        vrfProof.Proof,
        vrfProof.Output,
    )
    
    if !valid {
        return ErrInvalidVRFProof
    }
    
    // Verify proposer matches
    score := s.calculateScore(vrfProof.Output, block.ProposerID())
    if score != block.ProposerScore() {
        return ErrInvalidProposerScore
    }
    
    return nil
}
```

### Dynamic Timeout Adjustment

```go
// DynamicTimeout adjusts based on network conditions
type DynamicTimeout struct {
    baseTimeout      time.Duration
    currentTimeout   time.Duration
    minTimeout       time.Duration
    maxTimeout       time.Duration
    
    // Network metrics
    avgResponseTime  time.Duration
    successRate      float64
}

// AdjustTimeout based on network conditions
func (dt *DynamicTimeout) AdjustTimeout() time.Duration {
    // If high success rate, decrease timeout
    if dt.successRate > 0.95 {
        dt.currentTimeout = time.Duration(
            float64(dt.currentTimeout) * 0.9,
        )
    } else if dt.successRate < 0.8 {
        // If low success rate, increase timeout
        dt.currentTimeout = time.Duration(
            float64(dt.currentTimeout) * 1.1,
        )
    }
    
    // Bound by min/max
    if dt.currentTimeout < dt.minTimeout {
        dt.currentTimeout = dt.minTimeout
    } else if dt.currentTimeout > dt.maxTimeout {
        dt.currentTimeout = dt.maxTimeout
    }
    
    return dt.currentTimeout
}

// GetQueryTimeout for network requests
func (s *SnowmanPlusPlus) GetQueryTimeout() time.Duration {
    return s.dynamicTimeout.AdjustTimeout()
}
```

### Optimized Block Processing

```go
// ProcessBlock with Snowman++ optimizations
func (s *SnowmanPlusPlus) ProcessBlock(
    block Block,
) error {
    // Verify proposer (VRF)
    if err := s.VerifyProposer(block); err != nil {
        return err
    }
    
    // Check timing constraints
    if err := s.checkBlockTiming(block); err != nil {
        return err
    }
    
    // Add to processing set
    s.blocks[block.ID()] = block
    
    // Update preference
    if s.shouldUpdatePreference(block) {
        s.updatePreference(block.ID())
    }
    
    // Check if we should vote
    if s.shouldVote(block) {
        s.issueVote(block.ID())
    }
    
    // Try to accept blocks
    s.tryAcceptBlocks()
    
    return nil
}

// checkBlockTiming enforces minimum delay
func (s *SnowmanPlusPlus) checkBlockTiming(
    block Block,
) error {
    parent := s.blocks[block.Parent()]
    timeDiff := block.Timestamp().Sub(parent.Timestamp())
    
    if timeDiff < s.params.MinBlockDelay {
        return ErrBlockTooEarly
    }
    
    // Check proposer window
    expectedTime := s.calculateExpectedTime(block)
    actualTime := block.Timestamp()
    
    if actualTime.Before(expectedTime) {
        return ErrOutsideProposerWindow
    }
    
    if actualTime.After(expectedTime.Add(s.params.ProposerWindow)) {
        return ErrOutsideProposerWindow
    }
    
    return nil
}
```

### Consensus State Machine

```go
// ConsensusState tracks voting progress
type ConsensusState struct {
    // Confidence counters
    confidence map[ids.ID]int
    
    // Vote tracking
    votes      map[ids.ID]map[ids.NodeID]Vote
    
    // Finalized blocks
    finalized  map[ids.ID]bool
}

// RecordVote from validator
func (cs *ConsensusState) RecordVote(
    voter ids.NodeID,
    blockID ids.ID,
    vote Vote,
) {
    if cs.votes[blockID] == nil {
        cs.votes[blockID] = make(map[ids.NodeID]Vote)
    }
    
    cs.votes[blockID][voter] = vote
    
    // Update confidence
    if vote == VoteYes {
        cs.confidence[blockID]++
    }
}

// CheckFinality determines if block is final
func (cs *ConsensusState) CheckFinality(
    blockID ids.ID,
    params Parameters,
) bool {
    // Already finalized
    if cs.finalized[blockID] {
        return true
    }
    
    // Check confidence threshold
    confidence := cs.confidence[blockID]
    
    if confidence >= params.BetaVirtuous {
        cs.finalized[blockID] = true
        return true
    }
    
    return false
}
```

### Adaptive Sampling

```go
// AdaptiveSampling adjusts K based on network size
type AdaptiveSampling struct {
    baseK        int
    currentK     int
    networkSize  int
    
    // Performance metrics
    latency      time.Duration
    throughput   float64
}

// GetSampleSize returns adaptive K
func (as *AdaptiveSampling) GetSampleSize() int {
    // Adjust based on network size
    if as.networkSize < 100 {
        as.currentK = as.baseK / 2
    } else if as.networkSize > 1000 {
        as.currentK = as.baseK * 2
    } else {
        as.currentK = as.baseK
    }
    
    // Adjust based on latency
    if as.latency > 500*time.Millisecond {
        as.currentK = int(float64(as.currentK) * 0.8)
    }
    
    // Minimum K
    if as.currentK < 5 {
        as.currentK = 5
    }
    
    return as.currentK
}

// Sample validators for voting
func (s *SnowmanPlusPlus) Sample() []ids.NodeID {
    k := s.adaptiveSampling.GetSampleSize()
    validators := s.getValidators()
    
    // Weighted sampling
    selected := make([]ids.NodeID, 0, k)
    totalWeight := s.getTotalWeight()
    
    for i := 0; i < k; i++ {
        r := rand.Int63n(totalWeight)
        cumWeight := int64(0)
        
        for _, v := range validators {
            cumWeight += int64(v.Weight)
            if cumWeight > r {
                selected = append(selected, v.NodeID)
                break
            }
        }
    }
    
    return selected
}
```

### Fork Resolution

```go
// ForkResolver handles chain reorganization
type ForkResolver struct {
    chains    map[ids.ID]*Chain
    maxDepth  int
}

// ResolveFork between competing chains
func (fr *ForkResolver) ResolveFork(
    chain1, chain2 ids.ID,
) ids.ID {
    // Find common ancestor
    ancestor := fr.findCommonAncestor(chain1, chain2)
    
    // Calculate chain weights
    weight1 := fr.calculateChainWeight(chain1, ancestor)
    weight2 := fr.calculateChainWeight(chain2, ancestor)
    
    // Choose heavier chain
    if weight1 > weight2 {
        return chain1
    } else if weight2 > weight1 {
        return chain2
    }
    
    // Tie-breaker: lower hash
    if bytes.Compare(chain1[:], chain2[:]) < 0 {
        return chain1
    }
    
    return chain2
}

// calculateChainWeight sums validator support
func (fr *ForkResolver) calculateChainWeight(
    tip ids.ID,
    ancestor ids.ID,
) uint64 {
    weight := uint64(0)
    current := tip
    
    for current != ancestor {
        block := fr.getBlock(current)
        weight += block.ProposerScore()
        current = block.Parent()
    }
    
    return weight
}
```

## Performance Optimizations

### Parallel Vote Processing
```go
func (s *SnowmanPlusPlus) ProcessVotes(
    votes []Vote,
) {
    // Process votes in parallel
    numWorkers := runtime.NumCPU()
    voteChan := make(chan Vote, len(votes))
    
    // Start workers
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for vote := range voteChan {
                s.processVote(vote)
            }
        }()
    }
    
    // Send votes to workers
    for _, vote := range votes {
        voteChan <- vote
    }
    close(voteChan)
    
    wg.Wait()
}
```

## Security Considerations

1. **VRF Security**: Unpredictable proposer selection
2. **Timing Attacks**: Minimum block delays
3. **Sybil Resistance**: Stake-weighted voting
4. **Fork Prevention**: Fast finality reduces forks

## Performance Targets

- **Block Time**: 2 seconds average
- **Finality**: <3 seconds (1-2 blocks)
- **Throughput**: 5000+ TPS
- **Network Size**: Scales to 1000+ validators

## Testing

```go
func TestSnowmanPlusPlus(t *testing.T) {
    // Create consensus engine
    consensus := NewSnowmanPlusPlus(CanonicalConsensusParams)
    
    // Simulate block production
    for i := 0; i < 100; i++ {
        // Select proposer via VRF
        proposer, proof, err := consensus.SelectProposer(
            uint64(i),
            consensus.lastAccepted,
        )
        assert.NoError(t, err)
        
        // Create block
        block := &TestBlock{
            height:     uint64(i),
            proposer:   proposer,
            vrfProof:   proof,
            timestamp:  time.Now(),
        }
        
        // Process block
        err = consensus.ProcessBlock(block)
        assert.NoError(t, err)
        
        // Check finality
        if consensus.IsFinalized(block.ID()) {
            consensus.lastAccepted = block.ID()
        }
    }
    
    // Verify properties
    assert.Equal(t, 100, consensus.Height())
    assert.True(t, consensus.metrics.avgBlockTime < 3*time.Second)
}
```

## Implementation

### Lux Node Implementation
- **Snowman Engine**: [`github.com/luxfi/node/snow/consensus/snowman`](https://github.com/luxfi/node/tree/main/snow/consensus/snowman)
- **Snowman++ VM**: [`github.com/luxfi/node/vms/proposervm`](https://github.com/luxfi/node/tree/main/vms/proposervm)
- **Block Building**: [`github.com/luxfi/node/snow/engine/snowman/block`](https://github.com/luxfi/node/tree/main/snow/engine/snowman/block)
- **Consensus Parameters**: [`github.com/luxfi/node/snow/consensus/snowball/parameters.go`](https://github.com/luxfi/node/blob/main/snow/consensus/snowball/parameters.go)

## References

1. [Snowman Consensus](https://docs.avax.network/learn/avalanche/consensus)
2. [Snowman++ Paper](https://arxiv.org/abs/2111.06888)
3. [VRF Specification](https://tools.ietf.org/html/draft-irtf-cfrg-vrf)
4. [Avalanche Consensus Family](https://arxiv.org/abs/1906.08936)

---

**Status**: Draft  
**Category**: Consensus  
**Created**: 2025-01-09