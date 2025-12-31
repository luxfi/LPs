---
lp: 8921
title: Carbon Accounting Methodology
tags: [esg, sustainability, carbon, emissions, ghg-protocol]
description: Methodology for measuring and reporting Lux Network's greenhouse gas emissions.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-12-17
requires: 2920
order: 2921
---

# LP-801: Carbon Accounting Methodology

## Abstract

This LP defines the methodology for measuring, calculating, and reporting greenhouse gas (GHG) emissions associated with Lux Network operations. It aligns with the GHG Protocol Corporate Standard and provides specific guidance for blockchain network carbon accounting.

## Motivation

Accurate carbon accounting is foundational to credible sustainability claims. Without rigorous methodology:
1. **Greenwashing risk** - Vague claims invite skepticism and regulatory action
2. **Incomparable metrics** - Stakeholders cannot benchmark against other networks
3. **Ineffective reduction** - Cannot improve what isn't measured
4. **Investor distrust** - ESG-focused capital requires verified emissions data

This LP establishes the accounting foundation that enables all downstream environmental commitments. By aligning with GHG Protocol, we ensure compatibility with institutional reporting requirements and carbon market mechanisms.

## Scope

### Organizational Boundary

**Control Approach**: Operational control

Lux Network accounts for emissions from:
- Protocol development and maintenance operations
- Validator network coordination
- Foundation/DAO operations

### Operational Boundary

| Scope | Included Sources | Methodology |
|-------|------------------|-------------|
| **Scope 1** | Direct emissions | Not applicable (no owned facilities/vehicles) |
| **Scope 2** | Purchased electricity | Validator node operations |
| **Scope 3** | Value chain emissions | Categories 1, 3, 5, 6, 11 |

## Scope 2: Validator Network Emissions

### Calculation Methodology

#### Energy Consumption Estimation

**Formula:**
```solidity
E_network = Σ (N_validators × P_average × H_operating × PUE)
```

Where:
- `N_validators` = Number of active validators
- `P_average` = Average power consumption per validator (kW)
- `H_operating` = Operating hours per period
- `PUE` = Power Usage Effectiveness of hosting facility

#### Reference Values

| Validator Type | Power Consumption | Source |
|----------------|-------------------|--------|
| Standard node | 150-300W | Hardware specifications |
| High-performance node | 300-500W | Hardware specifications |
| Cloud instance (c5.xlarge) | ~100W equivalent | AWS/GCP estimates |

#### Emissions Calculation

**Location-based method:**
```solidity
CO2e_location = E_consumed × EF_grid
```

**Market-based method:**
```solidity
CO2e_market = E_consumed × EF_supplier - RECs_retired
```

Where:
- `EF_grid` = Grid emission factor (kg CO2e/kWh)
- `EF_supplier` = Supplier-specific emission factor
- `RECs_retired` = Renewable Energy Certificates retired

### Emission Factors

| Region | Grid Factor (kg CO2e/kWh) | Source |
|--------|---------------------------|--------|
| US Average | 0.417 | EPA eGRID 2023 |
| EU Average | 0.276 | EEA 2023 |
| Nordic | 0.030 | IEA 2023 |
| Global Average | 0.490 | IEA 2023 |

### Validator Survey Methodology

1. **Annual survey** to all registered validators
2. **Required data**:
   - Hardware specifications
   - Hosting location (country/region)
   - Energy source (if known)
   - Renewable energy purchases
3. **Response rate target**: >50% of stake-weighted validators
4. **Gap filling**: Use regional averages for non-respondents

## Scope 3: Value Chain Emissions

### Category 1: Purchased Goods and Services

| Item | Methodology | Emission Factor Source |
|------|-------------|------------------------|
| Cloud services | Spend-based | Supplier reports |
| Software licenses | Spend-based | EEIO factors |
| Professional services | Spend-based | EEIO factors |

### Category 3: Fuel and Energy-Related Activities

| Activity | Methodology |
|----------|-------------|
| T&D losses | Grid average loss factor × Scope 2 |
| Upstream fuel | Well-to-tank factors |

