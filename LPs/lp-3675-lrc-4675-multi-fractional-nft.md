---
lp: 3675
title: LRC-4675 Multi-Fractional NFT
description: NFTs divisible into fungible ERC-20 shares with ownership tracking
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: LRC
created: 2025-01-23
requires: 3020, 3721
tags: [lrc, nft, fractionalization, defi]
order: 340
---

# LP-3675: LRC-4675 Multi-Fractional NFT

## Abstract

LRC-4675 enables NFTs to be divided into fungible shares that can be traded independently while maintaining the underlying NFT's integrity. Multiple NFTs can be fractionalized within the same contract, each with its own share token.

## Motivation

High-value NFTs face liquidity challenges:
- Price too high for most buyers
- Can't partially exit position
- Difficult to use as collateral

LRC-4675 provides:
- Fractional ownership of NFTs
- Liquid markets for NFT shares
- DeFi composability (lending, staking)
- Multi-NFT fractionalization in one contract

## Specification

### Core Interface

```solidity
interface ILRC4675 {
    // Events
    event Fractionalize(
        uint256 indexed nftId,
        uint256 indexed tokenId,
        uint256 totalSupply
    );
    
    event Defractionalize(
        uint256 indexed nftId,
        uint256 indexed tokenId,
        address indexed redeemer
    );
    
    // View functions
    function nftContract() external view returns (address);
    function nftId(uint256 tokenId) external view returns (uint256);
    function totalSupply(uint256 tokenId) external view returns (uint256);
    function balanceOf(address owner, uint256 tokenId) external view returns (uint256);
    
    // Transfer functions (ERC-1155 compatible)
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external;
    
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        bytes calldata data
    ) external;
    
    // Fractionalization
    function fractionalize(
        uint256 nftId,
        uint256 totalShares,
        string calldata name,
        string calldata symbol
    ) external returns (uint256 tokenId);
    
    // Redemption (requires 100% of shares)
    function redeem(uint256 tokenId) external;
}
```

### Metadata Extension

```solidity
interface ILRC4675Metadata is ILRC4675 {
    function name(uint256 tokenId) external view returns (string memory);
    function symbol(uint256 tokenId) external view returns (string memory);
    function decimals(uint256 tokenId) external view returns (uint8);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
```

### Implementation

```solidity
contract MultiNFTFractions is ERC1155, ILRC4675 {
    struct FractionInfo {
        address nftContract;
        uint256 nftId;
        uint256 totalSupply;
        string name;
        string symbol;
        bool redeemed;
    }
    
    mapping(uint256 => FractionInfo) public fractions;
    uint256 private _nextTokenId = 1;
    
    function fractionalize(
        address nftContract,
        uint256 nftId,
        uint256 totalShares,
        string calldata name,
        string calldata symbol
    ) external returns (uint256 tokenId) {
        // Transfer NFT to this contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), nftId);
        
        tokenId = _nextTokenId++;
        
        fractions[tokenId] = FractionInfo({
            nftContract: nftContract,
            nftId: nftId,
            totalSupply: totalShares,
            name: name,
            symbol: symbol,
            redeemed: false
        });
        
        // Mint all shares to fractionalizer
        _mint(msg.sender, tokenId, totalShares, "");
        
        emit Fractionalize(nftId, tokenId, totalShares);
    }
    
    function redeem(uint256 tokenId) external {
        FractionInfo storage info = fractions[tokenId];
        require(!info.redeemed, "Already redeemed");
        require(
            balanceOf(msg.sender, tokenId) == info.totalSupply,
            "Must own 100% of shares"
        );
        
        // Burn all shares
        _burn(msg.sender, tokenId, info.totalSupply);
        
        // Transfer NFT to redeemer
        IERC721(info.nftContract).transferFrom(
            address(this),
            msg.sender,
            info.nftId
        );
        
        info.redeemed = true;
        
        emit Defractionalize(info.nftId, tokenId, msg.sender);
    }
}
```

### Buyout Extension

```solidity
interface ILRC4675Buyout is ILRC4675 {
    event BuyoutStarted(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event BuyoutCompleted(uint256 indexed tokenId, address indexed buyer);
    event BuyoutCanceled(uint256 indexed tokenId);
    
    function startBuyout(uint256 tokenId) external payable;
    function acceptBuyout(uint256 tokenId, uint256 amount) external;
    function cancelBuyout(uint256 tokenId) external;
}
```

## Use Cases

### Art Fractionalization
```solidity
// Fractionalize a $1M artwork into 1M shares
fractions.fractionalize(
    artNFT,
    tokenId,
    1_000_000 * 10**18,  // 1M shares with 18 decimals
    "Bored Ape #1234 Shares",
    "BA1234"
);
```

### Real Estate Tokens
```solidity
// Property NFT fractured for investment
fractions.fractionalize(
    propertyNFT,
    propertyId,
    100_000 * 10**18,  // 100K investment units
    "123 Main St Shares",
    "123MAIN"
);
```

### Collective Ownership
```solidity
// DAO collectively purchases and fractions NFT
// Each member receives proportional shares
```

## Rationale

- ERC-1155 base for multi-token efficiency
- 100% ownership required for redemption (clean exit)
- Per-token metadata for clear identification
- Buyout mechanism for liquidity events

## Backwards Compatibility

This standard is fully backwards compatible with existing contracts and infrastructure. The standard is additive and does not modify existing functionality.

## Security Considerations

- NFT custody during fractionalization
- Reentrancy guards on redemption
- Buyout front-running prevention
- Oracle manipulation for pricing

## References

- [ERC-4675: Multi-Fractional NFT](https://eips.ethereum.org/EIPS/eip-4675)
- [LP-3721: LRC-721](./lp-3721-lrc-721-non-fungible-token-standard.md)
- [LP-3155: LRC-1155](./lp-3155-lrc-1155-multi-token-standard.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
