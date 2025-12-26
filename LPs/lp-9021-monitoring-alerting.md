---
lp: 9021
title: Monitoring & Alerting Standards
description: Real-time monitoring, metrics collection, and alerting infrastructure for production DeFi
author: Lux Core Team
status: Superseded
tags: [dex, trading]
type: Standards Track
category: Core
created: 2025-01-15
requires: [9016, 9020]
order: 21
---

# LP-9021: Monitoring & Alerting Standards

## Abstract

This LP defines comprehensive monitoring, metrics collection, and alerting standards for Lux DeFi infrastructure. Ensures real-time visibility, anomaly detection, and rapid incident response for protocols handling billions in TVL.

## Motivation

Production DeFi monitoring must provide:
- Real-time visibility into protocol health
- Early warning for anomalies and attacks
- Rapid incident detection and response
- Compliance and audit trails
- Performance optimization insights

## Specification

### 1. Metrics Categories

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMetricsCollector {
    // Business metrics
    struct VolumeMetrics {
        uint256 volume24h;
        uint256 volume7d;
        uint256 volume30d;
        uint256 tradeCount24h;
        uint256 uniqueTraders24h;
    }

    struct LiquidityMetrics {
        uint256 tvl;
        uint256 tvlChange24h;
        uint256 utilizationRate;
        uint256 depth1Percent;
        uint256 depth5Percent;
    }

    struct PriceMetrics {
        uint256 currentPrice;
        uint256 priceChange24h;
        uint256 volatility24h;
        uint256 highPrice24h;
        uint256 lowPrice24h;
    }

    // Operational metrics
    struct SystemMetrics {
        uint256 latencyP50;
        uint256 latencyP99;
        uint256 errorRate;
        uint256 throughputTPS;
        uint256 pendingTransactions;
    }

    struct SecurityMetrics {
        uint256 failedTxCount;
        uint256 rejectedOrders;
        uint256 circuitBreakerTriggers;
        uint256 anomalyScore;
        uint256 riskLevel;
    }
}
```solidity

### 2. Core Metrics Standards

| Category | Metric | Type | Collection Interval |
|----------|--------|------|---------------------|
| **Volume** |
| | Total Volume (USD) | Counter | Real-time |
| | Trade Count | Counter | Real-time |
| | Unique Users | Gauge | 1 minute |
| | Average Trade Size | Gauge | 5 minutes |
| **Liquidity** |
| | TVL (USD) | Gauge | 1 minute |
| | Pool Utilization | Gauge | 1 minute |
| | Liquidity Depth | Gauge | 5 minutes |
| | Impermanent Loss | Gauge | 1 hour |
| **Price** |
| | Spot Price | Gauge | Real-time |
| | Oracle Price | Gauge | Real-time |
| | Price Deviation | Gauge | Real-time |
| | TWAP (Various) | Gauge | 1 minute |
| **Performance** |
| | Transaction Latency | Histogram | Real-time |
| | Block Time | Gauge | Per block |
| | Gas Used | Histogram | Real-time |
| | Throughput (TPS) | Gauge | 1 second |
| **Security** |
| | Failed Transactions | Counter | Real-time |
| | Rejected Orders | Counter | Real-time |
| | Large Withdrawals | Counter | Real-time |
| | Anomaly Score | Gauge | 1 minute |

### 3. Alerting Rules

```yaml
# alerting_rules.yaml
groups:
  - name: defi_critical
    rules:
      # Price deviation alert
      - alert: OraclePriceDeviation
        expr: abs(spot_price - oracle_price) / oracle_price > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Price deviation > 5% detected"
          description: "Spot: {{ $value.spot }} Oracle: {{ $value.oracle }}"

      # TVL drain alert
      - alert: RapidTVLDrain
        expr: (tvl_1h_ago - tvl_current) / tvl_1h_ago > 0.20
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "TVL dropped >20% in 1 hour"

      # High error rate
      - alert: HighErrorRate
        expr: error_rate > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Error rate exceeds 1%"

      # Latency spike
      - alert: HighLatency
        expr: latency_p99 > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency > 1 second"

  - name: defi_security
    rules:
      # Unusual transaction pattern
      - alert: AnomalousActivity
        expr: anomaly_score > 0.8
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Anomalous activity detected"

      # Flash loan detection
      - alert: FlashLoanDetected
        expr: flash_loan_count > 0
        labels:
          severity: warning
        annotations:
          summary: "Flash loan transaction detected"

      # Large withdrawal
      - alert: LargeWithdrawal
        expr: single_withdrawal_usd > 1000000
        labels:
          severity: warning
        annotations:
          summary: "Withdrawal > $1M detected"

      # Circuit breaker triggered
      - alert: CircuitBreakerTriggered
        expr: circuit_breaker_active == 1
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker has been triggered"
```

### 4. Dashboard Specifications

```typescript
interface DashboardConfig {
  // Executive Overview Dashboard
  executive: {
    panels: [
      {
        title: 'Total Value Locked',
        type: 'stat',
        query: 'sum(tvl_usd)',
        thresholds: [
          { value: 0, color: 'red' },
          { value: 1e9, color: 'yellow' },
          { value: 10e9, color: 'green' },
        ],
      },
      {
        title: '24h Volume',
        type: 'stat',
        query: 'sum(volume_24h_usd)',
      },
      {
        title: 'Active Users (24h)',
        type: 'stat',
        query: 'count(unique_users_24h)',
      },
      {
        title: 'Protocol Revenue (24h)',
        type: 'stat',
        query: 'sum(fees_collected_24h_usd)',
      },
    ],
  },

