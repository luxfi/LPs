---
lp: 3704
title: Historical Block Hashes (EIP-2935)
description: Store historical block hashes in state for stateless execution
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-23
requires: 3702
tags: [core, evm, stateless]
order: 840
---

# LP-3704: Historical Block Hashes in State

## Abstract

This LP specifies storing historical block hashes in the state trie, enabling the BLOCKHASH opcode to work in stateless execution. Compatible with EIP-2935.

## Motivation

The BLOCKHASH opcode currently requires nodes to store the last 256 block hashes in memory. For stateless execution:
- Validators need block hashes in state
- Witnesses can include needed hashes
- No special handling required

## Specification

### System Contract

```solidity
// Deployed at: 0x0000...0001 (to be determined)
// Updated by system at each block
contract BlockHashHistory {
    // Circular buffer of 8192 block hashes
    mapping(uint256 => bytes32) public blockHashes;
    
    // Ring buffer size
    uint256 public constant HISTORY_SIZE = 8192;
    
    // Updated by system call at block start
    function set(uint256 blockNumber, bytes32 blockHash) external {
        require(msg.sender == address(0), "System only");
        blockHashes[blockNumber % HISTORY_SIZE] = blockHash;
    }
    
    // Called by BLOCKHASH opcode
    function get(uint256 blockNumber) external view returns (bytes32) {
        uint256 current = block.number;
        
        // Only last HISTORY_SIZE blocks available
        if (blockNumber >= current || current - blockNumber > HISTORY_SIZE) {
            return bytes32(0);
        }
        
        return blockHashes[blockNumber % HISTORY_SIZE];
    }
}
```solidity

### System Address

```go
var HistoryStorageAddress = common.HexToAddress("0x0aae40965e6800cd9b1f4b05ff21581047e3f91e")
```

### BLOCKHASH Modification

```go
func opBlockhash(pc *uint64, interpreter *EVMInterpreter, scope *ScopeContext) ([]byte, error) {
    num := scope.Stack.peek()
    num64, overflow := num.Uint64WithOverflow()
    
    if overflow {
        num.Clear()
        return nil, nil
    }
    
    // Call history contract instead of memory lookup
    hash := interpreter.evm.StateDB.GetState(
        HistoryStorageAddress,
        common.BigToHash(new(big.Int).SetUint64(num64 % 8192)),
    )
    
    num.SetBytes(hash.Bytes())
    return nil, nil
}
```go

### Block Processing

At the start of each block:

```go
func ProcessBlockHashUpdate(state StateDB, header *Header) {
    // Store parent block hash
    slot := (header.Number.Uint64() - 1) % 8192
    state.SetState(
        HistoryStorageAddress,
        common.BigToHash(big.NewInt(int64(slot))),
        header.ParentHash,
    )
}
```

## Rationale

- 8192 blocks ≈ 1 day at 10.5s blocks
- Circular buffer minimizes storage
- System contract enables witness inclusion
- Backwards compatible BLOCKHASH behavior

## Backwards Compatibility

- BLOCKHASH returns same values
- Internal implementation changes only
- Gas cost unchanged

## Security Considerations

- System contract is non-callable by users
- Storage slots predictable (not security relevant)
- No new attack vectors introduced

## References

- [EIP-2935: Save Historical Block Hashes in State](https://eips.ethereum.org/EIPS/eip-2935)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
