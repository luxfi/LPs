---
lps: 013
title: Fully Homomorphic Encryption on GPU
tags: [fhe, tfhe, gpu, blind-rotate, bootstrap, encrypted-evm]
description: TFHE operations accelerated on GPU for encrypted smart contract execution
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2025-10-01
updated: 2026-04-06
requires:
  - lps-009 (GPU-Native EVM)
  - lps-012 (PQ Crypto GPU)
---

# LPS-013: Fully Homomorphic Encryption on GPU

## Abstract

21 GPU kernels implement TFHE operations for encrypted computation on Lux Network. The `evm256.metal` shader executes full EVM opcodes on FHE-encrypted 256-bit values, enabling private smart contracts where neither validators nor observers can see transaction data.

## Kernels

| Kernel | Operation |
|--------|-----------|
| tfhe_bootstrap | Programmable bootstrapping |
| blind_rotate / blind_rotate_fused | Core TFHE primitive |
| external_product (×3 variants) | RGSW × RLWE multiplication |
| bsk_prefetch | Bootstrap key caching |
| fhe_kernels | Gate evaluation (AND, OR, XOR, NOT) |
| dag_executor | FHE circuit DAG execution |
| evm256 | Full EVM on encrypted 256-bit values |
