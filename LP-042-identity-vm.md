---
lp: 042
title: Identity VM
tags: [identity, i-chain, did, vc, names, domains, vm]
description: Unified identity chain — DIDs, verifiable credentials, names, and domains
author: Lux Industries
status: Draft
type: Standards Track
category: Virtual Machines
created: 2026-04-13
requires:
  - lp-020 (Quasar Consensus)
  - lp-021 (Warp Messaging)
---

# LP-042: Identity VM

## Abstract

The Identity VM runs the I-chain, a dedicated chain for on-chain identity
primitives: **decentralized identifiers (DIDs)**, **verifiable credentials (VCs)**,
**human-readable names**, and **domains**. One chain, one canonical namespace,
one identity resolver.

Precompile address nibble: `C=D` (see LP-129 Registry).

## Scope

I-chain handles:

- DID registry (did:lux:* method) per W3C DID Core
- Verifiable Credential issuance, storage, revocation (W3C VC Data Model)
- Zero-knowledge credential presentations (selective disclosure)
- Human-readable names (username → DID resolution)
- Domain names (e.g., `alice.lux`) with TLS-style ownership proofs
- Trusted issuer registry with permissioning

I-chain does NOT handle:

- Authentication sessions (SessionVM, activated on messaging track-chains)
- Validator keys (K-chain / Key VM)
- Cryptographic key material (K-chain)

## DID Method

```
did:lux:<identifier>

where <identifier> ::= {Base58Check(pubkey)} | {human-readable name}
```

### DID Document

```go
type Identity struct {
    DID         string
    PublicKey   []byte
    Controllers []ids.ID           // Identities that can rotate this DID
    Services    []ServiceEndpoint  // Associated service endpoints
    Names       []string           // Human-readable names owned
    Domains     []string           // Domain names owned
    Created     time.Time
    Updated     time.Time
    Metadata    map[string]string
}
```

## Verifiable Credentials

Credentials follow the W3C VC Data Model with PQ-safe signatures (ML-DSA by default).

```go
type Credential struct {
    ID              string
    Type            []string   // e.g., ["VerifiableCredential", "KYCCredential"]
    Issuer          string     // DID of issuer
    Subject         string     // DID of subject
    IssuedAt        time.Time
    ExpiresAt       time.Time
    Claims          map[string]interface{}
    Proof           []byte     // ML-DSA signature by issuer
    RevocationListID string    // For revocation checks
}
```

Revocation is via on-chain revocation lists (W3C Status List 2021).

## Names + Domains

- **Names**: first-come-first-served, tied to a DID controller. Registration
  requires ≥ 10 LUX burn to prevent squatting.
- **Domains**: TLS/DNS integration via on-chain ownership proof (DNSSEC +
  delegated zone commitment). Domain owners can attach DIDs.

Names and domains are both TLA resolvable via a single RPC:

```
lux.identity.resolve(name=”alice”) → did:lux:… + public key + services
lux.identity.resolveDomain(domain=”alice.lux”) → did:lux:… + public key + services
```

## ZK Presentations

Selective disclosure via ZK proofs against I-chain-issued credentials.
The prover constructs a proof that "I hold a valid credential of type T
from issuer DID X" without revealing the credential contents. Verification
uses the Groth16/PLONK precompiles (LP-137–144).

## Precompile Integration

C-Chain contracts access I-chain state via precompiles at `0x…D00-0xD9F`:

- `0x…D00`: resolveDID(name) → pubkey
- `0x…D01`: verifyVC(credential, revocationProof) → bool
- `0x…D02`: verifyPresentation(proof, issuerDID, schemaHash) → bool

## Reference

| Resource | Location |
|----------|----------|
| Identity VM | `github.com/luxfi/chains/identityvm/` |
| DID spec | W3C DID Core 1.0 |
| VC spec | W3C VC Data Model 2.0 |
| Revocation | W3C Status List 2021 |
