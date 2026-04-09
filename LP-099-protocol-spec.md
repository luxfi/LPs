---
lp: 099
title: Auditor-Ready Protocol Specification
tags: [protocol, specification, audit, formal, documentation]
description: Complete auditor-ready protocol specification document for Lux Network
author: Lux Core Team (@luxfi)
status: Final
type: Informational
category: Infrastructure
created: 2026-01-01
references:
  - lps-004 (Formal Verification)
  - lps-083 (Token Economics)
---

# LP-099: Auditor-Ready Protocol Specification

## Abstract

Defines the auditor-ready protocol specification for Lux Network. This document serves as the index and requirements for a complete, auditable protocol description suitable for security auditors, formal verification teams, and regulatory review. Each protocol component has a corresponding LPS with formal specification.

## Specification

### Document Structure

The protocol specification consists of the following sections, each referencing the canonical LPS:

| Section | LPS | Status |
|---------|-----|--------|
| Consensus: Snow family | Node documentation | Final |
| Consensus: Block-STM parallel execution | LP-010 | Final |
| Networking: P2P protocol, Warp messaging | LP-6022 | Final |
| Execution: EVM, cevm GPU acceleration | LP-009, LP-098 | Final |
| Cryptography: PQ signatures, threshold MPC | LP-070-078 | Final |
| Privacy: Z-Chain, shielded pools, FHE | LP-063-068 | Final |
| Identity: DID, IAM, KMS | LP-060-062 | Final |
| Economics: tokenomics, fees, governance | LP-080-089 | Final |
| Tokens: WLUX, bridge, staking, AI | LP-090-094 | Final |
| Infrastructure: safe, AA, multicall | LP-095-097 | Final |
| Securities: digital securities, compliance | LP-001-003, LP-088 | Final |
| Bridge: omnichain router, native programs | LP-016-018 | Final |
| Validator: key management, rewards | LP-015, LP-082-084 | Final |

### Audit Requirements

Each LPS must provide:
1. Formal specification of all state transitions.
2. Invariants that must hold across all states.
3. Security assumptions and threat model.
4. Test vectors for implementation verification.
5. Reference implementation location.

### Invariant Registry

Global protocol invariants:

| Invariant | Description |
|-----------|-------------|
| Total supply cap | LUX supply never exceeds 1,963,000,000 |
| Fee conservation | All fees are accounted (burn + treasury + validator) |
| Bridge backing | Bridged tokens are always 1:1 backed on origin chain |
| Consensus safety | No two conflicting blocks are finalized |
| Liveness | If 67% of stake is honest, new blocks are produced |

### Verification Toolchain

| Tool | Purpose |
|------|---------|
| TLA+ | Consensus protocol model checking |
| Certora | Smart contract formal verification |
| Echidna | Property-based fuzzing for Solidity |
| Foundry | Unit and integration testing |

## Security Considerations

1. The protocol spec is a living document. Each LPS update triggers a spec revision.
2. Auditors receive the spec plus full source access. No security-through-obscurity.
3. Formal verification covers critical paths (consensus, bridge, token transfers). Non-critical paths use property-based fuzzing.
4. Audit reports are published publicly after remediation.

## Reference

| Resource | Location |
|----------|----------|
| Protocol specification | `github.com/luxfi/lps/docs/protocol-spec/` |
| Formal models | `github.com/luxfi/lps/docs/formal/` |
| Audit reports | `github.com/luxfi/lps/docs/audits/` |

## Copyright

Copyright (C) 2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
