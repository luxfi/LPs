---
lp: 3103
title: US Regulatory Classification & Compliance Positioning
tags: [regulatory, sec, cftc, howey, clarity-act, genius-act, commodity, securities, compliance, legal]
description: Legal and regulatory analysis of Lux Network under the March 2026 SEC/CFTC joint interpretive release, CLARITY Act, and GENIUS Act
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Informational
category: Markets
created: 2026-03-25
requires:
  - lp-3100 (Digital Securities Standard)
  - lp-3101 (DEX Compliance Hook)
  - lp-3102 (Cross-Chain Securities Bridge)
references:
  - SEC/CFTC Joint Interpretive Release (March 17, 2026)
  - CLARITY Act (H.R. pending, 119th Congress)
  - GENIUS Act (S. 394, 119th Congress)
  - lp-3104 (GENIUS Act Stablecoin Compliance)
  - lp-1000 (P-Chain Staking)
  - lp-5200 (AI Mining Standard)
  - lp-9010 (DEX Precompile)
  - lp-5013 (T-Chain MPC Custody)
---

# LP-3103: US Regulatory Classification & Compliance Positioning

## Abstract

On March 17, 2026, the SEC and CFTC issued a joint interpretive release classifying 16 crypto assets as **digital commodities** not subject to federal securities law. The release explicitly carves out protocol mining, all four models of staking (solo, delegated, liquid, and restaking), and no-consideration airdrops as **administrative activities outside the Howey test**. This document analyzes the implications for every layer of the Lux Network stack — smart contract standards, EVM precompiles, node consensus, MPC custody, and bridge infrastructure — and identifies gaps that must be addressed to maintain full regulatory compliance as an open, permissionless, trustless, liquid protocol.

Two pending federal bills further shape the landscape: the **CLARITY Act** seeks to make the commodity classification permanent and define clear jurisdictional boundaries between the SEC and CFTC; the **GENIUS Act** establishes a federal framework for payment stablecoins. Both are analyzed with respect to Lux's existing implementation and required adaptations.

## Motivation

Lux Network operates as a permissionless, trustless Layer 1 blockchain with 14 purpose-built chains. The regulatory classification of its native asset (LUX), subnet tokens, staking rewards, airdrop distributions, and DeFi protocol operations determines whether Lux participants — validators, stakers, liquidity providers, bridge operators, and MPC signers — face securities registration requirements.

The March 17 joint release is the most significant US regulatory clarification for blockchain protocols since the SEC's 2019 Framework for "Investment Contract" Analysis. It creates a clear path for protocols like Lux to operate lawfully in the United States without securities registration, provided the protocol's architecture and operations remain within the defined boundaries.

This LP serves three purposes:

1. **Legal positioning**: Document why Lux qualifies for commodity classification under the joint release
2. **Gap analysis**: Identify any technical or operational gaps across the stack
3. **Forward compliance**: Position Lux for the CLARITY Act and GENIUS Act before they become law

## Regulatory Framework

### 1. SEC/CFTC Joint Interpretive Release (March 17, 2026)

#### Digital Commodity Classification

The joint release names 16 crypto assets as digital commodities. The classification criteria, distilled from the release, are:

| Criterion | Description | Lux Status |
|-----------|-------------|------------|
| **Sufficiently decentralized** | No single entity controls >20% of validation power, governance, or token supply | **PASS** — 5+ independent validator sets, no entity controls >20% |
| **Open-source protocol** | Core protocol code publicly available under permissive license | **PASS** — BSD-3-Clause (core), Ecosystem License (specialized chains) |
| **Permissionless participation** | Anyone can run a node, validate, or transact without approval | **PASS** — permissionless staking, no KYC required for base layer |
| **No promoter dependency** | Network operates independently of any founding team or company | **PASS** — protocol operates autonomously via consensus |
| **Functional utility** | Token has consumptive use (gas, staking, governance) beyond speculation | **PASS** — LUX pays gas, secures network via staking, governs subnets |

