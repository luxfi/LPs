---
lp: 9030
title: LXVault - Custody and Risk Engine Precompile
tags: [precompile, dex, custody, margin, liquidation, lx]
description: Singleton precompile handling custody, margin, positions, and liquidations for LX
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-05
requires: 9015, 9020
implementation: |
  - Go: ~/work/lux/precompile/dex/lxvault.go
  - Solidity: ~/work/lux/precompile/solidity/dex/ILXVault.sol
  - Docs: ~/work/lux/precompile/docs/dex/LX.md
order: 30
---

## Abstract

LP-9030 specifies **LXVault**, a singleton precompile at `0x0000000000000000000000000000000000009030` that serves as the custody and risk engine for LX. It manages account balances, margin requirements, position tracking, and liquidation mechanics for both spot (prefunded) and perpetual (margin) trading.

**Key Design Principle**: LXVault owns all custody and risk logic. LXBook (matching) and LXPool (AMM) delegate balance/margin operations here.

## Motivation

### Clean Separation of Concerns

| Component | Responsibility |
|-----------|----------------|
| **LXBook** | Market factory + orderbooks + matching + advanced orders |
| **LXPool** | v4-style AMM pools |
| **LXVault** | Balances, margin, collateral, positions, liquidations |

### Hyperliquid-Style Account Model

Modern perps exchanges use a unified account model with:
- **Main accounts**: Primary trading accounts
- **Subaccounts**: Isolated risk buckets under one main account
- **Cross-margin**: Shared collateral across positions
- **Isolated-margin**: Per-position collateral allocation

LXVault implements this model natively in the precompile for:
- Gas-efficient margin calculations
- Atomic settlement from LXBook
- Real-time liquidation checks

### Spot vs Perpetual Models

| Mode | Collateral | Settlement |
|------|------------|------------|
| **Spot** | Prefunded (full balance required) | Immediate delivery |
| **Perps** | Margin-based (leverage allowed) | Mark-to-market, funding |

LXVault supports both within a unified interface.

## Specification

### Precompile Address

```
LXVault = 0x0000000000000000000000000000000000009030 (LP-9030)
```

### Account Model

#### Main Accounts

Every address is implicitly a main account. No registration required.

#### Subaccounts

Subaccounts are identified by `(mainAccount, subaccountId)` where `subaccountId` is a `uint8` (0-255).

- Subaccount 0 is the "default" subaccount (equivalent to main account)
- Subaccounts 1-255 are isolated risk buckets
- Each subaccount has independent positions and margin

#### Margin Modes

| Mode | Description |
|------|-------------|
| `CROSS` | All collateral in subaccount backs all positions |
| `ISOLATED` | Each position has dedicated collateral allocation |

### Collateral Configuration

Each token can be configured as collateral with:

| Parameter | Description |
|-----------|-------------|
| `token` | ERC-20 token address |
| `weight` | Collateral weight (e.g., 1.0 for stables, 0.95 for ETH) |
| `maxDeposit` | Maximum deposit cap |
| `enabled` | Whether token is accepted as collateral |

### Core Types

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILXVault {
    // Identifiers
    type MarketId is uint32;

    // Enums
    enum MarginMode { CROSS, ISOLATED }
    enum PositionSide { LONG, SHORT }

    // Account identifier
    struct Account {
        address main;
        uint8 subaccountId;
    }

    // Collateral configuration
    struct CollateralConfig {
        address token;
        uint64 weightX18;      // 1e18 = 100% weight
        uint128 maxDeposit;
        bool enabled;
    }

    // Position data
    struct Position {
        MarketId marketId;
        PositionSide side;
        uint128 sizeX18;
        uint128 entryPxX18;
        uint128 unrealizedPnlX18;
        int128 accumulatedFundingX18;
        uint64 lastFundingTime;
    }

    // Margin summary
    struct MarginInfo {
        uint128 totalCollateralX18;    // Sum of (balance * weight)
        uint128 usedMarginX18;         // Margin locked by positions
        uint128 freeMarginX18;         // Available for new positions
        uint128 marginRatioX18;        // totalCollateral / usedMargin
        uint128 maintenanceMarginX18;  // Minimum required margin
        bool liquidatable;
    }

    // Settlement instruction from LXBook
    struct Settlement {
        Account maker;
        Account taker;
        MarketId marketId;
        bool takerIsBuy;
        uint128 sizeX18;
        uint128 priceX18;
        uint128 makerFeeX18;
        uint128 takerFeeX18;
    }

    // Liquidation result
    struct LiquidationResult {
        Account liquidated;
        Account liquidator;
        MarketId marketId;
        uint128 sizeX18;
        uint128 priceX18;
        uint128 penaltyX18;
        bool adlTriggered;
    }
}
```

### Core Functions

#### Deposits and Withdrawals

```solidity
/// @notice Deposit tokens into vault
/// @param token ERC-20 token address
/// @param amount Amount to deposit (in token decimals)
/// @param subaccountId Target subaccount (0 = default)
function deposit(
    address token,
    uint128 amount,
    uint8 subaccountId
) external;

