---
lp: 127
title: Remote Attestation (TEE)
tags: [evm, precompile, attestation, tee, sgx, tdx, nvtrust, tpm, gpu]
description: TEE remote attestation verification for GPU, TPM, and compute environments
author: Lux Core Team
status: Final
type: Standards Track
category: Cryptography
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-065 (TEE Mesh)
  - lps-130 (AI Mining)
---

# LP-127: Remote Attestation (TEE)

## Abstract

Implements TEE remote attestation verification as EVM precompiles. Contracts can verify hardware attestation reports from NVIDIA GPUs (NVTrust/Hopper CC), TPM 2.0 modules, and general compute environments. All attestation is local -- no cloud API dependencies (blockchain requirement). Used by AI mining (LP-130) to verify that compute work was performed on attested hardware.

## Specification

### Addresses

| Address | Function |
|---------|----------|
| `0x0301` | NVTrust GPU attestation verification |
| `0x0302` | TPM 2.0 attestation verification |
| `0x0303` | Compute attestation verification |
| `0x0304` | Attestation creation |
| `0x0305` | Device status query |

### Interface

All inputs are JSON-encoded attestation evidence. Outputs are ABI-encoded structs.

**NVTrust (0x0301):**
```
Input:  JSON { device_id(32), model, cc_enabled, tee_io_enabled,
               driver_version, vbios_version, spdm_report, cert_chain, nonce(32) }
Output: { verified(bool), trust_score(uint8), hardware_cc(bool), rim_verified(bool) }
```

**TPM (0x0302):**
```
Input:  JSON { device_id(32), tpm_type, pcr_values, quote, signature,
               aik_cert, event_log, nonce(32) }
Output: { verified(bool), trust_score(uint8), pcrs_valid(bool) }
```

**Compute (0x0303):**
```
Input:  JSON { device_id(32), privacy_level(uint16), compute_minutes(uint32),
               tee_quote(bytes) }
Output: { verified(bool), trust_score(uint8) }
```

### Gas Schedule

| Operation | Gas |
|-----------|-----|
| NVTrust verify | 50,000 |
| TPM verify | 25,000 |
| Compute verify | 35,000 |
| Create attestation | 75,000 |
| Device status | 5,000 |

### Security Considerations

1. Attestation verification depends on the integrity of the hardware root of trust (GPU silicon, TPM manufacturer CA).
2. SPDM (Security Protocol and Data Model) reports from NVIDIA H100/H200 GPUs are verified against NVIDIA's RIM (Reference Integrity Manifest).
3. Trust scores (0-255) allow contracts to set minimum thresholds for different security tiers.
4. Attestation reports expire. Contracts should check timestamps and require recent attestations.
5. Replay protection via nonces. Each verification should include a fresh challenge nonce.

## References

- NVIDIA Confidential Computing, [NVTrust Attestation](https://docs.nvidia.com/confidential-computing/)
- TCG, [TPM 2.0 Library Specification](https://trustedcomputinggroup.org/resource/tpm-library-specification/)
- Source: `github.com/luxfi/precompile/attestation/`

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
