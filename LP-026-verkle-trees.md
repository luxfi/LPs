---
lp: 026
title: Verkle Trees
tags: [verkle, state, proofs, light-client, ipa, pedersen]
description: Verkle tree state proofs for bandwidth-efficient light clients
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2022-04-01
requires:
  - lps-024 (State Sync)
references:
  - lp-1500 (Verkle Tree Migration)
---

# LP-026: Verkle Trees

## Abstract

Verkle trees replace Merkle Patricia Tries for Lux state storage. A Verkle tree uses vector commitments (Pedersen commitments with IPA proofs) instead of hash-based commitments, reducing proof sizes from O(k * log n) to O(k + log n) where k is the number of accessed keys and n is the tree size. This enables practical light client state verification with proofs under 1 KB for typical transactions.

## Specification

### Tree Structure

- **Branching factor**: 256 (one child per byte of the key path)
- **Key length**: 32 bytes (256 levels max, but typical depth is 3-4)
- **Internal nodes**: Pedersen commitment over child commitments using Banderwagon curve
- **Leaf nodes**: Pedersen commitment over `(key_suffix, value)` pairs, up to 256 values per leaf

### Commitment Scheme

Each internal node stores a Pedersen commitment:

```
C = sum(v_i * G_i) for i in 0..255
```

Where `v_i` is the child commitment (as a scalar) and `G_i` are fixed generators on the Banderwagon curve. The commitment is binding and hiding.

### IPA Proofs

State proofs use Inner Product Arguments (IPA):

1. Prover computes an opening proof for each accessed stem (key prefix)
2. Multiple openings are batched into a single multi-proof
3. Verifier checks the multi-proof against the root commitment in the block header

**Proof size**: ~600 bytes for a single key access, ~1 KB for a typical transaction touching 5-10 keys. Compared to Merkle proofs (~3-4 KB per key), this is a 5-10x reduction.

### Migration

Transition from Merkle Patricia Trie to Verkle tree:

1. **Overlay period**: new writes go to the Verkle tree, reads check Verkle first then fall back to MPT
2. **Background conversion**: a background process migrates MPT leaves to the Verkle tree
3. **Cutover**: once all state is migrated, MPT is pruned and the Verkle root becomes the canonical state root
4. **Duration**: estimated 2-4 weeks for full migration on mainnet

### Light Client Protocol

Light clients verify state by:

1. Downloading block headers (contains Verkle state root)
2. Requesting IPA proofs for specific keys from full nodes
3. Verifying proofs locally against the state root

No full state download required. A light client can verify any account balance, storage slot, or contract code with a single proof request.

## Security Considerations

1. **Trusted setup**: Pedersen commitments on Banderwagon require no trusted setup (unlike KZG). The generators are derived deterministically.
2. **Quantum resistance**: Pedersen commitments are not post-quantum secure. Future migration to lattice-based commitments is planned (LP-012).
3. **Migration safety**: the overlay period ensures no state is lost during transition. Both MPT and Verkle roots are committed in block headers until cutover.

## Reference

| Resource | Location |
|---|---|
| Verkle tree implementation | `github.com/luxfi/evm/trie/verkle/` |
| Banderwagon curve | `github.com/luxfi/evm/crypto/verkle/` |
| IPA prover/verifier | `github.com/luxfi/evm/crypto/ipa/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
