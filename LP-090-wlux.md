---
lp: 090
title: Wrapped LUX (WLUX)
tags: [wlux, wrapped, erc20, native, token]
description: ERC-20 wrapped version of native LUX for DeFi composability
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Token
created: 2020-06-01
references:
  - lps-091 (Bridge Tokens)
  - lps-094 (Liquid LUX)
---

# LP-090: Wrapped LUX (WLUX)

## Abstract

Defines WLUX, the canonical ERC-20 wrapper for native LUX on all EVM chains. WLUX enables native LUX to be used in DeFi protocols that require ERC-20 interface compatibility. The contract is a 1:1 deposit/withdrawal wrapper with no fees, no admin keys, and no upgrade mechanism.

## Specification

### Contract

```solidity
contract WLUX is ERC20 {
    function deposit() external payable;     // msg.value LUX -> WLUX
    function withdraw(uint256 amount) external; // WLUX -> LUX
    receive() external payable;              // same as deposit()
}
```

### Properties

| Property | Value |
|----------|-------|
| Name | Wrapped LUX |
| Symbol | WLUX |
| Decimals | 18 |
| Exchange rate | 1 WLUX = 1 LUX (always) |
| Admin keys | None |
| Upgrade proxy | None (immutable) |
| Fee | 0 |

### Deployment

WLUX is deployed at a deterministic address on every EVM chain using CREATE2:

```
Address: 0x4C4f4c55580000000000000000000000574c5558
Salt: keccak256("WLUX_V1")
```

The same address on C-Chain, Zoo, Hanzo, SPC, Pars, and all future subnet chains.

### DeFi Integration

WLUX is the canonical pair token for:
- DEX pools (LUX/USDC becomes WLUX/USDC under the hood)
- Lending protocols (collateral)
- Yield aggregators (base asset)

The DEX precompile (LP-9010) natively wraps/unwraps LUX so users never interact with WLUX directly.

## Security Considerations

1. WLUX is immutable. No admin, no proxy, no upgrade path. The code is the contract.
2. The contract balance always equals totalSupply. Any discrepancy indicates a bug.
3. Reentrancy: `withdraw()` follows checks-effects-interactions. Balance is decremented before the LUX transfer.
4. WLUX inherits the security model of the underlying chain. It adds no additional trust assumptions.

## Reference

| Resource | Location |
|----------|----------|
| WLUX contract | `github.com/luxfi/standard/contracts/token/WLUX.sol` |
| Deployment script | `github.com/luxfi/standard/script/DeployWLUX.s.sol` |

## Copyright

Copyright (C) 2020-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
