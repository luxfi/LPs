---
lip: 64
title: Tokenized Vault Standard (LRC-4626)
description: A standard for tokenized vaults on Lux Network based on ERC-4626
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 20
---

## Abstract

This LIP defines a standard for tokenized vaults, which are smart contracts that accept deposits of an underlying LRC-20 token and mint shares representing proportional ownership. Based on ERC-4626, this standard provides a universal API for yield-bearing vaults, lending markets, and other DeFi protocols on Lux Network.

## Motivation

A standard for tokenized vaults enables:

1. **Composability**: Uniform interface for yield aggregators
2. **Integration**: Easy integration with DeFi protocols
3. **Capital Efficiency**: Standardized yield-bearing tokens
4. **User Experience**: Consistent interaction patterns
5. **Cross-Chain Vaults**: Unified vault standards across Lux chains

## Specification

### Core Vault Interface

```solidity
interface ILRC4626 is ILRC20 {
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );
    
    /**
     * @dev Returns the address of the underlying token used by the Vault.
     */
    function asset() external view returns (address assetTokenAddress);
    
    /**
     * @dev Returns the total amount of the underlying asset managed by Vault.
     */
    function totalAssets() external view returns (uint256 totalManagedAssets);
    
    /**
     * @dev Returns the amount of shares that would be exchanged by the vault for the amount of assets provided.
     */
    function convertToShares(uint256 assets) external view returns (uint256 shares);
    
    /**
     * @dev Returns the amount of assets that would be exchanged by the vault for the amount of shares provided.
     */
    function convertToAssets(uint256 shares) external view returns (uint256 assets);
    
    /**
     * @dev Returns the maximum amount of underlying assets that can be deposited.
     */
    function maxDeposit(address receiver) external view returns (uint256 maxAssets);
    
    /**
     * @dev Allows an on-chain or off-chain user to simulate the effects of their deposit at the current block.
     */
    function previewDeposit(uint256 assets) external view returns (uint256 shares);
    
    /**
     * @dev Mints shares to receiver by depositing exactly assets of underlying tokens.
     */
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    
    /**
     * @dev Returns the maximum amount of shares that can be minted.
     */
    function maxMint(address receiver) external view returns (uint256 maxShares);
    
    /**
     * @dev Allows an on-chain or off-chain user to simulate the effects of their mint at the current block.
     */
    function previewMint(uint256 shares) external view returns (uint256 assets);
    
    /**
     * @dev Mints exactly shares to receiver by depositing assets of underlying tokens.
     */
    function mint(uint256 shares, address receiver) external returns (uint256 assets);
    
    /**
     * @dev Returns the maximum amount of underlying assets that can be withdrawn.
     */
    function maxWithdraw(address owner) external view returns (uint256 maxAssets);
    
    /**
     * @dev Allows an on-chain or off-chain user to simulate the effects of their withdrawal at the current block.
     */
    function previewWithdraw(uint256 assets) external view returns (uint256 shares);
    
    /**
     * @dev Burns shares from owner and sends exactly assets of underlying tokens to receiver.
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external returns (uint256 shares);
    
    /**
     * @dev Returns the maximum amount of shares that can be redeemed.
     */
    function maxRedeem(address owner) external view returns (uint256 maxShares);
    
    /**
     * @dev Allows an on-chain or off-chain user to simulate the effects of their redemption at the current block.
     */
    function previewRedeem(uint256 shares) external view returns (uint256 assets);
    
    /**
     * @dev Burns exactly shares from owner and sends assets of underlying tokens to receiver.
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external returns (uint256 assets);
}
```

### Extended Vault Features

```solidity
interface ILRC4626Extended is ILRC4626 {
    // Fee structure
    struct FeeConfig {
        uint256 depositFeeBps;    // Deposit fee in basis points
        uint256 withdrawFeeBps;   // Withdrawal fee in basis points
        uint256 managementFeeBps; // Annual management fee in basis points
        uint256 performanceFeeBps; // Performance fee in basis points
        address feeRecipient;     // Address to receive fees
    }
    
    event FeesUpdated(FeeConfig newFees);
    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
    
    /**
     * @dev Returns the current fee configuration
     */
    function feeConfig() external view returns (FeeConfig memory);
    
    /**
     * @dev Returns the address of the current yield strategy
     */
    function strategy() external view returns (address);
    
    /**
     * @dev Updates the yield strategy (owner only)
     */
    function setStrategy(address newStrategy) external;
    
    /**
     * @dev Harvests yield from the strategy
     */
    function harvest() external returns (uint256 harvestedAmount);
    
    /**
     * @dev Emergency function to pause deposits/withdrawals
     */
    function pause() external;
    function unpause() external;
}
```

