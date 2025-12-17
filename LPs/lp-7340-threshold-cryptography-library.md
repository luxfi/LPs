---
lp: 7340
title: Threshold Cryptography Library (github.com/luxfi/threshold)
description: Core Go library implementing LSS, CMP, FROST, Doerner, and Ringtail threshold cryptography protocols
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Core
created: 2025-12-17
requires: 7014, 7103, 7104
tags: [threshold-crypto, mpc, library]
---

## Abstract

This LP documents `github.com/luxfi/threshold`, the core Go library providing threshold cryptography implementations for the Lux Network. The library implements five threshold signature protocols: LSS (Linear Secret Sharing), CMP (CGGMP21), FROST, Doerner, and Ringtail (post-quantum). It serves as the cryptographic foundation for T-Chain (ThresholdVM), B-Chain (BridgeVM), and all MPC operations in the Lux ecosystem.

## Motivation

A dedicated, well-tested threshold cryptography library provides:

1. **Protocol Isolation**: Clean separation between VM logic and cryptographic implementations
2. **Reusability**: Same library used across T-Chain, B-Chain, SDK, and external integrations
3. **Auditability**: Concentrated cryptographic code for security audits
4. **Testability**: Comprehensive test coverage independent of VM complexity
5. **Performance**: Optimized implementations with worker pools for parallel computation

## Specification

### Package Structure

```text
github.com/luxfi/threshold/
├── protocols/
│   ├── cmp/           # CGGMP21 threshold ECDSA (LP-7014)
│   │   ├── cmp.go     # Entry: Keygen(), Sign(), Refresh(), Presign()
│   │   ├── config/    # Config struct and serialization
│   │   ├── keygen/    # 5-round DKG (round1-5.go)
│   │   ├── sign/      # 5-round signing
│   │   └── presign/   # 7-round presignature + abort handling
│   │
│   ├── frost/         # FROST threshold Schnorr (LP-7104)
│   │   ├── frost.go   # Entry: Keygen(), Sign()
│   │   ├── keygen/    # 3-round DKG
│   │   └── sign/      # 3-round signing
│   │
│   ├── lss/           # Linear Secret Sharing (LP-7103)
│   │   ├── lss.go     # Entry: Keygen(), Sign(), Refresh()
│   │   ├── config/    # Configuration types
│   │   ├── keygen/    # 3-round distributed keygen
│   │   ├── sign/      # Threshold signing
│   │   ├── reshare/   # Dynamic resharing
│   │   ├── dealer/    # Optional trusted dealer
│   │   ├── jvss/      # Joint Verifiable Secret Sharing
│   │   ├── coordinator/
│   │   └── adapters/  # Cross-protocol adapters
│   │
│   ├── doerner/       # DKLS/Doerner 2-party ECDSA
│   │   └── doerner.go
│   │
│   └── ringtail/      # Post-quantum lattice-based threshold
│       └── ringtail.go
│
├── pkg/
│   ├── party/         # Party identifiers and management
│   │   └── id.go      # party.ID type
│   │
│   ├── pool/          # Worker pool for parallel operations
│   │   └── pool.go    # pool.Pool type
│   │
│   ├── protocol/      # Protocol runner infrastructure
│   │   ├── handler.go # Handler interface
│   │   └── start.go   # StartFunc type
│   │
│   ├── math/
│   │   └── curve/     # Elliptic curve abstractions
│   │       └── curve.go # Secp256k1, Ed25519, etc.
│   │
│   ├── paillier/      # Paillier homomorphic encryption
│   │   └── paillier.go
│   │
│   └── zk/            # Zero-knowledge proofs
│       └── zk.go
│
└── cmd/               # CLI tools
    └── threshold/     # CLI for key operations
```

### Core Types

```go
package protocol

// StartFunc creates the first round of a protocol
type StartFunc func(sessionID []byte) (Round, error)

// Handler manages protocol execution
type Handler interface {
    // Result returns the protocol result (blocks until done)
    Result() (interface{}, error)

    // Listen returns channel that closes when done
    Listen() <-chan struct{}

    // CanAccept checks if a message can be accepted
    CanAccept(from party.ID, msgType string) bool

    // Accept processes an incoming message
    Accept(msg *Message) error
}

// Round represents one round of a multi-round protocol
type Round interface {
    // ProcessMessage handles incoming messages
    ProcessMessage(from party.ID, content []byte) error

    // Finalize completes the round and returns next round or result
    Finalize() (Round, interface{}, error)
}
```

```go
package party

// ID uniquely identifies a party in a threshold protocol
type ID string

// IDSlice is a sortable slice of party IDs
type IDSlice []ID
```

```go
package pool

// Pool manages goroutine workers for parallel operations
type Pool struct {
    workers int
}

// NewPool creates a worker pool (0 = runtime.NumCPU())
func NewPool(workers int) *Pool
```

### Protocol Entry Points

Each protocol provides consistent entry points:

