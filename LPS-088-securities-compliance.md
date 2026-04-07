---
lps: 088
title: ERC-3643 Securities Compliance Framework
tags: [securities, erc-3643, t-rex, compliance, kyc, aml, regulation]
description: ERC-3643 (T-REX) compliant securities token framework with modular compliance
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Economics
created: 2018-06-01
references:
  - lps-001 (Digital Securities)
  - lps-002 (Compliance Hook)
  - ERC-3643 (T-REX)
---

# LPS-088: ERC-3643 Securities Compliance Framework

## Abstract

Defines the on-chain securities compliance framework based on ERC-3643 (Token for Regulated EXchanges). This standard enables fully compliant security token issuance, transfer, and lifecycle management. The framework provides modular compliance through pluggable identity verification, transfer restriction, and jurisdiction enforcement modules.

## Specification

### Architecture

```
SecurityToken (ERC-3643)
  |-- IdentityRegistry (KYC/AML verification status)
  |-- ComplianceModule[] (pluggable transfer rules)
  |-- TrustedIssuersRegistry (authorized KYC providers)
  |-- ClaimTopicsRegistry (required claim types per token)
```

### Identity Registry

Maps on-chain addresses to verified identities:

| Function | Description |
|----------|-------------|
| `isVerified(address)` | Returns true if address has all required claims |
| `registerIdentity(address, IIdentity, uint16 country)` | Register verified identity |
| `deleteIdentity(address)` | Remove identity (blocks all transfers) |

### Compliance Modules

Pluggable modules enforcing transfer rules:

| Module | Rule |
|--------|------|
| MaxOwnershipModule | Cap on tokens per holder (e.g., no holder >10% of supply) |
| CountryRestrictModule | Block transfers to/from specific jurisdictions |
| TimeTransfersLimitsModule | Daily/monthly transfer volume caps |
| ExchangeMonthlyLimitsModule | Exchange-specific monthly transfer limits |

### Claim Topics

Each token specifies required claim topics. A holder must have valid claims for ALL required topics to receive tokens:

| Topic ID | Meaning |
|----------|---------|
| 1 | KYC verified |
| 2 | AML screened |
| 3 | Accredited investor |
| 4 | Qualified institutional buyer |
| 7 | Jurisdiction approved |

### Lifecycle Operations

| Operation | Access |
|-----------|--------|
| `mint(address, amount)` | Token agent (issuer) |
| `burn(address, amount)` | Token agent |
| `forcedTransfer(from, to, amount)` | Token agent (regulatory) |
| `pause()` / `unpause()` | Token agent (emergency) |
| `freezePartialTokens(address, amount)` | Token agent (lockup) |

## Security Considerations

1. Identity verification is off-chain (Hanzo IAM). On-chain registry stores attestation results only.
2. Forced transfers bypass compliance for regulatory seizure. Access is tightly controlled via role-based permissions.
3. Trusted issuers are managed by the token issuer. Adding a malicious issuer would compromise compliance.
4. The framework is compatible with both Reg D (US private placement) and MiFID II (EU regulated markets).

## Reference

| Resource | Location |
|----------|----------|
| ERC-3643 contracts | `github.com/luxfi/standard/contracts/securities/` |
| Identity registry | `github.com/luxfi/standard/contracts/securities/IdentityRegistry.sol` |
| ERC-3643 specification | https://erc3643.org |

## Copyright

Copyright (C) 2018-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