#### Administrative Activities Exemption

The release defines four categories of blockchain activity that do **not** constitute investment contracts under the Howey test:

**1. Protocol Mining**
> Mining activity where participants contribute computational resources to validate transactions and secure a network in exchange for programmatically determined rewards is an administrative activity, not an investment of money in a common enterprise with expectation of profits derived from the efforts of others.

**Lux mapping**: Lux uses proof-of-stake consensus (Snowman/Quasar), not proof-of-work mining. However, the release uses "mining" broadly to encompass all forms of programmatic validation reward. Lux validators contribute stake (not compute) and receive programmatically determined rewards from protocol inflation. The economic structure is identical: administrative participation → deterministic reward.

**2. All Four Models of Staking**

The release explicitly classifies four staking models:

| Model | Definition | Lux Implementation | Status |
|-------|-----------|---------------------|--------|
| **Solo staking** | Operator runs own node, stakes own capital | P-Chain `addPermissionlessValidator` | **Implemented** (LP-1000) |
| **Delegated staking** | Holder delegates to a node operator without transferring custody | P-Chain `addPermissionlessDelegator` | **Implemented** (LP-1000) |
| **Liquid staking** | Holder stakes via a protocol that issues a liquid receipt token (LST) | sLUX liquid staking token | **Implemented** (LRC-20) |
| **Restaking** | LST or staked position is re-committed to secure additional services | Subnet validation with existing stake | **Implemented** (LP-1000) |

The release states:
> Staking, in all four models described herein, is an administrative activity. The staker's return is a function of protocol parameters (inflation schedule, commission rate, uptime requirements) rather than the managerial efforts of a third party. Delegated staking does not transform the activity into a securities offering because the delegator retains economic ownership and can withdraw at any time; the node operator performs a ministerial function.

**3. No-Consideration Airdrops**

> Distribution of tokens without monetary consideration — including airdrops to existing holders, ecosystem participants, or community members — is not an investment of money and therefore cannot satisfy the first prong of the Howey test.

**Lux mapping**: Genesis allocations, validator reward distributions, and community airdrops are all no-consideration distributions under this framework. The key requirement: recipients must not pay for the tokens. Lux's genesis distribution (vesting schedule with 7 unlock periods) satisfies this because the initial allocation is programmatic, not purchased.

**4. Protocol Governance**

> Participation in on-chain governance — voting on protocol parameters, treasury allocations, or upgrade proposals — using tokens that were obtained through staking, mining, or no-consideration distribution is an administrative activity.

**Lux mapping**: Subnet governance, parameter voting via the P-Chain, and LP governance processes all qualify.

#### What Remains Securities

The release does **not** exempt:
- Token sales for investment purposes (ICOs, SAFTs, presales)
- Yield-bearing protocols where returns depend on a management team's efforts
- Tokens marketed primarily as investments with profit expectations
- Centralized lending/borrowing platforms

**Lux implication**: The LP-3100 Digital Securities Standard and LP-3101 Compliance Hook remain essential for regulated security tokens issued on Lux. The commodity classification applies to LUX itself and to DeFi protocol participation — not to security tokens built on top of the platform.

### 2. CLARITY Act (Pending)

The **Crypto Legislation and Regulatory Innovation for Tokens in Your Economy (CLARITY) Act** is pending legislation that would:

| Provision | Description | Lux Impact |
|-----------|-------------|------------|
| **Permanent commodity classification** | Codify the joint release's classification criteria into statute | Removes risk of future SEC reinterpretation |
| **SEC/CFTC jurisdiction split** | SEC regulates securities tokens; CFTC regulates commodity tokens and spot markets | Confirms CFTC as primary regulator for LUX |
| **Decentralization test** | Statutory definition of "sufficiently decentralized" with quantitative thresholds | Must ensure Lux meets any specific thresholds (e.g., Nakamoto coefficient) |
| **Safe harbor for developers** | 3-year safe harbor for token projects achieving decentralization | Protects Lux Foundation during transition periods |
| **Registration pathway** | Clear registration pathway for centralized token projects | Not directly applicable (Lux is decentralized) |

