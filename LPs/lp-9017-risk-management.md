---
lp: 9017
title: Risk Management Framework
description: Comprehensive risk management for DeFi protocols including position limits, flash loan protection, and slippage controls
author: Lux Core Team
status: Superseded
tags: [dex, trading]
type: Standards Track
category: Core
created: 2025-01-15
requires: [9010, 9011, 9012, 9016]
order: 17
---

# LP-9017: Risk Management Framework

## Abstract

This LP defines a production-grade risk management framework for Lux DeFi infrastructure, covering position limits, flash loan protection, slippage controls, concentration limits, and automated risk scoring. Designed to protect protocols handling billions in TVL from manipulation and systemic risks.

## Motivation

Sophisticated risk management is essential for:
- Flash loan attack prevention
- Price manipulation protection
- Whale concentration limits
- Systemic risk monitoring
- Regulatory compliance

## Specification

### 1. Risk Manager Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRiskManager {
    enum RiskLevel {
        LOW,        // Normal operations
        MEDIUM,     // Enhanced monitoring
        HIGH,       // Restricted operations
        CRITICAL    // Emergency mode
    }

    struct RiskLimits {
        uint256 maxPositionSize;        // Per-user max position
        uint256 maxDailyVolume;         // Per-user daily volume
        uint256 maxSingleTrade;         // Single trade limit
        uint256 maxSlippageBps;         // Max slippage in basis points
        uint256 maxConcentration;       // Max % of pool
        uint256 minLockPeriod;          // Minimum hold time
        uint256 cooldownPeriod;         // Between large trades
    }

    struct PositionRisk {
        uint256 size;
        uint256 leverage;
        uint256 collateralRatio;
        uint256 liquidationPrice;
        uint256 healthFactor;
        RiskLevel level;
    }

    struct PoolRisk {
        uint256 utilization;
        uint256 concentration;
        uint256 volatility;
        uint256 correlationRisk;
        RiskLevel level;
    }

    // Risk assessment
    function assessTradeRisk(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external view returns (RiskLevel level, string memory reason);

    function getPositionRisk(address user, bytes32 positionId) external view returns (PositionRisk memory);
    function getPoolRisk(address pool) external view returns (PoolRisk memory);

    // Limit management
    function getLimits(address user) external view returns (RiskLimits memory);
    function setGlobalLimits(RiskLimits calldata limits) external;
    function setUserLimits(address user, RiskLimits calldata limits) external;

    // Risk checks
    function checkFlashLoanRisk(address user, uint256 amount) external view returns (bool allowed);
    function checkSlippageRisk(uint256 expectedOut, uint256 actualOut) external view returns (bool acceptable);
    function checkConcentrationRisk(address user, address pool, uint256 amount) external view returns (bool allowed);

    // Events
    event RiskLimitExceeded(address indexed user, string limitType, uint256 value, uint256 limit);
    event RiskLevelChanged(address indexed entity, RiskLevel oldLevel, RiskLevel newLevel);
    event FlashLoanBlocked(address indexed user, uint256 amount, string reason);
}
```solidity

### 2. Flash Loan Protection

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract FlashLoanGuard {
    // Track block-level state
    mapping(address => uint256) private _lastInteractionBlock;
    mapping(address => uint256) private _sameTxCounter;

    // Flash loan detection thresholds
    uint256 public constant MAX_SAME_BLOCK_TXS = 3;
    uint256 public constant MIN_BLOCKS_BETWEEN_LARGE_TXS = 1;
    uint256 public constant FLASH_LOAN_THRESHOLD = 100_000e18; // $100k

    error FlashLoanDetected(string reason);
    error TooManyTransactionsInBlock();
    error InsufficientBlockGap();

    modifier flashLoanProtected(uint256 amount) {
        _checkFlashLoan(msg.sender, amount);
        _;
        _recordInteraction(msg.sender);
    }

    function _checkFlashLoan(address user, uint256 amount) internal view {
        // Check same-block transaction count
        if (_lastInteractionBlock[user] == block.number) {
            if (_sameTxCounter[user] >= MAX_SAME_BLOCK_TXS) {
                revert TooManyTransactionsInBlock();
            }
        }

        // Large transactions need block gap
        if (amount >= FLASH_LOAN_THRESHOLD) {
            if (block.number - _lastInteractionBlock[user] < MIN_BLOCKS_BETWEEN_LARGE_TXS) {
                revert InsufficientBlockGap();
            }
        }
    }

    function _recordInteraction(address user) internal {
        if (_lastInteractionBlock[user] == block.number) {
            _sameTxCounter[user]++;
        } else {
            _lastInteractionBlock[user] = block.number;
            _sameTxCounter[user] = 1;
        }
    }
}

library FlashLoanDetection {
    struct State {
        uint256 balanceBefore;
        uint256 balanceAfter;
        uint256 netFlow;
        bool isFlashLoan;
    }

    function detectFlashLoan(
        uint256 balanceStart,
        uint256 balanceEnd,
        uint256 threshold
    ) internal pure returns (bool) {
        // If balance returns to within threshold, likely flash loan
        if (balanceStart > 0) {
            uint256 diff = balanceEnd > balanceStart
                ? balanceEnd - balanceStart
                : balanceStart - balanceEnd;
            return (diff * 10000 / balanceStart) < threshold; // threshold in bps
        }
        return false;
    }
}
```

