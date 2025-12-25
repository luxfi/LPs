---
lp: 2991
title: Impact Measurement Methodology
tags: [esg, impact, metrics, measurement, reporting]
description: Methodology for measuring, tracking, and reporting social impact across the Lux ecosystem.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-12-17
requires: 2920, 2990
order: 2991
---

# LP-901: Impact Measurement Methodology

## Abstract

This LP defines the methodology for measuring and reporting social impact across the Lux Network ecosystem. It establishes metrics definitions, data collection protocols, calculation methods, and reporting standards aligned with IRIS+ and IMP frameworks.

## Motivation

Good intentions are not enough—impact must be measured rigorously. Without standardized methodology:
1. **Inconsistent metrics** prevent comparison across time and projects
2. **Data quality issues** undermine confidence in reported outcomes
3. **Impact washing** becomes possible when definitions are ambiguous
4. **Institutional stakeholders** cannot integrate impact data into their frameworks

This LP establishes the measurement infrastructure that makes LP-900's Theory of Change operationally rigorous. By aligning with IRIS+ and IMP, we ensure compatibility with the global impact investing ecosystem.

## Measurement Framework

### Guiding Principles

1. **Materiality**: Focus on metrics that matter to stakeholders
2. **Comparability**: Use standardized definitions
3. **Reliability**: Ensure data quality and consistency
4. **Accessibility**: Make metrics understandable
5. **Actionability**: Enable decision-making

### Framework Alignment

| Framework | Application |
|-----------|-------------|
| **IRIS+** | Metric definitions and taxonomy |
| **IMP** | Five Dimensions structure |
| **GRI** | Stakeholder materiality |
| **SDG Indicators** | Global development alignment |

## Core Impact Metrics

### Financial Inclusion Metrics

#### FI-01: Users in Underserved Regions

**Definition**: Number of unique addresses actively transacting from countries classified as emerging markets or developing economies (IMF classification).

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | PI7098 (modified) |
| **Unit** | Count |
| **Frequency** | Monthly |
| **Data Source** | On-chain + geolocation |

**Calculation**:
```solidity
FI-01 = Count(unique_addresses WHERE country IN emerging_markets AND tx_count >= 1 in period)
```

**Methodology Notes**:
- Country determined by validator exit node or declared wallet country
- Emerging markets per IMF World Economic Outlook classification
- Active = at least 1 transaction in reporting period
- Privacy-preserving: aggregated counts only

#### FI-02: Average Transaction Cost

**Definition**: Mean transaction fee in USD for standard value transfer transactions.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | Custom |
| **Unit** | USD |
| **Frequency** | Daily (reported monthly) |
| **Data Source** | On-chain |

**Calculation**:
```solidity
FI-02 = Sum(tx_fees_USD) / Count(standard_transfers)
```

#### FI-03: Languages Supported

**Definition**: Number of languages with official documentation and user interface translations.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | OI1638 (modified) |
| **Unit** | Count |
| **Frequency** | Quarterly |
| **Data Source** | Documentation inventory |

**Criteria for inclusion**:
- Full documentation translation (>80% of core docs)
- UI localization available
- Community support channel in language

### Economic Empowerment Metrics

#### EE-01: Validator Rewards Distributed

**Definition**: Total value in USD of staking rewards distributed to validators.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | PI4060 (modified) |
| **Unit** | USD |
| **Frequency** | Monthly |
| **Data Source** | On-chain |

**Calculation**:
```solidity
EE-01 = Sum(validator_rewards * price_USD)
```

#### EE-02: Grant Recipients

**Definition**: Cumulative number of unique entities receiving ecosystem grants.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | OI8869 (modified) |
| **Unit** | Count |
| **Frequency** | Quarterly |
| **Data Source** | Grant database |

#### EE-03: Ecosystem Jobs Estimate

**Definition**: Estimated full-time equivalent positions supported by Lux ecosystem projects.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | PI3687 |
| **Unit** | FTE |
| **Frequency** | Annual |
| **Data Source** | Ecosystem survey |

**Methodology**:
- Annual survey of funded projects
- Self-reported FTE counts
- Extrapolation for non-respondents based on funding level
- Reported with confidence interval

### Governance Participation Metrics

#### GP-01: Governance Participants

**Definition**: Unique addresses participating in on-chain governance or LP process.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | Custom |
| **Unit** | Count |
| **Frequency** | Quarterly |
| **Data Source** | On-chain + GitHub |

**Includes**:
- On-chain votes cast
- LP proposals submitted
- LP comments/reviews
- Forum discussion participation (verified accounts)

#### GP-02: LP Contributions

**Definition**: Number of LP proposals, comments, and reviews submitted.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | Custom |
| **Unit** | Count |
| **Frequency** | Quarterly |
| **Data Source** | GitHub repository |

#### GP-03: Regional Representation

**Definition**: Number of countries with at least one active governance participant.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | OI3176 (modified) |
| **Unit** | Count |
| **Frequency** | Annual |
| **Data Source** | Survey + registration data |

### Developer Ecosystem Metrics

#### DE-01: Monthly Active Developers

