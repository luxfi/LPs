---
lp: 0335
title: Bridge Smart Contract Integration
description: Specification for bridge smart contract integration with T-Chain MPC threshold signatures and B-Chain bridge coordination
author: Lux Partners (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Bridge
created: 2025-12-11
requires: 13, 14, 15, 17, 19, 301, 330, 331, 332
---

## Abstract

This LP specifies the smart contract architecture for integrating the Lux Bridge with T-Chain's Multi-Party Computation (MPC) threshold signature infrastructure and B-Chain's bridge coordination layer. The bridge contract suite enables trustless, decentralized cross-chain asset transfers by verifying threshold signatures produced by the T-Chain validator committee. The specification covers five core contracts: BridgeVault (asset custody), BridgeRouter (transaction routing), TokenRegistry (cross-chain asset mapping), BridgeGovernor (parameter governance), and EmergencyBrake (circuit breaker). Together, these contracts provide a complete, auditable on-chain bridge system that replaces centralized custody with cryptographic guarantees from CGG21/CGGMP21 threshold ECDSA signatures, enabling secure transfers between LUX, ZOO, Ethereum, Base, Arbitrum, and other EVM-compatible chains.

## Related Specifications

This LP is part of the Teleport Bridge architecture and coordinates with:

- **[LP-0330](./lp-0330-t-chain-thresholdvm-specification.md)**: T-Chain ThresholdVM - MPC key generation and threshold signatures
- **[LP-0331](./lp-0331-b-chain-bridgevm-specification.md)**: B-Chain BridgeVM - Bridge operation coordination and asset tracking
- **[LP-0332](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md)**: Teleport Architecture - Unified cross-chain protocol overview
- **[LP-0333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md)**: LSS Protocol - Dynamic signer rotation without key changes
- **[LP-0334](./lp-0334-per-asset-threshold-key-management.md)**: Per-Asset Keys - Asset-specific threshold key management

## Motivation

Cross-chain bridges are high-value targets with billions lost to exploits. The Lux Bridge contract integration addresses these risks through:

1. **Decentralized Custody**: MPC threshold signatures eliminate single points of failure. No individual party controls bridge funds; a 2/3+1 threshold of validators must cooperate to authorize releases.

2. **On-Chain Verification**: All signature verification occurs on-chain via ECDSA recovery, providing full transparency and auditability. The T-Chain MPC signer address is the sole authority for release authorization.

3. **Replay Protection**: Nonce-based transaction tracking prevents signature reuse. Each release operation requires a unique transaction identifier that is permanently recorded on-chain.

4. **Layered Security**: Multiple defensive mechanisms including emergency pause, transfer limits, fee governance, and upgrade timelocks provide defense-in-depth.

5. **Interoperability**: Standardized interfaces enable consistent integration across all supported chains (LUX, ZOO, ETH, Base, Arbitrum) while respecting each chain's unique characteristics.

6. **Economic Alignment**: Fee distribution and governance mechanisms align incentives between bridge operators, validators, and users.

## Specification

### 1. Contract Architecture Overview

```
+------------------+     +------------------+     +------------------+
|   BridgeRouter   |---->|   BridgeVault    |---->|  TokenRegistry   |
|   (Entry Point)  |     |  (Asset Custody) |     | (Asset Mapping)  |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| BridgeGovernor   |     | EmergencyBrake   |     |   ERC20/Native   |
|  (Governance)    |     | (Circuit Breaker)|     |    (Assets)      |
+------------------+     +------------------+     +------------------+
         |
         v
+------------------+
|    T-Chain MPC   |
| (Threshold Sig)  |
+------------------+
```

### 2. BridgeVault Contract

The BridgeVault contract holds bridged assets and releases them upon valid MPC signature verification.

#### 2.1 Interface Definition

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IBridgeVault
 * @notice Interface for the Lux Bridge Vault contract
 * @dev See LP-0335 for specification details
 */
interface IBridgeVault {
    // ============ Events ============

    /**
     * @notice Emitted when assets are deposited into the vault
     * @param token Token address (address(0) for native)
     * @param depositor Address that deposited
     * @param amount Amount deposited
     * @param destinationChainId Target chain identifier
     * @param recipient Recipient address on destination chain
     * @param nonce Unique deposit nonce
     */
    event Deposit(
        address indexed token,
        address indexed depositor,
        uint256 amount,
        bytes32 indexed destinationChainId,
        bytes32 recipient,
        uint256 nonce
    );

    /**
     * @notice Emitted when assets are released from the vault
     * @param token Token address (address(0) for native)
     * @param recipient Address receiving the release
     * @param amount Amount released
     * @param sourceChainId Source chain identifier
     * @param sourceTxHash Transaction hash from source chain
     * @param nonce Unique release nonce
     */
    event Release(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        bytes32 indexed sourceChainId,
        bytes32 sourceTxHash,
        uint256 nonce
    );

    /**
     * @notice Emitted when MPC signer address is updated
     * @param oldSigner Previous signer address
     * @param newSigner New signer address
     * @param effectiveBlock Block number when change takes effect
     */
    event SignerUpdated(
        address indexed oldSigner,
        address indexed newSigner,
        uint256 effectiveBlock
    );

    /**
     * @notice Emitted when vault is paused
     * @param by Address that triggered pause
     * @param reason Description of pause reason
     */
    event EmergencyPause(address indexed by, string reason);

    /**
     * @notice Emitted when vault is unpaused
     * @param by Address that triggered unpause
     */
    event EmergencyUnpause(address indexed by);

    // ============ Structs ============

    struct ReleaseParams {
        address token;
        address recipient;
        uint256 amount;
        bytes32 sourceChainId;
        bytes32 sourceTxHash;
        uint256 nonce;
        uint256 deadline;
    }

    // ============ Functions ============

    /**
     * @notice Deposit tokens for cross-chain transfer
     * @param token Token address (address(0) for native)
     * @param amount Amount to deposit
     * @param destinationChainId Target chain identifier
     * @param recipient Recipient address on destination chain
     * @return nonce Unique deposit nonce
     */
    function deposit(
        address token,
        uint256 amount,
        bytes32 destinationChainId,
        bytes32 recipient
    ) external payable returns (uint256 nonce);

    /**
     * @notice Release tokens using MPC threshold signature
     * @param params Release parameters
     * @param signature MPC threshold signature
     */
    function release(
        ReleaseParams calldata params,
        bytes calldata signature
    ) external;

    /**
     * @notice Get the current MPC signer address
     * @return Current signer address
     */
    function mpcSigner() external view returns (address);

    /**
     * @notice Check if a release nonce has been used
     * @param nonce Nonce to check
     * @return True if nonce has been used
     */
    function usedNonces(uint256 nonce) external view returns (bool);

    /**
     * @notice Get the current deposit nonce
     * @return Current nonce value
     */
    function depositNonce() external view returns (uint256);
}
```

#### 2.2 Reference Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BridgeVault
 * @notice Holds bridged assets and releases on valid MPC signature
 * @dev Uses ECDSA signature verification against T-Chain MPC threshold address
 *      Integrates with B-Chain for deposit observation and withdrawal coordination
 *      See LP-0335 for full specification
 */
contract BridgeVault is IBridgeVault, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Constants ============

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Domain separator for EIP-712 signatures
    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @notice EIP-712 typehash for release operations
    bytes32 public constant RELEASE_TYPEHASH = keccak256(
        "Release(address token,address recipient,uint256 amount,bytes32 sourceChainId,bytes32 sourceTxHash,uint256 nonce,uint256 deadline)"
    );

    /// @notice EIP-712 typehash for batch release operations
    bytes32 public constant BATCH_RELEASE_TYPEHASH = keccak256(
        "BatchRelease(bytes32 releasesHash,uint256 batchNonce,uint256 deadline)"
    );

    // ============ State Variables ============

    /// @notice Current MPC threshold signer address (derived from T-Chain DKG)
    address public override mpcSigner;

    /// @notice Pending signer update (for timelock)
    address public pendingSigner;

    /// @notice Block at which pending signer becomes active
    uint256 public signerUpdateBlock;

    /// @notice Timelock delay for signer updates (blocks)
    uint256 public constant SIGNER_UPDATE_DELAY = 1800; // ~6 hours at 12s blocks

    /// @notice Current deposit nonce
    uint256 public override depositNonce;

    /// @notice Mapping of used release nonces
    mapping(uint256 => bool) public override usedNonces;

    /// @notice Mapping of used source transaction hashes (replay protection)
    mapping(bytes32 => bool) public usedSourceTxHashes;

    /// @notice Per-token daily transfer limits
    mapping(address => uint256) public dailyLimits;

    /// @notice Per-token daily transfer amounts
    mapping(address => mapping(uint256 => uint256)) public dailyTransferred;

    /// @notice Per-token single transfer maximum
    mapping(address => uint256) public maxSingleTransfer;

    /// @notice Chain ID for domain separator
    uint256 public immutable chainId;

    /// @notice Emergency brake contract address
    address public emergencyBrake;

    // ============ Constructor ============

    constructor(
        address _mpcSigner,
        address _admin,
        address _guardian
    ) {
        require(_mpcSigner != address(0), "Invalid signer");
        require(_admin != address(0), "Invalid admin");

        mpcSigner = _mpcSigner;
        chainId = block.chainid;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("LuxBridgeVault"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(GUARDIAN_ROLE, _guardian);
        _grantRole(OPERATOR_ROLE, _admin);
    }

    // ============ External Functions ============

    /**
     * @inheritdoc IBridgeVault
     */
    function deposit(
        address token,
        uint256 amount,
        bytes32 destinationChainId,
        bytes32 recipient
    ) external payable override nonReentrant whenNotPaused returns (uint256 nonce) {
        require(amount > 0, "Zero amount");
        require(recipient != bytes32(0), "Invalid recipient");

        // Check emergency brake if configured
        if (emergencyBrake != address(0)) {
            require(
                IEmergencyBrake(emergencyBrake).isOperationAllowed(token, destinationChainId),
                "Operation paused"
            );
        }

        nonce = ++depositNonce;

        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token deposits");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit Deposit(token, msg.sender, amount, destinationChainId, recipient, nonce);
    }

    /**
     * @inheritdoc IBridgeVault
     */
    function release(
        ReleaseParams calldata params,
        bytes calldata signature
    ) external override nonReentrant whenNotPaused {
        // Validate deadline
        require(block.timestamp <= params.deadline, "Signature expired");

        // Validate nonce not used
        require(!usedNonces[params.nonce], "Nonce already used");

        // Validate source tx hash not used (replay protection)
        require(!usedSourceTxHashes[params.sourceTxHash], "Source tx already processed");

        // Validate amount
        require(params.amount > 0, "Zero amount");
        require(params.recipient != address(0), "Invalid recipient");

        // Check emergency brake if configured
        if (emergencyBrake != address(0)) {
            require(
                IEmergencyBrake(emergencyBrake).isOperationAllowed(params.token, params.sourceChainId),
                "Operation paused"
            );
        }

        // Check single transfer limit
        if (maxSingleTransfer[params.token] > 0) {
            require(params.amount <= maxSingleTransfer[params.token], "Exceeds single transfer limit");
        }

        // Check daily limit
        _checkAndUpdateDailyLimit(params.token, params.amount);

        // Build message hash per EIP-712
        bytes32 structHash = keccak256(
            abi.encode(
                RELEASE_TYPEHASH,
                params.token,
                params.recipient,
                params.amount,
                params.sourceChainId,
                params.sourceTxHash,
                params.nonce,
                params.deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        // Recover signer and validate against T-Chain MPC address
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == mpcSigner, "Invalid signature");

        // Mark nonce and tx hash as used
        usedNonces[params.nonce] = true;
        usedSourceTxHashes[params.sourceTxHash] = true;

        // Transfer assets
        if (params.token == address(0)) {
            (bool success, ) = params.recipient.call{value: params.amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(params.token).safeTransfer(params.recipient, params.amount);
        }

        emit Release(
            params.token,
            params.recipient,
            params.amount,
            params.sourceChainId,
            params.sourceTxHash,
            params.nonce
        );
    }

    /**
     * @notice Batch release for gas optimization
     * @param paramsArray Array of release parameters
     * @param batchNonce Unique batch nonce
     * @param deadline Signature deadline
     * @param signature MPC threshold signature over batch
     */
    function batchRelease(
        ReleaseParams[] calldata paramsArray,
        uint256 batchNonce,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[batchNonce], "Batch nonce already used");
        require(paramsArray.length > 0 && paramsArray.length <= 50, "Invalid batch size");

        // Hash all release params
        bytes32[] memory releaseHashes = new bytes32[](paramsArray.length);
        for (uint256 i = 0; i < paramsArray.length; i++) {
            releaseHashes[i] = keccak256(abi.encode(
                RELEASE_TYPEHASH,
                paramsArray[i].token,
                paramsArray[i].recipient,
                paramsArray[i].amount,
                paramsArray[i].sourceChainId,
                paramsArray[i].sourceTxHash,
                paramsArray[i].nonce,
                paramsArray[i].deadline
            ));
        }

        bytes32 releasesHash = keccak256(abi.encodePacked(releaseHashes));
        bytes32 structHash = keccak256(
            abi.encode(BATCH_RELEASE_TYPEHASH, releasesHash, batchNonce, deadline)
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == mpcSigner, "Invalid signature");

        usedNonces[batchNonce] = true;

        // Process each release
        for (uint256 i = 0; i < paramsArray.length; i++) {
            ReleaseParams calldata params = paramsArray[i];

            require(!usedNonces[params.nonce], "Nonce already used");
            require(!usedSourceTxHashes[params.sourceTxHash], "Source tx already processed");

            usedNonces[params.nonce] = true;
            usedSourceTxHashes[params.sourceTxHash] = true;

            _checkAndUpdateDailyLimit(params.token, params.amount);

            if (params.token == address(0)) {
                (bool success, ) = params.recipient.call{value: params.amount}("");
                require(success, "ETH transfer failed");
            } else {
                IERC20(params.token).safeTransfer(params.recipient, params.amount);
            }

            emit Release(
                params.token,
                params.recipient,
                params.amount,
                params.sourceChainId,
                params.sourceTxHash,
                params.nonce
            );
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Initiate MPC signer update (timelocked)
     * @dev New signer address comes from T-Chain DKG rotation
     * @param newSigner New signer address
     */
    function initiateSignerUpdate(address newSigner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newSigner != address(0), "Invalid signer");
        require(newSigner != mpcSigner, "Same signer");

        pendingSigner = newSigner;
        signerUpdateBlock = block.number + SIGNER_UPDATE_DELAY;
    }

    /**
     * @notice Finalize MPC signer update after timelock
     */
    function finalizeSignerUpdate() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(pendingSigner != address(0), "No pending update");
        require(block.number >= signerUpdateBlock, "Timelock not expired");

        address oldSigner = mpcSigner;
        mpcSigner = pendingSigner;
        pendingSigner = address(0);

        emit SignerUpdated(oldSigner, mpcSigner, block.number);
    }

    /**
     * @notice Cancel pending signer update
     */
    function cancelSignerUpdate() external onlyRole(DEFAULT_ADMIN_ROLE) {
        pendingSigner = address(0);
        signerUpdateBlock = 0;
    }

    /**
     * @notice Set daily transfer limit for a token
     * @param token Token address
     * @param limit Daily limit amount
     */
    function setDailyLimit(address token, uint256 limit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        dailyLimits[token] = limit;
    }

    /**
     * @notice Set maximum single transfer for a token
     * @param token Token address
     * @param limit Maximum single transfer amount
     */
    function setMaxSingleTransfer(address token, uint256 limit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxSingleTransfer[token] = limit;
    }

    /**
     * @notice Set emergency brake contract
     * @param _emergencyBrake Emergency brake contract address
     */
    function setEmergencyBrake(address _emergencyBrake) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyBrake = _emergencyBrake;
    }

    /**
     * @notice Emergency pause
     * @param reason Reason for pause
     */
    function pause(string calldata reason) external onlyRole(GUARDIAN_ROLE) {
        _pause();
        emit EmergencyPause(msg.sender, reason);
    }

    /**
     * @notice Unpause after emergency
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
        emit EmergencyUnpause(msg.sender);
    }

    /**
     * @notice Emergency token recovery (only for mistakenly sent tokens)
     * @param token Token to recover
     * @param to Recipient address
     * @param amount Amount to recover
     */
    function emergencyTokenRecovery(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get pending signer info
     * @return pending Pending signer address
     * @return effectiveBlock Block when update takes effect
     */
    function getPendingSignerUpdate() external view returns (address pending, uint256 effectiveBlock) {
        return (pendingSigner, signerUpdateBlock);
    }

    /**
     * @notice Get daily limit status for a token
     * @param token Token address
     * @return limit Daily limit
     * @return used Amount used today
     * @return remaining Remaining allowance
     */
    function getDailyLimitStatus(address token) external view returns (
        uint256 limit,
        uint256 used,
        uint256 remaining
    ) {
        limit = dailyLimits[token];
        if (limit == 0) {
            return (0, 0, type(uint256).max);
        }
        uint256 day = block.timestamp / 1 days;
        used = dailyTransferred[token][day];
        remaining = limit > used ? limit - used : 0;
    }

    // ============ Internal Functions ============

    function _checkAndUpdateDailyLimit(address token, uint256 amount) internal {
        uint256 limit = dailyLimits[token];
        if (limit == 0) return; // No limit set

        uint256 day = block.timestamp / 1 days;
        uint256 transferred = dailyTransferred[token][day];

        require(transferred + amount <= limit, "Daily limit exceeded");
        dailyTransferred[token][day] = transferred + amount;
    }

    // ============ Receive Function ============

    receive() external payable {}
}

// Interface for EmergencyBrake integration
interface IEmergencyBrake {
    function isOperationAllowed(address token, bytes32 chainId) external view returns (bool);
}
```

### 3. BridgeRouter Contract

The BridgeRouter routes deposits and withdrawals to the correct vaults and handles cross-chain message formatting.

#### 3.1 Interface Definition

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridgeRouter
 * @notice Routes bridge operations to appropriate vaults
 * @dev See LP-0335 for specification details
 */
interface IBridgeRouter {
    // ============ Events ============

    event RouteAdded(bytes32 indexed destinationChainId, address indexed vault);
    event RouteRemoved(bytes32 indexed destinationChainId);
    event BridgeInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 destinationChainId,
        bytes32 recipient,
        uint256 fee
    );

    // ============ Structs ============

    struct Route {
        address vault;
        bool active;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 feeRate; // Basis points (100 = 1%)
    }

    // ============ Functions ============

    /**
     * @notice Bridge tokens to another chain
     * @param token Source token address
     * @param amount Amount to bridge
     * @param destinationChainId Target chain ID
     * @param recipient Recipient address on destination
     */
    function bridge(
        address token,
        uint256 amount,
        bytes32 destinationChainId,
        bytes32 recipient
    ) external payable;

    /**
     * @notice Get route configuration for a chain
     * @param chainId Chain identifier
     * @return Route configuration
     */
    function getRoute(bytes32 chainId) external view returns (Route memory);

    /**
     * @notice Calculate bridge fee
     * @param token Token address
     * @param amount Amount to bridge
     * @param destinationChainId Target chain
     * @return fee Fee amount
     */
    function calculateFee(
        address token,
        uint256 amount,
        bytes32 destinationChainId
    ) external view returns (uint256 fee);
}
```

#### 3.2 Reference Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BridgeRouter
 * @notice Routes bridge operations to appropriate vaults based on destination chain
 * @dev Integrates with B-Chain for route management and fee distribution
 */
contract BridgeRouter is IBridgeRouter, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    bytes32 public constant ROUTE_MANAGER_ROLE = keccak256("ROUTE_MANAGER_ROLE");
    uint256 public constant MAX_FEE_RATE = 500; // 5% max fee
    uint256 public constant FEE_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice Mapping of chain ID to route configuration
    mapping(bytes32 => Route) public routes;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Token registry contract
    address public tokenRegistry;

    /// @notice Total fees collected per token
    mapping(address => uint256) public feesCollected;

    // ============ Constructor ============

    constructor(address _admin, address _feeCollector, address _tokenRegistry) {
        require(_admin != address(0), "Invalid admin");
        require(_feeCollector != address(0), "Invalid fee collector");

        feeCollector = _feeCollector;
        tokenRegistry = _tokenRegistry;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ROUTE_MANAGER_ROLE, _admin);
    }

    // ============ External Functions ============

    /**
     * @inheritdoc IBridgeRouter
     */
    function bridge(
        address token,
        uint256 amount,
        bytes32 destinationChainId,
        bytes32 recipient
    ) external payable override nonReentrant whenNotPaused {
        Route storage route = routes[destinationChainId];
        require(route.active, "Route not active");
        require(amount >= route.minAmount, "Below minimum");
        require(amount <= route.maxAmount, "Above maximum");

        // Validate token is registered if registry is set
        if (tokenRegistry != address(0)) {
            require(
                ITokenRegistry(tokenRegistry).isRegistered(token) || token == address(0),
                "Token not registered"
            );
        }

        // Calculate and collect fee
        uint256 fee = (amount * route.feeRate) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;

        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");

            // Send fee to collector
            if (fee > 0) {
                (bool feeSuccess, ) = feeCollector.call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
                feesCollected[address(0)] += fee;
            }

            // Deposit to vault
            IBridgeVault(route.vault).deposit{value: netAmount}(
                token,
                netAmount,
                destinationChainId,
                recipient
            );
        } else {
            require(msg.value == 0, "ETH not accepted");

            // Transfer tokens from user
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

            // Send fee to collector
            if (fee > 0) {
                IERC20(token).safeTransfer(feeCollector, fee);
                feesCollected[token] += fee;
            }

            // Approve and deposit to vault
            IERC20(token).forceApprove(route.vault, netAmount);
            IBridgeVault(route.vault).deposit(
                token,
                netAmount,
                destinationChainId,
                recipient
            );
        }

        emit BridgeInitiated(msg.sender, token, netAmount, destinationChainId, recipient, fee);
    }

    /**
     * @inheritdoc IBridgeRouter
     */
    function getRoute(bytes32 chainId) external view override returns (Route memory) {
        return routes[chainId];
    }

    /**
     * @inheritdoc IBridgeRouter
     */
    function calculateFee(
        address token,
        uint256 amount,
        bytes32 destinationChainId
    ) external view override returns (uint256 fee) {
        Route storage route = routes[destinationChainId];
        return (amount * route.feeRate) / FEE_DENOMINATOR;
    }

    /**
     * @notice Get net amount after fee deduction
     * @param amount Gross amount
     * @param destinationChainId Target chain
     * @return netAmount Amount after fees
     */
    function calculateNetAmount(
        uint256 amount,
        bytes32 destinationChainId
    ) external view returns (uint256 netAmount) {
        Route storage route = routes[destinationChainId];
        uint256 fee = (amount * route.feeRate) / FEE_DENOMINATOR;
        return amount - fee;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add or update a route
     */
    function setRoute(
        bytes32 chainId,
        address vault,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 feeRate
    ) external onlyRole(ROUTE_MANAGER_ROLE) {
        require(vault != address(0), "Invalid vault");
        require(feeRate <= MAX_FEE_RATE, "Fee too high");
        require(minAmount <= maxAmount, "Invalid amounts");

        routes[chainId] = Route({
            vault: vault,
            active: true,
            minAmount: minAmount,
            maxAmount: maxAmount,
            feeRate: feeRate
        });

        emit RouteAdded(chainId, vault);
    }

    /**
     * @notice Update route fee rate only
     */
    function updateRouteFee(bytes32 chainId, uint256 newFeeRate) external onlyRole(ROUTE_MANAGER_ROLE) {
        require(routes[chainId].vault != address(0), "Route does not exist");
        require(newFeeRate <= MAX_FEE_RATE, "Fee too high");
        routes[chainId].feeRate = newFeeRate;
    }

    /**
     * @notice Deactivate a route
     */
    function removeRoute(bytes32 chainId) external onlyRole(ROUTE_MANAGER_ROLE) {
        routes[chainId].active = false;
        emit RouteRemoved(chainId);
    }

    /**
     * @notice Update fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }

    /**
     * @notice Update token registry address
     */
    function setTokenRegistry(address _tokenRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenRegistry = _tokenRegistry;
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    receive() external payable {}
}

// Interface for TokenRegistry
interface ITokenRegistry {
    function isRegistered(address localAddress) external view returns (bool);
}
```

