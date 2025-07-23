---
lip: 65
title: Multi-Token Standard (LRC-6909)
description: Minimal multi-token standard for Lux Network based on ERC-6909
author: Lux Network Team (@luxdefi)
discussions-to: https://forum.lux.network/lip-65
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 20
---

## Abstract

This LIP defines a minimal standard for managing multiple tokens within a single contract on Lux Network, based on ERC-6909. It provides a simplified alternative to LRC-1155 by removing callbacks and batching while implementing a granular permission system for scalable approvals.

## Motivation

A minimal multi-token standard enables:

1. **Simplicity**: Reduced complexity compared to LRC-1155
2. **Gas Efficiency**: No callback overhead
3. **Granular Permissions**: Per-token and per-spender approvals
4. **Composability**: Clean interfaces for DeFi protocols
5. **Flexibility**: Suitable for various use cases

## Specification

### Core Multi-Token Interface

```solidity
interface ILRC6909 {
    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed id, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id, uint256 amount);
    event OperatorSet(address indexed owner, address indexed spender, bool approved);
    
    // Metadata
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals(uint256 id) external view returns (uint8);
    
    // Token supplies
    function totalSupply(uint256 id) external view returns (uint256);
    function balanceOf(address owner, uint256 id) external view returns (uint256);
    
    // Allowances
    function allowance(address owner, address spender, uint256 id) external view returns (uint256);
    function isOperator(address owner, address spender) external view returns (bool);
    
    // Transfers
    function transfer(address to, uint256 id, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 id, uint256 amount) external returns (bool);
    
    // Approvals
    function approve(address spender, uint256 id, uint256 amount) external returns (bool);
    function setOperator(address spender, bool approved) external returns (bool);
}
```

### Metadata Extension

```solidity
interface ILRC6909Metadata is ILRC6909 {
    // Per-token metadata
    function tokenName(uint256 id) external view returns (string memory);
    function tokenSymbol(uint256 id) external view returns (string memory);
    function tokenURI(uint256 id) external view returns (string memory);
}
```

### Supply Management Extension

```solidity
interface ILRC6909Supply is ILRC6909 {
    event Minted(address indexed to, uint256 indexed id, uint256 amount);
    event Burned(address indexed from, uint256 indexed id, uint256 amount);
    
    // Minting and burning
    function mint(address to, uint256 id, uint256 amount) external;
    function burn(address from, uint256 id, uint256 amount) external;
    
    // Supply caps
    function maxSupply(uint256 id) external view returns (uint256);
    function setMaxSupply(uint256 id, uint256 max) external;
}
```

### Content Hash Extension

```solidity
interface ILRC6909ContentHash is ILRC6909 {
    event ContentHashUpdated(uint256 indexed id, bytes32 oldHash, bytes32 newHash);
    
    // IPFS or other content addressing
    function contentHash(uint256 id) external view returns (bytes32);
    function setContentHash(uint256 id, bytes32 hash) external;
}
```

### Permission Extensions

```solidity
interface ILRC6909Permissions is ILRC6909 {
    // Temporary approvals
    struct TemporaryApproval {
        uint256 amount;
        uint256 expiry;
    }
    
    event TemporaryApprovalSet(
        address indexed owner,
        address indexed spender,
        uint256 indexed id,
        uint256 amount,
        uint256 expiry
    );
    
    function temporaryAllowance(
        address owner,
        address spender,
        uint256 id
    ) external view returns (uint256 amount, uint256 expiry);
    
    function approveWithExpiry(
        address spender,
        uint256 id,
        uint256 amount,
        uint256 expiry
    ) external returns (bool);
    
    // Spending limits
    function spendingLimit(
        address owner,
        address spender,
        uint256 id
    ) external view returns (uint256 limitPerPeriod, uint256 periodDuration, uint256 spent, uint256 lastReset);
    
    function setSpendingLimit(
        address spender,
        uint256 id,
        uint256 limitPerPeriod,
        uint256 periodDuration
    ) external returns (bool);
}
```