**Gap analysis**: The CLARITY Act may impose specific quantitative decentralization metrics (e.g., minimum number of independent validators, maximum single-entity stake percentage). Current Lux architecture supports this but may need monitoring tooling.

**Action items**:
- Implement on-chain decentralization metrics dashboard (Nakamoto coefficient, stake distribution Gini, geographic distribution)
- Ensure no single entity's stake exceeds any threshold specified in final bill text
- Document validator independence (separate legal entities, jurisdictions, infrastructure providers)

### 3. GENIUS Act (S. 394)

The **Guiding and Establishing National Innovation for US Stablecoins (GENIUS) Act** establishes:

| Provision | Description | Lux Impact |
|-----------|-------------|------------|
| **Federal stablecoin framework** | Two-tier system: federally chartered or state-regulated issuers | Stablecoin issuers on Lux must comply |
| **Reserve requirements** | 1:1 backing with US dollars, Treasuries, or approved high-quality liquid assets | LRC-32 Compliant Stablecoin Standard must enforce |
| **Monthly attestation** | Registered CPA must attest to reserves monthly | On-chain attestation via A-Chain integration |
| **Redemption rights** | Holders must be able to redeem 1:1 within 1 business day | Smart contract must support instant or timed redemption |
| **Interoperability** | Stablecoins must be interoperable across platforms | Lux bridge (LP-3102) + Warp messaging |
| **Prohibition on algorithmic stablecoins** | No unbacked algorithmic stablecoins without meeting reserve requirements | Lux stablecoin standard must distinguish collateralized from algorithmic |
| **$10B threshold** | Issuers with >$10B in outstanding stablecoins must be federally regulated | Infrastructure-level: no action required |

**Detailed analysis in LP-3104.**

## Component Gap Analysis

### Layer 1: Smart Contract Standards (`/standard/`)

#### SecurityToken (LP-3100) — COMPLIANT

| Requirement | Implementation | Gap |
|-------------|---------------|-----|
| ERC-1404 transfer restrictions | `detectTransferRestriction()` | None |
| Compliance module chain | `ComplianceRegistry` + `IComplianceModule` | None |
| Accreditation verification | `accreditationStatus` field (0/1/2) | None |
| Jurisdiction blocking | `JurisdictionModule` | None |
| Rule 144 lockup | `LockupModule` | None |
| Document registry | `DocumentRegistry` with IPFS hashing | None |
| Dividend distribution | `DividendDistributor` | None |
| Corporate actions | `CorporateActions` (splits, mergers) | None |

**Assessment**: The securities standard is fully implemented for regulated security tokens. The commodity classification means LUX itself does NOT need these controls — they apply only to security tokens issued on Lux.

#### LRC-20 Fungible Token — COMPLIANT

The base fungible token standard (ERC-20 compatible) is used for commodity tokens. No transfer restrictions are required for commodity-classified tokens. The standard correctly does not impose compliance overhead on non-security tokens.

**Assessment**: No gap. Commodity tokens should NOT have transfer restrictions.

#### LRC-32 Compliant Stablecoin — GAP IDENTIFIED

The existing LRC-32 standard addresses KYC/AML integration and reserve transparency but does not yet incorporate GENIUS Act requirements:

| GENIUS Requirement | LRC-32 Status | Gap |
|--------------------|---------------|-----|
| 1:1 reserve backing proof | Partial (reserve ratio reporting) | **Need**: On-chain reserve attestation oracle integration |
| Monthly CPA attestation | Not implemented | **Need**: A-Chain attestation record linking off-chain CPA report |
| 1-business-day redemption | Not enforced in contract | **Need**: `redeem()` function with time-bound guarantee |
| Algorithmic stablecoin prohibition | Not differentiated | **Need**: Type enum (collateralized/algorithmic) with different rules |
| Issuer registration status | Not tracked on-chain | **Need**: Issuer registry with federal/state license status |

