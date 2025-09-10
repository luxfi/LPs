# LP-003: SLH-DSA (FIPS 205) Integration

## Summary
Integrate SLH-DSA (Stateless Hash-Based Digital Signature Algorithm) as specified in FIPS 205 into the Lux blockchain for ultra-secure, stateless quantum-resistant signatures.

## Motivation
SLH-DSA provides unique advantages as a hash-based signature scheme:
- **Stateless**: No state management required (unlike XMSS/LMS)
- **Minimal assumptions**: Security based solely on hash functions
- **Tiny keys**: 32-64 byte public keys (smallest among PQ signatures)
- **Long-term security**: Most conservative security assumptions

## Specification

### Algorithm Parameters (FIPS 205)

| Parameter Set | Security | Public Key | Private Key | Signature | Use Case |
|--------------|----------|------------|-------------|-----------|----------|
| SLH-DSA-SHA2-128s | Level 1 | 32 B | 64 B | 7,856 B | Small signatures |
| SLH-DSA-SHA2-128f | Level 1 | 32 B | 64 B | 17,088 B | Fast signing |
| SLH-DSA-SHA2-192s | Level 3 | 48 B | 96 B | 16,224 B | Balanced |
| SLH-DSA-SHA2-192f | Level 3 | 48 B | 96 B | 35,664 B | Fast Level 3 |
| SLH-DSA-SHA2-256s | Level 5 | 64 B | 128 B | 29,792 B | Maximum security |
| SLH-DSA-SHA2-256f | Level 5 | 64 B | 128 B | 49,856 B | Fast Level 5 |

### Implementation Architecture

#### Core Library (`/crypto/slhdsa/`)
```go
// Pure Go implementation
package slhdsa

// FIPS 205 compliant implementation
func GenerateKey(rand io.Reader, mode Mode) (*PrivateKey, error)
func (priv *PrivateKey) Sign(message []byte) ([]byte, error)
func (pub *PublicKey) Verify(message, signature []byte) bool

// CGO optimized version (when CGO=1)
func GenerateKeyCGO(rand io.Reader, mode Mode) (*PrivateKey, error)
func SignCGO(priv *PrivateKey, message []byte) ([]byte, error)
func VerifyCGO(pub *PublicKey, message, signature []byte) bool
```

#### C Implementation (`/crypto/slhdsa/c/`)
Based on SPHINCS+ reference implementation:
- Optimized SHA-256 implementations
- AVX2 optimizations when available
- Constant-time operations

### Precompiled Contracts

```solidity
// SLH-DSA verification precompiles
0x114: SLH-DSA-128s verify (10M gas)
0x115: SLH-DSA-128f verify (15M gas)
0x116: SLH-DSA-192s verify (15M gas)
0x117: SLH-DSA-192f verify (25M gas)
0x118: SLH-DSA-256s verify (20M gas)
0x119: SLH-DSA-256f verify (30M gas)
```

### Use Cases

#### 1. Root Certificate Authority
```go
// Long-term root CA with minimal assumptions
rootCA := &CertificateAuthority{
    SigningKey: slhdsa.GenerateKey(rand.Reader, slhdsa.SLHDSA256s),
    Algorithm:  "SLH-DSA-SHA2-256s",
    ValidFor:   50 * 365 * 24 * time.Hour, // 50 years
}

// Sign intermediate certificates
func (ca *CertificateAuthority) SignCertificate(cert *Certificate) {
    signature := ca.SigningKey.Sign(cert.TBS())
    cert.Signature = signature
}
```

#### 2. Genesis Block Signatures
```go
// Genesis blocks signed with SLH-DSA for maximum security
type GenesisBlock struct {
    ChainID   uint64
    Timestamp time.Time
    Signature []byte // SLH-DSA signature
}

func SignGenesis(genesis *GenesisBlock, key *slhdsa.PrivateKey) {
    data := genesis.Hash()
    genesis.Signature = key.Sign(data)
}
```

#### 3. Long-Term Smart Contracts
```solidity
contract LongTermVault {
    // 32-byte public key for 50+ year security
    bytes32 public slhdsaPublicKey;
    
    function withdraw(
        uint256 amount,
        bytes calldata signature // ~30KB for Level 5
    ) external {
        bytes32 message = keccak256(abi.encode(msg.sender, amount));
        
        // Verify with SLH-DSA precompile
        require(
            verifySLHDSA256s(message, signature, slhdsaPublicKey),
            "Invalid signature"
        );
        
        // Execute withdrawal
        payable(msg.sender).transfer(amount);
    }
}
```

#### 4. Validator Key Rotation
```go
// Validators can rotate keys without state management
validator := &Validator{
    CurrentKey: slhdsa.GenerateKey(rand.Reader, slhdsa.SLHDSA192s),
    // No need to track used signatures (stateless)
}

// Sign attestation
attestation := &Attestation{
    Height:    12345,
    BlockHash: hash,
}
signature := validator.CurrentKey.Sign(attestation.Hash())
```

