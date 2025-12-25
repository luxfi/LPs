---
lp: 3691
title: EVM Developer Improvements
description: New RPC methods (eth_config), history expiry tools, and node operation enhancements
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Interface
created: 2025-12-25
requires: 1200
tags: [evm, rpc, developer-experience]
order: 3691
---

## Abstract

LP-3691 introduces developer-focused improvements to the Lux EVM, including the `eth_config` RPC method (EIP-7910), history expiry tools for efficient node operation, and enhanced sync capabilities. These features simplify node operations, speed up sync times, and provide better introspection into chain configuration.

## Motivation

Developers and node operators need better tools to:

1. **Understand Chain Configuration**: Query active forks, parameters, and chain ID
2. **Manage Historical Data**: Prune old state without losing consensus validity
3. **Speed Up Sync**: Bootstrap nodes faster with snapshots and checkpoints
4. **Reduce Storage**: Minimize disk usage while maintaining security

### Developer Pain Points

| Issue | Impact | Solution |
|-------|--------|----------|
| Unknown chain config | Incompatible deployments | `eth_config` RPC |
| Unbounded state growth | 2TB+ node storage | History expiry |
| Slow initial sync | Days to weeks | Snapshot sync |
| Unclear fork status | Misconfigured clients | Config introspection |

## Specification

### 1. eth_config RPC Method (EIP-7910)

New RPC method returning chain configuration:

```typescript
// Request
{
  "jsonrpc": "2.0",
  "method": "eth_config",
  "params": [],
  "id": 1
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "chainId": "0x1786D",  // 96365 (Lux C-Chain)
    "homesteadBlock": "0x0",
    "eip150Block": "0x0",
    "eip155Block": "0x0",
    "eip158Block": "0x0",
    "byzantiumBlock": "0x0",
    "constantinopleBlock": "0x0",
    "petersburgBlock": "0x0",
    "istanbulBlock": "0x0",
    "berlinBlock": "0x0",
    "londonBlock": "0x0",
    "shanghaiTime": 1710000000,
    "cancunTime": 1720000000,
    "pragueTime": 1730000000,
    "forks": {
      "apricotPhase1": "0x0",
      "apricotPhase2": "0x0",
      "apricotPhase3": "0x0",
      "apricotPhase4": "0x0",
      "apricotPhase5": "0x0",
      "banff": "0x5A0000",
      "cortina": "0x5B0000",
      "durango": "0x5C0000",
      "etna": "0x5D0000",
      "fortuna": "0x5E0000",
      "granite": "0x5F0000"
    },
    "networkId": 96369,
    "networkName": "lux-mainnet"
  }
}
```

**Implementation**: [`geth/internal/ethapi/api.go`](https://github.com/luxfi/geth) - `Config` method

### 2. History Expiry

Automatic pruning of historical state beyond a configurable horizon:

```go
const (
    // Default history retention (90 days of blocks)
    DefaultHistoryRetention = 90 * 24 * 60 * 60 / 2 // ~3.9M blocks at 2s

    // Minimum retention (7 days)
    MinHistoryRetention = 7 * 24 * 60 * 60 / 2
)

type HistoryConfig struct {
    // Enable history expiry
    Enabled bool `json:"enabled"`

    // Number of blocks to retain
    RetentionBlocks uint64 `json:"retentionBlocks"`

    // Prune interval (blocks between prune operations)
    PruneInterval uint64 `json:"pruneInterval"`
}
```

**CLI Flags**:

```bash
# Enable history expiry with 30-day retention
luxd --history-expiry.enabled --history-expiry.retention 1296000

# Query expiry status
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_historyStatus","params":[],"id":1}' http://localhost:8545
```

**Implementation**: [`geth/core/blockchain.go`](https://github.com/luxfi/geth) - history expiry logic

### 3. Enhanced Sync Modes

New sync capabilities for faster node bootstrap:

```go
type SyncConfig struct {
    // Sync mode: "full", "snap", "light", "checkpoint"
    Mode string `json:"mode"`

    // Checkpoint for checkpoint sync
    Checkpoint *types.Header `json:"checkpoint,omitempty"`

    // Trusted state root for snap sync
    StateRoot common.Hash `json:"stateRoot,omitempty"`

    // Blob sidecar retention
    BlobRetention uint64 `json:"blobRetention"`
}
```

**Sync Modes**:

| Mode | Description | Speed | Security |
|------|-------------|-------|----------|
| full | Process all blocks from genesis | Slowest | Highest |
| snap | Download state snapshot, verify headers | Fast | High |
| checkpoint | Trust checkpoint, sync from there | Fastest | Medium |
| light | Header-only with proof requests | Instant | Lowest |

### 4. RPC Improvements

Additional RPC methods for better developer experience:

```typescript
// Get sync status with ETA
eth_syncStatus() → {
  syncing: boolean,
  currentBlock: number,
  highestBlock: number,
  startingBlock: number,
  estimatedTimeRemaining: number // seconds
}

// Get node capabilities
eth_capabilities() → string[]  // ["eth/68", "snap/1", "les/4"]

// Get peer info summary
eth_peerSummary() → {
  total: number,
  inbound: number,
  outbound: number,
  byVersion: { [version: string]: number }
}

// Debug: Get state size at block
debug_stateSize(blockNumber) → {
  accounts: number,
  storage: number,
  codeBytes: number
}
```

## Implementation Status

| Feature | EIP | Implementation | Status |
|---------|-----|----------------|--------|
| eth_config | EIP-7910 | `internal/ethapi/api.go` | ✅ |
| History expiry | - | `core/blockchain.go` | ✅ |
| Snap sync | EIP-4444 | `eth/downloader/` | ✅ |
| eth_syncStatus | - | `internal/ethapi/api.go` | ✅ |
| eth_capabilities | - | `internal/ethapi/api.go` | ✅ |

## Test Cases

```go
func TestEthConfig(t *testing.T) {
    client := ethclient.Dial("http://localhost:8545")

    var config map[string]interface{}
    err := client.CallContext(ctx, &config, "eth_config")
    require.NoError(t, err)

    require.Equal(t, "0x17871", config["chainId"])
    require.NotNil(t, config["forks"])
}

func TestHistoryExpiry(t *testing.T) {
    bc := newBlockchain(HistoryConfig{
        Enabled:         true,
        RetentionBlocks: 1000,
        PruneInterval:   100,
    })

    // Add 2000 blocks
    for i := 0; i < 2000; i++ {
        bc.InsertBlock(generateBlock(i))
    }

    // Old blocks should be pruned
    _, err := bc.GetBlockByNumber(100)
    require.Error(t, err) // Block pruned

    _, err = bc.GetBlockByNumber(1500)
    require.NoError(t, err) // Block retained
}
```

## Security Considerations

1. **History Expiry**: Does not affect consensus - only historical queries
2. **Checkpoint Sync**: Requires trusted checkpoint source
3. **RPC Exposure**: New methods should respect auth settings
4. **State Pruning**: Carefully validated to never prune needed state

## Backwards Compatibility

All new features are additive:
- New RPC methods don't affect existing ones
- History expiry is opt-in
- Sync modes default to current behavior

## References

- [EIP-7910: eth_config RPC Method](https://eips.ethereum.org/EIPS/eip-7910)
- [EIP-4444: History Expiry](https://eips.ethereum.org/EIPS/eip-4444)
- [EIP-4938: Snap Protocol](https://eips.ethereum.org/EIPS/eip-4938)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
