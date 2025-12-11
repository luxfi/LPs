# Lux Proposals (LPs)

Lux Proposals (LPs) are the primary mechanism for proposing new features, gathering community input, and documenting design decisions for the [Lux Network](https://lux.network). This process ensures that changes to the network are transparently reviewed and achieve community consensus before implementation – much like Bitcoin’s BIPs and Ethereum’s EIPs, which allow anyone to propose and debate protocol improvements  .

## What is an LP?

A Lux Proposal (LP) is a design document that provides information to the Lux community about a proposed change to the system. LPs serve as the formal pathway to introduce improvements and build agreement on their adoption. They are used for:
- Proposing new features or standards – outlining technical specs for enhancements.
- Collecting community input – soliciting feedback and technical review from the community.
- Documenting design decisions – recording the rationale behind changes.

By using LPs, the Lux community can coordinate development in a decentralized manner, similar to the improvement proposal frameworks of other blockchains . Every network upgrade or standard in Lux originates from an LP, ensuring an open governance process.

## Quick Start
- 📖 New to LPs? Begin with LP-0, which provides an overview of the Lux Network architecture and the community contribution framework.
- 🚀 Create a new LP: Use the provided template by running make new (this invokes the ./scripts/new-lp.sh script) to scaffold a proposal draft.
- 📋 View all LPs: See [docs/INDEX.md](./docs/INDEX.md) for a complete list of proposals and their details.
- 🔍 Check status: See [docs/STATUS.md](./docs/STATUS.md) for the current status of each LP (Draft, Final, etc.).

## LP Index

| Number | Title | Author(s) | Type | Category | Status |
|:-------|:------|:----------|:-----|:---------|:-------|
| [LP-0000](./LPs/lp-0000-network-architecture-and-community-framework.md) | Lux Network Architecture & Community Framework | Lux Network Team | Meta | - | Final |
| [LP-0001](./LPs/lp-0001-primary-chain-native-tokens-and-tokenomics.md) | Primary Chain, Native Tokens, and Tokenomics |  | Standards Track | Core | Draft |
| [LP-0002](./LPs/lp-0002-virtual-machine-and-execution-environment.md) | Lux Virtual Machine and Execution Environment | Lux Network Team | Standards Track | Core | Final |
| [LP-0003](./LPs/lp-0003-subnet-architecture-and-cross-chain-interoperability.md) | Lux Subnet Architecture and Cross-Chain Interop... | Lux Network Team | Standards Track | Core | Final |
| [LP-0004](./LPs/lp-0004-quantum-resistant-cryptography-integration-in-lux.md) | Quantum-Resistant Cryptography Integration in Lux | Lux Network Team | Standards Track | Core | Final |
| [LP-0005](./LPs/lp-0005-quantum-safe-wallets-and-multisig-standard.md) | Lux Quantum-Safe Wallets and Multisig Standard | Lux Network Team | Standards Track | Core | Final |
| [LP-0006](./LPs/lp-0006-network-runner-and-testing-framework.md) | Network Runner & Testing Framework | Lux Network Team | Standards Track | Interface | Draft |
| [LP-0007](./LPs/lp-0007-vm-sdk-specification.md) | VM SDK Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-0008](./LPs/lp-0008-plugin-architecture.md) | Plugin Architecture | Lux Network Team | Standards Track | Core | Draft |
| [LP-0009](./LPs/lp-0009-cli-tool-specification.md) | CLI Tool Specification | Lux Network Team | Standards Track | Interface | Draft |
| [LP-0010](./LPs/lp-0010-p-chain-platform-chain-specification-deprecated.md) | P-Chain (Platform Chain) Specification [DEPRECA... | Lux Network Team | Standards Track | Core | Superseded |
| [LP-0011](./LPs/lp-0011-x-chain-exchange-chain-specification.md) | X-Chain (Exchange Chain) Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-0012](./LPs/lp-0012-c-chain-contract-chain-specification.md) | C-Chain (Contract Chain) Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-0013](./LPs/lp-0013-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md) | M-Chain – Decentralised MPC Custody & Swap-Sign... | Lux Protocol Team | Standards Track | Core | Draft |
| [LP-0014](./LPs/lp-0014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md) | M-Chain Threshold Signatures with CGG21 (UC Non... | Lux Industries Inc. | Standards Track | Core | Draft |
| [LP-0015](./LPs/lp-0015-mpc-bridge-protocol.md) | MPC Bridge Protocol | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-0016](./LPs/lp-0016-teleport-cross-chain-protocol.md) | Teleport Cross-Chain Protocol | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-0017](./LPs/lp-0017-bridge-asset-registry.md) | Bridge Asset Registry | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-0018](./LPs/lp-0018-cross-chain-message-format.md) | Cross-Chain Message Format | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-0019](./LPs/lp-0019-bridge-security-framework.md) | Bridge Security Framework | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-0020](./LPs/lp-0020-lrc-20-fungible-token-standard.md) | LRC-20 Fungible Token Standard | Lux Network Team | Standards Track | LRC | Final |
| [LP-0021](./LPs/lp-0021-teleport-protocol.md) | Lux Teleport Protocol | Gemini | Standards Track | Core | Draft |
| [LP-0022](./LPs/lp-0022-warp-messaging-20-native-interchain-transfers.md) | Warp Messaging 2.0: Native Interchain Transfers | Gemini | Standards Track | Networking | Draft |
| [LP-0023](./LPs/lp-0023-nft-staking-and-native-interchain-transfer.md) | NFT Staking and Native Interchain Transfer | Gemini | Standards Track | LRC | Draft |
| [LP-0024](./LPs/lp-0024-parallel-validation-and-shared-mempool.md) | Parallel Validation and Shared Mempool | Gemini | Standards Track | Core | Draft |
| [LP-0025](./LPs/lp-0025-l2-to-sovereign-l1-ascension-and-fee-model.md) | L2 to Sovereign L1 Ascension and Fee Model | Gemini | Standards Track | Core | Draft |
| [LP-0026](./LPs/lp-0026-c-chain-evm-equivalence-and-core-eips-adoption.md) | C-Chain EVM Equivalence and Core EIPs Adoption | Gemini | Standards Track | Core | Draft |
| [LP-0027](./LPs/lp-0027-lrc-token-standards-adoption.md) | LRC Token Standards Adoption | Gemini | Standards Track | LRC | Draft |
| [LP-0028](./LPs/lp-0028-lrc-20-burnable-token-extension.md) | LRC-20 Burnable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-0029](./LPs/lp-0029-lrc-20-mintable-token-extension.md) | LRC-20 Mintable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-0030](./LPs/lp-0030-lrc-20-bridgable-token-extension.md) | LRC-20 Bridgable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-0031](./LPs/lp-0031-lrc-721-burnable-token-extension.md) | LRC-721 Burnable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-0032](./LPs/lp-0032-c-chain-rollup-plugin-architecture.md) | C-Chain Rollup Plugin Architecture | Lux Network Team | Standards Track | Core | Draft |
| [LP-0033](./LPs/lp-0033-p-chain-state-rollup-to-c-chain-evm.md) | P-Chain State Rollup to C-Chain EVM | Lux Network Team | Standards Track | Core | Draft |
| [LP-0034](./LPs/lp-0034-p-chain-as-superchain-l2-op-stack-rollup-integration.md) | P-Chain as Superchain L2 – OP Stack Rollup Inte... | Zach Kelling and Lux Team | Standards Track | Core | Draft |
| [LP-0035](./LPs/lp-0035-stage-sync-pipeline-for-coreth-bootstrapping.md) | Stage-Sync Pipeline for Coreth Bootstrapping | Zach Kelling and Lux Team | Standards Track | Core | Draft |
| [LP-0036](./LPs/lp-0036-x-chain-order-book-dex-api-and-rpc-addendum.md) | X-Chain Order-Book DEX API & RPC Addendum | Zach Kelling and Lux Team | Standards Track | Interface | Draft |
| [LP-0037](./LPs/lp-0037-native-swap-integration-on-m-chain-x-chain-and-z-chain.md) | Native Swap Integration on M-Chain, X-Chain, an... | Lux Network Team | Standards Track | Core | Draft |
| [LP-0039](./LPs/lp-0039-lx-python-sdk-corollary-for-on-chain-actions.md) | LX Python SDK Corollary for On-Chain Actions | Lux Network Team | Informational | Interface | Draft |
| [LP-0040](./LPs/lp-0040-wallet-standards.md) | Wallet Standards | Lux Network Team | Standards Track | Interface | Draft |
| [LP-0042](./LPs/lp-0042-multi-signature-wallet-standard.md) | Multi-Signature Wallet Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0045](./LPs/lp-0045-z-chain-encrypted-execution-layer-interface.md) | Z-Chain Encrypted Execution Layer Interface | Zach Kelling and Lux Team | Standards Track | Interface | Draft |
| [LP-0050](./LPs/lp-0050-developer-tools-overview.md) | Developer Tools Overview | Lux Network Team | Meta | - | Draft |
| [LP-0060](./LPs/lp-0060-defi-protocols-overview.md) | DeFi Protocols Overview | Lux Network Team | Meta | - | Draft |
| [LP-0070](./LPs/lp-0070-nft-staking-standard.md) | NFT Staking Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0071](./LPs/lp-0071-media-content-nft-standard.md) | Media Content NFT Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0072](./LPs/lp-0072-bridged-asset-standard.md) | Bridged Asset Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0073](./LPs/lp-0073-batch-execution-standard-multicall.md) | Batch Execution Standard (Multicall) | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0074](./LPs/lp-0074-create2-factory-standard.md) | CREATE2 Factory Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0075](./LPs/lp-0075-tee-integration-standard.md) | TEE Integration Standard | Lux Network Team | Standards Track | Core | Draft |
| [LP-0076](./LPs/lp-0076-random-number-generation-standard.md) | Random Number Generation Standard | Lux Network Team | Standards Track | Core | Draft |
| [LP-0080](./LPs/lp-0080-a-chain-attestation-chain-specification.md) | A-Chain (Attestation Chain) Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-0081](./LPs/lp-0081-b-chain-bridge-chain-specification.md) | B-Chain (Bridge Chain) Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-0085](./LPs/lp-0085-security-audit-framework.md) | Security Audit Framework | Lux Network Team | Standards Track | Meta | Draft |
| [LP-0090](./LPs/lp-0090-research-papers-index.md) | Research Papers Index | Lux Network Team | Meta | - | Draft |
| [LP-0091](./LPs/lp-0091-payment-processing-research.md) | Payment Processing Research | Lux Network Team | Informational | - | Draft |
| [LP-0092](./LPs/lp-0092-cross-chain-messaging-research.md) | Cross-Chain Messaging Research | Lux Network Team | Informational | - | Draft |
| [LP-0093](./LPs/lp-0093-decentralized-identity-research.md) | Decentralized Identity Research | Lux Network Team | Informational | - | Draft |
| [LP-0094](./LPs/lp-0094-governance-framework-research.md) | Governance Framework Research | Lux Network Team | Informational | - | Draft |
| [LP-0095](./LPs/lp-0095-stablecoin-mechanisms-research.md) | Stablecoin Mechanisms Research | Lux Network Team | Informational | - | Draft |
| [LP-0096](./LPs/lp-0096-mev-protection-research.md) | MEV Protection Research | Lux Network Team | Informational | - | Draft |
| [LP-0097](./LPs/lp-0097-data-availability-research.md) | Data Availability Research | Lux Network Team | Informational | - | Draft |
| [LP-0098](./LPs/lp-0098-luxfi-graphdb-and-graphql-engine-integration.md) | Luxfi GraphDB & GraphQL Engine Integration | Lux Network Team, Luxfi Contributors | Standards Track | Interface | Draft |
| [LP-0099](./LPs/lp-0099-q-chain-quantum-secure-consensus-protocol-family-quasar.md) | Q-Chain – Root PQC with Quasar Consensus Protoc... | Lux Network Team | Standards Track | Core | Draft |
| [LP-0100](./LPs/lp-0100-nist-post-quantum-cryptography-integration-for-lux-network.md) | NIST Post-Quantum Cryptography Integration for ... | Lux Network Team | Standards Track | Core | Draft |
| [LP-0101](./LPs/lp-0101-solidity-graphql-extension-for-native-g-chain-integration.md) | Solidity GraphQL Extension for Native G-Chain I... | Lux Network Team | Standards Track | Core | Draft |
| [LP-0102](./LPs/lp-0102-immutable-training-ledger-for-privacy-preserving-ai.md) | Immutable Training Ledger for Privacy-Preservin... | Lux Network Team | Standards Track | Core | Draft |
| [LP-0103](./LPs/lp-0103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing.md) | MPC-LSS - Multi-Party Computation Linear Secret... | Lux Industries Inc., Vishnu | Standards Track | Core | Draft |
| [LP-0104](./LPs/lp-0104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa.md) | FROST - Flexible Round-Optimized Schnorr Thresh... | Lux Industries Inc. | Standards Track | Core | Draft |
| [LP-0105](./LPs/lp-0105-lamport-one-time-signatures-ots-for-lux-safe.md) | Lamport One-Time Signatures (OTS) for Lux Safe | Lux Network Team | Standards Track | Core | Draft |
| [LP-0106](./LPs/lp-0106-llm-gateway-integration-with-hanzo-ai.md) | LLM Gateway Integration with Hanzo AI | Lux Team, Hanzo Team | Standards Track | Interface | Draft |
| [LP-0110](./LPs/lp-0110-quasar-consensus-protocol.md) | Quasar Consensus Protocol | Lux Network Team | Standards Track | Core | Draft |
| [LP-0111](./LPs/lp-0111-photon-consensus-selection.md) | photon consensus selection | Lux Network Team | Standards Track | Core | Draft |
| [LP-0112](./LPs/lp-0112-flare-dag-finalization-protocol.md) | flare dag finalization protocol | Lux Network Team | Standards Track | Core | Draft |
| [LP-0118](./LPs/lp-0118-subnetevm-compat.md) | Subnet-EVM Compatibility Layer | Lux Network Team | Standards Track | Interface | Final |
| [LP-0176](./LPs/lp-0176-dynamic-gas-pricing.md) | Dynamic Gas Pricing Mechanism | Lux Network Team | Standards Track | Core | Final |
| [LP-0181](./LPs/lp-0181-epoching.md) | Epoching and Validator Rotation | Lux Protocol Team, Cam Schultz | Standards Track | Core | Final |
| [LP-0200](./LPs/lp-0200-post-quantum-cryptography-suite-for-lux-network.md) | Post-Quantum Cryptography Suite for Lux Network | Lux Industries Inc | Standards Track | Core | Draft |
| [LP-0201](./LPs/lp-0201-hybrid-classical-quantum-cryptography-transitions.md) | Hybrid Classical-Quantum Cryptography Transitions | Lux Industries Inc | Standards Track | Core | Draft |
| [LP-0202](./LPs/lp-0202-cryptographic-agility-framework.md) | Cryptographic Agility Framework | Lux Industries Inc | Standards Track | Core | Draft |
| [LP-0204](./LPs/lp-0204-secp256r1-curve-integration.md) | secp256r1 Curve Integration | Lux Protocol Team, Santiago Cammi, Arran Schlosberg | Standards Track | Core | Final |
| [LP-0226](./LPs/lp-0226-dynamic-minimum-block-times-granite-upgrade.md) | Dynamic Minimum Block Times (Granite Upgrade) | Lux Protocol Team, Stephen Buttolph, Michael Kaplan | Standards Track | Core | Final |
| [LP-0301](./LPs/lp-0301-lux-b-chain-cross-chain-bridge-protocol.md) | Lux B-Chain - Cross-Chain Bridge Protocol | Lux Partners | Standards Track | Core | Final |
| [LP-0302](./LPs/lp-0302-lux-z-a-chain-privacy-ai-attestation-layer.md) | Lux Z/A-Chain - Privacy & AI Attestation Layer | Lux Partners | Standards Track | Core | Final |
| [LP-0303](./LPs/lp-0303-lux-q-security-post-quantum-p-chain-integration.md) | Lux Q-Security - Post-Quantum P-Chain Integration | Lux Partners | Standards Track | Core | Final |
| [LP-0311](./LPs/lp-0311-ml-dsa-signature-verification-precompile.md) | ML-DSA Signature Verification Precompile | Lux Core Team | Standards Track | Core | Draft |
| [LP-0312](./LPs/lp-0312-slh-dsa-signature-verification-precompile.md) | SLH-DSA Signature Verification Precompile | Lux Core Team | Standards Track | Core | Draft |
| [LP-0313](./LPs/lp-0313-warp-messaging-precompile.md) | Warp Messaging Precompile | Lux Core Team | Standards Track | Core | Draft |
| [LP-0314](./LPs/lp-0314-fee-manager-precompile.md) | Fee Manager Precompile | Lux Core Team | Standards Track | Core | Draft |
| [LP-0315](./LPs/lp-0315-enhanced-cross-chain-communication-protocol.md) | Enhanced Cross-Chain Communication Protocol | Lux Core Team | Standards Track | Core | Draft |
| [LP-0316](./LPs/lp-0316-ml-dsa-post-quantum-digital-signatures.md) | ML-DSA Post-Quantum Digital Signatures | Lux Partners | Standards Track | Core | Final |
| [LP-0317](./LPs/lp-0317-slh-dsa-stateless-hash-based-digital-signatures.md) | SLH-DSA Stateless Hash-Based Digital Signatures | Lux Partners | Standards Track | Core | Final |
| [LP-0318](./LPs/lp-0318-ml-kem-post-quantum-key-encapsulation.md) | ML-KEM Post-Quantum Key Encapsulation | Lux Partners | Standards Track | Core | Final |
| [LP-0319](./LPs/lp-0319-m-chain-decentralised-mpc-custody.md) | M-Chain – Decentralised MPC Custody & Swap-Sign... | Lux Protocol Team | Standards Track | Core | Superseded |
| [LP-0320](./LPs/lp-0320-dynamic-evm-gas-limit-and-price-discovery-updates.md) | Dynamic EVM Gas Limit and Price Discovery Updates | Lux Core Team | Standards Track | Core | Final |
| [LP-0321](./LPs/lp-0321-frost-threshold-signature-precompile.md) | FROST Threshold Signature Precompile | Lux Core Team | Standards Track | Core | Draft |
| [LP-0322](./LPs/lp-0322-cggmp21-threshold-ecdsa-precompile.md) | CGGMP21 Threshold ECDSA Precompile | Lux Core Team | Standards Track | Core | Draft |
| [LP-0323](./LPs/lp-0323-lss-mpc-dynamic-resharing-extension.md) | LSS-MPC Dynamic Resharing Extension | Lux Core Team | Standards Track | Core | Draft |
| [LP-0324](./LPs/lp-0324-ringtail-threshold-signature-precompile.md) | Ringtail Threshold Signature Precompile | Lux Core Team | Standards Track | Core | Draft |
| [LP-0325](./LPs/lp-0325-kms-hardware-security-module-integration.md) | Lux KMS Hardware Security Module Integration | Lux Core Team | Standards Track | Core | Draft |
| [LP-0326](./LPs/lp-0326-blockchain-regenesis-and-state-migration.md) | Blockchain Regenesis and State Migration | Lux Core Team | Standards Track | Core | Draft |
| [LP-0327](./LPs/lp-0327-badgerdb-verkle-optimization.md) | BadgerDB + Verkle Tree Optimization Strategy | Lux Core Team | Standards Track | Core | Final |
| [LP-0329](./LPs/lp-0329-teleport-bridge-system-index.md) | Teleport Bridge System Index | Lux Protocol Team | Informational | Core | Draft |
| [LP-0330](./LPs/lp-0330-t-chain-thresholdvm-specification.md) | T-Chain (ThresholdVM) Specification | Lux Protocol Team | Standards Track | Core | Draft |
| [LP-0331](./LPs/lp-0331-b-chain-bridgevm-specification.md) | B-Chain - BridgeVM Specification | Lux Protocol Team | Standards Track | Core | Draft |
| [LP-0332](./LPs/lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md) | Teleport Bridge Architecture - Unified Cross-Ch... | Lux Partners | Standards Track | Core | Draft |
| [LP-0333](./LPs/lp-0333-dynamic-signer-rotation-with-lss-protocol.md) | Dynamic Signer Rotation with LSS Protocol | Lux Core Team | Standards Track | Core | Draft |
| [LP-0334](./LPs/lp-0334-per-asset-threshold-key-management.md) | Per-Asset Threshold Key Management | Lux Protocol Team | Standards Track | Core | Draft |
| [LP-0335](./LPs/lp-0335-bridge-smart-contract-integration.md) | Bridge Smart Contract Integration | Lux Partners | Standards Track | Bridge | Draft |
| [LP-0336](./LPs/lp-0336-k-chain-keymanagementvm-specification.md) | K-Chain (KeyManagementVM) Specification | Lux Protocol Team | Standards Track | Core | Draft |
| [LP-0337](./LPs/lp-0337-m-chain-multisigvm-specification.md) | M-Chain (MultisigVM) Specification [DEPRECATED] | Lux Protocol Team | Standards Track | Core | Withdrawn |
| [LP-0338](./LPs/lp-0338-teleport-relayer-network-specification.md) | Teleport Relayer Network Specification [DEPRECA... | Lux Protocol Team | Standards Track | Core | Withdrawn |
| [LP-0339](./LPs/lp-0339-bridge-security-emergency-procedures.md) | Bridge Security and Emergency Procedures | Lux Protocol Team | Standards Track | Bridge | Draft |
| [LP-0340](./LPs/lp-0340-unified-bridge-sdk-specification.md) | Unified Bridge SDK Specification | Lux Partners | Standards Track | SDK | Draft |
| [LP-0341](./LPs/lp-0341-decentralized-secrets-management-infisical-integration.md) | Decentralized Secrets Management Platform | Lux Protocol Team | Standards Track | Interface | Draft |
| [LP-0400](./LPs/lp-0400-automated-market-maker-protocol-with-privacy.md) | Automated Market Maker Protocol with Privacy | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0401](./LPs/lp-0401-confidential-lending-protocol.md) | Confidential Lending Protocol | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0402](./LPs/lp-0402-zero-knowledge-swap-protocol.md) | Zero-Knowledge Swap Protocol | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0403](./LPs/lp-0403-private-staking-mechanisms.md) | Private Staking Mechanisms | Lux Network Team | Standards Track | LRC | Draft |
| [LP-0500](./LPs/lp-0500-layer-2-rollup-framework.md) | Layer 2 Rollup Framework | Lux Network Team, Hanzo AI, Zoo Protocol | Standards Track | Core | Draft |
| [LP-0501](./LPs/lp-0501-data-availability-layer.md) | Data Availability Layer | Lux Network Team, Hanzo AI, Zoo Protocol | Standards Track | Core | Draft |
| [LP-0502](./LPs/lp-0502-fraud-proof-system.md) | Fraud Proof System | Lux Network Team, Hanzo AI, Zoo Protocol | Standards Track | Core | Draft |
| [LP-0503](./LPs/lp-0503-validity-proof-system.md) | Validity Proof System | Lux Network Team, Hanzo AI, Zoo Protocol | Standards Track | Core | Draft |
| [LP-0504](./LPs/lp-0504-sequencer-registry-protocol.md) | Sequencer Registry Protocol | Lux Network Team, Hanzo AI, Zoo Protocol | Standards Track | Core | Draft |
| [LP-0505](./LPs/lp-0505-l2-block-format-specification.md) | L2 Block Format Specification | Lux Network Team, Hanzo AI, Zoo Protocol | Standards Track | Core | Draft |
| [LP-0601](./LPs/lp-0601-dynamic-gas-fee-mechanism-with-ai-compute-pricing.md) | Dynamic Gas Fee Mechanism with AI Compute Pricing | Lux Core Team | Standards Track | Core | Draft |
| [LP-0602](./LPs/lp-0602-warp-cross-chain-messaging-protocol.md) | Warp Cross-Chain Messaging Protocol | Lux Core Team | Standards Track | Networking | Draft |
| [LP-0603](./LPs/lp-0603-warp-15-quantum-safe-cross-chain-messaging.md) | Warp 1.5 - Quantum-Safe Cross-Chain Messaging | Lux Core Team | Standards Track | Networking | Final |
| [LP-0604](./LPs/lp-0604-state-sync-and-pruning-protocol.md) | State Sync and Pruning Protocol | Lux Core Team | Standards Track | Core | Draft |
| [LP-0605](./LPs/lp-0605-elastic-validator-subnets.md) | Elastic Validator Subnets | Lux Core Team | Standards Track | Core | Draft |
| [LP-0606](./LPs/lp-0606-verkle-trees-for-efficient-state-management.md) | Verkle Trees for Efficient State Management | Lux Core Team | Standards Track | Core | Draft |
| [LP-0607](./LPs/lp-0607-gpu-acceleration-framework.md) | GPU Acceleration Framework | Lux Core Team | Standards Track | Core | Draft |
| [LP-0608](./LPs/lp-0608-high-performance-decentralized-exchange-protocol.md) | High-Performance Decentralized Exchange Protocol | Lux Core Team | Standards Track | LRC | Draft |
| [LP-0721](./LPs/lp-0721-lrc-721-non-fungible-token-standard.md) | LRC-721 Non-Fungible Token Standard | Lux Network Team | Standards Track | LRC | Final |
| [LP-1155](./LPs/lp-1155-lrc-1155-multi-token-standard.md) | LRC-1155 Multi-Token Standard | Lux Network Team | Standards Track | LRC | Final |
| [LP-2000](./LPs/lp-2000-ai-mining-standard.md) | AI Mining Standard | Hanzo AI, Lux Network, Zoo Labs | Standards Track | Core | Draft |
| [LP-2001](./LPs/lp-2001-aivm-ai-virtual-machine.md) | AIVM - AI Virtual Machine | Hanzo AI, Lux Network | Standards Track | Core | Draft |

