---
lp: 066
title: Threshold Fully Homomorphic Encryption
tags: [fhe, tfhe, homomorphic, encryption, confidential, threshold]
description: Threshold FHE scheme for encrypted on-chain computation
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2025-03-01
references:
  - lps-065 (TEE Mesh)
  - lps-067 (Confidential ERC-20)
  - lps-076 (Universal Threshold Framework)
---

# LP-066: Threshold Fully Homomorphic Encryption

## Abstract

Defines a threshold FHE scheme for Lux Network. The global FHE public key is generated via a distributed key generation ceremony among TEE mesh participants (LP-065). Encrypted data can be computed on without decryption. Decryption requires a threshold of key holders to produce partial decryptions. The scheme is based on TFHE (Torus FHE) with a CKKS-style bootstrapping for arithmetic operations.

## Specification

### Key Generation

A t-of-n threshold DKG produces:
- **Global public key (gpk)**: Published on-chain. Anyone can encrypt data under gpk.
- **Key shares**: Each TEE enclave holds one share. t shares are needed for decryption.
- **Evaluation key (evk)**: Published on-chain. Enables homomorphic operations without decryption.

### Encrypted Types

| Type | Plaintext | Ciphertext Size |
|------|-----------|----------------|
| euint8 | 8-bit unsigned | 8 KB |
| euint16 | 16-bit unsigned | 8 KB |
| euint32 | 32-bit unsigned | 8 KB |
| euint64 | 64-bit unsigned | 16 KB |
| euint256 | 256-bit unsigned | 32 KB |
| ebool | boolean | 8 KB |

### Homomorphic Operations

Supported operations on encrypted values (via EVM precompile at `0x0066`):

| Operation | Gas Cost | Description |
|-----------|----------|-------------|
| FHE.add | 200,000 | Encrypted addition |
| FHE.sub | 200,000 | Encrypted subtraction |
| FHE.mul | 800,000 | Encrypted multiplication |
| FHE.cmux | 300,000 | Conditional mux (if ebool then a else b) |
| FHE.eq | 150,000 | Encrypted equality comparison |
| FHE.lt | 250,000 | Encrypted less-than |
| FHE.decrypt | 500,000 | Request threshold decryption (async callback) |

### Decryption Protocol

1. Contract calls `FHE.decrypt(ciphertext, callbackAddress)`.
2. Validators in the TEE mesh each produce a partial decryption using their key share.
3. When t partial decryptions are collected, the result is aggregated and delivered to the callback.
4. Decryption latency: ~2 seconds (limited by TEE mesh round-trip).

## Security Considerations

1. The global secret key never exists in a single location. Compromise of t-1 shares reveals nothing.
2. Ciphertexts are IND-CPA secure under the RLWE assumption.
3. Noise budget limits the depth of homomorphic computation. Bootstrapping refreshes the budget at high cost.
4. Evaluation keys are public and do not compromise security.

## Reference

| Resource | Location |
|----------|----------|
| TFHE library | `github.com/luxfi/crypto/tfhe/` |
| FHE precompile | `github.com/luxfi/evm/precompile/contracts/fhe.go` |
| Threshold DKG | `github.com/luxfi/crypto/tfhe/dkg/` |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
