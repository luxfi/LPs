---
lp: 166
title: Threshold Pre-Signing Batch Kernel
status: Final
category: Cryptography
created: 2026-04-28
---

## Abstract

Single-pass batch kernel for FROST (Schnorr) and CGGMP21 (ECDSA) threshold pre-signing rounds, processing `M` signers × `N` pre-signature slots in one GPU dispatch. Pre-signing is the round-one-only portion of each protocol — nonce generation, commitment broadcast, and per-signer scalar-mul — that does NOT depend on the message. By running `M·N` independent pre-signatures in parallel, the per-ceremony amortized cost drops from `O(M·N)` sequential rounds to `O(M)` GPU passes (`N` parallelizes within a pass). Projected speedup vs the per-slot sequential MPCVM v0.62 baseline: **5.0–7.2× at M=7 N=64**, scaling near-linearly in `N`. Round-by-round signing (after the message arrives) remains structurally CPU-only per LP-137 §3.8 (category C).

## Specification

### Algorithm

#### FROST (LP-154) batch pre-sign

Each pre-signature slot needs a pair of nonces `(d, e)` per signer, with commitments `(D = d·G, E = e·G)`:

```
frost_batch_presign(M signers, N slots):
    # Stage 1: parallel nonce generation, M*N draws
    parfor (i, j) in M x N:
        d_{i,j} = sample_uniform(Fn)
        e_{i,j} = sample_uniform(Fn)

    # Stage 2: parallel scalar-muls, M*N points
    parfor (i, j) in M x N:
        D_{i,j} = d_{i,j} * G
        E_{i,j} = e_{i,j} * G

    # Stage 3: per-slot binding factor (canonical fold)
    for j in 0..N-1:
        rho_j = H_b(j, [D_{i,j}, E_{i,j} for i in 0..M-1])  # serial within slot

    return {(d_{i,j}, e_{i,j}, D_{i,j}, E_{i,j}, rho_j)}
```

Stages 1 + 2 fan out to `M·N` threads; stage 3 is the canonical commit_root fold (one thread per slot, lane-0-leader pattern).

#### CGGMP21 (LP-155) batch pre-sign

Each slot needs a pre-signature `(R, k_i⁻¹·χ_i)` per signer:

```
cggmp21_batch_presign(M signers, N slots):
    # Stage 1: parallel nonce + chi-share generation
    parfor (i, j) in M x N:
        k_{i,j}    = sample_uniform(Fn)
        gamma_{i,j} = sample_uniform(Fn)

    # Stage 2: MtA pair products (the M*M*N quadratic blow-up)
    parfor (i, i', j) in M x M x N where i != i':
        share_{i,i',j} = mta_send(k_{i,j}, gamma_{i',j})

    # Stage 3: per-slot R combination + chi distribution
    for j in 0..N-1:
        Gamma_j = sum_i (gamma_{i,j} * G)              # serial within slot
        R_j     = (Gamma_j)^{1/k_j}                    # k_j = sum k_{i,j}
        chi_{i,j} = k_{i,j} * x_i + sum_{i'} share_{i,i',j}

    return {(k_{i,j}, R_j, chi_{i,j})}
```

The `M·M·N` MtA quadratic in stage 2 is the dominant cost; running it in one kernel pass saves `M-1` round-trips per slot. Stage 3 is canonical fold per slot.

### Determinism

The randomness source `sample_uniform(Fn)` is deterministic on a session-bound seed (RFC 8032 sect. 5.1.6 nonce derivation pattern, applied per `(session_id, signer_id, slot_id)`). No reproducible pre-signature shall escape the session — slot consumption is single-shot.

The canonical fold (stages 3 of both protocols) runs as a per-slot single thread. Byte-equality across CPU/Metal/CUDA/WGSL is asserted on stage 3 outputs; stage 1 + 2 outputs are checked via Schnorr / ECDSA verification of the post-pre-sign cooked signatures.

### KAT

- FROST: cross-oracle against `frost-secp256k1-tr v2.1` (Rust, test-only via `frost/test/cmake/zcash_frost.cmake`); 5-of-7 threshold, `N ∈ {1, 4, 16, 64, 256}`, 50 random `(session, signers)` per `N`.
- CGGMP21: cross-oracle against `multi-party-ecdsa v0.8.1` (Rust, test-only); same threshold and slot counts.
- `luxcpp/crypto/{frost,cggmp21}/test/batch_presign_kat.json`.

### Performance target

End-to-end pre-sign throughput at threshold 5-of-7, secp256k1, median 25 runs:

| Protocol | `N` slots | Prior (sequential v0.62) | LP-166 batch | Ratio |
|---|---:|---|---|---:|
| FROST | 1 | 48.3 ms (M1, MPCVM v0.62 measured) | 48.3 ms (no batch) | 1.0× |
| FROST | 16 | 772 ms | 152 ms (proj) | 5.08× |
| FROST | 64 | 3 091 ms | 458 ms (proj) | 6.75× |
| CGGMP21 | 1 | 507 ms (M1, MPCVM v0.62 18.6× line) | 507 ms (no batch) | 1.0× |
| CGGMP21 | 16 | 8 112 ms | 1 142 ms (proj) | 7.10× |
| CGGMP21 | 64 | 32 448 ms | 4 506 ms (proj) | 7.20× |

Round-by-round message-signing (after the message lands) is unchanged — the post-pre-sign per-signature combination remains a serial protocol round and falls under LP-137 §3.8 category C. Final numbers in the impl commit BENCHMARKS.md.

## Implementation

### CPU canonical

- `luxcpp/crypto/frost/cpp/frost_batch_presign.{hpp,cpp}` (NEW).
- `luxcpp/crypto/cggmp21/cpp/cggmp21_batch_presign.{hpp,cpp}` (NEW).
- Shares the secp256k1 scalar-mul + batch-inversion kernels from LP-160 + per-curve `curve_traits` from LP-161.

