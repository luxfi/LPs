---
lip: 72
title: Bridged Asset Standard
description: Standard for bridged tokens from external chains to Lux Network
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 20, 13
---

## Abstract

This LIP defines a standard for bridged assets on the Lux Network, including tokens bridged from external chains (like Bitcoin, Ethereum, BSC) through the M-Chain bridge. It specifies interfaces for minting, burning, and managing bridged tokens while maintaining security, tracking origin chains, and enabling cross-chain composability.

## Motivation

Standardized bridged assets enable:

1. **Cross-Chain Liquidity**: Access to assets from other chains
2. **Consistent Interfaces**: Uniform interaction with bridged tokens
3. **Security Standards**: Common security patterns for bridges
4. **Origin Tracking**: Clear identification of source chains
5. **Composability**: Integration with DeFi protocols

## Specification

### Core Bridged Asset Interface

```solidity
interface ILuxBridgedAsset is ILRC20 {
    struct BridgeInfo {
        address originToken;    // Token address on origin chain
        uint256 originChainId;  // Origin chain ID
        uint8 originDecimals;   // Original token decimals
        string originSymbol;    // Original token symbol
        string originName;      // Original token name
    }
    
    struct BridgeConfig {
        address bridge;         // Authorized bridge contract
        uint256 minBridge;      // Minimum bridge amount
        uint256 maxBridge;      // Maximum bridge amount
        uint256 dailyLimit;     // Daily bridge limit
        bool paused;            // Bridge pause status
    }
    
    // Events
    event BridgedIn(
        address indexed recipient,
        uint256 amount,
        uint256 originChainId,
        bytes32 originTxHash
    );
    
    event BridgedOut(
        address indexed sender,
        uint256 amount,
        uint256 targetChainId,
        address targetRecipient
    );
    
    event BridgeConfigUpdated(
        address indexed bridge,
        uint256 minBridge,
        uint256 maxBridge,
        uint256 dailyLimit
    );
    
    event OriginTokenUpdated(
        address originToken,
        uint256 originChainId
    );
    
    // Bridge functions
    function mint(address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external returns (bool);
    function burnFrom(address from, uint256 amount) external returns (bool);
    
    // Bridge management
    function setBridgeConfig(BridgeConfig calldata config) external;
    function pauseBridge() external;
    function unpauseBridge() external;
    
    // View functions
    function bridgeInfo() external view returns (BridgeInfo memory);
    function bridgeConfig() external view returns (BridgeConfig memory);
    function isBridged() external view returns (bool);
    function getDailyBridged(address user) external view returns (uint256);
}
```

### Multi-Bridge Support

```solidity
interface IMultiBridgeAsset is ILuxBridgedAsset {
    struct BridgeEndpoint {
        address bridge;
        uint256 chainId;
        bool active;
        uint256 totalBridged;
        uint256 totalRedeemed;
    }
    
    event BridgeAdded(
        address indexed bridge,
        uint256 indexed chainId
    );
    
    event BridgeRemoved(
        address indexed bridge,
        uint256 indexed chainId
    );
    
    event BridgeRouted(
        address indexed user,
        uint256 amount,
        address fromBridge,
        address toBridge
    );
    
    function addBridge(
        address bridge,
        uint256 chainId
    ) external;
    
    function removeBridge(address bridge) external;
    
    function routeBetweenBridges(
        uint256 amount,
        address fromBridge,
        address toBridge
    ) external;
    
    function getBridgeEndpoints() external view returns (BridgeEndpoint[] memory);
    function getBridgeBalance(address bridge) external view returns (uint256);
}
```

### Proof of Reserve Extension

