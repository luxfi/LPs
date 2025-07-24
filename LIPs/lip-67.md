---
lip: 67
title: Asynchronous Vault Standard (LRC-7540)
description: Extension of LRC-4626 for asynchronous deposit and redemption flows based on ERC-7540
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 64
---

## Abstract

This LIP extends LRC-4626 (LIP-64) to support asynchronous deposit and redemption flows, based on ERC-7540. This enables vaults to handle operations that cannot be completed immediately, such as real-world asset (RWA) protocols, cross-chain vaults, liquid staking, and other use cases requiring delayed execution.

## Motivation

Asynchronous vaults are needed for:

1. **Real-World Assets**: Settlement delays for traditional assets
2. **Cross-Chain Operations**: Bridge delays and finality requirements
3. **Liquid Staking**: Unstaking queues and validator exits
4. **Risk Management**: Time delays for large withdrawals
5. **Regulatory Compliance**: KYC/AML processing periods

## Specification

### Core Asynchronous Interface

```solidity
interface ILRC7540 is ILRC4626 {
    // Events for asynchronous operations
    event DepositRequest(
        address indexed sender,
        address indexed owner,
        uint256 indexed requestId,
        uint256 assets
    );
    
    event RedeemRequest(
        address indexed sender,
        address indexed owner,
        uint256 indexed requestId,
        uint256 shares
    );
    
    event DepositCompleted(
        address indexed sender,
        address indexed owner,
        uint256 indexed requestId,
        uint256 assets,
        uint256 shares
    );
    
    event RedeemCompleted(
        address indexed sender,
        address indexed owner,
        uint256 indexed requestId,
        uint256 shares,
        uint256 assets
    );
    
    event RequestCanceled(
        address indexed sender,
        uint256 indexed requestId
    );
    
    /**
     * @dev Initiates an asynchronous deposit request
     */
    function requestDeposit(
        uint256 assets,
        address owner,
        bytes calldata data
    ) external returns (uint256 requestId);
    
    /**
     * @dev Returns the status of a deposit request
     */
    function pendingDepositRequest(
        address owner,
        uint256 requestId
    ) external view returns (uint256 assets);
    
    /**
     * @dev Claims shares from a completed deposit request
     */
    function claimDeposit(
        uint256 requestId,
        address receiver
    ) external returns (uint256 shares);
    
    /**
     * @dev Initiates an asynchronous redemption request
     */
    function requestRedeem(
        uint256 shares,
        address owner,
        bytes calldata data
    ) external returns (uint256 requestId);
    
    /**
     * @dev Returns the status of a redemption request
     */
    function pendingRedeemRequest(
        address owner,
        uint256 requestId
    ) external view returns (uint256 shares);
    
    /**
     * @dev Claims assets from a completed redemption request
     */
    function claimRedeem(
        uint256 requestId,
        address receiver
    ) external returns (uint256 assets);
    
    /**
     * @dev Cancels a pending request
     */
    function cancelRequest(uint256 requestId) external;
    
    /**
     * @dev Returns whether a request can be claimed
     */
    function isRequestClaimable(uint256 requestId) external view returns (bool);
}
```

### Request Management Extension

```solidity
interface ILRC7540RequestInfo is ILRC7540 {
    enum RequestStatus {
        None,
        Pending,
        Claimable,
        Claimed,
        Canceled
    }
    
    struct RequestInfo {
        RequestStatus status;
        address owner;
        uint256 amount;         // Assets for deposit, shares for redeem
        uint256 createdAt;
        uint256 claimableAt;
        uint256 expiresAt;
        bytes32 dataHash;       // Hash of additional data
    }
    
    /**
     * @dev Returns detailed information about a request
     */
    function getRequestInfo(uint256 requestId) external view returns (RequestInfo memory);
    
    /**
     * @dev Returns all request IDs for an owner
     */
    function getRequestIds(address owner) external view returns (uint256[] memory);
    
    /**
     * @dev Returns the expected completion time for pending requests
     */
    function expectedCompletionTime(uint256 requestId) external view returns (uint256);
    
    /**
     * @dev Processes a batch of requests (admin function)
     */
    function processPendingRequests(uint256[] calldata requestIds) external;
}
```

### Epoch-Based Processing

```solidity
interface ILRC7540Epochs is ILRC7540 {
    struct Epoch {
        uint256 depositRequestAmount;
        uint256 redeemRequestAmount;
        uint256 depositSharePrice;    // Price for deposits in this epoch
        uint256 redeemSharePrice;     // Price for redemptions in this epoch
        uint256 startTime;
        uint256 endTime;
        bool processed;
    }
    
    event EpochStarted(uint256 indexed epochId, uint256 startTime, uint256 endTime);
    event EpochProcessed(uint256 indexed epochId, uint256 depositPrice, uint256 redeemPrice);
    
    /**
     * @dev Returns the current epoch ID
     */
    function currentEpoch() external view returns (uint256);
    
    /**
     * @dev Returns epoch information
     */
    function epochInfo(uint256 epochId) external view returns (Epoch memory);
    
    /**
     * @dev Queues a deposit for the next epoch
     */
    function queueDeposit(uint256 assets, address owner) external returns (uint256 epochId);
    
    /**
     * @dev Queues a redemption for the next epoch
     */
    function queueRedeem(uint256 shares, address owner) external returns (uint256 epochId);
    
    /**
     * @dev Processes all requests in an epoch
     */
    function processEpoch(uint256 epochId) external;
}
```

