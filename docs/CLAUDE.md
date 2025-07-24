# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Lux Improvement Proposals (LPs)** repository - a governance and standardization framework for the Lux Network blockchain ecosystem. Unlike typical code repositories, this is a **documentation and specification repository** that manages proposals for improvements, standards, and processes within the Lux ecosystem.

The LP process is modeled after Ethereum's EIP (Ethereum Improvement Proposal) system and serves as the primary mechanism for:
- Proposing new features and standards
- Collecting community input on proposals
- Documenting design decisions
- Creating application-layer standards (LRCs)

## Key Concepts

### LP (Lux Improvement Proposal)
Any proposed change to the Lux Network ecosystem. All proposals start as LPs.

### LRC (Lux Request for Comment)
Application-layer standards that define how applications interact with Lux Network. These are a subset of LPs with `category: LRC`. Examples include:
- LRC-20: Fungible Token Standard
- LRC-721: Non-Fungible Token Standard (planned)
- LRC-1155: Multi-Token Standard (planned)

### Proposal Types
- **Standards Track**: Technical specifications (Core, Networking, Interface, LRC)
- **Meta**: Process and governance proposals  
- **Informational**: Guidelines and best practices

### Status Flow
Draft → Review → Last Call → Final (or Withdrawn/Stagnant)

## Common Commands

The repository includes a Makefile for convenient access to all common tasks. You can use either `make` commands or run the scripts directly.

### Creating a New LP
```bash
make new
# or directly: ./scripts/new-lip.sh
```
Interactive wizard that creates a properly formatted LP with all required sections. It will:
- Prompt for LP metadata (title, type, category, etc.)
- Generate a draft file with correct formatting
- Include all required sections

### Validating a LP
```bash
make validate FILE=LPs/lip-20.md
# or directly: ./scripts/validate-lip.sh LPs/lip-20.md
```
Checks that a LP:
- Has all required sections
- Uses correct YAML frontmatter format
- Follows naming conventions
- Contains valid markdown

### Validating All LPs
```bash
make validate-all
```
Validates all LP files in the repository at once.

### Checking Links
```bash
make check-links
# or directly: ./scripts/check-links.sh
```
Validates all internal and external links across all LP files. Useful before submitting PRs.

### Updating the Index
```bash
make update-index
# or directly: python3 ./scripts/update-index.py
```
Automatically updates the LP index in README.md based on existing LP files. Run this after adding or modifying LPs.

### Additional Make Commands
```bash
make help          # Show all available commands
make stats         # Show LP statistics (count by status/type)
make list          # List all LPs with their titles
make draft         # Create a new draft from template
make pre-pr        # Run all checks before submitting a PR
make permissions   # Fix script permissions if needed
```

## File Structure and Conventions

### Directory Structure
```
lps/
├── LPs/                    # Individual LP documents
│   ├── TEMPLATE.md         # Template for new proposals
│   ├── lip-1.md            # LP-1: Community Contribution Framework
│   └── lip-20.md           # LP-20: LRC-20 Fungible Token Standard
├── assets/                  # Supporting files for LPs
│   └── lip-N/              # Assets for specific LP number N
├── phases/                  # Development roadmap phases
├── scripts/                 # Automation scripts
└── *.md                    # Documentation files (README, CONTRIBUTING, etc.)
```

### File Naming
- LP files: `lip-N.md` where N is the LP number
- Draft files: `lip-draft.md` for initial submissions
- Assets: Place in `assets/lip-N/` directory

### Required LP Sections
1. **YAML Frontmatter** (required fields):
   ```yaml
   lip: <number>
   title: <short descriptive title>
   description: <one sentence description>
   author: <Name (@github-username)>
   discussions-to: <URL to discussion forum>
   status: Draft|Review|Last Call|Final|Withdrawn|Stagnant
   type: Standards Track|Meta|Informational
   category: Core|Networking|Interface|LRC  # only for Standards Track
   created: <YYYY-MM-DD>
   requires: <LP numbers>  # optional
   ```

2. **Content Sections**:
   - Abstract (~200 words)
   - Motivation
   - Specification
   - Rationale
   - Backwards Compatibility
   - Test Cases (required for Standards Track)
   - Reference Implementation (optional but recommended)
   - Security Considerations
   - Copyright (must be CC0)

## Workflow for Contributing

### Proposing a New LP
1. **Discuss idea** on forum first (forum.lux.network)
2. **Run** `./scripts/new-lip.sh` to create draft
3. **Submit PR** with `lip-draft.md` file
4. **PR number** becomes your LP number
5. **Rename file** to `lip-N.md` where N is PR number
6. **Address feedback** from editors and community
7. **Move through statuses** as consensus builds

### Making Changes to Existing LPs
- Only Draft status LPs can have substantial changes
- Final LPs require a new LP to modify
- Always validate changes with `./scripts/validate-lip.sh`
- Update index after changes with `python3 ./scripts/update-index.py`

## Important Notes

### No Traditional Build Process
This is a documentation repository:
- No `npm install` or dependencies
- No build commands
- No test suites to run
- Scripts are standalone shell/Python scripts

### LRC Numbering
- LRCs use the same file naming as LPs: `lip-N.md`
- The LRC number is assigned separately (e.g., LP-20 defines LRC-20)
- Title should include both: "LP-20: LRC-20 Fungible Token Standard"

### Cross-Chain Compatibility
Many LRCs are designed to be compatible with Ethereum standards:
- LRC-20 ≈ ERC-20
- LRC-721 ≈ ERC-721 (planned)
- LRC-1155 ≈ ERC-1155 (planned)

See `CROSS-REFERENCE.md` for mappings.

### Security Considerations
- All LPs must include Security Considerations section
- Consensus-affecting changes require extensive testing
- Implementation must be proven before Final status
- LRCs require at least 2 independent implementations

### Editor Review Process
LP editors review for:
- Technical soundness
- Formatting compliance  
- Completeness of required sections
- Clarity and coherence
- Not duplicate of existing proposals

Editors do NOT judge merit - that's for community consensus.

## Development Timeline

The Lux Network follows a phased approach (see `phases/` directory):
- **Phase 1** (Q1 2025): Foundational Governance
- **Phase 2** (Q2 2025): Execution Environment & Asset Standards
- **Phase 3** (Q3 2025): Cross-Chain Interoperability
- **Phase 4** (Q4 2025): Attestations & Compliance
- **Phase 5** (Q1 2026): Privacy & Zero-Knowledge
- **Phase 6** (Q2 2026): Data Availability & Scalability
- **Phase 7** (Q3 2026+): Application Layer Standards

## Quick Reference

### Check LP Status
Look in YAML frontmatter for `status:` field

### Find Related LPs
Check `requires:` field in frontmatter and search for references

### Validate Before Submitting
```bash
./scripts/validate-lip.sh LPs/lip-draft.md
./scripts/check-links.sh
```

### Common Issues
- Missing required sections → Use template or `new-lip.sh`
- Invalid links → Run `check-links.sh` before submitting
- Wrong file location → LPs go in `LPs/` directory
- Incorrect naming → Use `lip-N.md` format

### Getting Help
- Read `CONTRIBUTING.md` for detailed guidelines
- Check `FAQ.md` for common questions
- Review existing LPs as examples
- Ask in forum.lux.network for clarification