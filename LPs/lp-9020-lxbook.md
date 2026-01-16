---
lp: 9020
title: LXBook - Permissionless Order Book Precompile
tags: [precompile, dex, clob, trading, lx]
description: Singleton precompile hosting permissionless order books with Hyperliquid-style execute() endpoint
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-05
requires: 9015
implementation: |
  - Go: ~/work/lux/precompile/dex/lxbook.go
  - Solidity: ~/work/lux/precompile/solidity/dex/ILXBook.sol
  - Docs: ~/work/lux/precompile/docs/dex/LX.md
order: 20
---

## Abstract

LP-9020 specifies **LXBook**, a singleton precompile at `0x0000000000000000000000000000000000009020` that hosts many permissionless order books. It provides a Hyperliquid-style single `execute()` endpoint with typed action payloads for order lifecycle, matching, and advanced order programs (TWAP, OCO, brackets).

**Key Design Principle**: Custody/margin is NOT in LXBook (belongs in LXVault). This is order lifecycle + matching + scheduling only.

## Motivation

### Clean Separation of Concerns

| Component | Responsibility |
|-----------|----------------|
| **LXBook** | Market factory + orderbooks + matching + advanced orders |
| **LXVault** | Balances, margin, collateral, liquidations |
| **LXPool** | v4-style AMM |

### Hyperliquid-Style API

Instead of many individual functions, LXBook exposes a single `execute()` endpoint:

```solidity
function execute(Action calldata action) external returns (bytes memory result);
function executeBatch(Action[] calldata actions) external returns (bytes[] memory results);
```

This provides:
- Minimal ABI surface area
- Typed action payloads decoded from `bytes data`
- Atomic batch execution
- Anti-replay via nonce/expiry

### What LXBook Covers

- **Order Types**: LIMIT, MARKET, STOP_MARKET, STOP_LIMIT, TAKE_MARKET, TAKE_LIMIT
- **Time-in-Force**: GTC (resting), IOC (immediate-or-cancel), ALO (post-only)
- **Advanced Features**: reduce-only, OCO groups, bracket orders, TWAP programs
- **System Actions**: schedule-cancel (dead-man switch), nonce marking, rate limit credits

### What LXBook Does NOT Cover

- Token custody → LXVault
- Margin requirements → LXVault
- Position liquidations → LXVault
- TP/SL attached to position that auto-resizes → SDK/helper contract (reads LXVault, places reduce-only triggers)

## Specification

### Precompile Address

```
LXBook = 0x0000000000000000000000000000000000009020 (LP-9020)
```

### Action Types

| ActionType | Payload (`data`) | Result |
|------------|------------------|--------|
| `PLACE` | `abi.encode(Order[])` | `abi.encode(PlaceResult[])` |
| `CANCEL` | `abi.encode(Cancel[])` | `abi.encode(bool[])` |
| `CANCEL_BY_CLOID` | `abi.encode(CancelByCloid[])` | `abi.encode(bool[])` |
| `MODIFY` | `abi.encode(Modify[])` | `abi.encode(PlaceResult[])` |
| `TWAP_CREATE` | `abi.encode(Twap)` | `abi.encode(TwapId)` |
| `TWAP_CANCEL` | `abi.encode(MarketId, TwapId)` | `abi.encode(bool)` |
| `SCHEDULE_CANCEL` | `abi.encode(ScheduleCancel)` | `abi.encode(bool)` |
| `NOOP` | `""` (empty) | `abi.encode(true)` |
| `RESERVE_WEIGHT` | `abi.encode(ReserveWeight)` | `abi.encode(bool)` |

### Order Kinds

| Kind | Description |
|------|-------------|
| `LIMIT` | Resting order at specified limit price |
| `MARKET` | Immediate execution at best available price |
| `STOP_MARKET` | Market order triggered when price crosses `triggerPxX18` |
| `STOP_LIMIT` | Limit order triggered when price crosses `triggerPxX18` |
| `TAKE_MARKET` | Market order triggered at profit target |
| `TAKE_LIMIT` | Limit order triggered at profit target |

### Time-in-Force

| TIF | Description |
|-----|-------------|
| `GTC` | Good-til-canceled (resting on book) |
| `IOC` | Immediate-or-cancel (fill available, cancel rest) |
| `ALO` | Add-liquidity-only (post-only, reject if would cross) |

### OCO / Bracket Orders

Orders can be grouped using `groupId` + `groupType`:

| GroupType | Behavior |
|-----------|----------|
| `NONE` | No grouping |
| `OCO` | One-cancels-other: when one fills, siblings cancel |
| `BRACKET` | Bracket order: entry + TP + SL linked |

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILXBook {
    // Identifiers
    type MarketId is uint32;
    type OrderId  is uint64;
    type TwapId   is uint64;

    // Enums
    enum TIF { GTC, IOC, ALO }
    enum OrderKind { LIMIT, MARKET, STOP_MARKET, STOP_LIMIT, TAKE_MARKET, TAKE_LIMIT }
    enum MarketStatus { ACTIVE, POST_ONLY, HALTED }
    enum GroupType { NONE, OCO, BRACKET }
    enum ActionType {
        PLACE, CANCEL, CANCEL_BY_CLOID, MODIFY,
        TWAP_CREATE, TWAP_CANCEL,
        SCHEDULE_CANCEL, NOOP, RESERVE_WEIGHT
    }

    // Structs
    struct MarketConfig {
        bytes32 baseAsset;
        bytes32 quoteAsset;
        uint128 tickSizeX18;
        uint128 lotSizeX18;
        uint32  makerFeePpm;
        uint32  takerFeePpm;
        bytes32 feedId;
        MarketStatus initialStatus;
    }

    struct Order {
        MarketId marketId;
        bool isBuy;
        OrderKind kind;
        uint128 sizeX18;
        uint128 limitPxX18;    // 0 for MARKET
        uint128 triggerPxX18;  // 0 for non-trigger orders
        bool reduceOnly;
        TIF tif;
        bytes32 cloid;
        bytes32 groupId;
        GroupType groupType;
    }

    struct PlaceResult {
        OrderId oid;
        uint8 status;  // 0=rejected, 1=filled, 2=resting, 3=partial
        uint128 filledSizeX18;
        uint128 avgPxX18;
    }

    struct Action {
        ActionType actionType;
        uint64 nonce;
        uint64 expiresAfter;
        bytes data;
    }

    // Execute endpoint
    function execute(Action calldata action) external returns (bytes memory result);
    function executeBatch(Action[] calldata actions) external returns (bytes[] memory results);

    // Market lifecycle
    function createMarket(MarketConfig calldata cfg) external returns (MarketId);
    function getMarketConfig(MarketId marketId) external view returns (MarketConfig memory);
    function getMarketStatus(MarketId marketId) external view returns (MarketStatus);

    // Views
    struct L1 {
        uint128 bestBidPxX18;
        uint128 bestBidSzX18;
        uint128 bestAskPxX18;
        uint128 bestAskSzX18;
        uint128 lastTradePxX18;
    }

    function getL1(MarketId marketId) external view returns (L1 memory);
    function getOrder(MarketId marketId, OrderId oid) external view returns (OrderInfo memory);
    function getOrderIdByCloid(MarketId marketId, address owner, bytes32 cloid) external view returns (OrderId);
}
```

## Rationale

### Single Execute Endpoint vs Many Functions

The `execute()` pattern provides:
1. **Minimal ABI**: One function signature for all trading operations
2. **Typed Payloads**: Strong typing via ABI encoding/decoding
3. **Batch Atomicity**: Multiple actions in one transaction
4. **Extensibility**: New action types without ABI changes

### TP/SL Without Tight Coupling

TP/SL orders that "attach to position" and auto-resize are NOT in LXBook because they require reading positions from LXVault, creating tight coupling.

Instead:
- **SDK/UI**: Track positions client-side, place/cancel triggers accordingly
- **Helper Contract**: Small contract that reads LXVault positions and manages reduce-only triggers

This keeps LXBook as a pure matching engine.

### Uniswap v4 Compatibility

LXPool implements `IPoolManager` exactly. LXBook is a separate CLOB primitive.

SDK exports both:
```typescript
export const LX_POOL = '0x...9010'
export const POOL_MANAGER = LX_POOL  // v4 compat alias
```

## Security Considerations

### Anti-Replay

Actions include `nonce` and `expiresAfter`:
- `nonce`: Recommended as ms timestamp or monotonic counter
- `expiresAfter`: Unix seconds; action rejected if `block.timestamp > expiresAfter`

### Order Validation

All orders must:
- Reference a valid, active market
- Have size ≥ lotSize
- Have price aligned to tickSize (for limit orders)
- Satisfy reduce-only constraints (if set)

### Rate Limiting

`RESERVE_WEIGHT` action allows buying extra action credits. Implementations MAY enforce per-address rate limits.

## Test Cases

```solidity
function testPlaceLimitOrder() public {
    ILXBook.Order[] memory orders = new ILXBook.Order[](1);
    orders[0] = ILXBook.Order({
        marketId: ethUsdcMarket,
        isBuy: true,
        kind: ILXBook.OrderKind.LIMIT,
        sizeX18: 1e18,           // 1 ETH
        limitPxX18: 2000e18,     // $2000
        triggerPxX18: 0,
        reduceOnly: false,
        tif: ILXBook.TIF.GTC,
        cloid: keccak256("order-1"),
        groupId: bytes32(0),
        groupType: ILXBook.GroupType.NONE
    });

    ILXBook.Action memory action = ILXBook.Action({
        actionType: ILXBook.ActionType.PLACE,
        nonce: uint64(block.timestamp * 1000),
        expiresAfter: 0,
        data: abi.encode(orders)
    });

    bytes memory result = lxbook.execute(action);
    ILXBook.PlaceResult[] memory results = abi.decode(result, (ILXBook.PlaceResult[]));

    assertEq(results[0].status, 2); // resting on book
}

function testOCOGroup() public {
    bytes32 groupId = keccak256("oco-group-1");

    ILXBook.Order[] memory orders = new ILXBook.Order[](2);

    // Take profit at $2500
    orders[0] = ILXBook.Order({
        marketId: ethUsdcMarket,
        isBuy: false,
        kind: ILXBook.OrderKind.TAKE_LIMIT,
        sizeX18: 1e18,
        limitPxX18: 2500e18,
        triggerPxX18: 2500e18,
        reduceOnly: true,
        tif: ILXBook.TIF.GTC,
        cloid: keccak256("tp"),
        groupId: groupId,
        groupType: ILXBook.GroupType.OCO
    });

    // Stop loss at $1800
    orders[1] = ILXBook.Order({
        marketId: ethUsdcMarket,
        isBuy: false,
        kind: ILXBook.OrderKind.STOP_MARKET,
        sizeX18: 1e18,
        limitPxX18: 0,
        triggerPxX18: 1800e18,
        reduceOnly: true,
        tif: ILXBook.TIF.IOC,
        cloid: keccak256("sl"),
        groupId: groupId,
        groupType: ILXBook.GroupType.OCO
    });

    // When TP fills, SL auto-cancels (and vice versa)
}
```

## Related LPs

- **LP-9010**: LXPool - v4 PoolManager-Compatible AMM Core
- **LP-9015**: Precompile Registry - LP-Aligned Address Scheme
- **LP-9030**: LXVault - Balances, Margin, Collateral, Liquidations

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