### 3. Slippage Protection

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library SlippageProtection {
    uint256 constant MAX_BPS = 10000;

    struct SlippageParams {
        uint256 maxSlippageBps;      // Maximum allowed slippage
        uint256 priceImpactBps;      // Expected price impact
        uint256 deadline;             // Transaction deadline
        bool useOraclePrice;         // Validate against oracle
    }

    error SlippageExceeded(uint256 expected, uint256 actual, uint256 maxSlippage);
    error PriceImpactTooHigh(uint256 impact, uint256 maxImpact);
    error DeadlineExpired(uint256 deadline, uint256 currentTime);
    error OraclePriceDeviation(uint256 executionPrice, uint256 oraclePrice);

    function validateSlippage(
        uint256 expectedAmount,
        uint256 actualAmount,
        uint256 maxSlippageBps
    ) internal pure {
        uint256 minAcceptable = expectedAmount * (MAX_BPS - maxSlippageBps) / MAX_BPS;
        if (actualAmount < minAcceptable) {
            revert SlippageExceeded(expectedAmount, actualAmount, maxSlippageBps);
        }
    }

    function calculatePriceImpact(
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 amountIn
    ) internal pure returns (uint256 impactBps) {
        uint256 spotPrice = reserveOut * 1e18 / reserveIn;
        uint256 newReserveIn = reserveIn + amountIn;
        uint256 amountOut = (reserveOut * amountIn) / newReserveIn;
        uint256 executionPrice = amountOut * 1e18 / amountIn;

        if (spotPrice > executionPrice) {
            impactBps = (spotPrice - executionPrice) * MAX_BPS / spotPrice;
        }
    }

    function validateDeadline(uint256 deadline) internal view {
        if (block.timestamp > deadline) {
            revert DeadlineExpired(deadline, block.timestamp);
        }
    }
}
```solidity

### 4. Position & Concentration Limits

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PositionLimiter {
    struct UserLimits {
        uint256 maxPosition;
        uint256 dailyVolumeUsed;
        uint256 dailyVolumeLimit;
        uint256 lastVolumeReset;
        uint256 largestTrade;
        uint256 tradeCount;
    }

    struct PoolLimits {
        uint256 maxConcentrationBps;  // Max % any single user can hold
        uint256 maxUtilizationBps;    // Max utilization rate
        uint256 minLiquidity;         // Minimum liquidity threshold
        uint256 maxSingleTradeBps;    // Max single trade as % of pool
    }

    mapping(address => UserLimits) public userLimits;
    mapping(address => PoolLimits) public poolLimits;
    mapping(address => mapping(address => uint256)) public userPoolBalance;

    uint256 public constant DAILY_RESET_PERIOD = 24 hours;
    uint256 public constant DEFAULT_MAX_CONCENTRATION = 500; // 5%
    uint256 public constant WHALE_THRESHOLD = 1_000_000e18; // $1M

    error PositionLimitExceeded(uint256 requested, uint256 limit);
    error DailyVolumeLimitExceeded(uint256 requested, uint256 remaining);
    error ConcentrationLimitExceeded(uint256 userShare, uint256 maxShare);
    error PoolUtilizationTooHigh(uint256 utilization, uint256 maxUtilization);

    function checkAndUpdatePosition(
        address user,
        address pool,
        uint256 amount,
        bool isDeposit
    ) external returns (bool) {
        _resetDailyVolumeIfNeeded(user);

        UserLimits storage limits = userLimits[user];

        // Check daily volume
        if (limits.dailyVolumeUsed + amount > limits.dailyVolumeLimit) {
            revert DailyVolumeLimitExceeded(amount, limits.dailyVolumeLimit - limits.dailyVolumeUsed);
        }

        // Check concentration
        PoolLimits storage pLimits = poolLimits[pool];
        uint256 poolTotal = _getPoolTotal(pool);
        uint256 newUserBalance = isDeposit
            ? userPoolBalance[user][pool] + amount
            : userPoolBalance[user][pool] - amount;

        uint256 userShareBps = (newUserBalance * 10000) / (poolTotal + (isDeposit ? amount : 0));
        if (userShareBps > pLimits.maxConcentrationBps) {
            revert ConcentrationLimitExceeded(userShareBps, pLimits.maxConcentrationBps);
        }

        // Update state
        limits.dailyVolumeUsed += amount;
        limits.tradeCount++;
        if (amount > limits.largestTrade) {
            limits.largestTrade = amount;
        }
        userPoolBalance[user][pool] = newUserBalance;

        return true;
    }

    function getEffectiveLimit(address user) public view returns (uint256) {
        UserLimits storage limits = userLimits[user];

        // Base limit
        uint256 limit = limits.maxPosition;

        // Risk-adjusted based on behavior
        if (limits.tradeCount < 10) {
            limit = limit * 50 / 100; // 50% for new users
        }

        return limit;
    }

    function _resetDailyVolumeIfNeeded(address user) internal {
        if (block.timestamp >= userLimits[user].lastVolumeReset + DAILY_RESET_PERIOD) {
            userLimits[user].dailyVolumeUsed = 0;
            userLimits[user].lastVolumeReset = block.timestamp;
        }
    }

    function _getPoolTotal(address pool) internal view returns (uint256) {
        // Implementation: Get total pool liquidity
        return 0;
    }
}
```

