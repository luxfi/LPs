---
lp: 3104
title: GENIUS Act Stablecoin Compliance
tags: [regulatory, genius-act, stablecoin, lrc-32, reserve, attestation, redemption]
description: Stablecoin standard extensions for compliance with the GENIUS Act federal payment stablecoin framework
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Markets
created: 2026-03-25
requires:
  - lp-3100 (Digital Securities Standard)
  - lp-3103 (US Regulatory Classification)
  - chain: C
  - chain: A
references:
  - GENIUS Act (S. 394, 119th Congress)
  - lp-3020 (LRC-20 Fungible Token)
  - lp-5080 (Attestation Chain Spec)
  - lp-9011 (Oracle Precompile)
---

# LP-3104: GENIUS Act Stablecoin Compliance

## Abstract

The GENIUS Act (Guiding and Establishing National Innovation for US Stablecoins) establishes a two-tier federal regulatory framework for payment stablecoins. This LP specifies the on-chain contract extensions, attestation integrations, and operational requirements that stablecoin issuers on Lux Network must implement to comply with the GENIUS Act. It extends the existing LRC-32 Compliant Stablecoin Standard with reserve proof mechanisms, timed redemption guarantees, issuer registry contracts, and A-Chain attestation records for monthly CPA attestations.

## Motivation

The GENIUS Act will be the first comprehensive US federal framework for stablecoin regulation. Unlike the March 17 SEC/CFTC joint release which classifies native tokens as commodities, the GENIUS Act specifically targets **payment stablecoins** — tokens designed to maintain a stable value pegged to a reference asset.

Stablecoins on Lux (both native and bridged) must comply before the Act is enacted to avoid enforcement risk. The protocol should provide standards-compliant contracts so issuers can deploy GENIUS-compliant stablecoins without building custom infrastructure.

Key GENIUS Act requirements that affect on-chain architecture:

1. **Reserve transparency**: 1:1 backing must be verifiable
2. **Redemption rights**: Holders must be able to redeem at par within 1 business day
3. **Attestation**: Monthly reserve attestation by a registered CPA
4. **Issuer licensing**: Two-tier system (federal or state-regulated)
5. **Algorithmic stablecoin treatment**: Unbacked algorithmic stablecoins face additional scrutiny
6. **Consumer protection**: Stablecoin holder claims have priority in issuer insolvency

## Specification

### 1. Stablecoin Type Classification

Every stablecoin deployed on Lux must declare its type at deployment:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

enum StablecoinType {
    FIAT_COLLATERALIZED,    // USD/Treasury-backed (GENIUS compliant path)
    CRYPTO_COLLATERALIZED,  // Over-collateralized by crypto assets
    ALGORITHMIC,            // Algorithmic supply adjustment (restricted under GENIUS)
    HYBRID                  // Combination (must meet GENIUS reserves for fiat peg)
}
```

GENIUS Act compliance is **mandatory** for `FIAT_COLLATERALIZED` and `HYBRID` types when the issuer is US-regulated. `CRYPTO_COLLATERALIZED` and `ALGORITHMIC` types are subject to additional disclosure requirements but may not qualify as "payment stablecoins" under the Act.

### 2. Issuer Registry

```solidity
interface IIssuerRegistry {
    enum LicenseType {
        NONE,
        FEDERAL_OCC,          // Office of the Comptroller of the Currency
        STATE_REGULATED,      // State banking/trust charter
        FOREIGN_RECOGNIZED    // Foreign issuer with reciprocal agreement
    }

    struct IssuerInfo {
        address issuer;
        string legalName;
        LicenseType licenseType;
        string licenseNumber;
        string jurisdiction;      // "US-FEDERAL", "US-NY", "US-WY", etc.
        uint256 registeredAt;
        uint256 lastAttestationAt;
        bool active;
    }

    function registerIssuer(
        address issuer,
        string calldata legalName,
        LicenseType licenseType,
        string calldata licenseNumber,
        string calldata jurisdiction
    ) external;

