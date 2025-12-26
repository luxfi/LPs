---
lp: 3024
title: LRC-20 Capped Extension
description: Maximum supply cap extension for LRC-20 tokens
author: Lux Industries (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-12-25
requires: [3020]
tags: [lrc-20, token, capped, supply]
order: 3024
---

# LP-3024: LRC-20 Capped Extension

## Abstract

This LP defines the Capped extension for LRC-20 tokens, allowing tokens to have a maximum supply limit that cannot be exceeded.

## Motivation

Many token economies require a hard cap on total supply to:
- Create scarcity and deflationary pressure
- Provide predictable tokenomics
- Prevent unlimited inflation
- Enable fair distribution models

## Specification

### Interface

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./ILRC20.sol";

/**
 * @title ILRC20Capped
 * @notice LRC-20 extension with maximum supply cap
 */
interface ILRC20Capped is ILRC20 {
    /**
     * @notice Returns the maximum token supply
     * @return The cap on total supply
     */
    function cap() external view returns (uint256);
}
```

### Implementation

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import "./LRC20.sol";

/**
 * @title LRC20Capped
 * @notice LRC-20 token with a cap on total supply
 */
abstract contract LRC20Capped is LRC20 {
    uint256 private immutable _cap;

    /**
     * @notice Error thrown when cap is exceeded
     */
    error LRC20ExceededCap(uint256 increasedSupply, uint256 cap);

    /**
     * @notice Error thrown when cap is zero
     */
    error LRC20InvalidCap(uint256 cap);

    /**
     * @notice Sets the value of the cap
     * @param cap_ The maximum token supply
     */
    constructor(uint256 cap_) {
        if (cap_ == 0) {
            revert LRC20InvalidCap(0);
        }
        _cap = cap_;
    }

    /**
     * @notice Returns the cap on the token's total supply
     */
    function cap() public view virtual returns (uint256) {
        return _cap;
    }

    /**
     * @dev Override mint to enforce cap
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        super._update(from, to, value);

        if (from == address(0)) {
            uint256 maxSupply = cap();
            uint256 supply = totalSupply();
            if (supply > maxSupply) {
                revert LRC20ExceededCap(supply, maxSupply);
            }
        }
    }
}
```

## Rationale

### Immutable Cap

The cap is set as `immutable` to:
- Guarantee supply limits cannot be changed
- Reduce gas costs for cap queries
- Provide stronger security guarantees

### Mint-Time Enforcement

The cap is enforced during minting via `_update` override to:
- Catch violations at the earliest point
- Provide clear error messages
- Maintain compatibility with burn operations

## Backwards Compatibility

This extension is fully compatible with LRC-20 (LP-3020). Tokens implementing this extension remain standard LRC-20 tokens with additional supply guarantees.

## Security Considerations

1. **Cap Validation**: Ensure cap is greater than zero at deployment
2. **Initial Supply**: Initial supply should not exceed the cap
3. **Immutability**: Cap cannot be changed after deployment

## Reference Implementation

- `~/work/lux/standard/contracts/tokens/LRC20/LRC20Capped.sol`

## Related LPs

- **LP-3020**: LRC-20 Fungible Token Standard (base)
- **LP-3022**: LRC-20 Mintable Extension

---

**Document Maintainer**: Lux Industries
**Last Updated**: 2025-12-25
