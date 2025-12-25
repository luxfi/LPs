---
lp: 4363
title: LRC-1363 Payable Token
description: Token with transferAndCall for single-transaction token payments
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
requires: 3020
tags: [lrc, token-standard, defi]
order: 170
---

# LP-3363: LRC-1363 Payable Token

## Abstract

LRC-1363 extends LRC-20 with `transferAndCall` and `approveAndCall` functions, enabling tokens to notify receiving contracts in a single transaction. Compatible with ERC-1363.

## Motivation

Standard LRC-20 requires two transactions for token payments:
1. User approves contract
2. Contract pulls tokens

LRC-1363 enables single-transaction payments:
1. User calls `transferAndCall`
2. Contract receives tokens + callback

## Specification

### Interface

```solidity
interface ILRC1363 is ILRC20 {
    function transferAndCall(address to, uint256 value) external returns (bool);
    
    function transferAndCall(
        address to, 
        uint256 value, 
        bytes calldata data
    ) external returns (bool);
    
    function transferFromAndCall(
        address from, 
        address to, 
        uint256 value
    ) external returns (bool);
    
    function transferFromAndCall(
        address from, 
        address to, 
        uint256 value, 
        bytes calldata data
    ) external returns (bool);
    
    function approveAndCall(
        address spender, 
        uint256 value
    ) external returns (bool);
    
    function approveAndCall(
        address spender, 
        uint256 value, 
        bytes calldata data
    ) external returns (bool);
}
```

### Receiver Interface

```solidity
interface ILRC1363Receiver {
    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);
}

interface ILRC1363Spender {
    function onApprovalReceived(
        address owner,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);
}
```

### Implementation

```solidity
contract LRC1363Token is LRC20, ILRC1363 {
    function transferAndCall(
        address to, 
        uint256 value, 
        bytes calldata data
    ) public returns (bool) {
        require(transfer(to, value), "Transfer failed");
        require(
            _checkOnTransferReceived(msg.sender, msg.sender, to, value, data),
            "Receiver rejected"
        );
        return true;
    }
    
    function _checkOnTransferReceived(
        address operator,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length == 0) return true;
        
        try ILRC1363Receiver(to).onTransferReceived(
            operator, from, value, data
        ) returns (bytes4 retval) {
            return retval == ILRC1363Receiver.onTransferReceived.selector;
        } catch {
            return false;
        }
    }
}
```

### Magic Values

```solidity
bytes4 constant RECEIVER_MAGIC = 0x88a7ca5c; // onTransferReceived selector
bytes4 constant SPENDER_MAGIC = 0x7b04a2d0;  // onApprovalReceived selector
```

## Use Cases

### Token Payments
```solidity
contract Merchant is ILRC1363Receiver {
    function onTransferReceived(
        address, address from, uint256 value, bytes calldata data
    ) external returns (bytes4) {
        bytes32 orderId = abi.decode(data, (bytes32));
        processOrder(orderId, from, value);
        return this.onTransferReceived.selector;
    }
}
```

### Staking
```solidity
contract StakingPool is ILRC1363Receiver {
    function onTransferReceived(
        address, address from, uint256 value, bytes calldata
    ) external returns (bytes4) {
        stakes[from] += value;
        return this.onTransferReceived.selector;
    }
}
```

## Rationale

- Single transaction improves UX
- Callback pattern proven (ERC-721)
- Backwards compatible with LRC-20

## Backwards Compatibility

This standard is fully backwards compatible with existing contracts and infrastructure. The standard is additive and does not modify existing functionality.

## Reference Implementation

**Repository**: [https://github.com/luxfi/standard](https://github.com/luxfi/standard)
**Local Path**: `/Users/z/work/lux/standard/`

### Contracts

| Contract | Description |
|----------|-------------|
| [`lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC1363.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC1363.sol) | ERC20 with transfer callbacks |

### Interfaces

- [`lib/openzeppelin-contracts/contracts/interfaces/IERC1363.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/interfaces/IERC1363.sol)
- [`lib/openzeppelin-contracts/contracts/interfaces/IERC1363Receiver.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/interfaces/IERC1363Receiver.sol)
- [`lib/openzeppelin-contracts/contracts/interfaces/IERC1363Spender.sol`](~/work/lux/standard/lib/openzeppelin-contracts/contracts/interfaces/IERC1363Spender.sol)

### Build and Test

```bash
cd /Users/z/work/lux/standard/

# Build all contracts
forge build

# Run tests
forge test -vvv

# Gas report
forge test --gas-report
```
## Security Considerations

- Reentrancy guard required in receivers
- Callback gas limits enforced
- Receiver validation prevents stuck tokens

## References

- [ERC-1363: Payable Token](https://eips.ethereum.org/EIPS/eip-1363)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
