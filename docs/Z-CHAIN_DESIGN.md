# Z-Chain Design Document

## Overview

The Z-Chain is the **Universal ZK Substrate** for the Lux Network - a cryptographic proof layer providing zero-knowledge proofs, fully homomorphic encryption, and post-quantum secure cryptographic primitives. Z-Chain operates as the canonical proof registry, accepting proofs from any supported system and issuing universal receipts.

**Design Philosophy**: Proof-system agnostic, receipt-centric, post-quantum prepared.

## Two-Lane Architecture

Z-Chain implements a **Two-Lane Architecture** to balance stability with innovation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Z-Chain Universal ZK Substrate                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRODUCTION LANE (Stable)              RESEARCH LANE (Versioned)            │
│  ┌─────────────────────────┐           ┌─────────────────────────┐          │
│  │ ID 1: STARK             │           │ ID 100+: Experimental   │          │
│  │ ID 2: Groth16           │           │ • Nova/SuperNova        │          │
│  │ ID 3: PLONK             │           │ • HyperNova             │          │
│  │ ID 4: Nova              │           │ • Jolt                  │          │
│  │ ID 5-99: Reserved       │           │ • SP1/RISC Zero         │          │
│  │                         │           │ • Custom circuits       │          │
│  │ • Hard-coded verifiers  │           │ • Versioned contracts   │          │
│  │ • Immutable addresses   │           │ • Sunset policies       │          │
│  │ • Full audit trail      │           │ • Migration paths       │          │
│  └─────────────────────────┘           └─────────────────────────┘          │
│                                                                              │
│  ─────────────────────────── UNIVERSAL RECEIPT ───────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Receipt {                                                             │   │
│  │   programId:     bytes32  // Hash of program/circuit                 │   │
│  │   claimHash:     bytes32  // Hash of public inputs                   │   │
│  │   receiptHash:   bytes32  // Poseidon2(proof_data)                   │   │
│  │   proofSystemId: uint32   // 1=STARK, 2=Groth16, 3=PLONK...         │   │
│  │   version:       uint32   // Protocol version                        │   │
│  │   verifiedAt:    uint64   // Block timestamp                         │   │
│  │   parentReceipt: bytes32  // For proof chains                        │   │
│  │   aggregationRoot: bytes32 // For batched proofs                     │   │
│  │ }                                                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Production Lane (Proof System IDs 1-99)

Hard-coded, immutable verifiers for battle-tested proof systems:

| ID | System | Address | Status | Use Case |
|----|--------|---------|--------|----------|
| 1 | STARK | 0x051F | Active | Universal computation, PQ-safe |
| 2 | Groth16 | 0x0520 | Active | Ethereum compatibility |
| 3 | PLONK | 0x0521 | Active | Universal setup |
| 4 | Nova | 0x0522 | Planned | Incremental verification |
| 5-99 | Reserved | - | - | Future standards |

### Research Lane (Proof System IDs 100+)

Versioned, upgradeable experimental verifiers:

| ID Range | Category | Policy |
|----------|----------|--------|
| 100-199 | Folding schemes | 6-month sunset window |
| 200-299 | zkVM variants | Per-version registry |
| 300-399 | Custom circuits | Community governed |
| 400+ | Experimental | No stability guarantees |

## Cryptographic ISA Precompiles