### Cross-Chain Async Extension

```solidity
interface ILRC7540CrossChain is ILRC7540 {
    struct CrossChainRequest {
        uint256 sourceChain;
        uint256 targetChain;
        bytes32 bridgeId;
        uint256 bridgeFee;
        uint256 estimatedTime;
    }
    
    event CrossChainDepositInitiated(
        uint256 indexed requestId,
        uint256 sourceChain,
        uint256 targetChain,
        bytes32 bridgeId
    );
    
    event CrossChainRedeemInitiated(
        uint256 indexed requestId,
        uint256 sourceChain,
        uint256 targetChain,
        bytes32 bridgeId
    );
    
    /**
     * @dev Initiates a cross-chain deposit
     */
    function requestCrossChainDeposit(
        uint256 assets,
        address owner,
        uint256 targetChain,
        bytes calldata bridgeData
    ) external payable returns (uint256 requestId);
    
    /**
     * @dev Gets cross-chain request details
     */
    function crossChainRequestInfo(
        uint256 requestId
    ) external view returns (CrossChainRequest memory);
    
    /**
     * @dev Estimates time for cross-chain operation
     */
    function estimateCrossChainTime(
        uint256 targetChain
    ) external view returns (uint256 seconds);
}
```

## Rationale

### Request-Based Model

The request model allows:
- Tracking of pending operations
- Cancellation capabilities
- Batch processing efficiency
- Better UX with status updates

### Separation of Request and Claim

Separating operations enables:
- Gas cost optimization
- Better error handling
- Flexible execution timing
- Multi-step processes

### Backward Compatibility

Maintaining LRC-4626 interface ensures:
- Existing integrations work
- Synchronous operations still possible
- Gradual migration path

## Backwards Compatibility

This standard extends LRC-4626 while maintaining full backward compatibility. Vaults can implement both synchronous and asynchronous operations, with synchronous operations using the original LRC-4626 interface.

## Test Cases

### Basic Async Operations

```solidity
contract AsyncVaultTest {
    ILRC7540 asyncVault;
    IERC20 asset;
    
    function testAsyncDeposit() public {
        uint256 depositAmount = 1000 * 10**18;
        asset.approve(address(asyncVault), depositAmount);
        
        // Request deposit
        uint256 requestId = asyncVault.requestDeposit(
            depositAmount,
            address(this),
            ""
        );
        
        // Check request status
        uint256 pending = asyncVault.pendingDepositRequest(
            address(this),
            requestId
        );
        assertEq(pending, depositAmount);
        
        // Wait for processing
        vm.warp(block.timestamp + 1 days);
        
        // Claim shares
        assertTrue(asyncVault.isRequestClaimable(requestId));
        uint256 shares = asyncVault.claimDeposit(requestId, address(this));
        
        assertTrue(shares > 0);
        assertEq(asyncVault.balanceOf(address(this)), shares);
    }
    
    function testRequestCancellation() public {
        uint256 depositAmount = 1000 * 10**18;
        asset.approve(address(asyncVault), depositAmount);
        
        uint256 requestId = asyncVault.requestDeposit(
            depositAmount,
            address(this),
            ""
        );
        
        // Cancel before processing
        asyncVault.cancelRequest(requestId);
        
        // Verify refund
        assertEq(
            asyncVault.pendingDepositRequest(address(this), requestId),
            0
        );
    }
}
```

### Epoch-Based Testing

```solidity
function testEpochProcessing() public {
    ILRC7540Epochs epochVault = ILRC7540Epochs(address(asyncVault));
    
    uint256 epoch1 = epochVault.currentEpoch();
    
    // Queue multiple deposits
    epochVault.queueDeposit(1000 * 10**18, address(this));
    epochVault.queueDeposit(2000 * 10**18, address(0x123));
    
    // Move to next epoch
    vm.warp(block.timestamp + 1 weeks);
    
    // Process previous epoch
    epochVault.processEpoch(epoch1);
    
    // Check epoch info
    ILRC7540Epochs.Epoch memory epochInfo = epochVault.epochInfo(epoch1);
    assertTrue(epochInfo.processed);
    assertTrue(epochInfo.depositSharePrice > 0);
}
```

## Reference Implementation

