---
lp: 9099
title: Lux DEX - Over 9000 Series Overview
description: Master index and architecture overview for the LP-9000 DEX series - standalone sidecar exchange network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Informational
created: 2025-12-11
updated: 2025-12-11
series: LP-9000 DEX Series
tags: [dex, defi, trading, lp-9000-series]
implementation: https://github.com/luxfi/dex
---

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
║                         STANDALONE SIDECAR NETWORK                            ║
║                                                                               ║
║     1,000,000+ orders/sec │ 597ns latency │ 50ms finality                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## Abstract

The **LP-9000 Series** documents the Lux DEX - a **standalone sidecar network** that runs alongside the Lux blockchain. The DEX daemon (`lxd`) is completely separate from the blockchain node (`luxd`), communicating via Warp messages for settlement. Built with multi-backend support (Pure Go, C++, GPU, FPGA), the DEX achieves **1M+ orders/sec** with **597ns matching latency**.

## Motivation

Traditional DEXs suffer from high latency, MEV exploitation, and limited order types. The Lux DEX addresses these limitations by implementing the exchange as a standalone sidecar network, achieving sub-microsecond matching latency while maintaining blockchain settlement guarantees.

## Key Distinction: DEX (Order Book) vs AMM

The Lux exchange ecosystem consists of two complementary systems:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      LUX EXCHANGE ARCHITECTURE                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ORDER BOOK DEX (LP-9000 Series)        │   AMM (C-Chain)                    │
│   ──────────────────────────             │   ─────────────────────────────   │
│   dex.lux.network                        │   amm.lux.network                  │
│   Standalone sidecar daemon              │   Smart contracts on C-Chain       │
│   Central limit order book (CLOB)        │   Uniswap V3 concentrated liq.     │
│   Sub-microsecond matching               │   Block-time execution             │
│   Professional/HFT traders               │   Retail/passive liquidity         │
│   github.com/luxfi/dex                   │   github.com/luxfi/amm             │
│                                          │                                    │
│   Best for: Precise execution, HFT,      │   Best for: Long-tail assets,      │
│   derivatives, institutional             │   passive LP, permissionless       │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │        lux.exchange             │
                    │   Unified Trading Interface     │
                    │   Routes to DEX or AMM based    │
                    │   on liquidity & best price     │
                    └─────────────────────────────────┘