### GPU kernels

- Metal:
  - `luxcpp/crypto/frost/gpu/metal/frost_batch_presign.metal` (NEW).
  - `luxcpp/crypto/cggmp21/gpu/metal/cggmp21_batch_presign.metal` (NEW).
- CUDA:
  - `luxcpp/crypto/frost/gpu/cuda/frost_batch_presign.cu` (NEW).
  - `luxcpp/crypto/cggmp21/gpu/cuda/cggmp21_batch_presign.cu` (NEW).
- WGSL:
  - `luxcpp/crypto/frost/gpu/wgsl/frost_batch_presign.wgsl` (NEW).
  - `luxcpp/crypto/cggmp21/gpu/wgsl/cggmp21_batch_presign.wgsl` (NEW).
- Driver host code: same dirs.

### C-ABI surface

```c
// FROST batch pre-sign — outputs M*N nonce pairs + N binding factors
int frost_batch_presign(uint32_t       M,                 // signers
                        uint32_t       N,                 // slots
                        const uint8_t *session_seed,      // 32 bytes
                        const uint8_t *signer_ids,        // M * 8 bytes
                        uint8_t       *nonce_pairs_out,   // M*N * 64 bytes (d,e)
                        uint8_t       *commit_pairs_out,  // M*N * 66 bytes (D,E compressed)
                        uint8_t       *binding_out);      // N * 32 bytes (rho)

// CGGMP21 batch pre-sign — outputs M*N k-shares + N R values + M*N chi shares
int cggmp21_batch_presign(uint32_t       M,
                          uint32_t       N,
                          const uint8_t *session_seed,
                          const uint8_t *key_shares,      // M * 32 bytes (x_i)
                          uint8_t       *k_shares_out,    // M*N * 32 bytes
                          uint8_t       *R_out,           // N * 33 bytes (compressed secp256k1)
                          uint8_t       *chi_out);        // M*N * 32 bytes
```

Output buffers are pre-signature material — the caller MUST treat them as one-shot, single-use, session-scoped key material. Reusing a slot across two messages is catastrophic (reveals the long-term key).

### Determinism harness

- `luxcpp/crypto/{frost,cggmp21}/test/batch_presign_test.{cpp,mm,cu}` — `M ∈ {3, 5, 7}`, `N ∈ {1, 4, 16, 64}`, 25 random `(session_seed, signer_ids, key_shares)` triples per `(M, N)`. Stage 3 outputs byte-equal CPU vs Metal vs CUDA vs WGSL; stage 1+2 outputs Schnorr/ECDSA-verified after a synthetic message is supplied.

## Cryptographic safety

- Pre-signature material `(d, e, k, gamma)` is **secret** — leakage of any one of these reveals the long-term signing key. Constant-time scalar mul (LP-147 secp256k1, branchless `pt_cmov`) is mandatory. The blinded MSM path (LP-137 §2.5) does NOT apply here because pre-sign scalar muls have nothing to blind against — the scalars themselves ARE the secret.
- The deterministic nonce derivation `RFC 8032 §5.1.6` MUST seed each `sample_uniform` call with `(session_id || signer_id || slot_id)`. **Slot reuse is forbidden.** The kernel does not enforce slot-uniqueness — the caller (MPCVM session manager) is responsible.
- The CGGMP21 MtA send (`mta_send`) requires both signers' Paillier-style ZK proofs of well-formedness. LP-166 covers the **scalar arithmetic** for stage 2; the Paillier proofs run on the CPU side per round (category C, intra-ceremony) and are NOT batched.
- Batch sizes `M ≤ 32`, `N ≤ 1024` enforced by the kernel — larger batches force a re-dispatch. Defends against a hostile session manager pushing `M·N > 2^20` and exhausting GPU memory.

## Crossover

| `(M, N)` | Backend | Path |
|---|---|---|
| `M=1` (single-signer ECDSA / Schnorr) | any | LP-147 single-key path |
| `(M, N=1)` | CPU | sequential pre-sign (existing MPCVM path) |
| `(M, N≥4)` | Metal/CUDA/WGSL | LP-166 batch kernel |
| `(M, N≥4)` | CPU | tiled batch on goroutine pool (no GPU) |

The threshold protocol round-by-round signing (post-pre-sign) remains CPU-only per LP-137 §3.8 category C — a round can't start until the previous round's transcript lands, so there's no parallelism to harvest above the pre-sign stage.

## References

- Komlo, Goldberg, "FROST: Flexible Round-Optimized Schnorr Threshold Signatures" (SAC 2020) — pre-signing nonce structure
- Canetti, Gennaro, Goldfeder, Makriyannis, Peled, "UC Non-Interactive, Proactive, Threshold ECDSA with Identifiable Aborts" (CCS 2020) = CGGMP21
- Lindell, Nof, "Fast Secure Multiparty ECDSA with Practical Distributed Key Generation and Applications to Cryptocurrency Custody" (CCS 2018) — MtA primitive
- LP-137 (umbrella, §3.8 category C round-by-round; §2.5 secret-scalar discipline)
- LP-154 (FROST Threshold Schnorr — primary FROST consumer)
- LP-155 (CGGMP21 Threshold ECDSA — primary CGGMP21 consumer)
- LP-076 (Universal Threshold Framework)
- LP-019 (Threshold MPC for Bridge Signing)
- LP-160 (batch inversion — used inside MtA share aggregation)
- LP-161 (multi-curve MSM — used inside FROST commit aggregation)
- Forward-references: `luxcpp/crypto@<sha>` impl commit (CTO agent #7, in flight)
