# Lux Proposals (LPs)

Lux Proposals (LPs) are the primary mechanism for proposing new features, gathering community input, and documenting design decisions for the [Lux Network](https://lux.network). This process ensures that changes to the network are transparently reviewed and achieve community consensus before implementation – much like Bitcoin’s BIPs and Ethereum’s EIPs, which allow anyone to propose and debate protocol improvements ￼ ￼.

## What is an LP?

A Lux Proposal (LP) is a design document that provides information to the Lux community about a proposed change to the system. LPs serve as the formal pathway to introduce improvements and build agreement on their adoption. They are used for:
	•	Proposing new features or standards – outlining technical specs for enhancements.
	•	Collecting community input – soliciting feedback and technical review from the community.
	•	Documenting design decisions – recording the rationale behind changes.

By using LPs, the Lux community can coordinate development in a decentralized manner, similar to the improvement proposal frameworks of other blockchains ￼. Every network upgrade or standard in Lux originates from an LP, ensuring an open governance process.

## Quick Start
	•	📖 New to LPs? Begin with LP-0, which provides an overview of the Lux Network architecture and the community contribution framework.
	•	🚀 Create a new LP: Use the provided template by running make new (this invokes the ./scripts/new-lp.sh script) to scaffold a proposal draft.
	•	📋 View all LPs: See INDEX.md for a complete list of proposals and their details.
	•	🔍 Check status: See STATUS.md for the current status of each LP (Draft, Final, etc.).

## LP Index

Below is an index of all Lux Proposals, grouped by topic area:

### Foundation & Governance (LPs 0–9)

#### LP	Title	Status	Type

0	Lux Network Architecture & Community Framework	Final	Meta
1	Native LUX Token Standard	Final	Standards Track
2	Liquidity Pool Standard	Draft	Standards Track
3	LX Exchange Protocol	Draft	Standards Track
4	Core Consensus & Node Architecture	Draft	Standards Track
5	Simplex Consensus Mechanism	Draft	Standards Track
6	Network Runner & Testing Framework	Draft	Standards Track
7	VM SDK Specification	Draft	Standards Track
8	Plugin Architecture	Draft	Standards Track
9	CLI Tool Specification	Draft	Standards Track

### Chain Specifications (LPs 10–14)

#### LP	Title	Status	Type
10	P-Chain (Platform Chain) Specification	Draft	Standards Track
11	X-Chain (Exchange Chain) Specification	Draft	Standards Track
12	C-Chain (Contract Chain) Specification	Draft	Standards Track
13	M-Chain (MPC Bridge Chain) Specification	Draft	Standards Track
14	Z-Chain (Zero-Knowledge Chain) Specification	Draft	Standards Track

### Bridge & Cross-Chain (LPs 15–19)

#### LP	Title	Status	Type
15	MPC Bridge Protocol	Draft	Standards Track
16	Teleport Cross-Chain Protocol	Draft	Standards Track
17	Bridge Asset Registry	Draft	Standards Track
18	Cross-Chain Message Format	Draft	Standards Track
19	Bridge Security Framework	Draft	Standards Track

### Token Standards (LPs 20–39)

#### LP	Title	Status	Type
20	LRC-20 Fungible Token Standard	Final	Standards Track

### Network Standards (LPs 40+)

LP	Title	Status	Type
40	Wallet Standards	Draft	Standards Track
50	Developer Tools	Draft	Standards Track
60	DeFi Protocols	Draft	Standards Track
80	Infrastructure & Operations	Draft	Standards Track
90	Research & Future	Draft	Standards Track
721	LRC-721 Non-Fungible Token Standard	Final	Standards Track
1155	LRC-1155 Multi-Token Standard	Final	Standards Track

Note: The LRC-20, LRC-721, and LRC-1155 proposals define Lux’s token standards. These correspond to the well-known Ethereum token standards ERC-20 (fungible tokens) and ERC-721/1155 (non-fungible and multi-token standards) ￼ ￼, adapted for the Lux Network.

## LP Process

To ensure each proposal is thoroughly vetted and agreed upon, Lux Proposals follow a structured process:
	1.	💡 Have an idea – Begin by discussing your idea with the community (for example, on the Lux forum). Early discussion helps refine the idea and gauge community interest, much like how Bitcoin proposals start on mailing lists before formalization ￼.
	2.	📝 Draft your LP – Using the template provided (via make new), write a draft of the proposal. This draft should clearly outline the problem, the proposed solution, and technical details.
	3.	🔄 Submit a Pull Request – Submit your LP as a pull request to the luxfi/LPs repository. The pull request number will be assigned as the official LP number.
	4.	👥 Get reviewed – The LP editors (maintainers of the proposals repository) will review the draft for completeness, correct formatting, and adherence to the guidelines. They may request changes or improvements before acceptance.
	5.	🤝 Build consensus – Once the draft is published, the wider community discusses the proposal (on forums, Discord, GitHub discussions, etc.). Feedback is incorporated by the author to address concerns and build rough consensus that the change is worthwhile.
	6.	⏰ Last Call – After consensus emerges, the proposal enters a Last Call status, a final 14-day review period ￼. This gives any remaining stakeholders a chance to raise objections or point out issues. If no major issues arise during this time, the proposal moves forward.
	7.	✅ Final – With successful completion of Last Call, the LP is marked Final. A Final LP signifies the proposal is accepted as a standard and is ready for implementation. At this stage, it should only be updated for minor corrections or clarifications. Implementation (in client code, smart contracts, etc.) can proceed, and the changes defined by the LP become part of the Lux Network.

Throughout this process, the goal is to emulate the best practices of open governance in blockchain communities: transparent discussion, iterative improvement, and broad consensus ￼ ￼. Just as Ethereum’s core updates consist of sets of EIPs that clients must implement to stay in consensus ￼, Lux uses LPs to coordinate network upgrades and standards.

## Types of LPs

Not all proposals are alike. Lux Proposals are categorized by their purpose and scope, similar to the categorization in Ethereum’s EIP process ￼:
	•	Standards Track: Proposals that involve technical changes affecting the Lux protocol or network on a broad scale. These include:
	•	Core: Changes to core consensus or network rules (e.g. consensus algorithm modifications or upgrades that require coordination across all nodes).
	•	Networking: Improvements to peer-to-peer networking, communication protocols, or other network-layer changes.
	•	Interface: Specifications for client APIs, RPC interfaces, and language-level standards that developers use to interact with Lux.
	•	LRC (Lux Request for Comments): Application-layer standards, such as token standards and smart contract interfaces (e.g. fungible token specs, NFT standards, naming systems). LRC proposals are analogous to Ethereum’s ERC category, defining how applications and assets operate on Lux ￼.
	•	Meta: Proposals about the process itself or governance of the Lux ecosystem. Meta LPs do not alter the protocol but rather propose changes to processes, decision-making, or tools (for example, the proposal defining the LP process would be a Meta LP). These typically require community consensus to implement, similar to how Ethereum uses Meta EIPs for process changes ￼.
	•	Informational: Proposals that provide general guidelines, design recommendations, or other information to the community. These do not propose new features or require adoption; they are simply for disseminating best practices or design philosophies. (The community is free to follow or ignore informational LPs.)

## Tools and Commands

To help manage the LP workflow, this repository provides a Makefile and helper scripts. Common tasks include:

# Create a new LP from the template
make new

# Validate a specific LP (checks formatting, front-matter, etc.)
make validate FILE=LPs/lp-20.md

# Validate all LPs in the repository
make validate-all

# Check all hyperlinks in LP documents for validity
make check-links

# Update the index (INDEX.md) based on current LP files
make update-index

# Show statistics (e.g., counts by status or category)
make stats

# Run all checks (validation, links, etc.) before submitting a PR
make pre-pr

## Managing LP discussions (requires GitHub CLI):

For governance and transparency, each LP can have an associated discussion thread on the Lux forum or GitHub Discussions. The following commands use the GitHub CLI to create and manage proposal discussion posts:

# Create a GitHub Discussion for an LP (in the "LP Discussions" category of the repo)
gh discussion create --repo luxfi/LPs \
  --category "LP Discussions" \
  --title "LP <number>: <Proposal Title>" \
  --body "Discussion for LP-<number>: https://github.com/luxfi/LPs/blob/main/LPs/lp-<number>.md"

# List existing discussion categories (to confirm the category name or ID)
gh api repos/luxfi/LPs/discussions/categories

These tools ensure that proposal authors can easily format their submissions and that reviewers can quickly verify consistency. They are especially useful as the number of proposals grows.

## Development Roadmap

The Lux Network’s evolution is planned in phases, with each phase focusing on a set of milestones and features. This phased development roadmap provides context for many LPs (especially Standards Track proposals targeting specific phases):
	•	Phase 1 (Q1 2025): Foundational Governance & Core Protocol – Establish governance structures and launch core network functionality (consensus, base chains, native token). LPs in the 0–9 range (core framework and token standard) fall under this phase.
	•	Phase 2 (Q2 2025): Execution Environment & Asset Standards – Develop the execution layer (e.g. virtual machine support) and introduce asset standards (like LRC-20). This phase includes proposals like VM specifications and token standards.
	•	Phase 3 (Q3 2025): Cross-Chain Interoperability – Enable seamless interaction between Lux subnets/chains and external chains. Bridge protocols (LPs 15–19) and cross-chain message formats are addressed here.
	•	Phase 4 (Q4 2025): Attestations & Compliance – Introduce identity attestations, compliance frameworks, and features for regulatory integration. (Expect LPs dealing with identity, KYC/AML frameworks, etc.)
	•	Phase 5 (Q1 2026): Privacy & Zero-Knowledge – Implement privacy-preserving technology and zero-knowledge proof integrations (such as the Z-Chain and privacy enhancements in transactions).
	•	Phase 6 (Q2 2026): Data Availability & Scalability – Improve data availability solutions (for off-chain data or rollups) and scale throughput of the network.
	•	Phase 7 (Q3 2026 and beyond): Application Layer Standards – Focus on higher-level standards for DeFi, DAO governance, and dApp development to enrich the ecosystem (e.g. advanced smart contract standards, financial primitives, etc.).

See the phases/ directory for detailed specifications and design documents for each development phase. Each phase’s completion is marked by the implementation of key LPs associated with that phase.

## Contributing

We warmly welcome community contributions to the Lux Proposal process and the Lux Network in general. To get involved:
	•	Read the CONTRIBUTING.md guide for general contribution guidelines and tips on how to write a good LP.
	•	Review LP-0 for the community framework and overall architecture – this provides important context if you plan to propose changes.
	•	Check GOVERNANCE.md for details on how decisions are made in the Lux community and the formal governance process (off-chain and on-chain governance, voting, etc.).

Whether you want to author a new proposal, improve existing ones, or simply offer feedback, your participation is valuable. All LPs start as ideas from community members – your ideas could shape the future of Lux!

## Resources
	•	🌐 Forum: Join the discussion on the Lux Forum – a great place for informal proposal ideas and community Q&A.
	•	📚 Documentation: Explore the Lux Network Docs for technical documentation, tutorials, and background on Lux architecture.
	•	💬 Discord: Chat with core developers and community members in real-time on Discord.
	•	🐦 Twitter: Follow @luxdefi on Twitter for announcements, updates, and highlights of new proposals.

These resources will help you stay informed and get support as you work with Lux and LPs.

## License

All LPs are released under the CC0 1.0 Universal Public Domain Dedication. This means that the proposals are in the public domain – you are free to share and adapt them without restriction. We believe that open standards and protocols best serve the community when they are unencumbered by proprietary restrictions.

⸻


<div align="center">
  <strong>Building the future of decentralized finance, one proposal at a time.</strong>
</div>


Sources:
	1.	Bitcoin Magazine – What Is A Bitcoin Improvement Proposal (BIP)? ￼ (illustrating the purpose of BIPs in Bitcoin’s governance).
	2.	Crypto.com Glossary – Ethereum Improvement Proposals (EIPs) ￼ ￼ (explaining EIPs and their categories, which Lux’s LPs mirror).
	3.	Investopedia – What Is ERC-20? ￼ ￼ (describing Ethereum’s token standards ERC-20 and ERC-721, analogous to Lux’s LRC-20 and LRC-721 standards).