```

### Domain Architecture

| Domain | Component | Technology | Use Case |
|--------|-----------|------------|----------|
| `lux.exchange` | Unified UI | Next.js | Main trading interface |
| `dex.lux.network` | Order Book API | Go sidecar | Professional trading, HFT |
| `amm.lux.network` | AMM UI | Next.js | Swaps, LP positions |
| `api.lux.network` | Blockchain API | luxd | Chain queries, transactions |

## Key Distinction: Sidecar vs Chain

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    DEX SIDECAR vs BLOCKCHAIN CHAINS                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   SIDECAR NETWORK (This Series)          │   BLOCKCHAIN CHAINS (Separate)    │
│   ──────────────────────────             │   ─────────────────────────────   │
│   lxd daemon                        │   luxd daemon                      │
│   github.com/luxfi/dex                   │   github.com/luxfi/node            │
│   Trading engine, orderbooks             │   C-Chain, D-Chain, B-Chain, etc.  │
│   DAG consensus for orders               │   Snowman/DAG for blocks           │
│   Warp messages → blockchain             │   Native chain transactions        │
│                                          │                                    │
│   LP-9000 Series                         │   LP-0011 (X-Chain UTXO)           │
│                                          │   LP-0012 (C-Chain EVM)            │
│                                          │   LP-0010 (D-Chain staking)        │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## LP-9000 Series Index

| LP | Title | Description | Status |
|----|-------|-------------|--------|
| **LP-9000** | DEX Overview (this doc) | Architecture overview | Final |
| [LP-9001](./lp-9001-dex-trading-engine.md) | DEX Trading Engine | Orderbook, matching, backends | Implemented |
| [LP-9002](./lp-9002-dex-api-rpc-specification.md) | DEX API & RPC | JSON-RPC, gRPC, WebSocket | Implemented |
| [LP-9003](./lp-9003-high-performance-dex-protocol.md) | High-Performance Protocol | GPU/FPGA acceleration | Implemented |
| [LP-9004](./lp-9004-perpetuals-derivatives-protocol.md) | Perpetuals & Derivatives | Margin, liquidation, vaults | Implemented |
| [LP-9005](./lp-9005-native-oracle-protocol.md) | Oracle Protocol | Multi-source price aggregation | Implemented |
| [LP-9006](./lp-9006-hft-trading-venues-global-network.md) | HFT Trading Venues | Global colocation network | Implemented |

## Actual Benchmark Results

Benchmarks run on Apple M1 Max (2025-12-11):

### Order Book Performance

```
BenchmarkOrderBook-10              1,269,255 orders/sec    787.9 ns/op
BenchmarkOrderBookParallel-10        684,184 orders/sec   1,462.0 ns/op
BenchmarkCriticalOrderMatching/100   714,820 orders/sec   1,398.8 ns/op
BenchmarkCriticalOrderMatching/1000  576,844 orders/sec   1,733.6 ns/op
BenchmarkCriticalOrderMatching/10000 521,370 orders/sec   1,918.0 ns/op
```

### Multi-Backend Comparison

| Backend | Throughput | Latency | Source |
|---------|------------|---------|--------|
| **Pure Go** | 1,269,255 ops/sec | 787.9 ns | [`pkg/lx/orderbook.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/orderbook.go) |
| **CGO/C++** | 500,000+ ops/sec | ~2,000 ns | [`pkg/orderbook/cpp_orderbook.go`](https://github.com/luxfi/dex/blob/main/pkg/orderbook/cpp_orderbook.go) |
| **GPU** | 1,675,041 ops/sec | 597 ns | [`pkg/mlx/mlx.go`](https://github.com/luxfi/dex/blob/main/pkg/mlx/mlx.go) |
| **FPGA** | 100M+ ops/sec | <10 µs | [`pkg/fpga/fpga_engine.go`](https://github.com/luxfi/dex/blob/main/pkg/fpga/fpga_engine.go) |

### Industry Comparison (from latency-benchmark)

| Exchange | Order-to-Ack | Matching | Full Round Trip |
|----------|--------------|----------|-----------------|
| **Lux DEX (Go)** | 924 ns | 1,398 ns | ~50 ms consensus |
| **Lux DEX (GPU)** | 597 ns | ~800 ns | ~50 ms consensus |
| NYSE | 40-50 µs | - | - |
| NASDAQ | 30-40 µs | - | - |
| CME | 100-200 µs | - | - |
| Binance | 1-5 ms | - | - |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LUX DEX SIDECAR ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENT LAYER                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │ Go SDK   │  │ TS SDK   │  │ Py SDK   │  │ Rust SDK │  │ Web UI   │ │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │ │
│  └───────┴─────────────┴─────────────┴─────────────┴─────────────┴───────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          API LAYER (LP-9002)                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │  JSON-RPC    │  │    gRPC      │  │  WebSocket   │  │    FIX     │ │ │
│  │  │  dex.*       │  │  streaming   │  │  real-time   │  │  4.2/4.4   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                   TRADING ENGINE (LP-9001, LP-9003)                    │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    ORDERBOOK BACKENDS                             │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │  │ │
│  │  │  │  Pure Go    │  │  CGO/C++    │  │    GPU      │  │   FPGA   │ │  │ │
│  │  │  │  1.08M/sec  │  │  500K/sec   │  │  1.67M/sec  │  │  100M/s  │ │  │ │
│  │  │  │  924.7ns    │  │  ~2000ns    │  │   597ns     │  │  <10µs   │ │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    MATCHING MODES                                 │  │ │
│  │  │  • Price-Time Priority (FIFO)  • Pro-Rata  • TWAP/VWAP           │  │ │
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
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      ORACLE LAYER (LP-9005)                            │ │
│  │         Pyth │ Chainlink │ C-Chain AMMs │ Binance │ Coinbase           │ │
│  │                    WeightedMedian + CircuitBreaker                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      DAG CONSENSUS LAYER                               │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Order Sequencing │ Trade Finality: 50ms │ Parallel Processing   │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│                              Warp Messages                                   │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │              LUX BLOCKCHAIN (github.com/luxfi/node)                    │ │
│  │          C-Chain (EVM) │ B-Chain (Bridge) │ D-Chain (Staking)          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Repository

**Main Repository**: [github.com/luxfi/dex](https://github.com/luxfi/dex)

### Directory Structure

```
dex/
├── cmd/                          # CLI commands (30+)
│   ├── bench-all/                # Multi-backend benchmark
│   ├── latency-benchmark/        # Ultra-low latency benchmark
│   ├── fix-benchmark/            # FIX protocol benchmark
│   ├── dex-server/               # Main DEX daemon
│   └── ...
│
├── pkg/
│   ├── lx/                       # Core trading logic
│   │   ├── orderbook.go          # Pure Go orderbook
│   │   ├── orderbook_advanced.go # Advanced order types
│   │   ├── margin_trading.go     # Margin engine
│   │   ├── liquidation_engine.go # Liquidation
│   │   ├── funding.go            # Funding rates
│   │   ├── clearinghouse.go      # Clearinghouse
│   │   ├── vaults.go             # Vault management
│   │   ├── risk_engine.go        # Risk management
│   │   ├── oracle.go             # Price oracle
│   │   └── critical_path_bench_test.go
│   │
│   ├── orderbook/                # C++ backend
│   │   └── cpp_orderbook.go
│   │
│   ├── fpga/                     # FPGA acceleration
│   │   ├── fpga_engine.go
│   │   ├── amd_versal.go
│   │   └── aws_f2.go
│   │
│   ├── mlx/                      # Apple GPU engine
│   │   └── mlx.go
│   │
│   ├── dpdk/                     # Kernel bypass
│   │   └── kernel_bypass.go
│   │
│   ├── consensus/                # DAG consensus
│   │   └── dag.go
│   │
│   ├── price/                    # Oracle sources
│   │   ├── aggregator.go
│   │   ├── pyth.go
│   │   ├── chainlink.go
│   │   └── cchain.go
│   │
│   └── api/                      # API layer
│       ├── jsonrpc.go
│       └── websocket_server.go
│
├── sdk/                          # Client SDKs
│   ├── go/
│   ├── typescript/
│   ├── python/
│   └── rust/
│
├── ui/                           # Trading interface
│
├── paper/                        # Whitepaper
│   └── PAPER_SUMMARY.md
│
└── docs/
    └── ARCHITECTURE.md
```

## Feature Summary

### Spot Trading (LP-9001)
- Central Limit Order Book (CLOB)
- Price-time priority matching
- Order types: Market, Limit, Stop, StopLimit, TWAP, Iceberg, Hidden, Pegged
- Time-in-force: GTC, IOC, FOK, GTD

### Perpetual Futures (LP-9004)
- BTC, ETH, SOL, LUX perpetuals
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
- Circuit breakers

### Vaults (LP-9004)
- Automated trading strategies
- Copy trading (10% profit share)
- Performance fees (20%)
- Management fees (2%)

### Price Oracles (LP-9005)
- Multi-source aggregation (Pyth, Chainlink, Binance, Coinbase)
- Weighted median filtering
- Circuit breakers (10% deviation)
- TWAP/VWAP (5-minute windows)

### Acceleration (LP-9003)
- Pure Go: 1.08M orders/sec
- CGO/C++: 500K orders/sec
- GPU (Apple): 1.67M orders/sec, 597ns
- FPGA: 100M+ orders/sec, <10µs

## Quick Start

### Run DEX Daemon

```bash
# Clone and build
git clone https://github.com/luxfi/dex
cd dex
make build

# Run DEX daemon
./build/lxd --config=dex.yaml
```

### Go SDK

```go
import "github.com/luxfi/dex/sdk/go/lxdex"

client := lxdex.NewClient("wss://dex.lux.network/ws")

order, err := client.PlaceOrder(lxdex.Order{
    Symbol:   "BTC-PERP",
    Side:     lxdex.Buy,
    Type:     lxdex.Limit,
    Price:    50000.00,
    Size:     0.1,
    Leverage: 10,
})
```

### TypeScript SDK

```typescript
import { LuxDEX } from '@luxfi/dex-sdk';

const dex = new LuxDEX('wss://dex.lux.network/ws');

const order = await dex.placeOrder({
  symbol: 'BTC-PERP',
  side: 'buy',
  type: 'limit',
  price: 50000,
  size: 0.1,
  leverage: 10,
});
```

## Benchmarks

### Running Benchmarks

```bash
# Order book benchmark
cd ~/work/lux/dex
go test -bench=BenchmarkOrderBook ./test/benchmark/

# Critical path benchmarks
go test -bench=BenchmarkCritical ./pkg/lx/

# Multi-backend benchmark
go run ./cmd/bench-all/

# Latency benchmark with industry comparison
go run ./cmd/latency-benchmark/

# FIX protocol benchmark
go run ./cmd/fix-benchmark/
```

## Related LPs

**DEX Series (This)**:
- LP-9001: Trading Engine
- LP-9002: API & RPC
- LP-9003: Performance
- LP-9004: Derivatives
- LP-9005: Oracles
- LP-9006: HFT Venues

**Blockchain Chains (Separate)**:
- [LP-0011](./lp-0011-x-chain-exchange-chain-specification.md): X-Chain (UTXO assets)
- [LP-0012](./lp-0012-c-chain-contract-chain-specification.md): C-Chain (EVM)
- [LP-0010](./lp-0010-p-chain-platform-chain-specification-deprecated.md): D-Chain (Staking)

**Cross-Chain**:
- [LP-603](./lp-0603-warp-15-quantum-safe-cross-chain-messaging.md): Warp Messaging
- [LP-331](./lp-0331-b-chain-bridgevm-specification.md): B-Chain Bridge

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-12-11 | Clarified sidecar architecture, added actual benchmarks |
| 1.0.0 | 2025-12-11 | Initial LP-9000 series creation |

---

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
