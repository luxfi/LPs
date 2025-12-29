---
lps: 021
title: Warp Messaging
tags: [warp, bls, cross-chain, messaging, aggregate-signature]
description: BLS aggregate signature cross-chain messaging protocol for Lux subnets
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2023-03-01
requires:
  - lps-015 (Validator Key Management)
  - lps-020 (Quasar Consensus)
references:
  - lp-6022 (Warp Messaging)
  - lp-6332 (Teleport Bridge Architecture)
---

# LPS-021: Warp Messaging

## Abstract

Warp Messaging is Lux Network's native cross-chain communication protocol. A source subnet's validators BLS-sign an outbound message. The destination subnet verifies the aggregate signature against the source subnet's registered validator set on the P-chain. No relayers, no oracles, no external trust assumptions beyond the source subnet's own validator set.

## Specification

### Message Format

```
WarpMessage {
    sourceChainID   [32]byte   // blockchain ID of the sending chain
    payload         []byte     // arbitrary application data (max 32 KB)
    signature       [48]byte   // BLS12-381 aggregate signature
    signerBitSet    []byte     // bitfield indicating which validators signed
}
```

### Signing Flow

1. A contract on chain A emits a `WarpMessage` log event
2. Validators of subnet A observe the event and BLS-sign `H(sourceChainID || payload)`
3. Any party (relayer, user, contract) collects signatures until `WARP_QUORUM` (67% of subnet stake) is reached
4. The aggregate signature and signer bitset are submitted to chain B as a transaction input

### Verification

Chain B verifies the Warp message by:

1. Looking up subnet A's current validator set from the P-chain state
2. Extracting the signing validators from `signerBitSet`
3. Confirming the signers represent >= 67% of subnet A's total stake weight
4. Verifying `AggregateVerify(aggSig, H(sourceChainID || payload), aggPK)` in a single pairing check

Verification is exposed as a precompile at address `0x0200000000000000000000000000000000000005`.

### Addressing

Warp messages are addressed by `(sourceChainID, destinationChainID)`. The payload is opaque to the protocol -- application-layer contracts interpret it. Common payload types:

| Type | Use |
|---|---|
| `TokenTransfer` | Bridge lock/mint/burn/release |
| `ValidatorSetUpdate` | Subnet validator set changes |
| `GovernanceAction` | Cross-chain governance execution |
| `OraclePrice` | Price feed propagation |

### Rate Limiting

Each subnet can configure `WARP_MAX_MESSAGES_PER_BLOCK` (default 64) to bound the verification cost per block. Messages exceeding the limit are queued for the next block.

## Security Considerations

1. **Subnet trust model**: the receiver trusts the source subnet's validators. A compromised subnet (>67% Byzantine) can forge Warp messages. This is by design -- Warp inherits the security of the source subnet.
2. **Replay protection**: `(sourceChainID, nonce)` tuples are tracked on the destination. Each message is processed exactly once.
3. **P-chain consistency**: validator set lookups use the P-chain state at the block height when the message was signed. Validator set changes during in-flight messages are handled by accepting signatures from validators active at signing time.

## Reference

| Resource | Location |
|---|---|
| Warp precompile | `github.com/luxfi/evm/precompile/contracts/warp/` |
| P-chain validator registry | `github.com/luxfi/node/vms/platformvm/state/` |
| LP-6022 | Warp Messaging specification |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
