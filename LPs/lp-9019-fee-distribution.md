---
lp: 9019
title: Fee Distribution System
description: Protocol fee collection, distribution, and revenue sharing mechanisms for Lux DeFi
author: Lux Core Team
status: Draft
tags: [dex, trading]
type: Standards Track
category: Core
created: 2025-01-15
requires: [9010, 9011, 9012]
order: 19
---

# LP-9019: Fee Distribution System

## Abstract

This LP defines a comprehensive fee distribution system for Lux DeFi protocols, covering fee collection, treasury management, staker rewards, buybacks, and revenue sharing. Designed for transparency and sustainable protocol economics.

## Motivation

Robust fee distribution ensures:
- Sustainable protocol revenue
- Aligned incentives for stakeholders
- Transparent treasury management
- Community governance over funds
- Long-term protocol health

## Specification

### 1. Fee Collector Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFeeCollector {
    struct FeeConfig {
        uint256 tradingFeeBps;        // Trading fee (e.g., 30 = 0.30%)
        uint256 protocolShareBps;     // Protocol's share of fees
        uint256 lpShareBps;           // LP's share of fees
        uint256 stakerShareBps;       // Staker's share of fees
        uint256 treasuryShareBps;     // Treasury's share
        uint256 buybackShareBps;      // Buyback & burn share
    }

    struct CollectedFees {
        address token;
        uint256 totalCollected;
        uint256 distributedToLPs;
        uint256 distributedToStakers;
        uint256 sentToTreasury;
        uint256 usedForBuyback;
        uint256 pending;
    }

    // Fee collection
    function collectFee(address token, uint256 amount, bytes32 feeType) external returns (uint256 netAmount);
    function getCollectedFees(address token) external view returns (CollectedFees memory);

    // Distribution
    function distributeFees(address token) external;
    function distributeAllFees() external;
    function claimFeeRewards() external returns (uint256);

    // Configuration
    function setFeeConfig(FeeConfig calldata config) external;
    function getFeeConfig() external view returns (FeeConfig memory);

    // Events
    event FeeCollected(address indexed token, uint256 amount, bytes32 indexed feeType);
    event FeesDistributed(address indexed token, uint256 lpShare, uint256 stakerShare, uint256 treasuryShare);
    event BuybackExecuted(address indexed token, uint256 amountIn, uint256 amountBurned);
}
```

### 2. Fee Distribution Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract FeeDistributor is IFeeCollector, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    FeeConfig public feeConfig;

    // Fee accounting
    mapping(address => CollectedFees) public collectedFees;
    mapping(address => uint256) public pendingDistribution;

    // Beneficiaries
    address public treasury;
    address public stakingRewards;
    address public buybackEngine;

    // Accumulated rewards per token for stakers
    mapping(address => uint256) public rewardPerTokenStored;
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;
    mapping(address => mapping(address => uint256)) public rewards;

    uint256 public constant MIN_DISTRIBUTION_AMOUNT = 1000e18; // $1000 minimum
    uint256 public constant DISTRIBUTION_INTERVAL = 1 days;

    uint256 public lastDistributionTime;

    function initialize(
        address _treasury,
        address _stakingRewards,
        address _buybackEngine
    ) external initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();

        treasury = _treasury;
        stakingRewards = _stakingRewards;
        buybackEngine = _buybackEngine;

        // Default fee config (0.30% trading fee)
        feeConfig = FeeConfig({
            tradingFeeBps: 30,
            protocolShareBps: 5000,   // 50% protocol
            lpShareBps: 3000,         // 30% LPs
            stakerShareBps: 1000,     // 10% stakers
            treasuryShareBps: 500,    // 5% treasury
            buybackShareBps: 500      // 5% buyback
        });
    }

    function collectFee(
        address token,
        uint256 amount,
        bytes32 feeType
    ) external override returns (uint256 netAmount) {
        uint256 fee = (amount * feeConfig.tradingFeeBps) / 10000;
        netAmount = amount - fee;

        IERC20(token).transferFrom(msg.sender, address(this), fee);

        collectedFees[token].totalCollected += fee;
        collectedFees[token].pending += fee;

        emit FeeCollected(token, fee, feeType);
    }

    function distributeFees(address token) external override nonReentrant {
        CollectedFees storage fees = collectedFees[token];
        require(fees.pending >= MIN_DISTRIBUTION_AMOUNT, "Below minimum");
        require(block.timestamp >= lastDistributionTime + DISTRIBUTION_INTERVAL, "Too soon");

        uint256 toDistribute = fees.pending;
        fees.pending = 0;

        // Calculate shares
        uint256 lpShare = (toDistribute * feeConfig.lpShareBps) / 10000;
        uint256 stakerShare = (toDistribute * feeConfig.stakerShareBps) / 10000;
        uint256 treasuryShare = (toDistribute * feeConfig.treasuryShareBps) / 10000;
        uint256 buybackShare = (toDistribute * feeConfig.buybackShareBps) / 10000;

        // Distribute to LPs (sent to pool contract for pro-rata distribution)
        if (lpShare > 0) {
            // LP distribution handled by pool contracts
            fees.distributedToLPs += lpShare;
        }

        // Distribute to stakers
        if (stakerShare > 0) {
            IERC20(token).transfer(stakingRewards, stakerShare);
            fees.distributedToStakers += stakerShare;
        }

        // Send to treasury
        if (treasuryShare > 0) {
            IERC20(token).transfer(treasury, treasuryShare);
            fees.sentToTreasury += treasuryShare;
        }

        // Execute buyback
        if (buybackShare > 0) {
            IERC20(token).transfer(buybackEngine, buybackShare);
            fees.usedForBuyback += buybackShare;
        }

        lastDistributionTime = block.timestamp;

        emit FeesDistributed(token, lpShare, stakerShare, treasuryShare);
    }
}
```

