---
lp: 9015
title: Precompile Registry - LP-Aligned Trailing Address Scheme
tags: [precompile, registry, core, infrastructure]
description: Central registry of all Lux precompile addresses using trailing LP numbers
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-21
updated: 2026-01-05
requires: 0099
implementation: |
  - Go: ~/work/lux/precompile/dex/module.go
  - Solidity: ~/work/lux/standard/contracts/precompile/LX.sol
  - TypeScript: ~/work/lux/exchange/packages/dex/src/precompile/addresses.ts
order: 15
---

## Abstract

LP-9015 specifies the canonical precompile address scheme for the Lux ecosystem using a simple trailing LP number format: `0x0000000000000000000000000000000000LPNUM`. This creates a direct 1:1 mapping between LP documentation numbers and precompile addresses.

## Motivation

### Direct LP Alignment

The trailing LP format is maximally simple:
- **LP-9010** (LXPool) → `0x0000000000000000000000000000000000009010`
- **LP-9011** (LXOracle) → `0x0000000000000000000000000000000000009011`
- **LP-6010** (Teleport) → `0x0000000000000000000000000000000000006010`

No calculations needed. The LP number IS the address suffix.

### LX Naming Convention

**LX** is the umbrella name for the Lux DEX stack (AMM + CLOB + vaults + feeds + routing).
Individual precompiles use the **LX prefix** for developer-facing clarity:

| Human Name | Technical Name | Purpose |
|------------|---------------|---------|
| LX | (umbrella) | The whole on-chain trading system |
| LXPool | LP-9010 | v4 PoolManager-compatible AMM core |
| LXOracle | LP-9011 | Multi-source price aggregation |
| LXRouter | LP-9012 | Optimized swap routing |
| LXHooks | LP-9013 | Hook contract registry |
| LXFlash | LP-9014 | Flash loan facility |
| LXBook | LP-9020 | Permissionless orderbooks + matching + advanced orders |
| LXVault | LP-9030 | Balances, margin, collateral, liquidations |
| LXFeed | LP-9040 | Price feed aggregator |

### Benefits

1. **Zero Ambiguity**: LP number directly visible in address
2. **Easy Discovery**: Looking at address immediately tells you the LP
3. **Multi-Chain Consistent**: Same address on all EVM chains (C-Chain, Zoo, Hanzo, SPC)
4. **Maximum Simplicity**: No encoding scheme to learn or compute

## Specification

### Address Format

```
Address = 0x0000000000000000000000000000000000LPNUM

Where:
  LPNUM = The LP number (4 digits, hex-encoded)

Examples:
  LP-9010 → 0x0000000000000000000000000000000000009010
  LP-9011 → 0x0000000000000000000000000000000000009011
  LP-6010 → 0x0000000000000000000000000000000000006010
```

### Canonical Address Registry

#### LX Precompiles (LP-9xxx - AMM + CLOB)

| Address | LP | Name | Description |
|---------|-----|------|-------------|
| `0x0000000000000000000000000000000000009010` | LP-9010 | LXPool | v4 PoolManager-compatible AMM core |
| `0x0000000000000000000000000000000000009011` | LP-9011 | LXOracle | Multi-source price aggregation |
| `0x0000000000000000000000000000000000009012` | LP-9012 | LXRouter | Optimized swap routing |
| `0x0000000000000000000000000000000000009013` | LP-9013 | LXHooks | Hook contract registry |
| `0x0000000000000000000000000000000000009014` | LP-9014 | LXFlash | Flash loan facility |
| `0x0000000000000000000000000000000000009020` | LP-9020 | LXBook | Permissionless orderbooks + matching + advanced orders |
| `0x0000000000000000000000000000000000009030` | LP-9030 | LXVault | Balances, margin, collateral, liquidations |
| `0x0000000000000000000000000000000000009040` | LP-9040 | LXFeed | Price feed aggregator |

#### Bridge Precompiles (LP-6xxx)

| Address | LP | Name | Description |
|---------|-----|------|-------------|
| `0x0000000000000000000000000000000000006010` | LP-6010 | Teleport | Cross-chain asset teleportation |

### Solidity Registry

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

