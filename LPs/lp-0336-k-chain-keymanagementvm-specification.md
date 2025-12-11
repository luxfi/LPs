---
lp: 0336
title: K-Chain (KeyManagementVM) Specification
description: Defines the K-Chain as Lux Network's dedicated key management chain for post-quantum secure key encapsulation, encrypted data storage, and threshold secret management
author: Lux Protocol Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-11
requires: 103, 104, 330, 332, 334
activation:
  flag: lp336-k-chain
  hfName: "KeyVault"
  activationHeight: "0"
tags: [mpc, vm, security]
---

> **See also**: [LP-103](./lp-0103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing.md), [LP-104](./lp-0104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa.md), [LP-330](./lp-0330-t-chain-thresholdvm-specification.md), [LP-332](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md), [LP-334](./lp-0334-per-asset-threshold-key-management.md), [LP-INDEX](./LP-INDEX.md)

## Abstract

This LP specifies the K-Chain (Key Management Chain), Lux Network's dedicated blockchain for cryptographic key management services.

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC 2119] [RFC 8174] when, and only when, they appear in all capitals, as shown here.

### Terminology

| Term | Definition |
|------|------------|
| KEK | Key Encryption Key - ML-KEM encapsulation key used to protect DEKs |
| DEK | Data Encryption Key - Symmetric key used for bulk data encryption |
| KEM | Key Encapsulation Mechanism - Asymmetric primitive for key transport |
| ML-KEM | Module-Lattice Key Encapsulation Mechanism (FIPS 203) |
| AEAD | Authenticated Encryption with Associated Data |
| HSM | Hardware Security Module |
| PKCS#11 | Public-Key Cryptography Standards #11 (Cryptoki) |
| t-of-n | Threshold scheme requiring t participants from n total |

K-Chain implements the KeyManagementVM, a purpose-built virtual machine that provides:

1. **ML-KEM Key Encapsulation** - NIST FIPS 203 compliant post-quantum key encapsulation mechanism based on Module-Lattice cryptography (derived from CRYSTALS-Kyber)
2. **Encrypted Secret Storage** - On-chain storage for encrypted secrets with envelope encryption (DEK/KEK model)
3. **T-Chain Integration** - Threshold decryption via Linear Secret Sharing for distributed key custody
4. **Policy-Based Access Control** - Fine-grained authorization for secret access with time-locks and multi-party approval

K-Chain serves as the quantum-resistant key management layer for the Lux Network, providing HSM-like functionality on-chain for bridge message encryption, private smart contract state, credential storage, and enterprise key management.

## Activation

| Parameter          | Value                    |
|--------------------|--------------------------|
| Flag string        | `lp336-k-chain`          |
| Default in code    | **false** until block 0  |
| Deployment branch  | `v1.0.0-lp336`           |
| Roll-out criteria  | Genesis activation       |
| Back-off plan      | Disable via config flag  |

## Motivation

### Problem Statement

Current blockchain key management solutions face several fundamental challenges:

1. **Quantum Vulnerability**: Classical key exchange (ECDH, RSA) will be broken by cryptographically-relevant quantum computers. Long-term secrets encrypted today can be harvested and decrypted later ("harvest now, decrypt later" attacks).

2. **Centralized KMS Dependencies**: dApps requiring encryption typically rely on centralized cloud KMS providers (AWS KMS, Azure Key Vault), introducing single points of failure and trust assumptions.

3. **No Native Secret Management**: Blockchain state is public by design. Applications requiring encrypted state must implement custom off-chain solutions without standard primitives.

4. **Bridge Message Security**: Cross-chain bridges transmit sensitive payloads that should be encrypted in transit and at rest, but lack a standard encryption infrastructure.

5. **Credential Storage**: Decentralized identity systems (DIDs, Verifiable Credentials) need secure storage for private credentials without relying on centralized vaults.

### Solution: Dedicated Key Management Chain

K-Chain addresses these challenges by providing a specialized blockchain for cryptographic operations:

1. **Post-Quantum Security**: ML-KEM (FIPS 203) provides lattice-based key encapsulation resistant to both classical and quantum attacks
2. **Decentralized HSM**: On-chain key management with threshold access control eliminates single points of failure
3. **Native Encryption Primitives**: Standard API for key generation, encapsulation, and data encryption
4. **T-Chain Integration**: Threshold decryption ensures no single party can access secrets
5. **Hybrid Security**: Combined ML-KEM + ECDH provides defense-in-depth during quantum transition

### Use Cases

- **Encrypted Bridge Messages**: End-to-end encryption for cross-chain payloads via B-Chain
- **Private Smart Contract State**: Encrypted state variables for DeFi, gaming, and enterprise contracts
- **Secure Credential Storage**: DID/Verifiable Credential encryption with selective disclosure
- **Enterprise Key Management**: HSM-equivalent functionality for institutional custody
- **Post-Quantum Security**: Future-proof encryption for long-term secrets (medical records, legal documents)
- **IPFS Encrypted Storage**: Encrypted file storage with decentralized key management

## Specification

### Chain Architecture

K-Chain is a specialized Lux subnet running the KeyManagementVM:

```
+-------------------------------------------------------------------------+
|                        K-Chain Architecture                             |
+-------------------------------------------------------------------------+
|                                                                         |
|  +-----------------+  +------------------+  +------------------+        |
|  |    ML-KEM       |  |    Secret        |  |    Access        |        |
|  |    Engine       |  |    Store         |  |    Control       |        |
|  |                 |  |                  |  |                  |        |
|  | - KeyGen        |  | - Encrypted      |  | - Policies       |        |
|  | - Encapsulate   |  |   Storage        |  | - AuthZ          |        |
|  | - Decapsulate   |  | - Versioning     |  | - Audit          |        |
|  | - Hybrid Mode   |  | - Rotation       |  | - Time-locks     |        |
|  +-----------------+  +------------------+  +------------------+        |
|          |                    |                    |                    |
|          +--------------------+--------------------+                    |
|                               |                                         |
|                    +----------v-----------+                             |
|                    |    T-Chain Bridge    |                             |
|                    |                      |                             |
|                    | - Threshold Decrypt  |                             |
|                    | - LSS Integration    |                             |
|                    | - Multi-Party Auth   |                             |
|                    +----------------------+                             |
|                                                                         |
+-------------------------------------------------------------------------+
```

### Core Components

#### 1. KeyManagementVM State

```go
// KMSState represents the complete K-Chain state
type KMSState struct {
    // Key Registry
    EncapsulationKeys map[KeyID]*EncapsulationKey  // ML-KEM public keys
    EncryptionKeys    map[KeyID]*EncryptionKey     // Symmetric DEKs (encrypted)
    KeysByOwner       map[Address][]KeyID          // Keys indexed by owner

    // Secret Store
    Secrets           map[SecretID]*EncryptedSecret // Stored secrets
    SecretsByOwner    map[Address][]SecretID        // Secrets indexed by owner
    SecretVersions    map[SecretID][]uint64         // Version history

    // Access Control
    Policies          map[SecretID]*AccessPolicy    // Access policies
    Authorizations    map[AuthID]*Authorization     // Active authorizations
    AuditLog          []AuditEntry                  // Immutable audit trail

    // T-Chain Integration
    ThresholdKeys     map[KeyID]*ThresholdKeyRef    // References to T-Chain keys
    PendingDecrypts   map[RequestID]*DecryptRequest // Pending threshold decryptions

    // Protocol State
    CurrentEpoch      uint64                        // Current epoch
    LastKeyRotation   map[KeyID]uint64              // Last rotation per key
}
```

#### 2. ML-KEM Key Types

K-Chain uses the `github.com/luxfi/crypto/mlkem` package which wraps FIPS 203 compliant implementations:

```go
import (
    "github.com/luxfi/crypto/mlkem"
    "github.com/luxfi/ids"
    "golang.org/x/crypto/curve25519"
)

// EncapsulationKey represents an ML-KEM key pair stored on K-Chain
type EncapsulationKey struct {
    KeyID           ids.ID                // Unique 32-byte identifier
    Algorithm       mlkem.Mode            // MLKEM512, MLKEM768, MLKEM1024
    PublicKey       []byte                // ML-KEM public key (encapsulation key)
    EncryptedSK     []byte                // Private key encrypted with owner's derived key

    // Metadata
    Owner           ids.ShortID           // Key owner address
    CreatedAt       uint64                // Block height
    ExpiresAt       uint64                // Optional expiration (0 = never)
    Purpose         string                // Human-readable purpose

    // Hybrid Mode (ML-KEM + X25519)
    HybridEnabled   bool                  // Combined ML-KEM + X25519
    X25519PublicKey [32]byte              // X25519 public key for hybrid mode

    // Status
    Status          KeyStatus             // Active, Suspended, Revoked
    UsageCount      uint64                // Number of encapsulations
}

// KeyStatus represents the lifecycle state of a key
type KeyStatus uint8

const (
    KeyStatusActive    KeyStatus = 0x00
    KeyStatusSuspended KeyStatus = 0x01
    KeyStatusRevoked   KeyStatus = 0x02
    KeyStatusExpired   KeyStatus = 0x03
)

// ML-KEM modes map directly to github.com/luxfi/crypto/mlkem.Mode
// which provides FIPS 203 compliant implementations via cloudflare/circl
const (
    MLKEM512  = mlkem.MLKEM512   // NIST Level 1 (128-bit classical security)
    MLKEM768  = mlkem.MLKEM768   // NIST Level 3 (192-bit classical security)
    MLKEM1024 = mlkem.MLKEM1024  // NIST Level 5 (256-bit classical security)
)

// MLKEMParameters defines algorithm-specific parameters per FIPS 203
// These sizes come directly from github.com/luxfi/crypto/mlkem constants
var MLKEMParameters = map[mlkem.Mode]struct {
    Name              string
    SecurityLevel     int    // NIST security level
    PublicKeySize     int    // Encapsulation key size (bytes)
    SecretKeySize     int    // Decapsulation key size (bytes)
    CiphertextSize    int    // Encapsulated key size (bytes)
    SharedSecretSize  int    // Always 256 bits (32 bytes) per FIPS 203
}{
    mlkem.MLKEM512:  {"ML-KEM-512",  1, mlkem.MLKEM512PublicKeySize,  mlkem.MLKEM512PrivateKeySize,  mlkem.MLKEM512CiphertextSize,  32},
    mlkem.MLKEM768:  {"ML-KEM-768",  3, mlkem.MLKEM768PublicKeySize,  mlkem.MLKEM768PrivateKeySize,  mlkem.MLKEM768CiphertextSize,  32},
    mlkem.MLKEM1024: {"ML-KEM-1024", 5, mlkem.MLKEM1024PublicKeySize, mlkem.MLKEM1024PrivateKeySize, mlkem.MLKEM1024CiphertextSize, 32},
}

// Concrete parameter values per FIPS 203 (github.com/luxfi/crypto/mlkem exports these)
// | Parameter Set | Public Key | Private Key | Ciphertext | Shared Secret |
// |---------------|------------|-------------|------------|---------------|
// | ML-KEM-512    | 800 bytes  | 1632 bytes  | 768 bytes  | 32 bytes      |
// | ML-KEM-768    | 1184 bytes | 2400 bytes  | 1088 bytes | 32 bytes      |
// | ML-KEM-1024   | 1568 bytes | 3168 bytes  | 1568 bytes | 32 bytes      |
```

#### 3. Encryption Key Structure

```go
import (
    "github.com/luxfi/crypto/aead"
    "github.com/luxfi/ids"
)

// EncryptionKey represents a symmetric data encryption key (DEK)
type EncryptionKey struct {
    KeyID           ids.ID                // Unique 32-byte identifier
    Algorithm       aead.Algorithm        // AES-256-GCM, ChaCha20-Poly1305
    EncryptedDEK    []byte                // DEK encrypted with KEK (ML-KEM derived)
    KEKReference    ids.ID                // Reference to ML-KEM KEK

    // Metadata
    Owner           ids.ShortID           // Key owner address
    CreatedAt       uint64                // Block height at creation
    RotatedAt       uint64                // Block height of last rotation
    Version         uint32                // Key version (incremented on rotation)

    // T-Chain Binding (optional) - see LP-330 for ThresholdVM details
    ThresholdBound  bool                  // Requires T-Chain threshold for access
    TChainKeyID     ids.ID                // T-Chain key reference (ThresholdVM KeyID)
    Threshold       uint32                // Required threshold for decryption (t-of-n)

    // Status
    Status          KeyStatus
    EncryptionCount uint64                // Number of encryptions performed
}

// SymmetricAlgorithm defines supported symmetric ciphers from github.com/luxfi/crypto/aead
type SymmetricAlgorithm uint8

const (
    AES256GCM        SymmetricAlgorithm = 0x01  // AES-256 in GCM mode (NIST standard)
    CHACHA20POLY1305 SymmetricAlgorithm = 0x02  // ChaCha20-Poly1305 (RFC 8439)
    AES256GCM_SIV    SymmetricAlgorithm = 0x03  // AES-256-GCM-SIV (nonce-misuse resistant, RFC 8452)
)

// SymmetricKeyParams defines parameters for each cipher
var SymmetricKeyParams = map[SymmetricAlgorithm]struct {
    KeySize   int // Key size in bytes
    NonceSize int // Nonce/IV size in bytes
    TagSize   int // Authentication tag size in bytes
}{
    AES256GCM:        {32, 12, 16},  // 256-bit key, 96-bit nonce, 128-bit tag
    CHACHA20POLY1305: {32, 12, 16},  // 256-bit key, 96-bit nonce, 128-bit tag
    AES256GCM_SIV:    {32, 12, 16},  // 256-bit key, 96-bit nonce, 128-bit tag
}
```

#### 4. Secret Storage Structure

```go
// EncryptedSecret represents an encrypted secret stored on-chain
type EncryptedSecret struct {
    SecretID        SecretID              // Unique identifier
    Ciphertext      []byte                // Encrypted data
    Nonce           []byte                // Encryption nonce
    Tag             []byte                // Authentication tag

    // Encryption Details
    EncryptionKeyID KeyID                 // DEK used for encryption
    Algorithm       SymmetricAlgorithm    // Cipher used

    // Metadata
    Owner           Address
    CreatedAt       uint64
    UpdatedAt       uint64
    Version         uint32                // Secret version

    // Access Control
    PolicyID        PolicyID              // Access policy reference

    // Size Limits
    PlaintextHash   [32]byte              // SHA-256 of plaintext for verification
    Size            uint64                // Original plaintext size

    // Labels
    Labels          map[string]string     // User-defined metadata
}

// SecretType categorizes secrets for policy purposes
type SecretType uint8

const (
    TypeGeneric         SecretType = 0x00  // Generic secret data
    TypePrivateKey      SecretType = 0x01  // Cryptographic private key
    TypeCredential      SecretType = 0x02  // Verifiable credential
    TypeAPIKey          SecretType = 0x03  // API key or token
    TypeSeed            SecretType = 0x04  // Seed phrase or mnemonic
    TypeCertificate     SecretType = 0x05  // X.509 or similar certificate
    TypeDocument        SecretType = 0x06  // Encrypted document reference
    TypeDatabaseCred    SecretType = 0x07  // Database connection credentials
    TypeEnvVariable     SecretType = 0x08  // Environment variable
    TypeBinaryData      SecretType = 0x09  // Arbitrary binary data
    TypeSSHKey          SecretType = 0x0A  // SSH private key
    TypeTLSKey          SecretType = 0x0B  // TLS/SSL private key
    TypeOAuthToken      SecretType = 0x0C  // OAuth access/refresh token
    TypeWebhookSecret   SecretType = 0x0D  // Webhook signing secret
)
```

### Transaction Types

K-Chain defines transaction types for key management operations:

#### Transaction Type Registry

| TxID | Name              | Purpose                                      | Gas Cost  |
|:-----|:------------------|:---------------------------------------------|:----------|
| 0xK1 | KeyGenTx          | Generate new ML-KEM key pair                 | 100,000   |
| 0xK2 | EncapsulateTx     | Perform ML-KEM encapsulation                 | 50,000    |
| 0xK3 | DecapsulateTx     | Perform ML-KEM decapsulation                 | 75,000    |
| 0xK4 | EncryptTx         | Encrypt data with stored DEK                 | 25,000+   |
| 0xK5 | DecryptTx         | Decrypt data with stored DEK                 | 30,000+   |
| 0xK6 | StoreSecretTx     | Store encrypted secret on-chain              | 50,000+   |
| 0xK7 | RetrieveSecretTx  | Retrieve and decrypt secret                  | 40,000    |
| 0xK8 | RotateKeyTx       | Rotate encryption key with re-encryption     | 200,000   |
| 0xK9 | CreatePolicyTx    | Create access control policy                 | 75,000    |
| 0xKA | UpdatePolicyTx    | Update access control policy                 | 50,000    |
| 0xKB | ThresholdDecryptTx| Request threshold decryption via T-Chain     | 150,000   |
| 0xKC | HybridKeyGenTx    | Generate hybrid ML-KEM + ECDH key            | 125,000   |

