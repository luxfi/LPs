# Lux Canonical Crypto Architecture

**As of 2026-04-26:** all crypto across the Lux/Hanzo/Zoo/Pars family flows through two canonical repos. One way to do everything.

This is a **summary** doc — full algorithm specs live in LP-001 through LP-137. This doc states the wiring.

## Two repos

- **`github.com/luxfi/crypto`** — Go entrypoint. Brand-neutral symbols (no `lux_` prefix). Vanilla Go + cgo + GPU dispatch.
- **`github.com/luxcpp/crypto`** — C/C++ + GPU canonical. CUDA + Metal + WGSL backends. Algorithm-per-directory layout: `<alg>/cpp/`, `<alg>/c-abi/`, `<alg>/gpu/{cuda,metal,wgsl}/`, `<alg>/test/`.

GPU acceleration routed through **`github.com/luxfi/accel`** (env: `GPU_BACKEND`, `CRYPTO_BACKEND`).

## Algorithms (28 dirs at luxcpp/crypto)

| Category | Algorithms |
|---|---|
| Hashes | keccak, sha256, blake2b, blake3, ripemd160, poseidon |
| EC sigs | secp256k1, secp256r1, ed25519, sr25519 |
| Pairings | bls (BLS12-381), bn254, kzg |
| PQ | mldsa, mlkem, slhdsa, ringtail |
| Threshold | frost, cggmp21 |
| Other | aead, attestation, evm256, ipa, lamport, modexp, ntt, pedersen, poly_mul, verkle |

Every algorithm dir has CPU + GPU (CUDA/Metal/WGSL) backends. CPU == GPU byte-equal on deterministic primitives.

## Backend dispatch (CRYPTO_BACKEND env or programmatic)

- `vanilla` — pure Go (always available, deterministic, slowest)
- `cgo` — CGO into luxcpp/crypto C-ABI (CPU production)
- `gpu` — accel-routed GPU (CUDA/Metal/WGSL)
- `auto` — prefers GPU > CGo > Vanilla

C-ABI surface lives at `luxcpp/crypto/c-abi/lux_crypto.h` and `<alg>/c-abi/`. Brand-neutral C symbols (no `lux_` prefix; the `lux_crypto.h` umbrella header just collects them).

## Honest acceleration state (Apple M1 Max baseline, per LP-137)

| Workload | Measured | Notes |
|---|---:|---|
| F-Chain FHEVM NTT N=4096 B=128 | **23.6×** | unchanged Phase-1 production crossover |
| Z-Chain Groth16 n=16 (cevm/quasar) | **25×** | synthetic VK; 9-10× expected on real fixture |
| M-Chain MPCVM xlarge ceremony | **18.6×** | 9 451 ms → 507 ms Metal |
| B-Chain BLS pairing 5k-10k msgs | **9.5× mean** | strict-mode batched pairing |
| C-Chain BLS aggregate same-msg n=1024 | **9.24×** | 1 142.91 → 129.84 µs/sig |
| P-Chain PlatformVM | **6.5×** | v0.56 → v0.57 |
| M-Chain FROST sign 5-of-7 | **4.23×** | 204.3 → 48.3 ms Metal |
| C-Chain BLS aggregate (general msg) | **2.58×** | 1.20 s → 0.464 s |
| Q-Chain Pulsar | **1.12×** | LWE-on-GPU lands v0.45.1 |
| A-Chain AIVM FullRound | **1.0×** | dGPU ready; M1 dispatch-bound |
| X-Chain XVM Phase-2 | — | not committed by deadline |

**Phase-1 geomean: 0.30× → Phase-2 geomean: 1.33× — 4.4× substrate-wide lift.**

CUDA backend numbers report separately when H100 / Ada self-hosted runners complete.

## Consumers

- `luxcpp/cevm` — EVM precompile dispatcher (Phase 5b: still consumes legacy `cevm_precompiles/`; migration to `lux_crypto.h` C-ABI in flight)
- `lux/precompile` — Go EVM precompiles use `github.com/luxfi/crypto/<alg>`
- `lux/node`, `zoo/node`, `hanzod`, `parsd` — import lux/crypto
- `hanzo/node` Rust — `lux-crypto-sys` path dep
- `luxfi/aivm` — AI precompile service uses lux/crypto
- `luxfi/kms` — composite attestation uses lux/crypto/attestation

## Test invariant

CPU == Metal == CUDA == WGSL byte-for-byte on every deterministic primitive. RFC 6979 / NIST KAT / IETF draft vectors enforce correctness.

**blst** is pinned as the test-time byte-truth oracle for BLS pairing in `luxcpp/crypto/bls/test/cmake/blst.cmake`. **It is never linked into production.** Production cmake reports `BLST: not linked (test oracle only)`. Test cmake reports `BLST: linked (test oracle)`.

## Phase 5 de-dupe status (2026-04-26)

- `luxcpp/gpu/kernels/` — 60 per-algorithm kernel files (20 algorithms × 3 backends) deleted. Canonical at `luxcpp/crypto/<alg>/gpu/{cuda,metal,wgsl}/`. FHE-specific kernels (`fhe_kernels`, `external_product_*`, `blind_rotate*`, `bsk_prefetch`, `dag_executor`, `tensor_ops`, `reduce`) kept — they belong with luxcpp/fhe, not duplicates.
- `luxcpp/cevm/lib/cevm_precompiles/` — **NOT deleted.** 35+ consumer files in cevm still reference `#include "cevm_precompiles/X.hpp"` with namespace `ethash::*` and `hash256` struct ABI different from canonical `<lux/crypto/<alg>.h>` C-ABI. Migration is Phase 5b cleanup pending downstream (lux/precompile, lux/node, zoo/node, hanzo/node) wiring through canonical headers.
- `blst.cmake` — moved to `luxcpp/crypto/bls/test/cmake/blst.cmake` and renamed target to `blst::oracle`. Legacy path at `luxcpp/cevm/cmake/blst.cmake` retained until cevm_precompiles is removed.
