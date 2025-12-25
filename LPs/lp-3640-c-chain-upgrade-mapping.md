---
lp: 3640
title: C-Chain Upgrade Mapping
description: Comprehensive mapping of C-Chain network upgrades to LPs and Ethereum equivalents
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
tags: [c-chain, evm]
type: Informational
created: 2025-12-17
updated: 2025-12-17
order: 950
---

## Abstract

This LP provides a comprehensive mapping of all Lux C-Chain network upgrades to their associated Lux Proposals (LPs), Ethereum equivalents, and implementation details. This serves as a reference for developers, node operators, and anyone working with Lux blockchain data across different network phases.

## Motivation

Understanding the relationship between network upgrades, LPs, and Ethereum hard forks is essential for:
- Node operators configuring genesis files
- Developers building applications that span multiple upgrade phases
- Archive services importing historical data
- Tooling that needs to understand header formats across upgrades

## Specification

### C-Chain Upgrade Timeline

| Upgrade | Config Key | Node Version | Features | Ethereum Equivalent |
|---------|------------|--------------|----------|---------------------|
| Apricot Phase 1 | `apricotPhase1BlockTimestamp` | v1.3.0 | Initial C-Chain launch | Genesis + EIPs 2565, 2929 |
| Apricot Phase 2 | `apricotPhase2BlockTimestamp` | v1.4.0 | Modified Berlin | Berlin (EIP-2718, 2930) |
| Apricot Phase 3 | `apricotPhase3BlockTimestamp` | v1.5.0 | Dynamic fees | London (EIP-1559, 3198, 3529) |
| Apricot Phase 4 | `apricotPhase4BlockTimestamp` | v1.6.0 | Block fee mechanism | Custom (BlockGasCost) |
| Apricot Phase 5 | `apricotPhase5BlockTimestamp` | v1.7.0 | Atomic batch transactions | Custom |
| Apricot Phase Pre-6 | `apricotPhasePre6BlockTimestamp` | v1.8.0 | NativeAssetCall soft deprecation | Custom |
| Apricot Phase 6 | `apricotPhase6BlockTimestamp` | v1.8.0 | NativeAsset deprecation | Custom |
| Apricot Phase Post-6 | `apricotPhasePost6BlockTimestamp` | v1.8.0 | NativeAssetCall hard deprecation | Custom |
| Banff | `banffBlockTimestamp` | v1.9.0 | Import/export LUX-only | Custom |
| Cortina | `cortinaBlockTimestamp` | v1.10.0 | Gas limit increase (15M) | Custom (LP-118) |
| Durango | `durangoBlockTimestamp` | v1.11.0 | Warp messaging + Shanghai | Shanghai (minus EIP-4895) |
| Etna | `etnaTimestamp` | v1.12.0 | Cancun + min base fee reduction | Cancun (minus EIP-4844 blobs) |
| Fortuna | `fortunaTimestamp` | v1.13.0 | Dynamic gas pricing | Custom (LP-176/ACP-176) |
| Granite | `graniteTimestamp` | v1.14.0+ | Sub-second blocks, secp256r1 | Custom (LP-181, LP-204, LP-226) |

### LP Mapping

| Upgrade | Primary LP | Related LPs | Description |
|---------|-----------|-------------|-------------|
| Cortina | LP-118 | - | chain-EVM compatibility upgrade |
| Durango | LP-2515 | LP-605 | Warp cross-chain messaging |
| Etna | LP-2320 | LP-601 | Dynamic gas limit and price discovery |
| Fortuna | LP-176 | LP-2320 | Dynamic EVM gas pricing mechanism |
| Granite | LP-226 | LP-181, LP-204 | Dynamic block timing, epoching, secp256r1 |

### Header Format Evolution

The C-Chain header format has evolved with each upgrade phase. The header field count varies:

| Upgrade Phase | Header Fields | Added Fields |
|---------------|---------------|--------------|
| Genesis-AP3 | 16 | Core 15 + BaseFee |
| Apricot Phase 4+ | 17-19 | + ExtDataHash, ExtDataGasUsed, BlockGasCost |
| Durango+ | 19 | Full chainEVM header |

#### Field Order (Coreth Format)
```markdown
Position 0-14:  Core Ethereum fields (ParentHash through Nonce)
Position 15:    ExtDataHash (common.Hash, REQUIRED)
Position 16:    BaseFee (*big.Int, optional)
Position 17:    ExtDataGasUsed (*big.Int, optional)
Position 18:    BlockGasCost (*big.Int, optional)
```

