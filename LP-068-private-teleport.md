---
lp: 068
title: Cross-Chain Private Transfers
tags: [privacy, teleport, bridge, cross-chain, shielded, warp]
description: Private cross-chain transfers combining shielded pools and Warp messaging
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2024-09-01
references:
  - lps-064 (Privacy Pool)
  - lps-016 (Omnichain Router)
  - lps-063 (Z-Chain UTXO Privacy)
  - lp-6022 (Warp Messaging)
---

# LP-068: Cross-Chain Private Transfers

## Abstract

Defines a protocol for private cross-chain transfers on Lux Network. A user deposits into a shielded pool (LP-064) on the source chain and withdraws from a corresponding pool on the destination chain. The cross-chain message is relayed via Warp messaging (LP-6022) and contains only the commitment proof and nullifier -- no amounts, senders, or receivers are revealed in the cross-chain message.

## Specification

### Protocol Flow

```
Source Chain                          Destination Chain
1. User deposits into ShieldedPool
2. Pool emits commitment event
3. Warp message: {root, nullifier,    ---->  4. DestPool verifies Warp signature
   proof, destChain, recipient_hash}         5. DestPool verifies ZK proof
                                             6. DestPool releases funds to recipient
```

### Warp Message Format

| Field | Type | Description |
|-------|------|-------------|
| sourceChainID | bytes32 | Origin chain identifier |
| sourcePool | address | ShieldedPool address on source chain |
| merkleRoot | bytes32 | Commitment tree root at proof time |
| nullifierHash | bytes32 | Nullifier preventing double-spend |
| proof | bytes | ZK proof of valid deposit on source chain |
| recipientHash | bytes32 | Poseidon2 hash of recipient address (not plaintext) |

### Liquidity

Each chain maintains a ShieldedPool funded by liquidity providers. LPs deposit into destination pools and earn fees from private transfer volume. Pool balances are public (aggregate liquidity) but individual deposit/withdrawal links are hidden.

### Cross-Chain Nullifier Sync

Nullifiers must be globally unique across all chains. The protocol maintains a nullifier registry per chain and includes the source chain ID in the nullifier derivation:

```
nullifier = Poseidon2(commitment || spending_key || sourceChainID)
```

Warp-relayed nullifiers are checked on the destination chain before releasing funds.

## Security Considerations

1. The Warp message reveals the source and destination chains but not the sender, receiver, or amount.
2. Recipient hash prevents front-running -- only the intended recipient can claim.
3. Liquidity pool size determines the anonymity set on the destination chain.
4. Cross-chain replay is prevented by including the source chain ID in the nullifier.

## Reference

| Resource | Location |
|----------|----------|
| PrivateTeleport contract | `github.com/luxfi/standard/contracts/privacy/PrivateTeleport.sol` |
| Warp messaging | `github.com/luxfi/evm/warp/` |
| ShieldedPool | `github.com/luxfi/standard/contracts/privacy/ShieldedPool.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
