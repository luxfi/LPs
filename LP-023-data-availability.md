---
lp: 023
title: Data Availability
tags: [data-availability, erasure-coding, reed-solomon, da, blobs]
description: Erasure coding data availability guarantees for Lux block data
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2020-09-01
requires:
  - lps-020 (Quasar Consensus)
references:
  - lp-1200 (Data Availability Layer)
---

# LP-023: Data Availability

## Abstract

Lux DA provides data availability guarantees through 2D Reed-Solomon erasure coding. Block data is encoded into an extended matrix where any 50%+ of rows or columns suffice to reconstruct the original data. Light clients sample random cells to verify availability with statistical certainty without downloading full blocks.

## Specification

### Erasure Coding

Block data is arranged into a `k x k` matrix and extended to `2k x 2k` using Reed-Solomon coding over GF(2^16):

1. Split block data into `k^2` chunks of fixed size (512 bytes)
2. Extend each row from `k` to `2k` using RS encoding
3. Extend each column from `k` to `2k` using RS encoding
4. Compute Merkle roots for each row and column

The extended matrix has 4x the original data. Any `k` of `2k` rows (or columns) can reconstruct the original block.

### Commitment Scheme

Each block header includes:

```
DACommitment {
    dataRoot    [32]byte   // Merkle root of the 2k x 2k extended matrix
    rowRoots    [][32]byte // Merkle root per row (2k entries)
    colRoots    [][32]byte // Merkle root per column (2k entries)
    originalK   uint32     // original dimension before extension
}
```

### Light Client Sampling

Light clients verify data availability by sampling random cells:

1. Select `s` random `(row, col)` coordinates (default s=16)
2. Request each cell plus its Merkle proof from full nodes
3. Verify each cell against `rowRoots[row]` and `colRoots[col]`
4. If all `s` samples verify, DA is confirmed with probability `1 - (1/2)^s`

With s=16, the probability of a false positive is `1/65536`.

### Full Node Reconstruction

Full nodes download all cells and verify the complete extended matrix. If any row or column is inconsistent with its Merkle root, the node generates a fraud proof (LP-025) proving the inconsistency.

### Blob Transactions

Applications submit data as blob transactions:

```
BlobTx {
    to          address
    data        []byte     // calldata (execution layer)
    blobs       []Blob     // DA blobs (availability layer only)
    blobHashes  [][32]byte // versioned hashes of blobs
}
```

Blobs are pruned after `BLOB_RETENTION_EPOCHS` (default 4096 epochs, ~18 days). Execution layer references blobs by hash only.

## Security Considerations

1. **Minimum sampling**: 16 samples provides 99.998% confidence. Applications requiring higher assurance increase `s`.
2. **Reconstruction guarantee**: with honest majority (>50% of network storing data), any light client can reconstruct via random sampling.
3. **Blob pruning**: pruned blobs are no longer available from the protocol. Long-term archival is an application concern.

## Reference

| Resource | Location |
|---|---|
| DA encoding | `github.com/luxfi/node/da/` |
| Reed-Solomon library | `github.com/luxfi/node/da/rs/` |
| Blob transaction handling | `github.com/luxfi/evm/core/types/blob_tx.go` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
