---
lp: 3003
title: Liquid Protocol - Self-Repaying Asset Loans
description: Self-repaying loan protocol enabling users to borrow L* tokens against bridged collateral with automatic yield-based repayment
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-12-14
updated: 2025-12-26
requires: 3000, 3004, 3020, 6022
tags: [c-chain, evm, defi, liquid, self-repaying]
order: 3003
---

## Abstract

This LP defines the **Liquid Protocol** for Lux Network - a self-repaying loan system where users deposit bridged collateral and borrow L* tokens (Liquid tokens) that repay themselves automatically through yield generated on the source chain. Unlike traditional lending, users face minimal liquidation risk with 90% LTV in E-Mode for correlated assets.

## Token Model

The Liquid Protocol uses a simple, clear token model:

| Token Type | Prefix | Description | Example |
|------------|--------|-------------|---------|
| **Collateral** | None | Bridged asset (1:1 from source chain) | ETH, BTC, USDC |
| **Liquid** | L* | Borrowed synthetic (minted by vault) | LETH, LBTC, LUSD |

**Flow**: Bridge ETH → Deposit ETH into LiquidETH → Borrow LETH

**Key Insight**: L* tokens ARE the synthetics. There are no separate "synthetic" tokens - the L* prefix indicates a self-repaying, yield-backed liquid asset.

## Mainnet Launch: 12 Liquid Assets

### Native Lux Tokens

| Liquid Token | Collateral | Description |
|--------------|------------|-------------|
| **LLUX** | WLUX/sLUX | Liquid LUX (native gas token) |
| **LAI** | AI | Liquid AI (GPU compute token) |
| **LZOO** | ZOO | Liquid ZOO (ecosystem token) |

### Major L1 Chains

| Liquid Token | Collateral | Description |
|--------------|------------|-------------|
| **LETH** | ETH | Liquid ETH (Ethereum) |
| **LBTC** | BTC | Liquid BTC (Bitcoin) |
| **LSOL** | SOL | Liquid SOL (Solana) |
| **LTON** | TON | Liquid TON (TON) |
| **LADA** | ADA | Liquid ADA (Cardano) |
| **LAVAX** | AVAX | Liquid AVAX (Avalanche) |
| **LBNB** | BNB | Liquid BNB (BNB Chain) |
| **LPOL** | POL | Liquid POL (Polygon) |

### Stablecoins

| Liquid Token | Collateral | Description |
|--------------|------------|-------------|
| **LUSD** | USDC/USDT | Liquid USD (stablecoin) |

## Motivation

Traditional DeFi lending protocols require:
1. Active debt management to avoid liquidation
2. Interest payments that compound over time
3. Constant monitoring of collateralization ratios
4. Risk of total collateral loss during market volatility

Liquid Protocol solves these problems by:
1. **High LTV**: 90% borrowing power in E-Mode (highly correlated assets)
2. **Passive Repayment**: Yield from source chain automatically reduces debt
3. **Capital Efficiency**: Access liquidity without selling bridged assets
4. **Simple Model**: Collateral in, L* tokens out

### Why L* Instead of s*?

The L* prefix is cleaner and more marketable:
- **L** = Liquid, Lux, Loan
- One token type per asset (not ETH + LETH + sETH)
- Users understand: "Deposit ETH, get LETH"

## Specification

### Core Contracts

| Contract | Purpose | Location |
|----------|---------|----------|
| `LiquidETH.sol` | ETH vault - deposit ETH, borrow LETH | `contracts/liquid/teleport/` |
| `LiquidBTC.sol` | BTC vault - deposit BTC, borrow LBTC | `contracts/liquid/teleport/` |
| `LiquidUSD.sol` | USD vault - deposit USDC/USDT, borrow LUSD | `contracts/liquid/teleport/` |
| `Teleporter.sol` | Cross-chain bridge gateway | `contracts/liquid/teleport/` |
| `LiquidYield.sol` | Yield distribution | `contracts/liquid/teleport/` |

### E-Mode Parameters

For correlated assets (ETH/LETH, BTC/LBTC, etc.):

| Parameter | Value | Description |
|-----------|-------|-------------|
| `E_MODE_LTV` | 90% (9000 bps) | Maximum borrow ratio |
| `LIQUIDATION_THRESHOLD` | 94% (9400 bps) | Liquidation trigger |
| `LIQUIDATION_BONUS` | 1% (100 bps) | Liquidator incentive |
| `MIN_POSITION_SIZE` | 0.001 ETH | Dust prevention |

