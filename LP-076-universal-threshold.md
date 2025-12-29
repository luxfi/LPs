---
lp: 076
title: Unified Threshold Cryptography Framework
tags: [threshold, t-of-n, dkg, resharing, secret-sharing, mpc]
description: Unified t-of-n framework for all threshold operations on Lux Network
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2021-06-01
references:
  - lps-019 (Threshold MPC)
  - lps-073 (Ringtail)
  - lps-077 (Linear Secret Sharing)
  - lps-066 (Threshold FHE)
---

# LP-076: Unified Threshold Cryptography Framework

## Abstract

Defines a unified framework for all threshold cryptographic operations on Lux Network. Every threshold scheme (FROST, CGGMP21, Ringtail, threshold FHE, BLS threshold) shares a common DKG interface, resharing protocol (LSS), and key lifecycle. The framework provides a single Go/Rust API surface that abstracts over the underlying scheme.

## Specification

### Architecture

```
ThresholdManager
  |-- DKG (scheme-agnostic ceremony orchestration)
  |-- Reshare (LSS-based, works for all schemes)
  |-- Sign (dispatches to FROST/CGGMP21/Ringtail based on key type)
  |-- Decrypt (dispatches to threshold FHE/threshold ElGamal)
```

### DKG Interface

```go
type DKG interface {
    Init(participants []NodeID, threshold int) (*Session, error)
    Round1() ([]byte, error)    // commitment
    Round2(msgs [][]byte) ([]byte, error)  // share distribution
    Finalize(msgs [][]byte) (*KeyShare, error)
}
```

All schemes implement this interface. The ThresholdManager orchestrates rounds via the MPC coordinator.

### Supported Schemes

| Scheme | DKG | Signing | Reshare | Use Case |
|--------|-----|---------|---------|----------|
| FROST | Pedersen | 2-round Schnorr | LSS | Ed25519 chains |
| CGGMP21 | Paillier | Pre-sign + sign | LSS | secp256k1 chains |
| Ringtail | Lattice | 2-round lattice | LSS | Post-quantum |
| BLS threshold | Feldman VSS | Single-round | LSS | Warp attestation |
| Threshold FHE | Lattice DKG | N/A (decrypt only) | LSS | Confidential compute |

### Key Lifecycle

```
1. Genesis DKG -> KeyShare created, group public key published
2. Active -> sign/decrypt operations using shares
3. Reshare -> LSS resharing to new group, old shares invalidated
4. Retire -> key deactivated, shares securely deleted from HSM
```

### Resharing

All schemes use the LSS resharing protocol (LP-077). The common property: secret shares are elements of a finite field, and Lagrange interpolation works regardless of the higher-level scheme.

## Security Considerations

1. Scheme-specific security properties (identifiable aborts, PQ resistance) are preserved through the unified interface.
2. DKG sessions are ephemeral. Session state is held in memory only, never persisted to disk.
3. The framework enforces minimum threshold: t >= n/2 + 1 for safety. Lower thresholds require explicit governance override.
4. Cross-scheme key reuse is prohibited. A FROST key share cannot be used for CGGMP21 signing.

## Reference

| Resource | Location |
|----------|----------|
| ThresholdManager | `github.com/luxfi/mpc/threshold/` |
| DKG interface | `github.com/luxfi/mpc/dkg/` |
| LSS resharing | `github.com/luxfi/mpc/lss/` |

## Copyright

Copyright (C) 2021-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
