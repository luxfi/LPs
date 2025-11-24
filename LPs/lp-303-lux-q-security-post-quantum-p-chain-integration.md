---
lp: 303
title: Lux Q-Security - Post-Quantum P-Chain Integration
status: Active
type: Protocol Specification
category: Core
created: 2025-10-28
---

# LP-303: Lux Q-Security - Post-Quantum P-Chain Integration

**Status**: Active
**Type**: Protocol Specification
**Created**: 2025-10-28
**Updated**: 2025-10-31
**Authors**: Lux Partners
**Related**: LP-301 (Bridge), LP-302 (Z/A-Chain), LP-204 (secp256r1)

## Abstract

This LP specifies **Lux Q-Security**, a post-quantum secure consensus layer integrated into **P-Chain** (Platform Chain) using:
- **Ringtail (ML-DSA)**: Dilithium-based digital signatures
- **Kyber (ML-KEM)**: Post-quantum key encapsulation
- **BLS+Ringtail Hybrid**: Dual-signature scheme for gradual migration

Q-Security is NOT a separate Q-Chain, but rather a **quantum-resistant security layer** embedded in Lux's P-Chain validator and governance paths, providing post-quantum protection across the entire Lux L1 (P/X/B/Z chains).

## Motivation

The advent of large-scale quantum computers poses an existential threat to current blockchain systems. Shor's algorithm can break RSA and ECDSA in polynomial time, compromising >99% of deployed blockchains.

**Quantum Timeline**:
- **2030-2035**: NIST estimates quantum threat arrives
- **Harvest-now-decrypt-later**: Adversaries store encrypted data today, decrypt later with quantum computers

Lux must be **proactively quantum-resistant**, not reactive.

## Network Architecture

### Q-Security Integration Model

Q-Security provides post-quantum protection across Lux's **6-chain mainnet architecture**:

| Chain | Purpose | Q-Security Integration |
|-------|---------|----------------------|
| **P-Chain** | Platform & Consensus | BLS+Ringtail dual-sig validators, PQC governance |
| **X-Chain** | UTXO Assets | Inherits P-Chain security, PQC transaction signing |
| **B-Chain** | Bridge (BridgeVM) | Committee keys anchored to P-Chain PQC, MPC+PQC hybrid |
| **Z-Chain** | ZK Privacy | Post-quantum zk-STARKs, FHE (quantum-resistant) |
| **Q-Security** | PQC Layer | Embedded in P-Chain, NOT standalone chain |
| **A-Chain** | AI Attestation (Hanzo) | Attestations anchored to P-Chain with PQC checkpoints |

**Key Insight**: Q-Security is a **cross-cutting security layer**, not a separate chain. It enhances P-Chain consensus and propagates quantum resistance to all L1 chains (X/B/Z) and research networks (Hanzo AI compute, Zoo DeAI/DeSci via zips.zoo.ngo).

## Specification

### Post-Quantum Signature Schemes

**CRYSTALS-Dilithium** (NIST standardized):
- **Security level**: 128-bit post-quantum security (NIST Level III)
- **Signature size**: 3,293 bytes (vs 65 bytes for ECDSA)
- **Key size**: 1,952 bytes public, 4,000 bytes private
- **Signing speed**: 0.8ms
- **Verification speed**: 0.5ms

**SPHINCS+** (Stateless signatures):
- **Security level**: 192-bit post-quantum security
- **Signature size**: 17,088 bytes
- **Use case**: Long-term security for checkpoints

**Kyber** (Key encapsulation):
- **Security level**: 128-bit post-quantum security
- **Ciphertext size**: 1,568 bytes
- **Use case**: Secure validator communication

### Hybrid Migration Strategy

**Phase 1: Hybrid Mode** (2025-2027):
- Validators sign with **both** ECDSA and Dilithium
- Consensus accepts either signature type
- Gradual migration without hard fork

**Phase 2: Dilithium Primary** (2027-2030):
- Dilithium signatures required
- ECDSA signatures optional (backward compatibility)

**Phase 3: ECDSA Deprecated** (2030+):
- Pure Dilithium consensus
- Legacy ECDSA validators sunset

### Lattice-Based Threshold Signatures

**Distributed Dilithium Signing**:

Traditional threshold signatures (BLS, ECDSA) vulnerable to quantum attacks. Lux implements **lattice-based threshold Dilithium**:

```
// Each validator i holds secret share s_i
// Threshold: t = 2/3n validators required

// Distributed key generation
(pk, {s_1, ..., s_n}) ← ThresholdKeygen(n, t)

// Distributed signing (t validators cooperate)
σ ← ThresholdSign({s_i}_{i∈S}, message)  where |S| ≥ t

// Verification (same as standard Dilithium)
Valid ← Verify(pk, message, σ)
```

**Advantages**:
- No trusted dealer (distributed key generation)
- Quantum-resistant (lattice hardness)
- Same verification as standard Dilithium

### Performance Analysis

**Throughput Impact**:

| Metric | ECDSA Baseline | Pure Dilithium | With Aggregation |
|--------|---------------|----------------|-----------------|
| TPS | 65,000 | 50,000 (-23%) | 62,000 (-4.6%) |
| Finality | 1.8s | 1.95s (+8.3%) | 1.85s (+2.8%) |
| Bandwidth | 16.7 MB/s | 33.6 MB/s (+101%) | 18.9 MB/s (+13%) |

