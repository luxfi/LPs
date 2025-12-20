---
lp: 2507
title: Cross-Chain Bridge Standard
description: Defines the ERC20B bridgeable token standard and MPC oracle bridge architecture for cross-chain asset transfers
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Bridge
created: 2025-12-14
requires: 2030, 6016
tags: [bridge, teleport, cross-chain, mpc, erc20b]
---

## Abstract

This LP defines the Cross-Chain Bridge Standard for the Lux Network, documenting the bridge/teleport protocols at `/Users/z/work/lux/standard/src/teleport/`. The standard specifies the `Bridge.sol` contract architecture using MPC (Multi-Party Computation) oracle verification, the `ERC20B` bridgeable token standard, and signature verification using ECDSA with threshold signing. This enables seamless asset transfers between Lux C-Chain, Ethereum, Hanzo EVM, Zoo EVM, and other supported chains.

## Motivation

Cross-chain interoperability is essential for the Lux ecosystem. Users need to move assets between:

1. **Lux C-Chain and Ethereum**: Bridge LUX, WETH, stablecoins, and other ERC-20 tokens
2. **Lux and Hanzo EVM**: Enable AI-focused applications to access Lux liquidity
3. **Lux and Zoo EVM**: Connect decentralized science and research networks
4. **Lux subnets**: Native Warp messaging for intra-network transfers (LP-6016)

The MPC oracle bridge provides:

- **Decentralized verification**: No single point of failure via threshold signatures
- **Signature deduplication**: Prevents replay attacks across chains
- **Fee mechanism**: Sustainable bridge operations with configurable fee rates
- **Stealth minting**: Privacy-preserving destination claims

## Specification

### Architecture Overview

```
Source Chain                    MPC Oracle Network              Destination Chain
┌─────────────┐                 ┌─────────────────┐             ┌─────────────────┐
│             │                 │                 │             │                 │
│  User calls │ ─── burn ────> │   Signers       │ ── sign ──> │  bridgeMint-    │
│  bridgeBurn │                 │   observe &     │             │  Stealth()      │
│             │                 │   attest        │             │                 │
└─────────────┘                 └─────────────────┘             └─────────────────┘
      │                                │                               │
      ▼                                ▼                               ▼
   ERC20B                      Threshold ECDSA              Signature verified
   Token                       (MPC Signers)                ERC20B minted
```

### Core Contracts

#### Bridge.sol

The core bridge contract located at `/Users/z/work/lux/standard/src/teleport/Bridge.sol`:

```solidity
contract Bridge is Ownable, AccessControl {
    // Fee configuration
    uint256 internal fee = 0;
    uint256 public feeRate = 10 * (uint256(10) ** 15); // 1% default
    address internal payoutAddr;

    // MPC Oracle address mapping
    mapping(address => MPCOracleAddrInfo) internal MPCOracleAddrMap;

    // Transaction deduplication (signature -> used)
    mapping(bytes => TransactionInfo) internal transactionMap;

    // Core operations
    function bridgeBurn(uint256 amount, address tokenAddr) external;
    function bridgeMintStealth(
        uint256 amt,
        string memory hashedId,
        address toTargetAddrStr,
        bytes memory signedTXInfo,
        address tokenAddrStr,
        string memory chainId,
        string memory vault
    ) external returns (address);

    // Admin functions
    function setMPCOracle(address MPCO) external onlyAdmin;
    function setPayoutAddress(address addr, uint256 feeR) external onlyAdmin;
}
```

**Key Features:**

| Feature | Description |
|---------|-------------|
| `bridgeBurn()` | Burns tokens on source chain, emits `BridgeBurned` event |
| `bridgeMintStealth()` | Mints tokens on destination with MPC signature verification |
| `setMPCOracle()` | Registers authorized MPC signer addresses |
| `transactionMap` | Prevents signature replay via deduplication |
| `feeRate` | Configurable fee (default 1%, settable by admin) |

#### ERC20B: Bridgeable Token Standard

Extension of ERC20 with bridge-specific operations:

