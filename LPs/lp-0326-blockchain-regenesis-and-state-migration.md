---
lp: 0326
title: Blockchain Regenesis and State Migration
description: Standard procedure for exporting chain state and creating new genesis files for network upgrades
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-11-22
requires: 181
---

## Abstract

This LP specifies the standard procedure for blockchain regenesis—the process of exporting the complete state of a running blockchain and importing it as the genesis state of a new network. Regenesis enables major network upgrades, chain consolidation, and architecture migrations while preserving all account balances, smart contract storage, and deployed code.

## Motivation

### Why Regenesis is Necessary

Blockchain networks occasionally require fundamental changes that cannot be accomplished through standard upgrades:

1. **Architecture Migration**: Moving from one consensus mechanism to another (e.g., Avalanche Consensus → Lux Consensus)
2. **EVM State Migration**: Preserving all smart contract state during network re-launch
3. **State Cleanup**: Removing obsolete data and optimizing storage
4. **Protocol Breaking Changes**: Implementing incompatible improvements
5. **Network ID Changes**: Moving to new network configuration with different parameters

### Lux Mainnet Regenesis Scope

Lux Network mainnet regenesis applies to **re-launching the original 3 chains** (P, C, X). **Q-Chain and future chains (B, Z, M) are new deployments**, not part of regenesis:

| Chain | Purpose | Regenesis Status | State Migration |
|-------|---------|------------------|----------------|
| **P-Chain** | Platform/Validators | ✅ Re-launch | **Full genesis state** |
| **C-Chain** | EVM Smart Contracts | ✅ Re-launch | **Full EVM state** |
| **X-Chain** | Asset Exchange | ✅ Re-launch | **Full genesis state** |
| **Q-Chain** | Quantum-Resistant | ❌ New deployment | N/A (fresh chain) |
| **B-Chain** | Cross-Chain Bridges | ❌ New deployment | N/A (future) |
| **Z-Chain** | Zero-Knowledge Proofs | ❌ New deployment | N/A (future) |
| **M-Chain** | TBD | ❌ New deployment | N/A (future) |

**Regenesis applies to**: P, C, X chains only (original Avalanche-based chains)

**State preservation in mainnet regenesis**:

**P-Chain Genesis State** (full migration):
- 100 genesis validators with 1 billion LUX each
- Staking parameters and unlocking schedules (100-year vesting)
- Validator set configuration and weights
- Platform chain state and parameters

**C-Chain EVM State** (full migration):
- All account balances on C-Chain
- All deployed smart contracts and their storage
- Contract bytecode and state

**X-Chain Genesis State** (full migration):
- LUX genesis allocations
- Asset state and UTXO set
- Initial token distribution

**Non-mainnet networks**: Deploy all chains fresh (no regenesis needed)

### C-Chain ID History: 7777 → 96369

The C-Chain has undergone a Chain ID migration to resolve EIP conflicts:

**Historical Timeline**:
- **Original Chain ID**: 7777 (Lux mainnet launch)
- **2024 Reboot**: Changed to 96369 due to EIP overlap
- **Current Chain ID**: 96369 (legitimate continuation of 7777 lineage)