### Notable LRCs (Application Standards)

| LRC Number | LP | Title | Status |
|:-----------|:----|:------|:-------|
| LRC-20 | [LP-0020](./LPs/lp-0020-lrc-20-fungible-token-standard.md) | LRC-20 Fungible Token Standard | Final |
| LRC-23 | [LP-0023](./LPs/lp-0023-nft-staking-and-native-interchain-transfer.md) | NFT Staking and Native Interchain Transfer | Draft |
| LRC-27 | [LP-0027](./LPs/lp-0027-lrc-token-standards-adoption.md) | LRC Token Standards Adoption | Draft |
| LRC-20 | [LP-0028](./LPs/lp-0028-lrc-20-burnable-token-extension.md) | LRC-20 Burnable Token Extension | Draft |
| LRC-20 | [LP-0029](./LPs/lp-0029-lrc-20-mintable-token-extension.md) | LRC-20 Mintable Token Extension | Draft |
| LRC-20 | [LP-0030](./LPs/lp-0030-lrc-20-bridgable-token-extension.md) | LRC-20 Bridgable Token Extension | Draft |
| LRC-721 | [LP-0031](./LPs/lp-0031-lrc-721-burnable-token-extension.md) | LRC-721 Burnable Token Extension | Draft |
| LRC-42 | [LP-0042](./LPs/lp-0042-multi-signature-wallet-standard.md) | Multi-Signature Wallet Standard | Draft |
| LRC-70 | [LP-0070](./LPs/lp-0070-nft-staking-standard.md) | NFT Staking Standard | Draft |
| LRC-71 | [LP-0071](./LPs/lp-0071-media-content-nft-standard.md) | Media Content NFT Standard | Draft |
| LRC-72 | [LP-0072](./LPs/lp-0072-bridged-asset-standard.md) | Bridged Asset Standard | Draft |
| LRC-73 | [LP-0073](./LPs/lp-0073-batch-execution-standard-multicall.md) | Batch Execution Standard (Multicall) | Draft |
| LRC-74 | [LP-0074](./LPs/lp-0074-create2-factory-standard.md) | CREATE2 Factory Standard | Draft |
| LRC-400 | [LP-0400](./LPs/lp-0400-automated-market-maker-protocol-with-privacy.md) | Automated Market Maker Protocol with Privacy | Draft |
| LRC-401 | [LP-0401](./LPs/lp-0401-confidential-lending-protocol.md) | Confidential Lending Protocol | Draft |
| LRC-402 | [LP-0402](./LPs/lp-0402-zero-knowledge-swap-protocol.md) | Zero-Knowledge Swap Protocol | Draft |
| LRC-403 | [LP-0403](./LPs/lp-0403-private-staking-mechanisms.md) | Private Staking Mechanisms | Draft |
| LRC-608 | [LP-0608](./LPs/lp-0608-high-performance-decentralized-exchange-protocol.md) | High-Performance Decentralized Exchange Protocol | Draft |
| LRC-721 | [LP-0721](./LPs/lp-0721-lrc-721-non-fungible-token-standard.md) | LRC-721 Non-Fungible Token Standard | Final |
| LRC-1155 | [LP-1155](./LPs/lp-1155-lrc-1155-multi-token-standard.md) | LRC-1155 Multi-Token Standard | Final |

