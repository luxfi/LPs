---
lp: 70
title: Key Management System
description: Defines the pluggable key storage backend architecture with distributed secrets via K-Chain
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Core
created: 2025-01-23
tags: [security, cryptography, key-management, threshold-crypto, ml-kem]
requires: 0042
order: 70
---

## Abstract

This LP defines a comprehensive key management system for the Lux Network that supports multiple storage backends, post-quantum cryptography (ML-KEM, ML-DSA), distributed secrets via K-Chain threshold cryptography, and secure session management. The system provides a unified interface for key creation, storage, signing, and lifecycle management across diverse security models.

## Motivation

Modern blockchain networks require flexible key management that can adapt to different security requirements:

1. **Diverse Security Models**: From software encryption to hardware HSMs to distributed custody
2. **Post-Quantum Readiness**: ML-KEM and ML-DSA keys for quantum-resistant operations
3. **Distributed Secrets**: Threshold cryptography for eliminating single points of failure
4. **Platform Integration**: Native integration with macOS Keychain, Linux Secret Service
5. **Remote Signing**: Support for WalletConnect and mobile wallet signing
6. **Session Security**: Time-limited key access with automatic locking

## Specification

### Backend Architecture

The key management system uses a pluggable backend architecture where each backend implements a common interface:

```go
type KeyBackend interface {
    // Identity
    Type() BackendType
    Name() string

    // Availability
    Available() bool
    RequiresPassword() bool
    RequiresHardware() bool
    SupportsRemoteSigning() bool

    // Lifecycle
    Initialize(ctx context.Context) error
    Close() error

    // Key Operations
    CreateKey(ctx context.Context, name string, opts CreateKeyOptions) (*HDKeySet, error)
    LoadKey(ctx context.Context, name, password string) (*HDKeySet, error)
    SaveKey(ctx context.Context, keySet *HDKeySet, password string) error
    DeleteKey(ctx context.Context, name string) error
    ListKeys(ctx context.Context) ([]KeyInfo, error)

    // Session Management
    Lock(ctx context.Context, name string) error
    Unlock(ctx context.Context, name, password string) error
    IsLocked(name string) bool

    // Signing
    Sign(ctx context.Context, name string, request SignRequest) (*SignResponse, error)
}
```

### Supported Backends

| Backend | Type | Platform | Security Level | Features |
|---------|------|----------|----------------|----------|
| Software | `software` | All | Medium | AES-256-GCM + Argon2id encryption |
| macOS Keychain | `keychain` | macOS | High | TouchID/FaceID biometrics |
| Linux Secret Service | `secret-service` | Linux | High | GNOME Keyring, KWallet |
| Yubikey | `yubikey` | All | Very High | PIV slot storage |
| Zymbit | `zymbit` | Raspberry Pi | Very High | Hardware security module |
| WalletConnect | `walletconnect` | All | High | Remote mobile signing |
| Environment | `env` | All | Low | Environment variables |
| K-Chain | `kchain` | Network | Very High | Distributed threshold secrets |

### K-Chain Distributed Secrets

K-Chain implements distributed key management using Shamir Secret Sharing and threshold cryptography. Keys are split across multiple validators, requiring a threshold of shares to reconstruct or sign.

#### Architecture

```
                    ┌─────────────────────┐
                    │   K-Chain Client    │
                    │   (RPC Interface)   │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ Validator 1  │   │ Validator 2  │   │ Validator 3  │
    │  Share 1/3   │   │  Share 2/3   │   │  Share 3/3   │
    │  Port 9630   │   │  Port 9631   │   │  Port 9632   │
    └──────────────┘   └──────────────┘   └──────────────┘
```

#### K-Chain RPC API

The K-Chain backend exposes a JSON-RPC 2.0 API on port 963N (default 9630).

##### Key Management Endpoints

**kchain.listKeys** - List all keys
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.listKeys",
  "params": {
    "offset": 0,
    "limit": 100,
    "algorithm": "ml-kem-768"
  },
  "id": 1
}
```

**kchain.getKeyByID** - Get key by ID
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.getKeyByID",
  "params": {
    "id": "key-uuid-here"
  },
  "id": 1
}
```

