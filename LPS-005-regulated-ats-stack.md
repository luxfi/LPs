---
lps: 005
title: Regulated ATS Stack Architecture
tags: [ats, bd, ta, bank, forex, futures, clob, compliance]
description: Unified architecture for globally regulated alternative trading system
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Markets
created: 2024-06-15
updated: 2026-02-28
requires:
  - LPS-001 (Digital Securities)
  - LPS-002 (Compliance Hook)
references:
  - lp-9020 (CLOB Precompile)
  - lp-9010 (DEX PoolManager)
---

# LPS-005: Regulated ATS Stack Architecture

## Abstract

This specification defines the architecture of the Lux Regulated ATS Stack — a modular, globally compliant financial infrastructure that combines an Alternative Trading System (ATS), Broker-Dealer (BD), Transfer Agent (TA), banking services, foreign exchange, and futures clearing into a single deployable platform.

Each module maps to exactly one regulatory license type and runs as an independent Go service. The modules compose via well-defined HTTP/gRPC interfaces, share no database state, and can be deployed independently or as a unified stack.

## Architecture

### Module Map

| Module | Binary | Port | Regulatory Shape | License |
|--------|--------|------|-----------------|---------|
| `dex` | `lxd` | :8085 | ATS | SEC Reg ATS |
| `broker` | `brokerd` | :8080 | BD/RIA | FINRA |
| `captable` | `captabled` | :8075 | TA | SEC |
| `bank` | `bankd` | :8070 | Bank/MSB | IOM MTL |
| `forex` | `forexd` | :8086 | BaaS/MTL | IOM MTL |
| `futures` | `futuresd` | :8090 | FCM | NFA |
| `exchange` | (SPA) | :3000 | DEX | On-chain |

### Service Topology

```
┌─────────────────────────────────────────────────────┐
│                    FRONTENDS                         │
│   exchange (DEX SPA)    bank dash    admin (Base)    │
├─────────────────────────────────────────────────────┤
│                  PLATFORM LAYER                      │
│         bank (Hanzo Base) — accounts, KYC,           │
│         payments, compliance, audit                  │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  broker  │  forex   │ futures  │ captable │  dex    │
│  BD/RIA  │  BaaS    │  FCM     │  TA      │  ATS   │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│              PAYMENT RAILS                           │
│  SEPA · FPS · ACH · SWIFT · Interac · Wire          │
├─────────────────────────────────────────────────────┤
│              PROVIDERS                               │
│  Alpaca · IBKR · Apex · CurrencyCloud · OpenPayd    │
│  LMAX · Circle                                       │
└─────────────────────────────────────────────────────┘
```

### Provider Interfaces

Each module defines a Go interface that providers must implement:

- **broker**: `Provider` (16 methods), `OptionsProvider` (8), `MarginProvider` (4)
- **forex**: `FXProvider` (6 methods) — pairs, quotes, orders, positions, rates
- **futures**: `FuturesProvider` (6 methods) — contracts, quotes, orders, margin
- **captable**: `TAProvider` — issuance, transfers, corporate actions, cap table

### Payment Rail Detection

The bank module detects the appropriate payment network based on currency and jurisdiction:

| Currency | Domestic | International |
|----------|----------|---------------|
| EUR | SEPA / SEPA Instant | SWIFT |
| GBP | FPS (Faster Payments) | SWIFT |
| USD | ACH | Wire (SWIFT) |
| CAD | Interac | SWIFT |

Rail selection is automatic via `DetectRail(currency, senderCountry, recipientCountry)`.

### Compliance Pipeline

Every financial operation passes through compliance hooks before execution:

1. **KYC Gate**: Account must have `kycStatus = "approved"`
2. **AML Screening**: Transactions exceeding threshold screened via compliance service
3. **Sanctions Check**: Beneficiary creation screened against sanctions lists
4. **PEP Screening**: Account creation flagged for politically exposed persons
5. **Audit Trail**: All state transitions logged to immutable audit collection

### Security Model

- All secrets from KMS (Hanzo KMS / Infisical)
- HMAC-SHA256 webhook authentication (constant-time comparison)
- Atomic balance operations (database transactions prevent overdraft)
- Owner-scoped API rules on all collections
- CORS from environment variables (no hardcoded origins)
- Immutable audit log (delete/update blocked unconditionally)

## Deployment

Each module produces Docker images tagged `:main` (production), `:test` (testnet), `:dev` (devnet).

White-label deployments consume the same images with different runtime configuration:
- Brand config via `/config.json` (K8s ConfigMap or KMS)
- Provider credentials via environment variables
- CORS origins via `CORS_ALLOWED_ORIGINS`
- No code changes required for white-label

## History

- 2020: Initial broker prototype (Alpaca integration)
- 2021: Bank module (NestJS), CurrencyCloud integration
- 2022: IBKR integration, compliance framework
- 2023: DEX/CLOB matching engine (Go + C++)
- 2024: Cap table, futures module, FPGA PoC
- 2025: Options trading, multi-leg strategies, Apex provider
- 2026-02: Bank migration to Hanzo Base, OpenPayd, payment rails
