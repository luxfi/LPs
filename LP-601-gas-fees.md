# LP-604: Gas and Fee Mechanisms - Unified Economic Model

## Overview

LP-604 standardizes gas calculation, dynamic fee markets, and cross-chain fee settlement across Lux, Zoo, and Hanzo. This ensures exactly one fee mechanism with EIP-1559 and EIP-4844 compatibility, plus AI compute pricing.

## Motivation

Current issues with multiple fee models:
- **Inconsistent pricing**: Different chains use different mechanisms
- **MEV opportunities**: Predictable fee spikes enable exploitation
- **Cross-chain complexity**: No unified settlement for multi-chain operations
- **AI compute pricing**: No standard for GPU/TPU resource pricing

## Technical Specification

### Unified Gas Model

```go
package gas

import (
    "math"
    "github.com/holiman/uint256"
)

// Gas types - EXACTLY ONE definition across all chains
type (
    Gas   uint64  // Gas units
    Price uint64  // Price in smallest denomination (nLUX, nKEEPER, nHANZO)
)

// GasSchedule defines costs for all operations
type GasSchedule struct {
    // EVM Operations (Zoo)
    EVMBase         Gas  // 21000
    EVMSload        Gas  // 2100
    EVMSstore       Gas  // 20000
    
    // Consensus Operations (Lux)
    SignatureVerify Gas  // 3000
    VerkleProof     Gas  // 5000
    FPCRound        Gas  // 1000
    
    // AI Operations (Hanzo)
    InferenceBase   Gas  // 100000
    InferencePerTok Gas  // 10
    TrainingEpoch   Gas  // 1000000
    
    // Cross-chain (All)
    BridgeMessage   Gas  // 50000
    StateProof      Gas  // 10000
}

// Canonical gas schedule - SINGLE SOURCE OF TRUTH
var CanonicalGasSchedule = GasSchedule{
    // EVM - matches Ethereum exactly
    EVMBase:         21000,
    EVMSload:        2100,
    EVMSstore:       20000,
    
    // Consensus - optimized for Lux
    SignatureVerify: 3000,
    VerkleProof:     5000,
    FPCRound:        1000,
    
    // AI - based on actual compute cost
    InferenceBase:   100000,
    InferencePerTok: 10,
    TrainingEpoch:   1000000,
    
    // Cross-chain - covers bridge overhead
    BridgeMessage:   50000,
    StateProof:      10000,
}
```

### Dynamic Fee Market (EIP-1559 + EIP-4844)

```go
// FeeMarket implements EIP-1559 with EIP-4844 blob pricing
type FeeMarket struct {
    // Base fee parameters (EIP-1559)
    BaseFee              Price
    BaseFeeChangeDenom   uint64  // 8
    ElasticityMultiplier uint64  // 2
    TargetGas           Gas      // Target per block
    
    // Blob fee parameters (EIP-4844)
    BlobBaseFee         Price
    ExcessBlobGas       Gas
    BlobGasPerBlob      Gas      // 131072
    TargetBlobsPerBlock uint64   // 3
    
    // AI compute pricing
    ComputeBaseFee      Price
    ExcessComputeUnits  uint64
    TargetComputeUnits  uint64
}

// CalculateBaseFee implements EIP-1559 formula
func (fm *FeeMarket) CalculateBaseFee(parentGasUsed Gas) Price {
    targetGas := fm.TargetGas
    baseFee := fm.BaseFee
    
    if parentGasUsed == targetGas {
        return baseFee
    }
    
    var delta uint64
    if parentGasUsed > targetGas {
        gasUsedDelta := parentGasUsed - targetGas
        baseFeeDelta := baseFee * gasUsedDelta / targetGas / fm.BaseFeeChangeDenom
        delta = math.Max(baseFeeDelta, 1)
        return baseFee + Price(delta)
    } else {
        gasUsedDelta := targetGas - parentGasUsed
        baseFeeDelta := baseFee * gasUsedDelta / targetGas / fm.BaseFeeChangeDenom
        delta = baseFeeDelta
        return baseFee - Price(delta)
    }
}

// CalculateBlobFee implements EIP-4844 exponential pricing
func (fm *FeeMarket) CalculateBlobFee() Price {
    return calculateExponential(
        MinBlobBaseFee,
        fm.ExcessBlobGas,
        BlobBaseFeePriceUpdateFraction,
    )
}

// calculateExponential implements fake exponential from EIP-4844
func calculateExponential(minPrice Price, excess Gas, denominator Gas) Price {
    var (
        numerator   uint256.Int
        output      uint256.Int
        numeratorAccum uint256.Int
    )
    
    numerator.SetUint64(uint64(excess))
    denominator.SetUint64(uint64(denominator))
    
    i := uint256.NewInt(1)
    numeratorAccum.Mul(&numerator, &denominator)
    
    for numeratorAccum.Sign() > 0 {
        output.Add(&output, &numeratorAccum)
        numeratorAccum.Mul(&numeratorAccum, &numerator)
        numeratorAccum.Div(&numeratorAccum, &denominator)
        numeratorAccum.Div(&numeratorAccum, i)
        i.AddUint64(i, 1)
    }
    
    output.Div(&output, &denominator)
    
    if output.Cmp(maxUint64) > 0 {
        return Price(math.MaxUint64)
    }
    
    return Price(output.Uint64())
}
```

