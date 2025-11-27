---
lp: 0118
title: Subnet-EVM Compatibility Layer
description: Provides compatibility layer for legacy Avalanche Subnet-EVM chains migrating to Lux Network
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Interface
created: 2025-01-15
---

# LP-118: Subnet-EVM Compatibility Layer

**Status**: Final
**Type**: Standards Track
**Category**: Interface
**Created**: 2025-01-15

## Abstract

LP-118 provides a compatibility layer for legacy Avalanche Subnet-EVM chains migrating to the Lux Network. It ensures seamless transition while maintaining deterministic behavior and state consistency.

## Motivation

Many existing blockchain applications are built on Avalanche's Subnet-EVM. LP-118 enables these chains to migrate to Lux without requiring application-level changes, preserving:

1. **Existing State**: All account balances and contract storage
2. **Transaction Format**: Compatible with existing wallets and tools
3. **Contract ABIs**: No redeployment required
4. **Historical Data**: Complete blockchain history preserved

## Specification

### Compatibility Scope

LP-118 ensures compatibility with:

- **Subnet-EVM v0.5.x**: Primary target version
- **Precompiles**: All standard Subnet-EVM precompiles
- **Warp Messaging**: Cross-subnet communication
- **Upgrades**: Durango, Etna network upgrades

### Activation

Compatibility mode is enabled via network configuration:

```go
type ChainConfig struct {
    // ... existing fields
    LP118Timestamp *uint64 `json:"lp118Timestamp,omitempty"`
}
```

When `LP118Timestamp` is set:
1. Enables Subnet-EVM transaction format parsing
2. Activates compatible precompile set
3. Maintains Subnet-EVM fee calculation rules
4. Preserves Subnet-EVM block format

### Migration Path

**Phase 1**: Read-only compatibility
- Lux nodes can read Subnet-EVM chain state
- Historical blocks validated correctly
- No state modifications

**Phase 2**: Full compatibility
- New blocks follow Lux format
- Transactions compatible with both formats
- Gradual transition over N blocks

**Phase 3**: Native Lux
- LP-118 compatibility can be deprecated
- Full Lux native features enabled
- Legacy format support optional

## Rationale

### Design Decisions

**1. Opt-in Compatibility**: Rather than forcing all chains to support legacy formats, LP-118 is activated per-chain via `LP118Timestamp`. This keeps the core protocol clean while enabling migration.

**2. Phased Migration**: The three-phase approach allows for gradual transition without network disruption:
- Phase 1 enables validation without risk (read-only)
- Phase 2 enables full operation with both formats
- Phase 3 allows clean deprecation when ready

**3. Precompile Mapping**: Direct address mapping ensures existing contracts work without modification. Enhanced precompiles in Lux (like Warp) maintain backward compatibility while offering new features.

**4. Transaction Format Detection**: The format detection order (Subnet-EVM first, then Lux) ensures legacy transactions are always correctly parsed while allowing native transactions.

### Alternatives Considered

- **Full Emulation**: Rejected due to complexity and performance overhead
- **One-Time Migration**: Rejected due to risk of data loss and downtime
- **Parallel Networks**: Rejected due to liquidity fragmentation

## Implementation

### Location

**Plugin Interface**: `/Users/z/work/lux/geth/plugin/evm/upgrade/lp118/`

Files:
- `params.go` - Activation parameters

**Integration Points**: `/Users/z/work/lux/evm/plugin/evm/`

Key areas:
- `vm.go` - VM initialization with compat mode
- `config.go` - Subnet-EVM config parsing
- `upgrade/` - Legacy upgrade handling

### Key Components

#### 1. Transaction Format Compatibility

```go
func parseTransaction(data []byte, isLP118Active bool) (*Transaction, error) {
    if isLP118Active {
        // Try Subnet-EVM format first
        if tx, err := parseSubnetEVMTx(data); err == nil {
            return tx, nil
        }
    }
    // Fall back to Lux native format
    return parseLuxTx(data)
}
```

#### 2. Precompile Mapping

| Subnet-EVM Address | Lux Equivalent | Notes |
|--------------------|----------------|-------|
| `0x0200000000000000000000000000000000000000` | Native Minter | Mapped 1:1 |
| `0x0200000000000000000000000000000000000001` | Contract Deployer Allowlist | Mapped 1:1 |
| `0x0200000000000000000000000000000000000002` | Tx Allowlist | Mapped 1:1 |
| `0x0200000000000000000000000000000000000003` | Fee Manager | Mapped 1:1 |
| `0x0200000000000000000000000000000000000004` | Reward Manager | Mapped 1:1 |
| `0x0200000000000000000000000000000000000005` | Warp Messenger | Enhanced in Lux |

