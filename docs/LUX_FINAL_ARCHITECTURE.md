# Lux Network Final Architecture

## Core Architecture: Primary Network + 2 Specialized Chains

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Lux Network Architecture                      │
├───────────────────────────────────────────────────────────────────────┤
│                          Primary Network                              │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│      P-Chain       │      X-Chain         │       C-Chain           │
│    (Platform)      │    (Exchange)        │     (Contract)          │
├─────────────────────┼─────────────────────┼─────────────────────────┤
│ • Validators       │ • UTXO Assets        │ • EVM Smart Contracts   │
│ • L1 Chains        │ • Fast Transfers     │ • DeFi Applications     │
│ • Staking          │ • Native Assets      │ • NFTs & Tokens         │
└─────────────────────┴─────────────────────┴─────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │   Specialized Chains   │
        ┌───────────┴────────┐      ┌────────┴───────────┐
        │     T-Chain         │      │     Z-Chain        │
        │  (Money/MPC Chain)  │      │  (Zero-Knowledge)  │
        ├─────────────────────┤      ├────────────────────┤
        │ • CGG21 MPC         │      │ • zkEVM/zkVM       │
        │ • Asset Bridges     │      │ • FHE Operations   │
        │ • Teleport Protocol │      │ • Privacy Proofs   │
        │ • X-Chain Settlement│      │ • AI Attestations  │
        └─────────────────────┘      └────────────────────┘
```

## Chain Responsibilities

### Primary Network (Existing)
- **P-Chain**: Validator management, chain creation, staking
- **X-Chain**: High-speed asset transfers, settlement layer
- **C-Chain**: EVM compatibility, smart contracts, DeFi

### T-Chain (Money/MPC Chain)
**Purpose**: Secure cross-chain asset management and bridging

**Core Functions**:
- **CGG21 MPC**: Threshold signatures for distributed custody
- **Bridge Operations**: Manage cross-chain asset transfers
- **Teleport Protocol**: Native asset movement without wrapping
- **Settlement**: All bridge operations settle through X-Chain
- **Governance**: Bridge parameters and validator management

**Key Features**:
```go
// T-Chain Core Components
type MChain struct {
    // MPC for distributed custody
    mpcManager      *CGG21Manager
    
    // Bridge operations
    bridgeEngine    *BridgeEngine
    teleportEngine  *TeleportEngine
    
    // Settlement
    xchainClient    *XChainClient
    
    // Validator management
    validators      *BridgeValidatorSet // Top 100 LUX stakers
}
```

### Z-Chain (Zero-Knowledge Chain)
**Purpose**: Privacy, proofs, and trusted execution attestations

**Core Functions**:
- **zkBridge**: Privacy-preserving cross-chain transfers
- **FHE Support**: Fully homomorphic encryption for private computation
- **AI Attestations**: TEE/SGX attestations for AI model integrity
- **Proof Services**: Generate proofs for T-Chain and L1 chains

**Key Features**:
```rust
// Z-Chain Core Components
pub struct ZChain {
    // Privacy components
    zk_bridge: ZKBridge,
    fhe_engine: FHEEngine,
    
    // Attestation services
    tee_verifier: TEEVerifier,
    ai_attestor: AIAttestor,
    
    // Proof generation
    proof_generator: ProofGenerator,
    
    // Integration
    m_chain_client: MChainClient,
}
```

## Integration Architecture

### T-Chain ↔ X-Chain Settlement
```
User Intent → T-Chain (MPC Lock) → X-Chain (Mint/Burn) → Destination
```

### T-Chain ↔ Z-Chain Privacy
```
Private Transfer → Z-Chain (Generate Proof) → T-Chain (Verify & Execute)
```

### AI Chain ↔ Z-Chain Attestation
```
AI Model → TEE Execution → Z-Chain (Attestation) → Chain Verification
```

## Use Cases

### 1. Standard Bridge Transfer (T-Chain)
```typescript
// Public cross-chain transfer
async function bridgeAssets() {
    const transfer = await mChain.initiateTransfer({
        asset: "USDC",
        amount: "1000",
        from: "ethereum",
        to: "lux-c-chain"
    });
    
    // T-Chain handles MPC signing and X-Chain settlement
    await mChain.waitForSettlement(transfer.id);
}
```

### 2. Private Bridge Transfer (T-Chain + Z-Chain)
```typescript
// Private cross-chain transfer
async function privateBridgeAssets() {
    const privateTransfer = await zChain.createPrivateTransfer({
        asset: "ETH",
        amount: "10",
        recipient: stealthAddress
    });
    
    // Z-Chain generates proof, T-Chain executes
    const proof = await zChain.generateTransferProof(privateTransfer);
    await mChain.executePrivateTransfer(proof);
}
```

### 3. AI Model Attestation (Z-Chain)
```typescript
// AI chain requests model attestation
async function attestAIModel() {
    const attestation = await zChain.attestModel({
        modelHash: "0x...",
        teeReport: sgxReport,
        performance: benchmarkResults
    });
    
    // Chain can verify model integrity
    return attestation;
}
```

## Validator Architecture

### T-Chain Validators
- **Requirement**: Top 100 LUX stakers who opt-in
- **Responsibilities**: 
  - Run MPC nodes for key shares
  - Validate bridge operations
  - Sign cross-chain messages
- **Rewards**: Share of bridge fees

### Z-Chain Validators
- **Requirement**: Subset of T-Chain validators with privacy hardware
- **Responsibilities**:
  - Generate ZK proofs
  - Run FHE computations
  - Verify TEE attestations
- **Hardware**: GPU/FPGA for proof generation

## Security Model

### T-Chain Security
- **Economic**: 2/3+ of top 100 validators required
- **Cryptographic**: CGG21 threshold signatures
- **Operational**: Regular key rotation

### Z-Chain Security
- **Privacy**: ZK-SNARKs for transaction privacy
- **Computation**: FHE for encrypted operations
- **Attestation**: TEE/SGX for trusted execution

## Benefits of This Architecture

1. **Simplicity**: Only 2 additional chains with clear purposes
2. **Modularity**: Each chain optimized for specific functions
3. **Scalability**: Parallel processing of money and privacy operations
4. **Flexibility**: Can add AI/specialized chains as needed
5. **Security**: Separation of concerns with shared validator set

## Implementation Priority

1. **Phase 1**: Launch T-Chain
   - Migrate bridge from GG18 to CGG21
   - Implement Teleport Protocol
   - X-Chain settlement integration

2. **Phase 2**: Launch Z-Chain
   - zkBridge for privacy
   - Basic FHE operations
   - TEE attestation framework

3. **Phase 3**: Advanced Features
   - AI chain support
   - Advanced FHE applications
   - Cross-chain privacy pools

## Conclusion

This streamlined architecture with just T-Chain and Z-Chain provides all necessary functionality:
- T-Chain handles all money/asset operations with MPC security
- Z-Chain provides privacy, proofs, and attestations for AI and other use cases
- Together they enable secure, private, and attestable cross-chain operations while keeping the system simple and maintainable