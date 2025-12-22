---
lp: 4
title: Open Source Philosophy
description: Lux's commitment to open source development, forking strategy, and software sovereignty
author: Lux Core Team
status: Final
type: Meta
created: 2025-12-21
tags: [network, core, philosophy, open-source, sovereignty, principles]
order: 3
tier: core
---

# LP-0004: Open Source Philosophy

## Abstract

Lux Network is built on a foundation of open source principles and software sovereignty. This document articulates our philosophy of strategic forking, explains why we maintain complete control over critical dependencies, and establishes the guiding principles for our open source strategy.

For implementation details, metrics, and verification procedures, see [LP-5: Supply Chain Control](./lp-0005-supply-chain-control.md).

---

## Motivation

Blockchain infrastructure requires an unprecedented level of trust. Users entrust their assets, validators stake their reputation, and applications build on our foundation. This trust cannot be outsourced to third parties.

The open source movement provides transparency, but transparency alone is insufficient. We must also maintain:

- **Sovereignty**: The ability to ship features without upstream approval
- **Security**: Immediate response to vulnerabilities, not waiting for upstream fixes
- **Performance**: Optimizations tailored to our specific use cases
- **Simplicity**: Removal of code paths we don't need

---

## Specification

### Core Principles

#### 1. Software Sovereignty

> **We control our destiny by controlling our dependencies.**

Every critical component of Lux infrastructure exists in the `luxfi/` namespace under our direct control. This is not about isolation—it's about independence. We can accept upstream changes, contribute improvements back, or diverge when our needs differ.

#### 2. Strategic Forking

> **Fork to extend, not to abandon.**

Our forks are maintained relationships with upstream projects, not divorces. We:
- Track upstream security patches
- Cherry-pick relevant improvements
- Contribute fixes back when possible
- Diverge only when our path differs

#### 3. Minimal Surface Area

> **Every dependency is an attack vector.**

Each external package introduces risk: security vulnerabilities, abandoned maintenance, unexpected breaking changes, license complications. We minimize this surface by:
- Preferring stdlib over external packages
- Forking and auditing what we must use
- Eliminating unused code paths
- Rejecting transitive dependency sprawl

#### 4. Immediate Response

> **Security patches are deployed in hours, not weeks.**

When a CVE is disclosed in a dependency, projects that rely on upstream must wait. We don't wait. Our forked dependencies can be patched and deployed immediately, often before the exploit is weaponized.

#### 5. Feature Independence

> **Ship what upstream will never merge.**

Lux includes capabilities that would never be accepted upstream:
- Post-quantum cryptography at L1
- DeFi primitives as precompiles
- AI inference infrastructure
- Custom consensus mechanisms

These aren't patches waiting for review—they're architectural choices that define our platform.

---

### Dependency Tiers

We categorize dependencies by trust level:

| Tier | Policy | Examples |
|------|--------|----------|
| **Tier 0: Internal** | Full control, direct ownership | luxfi/node, luxfi/crypto, luxfi/consensus |
| **Tier 1: Stdlib** | Trusted, stable, well-audited | golang.org/x/*, google.golang.org/grpc |
| **Tier 2: Forked** | External origin, maintained internally | luxfi/geth (from go-ethereum) |
| **Tier 3: Pinned** | External, version-locked, audited | Select libraries with no alternatives |

**Critical path contains only Tier 0-2 dependencies.**

---

### What We Fork

| Component | Reason |
|-----------|--------|
| **Consensus Engine** | Custom BFT, no upstream constraints |
| **EVM Execution** | Precompiles, optimizations, quantum-ready |
| **Cryptographic Libraries** | Post-quantum, threshold signatures |
| **Database Backends** | Performance tuning, pure Go preference |
| **Networking Stack** | Protocol extensions, hardening |

### What We Don't Fork

| Component | Reason |
|-----------|--------|
| **Go Stdlib Extensions** | golang.org/x/* is well-maintained |
| **Protocol Buffers** | Standard, stable, universal |
| **gRPC** | Industry standard RPC |

---

## Rationale

### Why This Philosophy?

**1. Feature Velocity**

External projects have their own roadmaps. Waiting for upstream to accept our changes—or to prioritize features we need—is a bottleneck we eliminate by controlling our own codebase.

**2. Security Posture**

Supply chain attacks are the modern threat. The xz utils backdoor, event-stream incident, and countless npm package compromises demonstrate that trust in dependencies is trust in strangers. We minimize this trust.

**3. Audit Clarity**

Security auditors need clear scope. Our architecture gives them exactly that: a bounded set of internal packages with documented purposes, rather than a sprawling dependency graph of unknown origin.

**4. Performance Control**

Generic libraries make generic tradeoffs. Our forked components are optimized for our specific workloads, storage patterns, and performance characteristics.

**5. Quantum Readiness**

Post-quantum cryptography isn't a feature request to upstream—it's our architectural choice. We ship ML-DSA, SLH-DSA, and FROST because we control what ships.

### The Cost of Sovereignty

Maintaining forks requires ongoing effort:
- Tracking upstream security patches
- Resolving merge conflicts
- Understanding divergent codepaths
- Training contributors on our architecture

**We accept this cost.** The alternative—dependence on external roadmaps and timelines—is more expensive in the ways that matter: security incidents, missed opportunities, architectural constraints.

---

## Backwards Compatibility

This is a foundational architectural principle. All Lux software follows this philosophy.

New dependencies require:
1. Security audit
2. Justification for not forking
3. Core team approval

Existing forks are maintained indefinitely or until superseded by internal implementations.

---

## Security Considerations

This LP is itself a security measure:

1. **Auditor Guidance**: Security researchers understand our dependency model
2. **Contributor Policy**: New dependencies undergo scrutiny
3. **CVE Response**: Clear ownership enables rapid patching
4. **Scope Definition**: Bounded codebase enables thorough review

The philosophy documented here reduces attack surface, enables rapid response, and provides clear ownership of security-critical code.

---

## Related LPs

- **[LP-5: Supply Chain Control](./lp-0005-supply-chain-control.md)**: Implementation metrics and verification procedures
- **LP-85: Security Audit Framework**: How we audit dependencies
- **LP-86: Security Disclosure**: Responsible disclosure for our forks

---

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
