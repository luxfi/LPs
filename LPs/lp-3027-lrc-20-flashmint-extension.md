---
lp: 3027
title: LRC-20 FlashMint Extension
description: Flash minting extension for LRC-20 tokens enabling uncollateralized borrowing within a single transaction
author: Lux Industries (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-12-25
requires: [3020, 6156]
tags: [lrc-20, token, flash-mint, flash-loan, defi]
order: 3027
---

# LP-3027: LRC-20 FlashMint Extension

## Abstract

This LP defines the FlashMint extension for LRC-20 tokens, enabling tokens to be minted, used, and burned within a single transaction without collateral.

## Motivation

Flash minting provides:
- Uncollateralized borrowing for arbitrage
- Capital-efficient DeFi operations
- No pre-existing liquidity requirements
- Lower barriers for market makers

Unlike flash loans (LP-3156) which lend from a pool, flash minting creates new tokens temporarily.

## Specification

### Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./ILRC20.sol";
import "../interfaces/ILRC3156FlashLender.sol";

/**
 * @title ILRC20FlashMint
 * @notice LRC-20 extension for flash minting
 */
interface ILRC20FlashMint is ILRC20, ILRC3156FlashLender {
    /**
     * @notice Returns maximum flash mint amount
     * @param token Token address (must be this contract)
     * @return Maximum flash mintable amount
     */
    function maxFlashLoan(address token) external view returns (uint256);

    /**
     * @notice Returns flash mint fee
     * @param token Token address
     * @param amount Flash mint amount
     * @return Fee amount
     */
    function flashFee(address token, uint256 amount) external view returns (uint256);

    /**
     * @notice Execute flash mint
     * @param receiver Callback receiver
     * @param token Token to flash mint
     * @param amount Amount to mint
     * @param data Callback data
     * @return Success boolean
     */
    function flashLoan(
        ILRC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool);
}
```solidity

### Implementation

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./LRC20.sol";
import "../interfaces/ILRC3156FlashBorrower.sol";

/**
 * @title LRC20FlashMint
 * @notice LRC-20 with flash minting capability
 */
abstract contract LRC20FlashMint is LRC20 {
    bytes32 private constant CALLBACK_SUCCESS = keccak256("LRC3156FlashBorrower.onFlashLoan");

    error LRC20FlashMintUnsupportedToken(address token);
    error LRC20FlashMintExceededMaxLoan(uint256 maxLoan);
    error LRC20FlashMintCallbackFailed();
    error LRC20FlashMintRepayFailed();

    /**
     * @notice Returns maximum flash mintable amount
     * @dev Can be overridden to set custom limits
     */
    function maxFlashLoan(address token) public view virtual returns (uint256) {
        return token == address(this) ? type(uint256).max - totalSupply() : 0;
    }

    /**
     * @notice Returns flash mint fee (default: 0)
     * @dev Can be overridden to charge fees
     */
    function flashFee(address token, uint256 amount) public view virtual returns (uint256) {
        if (token != address(this)) {
            revert LRC20FlashMintUnsupportedToken(token);
        }
        return _flashFee(amount);
    }

    /**
     * @dev Internal fee calculation (default: 0)
     */
    function _flashFee(uint256 amount) internal view virtual returns (uint256) {
        return 0;
    }

    /**
     * @dev Internal fee receiver (default: address(0) = burn)
     */
    function _flashFeeReceiver() internal view virtual returns (address) {
        return address(0);
    }

    /**
     * @notice Execute flash mint
     */
    function flashLoan(
        ILRC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) public virtual returns (bool) {
        uint256 maxLoan = maxFlashLoan(token);
        if (amount > maxLoan) {
            revert LRC20FlashMintExceededMaxLoan(maxLoan);
        }

        uint256 fee = flashFee(token, amount);

        // Mint tokens to receiver
        _mint(address(receiver), amount);

        // Execute callback
        if (receiver.onFlashLoan(msg.sender, token, amount, fee, data) != CALLBACK_SUCCESS) {
            revert LRC20FlashMintCallbackFailed();
        }

        // Collect repayment + fee
        address feeReceiver = _flashFeeReceiver();
        _burn(address(receiver), amount);

        if (fee > 0 && feeReceiver != address(0)) {
            _transfer(address(receiver), feeReceiver, fee);
        } else if (fee > 0) {
            _burn(address(receiver), fee);
        }

        return true;
    }
}
```

## Rationale

### LRC-3156 Compatibility

Implements the standard flash loan interface (LP-3156) for:
- Interoperability with existing flash loan tooling
- Consistent borrower callback pattern
- Familiar developer experience

### Zero Default Fee

Default fee of 0 because:
- Minting has no opportunity cost
- Encourages protocol adoption
- Fee can be overridden by implementations

### Supply Cap Protection

`maxFlashLoan` prevents supply overflow by limiting flash mint to `type(uint256).max - totalSupply()`.

## Backwards Compatibility

This extension is fully backwards compatible with LRC-20:

- **Interface**: Extends `ILRC20` without modifying core functions
- **Storage**: Uses separate storage slots for flash mint parameters
- **Events**: Inherits LRC-20 events; no new events required
- **EIP-3156**: Compatible with EIP-3156 flash loan standard

Existing LRC-20 implementations can be upgraded by:
1. Inheriting `LRC20FlashMint` instead of `LRC20`
2. Overriding `_flashFee()` and `_flashFeeReceiver()` if custom fees desired
3. Adding reentrancy protection in callback receivers

## Use Cases

1. **Arbitrage**: Flash mint stablecoins for cross-DEX arbitrage
2. **Liquidations**: Flash mint to liquidate undercollateralized positions
3. **Collateral Swaps**: Flash mint to swap collateral without unwinding positions
4. **Self-Liquidation**: Flash mint to repay and withdraw in one transaction

## Security Considerations

1. **Reentrancy**: Flash mints execute untrusted callbacks; use reentrancy guards
2. **Callback Validation**: Verify `onFlashLoan` returns correct magic value
3. **Supply Overflow**: Validate max flash loan doesn't exceed uint256 max
4. **Fee Collection**: Ensure borrower has sufficient balance for repayment + fee

## Reference Implementation

- `~/work/lux/standard/contracts/tokens/LRC20/LRC20FlashMint.sol`

## Related LPs

- **LP-3020**: LRC-20 Fungible Token Standard (base)
- **LP-3156**: LRC-3156 Flash Loans (interface standard)

---

**Document Maintainer**: Lux Industries
**Last Updated**: 2025-12-25
