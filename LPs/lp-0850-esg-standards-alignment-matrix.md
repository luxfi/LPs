---
lp: 850
title: ESG Standards Alignment Matrix
tags: [esg, sustainability, esg, compliance, standards]
description: Mapping Lux Network's ESG framework to global reporting standards and frameworks.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-12-16
requires: [800]
order: 850
---

# LP-850: ESG Standards Alignment Matrix

## Abstract

This LP provides a comprehensive mapping between Lux Network's ESG framework (LP-800) and established global standards including GRI, SASB, TCFD/ISSB, UN SDGs, ISO certifications, and blockchain-specific frameworks. This matrix enables stakeholders, auditors, and partners to understand how Lux's disclosures align with their reporting requirements.

## Motivation

Different stakeholders require different reporting frameworks. Without clear standards mapping:
1. **Institutional investors** cannot integrate Lux into ESG-mandated portfolios
2. **Auditors** cannot efficiently verify compliance
3. **Partners** cannot assess alignment with their own frameworks
4. **Regulators** cannot confirm compliance with emerging disclosure requirements

This LP serves as the Rosetta Stone between Lux's internal ESG framework and the global standards ecosystem. It reduces friction for all stakeholders who need to understand our sustainability posture in their own terms.

## Purpose

External stakeholders require confidence that our ESG claims are:
1. **Measurable**: Aligned with recognized metrics
2. **Comparable**: Mapped to industry standards
3. **Verifiable**: Subject to external audit
4. **Complete**: Covering material topics

This matrix serves as the authoritative reference for all ESG compliance mappings.

## Climate & Environmental Standards

### GRI (Global Reporting Initiative)

| GRI Standard | GRI Disclosure | Lux LP | Status | Evidence |
|--------------|----------------|--------|--------|----------|
| **GRI 302: Energy** | 302-1 Energy consumption | LP-810 | Reporting | Quarterly reports |
| | 302-2 Energy outside organization | LP-820 | Partial | Validator network data |
| | 302-3 Energy intensity | LP-810 | Reporting | Per-transaction metrics |
| | 302-4 Reduction of energy | LP-810 | Target | Annual improvement goals |
| **GRI 305: Emissions** | 305-1 Direct (Scope 1) | LP-801 | Reporting | Carbon accounting |
| | 305-2 Indirect (Scope 2) | LP-801 | Reporting | Energy provider data |
| | 305-3 Other indirect (Scope 3) | LP-801 | Partial | Validator estimates |
| | 305-4 GHG emissions intensity | LP-801 | Reporting | Per-transaction CO2e |
| | 305-5 Reduction of GHG | LP-801 | Target | Net-zero roadmap |
| **GRI 306: Waste** | 306-2 Waste by type | LP-810 | Planned | E-waste tracking |

### SASB (Sustainability Accounting Standards Board)

**Industry**: Technology & Communications - Software & IT Services

| SASB Topic | SASB Code | Lux Disclosure | LP Reference |
|------------|-----------|----------------|--------------|
| Environmental Footprint of Hardware | TC-SI-130a.1 | Total energy consumed | LP-810 |
| | TC-SI-130a.2 | % grid electricity | LP-810 |
| | TC-SI-130a.3 | % renewable energy | LP-810 |
| Data Privacy & Security | TC-SI-220a.1 | Privacy incidents | LP-830 |
| | TC-SI-220a.5 | Data breaches | LP-830 |
| Systemic Risk Management | TC-SI-550a.2 | Business continuity | LP-830 |

### TCFD / ISSB (Climate-Related Financial Disclosures)

