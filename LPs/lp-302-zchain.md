---
lp: 302
title: Lux Z/A-Chain - Privacy & AI Attestation Layer
status: Active
type: Protocol Specification
category: Core
created: 2025-10-28
---

# LP-302: Lux Z/A-Chain - Privacy & AI Attestation Layer

**Status**: Active
**Type**: Protocol Specification
**Created**: 2025-10-28
**Updated**: 2025-10-31
**Authors**: Lux Partners
**Related**: LP-301 (Bridge), LP-303 (Quantum Consensus)

## Abstract

This LP specifies **Lux Z/A-Chain**, a dual-purpose Layer-1 chain providing:
1. **Z-Chain**: Privacy-focused ZK coprocessor enabling confidential smart contracts via zero-knowledge proofs, fully homomorphic encryption (FHE), and trusted execution environments (TEE) on **Lux.network**
2. **A-Chain**: AI attestation and verification layer on **Hanzo.network** for global AI compute attestations

This architecture enables privacy-preserving computation on Lux L1 while allowing AI attestation mining and verification on the dedicated Hanzo AI compute network.

## Motivation

### Privacy Challenges

Public blockchains expose all transaction data, creating privacy challenges for:
1. **Individuals**: Wallet balances and transaction history publicly visible
2. **Enterprises**: Business logic and trading strategies exposed
3. **Institutions**: Regulatory compliance requires selective disclosure
4. **DeFi Users**: MEV exploitation and front-running attacks

### AI Attestation Challenges

The AI ecosystem requires verifiable compute attestations for:
1. **Trust**: Proving AI inference ran correctly without revealing model weights
2. **Provenance**: Tracking dataset and model lineage
3. **Accountability**: Attributing outputs to specific providers and models
4. **Economics**: Fair payment for AI compute work

## Network Architecture

### 3-Network Trifecta

The Z/A-Chain operates across Lux's multi-network ecosystem:

| Network | Role | Chains |
|---------|------|--------|
| **Lux.network** | L1 Settlement & Privacy | P-Chain, X-Chain, B-Chain, Z-Chain, Q-security |
| **Hanzo.network** | AI Compute & Attestation | A-Chain (AttestationVM), MCP infrastructure |
| **Zoo.network** | Open AI Research (ZIPs) | DeAI, DeSci research networks (zips.zoo.ngo) |

**Z-Chain (Lux.network)**:
- ZK privacy coprocessor for confidential transactions
- Enables private DeFi, shielded tokens, and encrypted computation
- Integrated with Lux L1 consensus

**A-Chain (Hanzo.network)**:
- AI attestation verification and mining
- Receipt Circuit validation (Groth16/Plonk)
- GPU mining infrastructure for attestations
- MCP-powered AI agent coordination

**Zoo.network (ZIPs - Zoo Improvement Proposals)**:
- Open AI research network via zips.zoo.ngo
- Bleeding-edge DeAI (Decentralized AI) experiments
- DeSci (Decentralized Science) research chains
- Community-driven AI/science governance
- Foundation: Zoo Labs Foundation

## Specification

### Z-Chain: Privacy Model (Lux.network)

Z-Chain offers **three privacy tiers**:

| Tier | Privacy Level | Technology | Use Case |
|------|--------------|------------|----------|
| Tier 0 | Public | Standard EVM | Transparent DeFi |
| Tier 1 | Shielded | zk-SNARKs | Private transfers |
| Tier 2 | Confidential | FHE | Encrypted DeFi |
| Tier 3 | Trusted | TEE (SGX/SEV) | Regulated finance |

### System Components

- **zk-EVM**: Zero-knowledge virtual machine for private smart contracts
- **Proof Generators**: Distributed provers generating zk-SNARKs
- **FHE Coprocessor**: Encrypted computation for Tier 2 contracts
- **TEE Validators**: SGX/SEV enclaves for Tier 3 contracts
- **Auditor Registry**: Authorized auditors with selective disclosure keys

### zkEVM Architecture

**Type-3 zkEVM** (EVM-equivalent bytecode):

1. User submits shielded transaction T
2. Sequencer executes T off-chain, generates witness w
3. Prover generates zk-SNARK proof π:
   ```
   π ← Prove(ValidExec(T, w, state_old, state_new))
   ```
4. L1 verifier checks π and updates state commitment

**Privacy Guarantee**: L1 sees only state commitment C = Hash(state_new), not transaction details.

### Proof System

**Circuit Constraints**:
- EVM opcode execution: 2.1M constraints
- Merkle proof verification: 850k constraints
- Signature verification (ECDSA): 1.5M constraints
- **Total: 4.45M constraints**

