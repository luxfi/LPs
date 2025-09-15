# LP-605: State Sync and Pruning Mechanisms

## Overview

LP-605 standardizes state synchronization and pruning mechanisms across Lux, Zoo, and Hanzo chains. This ensures exactly one way to sync state, prune historical data, and maintain chain efficiency while preserving security and decentralization.

## Motivation

Current blockchain state management challenges:
- **State Growth**: Unbounded growth makes full nodes expensive
- **Sync Time**: New nodes take days to sync from genesis
- **Storage Cost**: Historical data accumulates indefinitely
- **Network Overhead**: Redundant state transmission

Our solution provides:
- **Fast Sync**: Skip verification of historical blocks
- **State Pruning**: Remove unnecessary historical state
- **Checkpoint Sync**: Start from trusted checkpoints
- **Differential Sync**: Only sync changed state

## Technical Specification

### Unified State Sync Protocol

```go
package statesync

import (
    "github.com/luxfi/lux/verkle"
    "github.com/luxfi/lux/crypto"
)

// StateSyncMode defines sync strategies - EXACTLY ONE per node
type StateSyncMode int

const (
    // Full sync - verify all blocks from genesis
    FullSync StateSyncMode = iota
    
    // Fast sync - download state at pivot block
    FastSync
    
    // Snap sync - download state + recent blocks
    SnapSync
    
    // Light sync - only block headers
    LightSync
    
    // Warp sync - from latest checkpoint
    WarpSync
)

// StateSyncConfig - SINGLE configuration across all chains
type StateSyncConfig struct {
    Mode              StateSyncMode
    PivotBlock        uint64     // Block to sync state from
    StateSyncNodes    []string   // Trusted nodes for state
    MaxStateChunkSize uint64     // 16MB default
    ParallelDownloads int        // Concurrent state fetches
    VerifyProofs      bool       // Verify Verkle proofs
}

// StateSnapshot represents state at a block
type StateSnapshot struct {
    BlockHeight  uint64
    BlockHash    Hash
    StateRoot    Hash
    
    // Verkle tree for O(1) proofs
    VerkleRoot   *verkle.Commitment
    
    // Metadata
    Timestamp    uint64
    ChainID      uint64  // 120, 121, or 122
}

// StateSyncer handles all sync operations
type StateSyncer struct {
    config    StateSyncConfig
    chain     Chain
    state     StateDB
    peers     PeerSet
    scheduler *SyncScheduler
}

// SyncState initiates state synchronization
func (s *StateSyncer) SyncState(target *StateSnapshot) error {
    switch s.config.Mode {
    case FastSync:
        return s.fastSync(target)
    case SnapSync:
        return s.snapSync(target)
    case WarpSync:
        return s.warpSync(target)
    default:
        return s.fullSync()
    }
}

// Fast sync implementation
func (s *StateSyncer) fastSync(target *StateSnapshot) error {
    // 1. Download headers up to pivot
    headers, err := s.downloadHeaders(0, target.BlockHeight)
    if err != nil {
        return err
    }
    
    // 2. Validate header chain
    if err := s.validateHeaders(headers); err != nil {
        return err
    }
    
    // 3. Download state at pivot block
    stateData, proofs, err := s.downloadState(target)
    if err != nil {
        return err
    }
    
    // 4. Verify Verkle proofs if enabled
    if s.config.VerifyProofs {
        if err := s.verifyVerkleProofs(stateData, proofs, target.VerkleRoot); err != nil {
            return err
        }
    }
    
    // 5. Import state
    if err := s.importState(stateData); err != nil {
        return err
    }
    
    // 6. Download recent blocks
    return s.downloadBlocks(target.BlockHeight, HEAD)
}
```

### Ancient Store (Freezer) Mechanism

