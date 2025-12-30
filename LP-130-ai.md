---
lp: 130
title: AI Mining and On-Chain Inference
tags: [evm, precompile, ai, mining, inference, tee, ml-dsa, attestation]
description: AI mining reward calculation and cryptographic verification for compute-to-earn
author: Lux Core Team
status: Final
type: Standards Track
category: AI
created: 2026-04-13
references:
  - lps-078 (EVM Precompile Registry)
  - lps-035 (AI VM)
  - lps-127 (Remote Attestation)
  - lps-070 (ML-DSA)
---

# LP-130: AI Mining and On-Chain Inference

## Abstract

Implements the AI mining precompile for compute-to-earn verification on the Lux EVM. Miners submit work proofs attesting to GPU compute time, verified via TEE attestation and ML-DSA signatures. The precompile calculates rewards based on compute minutes, privacy level, and hardware trust score. Includes double-spend prevention via a spent-set and BLAKE3 work ID computation.

## Specification

### Address

`0x0300` -- AI range.

### Interface

```
0x01 VerifyMLDSA:     paramSet(1) + pubkey + signature + message -> bool(32)
0x02 CalculateReward: work_proof -> reward(32)
0x03 VerifyTEE:       tee_quote + nonce -> { verified(bool), trust_score(uint8) }
0x04 IsSpent:         work_id(32) -> bool(32)
0x05 ComputeWorkId:   work_proof -> work_id(32)  (BLAKE3 hash)
0x06 MarkSpent:       work_id(32) -> ()           (state write)
```

**Work proof layout:**
```
bytes  0-31:  device_id (32 bytes)
bytes 32-63:  nonce (32 bytes)
bytes 64-71:  timestamp (uint64, big-endian)
bytes 72-73:  privacy_level (uint16)
bytes 74-77:  compute_minutes (uint32)
bytes 78+:    tee_quote (optional, variable)
```

### Privacy Levels

| Level | Multiplier | Description |
|-------|-----------|-------------|
| 1 (Public) | 0.25x | Open compute, no TEE |
| 2 (Private) | 0.50x | Software isolation |
| 3 (Confidential) | 1.00x | Hardware TEE (SGX/TDX) |
| 4 (Sovereign) | 1.50x | Full CC + local attestation |

### Gas Schedule

| Operation | Gas |
|-----------|-----|
| VerifyMLDSA | 3,000 |
| CalculateReward | 1,000 |
| VerifyTEE | 5,000 |
| IsSpent | 100 |
| ComputeWorkId | 50 |
| MarkSpent | 5,000 |

GPU acceleration is used for batch ML-DSA verification (NTT-based) and batch attestation verification when available.

### Security Considerations

1. Work proofs are bound to a specific device_id and timestamp. Replay protection via the spent-set.
2. TEE attestation is platform-agnostic (NVIDIA NVTrust, Intel TDX, ARM CCA). Verification is local.
3. ML-DSA signatures (FIPS 204) provide post-quantum authentication of work proofs.
4. Privacy level multipliers incentivize higher security tiers. The Sovereign tier requires both hardware CC and local-only attestation (no cloud dependencies).
5. The MarkSpent operation is a state write -- only callable by authorized mining contracts.

## References

- Source: `github.com/luxfi/precompile/ai/`
- LP-035 (AI VM) -- the broader AI virtual machine specification
- LP-127 (Remote Attestation) -- TEE verification details

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