**Performance**:
- Proof generation: 6.8s per transaction
- Proof size: 288 bytes (Groth16)
- Verification time: 12ms on-chain
- Gas cost: 280k per proof

### Confidential Token Standard (LRC-721P)

**Private NFT Transfer Protocol**:

```
commitment_old ← Hash(n, A_sender, salt)
commitment_new ← Hash(n, A_recv, salt')

π ← Prove(
  commitment_old in Merkle tree ∧
  ν = Hash(n, A_sender) ∧
  commitment_new = Hash(n, A_recv, salt')
)
```

**Privacy Properties**:
- NFT ownership hidden (only commitment visible)
- Transfer recipient hidden (encrypted address)
- Transfer history unlinkable (nullifiers prevent double-spend)
- Optional metadata disclosure via auditor key

### Privacy-Preserving DeFi

#### Shielded DEX

**Private Token Swap Protocol**:
1. User deposits tokens A into shielded pool (generates commitment C_A)
2. User submits swap order (C_A, B_amount, price) via zkSNARK
3. DEX matches orders off-chain
4. User withdraws tokens B via proof π_B

**Advantages**:
- Order book hidden (prevents front-running)
- Trading volume private (hides whale activity)
- Slippage protected (encrypted order matching)

#### Private Lending

**Confidential Loan Protocol**:

| Action | Privacy Level |
|--------|--------------|
| Collateral deposit | Shielded (zk-SNARK) |
| Loan amount | Encrypted (FHE) |
| Interest rate | Public (on-chain) |
| Liquidation threshold | Encrypted (FHE) |

**Key Feature**: Liquidations occur via encrypted threshold checks (FHE-based), preserving collateral privacy until liquidation event.

### Fully Homomorphic Encryption (FHE)

**TFHE (Threshold FHE) Integration**:
- Encryption: User encrypts inputs under FHE public key
- Computation: Smart contract operates on ciphertexts
- Decryption: Threshold decryption by validator committee

**Supported Operations**:

| Operation | Gas Cost | Latency |
|-----------|----------|---------|
| Addition | 50k | 0.1ms |
| Multiplication | 250k | 2ms |
| Comparison (<, >) | 180k | 1.5ms |
| AND/OR/XOR | 40k | 0.08ms |

**Use Cases**:
- Encrypted auctions (bids hidden until reveal)
- Private voting (encrypted vote tallying)
- Confidential credit scores

### Trusted Execution Environments (TEE)

**Tier 3 Privacy Model**:
- Validators run Intel SGX or AMD SEV enclaves
- Smart contracts execute inside secure enclave
- Auditors receive encrypted attestations from TEE
- Regulators access transaction data via auditor keys

**Attestation Protocol**:

```
// Execute transaction in enclave
result ← ExecuteInEnclave(T)

// Generate attestation
A ← {sender, recipient, amount, timestamp}
E ← Encrypt(A, pk_aud)  // Auditor can decrypt

// Remote attestation quote
Q ← GenerateQuote(enclave_measurement)
return (E, Q)
```

**Compliance Guarantee**: Regulators verify TEE quote Q proves correct enclave execution, then decrypt E to audit transaction.

### A-Chain: AI Attestation Model (Hanzo.network)

**Purpose**: Global AI compute attestation and verification layer

#### Attestation Transaction Types

1. **RegisterProviderTx**: Register AI compute provider
   ```go
   type RegisterProviderTx struct {
       ProviderDID     string        // Decentralized identifier
       PublicKey       []byte        // Provider's signing key
       Endpoint        string        // API endpoint
       Capabilities    []string      // Supported models/frameworks
       StakeAmount     uint64        // LUX staked for slashing
       Signature       []byte        // Provider signature
   }
   ```

2. **SubmitReceiptTx**: Submit AI inference receipt
   ```go
   type SubmitReceiptTx struct {
       JobID           ids.ID        // Unique job identifier
       ProviderDID     string        // Provider who executed job
       ModelHash       [32]byte      // SHA256(model_weights)
       DatasetHash     [32]byte      // SHA256(input_data)
       OutputHash      [32]byte      // SHA256(inference_result)
       Proof           []byte        // ZK-SNARK proof (Receipt Circuit)
       Timestamp       int64         // Execution timestamp
       Fee             uint64        // Fee in LUX
       Signature       []byte        // Provider signature
   }
   ```

3. **ChallengeTx**: Challenge invalid attestation
   ```go
   type ChallengeTx struct {
       ReceiptID       ids.ID        // Receipt being challenged
       ChallengerDID   string        // Challenger identity
       Evidence        []byte        // Counter-proof or witness data
       StakeAmount     uint64        // Stake for frivolous challenge protection
       Signature       []byte        // Challenger signature
   }
   ```

