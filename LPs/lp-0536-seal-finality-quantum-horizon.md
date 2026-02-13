---
lp: 536
title: Seal Finality via Quantum Event Horizon
description: Post-quantum finality guarantees for data integrity seals through dual-certificate consensus
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-02-13
requires: [530, 535, 3658]
---

## Abstract

This LP defines the finality semantics for data integrity seals (LP-0535) anchored through the Z-Chain Receipt Registry (LP-0530). A seal achieves **quantum-final** status when the block containing its receipt passes the Quasar consensus Event Horizon — the point at which dual classical (BLS) and post-quantum (lattice) certificates have been aggregated. Once quantum-final, a seal cannot be reversed by any adversary, including one with access to a cryptographically relevant quantum computer.

This LP specifies the finality states, the transition rules, and the on-chain interface for querying seal finality status.

## Motivation

### The Finality Gap

Data integrity seals are only as trustworthy as the finality of the chain they're anchored to. Existing approaches anchor to:

- **Bitcoin**: Probabilistic finality. A 6-block confirmation (~60 minutes) provides high confidence but never mathematical certainty. A sufficiently motivated state actor with >50% hash power can reorg.
- **Ethereum**: Committee-based finality (~13 minutes to finalization). Relies on BLS signatures over BN254 — vulnerable to quantum attack via Shor's algorithm on the pairing group.

Neither provides the guarantee that high-stakes use cases demand:

| Use Case | Requirement | BTC/ETH Finality |
|:---------|:------------|:-----------------|
| Court-admissible evidence | Mathematically irreversible | Insufficient |
| Regulatory compliance (EU AI Act) | Provably tamper-proof | Time-dependent |
| Whistleblower protection | Cannot be reversed by state actors | Insufficient |
| Insurance claims | Survives dispute periods (years) | Quantum-vulnerable |
| Medical records | Long-term integrity (decades) | Quantum-vulnerable |

### The Quantum Threat to Seal Integrity

When a cryptographically relevant quantum computer (CRQC) exists:

1. **ECDSA breaks** → Bitcoin transaction signatures can be forged → anchored roots can be replaced
2. **BLS breaks** → Ethereum validator attestations can be faked → finalized blocks can be reversed
3. **Every seal anchored to BTC/ETH loses its guarantee**

This is not a theoretical concern. NIST has standardized post-quantum algorithms (FIPS 203-205) specifically because the timeline for CRQC is measured in years, not decades. Seals created today must remain valid for decades.

### Lux Solution: Quantum Event Horizon

The Quasar consensus engine provides a finality mechanism that survives quantum attacks: the **Event Horizon**. A seal that passes the Event Horizon has dual-certificate finality — both classical and post-quantum signatures attest to its inclusion in the canonical chain. No future adversary, regardless of computational capability, can reverse it.

## Specification

### Seal Finality States

A data integrity seal transitions through four finality states:

```
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌────────────────┐
│ PENDING  │───>│ CLASSICAL │───>│   QUANTUM    │───>│ HORIZON-FINAL  │
│          │    │  FINAL    │    │    FINAL     │    │                │
│ In mempool│    │ BLS cert  │    │ BLS + Lattice│    │ Checkpointed   │
│ or block │    │ only      │    │ dual cert    │    │ in Event       │
│          │    │           │    │              │    │ Horizon        │
└──────────┘    └───────────┘    └──────────────┘    └────────────────┘
     │                │                │                     │
   ~0s             ~500ms          ~3s                    ~6s
```

#### State 1: PENDING

The seal transaction has been submitted but not yet included in a block, or is in a block that has not received sufficient validator votes.

**Security**: No finality guarantee. Transaction can be dropped or reordered.

#### State 2: CLASSICAL_FINAL

The block containing the seal's receipt has received a BLS aggregate signature from ≥2/3 of validators by stake weight.

**Security**: Byzantine fault tolerant under classical assumptions. Safe against any adversary without a quantum computer. Equivalent to Ethereum's finality.

**Time**: ~500ms from block proposal.

#### State 3: QUANTUM_FINAL

