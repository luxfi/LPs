#!/usr/bin/env python3
"""
LP Index Generator

Generates lp-index.json with proper sorting:
  1. tier (ranked: core=0, chain=1, product=2, research=3)
  2. order (explicit or computed as lp * 10)
  3. lp (canonical identifier, never changes)

Usage:
  python scripts/build-lp-index-json.py
"""
import os
import re
import json
from pathlib import Path

LP_DIR = Path('LPs')
OUT_DOCS = Path('docs/lp-index.json')
OUT_PUBLIC = Path('docs/public/lp-index.json')
OUT_SITE = Path('docs/site/lp-index.json')

# Tier ranking for sorting (lower = earlier in browse order)
TIER_RANK = {
    'core': 0,
    'chain': 1,
    'product': 2,
    'research': 3,
    # Fallback for unknown/missing tiers
}
DEFAULT_TIER_RANK = 99


def get_tier_rank(tier: str) -> int:
    """Get numeric rank for tier (for sorting)."""
    if not tier:
        return DEFAULT_TIER_RANK
    return TIER_RANK.get(tier.lower(), DEFAULT_TIER_RANK)


def get_order(fm: dict, lp_number: int) -> int:
    """
    Get display order for LP.
    
    Rule: If order missing, default to lp * 10
    This gives instant "every 10" spacing without touching files.
    """
    order_str = fm.get('order', '')
    if order_str:
        try:
            return int(order_str)
        except ValueError:
            pass
    # Default: lp * 10
    return lp_number * 10


def extract_frontmatter(filepath: Path) -> dict:
    """Extract YAML frontmatter from markdown file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if not content.startswith('---'):
        return {}

    end = content.find('\n---', 3)
    if end == -1:
        return {}

    fm_text = content[3:end].strip()
    data = {}
    for line in fm_text.splitlines():
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            # Handle array values like [tag1, tag2]
            if val.startswith('[') and val.endswith(']'):
                val = val  # Keep as string for now
            data[key] = val
    return data


def collect_lps():
    """Collect all LP files and extract metadata."""
    items = []
    if not LP_DIR.exists():
        return items
    
    for name in os.listdir(LP_DIR):
        if not name.startswith('lp-') or not name.endswith('.md'):
            continue
        
        m = re.match(r"lp-(\d+)(?:-[a-z0-9-]+)?\.md", name)
        if not m:
            continue
        
        number = int(m.group(1))
        path = LP_DIR / name
        fm = extract_frontmatter(path)
        
        # Extract tier and order with defaults
        tier = fm.get('tier', '')
        order = get_order(fm, number)
        tier_rank = get_tier_rank(tier)
        
        # Build slug from filename (without .md)
        slug = name.replace('.md', '')
        
        item = {
            'lp': number,                    # Canonical identifier (never changes)
            'slug': slug,                    # URL path segment
            'file': str(path).replace('\\', '/'),
            'title': fm.get('title', 'Untitled'),
            'description': fm.get('description', ''),
            'author': fm.get('author', ''),
            'status': fm.get('status', ''),
            'type': fm.get('type', ''),
            'category': fm.get('category', ''),
            'tier': tier,
            'order': order,                  # Display order (explicit or lp*10)
            'tier_rank': tier_rank,          # For sorting
            'tags': fm.get('tags', ''),
            'created': fm.get('created', ''),
            'updated': fm.get('updated', ''),
            'requires': fm.get('requires', ''),
            'replaces': fm.get('replaces', ''),
            'discussions_to': fm.get('discussions-to', ''),
        }
        items.append(item)
    
    # Sort by: tier_rank → order → lp
    items.sort(key=lambda x: (x['tier_rank'], x['order'], x['lp']))
    
    return items


def write_json(items, out_path: Path):
    """Write LP index to JSON file."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Build output structure
    output = {
        'generated': True,
        'lp_count': len(items),
        'sort_order': ['tier_rank', 'order', 'lp'],
        'tier_ranks': TIER_RANK,
        'lps': items,
        # Also provide a quick lookup by LP number
        'by_lp': {item['lp']: item['slug'] for item in items},
    }
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)


def main():
    items = collect_lps()
    
    # Write to all output locations
    for out_path in [OUT_DOCS, OUT_PUBLIC, OUT_SITE]:
        write_json(items, out_path)
    
    print(f"Generated LP index with {len(items)} entries")
    print(f"Sort order: tier_rank → order → lp")
    print(f"Outputs:")
    for out_path in [OUT_DOCS, OUT_PUBLIC, OUT_SITE]:
        print(f"  - {out_path}")
    
    # Show first 10 entries as sample
    print(f"\nFirst 10 entries (sorted):")
    for item in items[:10]:
        tier_str = f"[{item['tier']}]" if item['tier'] else "[no tier]"
        print(f"  LP-{item['lp']:04d} order={item['order']:4d} {tier_str:12s} {item['title'][:50]}")


if __name__ == '__main__':
    # Run from repo root if invoked from elsewhere
    os.chdir(Path(__file__).resolve().parent.parent)
    main()
