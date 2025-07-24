# Cross-Reference Index: Lux, Ethereum, and Avalanche Standards

This document provides a comprehensive mapping between Lux (LP/LRC), Ethereum (EIP/ERC), and Avalanche (ACP) standards to help developers understand equivalencies and differences.

## Overview

The Lux Network incorporates the best standards from Ethereum and Avalanche while introducing its own innovations. This cross-reference helps developers:
- Port existing applications
- Understand standard equivalencies
- Identify unique Lux features
- Navigate multi-chain development

## Token Standards

### Fungible Tokens

| Standard | Lux | Ethereum | Avalanche | Description | Differences |
|----------|-----|----------|-----------|-------------|-------------|
| Basic Fungible | LRC-20 | ERC-20 | ARC-20 | Standard fungible token | Lux adds native bridge support |
| Permit Extension | LRC-2612 | ERC-2612 | - | Gasless approvals | Lux integrates with B-Chain |
| Flash Loans | LRC-3156 | ERC-3156 | - | Flash loan standard | Lux adds cross-chain flash loans |
| Wrapper Tokens | LRC-24 | WETH | WAVAX | Wrapped native token | Lux supports multi-chain wrapping |

### Non-Fungible Tokens (NFTs)

| Standard | Lux | Ethereum | Avalanche | Description | Differences |
|----------|-----|----------|-----------|-------------|-------------|
| Basic NFT | LRC-721 | ERC-721 | ARC-721 | Non-fungible tokens | Lux adds cross-chain transfer |
| Multi-Token | LRC-1155 | ERC-1155 | - | Multiple token types | Lux optimizes for gaming |
| NFT Royalties | LRC-2981 | ERC-2981 | - | On-chain royalties | Lux enforces cross-chain |
| Soulbound | LRC-5192 | ERC-5192 | - | Non-transferable NFTs | Lux adds privacy options |
| Token Bound | LRC-6551 | ERC-6551 | - | NFTs as wallets | Lux adds multi-chain support |

### Hybrid Standards

| Standard | Lux | Ethereum | Avalanche | Description | Unique Features |
|----------|-----|----------|-----------|-------------|-----------------|
| Semi-Fungible | LRC-3525 | ERC-3525 | - | ID + value tokens | Lux adds DeFi integrations |
| Hybrid Token | LRC-404 | ERC-404 | - | Fungible/NFT hybrid | Lux native implementation |
| Fractional NFT | LRC-405 | - | - | Native fractionalization | Lux-specific innovation |

## DeFi Standards

### Core DeFi

| Standard | Lux | Ethereum | Avalanche | Description | Enhancements |
|----------|-----|----------|-----------|-------------|--------------|
| Vault Standard | LRC-4626 | ERC-4626 | - | Tokenized vaults | Cross-chain yield |
| AMM Interface | LP-13 | Various | Joe V2 | DEX standards | Unified interface |
| Lending Protocol | LP-14 | Compound/Aave | Benqi | Lending interface | Cross-chain collateral |
| Options | LRC-508 | - | - | Options protocol | Lux-native design |

### Advanced DeFi

| Standard | Lux | Ethereum | Avalanche | Description | Innovation |
|----------|-----|----------|-----------|-------------|------------|
| Liquid Staking | LRC-510 | stETH model | sAVAX | Liquid staking tokens | Multi-validator |
| Perpetuals | LRC-515 | GMX model | - | Perp trading | Cross-chain positions |
| Yield Aggregator | LRC-520 | Yearn model | YY | Yield optimization | AI-driven strategies |

## Infrastructure Standards

### Account & Wallet

| Standard | Lux | Ethereum | Avalanche | Description | Improvements |
|----------|-----|----------|-----------|-------------|--------------|
| Account Abstraction | LRC-4337 | ERC-4337 | - | Smart wallets | Native integration |
| Social Recovery | LRC-6239 | ERC-6239 | - | Guardian recovery | Privacy preserving |
| Multi-sig | LP-28 | Gnosis Safe | - | Multi-signature | Threshold signatures |

### Identity & Compliance

| Standard | Lux | Ethereum | Avalanche | Description | Unique Aspects |
|----------|-----|----------|-----------|-------------|----------------|
| Claims | LRC-735 | ERC-735 | - | Identity claims | B-Chain integration |
| Identity Token | LRC-31 | - | - | Identity NFTs | Lux-specific |
| KYC Token | LRC-32 | Various | - | Compliance tokens | Zero-knowledge proofs |

## Cross-Chain Standards

### Messaging & Bridges

| Standard | Lux | Ethereum | Avalanche | Description | Key Differences |
|----------|-----|----------|-----------|-------------|-----------------|
| Message Format | LP-15 | LayerZero | AWM | Cross-chain messages | Native implementation |
| Bridge Protocol | LP-17 | Various | AB | Asset bridges | Unified standard |
| Interop Registry | LP-18 | - | - | Chain registry | Lux innovation |

### Cross-Chain Assets

| Standard | Lux | Ethereum | Avalanche | Description | Features |
|----------|-----|----------|-----------|-------------|----------|
| Wrapped Assets | LRC-24 | Various | - | Wrapped tokens | Automatic routing |
| Cross-Chain NFT | LRC-23 | - | - | Portable NFTs | Metadata preservation |
| Omnichain Token | LRC-25 | OFT | - | Native multichain | Lux-optimized |

## Governance Standards

### Core Governance

