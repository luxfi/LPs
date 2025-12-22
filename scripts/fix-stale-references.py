#!/usr/bin/env python3
"""Fix all stale LP references from renumbering"""
import os
import re
from pathlib import Path

LP_DIR = Path("/Users/z/work/lux/lps/LPs")

# Complete mapping of old → new LP numbers
REMAP = {
    # Token standards 2xxx → 3xxx
    2020: 3020, 2027: 3027, 2028: 3028, 2029: 3029, 2030: 3030, 2031: 3031,
    2070: 3070, 2071: 3071, 2072: 3072,
    2155: 3155, 2718: 3718, 2721: 3721,
    # DAO/ESG 7xxxx → 2xxx
    70000: 2860, 71000: 2850, 72000: 2995,
    71020: 2800, 71021: 2801, 71022: 2802, 71023: 2803, 71024: 2804, 71025: 2805,
    72150: 2900, 72151: 2901, 72152: 2902, 72153: 2903, 72160: 2910,
    72200: 2920, 72201: 2921, 72210: 2930, 72220: 2940, 72230: 2950,
    72240: 2960, 72250: 2970, 72260: 2980, 72300: 2990, 72301: 2991,
    72310: 2992, 72320: 2993, 72330: 2994,
}

def fix_file(path):
    """Fix stale references in a single file."""
    content = path.read_text()
    original = content
    changes = []
    
    for old, new in REMAP.items():
        # Fix requires: field
        pattern = rf'(requires:\s*[^\n]*)\b{old}\b'
        if re.search(pattern, content):
            content = re.sub(pattern, lambda m: m.group(1).replace(str(old), str(new)), content)
            changes.append(f"requires: {old}→{new}")
        
        # Fix LP-XXXXX references in text
        pattern = rf'\bLP-{old}\b'
        if re.search(pattern, content):
            content = re.sub(pattern, f'LP-{new}', content)
            changes.append(f"LP-{old}→LP-{new}")
        
        # Fix markdown links [text](./lp-XXXXX or ../LPs/lp-XXXXX)
        for prefix in ['./lp-', '../LPs/lp-', '/docs/lp-']:
            pattern = rf'(\[.*?\]\({prefix}){old:04d}' if old < 10000 else rf'(\[.*?\]\({prefix}){old:05d}'
            new_fmt = f'{new:04d}' if new < 10000 else f'{new:05d}'
            if re.search(pattern, content):
                content = re.sub(pattern, rf'\g<1>{new_fmt}', content)
                changes.append(f"link: {old}→{new}")
    
    if content != original:
        path.write_text(content)
        return changes
    return []

def main():
    print("Fixing stale LP references")
    print("=" * 60)
    
    total_fixes = 0
    for f in sorted(LP_DIR.glob("*.md")):
        changes = fix_file(f)
        if changes:
            print(f"  ✓ {f.name}: {', '.join(changes[:3])}{'...' if len(changes) > 3 else ''}")
            total_fixes += len(changes)
    
    print(f"\nTotal fixes: {total_fixes}")

if __name__ == "__main__":
    main()
