---
lp: 2502
title: NFT Marketplace Standard
description: Canonical NFT marketplace infrastructure for Lux Network using Seaport and Sudoswap protocols.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-14
requires: [2155]
tags: [lrc, nft, marketplace, defi]
activation:
  flag: lp2502-nft-marketplace-standard
  hfName: ""
  activationHeight: "0"
---

> **See also**: [LP-2155: LRC-1155 Multi-Token Standard](./lp-2155-lrc-1155-multi-token-standard.md), [LP-6022: Warp Messaging 2.0](./lp-6022-warp-messaging-20-native-interchain-transfers.md)

## Abstract

This LP defines the canonical NFT marketplace infrastructure for the Lux Network, providing trading primitives for ERC-721 and ERC-1155 assets. The standard adopts two complementary protocols: **Seaport** (MIT license) as the primary order-book marketplace from OpenSea, and **Sudoswap v2** (AGPL-3.0) as an automated market maker (AMM) for NFTs. Together these protocols enable auctions, fixed-price listings, collection offers, royalty enforcement, and liquidity pools for NFT trading on Lux C-Chain and compatible EVMs.

## Activation

| Parameter          | Value                                |
|--------------------|--------------------------------------|
| Flag string        | `lp2502-nft-marketplace-standard`    |
| Default in code    | N/A                                  |
| Deployment branch  | N/A                                  |
| Roll-out criteria  | N/A                                  |
| Back-off plan      | N/A                                  |

## Motivation

NFT marketplaces require battle-tested, audited infrastructure to ensure secure trading. Rather than building custom marketplace contracts, Lux adopts industry-standard protocols with proven security records:

1. **Security**: Seaport and Sudoswap have undergone extensive audits (OpenZeppelin, Trail of Bits, Spearbit, Cyfrin)
2. **Interoperability**: Standard order formats enable cross-marketplace liquidity aggregation
3. **Feature Completeness**: Auctions, offers, bundles, royalties, and AMM pools in unified infrastructure
4. **Ecosystem Alignment**: Zoo ecosystem NFT marketplace uses these same primitives
5. **Developer Experience**: Well-documented APIs with existing SDK and tooling support

## Specification

### Protocol Selection

#### Seaport (Primary Marketplace)

**License**: MIT
**Location**: `lib/seaport/`
**Version**: 1.6

Seaport is the order-book marketplace protocol from OpenSea supporting:

- **Basic Orders**: Fixed-price listings and purchases
- **Dutch Auctions**: Descending price auctions
- **English Auctions**: Ascending price auctions with bid increments
- **Collection Offers**: Offers on any item in a collection
- **Trait Offers**: Offers on items with specific attributes
- **Bundle Orders**: Multiple NFTs in single transaction
- **Partial Fills**: Partial fulfillment of orders
- **Conduits**: Approval management for efficient transfers

**Core Contracts**:
```
lib/seaport/contracts/
├── Seaport.sol                    # Main marketplace contract
├── conduit/
│   ├── Conduit.sol               # Token transfer conduit
│   └── ConduitController.sol     # Conduit management
├── helpers/
│   ├── SeaportRouter.sol         # Multi-call router
│   ├── TransferHelper.sol        # Batch transfers
│   └── navigator/                # Order building helpers
│       └── SeaportNavigator.sol
├── zones/
│   ├── PausableZone.sol          # Pausable order zone
│   └── PausableZoneController.sol
└── helpers/order-validator/
    └── SeaportValidator.sol      # Order validation
```

**Canonical Addresses** (cross-chain):
| Contract | Address |
|----------|---------|
| Seaport 1.6 | `0x0000000000000068F116a894984e2DB1123eB395` |
| ConduitController | `0x00000000F9490004C11Cef243f5400493c00Ad63` |
| SeaportValidator | `0x00e5F120f500006757E984F1DED400fc00370000` |
| SeaportNavigator | `0x0000f00000627D293Ab4Dfb40082001724dB006F` |

#### Sudoswap v2 (NFT AMM)

**License**: AGPL-3.0
**Location**: `src/sudo2/`
**Version**: 2.0

Sudoswap provides automated market making for NFTs with bonding curves:

