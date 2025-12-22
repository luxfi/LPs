---
lp: 10004
title: Learning Path - Trading & Market Infrastructure
description: Build HFT-grade trading systems, DEXs, and market infrastructure on Lux
author: Lux Core Team
status: Draft
type: Meta
created: 2025-12-21
tags: [learning-path, trading, dex, hft, markets]
order: 24
tier: core
---

# LP-0014: Learning Path - Trading & Market Infrastructure

## Abstract

**"Latency, liquidity, price discovery."**

This path covers market infrastructure from order books to HFT venues.

## Motivation

High-performance trading on Lux requires understanding DEX architecture, order flow, and MEV protection. This path prepares traders and market makers for competitive execution.

## Audience

Quantitative traders, exchange operators, prop desks, market makers.

## Prerequisites

Complete [LP-0011: Core Protocol Path](/docs/lp-0011-learning-path-core/) first.

## Outcome

After completing this path, you will understand:
- DEX/CEX architecture on Lux
- Order matching and execution
- Oracle integration
- Perpetuals and derivatives
- MEV-aware execution

---

## Curriculum

### Stage 1: DEX Architecture

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 1 | [LP-9000](/docs/lp-9000-dex-overview/) | DEX Series Overview | 30 min | Deep |
| 2 | [LP-9001](/docs/lp-9001-x-chain-exchange-specification/) | X-Chain Exchange Spec | 30 min | Deep |
| 3 | [LP-9002](/docs/lp-9002-dex-api-rpc-specification/) | DEX API & RPC | 25 min | Medium |

### Stage 2: Order Books & Matching

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 4 | [LP-9100](/docs/lp-9100/) | Order Book Architecture | 30 min | Deep |
| 5 | [LP-9003](/docs/lp-9003-high-performance-dex-protocol/) | High-Performance DEX (FPGA) | 25 min | Deep |

### Stage 3: Precompiles

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 6 | [LP-9010](/docs/lp-9010-dex-precompile/) | DEX Precompile | 30 min | Deep |
| 7 | [LP-9011](/docs/lp-9011-oracle-precompile/) | Oracle Precompile | 25 min | Deep |

### Stage 4: Oracles & Price Feeds

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 8 | [LP-9005](/docs/lp-9005-native-oracle-protocol/) | Native Oracle Protocol | 30 min | Deep |
| 9 | [LP-9050](/docs/lp-9050/) | TWAP & Price Aggregation | 20 min | Medium |

### Stage 5: Derivatives

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 10 | [LP-9004](/docs/lp-9004-perpetuals-derivatives-protocol/) | Perpetuals & Derivatives | 35 min | Deep |
| 11 | [LP-9400](/docs/lp-9400/) | Margin Trading | 25 min | Medium |

### Stage 6: Operations & Risk

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 12 | [LP-9016](/docs/lp-9016-emergency-procedures/) | Emergency Procedures | 20 min | Medium |
| 13 | [LP-9017](/docs/lp-9017-risk-management/) | Risk Management | 25 min | Deep |
| 14 | [LP-9025](/docs/lp-9025-mev-protection/) | MEV Protection | 30 min | Deep |

### Stage 7: HFT (Advanced)

| Order | LP | Title | Time | Depth |
|-------|-----|-------|------|-------|
| 15 | [LP-9500](/docs/lp-9500/) | HFT Venues | 30 min | Deep |
| 16 | [LP-9014](/docs/lp-9014-quantumswap-hft/) | QuantumSwap HFT | 25 min | Deep |
| 17 | [LP-9700](/docs/lp-9700/) | CEX Integration (FIX) | 20 min | Medium |

---

## Total Time

**~8 hours** for complete coverage.

---

## Performance Benchmarks

| Metric | Traditional DEX | Lux DEX (LP-9000) |
|--------|-----------------|-------------------|
| Order Matching | 100ms | 10µs |
| Price Updates | 12s blocks | <50ms |
| TPS (Orders) | 100 | 100,000+ |
| Finality | 60s | 500ms |

---

## Research Extensions

For trading research:
- [LP-19xxx](/docs/) — Trading/HFT Research

---

## Security Considerations

None — this is a meta/organizational proposal.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
