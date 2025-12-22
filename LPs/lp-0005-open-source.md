---
lp: 5
title: Open Source
description: Lux Network's open source strategy, forking philosophy, and contribution guidelines
author: Lux Core Team
status: Final
type: Meta
created: 2025-12-21
tags: [network, core, open-source, forking, contributions]
order: 5
tier: core
requires: [4]
---

# LP-0005: Open Source

## Abstract

This document defines Lux Network's open source strategy, including our approach to strategic forking, upstream contribution policies, and community engagement. Building on the principles established in [LP-4: Philosophy](./lp-0004-philosophy.md), this LP provides the practical framework for open source development.

## Motivation

Open source is not merely a licensing choice—it is a commitment to transparency, collaboration, and community empowerment. Lux Network embraces open source as a core value while maintaining the sovereignty necessary for critical infrastructure.

## Specification

### Strategic Forking

Every critical component of Lux infrastructure exists in the `luxfi/` namespace under our direct control:

| Upstream | Lux Fork | Purpose |
|----------|----------|---------|
| go-ethereum | luxfi/geth | EVM execution |
| avalanchego | luxfi/node | Consensus engine |
| Various | luxfi/* | All dependencies |

### Forking Principles

1. **Fork to extend, not to abandon**: We maintain upstream compatibility where beneficial
2. **Security-first**: Immediate patching without waiting for upstream
3. **Performance-tailored**: Optimizations specific to our use cases
4. **Simplicity**: Remove code paths we don't need

### Contribution Guidelines

- All code contributions must follow the [Contributor License Agreement](../CONTRIBUTING.md)
- External contributions are reviewed for security and alignment
- Upstream improvements are contributed back when beneficial to both communities

### Namespace Policy

All Lux packages use the `luxfi/` or `@luxfi/` namespace:
- Go: `github.com/luxfi/*`
- NPM: `@luxfi/*`
- No direct dependencies on upstream packages in production code

## Rationale

Maintaining forks requires engineering resources but provides:
- Complete control over release timing
- Ability to diverge when upstream decisions conflict with our needs
- Security patches without disclosure delays
- Performance optimizations for our specific workloads

## Backwards Compatibility

This LP establishes policy and does not affect existing implementations.

## Security Considerations

Open source transparency must be balanced with responsible disclosure. Security vulnerabilities are handled through:
1. Private disclosure channels
2. Coordinated fix development
3. Public disclosure after patches are deployed

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
