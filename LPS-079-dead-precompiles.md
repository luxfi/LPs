---
lps: 079
title: Burn Address Precompiles
tags: [burn, deflationary, dao, treasury, precompile, fee]
description: Burn addresses splitting fees 50% deflationary burn and 50% DAO treasury
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Cryptography
created: 2025-06-01
references:
  - lps-080 (Treasury V2)
  - lps-083 (Token Economics)
---

# LPS-079: Burn Address Precompiles

## Abstract

Defines two burn address precompiles for Lux Network. LUX sent to `0xdead...0001` is permanently burned (deflationary). LUX sent to `0xdead...0002` is routed to the DAO treasury. Transaction base fees are split 50/50 between these two addresses, creating a dual mechanism: deflationary pressure and sustainable DAO funding.

## Specification

### Burn Addresses

| Address | Name | Behavior |
|---------|------|----------|
| `0x000000000000000000000000000000000000dEa1` | DeadBurn | Tokens are permanently destroyed. `totalSupply` decreases. |
| `0x000000000000000000000000000000000000dEa2` | DeadTreasury | Tokens are forwarded to the DAO treasury contract. |

### Fee Split

```
Base fee per transaction:
  50% -> DeadBurn (permanent destruction)
  50% -> DeadTreasury (DAO treasury)

Priority fee (tip):
  100% -> Block producer (validator)
```

### Implementation

Both addresses are EVM precompiles that execute on `receive()`:

- **DeadBurn**: Accepts LUX, emits `Burned(amount)` event, balance is unreachable (no withdrawal function).
- **DeadTreasury**: Accepts LUX, forwards to `DAOTreasury` contract address (configurable via governance), emits `TreasuryDeposit(amount)` event.

### Deflationary Model

At steady-state transaction volume, the burn rate:
- 1,000 TPS average, 21,000 gas base, 25 gwei base fee: ~0.26 LUX/second burned = ~8.2M LUX/year
- This offsets validator issuance, targeting a net-deflationary supply over time.

### Governance

The treasury forwarding address is updatable via DAO governance (LPS-085). The burn address is immutable -- no governance can recover burned tokens.

## Security Considerations

1. DeadBurn is a true black hole. No admin key, no upgrade path, no recovery. Tokens sent there are gone.
2. DeadTreasury forwarding target is protected by a 7-day timelock on governance changes.
3. The 50/50 split is hardcoded in the fee handler. Changing the ratio requires a network upgrade.
4. EIP-1559-style base fee ensures the split applies to all transactions, not just those with explicit burns.

## Reference

| Resource | Location |
|----------|----------|
| DeadBurn precompile | `github.com/luxfi/evm/precompile/contracts/deadburn.go` |
| DeadTreasury precompile | `github.com/luxfi/evm/precompile/contracts/deadtreasury.go` |
| Fee handler | `github.com/luxfi/evm/core/fee_handler.go` |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