**kchain.getKeyByName** - Get key by name
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.getKeyByName",
  "params": {
    "name": "validator-1"
  },
  "id": 1
}
```

**kchain.createKey** - Create new key
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.createKey",
  "params": {
    "name": "my-key",
    "algorithm": "ml-kem-768",
    "threshold": 3,
    "total_shares": 5,
    "metadata": {
      "purpose": "signing"
    }
  },
  "id": 1
}
```

**kchain.updateKey** - Update key metadata
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.updateKey",
  "params": {
    "id": "key-uuid",
    "name": "new-name",
    "metadata": {
      "updated": true
    }
  },
  "id": 1
}
```

**kchain.deleteKey** - Delete key
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.deleteKey",
  "params": {
    "id": "key-uuid",
    "secure_wipe": true
  },
  "id": 1
}
```

##### Cryptographic Operations

**kchain.encrypt** - Encrypt data with ML-KEM
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.encrypt",
  "params": {
    "key_id": "key-uuid",
    "plaintext": "base64-encoded-data",
    "algorithm": "ml-kem-768"
  },
  "id": 1
}
```

**kchain.decrypt** - Decrypt data with threshold reconstruction
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.decrypt",
  "params": {
    "key_id": "key-uuid",
    "ciphertext": "base64-encoded-ciphertext",
    "algorithm": "ml-kem-768"
  },
  "id": 1
}
```

**kchain.sign** - Sign data
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.sign",
  "params": {
    "key_id": "key-uuid",
    "data": "base64-encoded-data",
    "algorithm": "ml-dsa-65"
  },
  "id": 1
}
```

**kchain.verify** - Verify signature
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.verify",
  "params": {
    "key_id": "key-uuid",
    "data": "base64-encoded-data",
    "signature": "base64-encoded-signature",
    "algorithm": "ml-dsa-65"
  },
  "id": 1
}
```

**kchain.getPublicKey** - Retrieve public key
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.getPublicKey",
  "params": {
    "key_id": "key-uuid",
    "format": "pem"
  },
  "id": 1
}
```

**kchain.listAlgorithms** - List supported algorithms
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.listAlgorithms",
  "params": {},
  "id": 1
}
```

##### Threshold Operations

**kchain.distributeKey** - Distribute key using Shamir Secret Sharing
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.distributeKey",
  "params": {
    "key_id": "key-uuid",
    "threshold": 3,
    "total_shares": 5,
    "validators": [
      "validator-1.kchain.lux.network:9630",
      "validator-2.kchain.lux.network:9631",
      "validator-3.kchain.lux.network:9632",
      "validator-4.kchain.lux.network:9633",
      "validator-5.kchain.lux.network:9634"
    ]
  },
  "id": 1
}
```

**kchain.gatherShares** - Gather threshold shares for reconstruction
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.gatherShares",
  "params": {
    "key_id": "key-uuid",
    "validators": ["validator-1:9630", "validator-2:9631", "validator-3:9632"]
  },
  "id": 1
}
```

**kchain.thresholdSign** - Threshold signature without reconstruction
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.thresholdSign",
  "params": {
    "key_id": "key-uuid",
    "data": "base64-encoded-data",
    "algorithm": "bls-threshold"
  },
  "id": 1
}
```

**kchain.reshareKey** - Proactive secret resharing
```json
{
  "jsonrpc": "2.0",
  "method": "kchain.reshareKey",
  "params": {
    "key_id": "key-uuid",
    "new_threshold": 4,
    "new_total": 7,
    "new_validators": ["..."]
  },
  "id": 1
}
```

### Supported Cryptographic Algorithms

| Algorithm | Type | Security Level | Use Case |
|-----------|------|----------------|----------|
| `secp256k1` | ECDSA | Classical | Ethereum compatibility |
| `bls12-381` | BLS | Classical | Consensus signatures |
| `ml-kem-768` | KEM | Post-Quantum (NIST-3) | Key encapsulation |
| `ml-dsa-65` | Signature | Post-Quantum (NIST-3) | Digital signatures |
| `bls-threshold` | Threshold | Classical | Distributed signing |

### Key Set Structure

Keys are organized in sets derived from a single BIP39 mnemonic:

```
~/.lux/keys/<name>/
├── mnemonic.enc      # Encrypted mnemonic (AES-256-GCM)
├── ec/               # secp256k1 keys
│   ├── private.pem
│   └── public.pem
├── bls/              # BLS12-381 keys
│   ├── private.bin
│   └── public.bin
├── mlkem/            # ML-KEM-768 keys
│   ├── private.bin
│   └── public.bin
├── mldsa/            # ML-DSA-65 keys
│   ├── private.bin
│   └── public.bin
└── metadata.json     # Key metadata
```

### Session Management

Keys can be locked/unlocked with time-limited sessions:

```go
// Default session timeout
const SessionTimeout = 15 * time.Minute

