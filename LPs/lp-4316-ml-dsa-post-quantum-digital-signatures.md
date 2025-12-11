---
lp: 4316
title: ML-DSA Post-Quantum Digital Signatures
description: NIST FIPS 204 ML-DSA (CRYSTALS-Dilithium) post-quantum digital signature implementation for Lux Network
author: Lux Partners (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-11-22
requires: 303
tags: [pqc]
---

# LP-316: ML-DSA Post-Quantum Digital Signatures

**Status**: Final
**Type**: Standards Track
**Category**: Core
**Created**: 2025-11-22
**Updated**: 2025-11-22
**Authors**: Lux Partners
**Related**: LP-303 (Quantum), LP-312 (SLH-DSA), LP-313 (ML-KEM)

## Abstract

This LP specifies the integration of **ML-DSA (Module-Lattice-Based Digital Signature Algorithm)**, NIST FIPS 204, into the Lux Network as a quantum-resistant digital signature scheme. ML-DSA provides security against quantum computing attacks while maintaining performance suitable for blockchain consensus and transaction signing.

## Motivation

### Quantum Threat Timeline

Current blockchain systems rely on ECDSA (secp256k1) which is vulnerable to Shor's algorithm:
- **2030-2035**: NIST estimates quantum computers capable of breaking RSA-2048 and secp256k1
- **Harvest-now-decrypt-later**: Adversaries capture encrypted data today for future decryption
- **Validator Security**: Long-lived validator keys need quantum protection NOW

### Why ML-DSA?

**NIST Standardization**: FIPS 204 (August 2024)
- Formally standardized post-quantum signature scheme
- Extensive cryptanalysis by global community
- Module-lattice security foundation

**Performance Characteristics**:
- Sign: 150-600μs (3 security levels)
- Verify: 80-150μs
- ~3x slower than ECDSA but acceptable for blockchain use

**Deterministic Signatures**:
- Same message + same key = same signature
- Eliminates k-value attacks that plague ECDSA
- Simpler implementation without randomness requirements

## Specification

### Algorithm Overview

ML-DSA is based on **Fiat-Shamir with Aborts** construction over module lattices:
- **Security**: MLWE (Module Learning With Errors) problem
- **Structure**: Ring polynomials mod q = 8380417
- **Parameters**: d (dimension), η (noise), γ (challenge weight)

### Security Levels

Three parameter sets providing different security/performance trade-offs:

| Mode | Security | Public Key | Private Key | Signature | Sign Time | Verify Time |
|------|----------|------------|-------------|-----------|-----------|-------------|
| **ML-DSA-44** | 128-bit (NIST-2) | 1,312 bytes | 2,528 bytes | 2,420 bytes | ~150μs | ~80μs |
| **ML-DSA-65** | 192-bit (NIST-3) | 1,952 bytes | 4,000 bytes | 3,293 bytes | ~417μs | ~108μs |
| **ML-DSA-87** | 256-bit (NIST-5) | 2,592 bytes | 4,864 bytes | 4,595 bytes | ~600μs | ~150μs |

**Lux Default**: ML-DSA-65 (192-bit security, balanced performance)

### Key Generation

```go
import "github.com/luxfi/crypto/mldsa"

// Generate ML-DSA-65 key pair
sk, err := mldsa.GenerateKey(rand.Reader, mldsa.MLDSA65)
if err != nil {
    return err
}

// Access public key
pk := sk.PublicKey

// Serialize keys
privBytes := sk.Bytes()          // 4,000 bytes
pubBytes := pk.Bytes()            // 1,952 bytes
```

### Signing

```go
// Sign message (deterministic)
message := []byte("Transaction data")
signature, err := sk.Sign(rand.Reader, message, nil)
if err != nil {
    return err
}
// signature is 3,293 bytes for ML-DSA-65
```

**Properties**:
- **Deterministic**: Same (sk, message) always produces same signature
- **Context Support**: Optional context string for domain separation
- **No k-value**: Eliminates ECDSA's k-value vulnerability

### Verification

```go
// Verify signature
valid := pk.Verify(message, signature, nil)
if !valid {
    return errors.New("invalid signature")
}
```

**Verification checks**:
1. Signature size = 3,293 bytes (for ML-DSA-65)
2. Polynomial bounds verification
3. Challenge reconstruction and comparison

## Integration Points

### P-Chain Validators

**Hybrid BLS + ML-DSA**:
```go
type ValidatorSignature struct {
    BLS     []byte  // 96 bytes - current
    MLDSA   []byte  // 3,293 bytes - quantum-safe
    Mode    uint8   // ML-DSA mode (44/65/87)
}
```

**Verification**: Both signatures must be valid
- **Classical**: BLS threshold verification
- **Quantum**: ML-DSA individual verification
- **Transition**: Gradually increase ML-DSA weight in consensus

### Transaction Signing

**Address Format**:
```
lux1mldsa<mode><bech32-encoded-pubkey-hash>
```

**Example**: `lux1mldsa65qpr3zvr8j5y5jxm9d8qgtnpwjx7h9k2v`

**Transaction Structure**:
```go
type MLDSATransaction struct {
    ChainID     ids.ID
    Nonce       uint64
    To          common.Address
    Value       *big.Int
    Data        []byte
    Signature   []byte  // 3,293 bytes (ML-DSA-65)
    PublicKey   []byte  // 1,952 bytes
    Mode        uint8   // 65
}
```

### EVM Precompile

**Address**: `0x0200000000000000000000000000000000000006`

**Interface**:
```solidity
interface IMLDSA {
    /// @notice Verify ML-DSA signature
    /// @param publicKey 1,952 bytes for ML-DSA-65
    /// @param message Arbitrary length message
    /// @param signature 3,293 bytes for ML-DSA-65
    /// @return valid True if signature is valid
    function verify(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool valid);
}
```

**Gas Cost**:
- Base: 100,000 gas
- Per byte: 10 gas per message byte

**Example Usage**:
```solidity
contract SecureVault {
    address constant MLDSA = 0x0200000000000000000000000000000000000006;

    function withdraw(
        bytes calldata pubKey,
        bytes calldata message,
        bytes calldata signature
    ) external {
        (bool success, bytes memory result) = MLDSA.staticcall(
            abi.encode(pubKey, message, signature)
        );
        require(success && abi.decode(result, (bool)), "Invalid signature");

        // Process withdrawal
    }
}
```

## Implementation

### Core Cryptographic Library

**GitHub**: [`github.com/luxfi/crypto/mldsa`](https://github.com/luxfi/crypto/tree/main/mldsa)
**Local Path**: `~/work/lux/crypto/mldsa/`

**Key Files**:
- [`mldsa.go`](https://github.com/luxfi/crypto/blob/main/mldsa/mldsa.go) - Core ML-DSA-65 implementation (7,687 bytes)
- [`mldsa_test.go`](https://github.com/luxfi/crypto/blob/main/mldsa/mldsa_test.go) - Comprehensive test suite (7,480 bytes)
- [`README.md`](https://github.com/luxfi/crypto/blob/main/mldsa/README.md) - Documentation

**Dependencies**:
- `github.com/cloudflare/circl v1.6.1` (FIPS 204 compliant)

**API**:
```go
package mldsa

type Mode int
const (
    MLDSA44 Mode = iota  // 128-bit security
    MLDSA65              // 192-bit security (default)
    MLDSA87              // 256-bit security
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
```

### EVM Precompile

**GitHub**: [`github.com/luxfi/evm/precompile/contracts/mldsa`](https://github.com/luxfi/evm/tree/main/precompile/contracts/mldsa)
**Local Path**: `~/work/lux/evm/precompile/contracts/mldsa/`
**Precompile Address**: `0x0200000000000000000000000000000000000006`

**Files**:
- [`contract.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/contract.go) - Precompile implementation (4,477 bytes)
- [`contract_test.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/contract_test.go) - Test suite (7,505 bytes)
- [`module.go`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/module.go) - Module registration (1,132 bytes)
- [`IMLDSA.sol`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/IMLDSA.sol) - Solidity interface (7,070 bytes)
- [`README.md`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/README.md) - Detailed documentation (5,486 bytes)

**Integration**:
```go
// Register in precompile registry
func init() {
    precompile.Register(&MLDSAPrecompile{})
}
```

### Solidity Smart Contracts

**GitHub**: [`github.com/luxfi/standard`](https://github.com/luxfi/standard)
**Local Path**: `~/work/lux/standard/src/`

**Example Usage**: See [`IMLDSA.sol`](https://github.com/luxfi/evm/blob/main/precompile/contracts/mldsa/IMLDSA.sol) for interface and library examples

```solidity
// Using ML-DSA precompile in your contracts
import "~/work/lux/evm/precompile/contracts/mldsa/IMLDSA.sol";

contract SecureVault is MLDSAVerifier {
    function withdraw(
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external {
        // Automatically reverts if signature is invalid
        verifyMLDSASignature(publicKey, message, signature);

        // Process withdrawal
        payable(msg.sender).transfer(address(this).balance);
    }
}
```

**Testing**:
```bash
# Test Solidity contracts using ML-DSA
cd ~/work/lux/standard
forge test --match-path test/**/*MLDSA*.t.sol
```

## Test Results

### Core Implementation: 11/11 PASSING ✅

```
✓ SignVerify                 (0.00s)
✓ InvalidSignature           (0.00s)
✓ WrongMessage               (0.00s)
✓ EmptyMessage               (0.00s)
✓ LargeMessage               (0.00s)
✓ PrivateKeyFromBytes        (0.00s)
✓ PublicKeyFromBytes         (0.00s)
✓ InvalidMode                (0.00s)
✓ InvalidKeySize             (0.00s)
✓ GetPublicKeySize           (0.00s)
✓ GetSignatureSize           (0.00s)
```

### Performance Benchmarks (Apple M1 Max)

```
BenchmarkMLDSA_Sign_65         2,400 ops    417,000 ns/op
BenchmarkMLDSA_Verify_65       9,259 ops    108,000 ns/op
BenchmarkMLDSA_KeyGen_65       8,000 ops    125,000 ns/op
```

## Migration Path

### Phase 1: Validator Support (Q1 2026)
- Add ML-DSA public keys to validator registration
- Hybrid BLS + ML-DSA signing in consensus
- Gradual weight shift from BLS to ML-DSA

### Phase 2: Transaction Support (Q2 2026)
- Deploy ML-DSA precompile to C-Chain
- Enable ML-DSA transaction signing
- Wallet integration for quantum-safe addresses

### Phase 3: Full Transition (Q3 2026)
- ML-DSA becomes primary signature scheme
- BLS maintained for backwards compatibility
- New validators require ML-DSA keys

## Security Considerations

### Quantum Resistance

**Lattice Security**: Based on MLWE problem
- No known quantum algorithms break lattice problems efficiently
- NIST analyzed security for 6+ years before standardization
- Conservative parameter selection (128/192/256-bit security)

**Long-term Security**:
- Public keys captured today remain secure post-quantum
- Deterministic signatures prevent timing attacks
- Constant-time implementation in CIRCL library

### Side-Channel Resistance

**Constant-Time Operations**:
- All arithmetic operations run in constant time
- No secret-dependent branches
- No secret-dependent memory access

**Implementation Quality**:
- CIRCL library used by Cloudflare in production
- Formal verification of critical components
- Regular security audits

### Key Management

**Validator Keys**:
- Generate fresh ML-DSA keys for each validator
- Store private keys in HSM when available
- Use separate keys for consensus vs transaction signing

**Backup & Recovery**:
- ML-DSA private keys are 4,000 bytes (65% larger than ECDSA)
- Use seed-based key derivation (BIP-39 compatible)
- Encrypt backups with quantum-safe encryption (AES-256)

## Backwards Compatibility

**Hybrid Period (2026-2027)**:
- All validators support BOTH BLS and ML-DSA
- Transactions can use either ECDSA or ML-DSA
- Consensus requires both signature types to be valid

**Legacy Support**:
- ECDSA addresses continue to function
- Cross-chain messaging supports both signature types
- Gradual deprecation of ECDSA over 2-3 years

## Rationale

### Why ML-DSA over alternatives?

**vs SLH-DSA (LP-312)**:
- ML-DSA is 10-100x faster (417μs vs 40ms sign time)
- Smaller signatures (3,293 bytes vs 17,088-49,856 bytes)
- Trade-off: Lattice security assumptions vs hash-based conservative security

**vs Classical Multivariate**:
- ML-DSA has stronger security analysis
- NIST standardized (vs academic proposals)
- Better performance and key sizes

**vs Falcon (NIST finalist)**:
- ML-DSA has simpler implementation (no floating point)
- More conservative security parameters
- Deterministic signing (Falcon requires random seeds)

### Why ML-DSA-65 as default?

**192-bit Security (NIST Level 3)**:
- Exceeds Bitcoin's 128-bit security
- Margin for future cryptanalysis advances
- Matches high-value financial applications

**Performance Balance**:
- 417μs sign time acceptable for transaction throughput
- 108μs verify time suitable for consensus
- 3,293 byte signatures fit in typical network packets

## Reference Implementation

### Complete Example

```go
package main

import (
    "crypto/rand"
    "fmt"

    "github.com/luxfi/crypto/mldsa"
)

func main() {
    // Generate validator key pair
    validatorKey, err := mldsa.GenerateKey(rand.Reader, mldsa.MLDSA65)
    if err != nil {
        panic(err)
    }

    // Sign consensus message
    blockHash := []byte("block_hash_data_here")
    signature, err := validatorKey.Sign(rand.Reader, blockHash, nil)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Signature size: %d bytes\n", len(signature))
    // Output: Signature size: 3293 bytes

    // Verify signature
    valid := validatorKey.PublicKey.Verify(blockHash, signature, nil)
    fmt.Printf("Signature valid: %v\n", valid)
    // Output: Signature valid: true

    // Serialize for storage
    pubKeyBytes := validatorKey.PublicKey.Bytes()
    privKeyBytes := validatorKey.Bytes()

    fmt.Printf("Public key: %d bytes\n", len(pubKeyBytes))
    // Output: Public key: 1952 bytes

    fmt.Printf("Private key: %d bytes\n", len(privKeyBytes))
    // Output: Private key: 4000 bytes
}
```

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## References

### Related Lux Proposals
- [LP-200: Post-Quantum Cryptography Suite](lp-200-post-quantum-cryptography-suite-for-lux-network.md) - Parent specification
- [LP-317: SLH-DSA Stateless Hash-Based Digital Signatures](lp-317-slh-dsa-stateless-hash-based-digital-signatures.md) - Alternative PQC signature scheme
- [LP-318: ML-KEM Post-Quantum Key Encapsulation](lp-318-ml-kem-post-quantum-key-encapsulation.md) - Complementary key exchange
- [LP-311: ML-DSA Signature Verification Precompile](lp-311-ml-dsa-signature-verification-precompile.md) - EVM precompile implementation
- [LP-201: Hybrid Classical-Quantum Transitions](lp-201-hybrid-classical-quantum-cryptography-transitions.md) - Migration strategy

### Standards and Specifications
1. **FIPS 204**: [Module-Lattice-Based Digital Signature Standard](https://csrc.nist.gov/pubs/fips/204/final)
2. **CRYSTALS-Dilithium**: [Specification v3.1](https://pq-crystals.org/dilithium/)
3. **CIRCL Library**: [Cloudflare Cryptographic Library](https://github.com/cloudflare/circl)

### Implementation Files
4. **Implementation**: `crypto/mldsa/`
5. **Precompile**: `evm/precompile/contracts/mldsa/`

## Appendix A: Key Size Comparison

| Scheme | Public Key | Private Key | Signature | Security |
|--------|-----------|-------------|-----------|----------|
| **ECDSA (secp256k1)** | 33 bytes | 32 bytes | 65 bytes | 128-bit (classical) |
| **BLS12-381** | 96 bytes | 32 bytes | 96 bytes | 128-bit (classical) |
| **ML-DSA-44** | 1,312 bytes | 2,528 bytes | 2,420 bytes | 128-bit (quantum) |
| **ML-DSA-65** | 1,952 bytes | 4,000 bytes | 3,293 bytes | 192-bit (quantum) |
| **ML-DSA-87** | 2,592 bytes | 4,864 bytes | 4,595 bytes | 256-bit (quantum) |

**Size Trade-off**: 60x larger keys, 50x larger signatures for quantum resistance

## Appendix B: Performance Comparison

| Operation | ECDSA | BLS | ML-DSA-65 | Slowdown |
|-----------|-------|-----|-----------|----------|
| **Key Generation** | ~30μs | ~100μs | ~125μs | 4x vs ECDSA |
| **Sign** | ~88μs | ~1,200μs | ~417μs | 5x vs ECDSA |
| **Verify** | ~88μs | ~2,500μs | ~108μs | 1.2x vs ECDSA |

**Performance Trade-off**: 1-5x slower operations for quantum resistance
