---
lp: 3
title: Lux Subnet Architecture and Cross-Chain Interoperability
description: Introduces Lux’s subnet architecture, wherein the network consists of multiple parallel blockchains (“subnets”) that can each host specialized applications, yet remain interconnected through a common platform.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-26
activation:
  flag: lp3-subnet-architecture
  hfName: ""
  activationHeight: "0"
---

## Abstract

## Activation

| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Flag string        | `lp3-subnet-architecture`                       |
| Default in code    | N/A                                             |
| Deployment branch  | N/A                                             |
| Roll-out criteria  | N/A                                             |
| Back-off plan      | N/A                                             |

LP-3 introduces Lux’s subnet architecture, wherein the network consists of multiple parallel blockchains (“subnets”) that can each host specialized applications, yet remain interconnected through a common platform. This design draws inspiration from Lux’s subnets and Polkadot’s parachains, aiming to combine scalability with flexibility. Each Lux subnet can have its own set of validators and customized parameters (consensus, virtual machine, regulatory rules), allowing enterprise or application-specific chains to operate independently while leveraging Lux’s overall security umbrella. The proposal describes how Lux’s primary chain (the “Mainnet” or coordination chain) keeps track of subnet metadata – analogous to Lux’s P-Chain maintaining validator registries or Polkadot’s Relay Chain coordinating parachains. Interoperability is achieved via Lux’s native cross-chain messaging protocol (nicknamed Teleport in this context), which enables subnets to transfer assets and data trustlessly. LP-3 details a cross-subnet communication mechanism similar to Lux Warp Messaging (AWM): when a transaction on Subnet A needs to be recognized on Subnet B, validators of A collectively sign a message that can be verified by B. Lux implements this via BLS multi-signatures aggregated across the validators of the sending subnet, producing a succinct proof of message authenticity. The destination subnet can verify the signature against the sending subnet’s known validator BLS public key (registered on the Lux main chain), thereby trusting the message if a supermajority of the source validators signed it. This approach avoids requiring a third-party bridge or centralized relays – the inter-chain communication is protocol-native. The LP contrasts this with other interoperability approaches: for example, Cosmos’s IBC protocol which uses a light-client verification on each chain, and Polkadot’s governed message passing via its Relay Chain. Lux’s teleport protocol is closer to Av...

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