```solidity
interface IBridgedAssetReserve is ILuxBridgedAsset {
    struct ReserveProof {
        uint256 totalLocked;        // Total locked on origin chain
        uint256 totalMinted;        // Total minted on Lux
        bytes32 merkleRoot;         // Merkle root of reserves
        uint256 attestationTime;    // Time of attestation
        address[] attestors;        // Attestor addresses
        bytes[] signatures;         // Attestor signatures
    }
    
    event ReserveProofSubmitted(
        uint256 totalLocked,
        uint256 totalMinted,
        uint256 attestationTime
    );
    
    event ReserveDiscrepancy(
        uint256 locked,
        uint256 minted,
        uint256 difference
    );
    
    function submitReserveProof(
        ReserveProof calldata proof
    ) external;
    
    function verifyReserves() external view returns (bool isFullyBacked);
    
    function getReserveRatio() external view returns (uint256);
    
    function getLatestProof() external view returns (ReserveProof memory);
}
```

### Fee Management Extension

```solidity
interface IBridgedAssetFees is ILuxBridgedAsset {
    struct FeeConfig {
        uint256 bridgeInFee;        // Basis points
        uint256 bridgeOutFee;       // Basis points
        address feeRecipient;       // Fee collection address
        bool dynamicFees;           // Enable dynamic fee adjustment
    }
    
    struct DynamicFeeParams {
        uint256 baseFee;
        uint256 congestionMultiplier;
        uint256 utilizationTarget;
        uint256 maxFee;
    }
    
    event FeesCollected(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );
    
    event FeeConfigUpdated(
        uint256 bridgeInFee,
        uint256 bridgeOutFee
    );
    
    function setFeeConfig(FeeConfig calldata config) external;
    
    function setDynamicFeeParams(DynamicFeeParams calldata params) external;
    
    function calculateBridgeFee(
        uint256 amount,
        bool isBridgingIn
    ) external view returns (uint256);
    
    function collectFees() external;
    
    function getFeeConfig() external view returns (FeeConfig memory);
}
```

### Emergency Controls

```solidity
interface IBridgedAssetEmergency is ILuxBridgedAsset {
    enum EmergencyAction {
        None,
        PauseBridge,
        FreezeAsset,
        EnableRecovery
    }
    
    struct EmergencyState {
        EmergencyAction action;
        uint256 activatedAt;
        uint256 expiresAt;
        string reason;
        address initiator;
    }
    
    event EmergencyActivated(
        EmergencyAction action,
        string reason,
        address initiator
    );
    
    event EmergencyDeactivated(
        address deactivator
    );
    
    event AssetRecovered(
        address indexed user,
        uint256 amount,
        bytes proof
    );
    
    function declareEmergency(
        EmergencyAction action,
        uint256 duration,
        string calldata reason
    ) external;
    
    function deactivateEmergency() external;
    
    function recoverAssets(
        uint256 amount,
        bytes calldata proof
    ) external;
    
    function getEmergencyState() external view returns (EmergencyState memory);
}
```

## Rationale

### Origin Chain Tracking

Maintaining origin information ensures:
- Clear asset provenance
- Proper decimal handling
- Consistent naming across chains
- Audit trail for bridges

### Multiple Bridge Support

Supporting multiple bridges provides:
- Redundancy and reliability
- Competitive fee markets
- Risk distribution
- Upgrade flexibility

### Reserve Proofs

Proof of reserves ensures:
- 1:1 backing verification
- Transparency for users
- Early warning for issues
- Regulatory compliance

## Backwards Compatibility

This standard extends LRC-20 and maintains compatibility with:
- Standard token interfaces
- Existing DeFi protocols
- Wallet infrastructure
- Bridge aggregators

## Test Cases

### Basic Bridge Operations