// Lock a key (clear from memory)
func LockKey(name string) error

// Unlock with password (starts session)
func UnlockKey(name, password string) error

// Check if locked
func IsKeyLocked(name string) bool

// Lock all keys (security event)
func LockAllKeys()
```

### Security Considerations

#### Software Backend Security

- **Key Derivation**: Argon2id with time=3, memory=64MB, parallelism=4
- **Encryption**: AES-256-GCM with random 12-byte nonces
- **Storage**: Keys stored with 0600 permissions
- **Memory**: Keys zeroed on lock/close using `crypto/subtle.ConstantTimeCompare`

#### K-Chain Security

- **Threshold**: Default 3-of-5 for distributed keys
- **Transport**: TLS 1.3 for validator communication
- **Authentication**: mTLS with validator certificates
- **Proactive Resharing**: Periodic share rotation to limit exposure

#### WalletConnect Security

- **Session Expiry**: 7-day default, configurable
- **Key Derivation**: X25519 ECDH for session keys
- **Message Encryption**: ChaCha20-Poly1305

### CLI Commands

```bash
# Key Management
lux key create <name>              # Create new key set
lux key list                        # List all key sets
lux key show <name>                 # Show key details
lux key delete <name>               # Delete key set
lux key export <name>               # Export mnemonic
lux key import <name>               # Import from mnemonic

# Session Management
lux key lock [name]                 # Lock key(s)
lux key unlock <name>               # Unlock key

# Backend Management
lux key backend list                # List backends
lux key backend set <type>          # Set default
lux key backend info                # Show current

# K-Chain Operations
lux key kchain distribute <name>    # Distribute to validators
lux key kchain gather <name>        # Gather shares
lux key kchain sign <name> <data>   # Threshold sign
lux key kchain reshare <name>       # Rotate shares
lux key kchain status               # Show K-Chain status
```

## Rationale

### Why Pluggable Backends?

Different users have different security requirements:
- Developers may prefer simple software encryption
- Enterprises require HSM integration
- Mobile users need WalletConnect
- High-security deployments use distributed K-Chain

### Why K-Chain?

Single-point-of-failure key storage is the primary attack vector in blockchain systems. K-Chain eliminates this by:
1. Distributing shares across multiple validators
2. Requiring threshold reconstruction
3. Supporting threshold signing without reconstruction
4. Enabling proactive resharing

### Why ML-KEM and ML-DSA?

NIST has standardized post-quantum algorithms. Early adoption ensures:
1. Future-proof key material
2. Hybrid classical/post-quantum signatures
3. Compliance with emerging standards

### Why Port 963N?

The 963N port range (9630-9639) is reserved for K-Chain services to avoid conflicts with other Lux services and clearly identify K-Chain traffic.

## Backwards Compatibility

This LP introduces new key management capabilities without breaking existing functionality:
- Existing keys continue to work with software backend
- Legacy key formats are automatically migrated
- CLI commands maintain backwards compatibility

## Reference Implementation

- K-Chain Backend: `github.com/luxfi/cli/pkg/key/backend_kchain.go`
- K-Chain RPC Client: `github.com/luxfi/cli/pkg/key/kchain_rpc.go`
- Software Backend: `github.com/luxfi/cli/pkg/key/backend_software.go`
- Backend Interface: `github.com/luxfi/cli/pkg/key/backend.go`

## Security Considerations

1. **Key Material Protection**: All key material must be zeroed from memory when locked
2. **Password Security**: Passwords must never be logged or stored in plaintext
3. **Session Timeout**: Sessions must automatically expire after inactivity
4. **Share Distribution**: Shares must be transmitted over encrypted channels
5. **Validator Trust**: K-Chain assumes honest majority among validators

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
