---
lp: 013
title: Fully Homomorphic Encryption on GPU (F-Chain)
tags: [fhe, tfhe, gpu, blind-rotate, bootstrap, encrypted-evm, f-chain, quasar-gpu]
description: TFHE operations accelerated on GPU as the F-Chain compute fabric, integrated into QuasarGPU's wave-tick scheduler for in-process encrypted EVM
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2025-10-01
updated: 2025-12-15
requires:
  - lp-009 (GPU-Native EVM)
  - lp-012 (PQ Crypto GPU)
  - lp-066 (TFHE)
  - lp-132 (QuasarGPU Execution Adapter)
  - lp-134 (Lux Chain Topology)
references:
  - lp-067 (Confidential ERC-20)
  - lp-068 (Private Teleport)
supersedes:
  - lp-013-v1 (FHE on GPU, 2025-10-01..2025-11-30)
---

# LP-013: Fully Homomorphic Encryption on GPU (F-Chain)

## Abstract

LP-013 specifies the **F-Chain compute fabric** — TFHE operations
accelerated on GPU and integrated as a first-class service inside the
QuasarGPU wave-tick scheduler (LP-132). The same kernel that runs EVM
fibers + Block-STM + per-lane cert verification also runs TFHE
gate evaluation, blind-rotate, programmable bootstrap, and the
`evm256.metal` encrypted-256-bit interpreter — **one GPU process for
consensus, DEX, EVM, and FHE in lockstep**.

This v2 update re-frames the v1 standalone "21 GPU kernels" library as
**F-Chain** (LP-134 chain topology) and wires it into the same
substrate that runs every other Lux execution primitive.

## What changed from v1

| Topic | v1 | v2 (this LP) |
|---|---|---|
| Authority | standalone GPU library | **F-Chain** (LP-134) |
| Integration | external library called from C-Chain precompiles | **`drain_fhe` service** inside QuasarGPU wave-tick kernel |
| Cert path | none | `FChainTFHE` + `FChainBootstrap` cert lanes (LP-020 §3.0 + LP-134) |
| Replay protection | none | `fchain_fhe_root` in `QuasarRoundDescriptor` (LP-134) |
| Process boundary | separate kernel dispatches | **same wave-tick kernel** as EVM/STM/cert |

## Architecture

### F-Chain commits the FHE evaluation-key state

Every active TFHE evaluation key (bootstrap key, key-switch key, etc.)
lives on F-Chain. Per-epoch:

```
fchain_fhe_root = H(
    bootstrap_key_root ||
    key_switch_key_root ||
    public_param_root ||
    active_circuit_dag_root )
```

Bound into `QuasarRoundDescriptor.fchain_fhe_root` (LP-134); cert
artifacts on the F-Chain lanes (`FChainTFHE`, `FChainBootstrap`) verify
against this root, preventing cross-epoch key/circuit replay.

### `drain_fhe` service in QuasarGPU

LP-132's wave-tick scheduler grows a 13th service:

```cpp
ServiceId::FheCompute = 12,
```

Drain function `drain_fhe`:

```
1. Pop FheTask from FheCompute ring
   { tx_index, circuit_dag_root, ciphertext_offset, ciphertext_len }
2. Look up circuit DAG via fchain_fhe_root commitment
3. Evaluate the gate sequence using TFHE kernels (below)
4. Update encrypted state in lane-local arena
5. Emit FheCompute attestation onto CertOut (FChainTFHE lane)
6. Push CommitItem onto Commit ring (proceed through STM)
```

Lane-local FHE means contention-free between independent ciphertexts;
shared state (e.g. an encrypted ERC-20 totalSupply) becomes a hot lane
under LP-010 §HotLaneMode and routes through a deterministic reducer.

### Kernels (current as of v0.54)

| Kernel | Operation |
|---|---|
| `tfhe_bootstrap` | programmable bootstrapping (refresh + functional eval) |
| `blind_rotate` / `blind_rotate_fused` | core TFHE primitive (rotate accumulator by encrypted shift) |
| `external_product` (×3 variants) | RGSW × RLWE multiplication |
| `bsk_prefetch` | bootstrap-key caching for hot circuits |
| `fhe_gate` | gate evaluation (AND, OR, XOR, NOT) on TLWE ciphertexts |
| `dag_executor` | FHE circuit DAG execution (fans gates across SM/CUs) |
| `evm256` | full encrypted-EVM interpreter on TFHE-encrypted 256-bit values |
| `tfhe_keygen` | bootstrap-key + key-switch-key generation (M-Chain ceremony output → F-Chain key arena) |
| `tfhe_keyswitch` | switch ciphertexts between key parameters |

CUDA mirrors land in v0.55 — same kernel signatures, different SM
indexing.

### Encrypted EVM (`evm256.metal`)

`evm256` is a TFHE-aware EVM interpreter where every stack value is a
ciphertext. Opcode coverage for v2:

- Bitwise + comparison gates evaluated as homomorphic circuits
- ADD/SUB via 256-bit ripple-carry (256 gates per op, batched)
- MUL via Booth-encoded schoolbook multiplication
- SLOAD / SSTORE on encrypted slots — uses MVCC arena (LP-010) with
  ciphertext values rather than plaintext
- Branching (JUMPI on encrypted condition) via fully oblivious
  evaluation of both branches, then ciphertext-mux

The encrypted EVM runs *inside* `drain_fhe`, not `drain_exec`. Tx
opt-in via the `needs_fhe` flag on `HostTxBlob`.

### Wave-tick co-residency

Inside one wave tick, a single Quasar round can simultaneously run:

```
gid 4  drain_exec      (plaintext EVM fibers)
gid 12 drain_fhe       (encrypted EVM via TFHE)
gid 5  drain_validate  (Block-STM over both)
gid 7  drain_commit    (root chain over both)
gid 10 drain_cert_lane (BLS / Pulsar / MLDSAGroth16 / FChainTFHE)
```

Same `MvccSlot` table; same `RWSetEntry` validation. Encrypted SLOAD
records the same shape of read entry as plaintext SLOAD — Block-STM
sees ciphertext as opaque bytes for serializability. Confidentiality
is preserved because the GPU only handles ciphertexts; plaintext stays
inside TEE-protected key holders (LP-065).

## Performance targets

| Operation | F-Chain (Apple M1 Max) | F-Chain (NVIDIA H100) |
|---|---|---|
| TFHE gate (AND/OR/XOR/NOT) | ~2 ms / gate | ~50 µs / gate |
| Programmable bootstrap | ~10 ms | ~150 µs |
| Encrypted ADD (256-bit, batched) | ~512 ms | ~12 ms |
| Encrypted MUL (256-bit, batched) | ~1.4 s | ~32 ms |
| Encrypted SLOAD (lane-local) | ~50 ms | ~1 ms |

These are within the 500 ms block-time budget for **single-encrypted-tx
execution** when bootstrap-key prefetch is warm. Sustained throughput
for confidential ERC-20 (LP-067) is ~5 tx/s/GPU on M1 Max, ~200 tx/s/GPU
on H100. Multi-GPU sharding (LP-010 §4.0) scales linearly per-lane.

## Cert lanes

| Lane | Use |
|---|---|
| `FChainTFHE` (LP-134) | per-tx attestation that the TFHE circuit was evaluated honestly under `fchain_fhe_root` |
| `FChainBootstrap` (LP-134) | proof of bootstrap-key correctness (typically once per epoch) |

Both lanes verify against `fchain_fhe_root` from the round descriptor;
mismatches reject artifacts as cross-epoch replay.

## Key management

TFHE keys (bootstrap key, key-switch key) are generated via M-Chain
MPC ceremony (LP-019 §TFHE keygen, LP-076). Output lands on F-Chain in
the key arena. M-Chain → F-Chain handoff:

```
M-Chain ceremony round
    → MChainCGGMP21 / MChainFROST cert artifact
    → F-Chain key arena (drain_fhe consumes via fchain_fhe_root)
```

Key rotation is an M-Chain ceremony that emits a new
`fchain_fhe_root`; F-Chain finalizes by accepting a Quasar round whose
descriptor cites the new root.

## Encrypted EVM contract surface (LP-067)

Confidential ERC-20 (LP-067) is the canonical user of F-Chain:

```solidity
contract ConfidentialERC20 {
    mapping(address => bytes32) private _balance;  // ciphertext slots

    function transfer(address to, bytes32 amount) external {
        // amount is a TFHE ciphertext (256-bit)
        // Compiles to evm256 gates; runs on drain_fhe
        bytes32 senderBal = _balance[msg.sender];
        bytes32 newSenderBal = fhe.sub(senderBal, amount);
        bytes32 recvBal = _balance[to];
        bytes32 newRecvBal = fhe.add(recvBal, amount);
        _balance[msg.sender] = newSenderBal;
        _balance[to] = newRecvBal;
    }
}
```

The compiler maps `fhe.sub` / `fhe.add` to the `evm256` interpreter's
homomorphic ops. The contract executes inside `drain_fhe`, but is
otherwise indistinguishable from a normal EVM contract from the
calling tx's perspective.

## Security

- **No plaintext on GPU**: every ciphertext stays encrypted throughout
  GPU residence. Only TEE-protected key holders (LP-065) can decrypt.
- **Replay protection**: `fchain_fhe_root` binds every cert artifact to
  the exact circuit DAG + evaluation-key state.
- **Side-channel discipline**: TFHE gates run in constant time per
  bootstrap; SIMT divergence is bounded to ciphertext metadata, not
  plaintext bits.
- **MPC-secured keygen**: bootstrap keys generated via M-Chain
  ceremony (LP-019); no single party knows the key.

## Implementation plan

| Version | Scope |
|---|---|
| v1.0 | 21 GPU TFHE kernels (LP-013 v1, 2025-10-01) |
| **v0.54 (this LP)** | F-Chain integration: `drain_fhe` service in QuasarGPU; `fchain_fhe_root` in descriptor; `FChainTFHE` + `FChainBootstrap` lanes |
| v0.55 | CUDA mirror of TFHE kernels (LP-132 §CUDA backend) |
| v0.56 | Encrypted EVM full opcode coverage in `evm256` (CALL family, LOGn) |
| v0.57 | F-Chain ↔ M-Chain key-rotation ceremony |
| v0.58 | confidential ERC-20 production rollout (LP-067) |
| v0.59 | private teleport (LP-068) |

## Reference

| Resource | Location |
|---|---|
| TFHE base library | LP-066 |
| QuasarGPU adapter | LP-132 |
| Chain topology | LP-134 |
| Threshold MPC (key-gen) | LP-019, LP-076 |
| Confidential ERC-20 | LP-067 |
| Private teleport | LP-068 |
| TEE mesh | LP-065 |
| KMS | LP-062 |

## Changelog

- **2025-10-01** — v1.0 (standalone GPU TFHE library)
- **2025-11-30** — minor edits
- **2025-12-15** — **v2 update for Quasar 3.0 launch**: F-Chain
  integration; `drain_fhe` service in QuasarGPU; `fchain_fhe_root`
  replay protection; lane registry for `FChainTFHE` /
  `FChainBootstrap`; in-process co-residency with EVM / STM / cert
  lanes (Quasar 3.0 ships 2025-12-25).

## Copyright

Copyright (C) 2025, Lux Partners Limited. All rights reserved.
