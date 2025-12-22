---
lp: 9012
title: Bridge Aggregator - Omnichain Asset Routing
tags: [defi, bridge, cross-chain, axelar, layerzero, wormhole, warp]
description: Unified bridge aggregator supporting Axelar GMP, LayerZero V2, Wormhole CCTP, and Lux Warp
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-21
requires: 6000, 6301, 6602, 2803
implementation: https://github.com/luxfi/standard/src/liquidity/bridges/IBridgeAggregator.sol
order: 12
---

> **Documentation**: [docs.lux.network/bridges](https://docs.lux.network/bridges)
>
> **Source**: [github.com/luxfi/standard](https://github.com/luxfi/standard/tree/main/src/liquidity/bridges)

## Abstract

LP-9012 specifies the Bridge Aggregator interface for unified cross-chain asset transfers across multiple bridging protocols. The aggregator supports Lux Warp (native), Axelar GMP, LayerZero V2, Wormhole CCTP, Hyperlane, and Chainlink CCIP, providing optimal routing based on cost, speed, and security parameters.

## Motivation

### Bridge Fragmentation

DeFi applications face challenges with bridge integration:

| Issue | Impact | Solution |
|-------|--------|----------|
| Multiple protocols | Integration complexity | Single unified interface |
| Varying security | Risk management | Security scoring |
| Different costs | Suboptimal routing | Cost comparison |
| Speed variations | UX inconsistency | Speed-based selection |

### Aggregation Benefits

1. **Optimal Routing**: Select best bridge per transfer
2. **Fallback Options**: Automatic failover if primary unavailable
3. **Cost Optimization**: Compare fees across protocols
4. **Security Profiles**: Match security requirements to bridges

## Specification

### Interface Definition

```solidity
// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025 Lux Industries Inc.
pragma solidity ^0.8.24;

/// @title IBridgeAggregator - Unified Bridge Interface
/// @notice Aggregates multiple cross-chain bridge protocols
/// @dev Routes to optimal bridge based on cost, speed, security
interface IBridgeAggregator {
    /*//////////////////////////////////////////////////////////////
                              ENUMS
    //////////////////////////////////////////////////////////////*/

    /// @notice Supported bridge protocols
    enum BridgeProtocol {
        LUX_WARP,        // Lux native Warp messaging
        AXELAR_GMP,      // Axelar General Message Passing
        LAYERZERO_V2,    // LayerZero V2 OFT/OApp
        WORMHOLE_CCTP,   // Wormhole Circle CCTP
        HYPERLANE,       // Hyperlane messaging
        CHAINLINK_CCIP,  // Chainlink CCIP
        STARGATE_V2      // Stargate V2 pools
    }

    /// @notice Bridge message status
    enum MessageStatus {
        PENDING,         // Message sent, awaiting relay
        IN_TRANSIT,      // Being processed by bridge
        DELIVERED,       // Delivered to destination
        EXECUTED,        // Executed on destination
        FAILED,          // Execution failed
        REFUNDED         // Funds returned to sender
    }

    /// @notice Security level requirements
    enum SecurityLevel {
        FASTEST,         // Prioritize speed
        BALANCED,        // Balance speed/security
        SECURE,          // Higher security, slower
        MAXIMUM          // Maximum security (multi-bridge)
    }

    /*//////////////////////////////////////////////////////////////
                              STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Bridge transfer quote
    struct BridgeQuote {
        BridgeProtocol protocol;
        uint256 srcAmount;
        uint256 destAmount;      // Expected after fees
        uint256 bridgeFee;       // Bridge protocol fee
        uint256 gasFee;          // Destination gas fee
        uint256 totalFee;        // Total fees
        uint256 estimatedTime;   // Seconds to complete
        uint256 validUntil;
        bytes routeData;         // Protocol-specific data
    }

    /// @notice Bridge transfer request
    struct BridgeRequest {
        bytes32 srcChainId;
        bytes32 destChainId;
        address token;
        uint256 amount;
        address recipient;
        SecurityLevel security;
        uint256 maxFee;          // Max acceptable fee
        uint256 deadline;
        bytes callData;          // Optional call on destination
    }

    /// @notice Bridge transfer result
    struct BridgeResult {
        bytes32 messageId;
        BridgeProtocol protocol;
        bytes32 srcTxHash;
        uint256 amountSent;
        uint256 estimatedReceive;
        uint256 estimatedTime;
    }

    /// @notice Message tracking info
    struct MessageInfo {
        bytes32 messageId;
        BridgeProtocol protocol;
        bytes32 srcChainId;
        bytes32 destChainId;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        MessageStatus status;
        uint256 timestamp;
        bytes32 destTxHash;
    }

    /// @notice Protocol statistics
    struct ProtocolStats {
        BridgeProtocol protocol;
        uint256 totalVolume;
        uint256 successRate;     // Basis points (9999 = 99.99%)
        uint256 avgTime;         // Average completion time
        uint256 activeMessages;
        bool available;
    }

    /*//////////////////////////////////////////////////////////////
                          QUOTE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get quote for a bridge transfer
    /// @param request Bridge request parameters
    /// @return quote Best available quote
    function getQuote(BridgeRequest calldata request)
        external view returns (BridgeQuote memory quote);

    /// @notice Get quotes from all available bridges
    /// @param request Bridge request parameters
    /// @return quotes Array of quotes from each protocol
    function getAllQuotes(BridgeRequest calldata request)
        external view returns (BridgeQuote[] memory quotes);

    /// @notice Get quote for specific protocol
    /// @param request Bridge request parameters
    /// @param protocol Specific bridge to quote
    /// @return quote Quote from specified protocol
    function getQuoteFromProtocol(
        BridgeRequest calldata request,
        BridgeProtocol protocol
    ) external view returns (BridgeQuote memory quote);

    /*//////////////////////////////////////////////////////////////
                         BRIDGE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Execute bridge transfer with automatic routing
    /// @param request Bridge request parameters
    /// @return result Bridge execution result
    function bridge(BridgeRequest calldata request)
        external payable returns (BridgeResult memory result);

    /// @notice Execute bridge via specific protocol
    /// @param request Bridge request parameters
    /// @param protocol Protocol to use
    /// @return result Bridge execution result
    function bridgeVia(
        BridgeRequest calldata request,
        BridgeProtocol protocol
    ) external payable returns (BridgeResult memory result);

    /// @notice Bridge with pre-computed quote
    /// @param quote Previously obtained quote
    /// @param recipient Destination recipient
    /// @return result Bridge execution result
    function bridgeWithQuote(
        BridgeQuote calldata quote,
        address recipient
    ) external payable returns (BridgeResult memory result);

    /*//////////////////////////////////////////////////////////////
                        TRACKING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get message status
    /// @param messageId Unique message identifier
    /// @return info Message information
    function getMessage(bytes32 messageId)
        external view returns (MessageInfo memory info);

    /// @notice Get all messages for sender
    /// @param sender Sender address
    /// @param limit Maximum messages to return
    /// @return messages Array of message info
    function getMessagesBySender(address sender, uint256 limit)
        external view returns (MessageInfo[] memory messages);

    /// @notice Check if message is complete
    /// @param messageId Message to check
    /// @return complete Whether message is complete
    function isComplete(bytes32 messageId) external view returns (bool complete);

    /*//////////////////////////////////////////////////////////////
                        PROTOCOL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get supported chains for protocol
    /// @param protocol Bridge protocol
    /// @return chainIds Supported chain IDs
    function getSupportedChains(BridgeProtocol protocol)
        external view returns (bytes32[] memory chainIds);

    /// @notice Get supported tokens for route
    /// @param srcChainId Source chain
    /// @param destChainId Destination chain
    /// @param protocol Bridge protocol
    /// @return tokens Supported token addresses
    function getSupportedTokens(
        bytes32 srcChainId,
        bytes32 destChainId,
        BridgeProtocol protocol
    ) external view returns (address[] memory tokens);

    /// @notice Get protocol statistics
    /// @param protocol Bridge protocol
    /// @return stats Protocol statistics
    function getProtocolStats(BridgeProtocol protocol)
        external view returns (ProtocolStats memory stats);

    /// @notice Check if route is available
    /// @param srcChainId Source chain
    /// @param destChainId Destination chain
    /// @param token Token to bridge
    /// @return available Whether route exists
    function isRouteAvailable(
        bytes32 srcChainId,
        bytes32 destChainId,
        address token
    ) external view returns (bool available);

    /*//////////////////////////////////////////////////////////////
                              EVENTS
    //////////////////////////////////////////////////////////////*/

    event BridgeInitiated(
        bytes32 indexed messageId,
        BridgeProtocol protocol,
        bytes32 indexed srcChainId,
        bytes32 indexed destChainId,
        address sender,
        address recipient,
        address token,
        uint256 amount
    );

    event BridgeCompleted(
        bytes32 indexed messageId,
        bytes32 destTxHash,
        uint256 amountReceived
    );

    event BridgeFailed(
        bytes32 indexed messageId,
        string reason
    );

    event BridgeRefunded(
        bytes32 indexed messageId,
        uint256 amountRefunded
    );
}
```

### Protocol Adapters

#### Lux Warp Receiver

```solidity
/// @title WarpReceiver - Lux Warp message handler
/// @notice Handles incoming Warp messages
abstract contract WarpReceiver {
    /// @notice Warp precompile address
    address constant WARP = 0x0200000000000000000000000000000000000005;

    /// @notice Handle incoming Warp message
    /// @param sourceChainId Origin chain
    /// @param sender Message sender on source
    /// @param payload Message payload
    function _handleWarpMessage(
        bytes32 sourceChainId,
        address sender,
        bytes calldata payload
    ) internal virtual;

    /// @notice Called by Warp precompile
    function receiveWarpMessage(
        uint32 index
    ) external {
        // Get and verify message from Warp precompile
        (bool success, bytes memory data) = WARP.staticcall(
            abi.encodeWithSignature("getVerifiedWarpMessage(uint32)", index)
        );
        require(success, "Warp: verification failed");

        // Decode message
        (bytes32 sourceChainId, address sender, bytes memory payload) =
            abi.decode(data, (bytes32, address, bytes));

        _handleWarpMessage(sourceChainId, sender, payload);
    }
}
```

#### Axelar GMP Receiver

```solidity
/// @title AxelarExecutable - Axelar GMP message handler
/// @notice Handles incoming Axelar GMP messages
abstract contract AxelarExecutable {
    address public immutable gateway;
    address public immutable gasService;

    constructor(address _gateway, address _gasService) {
        gateway = _gateway;
        gasService = _gasService;
    }

    /// @notice Execute cross-chain call (called by Axelar)
    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external {
        require(msg.sender == gateway, "Axelar: not gateway");

        bytes32 payloadHash = keccak256(payload);
        require(
            IAxelarGateway(gateway).validateContractCall(
                commandId, sourceChain, sourceAddress, payloadHash
            ),
            "Axelar: not approved"
        );

        _execute(sourceChain, sourceAddress, payload);
    }

    /// @notice Execute with token (called by Axelar)
    function executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) external {
        require(msg.sender == gateway, "Axelar: not gateway");

        bytes32 payloadHash = keccak256(payload);
        require(
            IAxelarGateway(gateway).validateContractCallAndMint(
                commandId, sourceChain, sourceAddress, payloadHash, tokenSymbol, amount
            ),
            "Axelar: not approved"
        );

        _executeWithToken(sourceChain, sourceAddress, payload, tokenSymbol, amount);
    }

    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;

    function _executeWithToken(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal virtual;
}
```

#### LayerZero V2 Receiver

```solidity
/// @title LayerZeroReceiver - LayerZero V2 OApp receiver
/// @notice Handles incoming LayerZero messages
abstract contract LayerZeroReceiver {
    address public immutable lzEndpoint;

    constructor(address _lzEndpoint) {
        lzEndpoint = _lzEndpoint;
    }

    /// @notice Receive cross-chain message
    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable {
        require(msg.sender == lzEndpoint, "LZ: not endpoint");

        _lzReceive(_origin, _guid, _message, _executor, _extraData);
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal virtual;

    struct Origin {
        uint32 srcEid;
        bytes32 sender;
        uint64 nonce;
    }
}
```

#### Wormhole Receiver

```solidity
/// @title WormholeReceiver - Wormhole message handler
/// @notice Handles incoming Wormhole messages
abstract contract WormholeReceiver {
    address public immutable wormholeRelayer;

    constructor(address _wormholeRelayer) {
        wormholeRelayer = _wormholeRelayer;
    }

    /// @notice Receive cross-chain message
    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory additionalVaas,
        bytes32 sourceAddress,
        uint16 sourceChain,
        bytes32 deliveryHash
    ) external payable {
        require(msg.sender == wormholeRelayer, "Wormhole: not relayer");

        _receiveWormholeMessages(
            payload, additionalVaas, sourceAddress, sourceChain, deliveryHash
        );
    }

    function _receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory additionalVaas,
        bytes32 sourceAddress,
        uint16 sourceChain,
        bytes32 deliveryHash
    ) internal virtual;
}
```

### BridgeLib Helper Library

```solidity
/// @title BridgeLib - Helper library for bridge aggregator
library BridgeLib {
    IBridgeAggregator internal constant BRIDGE =
        IBridgeAggregator(0x...); // Deployed aggregator address

    /// @notice Chain ID mappings
    bytes32 constant LUX = keccak256("lux");
    bytes32 constant ETHEREUM = keccak256("ethereum");
    bytes32 constant ARBITRUM = keccak256("arbitrum");
    bytes32 constant OPTIMISM = keccak256("optimism");
    bytes32 constant POLYGON = keccak256("polygon");
    bytes32 constant BSC = keccak256("bsc");
    bytes32 constant AVALANCHE = keccak256("avalanche");
    bytes32 constant BASE = keccak256("base");
    bytes32 constant SOLANA = keccak256("solana");

    /// @notice Get best quote for transfer
    function getBestQuote(
        bytes32 destChainId,
        address token,
        uint256 amount,
        address recipient
    ) internal view returns (IBridgeAggregator.BridgeQuote memory) {
        return BRIDGE.getQuote(IBridgeAggregator.BridgeRequest({
            srcChainId: LUX,
            destChainId: destChainId,
            token: token,
            amount: amount,
            recipient: recipient,
            security: IBridgeAggregator.SecurityLevel.BALANCED,
            maxFee: type(uint256).max,
            deadline: block.timestamp + 1 hours,
            callData: ""
        }));
    }

    /// @notice Bridge tokens with best route
    function bridgeTo(
        bytes32 destChainId,
        address token,
        uint256 amount,
        address recipient
    ) internal returns (bytes32 messageId) {
        IBridgeAggregator.BridgeResult memory result = BRIDGE.bridge(
            IBridgeAggregator.BridgeRequest({
                srcChainId: LUX,
                destChainId: destChainId,
                token: token,
                amount: amount,
                recipient: recipient,
                security: IBridgeAggregator.SecurityLevel.BALANCED,
                maxFee: type(uint256).max,
                deadline: block.timestamp + 1 hours,
                callData: ""
            })
        );
        return result.messageId;
    }

    /// @notice Bridge with call on destination
    function bridgeAndCall(
        bytes32 destChainId,
        address token,
        uint256 amount,
        address recipient,
        bytes calldata callData
    ) internal returns (bytes32 messageId) {
        IBridgeAggregator.BridgeResult memory result = BRIDGE.bridge(
            IBridgeAggregator.BridgeRequest({
                srcChainId: LUX,
                destChainId: destChainId,
                token: token,
                amount: amount,
                recipient: recipient,
                security: IBridgeAggregator.SecurityLevel.BALANCED,
                maxFee: type(uint256).max,
                deadline: block.timestamp + 1 hours,
                callData: callData
            })
        );
        return result.messageId;
    }
}
```

### Protocol Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Bridge Protocol Comparison                         │
├─────────────────┬──────────┬──────────┬───────────┬────────────────────┤
│ Protocol        │ Speed    │ Security │ Cost      │ Best For           │
├─────────────────┼──────────┼──────────┼───────────┼────────────────────┤
│ Lux Warp        │ ~1s      │ Native   │ Lowest    │ Lux chain         │
│ Axelar GMP      │ ~5min    │ High     │ Medium    │ EVM chains         │
│ LayerZero V2    │ ~2min    │ High     │ Medium    │ OFT tokens         │
│ Wormhole CCTP   │ ~15min   │ Highest  │ Low       │ USDC transfers     │
│ Hyperlane       │ ~3min    │ Medium   │ Low       │ Custom security    │
│ Chainlink CCIP  │ ~10min   │ Highest  │ High      │ Institutional      │
│ Stargate V2     │ Instant  │ Medium   │ Higher    │ Stablecoin pools   │
└─────────────────┴──────────┴──────────┴───────────┴────────────────────┘
```

## Rationale

### Multi-Protocol Support

Each bridge protocol has strengths:
- **Warp**: Native, fastest for Lux ecosystem
- **Axelar**: Wide EVM support, reliable
- **LayerZero**: Extensive chain support, OFT standard
- **Wormhole**: USDC CCTP, high security
- **CCIP**: Institutional trust, Chainlink backing

### Routing Algorithm

1. Filter protocols by route availability
2. Get quotes from available protocols
3. Score by: security match, cost, speed
4. Select optimal route
5. Execute with fallback if primary fails

### Security Levels

- **FASTEST**: Single bridge, lowest latency
- **BALANCED**: Best cost/security tradeoff
- **SECURE**: Prefer high-security bridges
- **MAXIMUM**: Multi-bridge verification (2-of-3)

## Backwards Compatibility

### Direct Bridge Migration

Existing bridge integrations can migrate:

```solidity
// Before: Direct Axelar
IAxelarGateway(gateway).callContract(destChain, destAddr, payload);

// After: Aggregator (Axelar route)
BRIDGE.bridgeVia(request, BridgeProtocol.AXELAR_GMP);
```

## Test Cases

### Quote Comparison

```solidity
function testGetAllQuotes() public view {
    IBridgeAggregator.BridgeRequest memory request = IBridgeAggregator.BridgeRequest({
        srcChainId: BridgeLib.LUX,
        destChainId: BridgeLib.ETHEREUM,
        token: USDC,
        amount: 10000 * 1e6,
        recipient: user,
        security: IBridgeAggregator.SecurityLevel.BALANCED,
        maxFee: 100 * 1e6,
        deadline: block.timestamp + 1 hours,
        callData: ""
    });

    IBridgeAggregator.BridgeQuote[] memory quotes = BRIDGE.getAllQuotes(request);

    // Should have multiple quotes
    assertGt(quotes.length, 0);

    // Verify quotes are valid
    for (uint i = 0; i < quotes.length; i++) {
        assertLe(quotes[i].totalFee, request.maxFee);
        assertGt(quotes[i].destAmount, 0);
    }
}
```

### Bridge Execution

```solidity
function testBridge() public {
    // Approve tokens
    IERC20(USDC).approve(address(BRIDGE), 1000 * 1e6);

    // Bridge to Ethereum
    IBridgeAggregator.BridgeResult memory result = BRIDGE.bridge(
        IBridgeAggregator.BridgeRequest({
            srcChainId: BridgeLib.LUX,
            destChainId: BridgeLib.ETHEREUM,
            token: USDC,
            amount: 1000 * 1e6,
            recipient: user,
            security: IBridgeAggregator.SecurityLevel.BALANCED,
            maxFee: 50 * 1e6,
            deadline: block.timestamp + 1 hours,
            callData: ""
        })
    );

    // Verify result
    assertGt(result.messageId, bytes32(0));
    assertGt(result.estimatedReceive, 0);
}
```

## Reference Implementation

**Location**: `/Users/z/work/lux/standard/src/liquidity/bridges/`

```
src/liquidity/bridges/
├── IBridgeAggregator.sol   # Interface (this LP)
├── BridgeAggregator.sol    # Implementation
├── adapters/
│   ├── WarpAdapter.sol
│   ├── AxelarAdapter.sol
│   ├── LayerZeroAdapter.sol
│   ├── WormholeAdapter.sol
│   └── CCIPAdapter.sol
└── lib/
    ├── BridgeLib.sol
    └── ChainIds.sol
```

## Security Considerations

### Bridge Security

1. **Message Validation**: Verify message origin
2. **Replay Protection**: Unique message IDs
3. **Rate Limiting**: Per-address limits
4. **Circuit Breakers**: Pause on anomalies

### Fund Safety

1. **Escrow Handling**: Secure token custody
2. **Timeout Refunds**: Auto-refund on failure
3. **Amount Verification**: Slippage protection

## Economic Impact

### Cost Savings

Route optimization saves 20-50% on bridge fees by selecting optimal protocol per transfer.

### Volume Aggregation

By aggregating volume, protocols may offer better rates for high-volume routes.

## Related LPs

- **LP-6000**: B-Chain Bridge Specification
- **LP-6301**: Cross-Chain Bridge Protocol
- **LP-6602**: Warp Messaging Protocol
- **LP-9013**: CrossChainDeFiRouter (consumer)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