#### 1. KeyGenTx - Generate ML-KEM Key Pair

```go
import (
    "crypto/rand"
    "fmt"

    "github.com/luxfi/crypto/mlkem"
    "github.com/luxfi/ids"
    "golang.org/x/crypto/curve25519"
)

// KeyGenTx generates a new ML-KEM encapsulation key pair
type KeyGenTx struct {
    BaseTx

    // Key Configuration
    KeyID           ids.ID             // Unique 32-byte identifier
    Algorithm       mlkem.Mode         // MLKEM512, MLKEM768, MLKEM1024

    // Hybrid Mode (ML-KEM + X25519)
    HybridEnabled   bool               // Enable ML-KEM + X25519 hybrid

    // Metadata
    Purpose         string             // e.g., "bridge-messages", "credential-store"
    ExpiresAt       uint64             // Optional expiration block (0 = never)

    // Owner
    Owner           ids.ShortID        // Key owner (defaults to tx sender)
}

// Verify validates the KeyGenTx before execution
func (tx *KeyGenTx) Verify(state *KMSState) error {
    // Check key doesn't exist
    if _, exists := state.EncapsulationKeys[tx.KeyID]; exists {
        return ErrKeyAlreadyExists
    }

    // Validate algorithm (must be MLKEM512, MLKEM768, or MLKEM1024)
    if _, ok := MLKEMParameters[tx.Algorithm]; !ok {
        return ErrInvalidAlgorithm
    }

    // Validate KeyID is not empty
    if tx.KeyID == ids.Empty {
        return ErrInvalidKeyID
    }

    return nil
}

// Execute generates ML-KEM key pair per FIPS 203
// Uses github.com/luxfi/crypto/mlkem which wraps cloudflare/circl
func (tx *KeyGenTx) Execute(state *KMSState) (*EncapsulationKey, error) {
    // Generate ML-KEM key pair using FIPS 203 KeyGen (via luxfi/crypto/mlkem)
    pubKey, privKey, err := mlkem.GenerateKey(tx.Algorithm)
    if err != nil {
        return nil, fmt.Errorf("ML-KEM keygen failed: %w", err)
    }

    // Encrypt secret key with owner's derived key (AES-256-GCM)
    encryptedSK, err := encryptSecretKey(privKey.Bytes(), tx.Owner)
    if err != nil {
        return nil, fmt.Errorf("secret key encryption failed: %w", err)
    }

    key := &EncapsulationKey{
        KeyID:         tx.KeyID,
        Algorithm:     tx.Algorithm,
        PublicKey:     pubKey.Bytes(),
        EncryptedSK:   encryptedSK,
        Owner:         tx.Owner,
        CreatedAt:     state.CurrentBlock,
        ExpiresAt:     tx.ExpiresAt,
        Purpose:       tx.Purpose,
        HybridEnabled: tx.HybridEnabled,
        Status:        KeyStatusActive,
    }

    // Generate X25519 key for hybrid mode
    if tx.HybridEnabled {
        var x25519Priv [32]byte
        if _, err := rand.Read(x25519Priv[:]); err != nil {
            return nil, fmt.Errorf("X25519 keygen failed: %w", err)
        }

        // Derive public key from private
        var x25519Pub [32]byte
        curve25519.ScalarBaseMult(&x25519Pub, &x25519Priv)

        key.X25519PublicKey = x25519Pub

        // Encrypt X25519 private key and append to encrypted secret key
        encX25519, err := encryptSecretKey(x25519Priv[:], tx.Owner)
        if err != nil {
            return nil, fmt.Errorf("X25519 key encryption failed: %w", err)
        }
        key.EncryptedSK = append(key.EncryptedSK, encX25519...)
    }

    state.EncapsulationKeys[tx.KeyID] = key
    state.KeysByOwner[tx.Owner] = append(state.KeysByOwner[tx.Owner], tx.KeyID)

    return key, nil
}
```

#### 2. EncapsulateTx - ML-KEM Encapsulation

```go
import (
    "fmt"

    "github.com/luxfi/crypto/mlkem"
    "github.com/luxfi/ids"
    "golang.org/x/crypto/curve25519"
    "golang.org/x/crypto/hkdf"
    "crypto/sha256"
    "io"
)

// EncapsulateTx performs ML-KEM encapsulation to establish shared secret
type EncapsulateTx struct {
    BaseTx

    // Target Key
    EncapsulationKeyID ids.ID          // ML-KEM public key to encapsulate to

    // Options
    HybridMode         bool            // Use hybrid ML-KEM + X25519
    EphemeralX25519Key [32]byte        // Sender's ephemeral X25519 public key (hybrid mode)

    // Output Handling
    StoreResult        bool            // Store ciphertext on-chain
    Callback           *EncapCallback  // Optional callback for result delivery
}

// EncapCallback defines where to deliver encapsulation result
type EncapCallback struct {
    ChainID     ids.ID                // Target chain for callback
    Address     ids.ShortID           // Contract address
    Method      [4]byte               // Method selector (4-byte function signature)
}

// EncapsulationResult contains the encapsulation output
type EncapsulationResult struct {
    Ciphertext      []byte            // ML-KEM ciphertext (encapsulated key)
    SharedSecret    []byte            // 256-bit shared secret (NEVER stored on-chain)
    X25519Ciphertext [32]byte         // X25519 ephemeral public key (hybrid mode only)
}

// Execute performs ML-KEM encapsulation per FIPS 203
// Uses github.com/luxfi/crypto/mlkem.Encapsulate
func (tx *EncapsulateTx) Execute(state *KMSState) (*EncapsulationResult, error) {
    key := state.EncapsulationKeys[tx.EncapsulationKeyID]
    if key == nil {
        return nil, ErrKeyNotFound
    }

    if key.Status != KeyStatusActive {
        return nil, ErrKeyNotActive
    }

    // Check expiration
    if key.ExpiresAt > 0 && state.CurrentBlock > key.ExpiresAt {
        return nil, ErrKeyExpired
    }

    // Restore public key from bytes (github.com/luxfi/crypto/mlkem)
    pubKey, err := mlkem.PublicKeyFromBytes(key.PublicKey, key.Algorithm)
    if err != nil {
        return nil, fmt.Errorf("invalid public key: %w", err)
    }

    // Perform ML-KEM Encapsulation per FIPS 203 Encaps()
    ciphertext, sharedSecret, err := pubKey.Encapsulate()
    if err != nil {
        return nil, fmt.Errorf("ML-KEM encapsulation failed: %w", err)
    }

    result := &EncapsulationResult{
        Ciphertext:   ciphertext,
        SharedSecret: sharedSecret,
    }

    // Hybrid mode: combine ML-KEM with X25519
    if tx.HybridMode && key.HybridEnabled {
        // Perform X25519 key exchange
        x25519Shared, err := curve25519.X25519(tx.EphemeralX25519Key[:], key.X25519PublicKey[:])
        if err != nil {
            return nil, fmt.Errorf("X25519 failed: %w", err)
        }

        // Combine shared secrets using HKDF: KDF(MLKEM_SS || X25519_SS)
        // Per IETF draft-ietf-tls-hybrid-design
        combinedInput := append(sharedSecret, x25519Shared...)
        hkdfReader := hkdf.New(sha256.New, combinedInput, nil, []byte("LUX-K-Chain-Hybrid-v1"))

        combinedSecret := make([]byte, 32)
        if _, err := io.ReadFull(hkdfReader, combinedSecret); err != nil {
            return nil, fmt.Errorf("HKDF failed: %w", err)
        }

        result.SharedSecret = combinedSecret
        result.X25519Ciphertext = tx.EphemeralX25519Key // Sender's ephemeral public
    }

    // Update usage counter
    key.UsageCount++

    // Emit event (shared secret NEVER included in event)
    emitEvent(EventEncapsulation{
        KeyID:      tx.EncapsulationKeyID,
        Ciphertext: ciphertext,
        HybridMode: tx.HybridMode,
        Block:      state.CurrentBlock,
    })

    return result, nil
}
```

#### 3. DecapsulateTx - ML-KEM Decapsulation

```go
import (
    "crypto/sha256"
    "fmt"
    "io"

    "github.com/luxfi/crypto/mlkem"
    "github.com/luxfi/ids"
    "golang.org/x/crypto/curve25519"
    "golang.org/x/crypto/hkdf"
)

// DecapsulateTx performs ML-KEM decapsulation to recover shared secret
type DecapsulateTx struct {
    BaseTx

    // Decapsulation Parameters
    KeyID           ids.ID             // ML-KEM key pair to use
    Ciphertext      []byte             // ML-KEM ciphertext to decapsulate

    // Hybrid Mode
    HybridMode      bool
    X25519Ciphertext [32]byte          // Sender's ephemeral X25519 public key (hybrid mode)

    // Authorization
    Requester       ids.ShortID        // Must be key owner or authorized

    // Purpose - what to do with recovered shared secret
    DeriveEncKey    bool               // Derive encryption key from shared secret
    NewEncKeyID     ids.ID             // ID for derived encryption key
}

// Verify validates the DecapsulateTx before execution
func (tx *DecapsulateTx) Verify(state *KMSState) error {
    key := state.EncapsulationKeys[tx.KeyID]
    if key == nil {
        return ErrKeyNotFound
    }

    // Verify authorization
    if tx.Requester != key.Owner && !IsAuthorized(state, tx.Requester, tx.KeyID) {
        return ErrUnauthorized
    }

    // Validate ciphertext size using github.com/luxfi/crypto/mlkem
    expectedSize := mlkem.GetCiphertextSize(key.Algorithm)
    if len(tx.Ciphertext) != expectedSize {
        return ErrInvalidCiphertextSize
    }

    return nil
}

// Execute performs ML-KEM decapsulation per FIPS 203
// Uses github.com/luxfi/crypto/mlkem.Decapsulate
func (tx *DecapsulateTx) Execute(state *KMSState) ([]byte, error) {
    key := state.EncapsulationKeys[tx.KeyID]

    // Decrypt the secret key (stored encrypted with owner's derived key)
    secretKeyBytes, err := decryptSecretKey(key.EncryptedSK[:mlkem.GetPrivateKeySize(key.Algorithm)], tx.Requester)
    if err != nil {
        return nil, fmt.Errorf("secret key decryption failed: %w", err)
    }

    // Restore private key from bytes
    privKey, err := mlkem.PrivateKeyFromBytes(secretKeyBytes, key.Algorithm)
    if err != nil {
        return nil, fmt.Errorf("invalid private key: %w", err)
    }

    // Perform ML-KEM Decapsulation per FIPS 203 Decaps()
    sharedSecret, err := privKey.Decapsulate(tx.Ciphertext)
    if err != nil {
        return nil, fmt.Errorf("ML-KEM decapsulation failed: %w", err)
    }

    // Hybrid mode: combine with X25519
    if tx.HybridMode && key.HybridEnabled {
        // Decrypt X25519 private key (stored after ML-KEM key in EncryptedSK)
        x25519SKOffset := mlkem.GetPrivateKeySize(key.Algorithm)
        x25519SKBytes, err := decryptSecretKey(key.EncryptedSK[x25519SKOffset:], tx.Requester)
        if err != nil {
            return nil, fmt.Errorf("X25519 key decryption failed: %w", err)
        }

        // Perform X25519 key exchange
        x25519Shared, err := curve25519.X25519(x25519SKBytes, tx.X25519Ciphertext[:])
        if err != nil {
            return nil, fmt.Errorf("X25519 computation failed: %w", err)
        }

        // Combine shared secrets using HKDF
        combinedInput := append(sharedSecret, x25519Shared...)
        hkdfReader := hkdf.New(sha256.New, combinedInput, nil, []byte("LUX-K-Chain-Hybrid-v1"))

        combinedSecret := make([]byte, 32)
        if _, err := io.ReadFull(hkdfReader, combinedSecret); err != nil {
            return nil, fmt.Errorf("HKDF failed: %w", err)
        }
        sharedSecret = combinedSecret
    }

    // Optionally derive encryption key
    if tx.DeriveEncKey {
        encKey := deriveEncryptionKey(sharedSecret, tx.NewEncKeyID, tx.Requester)
        state.EncryptionKeys[tx.NewEncKeyID] = encKey
    }

    return sharedSecret, nil
}
```

#### 4. StoreSecretTx - Store Encrypted Secret

```go
// StoreSecretTx stores an encrypted secret on-chain
type StoreSecretTx struct {
    BaseTx

    // Secret Data
    SecretID        SecretID           // Unique identifier
    Ciphertext      []byte             // Pre-encrypted data (client-side encryption)
    Nonce           []byte             // Encryption nonce
    Tag             []byte             // Authentication tag

    // Encryption Reference
    EncryptionKeyID KeyID              // DEK that encrypted this secret
    Algorithm       SymmetricAlgorithm // Cipher used

    // Metadata
    PlaintextHash   [32]byte           // Hash of plaintext for integrity
    SecretType      SecretType         // Classification
    Labels          map[string]string  // User-defined labels

    // Access Control
    PolicyID        PolicyID           // Access policy (must exist)

    // Owner
    Owner           Address
}

// Validation
func (tx *StoreSecretTx) Verify(state *KMSState) error {
    // Check secret doesn't exist
    if _, exists := state.Secrets[tx.SecretID]; exists {
        return ErrSecretAlreadyExists
    }

    // Verify encryption key exists
    if _, exists := state.EncryptionKeys[tx.EncryptionKeyID]; !exists {
        return ErrEncryptionKeyNotFound
    }

    // Verify policy exists
    if _, exists := state.Policies[tx.PolicyID]; !exists {
        return ErrPolicyNotFound
    }

    // Size limits
    if len(tx.Ciphertext) > MaxSecretSize {
        return ErrSecretTooLarge
    }

    return nil
}

// Execution stores the encrypted secret
func (tx *StoreSecretTx) Execute(state *KMSState) (*EncryptedSecret, error) {
    secret := &EncryptedSecret{
        SecretID:        tx.SecretID,
        Ciphertext:      tx.Ciphertext,
        Nonce:           tx.Nonce,
        Tag:             tx.Tag,
        EncryptionKeyID: tx.EncryptionKeyID,
        Algorithm:       tx.Algorithm,
        Owner:           tx.Owner,
        CreatedAt:       state.CurrentBlock,
        UpdatedAt:       state.CurrentBlock,
        Version:         1,
        PolicyID:        tx.PolicyID,
        PlaintextHash:   tx.PlaintextHash,
        Size:            uint64(len(tx.Ciphertext)),
        Labels:          tx.Labels,
    }

    state.Secrets[tx.SecretID] = secret
    state.SecretsByOwner[tx.Owner] = append(state.SecretsByOwner[tx.Owner], tx.SecretID)
    state.SecretVersions[tx.SecretID] = []uint64{state.CurrentBlock}

    // Audit log entry
    state.AuditLog = append(state.AuditLog, AuditEntry{
        Action:    "secret_stored",
        SecretID:  tx.SecretID,
        Actor:     tx.Owner,
        Block:     state.CurrentBlock,
        Timestamp: time.Now().Unix(),
    })

    return secret, nil
}
```

#### 5. ThresholdDecryptTx - T-Chain Integrated Decryption

This transaction initiates threshold decryption via T-Chain (ThresholdVM). The workflow integrates
with LP-330 (T-Chain ThresholdVM Specification) to provide distributed key custody without any
single party having access to the complete decryption key.

**Cross-Chain Flow:**
1. K-Chain receives `ThresholdDecryptTx`
2. K-Chain validates access policy and sends Warp message to T-Chain
3. T-Chain signers (per LP-330) provide partial decryptions
4. When threshold (t-of-n) is reached, T-Chain sends result back to K-Chain
5. K-Chain completes decryption and delivers result via callback

See [LP-330: T-Chain ThresholdVM Specification](./lp-0330-t-chain-thresholdvm-specification.md) for
details on threshold signature protocols (CGGMP21, FROST, LSS).

