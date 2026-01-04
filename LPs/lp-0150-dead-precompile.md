---
lp: 150
title: Dead Precompile - Treasury Burn Router
description: Precompile that routes burns to dead addresses (0x0, 0xdead) to DAO treasury with 50% actual burn and 50% protocol-owned liquidity
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Accepted
type: Standards Track
category: Core
created: 2026-01-03
tags: [precompile, treasury, burn, protocol-owned-liquidity, dao]
order: 50
---

## Abstract

The Dead Precompile intercepts all transfers to "dead" addresses (0x0, 0xdead, 0x000...dead, etc.) and routes them to the X-Chain DAO treasury. Instead of permanently destroying value, 50% is actually burned (deflationary) while 50% is tithed to the DAO as protocol-owned liquidity (POL). This creates a sustainable mechanism where burns contribute to protocol-controlled resources that can be deployed via governance into liquidity pools and other productive uses.

## Motivation

Current EVM implementations treat burns to dead addresses as permanent value destruction:

1. **Lost Value**: Burns to 0x0 or 0xdead permanently remove assets from circulation
2. **No Protocol Benefit**: Destroyed value doesn't benefit the protocol or community
3. **Deflationary Spiral**: Pure deflationary mechanics can harm liquidity
4. **Accidental Loss**: Users may accidentally send to 0x0 with no recourse

The Dead Precompile addresses these by:

| Problem | Solution |
|---------|----------|
| Permanent destruction | 50% burn + 50% treasury |
| No protocol benefit | Protocol-owned liquidity grows |
| Liquidity drain | POL deployed to AMM pools |
| Accidental sends | Governance can review edge cases |

**Design Philosophy**: To truly delete an asset from existence, users must destroy the contract itself - not just send tokens to a dead address.

## Specification

### 1. Precompile Address

```
Address: 0x000000000000000000000000000000000000dEaD
```

The precompile lives at the `0xdead` address itself - thematically appropriate!

**Note**: This deviates from the standard LP-aligned address scheme (`0x1PCII`) because:
- The precompile intercepts transfers TO dead addresses
- Having the precompile AT `0xdead` is semantically meaningful
- Users/contracts interacting with `0xdead` automatically route through the precompile

### 2. Dead Address Registry

The precompile intercepts transfers to the following addresses:

```solidity
// Primary dead addresses
address constant ZERO = 0x0000000000000000000000000000000000000000;
address constant DEAD = 0x000000000000000000000000000000000000dEaD;
address constant DEAD_FULL = 0xdEaD000000000000000000000000000000000000;

// Pattern matches (in EVM execution)
// - Any address starting with 0x00000000000000000000000000000000000000 (first 38 zeros)
// - Any address matching 0x[dD][eE][aA][dD]* pattern
```

### 3. Burn Routing Logic

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           DEAD PRECOMPILE FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  TRANSFER TO DEAD ADDRESS                                                               │
│  ┌─────────────┐                                                                        │
│  │ User sends  │                                                                        │
│  │ to 0x0/dead │                                                                        │
│  └──────┬──────┘                                                                        │
│         │                                                                                │
│         ▼                                                                                │
│  ┌─────────────────────────────────────────┐                                           │
│  │ Dead Precompile (0xdEaD) Intercepts     │                                           │
│  └──────────────────┬──────────────────────┘                                           │
│                     │                                                                    │
│         ┌───────────┴───────────┐                                                       │
│         ▼                       ▼                                                       │
│  ┌─────────────┐         ┌─────────────┐                                               │
│  │   50%       │         │   50%       │                                               │
│  │ ACTUAL BURN │         │ DAO TITHE   │                                               │
│  │ (deflation) │         │ (treasury)  │                                               │
│  └─────────────┘         └──────┬──────┘                                               │
│                                 │                                                        │
│                                 ▼                                                        │
│                          ┌─────────────┐                                               │
│                          │ X-Chain DAO │                                               │
│                          │  Treasury   │──────► Protocol-Owned Liquidity              │
│                          └─────────────┘        (deployed via governance)              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4. Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IDead - Dead Precompile Interface
/// @notice Routes burns to dead addresses to DAO treasury with configurable split
/// @dev Deployed at 0x000000000000000000000000000000000000dEaD
interface IDead {
    /// @notice Emitted when tokens are routed through Dead Precompile
    event BurnRouted(
        address indexed token,
        address indexed sender,
        uint256 totalAmount,
        uint256 burnedAmount,
        uint256 treasuryAmount
    );

    /// @notice Emitted when native LUX is routed through Dead Precompile
    event NativeBurnRouted(
        address indexed sender,
        uint256 totalAmount,
        uint256 burnedAmount,
        uint256 treasuryAmount
    );

    /// @notice Get the treasury address on X-Chain
    /// @return The DAO treasury address
    function treasury() external view returns (address);

    /// @notice Get the burn ratio in basis points (5000 = 50%)
    /// @return The burn ratio
    function burnRatio() external view returns (uint256);

    /// @notice Get the treasury ratio in basis points (5000 = 50%)
    /// @return The treasury ratio
    function treasuryRatio() external view returns (uint256);

