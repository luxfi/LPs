---
lp: 0314
title: Fee Manager Precompile
description: Native precompile for dynamic fee configuration and EIP-1559 management
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-11-14
activation:
  flag: lp314-feemanager-precompile
  hfName: "Genesis"
  activationHeight: "0"
tags: [precompile, gas, evm]
---

## Abstract

This LP specifies the Fee Manager precompile at address `0x0200000000000000000000000000000000000003`, which provides on-chain configuration of gas fees, base fees, and EIP-1559 parameters. The precompile enables dynamic fee adjustment without hard forks, custom fee models for app chains, and programmatic fee management.

## Motivation

Different blockchain applications require different fee models:

1. **Enterprise Chains**: May want zero fees for authorized users
2. **Gaming Chains**: Need predictable, low fees
3. **DeFi Chains**: Require dynamic fees based on congestion
4. **Private Chains**: Custom fee distribution models

The Fee Manager precompile enables chains to implement custom fee economics without modifying node code.

## Specification

### Precompile Address
```
0x0200000000000000000000000000000000000003
```

### Functions

#### setFeeConfig
```solidity
function setFeeConfig(
    uint256 gasLimit,
    uint256 targetBlockRate,
    uint256 minBaseFee,
    uint256 targetGas,
    uint256 baseFeeChangeDenominator,
    uint256 minBlockGasCost,
    uint256 maxBlockGasCost,
    uint256 blockGasCostStep
) external;
```

#### getFeeConfig
```solidity
function getFeeConfig() external view returns (FeeConfig memory);
```

#### getLastChangedAt
```solidity
function getLastChangedAt() external view returns (uint256 blockNumber);
```

### Access Control

Only addresses in the FeeManager admin list can modify fee configuration.

### Gas Costs
- Read operations: 2,500 gas
- Write operations: 20,000 gas base + state changes

## Reference Implementation

See: `node/vms/evm/lp176/`

**Key Files:**
- `config.go`: FeeConfig structure and validation
- `state.go`: Fee configuration state management
- `manager.go`: Fee update and history management
- `gasmeters.go`: Gas cost calculation with dynamic fees

**EVM Integration:**
- Location: `evm/precompile/contracts/fee-manager/`
- Contract: `contract.go` - Precompile implementation
- Interface: `IFeeManager.sol` - Solidity interface and library
- Module: `module.go` - Precompile registration

**Precompile Address:** `0x0200000000000000000000000000000000000003`

**Gas Costs:**
- Read operations: 2,500 gas
- Write operations: 20,000 gas base + state changes
- Parameter update validation: Included in write cost

## Rationale

### Design Decisions

**1. Precompile vs. System Contract**: A precompile provides deterministic gas costs and cannot be modified or upgraded accidentally. Fee configuration is critical infrastructure that should not be vulnerable to contract bugs.

**2. Role-Based Access Control**: The FeeManager role prevents unauthorized fee changes while allowing flexibility in governance structures. Chains can assign this role to multisigs, DAOs, or admin addresses as needed.

**3. Parameter Validation**: On-chain validation ensures invalid fee configurations cannot be applied. This prevents denial-of-service through misconfiguration and maintains network stability.

**4. Event Emission**: `FeeConfigChanged` events enable off-chain monitoring and indexing of fee parameter changes for transparency and analytics.

### Alternatives Considered

- **Governor-controlled**: Rejected as too slow for operational fee adjustments needed during network congestion
- **Automatic EIP-1559**: Partially adopted; manual override capability retained for exceptional circumstances
- **Per-transaction fee setting**: Rejected due to complexity and potential for abuse
- **Immutable defaults**: Rejected as chains may need different parameters based on use case

## Test Cases

### Test Vector 1: Set Valid Fee Config
**Input:**
```solidity
setFeeConfig(
    gasLimit: 8_000_000,
    targetBlockRate: 2,
    minBaseFee: 1 gwei,
    targetGas: 15_000_000,
    baseFeeChangeDenominator: 36,
    minBlockGasCost: 0,
    maxBlockGasCost: 1000 gwei,
    blockGasCostStep: 200 wei
)
```
**Expected:** Success, fee config updated
**Expected Gas:** ~20,000 (write cost)
**Expected Event:** FeeConfigChanged emitted