### 5. Risk Scoring System

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library RiskScoring {
    struct RiskFactors {
        uint256 accountAge;           // Days since first tx
        uint256 transactionCount;     // Historical tx count
        uint256 avgHoldTime;          // Average position hold time
        uint256 largestPosition;      // Largest historical position
        uint256 profitLossRatio;      // Win/loss ratio
        uint256 flashLoanUsage;       // Flash loan tx count
        uint256 liquidationCount;     // Times liquidated
        bool isWhitelisted;           // KYC/verified status
    }

    // Score from 0-1000 (higher = less risky)
    function calculateRiskScore(RiskFactors memory factors) internal pure returns (uint256) {
        uint256 score = 500; // Base score

        // Account age bonus (up to +150)
        if (factors.accountAge > 365) score += 150;
        else if (factors.accountAge > 90) score += 100;
        else if (factors.accountAge > 30) score += 50;
        else score -= 100; // New account penalty

        // Transaction history (+/- 100)
        if (factors.transactionCount > 1000) score += 100;
        else if (factors.transactionCount > 100) score += 50;
        else if (factors.transactionCount < 10) score -= 50;

        // Hold time behavior (+/- 100)
        if (factors.avgHoldTime > 30 days) score += 100;
        else if (factors.avgHoldTime < 1 hours) score -= 100; // Short-term trader

        // Flash loan usage (-200 max)
        if (factors.flashLoanUsage > 10) score -= 200;
        else if (factors.flashLoanUsage > 0) score -= 50;

        // Liquidation history (-150 max)
        if (factors.liquidationCount > 5) score -= 150;
        else if (factors.liquidationCount > 0) score -= factors.liquidationCount * 25;

        // Whitelist bonus (+150)
        if (factors.isWhitelisted) score += 150;

        // Clamp to valid range
        if (score > 1000) score = 1000;
        if (score < 0) score = 0;

        return score;
    }

    function getRiskTier(uint256 score) internal pure returns (uint256 tier) {
        if (score >= 800) return 1; // Low risk - full limits
        if (score >= 600) return 2; // Medium risk - 75% limits
        if (score >= 400) return 3; // High risk - 50% limits
        if (score >= 200) return 4; // Very high risk - 25% limits
        return 5; // Extreme risk - minimal limits
    }

    function getLimitMultiplier(uint256 tier) internal pure returns (uint256 bps) {
        if (tier == 1) return 10000; // 100%
        if (tier == 2) return 7500;  // 75%
        if (tier == 3) return 5000;  // 50%
        if (tier == 4) return 2500;  // 25%
        return 1000;                  // 10%
    }
}
```solidity

### 6. Sandwich Attack Protection

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract SandwichProtection {
    struct TxRecord {
        uint256 blockNumber;
        address user;
        uint256 amount;
        bool isBuy;
    }

    TxRecord[] private _recentTxs;
    uint256 private constant MAX_TX_HISTORY = 100;

    uint256 public constant SANDWICH_DETECTION_THRESHOLD = 500; // 5% profit threshold

    error PotentialSandwichDetected(address frontRunner, uint256 profit);

    modifier sandwichProtected(uint256 amount, bool isBuy) {
        _checkSandwich(amount, isBuy);
        _;
        _recordTx(msg.sender, amount, isBuy);
    }

    function _checkSandwich(uint256 amount, bool isBuy) internal view {
        // Check recent transactions for sandwich pattern
        for (uint i = _recentTxs.length; i > 0 && i > _recentTxs.length - 5; i--) {
            TxRecord memory record = _recentTxs[i - 1];

            // Same block, opposite direction, similar size
            if (record.blockNumber == block.number &&
                record.isBuy != isBuy &&
                record.user != msg.sender) {

                // Calculate potential sandwich profit
                uint256 sizeDiff = amount > record.amount
                    ? amount - record.amount
                    : record.amount - amount;

                if (sizeDiff * 10000 / amount < 1000) { // Within 10% size
                    revert PotentialSandwichDetected(record.user, 0);
                }
            }
        }
    }

    function _recordTx(address user, uint256 amount, bool isBuy) internal {
        if (_recentTxs.length >= MAX_TX_HISTORY) {
            // Shift array
            for (uint i = 0; i < _recentTxs.length - 1; i++) {
                _recentTxs[i] = _recentTxs[i + 1];
            }
            _recentTxs.pop();
        }

        _recentTxs.push(TxRecord({
            blockNumber: block.number,
            user: user,
            amount: amount,
            isBuy: isBuy
        }));
    }
}
```

