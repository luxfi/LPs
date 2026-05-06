# PQ-Everything: per-use-site map

**Status as of 2026-05-02.** What is classical, what replaces it, what's already done.

Cross-refs: LP-012 (PQ GPU), LP-019 (Threshold MPC), LP-020 (Quasar consensus), LP-070 (ML-DSA), LP-073 (Pulsar), LP-075 (BLS), LP-149 (hash precompiles), LP-178 (per-algo CI).

## Threat model

Adversary with a fault-tolerant quantum computer running Shor against discrete-log primitives (secp256k1, Ed25519, sr25519, BLS12-381 pairing groups) and Grover against symmetric primitives (AES, SHA-2, BLAKE2/3, Keccak). Practical horizon: 10-25 years for a 4096-qubit FT machine; record-now-decrypt-later applies today.

Symmetric/hash primitives stay PQ-secure at 256-bit security level (Grover gives √n speedup; AES-256 → 128-bit PQ, SHA-256/BLAKE2b/BLAKE3 → 128-bit PQ, all acceptable). The real damage is in asymmetric: signatures and key exchange.

## Use-site map

| Use site | Classical | PQ replacement | Status | LP |
|----------|-----------|----------------|--------|-----|
| **Consensus aggregate** | BLS12-381 (48-byte aggregate) | Pulsar (~33 KB threshold) parallel-signed alongside BLS | LIVE — Quasar triple sign | LP-020, LP-073, LP-075 |
| **Per-validator identity** | Ed25519 staker signature | ML-DSA-65 (FIPS 204, ~3.3 KB) parallel proof | LIVE | LP-070 |
| **EVM tx signing (user wallet)** | secp256k1 ECDSA | ML-DSA-44 in EVM precompile + opt-in tx envelope | DESIGN — LP-149 has BLAKE3 precompile, ML-DSA-tx LP pending | (gap) |
| **EVM precompile hash** | SHA-256, RIPEMD-160, BLAKE2F | unchanged + add BLAKE3 precompile | DONE | LP-149 |
| **Bridge MPC (ECDSA threshold)** | CGGMP21 over secp256k1 | Pulsar (linear shares, no Paillier MtA) for outgoing-bridge sigs | PARTIAL — Pulsar Go canonical + C++ M1-M3 byte-equal; M4 Sign+Verify in flight | LP-019, LP-073 |
| **Bridge MPC (Schnorr threshold)** | FROST over Ed25519 | FROST-PQ via threshold ML-DSA OR Pulsar multi-sig | DESIGN | LP-076 |
| **DKG / key resharing** | Pedersen DKG over secp/Ed | Pedersen DKG over R_q (Pulsar's ring) | DESIGN — sketched in LP-019 §5 | LP-019 |
| **TLS 1.3 KEX** | X25519, P-256 ECDHE | ML-KEM-768 (FIPS 203) hybrid | LIVE — Go 1.26 default since 2026-04 | (Go stdlib) |
| **TLS 1.3 cert sig** | Ed25519, RSA, P-256 ECDSA | ML-DSA-65 (FIPS 204) hybrid certs | DESIGN — Go 1.26 has the primitives, cert chain rollout pending | LP-070 |
| **gRPC / ZAP transport sig** | Ed25519 mTLS | inherits TLS 1.3 PQ migration | follows TLS rollout | LP-022 |
| **Wallet HD derivation** | BIP32 (secp256k1) | post-quantum key trees (one-time-use ML-DSA + lamport hashes per leaf) | DESIGN | LP-076 |
| **Light-client proof of inclusion** | KZG (BLS12-381 commitment) | Verkle (Pedersen + Ipa, Bandersnatch) → eventual lattice commitments | PARTIAL — Verkle live; lattice commits research | LP-077 |
| **FHE (confidential contracts)** | already lattice (BGV/CKKS) | unchanged — already PQ-secure by construction | LIVE | LP-013 |
| **Long-term archive** | nothing yet | SLH-DSA (FIPS 205, hash-based, conservative PQ) for L1 anchor sigs | DESIGN — primitive in luxcpp/crypto, deployment pending | LP-012 |
| **Validator BLS staker sig** | BLS12-381 sign-on-stake | dual-stage: BLS classical fast path + ML-DSA-65 PQ proof at epoch boundary | LIVE in Quasar | LP-020 |
| **Symmetric cipher (state encryption, KMS sealing)** | AES-256-GCM, ChaCha20-Poly1305 | unchanged (Grover-tolerant at 256-bit) | LIVE | (KMS) |
| **Hash transcripts (consensus, MAC, PRF)** | BLAKE2b / BLAKE3 / Keccak / SHA-256 | unchanged (256-bit hashes are PQ-secure) | LIVE | LP-073 §9.1 |

## What "PQ everything" means concretely

It does not mean "rip out classical." Quasar's design — and the rest of this stack — is **hybrid and parallel**, not replace-and-pray:

1. **Triple-sign consensus.** Every Q-chain block carries (BLS aggregate ∥ Pulsar aggregate ∥ ML-DSA-65 per-validator). Acceptance is `BLS.Verify ∧ (Pulsar.Verify ∨ MLDSA.Verify)`. Quantum adversary breaking BLS in private gets one half; needs to break Pulsar or ML-DSA to forge a block. Falls back to ML-DSA when Pulsar liveness fails.
2. **Hybrid TLS.** ML-KEM-768 piggybacks on X25519 — both must be broken to recover the session key. Already shipping in Go 1.26.
3. **Layered bridge.** For now, bridge MPC stays on CGGMP21 ECDSA (record-now-decrypt-later threat is bounded by the 7-day lockup). When Pulsar M4+M5 land, bridge can run in parallel-sig mode (BLS+Pulsar) with an opt-in PQ-only mode for high-value flows.
4. **No weakening for symmetric.** AES-256, SHA-256, BLAKE2b, Keccak — all stay. Grover's √n advantage means 256-bit primitives give 128-bit PQ security, which is what NIST and the IETF have settled on as adequate.

## What's actually blocking full PQ

Not algorithm choice — those are settled (NIST PQC round 4). The blockers are:

1. **Wallet / RPC ecosystem.** EVM tooling assumes secp256k1 in too many places (MetaMask, hardware wallets, EIP-712, CREATE2 addresses). PQ tx envelope needs an EIP that introduces a new sig curve identifier, then a multi-year rollout.
2. **Hardware wallet support.** Ledger/Trezor have no ML-DSA firmware. Pulsar has no firmware anywhere yet.
3. **Aggregate proof size.** Pulsar aggregate is ~33 KB vs BLS 48 bytes. Quasar's bandwidth budget tolerates it (per-block PQ is ~5% of typical EVM block size); but light clients optimizing for bytes-on-chain will keep BLS as the canonical primary aggregate for years.
4. **Performance.** Pulsar signing is ~600 ms aggregate at K=21 validators on M2 Ultra (Go canonical). LP-137 GPU plan brings this down ~10×. Until M5 (Metal/CUDA/WGSL byte-equal) lands, Pulsar is CPU-only and the bandwidth-throughput tradeoff disfavors making it the primary lane.
5. **DKG without trusted dealer.** `sign.Gen` in luxfi/ringtail still uses a trusted dealer for Shamir setup. Pedersen-DKG-over-R_q is sketched in LP-019 §5; until built, fully-decentralized PQ threshold sig is incomplete.

## Hash-layer choice (LP-073 §9.1)

Recorded decision: **BLAKE2b in Lattigo PRNG, BLAKE3 in Pulsar transcripts, both in LP-149 EVM precompiles.** Validated empirically by `ringtail_blake_bench` (luxcpp/crypto):

```
                 64 B      1 KiB     64 KiB    1 MiB
BLAKE3 (out=32)  506 MB/s  538 MB/s  519 MB/s  515 MB/s
BLAKE2b-512      400 MB/s  867 MB/s  875 MB/s  851 MB/s
```

Portable scalar path (no SIMD). BLAKE2b is ~1.6× faster on bulk data — which is exactly Lattigo's hot path (sequential XOF byte stream). BLAKE3's tree-mode parallelism wins only with vectorized backend on multi-KiB inputs; not relevant to per-sample 8-byte reads.

## What I am not claiming

- "Lux is fully PQ today." The L1 consensus is PQ-resilient via Quasar; tx-layer wallet flow is not.
- "Pulsar is faster than BLS." It isn't, won't be, and doesn't need to be — it's the PQ liveness lane, not the throughput lane.
- "PQ migration is complete." It's a multi-year ecosystem migration (wallets, hardware, RPC tooling), and parts of it are gated on industry standards we don't control.

The accurate one-line summary: **consensus and TLS are PQ-resilient with hybrid layering; bridge is PQ-ready in Q3 2026 once Pulsar M4-M5 land; wallet is the long-tail problem, gated on hardware-wallet vendors and an EVM tx envelope EIP.**
