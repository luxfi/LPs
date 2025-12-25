---
lp: 9109
title: Compound Lending Protocol Standard
description: Compound V3 (Comet) lending protocol integration for Lux Network providing overcollateralized loans, flash loans, and configurable interest rate models
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-12-14
requires: 3020
tags: [defi, lending, compound]
order: 9109
---

## Abstract

This LP specifies the Compound Protocol integration for the Lux Network, providing a full-featured decentralized lending solution. The implementation uses Compound V3 (Comet) architecture featuring single-asset lending pools, flash loans, configurable interest rate models, and liquidation mechanisms. This standard enables overcollateralized borrowing and lending across supported assets on Lux Mainnet (Chain ID 96369).

Note: Compound V3 uses BUSL-1.1 license (Business Source License) which converts to GPL v2.0+ on 2025-12-31. AAVE V3 (BUSL-1.1, no near-term conversion) remains excluded from the standard library.

## Motivation

### License Considerations

| Protocol | License | Status | Notes |
|----------|---------|--------|-------|
| AAVE V3 | BUSL-1.1 | **Excluded** | No imminent license conversion |
| Compound V2 | MIT | **Included** | Fully permissive (legacy) |
| Compound V3 | BUSL-1.1 -> GPL | **Included** | Converts to GPL 2025-12-31 |

Compound V3 (Comet) provides the most gas-efficient lending architecture available with impending open-source license conversion, making it the optimal choice for Lux Network's canonical lending protocol.

### Technical Requirements

1. **Overcollateralized Lending**: Support collateral deposits and borrowing against locked assets
2. **Flash Loans**: Enable atomic uncollateralized borrowing for arbitrage, liquidations, and refinancing
3. **Interest Rate Models**: Implement jump rate models with configurable parameters
4. **Liquidations**: Protocol-managed liquidation with discount mechanisms
5. **Multi-Asset Support**: Native tokens, wrapped assets, and stablecoins
6. **Cross-Chain Compatibility**: Bridge integration via Warp messaging

## Specification

### Core Architecture

Compound V3 (Comet) uses a monolithic contract design optimized for gas efficiency:

```solidity
lib/compound/
├── contracts/
│   ├── Comet.sol                    # Main lending pool contract
│   ├── CometCore.sol                # Core lending logic
│   ├── CometConfiguration.sol       # Configuration management
│   ├── CometStorage.sol             # Storage layout
│   ├── CometMath.sol                # Math utilities
│   ├── CometExt.sol                 # Extension delegate
│   ├── CometFactory.sol             # Pool deployment factory
│   ├── CometRewards.sol             # Reward distribution
│   ├── Configurator.sol             # Parameter configuration
│   ├── pricefeeds/                  # Oracle integrations
│   │   ├── ScalingPriceFeed.sol
│   │   ├── WstETHPriceFeed.sol
│   │   └── MultiplicativePriceFeed.sol
│   ├── liquidator/                  # Liquidation bots
│   │   └── OnChainLiquidator.sol
│   └── bulkers/                     # Batch operations
│       ├── BaseBulker.sol
│       └── MainnetBulker.sol
```

### Key Contracts

#### Comet (Main Pool)

The primary lending pool contract implementing single-asset lending:

```solidity
interface IComet {
    // Supply operations
    function supply(address asset, uint amount) external;
    function supplyTo(address dst, address asset, uint amount) external;
    function supplyFrom(address from, address dst, address asset, uint amount) external;

    // Withdraw operations
    function withdraw(address asset, uint amount) external;
    function withdrawTo(address to, address asset, uint amount) external;
    function withdrawFrom(address src, address to, address asset, uint amount) external;

    // Borrow operations (implicit via withdraw when balance negative)
    function borrowBalanceOf(address account) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);

    // Collateral management
    function getAssetInfo(uint8 i) external view returns (AssetInfo memory);
    function getAssetInfoByAddress(address asset) external view returns (AssetInfo memory);
    function isBorrowCollateralized(address account) external view returns (bool);
    function isLiquidatable(address account) external view returns (bool);

    // Interest rates
    function getSupplyRate(uint utilization) external view returns (uint64);
    function getBorrowRate(uint utilization) external view returns (uint64);
    function getUtilization() external view returns (uint);

    // Liquidations
    function absorb(address absorber, address[] calldata accounts) external;
    function buyCollateral(address asset, uint minAmount, uint baseAmount, address recipient) external;

    // Admin
    function pause(bool supplyPaused, bool transferPaused, bool withdrawPaused, bool absorbPaused, bool buyPaused) external;
}
```solidity

