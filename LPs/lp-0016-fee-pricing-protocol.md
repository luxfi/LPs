---
lp: 16
title: Fee Pricing Protocol
description: Multi-resource fee model with per-byte pricing, congestion multipliers, and action-based fees
author: Lux Core Team
status: Draft
tags: [core, fees, governance]
type: Standards Track
category: Core
created: 2025-12-30
requires: [1]
order: 11
tier: core
---

# LP-0016: Fee Pricing Protocol

## Abstract

This LP defines a comprehensive fee pricing protocol for all 11 Lux chains that is (a) hard to spam, (b) predictable for users, (c) aligned with actual resource consumption, and (d) easy for governance to manage. **Each chain has its own independently tunable fee parameters**, all controlled through C-Chain governance (DAO + Timelock) and propagated via Warp messages.

## Governance Overview

**All fee parameters are governance-controlled on C-Chain:**

```
Token Holders → FeeGovernor → FeeTimelock → ChainFeeRegistry → WarpFeeEmitter
                (vote 1 week)  (24h delay)    (store params)     (broadcast)
                                                    ↓
                                            Warp Messages to all chains
```

**Key Governance Principles:**
1. **Per-Chain Independence**: Each of the 11 chains has its own complete fee parameter set
2. **DAO Control**: 100,000 LUX proposal threshold, 4% quorum, 1-week voting period
3. **Timelock Protection**: 24-hour delay for normal changes, 1-hour for emergencies
4. **Emergency Constraints**: Emergency role can only raise fees (≤2x), never lower
5. **Cross-Chain Sync**: Warp messages ensure all chains receive updates atomically

**Governance Contracts (C-Chain):**
- `ChainFeeRegistryV2`: Central storage for all 11 chains' fee parameters
- `FeeGovernor`: OpenZeppelin Governor with proposal helpers
- `FeeTimelock`: TimelockController with emergency constraints
- `WarpFeeEmitter`: Cross-chain fee update broadcasting

## Motivation

A single "base fee per tx" across heterogeneous chains is insufficient:
- **Spam Vulnerability**: Low-fee chains become spam sinks
- **Resource Misalignment**: Different chains have different cost profiles
- **Unpredictability**: Users cannot estimate fees under load
- **Governance Complexity**: Hard to tune 11 different chains

This LP addresses these issues with a unified formula that adapts to each chain's resource model.

## Specification

### 1. EIP-1559 Style Fee Model (Adapted for Lux)

#### 1.1 Fee-Units (Generalized "Gas")

Each transaction has a weight calculated as:

```
w(tx) = pByte × bytes + pExec × exec + pState × state
```

This `w(tx)` is the chain's "fee-units" (analogous to gas on Ethereum).

#### 1.2 Transaction Fields

Each transaction specifies:
- **maxFeePerUnit** (µLUX per fee-unit): Maximum total fee willing to pay
- **maxPriorityFeePerUnit** (µLUX per fee-unit): Maximum tip for validators
- **Resource limits**: maxBytes, maxExec, maxState (or combined maxWeight)

#### 1.3 Payment Rule

Let `basePerUnit` be the protocol-determined base rate (dynamic, like EIP-1559 baseFee):

```
effectiveTipPerUnit = min(maxPriorityFeePerUnit, maxFeePerUnit - basePerUnit)
totalPaid = w(tx) × (basePerUnit + effectiveTipPerUnit)
```

**Key insight**: Setting a high `maxFeePerUnit` does NOT cause overpayment—it just prevents tx from getting stuck if base fee rises. Users only pay `basePerUnit + effectiveTip`.

#### 1.4 Inclusion Rule

A transaction is includable if and only if:
1. `maxFeePerUnit >= basePerUnit`
2. It respects resource limits (maxBytes, maxExec, etc.)

#### 1.5 Ordering Rule

Validators order transactions by effective tip revenue:
- **Default**: Sort by `effectiveTipPerUnit` (simpler)
- **Alternative**: Sort by `effectiveTipTotal = effectiveTipPerUnit × w(tx)` (incentivizes larger txs)

