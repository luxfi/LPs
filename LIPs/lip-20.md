---
lip: 20
title: LRC-20 Fungible Token Standard
description: This LIP retains the Lux Request for Comment 20 standard.
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
---

## Abstract

LRC-20 is analogous to Ethereum’s well-known ERC-20 fungible token standard. It defines the interface and behavior for fungible tokens on Lux’s platform.

## Specification

```solidity
interface ILRC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
