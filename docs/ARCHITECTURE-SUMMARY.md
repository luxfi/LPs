# Lux Network Architecture Summary

**Updated**: 2025-01-22

## Final 5-Chain Architecture

The Lux Network implements a clear 5-chain architecture with distinct separation of concerns:

### Primary Network (3 chains)
1. **P-Chain (Platform)**: Validators, staking, governance
2. **X-Chain (Exchange)**: Asset transfers, settlement, high-performance exchange  
3. **C-Chain (Contract)**: EVM compatibility, smart contracts, OP-Stack L2 support

### Specialized Chains (2 chains)
4. **T-Chain (Money/MPC)**: Secure cross-chain bridge with CGG21 MPC
5. **Z-Chain (Zero-Knowledge)**: Privacy, ZK proofs, omnichain root (Yggdrasil)

### SDK Layer
- **Bridge SDK**: Direct interface to M+X+Z chains for developers

## Key Architectural Decisions

### 1. T-Chain for Dedicated MPC Bridge
**Rationale**: Separation of concerns - keep bridge security isolated from exchange operations.

**Implementation**:
- CGG21 MPC with top 100 validators
- Teleport Protocol for cross-chain transfers
- X-Chain settlement for all bridge operations
- Dedicated chain ensures bridge security

### 2. Attestation Services → Z-Chain Integration
**Rationale**: Attestations are inherently cryptographic proofs, making Z-Chain the natural home.

**Implementation**:
- TEE attestations for AI/ML models
- FHE for encrypted computation
- Maintains Yggdrasil omnichain root

### 3. C-Chain with OP-Stack Support
**Rationale**: C-Chain already runs geth, natural place for OP-Stack L2s.

**Benefits**:
- Minimal changes to existing infrastructure
- Can spawn multiple L2s for different use cases
- Leverages proven rollup technology

### 4. Z-Chain for Pure ZK Operations
**Rationale**: Dedicated chain for privacy and cryptographic proofs.

**Features**:
- Native ZK sequencer (not OP-Stack)
- Maintains Yggdrasil omnichain root
- FHE and AI attestations

### 5. X-Chain Exchange Extensions
**Rationale**: X-Chain already handles assets, perfect for high-performance trading.

**Features**:
- Sub-200ms latency
- Cancel-first ordering
- GPU-accelerated risk (Hanzo)
- 100k orders/sec throughput

## Transaction Flow Examples

### Cross-Chain Asset Transfer
```
External Chain → T-Chain (MPC Lock) → X-Chain (Mint) → C-Chain/L1s
External Chain ← T-Chain (MPC Release) ← X-Chain (Burn) ← C-Chain/L1s
```

### Private Transaction
```
User → Z-Chain (Shield) → Private Transfer → Z-Chain (Unshield) → Destination
```

### High-Performance Trading
```
Trader → X-Chain Exchange → Order Book → Matching → Settlement
         ↓
    Gas Rebate in xLUX
```

### Developer Experience
```
App → Bridge SDK → Smart Routing → M/X/Z Chains → Result
                   ↓
          Unified Interface (no B-Chain needed)
```

### NFT Bridge
```
External NFT → T-Chain (Lock) → X-Chain (Mint UTXO) → Transfer to C → ERC-721/1155
X-Chain NFT → Burn on X → Mint on C → ERC-721/1155
```

## Validator Requirements

### Primary Network Validators
- **Stake**: 2,000+ LUX
- **Hardware**: 8 cores, 16GB RAM, 1TB storage
- **Responsibilities**: Validate P/X/C chains

### T-Chain Validators (Top 100)
- **Stake**: Must be in top 100 by stake
- **Additional Role**: Run MPC nodes for bridge
- **Hardware**: 16 cores, 32GB RAM, 2TB storage
- **Rewards**: Share of bridge fees (0.3% of volume)

### Z-Chain Validators
- **Stake**: 100,000+ LUX
- **Hardware**: 32+ cores, 128GB RAM, 4TB storage, GPU (A100+), TEE
- **Responsibilities**: Generate ZK proofs, run OP-Stack sequencer

## Performance Targets

| Metric | X-Chain | C-Chain | T-Chain | Z-Chain |
|--------|---------|---------|---------|---------|
| TPS | 100,000 (exchange) | 1,000 | 10,000 | 500 |
| Finality | 1s (200ms soft) | 2s | 2s | 3s |
| Gas Cost | Rebated | Standard | Bridge fees | Higher (proofs) |

## Security Model

### Economic Security
- Validator staking with slashing
- Insurance fund from fees
- Distributed risk across validators

### Cryptographic Security
- CGG21 threshold signatures (67/100)
- ZK-SNARKs for privacy
- FHE for encrypted computation

### Operational Security
- Key rotation every 30 days
- Hardware security modules
- Geographic distribution

## Next Steps

1. **Q1 2025**: Complete X-Chain Teleport integration
2. **Q2 2025**: Launch X-Chain Exchange alpha, Deploy Z-Chain
3. **Q3 2025**: Production exchange, ZK features
4. **Q4 2025**: Full ecosystem integration

## Conclusion

This streamlined 5-chain architecture achieves:
- **Clear separation of concerns** (each chain has distinct purpose)
- **Security isolation** (bridge operations separate from exchange)
- **Performance optimization** (specialized chains for specialized tasks)
- **Composability** (all chains interconnected via X-Chain settlement)
- **Developer simplicity** (Bridge SDK handles complexity)

The architecture balances:
- **P-Chain**: Network coordination and governance
- **X-Chain**: Maximum performance for assets and trading  
- **C-Chain**: Maximum compatibility with Ethereum ecosystem
- **T-Chain**: Maximum security for bridge operations
- **Z-Chain**: Maximum privacy with ZK capabilities