Z-Chain provides a cryptographic instruction set as native EVM precompiles:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Cryptographic ISA Precompile Map                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  0x0500 - HASH PRIMITIVES                                                    │
│  ┌─────────────┬───────────────────────────────────────────────────────┐    │
│  │ 0x0501      │ Poseidon2 - ZK-friendly hash, PQ-safe (~800 gas)      │    │
│  │ 0x0502      │ Pedersen - Legacy EC commitment (~6000 gas)           │    │
│  │ 0x0503      │ MiMC - Minimal multiplicative complexity              │    │
│  │ 0x0504      │ Rescue - ALU-friendly sponge                          │    │
│  │ 0x0505      │ Blake3 - Fast general-purpose                         │    │
│  └─────────────┴───────────────────────────────────────────────────────┘    │
│                                                                              │
│  0x0510 - STARK OPERATIONS                                                   │
│  ┌─────────────┬───────────────────────────────────────────────────────┐    │
│  │ 0x0510      │ STARK Field Arithmetic                                │    │
│  │ 0x0511      │ STARK Polynomial Eval                                 │    │
│  │ 0x0512      │ STARK Merkle Path                                     │    │
│  │ 0x0513      │ STARK FRI Fold                                        │    │
│  │ 0x0514      │ STARK Constraint Check                                │    │
│  │ 0x051F      │ STARK Full Verify (production verifier)               │    │
│  └─────────────┴───────────────────────────────────────────────────────┘    │
│                                                                              │
│  0x0520 - SNARK OPERATIONS                                                   │
│  ┌─────────────┬───────────────────────────────────────────────────────┐    │
│  │ 0x0520      │ Groth16 Verify (BN254)                                │    │
│  │ 0x0521      │ PLONK Verify                                          │    │
│  │ 0x0522      │ Nova Verify                                           │    │
│  │ 0x0528      │ BN254 Pairing (EIP-197 enhanced)                      │    │
│  │ 0x0529      │ BLS12-381 Pairing (EIP-2537)                          │    │
│  └─────────────┴───────────────────────────────────────────────────────┘    │
│                                                                              │
│  0x0530 - RECEIPT OPERATIONS                                                 │
│  ┌─────────────┬───────────────────────────────────────────────────────┐    │
│  │ 0x0530      │ Receipt Registry - Store/query receipts               │    │
│  │ 0x0531      │ Receipt Merkle Root                                   │    │
│  │ 0x0532      │ Receipt Inclusion Proof                               │    │
│  │ 0x0533      │ Receipt Export (Groth16 wrapper)                      │    │
│  └─────────────┴───────────────────────────────────────────────────────┘    │
│                                                                              │
│  0x0540 - FHE OPERATIONS                                                     │
│  ┌─────────────┬───────────────────────────────────────────────────────┐    │
│  │ 0x0540      │ FHE Encrypt                                           │    │
│  │ 0x0541      │ FHE Decrypt (authorized)                              │    │
│  │ 0x0542      │ FHE Add                                               │    │
│  │ 0x0543      │ FHE Mul                                               │    │
│  │ 0x0544      │ FHE Compare                                           │    │
│  │ 0x054F      │ FHE Bootstrap                                         │    │
│  └─────────────┴───────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Poseidon2 vs Pedersen (Critical Distinction)

| Property | Poseidon2 (0x0501) | Pedersen (0x0502) |
|----------|-------------------|-------------------|
| **Security Basis** | Hash-based (PQ-safe) | Discrete log (NOT PQ-safe) |
| **Gas Cost** | ~800 | ~6,000 |
| **ZK Constraints** | ~300 | ~750 |
| **Recommended** | ✅ Default choice | ⚠️ Legacy only |

**Rule**: Use Poseidon2 for all new development. Pedersen only for backward compatibility.

## Z-Chain RPC Surface

The Z-Chain exposes a dedicated RPC namespace for proof operations:

### Program Registry

```typescript
// Register a new program (circuit/VM program)
zkp_registerProgram({
  programId: bytes32,        // Unique program identifier
  proofSystemId: uint32,     // Which verifier to use
  verificationKey: bytes,    // System-specific VK
  metadata: {
    name: string,
    version: string,
    author: address,
    auditHash?: bytes32
  }
}) -> { registered: boolean, blockNumber: uint64 }

// Get program info
zkp_getProgram(programId: bytes32) -> Program
```

### Proof Submission

```typescript
// Submit proof for verification
zkp_submitProof({
  programId: bytes32,        // Which program
  proof: bytes,              // The proof data
  publicInputs: bytes32[],   // Public inputs
  callback?: address         // Optional callback contract
}) -> { 
  receiptHash: bytes32,      // Receipt identifier
  verified: boolean,
  gasUsed: uint64
}

// Batch submission for efficiency
zkp_submitProofBatch({
  proofs: ProofSubmission[],
  aggregationMethod?: 'sequential' | 'parallel' | 'recursive'
}) -> Receipt[]
```

