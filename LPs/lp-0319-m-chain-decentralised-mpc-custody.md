---
lp: 0319
title: M-Chain – Decentralised MPC Custody & Swap-Signature Layer
description: Purpose-built subnet providing threshold-signature custody, on-chain swap-signature proofs, slashing and reward logic, and light-client proofs for bridge operations.
author: Lux Protocol Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Superseded
type: Standards Track
category: Core
created: 2025-07-24
replaces: 4-r1
requires: 1, 2, 3, 5, 6
superseded-by: 13
---

> **Note**: This LP has been superseded by [LP-13](./lp-13.md), which consolidates all M-Chain specifications into a single comprehensive document.

## Abstract

See section “1 Abstract” for the original overview; this revision is retained for historical reference and is superseded by LP‑13.

## Motivation

See section “2 Motivation”; the goals, risks, and drivers are captured there. LP‑13 refines and replaces this design.

## 1  Abstract

M-Chain is a purpose-built subnet that provides:
1. Threshold-signature custody for all externally-bridged assets (BTC Taproot MuSig2, ETH/Arb/OP ECDSA-GG21, XRPL Ed25519-FROST, etc.).
2. SwapSigTx issuance—i.e. deterministic, on-chain proof that the quorum of custodial signers has produced a valid spend-signature for a given SwapTx on X-Chain.
3. Autonomous slashing & reward accounting for MPC signers based on service-level compliance.
4. A light-client proof format (MProof) consumable by X-Chain and Z-Chain without full M-Chain sync.

This LP formalises the VM, transaction formats, validator duties, RPCs and economic parameters that replace the legacy off-chain bridge back-end (`swaps.ts`) with fully decentralised, auditable on-chain logic.

## 2  Motivation

The original Lux Bridge relied on:
- a Postgres “swap” table,
- a central key-manager process, and
- a cron-based status poller.

These create single points of failure and introduce trust in the server operator.
Migrating signature collection and state tracking into a sovereign chain removes those risks and lets any front-end query or drive swaps by standard JSON-RPC or WebSocket streams.
Validators who already stake LUX now earn additional MPC rewards, tightening economic alignment.

## 3  High-level Architecture

```
             +---------------------------------------+
             |              M-Chain VM               |
             |---------------------------------------|
             |  • KeyShareRegistry (G1, G2, PK)      |
             |  • SwapSigTx verifier                 |
             |  • SLA / Slashing manager             |
             |  • RewardDistributor                  |
             +------------------+--------------------+
                                |
   WarpMsg<MProof>              | gRPC /sign_swap(id)
                                v
 +-----------+        +---------------------+        +-----------+
 | X-Chain   |<-------| mpckeyd (per signer)|------->| BTC / ETH |
 | SwapFx    |        +---------------------+        |  XRPL…    |
 +-----------+                                        +-----------+
```

- Each validator must run `mpckeyd`, holding one or more key-shares.
- When an X-Chain `SwapTx` enters PENDING state, validators detect the event through a filtered light-client feed, assemble a threshold signature, and collectively submit `SwapSigTx` on M-Chain.
- Failure to sign before expiry incurs an automated slashing penalty booked by the VM.
- X-Chain trusts M-Chain via a Merkle-mount light-client proof (MProof) – no full sync required.

## 4  Specification

### 4.1  Consensus & Validator Set
- **Engine**: Lux consensus++ linear chain (2 s finality).
- **Staking token**: LUX. Minimum stake = 5 000 LUX per MPC signer.
- **Committee size per asset-group**: BTC ≈ 15, ETH ≈ 15, XRPL ≈ 10 (`assetQuorum`).
- **Threshold** _t_ = ceil(2/3 · n) (so ≥ 11/15 for BTC).

Signers for different assets may overlap but each asset-group has independent slashing.

### 4.2  On-chain Tx Types

| TxID | Name           | Purpose                                           |
|:-----|:---------------|:--------------------------------------------------|
| 0xA1 | KeyGenTx       | Register or rotate aggregate public-key for asset |
| 0xA2 | SwapSigTx      | Submit threshold signature for a SwapID           |
| 0xA3 | SlashTx        | Prove signer non-performance; slash bond          |
| 0xA4 | RewardClaimTx  | Signer withdraws accrued MPC fees                 |

#### 4.2.1  KeyGenTx

```go
type KeyGenTx struct {
    BaseTx
    AssetID      uint32
    MPCAlgo      byte   // 0=MuSig2,1=GG21,2=FROST
    AggPubKey    []byte // 32–65 B
    SignerBitmap []byte // bitmask of validator IDs
}
```

Commits to new key; must be signed by ≥ threshold validators listed in `SignerBitmap`.

