---
lp: 9018
title: Liquidity Mining & Incentives
description: Token incentive programs for bootstrapping and sustaining liquidity in Lux DeFi protocols
author: Lux Core Team
status: Draft
type: Standards Track
category: LRC
created: 2025-01-15
requires: [9010, 9011]
---

# LP-9018: Liquidity Mining & Incentives

## Abstract

This LP defines a comprehensive liquidity mining and incentive framework for Lux DeFi protocols, including reward distribution mechanisms, vesting schedules, boost multipliers, and anti-gaming protections. Designed to bootstrap and sustain billions in TVL.

## Motivation

Effective liquidity incentives are critical for:
- Bootstrapping new pools and protocols
- Maintaining deep liquidity for trading
- Aligning long-term LP interests
- Competitive positioning against other chains
- Sustainable tokenomics

## Specification

### 1. Liquidity Mining Controller

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILiquidityMining {
    struct Pool {
        address stakingToken;
        address rewardToken;
        uint256 rewardRate;           // Tokens per second
        uint256 totalStaked;
        uint256 rewardPerTokenStored;
        uint256 lastUpdateTime;
        uint256 periodFinish;
        uint256 boostMultiplier;      // Base boost (10000 = 1x)
    }

    struct UserStake {
        uint256 amount;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
        uint256 boostMultiplier;
        uint256 lockExpiry;
        uint256 stakingStartTime;
    }

    struct IncentiveProgram {
        bytes32 programId;
        uint256 totalRewards;
        uint256 distributedRewards;
        uint256 startTime;
        uint256 endTime;
        address[] eligiblePools;
        uint256[] poolWeights;
    }

    // Staking
    function stake(address pool, uint256 amount) external;
    function stakeWithLock(address pool, uint256 amount, uint256 lockDuration) external;
    function withdraw(address pool, uint256 amount) external;
    function exit(address pool) external;

    // Rewards
    function claimRewards(address pool) external returns (uint256);
    function claimAllRewards() external returns (uint256 totalRewards);
    function earned(address user, address pool) external view returns (uint256);

    // Boost
    function getBoostMultiplier(address user, address pool) external view returns (uint256);
    function applyBoost(address user, uint256 multiplier) external;

    // Events
    event Staked(address indexed user, address indexed pool, uint256 amount, uint256 lockExpiry);
    event Withdrawn(address indexed user, address indexed pool, uint256 amount);
    event RewardPaid(address indexed user, address indexed pool, uint256 reward);
    event BoostApplied(address indexed user, uint256 multiplier);
}
```

### 2. Multi-Token Reward System

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MultiRewardStaking {
    struct RewardToken {
        address token;
        uint256 rewardRate;
        uint256 rewardPerTokenStored;
        uint256 lastUpdateTime;
        uint256 periodFinish;
    }

    // Pool => Reward Token => RewardToken struct
    mapping(address => mapping(address => RewardToken)) public rewardTokens;
    mapping(address => address[]) public poolRewardTokens;

    // User => Pool => Reward Token => paid amount
    mapping(address => mapping(address => mapping(address => uint256))) public userRewardPerTokenPaid;
    mapping(address => mapping(address => mapping(address => uint256))) public rewards;

    function addRewardToken(address pool, address rewardToken, uint256 rewardRate, uint256 duration) external {
        RewardToken storage rt = rewardTokens[pool][rewardToken];
        require(rt.token == address(0), "Already added");

        rt.token = rewardToken;
        rt.rewardRate = rewardRate;
        rt.lastUpdateTime = block.timestamp;
        rt.periodFinish = block.timestamp + duration;
        rt.rewardPerTokenStored = 0;

        poolRewardTokens[pool].push(rewardToken);
    }

    function claimAllPoolRewards(address pool) external returns (address[] memory tokens, uint256[] memory amounts) {
        address[] storage rewardList = poolRewardTokens[pool];
        tokens = new address[](rewardList.length);
        amounts = new uint256[](rewardList.length);

        for (uint i = 0; i < rewardList.length; i++) {
            tokens[i] = rewardList[i];
            amounts[i] = _claimReward(msg.sender, pool, rewardList[i]);
        }
    }

    function _claimReward(address user, address pool, address rewardToken) internal returns (uint256) {
        _updateReward(pool, rewardToken, user);

        uint256 reward = rewards[user][pool][rewardToken];
        if (reward > 0) {
            rewards[user][pool][rewardToken] = 0;
            IERC20(rewardToken).transfer(user, reward);
        }
        return reward;
    }

    function _updateReward(address pool, address rewardToken, address user) internal {
        RewardToken storage rt = rewardTokens[pool][rewardToken];
        rt.rewardPerTokenStored = rewardPerToken(pool, rewardToken);
        rt.lastUpdateTime = lastTimeRewardApplicable(pool, rewardToken);

        if (user != address(0)) {
            rewards[user][pool][rewardToken] = earned(user, pool, rewardToken);
            userRewardPerTokenPaid[user][pool][rewardToken] = rt.rewardPerTokenStored;
        }
    }

    function rewardPerToken(address pool, address rewardToken) public view returns (uint256) {
        RewardToken storage rt = rewardTokens[pool][rewardToken];
        uint256 totalSupply = getTotalStaked(pool);

        if (totalSupply == 0) {
            return rt.rewardPerTokenStored;
        }

        return rt.rewardPerTokenStored + (
            (lastTimeRewardApplicable(pool, rewardToken) - rt.lastUpdateTime) *
            rt.rewardRate * 1e18 / totalSupply
        );
    }

    function earned(address user, address pool, address rewardToken) public view returns (uint256) {
        uint256 balance = getUserStaked(user, pool);
        return (balance * (rewardPerToken(pool, rewardToken) - userRewardPerTokenPaid[user][pool][rewardToken]) / 1e18)
            + rewards[user][pool][rewardToken];
    }

    function lastTimeRewardApplicable(address pool, address rewardToken) public view returns (uint256) {
        RewardToken storage rt = rewardTokens[pool][rewardToken];
        return block.timestamp < rt.periodFinish ? block.timestamp : rt.periodFinish;
    }

    function getTotalStaked(address pool) internal view returns (uint256) { return 0; }
    function getUserStaked(address user, address pool) internal view returns (uint256) { return 0; }
}
```

