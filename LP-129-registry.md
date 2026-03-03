---
lp: 129
title: Precompile Registry
tags: [evm, precompile, registry, discovery]
description: On-chain precompile discovery and address scheme documentation
author: Lux Core Team
status: Final
type: Standards Track
category: Infrastructure
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
---

# LP-129: Precompile Registry

## Abstract

Documents the Lux precompile address scheme and provides an on-chain registry for precompile discovery. Contracts can query the registry to determine which precompiles are available, their addresses, and supported operations. The address scheme encodes the LP number, chain slot, and function index into the trailing bytes of the 20-byte EVM address.

## Specification

### Address Scheme

All Lux-native precompiles use trailing-significant 20-byte addresses:

```
Format: 0x0000000000000000000000000000000000PCII

P = Family page (4 bits, aligned with LP numbering)
C = Chain slot (4 bits)
II = Item/function (8 bits, 256 items per family per chain)
```

**Family pages (P nibble):**

| P | LP Range | Family |
|---|----------|--------|
| 2 | LP-2xxx | PQ Identity (ML-DSA, ML-KEM, SLH-DSA, Ringtail, X-Wing) |
| 3 | LP-3xxx | EVM/Crypto (Ed25519, AI, Attestation, Quasar) |
| 4 | LP-4xxx | Privacy/ZK |
| 5 | LP-5xxx | Threshold/MPC (FROST, CGGMP21) |
| 6 | LP-6xxx | Bridges (Teleport) |
| 7 | LP-7xxx | AI |
| 9 | LP-9xxx | DEX/Markets |

**Chain slots (C nibble):**

| C | Chain |
|---|-------|
| 0 | P-Chain |
| 1 | X-Chain |
| 2 | C-Chain (main EVM) |
| 3 | Q-Chain |
| 4 | A-Chain |
| 5 | B-Chain |
| 6 | Z-Chain |

**Standard EVM addresses** (0x01-0x11) are preserved and not part of this scheme.

### Special Ranges

| Range | Purpose |
|-------|---------|
| 0x01-0x0A | Ethereum standard precompiles |
| 0x0B-0x11 | BLS12-381 (EIP-2537) |
| 0x0100 | secp256r1 (EIP-7212) |
| 0x0500-0x050F | Hashing (BLAKE3, Poseidon2, Pedersen, BabyJubJub, Pasta) |
| 0x9010-0x9080 | DEX (LX Suite) |
| 0x9200-0x9211 | Privacy + encryption (HPKE, ECIES, Ring, X25519, Curve25519, AES, ChaCha20) |
| 0xB002 | Extended KZG |

### Security Considerations

1. The registry is read-only. Precompile addresses are fixed at genesis.
2. Calling a non-existent precompile address behaves as a normal contract call (no code, returns empty).
3. The address scheme is deterministic -- given an LP number and chain slot, the address can be computed without querying the registry.

## References

- LP-078 (EVM Precompile Registry) -- the authoritative address table
- Source: `github.com/luxfi/precompile/registry/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