/// @title LX
/// @notice LP-aligned LX precompile address constants
/// @dev Address format: 0x0000000000000000000000000000000000LPNUM
library LX {
    // Core AMM (LP-9010 series - Uniswap v4 style)
    address internal constant LX_POOL   = 0x0000000000000000000000000000000000009010; // LP-9010 LXPool
    address internal constant LX_ORACLE = 0x0000000000000000000000000000000000009011; // LP-9011 LXOracle
    address internal constant LX_ROUTER = 0x0000000000000000000000000000000000009012; // LP-9012 LXRouter
    address internal constant LX_HOOKS  = 0x0000000000000000000000000000000000009013; // LP-9013 LXHooks
    address internal constant LX_FLASH  = 0x0000000000000000000000000000000000009014; // LP-9014 LXFlash

    // Trading & DeFi Extensions
    address internal constant LX_BOOK   = 0x0000000000000000000000000000000000009020; // LP-9020 LXBook
    address internal constant LX_VAULT  = 0x0000000000000000000000000000000000009030; // LP-9030 LXVault
    address internal constant LX_FEED   = 0x0000000000000000000000000000000000009040; // LP-9040 LXFeed

    // Bridge Precompiles (LP-6xxx)
    address internal constant TELEPORT  = 0x0000000000000000000000000000000000006010; // LP-6010

    /// @notice Generate precompile address from LP number
    function fromLP(uint16 lpNumber) internal pure returns (address) {
        return address(uint160(lpNumber));
    }

    /// @notice Extract LP number from precompile address
    function toLP(address precompile) internal pure returns (uint16) {
        return uint16(uint160(precompile));
    }

    /// @notice Check if address is an LX precompile (LP-9xxx)
    function isLXPrecompile(address addr) internal pure returns (bool) {
        uint16 lp = uint16(uint160(addr));
        return lp >= 9000 && lp < 10000;
    }

    /// @notice Check if address is a Bridge precompile (LP-6xxx)
    function isBridgePrecompile(address addr) internal pure returns (bool) {
        uint16 lp = uint16(uint160(addr));
        return lp >= 6000 && lp < 7000;
    }
}
```

### Go Registry

```go
package lxdex

import (
    "fmt"
    "github.com/luxfi/geth/common"
)

// LX Precompile addresses - trailing LP number format
// Address = 0x0000000000000000000000000000000000LPNUM
const (
    // Core AMM (LP-9010 series - Uniswap v4 style)
    LXPool   = "0x0000000000000000000000000000000000009010" // LP-9010 LXPool
    LXOracle = "0x0000000000000000000000000000000000009011" // LP-9011 LXOracle
    LXRouter = "0x0000000000000000000000000000000000009012" // LP-9012 LXRouter
    LXHooks  = "0x0000000000000000000000000000000000009013" // LP-9013 LXHooks
    LXFlash  = "0x0000000000000000000000000000000000009014" // LP-9014 LXFlash

    // Trading & DeFi Extensions
    LXBook  = "0x0000000000000000000000000000000000009020" // LP-9020 LXBook
    LXVault = "0x0000000000000000000000000000000000009030" // LP-9030 LXVault
    LXFeed  = "0x0000000000000000000000000000000000009040" // LP-9040 LXFeed

    // Bridge Precompiles (LP-6xxx)
    Teleport = "0x0000000000000000000000000000000000006010" // LP-6010
)

// PrecompileAddress generates address from LP number
// Example: PrecompileAddress(9010) → 0x0000...009010
func PrecompileAddress(lpNumber uint16) common.Address {
    addr := fmt.Sprintf("0x%040x", lpNumber)
    return common.HexToAddress(addr)
}

// ToLP extracts LP number from precompile address
func ToLP(addr common.Address) uint16 {
    bytes := addr.Bytes()
    return uint16(bytes[18])<<8 | uint16(bytes[19])
}

// IsLXPrecompile checks if address is in LP-9xxx range
func IsLXPrecompile(addr common.Address) bool {
    lp := ToLP(addr)
    return lp >= 9000 && lp < 10000
}

// IsBridgePrecompile checks if address is in LP-6xxx range
func IsBridgePrecompile(addr common.Address) bool {
    lp := ToLP(addr)
    return lp >= 6000 && lp < 7000
}
```

### TypeScript Registry

```typescript
import type { Address } from 'viem'

/**
 * LX Precompile addresses (LP-9xxx - Uniswap v4 style)
 * Address format: 0x0000000000000000000000000000000000LPNUM
 */
export const LX = {
  // Core AMM (LP-9010 series)
  LX_POOL:   '0x0000000000000000000000000000000000009010' as Address, // LP-9010 LXPool
  LX_ORACLE: '0x0000000000000000000000000000000000009011' as Address, // LP-9011 LXOracle
  LX_ROUTER: '0x0000000000000000000000000000000000009012' as Address, // LP-9012 LXRouter
  LX_HOOKS:  '0x0000000000000000000000000000000000009013' as Address, // LP-9013 LXHooks
  LX_FLASH:  '0x0000000000000000000000000000000000009014' as Address, // LP-9014 LXFlash

  // Trading & DeFi Extensions
  LX_BOOK:  '0x0000000000000000000000000000000000009020' as Address, // LP-9020 LXBook
  LX_VAULT: '0x0000000000000000000000000000000000009030' as Address, // LP-9030 LXVault
  LX_FEED:  '0x0000000000000000000000000000000000009040' as Address, // LP-9040 LXFeed

  // Bridges (LP-6xxx)
  TELEPORT: '0x0000000000000000000000000000000000006010' as Address, // LP-6010
} as const