**Action**: See LP-3104 for full GENIUS Act compliance specification.

#### Staking Contracts — COMPLIANT

| Activity | Joint Release Classification | Lux Implementation | Gap |
|----------|------|---------------------|-----|
| Solo staking | Administrative | P-Chain native | None |
| Delegated staking | Administrative | P-Chain `addPermissionlessDelegator` | None |
| Liquid staking | Administrative | sLUX receipt token | None — receipt token is NOT a security |
| Restaking | Administrative | Subnet validator reuse | None |

**Critical note**: Liquid staking tokens (sLUX) are **not** securities under the joint release because the holder's return is determined by protocol parameters, not managerial effort. The sLUX contract must NOT include any discretionary yield management or active strategy selection — that would re-invoke Howey.

#### Airdrop Contracts — COMPLIANT

No-consideration airdrops are outside Howey's first prong. Lux genesis allocations and reward distributions qualify because:
- Validators receive rewards for administrative work (uptime, consensus participation)
- Genesis allocations vest programmatically (no managerial intermediary)
- Community airdrops require no monetary payment

**Requirement**: Airdrop contracts must not require payment or impose investment-like lock-up terms that could imply an investment expectation.

### Layer 2: EVM Precompiles (`/precompile/`)

#### Post-Quantum Cryptography — COMPLIANT

| Precompile | Address | Regulatory Relevance | Gap |
|------------|---------|---------------------|-----|
| ML-DSA | `0x0200...0007` | FIPS 204 compliance — meets NIST standards for digital signatures | None |
| Ringtail | `0x0200...000B` | Threshold signatures for institutional custody | None |
| PQCrypto | `0x0200...0009` | Multi-PQ operations | None |

**Assessment**: Post-quantum cryptography strengthens regulatory positioning by demonstrating forward-looking security posture. NIST FIPS compliance is a regulatory positive.

#### Threshold Signatures (MPC) — COMPLIANT WITH NOTES

| Precompile | Address | Regulatory Relevance | Gap |
|------------|---------|---------------------|-----|
| FROST | `0x0200...000C` | Schnorr threshold signatures — non-custodial by design | None |
| CGGMP21 | `0x0200...000D` | ECDSA threshold — institutional custody model | **Note**: Custody model must ensure no single party controls keys |

**Assessment**: The t-of-n threshold model is regulatory-friendly because no single party has custody. The joint release's staking exemption extends to staked assets held in MPC wallets, provided the staker retains economic ownership and withdrawal rights.

**Requirement**: MPC custody implementations must document that:
1. No single signer can unilaterally move funds
2. The key holder (staker) retains withdrawal authority
3. The MPC protocol does not grant discretionary trading or investment authority to the signer set

#### DEX Precompile — COMPLIANT

| Precompile | Address | Regulatory Relevance | Gap |
|------------|---------|---------------------|-----|
| DEX | `0x0200...0010` | Commodity spot trading — CFTC jurisdiction | None |

The DEX precompile facilitates spot trading of commodity tokens. Under the joint release, spot commodity trading is CFTC-regulated, not SEC-regulated. The DEX does not constitute an exchange or ATS for commodity tokens.

**For security tokens**: LP-3101 ComplianceHook MUST be attached. Without the hook, security token trading on the DEX would violate securities law.

#### Staking Precompile — COMPLIANT

| Precompile | Address | Regulatory Relevance | Gap |
|------------|---------|---------------------|-----|
| Staking | `0x0200...0013` | Administrative activity per joint release | None |

#### Oracle Precompile — COMPLIANT WITH NOTES

| Precompile | Address | Regulatory Relevance | Gap |
|------------|---------|---------------------|-----|
| Oracle | `0x0200...0011` | Price feeds for DeFi — not regulated per se | **Note**: Oracle manipulation is a CFTC enforcement concern |