    /// @notice Check if an address is considered "dead"
    /// @param addr The address to check
    /// @return True if the address is a dead address
    function isDeadAddress(address addr) external pure returns (bool);

    /// @notice Get total amount burned through this precompile
    /// @return Total burned amount in native units
    function totalBurned() external view returns (uint256);

    /// @notice Get total amount sent to treasury through this precompile
    /// @return Total treasury amount in native units
    function totalToTreasury() external view returns (uint256);

    /// @notice Get statistics for a specific token
    /// @param token The token address (address(0) for native)
    /// @return burned Total burned
    /// @return toTreasury Total sent to treasury
    function tokenStats(address token) external view returns (uint256 burned, uint256 toTreasury);
}
```

### 5. EVM Integration

The Dead Precompile hooks into EVM execution at the transfer level:

```go
// Package dead implements the Dead Precompile
package dead

import (
    "github.com/luxfi/evm/core/vm"
    "github.com/luxfi/evm/common"
)

// DeadAddresses that trigger the precompile
var DeadAddresses = []common.Address{
    common.HexToAddress("0x0000000000000000000000000000000000000000"),
    common.HexToAddress("0x000000000000000000000000000000000000dEaD"),
    common.HexToAddress("0xdEaD000000000000000000000000000000000000"),
}

// IsDeadAddress checks if an address should trigger the Dead Precompile
func IsDeadAddress(addr common.Address) bool {
    // Check explicit dead addresses
    for _, dead := range DeadAddresses {
        if addr == dead {
            return true
        }
    }
    // Check pattern: first 38 chars are zeros (address < 0x100)
    if addr.Big().Cmp(big.NewInt(0x100)) < 0 {
        return true
    }
    return false
}

// RouteTransfer intercepts transfers to dead addresses
func (d *DeadPrecompile) RouteTransfer(
    evm *vm.EVM,
    caller common.Address,
    to common.Address,
    value *big.Int,
) error {
    if !IsDeadAddress(to) {
        return nil // Not a dead address, proceed normally
    }

    // Calculate split
    burnAmount := new(big.Int).Div(value, big.NewInt(2))      // 50%
    treasuryAmount := new(big.Int).Sub(value, burnAmount)     // 50%

    // Actually burn 50%
    evm.StateDB.SubBalance(caller, burnAmount)
    // Note: No AddBalance - tokens are destroyed

    // Send 50% to treasury via Warp message to X-Chain
    if err := d.sendToTreasury(evm, caller, treasuryAmount); err != nil {
        return err
    }

    // Emit event
    d.emitBurnRouted(evm, caller, value, burnAmount, treasuryAmount)

    return nil
}
```

### 6. Treasury Integration

The treasury receives funds via Warp messaging to X-Chain:

```solidity
// Treasury address on X-Chain (governance-controlled multisig)
address constant DAO_TREASURY = 0x9011E888251AB053B7bD1cdB598Db4f9DEd94714;
```

**Treasury Operations** (governed by DAO):
- Deploy liquidity to AMM pools
- Fund development grants
- Protocol insurance reserves
- Validator incentives
- Ecosystem growth initiatives

### 7. True Asset Deletion

To truly delete an asset from existence (not just reduce supply), users must:

```solidity
// Option 1: Self-destruct the contract (deprecated in newer EVM)
selfdestruct(payable(address(0)));

