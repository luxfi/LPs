# Contributing to Lux Proposals (LPs)

Thank you for your interest in contributing to the Lux Network! This guide covers how to contribute to LPs and participate in the governance process.

## Quick Links

- **Discussions**: [github.com/luxfi/LPs/discussions](https://github.com/luxfi/LPs/discussions)
- **Issues**: [github.com/luxfi/LPs/issues](https://github.com/luxfi/LPs/issues)
- **Documentation**: [lps.lux.network/docs](https://lps.lux.network/docs)

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

## LP Categories

| Range | Category | Description |
|-------|----------|-------------|
| 0-99 | Core Architecture | Network fundamentals |
| 1000-1999 | Platform Chain | D-Chain (P-Chain) specs |
| 2000-2999 | EVM/Contracts | C-Chain standards |
| 3000-3999 | Protocol Extensions | X-Chain exchange |
| 4000-4999 | Virtual Machines | Q-Chain quantum |
| 5000-5999 | Interoperability | A-Chain AI/attestation |
| 6000-6999 | Bridge Protocol | B-Chain bridge |
| 7000-7999 | Threshold Crypto | T-Chain MPC |
| 8000-8999 | Advanced Protocol | Z-Chain privacy |
| 9000-99999 | Extended Specs | DEX, DeFi |

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

## Code of Conduct

- Be respectful and inclusive
- Focus on technical merit
- No personal attacks
- Constructive criticism only

## Questions?

- Open a [discussion](https://github.com/luxfi/LPs/discussions)
- Check the [FAQ](docs/FAQ.md)
- Read existing LPs for examples

## License

All LP content is licensed under [CC0](LICENSE.md).
