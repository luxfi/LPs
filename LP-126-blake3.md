---
lp: 126
title: BLAKE3 Hash
tags: [evm, precompile, blake3, hash, merkle, kdf, xof]
description: BLAKE3 cryptographic hash with XOF, domain separation, Merkle tree, and KDF modes
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
---

# LP-126: BLAKE3 Hash

## Abstract

Implements BLAKE3 as an EVM precompile. BLAKE3 is 6-17x faster than SHA-3 and SHA-256 while maintaining full cryptographic security. Supports standard 256-bit and 512-bit hashing, extended output (XOF), domain-separated hashing, Merkle tree root computation, and key derivation. Used for high-throughput hashing in AI mining proofs, state commitments, and content addressing.

## Specification

### Address

`0x0500000000000000000000000000000000000004` -- Hashing range.

### Interface

Operation selector is the first byte of input.

```
0x01 Hash256:        data -> digest(32)
0x02 Hash512:        data -> digest(64)
0x03 HashXOF:        output_len(4) + data -> digest(output_len), max 1024 bytes
0x04 HashWithDomain: domain_len(1) + domain + data -> digest(32)
0x10 MerkleRoot:     leaf_count(2) + leaves(count*32) -> root(32), max 1024 leaves
0x20 DeriveKey:      context + key_material -> derived_key(32)
```

### Gas Schedule

| Operation | Base Gas | Per 32-byte Word |
|-----------|----------|-----------------|
| Hash256 | 100 | 3 |
| Hash512 | 150 | 3 |
| HashXOF | 200 | 3 (input) + 5 (output) |
| HashWithDomain | 150 | 3 |
| MerkleRoot | 500 | 100 per leaf |
| DeriveKey | 300 | -- |

Maximum input size: 1 MB. Maximum XOF output: 1,024 bytes. Maximum Merkle leaves: 1,024.

### Security Considerations

1. BLAKE3 provides 128-bit collision resistance and 256-bit preimage resistance.
2. Not post-quantum in the collision-resistance sense (Grover's reduces to ~128-bit preimage, ~64-bit collision). Sufficient for all practical purposes.
3. The Merkle tree mode uses BLAKE3's built-in tree hashing for correctness (not a naive hash-pair construction).
4. GPU acceleration via `luxfi/accel` for batch hashing.

## References

- J.P. Aumasson, J. O'Connor, S. Neves, Z. Wilcox-O'Hearn, [BLAKE3](https://github.com/BLAKE3-team/BLAKE3-specs/blob/master/blake3.pdf) (2020)
- Source: `github.com/luxfi/precompile/blake3/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
