---
lp: 10201
title: LRC-7201 Namespaced Storage Layout
description: Standard storage layout for upgradeable contracts avoiding slot collisions
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 4967
tags: [lrc, infrastructure, proxy]
order: 640
---

# LP-3722: LRC-7201 Namespaced Storage Layout

## Abstract

LRC-7201 defines a standard for organizing contract storage into namespaces, preventing slot collisions in upgradeable contracts and diamond proxies. Compatible with ERC-7201.

## Motivation

Upgradeable contracts face storage collision risks:
- New variables can overwrite existing data
- Inherited contracts may conflict
- Diamond facets share storage space

Namespaced storage provides:
- Collision-free storage allocation
- Clear ownership of storage regions
- Predictable upgrade paths

## Specification

### Namespace Formula

```solidity
// Storage slot = keccak256(namespace) - 1
// The -1 ensures the slot itself isn't at the namespace hash
bytes32 constant NAMESPACE = keccak256("example.storage.namespace") - 1;
```solidity

### Standard Namespace

```solidity
library StorageNamespace {
    /// @dev Standard namespace formula from ERC-7201
    function deriveSlot(string memory namespace) 
        internal 
        pure 
        returns (bytes32) 
    {
        return keccak256(
            abi.encode(
                uint256(keccak256(bytes(namespace))) - 1
            )
        ) & ~bytes32(uint256(0xff));
    }
}
```

### Implementation Pattern

```solidity
contract MyUpgradeableContract {
    /// @custom:storage-location erc7201:myproject.storage.main
    struct MainStorage {
        uint256 value;
        mapping(address => uint256) balances;
        address owner;
    }
    
    // Derived slot for "myproject.storage.main"
    bytes32 private constant MAIN_STORAGE_SLOT = 
        0x1234...;  // keccak256("myproject.storage.main") - 1
    
    function _getMainStorage() private pure returns (MainStorage storage $) {
        assembly {
            $.slot := MAIN_STORAGE_SLOT
        }
    }
    
    function setValue(uint256 newValue) external {
        MainStorage storage $ = _getMainStorage();
        $.value = newValue;
    }
    
    function getValue() external view returns (uint256) {
        return _getMainStorage().value;
    }
}
```solidity

### Diamond Pattern Integration

```solidity
// Facet A storage
contract FacetA {
    /// @custom:storage-location erc7201:diamond.facetA
    struct FacetAStorage {
        uint256 stateA;
    }
    
    bytes32 constant FACET_A_SLOT = 
        keccak256("diamond.facetA") - 1;
}

// Facet B storage - no collision with Facet A
contract FacetB {
    /// @custom:storage-location erc7201:diamond.facetB
    struct FacetBStorage {
        uint256 stateB;
    }
    
    bytes32 constant FACET_B_SLOT = 
        keccak256("diamond.facetB") - 1;
}
```

### Namespace Conventions

| Pattern | Example | Use Case |
|---------|---------|----------|
| Org namespace | `luxfi.token.v1` | Organization-specific |
| EIP namespace | `erc20.storage` | Standard implementations |
| Version namespace | `mycontract.v2` | Upgrade versioning |

### NatSpec Annotation

```solidity
/// @custom:storage-location erc7201:namespace.here
struct MyStorage {
    // Storage variables
}
```solidity

## Rationale

- Hash-based allocation prevents collisions
- Subtraction by 1 avoids preimage at hash
- Struct-based access is type-safe
- NatSpec annotation aids tooling

## Backwards Compatibility

This standard is fully backwards compatible with existing contracts and infrastructure. The standard is additive and does not modify existing functionality.

## Security Considerations

- Namespace uniqueness critical
- Assembly access requires care
- Upgrade testing essential

## References

- [ERC-7201: Namespaced Storage Layout](https://eips.ethereum.org/EIPS/eip-7201)
- [LP-3967: LRC-1967 Proxy Storage Slots](./lp-3967-lrc-1967-proxy-storage-slots.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
```