### AI Compute Pricing

```go
// ComputePricing handles AI-specific resource pricing
type ComputePricing struct {
    // GPU tiers with different pricing
    GPUTiers map[GPUType]Price
    
    // Operation-specific multipliers
    InferenceMultiplier float64  // 1.0
    TrainingMultiplier  float64  // 10.0
    FineTuneMultiplier  float64  // 5.0
}

type GPUType string

const (
    GPU_H100_80GB GPUType = "H100_80GB"  // Top tier
    GPU_A100_40GB GPUType = "A100_40GB"  // Mid tier
    GPU_L40_48GB  GPUType = "L40_48GB"   // Entry tier
    GPU_APPLE_M3  GPUType = "M3_MAX"     // Apple Silicon
)

// CalculateComputeCost returns cost for AI operation
func (cp *ComputePricing) CalculateComputeCost(
    operation string,
    gpuType GPUType,
    duration time.Duration,
    tokens uint64,
) (uint64, error) {
    basePrice := cp.GPUTiers[gpuType]
    if basePrice == 0 {
        return 0, ErrUnknownGPU
    }
    
    var multiplier float64
    switch operation {
    case "inference":
        multiplier = cp.InferenceMultiplier
    case "training":
        multiplier = cp.TrainingMultiplier
    case "finetune":
        multiplier = cp.FineTuneMultiplier
    default:
        return 0, ErrUnknownOperation
    }
    
    // Cost = BasePrice * Duration * Multiplier * (1 + tokens/1000)
    seconds := duration.Seconds()
    tokenFactor := 1.0 + float64(tokens)/1000.0
    
    cost := float64(basePrice) * seconds * multiplier * tokenFactor
    return uint64(cost), nil
}
```

### Cross-Chain Fee Settlement

```solidity
// SINGLE contract deployed at SAME address on ALL chains via CREATE2
contract UnifiedFeeSettlement {
    // Fee token addresses (same on all chains)
    address constant LX_TOKEN = 0x1111111111111111111111111111111111111111;
    
    // Chain-specific fee receivers
    mapping(uint256 => address) public feeReceivers;
    
    // Accumulated fees per chain
    mapping(uint256 => uint256) public accumulatedFees;
    
    // Cross-chain fee distribution
    event FeesDistributed(
        uint256 sourceChain,
        uint256 targetChain,
        uint256 amount
    );
    
    constructor() {
        // Set canonical fee receivers
        feeReceivers[120] = address(0x120); // Lux validators
        feeReceivers[121] = address(0x121); // Hanzo compute nodes
        feeReceivers[122] = address(0x122); // Zoo treasury
    }
    
    // EXACTLY ONE way to pay fees
    function payFee() external payable {
        uint256 chainId = block.chainid;
        accumulatedFees[chainId] += msg.value;
        
        // Distribute based on operation type
        if (isComputeOperation(msg.data)) {
            // 70% to Hanzo, 20% to Lux, 10% to Zoo
            distributeFees(chainId, 121, msg.value * 70 / 100);
            distributeFees(chainId, 120, msg.value * 20 / 100);
            distributeFees(chainId, 122, msg.value * 10 / 100);
        } else if (isBridgeOperation(msg.data)) {
            // 50% to source, 50% to destination
            uint256 destChain = extractDestination(msg.data);
            distributeFees(chainId, chainId, msg.value / 2);
            distributeFees(chainId, destChain, msg.value / 2);
        } else {
            // 100% to local chain
            distributeFees(chainId, chainId, msg.value);
        }
    }
    
    function distributeFees(
        uint256 source,
        uint256 target,
        uint256 amount
    ) internal {
        if (source == target) {
            // Local distribution
            payable(feeReceivers[target]).transfer(amount);
        } else {
            // Cross-chain via LP-401 bridge
            bytes memory message = abi.encode(
                "FEE_SETTLEMENT",
                target,
                amount
            );
            
            IBridge(BRIDGE_ADDRESS).sendMessage(
                "lp.settlement",
                target,
                message
            );
        }
        
        emit FeesDistributed(source, target, amount);
    }
}
```

### Priority Fee Mechanism

