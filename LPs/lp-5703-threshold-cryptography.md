---
lp: 5703
title: Threshold Cryptography (lux/threshold)
description: High-level orchestration for all threshold protocols - signatures, FHE, resharing, post-quantum
author: Lux Core Team
discussions-to: https://github.com/luxfi/LPs/discussions/5703
status: Final
type: Standards Track
category: Core
created: 2025-12-30
requires: [5700, 5701, 5702]
---

# LP-5703: Threshold Cryptography

## Abstract

This LP specifies the threshold cryptography library (`lux/threshold`) as the **HIGH-LEVEL ORCHESTRATION LAYER** for all threshold protocols in the Lux ecosystem. It is the single meeting point where applications consume threshold operations:

- **Threshold Signatures**: CMP (ECDSA), FROST (Schnorr/EdDSA), Doerner (2-of-2), BLS
- **Threshold FHE**: Collective decryption, key refresh using lux/fhe primitives
- **Dynamic Resharing**: LSS protocol for adding/removing parties
- **Post-Quantum**: Ringtail lattice-based signatures using lux/lattice primitives
- **Chain Adapters**: 20+ blockchain-specific signature encoding

The library consumes primitives from lower layers (lux/fhe, lux/crypto, lux/lattice) and provides a unified API for applications like thresholdvm, bridges, and custody solutions.

## Motivation

Threshold cryptography addresses critical security requirements:

- **Custody Solutions**: No single party controls the full private key
- **Bridge Security**: Multi-validator signing for cross-chain transfers
- **Confidential Compute**: Threshold FHE decryption without key reconstruction
- **Hot Wallet Protection**: Compromise of t-1 parties doesn't leak key
- **Regulatory Compliance**: Multi-sig with key separation requirements
- **Key Rotation**: Add/remove parties without changing public key

**Key Design Decision**: `lux/threshold` is the HIGH-LEVEL package that applications import. It consumes primitives from lux/fhe (for threshold FHE), lux/crypto (for signature primitives), and lux/lattice (for post-quantum and multiparty protocols). This avoids circular dependencies and provides a unified API.

Key features required:

1. **Multi-Chain**: Native support for ECDSA, EdDSA, Schnorr, BLS
2. **Threshold FHE**: Collective decryption using lux/fhe primitives
3. **Dynamic Resharing**: Modify threshold without key reconstruction
4. **Post-Quantum**: Lattice-based signatures for future-proofing
5. **Performance**: Sub-25ms signing for real-time applications

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        lux/threshold (Go Library)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │                       Protocol Layer                               │     │
│   │                                                                    │     │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│     │
│   │   │   CMP   │  │  FROST  │  │   LSS   │  │ Doerner │  │  BLS   ││     │
│   │   │  ECDSA  │  │ Schnorr │  │ Reshare │  │  2-of-2 │  │Aggregate│     │
│   │   │4-round  │  │ 2-round │  │ Dynamic │  │Optimized│  │         ││     │
│   │   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬───┘│     │
│   │        └────────────┴───────────┴────────────┴────────────┘     │     │
│   └────────────────────────────┬────────────────────────────────────┘     │
│                                │                                            │
│   ┌────────────────────────────▼────────────────────────────────────┐     │
│   │                     Chain Adapters                               │     │
│   │                                                                  │     │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │     │
│   │   │Ethereum │ │ Bitcoin │ │ Solana  │ │  XRPL   │ │   TON   │  │     │
│   │   │  ECDSA  │ │ECDSA+Sch│ │ EdDSA   │ │ECDSA/Ed │ │ EdDSA   │  │     │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │     │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │     │
│   │   │Cardano  │ │ Cosmos  │ │Polkadot │ │  NEAR   │ │  Aptos  │  │     │
│   │   │Ed/EC/Sch│ │ ECDSA   │ │ Schnorr │ │ EdDSA   │ │ EdDSA   │  │     │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │     │
│   │   + Sui, Tezos, Algorand, Stellar, Hedera, Flow, Kadena, Mina  │     │
│   └────────────────────────────┬────────────────────────────────────┘     │
│                                │                                            │
│   ┌────────────────────────────▼────────────────────────────────────┐     │
│   │                    Cryptographic Primitives                      │     │
│   │                                                                  │     │
│   │   ┌────────────────┐    ┌────────────────┐    ┌──────────────┐  │     │
│   │   │  pkg/math/     │    │  pkg/zk/       │    │  internal/   │  │     │
│   │   │  curve, poly,  │    │  17 ZK proofs  │    │  paillier,   │  │     │
│   │   │  sample        │    │  (Schnorr,     │    │  elgamal,    │  │     │
│   │   │                │    │   range, etc)  │    │  mta, ot     │  │     │
│   │   └────────────────┘    └────────────────┘    └──────────────┘  │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │                    Post-Quantum Layer                            │     │
│   │                                                                  │     │
│   │   ┌────────────────────────────────────────────────────────┐    │     │
│   │   │                    Ringtail                             │    │     │
│   │   │   Lattice-based threshold signatures (128/192/256-bit) │    │     │
│   │   │   Compatible with all chain adapters via wrapper        │    │     │
│   │   └────────────────────────────────────────────────────────┘    │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Protocol Interfaces

