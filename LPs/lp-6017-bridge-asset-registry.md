---
lp: 6017
title: Bridge Asset Registry
tags: [bridge, cross-chain]
description: Specifies a standard registry for bridged assets.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Bridge
created: 2025-01-23
---

## Abstract

The Bridge Asset Registry provides a decentralized, on-chain registry for managing assets that can be bridged between different blockchains and the Lux Network. This LP specifies the registry's structure, governance model, and integration points with bridge protocols (LP-15, LP-16) to ensure secure and standardized asset bridging across the ecosystem.

## Motivation

As the Lux Network supports bridging from multiple external chains, there's a critical need for:

1. **Standardized Asset Identification**: Consistent mapping between native and wrapped assets
2. **Security Controls**: Preventing malicious or duplicate asset registrations
3. **Decentralized Management**: Community-driven asset approval process
4. **Metadata Storage**: Rich asset information for wallets and dApps
5. **Bridge Coordination**: Single source of truth for all bridge implementations

Without a unified registry, users face confusion with multiple wrapped versions of the same asset, security risks from unverified tokens, and poor user experience across different bridges.

## Specification

### Registry Architecture

#### Core Components

1. **Asset Registry Contract**
```solidity
interface IAssetRegistry {
    struct AssetInfo {
        bytes32 assetId;           // Unique identifier
        address nativeAddress;      // Address on origin chain
        uint256 originChainId;      // Origin chain identifier
        address[] luxAddresses;     // Mapped addresses on Lux chains
        string name;
        string symbol;
        uint8 decimals;
        AssetType assetType;        // TOKEN, NFT, etc.
        BridgeConfig bridgeConfig;
        bool isActive;
        uint256 addedBlock;
        address proposer;
    }
    
    struct BridgeConfig {
        uint256 minTransfer;
        uint256 maxTransfer;
        uint256 dailyLimit;
        uint256 fee;
        bool pausable;
        address feeRecipient;
    }
}
```

2. **Chain Registry**
```solidity
struct ChainInfo {
    uint256 chainId;
    string name;
    ChainType chainType;    // EVM, Bitcoin, Cosmos, etc.
    address bridgeContract;
    bool isActive;
}
```

### Asset Registration Process

#### 1. Proposal Submission
```solidity
function proposeAsset(
    address nativeAddress,
    uint256 originChainId,
    string memory name,
    string memory symbol,
    uint8 decimals,
    AssetType assetType,
    bytes memory metadata
) external returns (bytes32 proposalId);
```

#### 2. Validation Phase
- Automated checks:
  - No duplicate registrations
  - Valid contract on origin chain
  - Metadata verification
- Manual review period (72 hours)

#### 3. Approval Process
- Governance vote (if value > threshold)
- Multi-sig approval (if value < threshold)
- Automatic approval for verified projects

#### 4. Asset Deployment
```solidity
function deployAsset(
    bytes32 proposalId,
    uint256 targetChainId
) external returns (address wrappedAsset);
```

### Registry Queries

#### Asset Lookup
```solidity
// By native address
function getAssetByNative(
    address nativeAddress,
    uint256 chainId
) external view returns (AssetInfo memory);

// By Lux address
function getAssetByWrapped(
    address wrappedAddress
) external view returns (AssetInfo memory);

// By asset ID
function getAsset(
    bytes32 assetId
) external view returns (AssetInfo memory);
```

#### Bridge Configuration
```solidity
function getBridgeConfig(
    bytes32 assetId,
    uint256 sourceChain,
    uint256 targetChain
) external view returns (BridgeConfig memory);
```

### Integration Points

#### With MPC Bridge (LP-15)
```solidity
interface IMPCBridgeRegistry {
    function validateAsset(bytes32 assetId) external view returns (bool);
    function getAssetLimits(bytes32 assetId) external view returns (uint256 min, uint256 max);
}
```

#### With Teleport (LP-16)
```solidity
interface ITeleportRegistry {
    function getInternalMapping(
        bytes32 assetId,
        uint256 sourceChain,
        uint256 targetChain
    ) external view returns (address source, address target);
}
```

### Governance

#### Registry Administrators
- **Asset Approvers**: Can approve/reject proposals
- **Config Managers**: Can update bridge configurations
- **Emergency Council**: Can pause assets

#### Parameter Updates
```solidity
function updateBridgeConfig(
    bytes32 assetId,
    BridgeConfig memory newConfig
) external onlyConfigManager;
```

## Rationale

### Design Decisions

1. **On-Chain Registry**: Provides transparency and decentralization vs off-chain alternatives

