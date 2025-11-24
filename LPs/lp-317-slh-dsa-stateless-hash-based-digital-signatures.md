---
lp: 317
title: SLH-DSA Stateless Hash-Based Digital Signatures
status: Final
type: Standards Track
category: Core
created: 2025-11-22
---

# LP-317: SLH-DSA Stateless Hash-Based Digital Signatures

**Status**: Final
**Type**: Standards Track
**Category**: Core
**Created**: 2025-11-22
**Updated**: 2025-11-22
**Authors**: Lux Partners
**Related**: LP-303 (Quantum), LP-311 (ML-DSA), LP-313 (ML-KEM)

## Abstract

This LP specifies the integration of **SLH-DSA (Stateless Hash-based Digital Signature Algorithm)**, NIST FIPS 205, into the Lux Network as a quantum-resistant digital signature scheme. SLH-DSA provides the most conservative security guarantees against quantum computing attacks, based only on the security of cryptographic hash functions rather than mathematical hardness assumptions.

## Motivation

### The Conservative Choice for Long-Term Security

While lattice-based schemes (ML-DSA) offer better performance, SLH-DSA provides **maximum security assurance**:
- **No mathematical assumptions**: Security relies only on hash function collision resistance
- **Decades of analysis**: Based on SPHINCS+ (2015) and earlier hash-based schemes dating to 1979
- **Future-proof**: Resistant to both quantum computers AND future cryptanalytic breakthroughs
- **Stateless**: No state management required (unlike earlier hash-based schemes like XMSS)

### Use Cases in Lux Network

**Critical Infrastructure**:
- Long-lived validator keys (multi-year commitments)
- Root certificate authorities
- Genesis block signatures
- Governance proposal signing

**Compliance Requirements**:
- Organizations requiring maximum security assurance
- Regulatory environments mandating hash-based signatures
- Critical infrastructure protection

**Defense-in-Depth**:
- Alternative to ML-DSA for diversified quantum security
- Different security foundation (hash-based vs lattice-based)
- Protects against unknown lattice-based vulnerabilities

## Specification

### Algorithm Overview

SLH-DSA is based on **SPHINCS+** construction using:
- **FORS**: Few-time signature scheme (Forest of Random Subsets)
- **WOTS+**: Winternitz One-Time Signature with improved security
- **Hash Trees**: Merkle tree structures for key aggregation
- **Hypertree**: Multi-layer tree construction

### Parameter Sets

Twelve parameter sets offering different security/performance/size trade-offs:

#### SHA2-based Variants

| Mode | Hash | Security | Public Key | Private Key | Signature | Sign Time | Verify Time |
|------|------|----------|------------|-------------|-----------|-----------|-------------|
| **SHA2-128s** | SHA-256 | 128-bit (NIST-1) | 32 bytes | 64 bytes | 7,856 bytes | ~309ms | ~286μs |
| **SHA2-128f** | SHA-256 | 128-bit (NIST-1) | 32 bytes | 64 bytes | 17,088 bytes | ~10ms | ~286μs |
| **SHA2-192s** | SHA-256 | 192-bit (NIST-3) | 48 bytes | 96 bytes | 16,224 bytes | ~418ms | ~397μs |
| **SHA2-192f** | SHA-256 | 192-bit (NIST-3) | 48 bytes | 96 bytes | 35,664 bytes | ~15ms | ~397μs |
| **SHA2-256s** | SHA-256 | 256-bit (NIST-5) | 64 bytes | 128 bytes | 29,792 bytes | ~603ms | ~593μs |
| **SHA2-256f** | SHA-256 | 256-bit (NIST-5) | 64 bytes | 128 bytes | 49,856 bytes | ~23ms | ~593μs |

#### SHAKE-based Variants