## LP Process

To ensure each proposal is thoroughly vetted and agreed upon, Lux Proposals follow a structured process:
1.    💡 Have an idea – Begin by discussing your idea with the community (for example, on the Lux forum). Early discussion helps refine the idea and gauge community interest, much like how Bitcoin proposals start on mailing lists before formalization .
2.    📝 Draft your LP – Using the template provided (via make new), write a draft of the proposal. This draft should clearly outline the problem, the proposed solution, and technical details.
3.    🔄 Submit a Pull Request – Submit your LP as a pull request to the luxfi/LPs repository. The pull request number will be assigned as the official LP number.
4.    👥 Get reviewed – The LP editors (maintainers of the proposals repository) will review the draft for completeness, correct formatting, and adherence to the guidelines. They may request changes or improvements before acceptance.
5.    🤝 Build consensus – Once the draft is published, the wider community discusses the proposal (on forums, Discord, GitHub discussions, etc.). Feedback is incorporated by the author to address concerns and build rough consensus that the change is worthwhile.
6.    ⏰ Last Call – After consensus emerges, the proposal enters a Last Call status, a final 14-day review period . This gives any remaining stakeholders a chance to raise objections or point out issues. If no major issues arise during this time, the proposal moves forward.
7.    ✅ Final – With successful completion of Last Call, the LP is marked Final. A Final LP signifies the proposal is accepted as a standard and is ready for implementation. At this stage, it should only be updated for minor corrections or clarifications. Implementation (in client code, smart contracts, etc.) can proceed, and the changes defined by the LP become part of the Lux Network.

