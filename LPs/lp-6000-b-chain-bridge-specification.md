---
lp: 6000
title: B-Chain - Core Bridge Specification
tags: [core, bridge, cross-chain, mpc, b-chain]
description: Core specification for the B-Chain (Bridge Chain), Lux Network's dedicated cross-chain bridge infrastructure
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-11
requires: [0, 99, 83]
supersedes: 81
---

## Abstract

LP-6000 specifies the B-Chain (Bridge Chain), Lux Network's dedicated blockchain for secure cross-chain asset transfers. The B-Chain implements MPC-based custody using CGGMP21 threshold signatures extended with Ringtail for quantum safety.

## Motivation

A dedicated bridge chain provides:

1. **Security**: Unified MPC custody for all bridges
2. **Quantum Safety**: Dual-signature with classical + PQ
3. **Centralized Management**: Single bridge infrastructure
4. **Resource Isolation**: Bridge operations isolated from other chains

## Specification

### Chain Parameters

| Parameter | Value |
|-----------|-------|
| Chain ID | `B` |
| VM ID | `bridgevm` |
| VM Name | `bridgevm` |
| Block Time | 2 seconds |
| Consensus | Quasar |

### Implementation

**Go Package**: `github.com/luxfi/node/vms/bridgevm`

```go
import (
    bvm "github.com/luxfi/node/vms/bridgevm"
    "github.com/luxfi/node/utils/constants"
)

// VM ID constant
var BridgeVMID = constants.BridgeVMID // ids.ID{'b', 'r', 'i', 'd', 'g', 'e', 'v', 'm'}

// Create B-Chain VM
factory := &bvm.Factory{}
vm, err := factory.New(logger)
```

### Directory Structure

```
node/vms/bridgevm/
├── config/           # Chain configuration
├── custody/          # MPC custody layer
├── protocols/        # Bridge protocols
├── registry/         # Asset registry
├── warp/             # Warp messaging
├── factory.go        # VM factory
├── vm.go             # Main VM implementation
└── *_test.go         # Tests
```

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    B-Chain Architecture                  │
├─────────────────────────┬───────────────────────────────┤
│   External Chains       │        B-Chain Core           │
├─────────────────────────┼───────────────────────────────┤
│ • Ethereum              │ • MPC Custody (CGGMP21)       │
│ • Bitcoin               │ • Ringtail Quantum Extension  │
│ • BSC                   │ • Asset Registry              │
│ • Polygon               │ • Threshold Signing           │
│ • Arbitrum              │ • Bridge State Machine        │
│ • Cosmos                │ • Slashing & Rewards          │
└─────────────────────────┴───────────────────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │     Lux Internal Chains   │
                     │  (P, C, X, Q, A, T, Z)    │
                     └───────────────────────────┘
```

### Core Components

#### 1. Bridge Validator

```go
type BridgeValidator struct {
    NodeID       ids.NodeID
    ClassicalKey *ecdsa.PublicKey  // CGGMP21 key share
    QuantumKey   *ringtail.PublicKey // Ringtail key share
    Stake        uint64
    Reputation   uint32
}

type CustodyGroup struct {
    Validators      []BridgeValidator
    Threshold       uint32  // t-of-n threshold
    ClassicalPubKey *ecdsa.PublicKey
    QuantumPubKey   *ringtail.PublicKey
}
```

#### 2. Dual-Signature Operations

```solidity
interface IBridgeChain {
    struct BridgeRequest {
        uint256 nonce;
        address sourceChain;
        address destChain;
        address asset;
        uint256 amount;
        address recipient;
        bytes metadata;
    }

    struct DualSignature {
        bytes cgg21Sig;      // Classical threshold signature
        bytes ringtailSig;   // Quantum-safe threshold signature
    }

    function initiateBridge(BridgeRequest calldata request) external payable;
    function completeBridge(BridgeRequest calldata request, DualSignature calldata sig) external;
    function verifyDualSignature(bytes32 messageHash, DualSignature calldata sig) external view returns (bool);
}
```

### Quantum-Safe Extension

B-Chain implements a dual-signature scheme during quantum transition:

1. **Phase 1 (Current)**: CGGMP21 ECDSA only
2. **Phase 2 (Transition)**: Both CGGMP21 and Ringtail required
3. **Phase 3 (Post-Quantum)**: Ringtail only

```go
func (b *Bridge) Sign(request BridgeRequest) (*DualSignature, error) {
    phase := b.GetQuantumPhase()
    sig := &DualSignature{}

    if phase >= Phase1 {
        sig.CGG21Sig = b.signCGG21(request)
    }
    if phase >= Phase2 {
        sig.RingtailSig = b.signRingtail(request)
    }

    return sig, nil
}
```

### Transaction Types

| Type | Description |
|------|-------------|
| `InitiateBridge` | Start cross-chain transfer |
| `CompleteBridge` | Complete transfer with signatures |
| `RegisterAsset` | Register bridgeable asset |
| `UpdateValidator` | Update bridge validator |
| `RotateKeys` | Rotate custody keys |
| `EmergencyPause` | Pause bridge operations |

### Asset Flow

#### Inbound (External → Lux)

```
User → Lock on External Chain
     → Event emission
     → B-Chain MPC validation
     → Dual signature generation
     → Mint wrapped asset on target Lux chain
     → User receives asset