```go
// LSS Protocol (protocols/lss/lss.go)
func Keygen(group curve.Curve, selfID party.ID, partyIDs []party.ID, threshold int, pl *pool.Pool) protocol.StartFunc
func Sign(config *lssconfig.Config, partyIDs []party.ID, message []byte) protocol.StartFunc
func Refresh(config *lssconfig.Config, pl *pool.Pool) protocol.StartFunc
func Reshare(config *lssconfig.Config, newPartyIDs []party.ID, newThreshold int) protocol.StartFunc

// CMP Protocol (protocols/cmp/cmp.go)
func Keygen(group curve.Curve, selfID party.ID, partyIDs []party.ID, threshold int, pl *pool.Pool) protocol.StartFunc
func Sign(config *cmpconfig.Config, partyIDs []party.ID, message []byte, pl *pool.Pool) protocol.StartFunc
func Refresh(config *cmpconfig.Config, pl *pool.Pool) protocol.StartFunc
func Presign(config *cmpconfig.Config, partyIDs []party.ID, pl *pool.Pool) protocol.StartFunc

// FROST Protocol (protocols/frost/frost.go)
func Keygen(group curve.Curve, selfID party.ID, partyIDs []party.ID, threshold int) protocol.StartFunc
func Sign(config *frostconfig.Config, partyIDs []party.ID, message []byte) protocol.StartFunc
```

### Supported Curves

```go
package curve

// Secp256k1 for Bitcoin/Ethereum ECDSA
type Secp256k1 struct{}

// Ed25519 for Solana/Cardano EdDSA
type Ed25519 struct{}

// BLS12_381 for BLS aggregate signatures
type BLS12_381 struct{}
```

### Usage Example

```go
import (
    "github.com/luxfi/threshold/pkg/math/curve"
    "github.com/luxfi/threshold/pkg/party"
    "github.com/luxfi/threshold/pkg/pool"
    "github.com/luxfi/threshold/pkg/protocol"
    "github.com/luxfi/threshold/protocols/lss"
)

// Create worker pool
pl := pool.NewPool(0) // Use all CPUs

// Define parties
selfID := party.ID("party1")
partyIDs := []party.ID{"party1", "party2", "party3", "party4", "party5"}
threshold := 3

// Create keygen StartFunc
startFunc := lss.Keygen(curve.Secp256k1{}, selfID, partyIDs, threshold, pl)

// Create handler with session ID
sessionID := []byte("keygen-session-1")
handler, err := protocol.NewMultiHandler(startFunc, sessionID)
if err != nil {
    return err
}

// Run protocol (exchange messages with other parties)
// ... message exchange loop ...

// Get result
result, err := handler.Result()
config := result.(*lssconfig.Config)

// Public key is available
pubKey := config.PublicPoint
```

## Test Coverage

The library maintains comprehensive test coverage:

| Protocol | Test Files | Coverage | Key Tests |
|----------|-----------|----------|-----------|
| CMP | 8 files | 98%+ | keygen, sign, presign, abort |
| FROST | 15+ files | 98%+ | keygen, sign, taproot, threshold |
| LSS | 12+ files | 100% | keygen, sign, reshare, refresh |
| Doerner | 2 files | 95%+ | 2-party ECDSA |

### Running Tests

```bash
# Test all protocols
go test ./protocols/... -v

# Test specific protocol
go test ./protocols/cmp/... -v
go test ./protocols/frost/... -v
go test ./protocols/lss/... -v

# Run benchmarks
go test ./protocols/... -bench=. -benchmem

# Quick smoke test
go test ./protocols/cmp -run Quick -v
```

### Performance Benchmarks (Apple M1 Max)

| Operation | CMP | FROST | LSS |
|-----------|-----|-------|-----|
| Keygen (3-of-5) | ~1.5s | ~50ms | ~100ms |
| Sign (3-of-5) | ~280ms | ~20ms | ~50ms |
| Verify | ~2ms | ~2ms | ~2ms |
| Refresh | ~600ms | N/A | ~200ms |

## Integration Points

### ThresholdVM Integration

The library is integrated into T-Chain via `executor.go`:

```go
// node/vms/thresholdvm/executor.go
type ProtocolExecutor struct {
    pool *pool.Pool
}

func (pe *ProtocolExecutor) LSSKeygenStartFunc(...) protocol.StartFunc {
    return lss.Keygen(curve.Secp256k1{}, selfID, participants, threshold, pe.pool)
}

func (pe *ProtocolExecutor) CMPKeygenStartFunc(...) protocol.StartFunc {
    return cmp.Keygen(curve.Secp256k1{}, selfID, participants, threshold, pe.pool)
}

func (pe *ProtocolExecutor) FROSTKeygenStartFunc(...) protocol.StartFunc {
    return frost.Keygen(curve.Secp256k1{}, selfID, participants, threshold)
}
```

### TypeScript SDK

The library is exposed via TypeScript SDK at `@luxfi/threshold` (see LP-7341).

## Security Considerations

1. **Memory Safety**: Shares are zeroed after use where possible
2. **Side Channels**: Constant-time operations for sensitive computations
3. **Randomness**: Uses cryptographically secure RNG from Go's crypto/rand
4. **Validation**: All inputs validated before processing
5. **Abort Handling**: Identifiable abort for Byzantine detection

## Related LPs

- **LP-7014**: CMP/CGGMP21 Protocol Specification
- **LP-7103**: LSS Protocol Specification
- **LP-7104**: FROST Protocol Specification
- **LP-7330**: T-Chain ThresholdVM Specification
- **LP-7341**: @luxfi/threshold TypeScript SDK

## References

1. Canetti, R., et al. (2021). **UC Non-Interactive, Proactive, Threshold ECDSA**. ePrint 2021/060.
2. Komlo, C., & Goldberg, I. (2020). **FROST: Flexible Round-Optimized Schnorr Threshold Signatures**. SAC 2020.
3. Shamir, A. (1979). **How to Share a Secret**. Communications of the ACM.
4. Doerner, J., et al. (2019). **Threshold ECDSA from ECDSA Assumptions**. IEEE S&P 2019.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
