---
lp: 004
title: Formal Verification Framework
tags: [formal-verification, lean4, halmos, security, proofs, consensus]
description: Machine-checked proofs of consensus safety, liveness, and smart contract invariants
author: Woo Bin (@luxfi)
status: Final
type: Standards Track
category: Security
created: 2024-06-01
---

# LP-004: Formal Verification Framework for Lux Consensus and Contracts

## Abstract

This proposal documents the formal verification framework for the Lux blockchain, covering both consensus protocol proofs (Lean 4 with Mathlib) and smart contract invariants (Halmos symbolic execution). A total of **33 Lean 4 theorems** and **68 Halmos symbolic proofs** have been verified.

## Motivation

Formal verification provides the highest level of assurance for blockchain protocols and smart contracts. As Lux manages significant value across DeFi, bridge, and governance systems, machine-checked proofs of correctness are essential for:

1. Consensus safety — no two honest validators decide differently
2. Consensus liveness — all honest validators eventually decide
3. BFT guarantees — quorum intersection and honest majority
4. Smart contract invariants — no value extraction, inflation protection, solvency

## Specification

### Lean 4 Consensus Proofs

**Repository**: [github.com/luxfi/formal](https://github.com/luxfi/formal)
**Tool**: Lean 4 v4.14.0 with Mathlib v4.14.0

#### Protocol Coverage

| Protocol | File | Theorems | Status |
|----------|------|----------|--------|
| Wave | `Protocol/Wave.lean` | 3 | Proved |
| Flare | `Protocol/Flare.lean` | 3 | Proved |
| Quasar | `Protocol/Quasar.lean` | 3 | Proved |
| Ray | `Protocol/Ray.lean` | 3 | 2 proved |
| Field | `Protocol/Field.lean` | 2 | Proved |
| Nova | `Protocol/Nova.lean` | 2 | Proved |
| Nebula | `Protocol/Nebula.lean` | 2 | Proved |
| Photon | `Protocol/Photon.lean` | 2 | Proved |
| Prism | `Protocol/Prism.lean` | 2 | Proved |

#### Core Theorems

- **Safety**: If any honest validator decides v, no honest validator decides v' != v
- **Liveness**: Eventually all honest validators decide (under partial synchrony)
- **BFT**: Quorum intersection, honest majority, unique finalization
- **Warp**: Exactly-once delivery, monotonic nonces

#### Cryptographic Axioms

- BLS bilinearity and aggregate soundness (proved)
- FROST threshold signature unforgeability
- Ringtail post-quantum threshold signatures
- ML-DSA FIPS 204 post-quantum signatures

### Halmos Symbolic Proofs

**Location**: `test/halmos/` in [github.com/luxfi/standard](https://github.com/luxfi/standard)
**Tool**: Halmos symbolic execution

| Contract | Proofs | Key Properties |
|----------|--------|----------------|
| AMM V2 | 12 | Constant product, no-drain, output bounds |
| LiquidLUX (xLUX) | 9 | Share/asset monotonicity, inflation protection |
| Markets (Lending) | 8 | Utilization bounds, interest monotonicity |
| Transmuter | 15 | Earmark conservation, solvency |
| L* Tokens | 15 | Bridge safety, deposit/withdraw round-trip |
| Other | 9 | Fee bounds, governance |

### Foundry Invariant Tests

33 property-based fuzz test suites covering AMM, LiquidLUX, Markets, Perps, StableSwap, Staking, Karma, Bridge, Governance, Treasury.

## Rationale

- **Lean 4** for consensus: expressive dependent type theory, Mathlib library for number theory and algebra
- **Halmos** for Solidity: symbolic execution on EVM bytecode, Z3/Bitwuzla SMT solving
- **Foundry invariants** for stateful fuzzing: complements symbolic with random exploration

## Security Considerations

Formal verification provides strong guarantees within the model. Limitations:
- Lean proofs verify protocol logic, not Go implementation directly
- Halmos operates on compiled EVM bytecode (faithful to deployment)
- SMT timeouts on nonlinear bitvector arithmetic (addressed via algebraic decomposition)

## References

- [Lux Consensus Paper](https://papers.lux.network/lux-consensus.pdf)
- [Lux Bridge Paper](https://papers.lux.network/lux-bridge.pdf)
- [2026-03-25 Security Audit](https://audits.lux.network/2026-03-25)
- [Formal Proofs Repository](https://github.com/luxfi/formal)

## Author

Woo Bin, Lux Network — formal verification and security audit work conducted March 2026.
