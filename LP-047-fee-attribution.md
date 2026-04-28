---
lp: 047
title: Fee Attribution and Rewards for PQ-Native Lux
tags: [fees, rewards, staking, economics, pq, multichain]
description: How transaction fees, block rewards, and service fees are divided among validators who opt into PQ security work
author: Lux Industries
status: Draft
type: Standards Track
category: Economics
created: 2026-04-13
requires:
  - lp-020 (Quasar Consensus)
  - lp-030 (Platform VM)
  - lp-045 (Hierarchical Quorum Certs)
---

# LP-047: Fee Attribution and Rewards for PQ-Native Lux

## Abstract

PQ-native Lux has many kinds of work: committee signing, epoch aggregation,
era ZK proof generation, track-chain validation, FHE compute, oracle data
provision, bridge signing. This LP specifies how fees, rewards, and MEV
are **attributed to the specific work that earned them** and distributed
proportionally to stake within each work class.

Key principle: **every fee is tied to a cryptographically provable
work unit.** No hand-waved rewards, no epoch-level lottery. If you
didn't sign the cert, verify the proof, or relay the message, you
don't get paid for it.

## Work classes

Validators opt in to one or more of these:

| Class | Work | Cadence | Evidence |
|-------|------|---------|----------|
| **C1** Propose | propose blocks on primary chain | every block slot when selected | signed proposal in block header |
| **C2** Sign | committee member signs finalized block | ~k/N of blocks | sig in block cert |
| **C3** Aggregate | produce epoch Ringtail/SNARK rollup | every epoch | aggregate proof on-chain |
| **C4** Archive | produce era Groth16/PLONK proof | every era (168 epochs) | Z-chain proof record |
| **C5** Track-chain validate | validate A/B/D/G/I/K/O/R/T specific chain | per track-chain block | track-chain cert |
| **C6** Service | oracle feeds, FHE compute, TEE attestation, bridge signing | per request | request-response record |
| **C7** ZK prover | generate proofs for rollups, light-client support | per proof | proof on Z-chain |

Each class has its own requirements (stake, hardware, liveness) and its
own reward pool.

## Fee sources

| Source | Definition | Base allocation |
|--------|-----------|-----------------|
| **F1** Base fee | per-byte execution cost, EIP-1559 style | 100% burned (deflationary) |
| **F2** Priority fee | user-chosen tip | split per schedule below |
| **F3** Block subsidy | protocol-minted per block | split per schedule below |
| **F4** Service fee | charged for specific service (oracle query, FHE compute, bridge) | routed to C6 providers |
| **F5** Cross-chain fee | messages crossing chains (R-chain, B-chain) | split between originating and destination track-chains |

## Reward split

### Primary network block (per block on C-Chain)

Total reward pool = F2 (priority fees in block) + F3 (block subsidy).

| Share | Class | Recipients |
|-------|-------|-----------|
| 35% | C1 proposer | single validator |
| 35% | C2 committee signers | split among signers proportional to stake |
| 10% | C3 epoch aggregator | held in escrow, paid at epoch close |
| 5% | C4 era archiver | held in escrow, paid at era close |
| 15% | P-Chain treasury | fund public goods, slashing insurance |

### Primary network chain splits

When a transaction crosses primary network chains (e.g., a C-Chain contract
calls a precompile that reads X-Chain state), the F2 fee is split:

```
fee_to_C = base_execution_cost / total_execution_cost · F2
fee_to_X = x_chain_read_cost / total_execution_cost · F2
fee_to_Q = 0 (Q-Chain finality is paid from F3 subsidy, not per-tx)
fee_to_Z = zk_verify_cost / total_execution_cost · F2
```

Each chain's share goes into that chain's block reward pool for its signing committee.

### Track-chain fees

Track-chain validators set their own fee schedule (published in track-chain
genesis). When a cross-chain transaction touches a track-chain:

```
R-Chain relay: flat 0.001 LUX per message, split 100% among R-Chain committee
B-Chain bridge: 5 bps on bridged amount, split:
  70% to B-Chain committee (signers)
  20% to B-Chain liquidity providers
  10% to Q-Chain for finality stamping
O-Chain oracle: per-feed subscription fee, 100% to data providers
T-Chain signing: per-session fee, 100% to session participants
K-Chain keygen: per-DKG fee, 100% to DKG participants
```

Track-chains operate as independent economic zones. Fees collected on one
track-chain stay in that track-chain's economy (plus a small primary-network
tax for finality, detailed below).

### Primary-network finality tax

Every track-chain pays a small fee to the primary network for Q-Chain
finality stamping:

```
tax_rate = 5 bps of track-chain fee revenue
tax = collected each epoch, paid to primary network block reward pool
```

This compensates the primary validators for securing the full PQ finality
chain that track-chains anchor against.

## Service fees (F4)

Specific services have dedicated fee schedules:

| Service | Fee | Split |
|---------|-----|-------|
| Oracle feed subscription | 10 LUX/month/feed | 100% to data providers on that feed |
| FHE threshold decrypt | 0.1 LUX/ciphertext | 100% to T-chain session participants |
| TEE attestation verify | 0.01 LUX | 100% to attestation verifier (C6) |
| Bridge signing | 5 bps of bridged amount | 70% signers / 20% LPs / 10% Q-finality |
| ZK proof generation | quoted by prover | 100% to prover |

