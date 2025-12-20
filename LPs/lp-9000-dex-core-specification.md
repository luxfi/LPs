---
lp: 9000
title: DEX - Core Trading Protocol Specification
tags: [defi, dex, trading, amm, orderbook]
description: Core specification for the Lux DEX trading protocols, including AMM and order book implementations
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-12-11
requires: 0, 99, 3000
implementation: https://github.com/luxfi/dex
documentation: https://dex.lux.network
---

> **Documentation**: [dex.lux.network](https://dex.lux.network)
>
> **Source**: [github.com/luxfi/dex](https://github.com/luxfi/dex)
>
> **Discussions**: [GitHub Discussions](https://github.com/luxfi/LPs/discussions)

## Abstract

LP-9000 specifies the Lux DEX (Decentralized Exchange) core trading protocols, encompassing both order book (X-Chain native) and AMM (C-Chain smart contracts) implementations. This LP serves as the foundation for all DeFi trading standards on Lux Network.

## Motivation

A comprehensive DEX specification provides:

1. **Unified Trading**: Consistent trading interface across protocols
2. **Liquidity**: Standards for liquidity provision
3. **Interoperability**: Cross-chain trading capabilities
4. **Performance**: High-throughput trading infrastructure

## Specification

### DEX Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Lux DEX Architecture                        │
├──────────────────────┬──────────────────────────────────────────┤
│   X-Chain (Native)   │            C-Chain (EVM)                 │
├──────────────────────┼──────────────────────────────────────────┤
│ • Order Book CLOB    │ • AMM Pools (Uniswap V3 style)           │
│ • Sub-ms Matching    │ • Concentrated Liquidity                 │
│ • UTXO Settlement    │ • Smart Contract Settlement              │
│ • Lamport OTS        │ • ERC-20 Compatible                      │
└──────────────────────┴──────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │     Cross-Chain Bridge        │
              │  (B-Chain + Atomic Swaps)     │
              └───────────────────────────────┘
```

### Implementation

**Repositories**:
- `github.com/luxfi/dex` - DEX implementation
- `github.com/luxfi/node/vms/exchangevm` - X-Chain order book
- `github.com/luxfi/standard` - AMM contracts

### Order Book (X-Chain)

#### Order Types

| Type | Description |
|------|-------------|
| Limit | Fixed price order |
| Market | Best available price |
| Stop | Triggered at price level |
| Stop-Limit | Stop with limit price |
| Post-Only | Maker only, rejects if would take |
| IOC | Immediate or cancel |
| FOK | Fill or kill |
| GTC | Good till cancelled |

#### Order Structure

```go
type Order struct {
    ID          ids.ID
    Trader      Address
    Pair        TradingPair
    Side        OrderSide    // Buy, Sell
    Type        OrderType
    Price       uint64       // 18 decimals
    Amount      uint64
    Remaining   uint64
    Timestamp   uint64
    Expiration  uint64
    Flags       OrderFlags   // PostOnly, IOC, FOK
}

type TradingPair struct {
    BaseAsset   ids.ID
    QuoteAsset  ids.ID
}
```

#### Matching Engine

```go
type MatchingEngine interface {
    AddOrder(order *Order) ([]*Trade, error)
    CancelOrder(orderID ids.ID) error
    GetOrderBook(pair TradingPair, depth int) (*OrderBook, error)
    GetBestBid(pair TradingPair) (*PriceLevel, error)
    GetBestAsk(pair TradingPair) (*PriceLevel, error)
}
```

**Matching Rules**:
- Price-time priority (FIFO)
- Pro-rata for large orders (optional)
- Self-trade prevention
- Partial fills allowed

### AMM Pools (C-Chain)

#### Pool Interface

```solidity
interface ILuxPool {
    struct Pool {
        address token0;
        address token1;
        uint128 liquidity;
        uint160 sqrtPriceX96;
        int24 tick;
        uint24 fee;
    }

    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);

    function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes calldata data
    ) external returns (uint256 amount0, uint256 amount1);

    function burn(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external returns (uint256 amount0, uint256 amount1);
}
```

#### Concentrated Liquidity

```solidity
struct Position {
    uint128 liquidity;
    uint256 feeGrowthInside0LastX128;
    uint256 feeGrowthInside1LastX128;
    uint128 tokensOwed0;
    uint128 tokensOwed1;
}
```

**Fee Tiers**:
- 0.01% (1 bps) - Stablecoin pairs
- 0.05% (5 bps) - Standard pairs
- 0.30% (30 bps) - Exotic pairs
- 1.00% (100 bps) - High volatility

### Liquidity Mining

```solidity
interface ILiquidityMining {
    struct RewardInfo {
        address rewardToken;
        uint256 rewardRate;
        uint256 periodFinish;
        uint256 rewardPerTokenStored;
    }

    function stake(uint256 tokenId) external;
    function withdraw(uint256 tokenId) external;
    function getReward() external;
    function earned(address account) external view returns (uint256);
}
```

### Cross-Chain Trading

#### Atomic Swaps

```go
type AtomicSwap struct {
    InitiatorChain  ids.ID
    ResponderChain  ids.ID
    HashLock        [32]byte
    TimeLock        uint64
    InitiatorAsset  Asset
    ResponderAsset  Asset
    Status          SwapStatus
}
```

#### Bridge Trading

```solidity
interface ICrossChainSwap {
    function initiateSwap(
        uint256 sourceChainId,
        uint256 destChainId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (bytes32 swapId);

    function completeSwap(
        bytes32 swapId,
        bytes calldata bridgeProof
    ) external;
}
```

### Fee Structure

| Operation | Fee | Distribution |
|-----------|-----|--------------|
| Maker | 0.00% - 0.05% | Protocol |
| Taker | 0.05% - 0.30% | LP + Protocol |
| Bridge | 0.10% | Validators |
| Withdrawal | Gas only | Network |

### API Endpoints

#### Order Book API

| Method | Description |
|--------|-------------|
| `dex.createOrder` | Create new order |
| `dex.cancelOrder` | Cancel order |
| `dex.getOrderBook` | Get order book |
| `dex.getOrders` | Get user orders |
| `dex.getTrades` | Get trade history |
| `dex.getTicker` | Get market ticker |

#### AMM API

| Method | Description |
|--------|-------------|
| `pool.swap` | Execute swap |
| `pool.addLiquidity` | Add liquidity |
| `pool.removeLiquidity` | Remove liquidity |
| `pool.getQuote` | Get swap quote |
| `pool.getPosition` | Get LP position |

### REST Endpoints

```
# Order Book (X-Chain)
POST /ext/bc/X/dex/orders
DELETE /ext/bc/X/dex/orders/{orderId}
GET /ext/bc/X/dex/orderbook/{pair}
GET /ext/bc/X/dex/trades/{pair}
GET /ext/bc/X/dex/ticker/{pair}

# AMM (C-Chain)
POST /ext/bc/C/dex/swap
POST /ext/bc/C/dex/liquidity/add
POST /ext/bc/C/dex/liquidity/remove
GET /ext/bc/C/dex/pools
GET /ext/bc/C/dex/quote/{pair}
```

### WebSocket Feeds

```
# Real-time feeds
ws://node/ext/bc/X/dex/ws

# Subscribe to:
- orderbook:{pair}     # Order book updates
- trades:{pair}        # Trade stream
- ticker:{pair}        # Price ticker
- user:{address}       # User orders/trades
```

### Configuration

```json
{
  "dex": {
    "orderBook": {
      "maxOrdersPerUser": 1000,
      "maxOrderLifetime": "30d",
      "minOrderSize": "0.0001",
      "tickSize": "0.00000001"
    },
    "amm": {
      "defaultFee": 3000,
      "tickSpacing": 60,
      "maxLiquidityPerTick": "10000000000000000000000000"
    },
    "crossChain": {
      "bridgeFee": 10,
      "minConfirmations": 1,
      "maxSwapTime": "1h"
    }
  }
}
```

### Performance

| Metric | Order Book | AMM |
|--------|------------|-----|
| Throughput | 100,000+ orders/sec | 4,500 TPS |
| Latency | <1ms matching | ~2s finality |
| Finality | ~2s | ~2s |
| Gas Cost | N/A (UTXO) | ~150k gas/swap |

## Rationale

Design decisions for DEX:

1. **Dual Model**: Order book for professional trading, AMM for simplicity
2. **X-Chain Native**: Order book benefits from UTXO model
3. **Cross-Chain**: Seamless trading across chains
4. **Concentrated Liquidity**: Capital efficiency for LPs

## Backwards Compatibility

LP-9000 is a new standard. Existing DEX implementations should align with this specification.

## Test Cases

```bash
# Order book tests
cd dex && go test ./pkg/lx/... -v

# AMM contract tests
cd standard && forge test --match-contract PoolTest

# Integration tests
go test ./integration/dex/... -v
```

## Reference Implementation

**Repositories**:
- `github.com/luxfi/dex`
- `github.com/luxfi/standard`
- `github.com/luxfi/node/vms/exchangevm`

## Security Considerations

1. **Front-Running**: Time priority and private mempools
2. **Flash Loans**: Reentrancy protection
3. **Oracle Manipulation**: TWAP oracles
4. **Sandwich Attacks**: Slippage protection

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-3000 | X-Chain Exchange | Native order book chain |
| LP-9100 | Order Matching | Sub-specification |
| LP-9200 | Liquidity Pools | Sub-specification |
| LP-9300 | Derivatives | Sub-specification |
| LP-9400 | Lending/Borrowing | Sub-specification |
| LP-9500 | Yield Protocols | Sub-specification |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
