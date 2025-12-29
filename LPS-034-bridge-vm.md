---
lps: 034
title: Bridge VM
tags: [bridge, b-chain, cross-chain, mpc, lock, mint, vm]
description: B-chain virtual machine for cross-chain bridge custody and settlement
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2023-09-01
requires:
  - lps-019 (Threshold MPC)
  - lps-021 (Warp Messaging)
references:
  - lp-6332 (Teleport Bridge Architecture)
  - lp-3800 (Bridged Asset Standard)
---

# LPS-034: Bridge VM

## Abstract

The Bridge VM runs the B-chain, a purpose-built chain for cross-chain asset custody and settlement. It manages the lock/mint/burn/release lifecycle for bridged assets across 270+ chain IDs. The B-chain holds custodied assets in MPC-controlled vaults (LPS-019), tracks per-chain collateral invariants, and processes bridge operations as first-class VM transactions rather than smart contract calls.

## Specification

### Vault Model

Each supported external chain has a vault on the B-chain:

```
Vault {
    chainID         uint256
    custodiedAssets  map[assetID]uint256  // locked balances per asset
    mintedSupply    map[assetID]uint256  // minted bridged tokens
    signerGroupKey  [32]byte             // MPC aggregate key for this vault
    dailyLimit      uint256
    dailyVolume     uint256
    active          bool
}
```

The collateral invariant `custodiedAssets[asset] >= mintedSupply[asset]` is enforced at the VM level.

### Transaction Types

| Tx Type | Description |
|---|---|
| `LockTx` | Lock assets in a vault (initiates bridge-out) |
| `MintTx` | Mint bridged tokens (requires MPC signature, completes bridge-in) |
| `BurnTx` | Burn bridged tokens (initiates bridge-back, always succeeds) |
| `ReleaseTx` | Release custodied assets (requires MPC signature, completes bridge-back) |
| `RotateSignerTx` | Propose MPC key rotation (7-day timelock, per LPS-016) |
| `RegisterVaultTx` | Register a new chain vault (governance) |

### Bridge Flow

**Inbound (External -> Lux)**:
1. User locks tokens on external chain (observed by MPC watchers)
2. MPC group signs a `MintTx` on the B-chain
3. B-chain VM verifies MPC aggregate signature, increments `mintedSupply`, mints bridged tokens
4. Bridged tokens are Warp-transferred to the user's target Lux chain (C/Zoo/Hanzo/etc.)

**Outbound (Lux -> External)**:
1. User submits `BurnTx` on B-chain (always succeeds, no pause gate)
2. MPC group observes the burn, signs a release on the external chain
3. B-chain VM decrements `mintedSupply` and `custodiedAssets`

### Warp Integration

The B-chain is a Warp message hub. Bridged token minting on target chains (C-chain, subnets) is triggered by Warp messages from the B-chain. This means bridge operations have Lux-native finality without relying on external relayers.

### Rate Limiting

Per-vault daily limits bound blast radius:

- `dailyLimit`: maximum value bridged per chain per day
- Auto-pause: if `dailyVolume` exceeds `dailyLimit`, the vault pauses until the next UTC day

## Security Considerations

1. **Exit guarantee**: `BurnTx` is never gated by pause state. Users can always initiate exit.
2. **MPC custody**: no single key controls vault assets. Threshold signature required for all mints and releases.
3. **Per-chain isolation**: a compromised vault on chain A does not affect chain B's vault.

## Reference

| Resource | Location |
|---|---|
| Bridge VM | `github.com/luxfi/node/vms/bridgevm/` |
| MPC signing | LPS-019 |
| OmnichainRouter | LPS-016 |
| Warp messaging | LPS-021 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