- **Liquidity Pools**: Deposit NFTs + tokens to provide liquidity
- **Bonding Curves**: Linear, exponential, XYK, GDA pricing
- **Property Checking**: Filter by traits or token IDs
- **Royalty Support**: ERC-2981 and Manifold registry
- **Settings**: Project-controlled pool configurations
- **ERC-1155 Support**: Multi-token AMM pools

**Core Contracts**:
```
src/sudo2/src/
├── LSSVMPair.sol                 # Base pair contract
├── LSSVMPairFactory.sol          # Pair deployment factory
├── LSSVMRouter.sol               # Swap routing
├── VeryFastRouter.sol            # Optimized multi-swap router
├── RoyaltyEngine.sol             # On-chain royalty lookup
├── bonding-curves/
│   ├── LinearCurve.sol           # Linear price curve
│   ├── ExponentialCurve.sol      # Exponential price curve
│   ├── XykCurve.sol              # Constant product curve
│   └── GDACurve.sol              # Gradual Dutch Auction
├── erc721/
│   ├── LSSVMPairERC721.sol       # ERC-721 pairs
│   ├── LSSVMPairERC721ETH.sol    # 721<>ETH pairs
│   └── LSSVMPairERC721ERC20.sol  # 721<>ERC20 pairs
├── erc1155/
│   ├── LSSVMPairERC1155.sol      # ERC-1155 pairs
│   ├── LSSVMPairERC1155ETH.sol   # 1155<>ETH pairs
│   └── LSSVMPairERC1155ERC20.sol # 1155<>ERC20 pairs
├── property-checking/
│   ├── MerklePropertyChecker.sol # Merkle-based ID filtering
│   └── RangePropertyChecker.sol  # ID range filtering
└── settings/
    ├── StandardSettings.sol      # Configurable pool settings
    └── StandardSettingsFactory.sol
```

### Dependencies

Sudoswap v2 requires additional dependencies (configured in `src/sudo2/foundry.toml`):

| Dependency | Import Path | Purpose |
|------------|-------------|---------|
| Manifold Royalty Registry | `manifoldxyz/` | ERC-2981 royalty lookup |
| PRB Math | `@prb/math/` | Fixed-point arithmetic |
| Solmate | `solmate/` | Gas-optimized ERC20 |
| Clones With Immutable Args | `clones-with-immutable-args/` | Minimal proxy deployment |

### Standards Compliance

#### ERC-721 (Non-Fungible Tokens)

Both protocols fully support ERC-721:
- `safeTransferFrom` for secure transfers
- `approve` / `setApprovalForAll` for marketplace approvals
- `ownerOf` for ownership verification

#### ERC-1155 (Multi-Token Standard)

Both protocols support ERC-1155:
- `safeTransferFrom` / `safeBatchTransferFrom`
- `balanceOf` / `balanceOfBatch`
- `setApprovalForAll`
- Sudoswap ERC-1155 pools trade specific token IDs

#### ERC-2981 (Royalty Standard)

Royalty enforcement via:
- Native ERC-2981 `royaltyInfo()` queries
- Manifold Royalty Registry fallback
- Support for legacy royalty interfaces (Rarible, Foundation, SuperRare, ArtBlocks)

```solidity
interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external view returns (address receiver, uint256 royaltyAmount);
}
```

### Seaport Integration

#### Order Structure

```solidity
struct OrderParameters {
    address offerer;
    address zone;
    OfferItem[] offer;
    ConsiderationItem[] consideration;
    OrderType orderType;
    uint256 startTime;
    uint256 endTime;
    bytes32 zoneHash;
    uint256 salt;
    bytes32 conduitKey;
    uint256 totalOriginalConsiderationItems;
}

struct OfferItem {
    ItemType itemType;          // NATIVE, ERC20, ERC721, ERC1155
    address token;
    uint256 identifierOrCriteria;
    uint256 startAmount;
    uint256 endAmount;
}

struct ConsiderationItem {
    ItemType itemType;
    address token;
    uint256 identifierOrCriteria;
    uint256 startAmount;
    uint256 endAmount;
    address payable recipient;
}
```

#### Order Types

