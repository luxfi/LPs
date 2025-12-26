---
lp: 3001
title: DeFi Protocol Integrations Registry
description: Registry of external DeFi protocols integrated via adapter contracts in the Lux ecosystem
author: Lux Core Contributors (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Informational
created: 2025-12-23
updated: 2025-12-24
requires: 3000
tags: [registry, defi, adapters, integrations]
order: 3001
---

# LP-3001: DeFi Protocol Integrations Registry

## Abstract

This LP documents external DeFi protocols that the Lux ecosystem integrates with via adapter contracts. These are third-party protocols we interact with - not Lux-native standards. Due to licensing restrictions (primarily BUSL-1.1), we **integrate** with these protocols via adapters rather than forking or copying their code.

## Motivation

DeFi composability requires interaction with established protocols on various chains. This registry documents:
- Which external protocols we've vetted and integrated
- Our BSD-3 licensed adapter contracts that interface with them
- Licensing considerations for each protocol
- Deployment status across Lux, Zoo, and external chains

## Our Adapter Standards (BSD-3 Licensed)

Lux provides standard interfaces for protocol integration:

### ILiquidityAdapter

**Location**: `contracts/adapters/interfaces/ILiquidityAdapter.sol`

```solidity
interface ILiquidityAdapter {
    function protocol() external view returns (string memory);
    function addLiquidity(AddLiquidityParams calldata params) external payable returns (uint256 lpAmount);
    function removeLiquidity(RemoveLiquidityParams calldata params) external returns (uint256[] memory amounts);
    function swap(SwapParams calldata params) external payable returns (uint256 amountOut);
    function getPoolInfo(address pool) external view returns (PoolInfo memory);
}
```solidity

### ILiquidityEngine

**Location**: `contracts/liquidity/interfaces/ILiquidityEngine.sol`

Unified interface supporting DEX swaps, lending, and cross-chain operations.

## Integrated Protocols

### AMM / DEX Protocols

#### Uniswap V2/V3

| Property | Value |
|----------|-------|
| **Protocol** | Uniswap |
| **License** | GPL-2.0 (V2), GPL (V3 - converted from BUSL) |
| **Integration** | Fork or adapter |
| **Our Adapter** | `UniswapV3Adapter.sol` |
| **Submodule** | `lib/v2-core`, `lib/v3-core`, `lib/v3-periphery` |
| **Status** | Production ready |

**Why Uniswap**: Industry standard AMM with deep liquidity, proven security (billions TVL), and extensive audit history.

**License Note**: Uniswap V3 launched under BUSL-1.1 but has since converted to GPL. Can now be forked.

**Chains Supported**:
- Ethereum Mainnet ✅
- Arbitrum ✅
- Optimism ✅
- Polygon ✅
- Base ✅
- Lux Mainnet ✅ (deployed)

#### Uniswap V4

| Property | Value |
|----------|-------|
| **Protocol** | Uniswap V4 |
| **License** | BUSL-1.1 (active until ~2027) |
| **Integration** | Via adapter only |
| **Our Adapter** | `UniswapV4Adapter.sol` |
| **Status** | Development |

**Note**: Uniswap V4 BUSL-1.1 is still active. We integrate via adapters on chains where Uniswap deploys.

#### 1inch

| Property | Value |
|----------|-------|
| **Protocol** | 1inch Aggregator |
| **License** | MIT |
| **Integration** | Via adapter |
| **Our Adapter** | `OneInchAdapter.sol` |
| **Status** | Production ready |

**Why 1inch**: Best execution via DEX aggregation across multiple liquidity sources.

### Lending Protocols

#### Aave V3

| Property | Value |
|----------|-------|
| **Protocol** | Aave V3 |
| **License** | MIT (converted from BUSL-1.1 on Jan 27, 2023) |
| **Integration** | Fork or adapter |
| **Our Adapter** | `AaveV3Adapter.sol` |
| **Submodule** | `lib/aave-v3` (v1.19.4) |
| **Status** | Production ready |

**Why Aave**: Premier lending protocol with E-Mode, isolation mode, and extensive security audits (OpenZeppelin, Trail of Bits, SigmaPrime, PeckShield, Certora).

**License Note**: Aave V3 BUSL-1.1 expired January 27, 2023 - now MIT licensed. Can be forked and deployed.

#### Compound

| Property | Value |
|----------|-------|
| **Protocol** | Compound V2/V3 |
| **License** | BSD-3 |
| **Integration** | Reference implementation |
| **Status** | Reference in lib/compound |

**Note**: Compound's BSD-3 license allows more flexibility. Used as reference for lending mechanics.

### Perpetuals / Derivatives

#### GMX

| Property | Value |
|----------|-------|
| **Protocol** | GMX V2 |
| **License** | BUSL-1.1 |
| **Integration** | Via adapter |
| **Our Adapter** | `IMarketAdapter.sol` implementation |
| **Status** | Research |

**Why GMX**: Leading decentralized perpetuals with oracle-based pricing and GLP liquidity model.

### Oracles

#### Chainlink

| Property | Value |
|----------|-------|
| **Protocol** | Chainlink Data Feeds |
| **License** | MIT |
| **Integration** | Direct interface |
| **Status** | Production ready |

**Why Chainlink**: Industry standard price feeds with decentralized oracle network.

### Cross-Chain / Bridges

#### LayerZero V2

| Property | Value |
|----------|-------|
| **Protocol** | LayerZero |
| **License** | BUSL-1.1 |
| **Integration** | Via adapter |
| **Our Adapter** | `IBridgeAdapter.sol` implementation |
| **Status** | Research |

**Why LayerZero**: Generalized messaging with Ultra Light Nodes and decentralized verification.

#### Wormhole

| Property | Value |
|----------|-------|
| **Protocol** | Wormhole |
| **License** | Apache 2.0 |
| **Integration** | Via adapter |
| **Status** | Research |

### Yield / Vaults

#### Alchemix

| Property | Value |
|----------|-------|
| **Protocol** | Alchemix V2 |
| **License** | AGPL-3.0 |
| **Integration** | Reference |
| **Status** | Reference in lib/alchemix-v2 |

See LP-9108 for details.

## Lux Native Alternatives

Where possible, we build native alternatives rather than relying on external protocols:

| Category | External Protocol | Lux Native |
|----------|------------------|------------|
| AMM | Uniswap | QuantumSwap (via DEX precompile) |
| Oracles | Chainlink | Native Oracle precompile |
| Bridge | LayerZero/Wormhole | Warp Messaging |
| Lending | Aave | Lux Lending (planned) |

**QuantumSwap** (`contracts/liquidity/dex/QuantumSwap.sol`): Native DEX with precompile-accelerated matching, achieving 434M orders/sec on LX infrastructure.

## Licensing Summary

| License | Can Fork? | Can Modify? | Can Deploy? | Examples |
|---------|-----------|-------------|-------------|----------|
| MIT | ✅ | ✅ | ✅ | 1inch, Chainlink, **Aave V3** (post-Jan 2023) |
| BSD-3 | ✅ | ✅ | ✅ | Compound |
| GPL-2.0 | ✅ | ✅ | ✅ (copyleft) | Uniswap V2, **Uniswap V3** (converted) |
| AGPL-3.0 | ✅ | ✅ | ✅ (strong copyleft) | Alchemix |
| BUSL-1.1 | ❌ | ❌ | ❌ (until expiry) | Uniswap V4, GMX |
| Apache 2.0 | ✅ | ✅ | ✅ | Wormhole |

**BUSL-1.1 Expiry Notes**:
- Uniswap V3: Converted to GPL ✅
- Aave V3: Converted to MIT (Jan 27, 2023) ✅
- Uniswap V4: Still BUSL until ~2027
- GMX: Still BUSL

## Deployment Status

### Lux Mainnet (96369)

| Protocol | Contract | Status |
|----------|----------|--------|
| UniswapV3Adapter | - | Planned |
| AaveV3Adapter | - | Planned |
| QuantumSwap (native) | Precompile | Active |

### Zoo Mainnet (200200)

| Protocol | Contract | Status |
|----------|----------|--------|
| QuantumSwap | Bridge adapter | Active |

### External Chains (via adapters)

| Chain | Protocols Integrated |
|-------|---------------------|
| Ethereum | Uniswap, Aave, 1inch, Chainlink |
| Arbitrum | Uniswap, GMX, Aave, Chainlink |
| Optimism | Uniswap, Aave, Chainlink |
| Base | Uniswap, Aave, Chainlink |

## Security Considerations

1. **External Protocol Risk**: We depend on external protocol security
2. **Adapter Risk**: Our adapters must correctly interface with protocols
3. **License Compliance**: Must respect BUSL-1.1 and other restrictions
4. **Upgrade Risk**: External protocol upgrades may break adapters

### Audit Requirements

- All adapters must be audited before production deployment
- External protocol audits reviewed before integration
- Continuous monitoring of protocol security advisories

## Integration Guidelines

### Adding New Protocol Integration

1. **Vet the protocol**: Audit history, TVL, track record
2. **Check licensing**: Ensure compliance with license terms
3. **Implement adapter**: Using our standard interfaces
4. **Test thoroughly**: Unit tests, fork tests, integration tests
5. **Audit**: External security review
6. **Document**: Add to this registry

### Adapter Implementation Template

```solidity
// SPDX-License-Identifier: BSD-3-Clause
contract NewProtocolAdapter is ILiquidityAdapter {
    function protocol() external pure returns (string memory) {
        return "ProtocolName";
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // Implement interface methods...
}
```

## References

- [LP-3000: Standard Library Registry](./lp-3000-standard-library-registry.md)
- [Uniswap V3 Docs](https://docs.uniswap.org/)
- [Aave V3 Docs](https://docs.aave.com/)
- [1inch Docs](https://docs.1inch.io/)
- [Chainlink Docs](https://docs.chain.link/)

## Changelog

- **2025-12-23**: Initial specification
