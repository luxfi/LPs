# Lux Proposals (LPs)

Lux Proposals (LPs) are the primary mechanism for proposing new features, gathering community input, and documenting design decisions for the [Lux Network](https://lux.network). This process ensures that changes to the network are transparently reviewed and achieve community consensus before implementation – much like Bitcoin’s BIPs and Ethereum’s EIPs, which allow anyone to propose and debate protocol improvements  .

## What is an LP?

A Lux Proposal (LP) is a design document that provides information to the Lux community about a proposed change to the system. LPs serve as the formal pathway to introduce improvements and build agreement on their adoption. They are used for:
- Proposing new features or standards – outlining technical specs for enhancements.
- Collecting community input – soliciting feedback and technical review from the community.
- Documenting design decisions – recording the rationale behind changes.

By using LPs, the Lux community can coordinate development in a decentralized manner, similar to the improvement proposal frameworks of other blockchains . Every network upgrade or standard in Lux originates from an LP, ensuring an open governance process.

## Quick Start
- 📖 New to LPs? Begin with LP-0, which provides an overview of the Lux Network architecture and the community contribution framework.
- 🚀 Create a new LP: Use the provided template by running make new (this invokes the ./scripts/new-lp.sh script) to scaffold a proposal draft.
+ 📋 View all LPs: See [docs/INDEX.md](./docs/INDEX.md) for a complete list of proposals and their details.
+ 🔍 Check status: See [docs/STATUS.md](./docs/STATUS.md) for the current status of each LP (Draft, Final, etc.).

## LP Index

| Number | Title | Author(s) | Type | Category | Status |
|:-------|:------|:----------|:-----|:---------|:-------|
| [LP-0](./LPs/lp-0.md) | Lux Network Architecture & Community Framework | Lux Network Team | Meta | - | Final |
| [LP-1](./LPs/lp-1.md) | Lux Consensus | Lux Network Team | Standards Track | Core | Final |
| [LP-2](./LPs/lp-2.md) | Lux Virtual Machine and Execution Environment | Lux Network Team | Standards Track | Core | Final |
| [LP-3](./LPs/lp-3.md) | Lux Subnet Architecture and Cross-Chain Interop... | Lux Network Team | Standards Track | Core | Final |
| [LP-4](./LPs/lp-4.md) | Quantum-Resistant Cryptography Integration in Lux | Lux Network Team | Standards Track | Core | Draft |
| [LP-5](./LPs/lp-5.md) | Lux Quantum-Safe Wallets and Multisig Standard | Lux Network Team | Standards Track | Core | Draft |
| [LP-6](./LPs/lp-6.md) | Network Runner & Testing Framework | Lux Network Team | Standards Track | Interface | Draft |
| [LP-7](./LPs/lp-7.md) | VM SDK Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-8](./LPs/lp-8.md) | Plugin Architecture | Lux Network Team | Standards Track | Core | Draft |
| [LP-9](./LPs/lp-9.md) | CLI Tool Specification | Lux Network Team | Standards Track | Interface | Draft |
| [LP-10](./LPs/lp-10.md) | P-Chain (Platform Chain) Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-11](./LPs/lp-11.md) | X-Chain (Exchange Chain) Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-12](./LPs/lp-12.md) | C-Chain (Contract Chain) Specification | Lux Network Team | Standards Track | Core | Draft |
| [LP-13](./LPs/lp-13.md) | M-Chain – Decentralised MPC Custody & Swap-Signature Layer | Lux Protocol Team | Standards Track | Core | Draft |
| [LP-14](./LPs/lp-14.md) | M-Chain Threshold Signatures with CGG21 (UC Non... | Lux Industries Inc. | Standards Track | Core | Draft |
| [LP-15](./LPs/lp-15.md) | MPC Bridge Protocol | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-16](./LPs/lp-16.md) | Teleport Cross-Chain Protocol | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-17](./LPs/lp-17.md) | Bridge Asset Registry | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-18](./LPs/lp-18.md) | Cross-Chain Message Format | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-19](./LPs/lp-19.md) | Bridge Security Framework | Lux Network Team | Standards Track | Bridge | Draft |
| [LP-20](./LPs/lp-20.md) | LRC-20 Fungible Token Standard | Lux Network Team | Standards Track | LRC | Final |
| [LP-21](./LPs/lp-21.md) | Lux Teleport Protocol | Gemini | Standards Track | Core | Draft |
| [LP-22](./LPs/lp-22.md) | Warp Messaging 2.0: Native Interchain Transfers | Gemini | Standards Track | Networking | Draft |
| [LP-23](./LPs/lp-23.md) | NFT Staking and Native Interchain Transfer | Gemini | Standards Track | LRC | Draft |
| [LP-24](./LPs/lp-24.md) | Parallel Validation and Shared Mempool | Gemini | Standards Track | Core | Draft |
| [LP-25](./LPs/lp-25.md) | L2 to Sovereign L1 Ascension and Fee Model | Gemini | Standards Track | Core | Draft |
| [LP-26](./LPs/lp-26.md) | C-Chain EVM Equivalence and Core EIPs Adoption | Gemini | Standards Track | Core | Draft |
| [LP-27](./LPs/lp-27.md) | LRC Token Standards Adoption | Gemini | Standards Track | LRC | Draft |
| [LP-28](./LPs/lp-28.md) | LRC-20 Burnable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-29](./LPs/lp-29.md) | LRC-20 Mintable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-30](./LPs/lp-30.md) | LRC-20 Bridgable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-31](./LPs/lp-31.md) | LRC-721 Burnable Token Extension | Gemini | Standards Track | LRC | Draft |
| [LP-32](./LPs/lp-32.md) | C-Chain Rollup Plugin Architecture | Lux Network Team | Standards Track | Core | Draft |
| [LP-33](./LPs/lp-33.md) | P-Chain State Rollup to C-Chain EVM | Lux Network Team | Standards Track | Core | Draft |
| [LP-34](./LPs/lp-34.md) | P-Chain as Superchain L2 – OP Stack Rollup Inte... | Zach Kelling and Lux Team | Standards Track | Core | Draft |
| [LP-35](./LPs/lp-35.md) | Stage-Sync Pipeline for Coreth Bootstrapping | Zach Kelling and Lux Team | Standards Track | Core | Draft |
| [LP-36](./LPs/lp-36.md) | X-Chain Order-Book DEX API & RPC Addendum | Zach Kelling and Lux Team | Standards Track | Interface | Draft |
| [LP-37](./LPs/lp-37.md) | Native Swap Integration on M-Chain, X-Chain, an... | Lux Network Team | Standards Track | Core | Draft |
| [LP-39](./LPs/lp-39.md) | LX Python SDK Corollary for On-Chain Actions | Lux Network Team | Informational | Interface | Draft |
| [LP-40](./LPs/lp-40.md) | Wallet Standards | Lux Network Team | Standards Track | Interface | Draft |
| [LP-42](./LPs/lp-42.md) | Multi-Signature Wallet Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-45](./LPs/lp-45.md) | Z-Chain Encrypted Execution Layer Interface | Zach Kelling and Lux Team | Standards Track | Interface | Draft |
| [LP-50](./LPs/lp-50.md) | Developer Tools Overview | Lux Network Team | Meta | - | Draft |
| [LP-60](./LPs/lp-60.md) | DeFi Protocols Overview | Lux Network Team | Meta | - | Draft |
| [LP-61](./LPs/lp-61.md) | Automated Market Maker (AMM) Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-62](./LPs/lp-62.md) | Yield Farming Protocol Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-63](./LPs/lp-63.md) | NFT Marketplace Protocol Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-64](./LPs/lp-64.md) | Tokenized Vault Standard (LRC-4626) | Lux Network Team | Standards Track | LRC | Draft |
| [LP-65](./LPs/lp-65.md) | Multi-Token Standard (LRC-6909) | Lux Network Team | Standards Track | LRC | Draft |
| [LP-66](./LPs/lp-66.md) | Oracle Integration Standard via Z-Chain | Lux Network Team | Standards Track | Core | Draft |
| [LP-67](./LPs/lp-67.md) | Asynchronous Vault Standard (LRC-7540) | Lux Network Team | Standards Track | LRC | Draft |
| [LP-68](./LPs/lp-68.md) | Bonding Curve AMM Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-69](./LPs/lp-69.md) | Drop Distribution Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-70](./LPs/lp-70.md) | NFT Staking Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-71](./LPs/lp-71.md) | Media Content NFT Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-72](./LPs/lp-72.md) | Bridged Asset Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-73](./LPs/lp-73.md) | Batch Execution Standard (Multicall) | Lux Network Team | Standards Track | LRC | Draft |
| [LP-74](./LPs/lp-74.md) | CREATE2 Factory Standard | Lux Network Team | Standards Track | LRC | Draft |
| [LP-75](./LPs/lp-75.md) | TEE Integration Standard | Lux Network Team | Standards Track | Core | Draft |
| [LP-76](./LPs/lp-76.md) | Random Number Generation Standard | Lux Network Team | Standards Track | Core | Draft |
| [LP-85](./LPs/lp-85.md) | Security Audit Framework | Lux Network Team | Standards Track | Meta | Draft |
| [LP-90](./LPs/lp-90.md) | Research Papers Index | Lux Network Team | Meta | - | Draft |
| [LP-91](./LPs/lp-91.md) | Payment Processing Research | Lux Network Team | Informational | - | Draft |
| [LP-92](./LPs/lp-92.md) | Cross-Chain Messaging Research | Lux Network Team | Informational | - | Draft |
| [LP-93](./LPs/lp-93.md) | Decentralized Identity Research | Lux Network Team | Informational | - | Draft |
| [LP-94](./LPs/lp-94.md) | Governance Framework Research | Lux Network Team | Informational | - | Draft |
| [LP-95](./LPs/lp-95.md) | Stablecoin Mechanisms Research | Lux Network Team | Informational | - | Draft |
| [LP-96](./LPs/lp-96.md) | MEV Protection Research | Lux Network Team | Informational | - | Draft |
| [LP-97](./LPs/lp-97.md) | Data Availability Research | Lux Network Team | Informational | - | Draft |
| [LP-98](./LPs/lp-98.md) | Luxfi GraphDB & GraphQL Engine Integration | Lux Network Team | Standards Track | Interface | Draft |
| [LP-721](./LPs/lp-721.md) | LRC-721 Non-Fungible Token Standard | Lux Network Team | Standards Track | LRC | Final |
| [LP-1155](./LPs/lp-1155.md) | LRC-1155 Multi-Token Standard | Lux Network Team | Standards Track | LRC | Final |
| [LP-4-r2](./LPs/lp-4-r2.md) | M-Chain – Decentralised MPC Custody (Superseded) | Lux Protocol Team | Standards Track | Core | Superseded |

