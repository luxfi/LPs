---
lip: 69
title: Drop Distribution Standard
description: Standard for token distribution mechanisms including airdrops and claimable distributions
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 20, 721
---

## Abstract

This LIP defines a standard for token distribution mechanisms on the Lux Network, including airdrops, claimable distributions, and vesting schedules. It provides interfaces for creating fair, efficient, and flexible token distribution campaigns while preventing common exploits and ensuring gas efficiency.

## Motivation

Standardized distribution mechanisms enable:

1. **Fair Distribution**: Prevent bots and ensure human recipients
2. **Gas Efficiency**: Merkle tree-based claims reduce costs
3. **Flexibility**: Support various distribution models
4. **Security**: Prevent common airdrop exploits
5. **Composability**: Integration with other protocols

## Specification

### Core Drop Interface

```solidity
interface ILuxDrop {
    // Drop types
    enum DropType {
        Instant,      // Immediate claim
        Linear,       // Linear vesting
        Cliff,        // Cliff + linear vesting
        Merkle,       // Merkle proof based
        Signature     // Signature based
    }
    
    struct DropInfo {
        address token;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 endTime;
        DropType dropType;
        bytes32 merkleRoot;
        bool isPaused;
    }
    
    struct ClaimRecord {
        uint256 amount;
        uint256 claimed;
        uint256 lastClaimTime;
        uint256 vestingStart;
        uint256 vestingEnd;
    }
    
    // Events
    event DropCreated(
        uint256 indexed dropId,
        address indexed token,
        uint256 totalAmount,
        DropType dropType
    );
    
    event Claimed(
        uint256 indexed dropId,
        address indexed claimant,
        uint256 amount
    );
    
    event DropPaused(uint256 indexed dropId, bool paused);
    event DropUpdated(uint256 indexed dropId, bytes32 newMerkleRoot);
    
    // Create a new drop
    function createDrop(
        address token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 endTime,
        DropType dropType,
        bytes32 merkleRoot
    ) external returns (uint256 dropId);
    
    // Claim functions
    function claim(
        uint256 dropId,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external;
    
    function claimWithSignature(
        uint256 dropId,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external;
    
    // View functions
    function getDropInfo(uint256 dropId) external view returns (DropInfo memory);
    function getClaimRecord(uint256 dropId, address user) external view returns (ClaimRecord memory);
    function getClaimableAmount(uint256 dropId, address user) external view returns (uint256);
    function verifyMerkleProof(
        uint256 dropId,
        address user,
        uint256 amount,
        bytes32[] calldata proof
    ) external view returns (bool);
}
```

### Vesting Drop Extension

```solidity
interface IVestingDrop is ILuxDrop {
    struct VestingSchedule {
        uint256 cliff;           // Cliff period in seconds
        uint256 duration;        // Total vesting duration
        uint256 slicePeriod;     // How often vesting occurs
        bool revocable;          // Can be revoked by admin
    }
    
    event VestingScheduleSet(
        uint256 indexed dropId,
        uint256 cliff,
        uint256 duration
    );
    
    event VestingRevoked(
        uint256 indexed dropId,
        address indexed user,
        uint256 amountVested,
        uint256 amountRevoked
    );
    
    function setVestingSchedule(
        uint256 dropId,
        uint256 cliff,
        uint256 duration,
        uint256 slicePeriod,
        bool revocable
    ) external;
    
    function revokeVesting(uint256 dropId, address user) external;
    
    function getVestedAmount(
        uint256 dropId,
        address user,
        uint256 timestamp
    ) external view returns (uint256);
}
```

### NFT Drop Extension

```solidity
interface INFTDrop is ILuxDrop {
    struct NFTDropInfo {
        address collection;
        uint256 maxPerWallet;
        uint256 price;
        bool requiresWhitelist;
        string baseURI;
    }
    
    event NFTClaimed(
        uint256 indexed dropId,
        address indexed claimant,
        uint256[] tokenIds
    );
    
    function createNFTDrop(
        address collection,
        uint256 maxSupply,
        uint256 maxPerWallet,
        uint256 price,
        bytes32 merkleRoot
    ) external returns (uint256 dropId);
    
    function claimNFT(
        uint256 dropId,
        uint256 quantity,
        bytes32[] calldata merkleProof
    ) external payable;
    
    function claimSpecificNFTs(
        uint256 dropId,
        uint256[] calldata tokenIds,
        bytes32[] calldata merkleProof
    ) external payable;
}
```

### Batch Drop Extension

```solidity
interface IBatchDrop is ILuxDrop {
    struct BatchRecipient {
        address recipient;
        uint256 amount;
    }
    
    event BatchDropExecuted(
        address indexed token,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    function batchTransfer(
        address token,
        BatchRecipient[] calldata recipients
    ) external;
    
    function batchTransferETH(
        BatchRecipient[] calldata recipients
    ) external payable;
    
    function createBatchDrop(
        address token,
        BatchRecipient[] calldata recipients,
        uint256 unlockTime
    ) external returns (uint256 dropId);
}
```