### Multi-Asset Vault Extension

```solidity
interface ILRC4626MultiAsset is ILRC4626 {
    event AssetAdded(address indexed asset, uint256 weight);
    event AssetRemoved(address indexed asset);
    event Rebalanced(address[] assets, uint256[] newWeights);
    
    /**
     * @dev Returns array of accepted assets
     */
    function assets() external view returns (address[] memory);
    
    /**
     * @dev Returns the weight of a specific asset
     */
    function assetWeight(address asset) external view returns (uint256);
    
    /**
     * @dev Deposits multiple assets in a single transaction
     */
    function depositMulti(
        address[] calldata assets,
        uint256[] calldata amounts,
        address receiver
    ) external returns (uint256 shares);
    
    /**
     * @dev Withdraws to multiple assets based on current weights
     */
    function withdrawMulti(
        uint256 shares,
        address receiver,
        address owner
    ) external returns (address[] memory assets, uint256[] memory amounts);
}
```

### Cross-Chain Vault Extension

```solidity
interface ILRC4626CrossChain is ILRC4626 {
    event CrossChainDeposit(
        address indexed sender,
        uint256 sourceChain,
        uint256 targetChain,
        uint256 assets,
        uint256 shares
    );
    
    event CrossChainWithdrawal(
        address indexed sender,
        uint256 sourceChain,
        uint256 targetChain,
        uint256 assets,
        uint256 shares
    );
    
    /**
     * @dev Deposits assets from another chain
     */
    function depositFromChain(
        uint256 assets,
        address receiver,
        uint256 sourceChain,
        bytes calldata proof
    ) external returns (uint256 shares);
    
    /**
     * @dev Initiates withdrawal to another chain
     */
    function withdrawToChain(
        uint256 assets,
        address receiver,
        uint256 targetChain,
        address owner
    ) external returns (uint256 shares, bytes32 withdrawalId);
}
```

## Rationale

### ERC-4626 Compatibility

Maintaining compatibility with ERC-4626 ensures:
- Existing tool support
- Proven security patterns
- Wide ecosystem adoption
- Standard integrations

### Preview Functions

Preview functions enable:
- Gas-free simulations
- Better UX with accurate quotes
- Integration with aggregators
- Slippage protection

### Flexible Fee Structure

Comprehensive fee support allows:
- Sustainable protocol revenue
- Aligned incentives
- Competitive fee structures
- Performance-based compensation

## Backwards Compatibility

This standard is fully compatible with:
- ERC-4626 implementations
- LRC-20 token standard
- Existing DeFi protocols
- Yield aggregators

## Test Cases

### Basic Vault Operations

```solidity
contract VaultTest {
    ILRC4626 vault;
    IERC20 asset;
    
    function setUp() public {
        asset = IERC20(0x...);
        vault = ILRC4626(0x...);
    }
    
    function testDeposit() public {
        uint256 depositAmount = 1000 * 10**18;
        asset.approve(address(vault), depositAmount);
        
        uint256 sharesBefore = vault.balanceOf(address(this));
        uint256 expectedShares = vault.previewDeposit(depositAmount);
        
        uint256 shares = vault.deposit(depositAmount, address(this));
        
        assertEq(shares, expectedShares);
        assertEq(vault.balanceOf(address(this)), sharesBefore + shares);
    }
    
    function testWithdraw() public {
        // First deposit
        uint256 depositAmount = 1000 * 10**18;
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, address(this));
        
        // Then withdraw half
        uint256 withdrawAmount = 500 * 10**18;
        uint256 expectedShares = vault.previewWithdraw(withdrawAmount);
        
        uint256 sharesBurned = vault.withdraw(
            withdrawAmount,
            address(this),
            address(this)
        );
        
        assertEq(sharesBurned, expectedShares);
        assertGe(asset.balanceOf(address(this)), withdrawAmount);
    }
    
    function testConversion() public {
        uint256 assets = 1000 * 10**18;
        uint256 shares = vault.convertToShares(assets);
        uint256 assetsBack = vault.convertToAssets(shares);
        
        // Allow for rounding
        assertApproxEqAbs(assets, assetsBack, 1);
    }
}
```

