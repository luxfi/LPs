---
lp: 2930
title: Green Compute & Energy Procurement
tags: [esg, sustainability, energy, renewable, validators]
description: Policy and incentives for renewable energy adoption across the Lux validator network.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-12-17
requires: [800, 801]
order: 2930
---

# LP-810: Green Compute & Energy Procurement

## Abstract

This LP establishes the policy framework for promoting renewable energy adoption across the Lux Network validator ecosystem. It defines requirements, incentives, and verification mechanisms to achieve the network's goal of 100% renewable energy by 2030.

## Motivation

Validator energy consumption represents the largest component of Lux Network's carbon footprint. Addressing this requires:
1. **Clear requirements** - Validators need guidance on renewable energy adoption
2. **Verification standards** - Claims must be auditable to prevent greenwashing
3. **Economic incentives** - Market mechanisms to reward green validators
4. **Progressive targets** - Phased approach allowing time for transition

This LP creates the framework for transforming the validator network from a potential liability into a sustainability asset. By achieving 100% renewable energy, Lux becomes infrastructure that actively supports global decarbonization goals.

## Goals

| Metric | 2025 Target | 2027 Target | 2030 Target |
|--------|-------------|-------------|-------------|
| Renewable energy % | 50% | 80% | 100% |
| Verified green validators | 30% | 60% | 90% |
| Average PUE | <1.5 | <1.3 | <1.2 |

## Validator Requirements

### Tier System

| Tier | Renewable % | Verification | Incentive |
|------|-------------|--------------|-----------|
| **Green Certified** | 100% | Third-party | Priority delegation, reduced fees |
| **Green Committed** | 50-99% | Self-attested + evidence | Recognition, partial incentives |
| **Standard** | <50% or unverified | None required | Standard participation |

### Minimum Requirements (Effective 2026)

All validators must:
1. Report energy source annually
2. Provide hosting location
3. Disclose hardware specifications

**2027 Upgrade**: Validators with >1% of stake must achieve Green Committed tier.

**2030 Upgrade**: All validators must achieve Green Committed tier.

## Renewable Energy Definitions

### Qualifying Sources

| Source | Qualifies | Notes |
|--------|-----------|-------|
| Solar (PV) | ✅ Yes | On-site or grid |
| Wind | ✅ Yes | On-site or grid |
| Hydroelectric | ✅ Yes | Run-of-river preferred |
| Geothermal | ✅ Yes | |
| Nuclear | ⚠️ Partial | 50% credit (low-carbon, not renewable) |
| Biomass | ⚠️ Partial | Must be certified sustainable |
| Natural gas | ❌ No | Even with carbon capture |
| Coal | ❌ No | |
| Oil | ❌ No | |

### Renewable Energy Instruments

| Instrument | Accepted | Requirements |
|------------|----------|--------------|
| **Direct PPA** | ✅ Yes | Contract documentation |
| **Bundled RECs** | ✅ Yes | Same grid region |
| **Unbundled RECs** | ⚠️ Partial | Must be from same country |
| **Green tariff** | ✅ Yes | Utility documentation |
| **Self-generation** | ✅ Yes | Meter data |

### Verification Requirements

| Tier | Evidence Required |
|------|-------------------|
| **Green Certified** | Third-party audit OR REC certificates + utility bills |
| **Green Committed** | Self-attestation + supporting documentation |

## Incentive Mechanisms

### Delegation Boost

Green Certified validators receive priority in:
- Foundation delegation programs
- Ecosystem grants
- Partnership opportunities

### Fee Reduction

| Validator Tier | Commission Cap Flexibility |
|----------------|---------------------------|
| Green Certified | Standard cap applies |
| Green Committed | Standard cap applies |
| Standard | May face higher minimum commission (TBD) |

### Recognition Program

- **Green Badge**: Displayed on explorer and validator lists
- **Annual Awards**: Top green validators recognized
- **Marketing Support**: Featured in sustainability communications

## Data Center Requirements

### PUE Standards

| Rating | PUE Range | Status |
|--------|-----------|--------|
| Excellent | <1.2 | Preferred |
| Good | 1.2-1.4 | Acceptable |
| Average | 1.4-1.6 | Acceptable (improve by 2027) |
| Poor | >1.6 | Discouraged |

### Location Considerations

**Preferred Regions** (low-carbon grids):
- Nordic countries (Norway, Sweden, Iceland)
- Quebec, Canada
- Pacific Northwest, USA
- France (nuclear-heavy grid)

**Acceptable Regions** (improving grids):
- Most EU countries
- California, USA
- Parts of Asia (varies widely)

**High-Emission Regions** (requires offsets):
- Coal-heavy grids (parts of China, India, Poland, Australia)
- Unless using 100% verified renewable

## Validator Reporting

### Annual Disclosure

All validators must submit:

```
validator_id: "NodeID-..."
reporting_year: 2025
energy_disclosure:
  total_consumption_kwh: 26280  # estimated annual
  renewable_percentage: 75
  renewable_sources:
    - type: "solar"
      percentage: 50
      verification: "green_tariff"
    - type: "wind"
      percentage: 25
      verification: "rec_certificates"
  hosting:
    provider: "Example Cloud"
    region: "eu-north-1"
    pue: 1.25
  hardware:
    type: "cloud_vm"
    instance: "c5.xlarge"
    estimated_watts: 100
attestation:
  signed_by: "validator_operator"
  date: "2025-12-31"
```

### Verification Process

1. **Self-submission**: Validator submits annual disclosure
2. **Evidence upload**: Supporting documents (bills, RECs, contracts)
3. **Review**: Sustainability team reviews submissions
4. **Tier assignment**: Validator assigned to appropriate tier
5. **Audit (sample)**: Random sample of Green Certified validators audited

## Transition Support

### Resources for Validators

1. **Green hosting guide**: List of verified green hosting providers
2. **REC procurement guide**: How to purchase renewable energy certificates
3. **Cost-benefit calculator**: Compare green vs. standard hosting costs
4. **Technical support**: Office hours for sustainability questions

### Green Hosting Partners

Validators are encouraged to use hosting providers with:
- Verified 100% renewable energy
- PUE <1.3
- ISO 14001 certification (preferred)
- Transparent sustainability reporting

*[Partner list maintained at docs.lux.network/sustainability/partners]*

## Network-Level Procurement

### Foundation Renewable Purchases

The Lux Foundation will:
1. Purchase RECs to cover any shortfall from 2030 target
2. Prioritize high-quality, additional renewable energy
3. Report purchases in annual sustainability report

### Carbon Offsets (Last Resort)

For residual emissions after renewable energy:
1. Use high-quality removal offsets (not avoidance)
2. Verified under Gold Standard or equivalent
3. Transparent reporting of offset purchases

## Measurement & Reporting

### Network Dashboard

Public dashboard showing:
- Total network energy consumption (estimated)
- Renewable energy percentage
- Validator tier distribution
- Carbon intensity (gCO2e/tx)

### Quarterly Reports

- Validator survey response rate
- Renewable energy progress
- New Green Certified validators
- Network efficiency trends

## Governance

### Policy Updates

Changes to this policy require:
1. LP proposal with 30-day comment period
2. ESG Committee review
3. Community vote for material changes

### Dispute Resolution

Validators may appeal tier assignments by:
1. Submitting additional evidence
2. Requesting independent review
3. Escalation to ESG Committee

## Related LPs

- **LP-800**: ESG Principles and Commitments
- **LP-801**: Carbon Accounting Methodology
- **LP-820**: Network Energy Transparency
- **LP-850**: ESG Standards Alignment Matrix

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
