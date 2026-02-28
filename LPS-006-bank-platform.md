---
lps: 006
title: Bank Platform
tags: [bank, payments, compliance, kyc, aml, sepa, swift]
description: Multi-currency banking platform specification
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Banking
created: 2021-03-10
updated: 2025-11-15
requires:
  - LPS-005 (Regulated ATS Stack)
references:
  - github.com/hanzoai/base
---

# LPS-006: Bank Platform

## Abstract

The Lux Bank Platform is a multi-currency banking system providing accounts, payments, foreign exchange, compliance, and KYC. A single Go binary serves the full API surface including account management, payment execution, fee calculation, and regulatory compliance.

## Collections

| Collection | Fields | API Rules |
|-----------|--------|-----------|
| `accounts` | owner, entityName, entityType, currency, status, kycStatus, riskRating, dailyLimit | owner-scoped list/view |
| `beneficiaries` | account, name, bankName, iban, swiftBic, country, verified | account.owner-scoped |
| `transactions` | account, beneficiary, type, direction, amount, currency, status, reference, ccTransactionId | account.owner-scoped |
| `balances` | account, currency, available, held | superuser only |
| `wallets` | account, currency, walletId, status | account.owner-scoped |
| `conversions` | account, sellCurrency, buyCurrency, sellAmount, buyAmount, rate, quoteId, status | account.owner-scoped |
| `documents` | account, type, file, status, reviewedBy, reviewNote | account.owner-scoped |
| `fees` | transaction, type, amount, currency | superuser only |
| `audit_log` | account, actor, action, detail | superuser only, immutable |
| `sessions` | user, token, expiresAt | user-scoped |

## Custom Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/transfers` | Internal account-to-account transfer |
| POST | `/v1/payments/outbound` | External payment via beneficiary |
| GET | `/v1/accounts/:id/balances` | Multi-currency balance summary |
| GET | `/v1/accounts/:id/wallets` | Account wallet list |
| GET | `/v1/accounts/:id/transactions` | Transaction history |
| POST | `/v1/fx/quote` | FX quote (proxied to forex service) |
| POST | `/v1/fx/execute` | Execute FX conversion |
| GET | `/health` | Service health check |

## Payment Lifecycle

1. **Create**: Validate balance, KYC, limits → hold funds
2. **Route**: Detect rail (SEPA/FPS/ACH/SWIFT/Interac) → forward to forex service
3. **Process**: Forex service executes via provider (CurrencyCloud/OpenPayd)
4. **Complete**: Webhook callback → release hold, debit balance
5. **Audit**: Every state transition logged to immutable audit collection

## Fee Schedule

| Account Type | Rate (bp) | Wire | SEPA | FPS | ACH | Interac |
|-------------|-----------|------|------|-----|-----|---------|
| Individual | 50 | $25 | €5 | £0 | $0 | C$1.50 |
| Business | 30 | $25 | €5 | £0 | $0 | C$1.50 |

Volume discounts: >$100k/mo (5bp off), >$500k/mo (10bp off), >$1M/mo (15bp off).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FOREX_SERVICE_URL` | Yes | Forex service endpoint |
| `COMPLIANCE_SERVICE_URL` | Yes | Compliance service endpoint |
| `WEBHOOK_HMAC_SECRET` | Yes | HMAC key for webhook auth (from KMS) |
| `SMTP_HOST` | No | Email notification SMTP host |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password (from KMS) |
| `SMTP_FROM` | No | Sender email address |
