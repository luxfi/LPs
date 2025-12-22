#!/usr/bin/env python3
"""
Merge DAO Governance (71xxx) and ESG/Impact (72xxx) into Assets & Tokens (2xxx)

Target allocation:
- 2800-2899: DAO Governance (from 71xxx)
- 2900-2999: ESG/Impact (from 72xxx)
"""

import os
import re
from pathlib import Path

LP_DIR = Path("/Users/z/work/lux/lps/LPs")

# Renumbering map
RENUMBER_MAP = {
    # DAO Governance (71xxx → 28xx)
    71020: 2800,  # Lux DAO Platform
    71021: 2801,  # Azorius Governance Module
    71022: 2802,  # Voting Strategies
    71023: 2803,  # Freeze Voting & Guard
    71024: 2804,  # DAO Account Abstraction
    71025: 2805,  # @luxdao/sdk
    
    # ESG/Impact (72xxx → 29xx)
    72150: 2900,  # Lux Vision Fund ESG Framework
    72151: 2901,  # Environmental Integrity
    72152: 2902,  # Social Benefit
    72153: 2903,  # Governance & Ecosystem
    72160: 2910,  # Impact Thesis
    72200: 2920,  # ESG Principles
    72201: 2921,  # Carbon Accounting
    72210: 2930,  # Green Compute
    72220: 2940,  # Network Energy Transparency
    72230: 2950,  # ESG Risk Management
    72240: 2960,  # Anti-Greenwashing
    72250: 2970,  # ESG Standards Alignment
    72260: 2980,  # Evidence Locker Index
    72300: 2990,  # Impact Framework
    72301: 2991,  # Impact Measurement
    72310: 2992,  # Stakeholder Engagement
    72320: 2993,  # Community Development
    72330: 2994,  # Financial Inclusion
}

# Also merge the legacy indexes
LEGACY_INDEXES = {
    71000: 2850,  # DAO and Governance Index
    72000: 2995,  # ESG and Impact Index
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
    
    # Update order: field
    content = re.sub(
        rf'^order:\s*\d+\s*$',
        f'order: {new_num}',
        content,
        flags=re.MULTILINE
    )
    
    # Update title header references
    content = re.sub(
        rf'# LP-{old_num:05d}:',
        f'# LP-{new_num:04d}:',
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
    new_name = re.sub(
        rf'lp-0*{old_num}-',
        f'lp-{new_num:04d}-',
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
    print("Merge Governance/ESG into Assets & Tokens (2xxx)")
    print("=" * 60)
    
    files = get_lp_files()
    print(f"\nFound {len(files)} LP files\n")
    
    moved = 0
    
    # Phase 1: DAO Governance → 28xx
    print("Phase 1: DAO Governance (71xxx) → 28xx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if 71000 <= old < 72000:
            if renumber_lp(old, new, files):
                moved += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 2: ESG/Impact → 29xx
    print("\nPhase 2: ESG/Impact (72xxx) → 29xx...")
    for old, new in sorted(RENUMBER_MAP.items()):
        if 72000 <= old < 73000:
            if renumber_lp(old, new, files):
                moved += 1
    
    # Refresh file list
    files = get_lp_files()
    
    # Phase 3: Legacy indexes
    print("\nPhase 3: Legacy Indexes...")
    for old, new in sorted(LEGACY_INDEXES.items()):
        if renumber_lp(old, new, files):
            moved += 1
    
    print("\n" + "=" * 60)
    print(f"Summary: {moved} LPs moved to 2xxx")
    print("=" * 60)

if __name__ == "__main__":
    main()