#### CMP Protocol (ECDSA)

```go
// Package cmp implements the CMP threshold ECDSA protocol.
package cmp

import (
    "github.com/luxfi/threshold/pkg/math/curve"
    "github.com/luxfi/threshold/pkg/party"
    "github.com/luxfi/threshold/pkg/pool"
    "github.com/luxfi/threshold/pkg/protocol"
)

// Config is the per-party configuration from key generation.
type Config struct {
    Threshold int           // t in t-of-n
    PublicKey curve.Point   // Combined public key
    // Secret share and auxiliary data
}

// Keygen performs distributed key generation.
// Returns configurations for all parties.
func Keygen(
    group curve.Curve,
    selfID party.ID,
    parties []party.ID,
    threshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// Presign generates preprocessing for signing.
// Enables 3-round online signing instead of 7-round.
type PreSignature struct {
    // Preprocessed values for fast signing
}

func Presign(
    config *Config,
    signers []party.ID,
    pl *pool.Pool,
) (*PreSignature, error)

// Sign creates a threshold ECDSA signature.
// With presignature: 3 rounds. Without: 7 rounds.
func Sign(
    config *Config,
    presig *PreSignature,  // nil for full protocol
    signers []party.ID,
    message []byte,
    pl *pool.Pool,
) (*ecdsa.Signature, error)

// SignWithAbortIdentification signs with identifiable abort capability.
// If signing fails due to malicious party, returns their ID.
func SignWithAbortIdentification(
    config *Config,
    signers []party.ID,
    message []byte,
    pl *pool.Pool,
) (*ecdsa.Signature, *party.ID, error)

// Refresh updates key shares without changing public key.
func Refresh(
    config *Config,
    parties []party.ID,
    pl *pool.Pool,
) (*Config, error)
```

#### FROST Protocol (Schnorr/EdDSA)

```go
// Package frost implements FROST threshold Schnorr/EdDSA.
package frost

import (
    "github.com/luxfi/threshold/pkg/math/curve"
    "github.com/luxfi/threshold/pkg/party"
    "github.com/luxfi/threshold/pkg/pool"
    "github.com/luxfi/threshold/pkg/taproot"
)

// Config is the per-party FROST configuration.
type Config struct {
    Threshold int
    PublicKey curve.Point
    // Secret share
}

// KeygenTaproot generates BIP-340 compatible keys.
// Output key is x-only (32 bytes) per BIP-340/341.
func KeygenTaproot(
    selfID party.ID,
    parties []party.ID,
    threshold int,
    pl *pool.Pool,
) (map[party.ID]*TaprootConfig, error)

// TaprootConfig includes BIP-340 specific data.
type TaprootConfig struct {
    *Config
    TweakedPublicKey []byte  // 32-byte x-only key
    Tweak            []byte  // Taproot tweak
}

// Keygen performs distributed key generation.
func Keygen(
    group curve.Curve,
    selfID party.ID,
    parties []party.ID,
    threshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// Sign creates a threshold Schnorr/EdDSA signature.
// Only 2 rounds for online signing.
func Sign(
    config *Config,
    signers []party.ID,
    message []byte,
    pl *pool.Pool,
) (*Signature, error)

// SignTaproot creates a BIP-340 compatible signature.
func SignTaproot(
    config *TaprootConfig,
    signers []party.ID,
    message []byte,
    pl *pool.Pool,
) ([]byte, error)  // 64-byte Schnorr signature

// Signature is a threshold Schnorr signature.
type Signature struct {
    R curve.Point
    Z curve.Scalar
}

// Verify verifies a FROST signature.
func (sig *Signature) Verify(publicKey curve.Point, message []byte) bool
```