### LiquidETH Interface

```solidity
interface ILiquidETH {
    // Tokens
    function collateral() external view returns (IERC20);  // ETH (bridged)
    function synthetic() external view returns (IBridgedToken);  // LETH

    // Deposit ETH collateral
    function deposit(uint256 amount) external;

    // Withdraw ETH collateral (must maintain LTV)
    function withdraw(uint256 amount) external;

    // Borrow LETH against collateral (mints LETH to user)
    function borrow(uint256 amount) external;

    // Repay LETH debt (burns LETH)
    function repay(uint256 amount) external;

    // Liquidate undercollateralized position
    function liquidate(address user, uint256 debtToCover) external;

    // Receive yield from Teleporter (reduces debt pro-rata)
    function onYieldReceived(uint256 amount, uint256 srcChainId) external;

    // View functions
    function getPosition(address user) external view returns (
        uint256 ethCollateral,
        uint256 lethDebt,
        uint256 effectiveDebt,
        uint256 healthFactor,
        uint256 availableToBorrow
    );

    function isLiquidatable(address user) external view returns (bool);
}
```

## Architecture

### User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LIQUID PROTOCOL FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SOURCE CHAIN (Ethereum)              LUX CHAIN                             │
│  ┌─────────────┐                      ┌─────────────┐                       │
│  │ User locks  │   Teleporter         │ ETH minted  │                       │
│  │ ETH         │ ─────────────────>   │ (collateral)│                       │
│  └─────────────┘                      └──────┬──────┘                       │
│                                              │                              │
│                                              ▼ deposit                      │
│                                       ┌─────────────┐                       │
│                                       │ LiquidETH   │                       │
│                                       │ Vault       │                       │
│                                       └──────┬──────┘                       │
│                                              │                              │
│                                              ▼ borrow                       │
│                                       ┌─────────────┐                       │
│                                       │ LETH minted │                       │
│                                       │ to user     │                       │
│                                       └─────────────┘                       │
│                                                                             │
│  YIELD FLOW:                                                                │
│  ┌─────────────┐                      ┌─────────────┐                       │
│  │ Staking ETH │   Teleporter         │ LETH minted │                       │
│  │ earns yield │ ─────────────────>   │ to vault    │ ─> Debt reduced       │
│  └─────────────┘   (yield message)    └─────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Token Flow

```
Bridge Flow (User):
  Ethereum ETH  ──[lock]──>  Teleporter  ──[mint]──>  ETH (Lux)

Deposit Flow (User):
  ETH (Lux)  ──[deposit]──>  LiquidETH Vault  ──[borrow]──>  LETH (minted)

Yield Flow (Automatic):
  Staking Rewards  ──[Teleporter]──>  LiquidETH  ──[reduce debt]──>  Users
```

### Yield Distribution

Yield from source chain is distributed pro-rata to all borrowers:

```solidity
// When yield is received from Teleporter
function onYieldReceived(uint256 amount, uint256 srcChainId) external {
    // Update global yield index
    uint256 yieldPerDebt = amount * 1e18 / totalDebt;
    yieldIndex += yieldPerDebt;

    // Reduce total debt
    totalDebt -= amount;

    // Burn the yield tokens
    synthetic.burn(amount);
}

// When user interacts, their debt is reduced by their share
function _updateUserYield(address user) internal {
    uint256 yieldShare = position.debt * (yieldIndex - userYieldIndex) / 1e18;
    position.debt -= yieldShare;
}
```

## Reference Implementation

### Standard Library Location

```
~/work/lux/standard/contracts/liquid/
├── teleport/
│   ├── Teleporter.sol      # Bridge gateway
│   ├── LiquidETH.sol       # ETH vault
│   ├── LiquidBTC.sol       # BTC vault
│   ├── LiquidUSD.sol       # USD vault
│   └── LiquidYield.sol     # Yield processing
├── vaults/
│   ├── LiquidVault.sol     # Base vault
│   └── README.md
└── README.md
```

### Gas Costs

| Operation | Gas Cost | USD (@ 25 gwei) |
|-----------|----------|--------------------|
| deposit | ~100,000 | $0.025 |
| withdraw | ~120,000 | $0.03 |
| borrow | ~150,000 | $0.04 |
| repay | ~130,000 | $0.03 |
| liquidate | ~200,000 | $0.05 |

