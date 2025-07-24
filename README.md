# Lux Improvement Proposals (LIPs)

<div align="center">
  <img src="https://lux.network/logo.png" alt="Lux Network" width="300">
</div>

---

This repository contains all Lux Improvement Proposals (LIPs) - the primary mechanism for proposing new features, collecting community input, and documenting design decisions for the Lux Network.

## What is a LIP?

A Lux Improvement Proposal (LIP) is a design document providing information to the Lux community about a proposed change to the system. LIPs are the primary mechanism for:
- Proposing new features and standards
- Collecting community technical input
- Documenting design decisions

## Quick Start

- 📖 **New to LIPs?** Start with [LIP-0](LIPs/lip-0.md) for architecture overview and contribution guidelines
- 🚀 **Create a new LIP:** Run `make new` or `./scripts/new-lip.sh`
- 📋 **View all LIPs:** See [INDEX.md](INDEX.md) for complete documentation
- 🔍 **Check status:** See [STATUS.md](STATUS.md) for current LIP statuses

## LIP Index

### Foundation & Governance (LIPs 0–9)
| LIP | Title | Status | Type |
|---|---|---|---|
| [0](LIPs/lip-0.md) | Lux Network Architecture & Community Framework | Final | Meta |
| [1](LIPs/lip-1.md) | Native LUX Token Standard | Final | Standards Track |
| [2](LIPs/lip-2.md) | Liquidity Pool Standard | Draft | Standards Track |
| [3](LIPs/lip-3.md) | LX Exchange Protocol | Draft | Standards Track |
| [4](LIPs/lip-4.md) | Core Consensus & Node Architecture | Draft | Standards Track |
| [5](LIPs/lip-5.md) | Simplex Consensus Mechanism | Draft | Standards Track |
| [6](LIPs/lip-6.md) | Network Runner & Testing Framework | Draft | Standards Track |
| [7](LIPs/lip-7.md) | VM SDK Specification | Draft | Standards Track |
| [8](LIPs/lip-8.md) | Plugin Architecture | Draft | Standards Track |
| [9](LIPs/lip-9.md) | CLI Tool Specification | Draft | Standards Track |

### Chain Specifications (LIPs 10–14)
| LIP | Title | Status | Type |
|---|---|---|---|
| [10](LIPs/lip-10.md) | P-Chain (Platform Chain) Specification | Draft | Standards Track |
| [11](LIPs/lip-11.md) | X-Chain (Exchange Chain) Specification | Draft | Standards Track |
| [12](LIPs/lip-12.md) | C-Chain (Contract Chain) Specification | Draft | Standards Track |
| [13](LIPs/lip-13.md) | M-Chain (MPC Bridge Chain) Specification | Draft | Standards Track |
| [14](LIPs/lip-14.md) | Z-Chain (Zero-Knowledge Chain) Specification | Draft | Standards Track |

### Bridge & Cross-Chain (LIPs 15–19)
| LIP | Title | Status | Type |
|---|---|---|---|
| [15](LIPs/lip-15.md) | MPC Bridge Protocol | Draft | Standards Track |
| [16](LIPs/lip-16.md) | Teleport Cross-Chain Protocol | Draft | Standards Track |
| [17](LIPs/lip-17.md) | Bridge Asset Registry | Draft | Standards Track |
| [18](LIPs/lip-18.md) | Cross-Chain Message Format | Draft | Standards Track |
| [19](LIPs/lip-19.md) | Bridge Security Framework | Draft | Standards Track |

### Token Standards (LIPs 20–39)
| LIP | Title | Status | Type |
|---|---|---|---|
| [20](LIPs/lip-20.md) | LRC-20 Fungible Token Standard | Final | Standards Track |

### Advanced Standards (LIPs 40+)
| LIP | Title | Status | Type |
|---|---|---|---|
| [40](LIPs/lip-40.md) | Wallet Standards | Draft | Standards Track |
| [50](LIPs/lip-50.md) | Developer Tools | Draft | Standards Track |
| [60](LIPs/lip-60.md) | DeFi Protocols | Draft | Standards Track |
| [80](LIPs/lip-80.md) | Infrastructure & Operations | Draft | Standards Track |
| [90](LIPs/lip-90.md) | Research & Future | Draft | Standards Track |
| [721](LIPs/lip-721.md) | LRC-721 Non-Fungible Token Standard | Final | Standards Track |
| [1155](LIPs/lip-1155.md) | LRC-1155 Multi-Token Standard | Final | Standards Track |

## LIP Process

1. **💡 Have an idea** - Start with community discussion on [forum.lux.network](https://forum.lux.network)
2. **📝 Draft your LIP** - Use `make new` to create from template
3. **🔄 Submit PR** - Your PR number becomes your LIP number
4. **👥 Get reviewed** - LIP editors review for completeness
5. **🗳️ Build consensus** - Community discussion and feedback
6. **⏰ Last Call** - 14-day final review period
7. **✅ Final** - LIP is finalized and ready for implementation

## Types of LIPs

- **Standards Track**: Technical specifications affecting protocol
  - Core: Consensus and network changes
  - Networking: P2P and network layer
  - Interface: API/RPC specifications
  - LRC: Application-layer standards (tokens, NFTs, etc.)
- **Meta**: Process and governance proposals
- **Informational**: Guidelines and best practices

## Tools and Commands

We provide a Makefile and scripts to help manage LIPs:

```bash
# Create a new LIP
make new

# Validate a LIP
make validate FILE=LIPs/lip-20.md

# Validate all LIPs
make validate-all

# Check all links
make check-links

# Update the index
make update-index

# Show LIP statistics
make stats

# Run all checks before PR
make pre-pr

# Manage LIP discussions (requires GitHub CLI):
```bash
# Create a GitHub Discussion for a LIP:
gh discussion create --repo luxfi/lips \
  --category "LIP Discussions" \
  --title "LIP <number>: <LIP title>" \
  --body "Discussion for LIP-<number>: https://github.com/luxfi/lips/blob/main/LIPs/lip-<number>.md"

# List existing LIP discussion categories:
gh api repos/luxfi/lips/discussions/categories
```
```

## Development Roadmap

The Lux Network follows a phased development approach:

- **Phase 1** (Q1 2025): Foundational Governance & Core Protocol
- **Phase 2** (Q2 2025): Execution Environment & Asset Standards
- **Phase 3** (Q3 2025): Cross-Chain Interoperability
- **Phase 4** (Q4 2025): Attestations & Compliance
- **Phase 5** (Q1 2026): Privacy & Zero-Knowledge
- **Phase 6** (Q2 2026): Data Availability & Scalability
- **Phase 7** (Q3 2026+): Application Layer Standards

See [phases/](phases/) for detailed roadmap information.

## Contributing

We welcome contributions! Please see:
- [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- [LIP-0](LIPs/lip-0.md) for the community framework
- [GOVERNANCE.md](GOVERNANCE.md) for governance processes

## Resources

- 🌐 **Forum**: [forum.lux.network](https://forum.lux.network)
- 📚 **Documentation**: [docs.lux.network](https://docs.lux.network)
- 💬 **Discord**: [discord.gg/lux](https://discord.gg/lux)
- 🐦 **Twitter**: [@luxdefi](https://twitter.com/luxdefi)

## License

All LIPs are released under [CC0 1.0 Universal](LICENSE.md).

---

<div align="center">
  <strong>Building the future of decentralized finance, one proposal at a time.</strong>
</div>
