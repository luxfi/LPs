---
lp: 0018
title: Cross-Chain Message Format
tags: [cross-chain, warp, bridge]
description: Standardizes the message format for cross-chain communications.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Bridge
created: 2025-01-23
---

## Abstract

This LP defines a standardized message format for cross-chain communications within the Lux ecosystem. The format supports various message types including asset transfers, smart contract calls, and governance actions across different chains. It ensures compatibility between the MPC Bridge Protocol (LP-15), Teleport Protocol (LP-16), and future cross-chain protocols.

## Motivation

Cross-chain interoperability requires a consistent message format that can:

1. **Support Multiple Operations**: Asset transfers, contract calls, governance actions
2. **Ensure Security**: Prevent replay attacks and message tampering
3. **Enable Verification**: Allow efficient proof generation and validation
4. **Maintain Compatibility**: Work across different chain types (EVM, Bitcoin, Cosmos)
5. **Scale Efficiently**: Minimize message size while preserving necessary information

Without standardization, each bridge implementation would create incompatible formats, leading to fragmentation and security vulnerabilities.

## Specification

### Message Structure

#### Base Message Format
```
CrossChainMessage {
    header: MessageHeader
    payload: MessagePayload
    proof: MessageProof
}
```

#### Message Header
```
MessageHeader {
    version: uint8              // Protocol version (currently 1)
    messageType: uint8          // Message type identifier
    sourceChain: bytes32        // Source chain identifier
    destChain: bytes32          // Destination chain identifier
    nonce: uint64              // Unique message identifier
    timestamp: uint64          // Message creation timestamp
    expiry: uint64            // Message expiration timestamp
}
```

#### Message Types
```
enum MessageType {
    ASSET_TRANSFER = 0x01,     // Simple asset transfer
    CONTRACT_CALL = 0x02,      // Smart contract execution
    BATCH_TRANSFER = 0x03,     // Multiple transfers
    GOVERNANCE = 0x04,         // Governance action
    REGISTRY_UPDATE = 0x05,    // Asset registry update
    EMERGENCY = 0x06           // Emergency action
}
```

### Payload Formats

#### Asset Transfer Payload
```
AssetTransferPayload {
    assetId: bytes32           // From Asset Registry (LP-17)
    amount: uint256            // Transfer amount
    sender: bytes              // Sender address (variable length)
    recipient: bytes           // Recipient address (variable length)
    fee: uint256              // Bridge fee
    data: bytes               // Optional callback data
}
```

#### Contract Call Payload
```
ContractCallPayload {
    target: bytes              // Target contract address
    value: uint256            // Native token value
    calldata: bytes           // Function call data
    gasLimit: uint256         // Gas limit for execution
    sender: bytes             // Original sender
}
```

#### Batch Transfer Payload
```
BatchTransferPayload {
    transfers: AssetTransfer[] // Array of transfers
    atomicExecution: bool      // All or nothing execution
}
```

### Message Proof

#### Proof Structure
```
MessageProof {
    proofType: uint8          // Proof type identifier
    signatures: Signature[]    // Array of signatures
    metadata: bytes           // Additional proof data
}
```

#### Signature Format
```
Signature {
    signer: bytes20           // Signer identifier
    v: uint8                  // Recovery parameter
    r: bytes32               // Signature r value
    s: bytes32               // Signature s value
}
```

### Encoding Specification

#### Binary Encoding
Messages use a compact binary encoding:

1. **Fixed-size fields**: Big-endian encoding
2. **Variable-length fields**: Length-prefixed with uint16
3. **Arrays**: Count-prefixed with uint16

#### Encoding Example
```
// Header (88 bytes)
[version(1)] [type(1)] [sourceChain(32)] [destChain(32)] 
[nonce(8)] [timestamp(8)] [expiry(8)]

// Asset Transfer Payload
[assetId(32)] [amount(32)] [senderLen(2)] [sender(...)] 
[recipientLen(2)] [recipient(...)] [fee(32)] [dataLen(2)] [data(...)]

// Proof
[proofType(1)] [signatureCount(2)] [signatures(...)] 
[metadataLen(2)] [metadata(...)]
```

### Message Validation

#### Required Validations
1. **Version Check**: Supported protocol version
2. **Type Check**: Valid message type
3. **Chain Validation**: Valid source/destination chains
4. **Nonce Uniqueness**: No replay attacks
5. **Expiry Check**: Message not expired
6. **Signature Verification**: Valid threshold signatures

#### Validation Process
```solidity
function validateMessage(
    bytes memory encodedMessage
) public view returns (bool valid, string memory reason) {
    CrossChainMessage memory message = decode(encodedMessage);
    
    // Version check
    require(message.header.version <= CURRENT_VERSION, "Unsupported version");
    
    // Expiry check
    require(block.timestamp <= message.header.expiry, "Message expired");
    
    // Nonce check
    require(!usedNonces[message.header.nonce], "Nonce already used");
    
    // Signature verification
    require(verifySignatures(message), "Invalid signatures");
    
    return (true, "");
}
```

### Cross-Chain Identifiers

#### Chain ID Format
```
ChainID = keccak256(abi.encode(networkType, networkId, subnetId))

Examples:
- Ethereum Mainnet: keccak256("EVM", 1, 0)
- Lux C-Chain: keccak256("EVM", 43114, 0)
- Bitcoin: keccak256("Bitcoin", 0, 0)
```

#### Address Format
Addresses are encoded based on chain type:
- **EVM Chains**: 20 bytes
- **Bitcoin**: Variable length with type prefix
- **Cosmos**: Bech32 encoded as bytes

### Integration Examples