Recommended: Use `effectiveTipPerUnit` with a minimum tip floor to avoid "big tx dominates" pathologies.

#### 1.6 Fee Distribution

| Component | Destination | Rationale |
|-----------|-------------|-----------|
| Base fee | Burn (70%) + Treasury (30%) | Monetary policy + protocol funding |
| Priority fee | Validators/Sequencers | Direct incentive to prioritize |

**Governance can adjust the burn/treasury split**, but priority fees ALWAYS go to validators.

#### 1.7 Base Fee Update Algorithm

After each block:

```python
targetWeight = maxBlockWeight × targetUtilization

if blockWeight == targetWeight:
    newBase = oldBase
elif blockWeight > targetWeight:
    delta = oldBase × maxChangeRate × (blockWeight - targetWeight) / targetWeight
    newBase = min(oldBase + delta, maxBase)
else:
    delta = oldBase × maxChangeRate × (targetWeight - blockWeight) / targetWeight
    newBase = max(oldBase - delta, minBase)
```

**Default Parameters**:
- `targetUtilization`: 50% (like Ethereum)
- `maxChangeRate`: 12.5% per block (like Ethereum)
- `minBase`: 1 µLUX per fee-unit (floor)
- `maxBase`: Chain-specific (1000-10000 µLUX)

### 2. ChainFeeConfig Structure (EIP-1559 Style)

```solidity
/// @notice Weight coefficients for fee-unit calculation
struct WeightCoefficients {
    uint64 pByteMicroLux;     // Per-byte weight (µLUX per byte)
    uint64 pExecMicroLux;     // Per-exec-unit weight (µLUX per unit)
    uint64 pStateMicroLux;    // Per-state-touch weight (µLUX per touch)
}

/// @notice EIP-1559 style base fee parameters
struct BaseFeeParams {
    uint64 basePerUnit;           // Current base fee per fee-unit (µLUX)
    uint64 minBasePerUnit;        // Floor (prevents base from going to 0)
    uint64 maxBasePerUnit;        // Ceiling (prevents runaway fees)
    uint32 targetUtilization;     // Target block utilization (bps, 5000 = 50%)
    uint32 maxChangePerBlock;     // Max % change per block (bps, 1250 = 12.5%)
}

/// @notice Fee distribution configuration
struct FeeDistribution {
    uint32 burnBps;               // % of base fee burned (basis points)
    uint32 treasuryBps;           // % of base fee to treasury
    address treasury;             // Treasury address
    // Note: priority fees always go to validators (not configurable)
}

/// @notice Complete chain fee configuration
struct ChainFeeConfig {
    WeightCoefficients weights;   // w(tx) calculation coefficients
    BaseFeeParams baseFee;        // EIP-1559 base fee params
    FeeDistribution distribution; // Burn/treasury split
    uint32 maxTxBytes;            // Max tx size (0 = no limit)
    uint64 maxExecUnits;          // Max exec units (0 = no limit)
    uint32 maxStateTouches;       // Max state touches (0 = no limit)
    bool enabled;
    uint64 lastUpdated;
}
```

**Transaction Parameters** (submitted by users):
```solidity
struct TxFeeParams {
    uint64 maxFeePerUnit;         // Max total fee willing to pay per fee-unit
    uint64 maxPriorityFeePerUnit; // Max tip for validators per fee-unit
}
```

### 3. Legacy Congestion Multiplier (Optional Fallback)

For chains not using full EIP-1559 semantics, a simpler congestion multiplier can be applied:

Let `u` be EMA utilization in [0, 10000] (basis points), target `t`:

```
if u <= t:
    M = 1.0  (10000 basis points)
else:
    M = min(M_cap, 1 + alpha × (u - t) / (1 - t))
```

This provides:
- **Predictability**: Fees flat when utilization is low
- **Spam Resistance**: Fees rise when chain is congested
- **Stability**: Linear rise avoids exponential spikes

**Note**: For EIP-1559 style chains, use the base fee update algorithm in Section 1.7 instead.

#### EMA Update Rule

