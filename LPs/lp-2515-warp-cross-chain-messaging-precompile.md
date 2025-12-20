---
lp: 2515
title: Warp Cross-Chain Messaging Precompile
description: Native precompile for cross-chain communication with BLS signature aggregation and validator quorum verification
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-14
requires: 181, 2313
activation:
  flag: lp2515-warp-precompile
  hfName: "Teleport"
  activationHeight: "0"
tags: [warp, precompile, cross-chain, bls, teleport]
---

## Abstract

This LP specifies the Warp Messaging precompile at address `0x0200000000000000000000000000000000000005`, which enables native cross-chain communication between Lux subnets and L1 chains without external bridge infrastructure. The precompile provides four core functions: `sendWarpMessage` for emitting cross-chain messages, `getVerifiedWarpMessage` for retrieving validator-attested messages, `getVerifiedWarpBlockHash` for cross-chain block hash verification, and `getBlockchainID` for chain identification. Messages are secured through BLS signature aggregation with configurable validator quorum thresholds (default 67%).

## Motivation

Cross-chain interoperability is fundamental to the Lux multi-chain ecosystem. Traditional bridge solutions introduce external trust assumptions, operational complexity, and security vulnerabilities. Warp Messaging addresses these limitations by:

1. **Native Validator Security**: Messages are signed by the source chain's validator set using BLS multi-signatures, inheriting the full security of the Lux consensus
2. **No External Dependencies**: Eliminates reliance on external bridge operators, oracles, or custodians
3. **Efficient Verification**: BLS signature aggregation reduces O(n) signature verification to O(1)
4. **Subnet Interoperability**: Enables direct communication between any Lux subnets without intermediaries
5. **Teleport Integration**: Provides the cryptographic foundation for the Teleport cross-chain transfer protocol (LP-6016)

### Design Philosophy

Warp provides a **minimal trusted computing base**:
- Emit verifiable messages from source chain
- Verify validator-attested messages on destination chain
- No guarantees of delivery, ordering, or replay protection (built at higher layers)

This separation of concerns allows application-specific protocols to implement appropriate delivery semantics.

## Specification

### Precompile Address

```
0x0200000000000000000000000000000000000005
```

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWarp {
    /// @notice Warp message structure
    struct WarpMessage {
        bytes32 sourceChainID;
        address originSenderAddress;
        bytes payload;
    }

    /// @notice Warp block hash structure
    struct WarpBlockHash {
        bytes32 sourceChainID;
        bytes32 blockHash;
    }

    /// @notice Emitted when a warp message is sent
    event SendWarpMessage(
        address indexed sender,
        bytes32 indexed messageID,
        bytes message
    );

    /// @notice Get the blockchain ID of the current chain
    function getBlockchainID() external view returns (bytes32 blockchainID);

    /// @notice Get a verified warp block hash by index
    function getVerifiedWarpBlockHash(uint32 index)
        external view
        returns (WarpBlockHash memory warpBlockHash, bool valid);

    /// @notice Get a verified warp message by index
    function getVerifiedWarpMessage(uint32 index)
        external view
        returns (WarpMessage memory message, bool valid);

    /// @notice Send a warp message to other chains
    function sendWarpMessage(bytes calldata payload)
        external
        returns (bytes32 messageID);
}
```

### Function Specifications

#### getBlockchainID

Returns the 32-byte blockchain identifier of the current chain (txID that created the blockchain on P-Chain).

**Gas Cost**: 2 gas (GasQuickStep)

**Output**: `bytes32` blockchain ID

#### sendWarpMessage

Emits a cross-chain message that validators will sign.

**Gas Cost**:
```
gas = BASE_COST + (payloadLength * PER_BYTE_COST)

Where:
  BASE_COST = 20,375 gas  (includes LogGas + 3*LogTopicGas + AddWarpMessageGas + WriteGasCostPerSlot)
  PER_BYTE_COST = 8 gas per payload byte (LogDataGas)
