---
lp: 3000
title: Lux Standard Library Registry
description: Comprehensive registry of all contracts, forks, library dependencies, and deployed addresses in the Lux Standard Library
author: Lux Industries (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Informational
created: 2025-12-23
updated: 2025-12-25
tags: [registry, contracts, standard-library, defi]
order: 3000
---

# LP-3000: Lux Standard Library Registry

## Abstract

This LP provides a comprehensive registry of all contracts, forks, library dependencies, and deployed addresses in the Lux Standard Library (`~/work/lux/standard`). It serves as the canonical reference for all DeFi protocol contracts deployed across Lux, Zoo, and Hanzo chains.

## Motivation

The Lux ecosystem requires a single source of truth for:
- Library dependencies and their versions
- Deployed contract addresses across all chains
- Token registries for each network
- Bridge and vault infrastructure
- Precompile addresses

## Standard Library Overview

**Repository**: `https://github.com/luxfi/standard`
**Solidity Version**: 0.8.31
**Framework**: Foundry
**Test Coverage**: 751 tests passing (100%)

### Contract Categories

| Category | Path | Description |
|----------|------|-------------|
| **AMM** | `contracts/amm/` | Uniswap V2/V3 interfaces, router adapters |
| **AI** | `contracts/ai/` | AI token and mining contracts |
| **Bridge** | `contracts/bridge/` | Bridged stablecoins (USDC, USDT, DAI, WETH) |
| **Governance** | `contracts/governance/` | DAO, voting, timelock contracts |
| **Liquidity** | `contracts/liquidity/` | Oracle precompiles, price aggregation |
| **NFT** | `contracts/nft/` | ERC721, ERC1155, marketplace contracts |
| **Perps** | `contracts/perps/` | GMX-style perpetuals (Vault, Router, GLP) |
| **Synths** | `contracts/synths/` | Alchemix-style synthetics (alUSD, alETH, alBTC) |
| **Tokens** | `contracts/tokens/` | WLUX, LUX, governance tokens |
| **Utils** | `contracts/utils/` | Libraries, helpers, abstract contracts |

---

## Library Dependencies (Git Submodules)

### DeFi Protocols

| Library | Path | Version | URL |
|---------|------|---------|-----|
| **Uniswap V2 Core** | `lib/v2-core` | main | github.com/Uniswap/v2-core |
| **Uniswap V3 Core** | `lib/v3-core` | main | github.com/Uniswap/v3-core |
| **Uniswap V3 Periphery** | `lib/v3-periphery` | main | github.com/Uniswap/v3-periphery |
| **Uniswap Lib** | `lib/uniswap-lib` | main | github.com/Uniswap/uniswap-lib |
| **Aave V3** | `lib/aave-v3` | v1.19.4 | github.com/aave/aave-v3-core |
| **Alchemix V2** | `lib/alchemix-v2` | master | github.com/alchemix-finance/v2-foundry |
| **Compound** | `lib/compound` | v2.6-rc3 | github.com/compound-finance/compound-protocol |
| **GMX Contracts** | `lib/gmx-contracts` | GlpManager-v2 | github.com/gmx-io/gmx-contracts |
| **GMX Synthetics** | `lib/gmx-synthetics` | v2.2 | github.com/gmx-io/gmx-synthetics |

### Security & Infrastructure

| Library | Path | Version | URL |
|---------|------|---------|-----|
| **OpenZeppelin Contracts** | `lib/openzeppelin-contracts` | v4.8.0+ | github.com/OpenZeppelin/openzeppelin-contracts |
| **OpenZeppelin Upgradeable** | `lib/openzeppelin-contracts-upgradeable` | v5.1.0 | github.com/OpenZeppelin/openzeppelin-contracts-upgradeable |
| **Safe Smart Account** | `lib/safe-smart-account` | v1.1.0+ | github.com/safe-global/safe-smart-account |
| **Safe Modules** | `lib/safe-modules` | allowance/v0.1.1 | github.com/safe-global/safe-modules |
| **Account Abstraction** | `lib/account-abstraction` | v0.9.0 | github.com/eth-infinitism/account-abstraction |
| **Chainlink Contracts** | `lib/chainlink-contracts` | 1.3.0 | github.com/smartcontractkit/chainlink-brownie-contracts |
| **LayerZero V2** | `lib/layerzero-v2` | anchor-v0.31.1 | github.com/LayerZero-Labs/LayerZero-v2 |

### Utilities

| Library | Path | Version | URL |
|---------|------|---------|-----|
| **Forge Std** | `lib/forge-std` | master | github.com/foundry-rs/forge-std |
| **Solmate** | `lib/solmate` | v6+ | github.com/rari-capital/solmate |
| **PRB Math** | `lib/prb-math` | v4.1.0 | github.com/PaulRBerg/prb-math |
| **Base64** | `lib/base64` | v1.1.0 | github.com/Brechtpd/base64 |
| **Clones with Immutable Args** | `lib/clones-with-immutable-args` | master | github.com/wighawag/clones-with-immutable-args |
| **Manifold XYZ** | `lib/manifoldxyz` | main | github.com/manifoldxyz/royalty-registry-solidity |

---

## Chain Configuration

### Network Details

| Chain | Chain ID | Native Token | RPC | Explorer |
|-------|----------|--------------|-----|----------|
| **Lux Mainnet** | 96369 | LUX | https://api.lux.network | https://explore.lux.network |
| **Lux Testnet** | 96368 | LUX | https://api.lux-test.network | https://explore.lux-test.network |
| **Zoo Mainnet** | 200200 | ZOO | https://api.zoo.network | https://explore.zoo.network |
| **Zoo Testnet** | 200201 | ZOO | https://api.zoo-test.network | https://explore.zoo-test.network |
| **Hanzo Mainnet** | 36963 | HANZO | https://api.hanzo.network | https://explore.hanzo.network |
| **Hanzo Testnet** | 36962 | HANZO | https://api.hanzo-test.network | https://explore.hanzo-test.network |

### Genesis Configuration (Lux Mainnet)

```json
{
  "chainId": 96369,
  "baseFeePerGas": "0x0",
  "gasLimit": 15000000,
  "feeConfig": {
    "minBaseFee": 25000000000,
    "targetBlockRate": 2,
    "targetGas": 15000000
  },
  "treasury": "0x9011E888251AB053B7bD1cdB598Db4f9DEd94714"
}
```solidity

---

## Deployed Contracts: Lux Mainnet (96369)

### Core Tokens

| Token | Symbol | Decimals | Address |
|-------|--------|----------|---------|
| **Wrapped LUX** | WLUX | 18 | `0x4888E4a2Ee0F03051c72D2BD3ACf755eD3498B3E` |
| **Liquid ETH** | LETH | 18 | `0x60E0a8167FC13dE89348978860466C9ceC24B9ba` |
| **Liquid USD** | LUSD | 18 | `0x848Cff46eb323f323b6Bbe1Df274E40793d7f2c2` |
| **Liquid BTC** | LBTC | 18 | `0x1E48D32a4F5e9f08DB9aE4959163300FaF8A6C8e` |
| **Liquid BNB** | LBNB | 18 | `0x6EdcF3645DeF09DB45050638c41157D8B9FEa1cf` |
| **Liquid POL** | LPOL | 18 | `0x28BfC5DD4B7E15659e41190983e5fE3df1132bB9` |
| **Liquid CELO** | LCELO | 18 | `0x3078847F879A33994cDa2Ec1540ca52b5E0eE2e5` |
| **Liquid FTM** | LFTM | 18 | `0x8B982132d639527E8a0eAAD385f97719af8f5e04` |
| **Liquid XDAI** | LXDAI | 18 | `0x7dfb3cBf7CF9c96fd56e3601FBA50AF45C731211` |
| **Liquid SOL** | LSOL | 18 | `0x26B40f650156C7EbF9e087Dd0dca181Fe87625B7` |
| **Liquid TON** | LTON | 18 | `0x3141b94b89691009b950c96e97Bff48e0C543E3C` |
| **Liquid BLAST** | LBLAST | 18 | `0x94f49D0F4C62bbE4238F4AaA9200287bea9F2976` |
| **Liquid AVAX** | LAVAX | 18 | `0x0e4bD0DD67c15dECfBBBdbbE07FC9d51D737693D` |
| **Liquid ZOO** | LZOO | 18 | `0x5E5290f350352768bD2bfC59c2DA15DD04A7cB88` |

### Uniswap V2 (AMM)

| Contract | Address |
|----------|---------|
| **V2 Factory** | `0xD173926A10A0C4eCd3A51B1422270b65Df0551c1` |
| **V2 Router** | `0xAe2cf1E403aAFE6C05A5b8Ef63EB19ba591d8511` |

### Uniswap V3 (Concentrated Liquidity)

| Contract | Address |
|----------|---------|
| **V3 Factory** | `0x80bBc7C4C7a59C899D1B37BC14539A22D5830a84` |
| **V3 Router** | `0x939bC0Bca6F9B9c52E6e3AD8A3C590b5d9B9D10E` |
| **Quoter** | `0x12e2B76FaF4dDA5a173a4532916bb6Bfa3645275` |
| **NonfungiblePositionManager** | `0x7a4C48B9dae0b7c396569b34042fcA604150Ee28` |
| **TickLens** | `0x57A22965AdA0e52D785A9Aa155beF423D573b879` |
| **Multicall** | `0xd25F88CBdAe3c2CCA3Bb75FC4E723b44C0Ea362F` |

---

## Deployed Contracts: Lux Testnet (96368)

### Core Tokens

| Token | Symbol | Address |
|-------|--------|---------|
| **Liquid USD** | LUSD | `0xb84112ac9318a0b2319aa11d4d10e9762b25f7f4` |

### Uniswap V2/V3

Same addresses as mainnet (CREATE2 deterministic deployment):

| Contract | Address |
|----------|---------|
| **V2 Factory** | `0xD173926A10A0C4eCd3A51B1422270b65Df0551c1` |
| **V2 Router** | `0xAe2cf1E403aAFE6C05A5b8Ef63EB19ba591d8511` |
| **V3 Factory** | `0x80bBc7C4C7a59C899D1B37BC14539A22D5830a84` |
| **V3 Router** | `0x939bC0Bca6F9B9c52E6e3AD8A3C590b5d9B9D10E` |

---

## Deployed Contracts: Zoo Mainnet (200200)

### Core Tokens

| Token | Symbol | Decimals | Address |
|-------|--------|----------|---------|
| **Wrapped ZOO** | WZOO | 18 | `0x4888E4a2Ee0F03051c72D2BD3ACf755eD3498B3E` |
| **Zoo ETH** | ZETH | 18 | `0x60E0a8167FC13dE89348978860466C9ceC24B9ba` |
| **Zoo USD** | ZUSD | 18 | `0x848Cff46eb323f323b6Bbe1Df274E40793d7f2c2` |
| **Zoo BTC** | ZBTC | 18 | `0x1E48D32a4F5e9f08DB9aE4959163300FaF8A6C8e` |
| **Zoo LUX** | ZLUX | 18 | `0x5E5290f350352768bD2bfC59c2DA15DD04A7cB88` |
| **Zoo BNB** | ZBNB | 18 | `0x6EdcF3645DeF09DB45050638c41157D8B9FEa1cf` |
| **Zoo POL** | ZPOL | 18 | `0x28BfC5DD4B7E15659e41190983e5fE3df1132bB9` |
| **Zoo CELO** | ZCELO | 18 | `0x3078847F879A33994cDa2Ec1540ca52b5E0eE2e5` |
| **Zoo FTM** | ZFTM | 18 | `0x8B982132d639527E8a0eAAD385f97719af8f5e04` |
| **Zoo xDAI** | ZXDAI | 18 | `0x7dfb3cBf7CF9c96fd56e3601FBA50AF45C731211` |
| **Zoo SOL** | ZSOL | 18 | `0x26B40f650156C7EbF9e087Dd0dca181Fe87625B7` |
| **Zoo TON** | ZTON | 18 | `0x3141b94b89691009b950c96e97Bff48e0C543E3C` |
| **Zoo ADA** | ZADA | 18 | `0x8b34152832b8ab4a3274915675754AA61eC113F0` |
| **Zoo AVAX** | ZAVAX | 18 | `0x0EE4602429bFCEf8aEB1012F448b23532f9855Bd` |
| **Zoo BLAST** | ZBLAST | 18 | `0x7a56c769C50F2e73CFB70b401409Ad1F1a5000cd` |

### Meme Tokens (Zoo Ecosystem)

| Token | Symbol | Decimals | Address |
|-------|--------|----------|---------|
| **Zoo BONK** | ZBONK | 18 | `0x8a873ad8CfF8ba640D71274d33a85AB1B2d53b62` |
| **Zoo WIF** | ZWIF | 18 | `0x4586D49f3a32c3BeCA2e09802e0aB1Da705B011D` |
| **Zoo Popcat** | ZPOPCAT | 18 | `0x68Cd9b8Df6E86dA02ef030c2F1e5a3Ad6B6d747F` |
| **Zoo PNUT** | ZPNUT | 18 | `0x0e4bD0DD67c15dECfBBBdbbE07FC9d51D737693D` |
| **Zoo MEW** | ZMEW | 18 | `0x94f49D0F4C62bbE4238F4AaA9200287bea9F2976` |
| **Zoo BOME** | ZBOME | 18 | `0xEf770a556430259d1244F2A1384bd1A672cE9e7F` |
| **Zoo GIGA** | ZGIGA | 18 | `0xBBd222BD7dADd241366e6c2CbD5979F678598A85` |
| **Zoo AI16Z** | ZAI16Z | 18 | `0x273196F2018D61E31510D1Aa1e6644955880D122` |
| **Zoo FWOG** | ZFWOG | 18 | `0xd8ab3C445d81D78E7DC2d60FeC24f8C7328feF2f` |
| **Zoo MOODENG** | ZMOODENG | 18 | `0xe6cd610aD16C8Fe5BCeDFff7dAB2e3d461089261` |
| **Zoo PONKE** | ZPONKE | 18 | `0xDF7740fCC9B244c192CfFF7b6553a3eEee0f4898` |
| **Zoo NOT** | ZNOT | 18 | `0xdfCAdda48DbbA09f5678aE31734193F7CCA7f20d` |
| **Zoo DOGS** | ZDOGS | 18 | `0x0b0FF795d0A1C162b44CdC35D8f4DCbC2b4B9170` |
| **Zoo MRB** | ZMRB | 18 | `0x3FfA9267739C04554C1fe640F79651333A2040e1` |
| **Zoo REDO** | ZREDO | 18 | `0x137747A15dE042Cd01fCB41a5F3C7391d932750B` |
| **Slog** | SLOG | 6 | `0xED15C23B27a69b5bd50B1eeF5B8f1C8D849462b7` |

### Uniswap V2/V3 (Zoo)

Same CREATE2 addresses as Lux:

| Contract | Address |
|----------|---------|
| **V2 Factory** | `0xD173926A10A0C4eCd3A51B1422270b65Df0551c1` |
| **V2 Router** | `0xAe2cf1E403aAFE6C05A5b8Ef63EB19ba591d8511` |
| **V3 Factory** | `0x80bBc7C4C7a59C899D1B37BC14539A22D5830a84` |
| **V3 Router** | `0x939bC0Bca6F9B9c52E6e3AD8A3C590b5d9B9D10E` |
| **Quoter** | `0x12e2B76FaF4dDA5a173a4532916bb6Bfa3645275` |
| **NonfungiblePositionManager** | `0x7a4C48B9dae0b7c396569b34042fcA604150Ee28` |
| **TickLens** | `0x57A22965AdA0e52D785A9Aa155beF423D573b879` |
| **Multicall** | `0xd25F88CBdAe3c2CCA3Bb75FC4E723b44C0Ea362F` |

---

## Bridge Infrastructure

### Bridge Contract Architecture

The Lux Bridge uses MPC-signed messages for cross-chain token transfers.

**Core Contracts**:

| Contract | Purpose | Source |
|----------|---------|--------|
| `Bridge.sol` | Main bridge contract with MPC verification | `~/work/lux/bridge/src/contracts/Bridge.sol` |
| `LuxVault.sol` | ERC4626 vault for Lux chain assets | `~/work/lux/bridge/src/contracts/LuxVault.sol` |
| `ZooVault.sol` | ERC4626 vault for Zoo chain assets | `~/work/lux/bridge/src/contracts/ZooVault.sol` |
| `ETHVault.sol` | Native ETH vault | `~/work/lux/bridge/src/contracts/ETHVault.sol` |
| `ERC20B.sol` | Bridge-enabled ERC20 base | `~/work/lux/bridge/src/contracts/ERC20B.sol` |
| `LERC4626.sol` | ERC4626 tokenized vault | `~/work/lux/bridge/src/contracts/LERC4626.sol` |

### Bridge Token Contracts (Lux Chain)

| Token | Contract | Source |
|-------|----------|--------|
| LETH | `LETH.sol` | `~/work/lux/bridge/src/contracts/lux/LETH.sol` |
| LUSD | `LUSD.sol` | `~/work/lux/bridge/src/contracts/lux/LUSD.sol` |
| LBTC | `LBTC.sol` | `~/work/lux/bridge/src/contracts/lux/LBTC.sol` |
| LBNB | `LBNB.sol` | `~/work/lux/bridge/src/contracts/lux/LBNB.sol` |
| LPOL | `LPOL.sol` | `~/work/lux/bridge/src/contracts/lux/LPOL.sol` |
| LCELO | `LCELO.sol` | `~/work/lux/bridge/src/contracts/lux/LCELO.sol` |
| LFTM | `LFTM.sol` | `~/work/lux/bridge/src/contracts/lux/LFTM.sol` |
| LXDAI | `LXDAI.sol` | `~/work/lux/bridge/src/contracts/lux/LXDAI.sol` |
| LSOL | `LSOL.sol` | `~/work/lux/bridge/src/contracts/lux/LSOL.sol` |
| LTON | `LTON.sol` | `~/work/lux/bridge/src/contracts/lux/LTON.sol` |
| LAVAX | `LAVAX.sol` | `~/work/lux/bridge/src/contracts/lux/LAVAX.sol` |
| LBLAST | `LBLAST.sol` | `~/work/lux/bridge/src/contracts/lux/LBLAST.sol` |
| LZOO | `LZOO.sol` | `~/work/lux/bridge/src/contracts/lux/LZOO.sol` |
| LADA | `LADA.sol` | `~/work/lux/bridge/src/contracts/lux/LADA.sol` |
| LAI16Z | `LAI16Z.sol` | `~/work/lux/bridge/src/contracts/lux/LAI16Z.sol` |

### Bridge Token Contracts (Zoo Chain)

| Token | Contract | Source |
|-------|----------|--------|
| ZETH | `ZETH.sol` | `~/work/lux/bridge/src/contracts/zoo/ZETH.sol` |
| ZUSD | `ZUSD.sol` | `~/work/lux/bridge/src/contracts/zoo/ZUSD.sol` |
| ZBTC | `ZBTC.sol` | `~/work/lux/bridge/src/contracts/zoo/ZBTC.sol` |
| ZLUX | `ZLUX.sol` | `~/work/lux/bridge/src/contracts/zoo/ZLUX.sol` |
| ZBNB | `ZBNB.sol` | `~/work/lux/bridge/src/contracts/zoo/ZBNB.sol` |
| ZPOL | `ZPOL.sol` | `~/work/lux/bridge/src/contracts/zoo/ZPOL.sol` |
| ZCELO | `ZCELO.sol` | `~/work/lux/bridge/src/contracts/zoo/ZCELO.sol` |
| ZFTM | `ZFTM.sol` | `~/work/lux/bridge/src/contracts/zoo/ZFTM.sol` |
| ZXDAI | `ZXDAI.sol` | `~/work/lux/bridge/src/contracts/zoo/ZXDAI.sol` |
| ZSOL | `ZSOL.sol` | `~/work/lux/bridge/src/contracts/zoo/ZSOL.sol` |
| ZTON | `ZTON.sol` | `~/work/lux/bridge/src/contracts/zoo/ZTON.sol` |
| ZAVAX | `ZAVAX.sol` | `~/work/lux/bridge/src/contracts/zoo/ZAVAX.sol` |
| ZBLAST | `ZBLAST.sol` | `~/work/lux/bridge/src/contracts/zoo/ZBLAST.sol` |
| ZADA | `ZADA.sol` | `~/work/lux/bridge/src/contracts/zoo/ZADA.sol` |
| ZAI16Z | `ZAI16Z.sol` | `~/work/lux/bridge/src/contracts/zoo/ZAI16Z.sol` |
| ZBONK | `ZBONK.sol` | `~/work/lux/bridge/src/contracts/zoo/ZBONK.sol` |
| ZWIF | `ZWIF.sol` | `~/work/lux/bridge/src/contracts/zoo/ZWIF.sol` |
| ZPOPCAT | `ZPOPCAT.sol` | `~/work/lux/bridge/src/contracts/zoo/ZPOPCAT.sol` |
| ZPNUT | `ZPNUT.sol` | `~/work/lux/bridge/src/contracts/zoo/ZPNUT.sol` |
| ZMEW | `ZMEW.sol` | `~/work/lux/bridge/src/contracts/zoo/ZMEW.sol` |
| ZBOME | `ZBOME.sol` | `~/work/lux/bridge/src/contracts/zoo/ZBOME.sol` |
| ZGIGA | `ZGIGA.sol` | `~/work/lux/bridge/src/contracts/zoo/ZGIGA.sol` |
| ZFWOG | `ZFWOG.sol` | `~/work/lux/bridge/src/contracts/zoo/ZFWOG.sol` |
| ZMOODENG | `ZMOODENG.sol` | `~/work/lux/bridge/src/contracts/zoo/ZMOODENG.sol` |
| ZPONKE | `ZPONKE.sol` | `~/work/lux/bridge/src/contracts/zoo/ZPONKE.sol` |
| ZNOT | `ZNOT.sol` | `~/work/lux/bridge/src/contracts/zoo/ZNOT.sol` |
| ZDOGS | `ZDOGS.sol` | `~/work/lux/bridge/src/contracts/zoo/ZDOGS.sol` |
| SLOG | `SLOG.sol` | `~/work/lux/bridge/src/contracts/zoo/SLOG.sol` |
| TRUMP | `TRUMP.sol` | `~/work/lux/bridge/src/contracts/zoo/TRUMP.sol` |
| MELANIA | `MELANIA.sol` | `~/work/lux/bridge/src/contracts/zoo/MELANIA.sol` |
| CYRUS | `CYRUS.sol` | `~/work/lux/bridge/src/contracts/zoo/CYRUS.sol` |

### Bridge Key Addresses

| Item | Address |
|------|---------|
| **Treasury/Payout** | `0x9011E888251AB053B7bD1cdB598Db4f9DEd94714` |
| **Bridge Fee Rate** | 1% (100 basis points) |

---

## EVM Precompiles

### Lux Standard Precompiles

| Precompile | Address | Description |
|------------|---------|-------------|
| **ContractDeployerAllowList** | `0x0200000000000000000000000000000000000400` | Deployer permissions |
| **FeeManager** | `0x0200000000000000000000000000000000000401` | Fee configuration |
| **NativeMinter** | `0x0200000000000000000000000000000000000402` | Native token minting |
| **TxAllowList** | `0x0200000000000000000000000000000000000403` | Transaction permissions |
| **Warp** | `0x0200000000000000000000000000000000000005` | Cross-chain messaging |

### Cryptography Precompiles

| Precompile | Address | Description |
|------------|---------|-------------|
| **ML-DSA** | `0x0200000000000000000000000000000000000006` | Post-quantum signatures |
| **SLH-DSA** | `0x0200000000000000000000000000000000000007` | Stateless hash signatures |
| **PQCrypto** | `0x0200000000000000000000000000000000000009` | Multi-PQ operations |
| **Quasar** | `0x020000000000000000000000000000000000000A` | Quantum consensus |
| **Ringtail** | `0x020000000000000000000000000000000000000B` | Threshold lattice signatures |
| **FROST** | `0x020000000000000000000000000000000000000C` | Schnorr threshold |
| **CGGMP21** | `0x020000000000000000000000000000000000000D` | ECDSA threshold |

### Oracle Precompile

| Precompile | Address | Description |
|------------|---------|-------------|
| **Oracle** | `0x0200000000000000000000000000000000000011` | Native price oracle |

**Oracle Sources Supported**:
- `NATIVE` - Lux native prices
- `CHAINLINK` - Chainlink feeds
- `PYTH` - Pyth Network
- `BINANCE` - Binance API
- `KRAKEN` - Kraken API
- `UNISWAP_V3` - TWAP from V3 pools
- `AGGREGATE` - Multi-source aggregation

---

## Standard Library Test Coverage

**Total**: 751 tests passing across 35 test suites (100% pass rate)

### Protocol Test Suites

| Test Suite | Tests | Status | Description |
|------------|-------|--------|-------------|
| AITest | 15 | ✅ Pass | AI token functionality |
| AIMiningTest | 26 | ✅ Pass | GPU attestation mining |
| AITokenTest | 41 | ✅ Pass | Multi-chain AI token |
| AMMV2Test | 30 | ✅ Pass | Uniswap V2 AMM |
| AMMV3Test | 14 | ✅ Pass | Concentrated liquidity AMM |
| AdaptersTest | 31 | ✅ Pass | Aave/Compound/Yearn adapters |
| BridgeTokensTest | 47 | ✅ Pass | L*/Z* bridge tokens |
| GovernanceTest | 37 | ✅ Pass | DAO, voting, timelock |
| IdentityTest | 69 | ✅ Pass | W3C DID registry |
| LSSVMTest | 32 | ✅ Pass | NFT AMM (sudoswap-style) |
| LUXTest | 10 | ✅ Pass | Core LUX token |
| LamportFoundryTest | 6 | ✅ Pass | Post-quantum signatures |
| MarketsTest | 47 | ✅ Pass | Lending/borrowing markets |
| MarketTest | 26 | ✅ Pass | NFT marketplace |
| OmnichainTest | 36 | ✅ Pass | Cross-chain messaging |
| PerpsTest | 17 | ✅ Pass | Perpetual futures core |
| PerpsPositionTest | 20 | ✅ Pass | Position management |
| PerpsEdgeCaseTest | 20 | ✅ Pass | Edge case coverage |
| StakingTest | 43 | ✅ Pass | sLUX staking |
| SynthsTest | 14 | ✅ Pass | Self-repaying synths |
| SynthsEdgeCaseTest | 3 | ✅ Pass | Synth edge cases |
| TreasuryTest | 39 | ✅ Pass | Fee distribution |
| YieldStrategiesTest | 30 | ✅ Pass | Aave/Yearn strategies |
| LRC1155Test | 22 | ✅ Pass | Multi-token standard |

### CI/CD Status

- **GitHub Actions**: ✅ Passing
- **Workflow**: `ci.yml` (Build, Lint, Test)
- **Last Updated**: 2025-12-25

---

## Deployment Scripts

| Script | Purpose |
|--------|---------|
| `DeployAll.s.sol` | Master deployment (tokens, synths, perps) |
| `DeployAI.s.sol` | AI token deployment |
| `DeploySafe.s.sol` | Safe multisig deployment |
| `DeploySynths.s.sol` | Alchemix synths deployment |
| `DeployPerps.s.sol` | GMX perps deployment |
| `ComputeAddresses.s.sol` | CREATE2 address prediction |
| `Create2Deployer.sol` | Deterministic deployment factory |

---

## LRC Token Standards Index

LRC (Lux Request for Comments) standards are Lux-native equivalents of ERC standards, optimized for the Lux ecosystem with cross-chain compatibility.

### LP-3000 Series Organization

| Range | Category | Description |
|-------|----------|-------------|
| **3000-3019** | Registry & Meta | Standard library registry, DeFi integrations |
| **3020-3079** | LRC-20 Extensions | Fungible token standard and extensions |
| **3080-3099** | Reserved | Future LRC-20 extensions |
| **3155-3199** | Core Standards | LRC-165, LRC-173, LRC-1155, LRC-1271, etc. |
| **3200-3299** | Storage & NFT Utilities | Namespaced storage, NFT staking, media |
| **3300-3399** | Account Abstraction | Safe, AA, paymasters |
| **3500-3599** | Precompiles | Cryptography and VM precompiles |
| **3600-3699** | VM & Chain | Virtual machine, rollups, gas |
| **3700-3799** | State & LRC-721 | Verkle, state sync, NFT standard |
| **3800-3899** | Bridge & Teleport | Cross-chain asset standards |
| **3900-3999** | Advanced Standards | Multi-token, royalties, proxies |

---

### LRC-20: Fungible Token Standard

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3020** | LRC-20 | ERC-20 | Base fungible token standard |
| **LP-3021** | LRC-20-Burnable | ERC20Burnable | Token burning capability |
| **LP-3022** | LRC-20-Mintable | ERC20Mintable | Token minting capability |
| **LP-3023** | LRC-20-Bridgable | - | Cross-chain bridge support |
| **LP-3024** | LRC-20-Capped | ERC20Capped | Maximum supply cap |
| **LP-3025** | LRC-20-Votes | ERC20Votes | Governance voting power |
| **LP-3026** | LRC-20-Permit | - | Gasless approvals (see LP-3612) |
| **LP-3027** | LRC-20-FlashMint | ERC20FlashMint | Flash minting capability |
| **LP-3028** | x402 Payment | HTTP 402 | Payment protocol standard |
| **LP-3029** | Adoption Guide | - | Token standards migration guide |
| **LP-3030** | LRC-20-Wrapper | ERC20Wrapper | Token wrapping capability |

### LRC-20 Related Standards

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3009** | LRC-3009 | ERC-3009 | Transfer with authorization |
| **LP-3612** | LRC-2612 | EIP-2612 | Permit extension (gasless approvals) |
| **LP-3363** | LRC-1363 | ERC-1363 | Payable token callbacks |
| **LP-3777** | LRC-777 | ERC-777 | Advanced token with hooks |

---

### LRC-721: Non-Fungible Token Standard

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3721** | LRC-721 | ERC-721 | Base NFT standard |
| **LP-3722** | LRC-721-Burnable | ERC721Burnable | NFT burning capability |
| **LP-3723** | LRC-721-Enumerable | ERC721Enumerable | Enumeration support |
| **LP-3981** | LRC-2981 | ERC-2981 | NFT royalty standard |
| **LP-3675** | LRC-4675 | ERC-4675 | Multi-fractional NFT |
| **LP-3551** | LRC-6551 | ERC-6551 | Token-bound accounts |

### NFT Utilities

| LP | Standard | Description |
|----|----------|-------------|
| **LP-3210** | NFT Staking | NFT staking mechanics |
| **LP-3211** | Media Content NFT | Media/content NFT standard |

---

### LRC-1155: Multi-Token Standard

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3155** | LRC-1155 | ERC-1155 | Multi-token standard |
| **LP-3157** | LRC-1155-Supply | ERC1155Supply | Supply tracking extension |
| **LP-3909** | LRC-6909 | ERC-6909 | Minimal multi-token |
| **LP-3525** | LRC-3525 | ERC-3525 | Semi-fungible token |

---

### LRC-4626: Tokenized Vault Standard

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3626** | LRC-4626 | ERC-4626 | Tokenized vault standard |
| **LP-3627** | LRC-4626-Multi | - | Multi-vault extensions |

---

### Core Infrastructure Standards

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3165** | LRC-165 | ERC-165 | Interface detection |
| **LP-3173** | LRC-173 | ERC-173 | Contract ownership |
| **LP-3156** | LRC-3156 | ERC-3156 | Flash loans |
| **LP-3271** | LRC-1271 | ERC-1271 | Signature validation |
| **LP-3201** | LRC-7201 | ERC-7201 | Namespaced storage layout |
| **LP-3967** | LRC-1967 | ERC-1967 | Proxy storage slots |
| **LP-3169** | LRC-5169 | ERC-5169 | Client script URI |
| **LP-3572** | LRC-7572 | ERC-7572 | Contract-level metadata |
| **LP-3528** | LRC-5528 | ERC-5528 | Refundable token |

---

### Account Abstraction Standards

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3337** | LRC-4337 | ERC-4337 | Account abstraction |
| **LP-3338** | Paymaster | ERC-4337 | Paymaster standard |
| **LP-3579** | LRC-7579 | ERC-7579 | Modular smart accounts |
| **LP-3310** | Safe Multisig | - | Safe multisig standard |
| **LP-3320** | Lamport-Safe | - | Post-quantum Safe signatures |

---

### Soulbound & Identity Standards

| LP | Standard | ERC Equivalent | Description |
|----|----------|----------------|-------------|
| **LP-3192** | LRC-5192 | ERC-5192 | Soulbound tokens |
| **LP-10093** | DID | W3C DID | Decentralized identity |

---

### Bridge & Cross-Chain Standards

| LP | Standard | Description |
|----|----------|-------------|
| **LP-3800** | Bridged Asset | Bridge token standard (L*/Z* tokens) |
| **LP-3810** | Teleport Token | Warp-based cross-chain tokens |
| **LP-3820** | L2 Ascension | L2 to sovereign L1 migration |

---

### Precompile Standards

| LP | Standard | Address | Description |
|----|----------|---------|-------------|
| **LP-3500** | ML-DSA | `0x...0006` | Post-quantum signatures |
| **LP-3501** | SLH-DSA | `0x...0007` | Stateless hash signatures |
| **LP-3502** | ML-DSA-2 | - | Extended PQ signatures |
| **LP-3503** | Quasar | `0x...000A` | Quantum consensus |
| **LP-3510** | Warp | `0x...0005` | Cross-chain messaging |
| **LP-3511** | Fee Manager | `0x...0401` | Dynamic fees |
| **LP-3512** | Warp-2 | - | Enhanced Warp messaging |
| **LP-3520** | Suite Overview | - | Precompile suite index |
| **LP-3550** | Verkle Proof | - | Verkle tree proofs |
| **LP-3651** | secp256r1 | - | P-256 curve support |
| **LP-3652** | secp256k1 | - | ECDSA precompile |
| **LP-3653** | BLS12-381 | - | BLS cryptography |
| **LP-3654** | Ed25519 | - | EdDSA signatures |
| **LP-3655** | SHA3/Keccak | - | Hash functions |
| **LP-3656** | BLAKE2/3 | - | BLAKE hash family |
| **LP-3657** | VRF | - | Verifiable random function |
| **LP-3658** | Poseidon | - | ZK-friendly hash |
| **LP-3659** | ChaCha20 | - | Symmetric encryption |
| **LP-3662** | HPKE | - | Hybrid public key encryption |
| **LP-3663** | ECIES | - | Elliptic curve encryption |
| **LP-3664** | Ring Signatures | - | Privacy signatures |
| **LP-3665** | KZG-4844 | - | Blob commitments |

---

### VM & Execution Standards

| LP | Standard | Description |
|----|----------|-------------|
| **LP-3600** | VM Environment | Virtual machine specification |
| **LP-3601** | VM SDK | VM development kit |
| **LP-3610** | AIVM | AI virtual machine |
| **LP-3620** | Rollup Plugin | C-Chain rollup architecture |
| **LP-3621** | Stage Sync | Sync pipeline for Coreth |
| **LP-3630** | RNG | Random number generation |
| **LP-3640** | Upgrade Mapping | C-Chain upgrade mapping |
| **LP-3641** | ChainVM Compat | ChainVM compatibility |
| **LP-3650** | Dynamic Gas | Dynamic gas pricing |
| **LP-3652** | Min Block Times | Dynamic minimum block times |
| **LP-3653** | Gas Limit | Dynamic EVM gas limits |
| **LP-3660** | State Migration | Network upgrade migration |
| **LP-3661** | BadgerDB Verkle | Database optimization |
| **LP-3670** | EOA Code | EOA account code |
| **LP-3671** | EL Requests | Execution layer requests |
| **LP-3672** | Max Balance | Max effective balance |
| **LP-3673** | Calldata Cost | Calldata cost increase |
| **LP-3674** | Blob Throughput | Blob throughput increase |
| **LP-3680** | CLZ Opcode | Count leading zeros |

---

### State Management Standards

| LP | Standard | Description |
|----|----------|-------------|
| **LP-3700** | State Sync | State sync and pruning |
| **LP-3701** | Verkle Trees | Verkle state management |
| **LP-3702** | Verkle Transition | Verkle state transition |
| **LP-3703** | Stateless Gas | Statelessness gas costs |
| **LP-3704** | Block Hashes | Historical block hashes |

---

## Related LPs (Cross-References)

| LP | Title |
|----|-------|
| LP-6016 | Teleport Cross-Chain Protocol |
| LP-6332 | Teleport Bridge Architecture |
| LP-7325 | KMS Hardware Security Module Integration |
| LP-9000 | DEX Core Specification |
| LP-9011 | Oracle Precompile |
| LP-9100 | QuantumSwap DEX Standard |

---

## Historical Notes

### Chain ID History

- **Original Chain ID**: 7777 (Lux mainnet launch)
- **2024 Reboot**: Changed to 96369 due to EIP overlap
- **Historical Data**: Preserved at [github.com/luxfi/state](https://github.com/luxfi/state)

### State Repository

The `~/work/lux/state` repository contains:
- Genesis configurations for all networks
- Historical block data exports
- Database configs (PebbleDB format)
- Migration scripts and tools

---

## Appendix: Full Submodule Commit Hashes

```
782f5191 lib/aave-v3 (v1.19.4-1)
b36a1ed5 lib/account-abstraction (v0.9.0)
8915ef7b lib/alchemix-v2 (heads/master)
dcbf852b lib/base64 (v1.1.0)
67887b84 lib/chainlink-contracts (1.3.0-8)
196f1ecc lib/clones-with-immutable-args (heads/master)
a3214f67 lib/compound (v2.6-rc3-45)
3f999523 lib/forge-std (heads/master)
fe55c4ba lib/gmx-contracts (GlpManager-v2-676)
3b9e1399 lib/gmx-synthetics (v2.2-533)
ab9b0834 lib/layerzero-v2 (anchor-v0.31.1-3)
8e3ade55 lib/manifoldxyz (heads/main)
69c8def5 lib/openzeppelin-contracts (v4.8.0-743)
fa525310 lib/openzeppelin-contracts-upgradeable (v5.1.0)
130e0b93 lib/prb-math (v4.1.0-23)
88629b3d lib/safe-modules (allowance/v0.1.1-12)
02276647 lib/safe-smart-account (v1.1.0-751)
89365b88 lib/solmate (v6-207)
c01640b0 lib/uniswap-lib (heads/master)
ee547b17 lib/v2-core (heads/master)
d8b1c635 lib/v3-core (heads/main)
06823871 lib/v3-periphery (heads/main)
```sql

---

**Document Maintainer**: Lux Industries
**Last Updated**: 2025-12-25
```
