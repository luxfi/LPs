---
lp: 041
title: Relay VM
tags: [relay, r-chain, cross-chain, messaging, warp, vm]
description: Cross-chain message relay VM for warp-style verified message passing
author: Lux Industries
status: Draft
type: Standards Track
category: Virtual Machines
created: 2026-04-13
requires:
  - lp-020 (Quasar Consensus)
  - lp-021 (Warp Messaging)
  - lp-034 (Bridge VM)
---

# LP-041: Relay VM

## Abstract

The Relay VM runs the R-chain, a dedicated chain for cross-chain message
relaying. It is a sibling of the Bridge VM (B-chain, assets) and Oracle VM
(O-chain, data in): the R-chain moves **arbitrary messages** between chains
with verified inclusion proofs. Together B/O/R cover the three distinct
cross-chain concerns — assets, data, messages.

Precompile address nibble: `C=B` (see LP-129 Registry).

## Scope

R-chain handles:

- Inbound message ingestion from external chains (Ethereum, Cosmos, etc.)
- Light-client header registry for every supported source chain
- Merkle/SSZ/Warp inclusion-proof verification against stored headers
- Outbound message delivery to destination chains via Warp
- Relayer registry + bonds, slashing on fraudulent proof submission

R-chain does NOT handle:

- Asset custody (Bridge VM / B-chain)
- External data feeds (Oracle VM / O-chain)
- Settlement proofs (Bridge VM signs custody releases, R-chain only forwards messages)

## Boundary with Bridge VM

| Concern | Chain | VM |
|---------|-------|----|
| Token mint/burn with state proofs | B-chain | bridgevm |
| Arbitrary message passing (call data, events) | R-chain | relayvm |
| Signer set for asset custody | B-chain | bridgevm |
| Light-client headers for external chains | R-chain | relayvm |

A typical cross-chain swap uses BOTH: Bridge VM holds the tokens,
Relay VM delivers the "release" instruction.

## Specification

### Light-Client Header Registry

Each supported source chain has a light-client header chain:

```go
type SourceChain struct {
    ChainID         uint32
    ConsensusType   uint8    // 1=Ethereum, 2=Cosmos, 3=Warp-Lux, ...
    GenesisHeader   []byte
    LatestHeight    uint64
    LatestHeaderHash [32]byte
}
```

Headers arrive via relayer submissions. Each new header is verified against
the consensus protocol of the source chain (Ethereum's beacon consensus,
Cosmos Tendermint, etc.) before being accepted.

### Message Envelope

```go
type Message struct {
    SourceChainID   uint32
    DestChainID     uint32
    Nonce           uint64
    Sender          [20]byte
    Recipient       [20]byte
    Payload         []byte
    Proof           InclusionProof
}
```

### Relayer Bonds

Relayers stake LUX to submit proofs. Submitting an invalid proof slashes
the full bond. Minimum bond: 100 LUX.

## Rationale

Keeping bridge, oracle, and relay as separate chains:

- **Separate signer sets** (different economic security per function)
- **Separate block cadence** (oracle wants fast; bridge wants secure;
  relay prioritizes liveness)
- **Clear accountability** when one subsystem misbehaves
- **Independent liveness**: if oracle stops, bridge still works

Consolidating them into one VM (as the deleted teleportvm tried) creates
a single point of failure and conflates distinct security properties.

## Reference

| Resource | Location |
|----------|----------|
| Relay VM | `github.com/luxfi/chains/relayvm/` |
| Bridge VM | `github.com/luxfi/chains/bridgevm/` |
| Oracle VM | `github.com/luxfi/chains/oraclevm/` |
| Warp | LP-021 |