### 3. Boost & Multiplier System

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BoostController {
    uint256 constant BASE_MULTIPLIER = 10000; // 1x = 10000
    uint256 constant MAX_BOOST = 25000;       // 2.5x max boost

    struct BoostConfig {
        uint256 lockBoost;        // Boost from locking
        uint256 veTokenBoost;     // Boost from veToken balance
        uint256 nftBoost;         // Boost from NFT holdings
        uint256 loyaltyBoost;     // Boost from staking duration
        uint256 volumeBoost;      // Boost from trading volume
    }

    struct LockTier {
        uint256 duration;
        uint256 boostBps;
    }

    LockTier[] public lockTiers;
    mapping(address => BoostConfig) public userBoosts;

    constructor() {
        // Initialize lock tiers
        lockTiers.push(LockTier(0, 10000));           // No lock: 1x
        lockTiers.push(LockTier(30 days, 11000));     // 1 month: 1.1x
        lockTiers.push(LockTier(90 days, 12500));     // 3 months: 1.25x
        lockTiers.push(LockTier(180 days, 15000));    // 6 months: 1.5x
        lockTiers.push(LockTier(365 days, 20000));    // 1 year: 2x
        lockTiers.push(LockTier(730 days, 25000));    // 2 years: 2.5x
    }

    function calculateTotalBoost(address user) public view returns (uint256) {
        BoostConfig memory config = userBoosts[user];

        uint256 totalBoost = config.lockBoost;

        // Add veToken boost (up to +50%)
        totalBoost += (config.veTokenBoost * 5000 / BASE_MULTIPLIER);

        // Add NFT boost (up to +25%)
        totalBoost += (config.nftBoost * 2500 / BASE_MULTIPLIER);

        // Add loyalty boost (up to +20%)
        totalBoost += (config.loyaltyBoost * 2000 / BASE_MULTIPLIER);

        // Add volume boost (up to +15%)
        totalBoost += (config.volumeBoost * 1500 / BASE_MULTIPLIER);

        // Cap at max boost
        if (totalBoost > MAX_BOOST) {
            totalBoost = MAX_BOOST;
        }

        return totalBoost;
    }

    function getLockBoost(uint256 lockDuration) public view returns (uint256) {
        for (uint i = lockTiers.length; i > 0; i--) {
            if (lockDuration >= lockTiers[i - 1].duration) {
                return lockTiers[i - 1].boostBps;
            }
        }
        return BASE_MULTIPLIER;
    }

    function updateVeTokenBoost(address user, uint256 veBalance, uint256 totalVeSupply) external {
        if (totalVeSupply > 0) {
            userBoosts[user].veTokenBoost = (veBalance * BASE_MULTIPLIER) / totalVeSupply;
        }
    }

    function updateLoyaltyBoost(address user, uint256 stakingDuration) external {
        // 1% per month, up to 20%
        uint256 months = stakingDuration / 30 days;
        uint256 boost = months * 100; // 100 bps per month
        if (boost > 2000) boost = 2000;
        userBoosts[user].loyaltyBoost = boost;
    }
}
```

### 4. Vesting & Distribution

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RewardVesting {
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revocable;
        bool revoked;
    }

    mapping(address => VestingSchedule[]) public vestingSchedules;

    uint256 public constant IMMEDIATE_CLAIM_PERCENT = 2000; // 20% immediate
    uint256 public constant CLIFF_DURATION = 30 days;
    uint256 public constant VESTING_DURATION = 180 days;

    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external returns (uint256 scheduleId) {
        vestingSchedules[beneficiary].push(VestingSchedule({
            totalAmount: totalAmount,
            claimedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            revocable: false,
            revoked: false
        }));

        return vestingSchedules[beneficiary].length - 1;
    }

    function claimVested(uint256 scheduleId) external returns (uint256 claimable) {
        VestingSchedule storage schedule = vestingSchedules[msg.sender][scheduleId];
        require(!schedule.revoked, "Schedule revoked");

        claimable = vestedAmount(msg.sender, scheduleId) - schedule.claimedAmount;
        require(claimable > 0, "Nothing to claim");

        schedule.claimedAmount += claimable;
        // Transfer tokens...
    }

    function vestedAmount(address user, uint256 scheduleId) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[user][scheduleId];

        if (schedule.revoked) {
            return schedule.claimedAmount;
        }

        uint256 elapsed = block.timestamp - schedule.startTime;

        // Before cliff
        if (elapsed < schedule.cliffDuration) {
            return 0;
        }

        // After full vesting
        if (elapsed >= schedule.cliffDuration + schedule.vestingDuration) {
            return schedule.totalAmount;
        }

        // During vesting
        uint256 vestedDuration = elapsed - schedule.cliffDuration;
        return (schedule.totalAmount * vestedDuration) / schedule.vestingDuration;
    }

    function getClaimableNow(address user) external view returns (uint256 total) {
        for (uint i = 0; i < vestingSchedules[user].length; i++) {
            VestingSchedule storage schedule = vestingSchedules[user][i];
            if (!schedule.revoked) {
                total += vestedAmount(user, i) - schedule.claimedAmount;
            }
        }
    }
}
```

