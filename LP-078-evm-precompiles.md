---
lp: 078
title: EVM Precompile Registry
tags: [evm, precompile, crypto, curves, zk, fhe, dex, bridge, ai]
description: Complete registry of all 36 EVM precompile packages with addresses, gas costs, and specifications
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2021-09-01
updated: 2026-04-13
---

# LP-078: EVM Precompile Registry

## Abstract

Complete registry of all custom EVM precompile addresses for the Lux Network and all ecosystem chains (Liquidity, Zoo, Hanzo, Pars). Standard Ethereum precompiles (0x01-0x0A) are preserved. All 36 precompile packages are enabled on every EVM by default. Genesis determines activation timestamps.

## Precompile Packages (36 total)

### Ethereum Standard (preserved, not custom)

| Address | Name | EIP |
|---------|------|-----|
| 0x01 | ecrecover | secp256k1 ECDSA recovery |
| 0x02 | SHA-256 | SHA-256 hash |
| 0x03 | RIPEMD-160 | RIPEMD-160 hash |
| 0x04 | identity | Data copy |
| 0x05 | modexp | Modular exponentiation |
| 0x06 | ecAdd | BN254 point addition |
| 0x07 | ecMul | BN254 scalar multiplication |
| 0x08 | ecPairing | BN254 pairing check |
| 0x09 | blake2f | BLAKE2b compression |
| 0x0A | pointEvaluation | EIP-4844 point evaluation |

### Curves (5 packages)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0100 | `secp256r1` | P-256/NIST curve verify (EIP-7212, WebAuthn/Passkeys) | -- |
| 0x0A00..01 | `sr25519` | Schnorrkel/Ristretto SR25519 verify (Substrate) | 011 |
| 0x3211..00 | `ed25519` | Edwards Ed25519 verify (Solana, TON, SSH) | 011 |
| 0x9204 | `curve25519` | Raw Curve25519 point ops (add, mul, MSM) | -- |
| 0x0500..07 | `babyjubjub` | Baby Jubjub twisted Edwards (zkEVM circuits) | -- |

### Post-Quantum Cryptography (5 packages)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0200..06 | `mldsa` | ML-DSA verify — FIPS 204 (Dilithium) | 070 |
| 0x0200..07 | `mlkem` | ML-KEM encap/decap — FIPS 203 (Kyber) | 072 |
| 0x0600..01 | `slhdsa` | SLH-DSA verify — FIPS 205 (SPHINCS+) | 071 |
| 0x0200..0B | `ringtail` | Ringtail lattice threshold signatures | 073 |
| 0x2221 | `xwing` | X-Wing hybrid KEM (X25519 + ML-KEM-768) | -- |

### Hashing (3 packages)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0500..04 | `blake3` | BLAKE3 hash (256-bit) | 011 |
| 0x0500..05 | `poseidon` | Poseidon2 ZK-friendly hash (width 2-16) | 069 |
| 0x0500..06 | `pedersen` | Pedersen commitment over BN254 | -- |

### Threshold Signatures (2 packages)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0800..02 | `frost` | FROST EdDSA threshold verify | 019 |
| 0x0800..03 | `cggmp21` | CGGMP21 ECDSA threshold verify | 019 |

### Key Exchange (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x9203 | `x25519` | X25519 Diffie-Hellman key exchange | -- |

### Symmetric Encryption (2 packages)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x9210 | `aes` | AES-256-GCM authenticated encryption | -- |
| 0x9211 | `chacha20` | ChaCha20-Poly1305 AEAD | -- |

### Asymmetric Encryption / Privacy (3 packages)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x9200 | `hpke` | Hybrid Public Key Encryption (RFC 9180) | -- |
| 0x9201 | `ecies` | ECIES encrypt/decrypt (secp256k1) | -- |
| 0x9202 | `ring` | Ring signatures (linkable, Curve25519) | -- |

### AI (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0300 | `ai` | AI mining / on-chain inference | 009 |

### Consensus — Quasar (1 package, 5 addresses)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0300..20 | `quasar` | Verkle tree verify | -- |
| 0x0300..21 | `quasar` | BLS12-381 signature verify | -- |
| 0x0300..22 | `quasar` | BLS12-381 aggregate | -- |
| 0x0300..23 | `quasar` | Ringtail consensus verify | -- |
| 0x0300..24 | `quasar` | Hybrid PQ verify | -- |

