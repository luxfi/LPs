---
lip: 1
title: Lux Consensus – Simplex BFT Protocol Integration
description: Describes Lux’s adoption of the Simplex Byzantine Fault Tolerant (BFT) consensus protocol to secure its network, detailing its design goals of fast finality, fairness, and robustness.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Final
type: Standards Track
category: Core
created: 2025-01-24
---

## Abstract

LIP-1 describes Lux’s adoption of the Simplex Byzantine Fault Tolerant (BFT) consensus protocol to secure its network, detailing its design goals of fast finality, fairness, and robustness. Simplex is a recently peer-reviewed consensus algorithm (TCC 2023) noted for its simplicity (no complex view-change subprotocol) and high performance. Under Lux’s implementation, a rotating leader proposes blocks each round and votes are collected from validators, reaching finality in as little as 400 ms under network synchrony – outperforming classical BFT protocols like PBFT or HotStuff in theoretical latency. The summary of academic results shows Simplex matching or improving the latency of essentially all competing BFT protocols, which aligns with Lux’s priority on fast confirmation. Like other modern BFT consensus (e.g. Tendermint, Algorand’s Agreement), Lux’s Simplex tolerates up to $f < 1/3$ Byzantine validators and achieves deterministic safety. However, unlike leaderless probabilistic protocols (such as Avalanche’s Snowball consensus ￼), Simplex uses an elected leader per round – a design that, due to careful leader rotation and avoidance of timeout-based view changes, provides both liveness and censorship-resistance. LIP-1 articulates why this protocol was chosen: it has been vetted by the academic community and offers fast finality and simplicity of implementation, aligning with Lux’s goal of high throughput without sacrificing security. The proposal also discusses how Lux tailors the Simplex protocol to a Proof-of-Stake setting (each validator’s vote weighted by stake, similar to adapting PBFT to PoS). In comparison to Ethereum’s current PoS BFT consensus (Casper/HotStuff based finality) which targets ~12s blocks and probabilistic finality, Lux’s Simplex aims for sub-second finality under normal conditions. By integrating this state-of-the-art consensus, Lux provides rapid transaction confirmations and strong consistency guarantees, forming the backbone for the network’s performance.

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