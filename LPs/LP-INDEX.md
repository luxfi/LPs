# Lux Improvement Proposals (LPs) Index

> **Quick Navigation**: Jump to any category using the links below, or search by tag.

## Table of Contents

- [Chain Architecture](#chain-architecture)
- [Consensus Protocols](#consensus-protocols)
- [Platform Chains (1xxx)](#platform-chains-1xxx)
- [Cryptography & Token Standards (2xxx)](#cryptography--token-standards-2xxx)
- [Token Standards (LRC)](#token-standards-lrc)
- [AI & Attestation (4xxx-5xxx)](#ai--attestation-4xxx-5xxx)
- [Bridge Infrastructure (6xxx)](#bridge-infrastructure-6xxx)
- [Threshold Cryptography & MPC (7xxx)](#threshold-cryptography--mpc-7xxx)
- [Privacy & Zero-Knowledge (8xxx)](#privacy--zero-knowledge-8xxx)
- [LP-9000: DEX Series (X-Chain)](#lp-9000-dex-series-x-chain)
- [Research (10xxx)](#research-10xxx)
- [Institutional (70xxx-72xxx)](#institutional-70xxx-72xxx)
- [Developer Tools & SDKs](#developer-tools--sdks)
- [ESG & Impact (0750-0930)](#esg--impact-0750-0930)
- [Learning Paths](#learning-paths)
- [Tag Reference](#tag-reference)

---

## Chain Architecture

The Lux Network consists of specialized chains, each optimized for specific functionality:

| Chain | Name | Purpose | Key LPs |
|-------|------|---------|---------|
| **P-Chain** | Platform | Validators, staking, registry | [LP-1000](/docs/lp-1000-p-chain-core-platform-specification/), [LP-1010](/docs/lp-1010-p-chain-platform-chain-specification/) |
| **C-Chain** | Contract | EVM-compatible smart contracts | [LP-2000](/docs/lp-2000-c-chain-evm-specification/), [LP-2012](/docs/lp-2012-c-chain-contract-chain-specification/) |
| **X-Chain** | Exchange | High-performance trading | [LP-3000](/docs/lp-3000-x-chain-exchange-specification/), [LP-9000](/docs/lp-9000-dex-core-specification/) |
| **Q-Chain** | Quantum | Post-quantum secure consensus | [LP-4000](/docs/lp-4000-q-chain-quantum-specification/), [LP-4099](/docs/lp-4099-q-chain-quantum-secure-consensus-protocol-family-quasar/) |
| **A-Chain** | Attestation | TEE attestation & AI compute | [LP-5000](/docs/lp-5000-a-chain-ai-attestation-specification/), [LP-5080](/docs/lp-5080-a-chain-attestation-chain-specification/) |
| **B-Chain** | Bridge | Cross-chain asset transfers | [LP-6000](/docs/lp-6000-b-chain-bridge-specification/), [LP-6081](/docs/lp-6081-b-chain-bridge-chain-specification/) |
| **T-Chain** | Threshold | MPC networks, threshold signing | [LP-7000](/docs/lp-7000-t-chain-threshold-specification/), [LP-7083](/docs/lp-7083-t-chain-threshold-signature-chain-specification/) |
| **Z-Chain** | Zero-Knowledge | Privacy & encrypted execution | [LP-8000](/docs/lp-8000-z-chain-zkvm-specification/), [LP-8045](/docs/lp-8045-z-chain-encrypted-execution-layer-interface/) |

### Core Architecture LPs

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0000](/docs/lp-0000-network-architecture-and-community-framework/) | Network Architecture & Community Framework | `core`, `architecture` | Final |
| [LP-0001](/docs/lp-0001-primary-chain-native-tokens-and-tokenomics/) | Primary Chain, Native Tokens, and Tokenomics | `core`, `tokenomics` | Draft |
| [LP-0002](/docs/lp-0002-virtual-machine-and-execution-environment/) | Virtual Machine and Execution Environment | `core`, `vm` | Final |
| [LP-0003](/docs/lp-0003-chain-architecture-and-cross-chain-interoperability/) | recursive network architecture and Cross-Chain Interoperability | `core`, `chains`, `cross-chain` | Final |
| [LP-0004](/docs/lp-0004-supply-chain-control-and-fork-philosophy/) | Supply Chain Control and Fork Philosophy | `core`, `governance` | Final |
| [LP-0099](/docs/lp-0099-lp-numbering-scheme-and-chain-organization/) | LP Numbering Scheme and Chain Organization (v3.3) | `meta`, `governance` | Final |

---

## Consensus Protocols

> **Tags**: `consensus`, `quasar`, `photon`, `flare`, `wave`, `focus`, `horizon`, `prism`

LPs for consensus mechanisms including the Quasar protocol family.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0110](/docs/lp-0110-quasar-consensus/) | Quasar Consensus Protocol | `consensus`, `quasar` | Draft |
| [LP-0111](/docs/lp-0111-photon-selection/) | Photon Consensus Selection | `consensus`, `photon` | Draft |
| [LP-0112](/docs/lp-0112-flare-finalization/) | Flare DAG Finalization | `consensus`, `flare`, `dag` | Draft |
| [LP-0113](/docs/lp-0113-wave-voting/) | Wave Voting Protocol | `consensus`, `wave` | Draft |
| [LP-0114](/docs/lp-0114-focus-confidence/) | Focus Confidence Accumulation | `consensus`, `focus` | Draft |
| [LP-0115](/docs/lp-0115-horizon-finality/) | Horizon Finality Protocol | `consensus`, `horizon` | Draft |
| [LP-0116](/docs/lp-0116-prism-geometry/) | Prism Geometry Protocol | `consensus`, `prism` | Draft |
| [LP-1024](/docs/lp-1024-parallel-validation-and-shared-mempool/) | Parallel Validation and Shared Mempool | `consensus`, `validation` | Draft |
| [LP-1181](/docs/lp-1181-epoching/) | P-Chain Epoched Views | `consensus`, `epoching`, `granite` | Draft |
| [LP-2118](/docs/lp-2118-chainevm-compat/) | chainEVM Compatibility | `consensus`, `chains`, `evm` | Draft |
| [LP-2226](/docs/lp-2226-dynamic-minimum-block-times-granite-upgrade/) | Dynamic Block Times (Granite) | `consensus`, `granite`, `timing` | Draft |

---

## Platform Chains (1xxx)

> **Tags**: `p-chain`, `platform`, `validators`, `staking`

LPs for P-Chain platform infrastructure.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-1000](/docs/lp-1000-p-chain-core-platform-specification/) | P-Chain Core Platform Specification | `p-chain`, `core` | Draft |
| [LP-1010](/docs/lp-1010-p-chain-platform-chain-specification/) | P-Chain Platform Chain Specification | `p-chain`, `platform` | Draft |
| [LP-1024](/docs/lp-1024-parallel-validation-and-shared-mempool/) | Parallel Validation and Shared Mempool | `p-chain`, `validation` | Draft |
| [LP-1033](/docs/lp-1033-p-chain-state-rollup-to-c-chain-evm/) | P-Chain State Rollup to C-Chain EVM | `p-chain`, `rollup` | Draft |
| [LP-1034](/docs/lp-1034-p-chain-as-superchain-l2-op-stack-rollup-integration/) | P-Chain as Superchain L2 (OP Stack) | `p-chain`, `l2`, `op-stack` | Draft |
| [LP-1181](/docs/lp-1181-epoching/) | P-Chain Epoched Views (LP-181) | `p-chain`, `epoching` | Draft |
| [LP-1605](/docs/lp-1605-elastic-validator-chains/) | Elastic Validator chains | `p-chain`, `chains`, `validators` | Draft |

---

## Cryptography & Token Standards (2xxx)

> **Tags**: `crypto`, `evm`, `precompile`, `gas`

LPs for cryptographic primitives and EVM infrastructure.

### C-Chain & EVM

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-2000](/docs/lp-2000-c-chain-evm-specification/) | C-Chain EVM Specification | `evm`, `c-chain` | Draft |
| [LP-2001](/docs/lp-2001-aivm-ai-virtual-machine/) | AIVM - AI Virtual Machine | `ai`, `vm` | Draft |
| [LP-2012](/docs/lp-2012-c-chain-contract-chain-specification/) | C-Chain Contract Chain Specification | `evm`, `c-chain` | Draft |
| [LP-2025](/docs/lp-2025-l2-to-sovereign-l1-ascension-and-fee-model/) | L2 to Sovereign L1 Ascension | `l2`, `l1`, `fees` | Draft |
| [LP-2026](/docs/lp-2026-c-chain-evm-equivalence-and-core-eips-adoption/) | C-Chain EVM Equivalence | `evm`, `eip`, `c-chain` | Draft |
| [LP-2032](/docs/lp-2032-c-chain-rollup-plugin-architecture/) | C-Chain Rollup Plugin Architecture | `evm`, `rollup`, `plugin` | Draft |
| [LP-2035](/docs/lp-2035-stage-sync-pipeline-for-coreth-bootstrapping/) | Stage-Sync Pipeline for Coreth | `evm`, `sync`, `bootstrap` | Draft |
| [LP-2076](/docs/lp-2076-random-number-generation-standard/) | Random Number Generation Standard | `evm`, `rng` | Draft |
| [LP-2099](/docs/lp-2099-cchain-upgrade-mapping/) | C-Chain Upgrade Mapping | `evm`, `upgrades` | Draft |

### Gas & Fees

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-2176](/docs/lp-2176-dynamic-gas-pricing/) | Dynamic Gas Pricing (LP-176) | `evm`, `gas`, `fees`, `granite` | Draft |
| [LP-2320](/docs/lp-2320-dynamic-evm-gas-limit-and-price-discovery-updates/) | Dynamic EVM Gas Limit | `evm`, `gas` | Draft |

### Precompiles

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-2204](/docs/lp-2204-secp256r1-curve-integration/) | secp256r1 Curve Integration (LP-204) | `evm`, `precompile`, `secp256r1`, `granite` | Draft |
| [LP-2311](/docs/lp-2311-ml-dsa-signature-verification-precompile/) | ML-DSA Signature Precompile | `evm`, `precompile`, `pqc` | Draft |
| [LP-2312](/docs/lp-2312-slh-dsa-signature-verification-precompile/) | SLH-DSA Signature Precompile | `evm`, `precompile`, `pqc` | Draft |
| [LP-2313](/docs/lp-2313-warp-messaging-precompile/) | Warp Messaging Precompile | `warp`, `precompile` | Draft |
| [LP-2314](/docs/lp-2314-fee-manager-precompile/) | Fee Manager Precompile | `evm`, `precompile`, `fees` | Draft |
| [LP-2514](/docs/lp-2514-mldsa-post-quantum-signature-precompile/) | ML-DSA Post-Quantum Signature Precompile | `pqc`, `precompile` | Draft |
| [LP-2515](/docs/lp-2515-warp-cross-chain-messaging-precompile/) | Warp Cross-Chain Messaging Precompile | `warp`, `precompile` | Draft |
| [LP-2516](/docs/lp-2516-quasar-quantum-consensus-precompile/) | Quasar Quantum Consensus Precompile | `quasar`, `precompile` | Draft |
| [LP-2517](/docs/lp-2517-precompile-suite-overview/) | Precompile Suite Overview | `precompile`, `overview` | Draft |

### State & Storage

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-2326](/docs/lp-2326-network-upgrade-and-state-migration/) | Network Upgrade and State Migration | `evm`, `migration` | Draft |
| [LP-2327](/docs/lp-2327-badgerdb-verkle-optimization/) | BadgerDB Verkle Optimization | `database`, `verkle` | Draft |
| [LP-2604](/docs/lp-2604-state-sync-and-pruning-protocol/) | State Sync and Pruning Protocol | `state`, `sync`, `pruning` | Draft |
| [LP-2606](/docs/lp-2606-verkle-trees-for-efficient-state-management/) | Verkle Trees for Efficient State Management | `verkle`, `state`, `proofs` | Draft |

---

## Token Standards (LRC)

> **Tags**: `lrc`, `token`, `nft`, `fungible`

Lux Request for Comments (LRC) token standards, similar to ERC.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-2300](/docs/lp-2300-lrc-20-fungible-token-standard/) | **LRC-20 Fungible Token Standard** | `lrc`, `lrc-20`, `fungible` | Final |
| [LP-2721](/docs/lp-2721-lrc-721-non-fungible-token-standard/) | **LRC-721 Non-Fungible Token Standard** | `lrc`, `lrc-721`, `nft` | Final |
| [LP-2155](/docs/lp-2155-lrc-1155-multi-token-standard/) | **LRC-1155 Multi-Token Standard** | `lrc`, `lrc-1155`, `multi-token` | Final |
| [LP-2027](/docs/lp-2027-lrc-token-standards-adoption/) | LRC Token Standards Adoption | `lrc`, `standards` | Draft |
| [LP-2028](/docs/lp-2028-lrc-20-burnable-token-extension/) | LRC-20 Burnable Extension | `lrc`, `lrc-20`, `burnable` | Draft |
| [LP-2029](/docs/lp-2029-lrc-20-mintable-token-extension/) | LRC-20 Mintable Extension | `lrc`, `lrc-20`, `mintable` | Draft |
| [LP-2030](/docs/lp-2030-lrc-20-bridgable-token-extension/) | LRC-20 Bridgable Extension | `lrc`, `lrc-20`, `bridge` | Draft |
| [LP-2031](/docs/lp-2031-lrc-721-burnable-token-extension/) | LRC-721 Burnable Extension | `lrc`, `lrc-721`, `nft`, `burnable` | Draft |
| [LP-2518](/docs/lp-2518-teleport-token-standard/) | Teleport Token Standard | `lrc`, `teleport`, `cross-chain` | Draft |

### DeFi Protocol Standards (2500-2509)

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-2500](/docs/lp-2500-quantumswap-dex-standard/) | QuantumSwap DEX Standard | `defi`, `dex` | Draft |
| [LP-2501](/docs/lp-2501-defi-protocol-integration-standard/) | DeFi Protocol Integration Standard | `defi`, `integration` | Draft |
| [LP-2502](/docs/lp-2502-nft-marketplace-standard/) | NFT Marketplace Standard | `nft`, `marketplace` | Draft |
| [LP-2503](/docs/lp-2503-account-abstraction-standard/) | Account Abstraction Standard | `erc-4337`, `smart-accounts` | Draft |
| [LP-2504](/docs/lp-2504-safe-multisig-standard/) | Safe Multisig Standard | `multisig`, `safe` | Draft |
| [LP-2506](/docs/lp-2506-lamport-signatures-standard/) | Lamport Signatures Standard | `pqc`, `lamport` | Draft |
| [LP-2507](/docs/lp-2507-cross-chain-bridge-standard/) | Cross-Chain Bridge Standard | `bridge`, `cross-chain` | Draft |
| [LP-2508](/docs/lp-2508-alchemix-self-repaying-loans-standard/) | Alchemix Self-Repaying Loans | `defi`, `lending` | Draft |
| [LP-2509](/docs/lp-2509-compound-lending-protocol-standard/) | Compound Lending Protocol | `defi`, `lending` | Draft |
| [LP-2510](/docs/lp-2510-teleport-protocol-standard/) | Teleport Protocol Standard | `bridge`, `teleport` | Final |

---

## Post-Quantum Cryptography (4xxx)

> **Tags**: `pqc`, `quantum-safe`, `lattice`, `hash-based`

LPs related to quantum-resistant cryptographic primitives.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-4000](/docs/lp-4000-q-chain-quantum-specification/) | Q-Chain Quantum Specification | `pqc`, `q-chain` | Draft |
| [LP-4004](/docs/lp-4004-quantum-resistant-cryptography-integration-in-lux/) | Quantum-Resistant Cryptography Integration | `pqc`, `core` | Final |
| [LP-4005](/docs/lp-4005-quantum-safe-wallets-and-multisig-standard/) | Quantum-Safe Wallets and Multisig | `pqc`, `wallets`, `multisig` | Final |
| [LP-4082](/docs/lp-4082-q-chain-quantum-resistant-chain-specification/) | Q-Chain Quantum-Resistant Chain Specification | `pqc`, `q-chain` | Draft |
| [LP-4099](/docs/lp-4099-q-chain-quantum-secure-consensus-protocol-family-quasar/) | Q-Chain Quasar Consensus | `consensus`, `quasar`, `pqc` | Draft |
| [LP-4100](/docs/lp-4100-nist-post-quantum-cryptography-integration-for-lux-network/) | NIST Post-Quantum Cryptography Integration | `pqc`, `nist`, `fips` | Draft |
| [LP-4105](/docs/lp-4105-lamport-one-time-signatures-ots-for-lux-safe/) | Lamport One-Time Signatures (OTS) | `pqc`, `hash-based`, `ots` | Draft |
| [LP-4110](/docs/lp-4110-quasar-consensus-protocol/) | Quasar Consensus Protocol | `pqc`, `quasar` | Draft |
| [LP-4200](/docs/lp-4200-post-quantum-cryptography-suite-for-lux-network/) | Post-Quantum Cryptography Suite | `pqc`, `suite` | Draft |
| [LP-4201](/docs/lp-4201-hybrid-classical-quantum-cryptography-transitions/) | Hybrid Classical-Quantum Cryptography | `pqc`, `hybrid`, `migration` | Draft |
| [LP-4202](/docs/lp-4202-cryptographic-agility-framework/) | Cryptographic Agility Framework | `pqc`, `agility` | Draft |
| [LP-4303](/docs/lp-4303-lux-q-security-post-quantum-p-chain-integration/) | Lux-Q Security: Post-Quantum P-Chain | `pqc`, `p-chain` | Draft |
| [LP-4316](/docs/lp-4316-ml-dsa-post-quantum-digital-signatures/) | ML-DSA Post-Quantum Digital Signatures | `pqc`, `ml-dsa`, `fips-204` | Draft |
| [LP-4317](/docs/lp-4317-slh-dsa-stateless-hash-based-digital-signatures/) | SLH-DSA Stateless Hash-Based Signatures | `pqc`, `slh-dsa`, `fips-205` | Draft |
| [LP-4318](/docs/lp-4318-ml-kem-post-quantum-key-encapsulation/) | ML-KEM Post-Quantum Key Encapsulation | `pqc`, `ml-kem`, `fips-203` | Draft |

---

## AI & Attestation (4xxx-5xxx)

> **Tags**: `ai`, `compute`, `attestation`, `tee`

LPs for AI integration, compute verification, and attestation.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-5000](/docs/lp-5000-a-chain-ai-attestation-specification/) | A-Chain AI Attestation Specification | `ai`, `a-chain`, `attestation` | Draft |
| [LP-5075](/docs/lp-5075-tee-integration-standard/) | TEE Integration Standard | `ai`, `tee`, `attestation` | Draft |
| [LP-5080](/docs/lp-5080-a-chain-attestation-chain-specification/) | A-Chain Attestation Chain Specification | `ai`, `a-chain` | Draft |
| [LP-5101](/docs/lp-5101-solidity-graphql-extension-for-native-g-chain-integration/) | Solidity GraphQL Extension | `ai`, `graphql` | Draft |
| [LP-5102](/docs/lp-5102-immutable-training-ledger-for-privacy-preserving-ai/) | Immutable Training Ledger | `ai`, `privacy`, `training` | Draft |
| [LP-5106](/docs/lp-5106-llm-gateway-integration-with-hanzo-ai/) | LLM Gateway Integration (Hanzo AI) | `ai`, `llm`, `hanzo` | Draft |
| [LP-5200](/docs/lp-5200-ai-mining-standard/) | AI Mining Standard | `ai`, `mining` | Draft |
| [LP-5302](/docs/lp-5302-lux-z-a-chain-privacy-ai-attestation-layer/) | Z/A-Chain Privacy AI Attestation | `ai`, `privacy`, `attestation` | Draft |
| [LP-5601](/docs/lp-5601-dynamic-gas-fee-mechanism-with-ai-compute-pricing/) | AI Compute Pricing | `ai`, `gas`, `pricing` | Draft |
| [LP-5607](/docs/lp-5607-gpu-acceleration-framework/) | GPU Acceleration Framework | `ai`, `gpu`, `compute` | Draft |
| [LP-5610](/docs/lp-5610-ai-confidential-compute-tiers/) | AI Confidential Compute Tiers | `ai`, `tee`, `compute` | Draft |

---

## Bridge Infrastructure (6xxx)

> **Tags**: `bridge`, `teleport`, `warp`, `cross-chain`

LPs for cross-chain bridging, Warp messaging, and Teleport protocol.

### B-Chain Core

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-6000](/docs/lp-6000-b-chain-bridge-specification/) | B-Chain Bridge Specification | `bridge`, `b-chain` | Draft |
| [LP-6081](/docs/lp-6081-b-chain-bridge-chain-specification/) | B-Chain Bridge Chain Specification | `bridge`, `b-chain` | Draft |
| [LP-6331](/docs/lp-6331-b-chain-bridgevm-specification/) | B-Chain BridgeVM Specification | `bridge`, `b-chain`, `vm` | Draft |

### Bridge Protocols

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-6015](/docs/lp-6015-mpc-bridge-protocol/) | MPC Bridge Protocol | `bridge`, `mpc` | Draft |
| [LP-6016](/docs/lp-6016-teleport-cross-chain-protocol/) | Teleport Cross-Chain Protocol | `teleport`, `cross-chain` | Draft |
| [LP-6017](/docs/lp-6017-bridge-asset-registry/) | Bridge Asset Registry | `bridge`, `assets` | Draft |
| [LP-6018](/docs/lp-6018-cross-chain-message-format/) | Cross-Chain Message Format | `cross-chain`, `messaging` | Draft |
| [LP-6019](/docs/lp-6019-bridge-security-framework/) | Bridge Security Framework | `bridge`, `security` | Draft |
| [LP-6021](/docs/lp-6021-teleport-protocol/) | Teleport Protocol | `teleport`, `cross-chain` | Draft |
| [LP-6022](/docs/lp-6022-warp-messaging-20-native-interchain-transfers/) | Warp Messaging 2.0 | `warp`, `cross-chain`, `transfers` | Draft |
| [LP-6023](/docs/lp-6023-nft-staking-and-native-interchain-transfer/) | NFT Staking and Interchain Transfer | `nft`, `staking`, `cross-chain` | Draft |
| [LP-6301](/docs/lp-6301-lux-b-chain-cross-chain-bridge-protocol/) | B-Chain Cross-Chain Bridge Protocol | `bridge`, `b-chain` | Draft |
| [LP-6315](/docs/lp-6315-enhanced-cross-chain-communication-protocol/) | Enhanced Cross-Chain Communication | `cross-chain`, `protocol` | Draft |
| [LP-6329](/docs/lp-6329-teleport-bridge-system-index/) | Teleport Bridge System Index | `bridge`, `teleport`, `index` | Draft |
| [LP-6332](/docs/lp-6332-teleport-bridge-architecture-unified-cross-chain-protocol/) | Teleport Bridge Architecture | `bridge`, `teleport`, `architecture` | Draft |
| [LP-6335](/docs/lp-6335-bridge-smart-contract-integration/) | Bridge Smart Contract Integration | `bridge`, `contracts` | Draft |
| [LP-6339](/docs/lp-6339-bridge-security-emergency-procedures/) | Bridge Security Emergency Procedures | `bridge`, `security`, `emergency` | Draft |
| [LP-6340](/docs/lp-6340-unified-bridge-sdk-specification/) | Unified Bridge SDK | `bridge`, `sdk` | Draft |
| [LP-6341](/docs/lp-6341-decentralized-secrets-management-infisical-integration/) | Decentralized Secrets Management | `security`, `secrets` | Draft |

### Warp Messaging

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-6602](/docs/lp-6602-warp-cross-chain-messaging-protocol/) | Warp Cross-Chain Messaging Protocol | `warp`, `cross-chain`, `bls` | Draft |
| [LP-6603](/docs/lp-6603-warp-15-quantum-safe-cross-chain-messaging/) | **Warp 1.5 Quantum-Safe Messaging** | `warp`, `pqc`, `ringtail`, `ml-kem`, `teleport` | **Final** |

---

## Threshold Cryptography & MPC (7xxx)

> **Tags**: `threshold-crypto`, `mpc`, `tss`, `dkg`

LPs for multi-party computation, threshold signatures, and distributed key generation.

### T-Chain Core

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-7000](/docs/lp-7000-t-chain-threshold-specification/) | T-Chain Threshold Specification | `mpc`, `t-chain` | Draft |
| [LP-7083](/docs/lp-7083-t-chain-threshold-signature-chain-specification/) | T-Chain Threshold Signature Chain Specification | `mpc`, `t-chain` | Draft |
| [LP-7330](/docs/lp-7330-t-chain-thresholdvm-specification/) | T-Chain ThresholdVM Specification | `threshold-crypto`, `t-chain`, `vm` | Draft |
| [LP-7336](/docs/lp-7336-k-chain-keymanagementvm-specification/) | K-Chain KeyManagementVM Specification | `kms`, `k-chain`, `vm` | Draft |

### Threshold Signatures

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-7013](/docs/lp-7013-t-chain-decentralised-mpc-custody-and-swap-signature-layer/) | T-Chain Decentralised MPC Custody | `mpc`, `custody`, `t-chain` | Draft |
| [LP-7014](/docs/lp-7014-t-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa/) | CGG21 Threshold ECDSA | `threshold-crypto`, `cggmp21`, `ecdsa` | Draft |
| [LP-7103](/docs/lp-7103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing/) | MPC-LSS Dynamic Resharing | `mpc`, `lss`, `resharing` | Draft |
| [LP-7104](/docs/lp-7104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa/) | FROST Threshold EdDSA | `threshold-crypto`, `frost`, `eddsa` | Draft |
| [LP-7319](/docs/lp-7319-t-chain-decentralised-mpc-custody/) | T-Chain Decentralised MPC Custody (v2) | `mpc`, `custody`, `t-chain` | Draft |
| [LP-7321](/docs/lp-7321-frost-threshold-signature-precompile/) | FROST Threshold Signature Precompile | `threshold-crypto`, `frost`, `precompile` | Draft |
| [LP-7322](/docs/lp-7322-cggmp21-threshold-ecdsa-precompile/) | CGGMP21 ECDSA Precompile | `threshold-crypto`, `cggmp21`, `precompile` | Draft |
| [LP-7323](/docs/lp-7323-lss-mpc-dynamic-resharing-extension/) | LSS MPC Dynamic Resharing | `mpc`, `lss`, `resharing` | Draft |
| [LP-7324](/docs/lp-7324-ringtail-threshold-signature-precompile/) | Ringtail Threshold Signature Precompile | `pqc`, `ringtail`, `threshold-crypto`, `precompile` | Draft |
| [LP-7325](/docs/lp-7325-kms-hardware-security-module-integration/) | KMS/HSM Integration | `security`, `hsm`, `kms` | Draft |
| [LP-7333](/docs/lp-7333-dynamic-signer-rotation-with-lss-protocol/) | Dynamic Signer Rotation (LP-333) | `threshold-crypto`, `lss`, `signer-rotation` | Final |
| [LP-7334](/docs/lp-7334-per-asset-threshold-key-management/) | Per-Asset Threshold Key Management | `threshold-crypto`, `keys`, `bridge` | Draft |
| [LP-7340](/docs/lp-7340-threshold-cryptography-library/) | Threshold Cryptography Library | `threshold-crypto`, `library` | Draft |
| [LP-7341](/docs/lp-7341-threshold-typescript-sdk/) | Threshold TypeScript SDK | `threshold-crypto`, `sdk`, `typescript` | Draft |

