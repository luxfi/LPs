# Lux Network Architecture

## Overview

The Lux Network has evolved from its original Avalanche-inspired architecture to a comprehensive 8-chain ecosystem optimized for specific functionality.

### Evolution from Lux 1.0 to Lux 2.0

**Lux 1.0 (Original Architecture):**
- Based on Avalanche's 3-chain model
- **P-Chain**: Platform management and validators
- **X-Chain**: Asset creation and transfers
- **C-Chain**: EVM-compatible smart contracts

**Lux 2.0 (Current Architecture):**
- Expanded to 8 specialized chains
- **Q-Chain**: Replaces P-Chain with quantum-secure platform management
- **X-Chain**: Enhanced with order book DEX and Lamport OTS
- **C-Chain**: Maintained EVM compatibility with upgrades
- **A-Chain**: New AI/Attestation layer
- **B-Chain**: New dedicated bridge chain
- **M-Chain**: New MPC custody chain
- **Z-Chain**: New privacy layer
- **G-Chain**: New universal oracle

The transition from P-Chain to Q-Chain represents a major upgrade, incorporating quantum-resistant cryptography while maintaining all platform management functionality.

## Current Architecture

The Lux Network now consists of eight specialized chains:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Lux Network Architecture                         │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│     A-Chain         │     B-Chain         │         C-Chain             │
│ (AI/Attestation)    │    (Bridge)         │      (Contracts)            │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ • TEE Attestation   │ • MPC Custody       │ • EVM Compatibility         │
│ • Proof-of-AI       │ • Cross-chain       │ • Smart Contracts           │
│ • Hardware Registry │ • Threshold Sigs    │ • DeFi Protocols            │
│ • Oracle Pricing    │ • Quantum-Safe      │ • NFT Standards             │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│     M-Chain         │     Q-Chain         │         G-Chain             │
│      (MPC)          │(Quantum/Platform)   │       (GraphQL)             │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ • CGG21 + Ringtail  │ • Quasar Consensus  │ • GraphQL API Layer         │
│ • Decentralized     │ • Validator Mgmt    │ • Real-time Indexing        │
│ • Native Swaps      │ • Staking/Subnets   │ • Cross-chain Queries       │
│ • Quantum Extended  │ • Dual-Certificate  │ • Analytics Dashboard       │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│     X-Chain         │                     │         Z-Chain             │
│   (Exchange)        │                     │    (Zero-Knowledge)         │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ • Order Book DEX    │                     │ • zkEVM/zkVM                │
│ • Lamport OTS       │                     │ • FHE Operations            │
│ • Post-Quantum Safe │                     │ • Private Transactions      │
│ • Ultra-low Latency │                     │ • Encrypted State           │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

## Chain Responsibilities

### A-Chain (AI/Attestation Chain)
The A-Chain provides TEE attestation and AI compute verification:

- **TEE Attestation**: Verifies CPU/GPU/NPU/ASIC trusted execution environments
- **Proof-of-AI (PoAI)**: Hardware-anchored proof of AI computation
- **Attestation Registry**: Global registry of verified compute devices
- **Oracle-Based Pricing**: Dynamic compute resource pricing
- **LUX Gas Token**: Security and attestation operations

### B-Chain (Bridge Chain)
The B-Chain handles secure cross-chain asset transfers:

- **MPC-Based Custody**: Multi-party computation for asset security
- **Threshold Signatures**: Distributed signing without single points of failure
- **Multi-Chain Support**: Bridges to Ethereum, BSC, Polygon, etc.
- **Quantum-Safe Design**: Ringtail integration for post-quantum security
- **Asset Registry**: Tracks bridged assets and mappings

### C-Chain (Contract Chain)
The C-Chain provides EVM-compatible smart contract execution:

- **EVM Compatibility**: Full Ethereum Virtual Machine support
- **DeFi Protocols**: AMMs, lending, yield farming
- **NFT Standards**: LRC-721, LRC-1155 implementations
- **High Throughput**: Optimized for DeFi transaction volume
- **Developer Friendly**: Standard Ethereum tooling

### M-Chain (MPC Chain)
The M-Chain provides decentralized custody and native swaps:

- **CGG21 + Ringtail**: Quantum-extended threshold ECDSA
- **Decentralized Custody**: No single party controls assets
- **Native Swaps**: Direct asset exchange without wrapping
- **Quantum Extended**: Exploring Ringtail integration for PQ safety
- **Validator Participation**: Top validators provide MPC services

### Q-Chain (Quantum/Platform Chain)
The Q-Chain serves as the platform management chain with quantum-safe consensus (replacing P-Chain from Lux 1.0):

**Platform Management:**
- **Validator Management**: Registration, staking, rewards with quantum-secure signatures
- **Subnet Creation**: Deploy custom blockchain instances
- **Staking Operations**: LUX token staking with dual-certificate validation
- **Network Governance**: Protocol upgrades and parameters
- **Cross-Chain Coordination**: Validator set management

**Quantum Security:**
- **Dual-Certificate Finality**: BLS + Ringtail signatures
- **Consensus Engines**: Pulsar (linear), Nebula (DAG), Quasar (finality)
- **Post-Quantum Cryptography**: Lattice-based security
- **Sub-Second Finality**: ~350ms empirical performance
- **Adaptive Consensus**: Switch between linear and DAG modes

