---
lp: 091
title: LRC20B Bridge Token Standard
tags: [bridge, token, lrc20b, erc20, mint-burn, cross-chain]
description: Bridge token standard for 67+ cross-chain tokens with mint/burn mechanics
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Token
created: 2022-09-01
references:
  - lps-016 (Omnichain Router)
  - lps-017 (Native Bridge Programs)
  - lps-090 (WLUX)
---

# LP-091: LRC20B Bridge Token Standard

## Abstract

Defines LRC20B (Lux Regulated Cross-Chain 20 Bridged), the standard for bridged tokens on Lux Network. When an asset (ETH, BTC, USDC, etc.) is locked on its native chain, a corresponding LRC20B token is minted on Lux. The bridge operator (MPC multisig, LP-019) controls minting. 67+ tokens are bridged at launch covering major L1 assets, stablecoins, and DeFi tokens.

## Specification

### Contract

```solidity
contract LRC20B is ERC20, AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    function bridgeMint(address to, uint256 amount) external onlyRole(BRIDGE_ROLE);
    function bridgeBurn(address from, uint256 amount) external onlyRole(BRIDGE_ROLE);
    function originChain() external view returns (uint256);
    function originToken() external view returns (address);
}
```

### Properties

| Property | Description |
|----------|-------------|
| BRIDGE_ROLE | MPC multisig (LP-019). Only entity that can mint/burn. |
| originChain | Chain ID of the native token (e.g., 1 for Ethereum) |
| originToken | Address on the origin chain (0x0 for native assets) |
| Decimals | Match origin token decimals |

### Token Registry

Selected bridged tokens (67+ total):

| Symbol | Origin | Origin Chain |
|--------|--------|-------------|
| WETH.b | WETH | Ethereum |
| WBTC.b | WBTC | Ethereum |
| USDC.b | USDC | Ethereum |
| USDT.b | USDT | Ethereum |
| DAI.b | DAI | Ethereum |
| SOL.b | SOL | Solana |
| BNB.b | BNB | BNB Chain |
| MATIC.b | MATIC | Polygon |
| ARB.b | ARB | Arbitrum |

The `.b` suffix denotes a bridged representation. The full registry is maintained in the `BridgeRegistry` contract.

### Mint/Burn Flow

```
Lock (external chain):
  User locks 1 ETH on Ethereum bridge contract
  MPC multisig observes lock, waits for finality
  MPC calls bridgeMint(user, 1e18) on Lux -> user receives 1 WETH.b

Burn (Lux -> external):
  User calls bridge.burn(1 WETH.b)
  MPC observes burn, waits for finality
  MPC releases 1 ETH on Ethereum to user
```

### Cross-Subnet Teleport

LRC20B tokens can move between Lux subnet chains via Warp messaging without additional lock/mint cycles. The token contract on each chain recognizes the Warp-relayed transfer.

## Security Considerations

1. BRIDGE_ROLE is held by the MPC multisig (3-of-5 minimum). No single key can mint bridged tokens.
2. Minting without a corresponding lock on the origin chain is detectable via the bridge audit log.
3. The BridgeRegistry is append-only. Removing a token requires governance approval.
4. Bridged tokens are always backed 1:1. The bridge contract on the origin chain holds the exact backing.

## Reference

| Resource | Location |
|----------|----------|
| LRC20B contract | `github.com/luxfi/standard/contracts/bridge/LRC20B.sol` |
| BridgeRegistry | `github.com/luxfi/standard/contracts/bridge/BridgeRegistry.sol` |
| MPC signing | LP-019 |

## Copyright

Copyright (C) 2022-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
