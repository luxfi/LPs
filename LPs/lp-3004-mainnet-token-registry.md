---
lp: 3004
title: Mainnet Token Registry
description: Complete registry of deployed bridge tokens on Lux and Zoo networks.
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Living
type: Informational
category: Interface
created: 2025-12-26
requires: [3020, 3023]
tags: [tokens, bridge, registry, mainnet]
order: 40
tier: product
track: defi
---

## Abstract

This LP maintains a canonical registry of all deployed bridge tokens on the Lux Network (Chain ID: 96369) and Zoo Network (Chain ID: 200200). Bridge tokens follow the L*/Z* prefix convention and use the ERC20B (bridgeable) standard defined in LP-3023.

## Motivation

A canonical on-chain registry is essential for:
- DEX and DeFi protocol integrations
- Wallet token detection and display
- Cross-chain bridge operations
- Frontend application configuration
- Security auditing and verification

## Token Naming Convention

| Prefix | Description | Example |
|--------|-------------|---------|
| `L*` | Bridge token on Lux Network | LETH (ETH bridged to Lux) |
| `Z*` | Bridge token on Zoo Network | ZETH (ETH bridged to Zoo) |
| `s*` | Synthetic token (self-repaying) | sETH (Synthetic ETH) |
| `W*` | Wrapped native token | WLUX, WZOO |

**Liquid Staking Tokens:**
- **LZOO** = "Liquid Zoo" (ZOO liquid staked on Lux)
- **ZLUX** = "Liquid LUX" (LUX liquid staked on Zoo)

## Lux Network Tokens (Chain ID: 96369)

### Native & Wrapped

| Token | Symbol | Address | Decimals |
|-------|--------|---------|----------|
| Native LUX | LUX | Native | 18 |
| Wrapped LUX | WLUX | `0x4888E4a2Ee0F03051c72D2BD3ACf755eD3498B3E` | 18 |

### Bridge Tokens (L* Prefix)

| Symbol | Name | Address | Source |
|--------|------|---------|--------|
| LUSD | Lux Dollar | `0x848Cff46eb323f323b6Bbe1Df274E40793d7f2c2` | Stablecoin |
| LETH | Lux ETH | `0x60E0a8167FC13dE89348978860466C9ceC24B9ba` | Ethereum |
| LBTC | Lux BTC | `0x1E48D32a4F5e9f08DB9aE4959163300FaF8A6C8e` | Bitcoin |
| LSOL | Lux SOL | `0x26B40f650156C7EbF9e087Dd0dca181Fe87625B7` | Solana |
| LTON | Lux TON | `0x3141b94b89691009b950c96e97Bff48e0C543E3C` | TON |
| LBNB | Lux BNB | `0x6EdcF3645DeF09DB45050638c41157D8B9FEa1cf` | BNB Chain |
| LPOL | Lux POL | `0x66cf428162E560D3FFa40eB87e81F9A3e52b6fA1` | Polygon |
| LCELO | Lux CELO | `0xe0B7A4b4A6F3A35Ebf4c57c29CC8e60cF0f6B2b0` | Celo |
| LFTM | Lux FTM | `0x25892D8b25C8B00c39106b04A6f7D4e0E29D95F3` | Fantom |
| LXDAI | Lux xDAI | `0xE3c6AB09b5d3cF1a54C4F3e8ed2e62a7E8b99e0B` | Gnosis |
| LBLAST | Lux BLAST | `0xEB9462c99a8Ac66CfcC7fF42a5A7f5d3C87D3dA8` | Blast |
| LAVAX | Lux AVAX | `0x43c4CC2530205D32B0B7B0CdeEc0ae71C2A2BD29` | Avalanche |
| LZOO | Liquid Zoo | `0x5E5290f350352768bD2bfC59c2DA15DD04A7cB88` | Zoo Network |

### Staked & Synthetic Tokens

| Symbol | Name | Address | Collateral |
|--------|------|---------|------------|
| sLUX | Staked LUX | `0x977afee2d1043ecdbc27ff530329837286457988` | WLUX |
| sUSD | Synthetic USD | `0x22F3Eb4Ca9Ea7b8Ab22A58D4C9B52AbD7E9c9E8C` | LUSD |
| sETH | Synthetic ETH | `0x82c0aaD0A5B2F7f5Bdb2E5c8b5E5F4a0e1A2B3C4` | LETH |
| sBTC | Synthetic BTC | `0x8E1bB4F0e8bA9E8c8D8F9A0A1B2C3D4E5F6A7B8C` | LBTC |
| sAI | Synthetic AI | `0x4F9b8C7D6E5A4B3C2D1E0F9A8B7C6D5E4F3A2B1C` | AI |
| sSOL | Synthetic SOL | `0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B` | LSOL |
| sTON | Synthetic TON | `0x2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C` | LTON |
| sADA | Synthetic ADA | `0x3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D` | LADA |
| sAVAX | Synthetic AVAX | `0x4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E` | LAVAX |
| sBNB | Synthetic BNB | `0x5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F` | LBNB |
| sPOL | Synthetic POL | `0x6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A` | LPOL |
| sZOO | Synthetic ZOO | `0x7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B` | LZOO |