---

## Privacy & Zero-Knowledge (8xxx)

> **Tags**: `privacy`, `zk`, `fhe`, `z-chain`

LPs for privacy features, zero-knowledge proofs, and encrypted execution.

### Z-Chain Core

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-8000](/docs/lp-8000-z-chain-zkvm-specification/) | Z-Chain ZKVM Specification | `privacy`, `z-chain`, `zkvm` | Draft |
| [LP-8045](/docs/lp-8045-z-chain-encrypted-execution-layer-interface/) | Z-Chain Encrypted Execution Layer | `privacy`, `z-chain`, `encryption` | Draft |
| [LP-8046](/docs/lp-8046-z-chain-zkvm-architecture/) | Z-Chain ZKVM Architecture | `privacy`, `z-chain`, `zkvm` | Draft |

### Private DeFi

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-8400](/docs/lp-8400-automated-market-maker-protocol-with-privacy/) | Private AMM Protocol | `defi`, `amm`, `privacy` | Draft |
| [LP-8401](/docs/lp-8401-confidential-lending-protocol/) | Confidential Lending Protocol | `defi`, `lending`, `privacy` | Draft |
| [LP-8402](/docs/lp-8402-zero-knowledge-swap-protocol/) | Zero-Knowledge Swap Protocol | `defi`, `swap`, `zk` | Draft |
| [LP-8403](/docs/lp-8403-private-staking-mechanisms/) | Private Staking Mechanisms | `defi`, `staking`, `privacy` | Draft |

