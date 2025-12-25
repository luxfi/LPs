---
lp: 3703
title: Statelessness Gas Costs (EIP-4762)
description: Gas cost adjustments for Verkle tree and stateless client access patterns
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-23
requires: 3702
tags: [core, evm, verkle, gas]
order: 830
---

# LP-3703: Statelessness Gas Costs

## Abstract

This LP specifies gas cost changes required for Verkle tree state access, aligned with EIP-4762. These changes reflect the true cost of witness generation and verification in a stateless execution environment.

## Motivation

Current gas costs assume state is in local storage. With Verkle trees and witnesses:
- State access requires proof inclusion in witness
- Witness size affects block propagation
- Cold/warm distinction based on witness membership

## Specification

### Access Events

```go
type AccessEvent struct {
    Address      common.Address
    StorageKey   common.Hash  // or nil for account access
    IsWrite      bool
    TreeIndex    uint64       // chunk in tree
}
```go

### Gas Schedule

#### Account Access
| Operation | Cold | Warm |
|-----------|------|------|
| BALANCE | 2600 | 100 |
| EXTCODESIZE | 2600 | 100 |
| EXTCODEHASH | 2600 | 100 |
| EXTCODECOPY (per chunk) | 2600 | 100 |

#### Storage Access
| Operation | Cold | Warm |
|-----------|------|------|
| SLOAD | 2100 | 100 |
| SSTORE | 2900 | 100 |

#### Code Access
| Operation | Cold | Warm |
|-----------|------|------|
| First code chunk | 2600 | 100 |
| Each additional chunk | 200 | 0 |

#### Witness Charging

```go
func WitnessGas(accessList []AccessEvent) uint64 {
    gas := uint64(0)
    
    for _, event := range accessList {
        // Charge for tree branch traversal
        gas += WITNESS_BRANCH_COST  // 200
        
        // Charge for value in witness
        gas += WITNESS_VALUE_COST   // 100
        
        // Additional for writes
        if event.IsWrite {
            gas += WITNESS_WRITE_COST  // 100
        }
    }
    
    return gas
}
```

### Block Witness Limits

```go
const (
    // Maximum witness size in bytes
    MAX_WITNESS_SIZE = 1_000_000  // 1MB
    
    // Target witness size for gas adjustment
    TARGET_WITNESS_SIZE = 500_000 // 500KB
    
    // Witness gas per byte
    WITNESS_GAS_PER_BYTE = 16
)
```go

### EIP-2929 Compatibility

The access list mechanism from EIP-2929 extends:

```go
type AccessList struct {
    Addresses   map[common.Address]struct{}
    Slots       map[common.Address]map[common.Hash]struct{}
    
    // NEW: Track witness chunks
    WitnessChunks map[uint64]struct{}
}
```

## Rationale

Gas costs reflect:
- Tree traversal cost (branch loading)
- Proof size contribution
- Write amplification in witness updates

## Backwards Compatibility

- Higher cold access costs may break some contracts
- Warm access unchanged
- Access lists reduce costs as before

## Security Considerations

- Witness size attacks mitigated by gas costs
- Block limit provides hard cap
- DoS via many cold accesses prevented

## References

- [EIP-4762: Statelessness Gas Cost Changes](https://eips.ethereum.org/EIPS/eip-4762)
- [EIP-2929: Gas Cost Increases](https://eips.ethereum.org/EIPS/eip-2929)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
