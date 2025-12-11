---
lp: 0083
title: T-Chain - Threshold Signature Chain Specification
tags: [core, mpc, threshold, signatures, chain]
description: Specification for the T-Chain (Threshold VM) providing distributed key generation and threshold signatures for the Lux Network
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: [13, 14, 15, 81]
---

## Abstract

LP-0083 specifies the T-Chain (Threshold Signature Chain), a specialized blockchain providing Multi-Party Computation (MPC) services including distributed key generation (DKG), threshold signatures, and secure key management. The T-Chain implements CGGMP21 for ECDSA and FROST for Schnorr/BLS signatures, enabling trustless custody and cross-chain bridge security.

## Motivation

Centralized custody and single-point-of-failure key management pose significant security risks:

1. **Trustless Custody**: Distribute key control across multiple parties
2. **Bridge Security**: Enable MPC-secured cross-chain bridges
3. **Key Recovery**: Support threshold-based key recovery mechanisms
4. **Regulatory Compliance**: Meet institutional custody requirements

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `tchain` |
| VM ID | `thresholdvm` |
| VM Name | `thresholdvm` |
| Block Time | 2 seconds |
| Consensus | Quasar |

### Implementation

**Go Package**: `github.com/luxfi/node/vms/thresholdvm`

```go
import (
    tvm "github.com/luxfi/node/vms/thresholdvm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var ThresholdVMID = constants.ThresholdVMID // ids.ID{'t', 'h', 'r', 'e', 's', 'h', 'o', 'l', 'd', 'v', 'm'}

// Create T-Chain VM
factory := &tvm.Factory{}
vm, err := factory.New(logger)
```

### Directory Structure

```
node/vms/thresholdvm/
├── cggmp/            # CGGMP21 implementation
├── frost/            # FROST signatures
├── dkg/              # Distributed key generation
├── keygen/           # Key generation ceremonies
├── warp/             # Warp message integration
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
├── types.go          # Core types
└── *_test.go         # Tests
```

### Supported Protocols

#### CGGMP21 - Threshold ECDSA

