---
lp: 4082
title: Q-Chain - Quantum-Resistant Chain Specification
tags: [core, quantum, cryptography, chain]
description: Specification for the Q-Chain (Quantum VM) providing post-quantum cryptographic security for the Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: [4, 5, 10]
---

## Abstract

LP-0082 specifies the Q-Chain (Quantum-Resistant Chain), a specialized blockchain within the Lux Network that provides post-quantum cryptographic security. The Q-Chain serves as the quantum-safe foundation for the network, implementing NIST-approved post-quantum algorithms (ML-KEM, ML-DSA, SLH-DSA) and providing quantum timestamping services for other chains.

## Motivation

With the advancement of quantum computing, traditional cryptographic algorithms (ECDSA, RSA) face existential threats. The Q-Chain addresses this by:

1. **Quantum-Safe Transactions**: All transactions on Q-Chain use post-quantum signatures
2. **Quantum Stamping**: Provides quantum-safe timestamps for cross-chain operations
3. **Key Management**: Secure key generation and rotation using lattice-based cryptography
4. **Migration Path**: Enables gradual migration of other chains to quantum-safe algorithms

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `qchain` |
| VM ID | `qvm` |
| VM Name | `quantumvm` |
| Network ID (Mainnet) | 36963 |
| Network ID (Testnet) | 36962 |
| Block Time | 2 seconds |
| Consensus | Quasar (quantum-aware) |

### Implementation

**Go Package**: `github.com/luxfi/node/vms/quantumvm`

```go
import (
    qvm "github.com/luxfi/node/vms/quantumvm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var QVMID = constants.QVMID // ids.ID{'q', 'v', 'm'}

// Create Q-Chain VM
factory := &qvm.Factory{}
vm, err := factory.New(logger)
```

### Directory Structure

```
node/vms/quantumvm/
├── config/           # Chain configuration
├── quantum/          # Post-quantum crypto primitives
├── stamper/          # Quantum timestamp service
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
└── vm_test.go        # Tests
```

### Cryptographic Algorithms

The Q-Chain implements NIST FIPS 203-205 approved algorithms:

#### ML-KEM (FIPS 203) - Key Encapsulation
- **ML-KEM-768**: 128-bit security level (default)
- **ML-KEM-1024**: 192-bit security level (high-security mode)

```go
import "github.com/luxfi/node/crypto/mlkem"

// Generate key pair
pk, sk, err := mlkem.GenerateKey768()

// Encapsulate
ciphertext, sharedSecret, err := mlkem.Encapsulate768(pk)

// Decapsulate
sharedSecret, err := mlkem.Decapsulate768(ciphertext, sk)
```

#### ML-DSA (FIPS 204) - Digital Signatures
- **ML-DSA-44**: 128-bit security (fast verification)
- **ML-DSA-65**: 192-bit security (default)
- **ML-DSA-87**: 256-bit security (high-security)

```go
import "github.com/luxfi/node/crypto/mldsa"

// Generate key pair
pk, sk, err := mldsa.GenerateKey65()

// Sign message
signature, err := mldsa.Sign65(sk, message)

// Verify signature
valid, err := mldsa.Verify65(pk, message, signature)
```

#### SLH-DSA (FIPS 205) - Hash-Based Signatures
- Stateless hash-based signatures for long-term security
- SPHINCS+ based implementation

### Quantum Stamping Service

The Q-Chain provides quantum-safe timestamps for cross-chain operations:

```go
type QuantumStamp struct {
    ChainID     ids.ID    `json:"chainId"`
    BlockHash   [32]byte  `json:"blockHash"`
    BlockHeight uint64    `json:"blockHeight"`
    Timestamp   time.Time `json:"timestamp"`
    Signature   []byte    `json:"signature"`    // ML-DSA signature
    PublicKey   []byte    `json:"publicKey"`
}

// Stamp a block from another chain
stamp, err := qvm.CreateQuantumStamp(chainID, blockHash, blockHeight)

// Verify a quantum stamp
valid, err := qvm.VerifyQuantumStamp(stamp)
```