**Definition**: Developers with meaningful code contributions or activity in the ecosystem.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | Custom |
| **Unit** | Count |
| **Frequency** | Monthly |
| **Data Source** | GitHub, npm, contract deployments |

**Includes**:
- Code commits to Lux repositories
- Package downloads/usage
- Smart contract deployments
- SDK/API usage (authenticated)

#### DE-02: Developer Countries

**Definition**: Number of countries with at least one active developer.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | OI3176 (modified) |
| **Unit** | Count |
| **Frequency** | Quarterly |
| **Data Source** | Developer profiles + activity |

#### DE-03: Open-Source Contributions

**Definition**: Cumulative count of merged pull requests to Lux repositories.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Code** | Custom |
| **Unit** | Count |
| **Frequency** | Monthly |
| **Data Source** | GitHub API |

## Data Collection Protocols

### On-Chain Data

**Collection Method**: Automated indexing

| Protocol | Details |
|----------|---------|
| **Frequency** | Real-time indexing, hourly aggregation |
| **Storage** | Time-series database |
| **Retention** | Permanent (aggregated) |
| **Validation** | Cross-chain verification |

### Survey Data

**Collection Method**: Annual stakeholder surveys

| Protocol | Details |
|----------|---------|
| **Population** | Validators, grantees, developers |
| **Sampling** | Census attempt + random sample |
| **Response target** | >50% for validators, >30% for others |
| **Administration** | Online survey, translated |

**Survey Schedule**:
- Q1: Annual validator survey
- Q2: Developer ecosystem survey
- Q3: Grantee impact survey
- Q4: User research sample

### Third-Party Data

| Source | Data | Frequency |
|--------|------|-----------|
| IMF | Country classifications | Annual |
| World Bank | Economic indicators | Annual |
| Electric Coin Co. | Privacy-preserving analytics | As available |

## Data Quality Framework

### Quality Dimensions

| Dimension | Definition | Standard |
|-----------|------------|----------|
| **Accuracy** | Correct representation | <5% error rate |
| **Completeness** | All required data present | >90% complete |
| **Timeliness** | Available when needed | Within SLA |
| **Consistency** | Same methodology over time | Documented changes |

### Quality Indicators

| Indicator | Level | Description |
|-----------|-------|-------------|
| 🟢 **High** | Primary data, verified | >80% primary, cross-validated |
| 🟡 **Medium** | Mixed sources | 50-80% primary |
| 🔴 **Low** | Estimates | <50% primary or modeled |

### Data Governance

**Roles**:
- **Data Owner**: Impact Lead
- **Data Steward**: Sustainability Team
- **Data Custodian**: Engineering Team

**Processes**:
- Monthly data quality reviews
- Quarterly methodology reviews
- Annual external audit of key metrics

## Calculation Methodologies

### Aggregation Rules

| Metric Type | Aggregation | Notes |
|-------------|-------------|-------|
| Counts | Sum or unique count | Specify deduplication |
| Rates | Weighted average | Weight by activity |
| Financial | Sum in USD | Using daily price |

### Normalization

**Currency**: All financial metrics normalized to USD using:
- Daily closing price (CoinGecko)
- Period average for aggregates

**Time**: All metrics reported in UTC with clear period boundaries.

### Estimation Methods

For incomplete data:
1. **Response extrapolation**: Scale survey responses by response rate
2. **Industry proxy**: Use comparable industry data with adjustment factor
3. **Model estimation**: Statistical model with disclosed assumptions

All estimates flagged with methodology and uncertainty range.

## Reporting Standards

### Disclosure Requirements

Each metric report includes:

| Element | Requirement |
|---------|-------------|
| **Value** | Current period value |
| **Comparison** | Prior period + year-over-year |
| **Target** | Progress against stated goal |
| **Quality** | Data quality indicator |
| **Methodology** | Link to full methodology |
| **Limitations** | Known gaps or issues |

### Report Formats

| Report | Frequency | Detail Level |
|--------|-----------|--------------|
| Dashboard | Real-time | Summary |
| Monthly Brief | Monthly | Key metrics |
| Quarterly Report | Quarterly | Full detail |
| Annual Report | Annual | Comprehensive + narrative |

### Audit Trail

All impact metrics maintain:
- Raw data archives
- Calculation scripts (version controlled)
- Change log for methodology updates
- Audit access for third-party reviewers

## Continuous Improvement

### Review Cycle

| Activity | Frequency |
|----------|-----------|
| Data quality check | Monthly |
| Methodology review | Quarterly |
| Stakeholder feedback | Quarterly |
| External assessment | Biennial |
| Framework update | Annual |

### Change Management

For methodology changes:
1. Document rationale
2. Assess comparability impact
3. Calculate restated historical data (if material)
4. Communicate to stakeholders
5. Update documentation

### Learning Integration

- Document measurement challenges and solutions
- Share learnings with impact measurement community
- Contribute to standards development (IRIS+, IMP)

## Related LPs

- **LP-800**: ESG Principles and Commitments
- **LP-900**: Impact Framework & Theory of Change
- **LP-910**: Stakeholder Engagement
- **LP-920**: Community Development & Grants
- **LP-930**: Financial Inclusion Metrics
- **LP-860**: Evidence Locker Index

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
