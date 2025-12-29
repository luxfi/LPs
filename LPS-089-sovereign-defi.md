---
lps: 089
title: Per-Chain Governance Isolation
tags: [governance, sovereign, defi, subnet, isolation, autonomy]
description: Sovereign governance model allowing each subnet chain independent DeFi governance
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2022-06-01
references:
  - lps-085 (DAO Governance)
  - lps-086 (Governor Contract)
  - lps-080 (Treasury V2)
---

# LPS-089: Per-Chain Governance Isolation

## Abstract

Defines the sovereign governance model for Lux subnet chains. Each subnet chain (Zoo, Hanzo, SPC, Pars) maintains its own independent governance: its own governor contract, its own treasury, its own parameter set. The primary C-Chain DAO (LPS-085) governs cross-chain protocol parameters only. Subnet chains are sovereign within their domain.

## Specification

### Governance Layers

| Layer | Scope | Governor |
|-------|-------|----------|
| Protocol | Cross-chain parameters, validator set, fee split ratios | C-Chain DAO (LPS-085) |
| Subnet | Chain-specific parameters, local treasury, DeFi incentives | Per-chain Governor |

### Per-Chain Governor

Each subnet chain deploys its own Governor contract (LPS-086 template) with chain-specific voting token:

| Chain | Governance Token | Quorum |
|-------|-----------------|--------|
| Zoo | vZOO | 4% |
| Hanzo | vHANZO | 4% |
| SPC | vSPC | 4% |
| Pars | vPARS | 4% |

### Sovereign Parameters

Each chain independently controls:

| Parameter | Description |
|-----------|-------------|
| Gas pricing | Base fee target, minimum gas price |
| Block limits | Gas limit, block size |
| DeFi incentives | Liquidity mining allocations |
| Local treasury | Spending from chain-specific fee revenue |
| Contract upgrades | Chain-specific protocol contract updates |

### Cross-Chain Boundaries

The C-Chain DAO retains authority over:
- Validator set composition and staking parameters.
- Warp messaging configuration.
- Cross-chain fee collection ratios (LPS-080).
- Network-wide protocol upgrades (node software).

### Dispute Resolution

If a subnet governance decision conflicts with protocol-level parameters, the protocol-level DAO takes precedence. The C-Chain Governor can veto subnet decisions that affect cross-chain security via the `protocolOverride()` function.

## Security Considerations

1. Subnet chains cannot unilaterally modify validator sets or Warp messaging. These remain under protocol governance.
2. Each chain's governance token is independent. A whale on Zoo cannot influence Pars governance.
3. The protocol override power is a safety valve, not routine. It requires 67% supermajority of the C-Chain DAO.
4. Governance isolation means a compromised subnet DAO cannot affect other chains or the protocol.

## Reference

| Resource | Location |
|----------|----------|
| Governor template | `github.com/luxfi/standard/contracts/governance/LuxGovernor.sol` |
| Subnet governance configs | `github.com/luxfi/standard/contracts/governance/subnet/` |

## Copyright

Copyright (C) 2022-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
