---
lp: 3002
title: Governance Token Stack — K, DLUX, VLUX
description: Soul-bound reputation (K), rebasing governance (DLUX), and vote-locked voting power (VLUX)
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: LRC
created: 2025-12-23
updated: 2025-12-24
requires: 3020, 3000
tags: [governance, dao, tokenomics, staking, voting]
order: 3002
---

## Abstract

This LP specifies the Lux governance token stack consisting of three interrelated tokens:

1. **K (Karma)** — Human legitimacy and reputation score, non-transferable, DID-bound
2. **DLUX (DAO LUX)** — Rebasing governance token with OHM-style bonding mechanics
3. **VLUX (Vote-Locked LUX)** — Time-weighted voting power derived from staked DLUX and K

The system combines Olympus DAO (OHM) rebasing mechanics with Curve's vote-escrowed (ve) token model to create a governance system that rewards long-term alignment and active participation.

---

## Motivation

Traditional governance tokens suffer from several issues:

1. **Plutocracy**: Voting power correlates directly with wealth
2. **Short-termism**: No incentive for long-term commitment
3. **Sybil vulnerability**: Easy to create multiple accounts
4. **Passive accumulation**: Holding without participation is rewarded equally

The K/DLUX/VLUX stack addresses these by:

- **K (Karma)**: Human-bound reputation prevents Sybil attacks and weights voting by legitimacy
- **DLUX**: Rebasing rewards stakers while demurrage penalizes idle tokens
- **VLUX**: Time-weighted voting power rewards long-term staking commitment

---

## Specification

### Token Overview

```solidity
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GOVERNANCE TOKEN STACK                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐                                                                │
│  │   LUX   │─────────────┐                                                  │
│  │ (Base)  │             │ Stake 1:1                                        │
│  └─────────┘             ▼                                                  │
│                    ┌─────────┐                                              │
│                    │  DLUX   │ Rebasing + Demurrage                         │
│                    │(DAO LUX)│◄──── Protocol Revenue                        │
│                    └────┬────┘                                              │
│                         │ Stake                                             │
│  ┌─────────┐            ▼                                                   │
│  │    K    │     ┌─────────────┐                                            │
│  │ (Karma) │────►│    VLUX     │ = DLUX × f(K) × time_multiplier            │
│  └─────────┘     │(Vote Power) │                                            │
│       ▲          └─────────────┘                                            │
│       │                 │                                                   │
│  Reputation        Governance                                               │
│  Actions           Voting                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. K (Karma) — Human Legitimacy Score

K is a non-transferable, soul-bound reputation token that represents human legitimacy within the Lux ecosystem.

#### Properties

| Property | Value |
|----------|-------|
| **Transferable** | No (soul-bound) |
| **Mintable** | By approved attestation providers |
| **Burnable** | Via governance penalty |
| **Max per account** | 1000 K (soft cap) |
| **Bound to** | DID (Decentralized Identifier) |

#### Earning K

| Action | K Earned | Cooldown |
|--------|----------|----------|
| Complete identity verification | +100 K | One-time |
| Proof of Humanity attestation | +200 K | Annual |
| Governance proposal passed | +50 K | Per proposal |
| Vote on governance proposal | +1 K | Per vote |
| Successful dispute resolution | +25 K | Per dispute |
| Community contribution | +10-100 K | Per contribution |
| NFT staking duration bonus | +1 K / month | Monthly |

#### Losing K

| Action | K Lost |
|--------|--------|
| Governance penalty | -50 to -500 K |
| Failed malicious proposal | -100 K |
| Slashing event | -25% of K |
| Inactivity (>1 year) | -10% decay |

#### K Contract Interface

```solidity
interface IKarma {
    /// @notice Get K balance for account
    function karmaOf(address account) external view returns (uint256);

    /// @notice Check if account is human-verified
    function isVerified(address account) external view returns (bool);

    /// @notice Mint K to account (only attestation providers)
    function mint(address to, uint256 amount, bytes32 reason) external;

    /// @notice Burn K as penalty (only governance)
    function slash(address account, uint256 amount, bytes32 reason) external;