/// @notice Withdraw tokens from vault
/// @param token ERC-20 token address
/// @param amount Amount to withdraw (in token decimals)
/// @param subaccountId Source subaccount (0 = default)
/// @dev Reverts if withdrawal would cause margin violation
function withdraw(
    address token,
    uint128 amount,
    uint8 subaccountId
) external;

/// @notice Transfer between subaccounts
/// @param token ERC-20 token address
/// @param amount Amount to transfer
/// @param fromSubaccount Source subaccount
/// @param toSubaccount Destination subaccount
function transfer(
    address token,
    uint128 amount,
    uint8 fromSubaccount,
    uint8 toSubaccount
) external;
```

#### Balance and Position Queries

```solidity
/// @notice Get token balance for account
/// @param account Account identifier
/// @param token Token address
/// @return balance Current balance in token decimals
function getBalance(
    Account calldata account,
    address token
) external view returns (uint128 balance);

/// @notice Get all balances for account
/// @param account Account identifier
/// @return tokens Token addresses
/// @return balances Corresponding balances
function getBalances(
    Account calldata account
) external view returns (address[] memory tokens, uint128[] memory balances);

/// @notice Get position for account in market
/// @param account Account identifier
/// @param marketId Market identifier
/// @return position Position data (zero if no position)
function getPosition(
    Account calldata account,
    MarketId marketId
) external view returns (Position memory position);

/// @notice Get all positions for account
/// @param account Account identifier
/// @return positions Array of active positions
function getPositions(
    Account calldata account
) external view returns (Position[] memory positions);
```

#### Margin Queries

```solidity
/// @notice Get margin info for account
/// @param account Account identifier
/// @return info Margin summary
function getMargin(
    Account calldata account
) external view returns (MarginInfo memory info);

/// @notice Check if account can open position
/// @param account Account identifier
/// @param marketId Market to trade
/// @param sizeX18 Position size
/// @param leverageX18 Desired leverage (1e18 = 1x)
/// @return canOpen True if margin sufficient
/// @return requiredMarginX18 Margin required for position
function checkMargin(
    Account calldata account,
    MarketId marketId,
    uint128 sizeX18,
    uint64 leverageX18
) external view returns (bool canOpen, uint128 requiredMarginX18);
```

#### Margin Mode Configuration

```solidity
/// @notice Set margin mode for subaccount
/// @param subaccountId Subaccount to configure
/// @param mode CROSS or ISOLATED
function setMarginMode(
    uint8 subaccountId,
    MarginMode mode
) external;

/// @notice Get margin mode for subaccount
/// @param account Account identifier
/// @return mode Current margin mode
function getMarginMode(
    Account calldata account
) external view returns (MarginMode mode);
```

### Settlement Interface

Called by LXBook after order matching:

```solidity
/// @notice Settle a trade between maker and taker
/// @param settlement Settlement instruction
/// @return success True if settlement succeeded
/// @dev Only callable by LXBook precompile
/// @dev Atomically updates positions and collects fees
function settleTrade(
    Settlement calldata settlement
) external returns (bool success);

/// @notice Batch settle multiple trades
/// @param settlements Array of settlement instructions
/// @return results Success status for each settlement
/// @dev Only callable by LXBook precompile
function settleTradesBatch(
    Settlement[] calldata settlements
) external returns (bool[] memory results);

/// @notice Pre-trade margin validation hook
/// @param account Account placing order
/// @param marketId Market being traded
/// @param sizeX18 Order size
/// @param isBuy Order direction
/// @return valid True if account has sufficient margin
/// @return reason Rejection reason if invalid
/// @dev Called by LXBook before accepting order
function validateMargin(
    Account calldata account,
    MarketId marketId,
    uint128 sizeX18,
    bool isBuy
) external view returns (bool valid, string memory reason);
```

### Liquidation Engine

#### Liquidation Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `maintenanceMarginRatio` | Minimum margin ratio before liquidation | 3.125% (32x max leverage) |
| `liquidationPenalty` | Penalty taken from liquidated account | 1.0% |
| `liquidatorReward` | Portion of penalty to liquidator | 0.5% |
| `insuranceFundShare` | Portion of penalty to insurance fund | 0.5% |
| `adlThreshold` | Insurance fund depletion trigger for ADL | 10% |

#### Liquidation Functions

```solidity
/// @notice Check if account is liquidatable
/// @param account Account to check
/// @return liquidatable True if below maintenance margin
/// @return shortfall Margin shortfall amount
function isLiquidatable(
    Account calldata account
) external view returns (bool liquidatable, uint128 shortfall);