```go
import (
    "fmt"

    "github.com/luxfi/ids"
    "github.com/luxfi/warp"
)

// ThresholdDecryptTx requests threshold decryption via T-Chain
type ThresholdDecryptTx struct {
    BaseTx

    // Secret Reference
    SecretID        ids.ID             // Secret to decrypt

    // T-Chain Parameters (see LP-330 for threshold key management)
    TChainKeyID     ids.ID             // T-Chain threshold key (ManagedKey.KeyID from LP-330)
    RequiredShares  uint32             // Minimum shares needed (must be <= threshold)

    // Authorization
    Requester       ids.ShortID
    AuthorizationProof []byte          // Signed proof of authorization

    // Callback (where to deliver decrypted result)
    CallbackChain   ids.ID             // Target chain for callback (C-Chain, B-Chain, etc.)
    CallbackAddress ids.ShortID        // Contract/address to receive result

    // Deadline
    Deadline        uint64             // Block height deadline for threshold completion
}

// DecryptRequest tracks pending threshold decryption operations
type DecryptRequest struct {
    RequestID       ids.ID
    SecretID        ids.ID
    TChainKeyID     ids.ID
    EncryptedDEK    []byte
    RequiredShares  uint32
    Requester       ids.ShortID
    Status          RequestStatus      // Pending, InProgress, Completed, Failed, Expired
    CreatedAt       uint64
    Deadline        uint64
    CallbackChain   ids.ID
    CallbackAddr    ids.ShortID

    // T-Chain session tracking
    TChainSessionID ids.ID             // Session ID from T-Chain
    ReceivedShares  uint32             // Number of shares received so far
    DecryptedDEK    []byte             // Result (set when completed)
}

type RequestStatus uint8

const (
    RequestStatusPending    RequestStatus = 0x00
    RequestStatusInProgress RequestStatus = 0x01
    RequestStatusCompleted  RequestStatus = 0x02
    RequestStatusFailed     RequestStatus = 0x03
    RequestStatusExpired    RequestStatus = 0x04
)

// Execute initiates T-Chain threshold decryption
func (tx *ThresholdDecryptTx) Execute(state *KMSState) (*DecryptRequest, error) {
    secret := state.Secrets[tx.SecretID]
    if secret == nil {
        return nil, ErrSecretNotFound
    }

    // Verify access policy
    policy := state.Policies[secret.PolicyID]
    if err := policy.CheckAccess(tx.Requester, tx.AuthorizationProof); err != nil {
        return nil, fmt.Errorf("access denied: %w", err)
    }

    // Get encryption key
    encKey := state.EncryptionKeys[secret.EncryptionKeyID]
    if !encKey.ThresholdBound {
        return nil, ErrNotThresholdBound
    }

    // Verify T-Chain key reference matches
    if encKey.TChainKeyID != tx.TChainKeyID {
        return nil, ErrTChainKeyMismatch
    }

    // Verify required shares <= threshold
    if tx.RequiredShares > encKey.Threshold {
        return nil, ErrInvalidThreshold
    }

    // Create T-Chain decryption request
    requestID := ids.GenerateID() // Generate unique request ID
    request := &DecryptRequest{
        RequestID:      requestID,
        SecretID:       tx.SecretID,
        TChainKeyID:    tx.TChainKeyID,
        EncryptedDEK:   encKey.EncryptedDEK,
        RequiredShares: tx.RequiredShares,
        Requester:      tx.Requester,
        Status:         RequestStatusPending,
        CreatedAt:      state.CurrentBlock,
        Deadline:       tx.Deadline,
        CallbackChain:  tx.CallbackChain,
        CallbackAddr:   tx.CallbackAddress,
    }

    state.PendingDecrypts[requestID] = request

    // Create Warp message to T-Chain (see LP-330 section on cross-chain messaging)
    // The payload follows the ThresholdVM SignRequest format from LP-330
    warpPayload := ThresholdDecryptPayload{
        RequestID:      requestID,
        KeyID:          tx.TChainKeyID,
        Ciphertext:     encKey.EncryptedDEK,
        RequiredShares: tx.RequiredShares,
        Deadline:       tx.Deadline,
        CallbackChain:  KChainID,         // K-Chain for result delivery
    }

    warpMsg, err := warp.NewMessage(
        TChainID,                          // Destination: T-Chain
        KChainID,                          // Source: K-Chain
        warpPayload.Bytes(),
    )
    if err != nil {
        return nil, fmt.Errorf("warp message creation failed: %w", err)
    }

    // Emit Warp message for T-Chain validators to process
    emitWarpMessage(warpMsg)

    return request, nil
}

// ThresholdDecryptPayload is the Warp message payload sent to T-Chain
type ThresholdDecryptPayload struct {
    RequestID      ids.ID   `json:"requestId"`
    KeyID          ids.ID   `json:"keyId"`          // T-Chain ManagedKey.KeyID
    Ciphertext     []byte   `json:"ciphertext"`     // Encrypted DEK to decrypt
    RequiredShares uint32   `json:"requiredShares"` // t in t-of-n
    Deadline       uint64   `json:"deadline"`       // Block height
    CallbackChain  ids.ID   `json:"callbackChain"`  // Where to send result
}

func (p *ThresholdDecryptPayload) Bytes() []byte {
    // Serialize payload for Warp message
    // Implementation uses luxfi/codec
    return nil
}

// HandleTChainResponse processes threshold decryption result from T-Chain
func HandleTChainResponse(state *KMSState, response *TChainDecryptResponse) error {
    request := state.PendingDecrypts[response.RequestID]
    if request == nil {
        return ErrRequestNotFound
    }

    // Check if already completed or expired
    if request.Status != RequestStatusPending && request.Status != RequestStatusInProgress {
        return ErrRequestAlreadyProcessed
    }

    // Check deadline
    if state.CurrentBlock > request.Deadline {
        request.Status = RequestStatusExpired
        return ErrRequestExpired
    }

    if response.Success {
        request.Status = RequestStatusCompleted
        request.DecryptedDEK = response.DecryptedData

        // Deliver result via callback if specified
        if request.CallbackChain != ids.Empty {
            deliverCallback(request)
        }
    } else {
        request.Status = RequestStatusFailed
    }

    return nil
}

// TChainDecryptResponse is received from T-Chain after threshold decryption
type TChainDecryptResponse struct {
    RequestID      ids.ID `json:"requestId"`
    Success        bool   `json:"success"`
    DecryptedData  []byte `json:"decryptedData,omitempty"` // Decrypted DEK
    ErrorMessage   string `json:"error,omitempty"`
    SignerCount    uint32 `json:"signerCount"`             // How many signers participated
}
```

#### T-Chain Integration Architecture

```
+------------------+                    +------------------+
|    K-Chain       |                    |    T-Chain       |
|  KeyManagementVM |                    |   ThresholdVM    |
+------------------+                    +------------------+
        |                                       |
        | 1. ThresholdDecryptTx                 |
        |                                       |
        | 2. Create DecryptRequest              |
        |                                       |
        | 3. Emit Warp Message  --------------> |
        |                                       |
        |                    4. Validate Request|
        |                                       |
        |                    5. Threshold Sign  |
        |                       (t-of-n shares) |
        |                                       |
        | <------------- 6. Warp Response       |
        |                                       |
        | 7. Handle Response                    |
        |    - Update request status            |
        |    - Store decrypted DEK              |
        |    - Deliver callback                 |
        |                                       |
+------------------+                    +------------------+
```

For detailed T-Chain signer operations, see [LP-330](./lp-0330-t-chain-thresholdvm-specification.md).

#### Threshold Decryption Protocol Specification

The threshold decryption protocol enables distributed decryption where no single party can
decrypt without cooperation from other threshold participants. This section specifies the
complete protocol flow between K-Chain and T-Chain.

**Protocol Phases:**

1. **Request Phase** (K-Chain): Client submits `ThresholdDecryptTx`
2. **Validation Phase** (K-Chain): Verify access policy and create request
3. **Distribution Phase** (Warp): Send encrypted DEK to T-Chain
4. **Collection Phase** (T-Chain): Collect partial decryptions from t-of-n signers
5. **Combination Phase** (T-Chain): Combine shares to recover plaintext
6. **Delivery Phase** (Warp): Return decrypted DEK to K-Chain
7. **Completion Phase** (K-Chain): Deliver result via callback

```go
import (
    "github.com/luxfi/crypto/threshold"
    "github.com/luxfi/ids"
    "github.com/luxfi/warp"
)

// ThresholdDecryptionProtocol implements the full protocol state machine
type ThresholdDecryptionProtocol struct {
    RequestID       ids.ID
    Phase           ProtocolPhase
    StartBlock      uint64
    Deadline        uint64

    // K-Chain State
    SecretID        ids.ID
    EncryptedDEK    []byte
    AccessPolicy    *AccessPolicy

    // T-Chain State
    TChainKeyID     ids.ID
    Threshold       uint32            // t in t-of-n
    TotalSigners    uint32            // n in t-of-n
    CollectedShares []PartialDecryption
    CombinedResult  []byte

    // Delivery
    CallbackChain   ids.ID
    CallbackAddress ids.ShortID
}

type ProtocolPhase uint8

const (
    PhaseRequest     ProtocolPhase = 0x01
    PhaseValidation  ProtocolPhase = 0x02
    PhaseDistribution ProtocolPhase = 0x03
    PhaseCollection  ProtocolPhase = 0x04
    PhaseCombination ProtocolPhase = 0x05
    PhaseDelivery    ProtocolPhase = 0x06
    PhaseCompleted   ProtocolPhase = 0x07
    PhaseFailed      ProtocolPhase = 0x08
)

// PartialDecryption represents one signer's contribution
type PartialDecryption struct {
    SignerID        ids.ShortID       // Signer's identifier
    SignerIndex     uint32            // Signer's index in the threshold scheme
    PartialResult   []byte            // Partial decryption value
    Proof           []byte            // Zero-knowledge proof of correct decryption
    Signature       []byte            // Signer's signature on the partial result
    ReceivedAt      uint64            // Block height when received
}

// ThresholdDecryptRequest is the Warp message sent to T-Chain
type ThresholdDecryptRequest struct {
    // Request Identification
    RequestID       ids.ID            `json:"requestId"`
    SourceChain     ids.ID            `json:"sourceChain"`     // K-Chain ID

    // Decryption Target
    TChainKeyID     ids.ID            `json:"tChainKeyId"`     // ThresholdVM managed key
    Ciphertext      []byte            `json:"ciphertext"`      // Encrypted DEK

    // Threshold Parameters
    RequiredShares  uint32            `json:"requiredShares"`  // Minimum t for decryption
    Deadline        uint64            `json:"deadline"`        // Block height deadline

    // Callback Configuration
    CallbackChain   ids.ID            `json:"callbackChain"`
    CallbackAddress ids.ShortID       `json:"callbackAddress"`

    // Authentication
    RequesterProof  []byte            `json:"requesterProof"`  // Proof of authorization
}

// ThresholdDecryptResponse is the Warp message sent back to K-Chain
type ThresholdDecryptResponse struct {
    // Request Identification
    RequestID       ids.ID            `json:"requestId"`
    SourceChain     ids.ID            `json:"sourceChain"`     // T-Chain ID

    // Result
    Success         bool              `json:"success"`
    DecryptedData   []byte            `json:"decryptedData,omitempty"`
    ErrorCode       ErrorCode         `json:"errorCode,omitempty"`
    ErrorMessage    string            `json:"errorMessage,omitempty"`

    // Attestation
    SignerCount     uint32            `json:"signerCount"`     // Participating signers
    SignerIDs       []ids.ShortID     `json:"signerIds"`       // List of signers
    AggregateProof  []byte            `json:"aggregateProof"`  // Combined ZK proof

    // Timing
    ProcessedAt     uint64            `json:"processedAt"`     // T-Chain block height
}

type ErrorCode uint16

const (
    ErrCodeNone              ErrorCode = 0
    ErrCodeKeyNotFound       ErrorCode = 1001
    ErrCodeInsufficientSigners ErrorCode = 1002
    ErrCodeDeadlineExceeded  ErrorCode = 1003
    ErrCodeInvalidCiphertext ErrorCode = 1004
    ErrCodeUnauthorized      ErrorCode = 1005
    ErrCodeInternalError     ErrorCode = 1006
)

// ExecuteThresholdDecryption runs the complete protocol
func ExecuteThresholdDecryption(
    kChainState *KMSState,
    request *ThresholdDecryptTx,
) (*ThresholdDecryptionProtocol, error) {
    protocol := &ThresholdDecryptionProtocol{
        RequestID:  ids.GenerateID(),
        Phase:      PhaseRequest,
        StartBlock: kChainState.CurrentBlock,
        Deadline:   request.Deadline,
    }

    // Phase 1: Request - Validate input parameters
    if err := validateThresholdRequest(kChainState, request); err != nil {
        protocol.Phase = PhaseFailed
        return protocol, err
    }

    // Phase 2: Validation - Check access policy
    protocol.Phase = PhaseValidation
    secret := kChainState.Secrets[request.SecretID]
    policy := kChainState.Policies[secret.PolicyID]

    if err := policy.CheckAccess(request.Requester, request.AuthorizationProof); err != nil {
        protocol.Phase = PhaseFailed
        return protocol, fmt.Errorf("access policy check failed: %w", err)
    }

    // Get encrypted DEK
    encKey := kChainState.EncryptionKeys[secret.EncryptionKeyID]
    protocol.SecretID = request.SecretID
    protocol.EncryptedDEK = encKey.EncryptedDEK
    protocol.TChainKeyID = request.TChainKeyID
    protocol.Threshold = request.RequiredShares
    protocol.CallbackChain = request.CallbackChain
    protocol.CallbackAddress = request.CallbackAddress

    // Phase 3: Distribution - Create and send Warp message to T-Chain
    protocol.Phase = PhaseDistribution
    warpRequest := &ThresholdDecryptRequest{
        RequestID:       protocol.RequestID,
        SourceChain:     KChainID,
        TChainKeyID:     request.TChainKeyID,
        Ciphertext:      encKey.EncryptedDEK,
        RequiredShares:  request.RequiredShares,
        Deadline:        request.Deadline,
        CallbackChain:   request.CallbackChain,
        CallbackAddress: request.CallbackAddress,
        RequesterProof:  request.AuthorizationProof,
    }

    warpMsg, err := warp.NewUnsignedMessage(
        KChainNetworkID,
        KChainID,
        warpRequest.Bytes(),
    )
    if err != nil {
        protocol.Phase = PhaseFailed
        return protocol, fmt.Errorf("warp message creation failed: %w", err)
    }

    // Emit Warp message for validators
    emitWarpMessage(warpMsg)

    // Store pending request
    kChainState.PendingDecrypts[protocol.RequestID] = &DecryptRequest{
        RequestID:       protocol.RequestID,
        SecretID:        request.SecretID,
        TChainKeyID:     request.TChainKeyID,
        EncryptedDEK:    encKey.EncryptedDEK,
        RequiredShares:  request.RequiredShares,
        Requester:       request.Requester,
        Status:          RequestStatusPending,
        CreatedAt:       kChainState.CurrentBlock,
        Deadline:        request.Deadline,
        CallbackChain:   request.CallbackChain,
        CallbackAddr:    request.CallbackAddress,
    }

    return protocol, nil
}

// HandleThresholdResponse processes the response from T-Chain
func HandleThresholdResponse(
    kChainState *KMSState,
    response *ThresholdDecryptResponse,
    warpProof *warp.Message,
) error {
    // Verify Warp message signature
    if err := warp.VerifyMessage(warpProof, TChainNetworkID); err != nil {
        return fmt.Errorf("warp verification failed: %w", err)
    }

    // Get pending request
    request := kChainState.PendingDecrypts[response.RequestID]
    if request == nil {
        return ErrRequestNotFound
    }

    // Check deadline
    if kChainState.CurrentBlock > request.Deadline {
        request.Status = RequestStatusExpired
        return ErrRequestExpired
    }

    if response.Success {
        // Phase 6/7: Delivery and Completion
        request.Status = RequestStatusCompleted
        request.DecryptedDEK = response.DecryptedData
        request.TChainSessionID = response.RequestID

        // Deliver callback if configured
        if request.CallbackChain != ids.Empty {
            callback := &DecryptionCallback{
                RequestID:    response.RequestID,
                SecretID:     request.SecretID,
                DecryptedDEK: response.DecryptedData,
                SignerCount:  response.SignerCount,
                Proof:        response.AggregateProof,
            }

            if err := deliverCallback(request.CallbackChain, request.CallbackAddr, callback); err != nil {
                // Log error but don't fail - decryption succeeded
                logCallbackError(request.RequestID, err)
            }
        }

        // Audit log
        kChainState.AuditLog = append(kChainState.AuditLog, AuditEntry{
            Action:    "threshold_decrypt_completed",
            SecretID:  request.SecretID,
            Actor:     request.Requester,
            Block:     kChainState.CurrentBlock,
            Metadata: map[string]interface{}{
                "requestId":   response.RequestID,
                "signerCount": response.SignerCount,
            },
        })
    } else {
        request.Status = RequestStatusFailed

        // Audit log for failure
        kChainState.AuditLog = append(kChainState.AuditLog, AuditEntry{
            Action:    "threshold_decrypt_failed",
            SecretID:  request.SecretID,
            Actor:     request.Requester,
            Block:     kChainState.CurrentBlock,
            Metadata: map[string]interface{}{
                "requestId": response.RequestID,
                "errorCode": response.ErrorCode,
                "error":     response.ErrorMessage,
            },
        })
    }

    return nil
}

// DecryptionCallback is sent to the callback address
type DecryptionCallback struct {
    RequestID    ids.ID         `json:"requestId"`
    SecretID     ids.ID         `json:"secretId"`
    DecryptedDEK []byte         `json:"decryptedDek"`
    SignerCount  uint32         `json:"signerCount"`
    Proof        []byte         `json:"proof"`
}
```

#### Security Properties of Threshold Decryption