### 7. Liquidity Risk Metrics

```solidity
interface ILiquidityRisk {
    struct LiquidityMetrics {
        uint256 depth1Percent;        // Liquidity to move price 1%
        uint256 depth5Percent;        // Liquidity to move price 5%
        uint256 spreadBps;            // Current spread
        uint256 volatility24h;        // 24h volatility
        uint256 imbalanceRatio;       // Buy/sell imbalance
        uint256 utilizationRate;      // Current utilization
    }

    function getLiquidityMetrics(address pool) external view returns (LiquidityMetrics memory);
    function getMinimumLiquidityThreshold(address pool) external view returns (uint256);
    function isLiquidityHealthy(address pool) external view returns (bool);
}
```solidity

## Risk Thresholds

| Risk Type | Low | Medium | High | Critical |
|-----------|-----|--------|------|----------|
| Position Size | < $100K | $100K-$1M | $1M-$10M | > $10M |
| Daily Volume | < $500K | $500K-$5M | $5M-$50M | > $50M |
| Slippage | < 50bps | 50-200bps | 200-500bps | > 500bps |
| Concentration | < 1% | 1-3% | 3-5% | > 5% |
| Flash Loan Size | < $1M | $1M-$10M | $10M-$100M | > $100M |

## Rationale

Risk management thresholds are derived from historical DeFi incident analysis. The tiered approach (Low/Medium/High/Critical) allows proportional responses—minor anomalies trigger alerts while critical breaches activate circuit breakers. Multi-source oracle validation prevents single points of failure.

## Backwards Compatibility

Risk management integrates with existing DEX and DeFi contracts through standardized interfaces. Monitoring is passive by default and doesn't affect protocol operation until thresholds are breached.

## Security Considerations

1. **Oracle manipulation** - Multi-source validation
2. **Governance attacks** - Timelock on limit changes
3. **Griefing** - Rate limiting on checks
4. **Front-running** - Commit-reveal for large trades
5. **Flash loan attacks** - Block-level restrictions

## Test Cases

1. Flash loan detection blocks same-block exploitation
2. Slippage protection reverts on excess slippage
3. Position limits enforce per-user caps
4. Concentration limits prevent pool manipulation
5. Risk scoring adjusts limits appropriately

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