  // Operations Dashboard
  operations: {
    panels: [
      {
        title: 'Transaction Latency',
        type: 'graph',
        queries: [
          { legend: 'P50', query: 'latency_p50' },
          { legend: 'P95', query: 'latency_p95' },
          { legend: 'P99', query: 'latency_p99' },
        ],
      },
      {
        title: 'Error Rate',
        type: 'graph',
        query: 'error_rate * 100',
        yAxis: { max: 5, unit: 'percent' },
      },
      {
        title: 'Throughput (TPS)',
        type: 'graph',
        query: 'rate(transaction_count[1m])',
      },
    ],
  },

  // Security Dashboard
  security: {
    panels: [
      {
        title: 'Risk Level',
        type: 'gauge',
        query: 'risk_level',
        thresholds: [
          { value: 0, color: 'green', label: 'Low' },
          { value: 3, color: 'yellow', label: 'Medium' },
          { value: 7, color: 'red', label: 'High' },
        ],
      },
      {
        title: 'Anomaly Detection',
        type: 'timeseries',
        query: 'anomaly_score',
      },
      {
        title: 'Circuit Breaker Status',
        type: 'status-panel',
        query: 'circuit_breaker_status',
      },
      {
        title: 'Recent Security Events',
        type: 'logs',
        query: 'security_events{level="warning"}',
      },
    ],
  },
}
```solidity

### 5. Log Aggregation

```typescript
interface LogConfig {
  // Structured log format
  logFormat: {
    timestamp: string;      // ISO 8601
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    service: string;
    traceId: string;
    spanId: string;
    message: string;
    metadata: Record<string, any>;
  };

  // Log categories
  categories: {
    transaction: {
      fields: ['txHash', 'from', 'to', 'value', 'gas', 'status'];
      retention: '90 days';
    };
    security: {
      fields: ['eventType', 'severity', 'source', 'target', 'action'];
      retention: '365 days';
    };
    audit: {
      fields: ['actor', 'action', 'resource', 'result', 'ip'];
      retention: '7 years';
    };
    performance: {
      fields: ['operation', 'duration', 'gasUsed', 'success'];
      retention: '30 days';
    };
  };
}

// Example log entries
const logExamples = [
  {
    timestamp: '2025-01-15T10:30:00.000Z',
    level: 'info',
    service: 'dex-engine',
    traceId: 'abc123',
    spanId: 'def456',
    message: 'Order executed successfully',
    metadata: {
      orderId: '0x...',
      pair: 'LUX/USDC',
      side: 'buy',
      amount: '1000',
      price: '10.50',
      latencyMs: 25,
    },
  },
  {
    timestamp: '2025-01-15T10:30:05.000Z',
    level: 'warn',
    service: 'risk-engine',
    traceId: 'ghi789',
    spanId: 'jkl012',
    message: 'Large withdrawal detected',
    metadata: {
      user: '0x...',
      amount: '5000000',
      token: 'USDC',
      percentOfPool: 3.5,
    },
  },
];
```

### 6. Anomaly Detection

```python
# anomaly_detector.py
import numpy as np
from sklearn.ensemble import IsolationForest
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class AnomalyResult:
    timestamp: float
    score: float  # -1 to 1, higher = more anomalous
    features: Dict[str, float]
    is_anomaly: bool
    anomaly_type: str

