---
lps: 065
title: Trusted Execution Environment Mesh
tags: [tee, sgx, sev, trustzone, confidential-compute, attestation]
description: Mesh network of TEE enclaves for confidential computation on Lux validators
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2024-09-01
references:
  - lps-066 (Threshold FHE)
  - lps-062 (KMS)
  - lps-015 (Validator Key Management)
---

# LPS-065: Trusted Execution Environment Mesh

## Abstract

Defines a mesh network of Trusted Execution Environments (TEEs) across Lux validators. Each participating validator runs an enclave (Intel SGX, AMD SEV-SNP, or ARM TrustZone) that performs confidential computation. Enclaves attest to each other via remote attestation, forming a trust mesh. The mesh executes privacy-sensitive operations (key generation, FHE computations, private state transitions) without exposing plaintext data to the host OS.

## Specification

### Supported TEE Platforms

| Platform | Hardware | Attestation |
|----------|----------|-------------|
| Intel SGX | Xeon (Ice Lake+) | DCAP (Data Center Attestation Primitives) |
| AMD SEV-SNP | EPYC (Milan+) | SNP attestation report |
| ARM TrustZone | ARMv8.4-A+ | PSA attestation token |

### Attestation Protocol

1. Each enclave generates an attestation report binding its identity to its TEE measurement.
2. Reports are submitted to the on-chain `TEERegistry` contract.
3. The registry verifies the report against known platform root keys (Intel/AMD/ARM CA certs stored on-chain).
4. Verified enclaves are added to the active mesh.

### Mesh Communication

Enclaves establish pairwise encrypted channels using RA-TLS (Remote Attestation TLS). Each channel verifies the peer's attestation before completing the handshake. Communication uses Noise_XX protocol over QUIC.

### Confidential Operations

| Operation | Description |
|-----------|-------------|
| MPC key generation | DKG ceremonies inside TEE mesh |
| FHE bootstrap | Key generation for threshold FHE (LPS-066) |
| Private state | Execute confidential smart contract state transitions |
| Sealed storage | Encrypt data at rest using enclave sealing keys |

### Registration

Validators opt into the TEE mesh by:
1. Running the enclave binary alongside their validator node.
2. Submitting an attestation transaction to `TEERegistry`.
3. The registry verifies and adds the enclave to the mesh roster.

## Security Considerations

1. TEE side-channel attacks (Spectre, Foreshadow) are mitigated by microcode updates and enclave hardening.
2. Attestation reports expire after 24 hours and must be refreshed.
3. A compromised host cannot read enclave memory but can deny service. Mesh redundancy (t-of-n) tolerates f failures.
4. Platform root keys are updated via governance when Intel/AMD/ARM rotate their CA certificates.

## Reference

| Resource | Location |
|----------|----------|
| TEE enclave runtime | `github.com/luxfi/tee/` |
| TEERegistry contract | `github.com/luxfi/standard/contracts/tee/TEERegistry.sol` |
| RA-TLS library | `github.com/luxfi/tee/ratls/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
