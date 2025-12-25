---
lp: 9110
title: Teleport Protocol - Cross-Chain Bridge Standard
tags: [bridge, cross-chain, mpc, ibc, core]
description: Defines the Teleport bridging protocol for the Lux Network, encompassing both IBC Teleport for Cosmos ecosystem compatibility and MPC Bridge for multi-chain EVM bridging with threshold signatures.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Bridge
created: 2025-12-14
requires: [3, 7321, 7322]
activation:
  flag: lp2510-teleport-protocol
  hfName: "Teleport"
  activationHeight: "TBD"
order: 9110
---

## Abstract

LP-2510 establishes the Teleport Protocol as the canonical cross-chain bridging standard for the Lux Network. The protocol consists of two complementary components:

1. **IBC Teleport**: An Inter-Blockchain Communication (IBC) implementation enabling trustless asset transfers and message passing with Cosmos ecosystem chains, supporting ICS-20 token transfers and ICS-27 interchain accounts.

2. **MPC Bridge**: A Multi-Party Computation bridge using 2-of-3 threshold signatures for secure cross-chain transfers across 15+ EVM-compatible and non-EVM chains.

Together, these components enable Lux to serve as a universal interoperability hub, connecting the Cosmos ecosystem via IBC and the broader EVM ecosystem via MPC threshold signatures.

## Activation

| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Flag string        | `lp2510-teleport-protocol`                      |
| Default in code    | Enabled on mainnet                              |
| Deployment branch  | `main`                                          |
| Roll-out criteria  | MPC nodes operational, IBC relayers active      |
| Back-off plan      | Disable via feature flag, manual MPC pause      |

## Motivation

The Lux Network requires robust cross-chain interoperability to:

1. **Ecosystem Connectivity**: Bridge assets between Lux and major blockchain ecosystems (Ethereum, Cosmos, BSC, Layer 2s)
2. **Liquidity Aggregation**: Unify liquidity across chains for DeFi applications
3. **Cosmos Compatibility**: Enable native IBC communication with Cosmos SDK chains
4. **Security**: Provide cryptographically secure bridges without centralized custodians
5. **Multi-Consensus Support**: Work across Lux's BFT, Chain, DAG, and PQ consensus engines

## Specification

### Part 1: Protocol Architecture

```markdown
                         Teleport Protocol Architecture
+-----------------------------------------------------------------------------------+
|                              Lux Network                                          |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|  |  C-Chain    |  |  B-Chain    |  |  T-Chain    |  |  X-Chain    |               |
|  | (Contract)  |  |  (Bridge)   |  | (Teleport)  |  | (Exchange)  |               |
|  |  Chain ID   |  | Cross-Chain |  |    IBC      |  |    DAG      |               |
|  |   96369     |  | Operations  |  | Operations  |  |  Consensus  |               |
|  +------+------+  +------+------+  +------+------+  +-------------+               |
|         |                |                |                                        |
|         +----------------+----------------+                                        |
|                          |                                                         |
|  +=======================v=========================+                              |
|  |              Warp Messaging Layer               |                              |
|  |     (BLS Aggregated Signatures, LP-3)           |                              |
|  +=================================================+                              |
+-----------------------------------------------------------------------------------+
           |                                    |
           | MPC Bridge                         | IBC Teleport
           | (2-of-3 Threshold)                 | (Light Client)
           |                                    |
+----------v----------+              +---------v---------+
|    EVM Chains       |              |   Cosmos Chains   |
| +-----------------+ |              | +---------------+ |
| | Ethereum (1)    | |              | | Cosmos Hub    | |
| | BSC (56)        | |              | | Osmosis       | |
| | Polygon (137)   | |              | | Celestia      | |
| | Arbitrum (42161)| |              | | dYdX          | |
| | Optimism (10)   | |              | | Stride        | |
| | Base (8453)     | |              | +---------------+ |
| | zkSync Era      | |              +---------+---------+
| | Blast           | |                        |
| | Fantom (250)    | |              ICS-20 Token Transfer
| | Avalanche       | |              ICS-27 Interchain Accounts
| +-----------------+ |
| +---------------+   |
| | Non-EVM       |   |
| | TON           |   |
| +---------------+   |
+---------------------+
```

### Part 2: IBC Teleport Protocol

#### 2.1 Overview

IBC Teleport implements the Inter-Blockchain Communication protocol specification v7, enabling trustless cross-chain communication with Cosmos ecosystem chains.

