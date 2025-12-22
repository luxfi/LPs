---
lp: 220
title: Network Energy Transparency
tags: [esg, sustainability, energy, transparency, metrics]
description: Standards for transparent reporting of Lux Network energy consumption and carbon metrics.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-12-17
requires: [800, 801]
order: 220
---

# LP-820: Network Energy Transparency

## Abstract

This LP establishes the transparency standards for reporting Lux Network's energy consumption and environmental metrics. It defines what data is published, how it's calculated, where it's displayed, and how stakeholders can verify claims.

## Motivation

Sustainability claims without transparency are worthless. Stakeholders increasingly demand:
1. **Real-time visibility** - Not just annual reports, but live metrics
2. **Methodology disclosure** - Understanding how numbers are calculated
3. **Independent verification** - Ability to audit claims
4. **Comparable formats** - Metrics that enable cross-network comparison

This LP transforms Lux Network's environmental performance from a black box into a transparent, verifiable system. It builds the trust foundation necessary for institutional adoption and regulatory compliance.

## Transparency Principles

1. **Complete**: Report all material energy consumption
2. **Accurate**: Use best available data and methods
3. **Comparable**: Enable comparison with other networks
4. **Timely**: Publish data regularly and promptly
5. **Accessible**: Make data easy to find and understand

## Public Metrics

### Real-Time Dashboard

**Location**: `explorer.lux.network/sustainability`

| Metric | Update Frequency | Calculation |
|--------|------------------|-------------|
| Network power (kW) | Every block | Validator count × avg power |
| Energy per tx (Wh) | Every block | Power ÷ TPS |
| Carbon intensity (gCO2e/tx) | Daily | Energy × emission factor |
| Renewable % | Weekly | Survey data |
| Active validators | Real-time | On-chain data |

### Periodic Reports

| Report | Frequency | Contents |
|--------|-----------|----------|
| **Quarterly Sustainability Update** | Quarterly | Key metrics, progress, initiatives |
| **Annual ESG Report** | Annual | Comprehensive review, verified data |
| **Validator Energy Report** | Annual | Detailed validator-level data |

## Calculation Methodologies

### Network Power Consumption

**Bottom-Up Method** (Primary):
```
P_network = Σ(P_validator_i) for all active validators
```

Where:
- `P_validator_i` = Reported or estimated power per validator

**Estimation for Unreported Validators**:
- Cloud validators: Use instance type power estimates
- Bare metal: Use hardware TDP × 0.5 utilization factor
- Unknown: Use network average

**Top-Down Method** (Verification):
```
P_network = N_validators × P_average × (1 + overhead)
```

Where:
- `N_validators` = Active validator count
- `P_average` = Average power from survey
- `overhead` = 10% for networking/storage

### Energy Per Transaction

```
E_tx = (P_network × T_block) / N_tx_block
```

Where:
- `P_network` = Network power (kW)
- `T_block` = Block time (seconds)
- `N_tx_block` = Transactions in block

**Finality-Adjusted**:
```
E_tx_final = E_tx × (1 / finality_probability)
```

For Lux (deterministic finality): finality_probability = 1.0

### Carbon Intensity

```
I_carbon = E_tx × EF_network × (1 - R_network)
```

Where:
- `E_tx` = Energy per transaction (kWh)
- `EF_network` = Weighted average emission factor
- `R_network` = Renewable energy fraction

**Emission Factor Calculation**:
```
EF_network = Σ(EF_region_i × E_region_i) / Σ(E_region_i)
```

Weighted by energy consumption per region.

## Data Sources

### Primary Data

| Data | Source | Quality |
|------|--------|---------|
| Validator count | On-chain | High |
| Transaction count | On-chain | High |
| Block time | On-chain | High |
| Validator location | Survey | Medium |
| Validator power | Survey + estimates | Medium |
| Renewable % | Survey | Medium |

### Secondary Data

| Data | Source | Update Frequency |
|------|--------|------------------|
| Grid emission factors | IEA, EPA eGRID | Annual |
| Instance power estimates | Cloud provider specs | As updated |
| Hardware TDP | Manufacturer specs | As updated |
| PUE benchmarks | Industry reports | Annual |

### Data Quality Indicators

Each metric displays quality indicator:

| Indicator | Meaning |
|-----------|---------|
| 🟢 High | >80% primary data |
| 🟡 Medium | 50-80% primary data |
| 🔴 Low | <50% primary data |