/**
 * Generate precompile address from LP number
 */
export function fromLP(lpNumber: number): Address {
  return `0x${lpNumber.toString(16).padStart(40, '0')}` as Address
}

/**
 * Extract LP number from precompile address
 */
export function toLP(address: Address): number {
  return parseInt(address.slice(-4), 16)
}

/**
 * Check if address is an LX precompile (LP-9xxx)
 */
export function isLXPrecompile(address: Address): boolean {
  const lp = toLP(address)
  return lp >= 9000 && lp < 10000
}
```

## Rationale

### Why Trailing LP Numbers?

The trailing LP scheme was chosen for:

1. **Maximum Simplicity**: No formula to remember - LP number IS the address
2. **Human Readable**: `0x...9010` is obviously LP-9010
3. **Universal**: Same address works on all EVM chains
4. **Debuggable**: Easy to identify precompile calls in traces

### Previous Schemes Deprecated

The old `0x0200...00XX` scheme was deprecated because:
- Wasted 38 zero bytes with no benefit
- Required complex encoding/decoding
- No relationship to LP documentation
- Limited extensibility

The intermediate `BASE + PCII` scheme was also rejected:
- Required knowing the formula
- Different addresses per chain
- Added unnecessary complexity

## Multi-Chain Deployment

All precompiles use identical addresses across all Lux EVM chains:

| Chain | Chain ID | LXPool Address |
|-------|----------|----------------|
| Lux Mainnet | 96369 | `0x...9010` |
| Lux Testnet | 96368 | `0x...9010` |
| Zoo Mainnet | 200200 | `0x...9010` |
| Zoo Testnet | 200201 | `0x...9010` |
| Hanzo Mainnet | 36963 | `0x...9010` |
| Hanzo Testnet | 36962 | `0x...9010` |
| SPC Mainnet | 36911 | `0x...9010` |
| LuxDev (Anvil) | 1337 | `0x...9010` |

## Test Cases

```solidity
function testAddressFromLP() public {
    assertEq(
        LXDEX.fromLP(9010),
        address(0x0000000000000000000000000000000000009010)
    );
    assertEq(
        LXDEX.fromLP(6010),
        address(0x0000000000000000000000000000000000006010)
    );
}

function testLPFromAddress() public {
    assertEq(
        LXDEX.toLP(address(0x0000000000000000000000000000000000009010)),
        9010
    );
}

function testIsLXDEXPrecompile() public {
    assertTrue(LXDEX.isLXDEXPrecompile(
        address(0x0000000000000000000000000000000000009010)
    ));
    assertFalse(LXDEX.isLXDEXPrecompile(
        address(0x0000000000000000000000000000000000006010)
    ));
}
```

## Security Considerations

### Address Validation

Applications should validate precompile addresses:

```solidity
function validateLXDEXPrecompile(address addr) internal pure {
    require(
        LXDEX.isLXDEXPrecompile(addr),
        "Not an LXDEX precompile"
    );
}
```

### Reserved Ranges

| LP Range | Purpose |
|----------|---------|
| 6000-6999 | Bridge precompiles |
| 9000-9099 | Core LXDEX (LXPool, LXOracle, LXRouter, LXHooks, LXFlash) |
| 9100-9199 | Reserved |
| 9200-9299 | Reserved |

## Implementation Status

All repositories have been updated to use the LP-aligned format with LXDEX naming:

- ✅ `~/work/lux/precompile/registry/registry.go` - Canonical Go registry
- ✅ `~/work/lux/precompile/dex/module.go` - LXDEX precompile implementation
- ✅ `~/work/lux/dex/pkg/gateway/lux/provider.go` - LXDEX gateway
- ✅ `~/work/lux/exchange/packages/dex/src/precompile/addresses.ts` - TypeScript registry

## Related LPs

- **LP-0099**: LP Numbering Scheme and Chain Organization
- **LP-9010**: LXPool - v4 PoolManager-Compatible AMM Core
- **LP-9011**: LXOracle - Multi-Source Price Aggregation
- **LP-6010**: Teleport Bridge Precompile