### Test Vector 2: Get Fee Config
**Input:** Call `getFeeConfig()`
**Expected:** Returns current FeeConfig structure
**Expected Gas:** ~2,500 (read cost)

### Test Vector 3: Rate Limiting (Update Too Frequent)
**Input:** Two `setFeeConfig` calls within 100 blocks
**Expected:** Second call reverts with "too frequent"
**Expected Gas:** Second call reverts, gas consumed on validation

### Test Vector 4: Invalid Parameter Ranges
**Input:** `setFeeConfig` with minBaseFee > maxBaseFee
**Expected:** Revert with "invalid fee parameters"
**Expected Gas:** ~5,000 (validation cost)

### Test Vector 5: Unauthorized Access
**Input:** Call `setFeeConfig` from non-admin address
**Expected:** Revert with "unauthorized"
**Expected Gas:** ~500 (early permission check)

### Test Vector 6: EIP-1559 Base Fee Update
**Input:** Block gas limit exceeded, trigger base fee increase
**Expected:** Base fee increases according to formula
**Expected Gas:** Included in block processing, ~1,000-2,000

## Security Considerations

### Access Control
- **Admin List**: Only whitelisted addresses can call `setFeeConfig`
- **Governance**: Admin list managed via separate governance mechanism
- **Emergency**: Protocol can disable FeeManager via chain config
- **Transparent**: All changes logged via events

### Parameter Validation
- **Gas Limits**: Bounds-checked against [1M, 100M]
- **Base Fees**: Minimum and maximum validated
- **Change Rates**: Denominator prevents unlimited changes
- **Block Costs**: Step size limits price swings

### Rate Limiting
- **Update Frequency**: Changes limited to once per 100 blocks (~25 seconds)
- **Cooldown Period**: Prevents rapid fee manipulation
- **Historical Tracking**: Changes recorded with block height
- **Recovery Time**: Network has time to adapt between changes

### Economic Security
- **Flash Loan Resistance**: Fee changes not affected by single transaction
- **MEV Mitigation**: Predictable fee schedule enables ordering resistance
- **Arbitrage Protection**: Base fee changes gradual and transparent
- **Fair Ordering**: EIP-1559 fee auction prevents priority squatting

### Storage & State
- **State Integrity**: Fee config stored in protected state
- **Atomic Updates**: All fee parameters change together
- **Change Tracking**: Historical record of all modifications
- **Rollback Protection**: Configuration cannot be reverted to past states

## Solidity Interface

```solidity
interface IFeeManager {
    struct FeeConfig {
        uint256 gasLimit;
        uint256 targetBlockRate;
        uint256 minBaseFee;
        uint256 targetGas;
        uint256 baseFeeChangeDenominator;
        uint256 minBlockGasCost;
        uint256 maxBlockGasCost;
        uint256 blockGasCostStep;
    }

    /**
     * @dev Set the fee configuration
     * @param gasLimit Maximum gas per block
     * @param targetBlockRate Target blocks per second
     * @param minBaseFee Minimum base fee (wei)
     * @param targetGas Target gas per block for base fee calculations
     * @param baseFeeChangeDenominator Denominator for base fee changes
     * @param minBlockGasCost Minimum block gas cost (wei)
     * @param maxBlockGasCost Maximum block gas cost (wei)
     * @param blockGasCostStep Step size for block gas cost changes
     */
    function setFeeConfig(
        uint256 gasLimit,
        uint256 targetBlockRate,
        uint256 minBaseFee,
        uint256 targetGas,
        uint256 baseFeeChangeDenominator,
        uint256 minBlockGasCost,
        uint256 maxBlockGasCost,
        uint256 blockGasCostStep
    ) external;

    /**
     * @dev Get the current fee configuration
     * @return Current FeeConfig
     */
    function getFeeConfig() external view returns (FeeConfig memory);

    /**
     * @dev Get block height when fee config was last changed
     * @return Block number of last update
     */
    function getLastChangedAt() external view returns (uint256);
}

library FeeManagerLib {
    function validateFeeConfig(FeeConfig memory config) internal pure;
    function estimateBaseFee(
        FeeConfig memory config,
        uint256 previousBaseFee,
        uint256 currentGasUsed
    ) external pure returns (uint256);
}

abstract contract FeeManagerValidator {
    function requireValidFeeConfig(FeeConfig memory config) internal view;
    function emitFeeConfigChangedEvent(FeeConfig memory newConfig) internal;
}
```