### Fee Testing

```solidity
function testDepositWithFees() public {
    ILRC4626Extended vaultExt = ILRC4626Extended(address(vault));
    ILRC4626Extended.FeeConfig memory fees = vaultExt.feeConfig();
    
    uint256 depositAmount = 1000 * 10**18;
    uint256 expectedFee = (depositAmount * fees.depositFeeBps) / 10000;
    uint256 expectedShares = vault.previewDeposit(depositAmount - expectedFee);
    
    asset.approve(address(vault), depositAmount);
    uint256 shares = vault.deposit(depositAmount, address(this));
    
    assertEq(shares, expectedShares);
}
```

## Reference Implementation

```solidity
contract LRC4626Vault is ILRC4626, ILRC20, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    IERC20 private immutable _asset;
    uint8 private immutable _decimals;
    
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_
    ) ILRC20(name_, symbol_) {
        _asset = asset_;
        _decimals = asset_.decimals();
    }
    
    function asset() public view virtual override returns (address) {
        return address(_asset);
    }
    
    function totalAssets() public view virtual override returns (uint256) {
        return _asset.balanceOf(address(this));
    }
    
    function convertToShares(uint256 assets) public view virtual override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Down);
    }
    
    function convertToAssets(uint256 shares) public view virtual override returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Down);
    }
    
    function maxDeposit(address) public view virtual override returns (uint256) {
        return type(uint256).max;
    }
    
    function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Down);
    }
    
    function deposit(uint256 assets, address receiver) public virtual override nonReentrant returns (uint256) {
        require(assets <= maxDeposit(receiver), "ERC4626: deposit more than max");
        
        uint256 shares = previewDeposit(assets);
        _asset.safeTransferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);
        
        emit Deposit(msg.sender, receiver, assets, shares);
        
        return shares;
    }
    
    function maxWithdraw(address owner) public view virtual override returns (uint256) {
        return _convertToAssets(balanceOf(owner), Math.Rounding.Down);
    }
    
    function previewWithdraw(uint256 assets) public view virtual override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Up);
    }
    
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override nonReentrant returns (uint256) {
        require(assets <= maxWithdraw(owner), "ERC4626: withdraw more than max");
        
        uint256 shares = previewWithdraw(assets);
        
        if (msg.sender != owner) {
            uint256 allowed = allowance(owner, msg.sender);
            if (allowed != type(uint256).max) {
                require(allowed >= shares, "ERC4626: insufficient allowance");
                _approve(owner, msg.sender, allowed - shares);
            }
        }
        
        _burn(owner, shares);
        _asset.safeTransfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        
        return shares;
    }
    
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view returns (uint256) {
        uint256 supply = totalSupply();
        return
            (assets == 0 || supply == 0)
                ? assets.mulDiv(10**decimals(), 10**_decimals, rounding)
                : assets.mulDiv(supply, totalAssets(), rounding);
    }
    
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view returns (uint256) {
        uint256 supply = totalSupply();
        return
            (supply == 0)
                ? shares.mulDiv(10**_decimals, 10**decimals(), rounding)
                : shares.mulDiv(totalAssets(), supply, rounding);
    }
}
```

## Security Considerations

### Reentrancy Protection

All external functions must be protected:
```solidity
modifier nonReentrant() {
    require(!_reentrancyGuard, "Reentrant call");
    _reentrancyGuard = true;
    _;
    _reentrancyGuard = false;
}
```

### Vault Inflation Attacks

Prevent share price manipulation:
```solidity
// Mint minimal shares on first deposit
if (totalSupply() == 0) {
    require(shares > MINIMUM_LIQUIDITY, "Below minimum liquidity");
    _mint(address(0), MINIMUM_LIQUIDITY); // Permanently lock
}
```

### Rounding Errors

Always round in favor of the vault:
```solidity
// Round down when converting to shares (deposit)
shares = assets.mulDiv(totalSupply(), totalAssets(), Math.Rounding.Down);

// Round up when converting to shares (withdraw)
shares = assets.mulDiv(totalSupply(), totalAssets(), Math.Rounding.Up);
```

### Access Control

Implement proper access control for admin functions:
```solidity
modifier onlyOwner() {
    require(msg.sender == owner(), "Not authorized");
    _;
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).