### 5. Anti-Gaming Protections

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract AntiGaming {
    struct UserHistory {
        uint256 totalStaked;
        uint256 stakingTime;
        uint256 withdrawCount;
        uint256 lastWithdraw;
        uint256 penaltyAccrued;
    }

    mapping(address => UserHistory) public userHistory;

    uint256 constant MIN_STAKE_DURATION = 1 days;
    uint256 constant EARLY_WITHDRAW_PENALTY = 500; // 5%
    uint256 constant FREQUENT_WITHDRAW_PENALTY = 200; // 2% per withdrawal
    uint256 constant WITHDRAWAL_COOLDOWN = 7 days;

    event PenaltyApplied(address indexed user, uint256 amount, string reason);

    function _applyWithdrawPenalty(address user, uint256 amount) internal returns (uint256 penalizedAmount) {
        UserHistory storage history = userHistory[user];
        uint256 penalty = 0;

        // Early withdrawal penalty
        if (block.timestamp - history.stakingTime < MIN_STAKE_DURATION) {
            penalty += EARLY_WITHDRAW_PENALTY;
            emit PenaltyApplied(user, amount * EARLY_WITHDRAW_PENALTY / 10000, "early_withdraw");
        }

        // Frequent withdrawal penalty
        if (block.timestamp - history.lastWithdraw < WITHDRAWAL_COOLDOWN) {
            penalty += FREQUENT_WITHDRAW_PENALTY;
            emit PenaltyApplied(user, amount * FREQUENT_WITHDRAW_PENALTY / 10000, "frequent_withdraw");
        }

        history.withdrawCount++;
        history.lastWithdraw = block.timestamp;
        history.penaltyAccrued += amount * penalty / 10000;

        penalizedAmount = amount - (amount * penalty / 10000);
    }

    function _detectSybil(address user) internal view returns (bool) {
        // Check for sybil patterns
        // - Many small stakes
        // - Coordinated timing
        // - Similar behavior patterns
        return false;
    }

    function _checkMercenaryLP(address user) internal view returns (bool) {
        UserHistory storage history = userHistory[user];

        // Mercenary LP detection
        // - High withdrawal frequency
        // - Short stake durations
        // - Large position changes around reward events
        return history.withdrawCount > 10 &&
               (history.penaltyAccrued * 100 / history.totalStaked) > 500; // >5% penalties
    }
}
```

### 6. Incentive Programs

```solidity
interface IIncentivePrograms {
    struct Campaign {
        bytes32 id;
        string name;
        uint256 totalBudget;
        uint256 spent;
        uint256 startTime;
        uint256 endTime;
        CampaignType campaignType;
        bytes params;
    }

