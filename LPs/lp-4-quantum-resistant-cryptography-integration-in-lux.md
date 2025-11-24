---
lp: 4
title: Quantum-Resistant Cryptography Integration in Lux
description: Proposes integrating quantum-resistant cryptographic primitives into the Lux protocol to future-proof the network against quantum computer attacks.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-27
activation:
  flag: lp4-quantum-resistance
  hfName: ""
  activationHeight: "0"
---

> **See also**: [LP-5: Lux Quantum-Safe Wallets and Multisig Standard](./lp-5.md)

## Abstract

## Activation

| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Flag string        | `lp4-quantum-resistance`                        |
| Default in code    | N/A                                             |
| Deployment branch  | N/A                                             |
| Roll-out criteria  | N/A                                             |
| Back-off plan      | N/A                                             |

LP-4 proposes integrating quantum-resistant cryptographic primitives into the Lux protocol to future-proof the network against quantum computer attacks. The motivation stems from the well-recognized “quantum threat” to blockchain security: core algorithms like ECDSA (used for digital signatures) and ECDH are vulnerable to Shor’s algorithm, meaning a sufficiently powerful quantum computer could break private keys and forge signatures. While such quantum computers are not yet available, Lux adopts a proactive stance. This proposal evaluates and selects post-quantum (PQ) algorithms for crucial components such as transaction signatures and hashing. It highlights NIST’s recent standardization efforts, noting that the first suite of PQ algorithms (finalized in 2022) are based on structured lattices and hash-based cryptography. In particular, Lux plans to support a lattice-based signature scheme (e.g., CRYSTALS-Dilithium or a variant) for validator authentication and user wallets, as these schemes rely on mathematical problems (lattice Short Vector problems) believed to be resistant to quantum attacks. Additionally, hash-based signatures like XMSS or SPHINCS+ are considered for one-time or few-time signatures, given their minimal security assumptions (collision-resistant hashes) and existing standardization (XMSS is specified in RFC 8391). LP-4 details a transition plan whereby Lux accounts can upgrade from classical ECDSA/secp256k1 keys to dual-key addresses that include a PQ public key. This ensures backward compatibility (similar to how Ethereum is exploring introducing Lamport or Winternitz one-time signatures for account security). The proposal also addresses performance considerations: PQ signatures are generally larger or slower to verify than ECDSA, which could impact block size and verification time. To mitigate this, Lux may leverage hybrid approaches (e.g., using efficient lattice signatures and optimizing verification via batching or elliptic-curve accelerators...

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

### ML-DSA Post-Quantum Signatures (FIPS 204)

**Location**: `~/work/lux/crypto/mldsa/`
**GitHub**: [`github.com/luxfi/node/tree/main/crypto/mldsa`](https://github.com/luxfi/node/tree/main/crypto/mldsa)

**Key Files**:
- [`mldsa.go`](https://github.com/luxfi/node/blob/main/crypto/mldsa/mldsa.go) - ML-DSA-65 signature implementation (7.7 KB)
- [`mldsa_test.go`](https://github.com/luxfi/node/blob/main/crypto/mldsa/mldsa_test.go) - Comprehensive test suite with 11 test cases (6.2 KB)

**Algorithm**: ML-DSA-65 (Dilithium, NIST Level 3)
- Public Key Size: 1,952 bytes
- Signature Size: 3,309 bytes
- Quantum Security: ~192 bits

**Testing**:
```bash
cd ~/work/lux/crypto/mldsa
go test -v ./...
```

### EVM ML-DSA Precompile

**Location**: `~/work/lux/evm/precompile/contracts/mldsa/`
**GitHub**: [`github.com/luxfi/evm/tree/main/precompile/contracts/mldsa`](https://github.com/luxfi/evm/tree/main/precompile/contracts/mldsa)

**Key Files**:
- [`contract.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/contract.go) - Precompile contract (4.3 KB)
- [`contract_test.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/contract_test.go) - Precompile tests (7.4 KB)
- [`IMLDSA.sol`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/IMLDSA.sol) - Solidity interface (7.1 KB)

**Precompile Address**: `0x0200000000000000000000000000000000000006`
**Gas Cost**: 100,000 base + 10 per message byte

**Testing**:
```bash
cd ~/work/lux/evm/precompile/contracts/mldsa
go test -v ./...
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).