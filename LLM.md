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

## Context for All AI Assistants

This file (`LLM.md`) is symlinked as:
- `.AGENTS.md`
- `CLAUDE.md`
- `QWEN.md`
- `GEMINI.md`

All files reference the same knowledge base. Updates here propagate to all AI systems.

## Granite Upgrade - ACP Integration (October 26, 2025)

The Lux Network has adopted three Avalanche Community Proposals (ACPs) as part of the Granite upgrade, significantly enhancing network capabilities:

### LP-181: P-Chain Epoched Views
**Status**: Adopted (Granite Upgrade)  
**Based On**: [ACP-181](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/181-p-chain-epoched-views)  
**File**: `LP-181-epoching.md`

**Purpose**: Optimizes validator set retrievals through epoched P-Chain views

**Key Features**:
- Epochs fix D-Chain (P-Chain) height for predictable validator sets
- Reduces ICM (Inter-Chain Messaging) gas costs significantly
- Improves relayer reliability with predictable validator set windows
- Enables pre-fetching of validator sets at epoch boundaries

**Lux-Specific Enhancements**:
- Integration with 6-chain architecture (A, B, C, D, Y, Z chains)
- Y-Chain quantum checkpoint coordination with epoch boundaries
- Multi-chain validator synchronization

**Implementation**: Cherry-picked from AvalancheGo commit `7b75fa536`  
**Location**: `vms/proposervm/acp181/`

### LP-204: secp256r1 Elliptic Curve Precompile
**Status**: Adopted (Granite Upgrade)  
**Based On**: [ACP-204](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/204-precompile-secp256r1), [RIP-7212](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md)  
**File**: `LP-204-secp256r1.md`

**Purpose**: Native secp256r1 (P-256) signature verification for enterprise/consumer adoption

**Key Features**:
- Precompiled contract at address `0x0000000000000000000000000000000000000100`
- 100x gas reduction: 200k-330k → 3,450 gas per signature verification
- Enables biometric authentication (Face ID, Touch ID, Windows Hello)
- WebAuthn, Passkeys, and device-based signing support

**Use Cases**:
- Biometric wallets with device-backed security
- Enterprise SSO integration without custom key management
- WebAuthn/Passkeys for DeFi applications
- Cross-chain identity across Lux multi-chain ecosystem

**Quantum Transition**: Bridge to post-quantum signatures (LP-001, LP-002, LP-003)  
**Compliance**: NIST FIPS 186-3 approved

**Implementation**: To be integrated from RIP-7212 reference implementations  
**Location**: `vm/precompiles/secp256r1.go` (C-Chain)

### LP-226: Dynamic Minimum Block Times
**Status**: Adopted (Granite Upgrade)  
**Based On**: [ACP-226](https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/226-dynamic-minimum-block-times)  
**File**: `LP-226-dynamic-block-timing.md`

**Purpose**: Replace static block gas cost with validator-controlled dynamic block timing

**Key Features**:
- Millisecond-granularity timestamps via `timestampMilliseconds` field
- Dynamic minimum block delay: $m = M \cdot e^{\frac{q}{D}}$
- Validators collectively adjust block timing without network upgrades
- Sub-second block times possible (100ms minimum)

**C-Chain Parameters**:
- $M = 100ms$ (global minimum)
- $q = 3,141,253$ (initial excess, results in ~2s blocks)
- $D = 1,048,576$ (update constant)
- $Q = 200$ (max change per block)

**Benefits**:
- Sub-second blocks for competitive DeFi UX
- Adaptive performance tuning based on network conditions
- Per-chain optimization for A, B, C, D, Y, Z chain workloads
- Network stability through explicit minimum delay enforcement

**Implementation**: Cherry-picked from AvalancheGo commits `8aa4f1e25` and `24aa89019`  
**Location**: `vms/evm/acp226/`

### Granite Upgrade Summary

**Combined Impact**:
1. **Performance**: Sub-second blocks + optimized ICM = high-throughput cross-chain operations
2. **UX**: Biometric wallets + fast blocks = enterprise-grade user experience
3. **Security**: Epoching + secp256r1 + quantum-safe bridge to LP-001/002/003
4. **Adaptability**: Dynamic timing + epoching = flexible, self-optimizing network

**Integration with Existing LPs**:
- **LP-001/002/003**: Quantum transition path from secp256r1
- **LP-600**: Snowman consensus coordination with epoching
- **LP-601**: Gas fees work alongside dynamic block timing
- **LP-605**: Validator management enhanced by epoching
- **LP-700**: Quasar consensus benefits from all three ACPs

**Upstream Tracking**:
- Avalanche upstream: v1.13.5 + 117 commits
- ACPs implemented in AvalancheGo master branch
- Compatible with ProposerVM and consensus layers

**Cherry-Pick Status for lux/node**:

| ACP | Upstream Commit(s) | Status | Files |
|-----|-------------------|--------|-------|
| ACP-181 | `7b75fa536` | Pending | `vms/proposervm/acp181/` |
| ACP-204 | TBD (implement from spec) | Pending | `vm/precompiles/secp256r1.go` |
| ACP-226 | `8aa4f1e25`, `24aa89019` | Pending | `vms/evm/acp226/` |