| Type | Description |
|------|-------------|
| `FULL_OPEN` | Anyone can fulfill |
| `PARTIAL_OPEN` | Partial fills allowed |
| `FULL_RESTRICTED` | Zone approval required |
| `PARTIAL_RESTRICTED` | Partial + zone restricted |
| `CONTRACT` | Contract-generated order |

#### Conduit System

Conduits enable single-approval token transfers:

```solidity
// User approves conduit once
IERC721(nft).setApprovalForAll(conduitAddress, true);

// All Seaport orders use same approval
// No per-order approvals needed
```

### Sudoswap Adaptations

#### Pool Types

| Type | Buy NFT | Sell NFT | Trading Fee |
|------|---------|----------|-------------|
| `TOKEN` | Yes | No | No |
| `NFT` | No | Yes | No |
| `TRADE` | Yes | Yes | Yes |

#### Bonding Curves

**Linear Curve**:
```
newPrice = currentPrice + delta (buy)
newPrice = currentPrice - delta (sell)
```

**Exponential Curve**:
```
newPrice = currentPrice * (1 + delta/1e18) (buy)
newPrice = currentPrice / (1 + delta/1e18) (sell)
```

**XYK Curve** (Constant Product):
```
x * y = k
newPrice derived from reserves
```

**GDA Curve** (Gradual Dutch Auction):
```
Price decays over time until purchase
Resets on each sale
```

#### Property Checking

Pools can restrict tradeable NFTs:

```solidity
interface IPropertyChecker {
    function hasProperties(
        uint256[] calldata ids,
        bytes calldata propertyData
    ) external view returns (bool);
}
```

Implementations:
- `MerklePropertyChecker`: Merkle proof of ID inclusion
- `RangePropertyChecker`: ID range verification

#### Gas Costs

| Operation | Gas Cost |
|-----------|----------|
| Create pool | ~250,000 |
| Swap (single NFT) | ~150,000 |
| Swap (5 NFTs) | ~400,000 |
| Add liquidity | ~180,000 |
| Remove liquidity | ~120,000 |

### Cross-Chain NFTs

#### Warp Messaging Integration

NFTs can be transferred cross-chain using LP-6022 Warp Messaging:

```solidity
interface ICrossChainNFT {
    // Lock NFT on source chain
    function lockAndBridge(
        uint256 tokenId,
        bytes32 destinationChainId,
        address recipient
    ) external returns (bytes32 messageId);

    // Mint wrapped NFT on destination
    function receiveAndMint(
        bytes32 sourceChainId,
        address originalCollection,
        uint256 tokenId,
        address recipient,
        bytes calldata warpProof
    ) external;
}
```

#### Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| C-Chain | 96369 | Primary |
| Hanzo EVM | 36963 | Supported |
| Zoo EVM | 200200 | Supported |
| Subnets | Various | Via Warp |

### Zoo Ecosystem Integration

The Zoo NFT marketplace uses these same primitives:

```
~/work/zoo/contracts/
├── marketplace/
│   ├── ZooSeaport.sol        # Seaport wrapper with Zoo fees
│   ├── ZooSudoPool.sol       # Sudoswap pool factory
│   └── ZooRoyaltyEngine.sol  # Zoo-specific royalty handling
```

**Zoo-Specific Features**:
- ZOO token fee discounts
- Creator royalty enforcement (minimum 2.5%)
- Curated collection verification
- Community governance for marketplace parameters

## Rationale

### Why Seaport

1. **Battle-tested**: Processes billions in NFT volume on OpenSea
2. **Flexible**: Supports any order type (auctions, offers, bundles)
3. **Gas-efficient**: Single-approval conduit system
4. **MIT License**: Permissive for commercial use
5. **Standards**: EIP-712 signatures, ERC-2981 royalties

### Why Sudoswap

1. **Instant Liquidity**: No waiting for buyers/sellers
2. **Price Discovery**: Automated pricing via bonding curves
3. **LP Incentives**: Earn trading fees by providing liquidity
4. **Property Filtering**: Trade only specific traits/IDs
5. **AGPL-3.0**: Ensures derivatives remain open source

### Protocol Complementarity

