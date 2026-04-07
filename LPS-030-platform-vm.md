---
lps: 030
title: Platform VM
tags: [platform, p-chain, validators, staking, subnets, vm]
description: P-chain virtual machine for validator management, staking, and subnet lifecycle
author: Lux Industries
status: Final
type: Standards Track
category: Virtual Machines
created: 2019-06-01
requires:
  - lps-020 (Quasar Consensus)
  - lps-015 (Validator Key Management)
references:
  - lp-5000 (Platform VM)
  - lp-5100 (Elastic Subnets)
---

# LPS-030: Platform VM

## Abstract

The Platform VM (PlatformVM) runs the P-chain, Lux's coordination chain. It manages the validator set, staking operations, subnet creation, and blockchain deployment. All other chains derive their validator sets and security guarantees from the P-chain. The PlatformVM is a linear chain with deterministic BLS finality (LPS-020) and UTXO-based transaction model.

## Specification

### Transaction Types

| Tx Type | Description |
|---|---|
| `AddValidatorTx` | Register a validator with stake, BLS key, and duration |
| `AddDelegatorTx` | Delegate stake to an existing validator |
| `RemoveValidatorTx` | Remove validator (after stake period ends) |
| `CreateSubnetTx` | Create a new subnet with owner addresses |
| `CreateBlockchainTx` | Deploy a VM on a subnet |
| `TransformSubnetTx` | Convert subnet to elastic (permissionless) subnet |
| `AddSubnetValidatorTx` | Add a validator to a specific subnet |
| `ImportTx` / `ExportTx` | Cross-chain UTXO transfers (P <-> X/C) |

### Staking

- **Minimum stake**: 2,000 LUX (validator), 25 LUX (delegator)
- **Stake period**: 2 weeks to 1 year
- **Reward**: proportional to stake weight and uptime (>80% required)
- **Delegation fee**: set by validator (minimum 2%)
- **Maximum validators**: 10,000 on the primary network

### Subnet Lifecycle

1. `CreateSubnetTx` -- creates a subnet with a set of control keys and threshold
2. `AddSubnetValidatorTx` -- adds validators to the subnet (requires subnet control key signatures)
3. `CreateBlockchainTx` -- deploys a VM (identified by VM ID) on the subnet
4. `TransformSubnetTx` -- converts to elastic subnet with its own staking token

### UTXO Model

The P-chain uses a UTXO transaction model (not account-based):

- Each output has an amount, locktime, threshold, and set of owner addresses
- Inputs reference previous outputs by `(txID, outputIndex)`
- Multi-sig: threshold-of-N signing on any output
- Timelocks: outputs can be locked until a specific Unix timestamp

### Validator Set Propagation

The P-chain is the source of truth for all validator sets. Other chains read P-chain state to determine:

- Primary network validators (for Quasar consensus)
- Subnet validators (for subnet-specific consensus)
- BLS public keys (for Warp message verification)

Updates propagate through Warp messages (LPS-021) to all subscribed chains.

## Security Considerations

1. **Sybil resistance**: minimum stake requirements prevent low-cost validator flooding.
2. **Nothing-at-stake**: validators are slashed for equivocation (signing conflicting blocks).
3. **Subnet isolation**: a compromised subnet cannot affect the primary network or other subnets.

## Reference

| Resource | Location |
|---|---|
| PlatformVM | `github.com/luxfi/node/vms/platformvm/` |
| Staking logic | `github.com/luxfi/node/vms/platformvm/txs/` |
| Elastic subnets | LP-5100 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