### Category 5: Waste Generated in Operations

| Waste Type | Methodology |
|------------|-------------|
| E-waste (validators) | Weight-based, hardware lifecycle |
| Office waste | Spend-based estimate |

### Category 6: Business Travel

| Mode | Methodology | Data Source |
|------|-------------|-------------|
| Air travel | Distance-based | DEFRA factors |
| Ground travel | Distance-based | DEFRA factors |
| Hotels | Night-based | HCMI factors |

### Category 11: Use of Sold Products

**Not applicable** - Lux Network is infrastructure, not a product manufacturer.

However, we report:
- Energy consumption enabled by the network
- Emissions intensity per transaction

## Intensity Metrics

### Per-Transaction Metrics

**Formula:**
```solidity
I_tx = (Scope2_network + Scope3_relevant) / N_transactions
```

**Reported as:**
- gCO2e per transaction
- kWh per transaction

### Per-TVL Metrics

**Formula:**
```solidity
I_tvl = Total_emissions / TVL_average
```

**Reported as:**
- kgCO2e per $1M TVL

## Data Quality

### Quality Scoring

| Score | Description | Acceptable Use |
|-------|-------------|----------------|
| **1** | Primary data, externally verified | All scopes |
| **2** | Primary data, internally verified | All scopes |
| **3** | Secondary data, industry average | Scope 3 only |
| **4** | Estimates, proxy data | Scope 3, flagged |
| **5** | Extrapolation, modeling | Sensitivity analysis only |

### Uncertainty Quantification

Report uncertainty ranges:
- **High confidence**: ±10%
- **Medium confidence**: ±25%
- **Low confidence**: ±50%

## Reporting Requirements

### Annual GHG Report

**Contents:**
1. Executive summary
2. Methodology overview
3. Scope 1, 2, 3 emissions by category
4. Intensity metrics
5. Year-over-year comparison
6. Reduction initiatives
7. Targets and progress
8. Data quality statement
9. Verification statement (if applicable)

### Quarterly Updates

- Network energy consumption
- Validator survey results
- Key intensity metrics

## Verification

### Internal Verification

1. Cross-check calculations
2. Validate emission factors
3. Review data quality scores
4. Sign-off by Sustainability Lead

### External Verification

**Target**: Annual third-party verification per ISO 14064-3

**Scope**: Limited assurance (Year 1), Reasonable assurance (Year 3+)

## Reduction Targets

### Science-Based Targets

Aligned with SBTi guidance:

| Target | Baseline | 2025 | 2027 | 2030 |
|--------|----------|------|------|------|
| Scope 2 intensity | TBD | -20% | -50% | -100% |
| Renewable energy | TBD | 50% | 80% | 100% |

### Reduction Strategies

1. **Validator incentives** for renewable energy use
2. **Geographic distribution** toward low-carbon grids
3. **Efficiency improvements** in consensus protocol
4. **REC/carbon offset** procurement for residual emissions

## Offsets Policy

### Hierarchy

1. **Avoid**: Efficient protocol design
2. **Reduce**: Clean energy, efficient hardware
3. **Offset**: Only for residual, unavoidable emissions

### Offset Quality Criteria

- Verified under recognized standard (Gold Standard, Verra VCS)
- Additional and permanent
- No double counting
- Preferably removal-based (not avoidance)

## Blockchain-Specific Considerations

### Proof-of-Stake Efficiency

Lux uses proof-of-stake consensus, which is:
- ~99.9% more efficient than proof-of-work
- No energy-intensive mining
- Validator hardware is general-purpose servers

### Network Growth Accounting

As network grows:
- More validators = more energy
- More transactions = lower per-tx emissions (efficiency gains)
- Track both absolute and intensity metrics

### Comparison Methodology

When comparing to other networks:
- Use consistent boundaries
- Normalize by transaction count and finality
- Account for security model differences

## Related LPs

- **LP-800**: ESG Principles and Commitments
- **LP-810**: Green Compute & Energy Procurement
- **LP-820**: Network Energy Transparency
- **LP-850**: ESG Standards Alignment Matrix

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

