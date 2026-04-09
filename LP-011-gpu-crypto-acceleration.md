---
lp: 011
title: Unified GPU Cryptographic Acceleration
tags: [gpu, crypto, keccak, ecrecover, bls, metal, cuda, webgpu]
description: GPU-accelerated batch cryptographic operations via luxcpp/gpu
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2025-06-01
updated: 2026-04-06
---

# LP-011: Unified GPU Cryptographic Acceleration

## Abstract

The `luxcpp/gpu` library provides GPU-accelerated batch cryptographic operations across Metal, CUDA, and WebGPU backends. 30 compute shaders implement hashing, signature verification, key exchange, and FHE operations. All backends produce byte-identical output.

## Operations

| Operation | Metal | CUDA | WGSL | Measured |
|-----------|-------|------|------|----------|
| Keccak-256 batch | ✅ | ✅ | ✅ | 7.8 Mhash/s |
| BLAKE3 batch | ✅ | ✅ | ✅ | — |
| secp256k1 ecrecover | ✅ | ✅ | ✅ | — |
| BLS12-381 verify | ✅ | ✅ | ✅ | — |
| Ed25519 verify | ✅ | ✅ | ✅ | — |
| sr25519 verify | ✅ | ✅ | ✅ | — |

## C API

```c
LuxError lux_gpu_keccak256_batch(LuxGPU* gpu, ...);
LuxError lux_gpu_ecrecover_batch(LuxGPU* gpu, ...);
LuxError lux_gpu_mldsa_verify_batch(LuxGPU* gpu, ...);
// ... 11 batch functions total
```
