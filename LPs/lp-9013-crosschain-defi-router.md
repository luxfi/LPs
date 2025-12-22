---
lp: 9013
title: CrossChainDeFiRouter - Omnichain DeFi Orchestration
tags: [defi, cross-chain, router, swap, limit-order, omnichain]
description: Unified router combining DEX, Oracle, and Bridge precompiles for omnichain DeFi operations
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-21
requires: 9010, 9011, 9012, 3020
implementation: https://github.com/luxfi/standard/src/liquidity/CrossChainDeFiRouter.sol
order: 13
---

> **Documentation**: [docs.lux.network/defi](https://docs.lux.network/defi)
>
> **Source**: [github.com/luxfi/standard](https://github.com/luxfi/standard/tree/main/src/liquidity)

## Abstract

LP-9013 specifies the CrossChainDeFiRouter, a unified smart contract that orchestrates omnichain DeFi operations by combining the DEX Precompile (LP-9010), Oracle Precompile (LP-9011), and Bridge Aggregator (LP-9012). The router enables atomic cross-chain swaps, cross-chain limit orders, multi-venue execution, and strategy trading across 30+ DeFi protocols.

## Motivation

### DeFi Fragmentation

Current DeFi landscape challenges:

| Problem | Impact | Solution |
|---------|--------|----------|
| Siloed liquidity | Suboptimal prices | Multi-venue routing |
| Manual bridging | Poor UX | Atomic cross-chain ops |
| No cross-chain limits | Limited strategies | Cross-chain order book |
| Protocol lock-in | Reduced flexibility | Unified interface |

### Unified Router Benefits

1. **Best Execution**: Route across native DEX, AMMs, aggregators
2. **Cross-Chain Atomic**: Swap + bridge in single transaction
3. **Advanced Orders**: Limit orders across chains
4. **Strategy Support**: TWAP, VWAP, Iceberg execution

## Specification

### Contract Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CrossChainDeFiRouter                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  DEX Precompile │  │ Oracle Precompile│  │ Bridge Aggregator│            │
│  │  0x0200...0010  │  │  0x0200...0011   │  │ (Deployed)       │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                     │                      │
│           ▼                    ▼                     ▼                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Execution Engine                               │  │
│  │  • Multi-venue swaps    • Cross-chain swaps   • Limit order mgmt     │  │
│  │  • TWAP/VWAP execution  • Strategy trading    • MEV protection       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interface Definition

```solidity
// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025 Lux Industries Inc.
pragma solidity ^0.8.24;

import {IDEX} from "./precompiles/IDEX.sol";
import {IOracle} from "./precompiles/IOracle.sol";
import {IBridgeAggregator} from "./bridges/IBridgeAggregator.sol";

/// @title ICrossChainDeFiRouter - Omnichain DeFi Router Interface
/// @notice Unified interface for cross-chain DeFi operations
contract CrossChainDeFiRouter {
    /*//////////////////////////////////////////////////////////////
                              CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Precompile addresses
    IDEX constant DEX = IDEX(0x0200000000000000000000000000000000000010);
    IOracle constant ORACLE = IOracle(0x0200000000000000000000000000000000000011);

    /// @notice Bridge aggregator
    IBridgeAggregator public immutable BRIDGE;

    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice Execution venue type
    enum Venue {
        NATIVE_DEX,      // Lux QuantumSwap
        UNISWAP_V4,      // Uniswap V4
        CURVE,           // Curve Finance
        BALANCER,        // Balancer V3
        AGGREGATOR       // DEX Aggregator (1inch, Paraswap)
    }

    /// @notice Strategy execution type
    enum Strategy {
        MARKET,          // Immediate execution
        LIMIT,           // Price-based execution
        TWAP,            // Time-weighted
        VWAP,            // Volume-weighted
        ICEBERG,         // Hidden quantity
        SNIPER           // MEV-protected
    }

    /// @notice Cross-chain swap parameters
    struct CrossChainSwapParams {
        bytes32 srcChainId;
        bytes32 destChainId;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        address recipient;
        uint256 deadline;
        Venue preferredVenue;
        bytes extraData;
    }

    /// @notice Cross-chain limit order
    struct CrossChainLimitOrder {
        bytes32 orderId;
        address owner;
        bytes32 srcChainId;
        bytes32 destChainId;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 triggerPrice;      // Price to trigger execution
        uint256 expiration;
        bool active;
    }

    /// @notice Multi-venue execution result
    struct ExecutionResult {
        uint256 amountIn;
        uint256 amountOut;
        Venue[] venuesUsed;
        uint256[] venueAmounts;
        uint256 gasUsed;
        uint256 priceImpact;       // Basis points
    }

    /// @notice Strategy execution parameters
    struct StrategyParams {
        Strategy strategy;
        uint256 duration;          // For TWAP/VWAP
        uint256 slices;            // Number of execution slices
        uint256 minSliceSize;
        bytes extraParams;
    }

    /*//////////////////////////////////////////////////////////////
                               STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Active cross-chain limit orders
    mapping(bytes32 => CrossChainLimitOrder) public limitOrders;

    /// @notice User's active order IDs
    mapping(address => bytes32[]) public userOrders;

    /// @notice Keeper addresses for order execution
    mapping(address => bool) public keepers;

    /// @notice Fee recipient
    address public feeRecipient;

    /// @notice Fee in basis points
    uint256 public feeBps = 5; // 0.05%

    /*//////////////////////////////////////////////////////////////
                          SWAP FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Execute swap on native DEX
    /// @param marketId Native DEX market
    /// @param side Buy or sell
    /// @param amount Amount to swap
    /// @param minAmountOut Minimum output
    /// @return amountOut Actual output amount
    function swapNative(
        bytes32 marketId,
        IDEX.OrderSide side,
        uint256 amount,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        bytes32 orderId = DEX.placeOrder(IDEX.OrderParams({
            marketId: marketId,
            side: side,
            orderType: IDEX.OrderType.MARKET,
            price: 0,
            amount: amount,
            expiration: 0,
            extraData: ""
        }));

        IDEX.Order memory order = DEX.getOrder(orderId);
        amountOut = order.filled;
        require(amountOut >= minAmountOut, "Insufficient output");
    }

    /// @notice Multi-venue swap with best execution
    /// @param tokenIn Input token
    /// @param tokenOut Output token
    /// @param amountIn Input amount
    /// @param minAmountOut Minimum output
    /// @return result Execution result with venue breakdown
    function swapMultiVenue(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (ExecutionResult memory result) {
        // Get quotes from all venues
        (Venue[] memory venues, uint256[] memory quotes) = _getAllQuotes(
            tokenIn, tokenOut, amountIn
        );

        // Calculate optimal split
        (uint256[] memory amounts, uint256 totalOut) = _optimizeSplit(
            venues, quotes, amountIn
        );

        require(totalOut >= minAmountOut, "Insufficient output");

        // Execute across venues
        result = _executeMultiVenue(tokenIn, tokenOut, venues, amounts);
    }

    /// @notice Cross-chain swap (swap + bridge)
    /// @param params Cross-chain swap parameters
    /// @return messageId Bridge message ID
    /// @return amountOut Expected output on destination
    function swapCrossChain(
        CrossChainSwapParams calldata params
    ) external payable returns (bytes32 messageId, uint256 amountOut) {
        // Step 1: Swap on source chain if needed
        uint256 bridgeAmount = params.amountIn;
        address bridgeToken = params.tokenIn;

        if (params.tokenIn != _getBridgableToken(params.tokenIn)) {
            bridgeAmount = _swapToBridgable(
                params.tokenIn,
                params.amountIn,
                params.preferredVenue
            );
            bridgeToken = _getBridgableToken(params.tokenIn);
        }

        // Step 2: Get bridge quote
        IBridgeAggregator.BridgeQuote memory quote = BRIDGE.getQuote(
            IBridgeAggregator.BridgeRequest({
                srcChainId: params.srcChainId,
                destChainId: params.destChainId,
                token: bridgeToken,
                amount: bridgeAmount,
                recipient: params.recipient,
                security: IBridgeAggregator.SecurityLevel.BALANCED,
                maxFee: type(uint256).max,
                deadline: params.deadline,
                callData: abi.encode(params.tokenOut, params.minAmountOut)
            })
        );

        // Step 3: Execute bridge with swap on destination
        IBridgeAggregator.BridgeResult memory bridgeResult = BRIDGE.bridgeWithQuote{
            value: msg.value
        }(quote, params.recipient);

        messageId = bridgeResult.messageId;
        amountOut = _estimateDestSwap(
            params.destChainId,
            bridgeToken,
            params.tokenOut,
            quote.destAmount
        );

        emit CrossChainSwapInitiated(
            messageId,
            params.srcChainId,
            params.destChainId,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            params.recipient
        );
    }

    /*//////////////////////////////////////////////////////////////
                       LIMIT ORDER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Create cross-chain limit order
    /// @param params Order parameters
    /// @return orderId Unique order identifier
    function createCrossChainLimitOrder(
        CrossChainSwapParams calldata params,
        uint256 triggerPrice
    ) external returns (bytes32 orderId) {
        orderId = keccak256(abi.encodePacked(
            msg.sender,
            params.srcChainId,
            params.destChainId,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            triggerPrice,
            block.timestamp
        ));

        // Lock tokens
        IERC20(params.tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            params.amountIn
        );

        limitOrders[orderId] = CrossChainLimitOrder({
            orderId: orderId,
            owner: msg.sender,
            srcChainId: params.srcChainId,
            destChainId: params.destChainId,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            minAmountOut: params.minAmountOut,
            triggerPrice: triggerPrice,
            expiration: params.deadline,
            active: true
        });

        userOrders[msg.sender].push(orderId);

        emit LimitOrderCreated(
            orderId,
            msg.sender,
            params.srcChainId,
            params.destChainId,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            triggerPrice
        );
    }

    /// @notice Execute limit order (callable by keepers)
    /// @param orderId Order to execute
    function executeLimitOrder(bytes32 orderId) external {
        require(keepers[msg.sender], "Not keeper");

        CrossChainLimitOrder storage order = limitOrders[orderId];
        require(order.active, "Order not active");
        require(block.timestamp <= order.expiration, "Order expired");

        // Check price condition
        IOracle.Price memory price = ORACLE.getPrice(order.tokenIn, order.tokenOut);
        require(price.price >= order.triggerPrice, "Price not met");

        order.active = false;

        // Execute cross-chain swap
        (bytes32 messageId, uint256 amountOut) = this.swapCrossChain(
            CrossChainSwapParams({
                srcChainId: order.srcChainId,
                destChainId: order.destChainId,
                tokenIn: order.tokenIn,
                tokenOut: order.tokenOut,
                amountIn: order.amountIn,
                minAmountOut: order.minAmountOut,
                recipient: order.owner,
                deadline: order.expiration,
                preferredVenue: Venue.NATIVE_DEX,
                extraData: ""
            })
        );

        emit LimitOrderExecuted(orderId, messageId, amountOut);
    }

    /// @notice Cancel limit order
    /// @param orderId Order to cancel
    function cancelLimitOrder(bytes32 orderId) external {
        CrossChainLimitOrder storage order = limitOrders[orderId];
        require(order.owner == msg.sender, "Not owner");
        require(order.active, "Order not active");

        order.active = false;

        // Return tokens
        IERC20(order.tokenIn).safeTransfer(msg.sender, order.amountIn);

        emit LimitOrderCancelled(orderId);
    }

    /*//////////////////////////////////////////////////////////////
                      STRATEGY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Execute TWAP strategy
    /// @param tokenIn Input token
    /// @param tokenOut Output token
    /// @param amountIn Total input amount
    /// @param params Strategy parameters
    /// @return strategyId Strategy tracking ID
    function executeTWAP(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        StrategyParams calldata params
    ) external returns (bytes32 strategyId) {
        require(params.strategy == Strategy.TWAP, "Not TWAP");

        strategyId = _initializeStrategy(tokenIn, tokenOut, amountIn, params);

        // Schedule TWAP slices
        uint256 sliceAmount = amountIn / params.slices;
        uint256 interval = params.duration / params.slices;

        for (uint256 i = 0; i < params.slices; i++) {
            _scheduleSlice(
                strategyId,
                sliceAmount,
                block.timestamp + (interval * (i + 1))
            );
        }

        emit StrategyInitiated(strategyId, params.strategy, amountIn, params.duration);
    }

    /// @notice Execute VWAP strategy
    function executeVWAP(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        StrategyParams calldata params
    ) external returns (bytes32 strategyId) {
        require(params.strategy == Strategy.VWAP, "Not VWAP");

        strategyId = _initializeStrategy(tokenIn, tokenOut, amountIn, params);

        // VWAP slices based on historical volume profile
        uint256[] memory volumeProfile = _getVolumeProfile(
            tokenIn, tokenOut, params.duration
        );

        _scheduleVWAPSlices(strategyId, amountIn, volumeProfile);

        emit StrategyInitiated(strategyId, params.strategy, amountIn, params.duration);
    }

    /// @notice Execute Iceberg strategy
    function executeIceberg(
        bytes32 marketId,
        IDEX.OrderSide side,
        uint256 totalAmount,
        uint256 visibleAmount,
        uint256 price
    ) external returns (bytes32 strategyId) {
        strategyId = keccak256(abi.encodePacked(
            msg.sender, marketId, totalAmount, visibleAmount, block.timestamp
        ));

        // Place initial visible order
        _placeIcebergSlice(strategyId, marketId, side, visibleAmount, price);

        // Store hidden amount for refills
        _storeIcebergState(strategyId, totalAmount - visibleAmount, visibleAmount);

        emit StrategyInitiated(strategyId, Strategy.ICEBERG, totalAmount, 0);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get all quotes for a swap
    function getAllQuotes(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (
        Venue[] memory venues,
        uint256[] memory quotes
    ) {
        return _getAllQuotes(tokenIn, tokenOut, amountIn);
    }

    /// @notice Get optimal execution path
    function getOptimalPath(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (
        Venue[] memory venues,
        uint256[] memory amounts,
        uint256 expectedOut
    ) {
        (venues, ) = _getAllQuotes(tokenIn, tokenOut, amountIn);
        (amounts, expectedOut) = _optimizeSplit(venues, new uint256[](venues.length), amountIn);
    }

    /// @notice Get user's active limit orders
    function getUserOrders(address user)
        external view returns (CrossChainLimitOrder[] memory orders)
    {
        bytes32[] memory orderIds = userOrders[user];
        orders = new CrossChainLimitOrder[](orderIds.length);

        for (uint256 i = 0; i < orderIds.length; i++) {
            orders[i] = limitOrders[orderIds[i]];
        }
    }

    /*//////////////////////////////////////////////////////////////
                              EVENTS
    //////////////////////////////////////////////////////////////*/

    event CrossChainSwapInitiated(
        bytes32 indexed messageId,
        bytes32 srcChainId,
        bytes32 destChainId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 expectedAmountOut,
        address recipient
    );

    event LimitOrderCreated(
        bytes32 indexed orderId,
        address indexed owner,
        bytes32 srcChainId,
        bytes32 destChainId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 triggerPrice
    );

    event LimitOrderExecuted(
        bytes32 indexed orderId,
        bytes32 indexed messageId,
        uint256 amountOut
    );

    event LimitOrderCancelled(bytes32 indexed orderId);

    event StrategyInitiated(
        bytes32 indexed strategyId,
        Strategy strategy,
        uint256 totalAmount,
        uint256 duration
    );

    event StrategySliceExecuted(
        bytes32 indexed strategyId,
        uint256 sliceAmount,
        uint256 sliceOutput
    );

    event StrategyCompleted(
        bytes32 indexed strategyId,
        uint256 totalIn,
        uint256 totalOut
    );
}
```

### Integration Example

```solidity
/// @title DeFiVault - Example vault using CrossChainDeFiRouter
contract DeFiVault {
    CrossChainDeFiRouter public router;

    /// @notice Rebalance across chains
    function rebalanceCrossChain(
        bytes32 destChain,
        address tokenIn,
        address tokenOut,
        uint256 amount
    ) external onlyManager returns (bytes32 messageId) {
        IERC20(tokenIn).approve(address(router), amount);

        (messageId, ) = router.swapCrossChain(
            CrossChainDeFiRouter.CrossChainSwapParams({
                srcChainId: keccak256("lux"),
                destChainId: destChain,
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amountIn: amount,
                minAmountOut: _getMinOutput(tokenIn, tokenOut, amount),
                recipient: address(this),
                deadline: block.timestamp + 1 hours,
                preferredVenue: CrossChainDeFiRouter.Venue.NATIVE_DEX,
                extraData: ""
            })
        );
    }

    /// @notice Execute TWAP for large trades
    function executeLargeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amount
    ) external onlyManager returns (bytes32 strategyId) {
        IERC20(tokenIn).approve(address(router), amount);

        strategyId = router.executeTWAP(
            tokenIn,
            tokenOut,
            amount,
            CrossChainDeFiRouter.StrategyParams({
                strategy: CrossChainDeFiRouter.Strategy.TWAP,
                duration: 4 hours,
                slices: 12,      // Every 20 minutes
                minSliceSize: amount / 20,
                extraParams: ""
            })
        );
    }
}
```

## Rationale

### Precompile Integration

The router leverages native precompiles for:
- **DEX Precompile**: Direct HFT order book access
- **Oracle Precompile**: Real-time price feeds for limit orders
- **Bridge Aggregator**: Optimal cross-chain routing

### Strategy Support

Advanced strategies enable institutional-grade execution:
- **TWAP**: Minimize time-based price impact
- **VWAP**: Execute proportional to market volume
- **Iceberg**: Hide large order size

### Cross-Chain Limit Orders

Unlike traditional limit orders:
1. Price monitored on source chain
2. Execution triggers cross-chain swap
3. Settlement on destination chain
4. Keeper network for execution

## Backwards Compatibility

The router is compatible with:
- ERC-20 tokens (standard interface)
- Existing DEX adapters (UniversalLiquidityRouter)
- Bridge protocols (via aggregator)

## Test Cases

### Multi-Venue Execution

```solidity
function testMultiVenueSwap() public {
    uint256 amountIn = 10000 * 1e18;

    ExecutionResult memory result = router.swapMultiVenue(
        WETH,
        USDC,
        amountIn,
        25000 * 1e6 // Min $25k output
    );

    // Verify multi-venue execution
    assertGt(result.venuesUsed.length, 1);
    assertGe(result.amountOut, 25000 * 1e6);

    // Verify better than single venue
    uint256 singleVenueQuote = _getBestSingleQuote(WETH, USDC, amountIn);
    assertGe(result.amountOut, singleVenueQuote * 99 / 100);
}
```

### Cross-Chain Limit Order

```solidity
function testCrossChainLimitOrder() public {
    // Create limit order
    bytes32 orderId = router.createCrossChainLimitOrder(
        CrossChainSwapParams({
            srcChainId: keccak256("lux"),
            destChainId: keccak256("ethereum"),
            tokenIn: WETH,
            tokenOut: USDC,
            amountIn: 1 ether,
            minAmountOut: 2500 * 1e6,
            recipient: user,
            deadline: block.timestamp + 1 days,
            preferredVenue: Venue.NATIVE_DEX,
            extraData: ""
        }),
        3000 * 1e18 // Trigger at $3000
    );

    // Verify order created
    CrossChainLimitOrder memory order = router.limitOrders(orderId);
    assertTrue(order.active);
    assertEq(order.triggerPrice, 3000 * 1e18);
}
```

## Reference Implementation

**Location**: `/Users/z/work/lux/standard/src/liquidity/CrossChainDeFiRouter.sol`

```
src/liquidity/
├── CrossChainDeFiRouter.sol    # Main router (this LP)
├── precompiles/
│   ├── IDEX.sol                # LP-9010
│   └── IOracle.sol             # LP-9011
├── bridges/
│   └── IBridgeAggregator.sol   # LP-9012
└── strategies/
    ├── TWAP.sol
    ├── VWAP.sol
    └── Iceberg.sol
```

## Security Considerations

### Order Security

1. **Token Escrow**: Limit order tokens locked in contract
2. **Price Validation**: Oracle prices verified before execution
3. **Slippage Protection**: minAmountOut enforced
4. **Deadline Enforcement**: Expired orders refunded

### Strategy Security

1. **Slice Limits**: Minimum/maximum slice sizes
2. **Execution Bounds**: Price deviation limits
3. **Keeper Authorization**: Whitelisted executors

### MEV Protection

1. **Sniper Mode**: Private mempool execution
2. **Commit-Reveal**: For sensitive orders
3. **Batch Auctions**: Fair price discovery

## Economic Impact

### Gas Efficiency

| Operation | Direct | Via Router | Overhead |
|-----------|--------|------------|----------|
| Single swap | 100k | 120k | 20% |
| Multi-venue | N/A | 200k | - |
| Cross-chain | 500k | 350k | -30% |
| Limit order | N/A | 80k create | - |

### Fee Structure

- Router fee: 0.05% (configurable)
- Keeper rewards: 10% of gas costs
- Protocol revenue: Distributed to LUX stakers

## Related LPs

- **LP-9010**: DEX Precompile
- **LP-9011**: Oracle Precompile
- **LP-9012**: Bridge Aggregator
- **LP-9014**: QuantumSwap Integration
- **LP-2501**: DeFi Protocol Integration Standard

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