```solidity
contract BridgedAssetTest {
    ILuxBridgedAsset bridgedToken;
    address bridge = address(0x123);
    
    function setUp() public {
        // Deploy bridged token
        bridgedToken = new BridgedBTC(
            "Lux Bridged Bitcoin",
            "LBTC",
            8,
            bridge
        );
    }
    
    function testMintBridgedTokens() public {
        uint256 amount = 1 * 10**8; // 1 BTC
        
        // Only bridge can mint
        vm.prank(bridge);
        bridgedToken.mint(address(this), amount);
        
        assertEq(bridgedToken.balanceOf(address(this)), amount);
        assertEq(bridgedToken.totalSupply(), amount);
    }
    
    function testBurnForBridgeOut() public {
        // First mint some tokens
        vm.prank(bridge);
        bridgedToken.mint(address(this), 1 * 10**8);
        
        // Burn to bridge out
        uint256 burnAmount = 0.5 * 10**8;
        bridgedToken.burn(burnAmount);
        
        assertEq(bridgedToken.balanceOf(address(this)), 0.5 * 10**8);
        assertEq(bridgedToken.totalSupply(), 0.5 * 10**8);
    }
    
    function testBridgeLimits() public {
        ILuxBridgedAsset.BridgeConfig memory config = ILuxBridgedAsset.BridgeConfig({
            bridge: bridge,
            minBridge: 0.01 * 10**8,  // 0.01 BTC min
            maxBridge: 10 * 10**8,     // 10 BTC max
            dailyLimit: 100 * 10**8,   // 100 BTC daily
            paused: false
        });
        
        bridgedToken.setBridgeConfig(config);
        
        // Test min limit
        vm.prank(bridge);
        vm.expectRevert("Below minimum");
        bridgedToken.mint(address(this), 0.001 * 10**8);
        
        // Test max limit
        vm.prank(bridge);
        vm.expectRevert("Above maximum");
        bridgedToken.mint(address(this), 11 * 10**8);
    }
}
```

### Reserve Proof Testing

```solidity
function testReserveProof() public {
    IBridgedAssetReserve reserveToken = IBridgedAssetReserve(address(bridgedToken));
    
    // Submit reserve proof
    IBridgedAssetReserve.ReserveProof memory proof = IBridgedAssetReserve.ReserveProof({
        totalLocked: 1000 * 10**8,
        totalMinted: 1000 * 10**8,
        merkleRoot: keccak256("reserves"),
        attestationTime: block.timestamp,
        attestors: new address[](3),
        signatures: new bytes[](3)
    });
    
    reserveToken.submitReserveProof(proof);
    
    // Verify reserves are fully backed
    assertTrue(reserveToken.verifyReserves());
    assertEq(reserveToken.getReserveRatio(), 100); // 100% backed
}
```

## Reference Implementation