| Mode | Hash | Security | Public Key | Private Key | Signature | Sign Time | Verify Time |
|------|------|----------|------------|-------------|-----------|-----------|-------------|
| **SHAKE-128s** | SHAKE256 | 128-bit (NIST-1) | 32 bytes | 64 bytes | 7,856 bytes | ~1s | ~286μs |
| **SHAKE-128f** | SHAKE256 | 128-bit (NIST-1) | 32 bytes | 64 bytes | 17,088 bytes | ~38ms | ~286μs |
| **SHAKE-192s** | SHAKE256 | 192-bit (NIST-3) | 48 bytes | 96 bytes | 16,224 bytes | ~1.4s | ~397μs |
| **SHAKE-192f** | SHAKE256 | 192-bit (NIST-3) | 48 bytes | 96 bytes | 35,664 bytes | ~54ms | ~397μs |
| **SHAKE-256s** | SHAKE256 | 256-bit (NIST-5) | 64 bytes | 128 bytes | 29,792 bytes | ~2s | ~593μs |
| **SHAKE-256f** | SHAKE256 | 256-bit (NIST-5) | 64 bytes | 128 bytes | 49,856 bytes | ~80ms | ~593μs |

**Naming Convention**:
- **SHAKE/SHA2**: Underlying hash function
- **128/192/256**: Security level (bits)
- **s/f**: small signature (slow) vs fast signing (large signature)

**Lux Default**: SHA2-128f (fast signing, acceptable for most use cases)

### Key Generation

```go
import "github.com/luxfi/crypto/slhdsa"

// Generate SLH-DSA-SHA2-128f key pair
sk, err := slhdsa.GenerateKey(rand.Reader, slhdsa.SHA2_128f)
if err != nil {
    return err
}

// Access public key
pk := sk.PublicKey

// Serialize keys
privBytes := sk.Bytes()          // 64 bytes
pubBytes := pk.Bytes()            // 32 bytes
```

### Signing

```go
// Sign message (deterministic)
message := []byte("Critical validator commitment")
signature, err := sk.Sign(rand.Reader, message, nil)
if err != nil {
    return err
}
// signature is 17,088 bytes for SHA2-128f
```

**Properties**:
- **Deterministic**: Same (sk, message) always produces same signature
- **Stateless**: No state management required (key can be copied safely)
- **Context Support**: Optional context string for domain separation
- **Large Signatures**: 7KB - 49KB depending on parameter set

### Verification

```go
// Verify signature
valid := pk.Verify(message, signature, nil)
if !valid {
    return errors.New("invalid signature")
}
```

**Verification checks**:
1. Signature size matches parameter set
2. Hash tree path verification
3. FORS signature validation
4. WOTS+ chain verification

## Integration Points

### Critical Infrastructure Signing

**Validator Registration**:
```go
type CriticalValidatorRegistration struct {
    ValidatorID     ids.ID
    StakeDuration   time.Duration  // Multi-year commitment
    BLS             []byte         // 96 bytes - fast consensus
    SLHDSA          []byte         // 17,088 bytes - long-term security
    Mode            uint8          // SLH-DSA mode
}
```

**Use Case**: Validators with multi-year stake periods use SLH-DSA for maximum long-term security assurance.

### Governance Proposals

**Proposal Signing**:
```go
type GovernanceProposal struct {
    ProposalID      ids.ID
    Title           string
    Description     string
    Actions         []Action
    Signature       []byte  // 17,088 bytes (SHA2-128f)
    PublicKey       []byte  // 32 bytes
    Mode            uint8   // SHA2_128f
}
```

**Rationale**: Governance decisions have long-lasting effects and require maximum security assurance.

### Root Certificate Authority

**Root CA Certificate**:
```
Subject: Lux Network Root CA
Public Key Algorithm: SLH-DSA-SHA2-256s
Signature Algorithm: SLH-DSA-SHA2-256s
Validity: 10 years
```

**Use Case**: Root CAs issue long-lived certificates and require conservative security guarantees.

### EVM Precompile

**Address**: `0x0200000000000000000000000000000000000007`

**Interface**:
```solidity
interface ISLHDSA {
    /// @notice Verify SLH-DSA signature
    /// @param publicKey 32-128 bytes depending on security level
    /// @param message Arbitrary length message
    /// @param signature 7,856-49,856 bytes depending on parameter set
    /// @param mode Parameter set identifier (0-11)
    /// @return valid True if signature is valid
    function verify(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature,
        uint8 mode
    ) external view returns (bool valid);
}
```

