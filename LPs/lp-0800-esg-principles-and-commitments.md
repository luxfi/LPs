---
lp: 800
title: ESG Principles and Commitments
tags: [esg, sustainability, governance]
description: Foundational ESG framework defining Lux Network's environmental, social, and governance commitments.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-12-16
order: 800
---

# LP-800: ESG Principles and Commitments

## Abstract

This LP establishes the foundational Environmental, Social, and Governance (ESG) framework for Lux Network. It defines our material topics, governance structure, metrics and targets, verification approach, and known tradeoffs. All other ESG-related LPs (LP-801 through LP-999) reference this document as the canonical source for Lux's sustainability commitments.

## Motivation

Blockchain networks face increasing scrutiny over their environmental and social impact. Without a clear ESG framework, networks risk:
1. **Reputational damage** from perceived environmental harm
2. **Regulatory challenges** as sustainability requirements expand globally
3. **Institutional exclusion** from ESG-mandated investment portfolios
4. **Community erosion** as stakeholders demand accountability

This LP addresses these challenges by establishing clear commitments, measurable targets, and transparent governance structures. It positions Lux Network as infrastructure that accelerates—rather than hinders—the transition to a sustainable economy.

## Mission and ESG Thesis

Lux Network is committed to building blockchain infrastructure that serves humanity and the planet. We believe decentralized systems should accelerate the transition to a sustainable economy, not hinder it. Our ESG thesis: **infrastructure-level sustainability creates compounding positive impact** because every application built on Lux inherits our environmental and social commitments.

## Material Topics

We are accountable for the following material ESG topics, prioritized by impact and stakeholder relevance:

### Environmental

| Topic | Materiality | Boundary | Metrics |
|-------|-------------|----------|---------|
| Energy consumption | High | Validator network, data centers | kWh/tx, PUE |
| Carbon emissions | High | Scope 1, 2, 3 | tCO2e/year |
| E-waste | Medium | Hardware lifecycle | kg recycled/year |
| Renewable energy | High | Network-wide | % renewable |

### Social

| Topic | Materiality | Boundary | Metrics |
|-------|-------------|----------|---------|
| Financial inclusion | High | Global access | Unique addresses, geo-distribution |
| Developer community | High | Ecosystem growth | Active developers, grants disbursed |
| Transparency | High | All operations | Disclosure score |
| User protection | High | DeFi applications | Insurance coverage, audit rate |

### Governance

| Topic | Materiality | Boundary | Metrics |
|-------|-------------|----------|---------|
| Decentralization | Critical | Network control | Nakamoto coefficient, validator distribution |
| Token governance | High | Protocol decisions | Participation rate, proposal throughput |
| Regulatory compliance | High | Multi-jurisdiction | Licenses held, enforcement actions |
| Third-party risk | Medium | Vendors, partners | Vendor ESG scores |

## Governance Structure

### ESG Ownership

| Role | Responsibility | Accountability |
|------|----------------|----------------|
| **ESG Committee** | Strategic direction, policy approval | Board-level reporting |
| **Sustainability Lead** | Day-to-day execution, reporting | ESG Committee |
| **Working Groups** | Topic-specific implementation | Sustainability Lead |
| **External Advisors** | Independent review, benchmarking | ESG Committee |

### Decision Rights

- **Policy Changes**: ESG Committee approval, community vote for material changes
- **Target Setting**: Annual review with public consultation
- **Incident Response**: Sustainability Lead with 24-hour escalation to Committee
- **Disclosure**: Quarterly reports, annual audit

## Metrics and Targets

### Environmental Targets

| Metric | Baseline (2024) | 2025 Target | 2027 Target | 2030 Target |
|--------|-----------------|-------------|-------------|-------------|
| Carbon intensity (gCO2/tx) | TBD | -20% | -50% | Net-zero |
| Renewable energy (%) | TBD | 50% | 80% | 100% |
| Energy efficiency (tx/kWh) | TBD | +30% | +60% | +100% |

### Social Targets

| Metric | Baseline (2024) | 2025 Target | 2027 Target |
|--------|-----------------|-------------|-------------|
| Geographic distribution (countries) | TBD | 50+ | 100+ |
| Developer grants ($) | TBD | $5M | $20M |
| Ecosystem audits (%) | TBD | 80% | 95% |

### Governance Targets

| Metric | Baseline (2024) | 2025 Target | 2027 Target |
|--------|-----------------|-------------|-------------|
| Nakamoto coefficient | TBD | 20+ | 50+ |
| Governance participation (%) | TBD | 30% | 50% |
| LP approval rate (%) | TBD | Track | Track |

## Verification and Assurance

### Internal Controls

1. **Automated Monitoring**: On-chain metrics tracked in real-time
2. **Manual Review**: Quarterly reconciliation of off-chain data
3. **Cross-Functional Audit**: Annual internal audit by independent team

### External Verification

| Type | Frequency | Standard | Provider |
|------|-----------|----------|----------|
| Carbon accounting | Annual | GHG Protocol | TBD (qualified auditor) |
| ESG disclosure | Annual | GRI Standards | TBD |
| Security audit | Continuous | Custom | Multiple (rotation) |
| Financial audit | Annual | GAAP/IFRS | TBD |

### Third-Party Attestations

- **SOC 2 Type II**: Target 2025 (infrastructure controls)
- **ISO 14001**: Target 2026 (environmental management)
- **ISO 27001**: Target 2025 (information security)

## Known Tradeoffs

We are transparent about tensions in our ESG approach:

### Performance vs. Sustainability

- **Tradeoff**: Sub-second finality requires always-on validators
- **Mitigation**: Energy-efficient consensus (Quasar), renewable energy requirements
- **Disclosure**: We will report energy cost per transaction honestly

### Decentralization vs. Efficiency

- **Tradeoff**: More validators = more resilience but more energy
- **Mitigation**: Minimum viable validator set with geographic distribution requirements
- **Disclosure**: We optimize for decentralization first, then efficiency

### Privacy vs. Transparency

- **Tradeoff**: Some ESG data involves confidential business relationships
- **Mitigation**: Aggregate reporting, third-party attestation without raw data
- **Disclosure**: We will explain what we can't disclose and why

### Speed vs. Thoroughness

- **Tradeoff**: Rapid protocol evolution may outpace ESG review
- **Mitigation**: ESG checkpoint in LP approval process
- **Disclosure**: We will flag LPs that have incomplete ESG analysis

## Compliance and Enforcement

### Self-Enforcement

- All core contributors commit to ESG training
- ESG considerations required in LP submissions
- Quarterly ESG scorecard for protocol health

### Ecosystem Enforcement

- Major ecosystem grants require ESG attestation
- Validator selection criteria include sustainability metrics
- DeFi protocol listing guidelines include security/audit requirements

### Escalation Path

1. **Informal**: Working group discussion
2. **Formal**: ESG Committee review
3. **Public**: Community governance vote
4. **External**: Regulatory notification (if required)

## Related LPs

- **LP-801**: Carbon Accounting Methodology
- **LP-810**: Green Compute & Energy Procurement
- **LP-820**: Network Energy Transparency
- **LP-830**: ESG Risk Management
- **LP-840**: Impact Disclosure & Anti-Greenwashing Policy
- **LP-850**: Standards Alignment Matrix
- **LP-860**: Evidence Locker Index

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-16 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
