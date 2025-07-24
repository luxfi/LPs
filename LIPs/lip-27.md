---
lip: 27
title: 'LRC Token Standards Adoption'
description: Adopts and rebrands key Ethereum Request for Comment (ERC) token standards as Lux Request for Comment (LRC) standards for the Lux ecosystem.
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-07-22
requires: 26
---

## Abstract

To ensure seamless compatibility, developer familiarity, and a unified brand identity, this LIP formalizes the adoption of essential Ethereum token standards as Lux Request for Comment (LRC) standards. This proposal specifies the direct mapping of the most widely-used ERCs to their LRC counterparts (e.g., ERC-20 becomes LRC-20). It defines the canonical interfaces for these standards and designates the contracts within the `/standard` repository as the official reference implementation for the Lux ecosystem.

## Motivation

A standardized token interface is the bedrock of a composable DeFi and NFT ecosystem. Smart contracts must be able to interact with any token in a predictable way. By adopting the battle-tested ERC standards, we:

*   **Lower the Barrier to Entry:** Developers familiar with Ethereum can build on Lux with zero learning curve for token interactions.
*   **Enable Instant Composability:** All wallets, dApps, and protocols on Lux can support any LRC token from day one.
*   **Establish a Unified Brand:** Using the "LRC" prefix clearly identifies tokens that adhere to the official Lux Network standard, enhancing trust and clarity.
*   **Avoid Reinventing the Wheel:** We leverage years of community vetting and security audits that have gone into the core Ethereum standards.

## Specification


This LIP formally adopts and rebrands the core Ethereum token standards as Lux Request for Comment (LRC) interfaces. For full specifications, see the respective LIPs:

| LRC Standard | Maps To  | LIP Reference    |
|-------------:|:--------:|:-----------------|
| LRC-20           | ERC-20      | [LIP-20](./lip-20.md)    |
| LRC-20Burnable   | IERC20Burnable   | [LIP-28](./lip-28.md)    |
| LRC-20Mintable   | IERC20Mintable   | [LIP-29](./lip-29.md)    |
| LRC-20Bridgable  | IERC20Bridgable  | [LIP-30](./lip-30.md)    |
| LRC-721          | ERC-721     | [LIP-721](./lip-721.md)  |
| LRC-721Burnable  | IERC721Burnable  | [LIP-31](./lip-31.md)    |
| LRC-1155         | ERC-1155    | [LIP-1155](./lip-1155.md)|

## Rationale

By adopting the battle-tested ERC token interfaces, Lux ensures maximum developer familiarity, composability, and interoperability. The LRC prefix both clarifies official Lux approvals and maintains a consistent brand identity.

## Backwards Compatibility

This proposal is fully backwards compatible. It formalizes and rebrands existing de-facto standards. Contracts compliant with the original ERC interfaces remain compliant with their corresponding LRC standards.

## Security Considerations

The security considerations for LRC-20, LRC-721, and LRC-1155 are inherited from their ERC counterparts. Implementers must ensure correct adherence to the interface and avoid introducing vulnerabilities in custom logic.

## Reference Implementation

The canonical reference implementations for LRC standards are maintained in the `/standard` repository. Implementations must be renamed and structured to use the LRC prefix (for example, `ERC721.sol` → `LRC721.sol`).
