---
lp: 0603
title: Warp 1.5 - Quantum-Safe Cross-Chain Messaging
description: Post-quantum secure cross-chain messaging with Ringtail signatures, ML-KEM encryption, and Teleport protocol integration
author: Lux Core Team (@luxfi)
discussions-to: https://forum.lux.network/t/lp-603-warp-1-5
status: Final
type: Standards Track
category: Networking
created: 2025-12-11
requires: 602, 332, 330, 331
---

# LP-603: Warp 1.5 - Quantum-Safe Cross-Chain Messaging

## Abstract

This proposal specifies Warp 1.5, a major upgrade to Lux's cross-chain messaging protocol that introduces post-quantum security through Ringtail lattice-based threshold signatures and ML-KEM-768 key encapsulation. Warp 1.5 maintains backward compatibility with existing BLS-based signatures while providing a migration path to full quantum resistance. The upgrade includes the Teleport high-level protocol for standardized cross-chain operations (transfers, swaps, attestations, governance, private transfers) and integrates with BridgeVM (B-Chain) and ThresholdVM (T-Chain) for MPC-based signing.

## Motivation

### Quantum Computing Threat

The advancement of quantum computing poses an existential threat to classical cryptographic systems:

1. **Shor's Algorithm**: Can break ECDSA, RSA, and BLS signatures in polynomial time
2. **Grover's Algorithm**: Reduces symmetric key security by half (AES-256 → 128-bit security)
3. **Timeline**: NIST estimates cryptographically relevant quantum computers by 2030-2035

### Current State (Warp 1.0)

Warp 1.0 uses BLS aggregate signatures which provide:
- Compact 96-byte signatures regardless of signer count
- Efficient verification via bilinear pairings
- **Vulnerability**: Completely broken by quantum computers

### Warp 1.5 Solution

Warp 1.5 introduces three cryptographic upgrades:

1. **Ringtail Signatures**: LWE-based threshold signatures with native t-of-n support
2. **ML-KEM-768 Encryption**: NIST FIPS 203 compliant key encapsulation for confidential messages
3. **AES-256-GCM**: Symmetric encryption for payload confidentiality

## Specification

### Signature Types

Warp 1.5 defines three signature types for different security/compatibility needs:

```go
// SignatureType indicates which signature algorithm to use
type SignatureType uint8

const (
    // SigTypeBLS uses classical BLS signatures (Warp 1.0 compatibility)
    SigTypeBLS SignatureType = iota
    // SigTypeRingtail uses quantum-safe Ringtail signatures (recommended)
    SigTypeRingtail
    // SigTypeHybrid uses BLS+Ringtail hybrid (deprecated)
    SigTypeHybrid
)
```

#### Migration Path

| Phase | Timeline | Default Signature | Notes |
|-------|----------|-------------------|-------|
| Phase 1 | Current | BLS (backward compat) | Existing messages work unchanged |
| Phase 2 | Q1 2025 | Ringtail (quantum-safe) | New default for all messages |
| Phase 3 | Q3 2025 | Ringtail-only | BLS support deprecated |

### Ringtail Signature (Recommended)

Ringtail is a lattice-based threshold signature scheme based on Ring-LWE:

```go
// RingtailSignature is the Warp 1.5 quantum-safe signature type
type RingtailSignature struct {
    // Signers is a big-endian byte slice encoding which validators signed
    Signers []byte `serialize:"true"`

    // Signature is the Ringtail threshold signature
    // Contains: c (challenge polynomial), z (response vector), Delta (hint vector)
    Signature []byte `serialize:"true"`
}
```

**Cryptographic Parameters** (from github.com/luxfi/ringtail):

| Parameter | Value | Description |
|-----------|-------|-------------|
| Q | 0x1000000004A01 | 48-bit NTT-friendly prime |
| M | 8 | Matrix dimension M |
| N | 7 | Matrix dimension N |
| Kappa | 23 | Hash output bound |
| Dbar | 48 | Signature dimension |

**Security Properties**:
- Post-quantum secure (based on LWE/Ring-LWE hardness)
- Native threshold support (t-of-n signing in 2 rounds)
- No need for separate MPC/TSS layer
- Paper: https://eprint.iacr.org/2024/1113

### Encrypted Payload (ML-KEM + AES-256-GCM)

