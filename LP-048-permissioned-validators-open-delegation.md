---
lp: 048
title: Permissioned Validators, Open Delegation, Read-Only Replicas
tags: [validators, delegation, nft, scaling, replicas, economics]
description: Bounded N=100 validator set via NFT seats, open stake delegation, unlimited read-only replicas for service scaling
author: Lux Industries
status: Draft
type: Standards Track
category: Economics
created: 2026-04-13
requires:
  - lp-030 (Platform VM)
  - lp-045 (Hierarchical Quorum Certs)
  - lp-047 (Fee Attribution)
---

# LP-048: Permissioned Validators, Open Delegation, Read-Only Replicas

## Abstract

Three tiers of participation:

1. **Validator seats** — capped at N (configurable; default 100), gated by
   a transferable NFT. Only seat holders sign blocks and participate in
   Quasar finality.
2. **Delegators** — open, anyone can delegate LUX to a validator to earn
   a share of rewards minus commission. Delegations back validator stake
   for consensus weight and slashing.
3. **Read-only replicas** — open, anyone can run a full node that syncs
   state, verifies Quasar certs, serves RPC, and distributes light-client
   proofs. No seat needed.

This gives bounded consensus cost (always N validators) with unbounded
economic participation (delegation) and unbounded service capacity
(replicas).

## Motivation

Fully permissionless validator sets (Ethereum-style) have two problems:

1. **Unbounded consensus cost** — more validators means more signatures,
   more gossip, more state to track.
2. **Validator quality drift** — low barrier to entry attracts unreliable
   operators.

Fully permissioned sets (old Diem, early Cosmos Hub) solve those but lose:

1. **Economic openness** — ordinary users can't contribute capital.
2. **Service scaling** — only the N validators can serve data, limiting
   RPC/archival throughput.

The three-tier design captures the bounded-consensus benefit while
preserving open economic participation and horizontal service scaling.

## Tier 1: Validator seats

### Seat as X-Chain native NFT

No ERC-721 contract. The seat is a native X-Chain asset defined at genesis:

```
Genesis asset: SEAT
  Name:          LuxValidatorSeat
  Symbol:        LVS
  Denomination:  0 (indivisible, NFT-like)
  FixedCap:      true
  InitialSupply: N (default 100)
  Mint:          disabled after genesis (fixed supply)
  OutputType:    NFTTransferOutput (each unit has a unique token ID)
```

Each of the N seats is a distinct UTXO holding 1 × SEAT with a unique
token ID (0 to N-1). Transfers are standard X-Chain `BaseTx` consuming and
producing `NFTTransferOutput`s. No EVM, no contract.

Seats are:

- **Transferable** on X-Chain like any native asset, subject to the stake
  lock (NFT is locked while its holder is an active validator + unbonding
  period of 21 days).
- **Issued** at genesis (initial 100 seats) to vetted operators. Governance
  can expand N via supermajority vote (P-Chain governance tx mints
  additional SEAT NFTs).
- **Slashable** — misbehavior slashes the self-bond LUX; seats can also
  be forfeited by governance vote (NFT burned and reissued).

### Registration

Validators register on P-Chain by atomically importing their SEAT from
X-Chain and posting a self-bond:

```go
AddPermissionedValidatorTx {
    NodeID        ids.NodeID
    SeatImport    *atomic.Input       // X-Chain UTXO containing 1 × SEAT
    SelfBond      []*lux.TransferableInput  // ≥ min_bond × LUX
    CommissionBps uint16
    MLDSAPubKey   []byte
    BLSPubKey     []byte                // both keys for PQ upgrade path
    VRFKey        []byte
    Endpoints     []Endpoint
    Duration      uint64                // seconds; max 1 year per registration
}
```

P-Chain verifies:

1. The imported UTXO contains exactly 1 × SEAT with a token ID not currently
   bound to an active validator.
2. Self-bond is at least `min_bond` LUX.
3. Public keys are well-formed.
4. The signer controls both the imported UTXO and the self-bond inputs.

On success, the SEAT + self-bond are locked in a stake output on P-Chain
until the registration expires. At expiry (or via `StopValidatorTx`), the
SEAT is exported back to X-Chain and the LUX self-bond (minus any slashing)
is returned.

### Delegation

Delegators send LUX only — no SEAT required:

```go
AddDelegatorTx {
    NodeID      ids.NodeID             // which validator to back
    LuxStake    []*lux.TransferableInput // ≥ 10 LUX minimum
    Duration    uint64
}
```

