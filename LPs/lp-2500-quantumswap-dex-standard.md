---
lp: 2500
title: QuantumSwap DEX Standard
description: Native high-performance DEX for Lux Network with full on-chain CLOB and post-quantum security
author: Hanzo AI (@hanzoai), Lux Network (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2024-12-14
requires: 2001, 110
tags: [dex, trading, clob, post-quantum]
activation:
  flag: lp-2500-quantumswap
  hfName: "quantumswap"
  activationHeight: "0"
order: 500
---

## Abstract

This LP defines **QuantumSwap**, the native high-performance decentralized exchange for the Lux Network. QuantumSwap implements a full on-chain Central Limit Order Book (CLOB) architecture, achieving 434M orders/second throughput with 2ns latency on GPU hardware. Combined with Lux's 1ms block finality via FPC consensus and post-quantum QZMQ protocol, QuantumSwap provides institutional-grade trading infrastructure without centralized dependencies.

## Activation

| Parameter          | Value                           |
|--------------------|--------------------------------|
| Flag string        | `lp2500-quantumswap`           |
| Default in code    | **false** until block TBD      |
| Deployment branch  | `v1.12.0-quantumswap`          |
| Roll-out criteria  | Testnet validation complete    |
| Back-off plan      | Disable via flag               |

## Motivation

The Lux Network requires a native DEX that:

1. **Matches CEX Performance**: AMM-based DEXs (Uniswap v2/v3/v4) cannot compete with centralized exchanges on latency, throughput, or price discovery
2. **Full On-Chain Execution**: Off-chain orderbooks compromise decentralization; QuantumSwap executes entirely on-chain
3. **Post-Quantum Security**: Trading infrastructure must be quantum-resistant from inception
4. **Native Integration**: Protocol-level DEX enables gas optimization, precompile acceleration, and consensus-aware execution
5. **Institutional Requirements**: Market makers and HFT firms require CLOB semantics, not AMM curves

### Why Skip Uniswap v4 AMM

| Limitation | Uniswap v4 | QuantumSwap |
|------------|-----------|-------------|
| Architecture | AMM (x*y=k) | Full CLOB |
| Price Discovery | Reactive (arbitrage-driven) | Proactive (order-driven) |
| Latency | ~12s (Ethereum) / ~2s (L2) | 2ns (matching) / 1ms (finality) |
| Throughput | ~100 swaps/block | 434M orders/sec |
| Slippage | Predictable, often high | Zero for limit orders |
| MEV | Sandwich attacks endemic | Time-priority matching eliminates |
| Institutional Use | Limited | Full support |

Uniswap v4's hook system improves AMM flexibility but cannot overcome fundamental AMM limitations for professional trading. QuantumSwap provides CLOB infrastructure while retaining Uniswap v2/v3 compatibility for legacy AMM pools.

## Specification

### 1. Architecture Overview

```
+------------------------------------------------------------------+
|                    QuantumSwap DEX Architecture                   |
|  +---------------+  +----------------+  +---------------------+   |
|  | Order Gateway |  | Matching       |  | Settlement          |   |
|  | (QZMQ/gRPC)   |--| Engine (CLOB)  |--| Engine              |   |
|  | PQ-Encrypted  |  | GPU/MLX/CPU    |  | Atomic Execution    |   |
|  +---------------+  +----------------+  +---------------------+   |
|          |                 |                     |                |
|  +-------+-----------------+---------------------+-------+        |
|  |                    State Manager                      |        |
|  |  +---------+  +-----------+  +-----------+           |        |
|  |  | Order   |  | Position  |  | Balance   |           |        |
|  |  | Book DB |  | Tracker   |  | Ledger    |           |        |
|  |  +---------+  +-----------+  +-----------+           |        |
|  +-------------------------------------------------------+        |
|                              |                                    |
|                    +---------+---------+                          |
|                    | Consensus Layer   |                          |
|                    | (FPC/Quasar)      |                          |
|                    | 1ms Finality      |                          |
|                    +-------------------+                          |
+------------------------------------------------------------------+
```

### 2. Performance Specifications

| Engine | Throughput | Latency | Use Case |
|--------|-----------|---------|----------|
| Go Engine | 1M ops/sec | 100ns | Standard nodes |
| C++ Engine | 500K ops/sec | 50ns | Low-latency nodes |
| GPU Engine (CUDA) | 434M ops/sec | 2ns | High-performance validators |
| MLX Engine (Apple) | 434M ops/sec | 2ns | Apple Silicon validators |

**Benchmark Conditions**:
- Order types: Limit, Market, Stop, IOC, FOK, GTC
- Order book depth: 1M orders per side
- Hardware: NVIDIA H100 (GPU), Apple M3 Ultra (MLX)

### 3. Order Book Data Structures

```go
// Order represents a single order in the book
type Order struct {
    ID         ids.ID    `json:"id"`
    Trader     Address   `json:"trader"`
    Pair       TradePair `json:"pair"`
    Side       Side      `json:"side"`      // Bid or Ask
    Price      *big.Int  `json:"price"`     // Fixed-point 18 decimals
    Quantity   *big.Int  `json:"quantity"`  // Base token units
    Filled     *big.Int  `json:"filled"`    // Amount filled
    Type       OrderType `json:"type"`      // Limit, Market, Stop, etc.
    Flags      uint32    `json:"flags"`     // IOC, FOK, PostOnly, etc.
    Timestamp  uint64    `json:"timestamp"` // Nanosecond precision
    Expiry     uint64    `json:"expiry"`    // 0 = GTC
    Signature  []byte    `json:"signature"` // ML-DSA or ECDSA
}

// OrderBook maintains price-time priority queues
type OrderBook struct {
    Pair   TradePair
    Bids   *PriceLevel // Max-heap by price, FIFO at price
    Asks   *PriceLevel // Min-heap by price, FIFO at price
    Orders map[ids.ID]*Order
}

// PriceLevel is a sorted list of orders at a price point
type PriceLevel struct {
    Price  *big.Int
    Orders []*Order // Time-ordered queue
    Total  *big.Int // Sum of quantities
}
```

### 4. Matching Engine

The matching engine implements strict price-time priority:

```go
// Match processes an incoming order against the book
func (e *Engine) Match(order *Order) ([]Trade, error) {
    book := e.books[order.Pair]
    var trades []Trade

    opposite := book.Bids
    if order.Side == Bid {
        opposite = book.Asks
    }

    for order.Remaining() > 0 && opposite.Len() > 0 {
        best := opposite.Peek()
        if !order.Crosses(best.Price) {
            break
        }

        // Execute at resting order price (price improvement)
        trade := e.execute(order, best)
        trades = append(trades, trade)

        if best.Remaining() == 0 {
            opposite.Pop()
            delete(book.Orders, best.ID)
        }
    }

    // Add remainder to book (if limit order)
    if order.Remaining() > 0 && order.Type == Limit {
        e.addToBook(book, order)
    }

    return trades, nil
}
```

### 5. Consensus Integration

QuantumSwap integrates with Lux consensus for atomic execution:

```go
// Block contains DEX operations for a consensus round
type DexBlock struct {
    Height     uint64
    Timestamp  time.Time
    Orders     []Order        // New orders
    Cancels    []ids.ID       // Cancelled orders
    Trades     []Trade        // Executed trades
    Settlements []Settlement  // Balance updates
    StateRoot  [32]byte       // Merkle root of DEX state
}

// FPC provides 1ms finality for DEX blocks
// Orders submitted in block N are final by block N+1
```

**Finality Guarantees**:
- Block production: 250ms
- FPC finality: 1ms after block
- Total order-to-settlement: ~251ms

### 6. Post-Quantum Security (QZMQ Protocol)

All DEX communications use quantum-resistant encryption:

```go
// QZMQ wraps ZeroMQ with post-quantum cryptography
type QZMQSocket struct {
    inner    zmq.Socket
    kemKey   *mlkem.PrivateKey  // ML-KEM-768 for key exchange
    dsaKey   *mldsa.PrivateKey  // ML-DSA-65 for signatures
    session  []byte             // Ephemeral session key
}

// Order submission requires ML-DSA signature
func (s *QZMQSocket) SubmitOrder(order *Order) error {
    // Verify ML-DSA-65 signature on order
    if !mldsa.Verify(order.Trader.PublicKey(), order.Hash(), order.Signature) {
        return ErrInvalidSignature
    }
    // Encrypt with ML-KEM derived session key
    encrypted := s.encrypt(order.Encode())
    return s.inner.Send(encrypted, 0)
}
```

**Cryptographic Primitives**:
- Key Exchange: ML-KEM-768 (FIPS 203)
- Signatures: ML-DSA-65 (FIPS 204)
- Symmetric: AES-256-GCM with PQ-derived keys

### 7. Custody Precompiles

QuantumSwap integrates with Lux custody precompiles for institutional traders:

| Precompile | Address | Function |
|------------|---------|----------|
| FROST | `0x0300` | Threshold signatures (t-of-n) |
| CGGMP21 | `0x0301` | Multi-party computation signing |
| Ringtail | `0x0302` | Ring signatures for privacy |

```solidity
// Example: 3-of-5 FROST custody for trading account
interface IFrostCustody {
    function submitOrder(
        bytes calldata order,
        bytes calldata frostSignature,
        uint8[] calldata signerIndices
    ) external returns (bytes32 orderId);
}
```

### 8. RPC API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rpc/dex/orderbook/{pair}` | GET | Get order book snapshot |
| `/rpc/dex/orderbook/{pair}/depth` | GET | Get aggregated depth |
| `/rpc/dex/orders` | POST | Submit new order |
| `/rpc/dex/orders/{id}` | GET | Get order status |
| `/rpc/dex/orders/{id}` | DELETE | Cancel order |
| `/rpc/dex/trades/{pair}` | GET | Recent trades |
| `/rpc/dex/account/{address}` | GET | Account balances/positions |
| `/rpc/dex/pairs` | GET | List trading pairs |
| `/rpc/dex/ticker/{pair}` | GET | 24h statistics |
| `/rpc/dex/ws` | WS | Real-time order book updates |

### 9. Fee Structure

```go
type FeeSchedule struct {
    MakerFee    uint16 // Basis points (default: 0)
    TakerFee    uint16 // Basis points (default: 5 = 0.05%)
    MinFee      uint64 // Minimum fee in LUX wei
    ProtocolFee uint16 // Protocol treasury (default: 1 bp)
}

// Volume-based fee tiers
var FeeTiers = []FeeTier{
    {MinVolume: 0,          MakerFee: 0, TakerFee: 5},   // 0.05%
    {MinVolume: 1_000_000,  MakerFee: 0, TakerFee: 4},   // 0.04%
    {MinVolume: 10_000_000, MakerFee: 0, TakerFee: 3},   // 0.03%
    {MinVolume: 100_000_000, MakerFee: -1, TakerFee: 2}, // -0.01% maker rebate
}
```

## Comparison: QuantumSwap vs Uniswap v4

| Feature | QuantumSwap | Uniswap v4 |
|---------|-------------|------------|
| **Architecture** | Full CLOB | AMM with hooks |
| **Order Types** | Limit, Market, Stop, IOC, FOK | Swap only |
| **Throughput** | 434M orders/sec | ~100 swaps/block |
| **Latency** | 2ns match / 1ms final | Block time (2-12s) |
| **Price Discovery** | Order-driven | Arbitrage-driven |
| **Slippage** | Zero (limit orders) | Predictable, non-zero |
| **MEV Protection** | Time-priority matching | Hook-dependent |
| **Maker Rebates** | Yes | No |
| **Institutional** | Full support | Limited |
| **Security** | Post-quantum (ML-DSA/ML-KEM) | ECDSA |
| **Custody** | FROST/CGGMP21/Ringtail | External only |
| **Chain** | Native Lux | EVM-compatible |

## Legacy AMM Compatibility

QuantumSwap coexists with Uniswap v2/v3 pools for:

1. **LP Token Liquidity**: Existing LRC-20 LP tokens remain valid
2. **TWAP Oracles**: Uniswap v3 TWAP oracles for price feeds
3. **Long-Tail Assets**: AMM curves for low-volume pairs
4. **Migration Path**: Gradual transition from AMM to CLOB

```solidity
// Bridge interface for AMM <-> CLOB arbitrage
interface IAMMBridge {
    function syncPrice(address pair, uint256 clobPrice) external;
    function arbitrage(address pair, uint256 amount, bool buyOnClob) external;
}
```

## Rationale

### Why Full On-Chain CLOB?

1. **Decentralization**: Off-chain orderbooks require trusted operators
2. **Transparency**: All orders visible and verifiable on-chain
3. **Composability**: Smart contracts can interact with order book state
4. **Censorship Resistance**: No sequencer can censor orders

### Why Post-Quantum From Day One?

1. **Infrastructure Longevity**: DEX is critical financial infrastructure
2. **Harvest Attacks**: Trading patterns are high-value targets for future quantum attacks
3. **Lux Native**: Leverages LP-200 post-quantum cryptography suite

### Why GPU/MLX Acceleration?

1. **Parallel Matching**: Order matching is embarrassingly parallel
2. **Deterministic**: Same results on CPU/GPU/MLX (verified by tests)
3. **Validator Choice**: Operators select hardware based on volume requirements

## Backwards Compatibility

- Existing Uniswap v2/v3 deployments continue unchanged
- LRC-20 tokens compatible with QuantumSwap trading pairs
- EVM wallets can interact via standard token approvals
- Legacy ECDSA signatures accepted alongside ML-DSA

## Test Cases

```bash
# Build QuantumSwap
cd /Users/z/work/lux/dex
go build ./...

# Run unit tests
go test -v ./engine/...
go test -v ./orderbook/...
go test -v ./matching/...

# Run integration tests
go test -v ./integration/...

# Benchmark matching engine
go test -bench=BenchmarkMatch -benchmem ./engine/...

# GPU/MLX determinism tests
go test -v -tags=gpu ./engine/gpu/...
go test -v -tags=mlx ./engine/mlx/...
```

**Test Coverage Requirements**:

| Component | Minimum Coverage |
|-----------|-----------------|
| Order Book | 95% |
| Matching Engine | 98% |
| Settlement | 95% |
| QZMQ Protocol | 90% |
| RPC API | 85% |

## Reference Implementation

| Component | Location |
|-----------|----------|
| DEX Core | [`dex/`](https://github.com/luxfi/dex) |
| Order Book | [`dex/orderbook/`](https://github.com/luxfi/dex/tree/main/orderbook) |
| Matching Engine | [`dex/engine/`](https://github.com/luxfi/dex/tree/main/engine) |
| GPU Engine | [`dex/engine/gpu/`](https://github.com/luxfi/dex/tree/main/engine/gpu) |
| MLX Engine | [`dex/engine/mlx/`](https://github.com/luxfi/dex/tree/main/engine/mlx) |
| QZMQ Protocol | [`dex/qzmq/`](https://github.com/luxfi/dex/tree/main/qzmq) |
| RPC Service | [`dex/api/`](https://github.com/luxfi/dex/tree/main/api) |
| Contracts | [`dex/contracts/`](https://github.com/luxfi/dex/tree/main/contracts) |

**Release Tag:** `v1.12.0-quantumswap`

## Security Considerations

### Order Integrity
- All orders require valid signatures (ML-DSA-65 or ECDSA)
- Order IDs derived from content hash prevent replay
- Timestamps prevent stale order injection

### Front-Running Protection
- Strict time-priority matching eliminates traditional front-running
- Encrypted order submission via QZMQ prevents mempool snooping
- Block proposers cannot reorder within consensus round

### Custody Security
- FROST threshold signatures enable institutional custody
- CGGMP21 MPC for distributed key management
- Ringtail ring signatures for privacy-preserving trades

### Post-Quantum Threats
- ML-KEM-768 protects order submission from harvest attacks
- ML-DSA-65 signatures resist quantum forgery
- Hybrid mode supports ECDSA fallback during transition

### Economic Attacks
- Minimum order sizes prevent spam
- Fee tiers discourage wash trading
- Rate limiting on order submission per address

## Economic Impact

### Market Maker Incentives
- Zero maker fees encourage liquidity provision
- Maker rebates at high volume tiers
- FROST custody enables institutional participation

### Trader Benefits
- Zero slippage on limit orders
- Transparent order book depth
- Sub-second execution finality

### Protocol Revenue
- 1 basis point protocol fee to treasury
- Fee distribution via governance

## Related Proposals

- **LP-110**: Quasar Consensus Protocol (sub-second finality)
- **LP-200**: Post-Quantum Cryptography Suite
- **LP-2001**: AIVM - AI Virtual Machine
- **LP-0004**: Quantum Resistant Cryptography Integration

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