| Property | Guarantee | Implementation |
|----------|-----------|----------------|
| **Confidentiality** | No single party learns DEK | t-of-n threshold scheme |
| **Availability** | Decryption succeeds with t signers | Redundant signer set (n > t) |
| **Verifiability** | Partial decryptions are verifiable | Zero-knowledge proofs |
| **Non-repudiation** | Signers cannot deny participation | Signed partial results |
| **Accountability** | All participants are logged | Immutable audit trail |

### Access Control System

#### Policy Structure

```go
// AccessPolicy defines access control for secrets
type AccessPolicy struct {
    PolicyID        PolicyID              // Unique identifier
    Owner           Address               // Policy owner

    // Access Rules
    AllowList       []Address             // Addresses with read access
    DenyList        []Address             // Explicitly denied addresses

    // Conditions
    TimeConstraints *TimeConstraints      // Time-based restrictions
    MultiPartyAuth  *MultiPartyAuth       // Multi-signature requirements
    AttributeRules  []AttributeRule       // Attribute-based access

    // Revocation
    Revocable       bool                  // Can access be revoked
    RevocationList  []Address             // Revoked addresses

    // Audit
    AuditEnabled    bool                  // Log all access attempts
}

// TimeConstraints defines time-based access control
type TimeConstraints struct {
    NotBefore       uint64                // Unix timestamp - access not valid before
    NotAfter        uint64                // Unix timestamp - access expires after
    TimeLockedUntil uint64                // Block height - secret locked until
    AccessWindow    *AccessWindow         // Recurring access windows
}

// AccessWindow defines recurring access periods
type AccessWindow struct {
    DaysOfWeek      []int                 // 0-6 (Sunday-Saturday)
    StartHour       int                   // 0-23 UTC
    EndHour         int                   // 0-23 UTC
}

// MultiPartyAuth requires multiple parties to approve access
type MultiPartyAuth struct {
    RequiredApprovals uint32              // Number of approvals needed
    Approvers         []Address           // Authorized approvers
    ApprovalTimeout   uint64              // Blocks until approval expires
    CurrentApprovals  map[Address]uint64  // Address -> approval block
}

// AttributeRule defines attribute-based access control
type AttributeRule struct {
    Attribute       string                // e.g., "role", "department"
    Operator        RuleOperator          // EQUALS, IN, NOT_IN
    Value           interface{}           // Expected value(s)
}

type RuleOperator uint8

const (
    OpEquals RuleOperator = iota
    OpNotEquals
    OpIn
    OpNotIn
    OpGreaterThan
    OpLessThan
)

// CheckAccess evaluates policy against requester
func (p *AccessPolicy) CheckAccess(requester Address, proof []byte) error {
    // Check deny list first
    if containsAddress(p.DenyList, requester) {
        return ErrAccessDenied
    }

    // Check revocation list
    if containsAddress(p.RevocationList, requester) {
        return ErrAccessRevoked
    }

    // Check allow list
    if len(p.AllowList) > 0 && !containsAddress(p.AllowList, requester) {
        return ErrNotInAllowList
    }

    // Check time constraints
    if p.TimeConstraints != nil {
        now := time.Now().Unix()
        if p.TimeConstraints.NotBefore > 0 && uint64(now) < p.TimeConstraints.NotBefore {
            return ErrAccessNotYetValid
        }
        if p.TimeConstraints.NotAfter > 0 && uint64(now) > p.TimeConstraints.NotAfter {
            return ErrAccessExpired
        }
        if p.TimeConstraints.TimeLockedUntil > 0 && currentBlock < p.TimeConstraints.TimeLockedUntil {
            return ErrSecretTimeLocked
        }
        if !p.TimeConstraints.AccessWindow.IsOpen() {
            return ErrOutsideAccessWindow
        }
    }

    // Check multi-party auth
    if p.MultiPartyAuth != nil {
        validApprovals := p.MultiPartyAuth.CountValidApprovals(currentBlock)
        if validApprovals < p.MultiPartyAuth.RequiredApprovals {
            return ErrInsufficientApprovals
        }
    }

    // Check attribute rules
    for _, rule := range p.AttributeRules {
        if !rule.Evaluate(requester, proof) {
            return ErrAttributeRuleFailed
        }
    }

    return nil
}
```

### Data Encryption Service

#### Envelope Encryption Protocol Specification

This section provides the complete protocol specification for envelope encryption in K-Chain,
following NIST SP 800-38D (GCM mode) and RFC 7516 (JSON Web Encryption) design principles.

##### Protocol Overview

```
+------------------------------------------------------------------+
|                    ENVELOPE ENCRYPTION PROTOCOL                   |
+------------------------------------------------------------------+
|                                                                  |
|  ENCRYPTION FLOW:                                                |
|  ================                                                |
|                                                                  |
|  1. Generate DEK      DEK <- CSPRNG(256 bits)                    |
|  2. Generate Nonce    N <- CSPRNG(96 bits)                       |
|  3. Encrypt Data      (CT, Tag) <- AEAD.Enc(DEK, N, PT, AAD)     |
|  4. Encapsulate       (KEM_CT, SS) <- ML-KEM.Encaps(KEK_pub)     |
|  5. Derive Wrap Key   WK <- HKDF(SS, info="DEK-Wrap")            |
|  6. Wrap DEK          W_DEK <- AES-KW(WK, DEK)                   |
|  7. Output            (CT, Tag, N, KEM_CT, W_DEK, KEK_ID)        |
|                                                                  |
|  DECRYPTION FLOW:                                                |
|  ================                                                |
|                                                                  |
|  1. Decapsulate       SS <- ML-KEM.Decaps(KEK_priv, KEM_CT)      |
|  2. Derive Wrap Key   WK <- HKDF(SS, info="DEK-Wrap")            |
|  3. Unwrap DEK        DEK <- AES-KW^-1(WK, W_DEK)                |
|  4. Decrypt Data      PT <- AEAD.Dec(DEK, N, CT, Tag, AAD)       |
|  5. Output            PT                                         |
|                                                                  |
+------------------------------------------------------------------+
```

##### Wire Format

The envelope encryption wire format enables interoperability and versioning:

```go
// EnvelopeHeader defines the wire format header (16 bytes)
type EnvelopeHeader struct {
    Magic       [4]byte   // "LUXE" (0x4C555845)
    Version     uint8     // Protocol version (current: 1)
    Flags       uint8     // Feature flags
    KEMAlgo     uint8     // ML-KEM parameter set (1=512, 2=768, 3=1024)
    AEADAlgo    uint8     // AEAD algorithm (1=AES-GCM, 2=ChaCha20-Poly1305)
    Reserved    [8]byte   // Reserved for future use
}

// EnvelopeFlags bit definitions
const (
    FlagHybridMode    uint8 = 0x01  // Hybrid ML-KEM + X25519
    FlagCompressed    uint8 = 0x02  // Ciphertext is compressed
    FlagThreshold     uint8 = 0x04  // Threshold decryption required
    FlagAAD           uint8 = 0x08  // Additional authenticated data present
    FlagKeyID         uint8 = 0x10  // Key ID included
)

// EnvelopeWireFormat is the complete serialized envelope
type EnvelopeWireFormat struct {
    Header          EnvelopeHeader    // 16 bytes
    KEKIDLength     uint16            // Key ID length (0-32)
    KEKID           []byte            // Key ID (variable)
    KEMCTLength     uint16            // KEM ciphertext length
    KEMCT           []byte            // ML-KEM ciphertext
    WrappedDEKLen   uint16            // Wrapped DEK length (always 40 for AES-KW)
    WrappedDEK      []byte            // Wrapped DEK
    NonceLength     uint8             // Nonce length (12 for GCM)
    Nonce           []byte            // Nonce
    AADLength       uint32            // AAD length (0 if none)
    AAD             []byte            // Additional authenticated data
    CTLength        uint32            // Ciphertext length
    Ciphertext      []byte            // Encrypted data
    Tag             [16]byte          // Authentication tag
}

// Serialize produces the wire format bytes
func (e *EnvelopeWireFormat) Serialize() []byte {
    buf := new(bytes.Buffer)

    // Write header
    buf.Write(e.Header.Magic[:])
    buf.WriteByte(e.Header.Version)
    buf.WriteByte(e.Header.Flags)
    buf.WriteByte(e.Header.KEMAlgo)
    buf.WriteByte(e.Header.AEADAlgo)
    buf.Write(e.Header.Reserved[:])

    // Write KEK ID
    binary.Write(buf, binary.BigEndian, e.KEKIDLength)
    buf.Write(e.KEKID)

    // Write KEM ciphertext
    binary.Write(buf, binary.BigEndian, e.KEMCTLength)
    buf.Write(e.KEMCT)

    // Write wrapped DEK
    binary.Write(buf, binary.BigEndian, e.WrappedDEKLen)
    buf.Write(e.WrappedDEK)

    // Write nonce
    buf.WriteByte(e.NonceLength)
    buf.Write(e.Nonce)

    // Write AAD
    binary.Write(buf, binary.BigEndian, e.AADLength)
    buf.Write(e.AAD)

    // Write ciphertext
    binary.Write(buf, binary.BigEndian, e.CTLength)
    buf.Write(e.Ciphertext)

    // Write tag
    buf.Write(e.Tag[:])

    return buf.Bytes()
}

// Deserialize parses wire format bytes
func DeserializeEnvelope(data []byte) (*EnvelopeWireFormat, error) {
    if len(data) < 16 {
        return nil, ErrInvalidEnvelopeFormat
    }

    // Verify magic
    magic := data[0:4]
    if !bytes.Equal(magic, []byte("LUXE")) {
        return nil, ErrInvalidEnvelopeMagic
    }

    // Parse header
    env := &EnvelopeWireFormat{
        Header: EnvelopeHeader{
            Magic:    [4]byte{data[0], data[1], data[2], data[3]},
            Version:  data[4],
            Flags:    data[5],
            KEMAlgo:  data[6],
            AEADAlgo: data[7],
        },
    }
    copy(env.Header.Reserved[:], data[8:16])

    // Version check
    if env.Header.Version != 1 {
        return nil, ErrUnsupportedEnvelopeVersion
    }

    // Parse remaining fields...
    // (implementation continues with offset tracking)

    return env, nil
}
```

##### AES Key Wrap (RFC 3394)

DEK wrapping uses AES-KW per RFC 3394 for integrity-protected key transport:

```go
import "crypto/aes"

// WrapKey wraps a key using AES-KW (RFC 3394)
// Input key must be multiple of 64 bits (8 bytes)
// Output is 8 bytes longer than input
func WrapKey(kek, plaintext []byte) ([]byte, error) {
    if len(plaintext) < 16 || len(plaintext)%8 != 0 {
        return nil, ErrInvalidKeyLength
    }

    block, err := aes.NewCipher(kek)
    if err != nil {
        return nil, err
    }

    // Default IV per RFC 3394
    iv := []byte{0xA6, 0xA6, 0xA6, 0xA6, 0xA6, 0xA6, 0xA6, 0xA6}

    n := len(plaintext) / 8
    r := make([][]byte, n)
    for i := 0; i < n; i++ {
        r[i] = make([]byte, 8)
        copy(r[i], plaintext[i*8:(i+1)*8])
    }

    a := make([]byte, 8)
    copy(a, iv)

    for j := 0; j < 6; j++ {
        for i := 0; i < n; i++ {
            b := make([]byte, 16)
            copy(b, a)
            copy(b[8:], r[i])
            block.Encrypt(b, b)

            t := uint64(n*j + i + 1)
            for k := 0; k < 8; k++ {
                a[k] = b[k] ^ byte(t>>(56-8*k))
            }
            copy(r[i], b[8:])
        }
    }

    // Concatenate A || R[1] || R[2] || ... || R[n]
    result := make([]byte, 8+len(plaintext))
    copy(result, a)
    for i := 0; i < n; i++ {
        copy(result[8+i*8:], r[i])
    }

    return result, nil
}

// UnwrapKey unwraps a key using AES-KW (RFC 3394)
func UnwrapKey(kek, ciphertext []byte) ([]byte, error) {
    if len(ciphertext) < 24 || len(ciphertext)%8 != 0 {
        return nil, ErrInvalidCiphertextLength
    }

    block, err := aes.NewCipher(kek)
    if err != nil {
        return nil, err
    }

    n := (len(ciphertext) / 8) - 1
    a := make([]byte, 8)
    copy(a, ciphertext[:8])

    r := make([][]byte, n)
    for i := 0; i < n; i++ {
        r[i] = make([]byte, 8)
        copy(r[i], ciphertext[8+i*8:8+(i+1)*8])
    }

    for j := 5; j >= 0; j-- {
        for i := n - 1; i >= 0; i-- {
            t := uint64(n*j + i + 1)
            b := make([]byte, 16)
            for k := 0; k < 8; k++ {
                b[k] = a[k] ^ byte(t>>(56-8*k))
            }
            copy(b[8:], r[i])
            block.Decrypt(b, b)
            copy(a, b[:8])
            copy(r[i], b[8:])
        }
    }

    // Verify IV
    expectedIV := []byte{0xA6, 0xA6, 0xA6, 0xA6, 0xA6, 0xA6, 0xA6, 0xA6}
    if !bytes.Equal(a, expectedIV) {
        return nil, ErrKeyUnwrapFailed
    }

    // Concatenate R[1] || R[2] || ... || R[n]
    result := make([]byte, n*8)
    for i := 0; i < n; i++ {
        copy(result[i*8:], r[i])
    }

    return result, nil
}
```

##### Security Requirements

| Requirement | Specification | Rationale |
|-------------|---------------|-----------|
| DEK Generation | MUST use CSPRNG | Prevents predictable keys |
| Nonce Uniqueness | MUST be unique per (key, plaintext) pair | GCM security requirement |
| KEK Algorithm | MUST be ML-KEM-768 or ML-KEM-1024 | NIST Level 3+ security |
| AEAD Algorithm | MUST be AES-256-GCM or ChaCha20-Poly1305 | NIST/RFC approved AEAD |
| Key Wrapping | MUST use AES-KW (RFC 3394) | Integrity-protected transport |
| Memory Handling | MUST zero DEK and SS after use | Prevents key leakage |

#### Envelope Encryption Model (DEK/KEK)

The envelope encryption model separates key management from data encryption:

1. **KEK (Key Encryption Key)**: ML-KEM encapsulation key used to wrap DEKs
2. **DEK (Data Encryption Key)**: Symmetric key (AES-256 or ChaCha20) used for actual data encryption

This separation provides:
- **Key rotation without re-encryption**: Rotate KEKs without re-encrypting all data
- **Efficient bulk encryption**: Symmetric encryption for large data
- **Post-quantum KEK protection**: ML-KEM protects all DEKs