### 4. TokenRegistry Contract

The TokenRegistry maintains mappings of tokens across chains and provides canonical token information.

#### 4.1 Interface Definition

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITokenRegistry
 * @notice Registry for cross-chain token mappings
 * @dev Coordinates with B-Chain AssetRegistry for global state
 */
interface ITokenRegistry {
    // ============ Events ============

    event TokenRegistered(
        bytes32 indexed assetId,
        address indexed localAddress,
        bytes32 originChainId,
        bytes32 originAddress
    );

    event TokenMappingAdded(
        bytes32 indexed assetId,
        bytes32 indexed chainId,
        bytes32 remoteAddress
    );

    event TokenDeactivated(bytes32 indexed assetId);

    // ============ Structs ============

    struct TokenInfo {
        bytes32 assetId;           // Unique cross-chain identifier
        address localAddress;      // Address on this chain
        bytes32 originChainId;     // Chain where token originated
        bytes32 originAddress;     // Address on origin chain
        string name;
        string symbol;
        uint8 decimals;
        bool isWrapped;            // True if this is a wrapped version
        bool isActive;
    }

    struct ChainMapping {
        bytes32 chainId;
        bytes32 tokenAddress;
        uint8 decimals;
        bool isActive;
    }

    // ============ Functions ============

    function registerToken(
        bytes32 assetId,
        address localAddress,
        bytes32 originChainId,
        bytes32 originAddress,
        bool isWrapped
    ) external;

