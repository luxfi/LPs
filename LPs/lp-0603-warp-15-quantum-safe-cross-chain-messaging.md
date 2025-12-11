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
requires: 602, 330, 331, 332, 333
tags: [pqc, threshold-crypto, cross-chain, warp, teleport, bridge, encryption, signatures]
---

# LP-603: Warp 1.5 - Quantum-Safe Cross-Chain Messaging

## TL;DR

**Warp 1.5** upgrades Lux cross-chain messaging to be quantum-safe:
- **Ringtail signatures** replace BLS for post-quantum security
- **ML-KEM-768** encryption for confidential messages
- **Teleport protocol** standardizes 7 cross-chain operation types
- Backward compatible with Warp 1.0 (BLS still supported during transition)

```
Source Chain → [Create TeleportMessage] → [Sign with Ringtail] → Warp Layer → Destination Chain
                     ↓                           ↓
              (optional encrypt)         (2/3 validator threshold)
```

---

## Prerequisites

Before reading this LP, you should understand:

| Concept | Description | Reference |
|---------|-------------|-----------|
| Warp 1.0 | Basic cross-chain messaging with BLS | [LP-602](./lp-0602-warp-cross-chain-messaging-protocol.md) |
| BLS Signatures | Aggregatable signatures using bilinear pairings | - |
| Threshold Signatures | t-of-n signing without reconstructing full key | [LP-330](./lp-0330-t-chain-thresholdvm-specification.md) |
| Post-Quantum Crypto | Cryptography resistant to quantum computers | [LP-4](./lp-0004-quantum-resistant-cryptography-integration-in-lux.md) |

**Related LPs:**
- [LP-330](./lp-0330-t-chain-thresholdvm-specification.md) - ThresholdVM (T-Chain) for MPC signing
- [LP-331](./lp-0331-b-chain-bridgevm-specification.md) - BridgeVM (B-Chain) orchestration
- [LP-332](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md) - Teleport architecture
- [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md) - LP-333 signer management

---

## Abstract

This proposal specifies Warp 1.5, a major upgrade to Lux's cross-chain messaging protocol that introduces post-quantum security through Ringtail lattice-based threshold signatures and ML-KEM-768 key encapsulation. Warp 1.5 maintains backward compatibility with existing BLS-based signatures while providing a migration path to full quantum resistance. The upgrade includes the Teleport high-level protocol for standardized cross-chain operations (transfers, swaps, attestations, governance, private transfers) and integrates with BridgeVM (B-Chain) and ThresholdVM (T-Chain) for MPC-based signing.

---

## Motivation

### The Quantum Threat

Quantum computers threaten all classical cryptography used in blockchains:

| Algorithm | Quantum Attack | Impact |
|-----------|----------------|--------|
| ECDSA | Shor's algorithm | Private keys recoverable in polynomial time |
| BLS | Shor's algorithm | Signatures forgeable |
| RSA | Shor's algorithm | Completely broken |
| AES-256 | Grover's algorithm | Reduced to 128-bit security (still safe) |

**Timeline**: NIST estimates cryptographically relevant quantum computers by 2030-2035. We must migrate NOW.

### Current State (Warp 1.0)

Warp 1.0 uses BLS aggregate signatures:
- ✅ Compact 96-byte signatures
- ✅ Efficient verification
- ❌ **Completely broken by quantum computers**

### Warp 1.5 Solution

Three cryptographic upgrades:

1. **Ringtail Signatures** - LWE-based threshold signatures
2. **ML-KEM-768 Encryption** - NIST FIPS 203 key encapsulation
3. **AES-256-GCM** - Symmetric encryption (quantum-safe with 128-bit security)

---

## Glossary

