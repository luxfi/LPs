---
lp: 063
title: Z-Chain — Zero-Knowledge Aggregation Authority
tags: [zk, groth16, mldsa, halo2, plonky2, risc0, stark, poseidon2, nullifier, cert-lane, zchain-vk-root]
description: Z-Chain hosts the MLDSAGroth16 cert-lane rollup for Quasar 3.0 plus the general-purpose ZKP verifying-key registry committed in zchain_vk_root
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2021-08-01
updated: 2025-12-15
references:
  - lps-020 (Quasar Consensus 3.0)
  - lps-069 (Poseidon2 Hash Precompile)
  - lps-064 (Privacy Pool)
  - lps-012 (Post-Quantum Cryptography)
  - lps-070 (ML-DSA)
  - lps-132 (QuasarGPU Execution Adapter)
  - lps-134 (Lux Chain Topology)
---

# LP-063: Z-Chain — Zero-Knowledge Aggregation Authority

## Abstract

Z-Chain is Lux Network's **zero-knowledge proof aggregation authority**.
It owns three responsibilities, all rooted in the same chain commitment
`zchain_vk_root[32]` carried in `QuasarRoundDescriptor` (LP-020 §3.0):

1. **MLDSAGroth16 cert-lane rollup** — the third Quasar cert lane.
   Z-Chain produces a single Groth16 proof attesting "N valid ML-DSA-65
   signatures over `subject` from this validator set", replacing
   per-validator ML-DSA verification on the consensus path.
2. **General-purpose ZKP verifying-key registry** — Halo2, Plonky2,
   Risc0, STARK, and future proof systems register their verifying keys
   under `zchain_vk_root`. Any C-Chain contract can call a Z-Chain
   precompile to verify a proof against a registered VK.
3. **UTXO privacy chain** (legacy, this LP §UTXO Privacy) — Poseidon2
   commitment trees with STARK proofs for shielded transfers; this is
   the historical Z-Chain content and remains operational.

`zchain_vk_root` is the single Merkle root that commits to all
verifying keys Z-Chain accepts in the active epoch — both the MLDSAGroth16
cert-lane VK and the registered application VKs.

## What changed in v3.0 (this update)

| Topic | Before (LP-063 v1) | Now (this LP) |
|---|---|---|
| Scope | UTXO privacy only | UTXO privacy + MLDSAGroth16 cert lane + general ZKP registry |
| Cert-lane role | none | **third Quasar cert lane** (LP-020 §MLDSAGroth16) |
| `zchain_vk_root` | not defined | **canonical commitment** to all accepted VKs per epoch |
| Proof systems | STARK only | Groth16 (cert-lane), Halo2, Plonky2, Risc0, STARK |
| Authority over ML-DSA-65 sigs | n/a | rolls up N validator sigs into one 192-byte proof |

## 1. MLDSAGroth16 cert-lane rollup

### Why a rollup, not threshold

Threshold ML-DSA has **no FIPS standard**: research constructions hit
a rejection-sampling circular dependency
(`~/work/lux/proofs/quasar-cert-soundness.tex` App. A). Quasar 3.0
takes the non-threshold path:

1. Each validator individually signs `certificate_subject` with their
   ML-DSA-65 identity key (per LP-070).
2. The proposer ships these N raw ML-DSA signatures off-chain to a
   Z-Chain prover.
3. Z-Chain produces a single **192-byte Groth16 proof over BLS12-381**
   attesting "N valid ML-DSA-65 signatures over `subject` from
   validator set `V` (per `pchain_validator_root`)".
4. The Quasar cert ingress carries the proof + a 32-byte
   public-inputs hash, **not** the N raw ML-DSA shares.
5. The QuasarGPU verifier (LP-132 §`drain_cert_lane`) runs **one
   Groth16 pairing check** per cert.

### Wire shape

```cpp
struct MLDSAGroth16Artifact {
    uint8_t proof[192];                // Groth16 proof over BLS12-381
    uint8_t public_inputs_hash[32];    // bound to subject + validator set root
};
```

Public inputs include:
- `certificate_subject[32]` (must equal `QuasarRoundDescriptor.certificate_subject`)
- `pchain_validator_root[32]` (defines the eligible signer set)
- `validator_bitmap_hash[32]` (commitment to which validators contributed)
- `n_signers` (the N count, must clear the threshold)

The verifier:

```cpp
verify_mldsa_groth16(subject, proof, public_inputs_hash, zchain_vk_root)
```

