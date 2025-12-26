---
lp: 9010
title: DEX Precompile - Native HFT Order Book
tags: [defi, dex, precompile, hft, orderbook, trading]
description: Native EVM precompile for high-frequency trading with 434M orders/sec throughput
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-21
requires: 9000, 9003, 3020
implementation: ~/work/lux/standard/contracts/liquidity/precompiles/IDEX.sol
order: 10
---

> **Documentation**: [dex.lux.network](https://dex.lux.network)
>
> **Source**: 
>
> **DEX Core**: [github.com/luxfi/dex](https://github.com/luxfi/dex)

## Abstract

LP-9010 specifies the DEX Precompile at address `0x0200000000000000000000000000000000000010`, providing native EVM access to the Lux QuantumSwap high-frequency trading (HFT) infrastructure. This precompile enables smart contracts to interact with a full on-chain Central Limit Order Book (CLOB) achieving 434M orders/sec (GPU), 1M ops/sec (Go), 2ns latency, and 1ms finality.

## Motivation

### Performance Gap

Traditional EVM-based DEXs face fundamental limitations:

| Metric | Uniswap V4 | QuantumSwap/LX |
|--------|------------|----------------|
| Throughput | ~100 TPS (AMM-bound) | 434M orders/sec |
| Latency | ~12s (Ethereum block) | 2ns (GPU), 487ns (CPU) |
| Finality | ~12 minutes (64 blocks) | 1ms (FPC consensus) |
| Architecture | AMM with hooks | Full on-chain CLOB |

### Native Precompile Advantages

1. **Zero EVM Overhead**: Direct system calls bypass Solidity execution costs
2. **Hardware Acceleration**: GPU/MLX acceleration via native code paths
3. **Atomic Execution**: Order placement + matching in single transaction
4. **Cross-VM Access**: X-Chain order book accessible from C-Chain contracts

## Specification

### Precompile Address

```solidity
0x0200000000000000000000000000000000000010
```

### Interface Definition

```solidity
// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025 Lux Industries Inc.
pragma solidity ^0.8.24;

/// @title IDEX - Native HFT DEX Precompile Interface
/// @notice Provides direct access to QuantumSwap order book
/// @dev Precompile at 0x0200000000000000000000000000000000000010
interface IDEX {
    /*//////////////////////////////////////////////////////////////
                              ORDER TYPES
    //////////////////////////////////////////////////////////////*/

    enum OrderType {
        MARKET,         // Execute at best available price
        LIMIT,          // Execute at specified price or better
        LIMIT_IOC,      // Immediate-or-cancel limit order
        LIMIT_FOK,      // Fill-or-kill limit order
        LIMIT_GTC,      // Good-till-cancelled limit order
        LIMIT_GTD,      // Good-till-date limit order
        STOP_LOSS,      // Trigger market order at stop price
        STOP_LIMIT,     // Trigger limit order at stop price
        TAKE_PROFIT,    // Take profit market order
        TAKE_PROFIT_LIMIT, // Take profit limit order
        TRAILING_STOP,  // Dynamic stop loss
        ICEBERG,        // Hidden quantity order
        TWAP,           // Time-weighted average price
        VWAP,           // Volume-weighted average price
        SNIPER          // MEV-protected execution
    }

    enum OrderSide { BUY, SELL }
    enum OrderStatus { PENDING, OPEN, PARTIALLY_FILLED, FILLED, CANCELLED, EXPIRED, REJECTED }

    /*//////////////////////////////////////////////////////////////
                              ORDER STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Order {
        bytes32 orderId;
        address trader;
        bytes32 marketId;
        OrderSide side;
        OrderType orderType;
        uint256 price;       // 18 decimals
        uint256 amount;      // Base token amount
        uint256 filled;      // Amount already filled
        uint256 timestamp;
        uint256 expiration;  // 0 = no expiration
        OrderStatus status;
    }

    struct OrderParams {
        bytes32 marketId;
        OrderSide side;
        OrderType orderType;
        uint256 price;
        uint256 amount;
        uint256 expiration;
        bytes extraData;     // For advanced order types
    }

    struct Fill {
        bytes32 orderId;
        bytes32 matchOrderId;
        uint256 price;
        uint256 amount;
        uint256 timestamp;
        bool isMaker;
    }

    struct Market {
        bytes32 marketId;
        address baseToken;
        address quoteToken;
        uint256 tickSize;
        uint256 lotSize;
        uint256 minOrderSize;
        uint256 maxOrderSize;
        uint256 makerFee;    // Basis points
        uint256 takerFee;    // Basis points
        bool active;
    }

    struct OrderBook {
        bytes32 marketId;
        uint256 bestBid;
        uint256 bestAsk;
        uint256 bidDepth;
        uint256 askDepth;
        uint256 lastPrice;
        uint256 volume24h;
        uint256 high24h;
        uint256 low24h;
    }

    /*//////////////////////////////////////////////////////////////
                            ORDER MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Place a new order
    /// @param params Order parameters
    /// @return orderId Unique order identifier
    function placeOrder(OrderParams calldata params) external returns (bytes32 orderId);

    /// @notice Place multiple orders atomically
    /// @param params Array of order parameters
    /// @return orderIds Array of order identifiers
    function placeOrders(OrderParams[] calldata params) external returns (bytes32[] memory orderIds);

    /// @notice Cancel an existing order
    /// @param orderId Order to cancel
    /// @return success Whether cancellation succeeded
    function cancelOrder(bytes32 orderId) external returns (bool success);

    /// @notice Cancel multiple orders
    /// @param orderIds Orders to cancel
    /// @return results Cancellation results for each order
    function cancelOrders(bytes32[] calldata orderIds) external returns (bool[] memory results);

    /// @notice Cancel all orders for a market
    /// @param marketId Market to cancel orders in
    /// @return count Number of orders cancelled
    function cancelAllOrders(bytes32 marketId) external returns (uint256 count);

    /// @notice Modify an existing order (cancel + replace)
    /// @param orderId Order to modify
    /// @param newPrice New price (0 = keep current)
    /// @param newAmount New amount (0 = keep current)
    /// @return newOrderId New order identifier
    function modifyOrder(bytes32 orderId, uint256 newPrice, uint256 newAmount)
        external returns (bytes32 newOrderId);

    /*//////////////////////////////////////////////////////////////
                            QUERY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get order details
    function getOrder(bytes32 orderId) external view returns (Order memory);

    /// @notice Get all open orders for a trader in a market
    function getOpenOrders(address trader, bytes32 marketId)
        external view returns (Order[] memory);

    /// @notice Get order book state
    function getOrderBook(bytes32 marketId) external view returns (OrderBook memory);

    /// @notice Get order book depth (bids/asks at each price level)
    function getOrderBookDepth(bytes32 marketId, uint256 levels)
        external view returns (
            uint256[] memory bidPrices,
            uint256[] memory bidAmounts,
            uint256[] memory askPrices,
            uint256[] memory askAmounts
        );

    /// @notice Get market information
    function getMarket(bytes32 marketId) external view returns (Market memory);

    /// @notice Get all active markets
    function getMarkets() external view returns (Market[] memory);

    /// @notice Get fill history for an order
    function getFills(bytes32 orderId) external view returns (Fill[] memory);

    /// @notice Get recent fills for a market
    function getRecentFills(bytes32 marketId, uint256 count)
        external view returns (Fill[] memory);

    /// @notice Estimate execution price for an order
    function estimateExecution(bytes32 marketId, OrderSide side, uint256 amount)
        external view returns (uint256 avgPrice, uint256 totalCost, uint256 priceImpact);

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    event OrderPlaced(
        bytes32 indexed orderId,
        bytes32 indexed marketId,
        address indexed trader,
        OrderSide side,
        OrderType orderType,
        uint256 price,
        uint256 amount
    );

    event OrderFilled(
        bytes32 indexed orderId,
        bytes32 indexed marketId,
        address indexed trader,
        uint256 price,
        uint256 amount,
        bool isMaker
    );

    event OrderCancelled(bytes32 indexed orderId, address indexed trader);
    event OrderExpired(bytes32 indexed orderId);
    event OrderModified(bytes32 indexed oldOrderId, bytes32 indexed newOrderId);
}
```

### DEXLib Helper Library

```solidity
/// @title DEXLib - Helper library for DEX precompile
/// @notice Simplifies DEX interactions
library DEXLib {
    IDEX internal constant DEX = IDEX(0x0200000000000000000000000000000000000010);

    /// @notice Place a market buy order
    function marketBuy(bytes32 marketId, uint256 amount) internal returns (bytes32) {
        return DEX.placeOrder(IDEX.OrderParams({
            marketId: marketId,
            side: IDEX.OrderSide.BUY,
            orderType: IDEX.OrderType.MARKET,
            price: 0,
            amount: amount,
            expiration: 0,
            extraData: ""
        }));
    }

    /// @notice Place a market sell order
    function marketSell(bytes32 marketId, uint256 amount) internal returns (bytes32) {
        return DEX.placeOrder(IDEX.OrderParams({
            marketId: marketId,
            side: IDEX.OrderSide.SELL,
            orderType: IDEX.OrderType.MARKET,
            price: 0,
            amount: amount,
            expiration: 0,
            extraData: ""
        }));
    }

    /// @notice Place a limit buy order
    function limitBuy(bytes32 marketId, uint256 price, uint256 amount)
        internal returns (bytes32)
    {
        return DEX.placeOrder(IDEX.OrderParams({
            marketId: marketId,
            side: IDEX.OrderSide.BUY,
            orderType: IDEX.OrderType.LIMIT_GTC,
            price: price,
            amount: amount,
            expiration: 0,
            extraData: ""
        }));
    }

    /// @notice Place a limit sell order
    function limitSell(bytes32 marketId, uint256 price, uint256 amount)
        internal returns (bytes32)
    {
        return DEX.placeOrder(IDEX.OrderParams({
            marketId: marketId,
            side: IDEX.OrderSide.SELL,
            orderType: IDEX.OrderType.LIMIT_GTC,
            price: price,
            amount: amount,
            expiration: 0,
            extraData: ""
        }));
    }

    /// @notice Get best bid price
    function getBestBid(bytes32 marketId) internal view returns (uint256) {
        return DEX.getOrderBook(marketId).bestBid;
    }

    /// @notice Get best ask price
    function getBestAsk(bytes32 marketId) internal view returns (uint256) {
        return DEX.getOrderBook(marketId).bestAsk;
    }

    /// @notice Get mid price
    function getMidPrice(bytes32 marketId) internal view returns (uint256) {
        IDEX.OrderBook memory book = DEX.getOrderBook(marketId);
        return (book.bestBid + book.bestAsk) / 2;
    }

    /// @notice Get spread in basis points
    function getSpreadBps(bytes32 marketId) internal view returns (uint256) {
        IDEX.OrderBook memory book = DEX.getOrderBook(marketId);
        if (book.bestBid == 0) return 0;
        return ((book.bestAsk - book.bestBid) * 10000) / book.bestBid;
    }
}
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| `placeOrder` (market) | 50,000 | Immediate execution |
| `placeOrder` (limit) | 30,000 | Add to book |
| `cancelOrder` | 15,000 | Remove from book |
| `modifyOrder` | 40,000 | Cancel + replace |
| `getOrderBook` | 5,000 | View function |
| `estimateExecution` | 10,000 | Simulation |
| Batch orders | 25,000 per order | Bulk discount |

### Performance Specifications

```solidity
┌────────────────────────────────────────────────────────────────────┐
│                   QuantumSwap Performance Tiers                    │
├─────────────────────┬──────────────────────────────────────────────┤
│ Tier                │ Specifications                               │
├─────────────────────┼──────────────────────────────────────────────┤
│ GPU Engine (MLX)    │ 434M orders/sec, 2ns latency                 │
│ Go Engine           │ 1M ops/sec, 487ns latency                    │
│ C++ Engine          │ 500K ops/sec, 1μs latency                    │
│ EVM Precompile      │ 100K ops/sec, 10μs latency                   │
├─────────────────────┼──────────────────────────────────────────────┤
│ Finality            │ 1ms (FPC consensus)                          │
│ Markets             │ 5M simultaneous (single node)                │
│ Order Book Depth    │ Unlimited (B+ tree optimized)                │
│ Message Protocol    │ QZMQ (post-quantum secure)                   │
└─────────────────────┴──────────────────────────────────────────────┘
```

## Rationale

### Why a Precompile?

1. **Performance**: Native code execution vs. EVM bytecode interpretation
2. **Integration**: Direct access to X-Chain order book from C-Chain
3. **Atomicity**: Order placement and matching in single system call
4. **Hardware**: Enable GPU/MLX acceleration paths

### Order Type Selection

The comprehensive order type enum covers:
- **Basic**: MARKET, LIMIT for standard trading
- **Time-in-Force**: IOC, FOK, GTC, GTD for execution control
- **Conditional**: STOP_LOSS, STOP_LIMIT, TAKE_PROFIT for risk management
- **Advanced**: ICEBERG for hidden liquidity, TWAP/VWAP for algorithmic execution
- **MEV Protection**: SNIPER for front-run resistant execution

### Gas Cost Design

Gas costs are calibrated to:
- Encourage limit orders (30K) over market orders (50K) for liquidity provision
- Make cancellation cheap (15K) to enable dynamic market making
- Provide batch discounts for high-frequency strategies

## Backwards Compatibility

### EVM Compatibility

The precompile is fully EVM-compatible:
- Standard Solidity interface
- Compatible with existing tooling (Foundry, Hardhat)
- No changes to existing contract ABIs

### Migration Path

Existing DEX contracts can integrate incrementally:
1. Add DEXLib import
2. Route orders through precompile for better execution
3. Optionally deprecate on-chain matching logic

## Test Cases

### Basic Order Placement

```solidity
function testMarketOrder() public {
    bytes32 marketId = keccak256("LUX/USDC");

    // Place market buy
    bytes32 orderId = DEXLib.marketBuy(marketId, 1 ether);

    // Verify order filled
    IDEX.Order memory order = DEXLib.DEX.getOrder(orderId);
    assertEq(uint(order.status), uint(IDEX.OrderStatus.FILLED));
}

function testLimitOrder() public {
    bytes32 marketId = keccak256("LUX/USDC");
    uint256 price = 100 * 1e18; // $100

    // Place limit buy
    bytes32 orderId = DEXLib.limitBuy(marketId, price, 1 ether);

    // Verify order open
    IDEX.Order memory order = DEXLib.DEX.getOrder(orderId);
    assertEq(uint(order.status), uint(IDEX.OrderStatus.OPEN));
    assertEq(order.price, price);
}
```

### Order Book Queries

```solidity
function testOrderBookDepth() public view {
    bytes32 marketId = keccak256("LUX/USDC");

    (
        uint256[] memory bidPrices,
        uint256[] memory bidAmounts,
        uint256[] memory askPrices,
        uint256[] memory askAmounts
    ) = DEXLib.DEX.getOrderBookDepth(marketId, 10);

    // Verify depth returned
    assertEq(bidPrices.length, 10);
    assertEq(askPrices.length, 10);
}
```

## Reference Implementation

### Core Implementation

**Location**: `~/work/lux/standard/contracts/liquidity/precompiles/IDEX.sol`

```solidity
contracts/liquidity/precompiles/
├── IDEX.sol           # Interface definition (this LP)
├── DEXPrecompile.go   # Go precompile implementation
└── README.md          # Documentation
```

### DEX Core

**Location**: `/Users/z/work/lux/dex/`

```solidity
dex/
├── matching/          # Order matching engine
├── orderbook/         # B+ tree order book
├── executor/          # Trade execution
├── market/            # Market management
└── api/               # RPC/WebSocket APIs
```

## Security Considerations

### Order Validation

1. **Amount Bounds**: Enforce min/max order sizes per market
2. **Price Validation**: Reject orders with invalid tick sizes
3. **Balance Checks**: Verify trader has sufficient funds
4. **Signature Verification**: For order authentication

### MEV Protection

1. **SNIPER Orders**: Execute with MEV protection
2. **Batch Auctions**: Periodic matching for fairness
3. **Commit-Reveal**: Optional for sensitive orders

### Rate Limiting

1. **Per-Address Limits**: Max orders per block
2. **Market Limits**: Max order rate per market
3. **Abuse Detection**: Ban malicious actors

## Economic Impact

### Fee Structure

| Fee Type | Rate | Recipient |
|----------|------|-----------|
| Maker Fee | 0-5 bps | Protocol Treasury |
| Taker Fee | 5-30 bps | Protocol Treasury |
| Gas Cost | ~30-50K gas | Validators |

### Liquidity Incentives

- Maker rebates for providing liquidity
- Volume-based fee discounts
- Market making rewards

## Related LPs

- **LP-9000**: DEX Core Specification
- **LP-9003**: High Performance DEX Protocol
- **LP-9011**: Oracle Precompile (price feeds for orders)
- **LP-9014**: QuantumSwap Integration
- **LP-2517**: Precompile Suite Overview

## Open Questions

1. **Cross-Market Orders**: Should we support multi-leg orders?
2. **Options/Futures**: Extend for derivatives trading?
3. **Privacy Orders**: Dark pool integration?

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
