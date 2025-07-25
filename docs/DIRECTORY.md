# LP Repository Directory Structure

This document provides an overview of the LP repository organization and file purposes.

## Directory Structure

```
lux-lps/
├── README.md                    # Main documentation and overview
├── ROADMAP.md                   # 7-phase development roadmap
├── GOVERNANCE.md                # Governance process details
├── CONTRIBUTING.md              # How to contribute to LPs
├── LICENSE                      # CC0 Public Domain
│
├── Documentation/
│   ├── INDEX.md                 # Quick navigation index
│   ├── SUMMARY.md               # Executive summary
│   ├── ARCHITECTURE.md          # Visual diagrams and flows
│   ├── FAQ.md                   # Frequently asked questions
│   ├── GLOSSARY.md              # Term definitions
│   ├── STATUS.md                # Current status of all LPs
│   └── STANDARDIZATION-FLOW.md  # Standards development process
│
├── Guides/
│   ├── IMPLEMENTATION-GUIDE.md  # Developer implementation guide
│   ├── NUMBER-ALLOCATION.md     # LP numbering system
│   ├── CROSS-REFERENCE.md       # Ethereum/Avalanche mappings
│   └── EDITORS.md               # Guide for LP editors
│
├── LPs/                        # Actual LP documents
│   ├── TEMPLATE.md              # Template for new LPs
│   ├── lp-1.md                 # Community Contribution Framework
│   ├── lp-20.md                # LRC-20 Token Standard
│   └── lp-draft.md             # (Created by authors)
│
├── phases/                      # Detailed phase documentation
│   ├── phase-1-foundational.md # Q1-Q2 2025
│   ├── phase-2-execution-asset.md # Q2-Q3 2025
│   ├── phase-3-cross-chain.md   # Q3-Q4 2025
│   ├── phase-4-attestations-compliance.md # Q4 2025-Q1 2026
│   ├── phase-5-privacy-zk.md    # Q1-Q2 2026
│   ├── phase-6-data-scalability.md # Q2-Q3 2026
│   └── phase-7-application-standards.md # Q3 2026+
│
├── scripts/                     # Automation tools
│   ├── validate-lp.sh          # Validate LP formatting
│   ├── update-index.py          # Update README index
│   ├── check-links.sh           # Check for broken links
│   └── new-lp.sh               # Create new LP wizard
│
└── assets/                      # Supporting materials
    └── lp-{number}/            # Assets for specific LPs
        ├── images/
        ├── contracts/
        └── examples/
```

## File Purposes

### Root Files

| File | Purpose | Audience |
|------|---------|----------|
| README.md | Main entry point, explains LP/LRC | Everyone |
| ROADMAP.md | 7-phase development timeline | Planners |
| GOVERNANCE.md | How governance works | Community |
| CONTRIBUTING.md | How to submit LPs | Authors |

### Documentation

| File | Purpose | Update Frequency |
|------|---------|------------------|
| INDEX.md | Quick navigation | Monthly |
| SUMMARY.md | Executive overview | Quarterly |
| ARCHITECTURE.md | Visual diagrams | As needed |
| FAQ.md | Common questions | Monthly |
| GLOSSARY.md | Term definitions | As needed |
| STATUS.md | LP status tracker | Weekly |

### Guides

| File | Purpose | Primary Users |
|------|---------|---------------|
| IMPLEMENTATION-GUIDE.md | How to implement standards | Developers |
| NUMBER-ALLOCATION.md | LP numbering rules | Authors |
| CROSS-REFERENCE.md | Standard mappings | Developers |
| EDITORS.md | Editor responsibilities | Editors |

### LPs Directory

| Pattern | Description | Example |
|---------|-------------|---------|
| lp-{N}.md | Approved LPs | lp-20.md |
| lp-draft.md | New submissions | lp-draft.md |
| TEMPLATE.md | LP template | - |

### Phase Documentation

| Phase | Timeline | Focus |
|-------|----------|-------|
| Phase 1 | Q1-Q2 2025 | Governance & Core |
| Phase 2 | Q2-Q3 2025 | Tokens & DeFi |
| Phase 3 | Q3-Q4 2025 | Cross-chain |
| Phase 4 | Q4 2025-Q1 2026 | Compliance |
| Phase 5 | Q1-Q2 2026 | Privacy |
| Phase 6 | Q2-Q3 2026 | Scalability |
| Phase 7 | Q3 2026+ | Applications |

### Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| validate-lp.sh | Check LP format | `./scripts/validate-lp.sh lp-20.md` |
| update-index.py | Update README | `python scripts/update-index.py` |
| check-links.sh | Find broken links | `./scripts/check-links.sh` |
| new-lp.sh | Create new LP | `./scripts/new-lp.sh` |

## Navigation Guide

### For New Users
1. Start with [README.md](./README.md)
2. Read [SUMMARY.md](./SUMMARY.md) for overview
3. Check [FAQ.md](./FAQ.md) for questions
4. Review [ROADMAP.md](./ROADMAP.md) for timeline

### For Developers
1. Read [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md)
2. Check [CROSS-REFERENCE.md](./CROSS-REFERENCE.md) for standards
3. Review relevant phase documentation
4. Study existing LPs in your area

### For Contributors
1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Use [TEMPLATE.md](./LPs/TEMPLATE.md)
3. Check [NUMBER-ALLOCATION.md](./NUMBER-ALLOCATION.md)
4. Run validation scripts

### For Editors
1. Review [EDITORS.md](./EDITORS.md)
2. Monitor [STATUS.md](./STATUS.md)
3. Use automation scripts
4. Update documentation regularly

## Maintenance Schedule

| Task | Frequency | Responsible |
|------|-----------|-------------|
| Update STATUS.md | Weekly | Editors |
| Update INDEX.md | Monthly | Editors |
| Review stagnant LPs | Monthly | Editors |
| Update cross-references | Quarterly | Maintainers |
| Archive completed phases | Annually | Admins |

## Version Control

- All files use semantic versioning in comments
- Major updates tracked in commit messages
- Phase documents frozen after completion
- LPs are immutable once Final

---

*This directory structure is designed for clarity and maintainability.*  
*Last Updated: January 2025*