```go
import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "crypto/sha256"
    "fmt"
    "io"

    "github.com/luxfi/crypto/mlkem"
    "github.com/luxfi/ids"
    "golang.org/x/crypto/chacha20poly1305"
    "golang.org/x/crypto/hkdf"
)

// EnvelopeEncryption implements DEK/KEK model with ML-KEM protection
type EnvelopeEncryption struct {
    // Key Encryption Key (KEK) - ML-KEM derived
    KEKReference    ids.ID

    // Data Encryption Key (DEK) - Symmetric
    DEKAlgorithm    SymmetricAlgorithm
    DEKSize         int               // 256 bits for AES-256
}

// EncryptedData contains all components needed for decryption
type EncryptedData struct {
    Ciphertext     []byte            // Encrypted plaintext
    Nonce          []byte            // 12-byte nonce for AEAD
    Tag            []byte            // 16-byte authentication tag
    WrappedDEK     []byte            // DEK wrapped with ML-KEM shared secret
    KEKCiphertext  []byte            // ML-KEM ciphertext (encapsulated key)
    KEKReference   ids.ID            // Reference to ML-KEM KEK
    Algorithm      SymmetricAlgorithm // Cipher used
}

// EncryptData performs envelope encryption
// Flow: Generate DEK -> Encrypt data with DEK -> Encapsulate DEK with KEK
func (ee *EnvelopeEncryption) EncryptData(
    state *KMSState,
    plaintext []byte,
    owner ids.ShortID,
) (*EncryptedData, error) {
    // 1. Generate random DEK (256-bit)
    dek := make([]byte, ee.DEKSize/8)
    if _, err := rand.Read(dek); err != nil {
        return nil, fmt.Errorf("DEK generation failed: %w", err)
    }
    defer zeroBytes(dek) // Ensure DEK is zeroed after use

    // 2. Generate random nonce (96-bit for GCM/ChaCha20-Poly1305)
    nonce := make([]byte, 12)
    if _, err := rand.Read(nonce); err != nil {
        return nil, fmt.Errorf("nonce generation failed: %w", err)
    }

    // 3. Encrypt plaintext with DEK using AEAD
    var sealed []byte
    switch ee.DEKAlgorithm {
    case AES256GCM:
        block, err := aes.NewCipher(dek)
        if err != nil {
            return nil, fmt.Errorf("AES cipher creation failed: %w", err)
        }
        gcm, err := cipher.NewGCM(block)
        if err != nil {
            return nil, fmt.Errorf("GCM mode creation failed: %w", err)
        }
        sealed = gcm.Seal(nil, nonce, plaintext, nil)

    case CHACHA20POLY1305:
        ciph, err := chacha20poly1305.New(dek)
        if err != nil {
            return nil, fmt.Errorf("ChaCha20-Poly1305 creation failed: %w", err)
        }
        sealed = ciph.Seal(nil, nonce, plaintext, nil)

    default:
        return nil, fmt.Errorf("unsupported algorithm: %d", ee.DEKAlgorithm)
    }

    // 4. Split sealed data into ciphertext and tag
    tagSize := 16 // Both AES-GCM and ChaCha20-Poly1305 use 128-bit tags
    ciphertext := sealed[:len(sealed)-tagSize]
    tag := sealed[len(sealed)-tagSize:]

    // 5. Encapsulate DEK with ML-KEM KEK (using luxfi/crypto/mlkem)
    kek := state.EncapsulationKeys[ee.KEKReference]
    if kek == nil {
        return nil, ErrKEKNotFound
    }

    pubKey, err := mlkem.PublicKeyFromBytes(kek.PublicKey, kek.Algorithm)
    if err != nil {
        return nil, fmt.Errorf("invalid KEK public key: %w", err)
    }

    kemCiphertext, sharedSecret, err := pubKey.Encapsulate()
    if err != nil {
        return nil, fmt.Errorf("KEK encapsulation failed: %w", err)
    }
    defer zeroBytes(sharedSecret) // Ensure shared secret is zeroed

    // 6. Wrap DEK with shared secret using HKDF-derived key
    wrappedDEK, err := wrapKeyWithHKDF(dek, sharedSecret, []byte("LUX-K-Chain-DEK-Wrap-v1"))
    if err != nil {
        return nil, fmt.Errorf("DEK wrapping failed: %w", err)
    }

    return &EncryptedData{
        Ciphertext:    ciphertext,
        Nonce:         nonce,
        Tag:           tag,
        WrappedDEK:    wrappedDEK,
        KEKCiphertext: kemCiphertext,
        KEKReference:  ee.KEKReference,
        Algorithm:     ee.DEKAlgorithm,
    }, nil
}

// DecryptData performs envelope decryption
// Flow: Decapsulate KEK -> Unwrap DEK -> Decrypt data with DEK
func (ee *EnvelopeEncryption) DecryptData(
    state *KMSState,
    encrypted *EncryptedData,
    owner ids.ShortID,
) ([]byte, error) {
    kek := state.EncapsulationKeys[encrypted.KEKReference]
    if kek == nil {
        return nil, ErrKEKNotFound
    }

    // 1. Decrypt KEK secret key (stored encrypted with owner's key)
    privKeyBytes, err := decryptSecretKey(kek.EncryptedSK, owner)
    if err != nil {
        return nil, fmt.Errorf("KEK secret key decryption failed: %w", err)
    }
    defer zeroBytes(privKeyBytes)

    privKey, err := mlkem.PrivateKeyFromBytes(privKeyBytes, kek.Algorithm)
    if err != nil {
        return nil, fmt.Errorf("invalid KEK private key: %w", err)
    }

    // 2. Decapsulate to recover shared secret
    sharedSecret, err := privKey.Decapsulate(encrypted.KEKCiphertext)
    if err != nil {
        return nil, fmt.Errorf("KEK decapsulation failed: %w", err)
    }
    defer zeroBytes(sharedSecret)

    // 3. Unwrap DEK
    dek, err := unwrapKeyWithHKDF(encrypted.WrappedDEK, sharedSecret, []byte("LUX-K-Chain-DEK-Wrap-v1"))
    if err != nil {
        return nil, fmt.Errorf("DEK unwrapping failed: %w", err)
    }
    defer zeroBytes(dek)

    // 4. Decrypt ciphertext using AEAD
    sealedData := append(encrypted.Ciphertext, encrypted.Tag...)

    var plaintext []byte
    switch encrypted.Algorithm {
    case AES256GCM:
        block, err := aes.NewCipher(dek)
        if err != nil {
            return nil, fmt.Errorf("AES cipher creation failed: %w", err)
        }
        gcm, err := cipher.NewGCM(block)
        if err != nil {
            return nil, fmt.Errorf("GCM mode creation failed: %w", err)
        }
        plaintext, err = gcm.Open(nil, encrypted.Nonce, sealedData, nil)
        if err != nil {
            return nil, fmt.Errorf("AES-GCM decryption failed: %w", err)
        }

    case CHACHA20POLY1305:
        ciph, err := chacha20poly1305.New(dek)
        if err != nil {
            return nil, fmt.Errorf("ChaCha20-Poly1305 creation failed: %w", err)
        }
        plaintext, err = ciph.Open(nil, encrypted.Nonce, sealedData, nil)
        if err != nil {
            return nil, fmt.Errorf("ChaCha20-Poly1305 decryption failed: %w", err)
        }

    default:
        return nil, fmt.Errorf("unsupported algorithm: %d", encrypted.Algorithm)
    }

    return plaintext, nil
}

// wrapKeyWithHKDF wraps a key using HKDF-derived wrapping key
func wrapKeyWithHKDF(key, sharedSecret, info []byte) ([]byte, error) {
    // Derive wrapping key from shared secret
    hkdfReader := hkdf.New(sha256.New, sharedSecret, nil, info)
    wrapKey := make([]byte, len(key))
    if _, err := io.ReadFull(hkdfReader, wrapKey); err != nil {
        return nil, err
    }

    // XOR key with wrapping key (simple but effective for equal-length keys)
    wrapped := make([]byte, len(key))
    for i := range key {
        wrapped[i] = key[i] ^ wrapKey[i]
    }
    zeroBytes(wrapKey)
    return wrapped, nil
}

// unwrapKeyWithHKDF unwraps a key using HKDF-derived wrapping key
func unwrapKeyWithHKDF(wrapped, sharedSecret, info []byte) ([]byte, error) {
    // Same operation as wrap (XOR is symmetric)
    return wrapKeyWithHKDF(wrapped, sharedSecret, info)
}

// zeroBytes securely zeros a byte slice
func zeroBytes(b []byte) {
    for i := range b {
        b[i] = 0
    }
}
```

#### Complete Envelope Encryption Example

```go
// Example: End-to-end envelope encryption workflow
func ExampleEnvelopeEncryption() {
    // 1. Create ML-KEM KEK (Key Encryption Key)
    kekPub, kekPriv, _ := mlkem.GenerateKey(mlkem.MLKEM768)

    // 2. Setup envelope encryption
    envelope := &EnvelopeEncryption{
        KEKReference: kekID,
        DEKAlgorithm: AES256GCM,
        DEKSize:      256,
    }

    // 3. Encrypt sensitive data
    plaintext := []byte("API_KEY=sk-prod-abc123xyz...")
    encrypted, _ := envelope.EncryptData(state, plaintext, owner)

    // 4. Store encrypted.KEKCiphertext + encrypted.WrappedDEK + encrypted.Ciphertext
    // The ML-KEM ciphertext is ~1088 bytes for MLKEM768
    // The wrapped DEK is 32 bytes
    // The ciphertext is len(plaintext) + 16 bytes (tag)

    // 5. Later: Decrypt
    decrypted, _ := envelope.DecryptData(state, encrypted, owner)
    // decrypted == plaintext
}
```

#### Streaming Encryption for Large Data

```go
// StreamingEncryption handles large data encryption with chunking
type StreamingEncryption struct {
    ChunkSize       int               // Default: 1MB
    DEK             []byte            // Data encryption key
    Algorithm       SymmetricAlgorithm
}

// ChunkHeader contains metadata for each encrypted chunk
type ChunkHeader struct {
    Index           uint64            // Chunk index (0-based)
    Nonce           []byte            // Unique nonce per chunk
    Size            uint32            // Original chunk size
    Hash            [32]byte          // SHA-256 of plaintext chunk
}

// EncryptStream encrypts data in chunks
func (se *StreamingEncryption) EncryptStream(
    reader io.Reader,
    writer io.Writer,
) (*StreamMetadata, error) {
    metadata := &StreamMetadata{
        Algorithm:  se.Algorithm,
        ChunkSize:  se.ChunkSize,
        Chunks:     make([]ChunkHeader, 0),
    }

    buffer := make([]byte, se.ChunkSize)
    chunkIndex := uint64(0)

    for {
        n, err := reader.Read(buffer)
        if n > 0 {
            chunk := buffer[:n]

            // Generate unique nonce for chunk
            nonce := deriveChunkNonce(se.DEK, chunkIndex)

            // Encrypt chunk
            encrypted, tag := encryptChunk(chunk, se.DEK, nonce, se.Algorithm)

            // Write header
            header := ChunkHeader{
                Index: chunkIndex,
                Nonce: nonce,
                Size:  uint32(n),
                Hash:  sha256.Sum256(chunk),
            }

            writeChunkHeader(writer, header)
            writer.Write(encrypted)
            writer.Write(tag)

            metadata.Chunks = append(metadata.Chunks, header)
            metadata.TotalSize += uint64(n)
            chunkIndex++
        }

        if err == io.EOF {
            break
        }
        if err != nil {
            return nil, fmt.Errorf("read error: %w", err)
        }
    }

    metadata.ChunkCount = chunkIndex
    return metadata, nil
}
```

### IPFS Integration

```go
// IPFSEncryptedStorage provides encrypted storage on IPFS
type IPFSEncryptedStorage struct {
    KMSState        *KMSState
    IPFSClient      *ipfs.Client
    EncryptionKeyID KeyID
}

// StoreEncrypted encrypts and stores file on IPFS
func (ies *IPFSEncryptedStorage) StoreEncrypted(
    content []byte,
    owner Address,
) (*IPFSStorageRecord, error) {
    // Get encryption key
    encKey := ies.KMSState.EncryptionKeys[ies.EncryptionKeyID]
    if encKey == nil {
        return nil, ErrEncryptionKeyNotFound
    }

    // Encrypt content
    envelope := &EnvelopeEncryption{
        KEKReference: encKey.KEKReference,
        DEKAlgorithm: encKey.Algorithm,
        DEKSize:      256,
    }

    encrypted, err := envelope.EncryptData(ies.KMSState, content, owner)
    if err != nil {
        return nil, fmt.Errorf("encryption failed: %w", err)
    }

    // Serialize encrypted data
    serialized := serializeEncryptedData(encrypted)

    // Store on IPFS
    cid, err := ies.IPFSClient.Add(serialized)
    if err != nil {
        return nil, fmt.Errorf("IPFS storage failed: %w", err)
    }

    return &IPFSStorageRecord{
        CID:             cid,
        EncryptionKeyID: ies.EncryptionKeyID,
        Size:            uint64(len(content)),
        EncryptedSize:   uint64(len(serialized)),
        ContentHash:     sha256.Sum256(content),
        StoredAt:        time.Now().Unix(),
    }, nil
}

// RetrieveDecrypted retrieves and decrypts file from IPFS
func (ies *IPFSEncryptedStorage) RetrieveDecrypted(
    cid string,
    owner Address,
) ([]byte, error) {
    // Fetch from IPFS
    serialized, err := ies.IPFSClient.Cat(cid)
    if err != nil {
        return nil, fmt.Errorf("IPFS retrieval failed: %w", err)
    }

    // Deserialize
    encrypted := deserializeEncryptedData(serialized)

    // Decrypt
    envelope := &EnvelopeEncryption{
        KEKReference: encrypted.KEKReference,
        DEKAlgorithm: encrypted.Algorithm,
        DEKSize:      256,
    }

    return envelope.DecryptData(ies.KMSState, encrypted, owner)
}
```

### RPC API Endpoints

K-Chain exposes JSON-RPC endpoints under `/ext/bc/K` on port **9630** (default Lux RPC port).

**Base URL:** `http://localhost:9630/ext/bc/K/rpc`

**WebSocket:** `ws://localhost:9630/ext/bc/K/ws`

All RPC methods require signed transactions for write operations. Read operations are generally
unauthenticated but may be rate-limited.

**Related Documentation:**
- [LP-330 T-Chain RPC](./lp-0330-t-chain-thresholdvm-specification.md) - Threshold signature APIs
- [LP-332 Teleport Bridge](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md) - Bridge integration

#### kms_generateKey - Generate ML-KEM Key Pair

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_generateKey",
    "params": {
        "keyId": "bridge-messages-2025",
        "algorithm": "ML-KEM-768",
        "hybridEnabled": true,
        "purpose": "Cross-chain bridge message encryption",
        "expiresAt": 0,
        "owner": "0x1234...abcd"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "keyId": "bridge-messages-2025",
        "publicKey": "0x...",
        "ecdhPublicKey": "0x...",
        "algorithm": "ML-KEM-768",
        "hybridEnabled": true,
        "status": "active",
        "createdAt": 12345678
    },
    "id": 1
}
```

#### kms_encapsulate - ML-KEM Encapsulation

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_encapsulate",
    "params": {
        "encapsulationKeyId": "bridge-messages-2025",
        "hybridMode": true,
        "ephemeralEcdhKey": "0x..."
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "ciphertext": "0x...",
        "ecdhCiphertext": "0x...",
        "sharedSecretDerivation": {
            "kdfAlgorithm": "HKDF-SHA256",
            "info": "LUX-K-Chain-Hybrid-v1",
            "outputLength": 32
        }
    },
    "id": 1
}
```

#### kms_decapsulate - ML-KEM Decapsulation

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_decapsulate",
    "params": {
        "keyId": "bridge-messages-2025",
        "ciphertext": "0x...",
        "hybridMode": true,
        "ecdhCiphertext": "0x...",
        "deriveEncryptionKey": true,
        "newEncryptionKeyId": "session-key-001"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "success": true,
        "derivedKeyId": "session-key-001",
        "derivedKeyStatus": "active"
    },
    "id": 1
}
```

#### kms_encrypt - Encrypt Data

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_encrypt",
    "params": {
        "encryptionKeyId": "session-key-001",
        "plaintext": "base64-encoded-plaintext",
        "algorithm": "AES-256-GCM",
        "associatedData": "optional-aad"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "ciphertext": "base64-encoded-ciphertext",
        "nonce": "0x...",
        "tag": "0x...",
        "algorithm": "AES-256-GCM"
    },
    "id": 1
}
```

#### kms_decrypt - Decrypt Data

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_decrypt",
    "params": {
        "encryptionKeyId": "session-key-001",
        "ciphertext": "base64-encoded-ciphertext",
        "nonce": "0x...",
        "tag": "0x...",
        "algorithm": "AES-256-GCM",
        "associatedData": "optional-aad"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "plaintext": "base64-encoded-plaintext",
        "verified": true
    },
    "id": 1
}
```

#### kms_storeSecret - Store Encrypted Secret

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_storeSecret",
    "params": {
        "secretId": "api-key-production",
        "encryptedData": {
            "ciphertext": "base64-encoded",
            "nonce": "0x...",
            "tag": "0x..."
        },
        "encryptionKeyId": "session-key-001",
        "secretType": "api_key",
        "labels": {
            "environment": "production",
            "service": "payment-gateway"
        },
        "policyId": "restricted-access-policy"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "secretId": "api-key-production",
        "version": 1,
        "storedAt": 12345680,
        "size": 256
    },
    "id": 1
}
```

#### kms_retrieveSecret - Retrieve and Decrypt Secret

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_retrieveSecret",
    "params": {
        "secretId": "api-key-production",
        "version": 0,
        "authorizationProof": "0x..."
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "secretId": "api-key-production",
        "version": 1,
        "decrypted": true,
        "plaintext": "base64-encoded-secret",
        "accessedAt": 12345690
    },
    "id": 1
}
```

#### kms_rotateKey - Rotate Encryption Key

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_rotateKey",
    "params": {
        "keyId": "session-key-001",
        "reEncryptSecrets": true,
        "secretIds": ["api-key-production", "database-credentials"],
        "reason": "scheduled rotation"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "keyId": "session-key-001",
        "newVersion": 2,
        "previousVersion": 1,
        "reEncryptedSecrets": ["api-key-production", "database-credentials"],
        "rotatedAt": 12345700
    },
    "id": 1
}
```

#### kms_createPolicy - Create Access Policy

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_createPolicy",
    "params": {
        "policyId": "restricted-access-policy",
        "allowList": ["0x1234...", "0x5678..."],
        "timeConstraints": {
            "notBefore": 1704067200,
            "notAfter": 1735689600,
            "timeLockedUntil": 0
        },
        "multiPartyAuth": {
            "requiredApprovals": 2,
            "approvers": ["0xabc...", "0xdef...", "0x123..."],
            "approvalTimeout": 1000
        },
        "auditEnabled": true
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "policyId": "restricted-access-policy",
        "createdAt": 12345705,
        "status": "active"
    },
    "id": 1
}
```

#### kms_thresholdDecrypt - Request T-Chain Threshold Decryption

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_thresholdDecrypt",
    "params": {
        "secretId": "api-key-production",
        "tChainKeyId": "enterprise-custody-key",
        "requiredShares": 3,
        "deadline": 12346000,
        "callbackChain": "C-Chain",
        "callbackAddress": "0x9876..."
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "requestId": "0xdecrypt123...",
        "status": "pending",
        "tChainSessionId": "0xsession456...",
        "requiredShares": 3,
        "deadline": 12346000
    },
    "id": 1
}
```

