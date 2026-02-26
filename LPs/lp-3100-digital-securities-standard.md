---
lp: 3100
title: Digital Securities Standard
tags: [securities, compliance, erc-1404, erc-3643, t-rex, ats, cap-table, transfer-agent]
description: Comprehensive specification for digital securities on Lux Network
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Markets
created: 2026-02-26
requires:
  - chain: C
  - chain: T
  - chain: B
references:
  - lp-9010 (DEX Precompile)
  - lp-3020 (LRC-20 Fungible Token)
  - lp-6022 (Warp Messaging)
  - lp-5013 (T-Chain MPC Custody)
---

# LP-3100: Digital Securities Standard

## Abstract

This specification defines how Lux Network implements digital securities on-chain. A security token on Lux is a regulated ERC-20 with embedded compliance enforcement at the transfer layer. The on-chain token contract IS the cap table. The on-chain compliance registry IS the KYC/AML gate. Every transfer, every dividend payment, every corporate action is a verifiable on-chain transaction with an immutable audit trail.

Lux operates the full regulated stack: Alternative Trading System (ATS), Broker-Dealer (BD), and Transfer Agent (TA). The on-chain contracts are the execution layer for all three.

## Motivation

Traditional securities infrastructure relies on:
- Paper cap tables maintained by transfer agents (Computershare, AST)
- Settlement via DTCC with T+1 (formerly T+2) delays
- Reconciliation across multiple intermediaries who each maintain separate ledgers
- Restricted secondary trading through closed systems with limited interoperability

Digital securities on Lux collapse the entire stack into on-chain primitives:
- `SecurityToken.balanceOf()` replaces the shareholder registry
- `ComplianceRegistry.canTransfer()` replaces manual compliance checks
- `DividendDistributor.claim()` replaces paper dividend warrants
- Settlement is atomic and final within 1ms (Lux consensus finality)

The result: 24/7 trading, instant settlement, automated compliance, and a single source of truth.

## Standards Compatibility

### ERC-1404: Simple Restricted Token

The base standard. Every SecurityToken implements ERC-1404, which adds two functions to ERC-20:

```solidity
function detectTransferRestriction(address from, address to, uint256 value)
    external view returns (uint8 restrictionCode);

function messageForTransferRestriction(uint8 restrictionCode)
    external view returns (string memory message);
```

Callers check restrictions before submitting a transfer. Wallets and DEXs use this to display human-readable rejection reasons.

### ERC-3643 (T-REX): Institutional Compliance

ERC-3643 defines the Token for Regulated EXchanges framework. Lux implements the core T-REX concepts through its modular compliance architecture:

| T-REX Concept | Lux Implementation |
|---|---|
| Identity Registry | ComplianceRegistry (whitelist + KYC status) |
| Identity Verification | Off-chain KYC via Hanzo IAM, on-chain attestation |
| Compliance Modules | IComplianceModule interface, pluggable into registry |
| Claim Topics | accreditationStatus field (0=none, 1=accredited, 2=QIB) |
| Trusted Issuers | COMPLIANCE_ROLE holders |

The ComplianceRegistry supports an ordered chain of IComplianceModule implementations. Each module checks a single rule. The registry iterates all modules; the first rejection stops the transfer.

### Restriction Codes

Shared across all contracts in the securities module:

