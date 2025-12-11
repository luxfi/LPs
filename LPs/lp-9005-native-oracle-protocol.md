---
lp: 9005
title: Native Oracle Protocol (Network-Wide)
tags: [oracle, dex, price-feed, t-chain, warp, a-chain, c-chain, x-chain, lp-9000-series]
description: Native oracle protocol for Lux network with sub-600ms price feeds via T-Chain signers and Warp TeleportAttest - OVER 9000x FASTER
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
updated: 2025-12-11
requires: [9001, 9002, LP-12, LP-13, LP-80]
supersedes: 0610
series: LP-9000 DEX Series
implementation: https://github.com/luxfi/dex
---

> **Part of LP-9000 Series**: This LP is part of the [LP-9000 DEX Series](./lp-9000-dex-overview.md) - Lux's high-performance decentralized exchange infrastructure.

> **LP-9000 Series**: [LP-9000 Overview](./lp-9000-dex-overview.md) | [LP-9001 X-Chain](./lp-9001-x-chain-exchange-specification.md) | [LP-9002 API](./lp-9002-dex-api-rpc-specification.md) | [LP-9003 Performance](./lp-9003-high-performance-dex-protocol.md) | [LP-9004 Perpetuals](./lp-9004-perpetuals-derivatives-protocol.md)

## Implementation Status