#### Additional RPC Methods

| Method | Description | Auth Required |
|--------|-------------|---------------|
| `kms_getKey` | Get encapsulation key details (public key, status) | No |
| `kms_listKeys` | List keys by owner or filter | No |
| `kms_getEncryptionKey` | Get encryption key metadata | Yes |
| `kms_getSecret` | Get secret metadata (not content) | Yes |
| `kms_listSecrets` | List secrets by owner or filter | Yes |
| `kms_getPolicy` | Get access policy details | No |
| `kms_updatePolicy` | Update access policy | Yes (owner) |
| `kms_revokeAccess` | Revoke address from policy | Yes (owner) |
| `kms_getAuditLog` | Get audit log entries | Yes |
| `kms_approveAccess` | Submit multi-party approval | Yes (approver) |
| `kms_getDecryptStatus` | Check threshold decrypt status | Yes |

#### kms_getKey - Get Key Details

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_getKey",
    "params": {
        "keyId": "bridge-messages-2025"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "keyId": "bridge-messages-2025",
        "algorithm": "ML-KEM-768",
        "publicKey": "0x...",
        "x25519PublicKey": "0x...",
        "hybridEnabled": true,
        "owner": "0x1234...abcd",
        "status": "active",
        "createdAt": 12345678,
        "expiresAt": 0,
        "usageCount": 1542,
        "purpose": "Cross-chain bridge message encryption"
    },
    "id": 1
}
```

#### kms_envelopeEncrypt - Envelope Encryption (DEK/KEK)

Complete envelope encryption in one call:

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_envelopeEncrypt",
    "params": {
        "kekId": "bridge-messages-2025",
        "plaintext": "base64-encoded-plaintext",
        "algorithm": "AES-256-GCM"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "ciphertext": "base64-encoded-ciphertext",
        "nonce": "0x...",
        "tag": "0x...",
        "wrappedDek": "0x...",
        "kekCiphertext": "0x...",
        "kekId": "bridge-messages-2025",
        "algorithm": "AES-256-GCM"
    },
    "id": 1
}
```

#### kms_envelopeDecrypt - Envelope Decryption

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_envelopeDecrypt",
    "params": {
        "ciphertext": "base64-encoded-ciphertext",
        "nonce": "0x...",
        "tag": "0x...",
        "wrappedDek": "0x...",
        "kekCiphertext": "0x...",
        "kekId": "bridge-messages-2025",
        "algorithm": "AES-256-GCM"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "plaintext": "base64-encoded-plaintext",
        "verified": true
    },
    "id": 1
}
```

#### kms_hybridEncrypt - Hybrid ML-KEM + X25519 Encryption

End-to-end hybrid encryption combining post-quantum and classical security:

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "kms_hybridEncrypt",
    "params": {
        "recipientKeyId": "bridge-messages-2025",
        "plaintext": "base64-encoded-plaintext",
        "senderX25519Public": "0x...",
        "algorithm": "AES-256-GCM"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "mlkemCiphertext": "0x...",
        "x25519Ciphertext": "0x...",
        "dataCiphertext": "base64-encoded-ciphertext",
        "nonce": "0x...",
        "tag": "0x...",
        "hybridInfo": {
            "kdfAlgorithm": "HKDF-SHA256",
            "info": "LUX-K-Chain-Hybrid-v1",
            "outputLength": 32
        }
    },
    "id": 1
}
```

#### RPC Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32001 | Key not found | Specified key ID does not exist |
| -32002 | Key expired | Key has passed expiration block |
| -32003 | Key revoked | Key has been revoked |
| -32004 | Unauthorized | Caller not authorized for operation |
| -32005 | Policy violation | Access policy check failed |
| -32006 | Invalid ciphertext | Ciphertext format or size invalid |
| -32007 | Decryption failed | AEAD authentication failed |
| -32008 | Threshold pending | Threshold decryption in progress |
| -32009 | Secret not found | Specified secret ID does not exist |
| -32010 | Algorithm unsupported | Requested algorithm not available |
| -32011 | Rate limited | Too many requests |
| -32012 | Size exceeded | Payload exceeds maximum size |

### Security Model

#### Threat Model

**Adversary Capabilities:**
1. Can observe all on-chain data
2. Can compromise up to t-1 T-Chain signers (for threshold secrets)
3. Has access to quantum computers (future threat)
4. Can perform man-in-the-middle attacks on network layer

**Security Goals:**
1. **Confidentiality**: Only authorized parties can decrypt secrets
2. **Integrity**: Secrets cannot be modified without detection
3. **Availability**: Secrets remain accessible while K-Chain is operational
4. **Post-Quantum Security**: ML-KEM provides security against quantum attacks
5. **Forward Secrecy**: Compromise of current keys doesn't expose past secrets

#### Cryptographic Assumptions

| Component | Assumption |
|-----------|------------|
| ML-KEM | Module-LWE hardness (lattice-based) |
| X25519 | Elliptic Curve Diffie-Hellman (ECDLP) |
| AES-256-GCM | AES security, GCM AEAD security |
| ChaCha20-Poly1305 | ChaCha20 stream cipher, Poly1305 MAC |
| HKDF | Random oracle model |

#### ML-KEM Security Levels (per FIPS 203)

| Parameter Set | Security Level | Classical Equivalent | Quantum Equivalent |
|---------------|----------------|---------------------|-------------------|
| ML-KEM-512 | NIST Level 1 | AES-128 | AES-128 |
| ML-KEM-768 | NIST Level 3 | AES-192 | AES-192 |
| ML-KEM-1024 | NIST Level 5 | AES-256 | AES-256 |

#### Hybrid Mode Security

Hybrid mode (ML-KEM + X25519) provides defense-in-depth:

```
Security(Hybrid) = max(Security(ML-KEM), Security(ECDH))
```

If either primitive is broken, the other still provides protection. This is critical during the quantum transition period where:
- ML-KEM implementation bugs might exist
- ECDH remains trusted for classical adversaries

#### Attack Mitigations

```go
// 1. Key Extraction Prevention
type KeyProtection struct {
    // Secret keys encrypted at rest
    EncryptedSK     []byte
    EncryptionIV    []byte

    // Hardware binding where available
    TPMBound        bool
    TPMHandle       uint32
}

// 2. Timing Attack Prevention
func ConstantTimeDecapsulate(ct, sk []byte) ([]byte, error) {
    // ML-KEM decapsulation is inherently constant-time per FIPS 203
    // Additional measures for secret handling
    result := mlkem.DecapsulateConstantTime(ct, sk)

    // Constant-time comparison for validation
    if !subtle.ConstantTimeCompare(expected, computed) {
        return nil, ErrDecapsulationFailed
    }

    return result, nil
}

// 3. Replay Attack Prevention
type NonceTracking struct {
    UsedNonces map[[24]byte]bool
    Window     uint64
}

func (nt *NonceTracking) CheckAndRecord(nonce []byte) error {
    var nonceArray [24]byte
    copy(nonceArray[:], nonce)

    if nt.UsedNonces[nonceArray] {
        return ErrNonceReuse
    }

    nt.UsedNonces[nonceArray] = true
    return nil
}

// 4. Side-Channel Mitigations
type SideChannelProtection struct {
    // Randomized delays
    func AddJitter(baseOp func()) {
        jitter := rand.Intn(1000) // 0-1ms
        time.Sleep(time.Duration(jitter) * time.Microsecond)
        baseOp()
    }

    // Memory barriers
    func SecureZero(data []byte) {
        for i := range data {
            data[i] = 0
        }
        runtime.KeepAlive(data)
    }
}
```

#### Access Control Security

| Control | Implementation |
|---------|---------------|
| Authentication | Transaction signatures (ECDSA/EdDSA) |
| Authorization | Policy-based with allow/deny lists |
| Multi-party | M-of-N approval via T-Chain |
| Time-locks | Block height-based restrictions |
| Revocation | On-chain revocation lists |
| Audit | Immutable on-chain audit log |

### HSM Integration

K-Chain supports Hardware Security Module (HSM) integration for enterprise deployments requiring
hardware-backed key protection. Implementations MUST support PKCS#11 and SHOULD support vendor-specific
APIs for optimal performance.

#### PKCS#11 Interface

```go
import (
    "github.com/luxfi/crypto/hsm/pkcs11"
    "github.com/luxfi/ids"
)

// PKCS11Provider implements HSM operations via PKCS#11 (Cryptoki)
type PKCS11Provider struct {
    Module       string            // Path to PKCS#11 library (e.g., "/usr/lib/softhsm/libsofthsm2.so")
    SlotID       uint              // HSM slot identifier
    PIN          string            // User PIN (SHOULD be from secure storage)
    session      pkcs11.SessionHandle
    initialized  bool
}

// HSMKeyHandle represents a key stored in HSM
type HSMKeyHandle struct {
    KeyID        ids.ID            // K-Chain key identifier
    HSMHandle    uint64            // PKCS#11 object handle
    Label        string            // HSM key label
    KeyType      HSMKeyType        // Key type indicator
    Extractable  bool              // Whether key can be exported (SHOULD be false)
}

type HSMKeyType uint8

const (
    HSMKeyTypeMLKEM      HSMKeyType = 0x01  // ML-KEM key pair
    HSMKeyTypeAES        HSMKeyType = 0x02  // AES symmetric key
    HSMKeyTypeX25519     HSMKeyType = 0x03  // X25519 key pair
)

// Initialize establishes PKCS#11 session
func (p *PKCS11Provider) Initialize() error {
    ctx := pkcs11.New(p.Module)
    if err := ctx.Initialize(); err != nil {
        return fmt.Errorf("PKCS#11 init failed: %w", err)
    }

    session, err := ctx.OpenSession(p.SlotID, pkcs11.CKF_SERIAL_SESSION|pkcs11.CKF_RW_SESSION)
    if err != nil {
        return fmt.Errorf("session open failed: %w", err)
    }

    if err := ctx.Login(session, pkcs11.CKU_USER, p.PIN); err != nil {
        return fmt.Errorf("HSM login failed: %w", err)
    }

    p.session = session
    p.initialized = true
    return nil
}

// GenerateMLKEMKey generates ML-KEM key pair within HSM
// Note: ML-KEM support in PKCS#11 requires vendor extensions or PKCS#11 v3.1+
func (p *PKCS11Provider) GenerateMLKEMKey(keyID ids.ID, mode mlkem.Mode) (*HSMKeyHandle, error) {
    if !p.initialized {
        return nil, ErrHSMNotInitialized
    }

    // ML-KEM mechanism (vendor-specific until PKCS#11 v3.1)
    // YubiHSM uses CKM_KYBER_* mechanisms
    // AWS CloudHSM may use proprietary mechanism IDs
    mechanism := getMechanism(mode)

    pubTemplate := []*pkcs11.Attribute{
        pkcs11.NewAttribute(pkcs11.CKA_LABEL, fmt.Sprintf("mlkem-pub-%s", keyID.String())),
        pkcs11.NewAttribute(pkcs11.CKA_TOKEN, true),
        pkcs11.NewAttribute(pkcs11.CKA_ENCRYPT, true),
    }

    privTemplate := []*pkcs11.Attribute{
        pkcs11.NewAttribute(pkcs11.CKA_LABEL, fmt.Sprintf("mlkem-priv-%s", keyID.String())),
        pkcs11.NewAttribute(pkcs11.CKA_TOKEN, true),
        pkcs11.NewAttribute(pkcs11.CKA_DECRYPT, true),
        pkcs11.NewAttribute(pkcs11.CKA_SENSITIVE, true),
        pkcs11.NewAttribute(pkcs11.CKA_EXTRACTABLE, false),  // Key MUST NOT leave HSM
    }

    pubHandle, privHandle, err := p.ctx.GenerateKeyPair(
        p.session,
        mechanism,
        pubTemplate,
        privTemplate,
    )
    if err != nil {
        return nil, fmt.Errorf("ML-KEM keygen failed: %w", err)
    }

    return &HSMKeyHandle{
        KeyID:       keyID,
        HSMHandle:   uint64(privHandle),
        Label:       fmt.Sprintf("mlkem-%s", keyID.String()),
        KeyType:     HSMKeyTypeMLKEM,
        Extractable: false,
    }, nil
}

// Encapsulate performs ML-KEM encapsulation using HSM public key
func (p *PKCS11Provider) Encapsulate(handle *HSMKeyHandle) (ciphertext, sharedSecret []byte, err error) {
    // Implementation uses HSM for encapsulation
    // Shared secret is returned but SHOULD be immediately used and zeroed
    return p.ctx.Encapsulate(p.session, handle.HSMHandle)
}

// Decapsulate performs ML-KEM decapsulation within HSM
// Shared secret NEVER leaves HSM boundary when used with WrapKey
func (p *PKCS11Provider) Decapsulate(handle *HSMKeyHandle, ciphertext []byte) ([]byte, error) {
    return p.ctx.Decapsulate(p.session, handle.HSMHandle, ciphertext)
}
```

#### YubiHSM 2 Integration

YubiHSM 2 provides FIPS 140-2 Level 3 certified hardware key storage:

```go
import (
    "github.com/luxfi/crypto/hsm/yubihsm"
)

// YubiHSMProvider implements HSM operations via YubiHSM 2
type YubiHSMProvider struct {
    Connector    string            // YubiHSM connector URL (e.g., "http://localhost:12345")
    AuthKeyID    uint16            // Authentication key ID
    Password     string            // Authentication key password
    session      *yubihsm.Session
}

// YubiHSMConfig defines YubiHSM-specific configuration
type YubiHSMConfig struct {
    // Network Configuration
    ConnectorURL string            // USB: "yhusb://" or Network: "http://host:port"

    // Authentication
    AuthKeyID    uint16            // Default: 1 (factory default)
    AuthPassword string            // MUST be changed from factory default

    // Domain Configuration
    Domains      uint16            // Bitmask of allowed domains (1-16)

    // Audit Configuration
    AuditMode    yubihsm.AuditMode // Off, On, or Fixed
}

// GenerateMLKEMKey generates ML-KEM key in YubiHSM
func (y *YubiHSMProvider) GenerateMLKEMKey(keyID ids.ID, mode mlkem.Mode) (*HSMKeyHandle, error) {
    // YubiHSM 2 supports Kyber (ML-KEM predecessor)
    // FIPS 203 compliance requires firmware version 2.4+
    capabilities := yubihsm.CapabilityDecryptPKCS | yubihsm.CapabilityEncryptPKCS

    objectID, err := y.session.GenerateAsymmetricKey(
        yubihsm.AlgorithmKyber768,  // Maps to ML-KEM-768
        keyID.Prefix(2),            // Use first 2 bytes as YubiHSM object ID
        fmt.Sprintf("K-Chain-%s", keyID.String()[:8]),
        y.config.Domains,
        capabilities,
    )
    if err != nil {
        return nil, fmt.Errorf("YubiHSM keygen failed: %w", err)
    }

    return &HSMKeyHandle{
        KeyID:       keyID,
        HSMHandle:   uint64(objectID),
        Label:       fmt.Sprintf("yubihsm-mlkem-%s", keyID.String()[:8]),
        KeyType:     HSMKeyTypeMLKEM,
        Extractable: false,
    }, nil
}
```

#### AWS CloudHSM Integration

AWS CloudHSM provides FIPS 140-2 Level 3 certified HSMs in the cloud:

```go
import (
    "github.com/luxfi/crypto/hsm/cloudhsm"
    "github.com/aws/aws-sdk-go-v2/service/cloudhsmv2"
)

// CloudHSMProvider implements HSM operations via AWS CloudHSM
type CloudHSMProvider struct {
    ClusterID    string            // CloudHSM cluster ID
    Region       string            // AWS region
    CryptoUser   string            // Crypto user name
    Password     string            // Crypto user password
    client       *cloudhsmv2.Client
}

// CloudHSMConfig defines AWS CloudHSM configuration
type CloudHSMConfig struct {
    // Cluster Configuration
    ClusterID    string            // CloudHSM cluster identifier
    Region       string            // AWS region (e.g., "us-east-1")

    // Authentication
    CryptoUser   string            // Crypto user for key operations
    Password     string            // Crypto user password

    // Network
    SubnetIDs    []string          // VPC subnet IDs for HSM ENIs

    // High Availability
    MinHSMs      int               // Minimum HSM count (RECOMMENDED: 2)
}

// Initialize connects to CloudHSM cluster
func (c *CloudHSMProvider) Initialize(ctx context.Context) error {
    // AWS CloudHSM uses PKCS#11 interface via cloudhsm-pkcs11 library
    // Library path: /opt/cloudhsm/lib/libcloudhsm_pkcs11.so

    cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(c.Region))
    if err != nil {
        return fmt.Errorf("AWS config load failed: %w", err)
    }

    c.client = cloudhsmv2.NewFromConfig(cfg)

    // Verify cluster is active
    cluster, err := c.client.DescribeClusters(ctx, &cloudhsmv2.DescribeClustersInput{
        Filters: map[string][]string{
            "clusterIds": {c.ClusterID},
        },
    })
    if err != nil {
        return fmt.Errorf("cluster describe failed: %w", err)
    }

    if len(cluster.Clusters) == 0 || cluster.Clusters[0].State != "ACTIVE" {
        return ErrClusterNotActive
    }

    return nil
}

// GenerateMLKEMKey generates ML-KEM key in CloudHSM
// Note: CloudHSM ML-KEM support requires custom key type or SDK extension
func (c *CloudHSMProvider) GenerateMLKEMKey(keyID ids.ID, mode mlkem.Mode) (*HSMKeyHandle, error) {
    // CloudHSM key generation via PKCS#11
    // ML-KEM may require CloudHSM JCE provider with custom algorithm
    return c.pkcs11Provider.GenerateMLKEMKey(keyID, mode)
}
```