### Layer 2 & Rollups

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-8500](/docs/lp-8500-layer-2-rollup-framework/) | Layer 2 Rollup Framework | `l2`, `rollup` | Draft |
| [LP-8501](/docs/lp-8501-data-availability-layer/) | Data Availability Layer | `l2`, `data-availability` | Draft |
| [LP-8502](/docs/lp-8502-fraud-proof-system/) | Fraud Proof System | `l2`, `fraud-proof`, `optimistic` | Draft |
| [LP-8503](/docs/lp-8503-validity-proof-system/) | Validity Proof System | `l2`, `validity-proof`, `zk` | Draft |
| [LP-8504](/docs/lp-8504-sequencer-registry-protocol/) | Sequencer Registry Protocol | `l2`, `sequencer` | Draft |
| [LP-8505](/docs/lp-8505-l2-block-format-specification/) | L2 Block Format Specification | `l2`, `block-format` | Draft |

---

## LP-9000: DEX Series (X-Chain)

```
  ██╗     ██████╗       █████╗  ██████╗  ██████╗  ██████╗
  ██║     ██╔══██╗     ██╔══██╗██╔═████╗██╔═████╗██╔═████╗
  ██║     ██████╔╝████╗╚██████║██║██╔██║██║██╔██║██║██╔██║
  ██║     ██╔═══╝ ╚═══╝ ╚═══██║████╔╝██║████╔╝██║████╔╝██║
  ███████╗██║           █████╔╝╚██████╔╝╚██████╔╝╚██████╔╝
  ╚══════╝╚═╝           ╚════╝  ╚═════╝  ╚═════╝  ╚═════╝
         IT'S OVER 9000!
```