## Rationale

### Minimal Design

Removing unnecessary features from LRC-1155:
- No callbacks reduce gas costs and complexity
- No batching simplifies implementation
- Focus on core functionality

### Hybrid Permission System

The dual approval system provides:
- Fine-grained control with per-token approvals
- Convenience with operator approvals
- Better security than unlimited approvals

### ERC-6909 Alignment

Following ERC-6909 ensures:
- Ethereum ecosystem compatibility
- Proven design patterns
- Tool and infrastructure support

## Backwards Compatibility

This standard is NOT backwards compatible with:
- LRC-1155 (different interface and no callbacks)
- LRC-20 (multi-token vs single token)

Migration paths:
- Wrapper contracts for LRC-1155 compatibility
- Token ID mapping for specific use cases

## Test Cases

### Basic Operations

```solidity
contract LRC6909Test {
    ILRC6909 multiToken;
    
    function testTransfer() public {
        uint256 tokenId = 1;
        uint256 amount = 100;
        address recipient = address(0x123);
        
        // Mint tokens first
        multiToken.mint(address(this), tokenId, amount);
        
        // Transfer
        bool success = multiToken.transfer(recipient, tokenId, amount);
        assertTrue(success);
        
        assertEq(multiToken.balanceOf(recipient, tokenId), amount);
        assertEq(multiToken.balanceOf(address(this), tokenId), 0);
    }
    
    function testApprovalAndTransferFrom() public {
        uint256 tokenId = 1;
        uint256 amount = 100;
        address spender = address(0x456);
        
        multiToken.mint(address(this), tokenId, amount);
        
        // Approve specific amount
        multiToken.approve(spender, tokenId, 50);
        assertEq(multiToken.allowance(address(this), spender, tokenId), 50);
        
        // Transfer using allowance
        vm.prank(spender);
        multiToken.transferFrom(address(this), spender, tokenId, 50);
        
        assertEq(multiToken.allowance(address(this), spender, tokenId), 0);
        assertEq(multiToken.balanceOf(spender, tokenId), 50);
    }
    
    function testOperator() public {
        address operator = address(0x789);
        
        // Set operator
        multiToken.setOperator(operator, true);
        assertTrue(multiToken.isOperator(address(this), operator));
        
        // Operator can transfer any token
        multiToken.mint(address(this), 1, 100);
        multiToken.mint(address(this), 2, 200);
        
        vm.prank(operator);
        multiToken.transferFrom(address(this), operator, 1, 100);
        vm.prank(operator);
        multiToken.transferFrom(address(this), operator, 2, 200);
        
        assertEq(multiToken.balanceOf(operator, 1), 100);
        assertEq(multiToken.balanceOf(operator, 2), 200);
    }
}
```

### Permission Testing

```solidity
function testTemporaryApproval() public {
    ILRC6909Permissions permToken = ILRC6909Permissions(address(multiToken));
    
    uint256 tokenId = 1;
    address spender = address(0xABC);
    uint256 amount = 100;
    uint256 expiry = block.timestamp + 1 hours;
    
    // Set temporary approval
    permToken.approveWithExpiry(spender, tokenId, amount, expiry);
    
    (uint256 allowedAmount, uint256 expiryTime) = permToken.temporaryAllowance(
        address(this),
        spender,
        tokenId
    );
    
    assertEq(allowedAmount, amount);
    assertEq(expiryTime, expiry);
    
    // Fast forward past expiry
    vm.warp(block.timestamp + 2 hours);
    
    // Approval should be expired
    vm.prank(spender);
    vm.expectRevert("Approval expired");
    multiToken.transferFrom(address(this), spender, tokenId, amount);
}
```

## Reference Implementation