/// @notice Liquidate underwater account
/// @param account Account to liquidate
/// @param marketId Market position to liquidate
/// @param sizeX18 Size to liquidate (0 = full position)
/// @return result Liquidation outcome
/// @dev Anyone can call; liquidator receives reward
function liquidate(
    Account calldata account,
    MarketId marketId,
    uint128 sizeX18
) external returns (LiquidationResult memory result);

/// @notice Get insurance fund balance
/// @return balance Current insurance fund balance
function getInsuranceFundBalance() external view returns (uint128 balance);
```

#### Auto-Deleverage (ADL)

When insurance fund is depleted, ADL triggers against profitable counterparties:

```solidity
/// @notice ADL ranking for account in market
/// @param account Account to check
/// @param marketId Market
/// @return rank ADL priority (lower = deleveraged first)
/// @dev Rank = PnL * Leverage (most profitable, highest leverage first)
function getAdlRank(
    Account calldata account,
    MarketId marketId
) external view returns (uint64 rank);

/// @notice Execute ADL against profitable counterparty
/// @param bankruptAccount Account being liquidated
/// @param counterparty Profitable account to deleverage
/// @param marketId Market
/// @param sizeX18 Size to deleverage
/// @dev Only callable by liquidation engine
function executeAdl(
    Account calldata bankruptAccount,
    Account calldata counterparty,
    MarketId marketId,
    uint128 sizeX18
) external;
```

### Funding Rate Mechanism

For perpetual markets, funding rates transfer value between longs and shorts:

#### Funding Parameters

| Parameter | Description |
|-----------|-------------|
| `fundingInterval` | Time between funding settlements (default: 1 hour) |
| `fundingRateCap` | Maximum funding rate per interval (default: 0.05%) |
| `premiumFactor` | Weight of premium in funding calculation |

#### Funding Functions

```solidity
/// @notice Get current funding rate for market
/// @param marketId Market identifier
/// @return rateX18 Current funding rate (positive = longs pay shorts)
/// @return nextFundingTime Timestamp of next funding settlement
function getFundingRate(
    MarketId marketId
) external view returns (int128 rateX18, uint64 nextFundingTime);

/// @notice Get accumulated funding for position
/// @param account Account identifier
/// @param marketId Market identifier
/// @return fundingX18 Accumulated funding (positive = received, negative = paid)
function getAccumulatedFunding(
    Account calldata account,
    MarketId marketId
) external view returns (int128 fundingX18);

/// @notice Settle funding for account
/// @param account Account identifier
/// @param marketId Market identifier
/// @dev Called automatically on position change; can be called manually
function settleFunding(
    Account calldata account,
    MarketId marketId
) external;

/// @notice Settle funding for all positions
/// @param account Account identifier
function settleFundingAll(
    Account calldata account
) external;
```

### Events

```solidity
event Deposit(
    address indexed main,
    uint8 indexed subaccountId,
    address indexed token,
    uint128 amount
);

event Withdraw(
    address indexed main,
    uint8 indexed subaccountId,
    address indexed token,
    uint128 amount
);

event Transfer(
    address indexed main,
    uint8 fromSubaccount,
    uint8 toSubaccount,
    address indexed token,
    uint128 amount
);

event PositionOpened(
    address indexed main,
    uint8 indexed subaccountId,
    MarketId indexed marketId,
    PositionSide side,
    uint128 sizeX18,
    uint128 entryPxX18
);

event PositionClosed(
    address indexed main,
    uint8 indexed subaccountId,
    MarketId indexed marketId,
    uint128 sizeX18,
    int128 realizedPnlX18
);

event PositionModified(
    address indexed main,
    uint8 indexed subaccountId,
    MarketId indexed marketId,
    uint128 newSizeX18,
    uint128 newEntryPxX18
);

event Liquidation(
    address indexed liquidated,
    address indexed liquidator,
    MarketId indexed marketId,
    uint128 sizeX18,
    uint128 penaltyX18
);

event AdlExecution(
    address indexed bankruptAccount,
    address indexed counterparty,
    MarketId indexed marketId,
    uint128 sizeX18
);