**Repository**: `github.com/luxfi/teleport`
**Local Path**: `~/work/lux/teleport/`

#### 2.2 Protocol Stack

```solidity
+---------------------------------------+
|       Application Layer               |
| (ICS-20 Transfers, ICS-27 Accounts)   |
+---------------------------------------+
|       Transport Layer (IBC)           |
|  (Packets, Acknowledgements, Timeout) |
+---------------------------------------+
|     Authentication Layer              |
| (Light Clients, Merkle Proofs)        |
+---------------------------------------+
|      Network Layer (Relayers)         |
|   (Message Routing, Delivery)         |
+---------------------------------------+
```

#### 2.3 Core Types

```go
// Packet represents an IBC packet for cross-chain messaging
type Packet struct {
    Sequence           uint64    // Monotonic packet sequence number
    SourcePort         string    // Source port identifier (e.g., "transfer")
    SourceChannel      string    // Source channel identifier (e.g., "channel-0")
    DestinationPort    string    // Destination port identifier
    DestinationChannel string    // Destination channel identifier
    Data               []byte    // Application-specific packet data
    TimeoutHeight      Height    // Block height timeout
    TimeoutTimestamp   uint64    // Unix timestamp timeout (nanoseconds)
}

// Height represents blockchain height with revision support
type Height struct {
    RevisionNumber uint64  // Chain revision (for hard forks)
    RevisionHeight uint64  // Block height within revision
}

// Connection represents an IBC connection between chains
type Connection struct {
    ClientID     string          // Associated light client
    State        ConnectionState // INIT, TRYOPEN, OPEN, CLOSED
    Counterparty Counterparty    // Remote chain connection info
    Versions     []Version       // Supported IBC versions
    DelayPeriod  uint64          // Delay period for packet processing
}

// Channel represents an IBC channel for packet delivery
type Channel struct {
    State          ChannelState  // INIT, TRYOPEN, OPEN, CLOSED
    Ordering       ChannelOrder  // ORDERED, UNORDERED
    Counterparty   Counterparty  // Remote chain channel info
    ConnectionHops []string      // Connection path
    Version        string        // Channel version (e.g., "ics20-1")
}
```go

#### 2.4 Multi-Consensus Support

IBC Teleport supports all Lux consensus engines:

| Consensus | Light Client Type | Finality | Use Case |
|-----------|-------------------|----------|----------|
| **BFT** | Tendermint-compatible | Instant | High-value transfers |
| **Chain** | Header-chain | Probabilistic | General transfers |
| **DAG** | DAG-LC | Eventually consistent | High-throughput |
| **PQ** | Quantum-LC | Post-quantum safe | Future-proof transfers |

#### 2.5 ICS-20 Token Transfer

```go
// FungibleTokenPacketData for ICS-20 transfers
type FungibleTokenPacketData struct {
    Denom    string `json:"denom"`     // Token denomination
    Amount   string `json:"amount"`    // Transfer amount
    Sender   string `json:"sender"`    // Source address
    Receiver string `json:"receiver"`  // Destination address
    Memo     string `json:"memo,omitempty"` // Optional memo
}
```

**Transfer Flow**:
1. User initiates transfer on source chain
2. Source chain escrows native tokens OR burns voucher tokens
3. Packet committed to IBC channel
4. Relayer delivers packet to destination chain
5. Destination chain mints voucher tokens OR releases escrowed tokens
6. Acknowledgement sent back to source chain

#### 2.6 Configuration

```toml
# teleport.toml
[global]
chain-id = "lux-mainnet-1"
rpc-addr = "http://localhost:9650"
grpc-addr = "localhost:9090"
account-prefix = "lux"
keyring-backend = "file"
gas-adjustment = 1.5
gas-prices = "0.025ulux"

[chains.cosmos]
chain-id = "cosmoshub-4"
rpc-addr = "https://rpc.cosmos.network:443"
grpc-addr = "grpc.cosmos.network:443"
account-prefix = "cosmos"
gas-prices = "0.025uatom"

[paths.lux-cosmos]
src.chain-id = "lux-mainnet-1"
src.port-id = "transfer"
dst.chain-id = "cosmoshub-4"
dst.port-id = "transfer"
```solidity

### Part 3: MPC Bridge Protocol

#### 3.1 Overview

