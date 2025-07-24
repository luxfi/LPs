---
lip: 74
title: CREATE2 Factory Standard
description: Defines a standard interface for deterministic contract deployment factories using CREATE2
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 1
---

## Abstract

This LIP defines a standard interface for CREATE2 factory contracts on the Lux Network, enabling deterministic contract deployment across all chains. The standard ensures consistent contract addresses regardless of deployment order, facilitating cross-chain deployments, counterfactual instantiation, and upgradeable proxy patterns.

## Motivation

Deterministic contract deployment is essential for:

1. **Cross-Chain Consistency**: Deploy contracts to the same address on P-Chain, X-Chain, C-Chain, M-Chain, and Z-Chain
2. **Counterfactual Instantiation**: Interact with contracts before deployment
3. **Gas Optimization**: Deploy contracts only when needed
4. **Upgrade Patterns**: Predictable proxy addresses for upgradeable contracts
5. **Multi-Chain dApps**: Simplified configuration with consistent addresses

## Specification

### Core Factory Interface

```solidity
interface ICREATE2Factory {
    // Events
    event ContractDeployed(
        address indexed deployer,
        address indexed deployed,
        bytes32 indexed salt,
        bytes32 bytecodeHash
    );
    
    event ImplementationRegistered(
        bytes32 indexed implementationId,
        address indexed implementation,
        uint256 version
    );
    
    // Core deployment functions
    function deploy(
        bytes32 salt,
        bytes memory bytecode
    ) external returns (address deployed);
    
    function deployWithConstructor(
        bytes32 salt,
        bytes memory bytecode,
        bytes memory constructorArgs
    ) external returns (address deployed);
    
    function deployProxy(
        bytes32 salt,
        address implementation,
        bytes memory initData
    ) external returns (address proxy);
    
    function deployMinimal(
        bytes32 salt,
        address implementation
    ) external returns (address minimal);
    
    // Deployment prediction
    function computeAddress(
        bytes32 salt,
        bytes32 bytecodeHash
    ) external view returns (address);
    
    function computeAddressWithDeployer(
        bytes32 salt,
        bytes32 bytecodeHash,
        address deployer
    ) external pure returns (address);
    
    // Registry functions
    function registerImplementation(
        bytes32 implementationId,
        address implementation,
        uint256 version
    ) external;
    
    function getImplementation(
        bytes32 implementationId,
        uint256 version
    ) external view returns (address);
    
    // Batch operations
    function batchDeploy(
        bytes32[] calldata salts,
        bytes[] calldata bytecodes
    ) external returns (address[] memory deployed);
    
    // Cross-chain deployment tracking
    function getDeploymentInfo(
        address deployed
    ) external view returns (
        address deployer,
        bytes32 salt,
        uint256 timestamp,
        string memory sourceChain
    );
}
```

### Extended Factory Features

```solidity
interface ICREATE2FactoryExtended is ICREATE2Factory {
    // Singleton pattern support
    function deploySingleton(
        bytes32 salt,
        bytes memory bytecode
    ) external returns (address singleton);
    
    function getSingleton(
        bytes32 salt,
        bytes32 bytecodeHash
    ) external view returns (address);
    
    // Upgradeable proxy deployment
    function deployUpgradeableProxy(
        bytes32 salt,
        address implementation,
        address admin,
        bytes memory initData
    ) external returns (address proxy);
    
    // Beacon proxy deployment
    function deployBeaconProxy(
        bytes32 salt,
        address beacon,
        bytes memory initData
    ) external returns (address proxy);
    
    // Diamond pattern support
    function deployDiamond(
        bytes32 salt,
        address[] memory facets,
        bytes4[][] memory selectors,
        address init,
        bytes memory initData
    ) external returns (address diamond);
    
    // Deterministic clone deployment
    function deployClone(
        bytes32 salt,
        address master
    ) external returns (address clone);
    
    // Multi-chain deployment coordination
    function requestCrossChainDeployment(
        string memory targetChain,
        bytes32 salt,
        bytes memory bytecode,
        uint256 gasLimit
    ) external payable returns (bytes32 requestId);
    
    function confirmCrossChainDeployment(
        bytes32 requestId,
        address deployedAddress
    ) external;
}
```

### Salt Generation Standards

