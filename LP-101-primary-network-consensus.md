---
lp: 101
title: Primary Network Consensus — P+Q Architecture
tags: [consensus, primary-network, quantum, p-chain, q-chain, l1, l2]
description: Only P-Chain and Q-Chain are required for the primary network. All other chains are optional L1s.
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Core
created: 2026-04-09
requires:
  - chain: P
  - chain: Q
references:
  - lp-0002 (Network Architecture)
  - lp-0004 (Philosophy)
---

# LP-006: Primary Network Consensus — P+Q Architecture

## Abstract

The Lux primary network requires only two chains: P-Chain (validator management, staking) and Q-Chain (quantum-safe consensus finality). All other chains — C, X, Z, T, B, D, A — are optional and run as independent L1 chains that validators opt into.

## Motivation

The original architecture required every validator to run P, C, and X chains. This imposed unnecessary resource overhead and coupled unrelated workloads. A validator running a securities exchange L2 has no need for the general-purpose C-Chain EVM.

### Design Principles

1. **Minimal primary network**: Only consensus infrastructure is mandatory
2. **Validator choice**: Operators decide which L1 chains to validate
3. **Quantum-first**: Q-Chain provides post-quantum finality as a core network property
4. **L2 sovereignty**: L2 chains inherit P+Q security without running other primary chains

## Specification

### Primary Network (Required)

| Chain | Purpose | Why Required |
|-------|---------|--------------|
| **P-Chain** | Validator management, staking, chain network creation | Coordination layer — all validators must agree on the validator set |
| **Q-Chain** | Quantum-safe consensus finality (BLS + post-quantum signatures) | Security layer — provides quantum-resistant finality for all chains |

P-Chain is always critical. Q-Chain is critical by default but can be disabled for networks that do not require post-quantum security (e.g., testnets).

### Optional L1 Chains

All other chains run as independent L1 chain networks. Their failure to initialize does NOT crash the node — it logs a warning and continues.

| Chain | Purpose | Opt-In |
|-------|---------|--------|
| C-Chain | General-purpose EVM | Legacy compatibility |
| X-Chain | High-throughput asset transfers (DAG) | UTXO-based transfers |
| D-Chain | Native DEX (CLOB + AMM) | Trading infrastructure |
| Z-Chain | Zero-knowledge proofs | Privacy applications |
| T-Chain | Threshold cryptography (MPC, FHE) | Key management, encryption |
| B-Chain | Cross-network bridge | Asset bridging |
| A-Chain | Attestation, AI verification | Proof-of-inference |
| Q-Chain | Quantum consensus | Post-quantum finality |

### L2 Chains

L2 chains (like Liquidity) are sovereign chain networks created via `platform.createChainTx`. They inherit the security of P+Q consensus without requiring validators to run any other primary chain.

An L2 requires:
- **P-Chain**: For validator set coordination and chain network management
- **Q-Chain**: Optional — for quantum-safe finality on the L2

An L2 does NOT require:
- C-Chain, X-Chain, or any other primary chain

### L1 Chains

Independent L1 chains that register their own validator sets. They use the Lux consensus framework but manage their own security.

An L1 requires:
- **Q-Chain**: Optional — for quantum-safe consensus on the L1's own validator set

An L1 does NOT require:
- P-Chain (uses its own validator management)
- Any other primary chain

### Node Behavior

When a node starts:

1. P-Chain initializes first (always critical)
2. Q-Chain initializes second (critical by default)
3. All other genesis chains attempt initialization
4. If a non-critical chain fails → log warning, continue
5. Node is healthy when P-Chain (and Q-Chain if enabled) are bootstrapped

### Validator Tracking

Validators declare which L1 chain networks they track:

```
--track-chains=<chainID1>,<chainID2>,...
--track-chains=all
```

The `--track-chains=all` flag tracks every chain the node discovers. Without this flag, the node only validates chains it explicitly opts into.

## Rationale

### Why P is always required

The P-Chain IS the primary network. Without it, there is no validator set, no staking, no chain creation. Every node that participates in the Lux network must validate the P-Chain.

### Why Q is required by default

Post-quantum security is a network-wide property, not a per-chain feature. If validators can opt out of Q-Chain, the quantum finality guarantee degrades. Making Q-Chain critical by default ensures the network maintains its post-quantum security posture.

### Why C/X are NOT required

The C-Chain and X-Chain are application-layer chains, not consensus infrastructure. A validator running a securities exchange L2 has no need for the general-purpose C-Chain EVM or the X-Chain DAG transfer engine. Requiring them wastes resources and increases attack surface.

## Backwards Compatibility

Existing deployments that depend on C-Chain or X-Chain availability should use `--track-chains=all` to ensure all primary chains are created. The default behavior change only affects which chain failures are fatal.

## Security Considerations

- P-Chain compromise = full network compromise (validator set is corrupted)
- Q-Chain compromise = loss of quantum finality (classical finality still holds via BLS)
- C/X/Z/T/B/D compromise = isolated to that chain's state and users

## Implementation

Reference: `luxfi/node@bc311b74` — `node/node.go` hardcodes P+Q as critical chains. `chains/manager.go` logs warnings for non-critical chain failures instead of shutting down.

## Copyright

Copyright and related rights waived via CC0.