#### CometRewards

Manages reward token distribution for suppliers and borrowers:

```solidity
interface ICometRewards {
    function setRewardConfig(address comet, address token) external;
    function setRewardConfigWithMultiplier(address comet, address token, uint256 multiplier) external;
    function claim(address comet, address src, bool shouldAccrue) external;
    function claimTo(address comet, address src, address to, bool shouldAccrue) external;
    function getRewardOwed(address comet, address account) external returns (RewardOwed memory);
}
```

### Interest Rate Model

Compound V3 implements a jump rate model with configurable parameters:

```solidity
// Interest rate calculation
// When utilization <= kink:
//   rate = baseRate + utilizationRate * slopeLow
// When utilization > kink:
//   rate = baseRate + (kink * slopeLow) + ((utilization - kink) * slopeHigh)

struct InterestRateConfig {
    uint64 supplyKink;                         // Utilization kink point (e.g., 80%)
    uint64 supplyPerSecondInterestRateSlopeLow;  // Rate below kink
    uint64 supplyPerSecondInterestRateSlopeHigh; // Rate above kink
    uint64 supplyPerSecondInterestRateBase;      // Base rate
    uint64 borrowKink;
    uint64 borrowPerSecondInterestRateSlopeLow;
    uint64 borrowPerSecondInterestRateSlopeHigh;
    uint64 borrowPerSecondInterestRateBase;
}
```solidity

#### Default Parameters (Recommended)

| Parameter | Supply | Borrow |
|-----------|--------|--------|
| Base Rate | 0% | 1% |
| Kink | 80% | 80% |
| Slope Low | 2% | 4% |
| Slope High | 100% | 300% |

### Supported Markets (Lux Mainnet)

| Asset | Symbol | Decimals | Role | Collateral Factor |
|-------|--------|----------|------|-------------------|
| LUX | LUX | 18 | Base + Collateral | 75% |
| Wrapped ETH | WETH | 18 | Collateral | 82% |
| Wrapped BTC | WBTC | 8 | Collateral | 80% |
| USD Coin | USDC | 6 | Base Asset | 90% |
| Tether USD | USDT | 6 | Base Asset | 85% |
| Zoo Token | ZOO | 18 | Collateral | 65% |

### Collateral Factors

Each asset has three collateral-related factors:

```solidity
struct AssetInfo {
    uint8 offset;                      // Asset index
    address asset;                     // Token address
    address priceFeed;                 // Chainlink-compatible oracle
    uint64 scale;                      // 10^decimals
    uint64 borrowCollateralFactor;     // Max borrow power (e.g., 0.75e18 = 75%)
    uint64 liquidateCollateralFactor;  // Liquidation threshold (e.g., 0.80e18)
    uint64 liquidationFactor;          // Liquidation penalty factor
    uint128 supplyCap;                 // Maximum supply allowed
}
```

### Flash Loans

Compound V3 supports flash loans through the supply/withdraw pattern within a single transaction:

```solidity
contract FlashLoanReceiver {
    IComet public comet;

    function executeFlashLoan(uint256 amount) external {
        // Borrow
        comet.withdraw(comet.baseToken(), amount);

        // Use funds (arbitrage, liquidation, etc.)
        // ...

        // Repay
        IERC20(comet.baseToken()).approve(address(comet), amount);
        comet.supply(comet.baseToken(), amount);
    }
}
```solidity

