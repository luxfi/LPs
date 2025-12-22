---
lp: 930
title: Financial Inclusion Metrics
tags: [esg, impact, financial-inclusion, metrics, sdg]
description: Metrics framework for measuring Lux Network's contribution to financial inclusion.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-12-17
requires: [800, 900, 901]
order: 930
---

# LP-930: Financial Inclusion Metrics

## Abstract

This LP establishes the metrics framework for measuring and reporting Lux Network's contribution to financial inclusion. It defines key indicators, data collection methods, and targets aligned with UN Sustainable Development Goals 1 (No Poverty), 8 (Decent Work), and 10 (Reduced Inequalities).

## Motivation

Financial inclusion is central to Lux Network's social mission, yet the term is often used without rigorous definition. Without specific metrics:
1. **Claims are unverifiable** - "Serving the underserved" means nothing without data
2. **Progress is unmeasurable** - Cannot improve what isn't tracked
3. **SDG alignment is superficial** - Must demonstrate actual contribution to targets
4. **Impact investors require evidence** - Vague claims don't satisfy due diligence

This LP operationalizes financial inclusion with specific, measurable indicators that enable genuine accountability and continuous improvement.

## Financial Inclusion Framework

### Definition

**Financial inclusion** means that individuals and businesses have access to useful and affordable financial products and services that meet their needs – transactions, payments, savings, credit, and insurance – delivered in a responsible and sustainable way.

### Lux's Role

Lux Network contributes to financial inclusion by:
1. **Lowering costs**: Reducing transaction and access costs
2. **Expanding access**: Enabling participation without traditional banking
3. **Enabling innovation**: Supporting applications that serve underserved populations
4. **Ensuring transparency**: Providing auditable, trustworthy infrastructure

### SDG Alignment

| SDG | Target | Lux Contribution |
|-----|--------|------------------|
| **SDG 1.4** | Equal rights to economic resources | Access to financial infrastructure |
| **SDG 8.3** | Formalization and growth of MSMEs | Business payment infrastructure |
| **SDG 8.10** | Access to banking and financial services | Inclusive financial infrastructure |
| **SDG 10.c** | Reduce remittance costs to <3% | Low-cost cross-border transfers |

## Core Metrics

### Access Metrics

#### ACC-01: Users in Underserved Regions

**Definition**: Unique addresses actively transacting from countries with <50% banking penetration.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | PI7098 |
| **SDG Indicator** | 8.10.2 |
| **Unit** | Count |
| **Target 2025** | 100,000 |
| **Target 2030** | 10,000,000 |

**Countries included** (banking penetration <50%):
- Sub-Saharan Africa: Nigeria, Kenya, Tanzania, Uganda, Ghana, etc.
- South Asia: Pakistan, Bangladesh, Myanmar
- Southeast Asia: Philippines, Vietnam, Indonesia
- Latin America: Mexico, Colombia, Peru
- Middle East/North Africa: Egypt, Morocco

**Data collection**:
- Wallet country declaration (opt-in)
- IP geolocation (privacy-preserving aggregation)
- Partner application user data

#### ACC-02: First-Time Crypto Users

**Definition**: New addresses with first-ever on-chain transaction on Lux.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | PI2822 (modified) |
| **Unit** | Count per period |
| **Frequency** | Monthly |

**Methodology**:
- Track new address generation
- Cross-reference with known addresses from other chains
- Report "likely first-time" with confidence interval

#### ACC-03: Mobile Access Rate

**Definition**: Percentage of active users accessing via mobile devices.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | OI1571 (modified) |
| **Unit** | Percentage |
| **Target** | >70% in emerging markets |

**Relevance**: Mobile access indicates reaching populations without desktop/laptop computers, which correlates with lower income segments.

### Affordability Metrics

#### AFF-01: Average Transaction Cost

**Definition**: Mean transaction fee for standard value transfer.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | Custom |
| **Unit** | USD |
| **Target 2025** | <$0.01 |
| **Target 2030** | <$0.001 |

**Calculation**:
```
AFF-01 = Mean(tx_fee_USD) WHERE tx_type = 'transfer'
```

#### AFF-02: Cost as % of Transaction Value

**Definition**: Transaction fee as percentage of value transferred.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | Custom |
| **SDG Indicator** | 10.c.1 (for remittances) |
| **Unit** | Percentage |
| **Target** | <1% for amounts >$20 |

**Calculation**:
```
AFF-02 = Mean(tx_fee / tx_value) × 100
```

**Segmentation**:
| Value Range | Target Cost % |
|-------------|---------------|
| <$20 (micro) | <5% |
| $20-$200 | <1% |
| $200-$1000 | <0.5% |
| >$1000 | <0.1% |

#### AFF-03: Cross-Border Transfer Cost

**Definition**: Total cost for a $200 remittance-equivalent transfer.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | Custom |
| **SDG Indicator** | 10.c.1 |
| **Unit** | USD and % |
| **Target** | <$6 (<3%) by 2030 |

**Calculation** includes:
- Network transaction fee
- Partner application fees (if applicable)
- Estimated on/off ramp costs

### Usage Metrics

#### USE-01: Transaction Volume by User Segment

**Definition**: Transaction count and value segmented by user characteristics.

| Segment | Definition |
|---------|------------|
| **Micro users** | <$100 monthly volume |
| **Small users** | $100-$1000 monthly |
| **Medium users** | $1000-$10000 monthly |
| **Large users** | >$10000 monthly |

**Relevance**: High micro/small user share indicates reaching underserved populations.

#### USE-02: Use Case Distribution

**Definition**: Transaction categorization by primary use case.