For confidential cross-chain messages, Warp 1.5 provides quantum-safe encryption:

```go
// EncryptedWarpPayload provides quantum-safe encryption using ML-KEM + AES-256-GCM
type EncryptedWarpPayload struct {
    // EncapsulatedKey is the ML-KEM ciphertext (1088 bytes for ML-KEM-768)
    EncapsulatedKey []byte `serialize:"true"`

    // Nonce is the AES-GCM nonce (12 bytes)
    Nonce []byte `serialize:"true"`

    // Ciphertext is the AES-256-GCM encrypted payload (includes 16-byte auth tag)
    Ciphertext []byte `serialize:"true"`

    // RecipientKeyID identifies which ML-KEM public key was used
    RecipientKeyID []byte `serialize:"true"`
}
```

**Encryption Flow**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Plaintext  │────►│  ML-KEM     │────►│ Shared      │
│  Message    │     │  Encapsulate│     │ Secret (32B)│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐
│  Encrypted  │◄────│  AES-256    │◄────│ Derive Key  │
│  Payload    │     │  GCM Seal   │     │ from SS     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Constants**:

```go
const (
    MLKEM768CiphertextLen   = 1088  // ML-KEM-768 ciphertext size
    MLKEM768PublicKeyLen    = 1184  // ML-KEM-768 public key size
    MLKEM768SharedSecretLen = 32    // Shared secret size
    AESGCMNonceLen          = 12    // AES-GCM nonce size
    AESGCMTagLen            = 16    // Authentication tag size
)
```

### Teleport Protocol

Teleport is the high-level cross-chain messaging protocol built on Warp 1.5:

```go
// TeleportMessage wraps a Warp message for cross-chain bridging operations
type TeleportMessage struct {
    Version       uint8        `serialize:"true"` // Protocol version (1)
    MessageType   TeleportType `serialize:"true"` // Operation type
    SourceChainID ids.ID       `serialize:"true"` // Source chain
    DestChainID   ids.ID       `serialize:"true"` // Destination chain
    Nonce         uint64       `serialize:"true"` // Replay protection
    Payload       []byte       `serialize:"true"` // Application data
    Encrypted     bool         `serialize:"true"` // Encryption flag
}
```

**Message Types**:

| Type | Value | Description | Use Case |
|------|-------|-------------|----------|
| TeleportTransfer | 0 | Asset transfer between chains | Bridge deposits/withdrawals |
| TeleportSwap | 1 | Atomic swap between chains | DEX cross-chain trades |
| TeleportLock | 2 | Lock assets on source chain | Bridge collateral |
| TeleportUnlock | 3 | Unlock assets on destination | Bridge release |
| TeleportAttest | 4 | Attestation message | Oracle data, price feeds |
| TeleportGovernance | 5 | Cross-chain governance | DAO voting, parameter updates |
| TeleportPrivate | 6 | Encrypted private transfer | Confidential bridges |

### Transfer Payload

Standard payload for asset transfers:

```go
type TeleportTransferPayload struct {
    AssetID   ids.ID `serialize:"true"` // Asset being transferred
    Amount    uint64 `serialize:"true"` // Transfer amount
    Sender    []byte `serialize:"true"` // Source address
    Recipient []byte `serialize:"true"` // Destination address
    Fee       uint64 `serialize:"true"` // Bridge fee
    Memo      []byte `serialize:"true"` // Optional metadata
}
```

### Attestation Payload

For oracle and compute attestations:

```go
type TeleportAttestPayload struct {
    AttestationType uint8       `serialize:"true"` // What is being attested
    Timestamp       uint64      `serialize:"true"` // When created
    Data            []byte      `serialize:"true"` // Attestation data
    AttesterID      ids.NodeID  `serialize:"true"` // Who created it
}
```

### Private Teleport Messages

Creating encrypted cross-chain messages:

```go
// NewPrivateTeleportMessage creates an encrypted Teleport message
func NewPrivateTeleportMessage(
    sourceChainID ids.ID,
    destChainID ids.ID,
    nonce uint64,
    payload []byte,
    recipientPubKey []byte,  // ML-KEM-768 public key
    recipientKeyID []byte,   // Key identifier
) (*TeleportMessage, error)
```

