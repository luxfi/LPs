---
lip: 31
title: LRC-721 Burnable Token Extension
description: Optional extension of the non-fungible token standard to allow holders to destroy their tokens
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-07-23
requires: 721
---

## Abstract

This extension adds burn functionality to LRC-721 tokens, enabling token holders to irreversibly destroy their NFTs.

## Motivation

Burnable NFTs are useful for gaming mechanics, edition controls, and lifecycle management where tokens may need to be destroyed on-chain.

## Specification

```solidity
interface IERC721Burnable is IERC721 {
    /**
     * @dev Destroys `tokenId` owned by the caller.
     */
    function burn(uint256 tokenId) external;
}
```

## Rationale

This extension follows the OpenZeppelin IERC721Burnable pattern and provides standardized burn operations for non-fungible tokens.

## Backwards Compatibility

This is a backwards-compatible extension to the LRC-721 interface. All core NFT functionality remains preserved.

## Test Cases

Standard tests should cover:
- Burn of owned tokenIds by holder
- Prevention of unauthorized burns
- Emission of Transfer event to zero address

## Reference Implementation

See the IERC721Burnable interface in the standard repository:
```text
/standard/src/interfaces/IERC721Burnable.sol
```

## Security Considerations

- Ensure only token owner or approved operator can call burn.
- Emit Transfer event with zero address to comply with LRC-721 spec.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).