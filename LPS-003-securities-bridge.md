---
lps: 003
title: Cross-Chain Securities Bridge
tags: [securities, bridge, cross-chain, warp, teleport, tzero, mpc]
description: SecurityBridge lock/mint/burn/release pattern for cross-chain security token transfers
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Markets
created: 2022-02-10
updated: 2025-11-01
requires:
  - lps-001 (Digital Securities Standard)
  - lp-6022 (Warp Messaging 2.0)
  - lp-5013 (T-Chain MPC Custody)
  - lp-6331 (B-Chain BridgeVM)
  - lp-3001 (Teleport Bridge MPC)
references:
  - lp-6332 (Teleport Bridge Architecture)
  - lp-3800 (Bridged Asset Standard)
  - lp-3810 (Teleport Token Standard)
---

# LPS-003: Cross-Chain Securities Bridge

## Abstract

This specification defines the `SecurityBridge` contract and cross-chain protocol for moving security tokens between Lux chains. Security tokens can be bridged between the C-Chain, Liquidity L2, Zoo EVM, and any Lux subnet. The bridge enforces compliance on both source and destination chains. Cross-listing with tZero uses the same bridge architecture for off-chain ATS settlement.

## Motivation

Security tokens issued on one Lux chain need to trade on others:
- Issued on C-Chain, traded on Liquidity L2 (lower fees, dedicated ATS infrastructure)
- Issued on C-Chain, traded on Zoo EVM (marketplace integration)
- Cross-listed on tZero (off-chain ATS, SEC-registered)

Without a bridge, each chain would need its own token with its own compliance registry, and balances would diverge. The bridge maintains a single logical token supply across all chains.

## Bridge Pattern

### Lock/Mint (Source -> Destination)

Used when moving tokens from the chain where the token was originally deployed (the "home chain") to a remote chain.

```
Home Chain (C-Chain)              Remote Chain (Liquidity L2)
--------------------              -------------------------
1. User calls lock()
   -> tokens transferred
      to SecurityBridge contract
   -> BridgeLock event emitted
                                  2. Relayer verifies the lock
                                     via Warp message
                                  3. Relayer calls bridgeMint()
                                     -> new tokens minted
                                        to user on remote chain
                                     -> BridgeMint event emitted
```

### Burn/Release (Destination -> Source)

Used when moving tokens back to the home chain.

```
Remote Chain (Liquidity L2)       Home Chain (C-Chain)
---------------------------       --------------------
1. User calls burn()
   -> tokens burned on
      remote chain
   -> BridgeBurn event emitted
                                  2. Relayer verifies the burn
                                     via Warp message
                                  3. Relayer calls bridgeRelease()
                                     -> locked tokens released
                                        to user on home chain
                                     -> BridgeRelease event emitted
```

### Invariant

At all times:

```
HomeChain.SecurityBridge.lockedBalance + sum(RemoteChain[i].SecurityToken.totalSupply)
  == HomeChain.SecurityToken.totalSupply (at time of lock)
```

The bridge never creates or destroys net supply. Tokens are either locked on the home chain or minted on a remote chain. Never both.

## Contract

The `SecurityBridge` contract (deployed per-token, per-chain):

```solidity
contract SecurityBridge is AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    SecurityToken public immutable TOKEN;
    mapping(bytes32 => bool) public processedNonces;

    // Source chain operations (user-callable)
    function lock(uint256 amount, uint256 destinationChainId, address destinationAddress) external;
    function burn(uint256 amount, uint256 destinationChainId) external;

    // Destination chain operations (bridge operator only)
    function bridgeMint(address recipient, uint256 amount, uint256 sourceChainId, bytes32 nonce) external;
    function bridgeRelease(address recipient, uint256 amount, uint256 sourceChainId, bytes32 nonce) external;
}
```

### Nonce Deduplication

Every bridge operation generates a nonce:

```solidity
bytes32 nonce = keccak256(abi.encodePacked(sender, amount, destinationChainId, block.timestamp, block.number));
```