### BLS12-381 (1 package, 7+ addresses — EIP-2537)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x000B | `bls12381` | G1 point addition | -- |
| 0x000C | `bls12381` | G1 scalar multiplication | -- |
| 0x000D | `bls12381` | G1 multi-scalar multiplication | -- |
| + G2Add, G2Mul, G2MSM, Pairing, MapToG1, MapToG2 | | | |

### Bridge (1 package, 4 addresses)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0440 | `bridge` | Bridge gateway | 017 |
| 0x0441 | `bridge` | Cross-chain routing | 017 |
| 0x0442 | `bridge` | Message verification | 017 |
| 0x0443 | `bridge` | Bridge liquidity pools | 017 |

### FHE (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0700 | `fhe` | TFHE operations (30+ ops: encrypt, add, mul, compare, ...) | 066 |

### ZK Proofs (1 package, 5+ verifiers)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0900 | `zk` | Generic ZK verify | 037 |
| 0x0901 | `zk` | Groth16 verifier | 037 |
| 0x0902 | `zk` | PLONK verifier | 037 |
| 0x0903 | `zk` | fflonk verifier | 037 |
| 0x0904 | `zk` | Halo2 verifier | 037 |

### Pasta Curves (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0500..08 | `pasta` | Pallas + Vesta curve ops (Halo2/Nova) | -- |

### DEX — LX Suite (1 package, 13 addresses)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x9010 | `dex` | LXPool — v4 PoolManager | 032 |
| 0x9011 | `dex` | LXOracle — price aggregation | 032 |
| 0x9012 | `dex` | LXRouter — swap router | 032 |
| 0x9013 | `dex` | LXHooks — hook registry | 032 |
| 0x9014 | `dex` | LXFlash — flash accounting | 032 |
| 0x9020 | `dex` | LXBook — CLOB orderbook | 032 |
| 0x9030 | `dex` | LXVault — custody + margin | 032 |
| 0x9040 | `dex` | LXPrice — derived pricing | 032 |
| 0x9050 | `dex` | LXLend — lending pool | 032 |
| 0x9060 | `dex` | LXRepayer — self-repaying loans | 032 |
| 0x9070 | `dex` | LXLiquidator — liquidation engine | 032 |
| 0x9080 | `dex` | LXTransmuter — debt→collateral | 032 |
| 0x6010 | `dex` | Teleport — cross-chain | 016 |

### Graph (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x0500 | `graph` | On-chain GraphQL query interface | -- |

### Blob (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0xB002 | `kzg4844` | EIP-4844 KZG blob commitments | -- |

### Attestation (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| TBD | `attestation` | Remote attestation (TEE/SGX/TDX) | -- |

### Registry (1 package)

| Address | Package | Description | LP |
|---------|---------|-------------|-----|
| 0x000B-0x000D | `registry` | Precompile discovery + BLS12-381 curve ops | -- |

### Deprecated Umbrellas (3 packages — kept for backwards compat, not needed)

| Package | Wraps | Status |
|---------|-------|--------|
| `pqcrypto` | mldsa + mlkem + slhdsa | Redundant — use explicit imports |
| `quantum` | mldsa + mlkem + slhdsa + ringtail | Redundant |
| `threshold` | cggmp21 + frost + ringtail | Redundant |

## Address Range Summary

| Range | Purpose |
|-------|---------|
| 0x01-0x0A | Ethereum standard |
| 0x000B-0x000D | BLS12-381 (EIP-2537) |
| 0x0100 | secp256r1 (EIP-7212) |
| 0x0200-0x022F | Post-quantum + X-Wing |
| 0x0300 | AI mining |
| 0x0300..20-24 | Quasar consensus helpers |
| 0x0440-0x0443 | Bridge |
| 0x0500-0x050F | Hashing + Graph |
| 0x0600-0x060F | SLH-DSA + PQ |
| 0x0700 | FHE |
| 0x0800-0x080F | Threshold signatures |
| 0x0900-0x090F | ZK proofs |
| 0x0A00-0x0A0F | Substrate curves |
| 0x3211 | Ed25519 |
| 0x6010 | Teleport |
| 0x9010-0x9080 | DEX (LX Suite) |
| 0x9200-0x9211 | Privacy + encryption |
| 0xB002 | KZG/blob |

## Activation

All precompiles are compiled into the EVM binary. Activation is controlled per-chain via genesis `blockTimestamp` or `blockNumber` in the chain upgrade config. A precompile with `blockTimestamp: 0` is active from genesis.

## Implementation

Source: `github.com/luxfi/precompile`
36 packages, each with `config.go`, `contract.go`, `module.go`.
