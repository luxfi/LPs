---
lp: 3001
title: Teleport Bridge - MPC Cross-Chain Protocol
description: Decentralized cross-chain bridge using MPC threshold signatures for secure asset transfers
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Bridge
created: 2024-12-27
tags: [bridge, mpc, cross-chain, eip-712, oracle]
order: 3001
---

## Abstract

This LP specifies the **Teleport Bridge** - Lux Network's core cross-chain bridge protocol using Multi-Party Compute (MPC) threshold signatures. The protocol enables secure, decentralized asset transfers between Lux Network and external chains (Ethereum, Base, Arbitrum, etc.) without trusted intermediaries.

## Motivation

Cross-chain bridges are critical infrastructure but historically vulnerable:
- **Single points of failure**: Centralized signers/validators
- **Replay attacks**: Reusing signatures across chains
- **Signature malleability**: ECDSA signature variants
- **Oracle manipulation**: Trusting off-chain data

Teleport Bridge addresses these through:
1. **MPC threshold signatures** - No single party holds complete keys
2. **EIP-712 typed data** - Structured, non-malleable signatures
3. **ClaimId-based replay protection** - Hash-based, not signature-based
4. **On-chain event derivation** - Oracles derive claims from logs, not parameters

## Protocol Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SOURCE CHAIN (Ethereum/Base/Arbitrum)                                       │
│                                                                              │
│  User calls Bridge.bridgeBurn(token, amount, toChainId, recipient, vault)   │
│      │                                                                       │
│      ▼                                                                       │
│  BridgeBurned event emitted with burnId, all parameters committed           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                                   ▼ MPC Oracle Network
┌─────────────────────────────────────────────────────────────────────────────┐
│  MPC NODES (Teleport Signers)                                                │
│                                                                              │
│  1. Monitor BridgeBurned events across chains                               │
│  2. Verify event exists in finalized block                                  │
│  3. Derive ClaimData from on-chain event (NOT request params)               │
│  4. Generate EIP-712 typed signature via MPC (2-of-3, 3-of-5, etc.)        │
│  5. Return signature to user/relayer                                        │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DESTINATION CHAIN (Lux Network)                                             │
│                                                                              │
│  User/Relayer calls Bridge.bridgeMint(claim, signature)                     │
│      │                                                                       │
│      ▼                                                                       │
│  1. Verify deadline not expired                                             │
│  2. Verify token in whitelist                                               │
│  3. Calculate claimId = keccak256(abi.encode(claim fields...))              │
│  4. Check claimId not already used (replay protection)                      │
│  5. Verify EIP-712 signature from active oracle                             │
│  6. Mint/release tokens to recipient (minus fee)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Specification

### 1. Bridge Contract

**Location**: `contracts/contracts/Bridge.sol`

```solidity
contract Bridge is AccessControl, ReentrancyGuard, Pausable, EIP712 {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // EIP-712 Type Hash
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(bytes32 burnTxHash,uint256 logIndex,address token,uint256 amount,"
        "uint256 toChainId,address recipient,bool vault,uint256 nonce,uint256 deadline)"
    );

    // Replay protection: claimId => used
    mapping(bytes32 => bool) public usedClaims;
    
    // Token whitelist: token => allowed
    mapping(address => bool) public allowedTokens;
    
    // Oracle status: oracle => active
    mapping(address => bool) public oracleActive;
}
```

### 2. Data Structures

```solidity
struct BurnData {
    address token;
    address sender;
    uint256 amount;
    uint256 toChainId;
    address recipient;
    bool vault;        // true = lock tokens, false = burn tokens
    uint256 nonce;
}

struct ClaimData {
    bytes32 burnTxHash;   // Source chain tx hash
    uint256 logIndex;     // Event log index in tx
    address token;        // Token address on destination
    uint256 amount;       // Amount to mint/release
    uint256 toChainId;    // Destination chain ID
    address recipient;    // Recipient address
    bool vault;           // true = release from vault, false = mint
    uint256 nonce;        // Source chain burn nonce
    uint256 deadline;     // Signature expiry timestamp
}
```

### 3. Core Functions

#### bridgeBurn - Initiate Cross-Chain Transfer

```solidity
function bridgeBurn(
    address token,
    uint256 amount,
    uint256 toChainId,
    address recipient,
    bool vault
) external nonReentrant whenNotPaused returns (bytes32 burnId) {
    // Validate inputs
    require(allowedTokens[token], "Token not allowed");
    require(amount > 0, "Invalid amount");
    require(recipient != address(0), "Invalid recipient");
    require(toChainId != 0 && toChainId != block.chainid, "Invalid chain");

    uint256 currentNonce = burnNonce++;
    
    // Calculate canonical burnId
    burnId = keccak256(abi.encode(
        block.chainid,
        address(this),
        token,
        msg.sender,
        amount,
        toChainId,
        recipient,
        vault,
        currentNonce
    ));

    // Burn or vault tokens
    if (vault) {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    } else {
        IBridgeToken(token).bridgeBurn(msg.sender, amount);
    }

    emit BridgeBurned(burnId, token, msg.sender, amount, toChainId, recipient, vault, currentNonce);
}
```