#### LSS Protocol (Dynamic Resharing)

```go
// Package lss implements Linear Secret Sharing with dynamic resharing.
package lss

import (
    "github.com/luxfi/threshold/pkg/party"
    "github.com/luxfi/threshold/pkg/pool"
)

// Config is the LSS configuration.
type Config struct {
    Generation int           // Key generation epoch
    Threshold  int           // Current threshold
    Parties    []party.ID    // Current party set
    PublicKey  curve.Point   // Public key (unchanged across reshares)
    // Secret share for this generation
}

// Reshare redistributes shares to a new party set.
// Can change threshold and add/remove parties.
// Public key remains the same.
func Reshare(
    oldConfigs []*Config,
    newParties []party.ID,
    newThreshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// AddParties adds new parties while keeping existing ones.
func AddParties(
    configs []*Config,
    newParties []party.ID,
    newThreshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// RemoveParties removes parties from the scheme.
// Must have at least threshold parties remaining.
func RemoveParties(
    configs []*Config,
    removedParties []party.ID,
    newThreshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// RollbackManager manages config history for emergency recovery.
type RollbackManager struct {
    MaxGenerations int
    History        []*Config
}

// NewRollbackManager creates a rollback manager.
func NewRollbackManager(maxGenerations int) *RollbackManager

// Store stores a configuration in history.
func (rm *RollbackManager) Store(config *Config)

// Rollback retrieves a previous generation's config.
func (rm *RollbackManager) Rollback(generation int) (*Config, error)

// GetLatest returns the most recent config.
func (rm *RollbackManager) GetLatest() *Config
```

#### Doerner Protocol (2-of-2 Optimized)

```go
// Package doerner implements optimized 2-of-2 ECDSA.
package doerner

import (
    "github.com/luxfi/threshold/pkg/math/curve"
    "github.com/luxfi/threshold/pkg/pool"
)

// Config is the 2-party configuration.
type Config struct {
    IsParty1  bool
    PublicKey curve.Point
    // Party-specific secret share
}

// Keygen generates 2-of-2 key shares.
func Keygen(
    isParty1 bool,
    group curve.Curve,
    pl *pool.Pool,
) (*Config, error)

// Sign creates a 2-of-2 ECDSA signature.
// Optimized for 2-party case with constant-time operations.
func Sign(
    config *Config,
    message []byte,
    pl *pool.Pool,
) (*ecdsa.Signature, error)
```

#### BLS Protocol (Aggregate Signatures)

```go
// Package bls implements BLS threshold signatures.
package bls

import (
    "github.com/luxfi/threshold/pkg/party"
    "github.com/luxfi/threshold/pkg/pool"
)

// Config is the BLS configuration.
type Config struct {
    Threshold int
    PublicKey []byte  // G2 element (96 bytes)
    // Secret share
}

// Keygen generates BLS threshold key shares.
func Keygen(
    selfID party.ID,
    parties []party.ID,
    threshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// Sign creates a threshold BLS signature.
func Sign(
    config *Config,
    signers []party.ID,
    message []byte,
    pl *pool.Pool,
) (*Signature, error)

// Signature is a BLS signature.
type Signature struct {
    Value []byte  // G1 element (48 bytes)
}

// Verify verifies a BLS signature.
func (sig *Signature) Verify(publicKey []byte, message []byte) bool

// Aggregate aggregates multiple BLS signatures.
func Aggregate(signatures []*Signature) *Signature

// VerifyAggregate verifies an aggregate signature.
func VerifyAggregate(
    aggregateSig *Signature,
    publicKeys [][]byte,
    messages [][]byte,
) bool
```