The MPC Bridge enables cross-chain asset transfers across EVM and non-EVM chains using 2-of-3 threshold signatures, eliminating single points of failure.

**Repository**: `github.com/luxfi/bridge`
**Local Path**: `~/work/lux/bridge/`
**MPC Library**: `github.com/luxfi/mpc`

#### 3.2 System Architecture

```
+------------------------------------------------------------------+
|                        Bridge UI (Next.js)                       |
|                     http://localhost:3000                        |
+----------------------------------+-------------------------------+
                                   |
+----------------------------------v-------------------------------+
|                     Bridge API Server                            |
|                     http://localhost:5000                        |
|  +---------------------+  +-------------------+  +-------------+ |
|  | Transfer Service    |  | Quote Service     |  | Auth (Lux ID)|
|  +---------------------+  +-------------------+  +-------------+ |
+----------------------------------+-------------------------------+
                                   |
+----------------------------------v-------------------------------+
|                      MPC Node Network                            |
|  +-------------+    +-------------+    +-------------+           |
|  |   Node 0    |    |   Node 1    |    |   Node 2    |           |
|  | HTTP: 6000  |    | HTTP: 6001  |    | HTTP: 6002  |           |
|  | gRPC: 9090  |    | gRPC: 9091  |    | gRPC: 9092  |           |
|  +------+------+    +------+------+    +------+------+           |
|         |                  |                  |                  |
|         +------------------+------------------+                  |
|                            |                                     |
|              2-of-3 Threshold Signature Generation               |
+----------------------------------+-------------------------------+
                                   |
+----------------------------------v-------------------------------+
|                    Infrastructure Services                       |
|  +--------+  +-------+  +--------+  +----------+  +-----------+  |
|  | NATS   |  | Vault |  | Consul |  | PostgreSQL|  | Lux ID   |  |
|  | :4223  |  | :8200 |  | :8501  |  | :5433     |  | :8000    |  |
|  +--------+  +-------+  +--------+  +----------+  +-----------+  |
+------------------------------------------------------------------+
```solidity

#### 3.3 Supported Chains

| Chain | Chain ID | Type | Status |
|-------|----------|------|--------|
| **Lux C-Chain** | 96369 | Native | Active |
| **Ethereum** | 1 | EVM | Active |
| **BSC** | 56 | EVM | Active |
| **Polygon** | 137 | EVM | Active |
| **Avalanche** | 43114 | EVM | Active |
| **Fantom** | 250 | EVM | Active |
| **Arbitrum** | 42161 | L2 | Active |
| **Optimism** | 10 | L2 | Active |
| **zkSync Era** | 324 | L2 | Active |
| **Polygon zkEVM** | 1101 | L2 | Active |
| **Base** | 8453 | L2 | Active |
| **Blast** | 81457 | L2 | Active |
| **TON** | - | Non-EVM | Active |
| **Solana** | - | Non-EVM | Planned |
| **Cosmos** | - | IBC | Via Teleport |

#### 3.4 MPC Node Configuration

```
# config.yaml
mpc:
  threshold: 2          # Minimum signatures required
  total_nodes: 3        # Total MPC nodes
  protocol: "cggmp21"   # ECDSA threshold protocol (LP-322)

nodes:
  - id: 0
    http_port: 6000
    grpc_port: 9090
    host: "mpc-node-0.lux.network"
  - id: 1
    http_port: 6001
    grpc_port: 9091
    host: "mpc-node-1.lux.network"
  - id: 2
    http_port: 6002
    grpc_port: 9092
    host: "mpc-node-2.lux.network"

security:
  tls_enabled: true
  tls_version: "1.3"
  mutual_auth: true
  hsm_integration: true
```solidity

#### 3.5 Threshold Signature Protocol

The MPC Bridge uses CGGMP21 (LP-322) for ECDSA threshold signatures:

**Protocol Properties**:
- **Threshold**: 2-of-3 (any 2 nodes can sign)
- **Key Generation**: Distributed keygen without trusted dealer
- **Signing**: Non-interactive signing after pre-computation
- **Key Refresh**: Periodic share rotation without changing public key
- **Identifiable Aborts**: Malicious parties detected and excluded

**Signature Generation Flow**:
```solidity
1. Bridge contract emits deposit event
2. MPC nodes detect event via blockchain listeners
3. Nodes verify transaction independently
4. Threshold (2) nodes agree on message
5. CGGMP21 signing protocol executes
6. Aggregated signature produced
7. Signed message relayed to destination chain
```

