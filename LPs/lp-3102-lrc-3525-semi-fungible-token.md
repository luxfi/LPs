---
lp: 3102
title: LRC-3525 Semi-Fungible Token
description: Token standard for financial instruments with slot-based fungibility
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 3020, 3200
tags: [lrc, token-standard, defi]
order: 102
---

# LP-3102: LRC-3525 Semi-Fungible Token

## Abstract

LRC-3525 defines a semi-fungible token where tokens are grouped into "slots" - tokens in the same slot are fungible with each other, but tokens in different slots are not. Ideal for financial instruments like bonds, options, and structured products.

## Motivation

Financial instruments often have:
- **Fungibility within class**: All bonds of same series are equal
- **Non-fungibility across class**: Different series are distinct
- **Fractional quantities**: Holdings can be divided

LRC-3525 provides:
- Slot-based grouping for instrument classes
- Fractional token values within slots
- Rich metadata per slot and token

## Specification

### Core Interface

```solidity
interface ILRC3525 is ILRC165, ILRC721 {
    // Events
    event TransferValue(
        uint256 indexed fromTokenId,
        uint256 indexed toTokenId,
        uint256 value
    );
    
    event SlotChanged(
        uint256 indexed tokenId,
        uint256 indexed oldSlot,
        uint256 indexed newSlot
    );
    
    // Value operations
    function valueDecimals() external view returns (uint8);
    function balanceOf(uint256 tokenId) external view returns (uint256);
    function slotOf(uint256 tokenId) external view returns (uint256);
    
    // Transfer value between tokens in same slot
    function transferFrom(
        uint256 fromTokenId,
        uint256 toTokenId,
        uint256 value
    ) external payable returns (uint256);
    
    // Transfer value to address, minting new token
    function transferFrom(
        uint256 fromTokenId,
        address to,
        uint256 value
    ) external payable returns (uint256);
    
    // Approve value transfer
    function approve(
        uint256 tokenId,
        address operator,
        uint256 value
    ) external payable;
    
    function allowance(
        uint256 tokenId,
        address operator
    ) external view returns (uint256);
}
```

### Slot Metadata

```solidity
interface ILRC3525Metadata is ILRC3525 {
    function slotURI(uint256 slot) external view returns (string memory);
}

interface ILRC3525SlotEnumerable is ILRC3525 {
    function slotCount() external view returns (uint256);
    function slotByIndex(uint256 index) external view returns (uint256);
    function tokenSupplyInSlot(uint256 slot) external view returns (uint256);
    function tokenInSlotByIndex(uint256 slot, uint256 index) 
        external view returns (uint256);
}
```

### Implementation

```solidity
contract LRC3525Token is ERC721, ILRC3525 {
    struct TokenData {
        uint256 slot;
        uint256 value;
    }
    
    mapping(uint256 => TokenData) private _tokens;
    mapping(uint256 => mapping(address => uint256)) private _valueAllowances;
    
    uint8 public constant override valueDecimals = 18;
    
    function balanceOf(uint256 tokenId) public view returns (uint256) {
        return _tokens[tokenId].value;
    }
    
    function slotOf(uint256 tokenId) public view returns (uint256) {
        return _tokens[tokenId].slot;
    }
    
    function transferFrom(
        uint256 fromTokenId,
        uint256 toTokenId,
        uint256 value
    ) public payable returns (uint256) {
        require(_isApprovedOrOwner(msg.sender, fromTokenId), "Not approved");
        require(
            _tokens[fromTokenId].slot == _tokens[toTokenId].slot,
            "Slot mismatch"
        );
        
        _tokens[fromTokenId].value -= value;
        _tokens[toTokenId].value += value;
        
        emit TransferValue(fromTokenId, toTokenId, value);
        return toTokenId;
    }
}
```

## Use Cases

### Bond Series
```solidity
// Slot = bond series, Value = principal amount
contract BondToken is LRC3525Token {
    struct BondSeries {
        uint256 maturityDate;
        uint256 couponRate;
        address paymentToken;
    }
    
    mapping(uint256 => BondSeries) public series;
    
    function createSeries(
        uint256 slot,
        uint256 maturity,
        uint256 coupon
    ) external onlyIssuer {
        series[slot] = BondSeries(maturity, coupon, USDC);
    }
}
```

### Options
```solidity
// Slot = strike/expiry combo, Value = number of contracts
contract OptionsToken is LRC3525Token {
    struct OptionSeries {
        address underlying;
        uint256 strikePrice;
        uint256 expiry;
        bool isCall;
    }
    
    mapping(uint256 => OptionSeries) public options;
}
```

## Rationale

- Slot-based design enables financial instrument modeling
- Compatible with LRC-721 for NFT infrastructure
- Value transfers enable fractional trades

## Security Considerations

- Slot validation prevents cross-class transfers
- Value overflow checks required
- Approval system mirrors LRC-20

## References

- [ERC-3525: Semi-Fungible Token](https://eips.ethereum.org/EIPS/eip-3525)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