#### Threshold FHE Protocol (TFHE)

```go
// Package tfhe implements threshold FHE decryption.
// Uses primitives from lux/fhe but orchestrates threshold decryption here.
package tfhe

import (
    "github.com/luxfi/fhe"                        // FHE primitives
    "github.com/luxfi/threshold/pkg/party"
    "github.com/luxfi/threshold/pkg/pool"
)

// Config is the threshold FHE configuration.
type Config struct {
    Threshold   int
    Parties     []party.ID
    PublicKey   *fhe.PublicKey      // Collective public key
    SecretShare *fhe.SecretKeyShare // Party's secret key share
}

// Keygen performs distributed key generation for threshold FHE.
// Generates collective public key and secret key shares.
func Keygen(
    params fhe.Parameters,
    selfID party.ID,
    parties []party.ID,
    threshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// DecryptionShare is a party's contribution to threshold decryption.
type DecryptionShare struct {
    PartyID party.ID
    Share   []byte  // Partial decryption
}

// PartialDecrypt generates a decryption share.
func PartialDecrypt(
    config *Config,
    ct *fhe.Ciphertext,
) (*DecryptionShare, error)

// Combine combines threshold decryption shares to recover plaintext.
// Requires at least t shares for t-of-n threshold.
func Combine(
    params fhe.Parameters,
    ct *fhe.Ciphertext,
    shares []*DecryptionShare,
    threshold int,
) (*fhe.Plaintext, error)

// ThresholdDecryptor performs threshold FHE decryption.
type ThresholdDecryptor struct {
    config    *Config
    params    fhe.Parameters
    threshold int
}

// NewThresholdDecryptor creates a threshold decryptor.
func NewThresholdDecryptor(config *Config, params fhe.Parameters) *ThresholdDecryptor

// Decrypt performs full threshold decryption with the given parties.
// Orchestrates share collection and combination.
func (td *ThresholdDecryptor) Decrypt(
    ct *fhe.Ciphertext,
    decryptors []party.ID,
    pl *pool.Pool,
) (*fhe.Plaintext, error)

// CollectiveBootstrap refreshes ciphertexts using secret-shared keys.
type CollectiveBootstrap struct {
    config    *Config
    params    fhe.Parameters
}

// RefreshShare generates party's contribution to collective refresh.
func (cb *CollectiveBootstrap) RefreshShare(
    ct *fhe.Ciphertext,
) (*RefreshShare, error)

// Aggregate combines refresh shares to produce refreshed ciphertext.
func (cb *CollectiveBootstrap) Aggregate(
    ct *fhe.Ciphertext,
    shares []*RefreshShare,
) (*fhe.Ciphertext, error)

// KeyRefresh rotates FHE key shares without changing public key.
func KeyRefresh(
    configs []*Config,
    parties []party.ID,
    pl *pool.Pool,
) (map[party.ID]*Config, error)
```

**Usage with thresholdvm**:

```go
// thresholdvm uses lux/threshold/protocols/tfhe for confidential compute
import "github.com/luxfi/threshold/protocols/tfhe"

// Threshold decrypt an FHE ciphertext
decryptor := tfhe.NewThresholdDecryptor(config, params)
plaintext, err := decryptor.Decrypt(ciphertext, validatorSet, pool)
```

#### Ringtail Protocol (Post-Quantum)