> **Tags**: `dex`, `trading`, `orderbook`, `perpetuals`, `oracle`, `lp-9000-series`

The **LP-9000 Series** is Lux's comprehensive decentralized exchange infrastructure.

**Master Document**: [LP-9099 DEX Overview](/docs/lp-9099-dex-overview/)
**Implementation**: [github.com/luxfi/dex](https://github.com/luxfi/dex)

### X-Chain Core

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-3000](/docs/lp-3000-x-chain-exchange-specification/) | X-Chain Exchange Specification | `dex`, `x-chain` | Draft |
| [LP-3011](/docs/lp-3011-x-chain-exchange-chain-specification/) | X-Chain Exchange Chain Specification | `dex`, `x-chain` | Draft |
| [LP-3036](/docs/lp-3036-x-chain-order-book-dex-api-and-rpc-addendum/) | X-Chain Order Book DEX API | `dex`, `api`, `x-chain` | Draft |
| [LP-3037](/docs/lp-3037-native-swap-integration-on-t-chain-x-chain-and-z-chain/) | Native Swap Integration | `defi`, `swap` | Draft |

### LP-9000 Series Index

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-9000](/docs/lp-9000-dex-core-specification/) | DEX Core Specification | `dex`, `architecture` | Draft |
| [LP-9001](/docs/lp-9001-dex-trading-engine/) | DEX Trading Engine | `dex`, `core`, `orderbook` | Draft |
| [LP-9002](/docs/lp-9002-dex-api-rpc-specification/) | DEX API & RPC Specification | `dex`, `api`, `rpc` | Draft |
| [LP-9003](/docs/lp-9003-high-performance-dex-protocol/) | High-Performance DEX (GPU/FPGA) | `dex`, `fpga`, `performance` | Draft |
| [LP-9005](/docs/lp-9005-native-oracle-protocol/) | Native Oracle Protocol | `dex`, `oracle`, `price-feed` | Draft |
| [LP-9006](/docs/lp-9006-hft-trading-venues-global-network/) | HFT Trading Venues Global Network | `dex`, `hft` | Draft |
| [LP-9010](/docs/lp-9010-dex-precompile/) | DEX Precompile - Native HFT | `dex`, `precompile`, `hft` | Draft |
| [LP-9011](/docs/lp-9011-oracle-precompile/) | Oracle Precompile - Multi-Source | `oracle`, `precompile` | Draft |
| [LP-9012](/docs/lp-9012-bridge-aggregator/) | Bridge Aggregator - Omnichain | `bridge`, `cross-chain` | Draft |
| [LP-9013](/docs/lp-9013-crosschain-defi-router/) | CrossChain DeFi Router | `defi`, `cross-chain`, `router` | Draft |
| [LP-9014](/docs/lp-9014-quantumswap-hft/) | QuantumSwap HFT Integration | `dex`, `hft`, `quantumswap` | Draft |
| [LP-9015](/docs/lp-9015-precompile-registry/) | Precompile Registry | `precompile`, `registry` | Draft |

