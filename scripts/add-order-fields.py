#!/usr/bin/env python3
"""Add order fields to all LPs missing them."""

import os
import re
import sys

LP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'LPs')

def get_lp_number(content):
    """Extract LP number from frontmatter."""
    match = re.search(r'^lp:\s*(\d+)', content, re.MULTILINE)
    return int(match.group(1)) if match else None

def has_order_field(content):
    """Check if content has order field in frontmatter."""
    # Only check within frontmatter (between --- markers)
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        frontmatter = fm_match.group(1)
        return bool(re.search(r'^order:', frontmatter, re.MULTILINE))
    return False

def calculate_order(lp_num):
    """Calculate order based on LP number."""
    if lp_num < 100:
        # Foundation: order = lp_num
        return lp_num
    elif lp_num < 1000:
        # Research/ESG: order = lp_num - base
        return lp_num % 100
    elif lp_num < 10000:
        # Chain ranges: order = position within range
        return lp_num % 1000
    else:
        # Learning paths, research: order = lp_num % 100 + 20
        return (lp_num % 100) + 20

def add_order_field(filepath):
    """Add order field to LP file if missing."""
    with open(filepath, 'r') as f:
        content = f.read()

    if has_order_field(content):
        return False  # Already has order

    lp_num = get_lp_number(content)
    if lp_num is None:
        print(f"  SKIP: No LP number in {os.path.basename(filepath)}")
        return False

    order = calculate_order(lp_num)

    # Insert order field after tier: or after last known field before ---
    # Strategy: Insert before the closing ---
    lines = content.split('\n')
    new_lines = []
    in_frontmatter = False
    order_added = False

    for i, line in enumerate(lines):
        if line == '---' and not in_frontmatter:
            in_frontmatter = True
            new_lines.append(line)
        elif line == '---' and in_frontmatter and not order_added:
            # Add order before closing ---
            new_lines.append(f'order: {order}')
            new_lines.append(line)
            order_added = True
            in_frontmatter = False
        else:
            new_lines.append(line)

    if order_added:
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))
        return True
    return False

def main():
    modified = 0
    skipped = 0

    for filename in sorted(os.listdir(LP_DIR)):
        if not filename.endswith('.md'):
            continue
        if filename == 'TEMPLATE.md':
            continue

        filepath = os.path.join(LP_DIR, filename)
        if add_order_field(filepath):
            print(f"  ADDED order to {filename}")
            modified += 1
        else:
            skipped += 1

    print(f"\nSummary: {modified} modified, {skipped} skipped (already had order or no LP number)")

if __name__ == '__main__':
    main()
