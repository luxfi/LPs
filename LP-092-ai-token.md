---
lp: 092
title: Hardware-Attested GPU Mining Token
tags: [ai, gpu, mining, attestation, token, compute, tee]
description: GPU compute mining token with hardware attestation for AI workloads
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Token
created: 2024-12-01
references:
  - lps-065 (TEE Mesh)
  - lps-083 (Token Economics)
---

# LP-092: Hardware-Attested GPU Mining Token

## Abstract

Defines the AI token (AIT), a mining token earned by contributing verified GPU compute to the Lux AI network. Miners run AI inference and training workloads in TEE-attested environments (LP-065). Proof-of-Useful-Work attestations are submitted on-chain, and AIT is minted proportionally to verified compute contribution. AIT is redeemable for GPU compute credits or tradeable on the DEX.

## Specification

### Mining Process

```
1. Miner registers GPU with TEE attestation (SGX/SEV-SNP)
2. Miner receives AI workload from the task queue
3. Miner executes workload inside TEE enclave
4. TEE produces attestation report: {workload_hash, result_hash, gpu_id, duration}
5. Miner submits attestation to MiningRegistry contract
6. Contract verifies attestation, mints AIT proportional to compute units
```

### Compute Units

| GPU | Compute Units/Hour | AIT/Hour |
|-----|-------------------|----------|
| NVIDIA H100 | 1,000 | 100 |
| NVIDIA A100 | 600 | 60 |
| NVIDIA L40S | 400 | 40 |
| AMD MI300X | 800 | 80 |

Compute units are benchmarked against a reference workload (LLM inference, batch size 32, sequence length 2048).

### Attestation Verification

The `MiningRegistry` contract verifies:
1. TEE attestation report is valid (platform CA signature).
2. GPU hardware ID matches a registered device.
3. Workload hash matches a task from the queue.
4. Duration is within expected bounds for the workload type.
5. Result hash is verified by at least 2-of-3 independent attestations (redundant execution).

### Token Properties

| Property | Value |
|----------|-------|
| Name | AI Token |
| Symbol | AIT |
| Decimals | 18 |
| Supply | Uncapped (minted on verified compute) |
| Burn | Burned on compute credit redemption |

### Redemption

AIT holders can burn AIT to purchase GPU compute time:

```solidity
function redeem(uint256 aitAmount, bytes32 workloadId) external;
```

1 AIT = 1 compute unit on the network. Burned AIT reduces circulating supply.

## Security Considerations

1. TEE attestation prevents GPU spoofing. A CPU cannot impersonate an H100.
2. Redundant execution (2-of-3) prevents result fabrication.
3. The task queue is managed by the AI coordinator, not miners. Miners cannot select favorable tasks.
4. AIT minting rate is governed by the MiningRegistry. Governance can adjust rates if hardware benchmarks change.

## Reference

| Resource | Location |
|----------|----------|
| MiningRegistry | `github.com/luxfi/standard/contracts/ai/MiningRegistry.sol` |
| TEE attestation | LP-065 |
| AI coordinator | `github.com/hanzoai/compute/` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
