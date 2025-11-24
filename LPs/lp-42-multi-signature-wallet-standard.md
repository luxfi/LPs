---
lp: 42
title: Multi-Signature Wallet Standard
description: Defines the standard for multi-signature wallets on Lux Network with quantum-safe options
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 1, 20, 40
---

## Abstract

This LP defines a standard interface for multi-signature wallets on the Lux Network, supporting traditional threshold signatures, time-locked transactions, and quantum-safe implementations. The standard ensures interoperability between different multi-sig implementations while providing flexibility for various security models.

## Motivation

Multi-signature wallets are critical for secure asset management, but current implementations suffer from:

1. **Incompatible Interfaces**: Different multi-sig wallets use different APIs
2. **Limited Features**: Most implementations lack advanced features like time locks
3. **No Quantum Safety**: Traditional ECDSA vulnerable to quantum attacks
4. **Poor UX**: Complex interaction patterns for users
5. **Cross-Chain Complexity**: No standard for multi-sig across Lux's chains

## Specification

### Core Multi-Sig Interface

```solidity
interface ILuxMultiSig {
    // Events
    event TransactionSubmitted(
        uint256 indexed transactionId,
        address indexed submitter,
        address indexed destination,
        uint256 value,
        bytes data
    );
    
    event TransactionConfirmed(
        uint256 indexed transactionId,
        address indexed owner
    );
    
    event TransactionRevoked(
        uint256 indexed transactionId,
        address indexed owner
    );
    
    event TransactionExecuted(
        uint256 indexed transactionId,
        bool success
    );
    
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event RequirementChanged(uint256 required);
    
    // Core multi-sig functions
    function submitTransaction(
        address destination,
        uint256 value,
        bytes memory data
    ) external returns (uint256 transactionId);
    
    function confirmTransaction(uint256 transactionId) external;
    function revokeConfirmation(uint256 transactionId) external;
    function executeTransaction(uint256 transactionId) external;
    
    // Management functions
    function addOwner(address owner) external;
    function removeOwner(address owner) external;
    function replaceOwner(address owner, address newOwner) external;
    function changeRequirement(uint256 required) external;
    
    // View functions
    function getOwners() external view returns (address[] memory);
    function getTransactionCount(bool pending, bool executed) external view returns (uint256);
    function getTransaction(uint256 transactionId) external view returns (
        address destination,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 confirmations
    );
    function getConfirmations(uint256 transactionId) external view returns (address[] memory);
    function isOwner(address owner) external view returns (bool);
    function required() external view returns (uint256);
}
```

### Transaction Structure

```solidity
struct Transaction {
    address destination;
    uint256 value;
    bytes data;
    bool executed;
    uint256 nonce;
    uint256 timestamp;
    uint256 confirmations;
    mapping(address => bool) isConfirmed;
}

struct TransactionRequest {
    address destination;
    uint256 value;
    bytes data;
    uint256 expiration;      // Optional expiration time
    uint256 delay;           // Optional execution delay
    bytes32 salt;            // For deterministic addresses
}
```

### Advanced Features

#### Time-Locked Transactions
```solidity
interface ITimeLockMultiSig is ILuxMultiSig {
    struct TimeLock {
        uint256 releaseTime;
        uint256 expiration;
        bool enforced;
    }
    
    event TransactionQueued(
        uint256 indexed transactionId,
        uint256 releaseTime
    );
    
    event TransactionCancelled(
        uint256 indexed transactionId
    );
    
    function submitTimeLockTransaction(
        address destination,
        uint256 value,
        bytes memory data,
        uint256 delay
    ) external returns (uint256 transactionId);
    
    function queueTransaction(uint256 transactionId) external;
    function cancelTransaction(uint256 transactionId) external;
    function getTimeLock(uint256 transactionId) external view returns (TimeLock memory);
}
```

