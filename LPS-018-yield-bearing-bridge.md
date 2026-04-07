---
lps: 018
title: Yield-Bearing Bridge Tokens
tags: [bridge, yield, erc4626, vault, strategy, lido, aave, eigenlayer, sharia, warp]
description: Yield-bearing bridged assets with ERC-4626 share accounting, 29 yield strategies, and Shariah compliance filtering
author: Lux Industries
status: Final
type: Standards Track
category: Bridge
created: 2026-03-03
requires:
  - lps-016 (OmnichainRouter)
  - lps-019 (Threshold MPC)
  - lps-003 (Cross-Chain Securities Bridge)
references:
  - lp-6332 (Teleport Bridge Architecture)
  - lp-3800 (Bridged Asset Standard)
  - lp-6022 (Warp Messaging 2.0)
---

# LPS-018: Yield-Bearing Bridge Tokens

## Abstract

Defines yield-bearing bridge tokens (yLETH, yLBTC, yLUSD, yLSOL) that earn yield on their underlying collateral while bridged. Users bridge ETH and receive yLETH, which accrues yield from the underlying ETH deployed into yield strategies on the source chain. The system uses ERC-4626-like share accounting with a virtual offset to prevent inflation attacks. Yield is reported cross-chain via Warp messaging. A ShariaFilter contract classifies yield strategies as Halal, Haram, Conditional, or UnderReview, enabling Shariah-compliant bridge usage.

## Motivation

Bridged assets are idle capital. When a user bridges 100 ETH from Ethereum to Lux, those 100 ETH sit locked in the bridge contract earning nothing. Meanwhile, the user holds a wrapped representation (LETH) that is a 1:1 claim on the locked collateral but generates no return.

Yield-bearing bridge tokens solve this by:
1. Deploying locked collateral into yield strategies on the source chain
2. Issuing share-based tokens on the destination chain that appreciate as yield accrues
3. Maintaining full redeemability -- users can always burn their shares and receive underlying + yield
4. Providing Shariah compliance classification so Muslim users can opt into only Halal strategies

## Specification

### 1. Token Registry

| Token | Underlying | Source Chain | Strategies |
|-------|-----------|-------------|------------|
| yLETH | ETH | Ethereum | Lido, Aave ETH, EigenLayer, Symbiotic, Karak |
| yLBTC | WBTC/tBTC | Ethereum/Bitcoin | Babylon, Karak, Symbiotic, Aave WBTC |
| yLUSD | USDC/USDT/DAI | Ethereum | Aave USDC, Compound USDC, Aave USDT, Compound USDT, Aave DAI, Compound DAI, MakerDAO DSR |
| yLSOL | SOL | Solana | Marinade, Jito, Sanctum, BlazeStake |

### 2. Share Accounting (ERC-4626-like)

Each yield-bearing token uses share-based accounting. Users deposit underlying assets and receive shares. Shares appreciate as yield accrues.

```solidity
uint256 public constant VIRTUAL_SHARES = 1e3;
uint256 public constant VIRTUAL_ASSETS = 1;

function totalAssets() public view returns (uint256) {
    return _totalDeposited + _totalYieldAccrued;
}

function convertToShares(uint256 assets) public view returns (uint256) {
    uint256 supply = totalSupply() + VIRTUAL_SHARES;
    uint256 assets_ = totalAssets() + VIRTUAL_ASSETS;
    return (assets * supply) / assets_;
}

function convertToAssets(uint256 shares) public view returns (uint256) {
    uint256 supply = totalSupply() + VIRTUAL_SHARES;
    uint256 assets_ = totalAssets() + VIRTUAL_ASSETS;
    return (shares * assets_) / supply;
}
```

The virtual offset (VIRTUAL_SHARES=1e3, VIRTUAL_ASSETS=1) prevents the first-depositor inflation attack where an attacker donates assets to manipulate the share price before other users deposit. With the offset, the initial exchange rate is ~1000 shares per asset, making donation attacks economically infeasible.

### 3. YieldBridgeVault (Source Chain)

The YieldBridgeVault is deployed on the source chain (e.g. Ethereum for yLETH). It receives locked collateral from the OmnichainRouter and deploys it into yield strategies.

```solidity
contract YieldBridgeVault is AccessControl {
    IERC20 public immutable UNDERLYING;
    address public immutable ROUTER;  // OmnichainRouter on this chain

    struct Strategy {
        address adapter;           // IYieldAdapter implementation
        uint256 allocation;        // basis points (sum must = 10000)
        uint256 deposited;         // current amount deposited
        uint256 lastReportedYield; // yield at last report
        bool active;
        ShariaClassification sharia;
    }

    Strategy[] public strategies;
    uint256 public totalDeposited;
    uint256 public totalYieldAccrued;

    // Called by OmnichainRouter when collateral is locked
    function onCollateralReceived(uint256 amount) external onlyRouter {
        totalDeposited += amount;
        _rebalance();
    }

    // Called by OmnichainRouter when collateral is released (user burns)
    function onCollateralWithdrawn(uint256 amount) external onlyRouter {
        _withdrawFromStrategies(amount);
        totalDeposited -= amount;
        UNDERLYING.safeTransfer(ROUTER, amount);
    }
}
```