| Code | Constant | Meaning |
|------|----------|---------|
| 0 | SUCCESS | Transfer permitted |
| 1 | SENDER_NOT_WHITELISTED | Sender not in KYC whitelist |
| 2 | RECEIVER_NOT_WHITELISTED | Receiver not in KYC whitelist |
| 3 | SENDER_BLACKLISTED | Sender on sanctions/blacklist |
| 4 | RECEIVER_BLACKLISTED | Receiver on sanctions/blacklist |
| 5 | SENDER_LOCKED | Sender in lockup period |
| 6 | JURISDICTION_BLOCKED | Jurisdiction restriction |
| 7 | ACCREDITATION_REQUIRED | Accreditation check failed |
| 8-15 | Reserved | Future core codes |
| 16 | SENDER_NOT_ON_WHITELIST | Module: whitelist |
| 17 | RECEIVER_NOT_ON_WHITELIST | Module: whitelist |
| 18 | SENDER_LOCKUP_ACTIVE | Module: Rule 144 lockup |
| 19 | SENDER_JURISDICTION_BLOCKED | Module: jurisdiction |
| 20 | RECEIVER_JURISDICTION_BLOCKED | Module: jurisdiction |
| 21 | SENDER_JURISDICTION_UNSET | Module: jurisdiction unset |
| 22 | RECEIVER_JURISDICTION_UNSET | Module: jurisdiction unset |
| 32 | MAX_HOLDERS_REACHED | Transfer restriction engine |
| 33 | TRANSFER_AMOUNT_EXCEEDED | Transfer restriction engine |

## Contract Architecture

### Overview

```
securities/
  interfaces/
    IERC1404.sol            -- ERC-1404 (Simple Restricted Transfer)
    IST20.sol               -- ST-20 (verifyTransfer hook)
    IComplianceModule.sol   -- pluggable compliance interface
  compliance/
    ComplianceRegistry.sol  -- KYC/AML/accreditation registry (central gate)
    WhitelistModule.sol     -- whitelist-based transfer restriction
    LockupModule.sol        -- Rule 144 holding period enforcement
    JurisdictionModule.sol  -- country/jurisdiction restrictions (ISO 3166)
  token/
    SecurityToken.sol       -- base regulated ERC-20 (ERC-1404 + ST-20)
    RestrictedToken.sol     -- ERC-1404 with external restriction engine
    PartitionToken.sol      -- ERC-1400 partitioned security (tranches)
  registry/
    TransferRestriction.sol -- transfer restriction engine (max holders, amount caps)
    DocumentRegistry.sol    -- on-chain document storage (ERC-1643)
  corporate/
    DividendDistributor.sol -- on-chain dividend payments (any ERC-20)
    CorporateActions.sol    -- splits, mergers, forced transfers, seizure
  bridge/
    SecurityBridge.sol      -- cross-chain mint/burn/teleport
```

Source: github.com/luxfi/standard/contracts/securities/

### SecurityToken

The base regulated ERC-20. Inherits ERC20, ERC20Burnable, ERC20Pausable, AccessControl. Implements both IERC1404 and IST20.

Key design decisions:
- Uses OZ v5 _update() hook to enforce compliance on every token movement (transfer, transferFrom, mint, burn)
- Minting (from == address(0)) and burning (to == address(0)) bypass compliance -- the issuer controls supply
- Three roles: DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE
- Compliance is delegated entirely to ComplianceRegistry -- the token has no hardcoded compliance logic

```solidity
function _update(address from, address to, uint256 value) internal virtual override {
    if (from != address(0) && to != address(0)) {
        (bool allowed, uint8 code) = complianceRegistry.canTransfer(from, to, value);
        if (!allowed) revert TransferRestricted(code);
    }
    super._update(from, to, value);
}
```

This means compliance is enforced at the EVM level. No wrapper. No external call required by the user. Every transfer() and transferFrom() passes through compliance automatically.

### ComplianceRegistry

Central KYC/AML/accreditation gate. Stores per-address state:

| Field | Type | Purpose |
|---|---|---|
| isWhitelisted | mapping(address => bool) | KYC-approved |
| isBlacklisted | mapping(address => bool) | Sanctions/blocked |
| lockupExpiry | mapping(address => uint256) | Unix timestamp, Rule 144 |
| jurisdiction | mapping(address => bytes2) | ISO 3166-1 alpha-2 code |
| accreditationStatus | mapping(address => uint8) | 0=none, 1=accredited, 2=QIB |

The canTransfer(from, to, amount) function runs:
1. Core checks: whitelist, blacklist, lockup
2. Pluggable module iteration: each IComplianceModule.checkTransfer() in order
3. First rejection stops the chain

