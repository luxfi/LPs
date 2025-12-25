---
lp: 10579
title: LRC-7579 Modular Smart Accounts
description: Standard interface for modular smart account plugins
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
requires: 7337, 4271
tags: [lrc, account-abstraction, wallet]
order: 520
---

# LP-3579: LRC-7579 Minimal Modular Smart Accounts

## Abstract

LRC-7579 defines a minimal interface for modular smart accounts, enabling wallets to install, configure, and use pluggable modules for validation, execution, hooks, and fallbacks.

## Motivation

Smart accounts need extensibility:
- Custom validation logic (multisig, passkey, social)
- Execution permissions (spending limits, time locks)
- Hooks for automation (auto-save, notifications)
- Fallback handlers for unknown calls

LRC-7579 provides:
- Standard module interface
- Installation/uninstallation flow
- Configuration management
- Security boundaries

## Specification

### Module Types

```solidity
enum ModuleType {
    Validator,     // 1: Validates user operations
    Executor,      // 2: Can execute calls on account
    Fallback,      // 3: Handles unknown function calls
    Hook           // 4: Pre/post execution hooks
}
```solidity

### Account Interface

```solidity
interface ILRC7579Account {
    // Module management
    function installModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata initData
    ) external;
    
    function uninstallModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata deInitData
    ) external;
    
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) external view returns (bool);
    
    // Execution
    function execute(
        bytes32 mode,
        bytes calldata executionCalldata
    ) external;
    
    function executeFromExecutor(
        bytes32 mode,
        bytes calldata executionCalldata
    ) external returns (bytes[] memory);
    
    // Account info
    function accountId() external view returns (string memory);
    function supportsExecutionMode(bytes32 mode) external view returns (bool);
    function supportsModule(uint256 moduleTypeId) external view returns (bool);
}
```

### Validator Module

```solidity
interface IValidator {
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) external returns (uint256 validationData);
    
    function isValidSignatureWithSender(
        address sender,
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4);
}

// Example: Passkey validator
contract PasskeyValidator is IValidator {
    mapping(address => bytes) public accountCredentials;
    
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) external returns (uint256) {
        bytes memory credential = accountCredentials[msg.sender];
        
        if (verifyPasskey(userOpHash, userOp.signature, credential)) {
            return 0; // Valid
        }
        return 1; // Invalid
    }
}
```solidity

### Executor Module

```solidity
interface IExecutor {
    function executeOnAccount(
        address account,
        bytes calldata executionData
    ) external returns (bytes memory);
}

// Example: Scheduled executor
contract ScheduledExecutor is IExecutor {
    struct ScheduledTask {
        uint256 executeAfter;
        bytes callData;
    }
    
    mapping(address => ScheduledTask[]) public tasks;
    
    function addTask(bytes calldata callData, uint256 delay) external {
        tasks[msg.sender].push(ScheduledTask({
            executeAfter: block.timestamp + delay,
            callData: callData
        }));
    }
    
    function executeDue(address account) external {
        // Execute any due tasks via account.executeFromExecutor
    }
}
```

### Hook Module

```solidity
interface IHook {
    function preCheck(
        address msgSender,
        uint256 msgValue,
        bytes calldata msgData
    ) external returns (bytes memory hookData);
    
    function postCheck(
        bytes calldata hookData
    ) external;
}

// Example: Spending limit hook
contract SpendingLimitHook is IHook {
    mapping(address => uint256) public dailySpent;
    mapping(address => uint256) public dailyLimit;
    
    function preCheck(
        address,
        uint256 msgValue,
        bytes calldata
    ) external returns (bytes memory) {
        require(
            dailySpent[msg.sender] + msgValue <= dailyLimit[msg.sender],
            "Limit exceeded"
        );
        return abi.encode(msgValue);
    }
    
    function postCheck(bytes calldata hookData) external {
        uint256 spent = abi.decode(hookData, (uint256));
        dailySpent[msg.sender] += spent;
    }
}
```solidity

### Execution Modes

```solidity
// Mode encoding: 1 byte call type | 1 byte exec type | 4 bytes reserved | 22 bytes data
bytes32 constant SINGLE_CALL = 0x00...;
bytes32 constant BATCH_CALL = 0x01...;
bytes32 constant DELEGATECALL = 0xff...;
```

## Use Cases

### Social Recovery Wallet
```solidity
// Install validator for main owner
account.installModule(1, eoaValidator, ownerKey);

// Install validator for guardians
account.installModule(1, multisigValidator, guardianKeys);

// Install hook for spending limits
account.installModule(4, spendingHook, limits);
```solidity

### Enterprise Wallet
```solidity
// Validator: Hardware security module
account.installModule(1, hsmValidator, hsmConfig);

// Executor: Payroll automation
account.installModule(2, payrollExecutor, schedule);

// Hook: Compliance checks
account.installModule(4, complianceHook, policies);
```

## Rationale

- Minimal interface for maximum composability
- Type-based modules enable clear separation
- Hook system provides execution control
- Fallback handlers enable extensibility

## Backwards Compatibility

This standard is fully backwards compatible with existing contracts and infrastructure. The standard is additive and does not modify existing functionality.

## Security Considerations

- Module installation must be protected
- Hooks can block execution (DoS risk)
- Executor permissions carefully scoped
- Module upgrade paths needed

## References

- [ERC-7579: Minimal Modular Smart Accounts](https://eips.ethereum.org/EIPS/eip-7579)
- [LP-3337: LRC-4337 Account Abstraction](./lp-3337-lrc-4337-account-abstraction.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