Throughout this process, the goal is to emulate the best practices of open governance in blockchain communities: transparent discussion, iterative improvement, and broad consensus  . Just as Ethereum’s core updates consist of sets of EIPs that clients must implement to stay in consensus , Lux uses LPs to coordinate network upgrades and standards.

## Types of LPs

Not all proposals are alike. Lux Proposals are categorized by their purpose and scope, similar to the categorization in Ethereum’s EIP process :
- Standards Track: Proposals that involve technical changes affecting the Lux protocol or network on a broad scale. These include:
- Core: Changes to core consensus or network rules (e.g. consensus algorithm modifications or upgrades that require coordination across all nodes).
- Networking: Improvements to peer-to-peer networking, communication protocols, or other network-layer changes.
- Interface: Specifications for client APIs, RPC interfaces, and language-level standards that developers use to interact with Lux.
- LRC (Lux Request for Comments): Application-layer standards, such as token standards and smart contract interfaces (e.g. fungible token specs, NFT standards, naming systems). LRC proposals are analogous to Ethereum’s ERC category, defining how applications and assets operate on Lux .
- Meta: Proposals about the process itself or governance of the Lux ecosystem. Meta LPs do not alter the protocol but rather propose changes to processes, decision-making, or tools (for example, the proposal defining the LP process would be a Meta LP). These typically require community consensus to implement, similar to how Ethereum uses Meta EIPs for process changes .
- Informational: Proposals that provide general guidelines, design recommendations, or other information to the community. These do not propose new features or require adoption; they are simply for disseminating best practices or design philosophies. (The community is free to follow or ignore informational LPs.)

