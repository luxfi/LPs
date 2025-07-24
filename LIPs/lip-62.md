---
lip: 62
title: Yield Farming Protocol Standard
description: Standard for implementing yield farming and liquidity mining protocols on Lux Network
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 20, 61
---

## Abstract

This LIP defines a standard for yield farming protocols on the Lux Network, enabling projects to incentivize liquidity provision and token staking with reward distributions. The standard covers staking mechanisms, reward calculations, boost multipliers, and multi-token rewards while ensuring fair and efficient distribution.

## Motivation

Yield farming is essential for:

1. **Liquidity Bootstrapping**: Incentivize early liquidity providers
2. **Token Distribution**: Fair and decentralized token allocation
3. **Protocol Growth**: Attract users and capital
4. **Composability**: Standard interfaces for aggregators
5. **Cross-Chain Farming**: Unified farming across Lux chains

## Specification

### Core Farming Interface

```solidity
interface ILuxFarm {
    // Events
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardPaid(address indexed user, address indexed token, uint256 amount);
    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);
    
    // Pool information
    struct PoolInfo {
        address lpToken;           // LP token or stakeable token
        uint256 allocPoint;        // Allocation points for reward distribution
        uint256 lastRewardBlock;   // Last block when rewards were calculated
        uint256 accRewardPerShare; // Accumulated rewards per share
        uint256 totalStaked;       // Total tokens staked in pool
        uint16 depositFeeBP;       // Deposit fee in basis points
        bool isActive;             // Pool status
    }
    
    // User information
    struct UserInfo {
        uint256 amount;           // Amount of tokens staked
        uint256 rewardDebt;       // Reward debt for proper distribution
        uint256 boostMultiplier;  // User's boost multiplier (100 = 1x)
        uint256 depositTime;      // Time of last deposit
    }
    
    // View functions
    function poolLength() external view returns (uint256);
    function poolInfo(uint256 pid) external view returns (PoolInfo memory);
    function userInfo(uint256 pid, address user) external view returns (UserInfo memory);
    function pendingReward(uint256 pid, address user) external view returns (uint256);
    function rewardToken() external view returns (address);
    function rewardPerBlock() external view returns (uint256);
    function totalAllocPoint() external view returns (uint256);
    
    // User functions
    function deposit(uint256 pid, uint256 amount) external;
    function withdraw(uint256 pid, uint256 amount) external;
    function emergencyWithdraw(uint256 pid) external;
    function harvest(uint256 pid) external;
    function harvestAll() external;
    
    // Admin functions
    function add(uint256 allocPoint, address lpToken, uint16 depositFeeBP, bool withUpdate) external;
    function set(uint256 pid, uint256 allocPoint, uint16 depositFeeBP, bool withUpdate) external;
    function updateRewardPerBlock(uint256 rewardPerBlock) external;
    function massUpdatePools() external;
}
```

### Multi-Reward Extension

```solidity
interface IMultiRewardFarm is ILuxFarm {
    struct RewardInfo {
        address token;
        uint256 rewardPerBlock;
        uint256 accRewardPerShare;
        uint256 lastRewardBlock;
        uint256 claimableAfter;    // Lock period for rewards
    }
    
    function rewardTokens(uint256 index) external view returns (RewardInfo memory);
    function rewardTokensLength() external view returns (uint256);
    function pendingRewards(uint256 pid, address user) external view returns (address[] memory tokens, uint256[] memory amounts);
    
    function addRewardToken(address token, uint256 rewardPerBlock, uint256 claimableAfter) external;
    function updateRewardToken(uint256 index, uint256 rewardPerBlock) external;
}
```

### Boost Mechanism

```solidity
interface IBoostableFarm is ILuxFarm {
    event BoostUpdated(address indexed user, uint256 indexed pid, uint256 oldBoost, uint256 newBoost);
    
    struct BoostInfo {
        address boostToken;        // Token used for boosting (e.g., veLUX)
        uint256 maxBoostMultiplier; // Maximum boost (e.g., 250 = 2.5x)
        uint256 boostThreshold;    // Minimum tokens for boost
    }
    
    function boostInfo() external view returns (BoostInfo memory);
    function getUserBoost(address user, uint256 pid) external view returns (uint256);
    function updateBoost(uint256 pid) external;
    
    // Calculate boost based on user's boost token balance
    function calculateBoost(address user) external view returns (uint256);
}
```

### Auto-Compounding Extension

```solidity
interface IAutoCompoundFarm is ILuxFarm {
    event Compound(uint256 indexed pid, uint256 amount, uint256 fee);
    
    struct CompoundInfo {
        uint256 compoundFee;      // Fee taken on compound (basis points)
        uint256 lastCompoundTime; // Last compound timestamp
        address compounder;       // Address that triggered compound
    }
    
    function compoundInfo(uint256 pid) external view returns (CompoundInfo memory);
    function compound(uint256 pid) external;
    function calculateCompoundReward(uint256 pid) external view returns (uint256);
}
```

### Time-Locked Farming

```solidity
interface ITimeLockFarm is ILuxFarm {
    struct LockInfo {
        uint256 amount;
        uint256 lockTime;
        uint256 unlockTime;
        uint256 multiplier;  // Reward multiplier for locking
    }
    
    function lockInfo(address user, uint256 pid) external view returns (LockInfo memory);
    function depositWithLock(uint256 pid, uint256 amount, uint256 lockDuration) external;
    function getLockMultiplier(uint256 lockDuration) external view returns (uint256);
    
    // Lock duration => multiplier mapping
    function lockMultipliers(uint256 duration) external view returns (uint256);
}
```