### Liquidation Mechanism

Liquidations in Comet use an absorption model:

1. **Absorption**: Protocol absorbs underwater positions
2. **Collateral Auction**: Absorbed collateral sold at discount
3. **Reserve Protection**: Bad debt absorbed by protocol reserves

```solidity
// Check if account is liquidatable
function isLiquidatable(address account) external view returns (bool);

// Absorb underwater accounts (anyone can call)
function absorb(address absorber, address[] calldata accounts) external;

// Buy collateral at discount
function buyCollateral(
    address asset,      // Collateral to buy
    uint minAmount,     // Minimum collateral to receive
    uint baseAmount,    // Base token to pay
    address recipient   // Where to send collateral
) external;
```

### Price Feeds

Comet requires Chainlink-compatible price feeds with 8 decimals:

```solidity
interface IPriceFeed {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}
```solidity

Custom price feed adapters available:
- `ScalingPriceFeed`: Decimal conversion
- `WstETHPriceFeed`: Wrapped stETH pricing
- `MultiplicativePriceFeed`: Synthetic asset pricing

## Rationale

### Why Compound V3 Over V2

1. **Gas Efficiency**: 30-50% lower gas costs
2. **Single Asset Design**: Cleaner risk isolation
3. **Better Capital Efficiency**: Improved collateral utilization
4. **Flash Loan Native**: Built-in support without external contracts
5. **License Path**: BUSL -> GPL conversion enables long-term usage

### Design Decisions

1. **Monolithic Contract**: Single contract reduces external calls and gas
2. **Immutable Asset Config**: Gas optimization via packed immutables
3. **Scaled Integers**: All math uses fixed-point with explicit scales
4. **Reentrancy Guards**: All external entry points protected

## Backwards Compatibility

This standard introduces new contracts without modifying existing protocols. Migration from Compound V2-style implementations requires:

1. Position withdrawal from legacy pools
2. Re-supply to Comet pools
3. Optional: Use Bulker contracts for atomic migration

## Test Cases

### Supply and Borrow Test

```solidity
function testSupplyAndBorrow() public {
    // Supply collateral
    weth.approve(address(comet), 10 ether);
    comet.supply(address(weth), 10 ether);

    // Borrow base asset
    comet.withdraw(address(usdc), 5000e6);

    // Verify balances
    assertGt(comet.borrowBalanceOf(address(this)), 0);
    assertEq(usdc.balanceOf(address(this)), 5000e6);
}
```solidity

### Liquidation Test

```solidity
function testLiquidation() public {
    // Setup underwater position
    setupUnderwaterPosition();

    // Verify liquidatable
    assertTrue(comet.isLiquidatable(borrower));

    // Absorb position
    address[] memory accounts = new address[](1);
    accounts[0] = borrower;
    comet.absorb(address(this), accounts);

    // Buy discounted collateral
    comet.buyCollateral(address(weth), minWeth, baseAmount, address(this));
}
```

### Interest Accrual Test

```solidity
function testInterestAccrual() public {
    uint256 initialBalance = comet.balanceOf(supplier);

    // Advance time
    vm.warp(block.timestamp + 365 days);

    // Accrue interest
    comet.accrueAccount(supplier);

    uint256 finalBalance = comet.balanceOf(supplier);
    assertGt(finalBalance, initialBalance);
}
```bash

## Reference Implementation

### Repository Structure

**Location**: `/Users/z/work/lux/standard/lib/compound/`

**Key Files**:
- `contracts/Comet.sol` - Main lending pool (1,378 lines)
- `contracts/CometCore.sol` - Core logic (127 lines)
- `contracts/CometRewards.sol` - Reward distribution (233 lines)
- `contracts/CometFactory.sol` - Pool deployment
- `contracts/Configurator.sol` - Parameter management

### Deployment

```bash
cd /Users/z/work/lux/standard

# Build
forge build

# Deploy to Lux Mainnet
forge script script/DeployCompound.s.sol:DeployCompound \
  --rpc-url https://api.lux.network/ext/bc/C/rpc \
  --broadcast \
  --verify
```