```solidity
contract LuxBridgedAsset is ERC20, ILuxBridgedAsset, IBridgedAssetFees, Ownable {
    BridgeInfo public bridgeInfo;
    BridgeConfig public bridgeConfig;
    FeeConfig public feeConfig;
    
    mapping(address => uint256) public lastBridgeTime;
    mapping(address => uint256) public dailyBridged;
    
    modifier onlyBridge() {
        require(msg.sender == bridgeConfig.bridge, "Not bridge");
        _;
    }
    
    modifier notPaused() {
        require(!bridgeConfig.paused, "Bridge paused");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address _bridge,
        address _originToken,
        uint256 _originChainId
    ) ERC20(name, symbol) {
        require(_bridge != address(0), "Invalid bridge");
        
        _setupDecimals(decimals);
        
        bridgeInfo = BridgeInfo({
            originToken: _originToken,
            originChainId: _originChainId,
            originDecimals: decimals,
            originSymbol: symbol,
            originName: name
        });
        
        bridgeConfig = BridgeConfig({
            bridge: _bridge,
            minBridge: 0,
            maxBridge: type(uint256).max,
            dailyLimit: type(uint256).max,
            paused: false
        });
        
        feeConfig = FeeConfig({
            bridgeInFee: 30,  // 0.3%
            bridgeOutFee: 30, // 0.3%
            feeRecipient: owner(),
            dynamicFees: false
        });
    }
    
    function mint(address to, uint256 amount) 
        external 
        override 
        onlyBridge 
        notPaused 
        returns (bool) 
    {
        require(amount >= bridgeConfig.minBridge, "Below minimum");
        require(amount <= bridgeConfig.maxBridge, "Above maximum");
        
        // Check daily limit
        if (block.timestamp > lastBridgeTime[to] + 1 days) {
            dailyBridged[to] = 0;
            lastBridgeTime[to] = block.timestamp;
        }
        require(
            dailyBridged[to] + amount <= bridgeConfig.dailyLimit,
            "Daily limit exceeded"
        );
        
        dailyBridged[to] += amount;
        
        // Calculate and deduct fees
        uint256 fee = calculateBridgeFee(amount, true);
        uint256 netAmount = amount - fee;
        
        _mint(to, netAmount);
        if (fee > 0) {
            _mint(feeConfig.feeRecipient, fee);
            emit FeesCollected(address(this), fee, feeConfig.feeRecipient);
        }
        
        emit BridgedIn(to, netAmount, bridgeInfo.originChainId, bytes32(0));
        
        return true;
    }
    
    function burn(uint256 amount) 
        external 
        override 
        notPaused 
        returns (bool) 
    {
        return _burnWithFee(msg.sender, amount);
    }
    
    function burnFrom(address from, uint256 amount) 
        external 
        override 
        notPaused 
        returns (bool) 
    {
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        
        _approve(from, msg.sender, currentAllowance - amount);
        return _burnWithFee(from, amount);
    }
    
    function _burnWithFee(address from, uint256 amount) internal returns (bool) {
        require(amount >= bridgeConfig.minBridge, "Below minimum");
        require(amount <= bridgeConfig.maxBridge, "Above maximum");
        
        // Calculate fee on the burn amount
        uint256 fee = calculateBridgeFee(amount, false);
        uint256 totalBurn = amount + fee;
        
        require(balanceOf(from) >= totalBurn, "Insufficient balance");
        
        _burn(from, amount);
        if (fee > 0) {
            _transfer(from, feeConfig.feeRecipient, fee);
            emit FeesCollected(address(this), fee, feeConfig.feeRecipient);
        }
        
        emit BridgedOut(from, amount, bridgeInfo.originChainId, from);
        
        return true;
    }
    
    function calculateBridgeFee(
        uint256 amount,
        bool isBridgingIn
    ) public view override returns (uint256) {
        uint256 feeBps = isBridgingIn ? feeConfig.bridgeInFee : feeConfig.bridgeOutFee;
        return (amount * feeBps) / 10000;
    }
    
    function setBridgeConfig(BridgeConfig calldata config) 
        external 
        override 
        onlyOwner 
    {
        require(config.bridge != address(0), "Invalid bridge");
        require(config.minBridge <= config.maxBridge, "Invalid limits");
        
        bridgeConfig = config;
        
        emit BridgeConfigUpdated(
            config.bridge,
            config.minBridge,
            config.maxBridge,
            config.dailyLimit
        );
    }
    
    function setFeeConfig(FeeConfig calldata config) 
        external 
        override 
        onlyOwner 
    {
        require(config.bridgeInFee <= 1000, "Fee too high"); // Max 10%
        require(config.bridgeOutFee <= 1000, "Fee too high");
        require(config.feeRecipient != address(0), "Invalid recipient");
        
        feeConfig = config;
        
        emit FeeConfigUpdated(config.bridgeInFee, config.bridgeOutFee);
    }
    
    function pauseBridge() external override onlyOwner {
        bridgeConfig.paused = true;
    }
    
    function unpauseBridge() external override onlyOwner {
        bridgeConfig.paused = false;
    }
    
    function isBridged() external pure override returns (bool) {
        return true;
    }
    
    function getDailyBridged(address user) external view override returns (uint256) {
        if (block.timestamp > lastBridgeTime[user] + 1 days) {
            return 0;
        }
        return dailyBridged[user];
    }
}
```

## Security Considerations

### Bridge Authority

Only authorized bridges can mint:
```solidity
modifier onlyBridge() {
    require(msg.sender == bridgeConfig.bridge, "Not bridge");
    _;
}
```

### Supply Verification

Regular reserve proofs ensure backing:
```solidity
require(totalLocked >= totalSupply(), "Undercollateralized");
```

### Rate Limiting

Implement daily limits to prevent attacks:
```solidity
require(dailyBridged[user] + amount <= dailyLimit, "Limit exceeded");
```

### Emergency Procedures

Have pause mechanisms for security:
```solidity
function emergencyPause() external onlyOwner {
    _pause();
    emit EmergencyActivated("Bridge paused");
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).