```go
// AncientStore handles immutable historical data storage
// EXACTLY ONE ancient store implementation across all chains
type AncientStore interface {
    // HasAncient checks if ancient data exists
    HasAncient(kind string, number uint64) (bool, error)
    
    // Ancient retrieves ancient data
    Ancient(kind string, number uint64) ([]byte, error)
    
    // AncientRange retrieves range of ancient data
    AncientRange(kind string, start, max, maxByteSize uint64) ([][]byte, error)
    
    // Ancients returns the ancient data size
    Ancients() (uint64, error)
    
    // AncientSize returns size of specific ancient data
    AncientSize(kind string) (uint64, error)
    
    // ModifyAncients batch writes ancient data
    ModifyAncients(func(AncientWriteOp) error) (int64, error)
    
    // TruncateHead removes recent ancient data
    TruncateHead(items uint64) (uint64, error)
    
    // TruncateTail removes old ancient data
    TruncateTail(items uint64) (uint64, error)
}

// FreezerConfig - SINGLE configuration for ancient store
type FreezerConfig struct {
    // Ancient data directory
    AncientDir string
    
    // Namespace for multi-chain support
    Namespace string  // "lux", "zoo", "hanzo"
    
    // When to move data to ancient store
    Threshold uint64  // Default: 90000 blocks
    
    // Tables to freeze
    Tables []FreezerTable
}

// FreezerTable defines data to be frozen
type FreezerTable struct {
    Name       string  // "headers", "bodies", "receipts", "difficulties", "hashes"
    ValueSize  uint32  // Size hint for values
    Compressed bool    // Enable snappy compression
}

// ChainFreezer manages the ancient store
type ChainFreezer struct {
    threshold    uint64         // Number to freeze from
    frozen       uint64         // Last frozen block
    ancientLimit uint64         // Maximum ancient blocks
    
    // Tables for different data types
    tables map[string]*freezerTable
    
    // Trigger for manual freeze
    trigger chan chan struct{}
}

// Freeze moves chain segments to ancient store
func (f *ChainFreezer) Freeze(head *Block) error {
    // Only freeze blocks old enough
    if head.Number() < f.threshold {
        return nil
    }
    
    targetBlock := head.Number() - f.threshold
    
    // Batch freeze operation
    return f.ModifyAncients(func(op AncientWriteOp) error {
        for num := f.frozen + 1; num <= targetBlock; num++ {
            // Get block data
            block := GetBlock(num)
            header := block.Header()
            body := block.Body()
            receipts := GetReceipts(num)
            td := GetTotalDifficulty(num)
            
            // Append to ancient store
            if err := op.AppendAncient(
                num,
                block.Hash().Bytes(),
                header.Marshal(),
                body.Marshal(),
                receipts.Marshal(),
                td.Marshal(),
            ); err != nil {
                return err
            }
            
            // Delete from active database
            DeleteBlock(num)
        }
        
        f.frozen = targetBlock
        return nil
    })
}

// ReadAncients provides efficient batch reading
func (f *ChainFreezer) ReadAncients(fn func(AncientReaderOp) error) error {
    return f.tables["headers"].ReadAncients(fn)
}
```

### State Pruning Mechanism

```go
// PruningMode defines data retention strategies
type PruningMode string

const (
    // Archive - Keep all historical data (no pruning)
    PruningArchive PruningMode = "archive"
    
    // Full - Keep all recent data + ancient store
    PruningFull PruningMode = "full"
    
    // Fast - Keep only recent 128 blocks
    PruningFast PruningMode = "fast"
    
    // Standard - Keep recent 1024 blocks
    PruningStandard PruningMode = "standard"
    
    // Light - Minimal data retention
    PruningLight PruningMode = "light"
)

// PruningConfig - EXACTLY ONE configuration
type PruningConfig struct {
    Mode            PruningMode
    RetentionBlocks uint64      // Blocks to keep
    RetentionTime   time.Duration // Time-based retention
    
    // Granular control
    PruneState      bool  // Prune state trie
    PruneReceipts   bool  // Prune transaction receipts
    PruneLogs       bool  // Prune event logs
    
    // Archive nodes for historical queries
    ArchiveNodes    []string
}

// StatePruner handles pruning operations
type StatePruner struct {
    config   PruningConfig
    state    StateDB
    metrics  *PruningMetrics
}

// Prune removes old state according to policy
func (p *StatePruner) Prune(currentBlock uint64) error {
    pruneTarget := p.calculatePruneTarget(currentBlock)
    
    // Mark state for pruning
    marked, err := p.markForPruning(pruneTarget)
    if err != nil {
        return err
    }
    
    // Perform pruning in batches
    for _, batch := range marked.Batches(1000) {
        if err := p.pruneBatch(batch); err != nil {
            return err
        }
        
        // Update metrics
        p.metrics.PrunedNodes += uint64(len(batch))
    }
    
    // Compact database
    return p.state.Compact()
}

// calculatePruneTarget determines what to prune
func (p *StatePruner) calculatePruneTarget(current uint64) uint64 {
    switch p.config.Mode {
    case PruningFast:
        return saturatingSub(current, 128)
    case PruningStandard:
        return saturatingSub(current, 1024)
    case PruningTime:
        // Calculate based on time
        targetTime := time.Now().Add(-p.config.RetentionTime)
        return p.state.GetBlockByTime(targetTime)
    default:
        return 0  // No pruning
    }
}
```

### Checkpoint-Based Sync