4. **SettlementTx**: Resolve challenge
   ```go
   type SettlementTx struct {
       ChallengeID     ids.ID        // Challenge being resolved
       Outcome         bool          // True if challenge valid
       SlashedAmount   uint64        // Amount slashed from loser
       Evidence        []byte        // Resolution proof
       AuditorSig      []byte        // Auditor committee signature
   }
   ```

#### Receipt Circuit v1 (Groth16)

**Purpose**: Prove hash consistency for AI inference without revealing private inputs

**Public Inputs**:
- `job_id`: Unique job identifier
- `provider_did`: Provider's DID
- `model_hash`: SHA256(model_weights)
- `dataset_hash`: SHA256(input_data)
- `output_hash`: SHA256(inference_result)
- `timestamp`: Execution timestamp

**Private Inputs** (witness):
- `model_weights`: Actual model parameters
- `input_data`: Inference input
- `inference_result`: Inference output

**Circuit Constraints**:
```
1. Hash(model_weights) == model_hash
2. Hash(input_data) == dataset_hash  
3. Hash(inference_result) == output_hash
4. [Future v2] inference_result == Model(input_data)
```

**Performance**:
- Constraints: ~280k (hash-only v1)
- Prove time: 1.2s
- Proof size: 192 bytes (Groth16)
- Verify time: 8ms on-chain
- Gas cost: 48k per verification

**v2 Roadmap** (Plonk):
- In-circuit inference verification
- Support for transformer layers
- Privacy-preserving model weights
- Constraints: ~4.5M (full inference)

#### Mining and Economics

**Attestation Mining**:
- Hanzo.network GPU operators mine attestations
- Receipt submission generates mining rewards
- Proof-of-Work based on ZK proof generation
- Dynamic difficulty adjustment based on network load

**Economic Model**:
```
Mining Reward = Base_Reward × (1 + Complexity_Bonus) × (1 - Challenge_Risk)

Where:
- Base_Reward: Fixed LUX per attestation
- Complexity_Bonus: Higher for complex models (transformers > CNNs)
- Challenge_Risk: Reduced if attestation is challenged
```

**Slashing Conditions**:
1. Invalid attestation (failed challenge)
2. Double-attesting (same job_id, different outputs)
3. Offline provider (missed heartbeat threshold)
4. Frivolous challenging (false challenge)

### Selective Disclosure

**Hierarchical Auditor Keys**:
1. **User Keys**: Can view own transaction history
2. **Contract Auditor Keys**: Can view all contract transactions
3. **Regulatory Keys**: Can view transactions matching criteria (e.g., > $10k)
4. **Court Order Keys**: Can view specific addresses (requires governance vote)

**View Key Protocol**:
```
vk = HKDF(sk_user, "view_key", salt)
PlaintextData = Decrypt(C, vk)
```

Auditors receive vk (not sk_user), enabling read-only access without spending authority.

## Implementation

### Solidity Interfaces

```solidity
interface IZChainPrivacy {
  // Deposit into shielded pool
  function deposit(uint256 amount, bytes32 commitment)
    external returns (bool);

  // Shielded transfer (requires zk-SNARK proof)
  function transfer(bytes32 nullifier, bytes32 newCommitment,
    bytes calldata zkProof) external returns (bool);

  // Withdraw from shielded pool
  function withdraw(uint256 amount, bytes calldata zkProof,
    address recipient) external returns (bool);
}
```

### Go API

```go
// Z-Chain client
type ZChainClient struct {
    l2Client  *ethclient.Client
    prover    *zksnark.Prover
    fheClient *fhe.Client
}

// Shielded transfer
func (z *ZChainClient) ShieldedTransfer(
    ctx context.Context,
    amount *big.Int,
    recipient common.Address,
) (txHash common.Hash, err error)

// FHE encrypted operation
func (z *ZChainClient) EncryptedCompute(
    ctx context.Context,
    operation string,
    inputs []fhe.Ciphertext,
) (result fhe.Ciphertext, err error)
```

## Performance Benchmarks

### Throughput

| Transaction Type | TPS | Finality | Cost |
|-----------------|-----|----------|------|
| Public (Tier 0) | 5,000 | 1.5s | $0.001 |
| Shielded (Tier 1) | 120 | 1.8s | $0.08 |
| FHE (Tier 2) | 50 | 2.2s | $0.15 |
| TEE (Tier 3) | 200 | 1.6s | $0.02 |

### Proof Generation

| Circuit | Constraints | Prove Time | Proof Size |
|---------|-------------|------------|------------|
| Transfer | 280k | 1.2s | 288 bytes |
| Swap | 850k | 3.5s | 288 bytes |
| NFT mint | 420k | 1.8s | 288 bytes |
| Loan borrow | 1.2M | 5.1s | 288 bytes |

