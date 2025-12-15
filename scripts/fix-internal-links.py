#!/usr/bin/env python3
"""
Fix internal LP links to work with the docs site.

Converts:
  ./lp-XXXX-name.md -> /docs/lp-XXXX-name/
  ./LP-INDEX.md -> /docs/
  ./other.md -> /docs/other/
"""

import os
import re
import sys
from pathlib import Path

def fix_links(content: str) -> tuple[str, int]:
    """Fix internal markdown links and return updated content and count."""
    count = 0

    def replace_link(match):
        nonlocal count
        full_match = match.group(0)
        link_text = match.group(1)
        link_path = match.group(2)

        # Skip external links
        if link_path.startswith('http://') or link_path.startswith('https://'):
            return full_match

        # Handle internal ./xxx.md links
        if link_path.startswith('./') and link_path.endswith('.md'):
            # Remove ./ prefix and .md suffix
            slug = link_path[2:-3]

            # Special case for LP-INDEX.md -> /docs/
            if slug.upper() == 'LP-INDEX':
                count += 1
                return f'[{link_text}](/docs/)'

            # Convert to docs URL format
            count += 1
            return f'[{link_text}](/docs/{slug}/)'

        return full_match

    # Match markdown links: [text](path)
    pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    new_content = re.sub(pattern, replace_link, content)

    return new_content, count

def process_file(filepath: Path, dry_run: bool = False) -> int:
    """Process a single file and return number of fixes."""
    try:
        content = filepath.read_text(encoding='utf-8')
        new_content, count = fix_links(content)

        if count > 0:
            if dry_run:
                print(f"Would fix {count} links in {filepath}")
            else:
                filepath.write_text(new_content, encoding='utf-8')
                print(f"Fixed {count} links in {filepath}")

        return count
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def main():
    # Get LPs directory
    script_dir = Path(__file__).parent
    lps_dir = script_dir.parent / 'LPs'

    if not lps_dir.exists():
        print(f"LPs directory not found: {lps_dir}")
        sys.exit(1)

    dry_run = '--dry-run' in sys.argv

    if dry_run:
        print("DRY RUN MODE - no files will be modified\n")

    total_fixes = 0
    files_modified = 0

    # Process all .md files
    for filepath in sorted(lps_dir.glob('*.md')):
        fixes = process_file(filepath, dry_run)
        if fixes > 0:
            total_fixes += fixes
            files_modified += 1

    print(f"\n{'Would fix' if dry_run else 'Fixed'} {total_fixes} links in {files_modified} files")

if __name__ == '__main__':
    main()
