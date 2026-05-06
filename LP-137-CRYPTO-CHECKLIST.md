---
lp: 137-CRYPTO-CHECKLIST
title: LP-137 Crypto Correctness Checklist
author: Lux Core Team <dev@lux.network>
status: Active
type: Standards Track Companion
category: Core
created: 2026-04-28
parent: lp-137
repos:
  - luxcpp/crypto
  - lux/crypto
verifies:
  - luxcpp/crypto@7303b178
  - lux/crypto@9a535f7b
audit-corroboration: scientist commit a73f853
---

# LP-137 Crypto Correctness Checklist

Per-algorithm mapping of:

1. Mathematical correctness anchor (published spec).
2. KAT vector source + count.
3. Per-backend dispatch coverage (CPU canonical, Metal, CUDA, WGSL).
4. Whether each GPU backend has a real device dispatch on the test host.
5. Second oracle providing adversarial-distance cross-verification.

Verification SHAs at audit time:

| Repo | SHA | Date |
|---|---|---|
| `luxcpp/crypto` | `7303b178` | 2026-04-28 |
| `lux/crypto` | `9a535f7b` | 2026-04-28 |
| `lux/lps` | `e9bed618` (branch base) | 2026-04-28 |

Test-host context: Apple M1 Max, macOS 26.4, Apple Clang 17. Metal real
dispatch requires `*_METALLIB` env vars per algorithm; without them, every
Metal test gates and skip-passes (file path + line cited inline). CUDA
tests skip-with-PASS on Apple (no NVIDIA driver) and run on Linux+CUDA CI
hosts. WGSL via `wgpu-native` is dispatchable on M1 but tests are gated on
`*_WGPU_*` env in the same pattern.

## Legend

- **Real-GPU** = % of KAT vectors that flowed through a GPU device on the
  test host that ran the most recent CI session this audit verified
  (M1 Max, no `*_METALLIB` set, no NVIDIA, no WGPU env). On a Linux CUDA
  CI host with CUDA libs and `*_METALLIB` paths exported the structural
  tests promote to real dispatch and the column rises accordingly.
- **structural** = test compiles + links + runs but skips real device
  dispatch when env unset; emits "(skip GPU equality: <ENV> unset)" and
  exits 0.
- **real** = at least one path in the test calls `MTLCreateSystemDefault
  Device` / `cuLaunchKernel` / `wgpuDevice*` and asserts byte-equal CPU.
- **n/a** = no kernel for that backend at this SHA.
- **gnark/ark/blst/PQClean/RFC** = audited test oracle pinned at
  `<alg>/test/cmake/<oracle>.cmake` or `<alg>/test/tools/<oracle>/`.
  Never linked into shipped libraries (LP-137 §46 invariant; CI-asserted
  by `cevm/test/unittests/no_blst_in_production_test.sh`).

## Canonical Table