After each block:
```
new_util = 0.9 × old_util + 0.1 × current_block_util
```

Where `current_block_util = block_weight / target_weight`.

### 4. Per-Chain Governance Proposals

Each chain's fees can be updated independently through governance:

```solidity
// Update a single chain's fees
function proposeFeeUpdate(
    uint8 chainId,                         // 0-10 for P/X/A/B/C/D/T/G/Q/K/Z
    ChainFeeParams calldata params,        // Complete new parameter set
    string calldata description            // "Increase Z-Chain floor to prevent ZK spam"
) external returns (uint256 proposalId);

// Batch update multiple chains
function proposeBatchFeeUpdate(
    uint8[] calldata chainIds,             // e.g., [6, 8, 10] for T/Q/Z
    ChainFeeParams[] calldata params,      // One param set per chain
    string calldata description
) external returns (uint256 proposalId);

// Update subnet fees (for L2s/appchains)
function proposeSubnetFeeUpdate(
    bytes32 subnetId,
    ChainFeeParams calldata params,
    string calldata description
) external returns (uint256 proposalId);
```

**Example Governance Proposal**:
```
Proposal: "LP-9020-001: Increase T-Chain floor to 3000 µLUX"

Chain: T-Chain (6)
Rationale: FHE operations are being underpriced, leading to spam
Current floor: 2000 µLUX
Proposed floor: 3000 µLUX
Other params: unchanged

Timeline:
- Voting: 7 days
- Timelock: 24 hours
- Effective: ~8 days from proposal
```

### 5. Chain-Specific Profiles

#### Profile 1: Infrastructure/Base Ledger (P, X, K)
- Moderate floor
- Moderate per-byte
- Low exec/state (unless K has heavy crypto ops)

#### Profile 2: Smart Contract Execution (C)
- Keep gas-style pricing (exec-heavy)
- Enforce floor and per-byte
- Add state surcharge for writes/storage growth

#### Profile 3: Prover/Crypto-Heavy (B, T, Q, Z)
- Higher exec price and/or higher floor
- Strong congestion scaling (easiest to DoS with "valid but expensive" work)

#### Profile 4: Data/Indexing Heavy (G)
- Per-byte dominant pricing
- Higher floor prevents cheap blob spam

#### Profile 5: Specialized App Chains (A, D)
- A (attestations): Price by bytes + signature verifies (exec)
- D (orderbook): Action-based fees (place/cancel/match) + per-byte

### 5. Recommended Base Parameters

| Chain | Floor (µLUX) | pByte | pExec | pState | Target | Alpha | mCap |
|-------|--------------|-------|-------|--------|--------|-------|------|
| P-Chain | 1,000 | 10 | 1 | 50 | 60% | 50% | 5x |
| X-Chain | 1,000 | 10 | 1 | 50 | 60% | 50% | 5x |
| A-Chain | 750 | 15 | 5 | 30 | 70% | 60% | 8x |
| B-Chain | 2,500 | 20 | 50 | 100 | 50% | 80% | 10x |
| C-Chain | 1,000 | 5 | 1 | 100 | 60% | 50% | 5x |
| D-Chain | 750 | 10 | 2 | 20 | 70% | 60% | 8x |
| T-Chain | 3,000 | 25 | 100 | 200 | 50% | 100% | 20x |
| G-Chain | 400 | 50 | 1 | 10 | 70% | 40% | 5x |
| Q-Chain | 2,000 | 30 | 75 | 150 | 50% | 80% | 15x |
| K-Chain | 1,250 | 20 | 30 | 80 | 60% | 60% | 8x |
| Z-Chain | 3,500 | 40 | 150 | 250 | 50% | 100% | 20x |

### 6. D-Chain Action Fees (Orderbook)

Orderbooks are attacked via cancel/replace floods and tiny orders. Implement action-based fees:

```solidity
struct OrderbookActionFees {
    uint64 placeOrderFloor;   // Floor for placing an order
    uint64 placeOrderPerByte; // Per-byte for order data
    uint64 cancelOrderFee;    // Fee for canceling (anti-spam)
    uint64 modifyOrderFee;    // Fee for modify/replace
    uint64 matchTradeFee;     // Fee per trade match (can be 0)
    uint64 makerRebateBps;    // Maker rebate in basis points
}
```

