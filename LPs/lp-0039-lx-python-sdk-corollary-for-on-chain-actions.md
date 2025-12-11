---
lp: 0039
title: LX Python SDK Corollary for On-Chain Actions
description: Breakdown of Python client (lx.api.Exchange) methods and mapping to on-chain Dex actions
author: Lux Network Team
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Informational
category: Interface
created: 2025-07-25
tags: [dev-tools, sdk]
requires: 36, 38
---

## Abstract

This LP provides a corollary for the Python client (`lx.api.Exchange`) showing how its methods map to on-chain DEX actions and RPC calls. It clarifies import dependencies, core logic, and signing flows needed for seamless integration of order, modify, cancel, and other state-changing operations.

## Motivation

Client libraries must clearly reflect on-chain primitives (OrderTx, CancelTx, SwapTx, LXity setup). This breakdown assists developers in understanding how Python wrapper methods translate into serialized wire formats, signed payloads, and RPC/REST calls.
## Specification

## Code Imports

Key dependencies in `Exchange`:

```python
import json
import logging
import secrets

import eth_account
from eth_account.signers.local import LocalAccount

from lx.api import API
from lx.info import Info
from lx.utils.constants import MAINNET_API_URL
from lx.utils.signing import (
    OrderRequest, ModifyRequest, CancelRequest, CancelByCloidRequest,
    order_request_to_order_wire, order_wires_to_order_action,
    sign_l1_action, sign_usd_transfer_action, sign_agent,
    # ... other sign_* functions ...
)
from lx.utils.types import (
    List, Optional, Cloid, BuilderInfo, Meta, SpotMeta
)
```

## Exchange Class Overview

```python
class Exchange(API):
    DEFAULT_SLPPAGE = 0.05

    def __init__(...):
        super().__init__(base_url)
        self.wallet = wallet           # LocalAccount (private key)
        self.vault_address = vault_address
        self.info = Info(base_url, True, meta, spot_meta, perp_dexs)
        self.expires_after = None

    def _post_action(self, action, signature, nonce):
        payload = { 'action': action, 'nonce': nonce,
                    'signature': signature, 'vaultAddress': self.vault_address,
                    'expiresAfter': self.expires_after }
        return self.post('/exchange', payload)
```

## Order Placement Flow

1. Convert high-level OrderRequest to on-chain wire format:
   ```python
   wire = order_request_to_order_wire(order_req, asset_id)
   ```
2. Build order action payload:
   ```python
   action = order_wires_to_order_action([wire], builder)
   ```
3. Sign payload with ECDSA via sign_l1_action:
   ```python
   signature = sign_l1_action(
       self.wallet, action, self.vault_address, timestamp,
       self.expires_after, self.base_url == MAINNET_API_URL
   )
   ```
4. Submit via _post_action → JSON‑RPC dex.swap.submit or HTTP REST↔RPC gateway.

## Modify and Cancel Flows

Both follow similar patterns:

```python
# Modify
modify_action = {'type':'batchModify','modifies': modify_wires}
sig = sign_l1_action(...)
return self._post_action(modify_action, sig, timestamp)

# Cancel
cancel_action = {'type':'cancel','cancels': cancel_wires}
sig = sign_l1_action(...)
return self._post_action(cancel_action, sig, timestamp)
```

## Market Order Helpers

Compute slippage-adjusted price via on-chain midprice query:
```python
px = float(self.info.all_mids()[asset])
px *= 1±slippage
round to 6 or 8 decimals
```

## Advanced Actions

Additional methods wrap specialized on-chain actions:
- `schedule_cancel` → `scheduleCancel` type action
- `update_leverage` → `updateLeverage`
- `sub_account_transfer` → `subAccountTransfer`
- `multi_sig` → `multiSig` outer payload

## Expiry and Nonce Handling

All signed payloads include `nonce = timestamp_ms` and optional `expiresAfter` to enforce off-chain validity windows.

## Mapping to On-Chain Events

Client actions correspond to DexFx event logs:
- `PlaceOrder` → `OrderLog`
- `Cancel` → `OrderCancelLog`
- `Modify` → `OrderModifyLog`

## Implementation

### Python SDK Integration

**Location**: `~/work/lux/sdk/python/lx/`
**GitHub**: [`github.com/luxfi/sdk-python/tree/main/lx`](https://github.com/luxfi/sdk-python/tree/main/lx)

**Core Exchange Module**:
- [`lx/api/exchange.py`](https://github.com/luxfi/sdk-python/blob/main/lx/api/exchange.py) - Exchange class
- [`lx/utils/signing.py`](https://github.com/luxfi/sdk-python/blob/main/lx/utils/signing.py) - Signature helpers
- [`lx/utils/types.py`](https://github.com/luxfi/sdk-python/blob/main/lx/utils/types.py) - Type definitions

**Order Placement Example**:
```python
# From lx/api/exchange.py
from lx.utils.signing import OrderRequest, order_request_to_order_wire, sign_l1_action

exchange = Exchange(
    wallet=LocalAccount.create(),
    vault_address="0x1234...",
    base_url="https://api.lux.network"
)

# Create order request
order_req = OrderRequest(
    asset="BTC",
    is_buy=True,
    limit_px=63000,
    sz=1.0,
    order_type=OrderType.LIMIT,
    reduce_only=False,
    cloid=None
)

# Convert to wire format
wire = order_request_to_order_wire(order_req, asset_id=0)

# Build action payload
action = order_wires_to_order_action([wire], builder_info)

# Sign payload
signature = sign_l1_action(
    wallet=exchange.wallet,
    action=action,
    vault_address=exchange.vault_address,
    timestamp=int(time.time()),
    is_mainnet=(exchange.base_url == MAINNET_API_URL)
)

# Submit
response = exchange._post_action(action, signature, timestamp)
```

**Testing**:
```bash
cd ~/work/lux/sdk/python
python -m pytest lx/tests/test_exchange.py -v
python -m pytest lx/tests/test_signing.py -v
```

### Method Mapping Reference

| Python SDK Method | On-Chain Action | RPC Call |
|-----------------|-----------------|----------|
| `exchange.place_order()` | OrderTx | `dex.swap.submit` |
| `exchange.cancel_order()` | CancelTx | `dex.swap.cancel` |
| `exchange.modify_order()` | ModifyTx | `dex.swap.modify` |
| `exchange.get_order_book()` | - | `dex.getOrderBook` |
| `exchange.get_trades()` | - | `dex.getTrades` |
| `exchange.get_account()` | - | `dex.getAccount` |

## Rationale

This corollary clarifies the client↔chain boundary, ensuring seamless parity between Python SDK calls and on-chain DEX transactions.

## Backwards Compatibility

Python client methods are additive; existing JSON-RPC and WS endpoints remain unchanged for non-DEX users.

## Security Considerations

- Always validate server response signatures in client.
- Manage key material via secure LocalAccount handlers.
- Use HTTPS for all connections to avoid man-in-the-middle attacks.
- Implement rate limiting on client side to prevent accidental spam.

## Copyright

CC0