### Notable LRCs (Application Standards)

| LRC Number | LP | Title | Status |
|:-----------|:----|:------|:-------|
| LRC-20 | [LP-20](./LPs/lp-20.md) | LRC-20 Fungible Token Standard | Final |
| LRC-23 | [LP-23](./LPs/lp-23.md) | NFT Staking and Native Interchain Transfer | Draft |
| LRC-27 | [LP-27](./LPs/lp-27.md) | LRC Token Standards Adoption | Draft |
| LRC-20 | [LP-28](./LPs/lp-28.md) | LRC-20 Burnable Token Extension | Draft |
| LRC-20 | [LP-29](./LPs/lp-29.md) | LRC-20 Mintable Token Extension | Draft |
| LRC-20 | [LP-30](./LPs/lp-30.md) | LRC-20 Bridgable Token Extension | Draft |
| LRC-721 | [LP-31](./LPs/lp-31.md) | LRC-721 Burnable Token Extension | Draft |
| LRC-42 | [LP-42](./LPs/lp-42.md) | Multi-Signature Wallet Standard | Draft |
| LRC-60 | [LP-60](./LPs/lp-60.md) | DeFi Protocols | Draft |
| LRC-61 | [LP-61](./LPs/lp-61.md) | Automated Market Maker (AMM) Standard | Draft |
| LRC-62 | [LP-62](./LPs/lp-62.md) | Yield Farming Protocol Standard | Draft |
| LRC-63 | [LP-63](./LPs/lp-63.md) | NFT Marketplace Protocol Standard | Draft |
| LRC-4626 | [LP-64](./LPs/lp-64.md) | Tokenized Vault Standard (LRC-4626) | Draft |
| LRC-6909 | [LP-65](./LPs/lp-65.md) | Multi-Token Standard (LRC-6909) | Draft |
| LRC-7540 | [LP-67](./LPs/lp-67.md) | Asynchronous Vault Standard (LRC-7540) | Draft |
| LRC-68 | [LP-68](./LPs/lp-68.md) | Bonding Curve AMM Standard | Draft |
| LRC-69 | [LP-69](./LPs/lp-69.md) | Drop Distribution Standard | Draft |
| LRC-70 | [LP-70](./LPs/lp-70.md) | NFT Staking Standard | Draft |
| LRC-71 | [LP-71](./LPs/lp-71.md) | Media Content NFT Standard | Draft |
| LRC-72 | [LP-72](./LPs/lp-72.md) | Bridged Asset Standard | Draft |
| LRC-73 | [LP-73](./LPs/lp-73.md) | Batch Execution Standard (Multicall) | Draft |
| LRC-74 | [LP-74](./LPs/lp-74.md) | CREATE2 Factory Standard | Draft |
| LRC-721 | [LP-721](./LPs/lp-721.md) | LRC-721 Non-Fungible Token Standard | Final |
| LRC-1155 | [LP-1155](./LPs/lp-1155.md) | LRC-1155 Multi-Token Standard | Final |