    function addChainMapping(
        bytes32 assetId,
        bytes32 chainId,
        bytes32 tokenAddress,
        uint8 decimals
    ) external;

    function getTokenByAddress(address localAddress) external view returns (TokenInfo memory);
    function getTokenByAssetId(bytes32 assetId) external view returns (TokenInfo memory);
    function getRemoteToken(bytes32 assetId, bytes32 chainId) external view returns (bytes32);
    function isRegistered(address localAddress) external view returns (bool);
}
```

#### 4.2 Reference Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title TokenRegistry
 * @notice Maintains cross-chain token mappings for the bridge
 * @dev Synchronizes with B-Chain AssetRegistry via relayer
 */
contract TokenRegistry is ITokenRegistry, AccessControl {
    // ============ Constants ============

    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // ============ State Variables ============

    /// @notice Mapping from local address to token info
    mapping(address => TokenInfo) public tokensByAddress;

    /// @notice Mapping from asset ID to token info
    mapping(bytes32 => TokenInfo) public tokensByAssetId;

    /// @notice Mapping from asset ID to chain ID to remote address
    mapping(bytes32 => mapping(bytes32 => ChainMapping)) public chainMappings;

    /// @notice List of all registered asset IDs
    bytes32[] public registeredAssets;

    /// @notice Mapping from local address to asset ID for reverse lookup
    mapping(address => bytes32) public addressToAssetId;

    // ============ Constructor ============

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRAR_ROLE, _admin);
    }

    // ============ External Functions ============

    /**
     * @inheritdoc ITokenRegistry
     */
    function registerToken(
        bytes32 assetId,
        address localAddress,
        bytes32 originChainId,
        bytes32 originAddress,
        bool isWrapped
    ) external override onlyRole(REGISTRAR_ROLE) {
        require(localAddress != address(0), "Invalid address");
        require(tokensByAssetId[assetId].localAddress == address(0), "Asset already registered");
        require(tokensByAddress[localAddress].assetId == bytes32(0), "Address already registered");

        // Get token metadata
        string memory name;
        string memory symbol;
        uint8 decimals;

        if (localAddress == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            // Native token placeholder
            name = "Native Token";
            symbol = "ETH";
            decimals = 18;
        } else {
            name = IERC20Metadata(localAddress).name();
            symbol = IERC20Metadata(localAddress).symbol();
            decimals = IERC20Metadata(localAddress).decimals();
        }

        TokenInfo memory info = TokenInfo({
            assetId: assetId,
            localAddress: localAddress,
            originChainId: originChainId,
            originAddress: originAddress,
            name: name,
            symbol: symbol,
            decimals: decimals,
            isWrapped: isWrapped,
            isActive: true
        });

        tokensByAddress[localAddress] = info;
        tokensByAssetId[assetId] = info;
        addressToAssetId[localAddress] = assetId;
        registeredAssets.push(assetId);

        emit TokenRegistered(assetId, localAddress, originChainId, originAddress);
    }

    /**
     * @inheritdoc ITokenRegistry
     */
    function addChainMapping(
        bytes32 assetId,
        bytes32 chainId,
        bytes32 tokenAddress,
        uint8 decimals
    ) external override onlyRole(REGISTRAR_ROLE) {
        require(tokensByAssetId[assetId].isActive, "Asset not registered");

        chainMappings[assetId][chainId] = ChainMapping({
            chainId: chainId,
            tokenAddress: tokenAddress,
            decimals: decimals,
            isActive: true
        });

        emit TokenMappingAdded(assetId, chainId, tokenAddress);
    }

    /**
     * @inheritdoc ITokenRegistry
     */
    function getTokenByAddress(address localAddress) external view override returns (TokenInfo memory) {
        return tokensByAddress[localAddress];
    }

    /**
     * @inheritdoc ITokenRegistry
     */
    function getTokenByAssetId(bytes32 assetId) external view override returns (TokenInfo memory) {
        return tokensByAssetId[assetId];
    }

    /**
     * @inheritdoc ITokenRegistry
     */
    function getRemoteToken(bytes32 assetId, bytes32 chainId) external view override returns (bytes32) {
        return chainMappings[assetId][chainId].tokenAddress;
    }

    /**
     * @inheritdoc ITokenRegistry
     */
    function isRegistered(address localAddress) external view override returns (bool) {
        return tokensByAddress[localAddress].isActive;
    }

    /**
     * @notice Get total number of registered assets
     */
    function getRegisteredAssetCount() external view returns (uint256) {
        return registeredAssets.length;
    }

    /**
     * @notice Get chain mapping details
     */
    function getChainMapping(bytes32 assetId, bytes32 chainId) external view returns (ChainMapping memory) {
        return chainMappings[assetId][chainId];
    }

    /**
     * @notice Batch register tokens
     */
    function batchRegisterTokens(
        bytes32[] calldata assetIds,
        address[] calldata localAddresses,
        bytes32[] calldata originChainIds,
        bytes32[] calldata originAddresses,
        bool[] calldata isWrappedFlags
    ) external onlyRole(REGISTRAR_ROLE) {
        require(
            assetIds.length == localAddresses.length &&
            assetIds.length == originChainIds.length &&
            assetIds.length == originAddresses.length &&
            assetIds.length == isWrappedFlags.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < assetIds.length; i++) {
            // Skip if already registered
            if (tokensByAssetId[assetIds[i]].localAddress != address(0)) continue;
            if (tokensByAddress[localAddresses[i]].assetId != bytes32(0)) continue;

            string memory name;
            string memory symbol;
            uint8 decimals;

            try IERC20Metadata(localAddresses[i]).name() returns (string memory n) {
                name = n;
            } catch {
                name = "Unknown";
            }

            try IERC20Metadata(localAddresses[i]).symbol() returns (string memory s) {
                symbol = s;
            } catch {
                symbol = "???";
            }

            try IERC20Metadata(localAddresses[i]).decimals() returns (uint8 d) {
                decimals = d;
            } catch {
                decimals = 18;
            }

            TokenInfo memory info = TokenInfo({
                assetId: assetIds[i],
                localAddress: localAddresses[i],
                originChainId: originChainIds[i],
                originAddress: originAddresses[i],
                name: name,
                symbol: symbol,
                decimals: decimals,
                isWrapped: isWrappedFlags[i],
                isActive: true
            });

            tokensByAddress[localAddresses[i]] = info;
            tokensByAssetId[assetIds[i]] = info;
            addressToAssetId[localAddresses[i]] = assetIds[i];
            registeredAssets.push(assetIds[i]);

            emit TokenRegistered(assetIds[i], localAddresses[i], originChainIds[i], originAddresses[i]);
        }
    }

    /**
     * @notice Deactivate a token
     */
    function deactivateToken(bytes32 assetId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address localAddr = tokensByAssetId[assetId].localAddress;
        tokensByAssetId[assetId].isActive = false;
        tokensByAddress[localAddr].isActive = false;
        emit TokenDeactivated(assetId);
    }

    /**
     * @notice Reactivate a token
     */
    function reactivateToken(bytes32 assetId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address localAddr = tokensByAssetId[assetId].localAddress;
        require(localAddr != address(0), "Token not found");
        tokensByAssetId[assetId].isActive = true;
        tokensByAddress[localAddr].isActive = true;
    }
}
```

