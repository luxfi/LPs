---
lp: 3690
title: EVM Security Hardening Suite
description: Gas caps, RLP limits, MODEXP optimization, and anti-DoS measures
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-25
requires: 1200
tags: [evm, security, gas]
order: 3690
---

## Abstract

LP-3690 consolidates multiple EVM security hardening measures into a single specification, including per-transaction gas caps, RLP block size limits, MODEXP precompile limits (EIP-7883), and anti-DoS tweaks. These changes make it harder for attackers to spam or stall the network while keeping nodes more resource-efficient.

## Motivation

The EVM has accumulated several attack vectors that enable resource exhaustion:

1. **MODEXP Abuse**: Unbounded exponent sizes can cause excessive computation
2. **Large RLP Blocks**: Oversized blocks can exhaust memory during decoding
3. **Gas Limit Gaming**: Uncapped transaction gas can monopolize block space
4. **Memory Expansion**: Aggressive memory allocation attacks

### Attack Scenarios

| Attack Vector | Impact | Mitigation |
|--------------|--------|------------|
| MODEXP with large exponent | CPU exhaustion | EIP-7883 limits |
| 100MB+ RLP blocks | Memory exhaustion | 10 MiB cap |
| Single tx consuming all gas | Block monopolization | Per-tx gas caps |
| Memory expansion attacks | OOM conditions | Enhanced limits |

## Specification

### 1. MODEXP Limits (EIP-7883)

Enhanced MODEXP precompile with tighter computational bounds:

```go
// Precompile address: 0x05
const (
    // Maximum input lengths for MODEXP
    MaxBaseLength     = 1024  // bytes
    MaxExponentLength = 1024  // bytes
    MaxModulusLength  = 1024  // bytes
)

// Gas calculation with EIP-7883 adjustments
func modexpGas(baseLen, expLen, modLen uint64) uint64 {
    // Cap effective lengths
    baseLen = min(baseLen, MaxBaseLength)
    expLen = min(expLen, MaxExponentLength)
    modLen = min(modLen, MaxModulusLength)

    // Apply EIP-2565 gas formula with EIP-7883 caps
    mulComplexity := calcMultiplicationComplexity(max(baseLen, modLen))
    iterCount := calcIterationCount(expLen, expHead)

    return max(200, mulComplexity * iterCount / 3)
}
```

**Implementation**: [`geth/core/vm/contracts.go`](https://github.com/luxfi/geth) - bigModExp

### 2. RLP Block Size Limit

Maximum RLP-encoded block size capped at 10 MiB:

```go
const MaxBlockRLPSize = 10 * 1024 * 1024 // 10 MiB

func validateBlockRLP(rlpData []byte) error {
    if len(rlpData) > MaxBlockRLPSize {
        return errors.New("block RLP exceeds maximum size")
    }
    return nil
}
```

**Rationale**:
- Prevents memory exhaustion during block decoding
- Ensures reasonable sync times
- Compatible with blob transactions (EIP-4844)

**Implementation**: [`geth/core/types/block.go`](https://github.com/luxfi/geth)

### 3. Per-Transaction Gas Caps

Maximum gas per transaction to prevent block monopolization:

```go
const (
    // Maximum gas limit for a single transaction
    MaxTransactionGas = 30_000_000 // 30M gas

    // Block gas target (50% of limit)
    BlockGasTarget = 15_000_000
)
```

**Rationale**:
- Ensures multiple transactions can fit per block
- Prevents single-tx DoS of block production
- Maintains healthy fee market dynamics

### 4. Memory Expansion Limits

Enhanced memory expansion checks:

```go
const (
    // Maximum memory size (1 GiB)
    MaxMemorySize = 1 << 30

    // Maximum memory expansion per opcode
    MaxExpansionPerOp = 1 << 20 // 1 MiB
)

func memoryExpansionCost(currentSize, requestedSize uint64) (uint64, error) {
    if requestedSize > MaxMemorySize {
        return 0, ErrMaxMemoryExceeded
    }
    expansion := requestedSize - currentSize
    if expansion > MaxExpansionPerOp {
        return 0, ErrExpansionTooLarge
    }
    return calcMemoryCost(requestedSize), nil
}
```

### 5. Anti-DoS Opcode Limits

Additional limits on expensive opcodes:

| Opcode | Limit | Rationale |
|--------|-------|-----------|
| EXTCODECOPY | 24KB max | Prevent large code reads |
| RETURNDATACOPY | 24KB max | Limit return data |
| CREATE2 | Salt + initcode bounded | Predictable addresses |
| SELFDESTRUCT | Deprecated (EIP-6780) | Security concerns |

## Implementation Status

All features implemented in Lux geth:

| Feature | EIP | Implementation | Status |
|---------|-----|----------------|--------|
| MODEXP limits | EIP-7883 | `core/vm/contracts.go` | ✅ |
| RLP block cap | - | `core/types/block.go` | ✅ |
| TX gas caps | EIP-7623 | `core/txpool/` | ✅ |
| Memory limits | EIP-7825 | `core/vm/memory.go` | ✅ |

## Test Cases

```go
func TestMODEXPLimits(t *testing.T) {
    // Test excessive exponent is capped
    input := make([]byte, 3*32 + 2048) // 2KB exponent
    copy(input[64:96], big.NewInt(2048).Bytes()) // expLen = 2048

    gas := modexpGas(input)
    require.Less(t, gas, uint64(1_000_000_000)) // Must be bounded
}

func TestRLPBlockSizeLimit(t *testing.T) {
    oversizedBlock := make([]byte, 11*1024*1024) // 11 MiB
    err := validateBlockRLP(oversizedBlock)
    require.Error(t, err)
}

func TestTransactionGasCap(t *testing.T) {
    tx := types.NewTx(&types.DynamicFeeTx{
        Gas: 50_000_000, // Exceeds cap
    })
    err := validateTxGas(tx)
    require.Error(t, err)
}
```

## Rationale

EVM security hardening follows Ethereum's lead on resource limits because:
1. Prevents computational exhaustion attacks
2. Ensures nodes can operate on commodity hardware
3. Maintains network stability under adversarial conditions

## Backwards Compatibility

All limits are set above current legitimate usage. No breaking changes to existing contracts.

## Security Considerations

1. **Backwards Compatibility**: All limits are set above current legitimate usage
2. **DOS Prevention**: Caps prevent computational exhaustion attacks
3. **Resource Efficiency**: Nodes can run on modest hardware
4. **Network Stability**: Prevents resource-based network partitioning

## References

- [EIP-7883: MODEXP Limit Repricing](https://eips.ethereum.org/EIPS/eip-7883)
- [EIP-7623: Transaction Gas Limit](https://eips.ethereum.org/EIPS/eip-7623)
- [EIP-7825: Memory Expansion Limit](https://eips.ethereum.org/EIPS/eip-7825)
- [EIP-6780: SELFDESTRUCT Deprecation](https://eips.ethereum.org/EIPS/eip-6780)

