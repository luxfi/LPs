---
lp: 2029
title: LRC-20 Mintable Token Extension
description: Optional extension of the fungible token standard to allow authorized accounts to create new tokens
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-07-23
tags: [lrc, token-standard, evm]
requires: 2300
---

## Abstract

This extension adds minting capability to LRC-20 tokens, enabling designated accounts to generate new tokens within defined constraints.

## Motivation

Mintable tokens are essential for protocols requiring dynamic supply management, such as stablecoins, reward distributions, and governance tokens.

## Specification

```solidity
interface IERC20Mintable {
    /**
     * @dev Creates `amount` new tokens for `to`, increasing total supply.
     */
    function mint(address to, uint256 amount) external;
}
```

## Rationale

Token minting is a core extension for applications needing controlled supply issuance. This interface aligns with the common OpenZeppelin pattern for mintable tokens.

## Backwards Compatibility

This is a backwards-compatible, additive extension to LRC-20. Core token operations remain unaffected.

## Test Cases

Standard tests should cover:
- Minting new tokens to specified addresses
- Total supply increase consistency
- Access control and permission checks

## Reference Implementation

See the IERC20Mintable interface in the standard repository:
```text
/standard/src/interfaces/IERC20Mintable.sol
```

## Implementation

### LRC-20 Mintable Token Contracts

**Location**: `~/work/lux/standard/src/tokens/`
**GitHub**: [`github.com/luxfi/standard/tree/main/src/tokens`](https://github.com/luxfi/standard/tree/main/src/tokens)

**Core Contracts**:
- [`ERC20.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20.sol) - Base LRC-20 implementation
- [`ERC20Mintable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20Mintable.sol) - Mintable extension
- [`ERC20Burnable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20Burnable.sol) - Burnable extension
- [`Ownable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/Ownable.sol) - Access control for minting

**Minting Implementation**:
```solidity
// Example from ERC20Mintable.sol
function mint(address to, uint256 amount) external onlyMinter {
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Mint amount must be positive");

    _totalSupply += amount;
    _balances[to] += amount;

    emit Transfer(address(0), to, amount);
}
```

**Testing**:
```bash
cd ~/work/lux/standard
forge test --match-contract ERC20MintableTest
forge coverage --match-contract ERC20Mintable
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| mint | ~50,000 | ERC20 balance update + event |
| setMinter | ~20,000 | Access control change |
| renounceMinter | ~5,000 | Self-revoke minting rights |

## Security Considerations

- Restrict minting to authorized roles to prevent inflation attacks.
- Implement supply caps or governance checks as needed.
- Use AccessControl or Ownable patterns for role management.
- Emit events for all mint operations for auditability.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).