### 4. Yield Strategies (29 Total)

Each strategy is accessed through a standardized `IYieldAdapter` interface:

```solidity
interface IYieldAdapter {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external returns (uint256 actual);
    function balanceOf() external view returns (uint256);
    function apr() external view returns (uint256); // basis points annualized
}
```

#### Strategy Registry

| # | Strategy | Asset | Type | Adapter |
|---|----------|-------|------|---------|
| 1 | Lido stETH | ETH | Liquid staking | LidoAdapter |
| 2 | Aave v3 ETH | ETH | Lending | AaveV3Adapter |
| 3 | Compound v3 ETH | ETH | Lending | CompoundV3Adapter |
| 4 | EigenLayer ETH | ETH | Restaking | EigenLayerAdapter |
| 5 | Symbiotic ETH | ETH | Restaking | SymbioticAdapter |
| 6 | Karak ETH | ETH | Restaking | KarakAdapter |
| 7 | Aave v3 WBTC | WBTC | Lending | AaveV3Adapter |
| 8 | Compound v3 WBTC | WBTC | Lending | CompoundV3Adapter |
| 9 | Babylon BTC | BTC | Staking | BabylonAdapter |
| 10 | Karak BTC | WBTC | Restaking | KarakAdapter |
| 11 | Symbiotic BTC | WBTC | Restaking | SymbioticAdapter |
| 12 | Aave v3 USDC | USDC | Lending | AaveV3Adapter |
| 13 | Compound v3 USDC | USDC | Lending | CompoundV3Adapter |
| 14 | Aave v3 USDT | USDT | Lending | AaveV3Adapter |
| 15 | Compound v3 USDT | USDT | Lending | CompoundV3Adapter |
| 16 | Aave v3 DAI | DAI | Lending | AaveV3Adapter |
| 17 | Compound v3 DAI | DAI | Lending | CompoundV3Adapter |
| 18 | MakerDAO DSR | DAI | Savings rate | DSRAdapter |
| 19 | Marinade SOL | SOL | Liquid staking | MarinadeAdapter |
| 20 | Jito SOL | SOL | MEV staking | JitoAdapter |
| 21 | Sanctum SOL | SOL | Liquid staking | SanctumAdapter |
| 22 | BlazeStake SOL | SOL | Liquid staking | BlazeStakeAdapter |
| 23 | EigenLayer stETH | stETH | Restaking | EigenLayerAdapter |
| 24 | Symbiotic stETH | stETH | Restaking | SymbioticAdapter |
| 25 | Karak stETH | stETH | Restaking | KarakAdapter |
| 26 | EigenLayer WBTC | WBTC | Restaking | EigenLayerAdapter |
| 27 | Aave v3 wstETH | wstETH | Lending | AaveV3Adapter |
| 28 | Compound v3 wstETH | wstETH | Lending | CompoundV3Adapter |
| 29 | Karak SOL | SOL | Restaking | KarakAdapter |

### 5. Token Approval Policy

All interactions with yield strategies use per-operation approvals. No infinite approvals:

```solidity
function _depositToStrategy(uint256 strategyIndex, uint256 amount) internal {
    Strategy storage s = strategies[strategyIndex];
    UNDERLYING.safeApprove(s.adapter, 0);       // reset to 0 first
    UNDERLYING.safeApprove(s.adapter, amount);   // approve exact amount
    IYieldAdapter(s.adapter).deposit(amount);
    s.deposited += amount;
    // approval is now 0 (fully consumed)
}
```

This eliminates the infinite-approval attack vector where a compromised adapter drains the vault.

### 6. Yield Reporting via Warp

Yield accrued on the source chain is reported to the destination chain (Lux) via Warp messaging:

```solidity
function reportYield() external {
    uint256 currentTotal = _sumStrategyBalances();
    uint256 yieldDelta = currentTotal - totalDeposited - totalYieldAccrued;

    if (yieldDelta == 0) return;

    totalYieldAccrued += yieldDelta;

    // Send Warp message to destination chain
    IWarpMessenger(WARP_PRECOMPILE).sendWarpMessage(
        abi.encode(
            YIELD_REPORT_TYPE,
            block.chainid,
            yieldDelta,
            totalDeposited,
            totalYieldAccrued,
            block.timestamp
        )
    );

    emit YieldReported(yieldDelta, totalYieldAccrued);
}
```

On the destination chain (Lux), the yield-bearing token contract receives the Warp message and updates `_totalYieldAccrued`, causing the share-to-asset exchange rate to increase:

```solidity
function receiveYieldReport(bytes calldata warpMessage) external {
    // Verify Warp BLS signature via precompile
    (uint256 yieldDelta, uint256 sourceDeposited, uint256 sourceYieldTotal, uint256 timestamp)
        = _verifyAndDecodeWarpMessage(warpMessage);

    _totalYieldAccrued += yieldDelta;
    lastYieldReport = timestamp;

    emit YieldReceived(yieldDelta, _totalYieldAccrued);
}
```