### Part 4: Smart Contracts

#### 4.1 ERC20B Standard (Bridgable Token)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ERC20B - Bridgable ERC20 Token
 * @notice Standard for wrapped tokens with bridge mint/burn capabilities
 * @dev Used for LETH, LBTC, ZETH, ZUSD, and all bridged assets
 */
contract ERC20B is ERC20, Ownable, AccessControl {
    event BridgeMint(address indexed account, uint amount);
    event BridgeBurn(address indexed account, uint amount);

    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }

    /// @notice Mint tokens when assets are bridged IN
    function bridgeMint(address account, uint256 amount) public onlyAdmin returns (bool) {
        _mint(account, amount);
        emit BridgeMint(account, amount);
        return true;
    }

    /// @notice Burn tokens when assets are bridged OUT
    function bridgeBurn(address account, uint256 amount) public onlyAdmin returns (bool) {
        _burn(account, amount);
        emit BridgeBurn(account, amount);
        return true;
    }
}
```solidity

#### 4.2 Bridge Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC20B.sol";
import "./LuxVault.sol";

/**
 * @title Bridge
 * @notice Main bridge contract with MPC oracle verification
 * @dev Handles deposits, withdrawals, and MPC signature verification
 */
contract Bridge is Ownable, AccessControl {
    uint256 public feeRate = 100; // 1% fee (4 decimals)
    LuxVault public vault;

    // MPC Oracle address mapping
    mapping(address => bool) public mpcOracles;

    // Transaction replay protection
    mapping(bytes => bool) public usedSignatures;

    event BridgeBurned(address caller, uint256 amt, address token);
    event BridgeMinted(address recipient, address token, uint256 amt);
    event BridgeWithdrawn(address recipient, address token, uint256 amt);
    event NewMPCOracleSet(address mpcOracle);

    struct TeleportData {
        bytes32 networkIdHash;
        bytes32 tokenAddressHash;
        string tokenAmount;
        address receiverAddress;
        bytes32 receiverAddressHash;
        string decimals;
        ERC20B token;
    }

    /// @notice Set MPC oracle address (from threshold keygen)
    function setMPCOracle(address oracle) external onlyAdmin {
        mpcOracles[oracle] = true;
        emit NewMPCOracleSet(oracle);
    }

    /// @notice Burn tokens to initiate bridge out
    function bridgeBurn(uint256 amount, address tokenAddr) external {
        ERC20B token = ERC20B(tokenAddr);
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
        token.bridgeBurn(msg.sender, amount);
        emit BridgeBurned(msg.sender, amount, tokenAddr);
    }

    /// @notice Mint tokens with MPC signature verification
    function bridgeMintStealth(
        string memory hashedTxId,
        address toTokenAddress,
        uint256 tokenAmount,
        uint256 fromTokenDecimals,
        address receiverAddress,
        bytes memory signedTXInfo,
        string memory vaultFlag
    ) external returns (address) {
        // Prevent replay attacks
        require(!usedSignatures[signedTXInfo], "Signature already used");

        // Reconstruct and verify message
        address signer = recoverSigner(
            buildMessage(hashedTxId, toTokenAddress, tokenAmount,
                        fromTokenDecimals, receiverAddress, vaultFlag),
            signedTXInfo
        );

        // Verify MPC oracle signature
        require(mpcOracles[signer], "Invalid MPC signature");

        // Mark signature as used
        usedSignatures[signedTXInfo] = true;

        // Calculate amount with decimal adjustment
        ERC20B token = ERC20B(toTokenAddress);
        uint256 adjustedAmount = (tokenAmount * 10**token.decimals()) /
                                 (10**fromTokenDecimals);

        // Mint tokens
        token.bridgeMint(receiverAddress, adjustedAmount);
        emit BridgeMinted(receiverAddress, toTokenAddress, adjustedAmount);

        return signer;
    }

    /// @notice Recover signer from ECDSA signature
    function recoverSigner(bytes32 message, bytes memory sig)
        internal pure returns (address)
    {
        require(sig.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return ecrecover(prefixed(message), v, r, s);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", hash
        ));
    }
}
```

#### 4.3 Teleport Bridge Precompile

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ITeleportBridge
 * @notice Precompile interface at address 0x0301 for cross-chain teleport
 */