### Receipt Queries

```typescript
// Get receipt by hash
zkp_getReceipt(receiptHash: bytes32) -> Receipt

// Get receipts by program
zkp_getReceiptsByProgram(programId: bytes32, options?: {
  fromBlock?: uint64,
  toBlock?: uint64,
  limit?: uint32
}) -> Receipt[]

// Get latest Merkle root
zkp_getLatestRoot() -> {
  root: bytes32,
  blockNumber: uint64,
  receiptCount: uint64
}

// Get inclusion proof for receipt
zkp_getInclusionProof(receiptHash: bytes32) -> {
  receipt: Receipt,
  proof: bytes32[],
  index: uint64,
  root: bytes32
}
```

### Cross-Chain Export

```typescript
// Export receipt with Groth16 wrapper for other chains
zkp_exportReceipt(receiptHash: bytes32, targetChain: ChainId) -> {
  wrappedProof: bytes,       // Groth16 proof of receipt inclusion
  publicInputs: bytes32[],   // [receiptHash, root, chainId]
  verifierAddress: address   // Target chain verifier
}
```

## Universal Receipt Format

The Receipt is the core interoperability object:

```solidity
// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.24;

struct Receipt {
    bytes32 programId;       // Hash of program/circuit
    bytes32 claimHash;       // Hash of public inputs
    bytes32 receiptHash;     // Poseidon2(proof_data)
    uint32 proofSystemId;    // 1=STARK, 2=Groth16, 3=PLONK, etc.
    uint32 version;          // Protocol version
    uint64 verifiedAt;       // Block timestamp
    bytes32 parentReceipt;   // For proof chains (0x0 if none)
    bytes32 aggregationRoot; // For batched proofs (0x0 if single)
}

interface IReceiptRegistry {
    /// @notice Submit a proof and get a receipt
    function submitProof(
        bytes32 programId,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external returns (Receipt memory receipt);
    
    /// @notice Get receipt by hash
    function getReceipt(bytes32 receiptHash) 
        external view returns (Receipt memory);
    
    /// @notice Get current Merkle root of all receipts
    function getReceiptRoot() external view returns (bytes32);
    
    /// @notice Generate inclusion proof for receipt
    function getInclusionProof(bytes32 receiptHash)
        external view returns (bytes32[] memory proof, uint256 index);
    
    /// @notice Export receipt as Groth16 proof for other chains
    function exportForChain(bytes32 receiptHash, uint256 targetChainId)
        external view returns (bytes memory groth16Proof, bytes32[] memory inputs);
        
    /// @notice Verify receipt inclusion
    function verifyInclusion(
        bytes32 receiptHash,
        bytes32[] calldata proof,
        uint256 index,
        bytes32 expectedRoot
    ) external pure returns (bool);
}
```

## Chain Responsibilities

The Lux Network uses specialized chains for different concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Lux Multi-Chain Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  C-Chain (Execution)                                                         │
│  └── Smart contracts, DeFi, dApps                                           │
│  └── Consumes receipts from Z-Chain                                         │
│  └── Uses Poseidon2 for on-chain Merkle trees                              │
│                                                                              │
│  Z-Chain (Proofs)                                                            │
│  └── Universal proof verification                                           │
│  └── Receipt registry and Merkle accumulator                                │
│  └── Cross-chain proof export                                               │
│  └── FHE operations                                                         │
│                                                                              │
│  T-Chain (Treasury/Money)                                                    │
│  └── Asset custody and transfers                                            │
│  └── Cross-chain bridges                                                    │
│  └── MPC-secured vaults                                                     │
│                                                                              │
│  K-Chain (Keys)                                                              │
│  └── Key management and rotation                                            │
│  └── Threshold signature coordination                                       │
│  └── Identity and access control                                            │
│                                                                              │
│  A-Chain (AI)                                                                │
│  └── Model inference verification                                           │
│  └── Compute attestation                                                    │
│  └── Training provenance                                                    │
│                                                                              │
│  P-Chain (Platform)                                                          │
│  └── Validator management                                                   │
│  └── Subnet coordination                                                    │
│  └── Staking operations                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Privacy Stack Composition

