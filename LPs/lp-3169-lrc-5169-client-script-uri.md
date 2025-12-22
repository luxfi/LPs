---
lp: 3169
title: LRC-5169 Client Script URI
description: Standard for associating executable scripts with smart contracts
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Informational
category: LRC
created: 2025-01-23
tags: [lrc, infrastructure, research]
order: 360
---

# LP-3169: LRC-5169 Client Script URI

## Abstract

LRC-5169 enables smart contracts to reference off-chain executable scripts (JavaScript/TypeScript) that provide standardized client-side functionality. This creates a bridge between on-chain contracts and off-chain UI/logic.

## Motivation

Smart contracts lack standardized client integration:
- Each dApp builds custom frontends
- No portable contract interactions
- Wallet integration requires manual work

LRC-5169 provides:
- Contract-specified client scripts
- Portable interaction patterns
- Wallet-embeddable functionality

## Specification

```solidity
interface ILRC5169 {
    function scriptURI() external view returns (string[] memory);
    event ScriptUpdate(string[] newScriptURI);
}
```

### Script Format

Scripts at the URI must export standard functions:
```typescript
export interface ContractScript {
  // Render token card
  render(tokenId: string): HTMLElement;
  
  // Get available actions
  getActions(): Action[];
  
  // Execute action
  executeAction(action: string, params: any): Promise<Transaction>;
}
```

## Research Status

This LP documents ERC-5169 for potential adoption. Implementation priority: **Low**

Key considerations:
- Script hosting and availability
- Security of executing off-chain code
- Version management

## References

- [ERC-5169: Client Script URI](https://eips.ethereum.org/EIPS/eip-5169)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
