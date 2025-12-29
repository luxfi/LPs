---
lp: 037
title: ZK VM
tags: [zk, z-chain, zero-knowledge, privacy, groth16, plonk, vm]
description: Z-chain zero-knowledge privacy VM for shielded transactions and private computation
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2021-08-01
requires:
  - lps-013 (FHE GPU)
references:
  - lp-7300 (Z-Chain Specification)
  - lp-7310 (Shielded Pool)
---

# LP-037: ZK VM

## Abstract

The ZK VM runs the Z-chain, a privacy-focused chain that supports shielded transactions and zero-knowledge computation. Users deposit assets into a shielded pool where transfers occur without revealing sender, receiver, or amount. The Z-chain supports both Groth16 (for fixed circuits) and PLONK (for general computation) proof systems, with GPU-accelerated proof verification via precompiles.

## Specification

### Shielded Pool

The Z-chain maintains a shielded UTXO pool based on a Merkle tree of commitments:

```
Note {
    owner       [32]byte    // derived from recipient's viewing key
    value       uint256     // asset amount
    asset       [32]byte    // asset identifier
    randomness  [32]byte    // blinding factor
}

Commitment = PedersenCommit(owner || value || asset || randomness)
```

The pool is a 32-level Merkle tree of commitments. Nullifiers (derived from spent notes) prevent double-spending.

### Shielded Transfer

A shielded transfer proves in zero knowledge:

1. Input notes exist in the commitment tree (Merkle membership proof)
2. The sender knows the spending key for input notes
3. Input values sum to output values (conservation)
4. Nullifiers are correctly derived and not previously seen

```
ShieldedTx {
    nullifiers  [][32]byte   // nullifiers of spent notes
    commitments [][32]byte   // new note commitments
    proof       []byte       // Groth16 or PLONK proof
    ciphertext  [][]byte     // encrypted notes for recipients
}
```

### Proof Systems

| System | Use Case | Proof Size | Verification Gas |
|---|---|---|---|
| Groth16 | Shielded transfers (fixed circuit) | 192 bytes | 200,000 |
| PLONK | General private computation | ~1 KB | 350,000 |
| Halo2 | Recursive proofs (proof aggregation) | ~5 KB | 500,000 |

### Precompiles

| Address | Function | Description |
|---|---|---|
| `0x0400...01` | `groth16Verify` | Verify Groth16 proof against public inputs |
| `0x0400...02` | `plonkVerify` | Verify PLONK proof against public inputs |
| `0x0400...03` | `pedersenCommit` | Compute Pedersen commitment |
| `0x0400...04` | `poseidonHash` | Poseidon hash (ZK-friendly) |

### Shield/Unshield

- **Shield**: deposit public assets into the shielded pool (public tx -> commitment)
- **Unshield**: withdraw from the shielded pool to a public address (nullifier + proof -> public transfer)

Cross-chain shielding uses Warp messages (LP-021): shield on Z-chain, unshield on any Lux chain.

### Compliance Mode

For regulated assets (LP-001), the Z-chain supports optional compliance disclosure:

- A viewing key can be shared with a compliance officer
- The compliance officer can decrypt transaction details without the spending key
- This satisfies AML requirements while preserving privacy from the general public

## Security Considerations

1. **Trusted setup**: Groth16 requires a trusted setup ceremony. PLONK uses a universal SRS (structured reference string) that is reusable.
2. **Viewing key compromise**: a compromised viewing key reveals transaction history but cannot spend funds.
3. **Nullifier uniqueness**: the nullifier set is consensus-critical. Fork divergence in nullifier sets would break double-spend prevention.

## Reference

| Resource | Location |
|---|---|
| ZK VM | `github.com/luxfi/node/vms/zkvm/` |
| Proof verifiers | `github.com/luxfi/node/vms/zkvm/verifier/` |
| Shielded pool circuit | `github.com/luxfi/node/vms/zkvm/circuits/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