```go
// PriorityFeeAuction implements priority fees similar to EIP-1559
type PriorityFeeAuction struct {
    // Minimum priority fee
    MinPriorityFee Price
    
    // Maximum priority fee (cap)
    MaxPriorityFee Price
    
    // Current mempool state
    pendingTxs map[Hash]*Transaction
}

// OrderTransactions returns txs ordered by effective fee
func (pfa *PriorityFeeAuction) OrderTransactions(
    baseFee Price,
    blockGasLimit Gas,
) []*Transaction {
    // Calculate effective fee per gas for each tx
    type TxWithFee struct {
        tx  *Transaction
        fee Price
    }
    
    txsWithFees := make([]TxWithFee, 0, len(pfa.pendingTxs))
    
    for _, tx := range pfa.pendingTxs {
        effectiveFee := tx.GasFeeCap
        if tx.GasTipCap+baseFee < tx.GasFeeCap {
            effectiveFee = tx.GasTipCap + baseFee
        }
        
        txsWithFees = append(txsWithFees, TxWithFee{
            tx:  tx,
            fee: effectiveFee,
        })
    }
    
    // Sort by effective fee (descending)
    sort.Slice(txsWithFees, func(i, j int) bool {
        return txsWithFees[i].fee > txsWithFees[j].fee
    })
    
    // Pack transactions up to gas limit
    result := make([]*Transaction, 0)
    gasUsed := Gas(0)
    
    for _, txWithFee := range txsWithFees {
        if gasUsed+txWithFee.tx.GasLimit <= blockGasLimit {
            result = append(result, txWithFee.tx)
            gasUsed += txWithFee.tx.GasLimit
        }
    }
    
    return result
}
```

## Fee Burning and Distribution

```go
// FeeDistribution defines EXACTLY how fees are distributed
type FeeDistribution struct {
    // EIP-1559 style burning
    BurnPercentage uint8  // 50% burned
    
    // Validator rewards
    ValidatorPercentage uint8  // 30% to validators
    
    // Treasury
    TreasuryPercentage uint8  // 10% to treasury
    
    // Development fund
    DevelopmentPercentage uint8  // 10% to development
}

// Canonical distribution - SINGLE SOURCE OF TRUTH
var CanonicalDistribution = FeeDistribution{
    BurnPercentage:       50,
    ValidatorPercentage:  30,
    TreasuryPercentage:   10,
    DevelopmentPercentage: 10,
}

func DistributeFees(totalFees uint64, dist FeeDistribution) FeeAllocation {
    return FeeAllocation{
        Burn:        totalFees * uint64(dist.BurnPercentage) / 100,
        Validators:  totalFees * uint64(dist.ValidatorPercentage) / 100,
        Treasury:    totalFees * uint64(dist.TreasuryPercentage) / 100,
        Development: totalFees * uint64(dist.DevelopmentPercentage) / 100,
    }
}
```

## Migration from Multiple Fee Systems

### Phase 1: Standardize Gas Schedule
- Deploy CanonicalGasSchedule to all chains
- Update all operations to use standard costs

### Phase 2: Unify Base Fee Calculation
- Implement EIP-1559 on all chains
- Synchronize base fee updates across chains

### Phase 3: Cross-Chain Settlement
- Deploy UnifiedFeeSettlement via CREATE2
- Enable cross-chain fee distribution

### Phase 4: AI Compute Integration
- Add compute pricing tiers
- Integrate with Hanzo GPU markets

## Security Considerations

1. **Fee Manipulation**: Capped base fee changes prevent spikes
2. **Cross-Chain Atomicity**: Two-phase commit for settlements
3. **MEV Protection**: Priority fees capped at reasonable levels
4. **Burning Mechanism**: Prevents fee recycling attacks

## Testing

```go
func TestUnifiedGasCalculation(t *testing.T) {
    // Test that all chains calculate gas identically
    testCases := []struct {
        operation string
        expected  Gas
    }{
        {"transfer", 21000},
        {"sload", 2100},
        {"verkle_proof", 5000},
        {"inference_1k_tokens", 110000},
    }
    
    for _, tc := range testCases {
        luxGas := CalculateGasLux(tc.operation)
        zooGas := CalculateGasZoo(tc.operation)
        hanzoGas := CalculateGasHanzo(tc.operation)
        
        assert.Equal(t, tc.expected, luxGas)
        assert.Equal(t, luxGas, zooGas)
        assert.Equal(t, zooGas, hanzoGas)
    }
}
```

## References

1. [EIP-1559: Fee Market Change](https://eips.ethereum.org/EIPS/eip-1559)
2. [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
3. [Avalanche Dynamic Fees](https://docs.avax.network/learn/avalanche/transaction-fees)

---

**Status**: Final  
**Category**: Economics  
**Created**: 2025-01-09