### Testnet Metrics

**Z-Chain Testnet (Q3-Q4 2024)**:
- Transactions processed: 1.2M
- Unique addresses: 45k
- Shielded pool TVL: $18M (testnet tokens)
- Average finality: 1.85s
- Privacy breaches: 0

## Security Analysis

### Privacy Guarantees

**Theorem [Transaction Privacy]**: Under the DDH assumption and random oracle model, an adversary viewing only L1 commitments cannot distinguish between two transactions with different amounts/recipients with advantage greater than negl(λ).

### Anonymity Set Size

**Shielded Pool Size** (as of Q4 2024):
- Total commitments: 1.2M
- Daily active commitments: 15k
- Effective anonymity set: ≈10⁵ per transaction

Compared to:
- Zcash shielded pool: 2.8M (but only 15% adoption)
- Monero ring size: 16 (small anonymity set)
- Tornado Cash: 50k (pre-sanctions)

## Regulatory Compliance

### AML/KYC Integration

**Compliance without privacy loss**:
1. User completes KYC with licensed provider (off-chain)
2. Provider issues **compliance certificate** (zk-attestation)
3. User submits certificate with shielded transaction
4. Smart contract verifies certificate without learning user identity

**Certificate Proof**:
```
π_kyc ← Prove(HasValidCertificate(pk_user, provider_id))
```

### OFAC Compliance

**Nullifier blacklist**:
- Regulators submit sanctioned nullifiers to on-chain registry
- Smart contracts reject transactions with blacklisted nullifiers
- Privacy preserved: Only nullifier visible, not user identity

### Cross-Chain Integration

**Z-Chain ↔ B-Chain (Bridge) Integration**:
- Private cross-chain transfers via shielded bridge
- ZK proofs verified on both chains
- Fee/credit routing through B-Chain
- PQC-secured bridge committee via P-Chain anchors

**A-Chain → Lux L1 Settlement**:
- Attestation anchors posted to P-Chain checkpoints
- Economic finality through LUX staking
- Cross-network slashing coordination
- B-Chain routes A-Chain fees back to Hanzo validators

**Integration with LP-301 (Bridge)**:
- B-Chain verifies A-Chain attestation state roots
- Cross-chain receipt verification
- Multi-hop routing: Hanzo → Lux → Zoo

**Integration with LP-303 (Quantum Security)**:
- Q-security (PQC) protects attestation signatures
- P-Chain anchors A-Chain checkpoints with dual-sig (BLS+Ringtail)
- Future-proof against quantum attacks on attestations

## Deployment Timeline

### Phase 1 (Q3-Q4 2024): Z-Chain Testnet
- ✅ Testnet v1 (zk-SNARKs only)
- ✅ Testnet v2 (+ FHE)
- ✅ 1.2M transactions, zero breaches

### Phase 2 (Q1 2025): Z-Chain Mainnet
- 🔨 Audit (Trail of Bits + OpenZeppelin)
- 🔨 Z-Chain mainnet launch (Tier 0-1 privacy)
- 🔨 B-Chain integration for private cross-chain

### Phase 3 (Q2 2025): A-Chain Launch
- 🔄 A-Chain deployment on Hanzo.network
- 🔄 Receipt Circuit v1 (Groth16, hash-only)
- 🔄 Attestation mining activation
- 🔄 Hanzo GPU infrastructure onboarding

### Phase 4 (Q3-Q4 2025): Advanced Features
- 🔄 Z-Chain FHE mainnet (Tier 2)
- 🔄 Z-Chain TEE mainnet (Tier 3)
- 🔄 A-Chain Receipt Circuit v2 (Plonk, full inference)
- 🔄 Cross-network governance (Lux ↔ Hanzo ↔ Zoo)

## Future Work

### Post-Quantum zk-SNARKs

Transitioning to quantum-resistant proof systems:
- zk-STARKs (no trusted setup, but 100× larger proofs)
- Lattice-based zkSNARKs (research phase)
- Hybrid SNARKs + STARKs (practical quantum resistance)

### Cross-Chain Privacy

Enabling private transfers across chains:
- Shielded bridge with Lux L1/L2
- IBC privacy module for Cosmos
- Private cross-rollup communication

## References

- **Paper**: `/lux/papers/lux-zchain.pdf`
- **Contracts**: `/lux/zchain/contracts/`
- **zkEVM**: `/lux/zchain/zkevm/`

## Copyright

© 2025 Lux Partners
Papers: CC BY 4.0
Code: Apache 2.0

---

*LP-302 Created: October 28, 2025*
*Status: Active*
*Contact: research@lux.network*