### Production Operations (LP-9016 - LP-9025)

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-9016](/docs/lp-9016-emergency-procedures/) | Emergency Procedures & Circuit Breakers | `security`, `emergency` | Draft |
| [LP-9017](/docs/lp-9017-risk-management/) | Risk Management Framework | `risk`, `protection` | Draft |
| [LP-9018](/docs/lp-9018-liquidity-mining/) | Liquidity Mining & Incentives | `liquidity`, `mining` | Draft |
| [LP-9019](/docs/lp-9019-fee-distribution/) | Fee Distribution System | `fees`, `revenue` | Draft |
| [LP-9020](/docs/lp-9020-performance-benchmarks/) | Performance Benchmarks | `performance`, `benchmarks` | Draft |
| [LP-9021](/docs/lp-9021-monitoring-alerting/) | Monitoring & Alerting Standards | `monitoring`, `alerting` | Draft |
| [LP-9022](/docs/lp-9022-upgrade-procedures/) | Upgrade & Migration Procedures | `upgrades`, `migration` | Draft |
| [LP-9023](/docs/lp-9023-integration-testing/) | Integration Testing Requirements | `testing`, `ci-cd` | Draft |
| [LP-9024](/docs/lp-9024-security-audit-requirements/) | Security Audit Requirements for DeFi | `security`, `audit` | Draft |
| [LP-9025](/docs/lp-9025-mev-protection/) | MEV Protection & Fair Ordering | `mev`, `fair-ordering` | Draft |