### 5. BridgeGovernor Contract

The BridgeGovernor manages bridge parameter updates through timelocked governance.

#### 5.1 Interface Definition

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridgeGovernor
 * @notice Governance contract for bridge parameter management
 */
interface IBridgeGovernor {
    // ============ Events ============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address target,
        bytes data,
        uint256 executeAfter
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    // ============ Structs ============

    struct Proposal {
        address proposer;
        address target;
        bytes data;
        uint256 executeAfter;
        bool executed;
        bool cancelled;
    }

    // ============ Functions ============

    function propose(address target, bytes calldata data) external returns (uint256 proposalId);
    function execute(uint256 proposalId) external;
    function cancel(uint256 proposalId) external;
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
}
```

#### 5.2 Reference Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BridgeGovernor
 * @notice Timelocked governance for bridge parameter updates
 */
contract BridgeGovernor is IBridgeGovernor, AccessControl {
    // ============ Constants ============

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    uint256 public constant MIN_DELAY = 1 days;
    uint256 public constant MAX_DELAY = 30 days;

    // ============ State Variables ============

    uint256 public delay;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    // ============ Constructor ============

    constructor(address _admin, uint256 _delay) {
        require(_delay >= MIN_DELAY && _delay <= MAX_DELAY, "Invalid delay");
        delay = _delay;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PROPOSER_ROLE, _admin);
        _grantRole(EXECUTOR_ROLE, _admin);
        _grantRole(CANCELLER_ROLE, _admin);
    }

    // ============ External Functions ============

    /**
     * @inheritdoc IBridgeGovernor
     */
    function propose(
        address target,
        bytes calldata data
    ) external override onlyRole(PROPOSER_ROLE) returns (uint256 proposalId) {
        require(target != address(0), "Invalid target");

        proposalId = ++proposalCount;
        uint256 executeAfter = block.timestamp + delay;

        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            target: target,
            data: data,
            executeAfter: executeAfter,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(proposalId, msg.sender, target, data, executeAfter);
    }

    /**
     * @inheritdoc IBridgeGovernor
     */
    function execute(uint256 proposalId) external override onlyRole(EXECUTOR_ROLE) {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.target != address(0), "Proposal not found");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Cancelled");
        require(block.timestamp >= proposal.executeAfter, "Timelock not expired");

        proposal.executed = true;

        (bool success, ) = proposal.target.call(proposal.data);
        require(success, "Execution failed");

        emit ProposalExecuted(proposalId);
    }

    /**
     * @inheritdoc IBridgeGovernor
     */
    function cancel(uint256 proposalId) external override onlyRole(CANCELLER_ROLE) {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.target != address(0), "Proposal not found");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");

        proposal.cancelled = true;

        emit ProposalCancelled(proposalId);
    }

    /**
     * @inheritdoc IBridgeGovernor
     */
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        return proposals[proposalId];
    }

    /**
     * @notice Update timelock delay
     */
    function setDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDelay >= MIN_DELAY && newDelay <= MAX_DELAY, "Invalid delay");
        delay = newDelay;
    }
}
```

### 6. EmergencyBrake Contract

The EmergencyBrake provides circuit breaker functionality for security incidents.

#### 6.1 Interface and Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EmergencyBrake
 * @notice Circuit breaker for bridge security incidents
 * @dev Can be triggered by guardians, recovery requires higher privilege
 */
