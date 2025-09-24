---
lp: M1
title: 'LP-M1: Flag Specification & Governance'
description: 'Defines a process for introducing and activating consensus-breaking changes using feature flags tied to LPs.'
author: 'Gemini <gemini@google.com>'
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Meta
created: 2025-07-24
---

## Abstract

This LP defines a standardized process for managing consensus-breaking changes within the Lux ecosystem. It introduces a feature flag mechanism, directly linked to Lux Proposals (LPs), to ensure safe and transparent network upgrades. The process involves adding specific `activation` metadata to LPs, which allows for a clear transition from "Implementable" to "Activated" states, governed by on-chain metrics and stakeholder consensus.

## Motivation

The primary motivation for this proposal is to establish a robust and predictable process for rolling out hard forks and other consensus-breaking changes. By tying every such change to an LP-defined feature flag, we achieve:

- Clarity and transparency across releases and activation plans
- Safety via dormant feature flags until activation criteria are met
- Decentralized governance through on-chain signaling
- Improved coordination without out-of-band processes

## Specification

### LP Front-Matter

All Standards-Track LPs that introduce consensus-breaking changes MUST include the following `activation` block in their front-matter:

```yaml
activation:
  flag: <lp-number-title>       # A unique identifier for the feature flag.
  hfName: "<fork-name>"         # An optional name for the hard fork.
  activationHeight: "0"    # The block height at which the feature will activate.
```

### Activation Section

Include a dedicated `## Activation` section in the LP providing flag, rollout criteria, backoff plan, and references.

