#!/usr/bin/env python3
"""Swap C-Chain (2xxx) and X-Chain (3xxx) LP ranges.

New canonical scheme:
- 2xxx: X-Chain (Crypto & Exchange Layer)
- 3xxx: C-Chain (Web3/Smart Contracts)

Current state:
- 2xxx: C-Chain content (51 LPs) → move to 3xxx
- 3xxx: Mixed content:
  - 3000, 3001: VM/EVM (C-Chain) → stays in 3xxx
  - 3011, 3036, 3037, 3100: X-Chain → move to 2xxx
"""

import os
import re

LP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'LPs')

def renumber_file(old_path, old_num, new_num):
    """Renumber a single LP file."""
    with open(old_path, 'r') as f:
        content = f.read()

    # Update lp: field
    content = re.sub(r'^lp:\s*' + str(old_num) + r'\s*$', f'lp: {new_num}', content, flags=re.MULTILINE)

    # Update # LP-XXXX header
    old_padded = str(old_num).zfill(4)
    new_padded = str(new_num).zfill(4)
    content = re.sub(rf'^# LP-{old_padded}:', f'# LP-{new_padded}:', content, flags=re.MULTILINE)

    # Update order field
    new_order = new_num % 1000  # Order within range
    content = re.sub(r'^order:\s*\d+\s*$', f'order: {new_order}', content, flags=re.MULTILINE)

    # Generate new filename
    old_basename = os.path.basename(old_path)
    # Handle both padded and unpadded
    new_basename = re.sub(rf'^lp-0*{old_num}-', f'lp-{new_padded}-', old_basename)
    new_path = os.path.join(LP_DIR, new_basename)

    return content, new_path

def main():
    # Get all files
    files_2xxx = []
    files_3xxx_xchain = []
    files_3xxx_cchain = []

    for f in sorted(os.listdir(LP_DIR)):
        if not f.startswith('lp-') or not f.endswith('.md'):
            continue
        match = re.match(r'lp-(\d+)', f)
        if not match:
            continue
        lp_num = int(match.group(1))
        path = os.path.join(LP_DIR, f)

        if 2000 <= lp_num <= 2999:
            files_2xxx.append((lp_num, path))
        elif lp_num in [3011, 3036, 3037, 3100]:
            # X-Chain content in 3xxx
            files_3xxx_xchain.append((lp_num, path))
        elif lp_num in [3000, 3001]:
            # C-Chain content in 3xxx (VM/EVM) - stays
            files_3xxx_cchain.append((lp_num, path))

    print(f"Files to move:")
    print(f"  2xxx → 3xxx (C-Chain): {len(files_2xxx)} files")
    print(f"  3xxx → 2xxx (X-Chain): {len(files_3xxx_xchain)} files")
    print(f"  3xxx stays (C-Chain VM): {len(files_3xxx_cchain)} files")
    print()

    # Phase 1: Move X-Chain from 3xxx to 2xxx
    print("Phase 1: Moving X-Chain from 3xxx → 2xxx...")
    xchain_moves = []
    for old_num, old_path in files_3xxx_xchain:
        new_num = old_num - 1000  # 3011 → 2011
        content, new_path = renumber_file(old_path, old_num, new_num)
        xchain_moves.append((old_path, new_path, content))
        print(f"  LP-{old_num} → LP-{new_num}")

    # Phase 2: Move C-Chain from 2xxx to 3xxx
    print("\nPhase 2: Moving C-Chain from 2xxx → 3xxx...")
    cchain_moves = []
    for old_num, old_path in files_2xxx:
        new_num = old_num + 1000  # 2000 → 3000, but 3000 exists!
        # Offset by 200 to avoid collision: 2000 → 3200
        new_num = old_num + 1200  # 2000 → 3200, 2001 → 3201, etc.
        content, new_path = renumber_file(old_path, old_num, new_num)
        cchain_moves.append((old_path, new_path, content))
        print(f"  LP-{old_num} → LP-{new_num}")

    # Execute moves
    print("\nExecuting moves...")

    # Write X-Chain files first (to 2xxx)
    for old_path, new_path, content in xchain_moves:
        with open(new_path, 'w') as f:
            f.write(content)
        if old_path != new_path:
            os.remove(old_path)
        print(f"  Wrote {os.path.basename(new_path)}")

    # Write C-Chain files (to 3xxx)
    for old_path, new_path, content in cchain_moves:
        with open(new_path, 'w') as f:
            f.write(content)
        if old_path != new_path and os.path.exists(old_path):
            os.remove(old_path)
        print(f"  Wrote {os.path.basename(new_path)}")

    print(f"\nDone! Moved {len(xchain_moves) + len(cchain_moves)} files")

if __name__ == '__main__':
    main()