interface ITeleportBridge {
    struct TeleportTransfer {
        bytes32 teleportId;
        uint256 sourceChain;
        uint256 destChain;
        bytes32 senderPkHash;
        address recipient;
        uint256 amount;
        uint64 timestamp;
        TransferStatus status;
    }

    enum TransferStatus { Pending, Claimed, Expired, Cancelled }

    event TeleportReceived(
        bytes32 indexed teleportId,
        uint256 indexed sourceChain,
        address indexed recipient,
        uint256 amount
    );

    event TeleportClaimed(
        bytes32 indexed teleportId,
        address indexed claimer,
        uint256 amount
    );

    function claim(bytes32 teleportId) external returns (uint256 amount);
    function batchClaim(bytes32[] calldata teleportIds) external returns (uint256);
    function claimAll() external returns (uint256 totalAmount, uint256 claimedCount);
    function getTeleport(bytes32 teleportId) external view returns (TeleportTransfer memory);
    function getPendingTeleports(address recipient) external view returns (bytes32[] memory);
    function isClaimable(bytes32 teleportId) external view returns (bool);
}

/// @notice Precompile constants
contract TeleportBridgePrecompile {
    address public constant PRECOMPILE_ADDRESS = address(0x0301);
    uint256 public constant LUX_CCHAIN_CHAIN_ID = 96369;
    uint256 public constant CLAIM_WINDOW = 24 hours;
}
```solidity

#### 4.4 Wrapped Token Standards

**L-Tokens** (Lux-wrapped, on C-Chain):
| Token | Symbol | Source Chain | Contract |
|-------|--------|--------------|----------|
| Lux ETH | LETH | Ethereum | `LuxETH.sol` |
| Lux BTC | LBTC | Bitcoin | `LuxBTC.sol` |
| Lux USDC | LUSD | Ethereum | `LuxUSD.sol` |
| Lux BNB | LBNB | BSC | `LuxBNB.sol` |
| Lux MATIC | LPOL | Polygon | `LuxPOL.sol` |

**Z-Tokens** (Zoo-wrapped, for Zoo ecosystem):
| Token | Symbol | Source Chain | Contract |
|-------|--------|--------------|----------|
| Zoo ETH | ZETH | Ethereum | `ZooETH.sol` |
| Zoo BTC | ZBTC | Bitcoin | `ZooBTC.sol` |
| Zoo USD | ZUSD | Stablecoins | `ZooUSD.sol` |
| Zoo TON | ZTON | TON | `ZooTON.sol` |

### Part 5: B-Chain and T-Chain

#### 5.1 B-Chain (Bridge Chain)

The B-Chain is a specialized Lux chain optimized for cross-chain bridge operations:

**Purpose**:
- Coordinate cross-chain asset transfers
- Store bridge state and transaction history
- Execute MPC signature verification
- Manage wrapped token supply

**Features**:
- Fast finality for bridge transactions
- Native MPC signature verification
- Cross-chain message relay
- Multi-asset vault management

#### 5.2 T-Chain (Teleport Chain)

The T-Chain handles IBC operations for Cosmos ecosystem connectivity:

**Purpose**:
- IBC light client management
- ICS-20 token transfer processing
- ICS-27 interchain account execution
- Relayer coordination

**Features**:
- Full IBC v7 compatibility
- Multi-consensus light client support
- Packet relay and acknowledgement
- Timeout handling and refunds

### Part 6: Security Model

#### 6.1 MPC Security

**Threshold Security**:
- 2-of-3 threshold ensures no single point of failure
- Key shares never reconstructed in single location
- CGGMP21 provides identifiable aborts
- HSM integration for production deployments

**Operational Security**:
- MPC nodes operated by independent parties
- Geographic distribution across data centers
- Regular key refresh without changing addresses
- 24/7 monitoring and incident response

#### 6.2 IBC Security

**Light Client Verification**:
- Trustless state verification via Merkle proofs
- Validator set tracking and updates
- Misbehavior detection and evidence submission
- Trust period enforcement

**Channel Security**:
- Port access control for authorized modules
- Version negotiation and compatibility
- Ordered/unordered channel semantics
- Timeout-based safety guarantees

#### 6.3 Smart Contract Security

**Access Control**:
- Role-based permissions (Admin, Minter, Burner)
- Multi-sig for administrative functions
- Time-locks for sensitive operations
- Emergency pause functionality

**Economic Security**:
- Fee mechanism prevents spam
- Slashing for misbehavior
- Insurance fund for user protection
- Rate limiting for large transfers

### Part 7: API Reference

#### 7.1 Bridge REST API

```
Base URL: http://localhost:5000/api/v1