event FundingSettled(
    address indexed main,
    uint8 indexed subaccountId,
    MarketId indexed marketId,
    int128 fundingPaidX18
);

event MarginModeChanged(
    address indexed main,
    uint8 indexed subaccountId,
    MarginMode mode
);
```

### Full Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILXVault {
    // Types (see Core Types section above)
    type MarketId is uint32;
    enum MarginMode { CROSS, ISOLATED }
    enum PositionSide { LONG, SHORT }

    struct Account { address main; uint8 subaccountId; }
    struct CollateralConfig { address token; uint64 weightX18; uint128 maxDeposit; bool enabled; }
    struct Position { MarketId marketId; PositionSide side; uint128 sizeX18; uint128 entryPxX18; uint128 unrealizedPnlX18; int128 accumulatedFundingX18; uint64 lastFundingTime; }
    struct MarginInfo { uint128 totalCollateralX18; uint128 usedMarginX18; uint128 freeMarginX18; uint128 marginRatioX18; uint128 maintenanceMarginX18; bool liquidatable; }
    struct Settlement { Account maker; Account taker; MarketId marketId; bool takerIsBuy; uint128 sizeX18; uint128 priceX18; uint128 makerFeeX18; uint128 takerFeeX18; }
    struct LiquidationResult { Account liquidated; Account liquidator; MarketId marketId; uint128 sizeX18; uint128 priceX18; uint128 penaltyX18; bool adlTriggered; }

    // Deposits/Withdrawals
    function deposit(address token, uint128 amount, uint8 subaccountId) external;
    function withdraw(address token, uint128 amount, uint8 subaccountId) external;
    function transfer(address token, uint128 amount, uint8 fromSubaccount, uint8 toSubaccount) external;

    // Balance/Position Queries
    function getBalance(Account calldata account, address token) external view returns (uint128);
    function getBalances(Account calldata account) external view returns (address[] memory, uint128[] memory);
    function getPosition(Account calldata account, MarketId marketId) external view returns (Position memory);
    function getPositions(Account calldata account) external view returns (Position[] memory);

    // Margin Queries
    function getMargin(Account calldata account) external view returns (MarginInfo memory);
    function checkMargin(Account calldata account, MarketId marketId, uint128 sizeX18, uint64 leverageX18) external view returns (bool, uint128);
    function setMarginMode(uint8 subaccountId, MarginMode mode) external;
    function getMarginMode(Account calldata account) external view returns (MarginMode);

    // Settlement (LXBook only)
    function settleTrade(Settlement calldata settlement) external returns (bool);
    function settleTradesBatch(Settlement[] calldata settlements) external returns (bool[] memory);
    function validateMargin(Account calldata account, MarketId marketId, uint128 sizeX18, bool isBuy) external view returns (bool, string memory);

    // Liquidation
    function isLiquidatable(Account calldata account) external view returns (bool, uint128);
    function liquidate(Account calldata account, MarketId marketId, uint128 sizeX18) external returns (LiquidationResult memory);
    function getInsuranceFundBalance() external view returns (uint128);
    function getAdlRank(Account calldata account, MarketId marketId) external view returns (uint64);

    // Funding
    function getFundingRate(MarketId marketId) external view returns (int128, uint64);
    function getAccumulatedFunding(Account calldata account, MarketId marketId) external view returns (int128);
    function settleFunding(Account calldata account, MarketId marketId) external;
    function settleFundingAll(Account calldata account) external;

    // Collateral Admin
    function setCollateralConfig(CollateralConfig calldata config) external;
    function getCollateralConfig(address token) external view returns (CollateralConfig memory);
    function getSupportedCollaterals() external view returns (address[] memory);
}
```

## Rationale

### Subaccount Model

The subaccount model enables:
1. **Risk Isolation**: Different strategies in separate subaccounts
2. **Portfolio Margining**: Cross-margin within subaccount
3. **Gas Efficiency**: Single main account manages all subaccounts

### Settlement Interface

LXBook calls `settleTrade()` atomically after matching:
1. Validates margin for both parties
2. Updates positions (open/increase/decrease/close)
3. Collects fees to fee recipient
4. Emits events for indexers

This keeps LXBook as pure matching logic while LXVault handles all custody.

### ADL Mechanism

Auto-deleveraging ensures socialized losses when insurance fund depletes:
1. Rank counterparties by (PnL * Leverage)
2. Deleverage highest-ranked first
3. Counterparty position reduced at bankruptcy price
4. No additional loss to counterparty (fair price)

### Funding Rate Design

