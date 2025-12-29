---
lps: 063
title: Z-Chain UTXO Privacy
tags: [privacy, zk, utxo, poseidon2, stark, nullifier, shielded]
description: UTXO-based privacy chain with Poseidon2 hashing and STARK proofs
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2021-08-01
references:
  - lps-069 (Poseidon2 Hash Precompile)
  - lps-064 (Privacy Pool)
  - lps-012 (Post-Quantum Cryptography)
---

# LPS-063: Z-Chain UTXO Privacy

## Abstract

Defines the Z-Chain, a UTXO-based privacy chain on Lux Network. Transactions use Poseidon2 commitment hashes and STARK proofs to hide sender, receiver, and amount. Each UTXO is a Poseidon2 hash of (value, owner_pubkey, blinding_factor). Spending requires a STARK proof of knowledge of the preimage and a valid nullifier to prevent double-spending.

## Specification

### UTXO Model

Each unspent output is a leaf in a Poseidon2 Merkle tree:

```
commitment = Poseidon2(value || owner_pubkey || blinding_factor)
```

The Merkle tree root is stored on-chain. Individual commitments reveal nothing about value or owner.

### Transaction Structure

| Field | Description |
|-------|-------------|
| nullifiers[] | Poseidon2 hash of spent input commitments (prevents double-spend) |
| commitments[] | New output commitments |
| proof | STARK proof of validity |
| root | Merkle root at time of proof generation |

### STARK Circuit

The prover demonstrates (without revealing inputs):
1. Each nullifier corresponds to a commitment in the Merkle tree.
2. The prover knows the preimage (value, owner_pubkey, blinding_factor) for each input.
3. Sum of input values equals sum of output values plus fee.
4. Each output commitment is correctly formed.

STARK proofs are used instead of SNARKs for transparency (no trusted setup) and post-quantum resistance.

### Nullifier Tracking

A nullifier set is maintained on-chain. Each nullifier can only appear once. Submitting a duplicate nullifier reverts the transaction. The nullifier is computed as:

```
nullifier = Poseidon2(commitment || spending_key)
```

### Performance

| Metric | Value |
|--------|-------|
| Proof generation (2-in, 2-out) | 1.2s |
| Proof verification (on-chain) | 180,000 gas |
| Merkle tree depth | 32 (supports 4B UTXOs) |
| Nullifier set | append-only sparse Merkle tree |

## Security Considerations

1. Blinding factors must be cryptographically random. Reuse leaks value correlation.
2. The Merkle root used in a proof must be recent (within 256 blocks) to limit timing attacks.
3. STARK proofs provide 128-bit security with post-quantum resistance.
4. No trusted setup required -- the system is transparent.

## Reference

| Resource | Location |
|----------|----------|
| Z-Chain VM | `github.com/luxfi/zvm/` |
| Poseidon2 implementation | `github.com/luxfi/crypto/poseidon2/` |
| STARK prover | `github.com/luxfi/crypto/stark/` |

## Copyright

Copyright (C) 2021-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
