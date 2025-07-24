---
lip: 66
title: Oracle Integration Standard via Z-Chain
description: Defines the standard for oracle services leveraging Z-Chain's shared root and light client infrastructure
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-01-23
requires: 14, 20
---

## Abstract

This LIP defines the standard for oracle services on Lux Network, leveraging Z-Chain's unique capabilities including shared cryptographic roots, light client infrastructure, and zero-knowledge proofs. By building oracles on Z-Chain, we achieve secure, verifiable, and privacy-preserving data feeds that can serve all chains in the Lux ecosystem.

## Motivation

Traditional oracle solutions face challenges with security, decentralization, and cross-chain consistency. Z-Chain's architecture provides unique advantages:

1. **Shared Root Infrastructure**: Z-Chain's Yggdrasil root enables verifiable data across all chains
2. **Light Client Support**: Built-in light client infrastructure for efficient verification
3. **Zero-Knowledge Proofs**: Privacy-preserving oracle queries and attestations
4. **TEE Integration**: Hardware-based security for data sources
5. **Cross-Chain Native**: Single oracle service for all Lux chains

## Specification

### Core Oracle Interface

```solidity
interface IZChainOracle {
    // Events
    event DataFeedUpdated(
        bytes32 indexed feedId,
        uint256 value,
        uint256 timestamp,
        bytes32 merkleRoot,
        bytes proof
    );
    
    event FeedRegistered(
        bytes32 indexed feedId,
        string description,
        address[] reporters,
        uint256 minReporters
    );
    
    event AttestationSubmitted(
        bytes32 indexed feedId,
        address indexed reporter,
        bytes32 attestationHash,
        uint256 timestamp
    );
    
    // Core oracle functions
    function getLatestData(bytes32 feedId) external view returns (
        uint256 value,
        uint256 timestamp,
        bytes32 merkleRoot
    );
    
    function getDataWithProof(
        bytes32 feedId,
        uint256 timestamp
    ) external view returns (
        uint256 value,
        bytes memory proof,
        bytes32 merkleRoot
    );
    
    function verifyData(
        bytes32 feedId,
        uint256 value,
        uint256 timestamp,
        bytes memory proof
    ) external view returns (bool);
    
    // Multi-chain data access
    function getCrossChainData(
        bytes32 feedId,
        string memory targetChain
    ) external view returns (
        uint256 value,
        uint256 timestamp,
        bytes memory lightClientProof
    );
}
```

### Z-Chain Oracle Architecture

```solidity
interface IZChainOracleNode {
    // Node registration
    struct OracleNode {
        address nodeAddress;
        bytes32 teeAttestation;      // TEE attestation hash
        uint256 stake;
        uint256 reputation;
        bool isActive;
        string endpoint;
    }
    
    // Data submission with ZK proofs
    struct DataSubmission {
        bytes32 feedId;
        uint256 value;
        uint256 timestamp;
        bytes zkProof;                // Zero-knowledge proof of data validity
        bytes teeSignature;           // TEE signature
        bytes32 sourceCommitment;     // Commitment to data source
    }
    
    function registerNode(
        bytes memory teeAttestation,
        uint256 stake
    ) external returns (bytes32 nodeId);
    
    function submitData(
        DataSubmission memory submission
    ) external;
    
    function aggregateData(
        bytes32 feedId,
        DataSubmission[] memory submissions
    ) external returns (
        uint256 aggregatedValue,
        bytes32 merkleRoot
    );
}
```

### Shared Root Integration

```solidity
interface IYggdrasilOracle {
    // Yggdrasil root structure for oracle data
    struct OracleRoot {
        bytes32 dataRoot;         // Merkle root of all oracle data
        bytes32 nodeRoot;         // Merkle root of oracle nodes
        bytes32 attestationRoot;  // Root of TEE attestations
        uint256 blockHeight;
        uint256 timestamp;
    }
    
    // Cross-chain oracle state
    struct ChainOracleState {
        string chainId;
        bytes32 stateRoot;
        uint256 lastUpdate;
        bytes lightClientProof;
    }
    
    function updateOracleRoot(
        OracleRoot memory newRoot,
        bytes memory aggregatedSignature
    ) external;
    
    function getOracleRoot() external view returns (OracleRoot memory);
    
    function verifyDataInclusion(
        bytes32 feedId,
        uint256 value,
        bytes memory inclusionProof
    ) external view returns (bool);
    
    function syncChainState(
        string memory chainId,
        ChainOracleState memory state
    ) external;
}
```

### Zero-Knowledge Oracle Queries