```solidity
contract ERC20B is ERC20, Ownable, AccessControl {
    event LogMint(address indexed account, uint amount);
    event LogBurn(address indexed account, uint amount);

    function mint(address account, uint256 amount) public onlyAdmin returns (bool);
    function burnIt(address account, uint256 amount) public onlyAdmin returns (bool);

    function grantAdmin(address to) public onlyAdmin;
    function revokeAdmin(address to) public onlyAdmin;
}
```solidity

**Admin Role Management:**
- Bridge contract is granted admin role on ERC20B tokens
- Only admin can mint/burn (prevents unauthorized issuance)
- Granular role control via AccessControl

### Signature Verification

The bridge uses ECDSA signature verification with Ethereum's `eth_sign` prefix:

```solidity
function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
    (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
    return ecrecover(message, v, r, s);
}

function prefixed(bytes32 hash) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
}
```

**Message Construction:**

The signed message includes:
1. `amt` - Amount being bridged (as string)
2. `toTargetAddrStr` - Keccak256 hash of recipient address
3. `hashedId` - Unique transaction identifier
4. `tokenAddrStrHash` - Keccak256 hash of token address
5. `chainIdStr` - Keccak256 hash of destination chain ID
6. `vault` - Vault identifier for stealth operations

### MPC Oracle Security Model

#### Threshold Signature Scheme

The MPC oracles use threshold ECDSA (t-of-n):

| Configuration | Minimum Signers | Total Signers | Security Level |
|---------------|-----------------|---------------|----------------|
| Conservative  | 5               | 7             | High           |
| Standard      | 3               | 5             | Medium-High    |
| Fast          | 2               | 3             | Medium         |

#### Oracle Registration

```solidity
struct MPCOracleAddrInfo {
    bool exists;
}

mapping(address => MPCOracleAddrInfo) internal MPCOracleAddrMap;

function setMPCOracle(address MPCO) public onlyAdmin {
    addMPCMapping(MPCO);
    emit NewMPCOracleSet(MPCO);
}
```

#### Signature Deduplication

Prevents replay attacks:

```solidity
struct TransactionInfo {
    string txid;
    bool exists;
}

mapping(bytes => TransactionInfo) internal transactionMap;

function addMappingStealth(bytes memory _key) internal {
    require(!transactionMap[_key].exists);
    transactionMap[_key].exists = true;
    emit SigMappingAdded(_key);
}
```

### Fee Mechanism

Fees are collected on destination chain minting:

```solidity
// Calculate fee (default 1%)
fee = (amt * feeRate).div(uint256(10) ** 18);
amt = amt.sub(fee);

// Distribute
varStruct.token.mint(payoutAddr, fee);      // Fee to payout address
varStruct.token.mint(toTargetAddr, amt);    // Net amount to recipient
```

**Fee Configuration:**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `feeRate` | 1% (10^16) | 0-10% | Percentage in wei (10^18 = 100%) |
| `payoutAddr` | Admin | Any | Fee recipient address |

### Warp Messaging Integration

