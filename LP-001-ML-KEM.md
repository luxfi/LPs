# LP-001: ML-KEM (FIPS 203) Integration

## Summary
Integrate ML-KEM (Module-Lattice Key Encapsulation Mechanism) as specified in FIPS 203 into the Lux blockchain for quantum-resistant key exchange and hybrid encryption.

## Motivation
With the advent of quantum computing, current public-key cryptography based on RSA and elliptic curves will become vulnerable. ML-KEM provides a quantum-resistant alternative for key encapsulation, essential for:
- Secure key exchange in TLS/network communications
- Hybrid encryption schemes
- Future-proof secure channels

## Specification

### Algorithm Parameters
- **ML-KEM-512**: Level 1 security (128-bit), 800B public key
- **ML-KEM-768**: Level 3 security (192-bit), 1184B public key (recommended)
- **ML-KEM-1024**: Level 5 security (256-bit), 1568B public key

### Implementation
Located in `/crypto/mlkem/`:
- Pure Go implementation via Cloudflare CIRCL
- CGO-optimized implementation via pq-crystals/kyber
- Automatic fallback based on build flags

### Use Cases

#### 1. Quantum-Safe TLS
```go
// Hybrid key exchange: X25519 + ML-KEM
classicalSecret := ecdh.X25519(...)
quantumResult, _ := mlkem.Encapsulate(peerPublicKey)
finalSecret := kdf(classicalSecret || quantumResult.SharedSecret)
```

#### 2. Encrypted State Channels
```go
// Establish quantum-safe channel between validators
priv, _ := mlkem.GenerateKeyPair(rand.Reader, mlkem.MLKEM768)
// Exchange public keys
// Derive shared secrets for symmetric encryption
```

#### 3. Hybrid Wallet Encryption
```go
// Encrypt wallet with both classical and PQ methods
aesKey := randomKey()
encryptedAES := rsa.Encrypt(aesKey)
encryptedMLKEM := mlkem.Encapsulate(aesKey)
// Store both for redundancy
```

### EVM Integration
Precompiled contracts at:
- `0x120`: ML-KEM-512 encapsulation
- `0x121`: ML-KEM-768 encapsulation  
- `0x122`: ML-KEM-1024 encapsulation
- `0x123`: ML-KEM decapsulation (all levels)

Gas costs:
- Encapsulation: 500,000 gas
- Decapsulation: 600,000 gas

### Migration Path
1. **Phase 1**: Deploy ML-KEM alongside existing ECDH
2. **Phase 2**: Hybrid mode (both classical and PQ)
3. **Phase 3**: ML-KEM becomes primary, ECDH for compatibility
4. **Phase 4**: Full quantum-safe mode

## Rationale

### Why ML-KEM?
- **NIST standardized** (FIPS 203)
- **Efficient**: Fast operations, reasonable key sizes
- **Proven**: Based on well-studied lattice problems
- **Flexible**: Multiple security levels

### Why Hybrid Approach?
- **Risk mitigation**: Protection even if one fails
- **Compatibility**: Gradual transition
- **Standards compliance**: Following NIST guidelines

## Backwards Compatibility
- Fully backward compatible via hybrid mode
- Old clients ignore ML-KEM data
- Graceful degradation to classical crypto

## Test Cases
```go
func TestMLKEMHybrid(t *testing.T) {
    // Test hybrid encryption
    priv, _ := mlkem.GenerateKeyPair(rand.Reader, mlkem.MLKEM768)
    
    // Classical + Quantum
    classicalCT := rsa.Encrypt(data)
    quantumResult, _ := priv.PublicKey.Encapsulate(rand.Reader)
    
    // Decrypt both
    classicalPT := rsa.Decrypt(classicalCT)
    sharedSecret := priv.Decapsulate(quantumResult.Ciphertext)
    
    // Verify hybrid decryption
    assert.Equal(t, data, classicalPT)
    assert.NotNil(t, sharedSecret)
}
```

## Security Considerations
- **Ciphertext validation**: Always validate before decapsulation
- **Random number generation**: Use crypto/rand
- **Side-channel protection**: Constant-time operations
- **Key storage**: Larger keys need secure storage

## Implementation Timeline
- Week 1-2: Core implementation
- Week 3: EVM precompiles
- Week 4: Network integration
- Week 5-6: Testing and auditing

## References
- [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)
- [Kyber Specification](https://pq-crystals.org/kyber/)
- [Cloudflare CIRCL](https://github.com/cloudflare/circl)

## Copyright
Copyright (C) 2025, Lux Industries Inc. All rights reserved.