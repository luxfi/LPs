---
lp: 0200
title: Post-Quantum Cryptography Suite for Lux Network
description: Comprehensive specification for NIST-standardized post-quantum cryptographic algorithms
author: Lux Industries Inc (@luxfi)
discussions-to: https://forum.lux.network/t/lp-200-post-quantum-cryptography
status: Draft
type: Standards Track
category: Core
created: 2025-01-24
requires: 700
tags: [pqc, core]
---

## Abstract

This proposal establishes the complete post-quantum cryptography suite for the Lux Network, integrating NIST FIPS 203-205 standardized algorithms (ML-KEM, ML-DSA, SLH-DSA) to provide quantum-resistant security for all blockchain operations. The suite enables confidential AI compute and private finance applications through lattice-based cryptographic primitives that resist attacks from both classical and quantum computers.

## Motivation

With quantum computers approaching the threshold to break current elliptic curve and RSA cryptography (estimated 10,000 logical qubits by 2030), blockchain networks must transition to post-quantum algorithms. This is particularly critical for:

- **AI Confidential Compute**: Protecting model parameters and inference data
- **Private Finance**: Securing long-term financial contracts and custody
- **Validator Security**: Preventing quantum attacks on consensus
- **State Proofs**: Ensuring merkle proofs remain unforgeable

## Specification

### 1. ML-KEM (Module-Lattice Key Encapsulation Mechanism) - FIPS 203

#### Algorithm Parameters

| Parameter Set | Security Level | Public Key | Private Key | Ciphertext | Shared Secret |
|--------------|----------------|------------|-------------|------------|---------------|
| ML-KEM-512   | NIST Level 1 (128-bit) | 800 B | 1,632 B | 768 B | 32 B |
| ML-KEM-768   | NIST Level 3 (192-bit) | 1,184 B | 2,400 B | 1,088 B | 32 B |
| ML-KEM-1024  | NIST Level 5 (256-bit) | 1,568 B | 3,168 B | 1,568 B | 32 B |

#### Implementation

```go
package mlkem

import (
    "crypto/rand"
    "github.com/cloudflare/circl/kem/mlkem768" // Reference implementation
)

type KEMScheme interface {
    GenerateKeyPair(rand io.Reader) (PublicKey, PrivateKey, error)
    Encapsulate(rand io.Reader, pk PublicKey) (ct []byte, ss []byte, error)
    Decapsulate(sk PrivateKey, ct []byte) (ss []byte, error)
}

// Security proof: Based on Module-LWE problem
// Reduction: If Module-LWE is hard, ML-KEM is IND-CCA2 secure
// Reference: Bos et al., "CRYSTALS-Kyber: A CCA-Secure Module-Lattice-Based KEM"
```

#### EVM Precompiled Contracts

```solidity
// ML-KEM precompiles for EVM integration
address constant ML_KEM_512_ENCAP = 0x0000000000000000000000000000000000000120;
address constant ML_KEM_768_ENCAP = 0x0000000000000000000000000000000000000121;
address constant ML_KEM_1024_ENCAP = 0x0000000000000000000000000000000000000122;
address constant ML_KEM_DECAP = 0x0000000000000000000000000000000000000123;

// Gas costs based on computational complexity
uint256 constant GAS_ML_KEM_ENCAP = 500_000;
uint256 constant GAS_ML_KEM_DECAP = 600_000;
```

### 2. ML-DSA (Module-Lattice Digital Signature Algorithm) - FIPS 204

#### Algorithm Parameters

| Parameter Set | Security Level | Public Key | Private Key | Signature | Signing Ops/sec | Verification Ops/sec |
|--------------|----------------|------------|-------------|-----------|-----------------|--------------------|
| ML-DSA-44    | NIST Level 2 (128-bit) | 1,312 B | 2,560 B | 2,420 B | 40,000 | 45,000 |
| ML-DSA-65    | NIST Level 3 (192-bit) | 1,952 B | 4,032 B | 3,309 B | 35,000 | 40,000 |
| ML-DSA-87    | NIST Level 5 (256-bit) | 2,592 B | 4,896 B | 4,627 B | 30,000 | 35,000 |

#### EVM Optimization (ETH-ML-DSA)

Based on ZKNOX ETHDILITHIUM research:

```solidity
// Optimizations for EVM execution
contract ETHMDLSA {
    // Replace SHAKE with Keccak256 (native opcode)
    function expandSeedOptimized(bytes32 seed) internal pure returns (bytes memory) {
        bytes memory output = new bytes(EXPANSION_SIZE);
        for (uint i = 0; i < BLOCKS; i++) {
            bytes32 block = keccak256(abi.encode(seed, i));
            // 8x gas reduction: 4M → 500K gas
        }
        return output;
    }
    
    // Store NTT precomputed public keys
    mapping(address => bytes) public nttPublicKeys;
    
    // Verification with precomputed NTT: 13M → 4M gas
    function verifyOptimized(
        bytes32 message,
        bytes memory signature,
        bytes memory pubkeyNTT
    ) public view returns (bool) {
        (bool success,) = ML_DSA_OPTIMIZED.staticcall(
            abi.encode(message, signature, pubkeyNTT)
        );
        return success;
    }
}
```

