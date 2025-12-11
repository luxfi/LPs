---
lp: 3000
title: X-Chain - Core Exchange Specification
tags: [core, exchange, utxo, trading, x-chain]
description: Core specification for the X-Chain (Exchange Chain), Lux Network's high-performance UTXO-based trading chain
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: [0, 99]
supersedes: 11
---

## Abstract

LP-3000 specifies the X-Chain (Exchange Chain), Lux Network's high-performance decentralized exchange built on a UTXO-based DAG architecture. The X-Chain implements a central limit order book (CLOB) with sub-millisecond matching and native cross-chain settlement.

## Motivation

A specialized exchange chain provides:

1. **Performance**: Sub-millisecond order matching
2. **UTXO Model**: Clean asset tracking and atomic swaps
3. **DAG Architecture**: Parallel transaction processing
4. **Native Trading**: Built-in order book and matching engine

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `X` |
| VM ID | `xvm` |
| VM Name | `xvm` |
| Block Time | Variable (DAG) |
| Consensus | Lux (DAG) |

### Implementation

**Go Package**: `github.com/luxfi/node/vms/exchangevm`

```go
import (
    xvm "github.com/luxfi/node/vms/exchangevm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var XVMID = constants.XVMID // ids.ID{'a', 'v', 'm'}

// Create X-Chain VM
factory := &xvm.Factory{}
vm, err := factory.New(logger)
```

### Directory Structure

```
node/vms/exchangevm/
├── block/            # DAG vertex definitions
├── config/           # Chain configuration
├── orderbook/        # Order book implementation
├── matching/         # Matching engine
├── state/            # UTXO state
├── txs/              # Transaction types
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
└── *_test.go         # Tests

dex/pkg/lx/           # DEX implementation
├── orderbook.go      # Core order book
├── orderbook_advanced.go
├── orderbook_extended.go
├── orderbook_server.go
├── x_chain_integration.go
└── types.go
```

### DAG Consensus

```go
type Vertex struct {
    ID           ids.ID
    ParentIDs    []ids.ID      // References to parent vertices
    Transactions []Transaction
    Height       uint64
    Timestamp    time.Time
}

const (
    AlphaPreference = 15     // Quorum size for preference
    AlphaConfidence = 20     // Quorum size for confidence
    BetaVirtuous    = 20     // Confidence threshold for virtuous
    BetaRogue       = 30     // Confidence threshold for rogue
    K               = 25     // Sample size
)
```

### UTXO Model

```go
type UTXO struct {
    TxID        ids.ID
    OutputIndex uint32
    AssetID     ids.ID
    Amount      uint64
    Owner       Owner
    Locktime    uint64
    Threshold   uint32
}
```

### Transaction Types

| Type | Description |
|------|-------------|
| `BaseTx` | Base asset transfer |
| `CreateAssetTx` | Create new asset |
| `OperationTx` | NFT operations |
| `ImportTx` | Import from other chains |
| `ExportTx` | Export to other chains |
| `CreateOrderTx` | Create trading order |
| `CancelOrderTx` | Cancel trading order |
| `TradeTx` | Execute trade (system) |

### Order Book

```go
type OrderBook struct {
    Bids        *OrderTree    // Red-black tree by price
    Asks        *OrderTree
    OrderMap    map[ids.ID]*Order
    PriceMap    map[uint64]*PriceLevel
    BestBid     *PriceLevel
    BestAsk     *PriceLevel
}

type Order struct {
    ID          ids.ID
    Trader      ids.ShortID
    Type        OrderType     // Limit, Market, Stop
    Side        OrderSide     // Buy, Sell
    Price       uint64
    Amount      uint64
    Remaining   uint64
    Timestamp   uint64
}
```

### Matching Engine

```go
func (ob *OrderBook) MatchOrder(order *Order) ([]*Trade, error) {
    // Price-time priority matching
    // 1. Best price first
    // 2. Earlier timestamp at same price
    // 3. Partial fills supported
}
```

**Matching Rules**:
- Price-time priority (FIFO)
- Partial fills allowed
- Maker/taker fee separation
- Post-only orders supported

### API Endpoints

#### RPC Methods

| Method | Description |
|--------|-------------|
| `avm.getUTXOs` | Get UTXOs for address |
| `avm.getAssetDescription` | Get asset info |
| `avm.getTx` | Get transaction |
| `avm.issueTx` | Issue transaction |
| `avm.getBalance` | Get balance |
| `avm.createAsset` | Create asset |

#### Trading API

| Method | Description |
|--------|-------------|
| `exchange.createOrder` | Create trading order |
| `exchange.cancelOrder` | Cancel order |
| `exchange.getOrderBook` | Get order book |
| `exchange.getOrders` | Get user orders |
| `exchange.getTrades` | Get trade history |

#### REST Endpoints

```
GET  /ext/bc/X/utxos/{address}
GET  /ext/bc/X/assets/{assetID}
POST /ext/bc/X/transactions/send
GET  /ext/bc/X/orderbook/{pair}
POST /ext/bc/X/orders/create
DELETE /ext/bc/X/orders/{orderID}
```

### Asset Creation

```go
type CreateAssetTx struct {
    BaseTx
    Name         string
    Symbol       string
    Denomination byte
    States       []State
}
```

### Cross-Chain Operations

#### Import from C-Chain

```go
type ImportTx struct {
    BaseTx
    SourceChain ids.ID
    ImportedIns []*UTXO
}
```

#### Export to P-Chain

```go
type ExportTx struct {
    BaseTx
    DestinationChain ids.ID
    ExportedOuts     []*TransferOutput
}
```

### Configuration

```json
{
  "exchangevm": {
    "txFee": 1000000,
    "createAssetTxFee": 10000000,
    "orderBookDepth": 100,
    "maxOrdersPerUser": 1000,
    "matchingEngineWorkers": 8,
    "enableLamportOTS": true
  }
}
```

### Performance

| Metric | Value |
|--------|-------|
| Order Throughput | 100,000+ orders/sec |
| Match Latency | <1ms |
| Finality | ~2 seconds |
| DAG Parallelism | High |

## Rationale

Design decisions for X-Chain:

1. **DAG Structure**: Enables parallel order processing
2. **UTXO Model**: Clean atomic operations
3. **Native Order Book**: Trading as first-class operation
4. **Cross-Chain**: Seamless asset transfers

## Backwards Compatibility

LP-3000 supersedes LP-0011. Both old and new numbers resolve to this document.

## Test Cases

```bash
# Test X-Chain VM
cd node && go test ./vms/exchangevm/... -v

# Test order book
go test ./vms/exchangevm/orderbook/... -v

# Test matching engine
go test ./vms/exchangevm/matching/... -v

# DEX tests
cd dex && go test ./pkg/lx/... -v
```

## Reference Implementation

**Repositories**:
- `github.com/luxfi/node` (VM implementation)
- `github.com/luxfi/dex` (DEX implementation)

**Packages**:
- `vms/exchangevm`
- `dex/pkg/lx`
- `dex/pkg/orderbook`

## Security Considerations

1. **Front-Running**: Time-based ordering prevents manipulation
2. **Atomic Operations**: UTXO model ensures atomicity
3. **Order Validation**: All orders validated before matching
4. **Cross-Chain Security**: Atomic imports/exports

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0011 | X-Chain Specification | Superseded by this LP |
| LP-3100 | Order Book | Sub-specification |
| LP-3200 | UTXO Management | Sub-specification |
| LP-3300 | Asset Creation | Sub-specification |
| LP-3400 | Trading Mechanics | Sub-specification |
| LP-9000 | DEX Core | DEX protocol layer |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