### Cross-Chain Drop Extension

```solidity
interface ICrossChainDrop is ILuxDrop {
    struct CrossChainClaim {
        uint256 sourceChain;
        uint256 targetChain;
        address recipient;
        uint256 amount;
        bytes32 claimHash;
    }
    
    event CrossChainClaimInitiated(
        uint256 indexed dropId,
        address indexed claimant,
        uint256 targetChain,
        uint256 amount
    );
    
    event CrossChainClaimCompleted(
        uint256 indexed dropId,
        bytes32 indexed claimHash,
        address recipient
    );
    
    function claimCrossChain(
        uint256 dropId,
        uint256 amount,
        uint256 targetChain,
        bytes32[] calldata merkleProof
    ) external;
    
    function completeCrossChainClaim(
        bytes32 claimHash,
        bytes calldata bridgeProof
    ) external;
}
```

## Rationale

### Merkle Tree Distribution

Using Merkle trees provides:
- Gas-efficient verification
- Privacy until claim
- Easy updates without redeployment
- Support for large recipient lists

### Vesting Schedules

Vesting ensures:
- Long-term alignment
- Reduced sell pressure
- Fair distribution over time
- Protection against dumps

### Multiple Distribution Types

Different types serve different needs:
- Instant: Simple airdrops
- Vesting: Team/investor distributions
- NFT: Community rewards
- Cross-chain: Multi-chain projects

## Backwards Compatibility

This standard is compatible with:
- LRC-20 tokens
- LRC-721 NFTs
- Existing airdrop contracts
- Common distribution patterns

## Test Cases

### Basic Drop Testing

```solidity
contract DropTest {
    ILuxDrop drop;
    IERC20 token;
    
    function testMerkleDrop() public {
        // Create merkle tree
        bytes32[] memory leaves = new bytes32[](3);
        leaves[0] = keccak256(abi.encodePacked(address(0x1), uint256(100)));
        leaves[1] = keccak256(abi.encodePacked(address(0x2), uint256(200)));
        leaves[2] = keccak256(abi.encodePacked(address(0x3), uint256(300)));
        
        bytes32 merkleRoot = getMerkleRoot(leaves);
        
        // Create drop
        uint256 dropId = drop.createDrop(
            address(token),
            600,
            block.timestamp,
            block.timestamp + 30 days,
            ILuxDrop.DropType.Merkle,
            merkleRoot
        );
        
        // Generate proof for address(0x1)
        bytes32[] memory proof = getMerkleProof(leaves, 0);
        
        // Claim
        vm.prank(address(0x1));
        drop.claim(dropId, 100, proof);
        
        // Verify
        assertEq(token.balanceOf(address(0x1)), 100);
    }
    
    function testVestingDrop() public {
        IVestingDrop vestingDrop = IVestingDrop(address(drop));
        
        // Create drop with vesting
        uint256 dropId = drop.createDrop(
            address(token),
            1000,
            block.timestamp,
            block.timestamp + 365 days,
            ILuxDrop.DropType.Linear,
            bytes32(0)
        );
        
        // Set vesting schedule
        vestingDrop.setVestingSchedule(
            dropId,
            30 days,    // 30 day cliff
            365 days,   // 1 year total
            1 days,     // Daily vesting
            true        // Revocable
        );
        
        // Fast forward past cliff
        vm.warp(block.timestamp + 31 days);
        
        uint256 vested = vestingDrop.getVestedAmount(
            dropId,
            address(this),
            block.timestamp
        );
        
        assertTrue(vested > 0);
    }
}
```

### NFT Drop Testing

```solidity
function testNFTDrop() public {
    INFTDrop nftDrop = INFTDrop(address(drop));
    
    uint256 dropId = nftDrop.createNFTDrop(
        address(nftCollection),
        1000,       // Max supply
        5,          // Max per wallet
        0.1 ether,  // Price
        merkleRoot  // Whitelist
    );
    
    // Claim NFTs
    vm.deal(address(this), 1 ether);
    nftDrop.claimNFT{value: 0.3 ether}(dropId, 3, proof);
    
    assertEq(nftCollection.balanceOf(address(this)), 3);
}
```

## Reference Implementation