Modules are added/removed by DEFAULT_ADMIN_ROLE. Order matters -- modules execute sequentially.

### IComplianceModule

```solidity
interface IComplianceModule {
    function checkTransfer(address from, address to, uint256 amount)
        external view returns (bool allowed, uint8 restrictionCode);
    function moduleName() external view returns (string memory);
}
```

Shipped modules:

| Module | Rule | Code |
|---|---|---|
| WhitelistModule | Sender and receiver must be on per-module whitelist | 16, 17 |
| LockupModule | Sender lockup timestamp must be in the past | 18 |
| JurisdictionModule | Sender/receiver jurisdiction must not be blocked | 19-22 |

Custom modules implement this interface. Examples: maximum daily transfer volume, investor count caps, cross-border restrictions.

### JurisdictionModule

Enforces geographic restrictions per ISO 3166-1 alpha-2 country codes. Stored as bytes2 (e.g., "US", "GB", "KY").

Features:
- Per-address jurisdiction assignment
- Per-jurisdiction block/unblock
- Configurable requireJurisdiction flag -- when true, accounts without a jurisdiction set are blocked
- Batch assignment for onboarding

### LockupModule

Enforces SEC Rule 144 holding periods. Each address has a lockupExpiry Unix timestamp. If block.timestamp < lockupExpiry, the sender cannot transfer.

Typical lockup periods:
- Rule 144: 6 months (affiliates) / 12 months (non-affiliates, no reporting issuer)
- Reg D: 12 months
- Reg S: 40 days (Category 1) / 12 months (Category 3)

### TransferRestriction

Per-token restriction engine:
- maxHolders: Cap on distinct token holders (Reg D 506(b) = 35 non-accredited)
- maxTransferAmount: Per-transaction cap
- Holder tracking via registerHolder/removeHolder called by the token

### DocumentRegistry

On-chain document storage per ERC-1643:
- Documents identified by bytes32 name (e.g., keccak256("PROSPECTUS"))
- Each document has: URI (IPFS/HTTPS), content hash (SHA-256), last modified timestamp
- Admin-gated set/remove
- Full audit trail via events

Required documents for SEC compliance:
- Offering memorandum / prospectus
- Subscription agreement
- Operating agreement / bylaws
- Transfer restriction legend
- Annual/quarterly financial reports

### DividendDistributor

Snapshot-based pull model for dividend payments:
1. Admin creates a dividend round, specifying payment token (any ERC-20, e.g., USDC) and total amount
2. Payment tokens are transferred to the contract at creation time
3. Holders claim pro-rata based on balance / totalSupply at the snapshot block
4. Unclaimed dividends can be reclaimed by admin after a period

Supports any ERC-20 as the payment token. USDC and LUX are the expected defaults.

### CorporateActions

Regulatory-grade corporate actions:
- Forced transfer: Court order / regulatory seizure. Burns from source, mints to destination (bypasses compliance)
- Seizure: Burns tokens from a sanctioned address
- Batch mint: Stock split distribution to all holders

All actions emit events with reason strings for audit trails. Requires CORPORATE_ACTION_ROLE.

### SecurityBridge

Cross-chain mint/burn/teleport for security tokens. See LPS-003 for full specification.

## tZero Integration

### Partnership

tZero (tzero.com) operates one of six SEC-registered digital Alternative Trading Systems in the US. Lux has a confirmed partnership for cross-listing digital securities.

### Architecture

```
Lux Chain                          tZero ATS
-----------                        ---------
SecurityToken  <-- REST/Webhook --> tZero API
ComplianceRegistry                 tZero KYC
DividendDistributor                tZero Disbursements
SecurityBridge                     tZero Settlement
```

### Webhook API

tZero integration uses REST + HMAC-SHA256 signed webhooks:

Outbound (Lux -> tZero):
- POST /v1/securities/register -- register a new security token for cross-listing
- POST /v1/securities/compliance/sync -- push compliance status updates
- POST /v1/transfers/notify -- notify tZero of on-chain transfers