### DeFi Protocols (LP-9040 - LP-9099)

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-9040](/docs/lp-9040-perpetuals-derivatives-protocol/) | Perpetuals & Derivatives Protocol | `dex`, `perpetuals`, `margin` | Draft |
| [LP-9060](/docs/lp-9060-defi-protocols-overview/) | DeFi Protocols Overview | `defi`, `overview` | Draft |
| [LP-9070](/docs/lp-9070-nft-staking-standard/) | NFT Staking Standard | `nft`, `staking` | Draft |
| [LP-9071](/docs/lp-9071-media-content-nft-standard/) | Media Content NFT Standard | `nft`, `media` | Draft |
| [LP-9072](/docs/lp-9072-bridged-asset-standard/) | Bridged Asset Standard | `bridge`, `assets` | Draft |
| [LP-9073](/docs/lp-9073-batch-execution-standard-multicall/) | Batch Execution (Multicall) | `evm`, `multicall` | Draft |
| [LP-9074](/docs/lp-9074-create2-factory-standard/) | CREATE2 Factory Standard | `evm`, `create2` | Draft |
| [LP-9099](/docs/lp-9099-dex-overview/) | DEX Overview | `dex`, `index` | Draft |

---

## Research (10xxx)

> **Tags**: `research`, `informational`
> **Note**: Research = Base + 10000 (per LP-0099 v3.3)

