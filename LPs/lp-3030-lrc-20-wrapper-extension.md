---
lp: 3030
title: LRC-20 Wrapper Extension
description: Token wrapper extension for converting between LRC-20 tokens
author: Lux Industries (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-12-25
requires: [3020]
tags: [lrc-20, token, wrapper, wrapped-token]
order: 3030
---

# LP-3030: LRC-20 Wrapper Extension

## Abstract

This LP defines the Wrapper extension for LRC-20 tokens, enabling 1:1 wrapping and unwrapping of underlying tokens.

## Motivation

Token wrapping is essential for:
- Bridging tokens between chains (e.g., WETH, WLUX)
- Adding functionality to existing tokens
- Creating standardized versions of non-standard tokens
- Enabling governance on external tokens

## Specification

### Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./ILRC20.sol";

/**
 * @title ILRC20Wrapper
 * @notice LRC-20 extension for wrapping underlying tokens
 */
interface ILRC20Wrapper is ILRC20 {
    /**
     * @notice Returns the underlying token
     * @return The wrapped token address
     */
    function underlying() external view returns (ILRC20);

    /**
     * @notice Deposit underlying tokens and mint wrapped tokens
     * @param account Recipient of wrapped tokens
     * @param amount Amount to wrap
     * @return Wrapped amount
     */
    function depositFor(address account, uint256 amount) external returns (bool);

    /**
     * @notice Burn wrapped tokens and withdraw underlying
     * @param account Recipient of underlying tokens
     * @param amount Amount to unwrap
     * @return Unwrapped amount
     */
    function withdrawTo(address account, uint256 amount) external returns (bool);
}
```

### Implementation

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./LRC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LRC20Wrapper
 * @notice LRC-20 that wraps an underlying LRC-20 token
 */
abstract contract LRC20Wrapper is LRC20 {
    using SafeERC20 for ILRC20;

    ILRC20 private immutable _underlying;

    error LRC20WrapperInvalidUnderlying(address token);
    error LRC20WrapperInvalidSender(address sender);
    error LRC20WrapperInvalidReceiver(address receiver);

    /**
     * @notice Initialize wrapper with underlying token
     * @param underlyingToken The token to wrap
     */
    constructor(ILRC20 underlyingToken) {
        if (address(underlyingToken) == address(this)) {
            revert LRC20WrapperInvalidUnderlying(address(this));
        }
        _underlying = underlyingToken;
    }

    /**
     * @notice Returns the underlying token
     */
    function underlying() public view virtual returns (ILRC20) {
        return _underlying;
    }

    /**
     * @notice Returns decimals matching underlying
     */
    function decimals() public view virtual override returns (uint8) {
        try ILRC20Metadata(address(_underlying)).decimals() returns (uint8 value) {
            return value;
        } catch {
            return super.decimals();
        }
    }

    /**
     * @notice Deposit underlying and mint wrapped tokens
     * @param account Recipient
     * @param amount Amount to wrap
     */
    function depositFor(address account, uint256 amount) public virtual returns (bool) {
        if (account == address(this)) {
            revert LRC20WrapperInvalidReceiver(account);
        }
        _underlying.safeTransferFrom(msg.sender, address(this), amount);
        _mint(account, amount);
        return true;
    }

    /**
     * @notice Burn wrapped tokens and withdraw underlying
     * @param account Recipient
     * @param amount Amount to unwrap
     */
    function withdrawTo(address account, uint256 amount) public virtual returns (bool) {
        if (account == address(this)) {
            revert LRC20WrapperInvalidReceiver(account);
        }
        _burn(msg.sender, amount);
        _underlying.safeTransfer(account, amount);
        return true;
    }

    /**
     * @notice Recover accidentally sent tokens
     * @param account Recipient
     */
    function _recover(address account) internal virtual returns (uint256) {
        uint256 value = _underlying.balanceOf(address(this)) - totalSupply();
        _mint(account, value);
        return value;
    }
}
```

### Native Token Wrapper (WLUX)

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./LRC20.sol";

/**
 * @title WLUX
 * @notice Wrapped LUX - native token wrapper
 */
contract WLUX is LRC20 {
    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);

    constructor() LRC20("Wrapped LUX", "WLUX") {}

    /**
     * @notice Deposit native LUX and receive WLUX
     */
    function deposit() public payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Burn WLUX and withdraw native LUX
     * @param amount Amount to unwrap
     */
    function withdraw(uint256 amount) public {
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Fallback to deposit on ETH receive
     */
    receive() external payable {
        deposit();
    }
}
```

## Rationale

### 1:1 Backing

Wrapper maintains 1:1 backing to:
- Ensure full redeemability
- Prevent fractional reserve risks
- Maintain price parity

### SafeERC20 Usage

Uses `SafeERC20` to:
- Handle non-standard tokens (no return value)
- Prevent transfer failures
- Support USDT-style tokens

### Recovery Mechanism

`_recover` function handles:
- Accidentally sent tokens
- Donation accounting
- Admin recovery operations

## Use Cases

1. **WLUX**: Wrap native LUX for DeFi compatibility
2. **Governance Wrappers**: Add voting to existing tokens
3. **Bridge Tokens**: Create chain-specific wrapped versions
4. **Upgrade Paths**: Wrap legacy tokens for new functionality

## Security Considerations

1. **Self-Wrapping**: Prevent wrapping the wrapper itself
2. **Zero Address**: Validate recipients are not zero address
3. **Recovery Access**: Protect `_recover` with access control
4. **Decimal Matching**: Ensure decimals match underlying

## Reference Implementation

- `~/work/lux/standard/contracts/tokens/LRC20/LRC20Wrapper.sol`
- `~/work/lux/standard/contracts/tokens/WLUX.sol`

## Related LPs

- **LP-3020**: LRC-20 Fungible Token Standard (base)
- **LP-3023**: LRC-20 Bridgable Extension
- **LP-3800**: Bridged Asset Standard

---

**Document Maintainer**: Lux Industries
**Last Updated**: 2025-12-25
