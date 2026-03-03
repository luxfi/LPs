---
lp: 016
title: OmnichainRouter
tags: [bridge, omnichain, router, mpc, governance, timelock, teleport]
description: Sovereign per-chain bridge router with MPC group verification, timelock signer rotation, and exit guarantees
author: Lux Industries
status: Final
type: Standards Track
category: Bridge
created: 2022-09-15
requires:
  - lps-003 (Cross-Chain Securities Bridge)
  - lps-019 (Threshold MPC)
references:
  - lp-6332 (Teleport Bridge Architecture)
  - lp-3001 (Teleport Bridge MPC)
  - lp-3800 (Bridged Asset Standard)
---

# LP-016: OmnichainRouter

## Abstract

OmnichainRouter is a per-chain bridge contract that governs lock/mint/burn/release operations across 270 supported chain IDs. Each chain deployment is sovereign: it has its own governor, fee configuration, and signer group. The router verifies aggregate MPC group threshold signatures (not individual signers), enforces a 7-day timelock on signer rotation, auto-pauses on undercollateralization, and guarantees that burns (exits) always succeed regardless of contract state.

## Motivation

Existing bridge routers share a single governance surface across all chains. A governance compromise on one chain cascades to all chains. Bridge users have no exit guarantee when governance is captured or when the contract is paused.

OmnichainRouter addresses this by:
1. Isolating governance per chain deployment -- a compromised governor on chain A cannot affect chain B
2. Verifying MPC group threshold keys rather than individual signer addresses, eliminating the N-of-M signer enumeration attack surface
3. Enforcing a 7-day timelock on signer rotation so users can exit before a malicious key rotation takes effect
4. Guaranteeing that `burn()` (exit) always executes, even when the contract is paused
5. Auto-pausing mints when collateral drops below the minted supply

## Specification

### 1. Chain Registry

The router supports 270 chain IDs. Each chain is registered with its bridge parameters:

```solidity
struct ChainConfig {
    uint256 chainId;
    bool    active;
    uint256 minBridgeAmount;
    uint256 maxBridgeAmount;
    uint256 dailyLimit;
    uint256 dailyVolume;
    uint256 lastResetTimestamp;
}

mapping(uint256 => ChainConfig) public chains;  // chainId => config
uint256 public chainCount;                       // current: 270
```

The governor can activate/deactivate chains and adjust per-chain limits. Adding a new chain increments `chainCount`.

### 2. MPC Group Verification

The router does NOT store individual signer addresses. It stores a single aggregate public key representing the MPC group:

```solidity
bytes32 public signerGroupKey;         // keccak256 of the aggregate public key
uint256 public signerGroupKeyEffective; // timestamp when current key became active
```

Signature verification:

```solidity
function _verifySignature(bytes32 messageHash, bytes calldata signature) internal view {
    // Recover aggregate public key from signature
    // Verify it matches signerGroupKey
    // Single ecrecover for ECDSA groups (CGGMP21)
    // Precompile 0x000C for FROST groups (EdDSA)
}
```

This design means the contract never knows how many signers exist or what the threshold is. That is internal to the MPC group. The contract only verifies the final aggregate signature.

### 3. Timelock Signer Rotation

Signer rotation is subject to a mandatory 7-day timelock:

```solidity
uint256 public constant ROTATION_DELAY = 7 days;

bytes32 public pendingSignerGroupKey;
uint256 public rotationUnlocksAt;

function proposeSignerRotation(bytes32 newKey) external onlyGovernor {
    pendingSignerGroupKey = newKey;
    rotationUnlocksAt = block.timestamp + ROTATION_DELAY;
    emit SignerRotationProposed(newKey, rotationUnlocksAt);
}

function executeSignerRotation() external {
    require(block.timestamp >= rotationUnlocksAt, "timelock active");
    require(pendingSignerGroupKey != bytes32(0), "no pending rotation");

    signerGroupKey = pendingSignerGroupKey;
    signerGroupKeyEffective = block.timestamp;
    pendingSignerGroupKey = bytes32(0);
    rotationUnlocksAt = 0;

    emit SignerRotated(signerGroupKey);
}

function cancelSignerRotation() external onlyGovernor {
    pendingSignerGroupKey = bytes32(0);
    rotationUnlocksAt = 0;
    emit SignerRotationCancelled();
}
```

The 7-day window gives users time to exit (burn) if they disagree with the proposed new signer group.

### 4. Exit Guarantee

Burns (exits from bridged tokens back to the home chain) are ALWAYS allowed, regardless of pause state:

```solidity
bool public paused;

modifier whenNotPaused() {
    require(!paused, "paused");
    _;
}

function lock(uint256 amount, uint256 destChainId) external whenNotPaused { ... }
function bridgeMint(address to, uint256 amount, bytes calldata sig) external whenNotPaused { ... }

// Burns are NEVER gated by pause
function burn(uint256 amount, uint256 destChainId) external {
    // No pause check -- exit always allowed
    TOKEN.burnFrom(msg.sender, amount);
    emit Burned(msg.sender, amount, destChainId);
}
```

