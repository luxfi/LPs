---
lps: 060
title: W3C DID Method Specification
tags: [did, identity, w3c, decentralized-identity, verifiable-credentials]
description: W3C DID method for Lux Network with on-chain DID documents and resolver
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Identity
created: 2020-03-01
references:
  - W3C DID Core 1.0
  - W3C Verifiable Credentials Data Model 2.0
  - lps-061 (IAM Architecture)
---

# LPS-060: W3C DID Method Specification

## Abstract

Defines the `did:lux` method for Lux Network. A DID document is stored on-chain as a compact binary record mapped by `keccak256(did)`. The resolver is a read-only EVM precompile at `0x0060` that returns the DID document given a DID string. DID creation, update, and deactivation are transactions against the `DIDRegistry` contract on each EVM chain.

## Specification

### DID Syntax

```
did:lux:<chain-prefix>:<hex-address>
```

Examples: `did:lux:c:0xabc...def`, `did:lux:zoo:0x123...789`.

### DID Document

Stored in `DIDRegistry` contract. Fields:

| Field | Type | Description |
|-------|------|-------------|
| controller | address | Account authorized to update the document |
| authKeys | bytes[] | Authentication public keys (Ed25519, secp256k1, ML-DSA) |
| serviceEndpoints | string[] | Service endpoint URIs |
| created | uint64 | Creation timestamp |
| updated | uint64 | Last update timestamp |
| deactivated | bool | Deactivation flag |

### Operations

- **Create**: `registry.createDID(authKeys, serviceEndpoints)` -- sender becomes controller.
- **Update**: `registry.updateDID(did, authKeys, serviceEndpoints)` -- controller only.
- **Deactivate**: `registry.deactivateDID(did)` -- controller only, irreversible.
- **Resolve**: Precompile `0x0060` or `registry.resolve(did)` -- returns DID document.

### Cross-Chain Resolution

Warp messaging (LP-6022) enables resolving a DID registered on one chain from another. The resolver precompile queries the origin chain via Warp if the DID prefix does not match the local chain.

## Security Considerations

1. Controller key rotation must be atomic -- old and new keys are never simultaneously valid.
2. Deactivation is permanent. A deactivated DID cannot be reactivated.
3. DID documents do not store private keys. Only public keys and service endpoints.

## Reference

| Resource | Location |
|----------|----------|
| DIDRegistry contract | `github.com/luxfi/standard/contracts/identity/DIDRegistry.sol` |
| DID resolver precompile | `github.com/luxfi/evm/precompile/contracts/did.go` |
| W3C DID Core 1.0 | https://www.w3.org/TR/did-core/ |

## Copyright

Copyright (C) 2020-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
