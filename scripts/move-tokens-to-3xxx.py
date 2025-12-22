#!/usr/bin/env python3
"""Move token standards from 2xxx to 3xxx (Solidity/Web3)"""
import os
import re
from pathlib import Path

LP_DIR = Path("/Users/z/work/lux/lps/LPs")

# Token standards: 2xxx → 3xxx (same offset)
RENUMBER_MAP = {
    2020: 3020,  # LRC-20 Fungible Token
    2027: 3027,  # LRC Token Standards Adoption
    2028: 3028,  # LRC-20 Burnable
    2029: 3029,  # LRC-20 Mintable
    2030: 3030,  # LRC-20 Bridgable
    2031: 3031,  # LRC-721 Burnable
    2070: 3070,  # NFT Staking
    2071: 3071,  # Media Content NFT
    2072: 3072,  # Bridged Asset
    2155: 3155,  # LRC-1155 Multi-Token
    2718: 3718,  # Teleport Token
    2721: 3721,  # LRC-721 NFT
}

def renumber_lp(old_num, new_num):
    """Rename file and update frontmatter."""
    old_pattern = f"lp-{old_num:04d}-*.md" if old_num < 10000 else f"lp-{old_num:05d}-*.md"
    matches = list(LP_DIR.glob(old_pattern))
    
    if not matches:
        print(f"  ⚠️  LP-{old_num}: not found")
        return False
    
    old_path = matches[0]
    new_prefix = f"lp-{new_num:04d}-" if new_num < 10000 else f"lp-{new_num:05d}-"
    suffix = old_path.name.split('-', 2)[2] if old_path.name.count('-') >= 2 else old_path.name
    new_path = LP_DIR / f"{new_prefix}{suffix}"
    
    # Read and update content
    content = old_path.read_text()
    content = re.sub(rf'^lp:\s*{old_num}\s*$', f'lp: {new_num}', content, flags=re.MULTILINE)
    
    # Write to new path
    new_path.write_text(content)
    
    # Remove old file if different
    if old_path != new_path:
        old_path.unlink()
    
    print(f"  ✓ LP-{old_num} → LP-{new_num}")
    return True

def main():
    print("Moving Token Standards: 2xxx → 3xxx")
    print("=" * 50)
    
    moved = 0
    for old_num, new_num in RENUMBER_MAP.items():
        if renumber_lp(old_num, new_num):
            moved += 1
    
    print(f"\nMoved {moved} LPs")

if __name__ == "__main__":
    main()