```solidity
contract LuxDrop is ILuxDrop, IVestingDrop, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    uint256 private nextDropId = 1;
    mapping(uint256 => DropInfo) public drops;
    mapping(uint256 => mapping(address => ClaimRecord)) public claimRecords;
    mapping(uint256 => VestingSchedule) public vestingSchedules;
    mapping(uint256 => mapping(uint256 => bool)) public usedNonces;
    
    modifier validDrop(uint256 dropId) {
        require(drops[dropId].token != address(0), "Invalid drop");
        require(!drops[dropId].isPaused, "Drop paused");
        require(block.timestamp >= drops[dropId].startTime, "Drop not started");
        require(block.timestamp <= drops[dropId].endTime, "Drop ended");
        _;
    }
    
    function createDrop(
        address token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 endTime,
        DropType dropType,
        bytes32 merkleRoot
    ) external override returns (uint256 dropId) {
        require(token != address(0), "Invalid token");
        require(totalAmount > 0, "Invalid amount");
        require(endTime > startTime, "Invalid times");
        
        dropId = nextDropId++;
        
        drops[dropId] = DropInfo({
            token: token,
            totalAmount: totalAmount,
            claimedAmount: 0,
            startTime: startTime,
            endTime: endTime,
            dropType: dropType,
            merkleRoot: merkleRoot,
            isPaused: false
        });
        
        // Transfer tokens to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        
        emit DropCreated(dropId, token, totalAmount, dropType);
    }
    
    function claim(
        uint256 dropId,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external override nonReentrant validDrop(dropId) {
        DropInfo storage drop = drops[dropId];
        require(drop.dropType == DropType.Merkle, "Not merkle drop");
        
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(
            MerkleProof.verify(merkleProof, drop.merkleRoot, leaf),
            "Invalid proof"
        );
        
        _processClaim(dropId, msg.sender, amount);
    }
    
    function _processClaim(
        uint256 dropId,
        address user,
        uint256 totalAmount
    ) internal {
        DropInfo storage drop = drops[dropId];
        ClaimRecord storage record = claimRecords[dropId][user];
        
        uint256 claimableNow = _getClaimableAmount(dropId, user, totalAmount);
        require(claimableNow > 0, "Nothing to claim");
        
        // Update records
        record.amount = totalAmount;
        record.claimed += claimableNow;
        record.lastClaimTime = block.timestamp;
        drop.claimedAmount += claimableNow;
        
        require(drop.claimedAmount <= drop.totalAmount, "Exceeds total");
        
        // Transfer tokens
        IERC20(drop.token).safeTransfer(user, claimableNow);
        
        emit Claimed(dropId, user, claimableNow);
    }
    
    function _getClaimableAmount(
        uint256 dropId,
        address user,
        uint256 totalAmount
    ) internal view returns (uint256) {
        DropInfo memory drop = drops[dropId];
        ClaimRecord memory record = claimRecords[dropId][user];
        
        if (drop.dropType == DropType.Instant || drop.dropType == DropType.Merkle) {
            // Instant claim full amount
            return totalAmount - record.claimed;
        }
        
        if (drop.dropType == DropType.Linear || drop.dropType == DropType.Cliff) {
            VestingSchedule memory schedule = vestingSchedules[dropId];
            uint256 vested = _calculateVested(
                totalAmount,
                block.timestamp,
                drop.startTime,
                schedule.cliff,
                schedule.duration
            );
            return vested - record.claimed;
        }
        
        return 0;
    }
    
    function _calculateVested(
        uint256 totalAmount,
        uint256 currentTime,
        uint256 startTime,
        uint256 cliff,
        uint256 duration
    ) internal pure returns (uint256) {
        if (currentTime < startTime + cliff) {
            return 0;
        }
        
        if (currentTime >= startTime + duration) {
            return totalAmount;
        }
        
        uint256 elapsed = currentTime - startTime;
        return (totalAmount * elapsed) / duration;
    }
    
    function setVestingSchedule(
        uint256 dropId,
        uint256 cliff,
        uint256 duration,
        uint256 slicePeriod,
        bool revocable
    ) external override onlyOwner {
        require(drops[dropId].token != address(0), "Invalid drop");
        require(
            drops[dropId].dropType == DropType.Linear || 
            drops[dropId].dropType == DropType.Cliff,
            "Not vesting drop"
        );
        
        vestingSchedules[dropId] = VestingSchedule({
            cliff: cliff,
            duration: duration,
            slicePeriod: slicePeriod,
            revocable: revocable
        });
        
        emit VestingScheduleSet(dropId, cliff, duration);
    }
    
    function pauseDrop(uint256 dropId, bool paused) external onlyOwner {
        drops[dropId].isPaused = paused;
        emit DropPaused(dropId, paused);
    }
    
    function updateMerkleRoot(uint256 dropId, bytes32 newRoot) external onlyOwner {
        require(drops[dropId].dropType == DropType.Merkle, "Not merkle drop");
        drops[dropId].merkleRoot = newRoot;
        emit DropUpdated(dropId, newRoot);
    }
}
```

## Security Considerations

### Reentrancy Protection

Use reentrancy guards on all claim functions:
```solidity
modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}
```

### Merkle Proof Validation

Ensure proofs cannot be reused:
```solidity
mapping(uint256 => mapping(bytes32 => bool)) public usedLeaves;
require(!usedLeaves[dropId][leaf], "Already claimed");
usedLeaves[dropId][leaf] = true;
```

### Overflow Protection

Use safe math for all calculations:
```solidity
uint256 vested = (totalAmount * elapsed) / duration;
require(vested <= totalAmount, "Overflow");
```

### Admin Controls

Implement time locks for sensitive operations:
```solidity
uint256 public constant TIMELOCK = 2 days;
mapping(bytes32 => uint256) public pendingActions;
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).