    function getIssuer(address issuer) external view returns (IssuerInfo memory);
    function isCompliant(address issuer) external view returns (bool);
    function updateAttestation(address issuer, bytes32 attestationHash) external;
}
```

The `isCompliant()` function checks:
1. Issuer is registered and active
2. Last attestation is within 35 days (monthly + 5-day grace period)
3. License type matches jurisdiction requirements

### 3. Reserve Attestation

#### On-Chain Attestation Record

Each monthly CPA attestation is recorded on the A-Chain (Attestation Blockchain) and referenced on the C-Chain:

```solidity
interface IReserveAttestation {
    struct Attestation {
        bytes32 attestationId;      // A-Chain attestation ID
        address issuer;             // Stablecoin issuer
        address stablecoin;         // Stablecoin contract address
        uint256 totalSupply;        // Total stablecoin supply at attestation time
        uint256 totalReserves;      // Total reserves in USD (18 decimals)
        uint256 reserveRatio;       // Ratio (1e18 = 100%)
        string cpaFirm;            // Registered CPA firm name
        bytes32 reportHash;         // IPFS/Arweave hash of full CPA report
        uint256 attestedAt;         // Timestamp of attestation
        uint256 reportPeriodStart;  // Period covered start
        uint256 reportPeriodEnd;    // Period covered end
    }

    event AttestationRecorded(
        bytes32 indexed attestationId,
        address indexed issuer,
        uint256 reserveRatio,
        uint256 attestedAt
    );

    function recordAttestation(Attestation calldata attestation) external;
    function getLatestAttestation(address issuer) external view returns (Attestation memory);
    function getAttestationHistory(address issuer, uint256 count)
        external view returns (Attestation[] memory);
    function isAttestationCurrent(address issuer) external view returns (bool);
}
```

#### Reserve Composition Breakdown

The GENIUS Act specifies approved reserve assets. The attestation must break down reserve composition:

```solidity
struct ReserveBreakdown {
    uint256 usdCash;             // US dollar deposits at insured depository institutions
    uint256 usTreasuries;        // US Treasury bills (maturity <= 93 days)
    uint256 treasuryRepos;       // Fully collateralized Treasury repurchase agreements
    uint256 centralBankDeposits; // Federal Reserve deposits
    uint256 otherApproved;       // Other assets approved by the primary federal regulator
}
```

All fields denominated in USD with 18 decimal precision.

### 4. Redemption Guarantee

```solidity
interface IRedeemableStablecoin {
    enum RedemptionStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        REJECTED
    }

    struct RedemptionRequest {
        uint256 requestId;
        address holder;
        uint256 amount;
        uint256 requestedAt;
        uint256 deadline;           // Must complete within 1 business day
        RedemptionStatus status;
    }

    event RedemptionRequested(
        uint256 indexed requestId,
        address indexed holder,
        uint256 amount,
        uint256 deadline
    );

    event RedemptionCompleted(
        uint256 indexed requestId,
        address indexed holder,
        uint256 amount
    );

    /// @notice Request redemption of stablecoins for underlying reserve assets
    /// @param amount Amount of stablecoins to redeem
    /// @return requestId Unique redemption request identifier
    function requestRedemption(uint256 amount) external returns (uint256 requestId);

    /// @notice Check redemption request status
    function getRedemption(uint256 requestId) external view returns (RedemptionRequest memory);

    /// @notice Complete a redemption (called by issuer after off-chain settlement)
    function completeRedemption(uint256 requestId) external;

    /// @notice Maximum redemption processing time in seconds
    /// @dev GENIUS Act requires 1 business day = 86400 seconds (24 hours)
    function maxRedemptionTime() external view returns (uint256);
}
```

**Business day calculation**: The contract uses a 24-hour window from request time. Off-chain settlement for fiat redemption is the issuer's responsibility. The on-chain contract burns tokens upon `requestRedemption()` and records the obligation.

### 5. Enhanced LRC-32 Interface

The complete GENIUS-compliant stablecoin interface:

```solidity
interface ILRC32GENIUS is IERC20 {
    // Type and issuer
    function stablecoinType() external view returns (StablecoinType);
    function issuer() external view returns (address);
    function pegAsset() external view returns (string memory);  // "USD", "EUR", etc.

