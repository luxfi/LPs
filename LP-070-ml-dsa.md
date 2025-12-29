---
lp: 070
title: FIPS 204 ML-DSA Signatures
tags: [post-quantum, ml-dsa, dilithium, fips-204, lattice, signature]
description: FIPS 204 ML-DSA (Module-Lattice Digital Signature Algorithm) integration
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2024-01-01
references:
  - FIPS 204
  - lps-012 (Post-Quantum Cryptography)
  - lps-078 (EVM Precompiles)
---

# LP-070: FIPS 204 ML-DSA Signatures

## Abstract

Defines the integration of FIPS 204 ML-DSA (formerly CRYSTALS-Dilithium) into Lux Network. ML-DSA provides post-quantum digital signatures based on module lattice hardness. Three parameter sets are supported: ML-DSA-44 (NIST Level 2), ML-DSA-65 (Level 3), and ML-DSA-87 (Level 5). An EVM precompile at `0x0070` verifies ML-DSA signatures on-chain.

## Specification

### Parameter Sets

| Parameter Set | NIST Level | Public Key | Signature | Security |
|--------------|------------|------------|-----------|----------|
| ML-DSA-44 | 2 | 1,312 B | 2,420 B | 128-bit |
| ML-DSA-65 | 3 | 1,952 B | 3,293 B | 192-bit |
| ML-DSA-87 | 5 | 2,592 B | 4,595 B | 256-bit |

Default for Lux: ML-DSA-65 (Level 3) for balance of security and performance.

### Precompile

Address: `0x0070`

```
Input:  (bytes32 messageHash, bytes signature, bytes publicKey, uint8 paramSet)
Output: bytes32 (0x01 valid, 0x00 invalid)
Gas:    80,000 (ML-DSA-44), 120,000 (ML-DSA-65), 180,000 (ML-DSA-87)
```

### Use Cases

| Application | Description |
|-------------|-------------|
| Validator signing | Post-quantum block/vote signatures (Phase 2, LP-012) |
| DID authentication | ML-DSA keys in DID documents (LP-060) |
| Bridge attestation | PQ-safe bridge message signatures |
| Certificate signing | Long-lived credentials requiring PQ safety |

### Key Storage

ML-DSA keys are stored in KMS (LP-062) with HSM backing. The larger key sizes (1.3-2.6 KB public, vs 32 B for Ed25519) require adjusted storage quotas.

## Security Considerations

1. ML-DSA security relies on the hardness of Module-LWE and Module-SIS problems.
2. FIPS 204 is the final NIST standard (August 2024). No further parameter changes expected.
3. Signature malleability: ML-DSA signatures are deterministic, eliminating malleability concerns.
4. Side-channel resistance requires constant-time implementation. The precompile uses the FIPS reference implementation compiled with constant-time flags.

## Reference

| Resource | Location |
|----------|----------|
| ML-DSA precompile | `github.com/luxfi/evm/precompile/contracts/mldsa.go` |
| ML-DSA library | `github.com/luxfi/crypto/mldsa/` |
| FIPS 204 | https://csrc.nist.gov/pubs/fips/204/final |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