## LP Process

To ensure each proposal is thoroughly vetted and agreed upon, Lux Proposals follow a structured process:
1.    💡 Have an idea – Begin by discussing your idea with the community (for example, on the Lux forum). Early discussion helps refine the idea and gauge community interest, much like how Bitcoin proposals start on mailing lists before formalization .
2.    📝 Draft your LP – Using the template provided (via make new), write a draft of the proposal. This draft should clearly outline the problem, the proposed solution, and technical details.
3.    🔄 Submit a Pull Request – Submit your LP as a pull request to the luxfi/LPs repository. The pull request number will be assigned as the official LP number.
4.    👥 Get reviewed – The LP editors (maintainers of the proposals repository) will review the draft for completeness, correct formatting, and adherence to the guidelines. They may request changes or improvements before acceptance.
5.    🤝 Build consensus – Once the draft is published, the wider community discusses the proposal (on forums, Discord, GitHub discussions, etc.). Feedback is incorporated by the author to address concerns and build rough consensus that the change is worthwhile.
6.    ⏰ Last Call – After consensus emerges, the proposal enters a Last Call status, a final 14-day review period . This gives any remaining stakeholders a chance to raise objections or point out issues. If no major issues arise during this time, the proposal moves forward.
7.    ✅ Final – With successful completion of Last Call, the LP is marked Final. A Final LP signifies the proposal is accepted as a standard and is ready for implementation. At this stage, it should only be updated for minor corrections or clarifications. Implementation (in client code, smart contracts, etc.) can proceed, and the changes defined by the LP become part of the Lux Network.