## Tools and Commands

To help manage the LP workflow, this repository provides a Makefile and helper scripts. Common tasks include:

### Create a new LP from the template
make new

### Validate a specific LP (checks formatting, front-matter, etc.)
make validate FILE=LPs/lp-20.md

### Validate all LPs in the repository
make validate-all

### Check all hyperlinks in LP documents for validity
make check-links

### Update the index (INDEX.md) based on current LP files
make update-index

### Show statistics (e.g., counts by status or category)
make stats

### Run all checks (validation, links, etc.) before submitting a PR
make pre-pr

## Managing LP discussions (requires GitHub CLI):

For governance and transparency, each LP can have an associated discussion thread on the Lux forum or GitHub Discussions. The following commands use the GitHub CLI to create and manage proposal discussion posts:

### Create a GitHub Discussion for an LP (in the "LP Discussions" category of the repo)
gh discussion create --repo luxfi/LPs \
  --category "LP Discussions" \
  --title "LP <number>: <Proposal Title>" \
  --body "Discussion for LP-<number>: https://github.com/luxfi/LPs/blob/main/LPs/lp-<number>.md"

### List existing discussion categories (to confirm the category name or ID)
gh api repos/luxfi/LPs/discussions/categories

These tools ensure that proposal authors can easily format their submissions and that reviewers can quickly verify consistency. They are especially useful as the number of proposals grows.

