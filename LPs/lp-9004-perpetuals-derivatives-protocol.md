---
lp: 9004
title: Perpetuals & Derivatives Protocol
description: Perpetual futures, margin trading, liquidation engine, and vault strategies - OVER 9000x FASTER
author: Lux Network Team (@luxfi)
discussions-to: https://forum.lux.network/t/lp-9004-perpetuals
status: Final
type: Standards Track
category: LRC
created: 2025-12-11
updated: 2025-12-11
requires: 9001, 9005
supersedes: 0609
series: LP-9000 DEX Series
tags: [defi, derivatives, lp-9000-series]
implementation: https://github.com/luxfi/dex
---

> **Part of LP-9000 Series**: This LP is part of the [LP-9000 DEX Series](./lp-9000-dex-overview.md) - Lux's high-performance decentralized exchange infrastructure.

> **LP-9000 Series**: [LP-9000 Overview](./lp-9000-dex-overview.md) | [LP-9001 X-Chain](./lp-9001-x-chain-exchange-specification.md) | [LP-9002 API](./lp-9002-dex-api-rpc-specification.md) | [LP-9003 Performance](./lp-9003-high-performance-dex-protocol.md) | [LP-9005 Oracle](./lp-9005-native-oracle-protocol.md)

# LP-9004: Perpetuals & Derivatives Protocol