**Testing Requirements**:
- E2E tests for epoch boundary transitions
- Gas benchmarks for secp256r1 precompile
- Block timing convergence simulations
- Cross-chain ICM with epoching
- Biometric wallet integration tests

**Activation Timeline**:
- Specification: Complete (LP-181, LP-204, LP-226)
- Implementation: Cherry-pick from upstream
- Testing: Network-wide validation
- Deployment: Coordinated Granite upgrade

### Next Steps for Integration

1. **Cherry-Pick Implementations**:
   ```bash
   cd ~/work/lux/node
   git cherry-pick 7b75fa536  # ACP-181
   git cherry-pick 8aa4f1e25  # ACP-226 math
   git cherry-pick 24aa89019  # ACP-226 initial delay
   ```

2. **Implement secp256r1 Precompile**:
   - Use RIP-7212 reference implementation
   - Integrate with coreth precompile registry
   - Add unit and integration tests

3. **Test Granite Features**:
   - Deploy to Lux testnet
   - Validate epoch transitions
   - Benchmark secp256r1 gas costs
   - Measure block timing convergence

4. **Documentation**:
   - Update node README with Granite features
   - Create developer guides for biometric wallets
   - Document epoch-aware ICM patterns
   - Publish migration guide for applications

## Rules for AI Assistants

1. **ALWAYS** update LLM.md with significant discoveries
2. **NEVER** commit symlinked files (.AGENTS.md, CLAUDE.md, etc.) - they're in .gitignore
3. **NEVER** create random summary files - update THIS file

## Lux-Specific Proposals (LP vs ACP)

**IMPORTANT**: Lux Network uses "LP" (Lux Proposal) prefix, NOT "ACP" (Avalanche Community Proposal).

While we adopt specifications from Avalanche ACPs, all implementations in Lux use LP naming:

### Adopted and Renamed

| Avalanche ACP | Lux LP | Package Name | Status |
|---------------|--------|--------------|--------|
| ACP-176 | LP-176 | `lp176` | Implemented |
| ACP-226 | LP-226 | `lp226` | Implemented |
| Cortina | LP-118 | `lp118` | Implemented |
| ACP-181 | LP-181 | (uses acp181) | Implemented |
| ACP-204 | LP-204 | (secp256r1) | Implemented |

### Implementation Locations

**LP-176: Dynamic Gas Pricing**
- **Spec**: `~/work/lux/lps/LP-176-dynamic-gas-pricing.md`
- **Implementation**: 
  - `/Users/z/work/lux/node/vms/evm/lp176/` (core logic)
  - `/Users/z/work/lux/geth/plugin/evm/upgrade/lp176/` (plugin params)
- **Package**: `github.com/luxfi/geth/plugin/evm/upgrade/lp176`

**LP-118: Subnet-EVM Compatibility**
- **Spec**: `~/work/lux/lps/LP-118-subnetevm-compat.md`
- **Implementation**: 
  - `/Users/z/work/lux/geth/plugin/evm/upgrade/lp118/` (plugin params)
- **Package**: `github.com/luxfi/geth/plugin/evm/upgrade/lp118`
- **Note**: Replaces "Cortina" naming

**LP-226: Dynamic Block Timing**
- **Spec**: `~/work/lux/lps/LP-226-dynamic-block-timing.md`
- **Implementation**: `/Users/z/work/lux/node/vms/evm/lp226/`
- **Package**: `github.com/luxfi/node/vms/evm/lp226`

**LP-181: Epoching**
- **Spec**: `~/work/lux/lps/LP-181-epoching.md`
- **Implementation**: `/Users/z/work/lux/node/vms/proposervm/acp181/`
- **Package**: `github.com/luxfi/node/vms/proposervm/acp181`
- **Note**: Kept ACP naming in code for upstream compatibility

**LP-204: secp256r1 Precompile**
- **Spec**: `~/work/lux/lps/LP-204-secp256r1.md`
- **Implementation**: `/Users/z/work/lux/geth/core/vm/contracts.go`
- **Address**: `0x0000000000000000000000000000000000000100`

### Naming Convention Guidelines

When implementing Lux proposals:

1. **Specifications**: Always use `LP-NNN` format in documentation
2. **Go Packages**: Use `lpNNN` (e.g., `lp176`, `lp118`, `lp226`)
3. **File Names**: Use `lp_nnn` or `lpNNN` consistently
4. **Comments**: Reference both LP and upstream ACP for clarity
5. **Imports**: `"github.com/luxfi/geth/plugin/evm/upgrade/lp176"`

**Example**:
```go
// LP-176: Dynamic EVM Gas Limit and Price Discovery
// Based on Avalanche ACP-176, adapted for Lux Network
//
// See: ~/work/lux/lps/LP-176-dynamic-gas-pricing.md
package lp176
```

### Migration from ACP References

If you encounter code using ACP names:
1. Rename package directories: `acp176` → `lp176`
2. Update package declarations: `package acp176` → `package lp176`
3. Update imports in consuming code
4. Update documentation references
5. Keep comments referencing upstream ACP for traceability

**DO NOT** use ACP prefixes in Lux codebase except for:
- Historical context in comments
- References to upstream Avalanche documentation
- Explaining relationship to upstream proposals

