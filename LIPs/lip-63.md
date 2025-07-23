---
lip: 63
title: NFT Marketplace Protocol Standard
description: Standard for implementing NFT marketplaces on Lux Network based on Zora protocol
author: Lux Network Team (@luxdefi)
discussions-to: https://forum.lux.network/lip-63
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 721, 1155
---

## Abstract

This LIP defines a standard for NFT marketplace protocols on the Lux Network, based on the Zora protocol architecture. It specifies interfaces for creating markets, managing bids and asks, handling royalties, and implementing auction mechanisms while supporting both LRC-721 and LRC-1155 tokens.

## Motivation

Standardized NFT marketplaces enable:

1. **Interoperability**: Consistent marketplace interfaces
2. **Royalty Standards**: Proper creator compensation
3. **Decentralization**: Permissionless market creation
4. **Composability**: Integration with other protocols
5. **Cross-Chain Trading**: NFT markets across Lux chains

## Specification

### Core Market Interface

```solidity
interface ILuxNFTMarket {
    // Bid structure
    struct Bid {
        uint256 amount;
        address currency;
        address bidder;
        address recipient;
        uint256 expiry;
        uint256 nonce;
    }
    
    // Ask structure
    struct Ask {
        uint256 amount;
        address currency;
        address seller;
        address fundsRecipient;
        uint256 expiry;
        uint256 nonce;
    }
    
    // Events
    event BidCreated(
        address indexed tokenContract,
        uint256 indexed tokenId,
        Bid bid
    );
    
    event BidRemoved(
        address indexed tokenContract,
        uint256 indexed tokenId,
        Bid bid
    );
    
    event BidFinalized(
        address indexed tokenContract,
        uint256 indexed tokenId,
        Bid bid
    );
    
    event AskCreated(
        address indexed tokenContract,
        uint256 indexed tokenId,
        Ask ask
    );
    
    event AskRemoved(
        address indexed tokenContract,
        uint256 indexed tokenId,
        Ask ask
    );
    
    event AskFilled(
        address indexed tokenContract,
        uint256 indexed tokenId,
        address buyer,
        Ask ask
    );
    
    // Bid functions
    function setBidForToken(
        address tokenContract,
        uint256 tokenId,
        Bid memory bid
    ) external payable;
    
    function removeBidForToken(
        address tokenContract,
        uint256 tokenId
    ) external;
    
    function acceptBid(
        address tokenContract,
        uint256 tokenId,
        Bid memory expectedBid
    ) external;
    
    // Ask functions
    function setAskForToken(
        address tokenContract,
        uint256 tokenId,
        Ask memory ask
    ) external;
    
    function removeAskForToken(
        address tokenContract,
        uint256 tokenId
    ) external;
    
    function fillAsk(
        address tokenContract,
        uint256 tokenId,
        Ask memory expectedAsk
    ) external payable;
}
```

### Royalty Management Interface

```solidity
interface ILuxRoyaltyEngine {
    struct RoyaltyConfig {
        address recipient;
        uint256 bps; // Basis points (100 = 1%)
    }
    
    struct SplitConfig {
        uint256 creatorShare;    // Original creator
        uint256 ownerShare;      // Current owner
        uint256 previousShare;   // Previous owner
        uint256 platformShare;   // Platform fee
    }
    
    event RoyaltyPaid(
        address indexed tokenContract,
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );
    
    function getRoyalties(
        address tokenContract,
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (
        address[] memory recipients,
        uint256[] memory amounts
    );
    
    function setRoyaltyConfig(
        address tokenContract,
        RoyaltyConfig memory config
    ) external;
    
    function setSplitConfig(
        address tokenContract,
        SplitConfig memory config
    ) external;
    
    function distributeRoyalties(
        address tokenContract,
        uint256 tokenId,
        uint256 salePrice,
        address currency
    ) external payable;
}
```

### Auction House Interface