```

#### Outbound (Lux → External)

```
User → Burn wrapped asset on Lux chain
     → B-Chain receives burn proof
     → MPC signature generation
     → Submit release tx to external chain
     → User receives native asset
```

### Supported External Chains

| Chain | Protocol | Status |
|-------|----------|--------|
| Ethereum | EVM Bridge | Active |
| Bitcoin | HTLC | Active |
| BSC | EVM Bridge | Active |
| Polygon | EVM Bridge | Active |
| Arbitrum | EVM Bridge | Active |
| Cosmos | IBC | Active |
| Solana | SPL Bridge | Planned |

### Consensus Parameters

```go
var DefaultBridgeParams = Parameters{
    MinValidators:     21,
    MaxValidators:     100,
    SigningThreshold:  67,   // 67% for signing
    SecurityThreshold: 75,   // 75% for security actions
    ObservationPeriod: 30 * time.Second,
    SigningTimeout:    60 * time.Second,
    MinStake:          100_000 * units.LUX,
    BridgeFeeRate:     30,   // 0.3% in basis points
}
```

### Warp Messaging Integration

```go
type WarpMessage struct {
    SourceChainID ids.ID
    DestChainID   ids.ID
    Payload       []byte
    Signatures    []Signature
}

func (b *Bridge) SendWarpMessage(dest ids.ID, payload []byte) error {
    msg := &WarpMessage{
        SourceChainID: b.ChainID(),
        DestChainID:   dest,
        Payload:       payload,
    }
    return b.signAndBroadcast(msg)
}
```

### API Endpoints

#### RPC Methods

| Method | Description |
|--------|-------------|
| `bridge.initiate` | Initiate bridge transfer |
| `bridge.getStatus` | Get transfer status |
| `bridge.getAssets` | List bridgeable assets |
| `bridge.getValidators` | Get bridge validators |
| `bridge.getProof` | Get transfer proof |

#### REST Endpoints

```
POST /ext/bc/B/bridge/initiate
GET  /ext/bc/B/bridge/status/{txId}
GET  /ext/bc/B/bridge/assets
GET  /ext/bc/B/bridge/validators
POST /ext/bc/B/bridge/complete
```

### Configuration

```json
{
  "bridgevm": {
    "minValidators": 21,
    "signingThreshold": 67,
    "observationPeriod": "30s",
    "signingTimeout": "60s",
    "bridgeFeeRate": 30,
    "supportedChains": ["ethereum", "bitcoin", "bsc", "polygon"],
    "quantumPhase": 2,
    "warpEnabled": true
  }
}
```

### Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Bridge Initiate | 2s | One block |
| MPC Signing | 5s | Threshold coordination |
| Complete Transfer | 10s | Including external chain |
| Warp Message | 2s | Cross-chain Lux |

## Rationale

Design decisions for B-Chain:

1. **Dedicated Chain**: Resource isolation for bridge operations
2. **MPC Custody**: Trustless multi-party control
3. **Quantum Extension**: Future-proof security
4. **T-Chain Integration**: Leverages threshold infrastructure

## Backwards Compatibility

LP-6000 supersedes LP-0081. Both old and new numbers resolve to this document.

## Test Cases

See `github.com/luxfi/node/vms/bridgevm/*_test.go`:

```go
func TestBridgeInitiate(t *testing.T)
func TestDualSignature(t *testing.T)
func TestMPCCustody(t *testing.T)
func TestWarpIntegration(t *testing.T)
func TestQuantumPhaseTransition(t *testing.T)
```

## Reference Implementation

**Repository**: `github.com/luxfi/node`
**Package**: `vms/bridgevm`
**Dependencies**:
- `vms/bridgevm/custody`
- `vms/bridgevm/protocols`
- `vms/thresholdvm` (T-Chain integration)

## Security Considerations

1. **Threshold Security**: Requires t-of-n validators to sign
2. **Observation Period**: Prevents flash attacks
3. **Dual Signatures**: Classical + quantum during transition
4. **Emergency Pause**: Governance can halt operations

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0081 | B-Chain Specification | Superseded by this LP |
| LP-6100 | Warp Messaging | Sub-specification |
| LP-6200 | Asset Wrapping | Sub-specification |
| LP-6300 | Cross-Chain Transfers | Sub-specification |
| LP-6400 | External Chain Support | Sub-specification |
| LP-7000 | T-Chain | Provides threshold infrastructure |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