2. **Asset ID System**: Using bytes32 hashes ensures unique identification across all chains

3. **Flexible Bridge Config**: Per-asset configurations allow fine-tuned risk management

4. **Multi-Chain Support**: Registry designed to handle assets from any blockchain type

### Alternatives Considered

1. **Centralized Database**: Rejected for trust and availability concerns
2. **Per-Bridge Registries**: Would create fragmentation and confusion
3. **Automatic Registration**: Too risky without validation process

## Backwards Compatibility

The registry is designed to be integrated with existing bridge systems:

1. Legacy wrapped tokens can be registered with their current addresses
2. Existing bridge contracts can query the registry via adapters
3. Gradual migration path for current bridged assets

## Test Cases

### Registration Tests
1. **Valid Asset Registration**
   - Submit proposal for USDC from Ethereum
   - Verify approval process
   - Check deployment on C-Chain

2. **Duplicate Prevention**
   - Attempt to register same asset twice
   - Verify rejection

3. **Malicious Asset**
   - Submit fake token proposal
   - Verify validation catches it

### Query Tests
1. **Multi-Chain Lookup**
   - Register asset on 3 chains
   - Query by each address
   - Verify consistent results

2. **Configuration Updates**
   - Update transfer limits
   - Verify new limits apply

### Integration Tests
1. **Bridge Flow**
   - Register new asset
   - Execute bridge transfer
   - Verify registry validation

2. **Emergency Response**
   - Pause compromised asset
   - Verify bridges respect pause

## Reference Implementation

- Registry Core: [github.com/luxfi/asset-registry]
- Governance Module: [github.com/luxfi/registry-governance]
- Integration Examples: [github.com/luxfi/registry-integrations]

## Security Considerations

### Registration Security
- **Verification Requirements**: Multiple validation steps prevent malicious registrations
- **Time Delays**: Review periods allow community inspection
- **Proposer Stakes**: Economic incentives against spam proposals

### Operational Security
- **Access Controls**: Multi-sig and role-based permissions
- **Upgrade Patterns**: Transparent upgrade process with time locks
- **Emergency Procedures**: Ability to pause assets without breaking bridges

### Data Integrity
- **Immutable History**: All changes recorded on-chain
- **Merkle Proofs**: For efficient cross-chain verification
- **Regular Audits**: Automated checks for registry consistency

### Integration Risks
- **Bridge Dependency**: Registry must remain available for bridges
- **Gas Costs**: Optimization needed for frequent queries
- **Cross-Chain Sync**: Ensuring consistency across deployments

## Implementation

### Bridge Asset Registry Implementation

- **GitHub**: https://github.com/luxfi/standard (contracts)
- **Local**: `standard/`
- **Size**: ~2.0 GB
- **Languages**: Solidity (smart contracts), TypeScript (tools)

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Asset Registry Contract** | `standard/contracts/BridgeAssetRegistry.sol` | On-chain asset registration |
| **Wrapped Token Factory** | `standard/contracts/WrappedAssetFactory.sol` | Deploy wrapped tokens |
| **Oracle Integration** | `standard/contracts/AssetOracle.sol` | Price feed integration |
| **Registry Tools** | `standard/src/tools/registry/` | Registration and management tools |
| **Deployment Scripts** | `standard/script/registry/` | Foundry deployment automation |

### Build Instructions

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Build and test
cd standard
forge build

# Deploy registry (testnet)
forge script script/registry/DeployRegistry.s.sol:DeployRegistry \
  --rpc-url http://localhost:9650/ext/bc/C/rpc \
  --broadcast
```

### Testing

```bash
# Test asset registry contracts
cd standard
forge test --match="Registry"

# Test wrapped token deployment
forge test --match="WrappedAsset"

# Gas profiling
forge test --match="Registry" --gas-report

# Coverage
forge coverage --match="Registry"
```

### File Size Verification

- **LP-17.md**: 8.0 KB (267 lines before enhancement)
- **After Enhancement**: ~11 KB with Implementation section
- **Standard Package**: ~2.0 GB
- **Solidity Files**: ~80 contracts

### Related LPs

- **LP-15**: MPC Bridge Protocol (custody)
- **LP-16**: Teleport Protocol (transfers)
- **LP-17**: Bridge Asset Registry (this LP - asset registry)
- **LP-18**: Cross-Chain Message Format (message format)
- **LP-20**: Fungible Token Standard (LRC-20)
- **LP-721**: Non-Fungible Token Standard (LRC-721)
- **LP-301**: Bridge Protocol (main spec)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).