| Component | Source | Status |
|-----------|--------|--------|
| Price Types | [`dex/pkg/price/types.go`](https://github.com/luxfi/dex/blob/main/pkg/price/types.go) | ✅ Complete |
| Price Aggregator | [`dex/pkg/price/aggregator.go`](https://github.com/luxfi/dex/blob/main/pkg/price/aggregator.go) | ✅ Complete |
| Pyth Source | [`dex/pkg/price/pyth.go`](https://github.com/luxfi/dex/blob/main/pkg/price/pyth.go) | ✅ Complete |
| Chainlink Source | [`dex/pkg/price/chainlink.go`](https://github.com/luxfi/dex/blob/main/pkg/price/chainlink.go) | ✅ Complete |
| C-Chain AMM Source | [`dex/pkg/price/cchain.go`](https://github.com/luxfi/dex/blob/main/pkg/price/cchain.go) | ✅ Complete |
| Orderbook Source | [`dex/pkg/price/source.go`](https://github.com/luxfi/dex/blob/main/pkg/price/source.go) | ✅ Complete |
| Full Oracle (LX) | [`dex/pkg/lx/oracle.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/oracle.go) | ✅ Complete |
| Alpaca Source | [`dex/pkg/lx/alpaca_source.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/alpaca_source.go) | ✅ Complete |

> **See also**: [LP-11](./lp-0011-x-chain-exchange-chain-specification.md), [LP-12](./lp-0012-c-chain-contract-chain-specification.md), [LP-36](./lp-0036-x-chain-order-book-dex-api-and-rpc-addendum.md), [LP-13](./lp-0013-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md), [LP-80](./lp-0080-a-chain-attestation-chain-specification.md), [LP-608](./lp-0608-high-performance-dex-protocol.md), [LP-INDEX](./LP-INDEX.md)

## Abstract

This LP specifies a **network-wide native oracle protocol** for Lux that leverages T-Chain threshold signers to provide decentralized, low-latency price feeds accessible from **all chains** (X-Chain, C-Chain, A-Chain). The protocol aggregates prices from external oracles (Pyth, Chainlink) and centralized exchanges, applies weighted median filtering with circuit breakers, and delivers attested price data via Warp TeleportAttest messages. This enables:

- **X-Chain**: Sub-second price updates for perpetuals/DEX trading
- **C-Chain**: Precompile-based oracle access for smart contracts (DeFi, lending, derivatives)
- **A-Chain**: Price attestation integration for compute/energy pricing and cross-domain validation

## Motivation

A unified oracle infrastructure provides:

1. **Low Latency**: Sub-second price updates (<600ms end-to-end)
2. **Multi-Chain Access**: Same oracle infrastructure serves all Lux chains
3. **Decentralization**: 100 bonded signers (100M LUX each) with 2/3 BFT threshold
4. **Circuit Breakers**: Protection against erroneous or manipulated prices
5. **Native Integration**: No external oracle dependencies or bridge risks

The existing T-Chain infrastructure (LP-13, LP-14) provides the natural committee for price attestation. By combining this with Warp messaging and chain-specific delivery mechanisms, we create a fully native oracle serving the entire network.

## Specification

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       LUX NETWORK-WIDE ORACLE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  EXTERNAL SOURCES                                                                │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Pyth    │  │ Chainlink │  │ Binance  │  │ Coinbase │  │ C-Chain  │         │
│  │ WebSocket│  │  Polling  │  │   WS     │  │   WS     │  │   AMMs   │         │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │              │             │             │              │               │
│       └──────────────┴──────┬──────┴─────────────┴──────────────┘               │
│                             ▼                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐      │
│  │                      T-CHAIN PRICE OBSERVERS                           │      │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │      │
│  │  │               Oracle Aggregator (per signer)                     │  │      │
│  │  │  • WeightedMedian aggregation                                    │  │      │
│  │  │  • CircuitBreaker (>10% deviation triggers)                      │  │      │
│  │  │  • TWAP/VWAP calculation (5-min window)                          │  │      │
│  │  │  • Stale price detection (2s timeout)                            │  │      │
│  │  └─────────────────────────────────────────────────────────────────┘  │      │
│  │                                                                        │      │
│  │  Signers: S₁, S₂, ... S₁₀₀  (100M LUX bond each)                      │      │
│  │  Threshold: 67/100 (2/3 BFT)                                           │      │
│  └───────────────────────────────────────────────────────────────────────┘      │
│                              │                                                   │
│                              ▼                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐      │
│  │                     WARP TELEPORTATTEST                                │      │
│  │  Type: 4 (TeleportAttest) / AttestationType: 0x01 (PriceFeed)         │      │
│  │  Payload: PriceFeedPayload                                             │      │
│  │  Signature: BLS aggregate (67+ signers) + optional Ringtail (PQ)       │      │
│  └───────────────────────────────────────────────────────────────────────┘      │
│                              │                                                   │
│      ┌───────────────────────┼───────────────────────┐                          │
│      ▼                       ▼                       ▼                          │
│  ┌────────────┐       ┌────────────┐         ┌────────────┐                     │
│  │  X-CHAIN   │       │  C-CHAIN   │         │  A-CHAIN   │                     │
│  │   (DEX)    │       │   (EVM)    │         │ (Attest)   │                     │
│  ├────────────┤       ├────────────┤         ├────────────┤                     │
│  │oracle.* RPC│       │Precompile  │         │PriceOracle │                     │
│  │Mark price  │       │0x0300...001│         │Compute$    │                     │
│  │Funding rate│       │DeFi/Lending│         │Energy$     │                     │
│  │Liquidation │       │Derivatives │         │CrossDomain │                     │
│  └────────────┘       └────────────┘         └────────────┘                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Price Feed Payload Format

The `PriceFeedPayload` extends `TeleportAttestPayload` (type 4) with structured price data:

```go
// PriceFeedPayload carries aggregated price data
type PriceFeedPayload struct {
    // Header
    Version     uint8      `serialize:"true"` // Protocol version (1)
    Timestamp   uint64     `serialize:"true"` // Unix timestamp (ms)
    AttesterID  ids.NodeID `serialize:"true"` // T-Chain signer
    
    // Price Data
    Symbol      string  `serialize:"true"` // e.g., "BTC-USD"
    Price       uint64  `serialize:"true"` // Price in 1e8 precision
    Confidence  uint64  `serialize:"true"` // Confidence 0-1e8 (1.0 = 1e8)
    
    // Aggregation Metadata
    SourceCount uint8   `serialize:"true"` // Number of sources used
    TWAP        uint64  `serialize:"true"` // 5-min TWAP in 1e8
    VWAP        uint64  `serialize:"true"` // 5-min VWAP in 1e8
    Volume      uint64  `serialize:"true"` // 24h volume in base units
    
    // Circuit Breaker Status
    CircuitBreakerTripped bool `serialize:"true"`
}

// AttestationType for TeleportAttest
const AttestationTypePriceFeed = 0x01
```

### 3. Chain-Specific Access Mechanisms

#### 3.1 X-Chain Oracle API (DEX)

Native RPC namespace `oracle.*` for X-Chain DEX:

```typescript
interface OracleRPC {
    // Get latest price for a symbol
    oracle_getPrice(symbol: string): PriceResponse;
    
    // Get prices for multiple symbols
    oracle_getPrices(symbols: string[]): PriceResponse[];
    
    // Get TWAP for funding rate calculation
    oracle_getTWAP(symbol: string, windowSecs: number): TWAPResponse;
    
    // Get VWAP for weighted pricing
    oracle_getVWAP(symbol: string, windowSecs: number): VWAPResponse;
    
    // Subscribe to price updates (WebSocket)
    oracle_subscribe(symbols: string[]): SubscriptionID;
    
    // Get oracle health status
    oracle_health(): OracleHealth;
}

interface PriceResponse {
    symbol: string;
    price: string;           // Decimal string (1e8 precision)
    confidence: number;      // 0.0 to 1.0
    timestamp: number;       // Unix ms
    sources: number;         // Number of sources
    stale: boolean;          // True if > 2s old
}
```

#### 3.2 C-Chain Oracle Precompile (EVM)

Precompile at address `0x0300000000000000000000000000000000000001`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILuxOracle {
    struct PriceData {
        uint256 price;        // 1e8 precision
        uint256 confidence;   // 1e8 = 100%
        uint256 timestamp;    // Unix seconds
        uint8 decimals;       // Always 8
        uint8 sources;        // Number of sources
        bool stale;           // True if stale
    }
    
    /// @notice Get latest price for a symbol
    /// @param symbol The trading pair (e.g., "BTC-USD")
    /// @return data The price data struct
    function getPrice(string calldata symbol) external view returns (PriceData memory data);
    
    /// @notice Get TWAP for a symbol
    /// @param symbol The trading pair
    /// @param windowSeconds TWAP window in seconds
    /// @return twap The time-weighted average price (1e8)
    function getTWAP(string calldata symbol, uint256 windowSeconds) external view returns (uint256 twap);
    
    /// @notice Get VWAP for a symbol
    /// @param symbol The trading pair
    /// @param windowSeconds VWAP window in seconds
    /// @return vwap The volume-weighted average price (1e8)
    function getVWAP(string calldata symbol, uint256 windowSeconds) external view returns (uint256 vwap);
    
    /// @notice Check if price is fresh (< 2 seconds old)
    /// @param symbol The trading pair
    /// @return fresh True if price is not stale
    function isFresh(string calldata symbol) external view returns (bool fresh);
    
    /// @notice Get multiple prices in one call
    /// @param symbols Array of trading pairs
    /// @return data Array of price data
    function getPrices(string[] calldata symbols) external view returns (PriceData[] memory data);
}

// Usage in DeFi contracts
contract LendingPool {
    ILuxOracle constant oracle = ILuxOracle(0x0300000000000000000000000000000000000001);
    
    function liquidate(address user, string calldata collateralSymbol) external {
        ILuxOracle.PriceData memory price = oracle.getPrice(collateralSymbol);
        require(!price.stale, "Price is stale");
        require(price.confidence > 0.95e8, "Price confidence too low");
        
        // Calculate collateral value
        uint256 value = (userCollateral[user] * price.price) / 1e8;
        // ...
    }
}
```

**Gas Costs:**
- `getPrice()`: 2,100 gas (cold) / 100 gas (warm)
- `getTWAP()`: 2,500 gas
- `getVWAP()`: 2,500 gas
- `getPrices(n)`: 2,100 + (n * 100) gas

#### 3.3 A-Chain Price Attestation Integration

Extends A-Chain's existing attestation infrastructure (LP-80):

```go
// A-Chain AttestationVM price oracle interface
type PriceAttestationSource interface {
    // GetAssetPrice returns attested price for any asset
    GetAssetPrice(symbol string) (*AttestationPrice, error)
    
    // GetComputePrice returns compute resource pricing
    GetComputePrice(gpuClass string) (*ComputePrice, error)
    
    // GetEnergyPrice returns energy pricing for mining
    GetEnergyPrice(region string) (*EnergyPrice, error)
    
    // ValidateCrossChainPrice validates price from another chain
    ValidateCrossChainPrice(chainID ids.ID, symbol string, price uint64) (bool, error)
}

type AttestationPrice struct {
    Symbol     string
    Price      uint64     // 1e8 precision
    Confidence float64
    Timestamp  time.Time
    Signers    []ids.NodeID  // T-Chain signers who attested
    Signature  []byte        // BLS aggregate
}

// Integration with existing A-Chain IComputePriceOracle
type EnhancedComputePriceOracle struct {
    // Existing compute pricing
    ComputeOracle IComputePriceOracle
    
    // New: Cross-domain price attestation
    PriceOracle PriceAttestationSource
    
    // Price compute costs in USD
    func GetGPUPriceUSD(gpuClass string) (uint64, error) {
        gpuPrice := po.ComputeOracle.GetGPUPrice(gpuClass)
        luxPrice := po.PriceOracle.GetAssetPrice("LUX-USD")
        return gpuPrice.PricePerSec * luxPrice.Price / 1e8, nil
    }
}
```

### 4. Source Configuration

Default source weights for multi-source aggregation:

| Source | Type | Weight | Latency | Use Case |
|--------|------|--------|---------|----------|
| **Orderbook** | Local | 1.0 | <100ns | DEX mid-price |
| **Pyth Network** | WebSocket | 1.5 | <100ms | Real-time CEX |
| **Chainlink** | Polling | 2.0 | 2-10s | Decentralized reference |
| **C-Chain AMMs** | Polling | 1.2 | ~100ms | On-chain truth |
| **Binance** | WebSocket | 1.0 | <50ms | Liquidity-weighted |
| **Coinbase** | WebSocket | 1.0 | <50ms | US market |

**Source Implementations (from `dex/pkg/price/`):**

```go
// pkg/price/types.go - Source interface
type Source interface {
    Price(symbol string) (*Data, error)
    Prices(symbols []string) (map[string]*Data, error)
    Subscribe(symbol string) error
    Unsubscribe(symbol string) error
    Healthy() bool
    Name() string
    Weight() float64
}

// pkg/price/pyth.go - Pyth WebSocket integration
type PythSource struct {
    wsURL    string
    apiURL   string
    conn     *websocket.Conn
    priceIDs map[string]string  // Symbol → Pyth price ID
}

// pkg/price/chainlink.go - Chainlink polling
type ChainlinkSource struct {
    feeds  map[string]string  // Symbol → Feed address
    prices map[string]*Data
}

// pkg/price/cchain.go - C-Chain AMM pricing
type CChainSource struct {
    rpcURL   string
    routers  map[string]string  // AMM router addresses
    tokens   map[string]TokenPair
    reserves map[string]*Reserves
}

// pkg/price/source.go - Local orderbook
type OrderbookSource struct {
    books OrderbookProvider
}
```

### 5. Aggregation Strategy

```go
// pkg/price/aggregator.go - WeightedMedian aggregation
type WeightedMedian struct {
    MinSources   int     // Minimum 2
    MaxDeviation float64 // 5% outlier threshold
}

func (w *WeightedMedian) Aggregate(prices []*Data) (*Data, error) {
    // 1. Sort by price
    // 2. Calculate median
    // 3. Filter outliers beyond MaxDeviation
    // 4. Calculate weighted average of remaining
    // 5. Return with confidence score
}

// Circuit breaker for price safety
type CircuitBreaker struct {
    Symbol    string
    MaxChange float64       // 10% default
    LastPrice float64
    LastTime  time.Time
    Tripped   bool
    Reset     time.Duration // 5 min auto-reset
}
```

### 6. Attestation Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ATTESTATION FLOW                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. PRICE COLLECTION (per signer, 100ms interval)                            │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  for each source in [orderbook, pyth, chainlink, cchain, cex]:    │    │
│     │      price = source.GetPrice(symbol)                               │    │
│     │      if price.Timestamp > now - staleLimit:                        │    │
│     │          prices.append(price)                                      │    │
│     │  aggregated = WeightedMedian.Aggregate(prices)                     │    │
│     └───────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  2. LOCAL VALIDATION                                                          │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  if len(prices) < MinSources: return error                         │    │
│     │  if CircuitBreaker.Check(aggregated.Price) == false: return error  │    │
│     │  payload = PriceFeedPayload{Symbol, Price, TWAP, VWAP, ...}        │    │
│     └───────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  3. THRESHOLD SIGNING (T-Chain consensus, 67/100)                            │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  proposal = TeleportAttest{Type: 4, AttestType: 0x01, Payload}     │    │
│     │  votes = CollectVotes(proposal)                                    │    │
│     │  if len(votes) >= 67:                                              │    │
│     │      blsSig = BLS.Aggregate(votes)                                 │    │
│     │      rtSig = Ringtail.Aggregate(votes)  // Optional PQ             │    │
│     │      warpMsg = WarpMessage{Unsigned: proposal, Sig: blsSig, rtSig} │    │
│     └───────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  4. WARP DELIVERY TO ALL CHAINS                                               │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  X-Chain: exchangeVM.ReceiveWarpMessage(warpMsg)                   │    │
│     │           → oracle.UpdatePrice(payload)                            │    │
│     │                                                                    │    │
│     │  C-Chain: cchainVM.ReceiveWarpMessage(warpMsg)                     │    │
│     │           → precompile.UpdatePrice(payload)                        │    │
│     │                                                                    │    │
│     │  A-Chain: attestVM.ReceiveWarpMessage(warpMsg)                     │    │
│     │           → priceAttestation.Store(payload)                        │    │
│     └───────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7. Supported Trading Pairs

Initial supported symbols (extendable via governance):

| Symbol | Base | Quote | Update Freq | Sources |
|--------|------|-------|-------------|---------|
| BTC-USD | BTC | USD | 100ms | 5 |
| ETH-USD | ETH | USD | 100ms | 5 |
| SOL-USD | SOL | USD | 100ms | 4 |
| AVAX-USD | AVAX | USD | 100ms | 4 |
| LUX-USD | LUX | USD | 100ms | 3 |
| BTC-ETH | BTC | ETH | 500ms | 3 |
| ETH-LUX | ETH | LUX | 500ms | 2 |

### 8. Security Considerations

1. **Threshold Security**: 67/100 signers required (2/3 BFT)
2. **Bond Slashing**: Signers posting invalid prices slashable (LP-333)
3. **Source Diversity**: Minimum 2 sources, weighted by reliability
4. **Circuit Breakers**: >10% deviation pauses updates
5. **Staleness Detection**: Prices marked stale after 2 seconds
6. **Quantum Safety**: Optional Ringtail signatures for PQ protection

### 9. Performance Targets

| Metric | Target | Measured |
|--------|--------|----------|
| Local orderbook lookup | <100ns | 50ns |
| Aggregation time | <1μs | 800ns |
| Price update (P2P) | <200ms | 150ms |
| Warp attestation | <500ms | 350ms |
| End-to-end latency | <600ms | 580ms |
| C-Chain precompile | <2ms | 1.5ms |

## Implementation

### Reference Implementation

- **Repository**: [github.com/luxfi/dex](https://github.com/luxfi/dex)
- **Package**: `pkg/price/`
- **Status**: Production-ready aggregator with Pyth/Chainlink/C-Chain integration

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Oracle Aggregator** | `dex/pkg/price/aggregator.go` | Multi-source aggregation with TWAP/VWAP |
| **Pyth Source** | `dex/pkg/price/pyth.go` | WebSocket real-time integration |
| **Chainlink Source** | `dex/pkg/price/chainlink.go` | Decentralized feed polling |
| **C-Chain Source** | `dex/pkg/price/cchain.go` | On-chain AMM prices |
| **Orderbook Source** | `dex/pkg/price/source.go` | Local DEX mid-price |
| **Types** | `dex/pkg/price/types.go` | Core interfaces and data types |
| **LX Oracle** | `dex/pkg/lx/oracle.go` | Full PriceOracle with monitoring |

### Build & Test

```bash
# Build oracle aggregator
cd ~/work/lux/dex
go build ./pkg/price/...
go build ./pkg/lx/...

# Run tests
go test ./pkg/price/... -v
go test ./pkg/lx/... -v -run Oracle

# Start oracle with all sources
go run ./cmd/dex-server/main.go \
    --pyth-ws wss://hermes.pyth.network/ws \
    --chainlink-rpc https://mainnet.infura.io/v3/... \
    --cchain-rpc http://127.0.0.1:9650/ext/bc/C/rpc \
    --symbols BTC-USD,ETH-USD,LUX-USD
```

## Rationale

### Why Network-Wide Instead of Chain-Specific?

1. **Single Source of Truth**: All chains consume same attested prices
2. **Infrastructure Reuse**: T-Chain signers serve entire network
3. **Consistency**: No price divergence between chains
4. **Efficiency**: One attestation flow, multiple consumers

### Why T-Chain for Attestation?

1. **Existing Infrastructure**: 100 signers already bonded (100M LUX each)
2. **Security Model**: 2/3 BFT threshold, slashable bonds
3. **No New Trust Assumptions**: Reuses existing MPC infrastructure

### Why C-Chain Precompile Instead of Contract?

1. **Gas Efficiency**: 2,100 gas vs 30,000+ for contract call
2. **Native Integration**: No deployment or upgrade needed
3. **Consistency**: Same interface as other native precompiles

## Backwards Compatibility

This LP introduces new functionality without breaking existing operations:
- X-Chain: `oracle.*` namespace additive to `dex.*` (LP-36)
- C-Chain: New precompile at unallocated address
- A-Chain: Extends existing attestation interfaces (LP-80)

## Test Cases

```go
// Test price aggregation
func TestWeightedMedianAggregation(t *testing.T) {
    sources := []*Data{
        {Source: "pyth", Price: 50000.0},
        {Source: "chainlink", Price: 50100.0},
        {Source: "cchain", Price: 49950.0},
    }
    result := WeightedMedian(sources)
    assert.InDelta(t, 50050.0, result.Price, 50.0)
}

// Test C-Chain precompile
func TestOraclePrecompile(t *testing.T) {
    price := oracle.GetPrice("BTC-USD")
    assert.False(t, price.Stale)
    assert.Greater(t, price.Confidence, uint256(0.95e8))
}

// Test cross-chain attestation
func TestWarpPriceAttestation(t *testing.T) {
    // Verify same price on X/C/A chains
    xPrice := xchain.oracle_getPrice("BTC-USD")
    cPrice := cchain.precompile.getPrice("BTC-USD")
    aPrice := achain.attestation.getPrice("BTC-USD")
    assert.Equal(t, xPrice.Price, cPrice.price)
    assert.Equal(t, xPrice.Price, aPrice.Price)
}
```

## Related LPs

- **LP-11**: X-Chain Exchange Chain Specification
- **LP-12**: C-Chain Contract Chain Specification
- **LP-13**: M-Chain MPC Custody Layer (T-Chain signers)
- **LP-14**: CGG21 Threshold Signatures
- **LP-36**: X-Chain Order-Book DEX API
- **LP-80**: A-Chain Attestation Specification
- **LP-333**: Dynamic Signer Rotation
- **LP-608**: High-Performance DEX Protocol

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
