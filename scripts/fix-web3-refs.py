#!/usr/bin/env python3
"""Fix cross-references after web3 LP reorganization."""
import os
import re
from pathlib import Path

LP_DIR = Path("LPs")

# Old -> New LP number mapping
REMAP = {
    3000: 3600, 3001: 3601, 3027: 3029, 3028: 3021, 3029: 3022, 3030: 3023,
    3031: 3201, 3070: 3210, 3071: 3211, 3072: 3800, 3103: 3300, 3104: 3310,
    3106: 3320, 3155: 3100, 3201: 3610, 3225: 3820, 3232: 3620, 3235: 3621,
    3276: 3630, 3299: 3640, 3318: 3641, 3376: 3650, 3404: 3651, 3426: 3652,
    3511: 3500, 3512: 3501, 3513: 3510, 3514: 3511, 3520: 3653, 3526: 3660,
    3527: 3661, 3714: 3502, 3715: 3512, 3716: 3503, 3717: 3520, 3718: 3810,
    3721: 3200, 3804: 3700, 3806: 3701,
}

def fix_references(content):
    """Fix LP references in content."""
    changes = 0
    
    for old, new in REMAP.items():
        # Fix [LP-XXXX] references
        pattern = rf'\[LP-{old}\]'
        if re.search(pattern, content):
            content = re.sub(pattern, f'[LP-{new}]', content)
            changes += 1
        
        # Fix requires: fields
        pattern = rf'(requires:.*?)\b{old}\b'
        if re.search(pattern, content):
            content = re.sub(pattern, rf'\g<1>{new}', content)
            changes += 1
    
    return content, changes

def main():
    total_changes = 0
    files_changed = 0
    
    for lp_file in LP_DIR.glob("*.md"):
        content = lp_file.read_text()
        new_content, changes = fix_references(content)
        
        if changes > 0:
            lp_file.write_text(new_content)
            print(f"Fixed {changes} refs in {lp_file.name}")
            total_changes += changes
            files_changed += 1
    
    print(f"\nTotal: {total_changes} references fixed in {files_changed} files")

if __name__ == "__main__":
    main()