**Use Cases**:
- Private bridge transfers (hidden amounts/recipients)
- Sealed-bid cross-chain auctions
- Confidential governance votes
- MEV protection (encrypt intent until committed)

## Integration with Bridge Architecture

### BridgeVM (B-Chain) Integration

BridgeVM coordinates bridge operations using Teleport:

```
┌─────────────────────────────────────────────────────────────┐
│                      BridgeVM (B-Chain)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ LP-333       │    │ Teleport     │    │ Warp 1.5     │   │
│  │ Signer Set   │◄──►│ Message      │◄──►│ Signature    │   │
│  │ Management   │    │ Processing   │    │ Selection    │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                   │            │
│         ▼                   ▼                   ▼            │
│  100M LUX Bond        7 Message Types      BLS/Ringtail      │
│  Opt-in Model         Transfer/Swap/etc    Quantum-Safe      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**RPC Endpoints**:

| Method | Description |
|--------|-------------|
| `bridge_registerValidator` | Opt-in as signer (LP-333) |
| `bridge_getSignerSetInfo` | Get current signer set |
| `bridge_replaceSigner` | Replace failed signer (triggers reshare) |
| `bridge_slashSigner` | Slash misbehaving signer's bond |

### ThresholdVM (T-Chain) Integration

ThresholdVM provides MPC signing services for Warp 1.5:

```
┌─────────────────────────────────────────────────────────────┐
│                     ThresholdVM (T-Chain)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ LSS Protocol │    │ Ringtail     │    │ CGGMP21      │   │
│  │ (reshare)    │    │ Protocol     │    │ Protocol     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                   │            │
│         ▼                   ▼                   ▼            │
│  Dynamic Validator     Post-Quantum        Classical         │
│  Set Changes           Threshold Sig       ECDSA             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CrossChainMPCRequest Handler              │ │
│  │  - Receives sign requests from B-Chain via Warp       │ │
│  │  - Executes threshold signing protocol                 │ │
│  │  - Returns signature via Warp response                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Supported Protocols**:

| Protocol | Type | Use Case |
|----------|------|----------|
| LSS | Dynamic resharing | Validator set changes |
| Ringtail | Post-quantum | Warp 1.5 signatures |
| CGGMP21 | Classical ECDSA | EVM chain signing |
| FROST | EdDSA | Solana, Cosmos |
| BLS | Aggregate | Legacy Warp 1.0 |

## Rationale

### Why Ringtail over ML-DSA?

| Aspect | Ringtail | ML-DSA (Dilithium) |
|--------|----------|-------------------|
| Threshold Support | Native 2-round protocol | Requires complex MPC |
| Signature Size | ~3-5KB (variable) | 2.4-4.6KB |
| Verification Speed | Fast (NTT-based) | Fast |
| Key Generation | Distributed DKG | Per-party |
| Quantum Security | LWE-based (proven) | Module-LWE (proven) |

Ringtail's native threshold support eliminates the need for complex MPC protocols around ML-DSA, reducing latency and implementation complexity.

### Why ML-KEM-768?

| Level | Algorithm | Security | Ciphertext Size |
|-------|-----------|----------|-----------------|
| 1 | ML-KEM-512 | 128-bit | 768 bytes |
| 3 | ML-KEM-768 | 192-bit | 1088 bytes |
| 5 | ML-KEM-1024 | 256-bit | 1568 bytes |

ML-KEM-768 (NIST Level 3) provides:
- 192-bit post-quantum security
- Reasonable ciphertext size (1088 bytes)
- FIPS 203 compliance
- Balance of security and efficiency

### Why Teleport Message Types?

The seven message types cover all cross-chain use cases:

1. **Transfer**: 90% of bridge traffic (deposits/withdrawals)
2. **Swap**: Atomic cross-chain DEX trades
3. **Lock/Unlock**: Two-phase commit for bridge safety
4. **Attest**: Oracle data, price feeds, compute proofs
5. **Governance**: Cross-chain DAO coordination
6. **Private**: MEV protection, confidential transfers

## Backwards Compatibility

### Message Format

Warp 1.5 messages are fully backward compatible:
- Warp 1.0 clients can verify BLS signatures
- Signature type is indicated by codec type ID
- Unknown signature types are rejected safely

### Upgrade Path