```go
// Package ringtail implements post-quantum threshold signatures.
package ringtail

import (
    "github.com/luxfi/threshold/pkg/party"
    "github.com/luxfi/threshold/pkg/pool"
)

// SecurityLevel specifies the post-quantum security level.
type SecurityLevel int

const (
    Security128 SecurityLevel = 128
    Security192 SecurityLevel = 192
    Security256 SecurityLevel = 256
)

// Config is the Ringtail configuration.
type Config struct {
    SecurityLevel SecurityLevel
    Threshold     int
    PublicKey     []byte  // Lattice public key
    // Secret share
}

// Keygen generates post-quantum threshold key shares.
func Keygen(
    level SecurityLevel,
    selfID party.ID,
    parties []party.ID,
    threshold int,
    pl *pool.Pool,
) (map[party.ID]*Config, error)

// Preprocessing contains precomputed values for signing.
type Preprocessing struct {
    // Lattice-specific preprocessing
}

// GeneratePreprocessing generates preprocessing for multiple signatures.
func GeneratePreprocessing(
    config *Config,
    count int,
    pl *pool.Pool,
) ([]*Preprocessing, error)

// Sign creates a post-quantum threshold signature.
func Sign(
    config *Config,
    signers []party.ID,
    message []byte,
    preprocessing *Preprocessing,
    pl *pool.Pool,
) (*Signature, error)

// Signature is a Ringtail signature.
type Signature struct {
    Value []byte
}

// Verify verifies a Ringtail signature.
func (sig *Signature) Verify(publicKey []byte, message []byte) bool

// Adapter wraps other protocols with post-quantum security.
type Adapter struct {
    level    SecurityLevel
    protocol string  // "cmp", "frost", etc.
}

// NewAdapter creates a post-quantum adapter for classical protocols.
func NewAdapter(level SecurityLevel, protocol string) *Adapter

// WrapSignature adds post-quantum protection to classical signature.
func (a *Adapter) WrapSignature(classicalSig []byte) (*Signature, error)
```

### Chain Adapters

```go
// Package adapters provides blockchain-specific signature encoding.
package adapters

import (
    "github.com/luxfi/threshold/pkg/ecdsa"
)

// SignatureType specifies the signature algorithm.
type SignatureType string

const (
    SignatureECDSA   SignatureType = "ecdsa"
    SignatureEdDSA   SignatureType = "eddsa"
    SignatureSchnorr SignatureType = "schnorr"
    SignatureBLS     SignatureType = "bls"
)

// Adapter is the chain-specific signature adapter.
type Adapter interface {
    // Digest computes the signing digest from transaction.
    Digest(tx []byte) ([]byte, error)

    // Encode encodes signature for the blockchain.
    Encode(sig interface{}) ([]byte, error)

    // Decode decodes a blockchain signature.
    Decode(data []byte) (interface{}, error)

    // Verify verifies signature against public key.
    Verify(sig, message, publicKey []byte) bool
}

// AdapterFactory creates chain adapters.
type AdapterFactory struct{}

// NewAdapter creates an adapter for the specified chain.
func (f *AdapterFactory) NewAdapter(chain string, sigType SignatureType) (Adapter, error)

// Supported chains:
// - "ethereum"  - ECDSA with EIP-155/1559/4844
// - "bitcoin"   - ECDSA/Schnorr with SegWit/Taproot
// - "solana"    - EdDSA with versioned transactions
// - "xrpl"      - ECDSA/EdDSA with STX/SMT prefixes
// - "ton"       - EdDSA with BOC serialization
// - "cardano"   - EdDSA/ECDSA/Schnorr multi-era
// - "cosmos"    - ECDSA for all Cosmos chains
// - "polkadot"  - Schnorr with SS58 addresses
// - "near"      - EdDSA
// - "aptos"     - EdDSA
// - "sui"       - EdDSA
// - "tezos"     - EdDSA/ECDSA
// - "algorand"  - EdDSA
// - "stellar"   - EdDSA
// - "hedera"    - ECDSA/EdDSA
// - "flow"      - ECDSA
// - "kadena"    - ECDSA
// - "mina"      - Schnorr
// - "lux"       - ECDSA (EVM compatible)
// - "bsc"       - ECDSA (EVM compatible)

// EthereumAdapter implements Ethereum-specific encoding.
type EthereumAdapter struct {
    ChainID uint64
}

// XRPLAdapter implements XRPL-specific encoding.
type XRPLAdapter struct {
    UseSMTPrefix bool  // Signed Message Transaction prefix
}

// BitcoinAdapter implements Bitcoin-specific encoding.
type BitcoinAdapter struct {
    Network  string  // "mainnet", "testnet", "regtest"
    UseTaproot bool
}

// SolanaAdapter implements Solana-specific encoding.
type SolanaAdapter struct {
    UseVersioned bool  // Use versioned transactions
}
```