#### Quantum-Safe Multi-Sig
```solidity
interface IQuantumSafeMultiSig is ILuxMultiSig {
    enum SignatureType {
        ECDSA,           // Traditional
        SPHINCS_PLUS,    // Post-quantum hash-based
        DILITHIUM,       // Post-quantum lattice-based
        HYBRID           // Both ECDSA and post-quantum
    }
    
    struct QuantumSafeOwner {
        address ecdsaAddress;
        bytes32 quantumPublicKeyHash;
        SignatureType signatureType;
        bool isActive;
    }
    
    event QuantumKeyRegistered(
        address indexed owner,
        bytes32 indexed publicKeyHash,
        SignatureType signatureType
    );
    
    function registerQuantumKey(
        bytes memory quantumPublicKey,
        SignatureType signatureType
    ) external;
    
    function confirmTransactionQuantum(
        uint256 transactionId,
        bytes memory quantumSignature
    ) external;
    
    function getQuantumOwner(address owner) external view returns (QuantumSafeOwner memory);
    function verifyQuantumSignature(
        bytes32 messageHash,
        bytes memory signature,
        bytes32 publicKeyHash
    ) external view returns (bool);
}
```

### Role-Based Access Control

```solidity
interface IRoleBasedMultiSig is ILuxMultiSig {
    enum Role {
        VIEWER,          // Can view transactions
        SUBMITTER,       // Can submit transactions
        APPROVER,        // Can approve transactions
        EXECUTOR,        // Can execute approved transactions
        ADMIN            // Can manage roles and owners
    }
    
    struct RoleConfig {
        uint256 requiredApprovals;
        uint256 dailyLimit;
        uint256 transactionLimit;
        bool canManageRoles;
    }
    
    event RoleAssigned(address indexed account, Role role);
    event RoleRevoked(address indexed account, Role role);
    event RoleConfigUpdated(Role role, RoleConfig config);
    
    function assignRole(address account, Role role) external;
    function revokeRole(address account, Role role) external;
    function hasRole(address account, Role role) external view returns (bool);
    function getRoleConfig(Role role) external view returns (RoleConfig memory);
    function setRoleConfig(Role role, RoleConfig memory config) external;
}
```

### Cross-Chain Multi-Sig

```solidity
interface ICrossChainMultiSig is ILuxMultiSig {
    struct CrossChainTransaction {
        uint256 transactionId;
        string sourceChain;
        string destinationChain;
        address destination;
        uint256 value;
        bytes data;
        uint256 requiredConfirmations;
        mapping(string => mapping(address => bool)) chainConfirmations;
    }
    
    event CrossChainTransactionSubmitted(
        uint256 indexed transactionId,
        string sourceChain,
        string destinationChain
    );
    
    event CrossChainConfirmation(
        uint256 indexed transactionId,
        string chain,
        address owner
    );
    
    function submitCrossChainTransaction(
        string memory destinationChain,
        address destination,
        uint256 value,
        bytes memory data
    ) external returns (uint256 transactionId);
    
    function confirmCrossChainTransaction(
        uint256 transactionId,
        string memory chain
    ) external;
    
    function getCrossChainConfirmations(
        uint256 transactionId
    ) external view returns (
        string[] memory chains,
        address[][] memory confirmers
    );
}
```

### Wallet Factory

```solidity
interface IMultiSigFactory {
    event WalletCreated(
        address indexed wallet,
        address[] owners,
        uint256 required,
        uint256 salt
    );
    
    function createWallet(
        address[] memory owners,
        uint256 required
    ) external returns (address wallet);
    
    function createDeterministicWallet(
        address[] memory owners,
        uint256 required,
        uint256 salt
    ) external returns (address wallet);
    
    function createQuantumSafeWallet(
        address[] memory owners,
        uint256 required,
        bool enforceQuantum
    ) external returns (address wallet);
    
    function computeAddress(
        address[] memory owners,
        uint256 required,
        uint256 salt
    ) external view returns (address);
    
    function getWallets(address owner) external view returns (address[] memory);
}
```

### Recovery Mechanisms