// Option 2: Renounce ownership and freeze
function permanentlyDestroy() external onlyOwner {
    // Burn all remaining supply
    _burn(address(this), balanceOf(address(this)));
    // Renounce ownership
    renounceOwnership();
    // Pause forever
    _pause();
}
```

## Rationale

### 50/50 Split

The 50/50 split balances:
- **Deflationary pressure**: 50% is actually burned, reducing supply
- **Protocol growth**: 50% builds protocol-owned liquidity
- **Community benefit**: Treasury funds governed by token holders

### Cross-Chain Treasury

X-Chain treasury chosen because:
- Native UTXO model for secure multi-party control
- DAO governance via threshold signatures
- Cross-chain deployment via Warp messaging
- Supports all asset types (native, ERC20, NFT)

### Precompile vs Contract

Precompile implementation chosen because:
- Gas efficiency (native execution)
- Cannot be bypassed or upgraded maliciously
- Intercepts at EVM level before transfer completes
- Atomic with transfer execution

## Backwards Compatibility

This LP introduces a **breaking change** to burn semantics:

| Before | After |
|--------|-------|
| Burns to 0x0 destroy 100% | Burns to 0x0 destroy 50%, 50% to treasury |
| Burns to 0xdead destroy 100% | Burns to 0xdead destroy 50%, 50% to treasury |
| No protocol benefit | Protocol-owned liquidity grows |

**Migration**: No migration required. The precompile activates at a specified block height.

## Test Cases

### Test 1: Native LUX Burn

```solidity
function test_NativeBurn() public {
    uint256 amount = 100 ether;
    uint256 treasuryBefore = treasury.balance;

    // Send to dead address
    (bool success,) = address(0).call{value: amount}("");
    assertTrue(success);

    // 50% burned (no longer exists)
    // 50% to treasury
    assertEq(treasury.balance, treasuryBefore + 50 ether);
}
```

### Test 2: ERC20 Token Burn

```solidity
function test_ERC20Burn() public {
    uint256 amount = 1000e18;
    uint256 supplyBefore = token.totalSupply();
    uint256 treasuryBefore = token.balanceOf(treasury);

    // Burn to dead address
    token.transfer(address(0xdead), amount);

    // 50% burned from supply
    assertEq(token.totalSupply(), supplyBefore - 500e18);
    // 50% to treasury
    assertEq(token.balanceOf(treasury), treasuryBefore + 500e18);
}
```

### Test 3: Dead Address Detection

```solidity
function test_IsDeadAddress() public {
    IDead dead = IDead(0x000000000000000000000000000000000000dEaD);

    assertTrue(dead.isDeadAddress(address(0)));
    assertTrue(dead.isDeadAddress(0x000000000000000000000000000000000000dEaD));
    assertTrue(dead.isDeadAddress(0xdEaD000000000000000000000000000000000000));
    assertTrue(dead.isDeadAddress(address(0x1))); // < 0x100
    assertTrue(dead.isDeadAddress(address(0xFF))); // < 0x100

    assertFalse(dead.isDeadAddress(address(0x100))); // >= 0x100
    assertFalse(dead.isDeadAddress(address(this)));
}
```

## Security Considerations

### Reentrancy

The precompile executes atomically before transfer completion, preventing reentrancy attacks.

### Front-Running

Burns are atomic and cannot be front-run in a meaningful way since the split ratio is fixed.

### Treasury Security

The X-Chain treasury uses:
- Multi-signature governance (5-of-9)
- Time-locked operations (48h delay)
- On-chain proposal voting
- Audit trail via events

### Griefing

Attackers cannot grief the protocol by sending dust amounts - all burns contribute to POL regardless of size.

## Economic Impact

### Supply Dynamics

| Scenario | Traditional Burn | Dead Precompile |
|----------|-----------------|-----------------|
| 1M tokens burned | -1M supply | -500K supply, +500K POL |
| Fee burns | 100% deflationary | 50% deflationary, 50% productive |
| Accidental sends | 100% lost | 50% lost, 50% recoverable via governance |

### Protocol-Owned Liquidity

POL provides:
- **Permanent liquidity**: Never withdrawable by users
- **Fee generation**: LP fees flow to treasury
- **Price stability**: Deep liquidity reduces volatility
- **Governance power**: Protocol votes in DAO decisions

## Reference Implementation

### Source Repositories

| Repository | Path | Description |
|------------|------|-------------|
| [luxfi/precompile](https://github.com/luxfi/precompile) | `dead/` | Go precompile implementation |
| [luxfi/standard](https://github.com/luxfi/standard) | `contracts/precompile/interfaces/IDead.sol` | Solidity interface |
| [luxfi/geth](https://github.com/luxfi/geth) | `core/vm/` | EVM integration hooks |

### Key Files

**Go Implementation** (`luxfi/precompile/dead/`):
- `contract.go` - Core precompile logic, transfer interception, burn routing
- `contract_test.go` - 14 comprehensive tests for all functionality
- `module.go` - Precompile registration and configuration

**Solidity Interface** (`luxfi/standard/contracts/precompile/interfaces/IDead.sol`):
- Events: `BurnRouted`, `NativeBurnRouted`, `ConfigUpdated`
- Views: `treasury()`, `burnRatioBps()`, `totalBurned()`, `tokenStats()`
- Dead address check: `isDeadAddress(address)`
- Governance: `setTreasury()`, `setBurnRatio()`, `setEnabled()`

### Commits

| Repo | Commit | Description |
|------|--------|-------------|
| geth | `67bf83b` | deps: fix math/big replace directive |
| precompile | `95b2960` | feat(dead): LP-0150 implementation |
| standard | `d08e717` | feat(dead): use thematic 0xdead address |

## Cross-References

### Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| [LP-0110](./lp-0110-quasar-consensus.md) | Quasar Consensus | Consensus-level integration for burn finality |
| [LP-6022](./lp-6022-warp-messaging-20-native-interchain-transfers.md) | Warp Messaging | Cross-chain treasury transfers via Warp |
| [LP-3002](./lp-3002-governance-token-stack-k-dlux-vlux.md) | Governance Stack | DAO governance for treasury management |
| [LP-321](./lp-321.md) | FROST Threshold | Multi-sig treasury control |
| [LP-322](./lp-322-cggmp21-threshold-ecdsa.md) | CGGMP21 Threshold | ECDSA threshold for treasury |

### External Standards

- [EIP-6049: Deprecate SELFDESTRUCT](https://eips.ethereum.org/EIPS/eip-6049) - Context for true asset deletion
- [Protocol-Owned Liquidity (Olympus DAO)](https://docs.olympusdao.finance/main/overview/treasury) - POL design patterns

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-03 | 1.0.0 | Initial implementation, 14 tests passing |
| 2026-01-03 | 1.0.1 | Changed address from LP-aligned `0x10000` to thematic `0xdead` |
