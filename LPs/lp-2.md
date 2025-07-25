---
lp: 2
title: Lux Virtual Machine and Execution Environment
description: Specifies the Lux execution model, which is designed to be EVM-compatible while allowing future extensibility for new virtual machines.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-25
updated: 2025-07-25
---

## Abstract

LP-2 specifies the Lux execution model, which is designed to be EVM-compatible while allowing future extensibility for new virtual machines. The proposal’s primary goal is to leverage the rich developer ecosystem of Ethereum by supporting the Ethereum Virtual Machine (EVM) as a core smart contract engine. By adopting an EVM-compatible execution environment, Lux enables developers to deploy Solidity smart contracts and reuse existing tooling, compilers, and security audits – accelerating adoption through familiarity. This design choice mirrors the approach of other layer-1s like Avalanche (which implements an ARM-compatible “C-Chain” running the EVM) and Cosmos SDK chains that incorporate Ethereum’s Web3 API, thereby lowering the barrier for DApp migration. LP-2 details how Lux’s VM executes transactions deterministically across all validators in a subnet, and how it handles gas pricing, resource metering, and possible improvements over the vanilla EVM. One improvement under consideration is integrating the HyperSDK techniques (as pioneered by Avalanche) to increase throughput by parallelizing transaction processing and pre-validating blocks. Additionally, the proposal discusses modularity: while the default VM is the EVM for general-purpose computation, Lux’s architecture permits specialized VMs for particular subnets (for example, a WASM-based VM or application-specific state machines) without affecting other subnets. This modular execution approach is influenced by the heterogeneous multi-chain philosophy – each subnet can choose the VM that best fits its use case, whether it be for DeFi, gaming, or privacy-centric applications. The LP also covers the Smart Contract Standard Library and APIs that Lux provides, ensuring that contract behavior on Lux aligns with Ethereum’s well-understood semantics (for instance, compatibility with ERC-20, ERC-721 standards for tokens) to maximize cross-chain composability. By clearly defining the execution environment, LP-2 lays the groundwork for cross-chain dApp portability: an Ethereum dApp could be deployed on Lux with minimal changes, benefiting from Lux’s faster consensus and enhanced privacy features while preserving expected behavior. In summary, this proposal ensures that Lux’s computation layer is both developer-friendly and future-proof, combining the solidity of Ethereum’s VM model with the flexibility to incorporate next-generation execution engines as the ecosystem evolves.

## Motivation

[TODO]

## Specification

[TODO]

## Rationale

[TODO]

## Backwards Compatibility

[TODO]

## Security Considerations

[TODO]

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).