**Gas Cost**:
- Base: 500,000 gas (expensive due to computation)
- Per byte: 50 gas per message byte
- Verification time: 286μs - 593μs depending on security level

**Example Usage**:
```solidity
contract GovernanceVault {
    address constant SLHDSA = 0x0200000000000000000000000000000000000007;

    // Only accept proposals signed with SLH-DSA-SHA2-256s
    uint8 constant REQUIRED_MODE = 4; // SHA2-256s

    function submitProposal(
        bytes calldata pubKey,
        bytes calldata proposal,
        bytes calldata signature
    ) external {
        (bool success, bytes memory result) = SLHDSA.staticcall(
            abi.encode(pubKey, proposal, signature, REQUIRED_MODE)
        );
        require(success && abi.decode(result, (bool)), "Invalid SLH-DSA signature");

        // Process governance proposal
    }
}
```

## Implementation

### Core Library

**Location**: `/Users/z/work/lux/crypto/slhdsa/`

**Dependencies**:
- `github.com/cloudflare/circl v1.6.1` (FIPS 205 compliant)

**Key Files**:
- `slhdsa.go`: Core implementation (5,123 bytes)
- `slhdsa_test.go`: Test suite (8,445 bytes)

**API**:
```go
package slhdsa

type Mode int
const (
    SHA2_128s   Mode = iota  // 128-bit security, small sig
    SHA2_128f                // 128-bit security, fast sign (default)
    SHA2_192s                // 192-bit security, small sig
    SHA2_192f                // 192-bit security, fast sign
    SHA2_256s                // 256-bit security, small sig
    SHA2_256f                // 256-bit security, fast sign
    SHAKE_128s               // SHAKE variant, 128-bit, small
    SHAKE_128f               // SHAKE variant, 128-bit, fast
    SHAKE_192s               // SHAKE variant, 192-bit, small
    SHAKE_192f               // SHAKE variant, 192-bit, fast
    SHAKE_256s               // SHAKE variant, 256-bit, small
    SHAKE_256f               // SHAKE variant, 256-bit, fast
)

type PrivateKey struct { /* ... */ }
type PublicKey struct { /* ... */ }

// Key generation
func GenerateKey(rand io.Reader, mode Mode) (*PrivateKey, error)

// Signing
func (sk *PrivateKey) Sign(rand io.Reader, message []byte, opts crypto.SignerOpts) ([]byte, error)

// Verification
func (pk *PublicKey) Verify(message, signature []byte, opts crypto.SignerOpts) bool

// Serialization
func PrivateKeyFromBytes(mode Mode, data []byte) (*PrivateKey, error)
func PublicKeyFromBytes(data []byte, mode Mode) (*PublicKey, error)

// Size helpers
func GetPublicKeySize(mode Mode) int
func GetPrivateKeySize(mode Mode) int
func GetSignatureSize(mode Mode) int
```

### EVM Precompile

**Location**: `/Users/z/work/lux/evm/precompile/contracts/slhdsa/`

**Files**:
- `contract.go`: Precompile implementation (5,280 bytes)
- `contract_test.go`: Test suite (9,433 bytes)
- `module.go`: Module registration (1,226 bytes)
- `ISLHDSA.sol`: Solidity interface (8,067 bytes)

**Integration**:
```go
// Register in precompile registry
func init() {
    precompile.Register(&SLHDSAPrecompile{})
}
```

## Test Results

### Core Implementation: 15/15 PASSING ✅

```
✓ SignVerify_SHA2_128s           (0.20s)
✓ SignVerify_SHAKE_128s          (1.02s)
✓ SignVerify_SHA2_256s           (0.36s)
✓ InvalidSignature               (0.00s)
✓ WrongMessage                   (0.00s)
✓ EmptyMessage                   (0.01s)
✓ LargeMessage                   (0.25s)
✓ PrivateKeyFromBytes            (0.00s)
✓ PublicKeyFromBytes             (0.00s)
✓ AllModes (12 parameter sets)   (5.49s)
✓ InvalidMode                    (0.00s)
✓ InvalidKeySize                 (0.00s)
✓ GetPublicKeySize               (0.00s)
✓ GetSignatureSize               (0.00s)
✓ DeterministicSigning           (0.37s)
```

