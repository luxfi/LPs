#!/usr/bin/env python3
import os
import re
import json
from pathlib import Path

LP_DIR = Path('LPs')
OUT_DOCS = Path('docs/lp-index.json')
OUT_SITE = Path('docs/site/lp-index.json')


def extract_frontmatter(filepath: Path):
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
            data[key.strip()] = val.strip().strip('"').strip("'")
    return data


def collect_lps():
    items = []
    if not LP_DIR.exists():
        return items
    for name in os.listdir(LP_DIR):
        if not name.startswith('lp-') or not name.endswith('.md'):
            continue
        m = re.match(r"lp-(\d+)\.md", name)
        if not m:
            continue
        number = int(m.group(1))
        path = LP_DIR / name
        fm = extract_frontmatter(path)
        item = {
            'number': number,
            'file': str(path).replace('\\', '/'),
            'title': fm.get('title', 'Untitled'),
            'description': fm.get('description', ''),
            'author': fm.get('author', ''),
            'status': fm.get('status', ''),
            'type': fm.get('type', ''),
            'category': fm.get('category', ''),
            'created': fm.get('created', ''),
            'discussions_to': fm.get('discussions-to', ''),
            'requires': fm.get('requires', ''),
            'replaces': fm.get('replaces', ''),
            'github_view': f"https://github.com/luxfi/LPs/blob/main/LPs/lp-{number}.md",
            'github_edit': f"https://github.com/luxfi/LPs/edit/main/LPs/lp-{number}.md",
        }
        items.append(item)
    items.sort(key=lambda x: x['number'])
    return items


def write_json(items, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'lp_count': len(items), 'lps': items}, f, ensure_ascii=False, indent=2)


def main():
    items = collect_lps()
    write_json(items, OUT_DOCS)
    # Also place alongside site bundle
    write_json(items, OUT_SITE)
    print(f"Wrote {len(items)} LPs to {OUT_DOCS} and {OUT_SITE}")


if __name__ == '__main__':
    # Run from repo root if invoked from elsewhere
    os.chdir(Path(__file__).resolve().parent.parent)
    main()

