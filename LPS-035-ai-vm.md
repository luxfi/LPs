---
lps: 035
title: AI VM
tags: [ai, a-chain, compute, attestation, inference, vm]
description: AI compute attestation VM for verifiable inference and model registration
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2024-06-01
requires:
  - lps-020 (Quasar Consensus)
references:
  - lp-7000 (AI Chain Specification)
  - lp-7100 (Inference Attestation)
---

# LPS-035: AI VM

## Abstract

The AI VM runs the A-chain, a chain purpose-built for AI compute attestation. It provides a registry for AI models, records inference attestations from compute providers, and enables on-chain verification of inference results through commitment schemes. The A-chain does not run inference itself -- it attests that inference was performed correctly by registered compute nodes running in TEE (Trusted Execution Environment) enclaves.

## Specification

### Model Registry

AI models are registered on the A-chain:

```
Model {
    modelID         [32]byte    // hash of model weights
    owner           address
    name            string
    version         uint64
    weightHash      [32]byte    // SHA-256 of model weights file
    architecture    string      // e.g., "transformer", "diffusion"
    paramCount      uint64      // parameter count
    license         string      // e.g., "MIT", "Apache-2.0"
    teeRequired     bool        // must run in TEE for valid attestation
}
```

### Inference Attestation

Compute providers submit attestations after performing inference:

```
Attestation {
    modelID         [32]byte
    inputHash       [32]byte    // hash of inference input
    outputHash      [32]byte    // hash of inference output
    provider        address     // compute provider address
    teeReport       []byte      // SGX/TDX attestation report (if teeRequired)
    timestamp       uint64
    signature       []byte      // provider's signature over all fields
}
```

The A-chain VM verifies:

1. Model exists in registry
2. Provider is registered and staked
3. TEE report is valid (if required) via on-chain SGX/TDX verification
4. Signature is valid

### Provider Staking

Compute providers stake LUX to participate:

- **Minimum stake**: 100 LUX
- **Slashing**: providers submitting invalid attestations (proven via challenge) lose stake
- **Reward**: providers earn fees from attestation consumers (pay-per-attestation)

### Verification Protocol

Consumers verify inference results by:

1. Submitting input to a registered provider
2. Receiving output + attestation
3. Verifying attestation on-chain (A-chain lookup via Warp)
4. Optionally challenging: re-running inference on a different provider and comparing outputs

### Dispute Resolution

If two providers produce different outputs for the same input and model:

1. Challenger submits both attestations to the A-chain
2. A third provider (randomly selected from staked set) re-runs the inference
3. The minority result is considered faulty; that provider is slashed

## Security Considerations

1. **TEE trust model**: SGX/TDX attestation is only as secure as the TEE hardware. Side-channel attacks on TEE are a known risk.
2. **Model integrity**: `weightHash` binds the attestation to a specific model version. Model poisoning must be detected off-chain.
3. **Non-deterministic inference**: floating-point non-determinism can cause legitimate output differences. Tolerance thresholds are configurable per model.

## Reference

| Resource | Location |
|---|---|
| AI VM | `github.com/luxfi/node/vms/aivm/` |
| TEE verification | `github.com/luxfi/node/vms/aivm/tee/` |
| Model registry | `github.com/luxfi/node/vms/aivm/registry/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
