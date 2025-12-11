---
lp: 0030
title: LRC-20 Bridgable Token Extension
description: Optional extension of the fungible token standard to support native bridging operations via burn and mint
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-07-23
tags: [lrc, bridge, token-standard]
requires: 20, 28
---

## Abstract

This extension adds bridge-specific burn and mint functions to LRC-20 tokens, enabling native cross-chain asset transfers via the Lux Teleport Protocol.

## Motivation

Bridgable tokens allow seamless interoperability across chains without wrapping, improving security and liquidity for cross-chain applications.

## Specification

```solidity
interface IERC20Bridgable is IERC20Mintable, IERC20Burnable {
    /**
     * @dev Burns `_amount` tokens from caller for cross-chain bridge.
     */
    function bridgeBurn(address to, uint256 amount) external;

    /**
     * @dev Mints `_amount` bridged tokens to `_from` upon cross-chain arrival.
     */
    function bridgeMint(address from, uint256 amount) external;
}
```

## Rationale

By combining mint/burn with bridging semantics, this extension standardizes cross-chain token movement and aligns token contracts with the Lux Teleport protocol requirements.

## Backwards Compatibility

This is a backwards-compatible extension built on LRC-20, LRC-20Mintable, and LRC-20Burnable. Core token functionality remains intact.

## Test Cases

Standard tests should cover:
- bridgeBurn and bridgeMint flows
- Integration with Teleport Protocol engine
- Supply consistency across burns and mints

## Reference Implementation

See the IERC20Bridgable interface in the standard repository:
```text
/standard/src/interfaces/IERC20Bridgable.sol
```

## Implementation

### LRC-20 Bridgable Token Contracts

**Location**: `~/work/lux/standard/src/tokens/`
**GitHub**: [`github.com/luxfi/standard/tree/main/src/tokens`](https://github.com/luxfi/standard/tree/main/src/tokens)

**Core Contracts**:
- [`ERC20.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20.sol) - Base implementation
- [`ERC20Bridgable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20Bridgable.sol) - Bridge extension
- [`ERC20Mintable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20Mintable.sol) - Minting capability
- [`ERC20Burnable.sol`](https://github.com/luxfi/standard/blob/main/src/tokens/ERC20Burnable.sol) - Burning capability

**Bridge Integration** (Teleport Protocol):
- Location: `~/work/lux/standard/src/bridge/`
- [`TeleportMessenger.sol`](https://github.com/luxfi/standard/blob/main/src/bridge/TeleportMessenger.sol) - Cross-chain messaging
- [`BridgeRelay.sol`](https://github.com/luxfi/standard/blob/main/src/bridge/BridgeRelay.sol) - Message relay

**Bridging Implementation**:
```solidity
// Example from ERC20Bridgable.sol
function bridgeBurn(address from, uint256 amount) external onlyBridgeRelayer {
    require(from != address(0), "Invalid address");
    _burn(from, amount);
    emit BridgeBurn(from, amount);
}

function bridgeMint(address to, uint256 amount) external onlyBridgeRelayer {
    require(to != address(0), "Invalid recipient");
    _mint(to, amount);
    emit BridgeMint(to, amount);
}
```

**Testing**:
```bash
cd ~/work/lux/standard
forge test --match-contract ERC20BridgableTest
forge coverage --match-contract ERC20Bridgable
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| bridgeBurn | ~45,000 | Token burn + bridge event |
| bridgeMint | ~50,000 | Token mint + bridge event |
| setBridgeRelayer | ~20,000 | Access control update |

## Security Considerations

- Ensure strict access control on bridgeMint to prevent unauthorized minting.
- Validate correct burn amounts and cross-chain message proofs.
- Only bridge relayers can invoke bridgeBurn/bridgeMint.
- Implement rate limiting to prevent bridge floods.
- Verify message signatures from the Teleport Protocol.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).