#### HSM Configuration

```go
// HSMConfig defines HSM provider configuration
type HSMConfig struct {
    // Provider Selection
    Provider     HSMProviderType   // PKCS11, YubiHSM, CloudHSM, SoftHSM
    Enabled      bool              // Enable HSM for key operations

    // PKCS#11 Settings
    PKCS11Module string            // Path to PKCS#11 library
    PKCS11Slot   uint              // Slot ID
    PKCS11PIN    string            // User PIN (from secure config)

    // YubiHSM Settings
    YubiHSMURL   string            // Connector URL
    YubiHSMAuth  uint16            // Auth key ID

    // CloudHSM Settings
    CloudHSMCluster string         // Cluster ID
    CloudHSMRegion  string         // AWS region

    // Key Policy
    RequireHSM      bool           // Require HSM for all key operations
    AllowSoftware   bool           // Allow software fallback
    ExtractableKeys bool           // Allow key export (SHOULD be false)
}

type HSMProviderType uint8

const (
    HSMProviderPKCS11   HSMProviderType = 0x01
    HSMProviderYubiHSM  HSMProviderType = 0x02
    HSMProviderCloudHSM HSMProviderType = 0x03
    HSMProviderSoftHSM  HSMProviderType = 0x04  // For development/testing only
)

// HSM Provider Selection Matrix
// | Provider   | FIPS Level | ML-KEM Support | Use Case                    |
// |------------|------------|----------------|------------------------------|
// | YubiHSM 2  | Level 3    | v2.4+          | On-premise, small scale     |
// | CloudHSM   | Level 3    | Via extension  | AWS cloud deployments       |
// | SoftHSM    | N/A        | Full           | Development and testing     |
// | Thales Luna| Level 3    | Pending        | Enterprise, high volume     |
```

### FIPS Compliance

K-Chain cryptographic operations MUST comply with NIST FIPS 203 (ML-KEM) for post-quantum
key encapsulation. Implementations MUST pass the following test vectors.

#### FIPS 203 Test Vectors

The following test vectors are derived from NIST FIPS 203 Appendix A:

```go
// FIPS 203 Known Answer Tests (KAT)
// These vectors MUST be used for implementation validation

// ML-KEM-768 Test Vector (NIST FIPS 203 Appendix A.2)
var MLKEM768TestVector = struct {
    // Deterministic seed for key generation (d || z from FIPS 203)
    Seed           []byte
    // Expected encapsulation key (public key)
    ExpectedEK     []byte
    // Expected decapsulation key (private key)
    ExpectedDK     []byte
    // Encapsulation randomness (m from FIPS 203)
    EncapRandom    []byte
    // Expected ciphertext
    ExpectedCT     []byte
    // Expected shared secret (K from FIPS 203)
    ExpectedSS     []byte
}{
    Seed: hexDecode("7c9935a0b07694aa0c6d10e4db6b1add2fd81a25ccb148032dcd739936737f2d" +
        "b505d7cfad1b497499323c8686325e4792f267aafa3d2b8c4f2f6b4c5c23f2b6"),
    ExpectedEK: hexDecode("a4b3c2..."), // 1184 bytes - truncated for brevity
    ExpectedDK: hexDecode("24af7a..."), // 2400 bytes - truncated for brevity
    EncapRandom: hexDecode("147c03f7a5bebba406c8fae1874d7f13c80efe79a3a9a874cc09fe76f6997615"),
    ExpectedCT: hexDecode("94a8c0..."), // 1088 bytes - truncated for brevity
    ExpectedSS: hexDecode("d11b12bb2b6438e5d2dbbfc28a0c74f3a5e6f2ebc30fb6e99c9f8c7c92f7e4c1"),
}

// ValidateFIPS203Compliance runs NIST test vectors
func ValidateFIPS203Compliance() error {
    // Test ML-KEM-512
    if err := runKATTest(mlkem.MLKEM512, MLKEM512TestVector); err != nil {
        return fmt.Errorf("ML-KEM-512 KAT failed: %w", err)
    }

    // Test ML-KEM-768
    if err := runKATTest(mlkem.MLKEM768, MLKEM768TestVector); err != nil {
        return fmt.Errorf("ML-KEM-768 KAT failed: %w", err)
    }

    // Test ML-KEM-1024
    if err := runKATTest(mlkem.MLKEM1024, MLKEM1024TestVector); err != nil {
        return fmt.Errorf("ML-KEM-1024 KAT failed: %w", err)
    }

    return nil
}

func runKATTest(mode mlkem.Mode, tv TestVector) error {
    // 1. Deterministic key generation from seed
    ek, dk, err := mlkem.GenerateKeyDeterministic(mode, tv.Seed)
    if err != nil {
        return fmt.Errorf("keygen failed: %w", err)
    }

    if !bytes.Equal(ek.Bytes(), tv.ExpectedEK) {
        return errors.New("encapsulation key mismatch")
    }

    if !bytes.Equal(dk.Bytes(), tv.ExpectedDK) {
        return errors.New("decapsulation key mismatch")
    }

    // 2. Deterministic encapsulation
    ct, ss, err := ek.EncapsulateDeterministic(tv.EncapRandom)
    if err != nil {
        return fmt.Errorf("encapsulation failed: %w", err)
    }

    if !bytes.Equal(ct, tv.ExpectedCT) {
        return errors.New("ciphertext mismatch")
    }

    if !bytes.Equal(ss, tv.ExpectedSS) {
        return errors.New("shared secret mismatch (encap)")
    }

    // 3. Decapsulation
    ssDecap, err := dk.Decapsulate(ct)
    if err != nil {
        return fmt.Errorf("decapsulation failed: %w", err)
    }

    if !bytes.Equal(ssDecap, tv.ExpectedSS) {
        return errors.New("shared secret mismatch (decap)")
    }

    return nil
}
```

#### FIPS 203 Parameter Validation

```go
// FIPS 203 Section 7 - Parameter Sets
// Implementations MUST validate these parameters at initialization

type FIPS203Params struct {
    // Module rank (k)
    K             int
    // Ring dimension (n = 256 for all parameter sets)
    N             int
    // Modulus (q = 3329 for all parameter sets)
    Q             int
    // Compression parameters
    Du            int  // d_u - ciphertext compression
    Dv            int  // d_v - ciphertext compression
    // Noise parameters
    Eta1          int  // CBD parameter for s and e
    Eta2          int  // CBD parameter for e_1 and e_2
}

var FIPS203ParamSets = map[mlkem.Mode]FIPS203Params{
    mlkem.MLKEM512:  {K: 2, N: 256, Q: 3329, Du: 10, Dv: 4, Eta1: 3, Eta2: 2},
    mlkem.MLKEM768:  {K: 3, N: 256, Q: 3329, Du: 10, Dv: 4, Eta1: 2, Eta2: 2},
    mlkem.MLKEM1024: {K: 4, N: 256, Q: 3329, Du: 11, Dv: 5, Eta1: 2, Eta2: 2},
}

// ValidateParams ensures parameters match FIPS 203 specification
func ValidateParams(mode mlkem.Mode) error {
    params, ok := FIPS203ParamSets[mode]
    if !ok {
        return ErrInvalidParameterSet
    }

    // Verify derived sizes
    ekSize := 384*params.K + 32                      // Encapsulation key size
    dkSize := 768*params.K + 96                      // Decapsulation key size
    ctSize := 32*(params.Du*params.K + params.Dv)   // Ciphertext size

    if ekSize != mlkem.GetPublicKeySize(mode) {
        return fmt.Errorf("encapsulation key size mismatch: expected %d, got %d",
            ekSize, mlkem.GetPublicKeySize(mode))
    }

    if dkSize != mlkem.GetPrivateKeySize(mode) {
        return fmt.Errorf("decapsulation key size mismatch: expected %d, got %d",
            dkSize, mlkem.GetPrivateKeySize(mode))
    }

    if ctSize != mlkem.GetCiphertextSize(mode) {
        return fmt.Errorf("ciphertext size mismatch: expected %d, got %d",
            ctSize, mlkem.GetCiphertextSize(mode))
    }

    return nil
}
```

#### Decapsulation Failure Handling (FIPS 203 Section 6.3)

```go
// FIPS 203 requires implicit rejection for invalid ciphertexts
// Decapsulation MUST NOT reveal whether decapsulation succeeded or failed

func (dk *DecapsulationKey) Decapsulate(ciphertext []byte) ([]byte, error) {
    // FIPS 203 Algorithm 17: ML-KEM.Decaps
    //
    // The decapsulation MUST be implemented to run in constant time
    // and MUST return a pseudorandom value on failure (implicit rejection)
    //
    // This prevents chosen-ciphertext attacks by not revealing
    // whether the ciphertext was valid

    // 1. Validate ciphertext length (this check is allowed to branch)
    if len(ciphertext) != mlkem.GetCiphertextSize(dk.mode) {
        return nil, ErrInvalidCiphertextSize
    }

    // 2. Perform decapsulation with implicit rejection
    // If ciphertext is invalid, returns H(z || c) instead of error
    // where z is the implicit rejection key stored in dk
    sharedSecret := dk.decapsulateInternal(ciphertext)

    return sharedSecret, nil
}
```

### Key Derivation Functions

K-Chain uses HKDF (RFC 5869) and KMAC (NIST SP 800-185) for key derivation operations.

#### HKDF Specification

```go
import (
    "crypto/sha256"
    "crypto/sha512"
    "io"

    "golang.org/x/crypto/hkdf"
)

// KDFParams defines key derivation parameters
type KDFParams struct {
    Algorithm    KDFAlgorithm      // HKDF-SHA256, HKDF-SHA512, KMAC256
    Salt         []byte            // Optional salt (RECOMMENDED)
    Info         []byte            // Context-specific info
    OutputLength int               // Desired key length in bytes
}

type KDFAlgorithm uint8

const (
    KDFAlgorithmHKDFSHA256 KDFAlgorithm = 0x01
    KDFAlgorithmHKDFSHA512 KDFAlgorithm = 0x02
    KDFAlgorithmKMAC256    KDFAlgorithm = 0x03
)

// DeriveKey derives a cryptographic key from input key material
func DeriveKey(ikm []byte, params *KDFParams) ([]byte, error) {
    if len(ikm) < 16 {
        return nil, ErrIKMTooShort
    }

    switch params.Algorithm {
    case KDFAlgorithmHKDFSHA256:
        return deriveHKDF(sha256.New, ikm, params)
    case KDFAlgorithmHKDFSHA512:
        return deriveHKDF(sha512.New, ikm, params)
    case KDFAlgorithmKMAC256:
        return deriveKMAC256(ikm, params)
    default:
        return nil, ErrUnsupportedKDF
    }
}

func deriveHKDF(hash func() hash.Hash, ikm []byte, params *KDFParams) ([]byte, error) {
    // HKDF per RFC 5869
    reader := hkdf.New(hash, ikm, params.Salt, params.Info)

    key := make([]byte, params.OutputLength)
    if _, err := io.ReadFull(reader, key); err != nil {
        return nil, fmt.Errorf("HKDF expansion failed: %w", err)
    }

    return key, nil
}

func deriveKMAC256(ikm []byte, params *KDFParams) ([]byte, error) {
    // KMAC256 per NIST SP 800-185
    // Using customization string for domain separation
    customization := append([]byte("K-Chain-KDF-v1"), params.Info...)
    return kmac.NewKMAC256(ikm, params.OutputLength, customization).Sum(nil), nil
}
```

#### Key Derivation Contexts

```go
// K-Chain defined info strings for domain separation
// Each context MUST use a unique info string to prevent key reuse

const (
    // Envelope encryption DEK wrapping
    KDFInfoDEKWrap = "LUX-K-Chain-DEK-Wrap-v1"

    // Hybrid mode key combination
    KDFInfoHybrid = "LUX-K-Chain-Hybrid-v1"

    // Session key derivation from shared secret
    KDFInfoSession = "LUX-K-Chain-Session-v1"

    // Secret encryption key derivation
    KDFInfoSecretEnc = "LUX-K-Chain-Secret-Enc-v1"

    // Authentication key derivation
    KDFInfoAuth = "LUX-K-Chain-Auth-v1"

    // T-Chain threshold key derivation
    KDFInfoThreshold = "LUX-K-Chain-Threshold-v1"
)

// DeriveSessionKey derives encryption key from ML-KEM shared secret
func DeriveSessionKey(sharedSecret []byte, purpose string) ([]byte, error) {
    params := &KDFParams{
        Algorithm:    KDFAlgorithmHKDFSHA256,
        Salt:         nil, // Salt is optional for ML-KEM derived secrets
        Info:         []byte(purpose),
        OutputLength: 32, // 256-bit AES key
    }

    return DeriveKey(sharedSecret, params)
}

// DeriveHybridKey combines ML-KEM and ECDH shared secrets
func DeriveHybridKey(mlkemSS, ecdhSS []byte) ([]byte, error) {
    // Per IETF draft-ietf-tls-hybrid-design:
    // Combined secret = KDF(mlkemSS || ecdhSS)
    combinedIKM := append(mlkemSS, ecdhSS...)
    defer zeroBytes(combinedIKM)

    params := &KDFParams{
        Algorithm:    KDFAlgorithmHKDFSHA256,
        Salt:         nil,
        Info:         []byte(KDFInfoHybrid),
        OutputLength: 32,
    }

    return DeriveKey(combinedIKM, params)
}

// KeyHierarchy defines the key derivation tree
// Root Key -> [KEK, Auth Key, Session Keys...]
type KeyHierarchy struct {
    RootKeyID     ids.ID            // Master key (from ML-KEM or T-Chain)
    DerivedKeys   map[string]ids.ID // Purpose -> Derived Key ID
    DerivationLog []DerivationEntry // Audit trail
}

type DerivationEntry struct {
    ParentKeyID   ids.ID
    ChildKeyID    ids.ID
    Purpose       string
    KDFParams     KDFParams
    DerivedAt     uint64
}
```

### Consensus Parameters

```go
var DefaultKMSParams = Parameters{
    // Block Production
    BlockInterval:      2 * time.Second,
    MaxBlockSize:       2 * 1024 * 1024,  // 2MB

    // Key Limits
    MaxKeysPerOwner:    1000,
    MaxSecretsPerOwner: 10000,
    MaxSecretSize:      1 * 1024 * 1024,  // 1MB per secret

    // ML-KEM Settings
    DefaultAlgorithm:   MLKEM768,         // Recommended default
    HybridByDefault:    true,             // Enable hybrid mode by default

    // Economic
    BaseKeyGenFee:      1 * units.LUX,
    EncapsulationFee:   0.01 * units.LUX,
    StorageFeePerKB:    0.001 * units.LUX,
    RetrievalFee:       0.005 * units.LUX,

    // Security
    KeyRotationInterval: 30 * 24 * 7200,  // 30 days in blocks
    MaxKeyAge:          365 * 24 * 7200,   // 1 year
    AuditRetention:     90 * 24 * 7200,    // 90 days

    // T-Chain Integration
    ThresholdDecryptTimeout: 300,         // 5 minutes in blocks
    MaxPendingDecrypts:      100,
}
```

## Rationale

### Why Dedicated K-Chain?

1. **Separation of Concerns**: Key management requires specialized security handling distinct from general computation
2. **Predictable Performance**: Dedicated chain ensures encryption operations aren't delayed by other workloads
3. **Security Boundary**: Isolates key material handling from application logic
4. **Audit Compliance**: Dedicated chain provides clear audit trail for key operations

### Why ML-KEM (FIPS 203)?

1. **NIST Standardization**: FIPS 203 is the official US government standard for post-quantum KEM
2. **Mature Cryptanalysis**: Based on CRYSTALS-Kyber, extensively analyzed since 2017
3. **Performance**: Efficient key generation, encapsulation, and decapsulation
4. **Security Margin**: Multiple parameter sets for different security levels