```solidity
interface ILuxAuctionHouse {
    struct Auction {
        uint256 tokenId;
        address tokenContract;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        address bidder;
        bool settled;
        uint256 curatorFeePercentage;
        address curator;
    }
    
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed tokenContract,
        uint256 indexed tokenId,
        uint256 duration,
        uint256 reservePrice,
        address curator
    );
    
    event AuctionBid(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        bool extended
    );
    
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount
    );
    
    event AuctionCanceled(
        uint256 indexed auctionId,
        address indexed tokenContract,
        uint256 indexed tokenId
    );
    
    // Core auction functions
    function createAuction(
        uint256 tokenId,
        address tokenContract,
        uint256 duration,
        uint256 reservePrice,
        address curator,
        uint256 curatorFeePercentage
    ) external returns (uint256);
    
    function createBid(uint256 auctionId) external payable;
    
    function endAuction(uint256 auctionId) external;
    
    function cancelAuction(uint256 auctionId) external;
    
    // Configuration
    function setMinBidIncrementPercentage(uint8 percentage) external;
    function setTimeBuffer(uint256 timeBuffer) external;
    function setDuration(uint256 duration) external;
}
```

### Collection Offers Interface

```solidity
interface ILuxCollectionOffers {
    struct CollectionOffer {
        address collection;
        uint256 amount;
        address currency;
        address buyer;
        uint256 expiry;
        uint256 nonce;
        bytes32 criteriaRoot; // Merkle root for trait-based offers
    }
    
    event CollectionOfferCreated(
        address indexed collection,
        address indexed buyer,
        CollectionOffer offer
    );
    
    event CollectionOfferAccepted(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed seller,
        CollectionOffer offer
    );
    
    function createCollectionOffer(
        CollectionOffer memory offer
    ) external payable;
    
    function acceptCollectionOffer(
        address collection,
        uint256 tokenId,
        CollectionOffer memory expectedOffer,
        bytes32[] memory criteriaProof
    ) external;
    
    function cancelCollectionOffer(
        address collection,
        uint256 nonce
    ) external;
}
```

### Bundle Sales Interface

```solidity
interface ILuxBundleSales {
    struct Bundle {
        address[] tokenContracts;
        uint256[] tokenIds;
        uint256[] amounts; // For LRC-1155
        uint256 price;
        address currency;
        address seller;
    }
    
    event BundleCreated(
        uint256 indexed bundleId,
        Bundle bundle
    );
    
    event BundleSold(
        uint256 indexed bundleId,
        address indexed buyer
    );
    
    function createBundle(Bundle memory bundle) external returns (uint256);
    
    function purchaseBundle(uint256 bundleId) external payable;
    
    function cancelBundle(uint256 bundleId) external;
}
```

## Rationale

### Zora-Based Architecture

Building on Zora provides:
- Proven marketplace mechanics
- Flexible royalty system
- Modular components
- Battle-tested security

### Separate Modules

Modular design enables:
- Independent upgrades
- Specialized features
- Gas optimization
- Flexible integration

### Cross-Chain Support

Native multi-chain features:
- Unified liquidity
- Cross-chain offers
- Consistent interfaces

## Backwards Compatibility

This standard maintains compatibility with:
- LRC-721 tokens
- LRC-1155 tokens
- EIP-2981 royalty standard
- Existing marketplace aggregators

## Test Cases

### Basic Marketplace Operations

```solidity
contract MarketplaceTest {
    ILuxNFTMarket market;
    IERC721 nft;
    
    function testCreateAndFillAsk() public {
        uint256 tokenId = 1;
        uint256 price = 1 ether;
        
        // Create ask
        ILuxNFTMarket.Ask memory ask = ILuxNFTMarket.Ask({
            amount: price,
            currency: address(0), // Native LUX
            seller: address(this),
            fundsRecipient: address(this),
            expiry: block.timestamp + 1 days,
            nonce: 0
        });
        
        nft.approve(address(market), tokenId);
        market.setAskForToken(address(nft), tokenId, ask);
        
        // Fill ask
        address buyer = address(0x123);
        vm.prank(buyer);
        vm.deal(buyer, price);
        market.fillAsk{value: price}(address(nft), tokenId, ask);
        
        // Verify transfer
        assertEq(nft.ownerOf(tokenId), buyer);
    }
    
    function testBidFlow() public {
        uint256 tokenId = 1;
        uint256 bidAmount = 0.5 ether;
        
        // Create bid
        ILuxNFTMarket.Bid memory bid = ILuxNFTMarket.Bid({
            amount: bidAmount,
            currency: address(0),
            bidder: address(this),
            recipient: address(this),
            expiry: block.timestamp + 1 days,
            nonce: 0
        });
        
        market.setBidForToken{value: bidAmount}(address(nft), tokenId, bid);
        
        // Accept bid
        address owner = nft.ownerOf(tokenId);
        vm.prank(owner);
        nft.approve(address(market), tokenId);
        vm.prank(owner);
        market.acceptBid(address(nft), tokenId, bid);
        
        // Verify transfer
        assertEq(nft.ownerOf(tokenId), address(this));
    }
}
```