This is a hard guarantee: no governance action, no pause, no signer rotation can prevent a user from burning their bridged tokens to initiate an exit back to the home chain.

### 5. Auto-Pause on Undercollateralization

The router monitors the collateral invariant:

```
locked_on_home_chain >= total_minted_on_remote_chains
```

If a mint would violate this invariant, the router auto-pauses:

```solidity
uint256 public totalMinted;
uint256 public totalLocked;

function bridgeMint(address to, uint256 amount, bytes calldata sig) external whenNotPaused {
    _verifySignature(keccak256(abi.encode(to, amount, block.chainid)), sig);

    if (totalMinted + amount > totalLocked) {
        paused = true;
        emit AutoPaused(totalLocked, totalMinted + amount);
        revert("undercollateralized");
    }

    totalMinted += amount;
    TOKEN.mint(to, amount);
    emit Minted(to, amount);
}
```

Auto-pause can only be lifted by the governor after the collateral invariant is restored.

### 6. Fee Structure

Fees are split between a staking vault and the treasury:

```solidity
uint256 public bridgeFeeBps;         // total fee in basis points (e.g. 30 = 0.30%)
uint256 public stakeholderShareBps;  // share to staking vault (e.g. 7000 = 70%)
address public stakingVault;
address public treasury;

function _collectFee(uint256 amount) internal returns (uint256 netAmount) {
    uint256 fee = (amount * bridgeFeeBps) / 10_000;
    uint256 stakingShare = (fee * stakeholderShareBps) / 10_000;
    uint256 treasuryShare = fee - stakingShare;

    TOKEN.safeTransfer(stakingVault, stakingShare);
    TOKEN.safeTransfer(treasury, treasuryShare);

    return amount - fee;
}
```

The governor can adjust `bridgeFeeBps` and `stakeholderShareBps`. The governor CANNOT call `mint()` directly -- minting is only possible through the verified MPC signature path in `bridgeMint()`.

### 7. Governor Permissions

```solidity
// Governor CAN:
function setFees(uint256 newFeeBps, uint256 newShareBps) external onlyGovernor;
function setChainConfig(uint256 chainId, ChainConfig calldata config) external onlyGovernor;
function proposeSignerRotation(bytes32 newKey) external onlyGovernor;
function cancelSignerRotation() external onlyGovernor;
function unpause() external onlyGovernor;

// Governor CANNOT:
// - mint tokens (only bridgeMint with valid MPC signature)
// - prevent burns (exit guarantee)
// - bypass timelock on signer rotation
// - override auto-pause without restoring collateral
```

### 8. Supported Chains

The router is deployed on 270 chains at launch. Chain registry includes all EVM-compatible chains, Lux subnets, and chains reachable via the Teleport protocol (LP-017 native programs). The full chain ID list is maintained in the deployment manifest and is not hardcoded in the contract.

## Security Considerations

1. **MPC group opacity**: The contract cannot distinguish between a 3-of-5 and a 5-of-5 threshold. This is by design -- threshold policy is enforced off-chain by the MPC protocol (LP-019). On-chain verification only confirms the aggregate signature is valid.

2. **Timelock window**: 7 days is chosen to exceed the typical DeFi governance attack window (2-3 days). Users monitoring the `SignerRotationProposed` event have sufficient time to burn and exit.

3. **Exit guarantee under pause**: A paused router still allows burns. This prevents governance capture from trapping user funds. The home chain release still requires MPC signature, so a burn during pause creates a pending release that completes when the home chain MPC processes it.

4. **Undercollateralization detection**: The `totalLocked` / `totalMinted` accounting is per-router-instance. Cross-chain accounting relies on Warp message finality. A race condition between lock on chain A and mint on chain B is bounded by Lux finality (sub-second).

5. **Governor cannot mint**: The separation between fee governance and mint authority is enforced at the contract level. Even a compromised governor cannot inflate supply.

6. **Daily limits**: Per-chain daily volume limits bound the blast radius of a compromised MPC group to at most `maxBridgeAmount` per transaction and `dailyLimit` per day per chain.

## Reference

| Resource | Location |
|---|---|
| OmnichainRouter contract | `github.com/luxfi/teleport/contracts/OmnichainRouter.sol` |
| LP-003 Securities Bridge | `LP-003-securities-bridge.md` |
| LP-019 Threshold MPC | `LP-019-threshold-mpc.md` |
| Teleport Bridge Architecture | `lp-6332-teleport-bridge-architecture-unified-cross-chain-protocol.md` |
| Bridged Asset Standard | `lp-3800-bridged-asset-standard.md` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