### 3. Buyback & Burn Engine

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BuybackEngine {
    address public immutable LUX;
    address public immutable DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public dex;
    uint256 public totalBurned;
    uint256 public totalBuybackValue;

    struct BuybackConfig {
        uint256 minBuybackAmount;
        uint256 maxSlippageBps;
        uint256 buybackInterval;
        bool autoBuyback;
    }

    BuybackConfig public config;
    mapping(address => uint256) public pendingBuyback;
    uint256 public lastBuybackTime;

    event Buyback(address indexed token, uint256 amountIn, uint256 luxReceived);
    event Burn(uint256 amount, uint256 totalBurned);

    constructor(address _lux, address _dex) {
        LUX = _lux;
        dex = _dex;

        config = BuybackConfig({
            minBuybackAmount: 10000e18, // $10k minimum
            maxSlippageBps: 100,        // 1% max slippage
            buybackInterval: 1 hours,
            autoBuyback: true
        });
    }

    function executeBuyback(address token) external returns (uint256 luxReceived) {
        require(block.timestamp >= lastBuybackTime + config.buybackInterval, "Too soon");

        uint256 amount = pendingBuyback[token];
        require(amount >= config.minBuybackAmount, "Below minimum");

        pendingBuyback[token] = 0;

        // Approve DEX
        IERC20(token).approve(dex, amount);

        // Execute swap
        uint256 minOut = _getMinOutput(token, amount);
        luxReceived = IDEX(dex).swap(token, LUX, amount, minOut, address(this));

        totalBuybackValue += amount;

        emit Buyback(token, amount, luxReceived);

        // Burn received LUX
        _burn(luxReceived);
    }

    function _burn(uint256 amount) internal {
        IERC20(LUX).transfer(DEAD_ADDRESS, amount);
        totalBurned += amount;
        emit Burn(amount, totalBurned);
    }

    function _getMinOutput(address tokenIn, uint256 amountIn) internal view returns (uint256) {
        uint256 quote = IDEX(dex).quote(tokenIn, LUX, amountIn);
        return quote * (10000 - config.maxSlippageBps) / 10000;
    }

    function receiveFees(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        pendingBuyback[token] += amount;

        if (config.autoBuyback && pendingBuyback[token] >= config.minBuybackAmount) {
            executeBuyback(token);
        }
    }
}

