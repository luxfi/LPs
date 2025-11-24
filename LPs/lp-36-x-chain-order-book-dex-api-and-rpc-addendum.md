---
lp: 36
title: X-Chain Order-Book DEX API & RPC Addendum
description: Detailed specification of transaction types, wire formats, RPC endpoints, indexer schema, and CLI enhancements for the X-Chain Order-Book DEX extension (LP-006)
author: Zach Kelling (@zeekay) and Lux Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-07-24
requires: 6
---

## Abstract

This addendum to LP-006 (X-Chain Order-Book DEX) formalizes the API, wire-format, and tooling changes required to integrate a high-performance, on-chain order-book DEX into the Lux X-Chain node software. It covers new transaction types, codec definitions, JSON-RPC and gRPC methods, WebSocket feeds, indexer extensions, mempool prioritization, CLI enhancements, governance parameters, and performance guard-rails.

## Motivation

To build a native, LX-style DEX on X-Chain, we must extend the core UTXO/Fx transaction model with order/trade primitives, provide rich API surfaces for real-time and historical data, and integrate indexing and signing tools. This addendum specifies every required change so that explorer, wallet, and bot developers can rely on a uniform, performant interface.

## Specification

### 0 Principles

| Goal                   | Implementation choice                                                   |
|------------------------|---------------------------------------------------------------------------|
| Backward-compatibility | Keep existing UTXO/Fx bookkeeping untouched; DEX logic in new DexFx plugin |
| Single source of truth | All order, trade, funding & PnL state lives on X-Chain; external via Warp   |
| Uniform tooling        | Extend JSON-RPC `dex.*`, add gRPC, WS feeds                              |
| Sub-second UX          | Push-first streaming APIs (no polling)                                    |
| Auditable history      | Dedicated DEX indexer tags orders/trades for full reconstruction          |

### 1 New Transaction Types (Codec layer)

| TxID  | Name                  | Purpose                                        | Typical size (bytes)    |
|:-----:|:----------------------|:-----------------------------------------------|:------------------------|
| 0x5a  | OrderTx               | Place limit/market/stop/TWAP order             | 260–320                 |
| 0x5b  | CancelTx              | Cancel up to 32 order IDs                      | 120–450                 |
| 0x5c  | ModifyTx              | Amend price/size/flags of an open order        | 160                     |
| 0x5d  | BatchLiquidationTx    | Liquidate N traders in one transaction         | 200+40×N                |
| 0x5e  | FundingSettleTx       | System-generated funding payment transfers     | 180+40×numTraders       |

#### 1.1 OrderTx serialization (AVAX codec v1)

```go
type OrderTx struct {
    BaseTx          `serialize:"true"`         // Ins/Outs, memo, fee
    MarketID  uint32 `serialize:"true"`         // asset-pair index
    Side      byte   `serialize:"true"`         // 0=buy,1=sell
    Price     uint64 `serialize:"true"`         // Price *1e6
    Size      uint64 `serialize:"true"`         // Size *1e6
    OrderType byte   `serialize:"true"`         // 0=limit,1=market,2=stop,3=twap
    Flags     byte   `serialize:"true"`         // postOnly,reduced,IOC...
    StopPrice uint64 `serialize:"true,optional"`// if stop-order
    Expiry    uint64 `serialize:"true,optional"`// GTC=0
    TWAP      uint16 `serialize:"true,optional"`// seconds between slices
    SubAcct   uint32 `serialize:"true"`         // sub-account ID
}

// Validation: Size>0, Price>0 unless OrderType==market.
```

#### 1.2 DexFx extension

Register a new feature extension `DexFxID = 0x08`. Nodes load the DexFx plugin to:
- Validate order/cancel business logic
- Maintain in-memory order book (price→b+tree)
- Emit TradeLog, OrderLog, LiquidationLog to database

### 2 Node RPC – JSON-RPC namespace `dex.*`

