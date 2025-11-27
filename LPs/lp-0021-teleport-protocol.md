---
lp: 0021
title: Lux Teleport Protocol
description: A framework for native, trust-minimized cross-chain asset transfers using MPC-powered burn-and-mint or lock-and-release mechanisms.
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-07-22
requires:
replaces:
---

## Abstract

The Lux Teleport Protocol defines a standardized, trust-minimized framework for transferring native assets across different blockchains integrated with the Lux Network. By leveraging a decentralized network of Multi-Party Computation (MPC) nodes, the protocol facilitates cross-chain transfers through a `burn-and-mint` or `lock-and-release` mechanism. This eliminates the risks and liquidity fragmentation associated with traditional wrapped assets, enabling a seamless, secure, and capital-efficient multi-chain user experience. The protocol supports EVM, UTXO (Lux-like), and other blockchain architectures, providing a unified solution for interoperability.

## Motivation

The current multi-chain landscape is fragmented. Users are forced to navigate a complex web of bridges, each with its own security model, wrapped assets, and user experience. This creates significant friction, exposes users to security risks (e.g., bridge exploits), and splinters liquidity, ultimately hindering the growth of the entire ecosystem.

The Lux Teleport Protocol addresses these problems by:

*   **Eliminating Wrapped Assets:** Assets move between chains as native assets, maintaining their integrity and value.
*   **Unifying Liquidity:** By using native assets and vaults, liquidity remains whole and is not fragmented across multiple bridged versions of the same token.
*   **Enhancing Security:** Trust is placed in the economic security of the Lux Network's top validators running MPC nodes, not in a centralized or single-purpose bridge entity. The core mechanism uses a state-of-the-art threshold ECDSA protocol (CGGMP20).
*   **Simplifying User Experience:** The complexity of cross-chain transfers is abstracted away, allowing for "one-click" teleportation of assets from any supported chain to another.
*   **Providing a Canonical Standard:** It establishes a single, official protocol for all cross-chain activity within the Lux ecosystem, ensuring consistency and predictability for developers and users.

## Specification

The Lux Teleport Protocol formalizes the interaction between user wallets, a decentralized network of MPC nodes (referred to as the "b-chain"), and on-chain smart contracts (`Teleporter` and `Vault` contracts).

**1. Core Components:**

*   **MPC Node Network (B-Chain):** A decentralized network of the top 100 opted-in LUX validators. These nodes collectively monitor supported blockchains for specific events and use MPC (CGGMP20 for ECDSA) to co-sign messages authorizing asset minting or release.
*   **Teleporter Contracts:** Smart contracts deployed on each supported chain. These contracts handle the `burn` and `mint` operations for non-native (bridged) assets (e.g., `ERC20B`).
*   **Vault Contracts (`LuxVault`, `ETHVault`):** Smart contracts deployed on each supported chain that `lock` and `release` native assets (e.g., LUX, ETH).
*   **Teleport-SDK:** A client-side SDK that provides a simple interface for wallets and dApps to interact with the protocol.

**2. Workflow:**

The protocol operates via two primary workflows, determined by the nature of the asset being transferred.

**A) Burn-and-Mint (for Wrapped/Bridged Assets):**

1.  **Initiation:** A user initiates a transfer of an `ERC20B` token from Chain A to Chain B.
2.  **Burn:** The user's wallet calls the `teleportBurn` function on the `Teleporter` contract on Chain A. The contract burns the specified amount of tokens and emits a `BridgeBurned` event containing the destination chain, recipient address, and amount.
3.  **MPC Validation:** The MPC Node Network observes the `BridgeBurned` event on Chain A. A threshold of nodes validates the transaction.
4.  **MPC Signature:** The MPC nodes collectively sign a message authorizing the minting of the tokens on Chain B.
5.  **Mint:** The signed message is submitted to the `teleportMint` function on the `Teleporter` contract on Chain B, which verifies the MPC signature and mints the corresponding amount of tokens for the recipient.

**B) Lock-and-Release (for Native Assets):**

1.  **Initiation:** A user initiates a transfer of a native asset (e.g., ETH) from Chain A to Chain B.
2.  **Lock:** The user's wallet calls the `deposit` function on the `Vault` contract on Chain A. The contract locks the assets and emits a `VaultDeposit` event.
3.  **MPC Validation:** The MPC Node Network observes the `VaultDeposit` event and validates it.
4.  **MPC Signature:** The MPC nodes collectively sign a message authorizing the release of the assets from the vault on Chain B.
5.  **Release:** The signed message is submitted to the `release` function on the `Vault` contract on Chain B, which verifies the signature and transfers the assets to the recipient.

**C) UTXO Chains (e.g., Lux X-Chain):**