| Field | Value |
|-------|-------|
| LP | 9004 |
| Title | Perpetuals & Derivatives Protocol |
| Author | Lux Network Team |
| Status | Implemented |
| Created | 2025-12-11 |
| Series | LP-9000 DEX |
| Supersedes | LP-0609 |
| Implementation | [luxfi/dex](https://github.com/luxfi/dex) |

## Abstract

This LP specifies the perpetual futures and derivatives trading protocol for the Lux DEX. The protocol supports perpetual contracts with funding rate mechanisms, margin trading (cross/isolated/portfolio), liquidation engine, clearinghouse, and vault strategies. Implementation targets sub-second price updates, 100x leverage, and 8-hour funding intervals.

## Implementation Status

| Component | Source | Status |
|-----------|--------|--------|
| Margin Trading | [`dex/pkg/lx/margin_trading.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/margin_trading.go) | ✅ Complete |
| Liquidation Engine | [`dex/pkg/lx/liquidation_engine.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/liquidation_engine.go) | ✅ Complete |
| Funding Engine | [`dex/pkg/lx/funding.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/funding.go) | ✅ Complete |
| Clearinghouse | [`dex/pkg/lx/clearinghouse.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/clearinghouse.go) | ✅ Complete |
| Risk Engine | [`dex/pkg/lx/risk_engine.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/risk_engine.go) | ✅ Complete |
| Vaults | [`dex/pkg/lx/vaults.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/vaults.go) | ✅ Complete |
| Vault Strategies | [`dex/pkg/lx/vault_strategy.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/vault_strategy.go) | ✅ Complete |
| Lending Pool | [`dex/pkg/lx/lending_pool.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/lending_pool.go) | ✅ Complete |
| Staking | [`dex/pkg/lx/staking.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/staking.go) | ✅ Complete |
| Perpetual Types | [`dex/pkg/lx/perp_types.go`](https://github.com/luxfi/dex/blob/main/pkg/lx/perp_types.go) | ✅ Complete |

## Table of Contents

1. [Motivation](#1-motivation)
2. [Perpetual Contracts](#2-perpetual-contracts)
3. [Margin Trading System](#3-margin-trading-system)
4. [Funding Rate Mechanism](#4-funding-rate-mechanism)
5. [Liquidation Engine](#5-liquidation-engine)
6. [Clearinghouse](#6-clearinghouse)
7. [Risk Management](#7-risk-management)
8. [Vaults & Copy Trading](#8-vaults--copy-trading)
9. [Lending & Borrowing](#9-lending--borrowing)
10. [RPC Endpoints](#10-rpc-endpoints)
11. [Security Considerations](#11-security-considerations)
12. [Test Cases](#12-test-cases)

---

## 1. Motivation

Perpetual futures are the most traded derivative instrument in crypto, with daily volumes exceeding spot markets. A native perpetual trading protocol provides:

- **Capital Efficiency**: Up to 100x leverage with portfolio margining
- **Price Discovery**: Funding rates keep perp prices anchored to index
- **Hedging**: Traders can hedge spot positions without expiration management
- **Liquidity**: No contract rollovers, continuous liquidity in single market

Integration with the Lux DEX spot orderbook (LP-0011) and native oracle (LP-0610) enables unified trading infrastructure.

---

## 2. Perpetual Contracts

### 2.1 Contract Specification

```go
// Source: dex/pkg/lx/perp_types.go

type PerpetualContract struct {
    Symbol           string    // e.g., "BTC-PERP"
    Underlying       string    // e.g., "BTC-USD"
    ContractSize     float64   // Value per contract (e.g., 0.001 BTC)
    TickSize         float64   // Minimum price increment
    IndexPrice       float64   // Spot index from oracle
    MarkPrice        float64   // Fair price for P&L calculation
    OpenInterest     float64   // Total open contracts
    Volume24h        float64   // 24-hour trading volume
    FundingRate      float64   // Current funding rate
    NextFundingTime  time.Time // Next funding timestamp
    MaxLeverage      float64   // Maximum allowed leverage
    MaintenanceMargin float64  // Minimum margin requirement
    Status           ContractStatus
}
```

### 2.2 Mark Price Calculation

Mark price prevents unnecessary liquidations during flash crashes:

```
MarkPrice = IndexPrice × (1 + PremiumIndex)

PremiumIndex = TWAP(ImpactMidPrice - IndexPrice) / IndexPrice

ImpactMidPrice = (ImpactBidPrice + ImpactAskPrice) / 2
```

Where:
- **ImpactBidPrice**: Price to execute $10K sell order
- **ImpactAskPrice**: Price to execute $10K buy order
- **TWAP**: Time-weighted average over 8 hours

### 2.3 Supported Perpetual Markets

| Symbol | Underlying | Contract Size | Max Leverage | Index Source |
|--------|------------|---------------|--------------|--------------|
| BTC-PERP | BTC-USD | 0.001 BTC | 100x | LP-0610 Oracle |
| ETH-PERP | ETH-USD | 0.01 ETH | 100x | LP-0610 Oracle |
| SOL-PERP | SOL-USD | 1 SOL | 50x | LP-0610 Oracle |
| AVAX-PERP | AVAX-USD | 1 AVAX | 50x | LP-0610 Oracle |
| LUX-PERP | LUX-USD | 10 LUX | 20x | LP-0610 Oracle |

---

## 3. Margin Trading System

### 3.1 Margin Account Types

```go
// Source: dex/pkg/lx/margin_trading.go

type MarginAccountType int

const (
    CrossMargin     MarginAccountType = iota // Share margin across positions
    IsolatedMargin                           // Separate margin per position
    PortfolioMargin                          // Risk-based margining (100x max)
)
```

| Mode | Max Leverage | Risk Model | Use Case |
|------|--------------|------------|----------|
| Cross Margin | 10x | Balance shared | Simple trading |
| Isolated Margin | 20x | Position isolated | Risk isolation |
| Portfolio Margin | 100x | Portfolio VaR | Professional traders |

### 3.2 Margin Account Structure

```go
type MarginAccount struct {
    UserID              string
    AccountType         MarginAccountType
    Balance             *big.Int              // Base currency balance
    Equity              *big.Int              // Balance + Unrealized PnL
    MarginUsed          *big.Int              // Margin in use
    FreeMargin          *big.Int              // Available margin
    MarginLevel         float64               // Equity/MarginUsed
    Leverage            float64               // Current leverage
    MaxLeverage         float64               // Maximum allowed
    Positions           map[string]*MarginPosition
    CollateralAssets    map[string]*CollateralAsset
    BorrowedAmounts     map[string]*BorrowedAsset
    LiquidationPrice    float64
    MaintenanceMargin   float64
    InitialMargin       float64
    UnrealizedPnL       *big.Int
    RealizedPnL         *big.Int
}
```

### 3.3 Margin Requirements

| Asset | Initial Margin | Maintenance Margin | Max Leverage |
|-------|----------------|-------------------|--------------|
| BTC | 1% | 0.5% | 100x |
| ETH | 1% | 0.5% | 100x |
| SOL | 2% | 1% | 50x |
| AVAX | 2% | 1% | 50x |
| LUX | 5% | 2.5% | 20x |

### 3.4 Position Management

```go
type MarginPosition struct {
    ID               string
    Symbol           string
    Side             Side          // Buy/Sell
    Size             float64
    EntryPrice       float64
    MarkPrice        float64
    LiquidationPrice float64
    Leverage         float64
    Margin           *big.Int
    UnrealizedPnL    *big.Int
    RealizedPnL      *big.Int
    StopLoss         float64
    TakeProfit       float64
    TrailingStop     float64
    ReduceOnly       bool
    Isolated         bool
    FundingPaid      *big.Int
}
```

---

## 4. Funding Rate Mechanism

### 4.1 Funding Schedule

Funding is exchanged every 8 hours at:
- **00:00 UTC**
- **08:00 UTC**
- **16:00 UTC**

```go
// Source: dex/pkg/lx/funding.go

type FundingConfig struct {
    FundingHours    []int         // [0, 8, 16]
    Interval        time.Duration // 8 hours
    MaxFundingRate  float64       // 0.75% per period
    MinFundingRate  float64       // -0.75% per period
    TWAPWindow      time.Duration // 8 hours
    SampleInterval  time.Duration // 1 minute
    InterestRate    float64       // 0.01% base rate
    PremiumDampener float64       // 1.0 (no dampening)
}
```

### 4.2 Funding Rate Calculation

```
FundingRate = Premium + InterestRate

Premium = TWAP(MarkPrice - IndexPrice) / IndexPrice

Clamped: -0.75% ≤ FundingRate ≤ +0.75%
```

### 4.3 Funding Payment

```go
type FundingRate struct {
    Symbol         string
    Rate           float64   // Funding rate (positive/negative)
    PremiumIndex   float64   // Premium component
    InterestRate   float64   // Interest component (0.01%)
    MarkTWAP       float64   // Mark price TWAP
    IndexTWAP      float64   // Index price TWAP
    Timestamp      time.Time
    PaymentTime    time.Time
    OpenInterest   float64
    LongPositions  float64
    ShortPositions float64
}
```

**Payment Flow:**
- If FundingRate > 0: Longs pay Shorts
- If FundingRate < 0: Shorts pay Longs

```
FundingPayment = PositionValue × FundingRate
PositionValue = Size × MarkPrice
```

### 4.4 TWAP Tracker

```go
type TWAPTracker struct {
    Symbol      string
    Samples     []PriceSample
    Window      time.Duration  // 8 hours
    LastUpdate  time.Time
    CurrentTWAP float64
}

type PriceSample struct {
    Price     float64
    Volume    float64    // Optional volume weight
    Timestamp time.Time
}
```

---

## 5. Liquidation Engine

### 5.1 Liquidation Trigger

Liquidation occurs when:

```
MarginLevel = Equity / MarginUsed

If MarginLevel < MaintenanceMargin → Liquidation
```

### 5.2 Liquidation Queue

```go
// Source: dex/pkg/lx/liquidation_engine.go

type LiquidationQueue struct {
    HighPriority   []*LiquidationOrder   // Margin < 50%
    MediumPriority []*LiquidationOrder   // 50% ≤ Margin < 75%
    LowPriority    []*LiquidationOrder   // 75% ≤ Margin < 100%
}

type LiquidationOrder struct {
    OrderID            string
    PositionID         string
    UserID             string
    Symbol             string
    Side               Side
    Size               float64
    MarkPrice          float64
    LiquidationPrice   float64
    CollateralValue    *big.Int
    Loss               *big.Int
    Priority           LiquidationPriority
    Status             LiquidationOrderStatus
    LiquidatorID       string
    ExecutionPrice     float64
    LiquidationFee     *big.Int
    InsuranceFundClaim *big.Int
}
```

### 5.3 Insurance Fund

```go
type InsuranceFund struct {
    Balance       map[string]*big.Int  // Per-asset balances
    TotalValueUSD *big.Int
    TargetSize    *big.Int
    MinimumSize   *big.Int
    MaxDrawdown   float64
    Contributions []*FundContribution
    Withdrawals   []*FundWithdrawal
    LossCoverage  []*LossCoverageEvent
    HighWaterMark *big.Int
    CurrentDrawdown float64
    APY           float64
}
```

### 5.4 Auto-Deleveraging (ADL)

When insurance fund is depleted:

```go
type AutoDeleveragingEngine struct {
    ADLEnabled     bool
    ADLThreshold   float64  // Insurance fund percentage
    ProfitRanking  map[string]float64  // Trader PnL ranking
    ADLQueue       []*ADLOrder
}
```

ADL prioritizes closing profitable positions in order of:
1. Highest unrealized PnL percentage
2. Highest leverage
3. Largest position size

### 5.5 Socialized Loss

Last resort mechanism:

```go
type SocializedLossEngine struct {
    SocializationEnabled bool
    LossPool             *big.Int
    AffectedPositions    map[string]*big.Int
    DistributionRatio    float64
}
```

---

## 6. Clearinghouse

### 6.1 Clearinghouse Structure

```go
// Source: dex/pkg/lx/clearinghouse.go

type ClearingHouse struct {
    MarginEngine      *MarginEngine
    RiskEngine        *RiskEngine
    FundingEngine     *FundingEngine
    LiquidationEngine *LiquidationEngine
    InsuranceFund     *InsuranceFund
    Positions         map[string]map[string]*Position  // user -> symbol -> position
    PendingOrders     map[string]*Order
    SettlementQueue   []*Settlement
    LastSettlement    time.Time
}
```

### 6.2 Operations

| Operation | Description | Implementation |
|-----------|-------------|----------------|
| Deposit | Add collateral | `Deposit(userID, amount)` |
| Withdraw | Remove collateral | `Withdraw(userID, amount)` |
| OpenPosition | Create new position | `OpenPosition(userID, symbol, side, size, type)` |
| ClosePosition | Close existing position | `ClosePosition(userID, positionID)` |
| ProcessFunding | Settle funding payments | `ProcessFunding()` |
| ProcessLiquidations | Execute liquidation queue | `ProcessLiquidations()` |

### 6.3 Position Opening Flow

```
1. User submits order (OpenPosition)
2. RiskEngine validates margin requirements
3. Order matched against orderbook
4. Position created in Clearinghouse
5. Margin locked from user account
6. Position tracked for funding/liquidation
```

---

## 7. Risk Management

### 7.1 Risk Engine

```go
// Source: dex/pkg/lx/risk_engine.go

type RiskEngine struct {
    MaxPositionSize    map[string]float64  // Per-symbol limits
    MaxLeverage        map[string]float64  // Per-symbol leverage
    CircuitBreakers    map[string]*CircuitBreaker
    RiskLimits         *RiskLimits
    OpenInterestLimits map[string]*big.Int
    ConcentrationLimits map[string]float64
}

type RiskLimits struct {
    MaxDrawdown         float64
    MaxDailyLoss        *big.Int
    MaxPositionCount    int
    MaxOpenOrders       int
    MaxOrderSize        *big.Int
    MinOrderSize        *big.Int
    MaxNotionalExposure *big.Int
}
```

### 7.2 Circuit Breakers

```go
type CircuitBreaker struct {
    Symbol       string
    MaxChange    float64   // 10% default
    LastPrice    float64
    Tripped      bool
    TripTime     time.Time
    ResetPeriod  time.Duration
}

func (cb *CircuitBreaker) Check(price float64) bool {
    change := math.Abs(price - cb.LastPrice) / cb.LastPrice * 100
    if change > cb.MaxChange {
        cb.Tripped = true
        cb.TripTime = time.Now()
        return false
    }
    return true
}
```

### 7.3 Risk Checks

| Check | Threshold | Action |
|-------|-----------|--------|
| Position Size | Max per symbol | Reject order |
| Leverage | Max per account type | Reduce leverage |
| Open Interest | Market limit | Queue order |
| Concentration | 10% of market | Warning |
| Price Deviation | 10% in 5 min | Circuit breaker |

---

## 8. Vaults & Copy Trading

### 8.1 Vault Manager

```go
// Source: dex/pkg/lx/vaults.go

type VaultManager struct {
    vaults       map[string]*Vault
    copyVaults   map[string]*CopyVault
    userVaults   map[string][]string   // user -> vault IDs
    leaderVaults map[string][]string   // leader -> vault IDs
    engine       *TradingEngine
}
```

### 8.2 Standard Vault

```go
type Vault struct {
    ID                 string
    Name               string
    Description        string
    TotalDeposits      *big.Int
    TotalShares        *big.Int
    HighWaterMark      *big.Int
    Strategies         []TradingStrategy
    Performance        *PerformanceMetrics
    Depositors         map[string]*VaultPosition
    Config             VaultConfig
    State              VaultState
    CreatedAt          time.Time
    LastRebalance      time.Time
    PendingDeposits    map[string]*PendingDeposit
    PendingWithdrawals map[string]*PendingWithdrawal
}

type VaultConfig struct {
    ID                string
    Name              string
    ManagementFee     float64       // Annual (e.g., 2%)
    PerformanceFee    float64       // On profits (e.g., 20%)
    MinDeposit        *big.Int
    MaxCapacity       *big.Int
    LockupPeriod      time.Duration
    Strategies        []StrategyConfig
    RiskLimits        RiskLimits
    AllowedAssets     []string
    RebalanceInterval time.Duration
}
```

### 8.3 Copy Trading Vault

```go
type CopyVault struct {
    ID            string
    Name          string
    Leader        string     // Leader trader address
    ProfitShare   float64    // Default 10%
    TotalDeposits *big.Int
    TotalShares   *big.Int
    Followers     map[string]*VaultPosition
    Performance   *PerformanceMetrics
    State         VaultState
    CreatedAt     time.Time
}
```

### 8.4 Vault Strategies

```go
// Source: dex/pkg/lx/vault_strategy.go

type TradingStrategy interface {
    Name() string
    Execute(context *StrategyContext) ([]*Order, error)
    Evaluate() *StrategyMetrics
    Stop()
}

type StrategyConfig struct {
    Name       string
    Type       StrategyType
    Parameters map[string]interface{}
    Allocation float64   // Percentage of vault capital
    RiskLimit  float64
    Enabled    bool
}
```

Available strategies:
- **GridTrading**: Automated grid of buy/sell orders
- **MeanReversion**: Trade price deviations from mean
- **Momentum**: Follow price trends
- **Arbitrage**: Cross-exchange/cross-market arbitrage
- **MarketMaking**: Provide liquidity, capture spread

---

## 9. Lending & Borrowing

### 9.1 Lending Pool

```go
// Source: dex/pkg/lx/lending_pool.go

type LendingPool struct {
    Assets           map[string]*LendingAsset
    Borrowers        map[string]*BorrowerInfo
    TotalDeposits    map[string]*big.Int
    TotalBorrowed    map[string]*big.Int
    UtilizationRate  map[string]float64
    InterestRates    map[string]*InterestRateModel
}

type LendingAsset struct {
    Asset            string
    TotalDeposited   *big.Int
    TotalBorrowed    *big.Int
    AvailableLiquidity *big.Int
    SupplyAPY        float64
    BorrowAPY        float64
    CollateralFactor float64
    LiquidationBonus float64
    ReserveFactor    float64
}
```

### 9.2 Interest Rate Model

```
UtilizationRate = TotalBorrowed / TotalDeposited

If Utilization < OptimalUtilization (80%):
    BorrowRate = BaseRate + (Utilization / Optimal) × Slope1
Else:
    BorrowRate = BaseRate + Slope1 + ((Utilization - Optimal) / (1 - Optimal)) × Slope2

SupplyRate = BorrowRate × UtilizationRate × (1 - ReserveFactor)
```

### 9.3 Collateral Assets

| Asset | Collateral Factor | Liquidation Bonus |
|-------|------------------|-------------------|
| BTC | 80% | 5% |
| ETH | 80% | 5% |
| USDC | 90% | 3% |
| USDT | 85% | 4% |
| LUX | 70% | 7% |

---

## 10. RPC Endpoints

### 10.1 Perpetual Trading

| Method | Description |
|--------|-------------|
| `perp_getMarkets` | List all perpetual markets |
| `perp_getContract(symbol)` | Get contract specification |
| `perp_getMarkPrice(symbol)` | Get current mark price |
| `perp_getFundingRate(symbol)` | Get current funding rate |
| `perp_getFundingHistory(symbol)` | Get historical funding rates |
| `perp_getOpenInterest(symbol)` | Get total open interest |

### 10.2 Margin Trading

| Method | Description |
|--------|-------------|
| `margin_createAccount(type)` | Create margin account |
| `margin_getAccount(userID)` | Get account details |
| `margin_deposit(asset, amount)` | Deposit collateral |
| `margin_withdraw(asset, amount)` | Withdraw collateral |
| `margin_openPosition(params)` | Open leveraged position |
| `margin_closePosition(positionID)` | Close position |
| `margin_getPosition(positionID)` | Get position details |
| `margin_getPositions(userID)` | List all positions |
| `margin_setLeverage(positionID, leverage)` | Adjust leverage |

### 10.3 Vaults

| Method | Description |
|--------|-------------|
| `vault_list` | List all vaults |
| `vault_get(vaultID)` | Get vault details |
| `vault_deposit(vaultID, amount)` | Deposit to vault |
| `vault_withdraw(vaultID, shares)` | Withdraw from vault |
| `vault_getPosition(vaultID, userID)` | Get user's position |
| `vault_getPerformance(vaultID)` | Get vault performance |
| `copyvault_list` | List copy trading vaults |
| `copyvault_follow(leaderID, amount)` | Follow a trader |
| `copyvault_unfollow(vaultID)` | Stop following |

### 10.4 Lending

| Method | Description |
|--------|-------------|
| `lending_getMarkets` | List lending markets |
| `lending_supply(asset, amount)` | Supply to pool |
| `lending_withdraw(asset, amount)` | Withdraw from pool |
| `lending_borrow(asset, amount)` | Borrow from pool |
| `lending_repay(asset, amount)` | Repay borrowed amount |
| `lending_getPosition(userID)` | Get lending position |
| `lending_getRates(asset)` | Get supply/borrow rates |

---

## 11. Security Considerations

### 11.1 Oracle Security

- **Multi-source aggregation**: Weighted median from Pyth, Chainlink, C-Chain AMMs
- **Circuit breakers**: 10% deviation triggers price freeze
- **Staleness check**: Prices expire after 60 seconds
- **Confidence scoring**: Low confidence triggers conservative pricing

### 11.2 Liquidation Safety

- **Insurance fund**: First line of defense for losses
- **Auto-deleveraging**: Profitable positions closed before socialized loss
- **Liquidation fee**: 0.5% incentivizes liquidators
- **Grace period**: 30-second warning before liquidation

### 11.3 Risk Limits

- Position size limits per market
- Max leverage per account type
- Open interest caps per symbol
- Concentration limits (10% of market)
- Daily loss limits per account

### 11.4 Smart Contract Security

- All contracts audited by third-party firms
- Multi-sig governance for parameter changes
- Time-locks on critical operations
- Emergency pause functionality

---

## 12. Test Cases

### 12.1 Unit Tests

```bash
# Source: dex/pkg/lx/*_test.go

go test ./pkg/lx/... -v

# Specific test suites:
go test -run TestPerpetualBasics ./pkg/lx/
go test -run TestMarginTrading ./pkg/lx/
go test -run TestFundingEngine ./pkg/lx/
go test -run TestLiquidationEngine ./pkg/lx/
go test -run TestClearingHouse ./pkg/lx/
go test -run TestVaultManager ./pkg/lx/
go test -run TestLendingPool ./pkg/lx/
```

### 12.2 Test Coverage

| Component | Test File | Coverage |
|-----------|-----------|----------|
| Perpetuals | `perpetuals_test.go` | 85% |
| Margin | `margin_trading_test.go` | 90% |
| Funding | `funding_comprehensive_test.go` | 88% |
| Liquidation | `liquidation_engine_comprehensive_test.go` | 92% |
| Clearinghouse | `clearinghouse_comprehensive_test.go` | 87% |
| Vaults | `vaults_comprehensive_test.go` | 85% |
| Staking | `staking_comprehensive_test.go` | 80% |

### 12.3 Integration Tests

```bash
# X-Chain integration
go test -run TestXChainIntegration ./pkg/lx/

# Full trading flow
go test -run TestClearingHouse ./pkg/lx/
```

---

## Related LPs

- **LP-0011**: X-Chain Exchange Chain Specification (spot orderbook)
- **LP-0036**: X-Chain Order-Book DEX API (RPC spec)
- **LP-0608**: High-Performance DEX Protocol (GPU/MEV)
- **LP-0610**: Native Oracle Protocol (price feeds)
- **LP-0096**: MEV Protection Research

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-11 | Initial specification |

---

## References

1. [dYdX Perpetuals Documentation](https://docs.dydx.exchange/)
2. [GMX V2 Technical Overview](https://docs.gmx.io/)
3. [Aave V3 Risk Parameters](https://docs.aave.com/)
4. [Lux DEX Repository](https://github.com/luxfi/dex)