## Rationale

### Fair Distribution Model

The allocation point system ensures:
- Proportional reward distribution
- Easy adjustment of pool weights
- Support for multiple pools

### Boost Mechanism

Boosting rewards loyalty:
- Long-term stakers get higher rewards
- Reduces sell pressure
- Aligns incentives

### Emergency Functions

Emergency withdraw protects users:
- Forfeit rewards but recover principal
- Protection against contract issues
- User fund safety priority

## Backwards Compatibility

This standard is compatible with:
- Existing LP tokens (LRC-20)
- Standard staking interfaces
- Common farming patterns
- Yield aggregators

## Test Cases

### Basic Farming Operations

```solidity
contract FarmTest {
    ILuxFarm farm;
    IERC20 lpToken;
    
    function testDeposit() public {
        uint256 amount = 100 * 10**18;
        lpToken.approve(address(farm), amount);
        
        farm.deposit(0, amount);
        
        ILuxFarm.UserInfo memory info = farm.userInfo(0, address(this));
        assert(info.amount == amount);
    }
    
    function testHarvest() public {
        // Deposit first
        farm.deposit(0, 100 * 10**18);
        
        // Wait some blocks
        vm.roll(block.number + 100);
        
        uint256 pending = farm.pendingReward(0, address(this));
        assert(pending > 0);
        
        uint256 balanceBefore = rewardToken.balanceOf(address(this));
        farm.harvest(0);
        uint256 balanceAfter = rewardToken.balanceOf(address(this));
        
        assert(balanceAfter - balanceBefore >= pending);
    }
    
    function testEmergencyWithdraw() public {
        uint256 amount = 100 * 10**18;
        farm.deposit(0, amount);
        
        uint256 balanceBefore = lpToken.balanceOf(address(this));
        farm.emergencyWithdraw(0);
        uint256 balanceAfter = lpToken.balanceOf(address(this));
        
        assert(balanceAfter - balanceBefore == amount);
    }
}
```

### Boost Testing

```solidity
function testBoostMechanism() public {
    IBoostableFarm boostFarm = IBoostableFarm(address(farm));
    
    // Check boost without boost tokens
    uint256 boost1 = boostFarm.calculateBoost(address(this));
    assert(boost1 == 100); // 1x multiplier
    
    // Acquire boost tokens
    boostToken.mint(address(this), 1000 * 10**18);
    
    // Update boost
    boostFarm.updateBoost(0);
    
    uint256 boost2 = boostFarm.calculateBoost(address(this));
    assert(boost2 > 100); // Higher multiplier
}
```

## Reference Implementation

```solidity
contract LuxFarm is ILuxFarm, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    address public rewardToken;
    uint256 public rewardPerBlock;
    uint256 public totalAllocPoint;
    uint256 public startBlock;
    
    address public feeAddress;
    uint256 public constant MAX_DEPOSIT_FEE = 400; // 4%
    
    constructor(
        address _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock
    ) {
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
    }
    
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
                emit RewardPaid(msg.sender, rewardToken, pending);
            }
        }
        
        if (_amount > 0) {
            uint256 balanceBefore = IERC20(pool.lpToken).balanceOf(address(this));
            IERC20(pool.lpToken).safeTransferFrom(msg.sender, address(this), _amount);
            uint256 balanceAfter = IERC20(pool.lpToken).balanceOf(address(this));
            _amount = balanceAfter.sub(balanceBefore); // Handle transfer tax tokens
            
            if (pool.depositFeeBP > 0) {
                uint256 depositFee = _amount.mul(pool.depositFeeBP).div(10000);
                IERC20(pool.lpToken).safeTransfer(feeAddress, depositFee);
                _amount = _amount.sub(depositFee);
            }
            
            user.amount = user.amount.add(_amount);
            pool.totalStaked = pool.totalStaked.add(_amount);
            user.depositTime = block.timestamp;
        }
        
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        if (pool.totalStaked == 0 || pool.allocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = block.number.sub(pool.lastRewardBlock);
        uint256 reward = multiplier.mul(rewardPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        
        pool.accRewardPerShare = pool.accRewardPerShare.add(reward.mul(1e12).div(pool.totalStaked));
        pool.lastRewardBlock = block.number;
    }
    
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = IERC20(rewardToken).balanceOf(address(this));
        if (_amount > rewardBal) {
            IERC20(rewardToken).safeTransfer(_to, rewardBal);
        } else {
            IERC20(rewardToken).safeTransfer(_to, _amount);
        }
    }
}
```

## Security Considerations

### Reentrancy Protection

Use ReentrancyGuard for all state-changing functions:
```solidity
modifier nonReentrant() {
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
}
```

### Reward Calculation Precision

Use sufficient precision to avoid rounding errors:
```solidity
uint256 accRewardPerShare; // Multiplied by 1e12 for precision
```

### Pool Update Optimization

Implement lazy updates to save gas:
```solidity
if (block.number <= pool.lastRewardBlock) {
    return; // Already updated
}
```

### Emergency Recovery

Admin functions for token recovery:
```solidity
function recoverToken(address token, uint256 amount) external onlyOwner {
    require(token != address(lpToken), "Cannot recover LP tokens");
    IERC20(token).safeTransfer(owner(), amount);
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).