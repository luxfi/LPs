---
lp: 5
title: Lux Quantum-Safe Wallets and Multisig Standard
description: Focuses on the design of Lux’s quantum-safe wallet infrastructure, including a new multisignature (multisig) standard that remains secure against quantum adversaries.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
requires: 4
type: Standards Track
category: Core
created: 2025-01-28
activation:
  flag: lp5-quantum-safe-wallets
  hfName: ""
  activationHeight: "0"
---

> **See also**: [LP-4: Quantum-Resistant Cryptography Integration in Lux](./lp-4-quantum-resistant-cryptography-integration-in-lux.md)

## Abstract

## Activation

| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Flag string        | `lp5-quantum-safe-wallets`                      |
| Default in code    | N/A                                             |
| Deployment branch  | N/A                                             |
| Roll-out criteria  | N/A                                             |
| Back-off plan      | N/A                                             |

LP-5 focuses on the design of Lux’s quantum-safe wallet infrastructure, including a new multisignature (multisig) standard that remains secure against quantum adversaries. As Lux transitions its core signatures to post-quantum algorithms (per LP-4), user-facing wallet technology must follow suit. This proposal introduces support for hash-based and lattice-based signature schemes in Lux wallets. It specifies that a user’s Lux address can be associated with a quantum-resistant public key, such as an XMSS or Dilithium public key, instead of or in addition to the traditional elliptic curve key. A major component is the Lux Safe, a quantum-safe multisig wallet service, which LP-5 formalizes at the protocol level. In a Lux Safe multisig account, multiple parties each hold a share of a post-quantum key or have independent PQ keys, and the account requires a threshold of signatures on any transaction. The use of threshold signing is carefully designed to be compatible with PQ algorithms. For instance, if using lattice-based signatures, the proposal outlines how to aggregate partial signatures or how to perform a secure distributed key generation such that no single device ever holds the full private key (applying MPC techniques akin to those used in threshold ECDSA, but now in a lattice context). Recognizing the novelty of threshold PQ signatures, LP-5 references ongoing research in this arena – for example, experiments combining Falcon (lattice signature) with threshold schemes, and stateful hash-based multisigs where each cosigner uses a distinct XMSS tree for each approval. The Lux Safe design takes inspiration from conventional multisigs (like Bitcoin’s M-of-N script and Ethereum’s smart contract wallets) but builds in quantum resilience. It also emphasizes usability and security: for instance, using a hierarchical derivation of many one-time hash-based keys under the hood so that the wallet can generate a new PQ one-time address for each transaction (mitigating reuse i... The proposal cites the IETF’s XMSS standard (RFC 8391) as evidence that hash-based signatures are mature enough for production use. It also references that Lux Safe is already implemented as a product in the ecosystem, highlighting it as “our quantum-safe multisig wallet”, to be integrated at protocol level. Through LP-5, Lux aims to provide users and institutions with high assurance that even if large-scale quantum computers emerge, funds secured in Lux multisig wallets (which might protect exchange reserves or DAO treasuries) will remain safe. This enhances Lux’s appeal for “quantum-resistant custody.” In summary, LP-5 extends Lux’s security to the user and application layer by defining standards for quantum-resistant key management and multisignature transactions, aligning with global efforts (by NIST and IETF) to make cryptocurrency systems ready for the quantum age.

## Motivation

[TODO]

## Specification

[TODO]

## Rationale

[TODO]

## Backwards Compatibility

[TODO]

## Security Considerations

[TODO]

## Implementation

### Lux Safe Multisig Wallet

**Location**: `~/work/lux/safe/`
**GitHub**: [`github.com/luxfi/safe/tree/main`](https://github.com/luxfi/safe/tree/main)

**Quantum-Safe Wallet Components**:
- [`app/`](https://github.com/luxfi/safe/tree/main/app) - Next.js wallet application (React, TypeScript)
- [`react/`](https://github.com/luxfi/safe/tree/main/react) - Reusable React components for Safe interface
- [`contracts/`](https://github.com/luxfi/safe/tree/main/contracts) - Smart contract module (Solidity)

**Key Features**:
- M-of-N multisig with post-quantum key support
- Hierarchical deterministic (HD) wallet derivation
- One-time signature capability (XMSS/hash-based)
- Zero-knowledge proof integration for privacy

**Testing & Documentation**:
```bash
cd ~/work/lux/safe/app
npm install && npm test
```

### Wallet CLI and Key Management

**Location**: `~/work/lux/cli/cmd/`
**GitHub**: [`github.com/luxfi/cli/tree/main/cmd`](https://github.com/luxfi/cli/tree/main/cmd)

**Quantum-Safe Features**:
- Post-quantum key generation (ML-DSA, SLH-DSA, ML-KEM support)
- Hybrid key management (classical + post-quantum)
- Secure key storage and recovery
- Transaction signing with quantum-resistant algorithms

**Testing**:
```bash
cd ~/work/lux/cli
make test  # Run full CLI test suite
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).