### X-Chain (Exchange Chain)
The X-Chain provides high-performance decentralized exchange:

- **Order Book DEX**: Central limit order book model
- **Lamport OTS**: One-time signatures for quantum resistance
- **Ultra-Low Latency**: Microsecond-level matching engine
- **Post-Quantum Safe**: Hash-based signatures throughout
- **High Frequency Trading**: Optimized for professional traders

### Z-Chain (Zero-Knowledge Chain)
The Z-Chain provides privacy and confidential computation:

- **zkEVM/zkVM**: Zero-knowledge virtual machines
- **FHE Operations**: Computation on encrypted data
- **Private Transactions**: Shielded transfers and balances
- **Encrypted State**: Confidential smart contract storage
- **Compliance Ready**: Selective disclosure for regulations

### G-Chain (GraphQL Chain)
The G-Chain provides a universal GraphQL query layer for the entire network:

- **GraphQL API**: Unified query interface for all Lux chains
- **BadgerDB Storage**: High-performance key-value store underlying all indexing
- **Quantum-Safe**: All queries and responses signed with dual certificates (BLS + Ringtail)
- **Decentralized Nodes**: Users can run their own G-Chain nodes for:
  - Local read scaling and caching
  - Custom indexing strategies
  - Private data aggregation
  - Specialized query patterns
- **Real-time Indexing**: Automatic indexing of blockchain events and state
- **Cross-chain Queries**: Join data across multiple chains in single queries
- **Analytics Engine**: Built-in analytics and aggregation functions
- **WebSocket Subscriptions**: Real-time updates for live data feeds
- **Schema Federation**: Combines chain-specific schemas into unified graph

## Integration Points

### Cross-Chain Communication
All chains communicate via the Teleport Protocol and Warp Messaging:

- **A-Chain ↔ All Chains**: Attestation verification for compute nodes
- **B-Chain ↔ All Chains**: Asset bridging and transfers
- **C-Chain ↔ X-Chain**: DeFi liquidity and order execution
- **M-Chain ↔ B-Chain**: Coordinated custody for bridge operations
- **Q-Chain ↔ All Chains**: Platform management, validators, governance, and quantum-safe consensus
- **Z-Chain ↔ All Chains**: Privacy proofs and confidential operations
- **G-Chain ↔ All Chains**: Oracle data feeds and omnichain analytics

### Key Integration Patterns

1. **Attestation Flow**: A-Chain → Any Chain
   - Compute nodes register on A-Chain
   - Other chains verify attestation proofs
   - Enables trusted computation across network

2. **Bridge Flow**: External Chain → B-Chain → Target Chain
   - Assets locked on source chain
   - B-Chain MPC validates and signs
   - Target chain mints/unlocks assets

3. **Trading Flow**: C-Chain → X-Chain → C-Chain
   - Smart contracts on C-Chain
   - Orders routed to X-Chain DEX
   - Settlement back to C-Chain

4. **Privacy Flow**: Any Chain → Z-Chain → Any Chain
   - Public state enters Z-Chain
   - Private computation/transfer
   - Selective disclosure on exit

## Security Model

1. **Economic Security**: Staked validators secure all chains
2. **Cryptographic Security**: 
   - CGG21 MPC (M-Chain)
   - ZK-SNARKs/STARKs (Z-Chain)
   - TEE Attestation (A-Chain)
3. **Hardware Security**: TEE and HSM integration
4. **Threshold Security**: 2/3+ consensus required

## Implementation Phases

### Phase 1: M-Chain (In Progress)
- Migrate from GG18 to CGG21 MPC
- Implement Teleport Protocol
- X-Chain settlement integration

### Phase 2: Z-Chain
- zkEVM implementation
- FHE integration (Zama.ai style)
- Privacy-preserving bridges

### Phase 3: A-Chain
- TEE attestation framework
- Hardware security module integration
- Validator identity system

## Benefits of This Architecture

1. **Specialization**: Each chain optimized for its specific purpose
2. **Scalability**: Parallel processing across eight independent chains
3. **Quantum Resistance**: Multiple post-quantum cryptographic systems
4. **Privacy Options**: Dedicated Z-Chain plus confidential features
5. **Interoperability**: Native cross-chain via Teleport Protocol
6. **Performance**: Dedicated chains avoid resource competition
7. **Security Layers**: Hardware, cryptographic, and economic security
8. **Future-Proof**: Modular design enables upgrades per chain

## Token Economics

### Native Tokens

| Token | Chain | Purpose | Supply Model |
|-------|-------|---------|--------------|
| **LUX** | All Chains | • Staking & security<br>• A-Chain gas fees<br>• Governance voting | Fixed supply |
| **AI** | A-Chain/Hanzo | • AI compute payments<br>• Task orchestration<br>• GRPO rewards | Dynamic supply |
| **ZOO** | C-Chain | • Gaming economy<br>• NFT marketplace<br>• Virtual world | Deflationary |

### Cross-Chain Token Flow
- **X-Chain DEX**: Atomic swaps between all tokens
- **B-Chain Bridge**: External assets enter/exit ecosystem
- **C-Chain DeFi**: Yield farming and liquidity pools
- **A-Chain Oracle**: Real-time pricing for compute resources