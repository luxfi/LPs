---
lp: 3101
title: DEX Compliance Hook
tags: [securities, compliance, dex, hook, precompile, regulated-trading]
description: ComplianceHook integration with V4 DEX precompile for regulated on-chain trading
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Markets
created: 2026-02-26
requires:
  - lps-001 (Digital Securities Standard)
  - lp-9010 (DEX Precompile)
  - lp-3020 (LRC-20 Fungible Token)
references:
  - Uniswap V4 Hooks: https://docs.uniswap.org/contracts/v4/concepts/hooks
---

# LP-3101: DEX Compliance Hook

## Abstract

This specification defines `ComplianceHook`, a hook contract for the Lux V4 DEX precompile (LP-9010) that enforces transfer restrictions on security token swaps. The same DEX binary operates in two modes: unregulated (permissionless, any ERC-20) and regulated (compliance-enforced, security tokens). The difference is configuration -- whether a pool has a ComplianceHook attached.

## Motivation

Security tokens cannot trade on permissionless DEXs. Every swap involving a security token is a transfer that must pass compliance checks (KYC, accreditation, jurisdiction, lockup). Without enforcement at the DEX layer, an investor could bypass compliance by swapping through a pool instead of calling `transfer()` directly.

The Uniswap V4 hooks architecture solves this cleanly. A hook contract executes before and/or after each swap, providing a natural enforcement point. Lux implements this as a native precompile hook, not a Solidity contract, for gas efficiency and tamper resistance.

## Design Principles

1. **Same binary, different config.** The DEX precompile is one piece of software. A pool with no hook is permissionless. A pool with `ComplianceHook` is regulated. No code fork.
2. **Compliance at the pool level.** Each pool independently decides its compliance posture. A USDC/ETH pool is permissionless. An ACME-SHARES/USDC pool has `ComplianceHook`.
3. **No new compliance logic.** `ComplianceHook` delegates entirely to `ComplianceRegistry`. The same compliance rules that govern direct `transfer()` govern DEX swaps.
4. **Fail closed.** If the compliance check reverts or returns false, the swap reverts. There is no fallback, no degraded mode.

## Hook Architecture

### V4 Hook Lifecycle

The Lux DEX precompile (LP-9010) implements the Uniswap V4 PoolManager pattern with the following hook points:

```
beforeInitialize -> afterInitialize
beforeAddLiquidity -> afterAddLiquidity
beforeRemoveLiquidity -> afterRemoveLiquidity
beforeSwap -> afterSwap
beforeDonate -> afterDonate
```

`ComplianceHook` uses:
- `beforeSwap` -- validate that both counterparties pass compliance before the swap executes
- `afterSwap` -- post-trade reporting (emit events for off-chain surveillance)
- `beforeAddLiquidity` -- validate LP provider is whitelisted (for regulated pools)
- `beforeRemoveLiquidity` -- validate LP provider is still in good standing

### ComplianceHook Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHooks} from "@luxfi/dex/interfaces/IHooks.sol";
import {PoolKey} from "@luxfi/dex/types/PoolKey.sol";
import {BalanceDelta} from "@luxfi/dex/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "@luxfi/dex/types/BeforeSwapDelta.sol";
import {ComplianceRegistry} from "@luxfi/standard/securities/compliance/ComplianceRegistry.sol";

