---
lp: 4000
title: Q-Chain - Core Quantum-Resistant Specification
tags: [core, quantum, cryptography, q-chain]
description: Core specification for the Q-Chain (Quantum Chain), Lux Network's post-quantum cryptographic chain
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: [0, 99]
supersedes: 82
---

## Abstract

LP-4000 specifies the Q-Chain (Quantum-Resistant Chain), Lux Network's specialized blockchain providing post-quantum cryptographic security. The Q-Chain implements NIST-approved post-quantum algorithms (ML-KEM, ML-DSA, SLH-DSA) and provides quantum timestamping services for cross-chain operations.

## Motivation

With quantum computing advancement, traditional cryptographic algorithms face threats:

1. **Quantum-Safe Transactions**: All Q-Chain transactions use post-quantum signatures
2. **Quantum Stamping**: Provides quantum-safe timestamps for cross-chain
3. **Key Management**: Secure key generation using lattice-based cryptography
4. **Migration Path**: Enables gradual migration to quantum-safe algorithms

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `Q` |
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
├── quantum/          # Post-quantum primitives
├── stamper/          # Quantum timestamp service
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
└── *_test.go         # Tests

node/crypto/
├── mlkem/            # ML-KEM (FIPS 203)
├── mldsa/            # ML-DSA (FIPS 204)
└── slhdsa/           # SLH-DSA (FIPS 205)
```

### Cryptographic Algorithms

#### ML-KEM (FIPS 203) - Key Encapsulation

```go
import "github.com/luxfi/node/crypto/mlkem"

// Generate key pair
pk, sk, err := mlkem.GenerateKey768()

// Encapsulate
ciphertext, sharedSecret, err := mlkem.Encapsulate768(pk)

// Decapsulate
sharedSecret, err := mlkem.Decapsulate768(ciphertext, sk)
```

| Variant | Security Level | Public Key | Ciphertext |
|---------|----------------|------------|------------|
| ML-KEM-768 | 128-bit | 1,184 bytes | 1,088 bytes |
| ML-KEM-1024 | 192-bit | 1,568 bytes | 1,568 bytes |

#### ML-DSA (FIPS 204) - Digital Signatures

```go
import "github.com/luxfi/node/crypto/mldsa"

// Generate key pair
pk, sk, err := mldsa.GenerateKey65()

// Sign message
signature, err := mldsa.Sign65(sk, message)

// Verify signature
valid, err := mldsa.Verify65(pk, message, signature)
```

| Variant | Security Level | Public Key | Signature |
|---------|----------------|------------|-----------|
| ML-DSA-44 | 128-bit | 1,312 bytes | 2,420 bytes |
| ML-DSA-65 | 192-bit | 1,952 bytes | 3,293 bytes |
| ML-DSA-87 | 256-bit | 2,592 bytes | 4,595 bytes |

#### SLH-DSA (FIPS 205) - Hash-Based Signatures

```go
import "github.com/luxfi/node/crypto/slhdsa"

// Generate key pair (stateless)
pk, sk, err := slhdsa.GenerateKey()

// Sign message
signature, err := slhdsa.Sign(sk, message)

// Verify signature
valid, err := slhdsa.Verify(pk, message, signature)
```

### Quantum Stamping Service

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

| Type | Description |
|------|-------------|
| `QuantumTransfer` | Transfer assets with PQ signatures |
| `KeyRotation` | Rotate quantum keys |
| `StampRequest` | Request quantum timestamp |
| `StampVerify` | Verify quantum timestamp |
| `HybridSign` | Classical + PQ signature |

### Cross-Chain Integration

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

### Configuration

```json
{
  "quantumvm": {
    "signatureScheme": "ML-DSA-65",
    "keyEncapsulation": "ML-KEM-768",
    "stampingEnabled": true,
    "stampExpirySeconds": 3600,
    "parallelVerification": true,
    "maxVerifyWorkers": 8,
    "hybridMode": true
  }
}
```

### Performance

| Operation | Time (ms) | Notes |
|-----------|-----------|-------|
| ML-DSA-65 Sign | 0.5 | Per signature |
| ML-DSA-65 Verify | 0.2 | Per signature |
| ML-KEM-768 Encap | 0.3 | Per operation |
| ML-KEM-768 Decap | 0.2 | Per operation |
| Parallel Verify (8) | 0.03 | Per signature |

## Rationale

Design decisions for Q-Chain:

1. **Separate Chain**: Isolation allows independent upgrades
2. **NIST Algorithms**: Industry standard, extensively analyzed
3. **Stamping Service**: Enables quantum security without modifying all chains
4. **Hybrid Mode**: Classical + PQ during transition

## Backwards Compatibility

LP-4000 supersedes LP-0082. Both old and new numbers resolve to this document.

## Test Cases

See `github.com/luxfi/node/vms/quantumvm/*_test.go`:

```go
func TestQuantumSigner(t *testing.T)
func TestParallelVerification(t *testing.T)
func TestConfigValidation(t *testing.T)
func TestQuantumStampExpiration(t *testing.T)
func TestMLKEMKeyExchange(t *testing.T)
func TestMLDSASignVerify(t *testing.T)
```

## Reference Implementation

**Repository**: `github.com/luxfi/node`
**Packages**:
- `vms/quantumvm`
- `crypto/mlkem`
- `crypto/mldsa`
- `crypto/slhdsa`

## Security Considerations

1. **Quantum Threat Model**: Assumes quantum computers capable of breaking classical crypto
2. **Side-Channel Resistance**: Implementations must resist timing attacks
3. **Key Management**: Quantum keys require larger storage
4. **Migration Security**: Hybrid mode prevents "harvest now, decrypt later"

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0082 | Q-Chain Specification | Superseded by this LP |
| LP-4100 | ML-KEM | Sub-specification |
| LP-4200 | ML-DSA | Sub-specification |
| LP-4300 | SLH-DSA | Sub-specification |
| LP-4400 | Quantum Stamping | Sub-specification |
| LP-4500 | Key Management | Sub-specification |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
