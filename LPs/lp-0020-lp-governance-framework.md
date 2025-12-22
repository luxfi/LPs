---
lp: 20
title: LP Governance Framework
description: How Lux Proposals work - submission, review, and activation process
author: Lux Core Team
status: Final
type: Meta
created: 2025-12-21
tags: [governance, meta, process, standards]
order: 2
tier: core
---

# LP-0020: LP Governance Framework

## Abstract

The Lux Proposal (LP) system is the primary mechanism for proposing, discussing, and implementing changes to the Lux Network. This document defines the governance process, LP types, lifecycle stages, and community participation guidelines.

## Motivation

A clear, transparent governance process enables:
- **Open participation**: Anyone can propose changes
- **Rough consensus**: Decisions through technical merit and community support
- **Implementation focus**: Working code over documentation
- **Transparency**: All processes are public

---

## Specification

### What is an LP?

A **Lux Proposal (LP)** is a design document providing information to the Lux community, describing a new feature, process, or environment change. LPs are the primary mechanism for proposing major new features, collecting community input on an issue, and documenting design decisions.

### LP Types

#### Standards Track
Technical specifications that require implementation:
- **Core**: Consensus, network rules, protocol changes
- **Networking**: P2P protocols, network layer specifications
- **Interface**: APIs, RPC specifications
- **LRC**: Application standards (tokens, NFTs, DeFi)
- **Bridge**: Cross-chain protocols and interoperability

#### Meta
Process and governance proposals that affect how LPs work:
- LP process improvements
- Editor guidelines
- Community governance structures

#### Informational
Guidelines, best practices, and general information:
- Design patterns
- Implementation guides
- Educational content

### LP Lifecycle

```
Draft --> Review --> Last Call --> Final
            |            |
        Withdrawn    Stagnant
```

#### Status Definitions

| Status | Description |
|--------|-------------|
| **Draft** | Initial submission, work in progress, open to major changes |
| **Review** | Editors reviewing, community feedback, implementation in progress |
| **Last Call** | Final 14-day review period, no substantial changes |
| **Final** | Accepted, implementation deployed, no further changes |
| **Stagnant** | No activity for 6+ months, can be revived |
| **Withdrawn** | Author abandons proposal, can be adopted by new champion |
| **Superseded** | Replaced by newer LP, historical reference only |

---

## Submission Process

### 1. Pre-Proposal Discussion
Before submitting an LP:
- Discuss on [forum.lux.network](https://forum.lux.network)
- Gauge community interest
- Refine the idea
- Find collaborators

### 2. Draft Submission
Create your LP:
```bash
cd ~/work/lux/lps
make new  # Interactive wizard
```

Submit via Pull Request:
- File: `LPs/lp-draft.md`
- PR number becomes LP number
- Editors assign LP number
- Rename to `lp-N.md`

### 3. Editor Review
LP editors check for:
- ✅ Technical soundness
- ✅ Proper formatting
- ✅ Complete required sections
- ✅ Clear specification
- ✅ No duplication

**Note**: Editors review form, not merit. Community decides value.

### 4. Community Feedback
Gather consensus through:
- GitHub discussions
- Forum posts
- Community calls
- Implementation testing

### 5. Implementation
Build reference implementation:
- Prove feasibility
- Test in production-like environment
- Document edge cases
- Multiple implementations preferred

### 6. Activation
Final LPs activate via:
- Hard fork (consensus changes)
- Soft fork (backward-compatible)
- Opt-in adoption (application standards)

---

## LP Requirements

### Required YAML Frontmatter
```yaml
---
lp: <number>
title: <short descriptive title>
description: <one sentence>
author: <Name (@github)>
discussions-to: <URL>
status: Draft|Review|Last Call|Final
type: Standards Track|Meta|Informational
category: Core|Networking|Interface|LRC|Bridge
created: <YYYY-MM-DD>
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

---

## LP Editors

### Responsibilities
- Review LP submissions for completeness
- Assign LP numbers
- Merge accepted proposals
- Maintain LP repository
- Enforce formatting standards

### Current Editors
- Lux Core Team (@luxfi)

### Becoming an Editor
Editors are selected based on:
- Long-term contribution to LPs
- Technical expertise
- Availability and commitment
- Community trust

---

## Governance Principles

### Open Participation
Anyone can:
- Submit an LP
- Comment on proposals
- Implement specifications
- Vote through participation

### Rough Consensus
Decisions made through:
- Technical merit
- Community support
- Working implementations
- No formal voting

### Reference Implementations
Show, don't tell:
- Code speaks louder than words
- Working code proves feasibility
- Multiple implementations show adoption

### Transparency
All processes are public:
- GitHub for tracking
- Forums for discussion
- Open meetings for decisions

---

## Special Processes

### Emergency Proposals
For critical security issues:
1. **Private disclosure** to core team
2. **Fast-tracked review** (24-48 hours)
3. **Coordinated deployment**
4. **Public disclosure** after fix

### Breaking Changes
Hard forks require:
- Extended discussion period (3+ months)
- Multiple implementations
- Network-wide coordination
- Comprehensive testing

### LRC Standards
Application-level standards need:
- At least 2 independent implementations
- Production testing
- Community adoption
- ERC compatibility (where applicable)

---

## Tools and Resources

### LP Repository
- **GitHub**: [github.com/luxfi/lps](https://github.com/luxfi/lps)
- **Documentation**: [lps.lux.network](https://lps.lux.network)
- **Discussions**: [github.com/luxfi/lps/discussions](https://github.com/luxfi/lps/discussions)

### Commands
```bash
make new           # Create new LP
make validate      # Validate LP
make validate-all  # Validate all
make check-links   # Check links
make update-index  # Update index
make pre-pr        # Pre-PR checks
```

---

## Backwards Compatibility

This LP establishes the governance framework. It does not break any existing processes.

## Security Considerations

- Emergency LP process ensures rapid security response
- Private disclosure protects users during fix development
- Editor review prevents malicious proposals

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
