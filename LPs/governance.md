---
title: LP Governance Framework
description: How Lux Proposals work - submission, review, and activation process
---

# LP Governance Framework

The Lux Proposal (LP) system is the primary mechanism for proposing, discussing, and implementing changes to the Lux Network. This document explains how the governance process works.

## What is an LP?

A **Lux Proposal (LP)** is a design document providing information to the Lux community, describing a new feature, process, or environment change. LPs are the primary mechanism for proposing major new features, collecting community input on an issue, and documenting design decisions.

## LP Types

### Standards Track
Technical specifications that require implementation:
- **Core**: Consensus, network rules, protocol changes
- **Networking**: P2P protocols, network layer specifications
- **Interface**: APIs, RPC specifications
- **LRC**: Application standards (tokens, NFTs, DeFi)
- **Bridge**: Cross-chain protocols and interoperability

### Meta
Process and governance proposals that affect how LPs work:
- LP process improvements
- Editor guidelines
- Community governance structures

### Informational
Guidelines, best practices, and general information:
- Design patterns
- Implementation guides
- Educational content

## LP Lifecycle

```
Draft → Review → Last Call → Final
         ↓           ↓
    Withdrawn    Stagnant
```

### Status Definitions

**Draft**
- Initial submission
- Work in progress
- Open to major changes
- Discussed on forums and GitHub

**Review**
- Editors reviewing for technical soundness
- Community providing feedback
- Implementation in progress
- Minor changes allowed

**Last Call**
- Final review period (14 days minimum)
- No substantial changes
- Community last chance for feedback
- Implementation complete

**Final**
- Accepted and merged
- Implementation deployed
- No further changes (requires new LP to modify)

**Stagnant**
- No activity for 6+ months
- Can be revived
- Needs champion to continue

**Withdrawn**
- Author abandons proposal
- Can be adopted by new champion

**Superseded**
- Replaced by newer LP
- Historical reference only

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

## LP Requirements

### Required Sections
All LPs must include:

**YAML Frontmatter**
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

**Content Sections**
1. **Abstract** (~200 words overview)
2. **Motivation** (why this LP is needed)
3. **Specification** (technical details)
4. **Rationale** (design decisions)
5. **Backwards Compatibility**
6. **Test Cases** (required for Standards Track)
7. **Reference Implementation** (optional but recommended)
8. **Security Considerations**
9. **Copyright** (must be CC0)

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

## Tools and Resources

### LP Repository
- **GitHub**: [github.com/luxfi/lps](https://github.com/luxfi/lps)
- **Documentation**: [lps.lux.network](https://lps.lux.network)
- **Discussions**: [github.com/luxfi/lps/discussions](https://github.com/luxfi/lps/discussions)

### Commands
```bash
# Create new LP
make new

# Validate LP
make validate FILE=LPs/lp-N.md

# Validate all
make validate-all

# Check links
make check-links

# Update index
make update-index

# Pre-PR checks
make pre-pr
```

### Templates
- `LPs/TEMPLATE.md` - Standard LP template
- `LPs/lp-0.md` - Network architecture example
- `LPs/lp-311-mldsa.md` - Technical specification example

## FAQ

**Q: How long does the LP process take?**
A: Varies widely. Simple proposals: 2-3 months. Complex changes: 6-12 months.

**Q: Can I submit an LP without code?**
A: Yes, but implementation strengthens your proposal significantly.

**Q: What if my LP is rejected?**
A: Gather feedback, revise, and resubmit. Or champion someone else's similar proposal.

**Q: Do I need to be a developer?**
A: Not required, but technical understanding helps. Find a technical co-author.

**Q: How are conflicts resolved?**
A: Through discussion and rough consensus. Editors mediate, community decides.

**Q: Can LPs be updated after Final status?**
A: No. Submit a new LP that supersedes the old one.

## Related Documents

- [LP-0](./lp-0.md) - Network Architecture & Governance Framework
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [README.md](../README.md) - Repository overview

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
