# Parallelization Status: BLAKE3 + Poseidon2

This file tracks the 3-layer (Go + C++ + Metal) delivery for hash family
primitives in `lux/crypto` and `luxcpp/crypto`.

## BLAKE3

| Layer | Path | LOC | KAT |
|-------|------|-----|-----|
| Go    | `lux/crypto/blake3/blake3.go` | 80  | 35 cases x 4 modes (hash, keyed, derive_key, XOF) = 140 assertions |
| C++   | `luxcpp/crypto/blake3/cpp/blake3.{cpp,hpp}` | 311 | 35 cases x 4 modes = 140 assertions |
| Metal | `luxcpp/crypto/blake3/gpu/metal/blake3_batch.{metal,driver.mm}` | 401 | 100 batched inputs (KAT) |

**Reference**: `https://github.com/BLAKE3-team/BLAKE3/blob/master/test_vectors/test_vectors.json`
(35 input lengths from 0 to 102400 bytes), vendored at
`luxcpp/crypto/blake3/test/vectors/blake3_test_vectors.json` and
`lux/crypto/blake3/testdata/test_vectors.json`.

**Acceptance**: each layer asserts byte-equal against the official spec KAT,
no oracle indirection.

**Crossover (M1 Max, input=1024 bytes, median of 10)**: GPU wins from
**N=4096** (CPU 7.17ms vs GPU 6.45ms). At N=65536, GPU is 4.9x faster
(116ms vs 23.8ms).

## Poseidon2-BN254

| Layer | Path | LOC | KAT |
|-------|------|-----|-----|
| Go    | `lux/crypto/poseidon/poseidon.go` | 78  | 16 KAT permutation cases + determinism + non-canonical rejection |
| C++   | `luxcpp/crypto/poseidon/cpp/{poseidon.cpp,fr_bn254.hpp,poseidon_constants.hpp}` | 379 | 16 KAT permutation cases |
| Metal | `luxcpp/crypto/poseidon/gpu/metal/poseidon2_t2_batch.{metal,driver.mm}` | 354 | 100 batched permutations (KAT) |

**Reference**: `gnark-crypto v0.20.1`
(`github.com/consensys/gnark-crypto/ecc/bn254/fr/poseidon2`), default
parameters t=2, rF=6, rP=50, d=5. Round-key seed
`"Poseidon2-BN254[t=2,rF=6,rP=50,d=5]"`. KAT vectors generated from
gnark-crypto directly (`testdata/poseidon2_t2_kat.json`,
`test/vectors/poseidon2_t2_kat.json`).

**Acceptance**: each layer asserts byte-equal against the gnark-crypto-derived
KAT (gnark-crypto IS the canonical reference impl).

**Crossover (M1 Max, median of 10)**: GPU wins from **N=256** (CPU 69.67ms vs
GPU 21.04ms). At N=4096, GPU is 52x faster (1125ms vs 21.6ms).

## Test Run Summary

```
$ cd /Users/z/work/lux/crypto && GOWORK=off go test ./blake3/... ./poseidon/... -v
ok  github.com/luxfi/crypto/blake3   (5 tests, 35x4 KAT cases)
ok  github.com/luxfi/crypto/poseidon (4 tests, 16 KAT cases)

$ cd /Users/z/work/luxcpp/crypto/build-fresh && ctest -R "blake3|poseidon"
1/4 blake3_test                 Passed   (35 cases x 4 modes = 140 KAT)
2/4 poseidon_test               Passed   (16 KAT)
3/4 blake3_metal_batch_test     Passed   (100 batched KAT)
4/4 poseidon_metal_batch_test   Passed   (100 batched KAT)
100% tests passed (0 failures)
```

## Notes

- BLAKE3 C++ is a faithful port of the spec. No SIMD, no pre-existing C ref;
  one `cpp/blake3.cpp` body covering hash, keyed_hash, derive_key, plus XOF
  output of arbitrary length.
- Poseidon2 C++ uses 256-bit big-int arithmetic on 4 LE limbs with
  schoolbook multiply + bit-by-bit shift-subtract reduction. Slow but
  trivially auditable. Round constants baked from gnark-crypto's `initRC` at
  build time.
- Metal kernels are thread-per-input. They mirror the CPU body line-for-line
  so a future agent can re-derive correctness from the spec without ever
  consulting a CPU oracle.
- Pre-existing oversized `blake3.metal`, `blake3_authored.metal`,
  `blake3_driver.{h,mm}`, `poseidon.metal`, `poseidon2_bn254.metal`,
  `poseidon2_driver.{h,mm}` etc. remain in-tree but are NOT on the canonical
  test path. They predate the lux_add_algorithm pattern and the per-algo
  CMake lib target; clean-up is out of scope here.
