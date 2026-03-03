---
lp: 043
title: Key VM
tags: [key, k-chain, kms, pq-key-management, ml-kem, ml-dsa, vm]
description: Distributed key management chain — key lifecycle for the whole network
author: Lux Industries
status: Draft
type: Standards Track
category: Virtual Machines
created: 2026-04-13
requires:
  - lp-019 (Threshold MPC)
  - lp-020 (Quasar Consensus)
---

# LP-043: Key VM

## Abstract

The Key VM runs the K-chain, a dedicated chain for the **key lifecycle**:
distributed key generation, share distribution, encryption at rest, rotation,
and retirement. It is the cold path of the network's cryptographic state.
The T-chain (Threshold VM) is the hot path that uses these keys for actual
signing.

Precompile address nibble: `C=9` (see LP-129 Registry).

## Scope — what K-chain owns

- Key creation across all supported schemes (ML-KEM, ML-DSA, BLS,
  secp256k1, Ed25519)
- Distributed key generation (DKG) orchestration — feeds into T-chain sessions
- Key share encryption using per-validator ML-KEM transport keys
- Key retirement and re-share on validator set changes
- Key-usage audit log (every signing session references the key record)

## Scope — what K-chain does NOT own

- Signing session execution (T-chain / Threshold VM)
- Identity keys / DID material (I-chain / Identity VM)
- Validator staking keys (P-chain / Platform VM)

## Separation from T-chain

| Concern | Chain | VM |
|---------|-------|----|
| "create a 3-of-5 key" | K-chain | keyvm |
| "sign msg with existing key" | T-chain | thresholdvm |
| "rotate the share held by validator X" | K-chain | keyvm |
| "run a CGGMP21 session now" | T-chain | thresholdvm |

The split is driven by different security properties:

- **K-chain is cold path**: infrequent operations, high security, long-term state.
- **T-chain is hot path**: many short-lived sessions, availability matters.

Merging them forces hot-path availability guarantees on cold-path state,
which is both expensive and wrong.

## Key Record

```go
type KeyRecord struct {
    ID              [32]byte
    Scheme          KeyScheme       // MLKEM | MLDSA | BLS | SECP256K1 | ED25519
    Threshold       Threshold       // (T, N) tuple, or (1,1) for single-party
    PublicKey       []byte
    ShareCommitments [][]byte        // One commitment per participating validator
    CreatedAt       uint64          // Block timestamp
    Status          Status          // Active | Rotating | Retired
    Policy          UsagePolicy     // Max signings per epoch, allowed contexts
}
```

## DKG Flow

1. K-chain accepts a `CreateKeyTx` from an authorized principal
2. K-chain selects the committee (see LP-044 Threshold VM for committee selection)
3. Committee runs DKG off-chain, publishes share commitments on K-chain
4. K-chain verifies commitments, creates `KeyRecord`, sets Status=Active
5. Key becomes available for use via T-chain signing sessions

## Rotation

Rotation is a fresh DKG that preserves the public key but redistributes shares.
Triggered by:

- Validator set change (automatic on epoch boundary)
- Policy violation (detected by T-chain surveillance)
- Manual rotation request (authorized principal)

## Audit

Every `SignSession` on T-chain references a `KeyRecord.ID`. K-chain surfaces
a queryable audit log: which keys signed what, when, at whose request. This
is NOT the hot path — callers read from T-chain for real-time sessions;
K-chain is the archive.

## Reference

| Resource | Location |
|----------|----------|
| Key VM | `github.com/luxfi/chains/keyvm/` |
| Threshold VM | `github.com/luxfi/chains/thresholdvm/` |
| DKG primitives | `github.com/luxfi/threshold/protocols/{mldsa,frost,cggmp21,bls,ringtail}` |