    /// @notice Get DID bound to account
    function didOf(address account) external view returns (bytes32);
}
```solidity

---

### 2. DLUX (DAO LUX) — Rebasing Governance Token

DLUX is the governance token obtained by staking LUX 1:1. It features OHM-style rebasing for stakers and demurrage for idle holdings.

#### Properties

| Property | Value |
|----------|-------|
| **Backing** | 1 LUX = 1 DLUX (redeemable) |
| **Rebase Rate** | 0.3-0.5% per epoch (8 hours) |
| **Demurrage Rate** | 0.1% per day on unstaked DLUX |
| **Max Supply** | Unlimited (backed by staked LUX) |
| **Transferable** | Yes |

#### Minting and Burning

```solidity
// Stake LUX to receive DLUX
function stake(uint256 luxAmount) external returns (uint256 dluxMinted);

// Unstake DLUX to receive LUX (may have cooldown)
function unstake(uint256 dluxAmount) external returns (uint256 luxReturned);

// Redeem DLUX for underlying LUX 1:1
function redeem(uint256 dluxAmount) external returns (uint256 luxReturned);
```

#### Rebase Mechanics (OHM-style)

Staked DLUX earns rebases funded by:
1. Protocol revenue (trading fees, lending interest)
2. Treasury yield
3. NFT staking emissions

```markdown
Daily APY = (1 + rebaseRate)^(rebases_per_day) - 1

Example: 0.4% per 8h epoch = 3 epochs/day
Daily APY = (1.004)^3 - 1 = 1.2%
Annual APY = (1.004)^(3*365) - 1 ≈ 7800%
```

#### Demurrage Mechanics

Unstaked DLUX in wallets (not in staking contracts) suffers demurrage:

```solidity
balance_after = balance_before × (1 - demurrage_rate)^days

Example: 0.1% daily demurrage
After 30 days: 1000 DLUX → 970.4 DLUX
After 365 days: 1000 DLUX → 694.0 DLUX
```

**Rationale**: Demurrage incentivizes active participation rather than passive holding.

#### Staking Tiers

| Tier | Min DLUX | Rebase Boost | Lock Period |
|------|----------|--------------|-------------|
| Bronze | 100 | 1.0x | None |
| Silver | 1,000 | 1.1x | 7 days |
| Gold | 10,000 | 1.25x | 30 days |
| Diamond | 100,000 | 1.5x | 90 days |
| Quantum | 1,000,000 | 2.0x | 365 days |

#### DLUX Contract Interface

```solidity
interface IDLUX {
    /// @notice Stake LUX to receive DLUX
    function stake(uint256 amount) external returns (uint256 dluxMinted);

    /// @notice Unstake DLUX to receive LUX
    function unstake(uint256 amount) external returns (uint256 luxReturned);

    /// @notice Claim rebased DLUX rewards
    function claimRebase() external returns (uint256 rebased);

    /// @notice Get pending rebase amount
    function pendingRebase(address account) external view returns (uint256);

    /// @notice Apply demurrage to account (anyone can call)
    function applyDemurrage(address account) external;

    /// @notice Get staking tier for account
    function tierOf(address account) external view returns (uint8 tier, uint256 boost);
}
```solidity

---

### 3. VLUX (Vote-Locked LUX) — Voting Power

VLUX represents voting power in Lux governance. It is not a token but a calculated value based on staked DLUX, K score, and stake duration.

#### Formula

```
VLUX = DLUX_staked × f(K) × time_multiplier

where:
  f(K) = sqrt(K / 100)  // Karma scaling function
  time_multiplier = 1 + (lock_months × 0.1)  // Max 4x at 30 months
```solidity

#### Example Calculations

| DLUX Staked | K Score | Lock Duration | VLUX |
|-------------|---------|---------------|------|
| 1,000 | 100 | 0 months | 1,000 × 1.0 × 1.0 = 1,000 |
| 1,000 | 400 | 0 months | 1,000 × 2.0 × 1.0 = 2,000 |
| 1,000 | 100 | 12 months | 1,000 × 1.0 × 2.2 = 2,200 |
| 1,000 | 400 | 12 months | 1,000 × 2.0 × 2.2 = 4,400 |
| 10,000 | 900 | 30 months | 10,000 × 3.0 × 4.0 = 120,000 |

#### Quadratic Voting (Optional)

For certain proposal types, quadratic voting can be enabled:

```
Effective Votes = sqrt(VLUX_spent)