| # | Algorithm | Spec | KAT vectors | CPU-canonical | Metal | CUDA | WGSL | Real-GPU | 2nd Oracle |
|---|---|---|---|---|---|---|---|---|---|
| 1 | SHA-256 | FIPS 180-4 §6.2 | 4 FIPS 180-4 App.B vectors (`sha256_test.cpp:42-63`) + 100 random byte-equal | `sha256/cpp/` 734 LOC | `sha256/gpu/metal/sha256.metal` 135 LOC, structural (env `CRYPTO_SHA256_METALLIB`, `sha256_metal_test.cpp:49-51`) | `sha256/gpu/cuda/sha256.cu` 148 LOC, structural | `sha256/gpu/wgsl/sha256.wgsl` 196 LOC, structural | 0% on M1 (env unset); 100% on CI runner with metallib | `gpu/wgpu` second oracle via wgsl path; FIPS 180-4 App.B is its own published reference |
| 2 | Keccak-256 / SHA3 | FIPS 202 §6.2 | 3 FIPS 202 vectors (`keccak_test.cpp`) + service-batch round cache (`KeccakResidencySession`, ≥0.50 hit rate) | `keccak/cpp/keccak.cpp` 144 LOC + `keccak_service.cpp` | `keccak/gpu/metal/keccak.metal` 135 LOC, structural | `keccak/gpu/cuda/keccak.cu` 116 LOC, structural | `keccak/gpu/wgsl/keccak.wgsl` 226 LOC, structural | 0% on M1; gated by `kQuasarSubstrateMetalThreshold = 8192` for production routing (`CROSSOVER.md:48`) | FIPS 202 published reference; KeccakTeam test vectors |
| 3 | RIPEMD-160 | Dobbertin-Bosselaers-Preneel 1996 | 5 Dobbertin et al. 1996 vectors (`ripemd160_test.cpp`) + 100 random byte-equal | `ripemd160/cpp/` 221 LOC | `ripemd160/gpu/metal/ripemd160.metal` 172 LOC, structural | `ripemd160/gpu/cuda/ripemd160.cu` 191 LOC, structural | `ripemd160/gpu/wgsl/ripemd160.wgsl` 199 LOC, structural | 0% on M1 | RIPEMD-160 test vectors from cosic.esat.kuleuven.be reference |
| 4 | BLAKE2b | RFC 7693 | 2 RFC 7693 App.A vectors (`blake2b_test.cpp`) + 100 random byte-equal | `blake2b/cpp/` 85 LOC | `blake2b/gpu/metal/blake2b.metal` 140 LOC, structural (env `CRYPTO_BLAKE2B_METALLIB`, `blake2b_metal_test.cpp:44-46`) | `blake2b/gpu/cuda/blake2b.cu` 197 LOC, structural | `blake2b/gpu/wgsl/blake2b.wgsl` 236 LOC, structural | 0% on M1 | RFC 7693 published reference |
| 5 | BLAKE3 | BLAKE3 paper (Aumasson-Neves-Wilcox-O'Hearn-Winnerlein 2020) | 35 official BLAKE3 cases × 4 modes = **140 byte-equal assertions** (`blake3/test/vectors/test_vectors.json`, sourced github.com/BLAKE3-team/BLAKE3) | `blake3/cpp/` 386 LOC | `blake3/gpu/metal/blake3.metal` 624 LOC, structural | `blake3/gpu/cuda/blake3.cu` 315 LOC, structural | `blake3/gpu/wgsl/blake3.wgsl` 155 LOC, structural | 0% on M1 | Upstream BLAKE3-team JSON suite |
| 6 | ChaCha20-Poly1305 | RFC 8439 | RFC 8439 §2.8.2 canonical + §2.3-§A.5 sweep + 10 seal/open roundtrips with tamper-tag/tamper-ct rejection (`aead_test.cpp`, `aead_kat_test.cpp`) | `aead/cpp/aead.cpp` 871 LOC (covers both AEADs) | `aead/gpu/metal/aead.metal` 297 LOC, structural (env `LUX_CRYPTO_AEAD_METALLIB`, `aead_metal_test.cpp:60-64`) | `aead/gpu/cuda/aead.cu` 427 LOC, structural | `aead/gpu/wgsl/aead.wgsl` 456 LOC, structural | 0% on M1 | RFC 8439 published; LP-137 §2.3 documents 26.7× claim is unreproducible (`aead_metal_bench` SKIPs without env) |
| 7 | AES-256-GCM | NIST SP 800-38D | 5 NIST CAVS `gcmEncryptExtIV256.rsp` Keylen=256 IVlen=96 vectors (`aead_kat_test.cpp` - shares harness with ChaCha20) | (shared with #6) | `aead/gpu/metal/` (shared) + `aes_gcm_metal_determinism_test.mm`, structural | (shared) | (shared) | 0% on M1 | NIST CAVS published vectors |
| 8 | Ed25519 | RFC 8032 §7.1 | **8 RFC 8032 §7.1 + Bernstein/donna sign.input vectors** (`ed25519_kat_test.cpp:5-17`) + 10 random-seed roundtrips + 96 byte-flip negatives = **100 byte-equal vectors** (LP-137 §2.3 line 173) | `ed25519/cpp/` 107 LOC + ed25519-donna FetchContent | `ed25519/gpu/metal/ed25519.metal` 437 LOC, structural (env `LUX_CRYPTO_ED25519_METALLIB`, `ed25519_metal_test.cpp:206-208`); LP-137 reports N_threshold=256, 26.7× at N=4096 in `ed25519_metal_bench.cpp` | `ed25519/gpu/cuda/ed25519.cu` 451 LOC, structural | `ed25519/gpu/wgsl/ed25519.wgsl` 188 LOC, structural | 0% on M1 (env unset); CI host with metallib reaches >99% | RFC 8032 published; ed25519-donna FetchContent is the test oracle |
| 9 | secp256k1 (sign/verify/ecrecover) | SEC 2 v2.0 + RFC 6979 | 9 BIP-340/SEC1 cases (`secp256k1_test.cpp`) + ECDSA roundtrip + Montgomery batch_inv + ecrecover pipeline | `secp256k1/cpp/` 5627 LOC across `ecrecover.cpp` + `batch_inv.cpp` + headers (`field.hpp`, `curve.hpp`, `windowed_g_table.hpp`) | `secp256k1/gpu/metal/` 1397 LOC; **structural** at SHA `7303b178` (gated on `CRYPTO_SECP256K1_METALLIB` env). LP-137 reports N=168 crossover (`CROSSOVER.md:31`) | `secp256k1/gpu/cuda/` 685 LOC, structural | `secp256k1/gpu/wgsl/` 695 LOC, structural | 0% on M1 (env unset) | bitcoin-core/secp256k1 vendored as test-only oracle (LP-137 §2.8) |
| 10 | secp256r1 / P-256 | SEC 2 v2.0, NIST FIPS 186-4 | 0 first-party KAT vectors at SHA `7303b178` (test/ dir does not exist; LP-137 `COVERAGE.md:54` "(CPU body wired, no test yet)") | `secp256r1/cpp/secp256r1.cpp` 64 LOC (compiles via deps/intx + deps/evmmax + cevm support headers) | n/a | n/a | n/a | n/a | **MISSING-KAT** — body wired but no published-vector tests |
| 11 | BLS12-381 (sign/verify/aggregate/Miller/final-exp) | IETF draft-irtf-cfrg-bls-signature-05; Barbulescu-Duquesne 2017 (BLS12-381 curve) | 8 oracle/test pairs covering Fp tower, G2, Miller, final-exp, pairing, fused, signature, subgroup (`bls/test/*.{cpp,mm}`); blst pinned at `bls/test/cmake/blst.cmake`; LP-137 §2.3 reports **144.22× fused** | `bls/cpp/{bls,bls_fused,bls_pairing,bls_signature}.cpp` ~356 LOC | `bls/gpu/metal/` 647 LOC, structural; `bls_fp_tower_test.mm` requires metallib for Metal cmp; LP-137 §STAGE5_PERFORMANCE notes single-pairing structural limit (606 dispatches) | `bls/gpu/cuda/` 47 LOC (skeleton), structural | `bls/gpu/wgsl/` 322 LOC, structural; `bls_fp_tower_wgsl_test.cpp` exists | 0% on M1 (Metal pairing CPU-only by `CROSSOVER.md:34`); ~9.24×–16.51× on CPU host blst-aware (cevm v0.45–v0.47.1) | `blst` test-only oracle (LP-137 §46 production-link invariant) |
| 12 | BN254 (G1/G2/Fp12 pairing + h2c) | EIP-196, EIP-197, EIP-198, RFC 9380 SVDW | **36 KAT vectors vs gnark v0.19.2** (`bn254_kat_test.cpp` 267 LOC + `bn254_pairing_kat.h` + `bn254_h2c_kat.h`); scientist audit `a73f853` confirmed `36 passed, 0 failed`; LP-137 §2.3 line 166 | `bn254/cpp/` 6 hpp + `bn254.cpp` 371 LOC + `bn254_pairing.cpp` + `bn254_hash_to_curve.cpp`, ~2498 LOC total | `bn254/gpu/metal/bn254.metal` 551 LOC, structural (env `LUX_CRYPTO_BN254_METALLIB`, `bn254_metal_determinism_test.mm:136-140`) | `bn254/gpu/cuda/bn254.cu` 618 LOC, structural | `bn254/gpu/wgsl/bn254.wgsl` 804 LOC, structural; LP-137 §6 #228 notes WGSL Miller kernel landed but CI verification pending | 0% on M1 | **arkworks `ark-bn254` 0.5** at `bn254/test/tools/ark_oracle/Cargo.toml`; LP-137 §2.3 + scientist audit confirm two-oracle (gnark + ark) cross-check (Red O2/O4 closure) |
| 13 | Banderwagon (Bandersnatch + ipa-multihash) | Hopwood-Bowe-Hopwood "Banderwagon" 2022; Diamond-Posen IPA prime-order; Hopwood-Bowe-Hopwood-Hopwood "Bandersnatch" curve note | **16 element-encode KAT + 16 off-subgroup-reject + 10 Fp + 10 Fr + 1000 MSM** (`element_kat.h:23`, `fp_kat.h:21`, `fr_kat.h:21`, `multiexp_kat.h:23` — 1000 MSM seeds vs `MultiExpConfig{ScalarsMont:true}`, LP-137 §2.3 line 167) | `banderwagon/cpp/` 817 LOC | `banderwagon/gpu/metal/banderwagon.metal` 51 LOC (skeleton), structural (env `LUX_CRYPTO_BANDERWAGON_METALLIB`, `banderwagon_metal_determinism_test.mm:100-102`) | `banderwagon/gpu/cuda/banderwagon.cu` 552 LOC, structural | `banderwagon/gpu/wgsl/banderwagon.wgsl` 460 LOC, structural | 0% on M1 | **arkworks `ark-bls12-381` + `ark-ed-on-bls12-381-bandersnatch` 0.5** at `banderwagon/test/tools/ark_oracle/Cargo.toml`; gnark-crypto v0.20.1 is the primary oracle (`go.mod:6`) — divergent codebases per LP-137 §2.3 §2.5 (Red O2/O4 closure) |
| 14 | KZG (EIP-4844) | EIP-4844, draft-irtf-cfrg-kzg | EIP-4844 KAT (`kzg_eip4844_test.cpp` 555 LOC + `kzg_test.cpp`) | `kzg/cpp/` 176 LOC; **NOTIMPL in production crypto/** per LP-137 `COVERAGE.md:53` (kzg.cpp uses 60+ blst symbols; LP-137 §46 invariant — kzg compiled only via `cevm_bls_kzg_canonical_cpu` test-oracle path) | `kzg/gpu/metal/kzg.metal` 437 LOC, structural; `kzg_gpu_determinism_test.cpp` runs the GPU equivalence | `kzg/gpu/cuda/kzg.cu` 247 LOC, structural | `kzg/gpu/wgsl/kzg.wgsl` 266 LOC, structural | 0% on M1 (also blocked production-side); `cevm` path has Metal real dispatch | `c-kzg-4844` upstream (EF) test vectors; trusted setup at `lux/crypto/kzg4844/trusted_setup.json` |
| 15 | IPA (Bulletproofs over Banderwagon) | Bünz-Bootle-Boneh-Poelstra-Wuille-Maxwell 2018; LP-137 §6 commit `aceb0d61` | `ipa_kat_test.cpp` 201 LOC + `ipa_test.cpp` (no GPU determinism tests); LP-137 §3.4 "no first-party body authored" → updated `aceb0d61` shipped CPU body | `ipa/cpp/ipa.cpp` 554 LOC | n/a (no metal/cuda/wgsl directory at SHA `7303b178`) | n/a | n/a | n/a | gnark-crypto wrapper at `lux/crypto/ipa/`; **MISSING-GPU** — LP-137 §3.8 Class B "GPU-feasible body shipped, kernel pending" |
| 16 | Verkle (tree, polycommit, multiproof) | Buterin "Verkle Trees" 2021; ietf-eth-verkle-trees draft | `lux/crypto/verkle/*_test.go` 11 test files (Go side); luxcpp/crypto/verkle/ is **25 LOC stub** | `lux/crypto/verkle/` Go canonical (full); `luxcpp/crypto/verkle/cpp/` 25 LOC stub | n/a | n/a | n/a | n/a | go-verkle (Diamond) reference; **MISSING-GPU** — LP-137 §3.8 Class B + LP-137 §6 #205 follow-up "ipa-banderwagon Go binding" |
| 17 | ML-KEM (FIPS 203) | FIPS 203 (final, 2024-08-13) | `mldsa_kat_test.cpp` 263 LOC, KAT vectors via PQClean FetchContent (LP-137 §3.5 commit `4b3ad371`); intervariant ML-KEM-512/768/1024 | `mlkem/cpp/` 50 LOC + PQClean vendored at `pqclean_kat/` | `mlkem/gpu/metal/mlkem.metal` 355 LOC, structural | `mlkem/gpu/cuda/mlkem.cu` 258 LOC, structural | `mlkem/gpu/wgsl/mlkem.wgsl` 198 LOC, structural | 0% on M1 | **PQClean** (independent C reference) at `crypto/mlkem/test/cmake/pqclean.cmake` — divergent from any pq-crystals upstream |
| 18 | ML-DSA (FIPS 204) | FIPS 204 (final, 2024-08-13) | `mldsa_kat_test.cpp` 263 LOC, KAT vectors via PQClean FetchContent; ML-DSA-44/65/87 | `mldsa/cpp/` 69 LOC + PQClean vendored | `mldsa/gpu/metal/mldsa.metal` 369 LOC, structural | `mldsa/gpu/cuda/mldsa.cu` 247 LOC, structural | `mldsa/gpu/wgsl/mldsa.wgsl` 124 LOC, structural | 0% on M1 | **PQClean** at `crypto/mldsa/test/cmake/pqclean.cmake` |
| 19 | SLH-DSA (FIPS 205) | FIPS 205 (final, 2024-08-13) | `slhdsa_kat_test.cpp` 272 LOC, KAT vectors via PQClean FetchContent | `slhdsa/cpp/` 122 LOC + PQClean vendored | `slhdsa/gpu/metal/slhdsa.metal` 415 LOC, structural | `slhdsa/gpu/cuda/slhdsa.cu` 376 LOC, structural | `slhdsa/gpu/wgsl/slhdsa.wgsl` 231 LOC, structural | 0% on M1 | **PQClean** at `crypto/slhdsa/test/cmake/pqclean.cmake` |
| 20 | Lamport OTS | Lamport 1979 (one-time signatures from one-way functions) | `lamport_test.cpp` 187 LOC + `lamport_cabi_test.cpp` (CPU/c-abi); 7 GPU determinism tests across Metal/CUDA/WGSL | `lamport/cpp/` 67 LOC | `lamport/gpu/metal/lamport.metal` 92 LOC + `lamport_metal_determinism_test.cpp` + `lamport_metal_bench.cpp`, structural | `lamport/gpu/cuda/lamport.cu` 90 LOC + `lamport_cuda_determinism_test.cpp`, structural | `lamport/gpu/wgsl/lamport.wgsl` 100 LOC + `lamport_wgsl_determinism_test.cpp`, structural | 0% on M1 | RFC-style Lamport reference + lux/crypto/lamport `kat_vectors_test.go` Go oracle |
| 21 | Pedersen (commitment + FromSeed) | Pedersen 1991; RFC 9380 SVDW for BN254 G1 (LP-137 §2.4) | `pedersen_kat_test.cpp` 268 LOC + `pedersen_test.cpp` 91 LOC; **golden vector** for `seed=[0..31]` G/H frozen at LP-137 §2.4 | `pedersen/cpp/pedersen.cpp` 91 LOC | `pedersen/gpu/metal/pedersen.metal` 663 LOC + `pedersen_metal_determinism_test.mm`, structural (env `LUX_CRYPTO_PEDERSEN_METALLIB` AND `LUX_CRYPTO_PEDERSEN_KAT`, lines 58-61) | `pedersen/gpu/cuda/pedersen.cu` 562 LOC, structural | `pedersen/gpu/wgsl/pedersen.wgsl` 560 LOC + `pedersen_wgpu_determinism_test.cpp`, structural | 0% on M1 | gnark-crypto v0.20.1 at `pedersen/test/tools/gen_pedersen_kat.go`; LP-137 §2.4 brand-neutral DST `PEDERSEN_SEEDED_GEN_V1` |
| 22 | Poseidon2 | Grassi-Khovratovich-Rønjom-Schofnegger "Poseidon2" 2023 | `poseidon_kat_test.cpp` 273 LOC + `poseidon_test.cpp` 146 LOC + `poseidon_metal_test.cpp`; vectors at `poseidon/test/vectors/poseidon2_t2_kat.json` | `poseidon/cpp/` 146 LOC | `poseidon/gpu/metal/poseidon.metal` 459 LOC + `poseidon_metal_determinism_test.mm`, structural (env `LUX_CRYPTO_POSEIDON2_METALLIB`, lines 48-50) | `poseidon/gpu/cuda/poseidon.cu` 376 LOC + `poseidon_cuda_determinism_test.cpp`, structural | `poseidon/gpu/wgsl/poseidon.wgsl` 467 LOC + `poseidon_wgsl_determinism_test.cpp`, structural | 0% on M1 (also Threshold=64 in `luxfi/crypto/gpu/zk.go:53` per CROSSOVER.md untuned) | gnark-crypto Goldilocks Poseidon2; LP-137 §3.4 "poseidon goldilocks variant partially wired" |
| 23 | NTT (negacyclic, Lattigo Montgomery) | Cooley-Tukey 1965 + Longa-Naehrig 2016 (efficient NTT for ring-LWE); Lattigo v6 byte-equal | `ntt_kat_test.cpp` 167 LOC + `vectors/ntt_kat.json` | `ntt/cpp/` 218 LOC | `ntt/gpu/metal/ntt.metal` 963 LOC, structural; LP-137 §2.3 line 165 reports **16.92× at N=4096 B=2048** | `ntt/gpu/cuda/ntt.cu` 452 LOC, structural | `ntt/gpu/wgsl/ntt.wgsl` 143 LOC, structural | 0% on M1 (env unset for `ntt_kat_test`); FHE NTT bench reproduces 14.02× at N=4096 B=128 (`luxcpp/fhe/BENCHMARKS.md`) | Lattigo v6 byte-equal Montgomery (LP-137 §2.3 line 165 cites `lattice@d11ec53c`) |
| 24 | Polynomial multiplication (NTT-aided) | Schönhage-Strassen 1971; Lattigo Montgomery | `poly_mul_kat_test.cpp` 212 LOC + `poly_mul_test.cpp` 136 LOC; vectors at `poly_mul/test/vectors/poly_mul_kat.json` | `poly_mul/cpp/` 136 LOC | `poly_mul/gpu/metal/poly_mul.metal` 66 LOC + `poly_mul_metal_test.cpp`, structural | `poly_mul/gpu/cuda/poly_mul.cu` 287 LOC, structural | `poly_mul/gpu/wgsl/poly_mul.wgsl` 165 LOC, structural | 0% on M1 | Lattigo v6 |
| 25 | modexp / mulmod (BigModExp) | EIP-198 (modexp precompile); Knuth TAOCP §4.3.1 | `modexp_kat_test.cpp` 291 LOC | `modexp/cpp/` 609 LOC (modexp.cpp + mulmod.cpp), via deps/intx + deps/evmmax | `modexp/gpu/metal/modexp.metal` 327 LOC, structural | n/a | n/a | n/a | EIP-198 reference; intx v0.15.0 at `crypto/deps/intx/`; **MISSING-CUDA** **MISSING-WGSL** at SHA `7303b178` |
| 26 | evm256 (mulmod/addmod) | EIP-7864 (no published spec; intx semantics) | 0 first-party KAT at SHA `7303b178` (LP-137 `COVERAGE.md:57` "NOTIMPL — cpp/ dir empty") | `evm256/cpp/` empty (78 LOC stub); shims served as NOTIMPL from `modexp/c-abi/c_modexp.cpp` | `evm256/gpu/metal/evm256.metal` 416 LOC | `evm256/gpu/cuda/evm256.cu` 454 LOC | `evm256/gpu/wgsl/evm256.wgsl` 162 LOC | 0% on M1 | **MISSING-SPEC** **MISSING-KAT** — only intx semantics, no consensus-pinned spec |
| 27 | Attestation (SEV-SNP / TDX / NV NRAS / composite) | AMD SEV-SNP ABI 1.55, Intel TDX module 1.5 SDM, NVIDIA NRAS protocol v3 | **27 byte-equal C++↔Go cases** (`attestation_test.cpp` 11 cases + `composite_test.cpp` 16 cases, 32 EXPECT asserts, LP-137 §2.7) — fixtures at `attestation/test/fixtures/` are real (LP-137 §2.7 "B2 closure", commit `81171eb6`) | `attestation/cpp/` 170 LOC parser-only (LP-137 §2.7 — full-chain verification lives in `luxd/cc/attest/`) | n/a (parser, no GPU path; LP-137 §3.8 Class C "structurally CPU-only") | n/a | n/a | n/a | go-sev-guest (SEV-SNP), Intel SGX-DCAP (TDX), documented NVIDIA test endpoints (NRAS); LP-137 §2.7 "second oracle commit `kat-second-oracle-2026-04-28`" |
| 28 | FROST (threshold Schnorr) | Komlo-Goldberg 2020; LP-137 §3.4 "no first-party body authored" | 0 first-party KAT (`frost/test/` dir does not exist at SHA `7303b178`); LP-137 §2.3 line 171 reports **4.23× FROST sign 5-of-7** in mpcvm v0.62 (separate codebase) | `frost/cpp/` empty | `frost/gpu/metal/frost.metal` 439 LOC | `frost/gpu/cuda/frost.cu` 402 LOC | `frost/gpu/wgsl/frost.wgsl` 84 LOC | 0% (no test) | **MISSING-KAT** **MISSING-ORACLE** — kernels exist but no determinism tests; LP-137 §3.8 Class C "intra-ceremony round-by-round" |
| 29 | CGGMP21 (threshold ECDSA) | Canetti-Gennaro-Goldfeder-Makriyannis-Peled 2021 | 0 first-party KAT at SHA `7303b178`; `lux/crypto/cggmp21/` 2 Go files no tests | `cggmp21/cpp/` empty | `cggmp21/gpu/metal/cggmp21.metal` 366 LOC | `cggmp21/gpu/cuda/cggmp21.cu` 347 LOC | `cggmp21/gpu/wgsl/cggmp21.wgsl` 132 LOC | 0% (no test) | **MISSING-KAT** **MISSING-ORACLE** — LP-137 §3.8 Class C |
| 30 | Pulsar (lattice threshold) | Boneh-Komargodski-Lai-Wee 2024 (Pulsar signatures); LP-073 | 0 first-party KAT in `luxcpp/crypto/ringtail/`; LP-137 §6 #226 "luxfi/log+ringtail Sign API drift" → 1 fail of 58 in `lux/threshold` | `ringtail/cpp/` empty (umbrella in `lux/threshold` + `lux/lattice`) | `ringtail/gpu/metal/ringtail.metal` 378 LOC | `ringtail/gpu/cuda/ringtail.cu` 240 LOC | `ringtail/gpu/wgsl/ringtail.wgsl` 147 LOC | 0% (no test) | **MISSING-KAT** **MISSING-ORACLE** — kernels exist with no validation tests at SHA `7303b178` |
| 31 | sr25519 | Schnorrkel/Polkadot SCHEMA-3 spec | 0 first-party KAT at SHA `7303b178`; `lux/crypto/sr25519/` does not exist | `sr25519/cpp/` empty | `sr25519/gpu/metal/sr25519.metal` 404 LOC | `sr25519/gpu/cuda/sr25519.cu` 393 LOC | `sr25519/gpu/wgsl/sr25519.wgsl` 95 LOC | 0% (no test) | **MISSING-CPU-CANONICAL** **MISSING-KAT** **MISSING-ORACLE** — LP-137 §3.4 "no first-party body authored" |

## Aggregate by axis

Denominator: 31 algorithms cataloged.

| Axis | Pass | Fail/Missing | % |
|---|---:|---:|---:|
| Spec citation present (published RFC/FIPS/paper) | 29 | 2 (evm256, sr25519) | 93.5% |
| KAT vectors against published values | 22 | 9 (secp256r1, evm256, frost, cggmp21, ringtail, sr25519, ipa-GPU-only, verkle-GPU-only, kzg-NOTIMPL-prod) | 71.0% |
| CPU-canonical body exists (`<alg>/cpp/<alg>.cpp` non-empty) | 25 | 6 (frost, cggmp21, ringtail, sr25519, evm256-empty-cpp/, kzg-NOTIMPL-prod) | 80.6% |
| Metal kernel present | 27 | 4 (attestation, ipa, verkle, secp256r1) | 87.1% |
| CUDA kernel present | 26 | 5 (attestation, ipa, verkle, secp256r1, modexp) | 83.9% |
| WGSL kernel present | 26 | 5 (attestation, ipa, verkle, secp256r1, modexp) | 83.9% |
| Real GPU dispatch on M1 test host (env unset) | 0 | 31 | 0% |
| Real GPU dispatch on Linux+CUDA / metallib-set CI host (per LP-137 §2.3 reproduced row) | 5 (sha256, keccak, ed25519, bn254, banderwagon — verified by scientist `a73f853`) | 26 | 16.1% |
| Second-oracle (divergent codebase) cross-verification | 18 | 13 | 58.1% |

## Flagged-as-missing

### MISSING-SPEC (2)
- **evm256** — only intx semantics, no consensus-pinned RFC/EIP/paper. The mulmod/addmod variants are Lux-internal and lack a published spec the table column can cite.
- **sr25519** — Schnorrkel SCHEMA-3 is informal Polkadot spec, not RFC. Acceptable but borderline; flagged for visibility.

### MISSING-KAT (9)
1. **secp256r1** — body wired, no test vectors (`COVERAGE.md:54`).
2. **evm256** — empty `cpp/` dir, NOTIMPL stub.
3. **frost** — kernels exist, no test/.
4. **cggmp21** — kernels exist, no test/.
5. **ringtail** — kernels exist, no test/.
6. **sr25519** — kernels exist, no test/.
7. **ipa** — only CPU `ipa_kat_test.cpp`; GPU side absent at SHA `7303b178`.
8. **verkle** — only Go side has `*_test.go`; C++ side is 25 LOC stub.
9. **kzg** — production `crypto/kzg/` returns NOTIMPL (LP-137 §46 invariant); KAT exists only via `cevm` test-oracle path.

### MISSING-GPU (real dispatch on test host = 0%)
**All 31 algorithms** report 0% real GPU dispatch on M1 host with env unset.
The `*_METALLIB` env-gated structural-stub pattern is universal at SHA
`7303b178`. LP-137 §2.3 explicitly flags this:
> "every algorithm CPU↔GPU determinism" → "3 of 32 algos with unconditional
> GPU tests; 6 of 8 *_metal_test* gate on LUX_CRYPTO_*_METALLIB env and
> stub-pass when unset" → corrected to 9.4% real, not "every".

The 5 algorithms with verified real-GPU runs on a properly configured CI
host (sha256, keccak, ed25519, bn254, banderwagon) are corroborated by
scientist commit `a73f853` (BLS 144.22× / FHE 16.92× / bn254 36/36 KAT)
and LP-137 §2.3 reproduced rows.

### MISSING-ORACLE (single-oracle gnark wrapper only — no divergent codebase) (5)
1. **secp256k1** — bitcoin-core/secp256k1 is the only oracle; CryptoKit (Apple) or libsecp-rs would close the gap. Flagged but acceptable: bitcoin-core is independent of any Go crypto family.
2. **frost** — no oracle at all (no tests).
3. **cggmp21** — no oracle at all.
4. **ringtail** — no oracle at all.
5. **sr25519** — no oracle at all.

The two algorithms with confirmed two-oracle (gnark + arkworks) cross-check
are **bn254** and **banderwagon**, per LP-137 §2.7 commit
`kat-second-oracle-2026-04-28` (`cc62c7b9`) and the `ark_oracle/` Cargo
projects at `bn254/test/tools/ark_oracle/` and
`banderwagon/test/tools/ark_oracle/`. Scientist audit `a73f853` verified
this pattern.

### MISSING-CPU-CANONICAL (6)
- **frost, cggmp21, ringtail, sr25519** — empty `cpp/` directories.
- **evm256** — empty `cpp/` directory.
- **kzg** (production) — body exists but excluded from prod link graph by §46.

## Decision recommendations

1. **Block production gating of any "real-GPU" claim until a CI host is
   configured with `*_METALLIB` env exports.** The 16.1% reproduced figure
   on a properly equipped runner (Linux+CUDA + Metal CI) is the only
   defensible number. The headline "every algorithm CPU↔GPU determinism"
   in LP-137 §1 must remain qualified by §2.3's explicit retraction.

2. **Author KAT files for the 6 NOTIMPL algorithms (secp256r1, evm256,
   frost, cggmp21, ringtail, sr25519)** before any production deploy
   reads from those code paths. CPU body presence without published
   vectors is a correctness gap; LP-137 §3.4 already catalogs these.

3. **Add a second oracle for secp256k1.** bitcoin-core/secp256k1 is
   independent, but CryptoKit / libsecp-rs would catch upstream-shared
   bugs; LP-137 §1 §2.3 §2.7 closes the same gap for bn254 and banderwagon
   already.

4. **GPU coverage of attestation, ipa, verkle, secp256r1, modexp.**
   Either author kernels or document the deliberate CPU-only choice in
   LP-137 §3.8 categories (Class C is documented for attestation; ipa
   and verkle are Class B "kernel pending").

## Sources

- `luxcpp/crypto@7303b178` (this audit's primary tree)
- `lux/crypto@9a535f7b`
- LP-137 (`/Users/z/work/lux/lps/LP-137.md`)
- LP-137 `COVERAGE.md` (`/Users/z/work/luxcpp/crypto/COVERAGE.md`)
- LP-137 `CROSSOVER.md` (`/Users/z/work/luxcpp/crypto/CROSSOVER.md`)
- LP-137 `CHANGELOG.md` (`/Users/z/work/luxcpp/crypto/CHANGELOG.md`)
- Scientist audit corroboration `a73f853` (BLS 144.22× / FHE 16.92× / bn254 36/36 KAT)
- Per-algorithm KAT headers (`bn254_pairing_kat.h`, `bn254_h2c_kat.h`,
  `element_kat.h`, `fp_kat.h`, `fr_kat.h`, `multiexp_kat.h`,
  `pedersen_kat.h`, `poseidon2_t2_kat.json`, `ntt_kat.json`,
  `poly_mul_kat.json`, `blake3/test/vectors/test_vectors.json`)
- Second-oracle Cargo projects (`bn254/test/tools/ark_oracle/`,
  `banderwagon/test/tools/ark_oracle/`) — arkworks 0.5
- LP-137 §1 §2.3 §2.7 §3.4 §3.5 §3.8 §6 (canonical text references)
