#!/usr/bin/env python3
"""
Reorganize Web3/Solidity LPs into logical ERC-ordered structure.

New 3xxx Range Organization:
  3000-3099: LRC-20 Family (ERC-20 and extensions)
  3100-3199: LRC-1155 Family (Multi-token)
  3200-3299: LRC-721 Family (NFTs)
  3300-3399: Account Abstraction & Wallets
  3400-3499: DeFi Primitives (Vaults, Flash Loans)
  3500-3599: Precompiles
  3600-3699: VM & Execution Environment
  3700-3799: Chain Infrastructure
  3800-3899: Bridge & Cross-Chain
  3900-3999: Reserved/Experimental
"""

import os
import re
import shutil
from pathlib import Path

LP_DIR = Path(__file__).parent.parent / "LPs"

# Mapping: old LP number -> (new LP number, new title if changed)
REMAP = {
    # === LRC-20 Family (3000-3099) ===
    3020: (3020, None),  # LRC-20 stays
    3028: (3021, "LRC-20 Burnable Extension"),
    3029: (3022, "LRC-20 Mintable Extension"),
    3030: (3023, "LRC-20 Bridgable Extension"),
    3027: (3029, "LRC Token Standards Adoption Guide"),
    
    # === LRC-1155 Family (3100-3199) ===
    3155: (3100, "LRC-1155 Multi-Token Standard"),
    
    # === LRC-721 Family (3200-3299) ===
    3721: (3200, "LRC-721 Non-Fungible Token Standard"),
    3031: (3201, "LRC-721 Burnable Extension"),
    3070: (3210, "NFT Staking Standard"),
    3071: (3211, "Media Content NFT Standard"),
    
    # === Account Abstraction (3300-3399) ===
    3103: (3300, "LRC-4337 Account Abstraction"),
    3104: (3310, "Safe Multisig Standard"),
    3106: (3320, "Lamport Signatures for Safe"),
    
    # === DeFi Primitives (3400-3499) ===
    # New LPs will be created
    
    # === Precompiles (3500-3599) ===
    3511: (3500, "ML-DSA Signature Precompile"),
    3512: (3501, "SLH-DSA Signature Precompile"),
    3513: (3510, "Warp Messaging Precompile"),
    3514: (3511, "Fee Manager Precompile"),
    3714: (3502, None),  # Move ML-DSA duplicate
    3715: (3512, None),  # Move Warp duplicate
    3716: (3503, "Quasar Consensus Precompile"),
    3717: (3520, "Precompile Suite Overview"),
    
    # === VM & Execution (3600-3699) ===
    3000: (3600, "Virtual Machine and Execution Environment"),
    3001: (3601, "VM SDK Specification"),
    3201: (3610, "AIVM - AI Virtual Machine"),
    3232: (3620, "C-Chain Rollup Plugin Architecture"),
    3235: (3621, "Stage Sync Pipeline for Coreth"),
    3276: (3630, "Random Number Generation Standard"),
    3299: (3640, "C-Chain Upgrade Mapping"),
    3318: (3641, "ChainVM Compatibility"),
    3376: (3650, "Dynamic Gas Pricing"),
    3404: (3651, "secp256r1 Curve Integration"),
    3426: (3652, "Dynamic Minimum Block Times"),
    3520: (3653, "Dynamic EVM Gas Limit Updates"),
    3526: (3660, "Network Upgrade and State Migration"),
    3527: (3661, "BadgerDB Verkle Optimization"),
    
    # === Chain Infrastructure (3700-3799) ===
    3804: (3700, "State Sync and Pruning Protocol"),
    3806: (3701, "Verkle Trees for State Management"),
    
    # === Bridge & Cross-Chain (3800-3899) ===
    3072: (3800, "Bridged Asset Standard"),
    3718: (3810, "Teleport Token Standard"),
    3225: (3820, "L2 to Sovereign L1 Ascension"),
}

