---
lp: 0016
title: Teleport Cross-Chain Protocol
description: Defines the Teleport protocol for cross-chain transfers within Lux's network.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Bridge
created: 2025-01-23
---

## Abstract

The Teleport Cross-Chain Protocol enables instant, secure transfers of assets between Lux's various chains (P-Chain, X-Chain, C-Chain, and custom subnets) without requiring external bridge infrastructure. Teleport leverages Lux's native consensus mechanisms and the Lux Warp Messaging (AWM) protocol to provide atomic cross-chain operations with minimal latency and maximum security.

## Motivation

While the MPC Bridge Protocol (LP-15) handles transfers between Lux and external blockchains, there is a need for a more efficient protocol for intra-Lux transfers. Current cross-chain transfers within Lux require multiple steps and can take several minutes. Teleport addresses this by:

1. Enabling near-instant transfers between Lux chains
2. Reducing complexity for users and developers
3. Eliminating the need for wrapped tokens within the Lux ecosystem
4. Providing atomic guarantees for cross-chain operations
5. Supporting complex cross-chain workflows and composability

## Specification

### Protocol Overview

Teleport operates on three core principles:
1. **Native Integration**: Built into Lux validators for trustless operation
2. **Atomic Transfers**: Either complete successfully or fail entirely
3. **Message Verification**: Uses Lux Warp Messaging for secure cross-chain communication

### Architecture Components

#### 1. Teleport Registry
Maintains the state of:
- Supported chains and their configurations
- Asset mappings across chains
- Transfer limits and fees
- Validator participation

#### 2. Chain Handlers
Each supported chain implements a Teleport handler that:
- Initiates outbound transfers
- Receives and processes inbound transfers
- Manages chain-specific asset representations

#### 3. Message Format
Teleport messages follow the AWM format with extensions:
```
TeleportMessage {
    version: uint8
    sourceChain: bytes32
    destinationChain: bytes32
    nonce: uint64
    asset: address
    amount: uint256
    sender: address
    recipient: address
    data: bytes (optional)
}
```

### Transfer Flow

#### Initiation Phase
1. User calls `teleport()` on source chain with transfer parameters
2. Source chain handler validates the request:
   - Sufficient balance
   - Valid destination chain
   - Within transfer limits
3. Assets are locked/burned on source chain
4. Teleport message is created and signed by validators

#### Relay Phase
1. Validators observe the signed message
2. Message is relayed to destination chain via AWM
3. Destination chain validators verify the message signatures

#### Completion Phase
1. Destination chain handler processes the message
2. Assets are unlocked/minted for the recipient
3. Transfer receipt is generated
4. Source chain is notified of completion

### Special Features

#### Atomic Swaps
Teleport supports atomic cross-chain swaps:
```solidity
function atomicSwap(
    address tokenA,
    uint256 amountA,
    bytes32 chainB,
    address tokenB,
    uint256 amountB,
    address counterparty
) external;
```

#### Batch Transfers
Multiple transfers can be bundled:
```solidity
function batchTeleport(
    TeleportRequest[] calldata requests
) external;
```

#### Programmable Transfers
Execute arbitrary calls on destination:
```solidity
function teleportAndCall(
    bytes32 destinationChain,
    address token,
    uint256 amount,
    address target,
    bytes calldata data
) external;
```

## Rationale

### Design Decisions

1. **AWM Integration**: Leveraging existing Lux infrastructure provides proven security and reduces implementation complexity

2. **No Intermediate Tokens**: Unlike bridged assets, Teleport maintains native asset properties across chains

3. **Validator-Based Security**: Using Lux validators eliminates external dependencies and trust assumptions

4. **Atomic Guarantees**: Ensures user funds are never stuck in limbo during transfers

### Alternatives Considered

1. **Hub-and-Spoke Model**: Rejected due to centralization and bottleneck concerns
2. **Liquidity Pools**: Would require significant capital lockup and introduce impermanent loss
3. **Optimistic Bridges**: Slower finality not suitable for intra-network transfers

