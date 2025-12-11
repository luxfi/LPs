---
lp: 0025
title: 'L2 to Sovereign L1 Ascension and Fee Model'
description: Defines the process and fee structure for a Lux L2 to become a sovereign L1, and the ongoing fee model for L1 validators.
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-07-22
tags: [l2, scaling]
---

## Abstract

This LP specifies the mechanism by which a Lux L2 (Subnet) can "ascend" to become a sovereign L1 network, with minimal dependency on the Lux Primary Network. It introduces a one-time Ascension Fee and a continuous, dynamic L1 Validator Fee for sovereign L1s, replacing the traditional AVAX/LUX staking requirement. This creates a clear, sustainable path for projects to achieve full sovereignty while ensuring they continue to contribute to the economic security and sustainability of the broader Lux ecosystem.

## Motivation

Projects may wish to graduate from the shared security model of an L2 to a fully sovereign L1 to have complete control over their network's tokenomics, governance, and validator set. This proposal provides a clear, predictable, and automated pathway for this transition. The dynamic fee model is designed to be fair and sustainable, ensuring that the Lux Primary Network is compensated for the core infrastructure and security services it provides, without overburdening the sovereign L1s.

## Specification

**1. L2 Ascension Process:**

1.  **Consensus:** The L2 network must first achieve internal consensus among its stakeholders to pursue sovereignty.
2.  **Ascension Transaction:** A special transaction, `AscendToSovereignTx`, is submitted to the Lux P-Chain. This transaction must be signed by a threshold of the L2's governance.
3.  **Ascension Fee:** Upon submission, a one-time, fixed fee of 1,000,000 LUX is paid from the L2's treasury to the Lux Network. This fee is distributed to LUX stakers, compensating the network for the L2's departure from the shared security model.

Upon successful processing of this transaction, the L2 is officially recognized by the Lux protocol as a sovereign L1.

**2. L1 Validator Fee Model:**

Sovereign L1 validators do not stake LUX on the Primary Network. Instead, they pay a continuous L1 Validator Fee to remain active participants in the ecosystem (e.g., to be eligible for Warp Messaging 2.0).

*   **Fee Mechanism:** The fee model is a direct implementation of the algorithm specified in Lux's ACP-77. Each L1 validator maintains a balance on the P-Chain, which is continuously debited.
*   **Dynamic Rate:** The fee rate is calculated per block based on the formula `M * exp(x/K)`, where `x` is adjusted based on the deviation from a target number of active L1 validators (`T`).
*   **Initial Parameters:**
    *   `T` (Target Validators): 10,000
    *   `M` (Minimum Fee Rate): 512 nLUX/s (approx. 1.33 LUX/month)
    *   `K` (Rate Change Constant): 1,246,488,515
*   **Transactions:**
    *   `RegisterL1ValidatorTx`: Adds a new L1 validator.
    *   `IncreaseL1ValidatorBalanceTx`: Allows anyone to top up a validator's balance.
    *   `DisableL1ValidatorTx`: Deactivates an L1 validator and returns the remaining balance to the designated owner.

## Rationale

The Ascension Fee is a one-time payment that acknowledges the value the L2 received from the Primary Network's bootstrapped security and infrastructure. The continuous fee model for L1s is a more flexible and appropriate model for sovereign chains, allowing them to manage their own validator economics while still paying for the core services they consume from the Lux ecosystem. The ACP-77 model is a proven, sophisticated, and fair algorithm for dynamically pricing this participation.

## Security Considerations

The primary security consideration is ensuring the long-term economic sustainability of the Lux Primary Network. The fee parameters (`T`, `M`, `K`) have been chosen to be reasonable at launch but must be governable by the Lux community via future LPs to adapt to changing network conditions. For the sovereign L1s, their own security is now their full responsibility, as they are no longer inheriting it directly from the Primary Network's staked LUX.
## Implementation

### P-Chain Components
**Repository**: `node/`

### Ascension Transaction Types
- **Location**: `node/vms/platformvm/txs/`
  - `AscendToSovereignTx`: L2→L1 transition transaction
  - `RegisterL1ValidatorTx`: Add sovereign L1 validator
  - `IncreaseL1ValidatorBalanceTx`: Top-up validator balance
  - `DisableL1ValidatorTx`: Deactivate L1 validator

### Ascension Fee Processing
- **Implementation**: Platform VM state management
  - Fee collection from L2 treasury
  - Distribution to stakers
  - Transaction validation

- **Fee Parameters**:
  - Ascension Fee: 1,000,000 LUX (configurable via governance)
  - Dynamic L1 Fee: Configured per network parameters
  - Target validators: T = 10,000 (configurable)

### Dynamic L1 Fee Model
- **Algorithm**: Implemented in Platform VM
  - Formula: `M * exp(x/K)` per block deduction
  - Validator balance monitoring and debiting
  - Parameter adjustment via governance

- **Source**:
  - Located in `node/vms/platformvm/state/`
  - Balance tracking contracts
  - Fee calculation logic

### Testing and Deployment
```bash
cd node
# Test ascension transaction
go test ./vms/platformvm/txs -run TestAscend

# Test L1 fee dynamics
go test ./vms/platformvm -run TestL1Fee
```

### Governance Integration
- **LP Parameters**:
  - Ascension fee amount
  - Target validator count (T)
  - Minimum fee rate (M)
  - Rate change constant (K)

- **Community Governance**:
  - Proposals via LP process
  - Parameter adjustment via multi-sig
  - Fee balance monitoring and adjustments

### GitHub References
- **Node Implementation**: https://github.com/luxfi/node/tree/main/vms/platformvm
- **Transaction Types**: https://github.com/luxfi/node/tree/main/vms/platformvm/txs
- **State Management**: https://github.com/luxfi/node/tree/main/vms/platformvm/state

### Integration with Other LPs
- **LP-24**: Sovereign L1s participate in parallel validation
- **LP-22**: Warp 2.0 uses L1 validator set coordination
- **LP-21**: Bridge security for sovereign L1s

## Backwards Compatibility

This LP introduces additive capabilities and preserves existing behavior. Rollout can be staged without breaking prior deployments.