### Configuration Example

```solidity
CometConfiguration.Configuration memory config = CometConfiguration.Configuration({
    governor: governorAddress,
    pauseGuardian: guardianAddress,
    baseToken: USDC,
    baseTokenPriceFeed: USDC_PRICE_FEED,
    extensionDelegate: extensionAddress,
    supplyKink: 0.8e18,                    // 80%
    supplyPerYearInterestRateSlopeLow: 0.02e18,   // 2%
    supplyPerYearInterestRateSlopeHigh: 1e18,     // 100%
    supplyPerYearInterestRateBase: 0,
    borrowKink: 0.8e18,
    borrowPerYearInterestRateSlopeLow: 0.04e18,
    borrowPerYearInterestRateSlopeHigh: 3e18,
    borrowPerYearInterestRateBase: 0.01e18,
    storeFrontPriceFactor: 0.5e18,
    trackingIndexScale: 1e15,
    baseTrackingSupplySpeed: 0,
    baseTrackingBorrowSpeed: 0,
    baseMinForRewards: 1e6,
    baseBorrowMin: 100e6,
    targetReserves: 1000000e6,
    assetConfigs: assetConfigs
});
```solidity

## Security Considerations

### Smart Contract Risks

1. **Oracle Manipulation**: Use time-weighted or decentralized oracles
2. **Flash Loan Attacks**: Liquidation timing can be exploited
3. **Admin Key Risk**: Governor controls all parameters
4. **Reentrancy**: Protected but external calls still risky

### Economic Risks

1. **Bank Run**: Mass withdrawals during market stress
2. **Bad Debt**: Under-collateralized positions may exceed reserves
3. **Interest Rate Manipulation**: Large positions can influence rates
4. **Collateral Price Volatility**: Rapid price drops cause cascade liquidations

### Mitigation Strategies

1. **Supply Caps**: Limit exposure per asset
2. **Borrow Caps**: Implicit via supply caps and collateral factors
3. **Reserve Buffers**: Protocol reserves absorb bad debt
4. **Pause Functionality**: Emergency circuit breakers
5. **Governance Timelock**: Delayed parameter changes

### Audit Status

Compound V3 has been audited by:
- OpenZeppelin
- ChainSecurity
- Trail of Bits

## Economic Impact

### Gas Costs

| Operation | Gas (estimated) |
|-----------|-----------------|
| Supply | ~80,000 |
| Withdraw | ~90,000 |
| Borrow | ~100,000 |
| Repay | ~85,000 |
| Liquidate | ~200,000 |

### Fee Structure

- **No Protocol Fee**: Compound V3 does not charge protocol fees
- **Interest Spread**: Borrow rate > Supply rate (spread to reserves)
- **Liquidation Discount**: Configurable storefront price factor

## Governance Integration

### Optional COMP Token Mechanics

For networks wanting governance token integration:

```solidity
// Reward configuration
cometRewards.setRewardConfig(cometAddress, luxTokenAddress);

// Claim rewards
cometRewards.claim(cometAddress, accountAddress, true);
```

For Lux Network, consider:
- LUX token as reward token
- Or: No reward token (pure lending protocol)

## Open Questions

1. **Initial Asset List**: Which assets to support at launch?
2. **Parameter Governance**: DAO-controlled or multisig?
3. **Oracle Strategy**: Chainlink, Band, or custom?
4. **Cross-Chain**: Bridge lending positions via Warp?

## License

The Compound V3 (Comet) implementation uses BUSL-1.1 which converts to GPL v2.0+ on 2025-12-31.

This LP specification is released under CC0.

## References

- [Compound V3 Documentation](https://docs.compound.finance/)
- [Compound V3 GitHub](https://github.com/compound-finance/comet)
- [LP-2000](./lp-1200-c-chain-evm-specification.md)
- [Compound V3 Audits]()

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
