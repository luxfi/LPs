# Z-Chain Design Document

## Overview

The Z-Chain is the privacy and cryptographic proof layer of the Lux Network, providing zero-knowledge proofs, fully homomorphic encryption, and confidential computation capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Z-Chain Architecture                   │
├─────────────────────────┬─────────────────────────────────┤
│       zkEVM/zkVM        │        FHE Layer              │
├─────────────────────────┼─────────────────────────────────┤
│ • Private Contracts     │ • Encrypted Computation       │
│ • Shielded Transfers    │ • Confidential Data           │
│ • ZK Proof Generation   │ • Homomorphic Operations      │
│ • Privacy Pools         │ • Encrypted State             │
└─────────────────────────┴─────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │    Proof Services      │
        ├────────────────────────┤
        │ • Groth16              │
        │ • PLONK                │
        │ • STARKs               │
        │ • Bulletproofs         │
        └────────────────────────┘
```

## Core Components

### 1. zkEVM Implementation
- **Based on**: Polygon zkEVM / zkSync Era architecture
- **Features**:
  - EVM-compatible private smart contracts
  - Account abstraction with privacy
  - Confidential token transfers
  - Private DeFi primitives

### 2. FHE Integration (OpenFHE/Lattice)
```solidity
// Example: Private voting contract using FHE
contract PrivateVoting {
    mapping(address => EncryptedUint256) private votes;
    EncryptedUint256 public totalYes;
    EncryptedUint256 public totalNo;
    
    function vote(EncryptedBool _vote) external {
        // Computation on encrypted data
        totalYes = FHE.add(totalYes, FHE.select(_vote, 1, 0));
        totalNo = FHE.add(totalNo, FHE.select(_vote, 0, 1));
    }
}
```

### 3. Proof Generation Services
- **Groth16**: For efficient SNARK proofs
- **PLONK**: Universal trusted setup
- **STARKs**: Post-quantum secure, no trusted setup
- **Bulletproofs**: For range proofs

### 4. Privacy Pools
- Tornado Cash-style mixer with compliance
- Multi-asset privacy pools
- Configurable anonymity sets

## Integration with T-Chain (Money Chain)

### Cross-Chain Privacy Flow
1. **Asset Lock on T-Chain**
   - User initiates private transfer
   - T-Chain locks assets via MPC

2. **Proof Generation on Z-Chain**
   - Generate ZK proof of ownership
   - Create shielded note
   - Encrypt recipient information

3. **Settlement**
   - T-Chain verifies Z-Chain proof
   - Assets released to shielded pool
   - Private transfer completed

### Example: Private Cross-Chain Transfer
```typescript
// User wants to privately transfer assets from Ethereum to Lux
async function privateCrossChainTransfer() {
    // 1. Lock assets on source chain
    const lockTx = await mChain.lockAssets({
        asset: "ETH",
        amount: "10",
        sourceChain: "ethereum"
    });
    
    // 2. Generate privacy proof on Z-Chain
    const proof = await zChain.generateTransferProof({
        lockTx: lockTx.hash,
        recipient: encryptedRecipient,
        amount: encryptedAmount
    });
    
    // 3. Complete transfer privately
    await mChain.completePrivateTransfer(proof);
}
```

## FHE Implementation Details

### Supported Operations
- **Arithmetic**: Add, Subtract, Multiply
- **Comparison**: Greater than, Less than, Equal
- **Boolean**: AND, OR, NOT, XOR
- **Selection**: Conditional selection

### Performance Considerations
- Hardware acceleration via GPU/FPGA
- Batching for efficiency
- Ciphertext packing
- Bootstrapping optimization

## Privacy Features

### 1. Shielded Accounts
- Stealth addresses
- View keys for selective disclosure
- Nullifier-based double-spend prevention

### 2. Private Smart Contracts
```solidity
contract PrivateDEX {
    using FHE for EncryptedUint256;
    
    struct EncryptedOrder {
        EncryptedUint256 amount;
        EncryptedUint256 price;
        EncryptedAddress maker;
    }
    
    mapping(uint => EncryptedOrder) orders;
    
    function matchOrders(uint id1, uint id2) external {
        // Matching logic on encrypted data
        EncryptedBool match = orders[id1].price.lte(orders[id2].price);
        // Execute swap conditionally
    }
}
```

### 3. Compliance Tools
- Selective disclosure mechanisms
- Regulatory reporting hooks
- AML/KYC integration points

## Technical Stack

### Core Dependencies
- **arkworks-rs**: ZK proof systems
- **concrete-ml**: FHE operations
- **halo2**: PLONK implementation
- **winterfell**: STARK proofs

### VM Architecture
```rust
pub struct ZChainVM {
    // Privacy components
    zk_prover: Box<dyn Prover>,
    fhe_engine: FHEEngine,
    
    // State management
    private_state: EncryptedStateDB,
    nullifier_set: NullifierTree,
    
    // Integration
    m_chain_client: MChainClient,
    proof_registry: ProofRegistry,
}
```

## Validator Requirements

### Hardware
- **CPU**: 32+ cores for proof generation
- **RAM**: 128GB minimum
- **GPU**: NVIDIA A100 or better (optional but recommended)
- **Storage**: 2TB NVMe SSD

### Staking
- Minimum stake: 100,000 LUX
- Must also validate T-Chain
- Additional rewards for proof generation

## Roadmap

### Phase 1: zkEVM (Q2 2025)
- Basic zkEVM implementation
- Simple private transfers
- Integration with T-Chain

### Phase 2: FHE Integration (Q3 2025)
- FHE primitive operations
- Private smart contracts
- Encrypted state management

### Phase 3: Advanced Features (Q4 2025)
- Privacy pools
- Cross-chain private bridges
- Compliance tools

### Phase 4: Optimization (2026)
- Hardware acceleration
- Proof aggregation
- Recursive proofs

## Security Considerations

1. **Trusted Setup**: Use Powers of Tau ceremony
2. **Side Channels**: Constant-time implementations
3. **Key Management**: Secure enclave integration
4. **Audit Trail**: Selective disclosure for compliance

## Conclusion

The Z-Chain provides Lux Network with state-of-the-art privacy technology, enabling confidential transactions and computation while maintaining compatibility with existing infrastructure through the T-Chain bridge.