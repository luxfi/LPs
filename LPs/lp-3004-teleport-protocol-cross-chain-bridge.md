---
lp: 3004
title: Teleport Protocol - Cross-Chain Bridge with Remote Yield
description: MPC-attested cross-chain bridge that mints collateral tokens with remote yield strategies
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-12-25
updated: 2025-12-26
requires: 3003, 3810, 6022
tags: [c-chain, evm, defi, teleport, bridge, yield]
order: 3004
---

## Abstract

This LP defines the **Teleport Protocol** - a cross-chain bridge system that enables:

- MPC-attested minting of collateral tokens (ETH, BTC, USDC)
- Remote yield strategies for bridged assets on source chains
- Integration with Liquid Protocol for self-repaying L* token loans
- Separate token streams: collateral (deposits) and yield (debt repayment)

Teleport Protocol is the bridge layer; Liquid Protocol (LP-3003) is the lending layer. Together they enable self-repaying bridged asset loans.

## Token Model

| Token Type | Description | Minted By | Example |
|------------|-------------|-----------|---------|
| **Collateral** | Bridged asset (1:1 from source) | Teleporter.mintDeposit() | ETH |
| **Synthetic** | L* token (borrowed against collateral) | LiquidETH.borrow() | LETH |
| **Yield** | L* token (for debt repayment) | Teleporter.mintYield() | LETH |

**Key Insight**: The Teleporter mints TWO different tokens:
- `collateralToken` - ETH given to users who bridge
- `synthToken` - LETH minted for yield, routed to LiquidVault to reduce debt

## Motivation

Traditional bridges hold idle assets on source chains. Teleport Protocol enables:

1. **Remote Yield**: Bridged ETH earns yield via Lido, Aave, etc. on Ethereum/Base
2. **Yield Ferrying**: Yield from source chain is ferried back to Lux as LETH
3. **Self-Repaying Loans**: LETH yield automatically reduces user debt
4. **Yield Gating**: Only Liquid vault depositors earn yield

## Protocol Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  TELEPORT PROTOCOL - NEW TOKEN MODEL                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  EXTERNAL CHAINS (Ethereum/Base)                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ LiquidVault                                                                       │   │
│  │ - MPC-controlled ETH custody                                                      │   │
│  │ - Strategy allocation (Lido, Aave, Morpho, EigenLayer)                           │   │
│  │ - Yield harvesting                                                                │   │
│  │ - Withdrawal buffer                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│         │ Deposit                    │ Yield                  │ Release                 │
└─────────┼────────────────────────────┼────────────────────────┼─────────────────────────┘
          │                            │                        │
          ▼ MPC: mintDeposit()         ▼ MPC: mintYield()       ▲ MPC: releaseETH()
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  LUX NETWORK                                                                            │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Teleporter                                                                        │   │
│  │ ├─ mintDeposit() → ETH (collateral) → User                                       │   │
│  │ └─ mintYield()  → LETH (synthetic) → LiquidETH vault → Reduces debt             │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  USER FLOW:                                                                             │
│  ┌────────┐ deposit ┌─────────────┐ borrow ┌────────┐                                  │
│  │  ETH   │ ──────> │ LiquidETH   │ ─────> │  LETH  │                                  │
│  │(collat)│         │   Vault     │        │(synth) │                                  │
│  └────────┘         └─────────────┘        └────────┘                                  │
│                            ▲                                                            │
│                            │ onYieldReceived()                                          │
│                     LETH yield reduces debt                                             │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Specification

### 1. Teleporter (Lux)

**Purpose**: Burn/mint gateway with separate collateral and synthetic tokens

**Location**: `contracts/liquid/teleport/Teleporter.sol`