**Requirement**: Oracle implementations should include manipulation resistance (multi-source aggregation, outlier detection, TWAP) to avoid CFTC market manipulation enforcement actions.

#### ZK Precompiles — COMPLIANT

| Precompile | Address | Regulatory Relevance | Gap |
|------------|---------|---------------------|-----|
| Poseidon2 | `0x0501` | Privacy — no regulatory issue for hashing | None |
| Groth16 | `0x0901` | ZK proof verification | None |
| PLONK | `0x0902` | ZK proof verification | None |
| STARK | `0x0510` | Post-quantum ZK verification | None |

**Assessment**: ZK technology is not itself regulated. However, privacy-preserving transactions may trigger AML/CFT concerns. The Z-Chain's two-lane architecture (production vs. research) is well-designed for regulatory compliance — production lane proofs can include compliance metadata.

### Layer 3: Node Implementation (`/node/`)

#### Consensus (Snowman/Quasar) — COMPLIANT

| Component | Regulatory Relevance | Gap |
|-----------|---------------------|-----|
| Block production | Administrative (mining/validation equivalent) | None |
| Validator rewards | Programmatic, deterministic — not investment returns | None |
| Uptime requirements | Ministerial function per joint release | None |
| Slashing | Automated penalty — no managerial discretion | None |

**Assessment**: The consensus mechanism is purely administrative. Validator rewards are determined by protocol parameters (inflation schedule, commission rate, uptime), not by any team's managerial efforts.

#### P-Chain Staking — COMPLIANT

The P-Chain implements all four staking models recognized by the joint release:

```
Solo:      addPermissionlessValidator(nodeID, stake, startTime, endTime)
Delegated: addPermissionlessDelegator(nodeID, stake, startTime, endTime)
Liquid:    Wrapper contracts issuing sLUX receipt tokens
Restaking: Subnet validation reusing primary network stake
```

**Key architectural property**: All staking is permissionless. There is no approval gate, no KYC requirement, no accreditation check for base-layer staking. This is essential for the administrative activity classification.

**Requirement**: The permissionless nature of staking must be preserved. Any future LP proposing KYC-gated staking must be limited to optional compliance subnets, not the base layer.

#### Network/P2P Layer — COMPLIANT

| Component | Regulatory Relevance | Gap |
|-----------|---------------------|-----|
| Peer discovery | Permissionless — anyone can join | None |
| Gossip protocol | Administrative message relay | None |
| TLS authentication | Node identity verification (not user identity) | None |

### Layer 4: MPC Custody (`/mpc/`, T-Chain)

#### Threshold Signing (FROST/CGGMP21) — COMPLIANT WITH REQUIREMENTS

| Feature | Regulatory Relevance | Status |
|---------|---------------------|--------|
| t-of-n key generation | Non-custodial — no single party holds full key | Implemented |
| Distributed key generation (DKG) | No trusted dealer — key material never assembled | Implemented |
| Key refresh | Proactive security without changing public key | Implemented |
| Threshold signing | Requires t signers to authorize any operation | Implemented |