```solidity
// SINGLE checkpoint contract deployed at SAME address on ALL chains
contract CheckpointOracle {
    // Checkpoint represents agreed-upon state
    struct Checkpoint {
        uint256 blockNumber;
        bytes32 blockHash;
        bytes32 stateRoot;
        bytes32 verkleRoot;
        uint256 timestamp;
        uint256 chainId;  // 120, 121, or 122
    }
    
    // Admin multisig for checkpoint updates
    address public admin;
    
    // Latest checkpoint
    Checkpoint public latest;
    
    // Historical checkpoints
    mapping(uint256 => Checkpoint) public checkpoints;
    
    // Checkpoint interval (e.g., every 10,000 blocks)
    uint256 public constant CHECKPOINT_INTERVAL = 10000;
    
    event CheckpointRegistered(
        uint256 indexed blockNumber,
        bytes32 blockHash,
        bytes32 stateRoot
    );
    
    // Register new checkpoint (admin only)
    function registerCheckpoint(
        uint256 blockNumber,
        bytes32 blockHash,
        bytes32 stateRoot,
        bytes32 verkleRoot
    ) external onlyAdmin {
        require(
            blockNumber % CHECKPOINT_INTERVAL == 0,
            "Invalid checkpoint block"
        );
        
        Checkpoint memory cp = Checkpoint({
            blockNumber: blockNumber,
            blockHash: blockHash,
            stateRoot: stateRoot,
            verkleRoot: verkleRoot,
            timestamp: block.timestamp,
            chainId: block.chainid
        });
        
        checkpoints[blockNumber] = cp;
        
        if (blockNumber > latest.blockNumber) {
            latest = cp;
        }
        
        emit CheckpointRegistered(blockNumber, blockHash, stateRoot);
    }
    
    // Get checkpoint for sync
    function getCheckpoint(uint256 blockNumber) 
        external 
        view 
        returns (Checkpoint memory) 
    {
        // Find nearest checkpoint
        uint256 checkpointBlock = (blockNumber / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
        return checkpoints[checkpointBlock];
    }
}
```

### Differential State Sync

```go
// DiffSync synchronizes only changed state
type DiffSync struct {
    lastSync    uint64
    stateDiffs  map[uint64]*StateDiff
}

// StateDiff represents state changes between blocks
type StateDiff struct {
    FromBlock   uint64
    ToBlock     uint64
    
    // Changed accounts
    Accounts    map[Address]AccountDiff
    
    // Changed storage
    Storage     map[Address]map[Hash]Hash
    
    // Changed code
    Code        map[Address][]byte
    
    // Verkle proof of changes
    Proof       *verkle.DiffProof
}

// ApplyDiff applies state changes efficiently
func (d *DiffSync) ApplyDiff(diff *StateDiff) error {
    // Verify diff proof
    if err := d.verifyDiffProof(diff); err != nil {
        return err
    }
    
    // Apply account changes
    for addr, accDiff := range diff.Accounts {
        if err := d.applyAccountDiff(addr, accDiff); err != nil {
            return err
        }
    }
    
    // Apply storage changes
    for addr, storage := range diff.Storage {
        if err := d.applyStorageDiff(addr, storage); err != nil {
            return err
        }
    }
    
    // Apply code changes
    for addr, code := range diff.Code {
        if err := d.state.SetCode(addr, code); err != nil {
            return err
        }
    }
    
    d.lastSync = diff.ToBlock
    return nil
}
```

### Cross-Chain State Sync

```go
// CrossChainSync synchronizes state across Lux/Zoo/Hanzo
type CrossChainSync struct {
    chains map[uint64]Chain  // 120, 121, 122
    bridge *Bridge
}

// SyncCrossChainState ensures consistency
func (c *CrossChainSync) SyncCrossChainState(
    sourceChain uint64,
    targetChain uint64,
    stateRoot Hash,
) error {
    // Get state proof from source chain
    proof, err := c.chains[sourceChain].GetStateProof(stateRoot)
    if err != nil {
        return err
    }
    
    // Verify proof on target chain
    if err := c.chains[targetChain].VerifyStateProof(proof); err != nil {
        return err
    }
    
    // Import verified state
    return c.chains[targetChain].ImportCrossChainState(
        sourceChain,
        stateRoot,
        proof,
    )
}
```

### Ancient Store Integration