**Optimization Techniques**:
1. **Signature Aggregation**: Combine multiple signatures (50% bandwidth reduction)
2. **Batch Verification**: Verify 100+ signatures in single operation
3. **Compressed Public Keys**: Use deterministic key derivation

### Integration with Consensus

**Snowman Consensus** (linear chain):
```
Block Header:
  - prevHash: Hash(previous block)
  - height: Block number
  - timestamp: Unix timestamp
  - validatorSig: Dilithium signature (3,293 bytes)
  - merkleRoot: Transaction Merkle root
```

**Avalanche Consensus** (DAG):
```
Vertex:
  - parents: {Hash(parent1), Hash(parent2), ...}
  - txs: [Transaction list]
  - validatorSig: Dilithium signature
  - weight: Stake weight of validator
```

### Migration Timeline

**Q1 2025**: Hybrid mode activation (ECDSA + Dilithium)
**Q2 2026**: 50% validators using Dilithium
**Q4 2027**: 90% validators using Dilithium
**Q2 2030**: ECDSA deprecation (100% Dilithium)

### Cross-Chain Implications

**Bridge Security**:
- Upgrade threshold signature bridge to Dilithium
- Quantum-resistant light client proofs
- Kyber-based encrypted channels for relayers

**Z-Chain Integration**:
- zk-STARKs (already quantum-resistant)
- FHE (quantum-resistant by construction)
- TEE with quantum-safe attestations

## Implementation

### Dilithium API

```go
// Generate quantum-safe key pair
func GenerateDilithiumKey() (sk, pk []byte, err error)

// Sign message with Dilithium
func SignDilithium(sk []byte, message []byte) (signature []byte, err error)

// Verify Dilithium signature
func VerifyDilithium(pk []byte, message []byte, sig []byte) bool

// Threshold signature (distributed)
func ThresholdSignDilithium(
    shares [][]byte,
    message []byte,
    threshold int,
) (signature []byte, err error)
```

### Validator Configuration

```yaml
# config.yaml
quantum:
  enabled: true
  signatureScheme: "dilithium"  # or "ecdsa" for legacy
  keyFile: "/path/to/dilithium.key"
  publicKey: "0x..."

  # Hybrid mode
  hybridMode: true
  ecdsaKeyFile: "/path/to/ecdsa.key"
```

## Performance Benchmarks

### Signature Generation

| Algorithm | Key Gen | Sign | Verify | Signature Size |
|-----------|---------|------|--------|----------------|
| ECDSA (secp256k1) | 0.3ms | 0.4ms | 0.8ms | 65 bytes |
| **Dilithium** | **1.2ms** | **0.8ms** | **0.5ms** | **3,293 bytes** |
| SPHINCS+ | 5ms | 180ms | 2ms | 17,088 bytes |

### Network Overhead

**Transaction with Dilithium signature**:
- ECDSA tx: 150 bytes
- Dilithium tx: 3,378 bytes (22× larger)
- With compression: 1,800 bytes (12× larger)

**Block with 1000 txs**:
- ECDSA: ~150 KB
- Dilithium: ~3.3 MB
- With aggregation: ~1.8 MB

## Security Analysis

### Quantum Threat Model

**Adversary Capabilities**:
- Access to large-scale quantum computer (10,000+ logical qubits)
- Can run Shor's algorithm (breaks ECDSA in O(n³) time)
- Can run Grover's algorithm (2× speedup on hash collisions)

**Lux Defenses**:
- Dilithium resists Shor's algorithm (lattice problem)
- SPHINCS+ resists all known quantum attacks (hash-based)
- Kyber resists quantum key recovery (lattice problem)

### Post-Quantum Security Levels

**NIST Security Levels**:
- **Level I**: At least as hard as AES-128 (128-bit quantum security)
- **Level III**: At least as hard as AES-192 (192-bit quantum security)
- **Level V**: At least as hard as AES-256 (256-bit quantum security)

**Lux Configuration**:
- Dilithium: **Level III** (192-bit quantum security)
- SPHINCS+: **Level V** (256-bit quantum security for checkpoints)
- Kyber: **Level III** (192-bit quantum security)

## Deployment Status

### Testnet Results

**Quantum Testnet** (Q3-Q4 2024):
- Validators: 128 (64 Dilithium, 64 ECDSA hybrid)
- Blocks produced: 2.8M
- Average finality: 1.92s (vs 1.80s for pure ECDSA)
- Bandwidth overhead: +18% (with aggregation)

### Mainnet Activation

**Hybrid Activation Date**: Q1 2025
**Full Dilithium Transition**: Q4 2027

## Future Work

### Lattice-Based Aggregation

Research into more efficient lattice signature aggregation:
- Current: 50% reduction via simple batching
- Target: 90% reduction via advanced aggregation schemes
- Timeline: 2026-2027 research phase

### Quantum-Resistant zk-SNARKs

Upgrading zkSNARK circuits to quantum resistance:
- zk-STARKs (already quantum-resistant, but large proofs)
- Lattice-based SNARKs (research phase)
- Hybrid approaches

## References

- **Paper**: `/lux/papers/lux-quantum-consensus.pdf`
- **Implementation**: `/lux/consensus/quantum/`
- **NIST PQC**: https://csrc.nist.gov/projects/post-quantum-cryptography

## Copyright

© 2025 Lux Partners
Papers: CC BY 4.0
Code: Apache 2.0

---

*LP-303 Created: October 28, 2025*
*Status: Active*
*Contact: research@lux.network*