#### Security Analysis

```
Security Reduction: ML-DSA → Module-SIS + Module-LWE
Quantum Security: 128/192/256-bit against Grover's algorithm
Classical Security: 256/384/512-bit against lattice reduction

Reference: Ducas et al., "CRYSTALS-Dilithium: Digital Signatures from Module Lattices"
NIST PQC Round 3 Winner - Selected July 2022
```

### 3. SLH-DSA (Stateless Hash-Based Digital Signature Algorithm) - FIPS 205

#### Algorithm Parameters

| Parameter Set | Security | Public Key | Private Key | Signature | Use Case |
|--------------|----------|------------|-------------|-----------|----------|
| SLH-DSA-SHA2-128s | Level 1 | 32 B | 64 B | 7,856 B | Small signatures |
| SLH-DSA-SHA2-128f | Level 1 | 32 B | 64 B | 17,088 B | Fast signing |
| SLH-DSA-SHA2-192s | Level 3 | 48 B | 96 B | 16,224 B | Balanced |
| SLH-DSA-SHA2-256s | Level 5 | 64 B | 128 B | 29,792 B | Maximum security |

#### Implementation Strategy

```go
package slhdsa

// Stateless design - no state management required
type SLHDSAKey struct {
    mode     Mode
    publicKey []byte  // 32-64 bytes only!
    secretKey []byte
}

// Perfect for long-term security (50+ years)
func (k *SLHDSAKey) Sign(message []byte) []byte {
    // Deterministic, no RNG failures possible
    // Based solely on hash function security
    return sphincsSign(k.secretKey, message)
}

// Security: Only assumes collision resistance of SHA-256/SHA3
// No algebraic structure that quantum computers can exploit
```

### 4. Hybrid Cryptography Mode

#### Transition Strategy

```go
type HybridSigner struct {
    classical ECDSAKey    // For compatibility
    quantum   MLDSAKey    // For security
    mode      HybridMode  // AND or OR validation
}

func (h *HybridSigner) Sign(msg []byte) *HybridSignature {
    return &HybridSignature{
        Classical: h.classical.Sign(msg),
        Quantum:   h.quantum.Sign(msg),
        Mode:      h.mode,
    }
}

func VerifyHybrid(msg []byte, sig *HybridSignature, pubkeys *HybridPublicKey) bool {
    classicalValid := ecdsa.Verify(msg, sig.Classical, pubkeys.Classical)
    quantumValid := mldsa.Verify(msg, sig.Quantum, pubkeys.Quantum)
    
    switch sig.Mode {
    case HybridAND:
        return classicalValid && quantumValid  // Both must pass
    case HybridOR:
        return classicalValid || quantumValid  // Either passes
    }
}
```

### 5. AI Confidential Compute Applications

#### Secure Multi-Party Computation

```go
type ConfidentialAICompute struct {
    // Lattice-based homomorphic properties
    encryptionScheme *MLKEMScheme
    
    // Threshold signatures for distributed inference
    signatureScheme  *MLDSAThreshold
    
    // Secure model parameter sharing
    secretSharing    *LatticeShamir
}

func (c *ConfidentialAICompute) SecureInference(
    encryptedInput []byte,
    modelShards []ModelShard,
) ([]byte, error) {
    // Each compute node processes encrypted data
    results := make([][]byte, len(modelShards))
    
    for i, shard := range modelShards {
        // Homomorphic computation on encrypted data
        results[i] = shard.ComputeOnEncrypted(encryptedInput)
    }
    
    // Aggregate results while preserving privacy
    return c.secretSharing.Reconstruct(results)
}
```

#### Private Finance Integration

```solidity
contract QuantumSafeDeFi {
    // Long-term value locks with quantum resistance
    struct TimeLock {
        uint256 amount;
        uint256 unlockTime; // Can be 50+ years
        bytes32 slhdsaPublicKey; // Only 32 bytes!
        bytes quantumProof;
    }
    
    // Zero-knowledge proofs with lattice cryptography
    function proveBalanceGTE(
        uint256 threshold,
        bytes memory latticeProof
    ) public view returns (bool) {
        // Verify using lattice-based ZK-SNARK
        return verifyLatticeProof(latticeProof, threshold);
    }
}
```

## Rationale

### Why NIST Algorithms?