| TCFD Pillar | Recommendation | Lux Response | LP Reference |
|-------------|----------------|--------------|--------------|
| **Governance** | Board oversight | ESG Committee reports to Board | LP-800 |
| | Management role | Sustainability Lead responsible | LP-800 |
| **Strategy** | Climate risks/opportunities | Documented in LP-830 | LP-830 |
| | Scenario analysis | 2°C and 4°C scenarios | LP-830 |
| | Resilience | Network redundancy, geographic distribution | LP-605 |
| **Risk Management** | Risk identification | ESG Risk Matrix | LP-830 |
| | Risk management | Mitigation strategies defined | LP-830 |
| | Integration | Part of LP approval process | LP-800 |
| **Metrics & Targets** | Climate metrics | Energy, emissions, intensity | LP-801, LP-810 |
| | Scope 1, 2, 3 emissions | Full accounting | LP-801 |
| | Targets | Net-zero by 2030 | LP-800 |

### GHG Protocol

| Scope | Category | Lux Coverage | Methodology |
|-------|----------|--------------|-------------|
| **Scope 1** | Direct emissions | None (no facilities) | N/A |
| **Scope 2** | Purchased electricity | Validator operations | Location/market-based |
| **Scope 3** | Category 1: Purchased goods | Hardware procurement | Spend-based |
| | Category 11: Use of sold products | Network usage | Activity data |
| | Category 15: Investments | Treasury holdings | PCAF methodology |

## Impact & SDG Alignment

### UN Sustainable Development Goals

| SDG | Target | Lux Contribution | Evidence |
|-----|--------|------------------|----------|
| **SDG 7: Affordable & Clean Energy** | 7.2 Increase renewable share | Validator renewable requirements | LP-810 |
| | 7.3 Energy efficiency | Per-transaction optimization | LP-820 |
| **SDG 8: Decent Work & Economic Growth** | 8.3 Development-oriented policies | Developer grants program | LP-800 |
| | 8.10 Financial services access | DeFi infrastructure | LP-60s |
| **SDG 9: Industry, Innovation & Infrastructure** | 9.1 Resilient infrastructure | Distributed validator network | LP-605 |
| | 9.4 Sustainable infrastructure | Low-carbon blockchain | LP-801 |
| **SDG 12: Responsible Consumption** | 12.6 Sustainability reporting | ESG disclosure framework | LP-800 |
| **SDG 13: Climate Action** | 13.2 Climate measures | Carbon reduction targets | LP-801 |
| **SDG 16: Peace, Justice & Strong Institutions** | 16.5 Reduce corruption | Transparent governance | LP-800 |
| | 16.6 Accountable institutions | DAO governance | LP-800 |
| **SDG 17: Partnerships for Goals** | 17.16 Multi-stakeholder partnerships | Ecosystem collaboration | LP-800 |

### IRIS+ (Impact Measurement)

| IRIS+ Category | Metric | Lux Metric | LP Reference |
|----------------|--------|------------|--------------|
| **Financial Services** | OI1120 Client Individuals | Unique addresses | LP-800 |
| | OI8161 Geographic Distribution | Countries served | LP-800 |
| **Energy** | OI1479 Energy Consumed | kWh per year | LP-810 |
| | OI7826 Renewable Energy | % of total | LP-810 |
| **Environment** | OI1782 GHG Emissions Reduced | tCO2e avoided | LP-801 |

## Technology & Security Standards

### SOC 2 Type II Controls

| Trust Service Criteria | Control | Lux Implementation | Status |
|------------------------|---------|---------------------|--------|
| **Security** | CC6.1 Logical access | Role-based access control | Target 2025 |
| | CC6.6 System boundaries | Network isolation | Implemented |
| | CC6.7 Transmission protection | TLS 1.3, encryption | Implemented |
| **Availability** | CC7.1 Change management | LP approval process | Implemented |
| | CC7.2 System monitoring | 24/7 monitoring | Implemented |
| **Processing Integrity** | CC8.1 Input validation | Smart contract verification | Implemented |
| **Confidentiality** | CC9.1 Identification | Data classification | Planned |

### ISO Standards

