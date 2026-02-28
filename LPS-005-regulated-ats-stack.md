---
lps: 005
title: MTL Platform Architecture
tags: [mtl, digital-securities, bank, forex, futures, compliance, white-label]
description: Modular financial platform architecture for MTL-licensed digital securities operations
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Markets
created: 2021-08-01
updated: 2025-12-25
requires:
  - LPS-001 (Digital Securities)
  - LPS-002 (Compliance Hook)
references:
  - lp-9020 (CLOB Precompile)
  - lp-9010 (DEX PoolManager)
---

# LPS-005: MTL Platform Architecture

## Abstract

This specification defines the architecture of the Lux Financial Platform — a modular, globally compliant digital securities infrastructure. The platform provides banking, foreign exchange, matching, and compliance as independent Go services that compose into a unified stack. White-label operators deploy the same images with their own regulatory licenses (ATS, BD, TA, etc.) and brand configuration.

Lux Group Securities operates from Luxembourg as a digital securities platform. White-label licensees operate under their own regulatory registrations in their respective jurisdictions.

## Architecture

### Module Map

| Module | Binary | Port | Function | License Holder |
|--------|--------|------|----------|---------------|
| `bank` | `bankd` | :8070 | Accounts, payments, compliance, KYC | MTL (Lux Group) |
| `forex` | `forexd` | :8086 | FX execution, payment rails | MTL (Lux Group) |
| `dex` | `lxd` | :8085 | Order matching, market data | MTL (Lux Group) |
| `broker` | `brokerd` | :8080 | Multi-provider order routing | WL operator |
| `futures` | `futuresd` | :8090 | Futures/commodities | WL operator |
| `captable` | `captabled` | :8075 | Cap table, corporate actions | WL operator |
| `exchange` | (SPA) | :3000 | DEX frontend | On-chain |

### Service Topology

```
┌─────────────────────────────────────────────────────┐
│                    FRONTENDS                         │
│   exchange (DEX)      bank dash       admin (Base)   │
├─────────────────────────────────────────────────────┤
│               PLATFORM LAYER (MTL)                   │
│      bank — accounts, KYC, payments, compliance      │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  broker  │  forex   │ futures  │ captable │  dex    │
│  equities│  FX/BaaS │  commod  │  registry│  match  │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│              PAYMENT RAILS                           │
│  SEPA · FPS · ACH · SWIFT · Interac · Wire          │
├─────────────────────────────────────────────────────┤
│              PROVIDERS                               │
│  Alpaca · IBKR · Apex · CurrencyCloud · OpenPayd    │
│  LMAX · Circle                                       │
└─────────────────────────────────────────────────────┘
```

### White-Label Model

The platform is designed for white-label deployment. Each WL operator:

- Deploys the **same Docker images** (no code forks)
- Provides their own **brand config** via runtime `/config.json`
- Holds their own **regulatory licenses** (ATS, BD, TA as needed)
- Uses their own **provider credentials** (Alpaca keys, CurrencyCloud keys, etc.)
- Runs on their own **infrastructure** (separate K8s cluster)

Example: A WL operator with SEC ATS + FINRA BD + SEC TA registrations deploys:
- `ghcr.io/luxfi/broker:main` with their Alpaca/IBKR credentials
- `ghcr.io/luxfi/bank:dev` with their CurrencyCloud keys
- `ghcr.io/luxfi/dex:main` for order matching
- `ghcr.io/luxfi/captable:main` for transfer agent functions

No Lux branding appears in the WL deployment. All customer-facing strings come from brand config.

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
- 2021: Bank module, CurrencyCloud integration
- 2022: IBKR integration, compliance framework
- 2023: Matching engine (Go + C++)
- 2024: Cap table, futures module, FPGA PoC
- 2025: Options trading, multi-leg strategies, Apex provider
- 2026-02: Bank v2, OpenPayd, payment rails, WL separation

## References

### Lux Research Papers
- **lux-lightspeed-dex** — CLOB matching engine (Go/C++/FPGA)
- **lux-perpetuals-derivatives** — Perpetual futures protocol
- **lux-mchain-mpc** — MPC custody for institutional keys
- **lux-economics** — Economic model and fee structure
- **lux-validator-economics** — Validator incentives and staking
- **lux-oracle-infrastructure** — Price feed aggregation
- **lux-credit-lending** — Lending protocol design

### Hanzo Research Papers
- **hanzo-platform** — Base framework for banking services
- **hanzo-api-gateway** — API gateway architecture
- **hanzo-identity-nft** — Identity NFT for KYC attestation

### Zoo Research Papers
- **zoo-dao-governance** — DAO governance framework
- **zoo-tokenomics** — Token economics model