class DeFiAnomalyDetector:
    def __init__(self):
        self.models = {
            'volume': IsolationForest(contamination=0.01),
            'price': IsolationForest(contamination=0.01),
            'user_behavior': IsolationForest(contamination=0.05),
        }
        self.thresholds = {
            'volume_spike': 10.0,  # 10x normal
            'price_deviation': 0.10,  # 10%
            'concentration': 0.20,  # 20% of pool
        }

    def detect_volume_anomaly(self, current: float, historical: List[float]) -> AnomalyResult:
        mean = np.mean(historical)
        std = np.std(historical)
        z_score = (current - mean) / std if std > 0 else 0

        is_anomaly = abs(z_score) > 3 or current > mean * self.thresholds['volume_spike']

        return AnomalyResult(
            timestamp=time.time(),
            score=min(abs(z_score) / 5, 1.0),
            features={'volume': current, 'z_score': z_score},
            is_anomaly=is_anomaly,
            anomaly_type='volume_spike' if is_anomaly else 'normal',
        )

    def detect_price_manipulation(
        self,
        spot_price: float,
        oracle_price: float,
        twap_price: float
    ) -> AnomalyResult:
        spot_deviation = abs(spot_price - oracle_price) / oracle_price
        twap_deviation = abs(spot_price - twap_price) / twap_price

        score = max(spot_deviation, twap_deviation)
        is_anomaly = spot_deviation > self.thresholds['price_deviation']

        return AnomalyResult(
            timestamp=time.time(),
            score=min(score * 5, 1.0),
            features={
                'spot_price': spot_price,
                'oracle_price': oracle_price,
                'twap_price': twap_price,
                'deviation': spot_deviation,
            },
            is_anomaly=is_anomaly,
            anomaly_type='price_manipulation' if is_anomaly else 'normal',
        )

    def detect_wash_trading(self, trades: List[Dict]) -> AnomalyResult:
        # Analyze trade patterns for wash trading indicators
        # - Same addresses trading with each other
        # - Circular trading patterns
        # - Unusual timing patterns
        pass

    def get_composite_risk_score(self, anomalies: List[AnomalyResult]) -> float:
        if not anomalies:
            return 0.0

        weights = {
            'volume_spike': 0.3,
            'price_manipulation': 0.4,
            'wash_trading': 0.2,
            'concentration': 0.1,
        }

        weighted_sum = sum(
            a.score * weights.get(a.anomaly_type, 0.1)
            for a in anomalies if a.is_anomaly
        )

        return min(weighted_sum, 1.0)
```solidity

### 7. Incident Response Integration

```typescript
interface IncidentResponse {
  // Escalation paths
  escalationLevels: {
    L1: {
      responders: ['on-call-engineer'];
      responseTime: '5 minutes';
      actions: ['acknowledge', 'investigate', 'escalate'];
    };
    L2: {
      responders: ['senior-engineer', 'team-lead'];
      responseTime: '15 minutes';
      actions: ['mitigate', 'coordinate', 'communicate'];
    };
    L3: {
      responders: ['engineering-manager', 'security-team'];
      responseTime: '30 minutes';
      actions: ['emergency-action', 'external-communication'];
    };
    L4: {
      responders: ['cto', 'ceo', 'legal'];
      responseTime: '1 hour';
      actions: ['full-incident-response', 'regulatory-notification'];
    };
  };

  // Runbooks
  runbooks: {
    'high-error-rate': RunbookSteps;
    'tvl-drain': RunbookSteps;
    'oracle-failure': RunbookSteps;
    'security-incident': RunbookSteps;
  };
}
```

## Infrastructure Requirements

| Component | Specification | Redundancy |
|-----------|--------------|------------|
| Metrics Store | Prometheus/VictoriaMetrics | 3x replicated |
| Log Store | Loki/Elasticsearch | 3x replicated |
| Alerting | AlertManager/PagerDuty | Multi-region |
| Dashboards | Grafana | Active-passive |
| Anomaly Detection | Custom ML pipeline | 2x replicated |

## Rationale

The monitoring and alerting standards defined in this LP reflect industry best practices adapted for DeFi-specific requirements. Key design decisions:

1. **Real-time collection** for price and volume metrics enables rapid response to market anomalies
2. **Prometheus-compatible format** ensures compatibility with existing tooling ecosystems
3. **Tiered alerting severity** prevents alert fatigue while ensuring critical issues receive immediate attention
4. **ML-based anomaly detection** catches novel attack patterns that rule-based systems miss
5. **Structured logging** enables efficient querying and compliance reporting

The 1-minute collection interval for TVL balances freshness with resource efficiency, while real-time collection for transaction metrics captures time-sensitive events.

## Backwards Compatibility

This LP is additive and does not break existing monitoring implementations. Protocols can adopt these standards incrementally:

- **Metrics Format**: OpenMetrics/Prometheus format is backwards-compatible with StatsD and other legacy systems through exporters
- **Log Format**: JSON structured logging is parseable by all major log aggregation systems
- **Alerting Rules**: PromQL-based rules can be translated to other alerting systems

Existing monitoring dashboards continue to function. New dashboards following this specification can be deployed alongside legacy dashboards during migration.

## Security Considerations

1. **Access control** - Role-based dashboard access
2. **Data retention** - Compliant log retention
3. **Alert fatigue** - Intelligent alert deduplication
4. **Audit logs** - Immutable audit trail

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
