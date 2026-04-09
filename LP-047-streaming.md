---
lp: 047
title: Token Streaming
tags: [streaming, vesting, payroll, sablier, time-locked]
description: Sablier-style token streaming for continuous payments and vesting
author: Lux Industries
status: Final
type: Standards Track
category: DeFi
created: 2025-12-01
references:
  - lp-9900 (Streaming Specification)
---

# LP-047: Token Streaming

## Abstract

Lux Token Streaming enables continuous, per-second token transfers. A sender creates a stream by depositing tokens into the protocol, specifying a recipient and duration. Tokens flow linearly from sender to recipient over time. The recipient can withdraw accrued tokens at any point. Streams are cancellable by the sender (returning unvested tokens) or non-cancellable (irrevocable vesting).

## Specification

### Stream Model

```solidity
struct Stream {
    address sender;
    address recipient;
    address token;
    uint256 deposit;        // total tokens deposited
    uint256 startTime;
    uint256 stopTime;
    uint256 withdrawn;      // tokens already withdrawn by recipient
    bool    cancelable;     // can sender cancel?
}
```

### Streaming Rate

Tokens accrue linearly:

```
ratePerSecond = deposit / (stopTime - startTime)
balance(recipient) = ratePerSecond * (currentTime - startTime) - withdrawn
balance(sender) = deposit - ratePerSecond * (currentTime - startTime)
```

### Operations

| Operation | Description |
|---|---|
| `create` | Sender deposits tokens and creates a stream |
| `withdraw` | Recipient withdraws accrued tokens |
| `cancel` | Sender cancels (if cancelable), refunds unvested portion |
| `transfer` | Recipient transfers stream ownership to another address |

### Stream Types

| Type | Cancelable | Use Case |
|---|---|---|
| Linear | yes | Payroll, subscriptions |
| Linear (locked) | no | Token vesting, grants |
| Cliff + linear | yes/no | Vesting with cliff (e.g., 1 year cliff + 3 year vest) |

### Cliff Vesting

A cliff stream has zero accrual until the cliff date, then linear accrual:

```
if currentTime < cliffTime:
    balance(recipient) = 0
else:
    balance(recipient) = cliffAmount + ratePerSecond * (currentTime - cliffTime) - withdrawn
```

### Batch Operations

The protocol supports batch stream creation for payroll use cases:

```solidity
function createBatch(StreamParams[] calldata params) external returns (uint256[] memory streamIds);
```

Employers can set up monthly payroll for all employees in a single transaction.

### NFT Representation

Each stream is represented as an ERC-721 NFT. The NFT can be transferred, enabling secondary market trading of vested token streams.

## Security Considerations

1. **Rounding**: per-second accrual can have rounding dust. The last second's withdrawal includes any remaining dust.
2. **Token compatibility**: fee-on-transfer tokens are not supported (deposit amount must equal stream amount).
3. **Cancellation front-running**: a sender cancelling a stream can be front-run by the recipient withdrawing. This is by design -- the recipient should always be able to claim vested tokens.

## Reference

| Resource | Location |
|---|---|
| Streaming contracts | `github.com/luxfi/standard/contracts/streaming/` |
| Stream factory | `StreamFactory.sol` |
| Batch operations | `StreamBatch.sol` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