#### 4.2.2  SwapSigTx (core of this LP)

```go
type SwapSigTx struct {
    BaseTx
    SwapID     ids.ID     // X-Chain txID
    AssetID    uint32
    MPCAlgo    byte
    Signature  []byte
    SigBitmap  []byte
    ProofHash  [32]byte   // hash(transcripts) – optional audit
}
```

**Validation:**
```text
require AggVerify(AggPubKey[AssetID], SigBitmap, Signature, msgHash(SwapID))
require bitcount(SigBitmap) >= threshold(AssetID)
```

Successful inclusion triggers:
- credit `rewardPerSig` to each signer in the bitmap,
- mark internal `swapState[SwapID] = SIGNED`.

#### 4.2.3  SlashTx

```go
type SlashTx struct {
    BaseTx
    SwapID   ids.ID
    Evidence []byte // RLP{height, blkHash, swapHeader}
}
```

If now > Swap.expiry and swap still PENDING, all signers in active set lose `slashAmount = stake * 0.2`. 50 % burned, 50 % to reporter.

#### 4.2.4  RewardClaimTx

Claims aggregate rewards and pays gas.

### 4.3  State

- **KeyShareRegistry**  { assetID → AggPubKey, algo, threshold }
- **SwapBook**          { swapID → { state, deadline, asset } } // mirror
- **SignerBalances**    { signer → balance }
- **SignerStake**       { signer → stake, activeAssets[] }
- **PenaltyQueue**      { signer → unbondHeight }

### 4.4  Governance-tunable parameters (`MpcParams`)

| Param           | Default          | Notes                                    |
|:----------------|:-----------------|:-----------------------------------------|
| rewardPerSig    | 0.5 LUX          | per successful SwapSigTx share           |
| slashPct        | 20 % of stake    | for missed deadlines                     |
| graceBlocks     | 30               | allowance after expiry before slashing   |
| bondUnbondPeriod| 43 200 blocks    | (~ 1 day) mourning period after kick      |

## 5  Node & Service Interfaces

### 5.1  `mpckeyd` gRPC

```protobuf
service MPCKeyd {
  rpc SignSwap(SwapMsg) returns (SigReply);      // triggered by watcher
  rpc Heartbeat(Ping) returns (Pong);           // liveness
  rpc RotateKey(RotationReq) returns (Ack);     // governance
}
```

Hot-path latency budget: < 200 ms signature generation (GG21 15-of-15 @ ~80 ms measured).

### 5.2  JSON-RPC additions (under `/ext/bc/M`)

| Method                      | Usage                                         |
|:----------------------------|:-----------------------------------------------|
| `mchain.swapSig.submit`     | Raw `SwapSigTx` broadcast (mpckeyd does this). |
| `mchain.swapSig.pending`    | Returns list of SwapIDs missing sig for asset. |
| `mchain.signer.balance`     | Query accrued rewards, slash status.           |

Light-client (MProof) exported by canonical block hash + Merkle path; X-Chain `dexfx` plugin validates in-block.

## 6  Swap Life-cycle (cross-chain)

1. Wallet submits `SwapTx` on X-Chain.
2. `dexfx` emits `SwapRequested` event.
3. Validators’ watcher threads enqueue swap → `mpckeyd.SignSwap`.
4. Each signer sends partial share; leader aggregates & forms `SwapSigTx`.
5. On-chain inclusion triggers reward accrual & sends `WarpMsg` to X-Chain.
6. `dexfx` verifies proof, unlocks escrow, and—
   - if `privacy=false` → burns/mints or exports UTXO to dst chain immediately,
   - if `privacy=true` → issues ShieldMint Warp to Z-Chain.
7. Status observable via `dex.swap.status` WS & RPC.

## 7  Economic Model

| Flow                    | Value direction                                               |
|:------------------------|:--------------------------------------------------------------|
| Swap fee (bps)          | 60 % → signer reward pool, 40 % → DAO insurance fund          |
| rewardPerSig            | minted from validator reward budget; net neutral as swap fee covers it |
| Slash penalties         | 50 % burned, 50 % to slash reporter                             |

With daily 10 000 swaps × avg fee $4, signers earn ~ 20 000 LUX/mo, creating a strong incentive to maintain uptime.

## 8  Security Considerations

- Byzantine signers: threshold > 67 % ensures at most ⅓ malicious cannot steal funds.
- Key leakage: rotation via `KeyGenTx`; compromised signer must be slashed & replaced.
- Replay: `SwapSigTx` refers to unique SwapID; X-Chain refuses duplicates.
- DoS: signer that stalls protocol → timeout → slashed.
- External chain reorg: spend is final once external L1 confirms; `SwapTx` can be refunded via RevertRefund if external broadcast fails (proof-of-non-inclusion + time).