| Term | Definition |
|------|------------|
| **LWE** | Learning With Errors - hard mathematical problem underlying post-quantum crypto |
| **Ring-LWE** | Variant of LWE using polynomial rings for efficiency |
| **Ringtail** | LWE-based threshold signature scheme with native t-of-n support |
| **ML-KEM** | Module-Lattice Key Encapsulation Mechanism (NIST FIPS 203) |
| **KEM** | Key Encapsulation Mechanism - asymmetric crypto for key exchange |
| **Threshold Signature** | Signature requiring t-of-n parties without reconstructing full key |
| **Teleport** | High-level cross-chain messaging protocol built on Warp |
| **Warp** | Low-level cross-chain message format with validator signatures |

---

## How It Works: End-to-End Flow

### Standard Cross-Chain Transfer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CROSS-CHAIN TRANSFER FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER INITIATES TRANSFER                                                 │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │ User: "Send 100 LUX from C-Chain to Ethereum"                │        │
│     └──────────────────────────────────────────────────────────────┘        │
│                              ↓                                              │
│  2. CREATE TELEPORT MESSAGE                                                 │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │ TeleportMessage {                                            │        │
│     │   MessageType: TeleportTransfer                              │        │
│     │   SourceChain: C-Chain                                       │        │
│     │   DestChain:   Ethereum                                      │        │
│     │   Payload:     {AssetID, Amount, Sender, Recipient}          │        │
│     │ }                                                            │        │
│     └──────────────────────────────────────────────────────────────┘        │
│                              ↓                                              │
│  3. SIGN WITH VALIDATORS (Ringtail threshold)                               │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │                    BridgeVM (B-Chain)                        │        │
│     │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │        │
│     │  │ V1  │ │ V2  │ │ V3  │ │ V4  │ │ V5  │  ... (up to 100)   │        │
│     │  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘                    │        │
│     │     │       │       │       │       │                        │        │
│     │     └───────┴───────┼───────┴───────┘                        │        │
│     │                     ↓                                        │        │
│     │           ThresholdVM (T-Chain)                              │        │
│     │           [Ringtail t-of-n signing]                          │        │
│     │           Needs 67% validators to sign                       │        │
│     └──────────────────────────────────────────────────────────────┘        │
│                              ↓                                              │
│  4. WARP MESSAGE CREATED                                                    │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │ WarpMessage {                                                │        │
│     │   UnsignedMessage: [TeleportMessage bytes]                   │        │
│     │   Signature: RingtailSignature {                             │        │
│     │     Signers: [bitset of who signed]                          │        │
│     │     Signature: [~3-5KB Ringtail sig]                         │        │
│     │   }                                                          │        │
│     │ }                                                            │        │
│     └──────────────────────────────────────────────────────────────┘        │
│                              ↓                                              │
│  5. VERIFY ON DESTINATION                                                   │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │ Ethereum Bridge Contract:                                    │        │
│     │ 1. Verify Ringtail signature against Lux validator set       │        │
│     │ 2. Check 67%+ weight threshold                               │        │
│     │ 3. Execute: Mint 100 wrapped LUX to recipient                │        │
│     └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Private Transfer (Encrypted)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRIVATE (ENCRYPTED) TRANSFER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ENCRYPT PAYLOAD                                                         │
│     ┌───────────────────────────────────────────────────────────────┐       │
│     │                                                               │       │
│     │  Plaintext ──► ML-KEM-768 ──► Shared Secret ──► AES-256-GCM  │       │
│     │  Payload        Encapsulate     (32 bytes)       Encrypt      │       │
│     │                                                               │       │
│     │  Result: EncryptedWarpPayload {                               │       │
│     │    EncapsulatedKey: 1088 bytes (ML-KEM ciphertext)            │       │
│     │    Nonce: 12 bytes                                            │       │
│     │    Ciphertext: [encrypted payload + 16-byte auth tag]         │       │
│     │    RecipientKeyID: [identifies recipient's ML-KEM key]        │       │
│     │  }                                                            │       │
│     └───────────────────────────────────────────────────────────────┘       │
│                              ↓                                              │
│  2. CREATE PRIVATE TELEPORT MESSAGE                                         │
│     ┌───────────────────────────────────────────────────────────────┐       │
│     │ TeleportMessage {                                             │       │
│     │   MessageType: TeleportPrivate                                │       │
│     │   Encrypted: true                                             │       │
│     │   Payload: [EncryptedWarpPayload bytes]                       │       │
│     │ }                                                             │       │
│     └───────────────────────────────────────────────────────────────┘       │
│                              ↓                                              │
│  3. SIGN & TRANSMIT (same as standard)                                      │
│                              ↓                                              │
│  4. RECIPIENT DECRYPTS                                                      │
│     ┌───────────────────────────────────────────────────────────────┐       │
│     │ ML-KEM Decapsulate → Shared Secret → AES-GCM Decrypt          │       │
│     │ Only recipient with matching private key can read payload     │       │
│     └───────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

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

#### When to Use Each Type

| Type | Use Case | Security | Size |
|------|----------|----------|------|
| **SigTypeBLS** | Legacy compatibility, small messages | Classical only | 96 bytes |
| **SigTypeRingtail** | **New deployments (recommended)** | Post-quantum | ~3-5 KB |
| **SigTypeHybrid** | Migration period (deprecated) | Both | ~3.1-5.1 KB |

#### Migration Timeline

| Phase | Timeline | Default | Notes |
|-------|----------|---------|-------|
| Phase 1 | Current | BLS | Existing messages work unchanged |
| Phase 2 | Q1 2025 | Ringtail | New default for all messages |
| Phase 3 | Q3 2025 | Ringtail-only | BLS support deprecated |

---

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

**Cryptographic Parameters** (from [github.com/luxfi/ringtail](https://github.com/luxfi/ringtail)):

| Parameter | Value | Description |
|-----------|-------|-------------|
| Q | 0x1000000004A01 | 48-bit NTT-friendly prime |
| M | 8 | Matrix dimension M |
| N | 7 | Matrix dimension N |
| Kappa | 23 | Hash output bound |
| Dbar | 48 | Signature dimension |

**Why Ringtail?**

| Aspect | Ringtail | ML-DSA (Dilithium) |
|--------|----------|-------------------|
| Threshold Support | **Native 2-round** | Requires complex MPC |
| Implementation | Simple | Complex MPC around ML-DSA |
| Security | LWE-based (proven) | Module-LWE (proven) |
| Paper | [eprint.iacr.org/2024/1113](https://eprint.iacr.org/2024/1113) | NIST FIPS 204 |

---

### Encrypted Payload (ML-KEM + AES-256-GCM)

For confidential cross-chain messages:

```go
// EncryptedWarpPayload provides quantum-safe encryption
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

**Constants:**

```go
const (
    MLKEM768CiphertextLen   = 1088  // ML-KEM-768 ciphertext size
    MLKEM768PublicKeyLen    = 1184  // ML-KEM-768 public key size
    MLKEM768SharedSecretLen = 32    // Shared secret size
    AESGCMNonceLen          = 12    // AES-GCM nonce size
    AESGCMTagLen            = 16    // Authentication tag size
)
```

**Why ML-KEM-768?**

| Level | Algorithm | Security | Ciphertext Size |
|-------|-----------|----------|-----------------|
| 1 | ML-KEM-512 | 128-bit | 768 bytes |
| **3** | **ML-KEM-768** | **192-bit** | **1088 bytes** |
| 5 | ML-KEM-1024 | 256-bit | 1568 bytes |

ML-KEM-768 provides the best balance of security (192-bit post-quantum) and size.

---

### Teleport Protocol

Teleport is the high-level cross-chain messaging protocol:

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

**Message Types:**

| Type | Value | Description | Example Use |
|------|-------|-------------|-------------|
| `TeleportTransfer` | 0 | Asset transfer | Bridge deposits/withdrawals |
| `TeleportSwap` | 1 | Atomic swap | Cross-chain DEX trades |
| `TeleportLock` | 2 | Lock assets | Bridge collateral |
| `TeleportUnlock` | 3 | Unlock assets | Bridge release |
| `TeleportAttest` | 4 | Attestation | Oracle data, price feeds |
| `TeleportGovernance` | 5 | Governance | DAO voting across chains |
| `TeleportPrivate` | 6 | Encrypted transfer | MEV protection, privacy |

---

### Transfer Payload

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

```go
type TeleportAttestPayload struct {
    AttestationType uint8       `serialize:"true"` // What is being attested
    Timestamp       uint64      `serialize:"true"` // When created
    Data            []byte      `serialize:"true"` // Attestation data
    AttesterID      ids.NodeID  `serialize:"true"` // Who created it
}
```

---

## Integration Architecture

### BridgeVM (B-Chain)

BridgeVM orchestrates bridge operations using Teleport:

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
│  Opt-in (first 100)   Transfer/Swap/etc    Quantum-Safe      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key RPC Endpoints:**

| Method | Description |
|--------|-------------|
| `bridge_registerValidator` | Opt-in as signer ([LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md)) |
| `bridge_getSignerSetInfo` | Get current signer set |
| `bridge_replaceSigner` | Replace failed signer (triggers reshare) |
| `bridge_slashSigner` | Slash misbehaving signer's bond |

### ThresholdVM (T-Chain)

ThresholdVM provides MPC signing services:

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
└─────────────────────────────────────────────────────────────┘
```

**Supported Protocols:**

| Protocol | Type | Use Case |
|----------|------|----------|
| LSS | Dynamic resharing | Validator set changes |
| **Ringtail** | **Post-quantum** | **Warp 1.5 signatures** |
| CGGMP21 | Classical ECDSA | EVM chain signing |
| FROST | EdDSA | Solana, Cosmos |
| BLS | Aggregate | Legacy Warp 1.0 |

---

## Code Examples

### Creating a Standard Transfer

```go
import "github.com/luxfi/node/vms/platformvm/warp"

// Create transfer payload
payload := warp.NewTransferPayload(
    assetID,
    1000000000, // 1 LUX
    senderAddr,
    recipientAddr,
    10000, // 0.00001 LUX fee
    nil,   // no memo
)
payloadBytes, _ := payload.Bytes()

// Create Teleport message
msg := warp.NewTeleportMessage(
    warp.TeleportTransfer,
    sourceChainID,
    destChainID,
    nonce,
    payloadBytes,
)

// Convert to Warp message for signing
warpMsg, _ := msg.ToWarpMessage(networkID)
```

### Creating a Private Transfer

```go
// Create encrypted private message
privateMsg, err := warp.NewPrivateTeleportMessage(
    sourceChainID,
    destChainID,
    nonce,
    payloadBytes,
    recipientMLKEMPubKey, // ML-KEM-768 public key
    recipientKeyID,       // Key identifier
)
if err != nil {
    return err
}

// Message is now encrypted, only recipient can decrypt
warpMsg, _ := privateMsg.ToWarpMessage(networkID)
```

### Decrypting a Private Message

```go
// On recipient side
if teleportMsg.Encrypted {
    plaintext, err := teleportMsg.DecryptPayload(myMLKEMPrivateKey)
    if err != nil {
        return err
    }
    // plaintext contains the original payload
}
```

---

## Security Considerations

### Threat Model

| Adversary | BLS | Ringtail | ML-KEM |
|-----------|-----|----------|--------|
| Classical | ✅ Safe | ✅ Safe | ✅ Safe |
| Quantum | ❌ Broken | ✅ Safe | ✅ Safe |

### Key Management

- Validators MUST secure both BLS and Ringtail private keys
- HSM storage recommended for production
- Key rotation via LSS resharing protocol ([LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md))

### Upgrade Security

- Transition period allows fallback to BLS
- Hybrid mode provides belt-and-suspenders security
- Network upgrade coordinates cutoff timing

---

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

---

## Test Cases

### Running Tests

```bash
# Warp package tests (30+ tests)
cd ~/work/lux/node
go test -v ./vms/platformvm/warp/...

# BridgeVM integration tests
go test -v ./vms/bridgevm/...

# ThresholdVM integration tests
go test -v ./vms/thresholdvm/...
```

### Test Coverage

- `TestRingtailSignatureNumSigners` - Signer bitset encoding
- `TestRingtailSignatureVerify` - Signature verification
- `TestEncryptWarpPayload` - ML-KEM encryption
- `TestEncryptedPayloadRoundTrip` - Encrypt/decrypt cycle
- `TestTeleportMessageValidate` - Message validation
- `TestTeleportBridgeIntegration` - End-to-end bridge flow

---

## Reference Implementation

| Component | Repository | Path |
|-----------|------------|------|
| Warp 1.5 Core | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/platformvm/warp/` |
| Teleport Protocol | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/platformvm/warp/teleport.go` |
| Signature Types | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/platformvm/warp/signature.go` |
| BridgeVM | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/bridgevm/` |
| ThresholdVM | [github.com/luxfi/node](https://github.com/luxfi/node) | `vms/thresholdvm/` |
| Ringtail Crypto | [github.com/luxfi/threshold](https://github.com/luxfi/threshold) | `protocols/ringtail/` |

**Git Tag**: `warp/v1.5.0`

---

## FAQ

### Q: Do I need to upgrade immediately?

**A:** No. Warp 1.5 is backward compatible. BLS signatures continue to work. However, you should plan to migrate to Ringtail before Phase 3 (Q3 2025).

### Q: How much larger are Ringtail signatures?

**A:** About 30-50x larger than BLS (~3-5KB vs 96 bytes). This is the tradeoff for quantum safety. For most applications, this is acceptable.

### Q: Can I use encryption without Ringtail?

**A:** Yes. The ML-KEM encryption is independent of signature type. You can encrypt payloads with any signature type.

### Q: What if a validator's key is compromised?

**A:** Use LP-333's `bridge_replaceSigner` to remove the compromised validator and trigger a reshare. The compromised key cannot sign new messages after removal.

### Q: Is Ringtail NIST approved?

**A:** Ringtail is based on LWE, which is NIST-approved (ML-KEM/ML-DSA use similar assumptions). Ringtail specifically provides native threshold support not available in ML-DSA.

---

## Rationale

### Why Ringtail Over ML-DSA for Threshold Signatures?

ML-DSA (formerly Dilithium) is NIST-approved but was designed for single-signer scenarios. Converting ML-DSA to threshold form requires complex MPC protocols with significant overhead. Ringtail was purpose-built for threshold signing:

- **Native Threshold Support**: Ringtail's algebraic structure directly supports threshold operations without generic MPC protocols
- **Two-Round Protocol**: Only 2 communication rounds for distributed signing (vs. 5+ for generic threshold ML-DSA)
- **Same Security Foundation**: Based on Ring-LWE, sharing security assumptions with NIST-approved ML-KEM and ML-DSA

### Why Hybrid Mode?

The hybrid BLS+Ringtail approach provides:

1. **Immediate Classical Security**: BLS signatures provide proven security against classical adversaries
2. **Future Quantum Security**: Ringtail component provides protection against future quantum attacks
3. **Graceful Migration**: Validators can progressively upgrade to full quantum-safe mode
4. **Backwards Compatibility**: Classical clients can still verify the BLS component

### Why Not ML-KEM for Key Exchange?

ML-KEM is excellent for key encapsulation but Warp messages require digital signatures (authentication), not key exchange (confidentiality). Ringtail provides post-quantum signatures directly.

---

## Backwards Compatibility

- Warp 1.0 clients can verify BLS signatures (unchanged)
- Signature type indicated by codec type ID
- Unknown signature types rejected safely
- Upgrade path: BLS → Hybrid → Ringtail

---

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