## Implementation

### Fee Manager Precompile

**Location**: `~/work/lux/evm/precompile/contracts/fee-manager/`
**GitHub**: [`github.com/luxfi/evm/tree/main/precompile/contracts/fee-manager`](https://github.com/luxfi/evm/tree/main/precompile/contracts/fee-manager)
**Precompile Address**: `0x0200000000000000000000000000000000000003`

**Core Files**:
- [`contract.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/fee-manager/contract.go) - Precompile implementation
- [`contract_test.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/fee-manager/contract_test.go) - Test suite
- [`module.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/fee-manager/module.go) - Module registration
- [`IFeeManager.sol`](https://github.com/luxfi/evm/blob/main/precompile/contracts/fee-manager/IFeeManager.sol) - Solidity interface

### Dynamic Gas Pricing (LP-176 Integration)

**Location**: `~/work/lux/node/vms/evm/lp176/`
**GitHub**: [`github.com/luxfi/node/tree/main/vms/evm/lp176`](https://github.com/luxfi/node/tree/main/vms/evm/lp176)

**Implementation Files**:
- [`config.go`](https://github.com/luxfi/node/blob/main/vms/evm/lp176/config.go) - Dynamic gas parameters
- [`calculator.go`](https://github.com/luxfi/node/blob/main/vms/evm/lp176/calculator.go) - Base fee calculation (EIP-1559)

**Gas Price Oracle**:
- Location: `~/work/lux/node/vms/evm/gasprice/`
- Files: `oracle.go`, `metrics.go`
- RPC: `eth_gasPrice`, `eth_feeHistory`

### Testing

**Unit Tests**:
```bash
cd ~/work/lux/evm/precompile/contracts/fee-manager
go test -v ./...
# Tests: setFeeConfig, getFeeConfig, access control, parameter validation
```

**Integration Tests**:
```bash
cd ~/work/lux/node/vms/evm/lp176
go test -v ./...
# Tests: Base fee adjustment, target utilization, fee multiplier
```

**Solidity Tests**:
```bash
cd ~/work/lux/standard
forge test --match-contract FeeManagerTest
# Tests: Configuration updates, unauthorized access, rate limiting
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| getFeeConfig() | 2,100 | Read current config |
| setFeeConfig() | 45,000 | Admin only, emits event |
| Unauthorized call | 2,100 | Reverts with error |

### API Endpoints

**Query Current Fees**:
```bash
# Get current base fee
curl -X POST --data '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"eth_gasPrice",
  "params":[]
}' http://localhost:9630/ext/bc/C/rpc

# Get fee history
curl -X POST --data '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"eth_feeHistory",
  "params":["10", "latest", [25, 50, 75]]
}' http://localhost:9630/ext/bc/C/rpc
```

**Query Precompile Config**:
```solidity
// Solidity
IFeeManager feeManager = IFeeManager(0x0200000000000000000000000000000000000003);
FeeConfig memory config = feeManager.getFeeConfig();
```

## Backwards Compatibility

This LP introduces a new precompile and has no backwards compatibility issues. Existing contracts compiled before this LP can call the precompile after activation.

### Migration Path

For chains upgrading from fixed fee to dynamic fee model:

1. **Deploy FeeManager**: Precompile available at activation height
2. **Initial Configuration**: Set fees matching current chain economics
3. **Monitoring Period**: Observe base fee movements for 1-2 weeks
4. **Adjustment Phase**: Tune parameters based on network conditions
5. **Stabilization**: Final parameter set deployed long-term

## References

- **EIP-1559**: https://eips.ethereum.org/EIPS/eip-1559
- **LP-176**: Dynamic EVM Gas Limit (predecessor, similar concepts)
- **Fee Management Implementation**: `node/vms/evm/lp176/`
- **Precompile Framework**: `evm/precompile/contracts/fee-manager/`
- **Gas Meter Integration**: `node/vms/evm/gasprice/`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).