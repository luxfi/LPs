---
lp: 039
title: Teleport VM
tags: [teleport, t-chain, transport, cross-chain, relay, vm]
description: Teleport cross-chain transport VM for universal message passing and asset transfers
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2022-09-01
requires:
  - lps-019 (Threshold MPC)
  - lps-021 (Warp Messaging)
  - lps-034 (Bridge VM)
references:
  - lp-6332 (Teleport Bridge Architecture)
  - lp-5013 (T-Chain MPC Custody)
---

# LP-039: Teleport VM

## Abstract

The Teleport VM runs the T-chain, the universal cross-chain transport layer for Lux. While Warp (LP-021) handles intra-Lux messaging and Bridge VM (LP-034) handles asset custody, Teleport extends cross-chain communication to external networks (Ethereum, Solana, Bitcoin, Cosmos). The T-chain maintains light client headers for external chains, verifies inclusion proofs, and relays messages through MPC-signed transactions.

## Specification

### External Chain Registry

Each supported external chain has a light client on the T-chain:

```
ExternalChain {
    chainID         uint256
    chainType       uint8       // 0=EVM, 1=Solana, 2=Bitcoin, 3=Cosmos, 4=Move
    lightClient     address     // T-chain contract verifying external headers
    confirmations   uint64      // required confirmations (e.g., 12 for Ethereum)
    relayers        []address   // authorized header relayers
    active          bool
}
```

### Light Client Verification

For each external chain, a light client contract on the T-chain verifies block headers:

- **EVM chains**: verify block header PoS signatures or PoW difficulty
- **Solana**: verify leader schedule and vote signatures
- **Bitcoin**: verify PoW chain with difficulty adjustment
- **Cosmos**: verify Tendermint validator signatures

Relayers submit headers; the light client contract verifies them. Once a header is accepted, inclusion proofs against that header's state root are considered valid.

### Message Relay

**Inbound (External -> Lux)**:
1. User initiates action on external chain (e.g., locks tokens in Teleport contract)
2. Relayers submit the transaction's inclusion proof + block header to T-chain
3. T-chain light client verifies the proof
4. T-chain emits a Warp message to the destination Lux chain

**Outbound (Lux -> External)**:
1. User submits a Teleport request on the T-chain
2. MPC group observes the request and signs a transaction on the external chain
3. T-chain records the external transaction hash for tracking

### Supported Operations

| Operation | Description |
|---|---|
| `TokenBridge` | Lock/mint/burn/release across chains |
| `MessageRelay` | Arbitrary message passing (governance, contract calls) |
| `NFTBridge` | Cross-chain NFT transfers with metadata |
| `LiquidityTransfer` | Move liquidity positions across DEXs |

### Relayer Network

Relayers are staked participants who submit external chain headers to the T-chain:

- **Minimum stake**: 200 LUX
- **Reward**: per-header relay fee (paid by the protocol)
- **Slashing**: submitting invalid headers results in stake loss
- **Redundancy**: multiple relayers per chain ensure liveness

### Fee Structure

- **Relay fee**: covers relayer costs + protocol margin
- **MPC signing fee**: covers MPC operational costs for outbound transactions
- **Total bridge fee**: relay fee + MPC fee + destination gas (variable per chain)

## Security Considerations

1. **Light client trust**: T-chain trusts external chains up to their own security model. A 51% attack on an external chain could produce valid-looking but fraudulent headers.
2. **Confirmation depth**: higher `confirmations` values reduce reorg risk at the cost of latency.
3. **MPC liveness**: outbound transactions require MPC group availability. If the MPC group is offline, outbound messages queue until it recovers.

## Reference

| Resource | Location |
|---|---|
| Teleport VM | `github.com/luxfi/node/vms/teleportvm/` |
| Light clients | `github.com/luxfi/node/vms/teleportvm/lightclient/` |
| MPC signing | LP-019 |
| Bridge custody | LP-034 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
