---
lp: SECURITIES
title: Tokeny ONCHAINID + T-REX (ERC-3643) Adoption
tags: [securities, erc-3643, erc-734, erc-735, t-rex, onchainid, tokeny, compliance, kyc, identity]
description: Canonical adoption of Tokeny ONCHAINID (ERC-734/735) and T-REX (ERC-3643) as the Lux securities-token standard. Lux maintains brand-neutral forks tracking upstream semver, with Lux extensions delivered exclusively as overlay layers. Core interfaces remain compatible with the unmodified ERC-3643 ecosystem.
author: Lux Core Team (@luxfi)
status: Active
type: Standards Track
category: Markets
created: 2026-04-28
requires:
  - lp-001 (Digital Securities Standard)
  - lp-088 (ERC-3643 Securities Compliance Framework)
references:
  - ERC-734 (Key Manager)
  - ERC-735 (Claim Holder)
  - ERC-3643 (T-REX — Token for Regulated EXchanges)
  - https://github.com/onchain-id/solidity (upstream ONCHAINID)
  - https://github.com/ERC-3643/ERC-3643 (upstream T-REX, post-Tokeny)
---

# LP-SECURITIES: Tokeny ONCHAINID + T-REX (ERC-3643) Adoption

## Abstract

Lux Network adopts Tokeny's ONCHAINID (ERC-734 + ERC-735) and T-REX (ERC-3643) as the canonical securities-token standard. The Lux organization maintains brand-neutral forks of both projects under the `luxfi` GitHub organization that track upstream semver releases without divergence in core interfaces. Jurisdiction-specific behavior (US, EU, UK, Luxembourg, etc.) is delivered as overlay compliance modules layered on top of unmodified T-REX core; the underlying token contracts remain bytecode-compatible with the broader ERC-3643 ecosystem.

This LP supersedes nothing — it formalizes the upstream-tracking commitment already implicit in LP-001 and LP-088.

## §1 — Rationale

### Why ERC-3643 + ONCHAINID, not a Lux-native standard

1. **Regulatory recognition.** ERC-3643 is the only ERC standard with measurable institutional adoption among issuers, transfer agents, and registered ATSs. Replacing it with a Lux-native standard would orphan every existing issuer and force re-onboarding of every regulated counterparty.
2. **Tooling parity.** Wallets, indexers, custody providers, and compliance vendors already integrate ERC-3643 + ONCHAINID. Drift from the standard breaks integrations and inverts the cost curve in our favor only if Lux has measurably more users than the rest of the ecosystem combined — which it does not.
3. **Audit surface.** ERC-3643 has years of public audit history. A Lux-native rewrite restarts that surface from zero. Building on audited primitives is the lowest-risk path.
4. **Identity portability.** ONCHAINID is the de-facto cross-chain identity primitive for tokenized securities. Holders carry one identity contract across every chain their issuer supports.

### Why fork instead of consume directly

- **Supply-chain integrity.** A pinned `luxfi/onchain-id` and `luxfi/erc-3643` fork removes upstream-availability risk during Lux release cycles. If `ERC-3643/ERC-3643` is renamed, archived, or deleted, Lux deployments do not regress.
- **Reproducible builds.** Lux's CI must build deterministically from a SHA owned by the Lux organization. Public mirrors are a SHA we control.
- **No code drift.** The forks must remain bytecode-equivalent to upstream tags. Any Lux-specific behavior is an *additive* contract that consumes the standard interfaces, not a modification of them.

## §2 — Compatible-with-Tokeny Commitment

### Canonical fork mapping

| Upstream | License | Lux fork | Tracking policy |
|---|---|---|---|
| `onchain-id/solidity` | GPL-3.0 | `luxfi/onchain-id` | Track `main` + every release tag within 7 days |
| `ERC-3643/ERC-3643` | GPL-3.0 | `luxfi/erc-3643` | Track `main` + every release tag within 7 days |

### Pinned upstream state at adoption (2026-04-28)

| Repository | Tag | SHA |
|---|---|---|
| `onchain-id/solidity` | `2.2.2-beta3` | `0e681fbf40f7982be5f76f3bbb1f2995e28e40f8` |
| `ERC-3643/ERC-3643` | `4.1.3` | `b6c5fabf86e733ede017fef754d59eeb8f80e3f4` |