```solidity
library SaltGenerator {
    // Standard salt generation patterns
    function generateSalt(
        address deployer,
        uint256 nonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(deployer, nonce));
    }
    
    function generateSaltWithData(
        address deployer,
        bytes memory data
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(deployer, data));
    }
    
    function generateCrossChainSalt(
        string memory projectId,
        string memory contractName,
        uint256 version
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(projectId, contractName, version));
    }
    
    function generateDeterministicSalt(
        bytes32 seed,
        uint256 chainId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(seed, chainId));
    }
}
```

### Minimal Proxy Implementation

```solidity
contract MinimalProxyFactory {
    // EIP-1167 minimal proxy bytecode
    function getMinimalProxyCreationCode(
        address implementation
    ) public pure returns (bytes memory) {
        return abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
    }
    
    function deployMinimalProxy(
        bytes32 salt,
        address implementation
    ) external returns (address proxy) {
        bytes memory bytecode = getMinimalProxyCreationCode(implementation);
        assembly {
            proxy := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(proxy)) {
                revert(0, 0)
            }
        }
        emit ProxyDeployed(implementation, proxy, salt);
    }
}
```

### Registry Pattern

```solidity
contract CREATE2Registry {
    struct DeploymentRecord {
        address deployer;
        address deployed;
        bytes32 salt;
        bytes32 bytecodeHash;
        uint256 timestamp;
        string chainName;
        bytes metadata;
    }
    
    // Deployment tracking
    mapping(address => DeploymentRecord) public deployments;
    mapping(bytes32 => address[]) public deploymentsBySalt;
    mapping(address => address[]) public deploymentsByDeployer;
    
    // Implementation registry
    mapping(bytes32 => mapping(uint256 => address)) public implementations;
    mapping(address => ImplementationInfo) public implementationInfo;
    
    struct ImplementationInfo {
        bytes32 id;
        uint256 version;
        address deployer;
        uint256 timestamp;
        bool active;
    }
    
    function recordDeployment(
        address deployed,
        bytes32 salt,
        bytes32 bytecodeHash,
        bytes calldata metadata
    ) external {
        require(deployments[deployed].timestamp == 0, "Already recorded");
        
        DeploymentRecord memory record = DeploymentRecord({
            deployer: msg.sender,
            deployed: deployed,
            salt: salt,
            bytecodeHash: bytecodeHash,
            timestamp: block.timestamp,
            chainName: getChainName(),
            metadata: metadata
        });
        
        deployments[deployed] = record;
        deploymentsBySalt[salt].push(deployed);
        deploymentsByDeployer[msg.sender].push(deployed);
    }
    
    function getChainName() internal view returns (string memory) {
        uint256 chainId = block.chainid;
        if (chainId == 43114) return "C-Chain";
        if (chainId == 43113) return "Fuji C-Chain";
        // Add other chain mappings
        return "Unknown";
    }
}
```

### Gas-Optimized Factory

```solidity
contract GasOptimizedCREATE2Factory {
    // Deployment with compressed bytecode
    function deployCompressed(
        bytes32 salt,
        bytes calldata compressedBytecode
    ) external returns (address) {
        bytes memory bytecode = decompress(compressedBytecode);
        return deploy(salt, bytecode);
    }
    
    // Batched deployment with single signature
    function deployBatchWithSignature(
        bytes32[] calldata salts,
        bytes[] calldata bytecodes,
        bytes calldata signature
    ) external returns (address[] memory) {
        require(verifySignature(salts, bytecodes, signature), "Invalid signature");
        return batchDeploy(salts, bytecodes);
    }
    
    // Lazy deployment queue
    mapping(bytes32 => bytes) public pendingDeployments;
    
    function queueDeployment(
        bytes32 salt,
        bytes calldata bytecode
    ) external {
        bytes32 key = keccak256(abi.encodePacked(msg.sender, salt));
        pendingDeployments[key] = bytecode;
    }
    
    function executePendingDeployment(
        address deployer,
        bytes32 salt
    ) external returns (address) {
        bytes32 key = keccak256(abi.encodePacked(deployer, salt));
        bytes memory bytecode = pendingDeployments[key];
        require(bytecode.length > 0, "No pending deployment");
        
        delete pendingDeployments[key];
        return deploy(salt, bytecode);
    }
}
```