### Auction Testing

```solidity
function testAuction() public {
    ILuxAuctionHouse auction = ILuxAuctionHouse(auctionAddress);
    
    uint256 tokenId = 1;
    uint256 reservePrice = 1 ether;
    uint256 duration = 24 hours;
    
    // Create auction
    uint256 auctionId = auction.createAuction(
        tokenId,
        address(nft),
        duration,
        reservePrice,
        address(0), // No curator
        0 // No curator fee
    );
    
    // Place bid
    vm.warp(block.timestamp + 1 hours);
    auction.createBid{value: reservePrice}(auctionId);
    
    // End auction
    vm.warp(block.timestamp + duration + 1);
    auction.endAuction(auctionId);
}
```

## Reference Implementation

```solidity
contract LuxNFTMarket is ILuxNFTMarket, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    mapping(address => mapping(uint256 => Bid)) public bids;
    mapping(address => mapping(uint256 => Ask)) public asks;
    
    ILuxRoyaltyEngine public royaltyEngine;
    
    modifier onlyTokenOwner(address tokenContract, uint256 tokenId) {
        require(
            IERC721(tokenContract).ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        _;
    }
    
    function setAskForToken(
        address tokenContract,
        uint256 tokenId,
        Ask memory ask
    ) external override onlyTokenOwner(tokenContract, tokenId) {
        require(ask.amount > 0, "Ask amount must be greater than 0");
        require(ask.expiry > block.timestamp, "Ask expired");
        
        asks[tokenContract][tokenId] = ask;
        
        emit AskCreated(tokenContract, tokenId, ask);
    }
    
    function fillAsk(
        address tokenContract,
        uint256 tokenId,
        Ask memory expectedAsk
    ) external payable override nonReentrant {
        Ask memory ask = asks[tokenContract][tokenId];
        
        require(ask.amount == expectedAsk.amount, "Ask price mismatch");
        require(ask.expiry >= block.timestamp, "Ask expired");
        
        if (ask.currency == address(0)) {
            require(msg.value == ask.amount, "Incorrect payment");
        } else {
            IERC20(ask.currency).safeTransferFrom(
                msg.sender,
                address(this),
                ask.amount
            );
        }
        
        // Transfer NFT
        IERC721(tokenContract).safeTransferFrom(
            ask.seller,
            msg.sender,
            tokenId
        );
        
        // Distribute funds with royalties
        _distributeFunds(
            tokenContract,
            tokenId,
            ask.amount,
            ask.currency,
            ask.fundsRecipient
        );
        
        delete asks[tokenContract][tokenId];
        
        emit AskFilled(tokenContract, tokenId, msg.sender, ask);
    }
    
    function _distributeFunds(
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        address currency,
        address seller
    ) internal {
        (
            address[] memory recipients,
            uint256[] memory amounts
        ) = royaltyEngine.getRoyalties(tokenContract, tokenId, amount);
        
        uint256 remainingAmount = amount;
        
        // Pay royalties
        for (uint256 i = 0; i < recipients.length; i++) {
            if (amounts[i] > 0) {
                _transferFunds(currency, recipients[i], amounts[i]);
                remainingAmount -= amounts[i];
                
                emit RoyaltyPaid(tokenContract, tokenId, recipients[i], amounts[i]);
            }
        }
        
        // Pay seller
        if (remainingAmount > 0) {
            _transferFunds(currency, seller, remainingAmount);
        }
    }
    
    function _transferFunds(
        address currency,
        address to,
        uint256 amount
    ) internal {
        if (currency == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(currency).safeTransfer(to, amount);
        }
    }
}
```

## Security Considerations

### Reentrancy Protection

All functions involving transfers must use reentrancy guards:
```solidity
modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}
```

### Price Validation

Always validate expected prices to prevent front-running:
```solidity
require(ask.amount == expectedAsk.amount, "Ask price mismatch");
```

### NFT Transfer Safety

Use safeTransferFrom to ensure receiver can handle NFTs:
```solidity
IERC721(tokenContract).safeTransferFrom(seller, buyer, tokenId);
```

### Royalty Distribution

Ensure royalties cannot exceed sale price:
```solidity
require(totalRoyalties <= salePrice, "Royalties exceed sale price");
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).