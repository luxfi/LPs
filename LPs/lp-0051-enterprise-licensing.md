---
lp: 51
title: Enterprise Licensing
author: Lux Industries Inc
status: Active
type: Informational
created: 2025-12-29
updated: 2025-12-30
tags: [licensing, enterprise, commercial]
tier: core
---

# LP-0051: Enterprise Licensing

## Abstract

This LP describes enterprise licensing options for Lux Network's advanced technologies. While core blockchain infrastructure is open source, enterprise-grade deployments of advanced cryptography, private networks, AI/ML compute, and high-performance systems require commercial licensing.

## Enterprise Licensing Categories

### 1. Private & Custom Networks

Deploy Lux technology for private, permissioned, or consortium networks.

| Offering | Description | License Required |
|----------|-------------|------------------|
| **Private L1 Network** | Standalone Lux network with custom validators | Enterprise |
| **Permissioned Subnet** | Private subnet on Lux Primary Network | Ecosystem (free) |
| **Consortium Chain** | Multi-organization private network | Enterprise |
| **Air-Gapped Deployment** | Fully isolated network infrastructure | Enterprise |
| **White-Label Network** | Rebranded Lux technology | OEM |

**Permitted Free (Ecosystem License)**:
- L1/L2/L3 chains descending from Lux Primary Network
- Public testnets and devnets
- Research and academic networks

**Requires Commercial License**:
- Networks NOT connected to Lux Primary Network
- Forks of Lux technology
- Competing blockchain deployments

### 2. Multi-Party Computation (MPC) & Threshold Crypto

Enterprise-grade distributed key management and signing services.

| Component | Description | License |
|-----------|-------------|---------|
| **Threshold Signing Service** | Hosted t-of-n signature infrastructure | Enterprise |
| **DKG Ceremonies** | Distributed key generation as a service | Enterprise |
| **Key Rotation Service** | Non-disruptive key refresh | Enterprise |
| **Custody SDK** | White-label institutional custody | OEM |
| **TSS Libraries** | Core threshold signature libraries | Ecosystem |

**Use Cases**:
- Institutional custody solutions
- DAO treasury management
- Cross-chain bridge operations
- Exchange hot wallet security
- Corporate key management

### 3. Cryptographic Libraries

Advanced cryptographic implementations with hardware acceleration.

| Library | Open Source | Enterprise |
|---------|-------------|------------|
| **Post-Quantum (ML-KEM, ML-DSA)** | ✅ Pure Go | CUDA acceleration |
| **FHE/TFHE** | ✅ Metal/MLX | CUDA/Multi-GPU |
| **Lattice Operations** | ✅ CPU | GPU acceleration |
| **BLS Signatures** | ✅ Basic | Threshold BLS |
| **Ring Signatures** | ✅ Basic | GPU-accelerated |
| **Zero-Knowledge** | ✅ Groth16/PLONK | Hardware provers |

### 4. High-Performance Compute & GPU Acceleration

#### Open Source (BSD-3-Clause)
- Apple Silicon (M1/M2/M3/M4) via Metal/MLX
- Single-GPU acceleration
- Standard CPU implementations

#### Enterprise License Required
| Component | Description |
|-----------|-------------|
| **CUDA Backend** | NVIDIA H100/H200/A100 support |
| **Multi-GPU** | Up to 8x GPU via NVLink/NVSwitch |
| **DGX/HGX** | Datacenter-scale deployments |
| **FPGA Accelerators** | Custom hardware integration |
| **TPU Support** | Google TPU integration |

### 5. AI/ML Infrastructure

Enterprise AI compute and inference infrastructure.

| Service | Description | License |
|---------|-------------|---------|
| **Verifiable Inference** | Proof-of-inference for AI models | Enterprise |
| **Confidential AI** | TEE-protected model execution | Enterprise |
| **Training Coordination** | Distributed training orchestration | Enterprise |
| **Model Registry** | On-chain model provenance | Ecosystem |
| **AI Mining Pools** | GPU compute marketplace | Enterprise |

**TEE Support**:
- Intel SGX enclaves
- AMD SEV confidential VMs
- ARM CCA realms
- NVIDIA H100 Confidential Compute

### 6. Exchange & Trading Infrastructure

High-frequency trading and exchange deployments.

| Component | Description | License |
|-----------|-------------|---------|
| **Order Book Engine** | Sub-millisecond matching | Enterprise |
| **FPGA Matching** | Hardware-accelerated orderbook | Enterprise |
| **Market Making SDK** | Automated market making tools | Enterprise |
| **Liquidation Engine** | MEV-resistant liquidations | Enterprise |
| **DEX Precompiles** | Native EVM DEX operations | Ecosystem |

### 7. Bridge & Cross-Chain

Cross-network infrastructure and integration.

| Service | Description | License |
|---------|-------------|---------|
| **Bridge Operator Node** | Run bridge validator infrastructure | Enterprise |
| **Light Client SDK** | Custom network light clients | Enterprise |
| **Relayer Service** | Hosted message relaying | Enterprise |
| **Warp Integration** | Custom chain Warp messaging | Ecosystem |

---

## Licensing Tiers

### Community (Free)

**Ecosystem License v1.2** - No cost for:
- Research and academic use
- Lux Primary Network (mainnet/testnet)
- L1/L2/L3 chains descending from Lux Primary
- Open source contributions

### Enterprise

Annual licensing for commercial deployments outside Lux ecosystem:
- Full source code access
- Priority support (24/7 SLA available)
- Custom integration assistance
- Security advisories and patches
- Dedicated account management

### OEM

White-label and embedded licensing:
- Rebranding rights
- Custom builds and modifications
- Dedicated engineering support
- Volume pricing
- Co-marketing opportunities

---

## Innovation Portfolio

Lux Industries Inc. is pursuing patent protection for 150+ innovations including:

**FHE/Privacy (40+ innovations)**:
- GPU-optimized TFHE bootstrapping
- Batched threshold FHE protocols
- EVM-compatible encrypted integers
- Verifiable FHE computation witnesses

**Post-Quantum (15 innovations)**:
- Lattice-based threshold signatures
- Hybrid classical/PQC modes
- Hardware-accelerated ML-DSA/ML-KEM

**Consensus (12 innovations)**:
- Quasar multi-consensus family
- Sub-second finality protocols
- Performance-weighted validator selection

**See**: [LP-0010: Technology Portfolio](/docs/lp-0010) for complete listing.

---

## Contact

| Inquiry | Contact |
|---------|---------|
| **General Licensing** | licensing@lux.network |
| **Enterprise Sales** | enterprise@lux.network |
| **Partnership** | partners@lux.network |
| **Technical Questions** | GitHub Issues |

**Website**: https://lux.network/enterprise

---

## Related LPs

- [LP-0010: Technology Portfolio](/docs/lp-0010) - Innovation catalog
- [LP-0011: Fee Pricing Protocol](/docs/lp-0011) - Network economics
- [LP-0012: Ecosystem Licensing](/docs/lp-0012) - Two-tier model

---

## Copyright

Copyright 2020-2025 Lux Industries Inc. All rights reserved.

Enterprise components are proprietary. Components under Ecosystem License permit use on Lux Primary Network and descending chains. Contact licensing@lux.network for all other uses.