### 7. ShariaFilter

The ShariaFilter contract classifies yield strategies for Shariah compliance:

```solidity
enum ShariaClassification {
    Halal,          // permissible: staking, real economic activity
    Haram,          // impermissible: interest-based lending
    Conditional,    // permissible with conditions (e.g. purification of interest component)
    UnderReview     // awaiting Shariah Advisory Board ruling
}

contract ShariaFilter {
    address public shariahBoard;  // Shariah Advisory Board multisig

    mapping(address => ShariaClassification) public classification;

    function classify(address strategy, ShariaClassification c) external onlyShariaBoard {
        classification[strategy] = c;
        emit StrategyClassified(strategy, c);
    }

    function isHalal(address strategy) external view returns (bool) {
        return classification[strategy] == ShariaClassification.Halal;
    }
}
```

The Shariah Advisory Board is a multisig controlled by qualified Shariah scholars. They classify each strategy:

| Classification | Strategies | Reasoning |
|---------------|-----------|-----------|
| Halal | Lido, Marinade, Jito, Sanctum, BlazeStake, EigenLayer, Symbiotic, Karak, Babylon | Staking/restaking = real economic activity (securing networks), not interest-based lending |
| Haram | Aave, Compound, MakerDAO DSR | Interest-based lending (riba) |
| Conditional | None currently | Reserved for strategies requiring partial purification |
| UnderReview | None currently | Reserved for new strategies pending evaluation |

Users who opt into Shariah-compliant mode receive yield only from Halal-classified strategies. Their share accounting is separate:

```solidity
function depositHalal(uint256 amount) external {
    // Only allocates to strategies where shariaFilter.isHalal(adapter) == true
    // Separate share tracking for halal depositors
    // Lower total yield but Shariah compliant
}
```

### 8. Rebalancing

The vault rebalances across strategies based on target allocations:

```solidity
function _rebalance() internal {
    uint256 total = UNDERLYING.balanceOf(address(this));
    for (uint256 i = 0; i < strategies.length; i++) {
        if (!strategies[i].active) continue;
        uint256 target = (total * strategies[i].allocation) / 10_000;
        uint256 current = strategies[i].deposited;
        if (target > current) {
            _depositToStrategy(i, target - current);
        } else if (current > target) {
            _withdrawFromStrategy(i, current - target);
        }
    }
}
```

Allocation weights are set by governance and sum to 10000 basis points.

## Security Considerations

1. **Inflation attack**: The virtual offset (VIRTUAL_SHARES=1e3, VIRTUAL_ASSETS=1) makes donation-based inflation attacks cost-prohibitive. An attacker would need to donate 1e3x the victim's deposit to steal 50% of their shares.

2. **Strategy risk isolation**: Each strategy adapter is a separate contract. A bug in one adapter cannot drain funds from other strategies. The vault withdraws from specific strategies, not from a shared pool.

3. **Per-operation approvals**: No infinite approvals. Each deposit approves exactly the required amount. A compromised adapter can only access funds during the deposit call, not drain the vault.

4. **Yield reporting integrity**: Yield reports are delivered via Warp messaging with BLS signature verification. A false yield report would require compromising 67%+ of source subnet validators.

5. **Redeemability guarantee**: Users can always burn yLETH/yLBTC/yLUSD/yLSOL and receive underlying + accrued yield. The exit guarantee from LPS-016 applies: burns are never paused.

6. **Strategy withdrawal risk**: Some strategies have withdrawal queues (EigenLayer unbonding: 7 days, Babylon unbonding: ~10 days). The vault maintains a liquidity buffer (configurable, default 10% of TVL) in the underlying asset to service immediate redemptions. Large redemptions that exceed the buffer enter a withdrawal queue.

7. **Shariah classification mutability**: The Shariah Advisory Board can reclassify a strategy at any time. If a Halal strategy is reclassified as Haram, existing Halal depositors' funds are withdrawn from that strategy at the next rebalance. No retroactive yield clawback occurs.

8. **Cross-chain yield lag**: Yield reports are periodic (configurable, default every 4 hours). Between reports, the destination chain's share price lags the source chain's actual yield. This creates a small arbitrage window. The window is bounded by the report interval and the rate of yield accrual (typically <0.01% per 4 hours).

## Reference

| Resource | Location |
|---|---|
| YieldBridgeVault contract | `github.com/luxfi/teleport/contracts/yield/YieldBridgeVault.sol` |
| ShariaFilter contract | `github.com/luxfi/teleport/contracts/yield/ShariaFilter.sol` |
| Yield adapters | `github.com/luxfi/teleport/contracts/yield/adapters/` |
| LPS-016 OmnichainRouter | `LPS-016-omnichain-router.md` |
| LPS-019 Threshold MPC | `LPS-019-threshold-mpc.md` |
| Warp Messaging 2.0 | `lp-6022-warp-messaging-20-native-interchain-transfers.md` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
