#!/usr/bin/env python3
"""Fix broken requires: fields by removing non-existent LP references"""
import re
from pathlib import Path

LP_DIR = Path("/Users/z/work/lux/lps/LPs")

# Get all existing LP numbers
def get_existing_lps():
    existing = set()
    for f in LP_DIR.glob("lp-*.md"):
        match = re.search(r'lp-(\d+)', f.name)
        if match:
            existing.add(int(match.group(1)))
    return existing

EXISTING = get_existing_lps()
print(f"Found {len(EXISTING)} existing LPs")

# Known remappings for common missing refs
KNOWN_REMAP = {
    # 0xx foundation that should exist
    10: 0,      # Network ref → Architecture
    22: 2,      # Messaging → Multi-chain
    32: 3,      # L2/rollup → Governance
    33: 3,
    34: 3,
    38: 39,     # Python SDK ref
    75: 70,     # Quantum → KMS
    
    # 2xx/3xx crypto refs that moved
    311: 3511,
    312: 3512, 
    313: 3513,
    316: 4316,
    318: 4318,
    
    # 5xx/6xx L2 refs
    500: 1000,  # L2 → P-Chain
    501: 1000,
    502: 1000,
    503: 1000,
    504: 1000,
    600: 110,   # Proto → Quasar
    601: 110,
    
    # 7xx/8xx ESG refs → 2xxx
    750: 2900,
    751: 2901,
    752: 2902,
    753: 2903,
    760: 2910,
    800: 2920,
    801: 2921,
    850: 2950,
    900: 2990,
    901: 2991,
    
    # 2xxx infra → remove or keep
    2000: 3020,
    2001: 3020,
    2012: 1212,  # C-Chain
    2026: 1,     # Tokenomics
    2300: 3020,  # Token base
    2504: 2800,  # DAO
    2506: 2802,
    2507: 2803,
    2517: 3020,
}

def fix_requires(path):
    """Fix requires field in an LP file."""
    content = path.read_text()
    
    # Find requires: line
    match = re.search(r'^requires:\s*(.+)$', content, re.MULTILINE)
    if not match:
        return 0
    
    requires_str = match.group(1).strip()
    
    # Parse LP numbers (handle both comma-separated and array formats)
    requires_str = requires_str.strip('[]')
    if not requires_str or requires_str == 'null':
        return 0
    
    # Extract numbers
    numbers = []
    for part in re.split(r'[,\s]+', requires_str):
        part = part.strip()
        if part.isdigit():
            numbers.append(int(part))
    
    if not numbers:
        return 0
    
    # Fix each number
    fixed = []
    changes = 0
    for n in numbers:
        if n in EXISTING:
            fixed.append(n)
        elif n in KNOWN_REMAP and KNOWN_REMAP[n] in EXISTING:
            fixed.append(KNOWN_REMAP[n])
            changes += 1
        # else: drop the reference entirely
        else:
            changes += 1  # Count as change (removal)
    
    if changes == 0:
        return 0
    
    # Rebuild requires line
    if fixed:
        new_requires = f"requires: {', '.join(str(n) for n in fixed)}"
    else:
        new_requires = "requires:"
    
    # Replace in content
    new_content = re.sub(r'^requires:\s*.+$', new_requires, content, flags=re.MULTILINE)
    
    if new_content != content:
        path.write_text(new_content)
        print(f"  ✓ {path.name}: {numbers} → {fixed}")
        return 1
    return 0

def main():
    print("Fixing broken requires: fields")
    print("=" * 60)
    
    fixed = 0
    for f in sorted(LP_DIR.glob("lp-*.md")):
        fixed += fix_requires(f)
    
    print(f"\nFixed {fixed} files")

if __name__ == "__main__":
    main()
