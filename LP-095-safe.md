---
lp: 095
title: Multi-Signature Safe Contracts
tags: [safe, multisig, wallet, gnosis, multi-signature]
description: Multi-signature safe contracts for secure team and treasury fund management
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Infrastructure
created: 2023-03-01
references:
  - lps-096 (Account Abstraction)
  - lps-062 (KMS)
---

# LP-095: Multi-Signature Safe Contracts

## Abstract

Defines the multi-signature safe standard for Lux Network. Safes are multi-owner smart contract wallets requiring m-of-n signatures to execute transactions. The implementation is based on the Safe (formerly Gnosis Safe) architecture, deployed on all Lux EVM chains. Safes are used for treasury management, protocol admin keys, and team fund operations.

## Specification

### Contract Architecture

```
SafeProxy -> SafeSingleton (master copy)
  |-- OwnerManager (add/remove/swap owners, threshold)
  |-- ModuleManager (enable/disable execution modules)
  |-- GuardManager (pre/post transaction guards)
  |-- FallbackManager (fallback handler for unknown calls)
```

### Core Operations

| Function | Description |
|----------|-------------|
| `execTransaction(to, value, data, signatures)` | Execute with m-of-n signatures |
| `addOwnerWithThreshold(owner, threshold)` | Add signer, adjust threshold |
| `removeOwner(prevOwner, owner, threshold)` | Remove signer |
| `changeThreshold(threshold)` | Adjust required signatures |

### Signature Types

| Type | Value | Description |
|------|-------|-------------|
| ECDSA | v=27/28 | Standard Ethereum signature |
| EIP-1271 | v=0 | Contract signature (nested Safe) |
| Approved hash | v=1 | Pre-approved hash (msg.sender check) |

### Deployment

Safes are deployed via the SafeProxyFactory using CREATE2 for deterministic addresses. The factory is deployed at the same address on all chains:

```
Factory: 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67
```

### Guard Integration

Transaction guards enforce additional policies:

| Guard | Policy |
|-------|--------|
| SpendingLimitGuard | Daily/weekly spending caps per token |
| TimelockGuard | Delay execution by configurable period |
| WhitelistGuard | Only allow transactions to approved addresses |

## Security Considerations

1. The SafeSingleton is a master copy. Safes use delegatecall via proxy. A compromised singleton affects all Safes. The singleton is immutable and audited.
2. Owner management requires threshold signatures. No single owner can add/remove owners unilaterally.
3. Modules have unrestricted execution power. Only enable audited, trusted modules.
4. Nonce tracking prevents replay. Each Safe maintains an incrementing nonce.

## Reference

| Resource | Location |
|----------|----------|
| Safe contracts | `github.com/luxfi/standard/contracts/safe/` |
| SafeProxyFactory | `github.com/luxfi/standard/contracts/safe/SafeProxyFactory.sol` |
| Safe documentation | https://docs.safe.global |

## Copyright

Copyright (C) 2023-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