Inbound (tZero -> Lux):
- POST /webhooks/tzero/trade -- trade execution notification
- POST /webhooks/tzero/settlement -- settlement confirmation
- POST /webhooks/tzero/compliance -- KYC/AML status update

All webhook payloads are:
- Signed with HMAC-SHA256 using a per-integration secret (stored in KMS, never plaintext)
- Timestamped with a 5-minute replay window
- Idempotent via X-Idempotency-Key header

### Compliance Data Sharing

KYC/AML status flows bidirectionally:
1. Investor KYCs on Lux (via Hanzo IAM) -> status synced to tZero via compliance sync API
2. Investor KYCs on tZero -> webhook pushes status to Lux, ComplianceRegistry.whitelistAdd() called
3. Sanctions screening: both systems run independent checks; either can block

Accreditation status mapping:

| Lux accreditationStatus | tZero Equivalent |
|---|---|
| 0 (none) | Unverified |
| 1 (accredited) | Accredited Investor (Rule 501) |
| 2 (QIB) | Qualified Institutional Buyer (Rule 144A) |

### Settlement Bridging

When a trade executes on tZero:
1. tZero sends settlement webhook with trade details
2. Lux settlement service calls SecurityBridge.bridgeMint() or SecurityToken.transfer() depending on whether the recipient is on-chain
3. Compliance is enforced at the contract level regardless of trade origin
4. Settlement confirmation is sent back to tZero

The bridge operator for tZero settlement is a T-Chain MPC multisig (see LP-5013). No single key can execute settlements.

## Regulatory Framework

### United States

SEC ATS Registration (Regulation ATS):
- Lux operates a registered Alternative Trading System under SEC Rule 300-303
- ATS-N filing with the SEC
- FINRA membership required for the broker-dealer entity
- Fair Access Rule: ATS with >5% volume in any NMS security must provide fair access

FINRA Broker-Dealer:
- The broker-dealer entity executes trades and handles customer accounts
- Implements: lux/broker -- Go service handling order routing, best execution, trade reporting
- FINRA Rule 4512: customer account records
- FINRA Rule 3110: supervisory system

Section 17A Transfer Agent:
- SEC-registered Transfer Agent maintains the official shareholder registry
- On Lux, SecurityToken.balanceOf() IS the registry -- the TA engine reads chain state
- Implements: lux/captable -- Go package providing TA-grade cap table operations
- SEC Rule 17Ad-17: lost securityholder provisions
- SEC Rule 17Ad-2: turnaround requirements (moot with instant on-chain settlement)

Exemptions:
- Reg D 506(b): Up to 35 non-accredited investors, no general solicitation
- Reg D 506(c): Unlimited accredited investors, general solicitation allowed
- Reg S: Non-US offering, 40-day distribution compliance period
- Reg A+: Up to $75M, mini-IPO

### Isle of Man (IOM)

- VASP registration under the Financial Services Act 2008
- Isle of Man Financial Services Authority (IOMFSA)
- AML/CFT compliance under Proceeds of Crime Act 2008

### Luxembourg

- Digital securities exchange operation
- CSSF (Commission de Surveillance du Secteur Financier) oversight
- MiFID II compliant trading venue
- Luxembourg Blockchain Law (2019) -- dematerialized securities on DLT

### International Jurisdiction Framework

The JurisdictionModule contract uses ISO 3166-1 alpha-2 country codes for per-address jurisdiction tracking.

Configuration by offering type:

| Offering | Allowed Jurisdictions | Blocked Jurisdictions |
|---|---|---|
| Reg D 506(c) | US only (accredited) | All non-US |
| Reg S | Non-US | US |
| Reg A+ | US + international | OFAC sanctioned |
| Global STO | Per-token config | OFAC + country-specific |

OFAC sanctioned jurisdictions (blocked by default): CU, IR, KP, SY, RU (Crimea region via sub-code).

## On-Chain Cap Table