```solidity
interface IRecoverableMultiSig is ILuxMultiSig {
    struct RecoveryRequest {
        address newOwner;
        address ownerToReplace;
        uint256 confirmations;
        uint256 timestamp;
        bool executed;
    }
    
    event RecoveryInitiated(
        uint256 indexed recoveryId,
        address indexed newOwner,
        address indexed ownerToReplace
    );
    
    event RecoveryConfirmed(
        uint256 indexed recoveryId,
        address indexed guardian
    );
    
    event RecoveryExecuted(
        uint256 indexed recoveryId,
        address indexed newOwner,
        address indexed replacedOwner
    );
    
    function initiateRecovery(
        address ownerToReplace,
        address newOwner
    ) external returns (uint256 recoveryId);
    
    function confirmRecovery(uint256 recoveryId) external;
    function executeRecovery(uint256 recoveryId) external;
    function cancelRecovery(uint256 recoveryId) external;
    
    function addGuardian(address guardian) external;
    function removeGuardian(address guardian) external;
    function getGuardians() external view returns (address[] memory);
}
```

### Gas Optimization

```solidity
library MultiSigStorage {
    struct Layout {
        address[] owners;
        mapping(address => bool) isOwner;
        uint256 required;
        mapping(uint256 => Transaction) transactions;
        uint256 transactionCount;
        mapping(address => mapping(uint256 => bool)) confirmations;
    }
    
    bytes32 internal constant STORAGE_SLOT = 
        keccak256("lux.contracts.storage.MultiSig");
    
    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
```

## Rationale

### Design Decisions

1. **Modular Architecture**: Core interface with optional advanced features
2. **Quantum-Safe Options**: Future-proof against quantum threats
3. **Role-Based Access**: Fine-grained permissions for organizations
4. **Cross-Chain Native**: Built for Lux's multi-chain architecture
5. **Gas Efficient**: Optimized storage patterns

### Security Considerations

1. **Signature Validation**: Multiple signature schemes supported
2. **Time Locks**: Prevent rushed malicious transactions
3. **Recovery Options**: Social recovery for lost keys
4. **Access Control**: Role-based permissions
5. **Deterministic Addresses**: Predictable wallet addresses

## Backwards Compatibility

Compatible with:
- Gnosis Safe patterns
- Standard multi-sig wallets
- LRC-20 token operations
- Existing wallet interfaces (LP-40)

## Test Cases

### Basic Multi-Sig Test
```solidity
function testBasicMultiSig() public {
    // Create 3-of-5 multi-sig
    address[] memory owners = new address[](5);
    for (uint i = 0; i < 5; i++) {
        owners[i] = address(uint160(i + 1));
    }
    
    ILuxMultiSig wallet = factory.createWallet(owners, 3);
    
    // Submit transaction
    uint256 txId = wallet.submitTransaction(
        recipient,
        1 ether,
        ""
    );
    
    // Confirm by 3 owners
    vm.prank(owners[0]);
    wallet.confirmTransaction(txId);
    
    vm.prank(owners[1]);
    wallet.confirmTransaction(txId);
    
    vm.prank(owners[2]);
    wallet.confirmTransaction(txId);
    
    // Execute
    wallet.executeTransaction(txId);
    
    // Verify execution
    (,,,bool executed,) = wallet.getTransaction(txId);
    assertTrue(executed);
}
```

### Time-Lock Test
```solidity
function testTimeLock() public {
    ITimeLockMultiSig wallet = ITimeLockMultiSig(multiSigAddress);
    
    // Submit time-locked transaction (24 hour delay)
    uint256 txId = wallet.submitTimeLockTransaction(
        recipient,
        1 ether,
        "",
        24 hours
    );
    
    // Confirm and queue
    confirmByOwners(txId, 3);
    wallet.queueTransaction(txId);
    
    // Try immediate execution (should fail)
    vm.expectRevert("TimeLock: not ready");
    wallet.executeTransaction(txId);
    
    // Fast forward 24 hours
    vm.warp(block.timestamp + 24 hours);
    
    // Now execution succeeds
    wallet.executeTransaction(txId);
}
```