The delegated stake is locked for the delegation duration + unbonding
period. Delegators share the validator's block and signing rewards minus
the validator's published commission rate.

### Revocation

Seats can be revoked for:

- Double-signing (automatic, 100% of self-bond slashed)
- Persistent liveness failure > 14 days (governance vote)
- Criminal/regulatory action against holder (governance vote)

A revoked seat returns to the NFT pool for re-issuance.

## Tier 2: Open delegation

### Delegation

Anyone holding LUX can delegate to any active validator:

```go
Delegation {
    Delegator    common.Address
    ValidatorSeat uint256
    Amount       uint64
    StartTime    uint64
}
```

Delegated LUX is locked for the duration of the delegation plus the
unbonding period. Delegators receive:

```
delegator_reward = (1 - commissionBps/10000) * share_of_validator_reward
validator_reward = commissionBps/10000 * delegator_reward + self_bond_share
```

### Slashing proportionality

When a validator is slashed, the slash hits:

1. Self-bond first (up to 100% of offense penalty)
2. Delegated stake proportionally (if self-bond insufficient)

This ensures validators eat their own risk first, then delegators share
residual penalty.

### Unbonding

Delegators can initiate unbonding at any time. Funds become liquid after
the unbonding period (default 21 days) during which they remain slashable
for offenses committed during the bond period.

## Tier 3: Read-only replicas

### What a replica does

A read-only replica:

- Connects to the Lux P2P network
- Downloads blocks and Quasar certs
- Verifies certs (ML-DSA sigs + Ringtail aggregates + Z-chain ZK proofs)
- Executes transactions to compute state
- Serves RPC to clients
- Optionally serves archival history, light-client proofs, bridge proofs

What it does NOT do:

- Sign blocks
- Participate in consensus votes
- Hold a validator seat
- Receive direct block rewards

### Why this scales

| Load class | Validator node | Read-only replica |
|-----------|---------------|-------------------|
| Signing | required | no |
| State verification | required | required |
| State storage | required | optional (pruning allowed) |
| RPC serving | optional | primary role |
| Archival | optional | primary role |
| Light-client proofs | optional | primary role |
| Bridge relayer | optional | primary role |

The 100 validator nodes handle a fixed consensus workload. An unlimited
number of replicas can fan out the service workload:

- 1 validator serving RPC: ~100 req/s per node
- 100 replicas serving RPC: ~10,000 req/s network-wide
- 10,000 replicas serving RPC: ~1,000,000 req/s network-wide

The consensus cost (cert verification per block) is amortized across all
replicas, but signing cost stays with the 100 validators.

### Replica revenue (optional)

Replicas can earn revenue by:

1. **Service fees** — charge clients for RPC, archival queries, or
   light-client proofs (set their own rate).
2. **Data marketplace** — sell archival indexes or custom data products.
3. **Cross-chain relay** — forward messages across chains (R-Chain pays).
4. **Bridge attestation** — watch for external chain events (B-Chain pays).

None of this is mandatory. Replicas that run purely for personal use pay
no fees but also earn none.

## Governance of seat count

The seat count N is a P-Chain governance parameter, changeable via:

- **Expansion**: governance vote to mint new seats (dilutes existing holders).
  Requires 2/3 supermajority.
- **Contraction**: seats retire voluntarily (NFT burned). New seats not
  minted until N drops below target.
- **Initial seeding**: first 100 seats distributed at genesis to
  known, vetted operators.

## Economic model

### Typical validator economics (N=100, 1B LUX total stake, 10% annual inflation)

Annual protocol rewards: 100M LUX distributed across C1-C4 work classes
(LP-047).

Per-seat share (assuming uniform stake):
- Block signing (C2): ~350k LUX / year
- Block proposing (C1): ~70k LUX / year (proposer selected 1/100 of blocks)
- Aggregation (C3): bid for by subset, ~20k LUX / year average
- Archive (C4): bid for by subset with GPU, ~100k LUX / year average

Total seat revenue: ~540k LUX / year before commission.

### Delegator economics

At 500 bps (5%) commission:
- Validator keeps 5% of C1-C4 rewards (~27k LUX / year) plus self-bond share
- Delegators share the remaining 95% proportional to their stake share

For a delegator who stakes 100k LUX (0.01% of network):
- Share of validator's 540k LUX/year = 54 LUX/year
- Minus 5% commission = 51.3 LUX/year
- Effective yield: ~5.1%

### Replica economics

Pure cost center unless the replica opts into service monetization.

## Security properties