## Comparison Framework

### Cross-Network Comparisons

When comparing Lux to other networks:

1. **Normalize by finality**: Account for different confirmation requirements
2. **Use consistent boundaries**: Same scope of emissions
3. **Note methodology differences**: Transparent about calculation variations
4. **Update regularly**: Use most recent data for all networks

### Standard Comparison Metrics

| Metric | Unit | Notes |
|--------|------|-------|
| Energy per final tx | Wh/tx | After finality achieved |
| Carbon per final tx | gCO2e/tx | Including renewable % |
| Energy per $1M secured | kWh/$M | Normalized by TVL |
| Annual network emissions | tCO2e/year | Total Scope 2 |

### Comparison Table (Published)

| Network | Consensus | Energy/tx | Carbon/tx | Renewable % |
|---------|-----------|-----------|-----------|-------------|
| Lux | PoS | X Wh | X gCO2e | X% |
| [Other PoS] | PoS | Y Wh | Y gCO2e | Y% |
| [Bitcoin] | PoW | Z Wh | Z gCO2e | Z% |

*Updated quarterly with latest available data*

## Validator-Level Transparency

### Public Validator Data

| Data | Visibility | Purpose |
|------|------------|---------|
| Green tier status | Public | Inform delegators |
| Hosting region | Public | Geographic distribution |
| Renewable % (self-reported) | Public | Sustainability comparison |

### Private Validator Data

| Data | Visibility | Purpose |
|------|------------|---------|
| Exact power consumption | Aggregated only | Network totals |
| Hosting provider | Private | Competitive sensitivity |
| Utility bills | Verification only | Audit purposes |

### Opt-In Enhanced Disclosure

Validators may opt to publish:
- Detailed energy breakdown
- Third-party verification reports
- Real-time power monitoring

## Audit & Verification

### Internal Verification

- Quarterly reconciliation of data sources
- Cross-check calculations
- Review methodology updates
- Sign-off by Sustainability Lead

### External Verification

**Annual third-party review** covering:
- Calculation methodology
- Data quality assessment
- Reported metrics accuracy
- Recommendations for improvement

**Verification statement** published with annual report.

### Community Verification

Open-source tools for community verification:
- Methodology documentation
- Calculation scripts
- Data sources listed
- API for raw data access

## API Access

### Public Sustainability API

**Endpoint**: `api.lux.network/v1/sustainability`

**Available Data**:
```json
{
  "timestamp": "2025-12-17T00:00:00Z",
  "network_power_kw": 150.5,
  "energy_per_tx_wh": 0.025,
  "carbon_per_tx_gco2e": 0.008,
  "renewable_percent": 65.2,
  "validator_count": 1200,
  "green_certified_count": 360,
  "data_quality": "medium"
}
```

**Rate Limits**: 100 requests/minute (authenticated)

**Documentation**: `docs.lux.network/api/sustainability`

## Historical Data

### Data Retention

| Data Type | Retention | Purpose |
|-----------|-----------|---------|
| Real-time metrics | 30 days | Dashboard display |
| Daily aggregates | 2 years | Trend analysis |
| Monthly summaries | Permanent | Historical comparison |
| Annual reports | Permanent | Audit trail |

### Historical Comparisons

Publish year-over-year comparisons showing:
- Absolute emissions change
- Intensity improvement
- Renewable energy growth
- Validator sustainability adoption

## Anti-Greenwashing Safeguards

### Claim Standards

1. **No unverified claims**: All public claims backed by data
2. **Uncertainty disclosure**: Report confidence intervals
3. **Methodology transparency**: Publish calculation methods
4. **Limitation acknowledgment**: Note data gaps and estimates

### Review Process

Before publishing sustainability claims:
1. Data verification by Sustainability team
2. Methodology review
3. Communications review
4. Legal review (for significant claims)

### Correction Policy

If errors discovered:
1. Correct immediately
2. Publish correction notice
3. Explain impact of error
4. Update historical data if material

## Related LPs

- **LP-800**: ESG Principles and Commitments
- **LP-801**: Carbon Accounting Methodology
- **LP-810**: Green Compute & Energy Procurement
- **LP-840**: Impact Disclosure & Anti-Greenwashing Policy
- **LP-850**: ESG Standards Alignment Matrix

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