The destination chain tracks `processedNonces[nonce]`. A nonce can only be processed once. This prevents replay attacks.

### Role: BRIDGE_ROLE

The `BRIDGE_ROLE` authorizes `bridgeMint()` and `bridgeRelease()`. This role must be held by:
- A T-Chain MPC multisig (LP-5013) for production deployments
- A Warp-verified relayer contract for automated bridging

A single EOA must never hold `BRIDGE_ROLE` in production.

## Warp Messaging

### Protocol

Lux Warp Messaging (LP-6022) provides native cross-subnet communication. The bridge uses Warp for lock/mint and burn/release verification.

### Message Flow

```
Source Chain                    Lux P-Chain                   Destination Chain
------------                    -----------                   -----------------
1. SecurityBridge.lock()
   emits BridgeLock event

2. Subnet validators sign
   Warp message containing:
   - sourceChainId
   - destinationChainId
   - sender
   - recipient
   - amount
   - nonce

                                3. Warp message aggregated
                                   (BLS signature threshold)

                                                              4. Relayer submits
                                                                 Warp message to
                                                                 destination chain

                                                              5. WarpMessenger precompile
                                                                 verifies BLS signature

                                                              6. SecurityBridge.bridgeMint()
                                                                 called with verified params
```

### Warp Message Format

```solidity
struct SecurityBridgeMessage {
    bytes32 messageType;     // keccak256("BRIDGE_LOCK") or keccak256("BRIDGE_BURN")
    uint256 sourceChainId;
    uint256 destinationChainId;
    address sender;
    address recipient;
    uint256 amount;
    bytes32 nonce;
    address tokenAddress;    // SecurityToken on source chain
}
```

### Signature Threshold

Warp messages require a configurable BLS signature threshold from the source subnet's validators. For security tokens:
- Minimum: 67% of subnet stake weight (standard Warp threshold)
- Recommended: 80% for security tokens (higher assurance)
- Configurable per bridge deployment

## Cross-Chain Flows

### Zoo EVM <-> Liquidity L2 <-> Lux C-Chain

```
                    Lux C-Chain (Home)
                    SecurityToken deployed here
                    SecurityBridge (lock/release)
                         |
                    Warp Messaging
                         |
              +----------+----------+
              |                     |
      Liquidity L2             Zoo EVM
      SecurityToken            SecurityToken
      (bridge-minted)         (bridge-minted)
      SecurityBridge           SecurityBridge
      (burn/mint)              (burn/mint)
      ComplianceHook           ComplianceHook
      (DEX trading)            (marketplace)
```

**C-Chain -> Liquidity L2:**
1. User locks 1000 ACME on C-Chain SecurityBridge
2. Warp message signed by C-Chain validators
3. Liquidity L2 relayer verifies and calls bridgeMint(user, 1000, cChainId, nonce)
4. User now has 1000 ACME on Liquidity L2, tradeable on DEX with ComplianceHook

**Liquidity L2 -> Zoo EVM:**
1. User burns 500 ACME on Liquidity L2 SecurityBridge (destination: Zoo EVM)
2. NOT a release back to C-Chain -- this is a hop. Implementation:
   - Liquidity L2 bridge burns 500
   - C-Chain bridge receives the Warp message, releases 500 to itself, then locks 500 for Zoo EVM
   - Zoo EVM bridge mints 500
3. This two-hop pattern ensures the C-Chain invariant holds

**Direct subnet-to-subnet bridging** (without C-Chain hop) is possible when both subnets trust each other's validator set directly. This requires explicit opt-in via bridge configuration.

### Chain IDs

| Chain | Chain ID | Purpose |
|---|---|---|
| Lux C-Chain | 96369 | Home chain for most security tokens |
| Liquidity L2 (LiquidityEVM) | 8675311 | ATS trading, regulated DEX |
| Zoo EVM | TBD | NFT marketplace, DeSci |

### Compliance on Bridge

Compliance is enforced at both ends:

**Source chain (lock/burn):**
- `lock()` calls `TOKEN.safeTransferFrom()`, which triggers `SecurityToken._update()`, which calls `ComplianceRegistry.canTransfer()`. If the sender is not compliant, the lock reverts.

**Destination chain (mint/release):**
- `bridgeMint()` calls `TOKEN.mint()`, which bypasses compliance (minting is issuer-controlled). However, the recipient must be whitelisted on the destination chain's ComplianceRegistry to subsequently trade.
- The bridge operator (MPC multisig) should verify destination compliance before executing the mint.

**Compliance registry synchronization:**
- Each chain maintains its own `ComplianceRegistry`
- The compliance service (`lux/compliance`) synchronizes whitelist status across chains
- Synchronization uses the same Warp messaging channel
- If a user is blacklisted on one chain, the blacklist propagates to all chains

## tZero Cross-Listing Bridge

### Architecture

tZero is an off-chain ATS. The "bridge" to tZero is not a blockchain bridge -- it is an API integration that uses the same lock/mint mental model.

```
Lux C-Chain                     tZero ATS
-----------                     ---------
SecurityToken                   tZero Security (off-chain)
SecurityBridge.lock()           tZero credits investor account
     |                               |
     +--- REST/Webhook API ----------+
     |                               |
SecurityBridge.bridgeRelease()  tZero debits investor account
```

### Cross-Listing Flow

**Lux -> tZero (investor wants to sell on tZero):**
1. Investor locks tokens on Lux SecurityBridge (destination: tZero, identified by a reserved chainId)
2. Bridge event triggers webhook to tZero settlement API
3. tZero credits the investor's account with the corresponding security position
4. Investor can now sell on tZero ATS

**tZero -> Lux (investor wants tokens on-chain):**
1. Investor initiates withdrawal on tZero
2. tZero settlement API sends webhook to Lux bridge service
3. Bridge service (authorized with BRIDGE_ROLE via MPC) calls `SecurityBridge.bridgeRelease()`
4. Tokens released to investor's on-chain address

### tZero Reserved Chain ID

tZero uses a reserved chain ID for bridge addressing:

```
tZero Chain ID: 0xTZERO (placeholder -- actual value assigned at integration time)
```

This is not a blockchain chain ID. It is a routing identifier that the bridge service uses to determine that the destination is tZero rather than another Lux chain.

### Settlement Timing

| Direction | Latency | Notes |
|---|---|---|
| Lux -> tZero | < 5 minutes | Lock is instant; tZero credit after webhook processing |
| tZero -> Lux | < 5 minutes | tZero debit + webhook + bridgeRelease transaction |
| Lux -> Lux (cross-chain) | < 30 seconds | Warp message propagation + finality |

### Webhook Security

All tZero webhooks use:
- HMAC-SHA256 signature verification
- Per-integration secret stored in KMS (kms.hanzo.ai)
- Timestamp validation (5-minute window)
- Idempotency keys to prevent double-processing
- TLS 1.3 minimum

```
X-Signature: HMAC-SHA256(secret, timestamp + "." + body)
X-Timestamp: 1711100400
X-Idempotency-Key: uuid-v4
```

## Bridge Operator

### MPC Multisig

The bridge operator for production deployments is a T-Chain MPC multisig (LP-5013):

- **Threshold**: 3-of-5 signers minimum for security token bridges
- **Key rotation**: Quarterly, via DKG resharing (LP-5333)
- **Per-asset keys**: Each security token bridge uses a dedicated MPC key group (LP-5334)
- **Hardware backing**: At least 2 of 5 signers use HSM-backed keys (LP-5325)

### Relayer Architecture

