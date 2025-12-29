---
lps: 080
title: Cross-Chain Fee Collection via Warp
tags: [treasury, fee, warp, cross-chain, collection]
description: Cross-chain fee aggregation from all subnet chains to the primary treasury
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2025-12-01
references:
  - lps-079 (Burn Addresses)
  - lps-081 (Fee Splitter)
  - lp-6022 (Warp Messaging)
---

# LPS-080: Cross-Chain Fee Collection via Warp

## Abstract

Defines the cross-chain fee collection mechanism for Lux Network. Each subnet chain (Zoo, Hanzo, SPC, Pars, and future chains) collects transaction fees in its native gas token. The `FeeCollector` contract on each chain periodically sweeps accumulated fees to the C-Chain treasury via Warp messaging (LP-6022). The C-Chain treasury then routes fees through the fee splitter (LPS-081).

## Specification

### Architecture

```
Subnet Chain (Zoo)                C-Chain
  FeeCollector                      TreasuryV2
    |-- accumulates fees              |-- receives Warp transfers
    |-- sweep() triggers Warp  --->   |-- routes to FeeSplitter
    |-- configurable interval         |-- emits FeeReceived event
```

### FeeCollector Contract

Deployed on each subnet chain:

| Function | Description |
|----------|-------------|
| `sweep()` | Sends accumulated fees to C-Chain TreasuryV2 via Warp |
| `setInterval(uint256)` | Minimum seconds between sweeps (default: 86400 = 1 day) |
| `setMinAmount(uint256)` | Minimum balance to trigger sweep (avoids dust transfers) |

### Warp Message

The sweep sends a Warp message containing:

| Field | Type | Description |
|-------|------|-------------|
| sourceChain | bytes32 | Originating chain ID |
| amount | uint256 | Fee amount in native token |
| token | address | Token address (native = 0x0) |
| epoch | uint256 | Collection epoch number |

### Fee Denomination

Subnet chains may use different gas tokens. The TreasuryV2 contract on C-Chain accepts all Lux-native tokens and converts to LUX via the DEX precompile (LP-9010) before routing to the fee splitter.

### Collection Schedule

| Parameter | Default | Governance Range |
|-----------|---------|-----------------|
| Sweep interval | 24 hours | 1 hour - 30 days |
| Minimum amount | 100 LUX equivalent | 1 - 10,000 LUX |
| Maximum per sweep | unlimited | configurable |

## Security Considerations

1. Sweep is permissionless -- anyone can call it. No keeper dependency.
2. Warp message signatures are validated by BLS quorum (LPS-075) on the destination chain.
3. The FeeCollector holds no admin keys. Parameters are set by governance timelock only.
4. Failed sweeps (Warp message rejected) retry on the next interval. Fees are never lost.

## Reference

| Resource | Location |
|----------|----------|
| FeeCollector contract | `github.com/luxfi/standard/contracts/treasury/FeeCollector.sol` |
| TreasuryV2 contract | `github.com/luxfi/standard/contracts/treasury/TreasuryV2.sol` |
| Warp messaging | `github.com/luxfi/evm/warp/` |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