Example: 10,000 VLUX → 100 effective votes
         40,000 VLUX → 200 effective votes (not 4x)
```solidity

#### VLUX Interface

```solidity
interface IVLUX {
    /// @notice Get voting power for account
    function votingPower(address account) external view returns (uint256);

    /// @notice Get voting power at specific block
    function votingPowerAt(address account, uint256 blockNumber) external view returns (uint256);

    /// @notice Lock DLUX for increased voting power
    function lock(uint256 amount, uint256 lockMonths) external;

    /// @notice Extend existing lock
    function extendLock(uint256 additionalMonths) external;

    /// @notice Get lock details
    function lockOf(address account) external view returns (
        uint256 amount,
        uint256 unlockTime,
        uint256 timeMultiplier
    );
}
```

---

### 4. NFT Staking for DLUX Yield

NFT holders can stake their NFTs to earn DLUX emissions:

#### Emission Rates

| NFT Collection | Daily DLUX per NFT | Requirements |
|----------------|-------------------|--------------|
| Genesis Collection | 10 DLUX | None |
| Premium Collection | 5 DLUX | None |
| Standard Collection | 1 DLUX | None |
| Community NFTs | 0.5 DLUX | K ≥ 100 |

#### NFT Staking Interface

```solidity
interface INFTStaking {
    /// @notice Stake NFT to earn DLUX
    function stakeNFT(address collection, uint256 tokenId) external;

    /// @notice Unstake NFT and claim pending DLUX
    function unstakeNFT(address collection, uint256 tokenId) external returns (uint256 dluxEarned);

    /// @notice Claim pending DLUX without unstaking
    function claimDLUX() external returns (uint256 dluxEarned);

    /// @notice Get pending DLUX for staker
    function pendingDLUX(address staker) external view returns (uint256);

    /// @notice Get emission rate for collection
    function emissionRate(address collection) external view returns (uint256 dluxPerDay);
}
```solidity

---

### 5. Emission Control Registry

Governance controls all DLUX emission parameters:

```solidity
interface IDLUXEmissionRegistry {
    /// @notice Set rebase rate (governance only)
    function setRebaseRate(uint256 ratePerEpoch) external;

    /// @notice Set demurrage rate (governance only)
    function setDemurrageRate(uint256 ratePerDay) external;

    /// @notice Set NFT collection emission rate (governance only)
    function setNFTEmission(address collection, uint256 dluxPerDay) external;

    /// @notice Set emission cap (governance only)
    function setEmissionCap(uint256 maxDailyEmission) external;

    /// @notice Pause all emissions (emergency)
    function pauseEmissions() external;