```solidity
contract LRC7540AsyncVault is LRC4626Vault, ILRC7540, ILRC7540RequestInfo {
    using SafeERC20 for IERC20;
    
    uint256 private _nextRequestId = 1;
    mapping(uint256 => RequestInfo) private _requests;
    mapping(address => uint256[]) private _userRequests;
    
    uint256 public processingDelay = 1 days;
    uint256 public requestExpiry = 7 days;
    
    function requestDeposit(
        uint256 assets,
        address owner,
        bytes calldata data
    ) external override returns (uint256 requestId) {
        require(assets > 0, "Zero assets");
        
        // Transfer assets to vault
        asset().safeTransferFrom(msg.sender, address(this), assets);
        
        requestId = _nextRequestId++;
        
        _requests[requestId] = RequestInfo({
            status: RequestStatus.Pending,
            owner: owner,
            amount: assets,
            createdAt: block.timestamp,
            claimableAt: block.timestamp + processingDelay,
            expiresAt: block.timestamp + requestExpiry,
            dataHash: keccak256(data)
        });
        
        _userRequests[owner].push(requestId);
        
        emit DepositRequest(msg.sender, owner, requestId, assets);
    }
    
    function claimDeposit(
        uint256 requestId,
        address receiver
    ) external override returns (uint256 shares) {
        RequestInfo storage request = _requests[requestId];
        
        require(request.status == RequestStatus.Pending, "Invalid request");
        require(request.owner == msg.sender, "Not owner");
        require(block.timestamp >= request.claimableAt, "Not claimable yet");
        require(block.timestamp < request.expiresAt, "Request expired");
        
        // Calculate shares at current rate
        shares = convertToShares(request.amount);
        
        // Update request status
        request.status = RequestStatus.Claimed;
        
        // Mint shares
        _mint(receiver, shares);
        
        emit DepositCompleted(msg.sender, request.owner, requestId, request.amount, shares);
    }
    
    function requestRedeem(
        uint256 shares,
        address owner,
        bytes calldata data
    ) external override returns (uint256 requestId) {
        require(shares > 0, "Zero shares");
        require(balanceOf(msg.sender) >= shares, "Insufficient balance");
        
        // Lock shares
        _transfer(msg.sender, address(this), shares);
        
        requestId = _nextRequestId++;
        
        _requests[requestId] = RequestInfo({
            status: RequestStatus.Pending,
            owner: owner,
            amount: shares,
            createdAt: block.timestamp,
            claimableAt: block.timestamp + processingDelay,
            expiresAt: block.timestamp + requestExpiry,
            dataHash: keccak256(data)
        });
        
        _userRequests[owner].push(requestId);
        
        emit RedeemRequest(msg.sender, owner, requestId, shares);
    }
    
    function claimRedeem(
        uint256 requestId,
        address receiver
    ) external override returns (uint256 assets) {
        RequestInfo storage request = _requests[requestId];
        
        require(request.status == RequestStatus.Pending, "Invalid request");
        require(request.owner == msg.sender, "Not owner");
        require(block.timestamp >= request.claimableAt, "Not claimable yet");
        require(block.timestamp < request.expiresAt, "Request expired");
        
        // Calculate assets at current rate
        assets = convertToAssets(request.amount);
        
        // Update request status
        request.status = RequestStatus.Claimed;
        
        // Burn shares
        _burn(address(this), request.amount);
        
        // Transfer assets
        asset().safeTransfer(receiver, assets);
        
        emit RedeemCompleted(msg.sender, request.owner, requestId, request.amount, assets);
    }
    
    function cancelRequest(uint256 requestId) external override {
        RequestInfo storage request = _requests[requestId];
        
        require(request.status == RequestStatus.Pending, "Invalid request");
        require(request.owner == msg.sender, "Not owner");
        require(block.timestamp < request.claimableAt, "Already claimable");
        
        request.status = RequestStatus.Canceled;
        
        // Refund based on request type (simplified - check actual implementation)
        if (request.dataHash == keccak256("deposit")) {
            asset().safeTransfer(msg.sender, request.amount);
        } else {
            _transfer(address(this), msg.sender, request.amount);
        }
        
        emit RequestCanceled(msg.sender, requestId);
    }
    
    function isRequestClaimable(uint256 requestId) external view override returns (bool) {
        RequestInfo memory request = _requests[requestId];
        
        return request.status == RequestStatus.Pending &&
               block.timestamp >= request.claimableAt &&
               block.timestamp < request.expiresAt;
    }
    
    function pendingDepositRequest(
        address owner,
        uint256 requestId
    ) external view override returns (uint256) {
        RequestInfo memory request = _requests[requestId];
        
        if (request.owner != owner || request.status != RequestStatus.Pending) {
            return 0;
        }
        
        return request.amount;
    }
    
    function pendingRedeemRequest(
        address owner,
        uint256 requestId
    ) external view override returns (uint256) {
        RequestInfo memory request = _requests[requestId];
        
        if (request.owner != owner || request.status != RequestStatus.Pending) {
            return 0;
        }
        
        return request.amount;
    }
}
```

## Security Considerations

### Request Expiration

Implement expiration to prevent stale requests:
```solidity
require(block.timestamp < request.expiresAt, "Request expired");
```

### Front-Running Protection

Use commit-reveal for sensitive operations:
```solidity
bytes32 commitment = keccak256(abi.encode(user, amount, nonce));
```

### Reentrancy

Protect all state-changing operations:
```solidity
request.status = RequestStatus.Claimed; // Update before transfer
asset().safeTransfer(receiver, assets);
```

### Access Control

Ensure only authorized parties can process requests:
```solidity
modifier onlyProcessor() {
    require(processors[msg.sender], "Not authorized");
    _;
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).