1. **Node Upgrade**: Deploy Warp 1.5-enabled nodes
2. **Validator Key Registration**: Validators register Ringtail keys
3. **Transition Period**: Both BLS and Ringtail accepted
4. **Deprecation**: BLS-only messages rejected after cutoff

## Test Cases

### Ringtail Signature Tests

```go
func TestRingtailSignatureNumSigners(t *testing.T)
func TestRingtailSignatureVerify(t *testing.T)
func TestRingtailSignatureVerifyInsufficientWeight(t *testing.T)
```

### Encrypted Payload Tests

```go
func TestEncryptWarpPayload(t *testing.T)
func TestEncryptedPayloadDecrypt(t *testing.T)
func TestEncryptedPayloadRoundTrip(t *testing.T)
func TestEncryptedPayloadInvalidKey(t *testing.T)
```

### Teleport Protocol Tests

```go
func TestTeleportMessageValidate(t *testing.T)
func TestNewPrivateTeleportMessage(t *testing.T)
func TestTeleportTransferPayloadRoundTrip(t *testing.T)
func TestTeleportToWarpMessage(t *testing.T)
```

### Integration Tests

```go
// BridgeVM integration
func TestTeleportBridgeIntegration(t *testing.T)
func TestFullBridgeFlowWithTeleport(t *testing.T)

// ThresholdVM integration
func TestThresholdVMWarpSignatureSupport(t *testing.T)
func TestEncryptedWarpThroughThreshold(t *testing.T)
```

## Reference Implementation

### Source Code

| Component | Repository | Path |
|-----------|------------|------|
| Warp 1.5 Core | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/platformvm/warp/` |
| Teleport Protocol | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/platformvm/warp/teleport.go` |
| Signature Types | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/platformvm/warp/signature.go` |
| BridgeVM | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/bridgevm/` |
| ThresholdVM | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/thresholdvm/` |
| Ringtail Crypto | [github.com/luxfi/threshold](https://github.com/luxfi/threshold) | `protocols/ringtail/` |

### Key Files

- `warp/signature.go` - Signature types (BLS, Ringtail, Hybrid)
- `warp/teleport.go` - Teleport message types and payloads
- `warp/codec.go` - Codec registration for all types
- `warp/message.go` - UnsignedMessage and Message structures
- `warp/validator.go` - Validator with RingtailPubKey support

### Running Tests

```bash
# Warp package tests
cd ~/work/lux/node
go test -v ./vms/platformvm/warp/...

# BridgeVM integration tests
go test -v ./vms/bridgevm/...

# ThresholdVM integration tests
go test -v ./vms/thresholdvm/...
```

## Security Considerations

### Post-Quantum Security

| Component | Classical | Post-Quantum |
|-----------|-----------|--------------|
| Signatures | BLS-12-381 | Ringtail (LWE) |
| Encryption | - | ML-KEM-768 |
| Symmetric | AES-256-GCM | AES-256-GCM |

### Threat Model

1. **Quantum Adversary**: Cannot forge Ringtail signatures
2. **Classical Adversary**: Cannot break BLS or Ringtail
3. **Encrypted Payloads**: Forward secure with ML-KEM

### Key Management

- Validators MUST secure both BLS and Ringtail private keys
- HSM storage recommended for production
- Key rotation via LSS resharing protocol

### Upgrade Security

- Transition period allows fallback to BLS
- Hybrid mode provides belt-and-suspenders security
- Network upgrade coordinates cutoff timing

## Performance

### Signature Sizes

| Type | Size | Notes |
|------|------|-------|
| BLS | 96 bytes | Compact, aggregatable |
| Ringtail | ~3-5 KB | Variable, threshold-dependent |
| Hybrid | ~3.1-5.1 KB | Both signatures |

### Verification Times (Apple M1 Max)

| Operation | Time |
|-----------|------|
| BLS Verify | ~2.5 ms |
| Ringtail Verify | ~5-8 ms |
| ML-KEM Decapsulate | ~0.2 ms |
| AES-GCM Decrypt | ~0.01 ms |

### Network Impact

- Larger signatures increase block size by ~3-5KB per message
- ML-KEM ciphertext adds 1088 bytes for encrypted payloads
- Recommended: Batch multiple transfers in single message

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
