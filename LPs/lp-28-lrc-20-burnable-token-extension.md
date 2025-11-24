---
lp: 28
title: LRC-20 Burnable Token Extension
description: Optional extension of the fungible token standard to allow token holders to irreversibly destroy tokens
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-07-23
requires: 20
---

## Abstract

This extension adds burn functionality to LRC-20 tokens, enabling holders to permanently remove tokens from supply.

## Motivation

Standard LRC-20 tokens provide basic minting and transfer operations. Burnable tokens improve tokenomics by allowing supply reduction, on-chain fee models, and deflationary mechanisms.

## Specification

### Interface

```solidity
interface IERC20Burnable {
    /**
     * @dev Emitted when `value` tokens are burned from `account`.
     */
    event Burn(address indexed account, uint256 value);

    /**
     * @dev Destroys `amount` tokens from the caller, reducing total supply.
     * 
     * Emits a {Transfer} event with `to` set to the zero address.
     * Emits a {Burn} event.
     *
     * Requirements:
     * - `amount` must not exceed the caller's balance.
     */
    function burn(uint256 amount) external;

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's allowance.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     * Emits a {Burn} event.
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     * - `account` must have approved the caller for at least `amount` tokens.
     * - `amount` must not exceed `account`'s balance.
     */
    function burnFrom(address account, uint256 amount) external;
}
```

### Implementation Notes

1. **Event Emission**: Both `Transfer(account, address(0), amount)` and `Burn(account, amount)` events should be emitted for transparency and compatibility with existing tools.

2. **Total Supply**: The `totalSupply()` function must be decreased by the burned amount.

3. **Error Handling**: Use descriptive revert messages:
   ```solidity
   require(balanceOf[msg.sender] >= amount, "ERC20: burn amount exceeds balance");
   ```

## Rationale

Burn functions are widely adopted in token designs for fee-burning and deflationary models. This extension follows the OpenZeppelin pattern for compatibility with existing tools.

## Backwards Compatibility

This is a backwards-compatible extension. Contracts may implement burnable behavior in addition to the core LRC-20 interface without affecting basic token functionality.

## Test Cases

### Burn Function Tests
1. **Successful Burn**
   ```javascript
   // Initial: balance = 1000, totalSupply = 10000
   burn(100)
   // Result: balance = 900, totalSupply = 9900
   // Events: Transfer(user, 0x0, 100), Burn(user, 100)
   ```

2. **Burn Exceeds Balance**
   ```javascript
   // Balance = 100
   burn(200) // Should revert: "ERC20: burn amount exceeds balance"
   ```

3. **Burn Zero Amount**
   ```javascript
   burn(0) // Should succeed with no state changes
   ```

### BurnFrom Function Tests
1. **Successful BurnFrom**
   ```javascript
   // Alice approves Bob for 500
   // Alice balance = 1000
   burnFrom(alice, 200) // Called by Bob
   // Result: Alice balance = 800, Bob's allowance = 300
   ```

2. **BurnFrom Exceeds Allowance**
   ```javascript
   // Allowance = 100
   burnFrom(alice, 200) // Should revert: "ERC20: insufficient allowance"
   ```

3. **BurnFrom with Max Allowance**
   ```javascript
   // Allowance = type(uint256).max
   burnFrom(alice, 100)
   // Allowance should remain at max (no decrement)
   ```

## Reference Implementation

### Interface
See the IERC20Burnable interface in the standard repository:
```text
/standard/src/interfaces/IERC20Burnable.sol
```

### Example Implementation
```solidity
contract BurnableToken is ERC20, IERC20Burnable {
    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }
    
    function burnFrom(address account, uint256 amount) external override {
        uint256 currentAllowance = allowance[account][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        
        // Update allowance if not max
        if (currentAllowance != type(uint256).max) {
            _approve(account, msg.sender, currentAllowance - amount);
        }
        
        _burn(account, amount);
    }
    
    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from zero address");
        require(balanceOf[account] >= amount, "ERC20: burn amount exceeds balance");
        
        balanceOf[account] -= amount;
        totalSupply -= amount;
        
        emit Transfer(account, address(0), amount);
        emit Burn(account, amount);
    }
}
```

## Security Considerations

- Ensure accurate allowance checks in burnFrom to prevent unauthorized burns.
- Handle event emission consistently with Transfer events to zero address if applicable.

## Implementation

### Standard Library Location
**Repository**: `/Users/z/work/lux/standard/`

### Burnable Token Implementation
- **Source**: `/Users/z/work/lux/standard/src/ERC20Burnable.sol`
  - `burn(uint256)` function implementation
  - `burnFrom(address, uint256)` function implementation
  - Event emission for tracking

### Smart Contract Interface
```solidity
// Location: /Users/z/work/lux/standard/src/ERC20Burnable.sol
interface IERC20Burnable {
    event Burn(address indexed account, uint256 value);

    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}
```

### Integration with LRC-20 Base
- **Base Contract**: `/Users/z/work/lux/standard/src/ERC20.sol`
- **Extension Pattern**: Composition with access control via OpenZeppelin
- **Inheritance**: `contract BurnableToken is ERC20, IERC20Burnable`

### Testing Framework
```bash
cd /Users/z/work/lux/standard
# Run burnable token tests
forge test --match "Burn"

# Test burn functionality
forge test test/ERC20Burnable.sol -v
```

### Test Cases
- **Basic Burn**: `test_burn_reduces_balance`
- **BurnFrom**: `test_burnFrom_with_allowance`
- **Total Supply**: `test_burn_reduces_totalSupply`
- **Events**: `test_burn_emits_events`
- **Edge Cases**: `test_burn_zero_amount`, `test_burn_exceeds_balance`

### Deployment Example
```bash
# Deploy burnable token with initial supply
forge create src/ERC20Burnable.sol:BurnableToken \
  --constructor-args "BurnableToken" "BURN" "1000000000000000000000000" \
  --rpc-url http://localhost:9650/ext/bc/C

# Test burn on-chain
cast send <contract> "burn(uint256)" 1000000000000000000 \
  --rpc-url http://localhost:9650/ext/bc/C
```

### Use Cases
1. **Deflationary Tokens**: Programmatic supply reduction
2. **Fee Burning**: Burn transaction fees for economic security
3. **Token Buyback**: DAO treasury burns tokens via buyback program
4. **Emission Control**: Automatic supply limits via burn

### Example Implementation
```solidity
// Reference: /Users/z/work/lux/standard/src/ERC20Burnable.sol
contract BurnableToken is ERC20 {
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance[account][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");

        if (currentAllowance != type(uint256).max) {
            _approve(account, msg.sender, currentAllowance - amount);
        }

        _burn(account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from zero address");
        require(balanceOf[account] >= amount, "ERC20: burn exceeds balance");

        balanceOf[account] -= amount;
        totalSupply -= amount;

        emit Transfer(account, address(0), amount);
        emit Burn(account, amount);
    }
}
```

### GitHub References
- **Implementation**: https://github.com/luxfi/standard/blob/main/src/ERC20Burnable.sol
- **Test Suite**: https://github.com/luxfi/standard/tree/main/test
- **Examples**: https://github.com/luxfi/standard/tree/main/examples

### Integration Points
- **LP-20**: Base LRC-20 standard (required)
- **LP-27**: Token standards adoption
- **LP-26**: C-Chain deployment (EVM equivalence)

### OpenZeppelin Compatibility
- Compatible with OpenZeppelin's `ERC20Burnable` extension
- Same interface and behavior
- Drop-in replacement for Ethereum contracts

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).