Z-Chain enables composable privacy primitives:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Privacy Stack Layers                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 3: Policy + Compliance                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ • Selective disclosure (view keys)                                     │ │
│  │ • Compliance proofs (AML/KYC attestations)                            │ │
│  │ • Audit trails (encrypted for authorized parties)                      │ │
│  │ • Geographic restrictions                                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Layer 2: Privacy Primitives                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────────────┐│
│  │ ZK Proofs                   │ │ FHE Computation                         ││
│  │ • Ownership (nullifiers)    │ │ • Encrypted state                       ││
│  │ • Balance conservation      │ │ • Confidential DeFi                     ││
│  │ • Merkle membership         │ │ • Private voting                        ││
│  │ • Range proofs              │ │ • Sealed-bid auctions                   ││
│  └─────────────────────────────┘ └─────────────────────────────────────────┘│
│                                                                              │
│  Layer 1: Cryptographic Primitives                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ • Poseidon2 hashing (PQ-safe, ZK-efficient)                           │ │
│  │ • BLS12-381 pairings (threshold-friendly)                              │ │
│  │ • ML-DSA signatures (post-quantum)                                     │ │
│  │ • Lattice commitments (PQ-safe hiding)                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ZNote Architecture (Post-Quantum Secure)

```solidity
/// @notice Post-quantum secure UTXO note using Poseidon2
struct ZNotePQ {
    bytes32 commitment;      // Poseidon2(amount, assetId, owner, blinding)
    bytes32 nullifierHash;   // Poseidon2(commitment, secretKey)
    uint64 createdAt;
}

contract ZNotePQTree {
    using Poseidon2 for bytes;
    
    uint256 public constant TREE_DEPTH = 32;
    bytes32 public merkleRoot;
    mapping(bytes32 => bool) public nullifiers;
    
    function deposit(bytes32 commitment) external {
        // Add to Poseidon2-based Merkle tree
        merkleRoot = _insertNote(commitment);
    }
    
    function withdraw(
        bytes32 nullifier,
        bytes32[] calldata merkleProof,
        bytes calldata zkProof
    ) external {
        require(!nullifiers[nullifier], "Already spent");
        
        // Verify ZK proof of ownership
        require(ISTARKVerifier(0x051F).verify(
            WITHDRAW_PROGRAM_ID,
            zkProof,
            [nullifier, merkleRoot]
        ), "Invalid proof");
        
        nullifiers[nullifier] = true;
        // Process withdrawal...
    }
}
```

## Post-Quantum Security Posture

### Current PQ-Safe Primitives

| Primitive | Address | Quantum Safety | Notes |
|-----------|---------|----------------|-------|
| Poseidon2 | 0x0501 | ✅ Hash-based | Primary commitment scheme |
| STARK | 0x051F | ✅ Hash-based | FRI is PQ-secure |
| ML-DSA | 0x0007 | ✅ Lattice-based | FIPS 204 |
| SLH-DSA | 0x0008 | ✅ Hash-based | FIPS 205 |
| Ringtail | 0x000B | ✅ Lattice-based | Threshold signatures |

### NOT PQ-Safe (Legacy Only)

| Primitive | Address | Issue | Mitigation |
|-----------|---------|-------|------------|
| Pedersen | 0x0502 | Discrete log | Migrate to Poseidon2 |
| Groth16 | 0x0520 | Pairing-based | Use for Ethereum compat only |
| PLONK | 0x0521 | Pairing-based | Consider STARK for new apps |
| BLS | 0x0529 | Pairing-based | Use for consensus only |

### Migration Guidelines

1. **New Applications**: Use STARK + Poseidon2 by default
2. **Ethereum Bridges**: Use Groth16 wrapper only at export boundary
3. **Existing Applications**: Plan migration path, Poseidon2 compat layer available
4. **Consensus**: BLS acceptable (PQ migration planned for 2027)

## Integration with T-Chain (Money Chain)

### Cross-Chain Privacy Flow