### Transaction Types

1. **QuantumTransfer**: Transfer assets with PQ signatures
2. **KeyRotation**: Rotate quantum keys
3. **StampRequest**: Request quantum timestamp for cross-chain
4. **StampVerify**: Verify quantum timestamp

### Configuration

```json
{
  "quantumvm": {
    "signatureScheme": "ML-DSA-65",
    "keyEncapsulation": "ML-KEM-768",
    "stampingEnabled": true,
    "stampExpirySeconds": 3600,
    "parallelVerification": true,
    "maxVerifyWorkers": 8
  }
}
```

### API Endpoints

#### RPC Methods

| Method | Description |
|--------|-------------|
| `quantum.getStamp` | Get quantum stamp for block |
| `quantum.verifyStamp` | Verify quantum stamp |
| `quantum.getPublicKey` | Get node's quantum public key |
| `quantum.signMessage` | Sign message with quantum key |
| `quantum.verifySignature` | Verify quantum signature |

#### REST Endpoints

```
GET  /ext/bc/Q/quantum/stamp/{chainId}/{blockHeight}
POST /ext/bc/Q/quantum/verify
GET  /ext/bc/Q/quantum/keys
POST /ext/bc/Q/quantum/rotate
```

### Cross-Chain Integration

The Q-Chain integrates with other chains via quantum stamps:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   C-Chain   │────▶│   Q-Chain   │────▶│   B-Chain   │
│  (Source)   │     │  (Stamp)    │     │  (Bridge)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │    Request Stamp  │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │    Return Stamp   │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │         Cross-chain with PQ stamp     │
       │──────────────────────────────────────▶│
```

### Security Considerations

1. **Key Storage**: Private keys must be stored in secure enclaves (SGX/TDX)
2. **Stamp Expiry**: Quantum stamps expire after configurable period
3. **Algorithm Agility**: Support for algorithm upgrades as standards evolve
4. **Hybrid Mode**: Optional hybrid signatures (classical + PQ) during transition

### Performance

| Operation | Time (ms) | Notes |
|-----------|-----------|-------|
| ML-DSA-65 Sign | 0.5 | Per signature |
| ML-DSA-65 Verify | 0.2 | Per signature |
| ML-KEM-768 Encap | 0.3 | Per operation |
| ML-KEM-768 Decap | 0.2 | Per operation |
| Parallel Verify (8 workers) | 0.03 | Per signature |

## Rationale

The Q-Chain design decisions:

1. **Separate Chain**: Isolation allows independent upgrades and specialized consensus
2. **NIST Algorithms**: Industry standard, extensively analyzed
3. **Stamping Service**: Enables quantum security without modifying all chains
4. **Parallel Verification**: Essential for transaction throughput

## Backwards Compatibility

The Q-Chain is a new chain with no backwards compatibility concerns. Other chains can optionally integrate quantum stamps without breaking changes.

## Test Cases

See `github.com/luxfi/node/vms/quantumvm/vm_test.go`:

```go
func TestQuantumSigner(t *testing.T)
func TestParallelVerification(t *testing.T)
func TestConfigValidation(t *testing.T)
func TestQuantumStampExpiration(t *testing.T)
func TestFactory(t *testing.T)
```

## Reference Implementation

**Repository**: `github.com/luxfi/node`
**Package**: `vms/quantumvm`
**Dependencies**:
- `github.com/luxfi/node/crypto/mlkem`
- `github.com/luxfi/node/crypto/mldsa`

## Security Considerations

1. **Quantum Threat Model**: Assumes quantum computers capable of breaking classical crypto
2. **Side-Channel Resistance**: Implementations must resist timing attacks
3. **Key Management**: Quantum keys require larger storage (ML-DSA-65: 1952 bytes)
4. **Migration Security**: Hybrid mode prevents "harvest now, decrypt later" attacks

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