## Development Roadmap

The Lux Network’s evolution is planned in phases, with each phase focusing on a set of milestones and features. This phased development roadmap provides context for many LPs (especially Standards Track proposals targeting specific phases):
- Phase 1 (Q1 2025): Foundational Governance & Core Protocol – Establish governance structures and launch core network functionality (consensus, base chains, native token). LPs in the 0–9 range (core framework and token standard) fall under this phase.
- Phase 2 (Q2 2025): Execution Environment & Asset Standards – Develop the execution layer (e.g. virtual machine support) and introduce asset standards (like LRC-20). This phase includes proposals like VM specifications and token standards.
- Phase 3 (Q3 2025): Cross-Chain Interoperability – Enable seamless interaction between Lux subnets/chains and external chains. Bridge protocols (LPs 15–19) and cross-chain message formats are addressed here.
- Phase 4 (Q4 2025): Attestations & Compliance – Introduce identity attestations, compliance frameworks, and features for regulatory integration. (Expect LPs dealing with identity, KYC/AML frameworks, etc.)
- Phase 5 (Q1 2026): Privacy & Zero-Knowledge – Implement privacy-preserving technology and zero-knowledge proof integrations (such as the Z-Chain and privacy enhancements in transactions).
- Phase 6 (Q2 2026): Data Availability & Scalability – Improve data availability solutions (for off-chain data or rollups) and scale throughput of the network.
- Phase 7 (Q3 2026 and beyond): Application Layer Standards – Focus on higher-level standards for DeFi, DAO governance, and dApp development to enrich the ecosystem (e.g. advanced smart contract standards, financial primitives, etc.).