Funding rates anchor perpetual prices to spot:
- Positive rate (perp > spot): Longs pay shorts
- Negative rate (perp < spot): Shorts pay longs
- Settled hourly to minimize tracking error
- Capped to prevent excessive payments

## Security Considerations

### Access Control

| Function | Access |
|----------|--------|
| `deposit`, `withdraw`, `transfer` | Account owner only |
| `settleTrade`, `settleTradesBatch` | LXBook precompile only |
| `liquidate` | Anyone (liquidator receives reward) |
| `executeAdl` | System only (triggered by liquidation engine) |
| `setCollateralConfig` | Governance only |

### Reentrancy Protection

All state-changing functions follow checks-effects-interactions pattern:
1. Validate inputs and authorization
2. Update internal state
3. External calls (token transfers) last

### Oracle Manipulation

Mark price for margin calculations uses:
1. LXFeed oracle price (primary)
2. TWAP from LXBook orderbook (fallback)
3. Circuit breakers on extreme deviations

### Withdrawal Restrictions

Withdrawals blocked when:
1. Would cause margin ratio < maintenance margin
2. Account is liquidatable
3. Position has unsettled funding

## Test Cases

```solidity
function testDeposit() public {
    usdc.approve(address(lxvault), 10000e6);

    ILXVault.Account memory account = ILXVault.Account({
        main: address(this),
        subaccountId: 0
    });

    lxvault.deposit(address(usdc), 10000e6, 0);

    assertEq(lxvault.getBalance(account, address(usdc)), 10000e6);
}

function testMarginCalculation() public {
    // Deposit 10,000 USDC
    lxvault.deposit(address(usdc), 10000e6, 0);

    ILXVault.Account memory account = ILXVault.Account({
        main: address(this),
        subaccountId: 0
    });

    // Check margin for 1 ETH position at 10x leverage
    (bool canOpen, uint128 required) = lxvault.checkMargin(
        account,
        ethUsdcMarket,
        1e18,          // 1 ETH
        10e18          // 10x leverage
    );

    assertTrue(canOpen);
    assertEq(required, 200e18); // $2000 ETH / 10x = $200 margin
}

function testLiquidation() public {
    // Setup: Account with underwater position
    ILXVault.Account memory account = ILXVault.Account({
        main: trader,
        subaccountId: 0
    });

    // Simulate price drop causing liquidation
    (bool liquidatable, uint128 shortfall) = lxvault.isLiquidatable(account);
    assertTrue(liquidatable);

    // Execute liquidation
    ILXVault.LiquidationResult memory result = lxvault.liquidate(
        account,
        ethUsdcMarket,
        0 // full position
    );

    assertTrue(result.sizeX18 > 0);
    assertTrue(result.penaltyX18 > 0);
}

function testFundingSettlement() public {
    ILXVault.Account memory account = ILXVault.Account({
        main: address(this),
        subaccountId: 0
    });

    // Check accumulated funding
    int128 funding = lxvault.getAccumulatedFunding(account, ethUsdcMarket);

    // Settle funding
    uint256 balanceBefore = lxvault.getBalance(account, address(usdc));
    lxvault.settleFunding(account, ethUsdcMarket);
    uint256 balanceAfter = lxvault.getBalance(account, address(usdc));

    // Balance changed by funding amount
    if (funding > 0) {
        assertGt(balanceAfter, balanceBefore);
    } else if (funding < 0) {
        assertLt(balanceAfter, balanceBefore);
    }
}

function testSubaccountIsolation() public {
    // Deposit to subaccount 1
    lxvault.deposit(address(usdc), 5000e6, 1);

    // Deposit to subaccount 2
    lxvault.deposit(address(usdc), 5000e6, 2);

    ILXVault.Account memory sub1 = ILXVault.Account({
        main: address(this),
        subaccountId: 1
    });

    ILXVault.Account memory sub2 = ILXVault.Account({
        main: address(this),
        subaccountId: 2
    });

    // Balances are isolated
    assertEq(lxvault.getBalance(sub1, address(usdc)), 5000e6);
    assertEq(lxvault.getBalance(sub2, address(usdc)), 5000e6);

    // Positions in sub1 don't affect sub2 margin
}
```

## Related LPs

- **LP-9010**: LXPool - v4 PoolManager-Compatible AMM Core
- **LP-9015**: Precompile Registry - LP-Aligned Address Scheme
- **LP-9020**: LXBook - Permissionless Order Book Precompile
- **LP-9040**: LXFeed - Price Feed Aggregator

## Implementation Status

- [ ] Go precompile implementation
- [ ] Solidity interface
- [ ] TypeScript SDK bindings
- [ ] Integration tests with LXBook

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