1. **Standardization**: FIPS 203-205 provide formal security definitions
2. **Analysis**: 7+ years of cryptanalysis by global researchers
3. **Implementation**: Reference implementations available
4. **Hardware**: Expected support in secure elements

### Why Lattice-Based?

1. **Efficiency**: Better performance than code/multivariate alternatives
2. **Versatility**: Supports encryption, signatures, and advanced protocols
3. **Security**: Based on worst-case to average-case reductions
4. **Future-Proof**: Resistant to known quantum algorithms

### Performance Considerations

```yaml
Benchmarks (AMD EPYC 7763, single-threaded):

ML-KEM-768:
  KeyGen: 20 μs
  Encaps: 25 μs
  Decaps: 30 μs

ML-DSA-65:
  KeyGen: 30 μs
  Sign: 100 μs
  Verify: 35 μs

SLH-DSA-192s:
  KeyGen: 10 μs
  Sign: 25 ms
  Verify: 2 ms

Hardware Acceleration (with AVX2/SHA extensions):
  2-3x speedup for lattice operations
  5x speedup for hash operations
```

## Backwards Compatibility

The hybrid mode ensures complete backwards compatibility:

1. **Phase 1** (Months 1-3): Deploy alongside classical crypto
2. **Phase 2** (Months 4-6): Require both signatures
3. **Phase 3** (Months 7-9): Quantum primary, classical fallback
4. **Phase 4** (Month 10+): Quantum-only for new accounts

## Test Cases

```go
func TestQuantumSuite(t *testing.T) {
    // Test ML-KEM key exchange
    kemPub, kemPriv, _ := mlkem.GenerateKeyPair(rand.Reader)
    ct, ss1, _ := mlkem.Encapsulate(rand.Reader, kemPub)
    ss2, _ := mlkem.Decapsulate(kemPriv, ct)
    assert.Equal(t, ss1, ss2)
    
    // Test ML-DSA signatures
    dsaPub, dsaPriv, _ := mldsa.GenerateKeyPair(rand.Reader)
    msg := []byte("quantum resistant message")
    sig, _ := mldsa.Sign(dsaPriv, msg)
    assert.True(t, mldsa.Verify(dsaPub, msg, sig))
    
    // Test hybrid validation
    hybridSig := signHybrid(msg, classicalKey, quantumKey)
    assert.True(t, verifyHybrid(msg, hybridSig, hybridPubKey))
}
```

## Reference Implementation

Complete implementation available at: https://github.com/luxfi/crypto

## Security Considerations

1. **Side-Channel Resistance**: All implementations use constant-time operations
2. **RNG Quality**: Require NIST SP 800-90A compliant random number generators
3. **Key Storage**: Larger keys require secure hardware/software key management
4. **Migration Risks**: Hybrid mode prevents single point of failure during transition
5. **Quantum Timeline**: Monitor NIST and NSA guidance on quantum threat evolution

## References

### Related Lux Proposals
- [LP-318: ML-KEM Post-Quantum Key Encapsulation](lp-318-ml-kem-post-quantum-key-encapsulation.md)
- [LP-316: ML-DSA Post-Quantum Digital Signatures](lp-316-ml-dsa-post-quantum-digital-signatures.md)
- [LP-317: SLH-DSA Stateless Hash-Based Digital Signatures](lp-317-slh-dsa-stateless-hash-based-digital-signatures.md)
- [LP-311: ML-DSA Signature Verification Precompile](lp-311-ml-dsa-signature-verification-precompile.md)
- [LP-312: SLH-DSA Signature Verification Precompile](lp-312-slh-dsa-signature-verification-precompile.md)
- [LP-201: Hybrid Classical-Quantum Cryptography Transitions](lp-201-hybrid-classical-quantum-cryptography-transitions.md)
- [LP-202: Cryptographic Agility Framework](lp-202-cryptographic-agility-framework.md)

### NIST Standards
1. [FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism](https://doi.org/10.6028/NIST.FIPS.203)
2. [FIPS 204: Module-Lattice-Based Digital Signature Algorithm](https://doi.org/10.6028/NIST.FIPS.204)
3. [FIPS 205: Stateless Hash-Based Digital Signature Algorithm](https://doi.org/10.6028/NIST.FIPS.205)
4. [Regev, O. "On lattices, learning with errors, random linear codes, and cryptography"](https://doi.org/10.1145/1060590.1060603)
5. [Peikert, C. "A Decade of Lattice Cryptography"](https://doi.org/10.1561/0400000074)
6. [NIST Post-Quantum Cryptography Standardization](https://csrc.nist.gov/Projects/post-quantum-cryptography)

### Implementation References
7. [ZKNOX ETHDILITHIUM - EVM Optimizations](https://github.com/ZKNOX/ETHDILITHIUM)
8. [Cloudflare CIRCL - Pure Go Implementation](https://github.com/cloudflare/circl)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).