is implemented in LP-132 §`drain_cert_lane` and selects the active VK
from `zchain_vk_root` at the round's epoch.

### Costs (measured 2025-12-13)

| Operation | CPU | GPU (MLX/Metal/CUDA) |
|---|---|---|
| ML-DSA-65 sign (per validator) | 495 µs | — |
| ML-DSA-65 verify (per validator) | 181 µs | — |
| Z-Chain Groth16 prove (n=21 validators) | ~400 ms | ~5–15 ms |
| Groth16 verify (cert-side) | 1–3 ms | 200–500 µs (batched) |
| Per-cert amortized verify (n=21) | 2–5 ms | 200–500 µs |

A linear N×ML-DSA verification at n=21 would cost ~3.8 ms per cert;
the rollup is comparable on CPU and dominates on GPU.

### VK rotation

The MLDSAGroth16 proving system has its own VK. Rotation requires:

1. Off-chain trusted-setup ceremony (Powers-of-Tau + circuit-specific
   phase-2; existing Lux ceremony artifacts at
   `~/work/lux/proofs/groth16-setup/`).
2. New VK is registered into Z-Chain via `RegisterVKTx` (this LP §3).
3. `zchain_vk_root` updates at the next epoch boundary.
4. Quasar rounds beyond the boundary verify against the new VK; older
   rounds remain verifiable against the prior VK (anchored in their
   epoch's `zchain_vk_root`).

## 2. General-purpose ZKP rollup registry

Z-Chain accepts any proof system as long as its VK is registered. The
registry is a sparse Merkle tree keyed by `vk_id`:

```
zchain_vk_root = MerkleRoot(vk_id → VKEntry)
```

```cpp
struct VKEntry {
    uint32_t proof_system;     ///< 0=Groth16, 1=Halo2, 2=Plonky2,
                               ///< 3=Risc0, 4=STARK, 5+=reserved
    uint32_t curve_id;         ///< 0=BLS12-381, 1=BN254, 2=Pasta, ...
    uint8_t  vk_hash[32];      ///< hash of the VK bytes
    uint64_t vk_offset;        ///< byte offset into vk_arena
    uint64_t vk_len;           ///< VK byte length
    uint64_t epoch_active;     ///< first epoch this VK is accepted
    uint64_t epoch_retired;    ///< 0 = active; otherwise last accepting epoch
    uint64_t fee_per_verify;   ///< gas cost on C-Chain verify precompile
};
```

### Registered systems (genesis)

| Proof system | Curve | Use case | Verify cost (cert-side) |
|---|---|---|---|
| Groth16 | BLS12-381 | MLDSAGroth16 cert lane (LP-020) | 1–3 ms CPU / 200–500 µs GPU |
| Halo2 | Pasta (Pallas/Vesta) | recursive proofs, no trusted setup | 5–10 ms CPU |
| Plonky2 | Goldilocks | fast prover, FRI-based | 3–8 ms CPU |
| Risc0 | BN254 → Groth16 wrap | RISC-V program proofs | 1–3 ms CPU (after wrap) |
| STARK | binary fields | UTXO privacy (this LP §UTXO Privacy) | 5–15 ms CPU |

New systems append; the registry never reorders.

### C-Chain verify precompile

C-Chain contracts verify proofs by calling Z-Chain's verify precompile
with `vk_id` + proof + public inputs. The precompile:

1. Resolves `vk_id` against `zchain_vk_root` in the current
   `QuasarRoundDescriptor`.
2. Selects the verifier for `proof_system`.
3. Runs the verification.
4. Returns `1` (valid) or `0` (invalid); reverts on malformed input.

```solidity
interface ZChainVerify {
    function verify(
        bytes32 vk_id,
        bytes calldata proof,
        bytes calldata public_inputs
    ) external view returns (bool);
}
```

Gas cost = `VKEntry.fee_per_verify` (set per VK at registration).

### Registration transaction

```cpp
struct RegisterVKTx {
    uint32_t proof_system;
    uint32_t curve_id;
    uint8_t  vk_bytes[];          // serialized VK
    uint64_t fee_per_verify;
    uint64_t epoch_active;
    Sig      governance_sig;      // multi-sig per LP-085
};
```

Registration requires governance signature (LP-085 governor) and a
trusted-setup attestation if the proof system requires one (Groth16
yes; Halo2/Plonky2/Risc0/STARK no).

## 3. UTXO Privacy (legacy Z-Chain content)

This section preserves the original LP-063 v1 UTXO privacy spec.
Operational; coexists with the cert-lane and registry roles above.

### UTXO Model

Each unspent output is a leaf in a Poseidon2 Merkle tree:

```
commitment = Poseidon2(value || owner_pubkey || blinding_factor)
```

The Merkle tree root is stored on-chain. Individual commitments reveal
nothing about value or owner.

### Transaction Structure

| Field | Description |
|-------|-------------|
| nullifiers[] | Poseidon2 hash of spent input commitments (prevents double-spend) |
| commitments[] | New output commitments |
| proof | STARK proof of validity |
| root | Merkle root at time of proof generation |

### STARK Circuit

The prover demonstrates (without revealing inputs):
1. Each nullifier corresponds to a commitment in the Merkle tree.
2. The prover knows the preimage (value, owner_pubkey, blinding_factor) for each input.
3. Sum of input values equals sum of output values plus fee.
4. Each output commitment is correctly formed.

STARK proofs are used for transparency (no trusted setup) and
post-quantum resistance. The STARK VK is registered in
`zchain_vk_root` under `proof_system = 4`.

### Nullifier Tracking

A nullifier set is maintained on-chain. Each nullifier can only appear
once. Submitting a duplicate nullifier reverts the transaction.

```
nullifier = Poseidon2(commitment || spending_key)
```

### Performance

| Metric | Value |
|--------|-------|
| Proof generation (2-in, 2-out) | 1.2s |
| Proof verification (on-chain) | 180,000 gas |
| Merkle tree depth | 32 (supports 4B UTXOs) |
| Nullifier set | append-only sparse Merkle tree |

## 4. Replay-proof binding

Every Z-Chain artifact (cert-lane proof, application proof, UTXO
nullifier inclusion) inherits the Quasar 3.0 replay-proof property:
proofs bind `certificate_subject`, which in turn binds
`pchain_validator_root || qchain_ceremony_root || zchain_vk_root` plus
parent block / state / execution roots. A proof for round R is
structurally invalid in round R+1 even if the public inputs would
otherwise admit a replay — the VK lookup itself fails when
`zchain_vk_root` differs.

## Security Considerations

1. **Trusted-setup discipline**: Groth16 VKs (including the cert-lane
   VK) require a trusted setup. Lux uses a Powers-of-Tau ceremony
   archived under `~/work/lux/proofs/groth16-setup/` with N>50
   contributors. A new VK that lacks a setup attestation MUST be
   rejected by `RegisterVKTx`.
2. **Blinding factors must be cryptographically random**. Reuse leaks
   value correlation in the UTXO privacy lane.
3. **Recent root requirement**: the Merkle root used in a UTXO proof
   must be within 256 blocks of the round's commitment to limit timing
   attacks.
4. **STARK proofs provide 128-bit security** with post-quantum
   resistance.
5. **MLDSAGroth16 soundness**: relies on Groth16 over BLS12-381
   (classical security ~128 bits) AND the underlying ML-DSA-65 (PQ
   security NIST level 3). Compromise of either breaks the cert lane;
   this is acceptable because Quasar 3.0 runs three lanes and any one
   suffices for finality if the others fail (LP-020 §lane independence).
6. **VK rotation atomicity**: rotation lands at epoch boundaries. A
   round straddling the boundary uses the prior epoch's VK; this is
   enforced by selecting `zchain_vk_root` from the round's descriptor,
   not from a global pointer.
7. **No trusted setup for application VKs**: Halo2, Plonky2, Risc0,
   and STARK do not require trusted setups. Their VKs are
   registrable without setup attestations.

## Reference

| Resource | Location |
|----------|----------|
| Z-Chain VM | `github.com/luxfi/zvm/` |
| Poseidon2 implementation | `github.com/luxfi/crypto/poseidon2/` |
| STARK prover | `github.com/luxfi/crypto/stark/` |
| Groth16 cert-lane prover | `github.com/luxfi/zchain/groth16/` |
| Halo2 verifier | `github.com/luxfi/zchain/halo2/` |
| Plonky2 verifier | `github.com/luxfi/zchain/plonky2/` |
| Risc0 verifier | `github.com/luxfi/zchain/risc0/` |
| Trusted-setup ceremony | `~/work/lux/proofs/groth16-setup/` |
| Cert-lane verifier wiring | LP-132 §`drain_cert_lane` |
| Quasar cert subject | LP-020 §"Cert Subject — The Replay-Proof Binding" |
| Chain topology | LP-134 §Z-Chain |

## Copyright

Copyright (C) 2021-2025, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