```solidity
interface IPrivateOracle {
    // Private oracle queries
    struct PrivateQuery {
        bytes32 queryHash;        // Hash of the actual query
        bytes zkProof;            // Proof of query validity
        address requester;
        uint256 fee;
    }
    
    struct PrivateResponse {
        bytes32 queryHash;
        bytes encryptedData;      // Encrypted response
        bytes zkProof;            // Proof of correct computation
        bytes32 commitmentHash;   // Commitment to plaintext result
    }
    
    function submitPrivateQuery(
        PrivateQuery memory query
    ) external payable returns (bytes32 queryId);
    
    function fulfillPrivateQuery(
        bytes32 queryId,
        PrivateResponse memory response
    ) external;
    
    function revealResponse(
        bytes32 queryId,
        uint256 plaintextValue,
        bytes memory revealProof
    ) external;
}
```

### Light Client Oracle Access

```solidity
interface ILightClientOracle {
    // Light client proof structure
    struct LightClientProof {
        bytes32[] blockHeaders;
        bytes32[] stateProofs;
        bytes32 dataRoot;
        uint256 blockHeight;
        bytes signature;
    }
    
    // Efficient data access for light clients
    function getLightClientData(
        bytes32 feedId,
        uint256 minBlockHeight
    ) external view returns (
        uint256 value,
        LightClientProof memory proof
    );
    
    function verifyLightClientProof(
        bytes32 feedId,
        uint256 value,
        LightClientProof memory proof
    ) external view returns (bool);
    
    function getMinimalProof(
        bytes32 feedId,
        uint256 timestamp
    ) external view returns (bytes memory compressedProof);
}
```

### TEE-Based Oracle Nodes

```solidity
interface ITEEOracle {
    // TEE attestation structure
    struct TEEAttestation {
        bytes32 mrEnclave;        // Measurement of enclave code
        bytes32 mrSigner;         // Enclave signer identity
        uint256 isvSvn;           // Security version number
        bytes report;             // Full attestation report
        uint256 timestamp;
    }
    
    // Secure data source
    struct SecureDataSource {
        string url;
        bytes32 apiKeyHash;       // Hash of encrypted API key
        bytes tlsCertHash;        // Expected TLS certificate hash
        uint256 refreshInterval;
    }
    
    function registerTEENode(
        TEEAttestation memory attestation
    ) external returns (bytes32 nodeId);
    
    function addSecureDataSource(
        bytes32 feedId,
        SecureDataSource memory source,
        bytes encryptedCredentials  // Encrypted with TEE public key
    ) external;
    
    function getTEEAttestations(
        bytes32 nodeId
    ) external view returns (TEEAttestation[] memory);
}
```

### Price Feed Aggregation

```solidity
interface IPriceFeedAggregator {
    // Price aggregation parameters
    struct AggregationConfig {
        uint256 minReporters;
        uint256 maxDeviation;     // Maximum acceptable deviation (basis points)
        uint256 maxStaleness;     // Maximum age of data (seconds)
        AggregationMethod method;
    }
    
    enum AggregationMethod {
        MEDIAN,
        WEIGHTED_AVERAGE,
        TRIMMED_MEAN,
        MODE
    }
    
    function configurePriceFeed(
        string memory pair,       // e.g., "BTC/USD"
        AggregationConfig memory config,
        address[] memory reporters
    ) external returns (bytes32 feedId);
    
    function getPrice(
        string memory pair
    ) external view returns (
        uint256 price,
        uint256 decimals,
        uint256 timestamp
    );
    
    function getPriceWithDetails(
        string memory pair
    ) external view returns (
        uint256 price,
        uint256 decimals,
        uint256 timestamp,
        uint256 numReporters,
        uint256 deviation
    );
}
```

### Cross-Chain Oracle Bridge

```solidity
interface IOracleBridge {
    // Cross-chain data request
    struct DataRequest {
        bytes32 feedId;
        string sourceChain;
        string targetChain;
        uint256 maxStaleness;
        address callback;
    }
    
    // Bridge oracle data to other chains
    function requestCrossChainData(
        DataRequest memory request
    ) external payable returns (bytes32 requestId);
    
    function fulfillCrossChainRequest(
        bytes32 requestId,
        uint256 value,
        bytes memory proof
    ) external;
    
    function getRequestStatus(
        bytes32 requestId
    ) external view returns (
        bool fulfilled,
        uint256 value,
        uint256 timestamp
    );
}
```

### Decentralized Oracle Network

```solidity
interface IDecentralizedOracleNetwork {
    // Network parameters
    struct NetworkConfig {
        uint256 minNodes;
        uint256 maxNodes;
        uint256 nodeStakeAmount;
        uint256 slashingPercentage;
        uint256 rewardPerReport;
        uint256 disputePeriod;
    }
    
    // Node performance metrics
    struct NodeMetrics {
        uint256 totalReports;
        uint256 accurateReports;
        uint256 disputedReports;
        uint256 avgResponseTime;
        uint256 uptime;
    }
    
    function joinNetwork(uint256 stake) external;
    function leaveNetwork() external;
    
    function disputeData(
        bytes32 feedId,
        uint256 timestamp,
        bytes memory disputeProof
    ) external;
    
    function slashNode(
        address node,
        bytes memory evidence
    ) external;
    
    function distributeRewards() external;
    
    function getNodeMetrics(
        address node
    ) external view returns (NodeMetrics memory);
}
```