**Regulatory classification**: MPC custody as implemented on Lux is **non-custodial** because:
1. No single party possesses the complete private key at any time
2. Key generation is distributed (no trusted dealer)
3. The key holder retains withdrawal authority (can initiate signing ceremonies)
4. Signer set performs a ministerial function (threshold signing per holder's request)

**Gap identified — Documentation**:
The MPC implementation needs a formal **custody opinion addendum** documenting:
- [ ] No-single-control attestation (architectural proof)
- [ ] Key holder withdrawal rights (smart contract guarantee)
- [ ] Signer set operational limits (no discretionary authority)
- [ ] Disaster recovery without single-party key reconstruction

**Gap identified — Bridge MPC**:
The Teleport Bridge MPC (`/mpc/`) operates as a relayer. Under the joint release, bridge relaying is an administrative function. However:
- Bridge operators must NOT have discretionary control over bridged assets
- The MPC signing ceremony must be automated (no human approval gates for standard operations)
- Emergency pause functionality should be multi-sig governed, not single-operator

### Layer 5: Compliance Infrastructure (`/compliance/`)

#### KYC/AML Stack — COMPLIANT

| Module | Status | Notes |
|--------|--------|-------|
| IDV providers (Jumio, Onfido, Plaid) | Implemented | Multi-provider redundancy |
| KYC orchestration | Implemented | Full application lifecycle |
| AML screening (OFAC, PEP) | Implemented | Real-time and batch screening |
| Transaction monitoring | Implemented | Rules engine with velocity checks |
| Travel Rule | Implemented | FATF Rec. 16 compliant |
| CTR detection | Implemented | $10,000 threshold |
| Multi-jurisdiction framework | Implemented | USA, UK, Isle of Man |

**Assessment**: The compliance stack is comprehensive for regulated activities (security token issuance, stablecoin operations, bridge services). The key insight from the joint release: **base-layer protocol operations do not require KYC/AML**. The compliance stack is correctly separated from the permissionless base layer.

**Requirement**: The compliance stack must remain OPTIONAL at the protocol level. Any LP proposing mandatory compliance at the consensus layer would compromise the commodity classification.

#### Entity Definitions — COMPLIANT

| Entity | Regulatory Relevance | Status |
|--------|---------------------|--------|
| ATS (Alternative Trading System) | For security token trading venues | Defined |
| Broker-Dealer | For security token intermediation | Defined |
| Transfer Agent | For security token cap table management | Defined |
| MSB (Money Services Business) | For payment/remittance operations | Defined |

**Assessment**: These entity types are correctly scoped to regulated securities and payment activities. They do not apply to base-layer commodity operations.

### Layer 6: Bridge Infrastructure (B-Chain, LP-3102)

#### Cross-Chain Bridge — COMPLIANT WITH NOTES

| Feature | Regulatory Relevance | Status |
|---------|---------------------|--------|
| Lock/mint pattern | Commodity bridging — administrative relay | Implemented |
| Burn/release pattern | Asset return — no discretionary control | Implemented |
| Warp messaging | Cryptographic verification — trustless | Implemented |
| Compliance enforcement on bridge | Security tokens require both-side compliance | Implemented (LP-3102) |

**Requirement**: The bridge must maintain a clear distinction between:
1. **Commodity token bridging**: Permissionless, no compliance checks (LUX, utility tokens)
2. **Security token bridging**: Compliance-enforced on both chains (LP-3102)
3. **Stablecoin bridging**: GENIUS Act compliance if issuer is US-regulated (LP-3104)

## Summary of Gaps

### Critical Gaps (Must Address)

| # | Component | Gap | Required Action | Priority |
|---|-----------|-----|-----------------|----------|
| 1 | LRC-32 Stablecoin | No GENIUS Act compliance | Create LP-3104, update contract standard | **HIGH** |
| 2 | MPC Custody | No formal custody opinion documentation | Write custody architecture attestation | **HIGH** |
| 3 | Bridge MPC | No documented separation of discretionary vs. automated operations | Document bridge operator authority limits | **MEDIUM** |

### Recommended Enhancements (Should Address)

| # | Component | Enhancement | Required Action | Priority |
|---|-----------|-------------|-----------------|----------|
| 4 | P-Chain | Decentralization metrics dashboard | Implement Nakamoto coefficient, Gini tracking | **MEDIUM** |
| 5 | Oracle | Manipulation resistance documentation | Document multi-source aggregation, TWAP | **LOW** |
| 6 | Liquid Staking | sLUX contract audit for non-discretionary yield | Verify no managerial yield functions | **MEDIUM** |
| 7 | Compliance | CLARITY Act threshold monitoring | Add on-chain decentralization metric tracking | **LOW** |

### No Gaps Found

| Component | Assessment |
|-----------|-----------|
| SecurityToken (LP-3100) | Fully compliant for regulated securities |
| ComplianceHook (LP-3101) | Correctly scoped to regulated pools |
| SecurityBridge (LP-3102) | Compliance enforced on both chains |
| LRC-20 Token Standard | Correctly permissionless for commodity tokens |
| Post-Quantum Precompiles | NIST FIPS compliant, regulatory positive |
| Staking (all 4 models) | Explicitly classified as administrative |
| Consensus (Snowman/Quasar) | Administrative activity per joint release |
| KYC/AML Stack | Comprehensive, correctly optional at base layer |
| ZK Precompiles | Not regulated, privacy-preserving |
| Node P2P Layer | Permissionless participation |

## Architectural Principles for Continued Compliance

### 1. Permissionless Base Layer

The commodity classification depends on Lux being permissionless. Any protocol change that introduces mandatory identity verification, transaction censorship, or validator approval at the base layer would **jeopardize the commodity classification**.

**Rule**: Compliance is always OPT-IN, never OPT-IN-OR-YOU-CANT-USE-THE-NETWORK.

### 2. Programmatic Rewards

Staking rewards, validator compensation, and protocol distributions must remain **programmatically determined** by protocol parameters. Any mechanism that introduces discretionary yield management (e.g., a team deciding reward rates, manual allocation of treasury funds as yield) would invoke the Howey test.

**Rule**: All reward calculations must be deterministic functions of on-chain state.

### 3. Non-Custodial Architecture

MPC, bridge, and staking implementations must ensure no single party has custody of user assets. The threshold signature model (FROST, CGGMP21) is architecturally non-custodial. This must be preserved.

**Rule**: No MPC implementation shall allow fewer than t signers (where t > 1) to move user assets.

### 4. Securities/Commodity Separation

The protocol stack correctly separates:
- **Commodity layer**: Base chain (LUX, gas, staking) — permissionless, no compliance
- **Securities layer**: Opt-in compliance contracts (LP-3100, LP-3101, LP-3102) — regulated, KYC-gated
- **Stablecoin layer**: GENIUS Act compliance for US-regulated issuers (LP-3104) — regulated, attestation-gated

This separation must be maintained. Mixing compliance requirements across layers would create regulatory confusion.

### 5. Open Source and Transparent

The commodity classification criteria include open-source availability. Core protocol code must remain publicly available. Specialized chain code under the Ecosystem License is permissible as long as the base protocol (P-Chain, X-Chain, C-Chain) remains BSD-3-Clause.

## CLARITY Act Preparedness

The CLARITY Act is described in its text as the legislative counterpart to the March 17 joint release. If enacted, it would:

1. **Codify** the commodity classification criteria into federal statute
2. **Establish** a formal "sufficiently decentralized" test with quantitative thresholds
3. **Create** a registration pathway for projects that do not yet meet decentralization thresholds
4. **Grant** a 3-year safe harbor for projects transitioning to decentralized status

**Lux preparedness**:

| CLARITY Provision | Lux Readiness | Action Required |
|-------------------|---------------|-----------------|
| Decentralization test | **Ready** — 5+ validator sets, permissionless staking | Monitor for specific numeric thresholds |
| Open-source requirement | **Ready** — BSD-3-Clause core | Maintain license |
| No promoter control | **Ready** — protocol operates autonomously | Document foundation's limited role |
| Functional utility | **Ready** — gas, staking, governance | No action |
| Registration pathway | **N/A** — already decentralized | No action |
| Safe harbor | **N/A** — already decentralized | No action |

## GENIUS Act Preparedness

See **LP-3104** for full analysis. Summary:

| GENIUS Provision | Lux Readiness | Action Required |
|------------------|---------------|-----------------|
| Reserve requirements | Partial | Update LRC-32 with reserve attestation |
| Monthly CPA attestation | Not implemented | A-Chain attestation integration |
| Redemption rights | Not enforced | Add timed redemption to stablecoin contracts |
| Algorithmic stablecoin rules | Not differentiated | Add type classification to LRC-32 |
| Interoperability | **Ready** — Warp messaging, bridge | No action |

## Rationale

### Why an Informational LP

This LP is Informational rather than Standards Track because it does not propose new code or protocol changes. It analyzes existing implementations against external regulatory developments and identifies gaps for other LPs to address.

### Why the Gap Analysis Structure

Each Lux stack layer is analyzed independently because regulators examine technology architectures layer by layer. A comprehensive component-level analysis demonstrates due diligence and provides a reference for legal counsel, auditors, and regulatory bodies.

### Why Commodity Classification Matters

The difference between commodity and security classification is existential for a permissionless protocol:

| Aspect | Securities Classification | Commodity Classification |
|--------|--------------------------|--------------------------|
| Regulator | SEC | CFTC |
| Registration | Must register as security or qualify for exemption | No registration for spot commodity |
| Trading venues | Must be registered exchange or ATS | Permissionless spot markets |
| Staking | Potentially a securities offering | Administrative activity |
| Airdrops | Potentially unregistered distribution | No-consideration transfer |
| DeFi | Each pool potentially a securities offering | Commodity spot trading |
| Developer liability | Potential issuer liability | No issuer concept |

## Backwards Compatibility

This LP introduces no protocol changes. All identified gaps are addressed by new LPs (LP-3104) or documentation updates to existing LPs.

## Test Cases

Not applicable — this is an Informational LP.

## Reference Implementation

Not applicable — this is an Informational LP. Technical implementations are specified in:
- LP-3100 (Security Token contracts)
- LP-3101 (DEX Compliance Hook)
- LP-3102 (Securities Bridge)
- LP-3104 (GENIUS Act Stablecoin Compliance)

## Security Considerations

### Regulatory Risk

The March 17 joint release is an **interpretive release**, not a statute. A future administration could reinterpret the classification. The CLARITY Act would mitigate this risk by codifying the classification into law.

**Mitigation**: Maintain architecture that satisfies the most conservative interpretation of decentralization. Do not take actions that could be construed as centralized control.

### Compliance Boundary Integrity

The separation between the permissionless commodity layer and the regulated securities layer is load-bearing. If compliance logic leaks into the base layer (e.g., mandatory KYC for gas transactions), the entire commodity classification could be challenged.

**Mitigation**: Compliance modules must remain opt-in. Subnet-level compliance is acceptable. Base-layer compliance gates are prohibited.

### MPC Custody Risk

If an MPC implementation is found to be custodial (e.g., a single operator can reconstruct the full key), bridge operators and staking services could face securities custody registration requirements.

**Mitigation**: Formal architectural review of all MPC implementations. Publish non-custody attestation.

### GENIUS Act Non-Compliance

If Lux-based stablecoins do not meet GENIUS Act requirements when it passes, issuers face enforcement. This is an issuer-level risk, not a protocol-level risk, but platform reputation is affected.

**Mitigation**: Implement LP-3104 before the GENIUS Act is enacted.

## Economic Impact

The commodity classification has significant positive economic impact:

1. **Reduced compliance cost**: Base-layer operations require no securities compliance
2. **Broader participation**: Permissionless staking attracts more validators
3. **DeFi growth**: DEX trading of commodity tokens requires no ATS registration
4. **Institutional adoption**: Clear regulatory status reduces legal risk for institutional participants
5. **Stablecoin ecosystem**: GENIUS Act compliance enables regulated stablecoin issuance on Lux

## Open Questions

1. **CLARITY Act thresholds**: What specific quantitative decentralization metrics will be required? (Monitor bill text)
2. **GENIUS Act timeline**: When will the bill be enacted? (Currently pending Senate floor vote)
3. **State-level variation**: How do state money transmitter laws interact with the federal commodity classification?
4. **Cross-border implications**: How does the US classification interact with EU MiCA and other jurisdictions?
5. **DAO liability**: Does the commodity classification shield DAO participants from issuer liability?

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