```

**Message Structure**:
| Field | Type | Description |
|-------|------|-------------|
| `networkID` | uint32 | Lux network identifier |
| `sourceChainID` | bytes32 | Source blockchain ID |
| `sourceAddress` | address | `msg.sender` of the call |
| `payload` | bytes | Arbitrary application data |

**Output**: `bytes32` message ID (SHA-256 hash of unsigned message)

**Event**: Emits `SendWarpMessage(sender, messageID, unsignedMessage)`

#### getVerifiedWarpMessage

Retrieves a pre-verified warp message from the transaction predicate.

**Gas Cost**: 2 gas base (verification performed during block validation)

**Input**: `uint32 index` - index of the message in the transaction predicate

**Output**:
- `WarpMessage memory message` - the verified message
- `bool valid` - true if message is valid

**Predicate Requirement**: Transaction must include signed warp message in AccessList predicate.

#### getVerifiedWarpBlockHash

Retrieves a verified block hash from another chain.

**Gas Cost**: 2 gas base

**Input**: `uint32 index` - index of the block hash in the transaction predicate

**Output**:
- `WarpBlockHash memory warpBlockHash` - source chain ID and block hash
- `bool valid` - true if block hash is valid

### Predicate Gas Costs

When including signed warp messages in transaction predicates:

```
gas = SIGNATURE_VERIFICATION_COST
    + (messageBytes * PER_BYTE_COST)
    + (numSigners * PER_SIGNER_COST)

Where:
  SIGNATURE_VERIFICATION_COST = 200,000 gas
  PER_BYTE_COST = 100 gas per message byte
  PER_SIGNER_COST = 500 gas per validator signer