contract EmergencyBrake is AccessControl {
    // ============ Constants ============

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    // ============ State Variables ============

    /// @notice Global pause state
    bool public globalPause;

    /// @notice Per-token pause state
    mapping(address => bool) public tokenPaused;

    /// @notice Per-chain pause state
    mapping(bytes32 => bool) public chainPaused;

    /// @notice Pause reason log
    mapping(uint256 => PauseEvent) public pauseLog;
    uint256 public pauseEventCount;

    struct PauseEvent {
        address triggeredBy;
        uint256 timestamp;
        string reason;
        PauseType pauseType;
        bytes32 identifier; // Token address or chain ID
    }

    enum PauseType { Global, Token, Chain }

    // ============ Events ============

    event GlobalPauseActivated(address indexed by, string reason);
    event GlobalPauseDeactivated(address indexed by);
    event TokenPauseActivated(address indexed token, address indexed by, string reason);
    event TokenPauseDeactivated(address indexed token, address indexed by);
    event ChainPauseActivated(bytes32 indexed chainId, address indexed by, string reason);
    event ChainPauseDeactivated(bytes32 indexed chainId, address indexed by);

    // ============ Constructor ============

    constructor(address _admin, address[] memory _guardians) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(RECOVERY_ROLE, _admin);

        for (uint256 i = 0; i < _guardians.length; i++) {
            _grantRole(GUARDIAN_ROLE, _guardians[i]);
        }
    }

    // ============ Guardian Functions ============

    /**
     * @notice Activate global pause (any guardian)
     */
    function activateGlobalPause(string calldata reason) external onlyRole(GUARDIAN_ROLE) {
        globalPause = true;

        pauseLog[pauseEventCount++] = PauseEvent({
            triggeredBy: msg.sender,
            timestamp: block.timestamp,
            reason: reason,
            pauseType: PauseType.Global,
            identifier: bytes32(0)
        });

        emit GlobalPauseActivated(msg.sender, reason);
    }

    /**
     * @notice Pause specific token
     */
    function pauseToken(address token, string calldata reason) external onlyRole(GUARDIAN_ROLE) {
        tokenPaused[token] = true;

        pauseLog[pauseEventCount++] = PauseEvent({
            triggeredBy: msg.sender,
            timestamp: block.timestamp,
            reason: reason,
            pauseType: PauseType.Token,
            identifier: bytes32(uint256(uint160(token)))
        });

        emit TokenPauseActivated(token, msg.sender, reason);
    }

    /**
     * @notice Pause specific chain
     */
    function pauseChain(bytes32 chainId, string calldata reason) external onlyRole(GUARDIAN_ROLE) {
        chainPaused[chainId] = true;

        pauseLog[pauseEventCount++] = PauseEvent({
            triggeredBy: msg.sender,
            timestamp: block.timestamp,
            reason: reason,
            pauseType: PauseType.Chain,
            identifier: chainId
        });

        emit ChainPauseActivated(chainId, msg.sender, reason);
    }

    // ============ Recovery Functions ============

    /**
     * @notice Deactivate global pause (requires recovery role)
     */
    function deactivateGlobalPause() external onlyRole(RECOVERY_ROLE) {
        globalPause = false;
        emit GlobalPauseDeactivated(msg.sender);
    }

    /**
     * @notice Unpause token
     */
    function unpauseToken(address token) external onlyRole(RECOVERY_ROLE) {
        tokenPaused[token] = false;
        emit TokenPauseDeactivated(token, msg.sender);
    }

    /**
     * @notice Unpause chain
     */
    function unpauseChain(bytes32 chainId) external onlyRole(RECOVERY_ROLE) {
        chainPaused[chainId] = false;
        emit ChainPauseDeactivated(chainId, msg.sender);
    }

    // ============ View Functions ============

    /**
     * @notice Check if operations are allowed
     */
    function isOperationAllowed(address token, bytes32 chainId) external view returns (bool) {
        return !globalPause && !tokenPaused[token] && !chainPaused[chainId];
    }

    /**
     * @notice Get pause event details
     */
    function getPauseEvent(uint256 index) external view returns (PauseEvent memory) {
        return pauseLog[index];
    }

    /**
     * @notice Get all pause states
     */
    function getPauseStates(
        address token,
        bytes32 chainId
    ) external view returns (bool global, bool tokenPause, bool chainPause) {
        return (globalPause, tokenPaused[token], chainPaused[chainId]);
    }
}
```

### 7. Signature Flow with T-Chain Integration

The signature flow integrates with T-Chain's MPC infrastructure as specified in LP-0330 and LP-0332.

#### 7.1 TypeScript Client Integration

```typescript
import { ethers } from 'ethers';

// Repository: https://github.com/luxfi/bridge
// Path: packages/sdk/src/client.ts

interface SignatureRequest {
    keyId: string;
    messageHash: string;
    requestingChain: string;
}

interface SignatureResponse {
    sessionId: string;
    signature: string;
    signers: string[];
    protocol: 'cgg21' | 'lss' | 'ringtail';
}

interface BridgeConfig {
    tChainRPC: string;
    bChainRPC: string;
    vaultAddress: string;
    routerAddress: string;
}

/**
 * T-Chain MPC Signature Client
 * Communicates with T-Chain ThresholdVM for threshold signature generation
 */
class TChainSignatureClient {
    private endpoint: string;

    constructor(endpoint: string = 'http://localhost:9630/ext/bc/T/rpc') {
        this.endpoint = endpoint;
    }

    /**
     * Request threshold signature from T-Chain
     */
    async requestSignature(params: SignatureRequest): Promise<{ sessionId: string }> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'threshold.requestSignature',
                params: {
                    keyId: params.keyId,
                    messageHash: params.messageHash,
                    requestingChain: params.requestingChain
                }
            })
        });

        const result = await response.json();
        if (result.error) {
            throw new Error(`T-Chain error: ${result.error.message}`);
        }
        return { sessionId: result.result.sessionId };
    }

    /**
     * Get completed signature
     */
    async getSignature(sessionId: string): Promise<SignatureResponse> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'threshold.getSignature',
                params: { sessionId }
            })
        });

        const result = await response.json();
        if (result.error) {
            throw new Error(`T-Chain error: ${result.error.message}`);
        }
        return result.result;
    }

    /**
     * Get current MPC public key for a key ID
     */
    async getMPCPublicKey(keyId: string): Promise<string> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'threshold.getPublicKey',
                params: { keyId }
            })
        });

        const result = await response.json();
        return result.result.publicKey;
    }

    /**
     * Poll for signature completion
     */
    async waitForSignature(
        sessionId: string,
        timeout: number = 30000,
        pollInterval: number = 1000
    ): Promise<SignatureResponse> {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            try {
                const sig = await this.getSignature(sessionId);
                if (sig.signature) {
                    return sig;
                }
            } catch (e) {
                // Signature not ready yet
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Signature request timed out');
    }
}

/**
 * B-Chain Bridge Client
 * Monitors deposits and coordinates releases via B-Chain BridgeVM
 */
class BChainBridgeClient {
    private endpoint: string;

    constructor(endpoint: string = 'http://localhost:9630/ext/bc/B/rpc') {
        this.endpoint = endpoint;
    }

    /**
     * Get pending withdrawals for processing
     */
    async getPendingWithdrawals(limit: number = 100): Promise<any[]> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'bridge.getPendingWithdrawals',
                params: { limit }
            })
        });

        const result = await response.json();
        return result.result.withdrawals;
    }

    /**
     * Submit release proof after signature completion
     */
    async submitReleaseProof(
        withdrawalId: string,
        signature: string,
        txHash: string
    ): Promise<void> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'bridge.submitReleaseProof',
                params: {
                    withdrawalId,
                    signature,
                    externalTxHash: txHash
                }
            })
        });

        const result = await response.json();
        if (result.error) {
            throw new Error(`B-Chain error: ${result.error.message}`);
        }
    }
}

/**
 * Complete Bridge Client
 * High-level API for bridge operations
 */
export class LuxBridgeClient {
    private tChain: TChainSignatureClient;
    private bChain: BChainBridgeClient;
    private provider: ethers.Provider;
    private config: BridgeConfig;

    constructor(config: BridgeConfig) {
        this.config = config;
        this.tChain = new TChainSignatureClient(config.tChainRPC);
        this.bChain = new BChainBridgeClient(config.bChainRPC);
        this.provider = new ethers.JsonRpcProvider(config.bChainRPC);
    }