```solidity
contract Teleporter is Ownable, AccessControl, ReentrancyGuard {
    bytes32 public constant MPC_ROLE = keccak256("MPC_ROLE");
    bytes32 public constant LIQUID_YIELD_ROLE = keccak256("LIQUID_YIELD_ROLE");

    /// @notice Collateral token (bridged ETH, USDC, etc.)
    IBridgedToken public immutable collateralToken;

    /// @notice Synthetic token (LETH, LUSD, etc.) - minted for yield only
    IBridgedToken public immutable synthToken;

    /// @notice Liquid vault for routing yield
    address public liquidVault;

    // Nonce tracking for replay protection
    mapping(uint256 => bool) public depositNonceUsed;
    mapping(uint256 => bool) public yieldNonceUsed;
    mapping(uint256 => bool) public withdrawNonceUsed;

    /// @notice Mint COLLATERAL to user for bridged deposit
    function mintDeposit(
        address recipient,
        uint256 amount,
        uint256 depositNonce,
        uint256 srcChainId,
        bytes calldata mpcSignature
    ) external onlyRole(MPC_ROLE) {
        require(!depositNonceUsed[depositNonce], "Nonce used");
        depositNonceUsed[depositNonce] = true;

        // Verify MPC signature
        _verifyMPCSignature(recipient, amount, depositNonce, srcChainId, mpcSignature);

        // Mint COLLATERAL (ETH) to recipient
        collateralToken.mint(recipient, amount);

        emit DepositMinted(recipient, amount, depositNonce, srcChainId);
    }

    /// @notice Mint SYNTHETIC to LiquidVault for yield/debt repayment
    function mintYield(
        uint256 amount,
        uint256 yieldNonce,
        uint256 srcChainId,
        bytes calldata mpcSignature
    ) external onlyRole(MPC_ROLE) {
        require(!yieldNonceUsed[yieldNonce], "Nonce used");
        yieldNonceUsed[yieldNonce] = true;
        require(liquidVault != address(0), "Vault not set");

        // Verify MPC signature
        _verifyMPCSignature(liquidVault, amount, yieldNonce, srcChainId, mpcSignature);

        // Mint SYNTHETIC (LETH) to vault for debt reduction
        synthToken.mint(liquidVault, amount);

        // Notify vault of yield
        ILiquidVault(liquidVault).onYieldReceived(amount, srcChainId);

        emit YieldMinted(liquidVault, amount, yieldNonce, srcChainId);
    }

    /// @notice Burn collateral for withdrawal to source chain
    function burn(
        uint256 amount,
        address dstRecipient,
        uint256 dstChainId
    ) external returns (uint256 withdrawNonce) {
        withdrawNonce = ++_withdrawNonce;

        // Burn COLLATERAL from user
        collateralToken.transferFrom(msg.sender, address(this), amount);
        collateralToken.burn(amount);

        emit BurnForWithdraw(msg.sender, dstRecipient, amount, withdrawNonce, dstChainId);
    }
}
```

**Key Changes from Previous Model**:
- Two token types: `collateralToken` and `synthToken`
- `mintDeposit()` → mints collateral (ETH) to user
- `mintYield()` → mints synthetic (LETH) to vault for debt reduction
- User receives ETH, NOT LETH, when bridging

### 2. TeleportVault (Base Contract)

**Purpose**: Abstract base for MPC-controlled custody vaults

**Location**: `contracts/liquid/teleport/TeleportVault.sol`

```solidity
abstract contract TeleportVault is Ownable, AccessControl, ReentrancyGuard {
    bytes32 public constant MPC_ROLE = keccak256("MPC_ROLE");

    struct DepositProof {
        uint256 nonce;
        address luxRecipient;
        uint256 amount;
        uint256 timestamp;
        bool bridged;
    }

    uint256 public depositNonce;
    uint256 public withdrawNonce;
    mapping(uint256 => DepositProof) public deposits;

    /// @notice Record deposit for bridging
    function _recordDeposit(address luxRecipient, uint256 amount)
        internal returns (uint256 nonce);

    /// @notice Record release for withdrawal
    function _recordRelease(address recipient, uint256 amount, uint256 _withdrawNonce)
        internal;

    // Abstract
    function asset() external view virtual returns (address);
    function vaultBalance() external view virtual returns (uint256);
}
```

### 3. LiquidVault (External Chains)

**Purpose**: MPC-controlled ETH custody with yield strategy routing

**Location**: `contracts/liquid/teleport/LiquidVault.sol`

