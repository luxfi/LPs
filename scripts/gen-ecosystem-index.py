#!/usr/bin/env python3
import os
import re
from pathlib import Path

BASE = Path(os.environ.get('LUX_BASE', os.path.expanduser('~/work/lux')))
OUT = Path('docs/ECOSYSTEM.md')


def detect_lang(repo: Path) -> str:
    if (repo / 'go.mod').exists() or list(repo.rglob('*.go')):
        return 'Go'
    if (repo / 'package.json').exists() or list(repo.rglob('*.ts')):
        return 'TypeScript/JS'
    if list(repo.rglob('*.rs')):
        return 'Rust'
    if list(repo.rglob('*.py')):
        return 'Python'
    return 'Mixed'


def read_title_and_desc(repo: Path):
    md = None
    for name in ('README.md', 'Readme.md', 'readme.md'):
        p = repo / name
        if p.exists():
            md = p
            break
    if not md:
        return (repo.name, '')
    title = repo.name
    desc = ''
    try:
        text = md.read_text(encoding='utf-8', errors='ignore')
        # title: first markdown H1
        m = re.search(r'^#\s+(.+)$', text, re.M)
        if m:
            title = m.group(1).strip()
        # desc: first non-empty paragraph after title
        after = text[m.end():] if m else text
        for para in re.split(r'\n\s*\n', after):
            s = para.strip()
            if s and not s.startswith('#'):
                desc = re.sub(r'\s+', ' ', s)
                if len(desc) > 220:
                    desc = desc[:217] + '...'
                break
    except Exception:
        pass
    return (title or repo.name, desc)


def collect_repos(base: Path):
    repos = []
    if not base.exists():
        return repos
    for child in sorted(base.iterdir()):
        if not child.is_dir():
            continue
        # skip dot dirs and known non-repos
        if child.name.startswith('.'):
            continue
        # quick heuristic: repo if it contains code or README
        if (child / '.git').exists() or (child / 'README.md').exists() or list(child.glob('*.go')):
            title, desc = read_title_and_desc(child)
            repos.append({
                'name': child.name,
                'title': title,
                'desc': desc,
                'lang': detect_lang(child),
                'path': str(child),
            })
    return repos


def group_repo(name: str) -> str:
    key = name.lower()
    if key in ('consensus', 'evm', 'coreth', 'state', 'crypto', 'standard', 'threshold', 'database'):
        return 'Core Protocol'
    if key in ('bridge', 'bridge-new', 'teleport', 'warp'):
        return 'Interoperability'
    if key in ('wallet', 'xwallet', 'wwallet', 'safe', 'safe-ios'):
        return 'Wallets'
    if key in ('sdk', 'explorer', 'explore', 'faucet', 'genesis', 'genesis-new'):
        return 'Dev Tools & Infra'
    if key in ('dao', 'tokens', 'tokenomics', 'exchange', 'exchange-sdk', 'dex'):
        return 'Ecosystem Apps'
    if key in ('vmsdk', 'plugins-core'):
        return 'VM & Plugins'
    return 'Other'


def write_markdown(repos):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    lines.append('# Lux Ecosystem Index')
    lines.append('')
    lines.append('This index summarizes local Lux repositories, grouped by domain. Set LUX_BASE to change the scan path (default: ~/work/lux).')
    lines.append('')
    lines.append('Tip: Keep each repo README current with purpose, quickstart, and links to API/ADR/docs.')
    lines.append('')

    groups = {}
    for r in repos:
        g = group_repo(r['name'])
        groups.setdefault(g, []).append(r)

    order = ['Core Protocol', 'Interoperability', 'VM & Plugins', 'Dev Tools & Infra', 'Wallets', 'Ecosystem Apps', 'Other']
    for g in order:
        if g not in groups:
            continue
        lines.append(f'## {g}')
        lines.append('')
        lines.append('| Repo | Title | Language | Summary |')
        lines.append('|:-----|:------|:---------|:--------|')
        for r in sorted(groups[g], key=lambda x: x['name']):
            name = r['name']
            title = r['title'].replace('|', '\\|')
            lang = r['lang']
            desc = (r['desc'] or '').replace('|', '\\|')
            # Local path reference for contributors; add GitHub org link root
            lines.append(f'| `{name}` | {title} | {lang} | {desc} |')
        lines.append('')

    lines.append('---')
    lines.append('Source: local scan of ~/work/lux. For GitHub, see https://github.com/luxfi')
    OUT.write_text('\n'.join(lines), encoding='utf-8')


def main():
    repos = collect_repos(BASE)
    write_markdown(repos)
    print(f'Indexed {len(repos)} repos from {BASE} into {OUT}')


if __name__ == '__main__':
    # Run from repo root
    os.chdir(Path(__file__).resolve().parent.parent)
    main()

