# Contributing to Lux Proposals (LPs)

Thank you for your interest in contributing to the Lux Network! This guide covers how to contribute to LPs and participate in the governance process.

## Quick Links

| Resource | URL | Purpose |
|----------|-----|---------|
| **Browse LPs** | [lps.lux.network](https://lps.lux.network) | Read all proposals |
| **Discussions** | [github.com/luxfi/lps/discussions](https://github.com/luxfi/lps/discussions) | Discuss ideas & proposals |
| **Issues** | [github.com/luxfi/lps/issues](https://github.com/luxfi/lps/issues) | Report problems, suggest edits |
| **Taxonomy** | [TAXONOMY.md](docs/TAXONOMY.md) | Understanding LP categories |
| **FAQ** | [FAQ.md](docs/FAQ.md) | Common questions answered |
| **Discord** | [discord.gg/luxfi](https://discord.gg/luxfi) | Real-time community chat |

## How to Participate

### Discuss & Improve Existing Standards

1. **Comment on Discussions**: Each LP has a linked discussion thread. Share feedback, ask questions, or suggest improvements.

2. **Open an Issue**: Found a problem or have a concrete suggestion?
   - Go to [Issues](https://github.com/luxfi/lps/issues)
   - Use descriptive title referencing the LP number (e.g., "LP-110: Clarify validator rotation timing")
   - Provide specific, actionable feedback

3. **Submit a PR**: For typos, clarifications, or improvements:
   - Fork the repository
   - Make your changes
   - Submit a PR referencing the relevant LP and discussion

### Propose New Standards

See [Creating Your LP](#2-create-your-lp) below. The process is:
1. **Discuss first** — get community feedback before writing
2. **Draft your LP** — use the template
3. **Submit PR** — PR number becomes your LP number
4. **Iterate** — address feedback until consensus

### Discussion Categories

| Category | Use For |
|----------|---------|
| **Consensus** | Photon, Flare, Quasar, finality protocols |
| **Threshold Crypto** | FROST, CGGMP, Ringtail, distributed signing |
| **MPC** | Secure computation (NOT signing) |
| **PQC** | Post-quantum: ML-KEM, ML-DSA, SLH-DSA |
| **Chains** | P, C, X, T, Q, Z, A, B chain specs |
| **DeFi** | AMMs, lending, oracles |
| **Governance** | DAOs, voting, treasury |
| **Ideas** | New concepts not yet categorized |

## Getting Started

### Prerequisites

- Basic understanding of blockchain concepts
- Familiarity with Markdown formatting
- GitHub account

### Setup

```bash
# Clone the repository
git clone https://github.com/luxfi/LPs.git
cd lps

# Verify scripts are executable
make permissions
```

## Contributing an LP

### 1. Start a Discussion

Before writing a formal proposal, discuss your idea:

1. Go to [GitHub Discussions](https://github.com/luxfi/LPs/discussions)
2. Choose the appropriate category:
   - **Core** - Protocol-level changes
   - **Interface** - APIs, RPC, tooling
   - **LRC** - Application standards (tokens, NFTs)
   - **Meta** - Governance processes
   - **Ideas** - General feature requests
3. Create a new discussion with your idea

### 2. Create Your LP

Once you have positive feedback:

```bash
# Use the interactive wizard
make new

# Or create from template manually
cp LPs/TEMPLATE.md LPs/lp-draft.md
```

### 3. Required Sections

Every LP must include:

- **Abstract**: ~200 word summary
- **Motivation**: Why this change is needed
- **Specification**: Technical details
- **Rationale**: Design decisions explained
- **Backwards Compatibility**: Impact on existing systems
- **Test Cases**: For Standards Track LPs
- **Security Considerations**: Potential risks
- **Copyright**: CC0 waiver

### 4. Submit Your PR

```bash
# Validate your LP
make validate FILE=LPs/lp-draft.md

# Check all links work
make check-links

# Run pre-PR checks
make pre-pr
```

Then open a Pull Request. Your PR number becomes your LP number!

### 5. Address Feedback

- Editors will review for format and completeness
- Community provides feedback on technical merit
- Update your LP based on feedback
- Move through status progression: Draft → Review → Last Call → Final

## Editing Existing LPs

### Fork and Edit Workflow

1. Fork the repository
2. Make your changes
3. Submit a PR with clear description
4. Reference the discussion if applicable

### What Can Be Changed

| Status | Allowed Changes |
|--------|-----------------|
| Draft | Any changes |
| Review | Clarifications only |
| Last Call | Critical fixes only |
| Final | Errata via new LP |

## Discussion Guidelines

Each LP can have its own discussion thread. When participating:

- Be constructive and respectful
- Provide technical justification for opinions
- Reference related LPs or standards
- Keep discussions focused on the proposal

## LP Taxonomy: Research-Grade Subject Model

> **Core Principle**: Subjects describe knowledge. Chains describe deployment.

Lux uses a research-grade taxonomy that separates knowledge domains from execution environments. This is how real research labs organize work — making it citeable by domain and allowing each area to evolve independently.

**For complete taxonomy documentation, see [TAXONOMY.md](docs/TAXONOMY.md).**

### Taxonomy Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBJECTS (Research Domains)                   │
│  Consensus │ Threshold │ MPC │ KMS │ PQC │ ZKP │ Crypto │ AI    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ deployed on
┌─────────────────────────────────────────────────────────────────┐
│                    CHAINS (Execution Domains)                    │
│  P-Chain │ C-Chain │ X-Chain │ T-Chain │ Q-Chain │ Z-Chain │ ...│
└─────────────────────────────────────────────────────────────────┘
                              ↓ enables
┌─────────────────────────────────────────────────────────────────┐
│                       PRODUCT AREAS                              │
│  DeFi │ DEX │ Tokens │ Wallets │ Governance │ Privacy │ ...     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Distinctions (Academically Defensible)

These separations are **critical for credibility**:

| Distinction | Rationale |
|-------------|-----------|
| **Threshold ≠ MPC** | Signing-focused vs general secure computation |
| **MPC ≠ KMS** | Computation protocols vs governance/ops layer |
| **ZKP ≠ Privacy** | Proof systems vs confidential compute |
| **Consensus ≠ Crypto** | Agreement mechanics vs key mechanics |
| **Subjects ≠ Chains** | Knowledge domains vs deployment environments |
| **Interop ≠ Bridge** | Messages vs value movement |

### LP Number Ranges

**Subjects (Research Domains)**:
| Range | Subject | Focus |
|-------|---------|-------|
| 100-199 | Consensus | Photon, Flare, Quasar, Snowman, finality |
| 200-299 | Threshold | FROST, CGGMP, Ringtail, distributed signing |
| 300-399 | MPC | Secure computation (NOT signing) |
| 400-499 | PQC | ML-KEM, ML-DSA, SLH-DSA |
| 500-599 | KMS | K-Chain, HSM, policy engines |
| 600-699 | Crypto | Hash functions, curves, signatures |
| 700-999 | Research | ZKP, experimental protocols |

**Chains (Execution Domains)**:
| Range | Chain | Purpose |
|-------|-------|---------|
| 1000-1199 | P-Chain | Platform coordination |
| 2000-2499 | C-Chain | EVM execution |
| 3000-3999 | X-Chain | Asset exchange |
| 4000-4999 | Q-Chain | Quantum-safe |
| 5000-5999 | A-Chain | AI/Attestation |
| 6000-6999 | B-Chain | Bridge execution |
| 7000-7999 | T-Chain | Threshold + MPC |
| 8000-8999 | Z-Chain | ZK execution |

**Systems & Products**:
| Range | Category | Focus |
|-------|----------|-------|
| 0-99 | Network | Architecture, topology |
| 2500-2519 | DeFi | AMMs, lending, oracles |
| 2520-2599 | Governance | DAOs, voting, ESG |
| 9000-9999 | DEX | Order books, trading |

### Categorization Priority

LPs are assigned to **exactly one category** using this priority:

1. **Tag match** (most accurate — first matching tag wins)
2. **Number range** (LP series allocation)
3. **Explicit frontmatter category** (fallback for untagged LPs)

## Commands Reference

```bash
make help          # Show all commands
make new           # Create new LP
make validate      # Validate specific LP
make validate-all  # Validate all LPs
make check-links   # Check link validity
make update-index  # Update README index
make stats         # Show LP statistics
make pre-pr        # Run all pre-PR checks
```

## LP Lifecycle

```
┌─────────┐     ┌────────┐     ┌───────────┐     ┌─────────┐
│  DRAFT  │ ──► │ REVIEW │ ──► │ LAST CALL │ ──► │  FINAL  │
└─────────┘     └────────┘     └───────────┘     └─────────┘
     │               │              │
     │               ▼              ▼
     │          ┌─────────┐   ┌─────────────┐
     └────────► │WITHDRAWN│   │  STAGNANT   │
                └─────────┘   └─────────────┘
```

| Status | Meaning | Duration |
|--------|---------|----------|
| **Draft** | Initial proposal, actively edited | Until ready |
| **Review** | Open for community feedback | Varies |
| **Last Call** | Final review period | 14 days |
| **Final** | Accepted, immutable | Permanent |
| **Withdrawn** | Abandoned by author | — |
| **Stagnant** | No activity for 60+ days | — |

### Moving Forward

- **Draft → Review**: Complete all required sections, address initial feedback
- **Review → Last Call**: Show community support, resolve concerns
- **Last Call → Final**: No critical objections, implementations exist

### What Editors Check

Editors review for **format and completeness**, not merit:

- ✅ Required sections present
- ✅ Valid YAML frontmatter
- ✅ Correct file naming
- ✅ Clear specifications
- ✅ No duplicate proposals
- ❌ Editors do NOT judge technical merit (that's community consensus)

## Code of Conduct

- Be respectful and inclusive
- Focus on technical merit
- No personal attacks
- Constructive criticism only
- Assume good faith

## Getting Help

| Need | Go To |
|------|-------|
| Process questions | [Discussions](https://github.com/luxfi/lps/discussions) |
| Technical questions | [Discord #dev-help](https://discord.gg/luxfi) |
| Bug reports | [Issues](https://github.com/luxfi/lps/issues) |
| Detailed answers | [FAQ](docs/FAQ.md) |
| Category definitions | [TAXONOMY.md](docs/TAXONOMY.md) |
| Examples | Browse existing LPs |

## License

All LP content is licensed under [CC0](LICENSE.md) (public domain).

By submitting an LP, you agree to waive all copyright claims.

---

**Final Rule**: Subjects describe knowledge. Chains describe deployment.