```solidity
contract LiquidVault is TeleportVault {
    bytes32 public constant STRATEGY_ROLE = keccak256("STRATEGY_ROLE");

    struct Strategy {
        address adapter;           // IYieldStrategy implementation
        uint256 allocated;         // Amount in strategy
        uint256 lastHarvest;       // Last harvest timestamp
        bool active;               // Strategy active flag
    }

    Strategy[] public strategies;
    uint256 public minBufferBps = 1000;  // 10% minimum buffer

    /// @notice Deposit ETH and emit event for Lux mint
    function depositETH(address luxRecipient) external payable returns (uint256 nonce);

    /// @notice MPC: Allocate ETH to yield strategy
    function allocateToStrategy(
        uint256 strategyIndex,
        uint256 amount,
        bytes calldata mpcSignature
    ) external onlyRole(STRATEGY_ROLE);

    /// @notice MPC: Harvest yield from strategy
    function harvestYield(
        uint256 strategyIndex,
        bytes calldata mpcSignature
    ) external onlyRole(STRATEGY_ROLE) returns (uint256 harvested);

    /// @notice MPC: Release ETH for user withdrawal
    function releaseETH(
        address recipient,
        uint256 amount,
        uint256 _withdrawNonce
    ) external onlyRole(MPC_ROLE);
}
```

### 4. LiquidETH (Lux)

**Purpose**: Vault for ETH collateral with E-Mode 90% LTV, mints LETH on borrow

**Location**: `contracts/liquid/teleport/LiquidETH.sol`

```solidity
contract LiquidETH is Ownable, AccessControl, ReentrancyGuard {
    // E-Mode Parameters
    uint256 public constant E_MODE_LTV = 9000;              // 90%
    uint256 public constant LIQUIDATION_THRESHOLD = 9400;   // 94%
    uint256 public constant LIQUIDATION_BONUS = 100;        // 1%

    /// @notice Collateral token (bridged ETH)
    IERC20 public immutable collateral;

    /// @notice Synthetic token (LETH - minted by vault)
    IBridgedToken public immutable synthetic;

    struct Position {
        uint256 collateral;  // ETH deposited
        uint256 debt;        // LETH borrowed
        uint256 lastUpdate;
    }
    mapping(address => Position) public positions;

    // Yield distribution
    uint256 public yieldIndex = 1e18;
    mapping(address => uint256) public userYieldIndex;

    /// @notice Deposit ETH collateral
    function deposit(uint256 amount) external;

    /// @notice Borrow LETH against ETH (mints LETH to user)
    function borrow(uint256 amount) external;

    /// @notice Repay LETH debt (burns LETH)
    function repay(uint256 amount) external;

    /// @notice Withdraw ETH collateral
    function withdraw(uint256 amount) external;

    /// @notice Receive yield from Teleporter (reduces debt pro-rata)
    function onYieldReceived(uint256 amount, uint256 srcChainId) external;

    /// @notice Liquidate undercollateralized position
    function liquidate(address user, uint256 debtToRepay) external;
}
```

### 5. LiquidYield (Lux)

**Purpose**: Optional yield processing helper

**Location**: `contracts/liquid/teleport/LiquidYield.sol`

```solidity
contract LiquidYield is Ownable, AccessControl, ReentrancyGuard {
    IBridgedToken public immutable synthToken;
    ILiquidETH public liquidETH;

    /// @notice Receive yield from Teleporter and route to vault
    function onYieldReceived(uint256 amount, uint256 srcChainId) external;

    /// @notice Process any pending yield
    function process() external;
}
```

## Message Flows

### A) Bridge In (User receives ETH collateral)

```
User deposits ETH on Ethereum/Base
    │
    ▼
LiquidVault.depositETH(luxRecipient) → DepositRecorded event
    │
    ▼ MPC attestation
Teleporter.mintDeposit(recipient, amount, nonce, chainId, sig)
    │
    ▼
User receives ETH (collateral) on Lux
    │
    ▼ Optional: User deposits into LiquidETH to borrow LETH
LiquidETH.deposit(ethAmount)
LiquidETH.borrow(lethAmount)  // Up to 90% LTV
    │
    ▼
User has LETH (synthetic) to use in DeFi
```