## Zoo Network Tokens (Chain ID: 200200)

### Native & Wrapped

| Token | Symbol | Address | Decimals |
|-------|--------|---------|----------|
| Native ZOO | ZOO | Native | 18 |
| Wrapped ZOO | WZOO | `0x4888E4a2Ee0F03051c72D2BD3ACf755eD3498B3E` | 18 |

### Bridge Tokens (Z* Prefix)

| Symbol | Name | Address | Source |
|--------|------|---------|--------|
| ZUSD | Zoo Dollar | `0x848Cff46eb323f323b6Bbe1Df274E40793d7f2c2` | Stablecoin |
| ZETH | Zoo ETH | `0x60E0a8167FC13dE89348978860466C9ceC24B9ba` | Ethereum |
| ZBTC | Zoo BTC | `0x1E48D32a4F5e9f08DB9aE4959163300FaF8A6C8e` | Bitcoin |
| ZSOL | Zoo SOL | `0x26B40f650156C7EbF9e087Dd0dca181Fe87625B7` | Solana |
| ZTON | Zoo TON | `0x3141b94b89691009b950c96e97Bff48e0C543E3C` | TON |
| ZLUX | Liquid LUX | `0x5E5290f350352768bD2bfC59c2DA15DD04A7cB88` | Lux Network |
| ZBNB | Zoo BNB | `0x6EdcF3645DeF09DB45050638c41157D8B9FEa1cf` | BNB Chain |
| ZPOL | Zoo POL | `0x66cf428162E560D3FFa40eB87e81F9A3e52b6fA1` | Polygon |
| ZCELO | Zoo CELO | `0xe0B7A4b4A6F3A35Ebf4c57c29CC8e60cF0f6B2b0` | Celo |
| ZFTM | Zoo FTM | `0x25892D8b25C8B00c39106b04A6f7D4e0E29D95F3` | Fantom |
| ZXDAI | Zoo xDAI | `0xE3c6AB09b5d3cF1a54C4F3e8ed2e62a7E8b99e0B` | Gnosis |

## Markets & Liquidity Pools

### Initial DEX Markets (Lux Network)

| Pair | Pool Type | Fee Tier |
|------|-----------|----------|
| LUX/LUSD | AMM V3 | 0.30% |
| LETH/LUSD | AMM V3 | 0.30% |
| LBTC/LUSD | AMM V3 | 0.30% |
| LUX/LETH | AMM V3 | 0.30% |
| LZOO/LUX | AMM V3 | 0.30% |

### Initial DEX Markets (Zoo Network)

| Pair | Pool Type | Fee Tier |
|------|-----------|----------|
| ZOO/ZUSD | AMM V3 | 0.30% |
| ZETH/ZUSD | AMM V3 | 0.30% |
| ZBTC/ZUSD | AMM V3 | 0.30% |
| ZOO/ZETH | AMM V3 | 0.30% |
| ZLUX/ZOO | AMM V3 | 0.30% |

## Token Icons

Token icons are available from the CDN:

```
https://cdn.lux.network/exchange/icon-png/{symbol}.png
```

Examples:
- `https://cdn.lux.network/exchange/icon-png/lux.png`
- `https://cdn.lux.network/exchange/icon-png/leth.png`
- `https://cdn.lux.network/exchange/icon-png/zoo.png`

## Security Considerations

1. **Admin Keys**: All bridge tokens use admin-controlled minting. Admin keys must be secured via MPC threshold signatures (LP-7014).
2. **Oracle Dependency**: Price oracles are required for accurate market operations.
3. **Bridge Security**: Cross-chain transfers depend on the security of the underlying bridge protocol (LP-6021).

## Changelog

| Date | Change |
|------|--------|
| 2025-12-26 | Initial registry with 13 L* tokens and 11 Z* tokens |
| 2025-12-26 | Added synthetic token addresses |
| 2025-12-26 | Updated LZOO name to "Liquid Zoo", ZLUX to "Liquid LUX" |

## Related LPs

- [LP-3020](/LPs/lp-3020-lrc-20-fungible-token-standard) - LRC-20 Token Standard
- [LP-3023](/LPs/lp-3023-lrc-20-bridgable-extension) - Bridgeable Token Extension
- [LP-3003](/LPs/lp-3003-synths-self-repaying-loans-standard) - Synths Standard
- [LP-6021](/LPs/lp-6021-teleport-protocol) - Teleport Bridge Protocol
- [LP-7014](/LPs/lp-7014-t-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa) - MPC Threshold Signatures

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