## Rationale

### Design Decisions

1. **Z-Chain Native**: Leverages Z-Chain's unique security and privacy features
2. **Shared Root**: Uses Yggdrasil for cross-chain data consistency
3. **Light Client First**: Optimized for efficient verification
4. **Privacy Options**: Zero-knowledge proofs for sensitive queries
5. **TEE Integration**: Hardware-based security for data sources

### Architecture Benefits

1. **Security**: Multiple layers of verification (ZK proofs, TEE, threshold signatures)
2. **Efficiency**: Light client proofs minimize on-chain data
3. **Privacy**: Option for private oracle queries and responses
4. **Scalability**: Aggregation happens on Z-Chain, other chains just verify
5. **Flexibility**: Supports multiple aggregation methods and data types

## Backwards Compatibility

This oracle system is compatible with:
- Chainlink-style price feeds (via adapter)
- Standard oracle interfaces
- Existing DeFi protocols expecting price oracles

Migration path:
1. Deploy adapters for legacy oracle consumers
2. Gradually migrate to native Z-Chain oracles
3. Maintain backwards compatibility layer

## Test Cases

### Basic Price Feed Test
```solidity
function testPriceFeed() public {
    IZChainOracle oracle = IZChainOracle(oracleAddress);
    
    // Get BTC/USD price
    bytes32 feedId = keccak256("BTC/USD");
    (uint256 price, uint256 timestamp, bytes32 root) = oracle.getLatestData(feedId);
    
    // Verify price is reasonable (between $10k and $100k)
    assertGt(price, 10000 * 10**8);
    assertLt(price, 100000 * 10**8);
    
    // Verify timestamp is recent
    assertLt(block.timestamp - timestamp, 3600); // Less than 1 hour old
}
```

### Zero-Knowledge Query Test
```solidity
function testPrivateOracleQuery() public {
    IPrivateOracle privateOracle = IPrivateOracle(oracleAddress);
    
    // Create private query for sensitive data
    bytes32 queryHash = keccak256("PRIVATE_CREDIT_SCORE:0x123...");
    bytes memory zkProof = generateQueryProof(queryHash, msg.sender);
    
    PrivateQuery memory query = PrivateQuery({
        queryHash: queryHash,
        zkProof: zkProof,
        requester: msg.sender,
        fee: 0.1 ether
    });
    
    // Submit query
    bytes32 queryId = privateOracle.submitPrivateQuery{value: 0.1 ether}(query);
    
    // Wait for response...
    // Verify response without revealing actual value
    (bytes memory encryptedData, bytes memory responseProof) = 
        privateOracle.getPrivateResponse(queryId);
    
    assertTrue(verifyResponseProof(queryHash, encryptedData, responseProof));
}
```

### Cross-Chain Oracle Test
```solidity
function testCrossChainOracle() public {
    IOracleBridge bridge = IOracleBridge(bridgeAddress);
    
    // Request ETH/USD price from Z-Chain to C-Chain
    DataRequest memory request = DataRequest({
        feedId: keccak256("ETH/USD"),
        sourceChain: "Z",
        targetChain: "C",
        maxStaleness: 300, // 5 minutes
        callback: address(this)
    });
    
    bytes32 requestId = bridge.requestCrossChainData{value: 0.01 ether}(request);
    
    // Simulate time passing and fulfillment
    vm.warp(block.timestamp + 30);
    
    // Check fulfillment
    (bool fulfilled, uint256 value, uint256 timestamp) = 
        bridge.getRequestStatus(requestId);
    
    assertTrue(fulfilled);
    assertGt(value, 0);
}
```

## Reference Implementation

Reference implementation available at:
https://github.com/luxdefi/z-chain-oracle

Key components:
- TEE oracle nodes (Intel SGX)
- Zero-knowledge proof circuits
- Light client implementation
- Cross-chain bridge adapters

## Security Considerations

### Data Source Security
- TEE attestation for secure data fetching
- TLS certificate pinning
- API key encryption
- Source diversity requirements

### Network Security
- Stake-based Sybil resistance
- Reputation system for nodes
- Slashing for misbehavior
- Dispute resolution mechanism

### Privacy Considerations
- Zero-knowledge proofs for sensitive queries
- Encrypted data transmission
- Selective disclosure options
- Query privacy protection

### Cross-Chain Security
- Light client verification
- Merkle proof validation
- Signature aggregation
- Chain reorganization handling

### Economic Security
- Adequate node incentives
- Slashing parameters
- Fee market for queries
- Insurance fund for disputes

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).