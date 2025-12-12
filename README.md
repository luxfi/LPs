# Lux Proposals (LPs)

Lux Proposals (LPs) are the primary mechanism for proposing new features, gathering community input, and documenting design decisions for the [Lux Network](https://lux.network).

## Network Architecture

Lux Network operates an **8-chain architecture** with specialized chains for different workloads:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LUX NETWORK                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│   │ P-Chain │  │ C-Chain │  │ X-Chain │  │ Q-Chain │                       │
│   │Platform │  │Contract │  │Exchange │  │ Quantum │                       │
│   │  1xxx   │  │  2xxx   │  │  3xxx   │  │  4xxx   │                       │
│   │   🟢    │  │   🟢    │  │   🟢    │  │   🟡    │                       │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘                       │
│                                                                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│   │ A-Chain │  │ B-Chain │  │ T-Chain │  │ Z-Chain │                       │
│   │   AI    │  │ Bridge  │  │Threshold│  │   ZK    │                       │
│   │  5xxx   │  │  6xxx   │  │  7xxx   │  │  8xxx   │                       │
│   │   🟡    │  │   🟢    │  │   🟡    │  │   🟡    │                       │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘                       │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │                    DEX / Finance (9xxx)                       │        │
│   │        Order Book • AMM • Perpetuals • Oracle                 │   🟢   │
│   └───────────────────────────────────────────────────────────────┘        │
│                                                                             │
│   🟢 Active   🟡 Development                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Links

| Resource | Link |
|:---------|:-----|
| **Architecture** | [LP-0000](./LPs/lp-0000-network-architecture-and-community-framework.md) |
| **Numbering Scheme** | [LP-0099](./LPs/lp-0099-lp-numbering-scheme-and-chain-organization.md) |
| **Token Standard (LRC-20)** | [LP-2300](./LPs/lp-2300-lrc-20-fungible-token-standard.md) |
| **NFT Standard (LRC-721)** | [LP-2721](./LPs/lp-2721-lrc-721-non-fungible-token-standard.md) |
| **DEX Core** | [LP-9000](./LPs/lp-9000-dex-core-specification.md) |

---

## Chain Specifications

### 🔷 P-Chain — Platform (1xxx)

> Validator management, staking, subnet creation

| LP | Title | Status |
|:---|:------|:------:|
| [1000](./LPs/lp-1000-p-chain-core-platform-specification.md) | **Core Platform Specification** | ✅ |
| [1010](./LPs/lp-1010-p-chain-platform-chain-specification.md) | Platform Chain Specification | ✅ |
| [1024](./LPs/lp-1024-parallel-validation-and-shared-mempool.md) | Parallel Validation & Shared Mempool | 📝 |
| [1033](./LPs/lp-1033-p-chain-state-rollup-to-c-chain-evm.md) | State Rollup to C-Chain EVM | 📝 |
| [1034](./LPs/lp-1034-p-chain-as-superchain-l2-op-stack-rollup-integration.md) | Superchain L2 (OP Stack) | 📝 |
| [1181](./LPs/lp-1181-epoching.md) | Epoching & Validator Rotation | ✅ |
| [1605](./LPs/lp-1605-elastic-validator-subnets.md) | Elastic Validator Subnets | 📝 |

---

### 🟢 C-Chain — Contract/EVM (2xxx)

> EVM-compatible smart contracts, token standards

| LP | Title | Status |
|:---|:------|:------:|
| [2000](./LPs/lp-2000-c-chain-evm-specification.md) | **EVM Specification** | ✅ |
| [2001](./LPs/lp-2001-aivm-ai-virtual-machine.md) | AIVM - AI Virtual Machine | 📝 |
| [2012](./LPs/lp-2012-c-chain-contract-chain-specification.md) | Contract Chain Specification | 📝 |
| [2025](./LPs/lp-2025-l2-to-sovereign-l1-ascension-and-fee-model.md) | L2 to Sovereign L1 Ascension | 📝 |
| [2026](./LPs/lp-2026-c-chain-evm-equivalence-and-core-eips-adoption.md) | EVM Equivalence & Core EIPs | 📝 |
| [2118](./LPs/lp-2118-subnetevm-compat.md) | Subnet-EVM Compatibility | ✅ |
| [2176](./LPs/lp-2176-dynamic-gas-pricing.md) | Dynamic Gas Pricing | ✅ |
| [2204](./LPs/lp-2204-secp256r1-curve-integration.md) | secp256r1 Curve Integration | ✅ |
| [2226](./LPs/lp-2226-dynamic-minimum-block-times-granite-upgrade.md) | Dynamic Block Times (Granite) | ✅ |
| [2320](./LPs/lp-2320-dynamic-evm-gas-limit-and-price-discovery-updates.md) | Dynamic EVM Gas Limit | ✅ |
| [2327](./LPs/lp-2327-badgerdb-verkle-optimization.md) | BadgerDB + Verkle Optimization | ✅ |

**Token Standards:**

| LP | Standard | Status |
|:---|:---------|:------:|
| [2300](./LPs/lp-2300-lrc-20-fungible-token-standard.md) | **LRC-20** Fungible Token | ✅ |
| [2721](./LPs/lp-2721-lrc-721-non-fungible-token-standard.md) | **LRC-721** Non-Fungible Token | ✅ |
| [2155](./LPs/lp-2155-lrc-1155-multi-token-standard.md) | **LRC-1155** Multi-Token | ✅ |
| [2027](./LPs/lp-2027-lrc-token-standards-adoption.md) | LRC Standards Adoption | 📝 |
| [2028](./LPs/lp-2028-lrc-20-burnable-token-extension.md) | LRC-20 Burnable Extension | 📝 |
| [2029](./LPs/lp-2029-lrc-20-mintable-token-extension.md) | LRC-20 Mintable Extension | 📝 |
| [2030](./LPs/lp-2030-lrc-20-bridgable-token-extension.md) | LRC-20 Bridgable Extension | 📝 |
| [2031](./LPs/lp-2031-lrc-721-burnable-token-extension.md) | LRC-721 Burnable Extension | 📝 |

**Precompiles & Infrastructure:**

| LP | Title | Status |
|:---|:------|:------:|
| [2032](./LPs/lp-2032-c-chain-rollup-plugin-architecture.md) | Rollup Plugin Architecture | 📝 |
| [2035](./LPs/lp-2035-stage-sync-pipeline-for-coreth-bootstrapping.md) | Stage-Sync Pipeline | 📝 |
| [2076](./LPs/lp-2076-random-number-generation-standard.md) | Random Number Generation | 📝 |
| [2311](./LPs/lp-2311-ml-dsa-signature-verification-precompile.md) | ML-DSA Precompile | 📝 |
| [2312](./LPs/lp-2312-slh-dsa-signature-verification-precompile.md) | SLH-DSA Precompile | 📝 |
| [2313](./LPs/lp-2313-warp-messaging-precompile.md) | Warp Messaging Precompile | 📝 |
| [2314](./LPs/lp-2314-fee-manager-precompile.md) | Fee Manager Precompile | 📝 |
| [2326](./LPs/lp-2326-blockchain-regenesis-and-state-migration.md) | Regenesis & State Migration | 📝 |
| [2604](./LPs/lp-2604-state-sync-and-pruning-protocol.md) | State Sync & Pruning | 📝 |
| [2606](./LPs/lp-2606-verkle-trees-for-efficient-state-management.md) | Verkle Trees | 📝 |

---

### 🟡 X-Chain — Exchange (3xxx)

> High-speed asset transfers, UTXO model, order books

| LP | Title | Status |
|:---|:------|:------:|
| [3000](./LPs/lp-3000-x-chain-exchange-specification.md) | **Exchange Specification** | ✅ |
| [3011](./LPs/lp-3011-x-chain-exchange-chain-specification.md) | Exchange Chain Specification | ✅ |
| [3036](./LPs/lp-3036-x-chain-order-book-dex-api-and-rpc-addendum.md) | Order-Book DEX API & RPC | ✅ |
| [3037](./LPs/lp-3037-native-swap-integration-on-m-chain-x-chain-and-z-chain.md) | Native Swap Integration | 📝 |

---

### 🟣 Q-Chain — Quantum (4xxx)

> Post-quantum cryptography, quantum-safe operations

| LP | Title | Status |
|:---|:------|:------:|
| [4000](./LPs/lp-4000-q-chain-quantum-specification.md) | **Quantum Specification** | ✅ |
| [4004](./LPs/lp-4004-quantum-resistant-cryptography-integration-in-lux.md) | Quantum-Resistant Crypto | ✅ |
| [4005](./LPs/lp-4005-quantum-safe-wallets-and-multisig-standard.md) | Quantum-Safe Wallets | ✅ |
| [4082](./LPs/lp-4082-q-chain-quantum-resistant-chain-specification.md) | Quantum Resistant Chain | 📝 |
| [4099](./LPs/lp-4099-q-chain-quantum-secure-consensus-protocol-family-quasar.md) | Quasar Consensus Family | 📝 |
| [4100](./LPs/lp-4100-nist-post-quantum-cryptography-integration-for-lux-network.md) | NIST PQC Integration | 📝 |
| [4105](./LPs/lp-4105-lamport-one-time-signatures-ots-for-lux-safe.md) | Lamport OTS for Lux Safe | 📝 |
| [4110](./LPs/lp-4110-quasar-consensus-protocol.md) | Quasar Consensus Protocol | 📝 |

**Post-Quantum Standards:**

| LP | Algorithm | Status |
|:---|:----------|:------:|
| [4316](./LPs/lp-4316-ml-dsa-post-quantum-digital-signatures.md) | **ML-DSA** (Dilithium) | ✅ |
| [4317](./LPs/lp-4317-slh-dsa-stateless-hash-based-digital-signatures.md) | **SLH-DSA** (SPHINCS+) | ✅ |
| [4318](./LPs/lp-4318-ml-kem-post-quantum-key-encapsulation.md) | **ML-KEM** (Kyber) | ✅ |
| [4200](./LPs/lp-4200-post-quantum-cryptography-suite-for-lux-network.md) | PQC Suite | 📝 |
| [4201](./LPs/lp-4201-hybrid-classical-quantum-cryptography-transitions.md) | Hybrid Transitions | 📝 |
| [4202](./LPs/lp-4202-cryptographic-agility-framework.md) | Crypto Agility Framework | 📝 |
| [4303](./LPs/lp-4303-lux-q-security-post-quantum-p-chain-integration.md) | Q-Security P-Chain | ✅ |

---

### 🤖 A-Chain — AI/Attestation (5xxx)

> AI compute, attestations, TEE integration

| LP | Title | Status |
|:---|:------|:------:|
| [5000](./LPs/lp-5000-a-chain-ai-attestation-specification.md) | **AI/Attestation Specification** | ✅ |
| [5075](./LPs/lp-5075-tee-integration-standard.md) | TEE Integration Standard | 📝 |
| [5080](./LPs/lp-5080-a-chain-attestation-chain-specification.md) | Attestation Chain Spec | 📝 |
| [5101](./LPs/lp-5101-solidity-graphql-extension-for-native-g-chain-integration.md) | Solidity GraphQL Extension | 📝 |
| [5102](./LPs/lp-5102-immutable-training-ledger-for-privacy-preserving-ai.md) | Immutable Training Ledger | 📝 |
| [5106](./LPs/lp-5106-llm-gateway-integration-with-hanzo-ai.md) | LLM Gateway (Hanzo AI) | 📝 |
| [5200](./LPs/lp-5200-ai-mining-standard.md) | AI Mining Standard | 📝 |
| [5302](./LPs/lp-5302-lux-z-a-chain-privacy-ai-attestation-layer.md) | Privacy AI Attestation | ✅ |
| [5601](./LPs/lp-5601-dynamic-gas-fee-mechanism-with-ai-compute-pricing.md) | AI Compute Gas Pricing | 📝 |
| [5607](./LPs/lp-5607-gpu-acceleration-framework.md) | GPU Acceleration | 📝 |

---

### 🌉 B-Chain — Bridge (6xxx)

> Cross-chain bridges, asset transfers, Warp messaging

| LP | Title | Status |
|:---|:------|:------:|
| [6000](./LPs/lp-6000-b-chain-bridge-specification.md) | **Bridge Specification** | ✅ |
| [6301](./LPs/lp-6301-lux-b-chain-cross-chain-bridge-protocol.md) | Cross-Chain Bridge Protocol | ✅ |
| [6603](./LPs/lp-6603-warp-15-quantum-safe-cross-chain-messaging.md) | Warp 1.5 Quantum-Safe | ✅ |

**Teleport Bridge:**

| LP | Title | Status |
|:---|:------|:------:|
| [6016](./LPs/lp-6016-teleport-cross-chain-protocol.md) | Teleport Protocol | 📝 |
| [6021](./LPs/lp-6021-teleport-protocol.md) | Teleport Implementation | 📝 |
| [6329](./LPs/lp-6329-teleport-bridge-system-index.md) | Bridge System Index | 📝 |
| [6332](./LPs/lp-6332-teleport-bridge-architecture-unified-cross-chain-protocol.md) | Teleport Architecture | 📝 |

**Warp Messaging:**

| LP | Title | Status |
|:---|:------|:------:|
| [6022](./LPs/lp-6022-warp-messaging-20-native-interchain-transfers.md) | Warp Messaging 2.0 | 📝 |
| [6602](./LPs/lp-6602-warp-cross-chain-messaging-protocol.md) | Warp Protocol | 📝 |

**Bridge Infrastructure:**

| LP | Title | Status |
|:---|:------|:------:|
| [6015](./LPs/lp-6015-mpc-bridge-protocol.md) | MPC Bridge Protocol | 📝 |
| [6017](./LPs/lp-6017-bridge-asset-registry.md) | Asset Registry | 📝 |
| [6018](./LPs/lp-6018-cross-chain-message-format.md) | Message Format | 📝 |
| [6019](./LPs/lp-6019-bridge-security-framework.md) | Security Framework | 📝 |
| [6023](./LPs/lp-6023-nft-staking-and-native-interchain-transfer.md) | NFT Interchain Transfer | 📝 |
| [6081](./LPs/lp-6081-b-chain-bridge-chain-specification.md) | Bridge Chain Spec | 📝 |
| [6315](./LPs/lp-6315-enhanced-cross-chain-communication-protocol.md) | Enhanced Cross-Chain | 📝 |
| [6331](./LPs/lp-6331-b-chain-bridgevm-specification.md) | BridgeVM Specification | 📝 |
| [6335](./LPs/lp-6335-bridge-smart-contract-integration.md) | Smart Contract Integration | 📝 |
| [6339](./LPs/lp-6339-bridge-security-emergency-procedures.md) | Emergency Procedures | 📝 |
| [6340](./LPs/lp-6340-unified-bridge-sdk-specification.md) | Bridge SDK | 📝 |
| [6341](./LPs/lp-6341-decentralized-secrets-management-infisical-integration.md) | Secrets Management | 📝 |

---

### 🔐 T-Chain — Threshold (7xxx)

> MPC custody, threshold signatures, key management

| LP | Title | Status |
|:---|:------|:------:|
| [7000](./LPs/lp-7000-t-chain-threshold-specification.md) | **Threshold Specification** | ✅ |
| [7330](./LPs/lp-7330-t-chain-thresholdvm-specification.md) | ThresholdVM Specification | 📝 |

**Threshold Signatures:**

| LP | Protocol | Status |
|:---|:---------|:------:|
| [7321](./LPs/lp-7321-frost-threshold-signature-precompile.md) | **FROST** Precompile | 📝 |
| [7322](./LPs/lp-7322-cggmp21-threshold-ecdsa-precompile.md) | **CGGMP21** ECDSA Precompile | 📝 |
| [7324](./LPs/lp-7324-ringtail-threshold-signature-precompile.md) | **Ringtail** Precompile | 📝 |
| [7104](./LPs/lp-7104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa.md) | FROST (EdDSA) | 📝 |

**MPC & Key Management:**

| LP | Title | Status |
|:---|:------|:------:|
| [7013](./LPs/lp-7013-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md) | MPC Custody & Swap-Sig | 📝 |
| [7014](./LPs/lp-7014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md) | CGG21 Threshold Sigs | 📝 |
| [7083](./LPs/lp-7083-t-chain-threshold-signature-chain-specification.md) | Threshold Sig Chain | 📝 |
| [7103](./LPs/lp-7103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing.md) | MPC-LSS Resharing | 📝 |
| [7319](./LPs/lp-7319-m-chain-decentralised-mpc-custody.md) | M-Chain MPC Custody | ⚠️ |
| [7323](./LPs/lp-7323-lss-mpc-dynamic-resharing-extension.md) | LSS-MPC Extension | 📝 |
| [7325](./LPs/lp-7325-kms-hardware-security-module-integration.md) | KMS/HSM Integration | 📝 |
| [7333](./LPs/lp-7333-dynamic-signer-rotation-with-lss-protocol.md) | Dynamic Signer Rotation | 📝 |
| [7334](./LPs/lp-7334-per-asset-threshold-key-management.md) | Per-Asset Key Management | 📝 |
| [7336](./LPs/lp-7336-k-chain-keymanagementvm-specification.md) | K-Chain KeyManagementVM | 📝 |

---

### 🔒 Z-Chain — Zero-Knowledge (8xxx)

> Privacy, ZK proofs, confidential transactions

| LP | Title | Status |
|:---|:------|:------:|
| [8000](./LPs/lp-8000-z-chain-zkvm-specification.md) | **ZKVM Specification** | ✅ |
| [8045](./LPs/lp-8045-z-chain-encrypted-execution-layer-interface.md) | Encrypted Execution Layer | 📝 |
| [8046](./LPs/lp-8046-z-chain-zkvm-architecture.md) | ZKVM Architecture | 📝 |

**Privacy DeFi:**

| LP | Title | Status |
|:---|:------|:------:|
| [8400](./LPs/lp-8400-automated-market-maker-protocol-with-privacy.md) | Private AMM | 📝 |
| [8401](./LPs/lp-8401-confidential-lending-protocol.md) | Confidential Lending | 📝 |
| [8402](./LPs/lp-8402-zero-knowledge-swap-protocol.md) | ZK Swap Protocol | 📝 |
| [8403](./LPs/lp-8403-private-staking-mechanisms.md) | Private Staking | 📝 |

**Layer 2 Rollups:**

| LP | Title | Status |
|:---|:------|:------:|
| [8500](./LPs/lp-8500-layer-2-rollup-framework.md) | **L2 Rollup Framework** | 📝 |
| [8501](./LPs/lp-8501-data-availability-layer.md) | Data Availability Layer | 📝 |
| [8502](./LPs/lp-8502-fraud-proof-system.md) | Fraud Proof System | 📝 |
| [8503](./LPs/lp-8503-validity-proof-system.md) | Validity Proof System | 📝 |
| [8504](./LPs/lp-8504-sequencer-registry-protocol.md) | Sequencer Registry | 📝 |
| [8505](./LPs/lp-8505-l2-block-format-specification.md) | L2 Block Format | 📝 |

---

### 📈 DEX & Finance (9xxx)

> Trading, DeFi, derivatives, oracle

| LP | Title | Status |
|:---|:------|:------:|
| [9000](./LPs/lp-9000-dex-core-specification.md) | **DEX Core Specification** | ✅ |
| [9099](./LPs/lp-9099-dex-overview.md) | DEX Series Overview | ✅ |

**Trading Engine:**

| LP | Title | Status |
|:---|:------|:------:|
| [9001](./LPs/lp-9001-dex-trading-engine.md) | Trading Engine | ✅ |
| [9002](./LPs/lp-9002-dex-api-rpc-specification.md) | API & RPC Specification | ✅ |
| [9003](./LPs/lp-9003-high-performance-dex-protocol.md) | High-Performance Protocol | ✅ |
| [9005](./LPs/lp-9005-native-oracle-protocol.md) | **Native Oracle** | ✅ |
| [9006](./LPs/lp-9006-hft-trading-venues-global-network.md) | HFT Trading Venues | 📝 |
| [9040](./LPs/lp-9040-perpetuals-derivatives-protocol.md) | Perpetuals & Derivatives | ✅ |

**Application Standards:**

| LP | Title | Status |
|:---|:------|:------:|
| [9060](./LPs/lp-9060-defi-protocols-overview.md) | DeFi Protocols Overview | 📝 |
| [9070](./LPs/lp-9070-nft-staking-standard.md) | NFT Staking | 📝 |
| [9071](./LPs/lp-9071-media-content-nft-standard.md) | Media Content NFT | 📝 |
| [9072](./LPs/lp-9072-bridged-asset-standard.md) | Bridged Asset Standard | 📝 |
| [9073](./LPs/lp-9073-batch-execution-standard-multicall.md) | Multicall Standard | 📝 |
| [9074](./LPs/lp-9074-create2-factory-standard.md) | CREATE2 Factory | 📝 |

---

### ⚙️ Core & Meta (0xxx)

> Architecture, governance, research, developer tools

| LP | Title | Status |
|:---|:------|:------:|
| [0000](./LPs/lp-0000-network-architecture-and-community-framework.md) | **Network Architecture** | ✅ |
| [0001](./LPs/lp-0001-primary-chain-native-tokens-and-tokenomics.md) | Tokenomics | 📝 |
| [0002](./LPs/lp-0002-virtual-machine-and-execution-environment.md) | VM & Execution | ✅ |
| [0003](./LPs/lp-0003-subnet-architecture-and-cross-chain-interoperability.md) | Subnet Architecture | ✅ |
| [0099](./LPs/lp-0099-lp-numbering-scheme-and-chain-organization.md) | LP Numbering Scheme | ✅ |

**Developer Tools:**

| LP | Title | Status |
|:---|:------|:------:|
| [0006](./LPs/lp-0006-network-runner-and-testing-framework.md) | Network Runner | 📝 |
| [0007](./LPs/lp-0007-vm-sdk-specification.md) | VM SDK | 📝 |
| [0008](./LPs/lp-0008-plugin-architecture.md) | Plugin Architecture | 📝 |
| [0009](./LPs/lp-0009-cli-tool-specification.md) | CLI Tool | 📝 |
| [0039](./LPs/lp-0039-lx-python-sdk-corollary-for-on-chain-actions.md) | Python SDK | 📝 |
| [0040](./LPs/lp-0040-wallet-standards.md) | Wallet Standards | 📝 |
| [0042](./LPs/lp-0042-multi-signature-wallet-standard.md) | Multi-Sig Wallet | 📝 |
| [0050](./LPs/lp-0050-developer-tools-overview.md) | Dev Tools Overview | 📝 |
| [0098](./LPs/lp-0098-luxfi-graphdb-and-graphql-engine-integration.md) | GraphDB & GraphQL | 📝 |

**Consensus:**

| LP | Title | Status |
|:---|:------|:------:|
| [0111](./LPs/lp-0111-photon-consensus-selection.md) | Photon Consensus | 📝 |
| [0112](./LPs/lp-0112-flare-dag-finalization-protocol.md) | Flare DAG Finalization | 📝 |

**Research:**

| LP | Title | Status |
|:---|:------|:------:|
| [0085](./LPs/lp-0085-security-audit-framework.md) | Security Audit Framework | 📝 |
| [0090](./LPs/lp-0090-research-papers-index.md) | Research Papers Index | 📝 |
| [0091](./LPs/lp-0091-payment-processing-research.md) | Payment Processing | 📝 |
| [0092](./LPs/lp-0092-cross-chain-messaging-research.md) | Cross-Chain Messaging | 📝 |
| [0093](./LPs/lp-0093-decentralized-identity-research.md) | Decentralized Identity | 📝 |
| [0094](./LPs/lp-0094-governance-framework-research.md) | Governance Framework | 📝 |
| [0095](./LPs/lp-0095-stablecoin-mechanisms-research.md) | Stablecoin Mechanisms | 📝 |
| [0096](./LPs/lp-0096-mev-protection-research.md) | MEV Protection | 📝 |
| [0097](./LPs/lp-0097-data-availability-research.md) | Data Availability | 📝 |

---

## Status Legend

| Symbol | Meaning |
|:------:|:--------|
| ✅ | Final - Implemented |
| 📝 | Draft - In Development |
| ⚠️ | Superseded |

---

## LP Process

```
💡 Idea → 📝 Draft → 🔄 Review → ⏰ Last Call → ✅ Final
```

1. **Discuss** on [Lux Forum](https://forum.lux.network)
2. **Draft** using `make new`
3. **Submit PR** (PR# = LP#)
4. **Review** by editors
5. **Consensus** through community discussion
6. **Last Call** (14 days)
7. **Final** - Ready for implementation

## Tools

```bash
make new          # Create new LP
make validate-all # Validate all LPs
make check-links  # Verify links
make stats        # Statistics
```

## Resources

- [Forum](https://forum.lux.network) • [Docs](https://docs.lux.network) • [Discord](https://discord.gg/luxfi) • [@luxfi](https://twitter.com/luxfi)

## License

[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)

---

<div align="center">
  <strong>Building the future of decentralized finance, one proposal at a time.</strong>
</div>