## Stake-weighted splits within classes

Within C2 (committee signers), each validator's share of the signer reward
is proportional to their stake within the committee:

```
v_share = v.stake / sum(committee.stakes)
```

This is standard stake-weighted reward distribution.

## Slashing

Reward and slashing are symmetric — the same cryptographic evidence that
earns a reward can also prove misbehavior:

| Offense | Evidence | Penalty |
|---------|----------|---------|
| Double-sign in committee | two sigs on conflicting blocks at same height | 100% of stake at risk |
| Missed signing slot | no sig in cert when committee expected | 0.01% stake per miss |
| Invalid aggregate | Ringtail/SNARK does not verify | 10% stake |
| Invalid era ZK proof | Groth16 does not verify | 100% of prover bond |
| Service SLA breach (oracle stale data) | on-chain challenge + off-chain proof | 1% stake per offense |

Slashed stake goes to:
- 50% burn
- 30% to the block producer that included the challenge
- 20% to P-Chain treasury

## Opt-in mechanism

Validators declare opt-in classes in their P-Chain registration record:

```
ValidatorRegistration {
  NodeID            ids.NodeID
  StakeAmount       uint64
  BondCommitments   map[Class]uint64   // stake bonded per class
  HardwareClaims    []HardwareClaim    // GPU, TEE, storage
  Endpoints         []Endpoint         // where each service can be reached
  MLDSAPubKey       [ML-DSA-65-pk]
  MLKEMTransportKey [ML-KEM-768-pk]
  VRFKey            []byte
}
```

Opt-in is per-class. A validator running a GPU can opt into C4 (era
archiver) while skipping C5 (track-chain). A light validator might
only do C2 (committee signing) and skip everything else.

Each class has its own minimum stake and hardware requirements:

| Class | Min stake | Hardware |
|-------|-----------|----------|
| C1 Propose | 100 LUX | any |
| C2 Sign | 100 LUX | any |
| C3 Aggregate | 1,000 LUX | fast CPU + 4 GB RAM |
| C4 Archive | 10,000 LUX | GPU (≥ 8 GB VRAM) + 32 GB RAM |
| C5 Track-chain | 100 LUX | any (per track-chain genesis) |
| C6 Service | varies per service | varies (GPU for FHE, TEE for attestation) |
| C7 Prover | 5,000 LUX | GPU (≥ 16 GB VRAM) + SSD |

## Incentive alignment

The reward structure encourages:

1. **Specialization** — high-stake validators with specialized hardware
   (GPU, TEE) opt into C4, C6, C7 and capture premium fees.
2. **Participation** — low-stake validators can still participate via
   C2 signing on primary network.
3. **Liveness** — missed-slot slashing penalizes unreliability.
4. **Honesty** — cryptographic evidence for rewards means no "free
   riders": you must actually do the work to prove you did.
5. **Diversity** — different classes have different hardware requirements,
   naturally distributing roles across the validator population.

## Cadence and payouts

Rewards settle on a cadence matching the work:

| Reward | Settled | Paid to |
|--------|---------|---------|
| C1, C2 per-block | every block | validator balance immediately |
| C3 epoch aggregator | at epoch close (~1 hour) | validator balance |
| C4 era archiver | at era close (~1 week) | validator balance |
| C5 track-chain | per track-chain block | validator balance on that track-chain |
| C6 service | per service request | validator balance (or subscription pool) |
| Slashing | on evidence submission | immediate |

## Example: 100-validator primary network, k=32 committee, 1s blocks

- Block subsidy: 10 LUX / block
- Avg priority fees: 2 LUX / block
- Pool per block: 12 LUX

Per-block splits:
- Proposer (1 validator): 4.2 LUX
- Committee signers (32 validators): 4.2 LUX / 32 = 0.13 LUX each
- Epoch aggregator (escrow): 1.2 LUX
- Era archiver (escrow): 0.6 LUX
- P-Chain treasury: 1.8 LUX

Over 128 blocks (one epoch, about 2 minutes):
- Epoch aggregator receives: 128 × 1.2 = 154 LUX
- Era archiver accumulates: 128 × 0.6 = 77 LUX (toward the 168-epoch total of ~13K LUX)

Over 168 epochs (one era, ~6 hours):
- Era archiver receives: 168 × 154 ≈ 26K LUX

Proposer + signer work at 100-validator scale pays ~2 LUX/validator/hour
assuming uniform participation.

## Open questions

- **Service fee discovery**: how do clients find cheapest C6 provider?
  Probably an on-chain registry + off-chain marketplace.
- **GPU-class reward premium**: should C4/C7 premium be fixed ratio or
  market-discovered? Lean toward market-discovered via auction at era boundary.
- **Light-client incentive**: how do we pay for light-client-oriented
  ZK proof generation if no user directly pays for it? Probably roll into
  C4 era archiver reward.
- **MEV**: priority fee mechanism captures most MEV. Explicit MEV auction
  (Flashbots-style) can be added per track-chain.

## References

- LP-020 Quasar Consensus
- LP-030 Platform VM (staking primitives)
- LP-045 Hierarchical Quorum Certificates (defines C1-C2 work)
- LP-044 Threshold VM (defines C6 threshold signing)
- `~/work/lux/proofs/pq-finality-no-bls.tex`
- `~/work/lux/consensus/METASTABLE_SIGNED_QUERIES.md`