    enum CampaignType {
        TRADING_VOLUME,      // Rewards based on trading volume
        LIQUIDITY_PROVISION, // Rewards for LP tokens
        REFERRAL,            // Referral rewards
        QUEST,               // Task completion rewards
        AIRDROP,             // One-time distribution
        RETROACTIVE          // Retroactive rewards
    }

    function createCampaign(
        string calldata name,
        uint256 budget,
        uint256 duration,
        CampaignType campaignType,
        bytes calldata params
    ) external returns (bytes32 campaignId);

    function claimCampaignRewards(bytes32 campaignId) external returns (uint256);
    function getCampaignStatus(bytes32 campaignId) external view returns (Campaign memory);
    function getUserCampaignRewards(address user, bytes32 campaignId) external view returns (uint256 earned, uint256 claimed);
}
```

## Reward Distribution Schedule

| Phase | Duration | Daily Emission | Total Allocation |
|-------|----------|----------------|------------------|
| Bootstrap | 30 days | 1,000,000 LUX | 30M LUX |
| Growth | 90 days | 500,000 LUX | 45M LUX |
| Maturity | 180 days | 250,000 LUX | 45M LUX |
| Sustainable | Ongoing | 100,000 LUX | Variable |

## Pool Weights

| Pool Type | Base Weight | Boost Eligible |
|-----------|-------------|----------------|
| LUX-USDC | 100 | Yes |
| LUX-ETH | 80 | Yes |
| Stablecoin | 50 | Yes |
| Long-tail | 30 | Limited |
| Single-sided | 20 | No |

## Security Considerations

1. **Sybil resistance** - Anti-sybil detection for airdrops
2. **Flash loan protection** - Snapshot-based eligibility
3. **Gaming prevention** - Penalties for mercenary LPs
4. **Governance control** - DAO controls emissions

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