| Property | How |
|----------|-----|
| **Consensus safety** | 2/3 of 100 seats (≥ 67) honest; seat NFT slashable |
| **Consensus liveness** | 2/3 responsive; metastable convergence in β rounds |
| **Economic security** | Delegator slashing makes attacks expensive; total bonded stake > attack cost |
| **Service availability** | Unbounded replicas fan out service load |
| **Censorship resistance** | Replicas can relay transactions to any validator; no validator can uniquely block a tx |
| **Accountability** | Double-sign slashes seat + self-bond + proportional delegations |

## Interactions with LP-045 (Hierarchical QC)

With N=100 validators and k=32 committee per block:
- Each block samples 32-of-100 via VRF or metastable query
- Each seat signs ~1/3 of blocks on average
- Cert size: 77 kB (per LP-045 measurements)
- Verification: <1 ms per block

The permissioned set size N=100 is small enough that light-client verify
time is dominated by the committee cost k=32, not N.

## Interactions with LP-047 (Fee Attribution)

Fee distribution (LP-047) routes rewards to specific work classes. Under
permissioned validators:

- All C1-C4 rewards flow to seat holders
- Delegators receive proportional share via delegation contracts
- Service rewards (C6) may flow to non-validator replicas if they provide
  the service

This keeps LP-047 unchanged; LP-048 just restricts who can hold C1-C5
work classes (seat NFT required).

## Cryptographic profile for permissioned chains

A permissioned validator set changes the consensus threat model substantially.
When all 100 signers are vetted, bonded, identifiable institutions, the
attack surface is dominated by **institutional security** (legal, operational,
custody) rather than **cryptographic security** (can the primitive be broken).

This means the per-block consensus signature does not need to be PQ in the
same way a permissionless chain's does:

| Layer | PQ needed? | Rationale |
|-------|------------|-----------|
| Per-block committee sig | **No** (BLS OK) | permissioned signers + seat NFT gate + short-term finality |
| User wallet signatures | **Yes** (ML-DSA) | users' funds need 50-year protection |
| Cross-chain bridge sigs | **Yes** (ML-DSA) | counterparty chains may be permissionless |
| Era archival proof | **Yes** (Z-chain ZK) | state commitments must verify in 50 years |
| Light-client proofs for external users | **Yes** | external verifiers are outside the permissioning |

### Recommended consensus primitive for permissioned deployments

**BLS12-381 aggregate signature** is the pragmatic choice:

```
per-block cert = BLS_aggregate({sig_i | i in committee})
cert size      = 96 bytes
verify time    = ~1 ms (single pairing check)
```

Over ML-DSA at k=32 (~650 µs verify, 77 kB cert), BLS wins on both size
and operational simplicity. The PQ-safe alternative costs 100× in bytes
and 50% more in verify time for security that only matters after a
quantum adversary materialises AND subverts the institutional layer.

### PQ upgrade path

The protocol retains an **upgrade capability** so consensus can switch
to ML-DSA + Ringtail (per LP-045) if quantum materialises:

```solidity
contract ConsensusPrimitive {
    enum Scheme { BLS, MLDSA, Hybrid }
    Scheme public current = Scheme.BLS;

    // Activated by governance supermajority
    function upgrade(Scheme newScheme) external onlyGovernance {
        require(newScheme > current, "can only strengthen");
        current = newScheme;
        emit ConsensusUpgraded(newScheme);
    }
}
```

Each seat NFT holder registers BOTH a BLS and ML-DSA key at seat
activation so the upgrade is a flag-flip, not a hard fork requiring
new registrations.

### Archival always PQ

Regardless of active consensus primitive, era archival proofs are always
Groth16/PLONK over the era's block certs. This keeps long-term state
commitments PQ-safe even if consensus is BLS today.

## Open questions

- **NFT transfer market**: should seat transfers require governance approval,
  or be freely transferable subject to unbonding? Lean toward free transfer
  with economic bond.
- **Initial distribution**: governance-controlled vs auction. Auction
  avoids favoritism but may concentrate seats among well-capitalized
  operators.
- **Replica reward sharing**: should validators share a small fraction of
  their revenue with replicas that serve their RPC? Not in the initial
  design; replicas earn separately if they choose.
- **Seat count elasticity**: how easy should N be to change? Lean toward
  high friction (2/3 supermajority + 90-day notice) to preserve stability.

## References

- LP-030 Platform VM
- LP-045 Hierarchical Quorum Certs
- LP-047 Fee Attribution
- Cosmos Hub validator set (175 bonded)
- Diem Association model (pre-shutdown)
- Ethereum beacon chain delegation via liquid staking