Research papers, informational documents, and experimental protocols.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-10090](/docs/lp-10090-research-papers-index/) | Research Papers Index | `research`, `index` | Draft |
| [LP-10091](/docs/lp-10091-payment-processing-research/) | Payment Processing Research | `research`, `payments` | Informational |
| [LP-10092](/docs/lp-10092-cross-chain-messaging-research/) | Cross-Chain Messaging Research | `research`, `cross-chain` | Informational |
| [LP-10093](/docs/lp-10093-decentralized-identity-research/) | Decentralized Identity Research | `research`, `identity` | Informational |
| [LP-10094](/docs/lp-10094-governance-framework-research/) | Governance Framework Research | `research`, `governance` | Informational |
| [LP-10095](/docs/lp-10095-stablecoin-mechanisms-research/) | Stablecoin Mechanisms Research | `research`, `stablecoin` | Informational |
| [LP-10096](/docs/lp-10096-mev-protection-research/) | MEV Protection Research | `research`, `mev` | Informational |
| [LP-10097](/docs/lp-10097-data-availability-research/) | Data Availability Research | `research`, `data-availability` | Informational |

### Legacy Research Index

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-50000](/docs/lp-50000-research-index/) | Research Index (Legacy) | `research`, `index` | Draft |

---

## Institutional (70xxx-72xxx)

> **Tags**: `institutional`, `fund`, `dao`, `esg`

LPs for fund management, DAO governance, and ESG frameworks.

### Fund Management (70xxx)

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-70000](/docs/lp-70000-fund-management-index/) | Fund Management Index | `fund`, `index` | Draft |

### DAO Governance (71xxx)

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-71000](/docs/lp-71000-dao-governance-index/) | DAO Governance Index | `dao`, `governance`, `index` | Draft |

### DAO Platform (2520-2525)

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-2520](/docs/lp-2520-lux-dao-platform/) | Lux DAO Platform | `dao`, `governance` | Draft |
| [LP-2521](/docs/lp-2521-azorius-governance-module/) | Azorius Governance Module | `dao`, `azorius` | Draft |
| [LP-2522](/docs/lp-2522-voting-strategies-standard/) | Voting Strategies Standard | `dao`, `voting` | Draft |
| [LP-2523](/docs/lp-2523-freeze-voting-guard-system/) | Freeze Voting Guard System | `dao`, `security` | Draft |
| [LP-2524](/docs/lp-2524-dao-account-abstraction/) | DAO Account Abstraction | `dao`, `erc-4337` | Draft |
| [LP-2525](/docs/lp-2525-luxdao-sdk/) | LuxDAO SDK | `dao`, `sdk` | Draft |

### ESG & Impact (72xxx)

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-72000](/docs/lp-72000-esg-impact-index/) | ESG & Impact Index | `esg`, `impact`, `index` | Draft |

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
| [LP-0039](/docs/lp-0039-lx-python-sdk-corollary-for-on-chain-actions/) | LX Python SDK | `sdk`, `python` | Informational |
| [LP-0040](/docs/lp-0040-wallet-standards/) | Wallet Standards | `tools`, `wallet` | Draft |
| [LP-0042](/docs/lp-0042-multi-signature-wallet-standard/) | Multi-Signature Wallet Standard | `tools`, `wallet`, `multisig` | Draft |
| [LP-0050](/docs/lp-0050-developer-tools-overview/) | Developer Tools Overview | `tools`, `overview` | Draft |
| [LP-0070](/docs/lp-0070-key-management-system/) | Key Management System | `security`, `keys` | Draft |
| [LP-0085](/docs/lp-0085-security-audit-framework/) | Security Audit Framework | `security`, `audit` | Draft |
| [LP-0086](/docs/lp-0086-security-practices-and-responsible-disclosure/) | Security Practices & Responsible Disclosure | `security`, `disclosure` | Draft |
| [LP-0098](/docs/lp-0098-luxfi-graphdb-and-graphql-engine-integration/) | LuxFi GraphDB and GraphQL Engine | `tools`, `graphql` | Draft |

---

## ESG & Impact (0750-0930)

> **Tags**: `esg`, `sustainability`, `impact`, `governance`

LPs for environmental, social, and governance frameworks.

