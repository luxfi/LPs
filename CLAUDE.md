# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Lux Proposals (LPs)** repository - the governance and standardization framework for the Lux Network blockchain ecosystem. This is primarily a **documentation and specification repository** that manages technical proposals, standards, and improvement processes for Lux Network.

**Key Purpose**: Define and standardize protocols, interfaces, and processes for the Lux blockchain through community-driven proposals, similar to Ethereum's EIP system.

## Repository Structure

```
lps/
├── LPs/                    # Official numbered proposals (lp-N.md format)
│   ├── TEMPLATE.md        # Template for creating new proposals
│   └── lp-*.md           # Individual LP documents
├── LP-*.md                # Recent research/draft proposals (non-standard location)
├── assets/                # Supporting files for LPs
├── docs/                  # Documentation and guides
├── phases/                # Development roadmap phases
├── scripts/               # Automation scripts for LP management
└── Makefile              # Build automation
```

## Essential Commands

### Creating and Managing LPs

```bash
# Create a new LP using interactive wizard
make new

# Validate a specific LP file
make validate FILE=LPs/lp-20.md

# Validate all LP files
make validate-all

# Check all links in LP documents
make check-links

# Update the LP index in README.md
make update-index

# Show LP statistics by status and type
make stats

# List all LPs with titles
make list

# Run all pre-PR checks
make pre-pr

# Create draft from template
make draft
```

### Quick Command Aliases
- `make n` → new
- `make v` → validate
- `make va` → validate-all
- `make cl` → check-links
- `make ui` → update-index

## LP Document Structure

### Required YAML Frontmatter
```yaml
---
lp: <number>
title: <descriptive title>
description: <one-line description>
author: <Name (@github-username)>
discussions-to: <URL to discussion>
status: Draft|Review|Last Call|Final|Withdrawn|Stagnant|Superseded
type: Standards Track|Meta|Informational
category: Core|Networking|Interface|LRC|Bridge  # only for Standards Track
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>  # optional
requires: <LP numbers>  # optional
---
```

### Required Content Sections
1. **Abstract** (~200 words overview)
2. **Motivation** (why this LP is needed)
3. **Specification** (technical details)
4. **Rationale** (design decisions)
5. **Backwards Compatibility**
6. **Test Cases** (required for Standards Track)
7. **Reference Implementation** (optional but recommended)
8. **Security Considerations**
9. **Copyright** (must be CC0)

## LP Categories and Types

### Standards Track Categories
- **Core**: Consensus, network rules, protocol changes
- **Networking**: P2P protocols, network layer
- **Interface**: APIs, RPC specifications
- **LRC**: Application standards (tokens, NFTs, DeFi)
- **Bridge**: Cross-chain protocols

### LP Types
- **Standards Track**: Technical specifications requiring implementation
- **Meta**: Process and governance proposals
- **Informational**: Guidelines and best practices

### Notable LRC Standards
- **LRC-20** (LP-20): Fungible Token Standard
- **LRC-721** (LP-721): Non-Fungible Token Standard
- **LRC-1155** (LP-1155): Multi-Token Standard

## Development Workflow

### New LP Submission Process
1. Discuss idea on forum (forum.lux.network)
2. Run `make new` to create draft
3. Submit PR with `lp-draft.md`
4. PR number becomes LP number
5. Rename file to `lp-N.md`
6. Address editor feedback
7. Move through status stages

### Status Progression
```
Draft → Review → Last Call (14 days) → Final
         ↓           ↓
    Withdrawn    Stagnant
```

### Validation Requirements
- All required sections present
- Valid YAML frontmatter
- Correct file naming (`lp-N.md`)
- All links valid
- Markdown properly formatted

## Recent LP Additions

The repository contains both standard LPs (in `LPs/` directory) and recent research/draft proposals in the root:

### Research Series (Root Directory)
- **LP-000-CANONICAL**: Canonical knowledge base
- **LP-001/002/003**: Post-quantum cryptography (ML-KEM, ML-DSA, SLH-DSA)
- **LP-600-608**: Technical improvements (Snowman, Gas Fees, Warp, Verkle, etc.)
- **LP-700**: Quasar quantum-finality consensus protocol
- **LP-ADVANCED-***: Advanced topics and patterns
- **LP-CONSENSUS-69**: Consensus mechanisms (appears to be in development)

### Official LPs (LPs/ Directory)
- Core protocol specifications (LP-1 through LP-12)
- Bridge protocols (LP-13 through LP-19)
- Token standards (LP-20, LP-721, LP-1155)
- DeFi protocols (LP-60 through LP-74)
- Research papers (LP-90 through LP-98)

## Key Technical Specifications

### Quasar Consensus (LP-700)
- Quantum-finality consensus protocol
- Unified engine for all chain types
- Physics-inspired model: photon → wave → focus → prism → horizon
- 2-round finality with BLS + Lattice signatures
- Sub-second finality targets

### Post-Quantum Cryptography
- **ML-KEM-768/1024**: Key encapsulation
- **ML-DSA-44/65**: Digital signatures (Dilithium)
- **SLH-DSA**: Hash-based signatures

## Development Phases

The Lux Network follows a phased roadmap:
- **Phase 1** (Q1 2025): Foundational Governance
- **Phase 2** (Q2 2025): Execution Environment & Asset Standards
- **Phase 3** (Q3 2025): Cross-Chain Interoperability
- **Phase 4** (Q4 2025): Attestations & Compliance
- **Phase 5** (Q1 2026): Privacy & Zero-Knowledge
- **Phase 6** (Q2 2026): Data Availability & Scalability
- **Phase 7** (Q3 2026+): Application Layer Standards

## Important Notes

### This is a Documentation Repository
- No traditional build process (no npm/yarn)
- No compiled code or test suites
- Scripts are standalone shell/Python utilities
- Focus is on specifications, not implementations

### File Conventions
- Official LPs: `LPs/lp-N.md` where N is the LP number
- Draft submissions: `lp-draft.md`
- Research/drafts may appear in root (non-standard)
- Assets in `assets/lp-N/` directories

### Cross-Chain Compatibility
LRC standards maintain compatibility with Ethereum:
- LRC-20 ≈ ERC-20
- LRC-721 ≈ ERC-721
- LRC-1155 ≈ ERC-1155

### Editor Review Focus
Editors review for format and completeness, not merit:
- Technical soundness
- Required sections present
- Proper formatting
- Clear specifications
- No duplication

Community consensus determines proposal acceptance.

## Common Tasks

### Before Submitting a PR
```bash
make pre-pr  # Runs validate-all, check-links, update-index
```

### Checking LP Status
```bash
grep "status:" LPs/lp-20.md
```

### Finding Related LPs
```bash
grep -r "requires:.*20" LPs/
```

### Viewing Statistics
```bash
make stats  # Shows counts by status and type
```

## Resources

- **Forum**: forum.lux.network (proposal discussions)
- **Documentation**: docs.lux.network
- **Discord**: Community chat and support
- **GitHub Discussions**: LP-specific discussions

## Getting Help

- Review `docs/CONTRIBUTING.md` for guidelines
- Check `docs/FAQ.md` for common questions
- Use existing LPs as examples
- Run `make help` for command reference