All methods exposed under `/ext/bc/X` endpoint. Public reads are open; state mutation calls require `X-Chain-Signature` header.

| Method               | Input                              | Output                             | Notes                                           |
|----------------------|------------------------------------|------------------------------------|-------------------------------------------------|
| dex.placeOrder       | `{txBytes,signature}`              | `{txID}`                           | Client pre-builds OrderTx, node validates & submits
| dex.cancel           | `{orderIDs[]}`                     | `{txID}`                           | Packs up to 32 IDs per CancelTx                 
| dex.modify           | `{orderID,newPrice?,newSize?,newFlags?}`| `{txID}`                   | Emits ModifyTx                                  
| dex.getOrderBook     | `{market,depth}`                   | `{bids[],asks[]}`                  | depth ≤500                                      
| dex.getTrades        | `{market,limit,before?}`           | `{trades[]}`                       | newest-first                                    
| dex.getAccount       | `{address}`                        | `{balances,margin,subAccounts[]}`  | includes open orders & PnL                      
| dex.getPosition      | `{address,market}`                 | `{size,entryPrice,uPnL}`           | cross or isolated                               
| dex.getFundingRates  | `{market}`                         | `{current,hourly,nextTick}`        | per funding epoch                               
| dex.getMarkets       | `{}`                               | `{markets[]}`                      | tickSize,lotSize,leverage,status                

### 3 gRPC Service (port 9760)

```protobuf
service DexService {
  rpc PlaceOrder   (OrderRequest) returns (TxAck);
  rpc Cancel       (CancelRequest) returns (TxAck);
  rpc StreamBook   (BookSub)    returns (stream BookDelta);
  rpc StreamTrades (TradeSub)   returns (stream TradeEvent);
  rpc StreamAccount(AcctSub)    returns (stream AccountUpdate);
}
```

Latency target: <25 ms; back-pressure window = 64 MiB.

### 4 Web‑Socket Push Feeds

| URL                                      | Payload                         | Throttle    |
|------------------------------------------|---------------------------------|-------------|
| `wss://node:9650/ws?streams=book.{mkt}@100ms`  | L2 book deltas                  | 100 ms      |
| `…streams=trades.{mkt}`                   | `{price,size,side,tid}`         | real-time   |
| `…streams=ticker.{mkt}`                   | `{last,indexPrice,funding}`     | 1 s         |
| `…streams=account:{addr}`                 | position & margin deltas (JWT)  | event-driven|

Auth handshake: sign keccak256(nonce) with X‑Chain key; send `{auth:{addr,sig}}`.

### 5 Indexer (DEX-IndexDB)

Extend indexer plugin with column-families: orders, trades, positions, liquidations keyed by (market,seq). TradeLog must include seq, taker/maker IDs, price, size, fees.

### 6 Mempool & Prioritization

Priority = (gasFeeCap μLux × weightFee) + makerBonus – cancelWeight. Fast‑lane for CancelTx bypasses queue (–10 ms).

### 7 CLI Enhancements

```
lux-cli dex markets
lux-cli dex place --mkt BTC-USD --side buy --price 63421.5 --size 0.8 --post-only
lux-cli dex cancel --order 0xabc123
lux-cli dex positions
lux-cli dex funding --market ETH-USD
```

### 8 Governance & Params

Store fees/limits in DAO DexParams contract; updatable by ≥⅔ vote. Example:
| Param           | Default | Range    |
|-----------------|---------|----------|
| makerFeeBps     | −1      | −5 … 0   |
| takerFeeBps     | 3       | 0 … 10   |
| fundingInterval | 3600    | 600 …86400|

### 9 Performance Guard‑Rails

OrderTx gas≈1400; CancelTx≈500 → 40 M-gas block supports ~1 M tx/s across markets. CI harness `xchain-loadgen` runs 1000 TPS×20 markets, CPU<75%.

### 10 Roll‑Out Sequence

