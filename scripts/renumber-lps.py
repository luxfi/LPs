#!/usr/bin/env python3
"""Renumber LPs according to new canonical taxonomy."""

import os
import re
import shutil

LP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'LPs')

# Mapping: old_lp_number -> new_lp_number
RENUMBER_MAP = {
    # ESG/Governance: 750-930 -> 100-999
    750: 150,
    751: 151,
    752: 152,
    753: 153,
    760: 160,
    800: 200,
    801: 201,
    810: 210,
    820: 220,
    830: 230,
    840: 240,
    850: 250,
    860: 260,
    900: 300,
    901: 301,
    910: 310,
    920: 320,
    930: 330,
}

def get_lp_files():
    """Get all LP files with their numbers."""
    files = {}
    for f in os.listdir(LP_DIR):
        if f.startswith('lp-') and f.endswith('.md') and f != 'lp-draft.md':
            match = re.match(r'lp-(\d+)', f)
            if match:
                lp_num = int(match.group(1))
                files[lp_num] = os.path.join(LP_DIR, f)
    return files

def renumber_file(old_path, old_num, new_num):
    """Renumber a single LP file."""
    # Read content
    with open(old_path, 'r') as f:
        content = f.read()

    # Update lp: field
    content = re.sub(r'^lp:\s*' + str(old_num) + r'\s*$', f'lp: {new_num}', content, flags=re.MULTILINE)

    # Update # LP-XXXX header
    old_padded = str(old_num).zfill(4)
    new_padded = str(new_num).zfill(4)
    content = re.sub(rf'^# LP-{old_padded}:', f'# LP-{new_padded}:', content, flags=re.MULTILINE)

    # Update order field to match new LP number
    content = re.sub(r'^order:\s*\d+\s*$', f'order: {new_num}', content, flags=re.MULTILINE)

    # Generate new filename
    old_basename = os.path.basename(old_path)
    new_basename = re.sub(rf'^lp-{old_padded}-', f'lp-{new_padded}-', old_basename)
    if new_basename == old_basename:
        # Try without padding
        new_basename = re.sub(rf'^lp-{old_num}-', f'lp-{new_padded}-', old_basename)

    new_path = os.path.join(LP_DIR, new_basename)

    # Write to new file
    with open(new_path, 'w') as f:
        f.write(content)

    # Remove old file if different
    if old_path != new_path:
        os.remove(old_path)

    return new_path

def main():
    files = get_lp_files()

    print("Renumbering LPs according to new taxonomy...")
    print(f"Found {len(files)} LP files")
    print()

    moved = 0
    for old_num, new_num in sorted(RENUMBER_MAP.items()):
        if old_num in files:
            old_path = files[old_num]
            new_path = renumber_file(old_path, old_num, new_num)
            print(f"  LP-{old_num:04d} -> LP-{new_num:04d}: {os.path.basename(new_path)}")
            moved += 1
        else:
            print(f"  LP-{old_num:04d}: NOT FOUND (skipping)")

    print()
    print(f"Moved {moved} LPs")

if __name__ == '__main__':
    main()
