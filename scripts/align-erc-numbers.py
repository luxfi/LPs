#!/usr/bin/env python3
"""
Reorganize 3xxx LPs to align with ERC numbers:
- LRC-20 → LP-3020
- LRC-721 → LP-3721
- LRC-1155 → LP-3155
- LRC-4337 → LP-3337
- etc.
"""

import os
import re
import shutil

LP_DIR = "/Users/z/work/lux/lps/LPs"

# Mapping: current LP number → (new LP number, new title or None to keep)
REMAP = {
    # LRC-20 stays at 3020, extensions stay nearby
    # 3020: (3020, None),  # LRC-20 - stays
    # 3021-3025: LRC-20 extensions - stay
    
    # Move standards to match ERC numbers
    3024: (3612, "LRC-2612 Permit Extension"),           # ERC-2612
    3026: (3363, "LRC-1363 Payable Token"),              # ERC-1363  
    3027: (3009, "LRC-3009 Transfer With Authorization"), # ERC-3009
    3030: (3528, "LRC-5528 Refundable Token"),           # ERC-5528
    
    # Infrastructure - align with ERC numbers
    3050: (3165, "LRC-165 Interface Detection"),         # ERC-165
    3051: (3173, "LRC-173 Contract Ownership"),          # ERC-173
    3052: (3967, "LRC-1967 Proxy Storage Slots"),        # ERC-1967
    3053: (3201, "LRC-7201 Namespaced Storage Layout"),  # ERC-7201 → 3201
    3054: (3169, "LRC-5169 Client Script URI"),          # ERC-5169 → 3169
    3055: (3572, "LRC-7572 Contract-level Metadata"),    # ERC-7572 → 3572
    
    # LRC-1155 family → 3155
    3100: (3155, "LRC-1155 Multi-Token Standard"),       # ERC-1155
    3101: (3156, None),  # Keep as 1155 Supply (3156 taken by flash loans, use 3157)
    3102: (3525, "LRC-3525 Semi-Fungible Token"),        # ERC-3525
    3150: (3909, "LRC-6909 Minimal Multi-Token"),        # ERC-6909 → 3909
    
    # LRC-721 family → 3721
    3200: (3721, "LRC-721 Non-Fungible Token Standard"), # ERC-721
    3201: (3722, "LRC-721 Burnable Extension"),          # 721 extension
    3202: (3723, "LRC-721 Enumerable Extension"),        # 721 extension
    3203: (3981, "LRC-2981 NFT Royalties"),              # ERC-2981
    3204: (3675, "LRC-4675 Multi-Fractional NFT"),       # ERC-4675
    3220: (3192, "LRC-5192 Soulbound Tokens"),           # ERC-5192 → 3192
    3230: (3551, "LRC-6551 Token Bound Accounts"),       # ERC-6551 → 3551
    
    # Account Abstraction → 3337
    3300: (3337, "LRC-4337 Account Abstraction"),        # ERC-4337
    3301: (3338, "Paymaster Standard"),                  # AA extension
    3302: (3271, "LRC-1271 Signature Validation"),       # ERC-1271
    3303: (3579, "LRC-7579 Modular Smart Accounts"),     # ERC-7579 → 3579
    
    # DeFi → align with ERC
    3400: (3626, "LRC-4626 Tokenized Vault"),            # ERC-4626
    3401: (3627, "LRC-4626 Multi-Vault Extensions"),     # 4626 extension
    3410: (3156, "LRC-3156 Flash Loans"),                # ERC-3156 - CONFLICT with 3101!
    3420: (3777, "LRC-777 Advanced Token"),              # ERC-777
}

# Handle conflict: 3101 (1155 Supply) vs 3410 (3156 Flash Loans) both want 3156
# Solution: 1155 Supply Extension → 3157 (next to 3155/3156)
REMAP[3101] = (3157, "LRC-1155 Supply Extension")

def get_lp_files():
    """Get all LP files in 3xxx range"""
    files = {}
    for f in os.listdir(LP_DIR):
        if f.startswith('lp-3') and f.endswith('.md'):
            match = re.match(r'lp-(\d+)', f)
            if match:
                num = int(match.group(1))
                files[num] = f
    return files

def update_frontmatter(content, new_num, new_title):
    """Update LP number and optionally title in frontmatter"""
    # Update lp: number
    content = re.sub(r'^lp: \d+', f'lp: {new_num}', content, flags=re.MULTILINE)
    
    # Update order: number
    content = re.sub(r'^order: \d+', f'order: {new_num}', content, flags=re.MULTILINE)
    
    # Update title if provided
    if new_title:
        content = re.sub(r'^title: .+$', f'title: {new_title}', content, flags=re.MULTILINE)
    
    return content

def main():
    files = get_lp_files()
    moves = []
    
    print("=== ERC-Aligned LP Reorganization ===\n")
    
    for old_num, (new_num, new_title) in sorted(REMAP.items()):
        if old_num not in files:
            print(f"SKIP: LP-{old_num} not found")
            continue
            
        old_file = files[old_num]
        old_path = os.path.join(LP_DIR, old_file)
        
        # Generate new filename
        if new_title:
            # Create slug from title
            slug = new_title.lower()
            slug = re.sub(r'[^a-z0-9]+', '-', slug)
            slug = slug.strip('-')
            new_file = f"lp-{new_num}-{slug}.md"
        else:
            # Keep similar filename structure
            old_slug = re.sub(r'lp-\d+-', '', old_file)
            new_file = f"lp-{new_num}-{old_slug}"
        
        new_path = os.path.join(LP_DIR, new_file)
        
        print(f"LP-{old_num} → LP-{new_num}")
        print(f"  {old_file}")
        print(f"  → {new_file}")
        
        # Read and update content
        with open(old_path, 'r') as f:
            content = f.read()
        
        content = update_frontmatter(content, new_num, new_title)
        
        moves.append((old_path, new_path, content))
    
    print(f"\n=== Executing {len(moves)} moves ===\n")
    
    # Execute moves
    for old_path, new_path, content in moves:
        # Write to new location
        with open(new_path, 'w') as f:
            f.write(content)
        
        # Remove old file if different
        if old_path != new_path:
            os.remove(old_path)
        
        print(f"✓ {os.path.basename(new_path)}")
    
    print(f"\n=== Done: {len(moves)} files reorganized ===")

if __name__ == '__main__':
    main()