1. Devnet (Q4 2025): spot only, example markets BTC-USD, ETH-USD.
2. Beta (Q1 2026): add perps, funding, cross-margin.
3. Mainnet (Q2 2026): 50 markets, fees → validator reward pot.
4. Phase 2: Z‑Chain shielded trading, dark‑pool orders.

## Rationale

This addendum standardizes all API and wire-format changes for a DEX extension without altering X-Chain UTXO semantics, enabling explorer, wallet, and bot support from day one.

## Backwards Compatibility

DEX features live behind the DexFx extension; nodes without DexFx see no behavior change.

## Test Cases

1. Place/cancel/modify flows with valid and invalid inputs.
2. Market depth and trade feed integrity under load.
3. Indexer correctness for historical queries.

## Implementation

### X-Chain DEX Extension Architecture

**Location**: `~/work/lux/node/vms/avm/`
**GitHub**: [`github.com/luxfi/node/tree/main/vms/avm`](https://github.com/luxfi/node/tree/main/vms/avm)

**Core Components**:
- [`plugins/dex/dex_fx.go`](https://github.com/luxfi/node/blob/main/vms/avm/plugins/dex/dex_fx.go) - DexFx plugin implementation
- [`plugins/dex/transactions.go`](https://github.com/luxfi/node/blob/main/vms/avm/plugins/dex/transactions.go) - OrderTx, CancelTx codec
- [`plugins/dex/orderbook.go`](https://github.com/luxfi/node/blob/main/vms/avm/plugins/dex/orderbook.go) - In-memory order book
- [`plugins/dex/rpc.go`](https://github.com/luxfi/node/blob/main/vms/avm/plugins/dex/rpc.go) - RPC methods

**DEX Indexer Service**:
- Location: `~/work/lux/stack/dex-indexer/`
- [`main.go`](https://github.com/luxfi/stack/blob/main/dex-indexer/main.go) - Service entrypoint
- [`indexer.go`](https://github.com/luxfi/stack/blob/main/dex-indexer/indexer.go) - Event indexing engine

**Order Book Implementation**:
```go
// From plugins/dex/orderbook.go
type OrderBook struct {
    bids *bplus.Tree  // price descending
    asks *bplus.Tree  // price ascending
    mu   sync.RWMutex
}

func (ob *OrderBook) PlaceOrder(order OrderTx) error {
    ob.mu.Lock()
    defer ob.mu.Unlock()

    side := &ob.bids
    if order.Side == SELL {
        side = &ob.asks
    }

    // Insert at price level
    return side.Insert(order.Price, order)
}

func (ob *OrderBook) GetBook(depth uint16) (bids, asks []PriceLevel) {
    ob.mu.RLock()
    defer ob.mu.RUnlock()

    for i := 0; i < depth; i++ {
        if item, ok := ob.bids.At(i); ok {
            bids = append(bids, item.(PriceLevel))
        }
    }
    return
}
```

**Testing**:
```bash
cd ~/work/lux/node
go test ./vms/avm/plugins/dex/... -v -bench=BenchmarkOrderBook

cd ~/work/lux/stack
go test ./dex-indexer/... -v
```

### RPC & WebSocket Performance

**dex.* RPC Endpoint Performance**:
- `dex.placeOrder`: <50 ms
- `dex.getOrderBook(depth=500)`: <20 ms
- `dex.getTrades(limit=100)`: <10 ms

**WebSocket Streams** (latency from event to push):
- `book.{market}@100ms`: 100 ms throttle
- `trades.{market}`: <5 ms real-time
- `ticker.{market}`: 1 s throttle

## Reference Implementation

See `plugins-core/dex` for DexFx code and `stack/dex-indexer` for indexing service.

## Security Considerations

- Validate all DEX transactions in plugin before UTXO application.
- Rate-limit RPC and WS streams to mitigate abuse.
- Implement market circuit breakers for extreme price moves.
- Enforce minimum order sizes to prevent dust attacks.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).