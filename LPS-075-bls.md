---
lps: 075
title: BLS Aggregate Signatures for Warp Messaging
tags: [bls, aggregate-signatures, warp, bls12-381, multisig]
description: BLS12-381 aggregate signatures for Warp message attestation
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2023-03-01
references:
  - lp-6022 (Warp Messaging)
  - lps-019 (Threshold MPC)
  - lps-015 (Validator Key Management)
---

# LPS-075: BLS Aggregate Signatures for Warp Messaging

## Abstract

Defines the BLS12-381 aggregate signature scheme used by Warp messaging (LP-6022) on Lux Network. Each validator holds a BLS signing key (separate from their staking key). Warp messages are signed by a quorum of validators, and the individual signatures are aggregated into a single BLS aggregate signature. On-chain verification costs constant gas regardless of signer count.

## Specification

### BLS12-381 Parameters

| Parameter | Value |
|-----------|-------|
| Curve | BLS12-381 |
| Public key size | 48 B (G1 compressed) |
| Signature size | 96 B (G2 compressed) |
| Aggregate signature size | 96 B (constant, regardless of signer count) |
| Security | 128-bit |

### Key Management

Each validator generates a BLS key pair during node initialization:
- Private key: 32-byte scalar.
- Public key: G1 point, registered on the P-Chain via `RegisterBLSKey` transaction.
- The BLS key is stored in the node's `signer.key` file alongside the staking TLS credentials.

### Signing Protocol

```
1. Warp message M is constructed (source chain, destination chain, payload).
2. Each validator V_i signs: sig_i = BLS.Sign(sk_i, M).
3. Aggregator collects t signatures (t >= quorum threshold).
4. Aggregate: agg_sig = BLS.Aggregate(sig_1, ..., sig_t).
5. Signer bitmap: bitfield indicating which validators signed.
6. Warp message envelope: (M, agg_sig, signer_bitmap).
```

### On-Chain Verification

The destination chain verifies the Warp message:

```
1. Reconstruct aggregate public key from signer_bitmap:
   agg_pk = BLS.AggregateKeys(pk_i for i in signer_bitmap)
2. Verify: BLS.Verify(agg_pk, M, agg_sig)
3. Check signer weight >= quorum (67% of total stake weight)
```

Gas cost: 115,000 (pairing check) + 2,000 per signer in bitmap.

### Rogue Key Protection

BLS aggregate signatures require proof-of-possession (PoP) to prevent rogue key attacks:
- Each validator provides a PoP: `BLS.Sign(sk_i, pk_i)` at registration time.
- The P-Chain verifies the PoP before accepting the BLS key.
- This ensures no validator can craft a key that cancels another's contribution.

## Security Considerations

1. BLS12-381 provides 128-bit classical security but is NOT post-quantum secure. Ringtail (LPS-073) provides the PQ fallback.
2. Nonce-free: BLS signing is deterministic. No nonce reuse vulnerability.
3. Aggregate verification is constant-time in signature count but linear in signer bitmap processing.
4. Signer bitmap compression reduces Warp message size when many validators participate.

## Reference

| Resource | Location |
|----------|----------|
| BLS implementation | `github.com/luxfi/crypto/bls/` |
| Warp messaging | `github.com/luxfi/evm/warp/` |
| P-Chain BLS registration | `github.com/luxfi/node/vms/platformvm/txs/register_bls_key_tx.go` |

## Copyright

Copyright (C) 2023-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
