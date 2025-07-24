# LP/LRC Number Allocation Guide

This document provides guidelines for allocating LP numbers and understanding the numbering system for Lux Improvement Proposals and Lux Request for Comments.

## Overview

The LP numbering system is designed to be clear, organized, and compatible with existing blockchain standards while maintaining Lux Network's unique identity.

## Number Ranges and Categories

### Core Protocol Standards (1-99)
Reserved for fundamental protocol changes and governance.

| Range | Category | Description |
|-------|----------|-------------|
| 1-9 | Meta/Governance | LP process, DAO governance |
| 10-19 | Consensus | Consensus mechanisms, validators |
| 20-29 | Core Protocol | Block structure, transactions |
| 30-39 | Networking | P2P, message propagation |
| 40-49 | Cross-chain | Bridges, interoperability |
| 50-59 | Privacy | Zero-knowledge, private transactions |
| 60-69 | Scalability | Sharding, state management |
| 70-79 | Security | Cryptography, signatures |
| 80-89 | Economics | Fee structures, tokenomics |
| 90-99 | Reserved | Future core extensions |

### Application Standards - LRC Series (100-9999)
Standards for application-level implementations.

| Range | Category | Description | Ethereum Equivalent |
|-------|----------|-------------|-------------------|
| 100-199 | Core Interfaces | Basic standards | - |
| 200-299 | Token Standards | Fungible tokens | ERC-20 range |
| 300-399 | NFT Standards | Non-fungible tokens | ERC-721 range |
| 400-499 | Multi-token | Hybrid standards | ERC-1155 range |
| 500-599 | DeFi Primitives | Financial standards | Various ERCs |
| 600-699 | Identity/Social | Identity, claims | ERC-735 range |
| 700-799 | Gaming | Game assets, logic | - |
| 800-899 | Infrastructure | Wallets, accounts | ERC-4337 range |
| 900-999 | Experimental | New concepts | - |
| 1000+ | Open Allocation | Future standards | - |

### Special Number Mappings

To maintain compatibility and developer familiarity, certain LP numbers map directly to well-known Ethereum standards:

| LP Number | LRC Name | Ethereum Equivalent | Status |
|------------|----------|-------------------|---------|
| 165 | LRC-165 | ERC-165 | Final |
| 20 | LRC-20 | ERC-20 | Final |
| 721 | LRC-721 | ERC-721 | Final |
| 1155 | LRC-1155 | ERC-1155 | Final |
| 2612 | LRC-2612 | ERC-2612 | Final |
| 3156 | LRC-3156 | ERC-3156 | Final |
| 3525 | LRC-3525 | ERC-3525 | Draft |
| 4337 | LRC-4337 | ERC-4337 | Draft |
| 4626 | LRC-4626 | ERC-4626 | Final |
| 5192 | LRC-5192 | ERC-5192 | Final |
| 6551 | LRC-6551 | ERC-6551 | Draft |

## Allocation Process

### 1. Check Existing Allocations
Before requesting a number, check:
- [Current LPs](./LPs/) directory
- [Roadmap](./ROADMAP.md) for planned allocations
- GitHub issues for pending requests

### 2. Number Request Process

#### For Core Standards (1-99)
1. Must demonstrate core protocol impact
2. Requires technical committee review
3. Sequential allocation preferred

#### For LRC Standards (100+)
1. **Direct Mapping**: If porting an ERC, use the same number
2. **New Standards**: Use next available in category range
3. **Special Request**: Justify specific number need

### 3. Submission Format
```yaml
---
lip: [number]
title: [title]
category: [Core|Networking|Interface|LRC]
status: Draft
---
```

## Guidelines

### DO:
- ✅ Use Ethereum-equivalent numbers for ported standards
- ✅ Keep related standards in nearby numbers
- ✅ Reserve numbers for planned series (e.g., 100-105 for a suite)
- ✅ Document number choice rationale in LP

### DON'T:
- ❌ Skip numbers without reason
- ❌ Use numbers outside designated ranges
- ❌ Change numbers after initial allocation
- ❌ Create duplicate numbers

## Special Cases

### Suite Allocations
For related standards, block allocation is allowed:
```
Example: DeFi Suite
- LP-500: DeFi Primitive Base
- LP-501: Liquidity Pool Standard
- LP-502: Yield Aggregator Standard
- LP-503: Flash Loan Extension
- LP-504: Automated Market Maker
- LP-505: Reserved for suite expansion
```

### Cross-Chain Standards
When creating Lux-specific versions of multi-chain standards:
```
Original: UNI-V2 (Uniswap)
Lux Version: LP-550 (LRC-550 AMM Standard)
Note: Reference original in specification
```

### Emergency Allocations
For critical security or protocol fixes:
- May use next available number
- Mark as "Emergency" in status
- Fast-track review process

## Number Lifecycle

### 1. **Allocation**
- Number assigned when PR opened
- Recorded in allocation registry

### 2. **Active Development**
- Number reserved during draft/review
- Cannot be reassigned

### 3. **Final/Withdrawn**
- Final: Number permanently allocated
- Withdrawn: Number may be reused after 6 months

### 4. **Deprecation**
- Number remains allocated
- Status changes to "Deprecated"
- Replacement LP referenced

## Registry Maintenance

### Allocation Registry Format
```json
{
  "lip": 42,
  "title": "State Rent Mechanism",
  "category": "Core",
  "status": "Draft",
  "author": "address/name",
  "created": "2025-07-19",
  "ethereum_equivalent": null,
  "notes": "Critical for scalability"
}
```

### Monthly Review
- Update allocation registry
- Identify gaps in numbering
- Plan future allocations
- Clean up withdrawn numbers

## Examples

### Example 1: New Token Standard
```
Need: Create a new semi-fungible token standard
Check: No existing Ethereum equivalent
Range: 300-399 (NFT standards)
Allocation: LP-325 (next available in range)
```

### Example 2: Porting ERC Standard
```
Need: Port ERC-2981 (NFT Royalty Standard)
Check: Not yet allocated
Action: Allocate LP-2981 to maintain compatibility
Category: LRC (application standard)
```

### Example 3: Protocol Upgrade
```
Need: Consensus mechanism improvement
Range: 10-19 (Consensus)
Allocation: LP-15 (if 10-14 taken)
Review: Technical committee required
```

## Conflict Resolution

If number conflicts arise:
1. **First Come**: Earlier PR gets preference
2. **Compatibility**: Ethereum-equivalent takes precedence
3. **Committee**: Technical committee decides
4. **Alternative**: Suggest nearby number

## Future Considerations

### Number Exhaustion
If a range approaches capacity:
1. Expand range in next major version
2. Create sub-categories with decimals
3. Consider 5-digit numbers for LRCs

### Version 2.0
Future major protocol upgrade may:
- Introduce new number ranges
- Reorganize categories
- Maintain v1 compatibility

## Quick Reference

### Available Ranges (as of Jan 2025)
- Core: 10-19, 80-89 have availability
- LRC Tokens: 200-299 mostly available
- LRC NFTs: 300-399 mostly available
- DeFi: 500-599 open for allocation
- Gaming: 700-799 completely open
- Experimental: 900-999 open

### Next Available Numbers
- Core Protocol: 13
- Token Standard: 201
- NFT Standard: 301
- DeFi Primitive: 500
- Identity: 600
- Gaming: 700

## Contact

For number allocation questions:
- GitHub: Open issue with "number-allocation" label
- Discord: #lip-authors channel
- Email: lps@lux.network

---

*This document is maintained by the LP Editors and updated monthly*