## Backwards Compatibility

Teleport is fully backwards compatible with existing Lux chains. Legacy transfer methods remain functional, with Teleport offered as an enhanced alternative. Smart contracts can detect Teleport support via:

```solidity
function supportsTeleport() external view returns (bool);
```

## Test Cases

### Unit Tests
1. **Message Encoding/Decoding**
   - Verify message serialization
   - Test boundary conditions

2. **Signature Verification**
   - Valid validator signatures accepted
   - Invalid signatures rejected
   - Quorum calculations

### Integration Tests
1. **Simple Transfer**
   - Transfer AVAX from C-Chain to P-Chain
   - Verify balance changes

2. **Token Transfer**
   - Transfer ERC-20 from C-Chain to subnet
   - Verify token mappings

3. **Atomic Swap**
   - Swap tokens between two chains
   - Verify atomicity

### Stress Tests
1. **High Volume**
   - 1000 transfers per second
   - Verify no message loss

2. **Large Transfers**
   - Transfer near limit amounts
   - Verify proper handling

## Reference Implementation

- Teleport Core: [github.com/luxfi/teleport-core]
- Chain Handlers: [github.com/luxfi/teleport-handlers]
- Example Integration: [github.com/luxfi/teleport-examples]

## Security Considerations

### Validator Security
- Teleport relies on the honesty of Lux validators
- Minimum 80% of stake weight required for message validation
- Slashing for invalid message signatures

### Transfer Limits
- Per-transfer limits prevent large-scale attacks
- Daily limits per asset type
- Emergency pause functionality

### Message Security
- Replay protection via nonces and chain IDs
- Message expiration after 1 hour
- Cryptographic verification at each step

### Operational Risks
- Validator liveness assumptions
- Cross-chain timing considerations
- Fee estimation across heterogeneous chains

### Audit Requirements
- All chain handlers must be audited
- Message format changes require security review
- Regular penetration testing of infrastructure

## Implementation

### Teleport Protocol Implementation

- **GitHub**: https://github.com/luxfi/teleport
- **Local**: `/Users/z/work/lux/teleport/`
- **Size**: ~200 MB
- **Languages**: TypeScript (SDK), Go (relayer)
- **Standards**: IBC-compatible warp messaging

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Teleport SDK** | `teleport/sdk/` | Client SDK for transfers |
| **Relayer** | `teleport/relayer/` | Cross-chain message relaying |
| **Warp Messenger** | `teleport/messenger/` | Warp protocol integration |
| **Asset Bridge** | `teleport/bridge/` | Asset lock/unlock on chains |
| **RPC Router** | `teleport/router/` | Multi-chain RPC routing |

### Build Instructions

```bash
# Build SDK
cd /Users/z/work/lux/teleport/sdk
npm install
npm run build

# Build relayer
cd /Users/z/work/lux/teleport/relayer
go build -o bin/teleport-relayer ./cmd/relayer
```

### Testing

```bash
# Test relayer
cd /Users/z/work/lux/teleport/relayer
go test ./... -v

# Test SDK
cd /Users/z/work/lux/teleport/sdk
npm test

# Integration tests
docker-compose -f test/docker-compose.yml up
npm run test:integration
```

### File Size Verification

- **LP-16.md**: 8.0 KB (219 lines before enhancement)
- **After Enhancement**: ~11 KB with Implementation section
- **Teleport Package**: ~200 MB
- **Go Files**: ~25 files

### Related LPs

- **LP-15**: MPC Bridge Protocol (custody)
- **LP-16**: Teleport Cross-Chain Protocol (this LP - transfers)
- **LP-17**: Bridge Asset Registry (asset tracking)
- **LP-18**: Cross-Chain Message Format (message protocol)
- **LP-301**: Bridge Protocol (main spec)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