### Zero-Knowledge Proofs

```go
// Package zk provides zero-knowledge proof systems.
package zk

// The library includes 17 ZK proof systems:
// 1. Schnorr  - Knowledge of discrete log
// 2. Pedersen - Knowledge of opening
// 3. Range    - Value in range [0, 2^n)
// 4. Equality - Two commitments to same value
// 5. Product  - c = a * b
// 6. Sum      - c = a + b
// 7. EncProof - Correct encryption
// 8. DecProof - Correct decryption
// 9. ModProof - Paillier modulus is product of safe primes
// 10. LogStar - DL relation with Paillier encryption
// 11. Affg    - Affine operation on Paillier ciphertext
// 12. Affp    - Affine with public values
// 13. Mul     - Multiplication proof
// 14. EcdsaK  - ECDSA nonce proof
// 15. EcdsaR  - ECDSA signature proof
// 16. Fac     - Factorization proof
// 17. Prm     - Paillier-Blum modulus proof
```

### Performance Benchmarks

| Operation | 3-of-5 | 5-of-9 | 7-of-11 | 10-of-15 |
|-----------|--------|--------|---------|----------|
| **Key Generation** | 12ms | 28ms | 45ms | 82ms |
| **CMP Signing** | 15ms | 20ms | 30ms | 45ms |
| **FROST Signing** | 8ms | 12ms | 18ms | 28ms |
| **Doerner (2-of-2)** | 5ms | - | - | - |
| **Resharing (LSS)** | 20ms | 35ms | 52ms | 75ms |
| **Verification** | 2ms | 2ms | 2ms | 2ms |

### Blockchain Support Matrix

| Chain | Signature | Adapter | Status |
|-------|-----------|---------|--------|
| Ethereum | ECDSA | EIP-155/1559/4844 | Production |
| Bitcoin | ECDSA/Schnorr | SegWit/Taproot/PSBT | Production |
| Solana | EdDSA | Versioned Tx | Production |
| XRPL | ECDSA/EdDSA | STX/SMT prefixes | Production |
| TON | EdDSA | BOC serialization | Production |
| Cardano | Ed/EC/Schnorr | Multi-era | Production |
| Cosmos | ECDSA | All chains | Production |
| Polkadot | Schnorr | SS58 | Production |
| NEAR | EdDSA | Native | Production |
| Aptos | EdDSA | Native | Production |
| Sui | EdDSA | Native | Production |
| Lux | ECDSA | EVM compatible | Production |

## Rationale

### Why Multiple Protocols?

1. **CMP**: Best for ECDSA when identifiable abort is needed
2. **FROST**: Fastest for Schnorr/EdDSA (only 2 rounds)
3. **LSS**: Required for dynamic resharing without key reconstruction
4. **Doerner**: Optimal for 2-of-2 scenarios (constant-time, very fast)
5. **BLS**: Enables signature aggregation for scalability

### Why Chain Adapters?

Each blockchain has unique:
- Transaction format and digest computation
- Signature encoding (DER, raw, etc.)
- Address derivation and checksums
- Low-S enforcement or other malleability fixes

### Why Post-Quantum (Ringtail)?

- NIST post-quantum standards require migration path
- Lattice signatures provide quantum resistance
- Adapter pattern allows hybrid classical+PQ signatures

## Backwards Compatibility

New library. No backwards compatibility concerns.

## Test Cases

### Protocol Tests

1. CMP keygen produces valid ECDSA public key
2. CMP 4-round signing produces valid signature
3. CMP 7-round presigning reduces online rounds
4. CMP identifiable abort detects malicious party
5. FROST keygen produces valid Schnorr key
6. FROST 2-round signing produces valid signature
7. FROST Taproot signing produces BIP-340 signature
8. LSS resharing preserves public key
9. LSS add/remove parties works correctly
10. LSS rollback restores previous generation
11. Doerner 2-of-2 signing is fast and correct
12. BLS aggregation works correctly
13. Ringtail provides post-quantum security

