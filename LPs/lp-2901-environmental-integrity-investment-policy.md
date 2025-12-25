---
lp: 2901
title: Environmental Integrity Investment Policy
tags: [investment, environment, carbon, sustainability]
description: Investment policy for environmental integrity - measurable improvement, not vibes.
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Meta
created: 2025-12-17
requires: 2900, 2920
order: 2901
---

# LP-751: Environmental Integrity Investment Policy

## Abstract

Lux Vision Fund treats environmental integrity as a baseline requirement for every investment. We prioritize projects that reduce net harm and/or create net-positive restoration relative to a defined baseline, and we commit to measuring outcomes over time—not just at launch.

**Principle**: Measurable improvement, not vibes.

## Motivation

Environmental claims in investment are often vague, unverifiable, or outright misleading. Many funds claim "green" or "sustainable" investments without rigorous baselines, materiality assessments, or ongoing verification. This undermines trust and dilutes the impact of genuine environmental investments.

This policy establishes:
1. **Mandatory baselines** - No investment without clear before/after comparison framework
2. **Materiality focus** - Track only metrics that matter for each project type
3. **Continuous verification** - Annual reporting with third-party audits for material claims
4. **Anti-greenwashing** - No public claims without verifiable evidence

## What Qualifies as "E-Aligned"

### 1. Baseline First

Every project defines what the world looks like without it:

| Baseline Element | Requirement |
|------------------|-------------|
| **Energy use** | Current state and trajectory |
| **Emissions** | GHG footprint (Scope 1, 2, 3 where material) |
| **Materials** | Resource consumption patterns |
| **Land/water impacts** | Geographic and hydrological effects |
| **Biodiversity pressures** | Species and ecosystem impacts |

**No baseline = no investment.**

### 2. Materiality

We track only the few environmental variables that actually matter for that project.

| Project Type | Material Variables |
|--------------|-------------------|
| **AI/Compute** | Energy intensity, carbon intensity, hardware lifecycle |
| **Fintech** | Operational footprint, enabled emissions (Scope 3) |
| **Physical goods** | Materials, manufacturing, transport, end-of-life |
| **Nature-based** | Biodiversity, carbon sequestration, water |
| **Infrastructure** | Construction, operations, resilience |

**Too many metrics = no accountability. Focus on what moves the needle.**

### 3. Lifecycle Thinking

We consider environmental impact across the full lifecycle:

```
Supply Chain → Manufacturing → Operations → Use Phase → End-of-Life
      ↑              ↑             ↑            ↑            ↑
   Material     Embodied      Operational   Customer    Disposal/
   sourcing      carbon         energy        impact     recycling
```

Not every project tracks every phase—but every project identifies which phases matter.

### 4. Verification

Environmental claims require:

| Requirement | Standard |
|-------------|----------|
| **KPIs** | Quantified, time-bound metrics |
| **Data sources** | Named, accessible, auditable |
| **Methodology** | Documented calculation approach |
| **Verifier attestation** | Third-party or auditable self-verification |

**No verification = no claim.**

## KPI Framework

### Standard Environmental KPIs

Choose what's relevant per deal:

#### Energy Intensity

| Metric | Unit | Use Case |
|--------|------|----------|
| **Energy per output** | kWh/unit | Manufacturing, compute |
| **Energy per revenue** | kWh/$1M revenue | General business |
| **PUE** | Ratio | Data centers |

#### Carbon Intensity

| Metric | Unit | Use Case |
|--------|------|----------|
| **Scope 1 emissions** | tCO2e | Direct operations |
| **Scope 2 emissions** | tCO2e | Purchased energy |
| **Scope 3 emissions** | tCO2e | Value chain (where material) |
| **Carbon per unit** | kgCO2e/unit | Product carbon footprint |
| **Reduction vs baseline** | % | Progress tracking |

#### Water

| Metric | Unit | Use Case |
|--------|------|----------|
| **Water use** | m³ | Total consumption |
| **Water intensity** | m³/unit | Per-output efficiency |
| **Discharge quality** | mg/L by pollutant | Effluent standards |
| **WUE** | L/kWh | Data center water use |

#### Materials & Circularity

| Metric | Unit | Use Case |
|--------|------|----------|
| **Recycled content** | % by mass | Input circularity |
| **Recyclability** | % by mass | Output circularity |
| **Waste diverted** | tonnes | Landfill avoidance |
| **Hazardous waste** | tonnes | Toxic materials |

