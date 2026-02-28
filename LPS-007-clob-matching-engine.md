---
lps: 007
title: CLOB Matching Engine
tags: [ats, clob, orderbook, fix, matching-engine, hft]
description: Central limit order book matching engine specification
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Markets
created: 2023-11-20
updated: 2026-01-15
requires:
  - LPS-005 (Regulated ATS Stack)
references:
  - lp-9020 (CLOB Precompile)
  - FIX 4.4 Protocol
---

# LPS-007: CLOB Matching Engine

## Abstract

The Lux CLOB is a high-performance central limit order book matching engine that operates as an SEC-registered Alternative Trading System. It supports equities, options, futures, and digital assets with sub-microsecond matching latency.

## Implementations

| Engine | Language | Latency | Use Case |
|--------|----------|---------|----------|
| Pure Go | Go | ~1µs | Default, portable |
| CGO/C++ | C++ via CGO | ~200ns | Production HFT |
| MLX | Go + Metal | ~500ns | Mac Studio acceleration |
| FPGA | VHDL + Go | ~50ns | Colocation |
| On-chain | EVM precompile | ~1ms | LP-9020 (consensus-bound) |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  FIX Gateway │     │  REST/WS API │     │  NATS Cluster │
│  (port 9878) │     │  (port 8085) │     │  (multi-node) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────┬───────┘────────────────────┘
                    │
              ┌─────┴─────┐
              │  Matching  │
              │  Engine    │
              │            │
              │ Order Book │
              │ Price-Time │
              │ Priority   │
              └─────┬──────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    ┌────┴───┐ ┌────┴───┐ ┌───┴────┐
    │ Market │ │ Trade  │ │ Risk   │
    │ Data   │ │ Report │ │ Engine │
    └────────┘ └────────┘ └────────┘
```

## Order Types

- Limit, Market, Stop, Stop-Limit
- IOC (Immediate or Cancel), FOK (Fill or Kill), GTC (Good til Cancel)
- Iceberg (hidden quantity), Pegged (dynamic price)

## FIX Protocol

The engine accepts orders via FIX 4.4 over TCP or ZeroMQ:
- NewOrderSingle (D), OrderCancelRequest (F), OrderCancelReplaceRequest (G)
- ExecutionReport (8), OrderCancelReject (9)
- MarketDataRequest (V), MarketDataSnapshotFullRefresh (W)

## Multi-Node Consensus

For distributed deployments, the engine uses NATS JetStream for order replication across nodes. Leader election via Raft ensures exactly-once execution.

## Price Feeds

Aggregated from multiple sources:
- CoinGecko, CoinMarketCap (crypto)
- Alpaca, IBKR (equities)
- CurrencyCloud (FX)
- On-chain DEX oracles (LP-9040)