# New LPs to create for missing ERCs
NEW_LPS = [
    # LRC-20 Extensions
    (3024, "LRC-2612 Permit Extension", "lrc, token-standard, evm", """
## Abstract
LRC-2612 (mirrors ERC-2612) extends LRC-20 with permit functionality, enabling gasless token approvals through signatures.

## Specification
Implements `permit(owner, spender, value, deadline, v, r, s)` allowing approvals via off-chain signatures.
"""),
    (3025, "LRC-20 Votes Extension", "lrc, token-standard, governance", """
## Abstract
LRC-20 Votes extension for governance tokens with delegation and vote checkpointing.

## Specification
Implements delegation, vote checkpointing, and EIP-712 signatures for governance participation.
"""),
    
    # Core Infrastructure (3050-3069)
    (3050, "LRC-165 Interface Detection", "lrc, token-standard, evm", """
## Abstract
LRC-165 (mirrors ERC-165) provides standard interface detection for smart contracts.

## Specification
Implements `supportsInterface(bytes4 interfaceId)` returning true for supported interfaces.
"""),
    (3051, "LRC-173 Contract Ownership", "lrc, token-standard, evm", """
## Abstract
LRC-173 (mirrors ERC-173) provides standard contract ownership interface.

## Specification
Implements `owner()`, `transferOwnership(address)`, and `OwnershipTransferred` event.
"""),
    (3052, "LRC-1967 Proxy Storage Slots", "lrc, token-standard, evm, proxy", """
## Abstract
LRC-1967 (mirrors ERC-1967) standardizes proxy storage slots for upgradeable contracts.

## Specification
Defines standard storage slots for implementation, admin, and beacon addresses.
"""),
    
    # LRC-1155 Extensions (3100-3199)
    (3101, "LRC-1155 Supply Extension", "lrc, token-standard, nft", """
## Abstract
Extension tracking total supply for each token ID in LRC-1155 contracts.

## Specification
Implements `totalSupply(uint256 id)` and `exists(uint256 id)` functions.
"""),
    (3150, "LRC-6909 Minimal Multi-Token", "lrc, token-standard", """
## Abstract
LRC-6909 (mirrors ERC-6909) provides a gas-efficient minimal multi-token interface.

## Specification
Simplified multi-token standard with reduced gas costs compared to LRC-1155.
"""),
    
    # LRC-721 Extensions (3200-3299)
    (3202, "LRC-721 Enumerable Extension", "lrc, token-standard, nft", """
## Abstract
LRC-721 Enumerable extension for iterating over all tokens and owner tokens.

## Specification
Implements `totalSupply()`, `tokenByIndex()`, and `tokenOfOwnerByIndex()`.
"""),
    (3203, "LRC-2981 NFT Royalties", "lrc, token-standard, nft", """
## Abstract
LRC-2981 (mirrors ERC-2981) standardizes NFT royalty information.

## Specification
Implements `royaltyInfo(tokenId, salePrice)` returning receiver and royalty amount.
"""),
    (3220, "LRC-5192 Soulbound Tokens", "lrc, token-standard, nft, soulbound", """
## Abstract
LRC-5192 (mirrors ERC-5192) defines minimal soulbound (non-transferable) NFTs.

## Specification
Adds `locked(uint256 tokenId)` to indicate non-transferability.
"""),
    (3230, "LRC-6551 Token Bound Accounts", "lrc, token-standard, nft, smart-wallet", """
## Abstract
LRC-6551 (mirrors ERC-6551) enables NFTs to own assets as smart contract wallets.

## Specification
Every NFT gets a deterministic smart contract account that can hold assets.
"""),
    
    # Account Abstraction (3300-3399)
    (3301, "Paymaster Standard", "lrc, account-abstraction, evm", """
## Abstract
Standard interface for paymasters that sponsor gas fees for users.

## Specification
Defines paymaster interface for ERC-4337 account abstraction infrastructure.
"""),
    (3302, "LRC-1271 Signature Validation", "lrc, token-standard, smart-wallet", """
## Abstract
LRC-1271 (mirrors ERC-1271) standardizes signature validation for smart contracts.

## Specification
Implements `isValidSignature(hash, signature)` for contract-based accounts.
"""),
    
    # DeFi Primitives (3400-3499)
    (3400, "LRC-4626 Tokenized Vault", "lrc, token-standard, defi, vault", """
## Abstract
LRC-4626 (mirrors ERC-4626) standardizes tokenized yield-bearing vaults.

## Specification
Defines deposit/withdraw/mint/redeem interface with share accounting for DeFi vaults.
"""),
    (3401, "LRC-4626 Multi-Vault Extensions", "lrc, token-standard, defi, vault", """
## Abstract
Extensions for multi-asset and multi-strategy vault implementations.

## Specification
Extends LRC-4626 with support for multiple underlying assets and yield strategies.
"""),
    (3410, "LRC-3156 Flash Loans", "lrc, token-standard, defi", """
## Abstract
LRC-3156 (mirrors ERC-3156) standardizes flash loan interfaces.

## Specification
Defines `flashLoan()` and `FlashBorrower` interface for atomic borrowing.
"""),
    (3420, "LRC-777 Advanced Token", "lrc, token-standard, evm", """
## Abstract
LRC-777 (mirrors ERC-777) provides advanced token functionality with hooks.

## Specification
Token standard with send/receive hooks and operator permissions.
"""),
]