```typescript
// 1. User deposits on T-Chain (custodial)
async function privateCrossChainTransfer() {
    // Lock assets on T-Chain via MPC
    const lockTx = await tChain.lockAssets({
        asset: "ETH",
        amount: "10",
        commitment: poseidon2(amount, asset, recipient, blinding)
    });
    
    // 2. Generate privacy proof on Z-Chain
    const receipt = await zChain.submitProof({
        programId: PRIVATE_TRANSFER_PROGRAM,
        proof: generateTransferProof({
            lockTx: lockTx.hash,
            commitment: commitment,
            nullifier: nullifier
        }),
        publicInputs: [commitment, nullifier, merkleRoot]
    });
    
    // 3. Claim on destination
    await tChain.claimPrivate({
        receiptHash: receipt.receiptHash,
        inclusionProof: await zChain.getInclusionProof(receipt.receiptHash)
    });
}
```

## Validator Requirements

### Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 32 cores | 64 cores (AMD EPYC) |
| RAM | 128 GB | 256 GB ECC |
| GPU | Optional | NVIDIA A100 (proof accel) |
| Storage | 2 TB NVMe | 4 TB NVMe RAID |
| Network | 1 Gbps | 10 Gbps |

### Staking

- Minimum stake: 100,000 LUX
- Must validate both P-Chain and Z-Chain
- Proof generation rewards: +20% base rewards
- FHE computation rewards: +30% base rewards

## Roadmap

### Phase 1: Foundation (Q1 2026) ✅
- [x] Poseidon2 precompile (0x0501)
- [x] STARK verifier (0x051F)
- [x] Receipt Registry (0x0530)
- [x] Universal Receipt format

### Phase 2: Privacy Primitives (Q2 2026)
- [ ] ZNotePQ contract
- [ ] Privacy pool integration
- [ ] Compliance proof system
- [ ] View key infrastructure

### Phase 3: FHE Integration (Q3 2026)
- [ ] FHE precompiles (0x0540-0x054F)
- [ ] Encrypted state management
- [ ] Threshold FHE for key management
- [ ] Private smart contracts

### Phase 4: Cross-Chain (Q4 2026)
- [ ] Groth16 export wrapper
- [ ] Ethereum L1 verifier deployment
- [ ] Bitcoin bridge proofs
- [ ] IBC integration

### Phase 5: Optimization (2027)
- [ ] Hardware acceleration
- [ ] Recursive proof aggregation
- [ ] GPU-accelerated FHE
- [ ] Post-quantum consensus migration

## Security Considerations

### Proof System Security

1. **STARK Security**: 128-bit security from hash function collision resistance
2. **Parameter Validation**: All inputs validated against field modulus
3. **Circuit Audits**: All production circuits require formal audit
4. **Upgrade Safety**: Production lane immutable; research lane versioned

### Receipt Integrity

1. **Poseidon2 Binding**: Receipts bound by PQ-safe hash
2. **Merkle Inclusion**: All receipts in accumulator tree
3. **Cross-Chain Verification**: Groth16 wrapper for export
4. **Replay Protection**: Unique receipt hashes, chain-specific nullifiers

### FHE Security

1. **Key Management**: Threshold decryption (no single point of failure)
2. **Noise Budget**: Bootstrap before overflow
3. **Authorized Decryption**: Policy-enforced access control
4. **Audit Trail**: All decryptions logged (encrypted)

## References

- [LP-3658: Poseidon2 Hash Precompile](../LPs/lp-3658-poseidon-hash-precompile.md)
- [LP-9015: Precompile Registry](../LPs/lp-9015-precompile-registry.md)
- [LP-XXXX: STARK Verifier Precompile](../LPs/lp-XXXX-stark-verifier.md) (Draft)
- [LP-XXXX: Receipt Registry](../LPs/lp-XXXX-receipt-registry.md) (Draft)
- [STARK Paper](https://eprint.iacr.org/2018/046)
- [Poseidon2 Paper](https://eprint.iacr.org/2023/323)
- [RISC Zero zkVM](https://www.risczero.com/)
- [SP1 zkVM](https://github.com/succinctlabs/sp1)

---

*Last Updated: 2026-01-01 - Universal ZK Platform Architecture*
