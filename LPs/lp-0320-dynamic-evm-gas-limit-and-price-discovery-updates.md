---
lp: 0320
title: Dynamic EVM Gas Limit and Price Discovery Updates
description: Dynamic gas limit adjustments and EIP-1559 fee mechanism for Lux C-Chain
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2024-10-15
updated: 2024-11-20
replaces: 176
activation:
  flag: lp176-dynamic-gas
  hfName: "Granite"
  activationHeight: "0"
---

## Abstract
This proposal implements dynamic gas limit and price discovery mechanisms for the EVM to improve network efficiency and fee predictability.

## Motivation
The current static gas limits and fee mechanisms can lead to:
- Network congestion during peak usage
- Unpredictable transaction costs
- Inefficient resource utilization
- Poor user experience during high-demand periods

## Specification

### Dynamic Gas Limits
The implementation provides adaptive gas limits based on:
- Network utilization metrics
- Block fill rates
- Transaction queue depth
- Historical demand patterns

### Price Discovery
Implements improved fee estimation through:
- Real-time demand analysis
- Predictive modeling for fee trends
- Market-based pricing mechanisms
- Priority fee optimization

### Implementation Details
Located in: `vms/evm/lp176/`

Key components:
- `State`: Manages dynamic fee state
- `Reader`: Provides fee calculation interfaces
- Gas target and capacity management
- Excess gas tracking for EIP-1559 compatibility

## Rationale

### Design Decisions

**1. EIP-1559 Compatibility**: Building on the proven EIP-1559 mechanism ensures compatibility with existing Ethereum tooling and user expectations for predictable fee estimation.

**2. Dynamic Gas Limit**: Adaptive gas limits allow the network to handle varying load conditions without manual intervention, improving throughput during high demand.

**3. Exponential Adjustment**: The exponential adjustment curve (from LP-176) provides smooth transitions while preventing rapid oscillations that could destabilize fee markets.

**4. Per-Chain Configuration**: Each chain (C-Chain, subnets) can configure its own gas parameters based on specific performance requirements and use cases.

### Alternatives Considered

- **Fixed gas price**: Rejected as it cannot adapt to network conditions
- **Linear adjustment**: Rejected due to potential for manipulation and slow response to congestion
- **Off-chain fee oracles**: Rejected as they introduce trust assumptions and latency

## Backwards Compatibility
Fully backwards compatible with existing EVM transactions while providing enhanced fee mechanisms for new transactions.

## Security Considerations
- Prevents fee manipulation attacks
- Ensures deterministic fee calculations
- Maintains consensus on fee state across validators

## Test Cases
Comprehensive test suite in `vms/evm/lp176/lp176_test.go` covering:
- Dynamic target calculations
- Fee estimation accuracy
- State transitions
- Edge cases and bounds checking

## Implementation
- **Node**: github.com/luxfi/node v1.17.1+
- **Consensus**: Integrated with Lux consensus v1.18.1
- **Activation**: Post-Etna upgrade

## References
- EIP-1559: Fee market change for ETH 1.0 chain
- Original ACP-176 (migrated to LP-176)
- Lux fee mechanism research

## Copyright
Copyright (c) 2025 Lux Industries, Inc. All rights reserved.