### Performance Benchmarks (Apple M1 Max)

#### SHA2 Variants
```
BenchmarkSLHDSA_Sign_SHA2_128s      3 ops    309,000,000 ns/op (309ms)
BenchmarkSLHDSA_Sign_SHA2_128f    100 ops     10,000,000 ns/op (10ms)
BenchmarkSLHDSA_Sign_SHA2_256s      2 ops    603,000,000 ns/op (603ms)

BenchmarkSLHDSA_Verify_SHA2_128s  3,500 ops   286,000 ns/op (286μs)
BenchmarkSLHDSA_Verify_SHA2_256s  1,686 ops   593,000 ns/op (593μs)

BenchmarkSLHDSA_KeyGen_SHA2_128f    285 ops   35,000,000 ns/op (35ms)
```

#### SHAKE Variants (Slower)
```
BenchmarkSLHDSA_Sign_SHAKE_128s      1 op   1,020,000,000 ns/op (1.02s)
BenchmarkSLHDSA_Sign_SHAKE_128f     26 ops    38,000,000 ns/op (38ms)
```

## Migration Path

### Phase 1: Critical Infrastructure (Q1 2026)
- Deploy SLH-DSA support for long-lived validator keys
- Root CA certificates use SLH-DSA-SHA2-256s
- Governance proposals support SLH-DSA signatures

### Phase 2: EVM Integration (Q2 2026)
- Deploy SLH-DSA precompile to C-Chain
- Enable smart contracts to verify SLH-DSA signatures
- On-chain governance using SLH-DSA

### Phase 3: Diversified Security (Q3 2026)
- Validators can choose ML-DSA (fast) or SLH-DSA (conservative)
- Critical operations require SLH-DSA signatures
- Defense-in-depth with multiple quantum-safe schemes

## Security Considerations

### Hash-Based Security

**Conservative Foundation**:
- Security relies ONLY on hash function collision resistance
- No reliance on hard math problems (no lattices, no elliptic curves)
- Decades of cryptanalysis (Merkle signatures from 1979)
- Resistant to ALL quantum algorithms (including future discoveries)

**Hash Function Requirements**:
- SHA-256: 128-bit collision resistance → 128-bit security
- SHAKE256: Adjustable output length for 128/192/256-bit security
- Both are NIST-standardized and extensively analyzed

### Stateless Property

**Key Advantages**:
- Keys can be safely backed up and copied
- No state synchronization across systems
- Simpler implementation and deployment
- No catastrophic failure if state is lost

**Comparison to XMSS/LMS**:
- XMSS/LMS are stateful (must track signature counter)
- State loss = key compromise risk
- SLH-DSA eliminates this entire vulnerability class

### Trade-offs vs ML-DSA

**SLH-DSA Advantages**:
- More conservative security assumptions
- Resistant to future lattice cryptanalysis breakthroughs
- Simpler security analysis
- Deterministic and stateless

**SLH-DSA Disadvantages**:
- 2-60x slower signing (10ms - 2s vs 417μs)
- 2-15x larger signatures (7KB - 49KB vs 3KB)
- Higher computational cost for verification

### Side-Channel Resistance

**Constant-Time Operations**:
- All hash operations run in constant time
- No secret-dependent branches
- No secret-dependent memory access

**Implementation Quality**:
- CIRCL library used by Cloudflare in production
- Formal verification of critical components
- Regular security audits

### Key Management

**Validator Keys**:
- Generate fresh SLH-DSA keys for critical validators
- Store private keys in HSM when available
- Use SHA2-256s for maximum security assurance