#### Biodiversity & Nature

| Metric | Unit | Use Case |
|--------|------|----------|
| **Habitat protected** | hectares | Conservation |
| **Habitat restored** | hectares | Restoration |
| **Species benefit** | count | Biodiversity projects |
| **Deforestation avoided** | hectares | Forest protection |

#### Compute Efficiency (AI/Tech)

| Metric | Unit | Use Case |
|--------|------|----------|
| **Training energy** | kWh/model | Model development |
| **Inference energy** | Wh/1K tokens | Production serving |
| **CO2e per task** | gCO2e | Carbon efficiency |
| **Efficiency improvement** | % vs baseline | Progress tracking |

## Eligibility Criteria

### Minimum Requirements

| Criterion | Requirement |
|-----------|-------------|
| **Baseline defined** | Clear counterfactual established |
| **Material KPIs identified** | 2-5 KPIs that matter |
| **Measurement plan** | How data will be collected |
| **Targets set** | Quantified, time-bound goals |
| **Verification approach** | How claims will be verified |

### Preferred Characteristics

| Characteristic | Scoring Bonus |
|----------------|---------------|
| **Net-positive impact** | Creates environmental benefit beyond neutral |
| **Science-based targets** | Aligned with SBTi or equivalent |
| **Third-party certification** | B Corp, ISO 14001, etc. |
| **Circular design** | Products designed for circularity |
| **Nature-based solutions** | Leverages natural systems |

### Red Flags (Requires Deep Diligence)

| Flag | Concern |
|------|---------|
| **High-emission baseline** | May be improving from bad starting point |
| **Offset-dependent** | Relies on offsets vs. real reduction |
| **Unverifiable claims** | Can't demonstrate outcomes |
| **Scope 3 blind spots** | Ignores material value chain impacts |

## Enforcement

### Outcome-Gated Releases

Capital is deployed in tranches tied to verified environmental milestones:

| Tranche | Trigger |
|---------|---------|
| **Initial (30%)** | Baseline verified, measurement system operational |
| **Progress (40%)** | Mid-term milestone verified |
| **Completion (30%)** | End-of-period targets achieved |

### Claims Registry

Every environmental claim is logged:

```
claim_id: "E-2025-001"
project: "Project Alpha"
claim: "50% reduction in carbon intensity vs 2024 baseline"
baseline_value: 100 kgCO2e/unit
current_value: 50 kgCO2e/unit
data_source: "Internal metering + utility bills"
methodology: "GHG Protocol Corporate Standard"
verifier: "Third-Party Auditor Inc."
evidence_hash: "QmXxxxx..."
date: "2025-12-01"
```

### No-Greenwashing Rule

**If we can't measure it, we don't market it.**

| Claim Type | Marketing Allowed? |
|------------|-------------------|
| **Verified, quantified** | ✅ Yes |
| **Estimated, methodology disclosed** | ⚠️ With caveats |
| **Aspirational, no data** | ❌ No |
| **Vague ("eco-friendly")** | ❌ Never |

### Consequences

| Situation | Action |
|-----------|--------|
| **Milestone missed** | Tranche withheld until remediation |
| **Unverifiable claim** | Claim retracted, marketing stopped |
| **Material misrepresentation** | Investment review, potential termination |
| **Persistent non-compliance** | Exit from portfolio |

## Reporting Requirements

### Quarterly Updates

| Element | Requirement |
|---------|-------------|
| **KPI dashboard** | Current vs. target for all material KPIs |
| **Trend analysis** | Direction of travel |
| **Issues flagged** | Any measurement or performance concerns |

### Annual Deep Report

| Section | Contents |
|---------|----------|
| **Methodology review** | Any changes to measurement approach |
| **Year-over-year comparison** | Progress against baseline |
| **Third-party verification** | Audit results (for material claims) |
| **Improvement plan** | Next year's priorities |

### Public Disclosure

| Disclosure | Location |
|------------|----------|
| **Portfolio carbon footprint** | Annual fund report |
| **Project-level performance** | Project pages (with consent) |
| **Claims registry** | Public registry (aggregate) |

## Related LPs

- **LP-750**: Lux Vision Fund ESG Investment Framework
- **LP-752**: Social Benefit Investment Policy
- **LP-753**: Governance & Ecosystem Architecture
- **LP-800**: ESG Principles and Commitments
- **LP-801**: Carbon Accounting Methodology
- **LP-840**: Impact Disclosure & Anti-Greenwashing Policy

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