```
Warp Message (BLS signed)
        |
        v
+-------------------+
| Bridge Relayer     |
| (Go service)       |
|                    |
| 1. Verify Warp msg|
| 2. Decode params   |
| 3. Check compliance|
| 4. Submit to MPC   |
+-------------------+
        |
        v
+-------------------+
| T-Chain MPC        |
| (threshold sign)   |
|                    |
| 5. Sign bridgeMint |
|    transaction      |
+-------------------+
        |
        v
+-------------------+
| Destination Chain   |
| SecurityBridge      |
|                    |
| 6. bridgeMint()    |
+-------------------+
```

The relayer is a stateless Go service that:
1. Watches for Warp messages on source chains
2. Verifies BLS signature threshold
3. Checks compliance on destination chain (pre-flight)
4. Submits the mint/release request to the MPC signing cluster
5. Broadcasts the signed transaction to the destination chain

## Emergency Procedures

### Pause

Both the SecurityToken and SecurityBridge can be paused independently:
- `SecurityToken.pause()` halts all transfers including bridge operations
- Bridge-specific pause is achieved by revoking `BRIDGE_ROLE` from the operator

### Stuck Funds

If tokens are locked on the home chain but the destination chain fails to mint:
1. The lock event and nonce are recorded on-chain
2. After a timeout (configurable, default 24 hours), admin can call a recovery function to release locked tokens back to the sender
3. Recovery requires `DEFAULT_ADMIN_ROLE` (multisig)

### Chain Halt

If a destination chain halts:
1. Lock operations on the home chain continue to work (tokens accumulate in the bridge)
2. No mints occur on the halted chain
3. When the chain resumes, the relayer processes the backlog in order
4. Nonce deduplication prevents double-minting

## Gas Costs

| Operation | Chain | Estimated Gas |
|---|---|---|
| `lock()` | Home chain | ~65,000 (transfer + event) |
| `burn()` | Remote chain | ~45,000 (burn + event) |
| `bridgeMint()` | Remote chain | ~55,000 (mint + nonce check + event) |
| `bridgeRelease()` | Home chain | ~50,000 (transfer + nonce check + event) |

Compliance checks in `lock()` add ~8,000-15,000 gas (via SecurityToken._update).

## Security Considerations

1. **Nonce replay**: Each nonce can only be processed once. The nonce includes `block.timestamp` and `block.number`, making it unique per-block. Two locks in the same block from the same sender for the same amount produce different nonces due to different call positions.

2. **Warp signature verification**: The destination chain verifies the BLS aggregate signature against the source subnet's registered validator set on the P-Chain. A compromised minority of validators cannot produce a valid Warp message (67% threshold minimum).

3. **MPC key compromise**: If the MPC signing threshold is compromised, the attacker can mint tokens on destination chains. Mitigation: per-asset key groups, HSM backing, quarterly rotation, real-time monitoring of bridge events.

4. **Compliance desynchronization**: If chain A whitelists a user and chain B has not synced yet, the user can lock on A but cannot trade on B. This is a liveness issue, not a safety issue -- compliance sync latency is the bottleneck. The compliance service targets < 30 second sync across chains.

5. **Double-spend via reorg**: If the source chain reorgs after a lock is processed, the destination chain has already minted. Mitigation: wait for finality before processing (Lux finality is 1ms, so reorgs are practically impossible under normal conditions).

6. **Token supply audit**: The bridge invariant (locked + remote supply = home supply) must be auditable. Both the home chain bridge balance and remote chain total supply are public on-chain state. An automated monitor verifies the invariant every block.

## Reference

| Resource | Location |
|---|---|
| SecurityBridge contract | `github.com/luxfi/standard/contracts/securities/bridge/SecurityBridge.sol` |
| Warp Messaging 2.0 | `lp-6022-warp-messaging-20-native-interchain-transfers.md` |
| T-Chain MPC Custody | `lp-5013-t-chain-decentralised-mpc-custody-and-swap-signature-layer.md` |
| Teleport Bridge Architecture | `lp-6332-teleport-bridge-architecture-unified-cross-chain-protocol.md` |
| LPS-001 Digital Securities | `LPS-001-digital-securities.md` |
| tZero API | https://tzero.com |

## Copyright

Copyright (c) 2026 Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