interface IDEX {
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut, address to) external returns (uint256);
    function quote(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256);
}
```

### 4. Revenue Sharing for veToken Holders

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RevenueShare {
    address public immutable veLUX;
    address[] public rewardTokens;

    // Epoch-based distribution
    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        mapping(address => uint256) rewards; // token => amount
        uint256 totalVeSupply;
        bool finalized;
    }

    mapping(uint256 => Epoch) public epochs;
    uint256 public currentEpoch;
    uint256 public constant EPOCH_DURATION = 7 days;

    // User claims
    mapping(address => uint256) public lastClaimedEpoch;
    mapping(address => mapping(address => uint256)) public userClaimedRewards;

    event RevenueDeposited(uint256 indexed epoch, address indexed token, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed epoch, address[] tokens, uint256[] amounts);

    function depositRevenue(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        Epoch storage epoch = epochs[currentEpoch];
        epoch.rewards[token] += amount;

        emit RevenueDeposited(currentEpoch, token, amount);
    }

    function finalizeEpoch() external {
        Epoch storage epoch = epochs[currentEpoch];
        require(block.timestamp >= epoch.endTime, "Epoch not ended");
        require(!epoch.finalized, "Already finalized");

        epoch.totalVeSupply = IVeLUX(veLUX).totalSupply();
        epoch.finalized = true;

        // Start new epoch
        currentEpoch++;
        epochs[currentEpoch].startTime = block.timestamp;
        epochs[currentEpoch].endTime = block.timestamp + EPOCH_DURATION;
    }

    function claimRewards(uint256 epochId) external returns (address[] memory tokens, uint256[] memory amounts) {
        require(epochId < currentEpoch, "Epoch not finalized");
        require(epochId > lastClaimedEpoch[msg.sender], "Already claimed");

        Epoch storage epoch = epochs[epochId];
        require(epoch.finalized, "Not finalized");

        uint256 userBalance = IVeLUX(veLUX).balanceOfAt(msg.sender, epoch.endTime);
        require(userBalance > 0, "No balance");

        tokens = rewardTokens;
        amounts = new uint256[](tokens.length);

        for (uint i = 0; i < tokens.length; i++) {
            uint256 reward = (epoch.rewards[tokens[i]] * userBalance) / epoch.totalVeSupply;
            amounts[i] = reward;

            if (reward > 0) {
                IERC20(tokens[i]).transfer(msg.sender, reward);
                userClaimedRewards[msg.sender][tokens[i]] += reward;
            }
        }

        lastClaimedEpoch[msg.sender] = epochId;

        emit RewardsClaimed(msg.sender, epochId, tokens, amounts);
    }

    function getClaimableRewards(address user) external view returns (address[] memory tokens, uint256[] memory amounts) {
        tokens = rewardTokens;
        amounts = new uint256[](tokens.length);

        for (uint epochId = lastClaimedEpoch[user] + 1; epochId < currentEpoch; epochId++) {
            Epoch storage epoch = epochs[epochId];
            if (!epoch.finalized) continue;

            uint256 userBalance = IVeLUX(veLUX).balanceOfAt(user, epoch.endTime);
            if (userBalance == 0) continue;

            for (uint i = 0; i < tokens.length; i++) {
                amounts[i] += (epoch.rewards[tokens[i]] * userBalance) / epoch.totalVeSupply;
            }
        }
    }
}

interface IVeLUX {
    function totalSupply() external view returns (uint256);
    function balanceOfAt(address account, uint256 timestamp) external view returns (uint256);
}
```