    // Reserve transparency
    function totalReserves() external view returns (uint256);
    function reserveRatio() external view returns (uint256);     // 1e18 = 100%
    function lastAttestationTime() external view returns (uint256);
    function isFullyBacked() external view returns (bool);

    // Redemption
    function requestRedemption(uint256 amount) external returns (uint256 requestId);
    function maxRedemptionTime() external view returns (uint256);

    // Compliance
    function isGENIUSCompliant() external view returns (bool);
    function issuerLicense() external view returns (IIssuerRegistry.LicenseType);

    // Mint/burn (issuer only)
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}
```

`isGENIUSCompliant()` returns `true` if and only if:
1. `stablecoinType` is `FIAT_COLLATERALIZED` or `HYBRID`
2. Issuer is registered in `IssuerRegistry` with valid license
3. Latest attestation is within 35 days
4. `reserveRatio` >= 1e18 (100% backing)
5. `maxRedemptionTime` <= 86400 (24 hours)

### 6. Algorithmic Stablecoin Disclosure

For `ALGORITHMIC` and `HYBRID` type stablecoins, additional disclosure is required:

```solidity
interface IAlgorithmicDisclosure {
    struct StabilityMechanism {
        string mechanismType;       // "rebase", "seigniorage", "fractional", etc.
        string description;
        uint256 collateralRatio;    // For partial collateralization (1e18 = 100%)
        address[] collateralTokens; // Tokens used as collateral
        bool hasDeathSpiral;        // Whether the mechanism can enter a death spiral
        string riskDisclosure;      // IPFS hash of risk disclosure document
    }

    function stabilityMechanism() external view returns (StabilityMechanism memory);
}
```

### 7. Insolvency Priority

The GENIUS Act grants stablecoin holders priority claims in issuer insolvency. This cannot be enforced purely on-chain but the contract records holder balances that serve as evidence of claims:

```solidity
/// @notice Snapshot holder balances for insolvency proceedings
/// @dev Called by issuer or regulator; creates immutable record
function snapshotBalances() external returns (uint256 snapshotId);

/// @notice Get holder balance at snapshot time
function balanceAtSnapshot(uint256 snapshotId, address holder)
    external view returns (uint256);
```

### 8. Oracle Integration for Reserve Verification

Real-time reserve verification uses the Oracle precompile (LP-9011):

```solidity
interface IReserveOracle {
    /// @notice Get latest reserve data from oracle
    /// @return totalReserves Total reserve value in USD (18 decimals)
    /// @return timestamp When the data was last updated
    /// @return source Data source identifier
    function getReserveData(address stablecoin)
        external view returns (uint256 totalReserves, uint256 timestamp, string memory source);
}
```

Oracle feeds can source from:
- Bank API attestations (via trusted oracle nodes)
- Treasury holdings verification services
- Auditor data feeds

### 9. Cross-Chain Stablecoin Bridging

When bridging GENIUS-compliant stablecoins via LP-3102:

1. Source chain: Burns stablecoin, records redemption obligation
2. Destination chain: Mints stablecoin, inherits issuer compliance status
3. Both chains: Check `isGENIUSCompliant()` before mint/burn
4. Bridge relayer: Passes attestation status cross-chain via Warp message

## Rationale

### Why Extend LRC-32 Rather Than Create New Standard

LRC-32 already defines compliant stablecoin behavior. The GENIUS Act requirements are an extension, not a replacement. Existing LRC-32 stablecoins can upgrade to GENIUS compliance by implementing the additional interfaces.

### Why On-Chain Attestation Records

The GENIUS Act requires monthly CPA attestation. Recording these on the A-Chain provides:
1. Immutable proof of attestation timing (no backdating)
2. Cross-chain verifiability (any Lux chain can check compliance)
3. Public transparency (anyone can verify reserve status)
4. Automated compliance checking (`isAttestationCurrent()`)

### Why 35-Day Grace Period

Monthly attestation with a 35-day validity window provides 5 days of buffer for CPA report preparation and on-chain submission. This prevents stablecoins from becoming non-compliant due to minor delays.

### Why Type Classification at Deployment

The GENIUS Act treats different stablecoin models differently. Classifying at deployment:
1. Prevents type-switching (algorithmic stablecoin pretending to be fiat-backed)
2. Enables automated compliance routing
3. Provides clear disclosure to holders

## Backwards Compatibility

Existing LRC-20 stablecoins on Lux that do not implement ILRC32GENIUS are unaffected. The GENIUS Act compliance is opt-in at the contract level. However, exchanges and DeFi protocols may choose to only list GENIUS-compliant stablecoins.

Existing LRC-32 stablecoins can upgrade by deploying a wrapper or proxy contract implementing the additional interfaces.

## Test Cases

### Reserve Attestation

```
Given: Issuer registered with FEDERAL_OCC license
When:  recordAttestation(attestation) called with reserveRatio = 1.05e18
Then:  isAttestationCurrent(issuer) returns true
       isGENIUSCompliant() returns true