For Lux subnet-to-subnet transfers, the bridge integrates with native Warp messaging (LP-6016):

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lux Network (Native Warp)                    │
├─────────────────────────────────────────────────────────────────┤
│  C-Chain ◄────► X-Chain ◄────► Subnets                         │
│     │              │              │                             │
│  Teleport      Teleport      Teleport                          │
│  Handler       Handler       Handler                            │
│     │              │              │                             │
│     └──────────────┴──────────────┘                            │
│              Lux Warp Messaging (AWM)                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                       MPC Bridge
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    External Chains                              │
├─────────────────────────────────────────────────────────────────┤
│  Ethereum       Hanzo EVM       Zoo EVM       Others           │
│     │              │              │              │              │
│  Bridge.sol    Bridge.sol    Bridge.sol    Bridge.sol          │
│  ERC20B        ERC20B        ERC20B        ERC20B              │
└─────────────────────────────────────────────────────────────────┘
```

### Supported Chains

| Chain | Chain ID | Bridge Contract | Native Token |
|-------|----------|-----------------|--------------|
| Lux C-Chain | 96369 | `0x...` (deployed) | LUX |
| Ethereum | 1 | `0x...` (deployed) | ETH |
| Hanzo EVM | 36963 | `0x...` (deployed) | HNZ |
| Zoo EVM | 200200 | `0x...` (deployed) | ZOO |

### Token Operations

#### bridgeBurn (Source Chain)

```solidity
function bridgeBurn(uint256 amount, address tokenAddr) public {
    VarStruct memory varStruct;
    varStruct.token = ERC20B(tokenAddr);
    require((varStruct.token.balanceOf(msg.sender) > 0), "ZeroBal");
    varStruct.token.burnIt(msg.sender, amount);
    emit BridgeBurned(msg.sender, amount);
}
```solidity

**Flow:**
1. User approves Bridge contract for token spending
2. User calls `bridgeBurn(amount, tokenAddress)`
3. Bridge burns tokens via `ERC20B.burnIt()`
4. `BridgeBurned` event emitted with caller and amount
5. MPC oracles observe event and generate attestation

#### bridgeMintStealth (Destination Chain)

```solidity
function bridgeMintStealth(
    uint256 amt,
    string memory hashedId,
    address toTargetAddrStr,
    bytes memory signedTXInfo,
    address tokenAddrStr,
    string memory chainId,
    string memory vault
) public returns (address) {
    // Construct and verify message
    // Check signature not already used
    // Verify signer is registered MPC oracle
    // Deduct fees and mint tokens
    // Record signature as used
    return signer;
}
```

**Flow:**
1. User or relayer calls `bridgeMintStealth()` with MPC signature
2. Contract reconstructs message hash from parameters
3. ECDSA recovery extracts signer address
4. Verify signer is registered MPC oracle
5. Check signature not previously used (replay protection)
6. Calculate and distribute fees
7. Mint tokens to recipient
8. Record signature as used

### Events

```solidity
event BridgeBurned(address caller, uint256 amt);
event BridgeMinted(address recipient, address token, uint256 amt);
event SigMappingAdded(bytes _key);
event NewMPCOracleSet(address MPCOracle);
event AdminGranted(address to);
event AdminRevoked(address to);
```solidity

## Rationale

### MPC vs Multi-Signature

MPC threshold signatures were chosen over traditional multisig because:

1. **Gas efficiency**: Single 65-byte signature vs N signatures
2. **Privacy**: Individual signers not revealed on-chain
3. **Key management**: Distributed key generation without trusted dealer
4. **Flexibility**: Threshold can be adjusted without redeployment

### Stealth Minting

The `bridgeMintStealth` function provides privacy by:

1. Hashing recipient address in signed message
2. Using vault identifiers for additional privacy layers
3. Allowing relayer submission (payer != recipient)

### Fee Model

A percentage-based fee model was chosen because:

1. **Scalability**: Proportional to transfer value
2. **Sustainability**: Covers oracle infrastructure costs
3. **Flexibility**: Adjustable without contract redeployment

## Backwards Compatibility

This standard is compatible with:

- **LP-2030**: LRC-20 Bridgable Token Extension (extends interface)
- **LP-6016**: Teleport Cross-Chain Protocol (native Warp integration)
- **LP-6017**: Bridge Asset Registry (asset tracking)
- **LP-6018**: Cross-Chain Message Format (message structure)

Existing ERC20 tokens can be made bridgeable by:
1. Deploying wrapped ERC20B version
2. Creating lock/unlock mechanism for original token
3. Registering with bridge contract

## Test Cases

### Unit Tests

```solidity
// Test: Successful burn
function testBridgeBurn() public {
    token.approve(address(bridge), 1000e18);
    bridge.bridgeBurn(1000e18, address(token));
    assertEq(token.balanceOf(address(this)), 0);
}

// Test: Replay protection
function testReplayProtection() public {
    bridge.bridgeMintStealth(amt, hashedId, to, sig, token, chainId, vault);
    vm.expectRevert("DupeTX");
    bridge.bridgeMintStealth(amt, hashedId, to, sig, token, chainId, vault);
}

// Test: Invalid signer rejection
function testInvalidSigner() public {
    bytes memory badSig = generateSig(nonMPCKey);
    vm.expectRevert("BadSig");
    bridge.bridgeMintStealth(amt, hashedId, to, badSig, token, chainId, vault);
}