contract ComplianceHook is IHooks {
    ComplianceRegistry public immutable REGISTRY;

    error SwapRestricted(address account, uint8 restrictionCode);
    error LiquidityRestricted(address account, uint8 restrictionCode);

    constructor(ComplianceRegistry _registry) {
        REGISTRY = _registry;
    }

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external returns (bytes4, BeforeSwapDelta, uint24) {
        // Decode the actual trader (sender may be a router)
        address trader = hookData.length >= 20
            ? abi.decode(hookData, (address))
            : sender;

        // Check compliance for the trader
        (bool allowed, uint8 code) = REGISTRY.canTransfer(
            trader,    // from
            trader,    // to (self, for swap eligibility)
            0          // amount not relevant for eligibility
        );
        if (!allowed) revert SwapRestricted(trader, code);

        return (IHooks.beforeSwap.selector, BeforeSwapDelta(0, 0), 0);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external returns (bytes4, int128) {
        // Post-trade event for surveillance
        // (implementation emits TradeExecuted event)
        return (IHooks.afterSwap.selector, 0);
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) external returns (bytes4) {
        address provider = hookData.length >= 20
            ? abi.decode(hookData, (address))
            : sender;

        (bool allowed, uint8 code) = REGISTRY.canTransfer(provider, provider, 0);
        if (!allowed) revert LiquidityRestricted(provider, code);

        return (IHooks.beforeAddLiquidity.selector);
    }
}
```

### Address Prefix Pattern

Uniswap V4 uses the hook contract address to determine which hook functions are active. The leading bytes of the address encode permissions as flags.

For compliance hooks, the canonical address prefix is:

```
0x07D4............................................
```

The `0x07D4` prefix encodes the following permission flags:

| Bit | Permission | Enabled |
|-----|-----------|---------|
| 0 | beforeInitialize | No |
| 1 | afterInitialize | No |
| 2 | beforeAddLiquidity | Yes |
| 3 | afterAddLiquidity | No |
| 4 | beforeRemoveLiquidity | Yes |
| 5 | afterRemoveLiquidity | No |
| 6 | beforeSwap | Yes |
| 7 | afterSwap | Yes |
| 8 | beforeDonate | No |
| 9 | afterDonate | No |

`0x07D4` = `0000 0111 1101 0100` -- enabling beforeAddLiquidity, beforeRemoveLiquidity, beforeSwap, and afterSwap.

Hook deployment uses `CREATE2` with a salt mined to produce an address starting with `0x07D4`. The mining process:

```solidity
bytes32 salt = keccak256(abi.encodePacked(deployer, nonce));
address hook = CREATE2(salt, type(ComplianceHook).creationCode, abi.encode(registry));
require(uint160(hook) >> 148 == 0x07D4); // verify prefix
```

### Pool Configuration

When creating a regulated pool:

```solidity
PoolKey memory key = PoolKey({
    currency0: Currency.wrap(address(securityToken)),
    currency1: Currency.wrap(address(usdc)),
    fee: 3000,                    // 0.3% fee tier
    tickSpacing: 60,
    hooks: IHooks(complianceHook) // compliance hook address (0x07D4...)
});

poolManager.initialize(key, sqrtPriceX96);
```

When creating an unregulated pool, simply omit the hook or use a different hook:

```solidity
PoolKey memory key = PoolKey({
    currency0: Currency.wrap(address(tokenA)),
    currency1: Currency.wrap(address(tokenB)),
    fee: 3000,
    tickSpacing: 60,
    hooks: IHooks(address(0))     // no hook -- permissionless
});
```

## Regulated vs Unregulated DEX

### Same Binary, Different Config

The Lux DEX precompile (LP-9010) does not distinguish between "regulated mode" and "unregulated mode" at the protocol level. The distinction is per-pool:

| Pool Type | Hook | Behavior |
|---|---|---|
| Permissionless | `address(0)` or utility hook | Any address can trade |
| Regulated | `ComplianceHook` at `0x07D4...` | Only whitelisted addresses can trade |
| Mixed fee | `DynamicFeeHook` | Custom fee logic |

This means a single DEX deployment serves both regulated and unregulated markets. No separate infrastructure. No separate liquidity.

### What This Enables

1. **Institutional DeFi**: Security tokens trading on a DEX with full compliance enforcement
2. **Hybrid pools**: A regulated security token paired with a permissionless stablecoin
3. **Compliance-as-a-service**: Third-party compliance providers deploy their own hooks
4. **Regulatory clarity**: Regulators can verify compliance enforcement by inspecting the hook address

### What This Prevents

1. **Compliance bypass**: An investor cannot buy a security token on a permissionless pool because the token's `_update()` hook (in `SecurityToken`) also enforces compliance. Even if somehow a pool existed without a ComplianceHook, the underlying token transfer would revert.
2. **Unauthorized market making**: Only whitelisted addresses can add liquidity to regulated pools.

## Trade Surveillance

`ComplianceHook.afterSwap` emits events consumed by the off-chain surveillance system:

```solidity
event RegulatedSwap(
    address indexed trader,
    address indexed token0,
    address indexed token1,
    int256 amount0,
    int256 amount1,
    uint160 sqrtPriceX96,
    uint128 liquidity,
    int24 tick,
    uint256 timestamp
);
```

The surveillance system (`lux/cex` monitoring module) indexes these events for:
- Wash trading detection
- Insider trading pattern analysis
- Market manipulation alerts
- FINRA trade reporting (TRACE for fixed income, ORF for OTC equity)

## Gas Considerations

The ComplianceHook adds a `ComplianceRegistry.canTransfer()` call to every swap. This is a `view` call that reads:
- 2 storage slots (whitelist sender, whitelist receiver)
- 2 storage slots (blacklist sender, blacklist receiver)
- 1 storage slot (lockup sender)
- N module calls (typically 0-3 modules, each 1-3 storage reads)

Estimated additional gas per swap: ~8,000-15,000 gas depending on module count. This is acceptable for regulated markets where compliance cost is already priced in.

On the native DEX precompile (LP-9010), compliance checks execute as precompile-to-precompile calls, reducing overhead to ~3,000-5,000 gas.

## Deployment

1. Deploy `ComplianceRegistry` (if not already deployed for this token)
2. Mine a `CREATE2` salt producing an address with `0x07D4` prefix
3. Deploy `ComplianceHook` with the registry address using the mined salt
4. Create the regulated pool with the hook address
5. Add initial liquidity (liquidity provider must be whitelisted)

## Security Considerations

1. **Hook immutability**: Once a pool is initialized with a hook, the hook cannot be changed. This prevents compliance removal after pool creation.
2. **Registry upgrades**: The hook points to an immutable registry address. To upgrade compliance rules, deploy new modules and add them to the existing registry. Do not redeploy the registry.
3. **Router trust**: The `hookData` parameter is used to pass the actual trader address when a swap goes through a router. Routers must be trusted -- a malicious router could pass a whitelisted address while executing for a non-whitelisted user. Regulated routers should be whitelisted separately.
4. **MEV protection**: ComplianceHook does not prevent MEV. For MEV protection on regulated pools, combine with the SNIPER order type (LP-9010) or a separate MEV protection hook.

## Reference

| Resource | Location |
|---|---|
| ComplianceRegistry contract | `github.com/luxfi/standard/contracts/securities/compliance/ComplianceRegistry.sol` |
| DEX Precompile spec | `lp-9010-dex-precompile.md` |
| LPS-001 Digital Securities | `LPS-001-digital-securities.md` |
| Uniswap V4 Hook Reference | https://docs.uniswap.org/contracts/v4/concepts/hooks |

## Copyright

Copyright (c) 2026 Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