Throughout this process, the goal is to emulate the best practices of open governance in blockchain communities: transparent discussion, iterative improvement, and broad consensus  . Just as Ethereum’s core updates consist of sets of EIPs that clients must implement to stay in consensus , Lux uses LPs to coordinate network upgrades and standards.

## Types of LPs

Not all proposals are alike. Lux Proposals are categorized by their purpose and scope, similar to the categorization in Ethereum’s EIP process :
- Standards Track: Proposals that involve technical changes affecting the Lux protocol or network on a broad scale. These include:
- Core: Changes to core consensus or network rules (e.g. consensus algorithm modifications or upgrades that require coordination across all nodes).
- Networking: Improvements to peer-to-peer networking, communication protocols, or other network-layer changes.
- Interface: Specifications for client APIs, RPC interfaces, and language-level standards that developers use to interact with Lux.
- LRC (Lux Request for Comments): Application-layer standards, such as token standards and smart contract interfaces (e.g. fungible token specs, NFT standards, naming systems). LRC proposals are analogous to Ethereum’s ERC category, defining how applications and assets operate on Lux .
- Meta: Proposals about the process itself or governance of the Lux ecosystem. Meta LPs do not alter the protocol but rather propose changes to processes, decision-making, or tools (for example, the proposal defining the LP process would be a Meta LP). These typically require community consensus to implement, similar to how Ethereum uses Meta EIPs for process changes .
- Informational: Proposals that provide general guidelines, design recommendations, or other information to the community. These do not propose new features or require adoption; they are simply for disseminating best practices or design philosophies. (The community is free to follow or ignore informational LPs.)

## Tools and Commands

To help manage the LP workflow, this repository provides a Makefile and helper scripts. Common tasks include:

### Create a new LP from the template
make new

### Validate a specific LP (checks formatting, front-matter, etc.)
make validate FILE=LPs/lp-20.md

### Validate all LPs in the repository
make validate-all

### Check all hyperlinks in LP documents for validity
make check-links

### Update the index (INDEX.md) based on current LP files
make update-index

### Show statistics (e.g., counts by status or category)
make stats

### Run all checks (validation, links, etc.) before submitting a PR
make pre-pr

## Managing LP discussions (requires GitHub CLI):