    /**
     * Build EIP-712 release hash
     */
    buildReleaseHash(
        vault: ethers.Contract,
        params: {
            token: string;
            recipient: string;
            amount: bigint;
            sourceChainId: string;
            sourceTxHash: string;
            nonce: number;
            deadline: number;
        }
    ): string {
        const RELEASE_TYPEHASH = ethers.keccak256(
            ethers.toUtf8Bytes(
                'Release(address token,address recipient,uint256 amount,bytes32 sourceChainId,bytes32 sourceTxHash,uint256 nonce,uint256 deadline)'
            )
        );

        const structHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['bytes32', 'address', 'address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256'],
                [
                    RELEASE_TYPEHASH,
                    params.token,
                    params.recipient,
                    params.amount,
                    ethers.encodeBytes32String(params.sourceChainId),
                    params.sourceTxHash,
                    params.nonce,
                    params.deadline
                ]
            )
        );

        return structHash;
    }

    /**
     * Execute bridge release with T-Chain signature
     */
    async executeRelease(
        vault: ethers.Contract,
        releaseParams: {
            token: string;
            recipient: string;
            amount: bigint;
            sourceChainId: string;
            sourceTxHash: string;
            nonce: number;
            deadline: number;
        },
        keyId: string = 'bridge-main'
    ): Promise<ethers.TransactionResponse> {
        // Get domain separator from vault
        const domainSeparator = await vault.DOMAIN_SEPARATOR();

        // Build struct hash
        const structHash = this.buildReleaseHash(vault, releaseParams);

        // Build EIP-712 digest
        const messageHash = ethers.keccak256(
            ethers.solidityPacked(
                ['string', 'bytes32', 'bytes32'],
                ['\x19\x01', domainSeparator, structHash]
            )
        );

        // Request signature from T-Chain
        const { sessionId } = await this.tChain.requestSignature({
            keyId: keyId,
            messageHash: messageHash,
            requestingChain: 'B'
        });

        // Wait for threshold signature
        const { signature } = await this.tChain.waitForSignature(sessionId);

        // Execute release on vault
        return vault.release(releaseParams, signature);
    }

    /**
     * Monitor for deposit events
     */
    async watchDeposits(
        vault: ethers.Contract,
        callback: (event: any) => void
    ): Promise<void> {
        vault.on('Deposit', (token, depositor, amount, destChain, recipient, nonce, event) => {
            callback({
                token,
                depositor,
                amount,
                destinationChainId: destChain,
                recipient,
                nonce,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber
            });
        });
    }

    /**
     * Get vault balance for a token
     */
    async getVaultBalance(vaultAddress: string, token: string): Promise<bigint> {
        if (token === ethers.ZeroAddress) {
            return this.provider.getBalance(vaultAddress);
        }
        const tokenContract = new ethers.Contract(
            token,
            ['function balanceOf(address) view returns (uint256)'],
            this.provider
        );
        return tokenContract.balanceOf(vaultAddress);
    }
}
```

### 8. Nonce Management

Nonces prevent replay attacks and ensure transaction uniqueness.

#### 8.1 Deposit Nonce

- Auto-incremented per deposit transaction
- Unique per vault instance
- Included in deposit event for indexing

#### 8.2 Release Nonce

- Provided by B-Chain in signature request
- Verified as unused before processing
- Permanently marked as used after successful release

#### 8.3 Source Transaction Hash

- Additional replay protection layer
- Prevents same source transaction from being claimed multiple times
- Useful for bridge monitoring and reconciliation

### 9. Gas Optimization

The contracts employ several gas optimization techniques:

1. **Packed Storage**: Related variables packed into single slots
2. **Calldata Usage**: Parameters passed as calldata where possible
3. **Minimal Storage Writes**: State updated only when necessary
4. **Batch Operations**: Multi-release batching for high-volume periods
5. **forceApprove**: Uses OpenZeppelin's forceApprove to avoid approval race conditions

### 10. Upgrade Patterns

Contracts use transparent proxy pattern for upgradeability:

```solidity
// Deployment order:
// 1. Deploy implementation contracts
// 2. Deploy TransparentUpgradeableProxy for each
// 3. Initialize through proxy

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
```

### 11. Multi-Chain Deployment Addresses

| Chain | ChainID | BridgeVault | BridgeRouter | TokenRegistry |
|-------|---------|-------------|--------------|---------------|
| LUX Mainnet | 96369 | 0x... (TBD) | 0x... (TBD) | 0x... (TBD) |
| ZOO Mainnet | 200200 | 0x... (TBD) | 0x... (TBD) | 0x... (TBD) |
| Ethereum Mainnet | 1 | 0x... (TBD) | 0x... (TBD) | 0x... (TBD) |
| Base | 8453 | 0x... (TBD) | 0x... (TBD) | 0x... (TBD) |
| Arbitrum One | 42161 | 0x... (TBD) | 0x... (TBD) | 0x... (TBD) |

**Chain Identifiers (bytes32)**:
- LUX: `0x4c55580000000000000000000000000000000000000000000000000000000000` ("LUX")
- ZOO: `0x5a4f4f0000000000000000000000000000000000000000000000000000000000` ("ZOO")
- ETH: `0x4554480000000000000000000000000000000000000000000000000000000000` ("ETH")
- BASE: `0x4241534500000000000000000000000000000000000000000000000000000000` ("BASE")
- ARB: `0x4152420000000000000000000000000000000000000000000000000000000000` ("ARB")

## Deployment Scripts

### Hardhat Deployment

```typescript
// scripts/deploy.ts
// Repository: https://github.com/luxfi/bridge
// Path: packages/contracts/scripts/deploy.ts

import { ethers, upgrades } from 'hardhat';

interface DeploymentConfig {
    mpcSigner: string;
    admin: string;
    guardian: string;
    feeCollector: string;
    guardians: string[];
    timelockDelay: number;
}

async function deployBridgeContracts(config: DeploymentConfig) {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with:', deployer.address);

    // 1. Deploy TokenRegistry (no dependencies)
    const TokenRegistry = await ethers.getContractFactory('TokenRegistry');
    const tokenRegistry = await upgrades.deployProxy(
        TokenRegistry,
        [config.admin],
        { initializer: 'initialize' }
    );
    await tokenRegistry.waitForDeployment();
    console.log('TokenRegistry:', await tokenRegistry.getAddress());

    // 2. Deploy EmergencyBrake
    const EmergencyBrake = await ethers.getContractFactory('EmergencyBrake');
    const emergencyBrake = await EmergencyBrake.deploy(
        config.admin,
        config.guardians
    );
    await emergencyBrake.waitForDeployment();
    console.log('EmergencyBrake:', await emergencyBrake.getAddress());

    // 3. Deploy BridgeVault (requires MPC signer from T-Chain)
    const BridgeVault = await ethers.getContractFactory('BridgeVault');
    const bridgeVault = await upgrades.deployProxy(
        BridgeVault,
        [config.mpcSigner, config.admin, config.guardian],
        { initializer: 'initialize' }
    );
    await bridgeVault.waitForDeployment();
    console.log('BridgeVault:', await bridgeVault.getAddress());

    // 4. Configure vault with emergency brake
    await bridgeVault.setEmergencyBrake(await emergencyBrake.getAddress());

    // 5. Deploy BridgeRouter (requires TokenRegistry, BridgeVault)
    const BridgeRouter = await ethers.getContractFactory('BridgeRouter');
    const bridgeRouter = await upgrades.deployProxy(
        BridgeRouter,
        [config.admin, config.feeCollector, await tokenRegistry.getAddress()],
        { initializer: 'initialize' }
    );
    await bridgeRouter.waitForDeployment();
    console.log('BridgeRouter:', await bridgeRouter.getAddress());

    // 6. Deploy BridgeGovernor (requires admin multisig)
    const BridgeGovernor = await ethers.getContractFactory('BridgeGovernor');
    const bridgeGovernor = await BridgeGovernor.deploy(
        config.admin,
        config.timelockDelay
    );
    await bridgeGovernor.waitForDeployment();
    console.log('BridgeGovernor:', await bridgeGovernor.getAddress());

    // 7. Setup routes for supported chains
    const chainIds = {
        LUX: ethers.encodeBytes32String('LUX'),
        ZOO: ethers.encodeBytes32String('ZOO'),
        ETH: ethers.encodeBytes32String('ETH'),
        BASE: ethers.encodeBytes32String('BASE'),
        ARB: ethers.encodeBytes32String('ARB')
    };

    // Default route configuration: 0.1% fee, 0.001 ETH min, 1000 ETH max
    for (const [name, chainId] of Object.entries(chainIds)) {
        if (name !== 'LUX') { // Don't route to self
            await bridgeRouter.setRoute(
                chainId,
                await bridgeVault.getAddress(),
                ethers.parseEther('0.001'),  // minAmount
                ethers.parseEther('1000'),   // maxAmount
                10                            // 0.1% fee
            );
            console.log(`Route to ${name} configured`);
        }
    }

    return {
        tokenRegistry: await tokenRegistry.getAddress(),
        emergencyBrake: await emergencyBrake.getAddress(),
        bridgeVault: await bridgeVault.getAddress(),
        bridgeRouter: await bridgeRouter.getAddress(),
        bridgeGovernor: await bridgeGovernor.getAddress()
    };
}

// Verification script
async function verifyContracts(addresses: Record<string, string>) {
    const { run } = await import('hardhat');

    for (const [name, address] of Object.entries(addresses)) {
        console.log(`Verifying ${name} at ${address}...`);
        try {
            await run('verify:verify', {
                address: address,
                constructorArguments: []
            });
            console.log(`${name} verified`);
        } catch (e: any) {
            console.log(`${name} verification failed: ${e.message}`);
        }
    }
}

export { deployBridgeContracts, verifyContracts };
```

### Foundry Deployment

```solidity
// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/BridgeVault.sol";
import "../contracts/BridgeRouter.sol";
import "../contracts/TokenRegistry.sol";
import "../contracts/EmergencyBrake.sol";
import "../contracts/BridgeGovernor.sol";