### 5. Treasury Management

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Treasury {
    struct Allocation {
        uint256 operations;      // 40% - Team, infra, operations
        uint256 development;     // 30% - Protocol development
        uint256 insurance;       // 15% - Insurance fund
        uint256 grants;          // 10% - Community grants
        uint256 reserves;        // 5% - Strategic reserves
    }

    Allocation public allocation;
    address public governance;

    mapping(address => uint256) public tokenBalances;

    // Spending limits
    uint256 public dailySpendLimit;
    uint256 public spentToday;
    uint256 public lastSpendReset;

    event TreasuryDeposit(address indexed token, uint256 amount, string source);
    event TreasuryWithdraw(address indexed token, uint256 amount, address indexed recipient, string reason);
    event AllocationChanged(Allocation oldAllocation, Allocation newAllocation);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Not governance");
        _;
    }

    function deposit(address token, uint256 amount, string calldata source) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;
        emit TreasuryDeposit(token, amount, source);
    }

    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason
    ) external onlyGovernance {
        _resetDailyLimit();
        require(spentToday + amount <= dailySpendLimit, "Daily limit exceeded");

        require(tokenBalances[token] >= amount, "Insufficient balance");
        tokenBalances[token] -= amount;
        spentToday += amount;

        IERC20(token).transfer(recipient, amount);
        emit TreasuryWithdraw(token, amount, recipient, reason);
    }

    function getTreasuryValue() external view returns (uint256 totalUSD) {
        // Calculate total treasury value in USD
        // Implementation would query oracle for prices
    }

    function _resetDailyLimit() internal {
        if (block.timestamp >= lastSpendReset + 1 days) {
            spentToday = 0;
            lastSpendReset = block.timestamp;
        }
    }
}
```

### 6. Fee Transparency Dashboard

```solidity
interface IFeeAnalytics {
    struct FeeStats {
        uint256 totalFeesCollectedUSD;
        uint256 totalDistributedToLPs;
        uint256 totalDistributedToStakers;
        uint256 totalBurned;
        uint256 treasuryBalance;
    }

    struct PeriodStats {
        uint256 period;           // Unix timestamp start
        uint256 volume;
        uint256 feesGenerated;
        uint256 uniqueTraders;
        uint256 avgFeePerTrade;
    }

    function getOverallStats() external view returns (FeeStats memory);
    function getPeriodStats(uint256 startTime, uint256 endTime) external view returns (PeriodStats memory);
    function getTopFeeGenerators(uint256 count) external view returns (address[] memory pools, uint256[] memory fees);
    function getUserFeeContribution(address user) external view returns (uint256 totalFees, uint256 rewardsEarned);
}
```

## Fee Structure

| Fee Type | Amount | Distribution |
|----------|--------|--------------|
| Spot Trading | 0.30% | 30% LP, 50% Protocol, 10% Stakers, 10% Buyback |
| Perpetuals | 0.10% | 40% LP, 40% Protocol, 10% Stakers, 10% Insurance |
| Lending | Variable | 70% Lenders, 20% Protocol, 10% Insurance |
| Bridge | 0.05% | 50% Validators, 30% Protocol, 20% Insurance |
| NFT Market | 2.5% | 50% Creator, 30% Protocol, 20% Platform |

## Rationale

Fee distribution is designed to align incentives across all protocol participants. LP rewards encourage liquidity provision, protocol fees fund development, staker rewards secure the network, and insurance reserves protect users. Transparent on-chain distribution ensures verifiable fairness.

## Backwards Compatibility

Fee distribution mechanisms integrate with existing protocol contracts through standardized interfaces. Fee collection points are additive and don't modify core contract logic.

## Security Considerations

1. **Multi-sig treasury** - 3-of-5 for withdrawals
2. **Timelock** - 48hr delay on fee config changes
3. **Spending limits** - Daily caps on treasury spending
4. **Audit trail** - All distributions logged on-chain

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