// Test: Fee calculation
function testFeeCalculation() public {
    uint256 amount = 1000e18;
    uint256 expectedFee = amount * bridge.feeRate() / 1e18;
    uint256 expectedNet = amount - expectedFee;

    bridge.bridgeMintStealth(amount, ...);

    assertEq(token.balanceOf(payoutAddr), expectedFee);
    assertEq(token.balanceOf(recipient), expectedNet);
}
```

### Integration Tests

```bash
# Run bridge tests
cd ~/work/lux/standard
forge test --match-contract BridgeTest -vvv

# Coverage report
forge coverage --match-contract Bridge
```

## Reference Implementation

### Contract Locations

| Contract | Path |
|----------|------|
| Bridge.sol | `/Users/z/work/lux/standard/src/teleport/Bridge.sol` |
| IERC20Bridgable.sol | `/Users/z/work/lux/standard/src/interfaces/IERC20Bridgable.sol` |

### Interface Definition

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20Bridgable {
    function bridgeBurn(address from, uint256 amount) external;
    function bridgeMint(address to, uint256 amount) external;
    event BridgeBurn(address indexed from, uint256 amount);
    event BridgeMint(address indexed to, uint256 amount);
}
```

### Usage Example

```solidity
// Source chain: Burn tokens for bridge
IERC20(token).approve(bridge, amount);
IBridge(bridge).bridgeBurn(amount, token);

// Destination chain: Claim with MPC signature
IBridge(bridge).bridgeMintStealth(
    amount,
    hashedTxId,
    recipient,
    mpcSignature,
    token,
    chainId,
    vault
);
```

## Security Considerations

### Threat Model

| Threat | Mitigation |
|--------|------------|
| MPC key compromise | Threshold requirement (t-of-n), key rotation |
| Replay attacks | Signature deduplication mapping |
| Fee manipulation | Immutable fee logic, admin-only rate changes |
| Unauthorized minting | MPC oracle address whitelist |
| Front-running | Commit-reveal possible for high-value transfers |

### Oracle Security Requirements

1. **Geographic distribution**: Oracles in different jurisdictions
2. **Key storage**: HSM or secure enclave recommended
3. **Monitoring**: Real-time alerting on bridge events
4. **Rotation**: Regular key rotation schedule

### Rate Limiting Recommendations

| Limit Type | Suggested Value | Purpose |
|------------|-----------------|---------|
| Per-transfer max | 1,000,000 LUX | Limit single attack impact |
| Daily volume max | 10,000,000 LUX | Limit cumulative exposure |
| Cooldown period | 10 blocks | Prevent rapid-fire attacks |

### Audit Status

- **Internal Review**: Complete
- **External Audit**: Pending
- **Bug Bounty**: Active via Immunefi

## Economic Impact

### Fee Distribution

| Recipient | Percentage | Purpose |
|-----------|------------|---------|
| Protocol Treasury | 50% | Development funding |
| Oracle Operators | 40% | Infrastructure costs |
| Insurance Fund | 10% | Bridge security reserve |

### Gas Costs

| Operation | Estimated Gas | USD @ 20 gwei |
|-----------|---------------|---------------|
| bridgeBurn | ~80,000 | $1.60 |
| bridgeMintStealth | ~150,000 | $3.00 |
| setMPCOracle | ~45,000 | $0.90 |

## Open Questions

1. **Threshold adjustment**: How to handle oracle set changes mid-flight?
2. **Emergency pause**: Should there be a global bridge pause mechanism?
3. **Cross-chain finality**: How long to wait for source chain finality?
4. **Post-quantum**: Migration path to quantum-resistant signatures (LP-4)?

## Related LPs

- **LP-2030**: LRC-20 Bridgable Token Extension
- **LP-6016**: Teleport Cross-Chain Protocol
- **LP-6017**: Bridge Asset Registry
- **LP-6018**: Cross-Chain Message Format
- **LP-6019**: Bridge Security Framework
- **LP-7319**: T-Chain Decentralised MPC Custody

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