Given: Last attestation was 36 days ago
When:  isAttestationCurrent(issuer) called
Then:  Returns false
       isGENIUSCompliant() returns false
```

### Redemption

```
Given: Holder has 1000 stablecoins
When:  requestRedemption(1000e18) called
Then:  RedemptionRequested event emitted
       Holder balance reduced by 1000e18
       Deadline set to block.timestamp + 86400

Given: Redemption request exists with deadline not passed
When:  completeRedemption(requestId) called by issuer
Then:  RedemptionCompleted event emitted
       Status set to COMPLETED
```

### Type Enforcement

```
Given: Stablecoin deployed as ALGORITHMIC
When:  isGENIUSCompliant() called
Then:  Returns false (algorithmic stablecoins require additional regulatory approval)

Given: Stablecoin deployed as FIAT_COLLATERALIZED
       Issuer registered, attestation current, reserves >= 100%
When:  isGENIUSCompliant() called
Then:  Returns true
```

## Reference Implementation

Reference implementations to be provided in:
- `/standard/contracts/stablecoin/LRC32GENIUS.sol` — Full GENIUS-compliant stablecoin
- `/standard/contracts/stablecoin/IssuerRegistry.sol` — Issuer registration and tracking
- `/standard/contracts/stablecoin/ReserveAttestation.sol` — A-Chain attestation bridge

## Security Considerations

### Oracle Manipulation

Reserve oracle feeds are a critical trust point. If an oracle falsely reports reserves, holders may be misled. Mitigations:
- Multi-source oracle aggregation (LP-9011)
- Outlier detection and circuit breakers
- On-chain vs. off-chain attestation cross-reference

### Redemption Bank Run

If all holders request redemption simultaneously, the 1-business-day guarantee depends on off-chain reserve liquidity. The on-chain contract can only burn tokens; it cannot force the issuer to settle in fiat.

**Mitigation**: Reserve composition rules (Treasury bills, cash) ensure high liquidity. The contract can implement a queue with priority ordering.

### Issuer Key Compromise

If the issuer's key is compromised, an attacker could mint unbacked stablecoins. Mitigations:
- Multi-sig or MPC-based issuer key (T-Chain integration)
- Mint rate limits
- Supply cap enforcement

### Regulatory Change

The GENIUS Act may be amended before or after passage. The contract architecture uses upgradeable parameters (attestation period, reserve requirements) that can be adjusted by governance without redeployment.

### Cross-Chain Consistency

When bridged across chains, a stablecoin's compliance status must be consistent. Stale attestation data on a destination chain could allow trading of non-compliant stablecoins. Mitigation: Warp messages carry attestation timestamps; destination chain validates freshness.

## Economic Impact

1. **Issuer adoption**: Clear compliance path attracts regulated stablecoin issuers to Lux
2. **DeFi liquidity**: GENIUS-compliant stablecoins are more likely to be listed on regulated exchanges
3. **Institutional confidence**: On-chain reserve transparency exceeds traditional banking disclosure
4. **Cross-chain premium**: Lux-native GENIUS compliance gives competitive advantage over chains without it

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