### Hard rules

1. **No interface drift.** The Solidity interfaces (`IIdentity`, `IClaimIssuer`, `IToken`, `IIdentityRegistry`, `IModularCompliance`, `IClaimTopicsRegistry`, `ITrustedIssuersRegistry`, `IAgentRole`) are the upstream definitions, byte-for-byte. Lux MUST NOT add, remove, or rename functions on these interfaces.
2. **No `LUX_` prefixes in Solidity identifiers.** Lux-specific code lives in additional contracts in additional files; it does not pollute the canonical namespace.
3. **License preservation.** GPL-3.0 is preserved on every fork. NOTICE / LICENSE files from upstream are retained verbatim. Each fork carries `LUXFI-FORK.md` documenting the pinned upstream SHA, the tracking policy, and the absence of core changes.
4. **Semver alignment.** Lux fork tags equal upstream tags 1:1 (e.g., `luxfi/erc-3643:v4.1.3` ↔ `ERC-3643/ERC-3643:v4.1.3`). No private versions.
5. **No backports.** If a fix exists upstream and is not released, Lux waits for the upstream release. Lux does not patch ahead.
6. **One-way contributions.** Material fixes Lux discovers go upstream as PRs to `ERC-3643/ERC-3643` or `onchain-id/solidity`. Lux does not maintain private forks of public security fixes.

## §3 — Per-Jurisdiction Overlay (Overlay-Only)

Jurisdiction enforcement is a composition of upstream `IModularCompliance` modules. The T-REX core token contract is unmodified; jurisdictions are added by `addModule(address)`.

### Module taxonomy

| Module | Jurisdiction | Enforces |
|---|---|---|
| `RegDComplianceModule` | US | Reg D 506(b)/506(c): accredited-investor claim, 12-month holding period, Form D filing flag |
| `RegSComplianceModule` | US (offshore) | Reg S Category 1/2/3: distribution-compliance period, US-person exclusion, Category-2 resale restrictions |
| `RegAComplianceModule` | US | Reg A+ Tier 1/Tier 2: state blue-sky filings, $75M Tier-2 cap, non-accredited per-investor limits |
| `RegCFComplianceModule` | US | Reg CF: $5M annual cap, per-investor limits computed from `IClaimIssuer` income/net-worth claims |
| `MiCAComplianceModule` | EU | MiCA asset-referenced/e-money tokens: whitepaper hash, issuer authorization claim, ESMA reporting hook |
| `FCAComplianceModule` | UK | FCA permission claim, UK-resident vs non-resident transfer rules, financial-promotion gate |
| `CSSFComplianceModule` | Luxembourg | CSSF authorization, AIF/UCITS classification, RAIF eligibility |
| `IOMComplianceModule` | Isle of Man | IOMFSA authorization, Class 3/Class 4 distinction |

### Composition rules

- A SecurityToken MAY install N compliance modules. All modules MUST return `true` from `moduleCheck` for the transfer to succeed.
- Modules MUST be stateless beyond their own storage. Cross-module dependencies are forbidden — each module is independently auditable.
- A jurisdiction module MUST consume only canonical ONCHAINID claims. Adding a non-standard claim topic requires registering it via `IClaimTopicsRegistry`; it does not justify forking ONCHAINID.
- Modules MUST be upgradeable through the upstream `IModularCompliance` upgrade pattern. Lux does not introduce a competing upgrade mechanism.

### Trusted issuer scope

Each jurisdiction defines an allowlist of `IClaimIssuer` contracts whose claims it accepts (e.g., a CSSF-licensed KYC provider for Luxembourg). The allowlist lives in `ITrustedIssuersRegistry` exactly as upstream specifies. Lux does not maintain a parallel registry.

### Implementation location

Overlay modules ship as a separate Lux package — out of scope for this LP. They depend on `luxfi/erc-3643` and `luxfi/onchain-id` as Solidity-package imports, never as forks.

## §4 — Migration Guide for Existing Lux Fund 2022 ERC-3643 Holders

The Lux Fund deployed an ERC-3643 token in 2022 against the then-current Tokeny T-REX revision. Adoption of the canonical post-Tokeny `ERC-3643/ERC-3643` upstream requires a one-time migration.

### Pre-conditions