GET  /status              # Bridge operational status
GET  /chains              # List supported chains
GET  /assets              # List supported tokens
POST /quote               # Get transfer quote
POST /transfer            # Initiate transfer
GET  /transfer/{id}       # Query transfer status
GET  /history/{address}   # User transfer history
```solidity

**Example: Get Transfer Quote**
```json
POST /api/v1/quote
{
  "sourceChain": 1,
  "destChain": 96369,
  "token": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "amount": "1000000000000000000"
}

Response:
{
  "sourceChain": 1,
  "destChain": 96369,
  "inputAmount": "1000000000000000000",
  "outputAmount": "990000000000000000",
  "fee": "10000000000000000",
  "feePercent": "1.00",
  "estimatedTime": 300,
  "route": "ETH -> LETH via MPC Bridge"
}
```

#### 7.2 IBC Teleport API

```solidity
RPC Endpoints:
POST /teleport/query/connection   # Query connection status
POST /teleport/query/channel      # Query channel status
POST /teleport/tx/transfer        # Send IBC transfer
GET  /teleport/query/packet       # Query packet status

gRPC Services:
- ibc.core.connection.v1.Query
- ibc.core.channel.v1.Query
- ibc.applications.transfer.v1.Query
- ibc.applications.transfer.v1.Msg
```

## Rationale

### Why Two Protocols?

1. **IBC Teleport** provides native Cosmos ecosystem connectivity with trustless light client verification, ideal for chains that support IBC natively.

2. **MPC Bridge** enables connectivity with non-IBC chains (Ethereum, BSC, L2s) where light client verification is impractical or too expensive.

### Why 2-of-3 Threshold?

- **Availability**: Single node failure doesn't halt operations
- **Security**: Compromise of single node doesn't compromise funds
- **Cost**: Minimal coordination overhead
- **Decentralization**: Three independent operators

### Why ERC20B Standard?

- **Mint/Burn Pattern**: Clean token economics for bridged assets
- **Access Control**: Restricts minting to authorized bridge contracts
- **Compatibility**: Full ERC20 compatibility for DeFi integration
- **Simplicity**: Minimal surface area reduces attack vectors

## Backwards Compatibility

This LP introduces new bridge infrastructure and does not modify existing protocols. Existing tokens and contracts remain unchanged. Migration path:

1. Deploy ERC20B wrapped tokens
2. Deploy Bridge contract
3. Initialize MPC network
4. Configure relayers
5. Enable transfers

## Test Cases

### MPC Bridge Tests

```typescript
describe("Bridge Contract", () => {
  it("should mint tokens with valid MPC signature", async () => {
    const signature = await generateMPCSignature(transferData);
    await bridge.bridgeMintStealth(
      hashedTxId,
      tokenAddress,
      amount,
      decimals,
      receiver,
      signature,
      "false"
    );
    expect(await token.balanceOf(receiver)).to.equal(amount);
  });

  it("should reject replay attacks", async () => {
    const signature = await generateMPCSignature(transferData);
    await bridge.bridgeMintStealth(...args, signature, "false");
    await expect(
      bridge.bridgeMintStealth(...args, signature, "false")
    ).to.be.revertedWith("Signature already used");
  });

  it("should reject invalid MPC signatures", async () => {
    const invalidSignature = "0x" + "00".repeat(65);
    await expect(
      bridge.bridgeMintStealth(...args, invalidSignature, "false")
    ).to.be.revertedWith("Invalid MPC signature");
  });
});
```go

### IBC Teleport Tests

```go
func TestPacketTransfer(t *testing.T) {
    // Setup IBC channel
    channel := setupChannel(t, "transfer", "channel-0")

    // Create transfer packet
    packet := types.NewPacket(
        transferData,
        1,
        "transfer",
        "channel-0",
        "transfer",
        "channel-1",
        types.NewHeight(1, 1000),
        0,
    )

    // Send packet
    err := keeper.SendPacket(ctx, packet)
    require.NoError(t, err)

    // Verify commitment stored
    commitment := keeper.GetPacketCommitment(ctx, "transfer", "channel-0", 1)
    require.NotNil(t, commitment)
}
```

## Reference Implementation

### IBC Teleport

**Repository**: [`github.com/luxfi/teleport`](https://github.com/luxfi/teleport)
**Local Path**: `/Users/z/work/lux/teleport/`

**Key Files**:
- `src/types/packet.go` - IBC packet implementation
- `src/types/connection.go` - Connection management
- `src/types/channel.go` - Channel operations
- `docs/content/docs/index.mdx` - Full documentation

### MPC Bridge

**Repository**: [`github.com/luxfi/bridge`](https://github.com/luxfi/bridge)
**Local Path**: `/Users/z/work/lux/bridge/`

**Key Files**:
- `contracts/contracts/Bridge.sol` - Main bridge contract
- `contracts/contracts/ERC20B.sol` - Bridgable token standard
- `contracts/contracts/LuxVault.sol` - Asset vault
- `contracts/contracts/zoo/*.sol` - Z-token implementations
- `contracts/contracts/lux/*.sol` - L-token implementations
- `app/server/` - Bridge API server
- `app/bridge/` - Bridge UI

### MPC Library

**Repository**: [`github.com/luxfi/mpc`](https://github.com/luxfi/mpc)

**Protocols**:
- CGGMP21 for ECDSA threshold signatures (LP-322)
- FROST for Schnorr threshold signatures (LP-321)

### Standard Library Contracts

**Repository**: [`github.com/luxfi/standard`](https://github.com/luxfi/standard)
**Local Path**: `/Users/z/work/lux/standard/`

**Key Files**:
- `src/precompiles/TeleportBridge.sol` - Teleport precompile interface
- `src/interfaces/IERC20Bridgable.sol` - Bridgable token interface
- `src/tokens/LETH.sol` - Lux-wrapped ETH
- `src/tokens/LBTC.sol` - Lux-wrapped BTC

## Security Considerations

### MPC Node Compromise

**Threat**: Compromise of MPC node private key share
**Mitigation**:
- 2-of-3 threshold requires compromising multiple nodes
- Key refresh rotates shares without changing address
- HSM storage for key material
- Independent node operators

### Replay Attacks

**Threat**: Reusing valid signatures for unauthorized mints
**Mitigation**:
- Transaction hash included in signed message
- Signature tracking in `usedSignatures` mapping
- Chain ID binding prevents cross-chain replay

### Light Client Attacks

**Threat**: Malicious light client updates
**Mitigation**:
- Trust period enforcement
- Validator set verification
- Misbehavior evidence submission
- Multiple relayer redundancy

### Smart Contract Vulnerabilities

**Threat**: Reentrancy, overflow, access control bypass
**Mitigation**:
- OpenZeppelin contracts for standard functionality
- External audits before mainnet deployment
- Formal verification of critical paths
- Bug bounty program

## Related LPs

- **LP-3**: recursive network architecture and Cross-Chain Interoperability
- **LP-321**: FROST Threshold Signatures (Schnorr)
- **LP-322**: CGGMP21 Threshold Signatures (ECDSA)
- **LP-0000**: Network Architecture (B-Chain, T-Chain)

## References

1. [IBC Protocol Specification](https://github.com/cosmos/ibc)
2. [ICS-20 Fungible Token Transfer](https://github.com/cosmos/ibc/tree/main/spec/app/ics-020-fungible-token-transfer)
3. [ICS-27 Interchain Accounts](https://github.com/cosmos/ibc/tree/main/spec/app/ics-027-interchain-accounts)
4. [CGGMP21 Paper](https://eprint.iacr.org/2021/060)
5. [Hermes Relayer](https://hermes.informal.systems/)
6. [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## Implementation

### Development Commands

```bash
# IBC Teleport
cd ~/work/lux/teleport
go build ./...
go test ./...

# MPC Bridge
cd ~/work/lux/bridge
pnpm install
make up                  # Start infrastructure
make start-mpc-nodes     # Start MPC network
cd app/server && pnpm dev  # Start API
cd app/bridge && pnpm dev  # Start UI

# Contract Tests
cd ~/work/lux/bridge/contracts
npx hardhat test
```solidity

### Deployment Checklist

- [ ] Deploy ERC20B wrapped tokens on all chains
- [ ] Deploy Bridge contract on all chains
- [ ] Initialize MPC key generation
- [ ] Register MPC oracle addresses
- [ ] Configure relayer infrastructure
- [ ] Enable IBC channels
- [ ] Verify end-to-end transfers
- [ ] Security audit completion
- [ ] Mainnet activation

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
