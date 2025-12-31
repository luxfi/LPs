---
lip: 50
title: Enterprise GPU Acceleration Licensing
author: Lux Industries Inc
status: Active
type: Informational
created: 2025-12-29
---

# LP-0050: Enterprise GPU Acceleration Licensing

## Abstract

This LP describes the licensing model for Lux Network's GPU-accelerated cryptographic libraries. Consumer-grade Apple Silicon (Metal/MLX) acceleration is open source. Enterprise-grade NVIDIA CUDA acceleration requires a commercial license.

## Motivation

Lux Network provides high-performance Fully Homomorphic Encryption (FHE) and cryptographic operations. To sustain ongoing R&D while serving both individual developers and enterprise customers, we employ a dual-licensing model:

- **Open Source (BSD-3-Clause)**: Apple Silicon / Metal / MLX support
- **Enterprise License**: NVIDIA CUDA / Multi-GPU / Datacenter support

## Specification

### Open Source Components

The following are available under BSD-3-Clause:

| Component | Repository | GPU Support |
|-----------|------------|-------------|
| FHE Core Library | `luxcpp/fhe` | Metal/MLX |
| Go FHE Bindings | `lux/fhe` | Metal/MLX via CGO |
| Lattice Crypto | `luxfi/lattice` | CPU |

### Enterprise Components

The following require a commercial license:

| Component | Description | Contact |
|-----------|-------------|---------|
| CUDA FHE Backend | H100/H200/A100 support | licensing@lux.network |
| Multi-GPU Pipeline | 8x GPU, NVLink, NVSwitch | licensing@lux.network |
| HGX Integration | DGX/HGX datacenter systems | licensing@lux.network |
| Threshold FHE Server | Enterprise MPC deployment | licensing@lux.network |

### Innovation Status

Lux Industries Inc. is seeking patent protection in the UK and USA for the following optimizations:

1. Four-step NTT for Apple Metal threadgroup memory
2. Fused external product GPU kernel
3. Twiddle factor hotset caching
4. Speculative bootstrapping key prefetch
5. GPU-native scheme switching
6. Batched threshold FHE protocol
7. EVM-compatible encrypted integers (euint256)
8. Lazy carry propagation for encrypted arithmetic
9. Verifiable FHE computation witnesses
10. Multi-GPU NTT distribution via NVLink

### Licensing Tiers

#### Community (Free)
- Apple Silicon acceleration (M1/M2/M3/M4)
- Single-GPU Metal compute
- BSD-3-Clause license
- Community support via GitHub

#### Enterprise
- NVIDIA datacenter GPU support
- Multi-GPU scaling (up to 8x H200)
- Priority support and SLAs
- Custom integration assistance
- Contact: licensing@lux.network

#### OEM
- White-label licensing
- Custom builds and optimizations
- Dedicated engineering support
- Contact: licensing@lux.network

## Contact

For enterprise licensing inquiries:

- **Email**: licensing@lux.network
- **Website**: https://lux.network/enterprise
- **GitHub**: https://github.com/luxfi

## Copyright

Copyright 2025 Lux Industries Inc. All rights reserved.

Enterprise components are proprietary. Open source components are licensed under BSD-3-Clause.