**Key Properties**:
- All destination parameters committed in event (anti-spoofing)
- Canonical burnId derived from all parameters
- Supports both burn (synthetic) and vault (native/wrapped) modes

#### bridgeMint - Complete Cross-Chain Transfer

```solidity
function bridgeMint(
    ClaimData calldata claim,
    bytes calldata signature
) external nonReentrant whenNotPaused returns (bytes32 claimId) {
    // Validate deadline
    require(block.timestamp <= claim.deadline, "Claim expired");
    
    // Validate token
    require(allowedTokens[claim.token], "Token not allowed");

    // Calculate claimId for replay protection
    claimId = keccak256(abi.encode(
        claim.burnTxHash,
        claim.logIndex,
        claim.token,
        claim.amount,
        claim.toChainId,
        claim.recipient,
        claim.vault,
        claim.nonce,
        claim.deadline
    ));

    // Replay protection
    require(!usedClaims[claimId], "Claim already used");

    // Verify EIP-712 signature
    bytes32 structHash = keccak256(abi.encode(
        CLAIM_TYPEHASH,
        claim.burnTxHash,
        claim.logIndex,
        claim.token,
        claim.amount,
        claim.toChainId,
        claim.recipient,
        claim.vault,
        claim.nonce,
        claim.deadline
    ));
    
    bytes32 digest = _hashTypedDataV4(structHash);
    address signer = ECDSA.recover(digest, signature);
    
    require(oracleActive[signer], "Invalid oracle");

    // Mark used
    usedClaims[claimId] = true;

    // Calculate fee and transfer
    uint256 fee = (claim.amount * feeRate) / FEE_DENOMINATOR;
    uint256 amountAfterFee = claim.amount - fee;

    if (claim.vault) {
        // Release from vault
        if (fee > 0) IERC20(claim.token).safeTransfer(feeRecipient, fee);
        IERC20(claim.token).safeTransfer(claim.recipient, amountAfterFee);
    } else {
        // Mint tokens
        if (fee > 0) IBridgeToken(claim.token).bridgeMint(feeRecipient, fee);
        IBridgeToken(claim.token).bridgeMint(claim.recipient, amountAfterFee);
    }

    emit BridgeMinted(claimId, claim.token, claim.recipient, amountAfterFee, fee);
}
```

**Key Properties**:
- ClaimId-based replay protection (not signature-based)
- EIP-712 typed data verification
- Oracle whitelist enforcement
- Fee deduction and routing

### 4. Bridge Token Interface

```solidity
interface IBridgeToken {
    function bridgeMint(address to, uint256 amount) external;
    function bridgeBurn(address from, uint256 amount) external;
}
```

### 5. Events

```solidity
event BridgeBurned(
    bytes32 indexed burnId,
    address indexed token,
    address indexed sender,
    uint256 amount,
    uint256 toChainId,
    address recipient,
    bool vault,
    uint256 nonce
);

event BridgeMinted(
    bytes32 indexed claimId,
    address indexed token,
    address indexed recipient,
    uint256 amount,
    uint256 fee
);
```

## MPC Oracle Network

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  MPC Node Network (e.g., 3-of-5 threshold)                       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Node 1  │  │  Node 2  │  │  Node 3  │  │  Node 4  │  ...   │
│  │ share[1] │  │ share[2] │  │ share[3] │  │ share[4] │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │                │
│       └─────────────┴─────────────┴─────────────┘                │
│                          │                                       │
│                          ▼                                       │
│                 Signing Manager (SM)                             │
│                 - Coordinates signing sessions                   │
│                 - No single node holds complete key              │
│                 - Threshold signature output                     │
└─────────────────────────────────────────────────────────────────┘
```

### Signing Flow

1. **Event Detection**: Nodes monitor source chain for `BridgeBurned` events
2. **Verification**: Confirm event in finalized block (sufficient confirmations)
3. **Claim Derivation**: Extract all claim fields from on-chain event (NOT request)
4. **Signature Request**: User requests signature via API with `burnTxHash` + `logIndex`
5. **MPC Signing**: Threshold of nodes coordinate to produce ECDSA signature
6. **Response**: Return ClaimData + signature to user

### API Endpoints

```typescript
// POST /api/v2/signature
interface SignatureRequest {
    burnTxHash: string;   // 0x-prefixed 32-byte hex
    fromChainId: number;  // Source chain ID
    logIndex: number;     // Event log index
}

