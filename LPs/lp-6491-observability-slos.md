---
lp: 6491
title: LuxDA Observability & SLOs
description: LuxDA Observability & SLOs specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines observability requirements and service level objectives (SLOs) for LuxDA Bus operators.

## Specification

### 1. Required Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `luxda_headers_processed_total` | Counter | Headers processed |
| `luxda_blobs_stored_bytes` | Gauge | Bytes stored |
| `luxda_relay_latency_ms` | Histogram | Message propagation |
| `luxda_da_retrieval_latency_ms` | Histogram | Blob retrieval |
| `luxda_peer_count` | Gauge | Connected peers |

### 2. SLO Definitions

| SLI | Target | Measurement |
|-----|--------|-------------|
| Header finality | 99.9% < 2s | p99 finality time |
| DA availability | 99.9% retrievable | Sample queries |
| Relay latency | 99% < 500ms | p99 propagation |
| API uptime | 99.9% | Health checks |

### 3. Alerting Rules

```yaml
alerts:
  - name: HighRelayLatency
    expr: histogram_quantile(0.99, luxda_relay_latency_ms) > 1000
    for: 5m
    severity: warning

  - name: DAAvailabilityDegraded
    expr: luxda_da_retrieval_success_rate < 0.99
    for: 10m
    severity: critical

  - name: LowPeerCount
    expr: luxda_peer_count < 10
    for: 5m
    severity: warning
```

### 4. Runbooks

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| Relay partition | Low peer count | Restart, check firewall |
| DA retrieval failure | High retrieval latency | Check DA operators |
| Storage exhaustion | Disk usage > 90% | Prune, add storage |

---

*LP-6491 v1.0.0 - 2026-01-02*

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

