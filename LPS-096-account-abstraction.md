---
lps: 096
title: Smart Account Standard
tags: [account-abstraction, erc-4337, smart-account, paymaster, bundler]
description: ERC-4337 account abstraction with smart accounts, paymasters, and bundlers
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Infrastructure
created: 2024-01-01
references:
  - lps-095 (Safe Contracts)
  - lps-060 (DID Specification)
  - ERC-4337
---

# LPS-096: Smart Account Standard

## Abstract

Defines the account abstraction standard for Lux Network based on ERC-4337. Users interact with smart accounts instead of externally owned accounts (EOAs). Smart accounts support social recovery, session keys, gas sponsorship via paymasters, and batched transactions. The EntryPoint contract is the singleton that processes UserOperations from bundlers.

## Specification

### Architecture

```
User -> Bundler -> EntryPoint (singleton)
                     |-- SmartAccount.validateUserOp()
                     |-- Paymaster.validatePaymasterUserOp()
                     |-- SmartAccount.executeUserOp()
```

### EntryPoint

Singleton deployed on all chains at:

```
Address: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
```

Processes UserOperation bundles atomically.

### Smart Account

| Feature | Description |
|---------|-------------|
| Multi-owner | Multiple signers with threshold |
| Social recovery | Recovery via guardian set (email, phone, trusted contacts) |
| Session keys | Time-limited, scope-limited keys for dApps |
| Batched calls | Execute multiple operations in single transaction |
| Passkey signing | WebAuthn/FIDO2 hardware key support |

### UserOperation

| Field | Type | Description |
|-------|------|-------------|
| sender | address | Smart account address |
| nonce | uint256 | Anti-replay nonce |
| callData | bytes | Encoded function call(s) |
| callGasLimit | uint256 | Gas for execution |
| paymasterAndData | bytes | Paymaster address + sponsor data |
| signature | bytes | Owner signature(s) |

### Paymaster

Paymasters sponsor gas fees for users:

| Type | Description |
|------|-------------|
| VerifyingPaymaster | Sponsor txs signed by a backend (free gas for new users) |
| TokenPaymaster | Accept ERC-20 tokens as gas payment |
| DepositPaymaster | Pre-funded deposit accounts |

### Session Keys

```solidity
function addSessionKey(address key, uint256 validUntil, bytes4[] allowedSelectors) external;
```

Session keys allow dApps to submit transactions on behalf of the user within defined constraints (time window, allowed functions, spending limits) without requiring the master key for each action.

## Security Considerations

1. The EntryPoint is immutable and audited. It handles gas accounting and prevents griefing attacks.
2. Smart account validation logic is user-defined. A bug in validateUserOp can drain the account.
3. Session keys must have tight constraints. Overly permissive session keys are equivalent to giving away the private key.
4. Paymasters stake ETH/LUX in the EntryPoint to prevent DoS. Malicious paymasters lose their stake.

## Reference

| Resource | Location |
|----------|----------|
| EntryPoint | `github.com/luxfi/standard/contracts/account/EntryPoint.sol` |
| SmartAccount | `github.com/luxfi/standard/contracts/account/SmartAccount.sol` |
| ERC-4337 | https://eips.ethereum.org/EIPS/eip-4337 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