```

### Message Format

#### Unsigned Warp Message

```
UnsignedMessage {
    networkID:     uint32   // 4 bytes - Lux network ID
    sourceChainID: [32]byte // 32 bytes - source blockchain ID
    payload:       []byte   // variable - AddressedCall payload
}
```

#### Addressed Call Payload

```
AddressedCall {
    sourceAddress: [20]byte // 20 bytes - origin sender address
    payload:       []byte   // variable - application data
}
```

#### Signed Warp Message

```
SignedMessage {
    unsignedMessage: UnsignedMessage
    signature:       BitSetSignature {
        signers:   BitSet    // bitmap of signing validators
        signature: [96]byte  // BLS aggregate signature
    }
}
```

### BLS Signature Aggregation

Warp uses BLS12-381 multi-signatures:

1. **Validator Registration**: Each validator registers a BLS public key on P-Chain
2. **Message Signing**: Validators sign the message hash with their BLS private key
3. **Aggregation**: Off-chain relayer aggregates signatures into single aggregate
4. **Verification**: Destination chain verifies aggregate against validator set

**Signature Verification**:
```
e(signature, G2) == e(H(message), aggregatePublicKey)
```

### Validator Quorum Configuration

```go
const (
    WarpDefaultQuorumNumerator uint64 = 67   // 67% default threshold
    WarpQuorumNumeratorMinimum uint64 = 33   // 33% minimum threshold
    WarpQuorumDenominator      uint64 = 100  // denominator
)
```

**Quorum Calculation**:
```
totalStakeWeight = sum(validator.stake for validator in signers)
requiredWeight = networkStake * quorumNumerator / quorumDenominator
valid = totalStakeWeight >= requiredWeight
```

### Chain Configuration

```json
{
  "warpConfig": {
    "blockTimestamp": 1704067200,
    "quorumNumerator": 67,
    "requirePrimaryNetworkSigners": false
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `blockTimestamp` | uint64 | Activation timestamp |
| `quorumNumerator` | uint64 | Required stake percentage (0 = default 67%) |
| `requirePrimaryNetworkSigners` | bool | Require Primary Network validators for C/X-Chain messages |

## Rationale

### Design Decisions

**1. Predicate-Based Verification**

Messages are verified during block validation, not EVM execution:
- Removes signature verification from gas metering
- Enables deterministic block re-execution
- Prevents DoS via expensive verification

**2. BLS Signature Aggregation**

BLS signatures provide O(1) verification regardless of validator count:
- Single 96-byte aggregate signature
- Constant verification time
- Efficient for large validator sets

**3. Epoched Validator Sets (LP-181)**

Using P-Chain height from ProposerVM header:
- Deterministic validator set lookup
- Enables block re-verification during bootstrapping
- Predictable message signing targets

**4. Minimal Precompile Surface**

Warp provides only message emission and verification:
- Delivery guarantees: Application layer
- Ordering: Application layer
- Replay protection: Application layer

This follows Unix philosophy: do one thing well.

### Alternatives Considered

1. **ECDSA Multi-Signatures**: Rejected due to O(n) verification cost
2. **External Relayer Trust**: Rejected to maintain validator-only trust
3. **State Proofs Only**: Insufficient for general message passing
4. **Per-Message Quorum**: Fixed 67% chosen for simplicity

## Backwards Compatibility

The Warp precompile was introduced with Durango upgrade. Activation requires:
- Durango upgrade active on chain
- `warpConfig` in chain genesis/upgrade

No backwards compatibility issues for contracts compiled before Warp activation.

## Test Cases

### Test Case 1: Send Warp Message

**Input**:
```solidity
IWarp(0x0200...0005).sendWarpMessage(
    abi.encode("Hello from Chain A")
);
```

**Expected**:
- Returns `messageID` (bytes32)
- Emits `SendWarpMessage(msg.sender, messageID, unsignedMessage)`
- Gas: ~20,500 for 18-byte payload

### Test Case 2: Verify Warp Message

**Setup**: Transaction includes signed warp message in predicate

**Input**:
```solidity
(IWarp.WarpMessage memory msg, bool valid) =
    IWarp(0x0200...0005).getVerifiedWarpMessage(0);
```

**Expected**:
- `valid == true`
- `msg.sourceChainID` matches source chain
- `msg.originSenderAddress` matches original sender
- `msg.payload` matches sent payload

### Test Case 3: Insufficient Quorum

**Setup**: Signed message with only 60% validator stake

**Input**:
```solidity
(, bool valid) = IWarp(0x0200...0005).getVerifiedWarpMessage(0);
```

**Expected**:
- `valid == false` (below 67% threshold)

### Test Case 4: Cross-Chain Block Hash

**Setup**: Transaction includes verified block hash predicate

**Input**:
```solidity
(IWarp.WarpBlockHash memory hash, bool valid) =
    IWarp(0x0200...0005).getVerifiedWarpBlockHash(0);
```

**Expected**:
- `valid == true`
- `hash.sourceChainID` matches source chain
- `hash.blockHash` matches attested block

### Test Case 5: Get Blockchain ID

**Input**:
```solidity
bytes32 chainID = IWarp(0x0200...0005).getBlockchainID();
```

**Expected**:
- Returns 32-byte blockchain ID
- Matches P-Chain registered blockchain ID
- Gas: 2 gas

## Reference Implementation

**Implementation Status**: COMPLETE

**Location**: `/Users/z/work/lux/precompiles/warp/`

### Core Files

| File | Lines | Description |
|------|-------|-------------|
| `contract.go` | 342 | Core precompile implementation |
| `config.go` | 235 | Configuration and predicate verification |
| `module.go` | 56 | Module registration |
| `contract_warp_handler.go` | ~200 | Message and block hash handlers |
| `IWarp.sol` | 312 | Solidity interface and library |
| `contract.abi` | 137 | ABI definition |

### Key Implementation Details

**Precompile Registration**:
```go
var ContractAddress = common.HexToAddress("0x0200000000000000000000000000000000000005")

var Module = modules.Module{
    ConfigKey:    "warpConfig",
    Address:      ContractAddress,
    Contract:     WarpPrecompile,
    Configurator: &configurator{},
}
```

**Gas Constants**:
```go
const (
    GetBlockchainIDGasCost         uint64 = 2
    GetVerifiedWarpMessageBaseCost uint64 = 2
    AddWarpMessageGasCost          uint64 = 20_000
    SendWarpMessageGasCost         uint64 = contract.LogGas + 3*contract.LogTopicGas +
                                           AddWarpMessageGasCost + contract.WriteGasCostPerSlot
    SendWarpMessageGasCostPerByte  uint64 = contract.LogDataGas

    GasCostPerWarpSigner            uint64 = 500
    GasCostPerWarpMessageBytes      uint64 = 100
    GasCostPerSignatureVerification uint64 = 200_000
)
```

**ABI Functions**:
```go
abiFunctionMap := map[string]contract.RunStatefulPrecompileFunc{
    "getBlockchainID":          getBlockchainID,
    "getVerifiedWarpBlockHash": getVerifiedWarpBlockHash,
    "getVerifiedWarpMessage":   getVerifiedWarpMessage,
    "sendWarpMessage":          sendWarpMessage,
}
```

### Dependencies

- `github.com/luxfi/warp` - Warp message types and signing
- `github.com/luxfi/warp/payload` - AddressedCall payload format
- `github.com/luxfi/consensus/context` - Consensus context access
- `github.com/luxfi/evm/precompile/contract` - Precompile framework

## Security Considerations

### BLS Signature Security

**Scheme**: BLS12-381 with multi-signature aggregation
- **Security Level**: 128-bit (equivalent to 3072-bit RSA)
- **Proof of Possession**: Validators prove key ownership on registration
- **Rogue Key Protection**: PoP prevents rogue key attacks

**Not Quantum-Safe**: BLS is vulnerable to quantum computers. For long-term security, combine with post-quantum schemes (LP-4316 ML-DSA, LP-4317 SLH-DSA).

### Validator Stake Security

**67% Quorum Requirement**:
- Matches Lux Byzantine fault tolerance assumptions
- Tolerates up to 33% malicious stake
- Aligns with consensus finality guarantees

**Stake Weight Verification**:
- Validator set retrieved from P-Chain at block height
- Individual stake weights verified against registration
- Total signed stake must exceed quorum threshold

### Replay Protection

**Built-in Protections**:
- `networkID` prevents cross-network replay
- `sourceChainID` prevents cross-chain replay within network
- Message ID uniqueness per source chain

**Application Layer**:
- Nonce management for ordering
- Message expiration for time-bounded validity
- Application-specific replay detection

### Predicate Security

**Pre-Verification Model**:
- Signatures verified before block execution
- Invalid predicates cause transaction rejection
- Deterministic re-verification during bootstrapping

**ProposerVM Integration**:
- P-Chain height from block header
- Validator set lookup at specified height
- Ensures consistent verification across nodes

### Operational Security

**Relayer Trust Model**:
- Relayers cannot forge messages (require validator signatures)
- Relayers can censor messages (application handles delivery)
- Multiple relayers provide censorship resistance

**Message Availability**:
- Messages stored in flat database (not EVM trie)
- Cleaned up after configurable retention period
- Applications should not assume indefinite availability

### Primary Network Optimization

For L1s not validating Primary Network:
- Set `requirePrimaryNetworkSigners: true` for C/X-Chain messages
- Otherwise verification uses L1 validator set (may not track C/X)
- P-Chain messages always use L1 validators (all L1s track P-Chain)

## Use Cases

### 1. Teleport Token Bridging (LP-6016)

Native token transfers between Lux chains:

```solidity
contract TeleportBridge {
    function teleport(
        bytes32 destChainID,
        address recipient,
        uint256 amount
    ) external {
        // Lock tokens
        token.transferFrom(msg.sender, address(this), amount);

        // Send warp message
        bytes32 messageID = IWarp(WARP).sendWarpMessage(
            abi.encode(destChainID, recipient, amount)
        );

        emit TeleportInitiated(messageID, destChainID, recipient, amount);
    }

    function receiveTeleport(uint32 warpIndex) external {
        (IWarp.WarpMessage memory msg, bool valid) =
            IWarp(WARP).getVerifiedWarpMessage(warpIndex);
        require(valid, "Invalid warp message");
        require(trustedChains[msg.sourceChainID], "Untrusted chain");

        (bytes32 destChain, address recipient, uint256 amount) =
            abi.decode(msg.payload, (bytes32, address, uint256));

        // Mint tokens on destination
        token.mint(recipient, amount);
    }
}
```solidity

### 2. Cross-Subnet Contract Calls

Execute contract functions across subnets:

```solidity
contract CrossChainExecutor is TrustedSourceWarpReceiver {
    function executeRemoteCall(uint32 warpIndex) external {
        IWarp.WarpMessage memory msg = _receiveTrustedMessage(warpIndex);

        (address target, bytes memory data) =
            abi.decode(msg.payload, (address, bytes));

        (bool success, bytes memory result) = target.call(data);
        require(success, "Remote call failed");

        emit RemoteCallExecuted(msg.sourceChainID, target, result);
    }
}
```

### 3. Multi-Chain Governance

Unified governance across multiple chains:

```solidity
contract MultiChainGovernor {
    mapping(bytes32 => bool) public proposalExecuted;

    function executeProposal(
        uint32 warpIndex,
        address[] calldata targets,
        bytes[] calldata calldatas
    ) external {
        (IWarp.WarpMessage memory msg, bool valid) =
            IWarp(WARP).getVerifiedWarpMessage(warpIndex);
        require(valid && msg.sourceChainID == GOVERNANCE_CHAIN, "Invalid");

        bytes32 proposalId = keccak256(msg.payload);
        require(!proposalExecuted[proposalId], "Already executed");
        proposalExecuted[proposalId] = true;

        for (uint i = 0; i < targets.length; i++) {
            (bool success,) = targets[i].call(calldatas[i]);
            require(success, "Execution failed");
        }
    }
}
```

### 4. Cross-Chain State Verification

Verify state from other chains:

```solidity
contract StateVerifier {
    function verifyBlockInclusion(
        uint32 warpIndex,
        bytes32 expectedBlockHash
    ) external view returns (bool) {
        (IWarp.WarpBlockHash memory hash, bool valid) =
            IWarp(WARP).getVerifiedWarpBlockHash(warpIndex);

        return valid && hash.blockHash == expectedBlockHash;
    }
}
```

## Integration: Teleport Bridge

The Teleport protocol (LP-6016) uses Warp as its messaging layer:

```
Source Chain                    Destination Chain
    |                                  |
    | 1. teleport(destChain, recipient, amount)
    |                                  |
    | 2. sendWarpMessage(payload)      |
    |    -> emits SendWarpMessage      |
    |                                  |
    | 3. Validators sign message       |
    |    (BLS aggregation)             |
    |                                  |
    | 4. Relayer delivers signed       |
    |    message in tx predicate  ---->|
    |                                  |
    |    5. getVerifiedWarpMessage(0)  |
    |       -> returns verified msg    |
    |                                  |
    |    6. Mint tokens to recipient   |
    |                                  |
```

**Key Integration Points**:
- Teleport uses `sendWarpMessage` for transfer initiation
- Relayers aggregate BLS signatures off-chain
- Destination uses `getVerifiedWarpMessage` for verification
- Token minting/burning handled at application layer

## Economic Impact

### Gas Cost Analysis

| Operation | Gas Cost | At 50 gwei |
|-----------|----------|------------|
| `getBlockchainID` | 2 | ~$0.0001 |
| `sendWarpMessage` (100 bytes) | ~21,175 | ~$0.04 |
| `getVerifiedWarpMessage` | 2 | ~$0.0001 |
| Predicate verification (10 signers) | ~215,000 | ~$0.43 |

### Comparison with External Bridges

| Bridge Type | Trust Model | Cost | Finality |
|-------------|-------------|------|----------|
| **Warp** | Validator set | ~$0.50 | ~2 seconds |
| MPC Bridge | External signers | ~$2-5 | ~10 minutes |
| Optimistic | Economic bonds | ~$0.10 | 7 days |
| ZK Bridge | Math proofs | ~$5-20 | ~30 minutes |

Warp provides optimal cost-finality tradeoff for intra-Lux transfers.

## Open Questions

1. **Dynamic Quorum Adjustment**: Should quorum be adjustable per-message type?
2. **Message Batching**: Optimize for multiple messages in single predicate?
3. **Signature Caching**: Cache verified signatures for repeated access?
4. **Post-Quantum Transition**: Timeline for hybrid BLS + lattice signatures?

## References

### Specifications
- [BLS12-381 Signature Scheme](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature/)
- [EIP-2930 Access Lists](https://eips.ethereum.org/EIPS/eip-2930)

### Implementation
- **Precompile**: [`precompiles/warp/`](/Users/z/work/lux/precompiles/warp/)
- **Warp Library**: `github.com/luxfi/warp`
- **Node Integration**: `github.com/luxfi/node/vms/platformvm/warp`

### Related LPs
- **LP-181**: P-Chain Epoched Views (validator set snapshots)
- **LP-2313**: Warp Messaging Precompile (predecessor specification)
- **LP-6016**: Teleport Cross-Chain Protocol (application layer)
- **LP-6017**: Bridge Asset Registry
- **LP-6018**: Cross-Chain Message Format
- **LP-6602**: Warp Cross-Chain Messaging Protocol

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