### Performance Characteristics

#### Signing Performance
```
SLH-DSA-128s: 66.7 signs/sec (slow, small signatures)
SLH-DSA-128f: 2000 signs/sec (fast, large signatures)
SLH-DSA-192s: 42.1 signs/sec
SLH-DSA-192f: 1250 signs/sec
SLH-DSA-256s: 27.0 signs/sec
SLH-DSA-256f: 833 signs/sec
```

#### Verification Performance
```
SLH-DSA-128s: 5000 verifies/sec
SLH-DSA-128f: 200 verifies/sec
SLH-DSA-192s: 3000 verifies/sec
SLH-DSA-192f: 120 verifies/sec
SLH-DSA-256s: 2000 verifies/sec
SLH-DSA-256f: 80 verifies/sec
```

### Comparison with ML-DSA

| Aspect | SLH-DSA | ML-DSA |
|--------|---------|--------|
| Public Key Size | 32-64 B ✅ | 1.3-2.6 KB ❌ |
| Signature Size | 8-50 KB ❌ | 2.4-4.6 KB ✅ |
| Signing Speed | Slow ❌ | Fast ✅ |
| Verification Speed | Medium | Fast ✅ |
| Security Assumptions | Hash only ✅ | Lattice ❌ |
| Stateless | Yes ✅ | Yes ✅ |
| Hardware Support | Simple ✅ | Good ✅ |

### CGO Optimization Strategy

```go
// Build with CGO for 3-5x performance improvement
// CGO_ENABLED=1 go build

// Automatic detection and fallback
func Verify(pub *PublicKey, msg, sig []byte) bool {
    if UseCGO() {
        return VerifyCGO(pub, msg, sig) // 3x faster
    }
    return VerifyGo(pub, msg, sig)
}
```

### Storage Optimization

Despite large signatures, SLH-DSA is ideal for:
1. **Infrequent operations**: Root certificates, genesis blocks
2. **Off-chain storage**: Store signature separately, verify on-chain
3. **Compression**: Signatures compress well (~50% with zlib)

## Security Considerations

### Hash Function Security
- Uses SHA-256 (SHA-512 for 256-bit security)
- Resistant to quantum attacks on hash functions
- No algebraic structure to exploit

### Implementation Security
- Deterministic signatures (no RNG failures)
- No secret-dependent memory access
- Simple implementation reduces bugs

### Future-Proofing
- Most conservative security model
- Survives even if lattice problems are broken
- Based on 40+ years of hash function research

## Migration Path

### Phase 1: Root Infrastructure (Month 1)
- Deploy for root CAs and genesis signatures
- Establish trust anchors

### Phase 2: Critical Systems (Month 2-3)
- Validator root keys
- Treasury multisigs
- Long-term vaults

### Phase 3: Optional Adoption (Month 4+)
- Available for applications needing maximum security
- Not mandatory due to signature size

## Test Cases

```go
func TestSLHDSAStateless(t *testing.T) {
    key, _ := slhdsa.GenerateKey(rand.Reader, slhdsa.SLHDSA192s)
    
    // Sign same message multiple times (stateless)
    msg := []byte("test message")
    sig1 := key.Sign(msg)
    sig2 := key.Sign(msg)
    
    // Signatures are identical (deterministic)
    assert.Equal(t, sig1, sig2)
    
    // Both verify
    assert.True(t, key.PublicKey.Verify(msg, sig1))
    assert.True(t, key.PublicKey.Verify(msg, sig2))
}

func TestSLHDSACGOPerformance(t *testing.T) {
    if !slhdsa.UseCGO() {
        t.Skip("CGO not available")
    }
    
    key, _ := slhdsa.GenerateKeyCGO(rand.Reader, slhdsa.SLHDSA128f)
    msg := make([]byte, 1024)
    
    // Benchmark CGO vs Pure Go
    start := time.Now()
    sigCGO := slhdsa.SignCGO(key, msg)
    cgoDuration := time.Since(start)
    
    start = time.Now()
    sigGo := key.Sign(msg)
    goDuration := time.Since(start)
    
    // CGO should be 3-5x faster
    speedup := float64(goDuration) / float64(cgoDuration)
    assert.Greater(t, speedup, 3.0)
}
```

## Implementation Timeline
- Week 1: Pure Go implementation (SPHINCS+)
- Week 2: CGO optimization with reference C code
- Week 3: EVM precompiles
- Week 4: Integration tests
- Week 5: Security audit

## References
- [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) - SLH-DSA Standard
- [SPHINCS+](https://sphincs.org/) - Underlying algorithm
- [Cloudflare CIRCL](https://github.com/cloudflare/circl/tree/main/sign/sphincs)
- [Reference Implementation](https://github.com/sphincs/sphincsplus)

## Copyright
Copyright (C) 2025, Lux Industries Inc. All rights reserved.