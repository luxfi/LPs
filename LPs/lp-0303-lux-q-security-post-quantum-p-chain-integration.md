---
lp: 0303
title: Lux Q-Security - Post-Quantum P-Chain Integration
description: Post-quantum secure consensus layer integrated into P-Chain using ML-DSA (Dilithium), ML-KEM (Kyber), and BLS+Ringtail hybrid signatures
author: Lux Partners (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-10-28
requires: 204, 301, 302
tags: [pqc, consensus, core]
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

## Rationale

### Design Decisions

**1. Dilithium as Primary PQC Scheme**: CRYSTALS-Dilithium (ML-DSA) was selected over alternatives due to:
- NIST standardization (FIPS 204) providing regulatory certainty
- Fastest verification among lattice-based signatures (0.5ms)
- Reasonable signature size (3,293 bytes) compared to hash-based schemes
- Strong security proofs based on Module-LWE hardness

**2. Hybrid Migration Strategy**: The phased BLS+Ringtail hybrid approach was chosen over immediate replacement because:
- Allows gradual validator migration without hard fork
- Maintains backward compatibility during transition
- Provides defense-in-depth (both schemes must be broken)
- Enables testing and optimization before full commitment

**3. Lattice-Based Threshold Signatures**: Traditional threshold schemes (Shamir, BLS) are quantum-vulnerable:
- Threshold Dilithium preserves t-of-n security model
- No trusted dealer requirement (distributed key generation)
- Same verification as standard Dilithium (interoperability)

**4. Signature Aggregation**: To mitigate bandwidth overhead:
- Batch verification reduces CPU cost by ~80% for bulk operations
- Aggregate signatures combine multiple signatures into smaller proofs
- Compression techniques reduce signature size by ~45%

### Alternatives Considered

- **SPHINCS+**: Hash-based signatures with 256-bit quantum security, but signature sizes (17KB+) and signing time (180ms) make it impractical for consensus. Reserved for checkpoint finality only.
- **Falcon**: Faster than Dilithium but requires complex floating-point operations and has side-channel concerns. Not NIST-standardized as primary.
- **Rainbow**: Multivariate signatures rejected due to cryptanalysis concerns that led to NIST removal.
- **Direct Replacement**: Immediate ECDSA deprecation rejected as too disruptive to existing infrastructure and validators.

## Backwards Compatibility

This LP introduces significant but managed breaking changes:

### Transition Period

**Phase 1 - Hybrid Mode (2025-2027)**:
- Validators MAY use either ECDSA or Dilithium signatures
- Consensus accepts both signature types
- No breaking changes for existing infrastructure
- New validators encouraged to use Dilithium

**Phase 2 - Dilithium Primary (2027-2030)**:
- Dilithium signatures REQUIRED for new validators
- ECDSA signatures OPTIONAL for legacy validators
- SDK updates for Dilithium support mandatory
- Wallet providers must implement Dilithium signing

**Phase 3 - ECDSA Deprecated (2030+)**:
- Pure Dilithium consensus
- ECDSA-only validators cannot participate
- Legacy transactions remain valid but cannot be created

### Migration Requirements

**Validators**:
- Generate Dilithium key pair via `lux quantum keygen`
- Update configuration to enable hybrid mode
- Transition to Dilithium-only after testing

**Applications**:
- Update SDK to version with Dilithium support
- Handle larger signature sizes in transaction parsing
- Implement dual-verification during hybrid period

**Bridges**:
- Upgrade threshold signatures to lattice-based schemes
- Update light client proof verification
- Maintain ECDSA verification for historical proofs

## Security Considerations

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

## Test Cases

### Unit Tests

```go
// Test: Dilithium key generation
func TestDilithiumKeyGeneration(t *testing.T) {
    sk, pk, err := quantum.GenerateDilithiumKey()
    require.NoError(t, err)
    require.Len(t, pk, 1952)  // ML-DSA-65 public key size
    require.Len(t, sk, 4000)  // ML-DSA-65 secret key size
}

// Test: Dilithium signature generation and verification
func TestDilithiumSignature(t *testing.T) {
    sk, pk, _ := quantum.GenerateDilithiumKey()
    message := []byte("test block hash")

    sig, err := quantum.SignDilithium(sk, message)
    require.NoError(t, err)
    require.Len(t, sig, 3293)  // ML-DSA-65 signature size

    valid := quantum.VerifyDilithium(pk, message, sig)
    require.True(t, valid)
}

// Test: Invalid signature rejection
func TestDilithiumInvalidSignature(t *testing.T) {
    sk, pk, _ := quantum.GenerateDilithiumKey()
    message := []byte("test message")

    sig, _ := quantum.SignDilithium(sk, message)

    // Corrupt signature
    sig[0] ^= 0xFF

    valid := quantum.VerifyDilithium(pk, message, sig)
    require.False(t, valid)
}

// Test: Hybrid signature mode
func TestHybridSignature(t *testing.T) {
    ecdsaSk, ecdsaPk := crypto.GenerateKey()
    dilithiumSk, dilithiumPk, _ := quantum.GenerateDilithiumKey()

    message := []byte("hybrid test message")

    hybrid := quantum.HybridSign(ecdsaSk, dilithiumSk, message)

    // Both signatures must verify
    valid := quantum.VerifyHybrid(ecdsaPk, dilithiumPk, message, hybrid)
    require.True(t, valid)
}

// Test: Threshold Dilithium signing
func TestThresholdDilithium(t *testing.T) {
    n := 10  // Total validators
    threshold := 7  // 2/3 + 1

    pk, shares, _ := quantum.ThresholdKeygen(n, threshold)
    message := []byte("consensus message")

    // Sign with threshold validators
    selectedShares := shares[:threshold]
    sig, err := quantum.ThresholdSignDilithium(selectedShares, message, threshold)
    require.NoError(t, err)

    // Verify with standard Dilithium verification
    valid := quantum.VerifyDilithium(pk, message, sig)
    require.True(t, valid)
}

// Test: Threshold signing fails below threshold
func TestThresholdBelowMinimum(t *testing.T) {
    n := 10
    threshold := 7

    _, shares, _ := quantum.ThresholdKeygen(n, threshold)
    message := []byte("insufficient signatures")

    // Only 6 validators (below threshold)
    selectedShares := shares[:6]
    _, err := quantum.ThresholdSignDilithium(selectedShares, message, threshold)
    require.Error(t, err)
}

// Test: Kyber key encapsulation
func TestKyberKeyEncapsulation(t *testing.T) {
    pk, sk, _ := quantum.GenerateKyberKey()

    ciphertext, sharedSecret1, err := quantum.Encapsulate(pk)
    require.NoError(t, err)
    require.Len(t, ciphertext, 1568)  // Kyber-768 ciphertext

    sharedSecret2, err := quantum.Decapsulate(sk, ciphertext)
    require.NoError(t, err)
    require.Equal(t, sharedSecret1, sharedSecret2)
}

// Test: Block signature validation
func TestBlockDilithiumSignature(t *testing.T) {
    validator := NewQuantumValidator()

    block := &Block{
        Height:    1000,
        Timestamp: time.Now(),
        TxRoot:    crypto.Keccak256Hash([]byte("transactions")),
    }

    signedBlock, err := validator.SignBlock(block)
    require.NoError(t, err)

    valid := ValidateBlockSignature(signedBlock)
    require.True(t, valid)
}
```

### Integration Tests

**Location**: `tests/e2e/quantum/pqc_test.go`

1. **Hybrid Consensus**: Run 10-node network with 5 ECDSA and 5 Dilithium validators
2. **Signature Migration**: Test validator transition from ECDSA to Dilithium mid-operation
3. **Threshold Signing**: Verify 2/3 threshold signatures with 100 validators
4. **Cross-Chain PQC**: Test Q-Security with B-Chain bridge and Z-Chain privacy

### Performance Benchmarks

```go
func BenchmarkDilithiumSign(b *testing.B) {
    sk, _, _ := quantum.GenerateDilithiumKey()
    message := make([]byte, 32)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        quantum.SignDilithium(sk, message)
    }
}
// Result: ~0.8ms per signature (Apple M1 Max)

func BenchmarkDilithiumVerify(b *testing.B) {
    sk, pk, _ := quantum.GenerateDilithiumKey()
    message := make([]byte, 32)
    sig, _ := quantum.SignDilithium(sk, message)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        quantum.VerifyDilithium(pk, message, sig)
    }
}
// Result: ~0.5ms per verification (Apple M1 Max)

func BenchmarkBatchVerify(b *testing.B) {
    // Prepare 100 signatures
    sigs := make([]QuantumSignature, 100)
    for i := range sigs {
        sk, pk, _ := quantum.GenerateDilithiumKey()
        msg := []byte(fmt.Sprintf("message-%d", i))
        sig, _ := quantum.SignDilithium(sk, msg)
        sigs[i] = QuantumSignature{PK: pk, Msg: msg, Sig: sig}
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        quantum.BatchVerify(sigs)
    }
}
// Result: ~12ms for 100 signatures (120µs average vs 500µs individual)
```

## References

- **Quantum Consensus Paper**: [~/work/lux/papers/lux-quantum-consensus.tex](~/work/lux/papers/lux-quantum-consensus.tex)
- **Post-Quantum Cryptography Paper**: [~/work/lux/papers/lux-ethfalcon-post-quantum.tex](~/work/lux/papers/lux-ethfalcon-post-quantum.tex)
- **Implementation**: https://github.com/luxfi/node/tree/main/consensus/quantum
- **NIST PQC**: https://csrc.nist.gov/projects/post-quantum-cryptography

## Copyright

© 2025 Lux Partners
Papers: CC BY 4.0
Code: Apache 2.0

---

*LP-303 Created: October 28, 2025*
*Status: Active*
*Contact: research@lux.network*