For governance and transparency, each LP can have an associated discussion thread on the Lux forum or GitHub Discussions. The following commands use the GitHub CLI to create and manage proposal discussion posts:

### Create a GitHub Discussion for an LP (in the "LP Discussions" category of the repo)
gh discussion create --repo luxfi/LPs \
  --category "LP Discussions" \
  --title "LP <number>: <Proposal Title>" \
  --body "Discussion for LP-<number>: https://github.com/luxfi/LPs/blob/main/LPs/lp-<number>.md"

### List existing discussion categories (to confirm the category name or ID)
gh api repos/luxfi/LPs/discussions/categories

These tools ensure that proposal authors can easily format their submissions and that reviewers can quickly verify consistency. They are especially useful as the number of proposals grows.

## Development Roadmap

The Lux Network’s evolution is planned in phases, with each phase focusing on a set of milestones and features. This phased development roadmap provides context for many LPs (especially Standards Track proposals targeting specific phases):
- Phase 1 (Q1 2025): Foundational Governance & Core Protocol – Establish governance structures and launch core network functionality (consensus, base chains, native token). LPs in the 0–9 range (core framework and token standard) fall under this phase.
- Phase 2 (Q2 2025): Execution Environment & Asset Standards – Develop the execution layer (e.g. virtual machine support) and introduce asset standards (like LRC-20). This phase includes proposals like VM specifications and token standards.
- Phase 3 (Q3 2025): Cross-Chain Interoperability – Enable seamless interaction between Lux subnets/chains and external chains. Bridge protocols (LPs 15–19) and cross-chain message formats are addressed here.
- Phase 4 (Q4 2025): Attestations & Compliance – Introduce identity attestations, compliance frameworks, and features for regulatory integration. (Expect LPs dealing with identity, KYC/AML frameworks, etc.)
- Phase 5 (Q1 2026): Privacy & Zero-Knowledge – Implement privacy-preserving technology and zero-knowledge proof integrations (such as the Z-Chain and privacy enhancements in transactions).
- Phase 6 (Q2 2026): Data Availability & Scalability – Improve data availability solutions (for off-chain data or rollups) and scale throughput of the network.
- Phase 7 (Q3 2026 and beyond): Application Layer Standards – Focus on higher-level standards for DeFi, DAO governance, and dApp development to enrich the ecosystem (e.g. advanced smart contract standards, financial primitives, etc.).

See the phases/ directory for detailed specifications and design documents for each development phase. Each phase’s completion is marked by the implementation of key LPs associated with that phase.

## Contributing

We warmly welcome community contributions to the Lux Proposal process and the Lux Network in general. To get involved:
- Read the CONTRIBUTING.md guide for general contribution guidelines and tips on how to write a good LP.
- Review LP-0 for the community framework and overall architecture – this provides important context if you plan to propose changes.
- Check GOVERNANCE.md for details on how decisions are made in the Lux community and the formal governance process (off-chain and on-chain governance, voting, etc.).

Whether you want to author a new proposal, improve existing ones, or simply offer feedback, your participation is valuable. All LPs start as ideas from community members – your ideas could shape the future of Lux!

## Resources
- 🌐 Forum: Join the discussion on the Lux Forum – a great place for informal proposal ideas and community Q&A.
- 📚 Documentation: Explore the Lux Network Docs for technical documentation, tutorials, and background on Lux architecture.
- 💬 Discord: Chat with core developers and community members in real-time on Discord.
- 🐦 Twitter: Follow @luxdefi on Twitter for announcements, updates, and highlights of new proposals.

These resources will help you stay informed and get support as you work with Lux and LPs.

## License

All LPs are released under the CC0 1.0 Universal Public Domain Dedication. This means that the proposals are in the public domain – you are free to share and adapt them without restriction. We believe that open standards and protocols best serve the community when they are unencumbered by proprietary restrictions.

⸻


<div align="center">
  <strong>Building the future of decentralized finance, one proposal at a time.</strong>
</div>


Sources:
1.    Bitcoin Magazine – What Is A Bitcoin Improvement Proposal (BIP)?  (illustrating the purpose of BIPs in Bitcoin’s governance).
2.    Crypto.com Glossary – Ethereum Improvement Proposals (EIPs)   (explaining EIPs and their categories, which Lux’s LPs mirror).
3.    Investopedia – What Is ERC-20?   (describing Ethereum’s token standards ERC-20 and ERC-721, analogous to Lux’s LRC-20 and LRC-721 standards).