#### Recommended D-Chain Action Fees

| Action | Fee (µLUX) | Rationale |
|--------|------------|-----------|
| Place Order | 500 + 5/byte | Base + data size |
| Cancel Order | 350 | ~70% of place (anti-cancel-storm) |
| Modify Order | 400 | ~80% of place |
| Match Trade | 0 | Free matching (incentivize liquidity) |
| Maker Rebate | 0.5% | Incentivize liquidity provision |

If maker incentives are desired, implement via rebates from protocol budget, not negative fees.

### 7. Emergency Governance Controls

Emergency role can ONLY perform constrained changes:

| Action | Constraint |
|--------|------------|
| Raise floor | ≤ 2× current |
| Raise pByte | ≤ 3× current |
| Raise mCap/alpha | ≤ 2× current |
| Emergency pause | Allowed |
| Lower fees | NOT allowed (normal governance only) |

Emergency proposals require 2× normal quorum or separate emergency multisig.

### 8. Warp Message Propagation

When fee parameters change:

1. **Governor** proposes update → passes vote
2. **Timelock** delays execution (24h normal, 1h emergency)
3. **ChainFeeRegistry** stores new params, emits event
4. **WarpFeeEmitter** creates signed Warp message
5. **Validators** relay Warp message to all chains
6. **Each chain** updates local fee params from Warp payload

#### Warp Payload Structure

```solidity
struct FeeUpdatePayload {
    uint8 messageType;       // WARP_TYPE_FEE_UPDATE = 0x01
    uint8 chainId;           // Target chain (0-10)
    uint64 floorMicroLux;
    uint64 pByteMicroLux;
    uint64 pExecMicroLux;
    uint64 pStateMicroLux;
    uint32 targetUtilization;
    uint32 alpha;
    uint32 mCap;
    bool enabled;
    uint256 version;
    uint64 timestamp;
}
```

### 9. Congestion Consistency

Each chain computes utilization consistently:

| Chain | Block Weight Definition |
|-------|------------------------|
| P/X/K | Sum of tx bytes + base per-tx |
| C | Gas used |
| A | Bytes + signature count × 500 |
| B | Bytes + MPC verification count × 2000 |
| D | Action count × 100 + bytes |
| T/Z | Bytes + prover cycles / 1000 |
| G | Query bytes |
| Q | Proof bytes + verification cycles / 500 |

Target weight per block should be ~70% of max capacity.

### 10. Fee Calculation Examples (EIP-1559 Style)

#### Example 1: P-Chain Transfer (Low Congestion)
```
Transaction parameters:
  bytes = 150, exec = 0, state = 2 (read + write)
  maxFeePerUnit = 10 µLUX
  maxPriorityFeePerUnit = 2 µLUX

Step 1: Calculate fee-units (w(tx))
  w(tx) = 10 × 150 + 1 × 0 + 50 × 2 = 1,600 fee-units

Step 2: Current basePerUnit = 1 µLUX (low utilization)

Step 3: Check inclusion (maxFeePerUnit >= basePerUnit)
  10 >= 1 ✓ Includable

Step 4: Calculate effective tip
  effectiveTip = min(2, 10 - 1) = min(2, 9) = 2 µLUX/unit

Step 5: Calculate total fee
  baseFee     = 1,600 × 1 = 1,600 µLUX
  priorityFee = 1,600 × 2 = 3,200 µLUX
  totalFee    = 1,600 + 3,200 = 4,800 µLUX

Distribution:
  Burned:    1,600 × 70% = 1,120 µLUX
  Treasury:  1,600 × 30% = 480 µLUX
  Validator: 3,200 µLUX
```