| ISO Standard | Scope | Lux Status | Target Date |
|--------------|-------|------------|-------------|
| **ISO 14001** | Environmental Management | Planned | 2026 |
| **ISO 27001** | Information Security | Target | 2025 |
| **ISO 27701** | Privacy Information | Planned | 2026 |
| **ISO 14064** | GHG Verification | Planned | 2026 |

## Blockchain-Specific Frameworks

### Crypto Climate Accord

| Commitment | Requirement | Lux Status |
|------------|-------------|------------|
| Net-zero emissions by 2040 | Achieve net-zero from electricity | Committed (2030 target) |
| Develop standards | Participate in standard development | Active |
| 100% renewable by 2030 | Validator renewable requirements | On track |

### Crypto Carbon Ratings Institute (CCRI)

| Metric | CCRI Definition | Lux Reporting |
|--------|-----------------|---------------|
| Network power consumption | Total validator electricity | LP-810 |
| Transaction energy | kWh per transaction | LP-820 |
| Carbon intensity | gCO2e per transaction | LP-801 |
| Renewable energy share | % from renewable sources | LP-810 |

### Bitcoin Mining Council Methodology

While Lux uses proof-of-stake (not mining), we adapt relevant metrics:

| BMC Metric | Lux Equivalent | Reporting |
|------------|----------------|-----------|
| Sustainable electricity mix | Validator renewable % | Quarterly |
| Efficiency (hash rate) | TPS per kWh | Quarterly |
| Energy consumption | Total network kWh | Quarterly |

## Governance Standards

### OECD Principles of Corporate Governance

| OECD Principle | Lux Implementation | LP Reference |
|----------------|---------------------|--------------|
| Shareholder rights | Token holder voting rights | LP-800 |
| Equitable treatment | One-token-one-vote | LP-800 |
| Stakeholder role | Community participation | LP-800 |
| Disclosure & transparency | Public reporting | LP-840 |
| Board responsibilities | ESG Committee oversight | LP-800 |

### DAO Governance Standards

| Framework | Element | Lux Implementation |
|-----------|---------|---------------------|
| **Snapshot** | Off-chain voting | Implemented |
| **Compound Governor** | On-chain execution | Planned |
| **Optimistic governance** | Timelock + veto | Implemented |

## Compliance Matrix Summary

### Full Alignment

| Standard | Coverage | Verification |
|----------|----------|--------------|
| GRI 302 (Energy) | Complete | Annual report |
| GRI 305 (Emissions) | Complete | Carbon audit |
| TCFD Governance | Complete | Board minutes |
| TCFD Risk Management | Complete | Risk register |
| UN SDG 9, 13, 16 | Primary focus | Impact report |

### Partial Alignment (Work in Progress)

| Standard | Gap | Timeline |
|----------|-----|----------|
| SASB TC-SI (full) | Data privacy metrics | Q2 2025 |
| GRI 306 (Waste) | E-waste tracking | Q3 2025 |
| ISO 27001 | Certification process | 2025 |
| SOC 2 Type II | Audit engagement | 2025 |

### Planned Alignment

| Standard | Dependency | Target |
|----------|------------|--------|
| ISO 14001 | Environmental management system | 2026 |
| ISO 14064 | GHG verification | 2026 |
| ISSB S2 | Full climate disclosure | 2026 |

## Using This Matrix

### For Investors
Reference specific LP numbers for due diligence on any ESG topic.

### For Auditors
Use the evidence column to locate supporting documentation.

### For Partners
Map your reporting requirements to Lux disclosures for integration.

### For Regulators
This matrix demonstrates alignment with emerging ESG regulations.

## Related LPs

- **LP-800**: ESG Principles and Commitments (parent document)
- **LP-801**: Carbon Accounting Methodology
- **LP-810**: Green Compute & Energy Procurement
- **LP-820**: Network Energy Transparency
- **LP-830**: ESG Risk Management
- **LP-840**: Impact Disclosure & Anti-Greenwashing Policy
- **LP-860**: Evidence Locker Index

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-16 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