## 9  Backward Compatibility

- Legacy REST clients can still call an API-gateway micro-service that translates HTTP→RPC.
- No changes to X‑Chain UTXO format besides new `SwapFx` output.
- Existing bridge vault addresses ported as `AggPubKey v0` during genesis.

## 10  Reference Implementation & Test Plan

- `mpckeyd`: Go, imports tss-lib (GG21) + btcd/agg (MuSig2) + ristretto/ed25519-frost.
- Simnet: docker-compose spins X‑, M‑, Z‑Chain, 5 signer nodes, bitcoin-regtest.
- Fuzz: mutate `SwapSigTx` bitmaps, ensure rejection (<1 ms).
- Load: 5 TPS swap, 15‑of‑15 signing, 72 h soak; expect CPU < 40 % on 4‑core VPS.
- Audits: cryptography (Trail of Bits), economic (Gauntlet).

## 11  Governance Actions Required

1. Accept LP‑004‑R2 → freeze spec.
2. Allocate 3 MM LUX from DAO treasury as initial signer reward buffer.
3. Elect first signer set & whitelists for BTC, ETH, XRPL assets.
4. Schedule main‑net “M‑Chain activation” height (T + 30 days after audit pass).

### TL;DR

M‑Chain turns Lux’s bridge into a fully on‑chain, MPC‑secured custody network.
`SwapTx` (intent) on X‑Chain + `SwapSigTx` (quorum proof) on M‑Chain replace every line of the old `swaps.ts` code.
Validators run `mpckeyd`; they are paid per signature and slashed for tardiness, guaranteeing liveness.
Result: trust-minimised, stateless, real-time swaps with optional Z‑Chain privacy—no Postgres, no cron, just chain.
## Specification

Normative behavior is defined in the protocol description and data types within this document. Implementations MUST adhere to the stated algorithms and parameters.

## Rationale

The chosen approach balances security, performance, and implementability, aligning with Lux’s architecture and upgrade path.

## Backwards Compatibility

Additive upgrade; prior clients continue working. Features can be enabled behind configuration without breaking changes.

## Security Considerations

Validate inputs, enforce cryptographic best practices, and consider DoS and replay protections where relevant to the design.

## Implementation

### Threshold Cryptography Library

**Location**: `~/work/lux/threshold/`
**GitHub**: [`github.com/luxfi/threshold/tree/main/protocols`](https://github.com/luxfi/threshold/tree/main/protocols)

**MPC Protocol Implementations** (13 packages):
- [`cmp/`](https://github.com/luxfi/threshold/tree/main/protocols/cmp) - Canetti-Makriyannis-Peled threshold ECDSA (14 files)
- [`bls/`](https://github.com/luxfi/threshold/tree/main/protocols/bls) - BLS threshold signatures (4 files)
- [`frost/`](https://github.com/luxfi/threshold/tree/main/protocols/frost) - FROST Schnorr threshold signatures (27 files)
- [`lss/`](https://github.com/luxfi/threshold/tree/main/protocols/lss) - Lattice-based threshold signatures (30 files)
- [`ringtail/`](https://github.com/luxfi/threshold/tree/main/protocols/ringtail) - Ring signatures (10 files)

**Key Files**:
- [`integration_test.go`](https://github.com/luxfi/threshold/blob/main/protocols/integration_test.go) - Full protocol integration tests (12.7 KB)
- [`integration_simple_test.go`](https://github.com/luxfi/threshold/blob/main/protocols/integration_simple_test.go) - Simple test suite (3.2 KB)

**Testing** (100% pass rate, 55+ packages):
```bash
cd ~/work/lux/threshold
go test -v -race ./...  # All tests pass, zero race conditions
```

### MPC Custody Implementation

**Location**: `~/work/lux/mpc/`
**GitHub**: [`github.com/luxfi/mpc/tree/main`](https://github.com/luxfi/mpc/tree/main)

**Core Packages** (9):
- [`pkg/mpc/`](https://github.com/luxfi/mpc/tree/main/pkg/mpc) - Core MPC logic
- [`pkg/threshold/`](https://github.com/luxfi/mpc/tree/main/pkg/threshold) - Threshold signature integration
- [`pkg/config/`](https://github.com/luxfi/mpc/tree/main/pkg/config) - Configuration management
- [`pkg/kvstore/`](https://github.com/luxfi/mpc/tree/main/pkg/kvstore) - Key-value storage with backup
- [`pkg/encoding/`](https://github.com/luxfi/mpc/tree/main/pkg/encoding) - Cryptographic encoding

**Testing**:
```bash
cd ~/work/lux/mpc
go test -v -race ./...
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