### Lux Vision Fund ESG

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0750](/docs/lp-0750-lux-vision-fund-esg-framework/) | Lux Vision Fund ESG Framework | `esg`, `fund` | Final |
| [LP-0751](/docs/lp-0751-environmental-integrity-investment-policy/) | Environmental Integrity Investment Policy | `esg`, `environmental` | Final |
| [LP-0752](/docs/lp-0752-social-benefit-investment-policy/) | Social Benefit Investment Policy | `esg`, `social` | Final |
| [LP-0753](/docs/lp-0753-governance-ecosystem-architecture/) | Governance Ecosystem Architecture | `esg`, `governance` | Final |
| [LP-0760](/docs/lp-0760-lux-network-impact-thesis/) | Lux Network Impact Thesis | `esg`, `impact` | Final |

### ESG Principles

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0800](/docs/lp-0800-esg-principles-and-commitments/) | ESG Principles & Commitments | `esg`, `principles` | Final |
| [LP-0801](/docs/lp-0801-carbon-accounting-methodology/) | Carbon Accounting Methodology | `esg`, `carbon` | Final |
| [LP-0810](/docs/lp-0810-green-compute-energy-procurement/) | Green Compute & Energy Procurement | `esg`, `green-compute` | Final |
| [LP-0820](/docs/lp-0820-network-energy-transparency/) | Network Energy Transparency | `esg`, `transparency` | Final |
| [LP-0830](/docs/lp-0830-esg-risk-management/) | ESG Risk Management | `esg`, `risk` | Final |
| [LP-0840](/docs/lp-0840-anti-greenwashing-policy/) | Anti-Greenwashing Policy | `esg`, `policy` | Final |
| [LP-0850](/docs/lp-0850-esg-standards-alignment-matrix/) | ESG Standards Alignment Matrix | `esg`, `standards` | Final |
| [LP-0860](/docs/lp-0860-evidence-locker-index/) | Evidence Locker Index | `esg`, `evidence` | Final |

### Impact Measurement

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0900](/docs/lp-0900-impact-framework-theory-of-change/) | Impact Framework: Theory of Change | `esg`, `impact` | Final |
| [LP-0901](/docs/lp-0901-impact-measurement-methodology/) | Impact Measurement Methodology | `esg`, `metrics` | Final |
| [LP-0910](/docs/lp-0910-stakeholder-engagement/) | Stakeholder Engagement | `esg`, `stakeholder` | Final |
| [LP-0920](/docs/lp-0920-community-development-grants/) | Community Development & Grants | `esg`, `grants` | Final |
| [LP-0930](/docs/lp-0930-financial-inclusion-metrics/) | Financial Inclusion Metrics | `esg`, `inclusion` | Final |

---

## Learning Paths

> **Tags**: `learning`, `education`, `paths`

Curated learning paths for different user personas.

| LP | Title | Tags | Status |
|----|-------|------|--------|
| [LP-0010](/docs/lp-0010-learning-paths-index/) | Learning Paths Index | `learning`, `index` | Final |
| [LP-0011](/docs/lp-0011-learning-path-core/) | Learning Path: Core Protocol | `learning`, `core` | Final |
| [LP-0012](/docs/lp-0012-learning-path-developer/) | Learning Path: Developer | `learning`, `developer` | Final |
| [LP-0013](/docs/lp-0013-learning-path-validator/) | Learning Path: Validator | `learning`, `validator` | Final |
| [LP-0014](/docs/lp-0014-learning-path-trading/) | Learning Path: Trading | `learning`, `trading` | Final |
| [LP-0015](/docs/lp-0015-learning-path-security/) | Learning Path: Security | `learning`, `security` | Final |
| [LP-0016](/docs/lp-0016-learning-path-mpc/) | Learning Path: MPC | `learning`, `mpc` | Final |
| [LP-0017](/docs/lp-0017-learning-path-privacy/) | Learning Path: Privacy | `learning`, `privacy` | Final |
| [LP-0018](/docs/lp-0018-learning-path-investor/) | Learning Path: Investor | `learning`, `investor` | Final |
| [LP-0019](/docs/lp-0019-learning-path-researcher/) | Learning Path: Researcher | `learning`, `researcher` | Final |

---

## Tag Reference

Quick links to find LPs by tag:

### Cryptography
| Tag | Description | Count |
|-----|-------------|-------|
| `pqc` | Post-quantum cryptography | 15+ |
| `threshold-crypto` | Threshold signatures/MPC | 15+ |
| `mpc` | Multi-party computation | 10+ |
| `encryption` | Encryption schemes | 5+ |

### Protocols
| Tag | Description | Count |
|-----|-------------|-------|
| `warp` | Warp messaging protocol | 5+ |
| `teleport` | Teleport cross-chain protocol | 10+ |
| `bridge` | Bridge infrastructure | 20+ |
| `cross-chain` | Cross-chain interoperability | 15+ |
| `consensus` | Consensus mechanisms | 10+ |

### Chains
| Tag | Description | Count |
|-----|-------------|-------|
| `c-chain` | Contract chain (EVM) | 15+ |
| `b-chain` | Bridge chain | 10+ |
| `t-chain` | Threshold chain | 15+ |
| `q-chain` | Quantum chain | 10+ |
| `x-chain` | Exchange chain (DEX) | 20+ |
| `z-chain` | Zero-knowledge chain | 10+ |
| `a-chain` | Attestation chain | 10+ |
| `p-chain` | Platform chain | 10+ |

### Development
| Tag | Description | Count |
|-----|-------------|-------|
| `evm` | EVM compatibility | 20+ |
| `precompile` | EVM precompiles | 15+ |
| `sdk` | Software development kits | 5+ |
| `tools` | Developer tools | 15+ |
| `lrc` | Token standards | 10+ |

---

## Contributing

To add a new LP:

1. Copy `TEMPLATE.md` to `lp-XXXX-title.md` (use 4-digit numbering)
2. Add appropriate tags in frontmatter
3. Update this index
4. Submit PR

See [LP-0099](/docs/lp-0099-lp-numbering-scheme-and-chain-organization/) for the complete numbering scheme.

---

*Last Updated: 2025-12-21*
