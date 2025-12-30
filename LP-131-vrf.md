---
lp: 131
title: ECVRF Precompile
tags: [evm, precompile, vrf, randomness]
description: Verifiable random function verification precompile (ECVRF-EDWARDS25519-SHA512-ELL2)
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - RFC 9381 (VRF specification)
  - LP-078 (Precompile registry)
---

# LP-131: ECVRF Precompile

## Abstract

VRF verification precompile per RFC 9381. Enables on-chain randomness beacons, leader election, and lottery protocols with ~40x gas savings over Solidity implementations.

## Motivation

Verifiable Random Functions produce randomness that is:
- **Verifiable**: anyone can check the output is correct for a given key and input
- **Unpredictable**: without the secret key, the output is computationally indistinguishable from random
- **Unique**: for each key and input, there is exactly one valid output

On-chain VRF verification in Solidity requires explicit elliptic curve arithmetic over Edwards25519 -- approximately 800,000 gas. A native precompile at 20,000 gas is a 40x improvement.

## Specification

- **Address**: `0x0000000000000000000000000000000000003213` (LP-3213)
- **Suite**: ECVRF-EDWARDS25519-SHA512-ELL2 (RFC 9381 section 5.5)
- **ConfigKey**: `vrfConfig`

### Operations

#### OpVerify (0x01)

Verifies a VRF proof and returns the verifiable random output.

**Input**: `opcode(1) || pk(32) || alpha_len(2 big-endian) || alpha(variable) || proof(80)`

**Output**: `beta_string(64)` on success, empty bytes on verification failure.

The proof is 80 bytes: `Gamma(32) || c(16) || s(32)` where Gamma is a compressed Edwards25519 point, c is a 16-byte challenge scalar (little-endian, zero-padded to 32 bytes internally), and s is a 32-byte scalar.

Verification follows RFC 9381 section 5.3:
1. Decode public key Y from pk bytes
2. Decode proof into (Gamma, c, s)
3. Compute H = hash_to_curve(pk, alpha) using Elligator2
4. Compute U = s*B - c*Y
5. Compute V = s*H - c*Gamma
6. Derive c' = challenge_generation(Y, H, Gamma, U, V)
7. Accept iff c == c'
8. Return beta = proof_to_hash(Gamma)

**Gas**: 20,000

#### OpProofToHash (0x02)

Extracts the verifiable random output from a proof without re-verifying. Useful when the proof has already been verified (e.g., stored on-chain after a prior verify call).

**Input**: `opcode(1) || proof(80)`

**Output**: `beta_string(64)`

Computes `SHA-512(suite_string || 0x03 || cofactor*Gamma || 0x00)`.

**Gas**: 1,000

### Cryptographic Details

- **Hash-to-curve**: Try-and-increment with Elligator2 (RFC 9381 section 5.4.1.2). SHA-512 with counter, clear sign bit, decompress, multiply by cofactor 8.
- **Challenge generation**: SHA-512 over encoded points Y, H, Gamma, U, V with domain separator 0x02. Truncated to 16 bytes.
- **Cofactor**: Ed25519 cofactor = 8. Applied via three point doublings in proof_to_hash.
- **Suite string**: 0x04 (ECVRF-EDWARDS25519-SHA512-ELL2)

### Security Properties

- **Pseudorandomness**: Under the ECDLP assumption on Curve25519, an adversary without the secret key cannot distinguish beta from uniform random bytes.
- **Uniqueness**: For each (pk, alpha) pair, there is exactly one valid (pi, beta). No secret key holder can produce two different valid outputs.
- **No secret key exposure**: Only verification is on-chain. The prove operation (which uses the secret key) happens off-chain. No secret material appears in calldata.
- **Deterministic**: The verify and proof_to_hash operations are fully deterministic -- safe for consensus.

## Use Cases

- **On-chain randomness beacons**: A designated randomness oracle proves VRF output for each block number. Contracts verify the proof to obtain unbiasable randomness.
- **Leader election**: In PoS protocols, validators prove they were selected using VRF(sk, epoch||slot). Verification is O(1) on-chain. Used in Algorand and Cardano Ouroboros.
- **Fair lotteries**: Lottery contracts accept VRF proofs to determine winners. The organizer cannot bias the result (uniqueness property).
- **Verifiable shuffling**: Privacy pools can use VRF outputs as seeds for deterministic-but-unpredictable permutations.
- **NFT trait assignment**: Mint transactions include VRF proofs that determine rarity, preventing manipulation.

## Implementation

Source: `github.com/luxfi/precompile/vrf/`

Files:
- `contract.go` -- RFC 9381 ECVRF verify and proof-to-hash
- `module.go` -- Module registration (ConfigKey, Address, Configurator)
- `contract_test.go` -- Self-consistency tests, edge cases, gas accounting, benchmarks

Dependencies: `filippo.io/edwards25519` (already in go.mod), `crypto/sha512` (stdlib).

No external VRF library is used. The implementation follows RFC 9381 sections 5.1-5.4 directly using the edwards25519 point and scalar arithmetic from filippo.io.