The block (or its containing quantum bundle) has received both:
- BLS aggregate signature (classical certificate)
- Lattice-based aggregate signature via Ringtail protocol (post-quantum certificate)

**Security**: Safe against any adversary, including one with a CRQC. The lattice certificate uses Ring-LWE based signatures requiring ≥2^160 operations to forge.

**Time**: ~3 seconds from block proposal (quantum bundles aggregate every ~3 seconds).

#### State 4: HORIZON_FINAL

The quantum-final block has been included in an Event Horizon checkpoint. The checkpoint itself has been signed by ≥2/3 of validators with both classical and post-quantum signatures, and the checkpoint references all prior checkpoints in a hash chain.

**Security**: Maximum finality. Even if the entire validator set is replaced, the checkpoint chain provides an independent proof of finality. Equivalent to a "point of no return" — no future consensus execution can produce a conflicting history.

**Time**: ~6 seconds from block proposal (checkpoints every ~6 seconds).

### On-Chain Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @notice Seal finality states
enum SealFinality {
    Pending,          // Not yet finalized
    ClassicalFinal,   // BLS certificate only
    QuantumFinal,     // BLS + Lattice dual certificate
    HorizonFinal      // Checkpointed in Event Horizon
}

/// @notice Query seal finality status
interface ISealFinality {
    /// @notice Get the finality state of a seal
    /// @param receiptId The receipt ID from LP-0530
    /// @return finality Current finality state
    /// @return classicalAt Block number when classical finality was achieved (0 if pending)
    /// @return quantumAt Block number when quantum finality was achieved (0 if not yet)
    /// @return horizonAt Block number when horizon finality was achieved (0 if not yet)
    function sealFinality(uint256 receiptId) external view returns (
        SealFinality finality,
        uint256 classicalAt,
        uint256 quantumAt,
        uint256 horizonAt
    );

    /// @notice Check if a seal has achieved at least the specified finality level
    /// @param receiptId The receipt ID
    /// @param required Minimum required finality level
    /// @return met Whether the requirement is met
    function meetsFinalityRequirement(
        uint256 receiptId,
        SealFinality required
    ) external view returns (bool met);

    /// @notice Get the latest Event Horizon checkpoint
    /// @return height Checkpoint height
    /// @return root Merkle root of all receipts up to this checkpoint
    /// @return classicalSig BLS aggregate signature
    /// @return quantumSig Lattice aggregate signature
    function latestHorizon() external view returns (
        uint256 height,
        bytes32 root,
        bytes memory classicalSig,
        bytes memory quantumSig
    );

    /// @notice Get the Event Horizon checkpoint containing a specific seal
    /// @param receiptId The receipt ID
    /// @return checkpointHeight The checkpoint that includes this seal
    /// @return inclusionProof Merkle proof from receipt to checkpoint root
    function horizonProof(uint256 receiptId) external view returns (
        uint256 checkpointHeight,
        bytes32[] memory inclusionProof
    );
}
```

**Precompile address**: `0x0536` (adjacent to Data Seal Registry at `0x0535`)

### Finality Requirements by Use Case

Applications SHOULD specify their minimum finality requirement:

| Use Case | Minimum Finality | Rationale |
|:---------|:-----------------|:----------|
| Real-time monitoring | `Pending` | Speed over finality |
| Supply chain tracking | `ClassicalFinal` | Adequate for near-term |
| Legal evidence | `QuantumFinal` | Must survive decades |
| Court submission | `HorizonFinal` | Maximum provability |
| Insurance claims | `QuantumFinal` | Multi-year dispute periods |
| Regulatory compliance | `HorizonFinal` | Audit trail must be absolute |
| Whistleblower evidence | `HorizonFinal` | State-level adversary |
| AI model attestation | `QuantumFinal` | Regulatory longevity |

### Dual-Certificate Structure

Each quantum bundle contains:

```
QuantumBundle {
    height:        uint64              // Bundle height
    blockRange:    [startBlock, endBlock]  // Classical blocks covered
    merkleRoot:    bytes32             // Poseidon2 root of all receipts in range
    classicalCert: BLSAggregate {
        signature:   [96]byte          // BLS12-381 aggregate
        signerBits:  bitfield          // Which validators signed
        weight:      uint64            // Total stake weight
    }
    quantumCert:   LatticeCert {
        signature:   []byte            // ~3KB Ringtail aggregate
        signerBits:  bitfield          // Which validators signed
        weight:      uint64            // Total stake weight
        epoch:       uint64            // Key epoch (for rotation tracking)
    }
}
```

A bundle is valid when:
- `classicalCert.weight >= 2/3 * totalStake`
- `quantumCert.weight >= 2/3 * totalStake`
- `merkleRoot` correctly commits to all receipts in `blockRange`

### Event Horizon Checkpoint Chain

Checkpoints form an append-only chain:

```
Checkpoint {
    height:        uint64
    parentHash:    bytes32             // Hash of previous checkpoint
    bundleRange:   [startBundle, endBundle]
    accumulatorRoot: bytes32           // Poseidon2 root of ALL receipts ever
    classicalCert: BLSAggregate
    quantumCert:   LatticeCert
    timestamp:     uint64
}