## Test Cases

### 1. Deposit and Borrow

```solidity
function testDepositAndBorrow() public {
    // User has 1 ETH (bridged)
    uint256 depositAmount = 1 ether;
    eth.approve(address(liquidETH), depositAmount);

    // Deposit ETH
    liquidETH.deposit(depositAmount);

    // Borrow LETH (up to 90% LTV)
    uint256 borrowAmount = 0.9 ether;
    liquidETH.borrow(borrowAmount);

    // Verify
    (uint256 collateral, uint256 debt, , , ) = liquidETH.getPosition(address(this));
    assertEq(collateral, 1 ether);
    assertEq(debt, 0.9 ether);
    assertEq(leth.balanceOf(address(this)), 0.9 ether);
}
```

### 2. Self-Repaying via Yield

```solidity
function testYieldReducesDebt() public {
    testDepositAndBorrow();

    // Simulate yield from source chain (0.05 LETH)
    vm.prank(teleporter);
    liquidETH.onYieldReceived(0.05 ether, 1); // chainId 1 = Ethereum

    // Verify debt reduced
    (uint256 collateral, uint256 debt, , , ) = liquidETH.getPosition(address(this));
    assertEq(collateral, 1 ether);
    assertEq(debt, 0.85 ether);  // Was 0.9, reduced by 0.05
}
```

### 3. Liquidation

```solidity
function testLiquidation() public {
    testDepositAndBorrow();

    // Price drops, position becomes liquidatable
    // (In practice, this would require an oracle update)
    vm.mockCall(
        address(oracle),
        abi.encodeWithSignature("getPrice(address)", address(eth)),
        abi.encode(0.9e18)  // ETH value dropped
    );

    // Liquidator repays debt, receives collateral + bonus
    leth.mint(liquidator, 0.5 ether);
    vm.prank(liquidator);
    liquidETH.liquidate(address(this), 0.5 ether);

    // Verify liquidator received collateral + 1% bonus
    assertEq(eth.balanceOf(liquidator), 0.505 ether);
}
```

## Security Considerations

### Smart Contract Risks

1. **Bridge Risk**: If Teleporter is compromised, collateral minting is at risk
   - Mitigation: MPC signatures, timelock, rate limiting

2. **Yield Source Risk**: If staking yield stops, loans don't self-repay
   - Mitigation: Users can manually repay, no forced liquidation for yield issues

3. **Oracle Risk**: Incorrect prices could enable bad liquidations
   - Mitigation: Multiple price sources, sanity checks

4. **Admin Key Risk**: Admin functions could be abused
   - Mitigation: Timelock, multisig, role separation

### E-Mode Safety

The 90% LTV with 94% liquidation threshold provides only 4% buffer. This is safe for:
- **Correlated assets**: ETH/LETH maintain 1:1 peg via arbitrage
- **Self-repaying**: Yield reduces debt before liquidation
- **No interest**: Unlike traditional lending, debt doesn't grow

For uncorrelated assets, standard LTV ratios (70-80%) should apply.

## Related Standards

| LP | Title | Relationship |
|----|-------|--------------|
| LP-3000 | Standard Library Registry | Master registry |
| LP-3004 | Teleport Protocol | Cross-chain bridge |
| LP-3020 | LRC-20 Token Standard | Base token interface |
| LP-6022 | Warp Messaging 2.0 | Cross-chain messaging |
| LP-9072 | Bridged Asset Standard | Bridge token pattern |

## Backwards Compatibility

This LP supersedes the previous s* synthetic token model. Key changes:
- **Removed**: sUSD, sETH, sBTC, etc. (s* prefix tokens)
- **Retained**: L* tokens (LUSD, LETH, LBTC) as the only synthetic tokens
- **Simplified**: One token per asset instead of collateral + synthetic

Migration path for existing s* holders:
1. s* tokens can be redeemed 1:1 for L* tokens via migration contract
2. No loss of value - only naming/contract change

## References

1. Lux Standard Repository: `~/work/lux/standard/contracts/liquid/`
2. LP-3004: Teleport Protocol Specification
3. Aave E-Mode Documentation: https://docs.aave.com/developers/whats-new/efficiency-mode-emode

## Copyright

Copyright and related rights waived via [BSD-3-Clause](https://opensource.org/licenses/BSD-3-Clause).