contract DeployBridge is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address mpcSigner = vm.envAddress("MPC_SIGNER");
        address admin = vm.envAddress("ADMIN");
        address guardian = vm.envAddress("GUARDIAN");
        address feeCollector = vm.envAddress("FEE_COLLECTOR");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts
        TokenRegistry tokenRegistry = new TokenRegistry(admin);
        console.log("TokenRegistry:", address(tokenRegistry));

        address[] memory guardians = new address[](1);
        guardians[0] = guardian;
        EmergencyBrake emergencyBrake = new EmergencyBrake(admin, guardians);
        console.log("EmergencyBrake:", address(emergencyBrake));

        BridgeVault vault = new BridgeVault(mpcSigner, admin, guardian);
        console.log("BridgeVault:", address(vault));

        vault.setEmergencyBrake(address(emergencyBrake));

        BridgeRouter router = new BridgeRouter(admin, feeCollector, address(tokenRegistry));
        console.log("BridgeRouter:", address(router));

        BridgeGovernor governor = new BridgeGovernor(admin, 1 days);
        console.log("BridgeGovernor:", address(governor));

        vm.stopBroadcast();
    }
}
```

## Rationale

### Design Decisions

1. **EIP-712 Structured Signatures**: Using EIP-712 typed data provides clear message structure, prevents cross-contract replay, and enables hardware wallet display of signing parameters.

2. **Dual Nonce + TxHash Protection**: The combination of release nonce and source transaction hash provides defense-in-depth against replay attacks from different vectors.

3. **Timelocked Signer Updates**: The 1800-block delay (~6 hours) for MPC signer updates prevents instant key rotation attacks while allowing legitimate updates.

4. **Per-Token Daily Limits**: Configurable daily limits per token enable risk management without requiring global pause for large transfers.

5. **Separated Pause Roles**: Guardians can pause (fast response) but only Recovery role can unpause (prevents accidental/malicious unpause).

6. **AccessControl over Ownable**: Role-based access provides finer-grained permissions than single-owner patterns.

### Trade-offs

**Chosen Trade-off: Single Release Default with Batch Option**

The design defaults to single-release operations for simplicity and security, but provides batch release functionality for gas optimization during high-volume periods. Batch operations require additional signature overhead but reduce per-transaction costs by approximately 40%.

## Backwards Compatibility

### Existing Bridge Contracts

The specification maintains backwards compatibility with the existing `Bridge.sol` implementation at [github.com/luxfi/bridge](https://github.com/luxfi/bridge):

1. **Signature Format**: The MPC oracle address mapping (`MPCOracleAddrMap`) is replaced with the single `mpcSigner` address pattern, simplifying verification while maintaining the same security model.

2. **Transaction Mapping**: The existing `transactionMap` pattern is retained via `usedSourceTxHashes`.

3. **Vault Integration**: The `LuxVault` integration pattern is preserved, with enhanced interfaces for multi-chain routing.

### Migration Path

1. Deploy new contracts alongside existing
2. Register existing wrapped tokens in TokenRegistry
3. Gradually migrate liquidity to new vaults
4. Update T-Chain to sign for new contract addresses
5. Deprecate old contracts after migration period

## Test Cases

### Unit Tests (Foundry)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/BridgeVault.sol";
import "../contracts/BridgeRouter.sol";
import "../contracts/TokenRegistry.sol";
import "../contracts/EmergencyBrake.sol";

contract BridgeVaultTest is Test {
    BridgeVault vault;
    BridgeRouter router;
    TokenRegistry registry;
    EmergencyBrake brake;

    address mpcSigner;
    uint256 mpcSignerKey;
    address admin;
    address guardian;
    address user;
    address feeCollector;

    function setUp() public {
        (mpcSigner, mpcSignerKey) = makeAddrAndKey("mpcSigner");
        admin = makeAddr("admin");
        guardian = makeAddr("guardian");
        user = makeAddr("user");
        feeCollector = makeAddr("feeCollector");

        // Deploy contracts
        registry = new TokenRegistry(admin);

        address[] memory guardians = new address[](1);
        guardians[0] = guardian;
        brake = new EmergencyBrake(admin, guardians);

        vault = new BridgeVault(mpcSigner, admin, guardian);
        router = new BridgeRouter(admin, feeCollector, address(registry));

        // Configure vault
        vm.prank(admin);
        vault.setEmergencyBrake(address(brake));

        // Fund user
        vm.deal(user, 100 ether);
    }

    function testDeposit() public {
        vm.prank(user);
        uint256 nonce = vault.deposit{value: 1 ether}(
            address(0),
            1 ether,
            bytes32("ETH"),
            bytes32(uint256(uint160(user)))
        );

        assertEq(nonce, 1);
        assertEq(address(vault).balance, 1 ether);
    }

    function testRelease() public {
        // Setup: deposit first
        vm.prank(user);
        vault.deposit{value: 1 ether}(
            address(0),
            1 ether,
            bytes32("ETH"),
            bytes32(uint256(uint160(user)))
        );

        // Build release params
        IBridgeVault.ReleaseParams memory params = IBridgeVault.ReleaseParams({
            token: address(0),
            recipient: user,
            amount: 0.5 ether,
            sourceChainId: bytes32("LUX"),
            sourceTxHash: bytes32(uint256(1)),
            nonce: 1,
            deadline: block.timestamp + 1 hours
        });

        // Sign release
        bytes32 structHash = keccak256(
            abi.encode(
                vault.RELEASE_TYPEHASH(),
                params.token,
                params.recipient,
                params.amount,
                params.sourceChainId,
                params.sourceTxHash,
                params.nonce,
                params.deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", vault.DOMAIN_SEPARATOR(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(mpcSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Execute release
        uint256 balanceBefore = user.balance;
        vault.release(params, signature);

        assertEq(user.balance, balanceBefore + 0.5 ether);
        assertTrue(vault.usedNonces(1));
    }

    function testReplayPrevention() public {
        // Setup and first release
        vm.prank(user);
        vault.deposit{value: 2 ether}(
            address(0),
            2 ether,
            bytes32("ETH"),
            bytes32(uint256(uint160(user)))
        );

        IBridgeVault.ReleaseParams memory params = IBridgeVault.ReleaseParams({
            token: address(0),
            recipient: user,
            amount: 0.5 ether,
            sourceChainId: bytes32("LUX"),
            sourceTxHash: bytes32(uint256(1)),
            nonce: 1,
            deadline: block.timestamp + 1 hours
        });

        bytes32 structHash = keccak256(
            abi.encode(
                vault.RELEASE_TYPEHASH(),
                params.token,
                params.recipient,
                params.amount,
                params.sourceChainId,
                params.sourceTxHash,
                params.nonce,
                params.deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", vault.DOMAIN_SEPARATOR(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(mpcSignerKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // First release succeeds
        vault.release(params, signature);

        // Replay attempt fails
        vm.expectRevert("Nonce already used");
        vault.release(params, signature);
    }

    function testInvalidSignature() public {
        vm.prank(user);
        vault.deposit{value: 1 ether}(
            address(0),
            1 ether,
            bytes32("ETH"),
            bytes32(uint256(uint160(user)))
        );

        IBridgeVault.ReleaseParams memory params = IBridgeVault.ReleaseParams({
            token: address(0),
            recipient: user,
            amount: 0.5 ether,
            sourceChainId: bytes32("LUX"),
            sourceTxHash: bytes32(uint256(1)),
            nonce: 1,
            deadline: block.timestamp + 1 hours
        });

        // Sign with wrong key
        (address wrongSigner, uint256 wrongKey) = makeAddrAndKey("wrong");
        bytes32 structHash = keccak256(
            abi.encode(
                vault.RELEASE_TYPEHASH(),
                params.token,
                params.recipient,
                params.amount,
                params.sourceChainId,
                params.sourceTxHash,
                params.nonce,
                params.deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", vault.DOMAIN_SEPARATOR(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, digest);
        bytes memory wrongSignature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid signature");
        vault.release(params, wrongSignature);
    }

    function testEmergencyPause() public {
        vm.prank(guardian);
        vault.pause("Security incident");

        vm.prank(user);
        vm.expectRevert();
        vault.deposit{value: 1 ether}(
            address(0),
            1 ether,
            bytes32("ETH"),
            bytes32(uint256(uint160(user)))
        );
    }

    function testSignerUpdateTimelock() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(admin);
        vault.initiateSignerUpdate(newSigner);

        // Should fail before timelock
        vm.prank(admin);
        vm.expectRevert("Timelock not expired");
        vault.finalizeSignerUpdate();

        // Advance blocks
        vm.roll(block.number + vault.SIGNER_UPDATE_DELAY());

        // Should succeed after timelock
        vm.prank(admin);
        vault.finalizeSignerUpdate();

        assertEq(vault.mpcSigner(), newSigner);
    }

    function testDailyLimit() public {
        vm.prank(admin);
        vault.setDailyLimit(address(0), 1 ether);

        // Deposit enough for tests
        vm.prank(user);
        vault.deposit{value: 10 ether}(
            address(0),
            10 ether,
            bytes32("ETH"),
            bytes32(uint256(uint160(user)))
        );

        // First release within limit
        IBridgeVault.ReleaseParams memory params1 = IBridgeVault.ReleaseParams({
            token: address(0),
            recipient: user,
            amount: 1 ether,
            sourceChainId: bytes32("LUX"),
            sourceTxHash: bytes32(uint256(1)),
            nonce: 1,
            deadline: block.timestamp + 1 hours
        });

        bytes32 digest1 = _buildDigest(params1);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(mpcSignerKey, digest1);
        vault.release(params1, abi.encodePacked(r1, s1, v1));

        // Second release exceeds daily limit
        IBridgeVault.ReleaseParams memory params2 = IBridgeVault.ReleaseParams({
            token: address(0),
            recipient: user,
            amount: 0.5 ether,
            sourceChainId: bytes32("LUX"),
            sourceTxHash: bytes32(uint256(2)),
            nonce: 2,
            deadline: block.timestamp + 1 hours
        });

        bytes32 digest2 = _buildDigest(params2);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(mpcSignerKey, digest2);

        vm.expectRevert("Daily limit exceeded");
        vault.release(params2, abi.encodePacked(r2, s2, v2));
    }

    function _buildDigest(IBridgeVault.ReleaseParams memory params) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                vault.RELEASE_TYPEHASH(),
                params.token,
                params.recipient,
                params.amount,
                params.sourceChainId,
                params.sourceTxHash,
                params.nonce,
                params.deadline
            )
        );

        return keccak256(
            abi.encodePacked("\x19\x01", vault.DOMAIN_SEPARATOR(), structHash)
        );
    }
}
```

### Integration Tests

