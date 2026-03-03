---
lp: 069
title: Poseidon2 ZK-Friendly Hash Precompile
tags: [poseidon2, hash, zk, precompile, stark, privacy]
description: EVM precompile for Poseidon2 hash function optimized for ZK circuits
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2025-01-01
references:
  - lps-063 (Z-Chain UTXO Privacy)
  - lps-064 (Privacy Pool)
  - lps-078 (EVM Precompiles)
---

# LP-069: Poseidon2 ZK-Friendly Hash Precompile

## Abstract

Defines an EVM precompile at address `0x0069` for the Poseidon2 hash function. Poseidon2 is a ZK-friendly algebraic hash designed for efficient proof generation in STARK and SNARK circuits. The precompile accepts variable-length input and returns a 256-bit digest. In-circuit cost is approximately 200x cheaper than Keccak-256, making it the standard hash for all ZK operations on Lux.

## Specification

### Precompile Interface

Address: `0x0069`

```
Input:  bytes (arbitrary length, padded to field element boundaries)
Output: bytes32 (Poseidon2 digest)
Gas:    1,000 base + 500 per 32-byte input block
```

### Parameters

| Parameter | Value |
|-----------|-------|
| Field | BN254 scalar field (p = 21888242871839275222246405745257275088548364400416034343698204186575808495617) |
| Width | 3 (state size = 3 field elements) |
| Rounds | 8 full + 56 partial |
| S-box | x^5 |
| Security | 128-bit |

### Hashing Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Hash | Single output from arbitrary input | Commitment schemes |
| Compress | Two field elements to one | Merkle tree internal nodes |
| Sponge | Absorb/squeeze for arbitrary I/O | Domain separation, longer hashes |

### Merkle Tree

The standard Poseidon2 Merkle tree used by Z-Chain (LP-063) and ShieldedPool (LP-064):
- Leaf: `Poseidon2(value || pubkey || blinding)`
- Internal node: `Poseidon2.compress(left || right)`
- Depth: 32 (supports 2^32 leaves)
- Empty leaf: `0` (zero hash)

### Benchmarks

| Operation | Gas (precompile) | STARK constraint count |
|-----------|-----------------|----------------------|
| Single hash | 1,500 | 312 |
| Merkle proof (depth 32) | 48,000 | 9,984 |
| Keccak-256 (comparison) | 30 (native) | 62,000 (in circuit) |

The 200x in-circuit advantage over Keccak-256 is why Poseidon2 is mandatory for all ZK operations.

## Security Considerations

1. Poseidon2 security relies on the hardness of the Groebner basis problem over the chosen field.
2. The S-box degree (x^5) provides algebraic resistance against interpolation and GCD attacks.
3. Round constants are derived deterministically from the field characteristic (nothing-up-my-sleeve).
4. Not a drop-in replacement for Keccak-256 outside of ZK contexts. Use Keccak for general hashing.

## Reference

| Resource | Location |
|----------|----------|
| Poseidon2 precompile | `github.com/luxfi/evm/precompile/contracts/poseidon2.go` |
| Poseidon2 Rust library | `github.com/luxfi/crypto/poseidon2/` |
| Poseidon2 paper | Grassi et al., "Poseidon2: A New Hash Function for Zero-Knowledge Proofs" (2023) |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