### Why Hybrid Mode?

During the transition to post-quantum cryptography:
1. **Defense in Depth**: If ML-KEM has undiscovered weaknesses, ECDH provides backup
2. **Regulatory Compliance**: Some standards still require classical cryptography
3. **Interoperability**: Enables gradual migration from classical systems

### Why T-Chain Integration?

1. **Distributed Trust**: No single party holds complete decryption capability
2. **Threshold Access**: M-of-N approval for sensitive secrets
3. **Key Recovery**: Threshold scheme enables recovery if some parties are unavailable
4. **Audit Trail**: T-Chain provides signed attestations of decryption approvals

## Backwards Compatibility

K-Chain is a new subnet; no backwards compatibility concerns.

### Integration with Existing Chains

- **B-Chain**: Uses K-Chain for bridge message encryption
- **C-Chain**: Contracts can store encrypted state via K-Chain precompile
- **T-Chain**: Provides threshold decryption for K-Chain secrets
- **IPFS**: Encrypted file storage with K-Chain key management

### Migration Path for Existing Systems

Applications using external KMS can migrate:
1. Generate new ML-KEM keys on K-Chain
2. Re-encrypt existing secrets with K-Chain keys
3. Update applications to use K-Chain RPC
4. Deprecate external KMS dependencies

## Test Cases

### Unit Tests

```go
func TestMLKEMKeyGeneration(t *testing.T) {
    for _, algo := range []MLKEMAlgorithm{MLKEM512, MLKEM768, MLKEM1024} {
        t.Run(algo.String(), func(t *testing.T) {
            tx := &KeyGenTx{
                KeyID:     fmt.Sprintf("test-%s", algo),
                Algorithm: algo,
                Owner:     testOwner,
            }

            key, err := tx.Execute(state)
            require.NoError(t, err)

            params := MLKEMParameters[algo]
            require.Len(t, key.PublicKey, params.PublicKeySize)
            require.Equal(t, KeyStatusActive, key.Status)
        })
    }
}

func TestMLKEMEncapsulateDecapsulate(t *testing.T) {
    // Generate key
    key := generateTestKey(t, MLKEM768)

    // Encapsulate
    encapTx := &EncapsulateTx{
        EncapsulationKeyID: key.KeyID,
        HybridMode:         false,
    }

    result, err := encapTx.Execute(state)
    require.NoError(t, err)
    require.Len(t, result.SharedSecret, 32)

    // Decapsulate
    decapTx := &DecapsulateTx{
        KeyID:      key.KeyID,
        Ciphertext: result.Ciphertext,
        Requester:  testOwner,
    }

    recoveredSecret, err := decapTx.Execute(state)
    require.NoError(t, err)

    // Verify shared secrets match
    require.Equal(t, result.SharedSecret, recoveredSecret)
}

func TestHybridMode(t *testing.T) {
    // Generate hybrid key
    key := generateTestKey(t, MLKEM768)
    key.HybridEnabled = true
    key.ECDHPublicKey = generateX25519Public()

    // Generate ephemeral ECDH key
    ephemeralPub, ephemeralSK := x25519.GenerateKey()

    // Encapsulate in hybrid mode
    encapTx := &EncapsulateTx{
        EncapsulationKeyID: key.KeyID,
        HybridMode:         true,
        EphemeralECDHKey:   ephemeralPub,
    }

    result, err := encapTx.Execute(state)
    require.NoError(t, err)
    require.NotNil(t, result.ECDHCiphertext)

    // Decapsulate in hybrid mode
    decapTx := &DecapsulateTx{
        KeyID:          key.KeyID,
        Ciphertext:     result.Ciphertext,
        HybridMode:     true,
        ECDHCiphertext: result.ECDHCiphertext,
        Requester:      testOwner,
    }

    recoveredSecret, err := decapTx.Execute(state)
    require.NoError(t, err)
    require.Equal(t, result.SharedSecret, recoveredSecret)
}

func TestEnvelopeEncryption(t *testing.T) {
    // Setup KEK
    kek := generateTestKey(t, MLKEM768)

    // Create envelope encryption
    envelope := &EnvelopeEncryption{
        KEKReference: kek.KeyID,
        DEKAlgorithm: AES256GCM,
        DEKSize:      256,
    }

    // Encrypt data
    plaintext := []byte("sensitive secret data")
    encrypted, err := envelope.EncryptData(state, plaintext, testOwner)
    require.NoError(t, err)

    // Decrypt data
    decrypted, err := envelope.DecryptData(state, encrypted, testOwner)
    require.NoError(t, err)

    require.Equal(t, plaintext, decrypted)
}

func TestAccessPolicy(t *testing.T) {
    policy := &AccessPolicy{
        PolicyID:  "test-policy",
        Owner:     testOwner,
        AllowList: []Address{testOwner, authorizedUser},
        TimeConstraints: &TimeConstraints{
            NotBefore: uint64(time.Now().Unix()),
            NotAfter:  uint64(time.Now().Add(24 * time.Hour).Unix()),
        },
    }

    // Owner should have access
    require.NoError(t, policy.CheckAccess(testOwner, nil))

    // Authorized user should have access
    require.NoError(t, policy.CheckAccess(authorizedUser, nil))

    // Unauthorized user should be denied
    err := policy.CheckAccess(unauthorizedUser, nil)
    require.ErrorIs(t, err, ErrNotInAllowList)
}

func TestMultiPartyAuth(t *testing.T) {
    policy := &AccessPolicy{
        PolicyID: "mpa-policy",
        Owner:    testOwner,
        MultiPartyAuth: &MultiPartyAuth{
            RequiredApprovals: 2,
            Approvers:         []Address{approver1, approver2, approver3},
            ApprovalTimeout:   100,
        },
    }

    // Access should fail without approvals
    err := policy.CheckAccess(testOwner, nil)
    require.ErrorIs(t, err, ErrInsufficientApprovals)

    // Add approvals
    policy.MultiPartyAuth.CurrentApprovals[approver1] = currentBlock
    policy.MultiPartyAuth.CurrentApprovals[approver2] = currentBlock

    // Access should succeed with 2 approvals
    require.NoError(t, policy.CheckAccess(testOwner, nil))
}

func TestSecretStorage(t *testing.T) {
    // Create encryption key
    encKey := createTestEncryptionKey(t)

    // Create policy
    policy := createTestPolicy(t)

    // Encrypt secret client-side
    plaintext := []byte("super secret api key")
    ciphertext, nonce, tag := encryptLocally(plaintext, encKey)

    // Store secret
    storeTx := &StoreSecretTx{
        SecretID:        "api-key-001",
        Ciphertext:      ciphertext,
        Nonce:           nonce,
        Tag:             tag,
        EncryptionKeyID: encKey.KeyID,
        Algorithm:       AES256GCM,
        PlaintextHash:   sha256.Sum256(plaintext),
        SecretType:      TypeAPIKey,
        PolicyID:        policy.PolicyID,
        Owner:           testOwner,
    }

    secret, err := storeTx.Execute(state)
    require.NoError(t, err)
    require.Equal(t, uint32(1), secret.Version)

    // Verify audit log entry
    require.Len(t, state.AuditLog, 1)
    require.Equal(t, "secret_stored", state.AuditLog[0].Action)
}
```

### Integration Tests

```go
func TestEndToEndBridgeEncryption(t *testing.T) {
    // 1. Generate ML-KEM key on K-Chain
    keyTx := &KeyGenTx{
        KeyID:         "bridge-key",
        Algorithm:     MLKEM768,
        HybridEnabled: true,
        Purpose:       "Bridge message encryption",
    }
    key, err := keyTx.Execute(state)
    require.NoError(t, err)

    // 2. B-Chain encapsulates to establish shared secret
    bridgeMessage := []byte("transfer 1000 USDC to 0x...")

    encapResult, err := EncapsulateForBridge(key.KeyID, bridgeMessage)
    require.NoError(t, err)

    // 3. Message transmitted with ciphertext
    warpMsg := &WarpMessage{
        Payload:         encapResult.EncryptedMessage,
        KEMCiphertext:   encapResult.Ciphertext,
        ECDHCiphertext:  encapResult.ECDHCiphertext,
    }

    // 4. Destination decapsulates and decrypts
    decrypted, err := DecapsulateAndDecrypt(key.KeyID, warpMsg)
    require.NoError(t, err)
    require.Equal(t, bridgeMessage, decrypted)
}

func TestThresholdDecryption(t *testing.T) {
    // Setup K-Chain secret with T-Chain binding
    encKey := createThresholdBoundKey(t, "tchain-key-001", 3, 5)
    secret := storeThresholdSecret(t, encKey, []byte("threshold-protected-data"))

    // Request threshold decryption
    decryptTx := &ThresholdDecryptTx{
        SecretID:       secret.SecretID,
        TChainKeyID:    "tchain-key-001",
        RequiredShares: 3,
        Requester:      testOwner,
        Deadline:       currentBlock + 100,
    }

    request, err := decryptTx.Execute(state)
    require.NoError(t, err)
    require.Equal(t, RequestStatusPending, request.Status)

    // Simulate T-Chain response (3 of 5 signers participate)
    simulateTChainDecryption(t, request.RequestID, 3)

    // Verify decryption completed
    request = state.PendingDecrypts[request.RequestID]
    require.Equal(t, RequestStatusCompleted, request.Status)
}
```

## Reference Implementation

### Repository Structure

```
github.com/luxfi/node/vms/kmsvm/
├── vm.go                   # KeyManagementVM implementation
├── state.go                # State management
├── block.go                # Block structure and validation
├── tx/
│   ├── keygen.go           # KeyGenTx
│   ├── encapsulate.go      # EncapsulateTx
│   ├── decapsulate.go      # DecapsulateTx
│   ├── encrypt.go          # EncryptTx
│   ├── decrypt.go          # DecryptTx
│   ├── store_secret.go     # StoreSecretTx
│   ├── retrieve_secret.go  # RetrieveSecretTx
│   ├── rotate_key.go       # RotateKeyTx
│   ├── create_policy.go    # CreatePolicyTx
│   └── threshold_decrypt.go # ThresholdDecryptTx
├── crypto/
│   ├── mlkem/              # ML-KEM implementation (FIPS 203)
│   │   ├── keygen.go
│   │   ├── encapsulate.go
│   │   └── decapsulate.go
│   ├── hybrid/             # Hybrid ML-KEM + X25519
│   ├── envelope/           # Envelope encryption
│   └── streaming/          # Streaming encryption
├── policy/
│   ├── access.go           # Access control engine
│   ├── time.go             # Time constraints
│   └── multiparty.go       # Multi-party auth
├── storage/
│   ├── secrets.go          # Secret storage
│   └── ipfs.go             # IPFS integration
├── rpc/
│   ├── service.go          # JSON-RPC handlers
│   └── types.go            # RPC request/response types
├── tchain/
│   ├── bridge.go           # T-Chain integration
│   └── threshold.go        # Threshold decryption
└── config.go               # Chain configuration

github.com/luxfi/crypto/mlkem/
├── params.go               # ML-KEM parameters (FIPS 203)
├── keygen.go               # Key generation
├── encaps.go               # Encapsulation
├── decaps.go               # Decapsulation
├── ntt.go                  # Number Theoretic Transform
├── poly.go                 # Polynomial operations
├── sampling.go             # Noise sampling
└── compress.go             # Compression functions

github.com/luxfi/sdk/kms/
├── client.go               # KMS client
├── keys.go                 # Key management
├── secrets.go              # Secret operations
├── encrypt.go              # Encryption helpers
└── policy.go               # Policy management
```

## Security Considerations

### Key Management

1. **Secret Key Protection**: Private keys MUST be encrypted at rest with owner-derived keys
2. **Memory Security**: Sensitive data MUST be zeroed after use
3. **Hardware Binding**: Where available, keys SHOULD be bound to TPM/HSM
4. **Backup Procedures**: Key backup MUST use threshold encryption via T-Chain

### Network Security

1. **TLS Requirements**: All RPC connections MUST use TLS 1.3
2. **Authentication**: All write operations MUST be authenticated
3. **Rate Limiting**: API endpoints MUST implement rate limiting
4. **DoS Protection**: Large payload requests MUST be resource-limited

### Operational Security

1. **Key Rotation**: Keys SHOULD be rotated according to security tier
2. **Audit Logging**: All access attempts MUST be logged
3. **Incident Response**: Clear procedures for key compromise
4. **Monitoring**: Real-time alerting for anomalous access patterns

### Post-Quantum Considerations

1. **Algorithm Agility**: Design supports algorithm upgrades
2. **Key Size Growth**: Storage accounts for larger post-quantum keys
3. **Hybrid Recommended**: Hybrid mode provides transition security
4. **Long-Term Secrets**: Use ML-KEM-1024 for secrets with >10 year lifespan

## Economic Impact

### Fee Structure

| Operation | Base Fee | Variable Fee |
|-----------|----------|--------------|
| Key Generation (ML-KEM-512) | 0.5 LUX | - |
| Key Generation (ML-KEM-768) | 1.0 LUX | - |
| Key Generation (ML-KEM-1024) | 1.5 LUX | - |
| Encapsulation | 0.01 LUX | - |
| Decapsulation | 0.02 LUX | - |
| Secret Storage | 0.05 LUX | 0.001 LUX/KB |
| Secret Retrieval | 0.01 LUX | - |
| Key Rotation | 0.5 LUX | 0.01 LUX/secret re-encrypted |
| Threshold Decrypt | 0.1 LUX | T-Chain fees |

### Resource Consumption

ML-KEM operations are computationally efficient:

| Operation | ML-KEM-512 | ML-KEM-768 | ML-KEM-1024 |
|-----------|------------|------------|-------------|
| KeyGen | ~0.1ms | ~0.2ms | ~0.3ms |
| Encapsulate | ~0.05ms | ~0.07ms | ~0.1ms |
| Decapsulate | ~0.07ms | ~0.1ms | ~0.13ms |

## Open Questions

1. **Key Escrow**: Should there be a governance-controlled key recovery mechanism?
2. **Compliance Modes**: Do we need FIPS-validated implementations for enterprise?
3. **Cross-Chain Discovery**: How should other chains discover available K-Chain keys?
4. **Pricing Model**: Should storage fees be time-based (rent) or one-time?

## Future Work

1. **Additional PQ Algorithms**: Support for ML-DSA (FIPS 204) and SLH-DSA (FIPS 205)
2. **Hardware Security**: HSM and TPM integration for key protection
3. **Searchable Encryption**: Enable queries on encrypted data
4. **Zero-Knowledge Proofs**: Prove properties without revealing secrets
5. **Homomorphic Encryption**: Computation on encrypted data

## References

### Normative References

1. Bradner, S. (1997). **RFC 2119: Key words for use in RFCs to Indicate Requirement Levels**. https://www.rfc-editor.org/rfc/rfc2119
2. Leiba, B. (2017). **RFC 8174: Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words**. https://www.rfc-editor.org/rfc/rfc8174
3. NIST. (2024). **FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard**. https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf
4. NIST. (2007). **SP 800-38D: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC**. https://csrc.nist.gov/publications/detail/sp/800-38d/final
5. Schaad, J. & Housley, R. (2002). **RFC 3394: Advanced Encryption Standard (AES) Key Wrap Algorithm**. https://www.rfc-editor.org/rfc/rfc3394
6. Krawczyk, H. & Eronen, P. (2010). **RFC 5869: HMAC-based Extract-and-Expand Key Derivation Function (HKDF)**. https://www.rfc-editor.org/rfc/rfc5869
7. NIST. (2016). **SP 800-185: SHA-3 Derived Functions: cSHAKE, KMAC, TupleHash, and ParallelHash**. https://csrc.nist.gov/publications/detail/sp/800-185/final
8. Nir, Y. & Langley, A. (2018). **RFC 8439: ChaCha20 and Poly1305 for IETF Protocols**. https://www.rfc-editor.org/rfc/rfc8439

### Informative References

9. NIST. (2024). **Post-Quantum Cryptography Standards Announcement**. https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards
10. Avanzi, R., et al. (2022). **CRYSTALS-Kyber: Algorithm Specification and Supporting Documentation**. NIST PQC Round 3 Submission.
11. Langley, A. (2019). **Hybrid Key Encapsulation**. IETF draft-ietf-tls-hybrid-design.
12. Bernstein, D.J., & Lange, T. (2017). **Post-quantum cryptography**. Nature 549, 188-194.
13. Shor, P.W. (1994). **Algorithms for quantum computation: discrete logarithms and factoring**. FOCS 1994.
14. Rogaway, P. (2002). **Authenticated-encryption with associated-data**. CCS 2002.
15. OASIS. (2015). **PKCS #11 Cryptographic Token Interface Standard v2.40**. http://docs.oasis-open.org/pkcs11/pkcs11-base/v2.40/pkcs11-base-v2.40.html
16. Jones, M. & Hildebrand, J. (2015). **RFC 7516: JSON Web Encryption (JWE)**. https://www.rfc-editor.org/rfc/rfc7516

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