#### Example 2: C-Chain Contract Call (High Congestion)
```
Transaction parameters:
  bytes = 500, exec = 100,000 gas, state = 10
  maxFeePerUnit = 100 µLUX
  maxPriorityFeePerUnit = 5 µLUX

Step 1: Calculate fee-units
  w(tx) = 5 × 500 + 1 × 100,000 + 100 × 10 = 103,500 fee-units

Step 2: Current basePerUnit = 25 µLUX (high congestion)

Step 3: Check inclusion
  100 >= 25 ✓ Includable

Step 4: Calculate effective tip
  effectiveTip = min(5, 100 - 25) = min(5, 75) = 5 µLUX/unit

Step 5: Calculate total fee
  baseFee     = 103,500 × 25 = 2,587,500 µLUX
  priorityFee = 103,500 × 5 = 517,500 µLUX
  totalFee    = 2,587,500 + 517,500 = 3,105,000 µLUX (3.1 LUX)

Note: User set maxFeePerUnit=100 but only paid 30 (25 base + 5 tip).
The high maxFeePerUnit just ensures tx doesn't get stuck.
```

#### Example 3: G-Chain Large Query
```
Transaction parameters:
  bytes = 50,000, exec = 100, state = 0
  maxFeePerUnit = 5 µLUX
  maxPriorityFeePerUnit = 1 µLUX

Step 1: Calculate fee-units
  w(tx) = 50 × 50,000 + 1 × 100 + 10 × 0 = 2,500,100 fee-units

Step 2: Current basePerUnit = 1 µLUX

Step 3: Calculate effective tip
  effectiveTip = min(1, 5 - 1) = 1 µLUX/unit

Step 5: Calculate total fee
  baseFee     = 2,500,100 × 1 = 2,500,100 µLUX
  priorityFee = 2,500,100 × 1 = 2,500,100 µLUX
  totalFee    = 5,000,200 µLUX (5.0 LUX)
```

#### Example 4: D-Chain Order Place
```
Transaction parameters:
  action = 0 (place order)
  orderBytes = 200
  maxFeePerUnit = 10 µLUX
  maxPriorityFeePerUnit = 2 µLUX

Step 1: Calculate fee-units
  baseUnits = 500 (place order base)
  byteUnits = 10 × 200 = 2,000
  w(tx) = 500 + 2,000 = 2,500 fee-units

Step 2: Current basePerUnit = 1 µLUX

Step 3: Calculate effective tip
  effectiveTip = min(2, 10 - 1) = 2 µLUX/unit

Step 4: Calculate total fee
  baseFee     = 2,500 × 1 = 2,500 µLUX
  priorityFee = 2,500 × 2 = 5,000 µLUX
  totalFee    = 7,500 µLUX
```

## Rationale

### Why Multi-Resource Pricing?

Single-dimension fees (just bytes OR just exec) create arbitrage opportunities. Attackers find the cheapest resource to spam. Multi-resource pricing ensures every dimension is priced.

### Why EIP-1559 Style?

EIP-1559 separates transaction pricing into base fee (protocol-determined) and priority fee (user-determined):
- **No overpayment**: Users only pay actual fee, not their max bid
- **Predictable**: Base fee changes gradually (≤12.5% per block)
- **Fair ordering**: Priority fee determines inclusion order
- **Fee burning**: Base fee burn creates deflationary pressure

### Why Per-Unit Tips?

Tips must be defined **per fee-unit**, not as flat amounts:
- Prevents gaming via transaction size manipulation
- Consistent ordering across different chain types
- Fair comparison between small and large transactions

### Why Action Fees for D-Chain?

Orderbooks have unique abuse patterns:
- **Cancel storms**: Flood cancels to disrupt matching
- **Tiny orders**: Create state bloat with minimal risk
- **Modify spam**: Rapid order modifications

Action fees directly price these behaviors.

## Backwards Compatibility

- **C-Chain**: Existing gas pricing continues; this adds floor and congestion
- **Other chains**: New fee structure; old transactions may need updated fee estimates
- **Wallets**: Must update fee estimation APIs

## Test Cases

### Unit Tests