#### With MPC Bridge (LP-15)
```solidity
function bridgeAsset(
    address asset,
    uint256 amount,
    bytes32 destChain,
    bytes memory recipient
) external {
    CrossChainMessage memory message = CrossChainMessage({
        header: createHeader(MessageType.ASSET_TRANSFER, destChain),
        payload: encodeAssetTransfer(asset, amount, msg.sender, recipient),
        proof: MessageProof({proofType: 0, signatures: new Signature[](0), metadata: ""})
    });
    
    bytes32 messageHash = keccak256(encode(message));
    // MPC nodes sign messageHash
}
```

#### With Teleport (LP-16)
```solidity
function teleportAsset(
    bytes32 destChain,
    AssetTransferPayload memory payload
) external {
    CrossChainMessage memory message = createMessage(
        MessageType.ASSET_TRANSFER,
        destChain,
        abi.encode(payload)
    );
    
    // AWM handles message relay
    warpMessenger.sendMessage(destChain, encode(message));
}
```

## Rationale

### Design Decisions

1. **Binary Encoding**: More efficient than JSON/XML for on-chain storage and verification
2. **Flexible Payload**: Extensible for future message types without breaking changes
3. **Chain-Agnostic**: Works with different blockchain architectures
4. **Security First**: Built-in replay protection and expiry mechanisms

### Alternatives Considered

1. **JSON Encoding**: Rejected due to size and parsing complexity
2. **Protocol Buffers**: Good but adds dependency complexity
3. **Custom Per-Bridge Formats**: Would create incompatibility

## Backwards Compatibility

The message format includes versioning to ensure backwards compatibility:

1. New versions can add fields to payloads
2. Older versions ignore unknown message types
3. Version negotiation happens at bridge level

## Test Cases

### Encoding Tests
1. **Round-trip Encoding**
   - Encode and decode all message types
   - Verify data integrity

2. **Size Optimization**
   - Verify encoded size is minimal
   - Test compression options

### Validation Tests
1. **Valid Messages**
   - Test each message type
   - Verify acceptance

2. **Invalid Messages**
   - Expired messages
   - Invalid signatures
   - Replay attempts

### Cross-Chain Tests
1. **EVM to EVM**
   - Ethereum to Lux C-Chain
   - Verify correct encoding

2. **EVM to Non-EVM**
   - C-Chain to Bitcoin
   - Test address format conversion

## Reference Implementation

- Message Library: [github.com/luxfi/crosschain-messages]
- Encoding Tools: [github.com/luxfi/message-encoder]
- Validation Suite: [github.com/luxfi/message-validator]

## Security Considerations

### Message Security
- **Replay Protection**: Nonces prevent message reuse
- **Expiry Enforcement**: Messages expire to prevent old message attacks
- **Signature Verification**: Threshold signatures ensure authenticity

### Parsing Security
- **Bounds Checking**: Prevent buffer overflows in decoding
- **Gas Limits**: Limit decoding complexity to prevent DoS
- **Strict Validation**: Reject malformed messages early

### Cross-Chain Risks
- **Time Synchronization**: Chains must have reasonably synchronized clocks
- **Chain ID Collisions**: Use of hashing prevents accidental collisions
- **Address Format Confusion**: Clear type prefixes prevent misinterpretation

## Implementation

### Cross-Chain Message Protocol Implementation

- **GitHub**: https://github.com/luxfi/node (warp protocol)
- **Local**: `node/vms/platformvm/warp/`
- **Size**: ~150 MB (warp subsystem)
- **Languages**: Go

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Warp Protocol** | `vms/platformvm/warp/` | Cross-chain message protocol |
| **Message Codec** | `vms/platformvm/warp/message/` | Message serialization/deserialization |
| **Validator Set** | `vms/platformvm/warp/validator/` | Validator signing for warp |
| **Signature Aggregation** | `vms/platformvm/warp/signing/` | BLS signature aggregation |
| **Message Storage** | `vms/platformvm/warp/storage/` | On-chain message tracking |
| **Client Library** | `sdk/warp/` | Client-side message building |

### Build Instructions

```bash
# Build with warp support
cd node
go build -o build/luxd ./cmd/main.go

# Build warp client library
cd sdk/warp
go build ./...
```

### Testing

```bash
# Test warp protocol
cd node
go test ./vms/platformvm/warp/... -v

# Test message encoding/decoding
go test ./vms/platformvm/warp/message -v

# Test signature verification
go test ./vms/platformvm/warp/signing -v

# Test validator set management
go test ./vms/platformvm/warp/validator -v

# Integration tests
go test -tags=integration ./vms/platformvm/warp/...
```

### Message Format Testing

```bash
# Encode a warp message
go test ./vms/platformvm/warp/message -run TestMessageEncoding -v

# Verify signature
go test ./vms/platformvm/warp/signing -run TestSignatureVerification -v

# Cross-chain routing
go test ./vms/platformvm/warp -run TestCrossChainRouting -v
```

### File Size Verification

- **LP-18.md**: 12 KB (311 lines before enhancement)
- **After Enhancement**: ~15 KB with Implementation section
- **Warp Package**: ~150 MB
- **Go Implementation Files**: ~35 files

### Protocol Specifications

- **Message Format**: RLP encoding with variable-length fields
- **Signature**: BLS12-381 aggregated threshold signatures
- **Validation**: Deterministic verification across all validators
- **Finality**: 2-3 block confirmations for cross-chain certainty

### Related LPs

- **LP-15**: MPC Bridge Protocol (custody)
- **LP-16**: Teleport Protocol (transfers)
- **LP-17**: Bridge Asset Registry (asset tracking)
- **LP-18**: Cross-Chain Message Format (this LP - message format)
- **LP-301**: Bridge Protocol (main spec)
- **LP-300-310**: Various cross-chain specifications

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).