### Quantum-Safe Test
```solidity
function testQuantumSafe() public {
    IQuantumSafeMultiSig wallet = IQuantumSafeMultiSig(multiSigAddress);
    
    // Register quantum key
    bytes memory publicKey = generateSphincsPlusPublicKey();
    wallet.registerQuantumKey(publicKey, SignatureType.SPHINCS_PLUS);
    
    // Submit transaction
    uint256 txId = wallet.submitTransaction(recipient, 1 ether, "");
    
    // Create quantum signature
    bytes memory signature = signWithSphincsPlusPrivateKey(
        keccak256(abi.encode(txId)),
        privateKey
    );
    
    // Confirm with quantum signature
    wallet.confirmTransactionQuantum(txId, signature);
    
    // Verify quantum owner setup
    QuantumSafeOwner memory owner = wallet.getQuantumOwner(msg.sender);
    assertEq(owner.signatureType, SignatureType.SPHINCS_PLUS);
}
```

## Reference Implementation

Reference implementation available at:
https://github.com/luxdefi/safe

Key features:
- Gnosis Safe compatible
- Quantum-safe signature support
- Cross-chain transaction coordination
- Hardware wallet integration

## Implementation

### Multi-Signature Wallet Contracts

**Location**: `~/work/lux/standard/src/wallets/multisig/`
**GitHub**: [`github.com/luxfi/standard/tree/main/src/wallets/multisig`](https://github.com/luxfi/standard/tree/main/src/wallets/multisig)

**Core Contracts**:
- [`LuxMultiSig.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/multisig/LuxMultiSig.sol) - Base multi-sig implementation
- [`TimeLockMultiSig.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/multisig/TimeLockMultiSig.sol) - Time-locked transactions
- [`QuantumSafeMultiSig.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/multisig/QuantumSafeMultiSig.sol) - Quantum-safe signing
- [`MultiSigFactory.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/multisig/MultiSigFactory.sol) - Wallet factory
- [`RoleBasedMultiSig.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/multisig/RoleBasedMultiSig.sol) - Role-based access

**Factory Deployment Example**:
```solidity
// From MultiSigFactory.sol
function createWallet(
    address[] memory owners,
    uint256 required
) external returns (address wallet) {
    require(owners.length >= required, "Invalid threshold");
    require(required > 0, "Required must be > 0");

    wallet = address(new LuxMultiSig(owners, required));

    emit WalletCreated(wallet, owners, required, 0);
}

function createDeterministicWallet(
    address[] memory owners,
    uint256 required,
    uint256 salt
) external returns (address wallet) {
    bytes memory bytecode = abi.encodePacked(
        type(LuxMultiSig).creationCode,
        abi.encode(owners, required)
    );

    bytes32 hash = keccak256(abi.encodePacked(bytecode, salt));
    wallet = address(new Create2Deployer()).deploy(bytecode, salt);

    emit WalletCreated(wallet, owners, required, salt);
}
```

**Testing**:
```bash
cd ~/work/lux/standard
forge test --match-contract LuxMultiSigTest
forge coverage --match-contract LuxMultiSig

# Load test
forge test --match-contract MultiSigLoadTest -vv
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| Submit transaction | ~80,000 | Storage + event |
| Confirm transaction | ~50,000 | Storage update |
| Execute (3-of-5) | ~200,000 | All approvals + execution |
| Add owner | ~40,000 | Storage + event |
| Time-lock confirm | ~60,000 | Release time check |
| Quantum signature | ~250,000 | ML-DSA verification |

## Security Considerations

### Signature Security
- Validate all signatures before execution
- Support multiple signature schemes (ECDSA, ML-DSA, secp256r1)
- Implement replay protection via nonces
- Use EIP-191 message hashing standard

### Access Control
- Strict owner management with events
- Role-based permissions (VIEWER, SUBMITTER, APPROVER, EXECUTOR, ADMIN)
- Time-locked sensitive operations (24-72 hour delays)
- Guardian-based recovery with social recovery options

### Quantum Safety
- Post-quantum signature algorithms (ML-DSA-65, SLH-DSA)
- Hybrid signing modes (classical + PQ required)
- Key rotation mechanisms via DKG protocol
- Future algorithm upgrades via governance

### Cross-Chain Security
- Message authentication across chains via Warp
- Atomic execution guarantees with lock patterns
- Proper error handling with revert messages
- Chain reorganization handling via finality windows

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).