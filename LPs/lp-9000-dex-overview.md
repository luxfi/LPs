# LP-9000: Lux DEX - Over 9000 Series

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██╗     ██╗   ██╗██╗  ██╗    ██████╗ ███████╗██╗  ██╗                     ║
║     ██║     ██║   ██║╚██╗██╔╝    ██╔══██╗██╔════╝╚██╗██╔╝                     ║
║     ██║     ██║   ██║ ╚███╔╝     ██║  ██║█████╗   ╚███╔╝                      ║
║     ██║     ██║   ██║ ██╔██╗     ██║  ██║██╔══╝   ██╔██╗                      ║
║     ███████╗╚██████╔╝██╔╝ ██╗    ██████╔╝███████╗██╔╝ ██╗                     ║
║     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝    ╚═════╝ ╚══════╝╚═╝  ╚═╝                     ║
║                                                                               ║
║                    ⚡ IT'S OVER 9000! ⚡                                       ║
║                                                                               ║
║     100,000+ orders/sec │ Sub-millisecond latency │ Quantum-safe signing      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

| Field | Value |
|-------|-------|
| LP | 9000 |
| Title | Lux DEX - Over 9000 Series Overview |
| Author | Lux Network Team |
| Status | Final |
| Created | 2025-12-11 |
| Implementation | [github.com/luxfi/dex](https://github.com/luxfi/dex) |

## Abstract

The **LP-9000 Series** documents the Lux Decentralized Exchange (DEX) - the fastest, most comprehensive on-chain trading infrastructure in existence. Built on the X-Chain's DAG architecture with FPGA/GPU acceleration, the Lux DEX achieves **over 9000x** the performance of traditional DEXs while providing institutional-grade features: perpetual futures, margin trading, vaults, and quantum-safe signatures.

> *"It's over 9000!"* - Every validator seeing our TPS

## Why LP-9000?

Because our DEX is **over 9000** times faster than:
- Uniswap (~15 TPS) → Lux DEX: 100,000+ TPS
- dYdX v3 (~1,000 TPS) → Lux DEX: 100,000+ TPS
- Binance CEX latency (1-5ms) → Lux DEX: <100μs with FPGA

## LP-9000 Series Index

| LP | Title | Description | Status |
|----|-------|-------------|--------|
| **LP-9000** | DEX Overview (this doc) | Master index and architecture overview | Final |
| [LP-9001](./lp-9001-x-chain-exchange-specification.md) | X-Chain Exchange Specification | Core orderbook, DAG consensus, UTXO model | Implemented |
| [LP-9002](./lp-9002-dex-api-rpc-specification.md) | DEX API & RPC Specification | JSON-RPC, gRPC, WebSocket feeds | Implemented |
| [LP-9003](./lp-9003-high-performance-dex-protocol.md) | High-Performance DEX Protocol | FPGA/GPU acceleration, MEV protection | Implemented |
| [LP-9004](./lp-9004-perpetuals-derivatives-protocol.md) | Perpetuals & Derivatives | Margin, liquidation, funding, vaults | Implemented |
| [LP-9005](./lp-9005-native-oracle-protocol.md) | Native Oracle Protocol | Multi-source aggregation, network-wide | Implemented |
| [LP-9006](./lp-9006-dex-bridge-integration.md) | Bridge Integration | Cross-chain deposits/withdrawals | Planned |
| [LP-9007](./lp-9007-dex-custody-multisig.md) | Custody & Multi-sig | Institutional custody features | Planned |
| [LP-9008](./lp-9008-dex-staking-governance.md) | Staking & Governance | LUX staking, fee sharing, voting | Planned |
| [LP-9009](./lp-9009-dex-sdk-clients.md) | SDKs & Client Libraries | Go, TypeScript, Python, Rust SDKs | Implemented |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LUX DEX ARCHITECTURE                                 │
│                           "OVER 9000 SERIES"                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        CLIENT LAYER (LP-9009)                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │ Go SDK   │  │ TS SDK   │  │ Py SDK   │  │ Rust SDK │  │ Web UI   │ │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │ │
│  └───────┴─────────────┴─────────────┴─────────────┴─────────────┴───────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          API LAYER (LP-9002)                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ │
│  │  │  JSON-RPC    │  │    gRPC      │  │  WebSocket   │                  │ │
│  │  │  dex.*       │  │  streaming   │  │  real-time   │                  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      TRADING ENGINE (LP-9001, LP-9003)                 │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    ORDER BOOK MATCHING                            │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ Price-Time  │  │  Pro-Rata   │  │   TWAP      │               │  │ │
│  │  │  │   FIFO      │  │  Matching   │  │  Execution  │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    ACCELERATION (LP-9003)                         │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ FPGA Engine │  │ GPU Compute │  │ DPDK Bypass │               │  │ │
│  │  │  │ AMD Versal  │  │ MLX Engine  │  │ Kernel Skip │               │  │ │
│  │  │  │   <10μs     │  │   <100μs    │  │   <1μs      │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    DERIVATIVES ENGINE (LP-9004)                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │ Perpetual│  │  Margin  │  │ Liquidat │  │ Funding  │  │  Vaults  │ │ │
│  │  │ Futures  │  │ Trading  │  │  Engine  │  │  Rates   │  │ & Copy   │ │ │
│  │  │  100x    │  │ x/i/port │  │  ADL     │  │  8-hour  │  │  10%     │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                             │ │
│  │  │ Clearing │  │  Risk    │  │ Lending  │                             │ │
│  │  │  House   │  │ Engine   │  │  Pool    │                             │ │
│  │  └──────────┘  └──────────┘  └──────────┘                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      ORACLE LAYER (LP-9005)                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │   Pyth   │  │Chainlink │  │ C-Chain  │  │ Binance  │  │ Coinbase │ │ │
│  │  │   WS     │  │  Poll    │  │  AMMs    │  │   WS     │  │   WS     │ │ │
│  │  │ 1.5 wgt  │  │ 2.0 wgt  │  │ 1.2 wgt  │  │ 1.0 wgt  │  │ 1.0 wgt  │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │ │
│  │         └────────────────────┬────────────────────────────┘           │ │
│  │                              ▼                                        │ │
│  │              ┌─────────────────────────────┐                          │ │
│  │              │  WeightedMedian Aggregator  │                          │ │
│  │              │  + CircuitBreaker (10%)     │                          │ │
│  │              │  + TWAP/VWAP (5 min)        │                          │ │
│  │              └─────────────────────────────┘                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    CONSENSUS LAYER (X-CHAIN DAG)                       │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │  DAG Consensus │ UTXO Model │ Lamport OTS │ Sub-second Finality  │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Performance Benchmarks

### It's Over 9000! 🔥

| Metric | Lux DEX | Uniswap | dYdX v3 | Binance | **Speedup** |
|--------|---------|---------|---------|---------|-------------|
| **Orders/sec** | 100,000+ | ~15 | ~1,000 | ~100,000 | **9000x vs Uni** |
| **Matching Latency** | <10μs (FPGA) | N/A | ~10ms | ~1ms | **1000x vs dYdX** |
| **Finality** | <500ms | ~12s | ~1s | Centralized | **24x vs Uni** |
| **Price Update** | <100ms | block-time | ~100ms | ~10ms | **Native** |

### Latency Breakdown

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER-TO-EXECUTION LATENCY                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Network Receive (DPDK)     │████                        │ <1μs  │
│  Order Validation           │████████                    │ <5μs  │
│  Matching Engine (FPGA)     │██████████                  │ <10μs │
│  State Update               │████████████                │ <15μs │
│  Confirmation Broadcast     │████████████████████████████│ <50μs │
│                                                                  │
│  TOTAL END-TO-END:          │ <100μs (0.1ms)                     │
│                                                                  │
│  Competitors:                                                    │
│  • Traditional DEX: 1-12 seconds                                 │
│  • CEX (Binance): 1-5 milliseconds                              │
│  • dYdX v4: 100-500 milliseconds                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Repository

**Main Repository**: [github.com/luxfi/dex](https://github.com/luxfi/dex)

### Directory Structure

```
dex/
├── pkg/
│   ├── lx/                    # Core trading logic (LP-9001, LP-9004)
│   │   ├── orderbook.go       # Order book implementation
│   │   ├── orderbook_advanced.go
│   │   ├── margin_trading.go  # Margin engine
│   │   ├── liquidation_engine.go
│   │   ├── funding.go         # Funding rates
│   │   ├── clearinghouse.go   # Clearinghouse
│   │   ├── vaults.go          # Vault management
│   │   ├── risk_engine.go     # Risk management
│   │   ├── oracle.go          # Price oracle
│   │   └── x_chain_integration.go
│   │
│   ├── price/                 # Oracle sources (LP-9005)
│   │   ├── aggregator.go      # WeightedMedian aggregator
│   │   ├── pyth.go            # Pyth Network source
│   │   ├── chainlink.go       # Chainlink source
│   │   ├── cchain.go          # C-Chain AMM source
│   │   └── types.go           # Common types
│   │
│   ├── fpga/                  # FPGA acceleration (LP-9003)
│   │   ├── fpga_engine.go     # Core FPGA interface
│   │   ├── amd_versal.go      # AMD Versal integration
│   │   └── aws_f2.go          # AWS F2 instances
│   │
│   ├── mlx/                   # Apple MLX engine (LP-9003)
│   │   └── mlx.go
│   │
│   ├── dpdk/                  # Kernel bypass (LP-9003)
│   │   └── kernel_bypass.go
│   │
│   ├── api/                   # API layer (LP-9002)
│   │   ├── jsonrpc.go
│   │   └── websocket_server.go
│   │
│   └── grpc/                  # gRPC (LP-9002)
│       └── pb/
│
├── sdk/                       # Client SDKs (LP-9009)
│   ├── go/
│   ├── typescript/
│   ├── python/
│   └── rust/
│
└── ui/                        # Trading interface
```

## Feature Summary

### Spot Trading (LP-9001)
- Central Limit Order Book (CLOB)
- Price-time priority matching
- Market, limit, stop, TWAP orders
- Partial fills, IOC, FOK
- Multi-asset pairs

### Perpetual Futures (LP-9004)
- BTC, ETH, SOL, AVAX, LUX perpetuals
- Up to 100x leverage
- 8-hour funding intervals
- Mark price oracle protection

### Margin Trading (LP-9004)
- Cross margin (10x max)
- Isolated margin (20x max)
- Portfolio margin (100x max)
- Multi-collateral support

### Risk Management (LP-9004)
- Real-time liquidation engine
- Insurance fund
- Auto-deleveraging (ADL)
- Socialized loss (last resort)
- Circuit breakers

### Vaults (LP-9004)
- Automated trading strategies
- Copy trading (10% profit share)
- Performance fees (20%)
- Management fees (2%)

### Price Oracles (LP-9005)
- Multi-source aggregation
- Weighted median filtering
- Circuit breakers (10% deviation)
- TWAP/VWAP (5-minute windows)
- Network-wide access (X/C/A chains)

### Acceleration (LP-9003)
- FPGA matching (<10μs)
- GPU computation
- DPDK kernel bypass
- MLX engine (Apple Silicon)

## Security Model

### Quantum Safety
- Lamport OTS for order signatures
- Ringtail threshold signatures (LP-603)
- Post-quantum key encapsulation

### MEV Protection
- Commit-reveal auctions
- Encrypted order flow
- Fair ordering guarantees

### Custody
- Non-custodial by default
- Optional MPC custody (M-Chain)
- Multi-sig support (LP-9007)

## Getting Started

### Quick Start (Go SDK)

```go
import "github.com/luxfi/dex/sdk/go/lxdex"

// Connect to DEX
client := lxdex.NewClient("wss://dex.lux.network/ws")

// Place limit order
order, err := client.PlaceOrder(lxdex.Order{
    Symbol:    "BTC-PERP",
    Side:      lxdex.Buy,
    Type:      lxdex.Limit,
    Price:     50000.00,
    Size:      0.1,
    Leverage:  10,
})

// Stream orderbook
client.SubscribeOrderbook("BTC-PERP", func(book *lxdex.Orderbook) {
    fmt.Printf("Best bid: %f, Best ask: %f\n", book.BestBid(), book.BestAsk())
})
```

### Quick Start (TypeScript SDK)

```typescript
import { LuxDEX } from '@luxfi/dex-sdk';

const dex = new LuxDEX('wss://dex.lux.network/ws');

// Place order
const order = await dex.placeOrder({
  symbol: 'BTC-PERP',
  side: 'buy',
  type: 'limit',
  price: 50000,
  size: 0.1,
  leverage: 10,
});

// Subscribe to prices
dex.subscribeTicker('BTC-PERP', (ticker) => {
  console.log(`Price: ${ticker.lastPrice}, 24h Volume: ${ticker.volume24h}`);
});
```

## Migration Notes

### From Old LP Numbers

| Old LP | New LP | Title |
|--------|--------|-------|
| LP-0011 | LP-9001 | X-Chain Exchange Specification |
| LP-0036 | LP-9002 | DEX API & RPC Specification |
| LP-0608 | LP-9003 | High-Performance DEX Protocol |
| LP-0609 | LP-9004 | Perpetuals & Derivatives Protocol |
| LP-0610 | LP-9005 | Native Oracle Protocol |

Old LP numbers are maintained as aliases for backwards compatibility.

## Related LPs

- [LP-603](./lp-0603-warp-15-quantum-safe-cross-chain-messaging.md): Warp 1.5 Quantum-Safe Messaging
- [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md): Dynamic Signer Rotation
- [LP-330](./lp-0330-t-chain-thresholdvm-specification.md): T-Chain ThresholdVM
- [LP-331](./lp-0331-b-chain-bridgevm-specification.md): B-Chain BridgeVM

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-11 | Initial LP-9000 series creation |

---

*"What does the scouter say about their TPS?"*
*"IT'S OVER 9000!!!"* 🔥⚡
