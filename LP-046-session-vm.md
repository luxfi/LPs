---
lp: 046
title: Session VM
tags: [session, sessionvm, messaging, pq, inpars, vm]
description: Post-quantum secure private messaging service node registry
author: Lux Industries
status: Draft
type: Standards Track
category: Virtual Machines
created: 2026-04-13
requires:
  - lp-020 (Quasar Consensus)
  - lp-042 (Identity VM)
---

# LP-046: Session VM

## Abstract

SessionVM is an **optional** on-chain registry and coordination layer for the
Lux Session messenger — a Session/Oxen-style private messaging overlay with
post-quantum security (ML-KEM-768 + ML-DSA-65 + XChaCha20-Poly1305).

SessionVM is **not part of the primary network** (P / X / C). Most deployments
that want Session messenger can achieve the same result with three C-Chain
contracts (`ServiceNodeRegistry`, `SwarmCoordinator`, `StorageCommitment`),
since the on-chain piece is just state bookkeeping. The heavy lifting
(network, crypto, storage) always happens off-chain via libp2p.

Activate SessionVM on a dedicated track-chain (Inpars pattern) **only** when
you need faster coordination than C-Chain block time, or you want messaging
traffic isolated from DeFi / settlement traffic on C-Chain.

### When NOT to run SessionVM

- Small-scale deployment → use C-Chain contracts
- Throughput of C-Chain is sufficient for your expected registration + uptime-challenge traffic
- You don't need stake-weighted accountability

### When to run SessionVM

- Inpars-style messaging-first deployment
- Messaging traffic would crowd out other C-Chain users
- You want a dedicated block cadence tuned for messenger coordination

SessionVM does NOT implement the messaging protocol itself; that lives in
`github.com/luxfi/session` as a pluggable library. SessionVM provides:

- Service-node registration + stake
- Swarm assignment (which nodes store which inboxes)
- Uptime challenges
- Storage commitments
- Epoch rotation

Precompile address nibble: `C=E` (see LP-129 Registry) — only wired in when
the track-chain that activates SessionVM hosts an EVM companion chain.

## Implementation

SessionVM is **one project, one place**:

```
github.com/luxfi/session/
├── vm/         # VM implementation (package vm)
├── plugin/     # Plugin binary (package main)
├── crypto/     # ML-KEM + ML-DSA + AEAD
├── messaging/  # Message routing
├── network/    # libp2p overlay
├── protocol/   # Session wire protocol
├── swarm/      # Swarm assignment
└── storage/    # Inbox storage
```

The plugin binary builds from `session/plugin/main.go` directly. It is NOT
in `chains/` — the Session project is self-contained and only loaded on
track-chains that activate it.

## Service Node Lifecycle

```go
type ServiceNode struct {
    NodeID          ids.NodeID
    PublicKey       []byte          // ML-DSA identity key
    EncryptionKey   []byte          // ML-KEM-768 transport key
    Stake           uint64          // Minimum 100 LUX
    SwarmID         uint32          // Assigned swarm
    Status          Status          // Active | Decommissioning | Retired
    RegisteredAt    uint64          // Block timestamp
    LastPingAt      uint64          // Block timestamp
    UptimeScore     uint32          // 0-10000 bps, rolling window
}
```

### Registration
1. Node submits `RegisterServiceNodeTx` with stake
2. Node bootstraps Session protocol daemon
3. Chain assigns SwarmID via deterministic sampling
4. Node announces itself to swarm peers

### Uptime Challenges
Every epoch (~1 hour), each service node must submit a challenge response
proving:
- It has the full swarm inbox state
- It is reachable from at least `min_peers` other nodes
- It has sufficient storage free

Nodes failing the challenge lose stake (0.5% per miss, up to 50% before
auto-decommission).

## Swarm Assignment

Swarms are groups of ~10 service nodes. Each inbox (derived from a recipient's
public key) maps to exactly one swarm via consistent hashing:

```
swarm_id = BLAKE3(recipient_pubkey) mod num_swarms
```

Messages for that recipient are stored on all nodes in the swarm
(replication factor ~10). This provides:
- Redundancy — any node in the swarm can serve the inbox
- Liveness — recipient can fetch from multiple nodes
- Privacy — no single node holds all messages

## Storage Commitments

Each service node periodically commits to the Merkle root of its swarm
state. Commitments go on-chain via `StorageCommitmentTx`. Mismatched
commitments within a swarm trigger a reconciliation protocol (off-chain)
and potential slashing of deviant nodes.

## Activation Scope

SessionVM is NOT part of the primary-network VM set (P / X / C).
It activates only on track-chains that explicitly opt in — principally
the **Inpars track-chain** for deployments running Lux Session messenger.

Networks that do not run Session messenger simply never load this VM.

## Relationship to Other Chains

| Chain / Registry | Relationship |
|------------------|--------------|
| P-chain | Service nodes stake LUX → P-chain tracks total bonded stake |
| I-chain | Recipient DIDs live on I-chain; SessionVM resolves DIDs for routing |
| K-chain | Transport keys are ML-KEM; key lifecycle managed by K-chain |

## Reference

| Resource | Location |
|----------|----------|
| Session VM + library | `github.com/luxfi/session/` |
| VM implementation | `github.com/luxfi/session/vm/` |
| Plugin binary | `github.com/luxfi/session/plugin/` |
| Session messenger spec | `github.com/luxfi/session/docs/` |