1. The Lux Fund issuer SHALL freeze new minting on the legacy contract before migration.
2. The issuer SHALL publish the migration block height ≥ 14 days in advance via on-chain `Paused` event and off-chain investor notice.
3. The issuer SHALL deploy the new T-REX 4.1.3 token, IdentityRegistry, ModularCompliance, TrustedIssuersRegistry, and ClaimTopicsRegistry contracts using the canonical upstream factories.

### Holder migration path

1. Each holder's existing ONCHAINID identity contract is reused — no holder action required if the identity is already a v2.x ONCHAINID. Identities below v2 SHALL be re-deployed by the issuer using `IdentityFactory.createIdentity` and the legacy claims re-attested by the same `IClaimIssuer`.
2. The issuer SHALL run a one-shot batch migration script that:
   - Snapshots `balanceOf(holder)` on the legacy token at the freeze block.
   - Calls `mint(holder, balance)` on the new T-REX 4.1.3 token, gated by `IdentityRegistry.isVerified(holder)`.
   - Burns the legacy balance via `forcedTransfer` to a sink address held by the issuer.
3. Holders whose identities fail `isVerified` at the freeze block are minted into a `Frozen` state on the new token. They MUST complete re-verification with a trusted issuer to unfreeze.
4. The legacy contract is `pause`d permanently and NOT upgraded; the new contract is the sole reference.

### State preservation

- Cap-table positions are preserved 1:1.
- Lock-up timers continue from the pre-migration timestamp via `setLockup(holder, expiry)` on the new token.
- Distribution claims accrued on the legacy token (e.g., dividends) settle on the legacy contract; new distributions only emit on the new contract.
- Audit log: the migration script's transactions are the canonical audit record. Issuers SHALL preserve the script and its transaction hashes for ≥ 7 years.

### Off-chain coordination

- KYC provider MUST re-issue claims against the new ClaimTopicsRegistry if topic IDs changed between releases. Topic ID stability is a release-note item Lux tracks per upstream release.
- Transfer agent records (Lux Fund's Lux internal TA, or external TA) reconcile against the on-chain post-migration cap-table at T+0.
- DTC / equivalent settlement venue notification is the issuer's responsibility; the migration is invisible to chain-internal counterparties.

## §5 — Repository Index

| Purpose | Repository | Tracking |
|---|---|---|
| Identity (ERC-734/735) | `github.com/luxfi/onchain-id` | Mirror of `onchain-id/solidity`, semver-aligned |
| Securities token (ERC-3643) | `github.com/luxfi/erc-3643` | Mirror of `ERC-3643/ERC-3643`, semver-aligned |
| Lux jurisdiction overlays | (out of scope; future package) | Depends on the two above as standard imports |
| Lux integration bindings | (out of scope; future package) | Go bindings via `abigen`, generated from upstream ABIs |

## §6 — Non-Goals

- This LP does NOT define a new token interface. ERC-3643 4.1.3 is the interface.
- This LP does NOT define a new identity contract. ERC-734/735 / ONCHAINID 2.2.x is the identity contract.
- This LP does NOT specify how the Lux native DEX (lux.exchange) handles ERC-3643. That is a separate routing/compliance LP.
- This LP does NOT cover off-chain transfer-agent operational requirements; those are operator policy, not protocol.

## §7 — Acceptance Criteria

This LP transitions to `Final` once:

1. `luxfi/onchain-id` and `luxfi/erc-3643` carry the latest upstream stable tags (currently `2.2.2-beta3` and `4.1.3`) with green CI on both forks.
2. Each fork carries a `LUXFI-FORK.md` describing tracking policy and pinned upstream SHA.
3. At least one Lux jurisdiction overlay module ships in production against the unmodified core, demonstrating the overlay pattern.
4. The Lux Fund 2022 ERC-3643 deployment is migrated to T-REX 4.1.3 per §4 (or a written exemption is recorded if the legacy contract is already on a 3.x+ release that does not require the migration).

## §8 — Open Questions

- Whether to also fork `ERC-3643/eip` (the EIP repository) for offline reference. Probable answer: no — the EIP is normative on its own, and the fork would diverge from the public canonical record.
- Whether Lux operates a public `IClaimIssuer` bridge that re-attests claims from major commercial KYC providers (Tokeny, Sumsub, Onfido). Out of scope for this LP.
