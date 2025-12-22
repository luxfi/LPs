#!/usr/bin/env python3
"""Add tags to LPs missing them based on LP number range."""

import os
import re

LP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'LPs')

# Tag mappings by LP range
RANGE_TAGS = {
    (0, 99): ['network', 'core'],
    (100, 199): ['consensus'],
    (700, 999): ['research', 'esg'],
    (1000, 1999): ['p-chain', 'platform'],
    (2000, 2999): ['c-chain', 'evm'],
    (3000, 3999): ['x-chain', 'exchange'],
    (4000, 4999): ['q-chain', 'pqc'],
    (5000, 5999): ['a-chain', 'ai'],
    (6000, 6999): ['b-chain', 'bridge'],
    (7000, 7999): ['t-chain', 'threshold'],
    (8000, 8999): ['z-chain', 'zkp'],
    (9000, 9999): ['dex', 'trading'],
    (10000, 19999): ['learning', 'education'],
}

def get_lp_number(content):
    """Extract LP number from frontmatter."""
    match = re.search(r'^lp:\s*(\d+)', content, re.MULTILINE)
    return int(match.group(1)) if match else None

def has_tags_field(content):
    """Check if content has tags field in frontmatter."""
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        frontmatter = fm_match.group(1)
        return bool(re.search(r'^tags:', frontmatter, re.MULTILINE))
    return False

def get_tags_for_lp(lp_num):
    """Get appropriate tags based on LP number range."""
    for (start, end), tags in RANGE_TAGS.items():
        if start <= lp_num <= end:
            return tags
    return ['core']  # Default

def add_tags_field(filepath):
    """Add tags field to LP file if missing."""
    with open(filepath, 'r') as f:
        content = f.read()

    if has_tags_field(content):
        return False

    lp_num = get_lp_number(content)
    if lp_num is None:
        return False

    tags = get_tags_for_lp(lp_num)
    tags_str = f"tags: [{', '.join(tags)}]"

    # Insert after description or status line
    lines = content.split('\n')
    new_lines = []
    in_frontmatter = False
    tags_added = False

    for i, line in enumerate(lines):
        new_lines.append(line)
        if line == '---' and not in_frontmatter:
            in_frontmatter = True
        elif line.startswith('status:') and in_frontmatter and not tags_added:
            new_lines.append(tags_str)
            tags_added = True
        elif line == '---' and in_frontmatter and not tags_added:
            # Fallback: add before closing ---
            new_lines.insert(-1, tags_str)
            tags_added = True
            in_frontmatter = False

    if tags_added:
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))
        return True
    return False

def main():
    files_to_check = [
        'lp-0099-lp-numbering-scheme-and-chain-organization.md',
        'lp-2099-cchain-upgrade-mapping.md',
        'lp-2501-defi-protocol-integration-standard.md',
        'lp-2508-alchemix-self-repaying-loans-standard.md',
        'lp-9016-emergency-procedures.md',
        'lp-9017-risk-management.md',
        'lp-9018-liquidity-mining.md',
        'lp-9019-fee-distribution.md',
        'lp-9020-performance-benchmarks.md',
        'lp-9021-monitoring-alerting.md',
        'lp-9022-upgrade-procedures.md',
        'lp-9023-integration-testing.md',
        'lp-9024-security-audit-requirements.md',
        'lp-9025-mev-protection.md',
        'lp-9073-batch-execution-standard-multicall.md',
    ]

    modified = 0
    for filename in files_to_check:
        filepath = os.path.join(LP_DIR, filename)
        if os.path.exists(filepath) and add_tags_field(filepath):
            print(f"  ADDED tags to {filename}")
            modified += 1

    print(f"\nSummary: {modified} files modified with tags")

if __name__ == '__main__':
    main()