interface SignatureResponse {
    claimId: string;
    burnTxHash: string;
    logIndex: number;
    token: string;
    amount: string;
    toChainId: number;
    recipient: string;
    vault: boolean;
    nonce: number;
    deadline: number;
    signature: string;
}
```

### Security Properties

| Property | Mechanism |
|----------|-----------|
| **No single point of failure** | Threshold MPC (t-of-n signing) |
| **Anti-parameter-spoofing** | Derive claims from on-chain events only |
| **Replay protection** | ClaimId hash, not signature bytes |
| **Signature non-malleability** | EIP-712 typed data |
| **Oracle accountability** | Whitelist + role-based access |

## Supported Tokens

### Bridgeable Token Standard (ERC20B)

```solidity
contract ERC20B is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    function bridgeMint(address to, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _mint(to, amount);
    }

    function bridgeBurn(address from, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _burn(from, amount);
    }
}
```

### Deployed Tokens

| Token | Symbol | Chains |
|-------|--------|--------|
| Lux Dollar | LUXD | Lux, Ethereum, Base |
| Lux ETH | LETH | Lux |
| Lux BTC | LBTC | Lux |

## Rationale

The MPC threshold signature approach was chosen over alternatives:
1. **vs Multi-sig**: MPC prevents key exposure; multi-sig reveals individual public keys
2. **vs Trusted validators**: MPC eliminates single points of failure
3. **vs ZK bridges**: MPC is simpler and has proven production reliability
4. **EIP-712**: Provides structured, typed signing to prevent signature malleability

## Security Considerations

### EIP-712 Domain

```solidity
EIP712("TeleportBridge", "2")
```

Domain separator includes:
- Contract name
- Version
- Chain ID
- Verifying contract address

### Fee Limits

```solidity
uint256 public constant MAX_FEE_RATE = 1e17; // 10% max
uint256 public constant FEE_DENOMINATOR = 1e18;
```

### Emergency Controls

- `pause()` / `unpause()` - Halt all bridge operations
- `emergencyWithdraw()` - Recover stuck tokens (admin only)
- Token whitelist - Only approved tokens can be bridged

### Attack Mitigations

| Attack | Mitigation |
|--------|------------|
| Replay | ClaimId mapping, deadline expiry |
| Signature malleability | EIP-712 structured data |
| Parameter spoofing | Derive from on-chain events |
| Oracle compromise | Threshold MPC, whitelist |
| Reentrancy | ReentrancyGuard on all external functions |

## Reference Implementation

| Component | Location | Description |
|-----------|----------|-------------|
| Bridge.sol | `contracts/contracts/Bridge.sol` | Main bridge contract |
| ERC20B.sol | `contracts/contracts/ERC20B.sol` | Bridgeable token |
| IBridgeToken.sol | `contracts/contracts/IBridgeToken.sol` | Token interface |
| LETH.sol | `contracts/contracts/LETH.sol` | Lux ETH token |
| LBTC.sol | `contracts/contracts/LBTC.sol` | Lux BTC token |
| LUXD.sol | `contracts/contracts/LUXD.sol` | Lux Dollar token |
| bridge.ts | `api/src/bridge.ts` | API service |
| teleporter.ts | `mpc/src/teleporter.ts` | MPC signing service |

Full implementation: https://github.com/luxfi/teleport

## Test Cases

### Test 1: Burn and Mint Flow

```yaml
Setup:
  - Deploy Bridge on Chain A and Chain B
  - Deploy ERC20B token on both chains
  - Configure MPC oracle

Flow:
  - User calls bridgeBurn(token, 100, chainB, recipient, false) on Chain A
  - BridgeBurned event emitted
  - MPC nodes verify event, generate signature
  - User calls bridgeMint(claim, signature) on Chain B
  - User receives 100 tokens (minus fee) on Chain B
```

### Test 2: Replay Prevention

```yaml
Setup:
  - Valid claim and signature from Test 1

Flow:
  - Attempt to call bridgeMint with same claim again
  - Expected: Revert with "Claim already used"
```

### Test 3: Oracle Verification

```yaml
Setup:
  - Valid claim data
  - Signature from non-whitelisted signer

Flow:
  - Call bridgeMint with invalid oracle signature
  - Expected: Revert with "Invalid oracle"
```

### Test 4: Deadline Expiry

```yaml
Setup:
  - Valid claim with expired deadline

Flow:
  - Call bridgeMint after deadline
  - Expected: Revert with "Claim expired"
```

## Backwards Compatibility

This LP defines the core Teleport Bridge protocol. Future LPs may extend functionality:
- **LP-3003**: Liquid Protocol (self-repaying loans using bridge collateral)
- **LP-3004**: Teleport + Liquid yield integration

## Related Standards

| LP | Title | Relationship |
|----|-------|--------------|
| LP-3003 | Liquid Protocol | Lending layer on bridged assets |
| LP-3004 | Teleport + Yield | Remote yield integration |
| LP-6022 | Warp Messaging | Alternative cross-chain messaging |

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