### B) Yield Flow (Automatic debt repayment)

```
MPC calls LiquidVault.harvestYield(strategyIndex, sig)
    │
    ▼
Yield realized in LiquidVault buffer
    │
    ▼ MPC attestation
Teleporter.mintYield(amount, yieldNonce, chainId, sig)
    │
    ▼
LETH minted to LiquidETH vault
    │
    ▼
LiquidETH.onYieldReceived(amount, chainId)
    │
    ▼
yieldIndex updated, all borrower debts reduced pro-rata
LETH is burned (debt reduction = token burn)
```

### C) Bridge Out (Withdraw ETH)

```
User calls LiquidETH.repay(lethAmount)  // Burns LETH
    │
    ▼
User calls LiquidETH.withdraw(ethAmount)  // Get ETH collateral back
    │
    ▼
User calls Teleporter.burn(ethAmount, dstRecipient, dstChainId)
    │
    ▼
BurnForWithdraw event emitted
    │
    ▼ MPC monitors
LiquidVault.releaseETH(recipient, amount, withdrawNonce)
    │
    ▼
User receives ETH on source chain
```

## Yield Strategies

**Location**: `contracts/yield/strategies/`

| Strategy | Protocol | APY Range | Risk |
|----------|----------|-----------|------|
| `LidoStrategy.sol` | Lido | 3-5% | Low |
| `RocketPoolStrategy.sol` | Rocket Pool | 3-4% | Low |
| `AaveV3Strategy.sol` | Aave V3 | 2-4% | Low |
| `CompoundV3Strategy.sol` | Compound V3 | 2-3% | Low |
| `MorphoStrategy.sol` | Morpho | 3-5% | Medium |
| `EigenLayerStrategy.sol` | EigenLayer | 4-8% | Medium |
| `ConvexStrategy.sol` | Convex/Curve | 5-15% | Medium |
| `YearnV3Strategy.sol` | Yearn V3 | 3-8% | Medium |

### IYieldStrategy Interface

```solidity
interface IYieldStrategy {
    function deposit(uint256 amount) external payable returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 assets);
    function harvest() external returns (uint256 harvested);
    function totalAssets() external view returns (uint256);
    function currentAPY() external view returns (uint256);
    function isActive() external view returns (bool);
    function name() external view returns (string memory);
    function vault() external view returns (address);
}
```

## Roles

| Role | Responsibilities |
|------|-----------------|
| **MPC Attestor** | Signs remote-chain event attestations |
| **MPC Operator** | Executes LiquidVault operations |
| **Keeper** | Calls yield processing functions |
| **Admin** | Sets params, caps, pauses |

## Core Invariants

1. **Two Token Streams**: Deposits mint collateral; yield mints synthetic
2. **Yield Gating**: Only LiquidETH depositors benefit from yield
3. **Replay Safety**: Unique nonces per operation type
4. **Solvency**: Buffer + unwind can honor withdrawals

## Safety Controls

- Market pause (borrow/withdraw separately)
- Strategy allowlist + caps
- Slippage limits on swaps
- Buffer floor on LiquidVault
- Global caps for launch

## Reference Implementation

| Contract | Location | Lines |
|----------|----------|-------|
| TeleportVault | `contracts/liquid/teleport/TeleportVault.sol` | ~250 |
| LiquidVault | `contracts/liquid/teleport/LiquidVault.sol` | ~400 |
| Teleporter | `contracts/liquid/teleport/Teleporter.sol` | ~400 |
| LiquidETH | `contracts/liquid/teleport/LiquidETH.sol` | ~500 |
| LiquidYield | `contracts/liquid/teleport/LiquidYield.sol` | ~150 |
| IYieldStrategy | `contracts/yield/IYieldStrategy.sol` | ~175 |
| Strategies | `contracts/yield/strategies/*.sol` | ~5000 |

## Related Standards

| LP | Title | Relationship |
|----|-------|--------------|
| LP-3003 | Liquid Protocol | Lending layer |
| LP-3810 | Teleport Token Standard | Token interface |
| LP-6022 | Warp Messaging 2.0 | Cross-chain |

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