The on-chain contracts collectively form the authoritative cap table. There is no separate off-chain database that is "the real" cap table -- the chain state is canonical.

### Mapping

| Traditional Cap Table Element | On-Chain Implementation |
|---|---|
| Shareholder registry | SecurityToken.balanceOf(address) |
| KYC/AML status | ComplianceRegistry.isWhitelisted(address) + isBlacklisted(address) |
| Accreditation | ComplianceRegistry.accreditationStatus(address) |
| Rule 144 lockup | LockupModule.lockupExpiry(address) |
| Transfer restrictions | TransferRestriction.checkRestriction() |
| Offering documents | DocumentRegistry.getDocument(name) |
| Dividend payments | DividendDistributor.rounds(roundId) |
| Corporate actions | CorporateActions events |
| Jurisdiction | JurisdictionModule.accountJurisdiction(address) |
| Total outstanding | SecurityToken.totalSupply() |
| Authorized shares | Configurable cap via TransferRestriction or mint guard |

### Go TA Engine

The lux/captable package provides the off-chain TA engine that reads chain state and provides SEC-compliant reporting:

| Package | Purpose |
|---|---|
| pkg/captable | Company, share class, entry CRUD |
| pkg/securities | Issuance, transfer, cancellation with immutable ledger |
| pkg/stakeholder | Investor/shareholder management, accreditation tracking |
| pkg/transfer | Rule 144, lockup periods, board approval checks |
| pkg/dividend | Dividend declaration, record date, distribution |
| pkg/corporate | Stock splits, mergers, reclassification |
| pkg/compliance | Form D, blue sky filings, Reg D compliance |
| pkg/document | Data rooms, access control, audit trails |
| pkg/tax | 1099-DIV, 1099-B, Schedule K-1 generation |

The TA engine indexes chain events and produces:
- SEC Form D filings
- Blue sky state filings
- Annual shareholder reports
- Tax documents (1099-DIV, 1099-B, K-1)
- FINRA trade reports

## Three Pillars

The regulated digital securities stack has three licensed pillars, each mapping to on-chain and off-chain components.

### Pillar 1: ATS (Alternative Trading System)

License: SEC Regulation ATS, FINRA membership

On-chain:
- SecurityToken -- the traded instrument
- ComplianceHook on DEX precompile (see LPS-002) -- compliance-enforced DEX trading
- DEX precompile (LP-9010) -- native order book / AMM

Off-chain:
- lux/cex -- centralized exchange engine (order matching, custody)
- Trade surveillance and reporting
- Best execution monitoring

Flow:
```
Investor -> lux/cex (off-chain order) -> SecurityToken.transfer() (on-chain settlement)
Investor -> DEX precompile + ComplianceHook (fully on-chain)
```

Both paths enforce identical compliance via ComplianceRegistry.

### Pillar 2: BD (Broker-Dealer)

License: FINRA Broker-Dealer, SEC Section 15

On-chain:
- T-Chain MPC custody (LP-5013) -- multi-party computation for key management
- Settlement transactions signed by MPC threshold

Off-chain:
- lux/broker -- Go service handling:
  - Customer onboarding and suitability
  - Order routing and execution
  - Trade confirmation and reporting
  - Customer account statements

Settlement:
- MPC-signed transactions provide institutional-grade custody
- No single point of compromise
- Configurable threshold (e.g., 3-of-5 signers)

### Pillar 3: TA (Transfer Agent)

License: SEC Section 17A

On-chain:
- SecurityToken -- the authoritative shareholder registry
- ComplianceRegistry -- KYC/AML status
- DocumentRegistry -- regulatory filings
- DividendDistributor -- disbursements

Off-chain:
- lux/captable -- Go TA engine providing:
  - SEC reporting (Form D, blue sky)
  - Tax document generation
  - Shareholder communications
  - Corporate action processing
  - Lost shareholder procedures (Rule 17Ad-17)

The key insight: SecurityToken.balanceOf() IS the cap table. The Go TA engine is a read layer that indexes chain state and produces regulatory reports. It does not maintain a separate source of truth.