#### 3. Block Format Translation

Subnet-EVM blocks are translated to Lux format:

```go
type SubnetEVMBlock struct {
    Header       SubnetEVMHeader
    Transactions []*SubnetEVMTx
    // ... Subnet-EVM specific fields
}

func (b *SubnetEVMBlock) ToLuxBlock() *LuxBlock {
    return &LuxBlock{
        Header:       translateHeader(b.Header),
        Transactions: translateTxs(b.Transactions),
        // ... map remaining fields
    }
}
```

## Test Cases

### Compatibility Tests

**Location**: `tests/e2e/subnetevm_compat_test.go`

Test scenarios:
- Import existing Subnet-EVM genesis
- Validate historical blocks
- Execute legacy transactions
- Call Subnet-EVM precompiles
- Warp message compatibility

### Migration Tests

Scenarios:
1. **Genesis Import**: Load Subnet-EVM genesis into Lux
2. **Chain Replay**: Replay Subnet-EVM blocks
3. **Mixed Transactions**: Process both formats in same block
4. **Precompile Calls**: Verify identical behavior
5. **State Continuity**: Ensure no state divergence

### Unit Tests

```go
// Test: Transaction format detection
func TestTransactionFormatDetection(t *testing.T) {
    // Subnet-EVM format transaction
    subnetTx := createSubnetEVMTx()
    tx, err := parseTransaction(subnetTx.Bytes(), true)
    require.NoError(t, err)
    require.Equal(t, subnetTx.Hash(), tx.Hash())

    // Lux native format transaction
    luxTx := createLuxTx()
    tx, err = parseTransaction(luxTx.Bytes(), true)
    require.NoError(t, err)
    require.Equal(t, luxTx.Hash(), tx.Hash())
}

// Test: Precompile compatibility
func TestPrecompileMapping(t *testing.T) {
    addresses := []common.Address{
        common.HexToAddress("0x0200000000000000000000000000000000000000"),
        common.HexToAddress("0x0200000000000000000000000000000000000001"),
        common.HexToAddress("0x0200000000000000000000000000000000000005"),
    }

    for _, addr := range addresses {
        // Verify precompile exists
        precompile := GetPrecompile(addr)
        require.NotNil(t, precompile)

        // Verify behavior matches Subnet-EVM
        result, err := precompile.Run(testInput)
        require.NoError(t, err)
        require.Equal(t, expectedSubnetEVMResult, result)
    }
}

// Test: Block format translation
func TestBlockTranslation(t *testing.T) {
    subnetBlock := loadSubnetEVMBlock(t, "testdata/subnet_block.json")
    luxBlock := subnetBlock.ToLuxBlock()

    // Verify state root matches
    require.Equal(t, subnetBlock.Root(), luxBlock.Root())

    // Verify transaction count matches
    require.Equal(t, len(subnetBlock.Transactions), len(luxBlock.Transactions))

    // Verify deterministic translation
    luxBlock2 := subnetBlock.ToLuxBlock()
    require.Equal(t, luxBlock.Hash(), luxBlock2.Hash())
}

// Test: LP-118 activation
func TestLP118Activation(t *testing.T) {
    config := &ChainConfig{
        LP118Timestamp: ptr(uint64(1000)),
    }

    // Before activation
    require.False(t, config.IsLP118Active(999))

    // At activation
    require.True(t, config.IsLP118Active(1000))

    // After activation
    require.True(t, config.IsLP118Active(1001))
}
```

## Security Considerations

### Compatibility Risks

1. **Format Ambiguity**: Transaction format detection must be unambiguous
   - **Mitigation**: Strict format validation, version markers

2. **Precompile Divergence**: Behavior differences in precompiles
   - **Mitigation**: Extensive test coverage, formal verification

3. **State Transition Bugs**: Migration edge cases
   - **Mitigation**: Comprehensive migration testing, rollback plan

### Audits

- Internal security review: 2025-01-12
- Migration testing: Ongoing
- External audit: Scheduled

## Backwards Compatibility

LP-118 is designed for forward compatibility only. Subnet-EVM chains can migrate to Lux, but not vice versa. This is intentional to prevent fragmentation.

## References

- [Avalanche Subnet-EVM](https://github.com/ava-labs/subnet-evm)
- [Lux EVM Implementation](https://github.com/luxfi/evm)
- [Precompile Documentation](https://docs.lux.network/precompiles)

## Copyright

Copyright (C) 2025 Lux Partners Limited. All rights reserved.