| Feature | Seaport | Sudoswap |
|---------|---------|----------|
| Fixed-price listings | Yes | No |
| Auctions | Yes | No |
| Collection offers | Yes | No |
| Instant liquidity | No | Yes |
| Bonding curves | No | Yes |
| LP rewards | No | Yes |
| Bundle trades | Yes | Limited |

## Backwards Compatibility

This LP introduces new marketplace infrastructure without modifying existing token standards. Collections using ERC-721 or ERC-1155 work without modification.

**Migration Path**:
- Existing listings on other marketplaces remain valid
- Users approve Seaport conduit for new listings
- Sudoswap pools can be created for any collection
- Royalty settings from ERC-2981 are respected

## Test Cases

### Seaport Tests

```javascript
describe("Seaport NFT Marketplace", () => {
    it("should execute basic order", async () => {
        const order = await createOrder({
            offerer: seller,
            offer: [{ itemType: 2, token: nft, identifier: 1 }],
            consideration: [{ itemType: 0, amount: parseEther("1") }]
        });

        await seaport.connect(buyer).fulfillOrder(order, { value: parseEther("1") });
        expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });

    it("should execute dutch auction", async () => {
        const startPrice = parseEther("10");
        const endPrice = parseEther("1");

        const order = await createOrder({
            offer: [{ token: nft, identifier: 1, startAmount: 1, endAmount: 1 }],
            consideration: [{ amount: startPrice, endAmount: endPrice }],
            startTime: now,
            endTime: now + 86400
        });

        // Price decreases over time
        await time.increase(43200); // 50% through auction
        const midPrice = parseEther("5.5");
        await seaport.connect(buyer).fulfillOrder(order, { value: midPrice });
    });

    it("should enforce royalties", async () => {
        const royaltyRecipient = await nft.royaltyInfo(1, parseEther("1"));

        await seaport.connect(buyer).fulfillOrder(order, { value: parseEther("1") });

        expect(await ethers.provider.getBalance(royaltyRecipient)).to.be.gt(0);
    });
});
```

### Sudoswap Tests

```javascript
describe("Sudoswap NFT AMM", () => {
    it("should create liquidity pool", async () => {
        const pool = await factory.createPairERC721ETH(
            nft.address,
            linearCurve.address,
            parseEther("1"),    // spotPrice
            parseEther("0.1"),  // delta
            0,                  // fee
            [1, 2, 3],         // initialNFTIds
            { value: parseEther("10") }
        );

        expect(await nft.balanceOf(pool.address)).to.equal(3);
    });

    it("should swap NFT for ETH", async () => {
        const [quote, newSpotPrice, newDelta, fee] = await pool.getSellNFTQuote(1, 1);

        await nft.approve(pool.address, 4);
        await pool.swapNFTsForToken([4], quote, seller.address);

        expect(await nft.ownerOf(4)).to.equal(pool.address);
    });

    it("should swap ETH for NFT", async () => {
        const [quote, newSpotPrice, newDelta, fee] = await pool.getBuyNFTQuote(1, 1);

        await pool.swapTokenForAnyNFTs(
            1,
            quote,
            buyer.address,
            false,
            address(0),
            { value: quote }
        );
    });

    it("should enforce property checking", async () => {
        const merkleProof = generateProof([1, 2, 3]);
        await pool.setPropertyChecker(merkleChecker.address, merkleProof);

        // Only IDs 1, 2, 3 can be traded
        await expect(
            pool.swapNFTsForToken([5], quote, seller.address)
        ).to.be.revertedWith("PropertyCheckFailed");
    });
});
```

## Reference Implementation

### Lux Standard Library

**Seaport**: `lib/seaport/`
- Full OpenSea Seaport 1.6 deployment
- Includes conduits, zones, validators, helpers

**Sudoswap**: `src/sudo2/`
- Complete Sudoswap v2 with bonding curves
- ERC-721 and ERC-1155 pool support
- Royalty engine with Manifold integration

### Deployment Commands

```bash
# Build contracts
cd ~/work/lux/standard
forge build

# Run Sudoswap tests (requires dependencies)
cd src/sudo2
forge test

# Deploy Seaport (uses canonical addresses)
forge script script/DeploySeaport.s.sol --broadcast
```