```go
// UnifiedStorage combines active DB with ancient store
type UnifiedStorage struct {
    active   Database      // LevelDB/RocksDB for recent data
    ancient  AncientStore  // Freezer for historical data
    pruner   *StatePruner  // Pruning engine
    
    // Unified configuration
    freezeThreshold uint64  // When to freeze (90000 blocks)
    pruneThreshold  uint64  // When to prune (1024 blocks)
}

// Get retrieves data from active or ancient store
func (u *UnifiedStorage) Get(kind string, number uint64) ([]byte, error) {
    // Check if in ancient store
    frozen, _ := u.ancient.Ancients()
    if number < frozen {
        return u.ancient.Ancient(kind, number)
    }
    
    // Otherwise get from active database
    return u.active.Get(makeKey(kind, number))
}

// MaintainStorage runs periodic maintenance
func (u *UnifiedStorage) MaintainStorage(head uint64) error {
    // Step 1: Freeze old blocks to ancient store
    if head > u.freezeThreshold {
        targetFreeze := head - u.freezeThreshold
        if err := u.freezeBlocks(targetFreeze); err != nil {
            return err
        }
    }
    
    // Step 2: Prune state according to mode
    if head > u.pruneThreshold {
        targetPrune := head - u.pruneThreshold
        if err := u.pruner.Prune(targetPrune); err != nil {
            return err
        }
    }
    
    // Step 3: Compact active database
    return u.active.Compact()
}

// Canonical storage modes for all chains
var CanonicalStorageModes = map[string]StorageMode{
    "archive": {
        Pruning:  PruningArchive,  // No pruning
        Freezing: true,             // Use ancient store
        FreezeAt: 90000,           // Freeze after 90K blocks
    },
    "full": {
        Pruning:  PruningFull,      // Prune old state
        Freezing: true,             // Use ancient store
        FreezeAt: 90000,           
    },
    "fast": {
        Pruning:  PruningFast,      // Aggressive pruning
        Freezing: false,            // No ancient store
        KeepLast: 128,             // Keep 128 blocks
    },
}
```

## Migration Path

### Phase 1: Deploy Checkpoint Oracle
- Deploy on all three chains at same address
- Initialize with genesis checkpoints
- Set up admin multisig

### Phase 2: Enable Fast Sync
- Update nodes to support fast sync
- Test with subset of validators
- Monitor sync performance

### Phase 3: Implement Pruning
- Enable pruning on non-archive nodes
- Maintain archive nodes for historical queries
- Monitor storage savings

### Phase 4: Differential Sync
- Implement diff generation
- Deploy diff sync protocol
- Optimize for bandwidth

## Security Considerations

1. **Checkpoint Security**: Multi-sig validation of checkpoints
2. **State Proof Verification**: Mandatory Verkle proof validation
3. **Peer Selection**: Multiple peers for state chunks
4. **DoS Protection**: Rate limiting on state requests

## Performance Targets

- **Fast Sync Time**: <1 hour for new nodes
- **State Size**: <10GB with pruning
- **Checkpoint Interval**: Every 10,000 blocks
- **Diff Sync**: <100MB per day
- **Proof Size**: ~1KB with Verkle trees

## Testing

```go
func TestStateSyncModes(t *testing.T) {
    // Test all sync modes produce same state
    modes := []StateSyncMode{
        FullSync,
        FastSync,
        SnapSync,
        WarpSync,
    }
    
    targetBlock := uint64(1000000)
    expectedRoot := Hash("0x...")
    
    for _, mode := range modes {
        syncer := NewStateSyncer(StateSyncConfig{
            Mode: mode,
            PivotBlock: targetBlock,
        })
        
        err := syncer.Sync()
        assert.NoError(t, err)
        
        root := syncer.StateRoot()
        assert.Equal(t, expectedRoot, root)
    }
}

func TestPruningModes(t *testing.T) {
    // Test pruning maintains recent state
    pruner := NewStatePruner(PruningConfig{
        Mode: PruningStandard,
        RetentionBlocks: 1024,
    })
    
    // Generate 2000 blocks
    for i := 0; i < 2000; i++ {
        generateBlock(i)
    }
    
    // Prune old state
    err := pruner.Prune(2000)
    assert.NoError(t, err)
    
    // Verify recent blocks accessible
    for i := 976; i < 2000; i++ {
        _, err := getBlock(i)
        assert.NoError(t, err)
    }
    
    // Verify old blocks pruned
    _, err = getBlock(500)
    assert.Error(t, err)
}
```

## References

1. [Ethereum Snap Sync](https://github.com/ethereum/devp2p/blob/master/caps/snap.md)
2. [Avalanche State Sync](https://docs.avax.network/learn/avalanche/state-sync)
3. [Geth Pruning](https://geth.ethereum.org/docs/fundamentals/pruning)
4. [Verkle Trees](https://vitalik.ca/general/2021/06/18/verkle.html)

---

**Status**: Draft  
**Category**: State Management  
**Created**: 2025-01-09