### Cross-Chain Deployment Coordinator

```solidity
interface ICrossChainDeployer {
    struct CrossChainDeployment {
        bytes32 deploymentId;
        string[] targetChains;
        bytes32 salt;
        bytes bytecode;
        mapping(string => DeploymentStatus) status;
    }
    
    struct DeploymentStatus {
        bool deployed;
        address deployedAddress;
        uint256 timestamp;
        bytes32 txHash;
    }
    
    function initiateCrossChainDeployment(
        string[] memory targetChains,
        bytes32 salt,
        bytes memory bytecode
    ) external payable returns (bytes32 deploymentId);
    
    function getDeploymentStatus(
        bytes32 deploymentId,
        string memory chain
    ) external view returns (DeploymentStatus memory);
    
    function computeCrossChainAddress(
        bytes32 salt,
        bytes32 bytecodeHash,
        string memory chain
    ) external view returns (address);
}
```

## Rationale

### Design Decisions

1. **Standardized Interface**: Common methods across all factory implementations
2. **Salt Flexibility**: Support multiple salt generation strategies
3. **Registry Integration**: Track deployments for cross-chain coordination
4. **Gas Optimization**: Batching and compression for efficient deployments
5. **Upgrade Support**: Native support for proxy patterns

### Security Considerations

1. **Bytecode Verification**: Verify bytecode hash before deployment
2. **Access Control**: Restrict deployment permissions where needed
3. **Reentrancy Protection**: Guard against reentrancy in batch operations
4. **Salt Uniqueness**: Ensure salts can't be reused maliciously

## Backwards Compatibility

This standard is compatible with:
- EIP-1167 (Minimal Proxy)
- EIP-1967 (Proxy Storage Slots)
- EIP-2470 (Singleton Factory)
- Existing CREATE2 deployments

## Test Cases

### Basic Deployment Test

```solidity
function testDeploy() public {
    bytes memory bytecode = type(TestContract).creationCode;
    bytes32 salt = keccak256("test-salt");
    
    address predicted = factory.computeAddress(salt, keccak256(bytecode));
    address deployed = factory.deploy(salt, bytecode);
    
    assertEq(deployed, predicted);
    assert(deployed.code.length > 0);
}
```

### Cross-Chain Address Test

```solidity
function testCrossChainConsistency() public {
    bytes32 salt = keccak256("cross-chain-salt");
    bytes memory bytecode = type(TestContract).creationCode;
    bytes32 bytecodeHash = keccak256(bytecode);
    
    // Same address on different chains
    address cChainAddress = computeAddress(salt, bytecodeHash, C_CHAIN_FACTORY);
    address xChainAddress = computeAddress(salt, bytecodeHash, X_CHAIN_FACTORY);
    address pChainAddress = computeAddress(salt, bytecodeHash, P_CHAIN_FACTORY);
    
    assertEq(cChainAddress, xChainAddress);
    assertEq(xChainAddress, pChainAddress);
}
```

### Proxy Deployment Test

```solidity
function testProxyDeployment() public {
    address implementation = address(new Implementation());
    bytes32 salt = keccak256("proxy-salt");
    bytes memory initData = abi.encodeWithSelector(
        Implementation.initialize.selector,
        owner,
        "TestProxy"
    );
    
    address proxy = factory.deployProxy(salt, implementation, initData);
    
    // Verify proxy points to implementation
    bytes32 implSlot = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
    bytes32 storedImpl = vm.load(proxy, implSlot);
    assertEq(address(uint160(uint256(storedImpl))), implementation);
}
```

## Reference Implementation

Reference implementations available at:
- https://github.com/luxdefi/create2-factory
- https://github.com/luxdefi/standard

Key features:
- Multi-chain deployment support
- Gas-optimized batch operations
- Comprehensive deployment registry
- Cross-chain address prediction

## Security Considerations

### Deployment Security
- Verify bytecode integrity before deployment
- Prevent unauthorized deployments
- Guard against malicious bytecode

### Cross-Chain Security
- Ensure consistent factory addresses across chains
- Verify cross-chain deployment requests
- Handle chain reorganizations

### Access Control
- Implement role-based deployment permissions
- Rate limiting for deployment operations
- Whitelist/blacklist mechanisms

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).