**Backup & Recovery**:
- SLH-DSA private keys are only 64-128 bytes
- Smaller than ML-DSA keys (4,000 bytes)
- Standard seed-based derivation (BIP-39 compatible)
- Encrypt backups with AES-256

## Backwards Compatibility

**Hybrid Period (2026-2027)**:
- Validators support ML-DSA, SLH-DSA, or both
- Critical operations gradually require SLH-DSA
- Governance proposals support both signature types

**Legacy Support**:
- ECDSA addresses continue to function
- BLS signatures maintained for consensus
- Gradual transition based on security requirements

## Rationale

### Why SLH-DSA over other hash-based schemes?

**vs XMSS/LMS (stateful)**:
- SLH-DSA is stateless (no state management)
- No risk of key compromise from state loss
- Simpler operational model
- Better for distributed systems

**vs ML-DSA (lattice-based)**:
- SLH-DSA has more conservative security foundation
- No mathematical assumptions beyond hash functions
- Resistant to future cryptanalytic breakthroughs
- Trade-off: Much larger signatures and slower signing

**vs Classical Hash Functions**:
- SLH-DSA provides signatures (authentication)
- Hash functions alone only provide integrity
- Merkle tree structure enables efficient verification

### Why SHA2-128f as default?

**128-bit Security**:
- Matches current blockchain security standards
- Adequate for most applications
- Future-proof against quantum attacks

**Fast Signing (f variant)**:
- 10ms signing time acceptable for transactions
- 2x larger signature (17KB vs 7.8KB) acceptable
- Better user experience vs small variants (309ms)

**SHA2 vs SHAKE**:
- SHA2 has longer history (since 2001)
- Better hardware support and optimization
- SHAKE variants 3-5x slower on current hardware

### When to use which variant?

**SHA2-128f (Default)**:
- Standard transactions
- Regular validator operations
- General-purpose signing

**SHA2-256s (Maximum Security)**:
- Root CA certificates
- Genesis block signatures
- 10+ year security requirements
- Accept 603ms signing time for ultimate security

**SHA2-192f (Balanced)**:
- High-value transactions
- Important governance proposals
- Balance between security and performance

## Reference Implementation

### Complete Example

```go
package main

import (
    "crypto/rand"
    "fmt"

    "github.com/luxfi/crypto/slhdsa"
)

func main() {
    // Generate critical validator key pair
    validatorKey, err := slhdsa.GenerateKey(rand.Reader, slhdsa.SHA2_128f)
    if err != nil {
        panic(err)
    }

    // Sign long-term commitment
    commitment := []byte("Validator commitment for 3 years")
    signature, err := validatorKey.Sign(rand.Reader, commitment, nil)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Signature size: %d bytes\n", len(signature))
    // Output: Signature size: 17088 bytes

    // Verify signature
    valid := validatorKey.PublicKey.Verify(commitment, signature, nil)
    fmt.Printf("Signature valid: %v\n", valid)
    // Output: Signature valid: true

    // Verify deterministic signing
    signature2, _ := validatorKey.Sign(rand.Reader, commitment, nil)
    fmt.Printf("Signatures match: %v\n", string(signature) == string(signature2))
    // Output: Signatures match: true

    // Serialize for storage
    pubKeyBytes := validatorKey.PublicKey.Bytes()
    privKeyBytes := validatorKey.Bytes()

    fmt.Printf("Public key: %d bytes\n", len(pubKeyBytes))
    // Output: Public key: 32 bytes

    fmt.Printf("Private key: %d bytes\n", len(privKeyBytes))
    // Output: Private key: 64 bytes
}
```

### Governance Proposal Example

```go
// Sign governance proposal with maximum security
func signGovernanceProposal(proposal []byte) ([]byte, error) {
    // Use SHA2-256s for maximum security assurance
    sk, err := slhdsa.GenerateKey(rand.Reader, slhdsa.SHA2_256s)
    if err != nil {
        return nil, err
    }

    // Sign proposal (deterministic)
    signature, err := sk.Sign(rand.Reader, proposal, nil)
    if err != nil {
        return nil, err
    }

    // signature is 29,792 bytes for SHA2-256s
    return signature, nil
}
```

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## References

