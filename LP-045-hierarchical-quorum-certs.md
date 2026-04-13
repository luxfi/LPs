---
lp: 045
title: Hierarchical Quorum Certificates
tags: [quasar, consensus, quorum, committee, pq, bls, ringtail, ml-dsa]
description: Committee-based PQ quorum certificates for N=1000+ validator networks
author: Lux Industries
status: Draft
type: Standards Track
category: Consensus
created: 2026-04-13
requires:
  - lp-020 (Quasar Consensus)
  - lp-043 (Key VM)
  - lp-044 (Threshold VM)
---

# LP-045: Hierarchical Quorum Certificates

## Abstract

Threshold ML-DSA (per Celi et al., USENIX '26) is **practical only for
small groups** (2-of-3 up to 6-of-6). Costs grow roughly as
`exp(O(T · sqrt(N / (T-1))))` past T=6. Consequently, a thousand-validator
Lux deployment **MUST NOT** run a single monolithic threshold session across
all validators.

This LP defines **hierarchical quorum certificates**: validators are
partitioned (or randomly sampled) into small committees, each committee
produces a compact PQ certificate, and a second aggregation layer combines
committee outputs into the final network certificate.

The final on-chain artifact is compact and verifies in `O(1)` chain work,
while heavy coordination stays off-chain.

## Motivation — what breaks at scale

Direct threshold PQ signing at 1000 validators fails on three fronts:

1. **Rounds compound.** Each extra party adds coordination rounds and failure
   surface. Abort/retry behavior in FSwA-based schemes (including ML-DSA)
   gets catastrophic as T grows.
2. **Communication blows up.** Short-secret-sharing partitions inflate
   partial-secret norms, forcing larger hyperball radii. ML-DSA-44 at
   `(T=6, N=6)` already costs ~200 kB/party/attempt; `(T=7, N=8)` is ~70 MB.
3. **Economic model mismatch.** One mega-key means one bond. Collusion
   requires T out of 1000. Small committees with rotation spread the
   attacker's target over many smaller bonds and epochs.

Monolithic designs that the network MUST NOT adopt:

- ❌ One 667-of-1000 threshold ML-DSA group signing every block
- ❌ One network-wide DKG per epoch
- ❌ Every validator participating in every threshold signing attempt
- ❌ Putting 1000-party PQ verification in the execution-layer hot path

## Architecture

### Three keying layers

Validators maintain **three distinct keys** per the validator-set abstraction:

| Key | Purpose | Lifetime | Where |
|-----|---------|----------|-------|
| Identity key | Long-term network identity | Permanent | P-chain record |
| Voting key | Block-level votes | Epoch | Rotated each epoch |
| Session key | In-session committee signing | ~minutes | Per sign session |

### Committee selection

For each slot (or height, or view), the chain deterministically samples a
committee of size `k ∈ {32, 64, 128}` from the active validator set.
Sampling is stake-weighted and bias-resistant:

```
committee_seed = VRF(prev_block.randomness, slot)
committee[i]    = stake_weighted_sample(seed || i), for i ∈ [k]
```

The VRF output is published as part of each block so that any observer
can independently derive the committee.

Properties:
- **Bias resistance**: committee seed derives from VRF over prior block, not
  controllable by the current proposer
- **Predictable liveness**: committee members are known one block in advance
- **Rotation**: committee changes every slot
- **Accountability**: slashing evidence pins on the committee members that
  signed / didn't sign

### Two-layer aggregation topology

```
Validators (1000)
    ↓ local votes
Local aggregators (~16, one per rack/region)
    ↓ cluster certs (PQ threshold)
Root aggregator
    ↓ quorum certificate
On-chain attestation
```

Each cluster of ~32 validators runs **Threshold ML-DSA** or **Ringtail**
to produce a cluster certificate. The root aggregator combines cluster
certificates (either concatenate + bitmap, or run a second-level threshold
over cluster representatives) into the final quorum certificate.

### Quorum certificate format

```go
type QuorumCert struct {
    BlockHash        [32]byte
    Height           uint64
    Round            uint32          // HotStuff-style view
    Epoch            uint64
    CommitteeSeed    [32]byte        // VRF seed for committee sampling
    SignerBitmap     []byte          // Which validators signed (1 bit per validator)
    ClusterCerts     []ClusterCert   // One per participating cluster
    CombinedSig      []byte          // Final aggregated signature
    AccountabilityRoot [32]byte      // Merkle root over per-validator evidence
}

type ClusterCert struct {
    ClusterID        uint32
    Bitmap           []byte          // Which members of this cluster signed
    Sig              []byte          // Threshold signature from cluster
    SigType          uint8           // 1=Threshold ML-DSA | 2=Ringtail | 3=BLS+Ringtail hybrid
}
```

On-chain verification:
1. Derive expected committee from `CommitteeSeed`
2. Verify `SignerBitmap` covers ≥ 2/3 stake weight
3. Verify `CombinedSig` per `SigType`
4. (Optional) Verify `AccountabilityRoot` for slashing path

## Cryptographic choices per role

| Role | Scheme | Reason |
|------|--------|--------|
| Validator identity | ML-DSA | NIST-standard PQ signature, wallet/tooling compat |
| Long-term voting | ML-DSA or Ed25519 | Individual signatures; no thresholding needed |
| Cluster certificate (small committee) | Threshold ML-DSA (LP-xxx) | Small T, standard ML-DSA output for verifiers |
| Cluster certificate (medium committee, high throughput) | Ringtail | Better scaling than thresholdized ML-DSA |
| Aggregation (many committees) | BLS aggregate + Ringtail | BLS for classical speed + Ringtail for PQ defense in depth |
| Rollup/archival compression | ZK proofs (Groth16/PLONK) | Single succinct proof over many QCs |

## Non-design: why not pure BLS

BLS gives you the systems property — "many signatures become one object" —
but its algebra is broken by quantum computers. Lux takes BLS's
**architectural ideas** (aggregator roles, signer bitmaps, committee
selection, stake-weighted quorums, tree aggregation) and applies them over
**PQ-safe primitives** (Threshold ML-DSA, Ringtail, hybrid certs per
LP-020 Quasar).

## Accountability

Threshold signatures compress signers — but blockchains still need blame.
Each QC carries:

- `SignerBitmap` — who signed (per cluster + overall)
- `AccountabilityRoot` — Merkle commitment to per-validator evidence transcripts
- Equivocation proofs go to the slashing precompile via transaction

The accountability path is **off-chain-heavy**: clusters exchange transcripts
locally, only the Merkle root lands on-chain. Slashing submissions reveal
the necessary witnesses.

## Committee size selection

| k (committee) | Cert size | Verification | Security margin |
|---------------|-----------|--------------|-----------------|
| 16 | ~50 kB | Fast | Low (6 dishonest tolerated) |
| 32 | ~150 kB | Moderate | Moderate (10 dishonest tolerated) |
| 64 | ~500 kB | Moderate | High (21 dishonest tolerated) |
| 128 | ~2 MB | Slow | Very high (42 dishonest tolerated) |

Recommended default: **k = 64** with 2/3 Byzantine threshold. Tuned per
deployment via a P-chain governance parameter.

## Reference

| Resource | Location |
|----------|----------|
| Quasar consensus | LP-020 |
| Key VM | LP-043 |
| Threshold VM | LP-044 |
| Threshold ML-DSA | `papers/threshold-mldsa.tex` in `github.com/luxfi/threshold` |
| Ringtail | `github.com/luxfi/threshold/protocols/ringtail/` |

## References

Celi, S.; del Pino, R.; Espitau, T.; Niot, G.; Prest, T.
*Efficient Threshold ML-DSA*. USENIX Security Symposium, 2026.

Boschini, C.; Kaviani, D.; Lai, R. W. F.; Malavolta, G.; Takahashi, A.;
Tibouchi, M. *Ringtail: Practical Two-Round Threshold Signatures from
Learning With Errors*. IEEE S&P 2025.
