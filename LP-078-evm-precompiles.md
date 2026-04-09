---
lp: 078
title: Custom EVM Cryptography Precompiles
tags: [evm, precompile, crypto, opcode, gas]
description: Registry of custom EVM precompile addresses for cryptographic primitives
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2021-09-01
references:
  - lps-069 (Poseidon2)
  - lps-070 (ML-DSA)
  - lps-071 (SLH-DSA)
  - lps-072 (ML-KEM)
  - lps-074 (FALCON)
---

# LP-078: Custom EVM Cryptography Precompiles

## Abstract

Defines the complete registry of custom EVM precompile addresses for cryptographic primitives on Lux Network. Standard Ethereum precompiles (0x01-0x0A) are preserved. Lux extends the address space starting at 0x000B for post-quantum and privacy-related cryptographic operations.

## Specification

### Address Registry

| Address | Name | LPS | Gas (base) | Description |
|---------|------|-----|-----------|-------------|
| 0x01-0x0A | Ethereum standard | -- | varies | ecrecover, SHA-256, RIPEMD-160, identity, modexp, ecAdd, ecMul, ecPairing, blake2f, point evaluation |
| 0x000B | Ringtail | 073 | 120,000 | Lattice threshold signature verification |
| 0x000C | FROST | 019 | 50,000 | Ed25519 threshold signature verification |
| 0x000D | CGGMP21 | 019 | 75,000 | ECDSA threshold signature verification |
| 0x0060 | DID Resolver | 060 | 30,000 | DID document resolution |
| 0x0066 | FHE Operations | 066 | varies | Homomorphic encryption operations |
| 0x0069 | Poseidon2 | 069 | 1,500+ | ZK-friendly hash |
| 0x0070 | ML-DSA | 070 | 80,000+ | FIPS 204 PQ signature verification |
| 0x0071 | SLH-DSA | 071 | 150,000+ | FIPS 205 hash-based signature verification |
| 0x0072 | ML-KEM | 072 | 60,000+ | FIPS 203 KEM decapsulation |
| 0x0074 | FALCON | 074 | 65,000+ | FALCON signature verification |

### Address Ranges

| Range | Purpose |
|-------|---------|
| 0x01-0x0A | Ethereum standard (do not modify) |
| 0x000B-0x000F | Threshold signature schemes |
| 0x0060-0x006F | Identity and privacy |
| 0x0070-0x007F | Post-quantum cryptography |

### Gas Pricing

Gas costs are benchmarked against ecrecover (3,000 gas baseline) scaled by computational cost:
- Signature verification: 50K-180K depending on scheme and parameter set.
- Hash operations: 1K-50K depending on input size.
- KEM operations: 60K-100K.

All gas costs are set conservatively and may be reduced via governance as hardware improves.

## Security Considerations

1. Precompile implementations are compiled into the node binary. Updates require a node upgrade.
2. Gas costs must cover worst-case execution time to prevent DoS. Benchmarks use the slowest supported hardware.
3. New precompiles are activated via network upgrades with a scheduled timestamp.
4. Precompile address collisions with future Ethereum EIPs are avoided by using the extended range (0x000B+).

## Reference

| Resource | Location |
|----------|----------|
| Precompile registry | `github.com/luxfi/evm/precompile/contracts/` |
| Gas benchmark suite | `github.com/luxfi/evm/precompile/bench/` |

## Copyright

Copyright (C) 2021-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
