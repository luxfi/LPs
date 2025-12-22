#!/usr/bin/env python3
"""
Simplify LP links in markdown files.

Transforms verbose LP links to simple [LP-NNN] format:
- [LP-123: Some Long Title](./lp-0123-file.md) -> [LP-123](./lp-0123-file.md)
- [Some Description](./lp-0123-file.md) -> [LP-123](./lp-0123-file.md)
- [LP-123 - Title Here](/docs/lp-0123...) -> [LP-123](/docs/lp-0123...)

Usage: python scripts/simplify-lp-links.py [--dry-run]
"""

import os
import re
import sys
from pathlib import Path

# Pattern to match LP links in markdown
# Captures: [link text](path containing lp-NNNN)
LP_LINK_PATTERN = re.compile(
    r'\[([^\]]+)\]'           # [link text]
    r'\('                      # (
    r'([^)]*?'                # path prefix
    r'lp-(\d+)'               # lp-NNNN (capture number)
    r'[^)]*\.md'              # rest of path ending in .md
    r')\)'                     # )
)

# Pattern to check if link text is already simple [LP-NNN]
SIMPLE_LP_PATTERN = re.compile(r'^LP-\d+$')


def extract_lp_number(match):
    """Extract the LP number from a match, normalizing to integer."""
    return int(match.group(3))


def simplify_link(match):
    """Transform a link match to simple [LP-NNN](url) format."""
    link_text = match.group(1)
    url = match.group(2)
    lp_num = extract_lp_number(match)
    
    # Already simple? Return unchanged
    if SIMPLE_LP_PATTERN.match(link_text):
        return match.group(0)
    
    # Return simplified link
    return f'[LP-{lp_num}]({url})'


def process_file(filepath, dry_run=False):
    """Process a single markdown file, return count of changes."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count matches that will be changed
    changes = 0
    for match in LP_LINK_PATTERN.finditer(content):
        link_text = match.group(1)
        if not SIMPLE_LP_PATTERN.match(link_text):
            changes += 1
    
    if changes == 0:
        return 0
    
    # Perform replacements
    new_content = LP_LINK_PATTERN.sub(simplify_link, content)
    
    if not dry_run and new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
    
    return changes


def main():
    dry_run = '--dry-run' in sys.argv
    
    # Find LPs directory
    script_dir = Path(__file__).parent
    lps_dir = script_dir.parent / 'LPs'
    
    if not lps_dir.exists():
        print(f"Error: LPs directory not found at {lps_dir}")
        sys.exit(1)
    
    total_changes = 0
    files_modified = 0
    
    print(f"{'[DRY RUN] ' if dry_run else ''}Processing LP files in {lps_dir}")
    print("-" * 60)
    
    # Process all .md files in LPs directory
    for filepath in sorted(lps_dir.glob('*.md')):
        changes = process_file(filepath, dry_run)
        if changes > 0:
            files_modified += 1
            total_changes += changes
            print(f"  {filepath.name}: {changes} link(s) simplified")
    
    print("-" * 60)
    print(f"Total: {total_changes} links simplified in {files_modified} files")
    
    if dry_run:
        print("\n[DRY RUN] No files were modified. Run without --dry-run to apply changes.")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