```typescript
// test/integration/bridge.test.ts
// Repository: https://github.com/luxfi/bridge
// Path: packages/contracts/test/integration/bridge.test.ts

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { LuxBridgeClient } from '../../src/client';

describe('Bridge Integration', () => {
    let luxVault: ethers.Contract;
    let ethVault: ethers.Contract;
    let client: LuxBridgeClient;
    let admin: ethers.Signer;
    let guardian: ethers.Signer;
    let user: ethers.Signer;
    let recipient: string;

    before(async () => {
        [admin, guardian, user] = await ethers.getSigners();
        recipient = await user.getAddress();

        // Deploy test contracts
        // ... deployment code ...
    });

    it('should complete full bridge flow LUX -> ETH', async () => {
        // 1. Deposit on LUX
        const depositTx = await luxVault.connect(user).deposit(
            ethers.ZeroAddress,
            ethers.parseEther('1'),
            ethers.encodeBytes32String('ETH'),
            ethers.zeroPadValue(recipient, 32),
            { value: ethers.parseEther('1') }
        );
        const depositReceipt = await depositTx.wait();

        // 2. Request signature from T-Chain (mocked in test)
        const releaseParams = {
            token: ethers.ZeroAddress,
            recipient: recipient,
            amount: ethers.parseEther('1'),
            sourceChainId: 'LUX',
            sourceTxHash: depositReceipt.hash,
            nonce: 1,
            deadline: Math.floor(Date.now() / 1000) + 3600
        };

        // 3. Execute release on ETH vault
        const signature = await mockTChainSignature(releaseParams);
        const releaseTx = await ethVault.release(releaseParams, signature);
        await releaseTx.wait();

        // 4. Verify recipient received funds
        const balance = await ethers.provider.getBalance(recipient);
        expect(balance).to.be.gt(ethers.parseEther('0.99')); // Account for gas
    });

    it('should prevent replay across chains', async () => {
        // Execute valid release on ETH
        await ethVault.release(releaseParams, signature);

        // Domain separator differs per chain, so same signature fails
        await expect(
            baseVault.release(releaseParams, signature)
        ).to.be.revertedWith('Invalid signature');
    });

    it('should handle emergency pause correctly', async () => {
        // Guardian pauses vault
        await ethVault.connect(guardian).pause('Security audit');

        // Deposits blocked
        await expect(
            ethVault.connect(user).deposit(
                ethers.ZeroAddress,
                ethers.parseEther('1'),
                ethers.encodeBytes32String('LUX'),
                ethers.zeroPadValue(recipient, 32),
                { value: ethers.parseEther('1') }
            )
        ).to.be.reverted;

        // Admin unpause
        await ethVault.connect(admin).unpause();

        // Operations resume
        await ethVault.connect(user).deposit(
            ethers.ZeroAddress,
            ethers.parseEther('1'),
            ethers.encodeBytes32String('LUX'),
            ethers.zeroPadValue(recipient, 32),
            { value: ethers.parseEther('1') }
        );
    });

    it('should respect daily limits', async () => {
        // Set 10 ETH daily limit
        await ethVault.connect(admin).setDailyLimit(ethers.ZeroAddress, ethers.parseEther('10'));

        // Multiple releases up to limit succeed
        for (let i = 0; i < 10; i++) {
            await executeRelease(ethers.parseEther('1'), i + 1);
        }

        // Next release fails
        await expect(
            executeRelease(ethers.parseEther('1'), 11)
        ).to.be.revertedWith('Daily limit exceeded');
    });
});
```

## Reference Implementation

### Repositories

- **Bridge Contracts**: [github.com/luxfi/bridge](https://github.com/luxfi/bridge)
- **SDK and Client**: [github.com/luxfi/sdk](https://github.com/luxfi/sdk)

### Local Development Paths

- **Existing Contracts**: `/home/z/work/lux/bridge/contracts/contracts/`
- **Bridge Interface**: `/home/z/work/lux/bridge/contracts/contracts/interfaces/IBridge.sol`
- **Vault Implementation**: `/home/z/work/lux/bridge/contracts/contracts/LuxVault.sol`
- **Main Bridge**: `/home/z/work/lux/bridge/contracts/contracts/Bridge.sol`

### Build and Test

```bash
# Using Hardhat
cd /home/z/work/lux/bridge/contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network localhost

# Using Foundry
forge build
forge test -vvv
forge script script/Deploy.s.sol --rpc-url http://localhost:9630/ext/bc/C/rpc --broadcast

# Deploy to LUX mainnet
npx hardhat run scripts/deploy.ts --network lux
# Or with Foundry
forge script script/Deploy.s.sol --rpc-url http://api.lux.network/ext/bc/C/rpc --broadcast --verify
```

## Security Considerations

### Security Audit Checklist

Before mainnet deployment, verify:

#### Smart Contract Security

- [ ] All external calls use ReentrancyGuard
- [ ] SafeERC20 used for all token transfers
- [ ] No arithmetic overflow/underflow (Solidity 0.8+)
- [ ] Access control properly configured on all admin functions
- [ ] EIP-712 domain separator includes chainId and contract address
- [ ] Signature verification uses ECDSA.recover (not ecrecover)
- [ ] Nonces cannot be reused
- [ ] Source tx hashes cannot be replayed
- [ ] Daily limits enforced correctly
- [ ] Emergency pause accessible to guardians
- [ ] Signer update timelock enforced
- [ ] No storage collisions in upgradeable contracts

#### Operational Security

- [ ] Admin keys stored in hardware security module
- [ ] Guardian keys distributed across geographic regions
- [ ] Monitoring and alerting configured for all contracts
- [ ] Incident response procedures documented
- [ ] Key rotation procedures tested

#### External Dependencies

- [ ] OpenZeppelin contracts at latest stable version
- [ ] No known vulnerabilities in dependencies
- [ ] Compiler version pinned (0.8.20)

### Audit Requirements

1. **Pre-Launch Audits** (Mandatory):
   - Two independent security audits (recommended: Trail of Bits, OpenZeppelin)
   - Formal verification of signature verification logic
   - Economic audit of fee mechanisms

2. **Ongoing Security**:
   - Quarterly security reviews
   - Bug bounty program ($100k-$1M rewards)
   - Real-time monitoring and alerting

### Known Attack Vectors and Mitigations

| Attack Vector | Risk | Mitigation |
|---------------|------|------------|
| **Signature Replay** | High | Nonce tracking, source tx hash tracking, chain-specific domain separator |
| **MPC Key Compromise** | Critical | Timelocked signer updates, T-Chain slashing, committee rotation via LSS |
| **Flash Loan Attacks** | Medium | Daily limits, minimum amounts, time delays |
| **Reentrancy** | High | ReentrancyGuard on all state-changing functions |
| **Front-Running** | Low | EIP-712 signatures bound to specific parameters |
| **Denial of Service** | Medium | Rate limiting via daily limits, emergency pause |
| **Governance Attack** | Medium | Timelock delays, multi-sig requirements |
| **Oracle Manipulation** | Low | T-Chain uses its own consensus, not external oracles |

### Security Properties

1. **Signature Integrity**: Only valid threshold signatures from T-Chain MPC committee can authorize releases
2. **Replay Resistance**: Each release can only be executed once per chain
3. **Pause Capability**: Any guardian can halt operations within seconds
4. **Recovery**: Admin can restore operations after security review
5. **Upgrade Safety**: Timelocked upgrades with governance approval

### Emergency Response Plan

1. **Detection** (0-5 min): Automated monitoring detects anomaly
2. **Triage** (5-15 min): Security team assesses severity
3. **Containment** (15-30 min): Guardian activates pause
4. **Investigation** (30-120 min): Root cause analysis
5. **Remediation** (2-24 hr): Patch and upgrade
6. **Post-Mortem** (24-72 hr): Full incident report

## Implementation

### Contract Deployment Order

1. TokenRegistry (no dependencies)
2. EmergencyBrake (requires guardian addresses)
3. BridgeVault (requires MPC signer address from T-Chain)
4. BridgeRouter (requires TokenRegistry, BridgeVault)
5. BridgeGovernor (requires admin multisig)

### Configuration Parameters

```solidity
// BridgeVault
SIGNER_UPDATE_DELAY = 1800 blocks (~6 hours)

// BridgeRouter
MAX_FEE_RATE = 500 (5%)
FEE_DENOMINATOR = 10000

// Default Route Config
minAmount = 0.001 ETH / 1 USDC
maxAmount = 1000 ETH / 1M USDC
feeRate = 10 (0.1%)

// BridgeGovernor
MIN_DELAY = 1 days
MAX_DELAY = 30 days
```

### Related LPs

- **[LP-0013](./lp-0013-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md)**: M-Chain Specification (legacy MPC custody layer)
- **[LP-0014](./lp-0014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md)**: M-Chain Threshold Signatures (CGG21 protocol)
- **[LP-0015](./lp-0015-mpc-bridge-protocol.md)**: MPC Bridge Protocol (bridge protocol overview)
- **[LP-0017](./lp-0017-bridge-asset-registry.md)**: Bridge Asset Registry (asset tracking)
- **[LP-0019](./lp-0019-bridge-security-framework.md)**: Bridge Security Framework (security requirements)
- **[LP-0301](./lp-0301-lux-b-chain-cross-chain-bridge-protocol.md)**: B-Chain Cross-Chain Bridge Protocol (legacy B-Chain integration)
- **[LP-0330](./lp-0330-t-chain-thresholdvm-specification.md)**: T-Chain ThresholdVM Specification (MPC key management)
- **[LP-0331](./lp-0331-b-chain-bridgevm-specification.md)**: B-Chain BridgeVM Specification (bridge coordination)
- **[LP-0332](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md)**: Teleport Bridge Architecture (unified protocol)
- **[LP-0333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md)**: Dynamic Signer Rotation (LSS protocol)
- **[LP-0334](./lp-0334-per-asset-threshold-key-management.md)**: Per-Asset Threshold Keys

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