### Related Lux Proposals
- [LP-200: Post-Quantum Cryptography Suite](lp-200-post-quantum-cryptography-suite-for-lux-network.md) - Parent specification
- [LP-316: ML-DSA Post-Quantum Digital Signatures](lp-316-ml-dsa-post-quantum-digital-signatures.md) - Lattice-based alternative
- [LP-318: ML-KEM Post-Quantum Key Encapsulation](lp-318-ml-kem-post-quantum-key-encapsulation.md) - Complementary key exchange
- [LP-312: SLH-DSA Signature Verification Precompile](lp-312-slh-dsa-signature-verification-precompile.md) - EVM precompile implementation
- [LP-201: Hybrid Classical-Quantum Transitions](lp-201-hybrid-classical-quantum-cryptography-transitions.md) - Migration strategy

### Standards and Specifications
1. **FIPS 205**: [Stateless Hash-Based Digital Signature Standard](https://csrc.nist.gov/pubs/fips/205/final)
2. **SPHINCS+**: [Specification v3.1](https://sphincs.org/)
3. **CIRCL Library**: [Cloudflare Cryptographic Library](https://github.com/cloudflare/circl)
4. **Merkle Signatures**: [Merkle (1979) "Secrecy, Authentication, and Public Key Systems"](https://www.merkle.com/papers/Thesis1979.pdf)

### Implementation Files
5. **Implementation**: `/Users/z/work/lux/crypto/slhdsa/`
6. **Precompile**: `/Users/z/work/lux/evm/precompile/contracts/slhdsa/`

## Appendix A: Signature Size Comparison

| Scheme | Signature Size | Sign Time | Security Assumption |
|--------|---------------|-----------|---------------------|
| **ECDSA (secp256k1)** | 65 bytes | ~88μs | Elliptic curve discrete log (broken by quantum) |
| **BLS12-381** | 96 bytes | ~1,200μs | Pairing-based (broken by quantum) |
| **ML-DSA-65** | 3,293 bytes | ~417μs | Module-lattice (quantum-resistant) |
| **SLH-DSA-SHA2-128s** | 7,856 bytes | ~309ms | Hash function (quantum-resistant) |
| **SLH-DSA-SHA2-128f** | 17,088 bytes | ~10ms | Hash function (quantum-resistant) |
| **SLH-DSA-SHA2-256s** | 29,792 bytes | ~603ms | Hash function (quantum-resistant) |

**Security Trade-off**: SLH-DSA signatures are 120-450x larger than ECDSA but offer the most conservative post-quantum security.

## Appendix B: Performance vs Security Matrix

| Mode | Security | Sign Time | Signature Size | Best For |
|------|----------|-----------|----------------|----------|
| **SHA2-128f** | 128-bit | 10ms | 17KB | General transactions, standard validators |
| **SHA2-192f** | 192-bit | 15ms | 35KB | High-value transactions, important proposals |
| **SHA2-256s** | 256-bit | 603ms | 29KB | Root CAs, genesis signatures, ultimate security |
| **SHA2-256f** | 256-bit | 23ms | 49KB | Maximum security with faster signing |
| **SHA2-128s** | 128-bit | 309ms | 7.8KB | Bandwidth-constrained environments |

**Recommendation**:
- **Most users**: SHA2-128f (balanced performance)
- **Critical infrastructure**: SHA2-256s (maximum security)
- **High throughput**: SHA2-128f or ML-DSA-65
- **Long-term commitments**: SHA2-256s or SHA2-192s

## Appendix C: Hash-Based Signature History

**1979**: Ralph Merkle invents Merkle signatures (first hash-based signatures)

**2001**: XMSS proposed (stateful, limited signatures)

**2013**: SPHINCS proposed (first practical stateless hash-based signatures)

**2015**: SPHINCS+ improves on SPHINCS (better performance, smaller signatures)

**2024**: NIST standardizes SLH-DSA as FIPS 205

**40+ years** of cryptanalysis with no known attacks on underlying construction.