### Integration Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ConsiderationInterface} from "seaport/contracts/interfaces/ConsiderationInterface.sol";
import {LSSVMPairFactory} from "./sudo2/src/LSSVMPairFactory.sol";

contract NFTMarketplace {
    ConsiderationInterface public immutable seaport;
    LSSVMPairFactory public immutable sudoFactory;

    constructor(address _seaport, address _sudoFactory) {
        seaport = ConsiderationInterface(_seaport);
        sudoFactory = LSSVMPairFactory(_sudoFactory);
    }

    // List NFT via Seaport
    function listNFT(
        address nft,
        uint256 tokenId,
        uint256 price
    ) external returns (bytes32 orderHash) {
        // Create and sign Seaport order
        // ...
    }

    // Create Sudoswap pool
    function createPool(
        address nft,
        uint256[] calldata tokenIds,
        uint256 spotPrice
    ) external payable returns (address pool) {
        pool = sudoFactory.createPairERC721ETH(
            IERC721(nft),
            linearCurve,
            spotPrice,
            0.05e18,  // 5% delta
            0,        // no fee
            tokenIds
        );
    }
}
```

## Security Considerations

### Seaport Security

1. **Signature Validation**: EIP-712 typed data signatures prevent replay attacks
2. **Zone Restrictions**: Pausable zones enable emergency stops
3. **Conduit Isolation**: Separate conduits isolate approval risks
4. **Order Cancellation**: Users can cancel orders on-chain
5. **Audits**: OpenZeppelin, Trail of Bits (multiple rounds)

### Sudoswap Security

1. **Reentrancy Protection**: All swap functions use reentrancy guards
2. **Overflow Protection**: Solidity 0.8.x + PRB Math for safe arithmetic
3. **Royalty Caps**: Maximum royalty percentage enforced
4. **Owner Controls**: Pool owners can pause or migrate
5. **Audits**: Spearbit, Cyfrin, Narya (see `v2-audits` repo)

### Cross-Chain Risks

1. **Warp Message Verification**: Always verify BLS aggregate signatures
2. **Wrapped NFT Trust**: Wrapped NFTs rely on bridge security
3. **Finality**: Wait for quantum finality on Q-Chain for high-value transfers
4. **Metadata Sync**: Off-chain metadata may lag cross-chain transfers

### Economic Attacks

1. **Wash Trading**: Monitor for suspicious LP activity
2. **Price Manipulation**: Use time-weighted prices for oracles
3. **Front-Running**: Consider private mempools for high-value trades
4. **Royalty Evasion**: Off-chain royalty enforcement may be bypassed

## Economic Impact

### Fee Structure

| Component | Seaport | Sudoswap |
|-----------|---------|----------|
| Protocol Fee | Configurable | 0.5% default |
| Creator Royalty | ERC-2981 | ERC-2981 |
| LP Fee | N/A | Pool-configurable |
| Gas | ~150k per trade | ~150k per swap |

### Liquidity Benefits

- Sudoswap pools provide instant exit liquidity
- No listing fees for pool deposits
- LP providers earn trading fees
- Price discovery improves market efficiency

## Open Questions

1. **Royalty Enforcement**: Should protocol enforce minimum royalties?
2. **Cross-Chain Listings**: Can Seaport orders span multiple chains?
3. **Curve Governance**: Who approves new bonding curve implementations?
4. **Zoo Integration**: Standardize Zoo marketplace fee handling?

## References

1. [Seaport Documentation](https://docs.opensea.io/docs/seaport)
2. [Seaport GitHub](https://github.com/ProjectOpenSea/seaport)
3. [Sudoswap Documentation](https://docs.sudoswap.xyz/)
4. [Sudoswap v2 Audits](https://github.com/sudoswap/v2-audits)
5. [ERC-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
6. [ERC-1155: Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
7. [ERC-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
8. [Manifold Royalty Registry](https://royaltyregistry.xyz/)
9. [LP-6022: Warp Messaging 2.0](./lp-6022-warp-messaging-20-native-interchain-transfers.md)
10. [LP-2155: LRC-1155 Multi-Token Standard](./lp-2155-lrc-1155-multi-token-standard.md)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