1.  **Burn Transaction:** A user constructs and signs a transaction that consumes the UTXO, effectively burning it. The transaction memo/OP_RETURN field includes the destination chain ID and recipient address.
2.  **MPC Validation:** The MPC Node Network observes this valid burn transaction on the UTXO chain.
3.  **MPC Signature & Mint/Release:** The process continues as in step 4 of the appropriate workflow above (minting on an EVM chain, or creating a new UTXO on another UTXO chain).

## Rationale

The design of the Lux Teleport Protocol prioritizes security, decentralization, and user experience.

*   **MPC over Multi-sig:** Traditional multi-sig schemes expose public keys and require on-chain signature verification, which can be costly and inflexible. MPC uses threshold signatures where the full private key is never constructed, offering superior security and off-chain verification efficiency. CGGMP20 is a well-regarded and audited protocol for this purpose.
*   **Dual Workflow (Burn/Mint vs. Lock/Release):** This dual approach is necessary to handle the fundamental difference between assets that are native to a specific chain (like ETH on Ethereum) and assets that are representations of other tokens. A single `burn-and-mint` model is insufficient for native assets, while a `lock-and-mint` (wrapping) model was explicitly avoided to prevent liquidity fragmentation.
*   **Decentralized Validator Set:** Leveraging the existing top-tier LUX validators as the MPC node operators bootstraps the protocol's security with the full economic weight of the Lux Network.

## Backwards Compatibility

This LP is designed to formalize and standardize an existing, operational system. It introduces no backwards incompatibilities. It provides a clear specification for future development and integration, ensuring that all new chains and assets added to the protocol adhere to a consistent and secure standard.

## Test Cases

Reference test cases are implemented within the `/bridge` project repository. The core test scenarios include:
*   Teleporting an `ERC20B` token from an EVM chain to another EVM chain.
*   Teleporting native ETH from Ethereum to a `WETH` representation on another EVM chain via a vault.
*   Teleporting a UTXO asset from the X-Chain to an EVM chain.
*   Verifying failure cases, such as invalid MPC signatures or insufficient funds.

## Reference Implementation

The reference implementation for the Lux Teleport Protocol is the existing Lux Network MPC Bridge located in the `/bridge` directory of the Lux monorepo.
*   **Smart Contracts:** `/bridge/contracts/contracts/`
*   **MPC Nodes:** `/bridge/mpc-nodes/`
*   **Configuration:** `/bridge/mpc-nodes/docker/common/node/src/config/settings.ts`

## Implementation

### Local Bridge Components
**Repository Location**: `/Users/z/work/lux/bridge/`

### Smart Contracts
- **Teleporter Contracts**: `/Users/z/work/lux/bridge/contracts/`
  - ERC20 burn/mint logic (L2→L2, L1→L2)
  - Vault contracts for native assets
  - MPC signature verification

- **Example Contract Addresses**:
  - Teleporter: Deployed per chain
  - Vault: Native asset (ETH/LUX) locking
  - Configuration: Via bridge governance

### MPC Node Implementation
- **MPC Network**: Top 100 Lux validators
- **Configuration**:
  - Threshold ECDSA (CGGMP20 protocol)
  - Network coordination: Docker-based setup
  - Key management: Hardware Security Module (HSM) support

### Testing and Deployment
```bash
cd /Users/z/work/lux/bridge
docker-compose -f compose.local.yml up -d  # Local bridge testing
cd test/
# Run bridge integration tests
```

### Cross-Chain Testing
- **Test Cases**: `/Users/z/work/lux/bridge/test/`
  - ERC20 burn-and-mint verification
  - Vault lock-and-release scenarios
  - UTXO chain interoperability
  - MPC signature validation

### GitHub Repository
- **Main Repository**: https://github.com/luxfi/bridge
- **Contract Interfaces**: Publicly available
- **Documentation**: Bridge protocol specification

### Integration with Other LPs
- **LP-22**: Warp 2.0 for intra-ecosystem chains
- **LP-23**: NFT teleportation using this protocol
- **LP-19**: Security framework for bridge operations

## Security Considerations

The security of the Teleport Protocol rests on several pillars:
1.  **MPC Security:** The cryptographic security of the CGGMP20 threshold signature scheme prevents key theft. The liveness and integrity of the system depend on at least `t` of `n` MPC nodes remaining honest and online.
2.  **Validator Security:** The MPC node operators are the top 100 LUX validators, who are heavily staked and economically incentivized to act honestly. Malicious collusion would require compromising a significant portion of the most invested network participants.
3.  **Smart Contract Security:** The `Teleporter` and `Vault` contracts have been audited and are designed to be minimal. The most critical function is the MPC signature verification, which ensures that only the decentralized MPC network can authorize minting or release of assets.
4.  **Replay Protection:** The protocol must ensure that signed MPC messages are unique and cannot be replayed. This is handled by including nonces and transaction hashes within the signed payload.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