UC-secure non-interactive threshold ECDSA based on [IACR 2021/060](https://eprint.iacr.org/2021/060):

```go
import "github.com/luxfi/node/vms/thresholdvm/cggmp"

// Initialize CGGMP session
session := cggmp.NewSession(threshold, totalParties)

// Distributed Key Generation
keyShare, err := session.DKG(partyID, otherParties)

// Sign message
partialSig, err := session.Sign(keyShare, message)

// Combine signatures
fullSig, err := session.CombineSignatures(partialSigs)
```

#### FROST - Threshold Schnorr/BLS

Flexible Round-Optimized Schnorr Threshold signatures:

```go
import "github.com/luxfi/node/vms/thresholdvm/frost"

// Initialize FROST session
session := frost.NewSession(threshold, totalParties)

// Key generation
keyShare, err := session.KeyGen(partyID)

// Sign with BLS
partialSig, err := session.SignBLS(keyShare, message)

// Sign with Schnorr
partialSig, err := session.SignSchnorr(keyShare, message)
```

#### Ringtail - Post-Quantum Threshold

Ring-based threshold signatures for quantum resistance:

```go
import "github.com/luxfi/node/vms/thresholdvm/ringtail"

// Initialize Ringtail session
session := ringtail.NewSession(threshold, totalParties)

// Quantum-safe threshold key generation
keyShare, err := session.KeyGen(partyID)

// Sign with post-quantum security
partialSig, err := session.Sign(keyShare, message)
```

### Key Management

#### Key Share Types

```go
type KeyShare struct {
    ID          ids.ID      `json:"id"`
    PartyID     uint32      `json:"partyId"`
    Threshold   uint32      `json:"threshold"`
    TotalParties uint32     `json:"totalParties"`
    PublicKey   []byte      `json:"publicKey"`
    SecretShare []byte      `json:"secretShare"`  // Encrypted
    Protocol    Protocol    `json:"protocol"`     // CGGMP21, FROST, Ringtail
}

type Protocol uint8

const (
    ProtocolCGGMP21 Protocol = iota
    ProtocolFROST
    ProtocolRingtail
)
```

#### Key Ceremonies

1. **DKG Ceremony**: Generate new threshold key
2. **Resharing**: Change threshold or add/remove parties
3. **Refresh**: Rotate shares without changing public key

### Transaction Types

| Type | Description |
|------|-------------|
| `InitDKG` | Initialize distributed key generation |
| `SubmitShare` | Submit key share commitment |
| `RevealShare` | Reveal key share |
| `RequestSignature` | Request threshold signature |
| `SubmitPartialSig` | Submit partial signature |
| `RotateKey` | Initiate key rotation |
| `ReshareKey` | Change threshold parameters |

### Warp Message Integration

The T-Chain integrates with Lux Warp messaging for cross-chain operations:

```go
import "github.com/luxfi/node/vms/thresholdvm/warp"

// Create Warp message with threshold signature
warpMsg, err := warp.CreateMessage(
    sourceChainID,
    destChainID,
    payload,
)

// Sign with threshold key
signedMsg, err := tvm.ThresholdSignWarp(warpMsg, keyID)

// Verify threshold-signed Warp message
valid, err := tvm.VerifyThresholdWarp(signedMsg)
```

### Bridge Integration

The T-Chain provides MPC security for the B-Chain bridge:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   B-Chain   │────▶│   T-Chain   │────▶│  External   │
│  (Bridge)   │     │ (Threshold) │     │   Chain     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │   Lock Request    │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │   Threshold Sign  │
       │                   │──────────────────▶│
       │                   │                   │
       │   Signature OK    │                   │
       │◀──────────────────│                   │
```

### Configuration

```json
{
  "thresholdvm": {
    "defaultThreshold": 2,
    "defaultParties": 3,
    "defaultProtocol": "CGGMP21",
    "keyRotationInterval": "24h",
    "signatureTimeout": "30s",
    "maxPendingSignatures": 1000,
    "enableRingtail": true
  }
}
```

### API Endpoints

#### RPC Methods

| Method | Description |
|--------|-------------|
| `threshold.initDKG` | Start key generation ceremony |
| `threshold.getKeyInfo` | Get threshold key information |
| `threshold.requestSign` | Request threshold signature |
| `threshold.getSignature` | Get completed signature |
| `threshold.reshare` | Initiate key resharing |

#### REST Endpoints

```
POST /ext/bc/T/threshold/dkg/init
GET  /ext/bc/T/threshold/keys/{keyId}
POST /ext/bc/T/threshold/sign
GET  /ext/bc/T/threshold/signature/{sigId}
POST /ext/bc/T/threshold/reshare
```

### Security Model

#### Threshold Parameters

| Config | Threshold (t) | Parties (n) | Security |
|--------|--------------|-------------|----------|
| 2-of-3 | 2 | 3 | Basic |
| 3-of-5 | 3 | 5 | Standard |
| 5-of-9 | 5 | 9 | High |
| 7-of-11 | 7 | 11 | Enterprise |

#### Security Properties

1. **Unforgeability**: t parties required to sign
2. **Key Secrecy**: < t parties learn nothing about key
3. **Robustness**: Signing succeeds with any t honest parties
4. **Proactive Security**: Regular share refresh

### Performance

| Operation | Time | Notes |
|-----------|------|-------|
| DKG (3-of-5) | 500ms | One-time setup |
| CGGMP21 Sign | 100ms | Per signature |
| FROST Sign | 50ms | Per signature |
| Ringtail Sign | 200ms | Post-quantum |
| Warp Sign | 150ms | Including serialization |

## Rationale

Design decisions for T-Chain:

1. **Multiple Protocols**: Different use cases need different security/performance tradeoffs
2. **Warp Integration**: Native cross-chain messaging support
3. **Proactive Security**: Regular refresh prevents compromise accumulation
4. **Quantum Bridge**: Ringtail provides migration path to PQ security

## Backwards Compatibility

The T-Chain supersedes M-Chain MPC functionality from LP-0013/0014. Migration path:

1. M-Chain keys can be imported via resharing ceremony
2. Existing bridge integrations continue working
3. New deployments should use T-Chain directly

## Test Cases

See `github.com/luxfi/node/vms/thresholdvm/*_test.go`:

```go
func TestThresholdVMStats(t *testing.T)
func TestEncryptedWarpThroughThreshold(t *testing.T)
func TestRingtailProtocolForWarp(t *testing.T)
func TestWarpMessageHashForSigning(t *testing.T)
func TestThresholdConfigDefaults(t *testing.T)
func TestKeyShareInterface(t *testing.T)
func TestOperationTypes(t *testing.T)
func TestProtocolSelection(t *testing.T)
```

## Reference Implementation

**Repository**: `github.com/luxfi/node`
**Package**: `vms/thresholdvm`
**Dependencies**:
- `github.com/luxfi/node/vms/thresholdvm/cggmp`
- `github.com/luxfi/node/vms/thresholdvm/frost`
- `github.com/luxfi/node/vms/thresholdvm/ringtail`

## Security Considerations

1. **Share Storage**: Key shares must be encrypted at rest
2. **Communication Security**: All MPC communication over TLS 1.3
3. **Party Authentication**: Strong identity verification for ceremonies
4. **Timeout Handling**: Proper cleanup of incomplete ceremonies
5. **Audit Logging**: Full audit trail of all signing operations

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