## Deployment

### Contract Deployment Order

1. ComplianceRegistry -- deploy first, grants COMPLIANCE_ROLE to admin
2. Compliance modules (WhitelistModule, LockupModule, JurisdictionModule) -- deploy and register with registry
3. SecurityToken -- deploy with registry address
4. TransferRestriction -- deploy, grant RESTRICTION_ADMIN_ROLE to token
5. DocumentRegistry -- deploy, upload offering documents
6. DividendDistributor -- deploy with security token address
7. CorporateActions -- deploy, grant MINTER_ROLE on token
8. SecurityBridge -- deploy, grant BRIDGE_ROLE to MPC multisig

### Chain Deployment

Primary deployment: Lux C-Chain (EVM).

For L2/subnet deployments (e.g., Liquidity L2), deploy the same contracts on the L2 and use SecurityBridge for cross-chain transfers.

### Role Matrix

| Role | Holder | Purpose |
|---|---|---|
| DEFAULT_ADMIN_ROLE | Issuer multisig | Grant/revoke all roles |
| MINTER_ROLE | Issuer + CorporateActions | Mint new tokens |
| PAUSER_ROLE | Issuer + compliance officer | Emergency pause |
| COMPLIANCE_ROLE | Compliance service | KYC whitelist updates |
| BRIDGE_ROLE | MPC multisig | Cross-chain operations |
| DIVIDEND_ADMIN_ROLE | Issuer | Create/reclaim dividends |
| CORPORATE_ACTION_ROLE | Issuer + legal | Forced transfers, seizure |
| DOCUMENT_ADMIN_ROLE | Issuer + legal | Document management |

## Reference Links

| Resource | URL |
|---|---|
| Arca Labs ST-Contracts (original) | https://github.com/arcalabs/st-contracts |
| Lux Securities Contracts | https://github.com/luxfi/standard/contracts/securities/ |
| Lux Cap Table (Go TA engine) | https://github.com/luxfi/captable |
| ERC-1404 Specification | https://erc1404.org |
| ERC-3643 (T-REX) Specification | https://erc3643.org |
| tZero | https://tzero.com |
| Lux Compliance Service | https://github.com/luxfi/compliance |
| Lux Broker Service | https://github.com/luxfi/broker |
| Lux CEX Engine | https://github.com/luxfi/cex |
| Lux DEX Precompile (LP-9010) | https://github.com/luxfi/lps/LPs/lp-9010-dex-precompile.md |
| T-Chain MPC Custody (LP-5013) | https://github.com/luxfi/lps/LPs/lp-5013 |
| Warp Messaging (LP-6022) | https://github.com/luxfi/lps/LPs/lp-6022 |

## Security Considerations

1. Role separation: No single address should hold both MINTER_ROLE and COMPLIANCE_ROLE. The issuer mints; compliance officers manage the whitelist. Separate concerns.
2. Multisig for admin: DEFAULT_ADMIN_ROLE must be a multisig (Safe or MPC). A single EOA controlling the security token is a critical vulnerability.
3. Compliance bypass on mint/burn: By design, minting and burning bypass compliance. This is intentional -- the issuer must be able to issue and redeem. The MINTER_ROLE controls who can do this.
4. Nonce deduplication in bridge: SecurityBridge uses nonce tracking to prevent replay. The nonce is derived from sender + amount + chain + block. Bridge operators must verify cross-chain messages before executing mint/release.
5. Pausability: The token can be paused in emergencies. This halts all transfers. Use sparingly -- a paused security token blocks all trading.
6. Forced transfers: CorporateActions.forcedTransfer() bypasses compliance. This is required for regulatory seizure (court orders, sanctions). Access must be tightly controlled.
7. Secrets: All API keys, webhook secrets, and signing keys are stored in KMS (kms.hanzo.ai). Never in environment files. Never in source code. Never in plaintext.

## Copyright

Copyright (c) 2026 Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