    /// @notice Get current emission parameters
    function getEmissionParams() external view returns (
        uint256 rebaseRate,
        uint256 demurrageRate,
        uint256 dailyEmissionCap,
        bool paused
    );
}
```

---

## Reference Implementation

### Contract Locations

Implementation repository: [`luxfi/standard`](https://github.com/luxfi/standard)

| Contract | Path | Status |
|----------|------|--------|
| Karma.sol | `contracts/governance/Karma.sol` | ✅ Implemented |
| DLUX.sol | `contracts/governance/DLUX.sol` | ✅ Implemented |
| vLUX.sol | `contracts/governance/vLUX.sol` | ✅ Implemented |
| VotingPower.sol | `contracts/governance/VotingPower.sol` | ✅ Implemented |
| NFTStaking.sol | `contracts/staking/NFTStaking.sol` | Planned |
| EmissionRegistry.sol | `contracts/governance/EmissionRegistry.sol` | Planned |
| Governor.sol | `contracts/governance/Governor.sol` | ✅ Implemented |
| sLUX.sol | `contracts/staking/sLUX.sol` | ✅ Implemented |

### Implementation Notes

**Karma.sol** (10.3 KB):
- Soul-bound reputation with DID linking
- ATTESTOR_ROLE and SLASHER_ROLE access control
- Inactivity decay after 365 days (10% per year)
- Max 1000 K per account soft cap

**DLUX.sol** (19.7 KB):
- OHM-style rebasing with 8-hour epochs
- Demurrage: 0.1% per day on unstaked balance
- Five tiers: Bronze, Silver, Gold, Diamond, Quantum
- Lock periods from none (Bronze) to 365 days (Quantum)
- Rebase boost from 1.0x to 2.0x based on tier

**VotingPower.sol** (10.3 KB):
- VLUX = DLUX × f(K) × time_multiplier
- f(K) = sqrt(K / 100) for Karma scaling
- Time multiplier: 1 + (lock_months × 0.1), max 4.0x
- Quadratic voting support
- Historical snapshots for governance proposals

### Deployment Order

1. Deploy Karma (K)
2. Deploy DLUX with K address
3. Deploy VotingPower with DLUX + K
4. Deploy NFTStaking with DLUX
5. Deploy EmissionRegistry
6. Deploy Governor with VotingPower
7. Transfer EmissionRegistry ownership to Governor

---

## Governance Integration

### Proposal Thresholds

| Action | VLUX Required |
|--------|---------------|
| Create Proposal | 10,000 VLUX |
| Fast-track Proposal | 100,000 VLUX |
| Emergency Action | 500,000 VLUX + 5 K holders |

### Quorum Requirements

| Proposal Type | Quorum (% of circulating VLUX) |
|--------------|-------------------------------|
| Parameter Change | 4% |
| Treasury Allocation | 10% |
| Protocol Upgrade | 20% |
| Emergency | 33% |

### Voting Periods

| Proposal Type | Voting Period | Timelock |
|--------------|---------------|----------|
| Standard | 7 days | 2 days |
| Fast-track | 3 days | 1 day |
| Emergency | 24 hours | None |

---

## Security Considerations

### Sybil Resistance
- K is soul-bound to DIDs, preventing multi-account attacks
- Human verification required for meaningful K accumulation
- Quadratic voting further reduces plutocratic influence

### Economic Security
- Demurrage prevents passive token accumulation
- Lock periods prevent governance attacks via flash loans
- Treasury backing ensures DLUX intrinsic value

### Emergency Controls
- Governance can pause emissions
- Multi-sig emergency actions for critical vulnerabilities
- Timelock on all parameter changes

---

## Backwards Compatibility

This LP introduces new tokens (K, DLUX, VLUX) that do not replace existing functionality. The governance token stack is additive:

- **LUX Token**: Remains unchanged as the base staking asset
- **Existing Governance**: Current governance contracts continue to function
- **Migration Path**: Users can opt-in to DLUX staking at their discretion

No breaking changes are introduced. The new token contracts deploy alongside existing infrastructure.

---

## Rationale

### Why OHM + veToken Hybrid?

- **OHM rebasing**: Rewards active stakers with high APY
- **Demurrage**: Penalizes passive holding, encouraging participation
- **veToken locking**: Time-weighted commitment increases voting power
- **K reputation**: Human legitimacy prevents Sybil attacks

### Why Separate K from DLUX?

K (Karma) is reputation-based and soul-bound, while DLUX is economic and transferable. Separating them allows:
- Trading DLUX without losing reputation
- Reputation to persist across economic cycles
- Different earning mechanisms for each

### Why Quadratic Voting?

Quadratic voting reduces whale influence while still allowing token-weighted governance:
- 100 VLUX → 10 votes
- 10,000 VLUX → 100 votes (not 1000)

This balances token-holder interests with democratic ideals.

---

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-3000 | Standard Library Registry | Implementation location |
| LP-3020 | LRC-20 Token Standard | Base token interface |
| LP-3210 | NFT Staking Standard | NFT staking pattern |

## References

- [Olympus DAO](https://docs.olympusdao.finance/) — OHM rebasing mechanics
- [Curve veCRV](https://curve.readthedocs.io/dao-vecrv.html) — Vote-escrow mechanics
- [Gitcoin Passport](https://passport.gitcoin.co/) — Human verification reference

---

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