checkpointHash = Poseidon2(
    DST_CHECKPOINT,
    height,
    parentHash,
    accumulatorRoot,
    timestamp
)
```

The checkpoint chain is independently verifiable: given any checkpoint and the accumulator state, a verifier can confirm the entire history without replaying consensus.

### Cross-Chain Finality Export

For seals that must be verified on external chains (Ethereum, other L1s), the horizon proof can be wrapped in a Groth16 proof:

```
HorizonExportProof {
    receiptHash:       bytes32    // The specific receipt
    inclusionProof:    bytes32[]  // Merkle path to accumulator root
    checkpointHeight:  uint256    // Which checkpoint
    accumulatorRoot:   bytes32    // Root at checkpoint time
    groth16Proof:      bytes      // ~256 bytes, verifiable on any EVM
}
```

The Groth16 proof attests: "This receipt is included in a Poseidon2 Merkle accumulator whose root was signed by ≥2/3 of Lux validators with both classical and post-quantum certificates."

This proof is verifiable on any EVM chain via a single `staticcall` to a Groth16 verifier (~200K gas).

## Rationale

### Why Dual Certificates Instead of Post-Quantum Only?

Lattice-based signatures are larger (~3KB vs 96 bytes for BLS) and slower to verify. Using lattice signatures alone would:

1. Increase block size significantly
2. Slow down consensus
3. Lose the performance benefit of BLS aggregation

The dual approach provides:
- **Fast classical finality** (~500ms) for latency-sensitive applications
- **Quantum finality** (~3s) for long-term applications
- **Graceful degradation** — if lattice schemes are found vulnerable, classical certificates still hold (and vice versa)
- **Migration path** — when quantum computers arrive, the system continues operating on lattice certificates alone

### Why Checkpoint Chain?

The Event Horizon checkpoint chain provides finality proofs that are:

1. **Self-contained** — no need to replay consensus from genesis
2. **Compact** — a single checkpoint + Merkle proof suffices
3. **Independently verifiable** — any third party can verify without running a node
4. **Long-lived** — checkpoints remain valid forever (no expiration)

### Why Poseidon2 for Checkpoint Hashing?

Poseidon2 is used throughout the checkpoint chain (not just the receipt accumulator) because:

1. **ZK-friendly** — checkpoint proofs can be wrapped in ZK proofs for cross-chain export
2. **Post-quantum safe** — the checkpoint chain itself doesn't depend on DLP assumptions
3. **Consistent** — same hash function at every layer reduces implementation complexity and attack surface

## Backwards Compatibility

This LP extends LP-0530 (Receipt Registry) and LP-0535 (Data Integrity Seal) without breaking changes. Existing receipts and seals automatically receive finality tracking — the finality state is derived from consensus, not from the receipt itself.

Applications that do not query finality status are unaffected.

## Test Cases

### Finality State Transitions

1. **Seal created** → state = `Pending`
2. **Block receives BLS aggregate (≥2/3 stake)** → state = `ClassicalFinal`
3. **Quantum bundle includes block, receives lattice aggregate** → state = `QuantumFinal`
4. **Checkpoint includes bundle** → state = `HorizonFinal`

### Edge Cases

5. **Block reorg before classical finality** — seal returns to `Pending`, re-included in new block
6. **Lattice key rotation mid-bundle** — bundle uses keys from the epoch that started it
7. **Validator set change between classical and quantum finality** — quantum certificate uses the validator set at bundle creation time
8. **Cross-chain export of horizon proof** — Groth16 proof verifiable on Ethereum mainnet

### Performance Targets

| Metric | Target |
|:-------|:-------|
| Time to `ClassicalFinal` | <500ms |
| Time to `QuantumFinal` | <3s |
| Time to `HorizonFinal` | <6s |
| Checkpoint proof size | <2KB |
| Groth16 export proof size | <256 bytes |
| Export proof verification gas (EVM) | <200K gas |

## Security Considerations

### Quantum Adversary Model

The primary adversary is a state-level actor with access to a CRQC capable of breaking:
- ECDSA (secp256k1, secp256r1)
- BLS12-381
- Any pairing-based cryptography

Against this adversary:
- `ClassicalFinal` seals are **NOT safe** — BLS certificates can be forged
- `QuantumFinal` seals are **safe** — lattice certificates require ≥2^160 operations
- `HorizonFinal` seals are **maximally safe** — checkpoint chain provides independent verification

### Signature Agility

The dual-certificate design provides cryptographic agility. If either scheme is found vulnerable:

- **BLS broken (quantum attack)**: Lattice certificates alone provide finality. Classical finality state is skipped.
- **Lattice broken (cryptanalytic advance)**: BLS certificates provide finality. Lattice scheme is replaced via governance.
- **Both broken**: Consensus halts safely (no unsafe finality granted). New signature scheme deployed via hard fork.

### Long-Term Seal Validity

Seals at `HorizonFinal` remain valid indefinitely because:

1. The Poseidon2 accumulator root is self-proving (no external dependency)
2. The dual certificates are independently verifiable
3. The checkpoint chain forms an immutable append-only log
4. Cross-chain Groth16 exports create standalone proofs

Even if the Lux Network itself ceased to operate, any party holding a horizon proof can independently verify the seal's integrity.

## References

- [LP-0530: Z-Chain Receipt Registry](./lp-0530-receipt-registry.md)
- [LP-0535: Verifiable Data Integrity Seal Protocol](./lp-0535-verifiable-data-integrity-seal.md)
- [LP-3658: Poseidon2 Precompile](./lp-3658-poseidon2-precompile.md)
- [LP-0510: STARK Verification Precompiles](./lp-0510-stark-verifier-precompile.md)
- [LP-110: Quasar Consensus Protocol](./lp-110.md)
- NIST FIPS 203: ML-KEM (Module-Lattice-Based Key Encapsulation)
- NIST FIPS 204: ML-DSA (Module-Lattice-Based Digital Signatures)
- NIST FIPS 205: SLH-DSA (Stateless Hash-Based Digital Signatures)

## Implementation

### Quasar Consensus Engine

**Repository**: [github.com/luxfi/consensus](https://github.com/luxfi/consensus)

| Directory | Component |
|:----------|:----------|
| `protocol/quasar/` | Core Quasar engine with quantum bundling |
| `protocol/quasar/quantum_block.go` | Async quantum block production |
| `protocol/quasar/epoch.go` | Lattice key rotation and epoch management |
| `protocol/horizon/` | Event Horizon checkpoint algorithms |
| `core/dag/horizon.go` | DAG-level horizon interface |

### FHE Seal Examples

**Repository**: [github.com/luxfi/fhe](https://github.com/luxfi/fhe)

| Example | Description |
|:--------|:------------|
| `cmd/seal` | Boolean-circuit document sealing with XNOR+AND verification |
| `cmd/provenance` | AI model provenance via encrypted hash comparison |
| `cmd/mediaseal` | Media content authentication and tamper detection |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