1. Fee-unit calculation matches `w(tx) = pByte × bytes + pExec × exec + pState × state`
2. Inclusion rule: `isIncludable` returns true iff `maxFeePerUnit >= basePerUnit`
3. Effective tip: `min(maxPriorityFee, maxFee - baseFee)`
4. Total fee breakdown: `baseFee + priorityFee` with correct per-unit multiplication
5. Base fee update stays within `[minBase, maxBase]`
6. Base fee increases when `blockWeight > targetWeight`
7. Base fee decreases when `blockWeight < targetWeight`
8. Fee distribution: `burnBps + treasuryBps == 10000`
9. Emergency constraints enforced (≤2x floor raise only)
10. Warp payload encoding/decoding roundtrips

### Integration Tests

1. Full governance flow: propose → vote → timelock → execute → Warp
2. Multi-chain fee update propagation
3. Congestion response under sustained load
4. D-Chain action fee charging

### Load Tests

1. 10,000 TPS sustained → base fee rises by 12.5% per block toward max
2. Spam attack → base fee hits maxBase within ~20 blocks
3. Load reduction → base fee decreases 12.5% per block toward minBase
4. Full blocks → base fee doubles in ~8 blocks (1.125^8 ≈ 2.6x)
5. Empty blocks → base fee halves in ~8 blocks

## Reference Implementation

### Contract Locations

```
node/contracts/governance/
├── ChainFeeRegistryV3.sol    # EIP-1559 style fee registry
├── ChainFeeRegistryV2.sol    # Legacy congestion multiplier registry
├── FeeGovernor.sol           # DAO governance
├── FeeTimelock.sol           # Timelock controller
└── WarpFeeEmitter.sol        # Cross-chain messaging
```

### Key Functions (ChainFeeRegistryV3)

```solidity
// Calculate fee-units for a transaction (w(tx))
function calculateFeeUnits(
    uint8 chainId,
    uint32 txBytes,
    uint64 execUnits,
    uint32 stateTouches
) external view returns (uint64 feeUnits);

// Check if transaction is includable (maxFeePerUnit >= basePerUnit)
function isIncludable(
    uint8 chainId,
    uint64 maxFeePerUnit
) external view returns (bool includable);

// Calculate effective tip per unit
function calculateEffectiveTip(
    uint8 chainId,
    uint64 maxFeePerUnit,
    uint64 maxPriorityFeePerUnit
) external view returns (uint64 effectiveTip);

// Calculate total fee with breakdown
function calculateTotalFee(
    uint8 chainId,
    uint32 txBytes,
    uint64 execUnits,
    uint32 stateTouches,
    uint64 maxFeePerUnit,
    uint64 maxPriorityFeePerUnit
) external view returns (
    uint64 totalFee,
    uint64 baseFee,
    uint64 priorityFee
);

// Update base fee after block (called by validators)
function updateBaseFee(
    uint8 chainId,
    uint64 blockWeight,
    uint64 maxBlockWeight
) external;

// Distribute collected base fees (burn + treasury)
function distributeBaseFees(
    uint8 chainId,
    uint256 baseFeeCollected
) external;

// D-Chain orderbook fees
function calculateOrderbookFee(
    uint8 action,    // 0=place, 1=cancel, 2=modify, 3=match
    uint32 orderBytes,
    uint64 maxFeePerUnit,
    uint64 maxPriorityFeePerUnit
) external view returns (uint64 totalFee, uint64 baseFee, uint64 priorityFee);
```

## Security Considerations

### Spam Resistance

- **Floor**: Prevents dust attacks
- **Per-byte**: Prevents blob spam
- **Congestion**: Raises cost under attack
- **mCap**: Limits maximum damage to legitimate users

### Governance Safety

- **Timelock**: 24h delay prevents rushed changes
- **Emergency constraints**: Bounded adjustments only
- **Quorum**: 4% of voting power required

### Oracle/Manipulation Risks

- Congestion is computed on-chain from block data
- No external oracle dependency
- Validators cannot manipulate (consensus required)

### Cross-Chain Consistency

- Warp messages signed by validator set
- Version numbers prevent replay/rollback
- Timestamp validation prevents stale updates

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