| Standard | Lux | Ethereum | Avalanche | Description | Differences |
|----------|-----|----------|-----------|-------------|-------------|
| Proposal Format | LP-1 | EIP-1 | ACP-1 | Proposal structure | Similar format |
| DAO Framework | LP-2 | Various | - | DAO constitution | Holographic consensus |
| Voting | LP-3 | Governor | - | On-chain voting | Multi-chain votes |
| Delegation | LRC-511 | - | - | Vote delegation | Cross-chain delegation |

### Advanced Governance

| Standard | Lux | Ethereum | Avalanche | Description | Innovation |
|----------|-----|----------|-----------|-------------|------------|
| Quadratic Voting | LP-52 | Gitcoin | - | Quadratic mechanisms | Native support |
| Futarchy | LP-53 | - | - | Prediction governance | Lux-specific |
| Liquid Democracy | LP-54 | - | - | Delegative voting | Novel implementation |

## Privacy Standards

### Zero-Knowledge

| Standard | Lux | Ethereum | Avalanche | Description | Advantages |
|----------|-----|----------|-----------|-------------|------------|
| Private Transfers | LP-35 | Tornado | - | Shielded transfers | Z-Chain native |
| ZK Proofs | LP-34 | Various | - | Proof systems | Multiple schemes |
| Private Tokens | LRC-38 | AZTEC | - | Confidential assets | Better performance |

## Unique Lux Standards

### No Direct Equivalents

| Standard | Description | Purpose | Status |
|----------|-------------|---------|---------|
| LP-25 | B-Chain Specification | Attestation blockchain | Unique |
| LP-33 | Z-Chain Architecture | Privacy chain | Unique |
| LP-40 | A-Chain Specification | Archive chain | Unique |
| LRC-30 | Regulated Security Token | Compliant securities | Innovation |
| LRC-46 | Data Registry Standard | Data availability | Novel |

## Migration Guide

### From Ethereum

```javascript
// Ethereum ERC-20
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Lux LRC-20 (direct compatibility)
import "@lux/contracts/token/LRC20/LRC20.sol";
// Additional features available
import "@lux/contracts/token/LRC20/extensions/LRC20Bridgeable.sol";
```

### From Avalanche

```javascript
// Avalanche subnet assets
// Can use Teleporter for native bridging to Lux
import "@lux/contracts/bridge/TeleporterCompatible.sol";
```

## Compatibility Matrix

### Full Compatibility ✅

These standards work identically across chains:
- ERC-20 ↔ LRC-20
- ERC-721 ↔ LRC-721
- ERC-1155 ↔ LRC-1155
- ERC-165 ↔ LRC-165

### Enhanced Compatibility 🔧

These standards are compatible but Lux adds features:
- ERC-2612 → LRC-2612 (+ B-Chain integration)
- ERC-4626 → LRC-4626 (+ cross-chain yield)
- ERC-4337 → LRC-4337 (+ native support)

### Conceptual Compatibility 🔄

Similar purpose, different implementation:
- Ethereum L2s ↔ Lux Subnets
- Various bridges ↔ LP-17 unified bridge
- Multiple DEXs ↔ LP-13 standard interface

### Lux Exclusive 🆕

No equivalent on other chains:
- B-Chain attestations
- Z-Chain privacy
- A-Chain archival
- Holographic consensus
- Native cross-chain flash loans

## Developer Recommendations

### Porting from Ethereum

1. **Token Projects**: Use same ERC numbers as LRC
2. **DeFi Projects**: Check for enhanced features
3. **Infrastructure**: Leverage native capabilities
4. **Governance**: Consider holographic consensus

### Porting from Avalanche

1. **Subnet Projects**: Easy migration path
2. **AWM Users**: Direct Teleporter support
3. **Native Assets**: Use bridge standards
4. **Validators**: Similar architecture

### New Projects

1. **Start with LRCs**: Better features
2. **Use B-Chain**: For compliance needs
3. **Leverage Z-Chain**: For privacy
4. **Plan for scale**: Use A-Chain early

## Quick Reference

### Most Used Standards

| Purpose | Ethereum | Lux | Quick Note |
|---------|----------|-----|------------|
| Fungible Token | ERC-20 | LRC-20 | Direct port |
| NFT | ERC-721 | LRC-721 | + bridging |
| Multi-Token | ERC-1155 | LRC-1155 | + gaming |
| Vault | ERC-4626 | LRC-4626 | + yield |
| Flash Loan | ERC-3156 | LRC-3156 | + x-chain |

### Unique Advantages

| Feature | Lux Advantage | Standard |
|---------|---------------|----------|
| Privacy | Native Z-Chain | LP-33+ |
| Compliance | B-Chain attestations | LP-25+ |
| Archival | A-Chain storage | LP-40+ |
| Bridging | Native support | LP-15+ |
| Governance | Holographic | LP-3 |

## Resources

### Documentation
- [Lux Docs](https://docs.lux.network)
- [Ethereum EIPs](https://eips.ethereum.org)
- [Avalanche ACPs](https://github.com/avalanche-foundation/ACPs)

### Migration Tools
- [Lux Migration Kit](https://github.com/luxfi/migration-kit)
- [Standard Converter](https://convert.lux.network)
- [Compatibility Checker](https://compat.lux.network)

### Support
- Discord: #migration-help
- Forum: migration.lux.network
- Email: standards@lux.network

---

*Last Updated: January 2025*  
*Version: 1.0*

*Note: This document is maintained by the Lux Standards Committee and updated as new standards are adopted.*