---
lp: 9004
title: DEX Test Coverage Specification
description: Comprehensive test coverage requirements and status for the Lux DEX codebase
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Living
type: Standards Track
category: Testing
created: 2025-12-11
updated: 2025-12-11
series: LP-9000 DEX Series
tags: [dex, testing, quality, coverage, lp-9000-series]
implementation: https://github.com/luxfi/dex
requires: [9000, 9001, 9002, 9003]
---

# LP-9004: DEX Test Coverage Specification

## Abstract

This LP specifies test coverage requirements, testing standards, and the current implementation status for the Lux DEX codebase. It documents the test infrastructure, coverage targets, and testing patterns used across all DEX packages.

## Motivation

High test coverage is critical for:
1. **Reliability**: Financial systems require rigorous testing
2. **Regression Prevention**: Catch bugs before production
3. **Documentation**: Tests serve as executable documentation
4. **Confidence**: Enable rapid development with safety

## Test Coverage Summary

### Current Coverage Status (2025-12-11)

| Package | Coverage | Status | Notes |
|---------|----------|--------|-------|
| `pkg/metric` | **100.0%** | ✅ Complete | Metrics collection |
| `pkg/mlx` | **96.2%** | ✅ Excellent | MLX acceleration |
| `pkg/engine` | **95.8%** | ✅ Excellent | MLX matching engine |
| `pkg/log` | **92.0%** | ✅ Excellent | Structured logging |
| `pkg/consensus` | **87.4%** | ✅ Good | DAG consensus |
| `pkg/marketdata` | **83.4%** | ✅ Good | Market data feeds |
| `pkg/orderbook` | **80.8%** | ✅ Good | Order book core |
| `pkg/lx` | **74.6%** | ⚠️ Acceptable | Core types |
| `pkg/client` | **47.7%** | ⚠️ Partial | WebSocket client |
| `pkg/price` | **46.3%** | ⚠️ Partial | Price oracle |
| `pkg/api` | **42.8%** | ⚠️ Partial | WebSocket server |
| `pkg/dpdk` | **0.0%** | ⏸️ Skipped | CGO/hardware-specific |
| `pkg/proto` | **0.0%** | ⏸️ Generated | Protobuf generated code |
| `pkg/types` | **N/A** | ✅ Complete | No statements |

### Overall Metrics
- **Total Packages**: 14
- **Packages with 80%+ Coverage**: 7 (50%)
- **Packages with Tests**: 12 (86%)
- **All Tests Passing**: ✅ Yes

## Package Specifications

### pkg/metric (100.0%)
**Purpose**: Prometheus metrics collection
**Testing Pattern**: Unit tests for all metric types

```go
// Example test pattern
func TestHistogramRecordDuration(t *testing.T) {
    h := NewHistogram("test", []float64{0.1, 0.5, 1.0})
    h.Observe(0.3)
    // Verify bucket counts
}
```

### pkg/engine (95.8%)
**Purpose**: MLX-accelerated matching engine
**Testing Pattern**: Hardware-conditional tests

```go
// Platform-specific test pattern
func TestNewMLXEngine(t *testing.T) {
    if runtime.GOOS != "darwin" || runtime.GOARCH != "arm64" {
        t.Skip("MLX engine requires Apple Silicon Mac")
    }
    // Test implementation
}
```

**Key Test Functions**:
- `TestNewMLXEngine` - Engine initialization
- `TestMLXEngineProcessBatch` - Batch order processing
- `TestMLXEngineBenchmark` - Performance benchmark
- `TestDetectGPUCores` - Hardware detection
- `TestHashSymbol` - Symbol hashing (DJB2)

### pkg/consensus (87.4%)
**Purpose**: DAG-based consensus for order finality
**Testing Pattern**: Concurrent operation tests

**Key Test Functions**:
- `TestNewDAGOrderBook` - Order book creation
- `TestDAGOrderBookAddOrder` - Order insertion
- `TestRunFPCRound` - Fast Path Consensus rounds
- `TestQuasar*` - Certificate operations
- `TestConcurrentDAGOperations` - Thread safety

### pkg/orderbook (80.8%)
**Purpose**: Central limit order book
**Testing Pattern**: Matching engine simulation

**Key Test Functions**:
- `TestNewGoOrderBook` - Book initialization
- `TestAddOrder` / `TestCancelOrder` - Order lifecycle
- `TestMatchOrders` - Price-time priority matching
- `TestGetBestBid` / `TestGetBestAsk` - Top of book
- `TestConcurrentOperations` - Thread safety
- `BenchmarkAddOrder` / `BenchmarkMatchOrders` - Performance

### pkg/price (46.3%)
**Purpose**: Multi-source price oracle
**Testing Pattern**: Mock sources for unit tests

