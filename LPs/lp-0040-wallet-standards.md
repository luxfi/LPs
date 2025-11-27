---
lp: 0040
title: Wallet Standards
description: Wallet-related standards.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-01-23
---
## Abstract

Defines interfaces and guidance for Lux wallet interoperability across chains and dApps.

## Motivation

Consistent wallet behavior and interfaces reduce integration friction, improve UX, and enhance security across the ecosystem.

## Specification

This LP's normative content is the set of algorithms, data models, and parameters described herein. Implementations MUST follow those details for interoperability.

## Implementation

### Wallet Standard Contracts

**Location**: `~/work/lux/standard/src/wallets/`
**GitHub**: [`github.com/luxfi/standard/tree/main/src/wallets`](https://github.com/luxfi/standard/tree/main/src/wallets)

**Core Wallet Interfaces**:
- [`ILuxWallet.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/ILuxWallet.sol) - Base wallet interface
- [`IMultiChainWallet.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/IMultiChainWallet.sol) - Cross-chain wallet support
- [`IWalletFactory.sol`](https://github.com/luxfi/standard/blob/main/src/wallets/IWalletFactory.sol) - Wallet deployment factory

**Testing**:
```bash
cd ~/work/lux/standard
forge test --match-contract WalletTest
forge coverage --match-contract Wallet
```

## Rationale

Design choices favor simplicity and reliability while meeting Lux performance and ecosystem requirements.

## Backwards Compatibility

Additive change; existing APIs and formats remain valid. Adoption is opt-in.

## Security Considerations

Consider typical threat models (input validation, replay/DoS resistance, key handling). Apply recommended safeguards outlined in the text:
- Strict input validation for all external calls
- Replay protection via nonces and chain IDs
- Secure key derivation using BIP-39/BIP-44 standards
- Hardware wallet support via standard signing interfaces