See the phases/ directory for detailed specifications and design documents for each development phase. Each phase’s completion is marked by the implementation of key LPs associated with that phase.

## Contributing

We warmly welcome community contributions to the Lux Proposal process and the Lux Network in general. To get involved:
- Read the CONTRIBUTING.md guide for general contribution guidelines and tips on how to write a good LP.
- Review LP-0 for the community framework and overall architecture – this provides important context if you plan to propose changes.
- Check GOVERNANCE.md for details on how decisions are made in the Lux community and the formal governance process (off-chain and on-chain governance, voting, etc.).

Whether you want to author a new proposal, improve existing ones, or simply offer feedback, your participation is valuable. All LPs start as ideas from community members – your ideas could shape the future of Lux!

## Resources
- 🌐 Forum: Join the discussion on the Lux Forum – a great place for informal proposal ideas and community Q&A.
- 📚 Documentation: Explore the Lux Network Docs for technical documentation, tutorials, and background on Lux architecture.
- 💬 Discord: Chat with core developers and community members in real-time on Discord.
- 🐦 Twitter: Follow @luxdefi on Twitter for announcements, updates, and highlights of new proposals.

These resources will help you stay informed and get support as you work with Lux and LPs.

## License

All LPs are released under the CC0 1.0 Universal Public Domain Dedication. This means that the proposals are in the public domain – you are free to share and adapt them without restriction. We believe that open standards and protocols best serve the community when they are unencumbered by proprietary restrictions.

⸻


<div align="center">
  <strong>Building the future of decentralized finance, one proposal at a time.</strong>
</div>


Sources:
1.    Bitcoin Magazine – What Is A Bitcoin Improvement Proposal (BIP)?  (illustrating the purpose of BIPs in Bitcoin’s governance).
2.    Crypto.com Glossary – Ethereum Improvement Proposals (EIPs)   (explaining EIPs and their categories, which Lux’s LPs mirror).
3.    Investopedia – What Is ERC-20?   (describing Ethereum’s token standards ERC-20 and ERC-721, analogous to Lux’s LRC-20 and LRC-721 standards).
