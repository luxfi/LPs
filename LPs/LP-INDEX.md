# Lux Improvement Proposals (LPs) Index

> **Quick Navigation**: Jump to any category using the links below, or search by tag.

## Table of Contents

- [Chain Architecture](#chain-architecture)
- [Post-Quantum Cryptography](#post-quantum-cryptography-pqc)
- [Threshold Cryptography & MPC](#threshold-cryptography--mpc)
- [Cross-Chain & Warp Messaging](#cross-chain--warp-messaging)
- [Bridge Infrastructure](#bridge-infrastructure)
- [Consensus Protocols](#consensus-protocols)
- [EVM & Smart Contracts](#evm--smart-contracts)
- [Token Standards (LRC)](#token-standards-lrc)
- [**LP-9000: DEX Series (X-Chain)**](#lp-9000-dex-series-x-chain) ⚡ **OVER 9000!**
- [DeFi & Privacy](#defi--privacy)
- [AI & Compute](#ai--compute)
- [Layer 2 & Scaling](#layer-2--scaling)
- [Developer Tools & SDKs](#developer-tools--sdks)
- [Research & Meta](#research--meta)
- [Tag Reference](#tag-reference)

---

## Chain Architecture

The Lux Network consists of specialized chains, each optimized for specific functionality:

| Chain | Name | Purpose | Key LPs |
|-------|------|---------|---------|
| **A-Chain** | Attestation | TEE attestation & AI compute verification | [LP-0080](/docs/lp-0080-a-chain-attestation-chain-specification/) |
| **B-Chain** | Bridge | Cross-chain asset transfers (MPC-based) | [LP-0081](/docs/lp-0081-b-chain-bridge-chain-specification/), [LP-0331](/docs/lp-0331-b-chain-bridgevm-specification/) |
| **C-Chain** | Contract | EVM-compatible smart contracts | [LP-0012](/docs/lp-0012-c-chain-contract-chain-specification/), [LP-0026](/docs/lp-0026-c-chain-evm-equivalence-and-core-eips-adoption/) |
| **G-Chain** | Graph | Universal query & indexing layer | [LP-0098](/docs/lp-0098-luxfi-graphdb-and-graphql-engine-integration/), [LP-0101](/docs/lp-0101-solidity-graphql-extension-for-native-g-chain-integration/) |
| **K-Chain** | Key Mgmt | Key management services | [LP-0336](/docs/lp-0336-k-chain-keymanagementvm-specification/) |
| **T-Chain** | MPC/Multisig | Threshold crypto & custody | [LP-0013](/docs/lp-0013-t-chain-decentralised-mpc-custody-and-swap-signature-layer/), [LP-0337](/docs/lp-0337-t-chain-multisigvm-specification/) |
| **Q-Chain** | Quantum | Post-quantum secure consensus | [LP-0099](/docs/lp-0099-q-chain-quantum-secure-consensus-protocol-family-quasar/), [LP-0303](/docs/lp-0303-lux-q-security-post-quantum-p-chain-integration/) |
| **T-Chain** | Threshold | MPC-as-a-service (ThresholdVM) | [LP-0330](/docs/lp-0330-t-chain-thresholdvm-specification/) |
| **X-Chain** | Exchange | High-performance trading | [LP-0011](/docs/lp-0011-x-chain-exchange-chain-specification/), [LP-0036](/docs/lp-0036-x-chain-order-book-dex-api-and-rpc-addendum/) |
| **Z-Chain** | Zero-Knowledge | Privacy & encrypted execution | [LP-0045](/docs/lp-0045-z-chain-encrypted-execution-layer-interface/), [LP-0302](/docs/lp-0302-lux-z-a-chain-privacy-ai-attestation-layer/) |

### Core Architecture LPs

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0000](/docs/lp-0000-network-architecture-and-community-framework/) | Network Architecture & Community Framework | `core`, `architecture` | Final |
| [LP-0001](/docs/lp-0001-primary-chain-native-tokens-and-tokenomics/) | Primary Chain, Native Tokens, and Tokenomics | `core`, `tokenomics` | Draft |
| [LP-0002](/docs/lp-0002-virtual-machine-and-execution-environment/) | Virtual Machine and Execution Environment | `core`, `vm` | Final |
| [LP-0003](/docs/lp-0003-subnet-architecture-and-cross-chain-interoperability/) | Subnet Architecture and Cross-Chain Interoperability | `core`, `subnets`, `cross-chain` | Final |
| [LP-0010](/docs/lp-0010-p-chain-platfort-chain-specification-deprecated/) | P-Chain (Platform Chain) Specification | `core`, `deprecated` | Deprecated |

---

## Post-Quantum Cryptography (PQC)

> **Tags**: `pqc`, `quantum-safe`, `lattice`, `hash-based`

LPs related to quantum-resistant cryptographic primitives.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0004](/docs/lp-0004-quantum-resistant-cryptography-integration-in-lux/) | Quantum-Resistant Cryptography Integration | `pqc`, `core` | Final |
| [LP-0005](/docs/lp-0005-quantum-safe-wallets-and-multisig-standard/) | Quantum-Safe Wallets and Multisig | `pqc`, `wallets`, `multisig` | Final |
| [LP-0100](/docs/lp-0100-nist-post-quantum-cryptography-integration-for-lux-network/) | NIST Post-Quantum Cryptography Integration | `pqc`, `nist`, `fips` | Draft |
| [LP-0105](/docs/lp-0105-lamport-one-time-signatures-ots-for-lux-safe/) | Lamport One-Time Signatures (OTS) | `pqc`, `hash-based`, `ots` | Draft |
| [LP-0200](/docs/lp-0200-post-quantum-cryptography-suite-for-lux-network/) | Post-Quantum Cryptography Suite | `pqc`, `suite` | Draft |
| [LP-0201](/docs/lp-0201-hybrid-classical-quantum-cryptography-transitions/) | Hybrid Classical-Quantum Cryptography | `pqc`, `hybrid`, `migration` | Draft |
| [LP-0202](/docs/lp-0202-cryptographic-agility-framework/) | Cryptographic Agility Framework | `pqc`, `agility` | Draft |
| [LP-0316](/docs/lp-0316-ml-dsa-post-quantum-digital-signatures/) | ML-DSA Post-Quantum Digital Signatures | `pqc`, `ml-dsa`, `fips-204` | Draft |
| [LP-0317](/docs/lp-0317-slh-dsa-stateless-hash-based-digital-signatures/) | SLH-DSA Stateless Hash-Based Signatures | `pqc`, `slh-dsa`, `fips-205` | Draft |
| [LP-0318](/docs/lp-0318-ml-kem-post-quantum-key-encapsulation/) | ML-KEM Post-Quantum Key Encapsulation | `pqc`, `ml-kem`, `fips-203`, `encryption` | Draft |
| [LP-0324](/docs/lp-0324-ringtail-threshold-signature-precompile/) | Ringtail Threshold Signature Precompile | `pqc`, `ringtail`, `threshold-crypto`, `precompile` | Draft |

---

## Threshold Cryptography & MPC

> **Tags**: `threshold-crypto`, `mpc`, `tss`, `dkg`

LPs for multi-party computation, threshold signatures, and distributed key generation.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0013](/docs/lp-0013-t-chain-decentralised-mpc-custody-and-swap-signature-layer/) | T-Chain Decentralised MPC Custody | `mpc`, `custody`, `t-chain` | Draft |
| [LP-0014](/docs/lp-0014-t-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa/) | CGG21 Threshold ECDSA | `threshold-crypto`, `cggmp21`, `ecdsa` | Draft |
| [LP-0103](/docs/lp-0103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing/) | MPC-LSS Dynamic Resharing | `mpc`, `lss`, `resharing` | Draft |
| [LP-0104](/docs/lp-0104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa/) | FROST Threshold EdDSA | `threshold-crypto`, `frost`, `eddsa` | Draft |
| [LP-0319](/docs/lp-0319-t-chain-decentralised-mpc-custody/) | T-Chain Decentralised MPC Custody (v2) | `mpc`, `custody`, `t-chain` | Draft |
| [LP-0321](/docs/lp-0321-frost-threshold-signature-precompile/) | FROST Precompile | `threshold-crypto`, `frost`, `precompile` | Draft |
| [LP-0322](/docs/lp-0322-cggmp21-threshold-ecdsa-precompile/) | CGGMP21 ECDSA Precompile | `threshold-crypto`, `cggmp21`, `precompile` | Draft |
| [LP-0323](/docs/lp-0323-lss-mpc-dynamic-resharing-extension/) | LSS MPC Dynamic Resharing | `mpc`, `lss`, `resharing` | Draft |
| [LP-0330](/docs/lp-0330-t-chain-thresholdvm-specification/) | T-Chain ThresholdVM Specification | `threshold-crypto`, `t-chain`, `vm` | Draft |
| [LP-0333](/docs/lp-0333-dynamic-signer-rotation-with-lss-protocol/) | Dynamic Signer Rotation (LP-333) | `threshold-crypto`, `lss`, `signer-rotation`, `bridge` | Final |
| [LP-0334](/docs/lp-0334-per-asset-threshold-key-management/) | Per-Asset Threshold Key Management | `threshold-crypto`, `keys`, `bridge` | Draft |

---

## Cross-Chain & Warp Messaging

> **Tags**: `cross-chain`, `warp`, `teleport`, `interoperability`

LPs for cross-chain communication and the Warp messaging protocol.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0016](/docs/lp-0016-teleport-cross-chain-protocol/) | Teleport Cross-Chain Protocol | `teleport`, `cross-chain` | Draft |
| [LP-0018](/docs/lp-0018-cross-chain-message-format/) | Cross-Chain Message Format | `cross-chain`, `messaging` | Draft |
| [LP-0021](/docs/lp-0021-teleport-protocol/) | Teleport Protocol | `teleport`, `cross-chain` | Draft |
| [LP-0022](/docs/lp-0022-warp-messaging-20-native-interchain-transfers/) | Warp Messaging 2.0 | `warp`, `cross-chain`, `transfers` | Draft |
| [LP-0092](/docs/lp-0092-cross-chain-messaging-research/) | Cross-Chain Messaging Research | `cross-chain`, `research` | Informational |
| [LP-0313](/docs/lp-0313-warp-messaging-precompile/) | Warp Messaging Precompile | `warp`, `precompile` | Draft |
| [LP-0315](/docs/lp-0315-enhanced-cross-chain-communication-protocol/) | Enhanced Cross-Chain Communication | `cross-chain`, `protocol` | Draft |
| [LP-0602](/docs/lp-0602-warp-cross-chain-messaging-protocol/) | Warp Cross-Chain Messaging Protocol | `warp`, `cross-chain`, `bls` | Draft |
| [LP-0603](/docs/lp-0603-warp-15-quantum-safe-cross-chain-messaging/) | **Warp 1.5 Quantum-Safe Messaging** | `warp`, `pqc`, `ringtail`, `ml-kem`, `teleport` | **Final** |

### Warp 1.5 Quick Reference

**LP-603** is the definitive spec for quantum-safe cross-chain messaging:
- **Signatures**: Ringtail (LWE-based threshold) replaces BLS
- **Encryption**: ML-KEM-768 + AES-256-GCM for private transfers
- **Protocol**: Teleport with 7 message types (Transfer, Swap, Lock, Unlock, Attest, Governance, Private)
- **Implementation**: `warp/v1.5.0` tag in [luxfi/node](https://github.com/luxfi/node)

---

## Bridge Infrastructure

> **Tags**: `bridge`, `teleport`, `mpc`, `security`

LPs for cross-chain bridging, including BridgeVM and security frameworks.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0015](/docs/lp-0015-mpc-bridge-protocol/) | MPC Bridge Protocol | `bridge`, `mpc` | Draft |
| [LP-0017](/docs/lp-0017-bridge-asset-registry/) | Bridge Asset Registry | `bridge`, `assets` | Draft |
| [LP-0019](/docs/lp-0019-bridge-security-framework/) | Bridge Security Framework | `bridge`, `security` | Draft |
| [LP-0072](/docs/lp-0072-bridged-asset-standard/) | Bridged Asset Standard | `bridge`, `assets`, `lrc` | Draft |
| [LP-0301](/docs/lp-0301-lux-b-chain-cross-chain-bridge-protocol/) | B-Chain Cross-Chain Bridge Protocol | `bridge`, `b-chain` | Draft |
| [LP-0329](/docs/lp-0329-teleport-bridge-system-index/) | Teleport Bridge System Index | `bridge`, `teleport`, `index` | Draft |
| [LP-0331](/docs/lp-0331-b-chain-bridgevm-specification/) | B-Chain BridgeVM Specification | `bridge`, `b-chain`, `vm` | Draft |
| [LP-0332](/docs/lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol/) | Teleport Bridge Architecture | `bridge`, `teleport`, `architecture` | Draft |
| [LP-0335](/docs/lp-0335-bridge-smart-contract-integration/) | Bridge Smart Contract Integration | `bridge`, `contracts` | Draft |
| [LP-0338](/docs/lp-0338-teleport-relayer-network-specification/) | Teleport Relayer Network | `bridge`, `teleport`, `relayer` | Draft |
| [LP-0339](/docs/lp-0339-bridge-security-emergency-procedures/) | Bridge Security Emergency Procedures | `bridge`, `security`, `emergency` | Draft |
| [LP-0340](/docs/lp-0340-unified-bridge-sdk-specification/) | Unified Bridge SDK | `bridge`, `sdk` | Draft |

---

## Consensus Protocols

> **Tags**: `consensus`, `quasar`, `photon`, `flare`

LPs for consensus mechanisms including the Quasar protocol family.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0024](/docs/lp-0024-parallel-validation-and-shared-mempool/) | Parallel Validation and Shared Mempool | `consensus`, `validation` | Draft |
| [LP-0099](/docs/lp-0099-q-chain-quantum-secure-consensus-protocol-family-quasar/) | Q-Chain Quasar Consensus | `consensus`, `quasar`, `pqc`, `q-chain` | Draft |
| [LP-0110](/docs/lp-0110-quasar-consensus-protocol/) | Quasar Consensus Protocol | `consensus`, `quasar` | Draft |
| [LP-0111](/docs/lp-0111-photon-consensus-selection/) | Photon Consensus Selection | `consensus`, `photon` | Draft |
| [LP-0112](/docs/lp-0112-flare-dag-finalization-protocol/) | Flare DAG Finalization | `consensus`, `flare`, `dag` | Draft |
| [LP-0118](/docs/lp-0118-subnetevm-compat/) | SubnetEVM Compatibility | `consensus`, `subnets`, `evm` | Draft |
| [LP-0181](/docs/lp-0181-epoching/) | Epoching | `consensus`, `epoching` | Draft |
| [LP-0226](/docs/lp-0226-dynamic-minimum-block-times-granite-upgrade/) | Dynamic Block Times (Granite) | `consensus`, `granite`, `timing` | Draft |

---

## EVM & Smart Contracts

> **Tags**: `evm`, `solidity`, `precompile`, `contracts`

LPs for EVM compatibility, precompiles, and smart contract standards.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0012](/docs/lp-0012-c-chain-contract-chain-specification/) | C-Chain Contract Chain Specification | `evm`, `c-chain` | Draft |
| [LP-0026](/docs/lp-0026-c-chain-evm-equivalence-and-core-eips-adoption/) | C-Chain EVM Equivalence | `evm`, `eip`, `c-chain` | Draft |
| [LP-0032](/docs/lp-0032-c-chain-rollup-plugin-architecture/) | C-Chain Rollup Plugin Architecture | `evm`, `rollup`, `plugin` | Draft |
| [LP-0033](/docs/lp-0033-p-chain-state-rollup-to-c-chain-evm/) | P-Chain State Rollup to C-Chain | `evm`, `rollup`, `state` | Draft |
| [LP-0034](/docs/lp-0034-p-chain-as-superchain-l2-op-stack-rollup-integration/) | P-Chain as Superchain L2 | `evm`, `l2`, `op-stack` | Draft |
| [LP-0073](/docs/lp-0073-batch-execution-standard-multicall/) | Batch Execution (Multicall) | `evm`, `multicall` | Draft |
| [LP-0074](/docs/lp-0074-create2-factory-standard/) | CREATE2 Factory Standard | `evm`, `create2` | Draft |
| [LP-0176](/docs/lp-0176-dynamic-gas-pricing/) | Dynamic Gas Pricing | `evm`, `gas`, `fees` | Draft |
| [LP-0204](/docs/lp-0204-secp256r1-curve-integration/) | secp256r1 Curve Integration | `evm`, `precompile`, `secp256r1` | Draft |
| [LP-0311](/docs/lp-0311-ml-dsa-signature-verification-precompile/) | ML-DSA Signature Precompile | `evm`, `precompile`, `pqc` | Draft |
| [LP-0312](/docs/lp-0312-slh-dsa-signature-verification-precompile/) | SLH-DSA Signature Precompile | `evm`, `precompile`, `pqc` | Draft |
| [LP-0314](/docs/lp-0314-fee-manager-precompile/) | Fee Manager Precompile | `evm`, `precompile`, `fees` | Draft |
| [LP-0320](/docs/lp-0320-dynamic-evm-gas-limit-and-price-discovery-updates/) | Dynamic EVM Gas Limit | `evm`, `gas` | Draft |

---

## Token Standards (LRC)

> **Tags**: `lrc`, `token`, `nft`, `fungible`

Lux Request for Comments (LRC) token standards, similar to ERC.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0020](/docs/lp-0020-lrc-20-fungible-token-standard/) | LRC-20 Fungible Token Standard | `lrc`, `lrc-20`, `fungible` | Final |
| [LP-0023](/docs/lp-0023-nft-staking-and-native-interchain-transfer/) | NFT Staking and Interchain Transfer | `lrc`, `nft`, `staking` | Draft |
| [LP-0027](/docs/lp-0027-lrc-token-standards-adoption/) | LRC Token Standards Adoption | `lrc`, `standards` | Draft |
| [LP-0028](/docs/lp-0028-lrc-20-burnable-token-extension/) | LRC-20 Burnable Extension | `lrc`, `lrc-20`, `burnable` | Draft |
| [LP-0029](/docs/lp-0029-lrc-20-mintable-token-extension/) | LRC-20 Mintable Extension | `lrc`, `lrc-20`, `mintable` | Draft |
| [LP-0030](/docs/lp-0030-lrc-20-bridgable-token-extension/) | LRC-20 Bridgable Extension | `lrc`, `lrc-20`, `bridge` | Draft |
| [LP-0031](/docs/lp-0031-lrc-721-burnable-token-extension/) | LRC-721 Burnable Extension | `lrc`, `lrc-721`, `nft`, `burnable` | Draft |
| [LP-0070](/docs/lp-0070-nft-staking-standard/) | NFT Staking Standard | `lrc`, `nft`, `staking` | Draft |
| [LP-0071](/docs/lp-0071-media-content-nft-standard/) | Media Content NFT Standard | `lrc`, `nft`, `media` | Draft |
| [LP-0721](/docs/lp-0721-lrc-721-non-fungible-token-standard/) | LRC-721 Non-Fungible Token Standard | `lrc`, `lrc-721`, `nft` | Final |
| [LP-1155](/docs/lp-1155-lrc-1155-multi-token-standard/) | LRC-1155 Multi-Token Standard | `lrc`, `lrc-1155`, `multi-token` | Final |

---

## LP-9000: DEX Series (X-Chain)

```text
  ██╗     ██████╗       █████╗  ██████╗  ██████╗  ██████╗
  ██║     ██╔══██╗     ██╔══██╗██╔═████╗██╔═████╗██╔═████╗
  ██║     ██████╔╝████╗╚██████║██║██╔██║██║██╔██║██║██╔██║
  ██║     ██╔═══╝ ╚═══╝ ╚═══██║████╔╝██║████╔╝██║████╔╝██║
  ███████╗██║           █████╔╝╚██████╔╝╚██████╔╝╚██████╔╝
  ╚══════╝╚═╝           ╚════╝  ╚═════╝  ╚═════╝  ╚═════╝
         🚀 IT'S OVER 9000! 🚀
```

> **Tags**: `dex`, `trading`, `orderbook`, `perpetuals`, `oracle`, `lp-9000-series`

The **LP-9000 Series** is Lux's comprehensive decentralized exchange infrastructure - delivering **over 9000x** faster performance than traditional DEXs through FPGA acceleration, DAG consensus, and native X-Chain integration.

**Master Document**: [LP-9000 DEX Overview](/docs/lp-9000-dex-overview/)
**Implementation**: [github.com/luxfi/dex](https://github.com/luxfi/dex)

### LP-9000 Series Index

| LP | Title | Supersedes | Tags | Status |
|----|-------|------------|------|--------|
| [LP-9000](/docs/lp-9000-dex-overview/) | **DEX Series Overview** | - | `dex`, `architecture`, `index` | Final |
| [LP-9001](/docs/lp-9001-x-chain-exchange-specification/) | X-Chain Exchange Specification | LP-0011 | `dex`, `core`, `orderbook` | Implemented |
| [LP-9002](/docs/lp-9002-dex-api-rpc-specification/) | DEX API & RPC Specification | LP-0036 | `dex`, `api`, `rpc` | Implemented |
| [LP-9003](/docs/lp-9003-high-performance-dex-protocol/) | High-Performance DEX (GPU/FPGA) | LP-0608 | `dex`, `fpga`, `performance` | Implemented |
| [LP-9004](/docs/lp-9004-perpetuals-derivatives-protocol/) | Perpetuals & Derivatives Protocol | LP-0609 | `dex`, `perpetuals`, `margin` | Implemented |
| [LP-9005](/docs/lp-9005-native-oracle-protocol/) | Native Oracle Protocol | LP-0610 | `dex`, `oracle`, `price-feed` | Implemented |

### Performance: Over 9000x Faster

| Metric | Traditional DEX | Lux DEX (LP-9000) | Improvement |
|--------|-----------------|-------------------|-------------|
| Order Matching | 100ms | 10µs | **10,000x** |
| Price Updates | 12s blocks | <50ms | **240x** |
| TPS (Orders) | 100 | 100,000+ | **1,000x** |
| Finality | 60s | 500ms | **120x** |
| Slippage (1M USD) | 2-5% | <0.1% | **50x** |

### DEX Feature Matrix

| Feature | LP | Source | Status |
|---------|----|---------| -------|
| **Spot Trading** | LP-9001, LP-9002 | `orderbook.go`, `orderbook_advanced.go` | ✅ |
| **Perpetual Futures** | LP-9004 | `perp_types.go`, `clearinghouse.go` | ✅ |
| **Margin Trading** | LP-9004 | `margin_trading.go` (up to 100x) | ✅ |
| **Liquidation Engine** | LP-9004 | `liquidation_engine.go` | ✅ |
| **Funding Rates** | LP-9004 | `funding.go` (8-hour intervals) | ✅ |
| **Vaults & Copy Trading** | LP-9004 | `vaults.go`, `vault_strategy.go` | ✅ |
| **Lending Pool** | LP-9004 | `lending_pool.go` | ✅ |
| **Risk Management** | LP-9004 | `risk_engine.go` | ✅ |
| **Price Oracles** | LP-9005 | `aggregator.go`, `pyth.go`, `chainlink.go` | ✅ |
| **FPGA Acceleration** | LP-9003 | `fpga_engine.go`, `amd_versal.go` | ✅ |
| **X-Chain Integration** | LP-9001 | `x_chain_integration.go` | ✅ |

### Legacy LP Mapping

> **Note**: The following LPs have been superseded by the LP-9000 series but remain for historical reference:

| Old LP | New LP | Title |
|--------|--------|-------|
| LP-0011 | **LP-9001** | X-Chain Exchange Specification |
| LP-0036 | **LP-9002** | DEX API & RPC |
| LP-0608 | **LP-9003** | High-Performance DEX |
| LP-0609 | **LP-9004** | Perpetuals & Derivatives |
| LP-0610 | **LP-9005** | Native Oracle |

---

## DeFi & Privacy

> **Tags**: `defi`, `amm`, `privacy`, `zk`

LPs for decentralized finance protocols and privacy features.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0037](/docs/lp-0037-native-swap-integration-on-t-chain-x-chain-and-z-chain/) | Native Swap Integration | `defi`, `swap` | Draft |
| [LP-0045](/docs/lp-0045-z-chain-encrypted-execution-layer-interface/) | Z-Chain Encrypted Execution Layer | `privacy`, `z-chain`, `encryption` | Draft |
| [LP-0060](/docs/lp-0060-defi-protocols-overview/) | DeFi Protocols Overview | `defi`, `overview` | Draft |
| [LP-0400](/docs/lp-0400-automated-market-maker-protocol-with-privacy/) | Private AMM Protocol | `defi`, `amm`, `privacy` | Draft |
| [LP-0401](/docs/lp-0401-confidential-lending-protocol/) | Confidential Lending Protocol | `defi`, `lending`, `privacy` | Draft |
| [LP-0402](/docs/lp-0402-zero-knowledge-swap-protocol/) | Zero-Knowledge Swap Protocol | `defi`, `swap`, `zk` | Draft |
| [LP-0403](/docs/lp-0403-private-staking-mechanisms/) | Private Staking Mechanisms | `defi`, `staking`, `privacy` | Draft |

---

## AI & Compute

> **Tags**: `ai`, `compute`, `attestation`, `tee`

LPs for AI integration, compute verification, and attestation.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0075](/docs/lp-0075-tee-integration-standard/) | TEE Integration Standard | `ai`, `tee`, `attestation` | Draft |
| [LP-0076](/docs/lp-0076-random-number-generation-standard/) | Random Number Generation | `ai`, `rng` | Draft |
| [LP-0080](/docs/lp-0080-a-chain-attestation-chain-specification/) | A-Chain Attestation Specification | `ai`, `a-chain`, `attestation` | Draft |
| [LP-0102](/docs/lp-0102-immutable-training-ledger-for-privacy-preserving-ai/) | Immutable Training Ledger | `ai`, `privacy`, `training` | Draft |
| [LP-0106](/docs/lp-0106-llm-gateway-integration-with-hanzo-ai/) | LLM Gateway Integration (Hanzo AI) | `ai`, `llm`, `hanzo` | Draft |
| [LP-0302](/docs/lp-0302-lux-z-a-chain-privacy-ai-attestation-layer/) | Z/A-Chain Privacy AI Attestation | `ai`, `privacy`, `attestation` | Draft |
| [LP-0601](/docs/lp-0601-dynamic-gas-fee-mechanism-with-ai-compute-pricing/) | AI Compute Pricing | `ai`, `gas`, `pricing` | Draft |
| [LP-0607](/docs/lp-0607-gpu-acceleration-framework/) | GPU Acceleration Framework | `ai`, `gpu`, `compute` | Draft |
| [LP-2000](/docs/lp-2000-ai-mining-standard/) | AI Mining Standard | `ai`, `mining` | Draft |
| [LP-2001](/docs/lp-2001-aivm-ai-virtual-machine/) | AIVM - AI Virtual Machine | `ai`, `vm` | Draft |

---

## Layer 2 & Scaling

> **Tags**: `l2`, `rollup`, `scaling`, `data-availability`

LPs for Layer 2 solutions and scaling.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0025](/docs/lp-0025-l2-to-sovereign-l1-ascension-and-fee-model/) | L2 to Sovereign L1 Ascension | `l2`, `l1`, `fees` | Draft |
| [LP-0035](/docs/lp-0035-stage-sync-pipeline-for-coreth-bootstrapping/) | Stage-Sync Pipeline for Coreth | `l2`, `sync`, `bootstrap` | Draft |
| [LP-0500](/docs/lp-0500-layer-2-rollup-framework/) | Layer 2 Rollup Framework | `l2`, `rollup` | Draft |
| [LP-0501](/docs/lp-0501-data-availability-layer/) | Data Availability Layer | `l2`, `data-availability` | Draft |
| [LP-0502](/docs/lp-0502-fraud-proof-system/) | Fraud Proof System | `l2`, `fraud-proof`, `optimistic` | Draft |
| [LP-0503](/docs/lp-0503-validity-proof-system/) | Validity Proof System | `l2`, `validity-proof`, `zk` | Draft |
| [LP-0504](/docs/lp-0504-sequencer-registry-protocol/) | Sequencer Registry Protocol | `l2`, `sequencer` | Draft |
| [LP-0505](/docs/lp-0505-l2-block-format-specification/) | L2 Block Format Specification | `l2`, `block-format` | Draft |
| [LP-0604](/docs/lp-0604-state-sync-and-pruning-protocol/) | State Sync and Pruning | `scaling`, `sync`, `pruning` | Draft |
| [LP-0605](/docs/lp-0605-elastic-validator-subnets/) | Elastic Validator Subnets | `scaling`, `subnets` | Draft |
| [LP-0606](/docs/lp-0606-verkle-trees-for-efficient-state-management/) | Verkle Trees for State Management | `scaling`, `verkle`, `state` | Draft |

---

## Developer Tools & SDKs

> **Tags**: `sdk`, `tools`, `api`, `cli`

LPs for developer tooling, SDKs, and APIs.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0006](/docs/lp-0006-network-runner-and-testing-framework/) | Network Runner & Testing Framework | `tools`, `testing` | Draft |
| [LP-0007](/docs/lp-0007-vm-sdk-specification/) | VM SDK Specification | `sdk`, `vm` | Draft |
| [LP-0008](/docs/lp-0008-plugin-architecture/) | Plugin Architecture | `tools`, `plugin` | Draft |
| [LP-0009](/docs/lp-0009-cli-tool-specification/) | CLI Tool Specification | `tools`, `cli` | Draft |
| [LP-0036](/docs/lp-0036-x-chain-order-book-dex-api-and-rpc-addendum/) | X-Chain Order Book DEX API | `api`, `dex`, `x-chain` | Draft |
| [LP-0039](/docs/lp-0039-lx-python-sdk-corollary-for-on-chain-actions/) | LX Python SDK | `sdk`, `python` | Informational |
| [LP-0040](/docs/lp-0040-wallet-standards/) | Wallet Standards | `tools`, `wallet` | Draft |
| [LP-0042](/docs/lp-0042-multi-signature-wallet-standard/) | Multi-Signature Wallet Standard | `tools`, `wallet`, `multisig` | Draft |
| [LP-0050](/docs/lp-0050-developer-tools-overview/) | Developer Tools Overview | `tools`, `overview` | Draft |
| [LP-0325](/docs/lp-0325-kms-hardware-security-module-integration/) | KMS/HSM Integration | `tools`, `security`, `hsm` | Draft |
| [LP-0326](/docs/lp-0326-blockchain-network upgrade-and-state-migration/) | Blockchain Regenesis and Migration | `tools`, `migration` | Draft |
| [LP-0327](/docs/lp-0327-badgerdb-verkle-optimization/) | BadgerDB Verkle Optimization | `tools`, `database`, `verkle` | Draft |
| [LP-0341](/docs/lp-0341-decentralized-secrets-management-infisical-integration/) | Decentralized Secrets Management | `tools`, `secrets`, `security` | Draft |

---

## Research & Meta

> **Tags**: `research`, `meta`, `informational`

Research papers, informational documents, and meta LPs.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0085](/docs/lp-0085-security-audit-framework/) | Security Audit Framework | `meta`, `security` | Draft |
| [LP-0090](/docs/lp-0090-research-papers-index/) | Research Papers Index | `research`, `index` | Draft |
| [LP-0091](/docs/lp-0091-payment-processing-research/) | Payment Processing Research | `research`, `payments` | Informational |
| [LP-0093](/docs/lp-0093-decentralized-identity-research/) | Decentralized Identity Research | `research`, `identity` | Informational |
| [LP-0094](/docs/lp-0094-governance-framework-research/) | Governance Framework Research | `research`, `governance` | Informational |
| [LP-0095](/docs/lp-0095-stablecoin-mechanisms-research/) | Stablecoin Mechanisms Research | `research`, `stablecoin` | Informational |
| [LP-0096](/docs/lp-0096-mev-protection-research/) | MEV Protection Research | `research`, `mev` | Informational |
| [LP-0097](/docs/lp-0097-data-availability-research/) | Data Availability Research | `research`, `data-availability` | Informational |

---

## Tag Reference

Quick links to find LPs by tag:

### Cryptography
| Tag | Description | Count |
|-----|-------------|-------|
| `pqc` | Post-quantum cryptography | 11 |
| `threshold-crypto` | Threshold signatures/MPC | 11 |
| `mpc` | Multi-party computation | 8 |
| `encryption` | Encryption schemes | 3 |
| `hash-based` | Hash-based signatures | 2 |

### Protocols
| Tag | Description | Count |
|-----|-------------|-------|
| `warp` | Warp messaging protocol | 5 |
| `teleport` | Teleport cross-chain protocol | 7 |
| `bridge` | Bridge infrastructure | 12 |
| `cross-chain` | Cross-chain interoperability | 9 |
| `consensus` | Consensus mechanisms | 8 |

### Chains
| Tag | Description | Count |
|-----|-------------|-------|
| `c-chain` | Contract chain (EVM) | 5 |
| `b-chain` | Bridge chain | 4 |
| `t-chain` | Threshold chain | 2 |
| `t-chain` | MPC chain | 3 |
| `q-chain` | Quantum chain | 2 |
| `x-chain` | Exchange chain (DEX) | 8 |
| `z-chain` | Zero-knowledge chain | 3 |

### Development
| Tag | Description | Count |
|-----|-------------|-------|
| `evm` | EVM compatibility | 13 |
| `precompile` | EVM precompiles | 8 |
| `sdk` | Software development kits | 4 |
| `tools` | Developer tools | 10 |
| `lrc` | Token standards | 11 |

### Scaling & L2
| Tag | Description | Count |
|-----|-------------|-------|
| `l2` | Layer 2 solutions | 8 |
| `rollup` | Rollup technology | 4 |
| `scaling` | Scaling solutions | 4 |

### DEX & Trading (LP-9000 Series) ⚡
| Tag | Description | Count |
|-----|-------------|-------|
| `dex` | DEX infrastructure | 6 |
| `trading` | Trading protocols | 6 |
| `orderbook` | Order book systems | 2 |
| `perpetuals` | Perpetual futures | 1 |
| `margin` | Margin trading | 1 |
| `oracle` | Price oracles | 2 |
| `lp-9000-series` | LP-9000 DEX series | 6 |

### AI & Privacy
| Tag | Description | Count |
|-----|-------------|-------|
| `ai` | AI/ML integration | 10 |
| `privacy` | Privacy features | 6 |
| `zk` | Zero-knowledge proofs | 3 |

---

## Contributing

To add a new LP:

1. Copy `TEMPLATE.md` to `lp-XXXX-title.md` (use 4-digit numbering)
2. Add appropriate tags in frontmatter
3. Update this index
4. Submit PR

### LP Numbering Conventions

| Range | Category |
|-------|----------|
| 0000-0099 | Core Protocol |
| 0100-0199 | Research & Cryptography |
| 0200-0299 | Post-Quantum Crypto |
| 0300-0399 | Chain Specs & Precompiles |
| 0400-0499 | DeFi & Privacy |
| 0500-0599 | Layer 2 & Scaling |
| 0600-0699 | Networking & Performance |
| 0700-0999 | Token Standards (LRC) |
| 2000-2999 | AI & Compute |
| **9000-9099** | **DEX & Trading (X-Chain)** ⚡ |

---

*Last Updated: 2025-12-11*