| Use Case | Indicators |
|----------|------------|
| **Remittances** | Cross-border transfers, stablecoin-to-fiat flows |
| **Payments** | Merchant transactions, recurring payments |
| **Savings** | Stablecoin holding patterns |
| **DeFi access** | Lending, yield participation |

#### USE-03: Retention Rate

**Definition**: Percentage of new users remaining active after 3 months.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | OI7112 (modified) |
| **Unit** | Percentage |
| **Target** | >40% |

**Calculation**:
```
USE-03 = Count(active_month_3) / Count(new_month_0) × 100
```

### Outcome Metrics

#### OUT-01: Value Enabled

**Definition**: Total USD value of transactions by users in underserved regions.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | PI9468 (modified) |
| **Unit** | USD |
| **Frequency** | Monthly |

#### OUT-02: Cost Savings Estimate

**Definition**: Estimated savings compared to traditional alternatives.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | OI2822 (modified) |
| **Unit** | USD |
| **Frequency** | Annual |

**Methodology**:
```
Savings = Volume × (Alternative_fee% - Lux_fee%)
```

Where alternative fee = average traditional remittance cost (currently ~6.4% globally).

#### OUT-03: MSMEs Served

**Definition**: Micro, small, and medium enterprises using Lux for business transactions.

| Attribute | Value |
|-----------|-------|
| **IRIS+ Alignment** | PI2608 |
| **SDG Indicator** | 8.3.1 (indirect) |
| **Unit** | Count |

**Identification**:
- Ecosystem application reporting
- Transaction pattern analysis
- Partner data

## Data Collection

### Primary Sources

| Source | Data | Method |
|--------|------|--------|
| **On-chain** | Transactions, addresses, fees | Automated indexing |
| **Wallet apps** | User demographics, device type | Aggregated analytics |
| **Ecosystem partners** | Use case data, user info | Partner reporting |
| **User surveys** | Qualitative data, outcomes | Annual survey |

### Privacy Preservation

| Principle | Implementation |
|-----------|----------------|
| **Aggregation** | Report only aggregated statistics |
| **Opt-in** | Detailed data only with user consent |
| **Anonymization** | No individual address tracking |
| **Purpose limitation** | Data used only for stated purposes |

### Data Quality

| Metric | Quality Level | Confidence |
|--------|---------------|------------|
| Transaction data | High | ±5% |
| Geographic data | Medium | ±15% |
| User segments | Medium | ±20% |
| Outcome estimates | Low | ±30% |

## Targets & Roadmap

### 2025 Targets

| Metric | Target | Baseline |
|--------|--------|----------|
| ACC-01: Users in underserved regions | 100,000 | TBD |
| AFF-01: Average tx cost | <$0.01 | TBD |
| AFF-03: Remittance cost | <5% | TBD |
| USE-03: Retention rate | >30% | TBD |

### 2027 Targets

| Metric | Target |
|--------|--------|
| ACC-01: Users in underserved regions | 1,000,000 |
| AFF-01: Average tx cost | <$0.005 |
| AFF-03: Remittance cost | <4% |
| USE-03: Retention rate | >35% |

### 2030 Targets

| Metric | Target | SDG Alignment |
|--------|--------|---------------|
| ACC-01: Users in underserved regions | 10,000,000 | SDG 8.10.2 |
| AFF-01: Average tx cost | <$0.001 | SDG 10.c.1 |
| AFF-03: Remittance cost | <3% | SDG 10.c.1 |
| USE-03: Retention rate | >40% | - |
| OUT-02: Cost savings | >$100M cumulative | SDG 1.4 |

## Reporting

### Dashboard

**Location**: `explorer.lux.network/inclusion`

**Contents**:
- Real-time access metrics
- Geographic distribution
- Cost metrics
- Trend charts

### Periodic Reports

| Report | Frequency | Contents |
|--------|-----------|----------|
| Inclusion brief | Monthly | Key metrics summary |
| Quarterly report | Quarterly | Detailed metrics, trends |
| Annual impact report | Annual | Full analysis, outcomes, stories |

### External Alignment

Report metrics to:
- **IRIS+**: Annual contribution to catalog
- **GIIN**: ImpactBase profile
- **SDG reporting**: Annual SDG contribution report

## Initiatives

### Supporting Programs

| Initiative | Goal | Metrics Link |
|------------|------|--------------|
| **Low-fee corridors** | Target <3% cost on key remittance routes | AFF-02, AFF-03 |
| **Mobile-first apps** | Fund mobile wallet development | ACC-03 |
| **Regional expansion** | Support developers in emerging markets | ACC-01 |
| **Education** | Financial literacy programs | OUT-03 |

### Partnerships

| Partner Type | Purpose | Example |
|--------------|---------|---------|
| **Fintech apps** | User acquisition in target markets | Mobile wallets |
| **Remittance providers** | On/off ramp integration | Regional providers |
| **NGOs** | Reaching underserved communities | Financial inclusion orgs |
| **Research** | Impact measurement validation | Universities |

## Governance

### Oversight

- **Impact Lead**: Day-to-day metric tracking
- **ESG Committee**: Quarterly review
- **Board**: Annual strategy review

### Target Setting

Annual process:
1. Review prior year performance
2. Assess market opportunity
3. Propose targets to ESG Committee
4. Board approval
5. Public commitment

### Continuous Improvement

- Annual methodology review
- Stakeholder feedback integration
- Academic partnership for validation
- Industry benchmarking

## Related LPs

- **LP-800**: ESG Principles and Commitments
- **LP-900**: Impact Framework & Theory of Change
- **LP-901**: Impact Measurement Methodology
- **LP-910**: Stakeholder Engagement
- **LP-920**: Community Development & Grants
- **LP-850**: ESG Standards Alignment Matrix

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