```solidity
contract LRC6909 is ILRC6909 {
    // Token balances
    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    
    // Token allowances
    mapping(address => mapping(address => mapping(uint256 => uint256))) public allowance;
    
    // Operator approvals
    mapping(address => mapping(address => bool)) public isOperator;
    
    // Token supplies
    mapping(uint256 => uint256) public totalSupply;
    
    // Metadata
    string public name;
    string public symbol;
    mapping(uint256 => uint8) public decimals;
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function transfer(
        address to,
        uint256 id,
        uint256 amount
    ) public virtual returns (bool) {
        return _transfer(msg.sender, to, id, amount);
    }
    
    function transferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) public virtual returns (bool) {
        if (msg.sender != from && !isOperator[from][msg.sender]) {
            uint256 allowed = allowance[from][msg.sender][id];
            if (allowed != type(uint256).max) {
                require(allowed >= amount, "Insufficient allowance");
                
                unchecked {
                    allowance[from][msg.sender][id] = allowed - amount;
                }
            }
        }
        
        return _transfer(from, to, id, amount);
    }
    
    function approve(
        address spender,
        uint256 id,
        uint256 amount
    ) public virtual returns (bool) {
        allowance[msg.sender][spender][id] = amount;
        
        emit Approval(msg.sender, spender, id, amount);
        
        return true;
    }
    
    function setOperator(address spender, bool approved) public virtual returns (bool) {
        isOperator[msg.sender][spender] = approved;
        
        emit OperatorSet(msg.sender, spender, approved);
        
        return true;
    }
    
    function _transfer(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) internal virtual returns (bool) {
        require(to != address(0), "Transfer to zero address");
        
        uint256 fromBalance = balanceOf[from][id];
        require(fromBalance >= amount, "Insufficient balance");
        
        unchecked {
            balanceOf[from][id] = fromBalance - amount;
        }
        
        balanceOf[to][id] += amount;
        
        emit Transfer(from, to, id, amount);
        
        return true;
    }
    
    function _mint(
        address to,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(to != address(0), "Mint to zero address");
        
        totalSupply[id] += amount;
        balanceOf[to][id] += amount;
        
        emit Transfer(address(0), to, id, amount);
    }
    
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        uint256 fromBalance = balanceOf[from][id];
        require(fromBalance >= amount, "Insufficient balance");
        
        unchecked {
            balanceOf[from][id] = fromBalance - amount;
            totalSupply[id] -= amount;
        }
        
        emit Transfer(from, address(0), id, amount);
    }
}
```

### Supply Management Implementation

```solidity
contract LRC6909Supply is LRC6909, ILRC6909Supply {
    mapping(uint256 => uint256) public maxSupply;
    mapping(address => bool) public minters;
    
    modifier onlyMinter() {
        require(minters[msg.sender], "Not a minter");
        _;
    }
    
    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) external onlyMinter {
        uint256 max = maxSupply[id];
        if (max > 0) {
            require(totalSupply[id] + amount <= max, "Exceeds max supply");
        }
        
        _mint(to, id, amount);
        emit Minted(to, id, amount);
    }
    
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external {
        require(
            from == msg.sender || isOperator[from][msg.sender],
            "Not authorized to burn"
        );
        
        _burn(from, id, amount);
        emit Burned(from, id, amount);
    }
    
    function setMaxSupply(uint256 id, uint256 max) external onlyOwner {
        require(max >= totalSupply[id], "Below current supply");
        maxSupply[id] = max;
    }
}
```

## Security Considerations

### Integer Overflow

Use unchecked blocks only where safe:
```solidity
unchecked {
    // Safe because we already checked balance >= amount
    balanceOf[from][id] = fromBalance - amount;
}
```

### Zero Address Checks

Always validate addresses:
```solidity
require(to != address(0), "Transfer to zero address");
```

### Approval Front-Running

Implement increase/decrease approval functions:
```solidity
function increaseAllowance(address spender, uint256 id, uint256 addedValue) external returns (bool) {
    approve(spender, id, allowance[msg.sender][spender][id] + addedValue);
    return true;
}
```

### Reentrancy

While simpler than LRC-1155, still consider reentrancy:
```solidity
// Update state before external calls
balanceOf[from][id] -= amount;
balanceOf[to][id] += amount;
// Then emit event
emit Transfer(from, to, id, amount);
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).