### Adapter Tests

1. Ethereum adapter produces valid EIP-155 signatures
2. Bitcoin adapter produces valid SegWit/Taproot signatures
3. Solana adapter produces valid Ed25519 signatures
4. XRPL adapter handles STX/SMT prefixes correctly
5. All adapters verify their own signatures

### Security Tests

1. t-1 parties cannot reconstruct secret
2. Constant-time operations (no timing leaks)
3. Invalid proofs are rejected
4. Byzantine fault tolerance up to t-1 parties

## Reference Implementation

### Repository Structure

```
lux/threshold/
├── go.mod
├── doc.go                   # Package documentation
├── cmd/
│   └── threshold-cli/       # CLI tool
├── internal/
│   ├── bip32/              # BIP-32 derivation
│   ├── elgamal/            # ElGamal encryption
│   ├── mta/                # Multiplicative-to-Additive
│   ├── ot/                 # Oblivious transfer
│   ├── params/             # Security parameters
│   └── round/              # Round-based protocol framework
├── pkg/
│   ├── ecdsa/              # ECDSA signatures
│   ├── hash/               # BLAKE3 hashing
│   ├── math/               # Cryptographic math
│   │   ├── curve/          # Elliptic curves
│   │   ├── polynomial/     # Polynomial operations
│   │   └── sample/         # Secure sampling
│   ├── paillier/           # Homomorphic encryption
│   ├── party/              # Party identification
│   ├── pool/               # Thread pool
│   ├── protocol/           # Protocol handler
│   ├── taproot/            # BIP-340/341 support
│   └── zk/                 # 17 ZK proof systems
├── protocols/
│   ├── cmp/                # CMP ECDSA
│   ├── frost/              # FROST Schnorr/EdDSA
│   ├── lss/                # LSS dynamic resharing
│   ├── doerner/            # 2-of-2 optimized
│   ├── bls/                # BLS aggregate
│   ├── ringtail/           # Post-quantum
│   └── adapters/           # Chain adapters
└── docs/
    └── ...
```

### Go Module

```
module github.com/luxfi/threshold

go 1.22

require (
    // Lux crypto stack (consumed by this HIGH-LEVEL orchestration layer)
    github.com/luxfi/crypto v1.0.0          // ECDSA, EdDSA, BLS curves
    github.com/luxfi/fhe v1.0.0             // FHE primitives for TFHE protocol
    github.com/luxfi/lattice/v7 v6.0.0      // Lattice ops for Ringtail (post-quantum)

    // External dependencies
    github.com/cronokirby/saferith v0.33.0  // Constant-time arithmetic
    github.com/zeebo/blake3 v0.2.3          // Fast hashing
    github.com/fxamacker/cbor/v2 v2.4.0     // Serialization
)
```

### Security Parameters

```go
// internal/params/params.go

const (
    SecParam         = 256  // Security parameter (bits)
    OTParam          = 128  // OT security parameter
    StatParam        = 80   // Statistical security
    ZKModIterations  = 128  // Paillier-Blum validation
    BitsBlumPrime    = 1024 // Blum prime size
    BitsPaillier     = 2048 // Paillier key size
)
```

## Security Considerations

### Threshold Security

- t-of-n threshold: any t parties can sign, t-1 cannot
- Public key never reconstructed (no single point of failure)
- Secret shares encrypted at rest with party-specific keys

### Byzantine Fault Tolerance

- Tolerates up to t-1 malicious parties
- Identifiable abort reveals malicious party identity
- Protocol continues with honest majority

### Side-Channel Resistance

- All operations use constant-time arithmetic via saferith
- No branching on secret data
- Memory-safe operations throughout

### Communication Security

- All inter-party communication must use TLS 1.3
- Message authentication via protocol-level MACs
- Replay protection via session nonces

### Post-Quantum Considerations

- Ringtail provides NIST Level 1/3/5 security
- Hybrid mode: classical signature + Ringtail wrapper
- Migration path for quantum threat timeline

