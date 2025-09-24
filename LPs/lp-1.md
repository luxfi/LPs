---
lp: 1
title: Primary Chain, Native Tokens, and Tokenomics
description: Defines Lux native currency (LUX), tokenomics, and core chain identifiers for the network.
author: ''
status: Draft
type: Standards Track
category: Core
created: 2025-07-24
discussions-to: https://github.com/luxfi/lps/discussions
---

## Abstract

This LP defines the native tokens of the Lux Network, including the LUX currency, and outlines the tokenomics of the network. It also establishes a standardized identification system for the various chains within the Lux ecosystem.

## Motivation

Lux requires a canonical definition of its native currency and a consistent scheme for identifying core chains to ensure interoperability, tooling compatibility, and clear economics. A formal specification prevents ambiguity across wallets, explorers, SDKs, and token‑related protocols.

## Specification

- Native token ticker: `LUX`.
- Total supply: 1,000,000,000 LUX at genesis; distribution as defined below.
- Chain identifiers: single‑character codes reserved network‑wide — `P`, `C`, `X`, `M`, `Z`, `G`.
- Fees: All on‑chain transaction fees are denominated in LUX.
- Governance: LUX may be used in protocol governance per future LPs.

## Native Token

The native token of the Lux Network is **LUX**.

### LUX Currency

LUX is the primary currency of the Lux Network and is used for:

*   **Staking**: Users can stake LUX to secure the network and earn rewards.
*   **Transaction Fees**: All transaction fees on the network are paid in LUX.
*   **Governance**: LUX holders can participate in the governance of the network.

### Tokenomics

*   **Total Supply**: 1,000,000,000 LUX
*   **Initial Distribution**:
    *   **Team**: 15%
    *   **Investors**: 20%
    *   **Ecosystem Fund**: 30%
    *   **Community**: 35%

## Chain Identification

The following single-character identifiers are assigned to the core chains of the Lux Network:

*   **P**: The Primary Network Chain.
*   **C**: The Contract Chain (C-Chain).
*   **X**: The Exchange Chain (X-Chain).
*   **M**: The MPC (Multi-Party Computation) Chain.
*   **Z**: The Z-Chain for privacy features.
*   **G**: The Graph Chain (G-Chain), a universal omnichain oracle.

## Reserved LPs for Chains

LP numbers 2 through 9 are reserved for future chain definitions.

*   **LP-2**: P-Chain
*   **LP-3**: C-Chain
*   **LP-4**: X-Chain
*   **LP-5**: M-Chain
*   **LP-6**: Z-Chain
*   **LP-7**: G-Chain

## Rationale

- Short, human‑readable chain codes simplify UX and reduce error rates in cross‑chain references.
- A fixed ticker and total supply at genesis creates a stable foundation for economic modeling and tooling.

## Backwards Compatibility

This is a foundational specification. No prior on‑chain deployments are changed. Tooling and docs that used ad‑hoc names SHOULD migrate to the identifiers and ticker defined here.

## Security Considerations

- Clear chain identifiers reduce misrouting risk in cross‑chain operations.
- Centralizing fee denomination in LUX simplifies economic and security analysis of incentives.

## Test Cases

- Parsers must map `P/C/X/M/Z/G` to the intended chains.
- Wallets and explorers display balances and fees in `LUX`.
- Link and config schemas accept only the specified chain codes.
