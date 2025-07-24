---
lp: 4
title: Quantum-Resistant Cryptography Integration in Lux
description: Proposes integrating quantum-resistant cryptographic primitives into the Lux protocol to future-proof the network against quantum computer attacks.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-27
---

## Abstract

LP-4 proposes integrating quantum-resistant cryptographic primitives into the Lux protocol to future-proof the network against quantum computer attacks. The motivation stems from the well-recognized “quantum threat” to blockchain security: core algorithms like ECDSA (used for digital signatures) and ECDH are vulnerable to Shor’s algorithm, meaning a sufficiently powerful quantum computer could break private keys and forge signatures. While such quantum computers are not yet available, Lux adopts a proactive stance. This proposal evaluates and selects post-quantum (PQ) algorithms for crucial components such as transaction signatures and hashing. It highlights NIST’s recent standardization efforts, noting that the first suite of PQ algorithms (finalized in 2022) are based on structured lattices and hash-based cryptography. In particular, Lux plans to support a lattice-based signature scheme (e.g., CRYSTALS-Dilithium or a variant) for validator authentication and user wallets, as these schemes rely on mathematical problems (lattice Short Vector problems) believed to be resistant to quantum attacks. Additionally, hash-based signatures like XMSS or SPHINCS+ are considered for one-time or few-time signatures, given their minimal security assumptions (collision-resistant hashes) and existing standardization (XMSS is specified in RFC 8391). LP-4 details a transition plan whereby Lux accounts can upgrade from classical ECDSA/secp256k1 keys to dual-key addresses that include a PQ public key. This ensures backward compatibility (similar to how Ethereum is exploring introducing Lamport or Winternitz one-time signatures for account security). The proposal also addresses performance considerations: PQ signatures are generally larger or slower to verify than ECDSA, which could impact block size and verification time. To mitigate this, Lux may leverage hybrid approaches (e.g., using efficient lattice signatures and optimizing verification via batching or elliptic-curve accelerators, and perhaps initially offering PQ cryptography on an opt-in basis for high-value accounts). By citing projects like the Quantum Resistant Ledger (QRL), which pioneered hash-based signatures for blockchain, and by referencing Ethereum’s roadmap for quantum safety (Ethereum 3.0 plans to introduce zk-STARKs and PQ signatures), LP-4 underscores that Lux’s adoption of PQ crypto is aligned with industry research and is a crucial investment in long-term security. In summary, this proposal ensures that core operations in Lux (signing blocks, validating transactions, network handshakes) will remain secure even in the post-quantum era, maintaining trust in the network’s integrity against the next generation of adversaries.

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

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).