def get_lp_files():
    """Get all LP files in the 3xxx range."""
    files = {}
    for f in LP_DIR.glob("lp-3*.md"):
        match = re.search(r'lp-(\d+)', f.name)
        if match:
            lp_num = int(match.group(1))
            files[lp_num] = f
    return files

def read_lp(path):
    """Read LP file content."""
    with open(path, 'r') as f:
        return f.read()

def update_frontmatter(content, new_lp, new_title=None):
    """Update LP number and optionally title in frontmatter."""
    # Update lp number
    content = re.sub(r'^lp:\s*\d+', f'lp: {new_lp}', content, flags=re.MULTILINE)
    
    # Update title if provided
    if new_title:
        content = re.sub(r'^title:.*$', f'title: {new_title}', content, flags=re.MULTILINE)
    
    return content

def create_new_lp(lp_num, title, tags, abstract_spec):
    """Create a new LP file with basic structure."""
    content = f"""---
lp: {lp_num}
title: {title}
description: {title} for Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
tags: [{tags}]
order: {lp_num}
---
{abstract_spec}

## Motivation

This standard ensures compatibility with the broader EVM ecosystem while enabling Lux-specific optimizations.

## Rationale

Mirrors the corresponding Ethereum standard for maximum compatibility.

## Backwards Compatibility

Fully compatible with existing ERC implementations.

## Security Considerations

Implementations should follow established security best practices for the corresponding ERC.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
"""
    return content

def main():
    print("=" * 60)
    print("Web3/LRC LP Reorganization")
    print("=" * 60)
    
    files = get_lp_files()
    print(f"\nFound {len(files)} LPs in 3xxx range")
    
    # Phase 1: Rename existing files to temp names to avoid conflicts
    print("\n--- Phase 1: Moving to temp names ---")
    temp_dir = LP_DIR / "_temp_reorg"
    temp_dir.mkdir(exist_ok=True)
    
    for old_lp, path in files.items():
        if old_lp in REMAP:
            new_lp, new_title = REMAP[old_lp]
            temp_path = temp_dir / f"lp-{new_lp:04d}.md"
            
            content = read_lp(path)
            content = update_frontmatter(content, new_lp, new_title)
            
            with open(temp_path, 'w') as f:
                f.write(content)
            
            print(f"  LP-{old_lp} -> LP-{new_lp} (temp)")
    
    # Phase 2: Remove old files
    print("\n--- Phase 2: Removing old files ---")
    for old_lp, path in files.items():
        if old_lp in REMAP:
            path.unlink()
            print(f"  Removed {path.name}")
    
    # Phase 3: Move temp files to final location
    print("\n--- Phase 3: Moving to final locations ---")
    for temp_file in temp_dir.glob("lp-*.md"):
        final_path = LP_DIR / temp_file.name
        
        # Extract title for filename
        content = read_lp(temp_file)
        title_match = re.search(r'^title:\s*[\'"]?([^\'"\n]+)', content, re.MULTILINE)
        if title_match:
            title = title_match.group(1).strip()
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
            lp_match = re.search(r'lp-(\d+)', temp_file.name)
            if lp_match:
                lp_num = lp_match.group(1)
                final_name = f"lp-{lp_num}-{slug}.md"
                final_path = LP_DIR / final_name
        
        shutil.move(temp_file, final_path)
        print(f"  -> {final_path.name}")
    
    temp_dir.rmdir()
    
    # Phase 4: Create new LPs for missing ERCs
    print("\n--- Phase 4: Creating new LRC standards ---")
    for lp_num, title, tags, abstract in NEW_LPS:
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        filename = f"lp-{lp_num:04d}-{slug}.md"
        path = LP_DIR / filename
        
        if not path.exists():
            content = create_new_lp(lp_num, title, tags, abstract)
            with open(path, 'w') as f:
                f.write(content)
            print(f"  Created {filename}")
        else:
            print(f"  Exists: {filename}")
    
    print("\n" + "=" * 60)
    print("Reorganization complete!")
    print("=" * 60)
    
    # Print summary
    print("\nNew 3xxx Structure:")
    print("  3000-3099: LRC-20 Family")
    print("  3100-3199: LRC-1155 Family")
    print("  3200-3299: LRC-721 Family")
    print("  3300-3399: Account Abstraction")
    print("  3400-3499: DeFi Primitives")
    print("  3500-3599: Precompiles")
    print("  3600-3699: VM & Execution")
    print("  3700-3799: Chain Infrastructure")
    print("  3800-3899: Bridge & Cross-Chain")

if __name__ == "__main__":
    main()