**Fully Covered Components**:
- `Oracle` - Price aggregation
- `WeightedMedian` - Aggregation strategy
- `CircuitBreaker` - Price protection
- `SymbolMap` - Symbol normalization
- Helper functions (`calcTWAP`, `calcVWAP`, `avg`, `stddev`)

**Partially Covered** (Network-dependent):
- `PythSource` - Pyth Network WebSocket
- `QChainSource` - Q-Chain finality
- `ZooChainSource` - Zoo DeFi integration
- `OrderbookSource` - Live orderbook prices

**Note**: External price sources require live network connections for full testing. Integration tests should be run against testnet.

### pkg/api (42.8%)
**Purpose**: WebSocket API server
**Testing Pattern**: HTTP test server with mock connections

**Covered Components**:
- `NewWebSocketServer` - Server initialization
- `ServerMetrics` - Metrics tracking
- `RateLimiter` - Request throttling
- Handler unit tests for individual message types

**Network-Dependent Functions**:
- `Start` - Server lifecycle
- `readPump` / `writePump` - WebSocket I/O
- `marketDataBroadcaster` - Price broadcast
- `positionMonitor` - Liquidation checks

### pkg/client (47.7%)
**Purpose**: WebSocket client SDK
**Testing Pattern**: Mock server responses

**Covered Components**:
- `NewTraderClient` - Client initialization
- Order/position callbacks
- Message parsing
- Type assertions

## Testing Patterns

### 1. Table-Driven Tests
```go
func TestNormalize(t *testing.T) {
    tests := []struct {
        input    string
        expected string
    }{
        {"LUX/USD", "LUX-USD"},
        {"btc-usd", "BTC-USD"},
    }
    for _, tc := range tests {
        got := Normalize(tc.input)
        if got != tc.expected {
            t.Errorf("Normalize(%q) = %q, want %q", tc.input, got, tc.expected)
        }
    }
}
```

### 2. Concurrent Safety Tests
```go
func TestConcurrentOperations(t *testing.T) {
    ob := NewGoOrderBook(Config{Symbol: "BTC/USDC"})
    var wg sync.WaitGroup

    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(price float64) {
            defer wg.Done()
            ob.AddOrder(&Order{Price: price, Quantity: 1.0, Side: Buy})
        }(float64(49000 + i))
    }
    wg.Wait()
    // Verify consistency
}
```

### 3. Benchmark Tests
```go
func BenchmarkProcessBatch(b *testing.B) {
    engine, _ := NewMLXEngine(MLXConfig{MaxMarkets: 10})
    orders := make([]Order, 1000)
    // Initialize orders...

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = engine.ProcessBatch(orders)
    }
}
```

### 4. Hardware-Conditional Tests
```go
func TestMLXEngine(t *testing.T) {
    if runtime.GOOS != "darwin" || runtime.GOARCH != "arm64" {
        t.Skip("MLX engine requires Apple Silicon Mac")
    }
    // Apple Silicon specific tests
}
```

## Coverage Targets

### Tier 1: Critical (Target: 90%+)
- `pkg/orderbook` - Core matching engine
- `pkg/consensus` - Order finality
- `pkg/engine` - MLX acceleration

### Tier 2: Important (Target: 80%+)
- `pkg/marketdata` - Market data feeds
- `pkg/price` - Price oracle (testable components)
- `pkg/lx` - Core types

### Tier 3: Infrastructure (Target: 70%+)
- `pkg/api` - WebSocket server
- `pkg/client` - Client SDK
- `pkg/log` - Logging
- `pkg/metric` - Metrics

### Tier 4: Platform-Specific (Best Effort)
- `pkg/dpdk` - DPDK kernel bypass (CGO/hardware)
- `pkg/mlx` - MLX acceleration (Apple Silicon)

## Running Tests

### All Tests
```bash
go test ./pkg/... -v
```

### With Coverage
```bash
go test -cover ./pkg/...
```

### Coverage Report
```bash
go test -coverprofile=coverage.out ./pkg/...
go tool cover -html=coverage.out -o coverage.html
```

### Benchmarks
```bash
go test -bench=. ./pkg/...
```

### Race Detection
```bash
go test -race ./pkg/...
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest  # For MLX tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
      - run: go test -v -cover ./pkg/...
      - run: go test -race ./pkg/...
```

## Future Improvements

### Short-term
1. Add integration tests for price sources using testnet
2. Implement mock WebSocket server for client tests
3. Add fuzzing tests for codec operations

### Long-term
1. Chaos testing for consensus
2. Load testing framework for API
3. Performance regression CI

## Security Considerations

- Tests must not contain real API keys or secrets
- Price source tests should use simulation mode
- Concurrent tests must verify thread safety
- Benchmark tests should detect performance regressions

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
