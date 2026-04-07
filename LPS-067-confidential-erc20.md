---
lps: 067
title: Confidential ERC-20 with FHE Balances
tags: [fhe, erc20, confidential, encrypted, token, privacy]
description: ERC-20 token standard with FHE-encrypted balances and transfer amounts
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Privacy
created: 2025-06-01
references:
  - lps-066 (Threshold FHE)
  - lps-064 (Privacy Pool)
---

# LPS-067: Confidential ERC-20 with FHE Balances

## Abstract

Defines an ERC-20-compatible token where balances and transfer amounts are encrypted using the threshold FHE scheme (LPS-066). The contract stores `euint64` encrypted balances. Transfers operate on ciphertexts -- the contract verifies the sender has sufficient balance via homomorphic comparison without ever seeing the plaintext values. Only the token holder can decrypt their own balance.

## Specification

### Storage

```solidity
mapping(address => euint64) private encBalances;
euint64 private encTotalSupply;
```

All balances are encrypted under the global FHE public key. The contract never stores or processes plaintext amounts.

### Transfer

```solidity
function transfer(address to, einput encryptedAmount, bytes calldata inputProof) external;
```

1. Caller submits an encrypted amount with a ZK proof that the ciphertext encrypts a valid uint64.
2. Contract computes: `ebool sufficient = FHE.le(encryptedAmount, encBalances[msg.sender])`.
3. Contract computes: `encBalances[msg.sender] = FHE.sub(encBalances[msg.sender], encryptedAmount)`.
4. Contract computes: `encBalances[to] = FHE.add(encBalances[to], encryptedAmount)`.
5. If `sufficient` is false, the subtraction underflows and the transaction reverts.

### Balance Query

Only the balance owner can decrypt:

```solidity
function balanceOf(address owner) external returns (euint64);
function decryptBalance() external;  // triggers threshold decryption callback to msg.sender
```

Third parties see only ciphertexts. The threshold decryption (LPS-066) delivers the plaintext only to the requesting address via an encrypted callback channel.

### Compliance Integration

For regulated tokens (LPS-001), the compliance registry can be granted a decryption permission by the token holder, enabling KYC-gated balance visibility without making balances public.

## Security Considerations

1. Transfer amounts are never visible on-chain. Only ciphertexts appear in transaction data.
2. The input proof prevents submitting malformed ciphertexts (e.g., encrypting a negative number).
3. Metadata leakage: sender, receiver, and timing are still visible. Use LPS-068 for full privacy.
4. Gas costs are higher than plaintext ERC-20 (approximately 10x for transfers due to FHE operations).

## Reference

| Resource | Location |
|----------|----------|
| ConfidentialERC20 contract | `github.com/luxfi/standard/contracts/privacy/ConfidentialERC20.sol` |
| FHE precompile | `github.com/luxfi/evm/precompile/contracts/fhe.go` |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
