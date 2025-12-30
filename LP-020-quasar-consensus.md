---
lp: 020
title: Quasar Consensus
tags: [consensus, bls, pq, ml-dsa, ringtail, triple-consensus, finality, liveness, post-quantum]
description: Triple consensus (BLS + Ringtail + ML-DSA) combining deterministic finality with probabilistic liveness and post-quantum security
author: Lux Industries
status: Final
type: Standards Track
category: Consensus
created: 2022-06-01
updated: 2026-04-10
requires:
  - lps-015 (Validator Key Management)
references:
  - lp-1000 (Lux Consensus)
  - lp-1100 (Quasar Upgrade)
  - lp-070 (ML-DSA)
  - lp-073 (Ringtail)
  - lp-075 (BLS)
---

# LP-020: Quasar Consensus

## Abstract

Quasar is Lux Network's triple consensus protocol combining three independent cryptographic hardness assumptions for post-quantum-safe finality:

1. **BLS12-381** aggregate signatures — classical fast-path deterministic finality (48-byte proof)
2. **Ringtail** Ring-LWE threshold signatures — post-quantum liveness and threshold proof
3. **ML-DSA-65** (FIPS 204) signatures — post-quantum identity proof per validator

When a 2/3+ weighted quorum is reached via BLS, the block achieves deterministic finality in a single round. If quorum stalls, Ringtail leader rotation ensures liveness by switching to a probabilistic Snow-family protocol that converges in O(log n) rounds. PQ signatures from signing validators are aggregated into a compact proof stored alongside the BLS aggregate in the QuasarCert. `TripleSignRound1` runs all three paths in parallel.

Each layer can be enabled independently: BLS-only, BLS+ML-DSA, BLS+Ringtail, or full triple (BLS+Ringtail+ML-DSA).

## Specification

### BLS Finality Layer

Validators sign block proposals using BLS12-381 keys registered at stake time (LP-015, LP-075). The proposer aggregates signatures into a single 48-byte aggregate:

- **Quorum threshold**: 2/3 + 1 of total stake weight
- **Signature scheme**: BLS12-381 with proof-of-possession (PoP) to prevent rogue key attacks
- **Aggregation**: proposer collects individual signatures, produces `AggregateSignature(sigs...)` and `AggregatePublicKey(pks...)`
- **Verification**: single pairing check `e(aggSig, G2) == e(H(msg), aggPK)`
- **GPU acceleration** (aspirational): pairing operations offloaded via `github.com/luxfi/crypto/bls` — not yet implemented

A block with a valid quorum certificate (QC) is final. No rollbacks, no reorgs.

### Ringtail Liveness Layer

When BLS quorum cannot be reached within `QUORUM_TIMEOUT` (default 2 seconds), Ringtail activates (LP-073):

1. Rotating leader schedule derived from `VRF(epoch, round)`
2. Leader proposes a block; validators sample `k` peers (default k=20) and query their preference
3. Each validator flips its preference toward the sampled majority with confidence threshold `alpha` (default 0.8)
4. Convergence occurs in O(log n) rounds with probabilistic finality `1 - 2^(-confidence)`
5. Once Ringtail converges, the agreed block is re-submitted for BLS aggregation to produce a deterministic QC

Ringtail signatures use Ring-LWE lattice-based threshold cryptography, providing post-quantum safety independent of BLS.

### PQ Proof Layer

Each validator also signs with a PQ key (ML-DSA-65 per FIPS 204, LP-070, or Ringtail Ring-LWE per LP-073). Individual PQ signatures are aggregated into a compact proof stored in the QuasarCert:

- **Per-validator**: sign with ML-DSA-65 or Ringtail key
- **In QuasarCert**: aggregated PQ proof → ~200 bytes
- **No individual signatures stored** — aggregated proof replaces them
- **GPU acceleration** (aspirational): ZK proof generation offloaded for batch processing — not yet implemented

### QuasarCert Wire Format

```
QuasarCert (~248 bytes):
  BLS aggregate:   48 bytes  (N validators → 1 aggregate)
  PQ proof:       ~200 bytes (aggregated PQ signatures)
  Epoch:            8 bytes
  Finality time:    8 bytes
  Validator count:  4 bytes
```

### Security Properties

An adversary must break ALL THREE assumptions simultaneously:
- **Discrete log on BLS12-381** (classical)
- **Module-LWE** (ML-DSA-65, post-quantum identity proof)
- **Module-SIS** (Ringtail Ring-LWE, post-quantum threshold proof)

### Epoch and Rotation

- **Epoch length**: 1000 blocks (configurable via governance)
- **Leader selection**: weighted VRF proportional to stake
- **View change**: if leader fails to propose within `PROPOSE_TIMEOUT` (500ms), the next leader in VRF order takes over
- **Penalty**: validators missing >10% of epochs in a window lose 0.1% of stake (slashing)
- **Key rotation**: Ringtail keys rotate at most 1x per hour when validator set changes

### Performance

| Metric | Value |
|---|---|
| Finality (happy path) | <500ms (single BLS round) |
| Finality (Ringtail fallback) | 1-3 seconds |
| Throughput | 10,000+ TPS per chain |
| Validator set | up to 10,000 validators |
| QuasarCert size | ~248 bytes |
| GPU vote processing | 100M+ votes/sec (MLX batch, aspirational) |

### Transport

Inter-node consensus messages use ZAP (LP-022) for zero-copy binary RPC:
- Vote propagation via `zap.Node.Broadcast()`
- Proposal distribution via `zap.Node.Send()`
- Peer discovery via mDNS or static mesh (`ConnectDirect`)
- 157x deserialization speedup over protobuf

**PQ-TLS 1.3**: Go 1.26 defaults to ML-KEM-768 for TLS 1.3 key exchange. ZAP transport will use PQ-safe key agreement end-to-end when TLS is enabled, providing post-quantum confidentiality for all consensus wire traffic independent of the signature scheme.

## Security Considerations

1. **BLS rogue key attack**: mitigated by requiring proof-of-possession at validator registration (LP-015)
2. **33% Byzantine threshold**: standard BFT assumption; Ringtail provides graceful degradation under network partitions
3. **Long-range attacks**: prevented by finalized QCs — checkpoints are embedded in block headers
4. **Quantum safety**: PQ proof layer (ML-DSA or Ringtail) provides independent PQ hardness; BLS compromise alone does not break finality
5. **Q-Day transition**: BLS compromised → PQ proof layer still secure; attack window ≤ PQ round time (≤50ms)

## Reference

| Resource | Location |
|---|---|
| Consensus implementation | `github.com/luxfi/consensus/protocol/quasar/` |
| BLS key management | LP-015, LP-075 |
| Ringtail threshold | LP-073, LP-076 |
| ML-DSA signatures | LP-070 |
| ZAP wire protocol | LP-022 |
| Validator staking | `github.com/luxfi/node/vms/platformvm/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.