#### Field Order (Geth Format)
```markdown
Position 0-14:  Core Ethereum fields (ParentHash through Nonce)
Position 15:    BaseFee (*big.Int, optional)
Position 16:    ExtDataHash (*common.Hash, optional)
Position 17:    ExtDataGasUsed (*big.Int, optional)
Position 18:    BlockGasCost (*big.Int, optional)
```

**Note**: When importing blocks between coreth and geth formats, the field order difference at positions 15-16 must be handled. See `geth/core/types/decode.go` for format detection.

### Genesis Configuration

#### Mainnet (Chain ID: 96369)
```json
{
  "config": {
    "chainId": 96369,
    "apricotPhase1BlockTimestamp": 0,
    "apricotPhase2BlockTimestamp": 0,
    "apricotPhase3BlockTimestamp": 0,
    "apricotPhase4BlockTimestamp": 0,
    "apricotPhase5BlockTimestamp": 0,
    "apricotPhasePre6BlockTimestamp": 0,
    "apricotPhase6BlockTimestamp": 0,
    "apricotPhasePost6BlockTimestamp": 0,
    "banffBlockTimestamp": 0,
    "cortinaBlockTimestamp": 0,
    "durangoBlockTimestamp": 0,
    "etnaTimestamp": 253399622400,
    "fortunaTimestamp": 253399622400,
    "graniteTimestamp": 253399622400
  }
}
```solidity

#### Testnet (Chain ID: 96368)
```json
{
  "config": {
    "chainId": 96368,
    "chainEVMTimestamp": 0,
    "durangoTimestamp": 0,
    "etnaTimestamp": 253399622400
  }
}
```

### Feature Activation Details

#### Apricot Phase 1 (v1.3.0)
- Initial C-Chain launch
- EIP-2565: ModExp gas cost reduction
- EIP-2929: Cold/warm account access pricing

#### Apricot Phase 2 (v1.4.0)
- EIP-2718: Typed transaction envelope
- EIP-2930: Access list transactions
- Modified Berlin hard fork

#### Apricot Phase 3 (v1.5.0)
- EIP-1559: Fee market change (base fee)
- EIP-3198: BASEFEE opcode
- EIP-3529: Reduced gas refunds
- Dynamic fee mechanism

#### Apricot Phase 4 (v1.6.0)
- BlockGasCost mechanism
- Fee config: minBlockGasCost, maxBlockGasCost, blockGasCostStep
- Header extension: BlockGasCost field

#### Apricot Phase 5 (v1.7.0)
- Batch atomic transactions
- Maximum atomic gas limit per block
- Improved cross-chain efficiency

#### Apricot Phases Pre-6/6/Post-6 (v1.8.0)
- Deprecation of NativeAsset precompiles
- Pre-6: Soft deprecation of NativeAssetCall
- Phase 6: Full deprecation
- Post-6: Hard removal

#### Banff (v1.9.0)
- Import/export restricted to LUX only
- Simplified cross-chain transfers

#### Cortina (v1.10.0) - LP-118
- Gas limit increased to 15M
- chain-EVM compatibility improvements

#### Durango (v1.11.0)
- Lux Warp Messaging activation
- Shanghai execution spec (without EIP-4895 withdrawals)
- EIP-3855: PUSH0 opcode
- EIP-3860: Initcode size limit
- EIP-6049: SELFDESTRUCT deprecation warning

#### Etna (v1.12.0) - LP-2320
- Cancun execution spec (without EIP-4844 blob txs)
- EIP-1153: Transient storage
- EIP-4788: Beacon root in EVM
- EIP-5656: MCOPY opcode
- EIP-6780: SELFDESTRUCT only same-tx
- Reduced minimum base fee

#### Fortuna (v1.13.0) - LP-176
- Dynamic EVM gas pricing (ACP-176)
- Adaptive fee mechanism based on network load
- Improved gas price discovery

#### Granite (Planned) - LP-226
- Dynamic minimum block times (ACP-226)
- Sub-second block capability (100ms minimum)
- P-Chain epoched views (LP-181/ACP-181)
- secp256r1 precompile (LP-204/ACP-204)
- Biometric wallet support

## Rationale

This mapping document consolidates information scattered across multiple sources:
- Coreth `params/extras/network_upgrades.go`
- Genesis configuration files
- Individual LP specifications
- Node release notes

Having a single authoritative reference simplifies development and troubleshooting.

## Backwards Compatibility

This is an informational LP and does not introduce any changes. The documented upgrades are all backwards-compatible within their respective activation phases.

## Security Considerations

Understanding upgrade boundaries is critical for:
- Replay protection across networks
- State migration during upgrades
- Archive node operation
- Block validation during import

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