**State Preservation**:
- Original Chain ID 7777 data preserved at [github.com/luxfi/state](https://github.com/luxfi/state)
- All historical network data archived and accessible
- **Regenesis migrates Chain ID 96369 state** (which correctly continued the 7777 lineage)
- Chain ID 96369 contains all state from the original 7777 chain plus subsequent blocks

**EIP Conflict Resolution**:
The migration to Chain ID 96369 was necessary due to conflicts with Ethereum Improvement Proposals (EIPs) that assigned Chain ID 7777 to other networks. This reboot ensured:
1. No cross-chain replay attacks
2. Compliance with EIP-155 (Simple replay attack protection)
3. Unique identification in multi-chain ecosystem
4. Wallet and tooling compatibility

**Implications for Regenesis**:
- Current regenesis exports state from **Chain ID 96369**
- Genesis file reflects Chain ID 96369 in configuration
- All account balances, contracts, and storage from 96369 are migrated
- Historical Chain ID 7777 data remains available in [luxfi/state](https://github.com/luxfi/state) repository

## Specification

### Regenesis Process Overview

```
┌─────────────────┐
│  Running Chain  │
│   (Old State)   │
└────────┬────────┘
         │
         │ 1. Export State
         ▼
┌─────────────────┐
│  State Export   │
│ (Database Dump) │
└────────┬────────┘
         │
         │ 2. Convert to Genesis
         ▼
┌─────────────────┐
│  Genesis File   │
│    (JSON)       │
└────────┬────────┘
         │
         │ 3. Initialize New Chain
         ▼
┌─────────────────┐
│   New Chain     │
│  (New State)    │
└─────────────────┘
```

### Phase 1: State Export

#### 1.1 Export Chain State from Database

Use the `export-state-to-genesis` tool to extract all state from the blockchain database:

```bash
# Export state from PebbleDB/BadgerDB
cd /Users/z/work/lux/state/scripts
go run export-state-to-genesis.go \
  /path/to/chaindata \
  /output/genesis-export.json
```

**What Gets Exported**:
- Account balances (all addresses with non-zero balance)
- Account nonces
- Smart contract bytecode
- Contract storage (all non-zero storage slots)
- Total supply verification

#### 1.2 Export Block History (Optional)

For historical reference and verification:

```go
// Export blocks 0 through N
blockchain.ExportN(writer, 0, lastBlockNumber)

// Or export with custom callback
blockchain.ExportCallback(func(block *types.Block) error {
    // Process each block
    return archiveBlock(block)
}, 0, lastBlockNumber)
```

### Phase 2: Genesis File Creation

#### 2.1 Genesis File Structure

```json
{
  "config": {
    "chainId": 96369,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "shanghaiBlock": 0,
    "terminalTotalDifficulty": "0x0",
    "terminalTotalDifficultyPassed": true
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "0x00",
  "gasLimit": "0x7a1200",
  "difficulty": "0x0",
  "mixhash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {
    "0x1234...": {
      "balance": "0x...",
      "nonce": 42,
      "code": "0x...",
      "storage": {
        "0x0": "0x...",
        "0x1": "0x..."
      }
    }
  }
}
```

#### 2.2 State Verification

Before using exported genesis:

```bash
# Verify total balance matches
total_exported=$(jq '[.alloc | to_entries[].value.balance |
  ltrimstr("0x") | tonumber] | add' genesis-export.json)

# Verify account count
account_count=$(jq '.alloc | length' genesis-export.json)

# Verify contract count
contract_count=$(jq '[.alloc | to_entries[] |
  select(.value.code != null and .value.code != "0x")] |
  length' genesis-export.json)

echo "Total Balance: $total_exported"
echo "Accounts: $account_count"
echo "Contracts: $contract_count"
```

### Phase 3: Network Initialization

#### 3.1 Initialize New Network

```bash
# Initialize geth with new genesis
geth init /path/to/genesis-export.json \
  --datadir /path/to/new/datadir

# Verify initialization
geth --datadir /path/to/new/datadir \
  console \
  --exec "eth.getBlock(0)"
```

#### 3.2 Start Network

```bash
# Start first bootstrap node
geth --datadir /path/to/new/datadir \
  --networkid 96369 \
  --http \
  --http.api eth,net,web3 \
  --bootnodes "" \
  console
```

#### 3.3 Validator Migration

For P-Chain (Platform) validators:

```go
// Export validator set from old chain
oldValidators := oldDChain.GetCurrentValidators()

// Create validator entries in new genesis
for _, v := range oldValidators {
    newGenesis.Validators = append(newGenesis.Validators, Validator{
        NodeID:    v.NodeID,
        PublicKey: v.BLSPublicKey,
        Weight:    v.Weight,
        StartTime: newGenesisTime,
        EndTime:   v.EndTime,
    })
}
```

## Implementation

### Chain Migration Framework

Location: `/Users/z/work/lux/node/chainmigrate/`

The Lux blockchain uses a generic **Chain Migration Framework** with VM-specific importer/exporter interfaces for regenesis:

#### Core Interfaces

**ChainExporter** - Exports blockchain data from source VM:
```go
type ChainExporter interface {
    // Initialize with source database configuration
    Init(config ExporterConfig) error

    // Get chain metadata (network ID, chain ID, current height)
    GetChainInfo() (*ChainInfo, error)

    // Export blocks in a range (streaming for memory efficiency)
    ExportBlocks(ctx context.Context, start, end uint64) (<-chan *BlockData, <-chan error)

    // Export state at a specific block height
    ExportState(ctx context.Context, blockNumber uint64) (<-chan *StateAccount, <-chan error)

    // Export chain configuration (genesis parameters)
    ExportConfig() (*ChainConfig, error)

    // Verify export integrity
    VerifyExport(blockNumber uint64) error

    Close() error
}
```

**ChainImporter** - Imports blockchain data into destination VM:
```go
type ChainImporter interface {
    // Initialize with destination database configuration
    Init(config ImporterConfig) error

    // Import chain configuration and genesis
    ImportConfig(config *ChainConfig) error

    // Import individual block
    ImportBlock(block *BlockData) error

    // Import blocks in batch
    ImportBlocks(blocks []*BlockData) error

    // Import state accounts at specific height
    ImportState(accounts []*StateAccount, blockNumber uint64) error

    // Finalize import and set chain head
    FinalizeImport(blockNumber uint64) error

    // Verify import integrity
    VerifyImport(blockNumber uint64) error

    // Execute block to rebuild state (runtime replay)
    ExecuteBlock(block *BlockData) error

    Close() error
}
```

**ChainMigrator** - Orchestrates the migration:
```go
type ChainMigrator interface {
    // Migrate entire chain
    Migrate(ctx context.Context, source ChainExporter, dest ChainImporter, options MigrationOptions) error

    // Migrate specific block range
    MigrateRange(ctx context.Context, source ChainExporter, dest ChainImporter, start, end uint64) error

    // Migrate state at specific height
    MigrateState(ctx context.Context, source ChainExporter, dest ChainImporter, blockNumber uint64) error

    // Verify migration success
    VerifyMigration(source ChainExporter, dest ChainImporter, blockNumber uint64) error
}
```

#### VM-Specific Implementations

**C-Chain (EVM)**:
- Exporter: `EVMExporter` - Exports from PebbleDB/LevelDB with EVM state
- Importer: `CChainImporter` - Imports into C-Chain with CorethVM compatibility

**P-Chain (Platform)**:
- Uses Platform VM importer/exporter for validator state

**X-Chain (Exchange)**:
- Uses AVM importer/exporter for UTXO set and asset state

### Programmatic Usage

```go
import "github.com/luxfi/node/chainmigrate"

// Create exporter for C-Chain
exporterConfig := chainmigrate.ExporterConfig{
    ChainType:       chainmigrate.ChainTypeCChain,
    DatabasePath:    "/path/to/old-cchain-db",
    DatabaseType:    "pebble",
    ExportState:     true,
    ExportReceipts:  true,
    VerifyIntegrity: true,
}
exporter := chainmigrate.NewEVMExporter(exporterConfig)

// Create importer for new C-Chain
importerConfig := chainmigrate.ImporterConfig{
    ChainType:       chainmigrate.ChainTypeCChain,
    DatabasePath:    "/path/to/new-cchain-db",
    DatabaseType:    "badgerdb",
    ExecuteBlocks:   false, // Import state directly, don't replay
    VerifyState:     true,
    BatchSize:       100,
}
importer := chainmigrate.NewCChainImporter(importerConfig)

// Create migrator
migrationOpts := chainmigrate.MigrationOptions{
    StartBlock:      0,
    EndBlock:        1074616, // Final block height
    BatchSize:       100,
    MigrateState:    true,
    StateHeight:     1074616,
    RegenesisMode:   true,
    VerifyEachBlock: true,
}

migrator := chainmigrate.NewChainMigrator()

// Execute migration
ctx := context.Background()
if err := migrator.Migrate(ctx, exporter, importer, migrationOpts); err != nil {
    log.Fatalf("Migration failed: %v", err)
}
```

### lux-cli Network Commands

The `lux-cli` provides high-level commands for network management and state import:

#### Import Genesis Data

```bash
# Import blockchain data from existing database into BadgerDB archive
lux network import \
  --genesis-path=/path/to/old-db \
  --genesis-type=pebbledb \
  --archive-path=/path/to/new-archive \
  --db-backend=badgerdb \
  --verify=true \
  --batch-size=1000
```

**Node Configuration Flags** (used internally by lux-cli):
- `genesis-import`: Path to source database
- `genesis-import-type`: Database type (leveldb, pebbledb, badgerdb)
- `genesis-replay`: Enable transaction replay
- `genesis-verify`: Verify block hashes during import
- `genesis-batch-size`: Batch size for import operations

#### Start Network with Archive

```bash
# Start network with imported archive
lux network start \
  --archive-path=/path/to/archive \
  --archive-shared \
  --node-version=v1.20.1
```

## Integration with LP-181 (Epoching)

Regenesis respects epoch boundaries from LP-181:

### Epoch-Aligned Regenesis

```go
// Get current epoch
currentEpoch := proposerVM.GetCurrentEpoch()

// Wait until epoch seals
for !isEpochSealed(currentEpoch) {
    time.Sleep(1 * time.Second)
}

// Export state at exact epoch boundary
exportStateAtHeight(currentEpoch.DChainHeight)
```

**Benefits**:
1. **Validator Set Consistency**: All chains reference same P-Chain epoch
2. **Cross-Chain Sync**: Regenesis chains (P, C, X) coordinate at same epoch
3. **Predictable Timing**: Known in advance when regenesis will occur
4. **Clean Separation**: Q-Chain and future chains deploy fresh (no migration complexity)

### Regenesis Coordination

**Only P, C, X chains participate in regenesis** (Q-Chain is new deployment):

```go
type RegensisCoordinator struct {
    chains map[string]*Chain // P, C, X only (regenesis chains)
    targetEpoch uint64
}

func (rc *RegensisCoordinator) ExportRegensisChains(epoch uint64) error {
    // Wait for target epoch to seal
    <-rc.waitForEpochSeal(epoch)

    // Export all three chains' full state

    // P-Chain: Full genesis state (validators, staking, unlocking schedules)
    pChainState := rc.chains["P"].ExportGenesisState(epoch)

    // C-Chain: Full EVM state (accounts, contracts, storage)
    cChainState := rc.chains["C"].ExportFullState(epoch)

    // X-Chain: Full genesis state (LUX allocations, UTXO set)
    xChainState := rc.chains["X"].ExportGenesisState(epoch)

    return rc.verifyExports(pChainState, cChainState, xChainState)
}
```

**Q-Chain Deployment** (separate from regenesis):
```go
// Q-Chain is a fresh deployment, not part of regenesis
qChainGenesis := generateFreshGenesis(
    chainID: "Q",
    networkID: 96369,
    timestamp: time.Now(),
)
deployNewChain(qChainGenesis)
```

## Rationale

### Design Decisions

**1. Full State Export**: Exporting complete state (accounts, storage, code) rather than replaying transactions ensures:
- Deterministic reproduction regardless of historical data availability
- Faster migration without re-executing all historical transactions
- Independence from block history

**2. Genesis Injection**: Embedding state in genesis.json rather than snapshot files provides:
- Standard format understood by all node implementations
- Easy verification and auditing
- Atomic activation at network launch

**3. Separate Validator Handling**: Treating validator state separately ensures:
- Clean separation of consensus and execution layers
- Ability to restructure validator set during migration
- Compatibility with different consensus mechanisms

**4. Multi-Chain Coordination**: Phased migration with designated cutover times:
- Minimizes network disruption
- Allows coordinated community preparation
- Enables rollback if issues detected

### Alternatives Considered

- **Transaction Replay**: Rejected due to time/resource requirements for long-running chains
- **Snapshot Import**: Rejected as non-standard; genesis provides better tooling support
- **In-Place Upgrade**: Not possible for major architecture changes (e.g., chain consolidation)
- **State Diffs Only**: Rejected as incomplete; fresh genesis provides clean slate

## Security Considerations

### State Integrity

1. **Hash Verification**: Export must preserve state root hash
2. **Balance Conservation**: Total supply must match exactly
3. **Contract Code**: Bytecode must be identical
4. **Storage Proofs**: Critical contracts should have Merkle proofs

### Validator Coordination

1. **BLS Keys**: Validator signing keys must be migrated securely
2. **Staking Records**: All staking history must be preserved
3. **Delegation**: Delegator balances and relationships maintained
4. **Slashing**: Any pending slashing conditions must be resolved

### Timestamp Management

```go
// New genesis timestamp should be slightly in future
newGenesisTime := time.Now().Add(24 * time.Hour)

// But not too far (validator certificates expire)
if newGenesisTime.Sub(oldFinalBlock.Time) > 30*24*time.Hour {
    return ErrTimestampTooFar
}
```

### Q-Chain Deployment (Not Part of Regenesis)

Q-Chain is a **new chain**, not part of the regenesis process:

1. **Fresh Genesis**: Q-Chain deploys with clean state (no migration)
2. **Quantum Operations**: Built-in support for ML-DSA, ML-KEM from genesis
3. **No State Migration**: Q-Chain starts fresh on mainnet
4. **Independent Deployment**: Can deploy Q-Chain on any network without regenesis

**For non-mainnet networks**: All chains (P, C, X, Q) deploy fresh with no regenesis needed.

## Testing

### Pre-Production Testing

```bash
# 1. Export mainnet state
go run export-state-to-genesis.go \
  /mainnet/chaindata \
  /test/mainnet-genesis.json

# 2. Initialize test network
geth init /test/mainnet-genesis.json \
  --datadir /test/datadir

# 3. Start test node
geth --datadir /test/datadir \
  --networkid 99999 \
  console

# 4. Verify state
> eth.getBalance("0x...")  // Check known addresses
> eth.getCode("0x...")     // Verify contract code
> debug.trieHash()         // Compare state root
```

### Regenesis Checklist

**Mainnet Regenesis** (P, C, X chains only):
- [ ] Export C-Chain EVM state (primary state migration)
- [ ] Verify total balance conservation on C-Chain
- [ ] Verify contract count matches
- [ ] Export block history to archive (C-Chain)
- [ ] Generate new genesis files for P, C, X
- [ ] Test genesis initialization on testnet
- [ ] Verify C-Chain state root matches
- [ ] Coordinate validator migration (P-Chain)
- [ ] Update network parameters (chain ID 96369 for C-Chain)
- [ ] Test cross-chain communication
- [ ] Perform load testing
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window
- [ ] Notify community and exchanges
- [ ] Execute production regenesis
- [ ] Monitor network health post-regenesis

**New Chain Deployment** (Q, B, Z, M - not part of regenesis):
- [ ] Deploy Q-Chain from fresh genesis
- [ ] No state migration needed (new chain)
- [ ] Standard deployment procedure for other networks

## Backwards Compatibility

Regenesis is **not backwards compatible**. It creates a new network with new genesis.

### Migration Path

1. **Announce Freeze Block**: Community agrees on final block height
2. **Export Window**: 24-48 hour export and verification period
3. **Network Launch**: New network starts with exported genesis
4. **Dual Operation** (Optional): Old network remains as archive for 30-90 days
5. **Canonical Transition**: New network becomes primary after stability period

### Archive Node Requirements

Maintain archive nodes for old network:
- Transaction history lookups
- Historical state queries
- Audit and compliance
- Legal requirements

## Operational Procedures

### Emergency Regenesis

In case of critical bug or security incident:

```bash
# 1. Halt network immediately
curl -X POST http://localhost:9650/ext/admin \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"admin.lockProfile"}'

# 2. Export state BEFORE bug impact
go run export-state-to-genesis.go \
  /data/chaindata \
  /backup/pre-incident-genesis.json \
  --max-height=$LAST_GOOD_BLOCK

# 3. Create patched node binary
make build-patched

# 4. Test regenesis on isolated network
./test-regenesis.sh

# 5. Coordinate validator upgrade
# 6. Launch new network
```

### Performance Optimization

For large state exports (>100GB):

```go
// Parallel export by address range
func ExportByRange(dbPath string, startAddr, endAddr common.Address) {
    db := openDB(dbPath)

    iter := db.NewIterator(pebble.IterOptions{
        LowerBound: startAddr.Bytes(),
        UpperBound: endAddr.Bytes(),
    })
    defer iter.Close()

    // Process in chunks
    batchSize := 10000
    batch := make([]Account, 0, batchSize)

    for iter.First(); iter.Valid(); iter.Next() {
        acc := decodeAccount(iter.Value())
        batch = append(batch, acc)

        if len(batch) >= batchSize {
            writeBatch(batch)
            batch = batch[:0]
        }
    }
}
```

## Future Enhancements

### Incremental Regenesis

Instead of full state export, export only changes:

```go
type IncrementalExport struct {
    BaseGenesis    string      // Previous genesis hash
    ModifiedAccounts []Account  // Changed accounts only
    NewContracts   []Contract  // Newly deployed contracts
    UpdatedStorage []Storage   // Modified storage
}
```

### Cross-Chain State Proofs

Verify state consistency across all 6 chains:

```go
type CrossChainStateProof struct {
    AChain common.Hash
    BChain common.Hash
    CChain common.Hash
    DChain common.Hash
    YChain common.Hash
    ZChain common.Hash
    Timestamp time.Time
    ProofOfConsistency []byte
}
```

### Automatic Regenesis

Scheduled regenesis for regular maintenance:

```go
const RegenesisInterval = 365 * 24 * time.Hour // Annual

func (n *Network) CheckRegenesisSchedule() {
    if time.Since(n.GenesisTime) > RegenesisInterval {
        n.ProposeRegenesis()
    }
}
```

## References

1. [LP-181: P-Chain Epoched Views](lp-181-epoching.md)
2. [Lux State Package](https://github.com/luxfi/state) - Historical Chain ID 7777 data archive
3. [EIP-155: Simple replay attack protection](https://eips.ethereum.org/EIPS/eip-155) - Chain ID uniqueness specification
4. [Geth Genesis Format](https://geth.ethereum.org/docs/fundamentals/private-network)
5. [PebbleDB Documentation](https://github.com/cockroachdb/pebble)

## Tools

- **Chain Migration Framework**: `/Users/z/work/lux/node/chainmigrate/`
  - Core interfaces: `interfaces.go`
  - C-Chain importer: `cchain_importer.go`
  - EVM exporter: `evm_exporter.go`
  - Documentation: `README.md`
- **lux-cli Network Commands**: `/Users/z/work/lux/cli/cmd/networkcmd/`
  - Import command: `import.go`
  - Network management: `start.go`
- **EVM Plugin Exporter**: `/Users/z/work/lux/evm/plugin/evm/exporter.go`

## Acknowledgements

Based on Ethereum's genesis format and Avalanche's subnet migration patterns. Special thanks to the Lux Core Team for:
- Implementing mainnet regenesis (P, C, X chains) with C-Chain EVM state migration
- Managing the 2024 Chain ID migration (7777 → 96369) to resolve EIP conflicts
- Preserving all historical Chain ID 7777 data in the [luxfi/state](https://github.com/luxfi/state) repository
- Launching Q-Chain as a new quantum-resistant deployment

The regenesis process migrates C-Chain state from Chain ID 96369, which represents the legitimate continuation of the original Chain ID 7777 lineage.

## Copyright

Copyright © 2025 Lux Industries Inc. All rights reserved.
