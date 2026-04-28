---
lp: 044
title: Threshold VM
tags: [threshold, t-chain, mpc, fhe, signing-sessions, vm]
description: MPC-as-a-service — threshold signing sessions and threshold FHE for the network
author: Lux Industries
status: Draft
type: Standards Track
category: Virtual Machines
created: 2026-04-13
requires:
  - lp-019 (Threshold MPC)
  - lp-020 (Quasar Consensus)
  - lp-043 (Key VM)
---

# LP-044: Threshold VM

## Abstract

The Threshold VM runs the T-chain, a dedicated chain for **executing
threshold cryptographic protocols** — signing sessions, threshold FHE
operations, session management, quotas. It is the hot path. The K-chain
(Key VM, LP-043) is the cold path that owns keys; the T-chain borrows them
to sign.

Precompile address nibble: `C=7` (see LP-129 Registry).

## Scope

T-chain supports these threshold signing protocols:

| Protocol | Scheme | Use case |
|----------|--------|----------|
| CGGMP21 | ECDSA secp256k1 | Bitcoin, Ethereum L1 |
| FROST | Ed25519 Schnorr | Solana, TON, Cardano |
| BLS | BLS12-381 | Aggregate consensus sigs |
| Ringtail | Lattice (Raccoon-style) | PQ consensus certificates |
| LSS | Universal lattice framework | Experimental |
| Threshold ML-DSA | FIPS 204 + threshold (LP-xxx) | PQ wallets, drop-in ML-DSA |

T-chain also hosts **threshold FHE**: threshold decryption of FHE ciphertexts
that were encrypted under a T-chain-held FHE key. Used by Z-chain for
encrypted rollup state disclosure.

## Session Lifecycle

```go
type SignSession struct {
    ID              [32]byte
    KeyRecordID     [32]byte    // Reference to K-chain KeyRecord
    Protocol        Protocol     // CGGMP21 | FROST | BLS | ...
    Message         []byte
    Committee       []ids.NodeID
    Status          Status       // Pending | InProgress | Complete | Failed | Expired
    StartedAt       uint64       // Block timestamp
    ExpiresAt       uint64       // Block timestamp + SignTimeout
    Signatures      map[ids.NodeID][]byte  // Partial sigs
    Result          []byte       // Combined signature (when Complete)
}
```

Sessions run for at most `SignTimeout` (default 5 min). Expired sessions
release their reserved committee seats and are marked `Failed`.

## Committee Selection

For each session, T-chain samples a committee from the validators that hold
a share of the referenced key (as recorded by K-chain).

Committee size rules:

- Small threshold (T ≤ 6): full group signs — use Threshold ML-DSA, FROST
- Medium (T in [7, 32]): deterministic sampling with VRF-based unbiasable
  selection
- Large (T > 32): **SHOULD NOT** use a single session. Use hierarchical
  quorum certs (LP-045).

See LP-045 for why thousand-validator monolithic sessions are the wrong shape.

## FHE Subsystem

T-chain hosts:

- Threshold FHE decryption (parties jointly decrypt without revealing plaintext
  to any single party)
- FHE parameter registry (network-wide CRS)
- FHE operation quotas (bounded compute per caller)

Threshold FHE integrates with Z-chain (ZK rollups) for **private disclosure
of encrypted state**: Z-chain commits to a ciphertext on-chain, authorized
parties request threshold decryption via T-chain, result is revealed only
once quorum is reached.

## Boundary with K-chain

| Operation | Chain | Rationale |
|-----------|-------|-----------|
| `CreateKey(T, N, scheme)` | K-chain | State: key lifecycle |
| `SignMessage(keyID, msg)` | T-chain | Protocol: session execution |
| `RotateKey(keyID)` | K-chain | State: cold path |
| `DecryptFHE(ciphertextID)` | T-chain | Protocol: threshold decrypt session |

## Reference

| Resource | Location |
|----------|----------|
| Threshold VM | `github.com/luxfi/chains/thresholdvm/` |
| Key VM | `github.com/luxfi/chains/keyvm/` |
| Threshold library | `github.com/luxfi/threshold/` |
| Threshold ML-DSA | `github.com/luxfi/threshold/protocols/mldsa/` |
| Hierarchical QC | LP-045 |
