#!/usr/bin/env python3
"""
Apply canonical LP renumbering per LP-0099 v5.0 (Canonical)

Categories:
1. Fix duplicate LP-40
2. ESG (150-330) → 72xxx
3. X-Chain specs (2xxx) → 1xxx
4. C-Chain core specs → 1xxx
5. Token standards → 2xxx
6. DeFi protocols → 9xxx
7. DAO governance → 71xxx
8. Privacy DeFi (8400-8403) → 9xxx
"""

import os
import re
import glob
from pathlib import Path

LP_DIR = Path("/Users/z/work/lux/lps/LPs")

# Complete renumbering map
RENUMBER_MAP = {
    # 1. Fix duplicate LP-40 (Wallet Standards → 41)
    # Note: Need to check which file is which first
    
    # 2. ESG (150-330) → 72xxx
    150: 72150,
    151: 72151,
    152: 72152,
    153: 72153,
    160: 72160,
    200: 72200,
    201: 72201,
    210: 72210,
    220: 72220,
    230: 72230,
    240: 72240,
    250: 72250,
    260: 72260,
    300: 72300,
    301: 72301,
    310: 72310,
    320: 72320,
    330: 72330,
    
    # 3. X-Chain specs (2xxx) → 1xxx
    2011: 1100,
    2036: 1136,
    2037: 1137,
    2100: 1101,
    
    # 4. C-Chain core specs → 1xxx
    3200: 1200,
    3212: 1212,
    3226: 1226,
    
    # 5. Token standards → 2xxx
    3227: 2027,
    3228: 2028,
    3229: 2029,
    3230: 2030,
    3231: 2031,
    3355: 2155,
    3500: 2020,
    3718: 2718,
    3921: 2721,
    
    # 6. DeFi protocols → 9xxx
    3700: 9100,
    3701: 9101,
    3702: 9102,
    3707: 9107,
    3708: 9108,
    3709: 9109,
    3710: 9110,
    
    # 7. DAO governance → 71xxx
    3720: 71020,
    3721: 71021,
    3722: 71022,
    3723: 71023,
    3724: 71024,
    3725: 71025,
    
    # 8. Privacy DeFi (8400-8403) → 9xxx
    8400: 9400,
    8401: 9401,
    8402: 9402,
    8403: 9403,
    
    # 9. Account abstraction reorder (3703-3706 → 3103-3106)
    3703: 3103,
    3704: 3104,
    3706: 3106,
}

# NFT standards from 9xxx → 2xxx
NFT_RENUMBER = {
    9070: 2070,
    9071: 2071,
    9072: 2072,
}

def get_lp_files():
    """Get all LP files and their numbers."""
    files = {}
    for f in LP_DIR.glob("lp-*.md"):
        match = re.match(r"lp-(\d+)-", f.name)
        if match:
            lp_num = int(match.group(1))
            files[lp_num] = f
    return files

def update_file_content(filepath, old_num, new_num):
    """Update LP number in file content."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Update frontmatter lp: field
    content = re.sub(
        rf'^lp:\s*{old_num}\s*$',
        f'lp: {new_num}',
        content,
        flags=re.MULTILINE
    )
    
    # Update order: field to match new LP number
    content = re.sub(
        rf'^order:\s*\d+\s*$',
        f'order: {new_num}',
        content,
        flags=re.MULTILINE
    )
    
    # Update title header references
    content = re.sub(
        rf'# LP-{old_num:04d}:',
        f'# LP-{new_num:05d}:' if new_num >= 10000 else f'# LP-{new_num:04d}:',
        content
    )
    content = re.sub(
        rf'# LP-{old_num}:',
        f'# LP-{new_num}:',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)

def get_new_filename(old_path, old_num, new_num):
    """Generate new filename with updated LP number."""
    old_name = old_path.name
    # Handle different zero-padding formats
    new_name = re.sub(
        rf'lp-0*{old_num}-',
        f'lp-{new_num:05d}-' if new_num >= 10000 else f'lp-{new_num:04d}-',
        old_name
    )
    return old_path.parent / new_name

def renumber_lp(old_num, new_num, files):
    """Renumber a single LP."""
    if old_num not in files:
        print(f"  ⚠️  LP-{old_num} not found, skipping")
        return False
    
    old_path = files[old_num]
    new_path = get_new_filename(old_path, old_num, new_num)
    
    # Update content first
    update_file_content(old_path, old_num, new_num)
    
    # Rename file
    os.rename(old_path, new_path)
    
    print(f"  ✓ LP-{old_num} → LP-{new_num}")
    return True

def main():
    print("=" * 60)
    print("Canonical LP Renumbering (LP-0099 v5.0)")
    print("=" * 60)
    
    files = get_lp_files()
    print(f"\nFound {len(files)} LP files\n")
    
    # Track statistics
    moved = 0
    skipped = 0
    
    # Phase 1: Fix duplicate LP-40
    print("Phase 1: Checking duplicate LP-40...")
    lp40_files = list(LP_DIR.glob("lp-0040-*.md"))
    if len(lp40_files) > 1:
        for f in lp40_files:
            if "wallet" in f.name.lower():
                print(f"  Found wallet standards at {f.name}")
                update_file_content(f, 40, 41)
                new_name = f.name.replace("lp-0040-", "lp-0041-")
                os.rename(f, f.parent / new_name)
                print(f"  ✓ Renamed to LP-41")
                moved += 1
                break
    else:
        print("  No duplicate found")
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 2: ESG → 72xxx
    print("\nPhase 2: ESG (150-330) → 72xxx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if 150 <= old <= 330:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 3: X-Chain → 1xxx
    print("\nPhase 3: X-Chain specs → 1xxx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if 2000 <= old < 2200:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 4: C-Chain core → 1xxx
    print("\nPhase 4: C-Chain core specs → 1xxx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if old in [3200, 3212, 3226]:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 5: Token standards → 2xxx
    print("\nPhase 5: Token standards → 2xxx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if old in [3227, 3228, 3229, 3230, 3231, 3355, 3500, 3718, 3921]:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 6: DeFi → 9xxx
    print("\nPhase 6: DeFi protocols → 9xxx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if old in [3700, 3701, 3702, 3707, 3708, 3709, 3710]:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 7: DAO → 71xxx
    print("\nPhase 7: DAO governance → 71xxx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if old in [3720, 3721, 3722, 3723, 3724, 3725]:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 8: Privacy DeFi → 9xxx
    print("\nPhase 8: Privacy DeFi (8400-8403) → 9xxx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if 8400 <= old <= 8403:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 9: Account abstraction reorder
    print("\nPhase 9: Account abstraction → 3103-3106...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if old in [3703, 3704, 3706]:
            if renumber_lp(old, new, files):
                moved += 1
            else:
                skipped += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 10: NFT standards → 2xxx
    print("\nPhase 10: NFT standards → 2xxx...")
    for old, new in sorted(NFT_RENUMBER.items()):
        if renumber_lp(old, new, files):
            moved += 1
        else:
            skipped += 1
    
    print("\n" + "=" * 60)
    print(f"Summary: {moved} moved, {skipped} skipped")
    print("=" * 60)

if __name__ == "__main__":
    main()
